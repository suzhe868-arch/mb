# F06-5B｜B工程独立自验与A验收交接（正式证据以PR最新SHA评论为准）

## 一、状态与唯一来源
- A正式施工单：`07_重建工作区/F06-5B_A主控旧Lock待退款禁止Transaction转换原子前置守卫_CI隔离完整施工单_2026-10-14.md`；唯一起点main：`5f4a7e02ae9a9362104cd1081840fe9a8a1b733f`。
- B工作分支：`feat/f06-5b-lock-refund-conversion-guard-ci`；GitHub [PR #61](https://github.com/suzhe868-arch/mb/pull/61)。保持DRAFT、禁止B合并main。
- 最新CI验证结果及最终SHA必须使用**PR最新B正式评论中的可追溯Run/Job/Artifact原生链接**，不能把前一次SHA的绿灯转移到新提交。
- 门禁：`21/21 event=push workflow`、`94/94 真PG16 Job（H52 52个冻结Job）`、`54/54 Source`、`9/9 HTTPS`、≥30份官方本SHA有效`sha256:` Artifact、188父表COUNT+MD5与24迁移Ledger、D1/前9父Sidecar、双真物理OID审计全封印；任一不成立不可交A。

## 二、代码与来源/权限边界
- 仅新建 `engineering/f06/lock-refund-conversion-guard-ci/**` 和 `.github/workflows/f06-5b-*.yml`；原F06-3B父入口保持冻结已知安全缺口，不冒充已修复。
- 新入口 `openGuardedSyntheticTransactionCI`：同PG物理Session/事务内Vehicle→Lock行锁、动态员工登录与permission/Scope、Customer/Vehicle/Cycle、旧Lock signed Refund pending/refunded/paid/closed校验、F06-3A signed Deposit及Correction余额、占用唯一性、Transaction/Lock/原3B来源、不可变5B Guard事件与审计、写入前和提交前重验。未知资金与不可信来源FailClosed。
- 可追溯专项测试：S05–S10真实旧Lock pending拒绝且无半写、S11–S16无付款closed后的合法原子转换和幂等、S23–S25 Sidecar不可变、S30–S34三阶段ROLLBACK、S35–S40双Backend单赢家、S41–S44真实旧退款/新转换竞争、S45–S49权限撤销/Scope失效/Customer停用/4S身份拒绝、S50–S52权限恢复+反向旧Lock退款拒绝、S53–S54冻结父3B漏洞真实重现并新入口同数据阻断且不得漂白旧签名。
- HTTPS9：仅loopback TLS，生产交易/资金Issuer保持UNWIRED/SOURCE_GAP；禁止真实Refund、refunded、completed、外部业务接口、生产数据、UAT与部署。

## 三、2026-10-14已取得的前序SHA真实证据（仅用于定位，不用于最终放行）
- 前序SHA `b0ebce5f7889d3e034d8b3d32a30730dc7b7583e` 的[本批CI](https://github.com/suzhe868-arch/mb/actions/runs/38544310450)真PG16 Source `44/44 PASS`、HTTPS `9/9 PASS`，父5A Source `82/82 PASS`、4C `102/102 PASS`。
- 同轮5B双物理数据库 `OID 63424→68463`，旧188父表逐表COUNT+MD5、24条迁移、Catalog、D1、9 Sidecar封印均PASS。官方原生Source Artifact `sha256:c2e3a83d541599bd272af95d0ddfe86ea77fb7259a4abd2d2d3c0a02fbbf8a3b`；HTTPS Artifact `sha256:1b0ba99f2c5391de40a7db79ab7c992cf693d9c4cc91ea8105afd8f2c5bc625c`。
- 以上仅说明已验证的前序版本行为；新增S45–S54是B逆向安全复检整改，必须在**新最终HEAD重新得到94/94和全量封印**，以GitHub官方实时证据为准。

## 四、B向A提交方式
- 只在最终HEAD完整真Push和工件封印全部绿灯后，于PR #61提交中文最终自验评论 `F06_5B_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`，附全部Run/Job/Artifact IDs、Digest、负例与双物理OID，并取消草稿交A；未经此终门禁保持 `B_CI_REVALIDATING / NEXT_OWNER=B`。
- A独立重新获取官方GitHub Logs/Artifact和签名，不接受历史SHA合格结果。全局`F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`，不得因本CI完成宣称产品上线。
