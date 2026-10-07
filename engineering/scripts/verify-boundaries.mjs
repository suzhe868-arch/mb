import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const pkg = JSON.parse(await read('package.json'));
const lock = JSON.parse(await read('package-lock.json'));

if (pkg.dependencies?.pg !== '8.23.0') throw new Error('F01_PG_VERSION_NOT_PINNED');
if (lock.packages?.['']?.dependencies?.pg !== pkg.dependencies.pg) {
  throw new Error('F01_PG_LOCKFILE_MISMATCH');
}
if (lock.packages?.['node_modules/pg']?.version !== pkg.dependencies.pg) {
  throw new Error('F01_LOCKED_PG_VERSION_MISMATCH');
}
const server = await read('src/server.mjs');
const probe = await read('src/postgres.mjs');
const app = await read('src/app.mjs');
for (const [source, file] of [[server, 'src/server.mjs'], [probe, 'src/postgres.mjs'], [app, 'src/app.mjs']]) {
  if (/DROP\s+(?:SCHEMA|TABLE)|DELETE\s+FROM|CREATE\s+TABLE/i.test(source)) {
    throw new Error('F01_BUSINESS_SCHEMA_WRITE_FORBIDDEN: ' + file);
  }
}
if (!probe.includes('SELECT 1::int AS ok')) throw new Error('F01_MISSING_REAL_DB_PROBE');
if (!server.includes('createPgReadinessProbe')) throw new Error('F01_REAL_DB_PROBE_NOT_WIRED');
if (app.includes('health/ready') && !app.includes('DEPENDENCY_NOT_READY')) {
  throw new Error('F01_NO_DATABASE_NEGATIVE_STATE');
}
for (const path of ['.env.example', '.env.test.example', '.env.production.example', '.gitignore']) {
  await access(new URL(path, root));
}
console.log('F01 engineering boundaries PASS: frozen pg, real SELECT 1, no schema write');
