# 名邦汽车 V1｜F05-8 第三轮 A 整改单 R08/R09：B 工程定向整改与真实PG16交接（2026-10-12）

> **唯一正式来源**：main 的《F05-8_A主控三轮独立验收68项PG16通过但Priority交接源责任与对象Scope失配整改单_2026-10-12.md》、PDM-13 Final §§24/25/26/31、PR #47 A 复审意见。本文为 B 已完成的 R08/R09 整改**追溯报告**；最后交审的唯一HEAD及其八组官方 Push CI/四份Artifact，必须以 PR #47 最后正式 B 交审评论中的 GitHub 原生回执为准，不把本文生成前的临时SHA当成最终SHA。

## 本轮权限和责任修复

- **R08｜由真实 Demand 和 Customer 当前责任签发链决定接任**：`retryHandoverCI` 只消费已在隔离数据库中实际存在、Demand 当前 `responsible_employee_id` 与 Customer 当前 `current_owner_employee_id` 同为目标、且有新的 current F05-7 Match Result 的合法责任转移事实；严禁靠 target 参数直接更改 Priority 负责人。一次成功同时更新 Priority 的 `responsible_employee_id` / `source_match_result_id` / `source_signature` 与已有已签 Match 对齐，原始 `original_responsible_employee_id` 和固定 `expires_at` 不变，不写 Demand/Customer/旧签结果。只给客户保留 pending Batch 期间的原租期独占，暂不向任何目标员工授予处理权；完成后显式 `arb()` 和源变更仲裁均复核当前同源事实，避免错误回绑原员工。
- **R09｜严格以此次业务对象范围而不是任意团队权限接任**：`f05_8_responsible_object_scope_ci` 结合 Priority 的 trigger Demand、关联 Customer、原负责人创建时 Team/Store、目标员工当前实际 Team/Store、个人 allow/deny、能力绑定、数据 Scope 有效期和员工在职状态，要求针对本对象存在合法同团队目标范围。仅在其他团队具有 `matching.rule.manage.ci.synthetic` 不足以接管，不得利用 4S 或别家门店权限越界。
- **可见性与生命周期防回归**：员工 `employeeWorkVisible` 必须通过 source-valid、非 pending Batch 与 completed object-scope Guard；pending 只保留客户独占不扩大员工可见。已过期/交易或锁车占用不得完成交接；已结束历史不能复活；已签的R01～R07、旧64个独立Job和旧F05-7 28/7、Priority旧34/10测试保留原样。
- **正式来源限制**：本轮有效“上游转移”和匹配重新签发的正例由真实隔离PG16中的 CI-synthetic source fixture 构造，并以冻结PDM12纯确定性算法生成真实物理当前结果；此处不代表系统已拥有生产级F03 Owner/Handover签发Issuer。没有可核验的实际生产Issuer时继续 `SOURCE_GAP` / fail-closed，**禁止以绿灯冒充生产资格**。

## 新增与调整的真实PG16回归覆盖

1. R07 已有同租期正式 Handover Batch：`injectFail` 的故障、合法 Scope 但 Demand/Customer 没有转移时再次请求，均只能写失败 Attempt，Priority 控制权不得转移。保留 immutable Attempt 历史、原 Batch 与原 TTL。
2. 为另一个已占有本次业务对象的 target 建立真实不同 Team 的 active Employee、个人权限 allow、Team membership 和绑定 Scope，即使其“任意地方有权限”的旧布尔函数返回 true，也因目标 ObjectScope 拒绝；0个完成账，不更改 Priority 负责人。
3. 同一 Customer 的签名 Demand current responsible 与 Customer current owner 合法切换到实际本 Team target 后，通过真实 PG16 重新生成有当期证据的 F05-7 Match；retry 才能完成，且 Priority、Demand、Customer、来源Match和对象Scope一致，原负责人历史保留，TTL毫秒值不变，后续显式仲裁不反向回绑。
4. 真实两 PostgreSQL Backend 锁序/55P03 与 v24 注错回滚、Catalog seal、老账不可变、全部历史回归持续保留。若 Scope 在并发期间撤销，必须按现有同数据库行锁/事务Guard fail-closed，A 应独立反向验证。

## 整改代码临时SHA的原生工程证据（非本文最终提交SHA）

