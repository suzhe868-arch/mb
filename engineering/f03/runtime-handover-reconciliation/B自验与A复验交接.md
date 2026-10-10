# F03-2-2N｜B 工程完整自验及 A 独立复验交接

> 日期：2026-10-10（亚洲/新加坡）｜B 工程执行分支 `feat/f03-handover-reconciliation-2n`
> 状态：**B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A**，须以**本报告自身最终提交 SHA 与最新同 SHA 17/17 PG16 CI 全 success** 为最终生效条件；A 尚未验收或合并。

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

**READY_FOR_A_REVIEW / NEXT_OWNER=A**（以上最终同 SHA 门禁全成功后生效）。
