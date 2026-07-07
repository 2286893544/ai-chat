<template>
  <div class="chat-layout">
    <div class="chat-center">
      <!-- Chat header -->
      <div class="chat-header" v-if="conversationStore.currentConversation">
        <div class="chat-header-left">
          <button class="input-btn menu-btn" @click="sidebarOpen = true" v-if="isMobile">☰</button>
          <div class="chat-header-info">
            <span class="chat-header-name">{{ characterStore.currentCharacter?.name || 'AI 聊天' }}</span>
            <span class="chat-header-status" v-if="isStreaming">正在输入...</span>
          </div>
        </div>
        <div class="chat-header-actions">
          <button class="input-btn" @click="showMobilePanel = !showMobilePanel" v-if="isMobile" title="角色设置">⚙</button>
        </div>
      </div>

      <!-- Message list -->
      <MessageList
        ref="messageListRef"
        :messages="messageStore.messages"
        :is-streaming="isStreaming"
        :speech-message-id="speakingMessageId"
        :speech-state="speechState"
        @play-voice="handlePlayVoice"
        @stop-voice="handleStopVoice"
        @copy="handleCopy"
        @delete="handleDeleteMessage"
      />

      <!-- Chat input -->
      <div class="chat-input-area">
        <div v-if="apiKeyStore.error" class="error-banner">{{ apiKeyStore.error }}</div>
        <ChatInput
          :disabled="!apiKeyStore.apiKey"
          :is-streaming="isStreaming"
          :is-recording="voiceStore.isRecording"
          @send="handleSend"
          @stop="handleStop"
          @record-start="handleRecordStart"
          @record-end="handleRecordEnd"
          :placeholder="apiKeyStore.apiKey ? '输入消息...' : '请先在设置页面填写 API Key'"
        />
        <div v-if="!apiKeyStore.apiKey" class="input-hint">
          请先在
          <router-link to="/settings">设置</router-link>
          页面填写 DeepSeek API Key
        </div>
      </div>
    </div>

    <!-- Right panel - desktop -->
    <div class="chat-right-panel" v-if="!isMobile">
      <CharacterPanel
        :character="characterStore.currentCharacter"
        :conversation="conversationStore.currentConversation"
        :proactive-enabled="proactiveEnabled"
        :auto-speak-enabled="autoSpeakEnabled"
        @update-proactive="handleProactiveToggle"
        @update-auto-speak="handleAutoSpeakToggle"
        @edit-character="handleEditCharacter"
      />
    </div>

    <!-- Mobile side panel overlay -->
    <div v-if="showMobilePanel && isMobile" class="mobile-panel-overlay" @click="showMobilePanel = false">
      <div class="mobile-panel" @click.stop>
        <CharacterPanel
          :character="characterStore.currentCharacter"
          :conversation="conversationStore.currentConversation"
          :proactive-enabled="proactiveEnabled"
          :auto-speak-enabled="autoSpeakEnabled"
          @update-proactive="handleProactiveToggle"
          @update-auto-speak="handleAutoSpeakToggle"
          @edit-character="handleEditCharacter"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useApiKeyStore } from '../stores/apiKey'
import { useCharacterStore } from '../stores/character'
import { useConversationStore } from '../stores/conversation'
import { useMessageStore } from '../stores/message'
import { useVoiceStore } from '../stores/voice'
import MessageList from '../components/MessageList.vue'
import ChatInput from '../components/ChatInput.vue'
import CharacterPanel from '../components/CharacterPanel.vue'
import type { Message } from '@ai-chat/shared'

const router = useRouter()
const apiKeyStore = useApiKeyStore()
const characterStore = useCharacterStore()
const conversationStore = useConversationStore()
const messageStore = useMessageStore()
const voiceStore = useVoiceStore()

const messageListRef = ref()
const sidebarOpen = ref(false)
const showMobilePanel = ref(false)
const isStreaming = ref(false)
const isMobile = ref(window.innerWidth <= 768)
const lastUserActive = ref(Date.now())
const autoSpeakEnabled = ref(localStorage.getItem('autoSpeakEnabled') === 'true')
const speakingMessageId = ref<string | null>(null)
const stopRequested = ref(false)

