# Automatic deployment from main

Both `rafaeldaysp/benchpromos` and `rafaeldaysp/api-benchpromos` deploy through the existing Dokploy GitHub App. Their production source branch is `main`, their trigger is a GitHub push, and their Compose path is `./docker-compose.production.yml`. Merging a pull request into `main` also generates a push event.

Dokploy clones the repository for each build. The checkouts under `/opt/bench-v2` are reference copies, not the deployment source. GitHub App credentials and runtime/build secrets remain in Dokploy; no webhook token or production credential belongs in Git.

## Deploy a change

1. Develop and test on a feature branch, then merge into `main` and push.
2. Watch the corresponding service's **Deployments** tab at `https://dokploy.benchpromos.com.br`. Confirm that its commit matches the pushed revision and its deployment succeeds.
3. Verify container health, `https://api.benchpromos.com.br/health/ready`, and `https://benchpromos.com.br`.

For coordinated API/frontend changes, deploy a backward-compatible API first and wait for it to become healthy before merging the frontend change. These are independent pipelines; pushing both repositories does not enforce ordering. Compose rebuilds are not guaranteed zero-downtime rolling deployments.

The production images are `benchpromos-api:main` and `benchpromos-web:main`. They are built locally from GitHub source on every deployment, not pulled from a public registry. The tags are mutable; use Dokploy's deployment commit and logs to identify a release. Revert a faulty change on `main` and push to deploy the revert. Database migrations need separate compatibility review: reverting application code does not undo a migration.

## Configuration ownership

- Versioned Compose files own the services, relative build paths, health checks, log rotation, networks, and replica defaults. Keep 16 API and 16 frontend replicas and no Docker CPU/RAM quotas unless intentionally changing capacity.
- Dokploy owns environment secrets, production domains, the GitHub source settings, and deployment history. The `dokploy-network` and existing PostgreSQL service are reused.
- The API's migration service runs `prisma migrate deploy` before HTTP processes start. The production Compose file does not create or replace PostgreSQL.
- API database pool URLs are separate Dokploy variables: `API_DATABASE_URL` (3 connections per replica), `MIGRATION_DATABASE_URL` (2), and `WORKER_DATABASE_URL` (4). Each points to the restored `benchpromos` database. `DATABASE_URL` remains available as the base connection setting.
- `REDIS_URL` and `REDIS_PASSWORD` preserve the existing private Redis configuration. Redis has no published host port.
- `WORKER_REPLICAS=0` keeps scheduled jobs paused across deployments; the Compose default is also zero. Do not resume notifications without the owner's approval and coordination with the former server. HTTP processes always set `RUN_PRODUCT_JOBS=false`.
- The frontend uses `Dockerfile.production`, matching the VPS's Node 22 standalone build. Its build receives `.env` as a BuildKit secret. Environment files, Git metadata, dumps, and local performance artifacts are excluded from its build context; the runtime image excludes `.env` files.
- Frontend `NEXT_PUBLIC_*` variables are build arguments and need a rebuild when changed. Changing Dokploy environment values does not generate a GitHub push; use **Deploy** after saving them.

## Troubleshooting

If a push does not deploy, check that the GitHub App can access the repository, its webhook uses the current Dokploy domain and receives HTTP 200, and the service has GitHub source, branch `main`, push trigger, and auto-deploy enabled. See [Dokploy's auto-deploy documentation](https://docs.dokploy.com/docs/core/auto-deploy).

If a build fails, inspect the deployment logs before manually redeploying. Preserve the database, domain routes, environment, and worker pause. The old performance scripts that change raw Compose definitions or swap databases are historical tools; do not use them for routine deployment now that Git is the source.
