# FRAMEVERSE — Movie & Anime Discovery Platform

A database-backed entertainment discovery app with **two connected experiences**:

1. **Visitor & member website:** cinematic homepage, searchable movie/anime libraries, combined discovery filters, title details, official trailers, editorial articles, registration/login, profiles, watchlists, favorites, ratings, reviews and article comments.
2. **Admin control center:** dashboard, full movie/anime CRUD, article management, bulk publishing, genre/category management, roles and suspensions, comment/review moderation, reports, media uploads, metadata imports (TMDB/AniList), analytics, configurable homepage text, audit history and site settings.

**Tech:** React 19 + Vite 7 + Tailwind 4 + React Router + TanStack Query + Motion + Recharts; Laravel 12 API + Sanctum sessions + PostgreSQL.

All public catalog content comes from Laravel & PostgreSQL, not a hardcoded frontend array. Admin changes are persisted and displayed via the same API. The sample records are stored through Laravel seeders.

> **Important:** Dependencies (`node_modules`, Laravel `vendor`) are not bundled. Install them on your machine. This ZIP was statically inspected (PHP syntax and JSX parsing), but it has **not** been end-to-end executed against PostgreSQL in the build environment. Complete runtime verification on your computer before a production deployment.

---

## 1. Requirements

- Ubuntu/Linux, macOS or Windows with terminal access.
- PHP **8.2+**, Composer 2, with `pdo_pgsql`, `pgsql`, `mbstring`, `openssl`, `fileinfo`, `dom`, `xml`, `curl` and `zip` extensions as required by your Laravel installation.
- Node.js **22.12+** and npm.
- PostgreSQL 15+ (local installation or Docker).

On Ubuntu, check:

```bash
php -v
composer --version
node -v
npm -v
php -m | grep -Ei 'pgsql|mbstring|openssl'
```

For PHP extension installation, the package names depend on your PHP version, e.g. `sudo apt install php-pgsql php-mbstring php-xml php-curl php-zip`.

## 2. Unzip & create the PostgreSQL database

### Option A — Docker (easiest if you don't already have PostgreSQL configured)

From the **project root**:

```bash
docker compose up -d db
```

`docker-compose.yml` starts PostgreSQL on **localhost:5434** (to avoid conflicting with a PostgreSQL instance on port 5432). The local development credentials are:

- DB: `frameverse_db`
- User: `frameverse`
- Password: `frameverse_local`
- Host: `127.0.0.1`
- Port: `5434`

Change these before using any non-local environment.

### Option B — Existing PostgreSQL

Create an empty database and a role with privileges in your own PostgreSQL installation. Set its host, port, database, username and password in the Laravel `.env`.

## 3. Start the Laravel backend (Terminal 1)

```bash
cd frameverse-fullstack/backend
cp .env.example .env
composer install
php artisan key:generate
```

Open `.env` and configure PostgreSQL. For **Docker**, use:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5434
DB_DATABASE=frameverse_db
DB_USERNAME=frameverse
DB_PASSWORD=frameverse_local
```

Keep `APP_URL=http://localhost:8000` and `SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:8000,127.0.0.1:5173,127.0.0.1:8000` for local development.

### Create your admin account securely

The seeder **does not set a default admin password**. You must choose one yourself before seeding:

```dotenv
SEED_ADMIN_EMAIL=admin@frameverse.test
SEED_ADMIN_PASSWORD=choose_a_strong_unique_password_here
```

Then initialize:

```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=localhost --port=8000
```

The backend should be reachable at `http://localhost:8000` and its health endpoint at `http://localhost:8000/up`.

**Tip:** If you change `.env`, run `php artisan config:clear` and restart the Laravel server.

## 4. Start the React frontend (Terminal 2)

```bash
cd frameverse-fullstack/frontend
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173**. Always use `localhost` for both servers (or consistently use `127.0.0.1` for both), rather than mixing the two hostnames, so Sanctum cookies work consistently.

The Vite development server proxies `/api`, `/sanctum` and `/storage` to Laravel at `http://localhost:8000`. React requests `/api/v1/*`, and browser authentication uses **Laravel Sanctum's session cookie + CSRF protection**, not insecure localStorage access tokens.

## 5. Test both sides

**Public user:**

1. Open `/` and browse the seeded movies/anime.
2. Open `/movies` or `/anime`, choose filters and open a title.
3. Select **Create account**, register, and add a title to your watchlist.
4. Rate a title and write a review. The review appears in the admin moderation queue.
5. Open `/articles`, read a story and add a comment. The comment also awaits moderation.

**Admin:**

