<?php
use App\Models\SiteSetting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
 public function up():void {
  $setting=SiteSetting::where('key','home_sections')->first();
  if(!$setting)return;
  $sections=json_decode($setting->value??'{}',true)??[];
  foreach(['trending','movies','anime','donghua'] as $key)$sections[$key]['limit']=10;
  $setting->update(['value'=>json_encode($sections)]);
 }
 public function down():void {}
};