- **代码整改SHA**：`30b18b9935a88980fd0c2e1a2367aeba5a36bf71`，相对上一轮 B SHA `8b46d25be418160bee08dffa878c425485f88ffa` 仅修改原 F05-8 目录下 SQL、`service.mjs` 和 `tests/source.test.mjs` 三项；没有修改旧签生产F03/F04/F05-1～7、历史迁移、旧冻结工作流、PDM Final 或 main。
- 八个 GitHub 原生 Push Run：旧 H52 `38220980541` 52/52，I2 `38220980450`、J2 `38220980545`、K2 `38220980457`、F05-4 `38220980453`、F05-5 `38220980525`、F05-6 `38220980462` 各2/2，新 F05-8 `38220984808` 4/4；合计 **68/68 真非超级用户PG16 success，0 skipped/failed**，官方审计 `F05_8_OFFICIAL_GITHUB_64_FROZEN_PLUS_2_COMPAT_PLUS_2_NEW` 核实全部 `head_sha` 相同，不能跨SHA拼旧运行。
- 本批 Priority Source `34/34`、HTTPS `10/10`、旧 F05-7 Source `28/28` 与 HTTPS `7/7` 全部原生通过。SQL checksum `e4b0d03c8c5e23db2b52185d1a221c9b153d7669730cdb2bab699524fd40e609`、Catalog SHA `d60ef2d3f5e929c62d389ec7dd7bb1c44efdcd5a3a19e077d54963c4849c978c`、旧签 Ledger `c5625475ee0f4b6c3007c0e1d5070c465626e63bbd3733095f753452e1bbc84c`。
- 原生双 Backend 竞争 PID 255/270，`SQLSTATE55P03`；交接锁独立 Backend PID 278、未延长TTL、同一Priority ID，原生审计日志已确认。
- 四份与该**代码整改 SHA**一致的 GitHub 官方 Artifact 均非空且 `expired=false`：Priority Source `11734910184`（119606B）、Priority HTTPS `11734332476`（112846B）、兼容Source `11733654958`（109013B）、兼容HTTPS `11734247564`（99438B），均具官方 SHA256 digest。

**交审严格门禁**：本中文交接文档提交将产生另一个 HEAD，需再次取得与**文档最终 HEAD**同 SHA 的八个官方 Push Run 合计68/68 success、四份同 SHA 原生 Artifact，最后在 PR #47 提交真实最终Run/Artifact ID 与 SHA、实际日志和 `READY_FOR_A_RE_RE_RE_REVIEW / NEXT_OWNER=A`。未经该验证仍由 B 负责，不得合并main或开展F05-9/F06。F05、C/H01、整车V1 `NOT_READY`。

---

# 以下为前轮历史记录，不代表最新工程提交状态

# F05-8｜B 三轮 R05～R07 定向整改工程记录（2026-10-12）

**Authority**：A最新main中《F05-8_A主控二轮独立验收68项真PG16通过但恢复仲裁与责任交接未闭环整改单_2026-10-12.md》，PDM-13 Final §§3/14/21～31，PR47 A正式意见6118562876。**范围**仅本F05-8新增v24 CI SQL、service、tests、中文交接；旧签F05-7 v23服务/SQL、64历史冻结CI、生产路径、main绝不修改。

### 已实现的定向行为

- **R05 可信affected-scope恢复**：Demand变化不再只查询当前触发Demand持有的active Priority，另外检索此Demand的当前 high/acceptable signed Match；Vehicle变化同样从该车辆已签current Result收集受影响cycle；Customer owner状态变化、非触发Demand变化可以无旧Priority触发同事务合法仲裁。保持状态变更后从旧F05-7原生触发器已经标为stale的结果**绝不再用于创建**。测试包括从无active的合法current Match恢复、非trigger Demand、车辆范围及真实offline→active旧结果已stale的拒绝；没有把旧v23不变性限制伪称新Issuer。
- **R06 Lock/Transaction占用解除后自动重仲裁**：增强原生占用触发器，Lock取消/到期变化与Transaction退出时将本车辆/周期的scope串行化，检查真实占用及**此时current的合法Match**，有新机会创建**新Priority ID/新固定TTL**，没有则不创建。保持原有先锁车辆再锁Priority，重复退出幂等，已经结束Priority绝不复活。真实F05-7 Lock变更会令该车当时current Match变stale；因此Lock取消后无新签结果时真实拒绝重获，不会伪造正例。Transaction不触发F05-7该项签名撤销，有效签名在交易退出时可合法恢复。
- **R07 非法responsible即时保护+正式Batch**：原生 source COMMIT在纯Employee/Permission/Scope失效但Customer/Demand/current Match/Cycle/Level仍具资格时，自动`INSERT ... ON CONFLICT DO NOTHING`真实Handover Batch，记录不可变Audit，并**保留同一Priority和完全不变的TTL**，无效员工由既有session/current Scope门禁立即拒绝；若其它Guard不合法或TTL到期，严格结束并允许合法继任。修复`retryHandoverCI`锁序为Vehicle→Priority→Handover，对接任者再次检查真实Active+Permission+Scope及基础来源合法，记录失败与完成两条独立immutable Attempt，成功只更换同一Priority责任人且不延期；今后当前source守卫变更或过期仍会结束，单纯原Employee恢复不可反向抢回已交接租期。

