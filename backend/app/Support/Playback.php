<?php
namespace App\Support;
use Illuminate\Support\Facades\Storage;
class Playback {
 public static function rules(): array {
  $file = fn ($folder, $extensions) => ['required', 'string', 'max:255', function ($attribute, $value, $fail) use ($folder, $extensions) {
   if (!preg_match('~^'.$folder.'/[a-zA-Z0-9]+\.('.$extensions.')$~', $value) || !Storage::disk('local')->exists($value)) $fail('Please upload a valid file first.');
  }];
  return [
   'video_sources' => 'sometimes|nullable|array|max:6',
   'video_sources.*' => 'array:quality,path',
   'video_sources.*.quality' => 'required|in:360p,480p,720p,1080p,1440p,2160p|distinct',
   'video_sources.*.path' => $file('videos', 'mp4|webm'),
   'subtitles' => 'sometimes|nullable|array|max:20',
   'subtitles.*' => 'array:language,label,path',
   'subtitles.*.language' => ['required', 'string', 'distinct', 'regex:/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/'],
   'subtitles.*.label' => 'required|string|max:60',
   'subtitles.*.path' => $file('subtitles', 'vtt'),
  ];
 }
 public static function toApi($media, string $base): array {
  return [
   'video_sources' => collect($media->video_sources ?? [])->map(fn ($s) => ['quality' => $s['quality'], 'url' => $base.'/quality/'.$s['quality']])->values()->all(),
   'subtitles' => collect($media->subtitles ?? [])->map(fn ($s, $i) => ['language' => $s['language'], 'label' => $s['label'], 'url' => $base.'/subtitles/'.$i])->values()->all(),
  ];
 }
 public static function stream(string $path, bool $subtitle = false) {
  abort_unless(Storage::disk('local')->exists($path), 404);
  return response()->file(Storage::disk('local')->path($path), [
   'Content-Type' => $subtitle ? 'text/vtt; charset=utf-8' : (str_ends_with($path, '.webm') ? 'video/webm' : 'video/mp4'),
   'Cache-Control' => 'no-cache, private', 'X-Content-Type-Options' => 'nosniff',
  ]);
 }
}
