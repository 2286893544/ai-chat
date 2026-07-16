<template>
  <div class="chat-input-wrapper">
    <ElInput
      class="chat-input"
      type="textarea"
      :placeholder="placeholder"
      v-model="inputText"
      @keydown="handleKeydown"
      :disabled="disabled || isRecording"
      :autosize="{ minRows: 1, maxRows: 5 }"
      resize="none"
    />

    <div class="input-actions">
      <!-- Record button -->
      <ElButton
        class="input-btn"
        :class="{ recording: isRecording }"
        @click="handleRecordToggle"
        :title="isRecording ? '停止录音' : '语音输入'"
        :disabled="disabled && !isRecording"
        circle
        text
      >
        <ElIcon><VideoPause v-if="isRecording" /><Mic v-else /></ElIcon>
      </ElButton>

      <!-- Stop / Send -->
      <ElButton
        v-if="isStreaming"
        class="input-btn"
        @click="emit('stop')"
        title="停止生成"
        circle
        text
      >
        <ElIcon><VideoPause /></ElIcon>
      </ElButton>
      <ElButton
        v-else
        class="input-btn send"
        @click="handleSend"
        :disabled="disabled || !inputText.trim()"
        title="发送"
        circle
      >
        <ElIcon><Promotion /></ElIcon>
      </ElButton>
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
import { Mic, Promotion, VideoPause } from '@element-plus/icons-vue'

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
}

function handleRecordToggle() {
  if (props.isRecording) {
    emit('recordEnd')
  } else {
    emit('recordStart')
  }
}
</script>
