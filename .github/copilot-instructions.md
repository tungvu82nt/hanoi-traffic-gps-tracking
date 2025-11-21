## Purpose
Provide concise, codebase-specific instructions for AI coding agents working on the Hanoi Traffic GPS/IP tracking backend.

## Big picture
- Single Node.js Express application (entry `server.js`) that also has a Netlify Functions variant at `netlify/functions/server.js` (exports `module.exports.handler` via `serverless-http`).
- Frontend is static HTML served from `public/` (`index.html`, `admin.html`, `success.html`).
- PostgreSQL (Neon) is the persistent store; DB access is centralized in `utils/neon-db.js` using `query` and `transaction` helpers.
- Sensitive data (IP addresses, IP suffixes) are encrypted/hashes via `utils/encryption.js`. Geo lookups optionally use `utils/ipinfo.js` (IPInfo.io API).

## Key files to reference
- `server.js` — main HTTP server, routes, admin auth, rate limit and logging.
- `netlify/functions/server.js` — same routes adapted for Netlify serverless.
- `utils/neon-db.js` — pool configuration, `query`, `transaction`, `testConnection`, and graceful shutdown.
- `utils/encryption.js` — AES-256-GCM encrypt/decrypt, `encryptIP`, `hashData`, and `getEncryptionKey` validation.
- `utils/ipinfo.js` — external IP geolocation integration with timeout and safe fallbacks.
- `neon-migration.sql` and `apply-neon-schema.js` — DB schema & migration helper.

## Developer workflows (explicit commands)
- Install deps: `npm install`
- Run server locally: `npm start` (or `npm run dev` to use `nodemon`).
- Run DB connectivity test: `npm run test:db` (runs `test-neon-connection.js`).
- Run IPInfo test: `npm run test:ipinfo`.
- Apply DB schema: `npm run apply:schema` (invokes `apply-neon-schema.js`).

Netlify: the `netlify/` function entry mirrors `server.js`. For serverless deploys, ensure environment variables are present in Netlify settings.

## Required environment variables (discoverable in code)
- `DATABASE_URL` — Neon connection string (used by `utils/neon-db.js`).
- `ENCRYPTION_KEY` — hex string, 64 chars (32 bytes). `utils/encryption.js` will throw if invalid.
- `ADMIN_API_TOKEN` OR `ADMIN_BASIC_USER` + `ADMIN_BASIC_PASSWORD` — admin auth. The server supports either token-based auth (sets HttpOnly cookie) or Basic Auth.
- `IPINFO_API_KEY` — optional; if absent, `utils/ipinfo.js` skips geo lookup.
- Optional rate limit settings: `REGISTER_RATE_LIMIT`, `REGISTER_RATE_WINDOW_MS`, `TRACK_RATE_LIMIT`, `TRACK_RATE_WINDOW_MS`.

## Important patterns & conventions (do NOT change without cause)
- Database access must go through `utils/neon-db.js` helpers. Use `query(...)` for simple queries and `transaction(client => ...)` for multi-statement transactions.
- Logging: SQL wrapper logs duration (`[SQL] Executed query in ...ms`) and errors. Keep `console.error` usage for request-level errors to preserve existing log format.
- Admin auth flow: token supplied via header `x-admin-token` or query `?token=` is persisted into an HttpOnly cookie named `admin_token` (see `persistAdminCookie`). Code commonly checks `requireAdminAuth` middleware before returning admin routes.
- Rate limiting: endpoints use `express-rate-limit` with values configurable by env vars — preserve the pattern when adding new public endpoints.
- IP handling: code hashes IP for uniqueness (`hashData(ip, 'ip-hash-salt')`) and only saves full IP/user-supplied GPS when `consent_given` is true. For partial IP storage use `encryptIP(ip)` which returns `prefix` and `suffixCipher`.
- Encryption key rotation: `getEncryptionKey` caches the key from `ENCRYPTION_KEY`. Rotating keys requires migrating encrypted fields or adding key versioning outside current code.

## How to add features consistent with repo
- New API routes: follow patterns in `server.js` — validate inputs, wrap DB calls with `try/catch`, log errors, respect rate limiting, and use `query(...)`.
- When inserting sensitive data: prefer `hashData(...)` or `encrypt(...)` from `utils/encryption.js` rather than storing raw values.
- When adding background tasks or Netlify functions, mirror the logic between `server.js` and `netlify/functions/server.js` (they intentionally duplicate auth/rate-limit behavior).

## Testing & debugging tips
- Local health: `GET /api/health` checks DB connectivity (returns `pg_version`).
- To see IP handling during requests: `GET /api/my-ip` prints request IP and forwarding headers — useful when testing behind proxies.
- To reproduce DB issues, run `npm run test:db` and review `utils/neon-db.js` pool logs.

## Examples (copy-paste snippets to follow patterns)
- Use DB query wrapper:
  ```js
  const result = await query('SELECT * FROM clicks_tracking WHERE id=$1', [id]);
  ```
- Hash IP for uniqueness:
  ```js
  const ipHash = hashData(clientIp, 'ip-hash-salt');
  ```
- Encrypt arbitrary object before storing:
  ```js
  const cipher = encryptObject({ foo: 'bar' });
  ```

## Gotchas / constraints
- `ENCRYPTION_KEY` must be a 64-char hex string; the app will throw at runtime if it is missing/invalid.
- `utils/ipinfo.js` rejects lookups for private/local IPs — tests that send localhost IPs will not get geo data.
- Server chooses `app.set('trust proxy', ...)` based on `NODE_ENV === 'production'`. When testing behind a proxy, set `NODE_ENV=production` if you want Express to trust `x-forwarded-for`.

## Where to ask for human help
- For migration or key-rotation decisions, consult repository owner or ops — code comments reference encryption rotation as manual.

---
If anything above is unclear or you'd like examples expanded (tests, a new endpoint scaffold, or a migration script), tell me which part to expand.
