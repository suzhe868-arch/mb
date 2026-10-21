# F08-3｜B 自验与 A 独立验收交接

## 任务范围

本交付只覆盖 Issue #190 的内部非生产电话权限/专项范围 Runtime 纵切。它不代表 F08 整阶段、真实 JYT/Collector、生产电话缓存、CDN/OSS、Feishu 或 V1 已完成。

## 已实现路径的验收门禁

1. System Admin 使用当前有效正常会话，对单个 active 员工授予/撤销既有 publisher.phone.sensitive，并选择 LOCKED_ONLY 或 ALL_ACTIVE_JYT。
2. 授权/撤权必须同步更新当前 employee_permission_overrides、employee_permission_override_history、SG01 employee_capability_scope_bindings / employee_data_scopes，并向 audit_events 写入 actor、before/after 和时间。
3. 每次 latest/dial 都重新检查当前员工会话、员工状态、个人 deny、明确的员工能力 override、当前 SG01 专项绑定、当前范围模式、车辆当前 listing cycle、JYT/wholesale/active 状态与当前 publisher 映射。
4. LOCKED_ONLY 只认当前 vehicle_id + listing_cycle_id 的 active 且未过期 Lock；ALL_ACTIVE_JYT 不要求 Lock/Transaction，但仍拒绝下架、转名邦、转 4S、非 JYT 或缺 publisher 的车辆。
5. phone_cache 的身份键保持 source_platform + upstream_publisher_id；合成电话不进入审计/日志；CI 拨号器保持 DISABLED。
6. F03 正式事实读取器、F03-2-1B 迁移、F05/F06、F07 图片/通知/Incident、正式 Server、C PR #68 和项目主控状态文件保持不变。

## 本次 CI 必须提供的证据

- 两个相互独立的 PostgreSQL 16 非超管 Push Job，同一最终 SHA。
- 业务 PG16 场景与真实 loopback HTTPS 场景均通过，测试日志显示 fail 0。
- 每个 Job 均上传非空 Artifact；其中包含脱敏运行身份、ref、SHA、Run ID、PG16 数据库/角色/版本、测试日志与矩阵。
- 原 F07 工作流固定旧分支 REF 门禁不放宽；新工作流仅接受固定 F08-3 分支并从代码中传入固定 expectedRef。
- 受影响的基础 HTTP/启动/Lock 回归通过；不重复 F08-2 已验收的 58+7 测试。
- 精确文件白名单与差异检查通过。

## 最终交接规则

B 只在上述同 SHA 门禁全部通过后，将状态标记为 READY_FOR_A_REVIEW 并交 A 独立验收。最终 SHA、官方 Run/Job/Artifact 链接、实际测试结果和遗留 SOURCE_GAP 必须写入本次 PR 交接正文。B 不合并 main，不更新 PROJECT_STATE.json、NEXT_ACTION.md 或 CURRENT_PROJECT_STATE.md。

## 明确保留的来源缺口

本任务使用的 publisher、phone、Vehicle、listing cycle 与 Lock 全部是 CI_SYNTHETIC_ONLY。真实 Collector/JYT 回传、正式 publisher 物理映射/可信电话来源、真实外部授权、SLA/Incident、CDN/OSS/Feishu 仍为 SOURCE_GAP。F08 整阶段、F06/F07/V1 继续 NOT_READY / NO_PRODUCTION。
