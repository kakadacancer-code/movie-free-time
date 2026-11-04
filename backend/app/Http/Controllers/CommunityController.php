<?php
namespace App\Http\Controllers;
use App\Models\Article;
use App\Models\Comment;
use App\Models\MediaTitle;
use App\Models\Rating;
use App\Models\Report;
use App\Models\Review;
use App\Models\WatchlistItem;
use App\Http\Resources\TitleResource;
use Illuminate\Http\Request;
class CommunityController {
 public function watchlist(Request $r){
  return WatchlistItem::where('user_id',$r->user()->id)->whereHas('title',fn($q)=>$q->published())->with('title.genres')->latest()->get()->map(fn($item)=>['id'=>$item->id,'status'=>$item->status,'is_favorite'=>$item->is_favorite,'title'=>new TitleResource($item->title)]);
 }
 public function saveWatchlist(Request $r){
  $data=$r->validate(['media_title_id'=>'required|exists:media_titles,id','status'=>'sometimes|in:planned,watching,completed,on_hold,dropped','is_favorite'=>'sometimes|boolean']);
  MediaTitle::published()->findOrFail($data['media_title_id']);
  $item=WatchlistItem::firstOrNew(['user_id'=>$r->user()->id,'media_title_id'=>$data['media_title_id']]);
  $item->fill(collect($data)->only(['status','is_favorite'])->all());$item->save();
  return response()->json(['message'=>'Watchlist saved','data'=>$item]);
 }
 public function removeWatchlist(Request $r,int $id){WatchlistItem::where('user_id',$r->user()->id)->findOrFail($id)->delete();return response()->json(['message'=>'Removed from watchlist']);}
 public function rate(Request $r,int $id){
  $data=$r->validate(['score'=>'required|integer|between:1,10']);
  $title=MediaTitle::published()->findOrFail($id);
  Rating::updateOrCreate(['user_id'=>$r->user()->id,'media_title_id'=>$id],['score'=>$data['score']]);$title->refreshRatings();
  return response()->json(['message'=>'Rating saved','average_rating'=>(float)$title->average_rating]);
 }
 public function review(Request $r,int $id){
  $data=$r->validate(['body'=>'required|string|min:10|max:2000']);MediaTitle::published()->findOrFail($id);
  $review=Review::updateOrCreate(['user_id'=>$r->user()->id,'media_title_id'=>$id],['body'=>$data['body'],'status'=>'pending']);
  return response()->json(['message'=>'Review submitted for moderation','data'=>$review]);
 }
 public function reviews(int $id){return Review::where('media_title_id',$id)->where('status','approved')->with('user:id,name')->latest()->paginate(10);}
 public function comment(Request $r,int $id){
  $data=$r->validate(['body'=>'required|string|min:2|max:1500']);Article::published()->findOrFail($id);
  $comment=Comment::create(['user_id'=>$r->user()->id,'article_id'=>$id,'body'=>$data['body'],'status'=>'pending']);
  return response()->json(['message'=>'Comment submitted for moderation','data'=>$comment],201);
 }
 public function report(Request $r){
  $data=$r->validate(['review_id'=>'nullable|exists:reviews,id','comment_id'=>'nullable|exists:comments,id','reason'=>'required|string|min:8|max:800']);
  if(empty($data['review_id']) && empty($data['comment_id'])) return response()->json(['message'=>'Please select content to report'],422);
  $report=Report::create(['user_id'=>$r->user()->id,'review_id'=>$data['review_id']??null,'comment_id'=>$data['comment_id']??null,'reason'=>$data['reason']]);
  return response()->json(['message'=>'Report received','data'=>$report],201);
 }
}
