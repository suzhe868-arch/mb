# 名邦汽车 V1｜F06-3B B 工程自验与 A 独立验收交接（仅CI）
> A正式施工单：`07_重建工作区/F06-3B_A主控PDM19_Lock到Transaction原子转换责任占用_CI隔离正式完整施工单_2026-10-14.md`。
> 唯一开工基准main：`c085eb2f37bd02db4038cc2e439ae011f5dc939f`；B分支：`feat/f06-3b-lock-transaction-ci`。
> 本文件先记录本批实现的冻结合同；**最终HEAD的原生Run/Job/Artifact必须以PR正式签署与官方API为准**。未获得全绿之前状态仅为`F06_3B_B_CI_PENDING`。B不合并main。

## 1. 真实授权界限及生产缺口
- 仅新增`engineering/f06/lock-transaction-ci/**`和`.github/workflows/f06-3b-*.yml`；不改变24行旧迁移Ledger、M94/v19-v26、F06-1/F06-2/F06-3A旧Service或生产路由。
- 仅在可丢弃非特权PG16中创造**合成交易**，原公签`public.transactions`实际已支持PDM-19的`in_progress`及同车唯一索引。本批在旧公表直接录入**合成CI** `in_progress`，新增`f06_3b_ci.transaction_origins`仅封印来源Lock、责任及原子转换审计，不再把`pending`假映射为`in_progress`。生产Transaction Issuer未接入，继续标记`SOURCE_GAP/NOT_READY`。
- 不做真实交易、完成、成交纠错、退款、换车、资金Issued事实或外部接口。现实Employee/微信/客户生产Issuer均`SOURCE_GAP`；全域F05/F06/V1仍`NOT_READY`。

## 2. 实现与安全正反约束
- 必须持有真实F03 Session与独立`transaction.ci.open`权限、当前数据Scope、活跃责任员工，manager/store_head跨人管理还须独立`transaction.ci.manage`能力；4S/SystemAdmin、伪造身份、已撤权、跨团队/停用Customer和不可售Cycle硬拒。
- 显式Vehicle行锁先于Lock/Transaction，持锁时检验真正signed F06-1 Lock与快照、公共及CI sidecar占用，PG同事务写入公签Transaction合成事实＋旧Lock released/converted_to_transaction＋CI原子来源账与幂等Key＋审计。异常必须真正ROLLBACK，错误冲突不得半提交。
- 初始Lock72h/价格/责任、Priority-origin/Waitlist及Deposit多笔和correction历史只读不删改；旧Lock释放后不自动复活。原财务/成交Issuer不得开放。
- 真PG16场景与新的非超级账号、安全变更源检测；迁移先故障注入ROLLBACK，验明新Sidecar不遗留，再正式apply/verify；销毁业务DB后不同OID重建并严格对照旧160张及F06-3A侧表全行COUNT+MD5/旧24条Ledger+Catalog+父签名。

## 3. B必须在最终HEAD核验的硬门禁
- **15/15同末次HEAD真Push Workflow completed/success**，原14条旧工作流与82个独立真PG16 Jobs全部同SHA重新运行：**82/82 success**，其中H52必须真实52/52，而不是GitHub API首页30条。
- 本域Source预计32个真实非特权PG16 Source正反测试；真实回环TLS HTTPS9/9；原F06-1/2/3A旧Source/HTTPS完整保留。
- ≥18份同末次HEAD GitHub官方Artifact，非空未过期，原生`sha256:` digest且官方`workflow_run.head_sha`一致；日志必须包括原生OID、双Backend PID、迁移注错、旧表COUNT/MD5与Cross-PDM源签名。
- CI环境镜像拉取限流仅允许官方同SHA重跑失败项，不能跨SHA拼结果，也不得用mock冒充PG。
- 完成时B把最终唯一HEAD/14旧+1新工作流Run ID/82项Job ID/Artifact ID写入PR正式签署评论，`F06_3B_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`；A再进行独立验收。**未完成门禁时不得签。**
