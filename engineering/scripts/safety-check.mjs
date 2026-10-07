import { readFile, access } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const candidates = [
  '.env.example', '.env.test.example', '.env.production.example',
  'src/app.mjs', 'src/config.mjs', 'src/server.mjs',
];
const prohibited = ['COLLECTOR_BASE_URL', 'COLLECTOR_PHONE_PATH', 'can_call_wholesale_phone', 'PHONE_PATH'];
for (const name of candidates) {
  const text = await readFile(new URL(name, root), 'utf8');
  for (const marker of prohibited) {
    if (text.includes(marker)) throw new Error('F01_FORBIDDEN_LEGACY_SETTING: ' + name);
  }
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) {
    throw new Error('F01_PRIVATE_KEY_EXPOSURE: ' + name);
  }
}
const ignore = await readFile(new URL('.gitignore', root), 'utf8');
if (!ignore.split(/\r?\n/).includes('.env')) throw new Error('F01_ENV_GITIGNORE_MISSING');
await access(new URL('package-lock.json', root));
console.log('F01 safety: configuration and ignored secrets checks PASS');
