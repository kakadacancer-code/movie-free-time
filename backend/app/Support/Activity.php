<?php
namespace App\Support;
use App\Models\AuditLog;
class Activity {
 public static function record(string $action, string $entityType, int|string|null $entityId=null, array $meta=[]): void {
  AuditLog::create(['user_id'=>auth()->id(),'action'=>$action,'entity_type'=>$entityType,'entity_id'=>$entityId,'meta'=>$meta]);
 }
}
