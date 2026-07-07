export const storageKeys = {
  apiKey: 'aiChat_apiKey',
  apiKeyRemember: 'aiChat_apiKey_remember',
  apiKeyLastValidated: 'aiChat_apiKey_lastValidated',
  defaultModel: 'defaultModel',
  baseURL: 'baseURL',
  sttProvider: 'sttProvider',
  localWhisperModel: 'localWhisperModel',
  sttLanguage: 'sttLanguage',
  ttsProvider: 'ttsProvider',
  edgeTtsVoice: 'edgeTtsVoice',
  edgeTtsRate: 'edgeTtsRate',
  edgeTtsPitch: 'edgeTtsPitch',
  edgeTtsVolume: 'edgeTtsVolume',
  elevenLabsApiKey: 'elevenLabsApiKey',
  elevenLabsVoiceId: 'elevenLabsVoiceId',
  elevenLabsModelId: 'elevenLabsModelId',
  elevenLabsStability: 'elevenLabsStability',
  elevenLabsSimilarityBoost: 'elevenLabsSimilarityBoost',
  elevenLabsStyle: 'elevenLabsStyle',
  autoSpeakEnabled: 'autoSpeakEnabled',
} as const;

export const indexedDbInfo = {
  name: 'aiChatDB',
  stores: ['characters', 'conversations', 'messages'],
} as const;
