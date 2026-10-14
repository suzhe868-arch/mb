# 2026-10-15｜B第三轮真正PG16红证结案：上游F05-8父自动Issuer签名越界，立即阻断（最高优先级）

**结论**：`BLOCKED_UPSTREAM_F05_8_PARENT_AUTO_ISSUER_CROSS_DOMAIN / NOT_READY_FOR_A_REVIEW / PR62_NOT_MERGED`。唯一实际红证运行 SHA `96ce3c725d6279a9a67b1fbdef46e1f113454cfa`，官方 [Run38641938789](https://github.com/suzhe868-arch/mb/actions/runs/38641938789) Source Job `116119360131` 真非特权PG16 **88测试／85通过／3失败**，HTTPS Job `116119359691` **9/9通过**。三个失败全部是新 C01—C03 安全断言，而非旧85场景退化。

- C01（S84）真实JYT当前Match、有签活动Waitlist `881800002` 与真实4A取消后，冻结父自动创建 active Priority `12`，错误码 `UPSTREAM_F05_8_PARENT_AUTO_ISSUER_BYPASSES_SIGNED_WAITLIST_C01`。
- C02（S85）真5B签在途下临时伪造 public cancelled、没有原4A/4C取消签名，触发器在真实PG SAVEPOINT中创建 Priority `8`（之后回滚），错误码 `UPSTREAM_F05_8_PARENT_AUTO_ISSUER_UNSIGNED_PUBLIC_CANCEL_C02`。
- C03（S86）未知合成 `refund_cases.pending` + 伪取消同事务中创建 Priority `9`（之后回滚），错误码 `UPSTREAM_F05_8_PARENT_AUTO_ISSUER_UNKNOWN_FINANCE_CANCEL_C03`。
- **不可解除的授权边界**：A第三轮正式整改单明示若冻结父违反既有候补/资金/签名约束，B必须保留红证交A另签父修复，不得改 `engineering/f05/**`。故未修父、未删除安全测试、未合并main、未签 READY。C03不冒称真实付款或真实4A合法取消已验证；GitHub PR附加检查与新后继文档HEAD不能取代原红证运行头SHA。
- 完整逐项证据归档：[《F06-5C第三轮跨域父自动签发真实PG16红证与A升级交接_2026-10-15.md》](./F06-5C第三轮跨域父自动签发真实PG16红证与A升级交接_2026-10-15.md)。**下一责任人：A（仅审红证与签父级技术修复新范围）；当前B包：BLOCKED_UPSTREAM；F05/F06/V1：NOT_READY。**

---

# 2026-10-15｜F06-5C B第三轮C01—C05补证实施记录（现行优先）

> 权威依据：`07_重建工作区/F06-5C_A主控第三轮复验_R01父触发器技术裁决与候补资金签名补证施工单_2026-10-15.md`；原PR #62、原工作分支不变。状态：**B_C01_C03_PROBES_SUBMITTED / A_TECH_RULING_R01_SCOPED_ACCEPTED / A_CHANGES_REQUESTED_PARENT_AUTO_ISSUER_CROSS_DOMAIN_PROOF / NOT_READY_FOR_A_REVIEW**。以下是施工过程记录，不是最终同SHA独立证明；旧R01待A裁决表述已由A最新正式裁决取代。

## 当前真实改动

- **C01**：Source 新增 S84，选取原F05-3B血缘的另一辆合成批发JYT车辆；两Customer先发原F06-1 pending，然后由原F05-7/8签current Match及Priority，再原F06-1正式Lock/Waitlist、原5B Guard交易和原4A合法Cancel。观察父自动 `source-created`、候补原签名和真实PG Backend/txid，断言有效候补期间绝不出现新active Priority；违反则红证。
- **C02**：在S65既有已签5B交易和原F05-7批发current Match环境、真正合法4A Cancel之前，使用原F03签名Session和同物理PG `SAVEPOINT` 直接伪造 `public.transactions.status=cancelled`；立即采集冻结父触发器实际 Priority+created事件，必回滚，S85精确检验。保留数据库拒绝SQLSTATE，不把父自动签发冒称5C。
- **C03**：S65同物理PG `SAVEPOINT` 增加合成未签 `refund_cases.pending` 后伪取消，观察父自动发行行为并回滚；S86验证。它是**未知财务+伪取消的组合负例**，不是“真实4A/4C合法取消时附带有签退款已测”；若该额外组合不可合法构造，记录真实PG错误并保留阻断。
- **C04**：新增 S84—S86 至《有效业务用例矩阵.tsv》，保留原85项，不删除减弱；本批源码名义合计88个Source、9个HTTPS。此前37个独立业务项只是B自核，新增3项在真PG通过及去重前**不计为已验有效案例**。
- **源码静态审计**：`engineering/f05/priority-arbitration-ttl-handover/000024_priority_ci.sql` 的原 `f05_8_reconcile_scope_ci` 只按当前Match资格、Lock/Transaction状态决定新发行，未显式查询 `waitlists`、`refund_cases`、`f06_5b_ci.guard_events`、`f06_4a_ci.cancel_origins` 或 `f06_4c_ci.cancel_origins`。确认的是**父源码跨域校验缺失**；真实危害、PG拒绝或事件抢发以最终日志为准。
- **约束**：未修改F05冻结父SQL/原F06父Service、正式迁移、PDM、资金或生产代码。未合并main。父源码确有越界时只能出红证，须由A签独立父修复单。

## 本轮尚待完成的严格门禁

新末次SHA官方同头 `event=push` **22/22 success、96/96真PG16 Jobs（H52 52/52）、Source88/88、HTTPS9/9**、190旧父双真实物理OID全行COUNT+MD5、原24迁移/Catalog/D1/Sidecar，及≥32有效官方sha256 Artifact，均必须重新核实；任何未实际完成或失败不能套用旧 `a54f4628...` 证明。C01—C03如果任何测试报红，**不得填 `READY_FOR_A_REVIEW`**，应标 `BLOCKED_UPSTREAM_PARENT_AUTO_ISSUER` 并提供原生日志。额外旧PR工作流和required状态继续单列，不混称22 Push全部PR绿灯。

---

# 名邦汽车 V1｜F06-5C B 工程第二轮整改及正式A交接门禁报告

> 日期：2026-10-15（新加坡时间）。唯一正式施工依据：`07_重建工作区/F06-5C_A主控PR62第二轮独立复验_真实签发竞态与跨负责人终态整改施工单_2026-10-15.md`（R01—R05）。
>
> B工作分支：`feat/f06-5c-transaction-priority-admission-ci`；正式[PR #62](https://github.com/suzhe868-arch/mb/pull/62)；严格仅 `engineering/f06/transaction-priority-admission-ci/**` 与 `.github/workflows/f06-5c-*.yml` 可变。**当前并非最终A验收交接，状态 `B_REMEDIATION_IN_PROGRESS`，禁止签 `READY_FOR_A_REVIEW`，除非最终HEAD原生证明全部闭环。**

## 一、已实际推送的B二轮整改

1. 已修正 `signed-transaction-state.mjs`：原4A、4C取消与4B投影在同PG事务内**依次执行**，避免单物理Client上的并发查询弃用；父签名和Vehicle行锁均不变。
2. 已加强 S39/S42/S57/S65：不同后台在途交易必须返回精确 `F06_5C_TRANSACTION_OCCUPIED_OR_UNSUPPORTED_STATUS`，S57 名邦车真取消后无current Match只能精准拒绝，不能用「并非旧错误码」伪装正向发行；S65已提交真正5B COMMIT后独立5C精确交易排他，明确将原先`ACTIVE_LOCK`争用称为真实Lock门禁。
3. 新增 S67—S83：真实F06-1签Lock→安全5B Transaction→原4B Manager真实权限/Scope原子移交→原4C新负责人真实权限/Scope取消→5C旧3B/5B/4B/4C只读终态验签；另覆盖旧负责人越权、个人deny、Scope撤销、投影漂移、伪取消、重入、双车行锁独立并发。
4. 测试数量从历史68增加至**85个源码用例**，并同步修改本包ci-job真实断言 `# tests 85`；85是用例总数，不能直接等价于36条有效业务证据。父源码、冻结Workflow、24正式迁移、生产权限一律未改。

## 二、R01合法取消后5C正向再签发：仍有已确认的父触发器边界

- S52已经真实证明在无Transaction、Lock和Waitlist阻断且Match/资格合法的环境中，原5C在Vehicle锁和单F03会话内调用冻结F05-8发行器，得到 `F06_5C_PARENT_SIGNED_PRIORITY_CREATED`。
- S65的真正批发车真Lock→5B在途→4A原生Cancel后，由**冻结F05-8交易状态变化触发器**在4A COMMIT上自动新发唯一Priority。原生`creation_key=source-create:...`、`created.event_key=source-created:...`。S65随后两个5C独立Backend只能各得到 `F06_5C_EXISTING_ACTIVE_PRIORITY`。
- 不许关闭或替换父触发器，也不得手工直接INSERT父Priority。故**在这条真实已签合格Match取消路径上，5C先于父触发器重签成功暂缺可复现实证**；这个行为属于A第二轮R01明示应提交原生来源与不可达性分析、交A裁定的技术边界，**不能把冻结父自动发行冒称5C发行**。若A坚持本路径必须5C二次创建，则与当前冻结父原子触发逻辑冲突，需要A裁决，不得B擅改父产品或触发器。

## 三、R02/R03/R04实证索引

- **交易占用原子性**：S39/S42已改为精确签名交易拒绝；S65原5B并发日志须区分`ACTIVE_LOCK`与新增真实COMMIT后5C交易签名拒绝；S83明确在一车Vehicle FOR UPDATE持锁时，另一车独立Backend仍应得到本车`EXISTING_ACTIVE_PRIORITY`，而不是另一车的锁争用。
- **跨负责人父原生链**：S67—S82只调用冻结父F06-1、5B、4B、4C，测试本包内无父业务造假INSERT。新4B/4C真Issuer、请求Key、事件、签名校验、原资金零付款不可代替父服务。
- **有效业务矩阵**：本目录`有效业务用例矩阵.tsv`记录**43条待核对的独立业务断言候选**，逐条包含业务初态、真正签发父Service、PG操作、精确码/业务事实、行证据、后端事务与同HEAD官方CI的核对位置。**只能在最终SHA本域真实PG16的每项通过、并由A排除重复后，才可认定有效≥36，不能把环境、参数、伪Token算入。**

## 四、R05：正式终验尚不能冒称完成

| 最终核对项 | A要求 | 当前可确认情况 |
| --- | --- | --- |
| PR HEAD | 唯一最后B提交、CI同SHA | 待以本文件及矩阵最终提交后的实际HEAD为唯一基线 |
| 真正 `event=push` | 全部22条成功 | 新增源码时不断重触发，终验尚待原生核对 |
| 非特权真PG16 | 总96 Job，包括H52 52/52 | 未形成最终HEAD官方全部成功证据 |
| F06-5C Source / HTTPS | 新Source85源码断言全部、HTTPS9/9 | 真实Source Job未完成不可写PASS |
| 真实业务例 | ≥36条实质状态/权限/并发/资金 | 43条案例候选；须以原生日志逐项核证 |
| 190旧父表和原24签名 | 双真实PG物理OID、全表COUNT/MD5、Catalog/D1/父Sidecar | 必须复查最终SHA完整独立审计 |
| 官方Artifact | ≥32份本HEAD非空/有效sha256 | 待官方Jobs/Artifacts重新核对 |
| PR附加旧检查 | 真实失败单独分类、required待A核对 | 历史6条冻结旧PR事件失败不得掩盖；主线protected=false不等于全required可判定 |

### 历史实测与本轮截然分开

A在旧SHA `7936b4f1dcce6897dc1317200653a4ed6ae1a877` 核验过22/22真正Push、H52 52/52、Source68/68、HTTPS9/9、190旧表双OID封印；**A仍正式拒收其业务真实性**。旧额外PR事件历史10条共4成功6失败，主要为冻结F05原分支Push签发/Actions API审计403/Docker限流；以上都不是本次代码或最终HEAD的已通过证明。历史旧B报告 `f3bea8c9...`同样禁止套用。

## 五、最终交接原则

正式只有当新SHA同SHA全部真实成功、上述R01技术边界由A准许的路径可复现、R02/R03真实业务用例及矩阵经自审通过、全部原生Artifact封印可靠、PR失败按真实边界说明后，B才可评论 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。当前无任何生产Issuer、真正资金/退款、`refunded`、`completed`、UAT、F07/F08或main合并放行；F05/F06/V1继续`NOT_READY`。
 
## 六、2026-10-15 GitHub 官方原生逐项核验增补（证据基线 89ba785a7033a72356f8762b80d2b73c98954dc2）

**审计说明：** 以下实测均绑定真实 `head_sha=89ba785a7033a72356f8762b80d2b73c98954dc2`，是代码与本报告增补前的官方成功基线；提交本增补文档将产生新的 HEAD，**新 HEAD 的 Push/Jobs/工件必须再次独立核对**。不得拿此旧基线冒称新 HEAD 全绿。

- 真 `event=push` 22/22 completed/success，Run IDs：38630180369、38630180352、38630180339、38630180362、38630180376、38630180287、38630180324、38630180392、38630180333、38630180319、38630180342、38630180353、38630180433、38630180304、38630180328、38630180281、38630180373、38630180393、38630180346、38630180422、38630180283、38630180365。
- 使用官方 `/actions/runs/{run}/jobs?per_page=100` 对所有22条Run取得 **96/96 Job success**；H52 Run [38630180365](https://github.com/suzhe868-arch/mb/actions/runs/38630180365) 原生 **52/52 Job success**。
- 官方 Artifact API逐条验证 **96/96** 个本 SHA Artifact，均 `size_in_bytes>0`、`expired=false`、`digest` 为 `sha256:`、关联 `workflow_run.head_sha=89ba785a7033a72356f8762b80d2b73c98954dc2`。此为官方摘要及元数据验证，**未**逐一下载 ZIP 复算字节哈希。
- 本包 [Source/HTTPS Run 38630180339](https://github.com/suzhe868-arch/mb/actions/runs/38630180339)，真实 Source Job **116079505090**：`# tests 85 / # pass 85 / # fail 0`；HTTPS Job也为成功，原生 **9/9**。
- 原生日志：`F06_5C_TWO_PHYSICAL_PG_DATABASES_PARENT_190_TABLES_SEAL_PASS`；Scenario PG真实OID **68461** 销毁重建，独立Audit OID **73484**，beforePID1423、afterPID1631；原 **190** 父表全行COUNT/MD5、24迁移Ledger/Catalog/D1/所有父签名不漂移；`tableDigest=9c5e69dd7d74c1c2ce2dec265971012f7b63eb4ee3cb1dec47c998f486458cb7`，`original24Ledger=b9beed2d9e5fda2511bef6cbcd6d050862971714b9464624dc6439888c118033`，`parentSignatures=d240ea48f1b889a86c96bc8bbd1d03b62be2f2885ea8870d7b697273a9477e63`。
- R02两段**如实区分**：并发原Lock→5B赢/5C输（5B PID1563 txid17631；5C PID1562 txid17630）输方是 `F06_5C_ACTIVE_LOCK_PREVENTS_NEW_PRIORITY`，只证 Lock 门禁；**5B COMMIT之后**独立5C PID1524 txid17632 命中真正签名交易占用 `F06_5C_TRANSACTION_OCCUPIED_OR_UNSUPPORTED_STATUS`；不能混称。S83车A PID1593 txid17685持Vehicle锁时，车B PID1594 txid17686仍独立处理，不误报对方车冲突。
- R03真实来源链：原4B `handoffEventId=1` 将负责者1移交给4，原4C `cancelEventId=1` 原子Cancel，5C读到 `F06_5C_ALL_SIGNED_TRANSACTIONS_TERMINAL`；S68—S82独立权限、Scope、个人deny、已签Cancel不可变、伪造public Cancel失败与重入阻断均原生通过。
- R04审计：Source85总量不是85个有效业务。矩阵43个业务证明候选均有对应原生PASS；保守剔除签名证据/前置条件重叠的6项 **S40/S51/S53/S60/S67/S77**，剩余 **37个B自审独立业务正反场景**（非环境、无效整数、伪Token），仍以A独立复核为准。
- **R01需要A技术裁定、B不得改冻结父触发器**：S52在无Transaction合法资格下5C能取得 `F06_5C_PARENT_SIGNED_PRIORITY_CREATED`；S65原Priority7→原Lock→5B真实交易4→4A合法取消COMMIT时**冻结F05-8源触发器先新签Priority8**，来源为 `source-created:a9a10ced-5e7b-44fa-97fc-b9642a0bfd7e`，然后两个独立5C请求 txid17635/17636均严格 `F06_5C_EXISTING_ACTIVE_PRIORITY`。不存在“5C在4A COMMIT后再次签第2笔”可达窗口；关闭源触发器/伪造入库均越权。**A应裁定以「父触发器原子先签+5C幂等拒绝」作为冻结实现边界，还是另行正式放行父设计调整**。此项不能由B擅自宣布通过。

### PR额外冻结工作流逐Run真实失败分类（不同于22个Push）

| PR Run | 冻结父工作流 | 原生日志明确原因 |
| --- | --- | --- |
| 38630189408 | F05-10-D1 | Source `D1_NOT_NEW_OFFICIAL_PUSH`；HTTPS 初始化拉取 `public.ecr.aws/.../postgres:16-alpine` 遇 `toomanyrequests: Data limit exceeded` |
| 38630189296 | F05-10 | Source `F05_10_NOT_NEW_OFFICIAL_PUSH`，HTTPS success |
| 38630189348 | F05-7 | Source `F05_7_GITHUB_ACTIONS_API_403_/actions/runs/38630189348/jobs?per_page=100`，HTTPS success |
| 38630189467 | F05-9 | Source 初始化拉取同镜像 ECR `toomanyrequests`，HTTPS success |
| 38630189377 | F05-9 | Source `F05_9_NOT_IN_OFFICIAL_NEW_PUSH`，HTTPS success |

额外 `pull_request` 截至本轮核验 **4 success / 5 failure / 1 in_progress**（F05-8 Run38630189308）；不得称所有PR检查全绿。旧父工作流冻结且不在本包可修改白名单；是否required的连接器权限边界须由A判定。

**增补之后状态：** `B_R01_PARENT_TRIGGER_TECH_RULING_REQUIRED / A_DECISION_PENDING / PR62_NOT_MERGED / PRODUCTION_NOT_AUTHORIZED`。当最终文档 SHA 官方Push全绿且A可接收R01技术边界时，再标记 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。
