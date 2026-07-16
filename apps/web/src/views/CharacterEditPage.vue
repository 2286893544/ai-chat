<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">{{ isNew ? '创建角色' : '编辑角色' }}</h1>
      <ElButton @click="router.back()">返回</ElButton>
    </div>

    <div class="card">
      <ElTabs v-model="activeTab" class="character-tabs">
        <ElTabPane label="基础信息" name="basic" />
        <ElTabPane label="性格脾气" name="personality" />
        <ElTabPane label="爱好话题" name="hobbies" />
        <ElTabPane label="语气风格" name="tone" />
        <ElTabPane label="朗读" name="voice" />
        <ElTabPane label="回复规则" name="rules" />
        <ElTabPane label="主动聊天" name="proactive" />
      </ElTabs>

      <!-- 基础信息 -->
      <div v-show="activeTab === 'basic'" class="tab-content">
        <div class="form-group">
          <label class="form-label">角色名称</label>
          <ElInput v-model="form.name" placeholder="例如：小夏、冷面顾问、温柔姐姐" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">性别设定</label>
            <ElSelect v-model="form.gender" class="ui-control">
              <ElOption label="女性" value="female" />
              <ElOption label="男性" value="male" />
              <ElOption label="中性" value="neutral" />
              <ElOption label="不限" value="unknown" />
              <ElOption label="自定义" value="custom" />
            </ElSelect>
          </div>
          <div class="form-group">
            <label class="form-label">年龄设定</label>
            <ElInput v-model="form.ageText" placeholder="例如：20岁左右" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">身份背景</label>
          <ElInput v-model="form.background" type="textarea" :rows="3" placeholder="例如：独立设计师、高冷猫系朋友、职场导师" />
        </div>
        <div class="form-group">
          <label class="form-label">和用户的关系</label>
          <ElSelect
            class="relationship-select"
            v-model="form.relationship"
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            :teleported="false"
            popper-class="relationship-select-popper"
            placeholder="选择或输入关系"
          >
            <ElOption
              v-for="relationship in relationshipSuggestions"
              :key="relationship"
              :label="relationship"
              :value="relationship"
            />
          </ElSelect>
        </div>
      </div>

      <!-- 性格脾气 -->
      <div v-show="activeTab === 'personality'" class="tab-content">
        <div class="form-group">
          <label class="form-label">性格标签</label>
          <TagsInput v-model="form.personalityTags" :suggestions="['温柔','活泼','理性','毒舌','高冷','黏人','成熟','幽默']" />
        </div>
        <div class="form-group">
          <label class="form-label">脾气</label>
          <TagsInput v-model="form.temperTags" :suggestions="['稳定','容易害羞','容易吃醋','直接','急躁','慢热']" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">情绪表达</label>
            <ElSelect v-model="form.emotionExpression" class="ui-control">
              <ElOption label="克制" value="克制" />
              <ElOption label="明显" value="明显" />
              <ElOption label="夸张" value="夸张" />
              <ElOption label="平静" value="平静" />
            </ElSelect>
          </div>
          <div class="form-group">
            <label class="form-label">共情程度</label>
            <ElSelect v-model="form.empathyLevel" class="ui-control">
              <ElOption label="低" value="低" />
              <ElOption label="中" value="中" />
              <ElOption label="高" value="高" />
            </ElSelect>
          </div>
        </div>
      </div>

      <!-- 爱好话题 -->
      <div v-show="activeTab === 'hobbies'" class="tab-content">
        <div class="form-group">
          <label class="form-label">兴趣爱好</label>
          <TagsInput v-model="form.hobbies" :suggestions="['音乐','电影','游戏','健身','旅行','学习','编程','美食','阅读','摄影','运动','动漫']" />
        </div>
        <div class="form-group">
          <label class="form-label">擅长领域</label>
          <TagsInput v-model="form.expertise" :suggestions="['情绪陪伴','英语练习','学习计划','职场建议','生活聊天','技术讨论','创意写作']" />
        </div>
        <div class="form-group">
          <label class="form-label">禁聊话题</label>
          <TagsInput v-model="form.forbiddenTopics" />
        </div>
        <div class="form-group">
          <label class="form-label">常聊话题</label>
          <TagsInput v-model="form.preferredTopics" />
        </div>
      </div>

      <!-- 语气风格 -->
      <div v-show="activeTab === 'tone'" class="tab-content">
        <div class="form-group">
          <label class="form-label">语气</label>
          <TagsInput v-model="form.toneTags" :suggestions="['温柔','俏皮','冷淡','正式','轻松','撒娇','毒舌']" />
          <ElInput v-model="form.tone" placeholder="主要语气（可从上面选择或自行输入）" style="margin-top:8px" />
        </div>
        <div class="form-group">
          <label class="form-label">说话风格</label>
          <ElInput v-model="form.speakingStyle" placeholder="例如：喜欢用比喻、说话带尾音" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">回复长度</label>
            <ElSelect v-model="form.replyLength" class="ui-control">
              <ElOption label="短句" value="short" />
              <ElOption label="中等" value="medium" />
              <ElOption label="详细" value="long" />
            </ElSelect>
          </div>
          <div class="form-group">
            <label class="form-label">表情使用</label>
            <ElSelect v-model="form.emojiLevel" class="ui-control">
              <ElOption label="不用" value="none" />
              <ElOption label="少量" value="low" />
              <ElOption label="适中" value="medium" />
              <ElOption label="多" value="high" />
            </ElSelect>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">称呼用户</label>
          <ElInput v-model="form.userNickname" placeholder="昵称、你、主人、老板..." />
        </div>
        <div class="form-group">
          <label class="form-label">口头禅</label>
          <TagsInput v-model="form.catchphrases" />
        </div>
      </div>

      <!-- 朗读 -->
      <div v-show="activeTab === 'voice'" class="tab-content">
        <div class="toggle-row">
          <span>使用全局朗读设置</span>
          <ElSwitch v-model="form.useGlobalTts" />
        </div>

        <template v-if="!form.useGlobalTts">
          <div class="form-group">
            <label class="form-label">角色朗读引擎</label>
            <ElSelect v-model="form.ttsProvider" class="ui-control">
              <ElOption label="系统朗读（本机浏览器）" value="browser" />
              <ElOption label="本地语音复刻（Qwen3-TTS）" value="qwen-local" />
              <ElOption label="Edge TTS（免费，无需 Key）" value="edge" />
              <ElOption label="ElevenLabs（更自然、有情绪）" value="elevenlabs" />
              <ElOption label="智谱 GLM-TTS" value="zhipu" />
            </ElSelect>
          </div>

          <template v-if="form.ttsProvider === 'qwen-local'">
            <div class="form-group">
              <label class="form-label">复刻音色</label>
              <div class="voice-input-row">
                <ElSelect v-model="form.localTtsVoiceId" class="ui-control" :disabled="localVoices.length === 0">
                  <ElOption :label="localVoices.length ? '请选择音色' : '请先在设置中创建音色'" value="" />
                  <ElOption
                    v-for="voice in localVoices"
                    :key="voice.id"
                    :label="`${voice.name} · ${voice.durationSeconds.toFixed(1)} 秒`"
                    :value="voice.id"
                  />
                </ElSelect>
                <ElButton
                  size="small"
                  :disabled="!form.localTtsVoiceId || previewingVoice !== null"
                  @click="handlePreviewLocalVoice"
                >
                  ▶ {{ previewingVoice === `qwen-local:${form.localTtsVoiceId}` ? '生成中' : '试听' }}
                </ElButton>
              </div>
            </div>
          </template>

          <template v-if="form.ttsProvider === 'edge'">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">中文音色</label>
                <ElSelect v-model="form.edgeTtsVoice" class="ui-control">
                  <ElOption v-for="voice in edgeTtsVoices" :key="voice.value" :label="voice.label" :value="voice.value" />
                </ElSelect>
                <div class="voice-preview-grid">
                  <ElButton
                    v-for="voice in edgeTtsVoices"
                    :key="voice.value"
                    class="voice-preview-btn"
                    :class="{ active: form.edgeTtsVoice === voice.value }"
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
                <ElSelect v-model="form.edgeTtsRate" class="ui-control">
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
                <ElSelect v-model="form.edgeTtsPitch" class="ui-control">
                  <ElOption label="低一点" value="-10Hz" />
                  <ElOption label="正常" value="+0Hz" />
                  <ElOption label="高一点" value="+10Hz" />
                  <ElOption label="更活泼" value="+20Hz" />
                </ElSelect>
              </div>
              <div class="form-group">
                <label class="form-label">音量</label>
                <ElSelect v-model="form.edgeTtsVolume" class="ui-control">
                  <ElOption label="小一点" value="-20%" />
                  <ElOption label="正常" value="+0%" />
                  <ElOption label="大一点" value="+20%" />
                </ElSelect>
              </div>
            </div>
            <div class="toggle-row">
              <span>隐藏情绪控制</span>
              <ElSwitch v-model="form.edgeTtsEmotionEnabled" />
            </div>
            <div v-if="form.edgeTtsEmotionEnabled" class="form-group">
              <label class="form-label">情绪风格</label>
              <ElSelect v-model="form.edgeTtsEmotionStyle" class="ui-control">
                <ElOption v-for="style in edgeEmotionStyles" :key="style.value" :label="style.label" :value="style.value" />
              </ElSelect>
            </div>
            <p v-if="form.edgeTtsEmotionEnabled" class="settings-hint">
              不会向朗读文本添加可读标签，只会在后端按风格调整 Edge TTS 的语速、音调和音量。
            </p>
          </template>

          <template v-if="form.ttsProvider === 'elevenlabs'">
            <div class="form-group">
              <label class="form-label">ElevenLabs API Key</label>
              <ElInput type="password" v-model="form.elevenLabsApiKey" placeholder="留空则使用全局 Key" show-password />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Voice ID</label>
                <div class="voice-input-row">
                  <ElInput v-model="form.elevenLabsVoiceId" placeholder="JBFqnCBsd6RMkjVDRZzb" />
                  <ElButton size="small" :disabled="previewingVoice !== null" @click="handlePreviewElevenLabsVoice">
                    ▶ {{ previewingVoice === 'elevenlabs:current' ? '播放中' : '试听' }}
                  </ElButton>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">模型</label>
                <ElSelect v-model="form.elevenLabsModelId" class="ui-control">
                  <ElOption label="multilingual v2（稳定自然）" value="eleven_multilingual_v2" />
                  <ElOption label="turbo v2.5（更快）" value="eleven_turbo_v2_5" />
                  <ElOption label="flash v2.5（低延迟）" value="eleven_flash_v2_5" />
                </ElSelect>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">稳定度 {{ form.elevenLabsStability }}</label>
                <ElSlider v-model="form.elevenLabsStability" :min="0" :max="1" :step="0.05" />
              </div>
              <div class="form-group">
                <label class="form-label">相似度 {{ form.elevenLabsSimilarityBoost }}</label>
                <ElSlider v-model="form.elevenLabsSimilarityBoost" :min="0" :max="1" :step="0.05" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">表现力 {{ form.elevenLabsStyle }}</label>
              <ElSlider v-model="form.elevenLabsStyle" :min="0" :max="1" :step="0.05" />
            </div>
          </template>

          <template v-if="form.ttsProvider === 'zhipu'">
            <p class="settings-hint">使用全局智谱朗读 API Key；未配置时兼容使用模型 API Key。</p>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">音色</label>
                <ElSelect v-model="form.zhipuTtsVoice" class="ui-control">
                  <ElOption v-for="voice in zhipuTtsVoices" :key="voice.value" :label="voice.label" :value="voice.value" />
                </ElSelect>
                <div class="voice-preview-grid">
                  <ElButton
                    v-for="voice in zhipuTtsVoices"
                    :key="voice.value"
                    class="voice-preview-btn"
                    :class="{ active: form.zhipuTtsVoice === voice.value }"
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
                <ElSelect v-model="form.zhipuTtsSpeed" class="ui-control">
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
                <ElSelect v-model="form.zhipuTtsVolume" class="ui-control">
                  <ElOption label="稍低" value="0.8" />
                  <ElOption label="正常" value="1" />
                  <ElOption label="稍高" value="1.2" />
                </ElSelect>
              </div>
            </div>
            <div class="toggle-row">
              <span>超情感表达</span>
              <ElSwitch v-model="form.zhipuTtsEmotionEnabled" />
            </div>
            <div v-if="form.zhipuTtsEmotionEnabled" class="form-row">
              <div class="form-group">
                <label class="form-label">情绪风格</label>
                <ElSelect v-model="form.zhipuTtsEmotionStyle" class="ui-control">
                  <ElOption v-for="style in zhipuEmotionStyles" :key="style.value" :label="style.label" :value="style.value" />
                </ElSelect>
              </div>
              <div class="form-group">
                <label class="form-label">标注粒度</label>
                <ElSelect v-model="form.zhipuTtsEmotionGranularity" class="ui-control">
                  <ElOption label="每句话" value="sentence" />
                  <ElOption label="每一段" value="paragraph" />
                </ElSelect>
              </div>
            </div>
            <p v-if="form.zhipuTtsEmotionEnabled" class="settings-hint">
              智谱当前接口没有隐藏情绪标签字段。为避免读出“开心、温柔”等标签，朗读请求会保持原文，不再注入可读情绪标签。
            </p>
          </template>
        </template>
      </div>

      <!-- 回复规则 -->
      <div v-show="activeTab === 'rules'" class="tab-content">
        <div class="form-group">
          <label class="form-label">回复规则</label>
        </div>
        <div class="toggle-row">
          <span>主动追问</span>
          <ElSwitch v-model="form.followUp" />
        </div>
        <div class="toggle-row">
          <span>记住上下文</span>
          <ElSwitch v-model="form.rememberContext" />
        </div>
        <div class="toggle-row">
          <span>避免长篇大论</span>
          <ElSwitch v-model="form.avoidLong" />
        </div>
        <div class="toggle-row">
          <span>用户低落时安慰</span>
          <ElSwitch v-model="form.comfortOnLow" />
        </div>
        <div class="toggle-row">
          <span>允许调侃</span>
          <ElSwitch v-model="form.allowTease" />
        </div>
        <div class="toggle-row">
          <span>允许暧昧语气</span>
          <ElSwitch v-model="form.allowFlirty" />
        </div>
        <div class="toggle-row">
          <span>安全边界提示</span>
          <ElSwitch v-model="form.safetyGuard" />
        </div>
      </div>

      <!-- 主动聊天 -->
      <div v-show="activeTab === 'proactive'" class="tab-content">
        <div class="toggle-row">
          <span>开启主动聊天</span>
          <ElSwitch v-model="form.proactiveEnabled" />
        </div>
        <template v-if="form.proactiveEnabled">
          <div class="form-group">
            <label class="form-label">主动程度</label>
            <ElSelect v-model="form.initiativeLevel" class="ui-control">
              <ElOption label="低（很少主动）" value="low" />
              <ElOption label="中（偶尔主动）" value="medium" />
              <ElOption label="高（经常主动）" value="high" />
            </ElSelect>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">最短间隔（分钟）</label>
              <ElInputNumber v-model="form.minInterval" :min="1" controls-position="right" class="ui-control" />
            </div>
            <div class="form-group">
              <label class="form-label">每日最大次数</label>
              <ElInputNumber v-model="form.maxDaily" :min="1" controls-position="right" class="ui-control" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">允许开始时间</label>
              <ElTimePicker v-model="form.activeStart" format="HH:mm" value-format="HH:mm" class="ui-control" />
            </div>
            <div class="form-group">
              <label class="form-label">允许结束时间</label>
              <ElTimePicker v-model="form.activeEnd" format="HH:mm" value-format="HH:mm" class="ui-control" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">主动话题来源</label>
            <ElCheckboxGroup v-model="form.topicSources" class="topic-source-group">
              <ElCheckbox v-for="src in topicSources" :key="src.value" :value="src.value">
                {{ src.label }}
              </ElCheckbox>
            </ElCheckboxGroup>
          </div>
          <div class="toggle-row">
            <span>勿扰模式</span>
            <ElSwitch v-model="form.doNotDisturb" />
          </div>
        </template>
      </div>

      <div style="margin-top: 24px; display: flex; gap: 12px;">
        <ElButton type="primary" @click="handleSave">保存角色</ElButton>
        <ElButton @click="router.back()">取消</ElButton>
        <ElButton style="margin-left:auto" @click="handleReset">重置默认</ElButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElOption, ElSelect } from 'element-plus'
