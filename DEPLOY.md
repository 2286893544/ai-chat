# Deploy

## Render Free Web Service

This project is configured to deploy as one Render Web Service:

- `pnpm build` builds shared types, the Express server, and the Vue app.
- `pnpm start` starts the Express server.
- In production the Express server serves `apps/web/dist` and the `/api/*` routes.

Steps:

1. Push the `ai-chat-web` directory as the root of a GitHub repository.
2. In Render, create a new Blueprint from the repository.
3. Render will read `render.yaml` and create the free web service.
4. After the first deploy, open the service URL and configure the DeepSeek API key in the app settings.

Notes:

- Render free services can sleep when idle, so the first request after inactivity may be slow.
- The local faster-whisper STT service is not deployed by this config. For online voice-to-text, use a hosted STT API or a separate paid service.
- Browser TTS works client-side. ElevenLabs TTS works if the user configures an ElevenLabs key. Edge TTS depends on `uvx` being available on the server and is not guaranteed on free hosting.
