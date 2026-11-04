<?php
namespace App\Http\Controllers;
use App\Models\Genre;
use App\Models\MediaTitle;
use App\Support\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
class ImportController {
 private function lookup(string $provider,string $query):array {
  if($provider==='tmdb'){
   $key=config('services.tmdb.key'); if(!$key)abort(422,'Add TMDB_API_KEY in backend/.env to enable movie imports.');
   $res=Http::timeout(12)->get('https://api.themoviedb.org/3/search/movie',['api_key'=>$key,'query'=>$query]);
   if(!$res->successful())abort(502,'TMDB could not be reached.');
   return collect($res->json('results',[]))->take(12)->map(fn($t)=>['id'=>(string)$t['id'],'title'=>$t['title']??'Unknown','year'=>substr($t['release_date']??'',0,4),'poster_url'=>isset($t['poster_path'])&&$t['poster_path']?'https://image.tmdb.org/t/p/w500'.$t['poster_path']:null,'synopsis'=>$t['overview']??''])->values()->all();
  }
  $graphql='query ($search: String) { Page(perPage:12) { media(search:$search,type:ANIME) { id title { english romaji } description(asHtml:false) coverImage { large } startDate { year } } } }';
  $res=Http::timeout(12)->post(config('services.anilist.url'),['query'=>$graphql,'variables'=>['search'=>$query]]);
  if(!$res->successful()||$res->json('errors'))abort(502,'AniList could not be reached.');
  return collect($res->json('data.Page.media',[]))->map(fn($a)=>['id'=>(string)$a['id'],'title'=>$a['title']['english']??$a['title']['romaji'],'year'=>$a['startDate']['year']??null,'poster_url'=>$a['coverImage']['large']??null,'synopsis'=>strip_tags($a['description']??'')])->all();
 }
 public function search(Request $r){$d=$r->validate(['provider'=>'required|in:tmdb,anilist','q'=>'required|string|min:2|max:100']);return response()->json(['data'=>$this->lookup($d['provider'],$d['q'])]);}
 private function details(string $provider,string $id):array {
  if($provider==='tmdb'){
   if(!config('services.tmdb.key'))abort(422,'TMDB_API_KEY not configured.');
   $res=Http::timeout(12)->get("https://api.themoviedb.org/3/movie/{$id}",['api_key'=>config('services.tmdb.key')]);
   if(!$res->successful())abort(502,'TMDB detail fetch failed.');$d=$res->json();
   return ['title'=>$d['title']??'Untitled','synopsis'=>$d['overview']??'', 'original_title'=>$d['original_title']??null,'release_date'=>!empty($d['release_date'])?$d['release_date']:null,'release_year'=>(int)substr($d['release_date']??'0',0,4)?:null,'runtime_minutes'=>$d['runtime']??null,'poster_path'=>!empty($d['poster_path'])?'https://image.tmdb.org/t/p/w500'.$d['poster_path']:null,'backdrop_path'=>!empty($d['backdrop_path'])?'https://image.tmdb.org/t/p/original'.$d['backdrop_path']:null,'genres'=>array_column($d['genres']??[],'name'),'content_type'=>'movie'];
  }
  $query='query ($id: Int) { Media(id:$id,type:ANIME) { title { english romaji native } description(asHtml:false) startDate { year month day } episodes format status season coverImage { extraLarge } bannerImage genres studios(isMain:true) { nodes { name } } } }';
  $res=Http::timeout(12)->post(config('services.anilist.url'),['query'=>$query,'variables'=>['id'=>(int)$id]]);
  if(!$res->successful()||$res->json('errors'))abort(502,'AniList detail fetch failed.');$d=$res->json('data.Media',[]);$date=$d['startDate']??[];
  return ['title'=>$d['title']['english']??$d['title']['romaji']??'Untitled','original_title'=>$d['title']['native']??null,'synopsis'=>trim(strip_tags($d['description']??'')),'release_date'=>!empty($date['year'])&& !empty($date['month'])&& !empty($date['day'])?sprintf('%04d-%02d-%02d',$date['year'],$date['month'],$date['day']):null,'release_year'=>$date['year']??null,'episodes_count'=>$d['episodes']??null,'format'=>$d['format']??null,'release_status'=>$d['status']??null,'season'=>$d['season']??null,'studio'=>$d['studios']['nodes'][0]['name']??null,'poster_path'=>$d['coverImage']['extraLarge']??null,'backdrop_path'=>$d['bannerImage']??null,'genres'=>$d['genres']??[],'content_type'=>'anime'];
 }
 public function confirm(Request $r){
  $data=$r->validate(['provider'=>'required|in:tmdb,anilist','ids'=>'required|array|min:1|max:10','ids.*'=>'required|integer|min:1']);
  $imported=[];$skipped=[];
  foreach(array_unique($data['ids']) as $id){
   if(MediaTitle::withTrashed()->where('external_source',$data['provider'])->where('external_id',(string)$id)->exists()){ $skipped[]=$id;continue; }
   $item=$this->details($data['provider'],(string)$id);
   $genres=$item['genres'];unset($item['genres']);
   $item['synopsis']=Str::limit($item['synopsis']?:'Synopsis currently unavailable. Please edit this draft.',10000,'');
   $item['external_source']=$data['provider'];$item['external_id']=(string)$id;
   $item['slug']=Str::slug($item['title']).'-'.Str::lower(Str::random(6));$item['publication_status']='draft';
   $title=DB::transaction(function()use($item,$genres){
    $t=MediaTitle::create($item);
    $ids=collect($genres)->map(fn($name)=>Genre::firstOrCreate(['slug'=>Str::slug($name)],['name'=>$name])->id)->all();
    $t->genres()->sync($ids);return $t;
   });
   Activity::record('imported','title',$title->id,['source'=>$data['provider']]);$imported[]=['id'=>$title->id,'title'=>$title->title];
  }
  return response()->json(['message'=>'Import finished. Imported titles are drafts.','imported'=>$imported,'skipped'=>$skipped]);
 }
}
