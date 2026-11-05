<?php
namespace App\Http\Controllers;
use App\Models\Article;
use App\Models\AuditLog;
use App\Models\Comment;
use App\Models\Genre;
use App\Models\MediaAsset;
use App\Models\MediaTitle;
use App\Models\Report;
use App\Models\Review;
use App\Models\SiteSetting;
use App\Models\User;
use App\Support\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
class AdminController {
 public function dashboard(){
  return response()->json(['stats'=>[
   'movies'=>MediaTitle::where('content_type','movie')->count(), 'anime'=>MediaTitle::where('content_type','anime')->count(),
   'published'=>MediaTitle::where('publication_status','published')->count(), 'drafts'=>MediaTitle::where('publication_status','draft')->count(),
   'articles'=>Article::count(),'users'=>User::count(),'pending_reviews'=>Review::where('status','pending')->count()+Comment::where('status','pending')->count(),
   'views'=>MediaTitle::sum('views_count')+Article::sum('views_count'),
  ],'recent_titles'=>MediaTitle::with('genres')->latest()->limit(6)->get(),
   'activity'=>AuditLog::with('user:id,name')->latest()->limit(7)->get(),
   'popular'=>MediaTitle::orderByDesc('views_count')->limit(5)->get(['id','title','content_type','views_count']),
  ]);
 }
 public function analytics(){
  return response()->json(['popular'=>MediaTitle::orderByDesc('views_count')->limit(10)->get(['id','title','views_count','average_rating']),
   'genre_counts'=>Genre::withCount('titles')->orderByDesc('titles_count')->limit(10)->get(['id','name']),
   'recent_users'=>User::latest()->limit(10)->get(['id','name','created_at']),
   'totals'=>['ratings'=>\App\Models\Rating::count(),'reviews'=>Review::count(),'watchlist'=>\App\Models\WatchlistItem::count()]]);
 }
 public function users(Request $r){$q=User::latest();if($r->filled('q'))$q->where(fn($s)=>$s->whereLike('name','%'.$r->q.'%')->orWhereLike('email','%'.$r->q.'%'));return $q->paginate(20);}
 public function updateUser(Request $r,int $id){
  $user=User::findOrFail($id);$d=$r->validate(['role'=>'sometimes|in:user,editor,admin','is_active'=>'sometimes|boolean']);
  if($id===$r->user()->id && (isset($d['role'])&&$d['role']!=='admin'||isset($d['is_active'])&&!$d['is_active']))return response()->json(['message'=>'You cannot demote or suspend your own admin account'],422);
  $user->update($d);Activity::record('updated','user',$id,['fields'=>array_keys($d)]);return response()->json(['data'=>$user,'message'=>'User updated']);
 }
 public function moderation(Request $r){return response()->json(['reviews'=>Review::with('user:id,name','title:id,title')->where('status',$r->query('status','pending'))->latest()->limit(50)->get(),
   'comments'=>Comment::with('user:id,name','article:id,title')->where('status',$r->query('status','pending'))->latest()->limit(50)->get()]);}
 public function moderate(Request $r,string $type,int $id){
  $d=$r->validate(['status'=>'required|in:approved,hidden,pending']);
  $model=match($type){'reviews'=>Review::class,'comments'=>Comment::class,default=>null};if(!$model)abort(404);
  $item=$model::findOrFail($id);$item->update($d);Activity::record('moderated',$type,$id,['status'=>$d['status']]);return response()->json(['message'=>'Moderation updated']);
 }
 public function reports(){return Report::with('user:id,name')->latest()->paginate(20);}
 public function resolveReport(int $id){$report=Report::findOrFail($id);$report->update(['status'=>'resolved']);Activity::record('resolved','report',$id);return response()->json(['message'=>'Report resolved']);}
 public function media(){return MediaAsset::latest()->paginate(32)->through(fn($asset)=>['id'=>$asset->id,'name'=>$asset->original_name,'size'=>$asset->size,'mime_type'=>$asset->mime_type,'url'=>Storage::disk('public')->url($asset->path),'path'=>$asset->path]);}
 public function upload(Request $r){
  $d=$r->validate(['file'=>'required|image|mimes:jpg,jpeg,png,webp|max:5120']);
  $file=$d['file'];$path=$file->store('media/'.date('Y/m'),'public');
  $asset=MediaAsset::create(['user_id'=>$r->user()->id,'path'=>$path,'original_name'=>$file->getClientOriginalName(),'mime_type'=>$file->getMimeType(),'size'=>$file->getSize()]);
  Activity::record('uploaded','asset',$asset->id);return response()->json(['message'=>'Image uploaded','data'=>['id'=>$asset->id,'path'=>$path,'url'=>Storage::disk('public')->url($path)]],201);
 }
 public function deleteMedia(int $id){
  $asset=MediaAsset::findOrFail($id);
  if(Genre::where('image_path',$asset->path)->exists()||MediaTitle::where('poster_path',$asset->path)->orWhere('backdrop_path',$asset->path)->exists()||Article::where('featured_image',$asset->path)->exists())return response()->json(['message'=>'Image is in use and cannot be deleted.'],422);
  Storage::disk('public')->delete($asset->path);$asset->delete();Activity::record('deleted','asset',$id);return response()->json(['message'=>'Image deleted']);
 }
 public function settings(){return response()->json(array_merge(SiteSetting::pluck('value','key')->all(),['home_sections'=>\App\Support\Homepage::sections()]));}
 public function updateSettings(Request $r){
  $keys=['site_name','tagline','hero_title','hero_subtitle','footer_text','social_instagram','social_youtube','discovery_title','discovery_subtitle'];
  $rules=array_fill_keys($keys,'nullable|string|max:500');
  $rules['home_sections']='sometimes|array:trending,movies,anime,categories,donghua';
  foreach(array_keys(\App\Support\Homepage::defaults()) as $section){
   $rules["home_sections.$section"]='sometimes|array:title,subtitle,limit,enabled';
   $rules["home_sections.$section.title"]='required_with:home_sections.'.$section.'|string|max:100';
   $rules["home_sections.$section.subtitle"]='nullable|string|max:300';
   $rules["home_sections.$section.limit"]='required_with:home_sections.'.$section.'|integer|between:1,24';
   $rules["home_sections.$section.enabled"]='required_with:home_sections.'.$section.'|boolean';
  }
  $data=$r->validate($rules);
  if(isset($data['home_sections']))$data['home_sections']=json_encode($data['home_sections']);
  foreach($data as $key=>$value)SiteSetting::updateOrCreate(['key'=>$key],['value'=>$value]);
  Activity::record('updated','settings');return response()->json(['message'=>'Settings saved','data'=>SiteSetting::pluck('value','key')]);
 }
 public function auditLogs(){return AuditLog::with('user:id,name')->latest()->paginate(30);}
}
