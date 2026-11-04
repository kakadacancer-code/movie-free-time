<?php
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
class TitleResource extends JsonResource {
 public function toArray($request):array {
  return ['id'=>$this->id,'title'=>$this->title,'original_title'=>$this->original_title,'slug'=>$this->slug,'content_type'=>$this->content_type,'synopsis'=>$this->synopsis,'poster_url'=>$this->poster_url,'backdrop_url'=>$this->backdrop_url,'trailer_url'=>$this->trailer_url,'video_url'=>$this->video_path ? '/api/v1/titles/'.rawurlencode($this->slug).'/video' : null,'release_date'=>$this->release_date?->format('Y-m-d'),'release_year'=>$this->release_year,'runtime_minutes'=>$this->runtime_minutes,'country'=>$this->country,'original_language'=>$this->original_language,'age_rating'=>$this->age_rating,'release_status'=>$this->release_status,'publication_status'=>$this->publication_status,'average_rating'=>(float)$this->average_rating,'ratings_count'=>$this->ratings_count,'views_count'=>$this->views_count,'featured'=>$this->featured,'format'=>$this->format,'episodes_count'=>$this->episodes_count,'studio'=>$this->studio,'season'=>$this->season,'genres'=>$this->whenLoaded('genres',fn()=>$this->genres->map(fn($g)=>['id'=>$g->id,'name'=>$g->name,'slug'=>$g->slug])),'created_at'=>$this->created_at?->toIso8601String()];
 }
}