### 安全及测试边界

- R05 恢复 positive 只代表**原F05-7真正current Match未被撤销**的情形。签名F05-7在Demand state、Vehicle真实可售状态、Lock任何变化时会主动标stale（原M94-v23规则）；即使本批正确遍历affected scopes，也不得用那些旧stale数据新建Priority。禁止修改已签v23来“让A要求的恢复业务正例绿灯”，真实新匹配必须通过后续合法签发，再触发当前v24的Match Result源事件。
- 所有新增Employee、Scope、Handover、Match/Transaction测试事实只在每次GitHub Actions全新**可抛弃非特权PG16**；不接微信、JYT、真实资金、客户、手机号、生产权限Issuer。失败注入、双真实Backend争锁和v24迁移/目录封印仍须复验。
- **最终交审门禁**：当前尚无 R05～R07 代码最终SHA原生68/68与4附件。完成开发/测试后按GitHub八个指定Push workflow同最后SHA统计64旧冻结+4新=68/68，Priority Source旧27条与HTTPS10条不能删弱，旧F05-7 Source28/HTTPS7原样验证，取得4份新Artifact并在PR47最后中文评论写实际SHA、run IDs、digest、PID/SQLSTATE、整改覆盖、`READY_FOR_A_RE_RE_REVIEW / NEXT_OWNER=A`，才允许报告“B完成”。B永不自行合并main。

---


# F05-8｜2026-10-12 R01～R04 整改完整中文交接增补

> 当前为 A 首轮驳回后的 B 第二轮交付材料；截至增补前代码 HEAD 为 ca5d4b54e40aee65e6a20d6110cc611e45e431b2，8组官方 Push 工作流合计 68/68 成功。本文档与新增补强测试一并提交将产生新 SHA，新 SHA 必须单独重跑全套68项与四份原生附件后，才可在 PR #47 最后一条 B 交审评论宣告 READY_FOR_A_RE_REVIEW / NEXT_OWNER=A。旧成功与旧Artifact不能跨 SHA 拼算。产品 F05/C-H01/V1 继续 NOT_READY。所有以下工作仅限可抛弃的CI PostgreSQL16，不开放生产Issuer/API，不写真实用户与资金。

## 一、依据、范围及 R01～R04 对应整改

Authority：A 在 PR #47 2026-10-12 的四项工程整改单、冻结 PDM-13/14、F05-8 正式施工单。只修改本批新增 engineering/f05/priority-arbitration-ttl-handover/ 范围内的 v24 CI SQL、service、源测试及本交接；未更改旧签F03/F04/F05-1～7、旧迁移、旧冻结Job正文、PDM Final、main。

