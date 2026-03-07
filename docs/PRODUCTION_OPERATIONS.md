# Production Operations

## Required env

- `DATABASE_URL`
- `APP_BASE_URL`
- `CRON_SECRET`

`CRON_SECRET` protects the internal cleanup endpoint:

- `GET /api/internal/cron/demo-cleanup`
- `POST /api/internal/cron/demo-cleanup`

Use either:

- `Authorization: Bearer $CRON_SECRET`
- `x-cron-secret: $CRON_SECRET`

## Demo Cleanup Schedule

Run the cleanup endpoint every 10-15 minutes in production.

Example request:

```bash
curl -fsS \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.example/api/internal/cron/demo-cleanup
```

Expected response:

```json
{
  "ok": true,
  "deletedWorks": 0,
  "deletedVariants": 0,
  "skipped": false,
  "ranAt": "2026-03-07T12:00:00.000Z"
}
```

## Deploy Checklist

1. Apply DB migrations:

```bash
pnpm prisma migrate deploy
```

2. Verify required env vars:

- `DATABASE_URL`
- `APP_BASE_URL`
- `CRON_SECRET`

3. Run the app smoke checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm validate:tasks
pnpm validate:content
```

4. Confirm the health endpoint:

```bash
curl -fsS https://your-domain.example/api/health
```

5. Confirm the cron endpoint with auth:

```bash
curl -fsS \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.example/api/internal/cron/demo-cleanup
```
