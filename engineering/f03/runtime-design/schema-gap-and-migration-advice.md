# F03-2-G0｜结构充分性、精确缺口与独立追加迁移建议（仅文本）

依据：已验收F02-G0的`engineering/f02-g0/field-matrix.tsv` + `field-freeze-candidates.tsv`，冻结F02 Initial实际 **76个业务表、464个INCLUDE字段**；F03-1独立追加的`credential_epoch`和`pc_auth_sessions`属于其已验收新版本，不回填原F02表清单。本次未连接任何库或执行SQL。

## 已确认可作为未来可信读取的物理来源
| 域 | 已纳入当前字段（举证） | 不能推导 |
|---|---|---|
| 主体 | `pc_login_accounts.account_id,principal_kind,employee_id,system_admin_id,credential_state,force_password_change`；F03-1`credential_epoch`/sessions；`employees.employee_id,store_id,employment_status,receiving_status,main_role_id`；`system_admins.system_admin_id,account_status` | 登录成功不能授业务权，System Admin不可成为owner |
| 模板与覆盖 | `roles.role_id,role_code`；`permissions.permission_id,permission_code`；`role_permission_defaults(role_id,permission_id,enabled,changed_at)`；`employee_permission_overrides(employee_id,permission_id,decision,changed_at)`；`employee_permission_override_history(event_id,employee_id,permission_id,decision,actor_kind,actor_id,occurred_at)` | 角色模板历史不可冒充当前；`roles.status`、`permissions.hard_deny_category`均为`DEFER`；不要推定其存在 |
| scope | `employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id,ended_at)` | 不包含`permission_id`，团队关系无独立授权键、global scope语义未裁定 |
| 客户与责任 | `customers.current_owner_employee_id,account_status,owner_assignment_state`，`customer_owner_history`；`demands.responsible_employee_id`、`consultations.assignee_employee_id`、`waitlists/locks/transactions.responsible_employee_id` | 各自负责人不自动随Customer owner，历史owner不等于当前 |
| 车辆/4S | `vehicles.source_type,created_by_employee_id,source_sale_status,platform_visibility` | 4S上传人仅用于自己合法4S车的候选证据；非全域业务owner，不产生跨店team |
| System Admin控制面 | `system_admins.bootstrap_origin,created_by_system_admin_id`，`vehicle_model_review_cases(case_id,case_state,resolved_by)` | 不存在可证明已实现的Admin bootstrap-ever并发claim；Admin身份和PC credential是两个失权维度 |
| 审计 | `audit_events.actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at` | 原始秘密/手机号/哈希不得抄进before/after；审计表存在≠事务正确实现 |

## 精确差异建议（**未经A批准不得创建**）

