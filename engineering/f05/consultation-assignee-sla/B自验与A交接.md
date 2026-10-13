# F05-10｜B工程A首轮整改单整改与A复验交接（待CI验证）

## A第二轮正式整改｜R02/R03/R04残余合同｜B工作记录（第三轮前，尚未完成）

**真实当前状态：`F05_10_B_THIRD_REWORK_IN_PROGRESS / NEXT_OWNER=B / CI_ONLY / V1_NOT_READY`。** A第二轮明确拒绝将旧HEAD的72/72绿灯等同全PDM15验收，A正式整改单见`07_重建工作区/F05-10_A主控二轮独立验收72项真PG16全绿但公海授权DND并发与跨域全生命周期缺证整改单_2026-10-13.md`。

### 已写入同一F05-10白名单的剩余整改（新提交尚待CI真PG校验）

- **R02真实签名负例：** 使用F03-1现有`admin_test` System Admin账户登录后进行Consultation完整读/正式转派，要求双拒绝；员工目标为inactive=3、four_s=2、异店且无当前对象Scope=8997601及个人DENY后的Employee4，均必须拒绝，历史assignee/deadline/交接记录不变，不能用无效actor形成伪交接。剩余**公海合法归属正例源缺口**见下。
- **R03 DND和计时：** v26新增`f05_10_notification_quiet_ci`和`f05_10_notification_attempts_ci`，均明确标记`CI_SYNTHETIC_PDM23_DND_NOT_PRODUCTION`、`CI_PDM23_NO_EXTERNAL_SEND`；真PG写入DND/quiet，推导`SKIPPED_DND`，比较同一Consultation原deadline/first response/Hold不变，再以CI过期钟验证仍保持四主状态。绝不发送真实飞书/微信通知。
- **R03禁用并发与幂等：** 真两物理PG backend/PID，writer持Customer状态更新锁并COMMIT禁用，同时customer withdraw或员工resume竞争，在提交后均不可越过Hold；账号恢复后仅有权显式resume可以沿用冻结`remaining_ms`。修改v26 Customer Hold触发器从`transaction_timestamp()`改锁后`clock_timestamp()`，防长事务抢锁导致虚增余时；新Hold使用`WITH newly_held UPDATE...RETURNING`后仅对本次真实转为Hold的记录记一次事件，避免disable→active→disable且仍在Hold时重复伪造事件。Hold期间可按当前合格Scope合法终结。
- **R04当前Priority隔离：** 查询v23真实`f05_7_result_versions_ci` current且high/acceptable匹配源，合法建立同车/同cycle v24其他Customer独占事实；受排斥Customer建单必须DENY且Consultation行数不变，Priority结束后才新建独立Consultation。不得把旧Share当独占授权。
- **R04跨业务完整生命周期：** 使用独立当前合法Customer/Vehicle/ListingCycle和真实签名第二Employee会话，实际执行`create→touch→crm_note followup→handover→NORMAL_CLOSED→new create→invalid`，每个阶段校验Recommendation/F05-9 Grant及价权/Priority/Lock/Transaction/Demand/Customer Owner物理count和row hash完全未变，Consultation自己的事件/回执真实新增，客户侧安全投影隔离。

### PDM17公海归属签名来源风险（不擅自发明）

- 实查已签`engineering/f03/runtime-customer-owner-handover/service.mjs`：`prepareCustomerOwnerHandover`的Customer对象必须`owner_assignment_state='assigned'`且原`current_owner_employee_id`匹配合法原责任人；它是**已有Owner→另一个Owner的真实交接**，不是`owner=null`公海直接认领。
- 实查`engineering/f03/runtime-receiving-pool/service.mjs`：SG03仅更新Employee接客资格；文档及返回值明确`ownerAssignmentPendingDomain='DEFER_F04_SG06'`，**不执行顾客Owner指定分配/公海claim**。
- 已有真PG`owner pending/public pool` → Consultation拒绝用例，**缺PDM17正式进入公海后合法claim→Owner成功assigned→Consultation新建成功的已签物理动作来源**。本批不通过直接`UPDATE customers SET current_owner_employee_id`冒充已签认领，也不在F05-10重造PDM17公海状态机。若仓库另有A签过的Issuer，需要A按正式Authority提供准确路径；若确实不存在，状态为`BLOCKED_SOURCE_PDM17_PUBLIC_POOL_OWNER_CLAIM`，由A技术裁决。
- 真实手机号、微信Customer Issuer、飞书电话、PDM23正式外发、JYT、支付及上线始终`SOURCE_GAP`；以上都只是非生产独立CI。

### 第三轮真实终验门禁

不得复用旧受验HEAD `609edea9...`成功的10 Push/72 PG16/8 Artifact冒充本轮。仅最后唯一新B HEAD对应真正10条`event=push`、全新及历史合计72/72 PG16 Job成功、8份同SHA原生非空未过期SHA256 Artifact、新增Source正反例/双PG PID和提交时序、PDM17的真实签名来源裁决闭环，才能将PR49改为`READY_FOR_A_THIRD_INDEPENDENT_REVIEW / NEXT_OWNER=A`；否则仅如实交阻断，不得合并main。


