import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import path from 'node:path';
import logger from './logger.js';
import { appConfig } from './config.js';
import { apiKeyMiddleware } from './middleware/apiKey.js';
import { createRateLimitMiddleware } from './middleware/rateLimit.js';
import keysRouter from './routes/keys.js';
import chatRouter from './routes/chat.js';
import proactiveRouter from './routes/proactive.js';
import ttsRouter from './routes/tts.js';
import sttRouter from './routes/stt.js';

const app = express();
const PORT = appConfig.port;

// --- Middleware ---
app.use(cors({
  origin: appConfig.corsOrigins.includes('*') ? '*' : appConfig.corsOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-DeepSeek-Api-Key', 'X-ElevenLabs-Api-Key'],
}));

app.use(express.json({ limit: appConfig.jsonBodyLimit }));

// Request logging
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// --- Routes ---
// Apply API key middleware to all API routes
app.use('/api', createRateLimitMiddleware(appConfig.rateLimit));
app.use('/api', apiKeyMiddleware);

app.use(keysRouter);
app.use(chatRouter);
app.use(proactiveRouter);
app.use(ttsRouter);
app.use(sttRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function findWebDistPath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'apps/web/dist'),
    path.resolve(process.cwd(), '../web/dist'),
  ];

  return candidates.find((candidate) => existsSync(path.join(candidate, 'index.html'))) || null;
}

// Serve the built Vue app in production deployments.
const webDistPath = findWebDistPath();
const webIndexPath = webDistPath ? path.join(webDistPath, 'index.html') : null;

if (webDistPath && webIndexPath) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }

    res.sendFile(webIndexPath);
  });
}

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    code: 'UNKNOWN_ERROR',
    message: 'Not found',
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  if (!res.headersSent) {
    res.status(500).json({
      ok: false,
      code: 'UNKNOWN_ERROR',
      message: err.message || 'Internal server error',
    });
  }
});

app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

export default app;
