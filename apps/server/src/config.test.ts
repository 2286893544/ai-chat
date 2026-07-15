import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createAppConfig, parseCorsOrigins } from './config.js';

describe('config', () => {
  it('uses safe defaults for local-first deployment', () => {
    const config = createAppConfig({});

    assert.equal(config.port, 3001);
    assert.deepEqual(config.corsOrigins, ['*']);
    assert.equal(config.jsonBodyLimit, '2mb');
    assert.equal(config.defaultModelProvider, 'deepseek');
    assert.equal(config.defaultModelBaseUrl, 'https://api.deepseek.com');
    assert.equal(config.defaultModel, 'deepseek-v4-flash');
    assert.equal(config.rateLimit.windowMs, 60_000);
    assert.equal(config.rateLimit.max, 120);
    assert.equal(config.chat.maxMessages, 40);
    assert.equal(config.chat.maxContextChars, 24_000);
    assert.equal(config.chat.timeoutMs, 60_000);
    assert.equal(config.tts.maxTextChars, 2_000);
    assert.equal(config.stt.maxAudioBytes, 4 * 1024 * 1024);
  });

  it('parses comma-separated CORS origins and numeric overrides', () => {
    const config = createAppConfig({
      PORT: '8080',
      CORS_ORIGIN: 'https://example.com, https://app.example.com',
      RATE_LIMIT_WINDOW_MS: '1000',
      RATE_LIMIT_MAX: '5',
      CHAT_MAX_MESSAGES: '12',
      CHAT_MAX_CONTEXT_CHARS: '4096',
      DEFAULT_MODEL_PROVIDER: 'zhipu',
      DEFAULT_MODEL: 'glm-5.2',
      MODEL_BASE_URL: 'https://open.bigmodel.cn/api/paas/v4',
      TTS_TEXT_MAX_CHARS: '512',
      STT_AUDIO_MAX_BYTES: '2048',
    });

    assert.equal(config.port, 8080);
    assert.deepEqual(config.corsOrigins, ['https://example.com', 'https://app.example.com']);
    assert.equal(config.rateLimit.windowMs, 1000);
    assert.equal(config.rateLimit.max, 5);
    assert.equal(config.defaultModelProvider, 'zhipu');
    assert.equal(config.defaultModelBaseUrl, 'https://open.bigmodel.cn/api/paas/v4');
    assert.equal(config.defaultModel, 'glm-5.2');
    assert.equal(config.chat.maxMessages, 12);
    assert.equal(config.chat.maxContextChars, 4096);
    assert.equal(config.tts.maxTextChars, 512);
    assert.equal(config.stt.maxAudioBytes, 2048);
  });

  it('falls back to wildcard CORS when origin config is blank', () => {
    assert.deepEqual(parseCorsOrigins('  '), ['*']);
  });
});
