# Shared public API windows

The sales feed and category navigation request `recentDays: 30` rather than calculating a distinct `minDt` for each browser. This lets visitors share the API's five-second Redis cache and avoids a separate database query for almost every arrival.

Deploy the API version that supports `recentDays` before this frontend. Exact-date API callers can continue using `minDt`; the API rejects requests specifying both. Feed pagination, Apollo normalization, personalized reaction controls, and admin mutations retain their existing behavior.

The API provides public GET routes too, but this change keeps the website on its existing GraphQL path. Direct API throughput does not establish full-page rendering capacity. VPS results are recorded separately in `performance/phase2-20260927/REPORT.md`.
