<?php

namespace App\Console\Commands;

use Illuminate\Foundation\Console\ServeCommand as LaravelServeCommand;
use Symfony\Component\Console\Attribute\AsCommand;

#[AsCommand(name: 'serve')]
class ServeCommand extends LaravelServeCommand
{
    protected function serverCommand(): array
    {
        $command = parent::serverCommand();

        // PHP parses multipart uploads in the child server before Laravel handles the request.
        array_splice($command, 1, 0, [
            '-d', 'upload_max_filesize=1024M',
            '-d', 'post_max_size=1100M',
            '-d', 'max_input_time=0',
        ]);

        return $command;
    }
}
