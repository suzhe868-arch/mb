// F06-5C S89：第二个真实PG16物理OID（经可销毁库DROP/CREATE/真实pg_restore）。
// 旧3B来源不可变、5B不得在一车历史Origin存在时再开事务；此独立场景从原190父表快照
// 真实签发新JYT/F05-7 Match/F06-1 Lock/5B Transaction，再装PG1执行v2 4A。
// 所有权限、签名、COMMIT、双Backend争锁与历史目录均来自真实PG16，不使用伪来源。
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {connect,verify} from '../migration.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {setQualificationCI} from '../../../f05/priority-arbitration-ttl-handover/service.mjs';
import {saveSalesDescriptionCI} from '../../../f05/deterministic-matching-readiness-four-tier/service.mjs';
import {signedFrozenParentSessionAdapterCI} from '../service.mjs';
import {installSignedPG1InExisting5CCI,verify5CVersioned,withSignedPG1Ref} from '../pg1-versioned-adapter.mjs';
import {prepareRealJytUnoccupiedSignedMatch,proveRealJytR01LegalSuccessor} from '../../transaction-priority-parent-gate-ci/真批发候补优先权安全验收.mjs';
import {requestSyntheticNewPriorityV2CI} from '../service-v2.mjs';
const db=await connect(),q=(sql,args=[])=>db.query(sql,args).then(x=>x.rows);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,
 secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const mk=s=>'f06-5c-restored-r01-'+s+'-'+process.env.GITHUB_RUN_ID;
