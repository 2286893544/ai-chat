<script setup lang="ts">
import {
  ArrowRight,
  ChatDotRound,
  CircleCheckFilled,
  Connection,
  DataLine,
  Headset,
  Key,
  Lock,
  Mic,
  Setting,
  User,
  WarningFilled,
} from '@element-plus/icons-vue'
import MarketingHeader from '../components/MarketingHeader.vue'

const lessons = [
  { id: 'api-key', index: '01', label: '准备 API Key' },
  { id: 'model', index: '02', label: '选择模型' },
  { id: 'character', index: '03', label: '创建角色' },
  { id: 'chat', index: '04', label: '开始聊天' },
  { id: 'voice', index: '05', label: '启用语音' },
  { id: 'local-data', index: '06', label: '理解本地数据' },
]

function scrollToLesson(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="guide-page">
    <MarketingHeader />

    <main>
      <section class="guide-hero">
        <div class="guide-kicker">从 0 到 1 · 完成你的第一场对话</div>
        <h1>5 分钟上手 <span>AI Chat</span></h1>
        <p>从填写模型密钥，到创建角色、开始对话和启用语音，一步一步完成。</p>
        <div class="guide-actions">
          <RouterLink class="primary-action" to="/settings">打开 AI Chat 开始配置 <ElIcon><ArrowRight /></ElIcon></RouterLink>
          <RouterLink class="secondary-action" to="/">返回官网</RouterLink>
        </div>
        <div class="guide-trust">
          <span><ElIcon><Lock /></ElIcon> 密钥保存在本机</span>
          <span><ElIcon><DataLine /></ElIcon> 会话使用 IndexedDB</span>
          <span><ElIcon><Connection /></ElIcon> 支持多种模型与语音能力</span>
        </div>
      </section>

      <div class="guide-layout">
        <aside class="lesson-nav">
          <div class="lesson-progress">
            <span>教程目录</span>
            <small>6 个步骤</small>
          </div>
          <nav aria-label="教程目录">
            <button v-for="lesson in lessons" :key="lesson.id" type="button" @click="scrollToLesson(lesson.id)">
              <span>{{ lesson.index }}</span>{{ lesson.label }}
            </button>
          </nav>
          <div class="lesson-help">
            <strong>需要帮助？</strong>
            <RouterLink to="/project">查看项目说明 <ElIcon><ArrowRight /></ElIcon></RouterLink>
          </div>
        </aside>

        <div class="lesson-list">
          <article id="api-key" class="lesson-card">
            <div class="lesson-copy">
              <span class="lesson-number">01</span>
              <div>
                <small>准备工作</small>
                <h2>准备 API Key</h2>
                <p>AI Chat 采用 BYOK 模式。你需要准备 DeepSeek 或智谱 GLM 的模型服务 Key，密钥只保存在当前设备。</p>
                <RouterLink class="lesson-link" to="/settings">前往设置 <ElIcon><ArrowRight /></ElIcon></RouterLink>
              </div>
            </div>
            <div class="lesson-demo settings-demo">
              <div class="mini-nav"><strong>AI Chat</strong><span><ElIcon><ChatDotRound /></ElIcon>聊天</span><span class="active"><ElIcon><Setting /></ElIcon>设置</span></div>
              <div class="mini-content">
                <label>模型 API Key</label>
                <div class="mock-input">sk-••••••••••••••••</div>
                <div class="mock-status warning"><ElIcon><WarningFilled /></ElIcon> 保存前请先验证密钥</div>
                <button>验证并保存</button>
              </div>
            </div>
          </article>

          <article id="model" class="lesson-card">
            <div class="lesson-copy">
              <span class="lesson-number">02</span>
              <div>
                <small>模型连接</small>
                <h2>选择模型</h2>
                <p>在设置页选择服务商和模型。你可以先从默认模型开始，之后随时切换，不影响本地会话历史。</p>
                <RouterLink class="lesson-link" to="/settings">选择模型 <ElIcon><ArrowRight /></ElIcon></RouterLink>
              </div>
            </div>
            <div class="lesson-demo model-demo">
              <div class="demo-field"><label>模型服务商</label><button><span>DeepSeek</span><small>当前选择</small></button></div>
              <div class="demo-field"><label>模型</label><button><span>deepseek-chat</span><small>日常对话</small></button></div>
              <p><ElIcon><CircleCheckFilled /></ElIcon> 配置仅用于你主动发起的模型请求</p>
            </div>
          </article>

          <article id="character" class="lesson-card">
            <div class="lesson-copy">
              <span class="lesson-number">03</span>
              <div>
                <small>角色系统</small>
                <h2>创建一个角色</h2>
                <p>定义名字、关系、背景、语气和回复长度。角色设定越具体，对话风格越稳定。</p>
                <RouterLink class="lesson-link" to="/characters/new">创建角色 <ElIcon><ArrowRight /></ElIcon></RouterLink>
              </div>
            </div>
            <div class="lesson-demo character-demo">
              <span class="character-avatar">小</span>
              <div class="character-fields"><label>角色名称</label><div>小夏</div><label>角色定位</label><div>温柔体贴的日常聊天伙伴</div></div>
              <div class="character-tags"><span>温柔</span><span>活泼</span><span>善于倾听</span></div>
            </div>
          </article>

          <article id="chat" class="lesson-card">
            <div class="lesson-copy">
              <span class="lesson-number">04</span>
              <div>
                <small>核心体验</small>
                <h2>开始聊天</h2>
                <p>选择角色后即可进入聊天。所有会话保存在本地，你可以随时继续上一次对话。</p>
                <RouterLink class="lesson-link" to="/chat">开始对话 <ElIcon><ArrowRight /></ElIcon></RouterLink>
              </div>
            </div>
            <div class="lesson-demo chat-demo">
              <div class="chat-title"><span>小</span><strong>小夏</strong><small>在线</small></div>
              <div class="chat-bubble">你好，我是小夏。今天想从什么开始聊？</div>
              <div class="chat-composer"><span>输入消息，Enter 发送</span><ElIcon><ArrowRight /></ElIcon></div>
            </div>
          </article>

          <article id="voice" class="lesson-card">
            <div class="lesson-copy">
              <span class="lesson-number">05</span>
              <div>
                <small>可选增强</small>
                <h2>启用语音</h2>
                <p>打开语音能力后，可以使用语音输入或让角色朗读回复。每种音色都可以先试听，再决定是否使用。</p>
                <RouterLink class="lesson-link" to="/settings">配置语音 <ElIcon><ArrowRight /></ElIcon></RouterLink>
              </div>
            </div>
            <div class="lesson-demo voice-demo">
              <div><ElIcon><Mic /></ElIcon><span><strong>语音输入</strong><small>本地识别 / 浏览器识别</small></span><i></i></div>
              <div><ElIcon><Headset /></ElIcon><span><strong>语音朗读</strong><small>Edge TTS / 智谱朗读</small></span><i class="on"></i></div>
              <button><ElIcon><Headset /></ElIcon>试听当前音色</button>
            </div>
          </article>

          <article id="local-data" class="lesson-card">
            <div class="lesson-copy">
              <span class="lesson-number">06</span>
              <div>
                <small>安全边界</small>
                <h2>理解本地数据</h2>
                <p>本地优先不等于完全离线。会话由 AI Chat 保存在本机，但模型和部分语音能力仍会请求你选择的服务商。</p>
                <RouterLink class="lesson-link" to="/project">查看完整说明 <ElIcon><ArrowRight /></ElIcon></RouterLink>
              </div>
            </div>
            <div class="lesson-demo data-demo">
              <div><ElIcon><CircleCheckFilled /></ElIcon><span><strong>角色与会话</strong><small>保存在本地 IndexedDB</small></span></div>
              <div><ElIcon><CircleCheckFilled /></ElIcon><span><strong>模型密钥</strong><small>保存在当前浏览器</small></span></div>
              <div><ElIcon><WarningFilled /></ElIcon><span><strong>公共设备</strong><small>不要选择记住 API Key</small></span></div>
            </div>
          </article>
        </div>
      </div>

      <section class="guide-boundary">
        <ElIcon><Lock /></ElIcon>
        <div><span>本地优先 · 你的数据，由你掌控</span><p>我们不读取、不存储你的聊天内容。公共设备使用后，请清除本地数据与密钥。</p></div>
        <div class="boundary-points"><span><ElIcon><CircleCheckFilled /></ElIcon> BYOK</span><span><ElIcon><CircleCheckFilled /></ElIcon> IndexedDB</span><span><ElIcon><CircleCheckFilled /></ElIcon> 不建立云端档案</span></div>
      </section>

      <section class="guide-final">
        <h2>准备好开始第一场对话了吗？</h2>
        <p>从设置模型到创建角色，通常只需要几分钟。</p>
        <div class="guide-actions">
          <RouterLink class="primary-action" to="/settings">打开 AI Chat 开始配置 <ElIcon><ArrowRight /></ElIcon></RouterLink>
          <RouterLink class="secondary-action" to="/">返回官网</RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.guide-page {
  min-height: 100%;
  background: #071124;
  color: #f4f6fb;
}

.guide-hero {
  padding: 84px 20px 54px;
  text-align: center;
}

.guide-kicker {
  width: fit-content;
  margin: 0 auto 22px;
  padding: 8px 13px;
  border: 1px solid #33436a;
  border-radius: 999px;
  background: #0b1830;
  color: #9e97ff;
  font-size: 13px;
  font-weight: 700;
}

.guide-hero h1 {
  font-size: clamp(42px, 6vw, 68px);
  line-height: 1.15;
  letter-spacing: 0;
}

.guide-hero h1 span {
  color: #8e86ff;
}

.guide-hero > p {
  margin-top: 18px;
  color: #95a1b9;
  font-size: 16px;
}

.guide-actions {
  margin-top: 28px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.primary-action,
.secondary-action {
  min-height: 46px;
  padding: 0 19px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border-radius: 7px;
  font-size: 14px;
  font-weight: 700;
}

.primary-action {
  border: 1px solid #9189ff;
  background: #6c63ff;
  color: #fff;
  box-shadow: 0 12px 32px rgba(108, 99, 255, 0.24);
}

.secondary-action {
  border: 1px solid #3a4a70;
  background: #0a172d;
  color: #dce2ef;
}

.guide-trust {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px 30px;
  color: #7f8ca6;
  font-size: 12px;
}

.guide-trust span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.guide-layout {
  width: min(1160px, calc(100% - 40px));
  margin: 0 auto;
  padding: 24px 0 90px;
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.lesson-nav {
  position: sticky;
  top: 96px;
  overflow: hidden;
  border: 1px solid #304365;
  border-radius: 9px;
  background: #0d1930;
}

.lesson-progress {
  padding: 18px 16px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #293b5c;
}

.lesson-progress span {
  font-size: 14px;
  font-weight: 700;
}

.lesson-progress small {
  color: #687792;
}

.lesson-nav nav {
  padding: 10px;
}

.lesson-nav button {
  width: 100%;
  min-height: 42px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 6px;
  background: transparent;
  color: #9aa6bd;
  font-size: 12px;
  text-align: left;
}

.lesson-nav button:hover,
.lesson-nav button:focus-visible {
  background: #20315e;
  color: #fff;
}

.lesson-nav button span {
  width: 25px;
  height: 25px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #263453;
  color: #aaa5ff;
  font-size: 10px;
}

.lesson-help {
  margin: 0 10px 10px;
  padding: 14px 12px;
  border-top: 1px solid #293b5c;
  color: #7f8ca6;
  font-size: 11px;
}

.lesson-help strong {
  display: block;
  margin-bottom: 7px;
  color: #cdd5e4;
}

.lesson-help a {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #9e97ff;
}

.lesson-list {
  display: grid;
  gap: 16px;
}

.lesson-card {
  scroll-margin-top: 92px;
  min-height: 320px;
  padding: 28px;
  display: grid;
  grid-template-columns: minmax(300px, 0.92fr) minmax(360px, 1.08fr);
  gap: 30px;
  align-items: center;
  border: 1px solid #304365;
  border-radius: 9px;
  background: #0d1930;
}

.lesson-copy {
  display: flex;
  align-items: flex-start;
  gap: 18px;
}

.lesson-number {
  width: 42px;
  height: 42px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #7e75ff;
  border-radius: 50%;
  background: #443eb1;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 8px 24px rgba(108, 99, 255, 0.22);
}

.lesson-copy small {
  color: #857ef0;
  font-size: 11px;
  font-weight: 700;
}

.lesson-copy h2 {
  margin-top: 7px;
  font-size: 25px;
  letter-spacing: 0;
}

.lesson-copy p {
  margin-top: 12px;
  color: #8f9ab1;
  font-size: 13px;
  line-height: 1.75;
}

.lesson-link {
  width: fit-content;
  min-height: 38px;
  margin-top: 18px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #746dff;
  border-radius: 6px;
  background: #6259ed;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.lesson-demo {
  min-height: 230px;
  overflow: hidden;
  border: 1px solid #34496f;
  border-radius: 8px;
  background: #0a152a;
}

.settings-demo {
  display: grid;
  grid-template-columns: 120px 1fr;
}

.mini-nav {
  padding: 18px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  border-right: 1px solid #2c3e61;
  background: #111e39;
}

.mini-nav strong {
  margin: 0 8px 12px;
  font-size: 13px;
}

.mini-nav span {
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 7px;
  border-radius: 5px;
  color: #72809a;
  font-size: 10px;
}

.mini-nav span.active {
  background: #28386d;
  color: #aaa5ff;
}

.mini-content {
  padding: 28px 22px;
}

.mini-content label,
.demo-field label {
  display: block;
  margin-bottom: 8px;
  color: #74819a;
  font-size: 10px;
}

.mock-input,
.demo-field button {
  min-height: 38px;
  padding: 0 11px;
  display: flex;
  align-items: center;
  border: 1px solid #34496f;
  border-radius: 6px;
  background: #111e37;
  color: #aeb8ca;
  font-size: 11px;
}

.mock-status {
  margin-top: 10px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 7px;
  border-radius: 5px;
  font-size: 10px;
}

.mock-status.warning {
  background: rgba(255, 193, 61, 0.08);
  color: #e8bd54;
}

.mini-content button,
.voice-demo > button {
  min-height: 36px;
  margin-top: 12px;
  padding: 0 14px;
  border-radius: 6px;
  background: #675ef4;
  color: #fff;
  font-size: 11px;
}

.model-demo {
  padding: 28px;
  display: grid;
  align-content: center;
  gap: 15px;
}

.demo-field button {
  width: 100%;
  justify-content: space-between;
}

.demo-field button small {
  color: #746fe1;
}

.model-demo > p {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #78d2c1;
  font-size: 10px;
}

.character-demo {
  padding: 28px;
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 16px;
  align-content: center;
}

.character-avatar,
.chat-title > span {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #8a4fe3;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}

.character-fields {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px;
  align-items: center;
  color: #71809a;
  font-size: 10px;
}

.character-fields div {
  min-height: 32px;
  padding: 8px 10px;
  border: 1px solid #34496f;
  border-radius: 5px;
  color: #c9d1df;
}

.character-tags {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.character-tags span {
  padding: 5px 9px;
  border: 1px solid #4f4fa0;
  border-radius: 999px;
  color: #aaa5ff;
  font-size: 9px;
}

.chat-demo {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.chat-title {
  display: grid;
  grid-template-columns: 36px auto 1fr;
  align-items: center;
  gap: 9px;
}

.chat-title > span {
  width: 34px;
  height: 34px;
  font-size: 12px;
}

.chat-title strong {
  font-size: 12px;
}

.chat-title small {
  color: #61c9ae;
  font-size: 9px;
}

.chat-bubble {
  width: 76%;
  margin: 24px 0;
  padding: 12px;
  border: 1px solid #304365;
  border-radius: 7px;
  background: #15213d;
  color: #bbc5d7;
  font-size: 11px;
  line-height: 1.6;
}

.chat-composer {
  min-height: 40px;
  margin-top: auto;
  padding: 0 10px 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #34496f;
  border-radius: 6px;
  color: #687791;
  font-size: 10px;
}

.chat-composer .el-icon {
  color: #9f99ff;
}

.voice-demo {
  padding: 25px;
  display: grid;
  align-content: center;
  gap: 11px;
}

.voice-demo > div {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #304365;
  border-radius: 6px;
}

.voice-demo > div > .el-icon {
  color: #9c96ff;
  font-size: 20px;
}

.voice-demo span {
  flex: 1;
}

.voice-demo strong,
.voice-demo small {
  display: block;
}

.voice-demo strong {
  font-size: 11px;
}

.voice-demo small {
  margin-top: 3px;
  color: #71809a;
  font-size: 9px;
}

.voice-demo i {
  width: 30px;
  height: 16px;
  border-radius: 9px;
  background: #35425d;
}

.voice-demo i.on {
  background: #6c63ff;
}

.voice-demo > button {
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.data-demo {
  padding: 24px;
  display: grid;
  align-content: center;
}

.data-demo > div {
  padding: 15px 2px;
  display: flex;
  align-items: center;
  gap: 11px;
  border-bottom: 1px solid #2d3f60;
}

.data-demo > div:last-child {
  border-bottom: 0;
}

.data-demo .el-icon {
  color: #71d2bd;
  font-size: 18px;
}

.data-demo > div:last-child .el-icon {
  color: #e8bd54;
}

.data-demo strong,
.data-demo small {
  display: block;
}

.data-demo strong {
  font-size: 11px;
}

.data-demo small {
  margin-top: 4px;
  color: #71809a;
  font-size: 9px;
}

.guide-boundary {
  width: min(1160px, calc(100% - 40px));
  margin: 0 auto;
  padding: 34px;
  display: grid;
  grid-template-columns: 58px 1fr auto;
  align-items: center;
  gap: 22px;
  border: 1px solid #3a4d72;
  border-radius: 9px;
  background: #0d1930;
}

.guide-boundary > .el-icon {
  width: 52px;
  height: 52px;
  border: 1px solid #51678f;
  border-radius: 50%;
  color: #9e97ff;
  font-size: 24px;
}

.guide-boundary span {
  font-weight: 700;
}

.guide-boundary p {
  margin-top: 7px;
  color: #7e8ba5;
  font-size: 12px;
}

.boundary-points {
  display: grid;
  gap: 9px;
  color: #9aa6bd;
  font-size: 11px;
}

.boundary-points span {
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 500;
}

.boundary-points .el-icon {
  color: #69cfb8;
}

.guide-final {
  padding: 86px 20px 96px;
  text-align: center;
}

.guide-final h2 {
  font-size: clamp(28px, 4vw, 42px);
  letter-spacing: 0;
}

.guide-final p {
  margin-top: 12px;
  color: #8592aa;
}

@media (max-width: 980px) {
  .guide-layout {
    grid-template-columns: 1fr;
  }

  .lesson-nav {
    position: static;
  }

  .lesson-nav nav {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .lesson-help {
    display: none;
  }

  .lesson-card {
    grid-template-columns: 1fr;
  }

  .guide-boundary {
    grid-template-columns: 58px 1fr;
  }

  .boundary-points {
    grid-column: 2;
  }
}

@media (max-width: 680px) {
  .guide-hero {
    padding-top: 64px;
  }

  .guide-hero h1 {
    font-size: 38px;
  }

  .guide-hero h1 span {
    white-space: nowrap;
  }

  .guide-actions {
    flex-direction: column;
  }

  .guide-actions a {
    width: 100%;
  }

  .guide-layout,
  .guide-boundary {
    width: min(100% - 28px, 1160px);
  }

  .lesson-nav nav {
    grid-template-columns: 1fr 1fr;
  }

  .lesson-card {
    min-height: 0;
    padding: 22px 16px;
    gap: 24px;
  }

  .lesson-copy {
    gap: 12px;
  }

  .lesson-number {
    width: 36px;
    height: 36px;
  }

  .settings-demo {
    grid-template-columns: 88px 1fr;
  }

  .mini-content {
    padding: 22px 14px;
  }

  .guide-boundary {
    padding: 25px 20px;
    grid-template-columns: 1fr;
  }

  .guide-boundary > .el-icon {
    width: 46px;
    height: 46px;
  }

  .boundary-points {
    grid-column: 1;
  }
}
</style>
