<template>
  <div class="page">
    <h1 class="page-title">设置</h1>

    <!-- API Key -->
    <div class="card settings-section">
      <div class="card-title">模型 API Key</div>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;line-height:1.5">
        你的 API Key 只会用于请求当前选择的模型服务。MVP 模式下 Key 保存在本机浏览器，后端不会长期保存。请不要在公共设备上选择记住 Key。
      </p>

      <div v-if="!apiKeyStore.apiKey" class="key-input-row">
        <ElInput
          type="password"
          v-model="keyInput"
          :placeholder="`输入你的 ${currentProviderLabel} API Key...`"
          show-password
          @keyup.enter="handleValidate"
        />
        <ElButton type="primary" @click="handleValidate" :loading="validating">
          {{ validating ? '验证中...' : '验证并保存' }}
        </ElButton>
      </div>

      <div v-else>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <span class="key-masked">{{ apiKeyStore.maskedKey }}</span>
          <span v-if="validated" class="success-banner" style="margin:0;padding:4px 12px">已验证</span>
        </div>
        <div style="display:flex;gap:8px">
          <ElButton @click="handleChangeKey">更换 Key</ElButton>
          <ElButton type="danger" @click="handleClearKey">清空 Key</ElButton>
          <ElButton @click="handleValidate" :loading="validating">
            {{ validating ? '验证中...' : '重新验证' }}
          </ElButton>
        </div>
      </div>

      <div v-if="error" class="error-banner" style="margin-top:12px">{{ error }}</div>
      <div v-if="success" class="success-banner" style="margin-top:12px">{{ success }}</div>
    </div>

    <!-- 本地数据与安全边界 -->
    <div class="card settings-section">
      <div class="card-title">本地数据与安全边界</div>
      <div class="info-grid">
        <div>
          <div class="info-title">本地数据</div>
          <ul class="info-list">
            <li v-for="item in projectInfo.localData" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div>
          <div class="info-title">安全提醒</div>
          <ul class="info-list">
            <li v-for="item in projectInfo.safetyNotes" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 模型设置 -->
    <div class="card settings-section">
      <div class="card-title">模型设置</div>
      <div class="form-group">
        <label class="form-label">模型服务商</label>
        <ElSelect v-model="modelProvider" class="ui-control">
          <ElOption label="DeepSeek" value="deepseek" />
          <ElOption label="智谱大模型（GLM）" value="zhipu" />
        </ElSelect>
      </div>
      <div class="form-group">
        <label class="form-label">默认模型</label>
        <ElSelect v-model="defaultModel" class="ui-control">
          <template v-if="modelProvider === 'zhipu'">
            <ElOption label="glm-5.2（推荐）" value="glm-5.2" />
            <ElOption label="glm-5.1" value="glm-5.1" />
            <ElOption label="glm-5-turbo" value="glm-5-turbo" />
            <ElOption label="glm-5" value="glm-5" />
            <ElOption label="glm-4.7" value="glm-4.7" />
            <ElOption label="glm-4.7-flash" value="glm-4.7-flash" />
            <ElOption label="glm-4.7-flashx" value="glm-4.7-flashx" />
            <ElOption label="glm-4.6" value="glm-4.6" />
            <ElOption label="glm-4.5-air（轻量）" value="glm-4.5-air" />
            <ElOption label="glm-4.5-airx" value="glm-4.5-airx" />
            <ElOption label="glm-4.5-flash" value="glm-4.5-flash" />
            <ElOption label="glm-4-flash-250414" value="glm-4-flash-250414" />
            <ElOption label="glm-4-flashx-250414" value="glm-4-flashx-250414" />
          </template>
          <template v-else>
            <ElOption label="deepseek-v4-flash（推荐，速度快）" value="deepseek-v4-flash" />
            <ElOption label="deepseek-v4-pro（质量高）" value="deepseek-v4-pro" />
            <ElOption label="deepseek-chat（旧版，即将废弃）" value="deepseek-chat" />
          </template>
        </ElSelect>
      </div>
      <div class="form-group">
        <label class="form-label">API Base URL</label>
        <ElInput v-model="baseURL" :placeholder="providerDefaults[modelProvider].baseURL" />
      </div>
    </div>

    <!-- 语音转文字设置 -->
    <div class="card settings-section">
      <div class="card-title">语音转文字设置</div>
      <div class="form-group">
        <label class="form-label">识别引擎</label>
        <ElSelect v-model="sttProvider" class="ui-control">
          <ElOption label="浏览器识别（无需 Key，不稳定）" value="browser" />
          <ElOption label="本地 faster-whisper（无需 Key，需启动本地服务）" value="faster-whisper" />
          <ElOption label="本地 FunASR（中文优化，需启动本地服务）" value="funasr" />
        </ElSelect>
      </div>

      <template v-if="sttProvider !== 'browser'">
        <div class="form-row">
          <div v-if="sttProvider === 'faster-whisper'" class="form-group">
            <label class="form-label">本地模型</label>
            <ElSelect v-model="localWhisperModel" class="ui-control">
              <ElOption label="base（推荐，速度和效果均衡）" value="base" />
              <ElOption label="small（更准，首次下载更久）" value="small" />
              <ElOption label="tiny（最快，效果一般）" value="tiny" />
            </ElSelect>
          </div>
          <div v-else class="form-group">
            <label class="form-label">本地模型</label>
            <div class="form-input static-field">paraformer-zh + fsmn-vad + ct-punc</div>
          </div>
          <div class="form-group">
            <label class="form-label">识别语言</label>
            <ElSelect v-model="sttLanguage" class="ui-control">
              <ElOption label="中文" value="zh" />
              <ElOption label="自动识别" value="" />
              <ElOption label="英文" value="en" />
            </ElSelect>
          </div>
        </div>
        <p v-if="sttProvider === 'funasr'" class="settings-hint">
          FunASR 更适合中文口语输入，首次使用会下载本地模型；后续会复用缓存。
        </p>
      </template>
    </div>

    <!-- 朗读设置 -->
    <div class="card settings-section">
      <div class="card-title">朗读设置</div>
      <div class="form-group">
        <label class="form-label">朗读引擎</label>
        <ElSelect v-model="ttsProvider" class="ui-control">
          <ElOption label="系统朗读（本机浏览器）" value="browser" />
          <ElOption label="本地语音复刻（Qwen3-TTS）" value="qwen-local" />
          <ElOption label="Edge TTS（免费，无需 Key）" value="edge" />
          <ElOption label="ElevenLabs（更自然、有情绪）" value="elevenlabs" />
          <ElOption label="智谱 GLM-TTS" value="zhipu" />
        </ElSelect>
      </div>

      <template v-if="ttsProvider === 'qwen-local'">
        <div class="local-tts-status" :class="{ ready: localTtsAvailable === true }">
          <span class="status-dot"></span>
          <span>{{ localTtsStatus }}</span>
          <ElButton size="small" :loading="localTtsLoading" @click="refreshLocalTts">
            {{ localTtsLoading ? '检查中...' : '刷新' }}
          </ElButton>
        </div>

        <div class="form-group">
          <label class="form-label">当前音色</label>
          <div class="voice-input-row">
            <ElSelect v-model="localTtsVoiceId" class="ui-control" :disabled="localVoices.length === 0">
              <ElOption :label="localVoices.length ? '请选择音色' : '暂无复刻音色'" value="" />
              <ElOption
                v-for="voice in localVoices"
                :key="voice.id"
                :label="`${voice.name} · ${voice.durationSeconds.toFixed(1)} 秒`"
                :value="voice.id"
              />
            </ElSelect>
            <ElButton
              size="small"
              :disabled="!localTtsVoiceId || previewingVoice !== null || localTtsAvailable !== true"
              @click="handlePreviewLocalVoice"
            >
              ▶ {{ previewingVoice === `qwen-local:${localTtsVoiceId}` ? '生成中' : '试听' }}
            </ElButton>
            <ElButton type="danger" size="small" :disabled="!localTtsVoiceId" @click="handleDeleteLocalVoice">
              删除
            </ElButton>
          </div>
        </div>

        <div class="local-voice-editor">
          <div class="local-recording-guide">
            <div class="local-recording-guide-header">
              <strong>录音或上传音频时，请完整朗读以下内容</strong>
            </div>
            <p>{{ localVoiceRecordingScript }}</p>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">音色名称</label>
              <ElInput v-model="localVoiceName" maxlength="80" placeholder="例如：我的声音" />
            </div>
            <div class="form-group">
              <label class="form-label">参考音频</label>
              <div class="local-audio-actions">
                <ElUpload
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="audio/*,.wav,.mp3,.m4a"
                  :on-change="handleLocalAudioUpload"
                >
                  <ElButton size="small">选择音频</ElButton>
                </ElUpload>
                <ElButton
                  v-if="!localVoiceRecording"
                  size="small"
                  :disabled="localVoiceProcessing || !voiceStore.isRecorderSupported"
                  @click="handleStartLocalVoiceRecording"
                >
                  开始录音并朗读
                </ElButton>
                <ElButton v-else type="danger" size="small" @click="handleStopLocalVoiceRecording">
                  停止 {{ voiceStore.recordingDuration }} 秒
                </ElButton>
                <span v-if="localVoiceSourceLabel" class="local-audio-meta">
                  {{ localVoiceSourceLabel }} · {{ localVoiceDuration.toFixed(1) }} 秒
                </span>
              </div>
            </div>
          </div>
          <ElButton
            type="primary"
            :loading="localVoiceSaving || localVoiceProcessing"
            :disabled="localVoiceSaving || localVoiceProcessing || !canCreateLocalVoice"
            @click="handleCreateLocalVoice"
          >
            {{ localVoiceSaving ? '保存中...' : '创建音色' }}
          </ElButton>
          <p class="settings-hint local-tts-hint">样本需 3-30 秒、环境安静、只包含一个人的声音。首次试听会下载本地模型。</p>
        </div>
      </template>

      <template v-if="ttsProvider === 'edge'">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">中文音色</label>
            <ElSelect v-model="edgeTtsVoice" class="ui-control">
              <ElOption v-for="voice in edgeTtsVoices" :key="voice.value" :label="voice.label" :value="voice.value" />
            </ElSelect>
            <div class="voice-preview-grid">
              <ElButton
                v-for="voice in edgeTtsVoices"
                :key="voice.value"
                class="voice-preview-btn"
                :class="{ active: edgeTtsVoice === voice.value }"
                :disabled="previewingVoice !== null"
                size="small"
                @click="handlePreviewEdgeVoice(voice.value)"
              >
                ▶ {{ previewingVoice === `edge:${voice.value}` ? '播放中' : voice.label }}
              </ElButton>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">语速</label>
            <ElSelect v-model="edgeTtsRate" class="ui-control">
              <ElOption label="慢一点" value="-20%" />
              <ElOption label="稍慢" value="-10%" />
              <ElOption label="正常" value="+0%" />
              <ElOption label="稍快" value="+10%" />
              <ElOption label="快一点" value="+20%" />
            </ElSelect>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">音调</label>
            <ElSelect v-model="edgeTtsPitch" class="ui-control">
              <ElOption label="低一点" value="-10Hz" />
              <ElOption label="正常" value="+0Hz" />
              <ElOption label="高一点" value="+10Hz" />
              <ElOption label="更活泼" value="+20Hz" />
            </ElSelect>
          </div>
          <div class="form-group">
            <label class="form-label">音量</label>
            <ElSelect v-model="edgeTtsVolume" class="ui-control">
              <ElOption label="小一点" value="-20%" />
              <ElOption label="正常" value="+0%" />
              <ElOption label="大一点" value="+20%" />
            </ElSelect>
          </div>
        </div>
        <div class="toggle-row">
          <span>隐藏情绪控制</span>
          <ElSwitch v-model="edgeTtsEmotionEnabled" />
        </div>
        <div v-if="edgeTtsEmotionEnabled" class="form-group">
          <label class="form-label">情绪风格</label>
          <ElSelect v-model="edgeTtsEmotionStyle" class="ui-control">
            <ElOption v-for="style in edgeEmotionStyles" :key="style.value" :label="style.label" :value="style.value" />
          </ElSelect>
        </div>
        <p v-if="edgeTtsEmotionEnabled" class="settings-hint">
          不会向朗读文本添加可读标签，只会在后端按风格调整 Edge TTS 的语速、音调和音量。
        </p>
      </template>

      <template v-if="ttsProvider === 'elevenlabs'">
        <div class="form-group">
          <label class="form-label">ElevenLabs API Key</label>
          <ElInput type="password" v-model="elevenLabsApiKey" placeholder="输入 ElevenLabs API Key" show-password />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Voice ID</label>
            <div class="voice-input-row">
              <ElInput v-model="elevenLabsVoiceId" placeholder="JBFqnCBsd6RMkjVDRZzb" />
              <ElButton size="small" :disabled="previewingVoice !== null" @click="handlePreviewElevenLabsVoice">
                ▶ {{ previewingVoice === 'elevenlabs:current' ? '播放中' : '试听' }}
              </ElButton>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">模型</label>
            <ElSelect v-model="elevenLabsModelId" class="ui-control">
              <ElOption label="multilingual v2（稳定自然）" value="eleven_multilingual_v2" />
              <ElOption label="turbo v2.5（更快）" value="eleven_turbo_v2_5" />
              <ElOption label="flash v2.5（低延迟）" value="eleven_flash_v2_5" />
            </ElSelect>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">稳定度 {{ elevenLabsStability }}</label>
            <ElSlider v-model="elevenLabsStability" :min="0" :max="1" :step="0.05" />
          </div>
          <div class="form-group">
            <label class="form-label">相似度 {{ elevenLabsSimilarityBoost }}</label>
            <ElSlider v-model="elevenLabsSimilarityBoost" :min="0" :max="1" :step="0.05" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">表现力 {{ elevenLabsStyle }}</label>
          <ElSlider v-model="elevenLabsStyle" :min="0" :max="1" :step="0.05" />
        </div>
      </template>

      <template v-if="ttsProvider === 'zhipu'">
        <div class="form-group tts-key-field">
          <div class="tts-key-heading">
            <label class="form-label">智谱朗读 API Key</label>
            <span v-if="zhipuTtsKeyValidated" class="tts-key-status">已验证</span>
          </div>

          <div v-if="!zhipuTtsKeyValidated" class="key-input-row tts-key-input-row">
            <ElInput
              type="password"
              v-model="zhipuTtsApiKey"
              placeholder="输入智谱 GLM-TTS API Key"
              autocomplete="off"
              show-password
              @keyup.enter="handleValidateZhipuTtsKey"
            />
            <ElButton
              type="primary"
              :loading="zhipuTtsKeyValidating"
              :disabled="zhipuTtsKeyValidating || !zhipuTtsApiKey.trim()"
              @click="handleValidateZhipuTtsKey"
            >
              {{ zhipuTtsKeyValidating ? '验证中...' : '验证并保存' }}
            </ElButton>
          </div>

          <div v-else class="tts-key-saved-row">
            <span class="key-masked">{{ maskedZhipuTtsApiKey }}</span>
            <ElButton size="small" @click="handleChangeZhipuTtsKey">更换 Key</ElButton>
            <ElButton type="danger" size="small" @click="handleClearZhipuTtsKey">清空 Key</ElButton>
          </div>

          <p class="settings-hint tts-key-hint">
            校验会调用 GLM-TTS 生成极短测试音频。未配置独立 Key 时，朗读仍兼容使用上方的模型 API Key。
          </p>
          <p v-if="zhipuTtsKeyError" class="tts-key-error">{{ zhipuTtsKeyError }}</p>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">音色</label>
            <ElSelect v-model="zhipuTtsVoice" class="ui-control">
              <ElOption v-for="voice in zhipuTtsVoices" :key="voice.value" :label="voice.label" :value="voice.value" />
            </ElSelect>
            <div class="voice-preview-grid">
              <ElButton
                v-for="voice in zhipuTtsVoices"
                :key="voice.value"
                class="voice-preview-btn"
                :class="{ active: zhipuTtsVoice === voice.value }"
                :disabled="previewingVoice !== null"
                size="small"
                @click="handlePreviewZhipuVoice(voice.value)"
              >
                ▶ {{ previewingVoice === `zhipu:${voice.value}` ? '播放中' : voice.label }}
              </ElButton>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">语速</label>
            <ElSelect v-model="zhipuTtsSpeed" class="ui-control">
              <ElOption label="稍慢" value="0.8" />
              <ElOption label="标准" value="1" />
              <ElOption label="推荐" value="1.2" />
              <ElOption label="快速" value="1.5" />
              <ElOption label="很快" value="1.8" />
              <ElOption label="最快" value="2" />
            </ElSelect>
          </div>
          <div class="form-group">
            <label class="form-label">音量</label>
            <ElSelect v-model="zhipuTtsVolume" class="ui-control">
              <ElOption label="稍低" value="0.8" />
              <ElOption label="正常" value="1" />
              <ElOption label="稍高" value="1.2" />
            </ElSelect>
          </div>
        </div>
        <div class="toggle-row">
          <span>超情感表达</span>
          <ElSwitch v-model="zhipuTtsEmotionEnabled" />
        </div>
        <div v-if="zhipuTtsEmotionEnabled" class="form-row">
          <div class="form-group">
            <label class="form-label">情绪风格</label>
            <ElSelect v-model="zhipuTtsEmotionStyle" class="ui-control">
              <ElOption v-for="style in zhipuEmotionStyles" :key="style.value" :label="style.label" :value="style.value" />
            </ElSelect>
          </div>
          <div class="form-group">
            <label class="form-label">标注粒度</label>
            <ElSelect v-model="zhipuTtsEmotionGranularity" class="ui-control">
              <ElOption label="每句话" value="sentence" />
              <ElOption label="每一段" value="paragraph" />
            </ElSelect>
          </div>
        </div>
        <p v-if="zhipuTtsEmotionEnabled" class="settings-hint">
          智谱当前接口没有隐藏情绪标签字段。为避免读出“开心、温柔”等标签，朗读请求会保持原文，不再注入可读情绪标签。
        </p>
      </template>
    </div>

    <!-- 数据管理 -->
    <div class="card settings-section">
      <div class="card-title">数据管理</div>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">
        所有数据（角色配置、聊天记录、API Key）都保存在本地浏览器中。清空浏览器数据将会删除所有信息。
      </p>
      <div style="display:flex;gap:8px">
        <ElButton type="danger" @click="handleClearConversations">清空所有会话</ElButton>
        <ElButton type="danger" @click="handleClearAll">清空全部数据</ElButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { useApiKeyStore } from '../stores/apiKey'
