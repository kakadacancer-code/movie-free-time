<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Review extends Model {
 protected $fillable=['user_id','media_title_id','body','status']; public function user(){return $this->belongsTo(User::class);} public function title(){return $this->belongsTo(MediaTitle::class,'media_title_id');}
}
