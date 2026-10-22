// Separate Node process reads a committed draft after an injected failed publication.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {createManualVehicleDraftService} from '../service.mjs';
import {ORIGIN} from './https-harness.mjs';
const id=process.argv[2];
if(!/^\d+$/.test(id))throw Error('F05_MANUAL_RECOVERY_DRAFT_ID_REQUIRED');
const secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:ORIGIN});
try{
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',
  source:'f05-manual-new-process-recovery'});
 assert.equal(login.code,'AUTH_OK');
 const service=createManualVehicleDraftService({auth});
 const out=await service.get(login.token,id);
 assert.equal(out.status,200,JSON.stringify(out.body));
 assert.equal(out.body.draft.status,'draft');
 assert.equal(out.body.draft.payload.description,'persist after rollback');
 assert.equal(out.body.draft.payload.vin,'MB-RACE-RESTART-VIN-20261022');
 console.log('F05_MANUAL_NEW_PROCESS_RECOVERY_PASS');
}finally{await auth.close();secret.fill(0)}