import { useCharacterStore } from '../stores/character'
import { useConversationStore } from '../stores/conversation'
import { useMessageStore } from '../stores/message'
import { useVoiceStore } from '../stores/voice'
import { defaultPreferences } from '../local-data/preferences'
import { projectInfo } from '../local-data/projectInfo'
import { storageKeys } from '../local-data/storageKeys'
import { edgeEmotionStyles, edgeTtsVoices, ttsPreviewText, zhipuEmotionStyles, zhipuTtsVoices } from '../local-data/ttsVoices'
import { blobToDataURL, convertAudioBlobToWav } from '../utils/voice'
import type { LocalTtsVoice, TTSConfig } from '@ai-chat/shared'

const apiKeyStore = useApiKeyStore()
const characterStore = useCharacterStore()
const conversationStore = useConversationStore()
const messageStore = useMessageStore()
const voiceStore = useVoiceStore()

const keyInput = ref('')
const error = ref('')
const success = ref('')
const validating = ref(false)
const validated = ref(false)
const previewingVoice = ref<string | null>(null)
const localVoices = ref<LocalTtsVoice[]>([])
const localTtsVoiceId = ref(localStorage.getItem(storageKeys.localTtsVoiceId) || '')
const localTtsAvailable = ref<boolean | null>(null)
const localTtsStatus = ref('正在检查本地服务...')
const localTtsLoading = ref(false)
const localVoiceRecordingScript = '你好，欢迎使用我的自定义音色。今天的天气很不错，我正在用平稳、自然的语气录制一段参考声音。希望这段声音清晰、流畅，能够准确保留我的说话特点。'
const localVoiceName = ref('')
const localVoiceTranscript = ref(localVoiceRecordingScript)
const localVoiceWav = ref<Blob | null>(null)
const localVoiceDuration = ref(0)
const localVoiceSourceLabel = ref('')
const localVoiceRecording = ref(false)
const localVoiceProcessing = ref(false)
const localVoiceSaving = ref(false)

