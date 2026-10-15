# F07-1｜B最终反向安全审查与验收门禁

> 仅对应隔离CI合同，冻结F03/F04/F05/F06不可修改。真实证据以 [PR64](https://github.com/suzhe868-arch/mb/pull/64) 最后唯一SHA的官方Job与Artifact为准。

- [x] 仅新CI目录和 `.github/workflows/f07-1-*.yml` 新增；非破坏性、未动main与旧迁移。
- [x] PDM-09 Collector→名邦，不使用名邦→Collector旧电话API；无真实JYT和生产凭据。
- [x] 复合publisher键、单flight、latest保旧号、历史不可变与回传幂等。
- [x] F03已签policy纯函数真实import，PG当前Employee/Session/Scope/source状态真实事务读锁；硬拒绝4S/System Admin业务和个人DENY。
- [x] PG16真双Backend并发、SQL注错ROLLBACK、真实Docker PostgreSQL16重启及重放/乱序安全回归。
- [x] Run38702053603，提交012df1b80d9297bd4701350c65c075ca9fe6886d，Source40/40、HTTPS15/15两Job成功，官方非空SHA256工件两份。
- [ ] 在写入本最终报告后，核查**本报告所在最后唯一HEAD**新增真实push两Job completed/success及非空、未过期、匹配SHA的官方Artifact，并将Run与SHA写入PR最终说明。**未完成前不宣布正式READY。**
- [x] 正式Integration实际生产接线和真实员工PG来源：明确`SOURCE_GAP`，非本包生产目标。F07/V1仍`NOT_READY`。
