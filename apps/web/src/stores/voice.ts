import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  isMediaRecorderSupported,
  VoiceRecognizer,
  VoiceRecorder,
  speakText as speakTextUtil,
  stopSpeaking,
  blobToDataURL,
} from '../utils/voice'
import type { TTSConfig } from '@ai-chat/shared'

function sanitizeTextForSpeech(text: string): string {
  return text
    .replace(/[（(【\[][^（）()[\]【】]{1,80}[）)】\]]/g, '')
    .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '')
    .replace(/[\uFE0E\uFE0F]/g, '')
    .replace(/[\u200D]/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[~～]{2,}/g, '。')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function localNumber(key: string, fallback: number): number {
  const value = Number(localStorage.getItem(key))
  return Number.isFinite(value) ? value : fallback
}

function resolveTTSConfig(roleConfig?: TTSConfig): TTSConfig {
  const globalConfig: TTSConfig = {
    provider: (localStorage.getItem('ttsProvider') as TTSConfig['provider']) || 'browser',
    edgeVoice: localStorage.getItem('edgeTtsVoice') || 'zh-CN-XiaoxiaoNeural',
    edgeRate: localStorage.getItem('edgeTtsRate') || '+0%',
    edgePitch: localStorage.getItem('edgeTtsPitch') || '+0Hz',
    edgeVolume: localStorage.getItem('edgeTtsVolume') || '+0%',
    elevenLabsApiKey: localStorage.getItem('elevenLabsApiKey') || '',
    elevenLabsVoiceId: localStorage.getItem('elevenLabsVoiceId') || 'JBFqnCBsd6RMkjVDRZzb',
    elevenLabsModelId: localStorage.getItem('elevenLabsModelId') || 'eleven_multilingual_v2',
    elevenLabsStability: localNumber('elevenLabsStability', 0.45),
    elevenLabsSimilarityBoost: localNumber('elevenLabsSimilarityBoost', 0.75),
    elevenLabsStyle: localNumber('elevenLabsStyle', 0.35),
    elevenLabsUseSpeakerBoost: localStorage.getItem('elevenLabsUseSpeakerBoost') !== 'false',
    browserRate: localNumber('browserTtsRate', 0.96),
    browserPitch: localNumber('browserTtsPitch', 1.06),
  }

  if (!roleConfig) {
    return globalConfig
  }

  return {
    ...globalConfig,
    ...roleConfig,
    provider: roleConfig.provider || globalConfig.provider,
  }
}

function waitForSpeechRecognitionResult(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 350))
}

function normalizeSTTProvider(value: string | null): 'browser' | 'faster-whisper' {
  return value === 'browser' || value === 'faster-whisper' ? value : 'faster-whisper'
}