type ModelProvider = keyof typeof defaultPreferences.providers

function normalizeModelProvider(value: string | null): ModelProvider {
  return value === 'zhipu' ? 'zhipu' : 'deepseek'
}

function normalizeSTTProvider(value: string | null): 'browser' | 'faster-whisper' | 'funasr' {
  return value === 'browser' || value === 'faster-whisper' || value === 'funasr' ? value : 'faster-whisper'
}

const providerDefaults = defaultPreferences.providers
const modelProvider = ref<ModelProvider>(normalizeModelProvider(localStorage.getItem(storageKeys.modelProvider)))
const defaultModel = ref(localStorage.getItem(storageKeys.defaultModel) || providerDefaults[modelProvider.value].model)
const baseURL = ref(localStorage.getItem(storageKeys.baseURL) || providerDefaults[modelProvider.value].baseURL)
if (
  (modelProvider.value === 'zhipu' && defaultModel.value.startsWith('deepseek')) ||
  (modelProvider.value === 'deepseek' && defaultModel.value.startsWith('glm'))
) {
  defaultModel.value = providerDefaults[modelProvider.value].model
  baseURL.value = providerDefaults[modelProvider.value].baseURL
  localStorage.setItem(storageKeys.defaultModel, defaultModel.value)
  localStorage.setItem(storageKeys.baseURL, baseURL.value)
}
const sttProvider = ref(normalizeSTTProvider(localStorage.getItem(storageKeys.sttProvider)))
const localWhisperModel = ref(localStorage.getItem(storageKeys.localWhisperModel) || defaultPreferences.stt.localModel)
const sttLanguage = ref(localStorage.getItem(storageKeys.sttLanguage) || defaultPreferences.stt.language)
const ttsProvider = ref(localStorage.getItem(storageKeys.ttsProvider) || defaultPreferences.tts.provider)
const edgeTtsVoice = ref(localStorage.getItem(storageKeys.edgeTtsVoice) || defaultPreferences.tts.edgeVoice)
const edgeTtsRate = ref(localStorage.getItem(storageKeys.edgeTtsRate) || defaultPreferences.tts.edgeRate)
const edgeTtsPitch = ref(localStorage.getItem(storageKeys.edgeTtsPitch) || defaultPreferences.tts.edgePitch)
const edgeTtsVolume = ref(localStorage.getItem(storageKeys.edgeTtsVolume) || defaultPreferences.tts.edgeVolume)
const edgeTtsEmotionEnabled = ref(localStorage.getItem(storageKeys.edgeTtsEmotionEnabled) === 'true')
const edgeTtsEmotionStyle = ref(localStorage.getItem(storageKeys.edgeTtsEmotionStyle) || defaultPreferences.tts.edgeEmotionStyle)
const elevenLabsApiKey = ref(localStorage.getItem(storageKeys.elevenLabsApiKey) || '')
const elevenLabsVoiceId = ref(localStorage.getItem(storageKeys.elevenLabsVoiceId) || defaultPreferences.tts.elevenLabsVoiceId)
const elevenLabsModelId = ref(localStorage.getItem(storageKeys.elevenLabsModelId) || defaultPreferences.tts.elevenLabsModelId)
const elevenLabsStability = ref(Number(localStorage.getItem(storageKeys.elevenLabsStability) || defaultPreferences.tts.elevenLabsStability))
const elevenLabsSimilarityBoost = ref(Number(localStorage.getItem(storageKeys.elevenLabsSimilarityBoost) || defaultPreferences.tts.elevenLabsSimilarityBoost))
const elevenLabsStyle = ref(Number(localStorage.getItem(storageKeys.elevenLabsStyle) || defaultPreferences.tts.elevenLabsStyle))
const zhipuTtsApiKey = ref(localStorage.getItem(storageKeys.zhipuTtsApiKey) || '')
const zhipuTtsKeyValidating = ref(false)
const zhipuTtsKeyValidated = ref(Boolean(
  zhipuTtsApiKey.value && localStorage.getItem(storageKeys.zhipuTtsApiKeyLastValidated),
))
const zhipuTtsKeyError = ref('')
const zhipuTtsVoice = ref(localStorage.getItem(storageKeys.zhipuTtsVoice) || defaultPreferences.tts.zhipuVoice)
const storedZhipuTtsSpeed = localStorage.getItem(storageKeys.zhipuTtsSpeed)
const zhipuTtsSpeed = ref(storedZhipuTtsSpeed === '1' ? defaultPreferences.tts.zhipuSpeed : storedZhipuTtsSpeed || defaultPreferences.tts.zhipuSpeed)
const zhipuTtsVolume = ref(localStorage.getItem(storageKeys.zhipuTtsVolume) || defaultPreferences.tts.zhipuVolume)
const zhipuTtsEmotionEnabled = ref(localStorage.getItem(storageKeys.zhipuTtsEmotionEnabled) === 'true')
const zhipuTtsEmotionStyle = ref(localStorage.getItem(storageKeys.zhipuTtsEmotionStyle) || defaultPreferences.tts.zhipuEmotionStyle)
const zhipuTtsEmotionGranularity = ref(localStorage.getItem(storageKeys.zhipuTtsEmotionGranularity) || defaultPreferences.tts.zhipuEmotionGranularity)
const currentProviderLabel = computed(() => modelProvider.value === 'zhipu' ? '智谱' : 'DeepSeek')
const maskedZhipuTtsApiKey = computed(() => {
  const key = zhipuTtsApiKey.value
  if (key.length <= 8) return '****'
  return `${key.slice(0, 4)}****${key.slice(-4)}`
})
const canCreateLocalVoice = computed(() => Boolean(
  localVoiceName.value.trim() && localVoiceTranscript.value.trim() && localVoiceWav.value,
))

