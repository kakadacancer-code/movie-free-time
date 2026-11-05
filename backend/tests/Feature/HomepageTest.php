<?php
namespace Tests\Feature;

use App\Models\Genre;
use App\Models\MediaTitle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomepageTest extends TestCase
{
    use RefreshDatabase;

    public function test_homepage_title_sections_each_show_ten_titles(): void
    {
        foreach (['movie','anime','donghua'] as $type) {
            for ($i=0; $i<12; $i++) {
                MediaTitle::create(['title'=>"$type $i",'slug'=>"$type-$i",'content_type'=>$type,'synopsis'=>'A published story.','publication_status'=>'published']);
            }
        }
        $response=$this->getJson('/api/v1/home')->assertOk();
        foreach (['trending','movies','anime','donghua'] as $key) {
            $response->assertJsonCount(10, $key)->assertJsonPath("sections.$key.limit", 10);
        }
    }

    public function test_admin_can_manage_donghua_and_homepage_sections(): void
    {
        $admin = User::create(['name'=>'Admin','email'=>'home@example.test','password'=>'password123','role'=>'admin']);
        $this->actingAs($admin)->postJson('/api/v1/admin/titles', [
            'title'=>'Donghua Story','content_type'=>'donghua','synopsis'=>'A complete Chinese animation story.',
            'publication_status'=>'published','genre_ids'=>[],
        ])->assertCreated();
        $this->getJson('/api/v1/admin/titles?type=donghua')->assertOk()->assertJsonCount(1, 'data');
        $sections = $this->getJson('/api/v1/admin/settings')->assertOk()->json('home_sections');
        $sections['donghua']['title'] = 'Chinese Animation';
        $sections['donghua']['limit'] = 1;
        $sections['anime']['enabled'] = false;
        $this->putJson('/api/v1/admin/settings', ['home_sections'=>$sections,'discovery_title'=>'Find your next adventure','discovery_subtitle'=>'Pick a genre and explore.'])->assertOk();
        $this->getJson('/api/v1/settings')->assertOk()->assertJsonPath('discovery_title', 'Find your next adventure')->assertJsonPath('discovery_subtitle', 'Pick a genre and explore.');
        $this->getJson('/api/v1/home')->assertOk()->assertJsonCount(1, 'donghua')
            ->assertJsonPath('sections.donghua.title', 'Chinese Animation')
            ->assertJsonPath('sections.anime.enabled', false)
            ->assertJsonMissingPath('articles')->assertJsonMissingPath('top_rated');
        $this->getJson('/api/v1/donghua')->assertOk()->assertJsonPath('data.0.content_type', 'donghua');
        $this->getJson('/api/v1/titles?type=donghua')->assertOk()->assertJsonCount(1, 'data');
        $sections['donghua']['limit'] = 100;
        $this->putJson('/api/v1/admin/settings', ['home_sections'=>$sections])->assertUnprocessable();
    }

    public function test_homepage_categories_count_only_published_titles_and_use_admin_edits(): void
    {
        $genre = Genre::create(['name'=>'Action','slug'=>'action']);
        foreach (['published','draft'] as $status) {
            $title = MediaTitle::create(['title'=>$status,'slug'=>$status,'content_type'=>'donghua','synopsis'=>'An animation story.','publication_status'=>$status]);
            $title->genres()->attach($genre);
        }
        $admin = User::create(['name'=>'Admin','email'=>'genres@example.test','password'=>'password123','role'=>'admin']);
        $this->actingAs($admin)->putJson('/api/v1/admin/genres/'.$genre->id, ['name'=>'Adventure'])->assertOk();
        $this->getJson('/api/v1/home')->assertOk()->assertJsonPath('genres.0.name', 'Adventure')
            ->assertJsonPath('genres.0.slug', 'adventure')->assertJsonPath('genres.0.titles_count', 1)
            ->assertJsonCount(1, 'donghua');
    }
}
