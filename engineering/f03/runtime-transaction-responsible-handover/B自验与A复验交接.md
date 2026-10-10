# F03-2-2M｜B工程完整自验与A主控独立复验交接

> 日期：2026-10-10（Asia/Singapore）｜批次 F03-2-2M｜原仓库 `suzhe868-arch/mb`｜工作分支 `feat/f03-transaction-responsible-handover-2m`。
> **B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A**，**严格以本交接落库后的最新同 SHA 16/16 个独立真实 PostgreSQL 16 CI 作业均 completed/success 为最终生效门禁**。B自验、原始证据和绿灯都不能代替 A 独立复验；B绝不自行 PR、合并 main 或开启后续批次。


## 本轮 A-M-01 定向整改｜真实转换来源证明与数据库回归已闭环（2026-10-10）

- **A当前正式退回依据**：07_重建工作区/F03-2-2M_A主控独立复核来源Lock合法转交易证据定向整改单_2026-10-10.md。严格沿用原2M分支，未创建PR、未合并或推进2N。
- **原B代码缺口**：此前仅凭锁车 lock_status='released' 和Transaction关联ID一致放行；原60条合成Lock无 end_reason，普通人工释放也可能误判转交易。现已关闭。
- **受限实现修正**：本批 service.mjs 同时在prepare、commit事实重核和CAS+audit+receipt后最终SQL中，强制原Lock lock_status='released'且**已有 end_reason='converted_to_transaction'**，并比对Transaction source_lock_id及Customer/Vehicle/listing_cycle四级源事实。事实读取依赖实际PG16 FOR SHARE/FOR UPDATE行锁；来源证明变化/未知一律拒绝，CAS后变化必须throw使withSession回滚，不留下责任人、资金、审计或收据部分变更。此字段是已冻结旧 public.locks.end_reason，不是新加测试标志；本批不虚构没有已签规范的转换审计事件。
- **数据与测试**：fixtures.mjs 为所有合法Transaction补真实来源结束原因；n41～45分别植入人工释放、普通取消、过期释放、NULL与未知原因。新 tests/integration.test.mjs 增加A-M-01 **6条独立真实PG16测试**：合法来源成功且仅更新负责人列；五类released伪合法全部fail closed；复合FK身份错误及同四级ID假Lock来源拒绝；prepare到commit来源更改拒绝；CAS+receipt后注错更改来源原因并整事务回滚；第二个真实PG16会话持锁竞争造成安全拒绝和快照完整。
- **A-M-01-5冻结回归完整**：旧M25全保留，现新M合计**31/31成功**（新增6）；H/I/J/K/L/M六域30有向重复Key、六会话同Key独占与不同Key正常、同Transaction连续合法移交、财务终态与5种故障注错均继续成功。
- **预交接自验来源**：新增代码及31测试HEAD a1becfe42e68d1053a2d2653f1d781ec9f699380；真实 [GitHub Actions 38010451407](https://github.com/suzhe868-arch/mb/actions/runs/38010451407) 状态 completed/success，**16/16个相互独立非特权PostgreSQL16作业成功**。M31/31、冻结L29/K29/J27/I27旧完整版本测试与其它旧独立作业全部成功。M专用真实日志有F03_2M_EVIDENCE_FULL_CATALOG_PASS和F03_2M_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS。
- **物理与文件冻结**：原旧93表596列420约束159索引2074完整定义、M94表608列435约束163索引2120项、旧/新结构SHA、000013.sql/manifest/source-run 38008313116与原始pg_dump/inventory文件均不变；旧H/I/J/K/L服务、旧迁移/CI、PDM Final、生产种子未因本轮修复再改。
- **最终同SHA强门禁**：本中文交接当前修订本自身提交后，还须以最终分支HEAD等于新触发的run.head_sha，且本次新CI **16/16 completed/success** 为最终READY_FOR_A_REVIEW生效条件。A不得用上述预交接成功运行冒充最终交接提交的同SHA运行。B不合并main，等待A独立复验。
- **剩余边界**：只完成受限合成PG16 Transaction当前负责人单域演练，不代表Lock→Transaction真实创建流程已经实现、资金动作可生产执行、SG06全部业务域完整离职交接、F03-2整体/C-H01高保真最终验收或产品上线。PRODUCT_BASELINE=NOT_READY。

---

## 一、正式施工Authority及已锁定的边界

- 唯一正式施工单：`07_重建工作区/F03-2-2M_A主控SG06_Transaction交易负责人单域移交完整施工单_2026-10-10.md`。来源：PDM-19交易/Deposit/Refund资金最终口径、PDM-03逐项交接历史、PDM-02当前角色与Team/store/customer范围及个人deny、PDM-18来源Lock和PDM-25审计。
- 施工前 A 正式 `main` SHA：`f0f1c3aaaf8e6af3687886763bfc4e103d984302`；上批L独立验收已合并[PR20](https://github.com/suzhe868-arch/mb/pull/20)，合并提交 `9ed6db2a6aeefb382298460004768edd11df20b6`。
- 仅新增 `engineering/f03/runtime-transaction-responsible-handover/**` 与独立工作流 `.github/workflows/f03-2-2m-transaction-responsible-handover.yml`。仅按A授权最小更新已经签收的 H/I/J/K/L **五个** `service.mjs` 入口，以识别当前独立M物理表、选择严格对应版本 `verify` 与拒绝同Key跨六域复用；不改其授权/业务/审计规则。
- 旧 `000001`～`000012` SQL、manifest、旧CI、产品Final、权限生产种子与真实生产交易均零修改。唯一新迁移 `000013.sql` 仅建 `public.transaction_responsible_handover_receipts` 一张受FK、唯一约束、不可变触发器保护的新表。
- 不提供实际生产PC HTTP入口，不对微信/JYT/飞书/真实客户或资金做操作；**只在16个隔离、一次性、非超级用户 PostgreSQL 16 作业运行合成员工会话和合成资金/交易关系**。

## 二、M01～M11实现说明（A必须独立再审）

### Transaction严格单域
- `prepareTransactionResponsibleHandover`：校验真实SG06 batch、Transaction item精确身份、F03-1 manager/store_head当前认证、独立 `transaction.responsible.transfer`、个人deny、capability+Team/store/customer；按真实DB FK证明Lock来源与Customer/Vehicle/listing cycle一致、Transaction必须 `in_progress`，终态 `completed/cancelled`不可改。
- `commitTransactionResponsibleHandover`：沿用全局SG06事务锁 306/309，M稳定域锁 314；在合法单事务内给 `transactions.responsible_employee_id` **仅一列**CAS更新，严格要求原负责人和 `status='in_progress'`、`completed_at IS NULL`，同事务写不可变业务审计和逐项收据。
- 交易`status`、成交/取消时间、原价快照、source Lock生命周期、客户Owner、Demand/Priority/Recommendation/Consultation SLA/Waitlist、真实Deposit/Refund/支付/资金数据、SG06 item/batch状态均不反写。单域成功不冒称完整SG06离职交接完成。
- 来源Lock、客户、车辆、在售周期、现任交易负责人、操作经理/店长权限和资金关系不可证明时保守 DENY/DEFER；已有合法Deposit并不等于已结清；Refund关联 `pending/refunded/closed` 不被改写或猜测，相关Transaction/Lock真实退款关联本批保守DEFER到独立PDM-19资金Authority。
- `readTransactionResponsibleHandoverReceipt` 和 `retryTransactionResponsibleHandover` 使用当前独立权限与真实历史签收证据，核对batch/item/Transaction/customer/actor/审计前后责任、时间、Key摘要及连续交接链；同一交易两次独立合法移交后，早晚两份不可变收据均可读；非法FK形式收据无法伪造合法证明。

### M04/M10原子事务及竞态闭环
- 客户、来源Lock、交易行、在售周期、相关真实意向金/退款引用在同一PG16事务内受数据库真实关系与对象守卫保护；`before_update`、`after_update`、`after_audit`、`after_receipt`、`before_commit` 五注错点均通过真实SQL事务全回滚。
- 实质强化 **M10第二道提交前当前态重核**：CAS与审计、收据完成后，再核当前经理/店长个人权限、Team/capability、客户有效性、车辆供应与在售周期、SG06 batch/item确切身份、Transaction终态、来源Lock以及新Deposit/Refund关系。若任何后继事实改变，则 **throw 给F03-1 `withSession` 确保整笔ROLLBACK** 后才返回 `M04_UNSAFE_FINANCIAL_OR_TRANSACTION_STATE_DEFER_DENY`，绝不出现“业务拒绝但owner/audit/receipt已提交”的Ghost。
- 注销、终态、Team回收和资金变化的真实SQL反例一律fail-closed；暂停接客不误认为当前治理权限撤销；经理有显式跨店 Team scope 而店长无越权。
- 六域 H/I/J/K/L/M 全部 **30种有向组合** 用不同原始有效SG06 batch与真实表同Key碰撞逐对实测；**六个真实当前PC会话同Key并发只有1胜、其余5个被拒**；六域不同合法Key可各自成功。所有历史模块旧版结构无M表时维持原本各自严格封印。

## 三、隔离 PostgreSQL 16 真实物理结构与来源（不得预估/人工改写）

| 项目 | 旧版L93 / 000012 | 新版M94 / 000013 |
|---|---|---|
| tables | 93 | **94** |
| columns | 596 | **608** |
| constraints | 420 | **435** |
| indexes | 159 | **163** |
| full catalog 对象定义 | 2074 | **2120**，仅新增46项 |
| 物理结构 SHA256 | `9ab7221f9a0f5f81c0af37441d4cd5b824e2ac7322f8d40f952ba2cecea0e2f9` | `7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659` |

- 新真实SQL SHA256 `da8c51f83458ea0d7baad2ba146094b4abc2ed68d2324243acf52435ae0249ee`；真实非特权PG16先 `--discover` 在故意回滚事务中量测数据，再写唯一 `000013.manifest.json`、严格 `--apply/--verify/--inject/--rollback`；旧93物理对象和所有历史schema版本/checksum均不可变。
- `evidence/SOURCE.md` 已原样归档第一次真实PG16成功物理归档来源：run `38008313116`、当时source SHA `3c75bfdd7b7ef1500ebadc0301e096bee9af126c`。同目录包含PG16原始 `pg16_schema_only.sql`、`pg16_inventory.json`、old/new-structure全目录、sha256sums；后续CI对schema原始文件限定只归一真实PG dump自身成对的restrict/unrestrict随机标记后核对，同时将inventory和完整catalog按原字节/定义严格比对。
- 最新已完成**预交接**独立[真实PG16运行 #38008501930](https://github.com/suzhe868-arch/mb/actions/runs/38008501930)：代码HEAD `6729b6bfa1f1d874df3967659d99f1860c975aff`，run `completed/success`、**16/16全部相互独立真实PG16成功**，新M**25/25**、旧L29/29、K29/29、J27/27、I27/27及独立H89、G/F/E88、D86、C84、B82双、A81、F03-1账号认证和HTTPS全部成功。日志含 `F03_2M_EVIDENCE_FULL_CATALOG_PASS`、`F03_2M_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`。
- **最新同SHA门禁必须在本交接文件的提交后重新执行一次**。A不得把上一成功运行 #38008501930 当成本报告新HEAD已通过；由GitHub Actions新run再次确认16/16，branch HEAD与 `run.head_sha` 精确一致，才达到最终READY_FOR_A_REVIEW。

## 四、M31完整测试覆盖清单（原M25及A-M-01新增6项）

1. M01精确新迁移94表结构、固定物理目录及不可变收据；M02当前manager/store_head PC权限、4S/普通/System Admin/限制会话、个人deny/撤Team/停用身份、跨店范围。
2. M03真实source Lock和Transaction四字段组合FK、in_progress/已完成/取消终态、顾客停用/周期结束/供应异常、多真实Deposit、真实pending Refund、安全拒绝。
3. M04唯一责任列CAS、真实审计和无额外业务副作用逐表快照、5个事务注错点、同Transaction双会话一胜及同item合法历史retry。
4. M05 H/I/J/K/L/M **30方向**全局请求Key双向拒绝、六员工当前PC会话并发同Key只有一胜、六不同Key都能独立成功，跨item同Key不可二次收据。
5. M06同Transaction两个合法连续移交前后历史可读、未审计current owner漂移拒绝、source失活后审计历史仍存在、当前reader撤权立即拒绝、伪造FK合法但审计非法拒绝、已使用的不可变收据禁止删除和迁移回滚。
6. M10 **四个新增真实注错边界**：写收据后经理个人权限撤销、事务临交前Team capability过期、写审计后客户被停用、写收据后新增真实FK退款记录，均返回保守拒绝并证明整事务 owner/audit/receipt/资金逐表快照完全回滚；另有Transaction同时完结/状态改变自注错及并发另一PG16连接退款FK等待/超时防幻读。
7. 完整旧库回归不是“在M94库运行旧几条”：16个真正分库、分进程、分job、不同旧物理结构回归；旧版不存在新M表时仍保留原严格版本封印和历史行为。

## 五、交 A 的验收责任与仍未授权的内容

- A应**独立**检查 `000013.sql`、manifest、全catalog/SOURCE、Transaction现时source/资金/终态Guard、CAS/审计/历史链、M10最终事务守卫、五份旧H/I/J/K/L服务新增内容是否确实仅跨域Key/版本识别、M的31例（含A-M-01六项）及旧L29/K29/J27/I27的实际日志，并比对**交接新最终HEAD = 最新同SHA 16/16 success**。
- A验收通过后才由A决定标准PR合并 `main`，再单独决定是否签发下一批施工单；B不代替A验收、不创建PR、不自行合并、不得擅自开始2N。
- 没有实现Transaction创建、完成、取消、成交更正、退款执行、支付结清、公海释放、全部SG06离职批次真实生产移交及生产HTTP开通。全部真实资金相关变化留待PDM-19唯一Authority下正式后续批次。
- **F03-2整体与C/H01高保真设计尚未最终验收，名邦汽车V1 PRODUCT_BASELINE=`NOT_READY`**。

**当前 B 交接：`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`，以本报告提交后新HEAD的真实16/16独立PG16全部成功、且CI同SHA为最终生效条件。**
