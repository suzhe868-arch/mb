# F06-2｜B工程执行自验与A交接（CI-only）

> 状态：**F06_2_B_ENGINEERING_CI_PENDING / NEXT_OWNER=B**。此文件为实施合同与测试矩阵；最终官方Run/Job/Artifact只在最后SHA真绿后签署，不得提前声称完成。

- A正式工单：`07_重建工作区/F06-2_A主控正式Lock延期到期与人工释放资金只读保护_CI隔离完整施工单_2026-10-13.md`。
- 来源：A签字合并F06-1 PR52，保持F03/F05/M94-v26、D1、旧F06-1签名不变，仅新增`engineering/f06/lock-lifecycle-ci/**`和`.github/workflows/f06-2-*.yml`。
- 用`f06_2_ci`模拟可信财务Issuer缺口，**只有隔离合成明确断言无Deposit且物理只读确认无Deposit/Transaction**才允许普通Lock延期/释放/到期。未知、有资金均拒绝；真实资金Issuer始终SOURCE_GAP。
- 保留Lock初始72h价格与原responsible历史；同Lock更新当前期限，追加不可变事件与系统审计，幂等键绑定相同Lock/Actor/Action；权限与DataScope/当前停用/车辆周期重新判断；时间来自真PostgreSQL。
- 测试门禁：新Source至少24，HTTPS 9，新本域2个PG16 Job；全批13条同最终SHA Push、78/78独立非特权PG16 Job(H52 52)、≥14份有效SHA256 Artifact；双不同OID业务库销毁与151 public+D1表及旧F06-1侧表完整count/MD5 Seal。
- 真实线上Employee/Customer/微信、Deposit/Refund/Transaction写入、定时器/部署/UAT及F06-3均**未授权**。F05_GLOBAL/F06_GLOBAL/C_H01/V1均NOT_READY。

待同最后SHA全量GitHub原生验证成功后，再签`F06_2_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`。
