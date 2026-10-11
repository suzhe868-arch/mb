# F05-5｜SOURCE_GAP及实时权限证据

1. 当前仓库F03 permission-contract.tsv仍明确customer.quota.add实施状态DEFER_NOT_IMPLEMENTED，runtime-design/capability-scope-contract.tsv亦标DEFER_DENY。若仅按角色/静态owner开放真实加次将违反PDM10最终权限。
2. 用CI专用customer.quota.add.ci.synthetic和显式CI个人allow/绑定team901检测现有真实Session与Owner/Scope链。任何请求体isManager/ownerId/permission:true一律不能授予权限；真实HTTPS全部403，未提供生产加次成功接口。
3. 旧M94 customer_quota_adjustments没有固定幂等键和可信不可变Issuer；新增v21只在独立非superuser CI库追加f05_5_quota_addition_events_ci，绑定M94调整记录、Actor、Owner-at-commit、角色、Team、UTC+8、唯一请求键和事务id，并封装trigger禁止Update/Delete。
4. v21迁移链受信：原M94+v15～v20总18条原签账和v20当前真实Catalog核验后追加000021；attestation封存前18条完整SHA、v20 checksum和structure SHA；v21结构SHA和checksum实时验证，注入失败全事务回滚。000001～000020旧版本完全冻结。
5. 保留F05_4_EMPLOYEE_QUOTA_ADDITION_CURRENT_SCOPE_SOURCE_GAP及更精确F05_5_EMPLOYEE_ADDITION_SOURCE_GAP；客户真实微信会话、真实最终展示价、Recommendation免费Issuer、普通批发车经营范围、隐藏重算、图片资产化亦不关闭。
6. 本批不会访问真实客户/JYT/微信/资金/电话或生产。F05/F04/C-H01/V1 NOT_READY。


## A-F05-5-01/02/03真实并发审查补证说明

原测试不足的三个真实并发交错现在新增Source 5-A19 Owner转移锁争抢、5-A20 个人Permission deny更新锁争抢、5-A21 Capability Scope ended_at撤销锁争抢与5-A22 SQL原生证据。每案均采用已签真实F03 Employee Session + 真PG16 current customer/permission binding复合约束，SERVICE只有在真实当前Scope核验成功后暂停在原有独立CI-only测试checkpoint；第二个实际PG backend发UPDATE，必须返回原生SQLSTATE 55P03；先允许当前合法事务COMMIT，再由第二连接撤销并COMMIT后检查新动作/重放拒绝。反向先撤权/Owner转移后进行业务动作必须拒绝，绝不以客户端角色标志决定权限。

将三套`pg_backend_pid()`和`clock_timestamp()`、权限原始表与`customer_day_quota_ledger`/`customer_quota_adjustments`/`f05_5_quota_addition_events_ci`的行数与SHA256逐状态归档`artifacts/source/owner-permission-scope-real-pg16-concurrency.json`，GitHub Native Artifacts由官方CI保全。不为线上造权限发行人，永久保留真实SOURCE_GAP。
