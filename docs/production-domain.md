# Production domain configuration

The canonical website origin is `https://benchpromos.com.br`. The `www` hostname redirects permanently to the apex domain while preserving the path. Browser and server GraphQL requests use `https://api.benchpromos.com.br/api`. Dokploy is available at `https://dokploy.benchpromos.com.br` once its DNS and certificate are active.

## Frontend environment

Set these in Dokploy's frontend environment and rebuild/redeploy:

```dotenv
NEXT_PUBLIC_APP_URL=https://benchpromos.com.br
NEXTAUTH_URL=https://benchpromos.com.br
NEXT_PUBLIC_API_URL=https://api.benchpromos.com.br/api
```

Public variables are embedded at build time. `siteConfig` derives metadata, Open Graph images, sitemap URLs, and sharing URLs from `NEXT_PUBLIC_APP_URL`. Changing only the runtime environment cannot replace URLs already embedded in browser assets.

The Google OAuth callback is `https://benchpromos.com.br/api/auth/callback/google`; that exact URI must be registered in the existing Google client. The app's provider endpoint reports the configured callback but does not prove an end-to-end Google login. Session secrets, API keys, and OAuth client credentials remain unchanged.

## API and deployment

The companion API uses `APP_URL=https://benchpromos.com.br` for absolute sale/comment notification links. Its HTTP API has no dependency on the former test hostname. Existing email sender/support addresses are separate mail identities and were not changed with the website origin.

DNS records for the apex, `www`, API, and Dokploy must route to `195.201.108.222`. The API record is intended to be DNS-only: browser challenges on GraphQL would block server-side requests. HTTPS remains on the existing Traefik/Let's Encrypt configuration; no certificate algorithm or compression change is part of this migration.

Deploy the API before the frontend, preserve the restored `benchpromos` database, and keep scheduled jobs at zero replicas until the owner explicitly resumes them. The server release helper preserves a paused worker. Update saved deployment snapshots when changing environment settings so a later restore cannot bring back the test URLs.

Once the new application is verified, remove the old test-domain app routes. Public API calls and frontend build/runtime settings must no longer reference `test.benchpromos.com.br`. Historical benchmark/restore reports intentionally keep the URLs they measured.

## Local development

Keep local development on localhost:

```dotenv
# Frontend
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3333/api

# API
APP_URL=http://localhost:3000
```

See the development and operations guide in this workspace for PostgreSQL/Redis setup. Do not replace local URLs with production URLs merely to match a deployed environment.
