import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const tscPath = 'node_modules/typescript/bin/tsc';
const hasTypeScript = existsSync(tscPath);

test('W03/W04/W06 current static slices pass strict TypeScript check', {
  skip: hasTypeScript ? false : 'TypeScript devDependency is declared but not installed in this artifact environment; run pnpm install then pnpm typecheck in the real engineering environment.'
}, () => {
  const r = spawnSync(process.execPath, [tscPath, '-p', 'tests/typecheck/tsconfig.w04-w06.json'], { encoding: 'utf8' });
  assert.equal(r.status, 0, `${r.stdout}
${r.stderr}`);
});

test('TypeScript dependency and Node runtime contract are declared for the deferred typecheck gate', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.ok(pkg.devDependencies?.typescript, 'typescript devDependency must be declared');
  assert.equal(pkg.engines?.node, '>=22');
});