function showSaved(message = '设置已保存') {
  ElMessage({
    message,
    type: 'success',
    grouping: true,
    duration: 1600,
  })
}

async function previewVoice(previewKey: string, config: TTSConfig) {
  previewingVoice.value = previewKey
  try {
    await voiceStore.speakText(ttsPreviewText, config)
  } catch (err: any) {
    ElMessage.error(err?.message || '试听失败')
  } finally {
    previewingVoice.value = null
  }
}

function handlePreviewEdgeVoice(voice: string) {
  return previewVoice(`edge:${voice}`, {
    provider: 'edge',
    edgeVoice: voice,
    edgeRate: edgeTtsRate.value,
    edgePitch: edgeTtsPitch.value,
    edgeVolume: edgeTtsVolume.value,
    edgeEmotionEnabled: edgeTtsEmotionEnabled.value,
    edgeEmotionStyle: edgeTtsEmotionStyle.value as TTSConfig['edgeEmotionStyle'],
  })
}

function handlePreviewElevenLabsVoice() {
  return previewVoice('elevenlabs:current', {
    provider: 'elevenlabs',
    elevenLabsApiKey: elevenLabsApiKey.value,
    elevenLabsVoiceId: elevenLabsVoiceId.value,
    elevenLabsModelId: elevenLabsModelId.value,
    elevenLabsStability: Number(elevenLabsStability.value),
    elevenLabsSimilarityBoost: Number(elevenLabsSimilarityBoost.value),
    elevenLabsStyle: Number(elevenLabsStyle.value),
  })
}

