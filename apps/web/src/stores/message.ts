import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type {
  Message,
  MessageRole,
  MessageType,
  MessageStatus,
} from '@ai-chat/shared'
import * as db from '../db'
import { useApiKeyStore } from './apiKey'
import { useCharacterStore } from './character'
import { useConversationStore } from './conversation'
import { createSSEClient } from '../utils/sse'
import { defaultPreferences } from '../local-data/preferences'
import { storageKeys } from '../local-data/storageKeys'

type MessageInput = Omit<Message, 'id' | 'createdAt'> & Partial<Pick<Message, 'id' | 'createdAt'>>

export const useMessageStore = defineStore('message', () => {
  const messages = ref<Message[]>([])
  const loading = ref(false)
  const streaming = ref(false)
  const streamingMessageId = ref<string | null>(null)
  const streamingContent = ref('')
  const abortController = ref<AbortController | null>(null)

  const currentMessages = computed(() => {
    return [...messages.value].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  })

  const lastMessage = computed(() => {
    const msgs = currentMessages.value
    return msgs.length > 0 ? msgs[msgs.length - 1] : null
  })

  function getModelRequestConfig() {
    const rawProvider = localStorage.getItem(storageKeys.modelProvider) || defaultPreferences.modelProvider
    const provider = rawProvider === 'zhipu' ? 'zhipu' : 'deepseek'
    const providerDefault = defaultPreferences.providers[provider]

    return {
      provider,
      model: localStorage.getItem(storageKeys.defaultModel) || providerDefault.model,
      baseURL: localStorage.getItem(storageKeys.baseURL) || providerDefault.baseURL,
    }
  }

  async function loadMessages(conversationId: string) {
    loading.value = true
    try {
      messages.value = await db.getMessagesByConversationId(conversationId)
    } catch (err) {
      console.error('Failed to load messages:', err)
      messages.value = []
    } finally {
      loading.value = false
    }
  }

  async function addMessage(input: MessageInput): Promise<Message> {
    const message: Message = {
      ...input,
      id: input.id || uuidv4(),
      createdAt: input.createdAt || new Date().toISOString(),
    }

    messages.value.push(message)
    await db.saveMessage(message)
    return message
  }

  async function updateMessage(id: string, updates: Partial<Message>): Promise<void> {
    const msg = messages.value.find((m) => m.id === id)
    if (!msg) return

    Object.assign(msg, updates)
    await db.saveMessage(msg)
  }

  async function deleteMessage(id: string): Promise<void> {
    await db.deleteMessage(id)
    messages.value = messages.value.filter((m) => m.id !== id)
  }

  async function clearMessages(conversationId: string): Promise<void> {
    await db.deleteMessagesByConversationId(conversationId)
    messages.value = []
  }

  function createUserMessage(conversationId: string, content: string, type: MessageType = 'text', voicePayload?: any): Message {
    return {
      id: uuidv4(),
      conversationId,
      role: 'user',
      type,
      content,
      voice: voicePayload,
      status: 'done',
      createdAt: new Date().toISOString(),
    }
  }

  function createAssistantMessage(conversationId: string): Message {
    return {
      id: uuidv4(),
      conversationId,
      role: 'assistant',
      type: 'text',
      content: '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
  }

  async function sendMessage(text: string, conversationId: string, characterId: string) {
    const apiKeyStore = useApiKeyStore()
    const characterStore = useCharacterStore()
    const conversationStore = useConversationStore()

    if (!apiKeyStore.apiKey) {
      throw new Error('请先设置 API Key')
    }

    // Add user message
    const userMsg = createUserMessage(conversationId, text)
    await addMessage(userMsg)

    // Create assistant message placeholder
    const assistantMsg = createAssistantMessage(conversationId)
    await addMessage(assistantMsg)

    // Set streaming state
    streaming.value = true
    streamingMessageId.value = assistantMsg.id
    streamingContent.value = ''

    // Update assistant message status
    await updateMessage(assistantMsg.id, { status: 'streaming' })

    // Touch conversation
    await conversationStore.touchConversation(conversationId)

    // Get character for the request
    const character = characterStore.currentCharacter || await characterStore.getCharacter(characterId)
    if (!character) {
      await updateMessage(assistantMsg.id, { status: 'failed', content: '角色未找到' })
      streaming.value = false
      streamingMessageId.value = null
      return
    }

    // Format messages for the API
    const apiMessages = currentMessages.value
      .filter((m) => m.status === 'done' || m.id === assistantMsg.id)
      .filter((m) => m.id !== assistantMsg.id)
      .map((m) => ({
        role: m.role as MessageRole,
        content: m.content,
      }))

    // Send via SSE
    const sseClient = createSSEClient()

    const abortCtrl = new AbortController()
    abortController.value = abortCtrl

    let accumulatedContent = ''
    const modelConfig = getModelRequestConfig()

    sseClient.connect(
      {
        conversationId,
        character: {
          ...character,
        },
        messages: apiMessages,
        input: text,
        ...modelConfig,
        thinking: { type: 'disabled' },
      },
      apiKeyStore.apiKey,
      {
        onStart: (data) => {
          // SSE gives us a messageId - use it if different from ours
          if (data.messageId) {
            streamingMessageId.value = data.messageId
          }
        },
        onDelta: (data) => {
          accumulatedContent += data.delta
          streamingContent.value = accumulatedContent
          // Update content as it streams
          updateMessage(assistantMsg.id, { content: accumulatedContent }).catch(() => {})
        },
        onDone: (data) => {
          const finalContent = accumulatedContent || data.messageId || ''
          // Final save
          updateMessage(assistantMsg.id, {
            content: finalContent,
            status: 'done',
          }).catch(() => {})
          streaming.value = false
          streamingMessageId.value = null
          streamingContent.value = ''
          abortController.value = null
        },
        onError: (data) => {
          updateMessage(assistantMsg.id, {
            content: accumulatedContent || data.message,
            status: 'failed',
            errorCode: data.code,
          }).catch(() => {})
          streaming.value = false
          streamingMessageId.value = null
          streamingContent.value = ''
          abortController.value = null
        },
      }
    )
  }

  function stopGeneration() {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }

    if (streamingMessageId.value) {
      updateMessage(streamingMessageId.value, {
        content: streamingContent.value,
        status: 'cancelled',
      }).catch(() => {})
    }

    streaming.value = false
    streamingMessageId.value = null
    streamingContent.value = ''
  }

  function isStreaming(): boolean {
    return streaming.value
  }

  /** Send message with SSE stream — returns promise, calls onDelta callback */
  async function sendStream(
    request: {
      apiKey: string
      conversationId: string
      character: any
      messages: Array<{ role: string; content: string }>
      input: string
      model?: string
      provider?: string
      baseURL?: string
    },
    onDelta: (delta: string) => void,
  ): Promise<string> {
    const abortCtrl = new AbortController()
    abortController.value = abortCtrl
    const modelConfig = getModelRequestConfig()

    const response = await fetch('/api/chat/completions/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Model-Api-Key': request.apiKey,
      },
      body: JSON.stringify({
        conversationId: request.conversationId,
        character: request.character,
        messages: request.messages,
        input: request.input,
        provider: request.provider || modelConfig.provider,
        model: request.model || modelConfig.model,
        baseURL: request.baseURL || modelConfig.baseURL,
      }),
      signal: abortCtrl.signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(errorText || `HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('Response body not readable')

    const decoder = new TextDecoder()
    let buffer = ''
    let accumulatedContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        // Parse SSE format: "event: ..." / "data: ..."
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.delta) {
              accumulatedContent += parsed.delta
              onDelta(parsed.delta)
            }
            if (parsed.code && !parsed.delta) {
              throw new Error(parsed.message || 'Unknown error')
            }
          } catch (e: any) {
            if (e.message && e.message !== 'Unknown error') {
              throw e
            }
          }
        }
      }
    }

    abortController.value = null
    return accumulatedContent
  }

  /** Check proactive tick */
  async function checkProactive(
    request: {
      apiKey: string
      conversationId: string
      character: any
      recentMessages: Array<{ role: string; content: string; type?: string; createdAt?: string }>
      lastUserActiveAt: string
      model?: string
      provider?: string
      baseURL?: string
    }
  ): Promise<{ shouldSend: boolean; reason?: string; message?: any }> {
    const modelConfig = getModelRequestConfig()

    const response = await fetch('/api/proactive/tick', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Model-Api-Key': request.apiKey,
      },
      body: JSON.stringify({
        conversationId: request.conversationId,
        character: request.character,
        recentMessages: request.recentMessages,
        lastUserActiveAt: request.lastUserActiveAt,
        provider: request.provider || modelConfig.provider,
        model: request.model || modelConfig.model,
        baseURL: request.baseURL || modelConfig.baseURL,
      }),
    })

    if (!response.ok) {
      return { shouldSend: false }
    }

    return response.json()
  }

  /** Abort current stream */
  function abortStream() {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
  }

  return {
    messages,
    loading,
    streaming,
    streamingMessageId,
    streamingContent,
    currentMessages,
    lastMessage,
    abortController,
    loadMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
    createUserMessage,
    sendMessage,
    stopGeneration,
    isStreaming,
    sendStream,
    checkProactive,
    abortStream,
  }
})
