# Features & delivery scope

## Connected and implemented in source

**User side:** homepage rails, responsive cinema-style layout, movie/anime galleries, filters, sort, pagination, global discovery, searchable genres, details, externally hosted official trailers, articles, registration/login/logout, profile, watchlist status management, favorites, numeric ratings and review/comment submission.

**Admin side:** dashboard stats, title CRUD, publication status, feature flag, metadata, genre assignment, bulk title operations, article CRUD, genres/categories, role and suspension controls, moderation, reports, upload library, external metadata preview/import as drafts, analytics charts, copy/branding settings, audit history.

**Backend:** PostgreSQL migration, Eloquent relationships, HTTP validation, Sanctum cookie sessions, active account/role middleware, API pagination, soft deletes, source deduplication, transactional title+genre writes, seeders, example authorization tests.

## Deliberately scoped for later iteration

- Rich-text WYSIWYG (current articles use plain-text editor with paragraph separation).
- Queue-backed bulk imports, retries and per-item job progress (current import is synchronous, at most 10 IDs per confirmation).
- Scheduled release/publishing queue, automatic recommendations, full-text ranking and typo-tolerant search.
- Season/episode and cast/studio many-to-many editing, advanced asset transformations/thumbnails, saved filter presets and title collection lists.
- Email verification, forgot/reset password, email notifications and 2FA.
- Automated end-to-end browser tests, high-load benchmarks, thorough production hardening, privacy/consent analytics and provider-license sign-off.
- API documentation in formal OpenAPI schema (provided route summary in `API.md`).

Do not treat items in the second section as already built. This package provides a substantial functional foundation for your Phase 3 app and is structured so these modules can be added without redesigning both sides.
