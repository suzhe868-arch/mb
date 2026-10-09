# F03-2-2L｜B工程完整自验与A主控独立复验交接

> 日期：2026-10-10（亚洲/新加坡）｜工程批次：F03-2-2L｜责任窗口：B｜**B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A（以本报告提交后的最终同SHA 15/15成功CI为生效门禁）**。本报告不能替代A独立验收、PR标准合并或生产批准。

## 一、正式授权、真实基线和改动边界

- A批准的唯一正式施工单：`07_重建工作区/F03-2-2L_A主控SG06_Lock正式锁车负责人单域移交完整施工单_2026-10-10.md`，优先遵守PDM-18 Final（正式Lock/LockRequest/Waitlist）、PDM-03、PDM-02、PDM-19（Deposit、Transaction、Refund资金唯一事实）、PDM-25及三窗口协作规范；未修改任何冻结产品Authority。
- 施工前最新main SHA：`d96d174ddf7cb57f319969644568611f2582fc07`；已正式签字的K批次[PR19](https://github.com/suzhe868-arch/mb/pull/19)合并SHA为`3fdb965733fce0750bc00a4a6b04f12e338fda5e`。指定B分支为`feat/f03-lock-responsible-handover-2l`。
- 仅在本B分支提交；未直接修改main、未自行发起合并、未启动2M，不部署生产、不调用微信、JYT、飞书、真实资金、真实客户或PC生产接口。本批所有业务正反例仅作用于GitHub Actions每个job独立创建的一次性非超级管理员**PostgreSQL 16（简称PG16）**及F03-1合成正式员工会话。
- 旧`000001～000011`的SQL、checksum、物理目录、旧15项之外的现有CI、原权限种子、PDM Final均无修改；唯一新迁移为`000012_lock_responsible_handover_receipts`，只新增一张附不可变触发器的`public.lock_responsible_handover_receipts`表。
- 相对main只修改4份已合并服务文件：`runtime-customer-owner-handover/service.mjs`（H）、`runtime-demand-responsible-handover/service.mjs`（I）、`runtime-consultation-assignee-handover/service.mjs`（J）、`runtime-waitlist-responsible-handover/service.mjs`（K），均限A授权的**commit/retry阶段识别新增L收据表、选择正确完整PG16结构封印与反向请求Key查重**；旧读操作与业务规则、审核、收据、历史、权限不重写。
- 新增独立工作流`.github/workflows/f03-2-2l-lock-responsible-handover.yml`；本批新目录`engineering/f03/runtime-lock-responsible-handover/`包括业务服务、真实迁移执行与封印、合成测试、不可变数据库原始证据和本中文交接文件。

## 二、四项受限职能与资金/锁车不可变业务边界

1. `prepareLockResponsibleHandover`：当前有效PC经理/店长会话与独立合成`lock.responsible.transfer`权限、当前Team/store/customer范围、个人deny，核验SG06真实pending item的精确Lock、源/接替员工、客户、车辆、有效上架周期、原LockRequest、同车唯一活跃Lock以及Deposit/Refund/Transaction关系；仅返回无签名提交令牌的只读预检。暂停接客不等于失去已授管理权。
2. `commitLockResponsibleHandover`：与H/I/J/K共享306/309事务级全局锁及本域314锁，操作时重新核验许可与数据库关系；原子**只更新`locks.responsible_employee_id`一列**，以CAS（比较并交换）防并发覆盖，事务中写真实actor/before/after审计及append-only逐项收据。五个注错阶段完整回滚；不写批次或条目的completed，不允许借移交立即给员工降权/离职。
3. `readLockResponsibleHandoverReceipt`：仅当前仍有合法独立权限、精确审计数据范围的员工可读取最小收据。通过batch/item、Lock当前历史链、真实audit的动作、操作者、时间戳、摘要及连续真实收据核对早期和后继事实；合法二次移交后仍可读前一份历史，旧源员工inactive不抹历史，当前reader被拒绝则立刻不可读；伪造只有FK有效的收据会被拒绝。
4. `retryLockResponsibleHandover`：相同item+同Key+完全相同意图仅返回原真实收据；同Key跨item/batch/Customer/Domain严格拒绝，无第二次修改或审计；失败事务不能永久占用Key。五域H/I/J/K/L的两两**20种有向顺序**均用先真实成功、再同Key拒绝的正反例验证，五个当前会话同Key竞争严格一胜、不同Key五域可同时成功。

**冻结资金及锁车规则**：Lock负责人移交不改Lock状态、有效期、来源申请、价格快照、真实意向金金额/收据、交易、退款、候补、申请审批、Customer owner、Demand/Priority、Consultation/SLA、Recommendation或可见性。旧真实`deposit_receipts`存在不等于可自行断言资金状态；**已过期但有真实Deposit关系与无Deposit关系均分别DEFER_DENY**，不擅自延期、解锁、扣款或退款。现有Refund/Transaction关系的语义不能由本批负责变更，独立保守拒绝；本批不制造任何实际资金交易。

## 三、数据库结构证明、真实原始归档

| 校验量 | 冻结旧K92 | 新L93 |
|---|---:|---:|
| 表 | 92 | 93 |
| 列 | 584 | 596 |
| 约束 | 405 | 420 |
| 索引 | 155 | 159 |
| 全量物理目录项 | 2028 | 2074 |

- 冻结旧K92完整结构SHA256：`6b6932e4855074ed63ec0ceda89b568e1b4b1f62d111c759f9c7a77a841a3c76`；旧2028目录键**零删除、零改写**。
- 新000012 SQL SHA256：`3c6a08c3d2353b02bcafb5ec7d18c0fae05fd8afe06ab1a7a9abd2649d5abc8d`；真实PG16发现的新93表完整结构SHA256：`9ab7221f9a0f5f81c0af37441d4cd5b824e2ac7322f8d40f952ba2cecea0e2f9`；物理目录仅批准新增46项，`000012.manifest.json`保存逐项允许清单。
- **真实首轮L93结构原始SOURCE**：`engineering/f03/runtime-lock-responsible-handover/evidence/SOURCE.md`标明source run `38003282986`、source commit SHA `a24ae5cb792852e3aeb19885d0ac50506c0151c6`、job与artifact原名。原样归档`old-structure.json`、`new-structure.json`、`pg16_schema_only.sql`、`pg16_inventory.json`、`sha256sums.txt`；源SQL原字节SHA256为`3adb4c3b9418905d6209b45d876bbbfd6e9d20a7136dcae276ebcbe0967e7a61`，源inventory SHA256为`fb8f7ff29e969800bab843c26724209306c53c5f11ce13748cd6bac442afef30`。
- 后续同SHA CI必须显示`F03_2L_EVIDENCE_FULL_CATALOG_PASS`和`F03_2L_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`；完整catalog、版本、JSON inventory和源数据不可宽松归一，原始pg_dump仅允许生成的一对`restrict/unrestrict`随机标记做受控配对归一。归档不含真实客户行、凭据或明文口令。
- 真实PG16已确认`--discover`前后旧K92结构不变，故障`--inject`全回滚，L93 apply/verify、回滚至K92、再次恢复L93均通过；已有不可变收据后不得回滚L迁移。

## 四、真实CI和新增测试证据

- 首轮完整全绿：[GitHub Actions #38003282986](https://github.com/suzhe868-arch/mb/actions/runs/38003282986)，run.head_sha=`a24ae5cb792852e3aeb19885d0ac50506c0151c6`，**15/15独立PG16作业success、L18/18、K29/29、J27/27、I27/27**；该次CI自动追加SOURCE原始物理文件，**不是后续最终分支SHA**。
- 补齐历史源inactive下审计、当前读权限撤销、Team capability撤销和真实Refund已关联时保守拒绝后，代码SHA `90f21ca9cf17e3b7b19c470f19f2e029b50f9285`对应[真实CI #38003527269](https://github.com/suzhe868-arch/mb/actions/runs/38003527269)，**completed/success、15/15独立PG16 jobs全绿，新L21/21**；旧K29/29、J27/27、I27/27各在其冻结旧库单独运行成功；并真实打印`F03_2L_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`。
- 上述第二轮验证于交接报告自身落库之前执行；**不得将#38003527269冒充报告提交后的同SHA CI**。最终交A唯一条件：GitHub最新B分支HEAD与随后`15/15 completed/success`的最新CI`run.head_sha`逐字相等、新L21/21、K29/J27/I27、归档原始字节校验继续PASS。
- L真实21项覆盖：只读准备、正式CAS、一列更新、同item幂等/异Key拒绝、本人改密后会话/无权身份拒绝、个人deny与capability/team撤权、已终结锁车、客户停用、下架和周期结束、合法LockRequest源核对、真实意向金/退款事实、到期两类拒绝、暂停接客不影响已有管理权、五个事务故障点、五域20方向Key碰撞、五名员工PC会话同Key一胜/五不同Key可成功、单Lock双会话竞争、连续两次移交收据、旧source inactive历史可读、reader撤权立即拒绝、伪造FK收据拒绝、不可变收据禁止更新删除。
- 另外十四个独立成功的真实旧域作业：旧K92、J91、I90、H89、G/F/E88、D86、C84、B82两个作业、A81、F03-1认证80、HTTPS80。不能以单个L93作业冒充任何旧库独立回归。

## 四-A、A主控复核整改单A-L-01：锁车到期事务竞态（2026-10-10追加完成）

**唯一正式整改依据**：`07_重建工作区/F03-2-2L_A主控独立复核锁车到期事务竞态定向整改单_2026-10-10.md`。A明确结论为`A_CHANGES_REQUESTED`、`NEXT_OWNER=B`；原绿色L21、H/I/J/K旧库成绩保留但不构成到期时序通过，本轮补足真实数据库时间约束后才准交A。

### A-L-01｜实质代码整改和原子性证明

- **首道数据库时钟CAS**：`facts()`的初始时限校验也改读`SELECT clock_timestamp()`（不用Node `new Date()`模拟“当前有效”）。`transfer()`真正的PG16写入CAS添加`AND expires_at > clock_timestamp()`，锁车行`FOR UPDATE`只能阻止其他事务修改当前行，不能阻止真实时钟跨期。CAS零行时独立读取当前PG16时钟，若确实过期，则按照已存在Deposit关系分别返回`L03_EXPIRED_WITH_DEPOSIT_DEFER_DENY`或`L03_EXPIRED_WITHOUT_DEPOSIT_DEFER_DENY`；其他CAS冲突维持`L04_CAS_CONFLICT`。
- **第二道提交前事务保护**：五个可能注错位置正常走完后、准备让F03-1 `withSession`提交之前，重新执行真实PG16当前时钟/正式Lock状态/目标负责人/存量Deposit数量及Refund/Transaction事实查询。任何新到期或关系被破坏时都**抛出内部专用异常**，由`withSession`捕捉并真正`ROLLBACK`整个事务，只有回滚完毕后`authTx`才返回分类`DEFER_DENY`和`transactionRolledBack:true`。绝不采用在CAS、审计、不可变收据均写入后“仅返回DENY但提交成功”的做法。
- **不引入资金猜测**：对过期且已经关联合法`deposit_receipts`的Lock保留与无Deposit不同的DEFER分类，但两种都不能在本批自动解锁/延期/退款，不新增状态字段、不改任何`000001～000012` SQL/manifest/structure SHA及收据定义，不动已验收旧H/I/J/K服务、权限边界与产品规则。真正发生的资金变化由独立资金Authority核验；资金插入的真实FK行级锁冲突通过受控第二PG16连接实证阻塞，不将其当成资金已经结清。
- **本轮实际修改范围**：仅`engineering/f03/runtime-lock-responsible-handover/service.mjs`、`tests/integration.test.mjs`及本中文交接；旧迁移和旧回归工作流没有变更。

### A-L-01｜新增八项独立真实PostgreSQL 16时序用例

| 时序测试 | 真实数据库证明 |
|---|---|
| 1. 边界内的合法有效Lock提交 | PostgreSQL服务端时间和`expires_at`核对，CAS只赢一次，返回真正成功收据 |
| 2. 普通无Deposit在`before_update`跨期 | `SELECT pg_sleep()`使PG16真实墙钟越过期限；**CAS零更新**且快照零副作用 |
| 3. 已关联Deposit在`before_update`跨期 | 独立真实PG16合成Deposit收据，按Deposit类型DEFER；资金行及锁车状态全不动 |
| 4. `after_receipt`已经写审计/收据才过期 | 真实PostgreSQL慢点后提交前检查失败，**ROLLBACK**；Lock/收据/审计及SG06均与前快照一致 |
| 5. 有Deposit的`before_commit`跨期 | CAS与审计、收据之后真实到期，仍整事务回滚，原资金记录完全留存 |
| 6. 并发另一个数据库事务先修改Lock有效期 | 第二非超级用户PG16连接先锁行并使Lock到期；受控移交拒绝旧有效期快照，原业务行无幽灵更改 |
| 7. 并发事务先合法终结Lock状态 | 真PG16行锁与另一店长身份的SG06发起人守卫同时生效，正式Lock已非active，不可再移交 |
| 8. 并发资金收据插入竞争 | 第二PG16连接在受控锁车行`FOR UPDATE`期间尝试FK支持的Deposit插入，真实返回`55P03`；资金没有幽灵插入，正常有效期内的一方移交仍可正确成功 |

- **新增后完整新L测试为29/29**（原21 + 新增8），不是只运行新增子集；特意继续覆盖了旧全局20方向重复Key、五个独立正式PC会话同Key只能一胜、后续合法二次交接、历史不可变收据与资金/身份拒绝，禁止以修到期bug破坏原21项。
- 第一轮时序测试曾有单项不通过，原因是合成SG06第8429批的真正发起人为店长账号6，测试错误地用经理账号5进行操作，服务器正确拒绝`L03_BATCH_IDENTITY_DENY`。已修正**测试账号为真实正式批次发起人**，没有放宽原权限代码或改数据库fixture。
- **真实完整成功CI #38005609616**：<https://github.com/suzhe868-arch/mb/actions/runs/38005609616>，该次`run.head_sha=e7827cda918e2aded25867936ded4f3889a92875`，`completed/success`，**15/15独立PG16 jobs success**，L29/29、旧K29/J27/I27及其余冻结库各自回归成功；原92→93完整目录`F03_2L_EVIDENCE_FULL_CATALOG_PASS`、`F03_2L_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`保持成功，旧92表2028项和新93表2074项/原始SOURCE不变。
- **交接最终门禁**：上一条CI是在**本整改交接文字落库以前**获得的，不得用它冒充此报告提交后的最终同SHA结果。A复验前必须再得到**本报告提交后新B HEAD自己的15/15 `completed/success`**，L29/29、旧K29/J27/I27、原始物理SOURCE跨运行校验都继续通过，且分支HEAD与CI `head_sha`**逐字相同**。满足方可生效`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。

## 五、必须由A独立复验的限制和未完成项

- 按正式L施工单L01～L11逐项复审：业务`facts`中资金证据保守拒绝、Lock/LockRequest/Deposit关系真实锁保护、精确权限与历史来源校验；旧H/I/J/K四处服务最小差异；新SQL只有一张append-only收据表；五域20个方向及五会话真实竞争；全库物理目录、SOURCE、最终同SHA独立CI。
- 本批只是**单个Lock当前负责人受控PG16合成移交**。并未完成真实员工离职批次、SG06整个批次与全部七域的正式生产交接；原SG06 pending-only账本未由本批标记completed。实际客户锁车有效期、真实资金支付/退款以及销售员工降权都必须由将来独立授权的资金/业务批次处理。
- 源`deposit_receipts`没有能直接证明全部财务结清状态的独立列，不允许自行据此增造“有意向金即永久有效”规则；不可验证时返回DEFER_DENY交正式资金权威处理。
- 当前C/H01高保真设计、F03-2整体及名邦汽车V1产品基线**继续`NOT_READY`**，不对外宣称已可上线或完结。
- **A复审前B不合并main，不进入2M，不改冻结PDM Final，不要求用户逐项批准普通技术问题**。

**A-L-01 已整改并完成 L29/29 与真实PG16时序测试，交接状态：`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`，严格以本报告提交后最新同SHA 15/15 CI成功为最终生效证据。**
