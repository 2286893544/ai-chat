# ai-chat

## Local development

```sh
pnpm dev:all
```

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
