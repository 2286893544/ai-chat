// ============ Character ============

export interface ProactiveConfig {
  enabled: boolean;
  minIntervalMinutes: number;
  maxDailyCount: number;
  activeHours: { start: string; end: string };
  initiativeLevel: 'low' | 'medium' | 'high';
  topicSources: Array<'recent_context' | 'hobbies' | 'fixed_greeting' | 'random'>;
  doNotDisturb: boolean;
}

export interface SafetyConfig {
  followUpQuestions: boolean;
  rememberContext: boolean;
  avoidLongReplies: boolean;
  comfortOnLowMood: boolean;
  allowTeasing: boolean;
  allowFlirtyTone: boolean;
  safetyGuardrails: boolean;
}

export type TTSProvider = 'browser' | 'edge' | 'elevenlabs' | 'zhipu';

export interface TTSConfig {
  provider: TTSProvider;
  edgeVoice?: string;
  edgeRate?: string;
  edgePitch?: string;
  edgeVolume?: string;
  edgeEmotionEnabled?: boolean;
  edgeEmotionStyle?: 'auto' | 'gentle' | 'happy' | 'excited' | 'sad' | 'worried' | 'tired' | 'calm' | 'serious';
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  elevenLabsModelId?: string;
  elevenLabsStability?: number;
  elevenLabsSimilarityBoost?: number;
  elevenLabsStyle?: number;
  elevenLabsUseSpeakerBoost?: boolean;
  zhipuVoice?: string;
  zhipuSpeed?: number;
  zhipuVolume?: number;
  zhipuEmotionEnabled?: boolean;
  zhipuEmotionStyle?: 'auto' | 'happy' | 'sad' | 'worried' | 'tired' | 'gentle' | 'excited';
  zhipuEmotionGranularity?: 'sentence' | 'paragraph';
  browserRate?: number;
  browserPitch?: number;
}

export interface Character {
  id: string;
  name: string;
  avatar?: string;
  gender?: 'female' | 'male' | 'neutral' | 'unknown' | 'custom';
  ageText?: string;
  background: string;
  relationship: string;

  personalityTags: string[];
  temperTags: string[];
  hobbies: string[];
  expertise: string[];
  forbiddenTopics: string[];
  preferredTopics: string[];

  tone: string;
  speakingStyle: string;
  catchphrases: string[];
  replyLength: 'short' | 'medium' | 'long';
  emojiLevel: 'none' | 'low' | 'medium' | 'high';
  userNickname?: string;

  proactive: ProactiveConfig;
  safety: SafetyConfig;
  tts?: TTSConfig;

  createdAt: string;
  updatedAt: string;
}

// ============ Conversation ============

export interface Conversation {
  id: string;
  characterId: string;
  title: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

// ============ Message ============

export interface VoicePayload {
  localUrl?: string;
  remoteUrl?: string;
  durationMs: number;
  mimeType: string;
  transcript?: string;
  transcriptionError?: string;
  transcriptionStatus: 'none' | 'pending' | 'done' | 'failed';
}

export type MessageType = 'text' | 'voice' | 'system' | 'proactive';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'pending' | 'streaming' | 'done' | 'failed' | 'cancelled';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  voice?: VoicePayload;
  status: MessageStatus;
  errorCode?: string;
  createdAt: string;
}

// ============ API Key ============

export interface ApiKeyConfig {
  mode: 'local_byok' | 'server_managed';
  maskedKey?: string;
  rememberLocalKey: boolean;
  lastValidatedAt?: string;
}

// ============ API Errors ============

export type AppErrorCode =
  | 'API_KEY_MISSING'
  | 'DEEPSEEK_AUTH_FAILED'
  | 'DEEPSEEK_RATE_LIMITED'
  | 'DEEPSEEK_INSUFFICIENT_BALANCE'
  | 'DEEPSEEK_MODEL_UNAVAILABLE'
  | 'MODEL_AUTH_FAILED'
  | 'MODEL_RATE_LIMITED'
  | 'MODEL_INSUFFICIENT_BALANCE'
  | 'MODEL_UNAVAILABLE'
  | 'CONTEXT_TOO_LONG'
  | 'NETWORK_ERROR'
  | 'VOICE_PERMISSION_DENIED'
  | 'VOICE_TRANSCRIBE_FAILED'
  | 'TTS_AUTH_FAILED'
  | 'TTS_REQUEST_FAILED'
  | 'UNKNOWN_ERROR';

export interface AppErrorResponse {
  ok: false;
  code: AppErrorCode;
  message: string;
}

// ============ API Request/Response ============

export interface ValidateKeyRequest {
  apiKey: string;
  model?: string;
  provider?: ModelProvider;
  baseURL?: string;
}

export interface ValidateKeyResponse {
  ok: true;
  maskedKey: string;
  model: string;
}

export interface ChatStreamRequest {
  conversationId: string;
  character: Pick<Character, 'id' | 'name'> & Partial<Character>;
  messages: Array<{ role: MessageRole; content: string }>;
  input: string;
  model?: string;
  provider?: ModelProvider;
  baseURL?: string;
  thinking?: { type: 'disabled' | 'enabled'; reasoning_effort?: 'low' | 'medium' | 'high' };
}

export type ModelProvider = 'deepseek' | 'zhipu';

export interface ProactiveTickRequest {
  conversationId: string;
  character: Pick<Character, 'id' | 'name' | 'proactive' | 'hobbies' | 'preferredTopics' | 'background'>;
  recentMessages: Array<{ role: MessageRole; content: string; type?: MessageType; createdAt?: string }>;
  lastUserActiveAt: string;
  model?: string;
  provider?: ModelProvider;
  baseURL?: string;
}

export interface ProactiveTickResponse {
  shouldSend: boolean;
  reason?: string;
  message?: {
    id: string;
    role: 'assistant';
    type: 'proactive';
    content: string;
  };
}

// SSE events for streaming
export interface SSEStartEvent {
  messageId: string;
}

export interface SSEDeltaEvent {
  delta: string;
}

export interface SSEDoneEvent {
  messageId: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface SSEErrorEvent {
  code: AppErrorCode;
  message: string;
}
