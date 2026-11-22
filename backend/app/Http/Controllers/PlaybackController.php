<?php
namespace App\Http\Controllers;
use App\Models\MediaTitle;
use App\Support\Playback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
class PlaybackController {
 public function uploadSubtitle(Request $request) {
  $request->validate(['file' => 'required|file|max:2048']);
  $file = $request->file('file');
  $content = file_get_contents($file->getRealPath());
  if (strtolower($file->getClientOriginalExtension()) !== 'vtt' || !preg_match('/^(?:\xEF\xBB\xBF)?WEBVTT(?:[ \t][^\r\n]*)?(?:\r?\n|$)/', $content) || !mb_check_encoding($content, 'UTF-8')) {
   throw ValidationException::withMessages(['file' => 'Upload a UTF-8 WebVTT (.vtt) subtitle file.']);
  }
  $path = 'subtitles/'.\Illuminate\Support\Str::random(40).'.vtt';
  if (!Storage::disk('local')->put($path, $content)) throw ValidationException::withMessages(['file' => 'Subtitle could not be stored.']);
  return response()->json(['data' => ['path' => $path]], 201);
 }
 private function media(string $slug, ?int $number = null) {
  $title = MediaTitle::published()->where('slug', $slug)->firstOrFail();
  return $number === null ? $title : $title->episodes()->where('episode_number', $number)->firstOrFail();
 }
 private function qualityFile($media, string $quality) {
  $source = collect($media->video_sources ?? [])->firstWhere('quality', $quality);
  abort_unless($source, 404);
  return Playback::stream($source['path']);
 }
 private function subtitleFile($media, int $index) {
  $track = ($media->subtitles ?? [])[$index] ?? null;
  abort_unless($track, 404);
  return Playback::stream($track['path'], true);
 }
 public function quality(string $slug, string $quality) { return $this->qualityFile($this->media($slug), $quality); }
 public function subtitle(string $slug, int $index) { return $this->subtitleFile($this->media($slug), $index); }
 public function episodeQuality(string $slug, int $number, string $quality) { return $this->qualityFile($this->media($slug, $number), $quality); }
 public function episodeSubtitle(string $slug, int $number, int $index) { return $this->subtitleFile($this->media($slug, $number), $index); }
}
