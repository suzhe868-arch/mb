# F06-1｜B二轮R01/R02工程整改与A复验交接增补（2026-10-13）

> **当前门禁：`F06_1_B_R01_R02_REWORK_CI_PENDING / NEXT_OWNER=B`。** 以下是已提交的代码及须由官方GitHub原生CI确认的合同；不以先前旧HEAD的40 Source/76 PG Job成绩代替本次最后SHA结果。本次最终受审HEAD、Push工作流、Job与官方Artifact只按PR #52末次中文签署定位。B不能合并main、不能批准生产Issuer。

## 一｜A首轮正式整改单与修复边界

- A书面整改单：`07_重建工作区/F06-1_A主控首轮独立验收76项真PG16全绿但Priority转Lock未原子结束且独占可见无实证定向整改单_2026-10-13.md`。本次只解决既签PDM18 §27 的原Priority结束历史R01及§28客户列表/详情排他R02。
- 授权路径只有本批 `engineering/f06/lockrequest-approval-waitlist-ci/**`。旧F05-8 v24原生触发器/原服务、F05-7 v23 Match、M94→v26正式Public签名、D1及全部历史迁移不改；F06-2正式释放/到期、F06-3资金、微信电话、实际PC Customer发行者无授权，始终 fail closed。

## 二｜R01 同一真实PG16事务及签名历史

- 新CI服务在锁车审批前读取`public.f05_8_priority_ci`原PriorityID、客户与车源周期，不把单独的来源文字当作身份。最先取得Vehicle互斥后，合法`public.locks`插入触发**已签F05-8原生锁车占用触发器**，在同一数据库事务自动将本人active Priority变为`ended / converted_to_lock`，不提前单独commit。
- 本批新增`closeSignedPriorityForLock`必须重新读取这一原生状态，并验证真实`f05_7_result_versions_ci`受信Match结果ID/签名；若原触发器未原子结束或来源无法印证即抛异常让整单回滚。成功则在已有签名不可变`public.f05_8_events_ci`写入真正Priority ID、签名事件键、审批人、原Match与所获Lock ID；审批Request、价格/时长快照、其他竞争Waitlist依旧同事务提交。
- 原始Priority正向测试在隔离场景库对当前v23真PG Match及v24物理约束构建原始事实，使用**本F06签名CI服务**发起申请/审批，而非虚构JS Origin；旧v24业务服务自身的原v23唯一迁移前态校验不得在v26上被绕过。按物理PG场景注错`AFTER_PRIORITY_END_EVENT_THROW`检验Lock、Request、Priority、Waitlist、Event一起回滚。

## 三｜R02 当前客户读限制与普通Lock对照

- `f06_1_lock_ci.lock_snapshots`新增明确的`priority_origin_id`外键与原Customer来源成对存在约束，不再只凭客户ID推断Priority-origin Lock；来源无凭据则硬拒。
- 新`customerLockProjectionCI`只在合成Customer证明与隔离PG16环境可访问；通过真实Public Lock、精确签名Priority ended原因以及签名Priority结束事件三者交叉比对，Priority-origin期间对他客列表、详情hard deny，本人只得到裁剪后安全占用状态。普通非Priority Lock对其他原本可见客户只返回“已锁定”且不可建第二锁；hidden/Grant/当期Priority和Customer停用继续现时核验。
- 内部员工、Matching与合法旧PENDING→自动Waitlist仍在签名Public业务来源下按各自角色读取；客户侧不会因出现候补而泄露原Priority车辆详情。正式客户微信/真实Issuer未接通，不能声称此CI投影已经在生产路由上生效。

## 四｜本批原生复验条件

