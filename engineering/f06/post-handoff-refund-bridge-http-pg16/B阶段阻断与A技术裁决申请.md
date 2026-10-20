# 名邦汽车 V1｜Issue159 B 增量工程阶段阻断及 A 技术裁决申请

> 状态：`BLOCKED_SIGNED_POST_HANDOFF_REFUND_BRIDGE_SOURCE`  
> 责任：B 已执行已授权的来源分析与只读签链核验；下一项必须由 A 重新裁定受控的**资金原语复用接口与文件白名单**。  
> **未达到** `B_SELF_TESTED`、`READY_FOR_A_REVIEW`，也不是业务交付完成。不能把静态 CI 绿灯当真实 PG16 业务门禁通过。

## 一、已经实际完成的增量实物

1. 从开工时最新 main `acdfdf9e0e82c3836b8e4fd20bcd5bc6498afd8d` 创建工作分支 `feat/f06-signed-post-handoff-refund-bridge-01`。
2. 只在 A Issue159 白名单内增加签名来源映射文件、`签名来源只读核验.mjs`。新代码对 PR139 Transaction→PR153 Handoff→PR156 Cancel 进行版本、签名摘要、Actor、RequestKey、Audit、Lock、身份关联校验，**故意只返回** `refundAuthorized:false`，不具备创建退款的权限或余额证明。
3. 新增唯一专用 workflow 的**暂态静态门禁**：GitHub 原生同 SHA 运行，检查分支/改动路径与 Node 语法；其中明确 `STATIC_ONLY_NOT_READY`。第一次 CI 因中文路径被 Git 默认转义误拒，B 已通过 `core.quotePath=false` 定向修复。成功运行：<https://github.com/suzhe868-arch/mb/actions/runs/39500784956>；静态通过的 SHA `75bcbdef88d7da99e4f74724f63994451a193fc6`。该 SHA 是**静态验证历史点**，若再提交文档不得冒称最终 SHA 的 CI 已通过。
4. 没有修改冻结 PR139/146/150/153/156、公共 DDL、旧 CI、PDM、真实资金或 main；没有创建 PR。

## 二、已经实证的资金复用阻断

- 冻结 `engineering/f06/transaction-refund-http-pg16/service.mjs` 的 **`verifyTransactionSource()`** 内部硬校验：公共 Transaction 现负责人必须等于原始 PR139 签名负责人，并从 PR146 `f06_real_cancel_ci` 查取消 Origin/Event/Key/Audit。合法 PR153→PR156 来源必须拒绝；不得创建 PR146 假来源解决。
- 同一模块唯一对外的业务写入函数 `requestTransactionRefundCI` / `closeTransactionRefundCI` 会在工作事务中调用上述硬编码旧来源核验，因此新桥接无合法参数可以委托其进行旧资金逻辑与公共 `pending/closed` 转换。
- 原 PR150 中强制资金一致性的 **`depositLedger`、`verifyDepositHistory`、`refundCaseSource`、`balancePool`、`currentPermission`** 均为未导出的内部函数，不存在可由新白名单文件调用的可信稳定资金服务接口；其中 `balancePool` 对 Transaction Refund 又固定依赖 PR150 自己的旧来源验证。
- A 施工单同时明确：上述 PR150 文件**只读**、不得修改冻结父代码；新桥接**不得复制旧状态机或另造独立资金算法**。因此仅在现行文件白名单内不能同时满足“合法新签名来源”“委托既有真实资金计算”和“旧 PR150 不变”。自行使用 SQL 代理伪造 PR146、改旧负责人、注入旧退款副表假事实或直接复制资金算法均违反冻结安全要求。

## 三、建议 A 一次性技术裁决（不请求用户批准常规工程细节）

**优先方案（推荐）**：A 增发**最小化、精确文件白名单**，明确允许将冻结 PR150 的读侧资金原语拆为可复用签名服务（最小安全重构，旧入口调用仍按 PR146 签名来源拒绝新版）；新桥接通过受信的、完整验证 PR139/PR153/PR156 版本化签名实例访问同一资金账本和公共 Transaction Refund 状态转换，保持原 PR150 历史账目、旧 Refund request/close 和 R1 3A 后续签名修正语义不退化。

至少须核查：
- 版本适配与原始 SourceDigest 不互换，原 PR150 对新来源仍 FailClosed；不可绕过 PR153/PR156 签名；
- 事务统一 Vehicle→Transaction→Lock→Refund，原生 3A 资金历史、Lock XOR Transaction、历史快照、幂等与并发锁序复用；
- A 额外写出可改文件与必要旧 R1 父回归；B 不得据本报告直接自行修改冻结模块。

**次选方案（须另行显式授权）**：由 A 明确审核新路径中“最小统一版本财务核心”的结构及承接原 PR150 的方式，避免产生双账本或两套不一致的余额计算；当前 Issue159“不得另造资金算法”约束未放宽前，B 不执行该方案。

## 四、未完成项／不能假定为通过

| 项目 | 实际状态 |
|---|---|
| 新桥接 Refund pending 与无款 closed | BLOCKED，未实施 |
| 原生非超管 PG16 新场景至少 35 | NOT_RUN（0/35） |
| 隔离 HTTPS/TLS 拒绝至少 10 | NOT_RUN（0/10） |
| 不同 Backend 真实并发 / 注错 rollback | NOT_RUN |
| PR150/153/156 必要关联业务回归 | NOT_RUN |
| 原161张表 COUNT/MD5、24迁移及跨物理 OID 完整 Seal | NOT_RUN |
| 同最终业务 SHA 官方 PG16 CI | NOT_RUN |
| B_SELF_TESTED / READY_FOR_A_REVIEW | **不允许标记** |
| A_ACCEPTED / PR merge / main 修改 | 未发生 |

结论：当前有可复用的**签名只读校验实物**，但不能称为合法退款桥接、资金验收或交A独立验收。此阻断属于 A 正式白名单和高风险复用原语的技术裁决，不属于让用户逐项批准常规整改；B 先保持冻结边界并等待仓库正式裁决。