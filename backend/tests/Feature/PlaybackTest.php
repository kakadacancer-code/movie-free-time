<?php
namespace Tests\Feature;
use App\Models\MediaTitle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
class PlaybackTest extends TestCase {
 use RefreshDatabase;
 private function staff(): User {
  return User::create(['name' => 'Editor', 'email' => 'playback@example.test', 'password' => 'password123', 'role' => 'editor']);
 }
 private function payload(): array {
  return ['title' => 'Playback movie', 'slug' => 'playback', 'content_type' => 'movie', 'synopsis' => 'A movie with several video qualities and subtitles.', 'publication_status' => 'published'];
 }
 public function test_movie_quality_and_subtitles_can_be_uploaded_attached_streamed_and_removed(): void {
  Storage::fake('local');
  $this->actingAs($this->staff());
  $video = $this->post('/api/v1/admin/videos', ['file' => UploadedFile::fake()->create('720.mp4', 10, 'video/mp4')], ['Accept' => 'application/json'])->assertCreated()->json('data.path');
  Storage::disk('local')->put($video, '0123456789');
  $vtt = "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHello!\n";
  $subtitle = $this->post('/api/v1/admin/subtitles', ['file' => UploadedFile::fake()->createWithContent('english.vtt', $vtt)], ['Accept' => 'application/json'])->assertCreated()->json('data.path');
  $options = ['video_sources' => [['quality' => '720p', 'path' => $video]], 'subtitles' => [['language' => 'en', 'label' => 'English', 'path' => $subtitle]]];
  $id = $this->postJson('/api/v1/admin/titles', [...$this->payload(), ...$options])->assertCreated()->json('data.id');
  $response = $this->getJson('/api/v1/titles/playback')->assertOk()->assertJsonPath('data.video_sources.0.url', '/api/v1/titles/playback/quality/720p')->assertJsonPath('data.subtitles.0.language', 'en');
  $this->assertArrayNotHasKey('path', $response->json('data.subtitles.0'));
  $this->get('/api/v1/titles/playback/quality/720p', ['Range' => 'bytes=2-5'])->assertStatus(206)->assertHeader('Content-Range', 'bytes 2-5/10');
  $this->get('/api/v1/titles/playback/subtitles/0')->assertOk()->assertHeader('Content-Type', 'text/vtt; charset=utf-8');
  $this->get('/api/v1/titles/playback/quality/1080p')->assertNotFound();
  $this->get('/api/v1/titles/playback/subtitles/9')->assertNotFound();
  $this->putJson('/api/v1/admin/titles/'.$id, [...$this->payload(), 'video_sources' => [], 'subtitles' => []])->assertOk();
  $this->get('/api/v1/titles/playback/quality/720p')->assertNotFound();
  $this->get('/api/v1/titles/playback/subtitles/0')->assertNotFound();
 }
 public function test_episode_options_and_publication_checks(): void {
  Storage::fake('local');
  Storage::disk('local')->put('videos/test.mp4', '0123456789');
  Storage::disk('local')->put('subtitles/test.vtt', "WEBVTT\n");
  $this->actingAs($this->staff());
  $title = MediaTitle::create($this->payload());
  $ep = $this->postJson('/api/v1/admin/titles/'.$title->id.'/episodes', ['episode_number' => 1, 'video_sources' => [['quality' => '1080p', 'path' => 'videos/test.mp4']], 'subtitles' => [['language' => 'km', 'label' => 'ខ្មែរ', 'path' => 'subtitles/test.vtt']]])->assertCreated()->json('data.id');
  $this->getJson('/api/v1/titles/playback')->assertOk()->assertJsonPath('episodes.0.has_video', true)->assertJsonPath('episodes.0.video_sources.0.url', '/api/v1/titles/playback/episodes/1/quality/1080p');
  $this->getJson('/api/v1/admin/titles/'.$title->id.'/episodes')->assertOk()->assertJsonPath('data.0.video_sources.0.path', 'videos/test.mp4');
  $this->get('/api/v1/titles/playback/episodes/1/quality/1080p', ['Range' => 'bytes=0-3'])->assertStatus(206);
  $this->get('/api/v1/titles/playback/episodes/1/subtitles/0')->assertOk();
  $this->putJson('/api/v1/admin/episodes/'.$ep, ['subtitles' => []])->assertOk();
  $this->get('/api/v1/titles/playback/episodes/1/subtitles/0')->assertNotFound();
  $title->update(['publication_status' => 'draft']);
  $this->get('/api/v1/titles/playback/episodes/1/quality/1080p')->assertNotFound();
  $this->get('/api/v1/titles/playback/quality/720p')->assertNotFound();
 }
 public function test_existing_title_can_save_uploaded_quality_without_subtitles(): void {
  Storage::fake('local');
  $this->actingAs($this->staff());
  $title = MediaTitle::create($this->payload());
  $item = $this->getJson('/api/v1/admin/titles')->assertOk()->json('data.0');
  $this->assertNull($item['subtitles']);
  $video = $this->post('/api/v1/admin/videos', ['file' => UploadedFile::fake()->create('1080.mp4', 10, 'video/mp4')], ['Accept' => 'application/json'])->assertCreated()->json('data.path');
  $item['video_sources'] = [['quality' => '1080p', 'path' => $video]];
  $this->putJson('/api/v1/admin/titles/'.$title->id, $item)->assertOk();
  $this->assertSame($video, $title->fresh()->video_sources[0]['path']);
  $this->getJson('/api/v1/titles/playback')->assertOk()->assertJsonPath('data.subtitles', [])->assertJsonPath('data.video_sources.0.quality', '1080p');
 }
 public function test_existing_title_can_save_subtitle_without_alternate_qualities(): void {
  Storage::fake('local');
  $this->actingAs($this->staff());
  $title = MediaTitle::create($this->payload());
  Storage::disk('local')->put('subtitles/test.vtt', "WEBVTT\n");
  $item = $this->getJson('/api/v1/admin/titles')->assertOk()->json('data.0');
  $this->assertNull($item['video_sources']);
  $item['subtitles'] = [['language' => 'en', 'label' => 'English', 'path' => 'subtitles/test.vtt']];
  $this->putJson('/api/v1/admin/titles/'.$title->id, $item)->assertOk();
  $this->getJson('/api/v1/titles/playback')->assertOk()->assertJsonPath('data.video_sources', [])->assertJsonPath('data.subtitles.0.language', 'en');
 }
 public function test_upload_and_metadata_validation(): void {
  Storage::fake('local');
  $this->postJson('/api/v1/admin/subtitles')->assertUnauthorized();
  $user = $this->staff();$user->update(['role' => 'user']);
  $this->actingAs($user)->postJson('/api/v1/admin/subtitles')->assertForbidden();
  $user->update(['role' => 'editor']);
  foreach (['bad.vtt' => '<script>alert(1)</script>', 'bad.txt' => "WEBVTT\n"] as $name => $content) {
   $this->post('/api/v1/admin/subtitles', ['file' => UploadedFile::fake()->createWithContent($name, $content)], ['Accept' => 'application/json'])->assertUnprocessable();
  }
  $this->postJson('/api/v1/admin/titles', [...$this->payload(), 'video_sources' => [['quality' => '720p', 'path' => '../secret.mp4']], 'subtitles' => [['language' => 'en', 'label' => 'English', 'path' => 'videos/test.mp4']]])->assertUnprocessable()->assertJsonValidationErrors(['video_sources.0.path', 'subtitles.0.path']);
  Storage::disk('local')->put('videos/test.mp4', 'data');
  $this->postJson('/api/v1/admin/titles', [...$this->payload(), 'video_sources' => [['quality' => '720p', 'path' => 'videos/test.mp4'], ['quality' => '720p', 'path' => 'videos/test.mp4']]])->assertUnprocessable()->assertJsonValidationErrors(['video_sources.0.quality']);
 }
}
