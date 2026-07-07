import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { AppErrorResponse } from '@ai-chat/shared';
import logger from '../logger.js';
import { appConfig } from '../config.js';
import { fetchWithTimeout } from '../utils/timeout.js';

const router = Router();

export type LocalSttProvider = 'faster-whisper' | 'funasr';

function parseDataUrl(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const match = dataUrl.match(/^data:([^;,]+)(?:;[^,]*)?;base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid audio data URL');
  }

  return {
    mimeType: match[1] || 'audio/webm',
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function getAudioFileName(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'speech.mp4';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'speech.mp3';
  if (mimeType.includes('ogg')) return 'speech.ogg';
  if (mimeType.includes('wav')) return 'speech.wav';
  return 'speech.webm';
}

const sttSchema = z.object({
  provider: z.enum(['faster-whisper', 'funasr']).default('faster-whisper'),
  audioDataUrl: z.string().min(1),
  model: z.string().trim().min(1).max(64).default('base'),
  language: z.string().max(16).optional(),
});

type SttRequest = z.infer<typeof sttSchema>;

export function parseSttRequest(body: unknown): SttRequest {
  return sttSchema.parse(body || {});
}

export function buildSttForwardForm(request: SttRequest): FormData {
  const { audioDataUrl, provider, model, language } = request;
  const { buffer, mimeType } = parseDataUrl(audioDataUrl);
  const audioBytes = new Uint8Array(buffer);
  const form = new FormData();

  form.append('file', new Blob([audioBytes], { type: mimeType }), getAudioFileName(mimeType));
  form.append('provider', provider);
  form.append('model', model);
  if (language) form.append('language', language);

  return form;
}

router.post('/api/stt/transcribe', async (req: Request, res: Response) => {
  try {
    const parsedBody = sttSchema.safeParse(req.body || {});
    if (!parsedBody.success) {
      const err: AppErrorResponse = {
        ok: false,
        code: 'UNKNOWN_ERROR',
        message: parsedBody.error.issues[0]?.message || 'Invalid STT request',
      };
      res.status(400).json(err);
      return;
    }
    const requestData = {
      ...parsedBody.data,
      language: parsedBody.data.language ?? 'zh',
    };
    const { audioDataUrl, provider, model } = requestData;

    const { buffer } = parseDataUrl(audioDataUrl);
    if (buffer.byteLength > appConfig.stt.maxAudioBytes) {
      const err: AppErrorResponse = {
        ok: false,
        code: 'VOICE_TRANSCRIBE_FAILED',
        message: `Audio is too large. Max size is ${appConfig.stt.maxAudioBytes} bytes.`,
      };
      res.status(413).json(err);
      return;
    }

    const form = buildSttForwardForm(requestData);

    const sttServiceUrl = appConfig.stt.serviceUrl;
    const response = await fetchWithTimeout(`${sttServiceUrl.replace(/\/$/, '')}/transcribe`, {
      method: 'POST',
      body: form,
    }, appConfig.stt.timeoutMs);

    if (!response.ok) {
      const errorText = await response.text().catch(() => `Unknown ${provider} error`);
      logger.error({ status: response.status, provider, errorText }, 'local STT error');
      res.status(response.status).json({
        ok: false,
        code: 'VOICE_TRANSCRIBE_FAILED',
        message: `${provider} STT error (${response.status}): ${errorText.slice(0, 200)}`,
      });
      return;
    }

    const data = await response.json() as { text?: string; provider?: string; model?: string };
    res.json({
      ok: true,
      text: (data.text || '').trim(),
      provider: data.provider || provider,
      model: data.model || model,
    });
  } catch (error: any) {
    logger.error({ err: error }, 'STT transcribe error');
    res.status(500).json({
      ok: false,
      code: 'VOICE_TRANSCRIBE_FAILED',
      message: error.message || 'Failed to transcribe audio',
    });
  }
});

export default router;
