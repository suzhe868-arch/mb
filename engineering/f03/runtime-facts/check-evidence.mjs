// Offline post-run inspection of schema-only / inventory artifacts; NO DB/SQL connections.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {verifyArtifactHashes,assertSameApprovedSchemaExceptPgDumpKey} from './evidence-hashes.mjs';
const root=new URL('./artifacts/',import.meta.url);
const [sqlBytes,inventoryBytes,manifestBytes]=await Promise.all(['pg16_schema_only.sql','pg16_inventory.json','sha256sums.txt'].map(n=>readFile(new URL(n,root))));
const sql=sqlBytes.toString('utf8'),raw=inventoryBytes.toString('utf8'),hashes=manifestBytes.toString('utf8');
const actualHashes=verifyArtifactHashes({'pg16_schema_only.sql':sqlBytes,'pg16_inventory.json':inventoryBytes},hashes);
const d=JSON.parse(raw);
assert.equal(d.kind,'F03_1_PG16_SCHEMA_ONLY');
assert.deepEqual({tables:d.tables,columns:d.columns,constraints:d.constraints,indexes:d.indexes},{tables:80,columns:487,constraints:299,indexes:123});
assert.equal(d.identity.database_name,'f03_auth_test');
assert.equal(d.identity.db_user,'f03_ci');
assert.ok(Number(d.identity.version_num)>=160000&&Number(d.identity.version_num)<170000);
assert.equal(d.versionChain.length,2);
assert.deepEqual(d.versionChain.map(x=>x.migration_id),['000001_current_initial','000002_pc_auth_sessions']);
assert.ok(d.versionChain.every(x=>/^[a-f0-9]{64}$/.test(x.checksum)&&/^[a-f0-9]{64}$/.test(x.structure_sha256)));
const physicalTables=[...sql.matchAll(/^CREATE TABLE public\.([a-z][a-z0-9_]*) \($/gm)].map(m=>m[1]);
assert.equal(physicalTables.length,80);
assert.equal(new Set(physicalTables).size,80);
for(const t of ['role_default_permission_history','role_permission_defaults','employee_permission_overrides','permissions','pc_login_accounts','pc_auth_sessions','f03_schema_migrations','f02_schema_migrations'])assert.ok(physicalTables.includes(t));
for(const forbidden of ['employee_capability_scope_bindings','employee_team_memberships','employee_receiving_eligibility','governance_control_scopes','handover_batches','handover_items','permission_fact_versions','vehicle_upstream_publishers'])assert.ok(!physicalTables.includes(forbidden),'UNAUTHORIZED_F03_2_SCHEMA_'+forbidden);
const evidenceRoot=new URL('./evidence/',import.meta.url);
if(existsSync(new URL('pg16_schema_only.sql',evidenceRoot))){
 const archivedSql=await readFile(new URL('pg16_schema_only.sql',evidenceRoot));
 const archivedInventory=await readFile(new URL('pg16_inventory.json',evidenceRoot));
 const archivedManifestBytes=await readFile(new URL('sha256sums.txt',evidenceRoot));
 // Independently verify the ORIGINAL archived bytes using their OWN source-run manifest.
 const archivedHashes=verifyArtifactHashes({'pg16_schema_only.sql':archivedSql,'pg16_inventory.json':archivedInventory},archivedManifestBytes.toString('utf8'));
 assert.ok(inventoryBytes.equals(archivedInventory),'ARCHIVED_INVENTORY_BYTES_DIFFER_FROM_CURRENT_CI');
 assertSameApprovedSchemaExceptPgDumpKey(archivedSql,sqlBytes);
 // Every raw SQL export has a fresh paired pg_dump restrict key. Source and
 // current SHA256 MUST each match its original raw bytes; manifest strings
 // MUST NOT be deceptively rewritten into matching cross-run hashes.
 console.log('F03-2-1A E1 ARCHIVE SOURCE RAW SHA256 '+JSON.stringify(archivedHashes));
 console.log('F03-2-1A E1 CURRENT RAW SHA256 '+JSON.stringify(actualHashes));
 const source=await readFile(new URL('SOURCE.md',evidenceRoot),'utf8');
 assert.ok(/source_run_id:\s*\d+/.test(source)&&/source_commit_sha:\s*[0-9a-f]{40}/.test(source),'ARCHIVE_PROVENANCE_REQUIRED');
 console.log('F03-2-1A E1 VERIFICATION: RAW SOURCE/CI HASHES VALID, inventory identical, SQL identical except paired pg_dump ephemeral restrict key');
}else console.log('F03-2-1A E1 ARCHIVE_NOT_YET_COMMITTED: current run will publish immutable source after successful checks');
console.log('F03-2-1A E1 VERIFIED SHA-256 '+JSON.stringify(actualHashes));
console.log('F03-2-1A SEALED PG16 EVIDENCE PASS: unchanged 80 tables / 487 columns / 299 constraints / 123 indexes; two migrations; no F03-2 DDL');
