<template>
  <Teleport to="body">
    <Transition name="voice-call">
      <div v-if="visible" class="voice-call-overlay" role="dialog" aria-modal="true" aria-label="AI 语音通话">
        <div class="voice-call-backdrop"></div>
        <section class="voice-call-panel">
          <div class="voice-call-topbar">
            <span class="voice-call-title">AI 语音通话</span>
            <span class="voice-call-duration">{{ formatDuration(durationSeconds) }}</span>
          </div>

          <div class="voice-call-person">
            <div class="voice-call-avatar" :class="{ speaking: phase === 'speaking' }">
              <img v-if="avatar" :src="avatar" :alt="characterName" />
              <span v-else>{{ characterName.charAt(0) || 'AI' }}</span>
              <i class="voice-call-ring ring-one"></i>
              <i class="voice-call-ring ring-two"></i>
            </div>
            <h2>{{ characterName }}</h2>
            <p class="voice-call-state" :class="phase">{{ phaseLabel }}</p>
          </div>

          <div class="voice-call-live">
            <div class="voice-wave" :class="{ active: phase === 'listening' && !muted }" aria-hidden="true">
              <i
                v-for="index in 17"
                :key="index"
                :style="waveBarStyle(index)"
              ></i>
            </div>
            <p v-if="errorMessage" class="voice-call-error">{{ errorMessage }}</p>
            <p v-else-if="transcript" class="voice-call-transcript">“{{ transcript }}”</p>
            <p v-else class="voice-call-hint">{{ phaseHint }}</p>
          </div>

          <div class="voice-call-actions">
            <ElButton
              v-if="phase === 'listening' || phase === 'muted'"
              class="voice-call-action"
              text
              circle
              :title="muted ? '打开麦克风' : '关闭麦克风'"
              @click="emit('toggleMute')"
            >
              <ElIcon class="voice-call-action-icon"><Mute v-if="muted" /><Microphone v-else /></ElIcon>
            </ElButton>

            <ElButton
              v-if="phase === 'listening' && !muted"
              class="voice-call-action finish"
              text
              circle
              title="说完了"
              @click="emit('finishTurn')"
            >
              <ElIcon class="voice-call-action-icon"><Check /></ElIcon>
            </ElButton>

            <ElButton
              v-if="phase === 'speaking' || phase === 'error'"
              class="voice-call-action interrupt"
              text
              circle
              :title="phase === 'error' ? '重新连接麦克风' : '打断并开始说话'"
              @click="emit('interrupt')"
            >
              <ElIcon class="voice-call-action-icon"><Microphone /></ElIcon>
            </ElButton>

            <ElButton
              class="voice-call-action hangup"
              circle
              title="挂断"
              @click="emit('end')"
            >
              <ElIcon class="voice-call-action-icon phone"><PhoneFilled /></ElIcon>
            </ElButton>
          </div>

          <p class="voice-call-footer">
            {{ phase === 'listening' ? '停顿约 0.8 秒后自动发送' : '通话内容会同步保存到当前会话' }}
          </p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, Microphone, Mute, PhoneFilled } from '@element-plus/icons-vue'

type VoiceCallPhase =
  | 'connecting'
  | 'listening'
  | 'muted'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'error'

const props = defineProps<{
  visible: boolean
  characterName: string
  avatar?: string
  phase: VoiceCallPhase
  durationSeconds: number
  audioLevel: number
  transcript?: string
  errorMessage?: string
  muted?: boolean
}>()

const emit = defineEmits<{
  end: []
  toggleMute: []
  interrupt: []
  finishTurn: []
}>()

const phaseLabel = computed(() => ({
  connecting: '正在连接…',
  listening: '正在听你说',
  muted: '麦克风已关闭',
  transcribing: '正在识别',
  thinking: '正在思考',
  speaking: '正在和你说话',
  error: '通话遇到问题',
}[props.phase]))

const phaseHint = computed(() => ({
  connecting: '正在准备麦克风',
  listening: '你可以开始说话了',
  muted: '点击麦克风继续通话',
  transcribing: '正在理解你刚才说的话',
  thinking: `${props.characterName} 正在组织回复`,
  speaking: '你可以随时打断',
  error: '稍后将自动恢复收听',
}[props.phase]))

function waveBarStyle(index: number) {
  const shape = 0.45 + Math.abs(Math.sin(index * 0.82)) * 0.85
  const energy = props.phase === 'listening' && !props.muted
    ? Math.min(1, props.audioLevel * 16)
    : props.phase === 'speaking' ? 0.32 : 0.04
  return {
    height: `${6 + Math.round(34 * energy * shape)}px`,
    opacity: `${0.28 + Math.min(0.72, energy * 1.2)}`,
  }
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.max(0, totalSeconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
</script>

<style scoped>
.voice-call-overlay {
  position: fixed;
  z-index: 3000;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.voice-call-backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 26%, rgba(108, 99, 255, 0.24), transparent 34%),
    linear-gradient(150deg, rgba(7, 15, 31, 0.98), rgba(15, 29, 57, 0.98));
  backdrop-filter: blur(18px);
}

.voice-call-panel {
  position: relative;
  width: min(100%, 560px);
  min-height: min(760px, 100dvh);
  padding: 28px 32px 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #f6f8ff;
}

.voice-call-topbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(228, 234, 248, 0.72);
  font-size: 13px;
  letter-spacing: 0.04em;
}

