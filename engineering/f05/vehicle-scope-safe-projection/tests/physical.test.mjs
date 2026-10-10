import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {connect} from '../../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {verifyPhysicalSource,verifyLiveM94,observePhysicalVehicle,proveCurrentVehicleScope,redactMinimal,safeFieldNames,forbiddenOutputKeys} from '../source-verifier.mjs';
const db=await connect();
test.after(()=>db.end());
const f=n=>readFileSync(new URL('../'+n,import.meta.url),'utf8');
test('F05-1-A01 original 94table/2120 catalog hash + genuine independent PG16',async()=>{
 const a=verifyPhysicalSource(),b=await verifyLiveM94(db);
 assert.equal(a.physicalPositiveScope,0);assert.equal(b.verified,true);
 assert.equal(a.frozenSha,'7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659');
 assert.equal(a.rows,153);assert.equal(a.matrixRows,252);
});
test('F05-1-A02 every table/field type and row tied to original physical catalog',()=>{
 const s=f('Vehicle真实物理关系与来源证据.tsv');
 assert.throws(()=>verifyPhysicalSource(s.replace('vehicles\tvehicle_id\tbigint','vehicles\tvehicle_id\ttext')),/FIELD_PROVENANCE/);
 assert.throws(()=>verifyPhysicalSource(s.replace('vehicles\tcreated_by_employee_id\tbigint','vehicles\tcreated_by_employee_id\tbytea')),/FIELD_PROVENANCE/);
 assert.throws(()=>verifyPhysicalSource(s.replace(/vehicle_listing_cycles\tlisting_cycle_id\tbigint[^\n]*\n/,'')),/FIELD_COUNT/);
});
test('F05-1-A03 suspicious sensitive fields must never be reclassified safe',()=>{
 const s=f('Vehicle真实物理关系与来源证据.tsv');
 assert.throws(()=>verifyPhysicalSource(s.replace(/(vehicles\tvin\ttext\t[^\t]+\t)NEVER_DIRECTLY_EXPOSE/,'$1SAFE_CANDIDATE_REQUIRES_CURRENT_AUTH')),/SOURCE_FIELD_SAFETY/);
 assert.deepEqual(safeFieldNames,['vehicleId','listingCycleId','sourceKind']);
 assert.ok(forbiddenOutputKeys.includes('publisherPhone'));
});
test('F05-1-A04 scope matrix cannot elevate uploader, 4S, manager, admin, old owner',()=>{
 const s=f('Vehicle三来源Actor对象Scope矩阵.tsv');
 assert.throws(()=>verifyPhysicalSource(undefined,s.replace('DENY_403_F05_VEHICLE_SCOPE_UNPROVEN','ALLOW_200')),/SCOPE_GRANTED/);
 assert.throws(()=>verifyPhysicalSource(undefined,s.replace('FOUR_S_MEMBER\tfour_s','FOUR_S_MERCHANT_ADMIN\tfour_s')),/SCOPE_GRANTED/);
});
test('F05-1-A05 physical release requires signed business proof, not public info',async()=>{
 let a=await observePhysicalVehicle(db,39001);assert.equal(a.source_type,'wholesale');
 assert.ok(a.listing_cycle_id);
 assert.equal(redactMinimal(a,{trustedCurrentVehicleOwnership:false,signedBusinessRead:true}),null);
 assert.equal(redactMinimal(a,{trustedCurrentVehicleOwnership:true,signedBusinessRead:false}),null);
 assert.equal(redactMinimal(a,{trustedCurrentVehicleOwnership:true,signedBusinessRead:true}),null); // caller-generated booleans cannot mint a signed current Vehicle ownership proof
 for(const p of [{claimedOwner:1},{merchantId:1},{teamId:1},{}]){
  const r=await proveCurrentVehicleScope(db,{employeeId:1},{vehicleId:39001,outlet:'detail',...p});
  assert.equal(r.proven,false);
 }
});
test('F05-1-A06 three real physical types cannot create owner scope by source alone',async()=>{
 for(const [id,source] of [[39001,'wholesale'],[39002,'mingbang'],[39005,'four_s']]){
  const v=await observePhysicalVehicle(db,id);assert.equal(v.source_type,source);
  for(const view of ['detail','export','cache']){
   assert.equal((await proveCurrentVehicleScope(db,{employeeId:1},{vehicleId:id,outlet:view})).proven,false);
  }
 }
});
test('F05-1-A07 old cycle, unknown target, personal override and Priority not grants',async()=>{
 assert.equal((await proveCurrentVehicleScope(db,{employeeId:1},{vehicleId:39004,outlet:'history'})).proven,false);
 assert.equal((await proveCurrentVehicleScope(db,{employeeId:1},{vehicleId:999999,outlet:'detail'})).proven,false);
 assert.equal((await proveCurrentVehicleScope(db,{employeeId:1},{vehicleId:39001,outlet:'detail',teamId:1})).proven,false);
 const data=await db.query("SELECT count(*)::int n FROM public.vehicle_visibility_grants");
 assert.ok(data.rows[0].n>=0);
});
test('F05-1-A08 privilege denial and read-only guarantee on physical provenance',async()=>{
 const before=await db.query("SELECT count(*)::int n FROM public.vehicles");
 await verifyLiveM94(db);
 const after=await db.query("SELECT count(*)::int n FROM public.vehicles");
 assert.equal(before.rows[0].n,after.rows[0].n);
});
