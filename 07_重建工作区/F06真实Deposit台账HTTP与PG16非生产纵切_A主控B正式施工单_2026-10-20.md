# 名邦汽车 V1｜F06真实Deposit台账HTTP与PG16非生产纵切 A主控B正式施工单

- **状态：** `A_RELEASED_FOR_B_NONPRODUCTION_HTTP_PG16 / NEXT_OWNER=B`
- **日期：** 2026-10-20；**Issue：** [#132](https://github.com/suzhe868-arch/mb/issues/132)
- **任务放行时业务合并SHA：** `3f8a92d59a658fd486c43c31cebd4c01a03b4421`；**本次A状态核验前main：** `adc1cf31d1833cd1a85973865e4f571be7f1140a`；**分支名：** `feat/f06-real-deposit-ledger-http-pg16-01`。
- **强制基线规则：** B开工必须重新读取并基于当时最新main创建分支；以上SHA仅用于追溯，不得固定checkout旧SHA。
- **边界：** 非生产、合成资金事实、真实HTTP与非特权PostgreSQL 16；不授权真实收款、生产资金Issuer或部署。

## 1. 正式依据

开工时重新读取最新main的README、CURRENT_PROJECT_STATE、NEXT_ACTION、PROJECT_STATE、DECISION_REGISTER、A/B/C协作验收规范及本单；若main已前进，必须同步最新main再施工。

产品依据：PDM-19 Final §§2–5（Deposit事实、追加更正/冲正）、PDM-18 Final §§16–28（Lock周期与资金保护）、PDM-02/20/21/25 Final（当前Session、permission+capability、Team/Store/Object Scope、客户安全投影、审计及不可变历史）。既有依赖：F06-3A CI-only PR54、LockRequest真实HTTP/PG16 PR129、Lock生命周期真实HTTP/PG16 PR131、F06-5B CI-only PR61均已合并；它们都不代表生产资金来源已签署。不得新增产品规则。

## 2. 唯一施工目标

在新隔离目录中实现真实HTTP+PG16的非生产纵切，验证既有F06-3A合成Deposit事实/追加纠错合同经真实HTTP请求、当前员工Session与权限Scope执行，并与已合并Lock生命周期资金保护一致。测试路由仅供CI loopback调用，不得注册进正式`engineering/src/app.mjs`、`server.mjs`或生产路由。

必须覆盖：
1. 合成Deposit记录：正整数金额、CNY、允许的支付方式、服务端时间、当前合法Employee，以及同Customer/Vehicle/Listing Cycle的有效Lock；同Lock多笔事实可区分。每条测试事实明确标记`CI_SYNTHETIC_NOT_REAL_MONEY`，不得伪装真实付款或正式凭证。
2. Correction/Reversal追加不可变事件，不得UPDATE/DELETE原Deposit；独立`deposit.ci.correct`权限、合法经理/店长身份与Scope、必填reason；拒绝超冲正、负净额、跨Lock/周期、重复键跨对象、撤权旧Token与并发超额纠错。
3. 幂等、并发与事务：幂等键绑定actor+Lock+Deposit+action+金额；相同请求重放返回原结果，异对象/异金额冲突；真实SQL故障注入验证ROLLBACK无半条业务事实/调整/Audit。
4. Deposit存在时调用已合并Lock生命周期真实服务，验证普通延期/释放/系统到期按资金事实硬拒绝且零部分写入；即使更正/冲正后净额为零也不得自动释放Lock。未知来源继续Fail Closed。
5. 重新检查当前Session、账号状态、role、permission、capability、Team/Store/Object Scope、Customer状态、Lock状态与Listing Cycle。4S、仅凭System Admin角色名、越权员工、停用客户、失效Session及跨Scope均拒绝；错误响应不得泄露凭证引用或敏感资金明细。
6. 生产Issuer、银行/微信/在线支付、真实收款、真实退款、真实Transaction、`refunded`、完成成交、UAT与部署全部拒绝/不实现；正式生产路由仍不存在。

## 3. 严格文件白名单

只允许新增：
- `engineering/f06/deposit-ledger-http-pg16/**`
- `.github/workflows/f06-real-deposit-ledger-pg16-onejob.yml`

严禁修改/删除现有F06-3A/3B/3C/4A/4B/4C/5A/5B/5C、LockRequest/Lock生命周期、`engineering/src/**`、`engineering/scripts/**`、`engineering/sql/**`、`engineering/integration/**`、旧Workflow、公共M94迁移/DDL/24条迁移Ledger、签名Catalog、PDM Final、C端或生产路由。

若现有`public.deposit_receipts`不能安全承载合成主事实，不得修改公共DDL；使用新目录下版本化CI sidecar并报告`PRODUCTION_FINANCIAL_CARRIER_GAP`。不得伪造缺失的签发来源。

## 4. 环境、触发与费用门禁

1. B从执行时最新main创建指定新分支，不复用旧F06-3A分支，不强推、不重置、不改写历史。
2. 唯一工作流只允许精确分支`feat/f06-real-deposit-ledger-http-pg16-01`的`push`+paths触发；一个标准免费Ubuntu Runner、一个PostgreSQL 16服务、一个Job、有限超时、`contents:read`。不得启用PR触发、matrix、付费Runner/缓存、生产Secrets或Artifact上传；新增付费预算`$0`。
3. **首次Push前检查main全部Workflow的push/pull_request paths**，证明本批不会触发F05历史28-Job扇出或无关Workflow；不能证明时停下，把精确触发证据交A，禁止盲目Push、skip-ci或改旧Workflow。
4. Job必须核验真实Repository、实际新分支REF、`GITHUB_EVENT_NAME=push`、`GITHUB_SHA`、`GITHUB_RUN_ID`、`CI=true`、`APP_ENV=test`、`NODE_ENV=test`、F03/F05隔离声明及非特权PG16连接。
5. 旧F06-3A有固定分支签名守卫。若需兼容桥，先由新入口验证真实新分支/Push/隔离环境，显式记录父服务兼容分支和桥接范围；不得无条件伪造`GITHUB_REF`或修改旧服务。若不能在不削弱父守卫的前提下复用，建立新目录下版本化适配器或报告阻断。

## 5. 同一最终SHA的测试门槛

必须真实执行并记录：
- 根Node基线54/54；
- F06 LockRequest PG16/HTTP 21/21；
- Lock生命周期Node 37/37；
- Lock生命周期PG16/HTTP 36/36；
- F05初始化附属测试18/18；
- 现有F06-3A Source 28/28、HTTPS 9/9；
- 新Deposit HTTP/PG16至少24项；
- 新TLS loopback/生产路由拒绝至少9项。

所有测试必须对应同一最终HEAD的官方Push Run，completed/success，失败/跳过/取消均为0。不能把旧SHA结果拼入本次成绩。

必须保留24条F03/F05迁移Ledger、签名Catalog、D1及现有F06父Sidecar完整性证据。当前已签父实体基线为190张表：新增版本化Seal必须在两个不同物理PG16 OID之间，对当前main全部已签父实体执行逐表全行COUNT+MD5比对；不得把旧F06-3A历史160表Seal冒充当前完整基线。若实际签名Catalog与190不一致，先交A核对，不得自行调低或重签。

## 6. B交付与A验收

在新增目录内提交中文`B自验与A交接.md`，记录最终分支/HEAD/main比较、官方Run/Job、测试计数、PG16版本/非特权角色/不同数据库OID与Backend PID、24条迁移Ledger、190张父实体Seal、Catalog/D1/F06 Sidecar、追加不可变、权限Scope、幂等/并发/Rollback、Lock资金保护和生产路由拒绝证据。

满足后标记`F06_REAL_DEPOSIT_LEDGER_HTTP_PG16_01_B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。B不得创建PR或合并main；由A独立复验同SHA代码/日志/范围，再决定标准PR出口。

## 7. 禁止越界

不真实收款、不真实资金纠错、不真实退款、不创建/完成真实Transaction、不改旧F06-3B不安全入口、不开放生产Issuer、不修改公共DDL/PDM Final、不做生产部署/UAT/微信/银行接入。F06/F07/F08与V1整体继续`NOT_READY`。