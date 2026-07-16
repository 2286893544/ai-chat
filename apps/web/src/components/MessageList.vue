<template>
  <div class="message-list" ref="listRef">
    <div v-if="messages.length === 0 && !isStreaming" class="message-empty">
      <div class="message-empty-icon">💬</div>
      <h3>开始对话</h3>
      <p>在下方的输入框中发送一条消息，AI 角色会以设定好的性格和语气回复你</p>
    </div>

    <div
      v-for="msg in displayMessages"
      :key="msg.id"
      class="message-wrapper"
      :class="[msg.role, msg.type === 'proactive' ? 'proactive' : '']"
    >
      <div
        class="message-bubble"
        :class="[msg.role, msg.type === 'proactive' ? 'proactive' : '', { streaming: msg.status === 'streaming', failed: msg.status === 'failed' }]"
      >
        <span v-if="msg.type === 'proactive'" class="proactive-badge">主动</span>
        <template v-if="msg.type === 'voice' && msg.voice">
          <VoiceMessage
            :voice="msg.voice"
            @play="handleVoiceMessagePlay"
          />
          <div v-if="msg.voice.transcript" style="margin-top: 4px; font-size: 12px; color: var(--text-muted)">
            {{ msg.voice.transcript }}
          </div>
          <div v-else-if="msg.voice.transcriptionStatus === 'pending'" style="margin-top: 4px; font-size: 12px; color: var(--text-muted)">
            正在识别...
          </div>
          <div v-else-if="msg.voice.transcriptionStatus === 'failed'" style="margin-top: 4px; font-size: 12px; color: var(--danger)">
            {{ msg.voice.transcriptionError || '未识别到文字，AI 暂不能回复' }}
          </div>
        </template>
        <template v-else>
          <template v-if="msg.content">
            {{ msg.content }}
          </template>
          <span v-else-if="msg.status === 'streaming'" class="typing-indicator" aria-label="AI 正在输入">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </template>
      </div>
      <div class="message-meta">{{ msg.status === 'streaming' ? '正在输入' : formatTime(msg.createdAt) }}</div>
      <div
        v-if="speechMessageId === msg.id && speechState === 'loading'"
        class="speech-loading-progress"
        role="progressbar"
        aria-label="正在生成整段语音"
        aria-valuetext="正在生成整段语音"
      >
        <span class="speech-loading-label">正在生成整段语音...</span>
        <span class="speech-loading-track" aria-hidden="true">
          <span class="speech-loading-bar"></span>
        </span>
      </div>
      <div class="message-actions" v-if="msg.status === 'done' || msg.status === 'failed'">
        <ElButton text size="small" class="message-action-btn" @click="emit('copy', msg.content)" v-if="msg.type === 'text'">复制</ElButton>
        <ElButton text size="small" class="message-action-btn" @click="emit('delete', msg.id)">删除</ElButton>
        <ElButton
          text
          size="small"
          class="message-action-btn"
          :class="{ active: speechMessageId === msg.id }"
          @click="handleSpeechAction(msg)"
          v-if="msg.role === 'assistant'"
        >
          <span v-if="speechMessageId === msg.id && speechState === 'loading'">取消</span>
          <span v-else-if="speechMessageId === msg.id && speechState === 'playing'">停止</span>
          <span v-else>朗读</span>
        </ElButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import VoiceMessage from './VoiceMessage.vue'
import type { Message } from '@ai-chat/shared'

const props = defineProps<{
  messages: Message[]
  isStreaming: boolean
  speechMessageId?: string | null
  speechState?: 'idle' | 'loading' | 'playing'
}>()

const emit = defineEmits<{
  playVoice: [msg: Message]
  stopVoice: []
  copy: [content: string]
  delete: [messageId: string]
}>()

const listRef = ref<HTMLElement>()

const displayMessages = computed(() => {
  // Don't show streaming messages in main list
  return props.messages
})

watch(() => props.messages.length, async () => {
  await nextTick()
  scrollToBottom()
})

watch(() => props.messages.map((msg) => msg.content).join('|'), async () => {
  await nextTick()
  scrollToBottom()
})

function scrollToBottom() {
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight
  }
}

function handleSpeechAction(msg: Message) {
  if (props.speechMessageId === msg.id && props.speechState !== 'idle') {
    emit('stopVoice')
    return
  }
  emit('playVoice', msg)
}

function handleVoiceMessagePlay() {
  emit('stopVoice')
}

function formatTime(isoStr: string) {
  const d = new Date(isoStr)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>
