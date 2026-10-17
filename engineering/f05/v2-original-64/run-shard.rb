#!/usr/bin/env ruby
# frozen_string_literal: true
# Each source Job gets an independent worktree; exactly 62 remaining original PG16 + 2 original non-PG jobs.
# Not a replacement for GitHub's signed Source issuers; handles only disposable synthetic CI.
require 'json';require 'digest';require 'open3';require 'fileutils';require 'tmpdir';require 'timeout';require 'shellwords';require 'psych';require 'base64'
module V2Shard
 ROOT=File.expand_path('../../../', __dir__)
 OUT=File.join(__dir__,'evidence')
 BRANCH='feat/f05-7-v2-remaining-64-real-pg16-01'
 MAX_SHARD_SEC=34*60
 MAX_CAPTURE_RAW_BYTES=64*1024*1024 # raw lossless staging; hard upload stop is compressed 5MiB
 MAX_SINGLE_STEP_SEC=16*60
 OLD_TAG='public.ecr.aws/docker/library/postgres:16-alpine'
 def self.deny(code);raise "V2_FAIL_CLOSED_#{code}";end
 def self.exec!(*argv,chdir:ROOT,timeout:120)
  stdout,stderr,stat=Timeout.timeout(timeout){Open3.capture3(*argv,chdir:chdir)}
  deny("SHELL_#{argv[0]}_#{stat.exitstatus}_#{stderr[0,90]}") unless stat.success?
  stdout.strip
 end
 def self.context!
  deny('NO_OFFICIAL_PUSH') unless ENV['GITHUB_ACTIONS']=='true' && ENV['GITHUB_EVENT_NAME']=='push' &&
    ENV['GITHUB_REPOSITORY']=='suzhe868-arch/mb' && ENV['GITHUB_REF']=="refs/heads/#{BRANCH}" &&
    ENV['GITHUB_RUN_ID'].to_s.match?(/\A[1-9][0-9]*\z/) &&
    ENV['GITHUB_RUN_ATTEMPT'].to_s.match?(/\A[1-9][0-9]*\z/) &&
    ENV['GITHUB_SHA'].to_s.match?(/\A[a-f0-9]{40}\z/) && exec!('git','rev-parse','HEAD')==ENV['GITHUB_SHA']
  deny('BUDGET_NOT_SIGNED') unless ENV['V2_RESOURCE_GATE_PASS']=='A_ISSUE_106_STANDARD_4X40_STORAGE_5MIB_1DAY'
  deny('NOT_STANDARD_RUNNER') unless ENV['RUNNER_OS']=='Linux' && ENV['ImageOS']=='ubuntu24'
  deny('PRODUCTION_SECRETS_PRESENT') if ENV.keys.any?{|k|k.match?(/\A(AWS_ACCESS_KEY|PROD_|JYT_|WECHAT_SECRET|FEISHU_SECRET)/)}
 end
 def self.original_jobs
  path=File.join(ROOT,'engineering/f05/native-66-closure/evidence/原66项工作流与Job逐项完整执行映射.json')
  deny('CATALOG_NOT_GENERATED') unless File.file?(path)
  json=JSON.parse(File.read(path));deny('CATALOG_INVALID') unless json['total']==66
  history=[['f05-7-frozen-h52-revalidation.yml','f05-3f-https-pg16'],['f05-7-frozen-k2-revalidation.yml','k-https']]
  actual=json['jobs'].reject{|j|history.include?([j['file'],j['id']])}
  deny('NOT_64_UNIQUE') unless actual.size==64 && actual.map{|j|[j['file'],j['id']]}.uniq.size==64
  actual
 end
 def self.atomic_write(path,data)
  FileUtils.mkdir_p(File.dirname(path));File.write(path+'.tmp',JSON.pretty_generate(data)+"\n");File.rename(path+'.tmp',path)
 end
 F03_ENV={'F03_1_TLS_KEY_PATH'=>'/tmp/f03-1-key.pem','F03_1_TLS_CERT_PATH'=>'/tmp/f03-1-cert.pem'}.freeze
 F03_KEYS=%w[F03_1_TLS_KEY_PATH F03_1_TLS_CERT_PATH F03_1_HMAC_KEY_BASE64].freeze
 def self.f03_https_job?(job)
  job['file']=='f05-7-frozen-h52-revalidation.yml' && job['id']=='f03-1-frozen-https-2a'
 end
 def self.apply_original_github_env!(path,job,prior,secret_masks)
  return prior unless File.file?(path) && File.size(path)>0
  deny('GITHUB_ENV_EXTERNAL_JOB_WRITE') unless f03_https_job?(job)
  contents=File.binread(path)
  deny('GITHUB_ENV_OVERSIZE') if contents.bytesize>2048
  deny('GITHUB_ENV_MULTILINE_INJECTION') if contents.include?("\r")||contents.include?("\0")||!contents.end_with?("\n")
  updates={}
  contents.lines.each do |line|
   match=line.chomp.match(/\A([A-Z0-9_]+)=([^\n]*)\z/)
   deny('GITHUB_ENV_BAD_ASSIGNMENT') unless match
   key,val=match.captures
   deny('GITHUB_ENV_FIELD_UNAPPROVED') unless F03_KEYS.include?(key)&&!prior.key?(key)&&!updates.key?(key)
   if F03_ENV.key?(key)
    deny('GITHUB_ENV_PATH_UNSAFE') unless val==F03_ENV.fetch(key)&&File.file?(val)&&!File.symlink?(val)
   else
    deny('GITHUB_ENV_HMAC_NOT_SYNTHETIC') unless val.match?(/\A[A-Za-z0-9+\/]{43}=\z/) &&
      Base64.strict_decode64(val).bytesize==32
    secret_masks<<val unless secret_masks.include?(val)
   end
   updates[key]=val
  end
  File.binwrite(path,'')
  prior.merge(updates)
 end
 def self.sanitize_original_output!(raw,masks)
  deny('LOG_TOO_LARGE') if raw.bytesize>16*1024*1024
  deny('LOG_BINARY_OR_INVALID_ENCODING') unless raw.dup.force_encoding('UTF-8').valid_encoding?
  tokens=raw.scan(/::add-mask::([^\r\n]*)/).flatten
  tokens.each do |value|
   deny('MALFORMED_GITHUB_MASK') unless value.bytesize.between?(16,256)&&!value.match?(/[\r\n\x00-\x1f]/)
   masks<<value unless masks.include?(value)
  end
  result=raw.gsub(/::add-mask::[^\r\n]*/, '::add-mask::[REDACTED]')
  masks.each do |secret|
   deny('UNSAFE_MASK_VALUE') unless secret.is_a?(String)&&secret.bytesize.between?(16,256)
   result=result.gsub(secret,'[REDACTED_VALUE]')
  end
  deny('PEM_PRIVATE_KEY_IN_LOG') if result.match?(/-----BEGIN (?:[A-Z ]* )?PRIVATE KEY-----/)
  deny('UNREDACTED_GITHUB_MASK') if result.match?(/::add-mask::(?!\[REDACTED\])/)
  result
 end
 def self.shell!(command,cwd,env,log,remaining,masks=[])
  deny('UNRESOLVED_EXPRESSION') if command.include?('$'+'{{')
  duration=[MAX_SINGLE_STEP_SEC,remaining].min
  deny('STEP_TIME_EXHAUSTED') if duration<=0
  output=+''
  exit_status=nil
  Open3.popen2e(env,'bash','--noprofile','--norc','-e','-o','pipefail','-c',command,chdir:cwd,pgroup:true) do |_stdin,combined,wait|
   begin
    Timeout.timeout(duration) do
     combined.each_line do |line|
      output<<line
      deny('LOG_TOO_LARGE') if output.bytesize>16*1024*1024
     end
     exit_status=wait.value
    end
   rescue Timeout::Error
    Process.kill('TERM',-wait.pid) rescue nil
    sleep 0.25
    Process.kill('KILL',-wait.pid) rescue nil
    deny('STEP_TIMEOUT')
   rescue StandardError
    Process.kill('KILL',-wait.pid) rescue nil
    raise
   end
  end
  safe=sanitize_original_output!(output,masks)
  log.write(safe);log.flush
  deny("SOURCE_STEP_EXIT_#{exit_status.exitstatus}") unless exit_status.success?
 end
 def self.readonly_permissions!(permission)
  return if permission.nil?
  deny('ORIGINAL_PERMISSIONS_NOT_READONLY_MAPPING') unless permission.is_a?(Hash)
  permission.each do |key,value|
   deny('ORIGINAL_PERMISSION_SCOPE_DENIED') unless %w[contents actions].include?(key.to_s)
   deny('ORIGINAL_PERMISSION_WRITE_OR_UNKNOWN_DENIED') unless %w[read none].include?(value.to_s)
  end
  true
 end
 def self.original_nonpg?(job)
  job['file']=='f05-7-frozen-h52-revalidation.yml' && %w[h-source h-https].include?(job['id'])
 end
 def self.pg16_version_strict!(value)
  deny('PG16_INVALID_SQL_VERSION') unless value.to_s.match?(/\A16[0-9]{4}\z/) && value.to_i.between?(160000,169999)
  value.to_s
 end
 def self.wait_final_postgres!(container,attempts:50,interval:1)
  consistent=0;last='no successful TCP SQL probe'
  attempts.times do |index|
   begin
    version=exec!('docker','exec',container,'psql','-X','-At','-h','127.0.0.1',
      '-U','postgres','-d','postgres','-c','SHOW server_version_num',timeout:8)
    pg16_version_strict!(version)
    consistent+=1
    if consistent>=2
     puts "V2_PG16_FINAL_TCP_SQL_READY container=#{container} version=#{version} probes=#{index+1}"
     return version
    end
   rescue StandardError=>e
    last=e.message[0,180];consistent=0
   end
   sleep interval
  end
  begin
   warn "V2_PG16_INIT_CONTAINER_LOG #{exec!('docker','logs','--tail','35',container,timeout:5)[0,1800]}"
  rescue StandardError=>e
   warn "V2_PG16_LOG_UNAVAILABLE #{e.message[0,120]}"
  end
  deny("PG16_FINAL_TCP_SQL_NOT_READY_#{last}")
 end
 def self.new_database(image,container)
  deny('INVALID_POSTGRES_IMAGE') unless ['postgres:16','postgres:16-alpine'].include?(image)
  exec!('docker','run','-d','--rm','--name',container,
    '-e','POSTGRES_USER=postgres','-e','POSTGRES_PASSWORD=disposable_bootstrap_only',
    '-e','POSTGRES_DB=postgres','-p','127.0.0.1:5432:5432',image,timeout:90)
  actual=wait_final_postgres!(container)
  exec!('docker','tag',image,OLD_TAG)
  actual
 end
 def self.validate_workdir(base,wd)
  deny('INVALID_WORKDIR') unless wd.is_a?(String)&&wd.match?(/\A[a-zA-Z0-9_\.\/-]+\z/)&&!wd.include?('..')&&!wd.start_with?('/')
  path=File.expand_path(wd,base)
  deny('MISSING_WORKDIR') unless Dir.exist?(path)
  path
 end
 def self.env_for(job,step,workspace)
  h={'GITHUB_WORKSPACE'=>workspace,'CI'=>'true','APP_ENV'=>'test','NODE_ENV'=>'test'}
  [job['job_env'],step['env']].compact.each do |src|
   deny('ENV_NOT_HASH') unless src.is_a?(Hash)
   src.each do |k,v|
    deny('ENV_WITH_EXPRESSION') if v.to_s.include?('$'+'{{')
    h[k.to_s]=v.to_s
   end
  end
  h
 end
 def self.artifact_name(name,job)
  deny('ARTIFACT_NAME_NOT_STRING') unless name.is_a?(String)
  out=name.gsub(/\$\{\{\s*env\.([A-Z_][A-Z_0-9]*)\s*\}\}/){ job.fetch('job_env',{}).fetch(Regexp.last_match(1)).to_s }
  deny('ARTIFACT_NAME_UNSAFE') unless out.match?(/\A[A-Za-z0-9_.-]{1,150}\z/)
  out
 end
 def self.artifact_paths(path)
  deny('ARTIFACT_PATH_UNKNOWN') unless path.is_a?(String)&&!path.empty? && !path.include?('$'+'{{')
  path.split("\n").map(&:strip).reject{|s|s.empty?||s.start_with?('#')}
 end
 def self.safe_evidence_body!(raw,masks)
  deny('EVIDENCE_RAW_ADD_MASK_FORBIDDEN') if raw.match?(/::add-mask::(?!\[REDACTED\])/)
  deny('EVIDENCE_PRIVATE_KEY_FORBIDDEN') if raw.match?(/-----BEGIN (?:[A-Z ]* )?PRIVATE KEY-----/)
  masks.each{|key| deny('EVIDENCE_SENSITIVE_VALUE_FORBIDDEN') if raw.include?(key)}
  true
 end
 def self.capture_artifacts(job,work,dir,masks=[])
  expected=[]
  job['artifacts'].each_with_index do |spec,index|
   name=artifact_name(spec['name'],job)
   paths=artifact_paths(spec['path'])
   files=[];bytes=0
   paths.each do |p|
    deny('UNSAFE_ARTIFACT_PATH') if p.start_with?('/')||p.include?('..')
    Dir.glob(File.join(work,p),File::FNM_DOTMATCH).each do |f|
     next if ['.','..'].include?(File.basename(f))
     all=File.directory?(f) ? Dir.glob(File.join(f,'**','*'),File::FNM_DOTMATCH).select{|x|File.file?(x)} : [f]
     all.each do |entry|
      deny('ARTIFACT_SYMLINK') if File.symlink?(entry)
      next unless File.file?(entry)
      bytes+=File.size(entry)
      existing=Dir.glob(File.join(OUT,'shard*','**','artifact-files','**','*'),File::FNM_DOTMATCH).select{|x|File.file?(x)}.sum{|x|File.size(x)}
      deny('BLOCKED_STORAGE_BUDGET') if bytes>MAX_CAPTURE_RAW_BYTES || (existing+File.size(entry)>MAX_CAPTURE_RAW_BYTES)
      safe_evidence_body!(File.binread(entry),masks)
      rel=entry.delete_prefix(work+'/')
      destination=File.join(dir,'artifact-files',"#{index}_#{name}",rel)
      FileUtils.mkdir_p(File.dirname(destination));FileUtils.cp(entry,destination)
      files<<{path:rel,bytes:File.size(entry),sha256:Digest::SHA256.file(entry).hexdigest}
     end
    end
   end
   deny('MISSING_ORIGINAL_ARTIFACT') if files.empty?
   expected<<{name:name,index:index,original_path:spec['path'],files:files.sort_by{|v|v[:path]},bytes:bytes}
  end
  expected
 end
 def self.run_one(job,shard,limit)
  id=job.fetch('id');key=job.fetch('file')+'#'+id
  safe=Digest::SHA256.hexdigest(key)[0,16]
  dir=File.join(OUT,"shard#{shard}",safe);FileUtils.mkdir_p(dir)
  info={original_file:job.fetch('file'),original_job_id:id,source_blob:job.fetch('blob'),
    original_job_name:job.fetch('name'),event:ENV['GITHUB_EVENT_NAME'],command_sha256:job.fetch('commands').map{|c|Digest::SHA256.hexdigest(c)},
    candidate_head:ENV['GITHUB_SHA'],candidate_branch:BRANCH,
    run_id:ENV['GITHUB_RUN_ID'],attempt:ENV['GITHUB_RUN_ATTEMPT'],job_runner:ENV['GITHUB_JOB'],
    original_source_sha:'99c38d013f67cc56975f1664120fb87c204afc3c',
    step_count:job.fetch('steps').length,executed_commands:0,pg16:false,
    clean_git_worktree:false,original_artifact_names:job.fetch('artifacts').map{|a|a['name']},
    formal_issuer_signed:false,original_66_completed:false,status:'NOT_RUN'}
  atomic_write(File.join(dir,'真实单Job证据.json'),info)
  work=nil;container="v2#{shard}#{safe}";started=Process.clock_gettime(Process::CLOCK_MONOTONIC)
  before_docker=exec!('docker','ps','-aq',timeout:10).split
  logfile=File.join(dir,'真实Shell及PG16命令.log')
  job_env_tmp=nil;masked_values=[];github_env_values={}
  begin
   deny('NOT_IN_SHARD_BUDGET') if limit<=0
   deny('UNSAFE_SOURCE_FILE') unless job['file'].match?(/\Af05-7-[a-zA-Z0-9_.-]+\.yml\z/)
   image=job['pg16'];nonpg=original_nonpg?(job)
   deny('ORIGINAL_NONPG_SERVICE_CHANGED') if nonpg && image
   deny('SOURCE_JOB_NO_INDEPENDENT_PG16_SERVICE') if !nonpg && image.nil?
   frozen=File.join(ROOT,'.github','workflows',job['file'])
   original=Psych.safe_load_file(frozen,aliases:true).fetch('jobs').fetch(id)
   deny('ORIGINAL_JOB_LEVEL_CONDITION') if original.key?('if')
   deny('ORIGINAL_JOB_UNSUPPORTED_SERVICE') unless original.fetch('services',{}).keys==(nonpg ? [] : ['postgres'])
   deny('ORIGINAL_JOB_COMPLEX_STRATEGY_OR_CONTAINER') if %w[strategy container needs].any?{|k|original.key?(k)}
   readonly_permissions!(original['permissions'])
   deny('ORIGINAL_JOB_MISMATCH') unless original.fetch('steps').size==job['steps'].size
   deny('JOB_LEVEL_CONDITIONS_NOT_SUPPORTED') if job['conditions'] && !job['steps'].all?{|s| !s.key?('if')||s['if']=='always()'}
   work=Dir.mktmpdir("v2-#{shard}-",ENV['RUNNER_TEMP']||'/tmp')
   exec!('git','worktree','add','--detach',work,ENV.fetch('GITHUB_SHA'),timeout:120)
   info[:clean_git_worktree]=true
   if nonpg
    info[:original_job_kind]='NONPG';info[:pg16]=false
    puts "V2_ORIGINAL_NONPG_MODE #{id} MODE=#{job.fetch('job_env',{}).fetch('MODE')}"
   else
    info[:original_job_kind]='PG16';info[:postgres_version_num]=new_database(image,container);info[:pg16]=true
   end
   info[:status]='RUNNING';atomic_write(File.join(dir,'真实单Job证据.json'),info)
   job_env_tmp=Dir.mktmpdir('v2-original-step-env-',ENV['RUNNER_TEMP']||'/tmp')
   local_ghenv=File.join(job_env_tmp,'GITHUB_ENV')
   File.binwrite(local_ghenv,'')
   File.open(logfile,'w') do |log|
    job['steps'].each_with_index do |step,index|
     if step.key?('if') && step['if']!='always()'
      deny('UNKNOWN_SOURCE_STEP_CONDITION')
     end
     if step.key?('uses')
      use=step['uses'].to_s
      deny('UNSUPPORTED_ORIGINAL_ACTION') unless use.match?(/\Aactions\/(checkout|setup-node|upload-artifact)@v4\z/)
      # checkout and node runtime are provided by the outer V2 workflow.
      log.puts "SOURCE_ACTION_ADAPTED #{index} #{use}"
      next
     end
     cmd=step['run'];deny('SOURCE_COMMAND_INVALID') unless cmd.is_a?(String)
     shell=step['shell'];deny('UNSUPPORTED_SHELL') if shell && shell!='bash'
     dir0=validate_workdir(work,step['working-directory']||job['workdir']||'.')
     log.puts "SOURCE_STEP_START #{index} sha256=#{Digest::SHA256.hexdigest(cmd)}";log.flush
     this_env=env_for(job,step,work).merge(github_env_values).merge('GITHUB_ENV'=>local_ghenv)
     shell!(cmd,dir0,this_env,log,limit-(Process.clock_gettime(Process::CLOCK_MONOTONIC)-started),masked_values)
     github_env_values=apply_original_github_env!(local_ghenv,job,github_env_values,masked_values)
     log.puts "SOURCE_STEP_PASS #{index}";log.flush
     info[:executed_commands]+=1
     atomic_write(File.join(dir,'真实单Job证据.json'),info)
    end
   end
   deny('SOURCE_SHELL_INCOMPLETE') unless info[:executed_commands]==job['commands'].length
   info[:artifacts]=capture_artifacts(job,work,dir,masked_values)
   safe_evidence_body!(File.binread(logfile),masked_values)
   info[:log_redaction]='SECURE_MASKED_CAPTURE_V1'
   info[:secret_mask_count]=masked_values.size
   info[:github_env_fields]=github_env_values.keys
   info[:status]=nonpg ? 'REAL_ORIGINAL_NONPG_PASS' : 'REAL_PG16_PASS'
  rescue StandardError=>e
   if job['file']=='f05-7-deterministic-matching-readiness-four-tier.yml' && id=='match-source' &&
      e.message.include?('ENV_WITH_EXPRESSION')
    info[:status]='BLOCKED_EQUIVALENCE'
    info[:blocker]='BLOCKED_EQUIVALENCE_LEGACY_SOURCE_ORACLE__7_FROZEN_WORKFLOWS_64_JOBS_SAME_SHA_REQUIRED'
    info[:legacy_source_oracle_required]=true
   end
   info[:status]=e.message.match?(/BUDGET|STEP_TIMEOUT|ARTIFACT|CONDITION|UNSUPPORTED|PG16_SERVICE|UNKNOWN|ENV_WITH_EXPRESSION|UNRESOLVED_EXPRESSION|GITHUB_ENV|MASK|EVIDENCE|SECRET/) ? 'BLOCKED_EQUIVALENCE' : 'FAIL'
   info[:blocker]||=e.message[0,400]
  ensure
   info[:duration_seconds]=(Process.clock_gettime(Process::CLOCK_MONOTONIC)-started).round(2)
   info[:log_redaction]||='SECURE_MASKED_CAPTURE_V1'
   info[:secret_mask_count]=masked_values.size
   info[:github_env_fields]=github_env_values.keys
   info[:log_sha256]=File.file?(logfile) ? Digest::SHA256.file(logfile).hexdigest : nil
   atomic_write(File.join(dir,'真实单Job证据.json'),info)
   # Original scripts may create disposable containers that must not leak host port 5432.
   # Only remove containers started during THIS original Job on this isolated runner.
   begin
    after_docker=exec!('docker','ps','-aq',timeout:10).split
    (after_docker-before_docker).each{|extra|system('docker','rm','-f',extra,out:File::NULL,err:File::NULL)}
   rescue StandardError=>e
    warn "V2_DISPOSABLE_RUNNER_CONTAINER_CLEANUP_FAILED #{e.message[0,120]}"
   end
   system('docker','rm','-f',container,out:File::NULL,err:File::NULL)
   FileUtils.remove_entry_secure(job_env_tmp) if job_env_tmp && Dir.exist?(job_env_tmp)
   F03_ENV.each_value{|temporary|FileUtils.rm_f(temporary)} if f03_https_job?(job)
   system('git','worktree','remove','--force',work,out:File::NULL,err:File::NULL) if work
   system('docker','image','rm',OLD_TAG,out:File::NULL,err:File::NULL)
  end
  puts "V2_REAL_JOB #{key} status=#{info[:status]} pg16=#{info[:pg16]} commands=#{info[:executed_commands]}/#{job['commands'].length} duration=#{info[:duration_seconds]}"
  info
 end
 def self.main
  action=ARGV.fetch(0)
  jobs=original_jobs
  if action=='--plan'
   puts JSON.pretty_generate({total:jobs.size,shards:(0..3).map{|i|[i,jobs.each_with_index.select{|_,ix|ix%4==i}.map{|j,_|j['file']+'#'+j['id']}]}.to_h,ready:false})
   return
  end
  deny('UNKNOWN_MODE') unless action=='--shard'&&ARGV.length==2
  context!
  shard=Integer(ARGV[1]);deny('SHARD_RANGE') unless shard.between?(0,3)
  myjobs=jobs.each_with_index.filter_map{|j,index|index%4==shard ? j : nil}
  deny('SHARD_COUNT') unless myjobs.size==16
  since=Process.clock_gettime(Process::CLOCK_MONOTONIC);results=[]
  myjobs.each do |j|
   remains=MAX_SHARD_SEC-(Process.clock_gettime(Process::CLOCK_MONOTONIC)-since)
   if remains<120
    # Matrix is explicit: no source Job is silently upgraded to success.
    results<<{original_file:j['file'],original_job_id:j['id'],status:'NOT_RUN',blocker:'V2_SHARD_TIME_BUDGET_EXHAUSTED'}
   else
    results<<run_one(j,shard,remains)
   end
  end
  atomic_write(File.join(OUT,"shard#{shard}",'本分片16项实际执行汇总.json'),
               {candidate_sha:ENV['GITHUB_SHA'],run_id:ENV['GITHUB_RUN_ID'],shard:shard,items:results,
                total:16,passed:results.count{|r|%w[REAL_PG16_PASS REAL_ORIGINAL_NONPG_PASS].include?(r[:status])},
                original_pg16_pass:results.count{|r|r[:status]=='REAL_PG16_PASS'},
                original_nonpg_pass:results.count{|r|r[:status]=='REAL_ORIGINAL_NONPG_PASS'},
                source_issuer_signed:false})
  matrix_path=File.join(OUT,'66格真实测试矩阵.json')
  matrix=JSON.parse(File.read(matrix_path))
  index=results.to_h{|x|[[x[:original_file],x[:original_job_id]],x]}
  matrix['jobs'].each do |cell|
   r=index[[cell['source_workflow'],cell['original_job_id']]]
   next unless r
   cell['status']=r[:status];cell['current_head_real_pg16_pass']=r[:status]=='REAL_PG16_PASS'
   cell['current_head_real_original_nonpg_pass']=r[:status]=='REAL_ORIGINAL_NONPG_PASS'
   cell['actual_candidate_sha']=ENV['GITHUB_SHA'];cell['actual_run_id']=ENV['GITHUB_RUN_ID'];cell['actual_shard']=shard
   cell['original_command_count_executed']=r[:executed_commands]||0;cell['original_log_sha256']=r[:log_sha256]||nil
   cell['blocker']=r[:blocker] if r[:blocker]
  end
  atomic_write(File.join(OUT,"shard#{shard}",'66格本分片真实执行矩阵.json'),matrix)
  count=results.count{|r|%w[REAL_PG16_PASS REAL_ORIGINAL_NONPG_PASS].include?(r[:status])}
  puts "V2_SHARD_DONE #{shard} total=#{results.size} pass=#{count}"
  deny("SHARD_INCOMPLETE_#{shard}_#{count}_OF_16") if count<16
 end
end
if $PROGRAM_NAME==__FILE__
 begin;V2Shard.main;rescue StandardError=>e;warn e.message;exit 1;end
end
