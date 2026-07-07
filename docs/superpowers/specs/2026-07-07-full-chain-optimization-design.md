# Full Chain Optimization Design

## Goal

Deliver the first production-hardening pass for AI Chat while keeping the product lightweight, local-first, and deployable as a single web service.

## Scope

This design implements the approved stable enhancement option. It adds local frontend data assets for preferences, role presets, storage keys, and project capability information. It hardens the Express API with configuration, rate limits, request sizing, timeouts, and validation. It improves chat context trimming and surfaces project/data/deployment boundaries in the UI and docs.

## Non-Goals

No remote database, login, cloud sync, server-side user profile store, billing, or multi-tenant administration will be added in this iteration.

## Architecture

The browser remains the source of truth for user-controlled data. IndexedDB stores characters, conversations, and messages. localStorage stores lightweight preferences and optional API keys. The new `apps/web/src/local-data/` folder acts as the local data contract: seed presets, storage keys, default preferences, and project information live there so the app has a clear local data boundary without pretending to have a remote database.

The server remains stateless. It validates and relays BYOK requests to DeepSeek, ElevenLabs, and optional local STT. In-memory rate limiting and proactive counters are acceptable for the current single-instance deployment. If the project later adds a real database or multi-instance deployment, these modules become the replacement points.

## Testing

Backend helper behavior is covered with Node test runner tests executed through `tsx --test`. The full workspace is verified with `pnpm build`.
