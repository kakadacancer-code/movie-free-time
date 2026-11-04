<?php
namespace Tests\Feature;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\MediaTitle;
class AccessTest extends TestCase {
 use RefreshDatabase;
 public function test_guests_can_browse_published_titles_but_not_drafts():void {
  MediaTitle::create(['title'=>'Public Film','slug'=>'public-film','content_type'=>'movie','synopsis'=>'An example public movie synopsis.','publication_status'=>'published']);
  MediaTitle::create(['title'=>'Secret Film','slug'=>'secret-film','content_type'=>'movie','synopsis'=>'An example private movie synopsis.','publication_status'=>'draft']);
  $response=$this->getJson('/api/v1/movies')->assertOk();
  $response->assertJsonFragment(['title'=>'Public Film'])->assertDontSee('Secret Film');
 }
 public function test_regular_user_cannot_create_admin_content():void {
  $u=User::create(['name'=>'Test User','email'=>'user@example.test','password'=>'password123','role'=>'user']);
  $this->actingAs($u)->postJson('/api/v1/admin/titles',['title'=>'Unauthorized'])->assertForbidden();
 }
 public function test_admin_can_create_movie():void {
  $u=User::create(['name'=>'Admin','email'=>'admin@example.test','password'=>'password123','role'=>'admin']);
  $this->actingAs($u)->postJson('/api/v1/admin/titles',['title'=>'New Movie','content_type'=>'movie','synopsis'=>'A complete description of this film.','publication_status'=>'published','genre_ids'=>[]])->assertCreated();
  $this->assertDatabaseHas('media_titles',['title'=>'New Movie','publication_status'=>'published']);
 }
}
