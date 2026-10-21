# F08-3｜批发上游电话员工专项范围非生产 Runtime

本目录只实现名邦汽车 V1 的 F08-3 授权任务：在隔离 PostgreSQL 16 与合成电话缓存中，验证员工独立授权、SG01 capability-scope binding、两种专项访问模式和 F07 非生产 HTTP Runtime。

## 专项范围

- LOCKED_ONLY：当前仍在售的 JYT/wholesale 车辆必须存在同一 vehicle_id 与当前 listing_cycle_id 对应的有效 Lock；申请中、拒绝、取消、过期和旧 cycle 的 Lock 不满足。
- ALL_ACTIVE_JYT：当前仍在售的 JYT/wholesale 车辆不要求先锁车或有 Transaction。
- 每次请求实时检查当前员工会话、active 状态、个人 override、SG01 专项绑定、当前模式、车辆当前来源/状态与 publisher 映射。
- PC 后台测试入口只允许当前有效 System Admin 授权、撤销和切换模式；目标员工不能自授权限。
- 电话缓存继续按 source_platform + upstream_publisher_id 定位；本目录不使用 car_code 或单独 vehicle_id 作为电话身份。
- 拨号在 CI 中固定为 DISABLED；明文合成电话只会出现在内部员工测试响应，不进入审计日志，不返回客户页面。

## 隔离与冻结边界

- 所有新增车辆、Lock、员工模式行均在 f07_runtime schema，数据统一标记 CI_SYNTHETIC_ONLY。
- F03-2-1B 已验收迁移与 SG01 结构只读复用；本任务不修改它们，不修改 F03 当前事实读取器。
- F03 当前正式读取器在 81 表结构下仍应 fail-closed；本目录用独立 publisher-phone Guard 读取当前员工能力与 SG01 binding。
- 不调用真实 JYT/Collector、CDN/OSS、Feishu 或其他公网服务；不接生产数据库、不实际拨号、不处理真实资金。
- 本任务通过只表示内部非生产权限/范围纵切已验证。真实 Collector/JYT、正式 publisher 物理映射与可信电话来源继续 SOURCE_GAP；F08 整阶段和 V1 仍 NOT_READY。

## 文件说明

- schema.sql：只为隔离 f07_runtime 增加本任务合成对象表。
- guard.mjs：实时授权 Guard 与 System Admin 配置入口服务。
- fixtures.mjs：两套隔离 PG16 的合成员工、publisher、车辆与 Lock 预置。
- tests/business.test.mjs：业务断言与 PG16 事实验证。
- tests/https.test.mjs：真实 loopback HTTPS 入口级测试。
- runner.mjs：输出脱敏运行环境、数据库身份与 SHA/Run 证据。
- verify-contract.mjs：检查三条映射、SG01 范围记录与 SOURCE_GAP 边界。
- 测试矩阵.tsv：本任务正负向覆盖清单。
- B自验与A交接.md：B 的执行边界与交接门禁。

正式交接时以当前 PR 的最终 HEAD、该 HEAD 对应的官方 Push Run、两个 PG16 Job 和两份 Artifact 为准，不在源文件中硬编码历史 Run ID。
