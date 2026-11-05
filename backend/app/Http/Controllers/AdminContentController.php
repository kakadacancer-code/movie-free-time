<?php
namespace App\Http\Controllers;
use App\Models\Article;
use App\Models\ArticleCategory;
use App\Models\Genre;
use App\Models\MediaTitle;
use App\Support\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
class AdminContentController {
 public function titles(Request $r){
  $q=MediaTitle::with('genres')->latest();
  if(in_array($r->query('type'),['movie','anime','donghua']))$q->where('content_type',$r->query('type'));
  if($r->filled('status'))$q->where('publication_status',$r->status);
  if($r->filled('q'))$q->whereLike('title','%'.$r->q.'%');
  return $q->paginate(15);
 }
 private function validateTitle(Request $r,?MediaTitle $title=null):array {
  return $r->validate([
    'title'=>'required|string|min:1|max:200','original_title'=>'nullable|string|max:200',
    'slug'=>['nullable','alpha_dash','max:220',Rule::unique('media_titles','slug')->ignore($title?->id)],
    'content_type'=>'required|in:movie,anime,donghua','synopsis'=>'required|string|min:15|max:10000',
    'poster_path'=>'nullable|string|max:2048','backdrop_path'=>'nullable|string|max:2048',
    'video_path'=>['nullable','string','max:255',function($attribute,$value,$fail){if(!preg_match('~^videos/[a-zA-Z0-9]+\.(mp4|webm)$~',$value)||!\Illuminate\Support\Facades\Storage::disk('local')->exists($value))$fail('Please upload a valid movie video first.');}],
    'trailer_url'=>'nullable|url|max:2048','release_date'=>'nullable|date','release_year'=>'nullable|integer|between:1880,2100',
    'runtime_minutes'=>'nullable|integer|between:1,1500','country'=>'nullable|string|max:80',
    'original_language'=>'nullable|string|max:30','age_rating'=>'nullable|string|max:24','release_status'=>'nullable|string|max:50',
    'publication_status'=>'required|in:draft,published,archived','featured'=>'boolean','format'=>'nullable|string|max:30','episodes_count'=>'nullable|integer|between:0,10000','studio'=>'nullable|string|max:150','season'=>'nullable|string|max:30',
    'seo_title'=>'nullable|string|max:190','meta_description'=>'nullable|string|max:300',
    'genre_ids'=>'array','genre_ids.*'=>'integer|exists:genres,id',
  ]);
 }
 public function storeTitle(Request $r){
  $data=$this->validateTitle($r);
  $slug=$data['slug']??Str::slug($data['title']).'-'.Str::lower(Str::random(5));
  $genres=$data['genre_ids']??[];unset($data['genre_ids']);$data['slug']=$slug;
  if($data['publication_status']==='published')$data['published_at']=now();
  $title=DB::transaction(function()use($data,$genres){$t=MediaTitle::create($data);$t->genres()->sync($genres);return $t;});
  Activity::record('created','title',$title->id);return response()->json(['message'=>'Title created','data'=>$title->load('genres')],201);
 }
 public function updateTitle(Request $r,int $id){
  $title=MediaTitle::findOrFail($id);$data=$this->validateTitle($r,$title);
  $genres=$data['genre_ids']??[];unset($data['genre_ids']);
  if(empty($data['slug']))unset($data['slug']);
  if($data['publication_status']==='published'&&!$title->published_at)$data['published_at']=now();
  DB::transaction(function()use($title,$data,$genres){$title->update($data);$title->genres()->sync($genres);});
  Activity::record('updated','title',$title->id);return response()->json(['message'=>'Title updated','data'=>$title->fresh('genres')]);
 }
 public function deleteTitle(int $id){$title=MediaTitle::findOrFail($id);$title->delete();Activity::record('deleted','title',$id);return response()->json(['message'=>'Title moved to trash']);}
 public function bulkTitles(Request $r){
  $d=$r->validate(['ids'=>'required|array|min:1|max:100','ids.*'=>'integer|exists:media_titles,id','action'=>'required|in:publish,draft,archive,delete']);
  $q=MediaTitle::whereIn('id',$d['ids']);
  if($d['action']==='delete')$count=$q->delete();else $count=$q->update(['publication_status'=>match($d['action']){'publish'=>'published','archive'=>'archived',default=>'draft'},'published_at'=>$d['action']==='publish'?now():null]);
  Activity::record('bulk_'.$d['action'],'title',null,['ids'=>$d['ids']]);return response()->json(['message'=>"Updated {$count} titles"]);
 }
 public function articles(Request $r){$q=Article::with('category','author:id,name')->latest();if($r->filled('q'))$q->whereLike('title','%'.$r->q.'%');if($r->filled('status'))$q->where('publication_status',$r->status);return $q->paginate(15);}
 private function articleData(Request $r,?Article $a=null){return $r->validate(['title'=>'required|string|max:200','slug'=>['nullable','alpha_dash',Rule::unique('articles','slug')->ignore($a?->id)],'excerpt'=>'nullable|string|max:500','body'=>'required|string|min:20','category_id'=>'nullable|exists:article_categories,id','featured_image'=>'nullable|string|max:2048','publication_status'=>'required|in:draft,published,archived','seo_title'=>'nullable|string|max:190','meta_description'=>'nullable|string|max:300']);}
 public function storeArticle(Request $r){$data=$this->articleData($r);$data['user_id']=$r->user()->id;$data['slug']=$data['slug']??Str::slug($data['title']).'-'.Str::lower(Str::random(5));if($data['publication_status']==='published')$data['published_at']=now();$a=Article::create($data);Activity::record('created','article',$a->id);return response()->json(['message'=>'Article created','data'=>$a],201);}
 public function updateArticle(Request $r,int $id){$a=Article::findOrFail($id);$data=$this->articleData($r,$a);if(empty($data['slug']))unset($data['slug']);if($data['publication_status']==='published'&&!$a->published_at)$data['published_at']=now();$a->update($data);Activity::record('updated','article',$a->id);return response()->json(['message'=>'Article updated','data'=>$a->fresh()]);}
 public function deleteArticle(int $id){Article::findOrFail($id)->delete();Activity::record('deleted','article',$id);return response()->json(['message'=>'Article moved to trash']);}
 private function genreImageRules():array {return ['nullable','string','max:2048',function($attribute,$value,$fail){if(!preg_match('~^https://[^\s]+$~',$value)&&(!preg_match('~^media/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp)$~i',$value)||!\Illuminate\Support\Facades\Storage::disk('public')->exists($value)))$fail('Upload a category image or use an HTTPS image URL.');}];}
 public function storeGenre(Request $r){$data=$r->validate(['name'=>'required|string|max:80|unique:genres,name','description'=>'nullable|string|max:500','image_path'=>$this->genreImageRules()]);$data['slug']=Str::slug($data['name']);$g=Genre::create($data);Activity::record('created','genre',$g->id);return response()->json(['data'=>$g],201);}
 public function updateGenre(Request $r,int $id){$g=Genre::findOrFail($id);$data=$r->validate(['name'=>['required','string','max:80',Rule::unique('genres','name')->ignore($id)],'description'=>'nullable|string|max:500','image_path'=>$this->genreImageRules()]);$data['slug']=Str::slug($data['name']);$g->update($data);Activity::record('updated','genre',$id);return response()->json(['data'=>$g]);}
 public function deleteGenre(int $id){$g=Genre::findOrFail($id);if($g->titles()->exists())return response()->json(['message'=>'Genre is assigned to titles; remove assignments first.'],422);$g->delete();Activity::record('deleted','genre',$id);return response()->json(['message'=>'Genre removed']);}
 public function storeCategory(Request $r){$d=$r->validate(['name'=>'required|string|max:80|unique:article_categories,name']);$d['slug']=Str::slug($d['name']);$c=ArticleCategory::create($d);Activity::record('created','category',$c->id);return response()->json(['data'=>$c],201);}
 public function deleteCategory(int $id){$c=ArticleCategory::findOrFail($id);if($c->articles()->exists())return response()->json(['message'=>'Category still contains articles'],422);$c->delete();Activity::record('deleted','category',$id);return response()->json(['message'=>'Category removed']);}
}
