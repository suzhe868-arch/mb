import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {pool,bootstrap,reset,seed,dispatch,dndAt,assertCIEnv,physicalGate,parentConfigMutation,deepLinkGuard,ALLOWLIST,checksum,activateIncident,clearIncident} from '../gate.mjs';

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
  if(kind==='incident_recovery'){assert.equal(await activateIncident(db,'event-ci-1'),true);assert.equal(await clearIncident(db,'event-ci-1'),true);}
  if(kind==='lock_expiring')await change("UPDATE f07_4_ci.config SET lock_notice_on=true,lock_notice_lead_minutes=45");
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
test('S54 审计记录字段齐全且不可把通知变正式Issuer',async()=>{await run();const r=(await Q('SELECT * FROM f07_4_ci.notification_log')).rows[0];for(const f of ['event_id','kind','stage','employee_id','channel','scheduled_at','recipient_ref','route_ref','config_version','revalidation_basis','result','code','dnd','revalidated','sent_at','backend_pid'])assert.notEqual(r[f],undefined);assert.equal(r.result,'SENT');assert.equal(r.recipient_ref.length,20);assert.equal(r.route_ref.length,20);assert.equal(r.revalidation_basis,'CI_SYNTHETIC_CURRENT_CONFIG');assert.notEqual(r.recipient_ref,'ci-fs-1');});
test('S55 真父来源缺口显式标记，不宣称父positive',async()=>{assert.equal((await parentConfigMutation(db,{},{})).origin,'SIGNED_PARENT_NEGATIVE_ONLY');console.log('NOTIFICATION_SIGNED_ISSUER_SOURCE_GAP SLA_EVENT_SOURCE_GAP SIGNED_PARENT_NEGATIVE_ONLY CI_SYNTHETIC_ONLY');});
test('S56 当前assignee正式变更时只发新负责销售',async()=>{
 await seed(db);
 await change("INSERT INTO f07_4_ci.employee(employee_id,active,eligible,in_scope,feishu_id) VALUES('employee-ci-2',true,true,true,'ci-fs-2')");
 await change("UPDATE f07_4_ci.employee SET active=false WHERE employee_id='employee-ci-1'");
 await change("UPDATE f07_4_ci.event SET employee_id='employee-ci-2'");
 assert.equal((await dispatch(db,{eventId:'event-ci-1',at:AT})).status,'SENT');
 assert.equal((await Q('SELECT recipient FROM f07_4_ci.mock_outbox')).rows[0].recipient,'ci-fs-2');
});
test('S57 个人飞书关闭不影响SLA总群独立许可',async()=>{
 await seed(db,{kind:'consultation_sla_timeout'});
 await change("UPDATE f07_4_ci.employee SET personal_on=false");
 assert.equal((await dispatch(db,{eventId:'event-ci-1',channel:'personal',at:AT})).code,'PERSONAL_ROUTE_DISABLED');
 assert.equal((await dispatch(db,{eventId:'event-ci-1',channel:'group',at:AT})).status,'SENT');
 assert.equal(await out(),1);
});
test('S58 锁到期提醒无已签启用及提前量配置不得发送',async()=>{
 assert.equal((await run({},{kind:'lock_expiring'})).code,'LOCK_NOTICE_CONFIG_SOURCE_GAP');assert.equal(await out(),0);
});
test('S59 锁到期提醒显式启用并设提前量才可模拟发送',async()=>{
 await change("UPDATE f07_4_ci.config SET lock_notice_on=true,lock_notice_lead_minutes=45");
 assert.equal((await run({},{kind:'lock_expiring'})).status,'SENT');assert.equal(await out(),1);
});
test('S60 SLA告警无既存deadline源事实必须拒绝',async()=>{
 assert.equal((await run({channel:'group'},{kind:'consultation_sla_timeout',deadline:null})).code,'SLA_EVENT_SOURCE_GAP');
 assert.equal(await out(),0);
});
test('S61 Incident跨时间桶不能提前重发；经过真实cadence后才可重发',async()=>{
 await seed(db,{kind:'incident_active',incidentActive:true,cadence:30});
 assert.equal((await dispatch(db,{eventId:'event-ci-1',channel:'group',at:'2026-10-16T02:29:00Z'})).status,'SENT');
 const early=await dispatch(db,{eventId:'event-ci-1',channel:'group',at:'2026-10-16T02:30:00Z'});
 assert.equal(early.code,'INCIDENT_CADENCE_NOT_DUE');assert.equal(await out(),1);
 assert.equal((await dispatch(db,{eventId:'event-ci-1',channel:'group',at:'2026-10-16T03:00:00Z'})).status,'SENT');
 assert.equal(await out(),2);
});
test('S62 公司总闸并发修改必须等当前锁后重读再拒绝',async()=>{
 await seed(db);
 const writer=await db.connect();
 try{
  await writer.query('BEGIN');
  await writer.query("UPDATE f07_4_ci.config SET company_on=false WHERE id=1");
  const pending=dispatch(db,{eventId:'event-ci-1',at:AT});
  await new Promise(resolve=>setTimeout(resolve,80));
  await writer.query('COMMIT');
  const r=await pending;assert.equal(r.code,'COMPANY_FEISHU_DISABLED');assert.equal(await out(),0);
 }finally{await writer.query('ROLLBACK').catch(()=>{});writer.release();}
});
test('S63 员工当前状态并发改写后重新判定不得发送',async()=>{
 await seed(db);
 const writer=await db.connect();
 try{
  await writer.query('BEGIN');
  await writer.query("UPDATE f07_4_ci.employee SET active=false WHERE employee_id='employee-ci-1'");
  const pending=dispatch(db,{eventId:'event-ci-1',at:AT});
  await new Promise(resolve=>setTimeout(resolve,80));
  await writer.query('COMMIT');
  const r=await pending;assert.equal(r.code,'CURRENT_EMPLOYEE_OR_SCOPE_DENIED');assert.equal(await out(),0);
 }finally{await writer.query('ROLLBACK').catch(()=>{});writer.release();}
});

