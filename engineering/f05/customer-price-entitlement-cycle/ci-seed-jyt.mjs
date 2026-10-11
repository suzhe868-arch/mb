// Source-built synthetic JYT wholesale samples via ORIGINAL F05-3B trusted API,
// while the current isolated database has v18 exact signed schema.
// No manual INSERT into vehicle, listing cycle or JYT lineage objects.
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {connect} from '../favorite-physical-carrier/migration.mjs';
import {issueCredential,setApiEnabled,syncUpsert} from '../jyt-wholesale-lineage-cycle/contract.mjs';
import {verify} from '../wholesale-to-mingbang-conversion/migration.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48983'});
const evt=s=>'f05-4-real-ci-signed-source-'+s;
try{
 if(!(await verify(db)).verified)throw Error('F05_4_EXPECT_SIGNED_V18_BEFORE_JYT_CI_SEED');
 const a=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'f05-4-v18-real-governance-seed'});
 if(a.code!=='AUTH_OK')throw Error('F05_4_ADMIN_SESSION_MISSING');
 const issued=await issueCredential(auth,a.token,{eventKey:evt('issue-isolated-sync-credential')});
 if(!issued.allowed)throw Error('F05_4_CI_SYNC_CREDENTIAL_FAIL');
 for(const kind of ['upsert','offline','current']){
  const enabled=await setApiEnabled(auth,a.token,{action:kind,enabled:true,eventKey:evt('enable-'+kind)});
  if(!enabled.allowed)throw Error('F05_4_CI_SWITCH_NOT_SIGNED_'+kind);
 }
 for(let n=1;n<=5;n++){
  const name='PDM10-'+String(n).padStart(2,'0');
  const x=await syncUpsert(auth,issued.token,{eventKey:evt('new-vehicle-'+name),
   carCode:'F05-4-CI-JYT-'+name,brandId:97001,seriesId:97002,modelId:97003,modelYear:2026,state:'active'});
  if(!x.allowed||x.code!=='F05_3B_IMPORTED')throw Error('F05_4_REAL_JYT_SOURCE_IMPORT_FAIL_'+name+'_'+x.code);
 }
 console.log('F05_4_FIVE_ACTUAL_SIGNED_JYT_SOURCE_VEHICLES_IMPORTED_BEFORE_V19');
}finally{await auth.close();await db.end();secret.fill(0)}
