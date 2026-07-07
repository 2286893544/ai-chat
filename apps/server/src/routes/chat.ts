import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { buildSystemPrompt } from '../prompt/builder.js';
import { buildMessagesContext } from '../prompt/context.js';
import { appConfig } from '../config.js';
import { createTimeoutSignal } from '../utils/timeout.js';
import logger from '../logger.js';
import '../middleware/apiKey.js';
import type { ChatStreamRequest, SSEStartEvent, SSEDeltaEvent, SSEDoneEvent, SSEErrorEvent, AppErrorResponse } from '@ai-chat/shared';

const router = Router();
const abortControllers = new Map<string, AbortController>();

const SSE_EVENT_START = 'message.start';
const SSE_EVENT_DELTA = 'message.delta';
const SSE_EVENT_DONE = 'message.done';
const SSE_EVENT_ERROR = 'message.error';

const chatStreamSchema = z.object({
  conversationId: z.string().min(1),
  character: z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(120),
  }).passthrough(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(appConfig.chat.maxInputChars),
  })).default([]),
  input: z.string().min(1).max(appConfig.chat.maxInputChars),
  model: z.string().min(1).max(120).optional(),
  thinking: z.object({
    type: z.enum(['disabled', 'enabled']),
    reasoning_effort: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
});

router.post('/api/chat/completions/stream', async (req: Request, res: Response) => {
  try {
    const apiKey = req.deepseekApiKey;
    if (!apiKey) {
      const err: AppErrorResponse = { ok: false, code: 'API_KEY_MISSING', message: 'Missing X-DeepSeek-Api-Key header' };
      res.status(400).json(err);
      return;
    }

    const parsedBody = chatStreamSchema.safeParse(req.body);
    if (!parsedBody.success) {
      const err: AppErrorResponse = { ok: false, code: 'UNKNOWN_ERROR', message: parsedBody.error.issues[0]?.message || 'Invalid chat request' };
      res.status(400).json(err);
      return;
    }
    const body = parsedBody.data as ChatStreamRequest;
    const { conversationId, character, messages, input, model, thinking } = body;

    const messageId = uuidv4();

    // SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send start event
    const startEvent: SSEStartEvent = { messageId };
    res.write(`event: ${SSE_EVENT_START}\ndata: ${JSON.stringify(startEvent)}\n\n`);

    const characterData = character as any;
    const systemPrompt = buildSystemPrompt(characterData);
    const chatMessages = buildMessagesContext(systemPrompt, messages, input, {
      maxMessages: appConfig.chat.maxMessages,
      maxContextChars: appConfig.chat.maxContextChars,
    });

    const baseURL = appConfig.deepseekBaseUrl;
    const targetModel = model || appConfig.defaultDeepseekModel;

    const abortController = new AbortController();
    abortControllers.set(messageId, abortController);
    let responseFinished = false;

    res.on('finish', () => {
      responseFinished = true;
    });

    res.on('close', () => {
      if (!responseFinished) {
        abortController.abort();
        abortControllers.delete(messageId);
      }
    });

    try {
      logger.info({ targetModel, messageLength: chatMessages.length }, 'Calling DeepSeek chat completions...');

      const requestBody: Record<string, any> = {
        model: targetModel,
        messages: chatMessages,
        stream: true,
        max_tokens: 4096,
      };

      if (thinking && thinking.type === 'enabled') {
        requestBody.thinking = { type: 'enabled' };
        if (thinking.reasoning_effort) {
          requestBody.reasoning_effort = thinking.reasoning_effort;
        }
      }

      const timeout = createTimeoutSignal(appConfig.chat.timeoutMs, abortController.signal);
      const response = await fetch(`${baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: timeout.signal,
      }).finally(timeout.clear);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error({ status: response.status, errorText }, 'DeepSeek API error');

        let code: string;
        let message: string;

        if (response.status === 401 || response.status === 403) {
          code = 'DEEPSEEK_AUTH_FAILED';
          message = 'Authentication failed — invalid API key';
        } else if (response.status === 429) {
          code = 'DEEPSEEK_RATE_LIMITED';
          message = 'Rate limited — please try again later';
        } else if (response.status === 402) {
          code = 'DEEPSEEK_INSUFFICIENT_BALANCE';
          message = 'Insufficient balance';
        } else {
          code = 'UNKNOWN_ERROR';
          message = `DeepSeek API error (${response.status}): ${errorText.slice(0, 200)}`;
        }

        const errorEvent: SSEErrorEvent = { code: code as any, message };
        res.write(`event: ${SSE_EVENT_ERROR}\ndata: ${JSON.stringify(errorEvent)}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      // Read the SSE stream from DeepSeek using ReadableStream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                const deltaEvent: SSEDeltaEvent = { delta };
                res.write(`event: ${SSE_EVENT_DELTA}\ndata: ${JSON.stringify(deltaEvent)}\n\n`);
              }
            } catch {
              // Skip unparseable data lines
            }
          }
        }
      }

      // Send done event
      const doneEvent: SSEDoneEvent = { messageId };
      res.write(`event: ${SSE_EVENT_DONE}\ndata: ${JSON.stringify(doneEvent)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();

      logger.info({ conversationId, messageId, contentLength: fullContent.length }, 'Chat stream completed');
    } catch (streamError: any) {
      if (res.writableEnded) return;

      if (streamError.name === 'AbortError') {
        const doneEvent: SSEDoneEvent = { messageId };
        res.write(`event: ${SSE_EVENT_DONE}\ndata: ${JSON.stringify(doneEvent)}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        logger.info({ messageId }, 'Chat stream cancelled by client');
        return;
      }

      const errorEvent: SSEErrorEvent = { code: 'UNKNOWN_ERROR' as any, message: streamError.message || 'Unknown streaming error' };
      res.write(`event: ${SSE_EVENT_ERROR}\ndata: ${JSON.stringify(errorEvent)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();

      logger.error({ err: streamError, conversationId }, 'Chat stream error');
    } finally {
      abortControllers.delete(messageId);
    }
  } catch (error: any) {
    if (!res.headersSent) {
      const errResponse: AppErrorResponse = { ok: false, code: 'UNKNOWN_ERROR', message: error.message || 'Internal server error' };
      res.status(500).json(errResponse);
    } else if (!res.writableEnded) {
      const errorEvent: SSEErrorEvent = { code: 'UNKNOWN_ERROR' as any, message: error.message || 'Internal server error' };
      res.write(`event: ${SSE_EVENT_ERROR}\ndata: ${JSON.stringify(errorEvent)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

// Cancel an active stream by messageId
router.post('/api/chat/completions/cancel', (req: Request, res: Response) => {
  const { messageId } = req.body || {};
  if (!messageId) {
    res.status(400).json({ ok: false, code: 'UNKNOWN_ERROR', message: 'messageId is required' });
    return;
  }
  const controller = abortControllers.get(messageId);
  if (controller) {
    controller.abort();
    abortControllers.delete(messageId);
    res.json({ ok: true });
  } else {
    res.json({ ok: true, alreadyDone: true });
  }
});

export default router;
