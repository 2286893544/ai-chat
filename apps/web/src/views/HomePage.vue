<script setup lang="ts">
import {
  ArrowRight,
  ChatDotRound,
  CircleCheck,
  Connection,
  Cpu,
  DataLine,
  Headset,
  Key,
  Lock,
  MagicStick,
  Mic,
  Promotion,
  Setting,
  User,
  UserFilled,
} from '@element-plus/icons-vue'
import BrandMark from '../components/BrandMark.vue'
import MarketingHeader from '../components/MarketingHeader.vue'

const capabilities = [
  {
    icon: Key,
    eyebrow: 'BYOK 模型',
    title: '模型选择权始终在你手里',
    copy: '连接自己的 DeepSeek 或智谱 GLM Key。密钥保存在本地，只在你发起模型请求时使用。',
  },
  {
    icon: UserFilled,
    eyebrow: '角色系统',
    title: '把一次问答变成长期关系',
    copy: '定义角色背景、关系、语气、边界和主动陪伴规则，让回复不再千篇一律。',
  },
  {
    icon: Mic,
    eyebrow: '语音能力',
    title: '从输入到朗读都可以自由组合',
    copy: '按需使用本地语音识别、浏览器语音、Edge TTS、ElevenLabs 或智谱朗读。',
  },
  {
    icon: DataLine,
    eyebrow: '本地数据',
    title: '会话与角色不离开你的设备',
    copy: '角色、会话和消息保存在浏览器 IndexedDB 中，不建立平台侧聊天档案。',
  },
]

const providers = [
  { icon: Cpu, name: 'DeepSeek', detail: '深度推理' },
  { icon: MagicStick, name: '智谱 GLM', detail: '通用对话' },
  { icon: Mic, name: 'faster-whisper', detail: '本地识别' },
  { icon: Connection, name: 'FunASR', detail: '中文识别' },
  { icon: Headset, name: 'Edge TTS', detail: '自然朗读' },
  { icon: Promotion, name: 'ElevenLabs / 智谱', detail: '高级声音' },
]
</script>

