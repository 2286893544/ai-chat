export const projectInfo = {
  name: 'AI Chat',
  positioning: '轻量、本地优先、BYOK 的个人 AI 聊天工具。',
  capabilities: [
    '角色化聊天与流式回复',
    '本地 IndexedDB 保存角色、会话和消息',
    '可选本地 faster-whisper / FunASR 语音转文字',
    '浏览器、Edge TTS 和 ElevenLabs 朗读',
    '主动聊天频率、时段和每日次数限制',
    '日常聊天与陪伴角色预设',
  ],
  localData: [
    '角色、会话和消息保存在浏览器 IndexedDB',
    '偏好设置和可选 API Key 保存在浏览器 localStorage',
    '前端 local-data 目录保存默认偏好、存储键、角色预设和项目信息',
    '清空浏览器数据会删除本地保存内容',
  ],
  safetyNotes: [
    '公共设备不建议记住 API Key',
    'API Key 只用于请求对应模型或语音服务',
    '本地数据不会主动上传到远程数据库',
    '浏览器数据被清理后，本地记录将无法恢复',
  ],
  roadmap: [
    '本地数据导入导出',
    '可插拔 STT/TTS Provider 配置',
    '本地用户习惯沉淀与角色推荐',
    '更完整的本地数据备份能力',
  ],
} as const;
