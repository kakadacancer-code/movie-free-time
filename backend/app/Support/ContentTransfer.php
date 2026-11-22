<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ContentTransfer
{
    // Parent tables precede their children so foreign keys stay enabled.
    public const TABLES = [
        'users', 'genres', 'media_titles', 'media_genres', 'article_categories',
        'articles', 'watchlist_items', 'ratings', 'reviews', 'comments',
        'reports', 'site_settings', 'media_assets', 'audit_logs', 'episodes',
    ];

    public function export(): array
    {
        return DB::transaction(function () {
            $tables = [];
            foreach (self::TABLES as $table) {
                $tables[$table] = DB::table($table)->get()->map(fn ($row) => (array) $row)->all();
            }
            // Session credentials should never travel with a content copy.
            foreach ($tables['users'] as &$user) {
                $user['remember_token'] = null;
            }
            return ['version' => 1, 'tables' => $tables];
        });
    }

    public function import(array $payload): void
    {
        if (($payload['version'] ?? null) !== 1 || !is_array($payload['tables'] ?? null)
            || array_diff(self::TABLES, array_keys($payload['tables']))
            || array_diff(array_keys($payload['tables']), self::TABLES)) {
            throw new RuntimeException('Invalid transfer file or unsupported version.');
        }

        DB::transaction(function () use ($payload) {
            foreach (self::TABLES as $table) {
                if (DB::table($table)->exists()) {
                    throw new RuntimeException("Import requires empty application tables; {$table} already contains data. Use a separate empty database and migrate without --seed.");
                }
                if (!is_array($payload['tables'][$table])) {
                    throw new RuntimeException("Invalid rows for {$table}.");
                }
            }

            foreach (self::TABLES as $table) {
                foreach ($payload['tables'][$table] as $row) {
                    if (!is_array($row) || !$row) {
                        throw new RuntimeException("Invalid row in {$table}.");
                    }
                    foreach ($row as $column => &$value) {
                        if (is_bool($value)) {
                            $value = (int) $value;
                        }
                        // PostgreSQL includes timezone offsets that MySQL DATETIME rejects.
                        if ($value !== null && str_ends_with($column, '_at')) {
                            $value = Carbon::parse($value)->utc()->format('Y-m-d H:i:s');
                        }
                    }
                    unset($value);
                    if ($table === 'users') {
                        $row['remember_token'] = null;
                    }
                    DB::table($table)->insert($row);
                }
            }

            if (DB::getDriverName() === 'pgsql') {
                foreach (self::TABLES as $table) {
                    if ($table === 'media_genres') {
                        continue;
                    }
                    DB::select("SELECT setval(pg_get_serial_sequence(?, 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM \"{$table}\"", [$table]);
                }
            }
        });
    }
}
