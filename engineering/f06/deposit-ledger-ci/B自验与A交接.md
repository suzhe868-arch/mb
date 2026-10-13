# 名邦汽车 V1｜F06-3A B工程自验与A交接（仅隔离CI）

> 当前 `F06_3A_B_ENGINEERING_CI_PENDING / NEXT_OWNER=B`。尚未满足交A独立验收的官方工作流门槛，B禁止自行合并。

- A正式施工单：`07_重建工作区/F06-3A_A主控PDM19意向金事实追加资金纠错与Lock保全_CI隔离正式完整施工单_2026-10-14.md`；唯一授权范围仅为本次CI侧表和新增工作流。
- 仅在非特权可销毁PostgreSQL16情景库建立合成Deposit物理行，sidecar追加凭证元数据、收款操作人、金额币种、签名源和纠错/冲正不可变历史；非真实付款，不提供生产Issuer。
- 记录与correction/reversal独立Permission、Capability、合法Employee Object Team/Store Scope，复核F03真实Session和PG当前状态。使用PG事务行锁、事件幂等键、先原签Lock再新增Deposit，禁止金额负净额/多次全额冲回。
- Source **28** 项原生PG16正反测试；真实TLS/HTTPS拒绝 **9** 项。用现有F06-2只读真实public.deposit_receipts防止原Lock超时：即使纠错净额为0，也不擅自放开原锁。
- 注错迁移真实ROLLBACK、旧24行M94→v26 Ledger、F06-1/2 Sidecar及旧Catalog签名不可变；CI scenario库物理DROP，再独立不同OID审计库≥157旧实体表完整COUNT+MD5。
- 最终验收为同一最后HEAD **14/14真实event=push工作流、80/80真非特权PG16 Job（H52 52/52）、旧F06-2 Source30/HTTPS9、旧F06-1 Source48/HTTPS9、新Source28/HTTPS9、≥16份官方SHA256 Artifact**，所有正式Run/Job/Artifact、OID/PID/Hash归档。
- 生产Deposit/Refund/Transaction、真实客户/员工Issuer、线上调度、支付凭证、微信PC、UAT部署均`SOURCE_GAP / NOT_RUN / BLOCKED`；F05/F06/V1_GLOBAL NOT_READY。

没有最后SHA完整证据，不得签署`F06_3A_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`。
