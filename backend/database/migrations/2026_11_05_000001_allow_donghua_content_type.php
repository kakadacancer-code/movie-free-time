<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up():void {
  if(DB::getDriverName()==='pgsql')DB::statement('ALTER TABLE media_titles DROP CONSTRAINT IF EXISTS media_titles_content_type_check');
  Schema::table('media_titles',function(Blueprint $table){$table->string('content_type')->change();});}
 public function down():void { /* Keep catalog types intact when rolling back. */ }
};
