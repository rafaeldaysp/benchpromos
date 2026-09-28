# Database restore — 28 September 2026

The supplied dump was restored successfully to the application PostgreSQL database on `v2-bench`. The restored database is active as `benchpromos`, and the test website/API are serving its data. Scheduled jobs remain paused until production cutover, as requested.

## Source and destination

- Source: `dump/dump_2026-09-28_14_47_39.sql.gz`.
- Source SHA-256: `a6b8243e8ba7157335f66bd6a1fb5f97cf45ad4cba23d3b57d6242f54748f2cf`.
- Format: gzip-compressed plain SQL **cluster dump**, produced by PostgreSQL 15.9.
- Application tables were in the source database named `postgres`. The dump also contained cluster roles and the `template1`/`root` database sections.
- Destination: PostgreSQL 15.19, private host `benchpromos-postgres-pqols1`, database/owner `benchpromos`.
- Verification completed before cutover at **15:00:20 UTC**.
- Application cutover and HTTP verification completed at **15:05:33 UTC** (12:05:33 São Paulo time).

## How partial restores were avoided

The cluster dump includes `DROP DATABASE`, role changes, and database connection switches. Replaying the entire file into an already initialized application database would affect objects outside the intended application and can produce conflicts. The exact cause of the previous failed restore was not available, so it was not assumed to be a missing-table problem alone.

For this restore:

1. Read the complete gzip file and inventoried every table and COPY payload.
2. Extracted only the application database section, excluding cluster/database administration commands and the source database comment.
3. Mapped object ownership from source role `root` to destination role `benchpromos`. Normalized CRLF line endings. Application row contents were otherwise preserved.
4. Backed up the existing application database and created a fresh database named `benchpromos_restore_20260928_144739` from `template0`.
5. Restored with `psql -X --single-transaction -v ON_ERROR_STOP=1`. Any SQL error would abort the transaction instead of leaving a partially imported database.
6. Kept the dump's schema/data/constraint order: tables and types first, COPY data next, then indexes and foreign keys. Foreign-key validation was not disabled.
7. Verified all data and database objects before making the restored database active.

The SQL import committed successfully on its first execution. No repeated imports or ignored restore errors were needed.

## Verification

**All 46 tables and all 1,750,397 source rows were verified.** For each table, the expected row count and order-independent SHA-256 row fingerprints were calculated from its dump COPY payload and compared with a fresh COPY export of the restored table. Both fingerprint accumulators and the row count matched for every table, including empty tables and migration history.

| Representative table | Verified rows |
|---|---:|
| `users` | 62,395 |
| `accounts` | 53,419 |
| `sales` | 20,746 |
| `products` | 2,627 |
| `deals` | 4,828 |
| `daily_products_statuses` | 1,269,604 |
| `comments` | 6,181 |
| `sales_reactions` | 10,394 |
| `giveaways` | 187 |
| `_giveaway_participants` | 84,150 |
| `subscriptions` | 2,383 |
| `users_products_notifications` | 61,038 |

Object checks also passed:

- 46 tables, seven enum types, and six sequences.
- All six sequence values and `is_called` states matched the dump.
- 100 constraints, including **62 validated foreign keys**.
- Zero unvalidated constraints, zero invalid/unready indexes, and zero table/index/sequence ownership mismatches.

The [verification artifact](database-restore-2026-09-28-verification.json) records every table's count and fingerprints. It contains no customer row values, authentication tokens, or database passwords.

## Migrations and activation

All existing application migrations were already represented in the dump. The only pending migration was `20260927000000_live_event_query_indexes`, which adds the ten performance indexes. It applied successfully to the restored database, and Prisma reported the schema up to date.

The 75 source `_prisma_migrations` rows were preserved, including historical duplicate/rolled-back records. Applying the new migration added one row, bringing that table to 76 and the total across all restored tables to 1,750,398. No business-data rows were added or removed by the migration.

During the brief cutover:

1. Took another backup immediately before stopping processes.
2. Set the worker to zero replicas in Dokploy and its phase-2 restoration snapshot.
3. Stopped the API processes and worker, blocked new connections, and disconnected existing application sessions.
4. Renamed the previous database to `benchpromos_before_restore_20260928` and the verified database to `benchpromos`.
5. Enabled connections to the new application database, cleared the application's disposable Redis cache, and redeployed the API.
6. Rechecked every table count after migration and verified all 62 foreign keys and index validity again.

All 16 API processes became healthy. Website, API readiness, public sales endpoint, and authentication-provider endpoint returned HTTP 200. A GraphQL read returned the expected **20,746 total sales**, a 12-row page, category ranks, and related sale data without GraphQL errors. The recent public feed contained 103 sales at verification time. The 16 frontend processes and Redis were also healthy.

These were limited read-only application checks, not load tests or real-customer login tests. The original production server was not contacted, and its DNS/traffic was not switched.

## Paused jobs and rollback material

The scheduled worker stays at **zero replicas** until production cutover. The owner explicitly selected this to avoid customer notifications from the restored test data. HTTP APIs retain `RUN_PRODUCT_JOBS=false`.

The release helper now preserves a worker replica count of zero during future releases. Its status display was also corrected to distinguish zero replicas from the default of one. Ordinary redeploys must preserve this pause; enabling the worker later is a separate cutover decision.

The previous database remains on the same PostgreSQL instance as `benchpromos_before_restore_20260928`, with new connections disabled. Private restore artifacts are in:

```text
/opt/bench-v2/deploy/private/restore-20260928/
  application.sql.gz
  manifest.json
  before-restore.dump
  before-cutover.dump
  restore.log
  restore-verification.json
  cutover-verification.json
  restore.py
  migrate-stage.cjs
  cutover.py
  cutover-dokploy.cjs
```

The directory is private, and backup/data files were created with restrictive permissions. These artifacts contain application data and should not be committed to Git. The previous Dokploy configuration is also preserved privately at `/etc/dokploy/bench-api-phase2/before-data-restore-20260928.json` inside Dokploy.

Rollback requires a controlled pause of application writes, preserving the current restored database, and switching database names back; do not blindly restore a dump over a live schema. A rollback after new writes would require reconciling those writes. The old empty application database has not been deleted.

The earlier performance harness's `verify.py` still assumes an empty application database and one running worker. Those assumptions are now obsolete. Review/update the harness before running another performance sequence; continue to use the separate synthetic performance database rather than this restored customer dataset.