| 缺口编号 | 目标最小新增实体/字段候选 | 唯一/外键/范围与价值 | 不执行时策略 |
|---|---|---|---|
| SG-01 | `employee_capability_scope_bindings(binding_id BIGINT PK, employee_id BIGINT FK, permission_id BIGINT FK, scope_id BIGINT FK, granted_at TIMESTAMPTZ, ended_at TIMESTAMPTZ)` | 当前单一`employee_data_scopes`没有`permission_id`；必须验证同员工/有效期、capability独立scope、源可信授权，不接受跨权限借用。必要索引`(employee_id,permission_id,scope_id)`与有效行唯一策略待裁定 | **DEFER_DENY**所有无独立capability scope证据请求 |
| SG-02 | `employee_team_memberships(membership_id BIGINT PK, employee_id BIGINT FK, team_id BIGINT FK/新增可信团队承载, valid_from TIMESTAMPTZ, ended_at TIMESTAMPTZ)`及`teams(team_id BIGINT PK, store_id BIGINT FK)` | 当前无团队成员与团队scope目标键，不能将store当team；需要约束员工有效成员、门店与时间边界，团队模型本身须A确认 | **DEFER_DENY**经理团队跨人员/对象治理 |
| SG-03 | `employee_receiving_eligibility(employee_id BIGINT FK, eligible BOOLEAN, fact_version BIGINT, reason_code TEXT, verified_at TIMESTAMPTZ)`或清楚的可信派生规格 | `receiving_status=accepting`不代表eligible；资格变更需与pool锁版本和最后接客者保护原子关联 | **DEFER_DENY**无资格证明的正常入池；突发inactive撤权仍先执行 |
| SG-04 | `governance_control_scopes(admin_id BIGINT FK, action_code TEXT, target_kind TEXT, target_ref BIGINT/TEXT, effective_from TIMESTAMPTZ, ended_at TIMESTAMPTZ)`（仅方案） | System Admin独立控制面并非Employee角色或role default；具体控制面是否按身份固有权限、动作/范围配置授予需A技术裁定 | **DEFER_DENY**无明确Final+服务端控制面授权的动作 |
| SG-05 | `governance_singleton(name TEXT PK, version BIGINT, bootstrapped_at TIMESTAMPTZ)` 及`admin_population_mutex`与`receiving_pool_mutex`版本行可共用此表 | 全体Admin和接客池跨目标事务序列化，解决write-skew/重复bootstrap，记录历史claim不可因全部停用而重开 | **DEFER_DENY**无法事务保护的Admin停用及正常最后接客者关闭 |
| SG-06 | `handover_batches(batch_id BIGINT PK, source_employee_id BIGINT FK, initiated_by_kind TEXT, initiated_by_id TEXT, status TEXT, created_at TIMESTAMPTZ)`，`handover_items(item_id BIGINT PK,batch_id BIGINT FK,object_kind TEXT,object_id TEXT,from_employee_id BIGINT,to_employee_id BIGINT,status TEXT,reason TEXT,attempt_count INTEGER,committed_at TIMESTAMPTZ)` | `UNIQUE(batch_id,object_kind,object_id)`幂等；逐域FK/当前负责人验证靠批准的域Guard；每item单独提交，成功不可被失败整体回滚 | 计划降权/调店无已完成受影响责任交接证明即拒绝 |
| SG-07 | `permission_fact_versions(subject_kind TEXT, subject_id BIGINT, version BIGINT, changed_at TIMESTAMPTZ)` 或经批准的模板/员工/对象行锁协议 | 旧会话缓存权限不可作为提交授权；提交时同TX重验scope、模板及目标状态；全局模板变更需要能使受影响者失效的版本协议 | **DEFER_DENY**跨事务先放权后写入的敏感操作 |
| SG-08 | 真实`Vehicle → source_platform/upstream_publisher_id`可信链接（建议单独`vehicle_upstream_publishers(vehicle_id BIGINT FK, source_platform TEXT, upstream_publisher_id TEXT,...)`） | `publisher_phone_cache`确有`(source_platform,upstream_publisher_id)`，但冻结`vehicles`无直接upstream_publisher_id；严禁car_code代替，必须先查F05/F04已有来源表并A裁定最小链接 | **DEFER_DENY**无法溯源的取电话/拨号 |
| SG-09 | `role_permission_default_history(event_id BIGINT PK,role_id BIGINT FK,permission_id BIGINT FK,enabled BOOLEAN,actor_kind TEXT,actor_id TEXT,occurred_at TIMESTAMPTZ)`（若审计事件不能满足独立不可变历史合同） | 当前`role_permission_defaults.changed_at`可证明投影时间，`audit_events`可存脱敏事件；历史独立承载是否已满足需A核实，不能虚称已建专表 | 仅设计，不实施模板变更；待审计与历史结构裁定 |

每一条建议都需要 **A书面裁定编号、独立追加迁移ID（高于F03-1的`000002`）、精确checksum/physical fingerprint、事前版本及锁冲突计划、事务回滚/幂等与全新一次性PG16真实证据**；不得改写F02 `000001`或F03-1 `000002`、manifest、已验收runner，不关闭F03-1 80表/版本/真实PG16结构阻断。若新结构与现有startup checker不兼容，需要后批同步支持精确新版本而非绕过Guard。

本单**只形成文本建议**；物理DDL、角色权限种子、正式团队/接客/交接语义及产品规则均保持未授权。
