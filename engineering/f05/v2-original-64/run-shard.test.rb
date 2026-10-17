#!/usr/bin/env ruby
# frozen_string_literal: true
require 'minitest/autorun'
require_relative 'run-shard'
class V2ShardSafetyTest < Minitest::Test
 def test_readonly_original_permissions
  assert V2Shard.readonly_permissions!({'contents'=>'read','actions'=>'read'})
  assert V2Shard.readonly_permissions!({'contents'=>'none'})
  assert_nil V2Shard.readonly_permissions!(nil)
 end
 def test_reject_write_and_unknown_scopes
  [{'contents'=>'write'},{'actions'=>'write'},{'deployments'=>'read'},'write-all',{'contents'=>'unknown'}].each do |permission|
   assert_raises(RuntimeError) {V2Shard.readonly_permissions!(permission)}
  end
 end
 def test_original_nonpg_ids_only
  assert V2Shard.original_nonpg?({'file'=>'f05-7-frozen-h52-revalidation.yml','id'=>'h-source'})
  assert V2Shard.original_nonpg?({'file'=>'f05-7-frozen-h52-revalidation.yml','id'=>'h-https'})
  refute V2Shard.original_nonpg?({'file'=>'f05-7-frozen-h52-revalidation.yml','id'=>'g-https'})
  refute V2Shard.original_nonpg?({'file'=>'wrong','id'=>'h-https'})
 end
 def test_strict_postgres_16_version
  assert_equal '160015',V2Shard.pg16_version_strict!('160015')
  ['150020','170000','160015 warning','16001','',nil].each do |v|
   assert_raises(RuntimeError) {V2Shard.pg16_version_strict!(v)}
  end
 end
 def test_wait_for_two_stable_final_tcp_sql_probes
  singleton=class << V2Shard;self;end
  calls=0
  old=V2Shard.method(:exec!)
  singleton.send(:define_method,:exec!) do |*args,**kwargs|
   calls+=1
   raise RuntimeError,'postgres init temporary failure' if calls==1
   '160015'
  end
  assert_equal '160015',V2Shard.wait_final_postgres!('unit-test-pg',attempts:4,interval:0)
  assert_equal 3,calls
 ensure
  singleton.send(:define_method,:exec!,old) if old
 end
end