function handlePreviewZhipuVoice(voice: string) {
  return previewVoice(`zhipu:${voice}`, {
    provider: 'zhipu',
    zhipuVoice: voice,
    zhipuSpeed: Number(zhipuTtsSpeed.value),
    zhipuVolume: Number(zhipuTtsVolume.value),
    zhipuEmotionEnabled: zhipuTtsEmotionEnabled.value,
    zhipuEmotionStyle: zhipuTtsEmotionStyle.value as TTSConfig['zhipuEmotionStyle'],
    zhipuEmotionGranularity: zhipuTtsEmotionGranularity.value as TTSConfig['zhipuEmotionGranularity'],
  })
}

function handlePreviewLocalVoice() {
  if (!localTtsVoiceId.value) return
  return previewVoice(`qwen-local:${localTtsVoiceId.value}`, {
    provider: 'qwen-local',
    localVoiceId: localTtsVoiceId.value,
  })
}

async function refreshLocalTts() {
  localTtsLoading.value = true
  try {
    const [healthResponse, voicesResponse] = await Promise.all([
      fetch('/api/tts/local/health'),
      fetch('/api/tts/local/voices'),
    ])
    localTtsAvailable.value = healthResponse.ok
    localTtsStatus.value = healthResponse.ok ? '本地 Qwen3-TTS 服务已就绪' : '本地 Qwen3-TTS 服务未启动'

    if (voicesResponse.ok) {
      const data = await voicesResponse.json() as { voices?: LocalTtsVoice[] }
      localVoices.value = data.voices || []
      if (localTtsVoiceId.value && !localVoices.value.some((voice) => voice.id === localTtsVoiceId.value)) {
        localTtsVoiceId.value = ''
      }
    }
  } catch {
    localTtsAvailable.value = false
    localTtsStatus.value = '无法连接本地 Qwen3-TTS 服务'
  } finally {
    localTtsLoading.value = false
  }
}

