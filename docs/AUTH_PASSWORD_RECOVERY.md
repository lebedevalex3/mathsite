# Password Recovery

Implemented flow:

1. `POST /api/auth/forgot-password`
2. `POST /api/auth/reset-password`
3. UI pages:
   - `/{locale}/auth/forgot-password`
   - `/{locale}/auth/reset-password?token=...`

## Security behavior

- Reset tokens are random 32-byte values; only SHA-256 hash is stored.
- Token TTL is 30 minutes (`PASSWORD_RESET_TOKEN_TTL_MS`).
- Tokens are one-time use (`usedAt`).
- Existing sessions are invalidated after successful reset.
- CSRF protection is required for both endpoints.
- Rate-limit is applied on forgot-password using `ip`, `identifier`, and `ip+identifier`.

## Dev behavior

- In non-production, `POST /api/auth/forgot-password` returns `resetUrl` to simplify local testing.
- Explicitly enable with `AUTH_PASSWORD_RESET_RETURN_LINK=1` if needed.

## Production note

Connect a real email provider and send `resetUrl` by email instead of exposing it in API response.
