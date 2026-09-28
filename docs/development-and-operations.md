# Benchpromos: development, deployment, caching, and performance

This guide describes the work completed on 26–28 September 2026 and how to operate the resulting setup. It covers both `benchpromos` (frontend) and `api-benchpromos` (API). Commands assume sibling repository directories unless stated otherwise.

The website still uses GraphQL. The final API test passed 3,000 requests/second for one steady minute, but a cold burst of 5,000 requests still had 36 timeouts. These are API measurements on synthetic data, not proof that 5,000 complete browser visits will load quickly. On 28 September, the supplied production dump was restored and verified, followed by the production-domain cutover to this VPS. See the [restore report](database-restore-2026-09-28.md) and [domain cutover verification](production-domain-2026-09-28-verification.md). Scheduled jobs remain paused pending explicit approval to resume notifications.

## Contents

- [Deployment and architecture](#deployment-and-architecture)
- [What changed and why](#what-changed-and-why)
- [How the cache works](#how-the-cache-works)
- [Run locally for development](#run-locally-for-development)
- [Tests and measured results](#tests-and-measured-results)
- [Deploy an update](#deploy-an-update)
- [Monitoring and troubleshooting](#monitoring-and-troubleshooting)
- [Repeat VPS load tests](#repeat-vps-load-tests)
- [Database migration and remaining work](#database-migration-and-remaining-work)
- [Source and artifact map](#source-and-artifact-map)

## Deployment and architecture

### Current release

| Item | Value |
|---|---|
| Production branch, both repositories | `main` (GitHub App auto-deploy) |
| API image | `benchpromos-api:main`; deployed commit recorded in Dokploy |
| Frontend image | `benchpromos-web:main`; deployed commit recorded in Dokploy |
| SSH | `ssh v2-bench` |
| Frontend checkout | `/opt/bench-v2/benchpromos` |
| API checkout | `/opt/bench-v2/api-benchpromos` |
| Deployment files and test artifacts | `/opt/bench-v2/deploy` |
| Website | <https://benchpromos.com.br> |
| GraphQL | <https://api.benchpromos.com.br/api> |
| Dokploy | <https://dokploy.benchpromos.com.br> |

Dokploy's project is **Benchpromos**, with services `benchpromos`, `api-benchpromos`, and the application database. Its environment is named `production`, and its app routes now use the production domains. Historical performance and restore reports refer to the former test domains.

```mermaid
flowchart TD
  Browser[Browser] --> Proxy[Traefik: HTTPS and routing]
  Proxy --> Web[16 Next.js processes]
  Proxy --> API[16 NestJS API processes]
  Web --> API
  API --> Local[Local cache in each API process]
  API --> Redis[Shared Redis cache]
  API --> DB[(Application PostgreSQL 15)]
  Worker[Scheduled worker: paused pending approval] -.-> DB
  Migration[One migration task per deployment] --> DB
```

The arrows show logical dependencies; the frontend reaches the configured API URL. Traefik routes web/API requests. Redis and the worker have no public route or published host port. A separate PostgreSQL 16 service stores Dokploy's own state; it is not the application database.

The VPS has 24 physical cores / 48 threads and approximately 125.8 GiB usable RAM. Its active network interface reports 1 Gbit/s. Measured software versions: Docker 29.8.1, Dokploy 0.30.7, Traefik 3.6.25, Node 22 in application images, PostgreSQL 15 for application data, and Redis 7.4 Alpine.

No Docker CPU or memory quotas are configured. The API uses three PostgreSQL connections per HTTP process and the worker is configured for four when enabled: 48 HTTP-process connections while it is paused, or a nominal budget of 52 when running, leaving room below PostgreSQL's 100-connection ceiling for migrations, monitoring, and administration. Connection pools, cache sizes, and work queues control contention; they are not container CPU/RAM caps.

Dokploy was installed and configured for the existing domains, HTTPS, separate application services, a persistent local application database, health checks, non-root application containers, and restart/logging policies. The existing TLS configuration was retained. The proposed certificate change and proxy JSON compression were not applied.

### Configuration ownership

Production deployments use each repository's **`docker-compose.production.yml` on `main`**, through Dokploy's GitHub App. See [automatic deployment](automatic-deployment.md). The original development Compose files do not reproduce this topology.

- API build: the repository's `Dockerfile` (Node 22).
- Frontend build: the repository's `Dockerfile.production`, preserving the deployed Node 22 standalone build.
- Frontend build environment: BuildKit secret `web_env`, plus explicit `NEXT_PUBLIC_*` build arguments. Environment files are excluded from the build context and standalone runtime image.
- Runtime environments and domains: managed in Dokploy. Editing a VPS checkout's `.env` alone does **not** update the deployed environment.
- Each push to `main` triggers Dokploy to clone and build that repository. The checkouts under `/opt/bench-v2` are reference copies, not the build source.
- Existing private server files and the read-only `/opt/bench-v2` mount remain available for historical tools and recovery records.

The initial `/opt/bench-v2/deploy/README.md` describes the original single-API setup. Its replica counts and API Dockerfile information were superseded by this guide and the phase-2 deployment.

## What changed and why

| Area | Problem found | Implemented solution |
|---|---|---|
| Giveaway entry | Loading thousands of participant profiles to check one account/IP | Indexed existence checks, transaction-scoped account/IP locks, and a final giveaway row lock; eligibility still reads live database state |
| Sales | Loading unnecessary relations and doing expensive work for every request | Select ordered page IDs first, then load that page's relations and comment counts; avoid the category join when there is no category filter |
| Reactions | User-profile overfetching | Keep lightweight reaction records; resolve legacy user-profile/grouping fields only when requested |
| Category ranks | Loading matching sales into JavaScript to count them | Aggregate counts in PostgreSQL, then fetch category metadata |
| Comments | Unbounded lists and nested replies on busy sales | Default 20-row pages, on-demand replies, stable ordering, bounded loading placeholders, and Apollo pagination handling |
| Background prices | Full-catalogue scans and excessive concurrent notification work | Batches of 100 products, bounded notification work, atomic daily-minimum upserts, and a process-local overlap guard |
| Scheduling | Scaling API containers would duplicate cron jobs | One separate worker; HTTP API processes use `RUN_PRODUCT_JOBS=false` |
| Database access | Missing indexes for the new access patterns | Ten indexes in migration `20260927000000_live_event_query_indexes` |
| Repeated public reads | Identical visitors repeatedly execute the same database queries | Five-second local/shared Redis caches, coordinated fills, and admin invalidation |
| GraphQL execution | Field execution remained expensive even with cached query data | Cache completed, explicitly approved public GraphQL responses through Apollo's plugin lifecycle |
| Cache reuse | Each browser sent its own millisecond `minDt` cutoff | Stable `recentDays: 30` parameter, with the cutoff computed during a cache fill |
| Homepage requests | Feed and category ranks loaded separately | One `GetSalesFeed` operation; reusable sale-card fragment; smaller product-page query retained |
| Authentication during SSR | Repeated session lookups within one render | Request-local React `cache` deduplication, without caching sessions across users |

The frontend retains GraphQL, existing reaction records, and personalized controls. Public GET routes were added but the homepage was **not** migrated to them.

### API contract details

GraphQL `sales` defaults to 12 results and allows a maximum page size of 100 and page number of 1,000. Comments default to 20, with page sizes from 1 to 100. Older callers that relied on an omitted pagination argument returning the entire catalogue must paginate.

`sales` and `salesCategoryRank` accept `recentDays` from 1 to 365. It is mutually exclusive with `minDt`; explicit date filters retain their exact meaning. Prefer the stable relative window for the public feed.

Public GET endpoints:

| Endpoint | Purpose |
|---|---|
| `/v1/public/home` | First sales page and category ranks |
| `/v1/public/sales` | Filtered/paginated sales |
| `/v1/public/sales/:id` | Public sale detail |

GET listing parameters include `page`, `limit`, `categories` (comma-separated slugs), `search`, `showExpired`, `since`, `productSlug`, and `retailerId`. The GET page-size maximum is 50, default 12; its default window is 30 days. These DTOs return aggregate reactions, not the individual reaction records returned by the current GraphQL feed.

## How the cache works

### Read path

1. A reviewed public read builds a key from its scope and arguments. The namespace includes database identity and a cache-contract version.
2. The API reads the shared Redis generation. This is a version number that changes after relevant writes.
3. If its local entry matches that generation and has not expired, the API returns a deserialized copy.
4. Otherwise, it checks Redis. A shared hit can populate the local cache while retaining the original expiry.
5. On a miss, identical requests in one process share a pending fill. A conditional Redis lease coordinates fills across processes.
6. The owning request reads the database. Publication checks both lease ownership and generation, preventing a fill that began before an admin update from repopulating the current cache.

Entries expire at most **five seconds from the start of their database read**, not five seconds after each copy between cache layers. Cached values use Node's V8 serializer to preserve Dates. Keep all API replicas on the same Node major and cache contract; incompatible cached values are rejected.

### Complete GraphQL response caching

`public-graphql-cache.plugin.ts` runs after Apollo validates the query. It only accepts the explicit public type/field allowlist under `sales` and `salesCategoryRank`. The response key also includes the query hash, operation name, and variables.

Aliases, fragments, `__typename`, and standard `@include`/`@skip` directives are supported. Private relations, mutations, other query roots, introspection, batched requests, and multiple-operation documents bypass this complete-response cache. An authenticated caller can share a response only when the selected data is entirely public; authentication or viewer-specific results are not put in this shared response cache.

On a miss, execution goes through the normal Apollo/Nest pipeline. A server-only context marker tells the public feed resolvers to read fresh data instead of stacking another five-second resolver-cache TTL underneath the response cache. Errors and request-specific extensions/headers are not cached. A stalled owner releases its fill after 4.5 seconds.

This cache reduces repeated GraphQL field execution. It does not remove JSON payload size, TLS work, browser processing, or network transfer.

### Admin writes and freshness

Two hooks protect the actual dashboard mutation paths:

- Prisma middleware invalidates after successful autocommit writes to catalogue models, before later notifications can fail.
- A GraphQL mutation interceptor invalidates at completion or error for the covered admin operations, including transactions and partially completed mutations.

Create, edit, expire, reopen, highlight, and delete were tested through actual sale admin mutations. With healthy Redis, subsequent reads on every API process observe the new generation. Already-running requests are not retroactively cancelled, but an older fill cannot publish into the new generation.

Covered models include sales, categories, coupons, cashback, discounts, retailers, products, filters/options, subcategories, giveaways, and giveaway rules. Product view-counter-only writes do not invalidate the catalogue. Reaction and participant counts can lag up to five seconds; giveaway eligibility, login, and writes continue to use live database state.

When adding a new public model or mutation, check both `PrismaService`'s model set and `AdminCacheInterceptor`'s operation matching. A new transaction path outside these hooks must explicitly invalidate **after commit**. Raw SQL/direct database changes bypass these hooks and normally appear after the existing cache entries expire. The separate worker has no Redis connection in the current deployment, so its database changes rely on that same expiry bound.

### Failure behavior and budgets

| Setting | Current behavior |
|---|---|
| Public TTL | Maximum 5 seconds |
| Local cache, per API process | Up to 512 entries / 32 MiB of serialized values |
| Shared value size | Values over 2 MiB are not retained in Redis |
| Distinct fills, per process | 4 active, 32 queued; 1.5-second queue wait |
| In-flight key map | Maximum 128 keys |
| Redis timing | 150 ms command timeout, 500 ms connection timeout; offline queue disabled |
| Redis unavailable | Bounded local cache and per-process fill sharing; no expired values served |
| Too many distinct misses | Overload error instead of an unlimited database backlog |

These cache/queue defaults are code-level options in `PublicReadCache`, not new `.env` knobs. REST can return HTTP 503 on overload; GraphQL clients must inspect the `errors` array rather than treating HTTP 200 as success.

During a Redis outage, immediate cross-process invalidation is unavailable, so public reads can retain their existing values for the remaining five-second TTL. Redis is disposable cache storage: no persistence is configured on the VPS, and PostgreSQL remains the source of truth.

GET responses use ETags with `max-age=0, must-revalidate`; conditional requests still check the shared generation. GraphQL response-cache hits use `no-store`. Neither policy adds a second browser/CDN freshness window. Apollo's normalized client cache is separate and still needs the existing mutation/UI updates.

## Run locally for development

### 1. Prerequisites and repository layout

Use Node **22** to match the deployed images, npm with the existing lockfiles, Docker Engine/Desktop with Compose v2, and Git. Focused API tests also passed on Node 20. The existing JWT dependency failed on the local Node 25 runtime, so do not use that runtime for this setup without addressing that compatibility issue.

```text
your-workspace/
  api-benchpromos/
  benchpromos/
```

Use `perf/live-event-capacity` in both repositories, preserving any unrelated local changes. Install dependencies in each:

```sh
# From your-workspace/
cd api-benchpromos
npm ci
npx prisma generate
cd ../benchpromos
npm ci
```

### 2. Start development PostgreSQL and Redis

From `benchpromos`:

```sh
docker compose -f docs/local-development.compose.yml up -d --wait
```

The [development Compose file](local-development.compose.yml) starts infrastructure only; Node processes run on your host with hot reload.

| Service | Local endpoint | Data |
|---|---|---|
| PostgreSQL | `127.0.0.1:55440`, database `benchpromos_dev` | Persistent named Docker volume |
| Redis | `127.0.0.1:56380`, logical DB `0` | Disposable cache |
| API, started below | `http://localhost:3333` | Host Node process |
| Frontend, started below | `http://localhost:3000` | Host Node process |

Both infrastructure ports bind to loopback only. The development credentials below are local examples, not server credentials. These ports differ from the integration-test ports so both environments can coexist.

### 3. API environment and migrations

In `api-benchpromos`, create a local `.env` using the following values. Merge with an existing development file rather than overwriting it. Use a fully expanded `DATABASE_URL`; this example does not depend on interpolation between environment variables.

```dotenv
NODE_ENV=development
APP_URL=http://localhost:3000
API_PORT=3333
DATABASE_URL=postgresql://bench_dev:local_development_only@127.0.0.1:55440/benchpromos_dev?schema=public&connection_limit=5&pool_timeout=3
REDIS_URL=redis://127.0.0.1:56380/0
RUN_PRODUCT_JOBS=false

API_KEY=local-development-api-key
JWT_SECRET=replace-with-a-generated-local-secret
PUBLIC_VAPID_KEY=replace-with-generated-public-vapid-key
PRIVATE_VAPID_KEY=replace-with-generated-private-vapid-key

# Optional feature integrations; these do not start an object-storage service.
S3_REGION=us-east-1
S3_ENDPOINT=http://127.0.0.1:9000
S3_BUCKET=benchpromos-dev
MINIO_ROOT_USER=local-development-user
MINIO_ROOT_PASSWORD=local-development-password
```

Generate a local JWT secret and a valid VAPID pair from that repository:

```sh
node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))'
node -e 'console.log(require("web-push").generateVAPIDKeys())'
```

Copy `publicKey`/`privateKey` into their matching variables. Valid VAPID keys are needed even if you are not testing notifications, because the API validates them during startup. Keep `.env` out of Git. Do not copy live notification credentials into a synthetic development environment.

Apply the existing schema and start the API:

```sh
npx prisma migrate deploy
node --env-file=.env node_modules/@nestjs/cli/bin/nest.js start --watch
```

The explicit `--env-file` loads values before module imports, including JWT, VAPID, and the job-enable flag. If your shell already exports those values, `npm run start:dev` is equivalent for starting Nest. Exported shell variables take precedence over Node's env file: check that no old `DATABASE_URL`, `REDIS_URL`, or `RUN_PRODUCT_JOBS` is overriding the local values.

For a new schema change, use `npx prisma migrate dev --name meaningful_name` only against this development database. Use `migrate deploy` for existing migrations and deployed environments. A fresh local database contains no production users or sales. `npx prisma studio` can inspect/populate development records; keep real customer data out of fixtures.

### 4. Frontend environment

In `benchpromos`, create `.env.local` with the following baseline. Replace placeholders with local development values. The frontend validates these fields in `src/env.mjs`; several integration values must be nonempty even when you are only browsing the sale feed.

```dotenv
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-another-generated-local-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3333/api
NEXT_PUBLIC_API_KEY=local-development-api-key

GOOGLE_CLIENT_ID=local-placeholder
GOOGLE_CLIENT_SECRET=local-placeholder
NOTION_DATABASE_ID=local-placeholder
NOTION_TOKEN=local-placeholder
NEXT_PUBLIC_GTAG=local-placeholder
NEXT_PUBLIC_GTM=local-placeholder
NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT=local-placeholder
```

`NEXT_PUBLIC_API_KEY` must match the API's `API_KEY`. `NEXT_PUBLIC_API_URL` includes **`/api`**, the GraphQL endpoint. `NEXT_PUBLIC_*` values are visible in browser code; the existing API-key mechanism is not a private browser secret.

Placeholders allow environment validation, but do not make Google login, Notion content, analytics, or advertising work. To test Google sign-in, use a development OAuth client with `http://localhost:3000/api/auth/callback/google` registered. Email flows require development Mailtrap settings on the API. Uploads require a working development S3-compatible endpoint. Telegram/Discord/WhatsApp settings are optional; omit them when those integrations are not under test.

Start the frontend in another terminal:

```sh
npm run dev
```

Open `http://localhost:3000`. An empty feed is expected until you create local sales/categories. This minimal infrastructure setup does not provision OAuth, mail, object storage, or external messaging services.

### 5. Check local health and caching

```sh
curl -fsS http://localhost:3333/health/ready
curl -fsS http://localhost:3333/v1/public/home
curl -fsS http://localhost:3333/api \
  -H 'content-type: application/json' \
  --data '{"query":"query { sales(recentDays:30,paginationInput:{page:1,limit:12}) { count list { id title price } } salesCategoryRank(recentDays:30) { name slug } }"}'
curl -fsS http://localhost:3333/internal/public-cache \
  -H 'api-key: local-development-api-key'
```

Readiness should report `publicCache: "shared"` with Redis running. Repeat a public read and inspect `localHits`, `sharedHits`, `loads`, and `coalesced`. These counters belong to one API process and reset when it restarts.

To observe fallback locally, stop only the development Redis service, repeat the requests, then restart it:

```sh
# From benchpromos/
docker compose -f docs/local-development.compose.yml stop redis
# Run the health/read requests above.
docker compose -f docs/local-development.compose.yml start redis
```

The API can also run with `REDIS_URL` omitted for local-only caching, but that does not exercise cross-process invalidation.

### 6. Optional scheduled worker and shutdown

Keep `RUN_PRODUCT_JOBS=false` on the API. If you need to develop scheduled price work, start exactly one worker in a separate terminal from `api-benchpromos`:

```sh
npm run build
node --env-file=.env dist/worker
```

The worker entry point enables jobs itself and exposes no HTTP port. Rebuild/restart it after worker-source changes. It writes `/tmp/bench-worker-heartbeat` every ten seconds. Only run it against development data and integrations intended for testing.

Stop Node processes with Ctrl-C. To stop development infrastructure while keeping PostgreSQL data:

```sh
# From benchpromos/
docker compose -f docs/local-development.compose.yml down
```

Adding `--volumes` would delete the development database volume. It is not part of the normal shutdown command.

## Tests and measured results

### Tools used

| Tool | Role |
|---|---|
| Git / SSH | Versioned both repositories, updated VPS checkouts, and ran controlled operations |
| Dokploy, Docker/Compose, BuildKit | Build images, run migrations, deploy replicas, inject build secrets, inspect health/resources |
| PostgreSQL / Prisma | Schema migrations, query changes, indexes, transactional correctness, and synthetic fixtures |
| Redis / ioredis | Shared public cache, generation invalidation, and coordinated fills |
| Jest / Nest testing / Supertest | Unit tests and real HTTP integration tests with independent API instances |
| Apollo / GraphQL validation | Test plugin lifecycle and validate actual frontend documents against the API schema |
| TypeScript / ESLint / Next and Nest builds | Check source types, formatting/lint, and production compilation |
| Grafana k6 1.6.0 | HTTP arrival-rate workloads, cold bursts, body validation, latency/failure/drop measurements |
| Python orchestration scripts | Guard the target database, collect telemetry, run probes, and summarize results |
| `docker stats`, `/proc`, PostgreSQL statistics | Sample host/container CPU, available memory, connections, activity, and database contention |
| `curl` and HTTP health checks | Verify public routes and restored deployment health |

### Automated correctness checks

Across the API work, **80 focused unit tests and 22 PostgreSQL/Redis integration cases passed**: 102 distinct cases across runs. Coverage includes concurrent giveaway entry and eligibility, atomic daily price minima, pagination, cache expiry and bounds, Redis failure, GraphQL validation/error isolation, and admin invalidation races.

The GraphQL plugin tests use Apollo's actual lifecycle: 500 concurrent identical requests share one execution. An integration case makes 40 HTTP requests across two independent Nest applications sharing Redis and verifies one field execution. These are correctness/concurrency checks, not substitutes for HTTP capacity measurements.

Frontend TypeScript, focused lint, production build, and comment/Apollo regressions passed. Both query documents, including the fragment and Apollo's added `__typename` fields, validate against the API schema.

Run the focused API unit suites from `api-benchpromos`:

```sh
npm test -- --runInBand \
  public-read \
  giveaways/giveaways.service.spec \
  modules/sale/sale.service.spec \
  modules/sale/sale.resolver.spec \
  modules/product/product.service.perf.spec \
  modules/cronjobs/cronjobs.service.spec \
  prisma/prisma.service.spec \
  config/graphql/scalars/date-scalar.spec
npm run build
```

For the integration suites, use their **separate disposable database**, not the persistent development database:

```sh
docker compose -f test/performance.compose.yml up -d --wait
DATABASE_URL=postgresql://bench_performance:local_performance_only@127.0.0.1:55439/bench_performance_tests \
  npx prisma migrate deploy
PERFORMANCE_TEST_DATABASE_URL=postgresql://bench_performance:local_performance_only@127.0.0.1:55439/bench_performance_tests \
PERFORMANCE_TEST_REDIS_URL=redis://127.0.0.1:56379/15 \
  npm test -- --runInBand performance
docker compose -f test/performance.compose.yml down
```

The suite validates these exact localhost ports/database names and resets fixture tables. Its PostgreSQL storage is temporary. Do not change the guards to point at application data. Without the explicit test environment variables, integration tests skip; a skipped suite is not evidence of a pass.

From `benchpromos`:

```sh
node --test tests/comments-performance.test.cjs
npx tsc --noEmit
npx next lint \
  --file src/queries/index.ts \
  --file src/components/sales/sales.tsx \
  --file src/components/sales/sales-nav-simplified.tsx
```

The existing local `tests/giveaways.test.cjs` also passed during this work, but is not part of the committed performance change. Repository-wide legacy placeholder tests were not all repaired, so the statement above is about the focused suites, not a claim that every existing test passes.

### VPS load-test method

We used the isolated local database `benchpromos_perf_20260926`, not the original external production database. Synthetic fixtures included 30,000 users, 50,000 sales, 100,000 comments, 60,000 reactions, 3,000 products, 6,000 deals, 270,000 history rows, and 200 giveaways. The featured giveaway started with 10,000 participants. Synthetic JWT/session tokens supported authenticated tests; no real customer sessions were used.

k6 ran in a Docker container on the VPS and resolved the public domains to loopback. Requests still passed through HTTPS and Traefik. Earlier phases exercised page/SSR journeys, sale queries, filters, and giveaway writes; final tests focused on the exact combined homepage GraphQL query. Response validation checked GraphQL errors and expected fixture content, not just HTTP status.

Sustained tests used an arrival-rate executor. The final ones ramped for ten seconds and then measured a 30- or 60-second steady interval. The cold burst cleared Redis, waited six seconds for local entries to expire, and started 5,000 virtual users with one request each. Requests had a five-second deadline.

Normal targets: less than 1% failures, p95 below 500 ms, p99 below 1 second, and zero dropped iterations. Burst targets: p95 below 2 seconds and p99 below 5 seconds. `api_ms` includes connection/TLS setup and JSON validation. Unscheduled arrivals count as drops even when all delivered requests succeed.

| Final workload | Steady interval / burst | Successes | Failures | Drops | p95 |
|---|---|---:|---:|---:|---:|
| GraphQL, 2,000 requests/s | 60 seconds | 120,001 | 0 | 0 | 38 ms |
| GraphQL, 3,000 requests/s | 60 seconds | 180,003 | 0 | 0 | 71 ms |
| GraphQL, 5,000 cold concurrent requests | One burst | 4,964 | 36 | 0 | 4,932 ms |
| GraphQL, Redis stopped, 1,000 requests/s | 30 seconds | 30,000 | 0 | 0 | 15 ms |

The sustained and outage tests passed; the cold burst failed its latency targets. At 3,000/s, sampled whole-host CPU averaged 72.7%, including the generator, and available RAM remained above 116.5 GiB. TLS handshaking alone reached 4.27 seconds p95 in the final cold burst. Database CPU was low during cached reads.

The synthetic feed transferred about 60.8 kB per request in k6. At 3,000/s that is approximately 182 MB/s, beyond a nominal 1 Gbit/s link's 125 MB/s rate. Loopback bypassed that physical limit. The measured processing rate is therefore **not** a claim of 3,000 requests/s over the public interface.

Admin create/edit/expire/reopen-highlight/delete were also exercised on the VPS fixture database. Immediately after each mutation, both REST and GraphQL were checked on all 16 API processes; all checks passed. Checking both protocols across all replicas took approximately 378–491 ms per mutation. The test sale was deleted afterward.

These short runs did not measure a full browser's JavaScript, images, fonts, ads, rendering, or Web Vitals; they did not exercise the external network or a long soak. The initial mixed full-site burst failed, and the improved API results do not replace that finding. Detailed results, including failed experiments, are in the [phase-2 report](../performance/phase2-20260927/REPORT.md).

## Deploy an update

### Routine deployment through Dokploy

1. Test changes on a feature branch, merge into `main`, and push. Dokploy's GitHub App triggers the corresponding repository's deployment.
2. For a coordinated API/frontend release, push the backward-compatible API first and wait for its deployment and health checks before pushing the frontend. These pipelines are independent.
3. Inspect the commit and logs in Dokploy. The API Compose runs `prisma migrate deploy` before HTTP processes start. Do not bypass a failed migration.
4. Verify 16 healthy API replicas, 16 healthy frontend replicas, the public homepage, and API readiness. Jobs remain paused with `WORKER_REPLICAS=0`.
5. Changes to Dokploy environment values require a manual **Deploy** after saving. Frontend public variables require a rebuild.

The [automatic deployment guide](automatic-deployment.md) describes source settings, Compose ownership, secrets, and rollback. Image tags now use `:main`; identify deployed revisions through Dokploy's deployment records.

The index migration has already been applied to the restored database. Future migrations may block writes or require a compatibility window. Current Compose redeploys are not a demonstrated zero-downtime rolling-release mechanism.

### Existing scripted release helpers (historical)

**Do not use these for routine deployments.** They predate the GitHub integration and manipulate raw Compose definitions or historical image tags. The commands below document the original manual deployment and benchmark workflow; use the automatic deployment guide for the current system.

The following helpers are installed on this VPS and use private Dokploy credentials internally. They depend on the current Compose IDs and saved configuration; they are not a portable Dokploy installer.

Find the current Dokploy container on the VPS instead of hardcoding a changing container ID:

```sh
BENCH_DOKPLOY_CONTAINER=$(docker ps \
  --filter label=com.docker.swarm.service.name=dokploy \
  --format '{{.ID}}')
test -n "$BENCH_DOKPLOY_CONTAINER"
BENCH_API_TAG=$(git -C /opt/bench-v2/api-benchpromos rev-parse --short HEAD)
BENCH_WEB_TAG=$(git -C /opt/bench-v2/benchpromos rev-parse --short HEAD)
```

After confirming these are the intended checked-out commits, the API release helper updates the API/migration/worker images, preserves supported replica counts including a paused worker, and records the configuration used to restore the application after tests:

```sh
docker exec "$BENCH_DOKPLOY_CONTAINER" node \
  /opt/bench-v2/deploy/performance/phase2-20260927/deploy.cjs release "$BENCH_API_TAG"
docker exec "$BENCH_DOKPLOY_CONTAINER" node \
  /opt/bench-v2/deploy/performance/phase2-20260927/deploy.cjs status
```

The helper requires the original local `/benchpromos` database and supports the existing 8/16/24 API configurations. `status` must report `done` before considering the deployment complete; also check container health.

For the frontend:

```sh
docker exec "$BENCH_DOKPLOY_CONTAINER" node \
  /opt/bench-v2/deploy/performance/phase1-20260927/admin.cjs release web "$BENCH_WEB_TAG"
docker exec "$BENCH_DOKPLOY_CONTAINER" node \
  /opt/bench-v2/deploy/performance/phase1-20260927/admin.cjs status
# After deployment is done and the web containers are healthy:
docker exec "$BENCH_DOKPLOY_CONTAINER" node \
  /opt/bench-v2/deploy/performance/phase1-20260927/admin.cjs accept-release web "$BENCH_WEB_TAG"
```

The `accept-release` step updates the saved frontend restoration tag. Do not use the old phase-1 API `switch`, `restore`, or `pool` operations for the current API architecture: they can reapply obsolete settings. Use the phase-2 API helper instead.

If you edit deployment configuration through the UI, reconcile the saved phase-2 release snapshot before later using test/restore helpers. Otherwise they may restore older environment/configuration values. Snapshots live privately under `/etc/dokploy/bench-api-phase2`; do not commit them.

### Post-deployment checks and rollback

```sh
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
curl -fsS https://api.benchpromos.com.br/health/ready
curl -fsS https://api.benchpromos.com.br/v1/public/home
curl -fsS -o /dev/null https://benchpromos.com.br
curl -fsS https://benchpromos.com.br/api/auth/providers
```

Verify sale pagination and, when fixture/authentication data is available, reactions, comment replies, admin edits, and giveaway entry. Verify that the API uses the intended application database rather than the performance database. API readiness alone does not prove that every replica or user flow works.

For a code rollback, identify the previous compatible API/frontend commits and either redeploy their retained images with build/pull behavior understood, or check out those exact commits and rebuild with matching tags. Do not label new source with an old image tag. Keep migrations and data intact unless a separate database recovery plan calls for a restore; a code rollback does not undo schema migrations. Roll back the frontend too if it uses a field the older API does not support.

## Monitoring and troubleshooting

| Check | Meaning / action |
|---|---|
| `GET /health/live` | HTTP process is alive |
| `GET /health/ready` | Runs `SELECT 1`; database failure gives 503; reports `shared` or `local-fallback` caching |
| `GET /internal/public-cache` with `api-key` | Per-process counters and cache state; inspect `loads`, hits, `rejected`, and `redisErrors` |
| Worker heartbeat | When enabled, `/tmp/bench-worker-heartbeat` should be newer than 30 seconds; the worker is currently paused |
| `docker stats --no-stream` | CPU/memory consumption by API, web, Redis, worker, database, and Traefik |
| Dokploy deployment logs | Build/migration failures and container startup |
| PostgreSQL activity | Connections, active queries, locks, and pool exhaustion |

Examples on the VPS:

```sh
docker logs --tail 100 api-benchpromos-1nnckt-api-1
docker logs --tail 100 api-benchpromos-1nnckt-worker-1
docker logs --tail 100 benchpromos-mixr3g-web-1
docker stats --no-stream
docker exec api-benchpromos-1nnckt-redis-1 redis-cli ping
```

The Redis container already sets `REDISCLI_AUTH`; do not print its environment to retrieve the password. Cache statistics read through the load balancer can come from different processes, so compare the same container when investigating counter changes.

- **Invalid VAPID startup error:** generate a real development pair and load the environment before importing the API entry point.
- **Frontend environment validation fails:** fill all required fields in `src/env.mjs`; omit unused optional fields instead of setting them to empty strings.
- **API is ready but reports `local-fallback`:** check Redis health, URL/network/authentication, and timeout counters. HTTP 200 is expected during cache fallback.
- **A sale stays stale for longer than five seconds:** distinguish server response data from Apollo's browser cache, confirm the write path invalidates after commit, and check that all replicas use the same database/namespace. Do not solve this by indiscriminately caching authenticated responses.
- **High-cardinality requests are rejected:** inspect exact-date/search/filter variability and fill admission. Adding RAM or connections alone does not remove distinct query work.
- **Duplicate notifications/jobs:** keep this VPS's worker at zero replicas until the owner explicitly approves resuming notifications and scheduling on the former server has been addressed; when enabled, run at most one worker and keep every HTTP API process on `RUN_PRODUCT_JOBS=false`.
- **Pool timeouts:** total the pools across all API/worker processes before increasing any one pool.
- **Local integration tests skip:** set both `PERFORMANCE_TEST_*` variables for the cache suite and use its exact disposable ports.
- **API tests fail on Node 25:** use the documented Node 20/22 runtime while the legacy JWT dependency remains unchanged.

Do not use `FLUSHDB` on an arbitrary Redis service as a routine fix. The burst harness did it only for the dedicated cache while serving the isolated fixture database. Restarting Redis empties the disposable shared cache but is not a database recovery operation.

## Repeat VPS load tests

**The commands below predate GitHub-based deployment.** Adapt the harness to an isolated service/database and the current Git source before use; do not let historical raw-Compose restoration commands overwrite the production GitHub configuration.

The harness is installed at `/opt/bench-v2/deploy/performance/phase2-20260927`. Copies also exist in this workspace's `performance/` directory; these artifacts should not be assumed to arrive with a fresh clone unless deliberately versioned or transferred.

| File | Purpose |
|---|---|
| `deploy.cjs` | API release, controlled fixture-database switch, and application restoration |
| `verify.py` | Check expected images, replicas, database, HTTP health, and absence of Docker CPU/RAM quotas |
| `load.js` | k6 queries, workload executors, validation, and thresholds |
| `run.py` | Require the local fixture database, start one generator, collect telemetry, and write results |
| `admin-probe.py` | Exercise admin sale mutations and verify REST/GraphQL on all replicas |
| `prepare.py`, `tokens-*.cjs` | Refresh private synthetic authentication and reset only isolated test memberships |
| `final-tests.sh` | Final sustained/burst/outage sequence with an EXIT restoration handler |
| `summarize.py` | Derive summary tables and `results/analysis.json` |

These scripts deliberately pin release tags, database identity, and expected replica counts. Before testing a future release, update/review those expectations and regenerate the exact frontend query used by `graphql-combined-feed`. `verify.py` still expects the former empty application dataset and one active worker. It is now historical and must be revised for the restored data and paused worker before using this harness. Do not run `final-tests.sh` unchanged. The restore report contains the current database verification.

Switching the API to fixtures changes what the shared test website serves. Only do this during a controlled test window. Never change the harness to load-test the external production database.

On the VPS, after defining `BENCH_DOKPLOY_CONTAINER` as above:

```sh
docker exec "$BENCH_DOKPLOY_CONTAINER" node \
  /opt/bench-v2/deploy/performance/phase2-20260927/deploy.cjs test-db
# Wait for Dokploy to finish and all API/worker containers to become healthy.
python3 /opt/bench-v2/deploy/performance/phase2-20260927/verify.py --test-db

python3 /opt/bench-v2/deploy/performance/phase2-20260927/run.py \
  rerun-combined-2000 MODE=graphql-combined-feed RATE=2000 \
  DURATION=60s PREALLOC=1000 MAXVUS=2500 WARMUP=true

docker exec "$BENCH_DOKPLOY_CONTAINER" node \
  /opt/bench-v2/deploy/performance/phase2-20260927/deploy.cjs restore-db
# Wait for deployment/health again, then verify the application database.
python3 /opt/bench-v2/deploy/performance/phase2-20260927/verify.py
```

Always run restoration even if a benchmark fails or is interrupted. `final-tests.sh` automates the final four scenarios and restores on normal shell exit; an EXIT handler is not protection against a killed host or every possible process failure, so verify restoration afterward. Do not run multiple load generators simultaneously. Refresh synthetic tokens with `prepare.py` before authenticated entry tests; token files stay private on the VPS.

`run.py` records k6's return code in `<label>.meta.json`; its own Python exit code does not necessarily propagate failed k6 thresholds. Inspect metadata and summary JSON. A k6 threshold return code of 99 is a failed test. A low latency result with dropped iterations is not a pass at the requested offered load.

The final steady counters count requests started after the ten-second ramp. Their exported `rate` uses the whole run duration, so calculate steady throughput from the steady count divided by the steady interval. Keep cold-start failures alongside warm results instead of replacing them.

For external testing, run a suitably provisioned generator on a separate host with normal public DNS; setting a label alone does not make an on-VPS test external. The harness has an `EXTERNAL` option to remove its loopback hostname override, but that option by itself does not relocate the generator. Full browser journeys and a longer soak remain separate work.

## Database migration and remaining work

The local application database is `benchpromos` on the private Docker hostname `benchpromos-postgres-pqols1`, port 5432. Its persistent volume is `benchpromos-postgres-pqols1-data`. After the 28 September dump restore it contains 62,395 users, 20,746 sales, 187 giveaways, and all other source tables. The original empty application database was retained as `benchpromos_before_restore_20260928`, with connections disabled. Fixtures remain in the separate `benchpromos_perf_20260926` database.

The supplied dump is now served through the production domains on this VPS. The original server was not contacted or modified. No incremental synchronization after the supplied dump was performed. Any later database replacement must account for new writes on this VPS. For a future restore:

1. Identify source PostgreSQL version, schema/migration state, extensions, and a consistent backup method.
2. Take a backup and prove it can restore into a separate database; preserve the current target as a rollback point.
3. Plan a maintenance/cutover window and stop target API writes and scheduled jobs while replacing target data.
4. Restore into a clean target, verify migration history, then apply the compatible outstanding Prisma migrations.
5. Check counts, representative sales/users/giveaways, indexes, and application behavior; validate backup/recovery before directing real traffic there.

Object-storage files live on the existing external storage configuration and are not included in a PostgreSQL dump. Automated off-server application backups were not configured as part of this work. The production Google callback is configured and verified through NextAuth's provider endpoint; a real-user Google login was not performed.

The remaining capacity work is external traffic measurement, representative data, complete browser/homepage journeys, and a longer mixed read/write soak. Current bottlenecks include cold connection/TLS cost and response bandwidth. Changes to TLS, proxy compression, frontend/API contracts, or infrastructure require the owner's agreement; those proposed changes were not silently applied.

## Source and artifact map

Paths in the API column are relative to the sibling `api-benchpromos` repository.

| Area | Source |
|---|---|
| Cache implementation | API `src/public-read/public-read-cache.service.ts` |
| GraphQL response cache | API `src/public-read/public-graphql-cache.plugin.ts` |
| Admin invalidation | API `src/public-read/admin-cache.interceptor.ts`, `src/prisma/prisma.service.ts` |
| Public GET DTOs/routes | API `src/public-read/public-sales.controller.ts` |
| Health/cache counters | API `src/public-read/api-health.controller.ts` |
| Sales and category queries | API `src/modules/sale/sale.service.ts`, `sale.resolver.ts` |
| Giveaway transactions | API `src/giveaways/giveaways.service.ts` |
| Price work / worker | API `src/modules/cronjobs/cronjobs.service.ts`, `src/modules/product/product.service.ts`, `src/worker.ts` |
| Index migration | API `prisma/migrations/20260927000000_live_event_query_indexes/migration.sql` |
| Integration infrastructure | API `test/performance.compose.yml` |
| Combined frontend query | Frontend `src/queries/index.ts`, `src/components/sales/sales.tsx`, `sales-nav-simplified.tsx` |
| Comment pagination | Frontend `src/hooks/use-comments.ts`, `src/components/sales/comments.tsx` |
| Request-local session deduplication | Frontend `src/lib/server-session.ts` |
| Local development infrastructure | Frontend `docs/local-development.compose.yml` |
| Final benchmark report | `performance/phase2-20260927/REPORT.md` |
| Final raw measurements | `performance/phase2-20260927/results/` locally and under the VPS deployment directory |

Additional implementation notes: frontend [phase 1](performance-phase-1.md) and [phase 2](performance-phase-2.md), and the corresponding files in the API's `docs/` directory. Older notes describe their individual rollout stage; this guide describes the final combined deployment.
