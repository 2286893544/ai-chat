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
import { normalizeLocalSTTErrorMessage } from '../utils/voiceError'
import type { TTSConfig } from '@ai-chat/shared'
import { useApiKeyStore } from './apiKey'
import { defaultPreferences } from '../local-data/preferences'
import { storageKeys } from '../local-data/storageKeys'

const STREAM_INITIAL_BUFFER_SECONDS = 0.45
const STREAM_SCHEDULE_LEAD_SECONDS = 0.03
const STREAM_PLAYBACK_GUARD_MS = 1200

const SPEECH_EMOTION_LABELS = [
  '开心', '高兴', '喜悦', '惊喜', '温柔', '轻柔', '平静', '严肃',
  '悲伤', '伤心', '难过', '担心', '忧虑', '紧张', '害怕', '疲惫',
  '疲倦', '激动', '兴奋', '生气', '愤怒',
].join('|')

function sanitizeTextForSpeech(text: string): string {
  return text
    .replace(new RegExp(`(^|[\n。！？!?])\\s*[（(【\\[]\\s*(?:${SPEECH_EMOTION_LABELS})(?:地)?\\s*[）)】\\]]\\s*[:：]?`, 'g'), '$1')
    .replace(new RegExp(`(^|\\n)\\s*(?:${SPEECH_EMOTION_LABELS})\\s*[:：]\\s*`, 'g'), '$1')
    .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '')
    .replace(/[\uFE0E\uFE0F]/g, '')
    .replace(/[\u200D]/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[~～]{2,}/g, '。')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function localNumber(key: string, fallback: number): number {
  const storedValue = localStorage.getItem(key)
  if (storedValue === null || storedValue.trim() === '') return fallback

  const value = Number(storedValue)
  return Number.isFinite(value) ? value : fallback
}

