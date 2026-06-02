# LearnDeck — Test Credentials & Auth Smoke

> Keep this file up to date whenever auth credentials change. Read by the
> testing agent before every regression run.

## Admin (seeded automatically on every boot)

| Field    | Value                       |
|----------|-----------------------------|
| Email    | `admin@learndeck.app`       |
| Password | `ChangeMe!2026`             |
| Role     | `admin`                     |
| Source   | `ADMIN_*` vars in `/app/backend/.env` |

The admin user is **idempotently** seeded by `SeedService` on every NestJS boot:
- created on first run
- password re-hashed if `ADMIN_PASSWORD` rotated
- promoted back to `admin` if role was downgraded

Change the seed by editing `/app/backend/.env`:
```
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
ADMIN_NAME=...
```
Then `sudo supervisorctl restart backend`.

## Test users (created during Block B verification)

| Email                  | Password    | Role    | Notes                  |
|------------------------|-------------|---------|------------------------|
| `alice@learndeck.app`  | `Secret-123`| student | created via /register  |
| `bob@learndeck.app`    | `Secret-123`| student | created via /register  |

These are convenience accounts only — delete or rotate before going live.

## Auth endpoint reference

| Method | Path                       | Auth?     | Throttle      | Notes |
|--------|----------------------------|-----------|---------------|-------|
| POST   | `/api/auth/register`       | public    | 60/min        | defaults role=student |
| POST   | `/api/auth/login`          | public    | **5/min**     | brute-force locked at 5 fails per (ip,email) |
| POST   | `/api/auth/refresh`        | public¹   | 60/min        | reads refresh_token cookie or `{refreshToken}` body |
| POST   | `/api/auth/logout`         | required  | 60/min        | best-effort revoke of current session |
| POST   | `/api/auth/logout-all`     | required  | 60/min        | nukes every active session |
| GET    | `/api/auth/me`             | required  | 60/min        | sanitized user document |
| GET    | `/api/users`               | admin     | 60/min        | full user list |
| PATCH  | `/api/users/:id/role`      | admin     | 60/min        | `{role:"student|teacher|admin"}` |
| PATCH  | `/api/users/:id/active`    | admin     | 60/min        | `{isActive:true|false}` |

¹ Public in the sense that no Bearer access token is required; *but* the
refresh token itself is verified and rotated.

## Cookies

| Cookie         | Max-age | httpOnly | secure | sameSite |
|----------------|---------|----------|--------|----------|
| `access_token` | 15 min  | yes      | prod   | lax      |
| `refresh_token`| 7 days  | yes      | prod   | lax      |

`secure` is `false` in `NODE_ENV=development` so curl over HTTP works.

## One-shot smoke test (copy-paste)

```bash
API="http://localhost:8001/api"

# 1. Login → access in body, both tokens in cookies
curl -s -c /tmp/c.txt -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@learndeck.app","password":"ChangeMe!2026"}'

# 2. Authenticated call using cookie
curl -s -b /tmp/c.txt "$API/auth/me"

# 3. Rotate
curl -s -b /tmp/c.txt -c /tmp/c.txt -X POST "$API/auth/refresh"

# 4. Logout
curl -s -b /tmp/c.txt -X POST "$API/auth/logout" -w "%{http_code}\n"
```

## Useful Mongo queries

```bash
mongosh --quiet learndeck --eval '
  console.log("users:", db.users.countDocuments());
  console.log("active refresh tokens:", db.refreshtokens.countDocuments({revoked:false}));
  db.users.find({}, {email:1, role:1, isActive:1, _id:0}).forEach(printjson);
'
```
