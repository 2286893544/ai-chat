import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createLocalTtsVoice,
  deleteLocalTtsVoice,
  getLocalTtsVoice,
  listLocalTtsVoices,
} from './localTtsVoices.js';

function createWavDataUrl(durationSeconds: number): string {
  const sampleRate = 24_000;
  const sampleCount = Math.floor(sampleRate * durationSeconds);
  const wav = Buffer.alloc(44 + sampleCount * 2);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + sampleCount * 2, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(sampleCount * 2, 40);
  return `data:audio/wav;base64,${wav.toString('base64')}`;
}

describe('local TTS voices', () => {
  it('creates, lists, reads, and deletes a local voice', async () => {
    const voiceDir = await mkdtemp(join(tmpdir(), 'ai-chat-local-tts-test-'));
    try {
      const created = await createLocalTtsVoice({
        name: '测试音色',
        transcript: '这是用于测试的参考音频。',
        audioDataUrl: createWavDataUrl(3),
      }, voiceDir);

      assert.equal(created.name, '测试音色');
      assert.equal(created.durationSeconds, 3);
      assert.deepEqual(await listLocalTtsVoices(voiceDir), [created]);
      const stored = await getLocalTtsVoice(created.id, voiceDir);
      assert.equal(stored.transcript, '这是用于测试的参考音频。');
      assert.equal(stored.audioPath, join(voiceDir, `${created.id}.wav`));

      await deleteLocalTtsVoice(created.id, voiceDir);
      assert.deepEqual(await listLocalTtsVoices(voiceDir), []);
    } finally {
      await rm(voiceDir, { recursive: true, force: true });
    }
  });

  it('allows samples from 3 to 10 seconds and rejects samples outside the supported duration range', async () => {
    const voiceDir = await mkdtemp(join(tmpdir(), 'ai-chat-local-tts-test-'));
    try {
      const longestAllowed = await createLocalTtsVoice({
        name: '最长允许',
        transcript: '十秒音频',
        audioDataUrl: createWavDataUrl(10),
      }, voiceDir);
      assert.equal(longestAllowed.durationSeconds, 10);

      await assert.rejects(
        createLocalTtsVoice({
          name: '过短',
          transcript: '短音频',
          audioDataUrl: createWavDataUrl(2),
        }, voiceDir),
        /3-10 秒/,
      );
      await assert.rejects(
        createLocalTtsVoice({
          name: '过长',
          transcript: '过长音频',
          audioDataUrl: createWavDataUrl(11),
        }, voiceDir),
        /3-10 秒/,
      );
    } finally {
      await rm(voiceDir, { recursive: true, force: true });
    }
  });
});