> 状态：`F05_10_B_REWORK_IN_PROGRESS / NEXT_OWNER=B / CI_ONLY / V1_NOT_READY`。这是 B 分支工作记录，不构成已经通过的 A 交审。

## 最新B二轮自审整改补充（仍为CI-only，尚未交审）

- `10-R01` 补实码：突发撤权形成的`assignee_handover_pending`在原销售权限恢复后依然有效，普通销售不得凭曾经负责人身份进行特殊终结/转派。仅当前真正有Manager/StoreHead角色、个人`consultation.ci.manage`权限和冻结Consultation对象Team/Store Scope的管理者，才能合法handover/必要终结。新增**旧负责人关闭拒绝→经理签名Scope权限→正式交接历史收据→Pending原子清除**真PG16物理证据。
- `10-R02` 追加独立真实源Demand/current responsible（4）优先、个人deny使Demand责任回退现时Owner（1）、Owner pending/公海不可凭空造单、跨Store合法管理正例以及旧负责人/4S拒绝。
- `10-R04` 追加真实原M94来源的`four_s`车辆与listing cycle客户咨询正例，4S Employee角色不得获得Consultation内部全文和服务动作，即使合法4S车源；Customer安全投影仍独立。
- 前一轮受验`d1990225...`的新Source业务21/21及HTTPS已真PG16成功，原H52因公共Postgres镜像限流失败的三项经官方失败项重试后已52/52；新Source工作流当时因全局72检查未齐最终失败，不冒充PASS。
- 当前最新代码/测试正在以GitHub官方10 Push复核，**最终HEAD全72/72和八份同SHA非空Artifact仍未核签**，不能设置`READY_FOR_A_SECOND_INDEPENDENT_REVIEW`；正式手机号/微信/真人电话/消息及资金仍`SOURCE_GAP`。

## 授权与范围

- 来源为最新 `main` 的 A 首轮 F05-10 整改单 R01～R04；仅使用 `feat/f05-10-consultation-assignee-sla`，只改 `engineering/f05/consultation-assignee-sla/**` 内新 CI 文件；PR49 保持开放。前批已签 F03/F04/F05-1～9、正式生产/迁移、PDM、`main` 均未更改。
- 已追加工程源码：创建时固化 Consultation 对象 Team/Store origin，当前 Employee employment / personal permission deny / capability Scope / data Scope / membership 物理变化触发新 v26 CI 表的自动 pending Guard及不可变事件；每次合法 Employee 操作再次查询当前实际权限与 Guard。增加独立可核对的合成首次真人服务 evidence 源、actor/type/Consultation 外键及一次性消费约束，拒绝任意格式合法但不存在源事实的 call/message 引用。
- 新增 PostgreSQL16 原生 Source 用例：伪证拒绝、close_normal/invalid 与客户withdraw独立；新版 SLA policy 对新工单生效、旧 source snapshot 不变；Hold 剩余时长及恢复；1秒 timeout 不自动关闭；至少两个 PG backend 对 Employee disabled 触发器提交与旧Mutation竞争；个人 deny /scope撤销与 receiving pool 回退；真实 v25 推荐 direct source、Owner 与 Assignee 不漂移、隐藏车分享不继承；真实 Recommendation、Priority、Grant、价格权、Lock、Transaction、Owner 物理行数/哈希不变；已开单在车辆下架后保持原状态。
- 追加跨Store真实签名合成：独立 Store/Team、员工业务 Scope 与 Owner、真实远端Consultation/接客员工、经理/店长个人明确权限与远端 Store 范围、正式 handover receipt、个人 deny 和 4S 角色拒绝；并对独立员工来源 DELETE / role 变化做额外实时 Guard 保护。
- 增补两个独立PG Backend的 Customer 停用COMMIT对 Employee followup 的真实锁等待/拒绝、账号恢复仍保留Hold、正式显式Resume使用冻结毫秒；scope revoked_at 使用数据库时钟避免语句内时钟偏差而漏判撤权。
- 尚待官方 Actions 核实及可能修复：旧70 Job和新增2 Job 的唯一新HEAD全量成功；本批 Source 新用例无 skip/fail、八份有效同 SHA 原生 Artifact；A R02 的完整 Demand/跨Store Manager/StoreHead/4S/SystemAdmin 矩阵、A R03 双后端客户停用与 DND 正反例，以及 4S 合法车源等仍需逐项实测或列明确阻断。

## 必须保留的 SOURCE_GAP

真实微信/手机号、Customer与Employee生产 Issuer、电话/消息/飞书、JYT 真实电话、生产价格来源与资金、UAT/线上迁移均不在本 CI-only 任务的授权范围内。不能把 CI合成授权、CI服务证据或成功 CI 当成已可上线。未完成全部 A 实证/同SHA CI 之前不得写 `READY_FOR_A_SECOND_INDEPENDENT_REVIEW`。
