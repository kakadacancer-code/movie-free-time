<?php
namespace Tests\Feature;
use App\Models\MediaTitle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
class VideoTest extends TestCase {
 use RefreshDatabase;
 public function test_admin_can_upload_attach_publish_and_stream_video(): void {
  Storage::fake('local');
  $admin=User::create(['name'=>'Admin','email'=>'video@example.test','password'=>'password123','role'=>'admin']);
  $upload=$this->actingAs($admin)->post('/api/v1/admin/videos',['file'=>UploadedFile::fake()->create('movie.mp4', 10, 'video/mp4')],['Accept'=>'application/json'])->assertCreated();
  $path=$upload->json('data.path');
  Storage::disk('local')->assertExists($path);
  Storage::disk('local')->put($path,'0123456789');
  $this->postJson('/api/v1/admin/titles',['title'=>'Watchable movie','slug'=>'watchable','content_type'=>'movie','synopsis'=>'A complete description of this movie.','publication_status'=>'published','video_path'=>$path])->assertCreated();
  $this->getJson('/api/v1/titles/watchable')->assertOk()->assertJsonPath('data.video_url','/api/v1/titles/watchable/video');
  $this->get('/api/v1/titles/watchable/video',['Range'=>'bytes=2-5'])->assertStatus(206)->assertHeader('Content-Range','bytes 2-5/10');
  MediaTitle::where('slug','watchable')->update(['publication_status'=>'draft']);
  $this->get('/api/v1/titles/watchable/video')->assertNotFound();
 }
 public function test_upload_requires_staff_and_valid_video(): void {
  $this->postJson('/api/v1/admin/videos')->assertUnauthorized();
  $user=User::create(['name'=>'Member','email'=>'member@example.test','password'=>'password123','role'=>'user']);
  $this->actingAs($user)->postJson('/api/v1/admin/videos')->assertForbidden();
  $user->update(['role'=>'admin']);
  $this->post('/api/v1/admin/videos',['file'=>UploadedFile::fake()->create('script.txt',1,'text/plain')],['Accept'=>'application/json'])->assertUnprocessable();
  $this->postJson('/api/v1/admin/titles',['title'=>'Bad path','content_type'=>'movie','synopsis'=>'A complete description of this movie.','publication_status'=>'published','video_path'=>'../secret.mp4'])->assertUnprocessable();
 }
}