- R01：新增 f05_8_suppressed_facts_ci，将同一Customer×Vehicle×listing cycle现有多个Demand来源签名全部固化为不可变抑制旧事实，不能释放一个Demand后靠另一个旧Demand直接重获；合法新来源签名和新周期没有被永久封堵。测试包括“8-R01 Customer two Demand suppression holds all old signed facts”，另增真实PG16内车辆事实版本改变后，复用旧F05-7未修改的纯确定性规则分级/签名公式、据物理原始行生成新签名Match并恢复权益的CI正例。特别说明：已签F05-7完整服务故意对v24 Catalog拒绝（fail-closed），本例是隔离CI原物理表写入与签名重算，不是调用旧v23服务或证明生产新Match签发链。
- R02：新增CI-only PG16本域 source-change 和 affected-scope 重评触发，覆盖签名Match状态、Demand、Customer、Vehicle、listing cycle、Employee、find entitlement、个人permission、有效数据scope、Team/Store相关状态。事务中 Vehicle→Priority 的受控锁序保持现有有效候选更换trigger而TTL不延期，或立即结束原active并择合法继任。新增Demand停用、Scope撤权及客户停用不调用人工arb直接查真实事务COMMIT后状态的测试。锁车原因准确区分本人 converted_to_lock、他人 lock_takeover；交易仍保留旧签名审计。
- R03：在真实Recommendation与vehicle_visibility_grants未撤销事实存在时，客户是否现在有权看车取决于Customer当前active、当前Level找车权益、Vehicle真实可售/未归档、当前cycle、有效Lock/Transaction、其他Customer Priority的合法排他。实测Grant正例、Customer disabled/重新active、find OFF/ON、cycle结束为false，历史Grant/推荐不物理删除。
- R04：新增仅CI的processDuePrioritiesCI到期事件工作入口，不依赖外部再发起arb；到期优先以ttl_expired结束、保留审计、对同cycle旧事实建抑制并重评继任；二次到期幂等，正在进行的交接不冻结TTL，已结束Priority不能因重试交接复活。不部署生产时钟任务。

## 二、GitHub真实性与结构证据（增补前已成功代码提交）

本轮新增代码完成时已正式验证 GitHub SHA ca5d4b54e40aee65e6a20d6110cc611e45e431b2 的八个原生 Push 工作流，全为completed/success、68/68 Jobs、0失败/跳过/待处理。原生运行：
- 冻结H52 run 38205466938（52/52，attempt2）
- 冻结I2 run 38205466866、J2 38205466890、K2 38205466796、F05-4 38205467050、F05-5 38205466837，各2/2（attempt1）
- 冻结F05-6 run 38205466813（2/2，attempt2）
- 本批F05-8 run 38205467120（4/4，attempt2）
历史总计64、本批4，旧F05-7真实Source 28/28、HTTPS7/7，Priority Source 25/25原生成功、Priority HTTPS成功，全部使用实际PostgreSQL16而非mock。旧公共镜像仓库曾返回toomanyrequests导致首次失败，保持旧作业原文，用GitHub官方同SHA仅重跑失败Job解决。

本批 v24真实注错回滚日志含 F05_8_V24_REAL_PG16_INJECTION_ROLLBACK_PASS，verified=true；v24 SQL checksum 0460ac0ea9e26cb70a54b80a32aec82e5b57882601e36eed2a8631b6742eda3a；旧ledger SHA c5625475ee0f4b6c3007c0e1d5070c465626e63bbd3733095f753452e1bbc84c；完整catalog SHA 3000b7221b5ace27aff2bde39c59310612c523ed0b591550acfa70d9258d3564。真实双PG backend PID 255/263，争抢结果SQLSTATE 55P03，有真实Source job原生日志支持。

增补前唯一代码SHA的四份官方原生Artifact（均非空、expired=false、head_sha一致）：
- f05-8-compat-source-native-evidence：11727136944，109021 字节
- f05-8-compat-https-native-evidence：11727416597，99433 字节
- f05-8-priority-source-native-evidence：11727202313，110067 字节
- f05-8-priority-https-native-evidence：11727391137，104316 字节

本次又补强真实新签名回获资格与客户即时停用用例；**上面的记录只能代表增补前代码版本，不冒充本次文档+测试提交后的最终 SHA**。最终8条Push运行号、四个最新有效Artifact/哈希、真实源测试新总数以及PR最终HEAD，应以最新GitHub运行及同HEAD最后B交审评论为准，不能在本tracked文件内自引用该文件自己的提交SHA反复改动。

## 三、审查注意及责任转移门槛

A须独立再核旧迁移与冻结CI严格只读、同SHA成功68/68+四原生附件、每项PDM边界、源变更同步失效、Grant可见性、TTL自动结束与真实锁并发证据；PR #47额外pull_request事件上的旧F05-7分支专属审计已由A判为非本批8条指定Push门禁，不能删除旧工作流掩盖；相关旧PR事件失败应在最终交接明示。

当前main在本批B施工中已有其他正式状态提交；B不得擅自强推、合并或迁移旧冻结签名，由A在独立复验后处理合并兼容与正式状态。没有最后最终SHA门禁前状态为 B_IN_PROGRESS / NEXT_OWNER=B；门禁满足并提交最终PR交审报告之后才可标记 B_SELF_TESTED / READY_FOR_A_RE_REVIEW / NEXT_OWNER=A。

