# 名邦汽车 V1｜F06-5C B 工程包内整改、自审与 A 独立验收交接记录

> 2026-10-15。**本文件当前状态：B_REMEDIATION_IN_PROGRESS / NOT_READY_FOR_A_REVIEW / PR62_NOT_MERGED / CI_ONLY。**  
> 证据以 GitHub PR #62 实际最新 HEAD 对应的原生工作流为准，旧 HEAD 的绿灯不得冒作本次通过。本文严禁被解读为 F05/F06 整域或 V1 Ready。
>
> A 唯一正式整改单：`07_重建工作区/F06-5C_A主控PR62独立验收未通过_交易取消来源与原子并发整改施工单_2026-10-15.md`（以 main 上版本为准）。

## 一、权限边界和责任分工

- 仓库 `suzhe868-arch/mb`；原分支 `feat/f06-5c-transaction-priority-admission-ci`；原 [PR #62](https://github.com/suzhe868-arch/mb/pull/62)。B 只动 `engineering/f06/transaction-priority-admission-ci/**`，没有改父 F05/F06、正式 DDL/24 迁移、真实生产服务或 `main`。
- A 2026-10-15 对原 B SHA `3b406c09f92c351d1f953521b538f66e8ff231b7` 拒收：22/22 真 Push、H52、原 Source56、HTTPS9、旧190父表双OID虽已有证据，仍缺业务取消终态签名、正向竞争、资金及权限实证；这些旧成功仅保留作历史，**不能算新整改通过**。
- 不得触及真实交易完成、用户数据、真实银行微信收退、正式 Transaction/Refund/Priority Issuer、生产迁移、UAT/部署/F07/F08，F05/F06/V1 全域 `NOT_READY`。

## 二、已落地工程整改及代码自审

1. **同一事务真实授权**：`service.mjs` 继续以 F03 真签名 Employee Session，在一个物理 PG Client 的同一 txid 中获取目标 Vehicle `FOR UPDATE`、查旧父签名和当前授权，最后调用原 F05-8 `arbitrateCI`；不增加单独 BEGIN、不直接 INSERT 原 Priority、不制造第二事务 TOCTOU。父签发错误的 winner 在事务里抛错回滚。
2. **3B 历史 vs 4A/4C 终态**：新增 `signed-transaction-state.mjs`。冻结3B 的 `in_progress` 保留历史签发事实，公表 `cancelled` 必须伴随且仅伴随 F06-4A 普通取消或 F06-4C 移交后取消的原始来源、不可变事件、请求签名，检查责任人、周期、车辆、Lock 和 4B 完整移交链。不会 UPDATE 原 3B 历史；只读验证失败一律 FailClosed。
3. **5B安全转换与资金**：逐交易验查 5B Guard 的 Lock/Vehicle/Cycle/Actor/退款快照摘要，3B 原事件与请求键、源 Lock 已完成转换以及 3A Deposit 真签来源和调整凭据；任意 pending/refunded/未明来源的 Refund、真实 Payment、未经验证的新财务记录不许新签 Priority。旧不安全 3B 转换只认作漏洞样本，不得洗白。
4. **独立业务测试**：原 56 项不删，已扩为 67 项 Source 测试，包含 5B 正式交易→真4A取消→3B不可变状态保留、public伪取消拒绝、未签退款pending拒绝、合法取消后双Backend正向签发、有效员工个人deny与scope中断、有效Priority→原F06-1合法Lock→5B原子Transaction且原Priority不复活。独立 HTTPS9 个硬拒绝保持不变；GitHub 新 SHA 原生日志通过率尚须核验。
5. **源数据边界**：所有正例均以原 F03 Token、F05-7 Match、F05-8 Qualification/Arbitration、F06-1 Lock、F06-5B 转换或原4A取消 API 触发；测试环境中局部构造异常 public 状态只允许在 SAVEPOINT 内回滚，禁止写生产。
6. **元数据修复**：PR #62 标题与正文已纠正早期 `BLOCKED_UPSTREAM` 技术判断；《来源与权限矩阵.tsv》已更新 A 2026-10-14 同事务裁决和 2026-10-15 终态验签要求。历史失败证据仍保留。

## 三、最新SHA验证硬门槛（**未通过前全部不得记完成**）

请只以 PR #62 最后实际提交为唯一证据，依次验：
- 22/22 同SHA `event=push` GitHub 工作流 **success**；
- 96/96 非特权真 PostgreSQL16 Jobs success，H52 独立 Job 52/52；新 Source **67/67 PASS**，HTTPS **9/9 PASS**；
- 当前 Scenario 实际物理数据库 OID、先销毁再建的独立 Audit OID、两者旧**190**父表逐表全行 COUNT/MD5 和旧24迁移/签名/公共Catalog完整保全；
- 至少32份有效、同SHA、非空、可逐字节抽验的 GitHub 原生SHA256 Artifact；
- 取消终态、安全 Guard、财务证据、真实双后台与合法Priority/Lock→Transaction并发、资格权限撤销/幂等/注错回滚达到 A 的 **≥36 项有意义的业务用例**要求；
- 同 SHA 的 PR 额外 `pull_request` 检查分类：实际 required、历史冻结工作流、网络基础设施限流、真实代码失败均有可审计归因。

截至本文写入：**新SHA的上述最终回归尚未完成确认**。排队、执行中、旧 SHA 成功不代表通过。发现失败必须继续原包整改并重跑；不得自行声称 `READY_FOR_A_REVIEW`。

## 四、交 A 门槛与阻断

**未满足**上述所有门槛前：`B_REMEDIATION_IN_PROGRESS / NEXT_OWNER=B / NOT_READY_FOR_A_REVIEW`，不得合并，PR 保持草稿。所有业务和资金状态继续 `CI_ONLY / F05_F06_V1_NOT_READY`。

达到最终SHA所有硬门槛后：B 在 PR #62 追加带最终 SHA、22 Push+96 Job+Source/HTTPS/双OID+Artifact 明确数字与原生证据链接的中文签署评论，标记 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`；仅由 A 完成真正独立验收和标准合并。
