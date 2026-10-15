import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {pool,bootstrap,reset,seed,dispatch,dndAt,assertCIEnv,physicalGate,parentConfigMutation,deepLinkGuard,ALLOWLIST,checksum} from '../gate.mjs';

let db;
const AT='2026-10-16T02:00:00.000Z'; // 上海10:00，可投递
const DND='2026-10-16T16:00:00.000Z'; // 上海00:00，免打扰
before(async()=>{assertCIEnv();db=pool();await bootstrap(db);});
after(async()=>{if(db)await db.end();});
beforeEach(async()=>await reset(db));
const Q=(sql,params=[])=>db.query(sql,params);
const run=async(o={},fixture={})=>{await seed(db,fixture);return dispatch(db,{eventId:fixture.id||'event-ci-1',at:AT,...o});};
const out=async()=>Number((await Q('SELECT count(*)::int n FROM f07_4_ci.mock_outbox')).rows[0].n);
const log=async()=>Number((await Q('SELECT count(*)::int n FROM f07_4_ci.notification_log')).rows[0].n);
const change=async(sql)=>{await physicalGate(db);await Q(sql);};

for(const [i,kind] of ALLOWLIST.entries()){
 test('S'+String(i+1).padStart(2,'0')+' 事件白名单 '+kind,async()=>{
  const result=await run({channel:['consultation_sla_timeout','supply_anomaly','incident_active','incident_recovery'].includes(kind)?'group':'personal'},
   {kind,incidentActive:kind==='incident_active',cadence:kind==='incident_active'?30:null});
  assert.equal(result.status,'SENT');assert.equal(await out(),1);assert.equal(await log(),1);
 });
}
const rejects=[
 ['page_view','PDM23_NOT_ALLOWLISTED'],['click','PDM23_NOT_ALLOWLISTED'],
 ['matching','PDM23_NOT_ALLOWLISTED'],['opportunity','PDM23_NOT_ALLOWLISTED'],
 ['source_radar','PDM23_NOT_ALLOWLISTED'],['recommendation_created','PDM23_NOT_ALLOWLISTED'],
 ['recommendation_ended','PDM23_NOT_ALLOWLISTED']
];
for(const [i,[kind,code]] of rejects.entries()){
 test('S'+(13+i)+' 非白名单不发送 '+kind,async()=>{const r=await run({}, {kind});assert.equal(r.status,'NOT_ALLOWLISTED');assert.equal(r.code,code);assert.equal(await out(),0);});
}
const dndCases=[
 ['2026-10-16T14:59:00Z',false], // 北京22:59
 ['2026-10-16T15:00:00Z',true],  // 北京23:00
 ['2026-10-16T16:00:00Z',true],  // 北京00:00
 ['2026-10-16T00:29:00Z',true],  // 北京08:29
 ['2026-10-16T00:30:00Z',false], // 北京08:30
 ['2026-10-16T01:00:00Z',false]
];
for(const [i,[instant,want]] of dndCases.entries()){
 test('S'+(20+i)+' 时区与跨午夜 '+instant,async()=>{assert.equal(dndAt(instant),want);const r=await run({at:instant});assert.equal(r.status,want?'SKIPPED':'SENT');assert.equal(await out(),want?0:1);});
}
const conditions=[
 ['公司总开关', "UPDATE f07_4_ci.config SET company_on=false", 'COMPANY_FEISHU_DISABLED'],
 ['个人关闭', "UPDATE f07_4_ci.employee SET personal_on=false",'PERSONAL_ROUTE_DISABLED'],
 ['员工无映射', "UPDATE f07_4_ci.employee SET feishu_id=NULL",'PERSONAL_ROUTE_DISABLED'],
 ['员工停用', "UPDATE f07_4_ci.employee SET active=false",'CURRENT_EMPLOYEE_OR_SCOPE_DENIED'],
 ['员工失格', "UPDATE f07_4_ci.employee SET eligible=false",'CURRENT_EMPLOYEE_OR_SCOPE_DENIED'],
 ['员工越界', "UPDATE f07_4_ci.employee SET in_scope=false",'CURRENT_EMPLOYEE_OR_SCOPE_DENIED'],
 ['群路由空', "UPDATE f07_4_ci.config SET group_route=NULL",'GROUP_ROUTE_DISABLED'],
 ['员工SLA总群关闭', "UPDATE f07_4_ci.employee SET sla_group_on=false",'GROUP_ROUTE_DISABLED']
];
for(const [i,[title,sql,code]] of conditions.entries()){
 test('S'+(26+i)+' 配置撤销 '+title,async()=>{
  await seed(db,{kind:'consultation_sla_timeout'});
  await change(sql);
  const channel=i>5?'group':'personal';
  const r=await dispatch(db,{eventId:'event-ci-1',channel,at:AT});
  assert.equal(r.code,code);assert.equal(await out(),0);
 });
}
test('S34 普通成功后重放无第二条消息',async()=>{const r=await run();assert.equal(r.status,'SENT');const second=await dispatch(db,{eventId:'event-ci-1',at:AT});assert.equal(second.status,'DEDUPED');assert.equal(await out(),1);assert.equal(await log(),2);});
test('S35 模拟失败后允许同阶段安全重试',async()=>{const r=await run({simulate:'failure'});assert.equal(r.status,'FAILED');assert.equal(await out(),0);const b=await dispatch(db,{eventId:'event-ci-1',at:AT});assert.equal(b.status,'SENT');assert.equal(await out(),1);});
test('S36 模拟超时后同阶段重试',async()=>{assert.equal((await run({simulate:'timeout'})).code,'MOCK_TIMEOUT');assert.equal((await dispatch(db,{eventId:'event-ci-1',at:AT})).status,'SENT');assert.equal(await out(),1);});
test('S37 DND后业务失效不补发',async()=>{assert.equal((await run({at:DND})).code,'DND_DELAY_REVALIDATE');await change("UPDATE f07_4_ci.event SET valid=false");assert.equal((await dispatch(db,{eventId:'event-ci-1',at:AT})).code,'EVENT_INVALID');assert.equal(await out(),0);});
test('S38 DND后配置撤销不补发',async()=>{await run({at:DND});await change("UPDATE f07_4_ci.config SET company_on=false");assert.equal((await dispatch(db,{eventId:'event-ci-1',at:AT})).code,'COMPANY_FEISHU_DISABLED');assert.equal(await out(),0);});
test('S39 DND后负责人已失格不补发',async()=>{await run({at:DND});await change("UPDATE f07_4_ci.employee SET active=false");assert.equal((await dispatch(db,{eventId:'event-ci-1',at:AT})).code,'CURRENT_EMPLOYEE_OR_SCOPE_DENIED');assert.equal(await out(),0);});
test('S40 DND后仍有效只投一次',async()=>{await run({at:DND});assert.equal((await dispatch(db,{eventId:'event-ci-1',at:AT})).status,'SENT');assert.equal((await dispatch(db,{eventId:'event-ci-1',at:AT})).status,'DEDUPED');assert.equal(await out(),1);});
test('S41 无Incident cadence严格抑制',async()=>{assert.equal((await run({channel:'group'},{kind:'incident_active',incidentActive:true})).code,'INCIDENT_CADENCE_UNCONFIGURED');assert.equal(await out(),0);});
test('S42 Incident同持续窗口不重复',async()=>{await run({channel:'group'},{kind:'incident_active',incidentActive:true,cadence:30});assert.equal((await dispatch(db,{eventId:'event-ci-1',channel:'group',at:'2026-10-16T02:05:00Z'})).status,'DEDUPED');assert.equal(await out(),1);});
test('S43 Incident cadence满足后可重复且有物理不同stage',async()=>{await run({channel:'group'},{kind:'incident_active',incidentActive:true,cadence:30});assert.equal((await dispatch(db,{eventId:'event-ci-1',channel:'group',at:'2026-10-16T02:31:00Z'})).status,'SENT');assert.equal(await out(),2);});
test('S44 Incident cleared后停止重复',async()=>{await run({channel:'group'},{kind:'incident_active',incidentActive:true,cadence:30});await change("UPDATE f07_4_ci.event SET incident_active=false");assert.equal((await dispatch(db,{eventId:'event-ci-1',channel:'group',at:'2026-10-16T03:00:00Z'})).code,'INCIDENT_NOT_ACTIVE');assert.equal(await out(),1);});
test('S45 Recovery须真实inactive状态',async()=>{assert.equal((await run({channel:'group'},{kind:'incident_recovery',incidentActive:true})).code,'RECOVERY_NOT_CONFIRMED');assert.equal(await out(),0);});
test('S46 同一事件双Backend原生并发单成功',async()=>{await seed(db);const [a,b]=await Promise.all([dispatch(db,{eventId:'event-ci-1',at:AT}),dispatch(db,{eventId:'event-ci-1',at:AT})]);assert.deepEqual([a.status,b.status].sort(),['DEDUPED','SENT']);assert.notEqual(a.backendPid,b.backendPid);assert.equal(await out(),1);assert.equal((await Q('SELECT count(*)::int n FROM f07_4_ci.claim')).rows[0].n,1);console.log('F07_4_NATIVE_DUAL_BACKEND_PIDS',a.backendPid,b.backendPid);});
test('S47 两独立真实PG Backend行锁55P03、ROLLBACK与父目录MD5不变',async()=>{
 await seed(db);
 const parentSQL="SELECT count(*)::int n,md5(coalesce(string_agg(oid::text||relname||relkind::text,',' ORDER BY oid),'')) seal FROM pg_class WHERE relnamespace='public'::regnamespace";
 const before=(await Q(parentSQL)).rows[0];
 const a=await db.connect(),b=await db.connect();
 try {
  await a.query('BEGIN');await b.query('BEGIN');
  const pida=(await a.query('SELECT pg_backend_pid() p')).rows[0].p;
  const pidb=(await b.query('SELECT pg_backend_pid() p')).rows[0].p;
  assert.notEqual(pida,pidb);
  await a.query("SELECT 1 FROM f07_4_ci.event WHERE event_id='event-ci-1' FOR UPDATE");
  await b.query("SET LOCAL lock_timeout='100ms'");
  await assert.rejects(b.query("SELECT 1 FROM f07_4_ci.event WHERE event_id='event-ci-1' FOR UPDATE"),e=>e.code==='55P03');
  await b.query('ROLLBACK');
  await a.query("INSERT INTO f07_4_ci.mock_outbox(event_id,stage,channel,recipient,payload,created_at) VALUES('event-ci-1','rollback','personal','ci','{}',now())");
  await a.query('ROLLBACK');
  assert.equal(await out(),0);
  assert.deepEqual((await Q(parentSQL)).rows[0],before);
  assert.equal((await dispatch(db,{eventId:'event-ci-1',at:AT})).status,'SENT');
  console.log('F07_4_NATIVE_ROW_LOCK_55P03',pida,pidb);
 }finally{await a.query('ROLLBACK').catch(()=>{});await b.query('ROLLBACK').catch(()=>{});a.release();b.release();}
});
test('S48 配置写缺真实父签名拒绝，SystemAdmin不能绕过',async()=>{assert.equal((await parentConfigMutation(db,{company_on:false},{role:'system_admin'})).allowed,false);assert.equal((await parentConfigMutation(db,{company_on:false},{role:'employee'})).code,'NOTIFICATION_CONFIG_SIGNED_PARENT_SOURCE_GAP');assert.equal((await Q('SELECT company_on FROM f07_4_ci.config')).rows[0].company_on,true);});
test('S49 旧链接和声称已鉴权仍无真实父权不得打开',()=>{assert.equal(deepLinkGuard('/E01/abc').code,'LINK_CURRENT_SESSION_SCOPE_OBJECT_SOURCE_GAP');assert.equal(deepLinkGuard('/E01/abc',{signedParentVerified:true}).status,'SKIPPED');});
test('S50 异常主机、穿越和编码拒绝',()=>{for(const url of ['https://evil.test/E01/x','/E01/../PC/x','/E01/%2e%2e/PC/x','//evil.test/E01/x','/E01/x?secret=x'])assert.equal(deepLinkGuard(url).status,'SKIPPED');});
test('S51 身份/仓库/DSN伪造fail-closed',async()=>{assert.throws(()=>assertCIEnv({...process.env,GITHUB_REPOSITORY:'evil/repo'}),/F07_4_ENV_GITHUB_REPOSITORY/);assert.throws(()=>assertCIEnv({...process.env,DATABASE_URL:'postgres://prod'}),/F07_4_ENV_DATABASE_URL/);assert.throws(()=>assertCIEnv({...process.env,GITHUB_REF:'refs/heads/main'}),/F07_4_ENV_GITHUB_REF/);assert.ok((await physicalGate(db)).ver>=160000);});
test('S52 mock群正文没有敏感资料',async()=>{await run({channel:'group'},{kind:'consultation_sla_timeout'});const payload=(await Q('SELECT payload::text s FROM f07_4_ci.mock_outbox')).rows[0].s;for(const word of ['VIN','token','phone','internal_price','publisher'])assert.ok(!payload.toLowerCase().includes(word.toLowerCase()));});
test('S53 直接业务状态不被通知改写',async()=>{await seed(db,{kind:'transaction_changed',stage:'completed'});const before=checksum((await Q('SELECT * FROM f07_4_ci.event')).rows);await dispatch(db,{eventId:'event-ci-1',at:AT});const after=checksum((await Q('SELECT * FROM f07_4_ci.event')).rows);assert.equal(before,after);});
test('S54 审计记录字段齐全且不可把通知变正式Issuer',async()=>{await run();const r=(await Q('SELECT * FROM f07_4_ci.notification_log')).rows[0];for(const f of ['event_id','kind','stage','employee_id','channel','scheduled_at','result','code','dnd','revalidated','sent_at','backend_pid'])assert.notEqual(r[f],undefined);assert.equal(r.result,'SENT');});
test('S55 真父来源缺口显式标记，不宣称父positive',async()=>{assert.equal((await parentConfigMutation(db,{},{})).origin,'SIGNED_PARENT_NEGATIVE_ONLY');console.log('NOTIFICATION_SIGNED_ISSUER_SOURCE_GAP SLA_EVENT_SOURCE_GAP SIGNED_PARENT_NEGATIVE_ONLY CI_SYNTHETIC_ONLY');});
test('F07-4 Source 完整55业务子例通过',()=>{console.log('F07_4_SOURCE_NATIVE_PG16_55_PASS');});
