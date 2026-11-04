<?php
namespace App\Http\Controllers;
use App\Models\Episode;
use App\Models\MediaTitle;
use App\Support\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
class EpisodeController {
 private function rules(): array {
  return [
   'episode_number' => 'nullable|integer|between:1,10000',
   'title' => 'nullable|string|max:160',
   'video_path' => ['nullable', 'string', 'max:255', function ($attribute, $value, $fail) {
    if (!preg_match('~^videos/[a-zA-Z0-9]+\.(mp4|webm)$~', $value) || !Storage::disk('local')->exists($value)) $fail('Please upload a valid episode video first.');
   }],
  ];
 }
 private function assertNumberFree(int $titleId, int $number, ?int $ignoreId = null): void {
  $query = Episode::where('media_title_id', $titleId)->where('episode_number', $number);
  if ($ignoreId) $query->whereKeyNot($ignoreId);
  if ($query->exists()) throw ValidationException::withMessages(['episode_number' => "Episode {$number} already exists for this title."]);
 }
 // Admin: list every episode of a title.
 public function index(int $id) {
  $title = MediaTitle::findOrFail($id);
  return response()->json(['data' => $title->episodes()->get()->map(fn ($e) => $e->toApi($title->slug))->values()]);
 }
 // Admin: add one episode. The number defaults to the next free one.
 public function store(Request $request, int $id) {
  $title = MediaTitle::findOrFail($id);
  $data = $request->validate($this->rules());
  $number = $data['episode_number'] ?? ((int) Episode::where('media_title_id', $title->id)->max('episode_number') + 1);
  $this->assertNumberFree($title->id, $number);
  $episode = Episode::create([
   'media_title_id' => $title->id,
   'episode_number' => $number,
   'title' => $data['title'] ?? null,
   'video_path' => $data['video_path'] ?? null,
  ]);
  Activity::record('created', 'episode', $episode->id, ['title_id' => $title->id, 'episode_number' => $number]);
  return response()->json(['message' => 'Episode added', 'data' => $episode->toApi($title->slug)], 201);
 }
 // Admin: rename, renumber or replace the video of an episode.
 public function update(Request $request, int $id) {
  $episode = Episode::with('mediaTitle')->findOrFail($id);
  $rules = $this->rules();
  $rules['episode_number'] = 'sometimes|required|integer|between:1,10000';
  $data = $request->validate($rules);
  if (isset($data['episode_number'])) $this->assertNumberFree($episode->media_title_id, (int) $data['episode_number'], $episode->id);
  $episode->fill($data)->save();
  Activity::record('updated', 'episode', $episode->id, ['title_id' => $episode->media_title_id]);
  return response()->json(['message' => 'Episode updated', 'data' => $episode->toApi($episode->mediaTitle->slug)]);
 }
 // Admin: remove an episode (the uploaded file stays on disk, like title videos).
 public function destroy(int $id) {
  $episode = Episode::findOrFail($id);
  $episode->delete();
  Activity::record('deleted', 'episode', $id, ['title_id' => $episode->media_title_id]);
  return response()->json(['message' => 'Episode deleted']);
 }
 // Public: stream an episode with byte-range support so players can seek.
 public function video(string $slug, int $number) {
  $title = MediaTitle::published()->where('slug', $slug)->firstOrFail();
  $episode = Episode::where('media_title_id', $title->id)->where('episode_number', $number)->firstOrFail();
  abort_unless($episode->video_path && Storage::disk('local')->exists($episode->video_path), 404);
  return response()->file(Storage::disk('local')->path($episode->video_path), [
   'Content-Type' => str_ends_with($episode->video_path, '.webm') ? 'video/webm' : 'video/mp4',
   'Cache-Control' => 'no-cache, private',
   'X-Content-Type-Options' => 'nosniff',
  ]);
 }
}