<template>
  <div class="marketing-page">
    <MarketingHeader />

    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-inner">
          <div class="hero-kicker"><ElIcon><Lock /></ElIcon> 本地优先 · BYOK · 个人 AI 对话空间</div>
          <h1 id="hero-title">你的模型，你的角色，<br><span>你的数据边界</span></h1>
          <p class="hero-copy">
            AI Chat 把角色化对话、语音输入与朗读放进一套安静、清晰的界面里。<br>
            你选择模型，也决定数据停留在哪里。
          </p>
          <div class="hero-actions">
            <RouterLink class="primary-action" to="/chat">开始本地使用 <ElIcon><ArrowRight /></ElIcon></RouterLink>
            <RouterLink class="secondary-action" to="/guide">5 分钟上手</RouterLink>
          </div>
          <div class="hero-trust" aria-label="核心保证">
            <span><ElIcon><CircleCheck /></ElIcon> 对话本地保存</span>
            <span><ElIcon><CircleCheck /></ElIcon> 自带模型密钥</span>
            <span><ElIcon><CircleCheck /></ElIcon> 语音能力可选</span>
            <span><ElIcon><CircleCheck /></ElIcon> 不建立云端档案</span>
          </div>
        </div>
      </section>

      <section class="product-showcase" aria-label="AI Chat 产品界面预览">
        <div class="product-frame">
          <div class="demo-topbar">
            <BrandMark compact />
            <span>与「小夏」的对话</span>
            <span class="demo-status"><i></i> 本地数据已连接</span>
          </div>
          <div class="demo-body">
            <aside class="demo-sidebar">
              <button class="demo-new"><ElIcon><ChatDotRound /></ElIcon> 新对话</button>
              <div class="demo-nav active"><ElIcon><ChatDotRound /></ElIcon> 聊天</div>
              <div class="demo-nav"><ElIcon><User /></ElIcon> 角色管理</div>
              <div class="demo-nav"><ElIcon><Setting /></ElIcon> 设置</div>
              <div class="demo-local"><ElIcon><CircleCheck /></ElIcon><span>本地优先已启用<small>会话仅保存在本机</small></span></div>
            </aside>

            <div class="demo-chat">
              <div class="demo-chat-heading">
                <span>小夏</span>
                <small>温柔体贴的日常聊天伙伴</small>
              </div>
              <div class="demo-messages">
                <div class="demo-message assistant">
                  <span class="demo-avatar">小</span>
                  <p>晚上好。今天过得怎么样？如果有点累，我们可以先从一件小事聊起。</p>
                </div>
                <div class="demo-message user-message"><p>最近总觉得事情很多，不知道该从哪里开始。</p></div>
                <div class="demo-message assistant wide">
                  <span class="demo-avatar">小</span>
                  <p>先不用一次处理全部。我们把事情分成三类：今天必须完成、可以延后、可以放下。你愿意先告诉我最占心力的那件吗？</p>
                </div>
              </div>
              <div class="demo-composer">
                <span>输入消息，Enter 发送</span>
                <ElIcon><Mic /></ElIcon>
                <span class="send-icon"><ElIcon><Promotion /></ElIcon></span>
              </div>
            </div>

            <aside class="demo-panel">
              <div class="demo-profile"><span>小</span><strong>小夏</strong><small>温柔 · 活泼</small></div>
              <div class="demo-panel-block">
                <label>当前角色</label>
                <button>小夏 <ElIcon><ArrowRight /></ElIcon></button>
              </div>
              <div class="demo-panel-block">
                <label>回复风格</label>
                <div class="demo-options"><span class="selected">温柔</span><span>活泼</span><span>理性</span><span>简洁</span></div>
              </div>
              <div class="demo-panel-block settings">
                <label>陪伴设置</label>
                <p>主动聊天 <i class="switch on"></i></p>
                <p>自动朗读 <i class="switch"></i></p>
              </div>
            </aside>
          </div>
        </div>
        <p class="showcase-note"><ElIcon><Lock /></ElIcon> 你的数据，只保存在本地设备。BYOK 模式，密钥由你掌控。</p>
      </section>

      <section class="provider-strip" aria-label="支持的模型与语音能力">
        <div v-for="provider in providers" :key="provider.name" class="provider-item">
          <ElIcon><component :is="provider.icon" /></ElIcon>
          <span><strong>{{ provider.name }}</strong><small>{{ provider.detail }}</small></span>
        </div>
      </section>

      <section id="capabilities" class="content-section capabilities-section">
        <div class="section-heading">
          <span class="section-kicker">统一的产品系统</span>
          <h2>从模型到角色，都在同一套边界里</h2>
          <p>配置不应该成为聊天的负担。AI Chat 把复杂能力整理成可理解、可组合的日常工具。</p>
        </div>
        <div class="capability-grid">
          <article v-for="item in capabilities" :key="item.title" class="capability-item">
            <span class="capability-icon"><ElIcon><component :is="item.icon" /></ElIcon></span>
            <div>
              <small>{{ item.eyebrow }}</small>
              <h3>{{ item.title }}</h3>
              <p>{{ item.copy }}</p>
            </div>
          </article>
        </div>
      </section>

      <section id="local-first" class="local-band">
        <div class="band-inner">
          <div class="band-copy">
            <span class="section-kicker">本地数据边界</span>
            <h2>不是“看起来私密”，<br>而是数据路径足够清楚</h2>
            <p>聊天内容、角色设定与会话索引保存在本地 IndexedDB。密钥保存在浏览器本地，只交给你主动选择的模型或语音服务。</p>
            <RouterLink to="/guide#local-data">了解数据边界 <ElIcon><ArrowRight /></ElIcon></RouterLink>
          </div>
          <div class="boundary-list">
            <div><ElIcon><Lock /></ElIcon><span><strong>聊天内容</strong><small>不上传到 AI Chat 自有服务器</small></span></div>
            <div><ElIcon><Key /></ElIcon><span><strong>API Key</strong><small>保存在当前设备的本地存储</small></span></div>
            <div><ElIcon><DataLine /></ElIcon><span><strong>角色与会话</strong><small>使用 IndexedDB 持久化</small></span></div>
          </div>
        </div>
      </section>

      <section id="voice" class="content-section voice-section">
        <div class="voice-copy">
          <span class="section-kicker">可选的语音层</span>
          <h2>需要时开口，不需要时保持安静</h2>
          <p>语音不是默认强加的功能。你可以只用文本，也可以自由选择本地识别与多种朗读方案，并在角色维度试听和切换。</p>
        </div>
        <div class="voice-flow" aria-label="语音处理流程">
          <div><ElIcon><Mic /></ElIcon><span><strong>说话</strong><small>浏览器采集音频</small></span></div>
          <ElIcon class="flow-arrow"><ArrowRight /></ElIcon>
          <div><ElIcon><Connection /></ElIcon><span><strong>识别</strong><small>本地或浏览器方案</small></span></div>
          <ElIcon class="flow-arrow"><ArrowRight /></ElIcon>
          <div><ElIcon><Headset /></ElIcon><span><strong>朗读</strong><small>按角色选择声音</small></span></div>
        </div>
      </section>

      <section class="final-cta">
        <div>
          <span class="section-kicker">从第一场对话开始</span>
          <h2>把 AI 变成你愿意长期使用的工具</h2>
          <p>先配置自己的模型，再创建一个角色。剩下的，就从一句“你好”开始。</p>
        </div>
        <div class="final-actions">
          <RouterLink class="primary-action" to="/chat">进入 AI Chat <ElIcon><ArrowRight /></ElIcon></RouterLink>
          <RouterLink class="secondary-action" to="/guide">查看使用教程</RouterLink>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <BrandMark compact />
      <p>本地优先的个人 AI 对话工具</p>
      <nav><RouterLink to="/guide">使用教程</RouterLink><RouterLink to="/project">项目说明</RouterLink><RouterLink to="/chat">进入产品</RouterLink></nav>
    </footer>
  </div>
