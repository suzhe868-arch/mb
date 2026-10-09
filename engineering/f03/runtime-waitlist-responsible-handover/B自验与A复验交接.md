# F03-2-2K｜B完整自验及A主控独立复验交接

> 日期2026-10-10（Asia/Singapore）｜**B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A**。执行只限已批准的合成隔离PG16；**最终交A的生效条件是本文件提交后最新B HEAD与同SHA14/14成功CI完全一致**。本报告以经A独立验收签字为正式合并前门禁，不是A已经通过。

## 一、唯一正式Authority、授权、分支

- A正式施工单：`07_重建工作区/F03-2-2K_A主控SG06_Waitlist候补负责人单域移交完整施工单_2026-10-10.md`；冻结PDM-18 Final §§10～13、31～33，PDM-03、PDM-02及PDM-25；不更改PDM Final。
- J前置已由A独立验收并标准PR18合并，merge SHA `367ff5d16fe913f5e6b2002abd559522f4cc4d26`。
- B指定分支：`feat/f03-waitlist-responsible-handover-2k`，真实分支起点main `693a6fab71e74592366d37fe5ae5a1cb520cc7c9`。**所有工程改动均在B分支，不直接在main施工、不自行合并、不进入2L。**
- 只允许隔离PG16 disposable非超级管理员`f03_ci`、测试专用`f03_auth_test`和真实受控F03-1 PC模拟员工会话、合成Waitlist；未使用真实Customer、生产账号或外部系统。
- K只建设Waitlist **现有**当前负责人受控人工移交，不建立/结束候补，不改变候补内部顺序，不批准LockRequest、不创建/升级正式Lock，不改Recommendation、Priority、Customer owner、Demand、Consultation/SLA、Waitlist `ended_at/source_lock_request_id/active_lock_id`，不更改SG06 batch/item状态为completed。

## 二、本批新代码、与旧H/I/J守卫三项最小授权例外

仅新增`engineering/f03/runtime-waitlist-responsible-handover/**`及独立新CI`.github/workflows/f03-2-2k-waitlist-responsible-handover.yml`。K新模块：
- `service.mjs`：`prepareWaitlistResponsibleHandover`、`commitWaitlistResponsibleHandover`、`retryWaitlistResponsibleHandover`、`readWaitlistResponsibleHandoverReceipt`，真实权限`waitlist.responsible.transfer`**只在CI合成fixture注册**。current经理/店长精确Team/store+data scope/capability binding、personal deny优先，active源与合法计划停用/突然失活批次、active接替人分开校验；操作人`receiving_status=paused`不自动失权。
- `facts`：正式SG06 batch/item仅pending/retry；真Waitlist无status字段，仅`ended_at IS NULL`；当前Customer与可售Vehicle+同周期；源LockRequest必须合法同客户/车/周期，源端已`closed_not_lockable`等终态拒绝；`active_lock_id`应对应同周期其他客户真实活跃Lock，过期或错关系拒绝；本客户自己已有该车active Lock则不做候补转派；仅hidden不单独结束候补。
- `commit/retry`：共享SG06 advisory transaction lock 306/309，追加K 313；本单域原子CAS只修改`waitlists.responsible_employee_id`一列，同事务原始before/after审计+单项不可变Receipt；五个注错阶段事务全部回滚，同item+同Key+完整同意图幂等，无可信收据返回DENY。三方H/I/J+K SHA跨域查重，含所有12方向与四受控会话相同Key竞争及不同Key同时合法成功。
- `read`：校验每张receipt、源batch/item、真实audit context/time、连续历史from/to+递增audit时间、现任最终负责人是否获可信链确认；早期历史可读，不因合法二次转派/旧受让人离职而失效；当下reader撤权/不在scope/deny拒绝最小历史读。
- `000011.sql`：**最多且实际只新增一张**append-only `public.waitlist_responsible_handover_receipts`表与从属PK/FK/UNIQUE/trigger，唯一K许可物理修改；旧000001～000010迁移SQL、checksum、结构Guard、旧CI工作流、旧测试均零修改。

按A正式K施工单授权，仅有三份**已有服务文件**相对main作最小修改，不修改其任何业务事实、原始权限、历史收据或旧表/测试：
1. `engineering/f03/runtime-customer-owner-handover/service.mjs`：H commit/retry已有完整封印入口在J表实际存在时再`to_regclass`检测K表；K存在用K92严格manifest verify，不存在沿用J91/I90/H89；原H跨域SHA查询旁仅添K表存在性及同Key反查。
2. `engineering/f03/runtime-demand-responsible-handover/service.mjs`：I commit/retry仅在J/K表真实存在时依序升级至K92完整seal，否则保留I90/J91封印；增加K同SHA反查，prepare/read仍原I90 Guard。
3. `engineering/f03/runtime-consultation-assignee-handover/service.mjs`：J的commit/retry指定`crossDomainRequestKeyCommit:true`，K表存在时仅在该入口选择K92完整Seal、同SHA反查；J91自身prepare/read仍沿用严格91表verify，不接受K新结构。

## 三、真实PG16物理结构，原始SOURCE，精确校验值

| 完整目录 | 旧J冻结91表 | 本批K唯一新表后92表 |
|---|---:|---:|
| 表 | 91 | 92 |
| 普通字段 | 572 | 584 |
| 约束 | 390 | 405 |
| 索引 | 151 | 155 |
| 完整catalog键 | 1982 | 2028 |
| 与前一版差异 | 原1982定义100%保留 | **仅增46**，旧键无修改 |

