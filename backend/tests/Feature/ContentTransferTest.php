<?php
namespace Tests\Feature;

use App\Models\User;
use App\Support\ContentTransfer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ContentTransferTest extends TestCase
{
    use RefreshDatabase;

    public function test_round_trip_preserves_relationships_and_removes_session_tokens(): void
    {
        $user = User::create(['name'=>'Author', 'email'=>'author@example.test', 'password'=>'password123', 'role'=>'admin', 'remember_token'=>'secret']);
        DB::table('articles')->insert(['id'=>12, 'user_id'=>$user->id, 'title'=>'News', 'slug'=>'news', 'body'=>'Article body', 'publication_status'=>'published', 'published_at'=>'2026-11-10 10:00:00+00']);
        $transfer = new ContentTransfer;
        $payload = json_decode(json_encode($transfer->export()), true);
        DB::table('articles')->delete();
        DB::table('users')->delete();
        $transfer->import($payload);
        $this->assertDatabaseHas('articles', ['id'=>12, 'user_id'=>$user->id, 'published_at'=>'2026-11-10 10:00:00']);
        $this->assertDatabaseHas('users', ['id'=>$user->id, 'remember_token'=>null]);
        $this->assertTrue(password_verify('password123', DB::table('users')->value('password')));
    }

    public function test_import_refuses_existing_data(): void
    {
        $transfer = new ContentTransfer;
        $payload = $transfer->export();
        User::create(['name'=>'Existing', 'email'=>'existing@example.test', 'password'=>'password123']);
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('empty application tables');
        $transfer->import($payload);
    }

    public function test_failed_import_rolls_back_inserted_rows(): void
    {
        $transfer = new ContentTransfer;
        $payload = $transfer->export();
        $payload['tables']['genres'] = [['id'=>1, 'name'=>'Drama', 'slug'=>'drama']];
        $payload['tables']['media_genres'] = [['media_title_id'=>999, 'genre_id'=>1]];
        try {
            $transfer->import($payload);
            $this->fail('Invalid relationship should fail.');
        } catch (\Illuminate\Database\QueryException $exception) {
            $this->assertDatabaseCount('genres', 0);
        }
    }
}
