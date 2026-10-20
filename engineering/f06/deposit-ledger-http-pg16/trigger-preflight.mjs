import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const branch = 'feat/f06-real-deposit-ledger-http-pg16-01';
const workflowPath = '.github/workflows/f06-real-deposit-ledger-pg16-onejob.yml';
const changed = [
  workflowPath,
  'engineering/f06/deposit-ledger-http-pg16/ci-job.sh',
  'engineering/f06/deposit-ledger-http-pg16/disposable-db.sh',
  'engineering/f06/deposit-ledger-http-pg16/native-regression.sh',
  'engineering/f06/deposit-ledger-http-pg16/trigger-preflight.mjs',
  'engineering/f06/deposit-ledger-http-pg16/audit-seal.mjs',
  'engineering/f06/deposit-ledger-http-pg16/server.mjs',
  'engineering/f06/deposit-ledger-http-pg16/tests/http.test.mjs',
  'engineering/f06/deposit-ledger-http-pg16/tests/https.test.mjs',
  'engineering/f06/deposit-ledger-http-pg16/B自验与A交接.md'
];
assert.equal(process.env.GITHUB_REPOSITORY, 'suzhe868-arch/mb');
assert.equal(process.env.GITHUB_REF, 'refs/heads/' + branch);
assert.equal(process.env.GITHUB_REF_NAME, branch);
assert.equal(process.env.GITHUB_EVENT_NAME, 'push');
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), process.env.GITHUB_SHA);

function rootBlock(text, name) {
  const lines = text.replace(/\r/g, '').split('\n');
  const start = lines.findIndex(line => new RegExp("^['\"]?" + name + "['\"]?:\\s*").test(line));
  if (start < 0) return '';
  const out = [lines[start]];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\S/.test(lines[i]) && !lines[i].startsWith('#')) break;
    out.push(lines[i]);
  }
  return out.join('\n');
}
function eventBlock(onBlock, event) {
  const lines = onBlock.split('\n');
  const start = lines.findIndex(line => new RegExp("^ {2}['\"]?" + event + "['\"]?:").test(line));
  if (start >= 0) {
    const out = [lines[start]];
    for (let i = start + 1; i < lines.length; i++) {
      if (/^ {2}\S/.test(lines[i]) && !lines[i].startsWith('  #')) break;
      if (/^\S/.test(lines[i]) && !lines[i].startsWith('#')) break;
      out.push(lines[i]);
    }
    return out.join('\n');
  }
  const first = (lines[0] || '').replace(/^['"]?on['"]?:\s*/, '').trim();
  if (first.startsWith('[') && first.endsWith(']')) {
    const names = first.slice(1, -1).split(',').map(x => x.trim().replace(/^['"]|['"]$/g, ''));
    return names.includes(event) ? '  ' + event + ':' : '';
  }
  if (first.startsWith('{')) {
    const match = first.match(new RegExp(event + '\\s*:\\s*\\{([^{}]*)\\}'));
    return match ? '  ' + event + ':\n    ' + match[1].replace(/,\s*/g, '\n    ') : '';
  }
  return '';
}
function values(block, key) {
  const lines = block.split('\n');
  const index = lines.findIndex(line => new RegExp('^\\s+' + key + '\\s*:').test(line));
  if (index < 0) return null;
  const line = lines[index];
  const value = line.slice(line.indexOf(':') + 1).trim();
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1).split(',').map(x => x.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  }
  if (value) return [value.replace(/^['"]|['"]$/g, '')];
  const indent = (line.match(/^\s*/) || [''])[0].length;
  const result = [];
  for (let i = index + 1; i < lines.length; i++) {
    const currentIndent = (lines[i].match(/^\s*/) || [''])[0].length;
    if (lines[i].trim() && currentIndent <= indent) break;
    const item = lines[i].match(/^\s*-\s*(.+)$/);
    if (item) result.push(item[1].trim().replace(/^['"]|['"]$/g, ''));
  }
  return result;
}
function glob(pattern, path) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__DOUBLESTAR__').replace(/\*/g, '[^/]*')
    .replace(/__DOUBLESTAR__/g, '.*').replace(/\?/g, '.');
  return new RegExp('^' + escaped + '$').test(path);
}
function branchMatches(patterns, branchName) {
  if (!patterns) return true;
  let included = false;
  for (const pattern of patterns) {
    if (pattern.startsWith('!')) {
      if (glob(pattern.slice(1), branchName)) included = false;
    } else if (glob(pattern, branchName)) included = true;
  }
  return included;
}
function pathMatches(patterns, path) {
  if (!patterns) return true;
  let included = false;
  for (const pattern of patterns) {
    if (pattern.startsWith('!')) {
      if (glob(pattern.slice(1), path)) included = false;
    } else if (glob(pattern, path)) included = true;
  }
  return included;
}
function triggerMatches(block, branchName, files) {
  if (!block) return false;
  const branches = values(block, 'branches');
  const ignoredBranches = values(block, 'branches-ignore');
  if (!branchMatches(branches, branchName)) return false;
  if (ignoredBranches?.some(pattern => glob(pattern, branchName))) return false;
  const paths = values(block, 'paths');
  const ignoredPaths = values(block, 'paths-ignore');
  if (paths && !files.some(path => pathMatches(paths, path))) return false;
  if (ignoredPaths && files.every(path => ignoredPaths.some(pattern => glob(pattern, path)))) return false;
  return true;
}

const workflowFiles = execFileSync('git', ['ls-files', '.github/workflows'], { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);
assert.ok(workflowFiles.includes(workflowPath), 'new one-job workflow must be tracked');
const pushMatches = [];
const prMatches = [];
for (const path of workflowFiles) {
  const text = readFileSync(path, 'utf8');
  const onBlock = rootBlock(text, 'on');
  const push = eventBlock(onBlock, 'push');
  const pr = eventBlock(onBlock, 'pull_request');
  if (triggerMatches(push, branch, changed)) pushMatches.push(path);
  if (triggerMatches(pr, 'main', changed)) prMatches.push(path);
}
assert.deepEqual(pushMatches, [workflowPath], 'this Push must trigger only the new one-job workflow');
assert.deepEqual(prMatches, [], 'these paths must not trigger unrelated pull_request workflows');
console.log('WORKFLOW_TRIGGER_PREFLIGHT_PASS workflows=' + workflowFiles.length +
  ' push_matches=1 pr_matches=0 branch=' + branch + ' changed_paths=' + changed.length);
