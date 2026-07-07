import { Router, Request, Response } from 'express';
import type { AppErrorResponse } from '@ai-chat/shared';
import logger from '../logger.js';

const router = Router();

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

router.post('/api/stt/transcribe', async (req: Request, res: Response) => {
  try {
    const {
      provider = 'faster-whisper',
      audioDataUrl,
      model = 'base',
      language = 'zh',
    } = req.body || {};

    if (provider !== 'faster-whisper') {
      const err: AppErrorResponse = {
        ok: false,
        code: 'UNKNOWN_ERROR',
        message: `Unsupported STT provider: ${provider}`,
      };
      res.status(400).json(err);
      return;
    }

    if (!audioDataUrl || typeof audioDataUrl !== 'string') {
      const err: AppErrorResponse = {
        ok: false,
        code: 'UNKNOWN_ERROR',
        message: 'audioDataUrl is required',
      };
      res.status(400).json(err);
      return;
    }

    const { buffer, mimeType } = parseDataUrl(audioDataUrl);
    const audioBytes = new Uint8Array(buffer);
    const form = new FormData();
    form.append('file', new Blob([audioBytes], { type: mimeType }), getAudioFileName(mimeType));
    form.append('model', model);
    if (language) form.append('language', language);

    const sttServiceUrl = process.env.STT_SERVICE_URL || 'http://127.0.0.1:8001';
    const response = await fetch(`${sttServiceUrl.replace(/\/$/, '')}/transcribe`, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown faster-whisper error');
      logger.error({ status: response.status, errorText }, 'faster-whisper STT error');
      res.status(response.status).json({
        ok: false,
        code: 'VOICE_TRANSCRIBE_FAILED',
        message: `faster-whisper STT error (${response.status}): ${errorText.slice(0, 200)}`,
      });
      return;
    }

    const data = await response.json() as { text?: string; provider?: string; model?: string };
    res.json({
      ok: true,
      text: (data.text || '').trim(),
      provider: data.provider || 'faster-whisper',
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
