import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { Conversation } from '@ai-chat/shared'
import * as db from '../db'

type ConversationInput = Partial<Conversation> & Pick<Conversation, 'characterId'>

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Conversation[]>([])
  const currentConversation = ref<Conversation | null>(null)
  const loading = ref(false)

  const sortedConversations = computed(() => {
    return [...conversations.value].sort((a, b) => {
      const aTime = a.lastMessageAt || a.updatedAt
      const bTime = b.lastMessageAt || b.updatedAt
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
  })

  const conversationsByCharacter = computed(() => {
    const groups: Record<string, Conversation[]> = {}
    for (const conv of sortedConversations.value) {
      if (!groups[conv.characterId]) {
        groups[conv.characterId] = []
      }
      groups[conv.characterId].push(conv)
    }
    return groups
  })

  async function loadConversations() {
    loading.value = true
    try {
      conversations.value = await db.getAllConversations()
    } catch (err) {
      console.error('Failed to load conversations:', err)
      conversations.value = []
    } finally {
      loading.value = false
    }
  }

  async function getConversation(id: string): Promise<Conversation | undefined> {
    const found = conversations.value.find((c) => c.id === id)
    if (found) return found
    return await db.getConversationById(id)
  }

  function setCurrentConversation(conversation: Conversation | null) {
    currentConversation.value = conversation
  }

  function selectConversation(id: string): Conversation | undefined {
    const conversation = conversations.value.find((c) => c.id === id)
    if (conversation) {
      currentConversation.value = conversation
    }
    return conversation
  }

  function createConversation(characterId: string, title?: string): Conversation {
    const now = new Date().toISOString()
    const conversation: Conversation = {
      id: uuidv4(),
      characterId,
      title: title || '新对话',
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    }
    return conversation
  }

  async function addConversation(input: ConversationInput): Promise<Conversation> {
    const now = new Date().toISOString()
    const conversation: Conversation = {
      id: input.id || uuidv4(),
      characterId: input.characterId,
      title: input.title || '新对话',
      summary: input.summary,
      createdAt: input.createdAt || now,
      updatedAt: input.updatedAt || now,
      lastMessageAt: input.lastMessageAt || now,
    }

    await db.saveConversation(conversation)

    const index = conversations.value.findIndex((c) => c.id === conversation.id)
    if (index >= 0) {
      conversations.value[index] = conversation
    } else {
      conversations.value.unshift(conversation)
    }

    currentConversation.value = conversation
    return conversation
  }

  async function updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    const conv = conversations.value.find((c) => c.id === id)
    if (!conv) return

    Object.assign(conv, updates, { updatedAt: new Date().toISOString() })
    await db.saveConversation(conv)

    if (currentConversation.value?.id === id) {
      currentConversation.value = conv
    }
  }

  async function deleteConversation(id: string): Promise<void> {
    await db.deleteConversation(id)
    conversations.value = conversations.value.filter((c) => c.id !== id)

    if (currentConversation.value?.id === id) {
      currentConversation.value = null
    }
  }

  async function clearConversations(): Promise<void> {
    const storedConversations = conversations.value.length > 0
      ? conversations.value
      : await db.getAllConversations()

    for (const conversation of storedConversations) {
      await db.deleteConversation(conversation.id)
    }

    conversations.value = []
    currentConversation.value = null
  }

  async function touchConversation(id: string): Promise<void> {
    const conv = conversations.value.find((c) => c.id === id)
    if (!conv) return

    conv.lastMessageAt = new Date().toISOString()
    conv.updatedAt = new Date().toISOString()
    await db.saveConversation(conv)
  }

  return {
    conversations,
    currentConversation,
    loading,
    sortedConversations,
    conversationsByCharacter,
    loadConversations,
    getConversation,
    setCurrentConversation,
    selectConversation,
    createConversation,
    addConversation,
    updateConversation,
    deleteConversation,
    clearConversations,
    touchConversation,
  }
})