import { useCharacterStore } from '../stores/character'
import { useVoiceStore } from '../stores/voice'
import TagsInput from '../components/TagsInput.vue'
import { rolePresets, type RolePreset } from '../local-data/rolePresets'
import { edgeEmotionStyles, edgeTtsVoices, ttsPreviewText, zhipuEmotionStyles, zhipuTtsVoices } from '../local-data/ttsVoices'
import type { LocalTtsVoice, TTSConfig } from '@ai-chat/shared'
import { v4 as uuidv4 } from 'uuid'

const router = useRouter()
const route = useRoute()
const characterStore = useCharacterStore()
const voiceStore = useVoiceStore()

const isNew = computed(() => route.params.id === 'new' || !route.params.id)
const activeTab = ref('basic')
const previewingVoice = ref<string | null>(null)
const localVoices = ref<LocalTtsVoice[]>([])

const relationshipSuggestions = [
  '朋友',
  '日常聊天搭子',
  '陪伴者',
  '损友但有分寸',
  '青梅竹马',
  '暧昧对象',
  '恋人',
  '姐姐',
  '哥哥',
  '同桌',
  '室友',
  '树洞',
  '守护者',
  '网友',
  '灵魂搭子',
]

const defaultForm = () => ({
  name: '',
  gender: 'female' as const,
  ageText: '',
  background: '',
  relationship: '朋友',
  personalityTags: [] as string[],
  temperTags: [] as string[],
  emotionExpression: '明显',
  empathyLevel: '中',
  hobbies: [] as string[],
  expertise: [] as string[],
  forbiddenTopics: [] as string[],
  preferredTopics: [] as string[],
  toneTags: [] as string[],
  tone: '温柔',
  speakingStyle: '自然',
  catchphrases: [] as string[],
  replyLength: 'medium' as const,
  emojiLevel: 'medium' as const,
  userNickname: '',
  // Voice
  useGlobalTts: true,
  ttsProvider: (localStorage.getItem('ttsProvider') || 'browser') as TTSConfig['provider'],
  localTtsVoiceId: localStorage.getItem('localTtsVoiceId') || '',
  edgeTtsVoice: localStorage.getItem('edgeTtsVoice') || 'zh-CN-XiaoxiaoNeural',
  edgeTtsRate: localStorage.getItem('edgeTtsRate') || '+0%',
  edgeTtsPitch: localStorage.getItem('edgeTtsPitch') || '+0Hz',
  edgeTtsVolume: localStorage.getItem('edgeTtsVolume') || '+0%',
  edgeTtsEmotionEnabled: localStorage.getItem('edgeTtsEmotionEnabled') === 'true',
  edgeTtsEmotionStyle: localStorage.getItem('edgeTtsEmotionStyle') || 'auto',
  elevenLabsApiKey: localStorage.getItem('elevenLabsApiKey') || '',
  elevenLabsVoiceId: localStorage.getItem('elevenLabsVoiceId') || 'JBFqnCBsd6RMkjVDRZzb',
  elevenLabsModelId: localStorage.getItem('elevenLabsModelId') || 'eleven_multilingual_v2',
  elevenLabsStability: localStorage.getItem('elevenLabsStability') || '0.45',
  elevenLabsSimilarityBoost: localStorage.getItem('elevenLabsSimilarityBoost') || '0.75',
  elevenLabsStyle: localStorage.getItem('elevenLabsStyle') || '0.35',
  zhipuTtsVoice: localStorage.getItem('zhipuTtsVoice') || 'tongtong',
  zhipuTtsSpeed: localStorage.getItem('zhipuTtsSpeed') === '1' ? '1.2' : localStorage.getItem('zhipuTtsSpeed') || '1.2',
  zhipuTtsVolume: localStorage.getItem('zhipuTtsVolume') || '1',
  zhipuTtsEmotionEnabled: localStorage.getItem('zhipuTtsEmotionEnabled') === 'true',
  zhipuTtsEmotionStyle: localStorage.getItem('zhipuTtsEmotionStyle') || 'auto',
  zhipuTtsEmotionGranularity: localStorage.getItem('zhipuTtsEmotionGranularity') || 'sentence',
  // Rules
  followUp: true,
  rememberContext: true,
  avoidLong: false,
  comfortOnLow: true,
  allowTease: false,
  allowFlirty: false,
  safetyGuard: true,
  // Proactive
  proactiveEnabled: true,
  initiativeLevel: 'medium' as const,
  minInterval: 5,
  maxDaily: 10,
  activeStart: '09:00',
  activeEnd: '23:00',
  topicSources: ['recent_context', 'hobbies'] as string[],
  doNotDisturb: false,
})

