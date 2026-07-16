<template>
  <div class="voice-message">
    <ElButton class="voice-play-btn" text circle @click="togglePlay" :title="isPlaying || isLoading ? '停止' : '播放'">
      {{ isPlaying || isLoading ? '⏸' : '▶' }}
    </ElButton>
    <div class="voice-waveform">
      <div
        v-for="i in 20"
        :key="i"
        class="voice-bar"
        :class="{ active: isPlaying && (i % 3 === Math.floor(time % 3)) }"
        :style="{ height: barHeights[i-1] + 'px' }"
      ></div>
    </div>
    <span class="voice-duration">{{ formatDuration(voice.durationMs) }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { VoicePayload } from '@ai-chat/shared'

const props = defineProps<{
  voice: VoicePayload
}>()

const emit = defineEmits<{
  play: []
}>()

const isPlaying = ref(false)
const isLoading = ref(false)
const time = ref(0)
let timer: number | null = null
let currentAudio: HTMLAudioElement | null = null

// Generate random bar heights for visual
const barHeights = computed(() => {
  const heights: number[] = []
  for (let i = 0; i < 20; i++) {
    heights.push(4 + Math.sin(i * 0.8) * 8 + Math.random() * 6)
  }
  return heights
})

function togglePlay() {
  if (isPlaying.value || isLoading.value) {
    stop()
  } else {
    play()
  }
}

function play() {
  const audioUrl = props.voice.localUrl || props.voice.remoteUrl
  if (!audioUrl) {
    emit('play')
    return
  }

  stop()
  const audio = new Audio(audioUrl)
  currentAudio = audio
  isLoading.value = true
  audio.onended = stop
  audio.onerror = stop
  audio.play().then(() => {
    if (currentAudio !== audio) return
    isLoading.value = false
    isPlaying.value = true
    timer = window.setInterval(() => {
      time.value++
    }, 500)
  }).catch(() => {
    stop()
  })
}

function stop() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  isLoading.value = false
  isPlaying.value = false
  time.value = 0
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function formatDuration(ms: number) {
  const sec = Math.floor(ms / 1000)
  const min = Math.floor(sec / 60)
  return `${min}:${String(sec % 60).padStart(2, '0')}`
}

onUnmounted(stop)
</script>
