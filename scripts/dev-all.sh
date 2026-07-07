#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PIDS=""

cleanup() {
  status=$?
  trap - INT TERM EXIT

  if [ -n "$PIDS" ]; then
    kill $PIDS 2>/dev/null || true
    wait $PIDS 2>/dev/null || true
  fi

  exit "$status"
}

trap cleanup INT TERM EXIT

cat <<'EOF'
Starting all local services:
  Web:        http://localhost:5173
  API:        http://localhost:3001/health
  STT:        http://localhost:8001/health

Press Ctrl+C to stop all services.
EOF

(cd "$ROOT_DIR" && pnpm dev) &
PIDS="$PIDS $!"

(cd "$ROOT_DIR" && pnpm dev:stt) &
PIDS="$PIDS $!"

wait