</template>

<style scoped>
.marketing-page {
  min-height: 100%;
  background: #071124;
  color: #f4f6fb;
}

.hero {
  padding: 96px 20px 58px;
  text-align: center;
}

.hero-inner {
  width: min(980px, 100%);
  margin: 0 auto;
}

.hero-kicker,
.section-kicker {
  color: #9e97ff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
}

.hero-kicker {
  width: fit-content;
  margin: 0 auto 26px;
  padding: 8px 13px;
  display: flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #33436a;
  border-radius: 999px;
  background: #0b1830;
}

.hero h1 {
  max-width: 900px;
  margin: 0 auto;
  font-size: clamp(44px, 6vw, 78px);
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: 0;
}

.hero h1 span {
  color: #8e86ff;
}

.hero-copy {
  margin: 26px auto 0;
  color: #a7b1c8;
  font-size: 17px;
  line-height: 1.85;
}

.hero-actions,
.final-actions {
  margin-top: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.primary-action,
.secondary-action {
  min-height: 48px;
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border-radius: 7px;
  font-size: 15px;
  font-weight: 700;
}

.primary-action {
  border: 1px solid #9189ff;
  background: #6c63ff;
  color: #fff;
  box-shadow: 0 14px 34px rgba(108, 99, 255, 0.24);
}

.primary-action:hover {
  background: #8179ff;
  transform: translateY(-1px);
}

.secondary-action {
  border: 1px solid #3a4a70;
  background: #0a172d;
  color: #dce2ef;
}

.secondary-action:hover {
  border-color: #716bc6;
  color: #fff;
}

.hero-trust {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px 28px;
  color: #8692ad;
  font-size: 13px;
}

.hero-trust span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.hero-trust .el-icon {
  color: var(--success);
}

.product-showcase {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
}

.product-frame {
  overflow: hidden;
  border: 1px solid #3a4b72;
  border-radius: 12px;
  background: #0b162b;
  box-shadow: 0 32px 90px rgba(0, 0, 0, 0.32);
}

.demo-topbar {
  height: 62px;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  align-items: center;
  border-bottom: 1px solid #293b5f;
  background: #101d38;
  font-size: 13px;
}

.demo-topbar > span:nth-child(2) {
  padding-left: 22px;
  color: #dce2ef;
  font-weight: 650;
}

.demo-status {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #7fd8c7;
}

.demo-status i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
}

