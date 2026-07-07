<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">{{ isNew ? '创建角色' : '编辑角色' }}</h1>
      <button class="btn btn-secondary" @click="router.back()">返回</button>
    </div>

    <div class="card">
      <div class="tabs">
        <div class="tab" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础信息</div>
        <div class="tab" :class="{ active: activeTab === 'personality' }" @click="activeTab = 'personality'">性格脾气</div>
        <div class="tab" :class="{ active: activeTab === 'hobbies' }" @click="activeTab = 'hobbies'">爱好话题</div>
        <div class="tab" :class="{ active: activeTab === 'tone' }" @click="activeTab = 'tone'">语气风格</div>
        <div class="tab" :class="{ active: activeTab === 'voice' }" @click="activeTab = 'voice'">朗读</div>
        <div class="tab" :class="{ active: activeTab === 'rules' }" @click="activeTab = 'rules'">回复规则</div>
        <div class="tab" :class="{ active: activeTab === 'proactive' }" @click="activeTab = 'proactive'">主动聊天</div>
      </div>

      <!-- 基础信息 -->
      <div v-show="activeTab === 'basic'" class="tab-content">
        <div class="form-group">
          <label class="form-label">角色名称</label>
          <input class="form-input" v-model="form.name" placeholder="例如：小夏、冷面顾问、温柔姐姐" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">性别设定</label>
            <select class="form-input" v-model="form.gender">
              <option value="female">女性</option>
              <option value="male">男性</option>
              <option value="neutral">中性</option>
              <option value="unknown">不限</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">年龄设定</label>
            <input class="form-input" v-model="form.ageText" placeholder="例如：20岁左右" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">身份背景</label>
          <textarea class="form-input" v-model="form.background" placeholder="例如：独立设计师、高冷猫系朋友、职场导师" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">和用户的关系</label>
          <input class="form-input" v-model="form.relationship" placeholder="朋友、恋人、老师、同事、陪伴者..." />
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
            <select class="form-input" v-model="form.emotionExpression">
              <option value="克制">克制</option>
              <option value="明显">明显</option>
              <option value="夸张">夸张</option>
              <option value="平静">平静</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">共情程度</label>
            <select class="form-input" v-model="form.empathyLevel">
              <option value="低">低</option>
              <option value="中">中</option>
              <option value="高">高</option>
            </select>
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
          <input class="form-input" v-model="form.tone" placeholder="主要语气（可从上面选择或自行输入）" style="margin-top:8px" />
        </div>
        <div class="form-group">
          <label class="form-label">说话风格</label>
          <input class="form-input" v-model="form.speakingStyle" placeholder="例如：喜欢用比喻、说话带尾音" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">回复长度</label>
            <select class="form-input" v-model="form.replyLength">
              <option value="short">短句</option>
              <option value="medium">中等</option>
              <option value="long">详细</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">表情使用</label>
            <select class="form-input" v-model="form.emojiLevel">
              <option value="none">不用</option>
              <option value="low">少量</option>
              <option value="medium">适中</option>
              <option value="high">多</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">称呼用户</label>
          <input class="form-input" v-model="form.userNickname" placeholder="昵称、你、主人、老板..." />
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
          <div class="toggle" :class="{ active: form.useGlobalTts }" @click="form.useGlobalTts = !form.useGlobalTts">
            <div class="toggle-knob"></div>
          </div>
        </div>

        <template v-if="!form.useGlobalTts">
          <div class="form-group">
            <label class="form-label">角色朗读引擎</label>
            <select class="form-input" v-model="form.ttsProvider">
              <option value="browser">系统朗读（本机浏览器）</option>
              <option value="edge">Edge TTS（免费，无需 Key）</option>
              <option value="elevenlabs">ElevenLabs（更自然、有情绪）</option>
            </select>
          </div>

          <template v-if="form.ttsProvider === 'edge'">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">中文音色</label>
                <select class="form-input" v-model="form.edgeTtsVoice">
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
                <select class="form-input" v-model="form.edgeTtsRate">
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
                <select class="form-input" v-model="form.edgeTtsPitch">
                  <option value="-10Hz">低一点</option>
                  <option value="+0Hz">正常</option>
                  <option value="+10Hz">高一点</option>
                  <option value="+20Hz">更活泼</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">音量</label>
                <select class="form-input" v-model="form.edgeTtsVolume">
                  <option value="-20%">小一点</option>
                  <option value="+0%">正常</option>
                  <option value="+20%">大一点</option>
                </select>
              </div>
            </div>
          </template>

          <template v-if="form.ttsProvider === 'elevenlabs'">
            <div class="form-group">
              <label class="form-label">ElevenLabs API Key</label>
              <input class="form-input" type="password" v-model="form.elevenLabsApiKey" placeholder="留空则使用全局 Key" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Voice ID</label>
                <input class="form-input" v-model="form.elevenLabsVoiceId" placeholder="JBFqnCBsd6RMkjVDRZzb" />
              </div>
              <div class="form-group">
                <label class="form-label">模型</label>
                <select class="form-input" v-model="form.elevenLabsModelId">
                  <option value="eleven_multilingual_v2">multilingual v2（稳定自然）</option>
                  <option value="eleven_turbo_v2_5">turbo v2.5（更快）</option>
                  <option value="eleven_flash_v2_5">flash v2.5（低延迟）</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">稳定度 {{ form.elevenLabsStability }}</label>
                <input class="form-input" type="range" min="0" max="1" step="0.05" v-model="form.elevenLabsStability" />
              </div>
              <div class="form-group">
                <label class="form-label">相似度 {{ form.elevenLabsSimilarityBoost }}</label>
                <input class="form-input" type="range" min="0" max="1" step="0.05" v-model="form.elevenLabsSimilarityBoost" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">表现力 {{ form.elevenLabsStyle }}</label>
              <input class="form-input" type="range" min="0" max="1" step="0.05" v-model="form.elevenLabsStyle" />
            </div>
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
          <div class="toggle" :class="{ active: form.followUp }" @click="form.followUp = !form.followUp">
            <div class="toggle-knob"></div>
          </div>
        </div>
        <div class="toggle-row">
          <span>记住上下文</span>
          <div class="toggle" :class="{ active: form.rememberContext }" @click="form.rememberContext = !form.rememberContext">
            <div class="toggle-knob"></div>
          </div>
        </div>
        <div class="toggle-row">
          <span>避免长篇大论</span>
          <div class="toggle" :class="{ active: form.avoidLong }" @click="form.avoidLong = !form.avoidLong">
            <div class="toggle-knob"></div>
          </div>
        </div>
        <div class="toggle-row">
          <span>用户低落时安慰</span>
          <div class="toggle" :class="{ active: form.comfortOnLow }" @click="form.comfortOnLow = !form.comfortOnLow">
            <div class="toggle-knob"></div>
          </div>
        </div>
        <div class="toggle-row">
          <span>允许调侃</span>
          <div class="toggle" :class="{ active: form.allowTease }" @click="form.allowTease = !form.allowTease">
            <div class="toggle-knob"></div>
          </div>
        </div>
        <div class="toggle-row">
          <span>允许暧昧语气</span>
          <div class="toggle" :class="{ active: form.allowFlirty }" @click="form.allowFlirty = !form.allowFlirty">
            <div class="toggle-knob"></div>
          </div>
        </div>
        <div class="toggle-row">
          <span>安全边界提示</span>
          <div class="toggle" :class="{ active: form.safetyGuard }" @click="form.safetyGuard = !form.safetyGuard">
            <div class="toggle-knob"></div>
          </div>
        </div>
      </div>

      <!-- 主动聊天 -->
      <div v-show="activeTab === 'proactive'" class="tab-content">
        <div class="toggle-row">
          <span>开启主动聊天</span>
          <div class="toggle" :class="{ active: form.proactiveEnabled }" @click="form.proactiveEnabled = !form.proactiveEnabled">
            <div class="toggle-knob"></div>
          </div>
        </div>
        <template v-if="form.proactiveEnabled">
          <div class="form-group">
            <label class="form-label">主动程度</label>
            <select class="form-input" v-model="form.initiativeLevel">
              <option value="low">低（很少主动）</option>
              <option value="medium">中（偶尔主动）</option>
              <option value="high">高（经常主动）</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">最短间隔（分钟）</label>
              <input type="number" class="form-input" v-model.number="form.minInterval" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label">每日最大次数</label>
              <input type="number" class="form-input" v-model.number="form.maxDaily" min="1" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">允许开始时间</label>
              <input type="time" class="form-input" v-model="form.activeStart" />
            </div>
            <div class="form-group">
              <label class="form-label">允许结束时间</label>
              <input type="time" class="form-input" v-model="form.activeEnd" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">主动话题来源</label>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              <label v-for="src in topicSources" :key="src.value" style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer">
                <input type="checkbox" :value="src.value" v-model="form.topicSources" />
                {{ src.label }}
              </label>
            </div>
          </div>
          <div class="toggle-row">
            <span>勿扰模式</span>
            <div class="toggle" :class="{ active: form.doNotDisturb }" @click="form.doNotDisturb = !form.doNotDisturb">
              <div class="toggle-knob"></div>
            </div>
          </div>
        </template>
      </div>

      <div style="margin-top: 24px; display: flex; gap: 12px;">
        <button class="btn btn-primary" @click="handleSave">保存角色</button>
        <button class="btn btn-secondary" @click="router.back()">取消</button>
        <button class="btn btn-secondary" style="margin-left:auto" @click="handleReset">重置默认</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCharacterStore } from '../stores/character'
