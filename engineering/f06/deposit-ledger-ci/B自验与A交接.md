# 名邦汽车 V1｜F06-3A B 工程自验与 A 独立验收交接（仅隔离 CI）
> A 正式施工单：`07_重建工作区/F06-3A_A主控PDM19意向金事实追加资金纠错与Lock保全_CI隔离正式完整施工单_2026-10-14.md`。从已正式合并 F06-2 的 main `c22412589637a77fe68271e48e094044d19f82fb` 新建 `feat/f06-3a-deposit-ledger-ci`；PR #54。
>
> **B 代码/测试/安全自审已完成；正式 READY 签署仍以 PR #54 最终 HEAD 的 GitHub 官方14/14工作流与80/80 Job全部通过为条件。** 因本交接证据提交本身生成新 SHA，下面记录的是**此前实测绿灯 SHA** `18d58c18f0c8443201fd05e8234365d5b06e5658`。只有新 HEAD 全绿、在 PR #54 留下最终SHA官方 Run/Job/Artifact 记录后，才签 `F06_3A_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`。B 无权合并 main。

## 一、严格交付边界
- 仅增加 `engineering/f06/deposit-ledger-ci/**` 和新 `.github/workflows/f06-3a-*.yml`。未改 F06-1/2、原 M94→v26/Public SQL、D1/F03/F04/F05、既有Workflow及生产路由。
- 只在 GitHub Actions、非特权PG16、可销毁 `f03_auth_test` 做**合成**线下 Deposit 物理事实、独立追加式纠错/冲正、资金净额派生和普通Lock到期的资金占用保护。
- 真实支付/线下收据真实性、现实微信/员工/Customer资金Issuer、生产Deposit/Refund/Transaction、生产Lock到期调度、发布/上线/UAT均是 `SOURCE_GAP / BLOCKED`，不得把合成测试当现实已收款。

## 二、业务合同和安全自验
- 合成 Deposit 需要合法签名 Lock 与Customer/Vehicle/Listing cycle关联，正整数、合法金额范围/币种/支付方法/PG时间、recording Employee及合成凭证来源；支持同Lock多笔，原存量金额/Operator不可修改/删除。
- Deposit 录入与 correction/reversal **两个独立业务权限**。每次重查 F03 当前有效Employee Session、Permission+Capability和Team/Store/Object DataScope、Customer及Lock；4S、SystemAdmin、越权销售、失效Token、跨门店均拒绝。两真正PG backend在另一连接COMMIT撤权后旧Token被拒绝。
- Correction/Reversal append-only侧表，不篡改原收款事实；actor/reason/time/source deposit id/key都有审计，当前有效余额由原事实和不可变事件派生。幂等键绑定actor+Lock+Deposit+action+amount；拒绝超额负净额、重复Key跨Lock、并发重入、事件UPDATE/DELETE；错误注入同事务ROLLBACK。
- 已存在物理Deposit时，冻结F06-2签名Lock的普通PG到期必须fail closed；即使 correction 后余额为零也**不能未经授权自动释放**。Owner、Priority-origin客户独占、Waitlist责任/顺位、原72h/价格和既有成交/退款历史不能被合成资金篡改。

## 三、同一受检SHA的真实原生测试和审计
- **实测SHA** `18d58c18f0c8443201fd05e8234365d5b06e5658`：GitHub真实Push**14/14工作流success、80/80独立PG16 Jobs success**；H52 Run `38435118995` attempt2真正52/52；F06-3A本域Source **28/28**（Job `115429032699`）、真实TLS HTTPS **9/9**（Job `115429031047`），均`# fail 0`；旧F06-2 Source30/HTTPS9、旧F06-1 Source48/HTTPS9均冻结重跑且无缩减。
- **125/125份官方原生 Artifact**，非空、未过期、官方 `sha256:`摘要及 `workflow_run.head_sha` 与本SHA一致。全部**14个Run、80个JobID及名称/结果**见 `engineering/f06/deposit-ledger-ci/evidence/official-jobs.json`，全部**125份Artifact ID/bytes/expiry/SHA256/headSHA**见 `engineering/f06/deposit-ledger-ci/evidence/official-artifacts.json`。
- 隔离非超级 PG16 场景先真迁移注错ROLLBACK，后apply/verify；已提交合成资金场景**OID 30632**，真物理DROP后以独立审计库**OID 34952**恢复旧签；**160张public+D1+F06-1/2旧Sidecar实体表的全行COUNT/MD5**相同，旧24行 Ledger、Catalog SHA `5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4`、D1和F06-1/2侧表原始checksum未改变。`F06_3A_DISPOSABLE_SCENARIO_AND_SIGNED_AUDIT_GLOBAL_SEAL_PASS`真原生日志。
- H52曾8个Job因PostgreSQL Docker镜像 `toomanyrequests` **尚未进入业务测试**；对同一SHA用GitHub官方仅重跑失败项，最后H52完整52/52、14条全部成功，不用旧SHA拼绿灯。

## 四、最终提交复核/独立A验收入口
- 本文件与机器证据提交后GitHub branch HEAD将变化。**B必须对变更后的最终HEAD重新逐项确认14/14同SHA workflow success、80/80 Job（H52真正52/52）、≥16份同SHA有效官方 SHA256 Artifact，最终结果记录在PR #54正文或签署评论，完成后正式进入READY_FOR_A_INDEPENDENT_REVIEW。**
- A验收应核对PDM19§§2–5/F06-3A正式白名单、最末次SHA与完整Run/Job/Artifact、本域source/HTTPS日志、两个不同PG数据库OID及160表全行不可变签名。严禁B合并或提前报告产品整体就绪。
- `F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / C_H01_NOT_READY / V1_NOT_READY`始终保留；F06-3B交易、F06-3C退款及生产资金Issuer仍未获批准。
