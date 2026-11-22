# Share PostgreSQL content with a MySQL installation

Both people need the version of the project containing `content:export` and
`content:import`. Keep your PostgreSQL database; your friend can keep MySQL.
Pause admin edits and uploads while exporting and packaging files.

## On your computer

From the project root:

```bash
cd backend
php artisan content:export ../frameverse-content.json
cd ..
tar -czf frameverse-uploads.tar.gz backend/storage/app/public backend/storage/app/private
```

Send `frameverse-content.json` and `frameverse-uploads.tar.gz` privately.
The JSON includes accounts, password hashes, reviews and other application data.
It excludes sessions, API tokens and password reset tokens. Do not commit these
files or send your `.env`. Uploads may contain large video files.

## On your friend's computer

Install frontend/backend dependencies and create `.env` files as described in the
README. Enable PHP's `pdo_mysql` extension. Create a **new empty MySQL database**
named `frameverse_copy`. Configure `backend/.env` with their own credentials:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=frameverse_copy
DB_USERNAME=your_mysql_user
DB_PASSWORD=your_mysql_password
APP_URL=http://localhost:8000
```

Place the two transferred files in the project root. Then run:

```bash
cd backend
php artisan key:generate
php artisan config:clear
php artisan migrate
php artisan content:import ../frameverse-content.json
cd ..
tar -xzf frameverse-uploads.tar.gz
cd backend
php artisan storage:link
php artisan serve --host=localhost --port=8000
```

Do **not** seed before importing. The importer requires empty application tables
and refuses to overwrite data. If your friend already seeded a database, point
`.env` to a different, empty database and migrate there; keep the old database.
Start the frontend using the README instructions. Imported accounts keep their
existing passwords. Each copy is independent; later edits do not sync.

The importer retains IDs, relationships, relative upload paths, and settings.
External image URLs still require internet access. Any manually stored absolute
URLs pointing at your machine must be updated for your friend's environment.
