# 名邦汽车 V1｜F06 真实Lock→Transaction｜B定向整改自验与A交接

## 一、主线裁决及本批性质
- 任务：`F06_REAL_LOCK_TO_TRANSACTION_HTTP_PG16_01`，Issue [#136](https://github.com/suzhe868-arch/mb/issues/136)。
- 责任：B仅施工；A独立验收、创建PR及合规合并。原B指定分支 `feat/f06-real-lock-transaction-http-pg16-01`；不得建立Transaction PR或擅自更改main。
- 开工main：`38faaf890bca5a2c7f133c50c9c96901fab03029`；A当前治理main：`35ac839a73d1529a24c3ffde089b8517cb01f78e`（PR138）；原B受审HEAD `c4dbb48a5e602076298fba47d133fd43cec504f3`，官方Run39391407455 / Job118523549413已证明309/309同SHA成功，**但A明确不予验收**。
- A正式整改单：`07_重建工作区/F06真实Lock转Transaction_A主控首轮独立复验_退款签名来源与双后端竞态定向整改单_2026-10-20.md`。上一版本“已经完整覆盖Refund竞态”自验判断由本报告纠正；旧成功Run不代替新整改验收。
- 本次整改**仅**在 `engineering/f06/lock-transaction-http-pg16/**` 和专属 `.github/workflows/f06-real-lock-transaction-pg16-onejob.yml`。不改父F06-3A/3B/3C1、已签DDL、24迁移、旧Workflow、生产接口/Issuer、PDM Final；新增付费预算$0。

## 二、A拒验问题及已落实的代码改动

1. **原生签名退款父源**：`ci-job.sh` 在另一个可销毁PG16库恢复已签161实体父快照之后，保持真实GitHub分支/SHA/Run不变，只对短期受限**子进程**传递冻结父Ref，顺序执行F06-3A→F06-3B→F06-3C1原生`runner --apply/--verify`；不能冒充支付Issuer或手工INSERT签名历史。每次被验签的父源码及源SHA仍来自仓库旧版本。
2. **来源缺失零行Fail Closed**：`service.mjs` 在退款记录为零时也强制检查3B/3C1真实Carrier及签名attestation、旧24迁移Ledger、原生sidecar SHA与Public Catalog签名。缺任一来源直接返回`F06_TX_TRUSTED_REFUND_PARENT_MISSING`或`F06_TX_REFUND_PARENT_SIGNATURE_DRIFT`。合法`closed_without_payment`只在原生签发的origin与先pending后closed两事件、原客户/车/周期/金额、Issuer、close_reason一致且无支付事实时可通过；未知或未签closed硬拒。Pending或已付款依然硬拒。
3. **独立进程真实后端测试**：新增`refund-bridge.mjs`，实际开启独立Node子进程、真实PG16连接、`IsolatedAuth`签名员工Session，经原封不动`requestSyntheticRefundCI`和`closeSyntheticRefundCI`执行，返回每次父服务真实业务连接`pg_backend_pid()`；进程IPC握手在**父验签完成后**才同时启动退款与Transaction请求，不修改父Ref全局变量、不复用测试伪签历史，也不直接INSERT合法退款。
4. **旧正反不减验**：原43条HTTP/PG16原生测试不删减，另新增10条（编号44～53）：真父签名、真pending来源、退款先提交→交易后拒、Refund幂等、交易先提交、后退款拒、双方独立backend同步发起至多一方提交、真closed_without_payment、无签public closed来源拒、无退款行时父Carrier缺失硬拒。旧HTTP Transaction↔Transaction竞争仍保留，但不再冒充Refund↔Transaction。
5. **原子占用及保护**：应用仍在一个PG事务内做Vehicle→Lock锁序、资金来源排除、唯一占用、Lock终态、sidecar、请求键及审计，再检查提交；受限旧Refund服务自行遵守相同Vehicle→Lock锁序。断言资金、Lock、Transaction、sidecar及Pending来源不发生半写，全部为合成事实。
6. **并发严谨性**：独立后端PID和IPC同时启动是必要证据；但原签名`IsolatedAuth.withSession`也锁账号/session。若最终执行在账号锁处串行化，则只能证明真实多后端受控互斥，**不得夸称已捕捉两边同时持有Vehicle行锁**。A依原生日志独立判断竞态覆盖强度，不能仅凭总数达标批准。

## 三、最终官方同SHA门禁

专属Workflow仅精确分支Push+本批paths，单`ubuntu-24.04`标准Runner、单`postgres:16-alpine`、单Job、只读权限，不上传Artifact/付费缓存/PR扇出；`trigger-preflight.mjs`读取当前实际全部Workflow重复验算。

| 完整回归 | 本版最低通过 |
|---|---:|
| 旧父九组原生Node、PG16/HTTP、TLS、安全Source | 257/257 |
| 本轮原Transaction HTTP/PG16 | 43/43 |
| 本轮新增真实签名Refund/竞态/负例 | 10/10 |
| Transaction TLS生产拒绝 | 9/9 |
| **合计** | **319/319** |

所有项目必须在**最终分支HEAD完全一致的官方单Job Push Run**达到`completed/success`、0失败、0跳过、0取消；上一已成功Run #39391407455不够。官方日志要同时包含原生3B/3C1签名父源、PID竞态详情、九组257项、累计Transaction53项和TLS9项，以及原生161张全表逐表COUNT/MD5完整Seal、24条Ledger、Catalog、D1/F06-1/F06-2 attestation、两物理OID恢复和不同backend PID。上述证据由最新官方Run实时产生，不预填虚构的运行ID、PID、OID或散列值。**最终Run/Job/HEAD与实测计数必须在Issue #136最后一条B交接评论逐项固化**；A不得用旧Run数据代替。

## 四、验收边界与交接状态

- 仍未解决的生产阻断：`UPSTREAM_F06_3B_LOCK_PENDING_TRANSACTION_CONVERSION_GAP`、`PRODUCTION_TRANSACTION_SCHEMA_CARRIER_GAP`、`PRODUCTION_FINANCIAL_CARRIER_GAP`。真实收款/退款/支付、真实Transaction Issuer、交易完成、生产部署、客户资料、微信/银行/飞书外写都未授权。F06/F07/F08及V1整体仍`NOT_READY`。
- 此文件是**待最终官方同SHA证据绑定的B自验交接**；若本HEAD对应的Run不成功、OID Seal变化、或两Backend真实性不足，则保持`NOT_READY_FOR_A_REVIEW`并继续整改，不能因写了交接文档自动放行。
- **唯一交接出口**：所有以上门禁确实通过，并由B在Issue #136明文回报受验Run/Job/head与残余缺口时，标记：
  `F06_REAL_LOCK_TO_TRANSACTION_HTTP_PG16_01_B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。
