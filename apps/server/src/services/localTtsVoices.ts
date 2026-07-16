import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { LocalTtsVoice } from '@ai-chat/shared';
import { appConfig } from '../config.js';

interface StoredLocalTtsVoice extends LocalTtsVoice {
  audioFile: string;
}

const MIN_AUDIO_SECONDS = 3;
const MAX_AUDIO_SECONDS = 30;

function parseWavDuration(audio: Buffer): number {
  if (audio.length < 44 || audio.toString('ascii', 0, 4) !== 'RIFF' || audio.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('音色样本必须是 WAV 格式');
  }

  let offset = 12;
  let byteRate = 0;
  let dataSize = 0;

  while (offset + 8 <= audio.length) {
    const chunkId = audio.toString('ascii', offset, offset + 4);
    const chunkSize = audio.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkStart + chunkSize > audio.length) break;
    if (chunkId === 'fmt ' && chunkSize >= 16) {
      const audioFormat = audio.readUInt16LE(chunkStart);
      if (audioFormat !== 1) throw new Error('音色样本必须使用 PCM WAV 编码');
      byteRate = audio.readUInt32LE(chunkStart + 8);
    } else if (chunkId === 'data') {
      dataSize = chunkSize;
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (!byteRate || !dataSize) throw new Error('WAV 音色样本缺少有效音频数据');
  return dataSize / byteRate;
}

function decodeWavDataUrl(value: string): Buffer {
  const match = /^data:audio\/(?:wav|wave|x-wav);base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) throw new Error('音色样本必须是 WAV 数据');

  const audio = Buffer.from(match[1], 'base64');
  if (audio.length === 0 || audio.length > appConfig.localTts.maxAudioBytes) {
    throw new Error('音色样本文件过大');
  }
  return audio;
}

function publicVoice(voice: StoredLocalTtsVoice): LocalTtsVoice {
  const { audioFile: _audioFile, ...result } = voice;
  return result;
}

async function readStoredVoice(id: string, voiceDir: string): Promise<StoredLocalTtsVoice> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('音色不存在');
  const metadata = JSON.parse(await readFile(join(voiceDir, `${id}.json`), 'utf8')) as StoredLocalTtsVoice;
  return metadata;
}

export async function listLocalTtsVoices(voiceDir = appConfig.localTts.voiceDir): Promise<LocalTtsVoice[]> {
  await mkdir(voiceDir, { recursive: true });
  const files = (await readdir(voiceDir)).filter((file) => file.endsWith('.json'));
  const voices = await Promise.all(files.map(async (file) => {
    try {
      return publicVoice(JSON.parse(await readFile(join(voiceDir, file), 'utf8')) as StoredLocalTtsVoice);
    } catch {
      return null;
    }
  }));

  return voices
    .filter((voice): voice is LocalTtsVoice => voice !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createLocalTtsVoice(
  input: { name: string; transcript: string; audioDataUrl: string },
  voiceDir = appConfig.localTts.voiceDir,
): Promise<LocalTtsVoice> {
  const audio = decodeWavDataUrl(input.audioDataUrl);
  const durationSeconds = parseWavDuration(audio);
  if (durationSeconds < MIN_AUDIO_SECONDS || durationSeconds > MAX_AUDIO_SECONDS) {
    throw new Error(`音色样本时长需在 ${MIN_AUDIO_SECONDS}-${MAX_AUDIO_SECONDS} 秒之间`);
  }

  const id = randomUUID();
  const audioFile = `${id}.wav`;
  const metadata: StoredLocalTtsVoice = {
    id,
    name: input.name.trim(),
    transcript: input.transcript.trim(),
    durationSeconds: Number(durationSeconds.toFixed(2)),
    createdAt: new Date().toISOString(),
    audioFile,
  };

  await mkdir(voiceDir, { recursive: true });
  await writeFile(join(voiceDir, audioFile), audio, { flag: 'wx' });
  try {
    await writeFile(join(voiceDir, `${id}.json`), JSON.stringify(metadata, null, 2), { flag: 'wx' });
  } catch (error) {
    await rm(join(voiceDir, audioFile), { force: true });
    throw error;
  }
  return publicVoice(metadata);
}

export async function getLocalTtsVoice(
  id: string,
  voiceDir = appConfig.localTts.voiceDir,
): Promise<LocalTtsVoice & { audioPath: string }> {
  const voice = await readStoredVoice(id, voiceDir);
  return { ...publicVoice(voice), audioPath: join(voiceDir, voice.audioFile) };
}

export async function deleteLocalTtsVoice(id: string, voiceDir = appConfig.localTts.voiceDir): Promise<void> {
  const voice = await readStoredVoice(id, voiceDir);
  await Promise.all([
    rm(join(voiceDir, voice.audioFile), { force: true }),
    rm(join(voiceDir, `${id}.json`), { force: true }),
  ]);
}