- 旧`06-S01～S40`四十项Source不得删弱；新增`06-S41～S48`八项真PG16正反例涵盖来源、PG注错完整回滚、最终合法转换、当前他客投影、普通Lock、旧周期与业务候补。Source须**48/48**；原HTTPS继续**9/9**。
- 旧冻结74个真非特权PG16 Job与新Source/HTTPS两Job全部需由**本最终唯一新SHA的12条真正Push Workflow**重新取得**至少76/76 Job成功（H52 52/52）**，不得复用前一SHA证据。
- 最终须有至少12份属于末次SHA的GitHub官方非空、未过期、带SHA256摘要的Artifacts。合法COMMIT场景库物理销毁、重建独立OID审计库后，151张Public+D1表全行count/MD5及24行Ledger、D1、公有Catalog Seal均须完全一致。
- **此文件是工程自验追踪，非单独CI通过证明。** 只有以上全套真实结果完成并在PR #52按末次唯一HEAD提供Run/Job/Artifact证据、标记`READY_FOR_A_SECOND_INDEPENDENT_REVIEW`，才可以交A二轮独立验收。

---

# 名邦汽车 V1｜F06-1 B 工程自验与 A 独立验收交接

> 任务：PDM18 锁车申请、6 小时 PG 时钟、现行 F03 Employee 会话审批、唯一正式 Lock 与竞争申请自动 Waitlist，**仅 CI 隔离测试**。本文件记录业务交付与验证方法；最终 GitHub Push HEAD、工作流/Job/Artifact ID 及状态以 PR #52 **与 HEAD 完全一致**的中文最终签署为准。B 不合并 main。

## 一、正式施工来源及边界

- A 正式施工单：`07_重建工作区/F06-1_A主控PDM18锁车申请6小时审批唯一Lock与竞争自动候补_CI隔离正式完整施工单_2026-10-13.md`。Final 产品规则：`PDM-18_最终完整规则.md`，与 PDM-19 的资金域严格分离。
- 施工起点：最新正式 main `9389a1556afb8c6e36e970516965d68056bad89f`；工作分支：`feat/f06-1-lockrequest-approval-waitlist-ci`；独立 PR #52。仅新增`engineering/f06/lockrequest-approval-waitlist-ci/**`与`.github/workflows/f06-1-*.yml`，不可新增生产业务路由或合并 main。
- 不修改原 M94 / v25 / v26 Public 签名、24 行历史迁移 Ledger、旧 D1 侧表、F03/F04/F05 生产/冻结服务、其他既有 CI。新的 `f06_1_lock_ci` schema 是独立合成 Sidecar，带 SQL SHA256、旧 Catalog、Ledger、D1 Attestation 的严格校验；**绝不是生产 v27 的应用许可**。

## 二、真实原生PG16业务实证

- `service.mjs` 实现 PG16 原子 `intakeCI`、`decisionCI`；生产身份始终 `productionIssuerDeny()`。不使用 JS 假时钟代替服务端 `clock_timestamp()`，不在 PENDING 阶段伪造正式 Lock、价格/72h快照。
- 真正 `lock_requests` 物理状态与 6h expires_at；正式 approve 采用同 Vehicle 行锁、现行 F03 `IsolatedAuth.withSession` 重新获取 Employee 当前身份、显式`lock.ci.approve`权限和团队 DataScope，禁止 4S/System Admin 将控制身份当作业务授权。物理唯一 active Lock 继承旧公表真实部分唯一索引。
- 会话确认到真实 Lock 时冻结 PG 72h/版本与价格：有效数字客户价保存真实数值和价格行源；无数字时使用明确的`consultation`事实，不用0假价。锁车 responsible 与审批 actor 独立记录在合成侧表；源 Request 同真实 Lock FK 保持一致。
- 同车同Cycle的其他仍有效 PENDING 在胜出事务内自动归为`lock_conflict`并创建或复用真实 Waitlist 与合法 Customer Owner responsible；按 Request created_at、request_id 保持稳定顺序，绝不承诺自动获得下一笔 Lock。expired、rejected、closed_not_lockable 均为终态、不重生。
- 真两物理 PostgreSQL 16 Backend 协议、独立 PID、另一连接实际`COMMIT`撤权后旧 Employee Session 拒绝；双授权审批同时执行仅生成一笔真实 active Lock，失败/幂等没有半截 Lock/Waitlist/Event；明确的错误注入后整个业务事务真实回滚。
- `tests/source.test.mjs` 原生 **40 项真实PG16正反例**、`tests/https.test.mjs` **9 项实际回环 TLS**，覆盖无签Customer/Phone、4S、System Admin、伪员工角色、资金与未放行mutation的硬拒绝和敏感信息不回显；本测试合成身份绝不等价真实微信 Customer 身份。

