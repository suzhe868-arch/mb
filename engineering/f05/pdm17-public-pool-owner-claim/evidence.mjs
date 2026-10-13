import {connect,verify} from './migration.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const mode=process.argv[2];if(!['source','https'].includes(mode))throw Error('D1_BAD_EVIDENCE_MODE');
const c=await connect();
try{
 const seal=await verify(c);
 const original=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 const links=(await c.query('SELECT count(*)::int n FROM d1_owner_ci.receipts')).rows[0].n;
 const g=(await c.query("SELECT current_database() db,current_user role,pg_backend_pid() pid,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) super")).rows[0];
 const evidence={mode,seal,originalLedger:original,receiptCount:links,backend:g,
  syntheticAuthorityOnly:true,productionIssuerGap:true,originalPublicCatalogUnmodified:true,ciOnly:true,
  workflowCommitSha:process.env.GITHUB_SHA};
 const p=new URL('./artifacts/'+mode+'/',import.meta.url);await mkdir(p,{recursive:true});
 await writeFile(new URL('physical-pg16-seal-and-source.json',p),JSON.stringify(evidence,null,2)+'\n');
 console.log('D1_NATIVE_PG16_SOURCE_CATALOG_ATTESTATION',JSON.stringify({seal,receiptCount:links,nonPrivileged:g.super===false}));
}finally{await c.end()}
