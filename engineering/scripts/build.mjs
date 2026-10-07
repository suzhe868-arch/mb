import { readdir, rm, mkdir, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const src = new URL('../src/', import.meta.url);
const dist = new URL('../dist/', import.meta.url);
const names = (await readdir(src)).filter(name => name.endsWith('.mjs')).sort();
if (!names.includes('app.mjs') || !names.includes('server.mjs') || !names.includes('config.mjs')) {
  throw new Error('F01_BUILD_MISSING_ENTRY');
}
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const name of names) {
  const path = new URL(name, src);
  const check = spawnSync(process.execPath, ['--check', path.pathname], { encoding: 'utf8' });
  if (check.status !== 0) throw new Error('F01_BUILD_SYNTAX_FAIL: ' + name + ': ' + check.stderr);
  await copyFile(path, new URL(name, dist));
}
console.log('F01 build: syntax checked and staged:', names.join(', '));