const form = reactive(defaultForm())

const topicSources = [
  { value: 'recent_context', label: '最近上下文' },
  { value: 'hobbies', label: '兴趣爱好' },
  { value: 'fixed_greeting', label: '固定问候' },
  { value: 'random', label: '随机话题' },
]

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
    edgeRate: form.edgeTtsRate,
    edgePitch: form.edgeTtsPitch,
    edgeVolume: form.edgeTtsVolume,
    edgeEmotionEnabled: form.edgeTtsEmotionEnabled,
    edgeEmotionStyle: form.edgeTtsEmotionStyle as TTSConfig['edgeEmotionStyle'],
  })
}

function handlePreviewElevenLabsVoice() {
  return previewVoice('elevenlabs:current', {
    provider: 'elevenlabs',
    elevenLabsApiKey: form.elevenLabsApiKey || undefined,
    elevenLabsVoiceId: form.elevenLabsVoiceId,
    elevenLabsModelId: form.elevenLabsModelId,
    elevenLabsStability: Number(form.elevenLabsStability),
    elevenLabsSimilarityBoost: Number(form.elevenLabsSimilarityBoost),
    elevenLabsStyle: Number(form.elevenLabsStyle),
  })
}

function handlePreviewZhipuVoice(voice: string) {
  return previewVoice(`zhipu:${voice}`, {
    provider: 'zhipu',
    zhipuVoice: voice,
    zhipuSpeed: Number(form.zhipuTtsSpeed),
    zhipuVolume: Number(form.zhipuTtsVolume),
    zhipuEmotionEnabled: form.zhipuTtsEmotionEnabled,
    zhipuEmotionStyle: form.zhipuTtsEmotionStyle as TTSConfig['zhipuEmotionStyle'],
    zhipuEmotionGranularity: form.zhipuTtsEmotionGranularity as TTSConfig['zhipuEmotionGranularity'],
  })
}