let proactiveInterval: number | null = null
let proactiveChecking = false

const currentCharacter = computed(() => characterStore.currentCharacter)
const proactiveEnabled = computed(() => characterStore.currentCharacter?.proactive?.enabled ?? false)
const speechState = computed<'idle' | 'loading' | 'playing'>(() => {
  if (voiceStore.isSpeechLoading) return 'loading'
  if (voiceStore.isPlaying) return 'playing'
  return 'idle'
})

onMounted(async () => {
  await characterStore.loadCharacters()
  await conversationStore.loadConversations()

  // If no character exists, create default
  if (characterStore.characters.length === 0) {
    await characterStore.addCharacter({
      name: '小夏',
      background: '温柔体贴的日常聊天伙伴',
      relationship: '朋友',
      personalityTags: ['温柔', '活泼'],
      tone: '温柔',
      speakingStyle: '俏皮',
      replyLength: 'medium',
      emojiLevel: 'medium'
    })
  }

  // If no conversation, create one
  if (conversationStore.conversations.length === 0 && characterStore.currentCharacter) {
    await conversationStore.addConversation({
      characterId: characterStore.currentCharacter.id,
      title: `和 ${characterStore.currentCharacter.name} 的对话`
    })
  }

  // Select first conversation
  if (!conversationStore.currentConversation && conversationStore.conversations.length > 0) {
    conversationStore.selectConversation(conversationStore.conversations[0].id)
  }

  // Load messages for current conversation
  if (conversationStore.currentConversation) {
    await messageStore.loadMessages(conversationStore.currentConversation.id)
    syncLastUserActiveFromMessages()
  }

  window.addEventListener('resize', handleResize)
  startProactivePoll()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (proactiveInterval) clearInterval(proactiveInterval)
})

watch(() => conversationStore.currentConversation?.id, async (newId) => {
  if (newId) {
    await messageStore.loadMessages(newId)
    syncLastUserActiveFromMessages()
  }
})

async function handleSend(text: string) {
  if (!text.trim() || !conversationStore.currentConversation || !characterStore.currentCharacter) return

  lastUserActive.value = Date.now()

  const userMessage = await messageStore.addMessage({
    conversationId: conversationStore.currentConversation.id,
    role: 'user',
    type: 'text',
    content: text,
    status: 'done'
  })

  await nextTick()

  await requestAssistantReply(text, userMessage.id)
}

async function requestAssistantReply(input: string, currentUserMessageId: string) {
  if (!input.trim() || !conversationStore.currentConversation || !characterStore.currentCharacter) return

  // Start streaming
  isStreaming.value = true
  stopRequested.value = false
  const assistantMessage = await messageStore.addMessage({
    conversationId: conversationStore.currentConversation.id,
    role: 'assistant',
    type: 'text',
    content: '',
    status: 'streaming'
  })

  let streamedContent = ''
  try {
    const recentMessages = messageStore.messages
      .filter(m => m.id !== currentUserMessageId && (m.status === 'done' || m.status === 'streaming'))
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }))

    const character = characterStore.currentCharacter

    await messageStore.sendStream({
      apiKey: apiKeyStore.apiKey!,
      conversationId: conversationStore.currentConversation.id,
      character: {
        id: character.id,
        name: character.name,
        background: character.background,
        relationship: character.relationship,
        personalityTags: character.personalityTags,
        temperTags: character.temperTags,
        hobbies: character.hobbies,
        expertise: character.expertise,
        forbiddenTopics: character.forbiddenTopics,
        preferredTopics: character.preferredTopics,
        tone: character.tone,
        speakingStyle: character.speakingStyle,
        catchphrases: character.catchphrases || [],
        replyLength: character.replyLength,
        emojiLevel: character.emojiLevel,
        userNickname: character.userNickname,
        safety: character.safety,
        proactive: character.proactive,
      },
      messages: recentMessages,
      input,
      model: localStorage.getItem('defaultModel') || 'deepseek-v4-flash'
    }, (delta) => {
      streamedContent += delta
      messageStore.updateMessage(assistantMessage.id, { content: streamedContent }).catch(() => {})
    })

    await messageStore.updateMessage(assistantMessage.id, {
      content: streamedContent,
      status: 'done'
    })
    await handleAutoSpeak(assistantMessage.id, streamedContent)
  } catch (err: any) {
    if (stopRequested.value && isStreamAbortError(err)) {
      if (streamedContent.trim()) {
        await messageStore.updateMessage(assistantMessage.id, {
          content: streamedContent,
          status: 'done'
        })
      } else {
        await messageStore.deleteMessage(assistantMessage.id)
      }
      return
    }

    await messageStore.updateMessage(assistantMessage.id, {
      content: `[错误] ${err.message || '请求失败'}`,
      status: 'failed',
      errorCode: 'NETWORK_ERROR'
    })
  } finally {
    await conversationStore.touchConversation(conversationStore.currentConversation.id)
    isStreaming.value = false
    stopRequested.value = false
  }
}

