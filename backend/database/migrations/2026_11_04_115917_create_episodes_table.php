<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('episodes', function (Blueprint $table) {
   $table->id();
   $table->foreignId('media_title_id')->constrained()->cascadeOnDelete();
   $table->unsignedSmallInteger('episode_number');
   $table->string('title', 160)->nullable();
   $table->string('video_path')->nullable();
   $table->timestamps();
   $table->unique(['media_title_id', 'episode_number']);
  });
 }
 public function down(): void { Schema::dropIfExists('episodes'); }
};