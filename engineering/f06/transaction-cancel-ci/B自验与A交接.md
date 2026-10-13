# F06-4A｜B工程自验与A交接
> 状态：IN_PROGRESS / CI_NOT_VERIFIED。以最终PR真实最后SHA与原生Actions为唯一验收证据；未跑完门禁不得提前签READY。

## 唯一授权
- A施工单：`07_重建工作区/F06-4A_A主控PDM19合成Transaction正常取消与责任占用释放_CI隔离完整施工单_2026-10-14.md`
- 分支：`feat/f06-4a-transaction-cancel-ci`；独立新PR；只新增本包工程文件与专用Workflow。绝不改旧已签字节、公签M94-v26、原24行迁移Ledger与生产Issuer。
- 本包只在真实非特权可销毁PG16模拟来自3B签名Lock的Transaction `in_progress → cancelled`，原因+actor+时间+不可变sidecar+幂等+当前合法Employee Session、独立`transaction.ci.cancel`权限及Scope。没有真实取消、真实资金、completed状态或退款支付；原Lock/Deposit/Refund/Priority/Waitlist/owner不恢复、不可变。
- 公签`public.transactions`已有`status`与`completed_at`但没有取消原因字段，合成原因必须在本批隔离Sidecar保存，生产`TRANSACTION_CANCEL_CARRIER_SOURCE_GAP`与`PRODUCTION_TRANSACTION_CANCEL_PERMISSION_SOURCE_GAP`持续存在。
- 末次门禁目标：17/17同HEAD Push、≥86/86真PG16 Job、H52官方52、Source48/HTTPS9、≥22官方真实Artifact、两物理OID及至少172张旧表逐行COUNT/MD5、24 Ledger、公共Catalog、父五侧表签名。完成后再由B发最终PR中文签字，`READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`。B不得合并。
- F05/F06全域及V1维持`NOT_READY`，禁止UAT、部署、真实员工Customer、财务/退款/银行/微信等所有未授权域。
