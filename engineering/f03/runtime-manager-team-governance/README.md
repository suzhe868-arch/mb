# F03-2-2F｜SG04 仅限隔离PG16个人员工管理权与显式团队范围治理

正式施工单 `07_重建工作区/F03-2-2F_A主控SG04员工个人权限与Team范围受限治理施工单_2026-10-10.md`。

仅在GitHub Actions一次性隔离PG16真实认证与合成数据上使用，无DDL，无业务写入/账号自提权/经理默认权限。独立System Admin配置employee.manage个人覆盖和显式team capability scope；所有改变、个人override_history与脱敏audit事务原子，失效scope若被其它能力使用则不结束。SG06待办账本存在时涉及唯一合法治理者的撤权必DENY。完整测试和证据以`B自验与A复验交接.md`为准。
