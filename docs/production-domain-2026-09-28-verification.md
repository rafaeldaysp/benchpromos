# Production domain cutover — 28 September 2026

Final server verification passed at 15:56 UTC (12:56 São Paulo). Both repositories are deployed from `perf/live-event-capacity`: frontend `a8459df`, API `26f3a41`.

## Deployed configuration

- Website: `https://benchpromos.com.br`.
- GraphQL: `https://api.benchpromos.com.br/api`.
- Dokploy: `https://dokploy.benchpromos.com.br`.
- `www.benchpromos.com.br` redirects with HTTP 308 to the apex, preserving path and query string. Public DNS resolves through the apex to `195.201.108.222`; the public redirect no longer receives a Cloudflare challenge.
- Dokploy environments, VPS checkout public URL settings, frontend build variables, API notification links, metadata, and sitemap generation use the production origins.
- Old `test.benchpromos.com.br` and `api.test.benchpromos.com.br` app routes were deleted; direct origin checks return HTTP 404 over valid HTTPS.
- Both current deployment restoration snapshots were refreshed with production routes, environments, and images.
- Existing TLS configuration is retained. No Docker CPU or memory quotas are configured.

## Verification performed

The server script `/opt/bench-v2/deploy/domain-20260928/verify.py` checks Docker health/configuration and makes bounded HTTP/GraphQL requests. Its machine-readable report is saved beside it as `verification.json`.

| Check | Result |
|---|---|
| API replicas | 16 healthy, image `benchpromos-api:26f3a41` |
| Frontend replicas | 16 healthy, image `benchpromos-web:a8459df` |
| Scheduled worker | 0 replicas; every HTTP API has jobs disabled |
| API readiness | HTTPS 200, shared Redis cache active |
| Homepage | HTTPS 200, production Open Graph URL |
| GraphQL sale listing | HTTPS 200, no GraphQL errors, 20,746 sales |
| Application database | API processes point to restored `benchpromos` |
| NextAuth provider URLs | Production callback origin |
| robots.txt | HTTPS 200, production sitemap reference |
| Sitemap | HTTPS 200, all 2,433 URLs use production origin |
| Dokploy | HTTPS 200 |
| www origin and public route | HTTPS 308; path/query preserved; no browser challenge |
| Retired test routes | HTTPS 404 at the VPS |

The frontend production build, TypeScript and focused lint checks passed. The API build and focused lint checks passed. No customer writes, notification sends, or load tests were performed during domain verification.

The Google callback is `https://benchpromos.com.br/api/auth/callback/google`. NextAuth reports this value correctly; an interactive Google login and the external Google client's callback allowlist were not verified.

## Operational state

The restored database remains in use; no new restore or incremental synchronization was performed during this domain change. The former server was not modified. Scheduled jobs remain paused pending explicit approval to resume notifications, and deployment snapshots preserve that pause.

See [production domain configuration](production-domain.md) for environment values and [development and operations](development-and-operations.md) for local setup, caching, and deployment procedures. Historical benchmark results retain the test URLs originally measured.
