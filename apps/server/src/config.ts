import { homedir } from 'node:os';
import { join } from 'node:path';

export interface AppConfig {
  port: number;
  corsOrigins: string[];
  jsonBodyLimit: string;
  defaultModelProvider: 'deepseek' | 'zhipu';
  defaultModelBaseUrl: string;
  defaultModel: string;
  rateLimit: {
    windowMs: number;
    max: number;
  };
  chat: {
    maxMessages: number;
    maxContextChars: number;
    maxInputChars: number;
    timeoutMs: number;
  };
  tts: {
    maxTextChars: number;
    timeoutMs: number;
  };
  stt: {
    serviceUrl: string;
    maxAudioBytes: number;
    timeoutMs: number;
  };
  localTts: {
    serviceUrl: string;
    voiceDir: string;
    model: string;
    maxAudioBytes: number;
    timeoutMs: number;
  };
}

const providerDefaults = {
  deepseek: {
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-v4-flash',
  },
  zhipu: {
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-5.2',
  },
} as const;

function parseNumber(value: string | undefined, fallback: number, min = 1): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min) return fallback;
  return parsed;
}

export function parseCorsOrigins(value: string | undefined): string[] {
  if (!value || value.trim() === '') return ['*'];
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : ['*'];
}

export function createAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const defaultModelProvider = env.DEFAULT_MODEL_PROVIDER === 'zhipu' ? 'zhipu' : 'deepseek';
  const providerDefault = providerDefaults[defaultModelProvider];

  return {
    port: parseNumber(env.PORT, 3001),
    corsOrigins: parseCorsOrigins(env.CORS_ORIGIN || '*'),
    jsonBodyLimit: env.JSON_BODY_LIMIT || '2mb',
    defaultModelProvider,
    defaultModelBaseUrl: env.MODEL_BASE_URL || env.DEEPSEEK_BASE_URL || providerDefault.baseURL,
    defaultModel: env.DEFAULT_MODEL || env.DEFAULT_DEEPSEEK_MODEL || providerDefault.model,
    rateLimit: {
      windowMs: parseNumber(env.RATE_LIMIT_WINDOW_MS, 60_000),
      max: parseNumber(env.RATE_LIMIT_MAX, 120),
    },
    chat: {
      maxMessages: parseNumber(env.CHAT_MAX_MESSAGES, 40),
      maxContextChars: parseNumber(env.CHAT_MAX_CONTEXT_CHARS, 24_000),
      maxInputChars: parseNumber(env.CHAT_MAX_INPUT_CHARS, 8_000),
      timeoutMs: parseNumber(env.CHAT_REQUEST_TIMEOUT_MS, 60_000),
    },
    tts: {
      maxTextChars: parseNumber(env.TTS_TEXT_MAX_CHARS, 2_000),
      timeoutMs: parseNumber(env.TTS_REQUEST_TIMEOUT_MS, 30_000),
    },
    stt: {
      serviceUrl: env.STT_SERVICE_URL || 'http://127.0.0.1:8001',
      maxAudioBytes: parseNumber(env.STT_AUDIO_MAX_BYTES, 4 * 1024 * 1024),
      timeoutMs: parseNumber(env.STT_REQUEST_TIMEOUT_MS, 60_000),
    },
    localTts: {
      serviceUrl: env.LOCAL_TTS_SERVICE_URL || 'http://127.0.0.1:8002',
      voiceDir: env.LOCAL_TTS_VOICE_DIR || join(homedir(), '.ai-chat-web', 'voices'),
      model: env.LOCAL_TTS_MODEL || 'mlx-community/Qwen3-TTS-12Hz-0.6B-Base-8bit',
      maxAudioBytes: parseNumber(env.LOCAL_TTS_AUDIO_MAX_BYTES, 4 * 1024 * 1024),
      timeoutMs: parseNumber(env.LOCAL_TTS_REQUEST_TIMEOUT_MS, 10 * 60_000),
    },
  };
}

export const appConfig = createAppConfig();
