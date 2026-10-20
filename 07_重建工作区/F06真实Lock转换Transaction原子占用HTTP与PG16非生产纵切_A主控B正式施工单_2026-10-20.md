# 名邦汽车 V1｜F06真实Lock→Transaction原子占用 HTTP 与 PostgreSQL 16 非生产纵切｜A 主控 B 正式施工单

- 任务ID：`F06_REAL_LOCK_TO_TRANSACTION_HTTP_PG16_01`
- 状态：`A_RELEASED_FOR_B_NONPRODUCTION_SYNTHETIC_TRANSACTION_HTTP_PG16`
- 负责人：**B工程执行**；独立验收与合并负责人：**A主控**
- Issue：[ #136 ](https://github.com/suzhe868-arch/mb/issues/136)
- 施工分支：`feat/f06-real-lock-transaction-http-pg16-01`，必须从 B 开工时最新 `main` 建立；不可固定检出本文中的追溯 SHA
- 上批通过：F06真实Deposit HTTP/PG16的 [PR #135](https://github.com/suzhe868-arch/mb/pull/135)，B HEAD `8598df31d71ed3d9e2e13dcdc962002b152f152a`，A 标准 merge `ffcf9d8609fc9972a0a8780012ddbc52f85cc221`；官方 [Run #39379307863](https://github.com/suzhe868-arch/mb/actions/runs/39379307863) 同SHA九组257/257、0失败/跳过/取消，原生161父实体Manifest封存与OID恢复 PASS
- 产品整体：`NOT_READY`；生产资金/支付/Refund与上线从未授权；新增付费预算 **$0**

## 1. 唯一规则来源及冻结前置

1. 读取执行时 `main` 中六份主控权威状态文件及本单、`07_重建工作区/A_B_C三窗口协作与验收规范.md`。产品 Authority：`07_重建工作区/PDM-19_最终完整规则.md` §2、§5～11、§15、§21、§24～28；`PDM-18_最终完整规则.md` 当前Lock/Waitlist/到期/历史；PDM-02/03/17/20/21/25 Final的真实Session、permission、capability、Team/Store/Object Scope、归属/公海、只读客户安全投影与不可变审计。不得发明新Transaction/Refund状态、完成规则或权限。
2. 已验父服务：F06真实LockRequest/审批候补PR129、普通Lock生命周期PR131、真实合成Deposit台账PR135；之前F06-3A/3B/3C、4A/4B/4C、5A/5B/5C为隔离CI-only候选，不能冒称生产Issuer。特别保留已证明的 `UPSTREAM_F06_3B_LOCK_PENDING_TRANSACTION_CONVERSION_GAP`：旧F06-3B直接入口存在旧Lock pending Refund→Transaction转换风险；F06-5B仅隔离守卫，不能仅靠串联两个不同PG事务消除竞态，不得改变旧服务或称其已修。
3. 业务目标仅一条**真正非生产 HTTP→PG16**合成Lock到首笔in-progress Transaction的原子流程。不得将任何合成事件表述为客户真实付款、合同或交易；生产Transaction物理表的状态载体如与PDM19不一致，采用新目录版本化隔离Sidecar显示状态映射并记录`PRODUCTION_TRANSACTION_SCHEMA_CARRIER_GAP`，绝不修改公共DDL或者放行生产Issuer。

## 2. 本包须实际实现的正反路径

1. **现时锁与来源**：只接已经通过签名的现时active Lock，引用当前Customer、Vehicle、Listing Cycle和已签Lock快照/原responsible；必须重新验证当前合法Employee session、在职状态、真实角色+permission+capability+Team/Store/Object Scope、Customer状态、禁用及跨组织；不得凭SystemAdmin控制平面角色、4S身份或客户端声称权限放行。签发、撤权、Scope及Lock状态的检查必须与写入处同一受保护PG事务，Fail Closed。
2. **真实原子转换**：一笔PG16事务内按确定性的 Vehicle→Lock→相关签名Deposit/资金及Lock Refund→Transaction状态/唯一占用→来源和追加Audit顺序取得行锁；在COMMIT之前重新验证当前状态。转换时旧Lock按受信终态约束结束、生成合成在途Transaction与source_lock_id、Vehicle/周期、责任人以及占用，不出现只关Lock未建Transaction或同时两个in-progress。公共Transactions状态载体不支持 `in_progress` 时仅在隔离sidecar建立语义映射并验证真实公共行状态与sidecar原子一致，不允许伪造生产结构。
3. **旧Lock pending Refund 原子前置**：在任何旧Lock存在合法pending Refund、已真实支付的Refund、关联退款资金来源不明、原签名源/Carrier缺失时，必须同事务中硬拒Lock→Transaction，确保0部分写入；退款先提交/Transaction后提交、Transaction先提交/旧Lock退款后提交，以及两个独立PG backend并发抢锁三种时序必须正反验证。不可简单前置SELECT后另调用旧3B独立事务入口；真实无法同事务复用父安全路径时新增受限版本化安全adapter或报`BLOCKED_UPSTREAM_TRANSACTION_ATOMICITY`。
4. **金额及历史不更改**：旧Deposit、Correction/Reversal、退款、Lock签名、价格快照、Priority、Waitlist、Recommendation、Consultation、Demand、公海相关历史只读；不自动退/结/转旧款、不恢复旧Lock或Priority、不静默转责任、不回写原事实。未知资金Issuer或未完成资金责任须Fail Closed。
5. **幂等、竞态、撤权、回滚**：一个Actor+Lock+action+完整参数的幂等键在相同请求重放有同一个安全结果，异对象/金额/周期冲突；双PG后端只允许一个合法占用赢家；注入SQL错误、锁等待超时、deadlock/serialization异常、Session撤权或scope变更时必须0半条占用/Lock终态/sidecar/audit，对原始签名父事实只读。
6. **生产/用户安全**：只开CI回环`127.0.0.1` HTTP端口及受限TLS安全拒绝路径；生产`engineering/src/app.mjs`/`server.mjs`不注册新路由，真实Transaction创建/完成/cancel、真实成交价、真实收款/退款/支付、微信/银行/飞书/JYT写入、真实客户账号、完成纠错、换车、UAT与部署一律不实现、不开放。错误响应不泄姓名/电话/VIN、Token、内部资金详情或未授权侧的占用信息。

## 3. 严格可写路径、运行环境与触发

仅允许**新增**：
- `engineering/f06/lock-transaction-http-pg16/**`
- `.github/workflows/f06-real-lock-transaction-pg16-onejob.yml`

不允许删除/修改其它旧父 `engineering/f06/**`、`engineering/src/**`、`engineering/scripts/**`、`engineering/sql/**`、`engineering/integration/**`、24条迁移Ledger、公共Catalog/DDL/M94、PDM Final、旧所有Workflow、C端和正式生产路由。不得在本包修改生产权限或角色；CI数据须只为合成数据、无真个人隐私。

单GitHub公共标准免费 `ubuntu-24.04` Runner、一个 `postgres:16-alpine` 服务、一个Job，`contents:read`、精确**本分支push+本批paths**，不设pull_request触发、不使用matrix/付费Runner/Cache/Artifact上传，费用新增授权$0。B首次Push前对执行时main**全部Workflow**进行匹配证明，不能证实其它旧工作流不扇出则暂停报告A；禁止skip-ci或伪造运行事件。受限PG16角色无superuser、CREATEDB/CREATEROLE；根程序核验真实Repository、GITHUB_REF、Push、SHA、Run ID、CI/APP_ENV/NODE_ENV=test、loopback和独立隔离声明。

可为历史父CI测试创建**本包受限兼容桥**：对真实仓库、分支、Push、SHA、Run和非生产测试权限完整先验证，仅给特定旧子进程单独设置父Ref用于父签名守卫，不修改实际GitHub变量或父源码；源码必须可独立审计，不可用假数据代替原签发来源。

## 4. 同一HEAD真实测试、完整父实体与禁止的捷径

1. 同一**最终提交 SHA**的单一官方Push Run、单个Job全部 `completed/success`、0失败/跳过/取消，至少继承原 F06真实 Deposit 门槛：原Node54、Lock生命周期Node37、原锁车PG16/HTTP21、生命周期PG16/HTTP36、F05 Source Event测试**不少于当前25**、旧F06-3A Source28/HTTPS9、真实Deposit HTTP/PG16 38/TLS9，且父真实签名来源、资金保护/拒绝测试不可删除减弱。若现行main合法新增用例则提升验收总数，不得削弱至旧值。
2. 新Transaction HTTP/PG16 至少**28条真实非特权PG16**正反例（包含正常原子建Transaction+Lock结束、退款阻断、幂等并发、两PG Backend时序、权限/Scope撤权、Customer disable、旧资金历史不变、无资金与未知来源、Rollback/注错），新增TLS回环拒绝至少**9条**；非生产 HTTP 请求必须经过真实隔离数据库事务，不接受只Mock或仅源码检查。
3. 正式迁移父链保持24条Ledger真实 SHA、Public Catalog、D1/F06-1/F06-2 attestation，F06-3A及已验Deposit侧证据不降级。B使用**本Run原生已验签、同SHA**的父实体Manifest进行完整独立逐表COUNT/MD5、表名集合、双OID/恢复核验；**161是PR135父层四Schema已验证基线，不应被硬编码为新扩展sidecar后所有表数**。如新main原生父集合变化需上报A，不得凭空增减实体、假签名或只做schema核对。每个场景真实不同PG16数据库OID及backend PID、真实销毁再恢复，不可只在单库rollback伪装第二库。
4. 保留场景前后旧Lock、真实PG合成Deposit及Correction和已签Refund实体的COUNT/MD5及原业务事实/占用保护证明；测试通过不能说明旧F06-3B直接入口已经可信。它必须继续隔离Fail Closed，不引入任何生产写路由。
5. B最终在本目录提交中文`B自验与A交接.md`，完整写出base main/最终分支HEAD、11+新增文件白名单比较、同SHA官方Run/Job及所有测试计数、PG16非超管身份/OID/PID、24迁移及逐表Seal、权限/幂等/并发/资金保护/完整性负例、旧3B缺口与真实Issuer缺口；满足后写`F06_REAL_LOCK_TO_TRANSACTION_HTTP_PG16_01_B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`，**B不可新建PR或合并main**。A独立审核真实代码及官方日志，符合后方标准PR合并并更新五项main状态。

## 5. 不得据此扩大授权

本施工包未授权任何真实资金、支付、退款、生产Transaction/Refund Issuer、正式Schema迁移、真实Transaction completed/cancelled动作、Customer/Employee实际账户接入、外部服务调用、H04/UAT或部署。F06/F07/F08与V1生产整体依然`NOT_READY`。B仅在本单内连续施工直到有效自验交A，不需用户逐项点继续。
