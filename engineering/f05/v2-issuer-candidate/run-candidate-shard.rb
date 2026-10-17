#!/usr/bin/env ruby
# Candidate only: run all 66 authentic frozen job definitions on one NEW head; never sign Source.
require 'json';require 'digest';require 'fileutils'
require_relative '../v2-original-64/run-shard'
module V2Shard
 remove_const(:BRANCH)
 const_set(:BRANCH,'feat/f05-7-v2-versioned-source-66-candidate-01')
 remove_const(:OUT)
 const_set(:OUT,File.expand_path('evidence',__dir__))
 class << self
  def original_jobs
   name=File.join(ROOT,'engineering/f05/native-66-closure/evidence/原66项工作流与Job逐项完整执行映射.json')
   deny('CANDIDATE_CATALOG_NOT_GENERATED') unless File.file?(name)
   data=JSON.parse(File.read(name))
   deny('CANDIDATE_NOT_66_EXACT') unless data['total']==66&&data['ref_sha']=='99c38d013f67cc56975f1664120fb87c204afc3c' &&
      data['jobs'].size==66&&data['jobs'].map{|j|[j['file'],j['id']]}.uniq.size==66
   expected=JSON.parse(File.read(File.join(OUT,'66格同SHA候选源清册.json')))
   deny('CANDIDATE_LOCKED_JOBS_NOT_66') unless expected['jobs'].size==66
   data['jobs'].each_with_index do |j,i|
    e=expected['jobs'][i]
    deny('CANDIDATE_SOURCE_LOCK_MISMATCH') unless e['key']==j['file']+'#'+j['id']&&e['source_blob']==j['blob']&&
      e['command_sha256']==j['commands'].map{|c|Digest::SHA256.hexdigest(c)}
   end
   data['jobs']
  end
  def main
   action=ARGV.fetch(0)
   jobs=original_jobs
   if action=='--plan'
    puts JSON.pretty_generate({total:66,shards:(0..3).map{|i|[i,jobs.each_with_index.filter_map{|j,n|j['id'] if n%4==i}]}.to_h,issuer_signed:false})
    return
   end
   deny('ONLY_CANDIDATE_SHARD') unless action=='--shard'&&ARGV.size==2
   context!
   deny('CANDIDATE_ISSUE_BOUNDARY') unless ENV['V2_CANDIDATE_GATE']=='A_RELEASED_NONPROD_SOURCE_66_4X40_5MIB_1DAY' &&
    ENV['GITHUB_REPOSITORY']=='suzhe868-arch/mb' &&
    ENV['GITHUB_REF']=="refs/heads/#{BRANCH}"
   shard=Integer(ARGV[1]);deny('CANDIDATE_SHARD_RANGE') unless shard.between?(0,3)
   my=jobs.each_with_index.filter_map{|j,n|j if n%4==shard}
   target=shard<2 ? 17 : 16
   deny('SHARD_SIZE') unless my.size==target
   since=Process.clock_gettime(Process::CLOCK_MONOTONIC)
   results=[]
   my.each do |j|
    remaining=MAX_SHARD_SEC-(Process.clock_gettime(Process::CLOCK_MONOTONIC)-since)
    if remaining<120
     results<<{original_file:j['file'],original_job_id:j['id'],status:'NOT_RUN',blocker:'CANDIDATE_SHARD_TIME_EXHAUSTED',
       candidate_head:ENV['GITHUB_SHA'],run_id:ENV['GITHUB_RUN_ID'],formal_issuer_signed:false}
    else
     results<<run_one(j,shard,remaining)
    end
   end
   atomic_write(File.join(OUT,"shard#{shard}",'本分片全部原Job真实执行汇总.json'),{
    schema:'V2_CANDIDATE_66_SHARD_V1',repo:ENV['GITHUB_REPOSITORY'],
    head_sha:ENV['GITHUB_SHA'],run_id:ENV['GITHUB_RUN_ID'],attempt:ENV['GITHUB_RUN_ATTEMPT'],
    shard:shard,expected:target,items:results,
    source_issuer_signed:false,source_contract_version:'V2_SOURCE_CONTRACT_CANDIDATE_01'})
   real=results.count{|r|%w[REAL_PG16_PASS REAL_ORIGINAL_NONPG_PASS].include?(r[:status])}
   blocked=results.count{|r|r[:status]=='BLOCKED_EQUIVALENCE'}
   puts "V2_SOURCE_CANDIDATE_SHARD_END shard=#{shard} real=#{real} blocked=#{blocked} total=#{target}"
   deny("CANDIDATE_SHARD_INCOMPLETE_#{real}_#{target}") if real<target
  end
 end
end
if $PROGRAM_NAME==__FILE__
 begin;V2Shard.main;rescue StandardError=>e;warn e.message;exit 1;end
end
