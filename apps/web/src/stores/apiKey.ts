import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storageKeys } from '../local-data/storageKeys'

export const useApiKeyStore = defineStore('apiKey', () => {
  const apiKey = ref('')
  const remember = ref(false)
  const lastValidatedAt = ref<string | undefined>(undefined)
  const validating = ref(false)
  const validationError = ref('')
  const error = ref('')

  const maskedKey = computed(() => {
    if (!apiKey.value) return ''
    const key = apiKey.value
    if (key.length <= 8) return '****'
    return key.slice(0, 4) + '****' + key.slice(-4)
  })

  const hasKey = computed(() => apiKey.value.length > 0)

  function loadFromStorage() {
    const saved = localStorage.getItem(storageKeys.apiKey)
    const remembered = localStorage.getItem(storageKeys.apiKeyRemember)
    const validated = localStorage.getItem(storageKeys.apiKeyLastValidated)

    if (remembered === 'true' && saved) {
      apiKey.value = saved
      remember.value = true
    }
    if (validated) {
      lastValidatedAt.value = validated
    }
  }

  function saveToStorage() {
    if (remember.value && apiKey.value) {
      localStorage.setItem(storageKeys.apiKey, apiKey.value)
      localStorage.setItem(storageKeys.apiKeyRemember, 'true')
    } else {
      localStorage.removeItem(storageKeys.apiKey)
      localStorage.setItem(storageKeys.apiKeyRemember, 'false')
    }
    if (lastValidatedAt.value) {
      localStorage.setItem(storageKeys.apiKeyLastValidated, lastValidatedAt.value)
    }
  }

  async function validateKey(): Promise<boolean> {
    if (!apiKey.value) {
      validationError.value = '请输入 API Key'
      return false
    }

    validating.value = true
    validationError.value = ''

    try {
      const response = await fetch('/api/keys/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.value }),
      })

      const data = await response.json()

      if (data.ok) {
        lastValidatedAt.value = new Date().toISOString()
        saveToStorage()
        return true
      } else {
        validationError.value = data.message || '验证失败'
        return false
      }
    } catch (err: any) {
      validationError.value = err.message || '网络错误'
      return false
    } finally {
      validating.value = false
    }
  }

  function clearKey() {
    apiKey.value = ''
    remember.value = false
    lastValidatedAt.value = undefined
    validationError.value = ''
    error.value = ''
    localStorage.removeItem(storageKeys.apiKey)
    localStorage.removeItem(storageKeys.apiKeyRemember)
    localStorage.removeItem(storageKeys.apiKeyLastValidated)
  }

  function setKey(key: string) {
    apiKey.value = key
    error.value = ''
  }

  /** Save key + maskedKey from settings page. Sets remember=true and saves to localStorage. */
  function saveKey(key: string, masked?: string) {
    apiKey.value = key
    remember.value = true
    lastValidatedAt.value = new Date().toISOString()
    saveToStorage()
  }

  // Load on init
  loadFromStorage()

  return {
    apiKey,
    remember,
    lastValidatedAt,
    validating,
    validationError,
    error,
    maskedKey,
    hasKey,
    loadFromStorage,
    saveToStorage,
    validateKey,
    clearKey,
    setKey,
    saveKey,
  }
})
