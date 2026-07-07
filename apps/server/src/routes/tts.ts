import { Router, Request, Response } from 'express';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { z } from 'zod';
import type { AppErrorResponse } from '@ai-chat/shared';
import logger from '../logger.js';
import { appConfig } from '../config.js';
import { fetchWithTimeout } from '../utils/timeout.js';

const router = Router();

function runEdgeTts(text: string, options: { voice: string; rate: string; pitch: string; volume: string }): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const dir = await mkdtemp(join(tmpdir(), 'ai-chat-edge-tts-'));
    const outputPath = join(dir, 'speech.mp3');
    const args = [
      'edge-tts',
      '--text',
      text,
      '--voice',
      options.voice,
      '--rate',
      options.rate,
      '--pitch',
      options.pitch,
      '--volume',
      options.volume,
      '--write-media',
      outputPath,
    ];

    const child = spawn('uvx', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', async (error) => {
      await rm(dir, { recursive: true, force: true });
      reject(error);
    });
    child.on('close', async (code) => {
      try {
        if (code !== 0) {
          reject(new Error(stderr.trim() || `edge-tts exited with code ${code}`));
          return;
        }

        resolve(await readFile(outputPath));
      } catch (error) {
        reject(error);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });
  });
}

const ttsSchema = z.object({
  provider: z.enum(['edge', 'elevenlabs']).default('elevenlabs'),
  text: z.string().min(1).max(appConfig.tts.maxTextChars),
  voiceId: z.string().min(1).max(120).default('JBFqnCBsd6RMkjVDRZzb'),
  modelId: z.string().min(1).max(120).default('eleven_multilingual_v2'),
  outputFormat: z.string().min(1).max(80).default('mp3_44100_128'),
  stability: z.coerce.number().min(0).max(1).default(0.45),
  similarityBoost: z.coerce.number().min(0).max(1).default(0.75),
  style: z.coerce.number().min(0).max(1).default(0.35),
  useSpeakerBoost: z.boolean().default(true),
  edgeVoice: z.string().min(1).max(120).default('zh-CN-XiaoxiaoNeural'),
  edgeRate: z.string().max(16).default('+0%'),
  edgePitch: z.string().max(16).default('+0Hz'),
  edgeVolume: z.string().max(16).default('+0%'),
});

router.post('/api/tts/speak', async (req: Request, res: Response) => {
  try {
    const parsedBody = ttsSchema.safeParse(req.body || {});
    if (!parsedBody.success) {
      const err: AppErrorResponse = {
        ok: false,
        code: 'UNKNOWN_ERROR',
        message: parsedBody.error.issues[0]?.message || 'Invalid TTS request',
      };
      res.status(400).json(err);
      return;
    }
    const {
      provider,
      text,
      voiceId,
      modelId,
      outputFormat,
      stability,
      similarityBoost,
      style,
      useSpeakerBoost,
      edgeVoice,
      edgeRate,
      edgePitch,
      edgeVolume,
    } = parsedBody.data;

    if (provider === 'edge') {
      const audio = await runEdgeTts(text, {
        voice: edgeVoice,
        rate: edgeRate,
        pitch: edgePitch,
        volume: edgeVolume,
      });

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'no-store');
      res.send(audio);
      return;
    }

    const apiKey = req.headers['x-elevenlabs-api-key'] as string | undefined;
    if (!apiKey || apiKey.trim() === '') {
      const err: AppErrorResponse = {
        ok: false,
        code: 'API_KEY_MISSING',
        message: 'Missing X-ElevenLabs-Api-Key header',
      };
      res.status(400).json(err);
      return;
    }

    const response = await fetchWithTimeout(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(outputFormat)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: useSpeakerBoost,
          },
        }),
      },
      appConfig.tts.timeoutMs,
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown ElevenLabs error');
      logger.error({ status: response.status, errorText }, 'ElevenLabs TTS error');
      res.status(response.status).json({
        ok: false,
        code: response.status === 401 || response.status === 403 ? 'TTS_AUTH_FAILED' : 'TTS_REQUEST_FAILED',
        message: `ElevenLabs TTS error (${response.status}): ${errorText.slice(0, 200)}`,
      });
      return;
    }

    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const audio = Buffer.from(await response.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.send(audio);
  } catch (error: any) {
    logger.error({ err: error }, 'TTS speak error');
    res.status(500).json({
      ok: false,
      code: 'TTS_REQUEST_FAILED',
      message: error.message || 'Failed to generate speech',
    });
  }
});

export default router;