.voice-call-duration {
  font-variant-numeric: tabular-nums;
}

.voice-call-person {
  margin-top: clamp(56px, 10vh, 94px);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.voice-call-avatar {
  position: relative;
  width: 142px;
  height: 142px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(175, 188, 255, 0.36);
  border-radius: 50%;
  background: linear-gradient(145deg, #776eff, #3d54a9);
  box-shadow: 0 28px 80px rgba(33, 44, 96, 0.62);
  color: #fff;
  font-size: 46px;
  font-weight: 700;
  isolation: isolate;
}

.voice-call-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.voice-call-ring {
  position: absolute;
  z-index: -1;
  inset: -13px;
  border: 1px solid rgba(137, 129, 255, 0.32);
  border-radius: 50%;
  opacity: 0;
}

.voice-call-avatar.speaking .voice-call-ring {
  animation: voice-call-ring 1.9s ease-out infinite;
}

.voice-call-avatar.speaking .ring-two {
  animation-delay: 0.7s;
}

.voice-call-person h2 {
  margin: 28px 0 8px;
  font-size: 24px;
  letter-spacing: 0.02em;
}

.voice-call-state {
  margin: 0;
  color: #9da9c4;
  font-size: 14px;
}

.voice-call-state.listening {
  color: #71d1c1;
}

.voice-call-state.speaking {
  color: #aaa5ff;
}

.voice-call-state.error {
  color: #ff9c9c;
}

.voice-call-live {
  width: 100%;
  min-height: 126px;
  margin-top: 42px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.voice-wave {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.voice-wave i {
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(to top, #6edcca, #a89eff);
  transition: height 80ms ease, opacity 120ms ease;
}

.voice-wave.active i:nth-child(3n) {
  transition-duration: 55ms;
}

.voice-call-transcript,
.voice-call-hint,
.voice-call-error {
  max-width: 440px;
  margin: 20px 0 0;
  text-align: center;
  line-height: 1.65;
}

.voice-call-transcript {
  color: rgba(244, 247, 255, 0.94);
  font-size: 16px;
}

.voice-call-hint {
  color: #8390aa;
  font-size: 13px;
}

.voice-call-error {
  color: #ffaaa6;
  font-size: 13px;
}

.voice-call-actions {
  width: 100%;
  min-height: 86px;
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
}

.voice-call-action.el-button {
  width: 62px;
  height: 62px;
  border: 1px solid rgba(199, 210, 239, 0.14);
  background: rgba(232, 238, 255, 0.1);
  color: #fff;
}

.voice-call-action.el-button:hover {
  border-color: rgba(199, 210, 239, 0.34);
  background: rgba(232, 238, 255, 0.17);
}

.voice-call-action.finish.el-button {
  background: rgba(78, 205, 196, 0.16);
  color: #8aeadc;
}

.voice-call-action.interrupt.el-button {
  background: rgba(139, 131, 255, 0.18);
}

.voice-call-action.hangup.el-button {
  width: 70px;
  height: 70px;
  border: 0;
  background: #ed5c62;
  box-shadow: 0 16px 42px rgba(237, 92, 98, 0.28);
}

.voice-call-action.hangup.el-button:hover {
  background: #f36a70;
}

.voice-call-action-icon {
  font-size: 23px;
  line-height: 1;
}

.voice-call-action-icon.phone {
  display: inline-block;
  font-size: 31px;
  transform: rotate(135deg);
}

.voice-call-footer {
  margin: 22px 0 0;
  color: rgba(155, 167, 194, 0.56);
  font-size: 11px;
}

.voice-call-enter-active,
.voice-call-leave-active {
  transition: opacity 220ms ease;
}

.voice-call-enter-active .voice-call-panel,
.voice-call-leave-active .voice-call-panel {
  transition: transform 260ms ease, opacity 220ms ease;
}

.voice-call-enter-from,
.voice-call-leave-to {
  opacity: 0;
}

.voice-call-enter-from .voice-call-panel,
.voice-call-leave-to .voice-call-panel {
  opacity: 0;
  transform: translateY(14px) scale(0.985);
}

@keyframes voice-call-ring {
  0% { opacity: 0.72; transform: scale(0.94); }
  100% { opacity: 0; transform: scale(1.26); }
}

@media (max-width: 600px) {
  .voice-call-panel {
    min-height: 100dvh;
    padding: 22px 20px 20px;
  }

  .voice-call-person {
    margin-top: 12vh;
  }

  .voice-call-avatar {
    width: 126px;
    height: 126px;
  }

  .voice-call-actions {
    gap: 20px;
  }
}
</style>
