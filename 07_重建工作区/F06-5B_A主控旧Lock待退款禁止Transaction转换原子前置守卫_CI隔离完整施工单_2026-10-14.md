# 名邦汽车 V1｜F06-5B A主控完整正式施工单：旧Lock pending Refund不得转换Transaction（仅隔离CI）

> **正式技术放行（2026-10-14）**：`F06_5B_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_5B_PRETRANSACTION_LOCK_REFUND_PENDING_ATOMIC_GUARD_CI_ONLY`。本单是对已签PDM-19 §21跨源退款排他规则的**工程封堵与证据补齐**，不是任何新产品裁决，**不得真实收退资金、refunded、completed、UAT、生产服务、生产Issuer、第三方访问或上线**。

## 一、背景、法定Authority与独立前置
1. 唯一产品Authority：`07_重建工作区/PDM-19_最终完整规则.md` §19～26，尤其 §21 “Refund subject=Lock XOR Transaction；一旦已有owning Transaction，Lock侧不得退款；同周期冲突pending不许重复占额，最终提交原子复验”；配合PDM-18合法Lock、PDM-02 Session权限/Scope、PDM-17公海保护、PDM-25不可变审计及当前IA/Low-Fi。禁止扩展任何业务状态机。
2. 正式主线已A独立验收并合并F06-5A [PR60](https://github.com/suzhe868-arch/mb/pull/60)：B唯一受验HEAD`6695c9328ea81dd984d6404d9d7393fe153d693d`，merge SHA`5d45a6bdb1debc9db6a79a16e9c8b9b177fb5afb`；20条真正同SHA Push、92/92 PG16 Job（H52 52/52）、新Source82/82、HTTPS9/9、92份本SHA有效官方Artifact及旧184表双物理OID58366→63421 Seal。中文A报告：`07_重建工作区/F06-5A_A主控第三轮独立验收82项Source92项PG16与92工件_PR60正式合并报告_2026-10-14.md`。
3. **真实存在的上游漏洞**：F06-5A最新Source S70/S71证明，通过真实F06-3A签名Deposit + F06-3C1合成Lock Refund `pending` 之后，**冻结父F06-3B `openSyntheticTransactionCI` 仍允许同Lock转换为Transaction**。旧F06-4A取消因此拒绝，5A侧FailClosed，但已发生不应有的owner Transaction。必须在转换原子COMMIT之前修复排他。**原F06-3B入口安全性未获认证，不准声明旧入口已修好**。
4. A工程裁决：仅可新增一个**独立版本化CI安全转换入口**（本包`F06-5B`），在与锁车、旧Lock Refund、Transaction写入完全相同的PG事务及Vehicle级锁下，复用已签父授权/来源/历史契约，在真正COMMIT前再次校验签名退款；凡来源不足立即FailClosed。不能把“先查旧pending、释放锁后调用旧3B独立事务API”当原子修复，也不许只做只读报告/绕过旧真实反例。保留父F06-3B源码原封，旧CI直接入口作为**已知不安全的历史测试基线**，正式工程适配路径必须只使用新版安全入口并单独示证；没有办法以正确锁序复用父结构时返回`UPSTREAM_TRANSACTION_CONVERSION_ATOMIC_SOURCE_GAP`，不伪造修复成功。

## 二、工作分支、白名单与环境
1. B以执行时**真实最新`main`**创建独立分支：`feat/f06-5b-lock-refund-conversion-guard-ci` 和独立PR；只允许新增 `engineering/f06/lock-refund-conversion-guard-ci/**` 和 `.github/workflows/f06-5b-*.yml`；不修改任何已有F03/F04/F05/F06父源码、父workflow、M94/public签名DDL、已有24条迁移账本、PDM Final、现行main、前端或生产路由。CI中新建非生产Sidecar可追加独立版本签名/审计，绝不替代/覆盖旧父Seal。
2. 环境与授权门禁与F06-5A一致：GitHub真实 `event=push`、签名 `GITHUB_REPOSITORY=suzhe868-arch/mb`、`GITHUB_REF=refs/heads/feat/f06-5b-lock-refund-conversion-guard-ci`、`GITHUB_ACTIONS=true,CI=true,APP_ENV=test,NODE_ENV=test`、真实`postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test`，PostgreSQL16 `f03_ci` 非superuser/无CREATEDB，隔离声明F03_1与F05_2必须同时生效。禁止任何生产数据/密钥/外部写入。GitHub workflow权限`contents: read`。
3. 强制验证原`public.refund_cases`的`lock_id XOR transaction_id`、`status`、`close_reason`、`refund_payments`以及F06-3C1`refund_origins`真实签名、F06-3A真实Deposit与Correction、F06-3B Lock→Transaction信任链和F06-5A的`signedBalance`逻辑；缺失公签承载必须标`SOURCE_GAP`。原父表结构、已验收迁移与签名均只读，不得新开生产交易Issuer。

## 三、原子工程目标
1. 新CI安全转换入口必须在**同一个PG物理Session/同一Transaction**内按Vehicle→Lock→现时Customer/Employee/Session+permission+Scope→签名Deposit及Ledger→旧Lock Refund pending/refunded/paid占额→Transaction唯一在途/原Lock转换Source→append-only Audit/VersionedSidecar→COMMIT最后重验的规范锁序执行。任何从合法Lock `active` 转`in_progress`前存在同`lock_id`、同vehicle/listing_cycle签名的旧Refund `pending`/真实`refunded`/有payment或资金来源不明必须硬拒，不更改Lock/Transaction/Refund/Customer/Vehicle/Owner/公海和Sidecar。已合法`closed`且无付款历史，不误判为pending，但仍受真实余额、其它未完资金/来源条件约束。不能只按API输入`subjectKind`判断。
2. 原老F06-3B直接入口因已证明有缺口，测试矩阵须保存**旧缺陷存在的真实反例**，新版安全入口必须在同样历史数据拒绝；不得通过删除旧用例、patch已冻结父文件或绕过数据库认证达成PASS。可基于父签名SQL行为建立CI-only受限versioned原子Adapter，但禁止双事务TOCTOU、不声明改动冻结父生产API。
3. 旧F06-3C1退款申请与新Transaction转换**两个独立真实PG backend竞争**：正向顺序Lock pending先提交→Transaction拒绝；反向Transaction先提交→旧Lock新退款拒绝；同时开始竞争→至多一个COMMIT，败方安全拒绝、0半写。相同requestKey与不同requestKey重放/撤权、无金额和跨cycle、第三方4S/SystemAdmin/越Scope/旧Session、员工降权、Customer disabled必须完整FailClosed。锁超时/序列化冲突与异常注错ROLLBACK测试，要记录双方PID/SQLSTATE/旧签名余额。
4. 旧Lock pending退款不占Vehicle但保护Customer公海；合法Transaction在途独占Vehicle且保护Customer；旧pending已closed时不得自动恢复Lock、不得伪造交易签名、不得把closed算作已退款。Price/Recommendation/Priority/Waitlist/Owner原始签名不可被转换冲突误写。
5. 新Sidecar必须`CREATE`后独立`verify`、前后双真实PG不同物理OID及旧public、D1、F06-1/2/3A/3B/3C1/4A/4B/4C/5A **至少188张父实体**逐表全行`COUNT+MD5`一致；24条Ledger、Catalog/D1、前9批签名Sidecar完整原字节不漂移。真实业务情境库实际DROP后重建只读审计库，至少两不同Backend PID；DDL与业务注错均必须真实ROLLBACK。
6. 明确拒绝`refunded`/真实付款、completed交易、转移资金到新车/真实Customer Employee/银行微信/生产Issuer/新角色永久权限及任何上线。原F06-5A`refunded`禁令、公海保护与当前负责者Scope必须继续守住。

## 四、完整CI与交接终态
1. 本域`Source`至少 **40条**真实非特权PG16正反、并发与故障注入、签名来源守卫，`HTTPS`至少 **9条**真实loopback TLS生产Issuer拒绝（禁止把本合成Adapter暴露HTTP业务写接口）。
2. 冻结原F06-5A全部**20条真正Push workflow / 92个PG16 Job（其中H52 52）**须在新最后SHA全部重新执行不删弱；新增新包Source+HTTPS两独立真Job → 目标 **21/21 真Push、94/94非特权PG16 Job成功（H52 52/52）**，父F06-5A原生Source82/82 HTTPS9/9、父F06-4C 102/102均保持，且至少**30份**GitHub原生非空未过期本HEAD官方`sha256:`Artifact。若任一父Runner真实签名校验失败，不许通过影子脚本、假测试或删减历史冻结绕行。
3. B需做完整反向安全自审：Old Lock pending→Transaction不越权、在转换前后与退款交错时单车唯一、资金/公海/历史全保护，真实2 Backend锁序及COMMIT、失败原子回滚、旧DDL源字节和父工作流冻结、分支范围、身份证明及旧Session撤权。补充`来源与权限矩阵.tsv`、`B自验与A交接.md`（均中文），并把真Source/HTTPS/全量旧回归/双OID每个日志、Run/Job/Artifact ID与Digest固化GitHub PR/评论。
4. B自行完成工程+缺陷整改+全量自验，最终同末次SHA全绿并提交**`F06_5B_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`**的正式中文交接，**不得合并main**；如果发现无法在不修改已冻结父F06-3B源码、生产权限/签名契约的前提下实现同事务原子修复，必须以完整对照和真实证据标 `BLOCKED_UPSTREAM_F06_3B`，不得宣称安全通过，A随后技术裁决。
5. A验收必须独立重新取真实GitHub运行/PG16原生日志、核实安全反例与双OID Seal，明确此包仅为新版CI安全入口，并在合格后GitHub标准PR合并及更新全局五项状态。

## 五、明确未放行
- 不得直接把旧F06-3B认为安全；新版CI-only Adapter未经独立复验之前，不可衔接任何生产Transaction写入或发布入口。
- 不得扩到F06-3C-2真实退款、实际`refunded`/refund_payments支付、真实完成成交、银行微信/员工Customer/飞书、UAT、生产部署、F07/F08、PDM规则改变。
- **当前`NEXT_OWNER=B`**；F05/F06整域、C/H01与V1仍`NOT_READY`。