.demo-body {
  min-height: 520px;
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr) 240px;
}

.demo-sidebar,
.demo-panel {
  background: #101d38;
}

.demo-sidebar {
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #293b5f;
}

.demo-new,
.demo-nav {
  min-height: 38px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 9px;
  border-radius: 6px;
  color: #aab5ca;
  font-size: 13px;
}

.demo-new {
  margin-bottom: 14px;
  border: 1px solid #384b73;
  background: transparent;
}

.demo-nav.active {
  background: #26376a;
  color: #a39dff;
}

.demo-local {
  margin-top: auto;
  padding: 12px;
  display: flex;
  gap: 8px;
  border: 1px solid #314b61;
  border-radius: 7px;
  color: #78d7c4;
  font-size: 12px;
}

.demo-local span,
.demo-local small {
  display: block;
}

.demo-local small {
  margin-top: 4px;
  color: #72809c;
}

.demo-chat {
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #0a1327;
}

.demo-chat-heading {
  min-height: 58px;
  padding: 12px 22px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 1px solid #293b5f;
}

.demo-chat-heading span {
  font-weight: 700;
}

.demo-chat-heading small {
  margin-top: 3px;
  color: #71809d;
}

.demo-messages {
  flex: 1;
  padding: 28px 34px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.demo-message {
  max-width: 68%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.demo-message p {
  padding: 13px 15px;
  border: 1px solid #263858;
  border-radius: 8px;
  background: #14213c;
  color: #cfd6e6;
  font-size: 13px;
  line-height: 1.7;
}

.demo-message.wide {
  max-width: 76%;
}

.demo-message.user-message {
  max-width: 58%;
  margin-left: auto;
}

.demo-message.user-message p {
  border-color: #334884;
  background: #23376d;
}

.demo-avatar,
.demo-profile > span {
  width: 30px;
  height: 30px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #7a52e8;
  color: #fff;
  font-weight: 700;
}

.demo-composer {
  min-height: 58px;
  margin: 0 24px 22px;
  padding: 8px 8px 8px 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #344667;
  border-radius: 8px;
  background: #111d35;
  color: #72809c;
  font-size: 12px;
}

.demo-composer > span:first-child {
  flex: 1;
}

.send-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
}

.demo-panel {
  padding: 20px 16px;
  border-left: 1px solid #293b5f;
}

.demo-profile {
  padding: 4px 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom: 1px solid #293b5f;
}

.demo-profile > span {
  width: 52px;
  height: 52px;
  font-size: 20px;
}

.demo-profile strong {
  margin-top: 9px;
  font-size: 14px;
}

.demo-profile small {
  margin-top: 4px;
  color: #74829c;
}

.demo-panel-block {
  padding: 16px 0;
  border-bottom: 1px solid #293b5f;
}

.demo-panel-block label {
  display: block;
  margin-bottom: 9px;
  color: #6f7e9a;
  font-size: 11px;
}

.demo-panel-block button {
  width: 100%;
  min-height: 38px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #35486c;
  border-radius: 6px;
  background: #14213b;
  color: #dce2ef;
}

.demo-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.demo-options span {
  padding: 7px 5px;
  border: 1px solid #2c3c5d;
  border-radius: 5px;
  color: #76839c;
  font-size: 11px;
  text-align: center;
}

.demo-options .selected {
  border-color: #726aff;
  background: rgba(108, 99, 255, 0.16);
  color: #aaa5ff;
}

.demo-panel-block.settings p {
  margin-top: 11px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #aab5ca;
  font-size: 12px;
}

.switch {
  width: 28px;
  height: 16px;
  border-radius: 9px;
  background: #34415a;
}

.switch.on {
  background: var(--accent);
}

.showcase-note {
  margin: 20px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #7f8ca6;
  font-size: 13px;
}

.provider-strip {
  width: min(1180px, calc(100% - 40px));
  margin: 52px auto 0;
  padding: 22px 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  border-top: 1px solid #263655;
  border-bottom: 1px solid #263655;
}

.provider-item {
  min-width: 0;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-right: 1px solid #263655;
}

.provider-item:last-child {
  border-right: 0;
}

.provider-item > .el-icon {
  flex: none;
  color: #8f88ff;
  font-size: 23px;
}

.provider-item span,
.provider-item small {
  display: block;
}

.provider-item strong {
  color: #d9dfeb;
  font-size: 12px;
}

.provider-item small {
  margin-top: 3px;
  color: #66748f;
  font-size: 10px;
}

.content-section {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 110px 0;
}

.section-heading {
  max-width: 700px;
  margin: 0 auto 54px;
  text-align: center;
}

.section-heading h2,
.band-copy h2,
.voice-copy h2,
.final-cta h2 {
  margin-top: 13px;
  font-size: clamp(30px, 4vw, 46px);
  line-height: 1.25;
  letter-spacing: 0;
}

.section-heading p,
.band-copy p,
.voice-copy p,
.final-cta p {
  margin-top: 16px;
  color: #8d99b2;
  font-size: 15px;
  line-height: 1.8;
}

.capability-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-top: 1px solid #2b3b5d;
  border-bottom: 1px solid #2b3b5d;
}

