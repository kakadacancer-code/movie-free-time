<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Rating extends Model {
 protected $fillable=['user_id','media_title_id','score']; public function title(){return $this->belongsTo(MediaTitle::class,'media_title_id');}
}