function handlePreviewLocalVoice() {
  if (!form.localTtsVoiceId) return
  return previewVoice(`qwen-local:${form.localTtsVoiceId}`, {
    provider: 'qwen-local',
    localVoiceId: form.localTtsVoiceId,
  })
}

function applyPreset(preset: RolePreset) {
  Object.assign(form, {
    name: preset.name,
    gender: preset.gender || 'neutral',
    ageText: preset.ageText || '',
    background: preset.background,
    relationship: preset.relationship,
    personalityTags: [...preset.personalityTags],
    temperTags: [...preset.temperTags],
    hobbies: [...preset.hobbies],
    expertise: [...preset.expertise],
    forbiddenTopics: [...preset.forbiddenTopics],
    preferredTopics: [...preset.preferredTopics],
    tone: preset.tone,
    toneTags: [preset.tone],
    speakingStyle: preset.speakingStyle,
    catchphrases: [...preset.catchphrases],
    replyLength: preset.replyLength,
    emojiLevel: preset.emojiLevel,
    userNickname: preset.userNickname || '',
    followUp: true,
    rememberContext: true,
    avoidLong: preset.replyLength === 'short',
    comfortOnLow: preset.id === 'warm-companion',
    allowTease: preset.id === 'funny-banter',
    allowFlirty: false,
    safetyGuard: true,
  })
}

