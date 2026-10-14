// F06-5C-PG1 v2：对真实PG16编目签名做精确三项版本化差分，不篡改原冻结验证器。
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';

export const PARENT_CATALOG_SHA256='5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4';
const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const EXPECTED=[
 ['constraint','transactions.pg1_deferred_signed_cancel'],
 ['trigger','f05_8_priority_ci.pg1_signed_priority_insert'],
 ['trigger','transactions.pg1_deferred_signed_cancel']
];
const SHA=/^[0-9a-f]{64}$/;
export const sha256=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');

export function gate(){
 const must={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'push',GITHUB_REPOSITORY:'suzhe868-arch/mb',
  GITHUB_REF:'refs/heads/fix/f06-5c-pg1-parent-priority-guard-ci',
  CI:'true',APP_ENV:'test',NODE_ENV:'test',F03_1_DATABASE_URL:DSN,
  F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'};
 for(const [k,v] of Object.entries(must))if(process.env[k]!==v)throw Error('F06_PG1_V2_ENV_DENIED_'+k);
 if(!/^[0-9]{6,20}$/.test(process.env.GITHUB_RUN_ID||''))throw Error('F06_PG1_V2_UNSIGNED_GITHUB_RUN');
}
async function native(c){
 const q=(await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cd")).rows[0];
 if(q.db!=='f03_auth_test'||q.usr!=='f03_ci'||q.su||q.cd||q.ver<160000||q.ver>=170000)
  throw Error('F06_PG1_V2_NONPRIVILEGED_PG16_REQUIRED');
}
// 签名父链全量私有Sidecar源字节证明。只读当前DB与未修改的原SQL文件，不调用冻结旧版验证器伪装新Catalog。
const SIGNED_PARENTS=[
 ['f06_3b_ci','lock-transaction-ci','F06_3B_CI_ONLY_SIDECAR'],
 ['f06_3c1_ci','refund-pending-ci','F06_3C1_CI_ONLY'],
 ['f06_4a_ci','transaction-cancel-ci','F06_4A_CI_ONLY'],
 ['f06_4b_ci','transaction-handoff-ci','F06_4B_CI_ONLY'],
 ['f06_4c_ci','post-handoff-cancel-ci','F06_4C_CI_ONLY'],
 ['f06_5a_ci','transaction-refund-ci','F06_5A_CI_ONLY'],
 ['f06_5b_ci','lock-refund-conversion-guard-ci','F06_5B_CI_ONLY']
];
async function signedParentSidecars(c,ledgerHash){
 const seals={};
 for(const [schema,folder,name] of SIGNED_PARENTS){
  const rows=(await c.query('SELECT * FROM '+schema+'.attestation')).rows;
  if(rows.length!==1)throw Error('F06_PG1_V2_SIGNED_PARENT_ATTESTATION_COUNT_'+schema);
  const a=rows[0],source=await readFile(new URL('../'+folder+'/sidecar.sql',import.meta.url),'utf8');
  if(a.seal_name!==name||a.source_sha256!==sha256(source)||
     a.public_catalog_sha256!==PARENT_CATALOG_SHA256)
   throw Error('F06_PG1_V2_SIGNED_PARENT_SOURCE_MISMATCH_'+schema);
  const ledgerField=schema==='f06_3b_ci'?'migration_ledger_sha256':'old_ledger_sha256';
  if(a[ledgerField]!==ledgerHash)throw Error('F06_PG1_V2_SIGNED_PARENT_LEDGER_MISMATCH_'+schema);
  seals[schema]=a.source_sha256;
 }
 const v=await c.query(`SELECT
  (SELECT f06_3b_sha256 FROM f06_3c1_ci.attestation) a3c1,
  (SELECT parent_f06_3c1_sha256 FROM f06_4a_ci.attestation) a4a,
  (SELECT parent_f06_4a_sha256 FROM f06_4b_ci.attestation) a4b,
  (SELECT parent_f06_3b_sha256 FROM f06_4b_ci.attestation) b4b,
  (SELECT parent_f06_4b_sha256 FROM f06_4c_ci.attestation) a4c,
  (SELECT parent_f06_4a_sha256 FROM f06_4c_ci.attestation) b4c,
  (SELECT parent_f06_4c_sha256 FROM f06_5a_ci.attestation) a5a,
  (SELECT parent_f06_5a_sha256 FROM f06_5b_ci.attestation) a5b`);
 const x=v.rows[0];
 const linkage=[
  [x.a3c1,seals.f06_3b_ci],[x.a4a,seals.f06_3c1_ci],
  [x.a4b,seals.f06_4a_ci],[x.b4b,seals.f06_3b_ci],
  [x.a4c,seals.f06_4b_ci],[x.b4c,seals.f06_4a_ci],
  [x.a5a,seals.f06_4c_ci],[x.a5b,seals.f06_5a_ci]
 ];
 if(linkage.some(([a,b])=>a!==b))throw Error('F06_PG1_V2_SIGNED_PARENT_CHAIN_LINK_DRIFT');
 return sha256(seals);
}
async function parentSeal(c){
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(ledger.length!==24)throw Error('F06_PG1_V2_LEDGER_COUNT_DRIFT');
 const defs=(await c.query("SELECT p.proname,pg_get_functiondef(p.oid) AS def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('f05_8_priority_guard','f05_8_reconcile_scope_ci','f05_8_close_for_occupancy','f05_8_source_change_ci') ORDER BY p.proname")).rows;
 if(defs.length!==4)throw Error('F06_PG1_V2_PARENT_FUNCTIONS_MISSING');
 const cnt=(await c.query("SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY($1::text[]) AND c.relkind IN ('r','p')",
 [['public','d1_owner_ci','f06_1_lock_ci','f06_2_ci','f06_3a_ci','f06_3b_ci','f06_3c1_ci','f06_4a_ci','f06_4b_ci','f06_4c_ci','f06_5a_ci','f06_5b_ci']])).rows[0].n;
 if(cnt!==190)throw Error('F06_PG1_V2_FROZEN_190_TABLE_REQUIRED');
 return{ledgerHash:sha256(ledger),priorityHash:sha256(defs),tableCount:cnt,sidecarChainHash:await signedParentSidecars(c,sha256(ledger))};
}
export function compareCatalog(pre,post){
 if(pre.sha256!==PARENT_CATALOG_SHA256)throw Error('F06_PG1_V2_UNSIGNED_PARENT_CATALOG');
 const baseline=new Map();
 for(const [i,o] of pre.objects.entries()){
  const k=o.kind+'|'+o.name;
  if(baseline.has(k))throw Error('F06_PG1_V2_DUPLICATE_PARENT_OBJECT_'+k);
  baseline.set(k,{...o,index:i});
 }
 const actual=new Map();
 for(const [i,o] of post.objects.entries()){
  const k=o.kind+'|'+o.name;
  if(actual.has(k))throw Error('F06_PG1_V2_DUPLICATE_POST_OBJECT_'+k);
  actual.set(k,{...o,index:i});
 }
 const changed=pre.objects.filter(o=>!actual.has(o.kind+'|'+o.name)||actual.get(o.kind+'|'+o.name).definition!==o.definition);
 if(changed.length)throw Error('F06_PG1_V2_FROZEN_PUBLIC_OBJECT_MODIFIED');
 const additions=post.objects.filter(o=>!baseline.has(o.kind+'|'+o.name));
 const expected=EXPECTED.map(([kind,name])=>kind+'|'+name).sort();
 const names=additions.map(o=>o.kind+'|'+o.name).sort();
 assert.deepEqual(names,expected,'F06_PG1_V2_UNAUTHORIZED_PUBLIC_CATALOG_DELTA');
 for(const o of additions){
  if(o.kind==='trigger'&&!o.definition.endsWith('|enabled=O'))
   throw Error('F06_PG1_V2_TRIGGER_DISABLED_'+o.name);
  if(o.kind==='constraint'&&!o.definition.includes('deferrable=true|deferred=true'))
   throw Error('F06_PG1_V2_CANCEL_CONSTRAINT_NOT_DEFERRED');
 }
 // 恢复父结构时仅移除精确签字的三项，保留原物件及排序/定义后重新计算原算法。
 const projected=post.objects.filter(o=>!expected.includes(o.kind+'|'+o.name));
 const projectedHash=sha256(projected);
 if(projectedHash!==PARENT_CATALOG_SHA256||projected.length!==pre.objects.length)
  throw Error('F06_PG1_V2_PROJECTED_PARENT_CATALOG_DRIFT');
 const manifest=additions.map(o=>({kind:o.kind,name:o.name,definitionSHA256:sha256(o.definition)}));
 return{preCatalog:pre.sha256,postCatalog:post.sha256,projectedParentCatalog:projectedHash,
  deltaManifest:manifest,deltaSHA256:sha256(manifest)};
}
export async function snapshotForAttestation(c,preCatalog){
 gate();await native(c);
 const post=await getPublicStructure(c);
 return {...compareCatalog(preCatalog,post),...await parentSeal(c)};
}
export async function verify(c){
 gate();await native(c);
 const r=(await c.query('SELECT * FROM f06_5c_pg1_ci.attestation')).rows;
 if(r.length!==1||r[0].name!=='F06_5C_PG1')throw Error('F06_PG1_V2_MISSING_IMMUTABLE_ATTESTATION');
 const a=r[0];
 const sql=await readFile(new URL('./sidecar.sql',import.meta.url),'utf8');
 if(a.source_sha256!==sha256(sql))throw Error('F06_PG1_V2_PATCH_SOURCE_TAMPER');
 const actual=await getPublicStructure(c);
 if(a.parent_catalog_sha256!==PARENT_CATALOG_SHA256||a.post_catalog_sha256!==actual.sha256)
  throw Error('F06_PG1_V2_CATALOG_VERSION_DRIFT');
 const expected=EXPECTED.map(([kind,name])=>kind+'|'+name).sort();
 const extras=actual.objects.filter(o=>expected.includes(o.kind+'|'+o.name));
 const projected=actual.objects.filter(o=>!expected.includes(o.kind+'|'+o.name));
 if(extras.length!==3||sha256(projected)!==PARENT_CATALOG_SHA256)
  throw Error('F06_PG1_V2_FROZEN_CATALOG_PROJECTION_MISMATCH');
 const manifest=extras.map(o=>({kind:o.kind,name:o.name,definitionSHA256:sha256(o.definition)}));
 if(extras.some(o=>o.kind==='trigger'&&!o.definition.endsWith('|enabled=O'))||
    extras.some(o=>o.kind==='constraint'&&!o.definition.includes('deferrable=true|deferred=true'))||
    sha256(manifest)!==a.delta_sha256||!Array.isArray(a.delta_manifest)||
    !isSameManifest(manifest,a.delta_manifest))
  throw Error('F06_PG1_V2_PATCH_OBJECT_SIGNATURE_DRIFT');
 const old=await parentSeal(c);
 if(a.parent_ledger_sha256!==old.ledgerHash||a.parent_priority_sha256!==old.priorityHash)
  throw Error('F06_PG1_V2_FROZEN_SIGNED_PARENT_DRIFT');
 // 此处只完成结构+父账验签；具体取消权限/客户/签名链由版本化安全服务另做，不得把本结果称为业务准入。
 return{verified:true,catalogVersion:'F06_5C_PG1_V2',...old,postCatalog:actual.sha256,deltaSHA256:a.delta_sha256};
}
function isSameManifest(a,b){
 return a.length===b.length && a.every((x,i)=>x.kind===b[i].kind&&x.name===b[i].name&&x.definitionSHA256===b[i].definitionSHA256);
}
