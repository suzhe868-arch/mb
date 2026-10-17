#!/usr/bin/env ruby
# frozen_string_literal: true
require 'psych';require 'json';require 'open3';require 'digest';require 'fileutils'
module Native66
ROOT=File.expand_path('../../../',__dir__)
OUT=File.join(__dir__,'evidence')
BRANCH='feat/f05-7-66-real-source-closure-01'
REF='feat/f05-7-deterministic-matching-readiness-four-tier'
REF_SHA='99c38d013f67cc56975f1664120fb87c204afc3c'
SOURCES={
'f05-7-deterministic-matching-readiness-four-tier.yml'=>['3f563fcc3137197f37c986963a3e48259d1f4626',2],
'f05-7-frozen-f05-4-2-revalidation.yml'=>['ed32a3bfe870be32dba116490b5a99d4f83bb85a',2],
'f05-7-frozen-f05-5-2-revalidation.yml'=>['0687174fbf9b841cdc510b5caf93550f3bbd15be',2],
'f05-7-frozen-f05-6-2-revalidation.yml'=>['a90f9526802c8a1e505e3e6e984215b030af22c1',2],
'f05-7-frozen-h52-revalidation.yml'=>['687a9f767b0d0b144372550735da6159066b4833',52],
'f05-7-frozen-i2-revalidation.yml'=>['cf4befa47755824466c8b4e16de049c1916fd3dd',2],
'f05-7-frozen-j2-revalidation.yml'=>['642c706348884d754c73ce49e624f78915a91218',2],
'f05-7-frozen-k2-revalidation.yml'=>['d756184fc5c7cbbf15b21d8715b195d3df4a4419',2]}.freeze
ALLOWED={'h52'=>['f05-7-frozen-h52-revalidation.yml','f05-3f-https-pg16'],
'other'=>['f05-7-frozen-k2-revalidation.yml','k-https']}.freeze
def self.fail_safe(s);raise "NATIVE66_FAIL_CLOSED_#{s}";end
def self.git(*a)
 x,e,s=Open3.capture3('git',*a,chdir:ROOT);fail_safe("GIT_#{e[0,60]}") unless s.success?;x.strip
end
def self.catalog
 sources=[];jobs=[]
 SOURCES.each do |file,(blob,num)|
  path=File.join(ROOT,'.github','workflows',file)
  fail_safe('OLD_WORKFLOW_BLOB_CHANGED') unless File.file?(path)&&git('hash-object',path)==blob
  raw=File.binread(path);y=Psych.safe_load(raw,aliases:true)
  fail_safe("ORIGINAL_JOB_COUNT_#{file}") unless y.is_a?(Hash)&&y['jobs'].is_a?(Hash)&&y['jobs'].length==num
  sources<<{file:file,blob:blob,sha256:Digest::SHA256.hexdigest(raw),count:num,ref:REF,ref_sha:REF_SHA}
  y['jobs'].each do |id,job|
    fail_safe('BAD_JOB') unless job.is_a?(Hash)&&job['steps'].is_a?(Array)
    steps=job['steps'];runs=steps.filter_map{|v|v.is_a?(Hash) ? v['run'] : nil}
    artifacts=steps.select{|v|v.is_a?(Hash)&&v['uses'].to_s.start_with?('actions/upload-artifact@')}
    jobs<<{file:file,blob:blob,id:id,name:job['name']||id,pg16:job.dig('services','postgres','image'),
     timeout:job['timeout-minutes'],job_env:job['env']||{},
     workdir:job.dig('defaults','run','working-directory'),steps:steps,commands:runs,
     artifacts:artifacts.map{|a|a['with']||{}},conditions:job.key?('if')||steps.any?{|v|v.key?('if')},
     tested:false,formal_issuer_signed:false}
  end
 end
 fail_safe('NOT_66_UNIQUE') unless jobs.length==66&&jobs.map{|v|[v[:file],v[:id]]}.uniq.length==66
 {schema:2,sources:sources,jobs:jobs,total:66,ref:REF,ref_sha:REF_SHA,
  original_66_completed:false,source_gap:'OPEN',formal_issuer_signed:false}
end
def self.write
 FileUtils.mkdir_p(OUT);data=catalog
 File.write(File.join(OUT,'原66项工作流与Job逐项完整执行映射.json'),JSON.pretty_generate(data)+"\n")
 lines=["源文件\t原JobID\tPG16服务\t原命令数\t原Artifact上传数\t本批真执行"]
 data[:jobs].each{|j|lines<<[j[:file],j[:id],j[:pg16],j[:commands].length,j[:artifacts].length,'NO'].join("\t")}
 File.write(File.join(OUT,'原66项执行映射.tsv'),lines.join("\n")+"\n")
 puts 'NATIVE66_CATALOG_EXACT_66_JOBS_52_H52_14_OTHERS'
