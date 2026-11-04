<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
class User extends Authenticatable {
 use HasFactory,Notifiable,HasApiTokens;
 protected $fillable=['name','email','password','role','is_active','avatar_path','bio'];
 protected $attributes=['role'=>'user','is_active'=>true];
 protected $hidden=['password','remember_token'];
 protected function casts(): array { return ['email_verified_at'=>'datetime','password'=>'hashed','is_active'=>'boolean']; }
 public function watchlist(){return $this->hasMany(WatchlistItem::class);}
 public function reviews(){return $this->hasMany(Review::class);}
}
