# LearnDeck — Auth Testing Playbook

For the testing agent. Read this before exercising any auth-protected endpoint.

## Stack

- NestJS 11 on port 8001 (supervisor-managed)
- MongoDB `learndeck` database on localhost:27017
- bcrypt (rounds 12) for **passwords**
- SHA-256 hex for **refresh-token storage** (bcrypt would silently truncate at 72 bytes, breaking rotation)
- `jti` claim on every refresh token → byte-unique tokens even within the same second
- Global `JwtAuthGuard` via `APP_GUARD` → every route authenticated by default; opt-out with `@Public()`

## Credentials

See `/app/memory/test_credentials.md`.

## What to verify

### Happy path
1. `POST /api/auth/register` with new email → 201, returns `{ user, accessToken, refreshToken }` + sets cookies.
2. `POST /api/auth/login` with seeded admin → 200 same shape.
3. `GET /api/auth/me` with the access cookie OR `Authorization: Bearer <accessToken>` → 200, returns the user (no `passwordHash`).
4. `POST /api/auth/refresh` with the refresh cookie → 200, returns a **different** access/refresh pair. Old refresh must NOT match new.
5. `POST /api/auth/logout` → 204, cookies cleared.

### Security path
6. **Replay attack**: capture refresh A, rotate to get refresh B, then replay A → must return **401 "Refresh token revoked"**, AND every active session for the user must be revoked (verify via `db.refreshtokens.find({userId, revoked:false}).count() === 0`).
7. **Wrong token type**: take the refresh token and present it as a Bearer access → 401 "Invalid token type".
8. **Wrong password**: `POST /api/auth/login` with bad password → 401 "Invalid credentials".
9. **Brute force**: 5 failed logins in a row for the same email from the same IP → 6th should be 429 (throttler) OR the service-layer lockout returns 429 "Too many failed attempts. Try again in N minute(s)."
10. **RBAC**: `GET /api/users` as a `student` → 403. As `admin` → 200.
11. **Disabled user**: `PATCH /api/users/:id/active {isActive:false}` then `GET /api/auth/me` with that user's token → 401.

### Persistence guarantees
12. MongoDB has the following indexes (verify with `db.<collection>.getIndexes()`):
    - `users.email` → unique
    - `refreshtokens.expiresAt` → TTL (expireAfterSeconds: 0)
    - `refreshtokens.{userId, tokenHash}` → compound
    - `loginattempts.lastAttemptAt` → TTL (expireAfterSeconds: 86400)
    - `loginattempts.identifier` → unique

## Curl recipes

```bash
API="http://localhost:8001/api"

# Login admin
curl -s -c /tmp/c.txt -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@learndeck.app","password":"ChangeMe!2026"}' | jq

# /me with cookie
curl -s -b /tmp/c.txt "$API/auth/me" | jq

# /me with Bearer (extract from previous response)
TOKEN=$(curl -s -c /tmp/c.txt -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@learndeck.app","password":"ChangeMe!2026"}' | jq -r .accessToken)
curl -s -H "Authorization: Bearer $TOKEN" "$API/auth/me" | jq

# Rotate
curl -s -b /tmp/c.txt -c /tmp/c.txt -X POST "$API/auth/refresh" | jq

# Replay attack
OLD=$(grep refresh_token /tmp/c.txt | awk '{print $7}')
curl -s -b /tmp/c.txt -c /tmp/c.txt -X POST "$API/auth/refresh" >/dev/null  # rotate
curl -s -X POST "$API/auth/refresh" -H "Cookie: refresh_token=$OLD" -w "\n%{http_code}\n"  # expect 401
```

## Common pitfalls

- **Cookies not being sent**: ensure `withCredentials: true` (axios) or `credentials: 'include'` (fetch) on the frontend.
- **403 instead of 401**: that means JWT verified but role check failed — see `RolesGuard`.
- **`secretOrKey is required`**: regenerate JWT secrets in `.env` (must be ≥32 chars per Joi schema).
- **Mongo connection refused**: `sudo supervisorctl status mongodb`.

## What to escalate

If any of the following happen, do NOT auto-fix — escalate to the main agent:
- Refresh-token replay returns anything other than 401.
- A revoked token still successfully refreshes.
- `passwordHash` or `tokenHash` ever leaks into any response body.
- Login with a disabled user returns 200.
