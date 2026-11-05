<?php
namespace Tests\Feature;

use App\Models\User;
use App\Models\MediaAsset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CategoryImageTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_create_replace_and_remove_category_background(): void
    {
        Storage::fake('public');
        $admin=User::create(['name'=>'Admin','email'=>'category@example.test','password'=>'password123','role'=>'admin']);
        $this->actingAs($admin);
        $upload=$this->postJson('/api/v1/admin/media',['file'=>UploadedFile::fake()->image('category.jpg')])->assertCreated();
        $path=$upload->json('data.path');
        $id=$this->postJson('/api/v1/admin/genres',['name'=>'Adventure','image_path'=>$path])->assertCreated()->json('data.id');
        $this->getJson('/api/v1/home')->assertOk()->assertJsonPath('genres.0.image_url',Storage::disk('public')->url($path));
        $asset=MediaAsset::where('path',$path)->firstOrFail();
        $this->deleteJson('/api/v1/admin/media/'.$asset->id)->assertUnprocessable();
        $this->putJson('/api/v1/admin/genres/'.$id,['name'=>'Fantasy','image_path'=>'https://example.com/fantasy.webp'])->assertOk();
        $this->getJson('/api/v1/genres')->assertOk()->assertJsonPath('0.image_url','https://example.com/fantasy.webp');
        $this->putJson('/api/v1/admin/genres/'.$id,['name'=>'Fantasy','image_path'=>null])->assertOk();
        $this->getJson('/api/v1/home')->assertOk()->assertJsonPath('genres.0.image_url',null);
    }

    public function test_category_images_reject_unsafe_or_missing_paths_and_non_staff(): void
    {
        $admin=User::create(['name'=>'Admin','email'=>'invalid-category@example.test','password'=>'password123','role'=>'admin']);
        $this->actingAs($admin);
        foreach(['javascript:alert(1)','../../secret','media/missing.jpg','http://example.com/image.jpg'] as $path) {
            $this->postJson('/api/v1/admin/genres',['name'=>'Invalid','image_path'=>$path])->assertUnprocessable();
        }
        $user=User::create(['name'=>'User','email'=>'category-user@example.test','password'=>'password123','role'=>'user']);
        $this->actingAs($user)->postJson('/api/v1/admin/genres',['name'=>'Unauthorized'])->assertForbidden();
    }
}
