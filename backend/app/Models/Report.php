<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Report extends Model {
 protected $fillable=['user_id','review_id','comment_id','reason','status']; public function user(){return $this->belongsTo(User::class);}
}
