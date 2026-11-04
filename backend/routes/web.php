<?php
use Illuminate\Support\Facades\Route;
Route::get('/', fn () => response()->json(['app'=>'FrameVerse API','version'=>'v1','status'=>'ok']));
