# B 自验与 A 独立复验交接｜F03→F07 Ed25519（限定非生产）

## 交付边界

任务：`F03_F07_PUBLISHER_PHONE_ED25519_AUTH_NONPROD_01`，Issue #248，指定分支 `feat/f03-f07-publisher-phone-ed25519-nonprod-01`。本包只证明 CI 内协议、真实 PG16 当前权限读取、Ed25519 验签、一次性 challenge 原子消费和 F07 Guard 二次校验。

精确白名单只有本目录 `engineering/f03-f07/publisher-phone-ed25519-nonprod/**` 与 `.github/workflows/f03-f07-publisher-phone-ed25519-nonprod.yml`。所有既有 F03/F05/F06/F07 业务源码、Guard/Runtime、公共 Schema/Migration、PDM/IA、旧 Workflow、app/server、PC/C 均冻结只读。

## 复用的既有权威

- F03/F04 员工专项权限 Issue #221 / PR #224：当前会话、个人 deny、专项 Scope/Binding、生命周期快照。
- F07 电话 Guard Issue #190 / PR #193：每次签名成功后仍调用原 `authorizePublisherPhone` 重新读取当前员工权限、当前 JYT wholesale/active 车辆、发布人映射及当前周期 Lock。
- 不改 F03 通用 current-facts 的 fail-closed 规则；不添加 TECH_ALIAS 或正式权限。

## 本包必须实证的项目

- 两个独立 PG16 非超管 Job，同一最终 SHA，F03 与 F07 使用独立数据库。
- 本轮业务测试预期精确 38 个独立断言（高于原施工单最低 24 项），HTTPS 22 个黑箱断言（高于最低 12 项），所有测试零跳过；包含正确授权、锁车模式、错误车辆来源、签名篡改、issuer/audience/kid、字段绑定、时效、顺序/并发重放、个人 deny、撤权/Scope、员工/角色/门店变化、F03/F07 依赖失败和 Guard 二次拒绝。
- PR #250 A 定向整改新增 B33-B38：真实员工停用后新签发拒绝、已签发断言经原 Guard 拒绝、真实 `IsolatedAuth.logout` 会话撤销后新签发与旧断言验证均拒绝，以及正确重签的 `listingCycleId`、`capability`、`version` 三个独立错配拒绝。最终是否通过以同 SHA 官方 TAP、PG16 Job 与 Artifact 为准，静态矩阵不替代实测。
- TLS 客户端显式信任一次性测试证书，未关闭全局 TLS 校验；私钥只在内存，绝不进入日志或 Artifact。
- 同 SHA 官方 Run/Job、PG16 身份、TAP、旧工作流触发审计、Artifact ZIP digest 与内部文件 SHA 清单由最终运行证据绑定。

## A 复验建议

1. 以最新 `main` 对比本分支，确认差异只在两个授权目录。
2. 查看 `f03-f07-evidence.json` 与 `最终运行交接.md` 中最终 HEAD、Run/Attempt、两个 Job 和各测试计数。
3. 独立下载两个原生 Artifact，核对官方 ZIP digest，再按 `f03-f07-sha256sums.txt` 逐项复算；确认没有私钥、session token、电话或原始凭据。
4. 抽查 `issuer.mjs` 的每次当前事实读取、`verifier.mjs` 的原子消费与 Guard 调用、`harness.mjs` 的 TLS/Host/Origin/CSRF 和生产默认未注册。
5. 旧 F05-7 历史 66 项/Oracle 明确未运行，不得把本包结果扩张为该历史项成功。

## 残余阻断

正式 Source Issuer/公钥信任根、F07 正式 Runtime 接线、真实 JYT/Collector、CDN/OSS、飞书、真实电话/客户、资金及生产均未接通/未授权。Issue #187 仍 `SOURCE_GAP/FAIL_CLOSED`；F06/F07/F08/V1 仍 `NOT_READY/NO_PRODUCTION`。B 不合并 main、不关闭 Issue #248、不修改五项权威状态。最终 SHA/Run/Job/Artifact 的实测值以官方 Artifact 内同 SHA `f03-f07-evidence.json` 和 `最终运行交接.md` 为准。
