export interface VoiceRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  onResult?: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
  onEnd?: () => void
}

export interface VoiceRecorderOptions {
  mimeType?: string
  onDataAvailable?: (blob: Blob) => void
  onStart?: () => void
  onStop?: (blob: Blob) => void
  onError?: (error: string) => void
}

// Check Web Speech API support
export function isSpeechRecognitionSupported(): boolean {
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  )
}

// Check MediaRecorder support
export function isMediaRecorderSupported(): boolean {
  return typeof window !== 'undefined' && 'MediaRecorder' in window
}

// Check Speech Synthesis support
export function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window
}

// Voice Recognition via Web Speech API
export class VoiceRecognizer {
  private recognition: any = null
  private isRunning = false

  start(options: VoiceRecognitionOptions): void {
    if (!isSpeechRecognitionSupported()) {
      options.onError?.('SpeechRecognition API not supported')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    this.recognition = new SpeechRecognition()

    this.recognition.lang = options.lang || 'zh-CN'
    this.recognition.continuous = options.continuous ?? true
    this.recognition.interimResults = options.interimResults ?? true
    this.recognition.maxAlternatives = 1

    this.recognition.onresult = (event: any) => {
      let fullTranscript = ''
      let hasFinal = false

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        fullTranscript += result[0].transcript
        hasFinal = hasFinal || result.isFinal
      }

      options.onResult?.(fullTranscript.trim(), hasFinal)
    }

    this.recognition.onerror = (event: any) => {
      options.onError?.(event.error || 'recognition_error')
    }

    this.recognition.onend = () => {
      this.isRunning = false
      options.onEnd?.()
    }

    try {
      this.recognition.start()
      this.isRunning = true
    } catch (error: any) {
      this.isRunning = false
      options.onError?.(error?.message || 'recognition_start_failed')
    }
  }

  stop(): void {
    if (this.recognition && this.isRunning) {
      this.recognition.stop()
      this.isRunning = false
    }
  }

  isActive(): boolean {
    return this.isRunning
  }
}

// Voice Recorder via MediaRecorder API
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []
  private isRecording = false
  private startTime = 0

  async start(options: VoiceRecorderOptions): Promise<void> {
    if (this.isRecording) return

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = this.getSupportedMimeType(options.mimeType)
      this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : {})

      this.chunks = []
      this.isRecording = true
      this.startTime = Date.now()

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data)
          options.onDataAvailable?.(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.mediaRecorder?.mimeType || 'audio/webm',
        })
        this.isRecording = false
        options.onStop?.(blob)
        this.cleanup()
      }

      this.mediaRecorder.onerror = (event) => {
        this.isRecording = false
        options.onError?.('MediaRecorder error')
        this.cleanup()
      }

      this.mediaRecorder.start(100)
      options.onStart?.()
    } catch (err: any) {
      this.isRecording = false
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        options.onError?.('VOICE_PERMISSION_DENIED')
        throw new Error('VOICE_PERMISSION_DENIED')
      } else {
        options.onError?.(err.message || 'microphone_error')
        throw new Error(err.message || 'microphone_error')
      }
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not recording'))
        return
      }

      const recorder = this.mediaRecorder
      const originalOnStop = recorder.onstop
      recorder.onstop = (event) => {
        originalOnStop?.call(recorder, event)
        const blob = new Blob(this.chunks, {
          type: recorder.mimeType || 'audio/webm',
        })
        resolve(blob)
      }

      recorder.stop()
      this.stream?.getTracks().forEach((track) => track.stop())
    })
  }

  getDuration(): number {
    if (!this.startTime) return 0
    return Date.now() - this.startTime
  }

  isActive(): boolean {
    return this.isRecording
  }

  private getSupportedMimeType(preferred?: string): string | undefined {
    if (preferred && MediaRecorder.isTypeSupported(preferred)) {
      return preferred
    }
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]
    return types.find((t) => MediaRecorder.isTypeSupported(t))
  }

  private cleanup(): void {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    this.mediaRecorder = null
  }
}

// Text-to-Speech via SpeechSynthesis
export function speakText(
  text: string,
  options?: {
    lang?: string
    rate?: number
    pitch?: number
    volume?: number
    onStart?: () => void
    onEnd?: () => void
    onError?: (error: string) => void
  }
): SpeechSynthesisUtterance | null {
  if (!isSpeechSynthesisSupported()) {
    options?.onError?.('SpeechSynthesis not supported')
    return null
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = options?.lang || 'zh-CN'
  utterance.rate = options?.rate ?? 1.0
  utterance.pitch = options?.pitch ?? 1.0
  utterance.volume = options?.volume ?? 1.0

  utterance.onstart = () => options?.onStart?.()
  utterance.onend = () => options?.onEnd?.()
  utterance.onerror = (event) => options?.onError?.(event.error || 'tts_error')

  window.speechSynthesis.speak(utterance)
  return utterance
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel()
  }
}

// Convert blob to data URL
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// Convert blob to base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] || result
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
