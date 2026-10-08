# 名邦汽车 V1｜A 主控 F02-G0 施工范围一致性定向补审单（四项）

> 日期：2026-10-08
> 用户授权：“同意，确定执行”；授权 A 将本次四项范围问题形成正式补审单并安排 B 工程分支落实，不等于重新授权 F02-1 开工或允许 A 代写业务 Schema。
> A 审核基点：`main=c4c9aa72b5d6d5bdc895473fbb8e8dc3568d19af`；`feat/f02-schema=ea14fb372a6ab598177d1a8a067e2b1df3ebf480`。
> 最近 CI：[37712078050](https://github.com/suzhe868-arch/mb/actions/runs/37712078050)，`completed/success`；F01 13/13、F02-G0 40/40、独立 PG16 只读/安全负例通过。
> 当前门禁：`G0_ENVIRONMENT_PASS / G0_CL01_CL02_PASS / G0_SCOPE_COVERAGE_PENDING / G0_MODEL_FREEZE_PENDING / G0_ACCEPTED=NO`。
> **性质**：仅 F02-G0 技术承载范围补审，不修订 PDM Final、Current IA、Current Low-Fi，不签发物理 DDL 或 F02-1。

## 1. 已通过事项不得重复返工

A 对 B 分支已经核实：
- 413 项原有候选字段 ID 保真；311 项拟纳入、91 项延期、11 项禁恢复排除。
- 53 个拟建最小完整实体形成身份键合同，96 条显式静态 FK 机器检查后断链=0，17 个实体整表延期/排除。
- G0-CL-01 外键依赖闭合、G0-CL-02 最小建表完整性：**本轮视为整改闭环通过**。最新 CI 已通过全部既有测试。
- 已批准的 Consultation cycle、权限当前表与独立历史、查价三账、Refund XOR 同客户、4S 不建组织层级与其他禁恢复项不变。

以上 PASS 仅限 G0 静态/隔离安全门禁；真实数据库建表、约束、并发、迁移运行仍为 `NOT_RUN`。

## 2. 本轮唯一剩余缺口：正式 F02-1 覆盖范围与整表延期不一致

现行 `07_重建工作区/F02_正式施工单_数据库模型与隔离开发_2026-10-08.md` §2 明确 F02-1 模型须覆盖“客户/名邦员工/4S/System Admin 的身份关系及基本审计事实”“Demand/Match、Priority、Recommendation、独立 visibility grant、Consultation/CRM/公海保护”等。当前 B `engineering/f02-g0/deferred-entity-register.tsv` 将如下实体整体 `DEFER_WITH_REASON`，理由仅为“非此阶段基础身份/FK的必需实体”，尚不足以解释正式工作单覆盖：

| 追踪编号 | 当前整表延期候选 | B 的 PDM 引用 | A 要求核对的最低正式承载事实 |
|---|---|---|---|
| G0-SC-01 | `system_admins` | PDM-02 / PDM-22 | System Admin 独立控制平面身份、有效状态、初始化/治理与基本审计；不得把 Admin 当 Employee 业务角色或 Customer owner |
| G0-SC-02 | `demand_match_results` | PDM-12 / PDM-13 | Demand×Vehicle 正式四级 Match Result、listing cycle、current/stale/history、Priority 仅消费合法 current Result；不得用 Demand 本体字段伪造第二套 Matching |
| G0-SC-03 | `crm_followups` | PDM-16 / PDM-17 | 已发生的统一 CRM Follow-up 历史、客户与真实责任人/时间事实；未来待办/回访计划不同于已发生跟进，不能以 Customer 最近跟进字段代替完整事实 |
| G0-SC-04 | `public_pool_events` | PDM-03 / PDM-17 | Customer 正式进入/退出公海、owner/分配转移和不可覆盖的历史事实；不得把待公海候选直接视为正式进公海，不得由单一当前 owner 字段代替历史保护 |

四个表名均只是**候选技术命名**，A 没有新增“必须四张表都叫该名称”的产品规则。B 可证明由其他已纳入实体完整物理承载；但对每项，必须逐事实、逐字段提供对应证据。若现有实体无法完整承载，应提出**最小承载补纳**，保留当前原编号；不得用“反正 F03/F04 以后实现”来遗漏必须持久化的身份/历史/结果事实。

## 3. B 唯一允许执行的补审

B 在 `feat/f02-schema` 新建或修订一份 `F02-G0_四域范围承载映射与延期裁定候选` 台账，对 G0-SC-01～04 **逐行**填写：
1. `Authority`：实际 PDM Final 条款、F02 正式施工单段落；注明 IA/Low-Fi 相关事实时引用真实页/状态。
2. `required_fact`：最小需要持久化的身份、状态、结果、历史、唯一性/追溯字段，而非简单写“这个模块以后再做”。
3. `physical_carrier`：拟施工实体和具体字段 ID（来自 `field-matrix.tsv`），以及 PK/FK/索引/审计责任层；如新补实体/字段则说明新增编号及所有依赖。
4. `phase`：`F02_1_MINIMUM` 或 `LATER_WITH_EXPLICIT_BOUNDARY`；若延期，明确 F02-1 仍由何处承载最低必须事实，不能留下逻辑断层。
5. `disposition`：`INCLUDE_MINIMUM`、`COVERED_BY_EXISTING_WITH_EVIDENCE`、`DEFER_ONLY_NONESSENTIAL_DETAIL` 或 `BLOCKED_REQUEST_A_ADJUDICATION`；**不可直接自签 A_ACCEPTED**。
6. `negative_case`：针对该域至少一条可机器核验/静态自验的遗漏或禁恢复负例；未来运行/并发属 F02-1/F03/F04 时写 `NOT_RUN` 而非假报 PASS。

建议优先核对是否必须补纳四个实体的最小主键、关系及业务事实，而不是为了维持“53 表”计数而强行延期。数量可以因真实依赖变化；变更前后必须精确说明 413 行、53 实体、96 FK 的变化，或者提供稳定不变的逐字段复用证据。更改候选实体/字段必须同步 `field-matrix.tsv`、`field-freeze-candidates.tsv`、`field-tiers-376.tsv`、`buildable-entity-contract.tsv`、`foreign-key-closure.tsv`、`deferred-entity-register.tsv` 及有关校验/CI，保持现有闭合检查可复现。

**禁止：**
- 仅改测试期待值、篡改 PDM 或移除正式工作单范围来凑数；
- 将 System Admin 与 Employee/4S 角色合并、废弃四级 Matching、以任务代替历史 Follow-up、把公海候选误作正式公海；
- 重新施工已验收的 G0-CL-01/02、动 F01/设计分支、擅自启动 F02-1 DDL/历史迁移/真实库/生产或合并 main。

## 4. A 下一次复审的唯一门禁

B 交付：最新提交 SHA、四域逐事实与物理字段映射、拟纳入/延期变化清单、自动正反例与真实 CI 链接、尚未实现/未来守卫责任及是否需要 A 技术再裁定。

A 仅核验：
- G0-SC-01～04 **4/4 均有明确合法的最低物理承载**，或以精确 `BLOCKED` 列出无法在当前已授权工作单内解决的真实冲突；
- 矩阵完整、一致、身份/历史未丢、当前禁恢复项仍阻断，先前 CL01/02、F01/G0 与 PG16 隔离测试不回退；
- 不要求 B 在 G0 做真实 DDL、种子导入、运行期权限及交易并发 E2E。

四项成功闭环后，A 方可继续**独立判断并明确签发** `G0_ACCEPTED`；签发之前 F02-1 继续不得施工。用户关于其他工作包及 main 合并的独立审批制度保持不变。

**C/H01 视觉复审独立进行，不因本次工程补审改变设计优先级。**
