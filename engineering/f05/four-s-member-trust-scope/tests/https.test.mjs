import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {createServer,request} from 'node:https';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../vehicle-stewardship-physical-scope/migration.mjs';
import {createF052VehicleHandler} from '../../vehicle-stewardship-physical-scope/ci-vehicle-router.mjs';
import {publishAndIssueFromCurrentTransaction} from '../../vehicle-stewardship-physical-scope/service.mjs';
import {assessFourSMemberAuthority,BLOCKED} from '../source-gate.mjs';
const origin='https://127.0.0.1:48983',secret=randomBytes(32),db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let server,four,staff,admin;
const cookie=t=>({cookie:'__Host-mb_pc='+t});
async function get(path,headers={}){
 return new Promise((resolve,reject)=>{const req=request({hostname:'127.0.0.1',port:48983,path,method:'GET',rejectUnauthorized:false,headers:{origin,...headers}},res=>{
 let b='';res.on('data',x=>b+=x);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(b),headers:res.headers})}catch(e){reject(e)}})});req.on('error',reject);req.end()});
}
const at=(id,section='detail')=>'/__ci__/f05-2/v1/vehicles/'+id+'/'+section;
const denied=r=>{assert.equal(r.status,403,JSON.stringify(r));assert.deepEqual(r.body,{code:'F05_VEHICLE_SCOPE_UNPROVEN'});assert.match(r.headers['cache-control'],/no-store/)};
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const [login,password,which] of [
  ['four_s_test','SyntheticFourS_123456','four'],
  ['employee_test','SyntheticF04_3_CurrentProof_2026','staff'],
  ['admin_test','SyntheticAdmin_1234567','admin']]){
  const q=await auth.login({login,password,source:'f05-3a-https-source-gap'});
  assert.equal(q.code,'AUTH_OK');if(which==='four')four=q.token;else if(which==='staff')staff=q.token;else admin=q.token;
 }
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createF052VehicleHandler(auth));
 await new Promise((yes,no)=>{server.once('error',no);server.listen(48983,'127.0.0.1',yes)});
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 await auth.close();await db.end();secret.fill(0);
});
test('G-B01 true 4S employee Session valid, but business trust source explicitly BLOCKED',async()=>{
 assert.deepEqual(await assessFourSMemberAuthority(auth,four),{code:BLOCKED,allowed:false});
});
test('G-B02 4S role cannot read legacy Mingbang-uploaded four_s source',async()=>{denied(await get(at(49004),cookie(four)))});
test('G-B03 independently signed Mingbang 4S-labeled Vehicle cannot be stolen by four_s member',async()=>{
 const pub=await publishAndIssueFromCurrentTransaction(auth,staff,{vehicleId:59251,listingCycleId:59351,sourceKind:'four_s',teamId:901,eventKey:'f05-3a-mingbang-published-four-s-59251'});
 assert.equal(pub.code,'F05_2_ISSUED',JSON.stringify(pub));
 assert.equal((await get(at(59251),cookie(staff))).status,200,'existing A-accepted Mingbang path retained');
 denied(await get(at(59251),cookie(four)));
});
test('G-B04 4S and System Admin cannot read wholesale or Mingbang current Vehicle',async()=>{
 for(const id of [49006,49002,59251]){denied(await get(at(id),cookie(four)));denied(await get(at(id),cookie(admin)))}
});
test('G-B05 other six outlets remain hard denied despite real employee session',async()=>{
 for(const outlet of ['list','export','copy','cache','print','history'])denied(await get(at(59251,outlet),cookie(four)));
});
test('G-B06 forged 4S owner/team/merchant and bearer spoof never authorize current Vehicle',async()=>{
 for(const name of ['x-owner','x-team-id','x-merchant-id'])denied(await get(at(59251),{...cookie(four),[name]:'2'}));
 denied(await get(at(59251),{...cookie(four),authorization:'Bearer spoofed'}));
 denied(await get(at(59251)+'?owner=2',cookie(four)));
});
test('G-B07 after 4S inactive then active source is STILL missing: no automatic business rights',async()=>{
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=2");
 try{denied(await get(at(59251),cookie(four)));assert.equal((await assessFourSMemberAuthority(auth,four)).allowed,false)}
 finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=2")}
 denied(await get(at(59251),cookie(four)));
 assert.deepEqual(await assessFourSMemberAuthority(auth,four),{allowed:false,code:BLOCKED});
});
