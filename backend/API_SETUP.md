# Run the website and API locally

The frontend calls `/api/v1/anime`, `/api/v1/movies`, `/api/v1/home`, and `/api/v1/titles/{slug}`. These routes are registered in `routes/api.php`; Laravel adds the `/api` prefix. Vite proxies `/api`, `/storage`, and `/sanctum` to `http://localhost:8000`.

From the project root, start the database:

```sh
docker compose up -d db
```

The checked-in Docker Compose file exposes PostgreSQL on **5434**. Use `DB_HOST=127.0.0.1`, `DB_PORT=5434`, `DB_DATABASE=frameverse_db`, `DB_USERNAME=frameverse`, and `DB_PASSWORD=frameverse_local` in the backend `.env` for that local container. An existing PostgreSQL installation requires its own credentials.

From `backend`:

```sh
composer install
php artisan optimize:clear
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

In a separate terminal, from `frontend`:

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. Check `http://localhost:8000/api/v1/anime` directly: it should return JSON with `data`, `links`, and `meta`. A missing-route error with this source running indicates an older server or cached routes; restart the backend from this directory after `php artisan optimize:clear`. A database error requires correcting the connection and running migrations.

The seeder supplies movie/anime catalog entries, not full movie files. To enable playback, sign in as an administrator, upload an MP4 or WebM in the title editor, attach it to a published title, and open that title on the website. The video endpoint supports browser byte ranges for seeking. Only upload videos you are authorized to distribute.

To run the feature tests, install the missing test dependency first:

```sh
composer require --dev mockery/mockery:^1.6
php artisan test
```

### Video quality and subtitles

Run `php artisan migrate` after updating the app. In the admin title editor, use
**Quality & subtitles** to upload MP4/WebM versions (360p through 2160p) and Khmer
or English WebVTT (`.vtt`, UTF-8, up to 2 MB) subtitle files, then save the title.
For episodes, use **Save quality & subtitles** in the episode row. Existing videos
remain available as **Original**; alternate qualities can also be used without an
original video. Each quality must be uploaded separately; the app does not transcode
videos or generate translations. Use versions with the same timeline so quality
switching and subtitle timing stay aligned.

The viewer can switch quality without losing playback position, choose a subtitle
language or turn subtitles off, and retain these preferences on future visits.
Only uploaded qualities and subtitle tracks appear as options. Playback files stay
private and can be streamed only while their parent title is published.

Example WebVTT file:

```text
WEBVTT

00:00:01.000 --> 00:00:04.000
Welcome to the movie.
```

Staff upload subtitles with `POST /api/v1/admin/subtitles` (`file` multipart field).
Title and episode create/update endpoints accept:

```json
{
  "video_sources": [{"quality": "720p", "path": "videos/UPLOAD_ID.mp4"}],
  "subtitles": [{"language": "en", "label": "English", "path": "subtitles/UPLOAD_ID.vtt"}]
}
```

Paths must come from successful uploads. Public title/episode responses expose
`video_sources` and `subtitles` with playback URLs instead of private storage paths.
Send empty arrays to detach all alternate qualities or subtitle tracks.
