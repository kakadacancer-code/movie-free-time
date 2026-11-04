<?php
namespace App\Http\Controllers;
use App\Models\MediaTitle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
class VideoController {
 public function upload(Request $request) {
  $request->validate(['file' => 'required|file|mimetypes:video/mp4,video/webm|max:1048576']);
  $path = $request->file('file')->store('videos', 'local');
  if (!$path) throw ValidationException::withMessages(['file' => 'Video could not be stored. Please try again.']);
  return response()->json(['data' => ['path' => $path]], 201);
 }
 public function show(string $slug) {
  $title = MediaTitle::published()->where('slug', $slug)->firstOrFail();
  abort_unless($title->video_path && Storage::disk('local')->exists($title->video_path), 404);
  // BinaryFileResponse supports byte ranges so browsers can seek without downloading the whole movie.
  return response()->file(Storage::disk('local')->path($title->video_path), [
   'Content-Type' => str_ends_with($title->video_path, '.webm') ? 'video/webm' : 'video/mp4',
   'Cache-Control' => 'no-cache, private',
   'X-Content-Type-Options' => 'nosniff',
  ]);
 }
}
