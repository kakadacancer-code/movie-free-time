<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Genre extends Model {
 protected $fillable=['name','slug','description','image_path'];
 protected $appends=['image_url'];
 public function getImageUrlAttribute():?string {
  if(!$this->image_path)return null;
  return str_starts_with($this->image_path,'https://')?$this->image_path:\Illuminate\Support\Facades\Storage::disk('public')->url($this->image_path);
 }
 public function titles(){return $this->belongsToMany(MediaTitle::class,'media_genres');}
}
