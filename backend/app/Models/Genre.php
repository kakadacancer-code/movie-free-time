<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Genre extends Model {
 protected $fillable=['name','slug','description'];
 public function titles(){return $this->belongsToMany(MediaTitle::class,'media_genres');}
}