onMounted(async () => {
  try {
    const response = await fetch('/api/tts/local/voices')
    if (response.ok) {
      const data = await response.json() as { voices?: LocalTtsVoice[] }
      localVoices.value = data.voices || []
    }
  } catch {
    localVoices.value = []
  }

  if (characterStore.characters.length === 0) {
    await characterStore.loadCharacters()
  }

  if (isNew.value && typeof route.query.preset === 'string') {
    const preset = rolePresets.find((item) => item.id === route.query.preset)
    if (preset) {
      applyPreset(preset)
    }
  } else if (!isNew.value) {
    const char = characterStore.characters.find(c => c.id === route.params.id)
    if (char) {
      Object.assign(form, {
        name: char.name,
        gender: char.gender || 'female',
        ageText: char.ageText || '',
        background: char.background,
        relationship: char.relationship,
        personalityTags: char.personalityTags || [],
        temperTags: char.temperTags || [],
        hobbies: char.hobbies || [],
        expertise: char.expertise || [],
        forbiddenTopics: char.forbiddenTopics || [],
        preferredTopics: char.preferredTopics || [],
        tone: char.tone || '温柔',
        speakingStyle: char.speakingStyle || '自然',
        catchphrases: char.catchphrases || [],
        replyLength: char.replyLength || 'medium',
        emojiLevel: char.emojiLevel || 'medium',
        userNickname: char.userNickname || '',
        useGlobalTts: !char.tts,
        ttsProvider: char.tts?.provider || localStorage.getItem('ttsProvider') || 'browser',
        localTtsVoiceId: char.tts?.localVoiceId || localStorage.getItem('localTtsVoiceId') || '',
        edgeTtsVoice: char.tts?.edgeVoice || localStorage.getItem('edgeTtsVoice') || 'zh-CN-XiaoxiaoNeural',
        edgeTtsRate: char.tts?.edgeRate || localStorage.getItem('edgeTtsRate') || '+0%',
        edgeTtsPitch: char.tts?.edgePitch || localStorage.getItem('edgeTtsPitch') || '+0Hz',
        edgeTtsVolume: char.tts?.edgeVolume || localStorage.getItem('edgeTtsVolume') || '+0%',
        edgeTtsEmotionEnabled: char.tts?.edgeEmotionEnabled ?? localStorage.getItem('edgeTtsEmotionEnabled') === 'true',
        edgeTtsEmotionStyle: char.tts?.edgeEmotionStyle || localStorage.getItem('edgeTtsEmotionStyle') || 'auto',
        elevenLabsApiKey: char.tts?.elevenLabsApiKey || localStorage.getItem('elevenLabsApiKey') || '',
        elevenLabsVoiceId: char.tts?.elevenLabsVoiceId || localStorage.getItem('elevenLabsVoiceId') || 'JBFqnCBsd6RMkjVDRZzb',
        elevenLabsModelId: char.tts?.elevenLabsModelId || localStorage.getItem('elevenLabsModelId') || 'eleven_multilingual_v2',
        elevenLabsStability: String(char.tts?.elevenLabsStability ?? localStorage.getItem('elevenLabsStability') ?? '0.45'),
        elevenLabsSimilarityBoost: String(char.tts?.elevenLabsSimilarityBoost ?? localStorage.getItem('elevenLabsSimilarityBoost') ?? '0.75'),
        elevenLabsStyle: String(char.tts?.elevenLabsStyle ?? localStorage.getItem('elevenLabsStyle') ?? '0.35'),
        zhipuTtsVoice: char.tts?.zhipuVoice || localStorage.getItem('zhipuTtsVoice') || 'tongtong',
        zhipuTtsSpeed: String(char.tts?.zhipuSpeed ?? (localStorage.getItem('zhipuTtsSpeed') === '1' ? '1.2' : localStorage.getItem('zhipuTtsSpeed')) ?? '1.2'),
        zhipuTtsVolume: String(char.tts?.zhipuVolume ?? localStorage.getItem('zhipuTtsVolume') ?? '1'),
        zhipuTtsEmotionEnabled: char.tts?.zhipuEmotionEnabled ?? localStorage.getItem('zhipuTtsEmotionEnabled') === 'true',
        zhipuTtsEmotionStyle: char.tts?.zhipuEmotionStyle || localStorage.getItem('zhipuTtsEmotionStyle') || 'auto',
        zhipuTtsEmotionGranularity: char.tts?.zhipuEmotionGranularity || localStorage.getItem('zhipuTtsEmotionGranularity') || 'sentence',
        followUp: char.safety?.followUpQuestions ?? true,
        rememberContext: char.safety?.rememberContext ?? true,
        avoidLong: char.safety?.avoidLongReplies ?? false,
        comfortOnLow: char.safety?.comfortOnLowMood ?? true,
        allowTease: char.safety?.allowTeasing ?? false,
        allowFlirty: char.safety?.allowFlirtyTone ?? false,
        safetyGuard: char.safety?.safetyGuardrails ?? true,
        proactiveEnabled: char.proactive?.enabled ?? true,
        initiativeLevel: char.proactive?.initiativeLevel || 'medium',
        minInterval: char.proactive?.minIntervalMinutes || 5,
        maxDaily: char.proactive?.maxDailyCount || 10,
        activeStart: char.proactive?.activeHours?.start || '09:00',
        activeEnd: char.proactive?.activeHours?.end || '23:00',
        topicSources: char.proactive?.topicSources || ['recent_context', 'hobbies'],
        doNotDisturb: char.proactive?.doNotDisturb || false,
      })
    }
  }
})

