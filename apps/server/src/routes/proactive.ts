import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';
import type { ProactiveTickRequest, ProactiveTickResponse, AppErrorResponse } from '@ai-chat/shared';

const router = Router();

// In-memory tracking for proactive message counts per conversation per day
const proactiveDailyCounts = new Map<string, { date: string; count: number }>();

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function isWithinActiveHours(currentTime: string, start: string, end: string): boolean {
  const currentMinutes = parseTimeToMinutes(currentTime);
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  if (currentMinutes === null || startMinutes === null || endMinutes === null) {
    return true;
  }

  if (startMinutes === endMinutes) {
    return true;
  }

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

router.post('/api/proactive/tick', async (req: Request, res: Response) => {
  try {
    const apiKey = req.deepseekApiKey;
    if (!apiKey) {
      const err: AppErrorResponse = {
        ok: false,
        code: 'API_KEY_MISSING',
        message: 'Missing X-DeepSeek-Api-Key header',
      };
      res.status(400).json(err);
      return;
    }

    const body = req.body as ProactiveTickRequest;
    const { conversationId, character, recentMessages, lastUserActiveAt } = body;

    if (!conversationId || !character || !lastUserActiveAt) {
      const err: AppErrorResponse = {
        ok: false,
        code: 'UNKNOWN_ERROR',
        message: 'Missing required fields: conversationId, character, lastUserActiveAt',
      };
      res.status(400).json(err);
      return;
    }

    const proactive = character.proactive;

    // Check if proactive chat is enabled
    if (!proactive.enabled) {
      const response: ProactiveTickResponse = {
        shouldSend: false,
        reason: 'Proactive chat is disabled for this character',
      };
      res.json(response);
      return;
    }

    // Check DND
    if (proactive.doNotDisturb) {
      const response: ProactiveTickResponse = {
        shouldSend: false,
        reason: 'Do-Not-Disturb is enabled',
      };
      res.json(response);
      return;
    }

    // Check active hours
    if (proactive.activeHours) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (!isWithinActiveHours(currentTime, proactive.activeHours.start, proactive.activeHours.end)) {
        const response: ProactiveTickResponse = {
          shouldSend: false,
          reason: `Outside active hours (${proactive.activeHours.start} - ${proactive.activeHours.end})`,
        };
        res.json(response);
        return;
      }
    }

    // Check idle timeout — if user was active recently, don't send proactive
    const now = Date.now();
    const lastActive = new Date(lastUserActiveAt).getTime();
    const idleMinutes = (now - lastActive) / 1000 / 60;

    // Minimum idle time before sending a proactive message
    const idleTimeoutMinutes = proactive.minIntervalMinutes || 5;
    if (idleMinutes < idleTimeoutMinutes) {
      const response: ProactiveTickResponse = {
        shouldSend: false,
        reason: `User was active ${Math.round(idleMinutes)} minutes ago — wait for idle timeout`,
      };
      res.json(response);
      return;
    }

    // Check minimum interval between proactive messages
    if (recentMessages.length > 0) {
      // Only block repeated proactive messages. A normal assistant reply should not
      // prevent the character from starting a new conversation after the idle timeout.
      const lastProactiveIdx = [...recentMessages].reverse().findIndex((m) => m.role === 'assistant' && m.type === 'proactive');
      if (lastProactiveIdx >= 0) {
        const lastUserIdx = [...recentMessages].reverse().findIndex((m) => m.role === 'user');
        if (lastUserIdx < 0 || lastUserIdx > lastProactiveIdx) {
          const response: ProactiveTickResponse = {
            shouldSend: false,
            reason: 'Waiting for user response to previous proactive message',
          };
          res.json(response);
          return;
        }
      }
    }

    // Check daily count
    const dateKey = getDateKey();
    const dailyRecord = proactiveDailyCounts.get(conversationId);
    const dailyCount = dailyRecord && dailyRecord.date === dateKey ? dailyRecord.count : 0;

    if (dailyCount >= (proactive.maxDailyCount || 10)) {
      const response: ProactiveTickResponse = {
        shouldSend: false,
        reason: `Daily proactive limit reached (${proactive.maxDailyCount})`,
      };
      res.json(response);
      return;
    }

    // All checks passed — generate a proactive message
    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    const defaultModel = process.env.DEFAULT_DEEPSEEK_MODEL || 'deepseek-v4-flash';

    const client = new OpenAI({
      baseURL,
      apiKey,
    });

    // Build a proactive prompt
    const hobbiesList = character.hobbies?.join(', ') || 'various topics';
    const preferredTopics = character.preferredTopics?.join(', ') || 'general conversation';

    const proactivePrompt = `You are ${character.name} and you want to start a conversation naturally.

Your background: ${character.background || 'Not specified'}
Your hobbies: ${hobbiesList}
Topics you like: ${preferredTopics}

The conversation history (recent messages):
${recentMessages.slice(-10).map((m) => `${m.role}: ${m.content}`).join('\n')}

Generate a natural, in-character proactive message to restart the conversation. Keep it warm, contextual, and engaging. Do NOT use any prefix like "${character.name}:" or "Proactive:" — just output the message content directly.`;

    const completion = await client.chat.completions.create({
      model: defaultModel,
      messages: [{ role: 'user', content: proactivePrompt }],
      max_tokens: 512,
      temperature: 0.8,
    });

    const content = completion.choices?.[0]?.message?.content || '';

    // Update daily count
    proactiveDailyCounts.set(conversationId, { date: dateKey, count: dailyCount + 1 });

    const messageId = uuidv4();
    const response: ProactiveTickResponse = {
      shouldSend: true,
      reason: 'Proactive message generated',
      message: {
        id: messageId,
        role: 'assistant',
        type: 'proactive',
        content,
      },
    };

    logger.info({ conversationId, messageId, contentLength: content.length }, 'Proactive message generated');
    res.json(response);

  } catch (error: any) {
    logger.error({ err: error }, 'Proactive tick error');

    const status = error.status || 500;
    let code: string = 'UNKNOWN_ERROR';
    let message: string = error.message || 'Failed to generate proactive message';

    if (status === 401 || status === 403) {
      code = 'DEEPSEEK_AUTH_FAILED';
      message = 'Authentication failed — invalid API key';
    } else if (status === 429) {
      code = 'DEEPSEEK_RATE_LIMITED';
      message = 'Rate limited — please try again later';
    }

    const errResponse: AppErrorResponse = {
      ok: false,
      code: code as any,
      message,
    };
    res.status(status).json(errResponse);
  }
});

export default router;
