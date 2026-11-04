<?php
namespace Tests\Feature;

use App\Models\MediaTitle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_frontend_catalog_routes_filter_published_content(): void
    {
        foreach (['movie', 'anime'] as $type) {
            MediaTitle::create(['title' => ucfirst($type).' Story', 'slug' => $type.'-story', 'content_type' => $type, 'synopsis' => 'A searchable story.', 'publication_status' => 'published']);
            MediaTitle::create(['title' => 'Draft '.$type, 'slug' => 'draft-'.$type, 'content_type' => $type, 'publication_status' => 'draft']);
        }
        foreach (['movies' => 'movie', 'anime' => 'anime'] as $endpoint => $type) {
            $this->getJson('/api/v1/'.$endpoint.'?q=STORY')->assertOk()
                ->assertJsonCount(1, 'data')->assertJsonPath('data.0.content_type', $type)
                ->assertJsonStructure(['data', 'links', 'meta']);
        }
        $this->getJson('/api/v1/home')->assertOk()->assertJsonCount(1, 'movies')->assertJsonCount(1, 'anime');
        $this->getJson('/api/v1/search?q=STORY')->assertOk()->assertJsonCount(2, 'titles');
        $this->getJson('/api/v1/titles/anime-story')->assertOk()->assertJsonPath('data.slug', 'anime-story');
        $this->getJson('/api/v1/titles/draft-anime')->assertNotFound();
    }
}
