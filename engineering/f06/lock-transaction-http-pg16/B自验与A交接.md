# F06真实Lock→Transaction｜B自验及交A独立验收报告

## 一、正式状态和证据归属

- 正式Issue：[ #136 ](https://github.com/suzhe868-arch/mb/issues/136)，任务 `F06_REAL_LOCK_TO_TRANSACTION_HTTP_PG16_01`。
- 开工main：`38faaf890bca5a2c7f133c50c9c96901fab03029`；当前施工分支：`feat/f06-real-lock-transaction-http-pg16-01`。
- 上一业务代码成功受验 HEAD：`70305e51d78c1646a1e1810c38a4512129a318e3`。对应官方单 Job：[Run #39388626947](https://github.com/suzhe868-arch/mb/actions/runs/39388626947) / [Job #118514471718](https://github.com/suzhe868-arch/mb/actions/runs/39388626947/job/118514471718)，均 `completed/success`。
- 本交接报告属于后续证据完善提交。**最终交A资格只以报告所在最终 HEAD 对应的新官方 Push Run `completed/success`、0失败/跳过/取消和 `READY_FOR_A_REVIEW` 明文为准**。上一个代码 SHA 的成功不能冒充文档提交后的同SHA成功。
- 当最终 SHA Run 完整成功后，本轮判定为 `F06_REAL_LOCK_TO_TRANSACTION_HTTP_PG16_01_B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`；若最后 Run 未成功则仍 `NOT_READY_FOR_A_REVIEW`，必须修复再验。
- **B不得创建PR、不得合并main**；A独立验收代码、状态与证据后决定正式PR和合并。

## 二、职责边界与文件清单

本批只新增以下路径：

- `.github/workflows/f06-real-lock-transaction-pg16-onejob.yml`
- `engineering/f06/lock-transaction-http-pg16/ci-job.sh`
- `engineering/f06/lock-transaction-http-pg16/server.mjs`
- `engineering/f06/lock-transaction-http-pg16/service.mjs`
- `engineering/f06/lock-transaction-http-pg16/sidecar.sql`
- `engineering/f06/lock-transaction-http-pg16/tests/http.test.mjs`
- `engineering/f06/lock-transaction-http-pg16/tests/https.test.mjs`
- `engineering/f06/lock-transaction-http-pg16/trigger-preflight.mjs`
- 本文件 `engineering/f06/lock-transaction-http-pg16/B自验与A交接.md`

与开工main比对确认原 `engineering/src/**`、`engineering/scripts/**`、`engineering/sql/**`、`engineering/integration/**`、冻结旧F06目录、公共M94/DDL/24迁移、旧Workflow、PDM Final与生产路由均未修改。真实客户/支付/退款/第三方调用仍未接入。新增付费预算：$0。

339个原有Workflow全部核对触发分支与paths；目标新分支在首次Push前确认不会命中其它旧工作流。新增工作流只监听本任务分支精确 Push+本批两路径，单Ubuntu标准Runner、单 `postgres:16-alpine`服务、单Job，GitHub权限 `contents:read`，不上传Artifact、不设付费缓存或矩阵；由入口预检在最终SHA再次断言。

## 三、同SHA回归门槛和既有完整父层

旧父九组严格继承，不调低，不跨SHA拼接：

| 来源 | 官方门槛 |
|---|---:|
| LockRequest Node | 54/54 |
| Lock生命周期 Node | 37/37 |
| LockRequest原生HTTP+PG16 | 21/21 |
| Lock生命周期原生HTTP+PG16 | 36/36 |
| F05来源事件回归 | 25/25 |
| F06-3A Source | 28/28 |
| F06-3A HTTPS生产拒绝 | 9/9 |
| Deposit HTTP+PG16 | 38/38 |
| Deposit TLS生产拒绝 | 9/9 |
| **旧父九组小计** | **257/257** |
| 新Lock→Transaction原生HTTP+PG16 | **43/43**（超过施工单至少28） |
| 新Transaction TLS拒绝 | **9/9**（达到施工单至少9） |
| **全部最末成功SHA门槛合计** | **309/309** |

上轮受验源码 HEAD `70305e51…` 的真实 Run #39388626947 已通过上述309项，且全部0失败、0跳过、0取消；**最终文档HEAD须在本次提交产生新Run后再次独立满足全部门槛**。

旧父F06-3A由原生同 SHA 真正签发的**161张四Schema完整表名+逐表COUNT/MD5 Manifest**，24条原始迁移Ledger、Public Catalog、D1/F06-1/F06-2 sidecar attestation不减验。通过独立物理数据库 OID 和PG16后端PID完整行 Seal 比对，不得仅单库ROLLBACK伪装跨库恢复。

上轮 SHA 的原始证据（仅作技术追溯，不能作为最终新SHA实时值）：首次 Source OID `35222`、审计副本OID `39338`，源库恢复OID `43578`，新Transaction场景销毁后恢复OID `60637`，父完整行Seal摘要 `29a0d5121d9da1697204543fa0b2b0a5f52b9fd98af40ef494195564ad715a99` 前后相同。**A应对照最终Run中的真实 OID/PID/hash 值，而非沿用上轮值。**

## 四、实际业务与安全负例

- 同一物理PostgreSQL16事务内先锁 Vehicle→Lock→核对已签Refund/Deposit→占用Transaction，再令原Lock进入可信终态、追加受限sidecar和审计，最后复核COMMIT；不调用旧F06-3B不安全直接转换入口，不以双事务拼接模拟原子性。
- 当前受签M94 Transaction的物理状态与隔离sidecar真实状态对齐，不篡改正式DDL。签名Session、真实 Employee role/permission override、capability与Team/Store/Object scope在最终受保护事务内检查。
- 旧Lock `pending` Refund、有退款支付事实、未知退款来源或仍有资金责任时硬拒，保证零半成品占用。对退款先提交/Transaction先提交、两PG Backend争夺唯一占用、重复幂等键/异参数、Lock过期/状态变化、Customer禁用、会话撤权、Scope撤权、SQL注入失败及各写入点完整回滚有对应负例。
- 原始Deposit、Correction、Lock来源、退款及其它已签历史只读，不因合成Transaction自动结算、真实退款、调整价格或宣称成交。
- 生产路由不存在；CI HTTP只监听 `127.0.0.1`。TLS覆盖真实Transactions、Refund、Payment、Lock release及合成CI路径的硬拒，客户端伪造角色不得越权。

## 五、残留风险和最终交接

仍然开放：`UPSTREAM_F06_3B_LOCK_PENDING_TRANSACTION_CONVERSION_GAP`、`PRODUCTION_TRANSACTION_SCHEMA_CARRIER_GAP`、`PRODUCTION_FINANCIAL_CARRIER_GAP`，以及正式Source/生产Issuer/UAT/部署缺口。**本次仅代表隔离PG16合成非生产纵切验收，绝不等于真实Transaction或真实资金上线**。F06/F07/F08和V1产品整体仍 `NOT_READY`。

A主控独立验收应从本文件所在最终分支HEAD取得真实官方同SHA Run，验证 Job `completed/success`、九组257加Transaction43/TLS9、父161张全表真实来源与恢复、两Backend/退款安全硬拒、触发白名单，以及主线未改/无越权文件；通过后A自行创建标准PR及合规合并并更新五项main状态。本报告不自行声称已获A验收或已合并main。
