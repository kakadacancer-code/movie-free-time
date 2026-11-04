<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
class AuthController {
 public function register(Request $r){
  $r->merge(['email'=>strtolower(trim((string)$r->input('email')))]);
  $data=$r->validate(['name'=>'required|string|min:2|max:80','email'=>'required|email|max:190|unique:users,email','password'=>'required|string|min:8|confirmed']);
  $user=User::create(['name'=>$data['name'],'email'=>strtolower($data['email']),'password'=>$data['password'],'role'=>'user']);
  Auth::guard('web')->login($user);$r->session()->regenerate();
  return response()->json(['message'=>'Welcome to FrameVerse','user'=>$user],201);
 }
 public function login(Request $r){
  $data=$r->validate(['email'=>'required|email','password'=>'required|string']);
  $data['email']=strtolower($data['email']);
  if(!Auth::guard('web')->attempt($data)) throw ValidationException::withMessages(['email'=>['These credentials do not match our records.']]);
  if(!$r->user()->is_active){Auth::guard('web')->logout();throw ValidationException::withMessages(['email'=>['Your account is suspended.']]);}
  $r->session()->regenerate(); return response()->json(['user'=>$r->user()]);
 }
 public function logout(Request $r){Auth::guard('web')->logout();$r->session()->invalidate();$r->session()->regenerateToken();return response()->json(['message'=>'Logged out']);}
 public function me(Request $r){return response()->json(['user'=>$r->user()]);}
 public function update(Request $r){
  $data=$r->validate(['name'=>'sometimes|required|string|min:2|max:80','bio'=>'nullable|string|max:500','current_password'=>'required_with:password|current_password:web','password'=>'sometimes|required|min:8|confirmed']);
  unset($data['current_password']);
  $r->user()->update($data);return response()->json(['user'=>$r->user()->fresh(),'message'=>'Profile updated']);
 }
}
