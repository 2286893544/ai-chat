import { Request, Response, NextFunction } from 'express';

// Module augmentation for Express Request
declare module 'express' {
  interface Request {
    modelApiKey?: string;
    deepseekApiKey?: string;
  }
}

/** Paths that don't require API key validation */
const SKIP_KEY_PATHS = ['/api/keys/validate', '/api/tts/speak', '/api/stt/transcribe'];

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip key validation for certain endpoints
  if (SKIP_KEY_PATHS.includes(req.originalUrl)) {
    next();
    return;
  }

  const apiKey = (req.headers['x-model-api-key'] || req.headers['x-deepseek-api-key']) as string | undefined;

  if (!apiKey || apiKey.trim() === '') {
    res.status(400).json({
      ok: false,
      code: 'API_KEY_MISSING',
      message: 'Missing X-Model-Api-Key header',
    });
    return;
  }

  req.modelApiKey = apiKey;
  req.deepseekApiKey = apiKey;
  next();
}
