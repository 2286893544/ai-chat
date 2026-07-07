export interface AppConfig {
  port: number;
  corsOrigins: string[];
  jsonBodyLimit: string;
  deepseekBaseUrl: string;
  defaultDeepseekModel: string;
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
}

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
  return {
    port: parseNumber(env.PORT, 3001),
    corsOrigins: parseCorsOrigins(env.CORS_ORIGIN || '*'),
    jsonBodyLimit: env.JSON_BODY_LIMIT || '2mb',
    deepseekBaseUrl: env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    defaultDeepseekModel: env.DEFAULT_DEEPSEEK_MODEL || 'deepseek-v4-flash',
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
  };
}

export const appConfig = createAppConfig();
