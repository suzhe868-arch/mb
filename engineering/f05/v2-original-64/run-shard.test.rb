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
 def test_mask_value_never_enters_persisted_log
  key='synthetic-only-'+'Z'*31
  masks=[]
  raw="BEGIN\n::add-mask::#{key}\nafter #{key}\n"
  safe=V2Shard.sanitize_original_output!(raw,masks)
  refute_includes safe,key
  assert_includes safe,'::add-mask::[REDACTED]'
  assert_includes safe,'[REDACTED_VALUE]'
  assert_equal [key],masks
 end
 def test_mask_injection_and_private_pem_fail_closed
  assert_raises(RuntimeError){V2Shard.sanitize_original_output!("::add-mask::a\n",[])}
  assert_raises(RuntimeError){V2Shard.sanitize_original_output!("-----BEGIN PRIVATE KEY-----\nsecret\n",[])}
  assert_raises(RuntimeError){V2Shard.sanitize_original_output!("::add-mask::#{'x'*30}\n",['short'])}
 end
 def test_per_job_github_env_rejects_foreign_and_multiline
  require 'tmpdir'
  Dir.mktmpdir('v2-ghenv-test-') do |dir|
   envfile=File.join(dir,'GITHUB_ENV')
   foreign={'file'=>'f05-7-frozen-k2-revalidation.yml','id'=>'k-https'}
   allowed={'file'=>'f05-7-frozen-h52-revalidation.yml','id'=>'f03-1-frozen-https-2a'}
   File.write(envfile,"F03_1_HMAC_KEY_BASE64=#{['a'*32].pack('m0')}\n")
   assert_raises(RuntimeError){V2Shard.apply_original_github_env!(envfile,foreign,{},[])}
   File.write(envfile,"GITHUB_TOKEN=evil\n")
   assert_raises(RuntimeError){V2Shard.apply_original_github_env!(envfile,allowed,{},[])}
   File.write(envfile,"F03_1_HMAC_KEY_BASE64=#{['b'*32].pack('m0')}\nBAD=YES\n")
   assert_raises(RuntimeError){V2Shard.apply_original_github_env!(envfile,allowed,{},[])}
   File.write(envfile,"F03_1_TLS_CERT_PATH=/tmp/../etc/passwd\n")
   assert_raises(RuntimeError){V2Shard.apply_original_github_env!(envfile,allowed,{},[])}
   File.write(envfile,"F03_1_HMAC_KEY_BASE64=#{['c'*32].pack('m0')}\n")
   masks=[];h=V2Shard.apply_original_github_env!(envfile,allowed,{},masks)
   assert_equal ['F03_1_HMAC_KEY_BASE64'],h.keys
   assert_equal [h.fetch('F03_1_HMAC_KEY_BASE64')],masks
   assert_equal 0,File.size(envfile)
   File.write(envfile,"F03_1_HMAC_KEY_BASE64=#{['d'*32].pack('m0')}\n")
   assert_raises(RuntimeError){V2Shard.apply_original_github_env!(envfile,allowed,h,masks)}
  end
 end
 def test_original_https_only_job_env
  assert V2Shard.f03_https_job?({'file'=>'f05-7-frozen-h52-revalidation.yml','id'=>'f03-1-frozen-https-2a'})
  refute V2Shard.f03_https_job?({'file'=>'f05-7-frozen-h52-revalidation.yml','id'=>'h-https'})
 end
 def test_artifact_body_must_not_contain_raw_mask_or_private_key
  assert V2Shard.safe_evidence_body!("::add-mask::[REDACTED]\n",[])
  assert_raises(RuntimeError){V2Shard.safe_evidence_body!("::add-mask::#{'h'*44}\n",[])}
  assert_raises(RuntimeError){V2Shard.safe_evidence_body!("-----BEGIN PRIVATE KEY-----",[])}
  assert_raises(RuntimeError){V2Shard.safe_evidence_body!("value=#{'K'*40}",['K'*40])}
 end
end
