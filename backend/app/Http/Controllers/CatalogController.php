<?php
namespace App\Http\Controllers;
use App\Http\Resources\TitleResource;
use App\Models\Article;
use App\Models\ArticleCategory;
use App\Models\Genre;
use App\Models\MediaTitle;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
class CatalogController {
 private function query(Request $r,?string $type=null){
  $q=MediaTitle::published()->with('genres');
  if($type) $q->where('content_type',$type);
  if($r->filled('type') && !$type && in_array($r->type,['movie','anime','donghua'])) $q->where('content_type',$r->type);
  if($r->filled('q')) $q->where(fn($s)=>$s->whereLike('title','%'.$r->q.'%')->orWhereLike('synopsis','%'.$r->q.'%'));
  if($r->filled('genre')) $q->whereHas('genres',fn($g)=>$g->where('slug',$r->genre));
  if($r->filled('year')) $q->where('release_year',(int)$r->year);
  if($r->filled('min_rating')) $q->where('average_rating','>=',max(0,min(10,(float)$r->min_rating)));
  if($r->filled('status')) $q->where('release_status',$r->status);
  if($r->filled('format')) $q->where('format',$r->format);
  if($r->filled('country')) $q->where('country',$r->country);
  $sort=$r->query('sort','popular');
  match($sort){
   'rating'=>$q->orderByDesc('average_rating'), 'newest'=>$q->orderByDesc('release_year'),
   'oldest'=>$q->orderBy('release_year'), 'title'=>$q->orderBy('title'),
   'recent'=>$q->latest(), default=>$q->orderByDesc('views_count')->orderByDesc('created_at')
  };return $q;
 }
 public function index(Request $r){return TitleResource::collection($this->query($r)->paginate(min(48,max(1,(int)$r->query('per_page',12)))));}
 public function movies(Request $r){return TitleResource::collection($this->query($r,'movie')->paginate(min(48,max(1,(int)$r->query('per_page',12)))));}
 public function anime(Request $r){return TitleResource::collection($this->query($r,'anime')->paginate(min(48,max(1,(int)$r->query('per_page',12)))));}
 public function donghua(Request $r){return TitleResource::collection($this->query($r,'donghua')->paginate(min(48,max(1,(int)$r->query('per_page',12)))));}
 public function show(string $slug){
  $title=MediaTitle::published()->with('genres','episodes')->where('slug',$slug)->firstOrFail();
  $title->increment('views_count');
  $related=MediaTitle::published()->with('genres')->where('content_type',$title->content_type)->whereKeyNot($title->id)->latest()->limit(6)->get();
  return response()->json(['data'=>(new TitleResource($title))->resolve(),'episodes'=>$title->episodes->map(fn($e)=>$e->toApi($title->slug))->values(),'related'=>TitleResource::collection($related)->resolve()]);
 }
 public function genres(){return Genre::withCount(['titles'=>fn($q)=>$q->published()])->orderBy('name')->get();}
 public function categories(){return ArticleCategory::withCount('articles')->orderBy('name')->get();}
 public function settings(){return SiteSetting::whereIn('key',['site_name','tagline','hero_title','hero_subtitle','footer_text','social_instagram','social_youtube','discovery_title','discovery_subtitle'])->pluck('value','key');}
 public function home(){
  $sections=\App\Support\Homepage::sections();
  $limit=fn($key)=>(int)$sections[$key]['limit'];
  $published=MediaTitle::published()->with('genres');
  $featured=(clone $published)->where('featured',true)->latest()->first()??(clone $published)->latest()->first();
  return response()->json([
   'sections'=>$sections,
   'featured'=>$featured?(new TitleResource($featured))->resolve():null,
   'trending'=>TitleResource::collection((clone $published)->orderByDesc('views_count')->limit($limit('trending'))->get())->resolve(),
   'movies'=>TitleResource::collection((clone $published)->where('content_type','movie')->latest()->limit($limit('movies'))->get())->resolve(),
   'anime'=>TitleResource::collection((clone $published)->where('content_type','anime')->latest()->limit($limit('anime'))->get())->resolve(),
   'donghua'=>TitleResource::collection((clone $published)->where('content_type','donghua')->latest()->limit($limit('donghua'))->get())->resolve(),
   'genres'=>Genre::withCount(['titles'=>fn($q)=>$q->published()])->orderByDesc('titles_count')->limit($limit('categories'))->get(),
  ]);
 }
 public function articles(Request $r){
  $q=Article::published()->with('category','author:id,name')->latest();
  if($r->filled('q')) $q->whereLike('title','%'.$r->q.'%');
  if($r->filled('category')) $q->whereHas('category',fn($s)=>$s->where('slug',$r->category));
  return $q->paginate(min(30,max(1,(int)$r->query('per_page',9))));
 }
 public function article(string $slug){
  $article=Article::published()->with('category','author:id,name')->where('slug',$slug)->firstOrFail();
  $article->increment('views_count');
  $article->setRelation('comments',$article->comments()->where('status','approved')->with('user:id,name')->latest()->get());
  return response()->json(['data'=>$article]);
 }
 public function search(Request $r){
  $q=trim((string)$r->query('q',''));
  if(mb_strlen($q)<2)return response()->json(['titles'=>[],'articles'=>[],'genres'=>[]]);
  return response()->json(['titles'=>TitleResource::collection(MediaTitle::published()->with('genres')->whereLike('title',"%{$q}%")->limit(6)->get())->resolve(),
   'articles'=>Article::published()->whereLike('title',"%{$q}%")->select('id','title','slug','excerpt')->limit(4)->get(),
   'genres'=>Genre::whereLike('name',"%{$q}%")->limit(4)->get()]);
 }
}