---

# 以下为首次交付历史交接原文，留档不代表当前提交最新状态

# F05-8｜B全包自验与A独立复验交接（CI-only）

> **性质：** B正式交接文档；仅限F05-8可抛弃非超级用户PostgreSQL16，不是生产资格、版本发布、真实Issuer或A验收结论。
> **当前工程已真实自验通过的代码SHA：** `3bc027dd7a01e17127a7a83c006b5fbe66a5d247`（8/8官方同SHA Push Workflow、68/68真实独立PG16作业PASS）。本交接文件为后补的**纯文档提交**，故交A的最终PR HEAD可能不同。**必须以最后PR HEAD对应的官方Actions八份Push运行再次全部成功且具四份Artifact才可正式宣告`READY_FOR_A_REVIEW`，实时回执以PR #47 B最后一条交审评论及GitHub API为准；不得把下述上轮成功拼为新SHA。**
> **PR：** https://github.com/suzhe868-arch/mb/pull/47；B不得合并main。产品基线`F05/C-H01/V1 NOT_READY`，真实账号、用户资金、微信/JYT/电话、发布生产接口继续`SOURCE_GAP`。

## 1. 正式Authority及工程边界

- A施工单：`07_重建工作区/F05-8_A主控PDM13_Priority资格仲裁TTL排他与责任交接CI隔离完整施工单_2026-10-12.md`；产品：`07_重建工作区/PDM-13_最终完整规则.md`，联动PDM11/12/14/18/19与现行Decision Register。
- 起点main：`59c191a2efccbbb15538bfa5e4234a1e561f99f6`，F05-7正式PR46已A验收合并；工作分支`feat/f05-8-priority-arbitration-ttl-handover`。
- 新增代码仅在`engineering/f05/priority-arbitration-ttl-handover/**`，新增CI仅8份`.github/workflows/f05-8-*.yml`。**main及F03/F04/F05-1～7已签文件、旧迁移、旧业务测试/工作流、PDM及设计没有修改。**
- 七份新增冻结工作流，从各自旧正式版`jobs:\n`至EOF逐字一致，总计 **64** Job（H52+I/J/K/F05-4/5/6各2）；第八份本批真实PG16新工作流 **4** Job（F05-7兼容Source 28 / HTTPS 7、Priority Source 20 / HTTPS），合计 **68**。
- F05-7旧分支专属`ci-verify-workflows.mjs`不能复用其原分支自指跨工作流统计；新`compat-job.sh`仅在Actions运行时产生临时脚本，执行完整原生旧F05-7真实业务测试，替换仅旧分支特有的审计环节为F05-8官方68-job只读审计，旧签源码不改。

## 2. Source Authority / v24 SQL与保护状态

- 来源矩阵：`F05-8_PDM13来源权限矩阵.tsv`；事件时序：`Priority_资格仲裁TTL与事件时序审计.md`。
- `000024_priority_ci.sql`新增真实原生CI约束：独立Customer资格、TTL全局默认86400秒/每条创建冻结、唯一active Priority、签名Match高优先级仲裁、同cycle suppression、不可变ending/history/event、trigger Demand负责人切换与handover失败账；由真实M94到v23签名链滚动到v24，历史原迁移不动。
- 真实旧表/Session保留：Customer/当前Demand.owner与原始created_at、PDM12当前Result tier/来源签名/周期、Vehicle、Lock、Transaction、F03真人工合成员工正常会话及个人deny/scope；无正式Customer端签发Issuer时fail-closed，不将合成控制平面写入生产。Priority不等于Recommendation、客户可见性grant、Lock、价格权、客户Owner。
- F05-8客户本人正式Lock成立结束`converted_to_lock`、其他客户Lock结束`lock_takeover`，真实有交易占用`transaction_started`；结束不得复活，Priority独占只在合法当前状态内，不解锁hidden车及价格。
- `F05_8_V24_REAL_PG16_INJECTION_ROLLBACK_PASS`；`F05_8_V24_VERIFIED`旧签名Ledger+新结构seal，v24 SQL SHA256 `512bb6e076871c6e452a5879edfdafaec1821714405840fe8942f61554187bce`，catalog SHA `c1ef96b0fe131254d176b0aea84f74c15fd125848c01d53946a06079cfc73521`（见原生Job日志、Artifact及校验清单）。

