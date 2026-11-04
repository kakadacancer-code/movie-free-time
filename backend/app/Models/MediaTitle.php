<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
class MediaTitle extends Model {
 use SoftDeletes;
 protected $fillable=['title','original_title','slug','content_type','synopsis','poster_path','backdrop_path','trailer_url','video_path','release_date','release_year','runtime_minutes','country','original_language','age_rating','release_status','publication_status','average_rating','ratings_count','views_count','featured','external_source','external_id','published_at','format','episodes_count','studio','season','seo_title','meta_description'];
 protected function casts():array {return ['featured'=>'boolean','release_date'=>'date:Y-m-d','published_at'=>'datetime','average_rating'=>'decimal:1','ratings_count'=>'integer','views_count'=>'integer','release_year'=>'integer'];}
 protected $appends=['poster_url','backdrop_url'];
 public function getPosterUrlAttribute(){return $this->mediaUrl($this->poster_path);}
 public function getBackdropUrlAttribute(){return $this->mediaUrl($this->backdrop_path);}
 private function mediaUrl(?string $path):?string { if (!$path) return null; return str_starts_with($path,'https://') ? $path : Storage::disk('public')->url($path); }
 public function genres(){return $this->belongsToMany(Genre::class,'media_genres');}
 public function episodes(){return $this->hasMany(Episode::class)->orderBy('episode_number');}
 public function reviews(){return $this->hasMany(Review::class);}
 public function ratings(){return $this->hasMany(Rating::class);}
 public function scopePublished($query){return $query->where('publication_status','published')->where(fn($q)=>$q->whereNull('published_at')->orWhere('published_at','<=',now()));}
 public function refreshRatings(){ $aggregate=$this->ratings()->selectRaw('COUNT(*) as total, AVG(score) as avg')->first(); $this->forceFill(['ratings_count'=>(int)$aggregate->total,'average_rating'=>round((float)($aggregate->avg??0),1)])->save(); }
}