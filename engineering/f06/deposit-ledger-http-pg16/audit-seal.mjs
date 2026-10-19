import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';
import { getPublicStructure } from '../../f02-1/schema-integrity.mjs';
import { verify as verifyF062 } from '../lock-lifecycle-ci/migration.mjs';
import { withF062 } from '../deposit-ledger-ci/migration.mjs';

const branch = 'feat/f06-real-deposit-ledger-http-pg16-01';
const parentBranch = 'feat/f06-3a-deposit-ledger-ci';
const evidenceDir = resolve('engineering/f06/deposit-ledger-http-pg16/evidence');
const beforePath = resolve(evidenceDir, 'parent-seal-before.json');
const afterPath = resolve(evidenceDir, 'parent-seal-after.json');
const sourceUrl = process.env.F03_1_DATABASE_URL;
const targetUrl = process.env.F06_LOCK_DATABASE_URL;
const mode = process.argv[2];
const schemas = ['public', 'd1_owner_ci', 'f06_1_lock_ci', 'f06_2_ci'];
const expectedTableCount = 190;

function requireEnvironment() {
  assert.equal(process.env.GITHUB_REPOSITORY, 'suzhe868-arch/mb');
  assert.equal(process.env.GITHUB_EVENT_NAME, 'push');
  assert.equal(process.env.GITHUB_ACTIONS, 'true');
  assert.equal(process.env.CI, 'true');
  assert.equal(process.env.APP_ENV, 'test');
  assert.equal(process.env.NODE_ENV, 'test');
  assert.equal(process.env.GITHUB_REF, 'refs/heads/' + parentBranch);
  assert.equal(process.env.GITHUB_REF_NAME, parentBranch);
  assert.equal(process.env.F06_REAL_ENTRY_REF, 'refs/heads/' + branch);
  assert.equal(process.env.F06_REAL_ENTRY_BRANCH, branch);
  assert.equal(process.env.F06_REAL_ENTRY_EVENT, 'push');
  assert.equal(process.env.F06_REAL_ENTRY_SHA, process.env.GITHUB_SHA);
  assert.equal(process.env.F06_REAL_ENTRY_RUN_ID, process.env.GITHUB_RUN_ID);
  assert.ok(/^[0-9]{6,20}$/.test(process.env.GITHUB_RUN_ID || ''));
  assert.equal(process.env.F06_REAL_DEPOSIT_TEST_CONSENT, 'I_AUTHORIZE_DISPOSABLE_F06_DEPOSIT_HTTP_PG16_ONLY');
  assert.ok(sourceUrl && targetUrl);
  assert.notEqual(sourceUrl, targetUrl);
}
function sha(value) {
  return createHash('sha256').update(value).digest('hex');
}
async function scalar(client, sql, args = []) {
  const result = await client.query(sql, args);
  return result.rows[0];
}
async function tableNames(client) {
  return (await client.query(
    "SELECT n.nspname AS schema_name, c.relname AS table_name " +
    "FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace " +
    "WHERE n.nspname = ANY($1::text[]) AND c.relkind IN ('r','p') " +
    "ORDER BY n.nspname,c.relname", [schemas])).rows.map(row => row.schema_name + '.' + row.table_name);
}
async function readTableMap(client) {
  const names = await tableNames(client);
  const map = {};
  for (const name of names) {
    const parts = name.split('.');
    assert.equal(parts.length, 2);
    assert.match(parts[0], /^[a-z0-9_]+$/);
    assert.match(parts[1], /^[a-z0-9_]+$/);
    const ident = '"' + parts[0] + '"."' + parts[1] + '"';
    const result = await scalar(client,
      "SELECT count(*)::int AS row_count, md5(COALESCE(string_agg(to_jsonb(x)::text, " +
      "'|' ORDER BY to_jsonb(x)::text),'')) AS row_md5 FROM " + ident + ' x');
    map[name] = { rows: Number(result.row_count), md5: result.row_md5 };
  }
  return map;
}
async function identity(client, label, allowSidecar = false) {
  const value = await scalar(client,
    "SELECT current_database() AS database_name,current_user AS database_user," +
    "current_setting('server_version_num')::int AS server_version_num," +
    "pg_backend_pid() AS backend_pid," +
    "(SELECT oid::text FROM pg_database WHERE datname=current_database()) AS database_oid," +
    "(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS is_superuser," +
    "(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) AS can_create_database," +
    "to_regnamespace('f06_3a_ci') IS NOT NULL AS has_f06_3a_schema");
  assert.equal(value.is_superuser, false, label + ' must use a non-superuser');
  assert.equal(value.can_create_database, false, label + ' role must not create databases');
  assert.ok(value.server_version_num >= 160000 && value.server_version_num < 170000,
    label + ' must use PostgreSQL 16');
  if (!allowSidecar) assert.equal(value.has_f06_3a_schema, false, label + ' must not retain the test sidecar at seal time');
  return value;
}
async function signedMetadata(client, label) {
  const ledger = (await client.query(
    'SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
  assert.equal(ledger.length, 24, label + ' must retain all 24 signed migrations');
  const catalog = await getPublicStructure(client);
  assert.equal(ledger.at(-1).structure_sha256, catalog.sha256, label + ' migration ledger/catalog mismatch');
  const attestations = {};
  for (const table of ['d1_owner_ci.attestation','f06_1_lock_ci.attestation','f06_2_ci.attestation']) {
    const parts = table.split('.');
    const result = await client.query('SELECT to_jsonb(x) AS row FROM "' + parts[0] + '"."' + parts[1] + '" x ORDER BY to_jsonb(x)::text');
    assert.equal(result.rowCount, 1, label + ' must contain exactly one signed attestation in ' + table);
    attestations[table] = result.rows.map(row => row.row);
  }
  return { ledger, catalog, attestations };
}
async function snapshot(client, label) {
  const ident = await identity(client, label, false);
  const signed = await signedMetadata(client, label);
  const tableMap = await readTableMap(client);
  const tableCount = Object.keys(tableMap).length;
  assert.equal(tableCount, expectedTableCount, label + ' must seal exactly 190 signed parent tables');
  return {
    label,
    database_name: ident.database_name,
    database_user: ident.database_user,
    database_oid: ident.database_oid,
    backend_pid: Number(ident.backend_pid),
    server_version_num: ident.server_version_num,
    table_count: tableCount,
    table_row_seal_sha256: sha(JSON.stringify(tableMap)),
    ledger_count: signed.ledger.length,
    ledger_sha256: sha(JSON.stringify(signed.ledger)),
    catalog_sha256: signed.catalog.sha256,
    attestation_sha256: sha(JSON.stringify(signed.attestations)),
    attestations: signed.attestations,
    tables: tableMap
  };
}
async function connect(url) {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000, statement_timeout: 15000 });
  await client.connect();
  return client;
}
async function verifyParent(source) {
  const result = await withF062(() => verifyF062(source));
  assert.equal(result.verified, true, 'F06-2 signed parent verification must pass');
  return result;
}
requireEnvironment();
assert.ok(['before','after','verify-scenario'].includes(mode), 'mode required');
await mkdir(evidenceDir, { recursive: true });
const source = await connect(sourceUrl);
const target = await connect(targetUrl);
try {
  if (mode === 'verify-scenario') {
    const sourceIdentity = await identity(source, 'scenario source', true);
    const targetIdentity = await identity(target, 'audit copy', false);
    assert.notEqual(sourceIdentity.database_oid, targetIdentity.database_oid);
    const sourceNames = await tableNames(source);
    const targetNames = await tableNames(target);
    assert.equal(sourceNames.length, expectedTableCount);
    assert.equal(targetNames.length, expectedTableCount);
    assert.deepEqual(sourceNames, targetNames);
    const sidecar = await scalar(source, "SELECT to_regnamespace('f06_3a_ci') IS NOT NULL AS present");
    assert.equal(sidecar.present, true, 'F06-3A sidecar must be present during HTTP scenarios');
    const absent = await scalar(target, "SELECT to_regnamespace('f06_3a_ci') IS NOT NULL AS present");
    assert.equal(absent.present, false, 'audit copy must remain a pristine parent baseline');
    await verifyParent(source);
    const counts = await scalar(source,
      "SELECT (SELECT count(*)::int FROM public.deposit_receipts) AS receipts," +
      "(SELECT count(*)::int FROM f06_3a_ci.receipt_provenance) AS synthetic_provenance," +
      "(SELECT count(*)::int FROM f06_3a_ci.adjustments) AS append_only_adjustments");
    console.log('F06_REAL_DEPOSIT_SCENARIO_PARENT_VERIFIED ' + JSON.stringify({
      head_sha: process.env.F06_REAL_ENTRY_SHA, run_id: process.env.F06_REAL_ENTRY_RUN_ID,
      source_oid: sourceIdentity.database_oid, audit_oid: targetIdentity.database_oid,
      parent_table_count: expectedTableCount, sidecar_present: true, scenario_counts: counts
    }));
  } else {
    const sourceSeal = await snapshot(source, 'source');
    const targetSeal = await snapshot(target, 'audit-copy');
    assert.notEqual(sourceSeal.database_oid, targetSeal.database_oid, 'two distinct physical database OIDs required');
    assert.notEqual(sourceSeal.backend_pid, targetSeal.backend_pid, 'two independent PostgreSQL backend PIDs required');
    assert.deepEqual(sourceSeal.tables, targetSeal.tables, 'source and audit-copy full row seals must match');
    assert.equal(sourceSeal.table_row_seal_sha256, targetSeal.table_row_seal_sha256);
    assert.equal(sourceSeal.ledger_sha256, targetSeal.ledger_sha256);
    assert.equal(sourceSeal.catalog_sha256, targetSeal.catalog_sha256);
    assert.equal(sourceSeal.attestation_sha256, targetSeal.attestation_sha256);
    if (mode === 'before') {
      await verifyParent(source);
      const current = {
        status: 'PASS', mode,
        branch,
        head_sha: process.env.F06_REAL_ENTRY_SHA,
        run_id: process.env.F06_REAL_ENTRY_RUN_ID,
        source: sourceSeal,
        audit_copy: targetSeal
      };
      await writeFile(beforePath, JSON.stringify(current, null, 2) + '\n', { flag: 'wx' });
      console.log('F06_REAL_DEPOSIT_PARENT_SEAL_BEFORE_PASS ' + JSON.stringify({
        head_sha: current.head_sha, run_id: current.run_id,
        table_count: expectedTableCount, ledger_count: 24,
        source_oid: sourceSeal.database_oid, audit_oid: targetSeal.database_oid,
        source_pid: sourceSeal.backend_pid, audit_pid: targetSeal.backend_pid,
        full_row_seal_sha256: sourceSeal.table_row_seal_sha256
      }));
    } else {
      const before = JSON.parse(await readFile(beforePath, 'utf8'));
      assert.equal(before.head_sha, process.env.F06_REAL_ENTRY_SHA, 'before/after must use the same SHA');
      assert.equal(before.run_id, process.env.F06_REAL_ENTRY_RUN_ID, 'before/after must use the same official Run');
      assert.notEqual(sourceSeal.database_oid, before.source.database_oid,
        'restored source must have a new physical PostgreSQL database OID');
      assert.equal(targetSeal.database_oid, before.audit_copy.database_oid,
        'audit-copy database OID must remain unchanged');
      assert.deepEqual(sourceSeal.tables, before.source.tables, 'restored source differs from original 190-table seal');
      assert.deepEqual(targetSeal.tables, before.audit_copy.tables, 'audit-copy differs from original seal');
      assert.equal(sourceSeal.table_row_seal_sha256, before.source.table_row_seal_sha256);
      assert.equal(targetSeal.table_row_seal_sha256, before.audit_copy.table_row_seal_sha256);
      assert.deepEqual(sourceSeal.tables, targetSeal.tables, 'post-restore source/audit-copy rows differ');
      await writeFile(afterPath, JSON.stringify({
        status: 'PASS', mode: 'after', branch,
        head_sha: process.env.F06_REAL_ENTRY_SHA,
        run_id: process.env.F06_REAL_ENTRY_RUN_ID,
        source: sourceSeal, audit_copy: targetSeal
      }, null, 2) + '\n', { flag: 'wx' });
      console.log('F06_REAL_DEPOSIT_PARENT_SEAL_AFTER_PASS ' + JSON.stringify({
        head_sha: process.env.F06_REAL_ENTRY_SHA, run_id: process.env.F06_REAL_ENTRY_RUN_ID,
        table_count: expectedTableCount, ledger_count: 24,
        source_oid_before: before.source.database_oid, source_oid_after: sourceSeal.database_oid,
        audit_oid: targetSeal.database_oid, source_pid_after: sourceSeal.backend_pid,
        audit_pid: targetSeal.backend_pid,
        full_row_seal_sha256: sourceSeal.table_row_seal_sha256
      }));
    }
  }
} finally {
  await source.end();
  await target.end();
}
