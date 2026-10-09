// Exact 000001 -> 000002 -> 000003 CI-run-isolated structure only.
// Old 80-table F03-1 verifier stays unchanged and MUST reject this 81-table DB.
import {verify} from './migration.mjs';
export async function verifyScopeDatabase(pool){
 const c=await pool.connect();
 try{return await verify(c)}finally{c.release()}
}
