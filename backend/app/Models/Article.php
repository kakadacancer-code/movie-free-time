<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
class Article extends Model {
 use SoftDeletes;
 protected $fillable=['user_id','title','slug','excerpt','body','category_id','featured_image','publication_status','published_at','seo_title','meta_description','views_count'];
 protected $appends=['image_url'];
 protected function casts():array {return ['published_at'=>'datetime','views_count'=>'integer'];}
 public function getImageUrlAttribute(){return $this->featured_image ? (str_starts_with($this->featured_image,'https://')?$this->featured_image:Storage::disk('public')->url($this->featured_image)):null;}
 public function category(){return $this->belongsTo(ArticleCategory::class,'category_id');}
 public function author(){return $this->belongsTo(User::class,'user_id');}
 public function comments(){return $this->hasMany(Comment::class);}
 public function scopePublished($query){return $query->where('publication_status','published')->where(fn($q)=>$q->whereNull('published_at')->orWhere('published_at','<=',now()));}
}
