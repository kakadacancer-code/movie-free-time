<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class MediaAsset extends Model {
 protected $fillable=['user_id','path','original_name','mime_type','size']; public function uploader(){return $this->belongsTo(User::class,'user_id');}
}
