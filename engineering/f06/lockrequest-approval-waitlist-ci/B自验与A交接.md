# F06-1｜B工程执行与A验收交接（CI-only，执行中）

- 正式任务：`07_重建工作区/F06-1_A主控PDM18锁车申请6小时审批唯一Lock与竞争自动候补_CI隔离正式完整施工单_2026-10-13.md`，从main `9389a1556afb8c6e36e970516965d68056bad89f` 开工。
- 仅新增 `engineering/f06/lockrequest-approval-waitlist-ci/**` 与 `.github/workflows/f06-1-*.yml`。原M94-v26、D1与24条签名Ledger均不改。
- 保留真实PG16员工会话、双后端并发和真实业务表，CI侧表补足审批人、快照、候补稳定顺序，绝不伪称生产Issuer。
- 合成场景结束后销毁整库，在新物理数据库恢复原签并核对全部public+D1业务count/MD5、迁移账、Catalog、D1签名；不依赖手工UPDATE擦除合法业务副作用。
- **尚待最终CI**：真实同SHA 12个Push工作流、至少76/76 PG16 Jobs（H52=52）成功、≥12官方SHA256 Artifact，Source20+及HTTPS7+。只有全部核实才标`READY_FOR_A_INDEPENDENT_REVIEW`。
- 当前：`B_IMPLEMENTING_NATIVE_CI / NEXT_OWNER=B`。真实微信手机号、生产业务身份、实际锁车、Deposit/Refund/交易资金、后续F06-2/3、C/H01及V1仍未放行。
