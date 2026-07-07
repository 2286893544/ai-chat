# Deploy

## Render Free Web Service

This project is configured to deploy as one Render Web Service:

- `pnpm build` builds shared types, the Express server, and the Vue app.
- `pnpm start` starts the Express server.
- In production the Express server serves `apps/web/dist` and the `/api/*` routes.
- User data remains browser-local. This deployment does not create a remote database.

Steps:

1. Push the `ai-chat-web` directory as the root of a GitHub repository.
2. In Render, create a new Blueprint from the repository.
3. Render will read `render.yaml` and create the free web service.
4. After the first deploy, open the service URL and configure the DeepSeek API key in the app settings.

Notes:

- Render free services can sleep when idle, so the first request after inactivity may be slow.
- The local faster-whisper STT service is not deployed by this config. For online voice-to-text, use a hosted STT API or a separate paid service.
- Browser TTS works client-side. ElevenLabs TTS works if the user configures an ElevenLabs key. Edge TTS depends on `uvx` being available on the server and is not guaranteed on free hosting.

## Environment variables

| Name | Default | Purpose |
| --- | --- | --- |
| `DEFAULT_DEEPSEEK_MODEL` | `deepseek-v4-flash` | Default chat model. |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | DeepSeek-compatible API base URL. |
| `CORS_ORIGIN` | `*` | Comma-separated allowed origins. Use the deployed domain in production when possible. |
| `JSON_BODY_LIMIT` | `2mb` | Express JSON body limit. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | In-memory API rate-limit window. |
| `RATE_LIMIT_MAX` | `120` | Max requests per IP/path/window. |
| `CHAT_MAX_MESSAGES` | `40` | Max recent history messages sent to model. |
| `CHAT_MAX_CONTEXT_CHARS` | `24000` | Max approximate history characters. |
| `CHAT_MAX_INPUT_CHARS` | `8000` | Max single chat input characters. |
| `CHAT_REQUEST_TIMEOUT_MS` | `60000` | DeepSeek stream request timeout. |
| `TTS_TEXT_MAX_CHARS` | `2000` | Max TTS text length. |
| `TTS_REQUEST_TIMEOUT_MS` | `30000` | ElevenLabs request timeout. |
| `STT_AUDIO_MAX_BYTES` | `4194304` | Max uploaded audio bytes after base64 decode. |
| `STT_REQUEST_TIMEOUT_MS` | `60000` | STT service request timeout. |
| `STT_SERVICE_URL` | `http://127.0.0.1:8001` | Optional local or separately deployed faster-whisper service. |

## Local-first data boundary

The app intentionally stays lightweight:

- No remote user database.
- No login or multi-user permission model.
- No server-side conversation persistence.
- Browser IndexedDB stores characters, conversations, and messages.
- Browser localStorage stores preferences and optional BYOK keys.
