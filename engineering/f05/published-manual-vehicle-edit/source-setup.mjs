// CI issue216 consumes exact accepted #214 private source SQL without altering its source.
// Run/HEAD evidence remains the CURRENT issue216 run; never claim a parent workflow re-executed.
import {connect} from './migration.mjs';
import {SQL,checksum} from '../manual-vehicle-draft-publish/migration.mjs';
const c=await connect();
try{
 await c.query('BEGIN');
 try{
  if((await c.query("SELECT to_regnamespace('f05_manual_vehicle_test') n")).rows[0].n!==null)throw Error('PARENT_DRAFT_SCHEMA_ALREADY_PRESENT');
  await c.query(SQL);
  await c.query("INSERT INTO f05_manual_vehicle_test.schema_state(singleton,version,run_id,ddl_sha256) VALUES(true,1,$1,$2)",[process.env.GITHUB_RUN_ID,checksum]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 const q=(await c.query("SELECT run_id,ddl_sha256 FROM f05_manual_vehicle_test.schema_state")).rows[0];
 if(q.run_id!==process.env.GITHUB_RUN_ID||q.ddl_sha256!==checksum)throw Error('PARENT_DRAFT_SCHEMA_ORIGIN_UNSEALED');
 console.log('ISSUE216_ACCEPTED_214_PRIVATE_SQL_REUSED_CURRENT_RUN_NOT_PARENT_RUN');
}finally{await c.end()}