- 旧J91结构SHA：`ef3bcd0c89c959225764d0853b203047116282c3bd6f976e41aff1cd7b95e735`；J原始SOURCE run`37994016455`，对应old证据来自J已合并仓库目录。
- K新000011 SQL SHA256：`2a0cd1eb915b14efc6564bb29adb4dd0c5348f8d5805b3ab3e4a955888cd1717`；K完整结构SHA：`6b6932e4855074ed63ec0ceda89b568e1b4b1f62d111c759f9c7a77a841a3c76`。由真实PG16 discovery`F03_2K_DISCOVERY_CANDIDATE`测得并写入`000011.manifest.json`；原1982旧目录一项未修改，只批准新增46。
- 首次K新92表物理原始归档源：`engineering/f03/runtime-waitlist-responsible-handover/evidence/SOURCE.md`，真实 **source run 37998992137**、**source commit SHA `8d50384fefc7b3390383d46d6a1bc7616cd7f42d`**，来源独立K PG16 job，含`pg16_schema_only.sql`、`pg16_inventory.json`、`old-structure.json`、`new-structure.json`和`sha256sums.txt`**原字节**。
- 每次以后同SHA运行必须再次执行`F03_2K_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`，校验J91 old与K92 new全目录对象及版本inventory一模一样，原pg_dump仅对自动生成**一对**restrict/unrestrict随机键验证配对后受控归一；不允许宽松文本标准化，不录任何客户真实行或原始认证密码。

## 四、独立全量PG16 14作业的真实首轮完成证据

- 第一轮**全部**通过：真实[GitHub Actions #37998992137](https://github.com/suzhe868-arch/mb/actions/runs/37998992137)，run.head_sha=`8d50384fefc7b3390383d46d6a1bc7616cd7f42d`，**completed / success / 14 of 14 independent PG16 jobs success / 0 failure**。
- 新K92自身测试**29/29通过**，包括五点注错rollback、咨询/顾问/优先级与候补不反写、Waitlist已end不复活、Vehicle下架/周期结束、原LockRequest来源终态、活跃占有正式Lock、真实并发、历史连转和未授权读取；旧J91原测试**27/27**、旧I90原测试**27/27**分别在自身新建、非超级管理员的91/90表PG16中运行通过，不借用K92测试替代。
- 旧I90`F03_2I_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`、旧J91`F03_2J_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`均成功；K新92表第一轮`F03_2K_EVIDENCE_FULL_CATALOG_PASS`且已自动原样归档SOURCE。旧H89、E/F/G88、D86、C84、B82双、A81、F03-1认证与HTTPS80都分别独立成功。
- **首轮源码SHA不等于本报告后最新HEAD**（CI自动归档原始92表证据和本报告随后更新所致），不得冒充最终同SHA验收。最终必须另有最新HEAD自己的真实14/14 completed/success、K29/J27/I27、K archive-check PASS、原物理目录不变后才正式交A。

### 首轮CI的14个真实job逐项结果（名称与GitHub jobs列表一致）

1. **F03-2-2D frozen 86-table Team Scope regression on own new PG16** — `success`
2. **F03-2-2H exact 89-table CI-only Customer Owner CAS/history/receipt on genuine PG16** — `success`
3. **F03-2-2E frozen 88-table SG06 ledger regression on own PG16** — `success`
4. **F03-2-2F frozen 88-table Team capability governance regression own PG16** — `success`
5. **F03-2-2B empty 82-table first-admin atomic bootstrap race** — `success`
6. **F03-2-2G frozen 88-table SG06 preflight regression independent genuine PG16** — `success`
7. **F03-2-2K isolated PG16 Waitlist 91-to-92 one-table discovery** — `success`
8. **F03-2-2A sealed 81-table admin governance CI** — `success`
9. **F03-2-2C frozen 84-table authentic SG03 regression on own PG16** — `success`
10. **F03-1 frozen HTTPS security - its OWN new PG16** — `success`
11. **F03-2-2J 90-to-91 PG16 Consultation protected one-table discovery** — `success`
12. **F03-2-2B exact 82-table admin two-population / rollback / structure** — `success`
13. **F03-1 frozen real security integration - its OWN new PG16** — `success`
14. **F03-2-2I FROZEN independent 90-table PG16 full 27 tests + archival source verification** — `success`

## 五、冻结安全边界、复验结论

- 所有模拟只在一次性新PG16、非超级用户、合成账户与真实会话发生；无生产/微信/JYT/飞书/员工端正式HTTP调用；不能创造Lock、解锁/退款/改交易、提升候补自动优先级、把Waitlist单域收据当SG06整批completed。
- 旧H/I/J只改获A预授权K新增表发现与commit/retry四域Key碰撞守卫；旧PG16 H89/I90/J91版本和原迁移全部独立回归，无需再让用户逐项确认普通工程问题。
- A应独立复核真实最新SHA、14个独立PG16作业、H/I/J守卫diff、K 29例证据、J/I 27各自原测试、源SHA/真实原始字节以及业务状态边界，合格后才由A创建标准PR合并。B未自行合并main，未开始2L。

**B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A**

**F03-2整体、C/H01高保真和产品基线继续`NOT_READY`。**
