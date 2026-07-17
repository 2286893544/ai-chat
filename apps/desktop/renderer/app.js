(() => {
  'use strict'

  const STORAGE = {
    settings: 'ai-chat-desktop.settings',
    characters: 'ai-chat-desktop.characters',
    currentCharacter: 'ai-chat-desktop.current-character',
    messages: 'ai-chat-desktop.messages',
  }

  const PROVIDERS = {
    deepseek: {
      label: 'DeepSeek',
      model: 'deepseek-v4-flash',
      baseURL: 'https://api.deepseek.com',
      placeholder: '输入 DeepSeek API Key',
    },
    zhipu: {
      label: '智谱 GLM',
      model: 'glm-5.2',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      placeholder: '输入智谱 GLM API Key',
    },
  }

  const EDGE_VOICES = [
    ['zh-CN-XiaoxiaoNeural', '晓晓（女声，自然）'],
    ['zh-CN-XiaoyiNeural', '晓伊（女声，亲和）'],
    ['zh-CN-YunjianNeural', '云健（男声，热情）'],
    ['zh-CN-YunxiNeural', '云希（男声，年轻）'],
    ['zh-CN-YunxiaNeural', '云夏（男声，可爱）'],
    ['zh-CN-YunyangNeural', '云扬（男声，稳重）'],
    ['zh-CN-liaoning-XiaobeiNeural', '东北话小北'],
    ['zh-CN-shaanxi-XiaoniNeural', '陕西话小妮'],
    ['zh-HK-HiuGaaiNeural', '粤语晓佳（女声）'],
    ['zh-HK-HiuMaanNeural', '粤语晓曼（女声）'],
    ['zh-HK-WanLungNeural', '粤语云龙（男声）'],
    ['zh-TW-HsiaoChenNeural', '台湾晓臻（女声）'],
    ['zh-TW-HsiaoYuNeural', '台湾晓雨（女声）'],
    ['zh-TW-YunJheNeural', '台湾云哲（男声）'],
  ]

  const ZHIPU_VOICES = [
    ['tongtong', '彤彤'], ['chuichui', '锤锤'], ['xiaochen', '小陈'],
    ['jam', 'Jam'], ['kazi', 'Kazi'], ['douji', 'Douji'], ['luodo', 'Luodo'],
  ]

  const ROLE_PRESETS = [
    {
      id: 'daily-chat-friend', name: '日常唠嗑搭子', gender: 'neutral', ageText: '同龄朋友感',
      background: '一个熟悉你日常节奏的聊天搭子，喜欢听你分享琐碎小事，也会自然接话、开玩笑和延展话题。',
      relationship: '朋友', personalityTags: ['随和', '接地气', '有分寸', '会接话'], temperTags: ['稳定', '不扫兴', '慢热但亲近'],
      hobbies: ['日常聊天', '电影', '音乐', '美食', '散步'], expertise: ['陪聊', '话题延展', '情绪接住'],
      forbiddenTopics: ['严肃说教', '办公汇报', '强行给方案'], preferredTopics: ['今天发生的事', '吃喝玩乐', '心情变化'],
      tone: '轻松、自然、像朋友', speakingStyle: '短句为主，会顺着用户的话继续聊，不急着总结和给建议',
      catchphrases: ['然后呢？', '这也太真实了', '我懂你这个点'], replyLength: 'medium', emojiLevel: 'low', userNickname: '你',
    },
    {
      id: 'warm-companion', name: '温柔陪伴者', gender: 'neutral', ageText: '温柔成熟感',
      background: '一个温柔稳定的陪伴者，会认真听你说话，优先理解和安抚情绪，不会急着评判或给大道理。',
      relationship: '陪伴者', personalityTags: ['温柔', '耐心', '共情', '稳定'], temperTags: ['情绪稳定', '不急躁', '包容'],
      hobbies: ['听人说话', '散步', '阅读', '轻音乐'], expertise: ['情绪陪伴', '安慰', '倾听'],
      forbiddenTopics: ['冷漠否定', '命令式建议'], preferredTopics: ['心情', '压力', '委屈', '关系烦恼'],
      tone: '温柔、慢一点、让人放松', speakingStyle: '先接住情绪，再轻轻追问；少用判断，多用理解',
      catchphrases: ['先别急，慢慢说', '你这样想也很正常', '我在听'], replyLength: 'medium', emojiLevel: 'low', userNickname: '你',
    },
    {
      id: 'funny-banter', name: '吐槽玩梗朋友', gender: 'neutral', ageText: '年轻朋友感',
      background: '一个反应快、会玩梗、但不冒犯人的朋友，适合下班后放松聊天、吐槽日常和分享奇怪脑洞。',
      relationship: '损友但有分寸', personalityTags: ['幽默', '活泼', '反应快', '有边界感'], temperTags: ['不记仇', '会收敛', '轻松'],
      hobbies: ['玩梗', '短视频', '游戏', '综艺'], expertise: ['轻松吐槽', '玩笑接话', '气氛活跃'],
      forbiddenTopics: ['恶意嘲讽', '人身攻击', '过度冒犯'], preferredTopics: ['离谱日常', '热门梗', '游戏'],
      tone: '活泼、幽默、带一点吐槽', speakingStyle: '可以开轻微玩笑，但用户认真时要立刻收住并认真回应',
      catchphrases: ['这剧情有点离谱', '笑死，但我懂'], replyLength: 'short', emojiLevel: 'medium', userNickname: '你',
    },
  ]

  const params = new URLSearchParams(window.location.search)
  const apiOrigin = params.get('apiOrigin') || 'http://127.0.0.1:38674'
  const workspace = document.querySelector('#workspace')
  const keyState = document.querySelector('#key-state')
  const toastRegion = document.querySelector('#toast-region')

  const state = {
    view: 'chat',
    settings: readJSON(STORAGE.settings, {
      provider: 'deepseek',
      model: PROVIDERS.deepseek.model,
      baseURL: PROVIDERS.deepseek.baseURL,
      apiKey: '',
      rememberKey: false,
      validatedAt: '',
      maskedKey: '',
      sttProvider: 'faster-whisper',
      localWhisperModel: 'base',
      sttLanguage: 'zh',
      ttsProvider: 'browser',
      browserRate: 0.96,
      browserPitch: 1.06,
      edgeVoice: 'zh-CN-XiaoxiaoNeural',
      edgeRate: '+0%',
      edgePitch: '+0Hz',
      edgeVolume: '+0%',
      edgeEmotionEnabled: false,
      edgeEmotionStyle: 'auto',
      elevenLabsApiKey: '',
      elevenLabsVoiceId: 'JBFqnCBsd6RMkjVDRZzb',
      elevenLabsModelId: 'eleven_multilingual_v2',
      elevenLabsStability: 0.45,
      elevenLabsSimilarityBoost: 0.75,
      elevenLabsStyle: 0.35,
      zhipuTtsApiKey: '',
      zhipuVoice: 'tongtong',
      zhipuSpeed: 1.2,
      zhipuVolume: 1,
      zhipuEmotionEnabled: false,
      zhipuEmotionStyle: 'auto',
      zhipuEmotionGranularity: 'sentence',
      localVoiceId: '',
      autoSpeakEnabled: false,
    }),
    characters: readJSON(STORAGE.characters, []),
    currentCharacterId: localStorage.getItem(STORAGE.currentCharacter) || '',
    messagesByCharacter: readJSON(STORAGE.messages, {}),
    editingCharacterId: '',
    streaming: false,
    abortController: null,
    recording: false,
    recordingStartedAt: 0,
    mediaRecorder: null,
    mediaStream: null,
    recordingChunks: [],
    speechRecognizer: null,
    browserTranscript: '',
    currentAudio: null,
    localVoices: [],
    voiceSample: null,
    proactiveChecking: false,
  }

  normalizeState()
  bindShellEvents()
  render()
  refreshLocalVoices(false)
  window.setInterval(runProactiveTick, 30000)

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : fallback
    } catch {
      return fallback
    }
  }

  function normalizeState() {
    state.settings = {
      sttProvider: 'faster-whisper', localWhisperModel: 'base', sttLanguage: 'zh',
      ttsProvider: 'browser', browserRate: 0.96, browserPitch: 1.06,
      edgeVoice: 'zh-CN-XiaoxiaoNeural', edgeRate: '+0%', edgePitch: '+0Hz', edgeVolume: '+0%', edgeEmotionEnabled: false, edgeEmotionStyle: 'auto',
      elevenLabsApiKey: '', elevenLabsVoiceId: 'JBFqnCBsd6RMkjVDRZzb', elevenLabsModelId: 'eleven_multilingual_v2', elevenLabsStability: 0.45, elevenLabsSimilarityBoost: 0.75, elevenLabsStyle: 0.35,
      zhipuTtsApiKey: '', zhipuVoice: 'tongtong', zhipuSpeed: 1.2, zhipuVolume: 1, zhipuEmotionEnabled: false, zhipuEmotionStyle: 'auto', zhipuEmotionGranularity: 'sentence',
      localVoiceId: '', autoSpeakEnabled: false,
      ...state.settings,
    }
    if (!PROVIDERS[state.settings.provider]) state.settings.provider = 'deepseek'
    const provider = PROVIDERS[state.settings.provider]
    state.settings.model ||= provider.model
    state.settings.baseURL ||= provider.baseURL
    if (!state.settings.rememberKey) state.settings.apiKey = ''

    if (!Array.isArray(state.characters) || state.characters.length === 0) {
      state.characters = [createCharacter('小夏', {
        relationship: '日常聊天伙伴',
        background: '温柔、清醒，也愿意认真听你说话。',
        personalityTags: ['温柔', '活泼', '有耐心'],
        tone: '自然温和',
        speakingStyle: '简洁、真诚、有回应感',
      })]
    }

    if (!state.characters.some((character) => character.id === state.currentCharacterId)) {
      state.currentCharacterId = state.characters[0].id
    }

    state.characters.forEach((character) => {
      if (!Array.isArray(state.messagesByCharacter[character.id])) {
        state.messagesByCharacter[character.id] = []
      }
    })
    persistCharacters()
    persistMessages()
    persistSettings()
  }

  function createCharacter(name = '新角色', overrides = {}) {
    const now = new Date().toISOString()
    return {
      id: crypto.randomUUID(),
      name,
      relationship: '朋友',
      background: '',
      personalityTags: ['真诚', '有耐心'],
      temperTags: [],
      hobbies: [],
      expertise: [],
      forbiddenTopics: [],
      preferredTopics: [],
      tone: '自然温和',
      speakingStyle: '简洁、清晰',
      catchphrases: [],
      replyLength: 'medium',
      emojiLevel: 'low',
      userNickname: '你',
      proactive: {
        enabled: false,
        minIntervalMinutes: 10,
        maxDailyCount: 6,
        activeHours: { start: '09:00', end: '23:00' },
        initiativeLevel: 'medium',
        topicSources: ['recent_context'],
        doNotDisturb: false,
      },
      safety: {
        followUpQuestions: true,
        rememberContext: true,
        avoidLongReplies: false,
        comfortOnLowMood: true,
        allowTeasing: true,
        allowFlirtyTone: false,
        safetyGuardrails: true,
      },
      createdAt: now,
      updatedAt: now,
      ...overrides,
    }
  }

  function bindShellEvents() {
    document.querySelectorAll('.nav-item').forEach((button) => {
      button.addEventListener('click', () => {
        if (state.streaming && button.dataset.view !== 'chat') {
          showToast('请先停止当前回复', 'error')
          return
        }
        state.view = button.dataset.view
        setActiveNavigation()
        render()
      })
    })
  }

  function setActiveNavigation() {
    document.querySelectorAll('.nav-item').forEach((button) => {
      button.classList.toggle('active', button.dataset.view === state.view)
    })
  }

  function render() {
    updateKeyState()
    if (state.view === 'chat') renderChat()
    if (state.view === 'characters') renderCharacters()
    if (state.view === 'settings') renderSettings()
    if (state.view === 'project') renderProject()
  }

  function currentCharacter() {
    return state.characters.find((character) => character.id === state.currentCharacterId) || state.characters[0]
  }

  function currentMessages() {
    return state.messagesByCharacter[state.currentCharacterId] || []
  }

  function renderChat() {
    const character = currentCharacter()
    workspace.innerHTML = `
      <section class="chat-layout">
        <div class="chat-main">
          <header class="view-header">
            <div class="view-title">
              ${avatar(character)}
              <div><h1>${escapeHTML(character.name)}</h1><p>${escapeHTML(character.relationship || '聊天伙伴')}</p></div>
            </div>
            <div class="header-actions">
              <button id="clear-chat" class="icon-button" title="清空当前对话" aria-label="清空当前对话"><svg><use href="#icon-trash"/></svg></button>
            </div>
          </header>
          <div id="message-scroll" class="message-scroll"><div id="message-list"></div></div>
          <div class="composer-wrap">
            <form id="composer" class="composer">
              <button id="record-button" class="composer-tool${state.recording ? ' recording' : ''}" type="button" title="${state.recording ? '停止录音' : '语音输入'}" aria-label="${state.recording ? '停止录音' : '语音输入'}"><svg><use href="#icon-${state.recording ? 'stop' : 'mic'}"/></svg></button>
              <textarea id="message-input" rows="1" maxlength="8000" placeholder="${state.recording ? '正在录音…' : `给 ${escapeHTML(character.name)} 发消息`}" aria-label="消息内容" ${state.recording ? 'disabled' : ''}></textarea>
              <button id="send-button" class="send-button${state.streaming ? ' stop' : ''}" type="${state.streaming ? 'button' : 'submit'}" title="${state.streaming ? '停止生成' : '发送消息'}" aria-label="${state.streaming ? '停止生成' : '发送消息'}">
                <svg><use href="#icon-${state.streaming ? 'stop' : 'send'}"/></svg>
              </button>
            </form>
            ${state.recording ? '<div class="recording-indicator"><span class="recording-dot"></span><span>正在录音，再次点击麦克风结束并识别</span></div>' : ''}
            <div class="composer-note"><span>${PROVIDERS[state.settings.provider].label} · ${escapeHTML(state.settings.model)}</span><span>内容仅保存在这台设备</span></div>
          </div>
        </div>
        ${renderCharacterPanel(character)}
      </section>`

    renderMessageList()
    const input = workspace.querySelector('#message-input')
    input.addEventListener('input', () => autoResize(input))
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault()
        workspace.querySelector('#composer').requestSubmit()
      }
    })
    workspace.querySelector('#composer').addEventListener('submit', handleSend)
    workspace.querySelector('#send-button').addEventListener('click', () => {
      if (state.streaming) stopStreaming()
    })
    workspace.querySelector('#record-button').addEventListener('click', toggleRecording)
    workspace.querySelector('#clear-chat').addEventListener('click', clearCurrentChat)
    workspace.querySelectorAll('[data-character-id]').forEach((button) => {
      button.addEventListener('click', () => selectCharacter(button.dataset.characterId))
    })
    workspace.querySelector('#manage-characters').addEventListener('click', () => {
      state.view = 'characters'
      setActiveNavigation()
      render()
    })
    workspace.querySelector('#toggle-proactive').addEventListener('change', (event) => toggleProactive(event.target.checked))
    workspace.querySelector('#toggle-autospeak').addEventListener('change', (event) => toggleAutoSpeak(event.target.checked))
  }

  function renderCharacterPanel(character) {
    const tags = character.personalityTags?.length ? character.personalityTags : ['自然', '真诚']
    return `
      <aside class="character-panel">
        <div class="character-summary">
          ${avatar(character, true)}
          <h2>${escapeHTML(character.name)}</h2>
          <p>${escapeHTML(character.background || '你的私人 AI 聊天伙伴')}</p>
        </div>
        <div class="panel-section">
          <div class="section-label">切换角色</div>
          ${state.characters.map((item) => `
            <button class="character-option${item.id === character.id ? ' active' : ''}" data-character-id="${item.id}">
              ${avatar(item)}
              <span><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.relationship || '朋友')}</small></span>
              <svg class="chevron"><use href="#icon-chevron"/></svg>
            </button>`).join('')}
          <button id="manage-characters" class="wide-button"><svg><use href="#icon-edit"/></svg><span>管理角色</span></button>
        </div>
        <div class="panel-section">
          <div class="section-label">对话设置</div>
          <label class="switch-row"><span>主动聊天</span><input id="toggle-proactive" type="checkbox" ${character.proactive?.enabled ? 'checked' : ''}/><i></i></label>
          <label class="switch-row"><span>自动朗读</span><input id="toggle-autospeak" type="checkbox" ${state.settings.autoSpeakEnabled ? 'checked' : ''}/><i></i></label>
        </div>
        <div class="panel-section">
          <div class="section-label">角色信息</div>
          <div class="tags">${tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div>
        </div>
      </aside>`
  }

  function renderMessageList() {
    const list = workspace.querySelector('#message-list')
    if (!list) return
    const messages = currentMessages()
    if (messages.length === 0) {
      list.innerHTML = `
        <div class="empty-chat"><div class="empty-chat-content">
          <div class="empty-symbol"><svg><use href="#icon-message"/></svg></div>
          <h2>开始对话</h2>
          <p>${state.settings.apiKey ? '输入一条消息，开始新的对话。' : '请先在设置中验证模型 API Key。'}</p>
        </div></div>`
      return
    }

    list.innerHTML = `<div class="messages">${messages.map((message) => renderMessage(message)).join('')}</div>`
    list.querySelectorAll('[data-speak]').forEach((button) => {
      button.addEventListener('click', () => speakMessage(button.dataset.speak))
    })
    list.querySelectorAll('[data-copy]').forEach((button) => {
      button.addEventListener('click', () => copyMessage(button.dataset.copy))
    })
    requestAnimationFrame(scrollMessagesToBottom)
  }

  function renderMessage(message) {
    const character = currentCharacter()
    const isUser = message.role === 'user'
    const label = isUser ? '你' : character.name
    const content = message.content || (message.status === 'streaming' ? '正在思考' : '')
    const messageActions = message.status === 'done' && content
      ? `<span class="message-actions"><button class="message-action" data-copy="${message.id}" title="复制消息" aria-label="复制消息"><svg><use href="#icon-copy"/></svg></button>${!isUser ? `<button class="message-action" data-speak="${message.id}" title="朗读回复" aria-label="朗读回复"><svg><use href="#icon-volume"/></svg></button>` : ''}</span>`
      : ''
    return `
      <article class="message-row ${isUser ? 'user' : 'assistant'}">
        ${avatar(isUser ? { name: '你' } : character)}
        <div class="message-body">
          <div class="message-meta"><span>${escapeHTML(label)} · ${formatTime(message.createdAt)}</span>${messageActions}</div>
          <div class="message-bubble${message.status === 'failed' ? ' failed' : ''}">${escapeHTML(content)}${message.status === 'streaming' ? '<span class="stream-caret"></span>' : ''}</div>
        </div>
      </article>`
  }

  async function handleSend(event) {
    event.preventDefault()
    if (state.streaming) return
    const input = workspace.querySelector('#message-input')
    const text = input.value.trim()
    if (!text) return
    if (!state.settings.apiKey) {
      showToast('请先在设置中验证 API Key', 'error')
      state.view = 'settings'
      setActiveNavigation()
      render()
      return
    }

    const history = currentMessages()
      .filter((message) => message.status === 'done')
      .map(({ role, content }) => ({ role, content }))
    const userMessage = createMessage('user', text, 'done')
    const assistantMessage = createMessage('assistant', '', 'streaming')
    currentMessages().push(userMessage, assistantMessage)
    persistMessages()
    input.value = ''
    autoResize(input)
    state.streaming = true
    renderChat()

    const controller = new AbortController()
    state.abortController = controller
    try {
      const response = await fetch(`${apiOrigin}/api/chat/completions/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Model-Api-Key': state.settings.apiKey,
        },
        body: JSON.stringify({
          conversationId: state.currentCharacterId,
          character: currentCharacter(),
          messages: history,
          input: text,
          provider: state.settings.provider,
          model: state.settings.model,
          baseURL: state.settings.baseURL,
          thinking: { type: 'disabled' },
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(localizeError(data.code, data.message || `请求失败（${response.status}）`))
      }
      if (!response.body) throw new Error('服务未返回可读取的数据流')
      await consumeStream(response.body, assistantMessage)
      if (assistantMessage.status === 'streaming') assistantMessage.status = 'done'
      if (!assistantMessage.content) assistantMessage.content = '暂时没有收到回复。'
      if (state.settings.autoSpeakEnabled && assistantMessage.status === 'done') {
        void speakText(assistantMessage.content, currentCharacter().tts)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        assistantMessage.status = 'cancelled'
        assistantMessage.content ||= '已停止生成。'
      } else {
        assistantMessage.status = 'failed'
        assistantMessage.content ||= error.message || '请求失败，请稍后重试。'
        showToast(assistantMessage.content, 'error')
      }
    } finally {
      state.streaming = false
      state.abortController = null
      persistMessages()
      if (state.view === 'chat') renderChat()
    }
  }

  async function consumeStream(stream, assistantMessage) {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) parseStreamLine(line, assistantMessage)
    }
    if (buffer.trim()) parseStreamLine(buffer, assistantMessage)
  }

  function parseStreamLine(line, assistantMessage) {
    if (!line.startsWith('data: ')) return
    const raw = line.slice(6).trim()
    if (!raw || raw === '[DONE]') return
    try {
      const data = JSON.parse(raw)
      if (typeof data.delta === 'string') {
        assistantMessage.content += data.delta
        renderMessageList()
      } else if (data.code || data.error) {
        throw new Error(localizeError(data.code, data.message || data.error))
      }
    } catch (error) {
      if (error instanceof SyntaxError) return
      throw error
    }
  }

  function stopStreaming() {
    state.abortController?.abort()
  }

  function clearCurrentChat() {
    if (state.streaming) return
    if (currentMessages().length === 0) return
    if (!window.confirm('确定清空当前角色的全部对话吗？')) return
    state.messagesByCharacter[state.currentCharacterId] = []
    persistMessages()
    renderChat()
    showToast('当前对话已清空', 'success')
  }

  function selectCharacter(characterId) {
    if (state.streaming || characterId === state.currentCharacterId) return
    state.currentCharacterId = characterId
    localStorage.setItem(STORAGE.currentCharacter, characterId)
    renderChat()
  }

  function speakMessage(messageId) {
    const message = currentMessages().find((item) => item.id === messageId)
    if (!message?.content) return
    void speakText(message.content, currentCharacter().tts)
  }

  async function copyMessage(messageId) {
    const message = currentMessages().find((item) => item.id === messageId)
    if (!message?.content) return
    await navigator.clipboard.writeText(message.content)
    showToast('消息已复制', 'success')
  }

  function toggleProactive(enabled) {
    const character = currentCharacter()
    character.proactive = { ...character.proactive, enabled }
    character.updatedAt = new Date().toISOString()
    persistCharacters()
    showToast(enabled ? '已开启主动聊天' : '已关闭主动聊天', 'success')
  }

  function toggleAutoSpeak(enabled) {
    state.settings.autoSpeakEnabled = enabled
    persistSettings()
    if (!enabled) stopSpeaking()
    showToast(enabled ? '已开启自动朗读' : '已关闭自动朗读', 'success')
  }

  async function toggleRecording() {
    if (state.streaming) return
    if (state.recording) {
      await finishRecording()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      state.mediaStream = stream
      state.mediaRecorder = recorder
      state.recordingChunks = []
      state.browserTranscript = ''
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) state.recordingChunks.push(event.data)
      })
      startBrowserRecognition()
      recorder.start()
      state.recording = true
      state.recordingStartedAt = Date.now()
      renderChat()
    } catch {
      showToast('无法使用麦克风，请检查系统权限', 'error')
    }
  }

  function startBrowserRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return
    try {
      const recognizer = new Recognition()
      recognizer.lang = 'zh-CN'
      recognizer.continuous = true
      recognizer.interimResults = true
      recognizer.addEventListener('result', (event) => {
        let text = ''
        for (let index = 0; index < event.results.length; index += 1) text += event.results[index][0].transcript
        state.browserTranscript = text.trim()
      })
      recognizer.start()
      state.speechRecognizer = recognizer
    } catch {
      state.speechRecognizer = null
    }
  }

  async function finishRecording() {
    const recorder = state.mediaRecorder
    if (!recorder) return
    const blob = await new Promise((resolve) => {
      recorder.addEventListener('stop', () => {
        resolve(new Blob(state.recordingChunks, { type: recorder.mimeType || 'audio/webm' }))
      }, { once: true })
      recorder.stop()
    })
    state.speechRecognizer?.stop()
    state.mediaStream?.getTracks().forEach((track) => track.stop())
    state.recording = false
    state.mediaRecorder = null
    state.mediaStream = null
    state.speechRecognizer = null
    renderChat()

    const input = workspace.querySelector('#message-input')
    input.placeholder = '正在识别录音…'
    input.disabled = true
    try {
      let transcript = state.browserTranscript
      if (state.settings.sttProvider !== 'browser') {
        const response = await fetch(`${apiOrigin}/api/stt/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: state.settings.sttProvider,
            audioDataUrl: await blobToDataURL(blob),
            model: state.settings.sttProvider === 'funasr' ? 'paraformer' : state.settings.localWhisperModel,
            language: state.settings.sttLanguage,
          }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || '本地语音识别失败')
        transcript = String(data.text || '').trim() || transcript
      }
      if (!transcript) throw new Error('没有识别到文字，请重试')
      input.value = transcript
      autoResize(input)
      input.focus()
      showToast('录音已转换为文字', 'success')
    } catch (error) {
      showToast(error.message || '语音识别失败', 'error')
    } finally {
      input.disabled = false
      input.placeholder = `给 ${currentCharacter().name} 发消息`
      state.recordingChunks = []
      state.browserTranscript = ''
    }
  }

  async function speakText(text, roleConfig = null) {
    const cleanText = String(text || '').replace(/\p{Extended_Pictographic}/gu, '').trim()
    if (!cleanText) return
    stopSpeaking()
    const config = { ...state.settings, ...(roleConfig || {}) }
    const provider = config.provider || config.ttsProvider || state.settings.ttsProvider
    try {
      if (provider === 'browser') {
        await speakWithBrowser(cleanText, config)
        return
      }

      const headers = { 'Content-Type': 'application/json' }
      const body = { provider, text: cleanText }
      if (provider === 'edge') Object.assign(body, {
        edgeVoice: config.edgeVoice, edgeRate: config.edgeRate, edgePitch: config.edgePitch,
        edgeVolume: config.edgeVolume, edgeEmotionEnabled: Boolean(config.edgeEmotionEnabled), edgeEmotionStyle: config.edgeEmotionStyle || 'auto',
      })
      if (provider === 'elevenlabs') {
        headers['X-ElevenLabs-Api-Key'] = config.elevenLabsApiKey || ''
        Object.assign(body, {
          voiceId: config.elevenLabsVoiceId, modelId: config.elevenLabsModelId,
          stability: Number(config.elevenLabsStability), similarityBoost: Number(config.elevenLabsSimilarityBoost),
          style: Number(config.elevenLabsStyle), useSpeakerBoost: true,
        })
      }
      if (provider === 'zhipu') {
        headers['X-Model-Api-Key'] = config.zhipuTtsApiKey || state.settings.apiKey
        Object.assign(body, {
          zhipuVoice: config.zhipuVoice, zhipuSpeed: Number(config.zhipuSpeed), zhipuVolume: Number(config.zhipuVolume),
          zhipuStream: false, zhipuEmotionEnabled: Boolean(config.zhipuEmotionEnabled),
          zhipuEmotionStyle: config.zhipuEmotionStyle || 'auto', zhipuEmotionGranularity: config.zhipuEmotionGranularity || 'sentence',
          zhipuBaseURL: PROVIDERS.zhipu.baseURL,
        })
      }
      if (provider === 'qwen-local') body.localVoiceId = config.localVoiceId || state.settings.localVoiceId

      const response = await fetch(`${apiOrigin}/api/tts/speak`, { method: 'POST', headers, body: JSON.stringify(body) })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || '朗读请求失败')
      }
      const audio = new Audio(URL.createObjectURL(await response.blob()))
      state.currentAudio = audio
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audio.src)
        if (state.currentAudio === audio) state.currentAudio = null
      }, { once: true })
      await audio.play()
    } catch (error) {
      showToast(error.message || '朗读失败', 'error')
      if (provider !== 'browser') await speakWithBrowser(cleanText, config).catch(() => {})
    }
  }

  function speakWithBrowser(text, config) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('当前系统不支持朗读'))
        return
      }
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = Number(config.browserRate || 0.96)
      utterance.pitch = Number(config.browserPitch || 1.06)
      utterance.addEventListener('end', resolve, { once: true })
      utterance.addEventListener('error', () => reject(new Error('系统朗读失败')), { once: true })
      window.speechSynthesis.speak(utterance)
    })
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel()
    if (state.currentAudio) {
      state.currentAudio.pause()
      URL.revokeObjectURL(state.currentAudio.src)
      state.currentAudio = null
    }
  }

  async function runProactiveTick() {
    const character = currentCharacter()
    if (state.proactiveChecking || state.streaming || state.recording || !state.settings.apiKey || !character.proactive?.enabled || character.proactive?.doNotDisturb) return
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const start = character.proactive.activeHours?.start || '09:00'
    const end = character.proactive.activeHours?.end || '23:00'
    if (currentTime < start || currentTime > end) return
    const messages = currentMessages()
    const lastUser = [...messages].reverse().find((message) => message.role === 'user')
    const idleMinutes = lastUser ? (Date.now() - new Date(lastUser.createdAt).getTime()) / 60000 : Infinity
    if (idleMinutes < (character.proactive.minIntervalMinutes || 5)) return

    state.proactiveChecking = true
    try {
      const response = await fetch(`${apiOrigin}/api/proactive/tick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Model-Api-Key': state.settings.apiKey },
        body: JSON.stringify({
          conversationId: state.currentCharacterId,
          character,
          recentMessages: messages.slice(-20).map(({ role, content, type, createdAt }) => ({ role, content, type, createdAt })),
          lastUserActiveAt: lastUser?.createdAt || new Date(0).toISOString(),
          provider: state.settings.provider, model: state.settings.model, baseURL: state.settings.baseURL,
        }),
      })
      if (!response.ok) return
      const data = await response.json()
      if (data.shouldSend && data.message?.content) {
        const message = createMessage('assistant', data.message.content, 'done')
        message.type = 'proactive'
        messages.push(message)
        persistMessages()
        if (state.view === 'chat') renderMessageList()
        if (state.settings.autoSpeakEnabled) void speakText(message.content, character.tts)
      }
    } finally {
      state.proactiveChecking = false
    }
  }

  function renderCharacters() {
    const selectedId = state.editingCharacterId || state.currentCharacterId
    const selected = state.characters.find((character) => character.id === selectedId) || state.characters[0]
    state.editingCharacterId = selected.id
    workspace.innerHTML = `
      <section class="page-layout">
        <header class="page-header">
          <div><h1>角色管理</h1><p>为不同对话建立独立角色设定</p></div>
          <div class="header-actions"><select id="preset-select" class="header-select"><option value="">选择角色模板</option>${ROLE_PRESETS.map((preset) => `<option value="${preset.id}">${preset.name}</option>`).join('')}</select><button id="new-character" class="primary-button"><svg><use href="#icon-plus"/></svg><span>新建角色</span></button></div>
        </header>
        <div class="page-content"><div class="content-inner character-editor-layout">
          <aside class="panel">
            <div class="panel-title"><h2>角色</h2><span>${state.characters.length}</span></div>
            <div class="character-list">
              ${state.characters.map((character) => `
                <button class="character-option${character.id === selected.id ? ' active' : ''}" data-edit-character="${character.id}">
                  ${avatar(character)}<span><strong>${escapeHTML(character.name)}</strong><small>${escapeHTML(character.relationship)}</small></span>
                </button>`).join('')}
            </div>
          </aside>
          <form id="character-form">
            <section class="form-section">
              <h2>基础信息</h2>
              <div class="form-grid">
                <div class="field"><label for="character-name">名称</label><input id="character-name" name="name" maxlength="30" value="${escapeAttribute(selected.name)}" required /></div>
                <div class="field"><label for="character-relationship">关系</label><input id="character-relationship" name="relationship" maxlength="40" value="${escapeAttribute(selected.relationship)}" /></div>
                <div class="field"><label>性别</label><select name="gender">${option('female', '女性', selected.gender)}${option('male', '男性', selected.gender)}${option('neutral', '中性', selected.gender)}${option('unknown', '不设定', selected.gender)}</select></div>
                <div class="field"><label>年龄描述</label><input name="ageText" maxlength="40" value="${escapeAttribute(selected.ageText || '')}" /></div>
                <div class="field"><label>对你的称呼</label><input name="userNickname" maxlength="30" value="${escapeAttribute(selected.userNickname || '')}" /></div>
                <div class="field full"><label for="character-background">背景设定</label><textarea id="character-background" name="background" maxlength="600">${escapeHTML(selected.background)}</textarea></div>
              </div>
            </section>
            <section class="form-section">
              <h2>性格与话题</h2>
              <div class="form-grid">
                ${roleTagField('性格标签', 'personalityTags', selected.personalityTags)}
                ${roleTagField('脾气特点', 'temperTags', selected.temperTags)}
                ${roleTagField('兴趣爱好', 'hobbies', selected.hobbies)}
                ${roleTagField('擅长领域', 'expertise', selected.expertise)}
                ${roleTagField('偏好话题', 'preferredTopics', selected.preferredTopics)}
                ${roleTagField('回避话题', 'forbiddenTopics', selected.forbiddenTopics)}
              </div>
            </section>
            <section class="form-section">
              <h2>表达方式</h2>
              <div class="form-grid">
                <div class="field"><label for="character-tone">语气</label><input id="character-tone" name="tone" maxlength="50" value="${escapeAttribute(selected.tone)}" /></div>
                <div class="field"><label for="character-style">说话风格</label><input id="character-style" name="speakingStyle" maxlength="80" value="${escapeAttribute(selected.speakingStyle)}" /></div>
                ${roleTagField('口头禅', 'catchphrases', selected.catchphrases)}
                <div class="field"><label>回复长度</label><select name="replyLength">${option('short', '简短', selected.replyLength)}${option('medium', '适中', selected.replyLength)}${option('long', '详细', selected.replyLength)}</select></div>
                <div class="field"><label>表情使用</label><select name="emojiLevel">${option('none', '不使用', selected.emojiLevel)}${option('low', '少量', selected.emojiLevel)}${option('medium', '适中', selected.emojiLevel)}${option('high', '较多', selected.emojiLevel)}</select></div>
              </div>
            </section>
            <section class="form-section">
              <h2>对话规则</h2>
              <div class="toggle-grid">
                ${roleCheck('followUpQuestions', '主动追问', selected.safety?.followUpQuestions)}
                ${roleCheck('rememberContext', '记住上下文', selected.safety?.rememberContext)}
                ${roleCheck('avoidLongReplies', '避免长回复', selected.safety?.avoidLongReplies)}
                ${roleCheck('comfortOnLowMood', '低落时主动安慰', selected.safety?.comfortOnLowMood)}
                ${roleCheck('allowTeasing', '允许适度玩笑', selected.safety?.allowTeasing)}
                ${roleCheck('allowFlirtyTone', '允许暧昧语气', selected.safety?.allowFlirtyTone)}
                ${roleCheck('safetyGuardrails', '启用安全边界', selected.safety?.safetyGuardrails)}
              </div>
            </section>
            <section class="form-section">
              <h2>角色朗读</h2>
              <label class="check-row"><input id="role-use-global-tts" name="useGlobalTts" type="checkbox" ${selected.tts ? '' : 'checked'} /><span>使用全局朗读设置</span></label>
              <div id="role-tts-fields" class="form-grid role-tts-fields" ${selected.tts ? '' : 'hidden'}>
                <div class="field"><label>朗读引擎</label><select name="ttsProvider" id="role-tts-provider">${option('browser', '系统朗读', selected.tts?.provider || state.settings.ttsProvider)}${option('qwen-local', '本地语音复刻', selected.tts?.provider || state.settings.ttsProvider)}${option('edge', 'Edge TTS', selected.tts?.provider || state.settings.ttsProvider)}${option('elevenlabs', 'ElevenLabs', selected.tts?.provider || state.settings.ttsProvider)}${option('zhipu', '智谱 GLM-TTS', selected.tts?.provider || state.settings.ttsProvider)}</select></div>
                ${renderRoleTtsFields(selected)}
              </div>
            </section>
            <section class="form-section">
              <h2>主动聊天</h2>
              <label class="check-row"><input name="proactiveEnabled" type="checkbox" ${selected.proactive?.enabled ? 'checked' : ''}/><span>允许角色主动发起对话</span></label>
              <div class="form-grid proactive-fields">
                <div class="field"><label>主动程度</label><select name="initiativeLevel">${option('low', '低', selected.proactive?.initiativeLevel)}${option('medium', '中', selected.proactive?.initiativeLevel)}${option('high', '高', selected.proactive?.initiativeLevel)}</select></div>
                <div class="field"><label>最短间隔（分钟）</label><input name="minIntervalMinutes" type="number" min="1" max="1440" value="${selected.proactive?.minIntervalMinutes || 5}" /></div>
                <div class="field"><label>每日上限</label><input name="maxDailyCount" type="number" min="1" max="100" value="${selected.proactive?.maxDailyCount || 10}" /></div>
                <div class="field"><label>活跃开始</label><input name="activeStart" type="time" value="${selected.proactive?.activeHours?.start || '09:00'}" /></div>
                <div class="field"><label>活跃结束</label><input name="activeEnd" type="time" value="${selected.proactive?.activeHours?.end || '23:00'}" /></div>
                <div class="field full"><label>话题来源</label><div class="inline-checks">${roleCheck('topic_recent_context', '最近上下文', selected.proactive?.topicSources?.includes('recent_context'))}${roleCheck('topic_hobbies', '兴趣爱好', selected.proactive?.topicSources?.includes('hobbies'))}${roleCheck('topic_fixed_greeting', '固定问候', selected.proactive?.topicSources?.includes('fixed_greeting'))}${roleCheck('topic_random', '随机话题', selected.proactive?.topicSources?.includes('random'))}</div></div>
                <div class="field full">${roleCheck('doNotDisturb', '免打扰', selected.proactive?.doNotDisturb)}</div>
              </div>
              <div class="form-actions">
                ${state.characters.length > 1 ? '<button id="delete-character" type="button" class="danger-button"><svg><use href="#icon-trash"/></svg><span>删除</span></button>' : ''}
                <button type="submit" class="primary-button"><svg><use href="#icon-check"/></svg><span>保存角色</span></button>
              </div>
            </section>
          </form>
        </div></div>
      </section>`

    workspace.querySelector('#new-character').addEventListener('click', addCharacter)
    workspace.querySelector('#preset-select').addEventListener('change', (event) => applyRolePreset(event.target.value))
    workspace.querySelectorAll('[data-edit-character]').forEach((button) => {
      button.addEventListener('click', () => {
        state.editingCharacterId = button.dataset.editCharacter
        renderCharacters()
      })
    })
    workspace.querySelector('#character-form').addEventListener('submit', saveCharacterForm)
    workspace.querySelector('#delete-character')?.addEventListener('click', deleteCharacter)
    workspace.querySelector('#role-use-global-tts').addEventListener('change', (event) => {
      workspace.querySelector('#role-tts-fields').hidden = event.target.checked
    })
    workspace.querySelector('#role-tts-provider').addEventListener('change', () => showToast('保存后应用角色朗读引擎', 'success'))
  }

  function roleTagField(label, name, values) {
    return `<div class="field"><label>${label}</label><input name="${name}" maxlength="180" value="${escapeAttribute((values || []).join('、'))}" /><p class="field-hint">使用顿号或逗号分隔</p></div>`
  }

  function roleCheck(name, label, checked) {
    return `<label class="check-row role-check"><input name="${name}" type="checkbox" ${checked ? 'checked' : ''}/><span>${label}</span></label>`
  }

  function renderRoleTtsFields(character) {
    const config = { ...state.settings, ...(character.tts || {}) }
    return `
      <div class="field"><label>Edge 音色</label><select name="edgeVoice">${EDGE_VOICES.map(([value, label]) => option(value, label, config.edgeVoice)).join('')}</select></div>
      <div class="field"><label>智谱音色</label><select name="zhipuVoice">${ZHIPU_VOICES.map(([value, label]) => option(value, label, config.zhipuVoice)).join('')}</select></div>
      <div class="field"><label>本地复刻音色</label><select name="localVoiceId">${option('', '请选择音色', config.localVoiceId)}${state.localVoices.map((voice) => option(voice.id, voice.name, config.localVoiceId)).join('')}</select></div>
      <div class="field"><label>ElevenLabs Voice ID</label><input name="elevenLabsVoiceId" value="${escapeAttribute(config.elevenLabsVoiceId || '')}" /></div>`
  }

  function addCharacter() {
    const character = createCharacter(`新角色 ${state.characters.length + 1}`)
    state.characters.push(character)
    state.messagesByCharacter[character.id] = []
    state.editingCharacterId = character.id
    persistCharacters()
    persistMessages()
    renderCharacters()
    requestAnimationFrame(() => workspace.querySelector('#character-name')?.select())
  }

  function applyRolePreset(presetId) {
    const preset = ROLE_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    const character = createCharacter(preset.name, preset)
    state.characters.push(character)
    state.messagesByCharacter[character.id] = []
    state.editingCharacterId = character.id
    persistCharacters()
    persistMessages()
    renderCharacters()
    showToast(`已套用“${preset.name}”模板`, 'success')
  }

  function saveCharacterForm(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const character = state.characters.find((item) => item.id === state.editingCharacterId)
    if (!character) return
    character.name = String(form.get('name') || '').trim() || '未命名角色'
    character.relationship = String(form.get('relationship') || '').trim() || '朋友'
    character.gender = String(form.get('gender') || 'neutral')
    character.ageText = String(form.get('ageText') || '').trim()
    character.userNickname = String(form.get('userNickname') || '').trim() || '你'
    character.background = String(form.get('background') || '').trim()
    character.tone = String(form.get('tone') || '').trim() || '自然温和'
    character.speakingStyle = String(form.get('speakingStyle') || '').trim() || '简洁、清晰'
    character.personalityTags = splitTags(String(form.get('personalityTags') || ''))
    character.temperTags = splitTags(String(form.get('temperTags') || ''))
    character.hobbies = splitTags(String(form.get('hobbies') || ''))
    character.expertise = splitTags(String(form.get('expertise') || ''))
    character.preferredTopics = splitTags(String(form.get('preferredTopics') || ''))
    character.forbiddenTopics = splitTags(String(form.get('forbiddenTopics') || ''))
    character.catchphrases = splitTags(String(form.get('catchphrases') || ''))
    character.replyLength = String(form.get('replyLength') || 'medium')
    character.emojiLevel = String(form.get('emojiLevel') || 'low')
    character.safety = {
      followUpQuestions: form.has('followUpQuestions'),
      rememberContext: form.has('rememberContext'),
      avoidLongReplies: form.has('avoidLongReplies'),
      comfortOnLowMood: form.has('comfortOnLowMood'),
      allowTeasing: form.has('allowTeasing'),
      allowFlirtyTone: form.has('allowFlirtyTone'),
      safetyGuardrails: form.has('safetyGuardrails'),
    }
    character.proactive = {
      enabled: form.has('proactiveEnabled'),
      initiativeLevel: String(form.get('initiativeLevel') || 'medium'),
      minIntervalMinutes: Number(form.get('minIntervalMinutes') || 5),
      maxDailyCount: Number(form.get('maxDailyCount') || 10),
      activeHours: { start: String(form.get('activeStart') || '09:00'), end: String(form.get('activeEnd') || '23:00') },
      topicSources: [
        form.has('topic_recent_context') ? 'recent_context' : '',
        form.has('topic_hobbies') ? 'hobbies' : '',
        form.has('topic_fixed_greeting') ? 'fixed_greeting' : '',
        form.has('topic_random') ? 'random' : '',
      ].filter(Boolean),
      doNotDisturb: form.has('doNotDisturb'),
    }
    character.tts = form.has('useGlobalTts') ? undefined : {
      provider: String(form.get('ttsProvider') || state.settings.ttsProvider),
      edgeVoice: String(form.get('edgeVoice') || state.settings.edgeVoice),
      edgeRate: state.settings.edgeRate,
      edgePitch: state.settings.edgePitch,
      edgeVolume: state.settings.edgeVolume,
      edgeEmotionEnabled: state.settings.edgeEmotionEnabled,
      edgeEmotionStyle: state.settings.edgeEmotionStyle,
      elevenLabsApiKey: state.settings.elevenLabsApiKey,
      elevenLabsVoiceId: String(form.get('elevenLabsVoiceId') || state.settings.elevenLabsVoiceId),
      elevenLabsModelId: state.settings.elevenLabsModelId,
      elevenLabsStability: state.settings.elevenLabsStability,
      elevenLabsSimilarityBoost: state.settings.elevenLabsSimilarityBoost,
      elevenLabsStyle: state.settings.elevenLabsStyle,
      zhipuVoice: String(form.get('zhipuVoice') || state.settings.zhipuVoice),
      zhipuSpeed: state.settings.zhipuSpeed,
      zhipuVolume: state.settings.zhipuVolume,
      zhipuEmotionEnabled: state.settings.zhipuEmotionEnabled,
      zhipuEmotionStyle: state.settings.zhipuEmotionStyle,
      zhipuEmotionGranularity: state.settings.zhipuEmotionGranularity,
      localVoiceId: String(form.get('localVoiceId') || state.settings.localVoiceId),
    }
    character.updatedAt = new Date().toISOString()
    state.currentCharacterId = character.id
    localStorage.setItem(STORAGE.currentCharacter, character.id)
    persistCharacters()
    renderCharacters()
    showToast('角色已保存', 'success')
  }

  function deleteCharacter() {
    const character = state.characters.find((item) => item.id === state.editingCharacterId)
    if (!character || state.characters.length <= 1) return
    if (!window.confirm(`确定删除“${character.name}”及其本地对话吗？`)) return
    state.characters = state.characters.filter((item) => item.id !== character.id)
    delete state.messagesByCharacter[character.id]
    state.currentCharacterId = state.characters[0].id
    state.editingCharacterId = state.currentCharacterId
    localStorage.setItem(STORAGE.currentCharacter, state.currentCharacterId)
    persistCharacters()
    persistMessages()
    renderCharacters()
    showToast('角色已删除', 'success')
  }

  function renderSettings() {
    const provider = PROVIDERS[state.settings.provider]
    workspace.innerHTML = `
      <section class="page-layout">
        <header class="page-header"><div><h1>设置</h1><p>模型连接和本地数据偏好</p></div></header>
        <div class="page-content"><div class="content-inner settings-stack">
          <section class="panel">
            <div class="settings-section">
              <div class="settings-heading"><svg><use href="#icon-spark"/></svg><div><h2>模型服务</h2><p>选择提供商并确认本次对话使用的模型。</p></div></div>
              <div class="segmented" role="group" aria-label="模型服务商">
                ${Object.entries(PROVIDERS).map(([key, item]) => `<button class="segment${key === state.settings.provider ? ' active' : ''}" data-provider="${key}">${item.label}</button>`).join('')}
              </div>
              <div class="form-grid" style="margin-top:16px">
                <div class="field"><label for="model-name">模型</label><select id="model-name">${modelOptions(state.settings.provider, state.settings.model)}</select></div>
                <div class="field"><label for="base-url">接口地址</label><input id="base-url" type="url" value="${escapeAttribute(state.settings.baseURL)}" /></div>
              </div>
            </div>
            <div class="settings-section">
              <div class="settings-heading"><svg><use href="#icon-key"/></svg><div><h2>API Key</h2><p>验证成功后仅保存在当前桌面应用中。</p></div></div>
              <div class="key-row">
                <div class="field"><label for="api-key">${provider.label} API Key</label><input id="api-key" type="password" autocomplete="off" placeholder="${provider.placeholder}" value="${escapeAttribute(state.settings.apiKey)}" /></div>
                <button id="validate-key" class="primary-button"><svg><use href="#icon-check"/></svg><span>验证并保存</span></button>
              </div>
              <label class="check-row"><input id="remember-key" type="checkbox" ${state.settings.rememberKey ? 'checked' : ''} /><span>在这台设备上记住 API Key</span></label>
              <div id="validation-result" class="validation-result${state.settings.validatedAt ? ' success' : ''}">
                <svg><use href="#icon-${state.settings.validatedAt ? 'check' : 'info'}"/></svg>
                <span>${state.settings.validatedAt ? `已验证 ${escapeHTML(state.settings.maskedKey || '')}` : '尚未验证当前配置'}</span>
              </div>
              ${state.settings.apiKey ? '<button id="clear-model-key" class="secondary-button settings-inline-action">清空模型 Key</button>' : ''}
            </div>
          </section>
          <section class="panel">
            <div class="settings-section">
              <div class="settings-heading"><svg><use href="#icon-mic"/></svg><div><h2>语音转文字</h2><p>语音输入可使用浏览器识别或本地识别服务。</p></div></div>
              <div class="form-grid">
                <div class="field"><label for="stt-provider">识别引擎</label><select id="stt-provider" data-setting="sttProvider">
                  ${option('browser', '浏览器识别（无需 Key）', state.settings.sttProvider)}
                  ${option('faster-whisper', '本地 faster-whisper', state.settings.sttProvider)}
                  ${option('funasr', '本地 FunASR（中文优化）', state.settings.sttProvider)}
                </select></div>
                ${state.settings.sttProvider === 'faster-whisper' ? `<div class="field"><label for="whisper-model">本地模型</label><select id="whisper-model" data-setting="localWhisperModel">${option('base', 'base（推荐）', state.settings.localWhisperModel)}${option('small', 'small（更准确）', state.settings.localWhisperModel)}${option('tiny', 'tiny（最快）', state.settings.localWhisperModel)}</select></div>` : ''}
                ${state.settings.sttProvider !== 'browser' ? `<div class="field"><label for="stt-language">识别语言</label><select id="stt-language" data-setting="sttLanguage">${option('zh', '中文', state.settings.sttLanguage)}${option('', '自动识别', state.settings.sttLanguage)}${option('en', '英文', state.settings.sttLanguage)}</select></div>` : ''}
              </div>
            </div>
          </section>
          <section class="panel">
            <div class="settings-section">
              <div class="settings-heading"><svg><use href="#icon-volume"/></svg><div><h2>朗读设置</h2><p>每个音色都可以直接试听，角色也可覆盖全局朗读配置。</p></div></div>
              <div class="field"><label for="tts-provider">朗读引擎</label><select id="tts-provider" data-setting="ttsProvider">
                ${option('browser', '系统朗读', state.settings.ttsProvider)}
                ${option('qwen-local', '本地语音复刻（Qwen3-TTS）', state.settings.ttsProvider)}
                ${option('edge', 'Edge TTS（免费）', state.settings.ttsProvider)}
                ${option('elevenlabs', 'ElevenLabs', state.settings.ttsProvider)}
                ${option('zhipu', '智谱 GLM-TTS', state.settings.ttsProvider)}
              </select></div>
              <div class="tts-settings">${renderTtsSettings()}</div>
            </div>
          </section>
          <section class="panel">
            <div class="settings-section">
              <div class="settings-heading"><svg><use href="#icon-database"/></svg><div><h2>数据管理</h2><p>角色、对话、设置和 Key 都保存在当前桌面应用中。</p></div></div>
              <div class="data-actions"><button id="clear-conversations" class="danger-button">清空所有会话</button><button id="clear-all-data" class="danger-button">清空全部数据</button></div>
            </div>
          </section>
        </div></div>
      </section>`

    workspace.querySelectorAll('[data-provider]').forEach((button) => {
      button.addEventListener('click', () => changeProvider(button.dataset.provider))
    })
    workspace.querySelector('#validate-key').addEventListener('click', validateAndSaveKey)
    workspace.querySelector('#clear-model-key')?.addEventListener('click', clearModelKey)
    workspace.querySelectorAll('[data-setting]').forEach((element) => element.addEventListener('change', () => saveSettingControl(element)))
    workspace.querySelector('#model-name').addEventListener('change', (event) => { state.settings.model = event.target.value; persistSettings() })
    workspace.querySelector('#base-url').addEventListener('change', (event) => { state.settings.baseURL = event.target.value.trim(); persistSettings() })
    workspace.querySelectorAll('[data-preview-provider]').forEach((button) => button.addEventListener('click', () => previewConfiguredVoice(button.dataset.previewProvider, button.dataset.previewVoice)))
    workspace.querySelector('#refresh-local-voices')?.addEventListener('click', () => refreshLocalVoices(true))
    workspace.querySelector('#local-audio-file')?.addEventListener('change', handleVoiceSampleFile)
    workspace.querySelector('#record-voice-sample')?.addEventListener('click', recordVoiceSample)
    workspace.querySelector('#create-local-voice')?.addEventListener('click', createLocalVoice)
    workspace.querySelector('#delete-local-voice')?.addEventListener('click', deleteLocalVoice)
    workspace.querySelector('#clear-conversations').addEventListener('click', clearAllConversations)
    workspace.querySelector('#clear-all-data').addEventListener('click', clearAllData)
  }

  function renderTtsSettings() {
    const settings = state.settings
    if (settings.ttsProvider === 'browser') return `
      <div class="form-grid">
        <div class="field"><label>语速 ${settings.browserRate}</label><input type="range" min="0.6" max="1.5" step="0.05" value="${settings.browserRate}" data-setting="browserRate" data-number /></div>
        <div class="field"><label>音调 ${settings.browserPitch}</label><input type="range" min="0.6" max="1.5" step="0.05" value="${settings.browserPitch}" data-setting="browserPitch" data-number /></div>
      </div><button class="secondary-button preview-main" data-preview-provider="browser"><svg><use href="#icon-play"/></svg><span>试听系统朗读</span></button>`

    if (settings.ttsProvider === 'edge') return `
      <div class="form-grid">
        <div class="field"><label>当前音色</label><select data-setting="edgeVoice">${EDGE_VOICES.map(([value, label]) => option(value, label, settings.edgeVoice)).join('')}</select></div>
        <div class="field"><label>语速</label><select data-setting="edgeRate">${['-20%', '-10%', '+0%', '+10%', '+20%'].map((value) => option(value, value, settings.edgeRate)).join('')}</select></div>
        <div class="field"><label>音调</label><select data-setting="edgePitch">${['-10Hz', '+0Hz', '+10Hz', '+20Hz'].map((value) => option(value, value, settings.edgePitch)).join('')}</select></div>
        <div class="field"><label>音量</label><select data-setting="edgeVolume">${['-20%', '+0%', '+20%'].map((value) => option(value, value, settings.edgeVolume)).join('')}</select></div>
      </div>
      <label class="check-row"><input type="checkbox" data-setting="edgeEmotionEnabled" ${settings.edgeEmotionEnabled ? 'checked' : ''}/><span>启用情绪风格</span></label>
      ${settings.edgeEmotionEnabled ? `<div class="field compact-field"><label>情绪风格</label><select data-setting="edgeEmotionStyle">${['auto', 'gentle', 'happy', 'excited', 'sad', 'worried', 'tired', 'calm', 'serious'].map((value) => option(value, value === 'auto' ? '自动判断' : value, settings.edgeEmotionStyle)).join('')}</select></div>` : ''}
      <div class="voice-preview-grid">${EDGE_VOICES.map(([value, label]) => `<button class="voice-preview" data-preview-provider="edge" data-preview-voice="${value}"><svg><use href="#icon-play"/></svg><span>${label}</span></button>`).join('')}</div>`

    if (settings.ttsProvider === 'elevenlabs') return `
      <div class="form-grid">
        <div class="field full"><label>ElevenLabs API Key</label><input type="password" autocomplete="off" value="${escapeAttribute(settings.elevenLabsApiKey)}" data-setting="elevenLabsApiKey" /></div>
        <div class="field"><label>Voice ID</label><input value="${escapeAttribute(settings.elevenLabsVoiceId)}" data-setting="elevenLabsVoiceId" /></div>
        <div class="field"><label>模型</label><select data-setting="elevenLabsModelId">${option('eleven_multilingual_v2', 'multilingual v2', settings.elevenLabsModelId)}${option('eleven_turbo_v2_5', 'turbo v2.5', settings.elevenLabsModelId)}${option('eleven_flash_v2_5', 'flash v2.5', settings.elevenLabsModelId)}</select></div>
        <div class="field"><label>稳定度 ${settings.elevenLabsStability}</label><input type="range" min="0" max="1" step="0.05" value="${settings.elevenLabsStability}" data-setting="elevenLabsStability" data-number /></div>
        <div class="field"><label>相似度 ${settings.elevenLabsSimilarityBoost}</label><input type="range" min="0" max="1" step="0.05" value="${settings.elevenLabsSimilarityBoost}" data-setting="elevenLabsSimilarityBoost" data-number /></div>
        <div class="field"><label>表现力 ${settings.elevenLabsStyle}</label><input type="range" min="0" max="1" step="0.05" value="${settings.elevenLabsStyle}" data-setting="elevenLabsStyle" data-number /></div>
      </div><button class="secondary-button preview-main" data-preview-provider="elevenlabs"><svg><use href="#icon-play"/></svg><span>试听当前音色</span></button>`

    if (settings.ttsProvider === 'zhipu') return `
      <div class="form-grid">
        <div class="field full"><label>智谱朗读 API Key</label><input type="password" autocomplete="off" value="${escapeAttribute(settings.zhipuTtsApiKey)}" data-setting="zhipuTtsApiKey" placeholder="未填写时使用模型 API Key" /></div>
        <div class="field"><label>当前音色</label><select data-setting="zhipuVoice">${ZHIPU_VOICES.map(([value, label]) => option(value, label, settings.zhipuVoice)).join('')}</select></div>
        <div class="field"><label>语速</label><select data-setting="zhipuSpeed" data-number>${[0.8, 1, 1.2, 1.5, 1.8, 2].map((value) => option(value, String(value), settings.zhipuSpeed)).join('')}</select></div>
        <div class="field"><label>音量</label><select data-setting="zhipuVolume" data-number>${[0.8, 1, 1.2].map((value) => option(value, String(value), settings.zhipuVolume)).join('')}</select></div>
      </div>
      <label class="check-row"><input type="checkbox" data-setting="zhipuEmotionEnabled" ${settings.zhipuEmotionEnabled ? 'checked' : ''}/><span>启用超情感表达</span></label>
      <div class="voice-preview-grid">${ZHIPU_VOICES.map(([value, label]) => `<button class="voice-preview" data-preview-provider="zhipu" data-preview-voice="${value}"><svg><use href="#icon-play"/></svg><span>${label}</span></button>`).join('')}</div>`

    return `
      <div class="local-voice-status"><span class="status-dot"></span><span>${state.localVoices.length ? `已读取 ${state.localVoices.length} 个本地音色` : '尚未读取到本地音色'}</span><button id="refresh-local-voices" class="compact-button"><svg><use href="#icon-refresh"/></svg><span>刷新</span></button></div>
      <div class="key-row">
        <div class="field"><label>当前音色</label><select data-setting="localVoiceId">${option('', '请选择音色', settings.localVoiceId)}${state.localVoices.map((voice) => option(voice.id, `${voice.name} · ${Number(voice.durationSeconds).toFixed(1)} 秒`, settings.localVoiceId)).join('')}</select></div>
        <button class="secondary-button" data-preview-provider="qwen-local"><svg><use href="#icon-play"/></svg><span>试听</span></button>
        <button id="delete-local-voice" class="danger-button">删除</button>
      </div>
      <div class="local-voice-editor">
        <div class="recording-script">你好，今天很高兴认识你。希望接下来我们可以自然地聊天，分享每天的心情和有趣的事情。</div>
        <div class="form-grid">
          <div class="field"><label>音色名称</label><input id="local-voice-name" maxlength="80" placeholder="例如：我的声音" /></div>
          <div class="field"><label>参考音频</label><div class="file-actions"><label class="secondary-button file-button"><svg><use href="#icon-upload"/></svg><span>选择音频</span><input id="local-audio-file" type="file" accept="audio/*,.wav,.mp3,.m4a" /></label><button id="record-voice-sample" class="secondary-button"><svg><use href="#icon-mic"/></svg><span>录制样本</span></button></div></div>
        </div>
        <div id="voice-sample-state" class="field-hint">${state.voiceSample ? '参考音频已准备' : '样本需 3-30 秒，环境安静且只包含一个人的声音。'}</div>
        <button id="create-local-voice" class="primary-button" ${state.voiceSample ? '' : 'disabled'}>创建音色</button>
      </div>`
  }

  function modelOptions(provider, selected) {
    const models = provider === 'zhipu'
      ? ['glm-5.2', 'glm-5.1', 'glm-5-turbo', 'glm-5', 'glm-4.7', 'glm-4.7-flash', 'glm-4.7-flashx', 'glm-4.6', 'glm-4.5-air', 'glm-4.5-airx', 'glm-4.5-flash', 'glm-4-flash-250414', 'glm-4-flashx-250414']
      : ['deepseek-v4-flash', 'deepseek-v4-pro', 'deepseek-chat']
    return models.map((value) => option(value, value, selected)).join('')
  }

  function option(value, label, selected) {
    return `<option value="${escapeAttribute(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${escapeHTML(label)}</option>`
  }

  function saveSettingControl(element) {
    const key = element.dataset.setting
    const value = element.type === 'checkbox' ? element.checked : element.dataset.number !== undefined ? Number(element.value) : element.value
    state.settings[key] = value
    persistSettings()
    if (['sttProvider', 'ttsProvider', 'edgeEmotionEnabled', 'zhipuEmotionEnabled'].includes(key)) renderSettings()
    else showToast('设置已保存', 'success')
  }

  function changeProvider(providerKey) {
    if (!PROVIDERS[providerKey] || providerKey === state.settings.provider) return
    state.settings.provider = providerKey
    state.settings.model = PROVIDERS[providerKey].model
    state.settings.baseURL = PROVIDERS[providerKey].baseURL
    state.settings.apiKey = ''
    state.settings.validatedAt = ''
    state.settings.maskedKey = ''
    persistSettings()
    renderSettings()
  }

  async function validateAndSaveKey() {
    const button = workspace.querySelector('#validate-key')
    const result = workspace.querySelector('#validation-result')
    const apiKey = workspace.querySelector('#api-key').value.trim()
    const model = workspace.querySelector('#model-name').value.trim()
    const baseURL = workspace.querySelector('#base-url').value.trim()
    const rememberKey = workspace.querySelector('#remember-key').checked
    if (!apiKey || !model || !baseURL) {
      setValidationResult(result, '请完整填写 API Key、模型和接口地址', 'error')
      return
    }

    button.disabled = true
    button.querySelector('span').textContent = '正在验证'
    setValidationResult(result, '正在连接模型服务…', '')
    try {
      const response = await fetch(`${apiOrigin}/api/keys/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, provider: state.settings.provider, model, baseURL }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.ok) throw new Error(localizeError(data.code, data.message || '验证失败'))

      state.settings = {
        ...state.settings,
        apiKey,
        model: data.model || model,
        baseURL,
        rememberKey,
        validatedAt: new Date().toISOString(),
        maskedKey: data.maskedKey || '',
      }
      persistSettings()
      updateKeyState()
      setValidationResult(result, `验证成功 ${data.maskedKey || ''}`, 'success')
      showToast('模型配置已保存', 'success')
    } catch (error) {
      setValidationResult(result, error.message || '验证失败，请检查配置', 'error')
    } finally {
      button.disabled = false
      button.querySelector('span').textContent = '验证并保存'
    }
  }

  function setValidationResult(element, message, type) {
    element.className = `validation-result${type ? ` ${type}` : ''}`
    element.innerHTML = `<svg><use href="#icon-${type === 'success' ? 'check' : type === 'error' ? 'alert' : 'info'}"/></svg><span>${escapeHTML(message)}</span>`
  }

  function clearModelKey() {
    state.settings.apiKey = ''
    state.settings.maskedKey = ''
    state.settings.validatedAt = ''
    persistSettings()
    updateKeyState()
    renderSettings()
    showToast('模型 API Key 已清空', 'success')
  }

  function previewConfiguredVoice(provider, voice = '') {
    const config = { provider }
    if (provider === 'edge' && voice) config.edgeVoice = voice
    if (provider === 'zhipu' && voice) config.zhipuVoice = voice
    void speakText('你好，这是当前音色的试听效果。', config)
  }

  async function refreshLocalVoices(showFeedback = true) {
    try {
      const response = await fetch(`${apiOrigin}/api/tts/local/voices`)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || '读取本地音色失败')
      state.localVoices = Array.isArray(data.voices) ? data.voices : []
      if (state.settings.localVoiceId && !state.localVoices.some((voice) => voice.id === state.settings.localVoiceId)) {
        state.settings.localVoiceId = ''
        persistSettings()
      }
      if (state.view === 'settings' && state.settings.ttsProvider === 'qwen-local') renderSettings()
      if (showFeedback) showToast('本地音色已刷新', 'success')
    } catch (error) {
      if (showFeedback) showToast(error.message || '无法连接本地音色服务', 'error')
    }
  }

  async function handleVoiceSampleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      state.voiceSample = await convertAudioToWav(file)
      renderSettings()
      showToast('参考音频已准备', 'success')
    } catch {
      showToast('无法处理该音频文件', 'error')
    }
  }

  async function recordVoiceSample() {
    const button = workspace.querySelector('#record-voice-sample')
    if (state.voiceSampleRecorder?.state === 'recording') {
      state.voiceSampleRecorder.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const chunks = []
      const recorder = new MediaRecorder(stream)
      state.voiceSampleRecorder = recorder
      recorder.addEventListener('dataavailable', (event) => { if (event.data.size) chunks.push(event.data) })
      recorder.addEventListener('stop', async () => {
        stream.getTracks().forEach((track) => track.stop())
        try {
          state.voiceSample = await convertAudioToWav(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
          showToast('录音样本已准备', 'success')
        } catch {
          showToast('录音样本处理失败', 'error')
        }
        state.voiceSampleRecorder = null
        renderSettings()
      }, { once: true })
      recorder.start()
      button.classList.add('danger-button')
      button.querySelector('span').textContent = '停止录音'
    } catch {
      showToast('无法使用麦克风，请检查系统权限', 'error')
    }
  }

  async function createLocalVoice() {
    const name = workspace.querySelector('#local-voice-name')?.value.trim()
    if (!name || !state.voiceSample) {
      showToast('请填写音色名称并准备参考音频', 'error')
      return
    }
    try {
      const response = await fetch(`${apiOrigin}/api/tts/local/voices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          transcript: '你好，今天很高兴认识你。希望接下来我们可以自然地聊天，分享每天的心情和有趣的事情。',
          audioDataUrl: await blobToDataURL(state.voiceSample),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.voice) throw new Error(data.message || '创建音色失败')
      state.voiceSample = null
      state.settings.localVoiceId = data.voice.id
      persistSettings()
      await refreshLocalVoices(false)
      showToast('本地音色已创建', 'success')
    } catch (error) {
      showToast(error.message || '创建音色失败', 'error')
    }
  }

  async function deleteLocalVoice() {
    const id = state.settings.localVoiceId
    if (!id) return
    const voice = state.localVoices.find((item) => item.id === id)
    if (!window.confirm(`确定删除音色“${voice?.name || '未命名'}”吗？`)) return
    const response = await fetch(`${apiOrigin}/api/tts/local/voices/${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!response.ok) {
      showToast('删除音色失败', 'error')
      return
    }
    state.settings.localVoiceId = ''
    persistSettings()
    await refreshLocalVoices(false)
    showToast('本地音色已删除', 'success')
  }

  function clearAllConversations() {
    if (!window.confirm('确定清空所有角色的会话记录吗？此操作不可恢复。')) return
    state.messagesByCharacter = Object.fromEntries(state.characters.map((character) => [character.id, []]))
    persistMessages()
    showToast('所有会话已清空', 'success')
  }

  function clearAllData() {
    if (!window.confirm('确定清空角色、会话、设置和 API Key 吗？此操作不可恢复。')) return
    Object.values(STORAGE).forEach((key) => localStorage.removeItem(key))
    window.location.reload()
  }

  async function convertAudioToWav(blob) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    const context = new AudioContextClass()
    try {
      const decoded = await context.decodeAudioData(await blob.arrayBuffer())
      const length = decoded.length
      const mono = new Float32Array(length)
      for (let channelIndex = 0; channelIndex < decoded.numberOfChannels; channelIndex += 1) {
        const channel = decoded.getChannelData(channelIndex)
        for (let index = 0; index < length; index += 1) mono[index] += channel[index] / decoded.numberOfChannels
      }
      const buffer = new ArrayBuffer(44 + length * 2)
      const view = new DataView(buffer)
      writeAscii(view, 0, 'RIFF')
      view.setUint32(4, 36 + length * 2, true)
      writeAscii(view, 8, 'WAVE')
      writeAscii(view, 12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, 1, true)
      view.setUint32(24, decoded.sampleRate, true)
      view.setUint32(28, decoded.sampleRate * 2, true)
      view.setUint16(32, 2, true)
      view.setUint16(34, 16, true)
      writeAscii(view, 36, 'data')
      view.setUint32(40, length * 2, true)
      for (let index = 0; index < length; index += 1) {
        const sample = Math.max(-1, Math.min(1, mono[index]))
        view.setInt16(44 + index * 2, sample < 0 ? sample * 32768 : sample * 32767, true)
      }
      return new Blob([buffer], { type: 'audio/wav' })
    } finally {
      await context.close()
    }
  }

  function writeAscii(view, offset, text) {
    for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index))
  }

  function renderProject() {
    workspace.innerHTML = `
      <section class="page-layout">
        <header class="page-header"><div><h1>项目说明</h1><p>AI Chat 桌面端</p></div></header>
        <div class="page-content"><div class="content-inner project-grid">
          <section class="info-band wide">
            <h2>独立桌面架构</h2>
            <p>桌面端使用 Electron 加载本地原生页面，不嵌套官网，也不依赖 Vue 页面运行。官网与桌面应用只共享本地 API 协议。</p>
            <div class="architecture">
              <div class="architecture-node">原生桌面界面<br />HTML / CSS / JavaScript</div><div class="architecture-arrow">→</div>
              <div class="architecture-node">本地 API 服务<br />127.0.0.1</div><div class="architecture-arrow">→</div>
              <div class="architecture-node">用户选择的<br />模型服务</div>
            </div>
          </section>
          <section class="info-band"><h2>本地数据</h2><ul class="project-list"><li>角色和对话保存在当前设备</li><li>API Key 可选择是否记住</li><li>桌面端数据与官网相互独立</li></ul></section>
          <section class="info-band"><h2>当前能力</h2><ul class="project-list"><li>DeepSeek 与智谱 GLM</li><li>角色化流式对话与主动聊天</li><li>本地和浏览器语音输入</li><li>五种朗读引擎与角色级音色</li></ul></section>
          <section class="info-band wide"><h2>安全提醒</h2><p>公共设备不建议启用“记住 API Key”。所有模型请求会从本地服务转发到你配置的模型服务商。</p></section>
        </div></div>
      </section>`
  }

  function persistSettings() {
    const settingsToStore = {
      ...state.settings,
      apiKey: state.settings.rememberKey ? state.settings.apiKey : '',
    }
    localStorage.setItem(STORAGE.settings, JSON.stringify(settingsToStore))
  }

  function persistCharacters() {
    localStorage.setItem(STORAGE.characters, JSON.stringify(state.characters))
    localStorage.setItem(STORAGE.currentCharacter, state.currentCharacterId)
  }

  function persistMessages() {
    localStorage.setItem(STORAGE.messages, JSON.stringify(state.messagesByCharacter))
  }

  function updateKeyState() {
    const ready = Boolean(state.settings.apiKey)
    keyState.className = `key-state ${ready ? 'ready' : 'warning'}`
    keyState.innerHTML = `<svg><use href="#icon-${ready ? 'check' : 'alert'}"/></svg><span>${ready ? '模型配置已就绪' : '未设置 API Key'}</span>`
  }

  function createMessage(role, content, status) {
    return {
      id: crypto.randomUUID(),
      conversationId: state.currentCharacterId,
      role,
      type: 'text',
      content,
      status,
      createdAt: new Date().toISOString(),
    }
  }

  function avatar(character, large = false) {
    const name = String(character?.name || 'AI').trim()
    const initial = Array.from(name)[0] || 'AI'
    return `<span class="avatar${large ? ' large' : ''}" aria-hidden="true">${escapeHTML(initial)}</span>`
  }

  function splitTags(value) {
    return value.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 12)
  }

  function autoResize(textarea) {
    textarea.style.height = '36px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`
  }

  function scrollMessagesToBottom() {
    const container = workspace.querySelector('#message-scroll')
    if (container) container.scrollTop = container.scrollHeight
  }

  function formatTime(value) {
    try {
      return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
    } catch {
      return ''
    }
  }

  function localizeError(code, fallback) {
    const messages = {
      API_KEY_MISSING: '缺少 API Key，请先完成设置。',
      MODEL_AUTH_FAILED: 'API Key 验证失败，请检查后重试。',
      DEEPSEEK_AUTH_FAILED: 'DeepSeek API Key 验证失败。',
      MODEL_RATE_LIMITED: '请求过于频繁，请稍后重试。',
      DEEPSEEK_RATE_LIMITED: 'DeepSeek 请求过于频繁，请稍后重试。',
      MODEL_INSUFFICIENT_BALANCE: '当前 API Key 余额不足。',
      DEEPSEEK_INSUFFICIENT_BALANCE: 'DeepSeek API Key 余额不足。',
      MODEL_UNAVAILABLE: '当前模型暂不可用。',
      CONTEXT_TOO_LONG: '对话内容过长，请清空对话后重试。',
      NETWORK_ERROR: '网络连接失败，请检查网络。',
    }
    return messages[code] || fallback || '请求失败，请稍后重试。'
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div')
    toast.className = `toast ${type}`
    toast.innerHTML = `<svg><use href="#icon-${type === 'error' ? 'alert' : 'check'}"/></svg><span>${escapeHTML(message)}</span>`
    toastRegion.appendChild(toast)
    window.setTimeout(() => toast.remove(), 2600)
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', () => resolve(String(reader.result || '')), { once: true })
      reader.addEventListener('error', () => reject(reader.error || new Error('文件读取失败')), { once: true })
      reader.readAsDataURL(blob)
    })
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  }

  function escapeAttribute(value) {
    return escapeHTML(value).replaceAll('`', '&#096;')
  }
})()
