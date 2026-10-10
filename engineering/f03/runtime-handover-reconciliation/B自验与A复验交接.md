# F03-2-2N｜B 工程完整自验及 A 独立复验交接

> 日期：2026-10-10（亚洲/新加坡）｜B 工程执行分支 `feat/f03-handover-reconciliation-2n`
> 状态：**B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A**，以本次交接报告最终 HEAD 同 SHA 17/17 PG16 job success 为验收条件；A 尚未独立复验或合并。

## 一、已签发 Authority 与允许范围

A 正式施工单：`07_重建工作区/F03-2-2N_A主控SG06全域收据对账与正式收口前置门禁只读施工单_2026-10-10.md`。施工起点为 A 已签收 F03-2-2M、[PR21](https://github.com/suzhe868-arch/mb/pull/21) 合并后的最新 main，B 仅创建 `engineering/f03/runtime-handover-reconciliation/**` 与独立 `.github/workflows/f03-2-2n-handover-reconciliation.yml`。

本批没有修改或删除 `main` 既有业务代码、H/I/J/K/L/M 六份服务、旧 CI/manifest、旧 `000001～000013`、PDM Final、生产种子、数据库 schema。没有创建 `000014`。仅隔离新建 17 个一次性真实非特权 PostgreSQL 16 作业，所有业务对象及资金数据均为合成数据。

## 二、七类对象真实只读对账与不变式

1. Customer：当前 owner 与 Customer Owner immutable receipt + `customer_owner_history` +真实 audit 必须一致；后继合法交接链不得断裂。
2. Demand：当前 responsible 与不可变收据/审计、独立个人权限和作用域匹配；两次真正合法交接保留旧和新收据。
3. Priority：**绝不新建独立 Priority 交接**；当前责任只由合法 trigger Demand、真实匹配结果和有效 lease 推导。变更 Demand 责任后按当前关系派生，不重置 expires_at、不建立额外 visibility grant。
4. Consultation：当前 assignee、首响 SLA、不可变 Consultation 收据和相应 audit 核验；终态只作为历史，不因账本行存在强制转派。
5. Waitlist：责任人历史及 ended_at、LockRequest/active Lock 关系保持旧域权威，不能因为收据存在复活候补。
6. Lock：现任负责人、Lock 当前状态/过期时间和 Deposit 独立事实保留；不可恢复已经终止的锁车。
7. Transaction：只认可真实 source Lock `converted_to_transaction` 结束来源、交易当前状态及不可变 M 收据；不更改款项、成交流程、Deposit/Refund。

所有六类不可变 receipt 逐条比对 `batch_id`/`item_id`/`object_kind`/`object_id`、from/to/actor、customer、Team、RequestKey SHA256、真实业务审计字段、时间、同对象连续链及当前合法负责人；跨域重复请求摘要或错误 audit 不能被视为可信交接。外部无权限的对象只输出 `OUT_OF_SCOPE`，不泄露客户联系方式、成交价或财务金额。

**报告状态只读**，既有 SG06 handover_items、handover_batches 的 CHECK 物理上没有 completed；本批绝不写 completed、关闭批次、撤销权限、禁用员工、触发公海。

## 三、原始 PG16 与历史回归证据

- 已取得 [原始来源 CI #38013071166](https://github.com/suzhe868-arch/mb/actions/runs/38013071166) 的完整成功证据：**17/17 相互独立 PG16 job success**；新 N 真实 **14/14**，冻结 M94 **31/31**、L93 **29/29**、K92 **29/29**、J91 **27/27**、I90 **27/27**，其余 H89、G/F/E88、D86、C84、B82 两个、A81、F03-1 身份/HTTPS80 各自在独立新库成功。
- 旧 M94 物理指纹 `7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659`；结构 **94 表 / 608 列 / 435 约束 / 163 索引 / 2120 完整 catalog 对象**，无物理增量；`F03_2M_EVIDENCE_FULL_CATALOG_PASS`、`F03_2M_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS` 均来自真实 N CI 日志。
- **本批原始来源已入 B 分支**：`engineering/f03/runtime-handover-reconciliation/evidence/`，含 `SOURCE.md`、原生 `pg16_schema_only.sql`、`pg16_inventory.json`、`pg16_full_catalog.json`、`sha256sums.txt`。SOURCE 所记来源为运行 `38013071166`、受测 SHA `b6a8f85a7cd421466d961061745b269f2f174b27`；后续最新运行须校验不变完整目录及 inventory 原字节、M 来源规范化 schema 比对，不能凭字面文件名宣称原始结构。
- 真实测试证明成功对账零业务写；审计 append-only 不可更改；混合七类项目部分成功/重试/blocked 不会误写 completed；独立第二 PG16 会话在读取中撤权限则返回拒绝，已有合法收据不因此变为永久读取授权；在途退款阻止误判完成。

## 四、本次交付与 A 责任

B 交付：新只读 `service.mjs`、真实 CI 专用 `fixtures.mjs`、`tests/integration.test.mjs`、本中文工程说明、不可变结构来源证据、B 中文交接，以及新增 17 作业专用工作流。旧资产 0 个重写。

**最终同 SHA 生效规则**：必须在本报告提交之后再次获得独立 17/17 `completed/success` CI，确认 `branch HEAD === run.head_sha`，N 全部测试成功、旧 M31/L29/K29/J27/I27 全量原版成功、N 原始证据跨运行校验通过。B 不创建 PR、不合并 main、不进入 F03-2-2O。

**仍未完成**：真实 SG06 离职对象全量迁移、所有 batch/items 正式 completed 状态扩展、正式员工失活与权限撤销、公海/退款闭环、线上服务接口以及完整 F03-2/C-H01 高保真和正式上线。产品基线继续为 `NOT_READY`。

**READY_FOR_A_REVIEW / NEXT_OWNER=A**（最终文档提交必须在同 SHA 17/17 PG16 success 门禁完成后交 A；未完成前暂不放行）。

## 五、GitHub Actions 零步骤失败的实际恢复记录及最终同 SHA 门禁

- GitHub Actions 先前 #38013276380、#38013280037 及最终 B HEAD `fb2bad9c39862e36e6eab348429364312f5b8862` 的 [#38013437152](https://github.com/suzhe868-arch/mb/actions/runs/38013437152) 初始尝试均出现 17 个作业零步骤失败，尚无法从 GitHub 得到具体的账户/平台原因。此失败记录原样保留，不删除。
- 2026-10-10 重新对**同一个最终 B HEAD** 重试 #38013437152，**第 3 次尝试正式 `completed/success`，17/17 个独立 PostgreSQL 16 作业成功**；GitHub 不再零步骤失败。
- 本次真实日志复核：N14/14、M31/31、L29/29、K29/29、J27/27、I27/27、旧独立测试全部通过，`# fail 0`；`F03_2M_EVIDENCE_FULL_CATALOG_PASS`、`F03_2M_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`、`F03_2N_ORIGINAL_FULL_CATALOG_AND_INVENTORY_BYTE_PASS` 同时通过。
- `fb2bad9c39862e36e6eab348429364312f5b8862` 分支 HEAD 与上述运行 head_sha 完全相同；此前归档的初次成功来源 #38013071166 和原始 PostgreSQL 全目录、结构 SQL、inventory、校验值仍完整保留；两批受检物理目录无新增表/列/约束/索引。
- 本次文档更新不修改新 N 服务、测试、工作流或任何旧资产，会生成新 SHA，**须以此文档最终提交之后自动触发的新同 SHA 17/17 成功 CI 为 A 正式接收门禁**。不得借上一成功 SHA 直接宣称最新提交合格。

## 六、真实未完成与后续责任

本次工作仅是**只读对账和受限合成 PG16 门禁**，不是生产真实离职交接，没有将 `handover_batches` / `handover_items` 改为 completed、没有禁用员工、撤权、公海释放、资金操作或生产上线。

最终门禁成功后唯一下一责任人 **A 主控**：独立复验并决定是否通过/合并 `main`，随后再按正式审批规划下一施工单。B 不自行 PR 合并，不启动 2O；F03-2 整体、C/H01 高保真及产品基线均 `NOT_READY`。

## 七、A-N-01｜Priority跨批来源证明定向整改及真实自验

**A正式退改单**：`07_重建工作区/F03-2-2N_A主控独立复核Priority派生跨批次来源证明定向整改单_2026-10-10.md`。这是对前述第一轮B_SELF_TESTED但A_NOT_ACCEPTED状态的追加闭环，不删改前轮证据或假称A已验收。

### 7.1 实际修改与因果来源（非推定）

- 仅整改新N服务及其原生真实PG16测试，再追加本中文交接；没有修改旧H/I/J/K/L/M实现、数据库迁移、正式产品规则、权限种子、既有旧CI或main。主要代码提交为`cebdf2f393abc11a516c7367470ac596152aec8b`，21例测试源码提交为`cfd032c1faf204759aa464545f50347907948eb3`。
- Priority待交接item必须明确保持本批`batch_id`、`from_employee_id`、`intended_to_employee_id`与batch source一致，且真正的trigger Demand本批immutable receipt必须存在并与同批Demand item、顾客、trigger Demand、原负责人、目标负责人完全一致。审计与连续历史链通过原N `proof(Demand)`逐条检验；本次证实的必须是**该Demand最后一张可信收据**，早期合法收据不能替后续批次冒领。
- Team来源不再读不存在的`handover_items.scope_team_id`或用receipt Team自行代填：先按当前请求Team重验manager/店长、scope、personal deny及参与员工关系；若真实历史Demand收据Team不同，仍对收据历史Team重新进行当前授权核验。显式获授权跨Team场景可以安全读取；任一作用域不可信则只读输出`DERIVATION_UNPROVEN`或`OUT_OF_SCOPE`。
- 无Priority独立transfer或receipt，无TTL续时/Grant增加/员工撤权/账本completed，且永远`batchCloseAuthorized=false / employeeDisableAuthorized=false / globalReady=false`。

### 7.2 新增七项真实PG16正负例及旧用例完整保留

A-N-01-1 同批真实Demand收据来源和Priority一致，正例仍派生证明。

A-N-01-2 仅旧批存在Demand receipt，新批同Priority pending与retry_required均不能冒领。

A-N-01-3 同批Priority原员工与可信Demand来源不符，必须拒绝证明。

A-N-01-4 跨店Team 906与真实历史Team 901两重当前权限均合法时正例通过；仅撤历史Team授权时拒绝，未知Team 999拒绝。没有以硬编码同Team替代精确scope。

A-N-01-5 Priority TTL过期、Match invalidated均拒绝；后续原有真正Demand二次移交旧N测试继续拒绝旧目标的Priority派生。

A-N-01-6 六域收据均可信、合成隔离库中退款已按非付款关闭且没有pending Refund时，故意注入Priority错误来源，仍只能`DEFER_DENY`，全对象快照及账本/审计/可见授权不因只读服务变化。测试临时事实在finally恢复，不是真实客户退款或财务结算。

A-N-01-7 同一PG16事务两个检查阶段间恶意修改Priority来源，返回`N08_DRIFT_DEFER_DENY`，事务全部回滚并保持前后业务/历史快照完全一致。

### 7.3 首次真实整改CI与正式交A门禁

- [真实Actions整改运行 #38018632801](https://github.com/suzhe868-arch/mb/actions/runs/38018632801)：源码SHA `cfd032c1faf204759aa464545f50347907948eb3`，`completed/success`，**17/17独立PG16 job success**；新N **21/21**，原14项保留加7项，零失败。旧M94 31/31、L93 29/29、K92 29/29、J91/I90各27/27和其它旧独立回归均success。
- 新N同一日志明确：`F03_2M_EVIDENCE_FULL_CATALOG_PASS`（94表/608列/435约束/163索引/2120对象、SHA `7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659`）、`F03_2M_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`及`F03_2N_ORIGINAL_FULL_CATALOG_AND_INVENTORY_BYTE_PASS`，无000014、无任何DDL delta。原始N SOURCE已归档且不覆写。
- **最终提交原则**：本交接报告也属正式分支提交，因此须以本报告落库之后的**最终分支HEAD自身**与GitHub最新一轮`completed/success` **17/17独立job run.head_sha完全一致**为最终交付门禁，不可用本节中首次源码成功运行替代。若该最终门禁未完成/失败，仍为`B_VERIFY_PENDING`，不得交A。

**A-N-01 已经B实施与21项PG16自验；保留A独立复验权限。最终同SHA门禁绿灯后，B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A。F03-2整体、SG06真实生产闭环、C/H01与产品基线始终NOT_READY。**