## 3. 本轮真实PG16失败与闭环

- 已修复F03子shell隔离环境变量未继承的确定性缺陷（新工作脚本明确重新导出原F03确认，不解除CI/PG环境门禁）。
- 真实PG16原生Source曾失败三例：`8-A01` v24资格未开通却被测试误写期望已有Priority；`8-A09` 释放前按Demand变化主动重新绑定签名，原测试错误比对更新前签名；`8-A12` 测试引用不存在的第5辆可用车。已在`3bc027dd7a01e17127a7a83c006b5fbe66a5d247`一次性修正为准确的数据库当前签名、四车物理fixture及未授权负例，**保留所有真库正反例、未删测试**。
- 新提交的Source真PG16：**20/20 PASS、0 fail/0 skip**，F05-7源回归**28/28**、HTTPS**7/7**、Priority HTTPS全绿；本批Source原生双后端PID **247/255**，真实锁冲突**SQLSTATE55P03**，完整插桩日志及Source审计证据入原生Artifact。Priority另含交易开始、Lock接管、handover失败重试不可变、Employee个人deny及单独qualification权限deny、公开量排他/hidden不穿透。
- GitHub公共容器镜像仓库曾出现`toomanyrequests: Data limit exceeded / Rate exceeded`，具体Frozen J2 `38199485767` 单失败PG作业官方同SHA重试attempt2成功，Frozen H52 `38199485765` 的h-https attempt1/2遇容器限流，attempt3同SHA重试成功；**旧冻结Job没有任何降级或改写**。
- CI静态语法检查/仅读取GitHub API不能替代独立PG16，本批必须以GitHub实际同SHA运行Job计数及原生证据为准。请A独立核SQL seal、并发真实PID、权限、审计、原有签名链、禁恢复项及CI-only来源边界。

## 4. 上一真实成功代码SHA的官方审计回执（不可跨SHA替代最终验收）

| 运行名称 | 原生Run ID | 最终attempt | 同SHA真实成功Jobs |
| --- | ---: | ---: | ---: |
| H52冻结真实PG16 | 38199485765 | 3 | 52/52 |
| I2冻结PG16 | 38199485812 | 1 | 2/2 |
| J2冻结PG16 | 38199485767 | 2 | 2/2 |
| K2冻结PG16 | 38199485783 | 1 | 2/2 |
| F05-4冻结PG16 | 38199485816 | 1 | 2/2 |
| F05-5冻结PG16 | 38199485775 | 1 | 2/2 |
| F05-6冻结PG16 | 38199485749 | 1 | 2/2 |
| F05-8新增四独立PG16 | 38199485774 | 2 | 4/4 |
| **合计** | **8官方Push Run** | | **68/68 SUCCESS, 0skip** |

上轮同SHA原生四份未过期证据附件：

| 原生Artifact | ID | Size |
| --- | ---: | ---: |
| `f05-8-compat-source-native-evidence` | 11724109005 | 109025 B |
| `f05-8-compat-https-native-evidence` | 11724588875 | 99439 B |
| `f05-8-priority-source-native-evidence` | 11725225299 | 100457 B |
| `f05-8-priority-https-native-evidence` | 11724104005 | 96431 B |

每个Artifact含原生测试、结构/迁移/来源/事件、作业自身`sha256sums.txt`等文件；需A复验非空性、未过期与内容。**此处是上一代码SHA的证据；文档落库后新PR HEAD必须再拿同SHA的八运行、68工作与四Artifacts。** 该最终动态验证结果和时间戳记入[PR #47](https://github.com/suzhe868-arch/mb/pull/47) B交审评论，避免为在Git tracked文档中追加新run ID不断产生SHA并失效门禁。

## 5. 合并/生产禁令与唯一下一步

- B仅限当前指定分支施工、自验、交审；**任何时候不能自行合并main**。待本文件形成的最终B HEAD 68/68官方同SHA再次成功、四原生证据有效，B才可解除Draft、提交`READY_FOR_A_REVIEW / NEXT_OWNER=A`并由A独立验收。
- 未实际具备正式线上Priority资格Issuer、微信Customer身份、JYT电话、数字报价/价格权限、生产资金及独立现场UAT；项目、F05和C-H01仍`NOT_READY`。本轮无生产上线、迁移或外部业务写操作。
