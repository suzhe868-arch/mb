import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {randomUUID} from 'node:crypto';
import {test,before,after} from 'node:test';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {createFoundationHandler} from '../../../src/app.mjs';
import {assertF07RuntimeEnvironment,createF07Runtime,F08_3_REF,REF} from '../../../src/f07-runtime/runtime.mjs';
import {sign} from '../../collector-publisher-phone-callback-ci/contract.mjs';

const ORIGIN = 'https://127.0.0.1:4317';
let auth;
let runtime;
let handler;
let adminToken;
let salesToken;
let callbackSequence = 100001;
const scenarios = [];
const scenario = (name,fn) => scenarios.push({name,fn});

async function login(name,password) {
  const result = await auth.login({login:name,password,source:'127.0.0.1'});
  assert.equal(result.code,'AUTH_OK','synthetic login must succeed for '+name);
  return result.token;
}
async function invoke(method,path,body,headers={},host='127.0.0.1:4317') {
  const raw = body === undefined ? '' : (typeof body === 'string' ? body : JSON.stringify(body));
  const req = Readable.from(raw ? [Buffer.from(raw)] : []);
  req.method = method;
  req.url = path;
  req.headers = {host,...headers};
  const res = {
    statusCode:200,headers:{},body:'',
    writeHead(status,values={}) { this.statusCode=status; this.headers=values; },
    end(value='') { this.body=String(value); }
  };
  await handler(req,res);
  let parsed = {};
  try { parsed = JSON.parse(res.body || '{}'); } catch {}
  return {status:res.statusCode,headers:res.headers,body:parsed,raw:res.body};
}
const config = (action,scope_mode,employee_id=6,token=adminToken) =>
  invoke('POST','/__ci__/f07-runtime/phone/admin/configure',
    {employee_id,action,scope_mode},{'x-f07-test-session':token});
const latest = (vehicleId,token=salesToken,host='127.0.0.1:4317') =>
  invoke('GET','/__ci__/f07-runtime/phone/latest?vehicle_id='+vehicleId,undefined,
    token ? {'x-f07-test-session':token} : {},host);
const dial = (vehicleId,token=salesToken) =>
  invoke('POST','/__ci__/f07-runtime/phone/dial',{vehicle_id:String(vehicleId)},
    token ? {'x-f07-test-session':token} : {});
async function seedPhone(publisher,phone='TEST-123456') {
  const timestamp=String(Date.now());
  const raw=JSON.stringify({
    source_platform:'JYT',upstream_publisher_id:publisher,
    request_id:'job-'+String(callbackSequence++),nonce:randomUUID(),
    issued_at:new Date().toISOString(),status:'ok',phone
  });
  return invoke('POST','/__ci__/f07-runtime/phone/callback',raw,{
    'x-f07-timestamp':timestamp,'x-f07-signature':sign(raw,timestamp),
    'content-type':'application/json'
  });
}

before(async()=>{
  assertF07RuntimeEnvironment(process.env,F08_3_REF);
  auth = new IsolatedAuth({
    connectionString:process.env.F03_1_DATABASE_URL,
    secret:Buffer.from(process.env.F03_1_HMAC_KEY_BASE64,'base64'),
    origin:ORIGIN
  });
  adminToken = await login('admin_test','SyntheticAdmin_1234567');
  salesToken = await login('race_test','SyntheticRace_1234567');
  runtime = await createF07Runtime({env:process.env,auth,expectedRef:F08_3_REF});
  await runtime.resetForTests();
  handler = createFoundationHandler({f07RuntimeHandler:runtime.handler,readinessProbe:runtime.ready,readinessTimeoutMs:3000});
});
after(async()=>{
  if(runtime) await runtime.close();
  if(auth) await auth.close();
});

