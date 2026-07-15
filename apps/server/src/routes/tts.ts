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

const ZHIPU_TTS_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
const edgeEmotionStyles = ['auto', 'gentle', 'happy', 'excited', 'sad', 'worried', 'tired', 'calm', 'serious'] as const;
type EdgeEmotionStyle = typeof edgeEmotionStyles[number];
const zhipuEmotionStyles = ['auto', 'happy', 'sad', 'worried', 'tired', 'gentle', 'excited'] as const;

function buildZhipuSpeechUrl(baseURL: string): string {
  const normalized = baseURL.trim().replace(/\/+$/, '');
  if (normalized.endsWith('/audio/speech')) return normalized;
  if (/\/paas\/v\d+$/.test(normalized) || /\/v4$/.test(normalized)) {
    return `${normalized}/audio/speech`;
  }
  return `${normalized}/api/paas/v4/audio/speech`;
}

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

function parseSignedNumber(value: string, suffix: '%' | 'Hz'): number {
  const normalized = value.trim().replace(suffix, '');
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatSignedNumber(value: number, suffix: '%' | 'Hz'): string {
  const rounded = Math.max(-100, Math.min(100, Math.round(value)));
  return `${rounded >= 0 ? '+' : ''}${rounded}${suffix}`;
}

function resolveAutoEdgeEmotionStyle(text: string): EdgeEmotionStyle {
  if (/[开心高兴惊喜喜欢太好棒笑哈哈期待]/.test(text)) return 'happy';
  if (/[难过伤心委屈哭失落遗憾孤独]/.test(text)) return 'sad';
  if (/[担心害怕紧张焦虑不安怎么办]/.test(text)) return 'worried';
  if (/[累疲惫困倦熬夜没力气撑不住]/.test(text)) return 'tired';
  if (/[激动兴奋太棒了不得了]/.test(text) || /！{2,}/.test(text)) return 'excited';
  if (/[认真严肃重点注意必须]/.test(text)) return 'serious';
  if (/[放松平静没关系慢慢来]/.test(text)) return 'calm';
  return 'gentle';
}

function resolveEdgeEmotionProsody(
  text: string,
  options: { rate: string; pitch: string; volume: string; enabled: boolean; style: EdgeEmotionStyle },
): { rate: string; pitch: string; volume: string } {
  if (!options.enabled) {
    return { rate: options.rate, pitch: options.pitch, volume: options.volume };
  }

  const style = options.style === 'auto' ? resolveAutoEdgeEmotionStyle(text) : options.style;
  const deltas: Record<Exclude<EdgeEmotionStyle, 'auto'>, { rate: number; pitch: number; volume: number }> = {
    gentle: { rate: -6, pitch: -2, volume: 0 },
    happy: { rate: 8, pitch: 8, volume: 4 },
    excited: { rate: 15, pitch: 16, volume: 8 },
    sad: { rate: -14, pitch: -10, volume: -4 },
    worried: { rate: 4, pitch: 8, volume: -2 },
    tired: { rate: -18, pitch: -14, volume: -8 },
    calm: { rate: -10, pitch: -6, volume: -2 },
    serious: { rate: -4, pitch: -8, volume: 2 },
  };
  const delta = deltas[style];

  return {
    rate: formatSignedNumber(parseSignedNumber(options.rate, '%') + delta.rate, '%'),
    pitch: formatSignedNumber(parseSignedNumber(options.pitch, 'Hz') + delta.pitch, 'Hz'),
    volume: formatSignedNumber(parseSignedNumber(options.volume, '%') + delta.volume, '%'),
  };
}

const ttsSchema = z.object({
  provider: z.enum(['edge', 'elevenlabs', 'zhipu']).default('elevenlabs'),
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
  edgeEmotionEnabled: z.boolean().default(false),
  edgeEmotionStyle: z.enum(edgeEmotionStyles).default('auto'),
  zhipuVoice: z.enum(['tongtong', 'chuichui', 'xiaochen', 'jam', 'kazi', 'douji', 'luodo']).default('tongtong'),
  zhipuSpeed: z.coerce.number().min(0.5).max(2).default(1),
  zhipuVolume: z.coerce.number().gt(0).max(10).default(1),
  zhipuStream: z.boolean().default(false),
  zhipuEmotionEnabled: z.boolean().default(false),
  zhipuEmotionStyle: z.enum(zhipuEmotionStyles).default('auto'),
  zhipuEmotionGranularity: z.enum(['sentence', 'paragraph']).default('sentence'),
  zhipuBaseURL: z.string().url().default(ZHIPU_TTS_BASE_URL),
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
      edgeEmotionEnabled,
      edgeEmotionStyle,
      zhipuVoice,
      zhipuSpeed,
      zhipuVolume,
      zhipuStream,
      zhipuBaseURL,
    } = parsedBody.data;

    if (provider === 'edge') {
      const prosody = resolveEdgeEmotionProsody(text, {
        rate: edgeRate,
        pitch: edgePitch,
        volume: edgeVolume,
        enabled: edgeEmotionEnabled,
        style: edgeEmotionStyle,
      });
      const audio = await runEdgeTts(text, {
        voice: edgeVoice,
        rate: prosody.rate,
        pitch: prosody.pitch,
        volume: prosody.volume,
      });

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'no-store');
      res.send(audio);
      return;
    }

    if (provider === 'zhipu') {
      if (text.length > 1024) {
        res.status(400).json({
          ok: false,
          code: 'TTS_REQUEST_FAILED',
          message: '智谱 TTS 单次最多支持 1024 个字符',
        });
        return;
      }

      const apiKey = req.headers['x-model-api-key'] as string | undefined;
      if (!apiKey || apiKey.trim() === '') {
        res.status(400).json({
          ok: false,
          code: 'API_KEY_MISSING',
          message: 'Missing X-Model-Api-Key header',
        });
        return;
      }

      const response = await fetchWithTimeout(
        buildZhipuSpeechUrl(zhipuBaseURL),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'glm-tts',
            input: text,
            voice: zhipuVoice,
            response_format: zhipuStream ? 'pcm' : 'wav',
            encode_format: zhipuStream ? 'base64' : undefined,
            stream: zhipuStream,
            watermark_enabled: false,
            speed: zhipuSpeed,
            volume: zhipuVolume,
          }),
        },
        appConfig.tts.timeoutMs,
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown Zhipu TTS error');
        logger.error({ status: response.status, errorText }, 'Zhipu TTS error');
        res.status(response.status).json({
          ok: false,
          code: response.status === 401 || response.status === 403 ? 'TTS_AUTH_FAILED' : 'TTS_REQUEST_FAILED',
          message: `智谱 TTS error (${response.status}): ${errorText.slice(0, 200)}`,
        });
        return;
      }

      if (zhipuStream) {
        if (!response.body) {
          res.status(502).json({
            ok: false,
            code: 'TTS_REQUEST_FAILED',
            message: '智谱 TTS 流式响应为空',
          });
          return;
        }

        res.status(200);
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        const reader = response.body.getReader();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              res.write(Buffer.from(value));
            }
          }
        } finally {
          reader.releaseLock();
          res.end();
        }
        return;
      }

      const audio = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/wav');
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