import TagsInput from '../components/TagsInput.vue'
import { v4 as uuidv4 } from 'uuid'

const router = useRouter()
const route = useRoute()
const characterStore = useCharacterStore()

const isNew = computed(() => route.params.id === 'new' || !route.params.id)
const activeTab = ref('basic')

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
  ttsProvider: (localStorage.getItem('ttsProvider') || 'browser') as 'browser' | 'edge' | 'elevenlabs',
  edgeTtsVoice: localStorage.getItem('edgeTtsVoice') || 'zh-CN-XiaoxiaoNeural',
  edgeTtsRate: localStorage.getItem('edgeTtsRate') || '+0%',
  edgeTtsPitch: localStorage.getItem('edgeTtsPitch') || '+0Hz',
  edgeTtsVolume: localStorage.getItem('edgeTtsVolume') || '+0%',
  elevenLabsApiKey: localStorage.getItem('elevenLabsApiKey') || '',
  elevenLabsVoiceId: localStorage.getItem('elevenLabsVoiceId') || 'JBFqnCBsd6RMkjVDRZzb',
  elevenLabsModelId: localStorage.getItem('elevenLabsModelId') || 'eleven_multilingual_v2',
  elevenLabsStability: localStorage.getItem('elevenLabsStability') || '0.45',
  elevenLabsSimilarityBoost: localStorage.getItem('elevenLabsSimilarityBoost') || '0.75',
  elevenLabsStyle: localStorage.getItem('elevenLabsStyle') || '0.35',
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