.capability-item {
  min-height: 225px;
  padding: 38px;
  display: flex;
  gap: 22px;
  border-right: 1px solid #2b3b5d;
  border-bottom: 1px solid #2b3b5d;
}

.capability-item:nth-child(2n) {
  border-right: 0;
}

.capability-item:nth-last-child(-n + 2) {
  border-bottom: 0;
}

.capability-icon {
  width: 48px;
  height: 48px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #3b4f79;
  border-radius: 9px;
  background: #101d38;
  color: #9993ff;
  font-size: 23px;
}

.capability-item small {
  color: #837df0;
  font-weight: 700;
}

.capability-item h3 {
  margin-top: 9px;
  font-size: 20px;
}

.capability-item p {
  margin-top: 11px;
  color: #8793aa;
  font-size: 14px;
  line-height: 1.75;
}

.local-band {
  padding: 90px 20px;
  border-top: 1px solid #293a5a;
  border-bottom: 1px solid #293a5a;
  background: #0c1830;
}

.band-inner {
  width: min(1080px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 90px;
  align-items: center;
}

.band-copy a {
  margin-top: 22px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #aaa5ff;
  font-weight: 700;
}

.boundary-list {
  border-top: 1px solid #314567;
}

.boundary-list > div {
  padding: 21px 2px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid #314567;
}

.boundary-list > div > .el-icon {
  color: #75d2c3;
  font-size: 22px;
}

.boundary-list span,
.boundary-list small {
  display: block;
}

.boundary-list strong {
  font-size: 14px;
}

.boundary-list small {
  margin-top: 4px;
  color: #7d8aa4;
}

.voice-section {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 90px;
  align-items: center;
}

.voice-flow {
  min-height: 230px;
  padding: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  border: 1px solid #314567;
  border-radius: 10px;
  background: #0c1830;
}

.voice-flow > div {
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.voice-flow > div > .el-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 14px;
  border: 1px solid #465a86;
  border-radius: 50%;
  color: #9f99ff;
  font-size: 22px;
}

.voice-flow span,
.voice-flow small {
  display: block;
}

.voice-flow strong {
  font-size: 14px;
}

.voice-flow small {
  margin-top: 5px;
  color: #75829c;
  font-size: 11px;
}

.flow-arrow {
  color: #4f5d7c;
}

.final-cta {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto 80px;
  padding: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  border: 1px solid #3a4d76;
  border-radius: 10px;
  background: #101d38;
}

.final-cta h2 {
  font-size: clamp(27px, 3vw, 38px);
}

.final-actions {
  margin: 0;
  flex: none;
}

.site-footer {
  min-height: 118px;
  padding: 30px max(20px, calc((100% - 1120px) / 2));
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 30px;
  border-top: 1px solid #263655;
  color: #75829c;
  font-size: 12px;
}

.site-footer nav {
  display: flex;
  gap: 22px;
}

.site-footer a {
  color: #9aa6bd;
}

.site-footer a:hover {
  color: #fff;
}

@media (max-width: 980px) {
  .demo-body {
    grid-template-columns: 170px minmax(0, 1fr);
  }

  .demo-topbar {
    grid-template-columns: 170px 1fr;
  }

  .demo-status,
  .demo-panel {
    display: none;
  }

  .provider-strip {
    grid-template-columns: repeat(3, 1fr);
  }

  .provider-item:nth-child(3) {
    border-right: 0;
  }

  .provider-item:nth-child(-n + 3) {
    padding-bottom: 18px;
    border-bottom: 1px solid #263655;
  }

  .provider-item:nth-child(n + 4) {
    padding-top: 18px;
  }

  .band-inner,
  .voice-section {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .final-cta {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 680px) {
  .hero {
    padding-top: 70px;
  }

  .hero h1 {
    font-size: 32px;
    line-height: 1.2;
  }

  .hero-copy br {
    display: none;
  }

  .hero-actions,
  .final-actions {
    width: 100%;
    flex-direction: column;
  }

  .primary-action,
  .secondary-action {
    width: 100%;
  }

  .product-showcase,
  .provider-strip,
  .content-section,
  .final-cta {
    width: min(100% - 28px, 1120px);
  }

  .demo-topbar {
    display: none;
  }

  .demo-sidebar {
    display: none;
  }

  .demo-body {
    min-height: 480px;
    grid-template-columns: 1fr;
  }

  .demo-messages {
    padding: 22px 18px;
  }

  .demo-message,
  .demo-message.wide {
    max-width: 90%;
  }

  .demo-message.user-message {
    max-width: 82%;
  }

  .demo-composer {
    margin: 0 14px 14px;
  }

  .provider-strip {
    grid-template-columns: 1fr 1fr;
  }

  .provider-item,
  .provider-item:nth-child(3) {
    min-height: 70px;
    padding: 12px;
    border-right: 1px solid #263655;
    border-bottom: 1px solid #263655;
  }

  .provider-item:nth-child(2n) {
    border-right: 0;
  }

  .provider-item:nth-last-child(-n + 2) {
    border-bottom: 0;
  }

  .capability-grid {
    grid-template-columns: 1fr;
  }

  .capability-item,
  .capability-item:nth-child(2n),
  .capability-item:nth-last-child(-n + 2) {
    padding: 28px 8px;
    border-right: 0;
    border-bottom: 1px solid #2b3b5d;
  }

  .capability-item:last-child {
    border-bottom: 0;
  }

  .local-band {
    padding: 72px 20px;
  }

  .voice-flow {
    padding: 26px 12px;
    gap: 8px;
  }

  .voice-flow > div {
    min-width: 0;
    flex: 1;
  }

  .flow-arrow {
    display: none;
  }

  .final-cta {
    padding: 30px 22px;
  }

  .site-footer {
    padding: 28px 20px;
    grid-template-columns: 1fr;
    gap: 14px;
  }
}
</style>