scenario('固定 F08-3 expectedRef 与当前 Push 分支匹配',async()=>{
  assert.equal(assertF07RuntimeEnvironment({...process.env,GITHUB_REF:F08_3_REF},F08_3_REF),true);
});
scenario('原 F07 默认 REF 未被放宽',async()=>{
  assert.equal(REF,'refs/heads/feat/f07-runtime-integration-nonprod-01');
  assert.throws(()=>assertF07RuntimeEnvironment({...process.env,GITHUB_REF:F08_3_REF}),/F07_RUNTIME_ENV_GITHUB_REF/);
});
scenario('任意调用方不能传入 main 或其他 expectedRef',async()=>{
  assert.throws(()=>assertF07RuntimeEnvironment(process.env,'refs/heads/main'),/F07_RUNTIME_EXPECTED_REF_NOT_ALLOWED/);
});
scenario('F07 Runtime 使用真实隔离 PostgreSQL 16 非超管连接',async()=>{
  const identity=await runtime.assertPhysicalPg16();
  assert.equal(identity.db,'f07_runtime_test');
  assert.equal(identity.usr,'f07_runtime_ci');
  assert.equal(identity.superuser,false);
});
scenario('电话缓存主键按 source_platform 与 upstream_publisher_id 且不引入 car_code',async()=>{
  const key=await runtime.pool.query("SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='f07_runtime.phone_cache'::regclass AND contype='p'");
  assert.match(key.rows[0].definition,/source_platform, upstream_publisher_id/);
  const columns=await runtime.pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema='f07_runtime' AND table_name='publisher_phone_vehicles'");
  assert.equal(columns.rows.some(row=>row.column_name==='car_code'),false);
});
scenario('普通员工不能调用 System Admin 授权配置入口',async()=>{
  const result=await config('grant','LOCKED_ONLY',6,salesToken);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'SYSTEM_ADMIN_CONTROL_REQUIRED');
});
scenario('System Admin 单员工授予 LOCKED_ONLY 并写入 override、SG01 binding、history、before/after 审计',async()=>{
  const result=await config('grant','LOCKED_ONLY');
  assert.equal(result.status,200);
  assert.equal(result.body.enabled,true);
  const override=await auth.pool.query("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=6 AND permission_id=13");
  assert.equal(override.rows[0].decision,'allow');
  const binding=await auth.pool.query("SELECT count(*)::int AS n FROM public.employee_capability_scope_bindings b JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=b.employee_id WHERE b.employee_id=6 AND b.permission_id=13 AND s.scope_kind='publisher_phone_special' AND s.ended_at IS NULL AND b.ended_at IS NULL");
  assert.equal(binding.rows[0].n,1);
  const history=await auth.pool.query("SELECT decision,actor_kind,actor_id FROM public.employee_permission_override_history WHERE employee_id=6 AND permission_id=13 ORDER BY event_id DESC LIMIT 1");
  assert.deepEqual(history.rows[0],{decision:'allow',actor_kind:'system_admin',actor_id:'9'});
  const audit=await auth.pool.query("SELECT actor_kind,actor_id,action,before_json,after_json,occurred_at FROM public.audit_events WHERE object_kind='employee_permission_override' AND object_id='6' AND action='publisher.phone.scope.grant' ORDER BY audit_id DESC LIMIT 1");
  assert.equal(audit.rowCount,1);
  assert.equal(audit.rows[0].actor_kind,'system_admin');
  assert.equal(audit.rows[0].actor_id,'9');
  assert.ok(audit.rows[0].occurred_at);
  assert.equal(audit.rows[0].after_json.scopeMode,'LOCKED_ONLY');
  assert.equal(audit.rows[0].after_json.scopeEnabled,true);
});
scenario('LOCKED_ONLY：当前有效 Lock 的 JYT 批发车可以读取合成电话',async()=>{
  const callback=await seedPhone('pub-locked');
  assert.equal(callback.status,200);
  const result=await latest(101);
  assert.equal(result.status,200);
  assert.equal(result.body.phone,'TEST-123456');
  assert.equal(result.body.origin,'CI_SYNTHETIC_ONLY');
  assert.ok(!JSON.stringify(result.body).includes('upstream_publisher_id'));
});
scenario('LOCKED_ONLY：没有 Lock 的在售 JYT 批发车拒绝',async()=>{
  const result=await latest(102);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_LOCK_REQUIRED');
});
scenario('LOCKED_ONLY：LockRequest 申请中不算有效 Lock',async()=>{
  const result=await latest(103);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_LOCK_REQUIRED');
});
scenario('LOCKED_ONLY：已取消 Lock 拒绝',async()=>{
  const result=await latest(104);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_LOCK_REQUIRED');
});
scenario('LOCKED_ONLY：已过期 Lock 拒绝',async()=>{
  const result=await latest(105);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_LOCK_REQUIRED');
});
scenario('LOCKED_ONLY：仅旧 listing cycle 有 Lock 时拒绝',async()=>{
  const result=await latest(106);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_LOCK_REQUIRED');
});
scenario('两种模式均拒绝已下架车辆',async()=>{
  const result=await latest(107);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_WHOLESALE_JYT_REQUIRED');
});
scenario('两种模式均拒绝已转名邦车辆，不依赖 F05 conversion 正向事实',async()=>{
  const result=await latest(108);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_WHOLESALE_JYT_REQUIRED');
});
scenario('两种模式均拒绝已转 4S 的车辆来源',async()=>{
  const result=await latest(109);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_WHOLESALE_JYT_REQUIRED');
});
scenario('非 JYT 平台车辆拒绝',async()=>{
  const result=await latest(110);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_WHOLESALE_JYT_REQUIRED');
});
scenario('缺少可信测试 publisher 映射时以 SOURCE_GAP 拒绝',async()=>{
  const result=await latest(111);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'PUBLISHER_MAPPING_SOURCE_GAP');
  assert.equal(result.body.origin,'SOURCE_GAP');
});
scenario('个人 deny 优先于已授予 allow',async()=>{
  await auth.pool.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=transaction_timestamp() WHERE employee_id=6 AND permission_id=13");
  const result=await latest(101);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_PERSONAL_DENY');
  const restored=await config('grant','LOCKED_ONLY');
  assert.equal(restored.status,200);
});
scenario('撤销单员工能力立即影响下一次请求',async()=>{
  const result=await config('revoke','LOCKED_ONLY');
  assert.equal(result.status,200);
  assert.equal(result.body.enabled,false);
  const denied=await latest(101);
  assert.equal(denied.status,403);
  assert.equal(denied.body.code,'CURRENT_CAPABILITY_NOT_GRANTED');
  const scope=await runtime.pool.query('SELECT enabled FROM f07_runtime.publisher_phone_employee_scope WHERE employee_id=6');
  assert.equal(scope.rows[0].enabled,false);
});
scenario('ALL_ACTIVE_JYT：无 Lock/Transaction 的当前在售 JYT 批发车可读取',async()=>{
  const configured=await config('grant','ALL_ACTIVE_JYT');
  assert.equal(configured.status,200);
  const callback=await seedPhone('pub-active','TEST-654321');
  assert.equal(callback.status,200);
  const result=await latest(102);
  assert.equal(result.status,200);
  assert.equal(result.body.phone,'TEST-654321');
});
scenario('切换回 LOCKED_ONLY 后，无 Lock 车辆立即拒绝',async()=>{
  const configured=await config('grant','LOCKED_ONLY');
  assert.equal(configured.status,200);
  const result=await latest(102);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_LOCK_REQUIRED');
});
scenario('切回 ALL_ACTIVE_JYT 后，无 Lock 车辆恢复允许',async()=>{
  const configured=await config('grant','ALL_ACTIVE_JYT');
  assert.equal(configured.status,200);
  const result=await latest(102);
  assert.equal(result.status,200);
  assert.equal(result.body.phone,'TEST-654321');
});
scenario('ALL_ACTIVE_JYT：当前在售条件失效后仍拒绝',async()=>{
  const result=await latest(107);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_WHOLESALE_JYT_REQUIRED');
});
scenario('ALL_ACTIVE_JYT：publisher 映射缺失仍拒绝',async()=>{
  const result=await latest(111);
  assert.equal(result.status,403);
  assert.equal(result.body.origin,'SOURCE_GAP');
});
scenario('相同 publisher 的两台车辆按平台+publisher 共用同一缓存身份',async()=>{
  const callback=await seedPhone('pub-shared','TEST-222222');
  assert.equal(callback.status,200);
  const first=await latest(112);
  const second=await latest(113);
  assert.equal(first.status,200);
  assert.equal(second.status,200);
  assert.equal(first.body.phone,'TEST-222222');
  assert.equal(second.body.phone,'TEST-222222');
  assert.equal(first.body.publisher_ref,second.body.publisher_ref);
});
scenario('缓存缺失时返回 PHONE_CACHE_MISSING 且不泄露其他 publisher 电话',async()=>{
  const result=await latest(114);
  assert.equal(result.status,404);
  assert.equal(result.body.code,'PHONE_CACHE_MISSING');
  assert.equal(Object.hasOwn(result.body,'phone'),false);
});
scenario('拨号路由仅授权并明确 DISABLED，不调用拨号器也不返回电话',async()=>{
  const result=await dial(102);
  assert.equal(result.status,200);
  assert.equal(result.body.dialer,'DISABLED');
  assert.equal(result.body.authorized,true);
  assert.equal(Object.hasOwn(result.body,'phone'),false);
});
scenario('经理可被独立授予并访问 ALL_ACTIVE_JYT 范围',async()=>{
  const configured=await config('grant','ALL_ACTIVE_JYT',8);
  assert.equal(configured.status,200);
  const manager=await login('manager_test','SyntheticManager_123456');
  const result=await latest(102,manager);
  assert.equal(result.status,200);
  assert.equal(result.body.phone,'TEST-654321');
});
scenario('店长可被独立授予并访问 ALL_ACTIVE_JYT 范围',async()=>{
  const configured=await config('grant','ALL_ACTIVE_JYT',9);
  assert.equal(configured.status,200);
  const manager=await login('store_manager_test','SyntheticStoreManager_123456');
  const result=await latest(102,manager);
  assert.equal(result.status,200);
  assert.equal(result.body.phone,'TEST-654321');
});
scenario('4S 车源即使其他字段看似有效也不能访问上游电话',async()=>{
  const result=await latest(109);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_WHOLESALE_JYT_REQUIRED');
});
scenario('4S 员工身份硬拒绝上游电话',async()=>{
  const fourS=await login('four_s_test','SyntheticFourS_123456');
  const result=await latest(101,fourS);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'FOUR_S_HARD_DENY');
});
scenario('System Admin 不能以业务员工身份读取电话',async()=>{
  const result=await latest(101,adminToken);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_EMPLOYEE_SESSION_REQUIRED');
});
scenario('后台不能给 inactive 员工授予专项电话能力',async()=>{
  const result=await config('grant','LOCKED_ONLY',3);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'TARGET_EMPLOYEE_NOT_ELIGIBLE');
});
scenario('后台拒绝未知专项范围模式',async()=>{
  const result=await config('grant','GLOBAL_ALL',6);
  assert.equal(result.status,400);
  assert.equal(result.body.code,'INVALID_PHONE_SCOPE_CONFIG');
});
scenario('角色模板即使为 allow 也不能替代单员工显式 override',async()=>{
  await auth.pool.query("UPDATE public.role_permission_defaults SET enabled=true,changed_at=transaction_timestamp() WHERE role_id=1 AND permission_id=13");
  const limitToken=await login('limit_test','SyntheticLimit_1234567');
  const result=await latest(101,limitToken);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_CAPABILITY_NOT_GRANTED');
  await auth.pool.query("UPDATE public.role_permission_defaults SET enabled=false,changed_at=transaction_timestamp() WHERE role_id=1 AND permission_id=13");
});
scenario('force-password-change 受限会话不能读取电话',async()=>{
  const restricted=await login('employee_test','SyntheticPassword_12345');
  const result=await latest(101,restricted);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'SESSION_OR_PC_ADMISSION_DENIED');
});
scenario('既有 F03 正式事实读取器仍 fail-closed，未被本 Guard 伪造为 allow',async()=>{
  const result=await invoke('GET','/__ci__/f07-runtime/parent/verify?vehicle_id=101',undefined,{'x-f07-test-session':salesToken});
  assert.equal(result.status,403);
  assert.equal(result.body.allowed,false);
  assert.equal(result.body.origin,'SOURCE_GAP');
});
scenario('权限/范围审计包含 actor、before/after 与时间且不记录明文电话',async()=>{
  const audits=await auth.pool.query("SELECT actor_kind,actor_id,action,before_json,after_json,occurred_at FROM public.audit_events WHERE action LIKE 'publisher.phone.scope.%' ORDER BY audit_id");
  assert.ok(audits.rowCount>=5);
  assert.ok(audits.rows.every(row=>row.actor_kind==='system_admin'&&row.actor_id==='9'&&row.occurred_at));
  assert.ok(audits.rows.some(row=>row.before_json&&Object.hasOwn(row.before_json,'permissionDecision')));
  assert.ok(audits.rows.some(row=>row.after_json&&Object.hasOwn(row.after_json,'scopeMode')));
  const history=await auth.pool.query("SELECT decision FROM public.employee_permission_override_history WHERE permission_id=13 AND actor_kind='system_admin'");
  assert.ok(history.rows.some(row=>row.decision==='allow'));
  assert.ok(history.rows.some(row=>row.decision==='revoked'));
  const runtimeAudit=await runtime.pool.query("SELECT domain,action,code,origin FROM f07_runtime.audit WHERE domain='phone'");
  const serialized=JSON.stringify({audits:audits.rows,runtimeAudit:runtimeAudit.rows});
  assert.equal(serialized.includes('TEST-123456'),false);
  assert.equal(serialized.includes('TEST-654321'),false);
});
scenario('伪造 Host 不会通过 loopback 入口校验',async()=>{
  const result=await latest(101,salesToken,'evil.example');
  assert.equal(result.status,400);
  assert.equal(result.body.code,'LOOPBACK_HOST_REQUIRED');
});
scenario('未知内部路由仍返回 404',async()=>{
  const result=await invoke('GET','/__ci__/f07-runtime/phone/customer-visible',undefined,{'x-f07-test-session':salesToken});
  assert.equal(result.status,404);
  assert.equal(result.body.code,'F07_RUNTIME_ROUTE_NOT_FOUND');
});
scenario('已撤销会话立即失效',async()=>{
  await auth.logout(salesToken);
  const result=await latest(101,salesToken);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'SESSION_OR_PC_ADMISSION_DENIED');
});

for (const item of scenarios) test(item.name,item.fn);
test('F08_3_PHONE_SCOPE_SCENARIOS_PASS',()=>assert.ok(scenarios.length>=35));
