# 名邦汽车 V1｜F02-G0 定向补审与 A 再验收回报

> 日期：2026-10-08｜B 工程执行窗口  
> 有效状态：**G0_ENVIRONMENT_PASS / G0_MODEL_FREEZE_PENDING / READY_FOR_A_RE_REVIEW**，A 未签发 G0_ACCEPTED。  
> GitHub 工程分支 feat/f02-schema；原 main SHA af066c21ebb8adaeb9eb77eaf1e29361e3f0f0f1。  
> 最近完整代码成功验证：9fa41ed85f9d1b3fd804b27a378cdba5f0403d9a。所有字段仍是候选，未执行 Current Schema DDL。

## 一、本轮提交与内容

| 提交 SHA | 交付及边界 |
|---|---|
| 60bf074699452dd1c169855be2b3d08e757dbb1a | 376 字段分级、80 REVIEW 逐项处理、跨对象身份与角色/查价承载合同 |
| ffd3b5830a98c2c952f11dc0d3ce67bd6bdebea3 | 将所有非系统用户 Schema/关系纳入全库空库阻断，增加真实 CI 正反例 |
| 5dd63ff85b78c86ec25fcd793c9b60449eb74894 | 修复只读元数据查询的多行 JS 字符串语法 |
| adac05d12f16b1625f91b6e493db1ef790aa8294 | 33 个 P0 核心身份字段逐项可空/FK/唯一条件及 Authority 审查台账 |
| 9fa41ed85f9d1b3fd804b27a378cdba5f0403d9a | 按 PDM-15 修正 Consultation.vehicle_id 非空 FK 技术建议 |

**全量文件**：engineering/f02-g0/field-tiers-376.tsv；逐项 REVIEW：engineering/f02-g0/nullable-review-80.tsv；P0 核心字段：engineering/f02-g0/core-constraint-contract.tsv；跨域合同：engineering/f02-g0/跨对象权限与查价承载合同.md。

## 二、376 字段分级及冻结状态

| 类别 | 数量 | 意义 |
|---|---:|---|
| P0_IDENTITY_CORE | 33 | 必需核心身份键；已经提出可空、关联键和唯一性候选，仍需 A 审核 |
| P0_A_GATE_HOLD | 28 | 必须由 A 处理物理技术条件或提出进一步证据 |
| P1_F02_1_SUPPORT | 177 | F02-1 基础物理对象的支持候选 |
| P2_DEFERRED_DETAIL | 23 | 有明确延期依据的 REVIEW 候选 |
| P2_LATER_DOMAIN_DETAIL | 115 | 下游域或可推迟的技术字段 |
| **合计** | **376** | **全部仍 CANDIDATE_UNFROZEN，DDL 测试 NOT_RUN** |

原 80 个 REVIEW 逐条有字段 ID、具体来源 PDM、处理分类、建议空值和延期理由：29 项 CORE_PROPOSAL；28 项 A_TECHNICAL_HOLD；23 项 DEFER_WITH_REASON。没有将技术建议冒称成产品规则或 G0 字段冻结。

## 三、28 项明确待 A 解决的字段