async function handleSave() {
  const characterData = {
    name: form.name || '未命名角色',
    gender: form.gender,
    ageText: form.ageText,
    background: form.background,
    relationship: form.relationship,
    personalityTags: form.personalityTags,
    temperTags: form.temperTags,
    hobbies: form.hobbies,
    expertise: form.expertise,
    forbiddenTopics: form.forbiddenTopics,
    preferredTopics: form.preferredTopics,
    tone: form.tone,
    speakingStyle: form.speakingStyle,
    catchphrases: form.catchphrases,
    replyLength: form.replyLength,
    emojiLevel: form.emojiLevel,
    userNickname: form.userNickname,
    tts: form.useGlobalTts ? undefined : {
      provider: form.ttsProvider,
      edgeVoice: form.edgeTtsVoice,
      edgeRate: form.edgeTtsRate,
      edgePitch: form.edgeTtsPitch,
      edgeVolume: form.edgeTtsVolume,
      edgeEmotionEnabled: form.edgeTtsEmotionEnabled,
      edgeEmotionStyle: form.edgeTtsEmotionStyle as any,
      elevenLabsApiKey: form.elevenLabsApiKey || undefined,
      elevenLabsVoiceId: form.elevenLabsVoiceId,
      elevenLabsModelId: form.elevenLabsModelId,
      elevenLabsStability: Number(form.elevenLabsStability),
      elevenLabsSimilarityBoost: Number(form.elevenLabsSimilarityBoost),
      elevenLabsStyle: Number(form.elevenLabsStyle),
      zhipuVoice: form.zhipuTtsVoice,
      zhipuSpeed: Number(form.zhipuTtsSpeed),
      zhipuVolume: Number(form.zhipuTtsVolume),
      zhipuEmotionEnabled: form.zhipuTtsEmotionEnabled,
      zhipuEmotionStyle: form.zhipuTtsEmotionStyle as any,
      zhipuEmotionGranularity: form.zhipuTtsEmotionGranularity as any,
      localVoiceId: form.localTtsVoiceId || undefined,
    },
    safety: {
      followUpQuestions: form.followUp,
      rememberContext: form.rememberContext,
      avoidLongReplies: form.avoidLong,
      comfortOnLowMood: form.comfortOnLow,
      allowTeasing: form.allowTease,
      allowFlirtyTone: form.allowFlirty,
      safetyGuardrails: form.safetyGuard,
    },
    proactive: {
      enabled: form.proactiveEnabled,
      minIntervalMinutes: form.minInterval,
      maxDailyCount: form.maxDaily,
      activeHours: { start: form.activeStart, end: form.activeEnd },
      initiativeLevel: form.initiativeLevel,
      topicSources: form.topicSources as any,
      doNotDisturb: form.doNotDisturb,
    },
  }

  if (isNew.value) {
    await characterStore.addCharacter(characterData)
    ElMessage.success(`已创建「${characterData.name}」`)
  } else {
    await characterStore.updateCharacter(route.params.id as string, characterData)
    ElMessage.success(`已保存「${characterData.name}」`)
  }

  router.push('/characters')
}

function handleReset() {
  Object.assign(form, defaultForm())
}
</script>

<style scoped>
.tab-content {
  min-height: 300px;
}

.relationship-select {
  width: 100%;
}

.relationship-select :deep(.el-select__wrapper) {
  min-height: 40px;
  padding: 6px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: none;
}

.relationship-select :deep(.el-select__wrapper.is-focused) {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.relationship-select :deep(.el-select__placeholder),
.relationship-select :deep(.el-select__selected-item) {
  color: var(--text-primary);
}

.relationship-select :deep(.el-select__caret) {
  color: var(--text-secondary);
}

.relationship-select :deep(.relationship-select-popper) {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.relationship-select :deep(.relationship-select-popper .el-select-dropdown__item) {
  color: var(--text-secondary);
}

.relationship-select :deep(.relationship-select-popper .el-select-dropdown__item.is-hovering),
.relationship-select :deep(.relationship-select-popper .el-select-dropdown__item:hover) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.relationship-select :deep(.relationship-select-popper .el-select-dropdown__item.is-selected) {
  color: var(--accent-light);
}
</style>
