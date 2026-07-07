<template>
  <div class="page">
    <h1 class="page-title">设置</h1>

    <!-- API Key -->
    <div class="card settings-section">
      <div class="card-title">DeepSeek API Key</div>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;line-height:1.5">
        你的 API Key 只会用于请求 DeepSeek。MVP 模式下 Key 保存在本机浏览器，后端不会长期保存。请不要在公共设备上选择记住 Key。
      </p>

      <div v-if="!apiKeyStore.apiKey" class="key-input-row">
        <input
          type="password"
          v-model="keyInput"
          placeholder="输入你的 DeepSeek API Key..."
          class="form-input"
          @keyup.enter="handleValidate"
        />
        <button class="btn btn-primary" @click="handleValidate" :disabled="validating">
          {{ validating ? '验证中...' : '验证并保存' }}
        </button>
      </div>

      <div v-else>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <span class="key-masked">{{ apiKeyStore.maskedKey }}</span>
          <span v-if="validated" class="success-banner" style="margin:0;padding:4px 12px">已验证</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" @click="handleChangeKey">更换 Key</button>
          <button class="btn btn-danger" @click="handleClearKey">清空 Key</button>
          <button class="btn btn-secondary" @click="handleValidate" :disabled="validating">
            {{ validating ? '验证中...' : '重新验证' }}
          </button>
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
        <label class="form-label">默认模型</label>
        <select class="form-input" v-model="defaultModel">
          <option value="deepseek-v4-flash">deepseek-v4-flash（推荐，速度快）</option>
          <option value="deepseek-v4-pro">deepseek-v4-pro（质量高）</option>
          <option value="deepseek-chat">deepseek-chat（旧版，即将废弃）</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">API Base URL</label>
        <input class="form-input" v-model="baseURL" placeholder="https://api.deepseek.com" />
      </div>
    </div>

    <!-- 语音转文字设置 -->
    <div class="card settings-section">
      <div class="card-title">语音转文字设置</div>
      <div class="form-group">
        <label class="form-label">识别引擎</label>
        <select class="form-input" v-model="sttProvider">
          <option value="browser">浏览器识别（无需 Key，不稳定）</option>
          <option value="faster-whisper">本地 faster-whisper（无需 Key，需启动本地服务）</option>
          <option value="funasr">本地 FunASR（中文优化，需启动本地服务）</option>
        </select>
      </div>

      <template v-if="sttProvider !== 'browser'">
        <div class="form-row">
          <div v-if="sttProvider === 'faster-whisper'" class="form-group">
            <label class="form-label">本地模型</label>
            <select class="form-input" v-model="localWhisperModel">
              <option value="base">base（推荐，速度和效果均衡）</option>
              <option value="small">small（更准，首次下载更久）</option>
              <option value="tiny">tiny（最快，效果一般）</option>
            </select>
          </div>
          <div v-else class="form-group">
            <label class="form-label">本地模型</label>
            <div class="form-input static-field">paraformer-zh + fsmn-vad + ct-punc</div>
          </div>
          <div class="form-group">
            <label class="form-label">识别语言</label>
            <select class="form-input" v-model="sttLanguage">
              <option value="zh">中文</option>
              <option value="">自动识别</option>
              <option value="en">英文</option>
            </select>
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
        <select class="form-input" v-model="ttsProvider">
          <option value="browser">系统朗读（本机浏览器）</option>
          <option value="edge">Edge TTS（免费，无需 Key）</option>
          <option value="elevenlabs">ElevenLabs（更自然、有情绪）</option>
        </select>
      </div>

      <template v-if="ttsProvider === 'edge'">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">中文音色</label>
            <select class="form-input" v-model="edgeTtsVoice">
              <option value="zh-CN-XiaoxiaoNeural">晓晓（女声，自然）</option>
              <option value="zh-CN-XiaoyiNeural">晓伊（女声，亲和）</option>
              <option value="zh-CN-YunjianNeural">云健（男声，热情）</option>
              <option value="zh-CN-YunxiNeural">云希（男声，年轻）</option>
              <option value="zh-CN-YunxiaNeural">云夏（男声，可爱）</option>
              <option value="zh-CN-YunyangNeural">云扬（男声，稳重）</option>
              <option value="zh-CN-liaoning-XiaobeiNeural">东北话小北</option>
              <option value="zh-CN-shaanxi-XiaoniNeural">陕西话小妮</option>
              <option value="zh-HK-HiuGaaiNeural">粤语晓佳（女声）</option>
              <option value="zh-HK-HiuMaanNeural">粤语晓曼（女声）</option>
              <option value="zh-HK-WanLungNeural">粤语云龙（男声）</option>
              <option value="zh-TW-HsiaoChenNeural">台湾晓臻（女声）</option>
              <option value="zh-TW-HsiaoYuNeural">台湾晓雨（女声）</option>
              <option value="zh-TW-YunJheNeural">台湾云哲（男声）</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">语速</label>
            <select class="form-input" v-model="edgeTtsRate">
              <option value="-20%">慢一点</option>
              <option value="-10%">稍慢</option>
              <option value="+0%">正常</option>
              <option value="+10%">稍快</option>
              <option value="+20%">快一点</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">音调</label>
            <select class="form-input" v-model="edgeTtsPitch">
              <option value="-10Hz">低一点</option>
              <option value="+0Hz">正常</option>
              <option value="+10Hz">高一点</option>
              <option value="+20Hz">更活泼</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">音量</label>
            <select class="form-input" v-model="edgeTtsVolume">
              <option value="-20%">小一点</option>
              <option value="+0%">正常</option>
              <option value="+20%">大一点</option>
            </select>
          </div>
        </div>
      </template>

      <template v-if="ttsProvider === 'elevenlabs'">
        <div class="form-group">
          <label class="form-label">ElevenLabs API Key</label>
          <input class="form-input" type="password" v-model="elevenLabsApiKey" placeholder="输入 ElevenLabs API Key" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Voice ID</label>
            <input class="form-input" v-model="elevenLabsVoiceId" placeholder="JBFqnCBsd6RMkjVDRZzb" />
          </div>
          <div class="form-group">
            <label class="form-label">模型</label>
            <select class="form-input" v-model="elevenLabsModelId">
              <option value="eleven_multilingual_v2">multilingual v2（稳定自然）</option>
              <option value="eleven_turbo_v2_5">turbo v2.5（更快）</option>
              <option value="eleven_flash_v2_5">flash v2.5（低延迟）</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">稳定度 {{ elevenLabsStability }}</label>
            <input class="form-input" type="range" min="0" max="1" step="0.05" v-model="elevenLabsStability" />
          </div>
          <div class="form-group">
            <label class="form-label">相似度 {{ elevenLabsSimilarityBoost }}</label>
            <input class="form-input" type="range" min="0" max="1" step="0.05" v-model="elevenLabsSimilarityBoost" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">表现力 {{ elevenLabsStyle }}</label>
          <input class="form-input" type="range" min="0" max="1" step="0.05" v-model="elevenLabsStyle" />
        </div>
      </template>
    </div>

    <!-- 数据管理 -->
    <div class="card settings-section">
      <div class="card-title">数据管理</div>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">
        所有数据（角色配置、聊天记录、API Key）都保存在本地浏览器中。清空浏览器数据将会删除所有信息。
      </p>
      <div style="display:flex;gap:8px">
        <button class="btn btn-danger" @click="handleClearConversations">清空所有会话</button>
        <button class="btn btn-danger" @click="handleClearAll">清空全部数据</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useApiKeyStore } from '../stores/apiKey'
