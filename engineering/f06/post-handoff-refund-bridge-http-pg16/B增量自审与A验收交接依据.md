# 名邦汽车 V1｜F06 Issue #159｜B 增量自审与 A 验收交接依据

> B 工程任务：`F06_SIGNED_POST_HANDOFF_CANCEL_TO_TRANSACTION_REFUND_BRIDGE_01`。  
> 当前分支：`feat/f06-signed-post-handoff-refund-bridge-01`。  
> A 裁决：治理 PR #161 已于 2026-10-21 合入 `main@2b2902d7293f64bcd3839e84788457928bc254e9`。  
> 本文仅记录已执行、可复核的事实；**本分支是否达到 `READY_FOR_A_REVIEW`，以最终业务 HEAD 的专属 GitHub Run/Job 完整成功、严格TAP自验和 A 正式验收为准，不可仅凭文档标题或历史成功宣称**。

## 一、增量施工实物

- 原 PR139 签名 Transaction、PR153 版本化 Handoff、PR156 原子 Cancel 使用 `签名来源只读核验.mjs` 统一验证 Origin / Event / RequestKey / Audit / 版本 / 原始与当前负责人 / 同 Lock-客户-车-周期签名一致；只读验证本身不授予退款权。
- PR150 `transaction-refund-http-pg16/service.mjs` 仅受控抽出 `finishSignedTransactionSource` 并复用同一退款 Request/Close 内核；两个签名适配器：原 PR146 仅走旧 `verifyTransactionSource`，新 PR153+PR156 仅走 `verifyTransactionSourcePostHandoff`。旧公开入口对新来源继续严格拒绝。
- 新入口只有 GitHub 正式 Push / 指定分支 / 非生产环境 / 原签父链 / 真实签员工 Session / Transaction Refund 权限与 Scope / 当前负责人都成立时才能在同一 PG 事务创建合成 Pending、零真实支付 Closed；锁账、不可变 Origin/Event/Key/Audit、历史 3A 修正、水位、净额、幂等与回滚仍复用 PR150 同一内部实现。
- 禁止状态和外部生产接口保持硬拒：真实支付、`refunded`、`completed`、生产 Issuer、线上 API 路由、真实资金和真实客户数据均未授权。
- 使用单一专用 `.github/workflows/f06-signed-post-handoff-refund-bridge-onejob.yml`，先重跑受影响签名父链，再以原生非特权 PG16 和 loopback HTTP/TLS 新测试验证。

## 二、父工程原始文件哈希对比（Git Blob SHA）

| 文件 | 最新 main 基线 | B 工作分支 | 结论 |
|---|---|---|---|
| `transaction-refund-http-pg16/service.mjs` | `a00d0d77d24a79eea579c3a2df9893bdcd95ac4d` | `1badf6d163e0c1f8a564bcc70b0d7b24cc121fb3` | **有变更**：抽共享内核与新来源接线；不是字节不变 |
| `transaction-refund-http-pg16/sidecar.sql` | `1247bd6281b9092b0b7ffe648dcfcbd4e425d54c` | 同左 | 字节不变 |
| `post-handoff-cancel-http-pg16/service.mjs` | `fcde864b1e3a6294b55912ca789b00aefbae1b10` | 同左 | 字节不变 |
| `transaction-handoff-http-pg16/service.mjs` | `56e9ad5e1cca7086e89fd544ad567a541f835a54` | 同左 | 字节不变 |

新签名来源与 PR146 的旧 Origin/Event/Key 没有互换，公共 24 条迁移和现有父侧车文件未修改；旧入口原受限行为不解除。

## 三、原生测试与证据

- 历史当前代码业务运行 <https://github.com/suzhe868-arch/mb/actions/runs/39504794633> `completed / success`、SHA `5d14cf28933d53d941d44106839bab6b2d12cf55`：**原生 130/130**（原 PR156 84 + Issue159 新 46）、原 HTTPS 11/11、新 HTTPS 12/12，0 fail / 0 skipped；父旧 PR150 79/79、Handoff 40/40 均在该 SHA 的继承测试里重演。
- 在该运行中真实退款 Pending：`backendPid=2313`；独立 Backend 竞争：`2384` 与 `2385`。新请求涵盖原负责人拒绝、不同Version、权限、余额过界、3A合法请求后追加与快照水位、重复同Key、恶意换Key、注错Rollback、不得复活 Lock、无付款关闭。
- 父跨物理 OID Seal：`97328 → 107138`；161 张父表、24 条签名迁移；完整逐表 Seal 保持 `8ee33d8a7cac23ffa52c1e2edc0f8f664c87b10ea88b062648047371d41a7c45`。
- B 在审日志时发现旧 Shell `tap()` 采用无条件末行输出，一处过渡用旧 TLS 汇总文件误打印了 `tests=0 pass=0`，尽管**原生 TLS 输出**独立显示 11/11 和 12/12 均实际执行成功。B 因此增加 `严格原生测试证据校验.mjs`，由同 SHA 专属工作流保存完整原生 stdout，再**独立强制验证**两组真实 TAP 摘要、联合130/130、两Backend证据、父161表24迁移的不同OID Seal；旧 0/0 汇总**不能作为**通过依据。新增最终 CI 若缺任何一项必须 fail。
- 上述 Run #39504794633 是修订严格计数之前的历史执行点，不得充当最后新增严格门禁的同 SHA 最终验收。**最终 Push Run 和最终 SHA 必须从 GitHub 当前分支最后一次工作流取得，并在 Issue #159 完成 B 交接时登记。**

## 四、B 自审与遗留边界

- 增量自审围绕五个已验父代码 PR139/146/150/153/156 的直接受影响的签名、资金、权限、回滚，未对 F01～F05 重新执行全阶段审计。
- 当前实现未新增生产资金、真实支付或外部服务许可；未写 `main`、未创建或合并业务 PR、未修改 PDM、未进入 F07/F08。
- A 独立验收仍需特别复核 PR150 原入口 FailClosed、桥接对当前负责人的独立 Scope、签名父历史与 3A 增量修正及新旧退款的余额交叉约束。
- 若最终专属 Run/Job 未全部 success、严格 TAP 校验未通过、或父 Seal 不匹配，状态必须维持 `NOT_READY_FOR_A_REVIEW`，B 不能提前交 A。