async function prepareLocalVoiceAudio(blob: Blob, label: string) {
  localVoiceProcessing.value = true
  try {
    const converted = await convertAudioBlobToWav(blob)
    localVoiceWav.value = converted.blob
    localVoiceDuration.value = converted.durationSeconds
    localVoiceSourceLabel.value = label
  } finally {
    localVoiceProcessing.value = false
  }
}

async function handleLocalAudioUpload(uploadFile: UploadFile) {
  const file = uploadFile.raw
  if (!file) return

  voiceStore.resetRecording()
  localVoiceTranscript.value = localVoiceRecordingScript
  if (!localVoiceName.value.trim()) localVoiceName.value = file.name.replace(/\.[^.]+$/, '')
  try {
    await prepareLocalVoiceAudio(file, file.name)
  } catch (error: any) {
    ElMessage.error(error?.message || '参考音频处理失败')
  }
}

async function handleStartLocalVoiceRecording() {
  try {
    localVoiceTranscript.value = localVoiceRecordingScript
    await voiceStore.startRecording()
    localVoiceRecording.value = true
  } catch (error: any) {
    ElMessage.error(error?.message === 'VOICE_PERMISSION_DENIED' ? '请允许浏览器使用麦克风' : '无法开始录音')
  }
}

async function handleStopLocalVoiceRecording() {
  localVoiceRecording.value = false
  const blob = await voiceStore.stopRecording()
  if (!blob) {
    ElMessage.error('没有获取到录音')
    return
  }

  if (!localVoiceName.value.trim()) localVoiceName.value = `我的音色 ${localVoices.value.length + 1}`
  try {
    await prepareLocalVoiceAudio(blob, '麦克风录音')
  } catch (error: any) {
    ElMessage.error(error?.message || '录音处理失败')
  }
}

async function handleCreateLocalVoice() {
  if (!localVoiceWav.value || !canCreateLocalVoice.value) return
  localVoiceSaving.value = true
  try {
    const response = await fetch('/api/tts/local/voices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: localVoiceName.value.trim(),
        transcript: localVoiceTranscript.value.trim(),
        audioDataUrl: await blobToDataURL(localVoiceWav.value),
      }),
    })
    const data = await response.json().catch(() => ({})) as { voice?: LocalTtsVoice; message?: string }
    if (!response.ok || !data.voice) throw new Error(data.message || '创建音色失败')

    await refreshLocalTts()
    localTtsVoiceId.value = data.voice.id
    localVoiceName.value = ''
    localVoiceTranscript.value = localVoiceRecordingScript
    localVoiceWav.value = null
    localVoiceDuration.value = 0
    localVoiceSourceLabel.value = ''
    voiceStore.resetRecording()
    ElMessage.success('本地复刻音色已创建')
  } catch (error: any) {
    ElMessage.error(error?.message || '创建音色失败')
  } finally {
    localVoiceSaving.value = false
  }
}

