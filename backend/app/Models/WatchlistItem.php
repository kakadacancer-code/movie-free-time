<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class WatchlistItem extends Model {
 protected $fillable=['user_id','media_title_id','status','is_favorite']; protected function casts():array{return ['is_favorite'=>'boolean'];} public function title(){return $this->belongsTo(MediaTitle::class,'media_title_id');}
}