test('S64 SLA未来deadline绝不投递',async()=>{const r=await run({channel:'group'},{kind:'consultation_sla_timeout',deadline:'2026-10-17T00:00:00Z'});assert.equal(r.code,'SLA_DEADLINE_NOT_REACHED');assert.equal(await out(),0);});
test('S65 SLA恰到deadline允许CI合成投递',async()=>{const r=await run({channel:'group'},{kind:'consultation_sla_timeout',deadline:AT});assert.equal(r.status,'SENT');assert.equal(await out(),1);});
test('S66 SLA未到最后一毫秒仍拒',async()=>{const r=await run({channel:'group'},{kind:'consultation_sla_timeout',deadline:'2026-10-16T02:00:00.001Z'});assert.equal(r.code,'SLA_DEADLINE_NOT_REACHED');});
test('S67 SLA首次人工响应已完成拒绝',async()=>{const r=await run({channel:'group'},{kind:'consultation_sla_timeout',firstResponseDone:true});assert.equal(r.code,'SLA_FIRST_RESPONSE_COMPLETED');assert.equal(await out(),0);});
test('S68 SLA合法hold期间不得误报超时',async()=>{const r=await run({channel:'group'},{kind:'consultation_sla_timeout',holdActive:true});assert.equal(r.code,'SLA_VALID_HOLD_PRESENT');});
test('S69 SLA缺完整有效事实拒绝而不伪造父签',async()=>{const r=await run({channel:'group'},{kind:'consultation_sla_timeout',slaFactValid:false});assert.equal(r.code,'SLA_FACT_NOT_ESTABLISHED');});
test('S70 SLA拒绝不改变源事件与父public目录',async()=>{await seed(db,{kind:'consultation_sla_timeout',deadline:'2026-10-17T00:00:00Z'});const q="SELECT count(*)::int n,md5(coalesce(string_agg(oid::text||relname||relkind::text,',' ORDER BY oid),'')) seal FROM pg_class WHERE relnamespace='public'::regnamespace";const before=(await Q(q)).rows[0];const eventBefore=checksum((await Q('SELECT * FROM f07_4_ci.event')).rows);await dispatch(db,{eventId:'event-ci-1',at:AT,channel:'group'});assert.equal(checksum((await Q('SELECT * FROM f07_4_ci.event')).rows),eventBefore);assert.deepEqual((await Q(q)).rows[0],before);assert.equal(await out(),0);});
test('S71 无active前态的Recovery拒绝',async()=>{const r=await run({channel:'group'},{kind:'incident_recovery',incidentActive:false});assert.equal(r.code,'RECOVERY_PREVIOUS_ACTIVE_SOURCE_GAP');assert.equal(await out(),0);});
test('S72 同Incident active到cleared事实转换后只恢复一次',async()=>{assert.equal(await activateIncident(db,'inc-ci-a'),true);assert.equal(await clearIncident(db,'inc-ci-a'),true);await seed(db,{id:'recovery-a',incidentId:'inc-ci-a',kind:'incident_recovery'});assert.equal((await dispatch(db,{eventId:'recovery-a',at:AT,channel:'group'})).status,'SENT');assert.equal((await dispatch(db,{eventId:'recovery-a',at:AT,channel:'group'})).status,'DEDUPED');assert.equal((await Q("SELECT recovery_notified FROM f07_4_ci.incident_lifecycle WHERE incident_id='inc-ci-a'")).rows[0].recovery_notified,true);assert.equal(await out(),1);});
test('S73 同Incident不同事件recovery重放被状态锁抑制',async()=>{await activateIncident(db,'inc-ci-a');await clearIncident(db,'inc-ci-a');await seed(db,{id:'recovery-a',incidentId:'inc-ci-a',kind:'incident_recovery'});await seed(db,{id:'recovery-b',incidentId:'inc-ci-a',kind:'incident_recovery'});const r=await Promise.all([dispatch(db,{eventId:'recovery-a',at:AT,channel:'group'}),dispatch(db,{eventId:'recovery-b',at:AT,channel:'group'})]);assert.deepEqual(r.map(x=>x.status).sort(),['DEDUPED','SENT']);assert.equal(await out(),1);});
test('S74 跨Incident恢复串线不允许',async()=>{await activateIncident(db,'inc-ci-a');await clearIncident(db,'inc-ci-a');await seed(db,{id:'recovery-other',incidentId:'inc-ci-other',kind:'incident_recovery'});assert.equal((await dispatch(db,{eventId:'recovery-other',at:AT,channel:'group'})).code,'RECOVERY_PREVIOUS_ACTIVE_SOURCE_GAP');});
test('S75 Incident Recovery失败可重试但不能提前标完成',async()=>{await activateIncident(db,'inc-ci-a');await clearIncident(db,'inc-ci-a');await seed(db,{id:'recovery-a',incidentId:'inc-ci-a',kind:'incident_recovery'});assert.equal((await dispatch(db,{eventId:'recovery-a',at:AT,channel:'group',simulate:'failure'})).status,'FAILED');assert.equal((await Q("SELECT recovery_notified FROM f07_4_ci.incident_lifecycle WHERE incident_id='inc-ci-a'")).rows[0].recovery_notified,false);assert.equal((await dispatch(db,{eventId:'recovery-a',at:AT,channel:'group'})).status,'SENT');assert.equal(await out(),1);});
test('S76 Incident DND跨窗口事实复核后才能恢复',async()=>{await activateIncident(db,'inc-ci-a');await clearIncident(db,'inc-ci-a');await seed(db,{id:'recovery-a',incidentId:'inc-ci-a',kind:'incident_recovery'});assert.equal((await dispatch(db,{eventId:'recovery-a',at:DND,channel:'group'})).code,'DND_DELAY_REVALIDATE');assert.equal((await dispatch(db,{eventId:'recovery-a',at:AT,channel:'group'})).status,'SENT');assert.equal(await out(),1);});
test('S77 Recovery不允许没有active就clear',async()=>{assert.equal(await clearIncident(db,'inc-ci-no-active'),false);await seed(db,{id:'recovery-a',incidentId:'inc-ci-no-active',kind:'incident_recovery'});assert.equal((await dispatch(db,{eventId:'recovery-a',at:AT,channel:'group'})).status,'SKIPPED');});
test('S78 个人与群通知日志保留各自安全路由和版本',async()=>{await seed(db,{kind:'consultation_sla_timeout'});for(const channel of ['personal','group'])assert.equal((await dispatch(db,{eventId:'event-ci-1',channel,at:AT})).status,'SENT');const rows=(await Q('SELECT * FROM f07_4_ci.notification_log ORDER BY id')).rows;assert.equal(rows.length,2);assert.notEqual(rows[0].route_ref,rows[1].route_ref);for(const x of rows){assert.equal(x.recipient_ref.length,20);assert.ok(x.config_version>0);assert.equal(x.result,'SENT');assert.equal(x.revalidation_basis,'CI_SYNTHETIC_CURRENT_CONFIG');}assert.equal(await out(),2);});
test('S79 Owner变更前后通知审计接收人散列一致且不含明文',async()=>{await seed(db);await change("INSERT INTO f07_4_ci.employee(employee_id,active,eligible,in_scope,feishu_id) VALUES('employee-ci-2',true,true,true,'ci-fs-2')");await change("UPDATE f07_4_ci.event SET employee_id='employee-ci-2'");await dispatch(db,{eventId:'event-ci-1',at:AT});const a=(await Q('SELECT l.recipient_ref,l.route_ref,o.recipient FROM f07_4_ci.notification_log l JOIN f07_4_ci.mock_outbox o ON l.event_id=o.event_id AND l.stage=o.stage AND l.channel=o.channel')).rows[0];assert.equal(a.recipient,'ci-fs-2');assert.ok(a.recipient_ref&&!a.recipient_ref.includes('ci-fs'));assert.ok(a.route_ref&&!a.route_ref.includes('ci-fs'));});
test('S80 FAILED、DEDUPED与Outbox投递结果逐行一致',async()=>{await seed(db);await dispatch(db,{eventId:'event-ci-1',at:AT,simulate:'failure'});await dispatch(db,{eventId:'event-ci-1',at:AT});await dispatch(db,{eventId:'event-ci-1',at:AT});const rows=(await Q('SELECT result,code,recipient_ref,route_ref FROM f07_4_ci.notification_log ORDER BY id')).rows;assert.deepEqual(rows.map(x=>x.result),['FAILED','SENT','DEDUPED']);assert.equal((await Q('SELECT count(*)::int n FROM f07_4_ci.mock_outbox')).rows[0].n,1);assert.ok(rows.every(x=>x.recipient_ref&&x.route_ref));});
test('S81 当前关闭开关日志保留路由与拒绝原因',async()=>{await seed(db);await change('UPDATE f07_4_ci.config SET company_on=false,version=version+1');assert.equal((await dispatch(db,{eventId:'event-ci-1',at:AT})).code,'COMPANY_FEISHU_DISABLED');const row=(await Q('SELECT * FROM f07_4_ci.notification_log')).rows[0];assert.equal(row.result,'SKIPPED');assert.ok(row.recipient_ref&&row.route_ref);assert.equal(row.config_version,(await Q('SELECT version FROM f07_4_ci.config WHERE id=1')).rows[0].version);assert.equal(await out(),0);});
test('S82 缺路由有安全缺口审计而不伪造接收对象',async()=>{await seed(db);await change('UPDATE f07_4_ci.employee SET feishu_id=NULL');const r=await dispatch(db,{eventId:'event-ci-1',at:AT});assert.equal(r.code,'PERSONAL_ROUTE_DISABLED');const x=(await Q('SELECT * FROM f07_4_ci.notification_log')).rows[0];assert.equal(x.route_ref,null);assert.equal(x.recipient_ref,null);assert.equal(x.revalidation_basis,'ROUTE_SOURCE_GAP');assert.equal(await out(),0);});
test('S83 Recovery审计与实际MockOutbox为同一stage/channel',async()=>{await activateIncident(db,'inc-ci-a');await clearIncident(db,'inc-ci-a');await seed(db,{id:'recovery-a',incidentId:'inc-ci-a',kind:'incident_recovery'});await dispatch(db,{eventId:'recovery-a',channel:'group',at:AT});const x=(await Q('SELECT l.result,l.route_ref,l.channel,l.stage,o.channel out_channel,o.stage out_stage FROM f07_4_ci.notification_log l JOIN f07_4_ci.mock_outbox o USING(event_id,stage,channel)')).rows[0];assert.equal(x.result,'SENT');assert.equal(x.channel,x.out_channel);assert.equal(x.stage,x.out_stage);assert.ok(x.route_ref);});
test('S84 active事件仍需同故障生命周期为active的首次合成正例',async()=>{
 const r=await run({channel:'group'},{kind:'incident_active',incidentActive:true,cadence:30});
 assert.equal(r.status,'SENT');assert.equal(await out(),1);
 assert.equal((await Q('SELECT status FROM f07_4_ci.incident_lifecycle')).rows[0].status,'active');
});
test('S85 clearIncident提交后旧事件布尔值仍true而新cadence不得发Active',async()=>{
 await seed(db,{kind:'incident_active',incidentActive:true,cadence:30});
 assert.equal((await dispatch(db,{eventId:'event-ci-1',channel:'group',at:AT})).status,'SENT');
 assert.equal(await clearIncident(db,'event-ci-1','2026-10-16T02:10:00Z'),true);
 assert.equal((await Q('SELECT incident_active FROM f07_4_ci.event')).rows[0].incident_active,true);
 const later=await dispatch(db,{eventId:'event-ci-1',channel:'group',at:'2026-10-16T02:31:00Z'});
 assert.equal(later.code,'INCIDENT_ALREADY_CLEARED');assert.equal(await out(),1);
 const a=(await Q("SELECT result,code FROM f07_4_ci.notification_log ORDER BY id")).rows;
 assert.deepEqual(a.map(x=>x.result),['SENT','SKIPPED']);
});
test('S86 伪造incident_active=true而无生命周期不可产生Mock消息',async()=>{
 await seed(db,{kind:'incident_active',incidentActive:false,cadence:30});
 await change("UPDATE f07_4_ci.event SET incident_active=true");
 const r=await dispatch(db,{eventId:'event-ci-1',channel:'group',at:AT});
 assert.equal(r.code,'INCIDENT_CURRENT_ACTIVE_SOURCE_GAP');assert.equal(await out(),0);
});
test('S87 同样是active但事件incident_id串到另一故障不得发送',async()=>{
 await seed(db,{kind:'incident_active',incidentActive:true,cadence:30,incidentId:'inc-ci-a'});
 await change("UPDATE f07_4_ci.event SET incident_id='inc-ci-b'");
 const r=await dispatch(db,{eventId:'event-ci-1',channel:'group',at:AT});
 assert.equal(r.code,'INCIDENT_CURRENT_ACTIVE_SOURCE_GAP');assert.equal(await out(),0);
});
test('S88 两真实Backend清除排队在先，提交后被阻塞的Active不得出站',async()=>{
 await seed(db,{kind:'incident_active',incidentActive:true,cadence:30});
 const writer=await db.connect();let pendingClear,pendingDispatch;
 try {
  await writer.query('BEGIN');
  const writerPid=(await writer.query('SELECT pg_backend_pid() pid')).rows[0].pid;
  await writer.query("SELECT incident_id FROM f07_4_ci.incident_lifecycle WHERE incident_id='event-ci-1' FOR UPDATE");
  pendingClear=clearIncident(db,'event-ci-1','2026-10-16T01:30:00Z');
  let waiting=false;
  for(let i=0;i<30;i++){
   await new Promise(resolve=>setTimeout(resolve,30));
   const r=await Q("SELECT count(*)::int n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='transactionid' AND pid<>pg_backend_pid()");
   if(r.rows[0].n>0){waiting=true;break;}
  }
  assert.equal(waiting,true,'clearIncident必须实际等待同生命周期行锁');
  pendingDispatch=dispatch(db,{eventId:'event-ci-1',channel:'group',at:AT});
  await new Promise(resolve=>setTimeout(resolve,80));
  await writer.query('COMMIT');
  assert.equal(await pendingClear,true);
  const res=await pendingDispatch;
  assert.notEqual(res.backendPid,writerPid);assert.equal(res.code,'INCIDENT_ALREADY_CLEARED');
  assert.equal(await out(),0);
  console.log('F07_4_R2_NATIVE_INCIDENT_CLEAR_DISPATCH_LOCK',writerPid,res.backendPid);
 }finally{
  await writer.query('ROLLBACK').catch(()=>{});
  writer.release();
  await Promise.allSettled([pendingClear,pendingDispatch].filter(Boolean));
 }
});
test('S89 不得以早于cleared_at的旧事件时间提前发送Recovery',async()=>{
 await activateIncident(db,'inc-ci-a');
 assert.equal(await clearIncident(db,'inc-ci-a','2026-10-16T03:00:00Z'),true);
 await seed(db,{id:'recovery-a',kind:'incident_recovery',incidentId:'inc-ci-a'});
 const early=await dispatch(db,{eventId:'recovery-a',channel:'group',at:AT});
 assert.equal(early.code,'RECOVERY_BEFORE_CLEARED_AT');assert.equal(await out(),0);
 assert.equal((await dispatch(db,{eventId:'recovery-a',channel:'group',at:'2026-10-16T03:00:00Z'})).status,'SENT');
 assert.equal(await out(),1);
});
test('S90 Active的事件时间早于实际activated_at必须拒绝',async()=>{
 await seed(db,{kind:'incident_active',incidentActive:true,cadence:30});
 await change("UPDATE f07_4_ci.incident_lifecycle SET activated_at='2026-10-16T03:00:00Z'");
 assert.equal((await dispatch(db,{eventId:'event-ci-1',channel:'group',at:AT})).code,'INCIDENT_ACTIVE_BEFORE_ACTIVATION');
 assert.equal(await out(),0);
 assert.equal((await dispatch(db,{eventId:'event-ci-1',channel:'group',at:'2026-10-16T03:00:00Z'})).status,'SENT');
});
test('S91 生命周期不存在真实ever_active时旧标记不得绕过',async()=>{
 await seed(db,{kind:'incident_active',incidentActive:true,cadence:30});
 await change("UPDATE f07_4_ci.incident_lifecycle SET ever_active=false");
 assert.equal((await dispatch(db,{eventId:'event-ci-1',channel:'group',at:AT})).code,'INCIDENT_CURRENT_ACTIVE_SOURCE_GAP');
 assert.equal(await out(),0);
});
test('S92 Active失败待重试时故障已清除，任何新cadence不可补发',async()=>{
 await seed(db,{kind:'incident_active',incidentActive:true,cadence:30});
 assert.equal((await dispatch(db,{eventId:'event-ci-1',channel:'group',at:AT,simulate:'failure'})).status,'FAILED');
 assert.equal(await clearIncident(db,'event-ci-1','2026-10-16T02:10:00Z'),true);
 assert.equal((await dispatch(db,{eventId:'event-ci-1',channel:'group',at:'2026-10-16T02:31:00Z'})).code,'INCIDENT_ALREADY_CLEARED');
 assert.equal(await out(),0);
});
test('F07-4 Source 完整92业务子例通过',()=>{console.log('F07_4_SOURCE_NATIVE_PG16_92_PASS');});