function isStreamAbortError(err: any) {
  const message = String(err?.message || err || '')
  return err?.name === 'AbortError' || /aborted|abort/i.test(message)
}

async function handleAutoSpeak(messageId: string, content: string) {
  if (!autoSpeakEnabled.value || !content.trim() || speechState.value !== 'idle') return

  speakingMessageId.value = messageId
  try {
    await voiceStore.speakText(content, characterStore.currentCharacter?.tts)
  } finally {
    speakingMessageId.value = null
  }
}

function handleStop() {
  // The fetch stream will be aborted by the store
  stopRequested.value = true
  messageStore.abortStream()
  isStreaming.value = false
}

async function handleRecordStart() {
  try {
    handleStopVoice()
    await voiceStore.startRecording()
  } catch (err: any) {
    apiKeyStore.error = err.message || '无法启动录音'
  }
}

async function handleRecordEnd() {
  try {
    if (!conversationStore.currentConversation || !characterStore.currentCharacter) return
    const durationMs = Math.max(1000, voiceStore.recordingDuration * 1000)
    const blob = await voiceStore.stopRecording()
    if (!blob) return

    const localUrl = await voiceStore.getRecordingDataURL()
    const voiceMessage = await messageStore.addMessage({
      conversationId: conversationStore.currentConversation.id,
      role: 'user',
      type: 'voice',
      content: '[语音消息]',
      voice: {
        localUrl: localUrl || URL.createObjectURL(blob),
        durationMs,
        mimeType: blob.type || 'audio/webm',
        transcriptionStatus: 'pending',
      },
      status: 'done',
    })

    lastUserActive.value = Date.now()
    await conversationStore.touchConversation(conversationStore.currentConversation.id)
    await nextTick()

    const transcript = await voiceStore.transcribeAudio(blob)
    await messageStore.updateMessage(voiceMessage.id, {
      content: transcript || '[语音消息]',
      voice: {
        ...voiceMessage.voice!,
        transcript: transcript || undefined,
        transcriptionError: voiceStore.lastTranscriptionError || undefined,
        transcriptionStatus: transcript ? 'done' : 'failed',
      },
    })

    if (transcript) {
      await requestAssistantReply(transcript, voiceMessage.id)
    }
  } catch (err: any) {
    apiKeyStore.error = err.message || '语音识别失败'
  }
}

async function handlePlayVoice(message: Message) {
  if (message.role !== 'assistant') return
  if (speechState.value !== 'idle') {
    handleStopVoice()
  }

  speakingMessageId.value = message.id
  try {
    await voiceStore.speakText(message.content, characterStore.currentCharacter?.tts)
  } finally {
    speakingMessageId.value = null
  }
}

function handleStopVoice() {
  voiceStore.stopPlayback()
  speakingMessageId.value = null
}

function handleCopy(content: string) {
  navigator.clipboard.writeText(content)
}

