#!/usr/bin/env ruby
# All 66 original steps/permissions/if/service derived from frozen Git blobs.
require 'json';require 'psych';require 'digest';require 'fileutils';require 'open3'
root=File.expand_path('../../../',__dir__)
catalog=JSON.parse(File.read(File.join(root,'engineering/f05/native-66-closure/evidence/原66项工作流与Job逐项完整执行映射.json')))
raise 'FROZEN_CATALOG_66_REQUIRED' unless catalog['total']==66&&catalog['sources'].size==8
map=catalog['sources'].to_h{|x|[x['file'],x]}
rules=[]
catalog['jobs'].each do |j|
 source=map.fetch(j['file'])
 original=File.join(root,'.github','workflows',j['file'])
 hash,status=Open3.capture2('git','-C',root,'hash-object',original)
 raise 'FROZEN_SOURCE_BLOB_MISMATCH' unless status.success?&&hash.strip==source['blob']&&source['blob']==j['blob']
 job=Psych.safe_load_file(original,aliases:true).fetch('jobs').fetch(j['id'])
 raise 'ORIGINAL_STEPS_MISMATCH' unless job.fetch('steps')==j.fetch('steps')
 rule={key:j['file']+'#'+j['id'],source_blob:hash.strip,
  original_job_json_sha256:Digest::SHA256.hexdigest(JSON.generate(job)),
  step_sha256:job['steps'].map{|step|Digest::SHA256.hexdigest(JSON.generate(step))},
  original_permissions:job['permissions']||{},
  original_service_names:job.fetch('services',{}).keys,
  original_services_sha256:Digest::SHA256.hexdigest(JSON.generate(job['services']||{})),
  original_conditions_sha256:Digest::SHA256.hexdigest(JSON.generate([job['if'],job['steps'].map{|x|x['if']}])),
  original_workdir:job.dig('defaults','run','working-directory'),
  original_run_env_sha256:Digest::SHA256.hexdigest(JSON.generate([job['env'],job['steps'].map{|x|x['env']}])),
  original_steps:job['steps'].size,original_command_count:j['commands'].size}
 raise 'UNSAFE_EXTRA_ORIGINAL_SERVICE' unless rule[:original_service_names]==(j['pg16'] ? ['postgres'] : [])
 rules<<rule
end
raise 'DUPLICATE_OR_INCOMPLETE' unless rules.size==66&&rules.map{|x|x[:key]}.uniq.size==66
path=File.join(__dir__,'evidence','原66项权限服务条件逐项冻结规则.json')
FileUtils.mkdir_p(File.dirname(path));File.write(path,JSON.pretty_generate({schema:'V2_FIXED_GIT_BLOB_RULES_66',rules:rules})+"\n")
puts "V2_FROZEN_66_PERMISSIONS_SERVICES_CONDITIONS_EXACT #{rules.size}"
