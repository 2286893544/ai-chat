export const defaultPreferences = {
  model: 'deepseek-v4-flash',
  baseURL: 'https://api.deepseek.com',
  stt: {
    provider: 'faster-whisper',
    localModel: 'base',
    language: 'zh',
  },
  tts: {
    provider: 'browser',
    edgeVoice: 'zh-CN-XiaoxiaoNeural',
    edgeRate: '+0%',
    edgePitch: '+0Hz',
    edgeVolume: '+0%',
    elevenLabsVoiceId: 'JBFqnCBsd6RMkjVDRZzb',
    elevenLabsModelId: 'eleven_multilingual_v2',
    elevenLabsStability: '0.45',
    elevenLabsSimilarityBoost: '0.75',
    elevenLabsStyle: '0.35',
  },
} as const;