test.after(async()=>{await auth.close();await db.end()});
test('5C-S89 已签PG1装入后的真JYT R01无候补合法取消只产生唯一父新Priority和真实双Backend锁等待',async()=>{
 assert.equal((await verify(db)).verified,true);
 const prior=JSON.parse(await readFile(resolve('f06/transaction-priority-admission-ci/artifacts/source/audit-before.json'),'utf8'));
 const restored=JSON.parse(await readFile(resolve('f06/transaction-priority-admission-ci/artifacts/source/audit-global-seal-pass.json'),'utf8'));
 const oid=(await q("SELECT oid::text oid FROM pg_database WHERE datname=current_database()"))[0].oid;
 assert.equal(oid,restored.auditOid);assert.notEqual(oid,prior.meta.oid);
 assert.equal((await q('SELECT current_user usr'))[0].usr,'f03_ci');
 assert.equal((await q("SELECT rolsuper su FROM pg_roles WHERE rolname=current_user"))[0].su,false);
 assert.equal((await q("SELECT count(*)::int n FROM public.f03_schema_migrations"))[0].n,24);
 const sales=(await q("SELECT role_id FROM public.roles WHERE role_code='sales'"))[0];
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[sales.role_id]);
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-5c-r01-second-physical-signed-sale'});
 assert.equal(login.code,'AUTH_OK',JSON.stringify(login));
 const saleToken=login.token;
 const member=(await q("SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1"))[0];
 assert.ok(member);
 const scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[member.team_id]))[0];
 assert.ok(scope);
 const grant=async(code,id)=>{
  let p=(await q('SELECT permission_id FROM public.permissions WHERE permission_code=$1',[code]))[0];
  if(!p)p=(await q('INSERT INTO public.permissions(permission_id,permission_code) VALUES($1,$2) RETURNING permission_id',[id,code]))[0];
  await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=clock_timestamp()",[p.permission_id]);
  const bound=(await q('SELECT 1 FROM public.employee_capability_scope_bindings WHERE employee_id=1 AND permission_id=$1 AND scope_id=$2 AND ended_at IS NULL',[p.permission_id,scope.scope_id]))[0];
  if(!bound)await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[p.permission_id,scope.scope_id]);
 };
 // 仅隔离场景授予原版父服务明示的独立操作权限；不得替代真实鉴权。
 for(const [code,id] of [
  ['transaction.ci.open',969101],['transaction.ci.manage',969106],['transaction.ci.cancel',969104]
 ])await grant(code,id);
 const customerId=899621;
 const qual=await setQualificationCI(signedFrozenParentSessionAdapterCI(auth,22),saleToken,{
  teamId:901,customerId,enabled:true,eventKey:mk('qualified-real-source')
 });
 assert.equal(qual.allowed,true,JSON.stringify(qual));
 const demand=(await q("SELECT demand_id FROM public.demands WHERE customer_id=$1 AND demand_state='active' ORDER BY demand_id LIMIT 1",[customerId]))[0];
 assert.ok(demand,'R01_RESTORED_SIGNED_DEMAND_REQUIRED');
 const desc=await saveSalesDescriptionCI(signedFrozenParentSessionAdapterCI(auth,21),saleToken,{
  demandId:Number(demand.demand_id),teamId:901,
  description:'奥迪A6 2026款 5万公里以内 黑色外观 米色内饰 预算10万'
 });
 assert.equal(desc.allowed,true,JSON.stringify(desc));
 const manager=(await q("SELECT role_id FROM public.roles WHERE role_code='manager'"))[0];
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[manager.role_id]);
 const managerLogin=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-5c-r01-second-physical-manager'});
 assert.equal(managerLogin.code,'AUTH_OK',JSON.stringify(managerLogin));
 const token=managerLogin.token;
 // PG1源码原生夹具自行核验真实JYT血缘、真实Match、5B与候补=0；不自行写Transaction/Priority。
 const prepared=await withSignedPG1Ref(()=>prepareRealJytUnoccupiedSignedMatch(db,{auth,token,managerToken:token}));
 assert.ok(prepared.transactionId>0&&prepared.vehicleId>0,JSON.stringify(prepared));
 const patch=await installSignedPG1InExisting5CCI(db);
 assert.equal(patch.verified,true);assert.equal(patch.parent190Tables,190);
 const pre=(await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status='active'",[prepared.vehicleId]))[0];
 assert.equal(pre.n,0);
 const after=await withSignedPG1Ref(()=>proveRealJytR01LegalSuccessor(db,{auth,token},prepared,86181103));
 assert.equal(after.cancelCode,'F06_4A_CANCELLED_ATOMIC_NO_PAYMENT',JSON.stringify(after));
 assert.equal(after.createdEventsAfter,after.createdEventsBefore+1);
 assert.equal(after.nativeConcurrency.nativePgBlockingPidsObserved,true);
 const denied=await requestSyntheticNewPriorityV2CI(auth,token,{
  vehicleId:prepared.vehicleId,listingCycleId:prepared.listingCycleId,
  customerId:prepared.customerId,teamId:901,eventKey:mk('only-parent-signed-successor')
 });
 assert.equal(denied.code,'F06_5C_EXISTING_ACTIVE_PRIORITY',JSON.stringify(denied));
 const priorities=await q("SELECT priority_id FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status='active'",[prepared.vehicleId]);
 assert.equal(priorities.length,1);
 assert.equal(Number(priorities[0].priority_id),after.newPriorityId);
 assert.equal((await verify5CVersioned(db)).verified,true);
 assert.equal((await q('SELECT count(*)::int n FROM public.refund_payments'))[0].n,0);
 console.log('F06_5C_PG1_R01_NATIVE_UNIQUE_PARENT_SUCCESSOR',JSON.stringify({
  head:process.env.GITHUB_SHA,scenarioOid:prior.meta.oid,restoredR01Oid:oid,
  vehicleId:prepared.vehicleId,transactionId:prepared.transactionId,
  uniqueParentPriorityId:after.newPriorityId,createdBefore:after.createdEventsBefore,
  createdAfter:after.createdEventsAfter,blocker:after.nativeConcurrency,
  denySecondIssuer:denied.code,versionedCatalog:patch.newCatalog,old190:patch.parent190Tables
 }));
});
