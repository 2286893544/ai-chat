# ai-chat

AI Chat 是一个轻量、本地优先、BYOK 的个人 AI 聊天工具。当前版本包含：

- Vue + Pinia 聊天前端，角色、会话、消息保存在浏览器 IndexedDB。
- Express API 代理 DeepSeek / 智谱大模型、智谱 GLM-TTS、ElevenLabs 和可选本地 STT 服务。
- 前端 `apps/web/src/local-data/` 保存默认偏好、存储键、角色预设和项目说明。
- 聊天角色预设：日常唠嗑搭子、温柔陪伴者、吐槽玩梗朋友。
- 后端基础防护：CORS 配置、请求大小限制、简单频控、输入校验、外部请求超时、聊天上下文预算裁剪。

## Data model

当前没有远程数据库、账号体系或云同步。数据保存位置：

- IndexedDB：角色、会话、消息，数据库名 `aiChatDB`。
- localStorage：API Key 记住选项、模型、STT/TTS 偏好。
- 前端源码目录：`apps/web/src/local-data/` 只保存默认配置和种子数据，不保存用户运行时数据。

公共设备不建议记住 API Key。清空浏览器数据会删除本地保存的角色、会话、消息和偏好。

## Local development

```sh
pnpm dev:all
```

## Verification

```sh
pnpm test
pnpm build
```

## Deployment boundary

Render 免费单服务部署只包含 Vue 静态资源和 Express API。`apps/stt-service` 是可选本地 faster-whisper 服务，不会随默认 Render 配置部署。

- Web: http://localhost:5173
- API health: http://localhost:3001/health
- STT health: http://localhost:8001/health

Stop all services from the same terminal with `Ctrl+C`.

If the terminal was closed but a port is still occupied:

```sh
for port in 5173 5174 3001 8001; do
  pids=$(lsof -tiTCP:$port -sTCP:LISTEN)
  [ -n "$pids" ] && kill $pids
done
```
