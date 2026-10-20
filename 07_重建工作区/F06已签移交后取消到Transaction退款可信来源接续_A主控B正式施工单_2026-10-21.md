# 2026-10-21｜A正式技术裁决：Issue159资金复用白名单精确补充

**本单原要求继续有效，但以下受控例外改由[《F06 Issue159 PR150资金原语复用与来源版本接续｜A主控技术裁决补充单》](F06_Issue159_PR150资金原语复用与来源版本接续_A主控技术裁决补充单_2026-10-21.md)执行。** B有实证指出原只读PR150与禁止资金算法复制发生冲突；A批准在`engineering/f06/transaction-refund-http-pg16/service.mjs` 内精确提取/接线**同一受控资金核心**，可新增仅一份`engineering/f06/transaction-refund-http-pg16/shared-refund-core.mjs`。原PR150旧入口对新来源继续FailClosed，冻结`sidecar.sql`/公共DDL/签名账本/旧CI仍不得修改；新增桥接目录与唯一专用workflow可相应调整目录白名单和正式PG16/HTTP执行。不准伪造旧Cancel、复制第二套资金算法或降低历史父链门禁。

**保持原 B 工作分支** `feat/f06-signed-post-handoff-refund-bridge-01`（当前已有B SHA `2f703e38d150b249db262ecdba6fc96e4226c90c`），安全同步此裁决实际合入的最新main并继续施工，不重建分支/不重做已验代码；B当前只有静态成功，真实PG16/CI证据未执行，不得标READY。**本补充只有标准合入main后才正式生效。**

---

# 名邦汽车 V1｜F06 已签负责人移交后取消 → Transaction 侧 Refund 可信来源接续｜A 主控 B 正式施工单

> **工作单**：`F06_SIGNED_POST_HANDOFF_CANCEL_TO_TRANSACTION_REFUND_BRIDGE_01`
> **当前责任**：B 工程执行；**独立验收**：A 主控。
> **阶段**：F06 原路线内一项定向剩余工程；**非生产、隔离合成事实与真实非超级用户 PostgreSQL 16 / loopback HTTP**。
> **执行分支**：`feat/f06-signed-post-handoff-refund-bridge-01`，必须从 **B 实际开工时最新 main** 建立；不得按此文历史 SHA 起步。
> **状态门禁**：仅当本单及主线 `NEXT_OWNER=B`、Issue 正式放行均合入最新 main 才 `A_RELEASED_FOR_B`。B 不自行新开业务 PR、不合并 main。
> **管理规范**：[《B工程执行增量审查关联回归与避免重复施工正式规范》](B工程执行增量审查关联回归与避免重复施工正式规范_2026-10-21.md)。本单只补真实缺口，**不重做已验收 PR139/146/150/153/156 业务**，也不扩为 F01～F05 阶段返工。

## 一、A 源代码独立核查：本次真正的、已证实的缺口

1. PR #139 已A验收非生产真实 `Lock→Transaction`，在 `f06_real_tx_ci` 保留签名 Transaction 源。PR #146 已A验收**未移交**的取消来源 `f06_real_cancel_ci`，PR #150 已A验收原签名 `Transaction cancelled→Refund pending→无实际退款 closed`，其完整 R1 包含 pending 后原生 3A 已签 correction/reversal 历史水位校验。
2. PR #153 已A验收 `f06_real_handoff_ci` 版本化负责人移交；PR #156 已A验收 `f06_real_post_handoff_cancel_ci` 按当前签名负责人合法 `in_progress→cancelled`，具 Event/RequestKey/Audit/Attestation 与同PG事务原子性。PR #156 官方 Run39482165477 同SHA **680/680**，历史父161表与24迁移的物理 Seal 不变。
3. **实证缺口，不应伪装成缺功能**：`engineering/f06/transaction-refund-http-pg16/service.mjs` 中 `verifyTransactionSource()` 要求 `public.transactions.responsible_employee_id===f06_real_tx_ci.origins.responsible_employee_id`，并硬读 `f06_real_cancel_ci.origins/events/request_keys` 与旧 Audit；负责人经 PR153 真 Handoff、PR156 真 Cancel 后即不满足。旧 PR150 对该新来源安全 `FailClosed` 是正确的旧版本边界，**不得反过来篡改冻结 PR150 / PR156 原历史使其假兼容**。
4. 这次的唯一新增业务目标是：**合法 PR139 Transaction → 至少一次真实 PR153 签名 Handoff → PR156 签名 Cancel → 由现在具独立合法 Refund Permission、Capability、Scope、ObjectState 的当前负责人进行 Transaction 侧合成 Refund pending，并能在零付款事实下 closed**；保留原始版本、真实资金数额、PDM-19 Refund 的 Lock XOR Transaction、净余额与签名来源一致性。旧未移交 PR146→PR150 正例必须继续有效；未知/伪造新旧来源必须拒绝。