end
def self.gate
 fail_safe('UNAUTHORIZED_CONTEXT') unless ENV['GITHUB_ACTIONS']=='true'&&
 ENV['GITHUB_REPOSITORY']=='suzhe868-arch/mb'&&ENV['GITHUB_EVENT_NAME']=='push'&&
 ENV['GITHUB_REF']=="refs/heads/#{BRANCH}"&&ENV['GITHUB_SHA']&.match?(/\A[a-f0-9]{40}\z/)&&
 git('rev-parse','HEAD')==ENV['GITHUB_SHA']
end
def self.execute(key)
 gate
 file,id=ALLOWED.fetch(key){fail_safe('NOT_ONE_OF_TWO_APPROVED_ORIGINAL_JOBS')}
 j=catalog[:jobs].find{|v|v[:file]==file&&v[:id]==id}
 fail_safe('JOB_MISSING') unless j
 fail_safe('POSTGRES16_REQUIRED') unless %w[postgres:16 postgres:16-alpine].include?(j[:pg16])
 fail_safe('JOB_CONDITIONS_NOT_SUPPORTED') if j[:conditions]
 fail_safe('NO_ORIGINAL_BUSINESS_CI') unless j[:commands].any?{|v|v.to_s.match?(/bash (?:engineering\/)?f05\/[\w-]+\/ci-job\.sh (source|https)/)}
 d=File.join(OUT,key);FileUtils.mkdir_p(d)
 res={file:file,id:id,blob:j[:blob],ref:REF,ref_sha:REF_SHA,
      head_sha:ENV['GITHUB_SHA'],run_id:ENV['GITHUB_RUN_ID'],event:ENV['GITHUB_EVENT_NAME'],
      attempt:ENV.fetch('GITHUB_RUN_ATTEMPT','1'),command_total:j[:commands].length,
      executed:0,formal_issuer_signed:false,status:'RUNNING'}
 File.write(File.join(d,'原Job执行信息.json'),JSON.pretty_generate(res)+"\n")
 File.open(File.join(d,'真实业务完整命令.log'),'w') do |log|
  j[:steps].each_with_index do |step,i|
   fail_safe('INVALID_STEP') unless step.is_a?(Hash)
   if step['uses']
    fail_safe('UNKNOWN_ACTION') unless step['uses'].match?(/\Aactions\/(checkout|setup-node|upload-artifact)@v4\z/)
    log.puts "ORIGINAL_HOSTED_ACTION #{step['uses']}"
    next
   end
   command=step['run']
   fail_safe('COMMAND_MISSING') unless command.is_a?(String)
   fail_safe('GITHUB_EXPRESSION_NOT_SUPPORTED') if command.include?('$'+'{{')
   wd=step['working-directory']||j[:workdir]||'.'
   fail_safe('WORKDIR_INVALID') unless wd.match?(/\A[a-zA-Z0-9_.\/-]+\z/)&&!wd.include?('..')&&!wd.start_with?('/')
   cwd=File.expand_path(wd,ROOT)
   fail_safe('WORKDIR_ABSENT') unless Dir.exist?(cwd)
   env={}
   [j[:job_env],step['env']||{}].each{|hash|
    fail_safe('ENV_INVALID') unless hash.is_a?(Hash)
    hash.each{|k,v|fail_safe('UNRESOLVED_ENV') if v.to_s.include?('$'+'{{');env[k.to_s]=v.to_s}
   }
   log.puts "RUN_ORIGINAL_STEP #{i} command_sha256=#{Digest::SHA256.hexdigest(command)}"
   log.flush
   rc=nil
   Open3.popen2e(env,'bash','--noprofile','--norc','-e','-o','pipefail','-c',command,chdir:cwd) do |_stdin,output,wait|
    output.each_line{|line|$stdout.write(line);log.write(line)};rc=wait.value.exitstatus
   end
   log.puts "END_ORIGINAL_STEP #{i} status=#{rc}";log.flush
   fail_safe("ORIGINAL_COMMAND_FAILED_#{i}_#{rc}") unless rc==0
   res[:executed]+=1
  end
 end
 fail_safe('INCOMPLETE_ORIGINAL_SHELL') unless res[:executed]==res[:command_total]
 res[:status]='SUCCESS_ORIGINAL_BUSINESS_CANDIDATE_ONLY'
 File.write(File.join(d,'原Job执行信息.json'),JSON.pretty_generate(res)+"\n")
 puts "NATIVE66_REAL_ORIGINAL_JOB_SUCCESS #{file}/#{id} #{res[:executed]}/#{res[:command_total]}"
end
end
begin
 case ARGV[0]
 when '--catalog' then Native66.write
 when '--execute' then Native66.execute(ARGV.fetch(1))
 when '--full-66' then Native66.fail_safe('OLD_REF_PUSH_NEEDS_NEW_A_EXACT_SHA_AND_RESOURCE_AUTHORIZATION')
 else Native66.fail_safe('ONLY_CATALOG_AND_TWO_PILOT_JOBS_ALLOWED')
 end
rescue StandardError=>e
 warn e.message
 exit 1
end
