# F06-4B｜B自验与A交接（签署前合同）
> 仅A正式放行的CI-only可销毁PG16工程。状态：IN_PROGRESS / NOT_READY_FOR_A_REVIEW，最终动态证据由PR同SHA正式签署评论给A，严禁提前写PASS。

- Authority：`07_重建工作区/F06-4B_A主控PDM19合成Transaction负责人正式移交与跨批安全守卫_CI隔离完整施工单_2026-10-14.md`，PDM-19§9、PDM-02/03/17/18/25。
- 工作分支 `feat/f06-4b-transaction-handoff-ci`，白名单仅`engineering/f06/transaction-handoff-ci/**`与`.github/workflows/f06-4b-*.yml`新增。不得触及父F06-4A/3B或旧F03脚本、公签M94、24条Ledger、生产Issuer及main。
- 合成当前经理/店长独立permission+Team/Store Scope，对来源F06-3B签名的in_progress Transaction负责人的正式原子移交，历史old/new/actor/time/reason+幂等/不可变事件/当前安全投影，源Lock/资金/Owner原样；无生产Token、真实员工Customer、款项、退款/成交/部署。
- 特别来源缺口：旧F03-2M有独立handover batch/item/receipt正式Issuer合同，本次不能伪造旧签名M Receipt；合成投影只属F06-4B。旧F06-4A Cancel在换负责人后无法认旧不可变origin，因此新适配器强制`PARENT_CANCEL_POST_HANDOFF_SOURCE_GAP`，**旧或新负责人均不得凭旧Issuer直接取消**。生产`PRODUCTION_TRANSACTION_HANDOFF_ISSUER_GAP`持续存在。
- 目标：18/18同最终HEAD真Push、88/88真PG16 Jobs（H52 52）、新Source48/HTTPS9、≥24份官方原生有效sha256 Artifact、情境+审计不同OID与≥176旧表COUNT/MD5/24迁移Ledger及父Seal完整保留。真实结果需最终Run/Job/Artifact逐项列入PR正式中文签署，才得`READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`。
- F05/F06全域及V1均NOT_READY。B不合并main，不代A验收。