async function handleDeleteLocalVoice() {
  if (!localTtsVoiceId.value) return
  const voice = localVoices.value.find((item) => item.id === localTtsVoiceId.value)
  try {
    await ElMessageBox.confirm(`确定删除音色“${voice?.name || '未命名'}”吗？`, '删除本地音色', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  const response = await fetch(`/api/tts/local/voices/${encodeURIComponent(localTtsVoiceId.value)}`, { method: 'DELETE' })
  if (!response.ok) {
    ElMessage.error('删除音色失败')
    return
  }
  localTtsVoiceId.value = ''
  await refreshLocalTts()
  ElMessage.success('本地音色已删除')
}

watch(modelProvider, (value) => {
  localStorage.setItem(storageKeys.modelProvider, value)
  defaultModel.value = providerDefaults[value].model
  baseURL.value = providerDefaults[value].baseURL
  validated.value = false
  showSaved('模型服务商已保存')
})

watch(defaultModel, (value) => {
  localStorage.setItem(storageKeys.defaultModel, value)
  showSaved('默认模型已保存')
})

watch(baseURL, (value) => {
  localStorage.setItem(storageKeys.baseURL, value)
})

watch(sttProvider, (value) => {
  localStorage.setItem(storageKeys.sttProvider, value)
  showSaved('语音识别设置已保存')
})

watch(localWhisperModel, (value) => {
  localStorage.setItem(storageKeys.localWhisperModel, value)
  showSaved('本地识别模型已保存')
})

watch(sttLanguage, (value) => {
  localStorage.setItem(storageKeys.sttLanguage, value)
  showSaved('识别语言已保存')
})

watch(ttsProvider, (value) => {
  localStorage.setItem(storageKeys.ttsProvider, value)
  showSaved('朗读引擎已保存')
})

watch(localTtsVoiceId, (value) => {
  if (value) localStorage.setItem(storageKeys.localTtsVoiceId, value)
  else localStorage.removeItem(storageKeys.localTtsVoiceId)
})

watch(edgeTtsVoice, (value) => {
  localStorage.setItem(storageKeys.edgeTtsVoice, value)
  showSaved('Edge TTS 音色已保存')
})

watch(edgeTtsRate, (value) => {
  localStorage.setItem(storageKeys.edgeTtsRate, value)
  showSaved('Edge TTS 语速已保存')
})

watch(edgeTtsPitch, (value) => {
  localStorage.setItem(storageKeys.edgeTtsPitch, value)
  showSaved('Edge TTS 音调已保存')
})

watch(edgeTtsVolume, (value) => {
  localStorage.setItem(storageKeys.edgeTtsVolume, value)
  showSaved('Edge TTS 音量已保存')
})

watch(edgeTtsEmotionEnabled, (value) => {
  localStorage.setItem(storageKeys.edgeTtsEmotionEnabled, String(value))
  showSaved(value ? 'Edge 隐藏情绪控制已开启' : 'Edge 隐藏情绪控制已关闭')
})

watch(edgeTtsEmotionStyle, (value) => {
  localStorage.setItem(storageKeys.edgeTtsEmotionStyle, value)
  showSaved('Edge 情绪风格已保存')
})

watch(elevenLabsApiKey, (value) => {
  if (value) {
    localStorage.setItem(storageKeys.elevenLabsApiKey, value)
  } else {
    localStorage.removeItem(storageKeys.elevenLabsApiKey)
  }
})

watch(elevenLabsVoiceId, (value) => {
  localStorage.setItem(storageKeys.elevenLabsVoiceId, value || defaultPreferences.tts.elevenLabsVoiceId)
})

watch(elevenLabsModelId, (value) => {
  localStorage.setItem(storageKeys.elevenLabsModelId, value)
  showSaved('ElevenLabs 模型已保存')
})

watch(elevenLabsStability, (value) => {
  localStorage.setItem(storageKeys.elevenLabsStability, String(value))
})

watch(elevenLabsSimilarityBoost, (value) => {
  localStorage.setItem(storageKeys.elevenLabsSimilarityBoost, String(value))
})

watch(elevenLabsStyle, (value) => {
  localStorage.setItem(storageKeys.elevenLabsStyle, String(value))
})

watch(zhipuTtsApiKey, (value) => {
  if (value.trim() !== localStorage.getItem(storageKeys.zhipuTtsApiKey)) {
    zhipuTtsKeyValidated.value = false
  }
  zhipuTtsKeyError.value = ''
})

watch(zhipuTtsVoice, (value) => {
  localStorage.setItem(storageKeys.zhipuTtsVoice, value)
  showSaved('智谱 TTS 音色已保存')
})

watch(zhipuTtsSpeed, (value) => {
  localStorage.setItem(storageKeys.zhipuTtsSpeed, value)
})

watch(zhipuTtsVolume, (value) => {
  localStorage.setItem(storageKeys.zhipuTtsVolume, value)
})

watch(zhipuTtsEmotionEnabled, (value) => {
  localStorage.setItem(storageKeys.zhipuTtsEmotionEnabled, String(value))
  showSaved(value ? '智谱超情感表达已开启' : '智谱超情感表达已关闭')
})

watch(zhipuTtsEmotionStyle, (value) => {
  localStorage.setItem(storageKeys.zhipuTtsEmotionStyle, value)
  showSaved('智谱情绪风格已保存')
})

watch(zhipuTtsEmotionGranularity, (value) => {
  localStorage.setItem(storageKeys.zhipuTtsEmotionGranularity, value)
  showSaved('智谱情绪标注粒度已保存')
})

async function handleValidateZhipuTtsKey() {
  const key = zhipuTtsApiKey.value.trim()
  if (!key) {
    zhipuTtsKeyError.value = '请输入智谱朗读 API Key'
    ElMessage.warning(zhipuTtsKeyError.value)
    return
  }

  zhipuTtsKeyValidating.value = true
  zhipuTtsKeyError.value = ''

  try {
    const response = await fetch('/api/tts/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Model-Api-Key': key,
      },
      body: JSON.stringify({
        provider: 'zhipu',
        text: '你好',
        zhipuVoice: zhipuTtsVoice.value,
        zhipuSpeed: 1,
        zhipuVolume: 1,
        zhipuStream: false,
        zhipuBaseURL: defaultPreferences.providers.zhipu.baseURL,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '智谱朗读 Key 校验失败' }))
      throw new Error(error.message || '智谱朗读 Key 校验失败')
    }

    const audio = await response.arrayBuffer()
    if (audio.byteLength === 0) {
      throw new Error('智谱朗读接口未返回音频')
    }

    localStorage.setItem(storageKeys.zhipuTtsApiKey, key)
    localStorage.setItem(storageKeys.zhipuTtsApiKeyLastValidated, new Date().toISOString())
    zhipuTtsApiKey.value = key
    zhipuTtsKeyValidated.value = true
    ElMessage.success('智谱朗读 Key 已验证并保存')
  } catch (err: any) {
    zhipuTtsKeyValidated.value = false
    zhipuTtsKeyError.value = err?.message || '智谱朗读 Key 校验失败'
    ElMessage.error(zhipuTtsKeyError.value)
  } finally {
    zhipuTtsKeyValidating.value = false
  }
}

