# ai-chat

AI Chat 是一个轻量、本地优先、BYOK 的个人 AI 聊天工具。当前版本包含：

- Vue + Pinia 聊天前端，角色、会话、消息保存在浏览器 IndexedDB。
- Express API 代理 DeepSeek / 智谱大模型、智谱 GLM-TTS、ElevenLabs，以及可选的本地 STT 和 Qwen3-TTS 语音复刻服务。
- 前端 `apps/web/src/local-data/` 保存默认偏好、存储键、角色预设和项目说明。
- 聊天角色预设：日常唠嗑搭子、温柔陪伴者、吐槽玩梗朋友。
- 后端基础防护：CORS 配置、请求大小限制、简单频控、输入校验、外部请求超时、聊天上下文预算裁剪。

## Data model

当前没有远程数据库、账号体系或云同步。数据保存位置：

- IndexedDB：角色、会话、消息，数据库名 `aiChatDB`。
- localStorage：API Key 记住选项、模型、STT/TTS 偏好。
- `~/.ai-chat-web/voices`：本地复刻音色的 WAV 样本和逐字稿。
- 前端源码目录：`apps/web/src/local-data/` 只保存默认配置和种子数据，不保存用户运行时数据。

公共设备不建议记住 API Key。清空浏览器数据会删除本地保存的角色、会话、消息和偏好。

## Local development

```sh
pnpm dev:all
```

`dev:all` 会通过 `uv` 启动 MLX-Audio。首次启动需要安装 Python 依赖；首次使用复刻音色试听时会从 Hugging Face 镜像下载 `Qwen3-TTS-12Hz-0.6B-Base-8bit`。该本地方案不需要 API Key，也不会上传参考音频。

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
- Local TTS: http://localhost:8002/

Stop all services from the same terminal with `Ctrl+C`.

If the terminal was closed but a port is still occupied:

```sh
for port in 5173 5174 3001 8001 8002; do
  pids=$(lsof -tiTCP:$port -sTCP:LISTEN)
  [ -n "$pids" ] && kill $pids
done
```
# macOS 桌面版

桌面版使用 Electron 封装现有 Vue 界面，并在应用内部自动启动 Express API。不需要手动启动 Web 或 API 服务。

```bash
# 构建并启动 macOS App
pnpm desktop:mac

# 生成本机 arm64 .app
pnpm desktop:pack:mac

# 生成本机 arm64 DMG
pnpm desktop:dmg:mac
```

打包产物位于 `release/macos/`。未签名的本地构建适合本机测试；发布给其他用户前需要 Apple Developer 证书签名和公证。