| ID | 字段 | 延期 / 技术阻断事实 |
|---|---|---|
| F02-F-0027 | employees.store_id | 员工可能有跨门店或历史归属，单个store_id不能推定完整组织关系，待PDM-02的技术映射审查。 |
| F02-F-0030 | employees.main_role_id | 主角色FK不足以证明单角色终身有效；角色模板与历史关系需F03技术合同。 |
| F02-F-0054 | employee_data_scopes.scope_reference_id | scope_kind可能有全局范围或具体对象范围，需要条件非空而不是一律非空。 |
| F02-F-0062 | customer_entitlement_events.granted_by | 权益变更可能由员工或系统执行，必须先确定actor_kind与身份键方案。 |
| F02-F-0105 | vehicle_brands.status | 品牌治理状态可能包含待确认/缺失信息；无现行完整枚举，不提前规定可空。 |
| F02-F-0109 | vehicle_series.status | 车系治理状态应与父级存在性分层，缺失映射仍允许治理，不任意封死。 |
| F02-F-0114 | vehicle_models.model_name | PDM-05允许JYT model_id先建立不完整本地车型，model_name不应一律非空。 |
| F02-F-0129 | vehicle_images.relative_path | PDM-08源图片与自有相对路径可能存在资产化失败中间态，需明确路径空值合同。 |
| F02-F-0149 | vehicle_price_history.changed_by | 上游价格同步与员工手动调价actor不同；裸changed_by员工ID不足覆盖系统来源。 |
| F02-F-0153 | pricing_rule_versions.approved_by | 生效配置可能由不同控制平面actor批准，需明确actor_kind后设FK。 |
| F02-F-0157 | pricing_rule_ranges.max_price_cents | 阶梯区间是否允许最后一个开放上界要以正式计算合同证明，不能自行把NULL解释为无穷。 |
| F02-F-0200 | priority_leases.trigger_demand_id | Priority可以有关联Demand上下文但不能等同Demand；可空候选须核验实际创建入口。 |
| F02-F-0239 | customer_collaborations.scope_json | 该字段对应当前领域事实：限定协作能力；建议非空是技术方案，仍须A确认具体枚举/数据迁移边界。 |
| F02-F-0266 | waitlists.active_lock_id | 候补关联的获锁事实可能已结束；active_lock_id不能无条件永远引用当前active锁。 |
| F02-F-0271 | deposit_receipts.lock_id | PDM-19多笔Deposit关联Lock/Transaction存在状态演进，需先审真实资金来源对象。 |
| F02-F-0289 | refund_cases.expected_amount_cents | 可退余额随退款/纠错动态变化，expected_amount不是固定权益值，需额外事务检查。 |
| F02-F-0300 | financial_corrections.correction_amount_cents | 财务纠错可能是状态或归属纠错，不能强制每一纠错均带非空金额。 |
| F02-F-0306 | publisher_phone_cache.phone_secret | 取号失败没有合法电话密文，混放成功与失败行的非空策略必须技术裁定。 |
| F02-F-0307 | publisher_phone_cache.fetched_at | 失败尝试不能伪造成功fetched_at；建议NULL时另记attempt事实。 |
| F02-F-0324 | notification_events.source_object_id | 通知未必有单一实体对象ID，需按事件类型确定条件非空。 |
| F02-F-0340 | audit_events.actor_id | actor可能是System Admin/Worker/Employee/系统，actor_id随actor_kind条件存在。 |
| F02-F-0341 | audit_events.role_context | 并非每次Audit都能安全携带完整权限快照，需控制敏感信息投影。 |
| F02-F-0343 | audit_events.object_id | 全局治理动作未必对应单个object_id；需按object_kind核对。 |
| F02-F-0351 | config_versions.payload_json | 版本化配置需保留真实payload，但结构化字段的强制条件要按配置域决断。 |
| F02-F-0370 | share_attributions.vehicle_id | 分享事件可能不是车辆链接，车辆ID应随分享种类条件出现。 |
| F02-F-0371 | share_attributions.sharer_customer_id | 不能为没有已登录分享客户的合法获客事实伪造sharer_customer_id。 |
| F02-F-0372 | share_attributions.source_employee_id | 只有真实绑定销售的分享/转介绍事件才需要员工归属FK。 |
| F02-F-0377 | customer_wechat_identities.identity_scope | 微信身份唯一性应当按scope+identity_key，而不是手机号/全局不同平台强合并。 |

另外 23 项有据延期：F02-F-0006 customers.updated_at、F02-F-0040 roles.status、F02-F-0043 permissions.hard_deny_category、F02-F-0058 customer_levels.status、F02-F-0077 vehicle_source_facts.upstream_car_code、F02-F-0101 manual_draft_history.change_summary、F02-F-0121 jyt_model_source_mappings.conflict_flag、F02-F-0131 vehicle_images.sort_index、F02-F-0136 vehicle_documents.customer_visible、F02-F-0142 image_asset_jobs.retry_count、F02-F-0159 pricing_rule_ranges.range_exclusion、F02-F-0188 matching_dictionary_rules.version、F02-F-0195 demand_match_results.match_explanation、F02-F-0196 demand_match_results.current_state、F02-F-0296 refund_payments.source_reference、F02-F-0309 publisher_phone_cache.last_updated_at、F02-F-0325 notification_events.dedupe_key、F02-F-0328 announcements.version_id、F02-F-0334 banners.target_kind、F02-F-0336 banners.sort_order、F02-F-0337 banners.updated_at、F02-F-0357 idempotency_records.result_ref、F02-F-0363 outbox_events.result_state。注意：以上 28 项只代表高风险技术 HOLD 子集，**376 项都是尚未获 A 冻结的字段**。完整未冻结字段清单为 field-tiers-376.tsv，不能谎称仅剩 28 项。

## 四、跨对象与权限/价格的 F02-1 前置合同

