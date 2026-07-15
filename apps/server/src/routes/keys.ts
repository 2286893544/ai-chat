import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { z } from 'zod';
import { maskKey } from '../utils/maskKey.js';
import { resolveModelBaseURL, resolveModelName, resolveModelProvider } from '../utils/modelProvider.js';
import logger from '../logger.js';
import type { ValidateKeyRequest, ValidateKeyResponse, AppErrorResponse } from '@ai-chat/shared';

const router = Router();

const validateKeySchema = z.object({
  apiKey: z.string().min(1).max(512),
  model: z.string().min(1).max(120).optional(),
  provider: z.enum(['deepseek', 'zhipu']).optional(),
  baseURL: z.string().url().max(300).optional(),
});

router.post('/api/keys/validate', async (req: Request, res: Response) => {
  try {
    const parsedBody = validateKeySchema.safeParse(req.body);
    if (!parsedBody.success) {
      const err: AppErrorResponse = {
        ok: false,
        code: 'API_KEY_MISSING',
        message: parsedBody.error.issues[0]?.message || 'apiKey is required in request body',
      };
      res.status(400).json(err);
      return;
    }
    const { apiKey, model, provider, baseURL: requestBaseURL } = parsedBody.data as ValidateKeyRequest;

    const resolvedProvider = resolveModelProvider(provider);
    const baseURL = resolveModelBaseURL(provider, requestBaseURL);
    const targetModel = resolveModelName(provider, model);

    const client = new OpenAI({
      baseURL,
      apiKey,
    });

    logger.info({ provider: resolvedProvider, baseURL, targetModel }, 'Validating model API key');

    let resolvedModel = targetModel;
    if (resolvedProvider === 'zhipu') {
      await client.chat.completions.create({
        model: targetModel,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      });
    } else {
      // Ping the models endpoint to validate the key.
      const modelsResponse = await client.models.list();
      const availableModels = modelsResponse.data.map((m) => m.id);
      resolvedModel = availableModels.includes(targetModel) ? targetModel : (availableModels[0] || targetModel);
    }

    const response: ValidateKeyResponse = {
      ok: true,
      maskedKey: maskKey(apiKey),
      model: resolvedModel,
    };

    res.json(response);
  } catch (error: any) {
    const status = error.status || 500;
    let code: string;
    let message: string;

    if (status === 401 || status === 403) {
      code = 'MODEL_AUTH_FAILED';
      message = 'Invalid API key — authentication failed';
    } else if (status === 429) {
      code = 'MODEL_RATE_LIMITED';
      message = 'Rate limited — please try again later';
    } else if (status === 402 || (error.message && error.message.includes('insufficient_balance'))) {
      code = 'MODEL_INSUFFICIENT_BALANCE';
      message = 'Insufficient balance on the API key';
    } else {
      code = 'UNKNOWN_ERROR';
      message = error.message || 'Unknown error validating API key';
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
