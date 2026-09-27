# Live-event performance: frontend implementation

The companion `api-benchpromos` changes remove participant/profile overfetching, add supporting indexes and batch background price work. This frontend change uses the existing GraphQL pagination contract, so it can be deployed before that API update.

- Load the first 20 comments/replies, then append pages using “Carregar mais”. A failed page remains retryable; duplicate clicks cannot launch concurrent page requests; overlapping IDs are deduplicated in Apollo's normalized cache.
- Comment controls and submit forms no longer fetch the entire comment list merely to expose mutation functions. Comment creation uses the same paginated cache key as the list. Reply counts update even when the reply list has not been opened.
- Render at most 20 loading placeholders, instead of one for every historical comment.
- Deduplicate `getServerSession` calls within a server-rendering request using React `cache`. No cross-user/session cache or authentication lifetime change is introduced.

Validation: TypeScript and focused ESLint pass; the Next.js production build completes using Node 24 (the server currently uses Node 22). The build emits existing dynamic-rendering diagnostic logs for no-store API requests but exits successfully. Five comment regression tests and the five existing giveaway tests pass with Apollo's actual normalized cache. This is not a browser end-to-end or production capacity certification.

```sh
node --test tests/comments-performance.test.cjs tests/giveaways.test.cjs
npx tsc --noEmit
npx eslint src/hooks/use-comments.ts src/components/sales/comments.tsx src/lib/server-session.ts src/app/_actions/user.ts
```

Deploy this frontend first, then migrate/deploy the companion API. See `api-benchpromos/docs/performance-phase-1.md` for the migration and single-scheduler configuration. No changes were deployed or committed automatically. After deployment, repeat the isolated VPS benchmarks before assessing readiness for 5,000 visitors.