function handleChangeZhipuTtsKey() {
  zhipuTtsKeyValidated.value = false
  zhipuTtsKeyError.value = ''
}

function handleClearZhipuTtsKey() {
  zhipuTtsApiKey.value = ''
  zhipuTtsKeyValidated.value = false
  zhipuTtsKeyError.value = ''
  localStorage.removeItem(storageKeys.zhipuTtsApiKey)
  localStorage.removeItem(storageKeys.zhipuTtsApiKeyLastValidated)
  ElMessage.success('智谱朗读 Key 已清空')
}

onMounted(() => {
  if (apiKeyStore.apiKey) {
    validated.value = true
  }
  refreshLocalTts()
})

async function handleValidate() {
  const key = keyInput.value || apiKeyStore.apiKey
  if (!key) {
    error.value = '请输入 API Key'
    ElMessage.warning(error.value)
    return
  }

  validating.value = true
  error.value = ''
  success.value = ''

  try {
    const res = await fetch('/api/keys/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: key,
        provider: modelProvider.value,
        model: defaultModel.value,
        baseURL: baseURL.value,
      })
    })
    const data = await res.json()

    if (data.ok) {
      apiKeyStore.saveKey(key, data.maskedKey)
      validated.value = true
      success.value = 'API Key 验证通过！'
      keyInput.value = ''
      ElMessage.success('API Key 已验证并保存')
    } else {
      error.value = data.message || 'Key 无效'
      ElMessage.error(error.value)
    }
  } catch (err: any) {
    error.value = '验证失败：' + (err.message || '网络错误')
    ElMessage.error(error.value)
  } finally {
    validating.value = false
  }
}

function handleChangeKey() {
  keyInput.value = apiKeyStore.apiKey
  apiKeyStore.clearKey()
  keyInput.value = ''
  validated.value = false
  success.value = ''
  ElMessage.info('已进入更换 Key 状态')
}

function handleClearKey() {
  apiKeyStore.clearKey()
  keyInput.value = ''
  validated.value = false
  success.value = ''
  ElMessage.success('API Key 已清空')
}

async function handleClearConversations() {
  try {
    await ElMessageBox.confirm('确定清空所有会话记录吗？此操作不可恢复。', '清空会话', {
      confirmButtonText: '清空',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  await conversationStore.clearConversations()
  success.value = '所有会话已清空'
  ElMessage.success('所有会话已清空')
}

async function handleClearAll() {
  try {
    await ElMessageBox.confirm('确定清空全部数据（角色、会话、消息）吗？此操作不可恢复。', '清空全部数据', {
      confirmButtonText: '全部清空',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  await characterStore.clearCharacters()
  await conversationStore.clearConversations()
  apiKeyStore.clearKey()
  Object.values(storageKeys).forEach((key) => localStorage.removeItem(key))
  success.value = '全部数据已清空'
  validated.value = false
  ElMessage.success('全部本地数据已清空')
}
</script>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.info-title {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.info-list {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
  padding-left: 18px;
}

.static-field {
  display: flex;
  align-items: center;
  min-height: 40px;
  color: var(--text-secondary);
}

.settings-hint {
  margin-top: -4px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.5;
}

.local-tts-status {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  margin-bottom: 16px;
  color: var(--text-secondary);
  font-size: 13px;
}

.local-tts-status .btn,
.local-tts-status .el-button {
  margin-left: auto;
}

.status-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  background: var(--danger, #dc2626);
}

.local-tts-status.ready .status-dot {
  background: var(--success, #16a34a);
}

.local-voice-editor {
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.local-recording-guide {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-left: 3px solid var(--primary-color);
  background: var(--bg-secondary);
}

.local-recording-guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-size: 14px;
}

.local-recording-guide p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.75;
}

.local-audio-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 40px;
}

.file-button input {
  display: none;
}

.local-audio-meta {
  color: var(--text-secondary);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.local-tts-hint {
  margin: 10px 0 0;
}

@media (max-width: 640px) {
  .local-recording-guide-header {
    align-items: flex-start;
  }

  .voice-input-row {
    flex-wrap: wrap;
  }

  .voice-input-row .form-input,
  .voice-input-row .el-select,
  .voice-input-row .el-input {
    flex-basis: 100%;
  }
}
</style>