export const useVoiceStore = defineStore('voice', () => {
  const isRecording = ref(false)
  const isPlaying = ref(false)
  const isSpeechLoading = ref(false)
  const isTranscribing = ref(false)
  const recordingDuration = ref(0)
  const transcriptionText = ref('')
  const lastTranscriptionError = ref('')
  const hasMicPermission = ref(false)
  const recordingState = ref<'idle' | 'recording' | 'sending'>('idle')

  const isSTTSupported = computed(() => isSpeechRecognitionSupported())
  const isTTSSupported = computed(() => isSpeechSynthesisSupported())
  const isRecorderSupported = computed(() => isMediaRecorderSupported())

  let recognizer: VoiceRecognizer | null = null
  let recorder: VoiceRecorder | null = null
  let durationTimer: ReturnType<typeof setInterval> | null = null
  let lastRecordingBlob: Blob | null = null
  let currentAudio: HTMLAudioElement | null = null
  let currentAudioUrl: string | null = null
  let speechAbortController: AbortController | null = null
  let speechRequestVersion = 0

  function checkMicPermission(): Promise<boolean> {
    return navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop())
        hasMicPermission.value = true
        return true
      })
      .catch(() => {
        hasMicPermission.value = false
        return false
      })
  }

  async function startRecording(): Promise<void> {
    if (isRecording.value) {
      throw new Error('Already recording')
    }

    cleanupRecordingTimer()
    recognizer = new VoiceRecognizer()
    recorder = new VoiceRecorder()
    lastRecordingBlob = null
    recordingDuration.value = 0
    transcriptionText.value = ''
    lastTranscriptionError.value = ''

    try {
      await recorder.start({
        onStop: (blob) => {
          lastRecordingBlob = blob
        },
        onError: (error) => {
          console.warn('Recorder error:', error)
        },
      })

      recognizer.start({
        lang: 'zh-CN',
        continuous: true,
        interimResults: true,
        onResult: (text) => {
          transcriptionText.value = text
        },
        onError: (error) => {
          console.warn('Recognition error:', error)
        },
      })

      isRecording.value = true
      recordingState.value = 'recording'
      durationTimer = setInterval(() => {
        recordingDuration.value += 1
      }, 1000)
    } catch (error) {
      resetRecordingState()
      throw error
    }
  }

  function stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!isRecording.value || !recorder) {
        resolve(null)
        return
      }

      recognizer?.stop()
      recorder.stop().then((blob) => {
        lastRecordingBlob = blob
        waitForSpeechRecognitionResult().then(() => {
          resetRecordingState()
          resolve(blob)
        })
      }).catch(() => {
        resetRecordingState()
        resolve(null)
      })
    })
  }

  function cancelRecording() {
    recognizer?.stop()
    if (recorder?.isActive()) {
      // Can't truly cancel MediaRecorder, but we can discard the blob
      recorder.stop().catch(() => {})
    }
    lastRecordingBlob = null
    transcriptionText.value = ''
    resetRecordingState()
  }

  function cleanupRecordingTimer() {
    if (durationTimer) {
      clearInterval(durationTimer)
      durationTimer = null
    }
  }

  function resetRecordingState() {
    cleanupRecordingTimer()
    isRecording.value = false
    recordingState.value = 'idle'
    recordingDuration.value = 0
    recognizer = null
    recorder = null
  }

  async function speak(text: string, roleConfig?: TTSConfig): Promise<void> {
    const spokenText = sanitizeTextForSpeech(text)

    if (!spokenText) {
      return
    }

    const config = resolveTTSConfig(roleConfig)

    stopPlayback()
    const requestVersion = ++speechRequestVersion
    const controller = new AbortController()
    speechAbortController = controller
    isSpeechLoading.value = true

    try {
      if (config.provider === 'elevenlabs') {
        await speakWithElevenLabs(spokenText, controller.signal, config).catch((error) => {
          if (controller.signal.aborted || !isCurrentSpeechRequest(requestVersion, controller)) return
          console.warn('ElevenLabs TTS failed, falling back to browser speech:', error)
          return speakWithBrowser(spokenText, config)
        })
        return
      }

      if (config.provider === 'edge') {
        await speakWithEdge(spokenText, controller.signal, config).catch((error) => {
          if (controller.signal.aborted || !isCurrentSpeechRequest(requestVersion, controller)) return
          console.warn('Edge TTS failed, falling back to browser speech:', error)
          return speakWithBrowser(spokenText, config)
        })
        return
      }

      await speakWithBrowser(spokenText, config)
    } finally {
      if (isCurrentSpeechRequest(requestVersion, controller)) {
        isSpeechLoading.value = false
        speechAbortController = null
      }
    }
  }

  function isCurrentSpeechRequest(requestVersion: number, controller: AbortController): boolean {
    return speechRequestVersion === requestVersion && speechAbortController === controller
  }

  async function speakWithEdge(text: string, signal: AbortSignal, config: TTSConfig): Promise<void> {
    const response = await fetch('/api/tts/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'edge',
        text,
        edgeVoice: config.edgeVoice || 'zh-CN-XiaoxiaoNeural',
        edgeRate: config.edgeRate || '+0%',
        edgePitch: config.edgePitch || '+0Hz',
        edgeVolume: config.edgeVolume || '+0%',
      }),
      signal,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Edge TTS request failed' }))
      throw new Error(error.message || 'Edge TTS request failed')
    }

    await playAudioBlob(await response.blob())
  }

  async function speakWithElevenLabs(text: string, signal: AbortSignal, config: TTSConfig): Promise<void> {
    const apiKey = config.elevenLabsApiKey || ''
    const voiceId = config.elevenLabsVoiceId || 'JBFqnCBsd6RMkjVDRZzb'
    const modelId = config.elevenLabsModelId || 'eleven_multilingual_v2'

    if (!apiKey) {
      throw new Error('ElevenLabs API Key is not configured')
    }

    const response = await fetch('/api/tts/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ElevenLabs-Api-Key': apiKey,
      },
      body: JSON.stringify({
        text,
        voiceId,
        modelId,
        stability: config.elevenLabsStability ?? 0.45,
        similarityBoost: config.elevenLabsSimilarityBoost ?? 0.75,
        style: config.elevenLabsStyle ?? 0.35,
        useSpeakerBoost: config.elevenLabsUseSpeakerBoost !== false,
      }),
      signal,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'TTS request failed' }))
      throw new Error(error.message || 'TTS request failed')
    }

    await playAudioBlob(await response.blob())
  }

  async function playAudioBlob(blob: Blob): Promise<void> {
    isSpeechLoading.value = false
    isPlaying.value = true
    currentAudioUrl = URL.createObjectURL(blob)
    currentAudio = new Audio(currentAudioUrl)

    await new Promise<void>((resolve, reject) => {
      if (!currentAudio) {
        reject(new Error('Audio element was not created'))
        return
      }

      currentAudio.onended = () => {
        cleanupAudio()
        isPlaying.value = false
        resolve()
      }
      currentAudio.onerror = () => {
        cleanupAudio()
        isPlaying.value = false
        reject(new Error('Audio playback failed'))
      }
      currentAudio.play().catch((error) => {
        cleanupAudio()
        isPlaying.value = false
        reject(error)
      })
    })
  }

  function speakWithBrowser(text: string, config: TTSConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      stopSpeaking()
      isSpeechLoading.value = false
      isPlaying.value = true

      speakTextUtil(text, {
        lang: 'zh-CN',
        rate: config.browserRate ?? 0.96,
        pitch: config.browserPitch ?? 1.06,
        onStart: () => {
          isPlaying.value = true
        },
        onEnd: () => {
          isPlaying.value = false
          resolve()
        },
        onError: (error: string) => {
          isPlaying.value = false
          reject(new Error(error))
        },
      })
    })
  }

  async function transcribeAudio(blob: Blob): Promise<string> {
    lastTranscriptionError.value = ''
    isTranscribing.value = true
    const browserTranscript = transcriptionText.value.trim()
    const provider = normalizeSTTProvider(localStorage.getItem('sttProvider'))

    try {
      if (provider !== 'faster-whisper') {
        if (!browserTranscript && !isSTTSupported.value) {
          lastTranscriptionError.value = '当前浏览器不支持语音识别，请切换到本地 faster-whisper'
        } else if (!browserTranscript) {
          lastTranscriptionError.value = '浏览器没有识别到文字，请切换到本地 faster-whisper'
        }
        return browserTranscript
      }

      const whisperTranscript = await transcribeWithLocalWhisper(blob)
      if (!whisperTranscript && !browserTranscript) {
        lastTranscriptionError.value = '本地 faster-whisper 没有识别到文字'
      }
      return whisperTranscript || browserTranscript
    } catch (error) {
      const message = error instanceof Error ? error.message : '本地 faster-whisper 请求失败'
      lastTranscriptionError.value = browserTranscript ? '' : message
      console.warn('Local faster-whisper STT failed, falling back to browser transcript:', error)
      return browserTranscript
    } finally {
      isTranscribing.value = false
    }
  }

  async function transcribeWithLocalWhisper(blob: Blob): Promise<string> {
    const response = await fetch('/api/stt/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'faster-whisper',
        audioDataUrl: await blobToDataURL(blob),
        model: localStorage.getItem('localWhisperModel') || 'base',
        language: localStorage.getItem('sttLanguage') || 'zh',
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '本地 faster-whisper 请求失败' }))
      throw new Error(error.message || '本地 faster-whisper 请求失败')
    }

    const data = await response.json() as { text?: string }
    return (data.text || '').trim()
  }

  function speakText(text: string, roleConfig?: TTSConfig): Promise<void> {
    return speak(text, roleConfig)
  }

  function stopPlayback() {
    speechRequestVersion += 1
    speechAbortController?.abort()
    speechAbortController = null
    stopSpeaking()
    cleanupAudio()
    isSpeechLoading.value = false
    isPlaying.value = false
  }

  function cleanupAudio() {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
      currentAudio = null
    }
    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl)
      currentAudioUrl = null
    }
  }

  function getRecordingBlob(): Blob | null {
    return lastRecordingBlob
  }

  async function getRecordingDataURL(): Promise<string | null> {
    if (!lastRecordingBlob) return null
    return await blobToDataURL(lastRecordingBlob)
  }

  function resetRecording() {
    lastRecordingBlob = null
    transcriptionText.value = ''
    recordingDuration.value = 0
  }

  return {
    isRecording,
    isPlaying,
    isSpeechLoading,
    isTranscribing,
    lastTranscriptionError,
    recordingDuration,
    transcriptionText,
    recordingState,
    isSTTSupported,
    isTTSSupported,
    isRecorderSupported,
    hasMicPermission,
    checkMicPermission,
    startRecording,
    stopRecording,
    cancelRecording,
    speak,
    speakText,
    transcribeAudio,
    stopPlayback,
    getRecordingBlob,
    getRecordingDataURL,
    resetRecording,
  }
})
