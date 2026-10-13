# F05-10｜B工程第三轮整改与A独立验收交接（CI-only）

> **工作状态：`F05_10_B_SELF_TESTED_PREVIOUS_HEAD_CI_OK / THIRD_REVIEW_HANDOFF_WITH_PDM17_SOURCE_GAP / NEXT_OWNER=A_FOR_INDEPENDENT_REVIEW_AND_SOURCE_RULING / V1_NOT_READY`。** 本文档不是A_ACCEPTED、不是PR已合并或生产可用。本报告提交后最终HEAD会变化，必须对**该最终SHA**重新核验10个GitHub event=push工作流72/72真实PG16、至少8份有效同SHA原生Artifact，才可正式在PR49写`READY_FOR_A_THIRD_INDEPENDENT_REVIEW`。B不得自行合并main。

## 1. Authority / 范围 / 分支

- Repo：`suzhe868-arch/mb`；A最新main正式工作单：`07_重建工作区/F05-10_A主控二轮独立验收72项真PG16全绿但公海授权DND并发与跨域全生命周期缺证整改单_2026-10-13.md`；一轮R01～R04正式整改单、原F05-10施工单、PDM-02/03/13/14/15/17/23 Final有效。
- B唯一工作分支`feat/f05-10-consultation-assignee-sla`；PR [#49](https://github.com/suzhe868-arch/mb/pull/49) open。仅改本次CI-only新文件`engineering/f05/consultation-assignee-sla/**`；不碰旧签F03/F04/F05-1～9、生产路由、main/历史迁移、PDM Final。v26新增两张CI-only DND/通知结果表，并在本批可抛弃PG16 v26内修正Customer Hold计时/重复事件，不是生产DDL授权。
- A二轮已确认R01物化的自动Pending Guard、权限撤销后的双PG时序/真实Manager对象scope交接历史，保留不删弱。

## 2. R02–R04整改与原生正反例（必须阅读真实Source/HTTPS日志）

- **R02 — 真签名拒绝与数据范围：** `10-R02 residual signed System Admin...`使用已存在`admin_test` F03 System Admin合法签名会话，Consultation全文和业务交接均拒绝；inactive员工、4S员工、其他Store无当前object scope成员，以及个人显式deny的受让者均不能handover，原assignee/deadline/收据保持不变。此前`10-R02 genuine two-Store...`已有Manager/StoreHead合法显式scope+permission跨店正例、无权Sales/4S负例与immutable receipt；`10-R02 legal active source Demand priority...`已证明真实Demand active responsible优先，撤权后回退现行Customer Owner；`10-R02 owner pending/public pool...`保持fail closed。
- **R03 — 合成签名PDM23 DND/quiet：** 新增`f05_10_notification_quiet_ci`（实际Customer主键、DND布尔与前后时间窗）和`f05_10_notification_attempts_ci`（`SKIPPED_DND`审计事实），完全位于可丢弃CI PG16；Source `10-R03 residual actual CI PDM23 quiet...`验证真实DND时间窗只跳过通知，不回写SLA deadline、original_deadline、first response、Hold，也不因为逾期自动关闭；不发送真实通知、不声称已接通PDM23正式生产服务。
- **R03 — 两物理PG竞争/Clock/幂等：** `10-R03 residual two physical PG backends Customer disable COMMIT vs withdraw...`及`10-R03 residual two PG resume request...`分别在两个真实backend/PID中以未提交的Customer disable与签名withdraw/resume产生等待，再COMMIT确认拒绝越过禁用Hold。账号恢复不自动resume，显式有权限resume只用冻结`remaining_ms`。v26 Customer Hold源触发器在实际获得锁后以`clock_timestamp()`冻结，CTE `UPDATE ... RETURNING`只为真实新进入Hold写一次事件；重复disabled→active→disabled且仍Hold不重放事件；Hold期间合法具scope员工可治理收口。
- **R04 — 真实活跃其他Customer Priority压制/恢复：** `10-R04 residual signed Priority from genuine matching...`直接用当前v23合法high/acceptable Match与v24原Priority域真PG表，创建其他Customer active排他；被排斥Customer不能新建Consultation且行数不变；正式结束Priority后才可以独立create。避免把Share当current-cycle优先权。
- **R04 — Consultation完整生命周期跨域不写入：** `10-R04 residual entire create-touch-followup-handover-close-invalid...`在M94当前Customer/Vehicle/ListingCycle及签名第二Employee上实际执行`create→touch→crm_note followup→handover→NORMAL_CLOSED→new create→INVALID`，每个动作重新查询全部9个独立业务表（Recommendation、VisibilityGrant、F05-9 PriceRight、Priority、Lock、Transaction、Demand、Customer/Owner）`count+md5(row json)`，全程不改写；Consultation内部receipt真实存在且原source immutable。原生旧用例仍验证hidden/Share/4S车源、客户安全投影、失活旧咨询、首次真人Evidence拒伪、政策版本及v26结构/旧签名账。

## 3. 第三轮前一完整提交的已核实CI（不可当作本报告新提交的最后SHA）

- **已全绿可重现基线：`9c82ef1167d4eb4ba62422c551c48e1e14ddb14c`。** GitHub 10个真正`event=push`且同SHA，全部`completed/success`：F05-10新Source/HTTPS `38334683669` 2/2；旧H52 `38334683699` 52/52；旧F05-8 `38334683684` 4/4；F05-9 `38334683643` 2/2；F05-4 `38334683697`、F05-5 `38334683736`、F05-6 `38334683670`、I `38334683680`、J `38334683698`、K `38334683690`各2/2。总72/72独立非超级用户真实PG16作业，无fail/skip/pending；F05-10新Source原生**30/30**（原24+6），HTTPS **7/7**，旧结构/迁移注错rollback、历史Ledger与Catalog Seal均通过。最终文档提交引起Git HEAD变化时须重新完整运行。
- **八份同旧SHA真正Push官方原生Artifact，非空、未过期、均有`digest=sha256:...`**：F05-8 Priority Source `11784552042`/HTTPS `11784472197`；F05-8旧兼容Source `11784986561`/HTTPS `11784626970`；F05-9 Source `11784706803`/HTTPS `11785290792`；F05-10 Source `11784798164`/HTTPS `11785271168`。八份头SHA均等于`9c82ef...`，不得充作下一HEAD证据。
- 新Source logs包含`F05_10_R02_REAL_SIGNED_ADMIN_AND_TARGET_NEGATIVES`、`F05_10_R03_DND_PDM23_REAL_CI_ROW_NO_SLA_PAUSE`、`F05_10_R03_TRUE_TWO_BACKEND_WITHDRAW_HOLD_GOVERNANCE`、`F05_10_R03_TWO_PHYSICAL_BACKEND_RESUME_RACE`、`F05_10_R04_SIGNED_V23_V24_CURRENT_RIVAL_PRIORITY_RELEASE`、`F05_10_R04_FULL_LIFECYCLE_CROSS_DOMAIN_COUNT_AND_HASH`，以及同SHA官方70旧作业门禁通过记录。真源信息仅来自PG16/Actions日志而非模拟通过数字。

## 4. R02公海Owner合法形成正例的已签来源缺口（A须独立技术裁定）

- A二轮要求“PDM-03/PDM-17真实公海`owner=NULL`、合法认领/指定分配Owner后再创建Consultation”的真PG正反例。B已保留真实`owner pending/public pool`安全拒绝，但不能以`UPDATE public.customers SET current_owner_employee_id=...`假装真实业务授权分配成功。
- 已逐一读取现存冻结carrier：`engineering/f03/runtime-receiving-pool/service.mjs`明确仅管Employee接客资格/不分配Customer Owner，输出`ownerAssignmentPendingDomain: DEFER_F04_SG06`；`engineering/f03/runtime-customer-owner-handover/service.mjs`只接受`owner_assignment_state='assigned'`且原Owner为active或符合突然失活治理，实施**已分配Owner→另一个已授权Owner**，不支持`NULL→assigned`真正公海认领。F05-10 `service.mjs`当客户未 assigned 时仅能返回`F05_10_OWNER_ASSIGNMENT_OR_PUBLIC_POOL_REQUIRED`，严格禁止凭请求来源跳过治理。
- 在已签仓库实际`engineering/**/service.mjs`不存在可调用的PDM-17“公海Customer合法认领/指定分配”独立Issuer。**结论：`SOURCE_GAP_PDM17_PUBLIC_POOL_OWNER_CLAIM`；不是可用普通直接SQL或新CI自行复制公海状态机的技术缺陷。**请A核对Authority是否有另外已签真实carrier；没有时依法记录`BLOCKED_SOURCE`、调整该项门禁的签字延期或先正式放行PDM17专项工程。B无权单方面解除该缺口。
- 未覆盖真微信/手机号/Customer签名Issuer、实际电话/飞书/消息通知、JYT生产价/图、资金/交易外发、UAT部署继续`SOURCE_GAP`，不得由72绿灯宣称F05整体、C/H01/V1 READY。

## 5. A第三轮独立验收与签收门禁

1. GitHub最新`main`及PR49最终HEAD核对授权路径和签名源码；本批Source、HTTPS、v26 SQL、CI-only DND两表、历史R01均逐项自审；保留旧70作业。
2. 本次报告提交到分支后，必须以**该最终HEAD**重新得到10组官方`push`、至少72/72完整非特权PG16 Job成功（H52官方`per_page=100`）、8份同SHA有效原生Artifact，最新Source≥30/30、HTTPS7/7、旧账/seal/注错rollback，方可在PR49确认`B_SELF_TESTED / READY_FOR_A_THIRD_INDEPENDENT_REVIEW`。
3. A必须自行复验原生R02/R03/R04业务事实，**特别对上述PDM17物理来源缺口作独立技术裁决**。没有独立认可前`A_ACCEPTED=false`，PR49不能合并，F06/生产不得启动。A可根据门禁正式要求B继续整改，不是由B降低产品规则。