import { useCharacterStore } from '../stores/character'
import { useConversationStore } from '../stores/conversation'
import { useMessageStore } from '../stores/message'
import { defaultPreferences } from '../local-data/preferences'
import { projectInfo } from '../local-data/projectInfo'
import { storageKeys } from '../local-data/storageKeys'

const apiKeyStore = useApiKeyStore()
const characterStore = useCharacterStore()
const conversationStore = useConversationStore()
const messageStore = useMessageStore()

const keyInput = ref('')
const error = ref('')
const success = ref('')
const validating = ref(false)
const validated = ref(false)
function normalizeSTTProvider(value: string | null): 'browser' | 'faster-whisper' | 'funasr' {
  return value === 'browser' || value === 'faster-whisper' || value === 'funasr' ? value : 'faster-whisper'
}

const defaultModel = ref(localStorage.getItem(storageKeys.defaultModel) || defaultPreferences.model)
const baseURL = ref(localStorage.getItem(storageKeys.baseURL) || defaultPreferences.baseURL)
const sttProvider = ref(normalizeSTTProvider(localStorage.getItem(storageKeys.sttProvider)))
const localWhisperModel = ref(localStorage.getItem(storageKeys.localWhisperModel) || defaultPreferences.stt.localModel)
const sttLanguage = ref(localStorage.getItem(storageKeys.sttLanguage) || defaultPreferences.stt.language)
const ttsProvider = ref(localStorage.getItem(storageKeys.ttsProvider) || defaultPreferences.tts.provider)
const edgeTtsVoice = ref(localStorage.getItem(storageKeys.edgeTtsVoice) || defaultPreferences.tts.edgeVoice)
const edgeTtsRate = ref(localStorage.getItem(storageKeys.edgeTtsRate) || defaultPreferences.tts.edgeRate)
const edgeTtsPitch = ref(localStorage.getItem(storageKeys.edgeTtsPitch) || defaultPreferences.tts.edgePitch)
const edgeTtsVolume = ref(localStorage.getItem(storageKeys.edgeTtsVolume) || defaultPreferences.tts.edgeVolume)
const elevenLabsApiKey = ref(localStorage.getItem(storageKeys.elevenLabsApiKey) || '')
const elevenLabsVoiceId = ref(localStorage.getItem(storageKeys.elevenLabsVoiceId) || defaultPreferences.tts.elevenLabsVoiceId)
const elevenLabsModelId = ref(localStorage.getItem(storageKeys.elevenLabsModelId) || defaultPreferences.tts.elevenLabsModelId)
const elevenLabsStability = ref(localStorage.getItem(storageKeys.elevenLabsStability) || defaultPreferences.tts.elevenLabsStability)
const elevenLabsSimilarityBoost = ref(localStorage.getItem(storageKeys.elevenLabsSimilarityBoost) || defaultPreferences.tts.elevenLabsSimilarityBoost)
const elevenLabsStyle = ref(localStorage.getItem(storageKeys.elevenLabsStyle) || defaultPreferences.tts.elevenLabsStyle)

