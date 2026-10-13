# F06-3C-1｜B工程自验与A交接
> 状态：IN_PROGRESS / NOT_READY_FOR_A_REVIEW（待最后SHA独立真实CI完成）

## 授权与边界
- A的正式施工单：`07_重建工作区/F06-3C-1_A主控PDM19合成Refund申请与关闭_无实际退款_CI隔离完整施工单_2026-10-14.md`
- 分支：`feat/f06-3c1-refund-pending-close-ci`。只新增本批工程目录和工作流，不修改公共生产DDL。
- 已实现：带物理PG16来源证明的Lock侧合成pending/closed，非特权Session与独立显式`refund.ci.request`授权、金额上限、多笔Deposit账本、幂等与双backend并发、公共Refund状态/不可变历史/公海拦截/车辆不占用投影、重放与错误注入回滚。无真实金钱，无`refunded`，无支付、客户或员工生产Issuer。
- 交易侧：F06-3B仅in_progress，completed/cancelled无签发源。标记`CI_SYNTHETIC_TERMINAL_SOURCE_GAP`，拒绝伪造terminal Transaction可退。
- PG旧表Carrier支持pending/closed，但完整业务来源与幂等落独立签名Sidecar。生产Refund仍`SOURCE_GAP`。
- 待办：同最终SHA证明16条真Push、84/84 Job(H52 52)、43 Source/9 HTTPS、至少20份本SHA官方sha256 Artifact、双OID至少168旧实体全行Seal。未核实前不得改为READY。
