import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

for (const script of ['generate-contract-types.py', 'generate-operation-index.py']) {
  test(`${script} reads the UTF-8 OpenAPI under a Chinese path`, () => {
    const result = spawnSync('python', [`scripts/${script}`], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });
}