- Vehicle 与 listing_cycle 必须由同一真实 vehicle_id 串联，候选复合键可按 (listing_cycle_id,vehicle_id) 对齐，不能只凭两个独立单列 FK 放行错车引用（PDM-04）。
- Consultation、Recommendation、LockRequest、Lock、Waitlist、Transaction、Refund、来源 Demand 等对象与 Customer 必须有一致身份约束；Refund Lock XOR Transaction 还需要与目标 Customer 及真实余额进行事务关联，不只靠 CHECK（PDM-14/15/18/19）。
- 当前矩阵 **缺 consultations.listing_cycle_id**，无法充分承载 PDM-15 同 customer + vehicle + listing_cycle 的非终结咨询唯一性。此项明确列为 A 必须裁定的 P0 缺口，而不是擅自写 DDL。
- role_permission_defaults 的 role + permission、employee_permission_overrides 的 employee + permission 在同一时点仅一条当前有效授权；版本历史必须追加保留。A 需选择“当前表+独立历史表”或“有效期版本+active部分唯一”技术路线；现有候选缺完整 version/ended_at 结构。F03 的 hard DENY 和实时撤权仍未施工（PDM-02）。
- PDM-10 每日额度是 (customer, 上海自然日)，与单车周期解锁权 (customer,vehicle,listing_cycle) 两套独立事实。单车权跨日不消失、跨重新上架的新 cycle 不继承；UNLIMITED 浏览不扣当天额度、不自动批量新建周期解锁权；同一自然日临时追加数量不因进入 UNLIMITED 被删除，同日回 LIMITED 继续生效；Recommendation 免费权与 quota 分离。当前 customer_daily_price_access 混有 day/cycle 字段，A 需裁定拆账承载，不能用一个唯一索引混合两套语义。
- 角色历史、价格授权账本、Consultation cycle 关系、Refund 同客户关系仍为 **物理设计冻结阻断项**，F02-1 的实际模式和并发测试均 NOT_RUN。

## 五、真实测试环境、命令、证据

**最终通过代码 CI**：https://github.com/suzhe868-arch/mb/actions/runs/37706637960

运行环境：GitHub Actions Ubuntu，Node 22.16.0、锁定 npm/pg 依赖；独立 PostgreSQL 16 一次性 CI 容器，数据库 f02_schema_test，测试角色 f02_ci，非超级账号。以下均在 engineering/ 执行。

| 真实步骤 | 结果 |
|---|---|
| npm ci --ignore-scripts --no-audit --no-fund，npm run check | F01 基础回归 13/13 PASS |
| node f02-g0/matrix-audit.mjs | 376 字段、65 实体候选、25 PDM 来源、一致性通过，无客户合并，仍全未冻结 |
| node --test f02-g0/tests/review-coverage.test.mjs | 分级与80项REVIEW覆盖 2/2 PASS |
| node --test f02-g0/tests/*.test.mjs | 当前 F02-G0 全部 19/19 PASS，含33项P0字段台账、非法空值/合并恢复等负例 |
| node f02-g0/preflight.mjs | PG16 本机隔离空库身份 PASS；READ ONLY 拒写 SQLSTATE 25006 PASS |
| 用错密码 / F01 库 / --apply 再运行 preflight | 全部按预期拒绝，PASS |
| 创建 CI专用空的非public测试 schema 再预检 | 必须拒绝，PASS |
| 在该 schema 创建合成测试关系后再次预检 | 必须拒绝，PASS |

两个额外 review 测试同时包括在 19 项总体 G0 单测之中，不重复累计。用于反例的 CREATE SCHEMA/CREATE TABLE 仅是在 **GitHub disposable测试数据库**建立合成负例夹具，不是 F02-1 Current Initial Schema，不执行旧迁移、种子、清库或真实业务操作。

**真实失败证据保留**：
- https://github.com/suzhe868-arch/mb/actions/runs/37706390045 ：第一次全库元数据 SQL 的 JavaScript 字符串语法失败；提交 5dd63ff8 修复。
- https://github.com/suzhe868-arch/mb/actions/runs/37706539562 ：新增 P0 台账中 Consultation.vehicle_id 空值候选仍为 REVIEW，核心单测拦截；提交 9fa41ed8 按 PDM-15 修为 NO + FK。
- 新代码 CI https://github.com/suzhe868-arch/mb/actions/runs/37706637960 完整复验 SUCCESS。

## 六、B 请求 A 再次验收

1. 复核全部 376 个字段分级、80 个 REVIEW 逐项处理和 33 核心身份字段的技术建议及其 Authority，要求 A 指定哪些物理可空/键策略可进入 F02-1。
2. 对 28 项 A_TECHNICAL_HOLD 和 Consultation 周期键、角色覆盖历史、PDM-10 双账本、退款身份及并发边界形成裁定或退回具体字段；B 不自行改产品规则。
3. 验收隔离 PG16 只读预检扩展：非public schema（即使没有表）、非public合成表均必须被阻断，同时保持原有 public 空库、错误密码、错误库和迁移参数拒绝。
4. **只有 A 正式签发 G0_ACCEPTED 后，B 才可进入已条件授权的 F02-1 独立空库施工测试**。不得因本报告自验通过就自行开工 F02-1。
5. F02-2/3/4、实际已迁库/生产库、旧迁移和清库、F03/F04正式业务、main/C及PDM Final、Current IA、Low-Fi均未操作，保持冻结。

**B 最终状态：READY_FOR_A_RE_REVIEW，不宣告 G0_ACCEPTED。**