function showSaved(message = '设置已保存') {
  ElMessage({
    message,
    type: 'success',
    grouping: true,
    duration: 1600,
  })
}

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
  localStorage.setItem(storageKeys.elevenLabsStability, value)
})

watch(elevenLabsSimilarityBoost, (value) => {
  localStorage.setItem(storageKeys.elevenLabsSimilarityBoost, value)
})

watch(elevenLabsStyle, (value) => {
  localStorage.setItem(storageKeys.elevenLabsStyle, value)
})

onMounted(() => {
  if (apiKeyStore.apiKey) {
    validated.value = true
  }
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
      body: JSON.stringify({ apiKey: key, model: defaultModel.value })
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
  if (confirm('确定清空所有会话记录吗？此操作不可恢复。')) {
    await conversationStore.clearConversations()
    success.value = '所有会话已清空'
    ElMessage.success('所有会话已清空')
  }
}

async function handleClearAll() {
  if (confirm('确定清空全部数据（角色、会话、消息）吗？此操作不可恢复。')) {
    await characterStore.clearCharacters()
    await conversationStore.clearConversations()
    apiKeyStore.clearKey()
    Object.values(storageKeys).forEach((key) => localStorage.removeItem(key))
    success.value = '全部数据已清空'
    validated.value = false
    ElMessage.success('全部本地数据已清空')
  }
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
</style>
