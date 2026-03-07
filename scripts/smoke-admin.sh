#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3011}"
NEXT_DIST_DIR="${NEXT_DIST_DIR:-.next-smoke-admin}"
NEXT_TSCONFIG_PATH="${NEXT_TSCONFIG_PATH:-tsconfig.smoke.json}"
LOG_FILE="${LOG_FILE:-/tmp/mathsite-smoke-admin.log}"
CURL_OUT="${CURL_OUT:-/tmp/mathsite-smoke-admin-curl.out}"
CURL_ERR="${CURL_ERR:-/tmp/mathsite-smoke-admin-curl.err}"
TARGET_URL="http://localhost:${PORT}/ru/admin"

cleanup() {
  if [[ -n "${PID:-}" ]]; then
    kill -9 "${PID}" >/dev/null 2>&1 || true
    wait "${PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

echo "Starting smoke server: PORT=${PORT}, NEXT_DIST_DIR=${NEXT_DIST_DIR}, NEXT_TSCONFIG_PATH=${NEXT_TSCONFIG_PATH}"
NEXT_DIST_DIR="${NEXT_DIST_DIR}" NEXT_TSCONFIG_PATH="${NEXT_TSCONFIG_PATH}" pnpm dev --port "${PORT}" >"${LOG_FILE}" 2>&1 &
PID=$!

ok=0
for _ in {1..60}; do
  if curl -I --max-time 5 "${TARGET_URL}" >"${CURL_OUT}" 2>"${CURL_ERR}"; then
    ok=1
    break
  fi
  sleep 1
done

echo "PID=${PID}"
echo "SMOKE_ADMIN=${ok}"
echo "--- CURL ---"
cat "${CURL_OUT}" || true
echo "--- CURL ERR ---"
cat "${CURL_ERR}" || true
echo "--- DEV LOG (tail) ---"
tail -n 40 "${LOG_FILE}" || true

if [[ "${ok}" != "1" ]]; then
  exit 1
fi