## 二、B 在本单内连续完成的两个关联子任务（统一交A，不用子任务逐级交接）

### 子任务1：签名来源版本桥接与合法资金接续

- 先只读梳理 PR139 Transaction 原始来源、PR153 全量版本化 Handoff Event/Key/Attestation、PR156 最新 Cancel Origin/Event/Key/Audit/Attestation、PR150 原始 Cancel Refund 逻辑及 3A/3C1 签名父源；输出**实际可信来源对应表**，确定最小兼容方案。
- **优先复用、委托或受控适配**现有 PR150 的 Refund 扣额、`pending`、零付款 `closed`、冻结历史与 3A 合法 correction 追加校验，不新建另一套独立退款业务状态机。冻结 PR150 旧版本入口继续对新来源 `FailClosed`，不得软化签名校验；如冻结 sidecar/Attestation 确实不能承载新来源，只允许在本单白名单中创建**最小版本化来源适配与不可变必要事实**，必须标明其与 PR150 的复用关系，禁止复制完整服务另造独立资金算法。
- 验证原始 Tx responsible 与最新 current responsible、完整签名 Handoff 历史链、Version、Digest、Actor、Session 有效性、独立退款能力/个人 DENY/范围、关联 Customer/Vehicle/listing_cycle/Lock、Deposit+Correction+Reversal、已有 Refund Case 与 Audit。只接受合法 `cancelled` Transaction 的**Transaction侧**退款，不能借旧 Lock 侧或伪造 PR146 Origination。确认没有真实付款、refund_payments=0，才允许合成 `pending→closed`；**禁止创建 `refunded`**。
- 必须具当前有权负责人的 Request 幂等、Cancel 签链版本钉住、历史快照一致性、后续合法签名 3A correction 不误拒、重复/冲突/撤权的安全拒绝；任何支付事实未知、签名缺损或来源不合规，一律 `FailClosed`。
- 若原冻结签名合同无法在“不改冻结父源/不扩大公共DDL与权限/不伪签”的白名单内完成，请直接提出 `BLOCKED_SIGNED_POST_HANDOFF_REFUND_BRIDGE_SOURCE`，详列不可能边界与可选A裁决；**不得扩写另一套未经授权的资金账本或自行解除边界**。

### 子任务2：一次性完成非生产真实接续测试、关联安全回归与证据

- 在同一个可销毁、真实非超级用户 PG16 环境中，通过**真实已签父服务生成**合法 PR139 Transaction、至少一次 PR153 Handoff、PR156 Cancel，再发起受控 loopback HTTP 新接续操作并完成合成 Refund pending、无付款 closed；不得手工 INSERT 伪造旧 PR146 或签名 3A 资金事实。
- 覆盖正确 Actor/Session/Permission/Scope、原始负责人员不得冒名、签名链 A→B、可行时 A→B→A 的完整版本防重放、真实两 PG Backend 不同员工/同车辆竞态与锁序、同 Key 重试与冲突、新旧 Cancel 两类来源、退款请求与取消/新 Handoff 的交叉时序（按合法状态拒绝）。
- 完整测试真实 3A 合法 Correction/Reversal（含退款申请后再签名更正）、余额防超退、已有 Lock/Transaction Refund 防重复、退款 pending 与无付款关闭、操作后原 Lock/Waitlist/Priority 不复活；现场退款/生产 `completed/refunded` 应明确 403/404 或硬拒。
- 执行 SQL 注错 `AFTER_PENDING` / `AFTER_EVENT` / `AFTER_CLOSE` / `AFTER_AUDIT` 等实际适用的回滚探针，验证 Origin/Event/RequestKey/Audit/Public Case/资金状态同一事务无半写。测试不能只看 HTTP status；必须核对 PG 原生有权限的 SQL、版本事件和发生后的对象事实。
- 旧 PR #150 和 #156 已验收的历史行为保留必要**相关回归**，禁止机械重跑无影响的 F01～F05 全部工作流；父签名与资金/权限高风险门禁不能删减。仅本单最终 SHA 的原生 Push 检查及明确关联回归可证明新代码通过，之前 PR #156 的 680/680 属于历史基线，不能冒充这次末SHA 结果。

## 三、精确文件授权、现有资产保护与执行环境

