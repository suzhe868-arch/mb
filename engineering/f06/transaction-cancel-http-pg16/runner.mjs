// Apply only after native F06-3B/3C1 parent signatures and sidecar.sql.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {connect,verify} from '../refund-pending-ci/migration.mjs';
import {attest,gate} from './service.mjs';
gate();
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
assert.equal(process.argv[2],'--attest');
const db=await connect();
try{
 const parent=await verify(db);assert.equal(parent.verified,true);
 const signed=await attest(db);assert.equal(signed.parent.verified,true);
 const p=(await db.query("SELECT current_database() db,current_user u,pg_backend_pid() pid,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su")).rows[0];
 assert.deepEqual([p.db,p.u,p.su],['f03_auth_test','f03_ci',false]);
 console.log('F06_CANCEL_3C1_REAL_TX_NATIVE_VERIFIED_NEW_ATTESTATION',{pid:Number(p.pid),sourceSHA:signed.parent.sourceSHA,db:p.db});
}finally{await db.end()}
