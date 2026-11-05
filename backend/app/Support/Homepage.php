<?php
namespace App\Support;
use App\Models\SiteSetting;
class Homepage {
 public static function defaults():array {return [
  'trending'=>['title'=>'Trending Right Now','subtitle'=>'Discover what everyone is watching.','limit'=>10,'enabled'=>true],
  'categories'=>['title'=>'Explore by Category','subtitle'=>'Find something that matches your mood.','limit'=>8,'enabled'=>true],
  'donghua'=>['title'=>'Discover Donghua','subtitle'=>'Explore Chinese animation and unforgettable stories.','limit'=>10,'enabled'=>true],
  'movies'=>['title'=>'Explore Movies','subtitle'=>'Find your next favorite movie.','limit'=>10,'enabled'=>true],
  'anime'=>['title'=>'Discover Anime','subtitle'=>'Explore amazing anime stories.','limit'=>10,'enabled'=>true],
 ];}
 public static function sections():array {
  $saved=SiteSetting::where('key','home_sections')->value('value');
  $saved=json_decode($saved??'{}',true)??[];
  $sections=self::defaults();
  foreach($sections as $key=>$defaults)$sections[$key]=array_replace($defaults,$saved[$key]??[]);
  return $sections;
 }
}