async function handleDeleteMessage(messageId: string) {
  await messageStore.deleteMessage(messageId)
}

async function handleProactiveToggle(enabled: boolean) {
  const char = characterStore.currentCharacter
  if (char) {
    await characterStore.updateCharacter(char.id, {
      proactive: {
        enabled,
        minIntervalMinutes: char.proactive?.minIntervalMinutes || 5,
        maxDailyCount: char.proactive?.maxDailyCount || 10,
        activeHours: char.proactive?.activeHours || { start: '09:00', end: '23:00' },
        initiativeLevel: char.proactive?.initiativeLevel || 'medium',
        topicSources: char.proactive?.topicSources || ['recent_context'],
        doNotDisturb: enabled ? false : (char.proactive?.doNotDisturb || false),
      },
    })
  }

  if (enabled) {
    startProactivePoll()
  } else if (proactiveInterval) {
    clearInterval(proactiveInterval)
    proactiveInterval = null
  }
}

function handleAutoSpeakToggle(enabled: boolean) {
  autoSpeakEnabled.value = enabled
  localStorage.setItem('autoSpeakEnabled', String(enabled))
}

function handleEditCharacter() {
  if (characterStore.currentCharacter) {
    router.push(`/characters/${characterStore.currentCharacter.id}/edit`)
  }
}

function handleResize() {
  isMobile.value = window.innerWidth <= 768
}

function syncLastUserActiveFromMessages() {
  const lastUserMessage = [...messageStore.messages]
    .reverse()
    .find((message) => message.role === 'user')

  if (lastUserMessage?.createdAt) {
    lastUserActive.value = new Date(lastUserMessage.createdAt).getTime()
  } else {
    lastUserActive.value = Date.now()
  }
}

function startProactivePoll() {
  if (proactiveInterval) return
  runProactiveTick()
  proactiveInterval = window.setInterval(runProactiveTick, 30000)
}

async function runProactiveTick() {
  if (proactiveChecking) return
  if (!proactiveEnabled.value || !conversationStore.currentConversation || !characterStore.currentCharacter) return
  if (!apiKeyStore.apiKey) return

  const idleMinutes = (Date.now() - lastUserActive.value) / 60000
  const char = characterStore.currentCharacter
  if (idleMinutes < (char.proactive?.minIntervalMinutes || 5)) return

  proactiveChecking = true
  try {
    const recentMessages = messageStore.messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
      type: m.type,
      createdAt: m.createdAt,
    }))

    const result = await messageStore.checkProactive({
      apiKey: apiKeyStore.apiKey,
      conversationId: conversationStore.currentConversation.id,
      character: {
        id: char.id,
        name: char.name,
        proactive: char.proactive || {
          enabled: true, minIntervalMinutes: 5, maxDailyCount: 10,
          activeHours: { start: '09:00', end: '23:00' },
          initiativeLevel: 'medium', topicSources: ['recent_context'],
          doNotDisturb: false
        },
        hobbies: char.hobbies,
        preferredTopics: char.preferredTopics,
        background: char.background
      },
      recentMessages,
      lastUserActiveAt: new Date(lastUserActive.value).toISOString()
    })

    if (result.shouldSend && result.message) {
      await messageStore.addMessage({
        conversationId: conversationStore.currentConversation.id,
        role: 'assistant',
        type: 'proactive',
        content: result.message.content,
        status: 'done'
      })
      lastUserActive.value = Date.now()
    }
  } catch {
    // Proactive poll failed silently
  } finally {
    proactiveChecking = false
  }
}
</script>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-header-name {
  font-weight: 600;
  font-size: 15px;
}

.chat-header-status {
  font-size: 12px;
  color: var(--accent);
  margin-left: 8px;
  animation: pulse-text 1.5s infinite;
}

@keyframes pulse-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.menu-btn {
  font-size: 20px;
}

.input-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}

.input-hint a {
  color: var(--accent);
}

.mobile-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 99;
}

.mobile-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 280px;
  background: var(--bg-secondary);
  overflow-y: auto;
}
</style>
