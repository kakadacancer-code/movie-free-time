<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  foreach (['media_titles', 'episodes'] as $table) Schema::table($table, function (Blueprint $t) {
   $t->json('video_sources')->nullable();
   $t->json('subtitles')->nullable();
  });
 }
 public function down(): void {
  foreach (['media_titles', 'episodes'] as $table) Schema::table($table, fn (Blueprint $t) => $t->dropColumn(['video_sources', 'subtitles']));
 }
};
