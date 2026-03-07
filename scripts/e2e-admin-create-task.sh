#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3011}"
NEXT_DIST_DIR="${NEXT_DIST_DIR:-.next-smoke-admin}"
NEXT_TSCONFIG_PATH="${NEXT_TSCONFIG_PATH:-tsconfig.smoke.json}"
ALLOW_DEV_BECOME_ADMIN="${ALLOW_DEV_BECOME_ADMIN:-1}"
LOG_FILE="${LOG_FILE:-/tmp/mathsite-e2e-admin.log}"
BASE_URL="http://localhost:${PORT}"

cleanup() {
  if [[ -n "${PID:-}" ]]; then
    kill -9 "${PID}" >/dev/null 2>&1 || true
    wait "${PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

echo "Starting e2e server: PORT=${PORT}, NEXT_DIST_DIR=${NEXT_DIST_DIR}, NEXT_TSCONFIG_PATH=${NEXT_TSCONFIG_PATH}"
NEXT_DIST_DIR="${NEXT_DIST_DIR}" NEXT_TSCONFIG_PATH="${NEXT_TSCONFIG_PATH}" ALLOW_DEV_BECOME_ADMIN="${ALLOW_DEV_BECOME_ADMIN}" pnpm dev --port "${PORT}" >"${LOG_FILE}" 2>&1 &
PID=$!

ok=0
for _ in {1..60}; do
  if curl -I --max-time 5 "${BASE_URL}/ru/admin" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 1
done

if [[ "${ok}" != "1" ]]; then
  echo "E2E bootstrap failed: server is not ready"
  tail -n 40 "${LOG_FILE}" || true
  exit 1
fi

E2E_BASE_URL="${BASE_URL}" tsx scripts/e2e-admin-create-task.ts

echo "--- DEV LOG (tail) ---"
tail -n 40 "${LOG_FILE}" || true

