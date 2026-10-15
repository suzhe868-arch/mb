import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHmac} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {verifyAuthDatabase} from '../../../src/f03-auth-readiness.mjs';
import {readCurrentFacts} from '../../../f03/runtime-facts/current-facts.mjs';
import {assertCIEnv,physicalGate,signedRead,inspectCollector,inspectCollectorOnce,mapSyntheticSyncApi,pool,DATABASE_URL,SOURCE_GAP} from '../gate.mjs';

const C={source_platform:'JYT',upstream_publisher_id:'123',vehicle_id:'456'};
const login='race_test', password='SyntheticRace_1234567';
test('F07-3 F03真实已签Session与Collector安全Source（独立PG16）',async t=>{
 const clientPool=pool();const physical=await physicalGate(clientPool);
 assert.equal(physical.usr,'f03_ci');assert.equal(await verifyAuthDatabase(clientPool),true);
 const auth=new IsolatedAuth({connectionString:DATABASE_URL,secret:randomBytes(48),origin:'https://127.0.0.1:443'});
 let n=0;const check=async(name,fn)=>{await t.test(name,async()=>{await fn();n++})};
 try{
  const session=await auth.login({login,password});
  await check('F03-01 签名父身份物理PG16',async()=>assert.ok(physical.ver>=160000));
  await check('F03-02 真IsolatedAuth登录',async()=>assert.equal(session.code,'AUTH_OK'));
  await check('F03-03 真withSession员工身份',async()=>assert.equal(String(await auth.withSession(session.token,async(_,a)=>a.employee_id,{normalOnly:true})),'6'));
  await check('F03-04 当前签名F03源电话能力缺编目',async()=>assert.equal((await readCurrentFacts(auth,session.token,'vehicle.publisher_phone.read')).code,'CAPABILITY_NOT_IN_CURRENT_CATALOG'));
  await check('F03-05 F07真Session读取最终电话拒绝',async()=>assert.equal((await signedRead(auth,session.token,C)).allowed,false));
  await check('F03-06 历史latest仍不可取得电话',async()=>assert.equal((await readCurrentFacts(auth,session.token,'vehicle.publisher_phone.latest')).finalAllowed,false));
  await check('F03-07 拨号同样未签',async()=>assert.equal((await readCurrentFacts(auth,session.token,'vehicle.publisher_phone.dial')).finalAllowed,false));
  await check('F03-08 未签报告原件拒绝',async()=>assert.equal((await signedRead(auth,session.token,C,'report_original')).allowed,false));
  await check('F03-09 图片当前Scope未最终发权',async()=>assert.equal((await signedRead(auth,session.token,C,'vehicle_photo')).allowed,false));
  await check('F03-10 可见报告仍不得借侧车布尔值授签',async()=>assert.equal((await signedRead(auth,session.token,C,'report_visible')).allowed,false));
  const invalid=[
   {source_platform:'MB',upstream_publisher_id:'123',vehicle_id:'456'},
   {source_platform:'JYT',upstream_publisher_id:'',vehicle_id:'456'},
   {source_platform:'JYT',upstream_publisher_id:'123',vehicle_id:'0'},
   {source_platform:'JYT',upstream_publisher_id:'123',vehicle_id:'456',car_code:'same'},
   {source_platform:'JYT',upstream_publisher_id:123,vehicle_id:'456'},
   {source_platform:'JYT',upstream_publisher_id:'123',vehicle_id:'456%2f'},
   {source_platform:'JYT',upstream_publisher_id:'123',vehicle_id:'456/../'},
   {source_platform:'JYT',upstream_publisher_id:'0001',vehicle_id:'456'}
  ];
  for(let i=0;i<invalid.length;i++)await check('F03-'+String(11+i).padStart(2,'0')+' 绑定与上游伪造拒绝',async()=>{
   assert.equal((await signedRead(auth,session.token,invalid[i])).code,'PUBLISHER_VEHICLE_SOURCE_BINDING_DENIED');
  });
  const secret=randomBytes(48),ts=String(Date.now()), base={...C,car_code:'same-car',job_id:'job-123',nonce:'a'.repeat(32)};
  const pack=x=>{const raw=JSON.stringify(x);return [raw,createHmac('sha256',secret).update(ts+'.'+raw).digest('hex')]};
  const [good,goodSig]=pack(base);
  await check('F03-19 合成签名有效但正式JYT发行方缺签拒绝',async()=>assert.equal(inspectCollector(good,ts,goodSig,secret,C).code,'PRODUCTION_JYT_JOB_ISSUER_SOURCE_GAP'));
  await check('F03-20 伪签被拒',async()=>assert.equal(inspectCollector(good,ts,'0'.repeat(64),secret,C).allowed,false));
  await check('F03-21 过期回传被拒',async()=>assert.equal(inspectCollector(good,String(Date.now()-600000),goodSig,secret,C).code,'COLLECTOR_TIME_DENIED'));
  await check('F03-22 复用同car_code跨Publisher不能验身份',async()=>{const [raw,sig]=pack({...base,upstream_publisher_id:'999'});assert.equal(inspectCollector(raw,ts,sig,secret,C).code,'COLLECTOR_BINDING_DENIED')});
  await check('F03-23 合成跨Vehicle拒绝',async()=>{const [raw,sig]=pack({...base,vehicle_id:'777'});assert.equal(inspectCollector(raw,ts,sig,secret,C).code,'COLLECTOR_BINDING_DENIED')});
  await check('F03-24 无job拒绝',async()=>{const [raw,sig]=pack({...base,job_id:null});assert.equal(inspectCollector(raw,ts,sig,secret,C).code,'COLLECTOR_BINDING_DENIED')});
  await check('F03-25 SQL实际行锁和非超级用户并发拒绝',async()=>{
   const a=await clientPool.connect(),b=await clientPool.connect();
   try{
    assert.notEqual(a.processID,b.processID);
    await a.query('BEGIN');await a.query('SELECT account_id FROM public.pc_login_accounts WHERE employee_id=6 FOR UPDATE');
    await b.query('BEGIN');await b.query("SET LOCAL lock_timeout='120ms'");
    await assert.rejects(b.query('SELECT account_id FROM public.pc_login_accounts WHERE employee_id=6 FOR UPDATE'),e=>e.code==='55P03');
    await b.query('ROLLBACK');await a.query('ROLLBACK');
   }finally{a.release();b.release()}
  });
  await auth.pool.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES (91001,'publisher.phone.sensitive')");
  await auth.pool.query("INSERT INTO public.role_permission_defaults(role_id,permission_id,enabled,changed_at) VALUES (1,91001,true,now())");
  await check('F03-26 即使模拟permission授予仍待A签别名',async()=>assert.equal((await readCurrentFacts(auth,session.token,'vehicle.publisher_phone.read')).code,'TECH_ALIAS_NOT_APPROVED'));
  await auth.pool.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES (6,91001,'deny',now())");
  await check('F03-27 当前个人DENY覆盖角色模板',async()=>assert.equal((await readCurrentFacts(auth,session.token,'vehicle.publisher_phone.read')).code,'CURRENT_PERSONAL_DENY'));
  await check('F03-28 电话当前读同样个人DENY',async()=>assert.equal((await signedRead(auth,session.token,C)).code,'CURRENT_PERSONAL_DENY'));
  await auth.pool.query('UPDATE public.pc_login_accounts SET credential_epoch=credential_epoch+1 WHERE employee_id=6');
  await check('F03-29 COMMIT新epoch使原Token失效',async()=>assert.equal(await auth.withSession(session.token,async()=>true,{normalOnly:true}),null));
  await check('F03-30 已撤旧Token读取拒绝',async()=>assert.equal((await signedRead(auth,session.token,C)).code,'SESSION_OR_ADMISSION_DENIED'));
  await check('F03-31 原session图片回读也拒绝',async()=>assert.equal((await signedRead(auth,session.token,C,'vehicle_photo')).code,'SESSION_OR_ADMISSION_DENIED'));
  await check('F03-32 错仓库在执行前拒绝',async()=>assert.throws(()=>assertCIEnv({...process.env,GITHUB_REPOSITORY:'other/repo'}),/F07_3_CI_ENV/));
  await check('F03-33 错Push ref执行前拒绝',async()=>assert.throws(()=>assertCIEnv({...process.env,GITHUB_REF:'refs/heads/main'}),/F07_3_CI_ENV/));
  await check('F03-34 错数据库执行前拒绝',async()=>assert.throws(()=>assertCIEnv({...process.env,DATABASE_URL:'postgres://somewhere.invalid/postgres'}),/F07_3_CI_DSN/));
  await check('F03-35 无PC个人准入的4S身份登录硬拒绝',async()=>{
   const x=await auth.login({login:'four_s_test',password:'SyntheticFourS_123456'});
   assert.equal(x.code,'AUTH_FAILED');
  });
  await check('F03-36 即使4S获PC个人准入，电话业务仍硬DENY',async()=>{
   await auth.pool.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(2,10,'allow',now())");
   const x=await auth.login({login:'four_s_test',password:'SyntheticFourS_123456'});
   assert.equal(x.code,'AUTH_OK');
   assert.equal((await readCurrentFacts(auth,x.token,'vehicle.publisher_phone.read')).code,'HARD_DENY_FOUR_S');
  });
  await check('F03-37 真系统管理员不能代员工读取Publisher电话',async()=>{
   const x=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567'});
   assert.equal(x.code,'AUTH_OK');
   assert.equal((await readCurrentFacts(auth,x.token,'vehicle.publisher_phone.read')).code,'SYSTEM_ADMIN_NO_BUSINESS_RIGHT');
  });
  await check('F03-38 真inactive账号登录硬拒绝',async()=>{
   assert.equal((await auth.login({login:'inactive_test',password:'SyntheticInactive_123'})).code,'AUTH_FAILED');
  });
  await check('F03-39 真disabled凭据登录硬拒绝',async()=>{
   assert.equal((await auth.login({login:'disabled_test',password:'SyntheticDisabled_123'})).code,'AUTH_FAILED');
  });
  // 仅在隔离PG16非public CI schema登记合成nonce，绝不改冻结public Seal或正式迁移。
  await clientPool.query('CREATE SCHEMA f07_3_ci');
  await clientPool.query("CREATE TABLE f07_3_ci.used_nonces(source_platform text NOT NULL,upstream_publisher_id text NOT NULL,vehicle_id text NOT NULL,job_id text NOT NULL,nonce text NOT NULL,expires_at timestamptz NOT NULL,PRIMARY KEY(source_platform,upstream_publisher_id,vehicle_id,job_id,nonce))");
  await clientPool.query('CREATE TABLE f07_3_ci.revoked_jobs(job_id text PRIMARY KEY)');
  await check('F03-40 第一次合成nonce仍为生产Issuer缺失，第二次真PG16物理重放拒绝',async()=>{
   const first=await inspectCollectorOnce(good,ts,goodSig,secret,C,clientPool);
   assert.equal(first.code,'PRODUCTION_JYT_JOB_ISSUER_SOURCE_GAP');
   const second=await inspectCollectorOnce(good,ts,goodSig,secret,C,clientPool);
   assert.equal(second.code,'COLLECTOR_NONCE_REPLAY_DENIED');
   const count=await clientPool.query('SELECT count(*)::int n FROM f07_3_ci.used_nonces');
   assert.equal(count.rows[0].n,1);
  });
  await check('F03-41 两独立PG Backend并行同nonce仅一次登记',async()=>{
   const [raw,sig]=pack({...base,nonce:'b'.repeat(32)});
   const both=await Promise.all([inspectCollectorOnce(raw,ts,sig,secret,C,clientPool),inspectCollectorOnce(raw,ts,sig,secret,C,clientPool)]);
   assert.deepEqual(both.map(x=>x.code).sort(),['COLLECTOR_NONCE_REPLAY_DENIED','PRODUCTION_JYT_JOB_ISSUER_SOURCE_GAP'].sort());
   assert.equal((await clientPool.query("SELECT count(*)::int n FROM f07_3_ci.used_nonces WHERE nonce=$1",['b'.repeat(32)])).rows[0].n,1);
  });
  await check('F03-42 撤销Job使正确HMAC亦不可再消费',async()=>{
   await clientPool.query("INSERT INTO f07_3_ci.revoked_jobs(job_id) VALUES($1)",['job-123']);
   const [raw,sig]=pack({...base,nonce:'c'.repeat(32)});
   assert.equal((await inspectCollectorOnce(raw,ts,sig,secret,C,clientPool)).code,'COLLECTOR_JOB_REVOKED');
  });
  await check('F03-43 同car_code不同Publisher与Vehicle不能撞消费身份',async()=>{
   const other={...C,upstream_publisher_id:'999',vehicle_id:'777'};
   const [raw,sig]=pack({...base,...other,job_id:'job-999',nonce:'a'.repeat(32)});
   assert.equal((await inspectCollectorOnce(raw,ts,sig,secret,other,clientPool)).code,'PRODUCTION_JYT_JOB_ISSUER_SOURCE_GAP');
   assert.equal((await clientPool.query("SELECT count(*)::int n FROM f07_3_ci.used_nonces WHERE upstream_publisher_id='999' AND vehicle_id='777'")).rows[0].n,1);
  });
  await check('F03-44 PDM04新增更新API映射Publisher/Job/Vehicle且不出站',async()=>{
   const x=mapSyntheticSyncApi('UPSERT_VEHICLE',{...C,car_code:'same-car',job_id:'job-111'});
   assert.equal(x.event,'UPSERT');assert.equal(x.publisher_id,'123');
   assert.equal(x.vehicle_id,'456');assert.equal(x.allowed,false);
  });
  await check('F03-45 PDM04批量确认下架映射复合身份',async()=>{
   const x=mapSyntheticSyncApi('BATCH_CONFIRM_DELIST',{job_id:'job-222',identities:[C,{...C,upstream_publisher_id:'999'}]});
   assert.equal(x.event,'DELIST');assert.equal(x.identities.length,2);
   assert.notEqual(x.identities[0].upstream_publisher_id,x.identities[1].upstream_publisher_id);
  });
  await check('F03-46 PDM04获取仍在售批发API仅由服务端定范围',async()=>{
   const x=mapSyntheticSyncApi('LIST_CURRENT_WHOLESALE',{job_id:'job-333',source_platform:'JYT'});
   assert.equal(x.serverScoped,true);assert.deepEqual(x.vehicle_ids,[]);
   assert.equal(x.code,'PRODUCTION_SYNC_API_ISSUER_SOURCE_GAP');
  });
  await check('F03-47 三API凭据域与电话Collector不得混用',async()=>{
   const x=mapSyntheticSyncApi('UPSERT_VEHICLE',{...C,car_code:'same',job_id:'job-444'},'collector_phone_credential');
   assert.equal(x.code,'SYNC_API_CREDENTIAL_DOMAIN_DENIED');
   assert.equal(mapSyntheticSyncApi('UNKNOWN',{job_id:'job-444'}).code,'SYNC_API_UNKNOWN');
  });
  // F03父验签明确要求无额外命名空间；合成schema必须先彻底销毁后重新原生验签。
  await clientPool.query('DROP SCHEMA f07_3_ci CASCADE');
  assert.equal(await verifyAuthDatabase(clientPool),true,'撤去一次性CI nonce结构后父F03全库身份/结构Seal恢复');
  console.log('F07_3_F03_NATIVE_SIGNED_SOURCE_'+n+'_PASS physical_pid='+physical.pid+' phone='+SOURCE_GAP);
 }finally{await auth.close();await clientPool.end()}
});