onMounted(async () => {
  if (characterStore.characters.length === 0) {
    await characterStore.loadCharacters()
  }

  if (!isNew.value) {
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
        edgeTtsVoice: char.tts?.edgeVoice || localStorage.getItem('edgeTtsVoice') || 'zh-CN-XiaoxiaoNeural',
        edgeTtsRate: char.tts?.edgeRate || localStorage.getItem('edgeTtsRate') || '+0%',
        edgeTtsPitch: char.tts?.edgePitch || localStorage.getItem('edgeTtsPitch') || '+0Hz',
        edgeTtsVolume: char.tts?.edgeVolume || localStorage.getItem('edgeTtsVolume') || '+0%',
        elevenLabsApiKey: char.tts?.elevenLabsApiKey || localStorage.getItem('elevenLabsApiKey') || '',
        elevenLabsVoiceId: char.tts?.elevenLabsVoiceId || localStorage.getItem('elevenLabsVoiceId') || 'JBFqnCBsd6RMkjVDRZzb',
        elevenLabsModelId: char.tts?.elevenLabsModelId || localStorage.getItem('elevenLabsModelId') || 'eleven_multilingual_v2',
        elevenLabsStability: String(char.tts?.elevenLabsStability ?? localStorage.getItem('elevenLabsStability') ?? '0.45'),
        elevenLabsSimilarityBoost: String(char.tts?.elevenLabsSimilarityBoost ?? localStorage.getItem('elevenLabsSimilarityBoost') ?? '0.75'),
        elevenLabsStyle: String(char.tts?.elevenLabsStyle ?? localStorage.getItem('elevenLabsStyle') ?? '0.35'),
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
      elevenLabsApiKey: form.elevenLabsApiKey || undefined,
      elevenLabsVoiceId: form.elevenLabsVoiceId,
      elevenLabsModelId: form.elevenLabsModelId,
      elevenLabsStability: Number(form.elevenLabsStability),
      elevenLabsSimilarityBoost: Number(form.elevenLabsSimilarityBoost),
      elevenLabsStyle: Number(form.elevenLabsStyle),
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
  } else {
    await characterStore.updateCharacter(route.params.id as string, characterData)
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
</style>
