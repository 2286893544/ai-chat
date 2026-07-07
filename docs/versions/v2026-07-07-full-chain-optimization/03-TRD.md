# TRD：AI Chat 全链路优化技术方案

## 架构原则

- 保持轻量：不引入远程数据库和服务端会话存储。
- 本地优先：用户偏好、角色、会话和消息仍落本地浏览器。
- 可替换：前端新增本地数据目录，把默认数据和存储键集中管理，后续可替换为真实数据库适配层。
- 防滥用：后端增加输入限制、频控、超时和 CORS 白名单。

## 文件设计

### 前端本地数据层

- `apps/web/src/local-data/storageKeys.ts`：集中定义 localStorage/IndexedDB 相关键名。
- `apps/web/src/local-data/preferences.ts`：默认用户偏好。
- `apps/web/src/local-data/rolePresets.ts`：聊天陪伴类角色预设。
- `apps/web/src/local-data/projectInfo.ts`：项目能力、本地数据和安全边界说明。

### 后端安全和配置

- `apps/server/src/config.ts`：解析环境变量和默认限制。
- `apps/server/src/middleware/rateLimit.ts`：简单内存频控。
- `apps/server/src/utils/timeout.ts`：外部 fetch 超时工具。
- `apps/server/src/prompt/context.ts`：增加上下文预算裁剪。
- `apps/server/src/routes/*.ts`：使用限制和校验。

### 前端体验

- `apps/web/src/views/SettingsPage.vue`：展示本地数据、安全边界和语音设置。
- `apps/web/src/views/ProjectInfoPage.vue`：新增项目说明页。
- `apps/web/src/views/CharacterListPage.vue`：支持从角色预设创建。
- `apps/web/src/router/index.ts` 与 `apps/web/src/App.vue`：新增入口。

## 关键限制

- 内存频控只适合单实例轻量部署；多实例需要 Redis 或网关频控。
- 主动聊天计数仍是内存态，重启会丢失；本轮不引入数据库。
- 本地 API Key 保存到浏览器 localStorage 时存在设备共享风险，必须在 UI 和文档中明确提示。