- **允许新增**：`engineering/f06/post-handoff-refund-bridge-http-pg16/**`，以及至多 1 份专用新工作流 `.github/workflows/f06-signed-post-handoff-refund-bridge-onejob.yml`。文件内可以有版本兼容服务/薄适配器、合法最小不可变来源、真实测试、运行脚本、来源映射矩阵和中文交接。
- **只读复用、不得直接改写**：`engineering/f06/lock-transaction-http-pg16/**`、`engineering/f06/transaction-cancel-http-pg16/**`、`engineering/f06/transaction-refund-http-pg16/**`、`engineering/f06/transaction-handoff-http-pg16/**`、`engineering/f06/post-handoff-cancel-http-pg16/**`、3A/3B/3C1 及其它冻结父源。
- **禁止改动**：`engineering/src/**` 正式服务入口、所有现行公共 DDL/24 条迁移、旧 Workflow、PDM Final、Current IA、F03 业务权限、生产资金入口、C PR68。需要新增正式非生产通用路由或公共Schema时应作为后续A独立授权事项，不以本跨签名接续测试顺手扩范围。
- 强制环境：GitHub 正式仓库指定新B分支的真实 `push`，Node 当前受控版本、全新独立 PostgreSQL 16 物理数据库和非超级用户、临时密钥、loopback HTTP/TLS（必须明确协议与安全限制）、独立销毁/恢复，禁止持久化个人或真实客户/车价/资金数据；新增预算 **$0**。

## 四、非生产收口的测试质量门禁

- **B 自审**：仅本次新增代码以及直接受影响的 PR139/150/153/156、3A/3C1、F03 现有身份范围和关键交易数据结构；不得重启 F01～F05 全阶段代码审计。
- **必须有的新真实证据**：至少 **35** 个独立PG16业务正反/错误注入/并发场景，至少 **10** 个隔离HTTP/TLS越权、未授权环境、付款/生产拒绝场景；旧 PR #150/153/156 的关联来源必要父回归列单逐项执行；如合计数变动按实际用例与证据说明，不用重复计 Node suite 伪增数。
- **必须有的旧父完整性门禁**：PR156 官方现有 161 张签名父表逐表 `COUNT/MD5`、24 签名迁移、Public Catalog、RequestKey/Origin/Event/Attestation 及完整 Seal，在独立不同物理 OID 场景前后保持一致；本单临时 Schema 不得伪装为旧父签名表。审计库独立不受测试破坏。
- **CI 不重复滥跑**：单一可控的正式 Push 专属工作流、显式路径适用性；只跑新用例+受影响高风险冻结父回归，避免无关旧 F01～F05 工作流爆量。若专属新工作流依赖父已冻结工作流必须在同最终 SHA 重跑相关断言，并严格说明未运行旧模块的依据。不能禁用/删除必需安全或 GitHub required checks。对历史 `queued/fail/skip` 如实登记，不自行豁免。
- **成功条件**：最后一个 B 业务 HEAD 与GitHub原生 Run/Job `completed/success`同SHA，新项目与相关父回归全体 **0失败/0未解释跳过**；真实 PG16/HTTPS 日志能定位真实后台 PID、事务及故障回滚，旧父完整性保持；代码审查/测试/来源矩阵和完整中文交接齐备。没有执行的留 `NOT_RUN`，没有正式来源的标 `SOURCE_GAP`。
- **A验收**：A 在B整单 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A` 后集中审查上述增量源码和关键资金/权限/签名完整性，而非重查全部历史工程；不合格形成一次性定向整改单。只有A `A_ACCEPTED` 才可正常 PR merge并更新五项主线状态。

## 五、已经完成、明确排除与下一个阶段

- 已验收 PR #139、#146、#150、#153、#156 不作重写；F06 旧3B不安全直达入口继续 `SOURCE_GAP`，没有本单授权恢复。
- 本单**不是**正式生产 Refund、真实钱款/微信银行退款、`refunded`、`completed`、支付 Issuer、PDM 新资金规则或部署 UAT；不因技术回环成功给生产接口开门。
- 不跨到 F07 Collector/JYT、电话、CDN、飞书；F07 仍是后续 B 独立工程阶段。F08 是 B 后续独立工程阶段，待 F08 常规 A 验收后，整个 B 后端整体最终验收由 A 主控单独负责。
- B 只在本单完成后汇报一次：**完成实物 / 新旧来源兼容矩阵 / 最后SHA及RunJob / 新回归及父回归与Seal /真实阻断与遗留 / `READY_FOR_A_REVIEW`**。未实测不写通过、未合并不写已合并。

## 六、A 施工放行口径

- 依据 PDM-19 Final §§3–10、19–26 及 F03 现行权限与 F06 PR #139/#146/#150/#153/#156 已验收原代码。
- **A_RELEASED_FOR_B，仅非生产可信签名 Transaction 退款新来源接续**。此授权不改变任一产品 Rule Atom、真实资金或外部生产边界，也不隐含随后 F06 其他未知缺口或 F07/F08 自动施工授权。
