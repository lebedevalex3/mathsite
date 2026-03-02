# Admin Bootstrap (dev)

This project includes a dev-only endpoint to promote the current authenticated user to `admin`.

## Enable in local env

Add to `.env.local`:

```env
ALLOW_DEV_BECOME_ADMIN=1
```

Restart `pnpm dev` after changing env.

## Bootstrap flow

1. Sign in using `/ru/teacher/cabinet`.
2. Click `Стать админом (dev)` (or locale equivalent).
3. Open `/ru/admin`.

## API

- Method: `POST`
- Path: `/api/admin/become`
- Conditions:
  - requires active auth session
  - works only when `ALLOW_DEV_BECOME_ADMIN=1`
  - returns `404` when disabled

## Security note

Keep `ALLOW_DEV_BECOME_ADMIN` disabled outside local development.