function resolveTTSConfig(roleConfig?: TTSConfig): TTSConfig {
  const globalConfig: TTSConfig = {
    provider: (localStorage.getItem('ttsProvider') as TTSConfig['provider']) || 'browser',
    edgeVoice: localStorage.getItem('edgeTtsVoice') || 'zh-CN-XiaoxiaoNeural',
    edgeRate: localStorage.getItem('edgeTtsRate') || '+0%',
    edgePitch: localStorage.getItem('edgeTtsPitch') || '+0Hz',
    edgeVolume: localStorage.getItem('edgeTtsVolume') || '+0%',
    edgeEmotionEnabled: localStorage.getItem(storageKeys.edgeTtsEmotionEnabled) === 'true',
    edgeEmotionStyle: (localStorage.getItem(storageKeys.edgeTtsEmotionStyle) as TTSConfig['edgeEmotionStyle']) || defaultPreferences.tts.edgeEmotionStyle,
    elevenLabsApiKey: localStorage.getItem('elevenLabsApiKey') || '',
    elevenLabsVoiceId: localStorage.getItem('elevenLabsVoiceId') || 'JBFqnCBsd6RMkjVDRZzb',
    elevenLabsModelId: localStorage.getItem('elevenLabsModelId') || 'eleven_multilingual_v2',
    elevenLabsStability: localNumber('elevenLabsStability', 0.45),
    elevenLabsSimilarityBoost: localNumber('elevenLabsSimilarityBoost', 0.75),
    elevenLabsStyle: localNumber('elevenLabsStyle', 0.35),
    elevenLabsUseSpeakerBoost: localStorage.getItem('elevenLabsUseSpeakerBoost') !== 'false',
    zhipuVoice: localStorage.getItem(storageKeys.zhipuTtsVoice) || defaultPreferences.tts.zhipuVoice,
    zhipuSpeed: localNumber(storageKeys.zhipuTtsSpeed, Number(defaultPreferences.tts.zhipuSpeed)),
    zhipuVolume: localNumber(storageKeys.zhipuTtsVolume, Number(defaultPreferences.tts.zhipuVolume)),
    zhipuEmotionEnabled: localStorage.getItem(storageKeys.zhipuTtsEmotionEnabled) === 'true',
    zhipuEmotionStyle: (localStorage.getItem(storageKeys.zhipuTtsEmotionStyle) as TTSConfig['zhipuEmotionStyle']) || defaultPreferences.tts.zhipuEmotionStyle,
    zhipuEmotionGranularity: (localStorage.getItem(storageKeys.zhipuTtsEmotionGranularity) as TTSConfig['zhipuEmotionGranularity']) || defaultPreferences.tts.zhipuEmotionGranularity,
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

type STTProvider = 'browser' | 'faster-whisper' | 'funasr'
type LocalSTTProvider = Exclude<STTProvider, 'browser'>

function normalizeSTTProvider(value: string | null): STTProvider {
  return value === 'browser' || value === 'faster-whisper' || value === 'funasr' ? value : 'faster-whisper'
}

function getLocalSTTLabel(provider: LocalSTTProvider): string {
  return provider === 'funasr' ? '本地 FunASR' : '本地 faster-whisper'
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
  let currentAudioContext: AudioContext | null = null
  let currentAudioSources: AudioBufferSourceNode[] = []
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

      if (config.provider === 'zhipu') {
        await speakWithZhipu(spokenText, controller.signal, config)
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
        edgeEmotionEnabled: config.edgeEmotionEnabled === true,
        edgeEmotionStyle: config.edgeEmotionStyle || defaultPreferences.tts.edgeEmotionStyle,
      }),
      signal,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Edge TTS request failed' }))
      throw new Error(error.message || 'Edge TTS request failed')
    }

    await playAudioBlob(await response.blob(), signal)
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

    await playAudioBlob(await response.blob(), signal)
  }

  async function speakWithZhipu(text: string, signal: AbortSignal, config: TTSConfig): Promise<void> {
    const apiKeyStore = useApiKeyStore()
    if (!apiKeyStore.apiKey) {
      throw new Error('请先在设置中填写智谱 API Key')
    }

    const defaultSpeed = Number(defaultPreferences.tts.zhipuSpeed)
    const defaultVolume = Number(defaultPreferences.tts.zhipuVolume)
    const speed = config.zhipuSpeed ?? defaultSpeed
    const volume = config.zhipuVolume ?? defaultVolume

    const response = await fetch('/api/tts/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Model-Api-Key': apiKeyStore.apiKey,
      },
      body: JSON.stringify({
        provider: 'zhipu',
        text,
        zhipuVoice: config.zhipuVoice || defaultPreferences.tts.zhipuVoice,
        zhipuSpeed: speed >= 0.5 && speed <= 2 ? speed : defaultSpeed,
        zhipuVolume: volume > 0 && volume <= 10 ? volume : defaultVolume,
        zhipuStream: false,
        zhipuEmotionEnabled: config.zhipuEmotionEnabled === true,
        zhipuEmotionStyle: config.zhipuEmotionStyle || defaultPreferences.tts.zhipuEmotionStyle,
        zhipuEmotionGranularity: config.zhipuEmotionGranularity || defaultPreferences.tts.zhipuEmotionGranularity,
        zhipuBaseURL: defaultPreferences.providers.zhipu.baseURL,
      }),
      signal,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '智谱 TTS 请求失败' }))
      throw new Error(error.message || '智谱 TTS 请求失败')
    }

    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      await playPcmEventStream(response, signal)
      return
    }

    await playAudioBlob(await response.blob(), signal)
  }

  async function playPcmEventStream(response: Response, signal: AbortSignal): Promise<void> {
    if (!response.body) {
      throw new Error('智谱 TTS 流式响应为空')
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) {
      throw new Error('当前浏览器不支持流式音频播放')
    }

    const audioContext = new AudioContextClass()
    currentAudioContext = audioContext

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let eventBuffer = ''
    let sampleRate = 24000
    let hasAudio = false
    let sawStopEvent = false
    let completedNaturally = false
    let playbackEndTime = audioContext.currentTime + STREAM_INITIAL_BUFFER_SECONDS
    const sourceEndPromises: Promise<void>[] = []

    const queuePcmChunk = (base64: string, chunkSampleRate: number) => {
      if (signal.aborted) return
      const samples = decodePcmChunk(base64)
      if (samples.length === 0) return

      const startTime = Math.max(
        playbackEndTime,
        audioContext.currentTime + STREAM_SCHEDULE_LEAD_SECONDS,
      )
      playbackEndTime = startTime + samples.length / chunkSampleRate
      sourceEndPromises.push(schedulePcmSamples(samples, chunkSampleRate, audioContext, startTime))
      hasAudio = true
      isSpeechLoading.value = false
      isPlaying.value = true
    }

    const handleEvent = (rawEvent: string) => {
      const data = rawEvent
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.replace(/^data:\s?/, ''))
        .join('\n')
        .trim()

      if (!data || data === '[DONE]') return

      const parsed = JSON.parse(data) as {
        error?: { message?: string }
        choices?: Array<{
          finish_reason?: string
          delta?: {
            content?: string
            return_sample_rate?: number
          }
        }>
      }

      if (parsed.error) {
        throw new Error(parsed.error.message || '智谱 TTS 流式请求失败')
      }

      for (const choice of parsed.choices || []) {
        if (choice.finish_reason === 'stop') {
          sawStopEvent = true
          continue
        }
        if (choice.delta?.return_sample_rate) {
          sampleRate = choice.delta.return_sample_rate
        }
        if (choice.delta?.content) {
          queuePcmChunk(choice.delta.content, sampleRate)
        }
      }
    }

    try {
      while (true) {
        if (signal.aborted) return
        const { value, done } = await reader.read()
        if (done) break

        eventBuffer += decoder.decode(value, { stream: true })
        const events = eventBuffer.split(/\r?\n\r?\n/)
        eventBuffer = events.pop() || ''
        for (const event of events) {
          handleEvent(event)
        }
      }

      eventBuffer += decoder.decode()
      if (eventBuffer.trim()) {
        handleEvent(eventBuffer)
      }

      if (!hasAudio) {
        throw new Error('智谱 TTS 没有返回可播放的音频片段')
      }

      await waitForScheduledPcmPlayback(audioContext, playbackEndTime, sourceEndPromises, signal)
      if (!sawStopEvent) {
        throw new Error('智谱 TTS 流式响应未完整结束，请重试')
      }
      completedNaturally = !signal.aborted
    } finally {
      reader.releaseLock()
      const ownsCurrentAudioContext = currentAudioContext === audioContext
      cleanupPcmStream(audioContext, !completedNaturally)
      if (ownsCurrentAudioContext) {
        isPlaying.value = false
      }
    }
  }

  function decodePcmChunk(base64: string): Float32Array {
    const bytes = base64ToUint8Array(base64)
    const sampleCount = Math.floor(bytes.byteLength / 2)
    const samples = new Float32Array(sampleCount)
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    for (let i = 0; i < sampleCount; i += 1) {
      samples[i] = Math.max(-1, Math.min(1, view.getInt16(i * 2, true) / 32768))
    }

    return samples
  }

  function schedulePcmSamples(
    samples: Float32Array,
    sampleRate: number,
    audioContext: AudioContext,
    startTime: number,
  ): Promise<void> {
    if (samples.length === 0) return Promise.resolve()

    const audioBuffer = audioContext.createBuffer(1, samples.length, sampleRate)
    const channel = audioBuffer.getChannelData(0)
    for (let i = 0; i < samples.length; i += 1) {
      channel[i] = samples[i]
    }

    const source = audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContext.destination)

    currentAudioSources.push(source)

    return new Promise((resolve) => {
      source.onended = () => {
        currentAudioSources = currentAudioSources.filter((item) => item !== source)
        resolve()
      }
      source.start(startTime)
    })
  }

  function waitForScheduledPcmPlayback(
    audioContext: AudioContext,
    playbackEndTime: number,
    sourceEndPromises: Promise<void>[],
    signal: AbortSignal,
  ): Promise<void> {
    if (signal.aborted) return Promise.resolve()

    const delayMs = Math.max(
      STREAM_PLAYBACK_GUARD_MS,
      (playbackEndTime - audioContext.currentTime) * 1000 + STREAM_PLAYBACK_GUARD_MS,
    )

    return new Promise((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        resolve()
      }
      const timer = window.setTimeout(finish, delayMs)
      signal.addEventListener('abort', finish, { once: true })
      Promise.allSettled(sourceEndPromises).then(finish)
    })
  }

  function base64ToUint8Array(base64: string): Uint8Array {
    const binary = window.atob(base64.replace(/\s/g, ''))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  async function playAudioBlob(blob: Blob, signal: AbortSignal): Promise<void> {
    if (signal.aborted) return

    isSpeechLoading.value = false
    isPlaying.value = true
    const audioUrl = URL.createObjectURL(blob)
    const audio = new Audio(audioUrl)
    currentAudioUrl = audioUrl
    currentAudio = audio

    await new Promise<void>((resolve, reject) => {
      let settled = false

      const cleanup = () => {
        signal.removeEventListener('abort', handleAbort)
        audio.onended = null
        audio.onerror = null
        audio.pause()
        audio.removeAttribute('src')

        if (currentAudio === audio) {
          currentAudio = null
        }
        if (currentAudioUrl === audioUrl) {
          currentAudioUrl = null
        }
        URL.revokeObjectURL(audioUrl)
      }

      const finish = (error?: unknown) => {
        if (settled) return
        settled = true
        const ownsCurrentAudio = currentAudio === audio
        cleanup()
        if (ownsCurrentAudio) {
          isPlaying.value = false
        }

        if (error) {
          reject(error)
        } else {
          resolve()
        }
      }

      const handleAbort = () => finish()

      signal.addEventListener('abort', handleAbort, { once: true })
      audio.onended = () => finish()
      audio.onerror = () => {
        finish(signal.aborted ? undefined : new Error('Audio playback failed'))
      }
      audio.play().catch((error) => {
        finish(signal.aborted ? undefined : error)
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
      if (provider === 'browser') {
        if (!browserTranscript && !isSTTSupported.value) {
          lastTranscriptionError.value = '当前浏览器不支持语音识别，请切换到本地识别'
        } else if (!browserTranscript) {
          lastTranscriptionError.value = '浏览器没有识别到文字，请切换到本地识别'
        }
        return browserTranscript
      }

      const providerLabel = getLocalSTTLabel(provider)
      const localTranscript = await transcribeWithLocalSTT(blob, provider)
      if (!localTranscript && !browserTranscript) {
        lastTranscriptionError.value = `${providerLabel} 没有识别到文字`
      }
      return localTranscript || browserTranscript
    } catch (error) {
      const providerLabel = provider === 'browser' ? '本地识别' : getLocalSTTLabel(provider)
      const message = normalizeLocalSTTErrorMessage(error, providerLabel)
      lastTranscriptionError.value = browserTranscript ? '' : message
      console.warn(`${providerLabel} STT failed, falling back to browser transcript:`, error)
      return browserTranscript
    } finally {
      isTranscribing.value = false
    }
  }

  async function transcribeWithLocalSTT(blob: Blob, provider: LocalSTTProvider): Promise<string> {
    const providerLabel = getLocalSTTLabel(provider)
    const response = await fetch('/api/stt/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        audioDataUrl: await blobToDataURL(blob),
        model: provider === 'funasr' ? 'paraformer' : localStorage.getItem('localWhisperModel') || 'base',
        language: localStorage.getItem('sttLanguage') || 'zh',
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `${providerLabel} 请求失败` }))
      throw new Error(error.message || `${providerLabel} 请求失败`)
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
    currentAudioSources.forEach((source) => {
      try {
        source.stop()
      } catch {
        // Source may have already ended.
      }
    })
    currentAudioSources = []
    if (currentAudioContext) {
      currentAudioContext.close().catch(() => {})
      currentAudioContext = null
    }
    if (currentAudio) {
      currentAudio.onended = null
      currentAudio.onerror = null
      currentAudio.pause()
      currentAudio.removeAttribute('src')
      currentAudio = null
    }
    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl)
      currentAudioUrl = null
    }
  }

  function cleanupPcmStream(audioContext: AudioContext, stopSources: boolean) {
    const ownedSources = currentAudioSources.filter((source) => source.context === audioContext)
    if (stopSources) {
      ownedSources.forEach((source) => {
        try {
          source.stop()
        } catch {
          // Source may have already ended.
        }
      })
    }
    currentAudioSources = currentAudioSources.filter((source) => source.context !== audioContext)
    audioContext.close().catch(() => {})
    if (currentAudioContext === audioContext) {
      currentAudioContext = null
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
