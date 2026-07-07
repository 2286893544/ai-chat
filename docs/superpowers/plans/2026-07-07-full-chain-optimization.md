# Full Chain Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the current AI Chat app, add a frontend local data layer, improve UX/docs, and keep deployment lightweight and local-first.

**Architecture:** Browser data stays local in IndexedDB/localStorage. Frontend local seed/config files define preferences, role presets, storage keys, and project info. Express remains stateless and adds validation, limits, rate limiting, context budgets, and external request timeouts.

**Tech Stack:** Vue 3, Pinia, IndexedDB, Express, TypeScript, Zod, Node test runner via tsx, Render.

---

### Task 1: Backend Context and Config Tests

**Files:**
- Create: `apps/server/src/config.test.ts`
- Create: `apps/server/src/prompt/context.test.ts`
- Modify: `apps/server/package.json`

- [ ] Add server `test` script: `tsx --test src/**/*.test.ts`.
- [ ] Write tests for default config parsing and environment overrides.
- [ ] Write tests for context trimming by max messages and max characters.
- [ ] Run `pnpm --filter @ai-chat/server test` and confirm the tests fail because helpers are missing or old signatures do not satisfy the expected behavior.

### Task 2: Backend Config, Rate Limit, Timeout, and Context

**Files:**
- Create: `apps/server/src/config.ts`
- Create: `apps/server/src/middleware/rateLimit.ts`
- Create: `apps/server/src/utils/timeout.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `apps/server/src/prompt/context.ts`
- Modify: `apps/server/src/routes/chat.ts`
- Modify: `apps/server/src/routes/keys.ts`
- Modify: `apps/server/src/routes/proactive.ts`
- Modify: `apps/server/src/routes/stt.ts`
- Modify: `apps/server/src/routes/tts.ts`

- [ ] Implement config parsing with safe defaults.
- [ ] Add CORS origin handling from config.
- [ ] Add simple in-memory API rate limit middleware.
- [ ] Add timeout helper for external fetch calls.
- [ ] Add context trimming by max messages and character budget.
- [ ] Add Zod validation and size limits to chat, key validation, proactive, STT, and TTS routes.
- [ ] Run `pnpm --filter @ai-chat/server test` and confirm tests pass.

### Task 3: Frontend Local Data Layer and Presets

**Files:**
- Create: `apps/web/src/local-data/storageKeys.ts`
- Create: `apps/web/src/local-data/preferences.ts`
- Create: `apps/web/src/local-data/rolePresets.ts`
- Create: `apps/web/src/local-data/projectInfo.ts`
- Modify: `apps/web/src/stores/apiKey.ts`
- Modify: `apps/web/src/views/CharacterListPage.vue`
- Modify: `apps/web/src/views/SettingsPage.vue`

- [ ] Centralize localStorage keys.
- [ ] Add default preferences.
- [ ] Add work role presets for product manager, developer, and tester.
- [ ] Add UI to create a character from a preset.
- [ ] Add settings sections for local data, safety, and deployment limits.

### Task 4: Project Info Page and Navigation

**Files:**
- Create: `apps/web/src/views/ProjectInfoPage.vue`
- Modify: `apps/web/src/router/index.ts`
- Modify: `apps/web/src/App.vue`

- [ ] Add a project info route.
- [ ] Add sidebar navigation entry.
- [ ] Render capability, local data, deployment, and roadmap information from local data.

### Task 5: Documentation Sync and Verification

**Files:**
- Modify: `README.md`
- Modify: `DEPLOY.md`
- Modify: `docs/versions/v2026-07-07-full-chain-optimization/03-开发总览.md`
- Modify: `docs/versions/v2026-07-07-full-chain-optimization/04-测试总览.md`
- Modify: `docs/versions/v2026-07-07-full-chain-optimization/05-产品验收.md`

- [ ] Update README with latest capabilities and local-first data boundary.
- [ ] Update DEPLOY with environment variables and STT/TTS limitations.
- [ ] Run `pnpm --filter @ai-chat/server test`.
- [ ] Run `pnpm build`.
- [ ] Record verification results in version docs.
