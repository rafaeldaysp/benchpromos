# Shared public API windows

For the complete local setup, caching behavior, deployment procedure, and test methodology, see the [development and operations guide](development-and-operations.md).

The sales feed and category navigation request `recentDays: 30` rather than calculating a distinct `minDt` for each browser. This lets visitors share the API's five-second Redis cache and avoids a separate database query for almost every arrival.

Deploy the API version that supports `recentDays` before this frontend. Exact-date API callers can continue using `minDt`; the API rejects requests specifying both. Feed pagination, Apollo normalization, personalized reaction controls, and admin mutations retain their existing behavior.

The homepage requests its sale cards and category ranks in one GraphQL operation, avoiding a second request and a loading waterfall. The product sales component retains its smaller query without category ranks. Both queries reuse the same sale-card fragment.

The API provides public GET routes too, but this change keeps the website on its existing GraphQL path. Direct API throughput does not establish full-page rendering capacity. VPS results are recorded separately in `performance/phase2-20260927/REPORT.md`.
