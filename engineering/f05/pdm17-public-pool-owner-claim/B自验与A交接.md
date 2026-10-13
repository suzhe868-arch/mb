# F05-10-D1｜B工程与A独立验收交接（进行中）

> 当前为 CI 隔离工程，待最后 SHA 真正 PG16 和原生证据齐备后才允许 READY_FOR_A_REVIEW。此文不等于 A_ACCEPTED、合并或上线。

## 唯一授权与范围

- 分支：feat/f05-10-d1-pdm17-public-pool-owner-claim。仅新增工程目录和 f05-10-d1 工作流。
- A 签发 F05-10-D1 完整施工单，PDM-02/03/15/17 Final。旧 M94-v25 签名迁移、公海旧源码、PR49/生产业务均不更改。
- D1 独立首次 Owner claim/manager assignment/service pending 合法来源，F03 已分配 Owner 的交接仍冻结。

## 真实与合成来源边界

- M94 customers、OwnerHistory、Audit、Employee/Scope/Team/Receiving 使用原生 PG16 签名事实；d1_owner_ci 表包含**明示CI合成**公海周期、权限与限额来源，不能从单独 owner=NULL 推断实际已进公海。
- 不抢 F05-10 v26 的 migration ID；使用独立侧 schema、旧 Public catalog 与 v25 Ledger seal 保护。
- 生产微信、手机号、JYT、资金、通知、PDM17正式公海Issuer及完整释放、Collaboration均 SOURCE_GAP，不宣称V1生产可用。
- PR49 必须等本D1经A独立验收并合并后才有权复用D1 carrier完成咨询接口真集成。

## 真验收门禁

- 同一最终HEAD的10条官方Push、旧70 Job+新2 Job≥72/72独立PG16真成功，H52全部52Job，≥8份非空有效同SHA原生Artifact。
- Source需两物理PG CID/PID COMMIT竞争、权限撤销、限额、保护事实、收据前后业务表count/hash；HTTPS仅拒绝不提供生产Issuer。
- 未拿到完整真实官方证据前保持施工或BLOCKED，不能冒称READY_FOR_A_REVIEW。
