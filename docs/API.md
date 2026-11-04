# FrameVerse API v1

Base URL: `http://localhost:5173/api/v1` in local React development (proxied to Laravel at port 8000).

All requests use JSON. Read operations are public when noted. Cookie-authenticated requests require `withCredentials=true`, `withXSRFToken=true` and an initial `GET /sanctum/csrf-cookie` before login or registration.

## Public endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/home` | Featured title, curated rails, genres and newest articles |
| GET | `/titles` | Unified published catalog, pagination + filters |
| GET | `/movies` | Published movie catalog |
| GET | `/anime` | Published anime catalog |
| GET | `/titles/{slug}` | Published title details & related titles |
| GET | `/genres` | Genres with visible title counts |
| GET | `/categories` | Article categories |
| GET | `/articles` | Published articles, paginated |
| GET | `/articles/{slug}` | Article details and approved comments |
| GET | `/titles/{id}/reviews` | Approved community reviews |
| GET | `/search?q=term` | Matching titles, article headlines and genres |
| GET | `/settings` | Public branding and copy (no secrets) |

Catalog filters: `q`, `type`, `genre` (slug), `year`, `country`, `status` (release status), `format` (anime), `min_rating`, `sort` (`popular`,`rating`,`newest`,`oldest`,`recent`,`title`), `per_page` (1–48), and `page`. Laravel paginators return `data`, `current_page`, `last_page`, `total`, etc.

## Authentication & user features

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | `{name,email,password,password_confirmation}` |
| POST | `/auth/login` | `{email,password}` |
| POST | `/auth/logout` | Logout and invalidate session |
| GET | `/me` | Current user |
| PATCH | `/me` | Update name, bio or password |
| GET | `/me/watchlist` | Personal watchlist with nested title data |
| POST | `/me/watchlist` | Upsert `{media_title_id,status,is_favorite}` |
| DELETE | `/me/watchlist/{id}` | Remove personal watchlist record |
| POST | `/titles/{id}/ratings` | Upsert `{score:1..10}` |
| POST | `/titles/{id}/reviews` | Create/update a pending review, `{body}` |
| POST | `/articles/{id}/comments` | Create a pending comment, `{body}` |
| POST | `/reports` | Submit `{review_id | comment_id,reason}` |

These routes require `auth:sanctum` and an active account. Ratings update the title's average. Comments and review text appear publicly only when approved.

## Admin (admin & editor roles)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard` | Real DB statistics and recent activity |
| GET | `/admin/analytics` | Views, rating/watchlist totals and genre mix |
| GET | `/admin/titles` | Filterable admin listing of all statuses |
| POST | `/admin/titles` | Create movie/anime with genres |
| PUT | `/admin/titles/{id}` | Edit title and associations |
| DELETE | `/admin/titles/{id}` | Soft-delete title |
| POST | `/admin/titles/bulk` | Publish, draft, archive or soft-delete up to 100 |
| GET | `/admin/articles` | All editorial records |
| POST | `/admin/articles` | Create article |
| PUT | `/admin/articles/{id}` | Update article |
| DELETE | `/admin/articles/{id}` | Soft-delete article |
| POST | `/admin/genres` | Add genre |
| PUT | `/admin/genres/{id}` | Edit genre |
| DELETE | `/admin/genres/{id}` | Delete unused genre |
| POST | `/admin/categories` | Add article category |
| DELETE | `/admin/categories/{id}` | Delete unused category |
| GET | `/admin/moderation` | Pending/approved/hidden comments and reviews |
| PATCH | `/admin/moderation/{type}/{id}` | Set status (`reviews` or `comments`) |
| GET | `/admin/media` | List uploaded images |
| POST | `/admin/media` | Multipart upload with a `file` image field |
| DELETE | `/admin/media/{id}` | Delete unused image |
| GET | `/admin/imports/search` | Search TMDB or AniList (`provider`, `q`) |
| POST | `/admin/imports/confirm` | Import up to 10 IDs as drafts |

## Owner / administrator only

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/users` | Paginated users |
| PATCH | `/admin/users/{id}` | Set `role` or `is_active` |
| GET | `/admin/reports` | Community reports |
| PATCH | `/admin/reports/{id}` | Resolve a report |
| GET | `/admin/settings` | All nonsecret site settings |
| PUT | `/admin/settings` | Update whitelisted site settings |
| GET | `/admin/audit-logs` | Paginated admin action history |

Authorization is enforced on the **Laravel server** (not just the React route guard). Unsuspended editors are allowed to edit content, but not users, site settings, reports or audit history.

## Error formats

Validation failures: HTTP 422 and a JSON `errors` map. Unauthorized session: HTTP 401. Invalid permission: HTTP 403. Missing published title: HTTP 404. API/network failures may return HTTP 502. For uploads, only jpg/png/webp image files up to 5MB are accepted.

## Notes

- The project uses a real database-backed title count, not a fake third-party popularity score.
- Public `views_count` is a request counter, not unique visitors.
- Imports intentionally create drafts; publication must be approved manually.
- All text is rendered by React without injecting raw HTML.

## Movie videos

- `POST /api/v1/admin/videos`: authenticated admin/editor multipart upload with `file` (MP4/WebM, max 1 GB); returns `data.path`.
- `POST /api/v1/admin/titles` / `PUT /api/v1/admin/titles/{id}`: attach the returned `video_path`, or send `null` to detach.
- Public title resources include nullable `video_url`.
- `GET /api/v1/titles/{slug}/video`: stream a published title's video; supports HTTP byte ranges (206) for seeking. Draft, scheduled, deleted, or missing videos return 404.