## 三、不可变性、撤销现场与真证据根

- F05-11 原签业务真正重放后，本域独立的源数据库先形成签名v26+D1基线。保留前态完整 Public+D1 逐表 count/全行MD5、Public Catalog、24行Ledger、D1 Attestation；在**可销毁场景数据库**真实 COMMIT LockRequest/Lock/Waitlist。
- 场景完成以后`DROP DATABASE ... FORCE`，以签名基线导出的数据库快照恢复一个**不同物理OID**的新数据库；新库审计实测之前/之后的 **151 张实际public+D1表** 全量 count/MD5 + Catalog/Ledger/D1 seal 严格一致；这是销毁与恢复，不是`UPDATE`业务表伪造无变更。
- 本批已实际获得原生 CI 日志标记：`F06_1_TWO_NATIVE_PG16_BACKENDS_COMMITTED_REVOKE_DENIES_OLD_TOKEN`、`F06_1_TRUE_TWO_PHYSICAL_BACKEND_ATOMIC_SINGLE_WINNER`、`F06_1_DISPOSABLE_SCENARIO_AND_SIGNED_AUDIT_GLOBAL_SEAL_PASS`，须由A在最后唯一 GitHub SHA 原生日志复核。真实两个 OID、Run ID 与 SHA256 详见本PR最终评论，不可借用上一SHA成功材料。
- 全域原签 Public Catalog SHA256：`5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4`。最终历史Ledger和D1签名从真实新SHA的`audit-global-seal-pass.json`直接机器核验。

## 四、CI 门禁与独立 A 验收

- 本文件提交后，最终 B 唯一 HEAD 必须形成 **12/12 event=push 工作流成功、≥76/76 实际PG16 Jobs成功（冻结 H52=52/52）、至少12份同HEAD GitHub官方非空/未过期 SHA256 Artifact**；旧已签 F05-11 11条冻结工作流只在新文件名下重发，本域新增1条Source/HTTPS两个独立Job，不得删除老回归或偷借旧HEAD结果。
- 首轮工程通过的 Source40/40、HTTPS9/9、两DB seal、真实权限/Owner/竞争事务日志与后续仅因Docker镜像`toomanyrequests: Data limit exceeded`所需原生rerun，都必须按**最终提交SHA**独立查验；无真实同HEAD结果时状态仍是 `B_CI_PENDING / NEXT_OWNER=B`。完整核验后在 PR 末尾明确`F06_1_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`。
- B自验包括：A白名单文件、迁移Checksum与原签Catalog完整保真、拒绝生产Issuer、真实PG16事务冲突、权限撤销新鲜重查、1 winner、2 loser候补、6h/72h快照、全域两DB seal、真实Run/Job/Artifacts可核验；交付给A后由A独立决定合并，B无 main 写权限。

## 五、保留 SOURCE_GAP / NOT_RUN / BLOCKED

- 微信/OAuth/真实手机号授权、Customer线上LockRequest入口、实际员工/PC业务签发、生产 price authority、独立Employee直接建Lock，均未取得本单生产许可。本包 CI Synthetic 不授予实际客户任何锁车权利或导出真实电话。
- 真实 Deposit、支付/Refund、Transaction、真实资金校验、供应异常、72h到期释放、人工延期/取消、生产 Waitlist 后续确认、线下实车锁定、通知/飞书/JYT均为后续未放行分包。生产LockRequest或Employee Approval一律 **fail closed**。
- **主线状态不变：`F05_GLOBAL_NOT_READY / C_H01_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`。**
