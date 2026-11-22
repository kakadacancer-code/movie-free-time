<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Episode extends Model {
 protected $fillable = ['media_title_id', 'episode_number', 'title', 'video_path', 'video_sources', 'subtitles'];
 protected function casts(): array { return ['video_sources' => 'array', 'subtitles' => 'array', 'episode_number' => 'integer']; }
 public function mediaTitle() { return $this->belongsTo(MediaTitle::class); }
 public function toApi(string $slug): array {
  return [...\App\Support\Playback::toApi($this, '/api/v1/titles/'.rawurlencode($slug).'/episodes/'.$this->episode_number),
   'id' => $this->id,
   'media_title_id' => $this->media_title_id,
   'episode_number' => $this->episode_number,
   'title' => $this->title,
   'label' => $this->title ?: 'Episode '.$this->episode_number,
   'has_video' => (bool) ($this->video_path || $this->video_sources),
   'video_url' => $this->video_path ? '/api/v1/titles/'.rawurlencode($slug).'/episodes/'.$this->episode_number.'/video' : null,
  ];
 }
}