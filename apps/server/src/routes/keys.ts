import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { maskKey } from '../utils/maskKey.js';
import type { ValidateKeyRequest, ValidateKeyResponse, AppErrorResponse } from '@ai-chat/shared';

const router = Router();

router.post('/api/keys/validate', async (req: Request, res: Response) => {
  try {
    const { apiKey, model } = req.body as ValidateKeyRequest;

    if (!apiKey) {
      const err: AppErrorResponse = {
        ok: false,
        code: 'API_KEY_MISSING',
        message: 'apiKey is required in request body',
      };
      res.status(400).json(err);
      return;
    }

    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    const defaultModel = process.env.DEFAULT_DEEPSEEK_MODEL || 'deepseek-v4-flash';
    const targetModel = model || defaultModel;

    const client = new OpenAI({
      baseURL,
      apiKey,
    });

    // Ping the models endpoint to validate the key
    const modelsResponse = await client.models.list();

    // Check if the requested model is available
    const availableModels = modelsResponse.data.map((m) => m.id);
    const resolvedModel = availableModels.includes(targetModel) ? targetModel : (availableModels[0] || targetModel);

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
      code = 'DEEPSEEK_AUTH_FAILED';
      message = 'Invalid API key — authentication failed';
    } else if (status === 429) {
      code = 'DEEPSEEK_RATE_LIMITED';
      message = 'Rate limited — please try again later';
    } else if (status === 402 || (error.message && error.message.includes('insufficient_balance'))) {
      code = 'DEEPSEEK_INSUFFICIENT_BALANCE';
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