1. Sign in using the `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` you set.
2. Open `/admin` (also accessible from Account).
3. Go to **Movies**, click **Add movie**, complete its form and **Publish** it.
4. Open the public Movies page and confirm the new title appears.
5. Moderate the test user's review/comment from **Moderation**.
6. Edit genres, upload posters, write articles and change the site hero copy from **Settings**.
7. Inspect audit history for the recorded admin actions.

**Important:** New users registered from the frontend always receive the `user` role. Only existing admins may promote users to `editor` or `admin`.

## 6. External import center

- **TMDB movie metadata**: obtain your own API credentials, put `TMDB_API_KEY=...` in `backend/.env`, then search from **Admin → Import center**. Follow TMDB's license and attribution requirements.
- **AniList anime metadata**: supports search through the backend's GraphQL calls. Follow AniList's API terms and rate limits.
- Select at most ten items per import. Duplicates identified by `(external_source, external_id)` are skipped. New imports are **always draft**, never auto-published.
- The initial version uses short synchronous import batches; a queued job/progress system is a future extension for thousands of records.

Use metadata, imagery, trailers, and movie videos you have permission to distribute.

## 7. Useful commands

```bash
# Laravel
php artisan route:list
php artisan migrate:status
php artisan config:clear
php artisan test

# React
npm run build
npm run preview

# PostgreSQL with Docker
# (from project root)
docker compose ps
docker compose logs -f db
```

If you see a **CORS or CSRF / 419** error, use the same hostname in both browser and backend (`localhost` recommended), verify the `.env` stateful domains, and restart both servers. If images fail, run `php artisan storage:link`.

## 8. Project structure

```text
frameverse-fullstack/
├── docker-compose.yml         # PostgreSQL development service
├── README.md
├── docs/
│   ├── API.md                  # endpoint summary
│   └── FEATURES.md             # finished features and future work
├── frontend/
│   ├── src/
│   │   ├── components/        # public/admin layout & reusable UI
│   │   ├── context/           # auth and toast contexts
│   │   ├── lib/               # Axios API service
│   │   ├── pages/             # public-facing React pages
│   │   │   └── admin/         # admin dashboard & managers
│   │   ├── App.jsx            # routes, layouts, access guards
│   │   └── styles.css         # unified responsive design system
│   └── vite.config.js         # Laravel API proxy
└── backend/
    ├── app/Http/Controllers/  # auth, catalog, community, admin, import
    ├── app/Http/Middleware/   # active account and server-side roles
    ├── app/Http/Resources/    # title JSON formatting
    ├── app/Models/            # Eloquent relationships
    ├── database/migrations/   # normalized PostgreSQL schema
    ├── database/seeders/      # safe demo records
    ├── routes/api.php         # versioned /api/v1 endpoints
    ├── config/                # app/auth/database/CORS/storage services
    └── tests/Feature/        # API access/authorization tests
```

## 9. Production note

This is a functional **full-stack foundation**, not a production-audited product. Before public launch, add email verification and password reset, scheduled article publishing, job-based bulk metadata ingestion, stronger spam controls, richer media processing, a WYSIWYG editor and broader automated browser/integration tests. Configure TLS, backups, secrets, proper domains, monitoring and image/provider licensing. Do not leave local Docker passwords or debug mode in production.

## Movie uploads and playback

Apply the video schema update before using the new editor:

```bash
cd backend
php artisan migrate
```

In **Admin → Movies → Add movie** (or edit an existing movie), upload an MP4 or WebM under **Images & media**, wait for the upload to finish, set **Publication status → Published**, then save. Visitors can open the title and select **Watch movie**. Playback includes seeking, volume, fullscreen, and mobile controls. MP4 with H.264 video and AAC audio offers broad browser compatibility; uploads are not transcoded.

Videos are stored in `backend/storage/app/private/videos`, separate from public image uploads. Only published titles whose publication date has arrived can stream. Removing a video from a title detaches it; uploaded files remain on disk, including uploads from canceled forms.

The API accepts files up to 1 GB. PHP and any reverse proxy must also allow the upload size. For local development, run this from `backend` instead of `php artisan serve`:

```bash
php -d upload_max_filesize=1024M -d post_max_size=1100M -d max_execution_time=0 -d max_input_time=-1 -S localhost:8000 -t public
```

For PHP-FPM, set the same limits in its PHP configuration and restart it. Configure your proxy's request size and timeout as well (for example, Nginx `client_max_body_size 1100m;`). Storage must have enough free space. This version streams local MP4/WebM files; it does not produce adaptive streaming formats.

Regression tests cover uploads, permissions, publication, and range requests in `backend/tests/Feature/VideoTest.php`. If `php artisan test` reports `Class "Mockery" not found`, install the missing test dependency with `composer require --dev mockery/mockery:^1.6`, then rerun the tests.
