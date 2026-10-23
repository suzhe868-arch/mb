require 'yaml'
require 'open3'
require 'json'
branch='feat/f03-f07-publisher-phone-ed25519-nonprod-01'
paths_text,status=Open3.capture2('git','-c','core.quotePath=false','diff','--name-only','origin/main...HEAD')
abort('TRIGGER_AUDIT_GIT_DIFF_FAILED') unless status.success?
changed=paths_text.lines.map(&:strip).reject(&:empty?)
abort('TRIGGER_AUDIT_EMPTY_DIFF') if changed.empty?
def glob_re(pattern)
  out='\\A';i=0
  while i<pattern.length
    if pattern[i,3]=='**/'
      out << '(?:.*/)?';i+=3
    elsif pattern[i,2]=='**'
      out << '.*';i+=2
    elsif pattern[i]=='*'
      out << '[^/]*';i+=1
    elsif pattern[i]=='?'
      out << '[^/]';i+=1
    elsif pattern[i]=='['
      j=pattern.index(']',i+1)
      if j
        out << pattern[i..j];i=j+1
      else
        out << '\\[';i+=1
      end
    else
      out << Regexp.escape(pattern[i]);i+=1
    end
  end
  Regexp.new(out+'\\z')
end
def list(value)
  value.nil? ? [] : value.is_a?(Array) ? value : [value]
end
def branch_match(config,ref)
  include_patterns=list(config['branches'])
  exclude_patterns=list(config['branches-ignore'])
  included=include_patterns.empty? || include_patterns.any?{|p| glob_re(p.to_s).match?(ref)}
  included && !exclude_patterns.any?{|p| glob_re(p.to_s).match?(ref)}
end
def paths_match(config,paths)
  patterns=config['paths']
  ignores=list(config['paths-ignore']).map(&:to_s)
  if patterns
    pats=list(patterns).map(&:to_s)
    paths.any? do |path|
      selected=false
      pats.each do |pattern|
        if pattern.start_with?('!')
          selected=false if glob_re(pattern[1..]).match?(path)
        else
          selected=true if glob_re(pattern).match?(path)
        end
      end
      selected
    end
  elsif !ignores.empty?
    paths.any?{|path| ignores.none?{|pattern| glob_re(pattern).match?(path)}}
  else
    true
  end
end
workflow_files=Dir.glob('.github/workflows/*.{yml,yaml}').sort
parse_errors=[]
potential=[]
frozen_files=workflow_files.select{|f|File.basename(f).include?('f05-7')}
workflow_files.each do |file|
  begin
    doc=YAML.load_file(file,aliases:true)
    raw=doc.is_a?(Hash) ? (doc['on'] || doc[true] || doc[:on]) : nil
    events=raw.is_a?(Array) ? raw.to_h{|e|[e.to_s,{}]} : raw
    events={} unless events.is_a?(Hash)
    if file.include?('f05-7')
      push=events['push']||events[:push]
      if push
        push={} unless push.is_a?(Hash)
        if branch_match(push,branch)&&paths_match(push,changed)
          potential << {file:file,event:'push',paths:changed.select{|p|paths_match(push,[p])}}
        end
      end
      pr=events['pull_request']||events[:pull_request]
      if pr
        pr={} unless pr.is_a?(Hash)
        if branch_match(pr,'main')&&paths_match(pr,changed)
          potential << {file:file,event:'pull_request',paths:changed.select{|p|paths_match(pr,[p])}}
        end
      end
    end
  rescue => e
    parse_errors << {file:file,error:e.class.name+': '+e.message}
  end
end
report={
  status:(potential.empty?&&parse_errors.none? ? 'PASS' : 'FAIL'),
  scanned_workflows:workflow_files.length,
  scanned_f05_7_workflows:frozen_files.length,
  branch:branch,
  changed_paths:changed,
  potential_f05_7_triggers:potential,
  yaml_parse_errors:parse_errors
}
File.write('f03-f07-workflow-trigger-audit.txt',JSON.pretty_generate(report)+"\n")
puts 'F03_F07_WORKFLOW_TRIGGER_AUDIT '+JSON.generate(report)
abort('F05_7_WORKFLOW_TRIGGER_NOT_ISOLATED') unless potential.empty?&&parse_errors.none?
