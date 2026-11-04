<?php
namespace Database\Seeders;
use App\Models\Article;
use App\Models\ArticleCategory;
use App\Models\Genre;
use App\Models\MediaTitle;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
class DatabaseSeeder extends Seeder {
 public function run():void {
  $adminEmail=env('SEED_ADMIN_EMAIL','admin@frameverse.test');
  $adminPassword=env('SEED_ADMIN_PASSWORD');
  if($adminPassword){User::updateOrCreate(['email'=>$adminEmail],['name'=>'FrameVerse Admin','password'=>$adminPassword,'role'=>'admin','is_active'=>true]);}
  $editor=User::firstOrCreate(['email'=>'editor@frameverse.test'],['name'=>'FrameVerse Editorial','password'=>Str::random(40),'role'=>'editor']);
  foreach(['Action','Adventure','Animation','Comedy','Crime','Drama','Fantasy','Horror','Mystery','Romance','Sci-Fi','Slice of Life','Supernatural','Thriller'] as $name)Genre::firstOrCreate(['slug'=>Str::slug($name)],['name'=>$name]);
  foreach(['News','Reviews','Guides','Recommendations'] as $name) ArticleCategory::firstOrCreate(['slug'=>Str::slug($name)],['name'=>$name]);
  $items=[
   ['Interstellar','movie',2014,'Sci-Fi,Drama,Adventure','A team of explorers journey through a wormhole, searching for a world where humanity can begin again.',169,'Christopher Nolan presents a sweeping journey beyond the familiar.'],
   ['Dune: Part Two','movie',2024,'Sci-Fi,Adventure,Drama','A young leader faces impossible choices as great houses struggle for control of a desert planet.',166,'Discover a striking science-fiction epic.'],
   ['Spirited Away','movie',2001,'Animation,Fantasy,Adventure','A young girl enters a mysterious world of spirits and discovers her own courage.',125,'A beautifully imagined animated adventure.'],
   ['The Grand Budapest Hotel','movie',2014,'Comedy,Drama,Mystery','A legendary concierge and his young colleague become entangled in a priceless mystery.',100,'An eccentric, meticulously crafted tale.'],
   ['The Batman','movie',2022,'Action,Crime,Thriller','A reclusive detective investigates a series of crimes that unveil a city’s buried secrets.',176,'A moody detective story set in a city of shadows.'],
   ['Everything Everywhere All at Once','movie',2022,'Action,Comedy,Sci-Fi','An ordinary woman finds herself at the center of a wildly unexpected multiverse adventure.',139,'A bold story about family and infinite possibility.'],
   ['Attack on Titan','anime',2013,'Action,Drama,Fantasy','Humanity faces towering enemies beyond fortified walls as secrets begin to unravel.',null,'A high-stakes anime journey.'],
   ['Frieren: Beyond Journey’s End','anime',2023,'Adventure,Fantasy,Drama','An elven mage embarks on a reflective journey to understand the lives of those she knew.',null,'A thoughtful, tender fantasy about time.'],
   ['Demon Slayer','anime',2019,'Action,Fantasy,Supernatural','A young swordsman seeks a cure for his sister after tragedy strikes their family.',null,'Vibrant action and an emotional story.'],
   ['Jujutsu Kaisen','anime',2020,'Action,Supernatural,Horror','A teenager encounters a hidden world of dangerous curses and powerful sorcerers.',null,'Supernatural battles meet compelling characters.'],
   ['Your Name','anime',2016,'Romance,Fantasy,Drama','Two young strangers experience a mysterious connection that transcends distance and time.',107,'A moving animated story of connection.'],
   ['Vinland Saga','anime',2019,'Action,Adventure,Drama','A young warrior searches for meaning in a world shaped by conflict and revenge.',null,'An ambitious historical animated drama.'],
  ];
  foreach($items as $index=>$i){
   [$name,$type,$year,$genreText,$description,$runtime,$excerpt]=$i;
   $slug=Str::slug($name);
   $title=MediaTitle::firstOrCreate(['slug'=>$slug],['title'=>$name,'content_type'=>$type,'release_year'=>$year,'synopsis'=>$description,'runtime_minutes'=>$runtime,'publication_status'=>'published','published_at'=>now(),'featured'=>$index<2,'views_count'=>0,'format'=>$type==='anime'?'TV':null,'episodes_count'=>$type==='anime'?24:null,'release_status'=>'released']);
   $genreIds=Genre::whereIn('name',explode(',',$genreText))->pluck('id');$title->genres()->syncWithoutDetaching($genreIds);
  }
  foreach(['site_name'=>'FrameVerse','tagline'=>'Stories worth discovering.','hero_title'=>'Every frame has a story.','hero_subtitle'=>'Explore cinema, fall into anime, and find your next obsession.','footer_text'=>'Curated discovery for film and anime lovers.','social_instagram'=>'','social_youtube'=>''] as $key=>$val)SiteSetting::firstOrCreate(['key'=>$key],['value'=>$val]);
  $categories=ArticleCategory::pluck('id','slug');
  foreach([
   ['The art of unforgettable cinematic worlds','How production design, music, and worldbuilding make an imaginary place feel real.','Guides'],
   ['Five anime journeys worth starting this weekend','From tender fantasy to high-energy adventure, a curated selection for your watchlist.','Recommendations'],
   ['Why great characters stay with us','A closer look at the small moments that make stories memorable.','Reviews'],
  ] as $entry){
   [$title,$excerpt,$category]=$entry;
   Article::firstOrCreate(['slug'=>Str::slug($title)],['user_id'=>$editor->id,'title'=>$title,'excerpt'=>$excerpt,'body'=>$excerpt."\n\nStories can take us somewhere surprising. FrameVerse brings together titles, recommendations, and thoughtful commentary to help you explore something new.\n\nAdd your own thoughts, save your favorites, and return whenever you are ready for another story.",'category_id'=>$categories[Str::slug($category)],'publication_status'=>'published','published_at'=>now()]);
  }
 }
}
