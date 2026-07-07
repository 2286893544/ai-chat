import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { Character } from '@ai-chat/shared'
import * as db from '../db'

type CharacterInput = Partial<Character> & Pick<Character, 'name'>

function createDefaultCharacter(overrides: Partial<Character> = {}): Character {
  const now = new Date().toISOString()
  const base: Character = {
    id: overrides.id || uuidv4(),
    name: '',
    gender: 'neutral',
    ageText: '',
    background: '',
    relationship: '朋友',
    personalityTags: [],
    temperTags: [],
    hobbies: [],
    expertise: [],
    forbiddenTopics: [],
    preferredTopics: [],
    tone: '温柔',
    speakingStyle: '轻松',
    catchphrases: [],
    replyLength: 'medium',
    emojiLevel: 'medium',
    userNickname: '你',
    proactive: {
      enabled: true,
      minIntervalMinutes: 10,
      maxDailyCount: 10,
      activeHours: { start: '09:00', end: '23:00' },
      initiativeLevel: 'medium',
      topicSources: ['recent_context', 'hobbies'],
      doNotDisturb: false,
    },
    safety: {
      followUpQuestions: true,
      rememberContext: true,
      avoidLongReplies: false,
      comfortOnLowMood: true,
      allowTeasing: true,
      allowFlirtyTone: false,
      safetyGuardrails: true,
    },
    createdAt: now,
    updatedAt: now,
  }

  return {
    ...base,
    ...overrides,
    id: overrides.id || base.id,
    createdAt: overrides.createdAt || base.createdAt,
    updatedAt: overrides.updatedAt || base.updatedAt,
    proactive: {
      ...base.proactive,
      ...overrides.proactive,
      activeHours: {
        start: overrides.proactive?.activeHours?.start || base.proactive.activeHours.start,
        end: overrides.proactive?.activeHours?.end || base.proactive.activeHours.end,
      },
    },
    safety: {
      ...base.safety,
      ...overrides.safety,
    },
  }
}

export const useCharacterStore = defineStore('character', () => {
  const characters = ref<Character[]>([])
  const currentCharacter = ref<Character | null>(null)
  const loading = ref(false)
  const editingCharacter = ref<Character | null>(null)

  const sortedCharacters = computed(() => {
    return [...characters.value].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  })

  async function loadCharacters() {
    loading.value = true
    try {
      characters.value = await db.getAllCharacters()
      if (!currentCharacter.value && characters.value.length > 0) {
        currentCharacter.value = sortedCharacters.value[0]
      }
    } catch (err) {
      console.error('Failed to load characters:', err)
      characters.value = []
    } finally {
      loading.value = false
    }
  }

  async function getCharacter(id: string): Promise<Character | undefined> {
    const found = characters.value.find((c) => c.id === id)
    if (found) return found
    return await db.getCharacterById(id)
  }

  function setCurrentCharacter(character: Character | null) {
    currentCharacter.value = character
  }

  function selectCharacter(id: string): Character | undefined {
    const character = characters.value.find((c) => c.id === id)
    if (character) {
      currentCharacter.value = character
    }
    return character
  }

  function createNewCharacter(): Character {
    const character = createDefaultCharacter()
    editingCharacter.value = { ...character }
    return character
  }

  function startEditCharacter(character: Character) {
    editingCharacter.value = { ...character }
  }

  function cancelEdit() {
    editingCharacter.value = null
  }

  async function saveCharacter(character: Character): Promise<void> {
    character.updatedAt = new Date().toISOString()
    if (!character.createdAt) {
      character.createdAt = character.updatedAt
    }

    await db.saveCharacter(character)

    const index = characters.value.findIndex((c) => c.id === character.id)
    if (index >= 0) {
      characters.value[index] = character
    } else {
      characters.value.push(character)
    }

    if (currentCharacter.value?.id === character.id) {
      currentCharacter.value = character
    }

    editingCharacter.value = null
  }

  async function addCharacter(input: CharacterInput): Promise<Character> {
    const character = createDefaultCharacter(input)
    await saveCharacter(character)
    currentCharacter.value = character
    return character
  }

  async function updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    const existing = characters.value.find((c) => c.id === id) || await db.getCharacterById(id)
    if (!existing) return undefined

    const character = createDefaultCharacter({
      ...existing,
      ...updates,
      id,
      createdAt: existing.createdAt,
      proactive: {
        ...existing.proactive,
        ...updates.proactive,
        activeHours: {
          start: updates.proactive?.activeHours?.start || existing.proactive.activeHours.start,
          end: updates.proactive?.activeHours?.end || existing.proactive.activeHours.end,
        },
      },
      safety: {
        ...existing.safety,
        ...updates.safety,
      },
    })

    await saveCharacter(character)
    currentCharacter.value = character
    return character
  }

  async function deleteCharacter(id: string): Promise<void> {
    await db.deleteCharacter(id)
    characters.value = characters.value.filter((c) => c.id !== id)

    if (currentCharacter.value?.id === id) {
      currentCharacter.value = null
    }
  }

  function getCurrentCharacter(): Character | null {
    return currentCharacter.value
  }

  return {
    characters,
    currentCharacter,
    editingCharacter,
    loading,
    sortedCharacters,
    loadCharacters,
    getCharacter,
    setCurrentCharacter,
    selectCharacter,
    createNewCharacter,
    startEditCharacter,
    cancelEdit,
    saveCharacter,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    getCurrentCharacter,
  }
})
