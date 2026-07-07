import { Router, Request, Response } from 'express';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import type { AppErrorResponse } from '@ai-chat/shared';
import logger from '../logger.js';

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

router.post('/api/tts/speak', async (req: Request, res: Response) => {
  try {
    const {
      provider = 'elevenlabs',
      text,
      voiceId = 'JBFqnCBsd6RMkjVDRZzb',
      modelId = 'eleven_multilingual_v2',
      outputFormat = 'mp3_44100_128',
      stability = 0.45,
      similarityBoost = 0.75,
      style = 0.35,
      useSpeakerBoost = true,
      edgeVoice = 'zh-CN-XiaoxiaoNeural',
      edgeRate = '+0%',
      edgePitch = '+0Hz',
      edgeVolume = '+0%',
    } = req.body || {};

    if (!text || typeof text !== 'string') {
      const err: AppErrorResponse = {
        ok: false,
        code: 'UNKNOWN_ERROR',
        message: 'text is required',
      };
      res.status(400).json(err);
      return;
    }

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

    const response = await fetch(
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
