<?php
use Illuminate\Support\Facades\Artisan;
Artisan::command('inspire', fn () => $this->comment('Discover something extraordinary.'));

Artisan::command('content:export {file : Destination JSON file}', function () {
    $file = $this->argument('file');
    if (file_exists($file)) {
        $this->error('Destination already exists. Choose a new filename.');
        return 1;
    }
    $json = json_encode(app(\App\Support\ContentTransfer::class)->export(), JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT);
    $handle = fopen($file, 'x');
    if (!$handle) {
        throw new \RuntimeException('Cannot create export file.');
    }
    try {
        chmod($file, 0600);
        if (fwrite($handle, $json) !== strlen($json)) {
            throw new \RuntimeException('Could not write the complete export.');
        }
    } finally {
        fclose($handle);
    }
    $this->info('Export complete. This file includes user data and password hashes; share privately. Upload files must be copied separately.');
})->purpose('Export application data for transfer between PostgreSQL and MySQL');

Artisan::command('content:import {file : Source JSON file}', function () {
    $json = file_get_contents($this->argument('file'));
    if ($json === false) {
        throw new \RuntimeException('Cannot read import file.');
    }
    app(\App\Support\ContentTransfer::class)->import(json_decode($json, true, 512, JSON_THROW_ON_ERROR));
    $this->info('Import complete. Restore uploads and run php artisan storage:link.');
})->purpose('Import application data into an empty migrated database');
