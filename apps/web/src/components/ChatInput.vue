<template>
  <div class="chat-input-wrapper">
    <textarea
      class="chat-input"
      :placeholder="placeholder"
      v-model="inputText"
      @keydown="handleKeydown"
      :disabled="disabled || isRecording"
      rows="1"
      ref="textareaRef"
    ></textarea>

    <div class="input-actions">
      <!-- Record button -->
      <button
        class="input-btn"
        :class="{ recording: isRecording }"
        @click="handleRecordToggle"
        :title="isRecording ? '停止录音' : '语音输入'"
        :disabled="disabled && !isRecording"
      >
        {{ isRecording ? '⏹' : '🎤' }}
      </button>

      <!-- Stop / Send -->
      <button
        v-if="isStreaming"
        class="input-btn"
        @click="emit('stop')"
        title="停止生成"
      >
        ⏹
      </button>
      <button
        v-else
        class="input-btn send"
        @click="handleSend"
        :disabled="disabled || !inputText.trim()"
        title="发送"
      >
        ↑
      </button>
    </div>
  </div>

  <!-- Recording indicator -->
  <div v-if="isRecording" class="recorder-indicator">
    <div class="recorder-dot"></div>
    <span>录音中 {{ recordingDuration }}s</span>
    <span style="margin-left:auto;font-size:12px;color:var(--text-muted)">再次点击发送</span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  disabled?: boolean
  isStreaming?: boolean
  isRecording?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  send: [text: string]
  stop: []
  recordStart: []
  recordEnd: []
}>()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const recordingDuration = ref(0)
let recordTimer: number | null = null

watch(() => props.isRecording, (val) => {
  if (val) {
    recordingDuration.value = 0
    recordTimer = window.setInterval(() => {
      recordingDuration.value++
    }, 1000)
  } else if (recordTimer) {
    clearInterval(recordTimer)
    recordTimer = null
  }
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  emit('send', text)
  inputText.value = ''
  autoResize()
}

function autoResize() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

function handleRecordToggle() {
  if (props.isRecording) {
    emit('recordEnd')
  } else {
    emit('recordStart')
  }
}
</script>
