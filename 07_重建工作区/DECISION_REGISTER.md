## A-F05-CATALOG-ISSUE204-PR210-ACCEPT-01｜目录客户价格权益投影与确定性搜索独立验收通过并标准合并

- Issue [#204](https://github.com/suzhe868-arch/mb/issues/204) 已完成并关闭；业务 PR [#210](https://github.com/suzhe868-arch/mb/pull/210) 已标准合并，merge SHA `c2087a15fd3d124080e549acc02b515fb877ba8e`。
- B 最终 HEAD `b1d548d441463b77cf896aac02eff8515560a347`；合并前基线 main `2b0debb0de8c16f19738748dae59254bf7c2bcc2`，9 个变更文件均在原白名单内。
- 官方 Push Run [#39743949320](https://github.com/suzhe868-arch/mb/actions/runs/39743949320) / Job `119707678630` 全步骤成功；Node/兼容 88/88、排序 PG16 3/3、价格解锁 PG16 13/13、Rule Dictionary PG16 7/7、真实 HTTP+PG16 集成 6/6，合计 117/117，失败 0、跳过 0。
- Artifact [#12410562743](https://github.com/suzhe868-arch/mb/actions/runs/39743949320/artifacts/12410562743)，8,319 bytes，SHA-256 `3d1d3108c7bbf813d45f7868e0730a4daeb2a61134b96b7c3a58a3ae2459d8ce`；内部 HEAD/Run/branch 正确，8 条文件摘要全部复算通过。
- 第三轮将 Recommendation price-grant、Matching discovery/affected queue、Priority qualification 与 TTL scheduler 共 7 张表补入完整无副作用快照。27 张相关表均用全行数量与 JSONB 摘要比较；普通搜索分页、偏好型筛选、数字价格区间搜索前后不变。
- 仅接受 Disposable、非超管 PG16 与真实 Node HTTP 的非生产子范围；不代表正式 Customer/Price Issuer、F03 Scope/Object、F05 转换正向 Issuer、JYT/Collector/CDN/OSS/Feishu 或 F01～F08/V1 生产就绪。
- 完整中文报告：`07_重建工作区/F05目录客户价格权益投影与确定性搜索PR210独立验收与合并报告_2026-10-22.md`。

## A-F08-SOURCE-GATE-RETURN-01｜F05目录任务闭环后转回 Issue187 父级来源门禁

- 当前唯一指针：`NEXT_OWNER=A`、`NEXT_TASK=A_F08_SIGNED_SOURCE_AND_STAGE_GATE_01`、`NEXT_ISSUE=187`、`NEXT_BRANCH=NONE`。
- A 对 PR #210 合并后的 main 做增量核对；正式 F03 capability/Vehicle Scope/Object、F05 转换正向 Issuer、publisher.phone.sensitive 可信来源及 SLA/Incident 正式来源仍无新可核验签名证据。JYT/Collector、图片存储/CDN、Feishu 仍按用户确认尚未准备。
- F08-2/F08-3 已验收资产直接复用，不重复模拟、不创建新的 B 任务；若来源/授权未就绪，继续保持 SOURCE_GAP / FAIL_CLOSED。F06/F07/F08/V1 仍 `NOT_READY / NO_PRODUCTION`。

---

## A-F05-8-ISSUE203-PR208-ACCEPT-01｜Priority TTL 非生产持久调度器独立验收通过并标准合并

- Issue [#203](https://github.com/suzhe868-arch/mb/issues/203) / PR [#208](https://github.com/suzhe868-arch/mb/pull/208) 已由 A 独立验收并标准合并。
- B 最终 HEAD `8a18b0d12c54c607ee9555e8dda582ccd40f840a`；merge SHA `31881d1d092cea220087e527fdac7da03141480e`；7 个新增文件、0 删除，严格位于施工单白名单。
- 专用官方 Push Run [#39732168499](https://github.com/suzhe868-arch/mb/actions/runs/39732168499) / Job `119669460022` 全步骤成功；单元 6/6、Priority TTL 关联 PG16 回归 5/5、新 runner 真实 PG16 集成 8/8，失败 0、跳过 0。
- A 已下载核对 Artifact [#12406100445](https://github.com/suzhe868-arch/mb/actions/runs/39732168499/artifacts/12406100445)：压缩包 SHA-256 `e5f6f7800a0d8edf12387f1877d286cb686ac0071c965ee8e91d926ac696e092` 与 GitHub 元数据一致；内部 HEAD、Run ID、分支和全部文件 SHA-256 均匹配。
- 真实 PG16：127 张公开表，`f05_catalog_ci` 非超级用户；到期重仲裁、替代 Priority、batchLimit、双 runner 并发、事务故障 retry、硬截止退出 124、lease 重启恢复、实际 SIGKILL、空队列、SIGTERM 和 max runtime 均通过。
- 同 SHA 冻结宽范围 workflow Run [#39732168405](https://github.com/suzhe868-arch/mb/actions/runs/39732168405) 有 52 个检查，21 success、31 failure；均为旧 F03/F04/F05-1～F05-3 回归，不属于 Issue #203 专用矩阵。A 不将其伪报通过，已在报告中列出全部 31 个失败名称和适用性；不改冻结 workflow。该结论只验收 F05-8 非生产子范围，不宣称仓库整体 CI 全绿或生产就绪。
- 完整报告：`07_重建工作区/F05-8_Issue203_PR208独立验收与F05目录搜索任务放行报告_2026-10-22.md`。

## A-F05-CATALOG-ISSUE204-ACTIVATE-01｜F05 目录客户价格权益投影与确定性搜索正式激活

- Issue [#204](https://github.com/suzhe868-arch/mb/issues/204) 是已确认的独立后端缺口，现随 NEXT 指针切换正式激活。
- 唯一 B 任务：`F05_CATALOG_CUSTOMER_PRICE_SEARCH_01`；分支 `feat/f05-catalog-customer-price-search-01`；施工单 `07_重建工作区/F05目录客户价格权益投影与确定性搜索非生产施工单_2026-10-22.md`。
- 复用现有 price-unlock/quota ledger、六项排序和 Rule Dictionary；只新增目录 Customer 权益投影与确定性搜索接线及专用非生产 PG16 测试，不重写已验收业务。
- Issue #187 的外部来源门禁不阻断本任务；Issue #204 不得开发 PC/手机页面、不接生产、不伪造正式 Issuer/城市事实。

---

## A-F05-7-ISSUE201-PR206-ACCEPT-01｜Matching 持久调度器独立验收通过并标准合并

- Issue [#201](https://github.com/suzhe868-arch/mb/issues/201) / PR [#206](https://github.com/suzhe868-arch/mb/pull/206) 已由 A 独立验收；PR 已按 merge 方法标准合并。
- B 最终 HEAD `f4d7180d7fb38525cbe63bf697bc7fc3bb300f4b`；合并 SHA `7e00859edf59e1c93254de17cd5543fa7bae6960`。
- 官方 Push Run [#39729060862](https://github.com/suzhe868-arch/mb/actions/runs/39729060862) / Job `119659641450` 全成功。单元 7/7、既有 Matching retry PG16 回归 8/8、新调度器 PG16 集成 1/1，失败 0、跳过 0。
- A 独立下载并核对 Artifact [#12404152577](https://github.com/suzhe868-arch/mb/actions/runs/39729060862/artifacts/12404152577)：压缩包 SHA-256 `79596be0bfeaaff07e7b4bc60029d8451f7c929f0c4f7eb1ced065293124ccda`；内部 HEAD/Run ID/分支与最终提交和官方 Run 一致。PG16 数据库 `f05_catalog_test`、角色 `f05_catalog_ci`、`rolsuper=false`，127 张公开表。
- 三项首轮阻断均已复验通过：员工会话凭证真实验真及无效会话拒绝；启动时拒绝超级用户；慢 tick 到期以退出码 124 终止，并通过持久 lease 在重启后恢复。改动严格限于七个新增白名单文件。
- 完整报告：`07_重建工作区/F05-7_Issue201_PR206独立验收与F05-8正式接续报告_2026-10-22.md`。
- **仅接受 `DISPOSABLE_TEST_ONLY / NOT_PRODUCTION` 子范围**。不宣称 F05 整体、F01～F08/V1 全局或生产就绪；不代表 JYT/Collector/CDN/OSS/飞书/正式 Issuer 已接通。

## A-F05-8-ISSUE203-ACTIVATE-01｜F05-8 Priority TTL 持久调度接续激活

- Issue [#203](https://github.com/suzhe868-arch/mb/issues/203) 已由 A 从既有排队状态激活；唯一下一 B 任务为 `F05_8_PRIORITY_TTL_SCHEDULER_01`，分支 `feat/f05-8-priority-ttl-scheduler-01`，施工单 `07_重建工作区/F05-8_Priority到期重仲裁持久调度非生产施工单_2026-10-22.md`。
- 新任务只新增独立非生产 runner 和专用 Push 工作流，复用现有 Priority worker；不修改已验收业务算法，不依赖 Issue #187 的外部资源，不开发 PC/手机页面，不接生产。
- Issue #204 继续排队，必须等 #203 通过 A 独立验收并合并后再激活。

---

## A-PC-PHONE-PERMISSION-UI-DEFERRED-01｜产品规则保留，PC页面延期至F01～F08后

- 用户于 2026-10-22 明确决定：当前优先完成 B 的 F01～F08 后端工程与功能实现，PC 管理后台页面暂不开发，不因电话权限设置提前建设整套后台。
- **只延期 PC 页面，不延期后端业务功能。** B 必须在 F01～F08 后端交付范围内完成员工电话能力授予/撤销、专项范围持久化、服务端访问校验、审计、撤权即时生效及正式配置 API，并提供真实隔离 PG16 正向/安全负例证据。A 在 B 后端最终整体验收前核对对应施工单与证据；若路线遗漏，A 应在最终验收前安排最小必要的 B 后端差异任务。此记录不代表立即放行新 B 分支，也不能绕过 Issue #187 的来源/外部授权门禁。
- 产品规则**不是新需求，也不得丢失**：已由产品决策 PR [#189](https://github.com/suzhe868-arch/mb/pull/189) 合并，并正式写入 [PDM-02](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/PDM-02_%E6%9C%80%E7%BB%88%E5%AE%8C%E6%95%B4%E8%A7%84%E5%88%99.md) 与 [PDM-09](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/PDM-09_%E6%9C%80%E7%BB%88%E5%AE%8C%E6%95%B4%E8%A7%84%E5%88%99.md)：PC「员工管理 → 员工详情 → 权限设置」按员工授予/撤销既有 `publisher.phone.sensitive`，并选择 `LOCKED_ONLY` 或 `ALL_ACTIVE_JYT`；不新增 `can_call_wholesale_phone`，不要求逐车负责人，也不扩大其他车辆或资金权限。
- 为防止后续前端遗漏，已建立独立后续待办 [Issue #196](https://github.com/suzhe868-arch/mb/issues/196)，状态为 `BACKLOG / DEFERRED / NOT_AUTHORIZED_FOR_IMPLEMENTATION`。该 Issue 记录未来页面范围、功能边界、验收标准与启动条件；不构成当前 C 页面授权。
- 当前唯一主任务指针保持不变：不修改 `NEXT_OWNER/NEXT_TASK`，不把 Issue #196 放入 `NEXT_ACTION.md`，不启动 C 的 PC 页面，不干扰手机端 PR #68，也不改变 A 当前 Issue #187 的 F08 可信来源与外部授权门禁。
- 未来 PC 页面仅在 B 后端功能完成并经 A 最终整体验收、正式 API/错误合同可用、PC IA/设计基线满足仓库门禁后，由 A 从 Issue #196 派生具体 C 施工单。真实 JYT/Collector 电话来源仍须单独满足 Issue #187；合成测试不等于真实外部接入。
- 本条仅登记延期与需求追踪，不改 PDM Final、不更改当前后端验收状态，不授权生产或真实外部电话调用。

---

## A-ISSUE187-EXTERNAL-SYSTEMS-NOT-READY-01｜用户确认三项外部资源未准备，停止重复模拟施工

- 用户于 2026-10-22 明确确认：**JYT/Collector 尚未准备；图片存储/CDN 尚未准备；飞书尚未准备**。此为用户提供的当前资源状态，已同步至 `engineering/f07/nonprod-runtime-integration/SOURCE_GAP与外部授权依赖台账.tsv`。
- A 已复核最新 main、Issue #187、正式 F03 capability/Vehicle Scope/Object 读取器、F05 转换正向来源和 F07 Runtime 的外部依赖边界。正式 F03 仍 fail-closed，F05 正向 Issuer 仍无合法证据；合成回调、MockStorage/MockCDN、本地 outbox 均不能证明真实外部系统接通。
- F08-3 Issue #190 / PR #193 已验收合并，治理 PR #194 已合并。F08-2 的 58+7 与 F08-3 的 43+26+16 测试结果直接复用，不重跑。
- A 裁决：现有证据下没有新的、可合法验收且不依赖缺失外部资源的 B 业务施工差异。当前只推进 A 的来源审计、依赖状态登记和交接；不创建新 B 分支，不伪造签名、上游回执、对象存储或飞书投递结果。
- 解锁条件：获批的 JYT/Collector 非生产端点与可信 publisher 映射；获批对象存储/CDN 测试资源；飞书测试租户/机器人/测试群与路由授权；另需正式 F03 capability/Vehicle Scope/Object 与 F05 转换 Issuer 的可核验证据。凭据通过批准的密钥托管提供，不粘贴在聊天中。
- 唯一指针：`NEXT_OWNER=A`、`NEXT_TASK=A_F08_SIGNED_SOURCE_AND_STAGE_GATE_01`、`NEXT_ISSUE=187`、`NEXT_BRANCH=NONE`。F06/F07/F08/V1 继续 `NOT_READY / NO_PRODUCTION`；C PR #68 独立不动。
- 完整报告：`07_重建工作区/A_Issue187外部系统未准备阻断登记与独立工作盘点_2026-10-22.md`。

---

## A-F08-3-ISSUE190-PR193-ACCEPT-01｜F08-3 非生产子范围验收通过，回到 F08 来源父门禁

- Issue [#190](https://github.com/suzhe868-arch/mb/issues/190) 已通过 A 限定非生产子范围验收并关闭；业务 PR [#193](https://github.com/suzhe868-arch/mb/pull/193) 已标准合并。B 最终 HEAD `662847bf2e75c9ca404dff8e57902850d8fe4673`，merge SHA `5cb52e6754e3e171cb9e1a67e3aef51c8e78dfcc`。
- 官方 Run #39665372029：独立非超管 PG16 业务 43/43、受影响回归 26/26、HTTPS 16/16；最终 SHA 30/30 Check Runs success；Artifact #12377127302/#12377287037 均非空有效。
- 本次只接受 `CI_SYNTHETIC_ONLY` 内部非生产电话权限/专项范围纵切。真实 Collector/JYT、publisher 物理映射、正式 F03 capability/Scope/Object、F05 转换正向 Issuer、SLA/Incident、CDN/OSS/Feishu 仍 `SOURCE_GAP`；F06/F07/F08/V1 仍 `NOT_READY / NO_PRODUCTION`。
- GitHub 原生 APPROVE 因当前连接身份同时为 PR 作者而拒绝；A 已在 PR #193 留下完整独立验收 COMMENT review（ID `5605599960`），随后按期望 HEAD SHA 执行标准 merge。未将 COMMENT 伪报为原生 APPROVED review。
- **下一唯一指针：** `NEXT_OWNER=A`、`NEXT_TASK=A_F08_SIGNED_SOURCE_AND_STAGE_GATE_01`、Issue [#187](https://github.com/suzhe868-arch/mb/issues/187)、`NEXT_BRANCH=NONE`。当前没有新的 B 施工包授权；A 继续核查可信签名来源与外部授权门禁。完整报告：`07_重建工作区/F08-3_Issue190_PR193独立验收与合并报告_2026-10-22.md`。

---

## A-F08-3-PUBLISHER-PHONE-SCOPE-RUNTIME-RELEASE-01｜用户批准电话范围后发布最小非生产纵切

- 用户批准的电话范围规则已由 [PR #189](https://github.com/suzhe868-arch/mb/pull/189) 标准合并，merge SHA `d7cb1b32cea64035d3fe9cb67cc3f7ba8ab3cb32`。既有权限 `publisher.phone.sensitive` 按员工单独授予，范围二选一：`LOCKED_ONLY` 或 `ALL_ACTIVE_JYT`；不要求逐车负责人，不新增 `can_call_wholesale_phone`。
- A 审核现有代码确认：permission-contract 对三个 publisher phone 动作仍标 `TECH_ALIAS_PENDING_A`；F03 current-facts 的最终 Scope/Object 仍 fail-closed；F07 phone latest/dial 仍为 source-gap 拒绝，测试回调仅合成；当前 F03 80 表事实读取器不应被直接放宽。故只发布一个精确、隔离、非生产 B 纵切。
- 正式施工单：`07_重建工作区/F08-3_批发上游电话员工专项范围与PG16非生产Runtime纵切_A主控B正式施工单_2026-10-22.md`；Issue [#190](https://github.com/suzhe868-arch/mb/issues/190)；B 分支 `feat/f08-publisher-phone-scope-runtime-nonprod-03`。本治理 PR #191 已标准合并 main，授权现已生效。
- 白名单仅包含三个电话动作的静态映射行、对应 capability-scope contract 行、F07 Runtime 的 phone latest/dial 接线、新增 F08-3 CI-only package/workflow，以及 F07 来源台账的 publisher phone 行。F03-1/F02 冻结迁移、F03 current-facts/Policy/既验 Customer Guard、F05/F06、生产 Server、图片/通知/Incident、C PR #68 均只读。
- 目标是验证真实隔离 PG16 的当前员工权限、个人 deny、Lock/ListingCycle/source/state 与两种专项范围，包含 CI-only System Admin grant/revoke/mode configuration；仅使用合成 publisher/phone/Collector callback，不调用真实外部服务、不启用生产路由。电话访问不依赖 F05 转换正向事实。
- 本任务不完成真实 publisher 物理映射、真实 JYT/Collector、CDN/OSS/Feishu 或 F08 整阶段验收。F06/F07/F08/V1 仍 `NOT_READY`；B 达到 `READY_FOR_A_REVIEW` 后由 A 独立验收，再回到 Issue #187 处理剩余来源门禁。C 轨不动。

---

## A-PUBLISHER-PHONE-SCOPE-DECISION-2026-10-22｜批发车上游电话按员工授权与两种专项范围

- **用户已明确批准的产品决策**：PC 后台「员工管理 → 员工详情 → 权限设置」对单个员工独立授予/撤销既有 `publisher.phone.sensitive`；获授权后必须二选一：`LOCKED_ONLY`（仅当前有效 Lock 状态的批发车）或 `ALL_ACTIVE_JYT`（全部当前在售 JYT/wholesale 车源）。
- 批发车来自批量采集，**不要求逐车指定销售负责人**。锁定模式依现有正式 Lock 状态判定；申请中、拒绝、取消、过期不算有效锁定。全在售模式不要求先锁车或有 Transaction，但仅开放上游电话动作，不赋予编辑、转名邦、下架/隐藏、Lock 审批、Transaction、价格或资金权限。
- 这两种模式是 `publisher.phone.sensitive` 的**专项访问范围**，服从 PDM-02 的 identity + permission + data scope + object state；不得新增 `can_call_wholesale_phone`，不得扩大员工通用车辆经营范围。每次敏感动作实时复核，变更授权/范围必须审计，撤权与锁定过期立即生效。
- 正式规则同步至 `07_重建工作区/PDM-02_最终完整规则.md` 与 `07_重建工作区/PDM-09_最终完整规则.md`。本裁决只确定产品行为，不证明物理 capability catalog/vehicle scope、可信电话来源或真实 JYT/Collector 已接通。
- 本产品决策记录当时不直接授权 B 施工；后续是否发放工程任务以单独合并到 main 的 A 正式施工单和 NEXT_ACTION 指针为准。F08 整阶段与 V1 仍 `NOT_READY`。不重复 PR #8、PR #35、F08-2 已验成果，不动 C PR #68；真实第三方/生产/资金权限仍需独立授权。

---

# 当前有效裁决索引｜2026-10-22

## A-F08-2-ISSUE184-PR186-ACCEPT-01｜F08-2 非生产跨 Runtime 质量子范围通过

- Issue #184 关闭，业务 PR #186 标准合并，B 受验 HEAD `ff817ee0557858b9469260ed183d6ce32a83c759`，合并 SHA `a497fa7fb504ec1ed63c8eb202eb64999bb74e29`。
- 官方 Push Run #39643395145、独立非特权 PG16 Job #119372546965/#119372547635 成功；新增应用与启动18、父证据24、真库16，共58/58；受影响回归7/7；同 SHA Artifact #12366157062、#12365019484 均非空有效。
- 10 个全新增白名单文件，不修改旧 F01～F07/父业务/PDM/CI/主控状态/C。首次 B 归档旧 SHA 的通过条目与最终 SHA 的官方成功分开保留，A 读取最终 Run 和 Issue/PR 评论独立核实，不要求 B 为改静态待填报告重复运行 CI。
- 本裁决**仅接受 F08-2 非生产质量子范围**，并不接受 F08 整阶段、真实业务正向跨域 E2E 或 V1/生产就绪。详见 `07_重建工作区/F08-2_Issue184_PR186独立验收与F08剩余来源门禁报告_2026-10-22.md`。

## A-F08-STAGE-SOURCE-GATE-01｜来源/授权先决条件未满足前不重复发放 B 测试包

- 下一唯一职责 `NEXT_OWNER=A`、`NEXT_TASK=A_F08_SIGNED_SOURCE_AND_STAGE_GATE_01`、[Issue #187](https://github.com/suzhe868-arch/mb/issues/187)；当前没有新 B 分支授权。
- F03 Scope/Object、F05 转换签名、F07 `publisher.phone.sensitive`、SLA/Incident Issuer 与真实 JYT/Collector/CDN/OSS/Feishu 正式资源/权限保持 `SOURCE_GAP`；F06/F07/F08/V1 `NOT_READY`，不授权生产/真钱/实际退款/成交。
- 已验 F08-1 PR69、PR100、F06 PR174、F07 PR181、F08-2 PR186 直接复用。A 先排除真实来源缺失或产品权限阻断；未取得合法可施工新差异前，**禁止以 F08 阶段未完成为由令 B 重复类似模拟或质量测试**。
- 若需 A 可自主批准的技术修复，应列出精确文件、源来源与影响边界后正式授权 B；新增敏感权限、第三方真实服务、生产/资金需用户单独决定。F08 整阶段通过正式验收后才进行 A 独立的整个后端最终整体验收；C 轨隔离不动。
- ABC 三窗口操作 GitHub 保持当前聊天，禁止主动/自动转交 Work。

---

## 2026-10-22 上一阶段历史裁决（非现行 NEXT 指针）

# 当前有效裁决索引｜2026-10-22

## A-F07-ISSUE178-PR181-ACCEPT-01｜非生产四域 Runtime 独立验收
- A 已对 [PR #181](https://github.com/suzhe868-arch/mb/pull/181) 的 12 个白名单路径、业务边界与官方日志独立验收，B 受验 HEAD `32f180238ff3271b38d2b91402cf4a7b55e07d52`，标准合并 SHA `dd4a52a6f117ff83c959212f41f7c29ae68c507c`，Issue #178 已关闭。
- 官方 Push Run #39629427298 两非超管 PG16 Job #119323288481/#119323289005 全绿，46 新业务、15 HTTPS、26 影响回归均通过，两同 SHA 非空工件 #12357563978/#12357469078 有效；静态 B 模板旧 `PENDING_OFFICIAL_CI` 以 B 最终 Issue/PR 交接及 A 独立官验为准。
- **仅接受 F07 非生产四域接线子范围**；电话、F03 Scope/Object、F05 转换签名、SLA/Incident、真实外部 JYT/CDN/OSS/Feishu、生产和真钱均不授权，F06/F07/F08/V1 全域 NOT_READY。
- 报告 `07_重建工作区/F07_Issue178_PR181非生产Runtime独立终验与F08-2放行报告_2026-10-22.md`。

## A-F08-2-QUALITY-RELEASE-01｜有界非生产质量施工正式授权
- **下一唯一指针：** `NEXT_OWNER=B / NEXT_TASK=F08_NONPROD_CROSS_RUNTIME_QUALITY_02 / NEXT_ISSUE=184 / NEXT_BRANCH=feat/f08-nonprod-cross-runtime-quality-02`。
- A 施工单：`07_重建工作区/F08-2非生产跨Runtime安全关联回归与质量闭环_A主控B正式施工单_2026-10-22.md`。只在所属 A 治理 PR 标准合并 main 后生效；B 开工必须重新读取最新 main，在当前聊天使用 GitHub，不切 Work。
- F08-1 PR69、F05～F08 PR100、F06 PR174、F07 PR181 既有验收全部复用；仅新增两白名单路径 F08-2 质量工作，重点当前应用 FailClosed、跨 Runtime 隔离及可信证据，不在新 Ref 伪造旧父服务正向签名；双 PG16 Job、24新独立场景含8应用入口场景、官方同 SHA 证据是门禁。
- F08 整阶段按正常 A 验收完成后才由 A 独立开展整个 B 后端最终整体验收；不提前安排 B 重复全局审查，不授权生产/资金/外部真实调用，C PR68 独立不动。

---

## 2026-10-21 历史裁决索引（以下原“当前”已失效）

# 当前有效裁决索引｜2026-10-21

## A-F06-171-ACCEPT-01｜Issue171 非生产子范围验收通过

- PR #174 已标准合并；Issue #171 已关闭 completed。
- 受验业务 SHA：`06c880d7f53adda7862da88cde0b790fdc60f415`；PR #174 合并 SHA：`86f59431768f393232b8746cd3deb62f1044d85c`。
- A 治理 PR [#179](https://github.com/suzhe868-arch/mb/pull/179) 已标准合并，merge SHA：`9d8a94d4fe34e7a3f3ca17ac608175397e49a321`；Issue #178 正式放行已生效。
- 官方 Push Run #39602409488 成功；Artifact #12347892081 有效；161 张父表/24 条签名迁移跨 OID Seal 通过。
- 仅接受非生产 Composite Lock 生命周期与可信来源接线；不授予生产、真钱、实际退款/成交或外部服务权限。
- 完整报告：`07_重建工作区/F06_Issue171_PR174最终独立验收与合并报告_2026-10-21.md`。

## A-F07-RUNTIME-RELEASE-01｜放行非生产应用 Runtime 四域接线

- 既有 F07-1～F07-4（PR64–67）及 F08-1（PR69）均为已验收 CI-only 资产，直接复用，不重复施工。
- 当前应用入口尚无 F07 Runtime Handler；下一任务为 `F07_NONPROD_RUNTIME_INTEGRATION_01`，Issue #178，分支 `feat/f07-runtime-integration-nonprod-01`。
- 施工单：`07_重建工作区/F07真实应用Runtime四域接线非生产整包_A主控B正式施工单_2026-10-21.md`；差异核查：`07_重建工作区/F07现有CI成果与真实Runtime缺口_A主控核查_2026-10-21.md`。
- PR #179 已合并，正式放行已生效；不得新增产品权限，不接真实 JYT/电话、CDN/OSS、Feishu，不开启生产或真钱。
- F06/F07/F08/V1 总体仍 `NOT_READY`；F08 完整阶段验收后，B 后端最终整体验收由 A 独立负责。

---

## 历史裁决与验收记录（以下为历史快照；若与上方当前有效裁决冲突，以当前有效裁决为准）

# 2026-10-21｜DECISION_REGISTER补充：Issue171签名Match/Priority预置路径最小裁决

- 裁决只在本治理PR合并main后生效。
- 唯一新增范围：Issue171精确真实Push分支在签名v23调用未修改的F05-7官方预置与只读验真，在签名v24调用未修改的F05-8正式服务签发Priority；其后原有v25/D1/v26迁移顺序不变。
- 旧Issue164分支保留原迁移循环，不运行新预置。不得修改冻结F05源码、迁移、父签名表或公共DDL；不得原始SQL伪造Priority、用Mock/跨库复制替代、伪造GitHub环境或复用旧签名。
- 此裁决不是工程验收。B继续Issue #171原分支；PR #174不合并，直到最终SHA官方CI全步骤成功、0 skipped、跨OID Seal与同SHA证据通过A独立复验。
- F06/F07/F08/V1仍NOT_READY。

---

# 2026-10-21｜A第二轮独立复核PR174：Priority真实PG16测试失败，B继续原分支定向整改

- 对象：[PR #174](https://github.com/suzhe868-arch/mb/pull/174) / [Issue #171](https://github.com/suzhe868-arch/mb/issues/171)。
- B当前HEAD：`32abe113574bcef1bb5d3d591072a3b6f31fb023`。
- 官方Run：[39591349465](https://github.com/suzhe868-arch/mb/actions/runs/39591349465) **failure**；Artifact `f06-issue171-evidence-39591349465`是失败Run的部分证据，不可作为最终验收包。
- 新Lifecycle HTTP/真实PG16测试 **32/32通过**，旧Composite E2E **42/42通过**。
- **阻断**：真实Priority来源测试在调用F05-7 `saveSalesDescriptionCI` 时失败：`F05_7_SIGNED_V22_LEDGER_REQUIRED`。该旧F05-7服务只接受v22/v23时代的旧迁移账本，本任务当前Composite父库已是24条签名迁移。Priority真实测试未完成，签名来源负向矩阵未执行，161表/24迁移跨OID Seal、Legacy回归和最终证据门禁均被跳过。
- **下一责任人仍为B**：原Issue #171、原分支 `feat/f06-nonprod-composite-lock-lifecycle-01`。先只读核实当前v26父库是否已有有效真实签名Match/Priority事实；不得修改冻结F05-7/F05-8源码、迁移或父表，不得用原始SQL伪造Priority。若无可合法复用的真实事实，提交精确SOURCE_GAP证据给A请求最小技术裁决。
- 修复后需完成真实Priority来源四动作无副作用矩阵、签名来源负向测试、跨OID Seal、Legacy回归和同一最终SHA官方CI/Artifact；完成前PR #174不合并，Issue #171开放，F06/F07/F08/V1仍 `NOT_READY`。

---

# 2026-10-21｜A独立验收PR174：CI证据核实通过，但业务与签名来源负向测试两项阻断，B原分支定向整改

- **验收对象**：[PR #174](https://github.com/suzhe868-arch/mb/pull/174)，Issue [#171](https://github.com/suzhe868-arch/mb/issues/171)，B分支 `feat/f06-nonprod-composite-lock-lifecycle-01`。
- **已核实B最终SHA**：`9409e426c54e5b767a914cb134a7022aed77ffae`；官方Push Run [39576895129](https://github.com/suzhe868-arch/mb/actions/runs/39576895129)全部步骤成功；Artifact `f06-issue171-evidence-39576895129`存在且未过期。
- **真实证据**：Lifecycle 30/30、Composite 42/42、Legacy Node/HTTP 37/37、Legacy PG16生命周期13/13、Legacy审计1/1；161张父表、24条迁移，三物理OID `22746/16387/23026`跨OID Seal一致，`unauthorizedParentDrift=false`。15个变更路径在正式白名单内，没有发现越界修改。
- **A裁决**：PR #174暂不合并，Issue #171保持开放，`NEXT_OWNER=B`。正式退回报告：[F06 Issue171 PR174独立验收退回报告](07_重建工作区/F06_Issue171_PR174独立验收退回报告_2026-10-21.md)；已在PR/Issue讨论记录。
- **阻断一（业务）**：`engineering/src/f06-lock-lifecycle-service.mjs`目前仅拒绝Priority来源Lock的extend/expire，release/cancel仍可能变更状态。补齐release/cancel硬拒绝，并用真实PG16对extend/release/cancel/expire四种动作验证Lock状态、签名事件、审计均无变化。
- **阻断二（验收）**：PR #173裁决要求的签名来源负向边界测试缺失。补齐Issue164/Issue171精确profile互斥、错误Ref、非Push、HEAD/SHA不一致、无效Run ID、错误OID、源码摘要漂移、父迁移/Attestation不一致、权限撤销和伪造身份的实际负向测试，并纳入同SHA官方workflow/evidence gate。
- **继续方式**：原Issue、原分支、原任务不变；不新建平行任务、不强推、不合并main。保留当前成功测试和Artifact；两项整改完成后重新跑最终SHA官方CI并归档新工件，再交A复验。
- **状态边界**：现有成功测试只是部分验收证据；F06/F07/F08/V1继续`NOT_READY`，无生产、真钱、真实退款/成交或F07/F08开工授权。

---

# 2026-10-21｜A主控Issue171真实新分支Composite签名来源物理阻断成立，五文件精确补充裁决，B原任务继续

- **真实进度不虚报**：Issue [#171](https://github.com/suzhe868-arch/mb/issues/171)，B原分支`feat/f06-nonprod-composite-lock-lifecycle-01`当前阻断报告HEAD`13b9cc580b0907d743414707d353d4b96f1ca39b`，仅一份中文源代码级说明；本Issue `>=16` 真实PG16/HTTP新测试、正式本SHA工作流、封印、业务实现**尚未完成**。之前Issue164/PR169的42/42+32/32+6/6+Legacy1/1保留且不冒充本Issue结果。
- **A核验阻断超出B初报两文件**：旧`可信Composite签名根.mjs`固定Issue164分支，`composite-issuer.mjs`绑定真实SHA/RunID/源码hash/PG OID，私有`composite-issuer.sql`有旧Ref数据库CHECK，`核对同Ref上游签名PG16.sh`及`父表161迁移24跨OID封印.mjs`又独立硬绑旧Ref。真实Issue171新Push不可能在原白名单内合法签发与Seal；禁止伪造`GITHUB_REF`或迁移旧签名。
- **A补充单**：[《F06 Issue171真实分支Composite签名根五文件最小技术裁决》](07_重建工作区/F06_Issue171真实分支Composite签名根五文件最小技术裁决补充单_2026-10-21.md)。只允许上述**5个精确文件**对`feat/f06-nonprod-single-runtime-trusted-source-01`与`feat/f06-nonprod-composite-lock-lifecycle-01`两个真实Push分支做严格受控profile适配；源hash、真实HEAD SHA/Run、同物理非超管PG16、24签名迁移和161父表跨真实OID密封均不可弱化。SQL旧私有CHECK仅添加确切新branch；所有其他旧F06/SQL/公共DDL、旧CI、F02/F03/F05、PDM、C轨仍只读冻结。
- **本次A裁决并非B验收**：B保留原分支原Issue并安全同步本治理PR实际合入的main，按原Issue171完整施工单一次性完成Composite普通Lock生命周期接线/16+本SHA原生真PG16新场景及必要高风险Legacy回归与异OID封印，语法和范围双门禁；无法合法接通则如实报告阻断。**NEXT_OWNER=B**、`NEXT_TASK=F06_NONPROD_COMPOSITE_LOCK_LIFECYCLE_INTEGRATION_01`、`NEXT_ISSUE=171`、`NEXT_BRANCH=feat/f06-nonprod-composite-lock-lifecycle-01`。F06/F07/F08/V1仍`NOT_READY`，无生产/真钱/实际退款`refunded`或成交`completed`权限。

---

# 2026-10-21｜A完成Issue164后F06真实Runtime缺口核查，正式定向放行B Issue171非生产生命周期接线

- **A独立核查结论**：[《Issue164后F06真实Runtime与Issuer剩余差异》](07_重建工作区/F06_Issue164后真实Runtime与Issuer剩余差异_A主控定向核查_2026-10-21.md)。[已验业务PR169](https://github.com/suzhe868-arch/mb/pull/169)单PG16 Composite完成Lock→合成Deposit→Transaction→Handoff→Cancel→Refund无付款closed，Issue164已关闭；其已验42/42+32/32+6/6+Legacy审计1/1原生事实、161父表24迁移跨OID封印全部复用，不回头重做。
- **确认唯一新增可施工缺口**：`engineering/src/f06-nonprod-composite-runtime.mjs`新Composite单Runtime只装LockService/LockHandler及原有合成财务路由，**未挂载普通Lock Lifecycle**；旧`f06-lock-lifecycle-service.mjs`的环境校验、`f06_real_lock_test`、`DISPOSABLE_TEST_ONLY`员工Session/财务缺席proof固定旧`f06_lock_test/f06_lock_ci`单库，不能在新`f03_auth_test/f03_ci`中冒充可信Composite来源。旧Lifecycle逻辑和LockRequest 6小时/候补均已有，不重写状态机，只需可信同库来源接线与必要关联回归。
- **A正式单包放行**：[Issue #171](https://github.com/suzhe868-arch/mb/issues/171)；[《Issue171 Composite普通Lock生命周期可信接线A正式B施工单》](07_重建工作区/F06_Issue171_Composite普通Lock生命周期可信接线_A主控B正式施工单_2026-10-21.md)。B从**本治理PR实际合并后的最新main**建立`feat/f06-nonprod-composite-lock-lifecycle-01`，仅按精确路径＋用途白名单复用已有代码做非生产普通Lock延期/释放/取消/PG时钟到期、Priority/资金/source强拒、真实PG16/HTTP并发幂等/rollback，原有Legacy入口完全不变。提交前`git diff --check`与全部改动JS`node --check`，同新SHA官方真实不少于16项新场景及定向关联回归，整包`READY_FOR_A_REVIEW`后统一交A；不得擅合并。
- **正式唯一指针**：`NEXT_OWNER=B`、`NEXT_TASK=F06_NONPROD_COMPOSITE_LOCK_LIFECYCLE_INTEGRATION_01`、`NEXT_ISSUE=171`、`NEXT_BRANCH=feat/f06-nonprod-composite-lock-lifecycle-01`。仍非生产隔离/可销毁/非特权PG16，**严禁真钱、正式生产Issuer、refunded、completed、线上接口/生产权限**；F06/F07/F08/V1仍`NOT_READY`，F07/F08后续独立B阶段未凭本单自动开工，C PR68不动。不能在白名单内合法接线则统一报告`BLOCKED_F06_COMPOSITE_LIFECYCLE_SIGNED_SOURCE_GAP`，不得伪造父来源。

---

# 2026-10-21｜A主控F06 Issue164第二轮独立终验通过，业务PR169已合并；接A核查剩余真实Issuer

- **正式结论**：Issue [#164](https://github.com/suzhe868-arch/mb/issues/164) 已完成A第二轮独立增量验收并关闭；B末SHA `1feb1e4efa8120252950e3d2d5b808a76a5bdb2c`，同SHA官方[Run39560892258](https://github.com/suzhe868-arch/mb/actions/runs/39560892258)/Job119091597788 `completed/success`，非生产单PG16业务42/42、HTTP拒绝32/32、缺签拒绝6/6、独立Legacy审计1/1，0失败/跳过/取消；161张父表24迁移跨OID 22749→16387→22980完整Seal相同、无越权漂移，证据工件[12327089697](https://github.com/suzhe868-arch/mb/actions/runs/39560892258/artifacts/12327089697)有效至2026-11-04。
- **A整改两项闭环**：旧`CI_LEGACY`审计action `f06_real_test_*`经真PG独立回归证实保留；新Composite审计 `f06_composite_*`和不可变事件在真实PG16测试证实；四步来源矩阵由`IMPLEMENTING`订正为`CI_SIGNED_NONPRODUCTION`，六步契约强拒`PRODUCTION_READY`。7文件增量与Issue164/PR166精确路径＋用途授权一致，冻结旧SQL/DDL/旧CI/F02/F03/F05/PDM/C未修改。
- **GitHub实际合并**：[业务PR #169](https://github.com/suzhe868-arch/mb/pull/169)已标准merge，SHA `e569d5e1c541333b26975f217c14ad414c2a3763`；[A正式验收评论](https://github.com/suzhe868-arch/mb/pull/169#issuecomment-6310587050)；[完整中文独立终验报告](07_重建工作区/F06_Issue164单Runtime可信来源第二轮独立验收PR169合并与后续范围核查报告_2026-10-21.md)。本项仅`A_ACCEPTED_NONPRODUCTION_ISSUE164`，不代表真钱、生产Issuer、Transaction completed、Refund refunded、线上API或F06阶段完整完成。
- **当前唯一接力**：`NEXT_OWNER=A`、`NEXT_TASK=A_F06_POST_ISSUE164_REMAINING_RUNTIME_ISSUER_GAP_AUDIT_01`、`NEXT_ISSUE=null`；由A先定向核查F06剩余正式Runtime/可信Issuer与后续F07/F08依赖，已验历史工程直接复用，不自动签发新的B施工单。F06/F07/F08/V1均仍`NOT_READY`；F07/F08原独立B阶段未提前放行，F08正常A验收之后整个B后端的最终整体验收仍由A独立负责。C PR68不动。

---

# 2026-10-21｜B工程提交前语法与施工范围双门禁已写入（治理更新）

- **正式规则**：[B工程执行增量审查关联回归与避免重复施工正式规范](07_重建工作区/B工程执行增量审查关联回归与避免重复施工正式规范_2026-10-21.md)；[A/B/C三窗口协作与验收规范](07_重建工作区/A_B_C三窗口协作与验收规范.md)。
- **强制要求**：每批修改、每次提交前执行 `git diff --check`，对所有受影响的 `.js/.mjs/.cjs` 执行 `node --check`；检查失败先本地修复再推送。提交与交A前都要逐文件、逐关键差异核对“路径授权＋用途授权”，测试/CI通过不能豁免越界。详见B正式规范第七、八节。
- **Issue #164专项**：按原施工单与已合并 PR #166 的技术裁决共同判断授权。PR #166 仅对补充裁决列明的文件和用途有限放行；不是允许任意修改旧F06服务。当前B分支如存在越界差异，必须先整改，不能直接交A验收。
- **接力不变**：`NEXT_OWNER=B`、`NEXT_TASK=F06_NONPROD_SINGLE_RUNTIME_TRUSTED_SOURCE_INTEGRATION_01`、`NEXT_ISSUE=164`、`feat/f06-nonprod-single-runtime-trusted-source-01`。本次只改治理文档和状态记录，不改业务代码、CI工作流、B分支或Issue任务授权，不新建任务。
- **当前仍未完成**：F06真实非生产业务正向闭环和最终SHA官方CI仍须按原施工单完成；F06/F07/F08/V1仍为 `NOT_READY`。

---

# 2026-10-21｜A正式裁决Issue164：单PG16真实CompositeIssuer、旧源双入口不越权，B原分支继续

- **已实证B阻断成立**：[Issue164](https://github.com/suzhe868-arch/mb/issues/164) B分支 `feat/f06-nonprod-single-runtime-trusted-source-01@7058779956438009fbc49a8f100ddcf5f7e17192`，[同SHA官方Run39514294355](https://github.com/suzhe868-arch/mb/actions/runs/39514294355)/Job118942621386仅**HTTP32/32安全拒绝 + 真实非超管PG16 6/6缺签拒绝**，整条Lock→Deposit→Transaction→Handoff→Cancel→Refund实际正例 `NOT_RUN`，不能标交A验收。PR139旧3A分支与PR153/156/162旧3C1分支硬门禁在一个真实GitHub Push不可同时成立；Lock`f06_lock_test`与交易`f03_auth_test`非同物理数据库，旧裸F03数据库1迁移校验也不兼容现24迁移签名F06库。A原工作单白名单无法合法解决，严禁伪`GITHUB_REF`/旧源或拷贝签名余额。
- **本轮A裁决**：[《Issue164单PG16可信CompositeIssuer与冻结服务双入口技术裁决补充单》](07_重建工作区/F06_Issue164单PG16可信CompositeIssuer与冻结服务双入口_A主控技术裁决补充单_2026-10-21.md)，已置顶更新[原正式施工单](07_重建工作区/F06单应用隔离Runtime可信源接线与业务闭环_A主控B正式施工单_2026-10-21.md)。选**独立`COMPOSITE_NONPROD_SIGNED_V1`新来源模式**，以真实当前GH Push、单物理非特权PG16 `f03_auth_test`及不可变父签名、真正F03员工Session与权限为信任根；旧`CI_LEGACY`模式原始历史分支/签名/库门禁完全保留且对新来源`FailClosed`。在补充单列明的精确旧服务/Lock/迁移入口文件白名单内，只准抽取**同一个已验资金/事务核心**和受控双入口，不准改旧SQL/公共DDL/旧工作流/F03/F05/F02身份权限/PDM、真资金或生产路径。无法在白名单内合法穿透下游时准确报`BLOCKED_COMPOSITE_PARENT_AUTHORITY_DEPENDENCY`。
- **接力未变**：`NEXT_OWNER=B`，`NEXT_TASK=F06_NONPROD_SINGLE_RUNTIME_TRUSTED_SOURCE_INTEGRATION_01`，`NEXT_ISSUE=164`；B保留原7个提交/38项安全测试，安全同步裁决治理PR合并后的最新main，一次性完成真实≥20新集成正例/安全拒绝、受影响旧父高风险回归、161表24迁移跨OID Seal、同SHA官方CI后整体`READY_FOR_A_REVIEW`才回A。F06/F07/F08/V1仍`NOT_READY`，F07/F08独立阶段未放行，F08之后后端整体验收归A，C PR68不动。

---

# 2026-10-21｜A完成F06正式Runtime接线差异核查，按现有阶段一次性放行B关联集成Issue164

- **正式A核查结论**：[《F06已验收功能与真实Runtime接线差异》](07_重建工作区/F06已验收功能与真实Runtime接线差异_A主控独立核查_2026-10-21.md)。已验PR139/146/150/153/156/162及Lock受控Runtime全部复用，不重写业务、不过度重复旧CI。当前`engineering/src/server.mjs`的F06实际仅挂受控Loopback/隔离PG16 Lock Handler，其他已验财务/交易侧车带有严格GitHub父Branch与合成来源门禁，**未形成同一可信应用Runtime综合接线**；Completed、真实Refund付款/生产Issuer依然`SOURCE_GAP`且未获生产授权。
- **本轮A正式放行B一个关联任务**：[Issue #164](https://github.com/suzhe868-arch/mb/issues/164) `F06_NONPROD_SINGLE_RUNTIME_TRUSTED_SOURCE_INTEGRATION_01`；[《F06单应用隔离Runtime可信源接线与业务闭环正式施工单》](07_重建工作区/F06单应用隔离Runtime可信源接线与业务闭环_A主控B正式施工单_2026-10-21.md)。B从**实际开工最新main**建立`feat/f06-nonprod-single-runtime-trusted-source-01`；只在新CI集成目录/单工作流/受控测试Runtime少数精确白名单内以合法真实签名接线，禁止伪造父Branch、降低旧业务门禁、复制状态机或开放真钱。若签名父来源无法合法用，一次性汇总`BLOCKED_TRUSTED_F06_ISSUER_RUNTIME_GAP`交A，不报告伪成功。
- **当前接力`NEXT_OWNER=B`、`NEXT_TASK=F06_NONPROD_SINGLE_RUNTIME_TRUSTED_SOURCE_INTEGRATION_01`、`NEXT_ISSUE=164`**；仅当本A治理PR合入main正式生效。B整单连续做增量自审、必要高风险回归、真实同SHA官方CI及证据，达到`READY_FOR_A_REVIEW`再交A。F06/F07/F08/V1仍`NOT_READY`，F07/F08独立阶段不启动，F08阶段正常A验收后后端最终整体验收归A；C PR68、生产/真钱/外部资源不变。

---

# 2026-10-21｜A主控F06 Issue159可信移交取消到退款接续终验通过，标准合并PR162；进入A后续真实集成缺口核对

- **本轮已真正通过A独立验收**：[Issue #159](https://github.com/suzhe868-arch/mb/issues/159) B末SHA `bec6b39f4c5ffd44f048ff24bd932a793a70c71d`；[官方Run39506844523](https://github.com/suzhe868-arch/mb/actions/runs/39506844523)/Job118917784231同SHA`completed/success`。A独立源码逐函数比对原PR150 Permission/Deposit/3A历史/Refund余额核心不变，旧PR146 Refund入口对新PR153/156签名保持`FailClosed`、新桥与旧路径共用受控事务核心；变更12文件均在A Issue159及PR161已签白名单，冻结父签/DDL/旧Workflow字节未改。**新旧联合非特权PG16/HTTP 130/130（旧PR156影响84+桥46）**、原TLS11/11+新TLS12/12、旧PR150 PG16 79/79及Handoff40/40相关回归、父161表24迁移不同物理OID 97332→107142全Seal一致。旧Shell辅助TLS打印`0/0`不是通过证据，已由同SHA独立强制原生TAP校验规避，列技术债、不冒充成功。
- **业务PR已标准合并**：[PR #162](https://github.com/suzhe868-arch/mb/pull/162)，merge SHA `7b671cbd63461de6490167357666b05bdcce93e2`；[完整中文A独立验收与边界报告](07_重建工作区/F06_Issue159签名移交后取消至退款接续_A主控独立验收PR162合并报告_2026-10-21.md)。本次仅`A_ACCEPTED_NONPRODUCTION_ISSUE159`，不代表真实钱款退款`refunded`、线上应用服务/API可用、Transaction`completed`或整个F06完成。
- **下一接力`NEXT_OWNER=A`**，`NEXT_TASK=A_F06_REMAINING_REAL_RUNTIME_INTEGRATION_SCOPE_AUDIT_01`：按原F06路线只核对现有真实主服务接线、签名/Issuer及剩余未实现模块，复用已验成果后再按依赖决定下一B正式施工单；不自动下发未经界定的新B任务。F07/F08保持原独立B工程阶段，F08正常A验收后后端最终整体验收归A；F06/F07/F08/V1仍`NOT_READY`，生产/真钱/真实外部凭据/第三方权限和C PR68未放行。

---

# 2026-10-21｜A主控 Issue159 正式技术裁决：允许PR150唯一受控资金核心复用，B原分支继续施工

- **源代码实证裁决**：[Issue #159](https://github.com/suzhe868-arch/mb/issues/159) B `feat/f06-signed-post-handoff-refund-bridge-01@2f703e38d150b249db262ecdba6fc96e4226c90c` 已上报 `BLOCKED_SIGNED_POST_HANDOFF_REFUND_BRIDGE_SOURCE`。其[官方Run39501146534](https://github.com/suzhe868-arch/mb/actions/runs/39501146534)只有**静态检查 success**，真实退款pending/closed、非超管PG16>=35、HTTP/TLS>=10、旧父161表24迁移Seal/并发注错**全部未运行**，绝非`READY_FOR_A_REVIEW`。PR150 原 `verifyTransactionSource()` 硬绑旧PR146取消签名和初始responsible；其私有资金原语无法供新PR153→PR156来源调用，B报告的原授权白名单互斥阻断成立。
- **唯一通过的A技术方案**：[《F06 Issue159 PR150资金原语复用与来源版本接续技术裁决补充单》](07_重建工作区/F06_Issue159_PR150资金原语复用与来源版本接续_A主控技术裁决补充单_2026-10-21.md)。受控新增精确写权仅 `engineering/f06/transaction-refund-http-pg16/service.mjs` 及可选新增 `engineering/f06/transaction-refund-http-pg16/shared-refund-core.mjs`，为真实新旧签名来源共享**同一**资金/历史余额/原子退款核心；旧PR150接口遇新来源继续FailClosed。B现有新增桥接目录与专属workflow可相应升级白名单及真实CI。其余PR139/146/153/156、PR150旧sidecar.sql、公共DDL/迁移/旧Workflow及生产权限继续冻结，禁止伪造旧Cancel或复制第二套资金算法。
- **接力未改**：`NEXT_OWNER=B`；`NEXT_TASK=F06_SIGNED_POST_HANDOFF_CANCEL_TO_TRANSACTION_REFUND_BRIDGE_01`，`NEXT_ISSUE=159`；B在原分支安全同步A治理PR合并后的最新main，保留既有5个提交、补同SHA真实PG16/HTTP/权限/资金/历史父Seal验证后统一交A。**仅当本轮A裁决PR标准合入main后正式生效**。F06/F07/F08/V1仍`NOT_READY`，F07/F08独立阶段、F08后端整体验收归A，C PR68不动，生产真钱外部服务不授权。

---

# 2026-10-21｜A主控正式放行F06移交后取消到Transaction退款可信来源接续Issue159（按B增量自审规范；无重复施工）

- **本轮A完成的任务**：在最新 `main@be748b2b8165be4d644527bcccb4582e5c08c752` 下复核 PR #150 的原签名 Refund 与 PR #153 Handoff、PR #156 新签名 Cancel 的真实代码：原 PR150 验证强制最初 responsible 恒等于现 responsible 且只认可 PR146 旧 Cancel origin；对PR153→PR156新来源合法 `FailClosed`。**不复制旧Transaction/Cancel/Refund状态机，不对F01～F05全阶段返工。**
- **已签 B 正式施工单**：[《F06已签移交后取消到Transaction退款可信来源接续》](07_重建工作区/F06已签移交后取消到Transaction退款可信来源接续_A主控B正式施工单_2026-10-21.md)，[Issue #159](https://github.com/suzhe868-arch/mb/issues/159)，任务ID `F06_SIGNED_POST_HANDOFF_CANCEL_TO_TRANSACTION_REFUND_BRIDGE_01`。仅允许B从开工时最新main新建 `feat/f06-signed-post-handoff-refund-bridge-01`，在本单白名单完成真实合法 PR139 Tx→PR153 Handoff→PR156 Cancel→Transaction侧合成Refund pending/无付款closed的最小可信来源适配、真实PG16/HTTP正反/并发/回滚以及本单必要父签名安全关联回归；沿用已验 PR150 全部有效资金与历史语义。B一次完成整单自审、CI与中文证据，再 `READY_FOR_A_REVIEW` 交A；不自行建PR/merge。
- **接力指针**：`NEXT_OWNER=B`；`NEXT_TASK=F06_SIGNED_POST_HANDOFF_CANCEL_TO_TRANSACTION_REFUND_BRIDGE_01`；`NEXT_ISSUE=159`。只有本A治理PR实际合入main后才能视为正式生效。继续遵守已落库B增量审查关联回归规范，不机械重跑全部历史CI；资金/权限/签名/事务/161父表/24迁移与Seal等必须按本单保留。F07、F08各自仍是B独立工程阶段，F08经A正常验收后后端整体验收归A。F06/F07/F08/V1仍 `NOT_READY`；真钱/生产/外部服务/C PR68未授权、未施工。

---

# 2026-10-21｜A主控：用户批准 B 执行优化规范并正式写入（原 F06/F07/F08 施工路线不变）

- **本次为 B 流程治理落库，不是新 B 施工放行。** 已按用户明确“正式写入”要求，制定[《B工程执行增量审查关联回归与避免重复施工正式规范》](07_重建工作区/B工程执行增量审查关联回归与避免重复施工正式规范_2026-10-21.md)，并同步 A/B/C 协作规范、原 B 工程路线图。既有 F01～F05 A 验收继续有效；F06/F07/F08 仍各自为 B 独立施工阶段，F08 完成经 A 常规验收后，B 后端最终**整体**验收/评估/后续调整由 A 单独负责。
- **B 方法调整**：先核已验实物避免重复建设；区分已验收、隔离 CI/Mock、已证实缺陷和独立授权缺口；B 只对本轮代码和真实受影响调用链增量自审，执行必要关联回归与原施工单强制高风险门禁；关联子任务在已授权范围内连续闭环、集中 `READY_FOR_A_REVIEW` 交 A；旧工作流冗余优化须另行授权，不删除安全断言或伪造同 SHA 成功。
- **当前接力**：`NEXT_OWNER=A`；`NEXT_TASK=A_PREPARE_NEXT_B_TASK_BY_EXISTING_PROCESS`。仅落实用户已批准的 B 工作方式，不重拆 F06～F08 阶段、不修改现有业务代码/CI/PDM、不自动创建下一 B Issue/施工单/分支或放行。F06/F07/F08/V1 仍 `NOT_READY`，生产/资金/外部真实服务权限不变；C PR68 不动。此前“待重规划讨论”条目作为历史记录保留。

---

# 2026-10-21｜A主控F06已签Handoff后Transaction正常取消680/680终验并合并PR156；按用户要求暂停下个施工单，先讨论F06/F07/F08整体重新规划

- **本轮最终验收**：[Issue #154](https://github.com/suzhe868-arch/mb/issues/154)已关闭；B受验末HEAD `0b0aba78ac90e8081035aa41708dc160a53ea448`，[同SHA官方Run39482165477](https://github.com/suzhe868-arch/mb/actions/runs/39482165477)/Job118833222205父585+新真实非超管PG16 HTTP84+TLS11=**680/680**（0失败/跳过/取消）。A独立源码核查：真正PR139 Tx+PR153签名Handoff后的当前负责人使用独立Permission/Scope取消`in_progress→cancelled`，新不可变Sidecar Event/Key/Audit同PG16原子事务、真实两Employee PID2235/2236、Handoff和Cancel真正不同后台PID2249/2250竞争安全拒绝、三处故障注错rollback、旧PR150 Refund新来源继续FailClosed；161张父签表逐表COUNT+MD5、24迁移跨物理OID97322→107137/独立审计OID39338及完整Seal不变。业务[PR156](https://github.com/suzhe868-arch/mb/pull/156)已实际标准merge `a9b8de83e21f72426009e4a4c1947b9ecedba1e9`；[A中文独立验收报告](07_重建工作区/F06已签Handoff后Transaction取消_A主控独立终验PR156合并与三域重规划暂缓放行报告_2026-10-21.md)。
- **本次不得自动签发新B或C任务包**。按用户明确要求，下一步`NEXT_OWNER=A`（与用户讨论、整理整体方案）、`NEXT_TASK=F06_F07_F08_INTEGRATION_REPLAN_DISCUSSION_01`，先核对原F06/F07/F08已验成果与重复施工、CI-only和HTTP/PG16差异、跨来源版本兼容、业务闭环分包、B一个ChatGPT聊天窗口内串行完成整包并集中交A验收，明确C前端独立职责。重新规划/正式放行必须待讨论确认；历史PDM及源码不因本报告发生权限提升。禁止生产/真钱/completed/外部真实Issue，F06/F07/F08/V1仍`NOT_READY`，C PR68仍Draft。

---

# 2026-10-21｜A独立验收通过 F06真实Transaction负责人正式Handoff 585/585，PR153已合并；下一任务B执行已签Handoff后的Transaction取消

- **最终A裁定**：`F06_REAL_TRANSACTION_RESPONSIBLE_HANDOFF_HTTP_PG16_01`，[Issue151](https://github.com/suzhe868-arch/mb/issues/151)已关闭；B受验HEAD `4d499810cd9a97bd483ffb257b5d03b01f6bb062`、[官方同SHA Run39458177954](https://github.com/suzhe868-arch/mb/actions/runs/39458177954)/Job118750396752：父534+新真实PG16 Handoff40+TLS11 = **585/585**（0失败、0跳过、0取消），旧签161张表、24条迁移、真实物理OID87819→97329及审计OID39339，完整Seal相等 `9833de68dfd2ab9cc1f6c65995359589d29247a7dcb6ca980eaaa94b7962d5c0`。A独立检查PR139初始负责人签名、PR153新Version事件/Key/Audit与Public责任人同事务、权限和有效Scope、两不同Manager Session PG PID2055/2054并发最多一个成功、Rollback/幂等及旧PR146/150不兼容后的FailClosed。标准[业务PR153](https://github.com/suzhe868-arch/mb/pull/153)实际已merge `70c9372a55865d59c5a3772b368d236775154038`。
- **下一责任B已获完整新施工授权**：`F06_REAL_POST_HANDOFF_TRANSACTION_CANCEL_HTTP_PG16_01`、[Issue154](https://github.com/suzhe868-arch/mb/issues/154)，B从执行时最新main新建 `feat/f06-real-post-handoff-cancel-http-pg16-01`，先读[正式施工单](07_重建工作区/F06真实负责人移交后Transaction正常取消HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-21.md)及[本轮A独立报告](07_重建工作区/F06真实Transaction负责人移交_A主控独立验收PR153合并与移交后取消正式放行报告_2026-10-21.md)。仅非生产合成PR139 Tx已合法签名PR153 Handoff后，由当前链尾Transaction responsible本人有独立permission/scope取消`in_progress→cancelled`，必须建立单独版本化签名Cancel侧车，不能伪造/改写冻结PR146旧Cancel或3B/4B及旧父。旧PR150 Refund对于本批新Cancel来源仍须FailClosed，不能宣称钱款退款链已联通。
- **新包强制门禁**：B仅新增`engineering/f06/post-handoff-cancel-http-pg16/**`及唯一`.github/workflows/f06-real-post-handoff-cancel-pg16-onejob.yml`，同末SHA官方单Job全量继承父**585**+新增真HTTP/PG16>=35 + TLS拒绝>=10共**>=630**全部通过，并保留161父表24迁移不同OID完整Seal与非超管PG16真实原子/权限/失败Rollback证据。B不自行PR/merge，达`READY_FOR_A_REVIEW`再交A。生产/真钱、完成成交、UAT/上线依然禁止，新增费用$0，F06/F07/F08/V1`NOT_READY`，C PR68仍独立Draft。

---

# 2026-10-20｜A主控最新：F06 Transaction侧Refund R1终验通过534/534并合并PR150；B接真实合成Transaction负责人Handoff

- **A最终独立验收通过**：`F06_REAL_TRANSACTION_REFUND_PENDING_CLOSED_HTTP_PG16_01`，[Issue #147](https://github.com/suzhe868-arch/mb/issues/147)已关闭；B受验最终HEAD `f774bc49407b7e2b8918347c03989b1b7230770d`，同SHA[官方Run #39436527215](https://github.com/suzhe868-arch/mb/actions/runs/39436527215) / Job118674868785父445+新真实PG16/HTTP79+TLS10 = **534/534**、0失败/跳过/取消；原161张冻结父表逐表COUNT/MD5、24迁移、不同OID78558→87832/独立审计OID39349全行Seal一致。上轮A发现的合法pending后3A原生正负Correction/Reversal导致closed误拒R1已经用不可变资金历史快照、原生3A签名事件增量时序及14条真实PG16新增用例整改，未知签或真实付款继续FailClosed。标准[PR #150](https://github.com/suzhe868-arch/mb/pull/150)已merge `cc2542a18ed8498ba549ff0f4cefd5e8beeedd8d`。
- **唯一新B任务已正式放行**：`F06_REAL_TRANSACTION_RESPONSIBLE_HANDOFF_HTTP_PG16_01`、[Issue #151](https://github.com/suzhe868-arch/mb/issues/151)，负责人`NEXT_OWNER=B`。B从**执行时最新main**新建 `feat/f06-real-transaction-handoff-http-pg16-01`，正式[中文施工单](07_重建工作区/F06真实Transaction负责人移交HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md)及[本轮A独立报告](07_重建工作区/F06真实Transaction侧Refund_A第二轮独立验收PR150合并与负责人移交放行报告_2026-10-20.md)。仅合成PR139真签`in_progress` Transaction正式负责人员handoff，保留原始签名、old/new/actor/time/reason、当前角色/独立permission+scope，新的版本化受限CI侧车；不能伪造旧4B来源或让不兼容旧Cancel/Refund接口假通过。
- **验收与安全门禁**：只新增`engineering/f06/transaction-handoff-http-pg16/**`及`.github/workflows/f06-real-transaction-handoff-pg16-onejob.yml`；最终B HEAD同SHA唯一官方Push单Job重跑父534+新PG16至少30+TLS10，总**>=574**全绿、161原父表/24迁移及跨OID全Seal一致。不得扩Product Final/权限、旧父签名、公DDL、真钱/生产Issuer、真实客户或完成成交；预算新增$0。B不得创建PR/合并，中文`READY_FOR_A_REVIEW`后交A。
- **总体边界**：旧3B直接入口/旧4B与真实PR139签源兼容问题未因PR150而修复；同Employee Session预先串行化不等于双方同时获取Vehicle锁。F06/F07/F08/V1持续`NOT_READY`，C PR68保持独立Draft不自动合并。

---

# 2026-10-20｜A主控首轮独立验收：F06 Transaction侧Refund同SHA520/520成功，但合法pending后签名资金修正会阻断无付款关闭，退B定向整改

- **任务与结论**：`F06_REAL_TRANSACTION_REFUND_PENDING_CLOSED_HTTP_PG16_01`，[Issue #147](https://github.com/suzhe868-arch/mb/issues/147)，B分支 `feat/f06-real-transaction-refund-http-pg16-01`，受验末HEAD `38135893fe7d0a4d3595bf4f70f592f1e9f1ba17`；[官方Run #39431126990](https://github.com/suzhe868-arch/mb/actions/runs/39431126990)/Job #118656156513同SHA、父445+新HTTP/PG16 65+TLS10=**520/520**真PG16全部通过；父161张逐表COUNT/MD5、24迁移、独立OID恢复与完整Seal一致、11文件均合法白名单。**但A独立源审未通过：`A_REVIEW_NOT_ACCEPTED / B_TARGETED_POST_PENDING_SIGNED_CORRECTION_REMEDIATION_REQUIRED / NO_BUSINESS_PR / NO_MERGE / NEXT_OWNER=B`。**
- **关键R1业务缺陷**：冻结原生3A `correctSyntheticDepositCI()` 经合法经理/店长 `deposit.ci.correct` 授权，允许已`released`原Lock追加真实签名Correction/Reversal；而新`refundCaseSource()`把Refund创建时历史`origin.source_deposit_digest`与**当前**全3A调整重算`src.depositDigest`强制一致。合法Transaction-side `pending`后新增原生已签Correction，即使零付款，`closeTransactionRefundCI()`也会误报`F06_TX_REFUND_CASE_SOURCE_DRIFT`并可能永久卡住无付款关闭、幂等及后续新申请。现有65个新用例缺“先pending、后原生签名Correction/Reversal、再closed”。
- **B完整定向整改单**：[A独立验收与后续合法签名Correction关闭阻断整改单](07_重建工作区/F06真实Transaction侧Refund_A主控首轮独立验收_合法pending后签名资金修正关闭阻断整改单_2026-10-20.md)，Issue [#147 A正式评论](https://github.com/suzhe868-arch/mb/issues/147#issuecomment-6292435088)。B只在原分支原11文件白名单内修复“申请时历史签名资金快照”与“其后合法已签追加修正”的版本验证，追加真实PG16正负Correction、完整Reversal至零、无付款closed、现时净余额再申请、原签不可变/幂等/伪签与付款FailClosed负例。原父445+原新65+TLS10不删弱，新最终SHA一个官方Run全部0失败/跳过/取消并完整161表Seal/OID复验后`READY_FOR_A_REVIEW`交A；B不自建PR/合并。
- **安全与整体状态**：旧3A/3B/3C1、PR139/PR146签名父与公共DDL禁止修改，不能直接删摘要校验或造假旧签；如无法合法实现报告`BLOCKED_SIGNED_TX_REFUND_POST_PENDING_CORRECTION_SOURCE`交A。不开放真退款、支付、`refunded`、完成交易`completed`或生产、UAT；F06/F07/F08/V1仍`NOT_READY`，预算新增$0，C PR68独立Draft。**最新main仍未合入本B业务分支。**

---

# 2026-10-20｜A主控现行：F06 Transaction Cancel PR146独立验收445/445完成；B接Transaction侧Refund pending/closed HTTP/PG16（仅非生产）

- **A独立验收、标准合并完成：** `F06_REAL_TRANSACTION_CANCEL_HTTP_PG16_01`，B受验HEAD `fa327ccece5efc1fe18d91558b1f7ff7d8a7299c`；官方Run `39415825663` / Job `118604456336` 单Push同SHA父392+Cancel43+TLS10=**445/445**全部真PG16成功、0失败/跳过/取消。原签四Schema161张逐表COUNT/MD5、24迁移、不同OID恢复及全Seal一致。旧冻结4A不认PR139新签名的真实拒绝已证，隔离新受限Cancel以同一PG事务维护cancelled/原件/Event/Key/Audit；无假3B签名或生产许可。标准[PR #146](https://github.com/suzhe868-arch/mb/pull/146) merge `6bba1f42ec1f9d11851a181b8ab28bbb44fcc900`；Issue #144已关闭。
- **唯一下一授权施工包：** `F06_REAL_TRANSACTION_REFUND_PENDING_CLOSED_HTTP_PG16_01`，`NEXT_OWNER=B`，[Issue #147](https://github.com/suzhe868-arch/mb/issues/147)，指定新分支 `feat/f06-real-transaction-refund-http-pg16-01`，B从实际执行时**最新main**开始。A完整[正式施工单](07_重建工作区/F06真实Transaction侧Refund待处理与无付款关闭HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md)、[本批A验收与下一任务放行报告](07_重建工作区/F06真实Transaction正常取消_A主控独立验收PR146合并与下一任务放行报告_2026-10-20.md)均已归档。只允许真正PR139+PR146签名的**已cancelled**合成Transaction，发起自身唯一Transaction-side pending Refund、无真钱closed；不能把原Lock侧Refund换绑、fake payment、跨车移金。B不得创建PR或合并main。
- **签名资金前置：** 原3A/3B/3C1、PR139、PR146真实来源及Deposit/Correction/退款余额、现时员工权限+scope必须同PG16事务锁序内验证，无法在新白名单合法签发即`BLOCKED_SIGNED_TRANSACTION_REFUND_SOURCE`报告A，禁止伪造旧3B/4A或改历史父。新增白名单仅 `engineering/f06/transaction-refund-http-pg16/**` 与 `.github/workflows/f06-real-transaction-refund-pg16-onejob.yml`；要求新最终SHA父445+至少40真实PG16/HTTP+10 TLS=**>=495**全部通过、原161表/24迁移与跨OID Seal一致，中文B交接 `READY_FOR_A_REVIEW`。
- **持续限制：** 旧F06-3B直接入口仍不可信；同Employee Session可能先锁串行化，不能冒充已验证双方同时持有Vehicle锁。真实`completed`、`refunded`、收付款/生产Issuer/线上路由、客户资料、UAT/部署均未授权。F06/F07/F08/V1仍**NOT_READY**；新增预算$0。C PR68独立Draft，不因B业务通过自动合并。

---

# 2026-10-20｜A主控现行：F06 Refund PR143独立验收392/392完成；B接Transaction Cancel签名来源兼容与HTTP/PG16

- **A终验通过并合并**：F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01，B受验HEAD `71af0d0d6c98062bc93dc391db8b3bb685ed82d2`，官方Run `39407777531`/Job `118577807940` 为准，旧319+Refund63+TLS10=**392/392**真PG16同SHA全部通过。父F06-3B/3C1验签、161张逐表COUNT/MD5与24迁移跨OID恢复、原SQL关闭注错回滚、车辆供应异常/周期结束后仍可无付款closed、同Key幂等均由A审查。标准业务[PR #143](https://github.com/suzhe868-arch/mb/pull/143)已合并，真实main merge `a1b2791e37a6f3ce82082882d74dcc7244df912f`；Issue #140完成。
- **下一唯一授权任务**：`F06_REAL_TRANSACTION_CANCEL_HTTP_PG16_01`，负责人**B**，正式[Issue #144](https://github.com/suzhe868-arch/mb/issues/144)，从开工时最新main新建 `feat/f06-real-transaction-cancel-http-pg16-01`。完整A施工单：`07_重建工作区/F06真实Transaction正常取消HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md`。
- **关键前置与安全阻断门禁**：冻结旧F06-4A/4C合成Cancel依赖 `f06_3b_ci.transaction_origins`，而已验PR139真实合成HTTP/PG16 Transaction使用 `f06_real_tx_ci.origins`，**不能伪造旧3B签名**。B需先核对真PG16/源签兼容性；若本白名单无法合法在同一事务签发新的Cancel，报 `BLOCKED_SIGNED_REAL_TRANSACTION_CANCEL_SOURCE`交A，不得扩大生产DDL/资金或修改旧父。目标仅合成 `in_progress→cancelled`，不能复活旧Lock/Waitlist/Priority、假重新上架，不能将取消冒充实际退款。
- **A业务边界**：旧F06-3B直接不安全入口仍有历史缺口；同Employee Session可能预先互斥，不能冒称真实两方同时持有Vehicle行锁。Transaction/Refund生产Issuer、真实支付/退款、成交完成、真实Customer资料及UAT部署完全未授权，F06/F07/F08/V1整体**NOT_READY**，新增预算$0。B完成真PG16同最终SHA父392+新增Cancel32+TLS9>=433、父Seal一致、中文交接后 `READY_FOR_A_REVIEW`交A，不建PR/合并main。

---

# A主控最新正式独立验收裁决｜2026-10-20：F06 Refund同SHA385/385通过但closed生命周期需要B定向整改

- 任务 F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01；Issue #140；下一责任B，仍用原分支 feat/f06-real-refund-pending-closed-http-pg16-01。
- 真实B HEAD e660879fbaec21fbb8b1168c9be408a6d59deab0；官方Push Run39400797756 / Job118554708402 completed/success、父319+新HTTP56+TLS10=385/385，0失败/跳过/取消；父161张已签表、24迁移及独立不同OID完整Seal通过。
- A发现新worker.mjs对已合法pending的无付款closed错误复用新申请状态Guard（Lock仍active/未过期、Vehicle仍可售、Cycle继续开放），可能使待退款关闭卡死；本HTTP closed路径的AFTER_CLOSE_THROW及AFTER_EVENT_THROW实际回滚验证缺席。由B仅在白名单新目录内修复守卫与补真PG16测试，不准修改旧F06父/公共DDL，不准生产真实资金或扩大权限。
- 正式结论 A_REVIEW_NOT_ACCEPTED / B_TARGETED_CLOSE_LIFECYCLE_REMEDIATION_REQUIRED / NO_BUSINESS_PR / NO_MERGE；中文整改单 07_重建工作区/F06真实Refund_HTTP_PG16_A主控首轮独立验收_已pending关闭生命周期定向整改单_2026-10-20.md；Issue #140评论6288407435。保留385项成功证据、原生父签数据，不重做旧F05/190父表争议。V1整体NOT_READY，新预算$0。

---

# 2026-10-20｜A主控正式现行状态：PR139真实Lock→Transaction通过独立验收；B接F06合成Refund pending/closed HTTP/PG16

- **F06 Transaction 本批A已验收合并：** B受验HEAD `20bb5333b3fb2b64fe9fde8f1e8ac6ba65ff182b`，官方[Run #39395616127](https://github.com/suzhe868-arch/mb/actions/runs/39395616127)/Job #118537844979 `completed/success`，父257+新Transaction53+TLS9=**319/319**，全0失败/跳过/取消；真实F06-3B/3C1原生签名来源、旧Lock签名pending Refund防转换、Refund↔Transaction不同PG后端受控竞争、闭合Refund验签与缺源FailClosed已复验；父161全表COUNT/MD5、24迁移与不同OID恢复完整Seal一致。A标准业务[PR #139](https://github.com/suzhe868-arch/mb/pull/139)合并，merge `7ebd75337d2bbf1bd37bd697fc58cb0c19888774`。原[Issue #136](https://github.com/suzhe868-arch/mb/issues/136)本批完成。
- **并发证据准确边界：** Refund与Transaction两个独立PG16 backend同时调度并最多一个有效提交，但`IsolatedAuth.withSession`可能先在同一负责员工的Session行串行化；**不宣称两个事务同时持有Vehicle行锁**。生产/跨主体授权前需单独加做更强车辆锁等待竞态探针，旧F06-3B直接入口`UPSTREAM_F06_3B_LOCK_PENDING_TRANSACTION_CONVERSION_GAP`仍不可信。
- **下一唯一施工包：** `F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01`，`NEXT_OWNER=B`、[Issue #140](https://github.com/suzhe868-arch/mb/issues/140)，从开工时最新main新建`feat/f06-real-refund-pending-closed-http-pg16-01`；[A正式B施工单](07_重建工作区/F06真实Refund申请pending与无付款关闭closed_HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md)；[PR139 A独立验收与后续放行报告](07_重建工作区/F06真实Lock到Transaction_A主控二轮独立验收PR139合并与Refund下一任务放行报告_2026-10-20.md)。
- **当前授权仅合成Lock侧Refund pending申请与无付款closed关闭，真实loopback HTTP+非超管PG16；** 禁止真实退款/付款、refunded、生产Transaction/Refund Issuer、交易完成/正式Source/线上DDL/UAT部署。当前F06/F07/F08与V1整体依然`NOT_READY`，C PR68继续Draft无用户视觉通过，新增付费预算$0。B不得自建PR或合并，按单一次施工到`READY_FOR_A_REVIEW`后交A。

---

> 以下为历史状态与已完成工作归档。A以本段及现行Project State为当前正式任务依据。

# 2026-10-20｜A主控首轮独立复验：F06 Transaction同SHA309/309全绿，但签名Refund来源与双后端竞态待整改

- **唯一当前任务：** `F06_REAL_LOCK_TO_TRANSACTION_HTTP_PG16_01`，`NEXT_OWNER=B`，保持原B分支 `feat/f06-real-lock-transaction-http-pg16-01` 和 [Issue #136](https://github.com/suzhe868-arch/mb/issues/136)，B不要创建PR/合并main。
- **已核真实官方成功证据：** B HEAD `c4dbb48a5e602076298fba47d133fd43cec504f3`，最终 [Run #39391407455](https://github.com/suzhe868-arch/mb/actions/runs/39391407455)/Job #118523549413同SHA `completed/success`，父257+新43+TLS9=**309/309**，0失败/跳过/取消；父161表Manifest/24迁移/不同物理OID恢复全Seal真实通过，Workflow触发预检340项，Push1/PR0；9个文件全部落白名单。
- **A独立代码审查未通过：** 新脚本未建立或验签F06-3C1合法退款来源，`service.mjs`的退款无行时可在`f06_3c1_ci`缺席下放行；测试#33只是手工插入无原生签名的public pending，不等于合法Refund。测试#22仅Transaction↔Transaction竞争，缺签名Refund先/Transaction先/双PG后端同时争用三组强制正反用例。本批不准因CI全绿直接merge。
- **正式定向整改单：** [F06 Transaction首轮A独立复验及Refund签名源/双Backend竞态整改](07_重建工作区/F06真实Lock转Transaction_A主控首轮独立复验_退款签名来源与双后端竞态定向整改单_2026-10-20.md)；Issue [#136 A正式评论](https://github.com/suzhe868-arch/mb/issues/136#issuecomment-6286709536)。B只修本批新路径、保持原257与43+9，再追加真正受限签名Refund源与合法双Backend PG16竞争/零半写证据；若无法建立可信父源报`BLOCKED_TRUSTED_REFUND_SOURCE`交A，不得假签。
- **状态：** `A_REVIEW_NOT_ACCEPTED / B_TARGETED_REMEDIATION_REQUIRED / NOT_READY_FOR_A_REVIEW / NO_TRANSACTION_PR / NO_MERGE`。不重做已成功父161/早期Priority工作，不改旧3B/3C1/5B签名父源或公共DDL，不触真实支付/退款/生产Transaction。F06/F07/F08/V1仍`NOT_READY`，新增付费预算$0。

---

> 以下为历史状态与旧施工授权说明；本段本次独立验收结论优先，直至B真实补齐后A复验。

# 2026-10-20｜A主控最新正式状态：PR135真实Deposit通过独立验收合并；B执行Lock→Transaction非生产原子转换

- **前置正式main：** `ffcf9d8609fc9972a0a8780012ddbc52f85cc221`（PR #135标准合并）；B施工以**执行时最新main**为准，旧SHA仅用于追溯。
- **已完成并合并：** F06真实Deposit台账HTTP/PG16，受验 B HEAD `8598df31d71ed3d9e2e13dcdc962002b152f152a`，官方 [Run #39379307863](https://github.com/suzhe868-arch/mb/actions/runs/39379307863)/[Job #118484492475](https://github.com/suzhe868-arch/mb/actions/runs/39379307863/job/118484492475) completed/success，九组**257/257**真测且0失败/跳过/取消。161张已签父表独立逐表COUNT/MD5、24迁移、真实不同OID恢复一致；可信F05 Priority来源恢复真PG16全绿。A [PR #135](https://github.com/suzhe868-arch/mb/pull/135)标准merge `ffcf9d8609fc9972a0a8780012ddbc52f85cc221`。
- **下一唯一主任务：** `F06_REAL_LOCK_TO_TRANSACTION_HTTP_PG16_01`，`NEXT_OWNER=B`，新指定分支 `feat/f06-real-lock-transaction-http-pg16-01`；[Issue #136](https://github.com/suzhe868-arch/mb/issues/136)；[正式B施工单](07_重建工作区/F06真实Lock转换Transaction原子占用HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md)。
- **A报告：** [PR135 A独立验收与下一施工放行](07_重建工作区/F06真实Deposit_HTTP_PG16_A主控独立验收PR135标准合并与下一施工放行报告_2026-10-20.md)。旧F06-3B直接Lock→Transaction转换仍有pending Refund安全缺口，不能当可信生产入口。下批只进行真实非生产合成Transaction HTTP/PG16原子转换，不修改旧父服务/DDL，需同事务封堵旧Lock pending Refund，严禁真钱/真实Transaction Issuer。
- **限制：** F06/F07/F08与V1整体依然`NOT_READY`，正式Source未签、真实支付/退款/生产UAT/部署无授权；新增付费预算$0。C PR68仍Draft未获视觉确认。

---

> 其下为历史状态、旧指针与保留的技术证据；不覆盖本段正式下一动作。

# 2026-10-20｜A主控新裁决：F06 Deposit 父表 Seal 计数勘误，B继续整改（未验收）

- **唯一正式任务：** `F06_REAL_DEPOSIT_LEDGER_HTTP_PG16_01`，`NEXT_OWNER=B`，原分支 `feat/f06-real-deposit-ledger-http-pg16-01`，Issue [#132](https://github.com/suzhe868-arch/mb/issues/132)。
- **A技术裁决：** 官方同SHA F06-3A已验签父层为四个Schema的 **161张完整物理表**（F06-2上一阶段158张），原单“190张”无已验证来源；必须用原生父 Seal 的完整表名清单、逐表COUNT/MD5、24条Ledger、Public Catalog及D1/F06-1/F06-2 attestation逐一比对，两套不同OID数据库及恢复一致性全部通过。**不是删减任何真实父表**，如父集合漂移立即停工报A。
- **B必须修复：** 官方Run [#39366833724](https://github.com/suzhe868-arch/mb/actions/runs/39366833724) **failure**：旧LockRequest PG16第一项报 `original authorized F05 Priority source must survive signed v26`；不得伪造原 Priority 来源或略过真库回归。本批 `disposable-db.sh` 参数展开存在 `§{1:-}` 误写，需修为 Bash 正确格式。新Deposit 38项和TLS9项尚未获得同SHA成功证明。
- **正式裁决文件：** [F06 Deposit 父表Seal数量与Priority前置 A主控技术裁决](07_重建工作区/F06真实Deposit父表Seal数量与Priority前置_A主控技术裁决_2026-10-20.md)；本条仅替换原施工单“恰好190张”计数硬断言，其余白名单、测试、同SHA与非生产资金限制不变。
- **当前判定：** `A_RULING_COMPLETE / B_REMEDIATION_REQUIRED / NOT_READY_FOR_A_REVIEW / NO_DEPOSIT_PR / NO_MERGE`。B最新受阅HEAD `9d93ff4317379b3e8f91532e2e352adf4ae18cf4`；误建PR #133已关闭未合并。B在原分支从最新main继续，全部测试0失败/跳过/取消后交A验收；不自动启动F07/F08/C PR68，不接真实资金/支付/退款/生产。
- **V1与生产：** `NOT_READY`；新增付费预算$0。

---

> 以下为此前已有效的状态与历史记录；本段 A 技术裁决优先用于当前 Deposit 施工。

# 2026-10-20｜A主控最终裁决：F06生命周期PR131合并，正式放行Deposit HTTP/PG16非生产纵切

**当前状态：** `F06_REAL_LOCK_LIFECYCLE_HTTP_PG16_02_A_ACCEPTED / PR131_MERGED / NEXT_OWNER=B`  
**当前下一任务：** `F06_REAL_DEPOSIT_LEDGER_HTTP_PG16_01` / `NEXT_OWNER=B` / Issue [#132](https://github.com/suzhe868-arch/mb/issues/132)。

1. A独立复验R1责任交接链尾校验与R2 Refund来源守卫通过；最终B HEAD `ee3dd1c08b32ea55971a56732098c52cdff1ade1` 对应官方Run #39306159971/Job #118243671999同SHA成功。Node54/54、生命周期Node37/37、原F06 PG16/HTTP21/21、生命周期PG16/HTTP36/36、F05初始化18/18通过，失败/跳过/取消均0。
2. PR [#131](https://github.com/suzhe868-arch/mb/pull/131)标准合并，业务合并SHA `3f8a92d59a658fd486c43c31cebd4c01a03b4421`。PR自然触发10个工作流、28/28 Jobs成功；28个临时工件约2.91 MiB、30天保留期。Issue #130最终关闭。
3. 合法handoff正向PG16 fixture在当前隔离环境不存在；A接受正式施工单允许的受限路径：纯校验器覆盖链尾错误，真实PG16验证无可信链时三动作拒绝且零写入。不得宣称真实数据库合法handoff正向端到端已通过。
4. F06-5B PR #61已由A独立验收并标准合并，merge SHA `1a9b87a2e109190fff0380bbe85e7702a95dcd5e`；F06-5B仍仅CI-only，旧F06-3B直接入口仍不可信，`UPSTREAM_F06_3B_LOCK_PENDING_TRANSACTION_CONVERSION_GAP`继续保留。
5. A正式放行Issue [#132](https://github.com/suzhe868-arch/mb/issues/132)，任务 `F06_REAL_DEPOSIT_LEDGER_HTTP_PG16_01`，分支名 `feat/f06-real-deposit-ledger-http-pg16-01`，施工单 `07_重建工作区/F06真实Deposit台账HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md`。B开工时必须重新读取并使用当时最新main；旧业务合并SHA只用于追溯。仅做非生产合成Deposit事实真实HTTP+非特权PG16纵切；不接真实支付/收款/退款、不开放生产Issuer、不改公共DDL/PDM Final。
6. **本次治理核验前置main：** `adc1cf31d1833cd1a85973865e4f571be7f1140a`。本轮同时修正PROJECT_STATE顶层旧指针，避免仍显示“R1未通过/不创建PR”的过期状态。
7. F06/F07/F08与V1整体仍 `NOT_READY`；正式Source未签署，真实资金/退款、生产部署/UAT均未授权。下一责任窗口为B，B自验完成后交A独立复验。

---

> 以下为历史决策登记；原始裁决保留，但当前状态以本条和PROJECT_STATE.json为准。


---

> 以下为历史决策登记；原始裁决保留，但当前状态以本条和PROJECT_STATE.json为准。

---

# 历史裁决｜2026-10-20 A主控第二轮独立复验（已被PR #131最终验收取代）

**正式状态：`A_CHANGES_REQUESTED_R1_CHAIN_TAIL_FAST_PATH / B_NOT_READY_FOR_ACCEPTANCE / NO_PR_YET / NEXT_OWNER=B`。**

1. B已在指定分支 `feat/f06-real-lock-lifecycle-http-pg16-02` 完成Issue #130的第一轮R1/R2整改，并普通合并A上一轮治理提交。最终报告HEAD `95cdca9fe37e53702e9e5758252a33c052422d1b` 对应官方[Run #39302755405](https://github.com/suzhe868-arch/mb/actions/runs/39302755405)/[Job #118231919969](https://github.com/suzhe868-arch/mb/actions/runs/39302755405/job/118231919969)，同SHA completed/success。原Node54、生命周期Node32、原PG16 HTTP21、生命周期PG16 HTTP36、F05初始化18全部0失败/跳过/取消；24条原F03/F05迁移账本摘要一致。历史失败Run保持原样。
2. **R2通过A独立复验**：`financeGuard()`与proof adapter检查Refund carrier/关联Refund/查询异常，absence hash绑定`observedRefund=false`；L34-L36真实PG16/HTTP用例通过。
3. **R1仍未通过**：`engineering/src/f06-lock-lifecycle-service.mjs`中的`verifyResponsibleHandover()`先执行`if(initial===current)return {ok:true}`，后查receipt链。若正式receipt链A→B存在但Lock当前responsible异常回写A，初始快照与当前值相等导致函数绕过历史链校验，尽管链尾仍为B。这违反原F03 `proven()` 的“完整链尾必须等于当前Lock responsible”不变量。
4. **必须整改**：carrier存在时先读取该Lock全部receipt；无receipt时仅在初始/当前responsible相同情况下允许原路径；有receipt时不论当前responsible是否等于初始值，均验证完整receipt/audit/batch/item、old→new连续性、首条from=初始、末条to=当前。链尾不符/链不完整/查询失败均Fail Closed。增加纯验证器/单元负例模拟“A→B链、初始A、当前A必须拒绝”，不写入/伪造PG16真实receipt；保留L33真实PG16三动作负例与零写入断言。无合法handoff fixture的限制继续如实披露，不改旧F03 handoff service、公共M94、签名账本或PDM Final。
5. 正式审查报告：[F06普通Lock生命周期A主控第二轮独立复验报告](F06普通Lock生命周期_A主控第二轮独立复验报告_2026-10-20.md)；Issue #130已附完整第二轮复验评论。当前不创建PR、不合并main。
6. **下一责任B**：在原分支继续`F06_REAL_LOCK_LIFECYCLE_HTTP_PG16_02`，同步本次治理文档提交后的最新main（普通merge、保留历史），修复R1、跑全量同SHA Node/PG16与24条账本一致性，更新中文报告并重新交A。生产Source、真实资金/退款和部署仍未授权；新增付费预算`$0`。

---


---


---

# 2026-10-19｜A主控 F06 Issue #128 独立审阅与零付费单Job PG16验收出口裁决

- **B分支最新受阅事实**：`feat/f06-real-lockrequest-http-pg16-01` 于审核时HEAD `fb2c43f5600ae1a652731ed5e2d14621d12e6086`，对main ahead48/behind0，19个F06本批变更文件；旧F05/F06冻结工作流与正式PDM未触碰。B已实现真实HTTP/锁车业务/PG16测试源码，**Node本地工作副本54/54并非HEAD同SHA官方验收；真PG16 0/20**。
- **A结论**：`A_REVIEWED_BLOCKED_REAL_PG16 / NO_MERGE / NOT_READY_FOR_A_REVIEW`，不得以源码、54个本地Node模拟测试或严格入口失败负例代替实跑PG16；Issue [#128](https://github.com/suzhe868-arch/mb/issues/128)保留Open。
- **执行环境技术授权**：同意由B仅在指定F06隔离分支新增1份非冻结、只允许该分支`push`＋F06精确`paths`触发的单Job工作流；仅`ubuntu-24.04`标准免费Runner＋`postgres:16-alpine`本地服务，45分钟限制，无matrix/付费Runner/Secrets/额外Artifact上传，权限`contents:read`，新增付费预算`$0`。首个Push前必须证明不会意外唤醒旧F05的28 Job与任何其它工作流，禁止skip-ci、禁止B自行创建PR。
- **验收硬门槛**：受验完整仓库`npm ci`及Node22测试、独立非超管PostgreSQL16、合法真实F03 24条迁移台账＋F05结构基线、真实HTTP与PG事务至少20项0失败0跳过0取消、权限/并发/回滚及签发拒绝正反例；不能手工假造旧签发/迁移账本、不能降级readiness。不具合法可信历史基线则报告`BLOCKED_TRUSTED_M94_F05_BASELINE`而非假通过。
- **下一责任**：`NEXT_OWNER=B`，继续原`F06_REAL_LOCKREQUEST_APPROVAL_WAITLIST_HTTP_PG16_01`，从最新main施工规则和原B分支接续；测试、代码缺陷、真实CI、证据全部完成后才标`READY_FOR_A_REVIEW`交A。A验收成功前不得合并或开启F07/F08。
- **依据**：A [Issue #128正式裁决](https://github.com/suzhe868-arch/mb/issues/128#issuecomment-6268113660)及已追加章节的[完整F06施工单](F06_真实锁车申请审批唯一Lock与自动候补_首条业务API纵切_A主控B正式施工单_2026-10-18.md)。GitHub公开仓库标准Runner免费依官方文档，Artifact/缓存仍可能计费，故本单禁止新增付费存储。
- **不变边界**：PR125/PR127历史成绩原样，`formal_source_signed=false`，`production_ready=false`，C PR68仍Draft，生产/真钱/正式微信与第三方写入未授权。

---

# 2026-10-19｜A主控决议：PR #127已独立验收并合并，正式恢复F06真实业务纵切

- **F05五项旧Source门禁整改**：[PR #127](https://github.com/suzhe868-arch/mb/pull/127) 已标准合并，B最终HEAD `6890bd9cc80d4fc556cbe0b4e94a240b1eb6c25b`，merge SHA `fcbcef31d037530f78f4c15f94d20acdc7292c2c`。A已独立复核13个变更文件、五个目标Source Job原生日志、事件契约测试与HTTPS工件摘要；未修改冻结Workflow。
- **官方CI证据**：关联10个PR工作流、28/28 Jobs终态成功；五个目标Source Job各25/25事件契约测试通过，失败0、跳过0。PR模式明确标记 `nonproduction_pull_request`，不冒充旧同SHA push证据，不宣称旧64/68个push Job在PR模式通过。
- **合并限制**：GitHub拒绝PR作者批准自己的PR，A未伪造Approve记录；独立技术检查完成后按标准PR合并流程合并。该结论只接受非生产工程整改，不代表正式Source签发或生产就绪。
- **历史事实**：PR #125仍保留原始5成功/5失败；旧66项仍为65项真实通过＋1项旧Oracle `BLOCKED_EQUIVALENCE`。历史失败没有被改写；`formal_source_signed=false`、`production_ready=false`。
- **F06前置复核**：A重新核验最新main中的 `engineering/f06/lockrequest-approval-waitlist-ci/service.mjs`、`migration.mjs`、`ci-router.mjs`、`engineering/src/app.mjs` 与 `server.mjs`。现有F06服务仍为CI-only，旧迁移封印固定在历史环境，旧路由POST拒绝，Foundation应用尚未注册真实LockRequest handler；因此真实HTTP＋PG16业务纵切仍需开发。未发现指定F06分支已有工作，不能假设已有成果。
- **当前正式责任**：`NEXT_OWNER=B / NEXT_TASK=F06_REAL_LOCKREQUEST_APPROVAL_WAITLIST_HTTP_PG16_01 / BRANCH=feat/f06-real-lockrequest-http-pg16-01`。A已更新F06施工单，明确首次远程提交前仅核对本批精确路径的workflow触发风险，不修改冻结Workflow、不重跑旧66项、不触发无关F05旧门禁扇出，预算$0。
- **下一阶段范围**：真实Node HTTP＋隔离PG16锁车申请、员工审批/拒绝、单车唯一Active Lock、竞争申请自动Waitlist、6小时PENDING、72小时初始Lock、身份/权限/Scope、并发、幂等、回滚与安全投影正反例。生产身份、真钱、正式Source与生产部署仍不在授权范围内。
- 正式A报告：[PR127_A主控F05五项Source事件感知整改独立验收与合并报告_2026-10-19.md](PR127_A主控F05五项Source事件感知整改独立验收与合并报告_2026-10-19.md)。

---

# 2026-10-19｜A主控决议：用户同意修复F05五项旧Source门禁；正式放行B专项整改，F06暂停

- **正式任务**：[Issue #126：F05五项旧Source门禁整改](https://github.com/suzhe868-arch/mb/issues/126)；施工单：[F05五项旧Source门禁事件感知与证据校验整改](F05五项旧Source门禁事件感知与证据校验整改_A主控B正式施工单_2026-10-19.md)。
- **责任与分支**：`NEXT_OWNER=B / NEXT_TASK=F05_SOURCE_GATE_EVENT_AWARE_EVIDENCE_REPAIR_01 / BRANCH=feat/f05-source-gates-event-aware-evidence-01`。状态`A_RELEASED_FOR_B`；B完成后交A独立复验，不得自行合并。
- **用户授权**：用户明确同意修复PR #125的5项旧Source门禁失败，专项整改优先于F06；F06/F07/F08暂停，待A独立验收并合并后再恢复F06。
- **F05业务基线不变**：PR #125已合并main，SHA `25034a7cd9e3d977e18ffb7f5dc0ba8db1008064`。业务SHA `f7503843a60bef3f94b818d80a37ec166a157775` 与证据HEAD `d5690899ff37d3b7ddc46b1640dd113309addecf` 的官方回归均560/560通过、失败0、跳过0。
- **5项旧门禁**：F05-7 `F05_7_CANNOT_PROVE_66_SAME_SHA_OFFICIAL_PG16_JOBS_IN_BOUNDED_CI_RUN`；F05-8 `F05_8_OFFICIAL_68_JOB_GATE_UNPROVEN`；F05-9 `F05_9_NOT_IN_OFFICIAL_NEW_PUSH`；F05-10 `F05_10_NOT_NEW_OFFICIAL_PUSH`；D1 `D1_NOT_NEW_OFFICIAL_PUSH`。根因基线为校验器把PR事件误要求为同SHA旧push运行证据。原Run及失败结果永久保留，不改写为PASS。
- **A裁决**：将校验器修为事件感知模式。PR模式验证当前PR真实同SHA业务/HTTPS证据，明确不声称旧push作业已通过；main官方push模式继续严格校验同SHA官方来源链。SHA/Run/Job/工件摘要不匹配、缺失、失败、跳过、错误事件/分支均必须Fail Closed。PR验证不等于正式Source签发。
- **冻结与预算**：不得修改冻结的`.github/workflows/*.yml`；不得重跑旧66项；不新增付费，预算$0。相关F05路径只允许一个正式整改PR及其一次自然CI，避免无效反复扇出。
- **生产门禁**：`formal_source_signed=false`、`production_ready=false`。本次不新增/启用正式微信/F03/JYT/4S/名邦Source Issuer，不伪造签名、不将测试Issuer提升为正式。
- **验收门槛**：PR和main push两种模式均有可重复测试与安全负例；旧PR/旧66/PR113历史结果不变；A独立验收通过后才合并，并更新README、CURRENT_PROJECT_STATE、NEXT_ACTION、PROJECT_STATE及相关矩阵。

历史记录从下方保留，不删除或重写既有决议。
---

# 2026-10-18｜A最新裁决：F05真实交付验收优先、暂停F06施工主线

- **用户最新明确批准**先将F05真正修正、达到可验证真实功能验收，再恢复F06；此执行顺序覆盖PR120后直接放行F06的**执行优先级**，不修改历史已合并PR或旧实际CI结果。
- **判定**：PR120只允许旧`65/66 + 1 BLOCKED_EQUIVALENCE`作为非生产CI历史功能阶段例外，原PR113仍`23/28`，5正式Source Fail Closed；**F05不能宣告FULLY_COMPLETE**，也没有证据证明F05所有可用HTTP/PG16纵切已交付。
- **正式放行**：B执行`F05_REAL_DELIVERY_AND_TRUSTWORTHY_ACCEPTANCE_CLOSEOUT_01`，[A完整施工单](07_重建工作区/F05真实业务交付与有效验收彻底整改_A主控B正式施工单_2026-10-18.md)，分支`feat/f05-real-delivery-acceptance-closeout-01`。B核账F05-1～11、补真实运行入口/PG16/安全测试、构建新HEAD有效验收证据；A独立验收、必要整改、合法PR合并后才判定是否解除F06暂停。**严禁用旧来源例外放行新业务失败，也严禁为了旧红灯新增无业务意义的签署工程**。
- PR121的F06单和既有B_APP_01单保留历史/队列，**目前NEXT_OWNER=B（F05），F06/F07/F08暂停主线**；C PR68按原视觉否决独立。正式签署和生产部署仍独立`SOURCE_GAP_OPEN/FAIL_CLOSED/NOT_READY`，不增加付费，无生产/真钱/第三方凭据。

---

# 2026-10-18｜F06开始真正锁车业务接口纵切施工（不是CI来源签名工程）

- F05历史两组旧来源校验红灯已由[A PR120](https://github.com/suzhe868-arch/mb/pull/120)判为同一旧Push来源条件不适用于新PR，**仅F05非生产CI功能范围按65真通过＋1旧Oracle例外受限收口**；旧66/66和PR113 28/28绝不虚报。V1生产及五Source未签，真实权限安全继续必须通过。
- **新的主线任务`NEXT_OWNER=B / NEXT_TASK=F06_REAL_LOCKREQUEST_APPROVAL_WAITLIST_HTTP_PG16_01`**，A签[完整F06真实业务施工单](07_重建工作区/F06_真实锁车申请审批唯一Lock与自动候补_首条业务API纵切_A主控B正式施工单_2026-10-18.md)。只做**Node实际HTTP + PG16事务**首条纵切：锁车申请6h PENDING，名邦合法员工审批/拒绝，正式Lock单车唯一+72h，其他有效PENDING自动候补，真实身份/Scope/竞态/幂等/回滚和客户安全投影正反例。正式Customer身份未接入时拒绝真实请求，测试身份仅非生产；不做真钱/生产/支付。
- 已有F06-1～5C为CI-only，不等于可运行正式端点；旧冻结工作流与签署器不再作为业务开发前置。B用隔离分支`feat/f06-real-lockrequest-http-pg16-01`，优先本地PG16真测，$0预算不变。之前B_APP_01车辆目录只读单保留排队，后续F07、F08按顺序推进。C PR68依然Draft。

---

# 2026-10-18｜F05两类旧Source检查同根因裁决：非生产CI业务阶段按真实65项与1项历史例外收口，顺序转F06

- [A正式裁决](07_重建工作区/F05最后两组旧来源红灯_业务验收边界与F06顺序_A最终技术裁决_2026-10-18.md)：旧66项中**65项真实完成、1项原Source Oracle BLOCKED_EQUIVALENCE**；PR113原28 Check **23成功、5项旧同SHA push证明失败**。这是旧`push`签署条件不适用于新`pull_request`分支的同一根因，不是六个新业务缺陷。失败记录及SHA原封保留，**绝不能宣称66/66全绿或五正式Source获签**。
- **本阶段仅`F05_CI_ONLY_FUNCTIONAL_SCOPE_ACCEPTED_WITH_LEGACY_SOURCE_EXCEPTION`**；不再要求B反复做DVD/WORM、Sigstore、密钥、旧66重跑。用户Actions$0预算、原仓库不变；真实角色权限、价格隐私、安全及生产/支付/外部接口门禁全部保留，V1`NOT_READY`。
- **按用户最新顺序NEXT_OWNER=A，NEXT_TASK=`F06_A_REVIEW_EXISTING_LOCK_WAITLIST_CI_AND_REAL_DELIVERY_GAPS_01`**：先审F06已有隔离CI与真实LockRequest申请/审批/Lock/Waitlist接口缺口，再正式派B开发；F07、F08随后。前次`B_APP_01`任务**暂缓排队而非删除**，不允许抢跑当前F06前置；C PR68维持Draft和用户原视觉否决。

---

# 2026-10-18｜用户要求停止无业务价值的签署/归档循环，A正式恢复真实车辆业务接口开发

- **正式业务优先**：B下一个任务`B_APP_01_REAL_PG16_CATALOG_LIST_DETAIL_READONLY_01`，按[真实PG16车辆列表/详情只读施工单](07_重建工作区/B_APP_01_车辆列表详情真实只读接口与C01联调契约_A主控正式施工单_2026-10-18.md)完成运行于隔离Node HTTP＋PG16的客户安全车辆列表与详情DTO，输出可供C01联调的真实服务，不接受仅Mock、工作流审计报告或签名样板。
- **C并行**：原[PR68](https://github.com/suzhe868-arch/mb/pull/68)继续R3首页详情真实界面返工，执行已放行47行R3+R1/R2，不因B后端推进就谎称用户已认可页面；C仍归C，B不改其分支。
- **F05历史事实与适用边界**：旧真实65/66业务成功、1项旧Source Oracle`BLOCKED_EQUIVALENCE`，PR113同HEAD的28 Checks 23成功5旧Source失败。签名、离线密钥、WORM/DVD、第二账号**不再作为非生产业务功能开发前置**；历史不能写66/66或Source签署成功，真正生产放行、客户权限和数据安全门禁仍有效。
- **现状**：正式`main`只有F01健康/隔离身份基础，F04动作合同还是`/__ci__`候选，F06/07/08主要是隔离CI验收，不代表全部真实API/资金可上线。当前B首要工作是真正交付一条端到端读取纵切，成本零新增付费，C页面同步改进；以真实功能为终态，不再增加无必要的工程证明任务。
- 新`NEXT_OWNER=B`；C为并行任务；默认用户GitHub预算$0，生产`NOT_READY`。

---

# 2026-10-18｜A主控单GitHub账号独立离线签署方案已裁定（不更换账号/仓库，不开正式Source）

- 用户已同意继续用`suzhe868-arch/mb`及现有单GitHub账号，**不需第二GitHub账号、不开付费**。A裁定**工程域=现有GitHub**、**签署域=用户掌控的仓库外Ed25519私钥与受信离线校验器**。独立技术控制域不等于双人审核，不能用`Prevent self-review`假设同一执行者能批准自己的作业；更不能关闭该规则后谎称两人审签已满足。 [单账号正式裁决](07_重建工作区/F05-7_V2单GitHub账号离线双域签署及证据保全_A主控技术裁决_2026-10-18.md)。
- 正式`main`前基线`26d519e56f0d5cced7cf47365152d960eeaaf46d`；B [PR116](https://github.com/suzhe868-arch/mb/pull/116)离线影子工程、A [PR117](https://github.com/suzhe868-arch/mb/pull/117)均已受限合并。PR113的旧正式Source检查23/28通过、5真实失败；旧Run39035485532真实65/66业务通过+1旧Oracle`BLOCKED_EQUIVALENCE`。五正式Source始终`SOURCE_GAP_OPEN/FAIL_CLOSED`，V1/生产`NOT_READY`。
- **真实设备/账号实证仍未完成**：用户受控私钥及仓库外指纹`NOT_PROVISIONED`、四原ZIP非公开不可变/可恢复WORM`NOT_VERIFIED`、A外部耐久撤销/nonce和独立REST真核`NOT_VERIFIED`、单人替代双人审批的正式安全等价裁决`NOT_DECIDED`。普通U盘或临时ZIP副本不能冒充WORM；公开GitHub Release不得上传日志原件。
- **`NEXT_OWNER=A / NEXT_TASK=F05_7_V2_A_SINGLE_ACCOUNT_OFFLINE_SIGNER_AND_PRIVATE_ARCHIVE_GATES_01`**。先把单账号离线签署与真实私有归档步骤在A闭环到可核证条件，再考虑放行B正式签名接入/五消费者迁移；目前不重复旧66、不修改旧8冻结Workflow或原Source，不另创建付费CI。C PR68独立。

---

# 2026-10-18｜PR116 B独立签署影子门禁已由A真实离线验收并受限合并，下一责任A

- [B PR116](https://github.com/suzhe868-arch/mb/pull/116)仅7份`audit/f05-v2-source-shadow-trust/**`隔离非生产影子候选，B唯一HEAD`08b1d6b1a980eb5191b9061960274069693e1dbd`，A正式受限合并`main@d8b4d97487a5b656ae2f67e880f665096ada6d11`；没有改旧八Workflow、五正式Source、原业务、数据库或生产。[A独立审签](https://github.com/suzhe868-arch/mb/pull/116#issuecomment-6239025577)。
- A独立从7份Git Blob与B原交接ZIP逐字节核对**7/7**，用真四官方旧ZIP**Python5/5、Node52/52均通过，0跳过**；五消费者影子全部拒绝。335工作流GitHub官方索引与B静态机器清册**335/335 SHA一致**，7精确路径0静态触发、真实HEAD 0远程Runs/Checks；**无新远程CI不能称官方CI全绿**。去敏manifest根`034418349b767fd966371f7f9c0c0cb4a18385d51f32ecc6c41483656fded438`经A真ZIP独立重算一致。
- 历史PR113官方28 Check终态**23成功5旧Source失败**，原真业务仍**65/66成功+1旧Oracle BLOCKED_EQUIVALENCE**。无真实A独立审核人/受保护签署环境、私有WORM四ZIP归档、持久撤销nonce账本、独立官方REST全链路审计，故五正式Source`SOURCE_GAP_OPEN/FAIL_CLOSED`、V1`NOT_READY`、预算`$0`不变。
- **新责任`NEXT_OWNER=A / NEXT_TASK=F05_7_V2_A_INDEPENDENT_REVIEWER_PRIVATE_ARCHIVE_GO_NO_GO_01`**：A先做真实账户级签署身份与非公开不可变原始证据仓`GO/NO-GO`。没有独立真人身份或零付费安全保全渠道就保留阻断，不能再命令B假签发；仅条件具备后授权B新的正式Source迁移。 [A中文报告](07_重建工作区/PR116_A主控五来源影子安全门禁受限验收与可信身份归档下一门禁_2026-10-18.md)。C PR68继续独立。

---

# 2026-10-18｜A可信来源零费用技术裁决完成，B新离线影子工程正式放行

- 最新正式旧PR113独立CI **28项终态＝23成功/5失败**；旧来源签约5项真实Fail Closed，旧PR111历史65/66+1旧Oracle BLOCKED不变。PR113/PR114此前已受限工程归档，五正式Source和生产仍关闭。
- A独立核实公开GitHub Free可使用官方Sigstore Artifact Attestations和受保护Environment Required Reviewers/Prevent self-review，但当前**无实际证据证明独立审阅身份、受保护Workflow及非公开不可变四ZIP保管已配置**；Sigstore签的只是新审核来源，不能倒签历史成功，也不能把原始日志发布到公开Release。[A正式架构裁决](07_重建工作区/F05-7_V2_A零付费独立签署与私有证据归档技术裁决_2026-10-18.md)。
- **当前`NEXT_OWNER=B`，任务`F05_7_V2_INDEPENDENT_SIGNER_SHADOW_AND_FIVE_CONSUMER_NEGATIVES_01`，完整[施工单](07_重建工作区/F05-7_V2独立签署影子验证与五来源负例_A主控B正式施工单_2026-10-18.md)**：只在隔离目录开展离线的V2可信签署影子Gate、五正式Source的模拟拒绝和攻击负例，默认**不批准任何远程CI/工件/真正签署/生产**。B仅在最新main全量工作流逐原Blob验证精确路径0触发时才允许一次受控分支/PR，否则交A阻断，不触碰用户$0预算。A账户的真实独立签署、私有WORM保管审批职责仍独立。
- 旧ref严禁Push、旧66不重跑、Source`SOURCE_GAP_OPEN/FAIL_CLOSED`、V1`NOT_READY`，C PR68独立Draft。

---

# 2026-10-18｜A受限验收PR113已正常合并：V2独立验真候选代码入main，旧来源仍Fail Closed；下一责任A

- **B [PR113](https://github.com/suzhe868-arch/mb/pull/113) 已由A仅按非生产工程受限验收并标准合并**：候选唯一HEAD `6ad823936592835c4ce8b34f06ed88aa5942e777`，合并`main@652316eaad06d5adea961f19036e8f69d4107a89`；只新增10份`engineering/f05/v2-attestation-gate/**`独立验真/加密门禁候选与测试、中文报告，原8冻结Workflow、旧父签、五正式Source、业务/DDL/生产/C前端未改。[A受限审签](https://github.com/suzhe868-arch/mb/pull/113#issuecomment-6237802666)。
- **本PR真实官方CI不是全绿**：唯一末SHA自动触发10份原PR Workflow、28项Check；合并前A真实快照**23成功、4失败、1进行中**，红灯均由旧Source对同SHA冻结`push`身份的硬验证要求拒绝，不能用候选PR冒充正式来源。F05-8剩余结果需另行查终态，不能预写通过。A离线真实四ZIP重算原正文**931/931**、Python先前包**13/13**、Node**25/25**；B自验的新版本Python**17/17**不等于A已在新SHA独立实跑17条。旧Run真实原业务**65/66通过＋旧Oracle1项BLOCKED**，不能写成66/66正式签约。
- **正式签署仍绝对关闭**：`FORMAL_ISSUER_NOT_SIGNED / SOURCE_GAP_OPEN / FAIL_CLOSED`；缺受控A签名者、受保护独立REST验证身份、四真实官方ZIP长期不可变归档、五消费者受控迁移及旧Oracle安全等价裁决。原旧来源ref禁止Push，V1/生产`NOT_READY`。现公开仓库可真实启动标准Runner，但用户Actions费用限制维持**$0、不授权新增付费**。
- **新的当前责任和任务**：`NEXT_OWNER=A / NEXT_TASK=F05_7_V2_A_INDEPENDENT_SIGNER_ARCHIVE_AND_SOURCE_MIGRATION_DECISION_01`，先解决A身份、免费可信归档、Sigstore/Artifact Attestations可行性及五消费者准入，再决定是否向B签下一阶段施工单；**不得让B重跑既有65项业务或重复335项工作流扫描**。C [PR68](https://github.com/suzhe868-arch/mb/pull/68)继续独立Draft，不因本次工程归档放行视觉/功能。
- [本轮正式A报告](07_重建工作区/PR113_A主控V2官方只读候选受限合并与后续可信签署治理裁决_2026-10-18.md)；[Issue106最新A连续裁决](https://github.com/suzhe868-arch/mb/issues/106#issuecomment-6236810312)。

---

# 2026-10-17｜A对B PR111独立受限验收：65/66同SHA真原业务＋新版V2来源候选合入main，旧Source签发仍关闭；正式放行官方只读取证与可信签署治理B单（最新）

- **B [PR111](https://github.com/suzhe868-arch/mb/pull/111) 已独立审查并按限域正常合并**：原唯一受验HEAD`bdffc492df7dc09d9192d3ac485d598df7a8c040`，对上一main ahead1/behind0，10项严格新`engineering/f05/v2-issuer-candidate/**`及新独立CI，无冻结8旧workflow/旧Source/Issuer、业务/DDL/PDM/C/生产修改。merge `main@996d032252535cda8487b4c25e62ae3c72f39a3a`，按[A独立PR审签](https://github.com/suzhe868-arch/mb/pull/111#issuecomment-6234593834)只批准`A_ACCEPTED_ENGINEERING_CANDIDATE_ONLY`，不是正式来源签发。
- **真实GitHub [Run39035485532](https://github.com/suzhe868-arch/mb/actions/runs/39035485532)**：本HEAD`push/attempt1/completed/failure`，四个标准Ubuntu分片**3成功/1失败**，原66 job中**63个PG16+2个原NonPG＝65项实际完整原业务成功**、旧`match-source`原2条Shell只跑成第一条，旧7Workflow64 Job同SHA Oracle无等价实现所以Fail Closed。原PR104历史2 job确在本新HEAD重新完整实跑，不能用过去SHA伪造。
- **A实际独立下载四官方ZIP并对外/内SHA及manifest 931/931原文件逐个复算**：#12101319115/#12102520536/#12101854148/#12102560092，66个原Job唯一记录与65条PASS Shell计数一致，PG16实际版本16.x、两原NONPG区分准确，归档未见未脱敏`::add-mask::`、PEM私钥或原测试HMAC完整赋值。该HEAD全仓Checks快照32=26成功、5失败、1运行中；绝非全绿。详见[正式报告](07_重建工作区/PR111_A主控65项同SHA真实业务及V2来源候选受限验收报告_2026-10-17.md)。
- **工程与来源签约严格分开**：当前`V2_SOURCE_CANDIDATE_66_NEW_HEAD_V1`的线上官方只读自动验证器尚未有可信独立端到端运行结果，且B可写的候选branch/聚合Runner/1日工件不能直接替代旧原生七Workflow同SHA官方身份及A签名；不得改原旧验证器、伪造最后1项PASS、恢复原ref`99c38d013f67cc56975f1664120fb87c204afc3c`或五正式Issuer。**五Source继续`SOURCE_GAP_OPEN/FAIL_CLOSED`，F05/V1/生产`NOT_READY`**。
- **唯一下一B主线正式放行** `NEXT_OWNER=B / NEXT_TASK=F05_7_V2_TRUSTED_READONLY_ATTESTATION_AND_ISSUER_GOVERNANCE_01`。B直接按[新施工单](07_重建工作区/F05-7_V2来源候选官方只读取证与可信签名门禁_A主控B正式施工单_2026-10-17.md)从最新main创建隔离分支，优先对**本Run/四ZIP**执行真实官方REST只读端到端验证并硬化冻结身份、逐步证明/防伪和A控制可信签署/消费者迁移回退；**默认不再次触发66项真实CI，不花未授权费用**。官方Artifact1日过期和先前#12099312017合成HMAC安全风险需独立记录；若过期/缺账户签署权限必须Fail Closed，不能假造成已签。
- 责任A已完成本轮PR审查、受限合并、五权威状态归档及新B任务放行；Issue[#106](https://github.com/suzhe868-arch/mb/issues/106)继续Open，C PR68仍独立。

---

# 2026-10-17｜A已受限验收合并B PR107：新Run原业务63/64成功、证据脱敏验真；旧Source签约未就绪，正式放行独立V2来源协议候选工程（当前最新）

- **A已对B [PR107](https://github.com/suzhe868-arch/mb/pull/107)独立验收并正常合并**：B验收HEAD `5923cddecf660f97d07231ea375f89b255c809bc`，从本轮旧正式main比较ahead5/behind0，12项仅新V2隔离执行器/CI/安全负例/来源候选文档；merge main `b8adeeed6d575d5bd549a5640f68eebf9ce2399b`。[A独立审签](https://github.com/suzhe868-arch/mb/pull/107#issuecomment-6233942303)和[完整验收报告](07_重建工作区/PR107_A主控63项真业务与证据脱敏受限验收及V2来源替代裁决_2026-10-17.md)仅批准**受限工程入库**，不批准原66同SHA Source、正式Issuer、V1/生产。
- **官方真[Run39031350514](https://github.com/suzhe868-arch/mb/actions/runs/39031350514)**：`push/attempt1/completed/failure`，4个ubuntu24分片3成功1失败，每片Node`76/76`成功，原Job逐项真实结果**61PG16+2原非PG16=63/64 PASS，原match-source旧验签1项BLOCKED_EQUIVALENCE**，不是全部正式同SHA66。四份官方Artifact #12100013558/#12100194677/#12100831373/#12100103579，A已**实际下载外层/内层ZIP并独立hash对齐913/913份正文**、64项原证据；新脱敏未查到未遮蔽`::add-mask::`、私钥或测试HMAC完整赋值。旧一日Artifact安全风险另行跟踪。该SHA全仓Check快照32＝26成功、5失败、1运行中；不得宣称全绿。
- **A裁决旧结构性问题**：原`match-source`第二Shell的`ci-verify-workflows.mjs`仍要求七份旧Workflow原64Job同SHA官方push成功＋本原source/https两Job，旧ref与8冻结整体66禁Push，故无法简单给Token修复；严禁改原验证器、伪造Token/API/工件、跨SHA拼PR104历史2项或叫64/64已验。现合并的`v2-source-contract.mjs`只是**非生产协议候选雏形，尚未严格绑定真实66清册/官方实时证明，绝不是正式Issuer**。
- **唯一新B主线已正式放行**：`NEXT_OWNER=B / NEXT_TASK=F05_7_V2_VERSIONED_SOURCE_66_SAME_SHA_ISSUER_CANDIDATE_01`，从执行时最新main在独立新分支`feat/f05-7-v2-versioned-source-66-candidate-01`，严格按[完整版A施工单](07_重建工作区/F05-7_V2正式来源替代协议同SHA闭环候选_A主控B施工单_2026-10-17.md)编写版本化新V2来源签发证据合同、真正可运行的同SHA隔离PG16/NonPG回归与双历史任务同HEAD重验、冻结Job/Blob强绑定及恶意替换负例，最多4标准Runner，每Job≤40分钟，工件每片≤5MiB/留1日，单次末Push、存储/旧CI扇出不能证明则停。**原match-source旧Shell未成功只能明记被候选新协议替代、待A正式单独审签**，B不得自己签Issuer或修改生产。
- **全局源门禁不变**：旧原ref `99c38d013f67cc56975f1664120fb87c204afc3c`不准Push、旧8Workflow整体66禁恢复，`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`，五正式Source仍`SOURCE_GAP_OPEN / FAIL_CLOSED`，F05全域/V1/生产`NOT_READY`。Issue [#106](https://github.com/suzhe868-arch/mb/issues/106)保持Open直至来源合规闭环。C PR68 Draft独立并行，不被B新施工覆盖。

---

# 2026-10-17｜A独立实核PR107四官方ZIP：62/64真业务通过，另2未闭；旧Source同SHA签约结构性不等价，发现合成HMAC日志脱敏缺口（最新）

- **B [PR107](https://github.com/suzhe868-arch/mb/pull/107)本轮不可完整验收、不可合并**。候选唯一HEAD`c28af176bdec6f18c897ebd3d167db21fb18a716`，从最新main比较ahead4/behind8；9项仅新隔离CI/执行器/Node及Ruby测试/说明，原8冻结Workflow/五正式Source/业务/DDL/PDM/C/生产和旧ref未改；待B修复后需同步main形成新SHA和相应真CI，禁止冒用先前SHA证据。A[PR107正式审签](https://github.com/suzhe868-arch/mb/pull/107#issuecomment-6233462972)及[详细报告](07_重建工作区/PR107_A主控62项真业务受限取证与旧Source父签不可等价及日志脱敏终审_2026-10-17.md)。
- **GitHub真[Run39027727248](https://github.com/suzhe868-arch/mb/actions/runs/39027727248)** completed/failure，4个ubuntu24原生分片2成功2失败，每片Node56/56；原64项同SHA真实结果**60原PG16 + 2原非PG16 = 62通过**、1`match-source`来源语义阻断、1`f03-1-frozen-https-2a`环境失败。A已真正下载四份官方Artifact `12098603894/12099312017/12099621026/12099695908`，独立对GitHub摘要、双层ZIP和每个正文文件摘要逐一验证，四片原Job各16/16归档；官方同HEAD全仓Checks快照32＝25成功、6失败、1进行中；不能以62业务通过代替完整正式父签。
- **A更深层因果核定**：原`match-source`第二原Shell强制调用`ci-verify-workflows.mjs`验证7份旧冻结Workflow的64Job**全部同SHA新push成功**，旧来源ref和原8工作流整体启动仍NO-GO，故此原步骤不能通过额外只读Token在隔离V2上等价完成；B不得假API、修改原脚本或虚报。原F03-1 HTTPS失败是新执行器遗漏原GitHub `GITHUB_ENV`在原step间传播；B可仅白名单恢复测试内三个F03_1临时变量并真测。
- **证据脱敏需先修**：A在真实官方分片1内层日志找到一次性合成HMAC的`::add-mask::`明文44字符输出，被原样打包、未获GitHub原生mask处理；未见生产凭据，但属于V2证据采集安全缺口。B修复掩码处理、拒绝日志/PEM泄露的负例并在必要时删除或等待旧1日工件过期；禁止上传不安全全量原始日志。
- **同一B原工作包继续**：下一`NEXT_OWNER=B / NEXT_TASK=F05_7_V2_REMAINING_64_REAL_EXECUTION_AND_ISSUER_PROOF_01`、原PR107/原分支；[原施工单A最新补充](07_重建工作区/F05-7_V2余64项原业务隔离实跑与安全等价来源证据_A主控B正式施工单_2026-10-17.md)和[完整终审裁决](07_重建工作区/PR107_A主控62项真业务受限取证与旧Source父签不可等价及日志脱敏终审_2026-10-17.md)已签；A加签最多**1次**安全有界Push（4标准Ubuntu Runner、每Job40分钟、工件≤5MiB/片、保留1日），先本地代码/负例与容量预检。新的V2来源签约逻辑仅允许**候选方案设计**，不得绕过旧正式Source/Issuer或称64/64；五正式Source仍`SOURCE_GAP_OPEN/FAIL_CLOSED`，旧ref`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`，V1/生产`NOT_READY`；C PR68 Draft独立并行。

---

# 2026-10-17｜A对B PR107四分片原业务受控首跑独立验收：1/64真通过、63阻断；精确裁决62PG16＋2非PG并放行有限整改（当前最新）

- **受验B [PR107](https://github.com/suzhe868-arch/mb/pull/107) 暂不合并**，唯一受验HEAD `88afd5d2f3389a844d0da2903b59e903e1949f5a`，对main `8e97dd45bcb9aadbd24fdfd8114a32563627d9c6` 为ahead2/behind0，仅7项本包允许的新增路径，无业务/DDL/旧Source/原8Workflow/生产/C变更。A[正式审签](https://github.com/suzhe868-arch/mb/pull/107#issuecomment-6232764185) 和[完整裁决](07_重建工作区/PR107_A主控原64项权限及PG16语义等价裁决与有限续跑令_2026-10-17.md)，Issue [#106](https://github.com/suzhe868-arch/mb/issues/106)继续Open。
- **真实GitHub [Run39023409526](https://github.com/suzhe868-arch/mb/actions/runs/39023409526)**：本HEAD `push/attempt1/completed/failure`，4个隔离标准Ubuntu Job都真实执行但**4个最终failure**；每Job官方Node51/51，原64项只`g-https` **1/64真PG16业务成功**，59项被新增执行器过严permissions拦截、2项原PG16初始化失败、2项原始H52`h-source/h-https`本来无PG16服务。官方4份同SHA有效Artifact 12097786258/12097468274/12097885208/12097294015；A未下载ZIP亲自重算。全仓Check官方当时32=23成功、8失败、1运行中，不可宣称全绿；失败的4旧Source/父签亦不得冒充恢复。
- **A纠正原施工单不可实现的“余64项全PG16”口径**：原冻结66项实际为64 PG16＋2原非PG16，前批PR104已有2项历史PG16，所以**本包待验64＝62真PG16＋2按原样非PG16作业**。A授权仅解决只读permissions安全等价、PG稳定就绪竞态和h-source/h-https无PG执行，保留原测试断言/Artifact，不许为数字补假PG16；详细技术正反例和限额见[正式补充令](07_重建工作区/PR107_A主控原64项权限及PG16语义等价裁决与有限续跑令_2026-10-17.md)。
- **同一B工作包内一次性整改**：仍`NEXT_OWNER=B / NEXT_TASK=F05_7_V2_REMAINING_64_REAL_EXECUTION_AND_ISSUER_PROOF_01`、同分支`feat/f05-7-v2-remaining-64-real-pg16-01`和同PR107；允许额外最多**2次**受控Push，每轮≤4个标准ubuntu24 Runner、每Job≤40min、每片≤5MiB留存1天，异常预算/队列Fail Closed；需明确分开历史2PG与同HEAD62PG+2非PG，出具真实同SHA完整来源证据，不能简单把4个新Job绿色当64个原业务通过。仍不得强推旧源分支或启动旧8Workflow/66Job、签正式Issuer、生产/V1 `NOT_READY`，C PR68 Draft独立并行。
- **本轮A独立审查结论 `A_CHANGES_REQUESTED / PR107_NO_MERGE`**，非一次已通过验收。A的原正式施工单[更正后文本](07_重建工作区/F05-7_V2余64项原业务隔离实跑与安全等价来源证据_A主控B正式施工单_2026-10-17.md)和[本次技术裁决](07_重建工作区/PR107_A主控原64项权限及PG16语义等价裁决与有限续跑令_2026-10-17.md)均已放行；B无需重新开任务或等待用户逐项批准，先自行解决可修的59＋2，再依法完成剩余原Job的真实回归与证据归档。 

---

# 2026-10-17｜A独立受限验收B PR104：66项来源清册全量映射、2项真实PG16通过；旧66 NO-GO，正式放行V2剩余64项实跑（最新）
  
- **A已审核标准合并B [PR104](https://github.com/suzhe868-arch/mb/pull/104)**：B唯一HEAD `346fb11133f0883014b7911effb58052bd17b2c1`，合并main SHA `62dcafba00dff97d107d62c376e9ff45d3e7afbc`；5/5仅新增隔离限域CI/执行器/证据校验/37测试/中文说明，旧8Workflow、五正式Source/Issuer、业务/DDL/PDM/生产/C与旧原ref一律未改。A[独立审签](https://github.com/suzhe868-arch/mb/pull/104#issuecomment-6230657420)，[详细报告](07_重建工作区/PR104_A主控66项来源与双真实PG16受限验收及V2裁决_2026-10-17.md)。
- **真正GitHub[Run39008798385](https://github.com/suzhe868-arch/mb/actions/runs/39008798385)**：同HEAD push/attempt1 completed/success；H52原Job117326661519、K2原Job117326661370均实际Ubuntu+PG16成功，原业务H52 7/7＋7/7、K2前序18/18＋HTTPS 7/7，安全Node 37/37；官方同SHA有效Artifact 12091638973（129853B）和12091504805（94178B），有官方摘要、未独立下载ZIP重算。**原66份Job源映射全部生成，但本批实际只跑2/66，剩余64项未实跑**，不得宣称66正式验收。
- **A核官方本HEAD全仓Checks快照**：30条=25 success、4 failure、1 in_progress；3旧正式Source因为不满足本ref官方新Push而Fail Closed，原F05-7父源因无法证明全66项同SHA而Fail Closed；不能说全仓全绿。旧来源分支SHA `99c38d013f67cc56975f1664120fb87c204afc3c`未改，**`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`，旧8Workflow/66 Job不许整体触发**。
- **A明确技术裁决**：原旧ref保护、Runner/Artifact容量和预算未核准，**原生旧66批量恢复继续NO-GO，选择安全等价V2的真业务实证路线**；PR104只是V2候选（尚缺Job/Artifact/真实日志强绑定及64项实测），不签Issuer，五正式Source仍`SOURCE_GAP_OPEN/FAIL_CLOSED`，F05全域/V1/生产`NOT_READY`。
- **下一唯一主线责任B**：`NEXT_OWNER=B / NEXT_TASK=F05_7_V2_REMAINING_64_REAL_EXECUTION_AND_ISSUER_PROOF_01`；严格按[完整正式施工单](07_重建工作区/F05-7_V2余64项原业务隔离实跑与安全等价来源证据_A主控B正式施工单_2026-10-17.md)，从最新main隔离分支`feat/f05-7-v2-remaining-64-real-pg16-01`做剩余64项原业务真PG16隔离运行、V2工件签名/Job名称/日志绑定与攻击负例，至多4新增Runner、各<=40分钟、一次最终Push及官方证据；预算/并发无法硬界定则止损Fail Closed。不许重新做旧H52 0Job诊断、旧ref Push、生产动作。C [PR68](https://github.com/suzhe868-arch/mb/pull/68)继续Draft独立并行，不替代B主线。

---

# 2026-10-17｜A验收B PR102原F05-7真HTTPS业务远程PG16成功并合并；转入66项来源最终闭环工程包（本轮最新）

- **B PR102已A独立验收并标准合并**：[PR102](https://github.com/suzhe868-arch/mb/pull/102)，唯一验收B HEAD`2933d32cf375f11328251854874c7b5a5f835c4a`，合并SHA`1e454e7fcc086cec537aae9de93713fbdb4d410d`。5/5白名单仅新增单Job工作流和说明，修正已有来源证据代码，不动原`ci-job.sh`、原H52/其它7份旧Workflow、五Source/DDL/PDM/生产/C。真正GitHub[Run39006396267](https://github.com/suzhe868-arch/mb/actions/runs/39006396267) completed/success；原生Job117319652675日志证实Node **38/38**、原PG16前置 **18/18**、旧F05-7 `https.test.mjs` **7/7** 和完成标记`F05_7_NATIVE_PG16_V23_https_CI_COMPLETE`；106849B官方有效同SHA Artifact12090408632，官方SHA256摘要可核。此次是**真正原业务远程通过**，但只一条HTTPS子路径，不是66项已验收。
- **A实核同HEAD全仓CI而非只数1个Job**：当时GitHub官方29 Check Runs=24 success、3旧Source failure、2 in_progress（快照，不是永久结果）。其中旧正式Source因不符合原分支合法新Push而拒绝；不能把原Source红灯从成功中抹除，也不能让它阻止当前受限独立工程包的合规合并。旧来源分支`99c38d013f67cc56975f1664120fb87c204afc3c`仍未变化，服务器端机器保护无法核实、可见rulesets=0，因此**原8Workflow/66Job未授权执行**。
- **下一主任务正式签发给B**：[F05-7真实66项来源最终闭环施工单](07_重建工作区/F05-7_66项真实来源最终闭环与受限执行或安全等价V2_A主控B完整施工单_2026-10-17.md)，`NEXT_OWNER=B / NEXT_TASK=F05_7_66_REAL_SOURCE_FINAL_CLOSURE_01`，B只能在新分支`feat/f05-7-66-real-source-closure-01`新增真实可执行来源/资源保护和实际旧H52冻结PG16业务测试复用代码、受控低并发CI证据，接着给A**一次性的66Job原生可行性最终Go或安全等价V2方案**。任何完整旧66实际跑之前仍由A核准写入精确Source ref、资源用量/服务器保护；无法保障安全则B实装V2版本验收候选但不得自签。**不再重开历史H52 0Job诊断或模拟52 Job调查**。
- **长期安全界线不变**：五正式Source `SOURCE_GAP_OPEN/FAIL_CLOSED`，`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`；F05全域/V1/生产`NOT_READY`。F06/F07/F08-1前期受限验收记录不返工，C [PR68](https://github.com/suzhe868-arch/mb/pull/68)继续Draft并行。详细A审核与裁决见[正式报告](07_重建工作区/PR102_A主控原F05-7真业务PG16远程实测受限验收及66项最终闭环接力_2026-10-17.md)。

---

# 2026-10-17｜A独立验收B PR100完成：真实Node34/34＋隔离非特权PG16 23/23，下一步B直接远程实跑原F05-7真正业务测试（本轮最新）

- **B PR100真实代码范围A受限验收已标准合并**：[PR #100](https://github.com/suzhe868-arch/mb/pull/100)，受验唯一HEAD`5cc78c586a680b20c6a20c65ace9974776c34755`、main merge `75be5d183f6cdd7d1f2ec3a6bd631ff4f9bc0009`；7/7仅新增A授权白名单文件，旧8冻结工作流/五正式Source/DDL/生产/C零改。A独立审签[PR100审查评论](https://github.com/suzhe868-arch/mb/pull/100#issuecomment-6230032492)；原生[Run39004908729](https://github.com/suzhe868-arch/mb/actions/runs/39004908729)为最终HEAD的Push成功：Node34/34与真实非特权PG16 23/23、两项有效非空官方sha256 Artifact；这是有明确合成边界的**真实新代码和CI工程**，不是旧F05全域通过。
- **纠正B证据过度简化**：A在当时官方最终HEAD读取30 Check Runs＝25 success、3旧Source failure、2仍in_progress（快照，非永续计数）；不是B自述“同HEAD仅2条全部成功”。3旧来源红灯因当前提交不满足原签分支Push而fail-closed；两新任务Job均成功。B新snapshot把第五来源`F05-10-D1`误记为`F05-11`，且proof的用户传入模拟API JSON不应作为真正官方可信证明，这两个限定问题已列为**下一B任务强制整改**，**不向五正式Source Issuer签发新许可**。
- **真正推进原F05-7而非调查H52**：A签[下一B完整施工单](07_重建工作区/F05-7_真正原业务PG16远程单Job实跑与本地故障兜底_A主控B完整施工单_2026-10-17.md)，`NEXT_OWNER=B / NEXT_TASK=F05_7_NATIVE_REAL_REMOTE_SINGLE_JOB_01`，由B在最新main独立分支`feat/f05-7-native-real-remote-onejob-01` **实际原样运行旧F05-7 `ci-job.sh https` 的完整真实PG16业务测试一次**（GitHub本次新增最多单Job、40分钟timeout，原业务脚本零改），失败则读真实日志后Linux Docker本地复现，再由A按真实问题裁定。现有旧全仓CI自动扇出需实际记账/限次止损，不能把“只新增一个Job”说成全仓只启动一个Runner。
- **旧正式来源仍不得越权**：F05-7原ref `99c38d013f67cc56975f1664120fb87c204afc3c`未改，旧8Workflow/66PG16不可因新单触发，五正式Source仍`SOURCE_GAP_OPEN/FAIL_CLOSED`，`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`，F05最终/V1/生产`NOT_READY`。本轮是对既有原业务HTTPS一个Job远程实测，不是66全量原生父签。C [PR68](https://github.com/suzhe868-arch/mb/pull/68)仍Draft独立并行。

---

# 2026-10-17｜A终止F05-7 H52重复调查，恢复B真实CI编码＋跨域PG16工程主线（本轮最新）

- **最新正式放行**：[B真实工程施工单](07_重建工作区/F05_F08_停止H52循环与恢复B真实工程施工_A主控正式施工单_2026-10-17.md)：B在最新main建立`feat/f05-f08-bounded-real-engineering-01`，完成**可运行版本化可信来源/变更影响校验工具＋F05/F06/F07真实隔离非特权PG16跨域集成CI**，至少20项Node正反例、8项真PG16断言，新增最多2项Runner（Node 10分钟+PG16 20分钟显式timeout），末SHA日志/工件归档，交A独立验收。**不再重复H52旧失败接口/合成52Job/Actionlint历史调查。**
- **正式接力**：`NEXT_OWNER=B / NEXT_TASK=F05_F08_BOUNDED_REAL_ENGINEERING_01`；F06(PR63)、F07(PR67)、F08-1(PR69)此前受限CI合并记录保留，不重做；B可以合法施工**不依赖旧正式Source**的真实工程，不因为旧源证据红灯全部停工。A会在包尾再签旧正式Source恢复或v2新合同迁移的单独工程包。
- **旧Source安全约束仍在**：历史五Source均曾在各自原SHA真实成功，但**不同SHA不能冒充当前main父签**。旧F05-7原ref `99c38d013f67cc56975f1664120fb87c204afc3c`不准Push/快进/强推，原8Workflow/66Job/64PG16不准执行；`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`、`SOURCE_GAP_OPEN / FAIL_CLOSED`、F05最终/V1/生产`NOT_READY`，不因为此新包的有限CI成功篡改历史Issuer。
- **独立并行**：C [PR68](https://github.com/suzhe868-arch/mb/pull/68)仍Draft/未获最终功能视觉认可，不能混入B分支，也不是本轮主线。

---

# 2026-10-17｜A正式独立验收PR97：B只读取证封口合格并合并；H52旧ref恢复继续NO-GO（当前最新）

- **当前正式main**：[B PR97](https://github.com/suzhe868-arch/mb/pull/97)按最终B HEAD `ea04e6f53f486aaa5f80ead753dee53e09a235c7`受限验收，仅3份新增`audit/f05-7-post-pr94-native-closeout/**`取证文件，**未碰旧H52/8Workflow/Source/业务/DDL/C/正式状态**。A[独立审签](https://github.com/suzhe868-arch/mb/pull/97#issuecomment-6229412780)，GitHub**标准合并**`55a1ef0710f28af39adb14c6661725abea1e9aed`。详细[本次A验收及裁决](07_重建工作区/F05-7_PR97_A主控官方0Job取证封口独立验收与阶段2持续NO_GO裁决_2026-10-17.md)；**PR97代码或安全门禁“成功验收”不等于旧编排或全部CI成功**（B受验HEAD GitHub Checks=0，静态3文件PR本就未增加Runner）。
- **A自行复核官方事实**：历史[Run38958160214](https://github.com/suzhe868-arch/mb/actions/runs/38958160214) `completed/failure`、`attempt=1`、0Job；旧失败SHA `bf9c698fabff721a52154fba662dc9b230d9a319`所关联目标Check Suite `105583123217` `completed/failure`、**0 Check Run**；该commit可读13套suites/32条**其他**checks。精确GitHub自身解析错误annotation仍`BLOCKED_OFFICIAL_ROOT_CAUSE_UNKNOWN`；已验收PR94 Actionlint历史H52第34行两项schema错误**仅第三方静态证据**，当前复杂原H52新SHA实际**52Job编排仍NOT_PROVEN**。
- **保护与费用闸门**：原旧来源ref `99c38d013f67cc56975f1664120fb87c204afc3c`未改；原ref与main可见`protected=false`、可见rulesets 0，**无已核服务器端防误推机制**。8 Workflow/66Job/64 PG16服务/110 Artifact上传/3520分钟静态超时和只是风险求和，不是许可/真实账单。实际Runner并发、实际Artifact GiB和保费额/中止能力未签。五Source`SOURCE_GAP_OPEN / FAIL_CLOSED`。
- **本轮B任务已封口，不再下达重复Actionlint/合成CI探针**；A正式判定旧来源ref阶段2 `A_NO_GO_HELD_AFTER_PR97`、`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`，不许快进/Force/Push旧ref或运行旧66Job。**下一主线责任A**：`NEXT_OWNER=A / NEXT_TASK=F05_7_PHASE2_A_RESOURCE_AND_ORIGINAL_SCHEDULER_GATE_HOLD`，由A履行资源与机器保护门禁技术裁决；未证明安全条件前不自动授权B冒险执行。**不是转交C**。并行C [PR68](https://github.com/suzhe868-arch/mb/pull/68)仍Draft/视觉与真实功能未被用户确认，未合并，V1/生产`NOT_READY`。

---

# 2026-10-17｜A主控更正PR95接力错误：B仍是F05-7工程主线，C只作为并行前端轨道（当前最新）

- **更正范围**：[PR94](https://github.com/suzhe868-arch/mb/pull/94)对B的独立验收、同SHA静态证据、[PR95](https://github.com/suzhe868-arch/mb/pull/95)中的安全结论以及标准合并事实**全部保留**；错误仅在PR95后将主线`NEXT_OWNER`改为C、错误把C01 R3当下一主任务。用户要求本轮仍检查B，A确认C不是B的替代交接，现正式更正`NEXT_OWNER=B / NEXT_TASK=F05_7_POST_PR94_NATIVE_DIAGNOSTIC_CLOSEOUT_01`。
- **A新正式B工作单**：[PR94后GitHub原生故障证据封口及恢复预算只读核证](07_重建工作区/F05-7_PR94后GitHub原生故障证据封口及恢复预算只读核证_A主控正式施工单_2026-10-17.md)；从执行时最新main新建**隔离B分支**`audit/f05-7-post-pr94-native-diagnostic-01`，限只读GitHub官方接口和新增`audit/f05-7-post-pr94-native-closeout/**`中文证据，**不新增CI/不运行Runner/不变更任何旧Workflow/原旧Source分支/生产**。针对历史0Job的**官方Check Suite诊断是否可得**给一次性可复现结论和严格恢复前预算/失败停止条件，查不到即明示`BLOCKED_OFFICIAL_ROOT_CAUSE_UNKNOWN`；不复演已完成Actionlint和合成探针。达到取证/封口标准后交A再次裁决。
- **原阶段2继续正式NO-GO**：`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`；原F05-7来源ref `99c38d013f67cc56975f1664120fb87c204afc3c`不得修改、快进/Push/重试，旧8 Workflow/66 Job/64PG16仍不许运行，五Source仍FAIL-CLOSED，V1及生产NOT_READY。只有未来A独立明确签署旧ref的expected SHA、target SHA、Runner/Artifact预算及停止界限才有单独放行可能。
- **C并行状态绝不撤销**：[PR68](https://github.com/suzhe868-arch/mb/pull/68)仍Draft及`C_APP_01_R3_HOME_DETAIL_FULL_SPEC_REBASE`原正式R3施工单有效，用户旧首页/详情否决未解除；C可在独立窗口按原签发范围继续，但**C不是本轮主线`NEXT_OWNER`**。详细[接力错误更正记录](07_重建工作区/PR95主线接力误切C的A主控更正记录_2026-10-17.md)。

---

# 2026-10-17｜A独立验收并标准合并PR94：历史H52第34行Schema错误复现；当前H52零静态错，阶段2继续NO-GO（本轮最新）

- **A独立验收与合并**：[PR94](https://github.com/suzhe868-arch/mb/pull/94)受验唯一B HEAD `cb960eeb0b09dabacf43c096152a88057ae1fac9`；相对原main `2d53c138afc12d2d7593c30368f21acd28ee0f51` ahead3/behind0，严格新增4份A授权只读审计/固定Actionlint脚本与报告文件（1份8分钟1Job只读CI、3份中文审计测试），原H52/其它7冻结工作流/Source/业务/DDL/C文件全部**零修改**。A审签[PR94评论](https://github.com/suzhe868-arch/mb/pull/94#issuecomment-6229073466)，标准GitHub合并main `f08b59ff0d0875613e2679539ba2039dec867ec8`；[A独立验收与安全裁决](07_重建工作区/F05-7_PR94_A主控历史Schema错误核验与阶段2继续NO_GO裁决_2026-10-17.md)。
- **同SHA GitHub官方证据**：[Push38998693209](https://github.com/suzhe868-arch/mb/actions/runs/38998693209) completed/success；唯一真实Runner Job[117296816085](https://github.com/suzhe868-arch/mb/actions/runs/38998693209/job/117296816085)成功；A读取原生日志确认Node**10/10**、Actionlint v1.7.12固定发布SHA256校验、三版真实Blob检查。历史0Job失败H52 Blob `3a13bab79b4e45fb4e037a1d6fd4431593506148` **34:9两条syntax-check**/RC1，旧Source H52 Blob `eda68ce30bbccfa802f459e009ef0a6889918648` RC0/0，当前main H52 Blob `687a9f767b0d0b144372550735da6159066b4833` RC0/0。官方有效同HEAD [Artifact12088267552](https://github.com/suzhe868-arch/mb/actions/runs/38998693209/artifacts/12088267552) 2581B、官方digest已核，本轮**未独立下载ZIP重算**。
- **风险边界不变**：历史Actionlint静态步骤错误`HISTORICAL_SCHEMA_ERROR_REPRODUCED`，但历史GitHub 0Job官方原生Check Suite诊断仍不可得，`OFFICIAL_ROOT_CAUSE_UNKNOWN`；当前H52真实**52Job旧ref新SHA原生编排仍未证明**。8源Workflow合计66Job/64 PG16/110 Artifact上传点/3520理论Runner分钟，容量/并发/预算未封印；五`SOURCE_GAP`仍Fail Closed，原来源ref `99c38d013f67cc56975f1664120fb87c204afc3c`未更新。**`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`，不得快进/Push旧ref、启动66Job或碰生产。** 本次PR94验收**不是**F05/V1全局就绪。
- **下一正式优先责任C**：停止无实证的H52合成探针循环、B阶段2原来源恢复暂保持`A_NO_GO_HELD`（不得自动施工）；C继续原[PR68](https://github.com/suzhe868-arch/mb/pull/68) `C_APP_01_R3_HOME_DETAIL_FULL_SPEC_REBASE`，按[已签R3整包施工单](07_重建工作区/C_APP_01_首页详情功能视觉双重失配根因复盘与R3整包整改正式施工单_2026-10-16.md)完成R1+R2+R3功能/视觉/四屏截图/同SHA双端CI；最新查得PR68仍Draft、HEAD `a02ca27d2109e365c5830b641a18cfb059fe3684`、相对main待同步，**用户尚未认可新首页与详情，PR68_NO_MERGE**。下一`NEXT_OWNER=C / NEXT_TASK=C_APP_01_R3_HOME_DETAIL_FULL_SPEC_REBASE`仅表示当前优先可施工轨道；**不会解除B风险门禁或授权生产**。

---

# 2026-10-17｜A独立验收并合并PR92：原H52 0Job历史真实、66Job成本上界3520分钟；阶段2正式NO-GO（当前最新）

- **A已限定验收**：[PR92](https://github.com/suzhe868-arch/mb/pull/92)唯一B受验HEAD `4b6a934d45ef65d66a89225940fdff2b8a17c96d`，compare原正式main ahead2/behind0；5/5改动仅1份受控8分钟只读静态审计CI及4份`audit/h52-original-source-go-no-go/**`取证/代码/报告，未修改旧H52、其它8 Workflow、父Source、业务/DDL、C。A原生核验[Push38997110086](https://github.com/suzhe868-arch/mb/actions/runs/38997110086)同末SHA完成成功、唯一Runner Job117291981495成功、Node**14/14**、Git Blob八文件差分守卫、离线Ruby Psych原H52 52 Job语法可解析；[官方Artifact12087426776](https://github.com/suzhe868-arch/mb/actions/runs/38997110086/artifacts/12087426776) **1446字节/同SHA/有效/具官方摘要**。PR92自身1/1 Check成功，[A独立审签](https://github.com/suzhe868-arch/mb/pull/92#issuecomment-6228870987)及[完整验收](07_重建工作区/F05-7_PR92_A主控原H52零Job根因预算预审与阶段2NO_GO裁决_2026-10-17.md)。GitHub标准合并main SHA **`3489bad8dfc0da02784a4a7fd2337f8e487a19a8`**。
- **A正式NO-GO**：旧H52真正[Run38958160214](https://github.com/suzhe868-arch/mb/actions/runs/38958160214)是`completed/failure`且**0 Job**，失败SHA`bf9c698fabff721a52154fba662dc9b230d9a319`对应H52 Blob`3a13bab79b4e45fb4e037a1d6fd4431593506148`；当前main H52`687a9f767b0d0b144372550735da6159066b4833`为**511380B/52Job**，只读Ruby/合成探针均**不能证明**原H52在旧ref新HEAD GitHub原生编排通过；官方准确零Job解析annotation当前不可获得，`OFFICIAL_ROOT_CAUSE_UNKNOWN`。旧原来源ref SHA仍`99c38d013f67cc56975f1664120fb87c204afc3c`且为main祖先，但**祖先不是Push授权**。
- **费用/并发未闭环**：现8份F05-7旧Workflow合计**66 Job、64 PG16 service、110 Artifact上传调用点、4个未设timeout（默认360分钟）**，按各timeout直接求和的静态极限**3520 runner-minutes≈58.7 runner-hours**，不代表实际耗时/收费。未有A签定的有效并发/工件GiB/停机预算；允许66Job原ref Push风险过高，A明确签`A_OPTION_1_NO_GO_MINIMAL_H52_REPAIR`：**`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`**，原来源ref不许更新/快进/force/Push或运行旧66 PG16。五正式SOURCE GAP、C PR68真双端和视觉、V1/生产仍NOT_READY。
- **下一唯一B授权**：`NEXT_OWNER=B / NEXT_TASK=F05_7_H52_ORIGINAL_SCHEMA_MINIMAL_REPAIR_01`；按[正式施工单](07_重建工作区/F05-7_H52原文件Actionlint与零Job最小受控修复_A主控正式施工单_2026-10-17.md)，**只针对原H52离线GitHub Actions schema/Actionlint及历史0Job SHA做可重现差异定位**。只有存在`actionlint`原文件明确error及可机械验证的语义等价最小hunk时，才允许在隔离B分支定向修改**唯一原H52 YAML**并受控静态CI；没有证据则不得试错修改、交`BLOCKED_OFFICIAL_ROOT_CAUSE_UNKNOWN`给A。任何新的隔离CI不得运行旧52/66Job；阶段2仍NO-GO，独立以后再裁决。

---

# 2026-10-17｜A独立验收并标准合并PR90：合成52 Job原生完整编排51跳过+1实际Runner成功，旧F05-7来源仍待决（最新）

- **A真实验收**：[PR90](https://github.com/suzhe868-arch/mb/pull/90)唯一受验B HEAD `a401fe57ca6acc9b488990d0edb18d75ed49cf25`，compare对原main ahead1/behind0，5/5项在A授权白名单：1份只有隔离分支Push的`h52-scheduler-synthetic-52-node-graph.yml`和4份纯合成生成/测试/报告。A核GitHub官方[Push Run38994510969](https://github.com/suzhe868-arch/mb/actions/runs/38994510969)末SHA与GitHub完整`/jobs?per_page=100`，**52个Job记录=51 skipped+仅`safe-52`1 success**，Check API也51 skipped/1 success，唯一实际Runner Job`117283974828`。真Runner Node**14/14**、`GENERATOR_EXACT_MATCH`、标量`&z/*z`两次canary真实回显，官方Artifact`12085953300` 293B有效、未过期、官方SHA256摘要；无PG16/旧Source执行。A[独立审签](https://github.com/suzhe868-arch/mb/pull/90#issuecomment-6228490964)后标准合并main SHA **`856d281a9e9a753dffa3d0d0b4107f93d250a1fd`**。[详细A验收](07_重建工作区/F05-7_PR90_A主控52合成节点原生验收及旧H52剩余风险裁决_2026-10-17.md)。
- **精确限定**：PR90只证明**7165字节纯合成52节点工作流**被GitHub原生编排，51跳过**不等于51个测试通过**；旧真正H52复杂**511380B/52Job**的新内容在原旧ref上的调度、历史8Workflow/66PG16作业、五Source正式父签仍`NOT_PROVEN/SOURCE_GAP`。旧[H52故障Run38958160214](https://github.com/suzhe868-arch/mb/actions/runs/38958160214)确为0 Job/failure。原H52 Blob`687a9f767b0d0b144372550735da6159066b4833`及原来源分支SHA`99c38d013f67cc56975f1664120fb87c204afc3c`继续未改。C PR68、V1及生产亦NOT_READY。
- **下一唯一B正式单**：`NEXT_OWNER=B / NEXT_TASK=F05_7_ORIGINAL_H52_PHASE2_GO_NO_GO_READONLY_01 / A_RELEASED_FOR_B_READONLY_ORIGINAL_H52_PHASE2_DECISION_EVIDENCE_ONLY`，B不再启动合成探针循环，改按[原H52故障+阶段2一次性Go/No-Go证据施工单](07_重建工作区/F05-7_原H52故障源审计与阶段2一次性GO_NO_GO预审_A主控正式施工单_2026-10-17.md)做旧失败SHA与现H52逐字段只读取证、GitHub Actions静态兼容/Job结构解析、原66Job/8Workflow并发与工件预算和一次快进的失败停止方案；**B无权更改旧工作流或Push原ref，A另签才可执行阶段2**。五Source Fail Closed、C与生产阻断继续保留。

---

# 2026-10-17｜A独立验收并合并PR88：H52小型锚点+511380B单Job原生调度两探针通过，52Job真实调度仍阻断（最新）

- **正式受验与合并**：[PR88](https://github.com/suzhe868-arch/mb/pull/88)，唯一B末HEAD `27af908c1be212a09d886b831f1a8afbc2290779`、对正式main ahead2/behind0。仅新建A白名单6文件：2份非`f05-*`命名的无害只读探针Workflow（每份1个8分钟Runner Job），4份纯合成审计/脚本/自验报告；0旧H52/Source/业务/DDL/生产改动。A[独立审签评论](https://github.com/suzhe868-arch/mb/pull/88#issuecomment-6228256837)。同一最终HEAD四次GitHub原生 [小Push38969402047](https://github.com/suzhe868-arch/mb/actions/runs/38969402047)、[小PR38969412145](https://github.com/suzhe868-arch/mb/actions/runs/38969412145)、[大Push38969402153](https://github.com/suzhe868-arch/mb/actions/runs/38969402153)、[大PR38969412032](https://github.com/suzhe868-arch/mb/actions/runs/38969412032)**各1/1 Job success**、Node各**11/11**、GitHub`&z`+`*z`两个真实Runner steps均执行，合成大文件511380B也真实调度1Job；4份同HEAD官方非空未过期工件及摘要。PR88自身4/4检查成功。GitHub标准合并SHA **`60310c2bcc33d0f471c96c8991e822899528f3dd`**。[A完整验收与限制](07_重建工作区/F05-7_PR88_A主控单Job锚点与511380B真实编排验收裁决_2026-10-17.md)。
- **结论限定与继续阻断**：只是**单Job合成**的锚点/文件大小条件已由GitHub真正证明；不能据此宣称原冻结H52的**52Job复杂图**可原生成功解析，更不能证明旧8Workflow/66PG16来源作业及五`SOURCE_GAP`恢复。历史真实H52[Run38958160214](https://github.com/suzhe868-arch/mb/actions/runs/38958160214)仍`completed/failure`且0 Job；当前H52 Blob`687a9f767b0d0b144372550735da6159066b4833`、原F05-7来源ref SHA`99c38d013f67cc56975f1664120fb87c204afc3c`均未改；C PR68必需真实双端构建及V1/生产未就绪。
- **下一唯一B任务**：`NEXT_OWNER=B / NEXT_TASK=F05_7_H52_SYNTHETIC_52_GRAPH_SCHEDULER_DIAGNOSTIC_01 / A_RELEASED_FOR_B_SAFE_SYNTHETIC_52_GRAPH_ONE_RUNNER_ONLY`。依[新正式完整施工单](07_重建工作区/F05-7_H52合成52节点仅1Runner原生编排核证_A主控下一正式施工单_2026-10-17.md)新增隔离**合成**52 Job节点（51个Job级别永远`if:false`且**0 Runner**；1个只读轻量Runner）工作流，纯注释/echo、不触发原F05-7 ref，不运行旧PG16。核GitHub原生准确Job数量/跳过结果/历史0Job区别。**此单不是52旧作业/66原生作业或`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED`授权**，仍保持五Source FAIL-CLOSED、C和V1门禁。

---

# 2026-10-17｜A独立验收并标准合并PR86：F05-7 HTTPS真实端口冲突已修复、H52新版GitHub调度尚未证明（最新）

- **真实审核及合并**：[PR86](https://github.com/suzhe868-arch/mb/pull/86) 唯一受验 B HEAD `e57779bf21a95a69aedd1a874fdd8c5593610dab`，6/6改动仅HTTPS测试监听动态端口＋路径限制独立CI＋4个安全审计/证据文件，8份旧F05-7 Workflow、其它4 Source、业务、DDL、C都未改。A独立[签审](https://github.com/suzhe868-arch/mb/pull/86#issuecomment-6224574888)，同SHA[Push38964109049](https://github.com/suzhe868-arch/mb/actions/runs/38964109049)与[PR38964114653](https://github.com/suzhe868-arch/mb/actions/runs/38964114653)专用Jobs各**2/2成功**、Node各**12/12**、真正PG16+原完整HTTPS TLS拒绝**7/7**，故意占用原固定端口48988后仍通过。逻辑Host/Origin和安全断言原字节均保持，四件官方同SHA有效非空Artifact；GitHub标准合并SHA **`5eee392b0b833876831a0735d975b6e534f34b26`**。[A完整验收记录](07_重建工作区/F05-7_PR86_A主控HTTPS真回归验收与H52调度仍阻断裁决_2026-10-17.md)。
- **不得越界**：GitHub官方历史H52失败[Run38958160214](https://github.com/suzhe868-arch/mb/actions/runs/38958160214) **completed/failure、0Job**（较早B代码SHA `bf9c698fabff721a52154fba662dc9b230d9a319`）；当前H52原Blob `687a9f767b0d0b144372550735da6159066b4833`、**511380字节**、GitHub Workflow注册状态active、静态Ruby解析52 Job，但**原旧F05-7 ref上新版H52真实编排仍`H52_GITHUB_SCHEDULER_NOT_PROVEN`**。PR86还有旧F05 Source Fail Closed、总32 Check本轮观察27成功/4失败/1运行中，全CI未全绿；旧原F05-7 ref仍`99c38d013f67cc56975f1664120fb87c204afc3c`；未执行新66 Job，五Source缺口、C PR68真双端构建、V1生产都保留NOT_READY。
- **下一唯一B工作单**：`NEXT_OWNER=B / NEXT_TASK=F05_7_H52_SCHEDULER_ISOLATED_DIAGNOSTIC_01 / A_RELEASED_FOR_B_NON_SOURCE_ISOLATED_GITHUB_PARSER_PROBES_ONLY`，按[新正式施工单](07_重建工作区/F05-7_H52原生编排隔离无害探针_A主控下一阶段正式施工单_2026-10-17.md)在**非F05历史来源分支**建两个纯合成轻量GitHub workflow解析探针（小尺寸锚点与接近511380字节的安全大文件），每份最多1个低成本只读Job、0 PG16/旧工作流/Source，官方记录与无Job失败做对照，绝不改现有H52、原ref或运行66 Jobs；若仍不能证明真实H52调度，带明确未闭环证据交A再裁决。阶段2旧ref一次快进/Push需未来A另签精确old SHA/target SHA/66 Job成本及停止边界，此单不授该操作。

---

# 2026-10-17｜A独立验收并标准合并PR84：F05-7冻结PG16安全兼容补丁通过，旧Source及阶段2仍阻断（当前最新）

- **正式核验与合并**：A独立审查[PR84](https://github.com/suzhe868-arch/mb/pull/84)受验最终HEAD `c66b39224ee75c8f0f4e335eca2c5e8843b7cb70`，只改7份获批F05-7冻结YAML、1路径限制独立CI、4个审计/报告文件共12项，原第八份主F05-7 Workflow字节不变。GitHub同HEAD原生[Push38959514084](https://github.com/suzhe868-arch/mb/actions/runs/38959514084)与[PR38959526269](https://github.com/suzhe868-arch/mb/actions/runs/38959526269)均专用Job **2/2成功**、Node各**45/45**、Ruby解析8Workflow/66历史Job、官方七旧Blob字节安全差分、PG16 DockerHub Alpine真实隔离/非特权安全反例及4份非空官方摘要工件。62个服务镜像改为`postgres:16-alpine`＋Runner本地旧祖先别名，H52六`contents:write`收紧只读；原Source/Artifact及跨F03精确ref守卫未改。[A审核评论](https://github.com/suzhe868-arch/mb/pull/84#issuecomment-6223978936)及[完整验收报告](07_重建工作区/F05-7_PR84_A主控镜像权限安全补丁独立验收与阶段2阻断裁决_2026-10-17.md)。GitHub标准合并成功，主线SHA **`4e465f4fffb4a91d2d3a069e3a6ea67475d18d5e`**。
- **真实阻断不得混淆**：最终HEAD仍有旧F05检查未全绿，A查得32 Check=26成功/5失败/1未完成；除四个正式Source缺口外，**F05-7 HTTPS原生Job117170785651实际发生`EADDRINUSE 127.0.0.1:48988`**，与历史父签缺口不是一类失败，需独立根因整改。H52在B较早SHA曾出现GitHub 0 Job失败，最终HEAD的Ruby解析不能证明在原旧F05-7分支真正调度52 Job；该风险须额外验证。旧F05-7原ref SHA`99c38d013f67cc56975f1664120fb87c204afc3c`仍未更新，五Source`SOURCE_GAP`、C PR68必要双端构建、F05/F08全域、V1/生产均NOT_READY。
- **唯一下一B任务**：`NEXT_OWNER=B / NEXT_TASK=F05_7_PRE_PHASE2_BLOCKER_CLOSEOUT_01 / A_RELEASED_FOR_B_ISOLATED_BLOCKER_REPAIR_ONLY`，依据[正式下一施工单](07_重建工作区/F05-7_阶段2前HTTPS端口冲突及H52无Job风险闭环_A主控正式施工单_2026-10-17.md)从最新main单独新分支，优先定位并有证据修复F05-7 HTTPS固定端口冲突，在不会改业务断言的条件下获得新同SHA真实CI；隔离核证H52 YAML锚点/容量/GitHub 0 Job根因、8Workflow/66Job未来合法可调度性，不得自行重放源分支。交`READY_FOR_A_REVIEW_PHASE2_PRECHECK`由A验收。**阶段2原ref单次fast-forward Push及66 PG16 Job继续完全禁止，需之后A另签确切旧/目标SHA、预算、stop条件。**

---

# 2026-10-17｜A独立验收并合并PR82：F05-7阶段1只读预检通过；正式放行镜像与写权限最小安全治理（当前最新）

- **真实合并**：[PR82](https://github.com/suzhe868-arch/mb/pull/82) A独立审签[评论](https://github.com/suzhe868-arch/mb/pull/82#issuecomment-6223026884)，受验B HEAD `03c36c2b73b3f431b74a81a03c5562e628db6f01`，4/4仅新增只读审计白名单文件。原生[Push38953128936](https://github.com/suzhe868-arch/mb/actions/runs/38953128936)和[PR38953137971](https://github.com/suzhe868-arch/mb/actions/runs/38953137971)均Node **22/22 PASS**、各有同受验HEAD官方有效非空Artifact，A读真日志；历史8个原Push Workflow/66 Job、111 Artifact仅旧SHA历史元数据，A抽核H52 52/52 Job及97份工件；Git图旧HEAD `99c38d013f67cc56975f1664120fb87c204afc3c` 为合并前main祖先。GitHub**标准合并成功**：`65cd51d53fe58c844d2f6fab181d798702a054bc`。完整[A验收裁决](07_重建工作区/F05-7_PR82_A主控阶段1只读预检独立验收及下阶段安全裁决_2026-10-17.md)。
- **限制**：此PASS严格只属于`A_ACCEPTED_PHASE1_READ_ONLY_PREFLIGHT`。B自验Markdown首行仍保留提交前`B_PREFLIGHT_IN_PROGRESS`，以A审签及同SHA官方结果为准；不改写原B历史。PR82其它旧F05 Source失败及未完结Check不得冒称全CI通过；F05五Source`SOURCE_GAP`依然OPEN，C客户端必需真构建未在main验，V1/真实客户资金/生产`NOT_READY`。**禁止旧F05-7 ref变动、Push及66历史PG16 job启动**。
- **最新唯一B主任务**：`NEXT_OWNER=B / NEXT_TASK=F05_7_FROZEN_PG16_COMPAT_SAFETY_01 / A_RELEASED_FOR_B_SAFE_COMPAT_PR_ONLY`；按[A正式完整下一施工单](07_重建工作区/F05-7_冻结PG16镜像与权限最小兼容治理_A主控下一阶段正式施工单_2026-10-17.md)从合并后最新main起新隔离分支，逐项最小修复7份F05-7冻结Workflow依赖的ECR镜像/runner本地旧祖先名别名，评估H52六处`contents:write`及跨F03 push守卫；保留8 workflow/66 Job、安全测试和Source负例，不准原ref Push；回归证据交`READY_FOR_A_REVIEW_COMPAT_PATCH`由A复核。阶段2真实原分支单次快进Push须在兼容补丁标准合并且A再签精确expected SHA/配额后才能讨论。C PR68单列R3继续Draft/不合并。

---

# 2026-10-17｜A独立验收PR79 Stage2：F05跨窗重复触发已按范围修复，C必需构建仍未验证；B恢复F05-7只读预检（当前最新）

- **实际验收成绩**：A直接按六个不同原生GitHub HEAD再查[PR77/78/80/76/81](https://github.com/suzhe868-arch/mb/pull/79)的 **52条Workflow Run / 144条Job Check**，与B提交[PR79](https://github.com/suzhe868-arch/mb/pull/79)证据一致。旧十份F05无路径限制PR触发器经PR76安全合并后，**C-only新PR不再产生无关F05**，F05-only/shared/workflow-self/mixed正向分别产生该有的10份旧F05原生Run；五条Source仍各自真实`SOURCE_GAP`失败、无删改/伪绿。A读取五份混合PR81正式Source真日志，末证据PR79 Node**36/36通过**。 [A完整独立终验报告及安全裁决](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/CI%E8%A7%A6%E5%8F%91%E6%B2%BB%E7%90%86_Stage2_PR79_A%E4%B8%BB%E6%8E%A7%E4%BA%94%E5%9C%BA%E6%99%AF%E7%8B%AC%E7%AB%8B%E7%BB%88%E9%AA%8C_F05%E8%B7%AF%E7%94%B1%E9%AA%8C%E6%94%B6%E4%B8%8EC%E6%9E%84%E5%BB%BA%E9%9A%94%E7%A6%BB%E8%A3%81%E5%86%B3_2026-10-17.md)、[PR79 A审签评论](https://github.com/suzhe868-arch/mb/pull/79#issuecomment-6222433067)。
- **严格分域**：`A_ACCEPTED_F05_TEN_WORKFLOW_ROUTING_5_SCENARIOS`，`f05_trigger_fixed=true`**只限旧十工作流跨轨PR路由**。但`C_REQUIRED_BUILD_NOT_VERIFIED`仍OPEN：正式main没有`.github/workflows/c-app-01-build-render.yml`及C客户端应用，它们仍在用户否决视觉/功能待R3验收的C PR68，C-only探针0 Run绝不能记为C端H5/微信真构建通过；因此**整体`CI_TRIGGER_SCOPE_GOVERNANCE_FIXED`、F05父链业务全域、V1/生产均未PASS**。C责任窗口待用户验收R3之后独立合入可审真实客户端工程与CI，再补测C-only/mixed真实双端CI，不在B处无限重跑10份PG16工作流。
- **最新唯一B主任务已经正式解锁**：`NEXT_OWNER=B / NEXT_TASK=F05_7_PARENT_SOURCE_CONTROLLED_RECOVERY_01`，继续[A原签F05-7阶段1只读预检施工单](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05-7_首条正式来源链受控恢复实验_A主控完整施工单_2026-10-16.md)，核证8份Workflow/66历史PG16 Job、镜像/合法快进/配额/旧Source。**绝不可直接改旧F05-7原分支、Push或触发66作业；阶段2必须A再次审签**。其他四源仍未验收；C PR68继续独立，不混轨。
- PR77/78/80/81及仅证据PR79均为**不合并main**的非生产探针；A可在归档真SHA与官方Run后将它们关闭以消除临时PR噪声，不删源分支、不影响历史审计链接；不得把关闭PR视为业务验收。

---

# 2026-10-17｜A第三轮验收PR76：安全路径修改已Stage1标准合并，Stage2五场景真实验收交B（当前最新）

- **正式GitHub结果**：[PR76](https://github.com/suzhe868-arch/mb/pull/76) 最终HEAD`1864447f84ad65dcc0396d907f255fd7ccdafde4`；10份获批旧F05工作流每份只加`on.pull_request.paths`正向依赖过滤、0删减原push/dispatch、PG16/Source/Artifact/权限，36/36 Node真Push及同SHA官方Artifact通过。A签[分阶段技术裁决](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/CI触发治理_PR76_A主控第三轮独立验收_两阶段真实回归技术裁决_2026-10-17.md)，经GitHub标准PR merge成功，**main合并SHA `a4bcd2969fd1c01fed1711a35bade78f31d6db11`**；这仅是`A_STAGE1_STANDARD_MERGED`，**不是`CI_TRIGGER_SCOPE_GOVERNANCE_FIXED`**。
- **实际After边界**：PR76自身diff必含十份F05 Workflow，无法在合并前形成真正C-only GitHub PR；A已从新main开临时草稿[PR77](https://github.com/suzhe868-arch/mb/pull/77)单个`apps/mobile/evidence/**`无业务探针，初查0 Run/0 Check（未见旧F05误触发），但C建设工作流仍在未合并的C PR68，**不能据此证明C必要CI已通过或五场景验收通过**。[完整A验收与Stage2交接报告](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/CI%E8%A7%A6%E5%8F%91%E6%B2%BB%E7%90%86_PR76_A%E4%B8%BB%E6%8E%A7%E7%AC%AC%E4%B8%89%E8%BD%AEStage1%E6%A0%87%E5%87%86%E5%90%88%E5%B9%B6%E4%B8%8EStage2%E7%9C%9F%E5%9C%BA%E6%99%AF%E4%BA%A4%E6%8E%A5%E6%8A%A5%E5%91%8A_2026-10-17.md)。
- **最新唯一B主任务**：`NEXT_OWNER=B / NEXT_TASK=CI_TRIGGER_SCOPE_GOVERNANCE_01_STAGE2_NATIVE_AFTER`；B按预算串行完成独立真正 C-only、F05-only、shared、workflow-self、mixed 真实GitHub PR后的原生Run/Check/Job/Artifact比对，旧正式Source红灯不得伪绿；探针PR全部不得合main，B交`READY_FOR_A_REVIEW_FINAL`由A最终定夺。**F05-7历史父证据恢复仍在之后排队**，不能因为Stage1合并直接恢复老66 Job。
- C PR68首页/详情仍用户视觉功能否决未合并；F05五Source缺口、F05/F08全域、V1及生产`NOT_READY`。整改真正通过应以前后真实Runner扇出和安全门禁全部核证为准，不看队列是否短暂清零。

---

# 2026-10-16｜PR76管理员配置证据已核销，A逐文件有条件批准十项F05触发整改，当前交B（最新）

- **GitHub管理员真实截图已提供**：main首页`Your main branch isn't protected`；`Settings → Branches`显示`Classic branch protections have not been configured`；原先和本次GitHub`rulesets?includes_parents=true`均`[]`。因而A认定main当前无配置的必需Checks，之前GitHub App访问classic protection 403**只属于接口权限问题，阻断已解除**；不建议此时新建保护规则干扰本次真实CI对照。
- **A逐文件审核放行**：PR [#76](https://github.com/suzhe868-arch/mb/pull/76) 中B清单列的10份旧F05 YAML，A已逐文件从main读取并校验Git Blob **10/10相同**。在原`fix/ci-trigger-scope-governance-01`分支仅书面有条件批准给这十份文件的`on.pull_request`增加经过真实依赖审计的**正向paths过滤**；**不授权**改原Source、原branch push、workflow_dispatch、PG16、Job、Source失败逻辑、Artifact、权限或历史证据，不授权现在合并。[A完整十文件白名单和回归合同](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/CI%E8%A7%A6%E5%8F%91%E6%B2%BB%E7%90%86_PR76_%E7%AE%A1%E7%90%86%E5%91%98%E5%88%86%E6%94%AF%E4%BF%9D%E6%8A%A4%E8%AF%81%E6%8D%AE%E6%A0%B8%E9%94%80%E4%B8%8E%E5%8D%81%E9%A1%B9%E6%97%A7Workflow%E9%80%90%E6%96%87%E4%BB%B6%E6%9C%89%E6%9D%A1%E4%BB%B6%E4%BF%AE%E6%94%B9%E6%94%BE%E8%A1%8C_2026-10-16.md)；[PR76 A第二轮裁决评论](https://github.com/suzhe868-arch/mb/pull/76#issuecomment-6219415444)。
- **正式下一任务**：`NEXT_OWNER=B / NEXT_TASK=CI_TRIGGER_SCOPE_GOVERNANCE_01_IMPL_PR76`；B在**原PR76**只做获准安全触发修改、严格diff合同及真实 C-only/F05-only/shared/workflow-self/mixed 五类GitHub CI BEFORE/AFTER；应有测试必须保留、无关C代码不触发十份F05。交`READY_FOR_A_REVIEW_FINAL`后由A独立验收决定合并。**此时CI触发问题尚未修好**，PR76仍Open。
- **业务门禁保持**：五个旧F05正式来源`SOURCE_GAP`及F05/F08/V1/生产`NOT_READY`未撤销；F05-7源恢复预检仍后继排队；C PR68视觉与功能R3由C独立处理，用户未通过不合并。不存在因减少PR无关触发就令历史父签自动恢复的结论。

---

# 2026-10-16｜A主控独立审核PR76：只读预检验收通过，CI实际整改因GitHub必需检查读取403受阻（当前最新）

- **A已完成独立审核**：B PR [#76](https://github.com/suzhe868-arch/mb/pull/76) 受验最终HEAD `cfa4562a915ff29475fbd640dd9c25d847c13a55`；6/6新文件在A合法白名单、旧F05/Source/PG16/业务零修改。原生最终Push [Run38924212013](https://github.com/suzhe868-arch/mb/actions/runs/38924212013) 真实Job `117051501407` Node**28/28**、有效非空官方同SHA Artifact**12054624840**（15661B，官方SHA256元数据，未ZIP复算）。322实际Workflow文件、96 F05前缀、**10份**无PR路径限制的旧F05高风险工作流，C PR68提交此前真有10份无关F05 Run。A[正式审查评论](https://github.com/suzhe868-arch/mb/pull/76#issuecomment-6219012442)及[完整独立验收报告](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/CI%E8%A7%A6%E5%8F%91%E8%8C%83%E5%9B%B4%E6%B2%BB%E7%90%86_PR76_A%E4%B8%BB%E6%8E%A7%E7%AC%AC%E4%B8%80%E8%BD%AE%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6_%E5%BF%85%E9%9C%80%E6%A3%80%E6%9F%A5%E6%9D%83%E9%99%90%E9%98%BB%E6%96%AD%E4%B8%8E%E5%8D%81%E9%A1%B9%E5%BE%85%E6%89%B9%E8%A3%81%E5%86%B3_2026-10-16.md)均已归档。
- **明确审查结论**：`A_PREFLIGHT_ACCEPTED / A_FINAL_BLOCKED_REQUIRED_CHECKS_UNKNOWN / PR76_OPEN_NO_MERGE`。A再试官方`branches/main/protection`真实403（App不具分支保护API权限）；`rulesets=[]`不证明无经典分支保护。10份旧Source/frozen候选**0份可获正式触发器修改白名单**，未实施真实C-only/F05-only/shared/mixed After对照；CI重复触发**尚未修好**。受验PR末SHA旧Source仍真实失败，不能改绿/跳过，F05五正式父证据缺口继续OPEN。
- **当前唯一真实外部阻断与下一责任**：`NEXT_OWNER=USER / NEXT_TASK=CI_TRIGGER_SCOPE_GOVERNANCE_01_REQUIRED_CHECKS_ADMIN_EVIDENCE`：仓库管理员通过GitHub网页版`Settings → Branches`及`Settings → Rules → Rulesets`核实main的**完整Required status checks context/App来源**并提供核证证据，或合规给予当前GitHub App Administration只读权限。A获证据后逐文件签约束白名单，B**原PR76**继续最小合法配置修改和五组真实After回归，A最终再验收合并。**不需要重新施工F05业务。**
- **其他轨不变**：F05-7单源正式来源恢复预检继续排在CI治理后，绝不因现在卡权限直接启动66原生Job；C PR68首页详情仍独立R3未合并。F05/F08全域、V1、生产均NOT_READY。

---

# 2026-10-16｜A正式纠正B工作顺序：CI重复触发治理优先于F05-7来源恢复（当前最新）

- **用户真实目标**：F05出现在C前端检查列表的根因是部分旧CI将任何PR→main一并拉入F05重型检验。A先排F05-7 66项历史来源试验与此目标顺序相反。GitHub核实main原指针F05-7、独立B分支尚不存在，因此调整不会撤销已发生的施工。[完整最新A技术裁决](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/CI%E9%87%8D%E5%A4%8D%E8%A7%A6%E5%8F%91%E6%B2%BB%E7%90%86%E4%BC%98%E5%85%88%E7%BA%A7%E8%B0%83%E6%95%B4_A%E4%B8%BB%E6%8E%A7%E6%AD%A3%E5%BC%8F%E8%A3%81%E5%86%B3_2026-10-16.md)。
- **唯一当前B任务已更正**：`NEXT_OWNER=B / NEXT_TASK=CI_TRIGGER_SCOPE_GOVERNANCE_01 / A_RELEASED_FOR_B_NOW`；正式[CI触发范围治理工作单](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/CI工作流重复触发与F05跨窗口污染_A主控根因核证及定向治理正式施工单_2026-10-16.md)，从最新main开`fix/ci-trigger-scope-governance-01`。先做必要Check/冻结Source/路径矩阵清册及单独CI工具；旧Workflow须逐项A白名单后才最小修改，GitHub真实C-only/F05-only/shared/mixed验证通过才可称治理完成。
- **F05-7没有退回开发**：先前已签`F05_7_PARENT_SOURCE_CONTROLLED_RECOVERY_01`仅改为`A_SIGNED_QUEUED_AFTER_CI_TRIGGER_GOVERNANCE`；原业务已开发的事实不撤销，旧五条正式Source仍`SOURCE_GAP`，后续由A安全放行恢复；**严禁当前抢先运行66个原生PG16 Job**，不因省时篡改历史安全校验。
- **PR75事实保留**：A已标准合并[PR75](https://github.com/suzhe868-arch/mb/pull/75)（merge SHA `e1c29a4a994e70cc6c2022a22ff8bae3d153de01`），只是历史五来源核证成果。**此次更改的是正式指针和授权顺序，CI代码尚未整改完成。** C PR68继续用户否决后的R3返工不合并；F05/F08全域、V1与生产仍NOT_READY。

---

# 2026-10-16｜A正式独立验收并标准合并PR75；B下一主任务F05-7单源安全预检（当前最新）

- **PR75真实合并**：[PR75](https://github.com/suzhe868-arch/mb/pull/75) 最终受验HEAD `9e974f5c89195130c4fe4d8dfe325c7d1ef99c70`；6/6仅新增授权只读核证文件，最终Push[Run38910555545](https://github.com/suzhe868-arch/mb/actions/runs/38910555545) Node **38/38**、官方同SHA有效工件**12049464448**（11156字节、未ZIP独立复算）；五历史原Source原生日志均为**各自旧SHA**的完整成功，45工作流/348旧PG16作业为元数据候选而非新父签。A[验收评论](https://github.com/suzhe868-arch/mb/pull/75#issuecomment-6218221568)后 GitHub**标准PR合并成功** `merged:true`、主线SHA **`e1c29a4a994e70cc6c2022a22ff8bae3d153de01`**。[A完整报告](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F05_%E7%88%B6%E9%93%BE%E6%81%A2%E5%A4%8D%E5%8F%AF%E8%A1%8C%E6%80%A7_PR75_A%E4%B8%BB%E6%8E%A7%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6%E4%B8%8E%E5%90%88%E5%B9%B6_F05-7%E4%B8%8B%E4%B8%80%E9%98%B6%E6%AE%B5%E5%AE%89%E5%85%A8%E8%A3%81%E5%86%B3%E6%8A%A5%E5%91%8A_2026-10-16.md)。
- **五项正式来源缺口保持**：PR75同SHA官方Check 30=25 success/5 Source failure。A新做GitHub祖先关系证明五旧原Branch均为当时main祖先（behind0）；但旧冻结F05-7部分PG16仍引用ECR镜像与长期宽触发风险，旧Run不可当新main同SHA签名。F05业务、F08全域、V1、客户/资金、生产均`NOT_READY`；不得伪绿。
- **唯一B主下一任务已正式转移**：`NEXT_OWNER=B / NEXT_TASK=F05_7_PARENT_SOURCE_CONTROLLED_RECOVERY_01 / A_RELEASED_FOR_B_GATED_PREPARATION`。[F05-7单源受控恢复前置完整施工单](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F05-7_%E9%A6%96%E6%9D%A1%E6%AD%A3%E5%BC%8F%E6%9D%A5%E6%BA%90%E9%93%BE%E5%8F%97%E6%8E%A7%E6%81%A2%E5%A4%8D%E5%AE%9E%E9%AA%8C_A%E4%B8%BB%E6%8E%A7%E5%AE%8C%E6%95%B4%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-16.md)。B从最新main新建`feat/f05-7-parent-source-controlled-recovery-01`，一次性核实合法fast-forward、8个Workflow/66原生PG16 Job、ECR镜像兼容、权限、队列预算与SOURCE反例，交`READY_FOR_A_REVIEW_PREFLIGHT`；**本阶段禁止直接改旧原分支ref、禁止直接启动66Job、禁止触碰其他四个源**，A独立审核后另签具体新Push操作。
- **CI重复触发专项治理保留后继排队**：`CI_TRIGGER_SCOPE_GOVERNANCE_01`已签，等待F05-7前置评估审定后优先由A安排B专用批次；不得批量修改冻结F05工作流、随意改required checks或以队列=0冒称恢复。C[PR68](https://github.com/suzhe868-arch/mb/pull/68)仍Draft、用户功能视觉未接受，独立R3+G0~G5整改，禁止与B混轨。

---

# 2026-10-16｜A主控新增CI触发范围专项治理：已正式签发、尚未完成工作流修改（当前最新）

- **用户问题已确认为真实CI配置问题**：main共320份工作流文件、其中95份F05前缀（文件数≠待运行数）。旧F05冻结重验证工作流使用针对main的无路径限制`pull_request`触发器；真实C PR68（如Run38909035844）与B PR75（Run38910704810）都重复触发F05，CI风暴与F05五个正式父链`SOURCE_GAP`是**不同问题**。
- **A正式治理完整施工单**：[《CI工作流重复触发与F05跨窗口污染：根因核证及定向治理》](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/CI%E5%B7%A5%E4%BD%9C%E6%B5%81%E9%87%8D%E5%A4%8D%E8%A7%A6%E5%8F%91%E4%B8%8EF05%E8%B7%A8%E7%AA%97%E5%8F%A3%E6%B1%A1%E6%9F%93_A%E4%B8%BB%E6%8E%A7%E6%A0%B9%E5%9B%A0%E6%A0%B8%E8%AF%81%E5%8F%8A%E5%AE%9A%E5%90%91%E6%B2%BB%E7%90%86%E6%AD%A3%E5%BC%8F%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-16.md)；任务`CI_TRIGGER_SCOPE_GOVERNANCE_01`，状态`A_RELEASED_FOR_B_AFTER_CURRENT_F05_PARENT_CHAIN_RESTORE_FEASIBILITY_01 / NOT_IMPLEMENTED`。要求逐workflow真清册、PR68/PR75来源对照、变更路径×回归依赖矩阵、required checks核证、最小触发整改、取消过时CI、测试证据、A验收后标准PR合并。冻结业务来源与签名、旧父安全负例/工件不可伪绿或删改；required checks未知时严禁盲设paths导致永久Pending。
- **任务次序不变**：当前B主线仍`NEXT_OWNER=B / NEXT_TASK=F05_PARENT_CHAIN_RESTORE_FEASIBILITY_01`，完成并交A后才由A接续放行治理工程分支`fix/ci-trigger-scope-governance-01`；C PR68仍为用户否决后R3返工Draft。**签发施工单不等于CI已修好**，GitHub队列清零不代表历史F05 Source门禁通过。F05/F08全域/V1/生产继续NOT_READY。

---

# 2026-10-16｜A主控已独立验收并标准合并F05父来源只读审计PR72；正式放行父链恢复可行性单（当前最新）

- **GitHub真实事实**：PR [#72](https://github.com/suzhe868-arch/mb/pull/72) 受验HEAD `64152bdba1949fdeb5bcbbf0d54b1f4479d5a3ea`；7/7新增授权白名单文件；真实Push [Run38900276212](https://github.com/suzhe868-arch/mb/actions/runs/38900276212) Node 35/35＋真非特权隔离PG16 16/16双Job成功；两份最终同SHA非空未过期官方SHA256工件`12044759505/12045329248`，未独立ZIP复算。A独立读取源代码、最终Job及五份历史失败原生日志；[正式验收评论](https://github.com/suzhe868-arch/mb/pull/72#issuecomment-6216335471)。GitHub**标准合并成功**，`merged=true`，主线merge SHA **`bf0de40b6fda3285dc38cef17d47db7fa953ac10`**。完整[A验收报告](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_父来源只读审计_PR72_A主控独立验收标准合并报告_2026-10-16.md)。
- **边界未改变**：五个旧来源 `F05-7 / F05-8 / F05-9 / F05-10 / F05-10-D1` 仍是原生真实`SOURCE_GAP`（66/68同SHA官方父Job或原分支正式新Push缺失），不能把新审计和51个隔离断言的成功当成正式父签/旧全域绿灯。F05业务、F08全域、V1、真实第三方、客户资金、生产仍`NOT_READY / NO_PRODUCTION`，不得放宽旧SOURCE安全门禁。
- **B主线唯一下一指针**：`NEXT_OWNER=B / NEXT_TASK=F05_PARENT_CHAIN_RESTORE_FEASIBILITY_01 / A_RELEASED_FOR_B_READ_ONLY_FEASIBILITY`。正式[A完整工作单](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_五项正式父级来源链恢复可行性核证_A主控下一阶段完整施工单_2026-10-16.md)：B从最新main新建`feat/f05-parent-chain-restore-feasibility-01`，独立PR，只读核实五个原分支的原始Push/同SHA父链/Job/Artifact可达性，提交可执行恢复方案与动态证据；**未授权重跑原生66/68/70/72批Job、修改旧SOURCE或原分支Push**，必须等A独立新裁决。
- **C并行轨不变**：PR [#68](https://github.com/suzhe868-arch/mb/pull/68) 用户已否决C01首页与详情功能/视觉，仍`C_NEXT_OWNER=C / C_NEXT_TASK=C_APP_01_R3_HOME_DETAIL_FULL_SPEC_REBASE / PR68_NO_MERGE`；47项R3＋原R1/R2及常设G0～G5，未经验收不可合并。主B指针不被C覆盖。

---

# 2026-10-16｜A主控提高C窗口所有后续手机端页面质量门槛：正式常设门禁（当前最新）

- **用户要求**：不仅修复C01首页和详情，还要防止以后C02/C03、E01～E08获批施工时再次出现功能遗漏和低质页面。A已正式制定[《C手机端全页面统一产品功能交互视觉质量门禁》](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/C手机端全页面统一产品功能交互视觉质量门禁_A主控常设正式规范_2026-10-16.md)及[逐页验收契约卡TSV模板](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/手机端前端全量追踪基线/C_全部页面质量验收契约卡_统一填写模板_2026-10-16.tsv)。适用**未来经A明确放行**的C客户和E员工手机端页面、弹层、公共组件；不等于自动授权所有尚未开工页面，PC后台不自动涵盖。
- **六门禁**：G0 Final/IA/历史废弃差集→G1 A签页级完整功能/权限/状态/布局契约与C反向查漏→G2可复用的真实代码视觉token/核心模板→G3可操作UI及全合法状态/安全正反例→G4末SHA真实H5/微信CLI/320/375/390/430浏览器→G5 A**分别**验功能、交互、安全、视觉及用户关键视觉确认。C不得将“CI通过/Mock实现/无权限真实接口”说成最终产品已完成。
- **质量要求**：首屏核心业务内容突出，克制的黄灰白候选风格、文字易读、按钮约44 CSS px等效触达、合理安全区、长文本/无图/无权/加载/错误全态、素材车型匹配，无技术Mock条/假成功；同类组件共享设计标准，已被用户否决的C01旧画面不可作为模板。**维持代码优先、不强制独立Figma**。
- **当前C任务仍为**`C_APP_01_R3_HOME_DETAIL_FULL_SPEC_REBASE / PR68_NO_MERGE / USER_FUNCTION_AND_VISUAL_REJECTED`：原R1 11项、R2 8项、R3 47项与本全局门禁叠加生效；本规范只是标准签发，C修订代码和用户新版本验收尚未完成。**B唯一正式任务保持**`NEXT_OWNER=B / NEXT_TASK=F05_PARENT_PROOF_READINESS_AUDIT_01`，F05/F08/V1/生产未就绪。

---

# 2026-10-16｜A主控正式签发C01首页＋详情功能/视觉双重缺口R3整包整改（本轨优先于C原R2；B主线不变）

- **新用户裁决与根因**：用户重申A2中否决的不只是配色而是首页/详情**功能、排布、交互、素材和业务状态全面不符合原计划**。A核实原C-APP-01只放行首页+最小Mock只读详情，CI和26测试只能证明当轮既有断言通过，未建立产品规则→完整可见界面→独立用户验收的严格正反双向覆盖；A对施工粒度及前置视觉契约不足负责，C对自测与实施负责。原R1/R2继续生效。
- **正式全面整改单与47项可查清单**：[A根因复盘+R3整包施工单](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/C_APP_01_首页详情功能视觉双重失配根因复盘与R3整包整改正式施工单_2026-10-16.md)｜[47项首页/详情/跨页面功能视觉硬门禁 TSV](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/手机端前端全量追踪基线/C_APP_01_首页详情功能视觉全量差距与验收硬门禁_R3_2026-10-16.tsv)。C必须将本47条与旧54追踪、R1的11项缺口、R2的8项视觉条目逐项核对；当前正式PDM20默认**批发频道+全国**、首页无独立分享快捷按钮，只在详情微信分享，不能误恢复早期旧规划；筛选完整车型四层UI及详情顾问/档案/价格/锁车候补状态样板均在R3强制范围，**真实业务写入与G2不在本包**。
- **C并行轨接力**：`C_APP_01_R3_A_RELEASED / C_NEXT_OWNER=C / C_NEXT_TASK=C_APP_01_R3_HOME_DETAIL_FULL_SPEC_REBASE / PR68_OPEN_NO_MERGE / USER_FUNCTION_AND_VISUAL_REJECTED`。C原分支`feat/c-app-01-mobile-foundation-c01-code-first`/PR #68返工；需四屏真实H5首页详情、多身份与关键状态截图、H5＋Weapp CLI/新增测试及最终同SHA真工件，交A及用户对照验收。此为**A签发，C代码尚未整改**。
- **B任务不变**：`NEXT_OWNER=B / NEXT_TASK=F05_PARENT_PROOF_READINESS_AUDIT_01`；不得把C并行R3抢写为主B指针。F05业务、F08全域、V1、生产均未放行。

---

# 2026-10-16｜A主控独立验收并标准合并F05历史CI治理PR70；正式放行父来源缺口只读核证给B（当前最新）

- **A真实最终结论**：`F05_LEGACY_CI_GOVERNANCE_01_A_ACCEPTED_STANDARD_MERGED_CI_INFRA_ONLY / NEXT_OWNER=B / NEXT_TASK=F05_PARENT_PROOF_READINESS_AUDIT_01 / F05_BUSINESS_F08_GLOBAL_V1_NOT_READY / NO_PRODUCTION`。C并行轨用户已明确否决C01首页及详情视觉，`C_NEXT_OWNER=C / C_NEXT_TASK=C_APP_01_R2_HOME_DETAIL_VISUAL_REBASE / PR68_NO_MERGE`，必须保留该用户裁决。
- **正式GitHub合并事实**：[PR70](https://github.com/suzhe868-arch/mb/pull/70)受验HEAD `3ee47d9df08d9e73596be5db73ee623eb856e537`，标准merge返回`merged=true`、真实主线合并SHA `2b676929f36fcdf35cfca3e2956baaa0b439c245`。16个修改文件全部已授权；10份旧F05工作流28个PG16服务镜像改用官方DockerHub `postgres:16`，Runner仅本地别名兼容旧原生脚本，不改原分支Push、原生PG业务安全断言与Artifact强制上传。
- **独立验收证据**：[真实最后HEAD Push Run38852686876](https://github.com/suzhe868-arch/mb/actions/runs/38852686876) Node 50项只读治理合同＋真非特权PG16 24项隔离断言，双Job均`completed/success`，两份同SHA有效官方SHA256元数据工件 `12025268349 / 12025903246`（未ZIP复算）。最后同SHA真实Checks **30=25成功/5失败/0待定**；旧F05 **28=23成功/5失败**；五个失败都由A逐个读原生Job日志证实为`66/68同SHA正式父源证据不足`或`NOT_NEW_OFFICIAL_PUSH`，不是ECR限流。**严禁把旧五个失败伪绿或宣称已签父业务证明。**
- **保护与风险**：main branch-protection API仍403、Rulesets空，`required checks=UNKNOWN`；唯一确知本PR GitHub正常merge执行成功，不表示所有未来PR可豁免旧CI。Postgres镜像仍浮动tag未Digest固定；F05业务、F08全域、V1、生产、真实第三方、资金、正式父签仍`NOT_READY`。
- **正式A归档与新施工授权**：[A最终完整验收报告](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_历史CI治理_PR70_A主控最终独立验收标准合并与后续来源缺口正式报告_2026-10-16.md)；[F05正式父来源核证与缺口恢复前置CI专项](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_正式父级来源核证与缺口恢复前置CI专项_A主控正式完整施工单_2026-10-16.md)。B从执行时最新main开`feat/f05-parent-proof-readiness-audit-01`，只新增隔离只读审计工具/CI，不修改历史业务或正式父签流程；交`READY_FOR_A_REVIEW`再由A验收。C PR68原分支视觉重构和用户复评独立继续。

---

# 2026-10-16｜用户明确否决C01首页/C01-01详情当前视觉方案；A签发PR68原分支首页详情视觉重构正式单

- **用户原话**：“这页面设计的严重有问题吧详情页设计的也有问题这和我们最初规划的完全都不一致”。A已再次肉眼对照最后同HEAD真Chromium截图，裁决`C_APP_01_USER_VISUAL_REJECTED / A_R2_HOME_DETAIL_VISUAL_REBASE_RELEASED / PR68_NO_MERGE / C_NEXT_OWNER=C / C_NEXT_TASK=C_APP_01_R2_HOME_DETAIL_VISUAL_REBASE`，**取代之前的`USER_VISUAL_REVIEW_PENDING`，禁止将现行页面写成视觉已通过**。
- **实际偏差**：390真实首页有大面积文字MB示意Banner/64-2大统计/显式Mock场景与演示身份/多层小栏目，车辆展示首屏弱；卡片字号过小且示意图片车型错配；详情仅基础参数+Mock只读，收藏咨询锁车合法状态未作目标版式、底部过度突出分享并仅以灰色文字表示咨询/锁车。不能把`npm ci`、26单测、H5+Weapp真CLI、四宽Chromium成功当成用户审美/需求一致性PASS。**技术基座仍可保留，视觉必须重构。**
- [A正式视觉重构整改单](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/C_APP_01_用户首轮视觉否决_A主控首页与详情重构正式整改单_2026-10-16.md)｜[PR68签发评论](https://github.com/suzhe868-arch/mb/pull/68#issuecomment-6208663733)。C在原PR68原分支保留安全Mock适配器/合法默认批发频道及全国/4:3卡/七排序/价格权限、重新规划首页与**详情可见视觉骨架（不拓展真实业务授权）**，将QA身份/场景控制移出客户主视觉，纠正图片/车型错配，底部按业务呈现合法的收藏/咨询/锁车与不可用状态，不冒充业务写入；保留原R1的11项专项状态补测、54行追踪、真实最终SHA证据索引，交A及用户复评。
- **主B唯一任务不变**：`NEXT_OWNER=B / NEXT_TASK=F05_LEGACY_CI_GOVERNANCE_01_R2_FROZEN_16_SERVICE_IMAGES`，C为并行轨，PR68不合并，微信真机/真实后端/版权未签/正式支付、客户资金、生产不授权。F05业务、F08全域、V1仍NOT_READY。

---

# 2026-10-16｜A主控C并行轨PR68首轮核验：双端真构建与四屏真实截图已核证，11项专项覆盖及最终SHA索引需C定向整改

- **C并行轨裁决**：`C_APP_01_A_R1_CHANGES_REQUESTED / A_BUILD_AND_CHROMIUM_VERIFIED / USER_VISUAL_REVIEW_PENDING / C_NEXT_OWNER=C / PR68_NO_MERGE / NO_PRODUCTION`。**现行B主线NEXT_OWNER/NEXT_TASK完全不变**，B继续F05历史CI技术治理；C在原PR68原分支补证，无权修改main或B/F/PDM。
- **真源码/真CI/真图**：[PR #68](https://github.com/suzhe868-arch/mb/pull/68)唯一受验HEAD `7783c54bd78e1b5156976aab036151b0debe8618`；33个变更路径全部C-APP-01白名单，相对当前main ahead51/behind95。真正Push [Run38843332659](https://github.com/suzhe868-arch/mb/actions/runs/38843332659) 与PR [Run38843336347](https://github.com/suzhe868-arch/mb/actions/runs/38843336347) 都同SHA完成成功：npm ci、26/26 Node单测、TypeScript、Taro H5+微信CLI编译、Chromium 320/375/390/430真实截图与频道/筛选/排序/详情/返回互动均通过。A已实际下载和打开最后SHA的官方截图工件 ID12022072289（非空2384189B，官方SHA256`ac800d788d0a5422b5d8e679cfdb1cc1b2d8ca905a4eb63c4dc4c758115a522f`）；已肉眼审查390首页/列表/筛选/详情及四视口首屏；用户可开始第一轮视觉讨论。**这是Mock示意图，不代表真实JYT车源、正式商业图片、微信真机或业务API已签。**
- **A发现明确待闭环**：正式54行TSV内14项Chromium/构建、26项相关单测、**11项专项行为仍PARTIAL**（ID `013,018,029,030,034,035,037,038,039,040,041`，需真实状态/安全浏览器负例），3项真实业务/微信平台未授权明确NOT_RUN；最后SHA代码虽真实绿，但`apps/mobile/evidence/证据索引.md`、C最终自验报告及54行TSV仍引用较早`4bdfa741...`/Run38842186138/Artifact12021319721，必须改成新最终SHA同版本索引再跑。最新HEAD官方30项检查20 success/10 failure（**10项旧F05真实失败不可冒充绿**），GitHub mergeable_state=unstable/required checks未知；PR68不合并。当前390页面展示文本MB Mock Banner、演示身份条、细辅助文案，**视觉效果待用户首轮确认，不能自行改版或自称已确认**。
- **C完整R1定向整改与A技术验收**：[正式A报告](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/C_APP_01_A主控PR68首轮独立复验_双端构建已过_状态覆盖和最终证据索引整改正式报告_2026-10-16.md)｜[PR68 R1执行评论](https://github.com/suzhe868-arch/mb/pull/68#issuecomment-6208408031)。C保留原有真实构建和屏宽证据，新增11专项Chrome/负例、同期54行追踪、最终真实Push+PR工作流和有效截图工件；微信开发者工具/真机、正式Price quota/咨询/锁车/分享归属、真实API、支付、客户/资金与生产继续NOT_RUN/NOT_AUTHORIZED。C返件后交A再验，B独立主线无变化。

---

# 2026-10-16｜A核验PR70已授权12项F05 PG16镜像恢复；追加冻结5份16镜像白名单给B，暂不合并

- **正式最新裁决**：`F05_LEGACY_CI_GOVERNANCE_01_R2_A_SCOPE_EXPANSION_RELEASED / PR70_DRAFT_NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F05_LEGACY_CI_GOVERNANCE_01_R2_FROZEN_16_SERVICE_IMAGES / F05_BUSINESS_F08_GLOBAL_V1_NOT_READY / NO_PRODUCTION`。原正式施工单继续有效，新追加施工单只允许修复5份冻结revalidation Workflow内16项镜像/本地兼容别名与可验证原生测试证据，不解除冻结业务与父签来源。
- **实际B交接**：[PR70](https://github.com/suzhe868-arch/mb/pull/70)仍Draft/Open/NOT_MERGED，B头 `2ac1905cda63c3a4010de2321aef121b99a2a706`，11项变更全部原授权白名单，5份主旧Workflow共12个PG16 Job改`postgres:16`并经同一Docker容器本地tag验证成功。真实Push [Run38850885960](https://github.com/suzhe868-arch/mb/actions/runs/38850885960) 双独立Job成功，Node25项独立断言+真非特权PG16 24项，共49项CI治理工具/隔离PG测试，2份同SHA非空官方SHA256工件，**未独立ZIP复算**。旧Source真实PG回归通过后仍按非原Push拒绝签父，是正确安全行为，不计PASS。
- **真实补充范围**：A从当前main逐一核对另外5份冻结工作流的16处ECR限流镜像，旧Job仍发生`toomanyrequests: Data limit exceeded`；当前B HEAD真实30 checks=21 success/7 failure/2 in_progress，旧F05 28中19 success/7 failure/2 in_progress，禁止冒称全绿，GitHub required checks=UNKNOWN（保护查询403）。允许B原PR70原分支追加16处`postgres:16`镜像改动和纯本地Docker alias验证，完整保留16旧Job真实脚本、原签Push/PR触发、Artifact与安全门禁，CI治理工具可增28项全覆盖合同测试；**不得修改业务源码/PDM/DDL/C/生产**。
- [A完整补充施工单](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_历史CI专项_PR70冻结重验证5工作流16镜像_A主控追加技术授权施工补充单_2026-10-16.md)｜[首轮核验技术裁决](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_历史CI治理_PR70_A首轮独立核验与冻结16镜像追加白名单正式裁决_2026-10-16.md)｜[PR70 A正式评论](https://github.com/suzhe868-arch/mb/pull/70#issuecomment-6208228556)。B最后唯一新SHA须真实双Job/两工件和旧28项逐Job来源分类，补齐完整中文交接后再交A最终独立验收；在此之前**A不合并**。
- 另一并行C手机端PR68仍独立、未归入B治理；F05业务、F08全域、V1仍NOT_READY；真实客户、资金、外部服务、UAT与上线未授权。**下一责任窗口B。**

---

# 2026-10-16｜A三轮正式验收并标准合并F08-1 PR69；正式放行F05历史CI专项治理给B

- **唯一现行B主任务**：`F08_1_PR69_A_ACCEPTED_STANDARD_MERGED_CI_ONLY / F05_LEGACY_CI_GOVERNANCE_01_A_RELEASED / NEXT_OWNER=B / NEXT_TASK=F05_LEGACY_CI_GOVERNANCE_01 / F08_GLOBAL_V1_NOT_READY / NO_PRODUCTION`。C-APP-01/PR68仍属独立并行轨（C已交A核审申请但本次未审/未合并），不被B主线覆盖。
- **A实际合并**：[PR69](https://github.com/suzhe868-arch/mb/pull/69) 末HEAD `f368ed870a4d432f25eb2fb1fb3915f78a4fd720`，标准GitHub PR `merge`返回`merged=true`、真实merge SHA **`3c32c845939ce7b51dd18814e212c4bf0942aecf`**。12/12仅新增F08隔离质量工具白名单文件，无改旧F05、业务/PDM/C/生产。真Push [Run38847514793](https://github.com/suzhe868-arch/mb/actions/runs/38847514793)同SHA双独立Job success，Node101真实工具断言＋PG16非特权24真实安全测试，共125项**隔离非生产测试**；2份非空有效官方SHA256工件，**未ZIP独立复算**。可信父回执默认ISSUER_REGISTRY为空，不虚报正式父签正例。三轮A安全问题A01—A04/R2-A02均已源代码核证闭环。
- **旧F05独立现实失败**：PR69同SHA全Check最后实时30＝21 success、7 failure、2 in_progress；其中F08专项2项成功，旧F05 28项中19 success、**7 failure/2进行中**。A逐Job确认6项ECR `toomanyrequests`，1项旧来源资格`F05_9_NOT_IN_OFFICIAL_NEW_PUSH`；旧失败不能当PASS。GitHub branch-protection读取403、required checks未知；仅经本PR新的变更隔离判断并由GitHub正常merge实际通过，**没有强推/移除或覆盖要求，不是下一PR默认可豁免旧CI**。
- **正式新施工单**：[F05历史CI治理](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_历史CI失败治理_A主控非生产专项完整施工单_2026-10-16.md)：B从最新main在 `fix/f05-legacy-ci-governance-01`独立PR执行；允许安全、有限调整5份指定旧主F05工作流CI资源/触发器或新建CI审计代码；禁止改旧业务实现/DDL/冻结原生安全断言、将not applicable冒充真父证据、擅改分支保护；真实同SHA Node+PG16两Job和两工件、旧28条分类、保留原真父源限定后交A独立审核。
- **完整A报告**：[F08-1三轮验收合并与F05放行](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F08-1_A主控PR69第三轮独立验收与标准合并_F05历史CI专项放行正式报告_2026-10-16.md)；[PR69三轮A验收评论](https://github.com/suzhe868-arch/mb/pull/69#issuecomment-6207774541)。项目F08全域、F05业务全域、V1依旧`NOT_READY`；真实第三方、客户、资金、UAT、生产无授权。**下一窗口：B。**

---

# 2026-10-16｜A二轮复验F08-1 PR69：A01/A03/A04有效，A02可信父正例接口未闭环，继续交B原PR整改

- **唯一正式B下一任务**：`F08_1_PR69_A_R2_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F08_1_PR69_R2_A02_TRUSTED_PARENT_PROOF / F08_GLOBAL_V1_NOT_READY / NO_PRODUCTION`。A的二轮复验仅涉及F08-1非生产质量工具；C-APP-01 PR68保持C独立轨，不因本裁决改变其权责。
- **当前真实受验HEAD**：`c79c2932aa63f7c92ed9e10903a2f1323728a207`；PR [#69](https://github.com/suzhe868-arch/mb/pull/69)仍OPEN且未合并，11/11个新增文件仅在`engineering/f08/quality-evidence-gate-ci/**`和`.github/workflows/f08-1-*.yml`授权目录。真实同SHA [Push Run38843522723](https://github.com/suzhe868-arch/mb/actions/runs/38843522723)两Job success，Node83项独立工具测试、真非特权PG16 24项；官方同SHA两非空工件12022112170/12022481629有SHA256 metadata（**未ZIP独立复算**）。这些是107条质量工具/合成断言而非107条真实业务E2E。
- **通过项**：A01六种旧CI非成功态一律拒绝伪绿；A02覆盖矩阵拒绝五种非父正例来源，A03旧PR67/PR69历史快照和末SHA GitHub Checks只读运行期工件分离；A04本分支双原生成功Job、证据工件、白名单实测均真实。
- **R2-A02必须修复的剩余P0**：`quality.mjs:requireEvidence`仍能凭行内自称`SIGNED_PARENT_VERIFIED`、40位任意SHA、非空`run_id`及手造`observedCheck:{state:'success',sha:<匹配SHA>}`返回`eligible:true`；`tests/quality.test.mjs:Q14`目前甚至将该伪核验判定为正确。必须建立真实GitHub只读适配层/受信已完成检查绑定并禁止合成对象作为已签父业务正例；覆盖跨Run、跨SHA、非completed、伪provenance、未经真实外部核证的负例。**不能只靠Q78的纯函数自造结构证明真实来源**。详见[二轮正式报告](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F08-1_A主控PR69第二轮独立验收_可信父正例接口未闭环与旧F05十一项失败定向整改正式报告_2026-10-16.md)、[PR69正式R2整改单](https://github.com/suzhe868-arch/mb/pull/69#issuecomment-6207529903)。B仍在原分支、原PR、原白名单施工，最后新HEAD需完整真实双Job+两工件复验，B不得merge。
- **旧F05真实阻断重新分类**：最后受验SHA官方Check共**30＝19 success+11 failure**，F08-1两项均success；旧F05 **17 success+11 failure**。逐Job核实7项镜像`toomanyrequests`、4项旧来源Push或66/68项同SHA真实性门禁不足。旧F05不能伪绿或擅改冻结workflows；其专项治理在F08-1闭环后由A另发单。GitHub branch-protection读取403、`required checks=UNKNOWN`，不推断可以绕过保护。
- **安全与责任**：F08全域/V1依然`NOT_READY`；PDM、真实业务Issuer、Collector/JYT、Feishu、CDN/OSS、客户/资金、C手机端真实联调、UAT和生产均未因此解锁。**唯一下一责任窗口：B**，执行`F08_1_PR69_R2_A02_TRUSTED_PARENT_PROOF`；C并行窗口独立继续。

---

# 2026-10-16｜A独立验收F08-1 PR69未通过：证据冒充两处核心漏检，交B原PR整改（现行B主线）

- **唯一正式B主线裁决**：`F08_1_PR69_A_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F08_1_PR69_A01_A04_EVIDENCE_GATE_REMEDIATION / F08_GLOBAL_V1_NOT_READY / NO_PRODUCTION`。本次仅审查F08-1非生产质量先导；**C-APP-01/PR68保持C并行轨独立，C需继续既有npm双端构建整改**。
- **实际审查**：[PR69](https://github.com/suzhe868-arch/mb/pull/69)最后受验HEAD `28c17745e93018d03b6df2ef45be4c965f2d95a2`、compare（当时main `c82bd5ff74def4456537e8130939d5ace56d5139`）ahead15/behind6、9/9授权白名单全新增。真正Push [Run38836345416](https://github.com/suzhe868-arch/mb/actions/runs/38836345416) Node Job116766246855真实62项独立防冒充断言+1标记、真非特权PG16 Job116766247095独立24项，共86项隔离质量工具测试全过；同SHA官方工件12019577689/12019507922非空未过期有SHA256元数据，**未ZIP独立复算**。本SHA全Check实际20 success/10 failure（旧F05：7 Docker ECR限流、3旧Push/父证据门禁），**不能当30/30绿**。
- **独立发现确定性逻辑缺口**：`quality.mjs:validateLegacy`只拒绝`queued/failure/missing`伪`success_claim=YES`，遗漏`in_progress/skipped/cancelled`；`validateCoverage`只拒绝`SIGNED_PARENT_NEGATIVE_ONLY`和`CI_SYNTHETIC_ONLY`的`positive_parent=YES`，遗漏`STATIC_CONTRACT_ONLY/NOT_RUN/SOURCE_GAP`，从而可伪造父业务正例。专项绿灯不能替代对此核心漏洞的修复。
- **完整整改**：[正式A报告](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F08-1_A%E4%B8%BB%E6%8E%A7PR69%E9%A6%96%E8%BD%AE%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6_%E5%8E%86%E5%8F%B2CI%E4%B8%8E%E7%88%B6%E6%AD%A3%E4%BE%8B%E9%98%B2%E5%86%92%E5%85%85%E5%AE%9A%E5%90%91%E6%95%B4%E6%94%B9%E6%AD%A3%E5%BC%8F%E6%8A%A5%E5%91%8A_2026-10-16.md)、[PR69正式整改单评论](https://github.com/suzhe868-arch/mb/pull/69#issuecomment-6206802517)。B在原分支 `feat/f08-1-cross-domain-quality-evidence-gate-ci` 原PR69只改既定两个目录：A01六种非成功态禁止伪绿、A02五种非父正例来源禁止伪父正例、A03以最新受验SHA建立实时旧CI审计证据且将历史快照明确隔离、A04同末SHA双独立CI重跑/两工件/中文交接。**A未验收前不得merge**。
- **安全边界**：旧F05冻结工作流不可改、旧10失败不可撤销/伪绿或套用PR67旧豁免；生产、资金、第三方外部写入、真实客户、UAT仍未授权；C PR68 Draft不能当已验证双端页面。F08全域和V1继续`NOT_READY`。

---

# 2026-10-16｜C-APP-01 PR68 npm edgesOut安装阻断：A已定位高可信Arborist缺陷并正式放行C原分支整改（C平行轨）

- **C独立并行轨现行裁决**：`C_APP_01_NPM_EDGESOUT_INSTALL_BLOCKED / A_TECH_FIX_RELEASED / C_NEXT_OWNER=C / C_PR68_DRAFT_NO_MERGE / C_H5_WEAPP_CHROMIUM_SCREENSHOTS_NOT_RUN / USER_VISUAL_REVIEW_NOT_READY`。这只更新C轨；**正式B主线保持`NEXT_OWNER=B / NEXT_TASK=F08_1_CROSS_DOMAIN_QUALITY_EVIDENCE_CI_ONLY`不变**，避免A工程交接被覆盖。
- **GitHub证据**：[PR68](https://github.com/suzhe868-arch/mb/pull/68)保留Draft，原C分支最新受检HEAD `b0e538364d17111e1e596a3ff097bb66584f5019`、28/28授权白名单；[Run38833737548](https://github.com/suzhe868-arch/mb/actions/runs/38833737548)真Push失败Job`116758065390`：checkout、Node20.20.2/npm10.8.2成功，`npm install --package-lock-only`真实失败`Cannot read properties of null (reading 'edgesOut')`，后续npm ci/tsc/Taro H5/weapp/Chromium全部skipped，**锁文件及真实截图均未出现**。完整npm debug只在临时Runner上，尚无实际堆栈工件。旧离线26/26不能替代原生构建。
- **A最小技术裁决**：公开`npm/cli#8261,#9787,fix#8448`给出Arborist peer节点被detach后`edgesOut`崩溃及npm`11.6.0`首次修复证据；C保持Node20.20.2/Taro4.1.11/React18.3.1/TS5.6.3不动，先捕获脱敏debug、单独固定npm11.6做真实对照，再生成/提交`apps/mobile/customer/package-lock.json`和同版`npm ci`。不能未经复现宣称本项目唯一根因已证实，不可用`--legacy-peer-deps`虚造完整锁。
- **排队和防误触发**：A在本次核查时GitHub Actions `queued=17/in_progress=15`，含与C域无关旧F05工作流；C原CI Push/PR双事件需去重但不得取消/修改冻结旧F05 checks。`GITHUB_TOKEN` Bot补锁后的普通push可能不会自动触发新CI，须真实新head再次push或在对应ref上workflow_dispatch；最终只认最新单一C SHA的安装/原生测试/TS/H5/weapp/本地Chromium320/375/390/430真PNG和官方工件。
- **正式A施工单**：[C-APP-01 npm与原生双端构建阻断完整定向整改](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/C_APP_01_A%E4%B8%BB%E6%8E%A7PR68_npm%E4%BE%9D%E8%B5%96%E8%A7%A3%E6%9E%90%E4%B8%8E%E5%8F%8C%E7%AB%AF%E6%9E%84%E5%BB%BA%E9%98%BB%E6%96%AD%E5%AE%9A%E5%90%91%E6%95%B4%E6%94%B9%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-16.md)；[PR68正式A交接](https://github.com/suzhe868-arch/mb/pull/68#issuecomment-6206309405)。C按原PR68原分支白名单修复全包、真跑构建/截图、自查并向A交`READY_FOR_A_ENGINEERING_REVIEW_AND_USER_VISUAL_REVIEW`；**用户先验第一版视觉功能再集中改首页**。A不合并C草稿、不改变PDM与B/F08主线。正式C外部真实微信、客户、资金、JYT、飞书、UAT/生产保持不授权。

---

# 2026-10-16｜A标准合并F07-4 PR67，签发F08-1非生产跨域质量门禁，B主线继续（唯一最新）

- **正式唯一B工程主线**：`F07_4_PR67_A_ACCEPTED_STANDARD_MERGED_CI_ONLY / F08_1_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F08_1_CROSS_DOMAIN_QUALITY_EVIDENCE_CI_ONLY / F05_F06_F07_F08_GLOBAL_V1_NOT_READY / NO_PRODUCTION`。先前PR67 R2拒收单仅历史；A已结束该PR的审查与正常合并，当前主任务正式转F08-1的非生产质量先导，不表示F07全域Ready。
- **A真实合并事实**：[PR67](https://github.com/suzhe868-arch/mb/pull/67)最后受验HEAD `692e4c755e3410c569940019d042680e91f8a3fa`，A原main `7327c157f5cad88591bc9c9ac593005cfcdd09bc`，compare ahead45/behind12、9/9仅新增原授权两目录文件。GitHub标准`merge`、固定`expected_head_sha`实际返回`merged=true`；PR复查`closed/merged=true`且main真实merge SHA **`5f1e60ddd87472c7b90e230a8363db7c89a35911`**。未Force Push/改旧CI/生产操作。
- **专项真PG16及官方证据**：[Push Run38833280610](https://github.com/suzhe868-arch/mb/actions/runs/38833280610) 两非特权独立PG16 Job Source `116756623244` 92 Source+10冻结F03父负证，HTTPS `116756623541` 26个可信CA+SAN回环TLS，合计**128/128独立子例**且双Job success、真实行锁55P03及Incident清除后重判并发防重复。官方同SHA非空有效SHA256 metadata Artifacts `12018481845/12018550234`，**未ZIP独立复算**。首轮A01—A05及R2-A07源码/边界已独立查验。
- **PR67限定旧CI适用性裁决**：[A正式PR评论](https://github.com/suzhe868-arch/mb/pull/67#issuecomment-6205820963)仅认可本PR两新Push真实PG16工作流为此隔离包验收证据；受验HEAD另28个旧F05`pull_request`Job仍`queued`，**没有算PASS、没有覆盖正式required check、没有移植其它PR豁免**。GitHub RuleSets读取空；branch-protection读取受integration 403限制，故未能独立确认细节，但GitHub标准PR merge正常返回成功。28项留`A08_EXTERNAL_CHECK_PENDING`历史事实，不能推断F05整域验收通过。
- **A报告**：[F07-4 PR67三轮验收标准合并报告](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F07-4_A%E4%B8%BB%E6%8E%A7PR67%E7%AC%AC%E4%B8%89%E8%BD%AE128%E9%A1%B9PG16%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6%E6%A0%87%E5%87%86%E5%90%88%E5%B9%B6%E4%B8%8EF08%E5%89%8D%E7%BD%AE%E6%AD%A3%E5%BC%8F%E6%8A%A5%E5%91%8A_2026-10-16.md)。**新正式完整施工单**：[F08-1跨域质量门禁非生产先导](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F08-1_A%E4%B8%BB%E6%8E%A7%E8%B7%A8%E5%9F%9F%E5%B7%A5%E7%A8%8B%E8%B4%A8%E9%87%8F%E8%AF%81%E6%8D%AE%E9%97%A8%E7%A6%81%E9%9D%9E%E7%94%9F%E4%BA%A7%E6%AD%A3%E5%BC%8F%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-16.md)：B从开工最新main新分支`feat/f08-1-cross-domain-quality-evidence-gate-ci`独立PR，只准新增`engineering/f08/quality-evidence-gate-ci/**`及`.github/workflows/f08-1-*.yml`；代码化证据索引/覆盖矩阵/旧CI三态及缺口拒绝/最少40真断言、1真PG16+1独立Node Job与同HEAD两有效官方工件、中文交接后`READY_FOR_A_REVIEW`给A。F08-1只验**非生产质量基线**，**不是F08综合最终签收**；真实第三方、资金、客户、生产均不授权。
- **C手机端并行轨道保持独立**：C-APP-01/PR68依其自己真实状态由C负责，必须有Taro双端Build/真实Chromium四视口和同SHA官方证据后才可交A；A对B工程合并不意味着C已经验收。正式Notification Issuer/Feishu、JYT/Collector、CDN/OSS、正式F04/F05/F06跨域正向联通、C前端及UAT/生产均仍有`SOURCE_GAP`。整个V1`NOT_READY`。

---

# 2026-10-16｜A独立复验F07-4 PR67第二轮：Incident清除后的告警残留及旧CI排队，原B包定向整改（唯一最新B主线）

- **B轨正式唯一指针**：`F07_4_PR67_A_R2_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F07_4_PR67_R2_A07_A08_INCIDENT_CLEARED_GUARD_AND_CI_RECHECK / F05_F06_F07_V1_NOT_READY / NO_PRODUCTION`。先前F07-4首轮六项整改单现属前轮历史；首轮A01—A05的源码证据已核实，**本轮只补R2-A07/A08**，不放行F07-5或F08。
- **最新A真实复验范围**：[PR67](https://github.com/suzhe868-arch/mb/pull/67)最后HEAD `4543169f1847aa5ea5ad80578294b303e9f3538d`，main当时`083e88bcab56902804a76831d08733a9f8457610`，GitHub compare ahead38/behind6且9/9文件只新增在原`engineering/f07/notification-sla-incident-gate-ci/**`和`.github/workflows/f07-4-*.yml`，未动父源或C代码。PR仍open、未合并。
- **原生CI真实通过，不掩盖阻断**：[真Push Run38829122302](https://github.com/suzhe868-arch/mb/actions/runs/38829122302)两个真实隔离非特权PG16 Job完成success：Source`116743508589` 83业务+10签名F03负证、HTTPS`116743508266` 26真CA+SAN回环TLS，**119/119独立子例**；真双Backend+行锁55P03，最后同SHA两有效官方SHA256 metadata Artifact `12016441901/12016661437`，未下载ZIP逐字节复算。首轮A01父调用数、A02 SLA未来deadline、A03 Recovery前态、A04脱敏路由日志、A05 TLS证书验签均已有整改证据。
- **R2-A07新增真实代码缺口**：`clearIncident`只把`incident_lifecycle.status`改成`cleared`，不修改旧`event.incident_active=true`。但`dispatch`中只有`incident_recovery`查锁当前lifecycle，旧`incident_active`仅看旧event flag，导致故障真正清除后仍可在新cadence时间桶再次发送模拟Active群告警，违反PDM23“故障恢复后停止重复”。必须让active告警同事务锁/查真实CI生命周期现态并增加cleared后、伪源、clear/send两Backend竞态与恢复时间倒序原生反例；仍不创造真实上游Issuer。
- **R2-A08剩余旧CI队列**：A对本HEAD真实`check-runs`核30项 **2 success/28 queued**，另10条旧F05 PR工作流还未跑完，本次没有具体旧失败码可分类。修R2-A07后B按末HEAD完整登记最新结论；仍排队明记`A08_EXTERNAL_CHECK_PENDING`，交A下一轮判断，禁止旧PR例外复用/改旧工作流/虚报全绿。
- **正式单及交接**：[R2完整补充整改单](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F07-4_A%E4%B8%BB%E6%8E%A7PR67%E7%AC%AC%E4%BA%8C%E8%BD%AE%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6_Incident%E6%B8%85%E9%99%A4%E5%90%8E%E9%87%8D%E5%A4%8D%E5%91%8A%E8%AD%A6%E4%B8%8E%E6%97%A7CI%E9%98%9F%E5%88%97%E8%A1%A5%E5%85%85%E6%95%B4%E6%94%B9%E6%AD%A3%E5%BC%8F%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-16.md)、[PR67 A复验签字](https://github.com/suzhe868-arch/mb/pull/67#issuecomment-6205506370)。B继续原分支原PR #67，保持93 Source+26 HTTPS共119既有通过场景并增加负例，最终同SHA真实双PG16 Job/两工件/两个TSV和中文交接后签`B_SELF_TESTED/READY_FOR_A_REVIEW/NEXT_OWNER=A`。A未过验前不得合main。
- **C并行轨独立不变**：C-APP-01/PR #68仍Draft、由C继续Mock-only手机端代码，不改变其授权和目录；不能通过B整改间接把C前端宣称已完成。真实Feishu/JYT/Collector、客户/资金/图片CDN、正式Issuer、UAT/生产未授权；F05/F06/F07全域及V1仍NOT_READY。

---

# 2026-10-16｜A独立验收F07-4 PR67不通过：六项安全证据整改，B原PR继续（唯一最新B主线）

- **唯一正式B主线**：`F07_4_PR67_A_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F07_4_PR67_A01_A06_REMEDIATION_AND_NATIVE_RETEST / F05_F06_F07_V1_NOT_READY / NO_PRODUCTION`。2026-10-15既有F07-4“已放行B施工”记录作为历史；本次为同原包A正式整改，不放行F07-5/F08。
- **A验收事实**：[PR67](https://github.com/suzhe868-arch/mb/pull/67)原分支`feat/f07-4-notification-sla-incident-gate-ci`唯一受验HEAD `984f49ca6c2d6e535efc47867bc2057ac4639fc7`，main当时`1350024a0f45e71c45bb6d4512ff6b2251e3dcef`，GitHub compare `ahead28/behind0`，9/9全部为唯一两项授权路径新增文件；PR仍`open / merged=false`，**本轮未合并**。
- **原生CI真实成功**：[Push Run38822445991](https://github.com/suzhe868-arch/mb/actions/runs/38822445991) `event=push`且最终SHA一致；两非特权PostgreSQL16独立Job `116721960097` Source63＋真F03父拒绝10，`116721960429` loopback HTTPS20，总计93/93独立子例通过；真双Backend及`55P03`已见原生Job日志。官方同HEAD Artifact `12013263644/12013829112` 非空且未过期/有SHA256元数据，**未独立ZIP复算**。旧F05其他30条Check动态快照 `9 success/11 failure/3 in_progress/7 queued`，不能冒称全绿或沿用旧PR限定例外。
- **A独立发现六项需B原包闭环**：A01回环Server静态把本地deepLinkGuard计成1次真实父权限调用（事实0次）；A02 SLA超时仅判断deadline非空，未来deadline仍可Mock发送；A03 Incident恢复未验证既有active→cleared事实转移即可Mock发送；A04 `notification_log`缺接收人/路由维度，违反PDM23/原施工单；A05回环HTTPS测试禁用TLS证书验证；A06同末SHA旧工作流红灯/排队需最终逐项实核。**这代表验收证据不足，不宣称存在真实外泄或真实飞书投递**。
- **正式A完整定向整改工作单**：[F07-4 PR67六项整改](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F07-4_A%E4%B8%BB%E6%8E%A7PR67%E9%A6%96%E8%BD%AE%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6%E4%B8%8D%E9%80%9A%E8%BF%87_%E7%88%B6%E6%9D%83%E9%99%90%E8%AE%A1%E6%95%B0SLA%E8%B6%85%E6%97%B6Incident%E6%81%A2%E5%A4%8D%E4%B8%8E%E9%80%9A%E7%9F%A5%E8%B7%AF%E7%94%B1%E6%97%A5%E5%BF%97%E5%AE%9A%E5%90%91%E6%95%B4%E6%94%B9%E6%AD%A3%E5%BC%8F%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-16.md)；[PR67 A评论签字](https://github.com/suzhe868-arch/mb/pull/67#issuecomment-6204977355)。B仅继续原PR67/原分支、仅`engineering/f07/notification-sla-incident-gate-ci/**`与`.github/workflows/f07-4-*.yml`，全包修复、末HEAD同SHA双PG16 Push Job绿色/两真实工件、同步来源矩阵和中文交接，签`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`后再交A。A未验收前**B禁止合main**。
- **C手机端并行轨道完全独立**：现有`C-APP-01`代码优先授权及PR #68维持其原状态，由C自行完成、交A单独审核；本次**不修改C工作单/白名单/原前端决策/任何手机端代码**，B不能占用C分支。正式NotificationConfig/事件签名父Issuer、合法Feishu凭据及真实发送、JYT/Collector/CDN/OSS、真实客户资金、UAT/生产均未获授权，F05/F06/F07及V1全域仍`NOT_READY`。

---

# 2026-10-15｜用户确认 C 手机端代码优先并行施工，A正式签发 C-APP-01（与 B 主线并行）

- **并行 C 轨道现行 Authority**：用户确认取消单独低保真/高保真/Figma交付，改为真正可运行的前端代码、实际渲染、手机状态与自动化测试；**没有取消 PDM/IA 的正式业务规则**，也没有批准正式生产联调。
- **A已发布正式裁定与工作单**：[代码优先总裁定](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/C%E6%89%8B%E6%9C%BA%E7%AB%AF%E4%BB%A3%E7%A0%81%E4%BC%98%E5%85%88_%E5%85%A8%E9%87%8F%E5%8A%9F%E8%83%BD%E7%8A%B6%E6%80%81%E4%B8%8E%E8%B7%A8%E7%AB%AF%E9%AA%8C%E6%94%B6_A%E4%B8%BB%E6%8E%A7%E6%AD%A3%E5%BC%8F%E6%8A%80%E6%9C%AF%E8%A3%81%E5%AE%9A_2026-10-15.md)；[C-APP-01 首批正式完整施工单](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/C-APP-01_A%E4%B8%BB%E6%8E%A7%E6%89%8B%E6%9C%BA%E7%AB%AF%E4%BB%A3%E7%A0%81%E4%BC%98%E5%85%88%E5%B7%A5%E7%A8%8B%E9%AA%A8%E6%9E%B6%E4%B8%8EC01%E9%A6%96%E9%A1%B5%E7%9C%9F%E5%AE%9E%E8%BF%90%E8%A1%8C_%E9%A6%96%E6%89%B9%E6%AD%A3%E5%BC%8F%E5%AE%8C%E6%95%B4%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-15.md)。C的独立分支为 `feat/c-app-01-mobile-foundation-c01-code-first`（从真正开工最新main创建），新PR目标main；仅允许 `apps/mobile/**`、`.github/workflows/c-app-01-*.yml` 与单包 C_APP_01 对账文件；不得直接改main、B/F03～F07或PDM。
- **候选基线并非已实现**：手机端 C13+10辅助、E39+7辅助＝52主体页+17辅助入口；`07_重建工作区/手机端前端全量追踪基线/MOBILE_PAGE_STATE_BASELINE_2026-10-15.tsv`实际69行、251个**含弹层**候选状态；`MOBILE_NAV_TRACE_CANDIDATES_2026-10-15.tsv`实际151个**待核权威**导航/操作候选；Page Manifest文头140/枚举132差8仍G0 Source Gap；不得宣称全量100%完成。
- **重大并行边界不变**：**B 的正式唯一主任务独立随最新 `PROJECT_STATE.json` 推进；当前复核为 F07-4 已放行 B、`NEXT_OWNER=B`，`NEXT_TASK=F07_4_PDM23_NOTIFICATION_DND_INCIDENT_MOCK_FEISHU_PG16_CI_ONLY`，F05/F06/F07/V1仍 NOT_READY**。C仅额外独立授权隔离 Mock-only 的小程序前端工程骨架和 C01 首页/最小安全只读详情预览；不抢B任务、不称前端上线。
- **旧 H01 分支** `design/h01-design-system`仅历史参考，不在严重落后main基础上施工；新 C 交 A 的标志是 `C_CODE_IMPLEMENTED / C_MOCK_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A_FOR_C_TRACK`，A仅验收本C包，B主线状态分开记录。

---

# 2026-10-15｜A独立验收PR66标准合并，F07-4通知隔离CI正式放行（唯一最新）

- **正式唯一状态**：`F07_3_PR66_A_ACCEPTED_STANDARD_MERGED_CI_ONLY / F07_4_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F07_4_PDM23_NOTIFICATION_DND_INCIDENT_MOCK_FEISHU_PG16_CI_ONLY / F05_F06_F07_V1_NOT_READY / NO_PRODUCTION`。前次“F07-3 PR66待整改”现仅为历史；本段与同步后的JSON/正式施工单优先。
- **A真正标准合并**：[PR66](https://github.com/suzhe868-arch/mb/pull/66)最后B HEAD `53c1d1827f0de9b7d183247bac258e5adc54c585`，main审查点 `b019713508ab23274b07d676c9b361c3f87424df`，compare ahead28/behind6，9/9仅新增两授权路径。A已签[独立验收及PR66限定CI红灯裁决](https://github.com/suzhe868-arch/mb/pull/66#issuecomment-6193402343)，GitHub标准merge实际`merged=true`，复查PR真实closed/merged且main HEAD为 **`d90fcaa8e4e636668d6b0c1d07b4f2609a0f6a6c`**。
- **最终同SHA真PG16绿证**：[Push Run38738995738](https://github.com/suzhe868-arch/mb/actions/runs/38738995738)真非特权独立PG16 Source `116435526743` F03 47+F05 24、loopback TLS HTTPS `116435527495` 19，**90/90独立业务子场景且2/2 Job success**。F05父Vehicle/Cycle各100，父合法转换计数0并正式标 `F05_CONVERSION_POSITIVE_SOURCE_GAP`，真Vehicle两Backend PID 151/149行锁55P03、拒绝后父COUNT/MD5不变、合成nonce并发重放、HTTPS父权限拒绝码逐请求内审计均已核实。Source/HTTPS官方同HEAD非空未过期SHA256工件 `11974925747/11974921042` 仅元数据有效，未逐ZIP独立复算。
- **旧红灯原貌**：本SHA另10条旧F05 PR工作流真实4 success/6 failure；其中3个Docker `toomanyrequests`、3个旧冻结F05分支专属真正新Push证明失败（旧业务测试先过）。A只对**PR66的9新增隔离CI文件**作 `F07-3-PR66-A-CI-APPLICABILITY-01` 限定裁决，**没有假称全部Check绿、没有更改旧CI或绕过标准合并保护**，不能推广到下批及F05整域。
- **正式下一完整工作单已签**：`07_重建工作区/F07-4_A主控通知SLA免打扰Incident飞书路由审计_CI隔离正式完整施工单_2026-10-15.md`；B从实际最新main创建 `feat/f07-4-notification-sla-incident-gate-ci`、新PR，**只准新增** `engineering/f07/notification-sla-incident-gate-ci/**` 和 `.github/workflows/f07-4-*.yml`。依据PDM-23/25/15及原父签名边界，做通知事件allowlist、当前负责人/个人与公司飞书开关、23:00—08:30可配DND、事件重判去重/失败重试、Incident活跃/恢复、MockFeishu和安全日志/链接；至少40项Source真PG16与15项回环HTTPS，两个独立真PG16 Job、两同SHA官方工件。**禁止真实飞书/外网发送/客户/资金/生产迁移**；完成全包后B签`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`，A验收前不得合并。
- **真实缺口不变**：正式电话alias `TECH_ALIAS_PENDING_A`、F03/F05 Scope/Issuer、JYT/Collector、CDN/OSS、报告、图片、Favorite独立父正例、真实Feishu、前端/UAT/生产均未授权。F05/F06/F07全域及V1仍`NOT_READY`；A正式报告 `07_重建工作区/F07-3_A主控PR66独立验收90项PG16标准合并与F07-4通知前置正式报告_2026-10-15.md`。**下一责任B**。

---

# 2026-10-15｜A独立复验F07-3 PR66未通过，交B原PR66定向整改（唯一最新）

- **正式唯一状态**：`F07_3_PR66_A_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F07_3_PR66_A01_A05_FULL_REMEDIATION_AND_NATIVE_RETEST / F05_F06_F07_V1_NOT_READY / NO_PRODUCTION`。原「F07-3已放行B开工」变为历史，当前是同原PR66的A整改；切勿直接合并或新建F07-4/F08分支。
- **A独立复验范围**：[PR66](https://github.com/suzhe868-arch/mb/pull/66)受验唯一HEAD `394cc5d76d3e264b193982cd958daf9917e6f9d0`，原main `6fe05ba81d6f1eb1a6c6d0308a11ffc41c5ca85f`，compare `ahead16/behind0`且**9/9仅新增授权两白名单**，冻结父源/Workflow/PDM/正式迁移均未修改；**本轮无GitHub合并**。
- **确有CI绿证，但不能替代门禁完整性**：[真正Push Run38731170875](https://github.com/suzhe868-arch/mb/actions/runs/38731170875)两独立非超级用户真PG16 Jobs成功；F03 40+F05 20+TLS HTTPS 17=77/77子例成功（不含三个父suite）；真实F03/F05物理OID 20→17957及55P03/25006负例；官方两同SHA非空未过期SHA256元数据Artifact有效（**未逐ZIP独立复算**）。旧10条F05 PR工作流审核快照为2 success/7 failure/1 in_progress；有Docker`toomanyrequests`与旧源新Push资格拒绝，不作自动例外、不冒充全绿。
- **A01—A05整改阻断**：A01 HTTPS回环Server总是403并丢弃`signedRead`结果，17 HTTPS测试不能证明逐请求真父授权拒绝原因；A02 F05父转换只断言`Array.isArray(rows)`，零行亦过，缺真实Vehicle/ListingCycle不变实证；A03两PG Backend锁登录账户而非要求的Vehicle/Publisher父行；A04合成Collector nonce重放始终相同SOURCE_GAP而非真实重复识别，三固定API函数合同缺证；A05矩阵父证据分级不准、旧红灯须本PR独立记录。**这是验收覆盖不足，不宣称已经存在生产信息泄漏**。
- **已完成A职责**：A正式整改单 [`07_重建工作区/F07-3_A主控PR66首轮独立验收不通过_HTTPS判定车辆并发与来源重放定向整改正式施工单_2026-10-15.md`](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F07-3_A%E4%B8%BB%E6%8E%A7PR66%E9%A6%96%E8%BD%AE%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6%E4%B8%8D%E9%80%9A%E8%BF%87_HTTPS%E5%88%A4%E5%AE%9A%E8%BD%A6%E8%BE%86%E5%B9%B6%E5%8F%91%E4%B8%8E%E6%9D%A5%E6%BA%90%E9%87%8D%E6%94%BE%E5%AE%9A%E5%90%91%E6%95%B4%E6%94%B9%E6%AD%A3%E5%BC%8F%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-15.md)、[PR66 A正式评论](https://github.com/suzhe868-arch/mb/pull/66#issuecomment-6192079448)已写入GitHub；B只沿用`feat/f07-3-trusted-upstream-and-parent-source-gate-ci`与原PR66、仅原两条新增白名单，包内完成A01-A05/最后同SHA真PG16全量复跑/官方工件/B中文交接，再交A独立复验；**B绝不可自行merge**。
- **未解SOURCE_GAP和限制保持**：正式电话Alias`TECH_ALIAS_PENDING_A`、F03/F05跨版本与Issuer/Scope/当前对象、JYT Collector、真实CDN/OSS/报告H5、前端、UAT、资金、生产迁移及上线均未授权；F05/F06/F07与V1 **NOT_READY**，下一责任**B**。

---

# 2026-10-15｜A独立验收PR65标准合并，F07-3正式放行B执行（唯一最新）

- **最新唯一状态**：`F07_2_PR65_A_ACCEPTED_STANDARD_MERGED_CI_ONLY / F07_3_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F07_3_TRUSTED_UPSTREAM_F03_F05_SIGNED_PARENT_PHONE_IMAGE_GATE_CI_ONLY / F05_F06_F07_V1_NOT_READY / NO_PRODUCTION`。上一段“F07-2施工已放行B”现为历史，真实PR65已验收合并，不应继续重复施工。
- **A已完成标准merge**：从当时唯一main `0a976910bf5846d6266eb0b6c7943df8fe49eae9` 对[PR65](https://github.com/suzhe868-arch/mb/pull/65) B最终HEAD `6da3aef96bef06e0ae5b7e6cd3c546d92a84dcae`独立审查；`ahead46/behind0`、**12/12全部新增且全属于已签白名单**。GitHub `merge_pull_request`标准合并实际返回`merged=true`，独立复查PR`closed/merged`及main HEAD等于合并SHA **`8ff3c5b4623585a33bb8f0bc733f94939eef7493`**；[A正式验收签字](https://github.com/suzhe868-arch/mb/pull/65#issuecomment-6190886795)。
- **最后同SHA原生绿证**：[官方真正Push Run38724240811](https://github.com/suzhe868-arch/mb/actions/runs/38724240811)`completed/success`，独立真非特权PG16 Source`116386045651`、HTTPS`116386045110` **2/2 Job success**；A实际查完整原生job日志，**71业务 + 12恶意路径 + 9错误CI环境 + 1真实PG角色升级拒绝 + 20 HTTPS = 113/113独立场景全过**，真PG16版本`160015`、角色`f07_image_ci`、两PID`85/86`、行锁`55P03`、SQL`23514`回滚及Mock对象清理。两同HEAD非空未过期GitHub SHA256摘要Artifact有效（仅官方元数据，并未逐ZIP独立重算）。原历史失败Run没有隐去。
- **旧冻结红灯只作本PR限定判定**：另10条`pull_request`老F05工作流3成功/7失败，30个检查Job真实快照21 success/9 failure；9个失败为**5个ECR Docker初始化限流**与**4个旧F05自身新Push计数证明不成立**（旧源业务测试先过），不是把旧Job改绿。A仅对PR65本次12新增CI文件单独裁定`F07-2-PR65-A-CI-APPLICABILITY-01`；**不可外推至其他PR、生产、旧F05全域或bypass GitHub合并保护**，且GitHub服务端标准merge真实成功。
- **本次CI包合格≠生产已接线**：F07-2只有MockCDN/MockStorage、合成PG16 Session/Priority、合成F05转换；没有真实F03签名Session/Scope/Object、F05正式convert Issuer、JYT Collector/合法回源、真实CDN/对象存储与私有图片网关、微信/三端前端、正式DB迁移；F07-1上游电话正式敏感能力`TECH_ALIAS_PENDING_A`仍无真实业务allow，真实资金、UAT/部署均未放行。F05/F06/F07整域与V1始终**`NOT_READY`**。
- **下一正式已授权B全包**：`07_重建工作区/F07-3_A主控上游来源身份F03会话F05转换与电话图片权限集成边界_CI隔离正式完整施工单_2026-10-15.md`；B从**真实开工最新main**建新分支`feat/f07-3-trusted-upstream-and-parent-source-gate-ci`、新PR，**仅新增**`engineering/f07/trusted-upstream-parent-gate-ci/**`和`.github/workflows/f07-3-*.yml`；以PDM02/04/07/08/09 Final及真实冻结F03/F05父模块做来源/签名/当前Scope和电话图片跨域拒绝实证，最少**30真PG16 Source业务子例、12真PG16 TLS黑箱、两个独立真PG16 Job**与最后同SHA有效工件。正式未签权限Alias/Scope或父Issuer仍必须`SOURCE_GAP/DENY`，不得人造allow或真实JYT/OSS/支付。包内一次性开发、全回归、反向安全整改和中文证据归档，B签`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`再交A，B绝不自行合并main。A正式报告`07_重建工作区/F07-2_A主控PR65独立验收113项真PG16标准合并与F07-3前置审查正式报告_2026-10-15.md`。
- **责任结论**：A验收合并、文档、下一施工单均已完成；下一责任**B**。历史所有旧“当前状态/旧待办”仅追溯，服从本段顶部、同步后的PROJECT_STATE.json和F07-3工作单。

---

# 2026-10-15｜A独立验收PR64标准合并，F07-2仅隔离CI正式放行（唯一最新）

- **正式唯一状态**：`F07_1_PR64_A_ACCEPTED_STANDARD_MERGED_CI_ONLY / F07_2_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F07_2_VEHICLE_IMAGE_CDN_ASSET_DUAL_SUCCESS_REPORT_AUTH_CI_ONLY / F05_F06_F07_V1_NOT_READY / PRODUCTION_NOT_AUTHORIZED`。上一段“PR64待B定向整改”现只为旧验收历史，**不再是当前待办**。
- **A实际完成**：从当时main`f395d8e2417ed81b83d10aecbdbcaeb247e9f5bf`独立复验[PR64](https://github.com/suzhe868-arch/mb/pull/64) B最终唯一HEAD `f68a102799802dc0d18be7d2039f00b65e8de527`，16/16文件全部仅新增F07-1指定两白名单，GitHub标准merge已返回`merged=true`且PR真实closed/merged，合并SHA **`404c02c752e8bf6e4b27b8502ed4385027ff72e5`**。已签[A正式验收评论](https://github.com/suzhe868-arch/mb/pull/64#issuecomment-6188760100)。
- **A亲自核GitHub最后同SHA**：[真正Push Run38707390432](https://github.com/suzhe868-arch/mb/actions/runs/38707390432) `completed/success`，非特权真实PG16 Source与loopback HTTPS **2/2独立Job success**；Source原40例+A02数据库门禁17例+A03真实签名F03 Session拒绝7例+HTTPS15例，合计**79/79独立子场景**（4个Node父套件另外计算）。双Backend PID/txid与真PG restart证据；Source/HTTPS官方**2/2非空未过期GitHub sha256摘要Artifact**，**未下载逐ZIP重算**。A01本次两原生Job完整日志随机HMAC密钥均`***`不再明文、历史旧Run真实泄露记录保留；A02新CI环境及固定真实PG16数据库非超级用户操作前FailClosed；A03真实F03 `IsolatedAuth.withSession`和权限Reader负证通过，**电话能力技术别名`TECH_ALIAS_PENDING_A`、真正Permission/Scope/Object与生产Collector接线仍`SOURCE_GAP`，不把侧车mock身份冒充真实电话allow**。
- **额外GitHub旧红灯原样保留**：同HEAD旧F05的10个`pull_request`工作流3 success、6 failure、1 in_progress；对应9个失败Job中6个ECR Docker拉取`toomanyrequests`，另3个旧冻结Source真PG用例绿后被旧专属新Push证明拒绝。A签仅适用于本PR新增CI隔离包的`F07-1-PR64-A-CI-APPLICABILITY-01`，不宣称30/30全绿、不修改老Workflow、不泛化到下一PR；标准合并服务器实际成功。
- **A已正式签发下一B工作单**：`07_重建工作区/F07-2_A主控车辆图片路径受控CDN双成功资产化与报告权限_CI隔离正式完整施工单_2026-10-15.md`。唯一新分支`feat/f07-2-vehicle-image-cdn-asset-contract-ci`，仅**新增**`engineering/f07/vehicle-image-cdn-asset-ci/**`和`.github/workflows/f07-2-*.yml`。依PDM-08最终完整规则，从**执行时最新main**构建可销毁PG16与本机Mock CDN/对象存储/HTTPS：相对图片path+名邦受控域、首次冻结原顺序/首图Fallback、CDN HIT/MISS、双成功资产化及失败补偿/重试、合法转换不回滚、3A未闭环临时过渡、报告相册隔离、旧URL每次当前权限重检；**至少35个真PG16 Source子场景、12个HTTPS黑箱子场景、2个独立真PG16 Job且全部最终HEAD官方工件**，完整开发/自验/整改/归档后`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`交A。
- **明确不放行**：真实JYT/Collector、CDN或对象存储、真实车辆图片/客户信息、生产F03权限Alias/Scope、真实资金、正式数据库迁移或生产API、UI/微信端发布、UAT、F08、V1上线。**F05/F06/F07整域与V1仍`NOT_READY`**。本轮A报告：`07_重建工作区/F07-1_A主控PR64三项安全整改79项真PG16独立验收标准合并及F07-2前置正式报告_2026-10-15.md`。下方所有旧“当前/唯一最新”仅历史追溯，必须服从本页顶部、JSON和新施工单。

---

# 2026-10-15｜A独立复验F07-1 PR64未通过，正式交B定向整改（唯一最新）

- **唯一现行状态**：`F07_1_PR64_A_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F07_1_PR64_SECURITY_REMEDIATION_A01_A02_A03_AND_FULL_NATIVE_RETEST / F05_F06_F07_V1_NOT_READY / PRODUCTION_DENIED`。正式main继续保持PR64未合并。A审查B HEAD `b3765e44741b22830213ea5e4363161ac46b8a03`、[PR64](https://github.com/suzhe868-arch/mb/pull/64)、13/13授权白名单文件及现行F07-1完整施工单；不是根据B自验报告直接通过。
- **已独立核实真实原生绿证但不能抵消安全硬阻断**：[GitHub Run38702610526](https://github.com/suzhe868-arch/mb/actions/runs/38702610526)为本SHA真正Push且成功，PG16 Source40/40业务子用例、HTTPS15/15业务子用例（Node父Suite另各1），两项PG16 Job均success；2份同SHA非空、未过期且有效GitHub官方SHA256摘要工件，未逐ZIP字节复算；真实非超级用户PG16、行锁/回滚及重启后的缓存保护均有日志。另10个旧`pull_request`事件审查时3成功/5失败/2仍执行中，保留红证、不当作当前本包2个Push的绿证。
- **A三项定向阻断**：`A01 P0` 官方Source/HTTPS Job原始日志实际打印本Run新生成的`F07_COLLECTOR_TEST_SECRET`**明文鉴权密钥**，违背不记录签名凭据的硬规则；`A02 P0` 新`contract.mjs` 的`bootstrap/reset/seed`缺真实CI repo/ref/event/非特权固定PG16环境门禁，错误`DATABASE_URL`可使测试DDL/TRUNCATE在未验环境执行；`A03 P1` F03`policy.mjs`只是纯合成facts策略函数，新增`f07_phone.sessions/employees/scope`并非已签真实F03会话的原生PG认证证据。上述不可借全绿测试越过。
- **A已签完整整改单**：`07_重建工作区/F07-1_A主控PR64首轮安全复验不通过_密钥日志隔离门禁与F03签名会话定向整改正式施工单_2026-10-15.md`，并在[PR64正式评审评论](https://github.com/suzhe868-arch/mb/pull/64#issuecomment-6187648993)记录逐项安全证据。B只沿用`feat/f07-1-collector-publisher-phone-callback-ci`及原PR64，**仅在原两条白名单内修复**，保留原40/15业务子用例，再补随机HMAC密钥GitHub日志mask、错误环境及PG16物理身份的零写入FailClosed负例、真正F03签名会话/Permission/Scope来源实证（无法合法连父接口则SOURCE_GAP连同真拒证据交A），完整重跑最终唯一SHA GitHub官方2项PG16 Job/2工件，更新中文B交接，签`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。B仍不得自行合并、改父源或扩大DDL。
- **上线与后续**：正式Collector/JYT/Integration接线、生产密钥/真实号码、实际资金、UI、F07-2图片、F08总验收及V1上线均**未放行**。旧PR62 CI-only验收结果不变，本次PR64**未合并**；下文旧F07-1“施工中”仅为历史。

---

# 2026-10-15｜A完成F06-5C PR62标准合并；F07-1正式施工放行（当前唯一）

**新唯一状态：** `A_ACCEPTED_MERGED_PR62_CI_ONLY / A_RELEASED_FOR_B_F07_1_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F07_1_COLLECTOR_TO_INTEGRATION_PUBLISHER_PHONE_CALLBACK_CACHE_SCOPE_CI_ONLY / F05_F06_F07_V1_NOT_READY / PRODUCTION_DENIED`。

1. **A实质完成**：审查[PR62](https://github.com/suzhe868-arch/mb/pull/62)唯一B受验HEAD `e2c153996f73e46ee35e4cfe6dee21f4583b712b`、43个授权CI新增文件；逐Run核GitHub真正Push工作流**22/22 success**、真实PG16 **96/96 Jobs success**（H52 **52/52**）及官方**96/96有效SHA256元数据工件**。核心Source原生**92/92**、HTTPS**9/9**，S84/85/86和R01/R03验签、父190表和24Ledger、两PG OID`68461→73512`真实日志通过；只证隔离CI，不证真实资金和生产功能。A通过GitHub**标准merge**成功，PR62真实合并SHA **`e54872b3f92cd66b3b51bd5465670e0d6e7de3c1`**。A报告`07_重建工作区/F06-5C_A主控PR62独立验收96项真PG16标准合并与F07前置分阶段放行正式报告_2026-10-15.md`。
2. **独立范围红灯裁决**：同SHA旧冻结`pull_request`有2项成功、7项失败、1项执行中；失败来自旧父指定Push证明和ECR Docker拉取限流，不声称全部Checks绿。A签`F06-5C-PR62-A-CI-APPLICABILITY-01`仅对该PR旧父重复事件不适用，保留红灯：[正式签字](https://github.com/suzhe868-arch/mb/pull/62#issuecomment-6186748123)。原PG1兼容`process.env.GITHUB_REF`桥只接受隔离测试用途，**生产不得使用全局REF替换作为权限或真实性证据**。F05/F06/F07/V1整域仍`NOT_READY`。
3. **当前正式唯一待执行项——B**：`07_重建工作区/F07-1_A主控Collector发布人电话安全回传与缓存权限合同_CI隔离正式完整施工单_2026-10-15.md`。B从**最新main**建立`feat/f07-1-collector-publisher-phone-callback-ci`和PR；**仅新增**`engineering/f07/collector-publisher-phone-callback-ci/**`、`.github/workflows/f07-1-*.yml`；真实隔离PG16 Source ≥25安全/并发断言、HTTPS ≥9、至少2项新PG16真Job + 同SHA官方工件。依PDM-09：Collector→名邦Backend Integration回传、缓存身份`source_platform+upstream_publisher_id`、缓存命中/latest/invalid保留旧号、签名回传、重放和并发、当前Employee敏感能力/data scope/source_type权限。旧`car_code`电话键、独立`can_call_wholesale_phone`和名邦直接向Collector取JYT号码一律禁止。只能合成回传/loopback，不连接真实JYT/真实客户/生产凭据；旧资金和前端未授权。
4. **退出**：B在这个包内部连续完成研发、静态/原生测试、安全复审、全部CI、证据归档与自验，最后`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`交回A。A独立验收前B不得合并；F07及V1不能判READY。下方旧“PR62待验/PR63后接入”仅历史。

---

# 2026-10-15｜A独立验收PR63标准合并，正式放行PR62对接已签PG1与C01—C03原生复验（唯一最新）

- **唯一主线指针**：`A_ACCEPTED_MERGED_PR63_CI_ONLY / A_RELEASED_FOR_B_PR62_PG1_INTEGRATION / NEXT_OWNER=B / NEXT_TASK=F06_5C_PR62_PG1_SIGNED_INTEGRATION_C01_C03_FULL_NATIVE_REGRESSION_AND_FINAL_HANDOFF / PR62_NOT_MERGED / F05_F06_V1_NOT_READY`。A受验B最新PG1 HEAD `82b30bde92291a444372f3c1627e41469fba4586`、主线审查点 `bcb5b4e8fe5442b255344840f2a6fe00ddfcd022`；实际按标准GitHub [PR63](https://github.com/suzhe868-arch/mb/pull/63)合并成功，GitHub返回 `merged=true`，**合并提交 `a8dfb9f1e78bbab4f194dbeed3076bd8c33eddad`**。A[独立验收评论](https://github.com/suzhe868-arch/mb/pull/63#issuecomment-6184723787)已归档，限 `A_ACCEPTED_CI_ONLY`，不代表F05/F06/V1整域READY。
- **A直接证据**：PR63 22/22仅新增授权PG1白名单；真实同HEAD PG16 Source [38682645219](https://github.com/suzhe868-arch/mb/actions/runs/38682645219)与HTTPS [38682645123](https://github.com/suzhe868-arch/mb/actions/runs/38682645123)、静态 [38682645218](https://github.com/suzhe868-arch/mb/actions/runs/38682645218)均 `completed/success`。C01真候补取消零插队、C02/C03假取消COMMIT拒绝23514、R01合法唯一自动新Priority、4A/4B→4C权限与资金拒绝、两物理OID `68461→73477`、190父表全行COUNT/MD5、24 Ledger与精确两Trigger一Constraint追加签名真实核实；Source/HTTPS官方非空SHA256工件11,630/6,468字节。
- **实有不绿继续保留**：旧F05跨分支指定Push证明按`F06-5C-PG1-A-CI-APPLICABILITY-01`仅对PR63独立包归类 `LEGACY_CROSS_BRANCH_NOT_APPLICABLE_WITH_ACTUAL_RED_PRESERVED`；另外3个旧重复Job真实因ECR Docker镜像 `toomanyrequests` 在初始化阶段失败，同SHA其它同类父回归成功；审查时另1旧Source还运行中。**绝不称“所有31 Checks全绿”**、也不将PR63本轮例外自动延伸至原PR62。
- **新正式施工单已签**：`07_重建工作区/F06-5C_A主控PR63合并后PR62版本化对接与C01至C03全量原生复验正式施工单_2026-10-15.md`。原[PR62](https://github.com/suzhe868-arch/mb/pull/62)仍open/unmerged，分支 `feat/f06-5c-transaction-priority-admission-ci`，B须从最新main普通非破坏性合并已签PG1，改造仅原5C白名单内版本化Catalog与安全v2入口，保持旧父FailClosed；让PR62自身原S84—S86真JYT/候补/无签取消/未知退款完整安全负例真正转绿，R01/4C/权限/双Backend和22真正Push/96真实PG16 Job/H52、官方工件全部最终同SHA再交A。不得强推/改原PG1或冻结父、删弱失败断言。
- **A完整验收记录**：`07_重建工作区/F06-5C-PG1_A主控PR63独立验收合并与PR62后续放行正式报告_2026-10-15.md`。PR62本轮尚未A接受、尚未合并；F05/F06整域与V1仍`NOT_READY`，生产资金、真实第三方/客户、UAT、F07/F08及上线未放行。**NEXT_OWNER=B**。

---

# 2026-10-15｜A核验PR63同SHA PG1真PG16三项绿证，裁定旧父跨分支Push证明不适用，放行B最终交接（唯一最新）

- **唯一正式指针**：`A_TECH_RULING_SCOPED_CI_APPLICABILITY / A_RELEASED_FOR_B_FINAL_HANDOFF / NEXT_OWNER=B / NEXT_TASK=F06_5C_PG1_PR63_SCOPED_NATIVE_EVIDENCE_FINAL_HANDOFF_AND_REVIEW_REQUEST / PR63_DRAFT_NOT_MERGED / PR62_BLOCKED / F05_F06_V1_NOT_READY`。
- **A直接核验**：main审查点 `a25fff7ccd0b79e87038330f6b783edd93071ab5`；[PR63](https://github.com/suzhe868-arch/mb/pull/63) HEAD `34e2b11212d59b06514917b54961b669411ef44f`，21/21文件仅授权新PG1目录，ahead95/behind6；同HEAD [真PG16 Source Run38673920782](https://github.com/suzhe868-arch/mb/actions/runs/38673920782)、[HTTPS Run38673920756](https://github.com/suzhe868-arch/mb/actions/runs/38673920756)、[静态Run38673920745](https://github.com/suzhe868-arch/mb/actions/runs/38673920745)均success。官方原生日志含C01—C03/R01等总门禁、独立OID 68445→73461、190旧父表与24 Ledger Seal；Source/HTTPS非空官方SHA256工件10368/6477 bytes，**A未逐字节复算工件、尚未终验源码**。
- **真实红灯继续保留**：同HEAD旧父 F05-7、F05-8、F05-9、F05-10、D1 五个 Source Job 实际 `failure`，A直接核实其最终失败因旧版指定分支/Workflow的官方新Push聚合证明在PG1修复分支不可达；不得称“全部31检查全绿”或“F05域全绿”。A**限定技术裁决** `F06-5C-PG1-A-CI-APPLICABILITY-01`：仅将这五项旧聚合Push资格在 PR63 独立CI-only包标记 `LEGACY_CROSS_BRANCH_NOT_APPLICABLE_WITH_ACTUAL_RED_PRESERVED`，不改冻结源码、不伪造结果、不降低C01—C03/正向4A/4C/资金与物理证据。
- **正式整改单已归档**：`07_重建工作区/F06-5C-PG1_A主控PR63旧父Push证明跨分支不适用_限定范围验收门禁技术裁决与B交接整改单_2026-10-15.md`。B在同PR63/同分支补逐场景日志/业务SQL行/角色/签名/两Backend/COMMIT/工件映射及最终完整中文自验交接；只有真实完备才能标 `B_SELF_TESTED / READY_FOR_A_REVIEW`，A届时独立源码/证据审查、核GitHub合并限制后才决定是否标准PR合并。本轮**不批准合并PR63/PR62**。F05/F06/V1仍 `NOT_READY`，生产、真实资金、UAT、F07/F08均未授权。**NEXT_OWNER=B**。

---

## 2026-10-15｜A工程技术裁决：PR63 新增触发器与原固定Catalog签名不兼容，仅CI包内允许版本化验签及安全取消等价入口

- **裁决号**：`F06-5C-PG1-A-TECH-CATALOG-01`；**性质**：既有PDM-13/18/19下的工程兼容技术裁决，**非新增业务规则、不更改产品Authority**。A独立审阅PR [#63](https://github.com/suzhe868-arch/mb/pull/63) HEAD `f0e159bbdbffca516b6ddd7c14052f882e3df57e`，真实官方[PG16 Run38648121814](https://github.com/suzhe868-arch/mb/actions/runs/38648121814) Job116139958565 `completed/failure`，旧5B物理188表及升级后的PG1前190旧表封印有效，但新增两个public Trigger/一个constraint使冻结父`getPublicStructure`与各级`verify`固定旧SHA不匹配，旧父报`F05_10_CATALOG_DRIFT`。真实兼容阻断确认，**不等于原PR62 C01—C03安全漏洞已修复**。
- **裁决结果**：沿用原PR63/分支且维持draft/RED，B仅在原PG1新增白名单构建**有签版本化Catalog精确差分验证器**及**原4A/4C业务合同等价的新CI-only安全取消入口**；新增公共Catalog仅签名精确已知2 Trigger+1 Constraint，无旧对象篡改/删除；对旧基础结构进行逻辑投影比对，再逐个对新对象及旧Ledger/父业务签名验真；原冻结服务/迁移及旧哈希常量绝不改，未修改的旧4A/4C验签遇新增Catalog继续FailClosed，新版调用必须实测业务权限、原子签名、合法取消/Waitlist/Refund保障。不得混称旧原版在新Catalog后仍直接可用。
- **包内授权单**：`07_重建工作区/F06-5C-PG1_A主控PR63父签名兼容阻断_版本化目录验签与安全取消入口补充施工单_2026-10-15.md`；B针对C01、C02、C03、合法R01及移交后4C、事务末触发器、两真实PG Backend并发、资金与权限负例、190父表双OID、同SHA完整CI自行一次性补证整改。无法用新目录忠实实现合法等价入口时，应提交真日志与精确最小例外供A另裁，**不授权B更改已冻结旧父文件**。通过所有门禁后才有资格`READY_FOR_A_REVIEW`，A独立验收后才能标准PR merge，随后才继续PR62；F05/F06/V1 `NOT_READY`、生产/资金/UAT/F07/F08仍禁止。
- **执行指针**：`A_TECH_RULING_PR63_SIGNED_CATALOG_COMPATIBILITY / A_RELEASED_FOR_B_PG1_VERSIONED_DELTA_AND_SAFE_CANCEL_ADAPTER / NEXT_OWNER=B / NEXT_TASK=F06_5C_PG1_PR63_VERSIONED_CATALOG_AND_CANCEL_EQUIVALENCE_REPAIR / PR63_PR62_NOT_MERGED`。

---

# 2026-10-15｜A第四轮复验PR62：确认F05-8父自动Issuer真实跨域3项红证，放行独立F06-5C-PG1父层CI版本化补丁（唯一最新）

- **当前唯一正式指针**：`A_REVIEW_CONFIRMED_F06_5C_PARENT_AUTO_ISSUER_SECURITY_RED / A_RELEASED_FOR_B_F06_5C_PG1_PARENT_AUTO_ISSUER_SIGNED_CI_GUARD / NEXT_OWNER=B / NEXT_TASK=F06_5C_PG1_NEW_BRANCH_NEW_PR_SIGNED_UPSTREAM_GATE_REPAIR / PR62_BLOCKED_UPSTREAM_NOT_MERGED / F05_F06_V1_NOT_READY`。A受验最新main `2c185a59eac7d06102329ec8c7afad30179b3889`；PR62报告HEAD `f3fe4bf39f2c28f62f598cfcd9f24f90fe3e2b61`，实际原生红证代码SHA `96ce3c725d6279a9a67b1fbdef46e1f113454cfa`；PR62 38/38变更仅现行授权独立CI目录，未动父/24签迁移，不合并。
- **独立证实安全失败**：官方F06-5C真实非特权PG16 [Run38641938789](https://github.com/suzhe868-arch/mb/actions/runs/38641938789)，Source Job116119360131 `88项/85 pass/3 fail`、HTTPS Job116119359691成功。C01原真JYT high Match+签名有效Waitlist+5B交易→4A合法Cancel，冻结F05-8触发器却创建Priority12，突破候补；C02仅伪public取消、无4A/4C原签时同PG Savepoint生成Priority8；C03未知pending退款+伪public取消同Savepoint生成Priority9。C02/C03均回滚，不是已提交线上事件。**本轮必须保持RED，不能用旧HEAD 22/96全绿掩盖。**
- **A技术裁决**：风险根源在旧`000024_priority_ci.sql`自动父源写入位置，5C下游无法阻止提前发生的父INSERT。**不改旧v24签名文件、不回写原24 Ledger**；在原PG原子发行边界，以新追加版本化**CI-only Sidecar/触发器+可信终态时序**补签名Waitlist/3B/5B/4A/4B/4C/退款全链Guard。尤其原4A/4C实际是先更新public status、再写合法cancel origins/events/request key，须正确处理事务内临时不完整、只在完整可信源后合法签发；不能错误拒绝4A合法取消。原R01无候补且全签合法自动唯一Priority裁决继续成立。原190父表与24 Ledger升级前原封印，升级后只准精确审计签名白名单对象增量与旧业务历史不变；不能冒充新版Catalog与旧版全字节相同。
- **完整独立新工程单已正式签发**：`07_重建工作区/F06-5C-PG1_A主控冻结F05-8父自动签发跨域越权_版本化补丁与独立原生PG16修复正式施工单_2026-10-15.md`。B在**新分支**`fix/f06-5c-pg1-parent-priority-guard-ci`（从最新main）和**独立新PR**实施，只许新增`engineering/f06/transaction-priority-parent-gate-ci/**`与`.github/workflows/f06-5c-pg1-*.yml`，不得改原PR62/冻结父源码/旧迁移。先真实修好C01—C03且补合法取消/伪签/资金和双Backend原生回归、完整旧父与新对象签名后交A；A验收合并PG1后再放行原PR62对接/重新全量验收。**本轮不合并PR62；F05/F06/V1仍NOT_READY，资金生产/UAT/F07/F08均未授权。**

---

# 2026-10-15｜A第三轮独立复验F06-5C PR62：R01父签唯一签发技术裁决通过，候补/伪取消/资金组合风险补证后再合并（唯一最新）

- **唯一正式指针**：`F06_5C_A_TECH_RULING_R01_SCOPED_ACCEPTED / F06_5C_A_CHANGES_REQUESTED_PARENT_AUTO_ISSUER_CROSS_DOMAIN_PROOF / PR62_NOT_MERGED / NEXT_OWNER=B / NEXT_TASK=F06_5C_PR62_PARENT_AUTO_ISSUER_SIGNED_WAITLIST_CANCEL_REFUND_REGRESSION_CI_ONLY / F05_F06_V1_NOT_READY`。A核验B最终HEAD `a54f4628e29354a207619f0d2a0cfe2896bb833a`、main审验点 `d0904e22e68484e92424e241e35b2b23445911f4`，compare ahead40/behind9；37/37均仅授权新增CI文件。
- **真实通过**：同SHA官方22/22真正Push工作流success，A逐Run读取96/96真PG16 Jobs success（H52 52/52）、96/96官方有效非空同SHA sha256 Artifact元数据（未逐ZIP字节复算）；F06-5C Run38633271578 Source85/85与HTTPS9/9真PG16，Scenario OID68456→Audit OID73479、190旧父表全量COUNT/MD5、24 Ledger/Catalog/D1和父签名PASS。R02真实5B COMMIT后签名交易排他与不同Backend、R03原4B→4C跨负责人移交取消/deny/scope/幂等原生通过；R04 43候选剔6辅助为B自核37业务独立用例，A未自动认可最终独立数。
- **R01技术裁决（已完成）**：冻结F05-8在4A合法Cancel COMMIT按真实Match源触发器自动签唯一**新**Priority（`source-create:/source-created:`），旧ended Priority不复活；随后两个F06-5C真实Backend正确`F06_5C_EXISTING_ACTIVE_PRIORITY`，不能要求再次签发第二笔Priority；另S52已证5C在无占用时调用原父签发。A接受**这一窄范围CI事实**，不是冒称5C在取消后亲自发新Priority，更不授权生产。
- **实质未闭合风险**：A复核冻结`engineering/f05/priority-arbitration-ttl-handover/000024_priority_ci.sql`自动签发源函数未显式检查Waitlist、Refund/Payment、5B Guard/4A Cancel签名；父触发器可能先于5C安全准入执行，现有S66缺真批发Match、S61仅Savepoint验5C只读函数，尚不足以证明候补与假取消/资金无法导致父自动抢发。**缺少跨域实测，不等于已发现真实资金或线上事件**。额外旧PR工作流本次查询5 success/4 failure/1运行中，不能称所有检查绿灯；细项保护接口403，不伪称已核清required。
- **A已正式签同包技术补证施工单**：`07_重建工作区/F06-5C_A主控第三轮复验_R01父触发器技术裁决与候补资金签名补证施工单_2026-10-15.md`。B在原PR62/分支、原两个CI新增目录只补C01—C05组合实证/代码审计/矩阵与最终新SHA全量回归。若冻结父真违反已有候补/资金签名约束，B不得越界改父，应出红证交A另放行合法父修复。**PR62不合并；NEXT_OWNER=B；资金、生产、UAT/F07/F08及F05/F06/V1继续NOT_READY**。

---

# 2026-10-15｜A第二轮独立复验PR62：68项PG16全绿但取消后正向签发与真实竞态缺证，不合并（唯一最新）

- **正式唯一最新指针**：`F06_5C_A_SECOND_INDEPENDENT_REVIEW_CHANGES_REQUESTED_PR62 / PR62_NOT_MERGED / NEXT_OWNER=B / NEXT_TASK=F06_5C_PR62_SECOND_REVIEW_POSITIVE_CANCEL_RACE_HANDOFF_REMEDIATION_CI_ONLY / F05_F06_V1_NOT_READY`。A核验 `main` 审查基点 `7bf416c02f82ee779585a6131053101d2efb2457` 与 B最终HEAD `7936b4f1dcce6897dc1317200653a4ed6ae1a877`：compare ahead34/behind2；36/36均为授权 CI 白名单新增文件，PR62尚未合并。
- **A独立核验的原生事实**：同HEAD真正Push工作流22/22成功；H52 Run 38617845356官方52/52真PG16 Jobs成功；F06-5C Run 38617845865 Source68/68、HTTPS9/9，真正PG Scenario OID68454销毁→独立Audit OID73477、190旧父表全行COUNT/MD5及24迁移/Catalog/D1/父签名保全。B报告全部96/96 Jobs、96官方工件与32 ZIP逐字节校验；A本轮没有逐一复算全部96 Job/工件和ZIP，不能冒称已独立复算。另有旧pull_request工作流4成功/6失败（冻结事件签名/镜像限流等），不能称所有PR检查全绿。
- **第二轮实质阻断**：S57只排除部分旧错误码而未断言5C取消后的真正正向新签发；S65中合法4A取消后新Priority系原F05-8冻结源触发器自动创建，两个5C Backend请求均因已存在active Priority拒绝；另一段5B/5C真实竞态5C败因是`ACTIVE_LOCK`而非有签名的Transaction占用；4B/4C跨负责人原生取消链尚无同等级父API测试；68项含大量环境和参数断言，不能替代≥36个独立有效业务场景。首轮3B历史/4A签名/5B Guard及Waitlist的已修复事实保留，不倒退。
- **A已签同包第二轮完整整改单**：`07_重建工作区/F06-5C_A主控PR62第二轮独立复验_真实签发竞态与跨负责人终态整改施工单_2026-10-15.md`，B仅可沿用PR62与原分支、原CI隔离白名单，按R01—R05整改、验证最终新SHA并重新交A独立复验。生产Issuer/资金/真实用户数据/UAT/F07/F08及F05/F06/V1仍`NOT_READY`。**NEXT_OWNER=B**。此为既有产品规则下技术验收裁定，**不构成新PDM产品裁决**。

---

# 2026-10-15｜A独立复验F06-5C PR62：真Push与双OID已核，交易取消来源和真实原子并发验收未过（唯一最新）

- **唯一当前正式指针**：`F06_5C_A_INDEPENDENT_REVIEW_CHANGES_REQUESTED_PR62 / PR62_NOT_MERGED / NEXT_OWNER=B / NEXT_TASK=F06_5C_PR62_CANCELLED_TRANSACTION_SIGNED_TERMINAL_AND_ATOMIC_RACE_REMEDIATION_CI_ONLY / F05_F06_V1_NOT_READY`。GitHub main 基点 `708697bd2cabd3dfbd14adb79e04ba0a2af3058e`，B正式交接最新 SHA `3b406c09f92c351d1f953521b538f66e8ff231b7`，A从 PR #62 独立复核 34/34 新增 CI 白名单、22/22 同SHA真正Push工作流成功、H52 52/52 官方原生作业、5C Source56/56 与 HTTPS9/9、190张旧父全量签与Scenario OID68461→Audit OID73484。B另报告96/96 Jobs及32份ZIP实物哈希，A未在本轮重新逐字节抽验32 ZIP。
- **A独立拒收的实质性缺口**：5C适配器把冻结3B不可变 `in_progress` 来源与4A/4C合法更新为 `cancelled` 的public终态视作错误漂移，导致合法取消后始终拒绝新Priority；未完整验签5B Guard、4A/4C取消签名与资金Refund，现有S42双Backend只是两败负例，缺真正合法正向竞争与已取消后新签发矩阵。PR另有额外 pull_request 检查失败（含Docker镜像限流），需分类；PR正文/权限矩阵仍旧阻断口径。**不能凭22个Push成功替代业务验收**，PR62不合并。
- **A已下达同包正式完整整改单**：`07_重建工作区/F06-5C_A主控PR62独立验收未通过_交易取消来源与原子并发整改施工单_2026-10-15.md`，B只在原分支/PR62与原两个新增CI目录整改、补真实业务/签名/并发/撤权、复核额外CI、最终SHA全量回归和证据归档；合格后重交A独立验收。资金、生产、完成成交、真实用户数据、UAT/F07/F08、F05/F06/V1仍 `NOT_READY`。**NEXT_OWNER=B**。

---

# 2026-10-14｜A主控PR62独立核验：F06-5C两项上游技术裁决与包内整改正式放行（唯一最新）

- **当前唯一正式指针**：`F06_5C_A_CHANGES_REQUESTED_TECH_UNBLOCKED_CI_ONLY / PR62_DRAFT_NOT_MERGED / NEXT_OWNER=B / NEXT_TASK=F06_5C_PR62_A_TECH_RULING_REMEDIATION_CI_ONLY / F05_F06_V1_NOT_READY`。本次是A工程裁决，**非A验收通过**、非生产授权。
- **PR62**：基点main `4d9dfc7aff880d4e02f8a6d4f5d9a5ed5e80d2dd`，B复核HEAD `3ce3d2887fb72c1dc8c1b4d2a5579add3e70be7f`；ahead3/behind0，34/34全在授权新增目录；B仍标记草稿与BLOCKED_UPSTREAM、未READY。官方PG16 Source Run38558804382 Job115834619132 真实OID68454旧父表190（并非施工单误记192）。旧5B前188+5B两表=190；5C自身仅新加1表，因此A技术勘误：**封印前后必须190张原父表全量COUNT+MD5及所有签名；5C一表另验**，不得假增表。冻结F05-8 `arbitrateCI`可通过有边界的`auth.withSession`包装在原物理事务与Vehicle FOR UPDATE内先行双源核验，然后继续调用原签名仲裁，禁止两事务TOCTOU与直接INSERT假发行；不成功则FailClosed。现有36项Source多属假Token/配置测试须补真实业务正反和跨Backend。最新SHA Push尚未全绿且F06-4B HTTPS存在EADDRINUSE端口49028失败。
- **A签正式完整补充整改施工单**：`07_重建工作区/F06-5C_A主控PR62上游接口与190旧父表原子签发技术裁决_包内整改补充施工单_2026-10-14.md`；在原分支/PR62且仅原白名单包内实现、真实两OID旧父封印、合法真Priority正向/并发、22真正Push/96真PG16 Job/H52 52/≥32官方SHA256 Artifact后再交A。PR62不合并；资金/生产/UAT/F07/F08及V1仍NOT_READY。**NEXT_OWNER=B**。

---

# 2026-10-14｜A主控F06-5B PR61独立验收标准合并与F06-5C新Priority原子准入技术放行（不更改PDM产品规则）

- **A已验收并官方标准合并**：PR61最终B HEAD `c7ab2336a425075b4ac4cfaf7203e2987deab98a`，34/34仅新增CI白名单，21/21同SHA真Push、94/94真实非特权PG16 Job/H52 52、Source54 HTTPS9、94有效sha256 Artifact、OID63416→68456旧188父表全行Seal与24 Ledger/Catalog/D1/九父Sidecar不漂移。[A验收签字](https://github.com/suzhe868-arch/mb/pull/61#issuecomment-6166703241)，GitHub标准merge SHA`1a9b87a2e109190fff0380bbe85e7702a95dcd5e`。正式报告：`07_重建工作区/F06-5B_A主控独立验收21条Push94项PG16与94工件_PR61标准合并正式报告_2026-10-14.md`，仅`A_ACCEPTED_CI_ONLY`。
- **技术边界**：新增5B安全版本化原子转换CI入口不能替代旧3B已证待退款转换不安全入口；PDM19§21原权限/资金/退款Authority不改，生产Issuer与refunded/actual payment/完成成交/UAT/部署一律禁止。F05/F06及V1未READY。
- **A下一独立技术放行**：已签PDM19§15、PDM13、PDM02/17/18/25下，F06-5C`07_重建工作区/F06-5C_A主控Transaction占用与Priority新建排他原子仲裁_CI隔离完整施工单_2026-10-14.md`，B分支`feat/f06-5c-transaction-priority-admission-ci`仅CI白名单新增，Transaction在途与新Priority的原子排他及旧Priority不复活，真实非特权PG16双Backend/回滚/旧192实体Seal，22真Push/96真PG16 Jobs/H52 52，新Source≥36 HTTPS≥9；无法复用合法签发来源则显式SOURCE_GAP。`NEXT_OWNER=B`，不批准真实资金/数据/上线。

---

# 2026-10-14｜A主控F06-5A第三轮独立验收PR60标准合并与F06-5B原子守卫技术放行（不构成新用户产品裁决）

- **最新技术验收记录**：F06-5A B唯一HEAD `6695c9328ea81dd984d6404d9d7393fe153d693d`、20/20真正Push、92/92真实PG16 Job(H52完整52/52)、Source82/82 HTTPS9/9、92/92官方原生有效sha256 Artifact、OID58366→63421旧184实体全行Seal，A第三轮独立验收PASS；[PR60正式A签署](https://github.com/suzhe868-arch/mb/pull/60#issuecomment-6164442173)，GitHub标准merge `merged=true`，实际SHA`5d45a6bdb1debc9db6a79a16e9c8b9b177fb5afb`。中文正式报告：`07_重建工作区/F06-5A_A主控第三轮独立验收82项Source92项PG16与92工件_PR60正式合并报告_2026-10-14.md`；仅`A_ACCEPTED_CI_ONLY`。
- **A明确技术裁决**：根据已签PDM-19 Final §21（Lock XOR Transaction及冲突pending/COMMIT重验），F06-5A真实已签S70/S71显示冻结父F06-3B原`openSyntheticTransactionCI` **无法阻挡旧Lock已有签名pending Refund的Transaction转换**。登记已证上游技术安全缺口`UPSTREAM_F06_3B_LOCK_PENDING_TRANSACTION_CONVERSION_GAP`，旧入口不得称安全或生产可用；F06-4A/5A当前FailClosed不等于改好父3B。这是已签规则内工程纠偏，**不新增业务状态/产品裁决**，也不回写/替换旧PR55历史事实。
- **A仅正式放行F06-5B CI-only独立技术整改包**：`07_重建工作区/F06-5B_A主控旧Lock待退款禁止Transaction转换原子前置守卫_CI隔离完整施工单_2026-10-14.md`；B以最新main在分支`feat/f06-5b-lock-refund-conversion-guard-ci`只新增独立`engineering/f06/lock-refund-conversion-guard-ci/**`、`.github/workflows/f06-5b-*.yml`，实现同PG原子守卫新版CI入口，禁止check-then-old-parent-call双事务冒充安全。目标21真正Push、94 PG16 Jobs、Source≥40/HTTPS≥9、≥30官方sha256 Artifact、不同真实物理OID与旧≥188实体全行Seal。B自验交A，B不得merge。
- **保留高风险阻断**：生产Refund/Transaction Issuer、真实已退/refunded、真实钱款与支付流水、completed成交、真实账号客户和第三方、生产迁移/UAT/部署上线/F06-3C-2/F07/F08，F05/F06整域、C/H01和V1仍`NOT_READY`。**NEXT_OWNER=B**。

---

# Decision Register｜产品基线重建

## 2026-10-14｜F06-4C PR59独立验收与F06-5A仅合成Transaction侧Refund pending/closed放行（不更改PDM）
- A直接核GitHub PR59 B末SHA`2258c9831e0b9059a8612c938c730fc6a538e072`，30/30新增CI白名单、19/19真Push、90/90真实非特权PG16 Job（H52实取52）、Source102、HTTPS9、135官方sha256 Artifact。OID53416→58367旧180父实体逐表完整COUNT+MD5/24 Ledger/Catalog/D1/七父Sidecar未漂移。A独立验收意见https://github.com/suzhe868-arch/mb/pull/59#issuecomment-6161319870，GitHub原生标准merge`252fd551713eb7bbb64fce956c17c362368d2116`，正式报告`07_重建工作区/F06-4C_A主控独立验收19条Push90项真PG16与135份证据_PR59标准合并正式报告_2026-10-14.md`。本批仅非生产合成取消技术证据，Production Cancel Carrier/Handoff Issuer/Cancel Permission Source Gap不解除。
- A依已用户批准的PDM-19 §§19–26，正式仅隔离技术放行F06-5A`07_重建工作区/F06-5A_A主控PDM19已取消Transaction合成Refund申请pending与无付款closed_CI隔离完整施工单_2026-10-14.md`，锁定Refund subject仅已取消Transaction且与原Lock资金签名一致，申请pending/真正决定不退款closed+reason、公海保护与余额只读守卫。分支`feat/f06-5a-transaction-refund-pending-ci`，仅本域新增白名单，目标20同HEAD真Push/92真PG16 Job(H52 52)、Source≥44 HTTPS≥9、≥28原生Artifact、双真实OID旧≥184表封印；任何实际`refunded`/payment/真实资金、完成成交或生产Issuer/UAT仍禁止。**NEXT_OWNER=B**，F05/F06整域及V1`NOT_READY`。

---

## 2026-10-14｜F06-4B PR58独立验收与F06-4C移交后当前负责人的合成安全取消放行（不构成PDM业务新裁决）
- A核PR58 B唯一最终SHA`89bab5f2452438f5cdfd74f2d95ef7885652db87`，29/29新增仅CI白名单、18/18同SHA真Push、88/88真PG16 Job/H52官方52、Source48、HTTPS9、133有效GitHub sha256 Artifact；双物理OID48623→53414旧176父表逐表COUNT+MD5与Ledger24/Catalog/D1/父Sidecar签名不变。A正式评论https://github.com/suzhe868-arch/mb/pull/58#issuecomment-6160139339，GitHub标准merge SHA`498617353db8020c14ec919a1b0eefef66f2eec8`，正式报告`07_重建工作区/F06-4B_A主控独立验收18条Push88项真PG16与133份证据_PR58标准合并正式报告_2026-10-14.md`。仅合成Transaction负责者变更，生产Handoff Issuer缺失，父Cancel迁移后失源拒绝持续成立。
- A据用户已签PDM-19§§9–10、PDM-02/03/17/18/25，另外书面技术放行`07_重建工作区/F06-4C_A主控PDM19移交后当前负责人合成Transaction安全取消_CI隔离完整施工单_2026-10-14.md`：仅合成安全Adapter验证当前正式签名4B负责人+独立Cancel权限与Scope的Transaction终止，仍无生产Issuer/真实资金/成交/退款；B从最新main按新`feat/f06-4c-post-handoff-cancel-ci`独立PR，仅新增新批白名单，两OID旧≥180表全行Seal、19真Push/90真PG16 Job/H52 52、Source≥40 HTTPS≥9、≥26官方sha256 Artifact，B完包交A不合并。**NEXT_OWNER=B**；F05/F06整体及V1`NOT_READY`。

---

## 2026-10-14｜F06-4A PR57 A独立验收与F06-4B仅CI负责人移交放行（不构成PDM新裁决）
- A唯一受验B HEAD `d6c8731c05d0a4e1156b9efe7723f79434068d8d`，PR57仅28个新增的CI白名单文件，17真Push/86真PG16 Jobs(H52真实52)/Source48/HTTPS9/131官方SHA256 Artifact通过；旧172表双物理OID43953→48618全行COUNT/MD5，24迁移Ledger、公签Catalog/D1/父Sidecar不变。正式A评论 https://github.com/suzhe868-arch/mb/pull/57#issuecomment-6156008159，GitHub标准merge成功SHA`b892d3b5ef1ff27dda0a6a145f8cb449807cea11`；完整报告`07_重建工作区/F06-4A_A主控独立验收17条Push86项真PG16与131份证据_PR57标准合并正式报告_2026-10-14.md`。只认可CI-only合成normal Transaction cancelled，不开放真实金融或生产Issuer。
- A依正式已用户批准的PDM19§9、PDM02/03/17/18/25继续书面技术放行F06-4B`07_重建工作区/F06-4B_A主控PDM19合成Transaction负责人正式移交与跨批安全守卫_CI隔离完整施工单_2026-10-14.md`，只在可销毁PG16进行正式签名Transaction responsible移交与当前permission/Scope/历史守卫、父Cancel跨批兼容安全拒绝，严格禁止真实交易/资金/生产/UAT。18真Push、88真实PG16 Job(H52 52)、Source≥36 HTTPS≥9、≥24原生有效sha256 Artifact、旧≥176张父表双OID全行Seal，B最终交A不自merge。F05/F06域与V1仍NOT_READY，`NEXT_OWNER=B`。

---

## 2026-10-14｜F06-3C-1 PR56独立验收与F06-4A纯CI技术放行（不构成产品新裁决）
- A验收唯一B HEAD `177c810a1198bd8e97815748c05e4c07d0b0906b`、27个合法新增CI文件；16真Push本SHA全success，新Source43/HTTPS9成功；场景OID39410→独立OID43953及168旧实体COUNT+MD5全行Seal一致、旧24Ledger/Catalog/父Sidecar未漂移；129官方有效sha256 Artifact。H52 workflow源码52无条件Job、官方运行成功，B记录52个Job ID；A调用H52 job list因GitHub ReadTimeout未能逐项复取，记录透明边界。A签字 `https://github.com/suzhe868-arch/mb/pull/56#issuecomment-6155344148`，官方标准PR merge SHA `54d206d633d47a29f675b52bdf5465d1d5d6a8e6`；完整报告 `07_重建工作区/F06-3C-1_A主控独立验收16条Push与129份原生证据_PR56标准合并正式报告_2026-10-14.md`，只认CI-only合成pending/closed，无真实Refund支付与生产Issuer。
- A依已签PDM19 Final§§6–11及15–26、PDM02/17/18/25，在无实际资金/个人数据/生产接入的前提下正式签发 `07_重建工作区/F06-4A_A主控PDM19合成Transaction正常取消与责任占用释放_CI隔离完整施工单_2026-10-14.md`，F06-4A B新分支 `feat/f06-4a-transaction-cancel-ci` 限CI-only原子普通Transaction取消。要求17同SHA Push、86真PG16 Job/H52 52、新Source≥32 HTTPS≥9、≥22官方SHA256 Artifact、双OID旧172实体全行封印；B不合并main，最终交A独立验收。F06-3C-2真实资金退款、正式生产cancel/completed、V1上线上游权限均未放行。`NEXT_OWNER=B`。

---
## 工程治理接力记录（不构成PDM业务新裁决）

- **2026-10-14 / F06-3B PR55 A工程治理（不构成PDM新产品裁决）**：A独立核实B最终HEAD `9880e8fcf1923802c1360e0c4783b4cfee4aaab2`，26/26项全added本批CI-only白名单、真正15/15同SHA Push、82/82非特权PG16 Jobs（H52真实52）、本批Source35/HTTPS9、127/127同SHA官方sha256 Artifact，实际业务库OID34957 DROP后另建审计库OID39410，164旧public/D1/F06-1/2/3A源表全行COUNT/MD5、24迁移Ledger/D1/Public Catalog及父Sidecar签名不变。正式A验收报告`07_重建工作区/F06-3B_A主控独立验收15条Push82项PG16与127证据_PR55标准合并正式报告_2026-10-14.md`，PR A签字评论`https://github.com/suzhe868-arch/mb/pull/55#issuecomment-6153930833`；GitHub原生标准合并成功、真实merge SHA `a43d3a0537a9051929f87490f5c1c6641c5920b2`。旧F05历史`pull_request`触发存在异名跨批次证明失败，非正式15条Push门禁，保留A报告观察而非宣称所有Actions事件全绿。仅接收合成Lock→Transaction CI证明，生产Issuer/资金未放行。
- **2026-10-14 / F06-3C-1 A下一完整施工单（不构成新产品裁决）**：依用户已批准PDM19 Final §§19–26及PDM18/17/02/25，A正式放行`07_重建工作区/F06-3C-1_A主控PDM19合成Refund申请与关闭_无实际退款_CI隔离完整施工单_2026-10-14.md`，仅在合成可销毁非特权PG16测试`pending` Refund申请与带原因的`closed`，Lock XOR Transaction唯一subject、有效Deposit+correction余额、无冲突pending、权限Scope/历史及公海保护；严格禁止记录`refunded`、真实退款确认、`refund_payments`实际付款事实、现金/支付/生产Issuer。B从最新main新建`feat/f06-3c1-refund-pending-close-ci`，只新增`engineering/f06/refund-pending-ci/**`和`.github/workflows/f06-3c1-*.yml`，新末次SHA至少16条真Push、84/84真PG16 Job（H52完整52）、本域Source≥32/HTTPS≥9、≥20官方Artifact、跨双OID原168父表真实全行COUNT/MD5 Seal；B不合并并交`READY_FOR_A_INDEPENDENT_REVIEW`。F06-3C-2实际Refund、F05/F06/V1生产与真实资金继续NOT_READY。**NEXT_OWNER=B**。



- **2026-10-14 / F06-3A PR54 A工程治理（不构成新产品裁决）**：A独立复查最后B SHA`ced0839defb013127ef57d5b9f6964d8aa901c72`，28/28 added合法CI白名单、14/14同SHA真Push、80/80非特权PG16独立Jobs/H52完整52、Source28/HTTPS9、125份有效GitHub sha256 Artifact、两物理OID30636→34961与旧160张public+D1+F06-1/2侧表全行COUNT/MD5、签名24 Ledger/D1/Catalog不变；B签字、A标正式可Review后以标准PR merge SHA`fd00d88ec5e0f555cf2c8a9643af9a0bd74a23e8`，正式报告`07_重建工作区/F06-3A_A主控独立验收14条Push80项真PG16与125份证据_PR54标准合并正式报告_2026-10-14.md`、PR A评论#6151714472。仅合成财务CI门禁PASS，不代表真实资金与生产Issuer。
- **2026-10-14 / F06-3B A施工技术分包（不构成新产品裁决）**：依用户已签PDM19 §§6–11、15–18和PDM18，由A仅放行F06-3B合成Lock→Transaction同PG原子转换和一车唯一在途/资金历史保护CI-only，正式工单`07_重建工作区/F06-3B_A主控PDM19_Lock到Transaction原子转换责任占用_CI隔离正式完整施工单_2026-10-14.md`；独立B分支`feat/f06-3b-lock-transaction-ci`、15同SHA Push/82项真实PG16回归/≥18官方Artifact，生产Transaction/Refund/真实资金/成交/上线一律阻断。NEXT_OWNER=B。


- **2026-10-14 / F06-2 PR53**：A独立验B最后HEAD`44067d132ab8c6924213ea2681ad6c5ecd4bec92`，13条真Push同SHA/78真PG16 Job(H52完整52)/Source30/HTTPS9/123官方原生sha256 Artifact成功；双真实PG可销毁物理库OID26507→30636、旧157实体全行COUNT/MD5及Ledger/D1/Catalog/F06-1侧表原封。实际GitHub标准merge`67b673aff285e28519a1a1141a2e908edf2e44d5`，正式A证据`07_重建工作区/F06-2_A主控78项真PG16二轮资金边界与生命周期独立验收_PR53标准合并正式报告_2026-10-14.md`，只接受`CI_ONLY`，非业务新裁决或生产放行。
- **2026-10-14 / F06-3A**：A据已批准PDM19 Final §§2～5及PDM18 Final的资金/Lock隔离边界签署`07_重建工作区/F06-3A_A主控PDM19意向金事实追加资金纠错与Lock保全_CI隔离正式完整施工单_2026-10-14.md`，B仅可在可销毁PG16构造合成Deposit/append-only纠错与资金读守卫，生产资金Issuer未放行；下一`NEXT_OWNER=B`，F06-3B/3C仍NOT_RELEASED。


- **2026-10-13 / F06-1 PR52**：A独立复验B HEAD `2ef839b0a5e51a1bdd0b64a2bf322aa1ce3d2e6b`，12真Push同SHA、76/76真PG16 Job（H52 52/52）、Source48/HTTPS9、121官方有效sha256 Artifact；R01已签Priority与Lock原子事务、R02独占投影及151表/两OID签名保全均通过，GitHub标准合并 `a87de230684914a1aafe7fb3b3e5081db63206ab`。正式证据`07_重建工作区/F06-1_A主控二轮独立验收48项Source76项真PG16与121份证据_PR52标准合并正式报告_2026-10-13.md`。仅`A_ACCEPTED_CI_ONLY`，不是PDM新裁决或生产放行。
- **2026-10-13 / F06-2**：A根据原已用户批准的PDM18 §§19～29/PDM19§5，另发`A_RELEASED_FOR_B_CI_ONLY`技术施工单`07_重建工作区/F06-2_A主控正式Lock延期到期与人工释放资金只读保护_CI隔离完整施工单_2026-10-13.md`；只允许合成PG16 Lock生命周期、安全资金只读守卫与旧域冻结回归；真实Issuer/资金/生产继续BLOCKED；下一责任B。


> 仅记录本轮重新确认后的真实业务裁决。旧 FROZEN / SUPERSEDED 判断不得自动复制进来。

| ID | 产品域 | 规则原子 | 裁决 | 替代/排除 | 证据 | 日期 |
|---|---|---|---|---|---|---|
| PDM01-DEC-A04 | PDM-01 | P01-A04 | 用户确认：新客户首次进入先建立/识别 `customer_id`；若无有效销售分享、直接转介绍等优先归属来源，则立即进入自然注册自动分配，从当前 active + eligible + accepting 接客池产生唯一 `current owner`；若通过有效直接转介绍进入，则记录直接推荐关系，由推荐人在事件发生时的 `current owner` 承接，不参加普通自然注册轮询；普通客户侧车源转发仍为 `SOURCE_ONLY`，不据此分配或改变 owner。 | 替代旧“首次进入不自动分配 owner”的过度简化表述；不改变客户侧普通转发 `SOURCE_ONLY` 边界。 | 9/19 R5/R10 + IA Current `natural registration / auto-round-robin` + R5 §7 直接转介绍规则 + 2026-09-24 用户明确确认“A04通过” | 2026-09-24 |
| PDM01-DEC-A01 | PDM-01 | P01-A01 | 用户确认：Customer 使用稳定 `customer_id`；手机号、头像、昵称不是唯一身份主键。 | 无 | M01-001 + R5/R10 + IA 当前同向 + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-A02 | PDM-01 | P01-A02 | 用户确认：不建设显式独立登录页；首次进入按“微信身份识别 → 创建/找到 customer_id → C01 首页”。 | 无 | R10-55 + IA 首入链 + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-A03 | PDM-01 | P01-A03 | 用户确认：首次进入不强制手机号、头像、昵称，不得阻挡普通浏览。 | 无 | R10-55 + IA 同向 + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-A05 | PDM-01 | P01-A05 | 用户确认：微信身份识别失败显示失败并允许重试，不另建传统登录体系。 | 无 | R10-55 + IA 重试链 + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-A06 | PDM-01 | P01-A06 | 用户确认：手机号是人工服务链硬门槛，但不是普通浏览/收藏门槛。 | 无 | R10-11 + M01-001 + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-A07 | PDM-01 | P01-A07 | 用户确认：无手机号执行人工服务动作时触发授权；成功保存并自动继续原动作；拒绝/取消不创建正式人工服务对象；成品只保留“授权手机号/取消”，自动续接不是额外按钮。 | 无 | R10-11 + 9/22 VR-C-018 + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-A08 | PDM-01 | P01-A08 | 用户确认：相同手机号不能自动认定为同一 Customer，也不能自动 Merge。 | 排除“同手机号自动合并客户” | R5 §13 + M01-002/M01-004 + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-A09 | PDM-01 | P01-A09 | 用户确认：重复 Customer 只有确认确属同一自然人后才允许人工合并；具体确认标准留后续未决项。 | 排除“仅凭手机号等单一证据自动合并” | R5 §13 + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-A10 | PDM-01 | P01-A10 | 用户确认：Customer Merge 必须保留历史、来源与 owner 变化，不得物理抹除旧记录。 | 排除“合并即删除旧记录” | R5 §13 + IA Merge history + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-A15 | PDM-01 | P01-A15 | 用户确认：客户停用/注销不物理删除业务历史；重新确认原客户后沿用原身份，不得新建历史清空的 Customer；完整生命周期另行裁决。 | 排除“注销即物理删除历史/重建新客户” | R5 §14 + IA CO-O01 + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-A17 | PDM-01 | P01-A17 | 用户确认：头像、昵称不是业务硬门槛；跳过/拒绝/关闭不能阻断正常业务。 | 无 | R10-56 + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-A18 | PDM-01 | P01-A18 | 用户确认：头像/昵称提醒：收藏成功可提醒一次；持续浏览最多每20分钟一次；每日最多10次；多触发合并；关键业务执行中不得被资料提醒打断。 | 替代旧频控“每日一次/第5、10台/30分钟/每日4次”等 | R10-56 + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-A19 | PDM-01 | P01-A19 | 用户确认：个人资料显示头像、昵称、手机号、我的顾问；无顾问显示“暂无服务顾问”；打开资料页本身不得改变销售归属。 | 继承已确认 A04，不得因打开资料页重新分配 owner | R10-22 + P01-A04 已确认约束 + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-A20 | PDM-01 | P01-A20 | 用户确认：Customer 后续再次购车、找车、咨询继续使用原 Customer 身份，只建立新一轮业务，不因新业务重建 Customer。 | 排除“新一轮业务重建客户身份” | Phase1 当前基线 R6 + 2026-09-24 用户明确确认“剩余14条全部通过” | 2026-09-24 |
| PDM01-DEC-B2-01 | PDM-01 | P01-B2-01 | 用户确认：旧“首次进入只建立 customer_id、不形成 owner”不得恢复；采用已确认 A04 的自然注册自动轮询 + 直接转介绍优先承接规则。 | 替代旧首次进入不分配销售口径。 | 9/19 R5 §2 / R10-55 + IA Current natural registration/auto-round-robin + P01-A04 已确认 + 2026-09-24 用户确认 Batch 2 五项全部通过 | 2026-09-24 |
| PDM01-DEC-B2-02 | PDM-01 | P01-B2-02 | 用户确认：旧“V1 不建设/不做正式 Customer Merge”不得恢复；允许受控人工 Merge，前提是确认同一自然人并保留历史、来源与 owner 变化；完整 Merge 语义后续继续裁决。 | 替代旧“完全不做 Merge”。 | 001～078 M01-002 + 9/19 R5 §13 + P01-A09/A10 已确认 + 2026-09-24 用户确认 Batch 2 五项全部通过 | 2026-09-24 |
| PDM01-DEC-B2-03 | PDM-01 | P01-B2-03 | 用户确认：同手机号自动认定同一客户并自动 Merge 明确废弃，不得恢复；相同手机号最多作为重复客户提示证据之一。 | 排除自动 Merge / 自动改 owner / 自动搬历史权益。 | 001～078 M01-002 + 9/19 R5 §13 + P01-A08/A09 已确认 + 2026-09-24 用户确认 Batch 2 五项全部通过 | 2026-09-24 |
| PDM01-DEC-B2-04 | PDM-01 | P01-B2-04 | 用户确认：换手机号时新建 Customer / 新 customer_id 明确禁止恢复；手机号是可变联系方式，Customer 身份保持连续；具体换绑方式留后续裁决。 | 排除“换手机号即新建客户”。 | 001～078 M01-004/M01-006 DEC-057 + 2026-09-24 用户确认 Batch 2 五项全部通过 | 2026-09-24 |
| PDM01-DEC-B2-05 | PDM-01 | P01-B2-05 | 用户确认：头像/昵称旧频控“每天最多一次 / 第5、10台 / 30分钟冷却 / 每天最多4次”整组废弃，不得恢复；采用已确认 A18。 | 由 P01-A18 替代。 | 9/19 R10-56 + 001～078 M01-005 + P01-A18 已确认 + 2026-09-24 用户确认 Batch 2 五项全部通过 | 2026-09-24 |
| PDM01-DEC-R5-REB-001 | PDM-01 | P01-A04 / P01-B2-01 | 用户在补回 R5 原件并完成证据重基准后再次明确确认“继续用 A04”：无有效销售分享、直接转介绍等优先归属来源时，新客户首次进入建立/识别 customer_id 后立即进入 active + eligible + accepting 接客池自动轮询形成唯一 current owner；有效直接转介绍仍优先由推荐人事件发生时的 current owner 承接。 | 明确作为 2026-09-24 主动新修改覆盖 R5 原件、9/19 CURRENT R5、R10-55、IA Current 中“首次进入不立即形成 owner / 首次人工服务事件再分配”的旧规则；P01-B2-01 继续有效。 | R5 补回原件 + 9/19 CURRENT R5/R10 + IA Current 重基准检查 + 2026-09-24 用户明确裁决“继续用 A04” | 2026-09-24 |
| PDM01-GATE-B3 | PDM-01 | Batch 3 Gate | 用户明确确认“Batch 3 无新增项，通过”：本批没有新的未审规则原子；P01-A04 主动新修改与 P01-A07/VR-C-018 已在此前用户裁决中生效，不重复造新规则。 | Batch 3 门禁通过；允许进入 Batch 4，但不自动批准 Batch 4 任何项。 | PDM-01 Batch 3 全量筛选结果 + 2026-09-24 用户明确确认 | 2026-09-24 |
| PDM01-DEC-A14 | PDM-01 | P01-A14 | 用户确认客户手机号管理新规则：一个 Customer 可有 1 个主要手机号 + 0～多个其他联系电话；首次需要手机号时仍使用微信小程序官方手机号能力完成有效绑定；后续有权限的员工可在员工端/PC 客户资料中新增或维护其他联系电话。销售端 CRM 客户搜索按手机号检索时，主要手机号和其他已登记手机号均参与匹配；若同一手机号命中多个 Customer，必须全部返回，不得自动认定同一人、不得自动 Merge。手机号维护不得改变 customer_id、owner、来源或已有业务关系，变更须保留审计。 | 这是 2026-09-24 新增产品规则。CN11/R5 只证明手机号是可变联系方式、换号不换 Customer；R10-15 已证明 CRM 搜索支持手机号，但历史证据未证明“一个 Customer 多手机号”或“员工新增手机号”已是旧规则。具体哪些角色拥有手机号维护权限留 PDM-02 决定。 | CN11 DEC-057/SSOT 手机号身份连续性 + R5 原件身份原则 + R10-15 CRM 手机号搜索 + 2026-09-24 用户明确确认“同意” | 2026-09-24 |
| PDM01-DEC-MERGE-CANCEL-001 | PDM-01 | P01-A09 / P01-A10 / P01-A11 / P01-A12 / P01-B2-02 | 用户明确取消 V1 Customer Merge：不同微信身份形成的不同 `customer_id` 即使现实中疑似/确认属于同一自然人，也保持为独立 Customer；不提供自动 Merge、人工 Merge、账号合并、手机号合并，也不迁移/合并 owner、来源、权益或业务对象。手机号允许被多个 Customer 共同登记，一个手机号命中多个 Customer 时仅用于搜索/提示，全部返回，不触发合并。 | 主动覆盖此前“确认同一自然人后可人工 Merge”的 A09、Merge 历史语义 A10、Batch2 B2-02 及 Batch4 A11/A12 的 Merge 方案；A11/A12 直接关闭为 N/A。A08/B2-03 的“同手机号不得自动 Merge”继续成立并被更强的“V1 无任何 Merge”规则包含。 | CN11 2026-09-06 原规则本来就是 V1 不做正式 Merge + 2026-09-24 用户明确表示“直接取消掉，两个账号就两个账号”并接受多账号权益独立结果 | 2026-09-24 |
| PDM01-DEC-A13 | PDM-01 | P01-A13 | 用户确认：手机号是 Customer 的可变联系方式，不是身份。无论主要手机号更换、其他联系电话新增/修改/失效，均继续使用原 `customer_id`；手机号变化不得改变 current owner、原始来源、既有 Demand / Consultation / Lock / Transaction / 查价权益等业务关系；保留必要号码变更历史与审计。 | 与 P01-A14 组成同一手机号体系：A14 负责多手机号维护/搜索，A13 负责身份连续性；排除“换手机号新建 Customer / 迁移业务关系”。 | CN11 DEC-057 / SSOT + 补回 R5 原件 + P01-A14 已确认 + 2026-09-24 用户明确确认 | 2026-09-24 |
| PDM01-DEC-A16 | PDM-01 | P01-A16 | 用户确认客户停用/注销 V1 最小闭环：客户可在个人资料发起停用，授权后台人员也可停用/恢复；存在未结束 Demand / Consultation / Lock / Transaction 时先阻断停用，须先完成或取消相关业务；停用不物理删除身份和历史，并禁止新增人工服务业务；current owner 与原始来源历史不清空，owner 失效时按后续 PDM-03 交接规则处理；恢复继续使用原 `customer_id`，不得自动复活已经终止/过期的业务对象或权益。Recommendation/查价权益、Lock/Transaction 等具体跨域恢复细节留对应 PDM 决定。 | 继承 A15“停用不删历史、恢复原身份”，补齐 V1 发起入口、业务阻断、恢复边界；排除“停用即删历史 / 恢复即新建 Customer / 自动复活旧业务”。 | 补回 R5 §20 + CN11/IA Customer 生命周期摘要 + 2026-09-24 用户明确确认 A16 同意 | 2026-09-24 |
| PDM01-GATE-B4 | PDM-01 | Batch 4 Gate | 用户已完成 Batch 4 全部未决项裁决：A11/A12 因取消 Customer Merge 关闭；A14 多手机号管理已确认；A13 手机号身份连续性已确认；A16 停用/恢复最小闭环已确认。 | Batch 4 门禁通过；PDM-01 四批用户审查全部完成，进入最终完整规则总览待用户批准。 | PDM-01 Batch 4 全量裁决 + 2026-09-24 用户明确确认 | 2026-09-24 |
| PDM01-GATE-FINAL | PDM-01 | Final Domain Overview | 用户明确同意 PDM-01《最终完整规则总览》；PDM-01 四批门禁与最终总览全部通过，正式标记 COMPLETE。 | PDM-01 最终规则成为后续产品基线重建的已确认约束；允许进入 PDM-02，但不得反向静默改写 PDM-01。 | `PDM-01_最终完整规则总览_待用户批准.md` + 2026-09-24 用户明确“同意” | 2026-09-24 |
| PDM02-DEC-A01 | PDM-02 | P02-A01 | 用户确认：员工四类主角色：普通销售、经理、店长、4S 成员；同一员工同一时刻一个主角色，不同时兼任名邦角色与 4S 成员。 | 排除多主角色/名邦角色与4S身份并存。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A02 | PDM-02 | P02-A02 | 用户确认：同一现实员工使用稳定 employee_id；调店、升降职、角色转换、离职后重新入职均复用原 ID，历史角色/责任/操作事实不改写。 | 排除角色变化/复职新建第二 employee_id。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A03 | PDM-02 | P02-A03 | 用户确认：System Admin 与员工业务账号完全分离；不属于员工四角色树，不自动接客或承担客户/锁车/交易等业务；同一真人兼任时使用两个独立身份。 | 排除 System Admin 自动获得员工业务身份。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A04 | PDM-02 | P02-A04 | 用户确认：System Admin 只能由 active System Admin 管理；系统必须至少保留 1 个 active System Admin，不能停用最后一个；变更需审计。 | 排除员工角色管理 System Admin 与最后一个 Admin 被停用。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A05 | PDM-02 | P02-A05 | 用户确认：名邦员工同一时刻只有一个主归属门店；跨店/跨团队能力通过权限 + 数据范围实现；调店复用原 employee_id 且历史门店事实不改写。 | 排除多重正式主归属门店。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A06 | PDM-02 | P02-A06 | 用户确认：不建立 4S 店组织层级；4S 成员作为独立合作员工账号，共用员工体系/应用并按权限、数据范围裁剪，不建立独立 4S App/IA。 | 排除独立4S组织层级与独立4S端。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A07 | PDM-02 | P02-A07 | 用户确认：权限按角色默认权限 + 员工个人明确授权/禁用 + 数据范围 + 对象状态共同判定；明确禁止优先于默认允许。 | 排除仅凭角色或页面入口直接授权。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A08 | PDM-02 | P02-A08 | 用户确认：数据范围决定能操作哪些对象，具体 permission 决定能做哪些敏感动作；个人授权不能突破本人数据范围，授权者不能授出超过自身边界的能力。 | 排除越范围授权。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A09 | PDM-02 | P02-A09 | 用户确认：页面可见、字段返回、按钮显示不等于最终授权；敏感动作提交时重新校验身份、permission、data scope、object state。 | 排除前端可见即视为授权。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A10 | PDM-02 | P02-A10 | 用户确认：员工不得自我提权、扩大自身数据范围、给自己增加敏感权限，也不得通过中间人绕过；本人权限调整须由另一名具足够授权边界的 active 管理人员执行。 | 排除自我提权与越级授权。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A11 | PDM-02 | P02-A11 | 用户确认：普通销售不能管理员工或权限。 | 排除普通销售进入员工/权限管理能力。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A12 | PDM-02 | P02-A12 | 用户确认：员工 inactive/离职后立即失去员工端访问和当前业务权限，旧登录态不能继续操作；employee_id、历史操作、客户关系和审计保留。 | 排除离职后继续操作或物理删除员工历史。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A13 | PDM-02 | P02-A13 | 用户确认：重新入职复用原 employee_id，并按当前角色/权限/数据范围重新授权；不自动恢复离职前权限、旧客户、旧业务责任，接客默认关闭。 | 排除复职自动恢复旧权限/客户/业务。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A14 | PDM-02 | P02-A14 | 用户确认：计划调店、角色切换、降权若会使员工失去当前承责资格，应先交接再生效；突发 inactive 则立即撤权，由 active 管理人员补完交接；历史事实不改写。 | 排除未交接即计划性失去承责资格。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A15 | PDM-02 | P02-A15 | 用户确认：进入内部模式本身不授予业务权限；敏感能力继续逐项按身份、permission、data scope、object state 校验；4S 成员不得查看名邦内部价/批发价。 | 排除把内部模式当万能权限入口。 | 9/19 R1 + CN11 原始证据 + IA/Low-Fi/9/22 同向核验 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-GATE-B1 | PDM-02 | Batch 1 Gate | 用户确认 PDM-02 Batch 1 稳定一致项 15 条全部通过。 | Batch 1 门禁通过；允许准备 Batch 2，但不得自动批准 Batch 2。 | P02-A01～P02-A15 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM02-DEC-A16 | PDM-02 | P02-A16 | 用户主动修改：恢复“查看名邦内部价 / 批发价”为独立 permission。名邦员工只有在具备该 permission 且车辆位于其 data scope、对象状态允许时，才能在内部模式查看内部价 / 批发价；进入内部模式本身不自动授予该权限。4S 成员对此能力 hard DENY，不得通过角色模板或个人授权绕过。 | 主动覆盖 9/19 R1 §14/§16 “名邦员工查看内部价不再需要独立权限”的旧规则；不改变 P02-A15“内部模式本身不授予其他敏感动作权限”。 | 9/19 R1 旧规则 + P02-A15 已确认 + 2026-09-24 用户明确提出“还是加上一个权限会更好，4S 店依旧不能看”并确认同意 | 2026-09-24 |
| PDM02-DEC-A17 | PDM-02 | P02-A17 | 用户确认 System Admin 权限来源：System Admin 的 P05 系统账号域权限由其他 active System Admin 管理；系统必须至少保留 1 个 active System Admin。首个 System Admin 不通过员工业务授权产生，而由系统初始化/bootstrap 建立。System Admin 身份不授予员工业务 permission；同一真人需要业务权限时必须使用独立员工身份，并由另一名具足够授权边界的 active 员工管理者在 P04 配置。 | 明确分离 P05 System Admin 权限域与 P04 员工业务权限域；禁止 System Admin 借系统身份给自己发员工业务权或绕过自我提权限制。 | 9/19 R1 §3/§5/§6 + IA P05/CR-S4-C02 + IA 首次 System Admin 初始化留工程承接 + 2026-09-24 用户明确确认 | 2026-09-24 |
| PDM02-DEC-B2-04 | PDM-02 | P02-B2-04 | 用户确认：旧“System Admin 自动拥有员工业务管理权 / 员工业务权限”明确废弃，不得恢复。 | System Admin 仅使用 P05 系统账号域权限；需要 CRM、车辆、价格、Lock、Transaction 等员工业务能力时，必须切换独立员工身份并按 P04 正常授权。 | 9/19 R1 §3/§16 + IA P05/Deprecated + P02-A17 + 2026-09-24 用户确认 | 2026-09-24 |
| PDM02-B2-02-WITHDRAWN | PDM-02 | P02-B2-02 | 原 Batch 2 候选“内部价独立权限不得恢复”被用户主动否决并撤回，不再作为 DO_NOT_RESTORE 项。 | 改由 P02-A16 生效：内部价 / 批发价查看重新成为独立 permission，4S hard DENY。 | 2026-09-24 用户主动修改并确认 | 2026-09-24 |
| PDM02-DEC-B2-01 | PDM-02 | P02-B2-01 | 用户确认：旧“把编辑非本人上传车辆本身设置为独立敏感权限”明确废弃，不得恢复。 | 是否可管理车辆由 data scope + 当前车辆 permission + object state 判定，不再以“是否本人上传”单独设门槛。 | 9/19 R1 + CN11 明确 Superseded/禁止恢复 + 后续 IA/9/22 无恢复 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B2-03 | PDM-02 | P02-B2-03 | 用户确认：旧“进入内部模式即自动获得全部敏感操作权限”明确废弃，不得恢复。 | 内部模式仅为内部工具投影；各敏感动作继续逐项鉴权。 | 9/19 R1 + CN11 明确 Superseded/禁止恢复 + 后续 IA/9/22 无恢复 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B2-05 | PDM-02 | P02-B2-05 | 用户确认：旧“建立4S店组织层级”明确废弃，不得恢复。 | 4S 成员为合作员工账号，合作范围通过权限与 data scope 表达。 | 9/19 R1 + CN11 明确 Superseded/禁止恢复 + 后续 IA/9/22 无恢复 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B2-06 | PDM-02 | P02-B2-06 | 用户确认：旧“同一员工同时挂多个正式主归属门店”明确废弃，不得恢复。 | 名邦员工同一时刻仅一个主归属门店；跨店能力由 permission + data scope 表达。 | 9/19 R1 + CN11 明确 Superseded/禁止恢复 + 后续 IA/9/22 无恢复 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B2-07 | PDM-02 | P02-B2-07 | 用户确认：旧“员工可自提权、扩大自身范围或通过中间人越级授权”明确废弃，不得恢复。 | 本人权限调整须由另一名具足够授权边界的 active 管理者执行。 | 9/19 R1 + CN11 明确 Superseded/禁止恢复 + 后续 IA/9/22 无恢复 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B2-08 | PDM-02 | P02-B2-08 | 用户确认：旧“员工离职后重新入职新建 employee_id”明确废弃，不得恢复。 | 同一真人复用原 employee_id，重新授权，不自动恢复旧权限/客户/业务。 | 9/19 R1 + CN11 明确 Superseded/禁止恢复 + 后续 IA/9/22 无恢复 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B2-09 | PDM-02 | P02-B2-09 | 用户确认：旧“角色变化时新建员工账号”明确废弃，不得恢复。 | 角色变更继续沿用原 employee_id，仅更新当前 role/permission/data scope。 | 9/19 R1 + CN11 明确 Superseded/禁止恢复 + 后续 IA/9/22 无恢复 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B2-10 | PDM-02 | P02-B2-10 | 用户确认：旧“员工角色变化后回写历史操作角色为当前角色”明确废弃，不得恢复。 | 历史保留事件发生当时的角色、门店与责任事实。 | 9/19 R1 + CN11 明确 Superseded/禁止恢复 + 后续 IA/9/22 无恢复 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B2-11 | PDM-02 | P02-B2-11 | 用户确认：旧“为4S成员建设独立4S App / 独立4S IA”明确废弃，不得恢复。 | 4S 成员继续共用员工端并按角色、permission、data scope 裁剪。 | 9/19 R1 + CN11 明确 Superseded/禁止恢复 + 后续 IA/9/22 无恢复 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B2-12 | PDM-02 | P02-B2-12 | 用户确认：旧“普通员工/经理/店长直接管理System Admin账号”明确废弃，不得恢复。 | System Admin 账号仅由 active System Admin 管理。 | 9/19 R1 + CN11 明确 Superseded/禁止恢复 + 后续 IA/9/22 无恢复 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B2-13 | PDM-02 | P02-B2-13 | 用户确认：旧“V1在System Admin上再增加超级管理员/Owner第二层级”明确废弃，不得恢复。 | System Admin 自身采用 active/inactive + 至少一名 active 的治理模型。 | 9/19 R1 + CN11 明确 Superseded/禁止恢复 + 后续 IA/9/22 无恢复 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B2-14 | PDM-02 | P02-B2-14 | 用户确认：旧“接客池无人时由System Admin兜底销售/客户负责人”明确废弃，不得恢复。 | System Admin 不承担销售业务；接客池可用性通过员工接客资格与运营保护解决。 | 9/19 R1 + CN11 明确 Superseded/禁止恢复 + 后续 IA/9/22 无恢复 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-GATE-B2 | PDM-02 | Batch 2 Gate | 用户完成 PDM-02 Batch 2 全部裁决：B2-02 撤回并由 P02-A16 反转替代；B2-04 单独确认；其余 B2-01、B2-03、B2-05～B2-14 全部确认。 | Batch 2 门禁通过；允许进入 Batch 3，但不得自动批准 Batch 3。 | P02-B2-01～B2-14 + P02-A16/A17 + 2026-09-24 用户明确确认 | 2026-09-24 |
| PDM02-DEC-A18 | PDM-02 | P02-A18 | 用户确认：一个 4S 成员账号直接代表一家合作 4S 店/合作主体；不建设 4S 店组织层级，不引入 cooperation scope。4S 账号的新增、启用、停用、基础资料维护及允许范围内的业务 permission 配置，由名邦后台具备相应管理权限的 active 内部管理人员执行；4S 成员本人不得管理其他 4S 账号。System Admin 身份不因系统身份自动获得该业务管理能力。 | 主动替代 Phase1.5 D7 中“按 cooperation scope 管理 4S 账号”的表达；继续保留 hard DENY：任何后台授权不得绕过 4S 禁止能力，例如名邦内部价/批发价查看。 | Phase1.5 D7=A + P02-A06/A10/A16/A17 + 2026-09-24 用户明确说明“一个4S成员基本代表一家店，不需要合作范围，后台直接设置”并确认同意 | 2026-09-24 |
| PDM02-GATE-B3 | PDM-02 | Batch 3 Gate | 用户完成 PDM-02 Batch 3 全部裁决：A16 内部价/批发价独立 permission、A17 System Admin 权限来源/首次初始化、A18 4S 单账号代表单合作主体且后台统一管理，均已确认。 | Batch 3 门禁通过；允许准备 Batch 4，但不得自动批准 Batch 4。 | P02-A16～P02-A18 + 2026-09-24 用户明确确认 | 2026-09-24 |
| PDM02-DEC-A19 | PDM-02 | P02-A19 | 用户修正 System Admin 模型：System Admin 是系统治理/控制平面账号，不参与销售业务执行，但拥有员工与合作账号治理的最高配置能力，可新增/启用/停用员工及4S账号、设置普通销售/经理/店长/4S主角色、任命/取消店长、配置角色模板、授予/撤销员工允许的业务 permission、设置 data scope、配置接客资格/状态等管理项。System Admin 自身不因配置权自动获得任何员工业务执行权；同一真人需要做 CRM/车辆/Lock/Transaction 等业务时仍使用独立员工身份。产品级 hard DENY 不得被 System Admin 配置绕过，全部治理变更必须审计。 | 主动修正 P02-A17 中“员工业务权限必须由另一名 active 员工管理者配置”的过度限制；修正 P02-A18 中“System Admin 不自动获得4S账号管理能力”的表述：System Admin 可作为控制平面管理4S账号及允许权限，但不因此成为4S/销售业务执行者；B2-04 继续有效，其准确含义为“System Admin 不自动拥有员工业务执行权限”。 | P02-A03/A04/B2-04/A17/A18 + 2026-09-24 用户明确指出“Admin不参与接客销售，但必须能设置这些权限”并确认同意 | 2026-09-24 |
| PDM02-DEC-B4-02 | PDM-02 | P02-B4-02 | 用户确认通过 A19 关闭“谁能新增/任命/管理店长”的死口：由 System Admin 控制平面直接设置/取消员工店长角色；店长本人无需承担“任命其他店长”的最高治理职责；System Admin 设置店长角色不等于其自身获得店长业务身份。 | 原候选 `employee.store_manager.manage` 由店长管理其他店长不再采用；首个及后续店长均可由 System Admin 治理入口配置。 | P02-A19 + 2026-09-24 用户确认 | 2026-09-24 |
| PDM02-DEC-B4-01 | PDM-02 | P02-B4-01 | 用户确认经理/店长员工管理边界：经理默认不拥有完整员工账号生命周期权；只有在具备对应员工管理 permission 且团队 data scope 覆盖时，才可执行下属接客、交接、人员状态类管理动作。店长拥有本店 P04 员工管理入口，可新增员工、处理在职/离职、普通销售↔经理、接客与数据范围；敏感业务 permission 仍独立授权。 | 与 P02-A19 并行：System Admin 仍是最高治理控制平面，可配置角色、permission 与 data scope。 | 9/19 R1 + CN11/Phase1.5/IA 当前证据 + P02-A19（适用处）+ 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B4-03 | PDM-02 | P02-B4-03 | 用户确认角色模板采用“实时默认”机制：System Admin 在 P04 配置角色模板后，模板新增/取消默认 permission 实时作用于现有同角色员工；员工个人明确授权/禁用继续覆盖，hard DENY 优先；若模板降权会使员工失去在办业务所需资格，先交接再正式生效。 | 产品基线不硬编码完整默认 permission 种子清单，仅冻结 hard DENY、最小角色边界与角色模板实时生效机制。 | 9/19 R1 + CN11/Phase1.5/IA 当前证据 + P02-A19（适用处）+ 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B4-04 | PDM-02 | P02-B4-04 | 用户确认接客池异常为空处理：正常操作继续禁止关闭/停用最后一名合格接客员工；若因突发 inactive/资格失效等异常导致 active+eligible+accepting 池为 0，Customer 身份仍可建立，但进入 owner_assignment_pending/异常待分配，不创建无负责人正式人工业务，不以 System Admin 或 null 负责人兜底；恢复可用接客池后自动重新尝试分配 owner，并记录告警/审计。 | 这是 PDM-01 A04 自然注册即时分配规则的异常兜底分支，不改变正常情况下首次进入立即形成唯一 owner 的规则。 | 9/19 R1 + CN11/Phase1.5/IA 当前证据 + P02-A19（适用处）+ 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B4-05 | PDM-02 | P02-B4-05 | 用户确认新增独立 customer.phone.manage capability：active 名邦员工只有在具备该 permission 且 Customer 位于其 data scope 内时，才可新增、修改、失效客户“其他联系电话”；4S hard DENY；全部变更留审计。 | 该 capability 不默认允许修改主要手机号；主要手机号更换继续遵守 PDM-01 的客户正式授权/绑定与身份连续性规则。 | 9/19 R1 + CN11/Phase1.5/IA 当前证据 + P02-A19（适用处）+ 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-DEC-B4-06 | PDM-02 | P02-B4-06 | 用户确认 4S 默认不进入 PC 业务后台；仅当 System Admin 明确授予 4S 的 PC 车辆管理能力时，才开放该 4S 账号对应有权 4S 车辆的 P02 裁剪投影。 | 4S 对 P04/P05/名邦 CRM/Lock/Transaction/名邦内部价/批发价/一键转名邦继续 hard DENY；不得通过后台授权绕过。 | 9/19 R1 + CN11/Phase1.5/IA 当前证据 + P02-A19（适用处）+ 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM02-GATE-B4 | PDM-02 | Batch 4 Gate | 用户已完成 PDM-02 Batch 4 全部六项裁决：B4-02 已由 P02-A19 提前关闭，B4-01/B4-03/B4-04/B4-05/B4-06 本轮明确全部同意。 | Batch 4 门禁通过；PDM-02 四批用户审查全部完成，进入最终完整规则总览待用户最终批准。 | P02-B4-01～P02-B4-06 + P02-A19 + 2026-09-24 用户明确确认 | 2026-09-24 |
| PDM02-GATE-FINAL | PDM-02 | Final Domain Overview | 用户最终批准 PDM-02《最终完整规则总览》；并特别确认普通销售、经理、店长均可参与接客，经理/店长满足 active + eligible + accepting 时可进入接客池并成为 Customer owner；4S 与 System Admin 不进入接客池。 | PDM-02 四批门禁与最终总览全部通过，正式标记 COMPLETE；生成 `PDM-02_最终完整规则.md`，允许进入 PDM-03。 | `PDM-02_最终完整规则总览_待用户批准.md` + 2026-09-24 用户明确“别的都没问题了，直接确认” | 2026-09-24 |
| PDM03-DEC-A01 | PDM-03 | P03-A01 | 用户确认 PDM-03 Batch 1 稳定一致项 P03-A01 按工作版候选规则成立。 | 无自动扩展；后续 Batch 若发现真实冲突必须重新提交用户裁决。 | PDM-03 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“没问题，进行下一步” | 2026-09-24 |
| PDM03-DEC-A02 | PDM-03 | P03-A02 | 用户确认 PDM-03 Batch 1 稳定一致项 P03-A02 按工作版候选规则成立。 | 无自动扩展；后续 Batch 若发现真实冲突必须重新提交用户裁决。 | PDM-03 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“没问题，进行下一步” | 2026-09-24 |
| PDM03-DEC-A03 | PDM-03 | P03-A03 | 用户确认 PDM-03 Batch 1 稳定一致项 P03-A03 按工作版候选规则成立。 | 无自动扩展；后续 Batch 若发现真实冲突必须重新提交用户裁决。 | PDM-03 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“没问题，进行下一步” | 2026-09-24 |
| PDM03-DEC-A04 | PDM-03 | P03-A04 | 用户确认 PDM-03 Batch 1 稳定一致项 P03-A04 按工作版候选规则成立。 | 无自动扩展；后续 Batch 若发现真实冲突必须重新提交用户裁决。 | PDM-03 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“没问题，进行下一步” | 2026-09-24 |
| PDM03-DEC-A05 | PDM-03 | P03-A05 | 用户确认 PDM-03 Batch 1 稳定一致项 P03-A05 按工作版候选规则成立。 | 无自动扩展；后续 Batch 若发现真实冲突必须重新提交用户裁决。 | PDM-03 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“没问题，进行下一步” | 2026-09-24 |
| PDM03-DEC-A06 | PDM-03 | P03-A06 | 用户确认 PDM-03 Batch 1 稳定一致项 P03-A06 按工作版候选规则成立。 | 无自动扩展；后续 Batch 若发现真实冲突必须重新提交用户裁决。 | PDM-03 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“没问题，进行下一步” | 2026-09-24 |
| PDM03-DEC-A07 | PDM-03 | P03-A07 | 用户确认 PDM-03 Batch 1 稳定一致项 P03-A07 按工作版候选规则成立。 | 无自动扩展；后续 Batch 若发现真实冲突必须重新提交用户裁决。 | PDM-03 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“没问题，进行下一步” | 2026-09-24 |
| PDM03-DEC-A08 | PDM-03 | P03-A08 | 用户确认 PDM-03 Batch 1 稳定一致项 P03-A08 按工作版候选规则成立。 | 无自动扩展；后续 Batch 若发现真实冲突必须重新提交用户裁决。 | PDM-03 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“没问题，进行下一步” | 2026-09-24 |
| PDM03-DEC-A09 | PDM-03 | P03-A09 | 用户确认 PDM-03 Batch 1 稳定一致项 P03-A09 按工作版候选规则成立。 | 无自动扩展；后续 Batch 若发现真实冲突必须重新提交用户裁决。 | PDM-03 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“没问题，进行下一步” | 2026-09-24 |
| PDM03-DEC-A10 | PDM-03 | P03-A10 | 用户确认 PDM-03 Batch 1 稳定一致项 P03-A10 按工作版候选规则成立。 | 无自动扩展；后续 Batch 若发现真实冲突必须重新提交用户裁决。 | PDM-03 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“没问题，进行下一步” | 2026-09-24 |
| PDM03-DEC-A11 | PDM-03 | P03-A11 | 用户确认 PDM-03 Batch 1 稳定一致项 P03-A11 按工作版候选规则成立。 | 无自动扩展；后续 Batch 若发现真实冲突必须重新提交用户裁决。 | PDM-03 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“没问题，进行下一步” | 2026-09-24 |
| PDM03-DEC-A12 | PDM-03 | P03-A12 | 用户确认 PDM-03 Batch 1 稳定一致项 P03-A12 按工作版候选规则成立。 | 无自动扩展；后续 Batch 若发现真实冲突必须重新提交用户裁决。 | PDM-03 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“没问题，进行下一步” | 2026-09-24 |
| PDM03-DEC-A13 | PDM-03 | P03-A13 | 用户确认 PDM-03 Batch 1 稳定一致项 P03-A13 按工作版候选规则成立。 | 无自动扩展；后续 Batch 若发现真实冲突必须重新提交用户裁决。 | PDM-03 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“没问题，进行下一步” | 2026-09-24 |
| PDM03-GATE-B1 | PDM-03 | Batch 1 Gate | 用户确认 P03-A01～P03-A13 全部通过。 | Batch 1 门禁关闭，允许进入 Batch 2；不得自动批准 Batch 2。 | PDM-03 Batch 1 工作版 + 2026-09-24 用户明确确认 | 2026-09-24 |
| PDM03-DEC-B2-01 | PDM-03 | P03-B2-01 | 用户确认：旧“首次进入只建立 customer_id、不形成 owner，等首次人工服务事件再分配”不得恢复。 | 采用 PDM-01 已冻结 P01-A04：无有效销售分享/直接转介绍等优先归属来源时，新 Customer 建立/识别后立即从 active+eligible+accepting 接客池自动轮询形成唯一 current owner。 | PDM-03 Batch 2 当前 GitHub 证据链 + 2026-09-24 用户明确“全部确认” | 2026-09-24 |
| PDM03-DEC-B2-02 | PDM-03 | P03-B2-02 | 用户确认：旧“最后点击哪个销售分享链接就覆盖已有 current owner / 最后分享者抢客”不得恢复。 | 已有 owner 的客户点击其他员工分享只新增来源/触达事实，不改变 owner。 | PDM-03 Batch 2 当前 GitHub 证据链 + 2026-09-24 用户明确“全部确认” | 2026-09-24 |
| PDM03-DEC-B2-03 | PDM-03 | P03-B2-03 | 用户确认：旧“把原始来源、来源销售与 current owner 合成同一事实，owner 变化后反写原始来源”不得恢复。 | 来源事实与 owner 分离，owner 可变化但历史来源不可改写。 | PDM-03 Batch 2 当前 GitHub 证据链 + 2026-09-24 用户明确“全部确认” | 2026-09-24 |
| PDM03-DEC-B2-04 | PDM-03 | P03-B2-04 | 用户确认：旧“老客户转介绍永远跟历史 owner / 最初销售”不得恢复。 | 明确直接转介绍按事件发生时推荐人的 current owner 承接。 | PDM-03 Batch 2 当前 GitHub 证据链 + 2026-09-24 用户明确“全部确认” | 2026-09-24 |
| PDM03-DEC-B2-05 | PDM-03 | P03-B2-05 | 用户确认：旧“关闭接客/短期休假自动转走已有客户”不得恢复。 | 关闭接客只退出未来自然轮询，已有客户不自动转走。 | PDM-03 Batch 2 当前 GitHub 证据链 + 2026-09-24 用户明确“全部确认” | 2026-09-24 |
| PDM03-DEC-B2-06 | PDM-03 | P03-B2-06 | 用户确认：旧“inactive/离职员工继续承接新 Customer owner”不得恢复。 | 离职/失去资格后只保留历史来源与贡献，新 owner 需合法产生。 | PDM-03 Batch 2 当前 GitHub 证据链 + 2026-09-24 用户明确“全部确认” | 2026-09-24 |
| PDM03-DEC-B2-07 | PDM-03 | P03-B2-07 | 用户确认：旧“普通销售可自行抢走或直接修改他人 Customer owner”不得恢复。 | 正式 owner 移交/冲突仲裁必须由具备权限且范围覆盖的管理者执行并审计。 | PDM-03 Batch 2 当前 GitHub 证据链 + 2026-09-24 用户明确“全部确认” | 2026-09-24 |
| PDM03-DEC-B2-08 | PDM-03 | P03-B2-08 | 用户确认：旧“Customer owner 一变化就自动漂移全部业务负责人”不得恢复。 | Customer owner 与具体业务负责人分层，普通 owner change 不自动改 Demand/Consultation/Waitlist/Lock/Transaction 等负责人。 | PDM-03 Batch 2 当前 GitHub 证据链 + 2026-09-24 用户明确“全部确认” | 2026-09-24 |
| PDM03-DEC-B2-09 | PDM-03 | P03-B2-09 | 用户确认：V1 不建设多级转介绍客户归属、返佣/奖励/积分/裂变等级体系。 | 只保留直接推荐关系和必要来源事实。 | PDM-03 Batch 2 当前 GitHub 证据链 + 2026-09-24 用户明确“全部确认” | 2026-09-24 |
| PDM03-GATE-B2 | PDM-03 | Batch 2 Gate | 用户确认 P03-B2-01～P03-B2-09 全部通过。 | Batch 2 门禁关闭，允许进入 Batch 3；不得自动批准 Batch 3。 | PDM-03 Batch 2 工作版 + 2026-09-24 用户明确“全部确认” | 2026-09-24 |
| PDM03-DEC-A15 | PDM-03 | P03-A15 | 用户主动修正：客户车源分享本身可作为转介绍/获客归属链。对尚无正式 owner 的新客户 B，A 分享车源链接给 B，B 通过该链接进入后，按该分享链实际绑定的销售建立 B 的 current owner，并保留 A→B 的来源/推荐关系；A 转发张三绑定链接则 B 归张三，转发李四绑定链接则 B 归李四；A 使用自己的客户分享链接时，也记录 A 为来源客户/间接推荐人，并按该客户分享链对应销售归属 B。已有正式 owner 的老客户不得被后续分享抢走。 | 主动覆盖 P01-A04 / PDM01-DEC-A04 中“普通客户侧车辆转发仅 SOURCE_ONLY、不据此分配 owner”的旧边界；不覆盖 P03-A03/B2-02 的“已有 owner 不抢客”。分享后逐车可见/Recommendation 权益仍留 PDM-14。A 分享后、B 进入前若 A owner 改变时旧链接的销售绑定时点留 PDM-03 Batch 4。 | 2026-09-24 用户明确说明 A→B 分享张三链接归张三、分享李四链接归李四，并要求保留 A-B 推荐关系与同销售服务链 | 2026-09-24 |
| PDM01-SUPERSEDE-A04-SHARE | PDM-01 / PDM-03 | P01-A04 分享子句 / P03-A15 | 用户在 PDM-03 明确反转 P01-A04 的“普通客户侧车辆转发仅 SOURCE_ONLY”子句：客户车源分享对尚无 owner 的新客户可形成转介绍/销售归属，按分享链实际绑定销售建立 owner，并保留分享客户关系。 | P01-A04 的“自然注册立即轮询”“直接转介绍优先”等其余部分继续有效；仅 SOURCE_ONLY 子句被 P03-A15 替代。已有 owner 不抢客继续有效。 | PDM03-DEC-A15 + 2026-09-24 用户显式跨域修正 | 2026-09-24 |
| PDM03-DEC-A14 | PDM-03 | P03-A14 | 用户确认：无更高优先归属来源时，新 Customer 建立/识别 customer_id 后立即进入 active + eligible + accepting 接客池自动轮询形成唯一 current owner；有效分享/转介绍归属优先于普通自然轮询。 | 继续承接 PDM-01 P01-A04；不得恢复“首次进入只建身份、等首次人工服务才分配 owner”。 | PDM-01 P01-A04 + PDM03-B2-01 + 2026-09-24 用户明确“A14同意” | 2026-09-24 |
| PDM03-DEC-A16 | PDM-03 | P03-A16 | 用户确认：正常运营必须保持至少一名 active + eligible + accepting 合格接客员工；若因突发 inactive/资格失效导致接客池被动为0，新 Customer 身份仍可建立，在没有其他优先归属来源时进入 owner_assignment_pending；不得用 System Admin 或 responsible=null 兜底正式业务；不得创建无负责人正式人工服务对象；池恢复后自动重试 owner 分配并留告警/审计。 | 承接 PDM-02 §10.1；不改变正常池可用时即时形成 owner。 | PDM-02 最终规则 §10.1 + 2026-09-24 用户明确“A16同意” | 2026-09-24 |
| PDM03-GATE-B3 | PDM-03 | Batch 3 Gate | 用户已确认 P03-A14、P03-A16；P03-A15 已在前一轮由用户主动改写并确认。 | Batch 3 三项全部完成，允许进入 Batch 4；不得自动批准 Batch 4。 | P03-A14～A16 + 2026-09-24 用户明确“十四十六都同意” | 2026-09-24 |
| PDM03-DEC-B4-01 | PDM-03 | P03-B4-01 | 用户确认分享链按两类解析：明确绑定员工 S 的销售分享上下文，对 ownerless 新客户按 S 承接；客户 A 自己的分享上下文若无额外员工绑定，则在新客户有效进入时按 A 当时的 current owner 承接。A 后续正式转交后，A 旧客户分享链接继续有效，并跟随 A 的当前 owner，而非永久锁死历史销售。 | 明确销售绑定链接与客户自有分享链不得混成同一种解析逻辑；已有 owner 客户仍不得被分享抢走。 | PDM-03 Batch 4 当前 GitHub 证据链 + 2026-09-24 用户明确“这个问题同意” | 2026-09-24 |
| PDM03-DEC-B4-02 | PDM-03 | P03-B4-02 | 用户确认客户分享必须同时保留分享客户关系与销售承接事实：至少可追溯 source_customer、分享/推荐事件、有效 sales binding/解析来源。对新客户可据此形成 owner；对已有 owner 客户只增加 A→B 分享/推荐与来源触达事实，不改变 current owner。 | 产品层不写死 URL/token 技术格式；不得把来源客户与实际承接销售压成同一字段。 | PDM-03 Batch 4 当前 GitHub 证据链 + 2026-09-24 用户明确“这个问题同意” | 2026-09-24 |
| PDM03-DEC-B4-03 | PDM-03 | P03-B4-03 | 用户确认分享链绑定销售在新客户进入前若离职/inactive/失去资格：链接仍可打开并保留来源事实；有明确合法接替人则新客户归接替人；无接替人则进入合格接客池；池异常为空则进入 owner_assignment_pending。仅关闭 accepting、但仍 active+eligible 时，不影响主动分享获客。 | 失效销售不得继续成为新的 Customer owner；历史来源不得因离职被删除。 | PDM-03 Batch 4 当前 GitHub 证据链 + 2026-09-24 用户明确“这个问题同意” | 2026-09-24 |
| PDM03-DEC-B4-04 | PDM-03 | P03-B4-04 | 用户确认 ownerless 新客户首次进入时，必须先解析有效分享/推荐归属，再决定是否进入自然轮询；存在合法 share/referral owner 时不执行普通轮询；仅无有效优先归属时执行自然轮询。owner 一旦形成，重复打开、刷新、重试及后续其他分享必须幂等，不得再次改 owner。 | 关闭分享归属与自然轮询并发抢 owner 的缺口。 | PDM-03 Batch 4 当前 GitHub 证据链 + 2026-09-24 用户明确“这个问题同意” | 2026-09-24 |
| PDM03-GATE-B4 | PDM-03 | Batch 4 Gate | 用户确认 P03-B4-01～P03-B4-04 全部通过。 | PDM-03 四批用户审查全部完成，进入最终完整规则总览待用户最终批准；不得自动标记 COMPLETE。 | PDM-03 Batch 4 工作版 + 2026-09-24 用户明确确认 | 2026-09-24 |
| PDM03-GATE-FINAL | PDM-03 | Final Domain Overview | 用户最终批准 PDM-03《最终完整规则总览》。 | PDM-03 四批门禁与最终总览全部通过，正式标记 COMPLETE；生成 `PDM-03_最终完整规则.md`，允许进入 PDM-04。 | `PDM-03_最终完整规则总览_待用户批准.md` + 2026-09-24 用户明确“同意” | 2026-09-24 |
| PDM04-DEC-A01 | PDM-04 | P04-A01 | 用户确认：V1 车源类型保持三类：批发/JYT、名邦、4S合作。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-DEC-A02 | PDM-04 | P04-A02 | 用户确认：车辆真实资源状态、平台展示状态、业务占用状态分层，不合并成一个巨大 vehicle_status。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-DEC-A03 | PDM-04 | P04-A03 | 用户确认：JYT 上游原始车辆事实与原始价格只读；同步不得覆盖名邦本地业务事实。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-DEC-A04 | PDM-04 | P04-A04 | 用户确认：JYT 导入/普通同步由上游集成服务执行并留来源、时间、处理结果日志，不虚构人工逐车操作者。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-DEC-A05 | PDM-04 | P04-A05 | 用户确认：同一 car_code 正常复用既有车辆身份；核心身份冲突进入异常/人工核验，不静默覆盖。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-DEC-A06 | PDM-04 | P04-A06 | 用户确认：上游真实下架后批发车退出正常可售，但已有 Lock/Transaction 等正式历史或进行中业务事实不得直接删除。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-DEC-A07 | PDM-04 | P04-A07 | 用户确认：hidden 与真实下架/offline 分离；普通上游更新不得自动解除人工 hidden。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-DEC-A08 | PDM-04 | P04-A08 | 用户确认：只有真实不可售/失效后再次真实可售才新建 listing_cycle；hidden/编辑/改价不新建。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-DEC-A09 | PDM-04 | P04-A09 | 用户确认：同一人工名邦/4S车真实 relist 复用原 vehicle_id，新建 listing_cycle。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-DEC-A10 | PDM-04 | P04-A10 | 用户确认：一键转名邦保留原 wholesale vehicle，创建新 Mingbang vehicle，并以永久 conversion relation 关联；重复/并发转换复用既有 target。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-DEC-A11 | PDM-04 | P04-A11 | 用户确认：已转名邦的原批发记录退出可售，不能因后续 JYT 同步/重新出现/普通 relist 规则复活为可售批发车。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-DEC-A12 | PDM-04 | P04-A12 | 用户确认：不做无可靠依据的跨来源自动 merge；明确业务关系用显式 relation 保存。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-DEC-A13 | PDM-04 | P04-A13 | 用户确认：4S 周期性在售确认机制取消，不恢复。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-DEC-A14 | PDM-04 | P04-A14 | 用户确认：4S 成员 inactive/停止合作后，其当前负责在售车先暂停展示/匹配，存量业务不自动取消，可交接恢复且不重建 vehicle。 | 后续若发现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-04 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“全部都同意” | 2026-09-24 |
| PDM04-GATE-B1 | PDM-04 | Batch 1 Gate | 用户确认 P04-A01～P04-A14 全部通过。 | Batch 1 门禁关闭，允许进入 Batch 2；不得自动批准 Batch 2。 | PDM-04 Batch 1 工作版 + 2026-09-24 用户明确确认 | 2026-09-24 |
| PDM04-DEC-B2-01 | PDM-04 | P04-B2-01 | 用户确认：旧“一个巨大 vehicle_status 表达全部状态”不得恢复。 | 资源状态、平台 visible/hidden、业务占用分层。 | PDM-04 Batch 2 + 2026-09-24 用户明确“其他的我也没有争议，都觉得可以”，并授权对与 B2-05 冲突项自行同步调整 | 2026-09-24 |
| PDM04-DEC-B2-02 | PDM-04 | P04-B2-02 | 用户确认：旧“hidden=offline / hidden恢复就新建 listing_cycle”不得恢复。 | hidden 只影响平台公开性，恢复继续原 cycle。 | PDM-04 Batch 2 + 2026-09-24 用户明确“其他的我也没有争议，都觉得可以”，并授权对与 B2-05 冲突项自行同步调整 | 2026-09-24 |
| PDM04-DEC-B2-03 | PDM-04 | P04-B2-03 | 用户确认：旧“普通编辑/改价/资料更新也算重新上架”不得恢复。 | 只有真实不可售→再次真实可售才开启新 cycle。 | PDM-04 Batch 2 + 2026-09-24 用户明确“其他的我也没有争议，都觉得可以”，并授权对与 B2-05 冲突项自行同步调整 | 2026-09-24 |
| PDM04-DEC-B2-04 | PDM-04 | P04-B2-04 | 用户确认：旧“同一人工车 relist 新建第二个 vehicle_id”不得恢复。 | 确认同一真实车辆后复用原 vehicle_id，只开新 listing_cycle。 | PDM-04 Batch 2 + 2026-09-24 用户明确“其他的我也没有争议，都觉得可以”，并授权对与 B2-05 冲突项自行同步调整 | 2026-09-24 |
| PDM04-DEC-B2-06 | PDM-04 | P04-B2-06 | 用户确认：旧“重复/并发一键转名邦可制造第二、第三条车辆记录”不得恢复。 | 采用同 vehicle_id 来源转换后，转换必须幂等；一旦已转为名邦，再次执行不得重复创建车辆、不得重复转换。 | PDM-04 Batch 2 + 2026-09-24 用户明确“其他的我也没有争议，都觉得可以”，并授权对与 B2-05 冲突项自行同步调整 | 2026-09-24 |
| PDM04-DEC-B2-07 | PDM-04 | P04-B2-07 | 用户确认：旧“已完成批发→名邦转换的同一 car_code 可因 JYT 后续同步/重新出现再次变成批发在售”不得恢复。 | 同 vehicle_id 转名邦后永久保留 JYT lineage/原 car_code 与 conversion 历史；JYT 后续同 car_code 仅可记录/更新允许保留的来源事实，不得把该 vehicle 恢复为批发在售，也不得再创建新的批发 vehicle。核心身份明显冲突则进入人工核验。 | PDM-04 Batch 2 + 2026-09-24 用户明确“其他的我也没有争议，都觉得可以”，并授权对与 B2-05 冲突项自行同步调整 | 2026-09-24 |
| PDM04-DEC-B2-08 | PDM-04 | P04-B2-08 | 用户确认：旧“人工 hidden 的批发车因普通上游更新自动恢复公开”不得恢复。 | 上游可更新来源事实，但不能解除名邦本地 hidden。 | PDM-04 Batch 2 + 2026-09-24 用户明确“其他的我也没有争议，都觉得可以”，并授权对与 B2-05 冲突项自行同步调整 | 2026-09-24 |
| PDM04-DEC-B2-09 | PDM-04 | P04-B2-09 | 用户确认：旧“普通名邦员工可人工修改 JYT 原始车辆事实/原始价格”不得恢复。 | JYT 来源事实保持只读。 | PDM-04 Batch 2 + 2026-09-24 用户明确“其他的我也没有争议，都觉得可以”，并授权对与 B2-05 冲突项自行同步调整 | 2026-09-24 |
| PDM04-DEC-B2-10 | PDM-04 | P04-B2-10 | 用户确认：旧“无可靠唯一身份时仅凭车型/年款/里程/图片相似自动跨来源 merge”不得恢复。 | 不做模糊跨来源自动合并。 | PDM-04 Batch 2 + 2026-09-24 用户明确“其他的我也没有争议，都觉得可以”，并授权对与 B2-05 冲突项自行同步调整 | 2026-09-24 |
| PDM04-DEC-B2-11 | PDM-04 | P04-B2-11 | 用户确认：旧“恢复 4S 周期性在售确认、超期暂停、名邦代确认”不得恢复。 | 4S 车辆状态只因真实业务事件变化。 | PDM-04 Batch 2 + 2026-09-24 用户明确“其他的我也没有争议，都觉得可以”，并授权对与 B2-05 冲突项自行同步调整 | 2026-09-24 |
| PDM04-DEC-B2-12 | PDM-04 | P04-B2-12 | 用户确认：旧“只有 4S 成员停用后名邦才第一次获得车辆编辑/管理能力”不得恢复。 | 管理能力始终由身份、permission、data scope、object state 判定；停用后只是责任交接。 | PDM-04 Batch 2 + 2026-09-24 用户明确“其他的我也没有争议，都觉得可以”，并授权对与 B2-05 冲突项自行同步调整 | 2026-09-24 |
| PDM04-DEC-B2-13 | PDM-04 | P04-B2-13 | 用户确认：旧“一键转名邦先生成草稿、再人工二次发布”不得恢复。 | 一键转换本身不是两步发布工作流。 | PDM-04 Batch 2 + 2026-09-24 用户明确“其他的我也没有争议，都觉得可以”，并授权对与 B2-05 冲突项自行同步调整 | 2026-09-24 |
| PDM04-WITHDRAW-B2-05 | PDM-04 | P04-B2-05 | 用户撤回 B2-05 原“禁止原 wholesale vehicle 直接改为 Mingbang”的废弃判断。 | 改为 P04-A15：一键转名邦采用**同一 vehicle_id 来源转换**，不再创建第二个 Mingbang vehicle；永久保留 JYT 来源 lineage、car_code、转换前事实/快照、转换时间与操作人。 | 2026-09-24 用户明确要求 B2-05 按同 vehicle_id 方案改动 | 2026-09-24 |
| PDM04-DEC-A15 | PDM-04 | P04-A15 | 用户主动修改：批发→名邦一键转换采用**同一 vehicle_id**。转换后该 vehicle 的当前来源类型成为名邦，原 JYT car_code、上游来源事实、转换前来源快照、converted_at/operator 等作为永久历史保留；不再保留第二条可售 wholesale vehicle，也不建立第二个 Mingbang vehicle。 | 显式覆盖 P04-A10 的“双 vehicle + conversion relation”模型，并局部覆盖 P04-A11/P04-A12 中依赖双 vehicle 的表述。 | 2026-09-24 用户明确选择“直接从批发改到名邦，不需要批发再留一条资料记录” | 2026-09-24 |
| PDM04-DEC-A16 | PDM-04 | P04-A16 | 用户确认：已存在有效 Lock 的批发车允许直接一键转名邦；因为 vehicle_id 不变，原 Lock、客户、负责人、价格快照及后续业务继续绑定同一 vehicle，不做跨 vehicle 迁移。 | 明确推翻 CN11 DEC-072 中“locked 状态禁止一键转名邦”的旧限制；trading/completed 是否允许转换不在本条扩大，留 Batch 4。 | 2026-09-24 用户明确提出“车已经被锁定后直接转为名邦更方便后续记录和操作”，并确认按同 vehicle_id 方案改动 | 2026-09-24 |
| PDM04-SUPERSEDE-A10-A11 | PDM-04 | P04-A10 / P04-A11 / P04-A12局部 | 用户在 Batch 2 主动改写一键转名邦底层模型。 | P04-A10“双 vehicle + conversion relation”整体被 P04-A15 替代；P04-A11 保留“JYT 后续不得复活批发在售”的业务结果，但改为同 vehicle_id + car_code 转换抑制；P04-A12 继续保留“禁止模糊跨来源自动 merge”，但不再以 wholesale→Mingbang 两 vehicle relation 作为示例。 | PDM04-DEC-A15 + 用户授权同步调整冲突项 | 2026-09-24 |
| PDM04-GATE-B2 | PDM-04 | Batch 2 Gate | 用户确认除原 B2-05 外其余 Batch 2 项均无争议；B2-05 撤回并由 P04-A15 同 vehicle_id 转换规则替代，B2-06/B2-07 已同步改写后确认。 | Batch 2 门禁关闭，允许进入 Batch 3；不得自动批准 Batch 3 未经用户确认的新项。 | 2026-09-24 用户明确确认并授权冲突项同步修正 | 2026-09-24 |
| PDM04-DEC-A17 | PDM-04 | P04-A17 | 用户确认：正式人工车的 source_type 允许在名邦↔4S之间后续修改；名邦内部员工只要具备该车辆正常管理能力即可通过专门业务动作修改，不限定经理/店长/特殊纠错权限；必须审计前后值、操作人、操作时间，不强制原因；修改后能力按新来源立即重算；4S成员自己上传的车辆固定4S，不能自行改为名邦。 | 批发来源只能由 JYT 集成产生，不能通过普通人工 source_type 编辑得到。 | PDM-04 Batch 3 当前 GitHub 证据链 + 2026-09-24 用户明确“A18按这个来，其他几条也都同意” | 2026-09-24 |
| PDM04-DEC-A18 | PDM-04 | P04-A18 | 用户确认：采集批发车自动隐藏采用独立规则模型。每条规则只按自身配置条件生效；多条规则之间 OR，命中任意一条即 hidden。可分别建立“赤峰”“沃尔沃”“S90/S60”等独立全国/地区规则；同一条规则内不同字段 AND、同字段多个值 OR。规则支持未来采集与存量重算，并记录全部命中规则/原因。 | 自动恢复仅在无其他自动隐藏、无人工 hidden 且车辆真实在售时发生；绝不能把 offline 车辆恢复成重新上架。 | PDM-04 Batch 3 当前 GitHub 证据链 + 2026-09-24 用户明确“A18按这个来，其他几条也都同意” | 2026-09-24 |
| PDM04-DEC-A19 | PDM-04 | P04-A19 | 用户确认：一键转名邦成功后不进入草稿等待二次发布；同一 vehicle 完成来源转换后直接进入名邦可售业务状态。 | 转换前 hidden 如何处理留 Batch 4，不由本条提前决定。 | PDM-04 Batch 3 当前 GitHub 证据链 + 2026-09-24 用户明确“A18按这个来，其他几条也都同意” | 2026-09-24 |
| PDM04-DEC-A20 | PDM-04 | P04-A20 | 用户确认：普通名邦销售执行一键转名邦不设置额外独立 permission；active 名邦员工在目标车辆属于其正常范围且对象状态允许时可执行；4S成员 hard DENY；内部模式仅承载入口，不授予权限。 | 页面位置与交互继续留 PDM-21。 | PDM-04 Batch 3 当前 GitHub 证据链 + 2026-09-24 用户明确“A18按这个来，其他几条也都同意” | 2026-09-24 |
| PDM04-GATE-B3 | PDM-04 | Batch 3 Gate | P04-A15/A16 已提前用户确认；本轮用户确认 P04-A17～P04-A20。 | Batch 3 六项全部完成，允许进入 Batch 4；不得自动批准 Batch 4。 | PDM-04 Batch 3 工作版 + 2026-09-24 用户明确确认 | 2026-09-24 |

| PDM04-DEC-A18-SOURCE-SCOPE | PDM-04 | P04-A18 | 用户补充确认：自动/批量隐藏规则不再限定只能作用采集批发车。每条规则必须显式配置适用车源范围 source_scope，可多选批发、名邦、4S，至少选择一类；未选择不得生效，且不得默认影响三类全部车源。规则之间 OR，单条规则内不同字段 AND、同字段多个值 OR 的既有组合语义保持不变。车辆 source_type 变化后按新的来源类型重新计算命中。 | 原“采集批发自动隐藏”作为 source_scope=批发 的一种配置继续有效；不得把范围扩展理解为默认三类全选。 | 2026-09-24 用户明确提出并确认 | 2026-09-24 |
| PDM04-DEC-B4-02 | PDM-04 | P04-B4-02 | 用户确认：批发→名邦转换后，自动 hidden 按新的 source_type 和各规则 source_scope 重新计算。仅适用于批发的自动隐藏原因在转名邦后失效；若规则 scope 包含名邦且条件仍命中则继续 hidden；人工 hidden 与其他仍有效 hidden 原因继续保留。只有不存在任何有效 hidden 原因且车辆真实在售时才 visible。 | A19“直接进入名邦可售状态”不等于无条件公开展示；B4-02 正式关闭。 | P04-A07 + P04-A18-SOURCE-SCOPE + 2026-09-24 用户明确“同意” | 2026-09-24 |

| PDM04-DEC-B4-01 | PDM-04 | P04-B4-01 | 用户确认：同一 `vehicle_id` 批发→名邦来源转换继续当前 `listing_cycle`，不因 source conversion 单独新建 cycle；继续沿用原 `listing_started_at` 与本周期业务关联。只有未来发生真实不可售/失效后再次真实可售，才开启新 cycle。 | 承接 P04-A08 与 P04-A15。 | 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM04-DEC-B4-03 | PDM-04 | P04-B4-03 | 用户确认：locked、trading 状态允许在同一 `vehicle_id` 上一键转名邦；既有 Lock / Waitlist / Transaction 继续绑定同一 vehicle，不迁移、不重建、不改历史快照。completed 为终态，不允许再做经营来源转换；Transaction cancelled 且车辆恢复可售后可按正常规则判断转换。 | 旧“双 vehicle 迁移困难”限制不再适用。 | 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM04-DEC-B4-04 | PDM-04 | P04-B4-04 | 用户修改确认：若已转名邦的历史 `car_code` 再出现明显不同核心车辆身份，系统直接自动屏蔽/抑制该冲突上游记录，不进入人工决断。不得公开展示、不得进入正常匹配、不得覆盖原名邦 vehicle、不得恢复原名邦 vehicle 为批发、不得自动创建新的可售批发 vehicle；仅保留冲突/屏蔽日志。 | 用户明确认为该场景基本不会发生，选择简单安全兜底，不建设人工核验出口。 | 2026-09-24 用户明确修改 B4-04 | 2026-09-24 |
| PDM04-DEC-B4-05 | PDM-04 | P04-B4-05 | 用户确认：批发→名邦的一键转换为单向经营转换，不提供“转回批发”。转换后可按 P04-A17 在名邦↔4S之间合法调整人工来源，但不能人工改成批发；批发来源只能由 JYT 集成建立。 | B4-04 的异常 car_code 冲突也只自动屏蔽，不构成旧名邦车转回批发。 | 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM04-GATE-B4 | PDM-04 | Batch 4 Gate | 用户已确认 P04-B4-01、B4-02、B4-03、B4-05；P04-B4-04 按“自动屏蔽、不人工决断”修改后确认。 | PDM-04 四批用户审查全部完成，进入最终完整规则总览待用户最终批准；不得自动标记 COMPLETE。 | PDM-04 Batch 4 工作版 + 2026-09-24 用户明确裁决 | 2026-09-24 |

| PDM04-GATE-FINAL | PDM-04 | Final Domain Overview | 用户最终批准 PDM-04《最终完整规则总览》。 | PDM-04 四批门禁与最终总览全部通过，正式标记 COMPLETE；生成 `PDM-04_最终完整规则.md`，允许进入 PDM-05。 | `PDM-04_最终完整规则总览_待用户批准.md` + 2026-09-24 用户明确“同意” | 2026-09-24 |

| PDM05-DEC-A03-ID-MAPPING | PDM-05 | P05-A03 / A05 / A06 | 用户确认车型身份采用 ID-based source mapping：保留 JYT `model_id`，映射到本地 `vehicle_model_id`；两边 ID 数值不要求相同；名称不再作为车型身份主键，仅用于展示/快照/搜索/Admin辅助判断。品牌/车系是否与 JYT 共用同值当前不作假定。 | 主动修正 R3 后期“完整名称完全一致作为首次自动映射条件”的口径；已有 model_id 映射直接复用，无映射进入后台 Admin；A05/A06 的映射确认、修正、冲突处理统一由后台 Admin 负责。 | CN11 CR-006 原始 SSOT + 2026-09-24 用户明确“同意” | 2026-09-24 |

| PDM05-DEC-A01 | PDM-05 | P05-A01 | 用户确认本地车型主数据采用“品牌 → 车系 → 具体车型”三级结构，年款不是第四级独立主数据节点。 | 后续若出现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-05 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“其他都同意” | 2026-09-24 |
| PDM05-DEC-A02 | PDM-05 | P05-A02 | 用户确认车型年款与首次上牌/首次登记时间严格分离，不互相推导或覆盖。 | 后续若出现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-05 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“其他都同意” | 2026-09-24 |
| PDM05-DEC-A04 | PDM-05 | P05-A04 | 用户确认同一 JYT model_id / upstream_model_id 只生成一条待确认任务；确认后现有同 ID 批量归属，未来自动复用。 | 后续若出现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-05 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“其他都同意” | 2026-09-24 |
| PDM05-DEC-A07 | PDM-05 | P05-A07 | 用户确认车型主数据/映射/冲突处理受 vehicle.model.manage 保护；当前实际管理动作由后台 Admin 执行，普通销售无权修改车型主档或映射。 | 后续若出现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-05 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“其他都同意” | 2026-09-24 |
| PDM05-DEC-A08 | PDM-05 | P05-A08 | 用户确认名邦/4S人工上传必须绑定有效本地 vehicle_model_id 才能正式发布；缺车型可保留草稿但不能绕过。 | 后续若出现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-05 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“其他都同意” | 2026-09-24 |
| PDM05-DEC-A09 | PDM-05 | P05-A09 | 用户确认车型映射人工确认/修正必须记录 actor/time/old/new，当前不强制填写原因。 | 后续若出现真实跨域冲突必须显式提交用户，不得静默覆盖。 | PDM-05 Batch 1 当前 GitHub 证据链 + 2026-09-24 用户明确“其他都同意” | 2026-09-24 |
| PDM05-GATE-B1 | PDM-05 | Batch 1 Gate | 用户确认 P05-A01～P05-A09 全部通过；其中 A03 按 ID-based source mapping 修改，A07 按后台 Admin 执行主体收口。 | Batch 1 门禁关闭，允许进入 Batch 2；不得自动批准 Batch 2。 | PDM-05 Batch 1 工作版 + 2026-09-24 用户明确确认 | 2026-09-24 |

| PDM05-DEC-B2-01 | PDM-05 | P05-B2-01 | 用户确认不得恢复“品牌 → 车系 → 年款 → 具体车型”的四级车型主数据结构。 | 作为 DO_NOT_RESTORE 规则进入最终 PDM-05 基线。 | PDM-05 Batch 2 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM05-DEC-B2-02 | PDM-05 | P05-B2-02 | 用户确认不得恢复“人工单车车型锁定”机制；车型关系错误应修正车型主档/映射，不为单车另造特殊锁定层。 | 作为 DO_NOT_RESTORE 规则进入最终 PDM-05 基线。 | PDM-05 Batch 2 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM05-DEC-B2-03 | PDM-05 | P05-B2-03 | 用户确认不建设 JYT 车型名称 alias / 同义词映射体系；车型身份按 JYT model_id → local vehicle_model_id 映射。 | 作为 DO_NOT_RESTORE 规则进入最终 PDM-05 基线。 | PDM-05 Batch 2 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM05-DEC-B2-04 | PDM-05 | P05-B2-04 | 用户确认不建设“同一车型多个 JYT ID”的特殊复杂合并机制；按实际 JYT model_id 分别建立 source mapping。 | 作为 DO_NOT_RESTORE 规则进入最终 PDM-05 基线。 | PDM-05 Batch 2 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM05-DEC-B2-05 | PDM-05 | P05-B2-05 | 用户确认不得恢复“完整车型名称完全一致 = 车型身份 / 首次自动映射主规则”；以 ID-based source mapping 为准。 | 作为 DO_NOT_RESTORE 规则进入最终 PDM-05 基线。 | PDM-05 Batch 2 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM05-GATE-B2 | PDM-05 | Batch 2 Gate | 用户确认 P05-B2-01～P05-B2-05 全部通过。 | Batch 2 门禁关闭，允许进入 Batch 3；不得自动批准 Batch 3。 | PDM-05 Batch 2 工作版 + 2026-09-24 用户明确确认 | 2026-09-24 |

| PDM05-DEC-A10 | PDM-05 | P05-A10 | 用户确认：JYT 已提供的车型事实可在本地 vehicle_model_id 未映射时正常用于入库、发布、展示、搜索、筛选和销售；本地映射仅解决名邦车型主数据归属。 | 主动确认后续 R3 口径，覆盖 CN11 较保守的“pending/conflict 下精确 model-master 事实视为 unknown”限制。 | PDM-05 Batch 3 + 2026-09-24 用户明确“同意这条” | 2026-09-24 |
| PDM05-DEC-A11 | PDM-05 | P05-A11 | 用户补充确认：只要 JYT 已明确提供品牌、车系、年款、具体车型/款式等足够车型事实，即使本地 vehicle_model_id 尚未映射，也可直接参加精确搜索、筛选和自动 Matching；不得仅因本地映射 pending 就把车型条件降为 unknown。 | 车辆自身车型事实与名邦本地车型主数据归属分层；本地映射仍需后台 Admin 完成。 | 2026-09-24 用户明确补充确认 | 2026-09-24 |
| PDM05-GATE-B3 | PDM-05 | Batch 3 Gate | 用户确认 P05-A10，并追加确认 P05-A11 精确搜索/自动 Matching 规则。 | Batch 3 门禁关闭，允许进入 Batch 4；不得自动批准 Batch 4。 | PDM-05 Batch 3 工作版 + 2026-09-24 用户明确确认 | 2026-09-24 |

| PDM05-DEC-B4-01 | PDM-05 | P05-B4-01 | 用户确认：后台 Admin 在 MODEL_MISSING / JYT 待映射 / 人工上传缺车型时，可直接新增缺失品牌、车系、具体车型并绑定本地 vehicle_model_id；若来源于 JYT 采集车型，应在本次处理或紧接后的同一后台流程中尽快建立 JYT model_id → local vehicle_model_id source mapping，避免本地主数据已补齐而采集映射长期悬空。 | 当前正式规则覆盖 Current Action Contract 的 no model creation is inferred 冲突。 | 2026-09-24 用户明确确认并补充采集映射联动要求 | 2026-09-24 |
| PDM05-DEC-B4-02 | PDM-05 | P05-B4-02 | 用户确认：后台 Admin 可修正车型节点父级、合并重复车型，并同步迁移车辆引用与 JYT source mapping；旧重复节点退出当前选择并保留轻量历史；真实旧车型长期保留，不因年份老自动停用。 | 恢复 R3 已明确但后续未完整下沉的车型主数据质量维护规则。 | 2026-09-24 用户明确“第二个同意” | 2026-09-24 |
| PDM05-GATE-B4 | PDM-05 | Batch 4 Gate | 用户确认 P05-B4-01、P05-B4-02；其中 B4-01 增加“新增缺失主数据后尽快同步 JYT source mapping”要求。 | PDM-05 四批用户审查全部完成，进入最终完整规则总览待用户最终批准；不得自动标记 COMPLETE。 | PDM-05 Batch 4 工作版 + 2026-09-24 用户明确裁决 | 2026-09-24 |

| PDM05-GATE-FINAL | PDM-05 | Final Domain Overview | 用户最终批准 PDM-05《最终完整规则总览》。 | PDM-05 四批门禁与最终总览全部通过，正式标记 COMPLETE；生成 `PDM-05_最终完整规则.md`，允许进入 PDM-06。 | `PDM-05_最终完整规则总览_待用户批准.md` + 2026-09-24 用户明确“同意” | 2026-09-24 |

| PDM06-DEC-A12 | PDM-06 | P06-A12 | 用户确认人工新增车辆采用“自动保存 + 多草稿列表管理”：E02 → 更多 → 新增车源每次新建；开始填写有效内容后自动保存；全部未发布草稿统一从 E02 → 更多 → 草稿车源查看、继续编辑、正式发布或删除；取消“继续上次 / 放弃重新发布”全局弹层。 | 主动关闭 Current DRAFT_RESUME 与 R10-64 多草稿模型冲突；空白未填写有效内容退出不生成草稿。 | 2026-09-24 用户明确确认 | 2026-09-24 |

| PDM06-DEC-A01 | PDM-06 | P06-A01 | 用户确认：人工发布入口只产生名邦或4S车源，不能人工创建批发/JYT车源；4S成员上传固定4S。 | 作为 PDM-06 Batch 1 当前有效规则进入后续总览。 | PDM-06 Batch 1 + 2026-09-24 用户明确“其他的直接确认就可以” | 2026-09-24 |
| PDM06-DEC-A02 | PDM-06 | P06-A02 | 用户确认：草稿与正式Vehicle分层；未发布草稿不公开、不进搜索/Matching/Recommendation/Lock，也不建listing_cycle。 | 作为 PDM-06 Batch 1 当前有效规则进入后续总览。 | PDM-06 Batch 1 + 2026-09-24 用户明确“其他的直接确认就可以” | 2026-09-24 |
| PDM06-DEC-A03 | PDM-06 | P06-A03 | 用户确认：人工新建表单自动持久化草稿，无手工保存草稿按钮、无预览必经步骤；正式进入在售必须明确正式发布。 | 作为 PDM-06 Batch 1 当前有效规则进入后续总览。 | PDM-06 Batch 1 + 2026-09-24 用户明确“其他的直接确认就可以” | 2026-09-24 |
| PDM06-DEC-A04 | PDM-06 | P06-A04 | 用户确认：正式发布最低字段为source_type、品牌、车系、有效vehicle_model_id、年款、里程、城市。 | 作为 PDM-06 Batch 1 当前有效规则进入后续总览。 | PDM-06 Batch 1 + 2026-09-24 用户明确“其他的直接确认就可以” | 2026-09-24 |
| PDM06-DEC-A05 | PDM-06 | P06-A05 | 用户确认：人工车必须绑定有效本地具体车型后才能正式发布；MODEL_MISSING可保留草稿。 | 作为 PDM-06 Batch 1 当前有效规则进入后续总览。 | PDM-06 Batch 1 + 2026-09-24 用户明确“其他的直接确认就可以” | 2026-09-24 |
| PDM06-DEC-A06 | PDM-06 | P06-A06 | 用户确认：0张真实图片允许正式发布，无图使用默认占位。 | 作为 PDM-06 Batch 1 当前有效规则进入后续总览。 | PDM-06 Batch 1 + 2026-09-24 用户明确“其他的直接确认就可以” | 2026-09-24 |
| PDM06-DEC-A07 | PDM-06 | P06-A07 | 用户确认：客户标价与内部批发价均非发布硬门槛；客户标价为空显示价格咨询。 | 作为 PDM-06 Batch 1 当前有效规则进入后续总览。 | PDM-06 Batch 1 + 2026-09-24 用户明确“其他的直接确认就可以” | 2026-09-24 |
| PDM06-DEC-A08 | PDM-06 | P06-A08 | 用户确认：VIN非必填；未填VIN不得按车型/年款/里程/描述相似度猜重复并阻断发布。 | 作为 PDM-06 Batch 1 当前有效规则进入后续总览。 | PDM-06 Batch 1 + 2026-09-24 用户明确“其他的直接确认就可以” | 2026-09-24 |
| PDM06-DEC-A09 | PDM-06 | P06-A09 | 用户确认：正式发布时服务端统一校验最低发布字段并返回完整缺失项，不得先正式上架再补必填。 | 作为 PDM-06 Batch 1 当前有效规则进入后续总览。 | PDM-06 Batch 1 + 2026-09-24 用户明确“其他的直接确认就可以” | 2026-09-24 |
| PDM06-DEC-A10 | PDM-06 | P06-A10 | 用户确认：纯草稿可按条件删除；正式发布后的Vehicle不提供普通物理删除。 | 作为 PDM-06 Batch 1 当前有效规则进入后续总览。 | PDM-06 Batch 1 + 2026-09-24 用户明确“其他的直接确认就可以” | 2026-09-24 |
| PDM06-DEC-A11 | PDM-06 | P06-A11 | 用户确认：已发布名邦/4S人工车允许授权编辑；批发来源事实只读；敏感事项走专门业务动作。 | 作为 PDM-06 Batch 1 当前有效规则进入后续总览。 | PDM-06 Batch 1 + 2026-09-24 用户明确“其他的直接确认就可以” | 2026-09-24 |
| PDM06-GATE-B1 | PDM-06 | Batch 1 Gate | 用户确认 P06-A01～P06-A11 全部通过；P06-A12 多草稿规则已提前确认。 | Batch 1 门禁关闭，允许进入 Batch 2；不得自动批准 Batch 2。 | PDM-06 Batch 1 工作版 + 2026-09-24 用户明确确认 | 2026-09-24 |

| PDM06-DEC-B2-01 | PDM-06 | P06-B2-01 | 用户确认：不得恢复 DRAFT_RESUME“继续上次 / 放弃重新发布”单草稿流程。 | 作为 PDM-06 DO_NOT_RESTORE 规则进入最终基线。 | PDM-06 Batch 2 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM06-DEC-B2-02 | PDM-06 | P06-B2-02 | 用户确认：不得恢复右下角悬浮“+新增车源”入口。 | 作为 PDM-06 DO_NOT_RESTORE 规则进入最终基线。 | PDM-06 Batch 2 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM06-DEC-B2-03 | PDM-06 | P06-B2-03 | 用户确认：不得恢复手工“保存草稿”按钮。 | 作为 PDM-06 DO_NOT_RESTORE 规则进入最终基线。 | PDM-06 Batch 2 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM06-DEC-B2-04 | PDM-06 | P06-B2-04 | 用户确认：不得恢复“先预览再单独确认发布”的额外必经步骤。 | 作为 PDM-06 DO_NOT_RESTORE 规则进入最终基线。 | PDM-06 Batch 2 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM06-DEC-B2-05 | PDM-06 | P06-B2-05 | 用户确认：不得恢复“首次正式发布后 source_type 永久冻结，只能特殊纠错”的旧规则。 | 作为 PDM-06 DO_NOT_RESTORE 规则进入最终基线。 | PDM-06 Batch 2 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM06-DEC-B2-06 | PDM-06 | P06-B2-06 | 用户确认：不得恢复“所有草稿永久保留、不能删除”的机制。 | 作为 PDM-06 DO_NOT_RESTORE 规则进入最终基线。 | PDM-06 Batch 2 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM06-DEC-B2-07 | PDM-06 | P06-B2-07 | 用户确认：不得恢复正式人工 Vehicle 普通 CRUD 物理删除能力。 | 作为 PDM-06 DO_NOT_RESTORE 规则进入最终基线。 | PDM-06 Batch 2 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM06-DEC-B2-08 | PDM-06 | P06-B2-08 | 用户确认：不得恢复 VIN 为空时按车型/年款/里程/描述相似度猜重复并阻断发布。 | 作为 PDM-06 DO_NOT_RESTORE 规则进入最终基线。 | PDM-06 Batch 2 + 2026-09-24 用户明确“其他的都同意” | 2026-09-24 |
| PDM06-GATE-B2 | PDM-06 | Batch 2 Gate | 用户确认 P06-B2-01～P06-B2-08 全部通过。 | Batch 2 门禁关闭；Batch 3 经证据核对无新的未审原子，已确认后期变化继续沿用既有确认。 | PDM-06 Batch 2 + 2026-09-24 用户明确确认 | 2026-09-24 |

| PDM06-GATE-B3 | PDM-06 | Batch 3 Gate | 经证据复核，本域没有新的未审知情修改/新增原子；P06-A12 多草稿规则已由用户本轮明确确认，source_type 发布后可修改规则已在 PDM-04 最终批准并由本域继承。 | Batch 3 关闭，进入 Batch 4；不得自动批准 Batch 4。 | PDM-06 工作版 + PDM-04 正式规则 + 2026-09-24 用户既有确认 | 2026-09-24 |

| PDM06-DEC-B4-01 | PDM-06 | P06-B4-01 | 用户确认：填写 VIN 的人工车辆正式发布时执行完全一致 VIN 精确查重；命中既有名邦/4S人工正式车则阻断普通发布，提供查看已有车辆/返回修改，普通员工不得忽略继续。 | 作为 PDM-06 最终完整规则的一部分。 | PDM-06 Batch 4 + 2026-09-24 用户明确“同意，没有别的问题” | 2026-09-24 |
| PDM06-DEC-B4-02 | PDM-06 | P06-B4-02 | 用户确认：已发布名邦/4S人工车辆普通资料编辑只有点击“保存修改”并通过服务端重验后才正式生效；编辑中的临时保存不实时影响客户端，敏感动作继续独立。 | 作为 PDM-06 最终完整规则的一部分。 | PDM-06 Batch 4 + 2026-09-24 用户明确“同意，没有别的问题” | 2026-09-24 |
| PDM06-DEC-B4-03 | PDM-06 | P06-B4-03 | 用户确认：新建人工车 source_type 按可选范围决定：单一来源直入；名邦可选名邦+4S时必须主动选择、不设默认；4S成员固定4S。 | 作为 PDM-06 最终完整规则的一部分。 | PDM-06 Batch 4 + 2026-09-24 用户明确“同意，没有别的问题” | 2026-09-24 |
| PDM06-DEC-B4-04 | PDM-06 | P06-B4-04 | 用户确认：MODEL_MISSING 完成后必须返回触发流程的原始 draft_id，保留原草稿全部内容并带回车型结果重新校验，不进入 DRAFT_RESUME。 | 作为 PDM-06 最终完整规则的一部分。 | PDM-06 Batch 4 + 2026-09-24 用户明确“同意，没有别的问题” | 2026-09-24 |
| PDM06-DEC-B4-05 | PDM-06 | P06-B4-05 | 用户确认：草稿删除只能在草稿车源中针对明确目标 draft 发起，二次确认并重验从未publish、无listing_cycle、无正式业务关系及管理权限。 | 作为 PDM-06 最终完整规则的一部分。 | PDM-06 Batch 4 + 2026-09-24 用户明确“同意，没有别的问题” | 2026-09-24 |
| PDM06-GATE-B4 | PDM-06 | Batch 4 Gate | 用户确认 P06-B4-01～P06-B4-05 全部通过。 | PDM-06 四批用户审查全部完成，进入最终完整规则总览待用户最终批准；不得自动标记 COMPLETE。 | PDM-06 Batch 4 工作版 + 2026-09-24 用户明确确认 | 2026-09-24 |

| PDM06-GATE-FINAL | PDM-06 | Final Domain Overview | 用户最终批准 PDM-06《最终完整规则总览》。 | PDM-06 四批门禁与最终总览全部通过，正式标记 COMPLETE；生成 `PDM-06_最终完整规则.md`，允许进入 PDM-07。 | `PDM-06_最终完整规则总览_待用户批准.md` + 2026-09-24 用户明确“同意，继续吧” | 2026-09-24 |

| PDM07-DEC-A01 | PDM-07 | P07-A01 | 用户确认：原始敏感车辆档案默认仅内部可见。 | 作为 PDM-07 Batch 1 当前有效规则进入后续总览。 | PDM-07 Batch 1 + 2026-09-24 用户明确“全部你继续” | 2026-09-24 |
| PDM07-DEC-A02 | PDM-07 | P07-A02 | 用户确认：客户只展示明确标记客户可见的档案/报告/结果/摘要；完整VIN和未允许公开敏感原件不展示。 | 作为 PDM-07 Batch 1 当前有效规则进入后续总览。 | PDM-07 Batch 1 + 2026-09-24 用户明确“全部你继续” | 2026-09-24 |
| PDM07-DEC-A03 | PDM-07 | P07-A03 | 用户确认：没有客户可见档案/报告时客户端模块整体隐藏。 | 作为 PDM-07 Batch 1 当前有效规则进入后续总览。 | PDM-07 Batch 1 + 2026-09-24 用户明确“全部你继续” | 2026-09-24 |
| PDM07-DEC-A04 | PDM-07 | P07-A04 | 用户确认：人工车辆档案允许后补，不要求正式发布时一次齐全。 | 作为 PDM-07 Batch 1 当前有效规则进入后续总览。 | PDM-07 Batch 1 + 2026-09-24 用户明确“全部你继续” | 2026-09-24 |
| PDM07-DEC-A05 | PDM-07 | P07-A05 | 用户确认：档案不完整不阻止发布、浏览、Consultation、Recommendation、Lock、Waitlist和创建Transaction。 | 作为 PDM-07 Batch 1 当前有效规则进入后续总览。 | PDM-07 Batch 1 + 2026-09-24 用户明确“全部你继续” | 2026-09-24 |
| PDM07-DEC-A06 | PDM-07 | P07-A06 | 用户确认：真正完成成交/交付前必须通过本笔Transaction所需必要车辆资料核验；缺材料只阻止完成，不阻止创建Transaction。 | 作为 PDM-07 Batch 1 当前有效规则进入后续总览。 | PDM-07 Batch 1 + 2026-09-24 用户明确“全部你继续” | 2026-09-24 |
| PDM07-DEC-A07 | PDM-07 | P07-A07 | 用户确认：车辆档案跟Vehicle走；管理责任变化不删除档案，新责任人继续维护，原上传人与历史保留。 | 作为 PDM-07 Batch 1 当前有效规则进入后续总览。 | PDM-07 Batch 1 + 2026-09-24 用户明确“全部你继续” | 2026-09-24 |
| PDM07-DEC-A08 | PDM-07 | P07-A08 | 用户确认：VIN/原始档案不单设查看权限，按车辆管理权限+数据范围控制；4S只在有权车辆范围内查看维护。 | 作为 PDM-07 Batch 1 当前有效规则进入后续总览。 | PDM-07 Batch 1 + 2026-09-24 用户明确“全部你继续” | 2026-09-24 |
| PDM07-DEC-A09 | PDM-07 | P07-A09 | 用户确认：内部档案事实与客户可见性分离；切换客户可见不删除内部事实，敏感证件不进普通图片轮播。 | 作为 PDM-07 Batch 1 当前有效规则进入后续总览。 | PDM-07 Batch 1 + 2026-09-24 用户明确“全部你继续” | 2026-09-24 |
| PDM07-DEC-A10 | PDM-07 | P07-A10 | 用户确认：车况保持来源真实性；JYT事实不得伪装名邦检测，名邦真实检测结果独立管理，无车况时模块隐藏。 | 作为 PDM-07 Batch 1 当前有效规则进入后续总览。 | PDM-07 Batch 1 + 2026-09-24 用户明确“全部你继续” | 2026-09-24 |
| PDM07-DEC-A11 | PDM-07 | P07-A11 | 用户确认：档案新增/更新、客户可见性变化等关键操作保留必要审计。 | 作为 PDM-07 Batch 1 当前有效规则进入后续总览。 | PDM-07 Batch 1 + 2026-09-24 用户明确“全部你继续” | 2026-09-24 |
| PDM07-GATE-B1 | PDM-07 | Batch 1 Gate | 用户确认 P07-A01～P07-A11 全部通过。 | Batch 1 门禁关闭，允许进入 Batch 2；不得自动批准 Batch 2。 | PDM-07 Batch 1 工作版 + 2026-09-24 用户明确确认 | 2026-09-24 |

| PDM07-DEC-B2-01 | PDM-07 | P07-B2-01 | 用户确认：不得恢复“档案没补齐就阻塞正式发布或整条前段销售”的旧方向。 | 作为 PDM-07 DO_NOT_RESTORE 规则进入最终基线。 | PDM-07 Batch 2 + 2026-09-24 用户明确“同意” | 2026-09-24 |
| PDM07-DEC-B2-02 | PDM-07 | P07-B2-02 | 用户确认：不得恢复“内部上传敏感原件就默认直接展示给客户”的方向。 | 作为 PDM-07 DO_NOT_RESTORE 规则进入最终基线。 | PDM-07 Batch 2 + 2026-09-24 用户明确“同意” | 2026-09-24 |
| PDM07-DEC-B2-03 | PDM-07 | P07-B2-03 | 用户确认：不得恢复独立 VIN 查看权限 / 原始车辆档案查看权限。 | 作为 PDM-07 DO_NOT_RESTORE 规则进入最终基线。 | PDM-07 Batch 2 + 2026-09-24 用户明确“同意” | 2026-09-24 |
| PDM07-DEC-B2-04 | PDM-07 | P07-B2-04 | 用户确认：不得把 JYT 上游描述/标签包装成名邦检测、认证或质保。 | 作为 PDM-07 DO_NOT_RESTORE 规则进入最终基线。 | PDM-07 Batch 2 + 2026-09-24 用户明确“同意” | 2026-09-24 |
| PDM07-GATE-B2 | PDM-07 | Batch 2 Gate | 用户确认 P07-B2-01～P07-B2-04 全部通过。 | Batch 2 门禁关闭。 | PDM-07 Batch 2 + 2026-09-24 用户明确确认 | 2026-09-24 |

| PDM07-GATE-B3 | PDM-07 | Batch 3 Gate | 经 R9/R10/R11/R12、IA V5 与 M10 复核，本域没有新的未审知情修改/新增原子；后期变化均已由 Batch 1/2 吸收。 | Batch 3 关闭，进入 Batch 4；不得自动批准 Batch 4。 | PDM-07 工作版及当前 GitHub 证据 | 2026-09-24 |

| PDM07-DEC-B4-01 | PDM-07 | P07-B4-01 | 用户确认：车况以 JYT 原始描述 + JYT 原始标签为主要来源，不重复人工录入批发车车况；标签保留 provenance，Matching 仅做必要确定性标准化，unknown 不猜。 | 作为 PDM-07 最终完整规则的一部分。 | PDM-07 Batch 4 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM07-DEC-B4-02 | PDM-07 | P07-B4-02 | 用户确认：补齐车辆档案维护操作链：上传/后补/更新替换/查看原件/查看历史/核验；按 Vehicle 管理权限与数据范围控制。 | 作为 PDM-07 最终完整规则的一部分。 | PDM-07 Batch 4 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM07-DEC-B4-03 | PDM-07 | P07-B4-03 | 用户确认：敏感原件固定仅内部；允许对客的报告类档案可选择客户可见/仅内部，变化留审计。 | 作为 PDM-07 最终完整规则的一部分。 | PDM-07 Batch 4 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM07-DEC-B4-04 | PDM-07 | P07-B4-04 | 用户确认：成交/交付 required-field set 后台可配置，不写死全国清单；由明确员工业务配置能力管理，System Admin 身份本身不自动获得。 | 作为 PDM-07 最终完整规则的一部分。 | PDM-07 Batch 4 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM07-DEC-B4-05 | PDM-07 | P07-B4-05 | 用户确认：错误正式档案不普通物理删除，采用作废/新版本替代并保留完整历史。 | 作为 PDM-07 最终完整规则的一部分。 | PDM-07 Batch 4 + 2026-09-24 用户明确“全部同意” | 2026-09-24 |
| PDM07-GATE-B4 | PDM-07 | Batch 4 Gate | 用户确认 P07-B4-01～P07-B4-05 全部通过。 | PDM-07 四批用户审查全部完成，进入最终完整规则总览待用户最终批准；不得自动标记 COMPLETE。 | PDM-07 Batch 4 + 2026-09-24 用户明确确认 | 2026-09-24 |

| PDM07-GATE-FINAL | PDM-07 | Final Domain Overview | 用户最终批准 PDM-07《最终完整规则总览》。 | PDM-07 四批门禁与最终总览全部通过，正式标记 COMPLETE；生成 `PDM-07_最终完整规则.md`，允许进入 PDM-08。 | `PDM-07_最终完整规则总览_待用户批准.md` + 2026-09-25 用户明确“继续” | 2026-09-25 |

| PDM04-REV-COVER-02 | PDM-04 | Reverse Coverage GAP-04-02 | 用户明确确认：一键转名邦只是同一 Vehicle 后台车源类型/经营来源变化，不是新建车辆；`vehicle_id` 与当前 `listing_cycle` 不变，因此 Favorite、Recommendation、当前 listing_cycle 已成立的查价关系及其他绑定该 vehicle 的客户侧关系全部原样继续，不迁移、不重建、不清空，也不因 source_type 变化单独处理。 | 关闭 M07-006 在“同 vehicle_id 转换模型”下遗留的跨 vehicle 迁移问题；旧“不迁移到新 vehicle”规则因已无第二 vehicle 而失去适用前提。 | 2026-09-25 用户明确裁决 | 2026-09-25 |

| PDM04-REV-COVER-03 | PDM-04 | Reverse Coverage GAP-04-03 | 用户明确确认：批量隐藏/恢复的“逐车返回结果 + 提交时逐车重验”不作为产品级硬规则补回；批量动作正常执行即可，极低概率失败按通用异常/工程错误处理。 | 关闭 CR007 旧批量可见性细节在当前产品基线中的强制恢复要求，不再作为 PDM-04 未映射项。 | 2026-09-25 用户明确裁决 | 2026-09-25 |

| PDM06-REV-COVER-02 | PDM-06 | Reverse Coverage GAP-06-02 | 用户确认：不单独建立草稿查看/编辑权限。具备人工车源发布或对应车辆管理能力的员工，在其当前 data scope 内默认可查看、继续编辑对应草稿；后台沿用现有发布/管理 capability + data scope 控制。草稿删除继续额外受纯草稿、二次确认、提交时重验等 Guard 约束。 | 关闭“草稿读取权限表达不完整”缺口，不新增 draft-read/draft-edit 独立 permission。 | 2026-09-25 用户明确裁决 | 2026-09-25 |

| PDM04-REV-COVER-01 | PDM-04 | Reverse Coverage GAP-04-01 | 用户确认：供应异常允许人工处理/人工解除。系统仍可自动标记并在明确恢复时自动解除；有权限人员也可基于实际证据人工处置并解除异常。人工解除不得删除历史，需保留处理人、时间、结果及适用的证据/说明。异常本身不自动取消已有 Lock / Waitlist / Transaction，也不删除 Deposit / 快照等既有业务事实。 | 关闭 M07-004 中“系统自动 clear vs 人工是否可 clear”的历史冲突；明确 V1 允许受权限控制的人工异常处置。 | 2026-09-25 用户明确“准许人工处理” | 2026-09-25 |

| PDM06-REV-COVER-01 | PDM-06 | Reverse Coverage GAP-06-01 | 用户确认：人工名邦/4S车辆选择有效具体车型 / vehicle_model_id 后，自动带出车型主数据中已确定的固定属性，包括车型年款、排量、变速箱、排放、能源等，不要求销售重复手工录入。JYT source facts 继续独立保留，不被人工车型选择反向覆盖。 | 关闭 PDM-05 → PDM-06 固定属性联动 handoff 漏接。 | 2026-09-25 用户明确“带出” | 2026-09-25 |

| PDM08-CDN-01 | PDM-08 | CDN URL / 图片路径 | 用户确认：采集图片原始事实仅保存图片 path；名邦前端公开图片域名、固定前缀、JYT 图片回源域名均作为配置，不写死进数据库。前端 URL = 名邦公开域名 + 前缀 + path；CDN 回源 = 配置的上游图片源站 + path。完整报告/H5 仍按完整 URL/报告代理单独处理。 | 降低域名切换与 CDN 迁移成本，避免把运行时域名伪装成业务源事实。 | 2026-10-03 用户明确同意 | 2026-10-03 |

| PDM08-CDN-02 | PDM-08 | 图片资产化 | 用户确认：批发图片后续进入名邦长期资产/对象存储后，前端公开图片 URL 保持稳定，不因底层来源切换而重建客户侧引用。 | 保证收藏/分享/Recommendation 等既有引用连续。 | 2026-10-03 用户同意 | 2026-10-03 |
| PDM08-CDN-03 | PDM-08 | CDN 缓存参数 | 用户确认：TTL、旧缓存服务、Query 参数、刷新/预热等归 Engineering，不在产品规则写死。 | 产品层只冻结“名邦公开 URL + CDN 回源”架构。 | 2026-10-03 用户同意 | 2026-10-03 |
| PDM08-CDN-04 | PDM-08 | 4S 维保 H5 / 图片 | 用户纠正确认：H5 与图片是两种独立呈现方式。H5 原始链接本身带完整上游域名并写入数据库，客户端输出时将上游 H5 域名替换/映射为名邦可控前置报告域名，path/hash 等定位部分保持对应；若维保记录返回图片，则直接按普通 IMG/JYT 图片链路处理，与 H5 无上下级关系。 | 覆盖此前“需要解析 H5 内图片资源”的误解；产品层不要求把维保图片视为 H5 内资源。 | 2026-10-03 用户纠正并确认 | 2026-10-03 |

| PDM08-CDN-05 | PDM-08 | 出险 / 4S维保呈现边界 | 用户明确：出险记录按图片链路处理；4S维保记录则可能是维保图片，也可能是独立H5报告。维保图片按普通IMG/JYT图片链路处理；维保H5按完整报告URL及名邦报告域名映射处理。两种4S维保呈现方式平行独立，不存在“图片属于H5内部资源”的产品语义。 | 防止后续把出险与4S维保H5混为同一资源类型。 | 2026-10-03 用户明确确认 | 2026-10-03 |

| PDM08-CDN-06 | PDM-08 | 自上传图片存储 | 用户确认：名邦员工/4S成员自上传的车辆图片直接进入名邦自有对象存储，再经 CDN 对外读取；自上传报告/档案图片同样进入名邦对象存储。当前逻辑命名可区分 ct=采集回源、vc=自有车辆图、rc=自有报告/档案图，实际域名/前缀配置化。 | 将上游回源图片与名邦长期自有资产彻底分层。 | 2026-10-03 用户明确“同意” | 2026-10-03 |
| PDM08-CDN-07 | PDM-08 | 批发转名邦图片资产化 | 用户确认：只有批发→名邦的一键转换，不存在批发→4S；转换保持同一 vehicle_id。转换时原批发/JYT回源图片正式资产化到名邦对象存储，数据库保存 object_key/path/状态引用，前端图片逻辑 URL 尽量保持稳定；图片资产化失败不回滚车辆来源转换。 | 与 PDM-04 同 vehicle_id 转换模型对齐，并替代旧双 Vehicle 图片所有权迁移。 | 2026-10-03 用户明确“同意，就是这个意思” | 2026-10-03 |

| PDM08-B1-APPROVAL | PDM-08 | Batch 1 | 用户明确同意 CDN 对齐后的 P08-A01～P08-A13；车辆相册图片、CDN自然缓存、前5张+第3张触发剩余预取、对象存储资产化边界、失败恢复、并行控制、上下架与图片来源事实、人工名邦/4S图片、产品级限额与图片权限等进入当前有效候选基线。报告/档案图片与H5独立章节继续保留。 | Batch 1 关闭，进入 Batch 2。 | 2026-10-04 用户明确“同意” | 2026-10-04 |

| PDM08-B2-APPROVAL | PDM-08 | Batch 2 | 用户明确“全部同意”：普通批发图浏览时永久吞对象存储、固定2/3/4+前方2张窗口、产品级每轮3次重试、单车并发3+产品级single-flight、双vehicle图片所有权迁移、转换失败只能人工补图、failed仅表示整车转换失败等旧规则全部作废。 | 统一标记 SUPERSEDED / DO_NOT_RESTORE；后续进入同vehicle_id转名邦图片资产化与恢复。 | 2026-10-04 用户明确裁决 | 2026-10-04 |

| PDM08-B3-APPROVAL | PDM-08 | Batch 3 | 用户明确“全部同意”：同一vehicle_id内完成批发→名邦图片资产化；CDN缓存不等于资产化；车辆来源转换与图片资产化解耦；图片子任务使用processing/success/partial_failed/failed且失败项可重试；资产化后进入普通名邦图片生命周期。 | Batch 3 关闭，进入 Batch 4。 | 2026-10-04 用户明确裁决 | 2026-10-04 |

| PDM08-B4-APPROVAL | PDM-08 | Batch 4 | 用户明确：普通车辆照片统一进入同一个可左右滑动的图片浏览序列，不代表自动播放；列表/详情4:3、全屏看图交互、车辆分享图fallback、分享卡片安全边界、工程参数不写死、首页/品牌分享配置交PDM-20/PDM-22，其余全部同意。 | Batch 4 关闭，进入PDM-08全域总览与最终门禁。 | 2026-10-04 用户明确裁决 | 2026-10-04 |

| PDM08-GATE-FINAL | PDM-08 | Final Domain Overview | 用户最终批准 PDM-08《最终完整规则总览》。 | Batch 1～4、30条IMG历史Decision映射与最终总览全部通过；SOURCE_DECISION_COVERAGE=100%、UNMAPPED=0；生成 `PDM-08_最终完整规则.md`，PDM-08正式标记COMPLETE并进入PDM-09。 | 2026-10-04 用户明确“同意” | 2026-10-04 |

| PDM09-B1-APPROVAL | PDM-09 | Batch 1 | 用户明确“全部同意” P09-A01～P09-A11：电话按 upstream_publisher_id 归属；客户端/客户安全视图不展示；独立敏感能力；Mingbang→Collector→JYT；缓存优先；latest 强制刷新且失败保留旧缓存；history 只审计；同 publisher latest single-flight；拨打仅系统拨号且不新增独立 call permission；敏感操作审计；P03 只管理 Collector 连接。 | Batch 1 门禁关闭，进入 Batch 2；不得自动批准 Batch 2。 | 2026-10-04 用户明确“全部同意” | 2026-10-04 |

| PDM09-DEC-B2-01 | PDM-09 | P09-B2-01 | 用户确认：禁止恢复以 car_code、单 vehicle_id 或每车独立缓存作为上游电话查询身份；电话身份统一为 source_platform + upstream_publisher_id。 | 作为 PDM-09 DO_NOT_RESTORE 规则进入最终基线。 | 2026-10-04 用户“全部同意” | 2026-10-04 |
| PDM09-DEC-B2-02 | PDM-09 | P09-B2-02 | 用户确认：禁止恢复名邦直连 JYT 电话接口或在名邦保存/展示/轮换 JYT 电话 Token/Header/callCode；正式链固定 Mingbang→Collector→JYT。 | 作为 PDM-09 DO_NOT_RESTORE 规则进入最终基线。 | 2026-10-04 用户“全部同意” | 2026-10-04 |
| PDM09-DEC-B2-03 | PDM-09 | P09-B2-03 | 用户确认：有上游电话权限且车辆位于本人数据范围内，即可查看、获取最新电话并发起系统拨号；不再额外拆分“拨打电话权限”。 | 不新增 can_call_wholesale_phone；拨打继续复用现有上游电话敏感能力。 | 2026-10-04 用户“明白了，全部同意” | 2026-10-04 |
| PDM09-GATE-B2 | PDM-09 | Batch 2 Gate | 用户确认 P09-B2-01～P09-B2-03 全部通过。 | Batch 2 门禁关闭，允许进入 Batch 3 证据筛选；不得自动批准 Batch 3。 | 2026-10-04 用户明确确认 | 2026-10-04 |

| PDM09-GATE-B3 | PDM-09 | Batch 3 Gate | 用户确认 Batch 3 无新的未审业务规则原子。 | Batch 3 门禁关闭，允许进入 Batch 4；IA/Low-Fi 电话状态与页面按既有规则承载，不重复造原子。 | 2026-10-04 用户“batch3 同意” | 2026-10-04 |

| METHOD-20261004-01 | 全局重建方法 | 当前实现事实优先识别 | 用户确认：保留原有 9/19 主底盘、前后历史反查、知情修改测试、四批用户裁决机制，并新增“先识别当前已实现/已测试事实”的强制前置规则。跨系统/API 必须先确认谁提供API、谁调用API、数据流方向、当前版本及测试验收状态；已实现事实用于确定当前现实，但若与正式产品权威冲突，必须进入显式冲突复核，不自动以实现覆盖产品规则。 | 作为后续所有 PDM 通用硬规则执行。 | 2026-10-04 用户“可以” | 2026-10-04 |

| PDM09-REOPEN-20261004-01 | PDM-09 | API 当前实现复核 | 用户明确纠正：名邦 Backend 生成/提供 Integration API，采集端使用该 API 与车源信息同一回传体系把电话结果回传名邦；不应把旧“名邦配置 Collector URL / Phone Path”中间方案当当前架构。 | 回开 P09-A04、P09-A11；原 P09-B4-04 暂停并提出撤回候选。未经用户复审不得静默覆盖已确认 Atom。 | 2026-10-04 用户连续纠正 + 当前实现证据复核 | 2026-10-04 |

| PDM09-DEC-A04-R1 | PDM-09 | P09-A04-R1 | 用户确认：名邦业务上下文确定目标 upstream_publisher_id；Collector/采集端负责调用 JYT 取号；结果通过名邦 Backend 已提供的 Integration API / 既有回传体系返回名邦，名邦更新 publisher 电话缓存/历史。 | 替代原 A04 中“名邦 Backend→Collector→JYT”的网络方向表达；员工端/客户端不直连 JYT，JYT Token/Header/callCode 仍只归采集端。 | 2026-10-04 用户明确“同意” | 2026-10-04 |
| PDM09-DEC-A11-R1 | PDM-09 | P09-A11-R1 | 用户确认：名邦 Backend 提供/管理自身 Integration API 与鉴权；Collector 配置名邦 API 并可靠回传；名邦 P03 不再提供 Collector Base URL / Phone Path 普通产品配置入口。 | 替代原 A11；P03 只承载集成状态、电话缓存/历史、异常诊断、日志、审计；JYT 调用参数继续只归采集端/Engineering。 | 2026-10-04 用户明确“同意” | 2026-10-04 |
| PDM09-WITHDRAW-B4-04 | PDM-09 | P09-B4-04-R1 | 用户确认撤回原“Collector 新配置测试失败时如何生效”产品问题。 | 该问题建立在名邦 P03 配置 Collector URL/Phone Path 的旧前提上；采集端连接名邦 API 的测试/回滚属于 Collector/Engineering 配置安全，不再进入 PDM-09 产品规则。 | 2026-10-04 用户明确“同意” | 2026-10-04 |
| PDM09-SUPERSEDE-B2-02-DIRECTION | PDM-09 | P09-B2-02 局部文字 | B2-02 的核心 DO_NOT_RESTORE 保持有效，但其中“正式链固定 Mingbang Backend→Collector→JYT”网络方向表述由 P09-A04-R1 现行 Integration API / 回传架构替代。 | 仅做已确认架构的一致性收口，不恢复名邦直连 JYT 或旧反向 Phone API。 | P09-A04-R1 用户确认 | 2026-10-04 |

| PDM09-DEC-B4-01 | PDM-09 | P09-B4-01 | 用户确认：有 publisher 当前电话缓存时直接使用缓存拨打；无缓存时针对当前 upstream_publisher_id 按需取号一次，由采集端向 JYT 获取并通过名邦既有 Integration API / 回传体系返回名邦，成功写入缓存后再调系统拨号器；失败不拨号并允许重试。 | 与 A04-R1 当前 API 架构一致；“获取最新电话”继续作为独立强制刷新动作。 | 2026-10-04 用户“全部同意” | 2026-10-04 |
| PDM09-DEC-B4-02 | PDM-09 | P09-B4-02 | 用户确认：expires_at / freshness 只表达号码新鲜度，不作为普通查看/拨打硬失效门槛；已有有效缓存仍可使用，不因到期自动强制取号。 | 需要确认最新号码时由具备权限的员工主动“获取最新电话”。 | 2026-10-04 用户“全部同意” | 2026-10-04 |
| PDM09-DEC-B4-03 | PDM-09 | P09-B4-03 | 用户确认：JYT 车源采集、更新、改价、下架、重新上架均不批量预取发布人电话；电话继续按需获取。 | 已有缓存直接使用；无缓存且实际需要时按需取一次；latest 继续主动强制刷新。 | 2026-10-04 用户“全部同意” | 2026-10-04 |
| PDM09-DEC-B4-05 | PDM-09 | P09-B4-05 | 用户确认：P03-05 作为 publisher 电话缓存管理/诊断页，展示 publisher、当前电话、联系人（如有）、最近获取时间、状态/新鲜度、历史号码、最近刷新结果及必要异常/日志/审计；明文电话继续受敏感能力控制。 | 具备相应后台电话敏感能力且 data scope 允许的管理员可执行“获取最新电话”；不再提供 Collector Base URL / Phone Path 旧连接配置。 | 2026-10-04 用户“全部同意” | 2026-10-04 |
| PDM09-DEC-B4-06 | PDM-09 | P09-B4-06 | 用户确认：V1 上游发布人电话允许查看、获取最新和系统拨号，但不提供专门的一键复制/长按复制动作。 | 后续如确有业务需要，作为新的明确产品决定增加。 | 2026-10-04 用户“全部同意” | 2026-10-04 |
| PDM09-GATE-B4 | PDM-09 | Batch 4 Gate | 用户一次性确认剩余 P09-B4-01、02、03、05、06 全部同意；P09-B4-04 已在前轮确认撤回。 | Batch 4 正式关闭；下一步必须做 PDM-09 全量 Decision Coverage / 未映射检查，未经最终总览批准不得标记 COMPLETE 或进入 PDM-10。 | 2026-10-04 用户“全部同意” | 2026-10-04 |

| PDM09-COVERAGE-GATE | PDM-09 | Full Decision Coverage | 完成 Batch 1～4、9/19、CN11、001～078、IA V5、Low-Fi 电话相关载体的全量覆盖检查；20/20 原始审查单元均有 EFFECTIVE / SUPERSEDED / DO_NOT_RESTORE / WITHDRAWN 去向。 | SOURCE_DECISION_COVERAGE=100%，UNMAPPED=0；旧 Collector 电话连接 IA carrier 标记 STALE_CARRIER，后续 IA/Engineering 清理，不构成新的产品 Decision。 | 2026-10-04 全量覆盖审计 | 2026-10-04 |

| PDM09-GATE-FINAL | PDM-09 | Final Domain Overview | 用户最终确认 PDM-09《最终完整规则总览》。 | Batch 1～4、API 架构回开复核与全量覆盖检查全部通过；SOURCE_DECISION_COVERAGE=100%（20/20）、UNMAPPED=0；生成 `PDM-09_最终完整规则.md`，PDM-09 正式标记 COMPLETE，并允许进入 PDM-10。旧 IA/Low-Fi Collector 电话连接表述仅作为 STALE_CARRIER 后续清理，不重新形成产品 Decision。 | 2026-10-04 用户明确“确认” | 2026-10-04 |


| PDM10-DEC-A01 | PDM-10 | P10-A01 | 用户确认批发车上游标价、真实批发价、基础批发价分层保存，base 按批发价优先、标价回退，派生价不得改写来源事实。 | 作为 PDM-10 Batch 1 当前有效候选规则进入后续总览。 | PDM-10 Batch 1 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-A02 | PDM-10 | P10-A02 | 用户确认名邦/4S人工车独立保存客户标价和内部批发价，两者可空，不参加JYT统一阶梯加价。 | 作为 PDM-10 Batch 1 当前有效候选规则进入后续总览。 | PDM-10 Batch 1 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-A03 | PDM-10 | P10-A03 | 用户确认客户价格与内部批发价严格隔离；内部价不得作为客户价缺失时的直接兜底；无合法数字价显示价格咨询。 | 作为 PDM-10 Batch 1 当前有效候选规则进入后续总览。 | PDM-10 Batch 1 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-A04 | PDM-10 | P10-A04 | 用户确认同一车辆同一时刻只有一个客户展示价；等级/身份/查价权只控制可见性，不改变售价公式。 | 作为 PDM-10 Batch 1 当前有效候选规则进入后续总览。 | PDM-10 Batch 1 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-A05 | PDM-10 | P10-A05 | 用户确认阶梯规则启用前必须无重叠、声明范围无空档且唯一可算；无效规则不得上线。 | 作为 PDM-10 Batch 1 当前有效候选规则进入后续总览。 | PDM-10 Batch 1 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-A06 | PDM-10 | P10-A06 | 用户确认阶梯规则采用草稿/未生效版本→校验→正式启用；编辑或保存失败不得影响当前线上有效价。 | 作为 PDM-10 Batch 1 当前有效候选规则进入后续总览。 | PDM-10 Batch 1 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-A07 | PDM-10 | P10-A07 | 用户确认批发车查价权以customer+vehicle+listing_cycle为核心；同周期不重复扣，新周期重新判断。 | 作为 PDM-10 Batch 1 当前有效候选规则进入后续总览。 | PDM-10 Batch 1 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-A08 | PDM-10 | P10-A08 | 用户确认只有首次成功解锁新的批发车数字价格才扣额度；失败、超时、价格咨询、重复查看、员工查看不扣。 | 作为 PDM-10 Batch 1 当前有效候选规则进入后续总览。 | PDM-10 Batch 1 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-A09 | PDM-10 | P10-A09 | 用户确认正式Recommendation只免费授对应客户+车辆+当前周期查价权；普通分享/收藏不授，权限不经二次分享扩散。 | 作为 PDM-10 Batch 1 当前有效候选规则进入后续总览。 | PDM-10 Batch 1 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-A10 | PDM-10 | P10-A10 | 用户确认每日基础查价额度属于客户权益，可与等级关联并按UTC+8自然日恢复；等级不改变车辆售价且不追回已解锁车辆。 | 作为 PDM-10 Batch 1 当前有效候选规则进入后续总览。 | PDM-10 Batch 1 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-A11 | PDM-10 | P10-A11 | 用户确认价格变更留历史/审计；Recommendation、Lock等关键价格快照为当时事实，后续调价不得覆盖。 | 作为 PDM-10 Batch 1 当前有效候选规则进入后续总览。 | PDM-10 Batch 1 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-A12 | PDM-10 | P10-A12 | 用户确认V1不恢复服务费、物流/检测/过户报价、预计到手价等第二套独立报价体系。 | 作为 PDM-10 Batch 1 当前有效候选规则进入后续总览。 | PDM-10 Batch 1 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-GATE-B1 | PDM-10 | Batch 1 Gate | 用户确认 P10-A01～P10-A12 全部通过。 | Batch 1 门禁关闭，允许进入 Batch 2；不得自动批准 Batch 2。 | PDM-10 Batch 1 工作版 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |


| PDM10-DEC-B2-01 | PDM-10 | P10-B2-01 | 用户确认不得恢复“客户展示价覆盖仅适用于单一车源类型”的旧方向。 | 作为 PDM-10 DO_NOT_RESTORE / SUPERSEDED 规则进入后续总览。 | PDM-10 Batch 2 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-B2-02 | PDM-10 | P10-B2-02 | 用户确认不得恢复“加价关闭后所有批发车一律价格咨询”的旧方向。 | 作为 PDM-10 DO_NOT_RESTORE / SUPERSEDED 规则进入后续总览。 | PDM-10 Batch 2 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-B2-03 | PDM-10 | P10-B2-03 | 用户确认不得把 base_wholesale_price / 内部真实批发价直接作为客户售价兜底。 | 作为 PDM-10 DO_NOT_RESTORE / SUPERSEDED 规则进入后续总览。 | PDM-10 Batch 2 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-B2-04 | PDM-10 | P10-B2-04 | 用户确认普通分享、点击分享链接、收藏不得自动获得批发查价权。 | 作为 PDM-10 DO_NOT_RESTORE / SUPERSEDED 规则进入后续总览。 | PDM-10 Batch 2 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-B2-05 | PDM-10 | P10-B2-05 | 用户确认 Recommendation 不得扩散为全库价格权限，客户查价权不得经普通二次分享传递。 | 作为 PDM-10 DO_NOT_RESTORE / SUPERSEDED 规则进入后续总览。 | PDM-10 Batch 2 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-B2-06 | PDM-10 | P10-B2-06 | 用户确认旧 listing_cycle 的查价权、Recommendation 价格权和覆盖价不得自动跨新周期。 | 作为 PDM-10 DO_NOT_RESTORE / SUPERSEDED 规则进入后续总览。 | PDM-10 Batch 2 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-B2-07 | PDM-10 | P10-B2-07 | 用户确认不得同周期重复扣额；价格咨询、失败、超时、员工查看不得消耗客户额度。 | 作为 PDM-10 DO_NOT_RESTORE / SUPERSEDED 规则进入后续总览。 | PDM-10 Batch 2 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-B2-08 | PDM-10 | P10-B2-08 | 用户确认无效阶梯规则不得上线，草稿/保存失败不得影响当前线上有效价。 | 作为 PDM-10 DO_NOT_RESTORE / SUPERSEDED 规则进入后续总览。 | PDM-10 Batch 2 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-B2-09 | PDM-10 | P10-B2-09 | 用户确认名邦/4S不得参加JYT统一阶梯加价；不得仅因人工车内部批发价为空阻断后续锁车。 | 作为 PDM-10 DO_NOT_RESTORE / SUPERSEDED 规则进入后续总览。 | PDM-10 Batch 2 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-B2-10 | PDM-10 | P10-B2-10 | 用户确认不得恢复名邦员工查看内部价必须额外独立 internal-price-view permission 的旧门槛。 | 作为 PDM-10 DO_NOT_RESTORE / SUPERSEDED 规则进入后续总览。 | PDM-10 Batch 2 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-B2-11 | PDM-10 | P10-B2-11 | 用户确认不得用内部批发价强行填补客户标价，包括一键转名邦和人工车客户标价缺失场景。 | 作为 PDM-10 DO_NOT_RESTORE / SUPERSEDED 规则进入后续总览。 | PDM-10 Batch 2 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-DEC-B2-12 | PDM-10 | P10-B2-12 | 用户确认不得恢复客户完整内部价格历史及服务费/物流检测过户/预计到手价等第二套报价体系。 | 作为 PDM-10 DO_NOT_RESTORE / SUPERSEDED 规则进入后续总览。 | PDM-10 Batch 2 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |
| PDM10-GATE-B2 | PDM-10 | Batch 2 Gate | 用户确认 P10-B2-01～P10-B2-12 全部通过。 | Batch 2 门禁关闭，允许进入 Batch 3；不得自动批准 Batch 3。 | PDM-10 Batch 2 工作版 + 2026-10-04 用户明确“全部同意” | 2026-10-04 |


| METHOD-20261004-B23-CONFLICT-GATE | METHOD | Batch 2 / Batch 3 入批门禁 | 用户批准新增全局方法规则：任何规则进入 Batch 2/3 前，必须反查前史/9·19、后续用户裁决、Current/IA/Low-Fi、001～078、以及已完成 PDM；存在未解释反向证据时禁止作为 Batch 2/3 确定项，强制转 Batch 4。若早批已确认后才发现遗漏证据，必须回开并登记 supersession。 | 防止 later-file-wins、摘要压缩和“后期写了废弃就自动判死旧规则”的回归。 | 2026-10-04 用户明确“写入吧” | 2026-10-04 |
| PDM10-REOPEN-B2-10 | PDM-10 | P10-B2-10 | 原“禁止恢复名邦员工内部价独立 permission”虽已在 Batch 2 被用户确认，但后续全局复核发现其遗漏已完成 PDM-02 正式规则、R4 权限规则、IA V5 反向承载及 001～078 冲突记录，因此该分类无效并正式回开。 | 保留原确认记录作审计；P10-B2-10 不再作为当前 DO_NOT_RESTORE，有效规则由 P10-B4-01 替代。 | PDM-02 最终规则 + R4 + IA V5 + 001～078 + 2026-10-04 用户当前复核 | 2026-10-04 |
| PDM10-DEC-A13 | PDM-10 | P10-A13 | 用户确认阶梯加价基数机制无问题：底价即 upstream_wholesale_price；有底价优先作为 base_wholesale_price，无底价回退 upstream_list_price；加价开启按 base + tier，加价关闭显示 upstream_list_price。 | P10-A13 通过。 | PDM-10 证据复核 + 2026-10-04 用户明确“这条应该是没有关系” | 2026-10-04 |
| PDM10-DEC-A14 | PDM-10 | P10-A14 | 用户明确同意客户展示价覆盖扩展到批发、名邦、4S 三类车源；覆盖只改最终展示结果，不改底层原始/内部价格事实。 | P10-A14 通过。 | PDM-10 Batch 3 + 2026-10-04 用户明确“P10-A14同意” | 2026-10-04 |
| PDM10-RECLASS-A15 | PDM-10 | P10-A15 | 原“取消名邦员工内部价独立 permission”候选因与 PDM-02 正式规则、R4、IA V5、001～078 冲突，被撤回 Batch 3 并重新分类到 Batch 4。 | 不再作为 informed change；由 P10-B4-01 承接。 | 2026-10-04 全局复核 | 2026-10-04 |
| PDM10-GATE-B3 | PDM-10 | Batch 3 Gate | P10-A13、P10-A14 用户确认通过；P10-A15 因真实跨证据冲突撤回并转 Batch 4。 | Batch 3 状态为 COMPLETE_USER_CONFIRMED_WITH_ONE_RECLASSIFIED，允许进入 Batch 4。 | 2026-10-04 用户审查 + 全局复核 | 2026-10-04 |
| PDM10-DEC-B4-01 | PDM-10 | P10-B4-01 | 用户再次明确：名邦员工查看内部价/底价必须采用后台可配置独立 permission；勾选可看，不勾选不可看。permission 服从“角色模板默认 + 员工个人授权/禁用 + data scope + object state”；进入内部模式不自动授予；能看不等于能调价/覆盖/电话/上下架；4S 查看名邦内部价继续 hard DENY。 | 直接继承并再次确认 PDM-02 当前正式规则；R11 历史原件不改。 | PDM-02 最终规则 + R4 + IA V5 + 001～078 + 2026-10-04 用户明确裁决 | 2026-10-04 |

| METHOD-20261004-ONE-PASS-INTEGRITY | METHOD | 信息保真 / 一次性收口硬门禁 | 用户明确要求解决“越写越丢、后续 PDM 反复失忆”的系统性问题，并批准将规则固化。自本裁决起，所有 PDM 必须执行 Memory Zero-Trust、Current Authority Refresh、Completed-PDM Dependency Card、Global Invariant Gate、Terminology Normalization、No Summary-on-Summary、双向可追溯、否定结论证明、Conflict Before Classification、Deferred Handoff Closure、Change Impact Analysis、Semantic Completeness Matrix、Final Semantic Integrity + Implementation-Ready Gate；并使用统一检查模板留痕。 | 以后 `UNMAPPED=0` 不再足以证明完整；COMPLETE 必须同时满足双向追溯、跨 PDM 冲突清零、全局不变量冲突清零、语义完整、否定结论验证、用户最终批准、施工就绪。记忆只能用于检索线索，不得代替当前 GitHub 证据。 | 2026-10-04 用户明确要求“先把规则定好，防止 PDM11 以后继续丢；这次必须一次性完成，所有细节和大框都不能丢” | 2026-10-04 |

## 2026-10-04｜PDM-10 Batch 4 / Final 收口

| Decision ID | 域 | Atom / Gate | 当前最终结论 | 影响 / 覆盖关系 | 用户证据 | 日期 |
|---|---|---|---|---|---|---|
| PDM10-DEC-A10-R1 | PDM-10 | P10-A10 Final Refinement | 每个客户等级均可后台独立配置批发价查看权益为 LIMITED 或 UNLIMITED；等级变化当天立即按新权益生效；不限量时列表页/详情页直接显示合法数字客户价；不限量浏览不批量转化成永久单车授权。 | 补全原 A10 的等级权益和时间语义；不改变“等级不改变售价”。 | 用户明确“这两个都是统一的”并随后“同意” | 2026-10-04 |
| PDM10-DEC-B4-02 | PDM-10 | P10-B4-02 | JYT→名邦继续同 vehicle_id、同 listing_cycle；转换保存价格快照；customer_list_price 不继承批发客户展示价；有效同周期 override 继续；internal_wholesale_price 仅复制真实 upstream_wholesale_price，无则为空。 | 覆盖旧“新名邦车继承展示价 / base 批发价”模型，与 PDM-04 same-vehicle conversion 对齐。 | 用户明确同意 | 2026-10-04 |
| PDM10-DEC-B4-03-R1 | PDM-10 | P10-B4-03 | 临时追加属于 customer-day quota；普通销售必须 current owner + permission；经理/店长无需 owner，但须 permission + data scope；4S HARD DENY；System Admin 仅配置不执行业务动作。 | 恢复并细化历史遗漏；owner 变化/离职不撤回已追加次数；UTC+8 次日失效。 | 用户明确同意并确认与 A10 统一 | 2026-10-04 |
| PDM10-DEC-B4-04 | PDM-10 | P10-B4-04 | 未解锁批发价时客户端显示“查看价格”，后台仍用真实当前客户展示价参与数字筛选/排序；查询不授权不扣额，响应不得泄露精确数字。 | 恢复 R10-75 / R4 排序合同。 | 用户明确同意 | 2026-10-04 |
| PDM10-DEC-B4-05 | PDM-10 | P10-B4-05 | 低于 base_wholesale_price / internal_wholesale_price 的客户价允许保存并生效，但必须明显风险警告与审计；无基准不比较；不增加经理审批/强制亏损理由。 | 明确低价风险是告警而非硬拦截。 | 用户明确“确认 P10-B4-05” | 2026-10-04 |
| PDM10-DEC-B4-06 | PDM-10 | P10-B4-06 | 取消独立“调价 permission / 调价动作”；名邦/4S customer_list_price、internal_wholesale_price 作为正常车辆编辑字段通过“保存修改”提交。 | 显式 supersede PDM-02 旧独立调价表述、PDM-06 §15 旧“调价不进保存修改”表述、R11/Current 旧 carrier。 | 用户明确同意 | 2026-10-04 |
| PDM10-DEC-B4-07 | PDM-10 | P10-B4-07 | 三类车源支持客户展示价覆盖，但覆盖操作仅名邦内部授权人员执行；4S 成员设置/修改/取消覆盖价 HARD DENY。 | 4S 正常 customer_list_price 编辑与 override 操作明确分离。 | 用户明确同意 | 2026-10-04 |
| PDM10-DEC-B4-08 | PDM-10 | P10-B4-08 | 客户数字价格主要用“万”；无数字=价格咨询；批发未解锁=查看价格；员工内部必须明确区分客户展示价/客户标价/内部批发价/上游价等语义。 | 恢复价格展示格式与字段语义 Guard。 | 用户明确同意 | 2026-10-04 |
| PDM10-DEC-B4-09 | PDM-10 | P10-B4-09 | 4S 成员可进入自己有权管理的 4S 车辆管理视图，再按 hard DENY 裁剪；不再全局 DENY internal vehicle-management carrier。 | Current IA 的整体角色门禁标记 stale carrier，交 PDM-21/IA 对齐。 | 用户明确“同意” | 2026-10-04 |
| PDM10-DEC-B4-10 | PDM-10 | P10-B4-10 | 修改 internal_wholesale_price 除正常车辆编辑/管理、scope、state 外，还必须具备独立内部价查看 permission；无该 permission 后端不返回、页面不展示、接口不得提交。 | 解决“取消独立调价 permission”与“内部敏感字段保护”交叉冲突；customer_list_price 不要求内部价查看 permission。 | 用户明确“同意” | 2026-10-04 |
| PDM10-GATE-B4 | PDM-10 | Batch 4 Gate | P10-B4-01～P10-B4-10 全部完成用户明确裁决；A10/B4-03 Final Review 补全已纳入。 | Batch 4 正式关闭，进入完整性与双向追溯门禁。 | 2026-10-04 连续用户确认 | 2026-10-04 |
| PDM10-COVERAGE-GATE | PDM-10 | Full Coverage / Integrity | M11-001～M11-017 17/17 均有明确去向；Source→Final 与 Final→Source 双向追溯完成；跨 PDM supersession 与 handoff 均登记。 | SOURCE_DECISION_COVERAGE=100%；UNMAPPED=0；FINAL_TO_SOURCE_TRACEABILITY=100%；CROSS_PDM_CONFLICT=0；SEMANTIC_INTEGRITY=PASS。 | 全量检查卡 + 覆盖报告 | 2026-10-04 |
| PDM10-SUPERSEDE-P02-P06 | PDM-10 | Cross-PDM Supersession | PDM-02 独立“调价 permission”旧表述、PDM-06 §15“调价不得混入保存修改”旧表述由 P10-B4-06 正式覆盖；internal_wholesale_price 字段仍受 B4-10 内部价查看 permission 保护。 | PDM-02 / PDM-06 Final 已加入后续跨域修正，避免旧 Final 回归。 | P10-B4-06 / B4-10 用户批准 | 2026-10-04 |
| PDM10-GATE-FINAL | PDM-10 | Final Domain Overview | 用户最终批准 PDM-10 完整规则总览。 | PDM-10 正式 COMPLETE；Final=07_重建工作区/PDM-10_最终完整规则.md；Coverage/Integrity 全门禁 PASS；允许进入 PDM-11 准备。 | 用户最终“同意”，随后明确“确定执行” | 2026-10-04 |

## 2026-10-04｜PDM-01～PDM-10 Legacy Final Integrity Audit

| Decision ID | 域 | 事项 | 当前最终结论 | 影响 / 执行要求 | 用户证据 | 日期 |
|---|---|---|---|---|---|---|
| METHOD-20261004-LEGACY-FINAL-INTEGRITY | METHOD | PDM-01～PDM-10 新标准补审门禁 | 用户明确要求：PDM-10 完成后先不进入 PDM-11，先对 PDM-01～PDM-10 重新做完整性复核；复核不仅细检现有 Final，还必须重新查整条遗漏，并检查跨 PDM 冲突与 handoff。 | 新增 §3.3 Legacy Final Integrity Audit Gate。PDM-01～10 历史 COMPLETE 保留，但在本轮 PASS 前不得视为满足当前新完整性标准；PDM-11 BLOCKED。 | 用户明确“怎么写进规则里…先做PDM1到PDM10，然后再做PDM11以后” | 2026-10-04 |
| METHOD-20261004-LEGACY-THREE-LAYER | METHOD | 三层审计模型 | 每个旧 PDM 必须同时执行 Missing Rule Audit、Semantic Detail Audit、Cross-PDM Integrity Audit；不能只做 Final 文案精检。 | 整条遗漏、语义细节缺失、跨域冲突/静默覆盖/handoff 丢失三类都必须清零。 | 用户追问“有没有再查遗漏，还是只是不细检”后明确要求写入规则 | 2026-10-04 |
| METHOD-20261004-LEGACY-REOPEN-ONLY | METHOD | 旧 PDM 的 reopen 策略 | 本轮不是 PDM-01～10 全量推倒重做；只有发现问题的 Atom / 段落才 reopen。完整规则记录 INTEGRITY_PASS；真正改变产品语义的 reopen 仍必须用户裁决。 | 避免重复重建，同时保证旧 Final 的遗漏/细节/冲突可被纠正。 | 本轮用户确认执行方向 | 2026-10-04 |
| METHOD-20261004-PDM11-BLOCK | METHOD | PDM-11 启动门禁 | PDM-01～PDM-10 全部 INTEGRITY_PASS 且 01～10 全局 Cross-PDM / Handoff / Global Invariant 总复核 PASS 后，才允许开始 PDM-11。 | 当前项目阶段改为 PDM-01～10 Legacy Final Integrity Audit，从 PDM-01 开始。 | 用户明确先做 PDM1～PDM10，再做 PDM11 以后 | 2026-10-04 |

| PDM01-LIA-001 | PDM-01 | Legacy Integrity / 显式登录边界 | 恢复 PDM01-DEC-A02 的完整语义：V1 不建设显式独立登录页；首次进入直接按微信身份识别 → customer_id → 客户端首页。 | 修正旧 Final 仅写“不建设传统账号密码登录体系”造成的语义压缩；不新增产品变化。 | PDM01-DEC-A02 + R10-55 + 2026-10-04 Integrity Audit | 2026-10-04 |
| PDM01-LIA-002 | PDM-01 | Legacy Integrity / 手机号授权拒绝时找车表单 | 客户已填写找车表单、提交时因缺手机号触发授权，拒绝 / 取消后不创建正式申请 / 人工服务对象；当前页面输入可临时保留便于重试，但不是服务端正式草稿，也不保证离页后恢复。 | 补回 R10-67 被 Final 压掉的交互语义；不改变手机号硬门槛。 | R10-67 + PDM01-DEC-A07 + 2026-10-04 Integrity Audit | 2026-10-04 |
| PDM01-LIA-003 | PDM-01 | Legacy Integrity / 手机号维护 handoff closure | PDM-02 已将其他联系电话维护冻结为 `customer.phone.manage + data scope`；active 名邦员工满足权限与范围才可操作，4S hard DENY，全部审计，主要手机号不因此开放直接修改。 | 关闭 PDM-01 原“留 PDM-02”旧 handoff，不再作为未决事项。 | PDM-02 Final §11 + PDM01-DEC-A14 | 2026-10-04 |
| PDM01-LIA-004 | PDM-01 | Legacy Integrity / 接客池异常为空 | 正常池可用时自然注册立即形成 owner；异常池空且无其他优先归属来源时 Customer 身份仍建立并进入 `owner_assignment_pending`，不得创建 responsible=null 正式人工业务，不得让 System Admin 兜底成为 owner，池恢复后自动重试并审计。 | 补回 PDM-02 / PDM-03 已冻结的正常规则例外，避免 PDM-01 绝对化表述。 | PDM-02 Final §10.1 + PDM-03 Final §10 | 2026-10-04 |
| PDM01-LIA-005 | PDM-01 | Legacy Integrity / owner 与分享 handoff closure | PDM-03 已完成 owner / 分享 / 转介绍 / 接客 / 离职交接收口；客户侧车辆分享对 ownerless 新客户可以形成转介绍 / 获客归属，已有 owner 不得被后续分享抢走。 | 显式覆盖 PDM01-DEC-A04 旧行中“普通客户侧车辆转发仍 SOURCE_ONLY”子句；旧 Decision 保留为历史审计轨迹，不得按旧子句恢复。 | PDM-03 Final + P03-A15 + PDM-01 当前 Final | 2026-10-04 |
| PDM01-DEC-A16-R1 | PDM-01 | 客户账号停用 / 恢复 | 用户重新裁决为轻量后台控制：客户无自助停用入口；后台通过独立受控 `customer.account.disable` 对 Customer 停用 / 恢复。停用后仍可访问网站 / 小程序与浏览公开内容，但暂停依赖 Customer 身份 / 权益的业务账号能力；不删除 customer_id、owner、来源、历史，不自动终止既有业务；恢复沿用原 customer_id，过期/终止对象或权益不复活。若只是降权，使用客户等级调整。 | 正式 supersede PDM01-DEC-A16 中“客户自助停用 + 未结束 Demand/Consultation/Lock/Transaction 必须先结束才能停用”的旧复杂闭环；权限继承 PDM-02 permission + data scope，4S hard DENY，System Admin 仅因控制平面身份不自动取得业务执行权；停用/恢复必须审计。 | 2026-10-04 用户连续确认：后台可停用/恢复、停用后允许公开浏览、独立受控权限，并最终“确认执行” | 2026-10-04 |
| PDM01-LIA-GATE | PDM-01 | Legacy Final Integrity Audit | PDM-01 本轮 Missing Rule、Semantic Detail、Cross-PDM / Handoff 发现项均已闭环；Final、Decision 与状态文件已同步。 | MISSING_RULE_UNRESOLVED=0；SEMANTIC_DETAIL_GAP_UNRESOLVED=0；CROSS_PDM_CONFLICT=0；HANDOFF_GAP_UNRESOLVED=0；SOURCE_DECISION_COVERAGE=100%；FINAL_TO_SOURCE_TRACEABILITY=100%；SEMANTIC_INTEGRITY=PASS；NEGATIVE_CLAIMS_VERIFIED=PASS；IMPLEMENTATION_READY=PASS。允许进入 PDM-02 Legacy Final Integrity Audit；PDM-11 仍 BLOCKED。 | PDM-01 Legacy Audit + 用户 2026-10-04 最终“确认执行” | 2026-10-04 |

| METHOD-20261004-CARRIER-ALIGN-AFTER-PDM25 | METHOD | IA / Low-Fi 集中对齐时点 | 用户明确冻结：PDM-01～PDM-25 产品规则全部完成并通过 01～25 全局 Cross-PDM / Handoff / Global Invariant 最终总复核后，才统一执行 IA 与 Low-Fi 集中对齐；PDM-10 后不插入一次中间整改。 | PDM 阶段仍必须扫描 IA / Low-Fi 冲突并登记 STALE_CARRIER、正确 Authority、受影响载体和未来修正要求，但当前不直接改 carrier；对齐完成后再进入 Engineering / 施工。 | 2026-10-04 用户明确“等到P25完成以后再说”并随后确认执行 | 2026-10-04 |
| PDM01-DEC-A16-R2 | PDM-01 / PDM-02 | Customer 账号停用 / 恢复执行主体 | 用户进一步明确：System Admin 可以直接执行 Customer 账号停用 / 恢复；该动作属于控制平面治理动作，不视为销售 / CRM / owner / Lock / Transaction 业务执行。经理 / 店长等 active 名邦员工仍需满足 `customer.account.disable + Customer data scope`；普通销售默认关闭但可明确授权；4S hard DENY。 | 显式覆盖 PDM01-DEC-A16-R1 中“System Admin 仅配置、不直接执行”的窄解释；PDM-01 Final 与 PDM-02 Final 同步修正。 | 2026-10-04 PDM-02 Integrity Audit 期间用户明确“第七条同意”，随后确认执行 | 2026-10-04 |
| PDM02-LIA-001 | PDM-02 | 权限变化即时生效 | 补回：role / permission / data scope / account status 等当前权限事实变更原则上立即生效；旧登录态、旧页面、旧缓存不得继续使用已撤销能力；敏感提交按当前事实重验。 | 修复旧 Final 只保留“提交时重验”而压掉即时 revoke 语义。 | 9/19 R1 §5 + IA V5 revoke/inactive guards + 2026-10-04 Integrity Audit | 2026-10-04 |
| PDM02-LIA-002 | PDM-02 | inactive 恢复 / 复职接客状态 | 重新入职或 inactive→active 后均不自动恢复 accepting；接客状态默认 OFF，需本人或有权限且范围覆盖的管理人员重新开启。 | 补齐旧 Final 只写“重新入职默认关闭”造成的范围压缩，并与 PDM-03 §15 对齐。 | 9/19 R1 §10 + M02-002 + PDM-03 Final §15 | 2026-10-04 |
| PDM02-LIA-003 | PDM-02 | 调店前交接 | 员工跨店 / 角色 / scope 变化导致原责任范围失效时，必须先交接受影响 Customer 与活跃业务；A店→B店后按B店当前权限与 scope 生效，历史门店/角色/责任不回写。 | 恢复 R1 §11 的明确调店 Guard。 | 9/19 R1 §11 + M15-001 + 2026-10-04 Integrity Audit | 2026-10-04 |
| PDM02-LIA-004 | PDM-02 | 治理审计最小字段 | 权限 / 角色 / data scope / 账号状态等关键治理审计至少保留 actor、time、before、after；默认不强制每次填写原因，具体业务另有要求除外。 | 补回 R1 §15 被 Final 泛化掉的最小字段与 reason 边界。 | 9/19 R1 §15 + M15-001 | 2026-10-04 |
| PDM02-LIA-005 | PDM-02 | 接客关闭与离职交接 / Handover Batch | accepting=OFF 只退出未来自然轮询，不移动既有客户/责任；active+eligible 的本人有效分享仍可获客。inactive / 离职交接需同时处理 owner 与活跃业务，并形成可追溯 handover batch。 | 同步 PDM-03 已完成 Authority，关闭 PDM-02 的语义压缩与旧 handoff。 | M02-002 + PDM-03 Final §§10,13-15 | 2026-10-04 |
| PDM02-LIA-006 | PDM-02 | System Admin 自身治理 | 首个 System Admin 由 bootstrap 建立；后续 System Admin 新增 / 启用 / 停用由 active System Admin 治理；始终至少保留 1 个 active，最后一个不可停用；治理变更审计。 | 补齐 Final 仅写“由 active Admin 管理”的动作闭环；IA / Low-Fi 缺“新增 Admin”入口登记为 stale carrier。 | PDM02-DEC-A17/A19 + M15-001 | 2026-10-04 |
| PDM02-LIA-007 | PDM-02 / PDM-01 | Customer 账号停用 / 恢复控制平面动作 | System Admin 可直接执行 Customer 账号停用 / 恢复；该动作不授予客户业务执行权。经理 / 店长等名邦员工走 `customer.account.disable + data scope`；普通销售默认关闭可授权；4S hard DENY。 | 用户本轮显式产品裁决；同步 PDM-01 Final，形成 PDM01-DEC-A16-R2。 | 2026-10-04 用户“第七条同意” + 确认执行 | 2026-10-04 |
| PDM02-LIA-008 | PDM-02 | 已完成跨域 handoff closure | 原 §15 中 PDM-03/PDM-04/PDM-06/PDM-09/PDM-10 的“留后续”已过期，改为已完成承接：owner/接客/交接、一键转名邦/4S责任、上游电话、价格/覆盖/内部价均同步当前结果；只保留 PDM-15～25 尚未完成的真实 handoff。 | 清除 stale handoff，避免开发继续按“未定”理解已冻结规则。 | PDM-03/04/06/09/10 Final + 2026-10-04 Cross-PDM Audit | 2026-10-04 |
| PDM02-LIA-GATE | PDM-02 | Legacy Final Integrity Audit | PDM-02 本轮 8 组 reopen 全部闭环；Final、Decision、PDM-01 联动修正与状态文件已同步。 | MISSING_RULE_UNRESOLVED=0；SEMANTIC_DETAIL_GAP_UNRESOLVED=0；CROSS_PDM_CONFLICT=0；HANDOFF_GAP_UNRESOLVED=0；GLOBAL_INVARIANT_CONFLICT=0；SOURCE_DECISION_COVERAGE=100%；FINAL_TO_SOURCE_TRACEABILITY=100%；SEMANTIC_INTEGRITY=PASS；NEGATIVE_CLAIMS_VERIFIED=PASS；IMPLEMENTATION_READY=PASS。允许进入 PDM-03 Legacy Final Integrity Audit；PDM-11 仍 BLOCKED。 | PDM-02 Legacy Audit + 用户 2026-10-04 产品裁决与最终确认执行 | 2026-10-04 |

| PDM03-LIA-001 | PDM-03 | 客户主动要求更换销售 | 补回：Customer 可以提出更换负责销售；客户提出只是正式 owner 移交的触发来源之一，不直接自行改写 owner，仍由具备权限且 data scope 覆盖的经理/店长执行正式移交。 | 修复 R5 已冻结触发语义在 Final 中被压掉的问题；不改变正式 owner transfer 权限边界。 | R5 §11 + P03-A12 + 2026-10-05 Integrity Audit 用户全部同意 | 2026-10-05 |
| PDM03-LIA-002 | PDM-03 | 普通 owner 移交原因字段 | 普通 owner 移交至少记录原 owner、新 owner、操作人、时间；默认不强制每次填写 reason。具体业务/风控如另有明确要求则服从更具体规则。 | 与离职/资格失效 handover 的交接原因要求区分；不把离职批次规则错误扩大到所有普通 owner transfer。 | R5 §12 + PDM-03 当前审计 | 2026-10-05 |
| PDM03-LIA-003 | PDM-03 | 复职 / inactive→active | 重新入职或从 inactive 恢复 active 均复用原 employee_id，不自动恢复旧 permission、旧 Customer、旧业务责任或 accepting；接客默认 OFF，旧登录态不得复活。 | 同步 PDM-02 当前已闭环规则，修复 PDM-03 仅写“重新入职”的范围压缩。 | PDM-02 Final §9.4 + M02-002 | 2026-10-05 |
| PDM03-LIA-004 | PDM-03 | 离职/失效交接对象范围 | 离职、inactive、失去资格时除 Customer owner 外，至少扫描 Demand、Priority、Consultation、Waitlist、Lock、Transaction 等适用对象；Priority 具体 TTL/可见性/承接 lifecycle 仍由 PDM-13 冻结。 | 修复 Final 只写“活跃业务”导致对象清单被压薄的问题；不提前写死 PDM-13 lifecycle。 | SSOT §8.4 + M02-002 + PDM-02 Final §9.5 | 2026-10-05 |
| PDM03-LIA-005 | PDM-03 | Handover Batch 完整语义 | handover batch 至少追溯批次ID、失效员工/时间、受影响 Customer/活跃业务、原/新 owner 或负责人/关系、操作人、时间、原因、再次分配历史；逐对象映射；部分失败不回滚已成功项，未完成项保持待处理并可继续重试。 | 补回 SSOT/IA/PDM-02 已存在但 PDM-03 Final 被压薄的交接闭环。 | SSOT §8.5 + M02-002 + IA HANDOFF_MAPPING_PARTIAL + PDM-02 Final §9.5 | 2026-10-05 |
| PDM03-LIA-006 | PDM-03 / PDM-10 | 分享与查价权 handoff closure | 普通分享不授价、收藏不授价、二次分享不转移价格权；正式 Recommendation 才授对应 customer+vehicle+listing_cycle 免费查价权。Recommendation lifecycle 本身继续交 PDM-14。 | 关闭 PDM-03 §18 仍写“分享是否授予查价权限待 PDM-10/PDM-14”的 stale handoff。 | PDM-10 Final §10 | 2026-10-05 |
| PDM03-LIA-007 | PDM-03 | 公司客户历史访问边界 | Customer 完整业务历史属于公司客户档案；新 owner 在当前合法 data scope 内查看必要历史；原销售以后是否可见取决于当前 identity/permission/data scope，不因历史服务过而永久保留访问权。 | 恢复 SSOT §8.1 被 Final 压掉的访问原则；具体 CRM 字段/页面投影仍交 PDM-16。 | SSOT §8.1 + 2026-10-05 Integrity Audit | 2026-10-05 |
| PDM03-LIA-008 | PDM-03 / PDM-01 | Customer 停用对 owner 的影响 | Customer 账号停用/恢复不清空 customer_id、current owner、原始来源、转介绍关系或历史；恢复继续原 Customer，不重新制造第二套 owner 历史。 | 同步 PDM-01 后续已完成 Authority，避免 PDM-03 owner 主域出现空白。 | PDM-01 Final §11/§13 | 2026-10-05 |
| PDM03-LIA-009 | PDM-03 | IA / Low-Fi stale carrier ledger | 当前只登记不修改：旧“首次进入不形成 owner”投影、客户分享永久 SOURCE_ONLY、直接转介绍/推荐朋友真人入口不足、handover 页面通用壳等。 | 统一标记 STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT；carrier 不得反向覆盖 PDM Final。 | IA Current + 001～078 M02 + METHOD-20261004-CARRIER-ALIGN-AFTER-PDM25 | 2026-10-05 |
| PDM03-LIA-GATE | PDM-03 | Legacy Final Integrity Audit | PDM-03 本轮 9 组 reopen 全部闭环；Final、Decision、跨 PDM handoff 与状态文件同步。 | MISSING_RULE_UNRESOLVED=0；SEMANTIC_DETAIL_GAP_UNRESOLVED=0；CROSS_PDM_CONFLICT=0；HANDOFF_GAP_UNRESOLVED=0；GLOBAL_INVARIANT_CONFLICT=0；SOURCE_DECISION_COVERAGE=100%；FINAL_TO_SOURCE_TRACEABILITY=100%；SEMANTIC_INTEGRITY=PASS；NEGATIVE_CLAIMS_VERIFIED=PASS；IMPLEMENTATION_READY=PASS。允许进入 PDM-04 Legacy Final Integrity Audit；PDM-11 仍 BLOCKED。 | PDM-03 Legacy Audit + 2026-10-05 用户“全部同意”并确认执行 | 2026-10-05 |

| METHOD-20261005-CROSS-PDM-HANDOFF-BIDIRECTIONAL | METHOD | Cross-PDM Handoff 双向闭环 | 用户明确要求修复旧流程：不仅来源 PDM 要记录“交后续”，目标 PDM 完成后还必须反向回写来源 PDM，并建立统一 Cross-PDM Handoff Register。 | 固定状态为 HANDOFF_OPEN / HANDOFF_ACCEPTED / HANDOFF_CLOSED / HANDOFF_SUPERSEDED；目标 COMPLETE 前必须清空 incoming OPEN/ACCEPTED；目标关闭后同次更新 Register、来源 Final、来源 Integrity 报告、Decision/状态文件。已完成目标但来源仍写“留后续”= STALE_HANDOFF / SOURCE_BACKWRITE_PENDING。 | 2026-10-05 用户明确“直接把这个规则加入到仓库里，并把 PDM01 到 04 出现的问题/交后方事项都写进去” | 2026-10-05 |
| METHOD-20261005-HANDOFF-BACKFILL-P01-P04 | METHOD | PDM-01～04 handoff 历史回填 | 新建 `07_重建工作区/CROSS_PDM_HANDOFF_REGISTER.md`，一次性回填 PDM-01～04 已关闭问题、已完成 handoff、仍开放 handoff、PDM-04 当前审计候选与 post-PDM25 stale carrier。 | PDM-04 §20 同步把 PDM-05～10 从“留后续”改成 HANDOFF_CLOSED；PDM-04 Supply Anomaly 新业务 Guard 仍保持 DECISION_REQUIRED，不因方法回填自动裁决。 | 2026-10-05 用户授权直接执行 | 2026-10-05 |

| PDM04-LIA-001 | PDM-04 | listing_cycle 开始时间 | 补回：current cycle 的 listing_started_at 取可信真实上架/重上架时间；无可信上游真实时间时取名邦首次确认本次不可售→可售的时间；人工车取正式发布/重上架成功时间。 | 修复旧 Final 只写“何时新建 cycle”但未写 started_at 取值规则。 | PDM-04 Integrity Audit + 用户 2026-10-05 确认执行 | 2026-10-05 |
| PDM04-LIA-002 | PDM-04 | 车辆时间概念分离 | listing_started_at、人工上传/首次创建时间、JYT first_seen_at/平台收录时间分离；最新上架按 current cycle started_at；今日新增只算首次进入系统并正式在售，不因 relist 重复计入。 | 禁止把 JYT first_seen_at 伪称为上游真实上传时间；客户端展示交 PDM-20。 | SSOT + M07 + Integrity Audit | 2026-10-05 |
| PDM04-LIA-003 | PDM-04 | 4S source_type 与成员权限 | source_type=4S 不自动授权任意 4S 成员；名邦员工上传并选择 4S 合作车源的车辆仍为名邦公司业务资产，4S 成员只能操作当前真正有权管理范围内车辆。 | 补齐 source_type 与 data-scope/账号授权分离的负向 Guard。 | M07 + PDM-02/06 当前规则 | 2026-10-05 |
| PDM04-LIA-004 | PDM-04 | locked/trading 真实车辆事实更新 | locked/trading 不冻结现实车辆事实；有权限人员仍可记录真实价格、车况、里程/资料、供应变化。重大变化可触发 anomaly，但不得自动取消 Lock/Transaction、覆盖 Lock snapshot、删除资金事实或回写交易历史。 | 明确与“一键转名邦”动作 Guard 分离，禁止使用 biz_status!=normal → 禁止一切事实更新。 | DEC-059 + M07-043 + Integrity Audit | 2026-10-05 |
| PDM04-LIA-005 | PDM-04 / PDM-08 | 图片资产化 handoff closure | 批发→名邦 source conversion 一旦合法完成，图片资产化为独立子任务；processing/partial_failed/failed 均不得回滚来源转换、vehicle_id、listing_cycle 或既有业务关系。 | 关闭 PDM-04→PDM-08 stale handoff。 | PDM-08 §§10-13 | 2026-10-05 |
| PDM04-LIA-006 | PDM-04 / PDM-10 | 转换价格 handoff closure | 一键转名邦保持同 vehicle/cycle；保存转换时不可变价格快照；转换后停止 JYT 阶梯作为名邦当前价，customer_list_price 不自动继承批发展示价；真实 upstream_wholesale_price 才可初始化 internal_wholesale_price，否则 null。 | 关闭 PDM-04→PDM-10 stale handoff。 | PDM-10 §13 | 2026-10-05 |
| PDM04-LIA-007 | PDM-04 | PDM-05～10 stale handoff 清理 | PDM-05/06/07/08/09/10 已完成目标全部改为 HANDOFF_CLOSED 并反向写回 PDM-04 §20。 | 贯彻 2026-10-05 Cross-PDM Handoff 双向闭环规则。 | CROSS_PDM_HANDOFF_REGISTER + 已完成 PDM Final | 2026-10-05 |
| PDM04-LIA-008 | PDM-04 / PDM-09 | car_code 与电话定位隔离 | car_code 继续用于 JYT 车辆/来源身份语境，不得恢复为电话获取唯一依据；电话按 PDM-09 当前 source_platform + upstream_publisher_id 等 publisher identity 规则处理。 | 防止车辆身份字段跨域污染电话链路。 | PDM-09 Final + Integrity Audit | 2026-10-05 |
| PDM04-LIA-009 | PDM-04 / PDM-22 / PDM-23 | JYT 三个固定业务 API handoff | V1 固定新增/更新车源、批量确认下架、获取当前仍在售批发车源三个业务 API；外部程序无 DB 账号；名邦同步 API credential 与 JYT 登录凭证、Collector 电话鉴权分离；三个接口独立启停并保留必要调用统计。PC 运行管理交 PDM-22，Incident/通知/SLA/DND 交 PDM-23。 | 正式建立 HO-P04-P22-002 / HO-P04-P23-001；不把运行/通知 carrier 误当车辆业务状态。 | 9/6 SSOT + M07-003 + Coverage Map | 2026-10-05 |
| PDM04-LIA-010 | PDM-04 | IA / Low-Fi stale carrier ledger | 双 Vehicle+conversion relation、旧粗粒度 normal-only Guard、旧价格/调价 carrier、4S 入口旧限制、车源/集成/供应异常通用壳等统一登记 STALE_CARRIER。 | 延后到 PDM-25 + 01～25 全局总复核后集中 IA/Low-Fi Alignment。 | IA/Low-Fi scan + METHOD-20261004-CARRIER-ALIGN-AFTER-PDM25 | 2026-10-05 |
| PDM04-LIA-011 | PDM-04 | Supply Anomaly 新业务 Guard | 用户选择 B：Supply Anomaly 本身是风险告警，不统一阻断新增业务；Recommendation/Consultation/Waitlist/Lock/Transaction 等继续由真实 source/resource 可售事实、visibility、对象 Guard 和对应 PDM 判断。只有真实 offline/unavailable 才按不可售事实硬阻断新增普通销售业务。 | 不把所有 anomaly 一刀切升级成业务冻结；后续若某类异常需 blocking，必须单独明确定义。 | 2026-10-05 用户明确“B更合适”并确认执行 | 2026-10-05 |
| PDM04-LIA-GATE | PDM-04 | Legacy Final Integrity Audit | PDM-04 11 组问题全部闭环；Final、Cross-PDM Handoff Register、Decision 与状态文件同步。 | MISSING_RULE_UNRESOLVED=0；SEMANTIC_DETAIL_GAP_UNRESOLVED=0；CROSS_PDM_CONFLICT=0；HANDOFF_GAP_UNRESOLVED=0；GLOBAL_INVARIANT_CONFLICT=0；SOURCE_DECISION_COVERAGE=100%；FINAL_TO_SOURCE_TRACEABILITY=100%；SEMANTIC_INTEGRITY=PASS；NEGATIVE_CLAIMS_VERIFIED=PASS；IMPLEMENTATION_READY=PASS；HANDOFF_REGISTER_SYNC=PASS。允许进入 PDM-05 Legacy Final Integrity Audit；PDM-11 仍 BLOCKED。 | PDM-04 Legacy Audit + 用户 2026-10-05 最终裁决/确认执行 | 2026-10-05 |

| PDM05-LIA-001 | PDM-05 / PDM-06 | PDM-06 handoff closure | PDM-05 §15 原“固定属性带出/发布字段/草稿恢复留 PDM-06”已由 PDM-06 实际完成，正式改为 HANDOFF_CLOSED；MODEL_MISSING 返回原 draft，固定属性自动带出。 | 关闭 stale handoff，并按双向 handoff 规则反向写回 PDM-05。 | PDM-06 §8/§8A + PDM06-REV-COVER-01 | 2026-10-05 |
| PDM05-LIA-002 | PDM-05 | mapping conflict 业务连续性 | 同一 JYT model_id 出现明显 mapping conflict 时，不自动改映射，但冲突本身也不自动冻结车辆既有正常业务；只有独立 offline/unavailable/hidden/business-state Guard 才按对应规则阻断。 | 恢复 R3“车辆业务继续”的关键边界。 | R3 §9 + PDM-05 Integrity Audit | 2026-10-05 |
| PDM05-LIA-003 | PDM-05 | pending / conflict 明确提示 | 未映射、缺品牌/车系/具体车型、MODEL_MISSING 必须形成“车型字典归属待确认”等明确待处理状态；已确认 mapping 与新来源事实冲突单独标“车型映射冲突”。 | 禁止 silent omission，区分 pending 与 conflict。 | R3 §§6/17 + M09 | 2026-10-05 |
| PDM05-LIA-004 | PDM-05 / PDM-02 | 车型治理执行主体 4A | 用户选择 4A：历史“后台 Admin”统一解释为 System Admin 控制平面；车型主数据/JYT mapping/MODEL_MISSING/conflict/merge 属于控制平面治理，`vehicle.model.manage` 为治理能力 Guard。普通员工角色不会因车辆管理能力自动获得该治理权。 | 与 PDM-02 System Admin 身份隔离和“配置/治理≠员工业务执行”一致；V1 不静默开放独立员工车型管理员。 | 用户 2026-10-05 明确“4A”并确认执行 | 2026-10-05 |
| PDM05-LIA-005 | PDM-05 / PDM-06 | 固定车型属性纠错 5A | 用户选择 5A：由 vehicle_model_id 唯一确定的固定车型属性当前值跟随当前有效车型主档纠错；已发布车辆当前投影同步修正，但 Recommendation/Lock/Transaction/成交及其他历史快照不追改，JYT 原始 source facts 不反写；单车事实仍独立。 | 关闭 PDM-06 §8A 反向留回车型域的未决边界，明确 current truth 与 historical snapshot 分层。 | 用户 2026-10-05 明确“5A”并确认执行 | 2026-10-05 |
| PDM05-LIA-006 | PDM-05 | future handoff registry | 正式登记 PDM-12/20/21/22/25 handoff：Matching、客户端车型筛选/年款分组、员工 MODEL_MISSING 投影、System Admin PC 车型治理、统一审计历史。 | 符合 Cross-PDM Handoff Register 双向闭环方法。 | CROSS_PDM_HANDOFF_REGISTER | 2026-10-05 |
| PDM05-LIA-007 | PDM-05 | IA / Low-Fi stale carrier ledger | name-match 自动 mapping、no model creation、四级年款表现、pending/conflict=unknown 等旧 carrier 只登记 STALE_CARRIER。 | 延后 post-PDM25 IA/Low-Fi 全局对齐，不反向覆盖 PDM Final。 | M09 + IA Current + METHOD-20261004-CARRIER-ALIGN-AFTER-PDM25 | 2026-10-05 |
| PDM05-LIA-GATE | PDM-05 | Legacy Final Integrity Audit | PDM-05 7 组问题全部闭环；Final、PDM-02/PDM-06 cross-sync、Handoff Register、Decision 与状态文件同步。 | MISSING_RULE_UNRESOLVED=0；SEMANTIC_DETAIL_GAP_UNRESOLVED=0；CROSS_PDM_CONFLICT=0；HANDOFF_GAP_UNRESOLVED=0；GLOBAL_INVARIANT_CONFLICT=0；SOURCE_DECISION_COVERAGE=100%；FINAL_TO_SOURCE_TRACEABILITY=100%；SEMANTIC_INTEGRITY=PASS；NEGATIVE_CLAIMS_VERIFIED=PASS；IMPLEMENTATION_READY=PASS；HANDOFF_REGISTER_SYNC=PASS。允许进入 PDM-06 Legacy Final Integrity Audit；PDM-11 仍 BLOCKED。 | PDM-05 Legacy Audit + 用户 2026-10-05 4A/5A + 确认执行 | 2026-10-05 |

| PDM06-LIA-001 | PDM-06 | 草稿发布前 source_type 修改 | 补回 R10 已确认规则：未正式发布 draft 可在当前操作者合法可发布的人工来源范围内修改 source_type；首次发布时按最终来源重验权限/scope/最低字段；4S 成员仍固定 4S。 | 修复 Final 对 source_type 新建与发布后修改之间的语义断层。 | R10-36 + PDM-06 Integrity Audit | 2026-10-05 |
| PDM06-LIA-002 | PDM-06 / PDM-07 | 档案/车况 handoff closure | PDM-07 已完成：档案不是人工发布硬门槛；档案不完整不阻塞正常前段业务；必要资料只在 Transaction 完成/交付时按有效 required-field set 核验。 | 关闭 PDM-06→PDM-07 stale handoff。 | PDM-07 §§3-10,20 | 2026-10-05 |
| PDM06-LIA-003 | PDM-06 / PDM-08 | 人工车辆图片 handoff closure | PDM-08 已完成：0 图可发布；正式发布后可补图/删图/调序；删到 0 图仍可继续在售；普通相册与档案/报告资源隔离。 | 正式登记 HO-P06-P08-001=CLOSED。 | PDM-08 §§8,18 | 2026-10-05 |
| PDM06-LIA-004 | PDM-06 / PDM-10 | 价格 handoff closure | PDM-10 已显式覆盖旧“调价不得混入保存修改”：正常 customer_list_price/internal_wholesale_price 属于普通车辆编辑并通过保存修改提交；无独立调价 permission/action；内部价字段仍受独立查看 permission；价格字段均非发布硬门槛。 | 正式登记 HO-P06-P10-001=CLOSED。 | PDM-10 §§1,5,21 | 2026-10-05 |
| PDM06-LIA-005 | PDM-06 | future handoff registry | 正式登记 PDM-21/22/25 future handoff：员工端人工发布/草稿/VIN/MODEL_MISSING/保存修改/source_type 投影；PC 通用 CRUD 不得物理删除正式 Vehicle；统一审计/历史标准。 | 符合 Cross-PDM Handoff 双向闭环方法。 | CROSS_PDM_HANDOFF_REGISTER | 2026-10-05 |
| PDM06-LIA-006 | PDM-06 | IA / Low-Fi stale carrier ledger | DRAFT_RESUME、继续上次/放弃重新发布、MODEL_MISSING return DRAFT_RESUME、no model creation、缺草稿列表、VIN Gate、保存修改、source_type 草稿修改等旧 carrier 只登记 STALE_CARRIER。 | 延后 post-PDM25 IA/Low-Fi 全局对齐，不修改 carrier。 | M12 + IA/Low-Fi Current + METHOD-20261004-CARRIER-ALIGN-AFTER-PDM25 | 2026-10-05 |
| PDM06-LIA-GATE | PDM-06 | Legacy Final Integrity Audit | PDM-06 6 组问题全部闭环；Final、Handoff Register、Decision 与状态文件同步。 | MISSING_RULE_UNRESOLVED=0；SEMANTIC_DETAIL_GAP_UNRESOLVED=0；CROSS_PDM_CONFLICT=0；HANDOFF_GAP_UNRESOLVED=0；GLOBAL_INVARIANT_CONFLICT=0；SOURCE_DECISION_COVERAGE=100%；FINAL_TO_SOURCE_TRACEABILITY=100%；SEMANTIC_INTEGRITY=PASS；NEGATIVE_CLAIMS_VERIFIED=PASS；IMPLEMENTATION_READY=PASS；HANDOFF_REGISTER_SYNC=PASS。允许进入 PDM-07 Legacy Final Integrity Audit；PDM-11 仍 BLOCKED。 | PDM-06 Legacy Audit + 用户 2026-10-05 确认执行 | 2026-10-05 |

| PDM07-LIA-001 | PDM-07 / PDM-08 | 报告/档案资源 handoff closure | PDM-08 已完成报告/档案资源承载：人工上传报告/档案图片入名邦对象存储；出险/4S维保报告不进普通相册；4S维保H5 对外使用名邦可控报告域名；技术承载不决定 customer_visible。 | 关闭 PDM-07→PDM-08 stale handoff，客户可见性仍以 PDM-07 为 Authority。 | PDM-08 §§8,16-18,28 + PDM-07 Integrity Audit | 2026-10-05 |
| PDM07-LIA-002 | PDM-07 | 业务 future handoff registry | 正式登记 PDM-12/13/14/15/18/19：车况 provenance、unknown/confirmation_needed、Recommendation/Consultation/Lock/Waitlist 不因档案不完整阻断、Transaction 创建与完成资料 Gate 分层。 | 后续域不得静默把档案 incomplete 扩大成前段业务统一 Gate，也不得改写来源事实。 | CROSS_PDM_HANDOFF_REGISTER | 2026-10-05 |
| PDM07-LIA-003 | PDM-07 | 页面/配置/审计 future handoff registry | 正式登记 PDM-20/21/22/25：客户端 customer_visible/隐藏空模块/provenance；员工 archive maintenance；required-field set PC 配置；archive/config 统一审计。 | System Admin 身份本身不自动获得 required-field 员工业务配置权。 | CROSS_PDM_HANDOFF_REGISTER + P07-B4-04 | 2026-10-05 |
| PDM07-LIA-004 | PDM-07 | IA / Low-Fi stale carrier ledger | archive 上传/后补/替换/作废/历史、customer_visible、客户端隐藏空模块、provenance、4S archive access、Vehicle Archive audit 等缺失/冲突 carrier 只登记 STALE_CARRIER。 | 延后 post-PDM25 IA/Low-Fi 全局对齐，不修改 carrier。 | M10 + IA/Low-Fi Current + METHOD-20261004-CARRIER-ALIGN-AFTER-PDM25 | 2026-10-05 |
| PDM07-LIA-GATE | PDM-07 | Legacy Final Integrity Audit | PDM-07 4 组问题全部闭环；Final、Handoff Register、Decision 与状态文件同步。历史结构化车况整套字段不恢复，继续执行 P07-B4-01 当前方案。 | MISSING_RULE_UNRESOLVED=0；SEMANTIC_DETAIL_GAP_UNRESOLVED=0；CROSS_PDM_CONFLICT=0；HANDOFF_GAP_UNRESOLVED=0；GLOBAL_INVARIANT_CONFLICT=0；SOURCE_DECISION_COVERAGE=100%；FINAL_TO_SOURCE_TRACEABILITY=100%；SEMANTIC_INTEGRITY=PASS；NEGATIVE_CLAIMS_VERIFIED=PASS；IMPLEMENTATION_READY=PASS；HANDOFF_REGISTER_SYNC=PASS。允许进入 PDM-08 Legacy Final Integrity Audit；PDM-11 仍 BLOCKED。 | PDM-07 Legacy Audit + 用户 2026-10-05 确认执行 | 2026-10-05 |

| PDM08-LIA-001 | PDM-08 / PDM-20 | 分享卡片价格安全 | 恢复 R10-69 明确边界：车辆分享卡片不得固化客户展示价或任何动态/受权限价格，也不得展示内部批发价、VIN、上游电话、内部状态；打开详情后按接收人当前身份/权限/车辆状态实时计算。 | 修复 Final 将 customer display price 只隐含在“动态敏感信息”中的语义压缩。 | R10-69 + M16-003 + PDM-08 Integrity Audit | 2026-10-05 |
| PDM08-LIA-002 | PDM-08 / PDM-07 | 报告/H5 URL 当前权限重验 | 名邦受控 report URL、历史 URL、CDN 缓存均不构成永久访问权；每次读取继续服从当前 Vehicle Read/Visibility、PDM-07 customer_visible、敏感原件 DENY 与当前访问者身份/scope。 | 与 IMG-027/Vehicle Read 及 PDM-07 customer_visible 对齐，禁止旧 URL 绕权。 | PDM-07 Final + PDM-08 §17/§23 | 2026-10-05 |
| PDM08-LIA-003 | PDM-08 / PDM-04 | 资产化未闭环临时读取 3A | 用户选择 3A：批发→名邦转换已成立但图片仍 processing/partial_failed/failed 时，未成功资产化图片可基于冻结 JYT 来源事实通过名邦受控 CDN 临时回源；成功后立即切自有对象存储；不得直接暴露 JYT URL，不得把临时可展示伪装成资产化 success，也不得形成名邦车长期 JYT 依赖。 | 兼顾转换解耦与客户图片连续性，不回滚 vehicle/source/listing/business relations。 | 用户 2026-10-05 明确“3A”并确认执行 | 2026-10-05 |
| PDM08-LIA-004 | PDM-08 | future handoff registry | 正式登记 PDM-20/21/22/25：客户端图片/分享、员工图片状态与恢复、CDN/域名/Origin/分享配置、资源安全配置与资产化审计。 | 符合 Cross-PDM Handoff 双向闭环方法。 | CROSS_PDM_HANDOFF_REGISTER | 2026-10-05 |
| PDM08-LIA-005 | PDM-08 | IMG-001～030 唯一 traceability | 工作版早期 mapping 保留为 HISTORICAL/PRE-CDN-REMAP；以 §11 2026-10-03 CDN 架构重映射及后续 Batch/Final 批准结果作为唯一 Current mapping；早期不一致分类一律 SUPERSEDED_MAPPING。 | 解决 IMG-025、IMG-030 等前后分类并存风险，防止旧吞图/旧 viewer+persistence 语义被误恢复。 | PDM-08 工作版 §11 + Integrity Audit | 2026-10-05 |
| PDM08-LIA-GATE | PDM-08 | Legacy Final Integrity Audit | PDM-08 5 组问题全部闭环；Final、工作版 traceability、Handoff Register、Decision 与状态文件同步。 | MISSING_RULE_UNRESOLVED=0；SEMANTIC_DETAIL_GAP_UNRESOLVED=0；CROSS_PDM_CONFLICT=0；HANDOFF_GAP_UNRESOLVED=0；GLOBAL_INVARIANT_CONFLICT=0；SOURCE_DECISION_COVERAGE=100%；FINAL_TO_SOURCE_TRACEABILITY=100%；SEMANTIC_INTEGRITY=PASS；NEGATIVE_CLAIMS_VERIFIED=PASS；IMPLEMENTATION_READY=PASS；HANDOFF_REGISTER_SYNC=PASS。允许进入 PDM-09 Legacy Final Integrity Audit；PDM-11 仍 BLOCKED。 | PDM-08 Legacy Audit + 用户 2026-10-05 3A + 确认执行 | 2026-10-05 |

| PDM09-LIA-001 | PDM-09 / PDM-22 | P03-05 publisher 身份与明文电话权限 | P03-05 当前/历史 publisher 记录按 `source_platform + upstream_publisher_id` 唯一定位；明文电话继续受独立上游电话敏感能力 + data scope 控制；System Admin 或 integration/Collector manage 本身不自动获得电话明文/latest 权。 | 修复后台诊断页把 publisher identity 压缩成裸 upstream_publisher_id、并防止集成管理能力越权。 | PDM-09 Final + PDM-02 权限模型 + Integrity Audit | 2026-10-05 |
| PDM09-LIA-002 | PDM-09 | 无有效号码不得覆盖旧缓存 | 只有合法、非空、可作为电话号码使用的结果才更新 publisher 当前缓存。请求成功但返回空号/非法号码/无有效号码时，有旧缓存则保留并记录本次无有效新号码；无旧缓存则 PHONE_UNAVAILABLE；均不得拨号，且结果必须审计。 | 补全“latest 失败不覆盖旧缓存”对业务成功但号码无效场景的语义。 | PDM-09 §§5-6 + Integrity Audit | 2026-10-05 |
| PDM09-LIA-003 | PDM-09 / PDM-04 | source_type 电话入口 3A | 用户选择 3A：上游电话只作为当前 wholesale/JYT 批发车源的日常敏感能力；同一 Vehicle 转名邦后，车辆详情关闭查看/latest/拨打入口；当前为 4S 同样不因历史 publisher 事实出现电话入口。publisher 来源事实、缓存、history、审计继续保留，P03-05 可用于合法诊断/历史。 | 与 R11 source-type 裁剪和同 vehicle source conversion 对齐。 | 用户 2026-10-05 明确“3a”并确认执行 | 2026-10-05 |
| PDM09-LIA-004 | PDM-09 | future handoff registry | 正式登记 PDM-21/22/23/25：员工端电话状态/动作、P03 cache/Integration 权限隔离、电话链路 incident/通知、统一电话审计。 | 符合 Cross-PDM Handoff 双向闭环方法。 | CROSS_PDM_HANDOFF_REGISTER | 2026-10-05 |
| PDM09-LIA-005 | PDM-09 | IA / Low-Fi / 旧实现 stale carrier | 保存/测试 Collector 电话连接、旧 Base URL/Path/allowlist、publisher_id 泛化、integration.collector.manage→明文电话风险、PHONE_UNAVAILABLE 状态不完整、3A source_type 裁剪缺投影等只登记 STALE_CARRIER。 | 延后 post-PDM25 IA/Low-Fi 全局对齐；旧实现不得反向覆盖 Final。 | M07 + IA/Low-Fi Current + CR-007 清理报告 + METHOD-20261004-CARRIER-ALIGN-AFTER-PDM25 | 2026-10-05 |
| PDM09-LIA-GATE | PDM-09 | Legacy Final Integrity Audit | PDM-09 5 组问题全部闭环；Final、Handoff Register、Decision 与状态文件同步。A04-R1/A11-R1 当前 Collector→名邦 Integration 回传架构保持不变。 | MISSING_RULE_UNRESOLVED=0；SEMANTIC_DETAIL_GAP_UNRESOLVED=0；CROSS_PDM_CONFLICT=0；HANDOFF_GAP_UNRESOLVED=0；GLOBAL_INVARIANT_CONFLICT=0；SOURCE_DECISION_COVERAGE=100%；FINAL_TO_SOURCE_TRACEABILITY=100%；SEMANTIC_INTEGRITY=PASS；NEGATIVE_CLAIMS_VERIFIED=PASS；IMPLEMENTATION_READY=PASS；HANDOFF_REGISTER_SYNC=PASS。允许进入 PDM-10 Legacy Final Integrity Audit；PDM-11 仍 BLOCKED。 | PDM-09 Legacy Audit + 用户 2026-10-05 3A + 确认执行 | 2026-10-05 |

| PDM10-LIA-001 | PDM-10 / PDM-01 | Customer 停用查价能力 Guard | Customer 停用时暂停新的批发查价、LIMITED/UNLIMITED 权益与 quota 使用，但不删除已成立单车查价权和 Recommendation 当前 cycle 免费权；恢复后只恢复仍自然有效事实。 | 将 HO-P01-P10-001 从“账面 CLOSED”修成目标 Final 真正落地。 | PDM-01 §11 + PDM-10 Integrity Audit | 2026-10-05 |
| PDM10-LIA-002 | PDM-10 / PDM-20 | DAILY_PRICE_QUOTA_EXHAUSTED 状态恢复 | 恢复 M11-001：有数字价格但 LIMITED 当天 quota 耗尽时进入 DAILY_PRICE_QUOTA_EXHAUSTED，并提供“额度不足，可联系顾问”业务出口；与“查看价格”和“价格咨询”严格区分。联系顾问本身不自动加额度。 | 修复 M11-001 覆盖报告指向 §11 但 Final 缺客户侧耗尽状态的问题。 | M11-001 + PDM-10 Integrity Audit | 2026-10-05 |
| PDM10-LIA-003 | PDM-10 | LIMITED/UNLIMITED 临时额度 3A | 用户选择 3A：UNLIMITED 时禁止新增临时查价次数；当天已有 today_temp_additions 保留；同日再回 LIMITED 后继续参与剩余额度计算；UNLIMITED 浏览不计 today_consumed_new_vehicle_unlocks，也不批量生成单车权。 | 统一 A10 LIMITED/UNLIMITED 与 B4-03 customer-day quota。 | 用户 2026-10-05 明确“3A”并确认执行 | 2026-10-05 |
| PDM10-LIA-004 | PDM-10 | future handoff registry | 正式登记 PDM-14/18/20/21/22/25 为 HANDOFF_OPEN，完整移交 Recommendation 免费权、Lock 快照、客户端价格状态、员工价格动作、PC 配置与统一审计。 | 替换旧检查卡中的 ACCEPTED_FOR_TARGET 非冻结状态名。 | CROSS_PDM_HANDOFF_REGISTER | 2026-10-05 |
| PDM10-LIA-005 | PDM-10 | IA / Low-Fi stale carrier ledger | 4S internal mode 整体 DENY、internal-price permission 投影、独立调价旧 carrier、override 入口、P08 配置壳、临时追加、quota exhausted、Customer 停用、3A level/temp additions 等只登记 STALE_CARRIER。 | 延后 post-PDM25 IA/Low-Fi 全局对齐。 | M11 + IA/Low-Fi Current + METHOD-20261004-CARRIER-ALIGN-AFTER-PDM25 | 2026-10-05 |
| PDM10-LIA-GATE | PDM-10 | Legacy Final Integrity Audit | PDM-10 5 组问题全部闭环；PDM-01～PDM-10 单域 Integrity Audit 至此全部通过。 | MISSING_RULE_UNRESOLVED=0；SEMANTIC_DETAIL_GAP_UNRESOLVED=0；CROSS_PDM_CONFLICT=0；HANDOFF_GAP_UNRESOLVED=0；GLOBAL_INVARIANT_CONFLICT=0；SOURCE_DECISION_COVERAGE=100%；FINAL_TO_SOURCE_TRACEABILITY=100%；SEMANTIC_INTEGRITY=PASS；NEGATIVE_CLAIMS_VERIFIED=PASS；IMPLEMENTATION_READY=PASS；HANDOFF_REGISTER_SYNC=PASS。下一阶段进入 GLOBAL_PDM01_10_CROSS_PDM_AUDIT；PDM-11 继续 BLOCKED，直到全局总复核 PASS。 | PDM-10 Legacy Audit + 用户 2026-10-05 3A + 确认执行 | 2026-10-05 |

| GLOBAL-PDM01-10-001 | PDM-01～10 | Global Handoff Integrity | PDM-01～10 内部 handoff 无 OPEN/ACCEPTED 残留；所有 CLOSED 均有明确目标 Authority 且 source_backwrite=YES；未来 PDM-11～25 保留 69 条合法 HANDOFF_OPEN，均有完整 transfer semantics。 | 验证双向闭环总账真实成立，不把未来 handoff 误当当前阻塞。 | CROSS_PDM_HANDOFF_REGISTER + 2026-10-05 Global Audit | 2026-10-05 |
| GLOBAL-PDM01-10-002 | PDM-01～10 | Global Invariant Matrix | Customer/Employee/Vehicle 稳定身份、owner/responsible 分层、System Admin 控制面、4S hard DENY、listing_cycle/source conversion、source facts、snapshot immutability、sensitive access、Customer disable、formal-history delete 边界全部一致，无跨域反转。 | 本轮未产生新产品裁决项。 | PDM-01～10 Final + 2026-10-05 Global Audit | 2026-10-05 |
| GLOBAL-PDM01-10-003 | PDM-01～10 | Global Control Cleanup | PDM-01～07 顶部状态统一为 COMPLETE/INTEGRITY_PASS；PDM-01 §10 清除已完成 PDM-02 仍写“留后续”的 stale wording，明确权限模型已由 PDM-02 承接、CRM 业务继续 PDM-16。 | 只修状态/移交文案，不改变产品语义。 | 2026-10-05 Global Audit | 2026-10-05 |
| GLOBAL-PDM01-10-GATE | PDM-01～10 | Global Cross-PDM / Handoff / Global Invariant Gate | PDM-01～10 全局总复核 PASS，满足 PDM-11 启动硬门禁。 | INTERNAL_HANDOFF_OPEN=0；CLOSED_WITHOUT_AUTHORITY=0；SOURCE_BACKWRITE_PENDING=0；CROSS_PDM_CONFLICT=0；HANDOFF_GAP_UNRESOLVED=0；GLOBAL_INVARIANT_CONFLICT=0；GLOBAL_IMPLEMENTATION_READY_FOR_NEXT_PDM=PASS。PDM-11 解锁。 | `PDM-01至10_全局Cross-PDM_Handoff_GlobalInvariant总复核_2026-10-05.md` + 用户确认执行 | 2026-10-05 |
| METHOD-20261005-POST-PDM25-HISTORICAL-TAIL-CLEANUP | METHOD | PDM-25 后 Final / Integrity 历史阶段尾巴统一收口 | 用户确认：PDM-11～25 期间不反复批量清理各 PDM Final / Integrity 报告中当时真实的“下一步 / BLOCKED / 当前进入”等阶段尾巴；PDM-25 完成并通过 PDM-01～25 全局最终总复核后，一次性统一清理歧义并标注 Current / HISTORICAL_AUDIT_TRAIL 边界。 | 当前控制入口 README / CURRENT_PROJECT_STATE / NEXT_ACTION / PROJECT_STATE 必须始终保持真实 Current；历史阶段事实不物理删除；统一清理不得改变业务规则语义，完成后再进入 IA Alignment。 | 2026-10-05 用户明确“等一直PDM-25彻底结束之后，我们再做”，随后要求写入规则 | 2026-10-05 |
| PDM11-DEC-B2-08-R1 | PDM-11 | P11-B2-08 | 用户主动修正原候选：找车 entitlement 下降/取消后，权益立即停止；已有 active Demand 自动转 paused，停止 active Matching，但 Demand、条件、历史匹配、Recommendation、CRM 跟进、负责人/状态历史全部保留；权益恢复后不得自动恢复 active，需客户本人或有权限员工正式执行恢复。 | 找车 entitlement 变化与 Customer 账号停用严格分离；账号停用继续继承 PDM-01 / HO-P01-P11-001，不自动 pause/complete/cancel Demand。该裁决不预判 B4-02 的资格来源模型，只冻结 entitlement 有效→无效时的生命周期效果。 | 2026-10-05 用户明确同意并“确认执行” | 2026-10-05 |
| PDM11-GATE-B2 | PDM-11 | Batch 2 Gate | 用户确认 P11-B2-01～P11-B2-07、P11-B2-09、P11-B2-10 全部同意；P11-B2-08 已按用户主动修正版确认。 | Batch 2 正式 PASS；B2-08 采用 entitlement 下降→active Demand 自动 paused、历史保留、权益恢复不自动 active；允许进入 Batch 3，但不得自动批准 Batch 3。 | PDM-11 Batch 2 工作版 + 2026-10-05 用户“全部同意”并“确认执行” | 2026-10-05 |
| PDM01-DEC-A16-R3 | PDM-01 | Customer 账号停用 / 恢复后续修正 | 用户进一步明确：Customer 账号一旦停用，正在运行的客户业务不能继续像正常账号一样推进；停用不是删除/完成/取消，历史与真实业务事实必须保留。Demand 已明确 active→paused；账号恢复后不自动恢复 Demand。其他业务域按各自对象性质定义暂停/冻结/禁止新动作/保留现实状态。 | 覆盖 PDM01-DEC-A16-R1 中“停用不自动终止既有业务”可能被误读为“业务继续 active 运行”的部分；仍保留不删除 customer_id/owner/来源/历史、不自动 complete/cancel、恢复不复活终态对象等原则。 | 2026-10-05 用户明确“账号都停用了，现有找车肯定也全部停了，但历史资料保留”，随后“确定执行” | 2026-10-05 |
| PDM11-SUPERSEDE-B2-08-BOUNDARY | PDM-11 | P11-B2-08 / Customer disable boundary | P11-B2-08 关于 entitlement 下降→active Demand paused 的核心规则继续有效；其中“Customer 账号停用本身不得自动 pause Demand”的边界描述被后续 P11-B3-01 用户裁决覆盖。 | 当前两类事件仍是不同触发源，但在 Demand 域都导致 active→paused；两者都保留历史且恢复后不自动 active。 | PDM11-DEC-B2-08-R1 + P11-B3-01 后续用户裁决 | 2026-10-05 |
| PDM11-DEC-B3-01-R1 | PDM-11 | P11-B3-01 | 用户确认：Customer 账号停用后，active Demand 自动转 paused；paused 保持；completed/cancelled 不改；Demand、条件、历史匹配、Recommendation、CRM 跟进、负责人/状态历史全部保留；账号恢复后不自动恢复 active，需客户本人或有权限员工正式 resume。 | `HO-P01-P11-001` superseded；新建并承接 `HO-P01-P11-002`。PDM-01 Final §11 同步 source backwrite。其他业务域的具体停用效果由各自 PDM 冻结。 | 2026-10-05 用户明确确认并“确定执行” | 2026-10-05 |
| PDM11-GATE-B3 | PDM-11 | Batch 3 Gate | 用户修正并确认 P11-B3-01；Customer 账号停用对 Demand 的当前语义已经从“状态不变”改为“active→paused，历史保留，恢复不自动 active”。 | Batch 3 = PASS / USER_APPROVED；允许进入 Batch 4，但不得自动批准 Batch 4。 | P11-B3-01 + 2026-10-05 用户“确定执行” | 2026-10-05 |
| PDM11-DEC-B4-01 | PDM-11 | P11-B4-01 | 用户选择人工激活：无论 Customer 是否已有找车权益，提交 Find-car Application 后都先 pending；只有员工在处理详情中通过当前 identity/permission/data scope/object state、账号、手机号、当前等级找车 entitlement 等 Guard 后才能创建/激活唯一 Demand。等级升级不会自动激活 pending Application。 | 正式 supersede 9/06“有 entitlement 保存 Application 后直接 active Demand”方向；Application 与 Demand 保持双对象，单 Application 最多激活一个 Demand且幂等。 | 2026-10-05 用户明确“P11-B4-01 人工开通”，随后确认执行 | 2026-10-05 |
| PDM11-DEC-B4-02 | PDM-11 | P11-B4-02 | 用户确认正式找车资格只来自 Customer 当前客户等级配置的找车 entitlement；普通客户当前无正式找车权益，需要开通时通过等级调整到具备权益的粉丝/VIP等等级；不建设单 Customer find-car entitlement override/grant。 | Customer Level 作为权益集合；等级调整继承 PDM-02 permission + data scope + object state，V1 不做固定多级审批；等级下降导致 entitlement 无效时继续执行 B2-08 active→paused。 | 2026-10-05 用户连续澄清并确认执行 | 2026-10-05 |
| PDM10-DEC-POST-P11-PRICE-UX | PDM-10 / PDM-11 | Customer Level / 批发车价格权益后续修正 | 用户确认：LIMITED 普通客户的 daily quota 只限制批发车；批发车列表隐藏精确数字价，主动进入详情且有额度时自动解锁并直接显示，无需二次点击；quota 耗尽且未解锁显示 `--万`；无合法数字价才显示“价格咨询”；UNLIMITED 等级在批发车列表/详情均直接显示数字价。 | supersede PDM10-B4-04/B4-08 与 LIA-002 中“查看价格”作为必需二次点击入口的旧交互投影；保留单车解锁、幂等扣额、筛选排序不授权、Recommendation 免费权等底层规则。 | 2026-10-05 用户明确确认并“确认执行” | 2026-10-05 |
| PDM10-DEC-TEMP-QUOTA-FREE | PDM-10 | 临时增加当天查价次数 | 用户确认顾问/有权限员工为 LIMITED 客户增加当天查价次数属于免费客户服务能力；V1 不建设购买临时查价次数或按次收费。 | 执行主体仍严格继承 PDM-10 §11：普通销售需 current owner+permission；经理/店长需 permission+data scope；4S hard DENY；联系顾问本身不自动加额度。 | 2026-10-05 用户确认额度耗尽提示与免费增加次数口径 | 2026-10-05 |
| PDM11-GATE-B4 | PDM-11 | Batch 4 Gate | 用户完成 P11-B4-01、P11-B4-02 全部裁决，并联动确认 Customer Level 的找车权益与 PDM-10 价格权益统一为等级权益集合。 | Batch 4 = PASS / USER_APPROVED；下一步进入 PDM-11 全量 Decision Coverage、Missing Rule、Semantic Detail、Cross-PDM、Handoff 完整性复核；未经最终总览批准不得标记 PDM-11 COMPLETE。 | 2026-10-05 用户“确认执行” | 2026-10-05 |
| PDM11-GATE-B1 | PDM-11 | Batch 1 Gate | 用户确认 P11-A01～P11-A13 全部同意。 | Batch 1 = PASS / USER_APPROVED；Application/Demand 双对象、多 Demand、状态机、负责人、信息分层、工作台与成交不批量结束等进入当前 Authority。 | PDM-11 Batch 1 工作版 + 2026-10-05 用户明确全部同意 | 2026-10-05 |
| PDM11-DEC-LIA-END-01 | PDM-11 | P11-LIA-03 / 客户结束 Demand | 用户确认采用双向结束：客户主动“结束找车”先形成待员工确认的结束请求；员工根据真实业务结果确认落 `completed` 或 `cancelled`；员工也可不依赖客户请求直接完成/取消 Demand。 | 客户结束请求不新增第五个 Demand 主状态；请求待处理时 Demand 保持原 active/paused，客户端可显示派生“结束处理中”；completed/cancelled 仍为终态，未来找车新建 Demand。 | 2026-10-05 用户明确“客户主动结束，员工确认也可以，员工主动结束就完事了…双向更稳妥”，随后确认执行 | 2026-10-05 |
| PDM11-LIA-PREFINAL-001 | PDM-11 | Final 前完整性复核 | 重新反扫 9/06 SSOT、9/19 R10、001～078、PDM-01～10 Final 后发现并关闭：无 owner/pool-empty Application Guard、pending Application 公海保护、Demand created_at、动态等级文案、Customer disable 对 pending Application、future handoff 语义压缩。 | 不推翻 Batch 1～4 已批准主模型；补齐实现边界与跨 PDM 传递完整性。pending Application 属公海保护；无合法 owner 不创建 responsible=null Application；Demand.created_at 不可变；等级文案读取当前配置。 | 2026-10-05 Final 前完整性审计 + 用户确认执行 | 2026-10-05 |
| PDM11-GATE-PREFINAL-INTEGRITY | PDM-11 | Pre-Final Integrity Gate | PDM-11 Batch 1～4 已批准，Final 前 Missing Rule / Semantic Detail / Cross-PDM / Handoff 复核发现项均已关闭；正式 handoff 已扩展到 PDM-12/13/14/16/17/20/21/22/25。 | PDM-11 = FINAL_CANDIDATE_READY；下一步生成并提交最终完整规则总览给用户批准。未经最终批准不得 COMPLETE / INTEGRITY_PASS。 | 2026-10-05 用户确认执行完整性补漏 | 2026-10-05 |
| PDM11-GATE-FINAL-OVERVIEW | PDM-11 | Final Overview Gate | `PDM-11_最终完整规则总览_待用户批准.md` 与 `PDM-11_Final前完整性复核_2026-10-05.md` 已生成；Atom→Final Candidate unmapped=0，当前无未决产品冲突。 | 当前仅允许用户最终总览审查；未经批准不得生成正式 Final、关闭 HO-P01-P11-002 或标记 COMPLETE / INTEGRITY_PASS，也不得进入 PDM-12。 | 2026-10-05 Final candidate 生成与机械自验 | 2026-10-05 |
| PDM11-FINAL-APPROVAL | PDM-11 | Final User Approval | 用户最终批准 `PDM-11_最终完整规则总览_待用户批准.md`，授权生成正式 Final、执行最终双向追溯、关闭 incoming handoff 并进入 PDM-12。 | `PDM-11_最终完整规则.md` 成为当前正式 Authority；PDM-11 = COMPLETE / INTEGRITY_PASS。 | 2026-10-05 用户“同意”最终总览并随后“确认执行” | 2026-10-05 |
| PDM11-HANDOFF-CLOSE-P01 | PDM-01 → PDM-11 | HO-P01-P11-002 closure | PDM-11 Final §14 已正式承接 Customer disable→active Demand paused；PDM-01 Final §11/§18 已完成 source backwrite。 | `HO-P01-P11-002 = HANDOFF_CLOSED`；旧 HO-P01-P11-001 保持 HANDOFF_SUPERSEDED。 | PDM-11 Final + PDM-01 Final source backwrite + final user approval | 2026-10-05 |
| PDM11-INTEGRITY-PASS | PDM-11 | Final Integrity Gate | 最终机械校验：26 个 Source Atom 缺失 0；8 个 Pre-Final LIA 缺失 0；21 个 Final semantic checks 缺失 0；Cross-PDM 未决冲突 0；Negative Claims PASS。 | PDM-11 正式达到 COMPLETE / INTEGRITY_PASS；允许进入 PDM-12。 | `PDM-11_最终完整性复核_2026-10-05.md` | 2026-10-05 |
| PDM12-STARTUP-20261005 | PDM-12 | Startup Gate / Incoming Handoffs | PDM-11 已 COMPLETE / INTEGRITY_PASS；PDM-12 工作版已建立，并读取/接收 HO-P04-P12-001、HO-P05-P12-001、HO-P07-P12-001、HO-P11-P12-001。 | PDM-12 进入证据重建阶段；尚未形成 Batch 1 结论，不得自动批准任何 Matching 规则。 | PDM-11 Final/Integrity + Coverage Map + Handoff Register | 2026-10-05 |

| PDM12-DEC-A15 | PDM-12 | P12-A15 搜索 / Matching 共享词典 | 用户确认：客户端车源主页搜索与正式 Demand Matching 共用同一套匹配词典 / 规则词典与确定性解析能力；共享的是解析层。搜索解析后用于结构化搜索/筛选，不创建 Match Result、Priority、Recommendation、Demand、Lock 或客户专属关系；正式 Demand Matching 再执行 hard/soft 与四级结果。 | 修复 M03-003 已明确但首次 Batch 1 汇总未生成 Atom 的信息保真缺口；禁止搜索和找车各维护一套互相漂移的别名/解析标准。 | M03-003 + R10 + 2026-10-05 用户主动指出并“同意/确认执行” | 2026-10-05 |
| PDM12-LIA-B1-SOURCE-ATOM | PDM-12 | M03-001～M03-003 Source→Atom 反查 | 对 M03-001～003 逐项建立去向：稳定规则映射到 P12-A01～A15；PDM-11 已承接项标为 Completed-PDM Dependency；P06-10 Action/scope/test/retry、旧字段排除、里程特殊规则等显式进入后续批次，不允许留成“已读但无去向”。 | 本轮唯一发现的 Batch 1 稳定漏项为 SEARCH_MATCH_SHARED_DICTIONARY，已通过 P12-A15 修复；当前 unmapped stable Batch1 rule=0。 | PDM-12 工作版 §5 + M03-001～003 | 2026-10-05 |
| PDM12-GATE-B1 | PDM-12 | Batch 1 Gate | 用户确认 P12-A01～P12-A15；其中 A15 为审查中补回的“车源主页搜索与正式 Demand Matching 共用确定性解析/匹配词典”。 | Batch 1 = PASS / USER_APPROVED；允许进入 Batch 2 候选重建，但不得自动批准 Batch 2，也不得修改 IA / Low-Fi。 | PDM-12 Batch 1 工作版 + 2026-10-05 用户“同意”并“确认执行” | 2026-10-05 |

| PDM12-DEC-B2-01 | PDM-12 | P12-B2-01 | 不得恢复第二套“客户专属 / 独立匹配”体系；普通与 Priority 继续共用一套公共 Matching，引擎之外的 Priority 资格/仲裁归 PDM-13。 | 排除独立客户专属对象、设为/解除专属、专属列表、第二套匹配算法。 | 9/17 统一匹配规则 + R10-49/M04-003 + 2026-10-05 用户全部同意并确认执行 | 2026-10-05 |
| PDM12-DEC-B2-02 | PDM-12 | P12-B2-02 | 车源主页搜索不得退化成普通字符串/关键词搜索；必须与 Demand Matching 共用确定性解析与匹配词典。 | 排除搜索专用且与 Matching 漂移的别名/同义词/标准映射体系。 | R10 + M03-003/M16-001 + P12-A15 + 用户确认执行 | 2026-10-05 |
| PDM12-DEC-B2-03 | PDM-12 | P12-B2-03 | 不得恢复客户原话直接进入自动 Matching，也不得通过 AI 猜测后生成正式匹配条件。 | 正式链路保持“客户原话→销售整理→销售匹配描述→确定性解析→标准条件→Matching”。 | PDM-11 Final §22 + M03-003 + 用户确认执行 | 2026-10-05 |
| PDM12-DEC-B2-04 | PDM-12 | P12-B2-04 | 不得因 local mapping pending / vehicle_model_id=NULL 阻断或降级 JYT 已明确车型事实的精确搜索与自动 Matching。 | 排除“本地未映射=车型未知/confirmation_needed/禁止业务”。 | PDM-05 Final DO_NOT_RESTORE 7-8 + HO-P05-P12-001 + 用户确认执行 | 2026-10-05 |
| PDM12-DEC-B2-05 | PDM-12 | P12-B2-05 | 不得恢复 hidden=offline/unavailable；hidden 不等于不可售，不得仅因此排除内部 Matching 或结束 listing_cycle。 | Matching eligibility 读取真实 availability/saleability/listing state。 | PDM-04 Final §18 + HO-P04-P12-001 + 用户确认执行 | 2026-10-05 |
| PDM12-DEC-B2-06 | PDM-12 | P12-B2-06 | 缺失/冲突/无法确定的车况事实不得靠猜测补成符合或不符合。 | 保持 unknown/confirmation_needed，事实确认后重算。 | PDM-07 Final DO_NOT_RESTORE + HO-P07-P12-001 + 用户确认执行 | 2026-10-05 |
| PDM12-DEC-B2-07 | PDM-12 | P12-B2-07 | 不得为 Matching 恢复历史“大而全”整套结构化车况字段并要求车辆先补齐。 | 当前只保留来源事实并产生 Matching 必要且可确定的派生标准事实。 | PDM-07 Final Integrity + P07-B4-01 current authority + 用户确认执行 | 2026-10-05 |
| PDM12-DEC-B2-08 | PDM-12 | P12-B2-08 | 无匹配时不得自动放宽 hard condition，不得 closest/nearest fallback，不得把最近似车辆冒充正式 Match。 | 允许真实返回无符合车辆；条件改变必须显式发生。 | R10-41 + M15-011/M16-001 + P12-A05 + 用户确认执行 | 2026-10-05 |
| PDM12-DEC-B2-09 | PDM-12 | P12-B2-09 | Match Result 不得自动等同 Recommendation/Priority/Lock/客户可见权/owner 变化。 | Match Result 仅表达 Demand×Vehicle 当前确定性结果；下游对象各走自己的 PDM Guard。 | 9/17统一匹配 + VR-X-003/004 + P12-A13 + 用户确认执行 | 2026-10-05 |
| PDM12-DEC-B2-10 | PDM-12 | P12-B2-10 | 不得恢复“定时全库扫描=唯一 Matching 更新机制”；采用事件驱动+受影响范围重算，定时只作必要兜底。 | 排除每次规则变化无脑全库重算。 | 9/17统一匹配 §13 + M03-003 + P12-A14 + 用户确认执行 | 2026-10-05 |
| PDM12-GATE-B2 | PDM-12 | Batch 2 Gate | 用户确认 P12-B2-01～P12-B2-10 全部同意；反向冲突扫描明确未把旧字段排除、里程特殊规则、P06-10 治理、VR-P-021/022、无预算+价格咨询、Priority 生命周期误判成废弃。 | Batch 2 = PASS / USER_APPROVED；下一步形成 Batch 3 明确新增/变更项候选，未经用户审查不得自动批准。 | PDM-12 工作版 Batch 2 + 2026-10-05 用户“全部同意”并“确认执行” | 2026-10-05 |

| PDM12-DEC-B3-01 | PDM-12 | P12-B3-01 | 正式 Matching / 重算前动态重验当前 Customer Level 的 find-car entitlement；entitlement 丧失时不继续产生新 Match，active Demand 按 PDM-11 进入 paused；恢复 entitlement 不自动恢复 Matching，需正式 resume 后重验 readiness。 | 不把“无需处理”做成第五种 Demand 主状态。 | VR-E-015 + VR-P-020/VR-X-008 + PDM-11 Final + 2026-10-05 用户全部同意并确认执行 | 2026-10-05 |
| PDM12-DEC-B3-02 | PDM-12 | P12-B3-02 | Rule Dictionary 是真实可维护业务对象，至少承载匹配词、标准映射、品牌、车系、年款/适用范围、启用状态、备注、创建/修改与审计信息，并支持新增、编辑、启停、范围、保存、测试解析、历史/审计。 | 普通物理删除与 partial failure/retry 未由本条冻结。 | M03-003 + VR-P-021 + 用户确认执行 | 2026-10-05 |
| PDM12-DEC-B3-03 | PDM-12 | P12-B3-03 | Rule Dictionary 作用域优先级固定为具体车型+年款 > 车系+年款范围 > 车系 > 品牌 > 全局；同级冲突不得猜，Demand 无法确定则不 matching-ready，Vehicle 对应事实无法确定则走 confirmation_needed。 | 禁止随机、时间覆盖或 AI 猜测解决同级冲突。 | M03-003 历史 scope priority + 用户确认执行 | 2026-10-05 |
| PDM12-DEC-B3-04 | PDM-12 | P12-B3-04 | 标准条件支持正向/反向表达、hard/preferred/tolerance 语义；显式局部例外只影响对应条件/部件，不放宽其他 hard condition。 | 禁止无结果时临时自动放宽。 | VR-P-021 + P12-A05/B2-08 + 用户确认执行 | 2026-10-05 |
| PDM12-DEC-B3-05 | PDM-12 | P12-B3-05 | 同一 Matching component 的证据优先级为结构化事实 > 明确检测 > 详细车况描述 > 模糊关键词；低层不得覆盖高层，原始 provenance 全保留；同级不可解冲突不猜。 | 局部不确定只影响对应 component。 | VR-P-022 + PDM-07 provenance authority + 用户确认执行 | 2026-10-05 |
| PDM12-DEC-B3-06 | PDM-12 | P12-B3-06 | 正式 Matching 必须可解释；P06-10 提供无副作用测试解析/测试匹配，展示标准化事实、冲突、unknown 与结果原因。 | 测试不修改 Demand、不生成正式 Match Result/Recommendation/Priority/Lock。 | VR-P-021 + M03-003 + 用户确认执行 | 2026-10-05 |
| PDM12-DEC-B3-07 | PDM-12 | P12-B3-07 | 词典新增/修改/启停只重解析受影响在售车辆与 active+matching-ready Demand，重算 Match Result 并产生 Matching change fact；Source Radar 由 PDM-16 消费，不在 PDM-12 重建第二套雷达。 | 新增 HO-P12-P16-001；继续禁止无脑全库重算。 | M03-003 + P12-A14 + 用户确认执行 | 2026-10-05 |
| PDM12-GATE-B3 | PDM-12 | Batch 3 Gate | 用户确认 P12-B3-01～P12-B3-07 全部同意；Current Authority Refresh / Conflict Scan 均 PASS。 | 下一步进入 Batch 4 真实冲突/缺口/新选择；未经用户审查不得自动批准。 | PDM-12 工作版 Batch 3 + 2026-10-05 用户“全部同意”并“确认执行” | 2026-10-05 |

| PDM12-DEC-B4-01 | PDM-12 | P12-B4-01 / 1A | Demand 未填预算时价格维度不限，“价格咨询”本身不阻断 Matching；Demand 已填预算但车辆无合法数字客户展示价时进入 confirmation_needed，价格明确后重算。 | 覆盖 9/17 “价格咨询一律 no_match”的绝对旧规则。 | 9/17统一匹配规则 + PDM-10 Final + 2026-10-05 用户 1A / 确认执行 | 2026-10-05 |
| PDM12-DEC-B4-02 | PDM-12 | P12-B4-02 / 2A | V1 里程 hard condition 只采用最高可接受里程；自然语言中的最低里程不作为 hard lower bound，低于该值仍可符合。 | 保留历史“更低里程不淘汰”的特殊语义。 | 9/17统一匹配规则 + M03-001 + 2026-10-05 用户 2A / 确认执行 | 2026-10-05 |
| PDM12-DEC-B4-03 | PDM-12 | P12-B4-03 / 3A | 变速箱、配置偏好、过户次数、城市/距离、排放标准、车源类型继续不参与 V1 自动四级 Matching。 | 可展示/人工判断/后续搜索筛选，但不得默认改变 Match Result；未来纳入须另行显式升级。 | 9/17统一匹配规则 + M03-001 + 2026-10-05 用户 3A / 确认执行 | 2026-10-05 |
| PDM12-DEC-B4-04 | PDM-12 | P12-B4-04 / 4A | 已保存 Rule Dictionary 正式规则不普通物理删除；采用停用/废弃，保留 rule_id、历史、审计和过去 Match Result 的规则解释。 | 停用触发受影响范围重解析/重算。 | P12-B3-02 + PDM-25 append-only invariant + 2026-10-05 用户 4A / 确认执行 | 2026-10-05 |
| PDM12-DEC-B4-05 | PDM-12 | P12-B4-05 / 5A | Rule Dictionary 变更重算部分失败不整体回滚；成功对象保留新结果，只重试失败集合；失败对象旧 Match Result 仅保留历史，不得作为当前结果新建 Priority/Recommendation。 | 明确 current valid / stale historical / recalc pending-failed 边界。 | Current P06-10 PARTIAL_FAILURE + P12-A14/B3-07 + 2026-10-05 用户 5A / 确认执行 | 2026-10-05 |
| PDM12-DEC-B4-06 | PDM-12 | P12-B4-06 / 6A | 新增敏感 capability matching.rule.manage；active 名邦 Employee 具备该 permission 才能写正式 Rule Dictionary；角色不自动授权；4S hard DENY；System Admin 只可配置权限，不因身份自动取得规则写能力。 | 与 PDM-02 role template + individual allow/deny + hard DENY 模型一致。 | PDM-02 Final + P12-B3-02 + 2026-10-05 用户 6A / 确认执行 | 2026-10-05 |
| PDM12-GATE-B4 | PDM-12 | Batch 4 Gate | 用户裁决 1A/2A/3A/4A/5A/6A 并确认执行；所有 PDM-12 本域 deferred 项已清零，Priority lifecycle 等明确移交 PDM-13。 | Batch 4 = PASS / USER_APPROVED；下一步 Final 前完整性复核，不自动发布 Final。 | PDM-12 工作版 Batch 4 + 2026-10-05 用户确认执行 | 2026-10-05 |

| PDM12-LIA-01 | PDM-12 | P12-LIA-01 | Final 前补齐：客户未填写某项正式条件时该项视为不限；未填写不是 unknown，不产生 confirmation_needed，也不得由系统猜出限制。 | B4-01“无预算=不限”是该总规则的价格实例。 | 9/06 SSOT §10.4 + 9/17统一匹配 + 2026-10-05 Final前完整性复核 + 用户全部同意/确认执行 | 2026-10-05 |
| PDM12-LIA-02 | PDM-12 | P12-LIA-02 | Final 前补齐 matching readiness：active 不等于 ready；无销售匹配描述/未完成确定性解析/无法形成可执行条件集时不 ready；已有可执行确定条件而部分 component 待确认时可继续按确定部分 Matching，相关车辆进入 confirmation_needed。 | 不把 ready_with_confirmation_needed 误实现为整个 Demand 停止 Matching。 | 9/06 SSOT §10.2 + PDM-11 Final §17 + 用户确认执行 | 2026-10-05 |
| PDM12-LIA-03 | PDM-12 | P12-LIA-03 | confirmation_needed 是 Demand×Vehicle 局部不确定，不占车、不排他、不阻断其他 Customer/Demand 对同车独立 Matching，也不自动创建 Priority/Recommendation/Lock/visibility。 | 确认只补事实并重算。 | 9/06 SSOT §10.10-10.11 + 9/17统一匹配 + 用户确认执行 | 2026-10-05 |
| PDM12-LIA-04 | PDM-12 | P12-LIA-04 | 补齐 Matching 集合进入/退出事件：新可售 Vehicle、Demand 首次 active+ready、readiness 恢复触发首次/重新计算；Demand pause/terminal/readiness失效、Vehicle unavailable/offline/sold 等使旧结果退出 current valid，但历史保留且 stale 结果不得驱动新下游业务。 | 扩展 P12-A14 为完整生命周期事件集。 | 9/17统一匹配 §13 + M03-003 + PDM-04/PDM-11 Final + 用户确认执行 | 2026-10-05 |
| PDM12-LIA-05 | PDM-12 | P12-LIA-05 | active Lock 本身不等于 Vehicle 不可 Matching；底层仍真实可售时其他 Demand 仍可产生 Match Result，但必须携带已锁占用事实，且成功 Match 不代表可直接 Lock。 | 新增 HO-P12-P18-001；Priority 对 active Lock 边界归 PDM-13，候补/Lock 动作归 PDM-18；不外推 Transaction。 | 9/06 SSOT §10.12 + PDM-04 Final §2 + 用户确认执行 | 2026-10-05 |
| PDM12-LIA-06 | PDM-12 | P12-LIA-06 | 人工确认仅由当前 Demand 负责人或当前 permission/data scope/object state 合法的 active 名邦 Employee 执行；4S hard DENY，System Admin 不因身份自动执行业务；同时精化 PDM-20车型年款/上牌年份与数字价格筛选边界，PDM-21确认事实→重算→再读 Match Result。 | 修复 carrier/handoff 精度，不新增第5批产品选择。 | PDM-02 Final + R10-38 + IA Current E05/P06-10 + 用户确认执行 | 2026-10-05 |
| PDM12-PREFINAL-GATE | PDM-12 | Pre-Final Integrity | P12-LIA-01～06 已用户批准并落地；二次 Full Evidence Matrix、Source↔Atom、Semantic Completeness、Completed-PDM Invariant、Handoff、stale carrier、negative claim 复核全部 PASS。 | PDM-12 Final Candidate 已可生成，但 Final 尚未用户批准/发布。 | PDM-12 Final前完整性复核报告 + 2026-10-05 用户确认执行 | 2026-10-05 |

| PDM12-FINAL | PDM-12 | Final Gate | 用户最终批准 PDM-12 Final Domain Overview；44 个正式 Atom 全覆盖，Source→Final / Final→Source / Semantic Completeness / Handoff / Negative Claims 全 PASS；正式发布 PDM-12 Final。 | PDM-12 = COMPLETE / INTEGRITY_PASS；incoming 4 条 handoff CLOSED；下一域 PDM-13。 | PDM-12 Final Overview + Final前完整性复核 + 2026-10-05 用户最终“全部同意”；此前执行授权继续有效 | 2026-10-05 |
| PDM13-STARTUP-20261005 | PDM-13 | Startup Gate / Incoming Handoffs | PDM-12 已 COMPLETE / INTEGRITY_PASS；PDM-13 工作版已建立；HO-P03-P13-001、HO-P04-P13-001、HO-P07-P13-001、HO-P11-P13-001、HO-P12-P13-001 已全部读取并接收。 | PDM-13 进入正式规则重建；5 条 incoming handoff 均改为 HANDOFF_ACCEPTED，Final 前不得关闭；IA / Low-Fi / Engineering 不施工。 | PDM-03/04/07/11/12 Final + Coverage Map + Handoff Register + 2026-10-05 当前仓库 Authority Refresh | 2026-10-05 |
| PDM13-GATE-B1 | PDM-13 | Batch 1 Gate | 用户确认 P13-A01～P13-A11 全部同意并明确“确认执行”。 | Batch 1 = PASS / USER_APPROVED；冻结：Priority 不复制 Matching、只消费 current valid high/acceptable、不得猜测/篡改 provenance、同车唯一 active、同 customer+vehicle+listing_cycle 幂等、TTL 创建时冻结、责任交接不改历史、Priority 不改 owner、与 Recommendation 分离、不改 Vehicle/listing_cycle、结束只恢复底层应有状态、历史不可抹除。资格来源、等级关系、精确仲裁、TTL 数值、active Lock、客户 visibility 等继续后续批次，不得视为已裁决。 | PDM-13 工作版 Batch 1 + 2026-10-05 用户“全部同意”并“确认执行” | 2026-10-05 |
| PDM13-DEC-B2-01 | PDM-13 | P13-B2-01 | 不得恢复独立“客户专属”体系；删除设为/解除客户专属、专属车辆对象/筛选/列表、E02 客户专属入口及与 Priority 平行的人工专属车源体系。 | 正式找车保护统一由 Demand→Matching→Priority 承接。 | R10-49 + M04-003/M04-005 + 2026-10-05 用户“同意确认执行” | 2026-10-05 |
| PDM13-DEC-B2-02 | PDM-13 | P13-B2-02 | Priority 必须由系统读取合法 Match Result 并经资格/仲裁自动产生；不得人工创建、转让、覆盖、直接延长、强制恢复 ended Priority，不恢复 priority.override。 | Current Navigation `E05-05｜创建 Priority` 登记为 stale carrier；不得按人工创建实现。 | 2026-09-17 统一匹配与Priority规则 §12 + M04-001 + 2026-10-05 用户确认执行 | 2026-10-05 |
| PDM13-DEC-B2-03 | PDM-13 | P13-B2-03 | Priority 不是 Lock 优先权，不得用作 LockRequest 排队、Priority 客户优先锁车、锁车等级竞争或第二套 Lock eligibility。 | active Lock/Lock takeover 的精确生命周期继续后续批次，不由本条偷渡。 | 2026-09-17 统一匹配与Priority规则 §1/§9 + VR-X-003 + 用户确认执行 | 2026-10-05 |
| PDM13-DEC-B2-04 | PDM-13 | P13-B2-04 | 客户端不得暴露 Priority / 优先保护 / 客户专属 / Priority 客户及内部仲裁机制等术语；客户端使用自然表达如“为您匹配”。 | 员工端/后台合法受控视图可展示真实 Priority 状态与截止时间。 | R10-50 + M04-003 + 2026-10-05 用户确认执行 | 2026-10-05 |
| PDM13-DEC-B2-05 | PDM-13 | P13-B2-05 | 废弃“Priority 本身直接授予客户车辆详情权”；Priority 创建不得自动产生客户详情可见权。 | 由 VR-X-003/004 替代旧 R10-50 客户侧直接可见口径；Current E05-05 HIDDEN_CONTROLLED 客户侧旧语义为 stale carrier；员工受控查看不自动废弃。 | 9/22 VR-X-003/004 + M04-006 + 用户确认执行 | 2026-10-05 |
| PDM13-GATE-B2 | PDM-13 | Batch 2 Gate | 用户确认 P13-B2-01～P13-B2-05 并明确“同意确认执行”；Batch 2 反向冲突扫描 PASS。 | Batch 2 = PASS / USER_APPROVED；Priority 资格/等级关系/精确仲裁/TTL 数值与配置主体/续期/结束原因/same-cycle/trigger_demand/active Lock/Transaction/公海保护/重仲裁事件继续后续批次，不得视为已废弃。 | PDM-13 工作版 Batch 2 + 2026-10-05 用户确认执行 | 2026-10-05 |
| PDM13-DEC-B3-01 | PDM-13 | P13-B3-01 | Priority 员工侧查看/处理统一继承 PDM-02 的 identity + permission + data scope + object state；页面可见不等于动作授权，敏感提交按当前事实重验；经理/店长不因职位自动获敏感 Priority 能力，System Admin 控制平面身份不自动等于 Priority 业务执行身份。 | capability 的最终命名与最小集合继续后续裁决，不由本条偷渡。 | PDM-02 Final + 2026-10-05 用户“同意，确认执行” | 2026-10-05 |
| PDM13-DEC-B3-02 | PDM-13 | P13-B3-02 | Priority 必须进入正式 Handover Batch；计划性失权先交接再生效，突发失效先撤权再补交接；逐对象留原/新负责人、操作人、时间、原因、批次来源和再次分配历史；部分失败不整体回滚。 | 是否继续 active、TTL 是否变化等 lifecycle 继续 Batch 4。 | PDM-02 Final §9.5 + PDM-03 Final §13/14 + 用户确认执行 | 2026-10-05 |
| PDM13-DEC-B3-03 | PDM-13 | P13-B3-03 | 若 Priority 仲裁采用 Demand 创建先后，只能使用不可变 Demand.created_at；pause/resume/reassignment 不重写，不得用 updated_at/最近 resume/最近改派时间替代。 | 是否采用 created_at 及其与 high/acceptable、demand_id 的最终顺序继续 Batch 4。 | PDM-11 Final §9 + 用户确认执行 | 2026-10-05 |
| PDM13-DEC-B3-04 | PDM-13 | P13-B3-04 | Demand paused/completed/cancelled、Customer disable/entitlement 导致 paused、readiness 失效、Match Result stale/invalidated 等使旧 Match Result 退出 current valid 后，已有 Priority 必须重新评估，不得继续依赖旧结果。 | 切换同客户其他 Demand、结束 Priority、expires_at 是否保持等 lifecycle 继续 Batch 4。 | PDM-11 Final §14/15 + PDM-12 Final §29/30 + 用户确认执行 | 2026-10-05 |
| PDM13-DEC-B3-05 | PDM-13 | P13-B3-05 | active Lock 不阻断 PDM-12 Matching；底层仍真实可售时其他 Demand 可继续产生并保留携带占用事实的 Match Result。PDM-13 只处理 Lock×Priority 关系，不得把已锁直接改成 no_match。 | active Lock 时 Priority 能否新建/继续、正式 Lock 如何 takeover/end Priority 继续 Batch 4。 | PDM-12 Final §18/§35 + 用户确认执行 | 2026-10-05 |
| PDM13-DEC-B3-06 | PDM-13 | P13-B3-06 | Priority 重评只消费 PDM-12 current Match Result / stale-invalidated fact / Matching change fact；Vehicle/价格/Demand/Rule 变化先由 PDM-12 重算，PDM-13 不复制第二套 parser/dictionary，不自行猜测或改 tier。 | Priority 自身完整重评/重新仲裁事件全集留 Final 前完整性审计。 | PDM-12 Final §28/29/31 + 用户确认执行 | 2026-10-05 |
| PDM13-GATE-B3 | PDM-13 | Batch 3 Gate | 用户确认 P13-B3-01～P13-B3-06 并明确“同意，确认执行”；Batch 3 冲突隔离 PASS。 | Batch 3 = PASS / USER_APPROVED；资格来源/等级关系/精确仲裁/TTL/续期/same-cycle/trigger_demand/active Lock/Transaction/公海保护/无 owner 与员工 capability 最终边界继续 Batch 4。 | PDM-13 工作版 Batch 3 + 2026-10-05 用户确认执行 | 2026-10-05 |
| PDM13-DEC-B4-01 | PDM-13 | P13-B4-01 | Priority 资格采用单 Customer 后台独立开关，不由 Customer Level 自动产生；Customer Level 仅继续决定正式找车 entitlement。普通/优先客户共用一套 Matching，hidden 但真实可售 Vehicle 仍可内部 Matching。Priority 胜出后形成限时排他保护，客户本人不会因 Priority 自动看到 Vehicle；由 trigger Demand 当前合法负责人先处理并决定 Recommendation，Recommendation/visibility grant 合法成立后客户才可见。 | 合并并替代原候选“等级 entitlement 产生 Priority”与独立全局 priority.view/priority.manage 方向；Priority 资格开关属于后台单 Customer 控制平面动作，普通负责销售不得仅因负责该客户自行开启；控制平面操作者不自动成为业务处理人。 | 9/17 Priority 原规则 + PDM-11/12/13 已批准规则 + 2026-10-05 用户修正并确认执行 | 2026-10-05 |
| PDM13-DEC-B4-02 | PDM-13 | P13-B4-02 | 多 Priority Customer 同车仲裁采用 2A：high > acceptable → 不可变 Demand.created_at 更早 → demand_id 更小；不引入 Customer Level/VIP/销售职位作为额外 Priority 等级。 | 同一 Customer 多 Demand 先确定唯一 trigger_demand_id，再以 Customer 单候选参与跨客户仲裁。 | 9/17 Priority 原规则 §4 + PDM-11 Demand.created_at + 用户选择 2A | 2026-10-05 |
| PDM13-DEC-B4-03 | PDM-13 | P13-B4-03 | Priority 默认 TTL 采用 3A：24h/86400s，后台全局可配；创建时冻结 expires_at；配置变更、Recommendation、Matching 重算、trigger Demand 切换、责任交接均不重置；不提供人工续期。TTL 是最长自动保护上限，不要求等待满时长，合法 responsible employee 可在 TTL 前主动 release。 | Priority TTL 与 Lock 默认 3 天分离；提前 release ≠ 修改 TTL。 | 9/17 Priority 原规则 §5 + P13-A05 + 用户选择 3A + P13-LIA-08 用户确认 | 2026-10-05 |
| PDM13-DEC-B4-04 | PDM-13 | P13-B4-04 | same listing_cycle 采用 4A：Customer 明确放弃、合法 responsible employee 明确“释放 Priority / 不推荐此车”、TTL 到期后，同 Customer+Vehicle+listing_cycle 不再因相同旧事实自动获得同车 Priority；Recommendation cancellation alone 不等于 Priority release，也不单独触发 same-cycle suppression。新的真实事实变化可重新参赛；新 listing_cycle 全量重算。 | 防止同一客户同周期反复占车，同时保持 Recommendation/Priority 两对象独立。 | 9/17 Priority 原规则 §5 + 用户选择 4A + P13-LIA-08 用户修正版 | 2026-10-05 |
| PDM13-DEC-B4-05 | PDM-13 | P13-B4-05 | trigger Demand 失效采用 5A：先找同 Customer 其他 active+matching-ready 且 current high/acceptable Demand；存在则切换 trigger_demand_id、Priority 继续 active、原 expires_at 不变；不存在则 ended 并释放重仲裁。 | 禁止通过 Demand 切换重置 TTL。 | 9/17 Priority 原规则 §6 + P13-B3-04 + 用户选择 5A | 2026-10-05 |
| PDM13-DEC-B4-06 | PDM-13 | P13-B4-06 | Lock/Transaction 采用 6A：active Lock 不阻断 Matching 但阻止新 Priority；正式 Lock 成立结束当前 active Priority，Lock 取消/到期不恢复旧 Priority；in-progress Transaction 阻止新 Priority，Transaction 开始结束已有 Priority，取消/纠错后车辆真正开放再重新仲裁。 | LockRequest/Waitlist 细节交 PDM-18；Transaction/Deposit/Refund/Correction 交 PDM-19。 | 9/17 Priority 原规则 §9/10 + PDM-12 active Lock Authority + 用户选择 6A | 2026-10-05 |
| PDM13-DEC-B4-07 | PDM-13 | P13-B4-07 | 责任交接采用 7A：Priority current responsible 跟随 trigger Demand 当前合法 responsible employee；进入 Handover Batch 时 TTL 继续自然运行，不暂停、不延长、不重置；新负责人只接剩余时间；无合法负责人不得新建 Priority，突发待交接也不能无限冻结 Vehicle。 | Customer owner 不直接等于 Priority responsible；System Admin 不业务兜底。 | PDM-02/03 Final + P13-B3-02 + 用户选择 7A | 2026-10-05 |
| PDM13-DEC-B4-08 | PDM-13 | P13-B4-08 | 公海/ended/release 采用 8A：Priority 资格本身不是公海保护，active Priority 才是；ended 必须保存真实 reason。合法 employee release 可在 TTL 前结束保护并立即重新读取所有 Customer 当前合法 Match Result；有 Priority 候选重新仲裁，无则回普通后续业务流；当前无人符合时不建新对象但 Vehicle 保留未来 Matching。Recommendation cancellation alone 不是 Priority ended reason。 | 既有 Recommendation/visibility 在后来 Priority 期间的 suppression/restore 交 PDM-14；公海交 PDM-17；Recommendation/Priority 独立由 LIA-08 收正。 | 9/17 Priority 原规则 §10/11 + P13-A11/B2-05 + 用户选择 8A + P13-LIA-08 | 2026-10-05 |
| PDM13-GATE-B4 | PDM-13 | Batch 4 Gate | 用户明确裁决：B4-01 按修正版；B4-02=2A、B4-03=3A、B4-04=4A、B4-05=5A、B4-06=6A、B4-07=7A、B4-08=8A，并随后“确认执行”。 | PDM13_LOCAL_PRODUCT_CHOICE_UNRESOLVED=0；下一步进入 Final 前完整性复核，不直接生成 Final。 | PDM-13 工作版 Batch 4 + 2026-10-05 用户确认执行 | 2026-10-05 |
| PDM13-LIA-01 | PDM-13 | Final前修复 | Priority 资格补齐为单 Customer 长期独立属性：后台逐客户开/关，不支持批量，默认持续有效直到合法关闭；进入公海不清资格；开关默认不强制 reason 但必须审计 actor/action/time/before-after。开启不创建 Demand/Priority，只重评现有合法 active+matching-ready Demand/current Match Result；关闭阻止新 Priority、结束该 Customer 当前 active Priority 并重新仲裁，但不暂停/取消其合法 Demand，该 Customer 仍可作为普通非-Priority 客户 Matching。 | 补齐历史稳定细节，不改变 B4-01“Priority 不由 Customer Level 自动产生”裁决。 | 9/17 Priority §2/§13 + M04-001 + 用户全部同意并确认执行 | 2026-10-05 |
| PDM13-LIA-02 | PDM-13 | Final前修复 | 同一 Priority Customer 可同时拥有多辆不同 Vehicle 的 active Priority，V1 不设 Customer 侧数量上限；每辆 Vehicle 独立仲裁、TTL、trigger Demand、lifecycle 与历史。 | 与“同一 Vehicle 同时最多一个 active Priority”互补，禁止误实现成一客户只能占一辆。 | 9/17 Priority §4 + M04-001 + 用户批准执行 | 2026-10-05 |
| PDM13-LIA-03 | PDM-13 | Final前修复 | Priority 采用 event-driven + affected-scope re-evaluation：Vehicle进入/恢复、Vehicle/价格/Match变化、Demand激活/恢复/条件/状态变化、Priority资格开关、responsible变化、release/expiry、Lock/Transaction结束后资源重新开放等触发重评；PDM-13只消费PDM-12 current Match Result，不复制Matching；定时任务只做TTL等必要兜底。 | 禁止把定时全库扫描作为唯一机制。 | 9/17 Priority §13 + M04-001 + PDM-12 Final + 用户批准执行 | 2026-10-05 |
| PDM13-LIA-04 | PDM-13 | Final前修复 | active Priority 排他覆盖普通 Feed/搜索/筛选/普通分享/无合法授权旧链接与历史入口，不能只封一个列表；existing Recommendation/visibility 不删除，suppression/restore 交PDM-14。面向客户的普通“在售车源/今日新增”等统计只统计当前真正公开可浏览 Vehicle，active Priority 保护车不计普通公共在售数。 | 不改变 hidden/availability 底层事实；Priority ended≠强制公开。 | M04-006/M04-008 + 用户批准执行 | 2026-10-05 |
| PDM13-LIA-05 | PDM-13 | Final前修复 | Priority 与价格/查价权彻底隔离：Priority资格或active Priority不授批发价查看权、不免费解锁价格、不增减/消耗daily quota、不改LIMITED/UNLIMITED、不改价格字段/公式/快照。Recommendation若授当前listing_cycle免费查价权，其来源仍是Recommendation/PDM-10 Authority。 | 防止 Priority 被误实现成价格权益来源。 | PDM-10 Final §§9-10 + P13-A08/B2-05 + 用户批准执行 | 2026-10-05 |
| PDM13-LIA-06 | PDM-13 | Final前修复 | 新增 HO-P13-P20-001 / P21-001 / P22-001：PDM-20承接客户端内部术语隐藏、公共入口排他与公共统计；PDM-21承接responsible Priority处理视图、剩余TTL、Recommendation/释放等真人Action并禁止人工创建/转让/续期/override；PDM-22承接单Customer Priority资格开关与全局24h TTL默认配置。 | 只约束后续投影/配置承接，不修改IA/Low-Fi。 | PDM-13已批准规则 + 第一轮Final前审计 + 用户批准执行 | 2026-10-05 |
| PDM13-PREFINAL-REPAIR-GATE | PDM-13 | Final前修复 Gate | 用户确认 P13-LIA-01～P13-LIA-06 全部同意并明确“确认执行”；修复已落工作版。 | 下一步必须做二次完整性复核；未经二次PASS不得生成Final Domain Overview。 | 2026-10-05 用户确认执行 | 2026-10-05 |
| PDM13-PREFINAL-INTEGRITY | PDM-13 | Final前二次完整性复核 | P13-LIA-01～06 执行后重新完成 Source→Atom / Atom→Source / Semantic Completeness / Completed-PDM Invariant / Cross-PDM Handoff / stale carrier / Negative Claims 扫描，全部 PASS；Missing Rule、Semantic Gap、Cross-PDM Conflict、Handoff Gap、Local Product Choice、Local Deferred 均为 0。 | 仅表示 FINAL_CANDIDATE_READY，不等于 Final 已发布；incoming handoff 继续 HANDOFF_ACCEPTED。 | 07_重建工作区/PDM-13_Final前完整性复核_2026-10-05.md | 2026-10-05 |
| PDM13-LIA-07 | PDM-13 | Final Overview 复查补漏 | active Priority 的 trigger Demand×Vehicle 当前 Match Result 若由 high/acceptable 降为 confirmation_needed/no_match，不能继续占满 TTL：先查同 Customer 其他合法 high/acceptable Demand，有则切 trigger_demand_id 且 expires_at 不变；无则 Priority ended（match_invalidated 或等价 reason），Vehicle 立即按所有 Customer 当前合法 Match Result 重新仲裁；当前无人符合时本轮不建新 Priority/Recommendation，但 Vehicle 继续参与未来 Matching。 | 补齐“current result tier downgrade”而非仅 stale/invalidated 的生命周期边界。 | 9/17 Priority §6 + PDM-12 current Match Result Authority + 2026-10-05 Final Overview 复查 + 用户确认执行 | 2026-10-05 |
| PDM13-LIA-08 | PDM-13 | Final Overview 复查补漏 / 用户修正版 | Priority TTL 是最长自动保护上限，不是必须等待满时长。合法 responsible employee 可在 TTL 前主动“释放 Priority / 不推荐此车”；release 后立即重新仲裁，原 Customer 同 listing_cycle 按既有 release suppression 防止相同旧事实立即选回。尚未 Recommendation 时不得把 release 叫“取消推荐”；已有 Recommendation 时可在员工体验层组合“结束推荐并释放保护”，但底层 Recommendation end 与 Priority release 必须分开校验/审计。Recommendation cancel alone 不结束 Priority；Priority release/expiry alone 不结束仍合法 Recommendation；Recommendation/Priority 结束均不得反向撤销已合法成立 Lock/Transaction。 | 收正 B4-04/B4-08 中“Recommendation cancellation 自动等于 Priority ended”的过度绑定；保持 P13-A08 对象独立。 | 9/17 Priority §8/§9 + P13-A08 + 2026-10-05 用户中文口径确认并明确“确认执行” | 2026-10-05 |
| PDM13-PREFINAL-R1-REOPENED | PDM-13 | Final Integrity Gate | 原 PDM13-PREFINAL-INTEGRITY PASS 在 Final Overview 复查后因发现 LIA-07/08 被重新打开；原报告保留为历史审计，不物理改写。 | 当前必须完成 R2 完整性复核；R2 PASS 前 Final Candidate 不得视为可最终批准版本。 | 2026-10-05 Final Overview 复查 + P13-LIA-07/08 | 2026-10-05 |
| PDM13-PREFINAL-INTEGRITY-R2 | PDM-13 | Final前完整性复核 R2 | P13-LIA-07～08 执行后重新检查 Match tier downgrade、TTL 前员工主动 release、same-cycle suppression、Recommendation/Priority 独立、Lock/Transaction 不反向撤销、handoff、Completed-PDM invariant 与 stale carrier，全部 PASS；当前正式 Atom=38。 | R1 报告保留历史；当前 Final Gate 以 R2 为准。Final 尚未发布，incoming handoff 仍 HANDOFF_ACCEPTED。 | 07_重建工作区/PDM-13_Final前完整性复核_R2_2026-10-05.md | 2026-10-05 |
| PDM13-FINAL-APPROVAL | PDM-13 | Final Domain Overview | 用户对 `07_重建工作区/PDM-13_最终完整规则总览_待用户批准.md` 明确“全部同意”，随后明确“确认执行”；Final Overview 正式通过。 | 解除 Final 发布门禁。 | 2026-10-05 用户最终批准 | 2026-10-05 |
| PDM13-FINAL-PUBLISH | PDM-13 | Final Publication | 正式发布 `07_重建工作区/PDM-13_最终完整规则.md`；38 条正式规则/修复 Atom 全部进入 Final；R2 完整性为当前有效 Gate。 | 5 条 incoming handoff 同次关闭并 source backwrite；8 条 outgoing handoff 保持 OPEN。 | PDM13-FINAL-APPROVAL + R2 Integrity | 2026-10-05 |
| PDM13-FINAL-HANDOFF-CLOSEOUT | PDM-13 | Incoming Handoff Closeout | HO-P03-P13-001 / HO-P04-P13-001 / HO-P07-P13-001 / HO-P11-P13-001 / HO-P12-P13-001 全部 HANDOFF_CLOSED；PDM-03/04/07/11/12 Final 已 source backwrite。 | PDM-13 可进入 COMPLETE / INTEGRITY_PASS。 | CROSS_PDM_HANDOFF_REGISTER + source backwrite | 2026-10-05 |
| PDM13-FINAL-INTEGRITY | PDM-13 | Final Integrity | Final 发布后机械复核：38 Atom 全部进入 Final；Source→Final / Final→Source / Semantic Completeness / Completed-PDM Invariant / Cross-PDM / Handoff / Negative Claims 全 PASS；5/5 incoming CLOSED + source backwrite；8 outgoing 保持 OPEN；未决计数全部为 0。 | `PDM-13 = COMPLETE / INTEGRITY_PASS`，允许进入 PDM-14 启动门禁。 | 07_重建工作区/PDM-13_最终完整性复核_2026-10-05.md | 2026-10-05 |

| PDM14-STARTUP-20261005 | PDM-14 | Startup Gate / Incoming Handoffs | PDM-14 已完成覆盖地图、9/19 C3/R7/R10、001～078 M05/M16/M11、Current carrier 与 PDM-01/03/04/07/10/11/12/13 Final 的 Current Authority Refresh；8 条 incoming handoff 已全部读取并接收。 | PDM-14 进入正式规则重建；8 条 incoming handoff 改为 HANDOFF_ACCEPTED，Final 前不得关闭；IA / Low-Fi / Engineering 不施工。 | PDM-14 工作版 §2 + Cross-PDM Handoff Register + 2026-10-05 当前仓库证据重建 | 2026-10-05 |
| PDM14-DEC-A01 | PDM-14 | P14-A01 | Recommendation 是独立正式业务对象，与 Matching、Priority、普通分享、visibility grant 分离；high/acceptable Match、Priority、普通分享均不得自动创建 Recommendation。 | 排除把 Recommendation 合并成 Match/Priority/share 子状态。 | 9/19 R7/R10 + PDM-12/13 Final + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-A02 | PDM-14 | P14-A02 | Recommendation 核心绑定 customer_id + vehicle_id + listing_cycle；同一组合已存在 active Recommendation 时幂等，不重复创建；同一 Customer 可同时有多车 Recommendation。 | 排除重复 active Recommendation。 | 9/19 R7 + M05 + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-A03 | PDM-14 | P14-A03 | Recommendation 不设固定 N 天 TTL；通过正式 lifecycle action、listing_cycle 结束或其他合法终止事实退出 active，历史保留。 | 排除固定推荐有效期自动清历史。 | 9/19 R7 + M05 + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-A04 | PDM-14 | P14-A04 | Recommendation 的 customer、vehicle、listing_cycle、recommender、created_at 为核心历史事实，不允许普通编辑直接改写；建错应 void/end 后按合法关系重建。 | 排除直接改对象主关系修正历史。 | 9/19 R7 + M05 + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-A05 | PDM-14 | P14-A05 | 同一 listing_cycle 内已结束 Recommendation 在当前 Guard 再满足时可以新建；新 listing_cycle 不继承旧 Recommendation，必须新建。 | 排除旧周期 Recommendation 跨周期自动继承。 | 9/19 R7 + PDM-04 listing_cycle Authority + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-A06 | PDM-14 | P14-A06 | recommender 记录创建时合法推荐员工；后续 owner/负责人变化、离职、handover 不回写历史 recommender。 | 历史推荐人不可被当前责任人覆盖。 | 9/19 R7 + PDM-03 handover + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-A07 | PDM-14 | P14-A07 | 普通分享只是传播/进入路径，不创建或转移 Recommendation、不授 Recommendation 查价权、不继承内部单车业务权；不建设 REC 专属 URL / 第二套推荐链接。 | 普通分享不能替代正式 Recommendation。 | 9/19 R7/R10 + M05 DEC-009 + PDM-03/10 Final + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-A08 | PDM-14 | P14-A08 | 分享接收人按自己的 customer_id 与当前权益判断，不继承分享人的 Recommendation/price/visibility；ownerless 新 Customer 与已有 owner 的归属继续服从 PDM-03 当前分享归属规则。 | 旧“普通分享永远 SOURCE_ONLY”不得覆盖 PDM-03 后续 Authority。 | PDM-03 Final + 9/19 R7/R10 + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-A09 | PDM-14 | P14-A09 | hidden 但真实可售 Vehicle 可被正式 Recommendation，并为该 Customer 建立单车 visibility grant；grant 不改变 hidden、不公开 Feed；Priority 本身不创建 grant。 | 排除 hidden=offline 与 Priority 直接授 visibility。 | CN9 + PDM-12/13 Final + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-A10 | PDM-14 | P14-A10 | Recommendation end/void 只结束由 Recommendation 产生的 visibility grant，不反向取消已合法 Lock/Transaction；其他独立 Authority 仍可维持访问。 | 防止 Recommendation 结束反向抹除其他业务事实。 | CN9 + PDM-13 Final + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-A11 | PDM-14 | P14-A11 | 正式 Recommendation 免费授 customer + vehicle + current listing_cycle 批发价查看权；仅限该车、不耗普通 quota、不分享转移；Recommendation 结束、owner/负责人变化、推荐人离职不追回当前周期已授权利，新周期不继承。 | 继承 PDM-10，不把 Priority/普通分享作为价格权来源。 | PDM-10 Final + HO-P10-P14-001 + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-A12 | PDM-14 | P14-A12 | Recommendation 创建时保存必要不可变价格快照用于历史；当前价格仍按当前 listing_cycle/权限动态读取；旧周期 Recommendation 不得泄露新周期受保护价格。 | 后续调价、阶梯、覆盖价、source_type 不回写历史快照。 | M05 DEC-013 + PDM-10 Final + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-A13 | PDM-14 | P14-A13 | Recommendation 可关联 0/1 个真实 source_demand_id；Customer/Demand 上下文已知时不重复选 Customer；多 Demand 记录真实来源；Recommendation 不得反向把 paused/completed/cancelled Demand 改 active。 | 排除 Recommendation 重建 Demand 生命周期。 | M05 DEC-008 + PDM-11 Final + HO-P11-P14-001 + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-A14 | PDM-14 | P14-A14 | “我的推荐”只展示正式 Recommendation，不混入 Match candidate、Source Radar、Priority；保留车辆、推荐时间、推荐人、source Demand、当前车辆状态与当前周期价格访问状态；不新增 Customer accept/reject 状态机。 | 排除候选/优先权冒充正式推荐。 | 9/19 R10 + M16 + 用户审查确认并确认执行 | 2026-10-05 |
| PDM14-DEC-R01 | PDM-14 | P14-R01 | Priority qualification 属于 Customer，不属于 Employee；Priority 不改变 Customer 原有 owner/合法业务责任，也不额外赋予其他 Employee Recommendation 创建权；当前合法负责该 Customer/source Demand 的销售继续按既有 owner/handover/Demand responsibility 关系处理并决定 Recommendation。 | 特殊离职/调店/交接按既有 handover Authority 解决，不通过扩大 Recommendation 权限解决；不得把 Priority responsible 解释为新的独立授权来源。 | PDM-03/11/13 Final + 2026-10-05 用户逐项确认并“确认执行” | 2026-10-05 |
| PDM14-DEC-R02 | PDM-14 | P14-R02 | 取消独立 Customer Recommendation qualification。Customer 是否具备正式找车/接受 Recommendation 的资格统一由当前 Customer Level 的 find-car entitlement 决定；Recommendation 是合法负责销售对具体 Vehicle 的业务动作；Priority qualification 继续独立，只决定 Priority 排他保护。 | 显式 supersede 旧 R7 独立推荐资格、P06-06 开关、RECOMMENDATION_QUALIFIED/NOT_QUALIFIED 及仅服务该旧开关的独立资格管理能力。 | 旧 R7 + Current IA P06-06 + PDM-11/13 Final 跨域核对 + 2026-10-05 用户确认“没什么问题”并确认执行 | 2026-10-05 |
| PDM14-DEC-R03 | PDM-14 | P14-R03 | Customer disable 不结束、作废或删除既有 Recommendation，不抹除历史/快照；停用期间禁止新建 Recommendation并暂停依赖 Customer 身份的 Recommendation 客户侧能力。恢复继续原 customer_id，仅对恢复时仍 active、同合法 listing_cycle、Vehicle 当前允许访问且无其他 Guard 阻断的 Recommendation 重新开放能力，不复活 ended/void/周期失效对象。 | 与 PDM-01 上层停用 Guard、PDM-10 不删除已授 price-right fact 对齐。 | PDM-01 Final §11 + PDM-10 Final §9.1 + 2026-10-05 用户明确“同意”并确认执行 | 2026-10-05 |
| PDM14-DEC-R04 | PDM-14 | P14-R04 | 其他 Customer 获得 active Priority 时，既有 Recommendation/visibility 历史不删除、不结束，已成立 price-right fact 不删除；Priority 期间只临时 suppression 客户侧访问，禁止通过我的推荐/旧分享/历史详情穿透。Priority ended 后按 Recommendation、listing_cycle、Vehicle可售/可访问、Customer状态及新的 Priority/Lock/Transaction 等当前事实决定是否恢复。 | Priority 压制当前访问而非抹除历史；ended 后不得无条件恢复。 | PDM-13 Final §§17-18 + HO-P13-P14-001 + 2026-10-05 用户明确“同意”并确认执行 | 2026-10-05 |
| PDM14-GATE-B1 | PDM-14 | Batch 1 Gate | P14-A01～P14-A14 与 P14-R01～P14-R04 已完成用户审查并获“确认执行”；Start Gate PASS，8 条 incoming handoff 已 ACCEPTED。 | Batch 1 = PASS / USER_APPROVED；下一步只进入 Batch 2 明确废弃/替代/DO_NOT_RESTORE 扫描，不提前关闭 handoff，不施工 IA/Low-Fi/Engineering。 | PDM-14 工作版 + 2026-10-05 当前对话确认执行 | 2026-10-05 |
| PDM14-DEC-B2-01 | PDM-14 | P14-B2-01 | 废弃独立 Recommendation qualification：旧 R7 普通客户默认无推荐资格、P06-06 开关、RECOMMENDATION_QUALIFIED/NOT_QUALIFIED 与仅服务该旧开关的管理能力均不得恢复。 | 当前正式找车/Recommendation 资格统一读取 Customer Level find-car entitlement；Priority qualification 保持独立。 | 旧 R7 + Current IA/Low-Fi P06-06 + P14-R02 + 用户全部同意并确认执行 | 2026-10-05 |
| PDM14-DEC-B2-02 | PDM-14 | P14-B2-02 | 经理、店长、协作销售等身份本身不得天然获得 Recommendation 创建权。 | Recommendation 创建必须建立在当前合法 Customer/source Demand 业务负责关系上；管理/协作身份不是授权来源。 | 旧 R7 显式废弃记录 + PDM-02/03/11 Final + 用户确认执行 | 2026-10-05 |
| PDM14-DEC-B2-03 | PDM-14 | P14-B2-03 | 旧“只有 Customer current owner 才能创建 Recommendation”的绝对规则被替代；当前读取 owner/handover/Demand responsibility 所形成的当前合法业务负责关系。 | 不得放宽成任意 Employee 可推荐；合法 source Demand responsible / handover 不得被旧 owner-only 阻断。 | 旧 R7 + PDM-03/11 Final + P14-R01 + 用户确认执行 | 2026-10-05 |
| PDM14-DEC-B2-04 | PDM-14 | P14-B2-04 | Priority responsible 不得被解释为新的 Recommendation 授权来源。 | Priority 不改变既有 owner/handover/Demand responsibility；Recommendation 仍读取当前合法业务负责关系。 | PDM-13 Final + P14-R01 + 用户确认执行 | 2026-10-05 |
| PDM14-DEC-B2-05 | PDM-14 | P14-B2-05 | 旧“客户转发永远 SOURCE_ONLY、永远不能形成 owner”被 PDM-03 当前分享归属 Authority 替代。 | ownerless 新 Customer 可由合法分享/转介绍链形成 owner；已有 owner 不被抢；SOURCE_ONLY 状态本身不删除。 | 旧 R7/Current carrier + PDM-03 Final + P14-A08 + 用户确认执行 | 2026-10-05 |
| PDM14-DEC-B2-06 | PDM-14 | P14-B2-06 | REC 专属 URL、Recommendation-specific link、第二套推荐分享页/微信分享链路不得恢复。 | Recommendation 是内部正式业务事实；对外发送 Vehicle 使用普通分享链路。 | M05 DEC-009 + P14-A07 + 用户确认执行 | 2026-10-05 |
| PDM14-DEC-B2-07 | PDM-14 | P14-B2-07 | 废弃“所有 Vehicle 必须 Recommendation 后客户才可见”。 | 公开 Vehicle 按公共可见规则访问；hidden/controlled Customer 单车详情权才需要 Recommendation + visibility grant。 | Current IA DP-03 + P14-A09 + 用户确认执行 | 2026-10-05 |
| PDM14-DEC-B2-08 | PDM-14 | P14-B2-08 | Current IA/Low-Fi HIDDEN_CONTROLLED 中“Demand/Priority 上下文直接授 Customer hidden Vehicle 详情权”被替代。 | 员工可内部处理 hidden candidate；Customer 端必须正式 Recommendation + Customer-specific visibility grant。 | Current IA/Low-Fi + PDM-13 Final + P14-A09 + 用户确认执行 | 2026-10-05 |
| PDM14-DEC-B2-09 | PDM-14 | P14-B2-09 | 其他 Customer active Priority 不得删除/结束既有 Recommendation、历史快照或已成立 price-right fact。 | 只做客户侧 visibility suppression；Priority ended 后按当前事实决定 restore。 | PDM-13 Final + P14-R04 + 用户确认执行 | 2026-10-05 |
| PDM14-DEC-B2-10 | PDM-14 | P14-B2-10 | Customer Merge 及随 Merge 迁移 Recommendation/price-right/Consultation/Demand/Lock/Transaction 等全部不得恢复；P06-01/P06-M01 Merge 状态机为 stale carrier。 | V1 完全取消 Customer Merge，不存在 surviving customer_id 与权益迁移。 | PDM-01 Final + 旧 R7 §25 + Current IA/Low-Fi + 用户确认执行 | 2026-10-05 |
| PDM14-DEC-B2-11 | PDM-14 | P14-B2-11 | Recommendation 创建后系统自动微信发送及发送成功/失败状态机不得恢复。 | Recommendation 创建只建立正式业务事实；Vehicle 对外发送使用普通分享；当前主动通知白名单不因 Recommendation 自动扩展。 | 旧 R7-53 显式删除 + Current notification whitelist + 用户确认执行 | 2026-10-05 |
| PDM14-GATE-B2 | PDM-14 | Batch 2 Gate | 用户对 P14-B2-01～P14-B2-11 明确“全部同意”，随后明确“确认执行”；Batch 2 反向冲突扫描 PASS，FALSE_DEPRECATION_COUNT=0。 | Batch 2 = PASS / USER_APPROVED；下一步进入 Batch 3 informed changes / explicit additions 扫描；incoming handoff 继续 HANDOFF_ACCEPTED，IA/Low-Fi/Engineering 继续不施工。 | PDM-14 工作版 Batch 2 + 2026-10-05 用户确认执行 | 2026-10-05 |
| PDM14-DEC-B3-01 | PDM-14 | P14-B3-01 | 分享直达与普通进入统一使用同一套车辆详情业务页；SHARE_DIRECT 只增加必要轻量入口，不复制第二套详情业务逻辑；收藏/咨询/锁车继续按接收人当前身份、Vehicle 状态与 visibility/业务 Guard 判断。 | 分享入口不得绕过 hidden/Priority/offline/sold/权限，也不成为 Recommendation 事实源。 | 9/19 R10-02 + Current SHARE_DIRECT + 2026-10-06 用户全部同意并确认执行 | 2026-10-06 |
| PDM14-DEC-B3-02 | PDM-14 | P14-B3-02 | 后续客户端把旧“我要这辆车”语义拆分：沟通车辆统一走 Consultation/“咨询”；锁车走独立 LockRequest/Lock 业务链；普通详情与分享详情统一。 | PDM-14 只冻结 Recommendation/分享动作边界；LockRequest 6h、审批、Lock/Waitlist 生命周期继续 PDM-18。 | 9/22 VR-C-004/005/009 + R10 后续反查 + 用户确认执行 | 2026-10-06 |
| PDM14-DEC-B3-03 | PDM-14 | P14-B3-03 | “我的推荐”明确区分当前与历史；Demand结束、销售离职、owner变化、Vehicle售出/下架等不删除 Recommendation 历史。 | 历史存在不等于当前仍可访问；从历史进入必须重读当前 Vehicle/listing_cycle/Customer/Priority/Lock/Transaction/price Authority。 | R10-17 + M16-008 + P14-A14 + 用户确认执行 | 2026-10-06 |
| PDM14-DEC-B3-04 | PDM-14 | P14-B3-04 | 车辆档案/报告不完整本身不得阻止正式 Recommendation；Recommendation/Vehicle visibility grant 也不自动授完整VIN、绿本、行驶证、敏感原件或仅内部档案可见。 | Vehicle visibility、Recommendation 权利与档案/报告 customer_visible 独立分层；档案客户可见继续服从 PDM-07。 | PDM-07 Final §§2-4,9-10 + HO-P07-P14-001 + 用户确认执行 | 2026-10-06 |
| PDM14-DEC-B3-05 | PDM-14 | P14-B3-05 | 正式 Recommendation 成立后相关 Priority 可保存 recommendation_id 作为关联追溯字段，但只用于历史关联。 | Priority 与 Recommendation 仍是独立对象；任一方 end/release/expiry 不因该字段自动结束另一方；组合操作也必须分别校验/执行/审计。 | PDM-13 Final §§16-17 + HO-P13-P14-001 + 用户确认执行 | 2026-10-06 |
| PDM14-GATE-B3 | PDM-14 | Batch 3 Gate | 用户对 P14-B3-01～P14-B3-05 明确“全部同意”，随后明确“确认执行”；Batch 3 冲突隔离 PASS，未把真实冲突或新产品选择误归入知情修改。 | Batch 3 = PASS / USER_APPROVED；下一步进入 Batch 4 conflicts/omissions/gaps/new choices；8 条 incoming handoff 继续 HANDOFF_ACCEPTED，IA/Low-Fi/Engineering 继续不施工。 | PDM-14 工作版 Batch 3 + 2026-10-06 用户确认执行 | 2026-10-06 |
| PDM14-DEC-B4-01 | PDM-14 | P14-B4-01 / 1A | Recommendation end/void 读取当前合法 Customer/source Demand 业务责任关系 + identity/permission/data scope/object state；历史 recommender 仅在当前仍合法时可操作；经理/店长职位本身不授权。void 必须记录原因，普通 end 原因不设统一硬必填。 | 排除“历史推荐人永久拥有当前操作权”和“职位天然拥有结束/作废权”；核心历史字段与快照不改写。 | R7 §11/§13 + PDM-02/03/11 Final + 用户 1A 并确认执行 | 2026-10-06 |
| PDM14-DEC-B4-02 | PDM-14 | P14-B4-02 / 2B | Customer Level find-car entitlement 失效后：禁止新 Recommendation；已有 Recommendation 不删除/end/void，历史与当前 cycle 已成立免费 price-right fact 保留，但暂停 Recommendation-only 客户侧能力/hidden visibility；权益恢复后仅对当时仍 active、同合法 cycle、Vehicle/Customer/其他 Guard 均合法的对象重新开放。 | find-car entitlement 与价格权益仍分层；不得用失效 Recommendation 能力绕过当前 Level 资格，也不得因此抹除历史或已成立价格事实。 | PDM-11 Final §15 + P14-R02/R03 + PDM-10 Final + 用户 2B 并确认执行 | 2026-10-06 |
| PDM14-DEC-B4-03 | PDM-14 | P14-B4-03 / 3A | 同 listing_cycle 内 active Recommendation 持续作为 hidden Vehicle customer-specific visibility 的授权来源：visible→hidden 时幂等确保 grant/effective authorization；hidden→visible 不结束 Recommendation；同 cycle 再 hidden 时仍可依 active Recommendation 重新生效。 | Recommendation end/void 只结束其自身支撑的 grant；Lock/Transaction/其他独立 Authority 与 Priority suppression 分别处理。 | R7/CN9 hidden grant + PDM-04 Final + P14-A09/A10/R04 + 用户 3A 并确认执行 | 2026-10-06 |
| PDM14-DEC-B4-04 | PDM-14 | P14-B4-04 / 4A | 普通分享链接只提供导航，不形成永久 visibility。每次打开按当前 Vehicle/listing_cycle/Customer/Priority/独立业务 Authority 实时重算；hidden/Priority 无当前 Authority 则不可查看；offline/sold/周期结束不进入在售详情；新 cycle 可继续作为同 vehicle 入口但全部权益重新判断。 | ownerless 新 Customer 归属继续服从 PDM-03 当前分享链规则；已有 owner 不被抢；历史详情权来自本人历史业务关系而非分享链接。 | R7 §§17-22 + R10-02/13/68/69 + PDM-03/13 Final + 用户 4A 并确认执行 | 2026-10-06 |
| PDM14-DEC-B4-05 | PDM-14 | P14-B4-05 / 5A | Recommendation 历史推荐价快照与当前价格严格分层：历史显示不可变 recommendation_price_snapshot；当前价格必须按当前 Vehicle/listing_cycle、当前访问权与 PDM-10 当前价格 Authority 实时判断；旧 cycle Recommendation 不授权新 cycle 当前价格。 | 页面布局交 PDM-20；禁止用现价覆盖历史推荐价或借历史关系泄露新周期受保护价格。 | DEC-013 / M05-002 + PDM-10 Final + P14-A12/B3-03 + 用户 5A 并确认执行 | 2026-10-06 |
| PDM14-DEC-B4-06 | PDM-14 | P14-B4-06 / 6A | 合法 source_type 修改及批发→名邦一键转换在同 vehicle_id、当前模型同 listing_cycle 下不新建/迁移/复制/清空 Recommendation；核心关系、历史快照与当前 cycle 已成立免费查价权继续。 | 转换后重新读取当前 availability/visibility/价格；hidden 时 active Recommendation 继续作为 visibility 授权来源；不存在跨 Vehicle 迁移流程。 | PDM-04 Final §§11-15 + PDM04-REV-COVER-02 + 用户 6A 并确认执行 | 2026-10-06 |
| PDM14-DEC-B4-07 | PDM-14 | P14-B4-07 / 7A | active Lock / in-progress Transaction 的占用事实本身不自动禁止新建 Recommendation；若 Vehicle 仍真实可售、cycle 有效、Customer entitlement/责任/权限合法且无其他 Customer active Priority 等排他 Guard，可 Recommendation。 | Recommendation 不产生锁车优先权、不绕过占用；Waitlist/LockRequest/Transaction 完整状态机交 PDM-18/19；sold/offline/unavailable/cycle end 后禁止新建当前周期 Recommendation。 | PDM-04 Final §§2/5A + R10-76 + PDM-13 Final §§21-23 + 用户 7A 并确认执行 | 2026-10-06 |
| PDM14-DEC-B4-08 | PDM-14 | P14-B4-08 / 8A | Recommendation 与 Consultation 不相互反写：Recommendation end/void 不自动结束既有 Consultation；已有未终结 Consultation 后新增 Recommendation 不自动建第二条 Consultation、不抢当前负责人、不改历史来源。 | Consultation 状态机/负责人/SLA/终态由 PDM-15 承接；新增 HO-P14-P15-001。 | R7 §11及咨询跨对象边界 + M05-001/M06 历史反查 + 用户 8A 并确认执行 | 2026-10-06 |
| PDM14-GATE-B4 | PDM-14 | Batch 4 Gate | 用户明确选择 `1A、2B、3A、4A、5A、6A、7A、8A`，随后以“确定指向”确认执行。 | `PDM14_LOCAL_PRODUCT_CHOICE_UNRESOLVED=0`；Batch 4 = PASS / USER_APPROVED；下一步进入 Final 前完整性复核，不直接生成 Final。8 条 incoming handoff 继续 HANDOFF_ACCEPTED。 | PDM-14 Batch 4 用户裁决 + 2026-10-06 确认执行 | 2026-10-06 |
| PDM14-LIA-01 | PDM-14 | P14-LIA-01 | Final 前补齐三类车源 Recommendation 适用范围：名邦/4S/JYT 均可被合法名邦负责销售正式推荐；4S成员 hard DENY 不等于4S车不可推荐；只有批发查价机制适用车辆才因 Recommendation 获得当前 cycle 免费批发数字价格权。 | 精确限定 P14-A11 范围，防止把所有 source_type 误实现成批发查价对象。 | R7 §§7/46 + PDM-10 Final §10 + PDM-02 Final 4S hard DENY + 用户同意/确定执行 | 2026-10-06 |
| PDM14-LIA-02 | PDM-14 | P14-LIA-02 | Recommendation create/end/void 提交时统一重验 active eligible 名邦 Employee、当前合法业务责任、对应 permission/capability、data scope、对象状态及其他当前 Guard；4S hard DENY，System Admin 身份不自动执行业务。 | 职位名称、历史 recommender、旧页面均不得绕过当前 Guard。 | PDM-02 Final + PDM-03/11 Final + IA Current mutation guard + 用户确认执行 | 2026-10-06 |
| PDM14-LIA-03 | PDM-14 | P14-LIA-03 | 批量推荐仅是 UI 批量动作；每辆 Vehicle 按 customer+vehicle+listing_cycle 独立 Guard、幂等并分别 create/reuse Recommendation，禁止 group Recommendation。 | 已 active 的单车只复用原对象并记 touch/audit，不影响同批其他车辆。 | R7 §9 / R7-19 + P14-A02 + 用户确认执行 | 2026-10-06 |
| PDM14-LIA-04 | PDM-14 | P14-LIA-04 | Recommendation create/end/void 不改变 Customer owner 或 Demand responsible；owner/responsible 变化也不自动 end/void Recommendation、不改 historical recommender；后续 mutation 读取当前合法责任关系。 | owner、Demand responsibility、Recommendation 三类事实分层保存与审计。 | R7 §§6/47-49 + PDM-03 Final §11 + P14-R01/A06/B4-01 + 用户确认执行 | 2026-10-06 |
| PDM14-LIA-05 | PDM-14 | P14-LIA-05 | 普通 share link 无固定 N 天 TTL，可继续转发；每次打开实时重算 Vehicle/Customer/owner/权限，owner 仍服从 PDM-03；再转发不传播 Recommendation/price-right/visibility/Internal Mode。 | 链接未过期不代表绕过 offline/sold/cycle/Priority 等当前状态；不建设多级权限继承链。 | R7 §§20-22 / R7-54~55 + PDM-03 Final + P14-B4-04 + 用户确认执行 | 2026-10-06 |
| PDM14-LIA-06 | PDM-14 | P14-LIA-06 | 批发 Vehicle Recommendation 创建时即使只有“价格咨询”，当前 cycle 免费 price-right fact 仍立即成立；同 cycle 后续出现数字价直接使用该免费权，不扣 daily quota、不重建 Recommendation。 | 新 listing_cycle 不继承。 | PDM-10 Final §10 + 001~078 M11 价格反查 + 用户确认执行 | 2026-10-06 |
| PDM14-LIA-07 | PDM-14 | P14-LIA-07 | Recommendation/visibility grant 只授 Customer Safe Projection，不自动下发 Internal Mode、内部价敏感字段、上游电话、VIN/敏感档案、Priority/Match 内部事实等。 | 敏感字段继续逐项服从 PDM-07/09/10/13 等 Authority。 | R11-21 / M05-010 + PDM-07/09/10/13 Final + 用户确认执行 | 2026-10-06 |
| PDM14-LIA-08 | PDM-14 | P14-LIA-08 | JYT/外部同步只维护合法 Source Data/Vehicle facts，不得直接 create/end/void/delete/overwrite Recommendation 或 customer-specific visibility grant，也不得覆盖其他名邦 Business Data。 | 上游事实导致业务状态变化时由名邦业务域消费事实并执行自身 lifecycle。 | 001~078 M05-015 + PDM-04 Source/Business Data 分层 + 用户确认执行 | 2026-10-06 |
| PDM14-LIA-09 | PDM-14 | P14-LIA-09 | Consultation 不自动创建 Recommendation、不授 Recommendation 免费 price-right、不授 hidden Vehicle visibility；若来源于 Recommendation，仅保存真实 source relation，不绑定生命周期。 | 扩充 HO-P14-P15-001；Consultation 完整 lifecycle 仍归 PDM-15。 | R7 §§40-42/46 + P14-B4-08 + 用户确认执行 | 2026-10-06 |
| PDM14-LIA-10 | PDM-14 | P14-LIA-10 | 补齐正式 outgoing handoff：PDM-15/18/19/20/21/23/25，分别承接 Consultation、Lock、Transaction、客户端投影、员工端操作、通知边界、统一审计。 | 只登记当前 Authority，不提前施工目标域。 | PDM-14 工作版各跨域条款 + Coverage Map + Cross-PDM Gate + 用户确认执行 | 2026-10-06 |
| PDM14-PREFINAL-REPAIR-GATE | PDM-14 | P14-LIA-01～10 | 用户对 Final 前完整性复核第一轮发现的 10 项修复全部“同意”，随后“确定执行”；10 项均属于历史规则/已完成 PDM Authority 的完整恢复与 handoff 补齐，不新增第五批产品选择。 | 下一步重新执行 Pre-Final Integrity R2；8 条 incoming handoff 继续 HANDOFF_ACCEPTED，Final 前不得关闭。 | PDM-14 Pre-Final Integrity R1 扫描 + 2026-10-06 用户确认执行 | 2026-10-06 |
| PDM14-PREFINAL-GATE | PDM-14 | Pre-Final Integrity R2 | P14-LIA-01～10 已用户批准并执行；修复后重新执行 Source→Atom、Atom→Source、Semantic Completeness、Completed-PDM Invariant、8条 incoming、7条 outgoing、Negative Claims、stale carrier 与 Local Deferred 全量复核均 PASS；所有 unresolved=0。 | `PDM14_FINAL_CANDIDATE_READY=YES`；下一步只生成 Final Domain Overview 候选供用户最终批准；不得提前发布 Final / 关闭 incoming / 开始 PDM-15。 | 07_重建工作区/PDM-14_Final前完整性复核_R2_2026-10-06.md + 2026-10-06 修复后机械复核 | 2026-10-06 |
| PDM14-FINAL | PDM-14 | Final Gate | 用户最终批准 PDM-14 Final Domain Overview 并明确“确定执行”；52 个正式规则/裁决单元全部进入 Final，Pre-Final R2 与 Final Integrity 均 PASS。 | PDM-14 = COMPLETE / INTEGRITY_PASS；8 条 incoming handoff 全部 HANDOFF_CLOSED 并完成 source backwrite；7 条 outgoing handoff 保持 HANDOFF_OPEN；下一步 PDM-15 Startup Gate。 | PDM-14 最终总览 + PDM-14 最终完整规则 + PDM-14 最终完整性复核 + 2026-10-06 用户最终确认执行 | 2026-10-06 |

| PDM15-DEC-A01 | PDM-15 | P15-A01 | 只有客户对合法 Vehicle 执行明确“咨询”动作才创建或复用 Consultation；浏览、收藏、普通分享、Recommendation 创建本身不自动建单。 | 手机号等人工服务门槛服从 PDM-01；取消手机号授权流程不产生 Consultation。 | PDM-15 Batch 1 + 用户全部同意并确定执行 | 2026-10-06 |
| PDM15-DEC-A02 | PDM-15 | P15-A02 | Consultation 创建时记录真实初始来源；后续 Recommendation、分享、搜索、收藏、再次进入详情不得覆盖初始来源。 | 若来源为 Recommendation 只保存真实关联；Recommendation 后续 end/void 不回写来源事实。 | PDM-15 Batch 1 + 用户全部同意并确定执行 | 2026-10-06 |
| PDM15-DEC-A03 | PDM-15 | P15-A03 | 同 customer_id + vehicle_id + listing_cycle 已有未终结 Consultation 时幂等复用，不创建第二条未终结记录。 | 终态后再次真实咨询可新建；新 listing_cycle 不跨周期复用；终态精确枚举留后续状态机裁决。 | PDM-15 Batch 1 + 用户全部同意并确定执行 | 2026-10-06 |
| PDM15-DEC-A04 | PDM-15 | P15-A04 | offline/unavailable 后不得新建当前周期 Consultation；既有未终结 Consultation 不因车辆后来下架而被删除或自动伪造终态。 | hidden != offline；仍真实可售且 Customer 有合法访问入口时 hidden 本身不阻断 Consultation；新 cycle 不继承旧 Consultation。 | PDM-15 Batch 1 + 用户全部同意并确定执行 | 2026-10-06 |
| PDM15-DEC-A05 | PDM-15 | P15-A05 | Consultation 当前负责人独立于 Customer owner；owner 变化不自动漂移 Consultation assignee。 | 换负责人必须正式 reassignment/handover，并留旧负责人、新负责人、操作者、时间、原因/上下文；转派不反向修改 Customer owner。 | PDM-15 Batch 1 + 用户全部同意并确定执行 | 2026-10-06 |
| PDM15-DEC-A06 | PDM-15 | P15-A06 | Consultation 与 Recommendation 双向独立，不互相自动创建、结束、抢写负责人或改写初始来源。 | Consultation 不授 Recommendation 免费 price-right、不授 hidden Vehicle visibility；Consultation 终态也不自动 end/void 合法 Recommendation。 | PDM-15 Batch 1 + 用户全部同意并确定执行 | 2026-10-06 |
| PDM15-DEC-A07 | PDM-15 | P15-A07 | 车辆档案、检测报告、维保资料不完整本身不得阻止 Consultation。 | Consultation 不把档案完整度升级成车辆可售性事实；真实 offline/unavailable 仍阻断新增咨询。 | PDM-15 Batch 1 + 用户全部同意并确定执行 | 2026-10-06 |
| PDM15-DEC-A08 | PDM-15 | P15-A08 | 4S Member 不进入名邦 Consultation 查看、领取、处理、转派、终结链；4S source Vehicle 可否被咨询按 Vehicle 当前合法事实判断。 | 合法 Consultation 一旦形成，负责人/处理链属于名邦侧合法 Employee；source_type=4S 不把咨询直接交给 4S Member。 | PDM-15 Batch 1 + 用户全部同意并确定执行 | 2026-10-06 |
| PDM15-GATE-B1 | PDM-15 | Batch 1 Gate | 用户对 P15-A01～P15-A08 明确“全部同意”，随后明确“确定执行”。 | Batch 1 = PASS / USER_APPROVED / APPLIED；5 条 incoming handoff 继续 HANDOFF_ACCEPTED；下一步进入 Batch 2 明确废弃/被替代/不得恢复项审查。 | PDM-15 工作版 Batch 1 + 2026-10-06 用户确定执行 | 2026-10-06 |

| PDM15-DEC-B2-01 | PDM-15 | P15-B2-01 | 旧“我要这辆车”统一意向入口不得恢复；沟通车辆=Consultation/咨询，锁车=LockRequest/Lock，Recommendation=员工正式推荐动作。 | 保留状态驱动 CTA，但不得再用一个按钮承载咨询/推荐/锁车多种业务。 | M06-003/M06-006 + PDM-14 Final §22 + 用户全部同意并启动执行 | 2026-10-06 |
| PDM15-DEC-B2-02 | PDM-15 | P15-B2-02 | Consultation timeout 不得作为第五主状态或自动终态；只作为派生超时标记/筛选/提醒条件。 | timeout 不自动 resolved/invalid/cancelled；通知结果也不得改写 Consultation 主状态。 | R12 §§10.3/13.3/R12-C04 + M06-010 + 用户全部同意并启动执行 | 2026-10-06 |
| PDM15-DEC-B2-03 | PDM-15 | P15-B2-03 | 当前 PDM-01 Final 已完全取消 Customer Merge，因此不得恢复 Consultation 随 Customer Merge 搬迁、合并或重写 customer_id。 | 历史中曾存在 Phase1.5 Merge Flow，但已被后续用户 Final 明确 supersede；以 PDM-01 Final 为当前 Authority。 | PDM-01 Final §6 + PDM-14 Batch2 + 用户全部同意并启动执行 | 2026-10-06 |
| PDM15-DEC-B2-04 | PDM-15 | P15-B2-04 | Consultation assignee 与 Customer owner 必须分离；不得用 owner 字段/文案把两者合并。 | owner 变化不自动漂移 Consultation 负责人；Consultation reassignment 也不等于 owner transfer。 | PDM-03 Final §11 + P15-A05 + Current carrier conflict + 用户全部同意并启动执行 | 2026-10-06 |
| PDM15-DEC-B2-05 | PDM-15 | P15-B2-05 | Recommendation create/end/void 不得驱动 Consultation 自动 create/end/reassign/source rewrite。 | 若真实来源为 Recommendation，只保留 source relation，不绑定生命周期。 | PDM-14 Final §23 + P15-A06 + 用户全部同意并启动执行 | 2026-10-06 |
| PDM15-GATE-B2 | PDM-15 | Batch 2 Gate | 用户对 P15-B2-01～P15-B2-05 全部同意并启动执行；Reverse Conflict Scan PASS，FALSE_DEPRECATION_COUNT=0。 | 明确保留 Customer 撤回/正常关闭、SLA+timeout提醒、正式转派、状态驱动CTA、真实Recommendation来源关联、独立Customer owner；下一步进入 Batch 3。 | PDM-15 工作版 Batch 2 + 2026-10-06 用户执行指令 | 2026-10-06 |

| PDM15-DEC-B3-01 | PDM-15 | P15-B3-01 | Customer 可主动撤回本人未终结 Consultation；撤回属于正常结束，不得记为 invalid；历史保留，不改 Customer owner / Recommendation / Vehicle / Lock / Transaction。 | 撤回最终映射到 CANCELLED 还是 resolved + close_reason 留 Batch 4。 | PDM-15 Batch 3 + 用户全部同意确认执行 | 2026-10-06 |
| PDM15-DEC-B3-02 | PDM-15 | P15-B3-02 | 合法员工可对 open Consultation 记录真实跟进；提交时重验当前责任关系 + identity + permission + data scope + object state；跟进不自动结束 Consultation，不改 owner 或初始来源。 | 是否构成首次响应 SLA 完成事件留 Batch 4。 | PDM-15 Batch 3 + 用户全部同意确认执行 | 2026-10-06 |
| PDM15-DEC-B3-03 | PDM-15 | P15-B3-03 | 员工侧区分解决、无效、正常关闭三种真实结束语义；终结前重验权限与对象状态；不物理删除历史，不反写 Customer owner / Recommendation / Lock / Transaction。 | 正常关闭最终主状态映射留 Batch 4。 | PDM-15 Batch 3 + 用户全部同意确认执行 | 2026-10-06 |
| PDM15-DEC-B3-04 | PDM-15 | P15-B3-04 | Consultation 创建时消费当时有效 SLA 配置并固化 first-response deadline；后续配置修改不追改旧对象；timeout 只作为派生提醒/标记，不改变主状态。 | 历史默认15分钟及首次真实响应完成条件留 Batch 4；通知投递细节交 PDM-22/23。 | PDM-15 Batch 3 + 用户全部同意确认执行 | 2026-10-06 |
| PDM15-GATE-B3 | PDM-15 | Batch 3 Gate | 用户对 P15-B3-01～P15-B3-04 全部同意并确认执行；Batch 3 Conflict Isolation PASS。 | CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3=0；下一步审查 P15-B4-01～P15-B4-07。 | PDM-15 工作版 Batch 3 + 2026-10-06 用户确认执行 | 2026-10-06 |
| PDM15-DEC-B4-01 | PDM-15 | P15-B4-01 / 1A | Consultation 维持 pending / processing / resolved / invalid 四主状态；客户撤回、正常关闭、正常解决均进入 resolved，并以不可变 close_reason 区分真实结束原因；CANCELLED 不作为第五主状态。 | Current/Low-Fi 的 CANCELLED 只作为旧 Carrier / UI 投影语义，不得反向扩张状态机。 | R7 §§26/38-39 + M06-001 + 用户 1A 并确认执行 | 2026-10-06 |
| PDM15-DEC-B4-02 | PDM-15 | P15-B4-02 / 2A | 首次响应 SLA 只有可审计的真实人工服务动作才能完成；打开、已读、仅改状态、仅转派、浏览资料、系统自动动作均不算；转派不完成也不重置 SLA。 | 继续沿用 Consultation 创建时固化的 first-response deadline。 | DEC-018 / M06-002 + 用户 2A 并确认执行 | 2026-10-06 |
| PDM15-DEC-B4-03 | PDM-15 | P15-B4-03 / 3A | Consultation 首次人工响应 SLA 初始默认 15 分钟，可后台配置；创建时按当时有效配置固化 deadline，后续修改不追改旧对象。 | timeout 继续只产生派生标记/提醒，不改变主状态。 | R12 §13.3 + M06/M17 + 用户 3A 并确认执行 | 2026-10-06 |
| PDM15-DEC-B4-04 | PDM-15 | P15-B4-04 / 4A | 初始负责人按当前合法责任事实：真实来源 Recommendation recommender 仅在当时仍具当前合法业务责任且 Guard 全通过时优先；否则依次 Demand responsible → Customer owner → active+eligible+accepting 接客池；全部不可用时禁止 responsible=null 和 System Admin 业务兜底。 | 历史 recommender 不获得永久 Consultation 承责优先权。 | R7 §33 + PDM-02/03/14 Final + 用户 4A 并确认执行 | 2026-10-06 |
| PDM15-DEC-B4-05 | PDM-15 | P15-B4-05 / 5A | Customer 停用后既有 open Consultation 进入独立 customer_disabled_hold Guard；保留历史/负责人，暂停普通客户侧动作、常规服务推进及未完成首次响应 SLA 计时；合法终结/作废/交接仍可真实收口；恢复账号不自动解除 hold，由合法员工显式恢复，SLA 按剩余时间继续。 | 不新增 Consultation 主状态，不伪造 completed/cancelled。 | PDM-01 Final §11 + 用户 5A 并确认执行 | 2026-10-06 |
| PDM15-DEC-B4-06 | PDM-15 | P15-B4-06 / 6A | Transaction completed/cancelled/corrected 均不自动修改 Consultation 主状态；交易事实只作为上下文，Consultation 结束必须由自身合法真人动作形成并留痕。 | 防止跨对象自动伪造 resolved。 | R10-19 / M06-005 + 用户 6A 并确认执行 | 2026-10-06 |
| PDM15-DEC-B4-07 | PDM-15 | P15-B4-07 / 7A | PDM-15 只冻结 SLA 业务事实与首次响应是否完成；“已超时 > 即将超时 > 新咨询”的员工工作台优先级、即将超时阈值与展示移交 PDM-21。 | 不在 Consultation 生命周期函数内固化工作台 UI 排序。 | R10 工作台历史 + M17 + 用户 7A 并确认执行 | 2026-10-06 |
| PDM15-GATE-B4 | PDM-15 | Batch 4 Gate | 用户选择 1A、2A、3A、4A、5A、6A、7A 并确认执行；PDM15_LOCAL_PRODUCT_CHOICE_UNRESOLVED=0。 | Batch 4 = PASS / USER_APPROVED / APPLIED；下一步执行 Final 前完整性复核。 | PDM-15 工作版 Batch 4 + 2026-10-06 用户确认执行 | 2026-10-06 |
| PDM15-LIA-DEC-01 | PDM-15 | P15-LIA-01 | 补齐 Consultation pending→processing“开始处理”正式动作：仅合法 assignee 或合法管理人员可执行，提交重验 identity+permission+data scope+object state；不改 owner/assignee/source；仅改 processing 本身不算首次真实人工响应；终态不得再次开始处理。 | 不把 processing 当 SLA 首次响应完成事件。 | R7 §26 + VR-E-016 + Current E06/P06-11 + 用户全部同意并确认执行 | 2026-10-06 |
| PDM15-LIA-DEC-02 | PDM-15 | P15-LIA-02 | assignee inactive/离职/失去 permission、scope 或承责资格后立即失去 mutation authority；不自动终结 Consultation；计划性失效先 handover，突发失效进入独立 assignee_handover_pending Guard；新负责人优先当前合法 Customer owner，否则进入合格交接分配；无合法目标时不得 System Admin/null 兜底；保留 old/new assignee、actor、time、context。 | 不新增 Consultation 主状态；不允许 owner 自动漂移 assignee。 | R7 §§34-36 + PDM-02/03 Final + 用户全部同意并确认执行 | 2026-10-06 |
| PDM15-LIA-DEC-03 | PDM-15 | P15-LIA-03 | Customer 已有 owner 时按 P15-B4-04 分配 Consultation assignee；owner_assignment_pending 时必须先形成合法 Customer owner 再创建/复用正式 Consultation；公海 Customer 主动咨询的公海退出/owner 分配由 PDM-17 承接；无法形成合法 owner/服务责任时不创建正式 Consultation。 | 禁止通过 Consultation 绕过 Customer owner/public-pool Authority。 | PDM-01/03 Final + R6 + P15-B4-04 + 用户全部同意并确认执行 | 2026-10-06 |
| PDM15-LIA-DEC-04 | PDM-15 | P15-LIA-04 | 完整 Consultation 内部内容仅向当前 assignee、当前 Customer owner、当前合法范围内有对应能力的经理/店长、以及明确业务 Collaboration scope 允许的协作销售开放；读取时重验当前 Guard；历史 assignee/owner/collaborator 无永久访问权；4S hard DENY；System Admin 身份本身不自动获得业务内容访问；Customer 仅获本人安全投影。 | 能看 Vehicle 不等于能看完整 Consultation。 | R7 §44 + PDM-02/03 Final + P15-A08 + 用户全部同意并确认执行 | 2026-10-06 |
| PDM15-LIA-DEC-05 | PDM-15 | P15-LIA-05 | 正式补齐 PDM-15→PDM-16/17/19/20/21/22/23/25 outgoing handoff，保证 CRM 跟进、公海、Transaction、客户端、员工端、PC/SLA、通知、审计均消费 PDM-15 Authority 而不复制/改写 Consultation 生命周期。 | 后续目标 PDM 不得静默恢复 CANCELLED 第五主状态、假首次响应、自动 Transaction→resolved 等 stale carrier。 | P15-LIA-05 + 用户全部同意并确认执行 | 2026-10-06 |
| PDM15-LIA-GATE | PDM-15 | Pre-Final Repair Gate | P15-LIA-01～P15-LIA-05 全部 USER_APPROVED / APPLIED。 | 允许执行 Final 前完整性复核 R2；不得跳过 Final Overview 用户最终批准。 | PDM-15 R1 + 2026-10-06 用户全部同意并确认执行 | 2026-10-06 |
| PDM15-LIA-DEC-06 | PDM-15 | P15-LIA-06 | Consultation 真人 mutation authority 精确冻结：当前 assignee 可处理自己负责的 open Consultation；经理/店长职位本身不授权，须同时具备对应 Consultation management capability/permission 且 data scope 覆盖；其他普通销售不能仅因能看 Vehicle/Customer/历史关系就修改别人负责的 Consultation；Collaboration 不自动授终结/转派权；转派目标必须 active/eligible/具备业务资格且 scope 合法的名邦 Employee；4S hard DENY；System Admin 身份本身不作为业务 assignee/mutation actor；Customer 自助撤回继续独立服从 P15-B3-01。 | 不改变四主状态、SLA、Customer owner 或 P15-LIA-01～05。 | 9/19 R7 §§36-37 + Phase1.5 D5 + Current E06/P06-11 + 用户“同意，确认执行” | 2026-10-06 |
| PDM15-R2-REPAIR-GATE | PDM-15 | Final 前 R2 Repair Gate | P15-LIA-06 = USER_APPROVED / APPLIED；R2 唯一剩余 Semantic Detail 已关闭。 | 允许执行 Final 前完整性复核 R3。 | PDM-15 R2 + 2026-10-06 用户“同意，确认执行” | 2026-10-06 |
| PDM15-PREFINAL-GATE-R3 | PDM-15 | Final 前完整性复核 R3 | Source→Atom、Atom→Source、Semantic Completeness、Completed-PDM Invariant、Incoming/Outgoing Handoff 全部 PASS；Missing Rule=0；Semantic Detail Gap=0；Cross-PDM Conflict=0；Final Candidate Ready=YES。 | 允许生成 Final Domain Overview 候选；用户最终批准前不得发布 Final/关闭 incoming handoff/进入 PDM-16。 | PDM-15_Final前完整性复核_R3_2026-10-06.md | 2026-10-06 |
| PDM15-GATE-FINAL | PDM-15 | Final Domain Overview | 用户已最终批准 PDM-15《最终完整规则总览》，随后明确确认执行。 | 允许发布正式 Final、关闭 incoming handoff、source backwrite，并推进到 PDM-16 Startup Gate。 | `PDM-15_最终完整规则总览_待用户批准.md` + 2026-10-06 用户最终批准/确认执行 | 2026-10-06 |
| PDM15-FINAL | PDM-15 | Final Closeout | PDM-15 正式发布；31 个规则/裁决单元全部进入 Final；R3 PASS；5/5 incoming handoff CLOSED 并完成 source backwrite；8 条 outgoing handoff 保持 HANDOFF_OPEN。 | `PDM-15 = COMPLETE / INTEGRITY_PASS`；下一步 PDM-16 Startup Gate。 | `PDM-15_最终完整规则.md` + `PDM-15_最终完整性复核_2026-10-06.md` | 2026-10-06 |
| PDM16-STARTUP-20261006 | PDM-16 | Startup Gate / Incoming Handoffs | 已完成全域地图、9/19 R6/R10、001～078 M17/M02/M03、Current carrier、PDM-01/02/03/11/12/15 Final 与 target=PDM-16 handoff 的 Current Authority Refresh；6 条 incoming handoff 全部读取并接收。 | PDM-16 允许进入正式规则重建；6 条 incoming handoff 改为 HANDOFF_ACCEPTED，Final / Integrity closeout 前不得关闭；IA / Low-Fi / Engineering 不施工。 | PDM-16 工作版 §2 + CROSS_PDM_HANDOFF_REGISTER + 2026-10-06 当前仓库证据重建 | 2026-10-06 |
| PDM16-R00 | PDM-16 | Core Direction | CRM 定位为“客户经营资料与统一跟进层”，负责 Profile / CRM Stage / Follow-up / 客户业务概览 / Customer Opportunity / Source Radar；不得重新创造 Customer、Demand、Consultation、Recommendation、Lock、Transaction 状态机，也不得反向改写这些对象的主状态、负责人、资格、权限或历史。 | 公海/Collaboration 完整生命周期归 PDM-17；员工工作台强待办/最终动作编排归 PDM-21；PC 承载归 PDM-22；横向审计归 PDM-25。 | 9/19 R6/R10 + PDM-01/02/03/11/12/15 Final + 2026-10-06 用户“同意”并“确认执行” | 2026-10-06 |
| PDM16-DEC-A01 | PDM-16 | P16-A01 | CRM Stage 是 Customer 总体经营阶段，与 Consultation / Demand / Lock / Transaction 等具体业务状态严格分离；owner / 公海变化不自动重置，“已成交”不永久锁死未来阶段。 | CRM Stage 不反向修改具体业务对象状态。 | 9/19 R6 + M17-001 + 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM16-DEC-A02 | PDM-16 | P16-A02 | CRM Stage mutation 服从当前 Customer owner 或具 CRM 管理 permission/capability 且 data scope 覆盖的授权经理/店长；Collaboration 身份本身不自动授主阶段修改权；提交时重验 identity+permission+scope+object state。 | 历史服务或可见 Customer 不等于可修改 CRM 主阶段。 | 9/19 R6 + PDM-02/03 Final + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-A03 | PDM-16 | P16-A03 | CRM Follow-up 长期保留并 append-only；owner / 公海变化不得删除或重置；错误记录通过更正记录或合法无效/作废表达，原始内容、actor、time 保留。 | 禁止物理删除 / 覆盖历史跟进。 | 9/19 R6 + M17-001 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-A04 | PDM-16 | P16-A04 | Demand / Consultation 等统一使用 CRM Follow-up 关联具体 business context；不得复制第二套业务状态机；普通 CRM Follow-up 不自动完成 Consultation first-response SLA，只有满足 PDM-15 可审计真实人工服务条件的事实才可完成 SLA。 | CRM Follow-up 不反向改 Demand / Consultation / Recommendation / Lock / Transaction 主状态。 | PDM-11/15 Final + HO-P11/P15-P16 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-A05 | PDM-16 | P16-A05 | Personal Note、Shared Profile、员工内部客户称呼历史严格分层：Personal Note 作者私有且 owner 变化不转移；Shared Profile 是共享画像并审计 before/after；员工内部称呼与客户本人昵称/Personal Note/Shared Profile 分离，保留作者/时间/来源，交接后向当前合法服务者可见但不产生历史作者永久访问权。 | 不恢复大字段 CRM 模型。 | Phase1.5 D3 + PDM-01 Final + M02-005/M17-001 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-A06 | PDM-16 | P16-A06 | Customer Tags / CRM Stage / source / 历史 Follow-up 属于 Customer 共享经营事实，不因 owner 变化、进入公海或重新领取自动清空；个人私有备注不得冒充 shared tag。 | 当前合法服务者可新增共享事实，但不得覆盖历史来源。 | 9/19 R6 + M17-001 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-A07 | PDM-16 | P16-A07 | CRM Customer Detail 可以聚合 Level、entitlement、Application、Demand、Consultation、Recommendation、Lock/Waitlist、Transaction/Refund、owner、tag、follow-up 等当前/历史概览，但只消费真实业务对象事实，不复制/反向改写其状态机。 | Customer Merge 已由 PDM-01 Final 取消，不得借 CRM 聚合恢复业务迁移。 | R10 + PDM-01/11/15 Final + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-A08 | PDM-16 | P16-A08 | 完整 CRM 当前访问权按当前 identity、permission/capability、data scope、owner/Collaboration/manager scope、object/account state 计算；正式移交后原 owner 默认失去当前完整访问，历史服务不产生永久访问；4S hard DENY，System Admin 身份本身不自动获得员工 CRM 业务访问权。 | 公司客户历史长期保留，访问权不是永久历史属性。 | PDM-02/03 Final + M17-001/M02-005 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-A09 | PDM-16 | P16-A09 | CRM 最近行为 / 兴趣只展示最小必要聚合事实（如收藏数量、聚合品牌/车系兴趣、业务机会摘要、必要活跃概览），默认不开放逐点击流水、完整浏览轨迹或完整收藏明细。 | 不影响底层合法安全/业务日志留存；CRM 业务投影保持聚合。 | R10 + M17-001 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-A10 | PDM-16 | P16-A10 | Customer Opportunity 是确定性聚合兴趣/机会信号，不是 Consultation、独立 task、独立负责人或 SLA 对象；不建复杂 lifecycle、独立 owner、关闭主状态或逐条飞书；条件不再命中时从当前机会自然消失，必要去重/冷却/历史事实可审计；V1 不做 AI 意向评分。 | 旧具体 7d/40/3d 触发器留 Batch 2 明确废弃。 | R10-24 + M02-004/M17-002 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-A11 | PDM-16 | P16-A11 | Source Radar 以 active Demand / 当前客户服务上下文为中心，只消费 PDM-12 Matching change fact；可形成新上架/关键变化/潜在匹配 Radar Event；推荐仍进入 PDM-14，标记不适合不得伪造 PDM-12 Match Result；不得重建 Rule Dictionary / parser / Matching Engine。 | PDM-12 是唯一 Matching Authority。 | PDM-12 Final §31 + HO-P12-P16-001 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-A12 | PDM-16 | P16-A12 | Customer Opportunity、Source Radar、今日必须处理/紧急强待办三类语义严格分离；PDM-16 只冻结对象语义与数据边界，员工工作台排序、入口、卡片和强待办优先级由 PDM-21 承载。 | 禁止把三类对象合并成同一个 task/state system。 | R10-24 + M17-002 + 用户确认执行 | 2026-10-06 |
| PDM16-GATE-B1 | PDM-16 | Batch 1 Gate | 用户对 P16-A01～P16-A12 明确“全部同意”，随后“确认执行”；12 条稳定一致规则正式进入 PDM-16 当前工作 Authority。 | 下一步进入 Batch 2 明确废弃 / supersession / DO_NOT_RESTORE 审查；6 条 incoming handoff 继续 HANDOFF_ACCEPTED；IA/Low-Fi/Engineering 不施工。 | PDM-16 工作版 Batch 1 + 2026-10-06 用户确认执行 | 2026-10-06 |
| PDM16-DEC-B2-01 | PDM-16 | P16-B2-01 | V1 完全取消 Customer Merge；P06-01/P06-M01 及 MERGE_* carrier 不得恢复。 | CRM 不提供自动/人工/手机号/自然人确认后的 Customer Merge，也不迁移 owner/source/Level/Recommendation/Consultation/Demand/Lock/Transaction/CRM history。 | PDM-01 Final + 用户“全部同意确认执行” | 2026-10-06 |
| PDM16-DEC-B2-02 | PDM-16 | P16-B2-02 | CRM 客户详情“锁车→再选车辆”的旧入口不得恢复。 | Lock/LockRequest 必须在合法 Customer+Vehicle 上下文进入 PDM-18；CRM 只展示概览，不复制 Lock 状态机。 | R10 + 后续 Lock 模型 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-B2-03 | PDM-16 | P16-B2-03 | 旧 7 天无活动、单日 >40 次、连续 3 天浏览等 Customer Opportunity 具体阈值及对应配置不得恢复。 | 保留聚合机会能力；未来新机会规则必须有新的明确 Authority。 | Phase1.5 DP-01 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-B2-04 | PDM-16 | P16-B2-04 | 历史“大字段 CRM 画像模型”不得恢复；Personal Note / Shared Profile / Tags / 内部称呼 / Follow-up / CRM Stage 保持分层。 | owner 变化时不得把 Personal Note 当 Shared Profile 转移。 | Phase1.5 D3/DP-02 + P16-A05 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-B2-05 | PDM-16 | P16-B2-05 | “历史服务过 = 永久 CRM 访问权”不得恢复。 | 访问始终按当前 identity+permission/capability+scope+owner/collaboration/manager scope+object/account state。 | PDM-02/03 Final + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-B2-06 | PDM-16 | P16-B2-06 | P06-07“客户机会规则”页面壳不得反推出未授权 CRUD/config/transition 或旧阈值配置。 | 页面存在不等于产品能力已授权；新可配置机会规则必须另有明确裁决。 | Current carrier + DP-01 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-B2-07 | PDM-16 | P16-B2-07 | Customer Opportunity 不得恢复成独立工单、强待办、assignee、复杂 lifecycle、SLA 或逐条飞书对象。 | 强待办由真实业务对象驱动并由 PDM-21 编排。 | R10-24 + M02-004/M17-002 + 用户确认执行 | 2026-10-06 |
| PDM16-GATE-B2 | PDM-16 | Batch 2 Gate | 用户对 P16-B2-01～P16-B2-07 明确“全部同意确认执行”；Reverse Conflict Scan PASS，FALSE_DEPRECATION_COUNT=0。 | 当前 Opportunity/CRM Stage/Tags/Follow-up/Shared Profile/Source Radar 等合法能力均未被误废弃；下一步进入 Batch 3。 | PDM-16 工作版 Batch 2 + 2026-10-06 用户确认执行 | 2026-10-06 |
| PDM16-DEC-B3-01 | PDM-16 | P16-B3-01 | 补齐 CRM Follow-up 正式 mutation 闭环：合法 Customer/business context → 填写 → submit-time Guard → append 新 Follow-up → 成功进入时间线；错误记录通过更正/作废保留原始事实，失败不生成半成功记录。 | Follow-up 至少记录 customer_id、actor、时间、内容与可选业务关联；不因失败改 CRM Stage 或其他业务对象。 | R6 §§32-33 + M17-001 + 用户全部同意并确认执行 | 2026-10-06 |
| PDM16-DEC-B3-02 | PDM-16 | P16-B3-02 | 恢复员工内部客户称呼历史对象语义：保留作者、时间、来源；交接后当前合法服务者可见并可新增自己的称呼，不覆盖旧称呼；客户本人不可见。 | 原作者失去当前 CRM 权限后不因历史称呼继续拥有 Customer 访问权。 | DEC-034/036 + M02-005 + PDM-01/03 Final + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-B3-03 | PDM-16 | P16-B3-03 | 恢复 CRM 客户列表真实搜索/筛选与我的客户/团队客户视角；手机号搜索继承 PDM-01，多业务筛选只消费当前真实业务事实。 | 团队视角仍受 manager permission + data scope；列表不堆叠大量跨域 mutation。 | R10 + M17-001 + PDM-01/02 Final + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-B3-04 | PDM-16 | P16-B3-04 | CRM Customer Detail 恢复六区块：基础资料、当前业务、快捷操作、跟进时间线、历史业务、最近行为/兴趣；快捷操作保留记录跟进、找车服务、推荐车辆等合法入口，不恢复纯 CRM 直接锁车。 | 跨域入口携带已知 Customer context，但具体状态机仍归对应 PDM。 | R10 + M17-001 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-B3-05 | PDM-16 | P16-B3-05 | Customer Opportunity 只基于当前可解释确定性事实形成聚合信号；匿名访客不生成具名机会；heartbeat/token refresh/后台轮询/员工代操作不冒充客户主动兴趣；相同信号可去重/冷却，条件失效自然消失；不逐条飞书、不做 AI 意向评分。 | 本条不发明新的机会阈值/算法。 | R10-24 + M02-004/M17-002 + 用户确认执行 | 2026-10-06 |
| PDM16-DEC-B3-06 | PDM-16 | P16-B3-06 | Source Radar 补齐事件消费与人工处理闭环：消费 PDM-12 current Matching change fact，保留 Demand/Customer/Vehicle/trigger/current Match 引用；员工可查看、进入 Recommendation、标记本次 Radar 不适合；该标记不得改 Match Result/Rule Dictionary/Demand 条件。 | Radar 失效/消失不自动创建 Recommendation/Priority/Lock，历史事件可追溯。 | R10-24 + PDM-12 Final + HO-P12-P16-001 + 用户确认执行 | 2026-10-06 |
| PDM16-GATE-B3 | PDM-16 | Batch 3 Gate | 用户对 P16-B3-01～P16-B3-06 全部同意并确认执行；Conflict Isolation PASS，CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3=0。 | 完整性回查另发现 2 条明确历史规则未完整承接，先进入 P16-B3-R01～R02 Repair，Batch 4 暂不开始。 | PDM-16 工作版 Batch 3 + 2026-10-06 用户确认执行 | 2026-10-06 |
| PDM16-B3-REPAIR-01 | PDM-16 | P16-B3-R01 | 未完成 CRM 跟进任务、回访提醒、未来跟进计划属于尚未完成的服务责任；owner 变化时必须交接给新 owner 或由有权限管理人员重新指定合法负责人；已完成历史待办不回写。 | Follow-up 历史与未来责任分离；进入公海前的完成、取消、交接治理交 PDM-17。 | 9/19 R6 §35 / R6-43~44 + M17-001 + 用户全部同意确认执行 | 2026-10-06 |
| PDM16-B3-REPAIR-02 | PDM-16 | P16-B3-R02 | “暂不联系 / 暂无意向”只表达 CRM Stage / Tag / 服务判断，不自动结束 Customer、不清 owner、不自动进公海，也不自动取消其他独立业务对象。 | 可作为待公海人工判断上下文；后续真实需求可合法更新，不永久锁死。 | 9/19 R6 §37 / R6-52 + 用户全部同意确认执行 | 2026-10-06 |
| PDM16-B3-REPAIR-GATE | PDM-16 | Batch 3 Completeness Repair Gate | P16-B3-R01～R02 全部 USER_APPROVED / APPLIED；BATCH_3_COMPLETENESS_GAP=0。 | 允许进入 Batch 4 冲突 / 遗漏 / 新产品选择重建。 | PDM-16 工作版 + 2026-10-06 用户确认执行 | 2026-10-06 |
| PDM16-DEC-B4-01 | PDM-16 | P16-B4-01 | CRM Stage 采用公司级受控可配置阶段字典；默认可预置常用阶段；可新增、改名/排序、启停；历史已使用阶段不得普通物理删除；销售不得自由文本冒充正式 Stage。 | 具体 PC 配置 carrier、permission、审计交 PDM-22 / PDM-25。 | 用户选择 1A 并确认执行 | 2026-10-06 |
| PDM16-DEC-B4-02 | PDM-16 | P16-B4-02 | CRM Stage 默认只允许合法 actor 显式人工修改；Consultation / Demand / Lock / Transaction 等业务事件只提供上下文或提示，不自动改写 CRM Stage。 | 新 Customer 可使用默认初始阶段；避免跨状态机耦合。 | 用户选择 2A 并确认执行 | 2026-10-06 |
| PDM16-DEC-B4-03 | PDM-16 | P16-B4-03 | Customer Tags 采用公司级受控 Tag 字典 + Customer 多选；Tag 可新增、改名/排序、启停；历史 Tag 不普通物理删除；重点客户等作为普通共享 Tag，不创建第二套状态机。 | 自由文本继续进入 Personal Note / 服务称呼等对应区域。 | 用户选择 3A 并确认执行 | 2026-10-06 |
| PDM16-DEC-B4-04 | PDM-16 | P16-B4-04 | V1 不建设通用 Customer Opportunity 规则引擎；Opportunity 只消费未来经产品明确批准的 deterministic signal producer；无正式 signal producer 时允许真实空态；P06-07 不提供任意规则 CRUD/config。 | 不恢复旧 7d / 40 / 3d 阈值，不用 AI 意向评分补空缺。 | 用户选择 4A 并确认执行 | 2026-10-06 |
| PDM16-DEC-B4-05 | PDM-16 | P16-B4-05 | Source Radar“标记不适合”抑制当前 Demand×Vehicle 的当前有效匹配事实；相同事实不重复刷 Radar；当 Vehicle/Demand/价格/Rule Dictionary/Match tier-explanation/listing_cycle 等触发合法重算的实质输入变化后可重新生成 Radar Event。 | 不改变 PDM-12 Match Result，不形成永久黑名单；历史人工处理保留。 | 用户选择 5A 并确认执行 | 2026-10-06 |
| PDM16-GATE-B4 | PDM-16 | Batch 4 Gate | 用户选择 1A、2A、3A、4A、5A 并确认执行；P16-B4-01～05 正式进入当前工作 Authority；Cross-PDM Conflict Review PASS；PDM16_LOCAL_PRODUCT_CHOICE_UNRESOLVED=0。 | 下一步进入 Final 前完整性复核；incoming handoff 继续 HANDOFF_ACCEPTED。 | PDM-16 工作版 + 用户确认执行 | 2026-10-06 |
| PDM16-LIA-01 | PDM-16 | Final前修复 | CRM Stage、重要 Customer Tag、Shared Profile、员工内部服务称呼、Follow-up 的核心 mutation audit 边界正式补齐；Stage 记录 before/after/actor/time，重要 Tag 记录等价可追溯变化事实，服务称呼不得覆盖旧历史，Follow-up 保持 append-only。 | 普通日常非核心字段不因此一律升级为重型审计。 | 9/19 R6 §41 + PDM-16 R1 + 用户全部同意并确认执行 | 2026-10-06 |
| PDM16-LIA-02 | PDM-16 | Final前修复 | CRM Customer list 在合法 Customer Address 字段存在时支持地址搜索；Customer 卡片可展示必要地址/内部备注摘要；只消费当前合法 Customer Profile 已有地址事实，不新增地址采集流程。 | 搜索/展示继续受 permission+data scope+object/account state；internal note 保持分层。 | 9/19 R10-15 + PDM-16 R1 + 用户全部同意并确认执行 | 2026-10-06 |
| PDM16-LIA-03 | PDM-16 | Final前修复 | 正式登记 PDM-16→PDM-17/21/22/23/25 outgoing handoff，全部 HANDOFF_OPEN。 | PDM-16 不提前替目标域决定 UI、通知、公海、配置 carrier 或统一审计实现。 | PDM-16 R1 + 用户全部同意并确认执行 | 2026-10-06 |
| PDM16-GATE-PREFINAL-R1-REPAIR | PDM-16 | Final前修复门禁 | 用户对 P16-LIA-01～P16-LIA-03 全部同意并确认执行；R1 repair 已应用。 | 下一步执行 Final 前完整性复核 R2。 | PDM-16 工作版 + 2026-10-06 用户确认执行 | 2026-10-06 |
| PDM16-PREFINAL-R2 | PDM-16 | Final前完整性复核 R2 | Source→Atom / Atom→Source / Semantic Completeness / completed-PDM invariant / incoming+outgoing handoff 全部 PASS；Missing Rule=0；Semantic Detail Gap=0；Local Product Choice=0；PDM16_FINAL_CANDIDATE_READY=YES。 | 已生成 Final Domain Overview 候选；用户最终批准前不得 Final closeout。 | 07_重建工作区/PDM-16_Final前完整性复核_R2_2026-10-06.md | 2026-10-06 |
| PDM16-FINAL-APPROVAL | PDM-16 | Final Domain Overview | 用户对 PDM-16 Final Domain Overview 明确“最终批准”。 | 只记录最终产品批准；等待后续明确执行授权后才允许 Final closeout。 | 2026-10-06 用户“最终批准” | 2026-10-06 |
| PDM16-FINAL-CLOSEOUT | PDM-16 | Final Closeout | 用户随后明确“确认执行”；正式发布 PDM-16 Final，Final Integrity PASS；6/6 incoming handoff CLOSED 且 6/6 source backwrite DONE；5 条 outgoing handoff 保持 OPEN。 | PDM-16 = COMPLETE / INTEGRITY_PASS；下一步 PDM-17 Startup Gate。 | PDM-16 Final + Final Integrity + Handoff Register | 2026-10-06 |
| PDM17-STARTUP-20261006 | PDM-17 | Startup Gate / Incoming Handoffs | 已完成全域地图、9/19 R6/R10/R12、001～078 M02/M17、Current E08/E08-01/P06-03/04/05、PDM-02/03/11/13/15/16 Final 与 target=PDM-17 handoff 的 Current Authority Refresh；6 条 incoming handoff 全部读取并接收。 | PDM-17 允许进入正式规则重建；6 条 incoming handoff 改为 HANDOFF_ACCEPTED，Final / Integrity closeout 前不得关闭；IA / Low-Fi / Engineering 不施工。 | PDM-17 Startup Gate 工作版 + CROSS_PDM_HANDOFF_REGISTER + 2026-10-06 用户“确认执行” | 2026-10-06 |
| PDM17-R00 | PDM-17 | Core Direction | PDM-17 是“公海治理与 Collaboration（协作关系）”业务 Authority：负责待公海处理、人工判断、进入/退出公海、领取、指定分配、主动人工服务触发 owner 分配、再次释放，以及 Collaboration 建立/范围/结束。 | 不重新创造 Customer / CRM / Demand / Priority / Consultation / Recommendation / Lock / Transaction 第二套状态机；这些对象只提供当前真实保护事实、责任与 Guard，PDM-17 不得为了进公海静默改写其主状态、负责人或历史；系统可发现候选/提醒/限制，但不能仅因长期未联系、暂无意向、跟进超时或 Opportunity 命中自动抢走 owner。 | 9/19 R6/R10/R12 + PDM-02/03/11/13/15/16 Final + 2026-10-06 用户确认执行 | 2026-10-06 |
| PDM17-DEC-A01 | PDM-17 | P17-A01 | Customer 公海状态继续服从唯一 current owner；进入公海后 current owner 为空但历史 owner 保留，领取/指定分配后只形成一个新的 current owner；Collaboration/历史 owner/source 不得冒充第二 owner。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §§3/12/13 + PDM-03 Final + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A02 | PDM-17 | P17-A02 | 长期未登录、暂无意向、暂不联系、跟进超期、长期未联系、关闭接客、短期休假、已购车、Opportunity 命中等事实本身均不得自动把 Customer 抢入公海；系统只能产生候选/提醒。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §4/§37 + PDM-16 Final + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A03 | PDM-17 | P17-A03 | 进入公海必须来自合法明确动作：owner 主动释放、授权管理处理、inactive/离职后的责任治理、待公海人工确认等；提交时重验 actor/permission/scope/Customer/owner/保护事实。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §4 + PDM-02/03 Final + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A04 | PDM-17 | P17-A04 | 待公海处理是人工治理层，不直接改 owner；合法处理结果为进入公海、继续当前 owner、直接移交其他合法 owner；继续当前后记录结果并可按有效规则再次生成候选。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §5 + R12 + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A05 | PDM-17 | P17-A05 | pending Application、active/paused Demand、active Priority、open Consultation、Lock/Waitlist、in-progress Transaction、未完成 CRM 任务/回访/未来计划等真实责任存在时不得直接丢公海；先完成、取消或正式交接。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §6 + PDM-11/13/15/16 handoff + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A06 | PDM-17 | P17-A06 | 公海继续受门店/服务范围/data scope 隔离；领取/分配/治理统一按 identity+permission/capability+data scope+object/account state；4S 不领取名邦公海 Customer，不做 Customer-level collaborator；System Admin 控制平面身份不成为业务 owner/claimant/collaborator。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §§7/39 + PDM-02 Final + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A07 | PDM-17 | P17-A07 | 合法领取成功即退出公海并由 claimant 成为唯一 current owner；不增加待确认领取主状态；提交时重验，竞争领取只允许一个成功；原 owner 无历史优先权。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §8 + M02-003 + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A08 | PDM-17 | P17-A08 | 关闭 accepting 只退出自然轮询，不自动禁止 active+eligible 且具合法领取能力/scope 的员工主动领取公海 Customer；自然接客资格与主动领取资格分离。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §8 + PDM-02/03 Final + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A09 | PDM-17 | P17-A09 | 后台可配置主动领取数量上限与频率限制；达到限制只阻止继续领取，不自动收回已形成 owner 的 Customer，不改历史；PC 配置 carrier 交 PDM-22。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §9 + R12 + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A10 | PDM-17 | P17-A10 | 公海 Customer 主动发起 Consultation/找车等真人服务时，无需先手工领取；先按合法接客规则形成唯一 owner 并退出公海，再由对应 PDM 建业务对象；无合法承接人时进入 owner_assignment_pending/安全失败，不建 responsible=null。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §10 + PDM-02/11/15 Final + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A11 | PDM-17 | P17-A11 | 具合法 assignment permission/capability + data scope 的员工可直接指定公海 Customer 给 active+eligible 合法目标；成功即退出公海并形成唯一 owner，无需目标二次确认；提交时重验并保留完整可追溯事实。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §14 + PDM-02 Final + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A12 | PDM-17 | P17-A12 | 领取/分配后的 Customer 可再次释放，但仍须先完成/取消/交接未完成业务、CRM 待办及其他保护事实；重新进入形成新一轮历史，不覆盖旧轮次。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §16 + PDM-16 Final + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A13 | PDM-17 | P17-A13 | 公海进出/领取/分配不得清空 customer_id、source、referral、历史 owner、CRM Stage/Tags/Shared Profile/Follow-up、业务历史、Collaboration 与每轮公海历史；原 owner 不因历史服务永久保留当前完整访问权。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §§12/13/32/36 + PDM-03/16 Final + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A14 | PDM-17 | P17-A14 | Collaboration 只表示参与服务，不等于 owner 或万能授权；权限由 collaboration scope + 自身 permission/capability + data scope + object state 共同计算，不能自动获得敏感信息/价格/owner修改/资金类能力。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §§18/19 + PDM-02/03/15/16 Final + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-DEC-A15 | PDM-17 | P17-A15 | Collaboration 由 current owner 或合法授权管理者建立/移除；collaborator 不得凭协作者身份继续邀请；优先具体业务级，确需长期才客户级；业务终态、owner变化、inactive/离职等按规则结束，撤权即时，历史保留，重新参与新建关系。 | 稳定一致规则；不得被 Current/IA 压缩语义反向覆盖。 | 9/19 R6 §§20～27 + Current P06-03/04 + PDM-02/03/15/16 Final + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-GATE-B1 | PDM-17 | Batch 1 Gate | 用户对 P17-A01～P17-A15 明确“全部同意”，随后“确认执行”；15 条稳定一致规则正式进入 PDM-17 当前工作 Authority。 | Batch 2 Reverse Conflict Scan PASS / FALSE_DEPRECATION_COUNT=0；6 条 incoming handoff 继续 HANDOFF_ACCEPTED；IA/Low-Fi/Engineering 不施工。 | PDM-17 工作版 Batch 1 + 2026-10-06 用户确认执行 | 2026-10-06 |
| PDM17-DEC-B2-01 | PDM-17 | P17-B2-01 | V1 已取消 Customer Merge，因此所有依赖“合并 Customer 后再迁移/合并 public-pool membership、owner、Collaboration、CRM 历史”的旧规则均 SUPERSEDED / DO_NOT_RESTORE。 | 明确废弃 / superseded / DO_NOT_RESTORE；不删除对应仍合法的当前能力。 | PDM-01 Final + 9/19 R6 历史 merge×public-pool 条款 + 2026-10-06 用户“全部同意”并以“真执行”授权 | 2026-10-06 |
| PDM17-DEC-B2-02 | PDM-17 | P17-B2-02 | 废弃“经理/店长职位名称本身自动获得全部公海治理权限”的硬编码；当前统一按 identity + permission/capability + data scope + object/account state 计算。 | 明确废弃 / superseded / DO_NOT_RESTORE；不删除对应仍合法的当前能力。 | PDM-02 Final + P17-A03/A06/A11/A15 + 2026-10-06 用户“全部同意”并以“真执行”授权 | 2026-10-06 |
| PDM17-DEC-B2-03 | PDM-17 | P17-B2-03 | System Admin 控制平面身份不得直接领取公海 Customer、成为业务 owner/Customer-level collaborator、接客池兜底 owner 或仅凭后台身份执行销售/CRM/Consultation 业务动作。 | 明确废弃 / superseded / DO_NOT_RESTORE；不删除对应仍合法的当前能力。 | PDM-02 Final §6 + PDM-03 + P17-A06/A10 + 2026-10-06 用户“全部同意”并以“真执行”授权 | 2026-10-06 |
| PDM17-DEC-B2-04 | PDM-17 | P17-B2-04 | 分享/转介绍不得绕过公海治理恢复历史 owner、让最后分享销售抢客或覆盖公海/既有 owner；来源历史可保留，owner 变化必须走正式 Authority。 | 明确废弃 / superseded / DO_NOT_RESTORE；不删除对应仍合法的当前能力。 | PDM-03 Final + HO-P03-P17-001 + P17-A01/A10/A11/A13 + 2026-10-06 用户“全部同意”并以“真执行”授权 | 2026-10-06 |
| PDM17-GATE-B2 | PDM-17 | Batch 2 Gate | 用户对 P17-B2-01～P17-B2-04 全部同意并明确执行；4 条废弃/替代规则正式进入当前 Authority。 | Reverse Conflict Scan PASS；FALSE_DEPRECATION_COUNT=0；Batch 3 later-change scan 未发现新的独立 Atom。 | PDM-17 工作版 + 2026-10-06 用户执行授权 | 2026-10-06 |
| PDM17-SCAN-B3 | PDM-17 | Batch 3 明确新增/变更扫描 | 6 条 incoming handoff 的 later additions 已全部被 P17-A02/A05/A06/A10/A11/A13/A15 及 B2-04 吸收；未形成新的独立规则原子。 | NEW_INDEPENDENT_ATOMS=0；DUPLICATE_RULE_CREATION=0；MISCLASSIFIED_PRODUCT_CHOICE=0；等待用户审查“无新增项”结论。 | CROSS_PDM_HANDOFF_REGISTER + PDM-17 当前工作版 | 2026-10-06 |
| PDM17-GATE-B3 | PDM-17 | Batch 3 Gate | 用户同意 Batch 3“无新增独立规则原子”结论并确认执行；Batch 3 正式 PASS / USER_APPROVED / APPLIED。 | NEW_INDEPENDENT_ATOMS=0；DUPLICATE_RULE_CREATION=0；MISCLASSIFIED_PRODUCT_CHOICE=0；允许进入 Batch 4，但不得自动批准 Batch 4。 | PDM-17 工作版 + 2026-10-06 用户“同意”及“确认执行” | 2026-10-06 |
| PDM17-SCAN-B4 | PDM-17 | Batch 4 冲突/遗漏扫描 | 历史 R6、001～078 与当前已批准 PDM-17 反查形成 9 个待裁决项：运营主路径、长期未跟进三条件候选、候选/复查配置值、领取限制口径、首次跟进提醒时长、批量治理、原因必填、Collaboration scope 层级、领取前敏感字段可见性。 | 当前仅登记候选，不构成产品批准；6 条 incoming handoff 保持 HANDOFF_ACCEPTED；IA/Low-Fi/Engineering 不施工。 | R6 + 001～078 + PDM-17 当前工作版 | 2026-10-06 |
| PDM17-DEC-B4-01 | PDM-17 | P17-B4-01 / 1A | 后台指定分配/待公海人工治理为主；主动领取保留为弱化、可配置能力。 | 用户选择 A；当前 Authority 生效。 | 2026-10-06 用户 1A～9A 并确认执行 | 2026-10-06 |
| PDM17-DEC-B4-02 | PDM-17 | P17-B4-02 / 2A | 恢复长期未真实跟进三条件 AND 人工候选；只生成候选，不自动进公海/改 owner/飞书。 | 用户选择 A；当前 Authority 生效。 | 2026-10-06 用户 1A～9A 并确认执行 | 2026-10-06 |
| PDM17-DEC-B4-03 | PDM-17 | P17-B4-03 / 3A | 候选条件与重新检查周期可配置；PDM-17 不写死默认数值。 | 用户选择 A；当前 Authority 生效。 | 2026-10-06 用户 1A～9A 并确认执行 | 2026-10-06 |
| PDM17-DEC-B4-04 | PDM-17 | P17-B4-04 / 4A | 领取数量上限与频率限制可配置；不写死数字/窗口，不自动收回已形成 owner。 | 用户选择 A；当前 Authority 生效。 | 2026-10-06 用户 1A～9A 并确认执行 | 2026-10-06 |
| PDM17-DEC-B4-05 | PDM-17 | P17-B4-05 / 5A | 首次跟进提醒时间可配置；超时只提醒，不自动收回/进公海。 | 用户选择 A；当前 Authority 生效。 | 2026-10-06 用户 1A～9A 并确认执行 | 2026-10-06 |
| PDM17-DEC-B4-06 | PDM-17 | P17-B4-06 / 6A | 保留批量公海治理；逐 Customer 重验，允许 partial success，返回逐项结果。 | 用户选择 A；当前 Authority 生效。 | 2026-10-06 用户 1A～9A 并确认执行 | 2026-10-06 |
| PDM17-DEC-B4-07 | PDM-17 | P17-B4-07 / 7A | 原因/备注默认可选；核心变化 before/after/actor/time 必须审计。 | 用户选择 A；当前 Authority 生效。 | 2026-10-06 用户 1A～9A 并确认执行 | 2026-10-06 |
| PDM17-DEC-B4-08 | PDM-17 | P17-B4-08 / 8A | Collaboration 只保留具体业务级与 Customer-level 两层 scope，不再造第二套权限系统。 | 用户选择 A；当前 Authority 生效。 | 2026-10-06 用户 1A～9A 并确认执行 | 2026-10-06 |
| PDM17-DEC-B4-09 | PDM-17 | P17-B4-09 / 9A | 普通 claimant 领取前只看最小必要摘要；手机号等敏感字段默认隐藏。 | 用户选择 A；当前 Authority 生效。 | 2026-10-06 用户 1A～9A 并确认执行 | 2026-10-06 |
| PDM17-GATE-B4 | PDM-17 | Batch 4 Gate | P17-B4-01～P17-B4-09 全部按 A 批准并执行；Local Product Choice Unresolved=0。 | 允许进入 Final 前完整性复核；不代表 Final Ready。 | 2026-10-06 用户确认执行 | 2026-10-06 |
| PDM17-PREFINAL-R1 | PDM-17 | Final前完整性复核 R1 | 结论 REPAIR_REQUIRED；发现 P17-LIA-01～P17-LIA-05。 | completed-PDM hard conflict=0；incoming handoff gap=0；Local Product Choice=0；存在语义细节、outgoing handoff 与 stale carrier 登记缺口，修复前不得进入 R2 / Final Overview。 | 07_重建工作区/PDM-17_Final前完整性复核_R1_2026-10-06.md | 2026-10-06 |
| PDM17-LIA-01 | PDM-17 | P17-LIA-01 | 原 owner 若当前仍 active+eligible、具领取 permission/capability、data scope 覆盖、未触发领取限制且 Customer 仍可领取，可与其他 claimant 一样重新领取；无历史优先权。 | Final 前 R1 修复；进入 R2 前必须生效。 | 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-LIA-02 | PDM-17 | P17-LIA-02 | 正式进入公海成功视为 owner→null 的正式 owner 变化；旧 Customer-level Collaboration 立即结束；未完成业务级 Collaboration 必须先完成/取消/交接，否则 A05 阻止入公海；历史保留。 | Final 前 R1 修复；进入 R2 前必须生效。 | 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-LIA-03 | PDM-17 | P17-LIA-03 | 合法 collaborator 可在明确 Collaboration scope 内新增 CRM Follow-up、处理被授权具体业务，并继续受自身 permission/capability + data scope + object/account state 约束；不自动获得主阶段/owner/source/敏感价/资金交易纠错等能力。 | Final 前 R1 修复；进入 R2 前必须生效。 | 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-LIA-04 | PDM-17 | P17-LIA-04 | 正式进出公海、主动领取、后台指定分配/owner transfer、继续当前 owner 确认、Collaboration 新增/移除/scope 变化至少审计 before/after/actor/time；reason/note 可选。 | Final 前 R1 修复；进入 R2 前必须生效。 | 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-LIA-05 | PDM-17 | P17-LIA-05 | 登记 PDM-17→PDM-18/19/21/22/23/25 六条 HANDOFF_OPEN；登记 P06-05 指定分配二次确认旧 Low-Fi 为 CARRIER_DEFERRED，不在 PDM-17 修改 IA/Low-Fi。 | Final 前 R1 修复；进入 R2 前必须生效。 | 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM17-LIA-GATE-R1 | PDM-17 | Pre-Final Repair R1 Gate | P17-LIA-01～P17-LIA-05 全部用户批准并执行。 | incoming 6/6 保持 HANDOFF_ACCEPTED；outgoing 6/6 HANDOFF_OPEN；stale carrier 已登记；允许执行 Pre-Final R2。 | 2026-10-06 用户确认执行 | 2026-10-06 |
| PDM17-PREFINAL-R2 | PDM-17 | Final前完整性复核 R2 | P17-LIA-01～P17-LIA-05 全部关闭后重新执行完整性复核，结论 PASS / FINAL_CANDIDATE_READY。 | SOURCE_TO_ATOM=PASS；ATOM_TO_SOURCE=PASS；SEMANTIC_COMPLETENESS=PASS；MISSING_RULE_UNRESOLVED=0；SEMANTIC_DETAIL_GAP_UNRESOLVED=0；COMPLETED_PDM_INVARIANT_CONFLICT=0；INCOMING_HANDOFF_GAP=0；OUTGOING_HANDOFF_GAP=0；NEGATIVE_CLAIMS_VERIFIED=PASS；Local Product Choice=0。 | 07_重建工作区/PDM-17_Final前完整性复核_R2_2026-10-06.md | 2026-10-06 |
| PDM17-FINAL-OVERVIEW-CANDIDATE | PDM-17 | Final Domain Overview | 已生成 PDM-17 最终完整规则总览候选，当前仅等待用户最终批准。 | 批准前不得发布 Final、关闭 incoming handoff、source backwrite 或进入 PDM-18。 | 07_重建工作区/PDM-17_最终完整规则总览_待用户批准.md | 2026-10-06 |

| PDM17-FINAL-APPROVAL | PDM-17 | Final Domain Overview | 用户对 PDM-17 Final Domain Overview 明确“最终批准”。 | 只记录最终产品批准；等待后续明确执行授权后才允许 Final closeout。 | 2026-10-06 用户“最终批准” | 2026-10-06 |
| PDM17-FINAL-CLOSEOUT | PDM-17 | Final Closeout | 用户随后明确“确认执行”；正式发布 PDM-17 Final，Final Integrity PASS；6/6 incoming handoff CLOSED 且 6/6 source backwrite DONE；6 条 outgoing handoff 保持 OPEN。 | PDM-17 = COMPLETE / INTEGRITY_PASS；下一步 PDM-18 Startup Gate。 | PDM-17 Final + Final Integrity + Handoff Register | 2026-10-06 |

| PDM18-CORE-R00 | PDM-18 | P18-R00 | PDM-18 定位为 LockRequest / 正式 Lock / Waitlist 以及延期、释放、到期、责任交接的唯一业务 Authority；Deposit / Transaction / Refund / 换车继续由 PDM-19 承接。 | 用户批准核心定位；不得用旧“我要这辆车”混合模型覆盖后续已冻结 LockRequest 前置对象。 | 9/19 R8/R10/R12 + 001～078 M13 + PDM-01/02/03/04/07/10/12/13/14/17 Final + 2026-10-06 用户“同意”并“确认执行” | 2026-10-06 |
| PDM18-STARTUP-GATE | PDM-18 | Startup Gate | P18-R00 已 USER_APPROVED / APPLIED；target=PDM-18 的 10 条 incoming handoff 全部 HANDOFF_ACCEPTED；completed-PDM hard conflict=0；incoming handoff gap=0；建立 P18-A01～P18-A18 Batch 1 候选。 | 当前只进入 Batch 1 用户审查；未经用户批准不得进入 Batch 2；IA/Low-Fi/Engineering 不施工。 | 07_重建工作区/PDM-18_LockRequest正式LockWaitlist延期释放_规则原子重建_工作版.md | 2026-10-06 |

| PDM18-DEC-A01 | PDM-18 | P18-A01 | LockRequest / Lock / Waitlist 三对象独立；Consultation/Recommendation/Priority 不替代 Lock。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A02 | PDM-18 | P18-A02 | 客户点击锁车只创建/复用 LockRequest.PENDING，不直接占车或生成正式 Lock snapshot。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A03 | PDM-18 | P18-A03 | LockRequest.PENDING 最长 6h，服务端计时；正式 Lock 72h 仅在 approve + Lock 创建成功后开始。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A04 | PDM-18 | P18-A04 | 同车可有多个 PENDING；申请先后与 Priority 均不产生正式锁车优先权。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A05 | PDM-18 | P18-A05 | approve 最终提交重验 identity/permission/scope/customer/vehicle/listing_cycle/occupancy，全部合法才原子创建 Lock。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A06 | PDM-18 | P18-A06 | 并发只允许一个 active Lock；竞争失败进入真实 conflict，不自动转 Waitlist。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A07 | PDM-18 | P18-A07 | V1 客户端不提供 LockRequest 主动撤回或独立进度详情页，仅实时状态投影。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A08 | PDM-18 | P18-A08 | 同车同一时刻唯一 active Lock；同 Customer 可锁不同 Vehicle；hidden 不等于 Lock ended。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A09 | PDM-18 | P18-A09 | 正式 Lock 默认 72h 可配置；每笔创建时固化 expires_at；后改默认值不追改旧 Lock。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A10 | PDM-18 | P18-A10 | 普通无意向金 Lock 可按 expires_at 到期释放；已有真实意向金不得仅因普通超时自动释放。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A11 | PDM-18 | P18-A11 | 授权员工可延长同一普通 Lock 的 expires_at，不创建第二 Lock；记录 old/new/actor/time。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A12 | PDM-18 | P18-A12 | 只有他人 active Lock 时可 Waitlist；Waitlist 不占车；同 Customer+Vehicle active Waitlist 幂等。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A13 | PDM-18 | P18-A13 | Waitlist 不自动升级 Lock；Lock 释放后必须重新人工确认和重验；LOCK_CONFLICT 不自动创建 Waitlist。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A14 | PDM-18 | P18-A14 | Customer owner 与 Lock/Waitlist responsible 分层；owner/公海变化不静默漂移；inactive/离职需正式交接。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A15 | PDM-18 | P18-A15 | Customer 停用不删除既有 Lock/Waitlist 历史；恢复也不自动复活已终止对象。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A16 | PDM-18 | P18-A16 | source/visibility/archive 变化不改写 Lock/Waitlist 历史；hidden 不结束 Waitlist；档案不完整本身不阻断。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A17 | PDM-18 | P18-A17 | 正式 Lock 创建冻结真实客户价格快照；后续价格/source_type 变化不回写历史 snapshot。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-DEC-A18 | PDM-18 | P18-A18 | Matching/Priority/Recommendation 与 Lock 分层；active Lock 不阻断 Matching，但阻止新 Priority与第二 active Lock。 | 稳定一致规则；不得被旧 R8/R10 或 Current carrier 的压缩语义反向覆盖。 | PDM-18 工作版 Batch 1 + 2026-10-06 用户“全部同意确认执行” | 2026-10-06 |
| PDM18-GATE-B1 | PDM-18 | Batch 1 Gate | 用户对 P18-A01～P18-A18 全部同意并同一条消息确认执行；18 条稳定一致规则正式进入当前工作 Authority。 | Batch 2 Reverse Conflict Scan PASS / FALSE_DEPRECATION_COUNT=0；10 条 incoming handoff 继续 HANDOFF_ACCEPTED；IA/Low-Fi/Engineering 不施工。 | 07_重建工作区/PDM-18_LockRequest正式LockWaitlist延期释放_规则原子重建_工作版.md + 2026-10-06 用户执行授权 | 2026-10-06 |
| PDM18-SCAN-B2 | PDM-18 | Batch 2 Reverse Conflict Scan | 形成 P18-B2-01～P18-B2-06：旧“我要这辆车”统一入口、2h Lock、Priority=Lock priority、active Lock=no_match、Recommendation/Priority 反向撤 Lock、CRM 先锁车再选车辆等明确废弃/替代项。 | 防误废弃：员工直接正式 Lock、LockRequest、Waitlist、Matching 等仍合法能力均保留；FALSE_DEPRECATION_COUNT=0。 | 9/19 R8/R10 + 001～078 M06/M13 + PDM-12/13/14/16 Final | 2026-10-06 |

| PDM18-DEC-B2-01 | PDM-18 | P18-B2-01 | 旧“我要这辆车”统一客户意向入口已被 Consultation + LockRequest + Recommendation 分链替代，不得恢复；不废弃员工直接正式 Lock。 | 明确废弃 / superseded / DO_NOT_RESTORE；当前合法能力按防误废弃 Guard 保留。 | 9/19 R10 + 001～078 M06/M13 + PDM-14 Final + 2026-10-06 用户“全部同意”并以“确认指向”执行 | 2026-10-06 |
| PDM18-DEC-B2-02 | PDM-18 | P18-B2-02 | 旧默认正式 Lock=2h 已被 R8-01 的默认72h、后台可配置、创建时固化 expires_at 明确替代。 | 明确废弃 / superseded / DO_NOT_RESTORE；当前合法能力按防误废弃 Guard 保留。 | 9/19 R8-01 + M13 + 2026-10-06 用户“全部同意”并以“确认指向”执行 | 2026-10-06 |
| PDM18-DEC-B2-03 | PDM-18 | P18-B2-03 | Priority 不得作为 LockRequest 排队优先级、抢车分值或 override existing active Lock。 | 明确废弃 / superseded / DO_NOT_RESTORE；当前合法能力按防误废弃 Guard 保留。 | PDM-13 Final + 2026-10-06 用户“全部同意”并以“确认指向”执行 | 2026-10-06 |
| PDM18-DEC-B2-04 | PDM-18 | P18-B2-04 | active Lock 不得被解释为 no_match；底层真实可售时 Matching 继续，但不得绕过唯一 active Lock。 | 明确废弃 / superseded / DO_NOT_RESTORE；当前合法能力按防误废弃 Guard 保留。 | PDM-12/13 Final + 2026-10-06 用户“全部同意”并以“确认指向”执行 | 2026-10-06 |
| PDM18-DEC-B2-05 | PDM-18 | P18-B2-05 | Recommendation/Priority 的 end/release/expiry 不得反向取消已经合法成立的 Lock。 | 明确废弃 / superseded / DO_NOT_RESTORE；当前合法能力按防误废弃 Guard 保留。 | PDM-13/14 Final + 2026-10-06 用户“全部同意”并以“确认指向”执行 | 2026-10-06 |
| PDM18-DEC-B2-06 | PDM-18 | P18-B2-06 | 废弃旧 CRM“先锁车再选车辆”的过时产品入口；不废弃明确 Customer+Vehicle 上下文下的合法员工直接正式 Lock。 | 明确废弃 / superseded / DO_NOT_RESTORE；当前合法能力按防误废弃 Guard 保留。 | PDM-16 Final + PDM-18 防误废弃 Guard + 2026-10-06 用户“全部同意”并以“确认指向”执行 | 2026-10-06 |
| PDM18-GATE-B2 | PDM-18 | Batch 2 Gate | 用户对 P18-B2-01～P18-B2-06 全部同意并以“确认指向”明确执行；6 条废弃/替代规则正式进入当前 Authority。 | Reverse Conflict Scan PASS；FALSE_DEPRECATION_COUNT=0；10 条 incoming handoff 继续 HANDOFF_ACCEPTED。 | 07_重建工作区/PDM-18_LockRequest正式LockWaitlist延期释放_规则原子重建_工作版.md | 2026-10-06 |
| PDM18-SCAN-B3 | PDM-18 | Batch 3 明确新增/变更扫描 | 形成 P18-B3-01～03：4S 不得审批 LockRequest；LOCK_CONFLICT 后只可另行主动候补；合法名邦员工明确 Customer+Vehicle 上下文仍可直接正式 Lock。 | NEW_INDEPENDENT_ATOMS=3；MISCLASSIFIED_PRODUCT_CHOICE=0；等待用户审查。 | 001～078 M13-003/M13-006 + PDM-02/13/14/16 Final | 2026-10-06 |
| PDM18-B4-PRE-01 | PDM-18 | Batch 4 Pending Direction | 用户认可“普通 Lock 只占车不自动全客户隐藏；Priority Customer 转 Lock 时 Priority ended，但该 Lock 继承原 Priority 客户侧排他可见性；Lock 结束后不恢复旧 Priority而按当前事实重算可见性”。 | USER_DIRECTION_APPROVED / NOT_APPLIED；必须在 Batch 4 正式 cross-PDM 审查 P18-A12/A13/A18、PDM-13/PDM-14 后再执行；当前不得提前回写 completed PDM。 | 2026-10-06 当前对话用户“对，就是这个意思”+“同意” | 2026-10-06 |

| PDM18-RECLASS-B3-02 | PDM-18 | P18-B3-02 Reclassification | 用户否定“LOCK_CONFLICT 后不自动候补”的 Batch 3 候选，改为：同车同 cycle 一个 LockRequest 成功形成正式 Lock 后，其他仍有效 PENDING 自动转 Waitlist；自动候补不占车、不自动转 Lock，候补顺序按原 LockRequest.created_at。 | 从 Batch 3 撤回并转入 Batch 4；当前 P18-A06/A13 旧 Authority 在 Batch 4 正式裁决前仅标记 conflict pending，不提前改写。 | 2026-10-06 用户“我觉得可以这样调整”并随后确认执行 | 2026-10-06 |
| PDM18-B4-PRE-02 | PDM-18 | Batch 4 Pending Direction | 竞争 LockRequest 自动转 Waitlist：同车同 cycle 一人获正式 Lock 后，其他有效 PENDING 自动候补；已有 active Waitlist 幂等复用；车辆真实不可售/售出/cycle结束不创建；Waitlist 不占车、不自动升 Lock；释放后仍需人工重验；候补顺序按原申请时间。 | USER_DIRECTION_APPROVED / NOT_APPLIED；与 P18-A06/A13 及 9/22“不自动转 Waitlist”旧口径存在明确待修正冲突，必须在 Batch 4 正式收口。 | 当前对话用户裁决 + PDM-18 工作版 | 2026-10-06 |

| PDM18-DEC-B3-01 | PDM-18 | P18-B3-01 | 4S Member 不得审批客户 LockRequest；审批属于名邦内部受控动作，最终提交重验 permission/capability + scope + object state。 | 后续明确新增/变更；USER_APPROVED / APPLIED。 | 001～078 M13-003 + PDM-02 + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM18-DEC-B3-03 | PDM-18 | P18-B3-03 | 合法名邦员工在明确 Customer + Vehicle 上下文可直接创建正式 Lock，不要求所有 Lock 必须先有客户 LockRequest；客户自助锁车仍走 LockRequest。 | 后续明确新增/变更；USER_APPROVED / APPLIED。 | 001～078 M13-006 / VR-E-012 + PDM-02 + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM18-GATE-B3 | PDM-18 | Batch 3 Gate | P18-B3-01、P18-B3-03 全部用户批准并执行；P18-B3-02 已撤回转 Batch 4。 | Batch 3 PASS；当前进入 Batch 4 用户审查。 | 07_重建工作区/PDM-18_LockRequest正式LockWaitlist延期释放_规则原子重建_工作版.md | 2026-10-06 |
| PDM18-SCAN-B4 | PDM-18 | Batch 4 Candidate Scan | 形成 P18-B4-01～P18-B4-10，覆盖 Priority-origin Lock 可见性、竞争 LockRequest 自动候补、Waitlist responsible/结束矩阵、Lock responsible、人工结束原因、供应异常、30分钟提醒、默认时长配置权限、批量 mutation。 | PENDING_USER_REVIEW；不得提前应用。 | 9/19 R8/R10 + 001～078 M13 + PDM-02/13/14/17 Final + 用户已确认两条方向 | 2026-10-06 |

| PDM18-DEC-B4-01 | PDM-18 | P18-B4-01 / 1A | Priority→Lock：普通 Lock 只占车不自动全客户隐藏；Priority-origin Lock 在 Priority ended(converted_to_lock) 后继承客户侧排他可见性，Lock 结束不恢复旧 Priority。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-18 工作版 + 2026-10-06 用户 1A～10A 并确认执行 | 2026-10-06 |
| PDM18-DEC-B4-02 | PDM-18 | P18-B4-02 / 2A | 竞争 LockRequest：一人获正式 Lock 后，其他仍有效 PENDING 保留 LOCK_CONFLICT 结果并自动创建/复用 Waitlist；按原 request created_at 排候补顺序；不影响正式 Lock 获得顺序。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-18 工作版 + 2026-10-06 用户 1A～10A 并确认执行 | 2026-10-06 |
| PDM18-DEC-B4-03 | PDM-18 | P18-B4-03 / 3A | Waitlist responsible：Recommendation recommender → active/paused Demand responsible → current owner → 先合法分配；创建后不随普通 owner/Demand 变化漂移。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-18 工作版 + 2026-10-06 用户 1A～10A 并确认执行 | 2026-10-06 |
| PDM18-DEC-B4-04 | PDM-18 | P18-B4-04 / 4A | Waitlist 结束矩阵：completed/offline/unavailable/sold_external/cycle end 等真实终态结束；hidden 不结束；原 Lock 释放不结束其他 Waitlist；已结束对象不自动复活。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-18 工作版 + 2026-10-06 用户 1A～10A 并确认执行 | 2026-10-06 |
| PDM18-DEC-B4-05 | PDM-18 | P18-B4-05 / 5A | Lock responsible 与 approver/actor 分离；代审批不自动抢业务责任；无合法 responsible 不建立正式 Lock。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-18 工作版 + 2026-10-06 用户 1A～10A 并确认执行 | 2026-10-06 |
| PDM18-DEC-B4-06 | PDM-18 | P18-B4-06 / 6A | 人工 Lock release/cancel 与 Waitlist end 必填 reason，并按 permission/capability + scope + object state 重验；系统自动结束写系统 reason。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-18 工作版 + 2026-10-06 用户 1A～10A 并确认执行 | 2026-10-06 |
| PDM18-DEC-B4-07 | PDM-18 | P18-B4-07 / 7A | 供应异常不自动取消已有 Lock；保留 Lock/快照/资金历史并挂接 anomaly，后续由合法业务路径人工处理。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-18 工作版 + 2026-10-06 用户 1A～10A 并确认执行 | 2026-10-06 |
| PDM18-DEC-B4-08 | PDM-18 | P18-B4-08 / 8A | 不恢复固定“到期前30分钟提醒”；提醒是否开启/提前量交 PDM-23 + PDM-22。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-18 工作版 + 2026-10-06 用户 1A～10A 并确认执行 | 2026-10-06 |
| PDM18-DEC-B4-09 | PDM-18 | P18-B4-09 / 9A | 默认 Lock 时长是业务配置；需明确 business-config permission + scope；System Admin 身份本身不自动拥有；只影响新 Lock。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-18 工作版 + 2026-10-06 用户 1A～10A 并确认执行 | 2026-10-06 |
| PDM18-DEC-B4-10 | PDM-18 | P18-B4-10 / 10A | V1 不提供批量 Lock/approve/release/cancel/extension/Waitlist mutation；列表可批量查看筛选，但业务 mutation 逐对象处理。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-18 工作版 + 2026-10-06 用户 1A～10A 并确认执行 | 2026-10-06 |
| PDM18-GATE-B4 | PDM-18 | Batch 4 Gate | P18-B4-01～P18-B4-10 全部按 A 方案批准并执行；A06/A13/A18 已按新裁决完成局部修正/扩展。 | LOCAL_PRODUCT_CHOICE_UNRESOLVED=0；进入 Final 前完整性复核 R1。 | 07_重建工作区/PDM-18_LockRequest正式LockWaitlist延期释放_规则原子重建_工作版.md | 2026-10-06 |
| PDM18-PREFINAL-R1 | PDM-18 | Final 前完整性复核 R1 | R1 发现 6 组 Final 前修复：Waitlist 手机号门槛、客户不自助取消 Waitlist、LockRequest 结果/审计、Lock 幂等、候补顺序客户端语义、outgoing handoff + stale carrier/alignment。 | REPAIR_REQUIRED / FINAL_CANDIDATE_NOT_READY；等待用户审查 P18-LIA-01～P18-LIA-06。 | 07_重建工作区/PDM-18_Final前完整性复核_R1_2026-10-06.md | 2026-10-06 |

| PDM18-DEC-LIA-01 | PDM-18 | P18-LIA-01 | Waitlist 是手机号人工服务动作；客户主动候补无手机号先走统一授权，成功自动继续，拒绝不建 Waitlist；自动候补也重验当前 phone/customer/account。 | Prefinal R1 修复；USER_APPROVED / APPLIED。 | 07_重建工作区/PDM-18_Final前完整性复核_R1_2026-10-06.md + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM18-DEC-LIA-02 | PDM-18 | P18-LIA-02 | V1 客户端不提供主动取消 Waitlist；由合法 responsible/管理人员人工结束或 Vehicle/cycle 终态自动结束；旧 Waitlist 不自动复活。 | Prefinal R1 修复；USER_APPROVED / APPLIED。 | 07_重建工作区/PDM-18_Final前完整性复核_R1_2026-10-06.md + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM18-DEC-LIA-03 | PDM-18 | P18-LIA-03 | LockRequest 统一结果合同：PENDING live；APPROVED/REJECTED/EXPIRED/LOCK_CONFLICT/CLOSED_NOT_LOCKABLE 终态；APPROVED 关联 resulting_lock_id，自动候补的 LOCK_CONFLICT 可关联 resulting_waitlist_id。 | Prefinal R1 修复；USER_APPROVED / APPLIED。 | 07_重建工作区/PDM-18_Final前完整性复核_R1_2026-10-06.md + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM18-DEC-LIA-04 | PDM-18 | P18-LIA-04 | 正式 Lock 创建必须幂等/retry-safe；approve、员工直接 Lock、网络重试/重复点击均不得产生第二 active Lock。 | Prefinal R1 修复；USER_APPROVED / APPLIED。 | 07_重建工作区/PDM-18_Final前完整性复核_R1_2026-10-06.md + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM18-DEC-LIA-05 | PDM-18 | P18-LIA-05 | Waitlist 可有内部稳定处理顺序，但客户端不展示保证性第几名；顺序不等于自动获得下一 Lock。 | Prefinal R1 修复；USER_APPROVED / APPLIED。 | 07_重建工作区/PDM-18_Final前完整性复核_R1_2026-10-06.md + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM18-DEC-LIA-06 | PDM-18 | P18-LIA-06 | 登记 PDM-18→19/20/21/22/23/25 outgoing handoff 与 PDM-18 stale carrier；completed PDM-13/14 不回滚，按下游 Lock Authority 对齐。 | Prefinal R1 修复；USER_APPROVED / APPLIED。 | 07_重建工作区/PDM-18_Final前完整性复核_R1_2026-10-06.md + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM18-PREFINAL-REPAIR-R1 | PDM-18 | R1 Repair Gate | P18-LIA-01～P18-LIA-06 全部批准并执行，6/6 R1 修复闭环；6 条 outgoing handoff 已登记 HANDOFF_OPEN；stale carrier 已登记。 | 允许重新运行 Final 前完整性复核 R2。 | 07_重建工作区/PDM-18_LockRequest正式LockWaitlist延期释放_规则原子重建_工作版.md | 2026-10-06 |
| PDM18-PREFINAL-R2 | PDM-18 | Final 前完整性复核 R2 | R1 修复闭环后重新执行完整性复核，结论 PASS / FINAL_CANDIDATE_READY。 | SOURCE_TO_ATOM=PASS；ATOM_TO_SOURCE=PASS；SEMANTIC_COMPLETENESS=PASS；MISSING_RULE_UNRESOLVED=0；SEMANTIC_DETAIL_GAP_UNRESOLVED=0；COMPLETED_PDM_INVARIANT_CONFLICT=0；INCOMING_HANDOFF_GAP=0；OUTGOING_HANDOFF_GAP=0；NEGATIVE_CLAIMS_VERIFIED=PASS；Local Product Choice=0。 | 07_重建工作区/PDM-18_Final前完整性复核_R2_2026-10-06.md | 2026-10-06 |
| PDM18-FINAL-OVERVIEW-CANDIDATE | PDM-18 | Final Domain Overview | 已生成 PDM-18 最终完整规则总览候选，当前仅等待用户最终批准。 | 批准前不得发布 Final、关闭 incoming handoff、source backwrite 或进入 PDM-19。 | 07_重建工作区/PDM-18_最终完整规则总览_待用户批准.md | 2026-10-06 |

| PDM18-FINAL-APPROVAL | PDM-18 | Final Domain Overview | 用户对 PDM-18 最终完整规则总览明确“同意”，视为最终批准。 | USER_FINAL_APPROVED；仅记录最终产品批准，等待后续明确执行授权后才允许 Final closeout、关闭 incoming handoff、source backwrite 或进入 PDM-19。 | 2026-10-06 用户“同意” | 2026-10-06 |

| PDM18-FINAL-CLOSEOUT | PDM-18 | Final Closeout | 用户在 Final Overview 最终批准后明确确认执行；正式发布 PDM-18 Final，Final Integrity PASS；10/10 incoming handoff CLOSED 且 10/10 source backwrite DONE；6 条 outgoing handoff 保持 OPEN。 | PDM-18 = COMPLETE / INTEGRITY_PASS；下一步 PDM-19 Startup Gate。 | PDM-18 Final + Final Integrity + Handoff Register | 2026-10-06 |

| PDM19-CORE-R00 | PDM-19 | P19-R00 | PDM-19 定位为 Deposit（意向金真实收款事实）/ Transaction / Refund / 成交纠错，以及换车资金与交易收口的唯一业务 Authority；从合法 Lock 后承接资金与交易事实链。 | LockRequest / Lock / Waitlist 继续由 PDM-18 负责；换车不是独立状态机，不得通过改挂旧 Transaction / Deposit 伪造新车历史。 | 9/19 C4/R8/R12 + 001～078 M14 + Current IA CO-O18/O19/O20 + PDM-01/02/03/04/07/13/14/15/17/18 Final + 2026-10-06 用户“同意”并“确认执行” | 2026-10-06 |
| PDM19-STARTUP-GATE | PDM-19 | Startup Gate | P19-R00 已 USER_APPROVED / APPLIED；target=PDM-19 的 10 条 incoming handoff 全部 HANDOFF_ACCEPTED；completed-PDM hard conflict=0；incoming handoff gap=0；建立 P19-A01～P19-A14 Batch 1 候选。 | 当前只进入 Batch 1 用户审查；Current 中首次完成权限、Deposit correction、Refund closed-not-refunded 等后续细化不在 Startup Gate 偷渡；IA/Low-Fi/Engineering 不施工。 | 07_重建工作区/PDM-19_意向金Transaction退款成交纠错换车_规则原子重建_工作版.md | 2026-10-06 |

| PDM19-DEC-A01 | PDM-19 | P19-A01 | Deposit / Lock / Transaction / Refund 四类事实分层，明确关联但不得合并成单一“大交易状态”。 | 稳定一致规则；不得被旧资金/交易压缩状态模型覆盖。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-DEC-A02 | PDM-19 | P19-A02 | Deposit / Transaction / Refund / correction 采用追加事实；更正、冲正、退款、成交纠错不得物理覆盖原历史。 | 排除 overwrite/delete-as-correction。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-DEC-A03 | PDM-19 | P19-A03 | 合法 Lock 一旦存在真实 Deposit，不得仅因普通 Lock expires_at 到期按无意向金超时自动释放。 | PDM-19 提供真实 Deposit 事实；Lock Authority 仍属 PDM-18。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-DEC-A04 | PDM-19 | P19-A04 | Transaction 必须来源于合法 Lock，并保留 Customer / Vehicle / listing_cycle / Lock 真实来源链。 | 排除脱离 Lock 凭空创建 Transaction。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-DEC-A05 | PDM-19 | P19-A05 | Transaction 取消不自动复活旧 Lock / Waitlist；继续购车须按当时当前规则重新建立合法 Lock 链。 | 排除 transaction rollback 恢复旧占用对象。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-DEC-A06 | PDM-19 | P19-A06 | Customer 停用不删除已发生 Deposit / Transaction / Refund / correction 历史。 | 当前新动作仍按最新 identity/account/permission/object state 判断。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-DEC-A07 | PDM-19 | P19-A07 | Vehicle source / visibility / source conversion / supply anomaly 不得静默改写或删除既有交易资金历史。 | 排除 source 变化反写交易历史。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-DEC-A08 | PDM-19 | P19-A08 | 档案暂不完整本身不阻止创建合法 Transaction；首次真正完成/交付前读取当时 required-field set，缺失只阻止完成。 | 不因资料暂缺回滚已创建 Transaction。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-DEC-A09 | PDM-19 | P19-A09 | in-progress Transaction 阻止新 Priority；从 active Priority 进入 Transaction 时 Priority ended；交易取消/纠错不恢复旧 Priority。 | Vehicle 真正重新开放后按当时合法 Match Result 重新仲裁。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-DEC-A10 | PDM-19 | P19-A10 | Transaction 与 Recommendation 分层；Recommendation 不 takeover、不取消、不回写 Transaction；底层真实不可售时仍阻止新业务。 | 不把 Transaction 占用事实等同 Recommendation 自动失效。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-DEC-A11 | PDM-19 | P19-A11 | Transaction completed / cancelled / corrected 均不得自动结束或改写 Consultation 主状态。 | Consultation 仍由 PDM-15 合法真人动作关闭。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-DEC-A12 | PDM-19 | P19-A12 | in-progress Transaction / 未完成 Refund 责任是公海保护事实；进入公海前必须完成、取消或正式交接。 | owner/public-pool 变化不得静默漂移或重建交易退款责任。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-DEC-A13 | PDM-19 | P19-A13 | V1 不建设独立换车状态机；原车业务真实结束/取消，新车重新 Lock / Transaction / Deposit，旧历史完整保留。 | 排除直接替换旧 Transaction vehicle_id 的换车模型。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-DEC-A14 | PDM-19 | P19-A14 | 旧车 Deposit 不跨车转挂；旧车退款按真实 Refund，新车需要意向金则重新记录新 Deposit。 | 旧收款、旧退款、新收款分别保留。 | PDM-19 工作版 Batch 1 + 2026-10-06 用户“全部同意”并随后“确认执行” | 2026-10-06 |
| PDM19-GATE-B1 | PDM-19 | Batch 1 Gate | 用户对 P19-A01～P19-A14 全部同意，并随后明确确认执行；14 条稳定一致规则正式进入当前工作 Authority。 | Batch 2 Reverse Conflict Scan PASS / FALSE_DEPRECATION_COUNT=0；10 条 incoming handoff 继续 HANDOFF_ACCEPTED；IA/Low-Fi/Engineering 不施工。 | 07_重建工作区/PDM-19_意向金Transaction退款成交纠错换车_规则原子重建_工作版.md + 2026-10-06 用户执行授权 | 2026-10-06 |
| PDM19-SCAN-B2 | PDM-19 | Batch 2 Reverse Conflict Scan | 形成 P19-B2-01～P19-B2-06：Deposit 旧结清状态机、Refund partial 主状态、Transaction 取消复活 Lock/Waitlist、独立换车状态机、Deposit 跨车转挂、覆盖/删除式纠错等明确废弃/替代项。 | 防误废弃：多笔收款、部分退款业务结果、pending Refund、closed-not-refunded 候选、成交纠错、换车业务与权限细节均未误标为废弃；FALSE_DEPRECATION_COUNT=0。 | 9/19 C4/R8/R12 + 001～078 M14 + Current IA + PDM-18 Final | 2026-10-06 |

| PDM19-DEC-B2-01 | PDM-19 | P19-B2-01 | Deposit 不恢复“未结清/已结清/部分结清”主状态机；Deposit 保持真实收款事实，可派生汇总但不覆盖事实。 | 明确废弃 / superseded / DO_NOT_RESTORE。 | PDM-19 工作版 Batch 2 + 2026-10-06 用户“全部同意”并以“真执行”授权 | 2026-10-06 |
| PDM19-DEC-B2-02 | PDM-19 | P19-B2-02 | Refund 不恢复 `partial` 主状态；部分退款继续通过多笔实际退款事实表达。 | 明确废弃 / superseded / DO_NOT_RESTORE；部分退款业务结果本身保留。 | PDM-19 工作版 Batch 2 + 2026-10-06 用户“全部同意”并以“真执行”授权 | 2026-10-06 |
| PDM19-DEC-B2-03 | PDM-19 | P19-B2-03 | Transaction 取消不得自动复活旧 Lock / Waitlist；继续购买需重新建立新的合法 Lock 链。 | 明确废弃 rollback-to-old-lock 模型。 | PDM-19 工作版 Batch 2 + 2026-10-06 用户“全部同意”并以“真执行”授权 | 2026-10-06 |
| PDM19-DEC-B2-04 | PDM-19 | P19-B2-04 | V1 不恢复独立换车状态机 / 换车关系对象；换车按旧车真实结束、新车新建业务对象处理。 | 明确废弃专用 change-car state machine，不废弃换车业务场景。 | PDM-19 工作版 Batch 2 + 2026-10-06 用户“全部同意”并以“真执行”授权 | 2026-10-06 |
| PDM19-DEC-B2-05 | PDM-19 | P19-B2-05 | 旧 Deposit 不跨车直接转移 / 改挂；旧车退款、新车新收款分别形成真实事实。 | 明确废弃 Deposit cross-vehicle reassignment。 | PDM-19 工作版 Batch 2 + 2026-10-06 用户“全部同意”并以“真执行”授权 | 2026-10-06 |
| PDM19-DEC-B2-06 | PDM-19 | P19-B2-06 | 不得通过删除/覆盖原 Deposit / Transaction / Refund 事实完成资金或成交纠错；必须追加纠错事实并保留原历史。 | 明确废弃 overwrite/delete-as-correction。 | PDM-19 工作版 Batch 2 + 2026-10-06 用户“全部同意”并以“真执行”授权 | 2026-10-06 |
| PDM19-GATE-B2 | PDM-19 | Batch 2 Gate | 用户对 P19-B2-01～P19-B2-06 全部同意并以“真执行”明确授权；6 条废弃/替代规则正式进入当前 Authority。 | Reverse Conflict Scan PASS；FALSE_DEPRECATION_COUNT=0；10 条 incoming handoff 继续 HANDOFF_ACCEPTED。 | 07_重建工作区/PDM-19_意向金Transaction退款成交纠错换车_规则原子重建_工作版.md | 2026-10-06 |
| PDM19-SCAN-B3 | PDM-19 | Batch 3 明确新增/变更扫描 | 形成 P19-B3-01～03：Transaction 首次完成独立敏感权限；Deposit 追加冲正/更正并独立分权；pending Refund 新增撤回/关闭但未退款的合法退出路径。 | NEW_INDEPENDENT_ATOMS=3；MISCLASSIFIED_PRODUCT_CHOICE=0；closed-not-refunded 的最终 Domain 建模等冲突留 Batch 4。 | Phase 1.5 / Current IA IA-09/10/11 + CO-O18/O19/O20 + M14-003/M14-005 | 2026-10-06 |

| PDM19-DEC-B3-01 | PDM-19 | P19-B3-01 | Transaction 首次完成采用独立敏感权限：普通销售不得首次完成；经理/店长需具独立 transaction-complete permission + scope；职位本身不自动授权；System Admin 控制平面身份本身无该业务权。 | 后续明确新增/变更；USER_APPROVED / APPLIED。 | Current IA IA-09 / CO-O19 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM19-DEC-B3-02 | PDM-19 | P19-B3-02 | Deposit 误记采用追加 reversal/correction；原收款永久保留；仅具资金纠错 permission + scope 的经理/店长可执行；原因必填并审计。 | 后续明确新增/变更；USER_APPROVED / APPLIED。 | Phase 1.5 D10 + Current IA IA-10 / CO-O18 + M14-003 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM19-DEC-B3-03 | PDM-19 | P19-B3-03 | 用户简化 pending Refund 关闭：确定不再退款时，当前合法可处理该 Refund 的业务人员可直接关闭，只填写关闭原因；不新增专门 close permission，不增加审批；closed 不等于 refunded、不计入已退款金额，原 Refund 历史保留。 | USER_REVISED / USER_APPROVED / APPLIED；覆盖 Current IA/Phase1.5 中“必须独立 refund-management permission 才能关闭”的过度复杂 carrier 表达；IA 当前不施工，后续统一 alignment。 | Phase1.5 D11 / Current IA IA-11 + 2026-10-06 用户“就是简单写一个原因”“对，就这个意思”“全部同意”“确认执行” | 2026-10-06 |
| PDM19-GATE-B3 | PDM-19 | Batch 3 Gate | P19-B3-01～P19-B3-03 全部用户批准并执行；B3-03 按用户简化口径修订后生效。 | Batch 3 PASS；10 条 incoming handoff 继续 HANDOFF_ACCEPTED；IA/Low-Fi/Engineering 不施工。 | 07_重建工作区/PDM-19_意向金Transaction退款成交纠错换车_规则原子重建_工作版.md | 2026-10-06 |
| PDM19-SCAN-B4 | PDM-19 | Batch 4 Candidate Scan | 形成 P19-B4-01～P19-B4-11，覆盖 Refund closed 模型、Transaction 创建原子转换/状态并发/负责人/成交价/纠错、Deposit 最小字段、Refund Guard/资金确认/公海保护、供应异常。 | PENDING_USER_REVIEW；不得提前应用；completed PDM 不改写。 | 9/19 R8/C4 + Phase1.5 D10/D11 + Current IA + M14 + PDM-02/17/18 Final | 2026-10-06 |

| PDM19-DEC-B4-01 | PDM-19 | P19-B4-01 / 1A | Refund 主状态统一为 pending / refunded / closed；closed=未实际退款而关闭，必须填写原因，不计入 refunded_amount，不新增专门 close permission。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-19 工作版 + 2026-10-06 用户 1A～11A 并确认执行 | 2026-10-06 |
| PDM19-DEC-B4-02 | PDM-19 | P19-B4-02 / 2A | 创建首笔 in-progress Transaction 时原子完成 active Lock 重验、Transaction 创建与原 Lock converted_to_transaction 结束；任一步失败整组不提交。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-19 工作版 + 2026-10-06 用户 1A～11A 并确认执行 | 2026-10-06 |
| PDM19-DEC-B4-03 | PDM-19 | P19-B4-03 / 3A | Transaction 主状态只保留 in_progress / completed / cancelled；同车同一时刻最多一笔 in-progress；completed/cancelled 为终态历史。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-19 工作版 + 2026-10-06 用户 1A～11A 并确认执行 | 2026-10-06 |
| PDM19-DEC-B4-04 | PDM-19 | P19-B4-04 / 4A | Transaction responsible 默认继承来源 Lock responsible；owner 变化不自动漂移；inactive/离职/失资格必须正式 handoff 并保留历史。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-19 工作版 + 2026-10-06 用户 1A～11A 并确认执行 | 2026-10-06 |
| PDM19-DEC-B4-05 | PDM-19 | P19-B4-05 / 5A | completed Transaction 固化 actual_deal_price、completed_at、transaction responsible 与真实购车事实；后续展示价/批发价/source_type 不得回写成交历史主价格。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-19 工作版 + 2026-10-06 用户 1A～11A 并确认执行 | 2026-10-06 |
| PDM19-DEC-B4-06 | PDM-19 | P19-B4-06 / 6A | completed Transaction correction：普通销售不得执行；经理/店长仍需独立 transaction-correction permission + scope；原因必填、append-only、无二级审批；System Admin 身份本身无权，4S Member 不进入名邦成交纠错链。 | Batch 4 产品裁决；USER_APPROVED / APPLIED；覆盖旧 System Admin 可参与残留。 | PDM-19 工作版 + R8 + 2026-10-06 用户 1A～11A 并确认执行 | 2026-10-06 |
| PDM19-DEC-B4-07 | PDM-19 | P19-B4-07 / 7A | Deposit 每笔必填 amount/received_at/payment_method/operator；note/voucher 可选；同 Lock 可多笔；V1 只记录线下真实收款；Deposit 无独立 responsible。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-19 工作版 + 2026-10-06 用户 1A～11A 并确认执行 | 2026-10-06 |
| PDM19-DEC-B4-08 | PDM-19 | P19-B4-08 / 8A | Refund 必须且只能绑定 Lock XOR Transaction；一旦 owning Transaction 存在后续退款归 Transaction；校验 customer/vehicle/cycle、refundable_balance、amount 与冲突 pending，并原子防超退。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-19 工作版 + 2026-10-06 用户 1A～11A 并确认执行 | 2026-10-06 |
| PDM19-DEC-B4-09 | PDM-19 | P19-B4-09 / 9A | Refund 发起、真实退款确认、pending 直接关闭三类动作分层：responsible 可发起；真实退款由现有资金/退款确认 permission 的经理/店长确认；不再退款时合法处理人直接 close+原因，不新增 close permission；Refund 不设永久 responsible。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-19 工作版 + 用户 B3-03 修订 + 2026-10-06 用户 1A～11A 并确认执行 | 2026-10-06 |
| PDM19-DEC-B4-10 | PDM-19 | P19-B4-10 / 10A | pending Refund 作为未完成责任保护 Customer 不直接进公海，但不占 Vehicle；refunded/closed 后该 Refund 保护解除；部分退款用多笔事实、余额动态派生且不得超退。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-19 工作版 + PDM-17 + 2026-10-06 用户 1A～11A 并确认执行 | 2026-10-06 |
| PDM19-DEC-B4-11 | PDM-19 | P19-B4-11 / 11A | in-progress Transaction 遇供应异常不自动取消、不删历史；记录 supply_anomaly；可售则继续，不可售不得正常 completed，按真实情况 cancel / 换车 / Refund。 | Batch 4 产品裁决；USER_APPROVED / APPLIED。 | PDM-19 工作版 + R8 + PDM-18 + 2026-10-06 用户 1A～11A 并确认执行 | 2026-10-06 |
| PDM19-GATE-B4 | PDM-19 | Batch 4 Gate | P19-B4-01～P19-B4-11 全部按 A 方案批准并执行；Refund closed、Transaction 状态/责任/价格/纠错、Deposit、Refund Guard 与供应异常完成产品裁决。 | LOCAL_PRODUCT_CHOICE_UNRESOLVED=0；进入 Final 前完整性复核 R1。 | 07_重建工作区/PDM-19_意向金Transaction退款成交纠错换车_规则原子重建_工作版.md | 2026-10-06 |
| PDM19-PREFINAL-R1 | PDM-19 | Final 前完整性复核 R1 | R1 发现 6 组 Final 前修复：误成交纠错 listing_cycle、Transaction 正常取消边界、Deposit 真实收款入口、当场全额退款直达 refunded、Transaction completed 不自动结束 Demand、outgoing handoff + stale carrier/alignment。 | REPAIR_REQUIRED / FINAL_CANDIDATE_NOT_READY；等待用户审查 P19-LIA-01～P19-LIA-06。 | 07_重建工作区/PDM-19_Final前完整性复核_R1_2026-10-06.md | 2026-10-06 |

| PDM19-DEC-LIA-01 | PDM-19 | P19-LIA-01 | 误成交 correction 若 Vehicle 从未真实不可售，继续原 listing_cycle，不计 today-new、不更新最新上架、不重新置顶、不重复扣查价额度；只有真实不可售后再可售才新建 cycle。 | Final 前修复；USER_APPROVED / APPLIED。 | M14-002 / DEC-062 / Phase1.5 HR-07 + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM19-DEC-LIA-02 | PDM-19 | P19-LIA-02 | in-progress Transaction 可由当前合法 responsible 正常 cancel；completed 不走普通 cancel；cancelled 为终态，不复活 Lock/Waitlist，不强改 source_status/platform_visibility，不制造假 relist。 | Final 前修复；USER_APPROVED / APPLIED。 | Current Transaction Guard + M14 + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM19-DEC-LIA-03 | PDM-19 | P19-LIA-03 | 当前合法业务 responsible 可记录真实 Deposit；记录收款与资金 correction 分权；Deposit 无独立 responsible，保留 operator；correction 继续由独立资金纠错 permission + scope 的经理/店长执行。 | Final 前修复；USER_APPROVED / APPLIED。 | M14-003 + P19-B3-02/B4-07 + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM19-DEC-LIA-04 | PDM-19 | P19-LIA-04 | 实际退款已当场完成时可直接记录 refunded，不强制造假 pending；pending 表示钱尚未实际退；pending 后不再退款则 closed+reason。 | Final 前修复；USER_APPROVED / APPLIED。 | M14-005 + P19-B3-03/B4-01/B4-09 + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM19-DEC-LIA-05 | PDM-19 | P19-LIA-05 | Transaction completed 不自动批量 completed/cancelled Customer 全部 Demand；关联 Demand 是否结束继续服从 PDM-11 真实服务目标。 | Final 前 completed-PDM invariant 修复；USER_APPROVED / APPLIED。 | PDM-11 Final §19 + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM19-DEC-LIA-06 | PDM-19 | P19-LIA-06 | 正式登记 PDM-19→PDM-20/21/22/23/25 outgoing handoff，并登记 Refund close permission、Refund closed 状态、System Admin correction 等 stale carrier，统一延后 Alignment。 | Final 前 handoff/alignment 修复；USER_APPROVED / APPLIED。 | PDM-19 Prefinal R1 + 2026-10-06 用户“全部同意”并确认执行 | 2026-10-06 |
| PDM19-GATE-PREFINAL-R1-REPAIR | PDM-19 | R1 Repair Gate | P19-LIA-01～P19-LIA-06 全部用户批准并执行；R1 修复 6/6 关闭；5 条 outgoing handoff 已登记 HANDOFF_OPEN；10 条 incoming 继续 HANDOFF_ACCEPTED。 | 允许运行 Prefinal R2；IA/Low-Fi/Engineering 不施工。 | PDM-19 工作版 + CROSS_PDM_HANDOFF_REGISTER | 2026-10-06 |
| PDM19-PREFINAL-R2 | PDM-19 | Final 前完整性复核 R2 | Source→Atom、Atom→Source、Semantic Completeness、Completed-PDM Invariant、Incoming/Outgoing Handoff、Negative Claim 全部 PASS；Missing/Detail/Conflict/Handoff gap 均为 0。 | PASS / FINAL_CANDIDATE_READY；当前进入 Final Domain Overview 用户最终审查。 | 07_重建工作区/PDM-19_Final前完整性复核_R2_2026-10-06.md | 2026-10-06 |
| PDM19-FINAL-APPROVAL | PDM-19 | Final Domain Overview | 用户对 PDM-19 最终完整规则总览明确“同意”，视为最终产品批准。 | USER_FINAL_APPROVED；等待后续明确执行授权后才允许 Final closeout。 | 2026-10-06 用户“同意” | 2026-10-06 |
| PDM19-FINAL-CLOSEOUT | PDM-19 | Final Closeout | 用户在 Final Overview 最终批准后以“确认指向”明确执行；正式发布 PDM-19 Final，Final Integrity PASS；10/10 incoming handoff CLOSED 且 10/10 source backwrite DONE；5 条 outgoing handoff 保持 OPEN。 | PDM-19 = COMPLETE / INTEGRITY_PASS；下一步 PDM-20 Startup Gate。 | PDM-19 Final + Final Integrity + Handoff Register | 2026-10-06 |
| PDM20-CORE-R00 | PDM-20 | P20-R00 | PDM-20 定位为客户端产品体验与 Customer Safe Projection 的唯一 Authority，负责浏览/搜索/筛选/排序/列表/详情/收藏/分享/个人中心/地域及各 completed PDM 业务对象的客户端安全投影；不重新定义底层 Customer/Vehicle/Price/Demand/Matching/Priority/Recommendation/Consultation/Lock/Transaction 等业务真相。 | 用户已批准并执行；客户端 CTA/状态/文案/导航只消费 completed PDM Authority，不得用页面状态反向创造 Domain 主状态。 | 9/19 R10 + 001～078 M16/M10/M11 + Current IA/Low-Fi + PDM-01/03/04/05/07/08/10/11/12/13/14/15/18/19 Final + 2026-10-06 用户“同意”并确认执行 | 2026-10-06 |
| PDM20-STARTUP-GATE | PDM-20 | Startup Gate | P20-R00 已 USER_APPROVED / APPLIED；CROSS_PDM_HANOFF_REGISTER 实际 target=PDM-20 行数=14，14/14 incoming handoff 全部 HANDOFF_ACCEPTED；completed-PDM hard conflict=0；incoming handoff gap=0；形成 P20-A01～P20-A18 Batch 1 候选。 | 启动门禁机械计数纠正：此前口头“15条”不进入正式状态；以 Register 实际 14 行为准。R10 与 completed PDM 冲突项、stale IA/Low-Fi carrier 不在 Startup Gate 偷渡；IA/Low-Fi/Engineering 不施工。 | 07_重建工作区/PDM-20_客户端浏览搜索筛选排序列表详情收藏分享个人中心地域_规则原子重建_工作版.md | 2026-10-06 |
| PDM20-DEC-A01 | PDM-20 | P20-A01 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A01 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A02 | PDM-20 | P20-A02 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A02 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A03 | PDM-20 | P20-A03 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A03 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A04 | PDM-20 | P20-A04 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A04 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A05 | PDM-20 | P20-A05 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A05 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A06 | PDM-20 | P20-A06 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A06 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A07 | PDM-20 | P20-A07 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A07 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A08 | PDM-20 | P20-A08 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A08 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A09 | PDM-20 | P20-A09 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A09 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A10 | PDM-20 | P20-A10 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A10 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A11 | PDM-20 | P20-A11 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A11 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A12 | PDM-20 | P20-A12 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A12 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A13 | PDM-20 | P20-A13 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A13 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A14 | PDM-20 | P20-A14 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A14 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A15 | PDM-20 | P20-A15 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A15 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A16 | PDM-20 | P20-A16 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A16 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A17 | PDM-20 | P20-A17 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A17 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-A18 | PDM-20 | P20-A18 | Batch 1 稳定基础规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-A18 正文为准。 | USER_APPROVED / APPLIED；不得被 Current/Low-Fi stale carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-GATE-B1 | PDM-20 | Batch 1 Gate | P20-A01～P20-A18 全部用户批准并执行；18 条稳定客户端基础规则进入当前 Authority；14/14 incoming handoff 继续 HANDOFF_ACCEPTED。 | Batch 1 PASS；IA/Low-Fi/Engineering 不施工。 | 07_重建工作区/PDM-20_客户端浏览搜索筛选排序列表详情收藏分享个人中心地域_规则原子重建_工作版.md | 2026-10-06 |
| PDM20-SCAN-B2 | PDM-20 | Batch 2 Reverse Conflict Scan | 形成 P20-B2-01～P20-B2-09：默认定位/700km、综合排序、旧“我要这辆车”、Consultation CANCELLED 第五主状态、Priority 自动 visibility/内部术语、LIMITED 二次查看价格、普通分享固定 TTL/权限继承/第二套 Share Detail、Waitlist 保证排名/自动晋升、LockRequest 客户端主动撤回/独立进度页。 | PENDING_USER_REVIEW；FALSE_DEPRECATION_COUNT=0；不把 Current/Low-Fi 缺承载误判为废弃。 | R10 + PDM-10/13/14/15/18 Final + M16 | 2026-10-06 |
| PDM20-DEC-B2-01 | PDM-20 | P20-B2-01 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B2-01 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi stale carrier 恢复。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认指型” | 2026-10-06 |
| PDM20-DEC-B2-02 | PDM-20 | P20-B2-02 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B2-02 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi stale carrier 恢复。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认指型” | 2026-10-06 |
| PDM20-DEC-B2-03 | PDM-20 | P20-B2-03 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B2-03 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi stale carrier 恢复。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认指型” | 2026-10-06 |
| PDM20-DEC-B2-04 | PDM-20 | P20-B2-04 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B2-04 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi stale carrier 恢复。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认指型” | 2026-10-06 |
| PDM20-DEC-B2-05 | PDM-20 | P20-B2-05 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B2-05 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi stale carrier 恢复。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认指型” | 2026-10-06 |
| PDM20-DEC-B2-06 | PDM-20 | P20-B2-06 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B2-06 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi stale carrier 恢复。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认指型” | 2026-10-06 |
| PDM20-DEC-B2-07 | PDM-20 | P20-B2-07 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B2-07 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi stale carrier 恢复。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认指型” | 2026-10-06 |
| PDM20-DEC-B2-08 | PDM-20 | P20-B2-08 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B2-08 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi stale carrier 恢复。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认指型” | 2026-10-06 |
| PDM20-DEC-B2-09 | PDM-20 | P20-B2-09 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B2-09 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi stale carrier 恢复。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认指型” | 2026-10-06 |
| PDM20-GATE-B2 | PDM-20 | Batch 2 Gate | P20-B2-01～P20-B2-09 全部批准并执行；Reverse Conflict Scan PASS；FALSE_DEPRECATION_COUNT=0；14/14 incoming handoff 继续 HANDOFF_ACCEPTED。 | Batch 2 PASS；允许进入 Batch 3 用户审查；IA/Low-Fi/Engineering 不施工。 | PDM-20 工作版 | 2026-10-06 |
| PDM20-SCAN-B3 | PDM-20 | Batch 3 Conflict Isolation | 形成 8 条后续明确新增/变更：首入 owner、分享/转介绍归属、LockRequest 6h、竞争申请自动候补、普通 Lock vs Priority-origin Lock 客户可见性、真实 Deposit 后倒计时投影、C02 Application/ending request、PDM-19 Refund closed/交易资金安全投影。 | PENDING_USER_REVIEW；MISCLASSIFIED_PRODUCT_CHOICE=0；Current/Low-Fi 纯载体缺失留 Batch 4/Prefinal。 | PDM-01/03/11/18/19 Final + M16 + PDM-20 工作版 | 2026-10-06 |
| PDM20-DEC-B3-01 | PDM-20 | P20-B3-01 | Batch 3 后续明确新增/变更规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B3-01 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B3-02 | PDM-20 | P20-B3-02 | Batch 3 后续明确新增/变更规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B3-02 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B3-03 | PDM-20 | P20-B3-03 | Batch 3 后续明确新增/变更规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B3-03 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B3-04 | PDM-20 | P20-B3-04 | Batch 3 后续明确新增/变更规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B3-04 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B3-05 | PDM-20 | P20-B3-05 | Batch 3 后续明确新增/变更规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B3-05 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B3-06 | PDM-20 | P20-B3-06 | Batch 3 后续明确新增/变更规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B3-06 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B3-07 | PDM-20 | P20-B3-07 | Batch 3 后续明确新增/变更规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B3-07 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B3-08 | PDM-20 | P20-B3-08 | Batch 3 后续明确新增/变更规则已由用户全部同意并确认执行；具体语义以 PDM-20 工作版对应 P20-B3-08 正文为准。 | USER_APPROVED / APPLIED；不得被旧 R10 / Current / Low-Fi carrier 反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-GATE-B3 | PDM-20 | Batch 3 Gate | P20-B3-01～P20-B3-08 全部批准并执行；Conflict Isolation PASS；MISCLASSIFIED_PRODUCT_CHOICE=0；14/14 incoming handoff 继续 HANDOFF_ACCEPTED。 | Batch 3 PASS；允许进入 Batch 4 用户审查；IA/Low-Fi/Engineering 不施工。 | PDM-20 工作版 | 2026-10-06 |
| PDM20-SCAN-B4 | PDM-20 | Batch 4 Gap/Choice Scan | 形成 10 条最终客户端裁决候选：详情 CTA、列表占用标签、详情顾问/参数/档案/车况、C03 真人页面、服务/购买说明、分享内容配置、历史详情/旧 share、手机号拒绝临时表单、通用加载失败/复制权限、价格格式/顶部导航。 | PENDING_USER_REVIEW；推荐 1A～10A；completed-PDM mutation=0；new domain state machine=0。 | M16 + R10 + PDM-01/03/07/10/11/13/14/15/18/19 Final + PDM-20 工作版 | 2026-10-06 |
| PDM20-DEC-B4-01 | PDM-20 | P20-B4-01 | Batch 4 最终客户端裁决按推荐 A 方案通过，用户“全部同意”并确认执行；具体语义以 PDM-20 工作版对应 P20-B4-01 正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得由 Current/Low-Fi 泛化壳反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B4-02 | PDM-20 | P20-B4-02 | Batch 4 最终客户端裁决按推荐 A 方案通过，用户“全部同意”并确认执行；具体语义以 PDM-20 工作版对应 P20-B4-02 正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得由 Current/Low-Fi 泛化壳反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B4-03 | PDM-20 | P20-B4-03 | Batch 4 最终客户端裁决按推荐 A 方案通过，用户“全部同意”并确认执行；具体语义以 PDM-20 工作版对应 P20-B4-03 正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得由 Current/Low-Fi 泛化壳反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B4-04 | PDM-20 | P20-B4-04 | Batch 4 最终客户端裁决按推荐 A 方案通过，用户“全部同意”并确认执行；具体语义以 PDM-20 工作版对应 P20-B4-04 正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得由 Current/Low-Fi 泛化壳反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B4-05 | PDM-20 | P20-B4-05 | Batch 4 最终客户端裁决按推荐 A 方案通过，用户“全部同意”并确认执行；具体语义以 PDM-20 工作版对应 P20-B4-05 正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得由 Current/Low-Fi 泛化壳反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B4-06 | PDM-20 | P20-B4-06 | Batch 4 最终客户端裁决按推荐 A 方案通过，用户“全部同意”并确认执行；具体语义以 PDM-20 工作版对应 P20-B4-06 正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得由 Current/Low-Fi 泛化壳反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B4-07 | PDM-20 | P20-B4-07 | Batch 4 最终客户端裁决按推荐 A 方案通过，用户“全部同意”并确认执行；具体语义以 PDM-20 工作版对应 P20-B4-07 正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得由 Current/Low-Fi 泛化壳反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B4-08 | PDM-20 | P20-B4-08 | Batch 4 最终客户端裁决按推荐 A 方案通过，用户“全部同意”并确认执行；具体语义以 PDM-20 工作版对应 P20-B4-08 正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得由 Current/Low-Fi 泛化壳反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B4-09 | PDM-20 | P20-B4-09 | Batch 4 最终客户端裁决按推荐 A 方案通过，用户“全部同意”并确认执行；具体语义以 PDM-20 工作版对应 P20-B4-09 正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得由 Current/Low-Fi 泛化壳反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-DEC-B4-10 | PDM-20 | P20-B4-10 | Batch 4 最终客户端裁决按推荐 A 方案通过，用户“全部同意”并确认执行；具体语义以 PDM-20 工作版对应 P20-B4-10 正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得由 Current/Low-Fi 泛化壳反向覆盖。 | PDM-20 工作版 + 2026-10-06 用户“全部同意”并“确认执行” | 2026-10-06 |
| PDM20-GATE-B4 | PDM-20 | Batch 4 Gate | P20-B4-01～P20-B4-10 全部按 1A～10A 批准并执行；LOCAL_PRODUCT_CHOICE_UNRESOLVED=0；14/14 incoming handoff 继续 HANDOFF_ACCEPTED。 | Batch 4 PASS；进入 Final 前完整性复核，不直接跳 Final。 | PDM-20 工作版 | 2026-10-06 |
| PDM20-PREFINAL-R1 | PDM-20 | Final 前完整性复核 R1 | Source→Atom / Atom→Source / M16 / incoming handoff / completed-PDM invariant / negative claims / outgoing handoff 扫描完成；结果 REPAIR_REQUIRED / NO_HARD_CONFLICT。 | MISSING_RULE_UNRESOLVED=3；SEMANTIC_DETAIL_GAP_UNRESOLVED=3；CROSS_PDM_ALIGNMENT_GAP=1；OUTGOING_HANDOFF_GAP=1_GROUP；repair=P20-LIA-01～P20-LIA-07；Final candidate NOT_READY。 | 07_重建工作区/PDM-20_Final前完整性复核_R1_2026-10-06.md | 2026-10-06 |
| PDM20-DEC-LIA-01 | PDM-20 | P20-LIA-01 | Prefinal R1 修复项已由用户“全部同意”并明确“确认执行”；具体语义以 PDM-20 工作版对应 P20-LIA-01 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/alignment/handoff gap。 | PDM-20 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM20-DEC-LIA-02 | PDM-20 | P20-LIA-02 | Prefinal R1 修复项已由用户“全部同意”并明确“确认执行”；具体语义以 PDM-20 工作版对应 P20-LIA-02 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/alignment/handoff gap。 | PDM-20 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM20-DEC-LIA-03 | PDM-20 | P20-LIA-03 | Prefinal R1 修复项已由用户“全部同意”并明确“确认执行”；具体语义以 PDM-20 工作版对应 P20-LIA-03 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/alignment/handoff gap。 | PDM-20 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM20-DEC-LIA-04 | PDM-20 | P20-LIA-04 | Prefinal R1 修复项已由用户“全部同意”并明确“确认执行”；具体语义以 PDM-20 工作版对应 P20-LIA-04 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/alignment/handoff gap。 | PDM-20 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM20-DEC-LIA-05 | PDM-20 | P20-LIA-05 | Prefinal R1 修复项已由用户“全部同意”并明确“确认执行”；具体语义以 PDM-20 工作版对应 P20-LIA-05 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/alignment/handoff gap。 | PDM-20 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM20-DEC-LIA-06 | PDM-20 | P20-LIA-06 | Prefinal R1 修复项已由用户“全部同意”并明确“确认执行”；具体语义以 PDM-20 工作版对应 P20-LIA-06 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/alignment/handoff gap。 | PDM-20 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM20-DEC-LIA-07 | PDM-20 | P20-LIA-07 | Prefinal R1 修复项已由用户“全部同意”并明确“确认执行”；具体语义以 PDM-20 工作版对应 P20-LIA-07 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/alignment/handoff gap。 | PDM-20 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM20-GATE-R1-REPAIR | PDM-20 | Prefinal R1 Repair Gate | P20-LIA-01～P20-LIA-07 全部批准并执行；7/7 repair closed；PDM-20→PDM-21/22/24/25 outgoing handoff 已登记 HANDOFF_OPEN；stale carrier 已登记。 | PASS / USER_APPROVED / APPLIED；14/14 incoming 继续 HANDOFF_ACCEPTED；IA/Low-Fi/Engineering 不施工。 | PDM-20 工作版 + CROSS_PDM_HANDOFF_REGISTER | 2026-10-06 |
| PDM20-PREFINAL-R2 | PDM-20 | Final 前完整性复核 R2 | 53 个正式规则/裁决单元完成 Source→Atom、Atom→Source、Semantic Completeness、M16 全域、Completed-PDM Invariant、Handoff Integrity、Negative Claim Proof 复核。 | PASS / FINAL_CANDIDATE_READY；missing=0；semantic gap=0；completed-PDM conflict=0；incoming gap=0；outgoing gap=0；local product choice=0。 | 07_重建工作区/PDM-20_Final前完整性复核_R2_2026-10-06.md | 2026-10-06 |
| PDM20-FINAL-OVERVIEW | PDM-20 | Final Domain Overview | PDM-20 最终完整规则总览已获用户最终批准。 | USER_FINAL_APPROVED。 | 07_重建工作区/PDM-20_最终完整规则总览_待用户批准.md | 2026-10-06 |

| PDM20-FINAL-APPROVAL | PDM-20 | Final Approval | 用户最终批准 PDM-20 Final Domain Overview。 | USER_FINAL_APPROVED。 | PDM-20 Final Domain Overview | 2026-10-06 |
| PDM20-FINAL-CLOSEOUT | PDM-20 | Final Closeout | 用户明确确认执行 Final closeout；正式 Final、Final Integrity、incoming handoff closure 与 source backwrite 全部完成。 | COMPLETE / INTEGRITY_PASS；下一步 PDM-21 Startup Gate。 | PDM-20 Final + Final Integrity | 2026-10-06 |
| PDM21-CORE-R00 | PDM-21 | P21-R00 | PDM-21 定位为员工端产品体验、工作台编排与 Employee Action Projection 的唯一 Authority，负责 E01～E08 的导航、卡片、优先级、状态展示与合法业务动作入口；不重新定义 PDM-01～20 已冻结的底层业务真相、权限或责任关系。 | USER_APPROVED / APPLIED；页面可见与 Internal Mode 均不得视为授权，所有 mutation 继续消费对应 completed PDM Guard。 | 9/19 R10/R11 + 001～078 M15/M17 + Current IA/Low-Fi + PDM-01～20 Final + 2026-10-06 用户“同意”并“确认执行” | 2026-10-06 |
| PDM21-STARTUP-GATE | PDM-21 | Startup Gate | P21-R00 已 USER_APPROVED / APPLIED；CROSS_PDM_HANDOFF_REGISTER 中 target=PDM-21 实际 19 条，19/19 已 HANDOFF_ACCEPTED；completed-PDM hard conflict=0；incoming handoff gap=0；Global Invariant conflict=0；形成 P21-A01～P21-A20 Batch 1 候选。 | R10/R11 与 completed PDM 冲突项、Current/Low-Fi stale carrier、缺失导航/动作不在 Startup Gate 偷渡；IA/Low-Fi/Engineering 不施工。 | 07_重建工作区/PDM-21_员工工作台车辆列表客户中心内部模式敏感动作裁剪_规则原子重建_工作版.md | 2026-10-06 |
| PDM21-GATE-B1 | PDM-21 | Batch 1 Gate | 用户对 P21-A01～P21-A20 明确“全部同意”，随后以“确认之前”（结合本窗口连续上下文识别为确认执行）授权落仓；20 条稳定员工端基础规则正式生效。 | PASS / USER_APPROVED / APPLIED；允许准备 Batch 2，不自动批准 Batch 2。 | PDM-21 工作版 + 2026-10-06 用户裁决 | 2026-10-06 |
| PDM21-GATE-B2 | PDM-21 | Batch 2 Gate | 用户在同一消息中对 P21-B2-01～P21-B2-09 明确“全部同意确认执行”；9 条旧规则废弃/替代项全部正式生效。 | PASS / USER_APPROVED / APPLIED；Reverse Conflict Scan PASS，FALSE_DEPRECATION_COUNT=0；允许准备 Batch 3，不自动批准 Batch 3。 | PDM-21 工作版 + 2026-10-06 用户裁决 | 2026-10-06 |
| PDM21-GATE-B3 | PDM-21 | Batch 3 Gate | 用户对 P21-B3-01～P21-B3-10 明确“全部同意”，随后明确“确认执行”；10 条已冻结上游语义的员工端补全项全部正式生效。 | PASS / USER_APPROVED / APPLIED；Conflict Isolation PASS，MISCLASSIFIED_PRODUCT_CHOICE=0；允许进入 Batch 4 用户裁决。 | PDM-21 工作版 + 2026-10-06 用户裁决 | 2026-10-06 |
| PDM21-SCAN-B4 | PDM-21 | Batch 4 Gap / Choice Scan | 形成 7 条员工端最终产品选择：4S Internal Mode 承载、敏感 Action 页面归位、隐藏车源入口、一键转名邦确认、Consultation 即将超时阈值、Internal Mode 后台超时退出、E01 多类强待办统一排序。 | PENDING_USER_REVIEW；推荐 1A/2A/3A/4A/5A/6A/7A；completed-PDM mutation=0；new domain state machine=0。 | PDM-21 工作版 + R10/R11 + PDM-02/04/10/15 Final | 2026-10-06 |
| PDM21-GATE-B4 | PDM-21 | Batch 4 Gate | 用户裁决 P21-B4-01～P21-B4-07 全部采用 A：1A～7A，并随后明确“确认执行”；4S 同 Internal Mode 裁剪、敏感动作归位、更多→隐藏车源、转名邦确认、自适应即将超时阈值、后台5分钟退出、deadline-first 强待办排序正式生效。 | PASS / USER_APPROVED / APPLIED；LOCAL_PRODUCT_CHOICE_UNRESOLVED=0；completed-PDM mutation=0。 | PDM-21 工作版 + 2026-10-06 用户裁决 | 2026-10-06 |
| PDM21-PREFINAL-R1 | PDM-21 | Final 前完整性复核 R1 | 47 个正式规则/裁决单元完成 Source→Atom、Atom→Source、Semantic Completeness、M15/M17/M16、Completed-PDM invariant、19 条 incoming handoff、negative claim 与 outgoing handoff 扫描。 | REPAIR_REQUIRED / NO_HARD_CONFLICT；missing=5；semantic detail=3；incoming landing gap=7；outgoing handoff gap=1 group；形成 P21-LIA-01～P21-LIA-09。 | 07_重建工作区/PDM-21_Final前完整性复核_R1_2026-10-06.md | 2026-10-06 |
| PDM21-DEC-LIA-01 | PDM-21 | P21-LIA-01 | Prefinal R1 修复项已由用户“同意”并随后明确“确认执行”；具体语义以 PDM-21 工作版对应 P21-LIA-01 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-21 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM21-DEC-LIA-02 | PDM-21 | P21-LIA-02 | Prefinal R1 修复项已由用户“同意”并随后明确“确认执行”；具体语义以 PDM-21 工作版对应 P21-LIA-02 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-21 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM21-DEC-LIA-03 | PDM-21 | P21-LIA-03 | Prefinal R1 修复项已由用户“同意”并随后明确“确认执行”；具体语义以 PDM-21 工作版对应 P21-LIA-03 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-21 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM21-DEC-LIA-04 | PDM-21 | P21-LIA-04 | Prefinal R1 修复项已由用户“同意”并随后明确“确认执行”；具体语义以 PDM-21 工作版对应 P21-LIA-04 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-21 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM21-DEC-LIA-05 | PDM-21 | P21-LIA-05 | Prefinal R1 修复项已由用户“同意”并随后明确“确认执行”；具体语义以 PDM-21 工作版对应 P21-LIA-05 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-21 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM21-DEC-LIA-06 | PDM-21 | P21-LIA-06 | Prefinal R1 修复项已由用户“同意”并随后明确“确认执行”；具体语义以 PDM-21 工作版对应 P21-LIA-06 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-21 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM21-DEC-LIA-07 | PDM-21 | P21-LIA-07 | Prefinal R1 修复项已由用户“同意”并随后明确“确认执行”；具体语义以 PDM-21 工作版对应 P21-LIA-07 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-21 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM21-DEC-LIA-08 | PDM-21 | P21-LIA-08 | Prefinal R1 修复项已由用户“同意”并随后明确“确认执行”；具体语义以 PDM-21 工作版对应 P21-LIA-08 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-21 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM21-DEC-LIA-09 | PDM-21 | P21-LIA-09 | Prefinal R1 修复项已由用户“同意”并随后明确“确认执行”；具体语义以 PDM-21 工作版对应 P21-LIA-09 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-21 工作版 + 2026-10-06 用户批准与执行 | 2026-10-06 |
| PDM21-GATE-R1-REPAIR | PDM-21 | Prefinal R1 Repair Gate | P21-LIA-01～P21-LIA-09 全部批准并执行；9/9 repair closed；PDM-21→PDM-23/PDM-25 outgoing handoff 已登记 HANDOFF_OPEN。 | PASS / USER_APPROVED / APPLIED；19/19 incoming 继续 HANDOFF_ACCEPTED；IA/Low-Fi/Engineering 不施工。 | PDM-21 工作版 + CROSS_PDM_HANDOFF_REGISTER | 2026-10-06 |
| PDM21-PREFINAL-R2 | PDM-21 | Final 前完整性复核 R2 | 56 个正式规则/裁决单元完成 Source→Atom、Atom→Source、Semantic Completeness、M15/M17/M16、Completed-PDM Invariant、Handoff Integrity、Negative Claim Proof 复核。 | PASS / FINAL_CANDIDATE_READY；missing=0；semantic gap=0；completed-PDM conflict=0；incoming gap=0；outgoing gap=0；local product choice=0。 | 07_重建工作区/PDM-21_Final前完整性复核_R2_2026-10-06.md | 2026-10-06 |
| PDM21-FINAL-OVERVIEW | PDM-21 | Final Domain Overview | 用户明确“最终批准确认执行”，其中“最终批准”完成 PDM-21 Final Domain Overview 最终审批。 | USER_FINAL_APPROVED。 | 07_重建工作区/PDM-21_最终完整规则总览_待用户批准.md | 2026-10-06 |
| PDM21-FINAL-CLOSEOUT | PDM-21 | Final Closeout | 用户在同一消息明确“确认执行”；正式 Final、Final Integrity、19/19 incoming handoff closure、19/19 source backwrite 全部完成；PDM-23/PDM-25 outgoing handoff 保持 OPEN。 | COMPLETE / INTEGRITY_PASS；下一步 PDM-22 Startup Gate。 | PDM-21 Final + Final Integrity + CROSS_PDM_HANDOFF_REGISTER | 2026-10-06 |

| PDM22-CORE-R00 | PDM-22 | P22-R00 | PDM-22 定位为名邦 PC 后台业务管理承载、业务配置承载、采集系统 / Integration API 接入及上游运行管理的唯一 Authority；负责把 PDM-01～21 已冻结业务规则落实为 PC 管理/配置/运行 carrier，不重新定义各业务域主状态、生命周期或业务 Authority。P03 明确承载三个固定车源同步 API 的启停/名邦侧 credential/调用统计/运行状态，并承接 Collector 取号结果经名邦既有 Integration API 回传后的 publisher 电话缓存与诊断；不得恢复名邦主动调用 Collector Phone API、Collector Base URL / Phone Path 等旧网络方向。 | 用户已明确同意并于 2026-10-07“确认执行”；P22-R00 = USER_APPROVED / APPLIED。 | 9/19 R12 + 001～078 M18/M15/M07 + PDM-01～21 Final + CROSS_PDM_HANDOFF_REGISTER | 2026-10-07 |
| PDM22-STARTUP-GATE | PDM-22 | Startup Gate | P22-R00 已 USER_APPROVED / APPLIED；target=PDM-22 的 18 条 incoming handoff 全部 HANDOFF_ACCEPTED；completed-PDM hard conflict=0；incoming handoff gap=0；global invariant conflict=0；建立 P22-A01～P22-A22 Batch 1 候选。 | 当前只进入 Batch 1 用户审查；未经用户批准与明确执行不得进入 Batch 2；IA/Low-Fi/Engineering 不施工。 | 07_重建工作区/PDM-22_PC后台信息架构业务管理配置归属上游运行管理_规则原子重建_工作版.md | 2026-10-07 |
| PDM22-DEC-A01 | PDM-22 | P22-A01 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A02 | PDM-22 | P22-A02 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A03 | PDM-22 | P22-A03 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A04 | PDM-22 | P22-A04 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A05 | PDM-22 | P22-A05 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A06 | PDM-22 | P22-A06 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A07 | PDM-22 | P22-A07 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A08 | PDM-22 | P22-A08 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A09 | PDM-22 | P22-A09 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A10 | PDM-22 | P22-A10 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A11 | PDM-22 | P22-A11 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A12 | PDM-22 | P22-A12 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A13 | PDM-22 | P22-A13 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A14 | PDM-22 | P22-A14 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A15 | PDM-22 | P22-A15 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A16 | PDM-22 | P22-A16 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A17 | PDM-22 | P22-A17 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A18 | PDM-22 | P22-A18 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A19 | PDM-22 | P22-A19 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A20 | PDM-22 | P22-A20 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A21 | PDM-22 | P22-A21 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-DEC-A22 | PDM-22 | P22-A22 | Batch 1 稳定基础规则经用户全部同意并确认执行，正式进入 PDM-22 当前工作 Authority。 | 保持 P22-R00 边界；不得反向改写 PDM-01～21 Final；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 Batch 1 + 2026-10-07 用户同意并确认执行 | 2026-10-07 |
| PDM22-GATE-B1 | PDM-22 | Batch 1 Gate | 用户对 P22-A01～P22-A22 全部同意并确认执行；22 条稳定基础规则正式进入当前工作 Authority。 | Batch 2 Reverse Conflict Scan 已形成 P22-B2-01～P22-B2-11；FALSE_DEPRECATION_COUNT=0；18 条 incoming handoff 继续 HANDOFF_ACCEPTED；IA/Low-Fi/Engineering 不施工。 | 07_重建工作区/PDM-22_PC后台信息架构业务管理配置归属上游运行管理_规则原子重建_工作版.md + 2026-10-07 用户执行授权 | 2026-10-07 |

| PDM22-DEC-ADD-01 | PDM-22 | P22-ADD-01 | PC 网页后台使用独立网页认证；现有 Employee 可在同一 employee_id 上开通“登录账号 + 密码”PC 凭证。PC 凭证只增加认证入口，不创建第二 Employee，不增加 permission/data scope；登录后继续读取原 employee_id 当前角色、权限、范围、账号与对象状态；Employee 停用后 PC 登录及旧登录态立即失效。System Admin 继续使用独立系统身份/凭证，不与 Employee PC 登录合并；4S 默认不开 PC，仅明确授予 PC 车辆管理能力后可启用对应登录且 hard DENY 不变。 | USER_APPROVED / APPLIED；不改写 PDM-02 employee_id 身份 Authority；登录账号具体命名、密码强度/MFA/Session 等工程细节不在本 PDM 写死。 | 2026-10-07 用户确认“根据销售身份再添加账号和密码即可登录后台”并随后明确“确认执行” | 2026-10-07 |
| PDM22-DEC-B2-01 | PDM-22 | P22-B2-01 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户确认无其他争议并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得由旧 R12 / Current IA / Low-Fi stale carrier 恢复。 | PDM-22 工作版 + 2026-10-07 用户确认除 B2-01 外其余无问题并“确认执行” | 2026-10-07 |
| PDM22-DEC-B2-02 | PDM-22 | P22-B2-02 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户确认无其他争议并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得由旧 R12 / Current IA / Low-Fi stale carrier 恢复。 | PDM-22 工作版 + 2026-10-07 用户确认除 B2-01 外其余无问题并“确认执行” | 2026-10-07 |
| PDM22-DEC-B2-03 | PDM-22 | P22-B2-03 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户确认无其他争议并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得由旧 R12 / Current IA / Low-Fi stale carrier 恢复。 | PDM-22 工作版 + 2026-10-07 用户确认除 B2-01 外其余无问题并“确认执行” | 2026-10-07 |
| PDM22-DEC-B2-04 | PDM-22 | P22-B2-04 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户确认无其他争议并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得由旧 R12 / Current IA / Low-Fi stale carrier 恢复。 | PDM-22 工作版 + 2026-10-07 用户确认除 B2-01 外其余无问题并“确认执行” | 2026-10-07 |
| PDM22-DEC-B2-05 | PDM-22 | P22-B2-05 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户确认无其他争议并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得由旧 R12 / Current IA / Low-Fi stale carrier 恢复。 | PDM-22 工作版 + 2026-10-07 用户确认除 B2-01 外其余无问题并“确认执行” | 2026-10-07 |
| PDM22-DEC-B2-06 | PDM-22 | P22-B2-06 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户确认无其他争议并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得由旧 R12 / Current IA / Low-Fi stale carrier 恢复。 | PDM-22 工作版 + 2026-10-07 用户确认除 B2-01 外其余无问题并“确认执行” | 2026-10-07 |
| PDM22-DEC-B2-07 | PDM-22 | P22-B2-07 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户确认无其他争议并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得由旧 R12 / Current IA / Low-Fi stale carrier 恢复。 | PDM-22 工作版 + 2026-10-07 用户确认除 B2-01 外其余无问题并“确认执行” | 2026-10-07 |
| PDM22-DEC-B2-08 | PDM-22 | P22-B2-08 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户确认无其他争议并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得由旧 R12 / Current IA / Low-Fi stale carrier 恢复。 | PDM-22 工作版 + 2026-10-07 用户确认除 B2-01 外其余无问题并“确认执行” | 2026-10-07 |
| PDM22-DEC-B2-09 | PDM-22 | P22-B2-09 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户确认无其他争议并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得由旧 R12 / Current IA / Low-Fi stale carrier 恢复。 | PDM-22 工作版 + 2026-10-07 用户确认除 B2-01 外其余无问题并“确认执行” | 2026-10-07 |
| PDM22-DEC-B2-10 | PDM-22 | P22-B2-10 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户确认无其他争议并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得由旧 R12 / Current IA / Low-Fi stale carrier 恢复。 | PDM-22 工作版 + 2026-10-07 用户确认除 B2-01 外其余无问题并“确认执行” | 2026-10-07 |
| PDM22-DEC-B2-11 | PDM-22 | P22-B2-11 | Batch 2 明确废弃 / Superseded / DO_NOT_RESTORE 规则已由用户确认无其他争议并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得由旧 R12 / Current IA / Low-Fi stale carrier 恢复。 | PDM-22 工作版 + 2026-10-07 用户确认除 B2-01 外其余无问题并“确认执行” | 2026-10-07 |
| PDM22-GATE-B2 | PDM-22 | Batch 2 Gate | P22-B2-01～P22-B2-11 全部批准并执行；Reverse Conflict Scan PASS；FALSE_DEPRECATION_COUNT=0。 | Batch 2 PASS；18/18 incoming handoff 继续 HANDOFF_ACCEPTED；IA/Low-Fi/Engineering 不施工。 | 07_重建工作区/PDM-22_PC后台信息架构业务管理配置归属上游运行管理_规则原子重建_工作版.md | 2026-10-07 |
| PDM22-SCAN-B3 | PDM-22 | Batch 3 Conflict Isolation | 形成 P22-B3-01～P22-B3-09：System Admin 自身账号治理、Customer 停用/恢复治理、隐藏规则中心、LIMITED/UNLIMITED 与临时加次、LockRequest 自动候补、Priority-origin Lock 可见性、Refund 直接关闭、电话 source_type 裁剪、Transaction 成交价/correction 历史。 | PENDING_USER_REVIEW；MISCLASSIFIED_PRODUCT_CHOICE=0；NEW_DOMAIN_STATE_MACHINE=0；P22-ADD-01 已单独批准执行不重复审查。 | PDM-01/02/04/09/10/11/18/19 Final + PDM-22 工作版 | 2026-10-07 |
| PDM22-DEC-B3-01 | PDM-22 | P22-B3-01 | Batch 3 已冻结上游语义的 PC carrier 补全项经用户确认并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改变 PDM-01～21 已完成 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 + 2026-10-07 用户确认并“确认执行” | 2026-10-07 |
| PDM22-DEC-B3-02 | PDM-22 | P22-B3-02 | Batch 3 已冻结上游语义的 PC carrier 补全项经用户确认并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改变 PDM-01～21 已完成 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 + 2026-10-07 用户确认并“确认执行” | 2026-10-07 |
| PDM22-DEC-B3-03 | PDM-22 | P22-B3-03 | Batch 3 已冻结上游语义的 PC carrier 补全项经用户确认并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改变 PDM-01～21 已完成 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 + 2026-10-07 用户确认并“确认执行” | 2026-10-07 |
| PDM22-DEC-B3-04 | PDM-22 | P22-B3-04 | Batch 3 已冻结上游语义的 PC carrier 补全项经用户确认并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改变 PDM-01～21 已完成 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 + 2026-10-07 用户确认并“确认执行” | 2026-10-07 |
| PDM22-DEC-B3-05 | PDM-22 | P22-B3-05 | Batch 3 已冻结上游语义的 PC carrier 补全项经用户确认并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改变 PDM-01～21 已完成 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 + 2026-10-07 用户确认并“确认执行” | 2026-10-07 |
| PDM22-DEC-B3-06 | PDM-22 | P22-B3-06 | Batch 3 已冻结上游语义的 PC carrier 补全项经用户确认并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改变 PDM-01～21 已完成 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 + 2026-10-07 用户确认并“确认执行” | 2026-10-07 |
| PDM22-DEC-B3-07 | PDM-22 | P22-B3-07 | Batch 3 已冻结上游语义的 PC carrier 补全项经用户确认并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改变 PDM-01～21 已完成 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 + 2026-10-07 用户确认并“确认执行” | 2026-10-07 |
| PDM22-DEC-B3-08 | PDM-22 | P22-B3-08 | Batch 3 已冻结上游语义的 PC carrier 补全项经用户确认并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改变 PDM-01～21 已完成 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 + 2026-10-07 用户确认并“确认执行” | 2026-10-07 |
| PDM22-DEC-B3-09 | PDM-22 | P22-B3-09 | Batch 3 已冻结上游语义的 PC carrier 补全项经用户确认并明确执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改变 PDM-01～21 已完成 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 + 2026-10-07 用户确认并“确认执行” | 2026-10-07 |
| PDM22-GATE-B3 | PDM-22 | Batch 3 Gate | P22-B3-01～P22-B3-09 全部批准并执行；Conflict Isolation PASS；MISCLASSIFIED_PRODUCT_CHOICE=0；NEW_DOMAIN_STATE_MACHINE=0。 | Batch 3 PASS；允许进入 Batch 4 最终缺口 / 产品选择扫描。 | 07_重建工作区/PDM-22_PC后台信息架构业务管理配置归属上游运行管理_规则原子重建_工作版.md | 2026-10-07 |
| PDM22-SCAN-B4 | PDM-22 | Batch 4 Final Gap / Choice Scan | 形成 P22-B4-01～P22-B4-08：Application/Demand PC 归位、公海批量治理入口、服务/购买说明富文本 carrier、Employee PC 密码生命周期、P03 同步/电话诊断分页、隐藏规则入口、Dashboard scope 防泄露、配置变更 reason 边界。 | PENDING_USER_REVIEW；推荐 1A/2A/4A/5A/6A；B4-03/07/08 为稳定补漏；LOCAL_PRODUCT_CHOICE_UNRESOLVED=5。 | PDM-02/11/17/20 Final + R12 + PDM-22 工作版 | 2026-10-07 |
| PDM22-DEC-B4-01 | PDM-22 | P22-B4-01 | Batch 4 最终缺口 / 产品承载项经用户全部同意并确认执行；具体语义以 PDM-22 工作版对应正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得改写 PDM-01～21 completed Authority。 | PDM-22 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM22-DEC-B4-02 | PDM-22 | P22-B4-02 | Batch 4 最终缺口 / 产品承载项经用户全部同意并确认执行；具体语义以 PDM-22 工作版对应正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得改写 PDM-01～21 completed Authority。 | PDM-22 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM22-DEC-B4-03 | PDM-22 | P22-B4-03 | Batch 4 最终缺口 / 产品承载项经用户全部同意并确认执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 PDM-01～21 completed Authority。 | PDM-22 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM22-DEC-B4-04 | PDM-22 | P22-B4-04 | Batch 4 最终缺口 / 产品承载项经用户全部同意并确认执行；具体语义以 PDM-22 工作版对应正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得改写 PDM-01～21 completed Authority。 | PDM-22 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM22-DEC-B4-05 | PDM-22 | P22-B4-05 | Batch 4 最终缺口 / 产品承载项经用户全部同意并确认执行；具体语义以 PDM-22 工作版对应正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得改写 PDM-01～21 completed Authority。 | PDM-22 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM22-DEC-B4-06 | PDM-22 | P22-B4-06 | Batch 4 最终缺口 / 产品承载项经用户全部同意并确认执行；具体语义以 PDM-22 工作版对应正文为准。 | CHOICE=A / USER_APPROVED / APPLIED；不得改写 PDM-01～21 completed Authority。 | PDM-22 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM22-DEC-B4-07 | PDM-22 | P22-B4-07 | Batch 4 最终缺口 / 产品承载项经用户全部同意并确认执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 PDM-01～21 completed Authority。 | PDM-22 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM22-DEC-B4-08 | PDM-22 | P22-B4-08 | Batch 4 最终缺口 / 产品承载项经用户全部同意并确认执行；具体语义以 PDM-22 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 PDM-01～21 completed Authority。 | PDM-22 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM22-GATE-B4 | PDM-22 | Batch 4 Gate | P22-B4-01～P22-B4-08 全部批准并执行；选择 1A/2A/4A/5A/6A，B4-03/07/08 稳定补漏通过；LOCAL_PRODUCT_CHOICE_UNRESOLVED=0。 | Batch 4 PASS；进入 Final 前完整性复核 R1。 | PDM-22 工作版 | 2026-10-07 |
| PDM22-PREFINAL-R1 | PDM-22 | Final 前完整性复核 R1 | Source→Atom / Atom→Source / Semantic Completeness / completed-PDM invariant / 18 incoming handoff / negative claim / outgoing handoff 扫描完成。 | REPAIR_REQUIRED / NO_HARD_CONFLICT；missing=2；semantic gap=3；incoming landing gap=3；outgoing handoff gap=1 group；repair=P22-LIA-01～P22-LIA-06；Final candidate NOT_READY。 | 07_重建工作区/PDM-22_Final前完整性复核_R1_2026-10-07.md | 2026-10-07 |
| PDM22-DEC-LIA-01 | PDM-22 | P22-LIA-01 | Prefinal R1 修复项已由用户“全部同意”并明确“确认执行”；具体语义以 PDM-22 工作版对应 LIA 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-22 工作版 + 2026-10-07 用户批准与执行 | 2026-10-07 |
| PDM22-DEC-LIA-02 | PDM-22 | P22-LIA-02 | Prefinal R1 修复项已由用户“全部同意”并明确“确认执行”；具体语义以 PDM-22 工作版对应 LIA 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-22 工作版 + 2026-10-07 用户批准与执行 | 2026-10-07 |
| PDM22-DEC-LIA-03 | PDM-22 | P22-LIA-03 | Prefinal R1 修复项已由用户“全部同意”并明确“确认执行”；具体语义以 PDM-22 工作版对应 LIA 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-22 工作版 + 2026-10-07 用户批准与执行 | 2026-10-07 |
| PDM22-DEC-LIA-04 | PDM-22 | P22-LIA-04 | Prefinal R1 修复项已由用户“全部同意”并明确“确认执行”；具体语义以 PDM-22 工作版对应 LIA 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-22 工作版 + 2026-10-07 用户批准与执行 | 2026-10-07 |
| PDM22-DEC-LIA-05 | PDM-22 | P22-LIA-05 | Prefinal R1 修复项已由用户“全部同意”并明确“确认执行”；具体语义以 PDM-22 工作版对应 LIA 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-22 工作版 + 2026-10-07 用户批准与执行 | 2026-10-07 |
| PDM22-DEC-LIA-06 | PDM-22 | P22-LIA-06 | Prefinal R1 修复项已由用户“全部同意”并明确“确认执行”；具体语义以 PDM-22 工作版对应 LIA 正文为准。 | USER_APPROVED / APPLIED；用于关闭 R1 missing/semantic/incoming landing/outgoing handoff gap。 | PDM-22 工作版 + 2026-10-07 用户批准与执行 | 2026-10-07 |
| PDM22-GATE-R1-REPAIR | PDM-22 | Prefinal R1 Repair Gate | P22-LIA-01～P22-LIA-06 全部批准并执行；6/6 repair closed；PDM-22→PDM-23/PDM-25 outgoing handoff 已登记 HANDOFF_OPEN。 | PASS / USER_APPROVED / APPLIED；18/18 incoming 继续 HANDOFF_ACCEPTED；IA/Low-Fi/Engineering 不施工。 | PDM-22 工作版 + CROSS_PDM_HANDOFF_REGISTER | 2026-10-07 |
| PDM22-PREFINAL-R2 | PDM-22 | Final 前完整性复核 R2 | 58 个正式规则/裁决单元完成 Source→Atom、Atom→Source、Semantic Completeness、completed-PDM invariant、18 incoming handoff、2 outgoing handoff、Negative Claim Proof 复核。 | PASS / FINAL_CANDIDATE_READY；missing=0；semantic gap=0；completed-PDM conflict=0；incoming gap=0；outgoing gap=0；local product choice=0。 | 07_重建工作区/PDM-22_Final前完整性复核_R2_2026-10-07.md | 2026-10-07 |
| PDM22-FINAL-APPROVAL | PDM-22 | Final Domain Overview | 用户对 PDM-22 Final Domain Overview 明确“最终批准确认执行”。 | USER_FINAL_APPROVED / EXECUTION_AUTHORIZED；允许发布正式 Final、关闭 18 条 incoming handoff、完成 source backwrite。 | 2026-10-07 用户最终批准确认执行 | 2026-10-07 |
| PDM22-FINAL-CLOSEOUT | PDM-22 | Final Closeout | 正式 Final 与 Final Integrity 已发布；58 个正式规则/裁决单元进入 Final；18/18 incoming handoff 已 HANDOFF_CLOSED / source_backwrite=YES；HO-P22-P23-001 / HO-P22-P25-001 继续 HANDOFF_OPEN。 | COMPLETE / INTEGRITY_PASS；IA/Low-Fi/Engineering 未施工；当前唯一下一步=PDM-23 Startup Gate。 | 07_重建工作区/PDM-22_最终完整规则.md + PDM-22_最终完整性复核_2026-10-07.md + CROSS_PDM_HANDOFF_REGISTER | 2026-10-07 |
| PDM23-DEC-R00 | PDM-23 | P23-R00 | PDM-23 定位为通知 / 飞书 / 主动提醒 / 夜间免打扰 / Incident 通知投递 / 通知日志的唯一 Authority；通知层只消费业务事件，不得通过 SENT/FAILED/SKIPPED/DEDUPED 等结果改写底层业务事实。 | USER_APPROVED / APPLIED；不得重新定义 Vehicle、Publisher Phone、Recommendation、Consultation、CRM/Public Pool、Lock/Waitlist、Transaction/Refund 等 completed-PDM Authority。 | 2026-10-07 用户“确认执行” | 2026-10-07 |
| PDM23-STARTUP-GATE | PDM-23 | Startup Gate | 已对齐 R12、PDM-04/09/14/15/16/17/18/19/21/22 Final、Current P09 carrier 与 target=PDM-23 的全部 handoff。 | PASS；10/10 incoming handoff = HANDOFF_ACCEPTED；completed-PDM hard conflict=0；incoming gap=0；IA/Low-Fi/Engineering 不施工；Batch 1=P23-A01～P23-A20 待用户审查。 | 07_重建工作区/PDM-23_通知飞书SLA免打扰Incident通知日志_规则原子重建_工作版.md | 2026-10-07 |
| PDM23-DEC-A01 | PDM-23 | P23-A01 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A02 | PDM-23 | P23-A02 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A03 | PDM-23 | P23-A03 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A04 | PDM-23 | P23-A04 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A05 | PDM-23 | P23-A05 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A06 | PDM-23 | P23-A06 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A07 | PDM-23 | P23-A07 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A08 | PDM-23 | P23-A08 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A09 | PDM-23 | P23-A09 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A10 | PDM-23 | P23-A10 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A11 | PDM-23 | P23-A11 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A12 | PDM-23 | P23-A12 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A13 | PDM-23 | P23-A13 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A14 | PDM-23 | P23-A14 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A15 | PDM-23 | P23-A15 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A16 | PDM-23 | P23-A16 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A17 | PDM-23 | P23-A17 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A18 | PDM-23 | P23-A18 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A19 | PDM-23 | P23-A19 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-A20 | PDM-23 | P23-A20 | Batch 1 稳定通知规则经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不得改写 completed-PDM 业务 Authority；IA/Low-Fi/Engineering 不施工。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-GATE-B1 | PDM-23 | Batch 1 Gate | P23-A01～P23-A20 全部批准并执行。 | PASS / USER_APPROVED / APPLIED；允许进入 Batch 2 Reverse Conflict Scan。 | 07_重建工作区/PDM-23_通知飞书SLA免打扰Incident通知日志_规则原子重建_工作版.md | 2026-10-07 |
| PDM23-SCAN-B2 | PDM-23 | Batch 2 Reverse Conflict Scan | 形成 P23-B2-01～P23-B2-14：通知失败≠业务失败、timeout 非主状态、提醒≠必须飞书、废弃固定30分钟、禁普通 Matching/Opportunity/Radar 泛推送、禁 Recommendation 微信状态机、DND 不停业务时钟、不机械补发、deep-link 非授权、点击非 first-response、incident cadence 不臆造、工程重试细节不产品化、System Admin 不自动获通知配置权、飞书映射不改业务责任。 | PENDING_USER_REVIEW；REVERSE_CONFLICT_SCAN=PASS；FALSE_DEPRECATION_COUNT=0。 | R12 + Current IA + PDM-04/09/14/15/16/17/18/19/21/22 Final | 2026-10-07 |
| PDM23-DEC-B2-01 | PDM-23 | P23-B2-01 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B2-02 | PDM-23 | P23-B2-02 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B2-03 | PDM-23 | P23-B2-03 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B2-04 | PDM-23 | P23-B2-04 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B2-05 | PDM-23 | P23-B2-05 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B2-06 | PDM-23 | P23-B2-06 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B2-07 | PDM-23 | P23-B2-07 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B2-08 | PDM-23 | P23-B2-08 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B2-09 | PDM-23 | P23-B2-09 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B2-10 | PDM-23 | P23-B2-10 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B2-11 | PDM-23 | P23-B2-11 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B2-12 | PDM-23 | P23-B2-12 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B2-13 | PDM-23 | P23-B2-13 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B2-14 | PDM-23 | P23-B2-14 | Batch 2 旧规则反向冲突项经用户“全部同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；只清理 stale / deprecated 通知口径，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-GATE-B2 | PDM-23 | Batch 2 Gate | P23-B2-01～P23-B2-14 全部批准并执行；REVERSE_CONFLICT_SCAN=PASS；FALSE_DEPRECATION_COUNT=0。 | PASS / USER_APPROVED / APPLIED；允许进入 Batch 3 配置 / 路由 / 日志完整性扫描。 | 07_重建工作区/PDM-23_通知飞书SLA免打扰Incident通知日志_规则原子重建_工作版.md | 2026-10-07 |
| PDM23-SCAN-B3 | PDM-23 | Batch 3 配置 / 路由 / 日志完整性扫描 | 形成 P23-B3-01～P23-B3-16：Notification Config Guard、提交重验、current recipient route、飞书映射非授权、群路由、发送时 DND、DND 期间事实、event-validity 重验、真实 incident recovery、通知日志与统一审计分层、结果原因、敏感信息最小化、配置仅影响后续、cadence 仅配置后生效、渠道失败不阻断业务、默认不建客户消息中心。 | PENDING_USER_REVIEW；NEW_PRODUCT_CHOICE_INTRODUCED=0；completed-PDM hard conflict=0。 | R12 + Current P09 carrier + PDM-15/17/18/19/21/22 Final | 2026-10-07 |
| PDM23-DEC-B3-01 | PDM-23 | P23-B3-01 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-02 | PDM-23 | P23-B3-02 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-03 | PDM-23 | P23-B3-03 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-04 | PDM-23 | P23-B3-04 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-05 | PDM-23 | P23-B3-05 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-06 | PDM-23 | P23-B3-06 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-07 | PDM-23 | P23-B3-07 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-08 | PDM-23 | P23-B3-08 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-09 | PDM-23 | P23-B3-09 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-10 | PDM-23 | P23-B3-10 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-11 | PDM-23 | P23-B3-11 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-12 | PDM-23 | P23-B3-12 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-13 | PDM-23 | P23-B3-13 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-14 | PDM-23 | P23-B3-14 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-15 | PDM-23 | P23-B3-15 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-DEC-B3-16 | PDM-23 | P23-B3-16 | Batch 3 配置/路由/日志完整性项经用户“同意”并明确“确认执行”；具体语义以 PDM-23 工作版对应正文为准。 | USER_APPROVED / APPLIED；不新增产品选择，不改写 completed-PDM Authority。 | PDM-23 工作版 + 2026-10-07 用户批准并执行 | 2026-10-07 |
| PDM23-GATE-B3 | PDM-23 | Batch 3 Gate | P23-B3-01～P23-B3-16 全部批准并执行；NEW_PRODUCT_CHOICE_INTRODUCED=0。 | PASS / USER_APPROVED / APPLIED；允许进入 Batch 4 / Final-gap scan。 | 07_重建工作区/PDM-23_通知飞书SLA免打扰Incident通知日志_规则原子重建_工作版.md | 2026-10-07 |
| PDM23-SCAN-B4 | PDM-23 | Batch 4 Final-gap Scan | 发现 1 个真实产品承载选择 + 5 个稳定收口项：通用通知模板/渠道矩阵是否建设；个人接收人按业务责任解析；无路由不改派责任；DND 无隐式紧急绕过；统一业务时区；P23→P25 audit/history/timezone handoff。 | PENDING_USER_REVIEW；recommended=1A；outgoing handoff gap=P23→P25 pending approval；completed-PDM hard conflict=0。 | PDM-23 工作版 + CROSS_PDM_HANDOFF_REGISTER + R12 + Current P09 carrier | 2026-10-07 |
| PDM23-WINDOW-HANDOFF-20261007 | PDM-23 | 窗口切换上下文冻结 | 用户要求在上下文接近上限时先把当前仓库进度与本窗口新讨论全部保存，再换窗口继续；旧 P23-B4-01～06 保留但不批准不执行；微信小程序消息、飞书多层开关、员工级总群 SLA 超时通告开关等记为待历史重扫候选。 | CONTEXT_SAVED / NOT_A_PRODUCT_DECISION / BATCH_4_REVIEW_SUSPENDED_REBUILD_REQUIRED | 07_重建工作区/PDM-23_窗口切换交接_2026-10-07.md | 2026-10-07 |

| PDM23-SCAN-B4R | PDM-23 | Batch 4 Historical Rescan / Rebuild | 重扫 9/06 SSOT/Decision、R12、001～078、Current P09 carrier 与 completed-PDM Final；确认历史有 SLA 超时飞书大群、DND、飞书映射、V1 不做微信订阅体系等规则，但未找到“员工级 SLA 超时是否进总群”已固化 Authority。 | HISTORICAL_RESCAN_COMPLETE；旧 P23-B4-01～06 继续保持 NOT_APPROVED / NOT_APPLIED，并由 B4R 重建版取代。 | PDM-23 工作版 + 9/06 SSOT/Decision + R12 + 001～078 | 2026-10-07 |
| PDM23-DEC-B4R-01 | PDM-23 | P23-B4R-01 | V1 不建设通用通知模板中心 / 任意事件渠道矩阵，只保留已明确批准的通知能力与配置。 | USER_APPROVED / APPLIED | 2026-10-07 用户“可以”后“确认执行” | 2026-10-07 |
| PDM23-DEC-B4R-02 | PDM-23 | P23-B4R-02 | 微信小程序订阅消息保留未来接入能力，当前不作为核心依赖；实际启用服从届时腾讯平台规则、合法模板与用户授权；失败不影响业务；不建通用客户消息中心。 | USER_APPROVED / APPLIED / USER_REVISED_FROM_HISTORICAL_DO_NOT_BUILD | 2026-10-07 用户裁决并确认执行 | 2026-10-07 |
| PDM23-DEC-B4R-03 | PDM-23 | P23-B4R-03 | 保留公司级飞书总开关；关闭只停止飞书主动投递，不停止业务/SLA/Incident/日志。 | USER_APPROVED / APPLIED | 2026-10-07 用户裁决并确认执行 | 2026-10-07 |
| PDM23-DEC-B4R-04 | PDM-23 | P23-B4R-04 | 保留员工个人飞书业务提醒开关，默认开启；关闭不改变责任、SLA、工作台或群告警资格。 | USER_APPROVED / APPLIED | 2026-10-07 用户裁决并确认执行 | 2026-10-07 |
| PDM23-DEC-B4R-05 | PDM-23 | P23-B4R-05 | 飞书总群只保留合法群路由；不再另建与公司飞书总开关重复的“群通知总开关”。 | USER_APPROVED / APPLIED | 2026-10-07 用户指出两者重复并确认执行 | 2026-10-07 |
| PDM23-DEC-B4R-06 | PDM-23 | P23-B4R-06 | 保留员工级“其 Consultation SLA 超时是否进入飞书总群”开关，默认开启，由合法管理/配置能力控制；关闭仅影响总群投递。 | USER_APPROVED / APPLIED / NEW_PRODUCT_RULE | 2026-10-07 用户明确“很有必要”并确认执行 | 2026-10-07 |
| PDM23-DEC-B4R-07 | PDM-23 | P23-B4R-07 | 个人通知接收人按真实业务责任解析；无合法个人路由只记录通知结果，不得自动改派 owner/assignee/responsible。 | USER_APPROVED / APPLIED | PDM-23 重建 Batch 4 + 用户确认执行 | 2026-10-07 |
| PDM23-DEC-B4R-08 | PDM-23 | P23-B4R-08 | DND 不设置隐式紧急绕过；通知时间统一按项目业务时区解释，最终统一 timestamp/history 交 PDM-25。 | USER_APPROVED / APPLIED | PDM-23 重建 Batch 4 + 用户确认执行 | 2026-10-07 |
| PDM23-DEC-B4R-09 | PDM-23 | P23-B4R-09 | 未来独立 App Push 预留 notification channel 接入能力但 V1 不实现；PC V1 不做浏览器/桌面主动 Push。 | USER_APPROVED / APPLIED | 2026-10-07 用户明确未来 App Push 要可接入并确认执行 | 2026-10-07 |
| PDM23-DEC-B4R-10 | PDM-23 | P23-B4R-10 | 正式登记 PDM-23→PDM-25：Notification Config/飞书映射/开关/DND/群路由/cadence/Notification Log 的统一审计、历史、敏感字段与时区标准。 | USER_APPROVED / APPLIED / HANDOFF_REGISTERED | PDM-23 重建 Batch 4 + 用户确认执行 | 2026-10-07 |
| PDM23-GATE-B4R | PDM-23 | Batch 4 Rebuilt Gate | P23-B4R-01～P23-B4R-10 全部通过并执行；旧 P23-B4-01～06 从未执行并被重建版取代。 | PASS / USER_APPROVED / APPLIED；LOCAL_PRODUCT_CHOICE_UNRESOLVED=0；允许进入 PDM-23 Prefinal Integrity。 | PDM-23 工作版 + Decision Register + CROSS_PDM_HANDOFF_REGISTER | 2026-10-07 |

| PDM23-PREFINAL-R1 | PDM-23 | Prefinal Integrity R1 | 完整复核发现 4 个语义补强项：统一通知去重基线、SLA 群告警最小内容、持续 Incident 作为普通去重例外、微信可接入不等于当前启用。 | REPAIR_REQUIRED / NO_HARD_CONFLICT；MISSING_RULE=2；SEMANTIC_DETAIL_GAP=2；incoming/outgoing gap=0。 | PDM-23 R1 报告 + 9/06 SSOT + completed-PDM Final | 2026-10-07 |
| PDM23-DEC-LIA-01 | PDM-23 | P23-LIA-01 | 同一业务事件、同一通知阶段原则上只主动通知一次；同一 Consultation 同一次 first-response SLA timeout 原则上只做一次群告警；持续 Incident 例外。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”并“确认执行” | 2026-10-07 |
| PDM23-DEC-LIA-02 | PDM-23 | P23-LIA-02 | SLA 总群告警至少含必要 Customer 识别、负责销售、Consultation 摘要、已超时时长、业务入口；敏感字段最小化；deep-link 重新鉴权。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”并“确认执行” | 2026-10-07 |
| PDM23-DEC-LIA-03 | PDM-23 | P23-LIA-03 | 持续 active Incident 可按已配置 cadence 重复告警，是普通一次通知原则的例外；仍服从 DND；真实恢复后停止；不恢复历史固定 2/5/15 分钟默认。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”并“确认执行” | 2026-10-07 |
| PDM23-DEC-LIA-04 | PDM-23 | P23-LIA-04 | 微信小程序订阅消息“保留接入能力”不等于当前启用；无明确 customer-WeChat allowlist + 合法平台能力/模板 + 用户授权前不得自动发送。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”并“确认执行” | 2026-10-07 |
| PDM23-PREFINAL-R2 | PDM-23 | Prefinal Integrity R2 | R1 四项修复全部闭环；65 个正式规则/裁决单元完成 Source↔Atom、Semantic Completeness、handoff、negative claims 与 completed-PDM invariant 复核。 | PASS / FINAL_CANDIDATE_READY；MISSING_RULE=0；SEMANTIC_DETAIL_GAP=0；completed-PDM conflict=0；incoming/outgoing gap=0；local choice=0。 | PDM-23 R2 报告 | 2026-10-07 |

| PDM23-FINAL-OVERVIEW | PDM-23 | Final Domain Overview | 用户对 PDM-23 最终完整规则总览明确“同意”。 | USER_FINAL_APPROVED；65 个正式规则/裁决单元具备发布 Final 条件。 | 07_重建工作区/PDM-23_最终完整规则总览_待用户批准.md + 用户最终批准 | 2026-10-07 |
| PDM23-FINAL-CLOSEOUT | PDM-23 | Final Closeout | 用户随后明确“确认执行”；发布正式 Final，执行 Final Integrity，关闭 10/10 incoming handoff 并完成 10/10 source backwrite。 | COMPLETE / INTEGRITY_PASS；Final=07_重建工作区/PDM-23_最终完整规则.md；Final Integrity=07_重建工作区/PDM-23_最终完整性复核_2026-10-07.md / PASS；HO-P23-P25-001 继续 HANDOFF_OPEN。 | PDM-23 Final + CROSS_PDM_HANDOFF_REGISTER + source PDM Finals | 2026-10-07 |

| PDM24-DEC-R00 | PDM-24 | P24-R00 | PDM-24 作为 Announcement 与 Banner/Placement 运营生命周期唯一产品 Authority；负责创建/编辑/启停/排期/生效/结束/排序/合法跳转与公告主动弹层运营频控；不扩成通用消息中心、营销自动化平台或万能 Placement Engine。 | USER_APPROVED / APPLIED | 2026-10-07 用户同意 Startup Gate 核心定位并明确确认执行 | 2026-10-07 |
| PDM24-DEC-R01 | PDM-24 | P24-R01 | 用户明确：VEHICLE_DETAIL 是车辆详情页固定广告位能力；所有合法车辆详情页均具备该 placement。无有效 Banner 时可不展示具体广告内容，但不能解释为详情页没有广告位。 | USER_APPROVED / APPLIED；覆盖历史“详情 Banner 可选模块”中“广告位本身可有可无”的旧解释；PDM-20 source backwrite 等 PDM-24 Final Closeout。 | 2026-10-07 用户“这个详情页的肯定是有的详情页的广告”→确认口径→同意→确认执行 | 2026-10-07 |
| PDM24-GATE-STARTUP | PDM-24 | Startup Gate | R10/R12、Phase1.5 Current IA、PDM-20 Final、HO-P20-P24-001 完成反扫；P24-R00/R01 已批准执行；incoming handoff 1/1 接收；Batch 1 候选 P24-A01～A15 已形成。 | PASS / COMPLETED_PDM_HARD_CONFLICT=0 / INCOMING_GAP=0 / IA_LOWFI_ENGINEERING=NO_CONSTRUCTION | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |

| PDM24-DEC-A01 | PDM-24 | P24-A01 | 公告与 Banner 独立运营对象；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A02 | PDM-24 | P24-A02 | 公告基础管理闭环；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A03 | PDM-24 | P24-A03 | 公告 active/history 客户端入口；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A04 | PDM-24 | P24-A04 | 公告主动弹层每日频控；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A05 | PDM-24 | P24-A05 | 关闭弹层不生成已读事实；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A06 | PDM-24 | P24-A06 | 多个主动弹层同刻只展示一个；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A07 | PDM-24 | P24-A07 | Banner 固定 placement 为 HOME_TOP / VEHICLE_DETAIL；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A08 | PDM-24 | P24-A08 | VEHICLE_DETAIL 固定广告位能力；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A09 | PDM-24 | P24-A09 | Banner 数量投影 0/1/2～5/>5；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A10 | PDM-24 | P24-A10 | Banner target 可为空；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A11 | PDM-24 | P24-A11 | Banner target 仅内部白名单合法目标；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A12 | PDM-24 | P24-A12 | Banner 排期/启停/排序独立校验；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A13 | PDM-24 | P24-A13 | 运营 mutation 当前鉴权 Guard；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A14 | PDM-24 | P24-A14 | 重要运营配置变更可追溯；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-A15 | PDM-24 | P24-A15 | 不建设万能运营/营销平台；用户对 Batch 1“全部同意”并随后明确确认执行。 | USER_APPROVED / APPLIED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-GATE-B1 | PDM-24 | Batch 1 Gate | P24-A01～P24-A15 全部批准并执行；稳定一致规则进入当前 Authority；Reverse Conflict Scan 已生成 Batch 2。 | PASS / USER_APPROVED / APPLIED / COMPLETED_PDM_HARD_CONFLICT=0 | PDM-24 工作版 + 2026-10-07 用户批准执行 | 2026-10-07 |

| PDM24-DEC-B2-01 | PDM-24 | P24-B2-01 | 不恢复第四个消息Tab/泛化消息中心；用户对 Batch 2 全部同意并明确“确认执行”。 | USER_APPROVED / APPLIED；Reverse Conflict Scan 项。 | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-B2-02 | PDM-24 | P24-B2-02 | 不恢复公告已读未读主状态机；用户对 Batch 2 全部同意并明确“确认执行”。 | USER_APPROVED / APPLIED；Reverse Conflict Scan 项。 | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-B2-03 | PDM-24 | P24-B2-03 | 关闭公告弹层不等于已读；用户对 Batch 2 全部同意并明确“确认执行”。 | USER_APPROVED / APPLIED；Reverse Conflict Scan 项。 | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-B2-04 | PDM-24 | P24-B2-04 | 不恢复VEHICLE_DETAIL广告位可有可无；用户对 Batch 2 全部同意并明确“确认执行”。 | USER_APPROVED / APPLIED；Reverse Conflict Scan 项。 | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-B2-05 | PDM-24 | P24-B2-05 | 不恢复任意/通用多运营位；用户对 Batch 2 全部同意并明确“确认执行”。 | USER_APPROVED / APPLIED；Reverse Conflict Scan 项。 | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-B2-06 | PDM-24 | P24-B2-06 | 不扩成广告推荐/定向/计费平台；用户对 Batch 2 全部同意并明确“确认执行”。 | USER_APPROVED / APPLIED；Reverse Conflict Scan 项。 | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-B2-07 | PDM-24 | P24-B2-07 | 不恢复任意外链/任意目标字符串；用户对 Batch 2 全部同意并明确“确认执行”。 | USER_APPROVED / APPLIED；Reverse Conflict Scan 项。 | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-B2-08 | PDM-24 | P24-B2-08 | 失效target不得继续跳转；用户对 Batch 2 全部同意并明确“确认执行”。 | USER_APPROVED / APPLIED；Reverse Conflict Scan 项。 | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-B2-09 | PDM-24 | P24-B2-09 | target为空不等于Banner无效；用户对 Batch 2 全部同意并明确“确认执行”。 | USER_APPROVED / APPLIED；Reverse Conflict Scan 项。 | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-B2-10 | PDM-24 | P24-B2-10 | 不恢复连续强迫多个主动弹层；用户对 Batch 2 全部同意并明确“确认执行”。 | USER_APPROVED / APPLIED；Reverse Conflict Scan 项。 | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-B2-11 | PDM-24 | P24-B2-11 | 公告不自动升级为外部通知任务；用户对 Batch 2 全部同意并明确“确认执行”。 | USER_APPROVED / APPLIED；Reverse Conflict Scan 项。 | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-DEC-B2-12 | PDM-24 | P24-B2-12 | Banner点击不构成业务授权或mutation；用户对 Batch 2 全部同意并明确“确认执行”。 | USER_APPROVED / APPLIED；Reverse Conflict Scan 项。 | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | 2026-10-07 |
| PDM24-GATE-B2 | PDM-24 | Batch 2 Gate | P24-B2-01～P24-B2-12 全部批准并执行；Reverse Conflict Scan=PASS；FALSE_DEPRECATION_COUNT=0；未引入新产品选择。 | PASS / USER_APPROVED / APPLIED | PDM-24 工作版 + 2026-10-07 用户确认执行 | 2026-10-07 |

| PDM24-GATE-B3 | PDM-24 | Batch 3 Gate | 后续明确新增 / 知情修改扫描确认均已由 Startup Gate / Batch 1 / Batch 2 承接，无需新增重复规则原子。 | PASS / USER_APPROVED / APPLIED / NO_NEW_ATOMS / MISCLASSIFIED_PRODUCT_CHOICE=0 | PDM-24 工作版 + 2026-10-07 用户“同意”并“确认执行” | 2026-10-07 |
| PDM24-WINDOW-HANDOFF-20261007 | PDM-24 | 窗口切换上下文冻结 | 用户明确表示完成 Batch 3 后准备换窗口；当前已执行结果、P24-R00/R01、Batch 1/2/3、HO-P20-P24-001 状态与 Batch 4 唯一下一步已保存。 | CONTEXT_SAVED / NOT_FINAL / NEXT=PDM24_BATCH4_FINAL_GAP_SCAN | 07_重建工作区/PDM-24_窗口切换交接_2026-10-07.md | 2026-10-07 |


| PDM24-SCAN-B4 | PDM-24 | Batch 4 Final-gap Scan | 重扫 9/06 SSOT/Decision、9/19 R10/R12、9/22 Frozen Visual Review、001～078、Current IA 与 completed-PDM Final；发现公告频率粒度/有效周期/字段、普通编辑触达语义、Banner 再启用、P24→P25 handoff 等 Final-gap。 | SCAN_COMPLETE / USER_REVIEW_COMPLETE / COMPLETED_PDM_HARD_CONFLICT=0 | PDM-24 工作版 + 历史证据 + 2026-10-07 用户逐项裁决 | 2026-10-07 |
| PDM24-DEC-B4-01 | PDM-24 | P24-B4-01 | 公告设置生效开始/结束日期与独立自动弹出开关；有效期内同一 Customer 每业务自然日公告主动弹层全局最多 1 条，触发于当天第一次进入/打开小程序；取消“仅首次自动弹出一次”和三档频率模式。 | USER_APPROVED / APPLIED / USER_REVISED；正式修订 P24-A04 原“同公告+同客户每天一次”的粒度。 | 2026-10-07 用户主动提出周期+每日首次进入规则并“同意/确认执行” | 2026-10-07 |
| PDM24-DEC-B4-02 | PDM-24 | P24-B4-02 | 普通编辑不重置客户当天已展示事实；当天未进入则首次进入读取最新内容；V1 不建独立重新发布按钮，需要新一轮触达时新建 Announcement，新公告仍受客户每日全局最多1条自动公告约束。 | USER_APPROVED / APPLIED / CHOICE_2A | 2026-10-07 用户同意整体判断并确认执行 | 2026-10-07 |
| PDM24-DEC-B4-03 | PDM-24 | P24-B4-03 | 多条同时有效且开启自动弹出的公告，当天第一次进入只按后台有效排序择一自动展示；当天不补弹其他公告；主动公告列表查看不受自动弹层日上限限制。 | USER_APPROVED / APPLIED | 2026-10-07 用户同意整体判断并确认执行 | 2026-10-07 |
| PDM24-DEC-B4-04 | PDM-24 | P24-B4-04 | 补齐 Announcement 标题、正文、启停、生效开始/结束日期、自动弹出开关、排序、创建/修改人及时间；不保留独立频率档位产品字段。 | USER_APPROVED / APPLIED | 2026-10-07 用户同意整体判断并确认执行 | 2026-10-07 |
| PDM24-DEC-B4-05 | PDM-24 | P24-B4-05 | V1 Banner target 继续只允许内部白名单合法小程序页面/业务对象；不恢复历史“安全外链”当前能力。未来 H5/外链需重新获得 Authority。 | USER_APPROVED / APPLIED / CHOICE_5A；P24-A11/B2-07 继续有效。 | 2026-10-07 用户同意整体判断并确认执行 | 2026-10-07 |
| PDM24-DEC-B4-06 | PDM-24 | P24-B4-06 | Banner 停用不删除；允许再启用；再启用时重新校验 identity/permission/scope/placement/target/schedule/object-state；过期需新合法排期。 | USER_APPROVED / APPLIED | 2026-10-07 用户同意整体判断并确认执行 | 2026-10-07 |
| PDM24-DEC-B4-07 | PDM-24 | P24-B4-07 | 正式登记 HO-P24-P25-001：PDM-25 统一承接 Announcement/Banner 配置变更、每日展示事实、before/after/actor/time 与 timezone/history/audit 标准，不得反向改变 PDM-24 产品语义。 | USER_APPROVED / APPLIED / HANDOFF_REGISTERED / HANDOFF_OPEN | PDM-24 Batch 4 + CROSS_PDM_HANDOFF_REGISTER + 2026-10-07 用户确认执行 | 2026-10-07 |
| PDM24-GATE-B4 | PDM-24 | Batch 4 Gate | P24-B4-01～P24-B4-07 全部批准并执行；B4-01 为用户修订版，B4-02=2A，B4-05=5A；其余稳定收口通过。 | PASS / USER_APPROVED / APPLIED / LOCAL_PRODUCT_CHOICE_UNRESOLVED=0；允许进入 PDM-24 Prefinal Integrity。 | PDM-24 工作版 + Decision Register + CROSS_PDM_HANDOFF_REGISTER | 2026-10-07 |

| PDM24-PREFINAL-R1 | PDM-24 | Prefinal Integrity R1 | 完整复核发现 4 个语义完整性缺口：UTC+8 日期/每日边界、Announcement 停用/到期 active-history 转换、首次进入被其他主动弹层占用后的补弹规则、无效排期与 Banner target Guard。 | REPAIR_REQUIRED / NO_HARD_CONFLICT；MISSING_RULE=0；SEMANTIC_DETAIL_GAP=4；LOCAL_PRODUCT_CHOICE=1（LIA-03）。 | 07_重建工作区/PDM-24_Final前完整性复核_R1_2026-10-07.md | 2026-10-07 |
| PDM24-DEC-LIA-01 | PDM-24 | P24-LIA-01 | Announcement 生效/结束日期与“当天/每日/第一次进入”统一按 Asia/Shanghai（UTC+8）业务自然日解释；后台业务时间为 Authority；结束日期当天仍有效。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”并“确认执行” | 2026-10-07 |
| PDM24-DEC-LIA-02 | PDM-24 | P24-LIA-02 | Announcement 到期或人工停用退出 active 并进入 history，不删除；停用后仍在合法周期内可再启用；已过期需新合法周期；auto-popup OFF 不等于停用。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”并“确认执行” | 2026-10-07 |
| PDM24-DEC-LIA-03 | PDM-24 | P24-LIA-03 | 采用 3A：当天第一次进入机会若被其他主动弹层占用，Announcement 当天不补弹；未实际展示不写已展示事实，但首次进入触达机会结束；不得关闭其他弹层后连续强制补弹。 | USER_APPROVED / APPLIED / CHOICE_3A | 2026-10-07 用户“全部同意”并“确认执行” | 2026-10-07 |
| PDM24-DEC-LIA-04 | PDM-24 | P24-LIA-04 | Announcement 开始日期不得晚于结束日期且无效周期不得启用；Banner target 可为空，非空时保存/启用必须当前合法；后续失效则退化为纯展示并禁止点击；再启用完整重验。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”并“确认执行” | 2026-10-07 |
| PDM24-PREFINAL-R1-REPAIR | PDM-24 | Prefinal R1 Repair Gate | P24-LIA-01～P24-LIA-04 全部批准并执行；LIA-03=3A；R1 修复闭环，但尚未执行 R2。 | PASS / USER_APPROVED / APPLIED / NEXT=PDM24_PREFINAL_R2 / LOCAL_PRODUCT_CHOICE_UNRESOLVED=0 | PDM-24 工作版 + R1 报告 | 2026-10-07 |

| PDM24-PREFINAL-R2 | PDM-24 | Prefinal Integrity R2 | R1 四项修复后完成 Source↔Atom、Semantic Completeness、completed-PDM invariant、handoff、negative claims 与 local choice 二次复核；PDM-20 旧详情 Banner 可选表述确认属于待 Final Closeout source backwrite 的历史尾巴。 | PASS / FINAL_CANDIDATE_READY；FORMAL_UNITS=40；MISSING_RULE=0；SEMANTIC_DETAIL_GAP=0；COMPLETED_PDM_HARD_CONFLICT=0；INCOMING/OUTGOING_GAP=0；LOCAL_PRODUCT_CHOICE=0。 | 07_重建工作区/PDM-24_Final前完整性复核_R2_2026-10-07.md | 2026-10-07 |

| PDM24-GATE-FINAL-OVERVIEW | PDM-24 | Final Domain Overview | 用户已对 PDM-24 Final Domain Overview 明确“最终批准”；40 个正式规则/裁决单元进入 Final Closeout。 | USER_FINAL_APPROVED | 2026-10-07 用户“最终批准” | 2026-10-07 |
| PDM24-GATE-FINAL-CLOSEOUT | PDM-24 | Final Closeout | 用户随后明确“确定执行”；正式发布 PDM-24 Final 与 Final Integrity，关闭 HO-P20-P24-001 并 source backwrite PDM-20；HO-P24-P25-001 保持 HANDOFF_OPEN。 | COMPLETE / INTEGRITY_PASS / SOURCE_BACKWRITE_DONE / NEXT=PDM-25_STARTUP_GATE | PDM-24 Final + Final Integrity + CROSS_PDM_HANDOFF_REGISTER | 2026-10-07 |

| PDM25-DEC-R00 | PDM-25 | P25-R00 | PDM-25 定位为全项目审计 / 历史 / 时区 / 配置版本 / 终态真实性 / 横切完整性唯一产品 Authority；不重建业务主状态，不恢复已废弃能力，不冻结数据库/MQ/事务框架等工程实现。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”“确认这些”并最终“确认执行” | 2026-10-07 |
| PDM25-GATE-STARTUP | PDM-25 | Startup Gate | 24 条 target=PDM-25 incoming handoff 全部正式接收；审计只读、重要 mutation 可追溯、敏感字段最小化、配置不追改历史、终态真实性、UTC+8、权限撤销旧载体失效、横切完整性边界进入当前 Authority。 | PASS / USER_APPROVED / APPLIED / INCOMING=24_24_HANDOFF_ACCEPTED / NEXT=PDM25_BATCH1 | PDM-25 工作版 + CROSS_PDM_HANDOFF_REGISTER | 2026-10-07 |
| PDM25-DEC-A01 | PDM-25 | P25-A01 | 全项目统一审计入口只读；查询/筛选/详情/合法关联查看；普通业务后台不可改写、覆盖、删除真实审计。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A02 | PDM-25 | P25-A02 | 重要 mutation 统一追溯 time、actor/system actor、identity/role context、domain/object、action、before/after、result 与必要 source context。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A03 | PDM-25 | P25-A03 | reason/note 只在来源业务明确要求时强制；PDM-25 不统一提高提交门槛。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A04 | PDM-25 | P25-A04 | 普通浏览/页面打开/无风险展示不强制逐条形成高等级 Audit Event。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A05 | PDM-25 | P25-A05 | 审计/历史不得成为越权入口；当前查看继续受 identity + permission + data scope + object/account state 约束。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A06 | PDM-25 | P25-A06 | Token/Secret 不保留完整明文；手机号、电话、内部价格、资金、敏感身份资料按当前权限最小化/脱敏。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A07 | PDM-25 | P25-A07 | ended/cancelled/voided/refunded/delisted 等真实历史及历史 Recommendation/Match/Listing Cycle 不因后续状态被删除或抹写。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A08 | PDM-25 | P25-A08 | Current Projection 与 Historical Fact 分离；当前事实与历史事实互不静默覆盖。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A09 | PDM-25 | P25-A09 | 纠错以 correction/void/replacement/新事件追加表达；原错误、成交、资金等真实事实不抹除。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A10 | PDM-25 | P25-A10 | 重要配置变更至少记录 before/after/actor/time。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A11 | PDM-25 | P25-A11 | 配置继续归属原业务域；PDM-25 只统一配置历史/版本与横切规则，不建万能配置中心。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A12 | PDM-25 | P25-A12 | 新配置默认不追改已固化 snapshot / historical fact；来源域明确动态配置者除外。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A13 | PDM-25 | P25-A13 | V1 横切业务自然日统一 Asia/Shanghai（UTC+8）；不冻结 timestamp 物理存储格式。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A14 | PDM-25 | P25-A14 | 权限/范围/账号/对象状态变化后旧页面、session、deep-link、敏感 payload 不得继续作为授权；敏感提交重验 current Guard。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A15 | PDM-25 | P25-A15 | 审计区分 human actor 与 system actor；系统自动事实不得伪装成员工人工操作。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A16 | PDM-25 | P25-A16 | PDM-25 可冻结幂等、唯一 active、并发 winner、不重复扣减、不超退、append-only、terminal read-only 等产品结果，但不冻结 DB/MQ/锁/事务框架。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-DEC-A17 | PDM-25 | P25-A17 | 各业务状态机继续由 completed-PDM Final 决定；PDM-25 是统一横切 Audit/History Authority，不得出现第二套跨域审计体系。 | USER_APPROVED / APPLIED | 2026-10-07 用户确认“确定执行” | 2026-10-07 |
| PDM25-GATE-BATCH1 | PDM-25 | Batch 1｜稳定一致规则 | P25-A01～P25-A17 全部完成用户审查并执行；completed-PDM hard conflict=0；incoming handoff 24/24 继续 HANDOFF_ACCEPTED；local product choice unresolved=0。 | PASS / USER_APPROVED / APPLIED / NEXT=PDM25_BATCH2 | PDM-25 工作版 + Decision Register | 2026-10-07 |
| PDM25-DEC-B2-01 | PDM-25 | P25-B2-01 | Customer Merge 不得因历史审计对象清单恢复；PDM-01 Final 已取消自动/人工 Merge，旧真实 Merge 记录只作为历史事实。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-B2-02 | PDM-25 | P25-B2-02 | 独立 Recommendation qualification / P06-06 / RECOMMENDATION_QUALIFIED 不得恢复；当前由 Customer Level 的 find-car entitlement 决定普通 Recommendation 资格。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-B2-03 | PDM-25 | P25-B2-03 | 独立“调价”Action / permission 不得恢复；名邦/4S 正常价格字段按 PDM-10 走车辆保存修改，客户展示价覆盖保持独立。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-B2-04 | PDM-25 | P25-B2-04 | 不得新增独立 can_call_wholesale_phone；电话查看/latest/拨打继续复用上游电话敏感能力 + current Guard。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-B2-05 | PDM-25 | P25-B2-05 | Announcement 旧“仅首次/每天一次/不自动弹”三档频率及重新发布重置触达模型不得恢复；服从 PDM-24 Final。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-B2-06 | PDM-25 | P25-B2-06 | 历史“详情 Banner 不是强制模块”不得恢复；VEHICLE_DETAIL 为固定 placement 能力，无有效内容时仅不渲染广告。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-B2-07 | PDM-25 | P25-B2-07 | VR-P-036 的 reason 字段不得解释成全局必填；是否必填由来源业务规则决定，不得伪造历史 reason。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-B2-08 | PDM-25 | P25-B2-08 | 旧审计对象清单不是业务能力复活清单；已 supersede 的 Action/permission/state/UI entry 只能保留真实历史，不得恢复为 Current。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-GATE-BATCH2 | PDM-25 | Batch 2｜明确废弃 / 已覆盖 / 不得恢复 | P25-B2-01～P25-B2-08 全部批准并执行；Reverse Conflict Scan PASS；FALSE_DEPRECATION_COUNT=0；24/24 incoming 继续 HANDOFF_ACCEPTED。 | PASS / USER_APPROVED / APPLIED / NEXT=PDM25_BATCH3 | PDM-25 工作版 + completed-PDM Final reverse scan | 2026-10-07 |
| PDM25-DEC-B3-01 | PDM-25 | P25-B3-01 | 版本化配置仅在来源业务已定义版本模型时统一区分草稿/未生效、current、history；失败版本不得替换 current，旧版本与其已形成 snapshot/history 不追改。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-B3-02 | PDM-25 | P25-B3-02 | 来源业务要求记录 result 时，FAILED/SKIPPED/DEDUPED/NOT_ALLOWLISTED/无有效结果等必须保留真实语义，不得把请求已执行或 retry 写成业务成功。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-B3-03 | PDM-25 | P25-B3-03 | 来源 PDM 已允许的批量 mutation 必须逐对象重验并保留逐对象结果；来源允许 partial success 时成功项不因其他失败整体回滚，retry 只处理未闭环对象。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-B3-04 | PDM-25 | P25-B3-04 | 组合 UI 入口不得合并独立 domain action；各动作分别 Guard/执行/result/history，可用 related IDs 关联，但关联不等于共享状态机或相互授权。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-GATE-BATCH3 | PDM-25 | Batch 3｜明确知情修改 / 后续明确新增 | P25-B3-01～P25-B3-04 全部批准并执行；Conflict Isolation PASS；MISCLASSIFIED_PRODUCT_CHOICE=0；DUPLICATE_RULE_CREATION=0；24/24 incoming 继续 HANDOFF_ACCEPTED。 | PASS / USER_APPROVED / APPLIED / NEXT=PDM25_BATCH4_FINAL_GAP_SCAN | completed-PDM Final conflict isolation + 用户确认执行 | 2026-10-07 |
| PDM25-DEC-B4-01 | PDM-25 | P25-B4-01 | 审计/历史保留动作发生当时的身份上下文；stable employee_id 用于关联，但后续调店/角色/permission/scope/inactive/复职不得动态改写旧事件身份事实。 | CHOICE_1A / USER_APPROVED / APPLIED | 2026-10-07 用户“同意”接受 1A/2A/3A/4A，随后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-B4-02 | PDM-25 | P25-B4-02 | Asia/Shanghai（UTC+8）统一业务日与展示解释，不合并不同时间事实；source/received、planned/actual、created/expired 等按来源域分别保真，客户端本地时钟不作为正式 mutation 最终 Authority。 | CHOICE_2A / USER_APPROVED / APPLIED | 2026-10-07 用户“同意”接受 1A/2A/3A/4A，随后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-B4-03 | PDM-25 | P25-B4-03 | 幂等/retry-safe 只形成与真实结果一致的一次正式成功业务事实；attempt/retry 可记录，但不得伪造第二次成功，且应关联同一实际 mutation。 | CHOICE_3A / USER_APPROVED / APPLIED | 2026-10-07 用户“同意”接受 1A/2A/3A/4A，随后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-B4-04 | PDM-25 | P25-B4-04 | 采用 4A：不规定全局统一 Audit Log 保存天数，也不要求全部永久热存储；来源域明确永久保留的业务历史继续永久真实，技术日志 retention/冷热归档留 Engineering/合规且不得破坏业务历史。 | CHOICE_4A / USER_APPROVED / APPLIED | 2026-10-07 用户“同意”接受 1A/2A/3A/4A，随后明确“确定执行” | 2026-10-07 |
| PDM25-GATE-BATCH4 | PDM-25 | Batch 4｜Final-gap Scan | P25-B4-01～P25-B4-04 全部批准并执行；CHOICES=1A/2A/3A/4A；FINAL_GAP_SCAN=PASS；SEMANTIC_DETAIL_GAP_UNRESOLVED=0；LOCAL_PRODUCT_CHOICE_UNRESOLVED=0；24/24 incoming 继续 HANDOFF_ACCEPTED。 | PASS / USER_APPROVED / APPLIED / NEXT=PDM25_PREFINAL_INTEGRITY | Final-gap Scan + 用户确认执行 | 2026-10-07 |
| PDM25-PREFINAL-R1 | PDM-25 | Final 前完整性复核 R1 | 发现 3 组 Final 前修复：PDM-25 专属检查卡缺失；HO-P20-P25-001 的 copy-before-view / Customer Safe Projection landing 不完整；HO-P21-P25-001 的 Internal Mode / entry_context landing 不完整。 | REPAIR_REQUIRED / NO_HARD_CONFLICT / FINAL_CANDIDATE_NOT_READY | PDM-25 Prefinal R1 | 2026-10-07 |
| PDM25-DEC-LIA-01 | PDM-25 | P25-LIA-01 | 建立 PDM-25 专属信息保真与一次性收口检查卡，补齐 Source↔Final、Negative Claim、Handoff landing、Semantic Completeness、Implementation-Ready 执行证据；检查卡不是新产品 Authority。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-LIA-02 | PDM-25 | P25-LIA-02 | 显式承接 HO-P20-P25-001：copy-before-view 不得成为权限旁路；旧敏感 payload 字段随 current guard 变化撤销；Customer Safe Projection 做字段级安全验证；Historical Detail 只读，query context 仍归 PDM-20。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-DEC-LIA-03 | PDM-25 | P25-LIA-03 | 显式承接 HO-P21-P25-001：Internal Mode 为临时 session；连续后台>=5分钟退出，<5分钟返回仍重验 current guard；高风险员工动作保留必要 entry_context，entry_context 不授予 permission。 | USER_APPROVED / APPLIED | 2026-10-07 用户“全部同意”后明确“确定执行” | 2026-10-07 |
| PDM25-PREFINAL-REPAIR-R1 | PDM-25 | R1 Repair Gate | P25-LIA-01～P25-LIA-03 全部批准并执行；R1_REPAIR_CLOSED=3/3；EXECUTION_EVIDENCE_GAP=0；24/24 incoming handoff landing PASS，状态仍 HANDOFF_ACCEPTED。 | PASS / USER_APPROVED / APPLIED | PDM-25 工作版 + 检查卡 | 2026-10-07 |
| PDM25-PREFINAL-R2 | PDM-25 | Final 前完整性复核 R2 | Source→Atom、Atom→Source、Semantic Completeness、Handoff、Negative Claim、Implementation-Ready 全部 PASS；正式规则/裁决单元 37；PDM-25 已具备 Final Domain Overview 最终审查条件。 | PASS / FINAL_CANDIDATE_READY | 07_重建工作区/PDM-25_Final前完整性复核_R2_2026-10-07.md | 2026-10-07 |
| PDM25-FINAL-OVERVIEW-CANDIDATE | PDM-25 | Final Domain Overview | 已生成 `PDM-25_最终完整规则总览_待用户批准.md`；当前仅等待用户最终批准。 | FINAL_REVIEW_PENDING / USER_FINAL_APPROVED=NO | Prefinal R2 PASS | 2026-10-07 |
| PDM25-FINAL-APPROVAL | PDM-25 | Final Domain Overview | 用户最终批准 PDM-25 Final Domain Overview；37 个正式规则/裁决单元保持不变。 | USER_FINAL_APPROVED | 2026-10-07 用户“同意” | 2026-10-07 |
| PDM25-GATE-FINAL | PDM-25 | Final Closeout | 用户最终批准后明确“确定执行”；正式 Final / Final Integrity 已发布；24/24 incoming handoff CLOSED；PDM-01～24 Final/Integrity source backwrite 全部完成；PDM-25 COMPLETE / INTEGRITY_PASS。 | COMPLETE / INTEGRITY_PASS / SOURCE_BACKWRITE_DONE / NEXT=GLOBAL_PDM01_25_FINAL_AUDIT | PDM-25 Final + Cross-PDM Handoff Register | 2026-10-07 |

| GLOBAL25-LIA-01-04 | GLOBAL | Global Final Audit R1 控制面修复 | 修正 PROJECT_STATE 顶层旧 PDM-25 指针、Handoff Register Current 汇总、NEXT_ACTION Current/History 边界、模块状态总表。四项均不改变产品业务语义。 | USER_APPROVED / APPLIED / 4_4_CLOSED | 2026-10-07 用户“全部同意，确认执行” + 控制文件 | 2026-10-07 |
| GLOBAL25-FINAL-AUDIT-R2 | GLOBAL | PDM-01～25 全局 Cross-PDM / Handoff / Global Invariant 最终总复核 | 25/25 Final COMPLETE/INTEGRITY_PASS；25/25 Integrity PASS；165 handoff=164 CLOSED+1 SUPERSEDED；OPEN=0；ACCEPTED=0；source_backwrite pending=0；global invariant conflict=0；无新增产品选择。 | GLOBAL_FINAL_AUDIT_PASS / NEXT=FINAL_INTEGRITY_HISTORICAL_TAIL_CLEANUP | 07_重建工作区/PDM-01至25_全局跨域移交与全局不变量最终总复核_2026-10-07.md | 2026-10-07 |
| GLOBAL25-HISTORY-TAIL-CLEANUP | GLOBAL | Final / Integrity 历史阶段尾巴统一清理与 Current / History 边界标注 | 68/68 历史载体已标记 HISTORICAL_AUDIT_TRAIL；12 个 Final 与 13 个 Final Integrity 旧阶段尾巴已去 Current 歧义；未限定 stale pointer=0；业务语义变更=0。 | PASS / NEXT=IA_GLOBAL_ALIGNMENT | 07_重建工作区/PDM-01至25_Final_Integrity历史阶段尾巴清理与Current_History边界复核_2026-10-07.md | 2026-10-07 |

| IA-B4-01 | IA | Supply Anomaly Current 对齐 | Supply Anomaly 本身只作为风险告警，不统一阻断新增业务；真实 offline/unavailable/sold 等不可售事实才按各业务 Guard 硬阻断；既有 Lock/资金/Transaction/历史不因 anomaly 标签静默抹除。 | USER_APPROVED / APPLIED | PDM-04 Final + 2026-10-08 用户“全部同意确认执行” | 2026-10-08 |
| IA-B4-02 | IA | P03 / Publisher Phone Current 对齐 | Current IA 删除保存/测试 Collector 电话连接、Collector Base URL / Phone Path / JYT 电话凭证业务配置；P03 只承载三个固定同步 API 的名邦侧管理与 Publisher 电话诊断，电话身份按 source_platform+upstream_publisher_id。 | USER_APPROVED / APPLIED | PDM-09/PDM-22 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| IA-B4-03 | IA | 4S × Recommendation Actor/Vehicle 分离 | 4S Employee 对名邦 Recommendation hard DENY；但 4S Vehicle 本身可被合法名邦业务 responsible 正式 Recommendation，不得把 Actor hard DENY 扩大为 Vehicle Source hard DENY。 | USER_APPROVED / APPLIED | PDM-14 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| IA-B4-04 | IA | CRM 三类信息分离 | Personal Note、Shared Profile、员工内部客户称呼/服务称呼独立承载；服务称呼保留 author/time/source/change history，不并入大字段 CRM 画像。 | USER_APPROVED / APPLIED | PDM-16 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| IA-B4-05 | IA | CRM Access Current Guard | 历史服务过不等于永久 CRM 访问；当前完整访问按 identity+permission/capability+data scope+current owner/valid Collaboration/manager scope+object/account state 重验；正式交接后原 owner 默认失去当前完整访问。 | USER_APPROVED / APPLIED | PDM-16 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| IA-B4-06 | IA | Current 明细正规化 | 将顶部 Current 覆盖与下方明细统一：退出 P06-06 Recommendation qualification、current-owner-only Recommendation actor、旧 Collector 连接与 Supply Anomaly 总阻断 Current carrier；历史证据可保留但不得被当成 Current。 | USER_APPROVED / APPLIED | IA Final-gap Scan + 2026-10-08 用户确认执行 | 2026-10-08 |
| IA-GATE-BATCH4 | IA | Batch 4 Final-gap Closeout | IA-B4-01～06 全部批准执行；4 条 CARRIER_DEFERRED 全部关闭；Current IA 11 文件 current-row stale=0；FINAL_GAP_SCAN=PASS；LOCAL_PRODUCT_CHOICE_UNRESOLVED=0；PDM Final 业务语义变化=0；IA_GLOBAL_ALIGNMENT=COMPLETE。 | PASS / USER_APPROVED / APPLIED / NEXT=LOW_FI_GLOBAL_ALIGNMENT | IA Current + Cross-PDM Handoff Register + 机械扫描 | 2026-10-08 |

| LF-B1-01 | LOW_FI | Customer Merge 退出 Current Low-Fi | P06-01/P06-M01 的 MERGE_* 页面、状态、入口和动作退出 Current；V1 不提供自动/人工 Customer Merge；旧 SVG 只保留为 RETIRED / DO_NOT_RESTORE 历史证据。 | USER_APPROVED / APPLIED | PDM-01 Final + 2026-10-08 用户“全部同意，确认执行” | 2026-10-08 |
| LF-B1-02 | LOW_FI | P03 / Publisher Phone 结构对齐 | P03 Current 只保留“车源同步 / Integration API”和“Publisher / 电话诊断”两个子页；删除保存/测试 Collector 电话连接、Base URL / Phone Path 等业务入口；原 P03-03～07 物理文件保留为历史退役载体。 | USER_APPROVED / APPLIED | PDM-09/PDM-22 Final + Current IA + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-B1-03 | LOW_FI | P06-06 Recommendation qualification 退出 | P06-06 保留 Customer Level / 标签 / entitlement / quota 管理，但删除独立 RECOMMENDATION_QUALIFIED / NOT_QUALIFIED 状态与开关；Recommendation 资格读取当前 Customer Level find-car entitlement。 | USER_APPROVED / APPLIED | PDM-11/PDM-14/PDM-22 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-B1-04 | LOW_FI | Supply Anomaly Guard 对齐 | P02-06 anomaly 只表达风险/复核事实，不统一阻断新增业务；真实 offline/unavailable/sold 等不可售事实与各业务 Guard 决定动作可用性；既有 Lock/资金/Transaction/历史保留。 | USER_APPROVED / APPLIED | PDM-04 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-B1-05 | LOW_FI | Priority 人工创建入口退出 | 删除 E05-05 “创建 Priority” Current Action；合法 high/acceptable Match Result 进入 Priority candidate，由系统确定性仲裁创建/复用 active Priority；人工 create/transfer/override 不得恢复。 | USER_APPROVED / APPLIED | PDM-13/PDM-21 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-B1-06 | LOW_FI | CRM 服务称呼独立承载 | E03-02/P06-03 补齐员工内部客户称呼/服务称呼，与 Personal Note / Shared Profile 分离；保留 author/time/source/change history；历史服务本身不形成永久 CRM 访问权。 | USER_APPROVED / APPLIED | PDM-16 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-B1-07 | LOW_FI | 多草稿 Current 投影 | 保留自动保存；删除“继续上次/放弃重新发布”单草稿恢复模型；E02→更多→草稿车源进入 DRAFT_LIST，多条 draft 独立继续编辑/发布/删除纯草稿。旧 DRAFT_RESUME 物理文件名仅为 Manifest 连续性保留。 | USER_APPROVED / APPLIED | PDM-06 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-GATE-BATCH1 | LOW_FI | Low-Fi Global Alignment Batch 1 Closeout | LF-B1-01～07 全部执行；Page/Navigation/State/Asset Map MD+CSV 同步；25 个旧 SVG 标记 RETIRED/DO_NOT_RESTORE；受影响 IA stale carrier 同步修复；LF-B1 定向 stale-current scan=0；无新增产品业务选择。 | PASS / USER_APPROVED / APPLIED / NEXT=LOW_FI_BATCH2 | Current Low-Fi Registers + SVG + IA repair + mechanical scan | 2026-10-08 |

| LF-B2-01 | LOW_FI | 客户分享归属旧 SOURCE_ONLY 规则退出 | 客户转发必须保留 share attribution；ownerless 新 Customer 按有效 share/referral owner 形成唯一 current owner，已有 owner 不被抢；无合法 share owner 才走接客池/owner_assignment_pending；分享本身不授 Recommendation/price-right。 | USER_APPROVED / APPLIED | PDM-03 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-B2-02 | LOW_FI | Recommendation actor / 4S 边界对齐 | Recommendation mutation 读取当前合法业务 responsible，不写死 current owner；4S Employee hard DENY，但 source_type=4S Vehicle 可被合法名邦 responsible 推荐。 | USER_APPROVED / APPLIED | PDM-14 Final + Current IA + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-B2-03 | LOW_FI | hidden visibility Authority 分离 | Matching/Priority 上下文只允许授权名邦员工查看内部候选；Demand/Priority 本身不授 Customer hidden visibility；客户访问 hidden Vehicle 必须读取 Recommendation visibility grant / valid Lock / Transaction 等独立当前 Authority。 | USER_APPROVED / APPLIED | PDM-13/PDM-14 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-B2-04 | LOW_FI | CRM 直接锁车旧链路退出 | E03-01 锁车只进入 E03-06 Vehicle 选择；形成真实 Customer+Vehicle+listing_cycle 后进入 E02-04 统一 Lock 确认；CRM 页面不直接创建 Lock。 | USER_APPROVED / APPLIED | PDM-16/PDM-18 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-B2-05 | LOW_FI | P06-07 通用 Opportunity 规则页退役 | V1 不建设通用 Customer Opportunity rules CRUD/config；P06-07 退出 Current 并保留 RETIRED / DO_NOT_RESTORE 历史文件；真实 Opportunity 只由批准的 deterministic signal 形成并由 E01-02 等聚合投影承载。 | USER_APPROVED / APPLIED | PDM-16/PDM-22 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-B2-06 | LOW_FI | Refund 主状态与权限收口 | Refund 主状态唯一 pending/refunded/closed；PROCESSING/COMPLETED 不再作为业务主状态；closed=决定不再退款且必须 close_reason；close 不新增专门 capability/审批，也不写死经理/店长；实际退款读取现有 refund/funds confirmation capability + scope。 | USER_APPROVED / APPLIED | PDM-19 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-B2-07 | LOW_FI | Announcement 主动弹层频控收口 | 同一 Customer 同一 UTC+8 业务自然日 Announcement 主动弹层全局最多实际展示 1 条；当天第一次进入触发；候选 enabled+effective+auto-popup ON；多候选按当前有效排序择一；不是每公告各每天一次。 | USER_APPROVED / APPLIED | PDM-24 Final + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-GATE-BATCH2 | LOW_FI | Low-Fi Global Alignment Batch 2 Closeout | LF-B2-01～07 全部执行；Low-Fi Page/Navigation/State/Asset Map MD+CSV 同步；P06-07 新增 1 个退役 SVG，累计 RETAIN_FILE_NOT_CURRENT=26；受影响实际 SVG 与 IA stale mirror 同步修复；Batch2 targeted stale-current scan=0；无新增产品业务选择。 | PASS / USER_APPROVED / APPLIED / NEXT=LOW_FI_BATCH3 | Current Low-Fi + IA repair + mechanical scan | 2026-10-08 |

| LF-B3-01 | LOW_FI | E01-01 false-missing carrier / IA stale repair | 机械差集中的 E01-01“今日待处理列表/详情”不是待补 Low-Fi 页面；旧“我要这辆车”混合 Consultation/LockRequest/Lock 链已被 PDM-14/15/18/20/21 Final 替代。Low-Fi 不新增 E01-01；Current IA 回修为“咨询→Consultation、锁车→LockRequest.PENDING、E07-07/E07-08 审核”链路。 | USER_APPROVED / APPLIED / NO_PRODUCT_SEMANTIC_CHANGE | PDM-14/15/18/20/21 Final + 2026-10-08 用户“全部同意，确认执行” | 2026-10-08 |
| LF-B3-02 | LOW_FI | Publisher 电话诊断 Current 指针正规化 | Current IA 中“最新电话”及 publisher 电话诊断旧 P03-05 指针统一为 P03-02；实际 Low-Fi 已为 P03-02，无需新增页面或 SVG。 | USER_APPROVED / APPLIED / NO_NEW_ASSET | PDM-09/PDM-22 Final + Current IA/Low-Fi + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-B3-03 | LOW_FI | C01-01 Lock 状态精确投影 | IA 泛化 `LOCKED` 正规化为现有 Low-Fi/current 产品投影：`LOCK_REQUEST_PENDING / LOCKED_BY_SELF / LOCKED_BY_OTHER`；不得为兼容旧 IA 再新增泛化 LOCKED SVG。 | USER_APPROVED / APPLIED / NO_NEW_ASSET | PDM-18/PDM-20 Final + Current Low-Fi + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-B3-04 | LOW_FI | Refund close 文案正规化 | IA 的 E07-M03/P07-M03“确认撤回/关闭”统一为“确认关闭”；业务仍为 pending Refund 关闭并形成 closed-not-refunded / CLOSED 历史事实，现有 Low-Fi 承载完整。 | USER_APPROVED / APPLIED / NO_NEW_ASSET | PDM-19 Final + Current Low-Fi + 2026-10-08 用户确认执行 | 2026-10-08 |
| LF-GATE-BATCH3 | LOW_FI | Low-Fi Global Alignment Batch 3 Closeout | LF-B3-01～04 全部批准执行；VALID_NEW_CARRIER_GAP=0；LOW_FI_NEW_PAGE=0；LOW_FI_NEW_STATE=0；LOW_FI_NEW_SVG=0；IA_STALE_CARRIER_REPAIR=4/4；targeted stale-current scan=0；LOCAL_PRODUCT_CHOICE_UNRESOLVED=0；Engineering 继续 NO_CONSTRUCTION。 | PASS / USER_APPROVED / APPLIED / NEXT=LOW_FI_BATCH4_FINAL_GAP_SCAN | Current IA + Current Low-Fi Registers + PDM Final reverse scan + 用户确认执行 | 2026-10-08 |
| LF-B4-01 | LOW_FI | LockRequest V2 carrier 索引补齐 | Final-gap Scan 确认 C01-M04、E07-07、E07-08、E07-M04、E07-M05 已在实际 Low-Fi Current 中存在完整页面/状态/导航/SVG，但 IA Page/State/Navigation 索引未完全登记；本轮仅按 PDM-18/PDM-20/PDM-21 Final 回填 carrier 索引与确认导航，不新增 Low-Fi 页面、不新增 SVG、不改变产品业务语义。 | USER_APPROVED / APPLIED / NO_PRODUCT_SEMANTIC_CHANGE | PDM-18/PDM-20/PDM-21 Final + Current Low-Fi + 2026-10-08 用户“同意确认执行” | 2026-10-08 |
| LF-GATE-BATCH4 | LOW_FI | Low-Fi Global Alignment Batch 4 Final-gap Closeout | LF-B4-01 已批准执行；FINAL_GAP_SCAN=PASS；LOW_FI_BUSINESS_CONFLICT=0；LOW_FI_VALID_MISSING_CARRIER=0；LOW_FI_DANGLING_NAV_TARGET=0；LOW_FI_MISSING_PHYSICAL_ASSET=0；LOW_FI_STATE_ASSET_GAP=0；LOW_FI_INCOMPLETE_PAGE=0；LOCAL_PRODUCT_CHOICE_UNRESOLVED=0；26 个历史退役资产继续 RETAIN_FILE_NOT_CURRENT；Low-Fi=COMPLETE/FINAL_GAP_PASS。 | PASS / USER_APPROVED / APPLIED / NEXT=ENGINEERING | Current IA + Current Low-Fi Registers + physical asset scan + PDM Final reverse scan + 用户确认执行 | 2026-10-08 |

| EG-GATE-20261008 | ENGINEERING_STARTUP_GATE | 工程启动门禁与双轨施工入口 | 用户明确“确认执行”：批准把旧工程复用差异台账、工程基础施工单及最终审查报告落库；Gate 按路径级 160/160 与接口主归属级 218/218 审核 PASS，F01 工程底层 + H01 Design System 为下组并行任务；代码/数据库/页面均未施工，细节验收继续由后续 F/H 单负责。 | 不改写 PDM Final / IA / Low-Fi，不恢复旧工程/旧 Delta，不将 Gate PASS 冒充实现验收。 | 2026-10-08 用户“确认执行” + 三份工程启动门禁文档 + PDM-01～25 Current Authority | 2026-10-08 |

| METHOD-ABC-20261008 | METHOD | A/B/C 三窗口分支协作、工程/设计路线与验收交接 | 用户明确“确认执行”，批准新增三份协作与路线图，更新 main 的 README、NEXT_ACTION、CURRENT_PROJECT_STATE、PROJECT_STATE；A 统一全局状态与验收，B/C 在独立分支实施并回报；当前唯一双轨仍为 F01+H01；后续 F02～F08、H02～H04 不是自动施工授权，合并 main 需单独批准。 | USER_APPROVED / APPLIED / GOVERNANCE_ONLY / NO_PRODUCT_SEMANTIC_CHANGE | 2026-10-08 用户“确认执行” + 三份 A/B/C 协作路线图；PDM-01～25 Final、Current IA/Low-Fi 和原 Gate 均未变更 | 2026-10-08 |

| EG-F01-ACCEPT-20261008 | ENGINEERING_F01 | F01 四批基础工程验收、B 工程分支合并 main 与遗留风险接管 | 用户先“同意”后明确“确认执行”，A 主控独立核查 F01-1～F01-4、成功 CI 37695813678（基础 13/13、PG 集成 5/5、真实断库/恢复 PASS），通过 PR #1 将 feat/f01-foundation 的 11 提交、27 文件安全合并 main，merge commit 16354f9784cb187dfc44289d9e5010e1471b1b81；F01=ACCEPTED。风险 F01-RES-01～05 继续交后续工程门禁，main 合并后没有独立 main CI 证明。 | USER_APPROVED / ACCEPTED / MERGED_TO_MAIN / PRODUCT_AUTHORITY_UNCHANGED / F02_F03_F04_GATE_ONLY / C_BRANCH_UNCHANGED | 2026-10-08 用户“确认执行” + `07_重建工作区/F01_工程基础验收与合并记录_2026-10-08.md` + [PR #1](https://github.com/suzhe868-arch/mb/pull/1) + [CI 37695813678](https://github.com/suzhe868-arch/mb/actions/runs/37695813678) | 2026-10-08 |
| EG-F02-TECH-20261008 | ENGINEERING_GATE | A-G02-01～10 F02/F03/F04 技术裁定 | 从新 main 开 feat/f02-schema、隔离 PG16、new-install 与 existing-db 分通道、受控 pg 原子 checksum 锁迁移、独立多草稿、三级车型 source mapping、CSV 只读审查、F02 优先 F03/F04 仅设计准备；TS/Fastify 为 F04 单入口待验证，F02 不产生权限授权。 | USER_APPROVED / A_TECHNICAL_REVIEW_PASS / PRODUCT_AUTHORITY_UNCHANGED | `07_重建工作区/F02_主控技术裁定与开工门禁_2026-10-08.md` + B 三份 Gate 交接报告 + 用户“确认执行” | 2026-10-08 |
| EG-F02-G0G1-20261008 | ENGINEERING_RELEASE | 用户批准 F02-G0 与有条件 F02-1 隔离开发测试 | F02-G0 环境与模型审查允许开工；只有 G0 被 A 实证验收，F02-1 才能在 disposable PG16 新装空库开发/测试。F02-2/3/4、真实已迁/生产库、F03/F04 代码、历史清库和 main 合并禁止。本轮 F02 测试 NOT_RUN，C/H01 独立继续。 | USER_APPROVED / G0_AUTHORIZED / F02_1_CONDITIONAL / OTHERS_NOT_AUTHORIZED | `07_重建工作区/F02_正式施工单_数据库模型与隔离开发_2026-10-08.md` + 用户“确认执行” | 2026-10-08 |


## 2026-10-09｜F02-1 工程验收与状态落库（不改变产品语义）

| ID | 范围 | 事项 | 裁决 | 授权边界 | 证据 | 日期 |
|---|---|---|---|---|---|---|
| EG-F02-1-ACCEPT-20261009 | ENGINEERING_F02_1 | 一次性隔离PG16 Current Initial Schema验收及A签发 | 用户明确“同意开始执行”，批准A将独立复验通过结论正式写入main；验收B SHA 9f10f65be293fd892e4787a3a3bdff2676c487ea，真实F02-1/G0 CI均成功，物理结构与冻结矩阵一致，历次阻断已闭合；F02_1_ACCEPTED / A_SIGNED | GOVERNANCE_ONLY；B/C不合并；F02-2/3/4、F03/F04正式施工不授权；不得访问真实/生产库；PRODUCT_BASELINE=NOT_READY | `07_重建工作区/F02-1_A主控最终验收签发与残余风险_2026-10-09.md`；CI 37843224982、37843225062；artifact 11578297739 | 2026-10-09 |


| EG-F02-1-MERGE-F03-GATE-20261009 | ENGINEERING_INTEGRATION | 已验收B合并及F03门禁准备 | 用户“同意开始实行”，A通过PR #2纳入已验收B SHA 9f10f65be293fd892e4787a3a3bdff2676c487ea，merge=3412dc76815e97a7df9024d8b7812a2aece7036c；F03-G0限定首批门禁准备完成待用户审查 | B合并已授权并完成；F03施工NOT_AUTHORIZED；C不合并；不访问真实库；PRODUCT_BASELINE=NOT_READY | `07_重建工作区/F02-1_工程合并main与后续门禁记录_2026-10-09.md`；`07_重建工作区/F03_开工门禁与分批施工建议_待用户批准_2026-10-09.md` | 2026-10-09 |


| EG-F03-G0-RELEASE-20261009 | ENGINEERING_F03_G0 | F03-G0限定首批正式放行 | 用户在A窗口明确“同意放行”；B从最新main新建feat/f03-auth，仅权限/身份会话合同、纯服务端决策和假数据静态核验与CI，自验后交A独立验收 | F03_G0_AUTHORIZED_ONLY；不连接DB；真实登录/会话迁移/F03后续批/F04仍未授权；不合并main；PRODUCT_BASELINE=NOT_READY | `07_重建工作区/F03-G0_A主控正式施工放行_2026-10-09.md`；`07_重建工作区/F03_开工门禁与分批施工建议_待用户批准_2026-10-09.md` | 2026-10-09 |


| EG-F03-G0-ACCEPT-MERGE-20261009 | ENGINEERING_F03_G0 | F03-G0正式验收合并与下一批工作单准备 | 用户在A窗口“同意”；A复验b4b56401b68ba91776ddd7edfa0b545586137720，两项阻断闭合，CI37852018024成功34/34；PR #3已合并，merge=6983709937ebf1d9ae8a7f6cd0a4267bb2269ac6；F03-1安全工作单准备完成待批准 | F03_G0_ACCEPTED_MERGED；下一批NOT_AUTHORIZED；无真实登录/DB/生产操作；PRODUCT_BASELINE=NOT_READY | `07_重建工作区/F03-G0_A主控验收与合并记录_2026-10-09.md`；`07_重建工作区/F03-1_账号登录与密码安全工作单_待批准_2026-10-09.md` | 2026-10-09 |


| EG-F03-1-G0-RELEASE-20261009 | ENGINEERING_F03_1_G0 | 登录密码安全方案限定小批正式放行 | 用户在A窗口明确“同意”；B从含本登记的最新main新建feat/f03-login，仅做安全方案、状态/会话合同、精确结构差异与纯假数据检查及CI，交A验收 | USER_APPROVED / F03_1_G0_DESIGN_ONLY_AUTHORIZED；真实登录/HTTP认证/DB迁移与后续批未授权；不合并B/C；PRODUCT_BASELINE=NOT_READY | `07_重建工作区/F03-1-G0_A主控登录安全方案施工放行_2026-10-09.md`；`07_重建工作区/F03-1_账号登录与密码安全工作单_待批准_2026-10-09.md`顶部增补 | 2026-10-09 |


| EG-F03-1-G0-ACCEPT-20261009 | ENGINEERING_F03_1_G0 | A限定方案批独立验收 | 用户要求A验收B最新整改；验收SHA d5987afc14d591db683facf15ebf767f9762af2a，同SHA CI37856201791成功19/19，A补查17/17，身份绑定与scrypt成本两处阻断闭合；F03_1_G0_ACCEPTED / A_SIGNED | DESIGN_FAKE_MODEL_ONLY；实际登录/DB迁移及后续批未授权；B未合并，合并需用户批准；PRODUCT_BASELINE=NOT_READY | `07_重建工作区/F03-1-G0_A主控验收签发与残余风险_2026-10-09.md`；CI37856201791/job113580861116/artifact11584022597 | 2026-10-09 |


| EG-F03-1-IMPL-PREPARE-20261009 | ENGINEERING_GATE_PREPARATION | A整理真实登录实现施工单 | 用户对“A整理实际登录施工单”回复同意；A形成单入口/白名单/PG16独立追加版本/真实HTTPS与事务并发验收范围，提交用户审查 | GOVERNANCE_ONLY / PREPARED_NOT_AUTHORIZED；G0方案B合并及F03-1实现均需另批；C不合并；PRODUCT_BASELINE=NOT_READY | `07_重建工作区/F03-1_真实登录与密码安全实现施工单_待批准_2026-10-09.md`；当前main f3baa6e71b853dd23903968e0dd4d94ceee11a52与已验收G0 SHA d5987afc14d591db683facf15ebf767f9762af2a | 2026-10-09 |


| EG-F03-1-MERGE-RELEASE-20261009 | ENGINEERING_F03_1 | 用户批准G0方案合并及限定真实登录实现施工 | 用户明确“同意”；A合并PR #4，merge=aa09c9a21752a5d3ce428253e29d2a0b88f76f46；15验收文件一致、原main1061文件保留；放行B从最新main新建feat/f03-login-impl，仅工作单登录/密码/会话/独立追加迁移及全新CI PG16测试 | USER_APPROVED / G0_ACCEPTED_MERGED / F03_1_IMPLEMENTATION_AUTHORIZED_NOT_YET_IMPLEMENTED；后续批/生产未授权，C不合并；PRODUCT_BASELINE=NOT_READY | `07_重建工作区/F03-1_A主控方案合并与真实登录隔离施工放行_2026-10-09.md`；`07_重建工作区/F03-1_真实登录与密码安全实现施工单_待批准_2026-10-09.md`顶部增补；PR #4 | 2026-10-09 |


| EG-F03-1-ACCEPT-20261009 | ENGINEERING_F03_1 | A限定真实登录实现验收签发 | 用户要求A复验B；四项阻断闭合，工程SHA 0c2a9d3c998149fb086a5eac19639a1a0ca9e71a真实CI37863317173成功、专项19/19；归档SHA73e794119fea9630fd81eb84dd7c08eda7c9f664仅追加原始证据，A独立校验SHA256及80表/487字段/299约束/123索引；F03_1_ACCEPTED / A_SIGNED | ISOLATED_IMPLEMENTATION_ONLY / GOVERNANCE_ONLY / NOT_MERGED；工程合并需用户批准，后续施工及生产未授权；PRODUCT_BASELINE=NOT_READY | `07_重建工作区/F03-1_A主控最终验收签发与残余风险_2026-10-09.md`；job113603999025/artifact11587760762；engineering/f03-1/evidence | 2026-10-09 |


| EG-F03-1-MERGE-20261009 | ENGINEERING_INTEGRATION | 用户批准F03-1工程纳入main | 用户明确“同意”，A通过PR #5合并B归档SHA73e794119fea9630fd81eb84dd7c08eda7c9f664，merge=3a7e5dbc389533cdcf05850cbaff595b97e3812b；22工程blob与B一致，1076无关main文件原样保留，新增20文件；A下一步仅准备F03-2门禁 | F03_1_ACCEPTED_MERGED_USER_APPROVED；后续施工/生产/C合并未授权；本次未额外运行测试；PRODUCT_BASELINE=NOT_READY | `07_重建工作区/F03-1_工程合并main与后续门禁记录_2026-10-09.md`；PR #5；工程CI37863317173属于已验收工程SHA | 2026-10-09 |


| EG-F03-2-G0-PREPARE-20261009 | ENGINEERING_GATE_PREPARATION | A整理运行期权限与治理事务分批工作单 | 用户对A整理下一批工作单回复“同意”；A读取PDM-02/03/22/25 Final、已验收G0权限合同、F03-1认证实现与实际Schema，建议先F03-2-G0事实映射/scope/治理事务设计及静态核验，真实DBGuard与治理/交接另批 | GOVERNANCE_ONLY / PREPARED_NOT_CONSTRUCTION_AUTHORIZED；B暂不创建新分支，不连接DB；不改产品Authority，不合并C；PRODUCT_BASELINE=NOT_READY | `07_重建工作区/F03-2_运行期权限校验与治理事务施工单_待用户批准_2026-10-09.md`；main e3ccaffda57f135d44f5009758f2d1c943938633；F03-1已验收合并记录 | 2026-10-09 |


| EG-F03-2-G0-RELEASE-20261009 | ENGINEERING_F03_2_G0 | 限定事实映射与事务方案小批正式放行 | 用户对A明确限定G0范围回复“同意”；A正式放行B从含登记的最新main新建feat/f03-runtime-g0，只做真实字段/scope/治理与撤权并发设计、结构建议、纯假数据及静态CI，交A独立验收 | USER_APPROVED / F03_2_G0_DESIGN_STATIC_ONLY_AUTHORIZED；不连接数据库，不改已验收工程；真实Guard/治理/交接后续另批，不合并B/C；PRODUCT_BASELINE=NOT_READY | `07_重建工作区/F03-2-G0_A主控事实映射与事务方案施工放行_2026-10-09.md`；`07_重建工作区/F03-2_运行期权限校验与治理事务施工单_待用户批准_2026-10-09.md`顶部正式放行增补 | 2026-10-09 |


| EG-F03-2-G0-REVIEW-20261009 | ENGINEERING_F03_2_G0 | A首轮独立复验要求五项整改 | B HEAD a56cb746ae14a2047be791a204b8b367767c7c9f同SHA CI37877324106成功22/22，14文件范围正确；A核验已存在role_default_permission_history并独立复现模板经理越权、正常停用清空接客池、4S PC撤权旧会话放行、审计占位前后值；CHANGES_REQUESTED，未签验收 | G0原静态授权持续，仅当前分支整改；不连接DB，不改已验收工程，不放行后续批，不合并B/C；PRODUCT_BASELINE=NOT_READY | `07_重建工作区/F03-2-G0_A主控首轮复验与五项整改清单_2026-10-09.md`；job113648785834；main已验收SQL/PDM-02 Final；A独立合成探针 | 2026-10-09 |


## 2026-10-09｜F03-2-G0最终验收签发（工程门禁）

- A正式签发 **F03_2_G0_ACCEPTED / A_SIGNED / STATIC_DESIGN_ONLY / NOT_MERGED**；五项整改R1～R5已闭合。本结论不等于F03_2_ACCEPTED。
- 验收工程：B `feat/f03-runtime-g0`，SHA `d2c76ef2d27775a700fe1dbfa4be546c03253f1a`；同SHA [CI37880600267](https://github.com/suzhe868-arch/mb/actions/runs/37880600267)成功，G0测试36/36；A独立补充检查11/11通过。
- 验收记录：`07_重建工作区/F03-2-G0_A主控最终验收签发与残余风险_2026-10-09.md`。范围仅设计、合同、纯假数据模型及静态检查；没有真实数据库、运行期Guard或治理事务验收。
- **当前唯一工程下一步：A整理本批合并核验材料，以及F03-2-1真实权限校验所需的技术裁决和施工单，交用户审查；B等待，不开始新施工。** 分支合并及下一批施工仍须分别授权。
- SG09复用已有`role_default_permission_history`；SG01～08仍为待裁决建议，不能据G0验收直接建表。真实锁/并发、撤权HTTP重验、事务审计及交接适配未执行。
- F03-1已验收合并；C/H01独立未最终验收。PDM Final/Current IA/Low-Fi不变；不访问已有/业务/生产库、不部署、不启动正式前端；F03-2后续实现批、F03-3、F02-2/3/4、F04未授权，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_2_G0_ACCEPTED_A_MERGE_AND_IMPLEMENTATION_GATE_PREPARATION_AND_H01_VISUAL_REVIEW`。以下首轮整改和初次放行信息仅保留为历史。

本记录为工程门禁，不改动PDM产品规则。B整改R1～R5闭合；真实CI36/36和A工具内假数据模型检查11/11通过。依据：`07_重建工作区/F03-2-G0_A主控最终验收签发与残余风险_2026-10-09.md`。保留首次未通过报告作为历史，不以本批验收自动批准合并、新表、真实Guard或下一批施工。


## 2026-10-09｜G0合并材料与F03-2-1A施工单准备（未放行）

- A已整理已验收G0的合并材料及 [草稿PR #6](https://github.com/suzhe868-arch/mb/pull/6)；尚未合并。工程HEAD仍为`d2c76ef2d27775a700fe1dbfa4be546c03253f1a`，同SHA CI36/36，五项整改闭合，F03_2_G0_ACCEPTED有效。
- 合并材料：`07_重建工作区/F03-2-G0_A主控合并核验材料_待用户批准_2026-10-09.md`；建议下一小批：`07_重建工作区/F03-2-1A_当前身份权限事实读取与撤权重验施工单_待用户批准_2026-10-09.md`。
- **当前唯一工程下一步：用户审查并分别批准G0合并与F03-2-1A施工单，A随后登记及执行对应授权；B暂时等待。**
- F03-2-1A建议在独立全新一次性PG16验证当前身份/权限事实读取、旧会话撤权和缺范围证据拒绝；无F03-2 DDL，不开放业务接口。此建议尚未放行，未创建施工分支，测试NOT_RUN。
- SG01～08新结构、完整范围Guard、治理事务/交接及F03-3/F04等后批仍未授权。本次用户“同意”仅批准A准备材料。
- PDM Final/Current IA/Low-Fi、既有工程不变；不访问已有/业务/生产库，不部署；C/H01独立未最终验收、不合并C、不加折叠屏专项，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_G0_MERGE_AND_F03_2_1A_WORK_ORDER_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`。以下既有验收登记保留为历史。

此为工程门禁准备，不构成产品裁决。为减少未裁决结构依赖，建议将F03-2-1分为1A可信当前事实读取和撤权重验、后续1B逐能力范围结构与完整Guard；不得把缺scope时拒绝全部业务包装为完整动态鉴权实现。合并与1A施工须分别获得用户批准，A完成正式登记后才可执行。


## 2026-10-09｜用户确认G0合并与F03-2-1A限定施工放行

- 用户在A窗口确认“确实”，批准A合并已验收G0方案并放行施工单中限定的F03-2-1A；A已完成 [PR #6](https://github.com/suzhe868-arch/mb/pull/6) merge，SHA `df4135f1e2eb37b109e4e23ff63642c211a643fa`。
- 合并验收：18新增文件blob均与B验收HEAD `d2c76ef2d27775a700fe1dbfa4be546c03253f1a` 完全相同，main原有1105文件保持原字节；合并后1123文件。G0验收CI36/36、A模型检查11/11仍为既有证据，不冒充本批测试。
- **A正式签发F03_2_1A_AUTHORIZED / USER_APPROVED / A_RELEASED / NOT_YET_IMPLEMENTED。当前唯一工程下一步：B从含本放行的最新main新建`feat/f03-runtime-facts`，执行当前身份/权限事实读取、旧会话撤权重验和缺范围证据拒绝的限定施工单，完成后交A独立验收。**
- 放行记录：`07_重建工作区/F03-2-1A_A主控方案合并与当前权限事实隔离施工放行_2026-10-09.md`；施工单：`07_重建工作区/F03-2-1A_当前身份权限事实读取与撤权重验施工单_待用户批准_2026-10-09.md`（以本次正式放行增补为准）。
- 仅在GitHub Actions独立PG16全新空库施工及测试，复用已验收F02→F03-1基线与隔离Guard；不新增F03-2 DDL、不启动F04业务接口。允许新增`engineering/f03/runtime-facts/**`和`.github/workflows/f03-2-1a-runtime-facts.yml`；既有工程/迁移/manifest/工作流保持，必要入口修改须先交A具体审查。
- 本批测试NOT_RUN、F03_2_1A_ACCEPTED尚未签发；完整范围Guard、SG01～08结构、治理事务/交接、F03-3/F04等仍另批。C/H01独立未最终验收、不合并C；PDM Final/Current IA/Low-Fi保持，不访问已有/业务/生产库、不部署、不启动正式前端、不加折叠屏专项，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1A_B_TRUSTED_RUNTIME_FACTS_AND_REVOCATION_A_REVIEW_AND_H01_VISUAL_REVIEW`。以下准备时“未批准/等待”状态仅为历史。

本记录仅改变工程门禁授权：G0方案合并已执行，1A真实当前事实读取与旧会话撤权限定施工已放行。施工单提出的无DDL、缺范围证据拒绝和隔离测试策略只在此批适用；不新增产品规则，不批准SG01～08结构或完整后续Guard/治理/交接。


## 2026-10-09｜F03-2-1A首轮复验补测补证（工程门禁）

- A独立复验B `feat/f03-runtime-facts` HEAD `319db71604e1efd2ce12dbba7990c7ed1d3bc62a`；同SHA [CI37886758651](https://github.com/suzhe868-arch/mb/actions/runs/37886758651)成功，当前PG16测试9/9、HTTPS探针3/3。旧会话撤权测试可见，但完整验收仍有补项。
- **结论：CHANGES_REQUESTED / F03_2_1A_ACCEPTED尚未签发。** 报告：`07_重建工作区/F03-2-1A_A主控首轮复验与补测补证清单_2026-10-09.md`。
- **当前唯一工程下一步：B在当前分支补齐当前主店变化/身份硬禁令的真实测试、已验收F03-1真实认证与HTTPS安全回归，并归档本批CI结构证据，提交新SHA与同SHA成功CI交A复验。**
- 本批限定隔离PG16、无新DDL的授权持续有效；只允许原runtime-facts目录和本批工作流。完整scope Guard、SG01～08结构、治理/交接及后批未授权；不合并本B分支或C。
- G0已验收合并；PDM Final/Current IA/Low-Fi及既有工程保持。C/H01独立未最终验收、不增加折叠屏专项；不访问已有/业务/生产库、不部署或正式前端施工，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1A_B_CLOSE_TEST_AND_EVIDENCE_GAPS_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下初次放行信息为历史。

当前工程12项真实测试成功，但合同主店变化和身份负例、原真实认证/HTTPS安全回归及A可读结构证据未完全闭合；不签F03_2_1A_ACCEPTED。仅继续原限定范围补测补证，不新增产品权限、DDL或业务接口。


## 2026-10-09｜F03-2-1A最终验收签发（工程门禁）

- A正式签发 **F03_2_1A_ACCEPTED / A_SIGNED / LIMITED_CURRENT_FACTS_AND_REVOCATION_ONLY / NOT_MERGED**；R1、R2、E1已闭合。完整F03-2-1、F03_2_ACCEPTED未签。
- B验收SHA `bc1261ce090180d87b262744bd2b16e7c6caf60f`；同SHA [CI37891029812](https://github.com/suzhe868-arch/mb/actions/runs/37891029812)三个独立PG16作业全部成功。本批当前事实12/12、HTTPS旧会话3/3、证据校验4/4；原真实认证11/11及HTTPS安全4/4回归通过。
- 验收报告：`07_重建工作区/F03-2-1A_A主控最终验收签发与残余风险_2026-10-09.md`。A已读取归档SQL及inventory原文，独立计算SHA256与源清单精确吻合；结构与已验收F03-1一致（仅pg_dump配对随机key不同），无F03-2新DDL。
- **当前唯一工程下一步：A整理本批合并核验，以及逐能力范围结构与完整Guard下一批的技术裁决/施工单，供用户分别审查；B等待。** 合并本分支及下一批施工尚未获批。
- 本批只证明当前可信事实读取与撤权后的新请求重验。业务最终允许仍因scope/对象证据不足拒绝，未开放业务接口；SG01～08结构、完整写提交Guard、治理/交接及后批仍需分别授权。
- G0已验收合并；PDM Final/Current IA/Low-Fi及既有工程保持。C/H01独立未最终验收、不合并C、不增加折叠屏专项；不访问已有/业务/生产库、不部署或正式前端施工，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1A_ACCEPTED_A_MERGE_AND_SCOPE_GUARD_GATE_PREPARATION_AND_H01_VISUAL_REVIEW`；以下首轮整改信息保留为历史。

R1/R2/E1闭合，仅签限定当前事实读取及新请求撤权重验F03_2_1A_ACCEPTED；不是完整业务授权、范围DDL、治理或交接实现。结构独立原文哈希与已验收基线比对通过；本批合并/下一批施工仍单独待用户批准。旧首轮整改报告保留为历史。


## 2026-10-09｜1A合并材料与1B技术施工单准备（未放行）

- A已整理1A合并材料并创建 [草稿PR #7](https://github.com/suzhe868-arch/mb/pull/7)，尚未合并；验收HEAD `bc1261ce090180d87b262744bd2b16e7c6caf60f` 不变，F03_2_1A_ACCEPTED有效。
- 合并材料：`07_重建工作区/F03-2-1A_A主控合并核验材料_待用户批准_2026-10-09.md`；下一批建议：`07_重建工作区/F03-2-1B_逐能力客户范围与限定真实Guard施工单_待用户批准_2026-10-09.md`。
- **当前唯一工程下一步：用户分别审查批准1A合并与1B施工单，A随后登记并执行相应授权；B暂时等待。**
- 1B建议先把已冻结customer.phone.manage与具体客户范围绑定，完成限定内部Guard的真实允许/越界拒绝；提出一张逐能力scope关联表、旧scope表追加一个唯一约束、000003追加迁移及独立精确新版Guard。当前仅技术建议，结构和施工未授权。
- 已验收80表旧Guard保持原字节且必须拒绝81表新库；1B建议独立新Guard和独立测试库，不能简单改计数或关校验。无实际电话业务改动，无正式接口，其他范围/业务动作与治理/交接另批。
- 本次用户“同意”只批准A准备材料；未创建1B工程分支、未测试/迁移，TESTS=NOT_RUN。已有/业务/生产库、部署/正式前端、后批施工仍未授权。
- C/H01独立未最终验收、不合并C、不加折叠屏专项；PDM Final/Current IA/Low-Fi及已验收工程保持，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1A_MERGE_AND_F03_2_1B_SCOPE_WORK_ORDER_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下既有验收记录为历史。

本次仅工程建议，不替代产品裁决。PDM-02 §4/§11是既有权限依据；新增结构和object范围技术解释须本单明确批准，不能由已验收1A授权推导。建议旧80表Guard不改、新81表Guard独立且精确，防止迁移后关闭结构保护；业务权限正例限定内部customer.phone.manage判断，不执行电话变更。


## 2026-10-09｜用户确认1A合并与1B限定隔离施工放行

- 用户在A窗口明确“确认”，批准1A成果合并及1B施工单；A已完成 [PR #7](https://github.com/suzhe868-arch/mb/pull/7) merge，SHA `22c4d8ea405f4f6d47c0c128d68f69dbd417e812`。
- 18新增文件blob均与验收HEAD `bc1261ce090180d87b262744bd2b16e7c6caf60f` 完全一致，main原有1128文件原字节保持，合并后1146文件；旧Authority/工程不变。1A验收真实CI37891029812仍为对应HEAD既有证据，不冒称本批测试。
- **A正式签发F03_2_1B_AUTHORIZED / USER_APPROVED / A_RELEASED / NOT_YET_IMPLEMENTED。当前唯一工程下一步：B从含本放行的最新main新建`feat/f03-runtime-scope`，执行逐能力客户范围与限定真实Guard施工单，完成后交A独立验收。**
- 放行：`07_重建工作区/F03-2-1B_A主控成果合并与客户范围隔离施工放行_2026-10-09.md`；施工单：`07_重建工作区/F03-2-1B_逐能力客户范围与限定真实Guard施工单_待用户批准_2026-10-09.md`（以本次正式放行增补为准）。
- 只允许独立一次性PG16全新空库。此次明确批准SG01限定一张五列scope关联表、旧scope表追加一个复合唯一约束、所列FK/CHECK/索引、000003独立追加迁移和精确81表新Guard；旧000001/000002及80表Guard保持，其他SG02～08不施工。
- 业务判断正例仅`customer.phone.manage`匹配具体客户object范围及当前状态的**内部Guard**；不实际修改电话、不开放业务接口，其他动作/范围仍DEFER。新增仅`engineering/f03/runtime-scope/**`及`.github/workflows/f03-2-1b-runtime-scope.yml`。
- 本批测试NOT_RUN、F03_2_1B_ACCEPTED未签；完整F03-2-1/F03_2_ACCEPTED未签。治理/交接、F03-3/F04等后批、部署/正式前端、本批分支合并仍分别未授权。
- C/H01独立未最终验收，不合并C、不加折叠屏专项；PDM Final/Current IA/Low-Fi不改，不访问已有/业务/生产库，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1B_B_CAPABILITY_CUSTOMER_SCOPE_GUARD_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下旧待批准/等待信息为历史。

此次明确批准工程技术delta：SG01五列关联表、scope复合唯一及所列约束/索引、000003独立追加迁移与精确新Guard；PDM-02 §4/§11仍是既有Authority。只实现限定customer.phone.manage内部object范围判断，不授业务电话变更、其他scope/动作或SG02～08施工权。


## 2026-10-09｜F03-2-1B首轮独立复验未通过

- A独立复验B `feat/f03-runtime-scope` HEAD `df27522891438c51ff8847cc5e018b698c0a98fc`；同SHA [CI37901077203](https://github.com/suzhe868-arch/mb/actions/runs/37901077203)三个独立PG16作业成功。本批迁移6/6、范围7/7、HTTPS2/2，但存在版本门禁与测试覆盖缺口。
- **结论：CHANGES_REQUESTED / F03_2_1B_ACCEPTED尚未签发。** 报告：`07_重建工作区/F03-2-1B_A主控首轮复验与三项整改及补证清单_2026-10-09.md`。
- **当前唯一工程下一步：B在当前分支闭合R1完整版本链、R2非public命名空间隔离、R3有针对性的约束/HTTPS负例，补可读结构原文和实际校验，提交新SHA与同SHA成功CI交A复验。**
- 原1B限定结构/Guard及独立全新PG16授权持续有效；只在runtime-scope及本批新工作流整改，不改旧工程/产品Authority、不新增范围或业务接口、不合并B/C。
- 1A已验收合并；后续治理/交接、其他动作/范围、SG02～08、F03-3/F04、部署/正式前端未授权。C/H01独立未最终验收、不加折叠屏专项；不访问已有/业务/生产库，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1B_B_FIX_VERSION_ISOLATION_TEST_GAPS_AND_ARCHIVE_EVIDENCE_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下初次放行信息为历史。

A补充代码路径复现显示幂等apply/rollback遗漏旧版本行核验，verify同异常则拒绝；非public用户namespace未检查，部分约束与HTTPS测试受其他拒绝掩盖。限定原范围整改及补实际结构原文，不签F03_2_1B_ACCEPTED。


## 2026-10-09｜F03-2-1B限定工程验收签发（非新增产品裁决）

- 用户同意A正式登记已独立复验通过的1B及准备合并审核材料，**不包含立即合并或后续施工授权**。
- A正式签发 `F03_2_1B_ACCEPTED / A_SIGNED / NOT_MERGED`，固定B HEAD `3376f2efff8f95462d7bdaa79c688c3208d2eeac`、同SHA真实成功CI37904745833，三个独立PG16作业；R1/R2/R3/E1关闭。A独立读取归档并校验SHA256、旧1664项/新1687项仅批准23项新增，旧对象无修改。
- 验收报告：`07_重建工作区/F03-2-1B_A主控最终验收签发与残余风险_2026-10-09.md`；合并待批：`07_重建工作区/F03-2-1B_A主控合并核验材料_待用户批准_2026-10-09.md`。
- 当前唯一下一步：用户单独批准合并前B等待。完整F03-2验收、其他scope/动作、SG02～08、治理/交接、部署/C/H01仍未授权；PDM Final/Current IA/Low-Fi不变，`PRODUCT_BASELINE=NOT_READY`。


## 2026-10-09｜F03-2-1B验收后PR8正式合并

- A依据用户明确继续指令已通过PR8正常合并，SHA eeeb4f12936b313c0405ebd880717d4be90feb53；B同SHA CI37904745833三项PG16测试成功；旧main 1150文件全部原blob不变，新24文件与B精确一致。
- 以后每批一次施工授权包含A独立验收合格后的正常合并，无重复审批；新批须单独授权，冲突/失败/越界即阻断。这是工程流程，不改产品Final。
- 下一步A审查F03-2-1剩余范围和F03-2-2治理门禁，B等待。C/H01未最终验收，PRODUCT_BASELINE=NOT_READY。


## 2026-10-09｜A下一批F03-2-2A技术准备完成（非产品新裁决，未授权施工）

- 在已验收合并F03-2-1B基础上，A完成下一批施工单、依赖技术门禁和45项能力/14类治理逐行承接矩阵。依赖PDM-02/03/22/25 Final，保留完整历史及禁恢复边界。
- 下一批建议仅在新建隔离PG16测试库中对现有sales×customer.phone.manage执行System Admin模板enabled=true配置，真实验证current/history/audit原子事务、并发、幂等和失败回滚，不做模板降权、跨域交接、真实电话修改或新DDL。
- A门禁：`07_重建工作区/F03-2-2A_A主控依赖裁决与启动门禁_待用户批准_2026-10-09.md`；候选施工单：`07_重建工作区/F03-2-2A_角色模板限定启用与原子历史审计施工单_待用户批准_2026-10-09.md`；承接表：`07_重建工作区/F03-2-1B后_45项能力及14类治理承接矩阵_2026-10-09.tsv`。
- B尚未获新批授权，不得施工；按用户认可的单批一次授权流程，2A获批且A独立验收通过后符合门禁即可直接合并。完整F03-2未验收，C/H01独立待审，PRODUCT_BASELINE=NOT_READY。


## 2026-10-09｜F03-2-2A单批授权、真实验收通过及PR接口阻断（工程记录，不是产品规则新增）

- 用户明确一次性“确认执行”2A限定施工与验收合格后的正常合并；A已正式放行。B在指定分支只新增7个已授权文件，最新SHA`da8a17ec5ce7e004ae158f3d3165469650c344c5`，同SHA成功CI37948076366的3个真正独立PG16作业全部success：治理9/9、原认证11/11、原HTTPS4/4。
- A独立Git tree核验原main基线1179文件blob均未变，新7文件均合法；精确81表结构和000001→000003迁移保持。A签发`F03_2_2A_ACCEPTED`，不是`F03_2_ACCEPTED`；评审详见`07_重建工作区/F03-2-2A_A主控独立验收签发与真实CI证据_2026-10-09.md`。初始和中间两次失败CI真实保留，不冒称成功。
- **标准GitHub PR创建调用被工具安全检查阻断，目前没有PR、也没有合并main。** 为遵守已确定正常合并门禁，A没有直接重写main或绕过PR保护。本批原用户授权持续有效，不应再要求第二次点击；后续独立新批仍未授权。C/H01独立待审、`PRODUCT_BASELINE=NOT_READY`。


## 2026-10-09｜F03-2-2A 标准 PR #9 合并完成，原PR阻断已解除

- 用户原“确认执行”一次授权涵盖本批限定施工、A独立验收通过后直接合并。A已以标准 [PR #9](https://github.com/suzhe868-arch/mb/pull/9) 正常merge，合并SHA `6cb9cc0768cb3b3f6644b457a64b715e3828fc9a`，两个父提交分别是原main `4502d559e492efc45120dc8f1fdb25d8578251f9` 与B已验收同SHA CI最终提交 `da8a17ec5ce7e004ae158f3d3165469650c344c5`（CI37948076366三作业success）。
- 合并A独立复核：原main 1180文件逐blob未变，B新增7文件逐blob完全相同，修改/删除0，无越界。此前“PR创建接口阻断/未合并”仅保留历史复盘，**当下已闭合，不要求用户重复点击**。合并报告：`07_重建工作区/F03-2-2A_A主控PR9合并完成与下一步_2026-10-09.md`。
- 仅本批合成PG16治理最小闭环验收合并；F03-2其它治理、模板降权/交接、正式API等未完成/未授权，完整F03-2尚未验收；C/H01待用户视觉复审，`PRODUCT_BASELINE=NOT_READY`。
- 下一独立工程批次仍由A先整理技术依赖与施工单；本次“同批一次授权”不能被视为新批无限施工授权。此项为工程流程事实登记，不修改PDM Final。


## 2026-10-09｜用户更新A/B/C三窗口持续闭环执行方式（工程流程裁决，不改变PDM Final）

- 用户明确要求：A/B/C各自在收到完整任务后**一次把本职工作做完**，A先完成所有技术审查和施工单并正式放行再告诉用户“下一步B执行”；B工程按当前单一次完成实现、真实测试、失败整改、提交同SHA CI和证据，直接交A；C高保真完成整批视觉整改与真正渲染/资产自验再交A。A独立审核不通过统一出全量整改清单；通过可正常PR合并main、更新全局状态，**不再以每个子步骤/后续PR合并向用户重复索取“同意/确认执行”**。
- 现行可执行规范完全重写`07_重建工作区/A_B_C三窗口协作与验收规范.md`；B/C路线图均增加新入口并明确历史F01/H01门禁字样失效的范围。新技术批必须A书面裁决并限定目录/迁移/真实隔离环境，不等于不受控自行改业务规则。
- **保留用户实质裁决权**：新增/冲突PDM Final业务选择、关键视觉方向新增决定、生产部署、真实凭据/真实数据/真实第三方或资金外部动作、不可逆破坏等仍集中一次批准；持续执行授权仅覆盖冻结规则内的非生产技术开发/隔离测试/视觉返工。A/B/C独立聊天不具备自动消息同步能力，GitHub是任务与验收真实交接依据，不能谎称另窗口已经开工。
- **A已完成下一工程任务裁决并放行B**：`07_重建工作区/F03-2-2B_A主控技术裁决与完整工程施工单_2026-10-09.md`，范围SG05最后System Admin active/有效登录保护、持久bootstrap claim和独立合成PG16完整CI，仅追加000004，原000001-000003冻结。当前`NEXT_OWNER=B`，新分支`feat/f03-admin-population-2b`尚未建立，B未施工，不能声称已实现。
- 本流程只改协作节奏和技术门禁，**不修改**`PDM-01～25 Final`、Current IA、Current Low-Fi，不自动解除C/H01核心视觉/用户验收、不认定完整F03-2/产品基线已完成。


## 2026-10-10｜F03-2-2B A验收合并完成；A独立放行F03-2-2C SG03接客池限定施工

- F03-2-2B B最终SHA`448869df7258a868292601791d8460c346414dd3`同SHA [GitHub CI 37955103517](https://github.com/suzhe868-arch/mb/actions/runs/37955103517)五独立PG16作业全success（82表SG05管理员保护10/10、空库首次bootstrap1/1、原81表模板9/9、原80表认证11/11及HTTPS4/4）。A核对源代码/物理证据和Git tree；基线1189旧文件完整保留不变、仅19新增。标准[PR #10](https://github.com/suzhe868-arch/mb/pull/10)合并完成，merge SHA`bd31e81a16a9fe219e678f1f01020965deae320b`。A签收/合并报告：`07_重建工作区/F03-2-2B_A主控独立验收及PR10合并闭环_2026-10-10.md`。
- A按持续一次性完整闭环规则已完成下一SG03技术裁定和施工单，限定在新一次性PG16内实现**可信显式employee receiving eligibility与最后合格接客池正常OFF/撤资格保护**，仅员工本人接客ON/OFF及独立System Admin内部资格治理，独立追加`000005`，未知物理值必须先核对事实；其余委托/客户Owner/生产业务尚未授权。正式施工单：`07_重建工作区/F03-2-2C_A主控接客资格与最后接客池完整施工单_2026-10-10.md`。
- **下一责任人B**：仅在指定`feat/f03-receiving-pool-2c`从最新main执行全部真实实现、CI失败整改、证据归档直到`READY_FOR_A_REVIEW`再交A，不须每一步再问用户。尚未施工/未跑2C CI，`PRODUCT_BASELINE=NOT_READY`、完整F03-2不签、C/H01独立视觉待验。本条为工程裁定与已发生验收事实，不更改PDM Final或许可真实生产/外部凭据。


## 2026-10-10｜F03-2-2C A独立验收/PR11正常合并；F03-2-2D SG02团队可信范围A完整放行

- F03-2-2C B最终SHA`d7eb69e1fd2a8c53ef75aa250f5a01e5aa645dd4`；同SHA [CI37959483511](https://github.com/suzhe868-arch/mb/actions/runs/37959483511) 六独立PG16作业全部success，SG03真实接客/并发/最后合格员工保护与原子回滚11/11、旧82 SG05管理员10/10和bootstrap1/1、旧81模板9/9、旧80认证11/11和HTTPS4/4。新版本`000005`精确84表/502列/314约束/129索引、旧82表目录原样不变且只新增22项。A核验冻结源码、同SHA日志、结构归档、文件树：原main1210文件零修改/删除，新17文件均获批。标准 [PR #11](https://github.com/suzhe868-arch/mb/pull/11) 合并SHA`955a6bb8da6213e13a6249709fb11db65841a3bc`；A签发`07_重建工作区/F03-2-2C_A主控独立验收与PR11正式合并闭环_2026-10-10.md`。用户无需额外点击。
- 按现行三窗口连续执行规范，A已在PDM-02/03/22 Final权限界内技术裁定后续SG02只做显式名邦team与employee-team有效期结构、可信team capability scope内部事实证明和独立隔离PG16原子审计测试；严禁同店即同team、经理自动有团队治理权、自动成为Customer owner、真实生产/团队业务路由。只准追加`000006`两表、不得改旧版本；完整施工单`07_重建工作区/F03-2-2D_A主控SG02团队关系与可信范围完整工程施工单_2026-10-10.md`，**A正式放行、下一责任人B**，分支`feat/f03-team-scope-2d`，尚未开始施工或运行新CI。B一次完成所有实施、真实并发/负例/独立版本回归、原结构证据及同SHA成功CI，到`READY_FOR_A_REVIEW`交A。
- 本次不是改变Final组织模型或授予任何新产品permission；SG04/06/07/08、经理实际写、生产接口与客户Owner都不在范围内。完整`F03_2_ACCEPTED=NO`，C/H01仍独立待审，`PRODUCT_BASELINE=NOT_READY`。


## 2026-10-10｜F03-2-2D A独立验收/PR12合并；F03-2-2E SG06待处理交接账本正式放行

- B受限SG02团队真实代码固定SHA `1f4578f4d9604e426c46f442e6e658402ad70b85`；同SHA[CI37964554999](https://github.com/suzhe868-arch/mb/actions/runs/37964554999)七独立PG16作业全部success（86表团队9/9、旧84表接客11/11、82表管理员10/10与bootstrap1/1、81表模板9/9、原80表认证11/11及HTTPS4/4）。86表/513列/323约束/132索引、旧目录不变和42新增catalog键得到真实证据。A逐Git blob检查1229旧文件完全未动、新增17文件均授权，标准[PR #12](https://github.com/suzhe868-arch/mb/pull/12)正常merge提交 `e53a4faa0228afb9ec18372f32125ccd3a4befcf`。签发`07_重建工作区/F03-2-2D_A主控独立验收与PR12合并闭环_2026-10-10.md`；此前2D未施工/未审状态仅作历史。
- A依据PDM-02/03 Final审查SG06已有`customer_owner_history`与缺失的`handover_batches/handover_items`，已完整裁定并正式放行**F03-2-2E受限交接账本技术批**：新`000007`只在CI独立新PG16新增两表、可信batch/item待处理/失败重试、逐项原子审计/幂等、跨项失败保留；**不提供`completed`、真实Customer owner/Lock/Transaction负责人变更、降权/调店提交许可证，也不把账本视为已完成业务交接**。正式施工单`07_重建工作区/F03-2-2E_A主控SG06交接账本与逐项幂等施工单_2026-10-10.md`。下一责任人B，指定分支`feat/f03-handover-ledger-2e`，尚未施工/无本批CI；按A/B/C一次闭环规范B直接执行至`READY_FOR_A_REVIEW`后交A。
- 其它SG04、SG06各真实业务域、SG07、SG08及完整F03-2、生产部署、C/H01视觉验收均不包含。本次仅改变工程落实阶段的事实状态，PDM Final/IA/Low-Fi均未改写，`PRODUCT_BASELINE=NOT_READY`。


## 2026-10-10｜F03-2-2E A独立验收PR13合并；A放行下一F03-2-2F受限员工管理权限治理

- A确认B固定最终提交`86e838fa1f66f44827dfb399dbaf1887a9934283`，同SHA [CI37968929785](https://github.com/suzhe868-arch/mb/actions/runs/37968929785)八个独立PG16作业全部success（88表SG06 ledger真实11/11，旧86/84/82/81/80版本完整回归）。迁移000007物理88表/536列/344约束/138索引、PG fingerprint`96328994b19e1fef7261ae41bd890575bd196210e85baec685d0192676aff0dd`，旧目录1761全不变只增79；A核验旧main1248个文件零修改删除、新增17文件授权范围完全匹配。标准[PR #13](https://github.com/suzhe868-arch/mb/pull/13)正常合并SHA`59fdb3623c1d9d2845e7bed9dd13c1b6ef0b41bf`。A独立签收`07_重建工作区/F03-2-2E_A主控独立验收及PR13正式合并闭环_2026-10-10.md`。
- 本批准严格只涉及受限合成PG16中的Handover Batch/Item待处理/失败重试幂等ledger，`completed`物理CHECK拒绝，**没有真实Customer owner、Demand/Lock/Transaction负责人及员工调店降权写提交，不能把ledger视为业务移交成功**。
- A依PDM-02 Final与已存在SG01/SG02/SG06物理事实，独立完成下一小批F03-2-2F书面裁决：仅System Admin在CI可为真实active manager管理已存在`employee.manage`个人allow/deny/revoke和精确Team capability scope生效/截止，复用现有历史、审计、scope/binding与物理88表，**不新增DDL、不允许经理默认管理权或业务域写、不修改旧mig**。正式施工单`07_重建工作区/F03-2-2F_A主控SG04员工个人权限与Team范围受限治理施工单_2026-10-10.md`。下一责任人B，指定`feat/f03-manager-team-governance-2f`，A已放行但B尚未施工/没有同SHA新CI。
- PDM Final/IA/Low-Fi不变。SG04其它管理、SG06真实域adapter、SG07/08及完整F03-2未验收；C/H01独立视觉待审，`PRODUCT_BASELINE=NOT_READY`。此次属于现行A/B/C已授权隔离技术流程，B收到任务一次执行到`READY_FOR_A_REVIEW`交A，不向用户每步索要确认。


## 2026-10-10｜F03-2-2F A独立验收PR14合并及F03-2-2G受限技术放行（技术台账；不新增产品规则）

- A以PDM-02 Final §4/7/9、PDM-03 Final §11～14、三窗口规范核验本批2F：B SHA `703d96a492a62870dbf9e70e13a808b981802bc4`，同SHA真实CI`37972431347`9/9成功，2F 10/10，原main无修改删除、新增14个批准文件，88表结构`96328994b19e1fef7261ae41bd890575bd196210e85baec685d0192676aff0dd`保持；PR #14 标准合并 `25fd4634e76915d9c5a6409ff753b4c4b7432b94`。独立验收记录：`07_重建工作区/F03-2-2F_A主控独立验收及PR14正式合并闭环_2026-10-10.md`。
- 下一F03-2-2G技术裁决：只在真实隔离PG16合成数据中验证SG06客户与活跃业务承责映射、接替资格与当前权限、跨域遗漏和重复预检的安全边界。基于目前F03-2缺少已验收正式业务写权限及各域adapter，**明确拒绝把个人`employee.manage`和Team scope等同Customer owner修改权**，不授权owner/业务负责人/账本completed写入、降权或生产。完整工作单：`07_重建工作区/F03-2-2G_A主控SG06客户与活跃业务承接预检完整施工单_2026-10-10.md`。下一责任人B；C/H01待验收，`PRODUCT_BASELINE=NOT_READY`。


## 2026-10-10｜F03-2-2G A独立复核（仅技术验收台账，非产品规则修改）

B `f9f42c4fde6832522b770403029a4ec2ddc11f7f` 同SHA CI `37976033469` 10/10成功、12/12 PG16测试成功、88表原结构不变，但A对`batch()` inactive拒绝、模拟提交前Customer/域未锁行、缺项与跨批重复账本事实误分类、关联客户的跨Team域明细授权缺口提出`A_CHANGES_REQUESTED`。完整唯一整改单：`07_重建工作区/F03-2-2G_A主控独立复核一次性整改清单_2026-10-10.md`。B限原2G分支修复并重新提交同SHA实证；**未验收、未合并，不改PDM Final产品规则**。


## 2026-10-10｜A复验F03-2-2G PR15正式合并及下一2H受限授权（仅工程技术台账，无产品规则改动）

- 本轮受检B SHA `1069f26b87f772f28d9ed1bfb19c983a4e197729` 同SHA真实CI `37978981732` 10/10个独立PG16作业success、2G 18/18、88表老封印/完整目录与归档原文一致；A-G-01～04全部独立复验通过，14个合法新增文件，无旧文件改动。A标准PR #15合并SHA `b405e83cfadf9f0f6d89ada32ae2f45b5b20a6bd`。最终验收报告：`07_重建工作区/F03-2-2G_A主控二轮独立验收及PR15正式合并闭环_2026-10-10.md`。
- A受限技术裁决下一`F03-2-2H`：只有新隔离PG16合成Customer Owner单域敏感写及不可变收据/事务历史，必须独立Owner写permission，绝不借`employee.manage`、不可迁移七域负责人或写整批completed；正式完整施工单：`07_重建工作区/F03-2-2H_A主控SG06唯一CustomerOwner受限真实逐项移交及事务收据施工单_2026-10-10.md`。B执行到READY_FOR_A_REVIEW后交A；F03-2整体、H01仍未验收，产品`NOT_READY`。


## 2026-10-10｜F03-2-2H A独立验收提出3项阻断整改（工程验收台账；非产品规则变更）

B`88c762eb88e8cdbb7d1bc9850fa29d39f47bde50`对应CI`37982757484`11/11独立真PG16作业及14/14专项成功、旧88表不变，新000008候选仅新增一张收据表。但A逐行核`service.mjs`和`000008.sql`发现跨item/batch复用同一requestKey可重复转Owner、暂停接客的经理店长被错误撤销管理权、合法跨门店Team/data scope被主门店硬等值拒绝。整改单：`07_重建工作区/F03-2-2H_A主控独立验收完整定向整改单_2026-10-10.md`；B原分支一轮全部修复并新来源PG16归档后交A。当前**未验收/未合并**，F03-2整体/H01产品`NOT_READY`。


## 2026-10-10｜F03-2-2H A正式验收及PR16合并，下一2I授权（仅技术工程台账）

B最终SHA`f60d15aaa8fcc4c6fb955c2eaf394fea5895d4df`与同SHA CI`37985367539`11/11真实独立PG16作业、H19/19测试通过；A-H-01～03已按PDM-02/03逐行复核关闭；旧88表封印无变动，新增000008仅一张合成Owner收据表后89表/548列/360约束/143索引/1890目录对象，真实来源证据归档校验全通过。标准[PR16](https://github.com/suzhe868-arch/mb/pull/16)合并SHA`acdc65e140c341916160bd02dd92eb93448ade06`，A验收`07_重建工作区/F03-2-2H_A主控二轮独立验收及PR16正式合并闭环_2026-10-10.md`。下一F03-2-2I严格受限Demand负责人单域CI测试和Priority派生责任/TTL不重置守卫，独立新工作单`07_重建工作区/F03-2-2I_A主控SG06_Demand负责人单域移交与Priority派生责任完整施工单_2026-10-10.md`，B负责；C/H01、F03-2整体、产品仍`NOT_READY`。不改变已冻结PDM规则。


## 2026-10-10｜F03-2-2I A独立复核与定向技术裁决（非产品规则）

B `9445a68c00a809b9f69aba7542af3b403f9b7b1c` 同SHA CI`37989284356`12/12真实PG16作业、I21/21全部通过，旧89表/1890目录完整封印不变、新000009 90表1936键有实证；A复核仍发现H/I RequestKey仅单向去重与Demand历史收据依赖现任负责人导致后续合法改派后旧历史不可读，正式整改单`07_重建工作区/F03-2-2I_A主控独立复核与跨域幂等历史收据整改清单_2026-10-10.md`。仅为解决已批准SG06全局幂等合同，A特批必要时允许原H `service.mjs`中极窄的跨域Key守卫增强，但必须证明旧H89表逆向兼容、新I90表真实双向冲突，**不得修改旧SQL/业务规则或旧CI**。B在原2I分支一轮整改并最新同SHA全绿交A；当前2I**未通过、未合并**，F03-2整体/H01`NOT_READY`。


## 2026-10-10｜F03-2-2I A二轮正式验收PR17合并及下一2J受限技术放行（非产品规则）

B `c92ff2a07b06b94dd7a8c53a9b888248856f61bd`同SHA真PG16 CI `37991845213`12/12独立成功、新I27/27；A-I-01 H/I全局Key双向与A-I-02 Demand连续历史可信收据已独立复验，旧H仅有前轮正式批准的Service跨域守卫极窄修改。真实旧89表1890对象不变，新增000009一表后90表/560列/375约束/147索引/1936键，原始证据归档及同SHA后复验通过；A标准PR #17 merge`9bc5e17be2153d4646816c808d6af77409513308`。正式验收`07_重建工作区/F03-2-2I_A主控二轮独立验收及PR17正式合并闭环_2026-10-10.md`。下一2J只限Consultation assignee合成PG16单域移交、PDM-15首响SLA/状态保持和H/I/J真正三向全局Key，工作单`07_重建工作区/F03-2-2J_A主控SG06_Consultation咨询负责人单域移交与SLA保留完整施工单_2026-10-10.md`，B负责；F03-2整体/H01产品仍`NOT_READY`。产品PDM Final不变。


## 2026-10-10｜F03-2-2J A验收发现旧I90独立真实PG16回归遗漏（工程台账，非产品规则）

B`b2e296d8b49b69a40e3b6ea053eec41386b6ffa5`同SHA CI`37994434333`12/12实际作业成功、J27/27新域测试通过且新000010仅一张新收据表。但正式J08须独立旧I90的原27例测试，实际工作流只有J91、H89、G/F/E88、D86、C84、B82双job、A81、F03-1 80双job，缺少I90完整作业。应最终**13/13独立PG16成功**。完整定向整改单`07_重建工作区/F03-2-2J_A主控独立复核旧I90表回归缺失定向整改单_2026-10-10.md`；B原分支新增旧I90独立回归后最新同SHA全绿交A；A本轮未验收、未合并2J，产品`NOT_READY`。


## 2026-10-10｜F03-2-2J A二轮通过合并PR18，2K受限正式放行（工程台账，非PDM修改）

B SHA `8abd2849877ff7884ea3ff2c27cde59f14b70ce7`同SHA真实PG16 CI`37996676662`13/13独立job全成功、旧I90原27/27与新J91原27/27全部通过，前轮A-J-01缺失旧I回归已完成。原90表1936目录完全不变，新增000010仅一张收据表后91表/572列/390约束/151索引/1982完整目录键，SOURCE原字节双环境校验通过；A标准PR18合并SHA`367ff5d16fe913f5e6b2002abd559522f4cc4d26`，最终验收`07_重建工作区/F03-2-2J_A主控二轮独立验收及PR18正式合并闭环_2026-10-10.md`。正式下一2K施工单`07_重建工作区/F03-2-2K_A主控SG06_Waitlist候补负责人单域移交完整施工单_2026-10-10.md`：仅CI隔离PG16合成Waitlist责任单域转派/原结束关系与内部顺序保留、四域跨Key阻冲突、完整14项独立PG16回归，B下一责任。完整F03-2/C-H01及产品基线仍`NOT_READY`。


## 2026-10-10｜F03-2-2K A独立验收PR19正式合并及2L受限技术放行（非产品规则修改）

B`8cc1f7b6e7df5ecdb57d6e4d2b8be7e3627bde7b`同SHA CI`37999317037`14/14独立PG16 job全成功、K29/J27/I27真实测试通过。旧91表1982目录全不变，新000011仅加一张Waitlist收据表后92表/584列/405约束/155索引/2028项，物理SHA`6b6932e4855074ed63ec0ceda89b568e1b4b1f62d111c759f9c7a77a841a3c76`，SOURCE目录原字节已核。标准PR19合并SHA`3fdb965733fce0750bc00a4a6b04f12e338fda5e`，验收报告`07_重建工作区/F03-2-2K_A主控独立验收及PR19正式合并闭环_2026-10-10.md`。A已签发下一2L正式Lock当前负责人CI隔离单域及真实Deposit/有效期边界施工单`07_重建工作区/F03-2-2L_A主控SG06_Lock正式锁车负责人单域移交完整施工单_2026-10-10.md`，要求15/15独立PG16 CI和K/J/I原回归，B负责。完整F03-2/C-H01/产品仍`NOT_READY`。


## 2026-10-10｜F03-2-2L A独立验收发现Lock有效期跨事务未守卫（工程台账）

B`244b68a2e168624e2a4f65aa17fc1cc587d54fcf`同SHA真实CI`38003745347`15/15独立PG16 success、新L21/21、旧K29/J27/I27和完整物理目录归档通过。然而`L service.mjs`首次`expires_at`检查早于最终CAS，CAS只校验active而无当前DB时钟，跨到期仍可能写Lock负责人/审计/收据，违反正式L03/L04/L10。A唯一完整整改单`07_重建工作区/F03-2-2L_A主控独立复核锁车到期事务竞态定向整改单_2026-10-10.md`；B只在原L分支新L服务+测试修复DB时钟CAS和commit前原子过期失败rollback，新增真实时序证据并同SHA15/15复验后再交A。**2L未验收未合并，不推进2M；F03-2整体/H01/产品`NOT_READY`。**


## 2026-10-10｜F03-2-2L A二轮正式验收PR20合并及2M受限技术放行（不变更PDM Final）

B最终SHA408e7a581264c43220ce3cc326a73ee610c051a5同SHA真实CI38005762988 15/15独立PG16成功，L29含8项A-L-01锁车临界时序、K29/J27/I27完整回归；旧92表2028完整catalog对象不变，新000012一张收据表后93表2074项，SOURCE原始字节PASS。A-L-01已按DB即时钟CAS加提交前整事务ROLLBACK闭环。PR20合并SHA 9ed6db2a6aeefb382298460004768edd11df20b6，正式验收 07_重建工作区/F03-2-2L_A主控二轮独立验收及PR20正式合并闭环_2026-10-10.md；下一M正式施工单 07_重建工作区/F03-2-2M_A主控SG06_Transaction交易负责人单域移交完整施工单_2026-10-10.md，Transaction负责人单域CI隔离PG16及六域Key安全，要求16/16个独立CI全绿，NEXT_OWNER=B；完整F03-2/H01/产品仍NOT_READY。


## 2026-10-10｜F03-2-2M A独立审查发现source Lock真实转交易证据缺口（工程台账，不改PDM Final）

B最终SHA 608779547db3f6ffce76f8c7ee030e4f30242eeb 同SHA真实CI38008698898 16/16独立PG16成功，M25/25与旧L29/K29/J27/I27全通过，新000013仅加一表后94表2120目录键且旧93表2074目录键全不变。A复核发现新M仅source Lock released即认为合法转换、未核PDM-19必需converted_to_transaction类end_reason及交易对应历史；fixture全部Lock end_reason NULL，故没有实证来源合法性。完整整改单 07_重建工作区/F03-2-2M_A主控独立复核来源Lock合法转交易证据定向整改单_2026-10-10.md，B继续原分支只补新M服务/fixture/测试的来源证明与事务末端守卫，最后同SHA16/16全部通过交A；2M未验收/未合并，不进入2N，F03-2整体/H01产品NOT_READY。


## 2026-10-10｜F03-2-2M A二轮正式验收PR21合并与2N只读统一收据对账放行（非PDM规则变更）

B最终SHA556720eb8a80a5ff83fe0a02fc54ea44cf40476e同SHA真实PG16 CI38010658030 16/16独立job成功、M31含6项A-M-01已真实锁车converted_to_transaction来源/前后漂移和整事务回滚，旧L29/K29/J27/I27独立回归通过。旧93表2074目录全不变，新000013仅一张Transaction不可变收据表后94表/608列/435约束/163索引/2120完整项；SOURCE原字节真实核验通过。A标准PR21合并SHA71847176ccd2fd93a323fe274f0f144d4aea2712，正式验收07_重建工作区/F03-2-2M_A主控二轮独立验收及PR21正式合并闭环_2026-10-10.md。下批正式N仅CI隔离PG16 H/I/J/K/L/M六域receipt/audit、Priority从Demand派生及部分失败收口前置只读对账；禁止写completed/离职撤权/真实资金和任何DDL，要求17/17独立PG16 job通过、旧M31/L29/K29/J27/I27全套回归，B负责，详见07_重建工作区/F03-2-2N_A主控SG06全域收据对账与正式收口前置门禁只读施工单_2026-10-10.md。F03-2整体/H01/产品仍NOT_READY。


## 2026-10-10｜F03-2-2N A独立复核发现Priority跨批/来源/Team派生证明缺口（工程定向整改）

B最终SHA 70fdae880cfc707a405d607378aa5ab172b432a0，真实同SHA CI38016127258 17/17独立PG16全success、N14/M31/L29/K29/J27/I27各完整通过、原94表2120目录原字节零增量PASS。但新N只读Priority派生未证当前SG06 item的source employee、batch与对应真实Demand交接历史/Team吻合，读取不存在的item.scope_team_id自回退等于没有Team关联；跨批次未交接Priority可冒充已证明。A正式整改单`07_重建工作区/F03-2-2N_A主控独立复核Priority派生跨批次来源证明定向整改单_2026-10-10.md`；B继续原2N分支修新N服务/fixtures/tests且不得改旧迁移/权限旧服务，最终同SHA17/17 PG16成功及真来源证据后交A。**2N未验收未合并；G/P/V仍为预规划不得启动，F03-2/C-H01/产品NOT_READY。**


## 2026-10-10｜F03-2-2N A二轮通过PR22并正式放行F03多任务包G+P

B最终SHA 5ae79377c5c09155ac1b04105e5a265a61ced20e，同SHA真实CI38018758218 **17/17独立PG16成功**，新N21/21含7项A-N-01跨批Priority真实来源、合法Team、无错批、事务回滚，旧M31/L29/K29/J27/I27各独立成功，无000014，原94表2120 catalog目录原字节完整。标准PR22合并SHA`32419cff011b15c1e2f1f202d257f7b2c00cb30d`，验收`07_重建工作区/F03-2-2N_A主控二轮独立验收及PR22正式合并闭环_2026-10-10.md`。按用户授权的新A/B/C协作规范§7，A正式签发G包`07_重建工作区/F03工作包G_A主控SG06真实收口与F03-2-3员工治理完整施工单_2026-10-10.md`（SG06完成+F03-2-3计划员工治理及失活/复职，3子单元20/20独立PG16，000014仅扩2个handover completed CHECK）和P包`07_重建工作区/F03工作包P_A主控F03-3字段权限与安全投影完整施工单_2026-10-10.md`（F03-3字段投影/导出历史缓存/F04-F07交接，3子单元19/19独立PG16，零DDL）。B各自分支一口气施工/自审/修复，全包双READY后只交A一次独立验收；V仍为预排待后续正式签发，F03-2/H01/V1产品`NOT_READY`。


## 2026-10-10｜F03工作包G/P首次A集中验收拒绝两项安全缺证

G最终SHA708fb889db8c473cc1cd92d38896aa1bbfdfb973真实CI38022820421 20/20独立PG16成功、G1 15 G2 7 G3 4；P最终SHA82fec31338040c020f147a1107bdbddc5364d916真实CI38020721875 19/19独立PG16成功、P1 10 P2 6。A-G-01：已完成batch后的计划员工治理没核最终当前owner/responsible与合法后继交接链一致；A-P-01：员工查询/导出仅凭某Team的crm.customer.view未核实际vehicle对象业务权限，二者均须更强负例。正式集中整改单 07_重建工作区/F03多任务包G_P_A主控首次独立审查与两项定向整改清单_2026-10-10.md。保留两包原分支，一次性自审整改和全部CI过门，双包均READY再统一交A。均未验收/未合并，V未放行，产品NOT_READY。


## 2026-10-10｜G/P双包A二轮验收PR23+PR24合并与V工程核账总回归正式放行

G受检最终HEAD19af2955d81ac14d79e0c4e6adc661a3a1aabd8e同SHA CI38025357614 20/20独立PG16 success，新G1 16/G2 7/G3 4及旧N21/M31/L29/K29/J27/I27等完整独立回归；A-G-01当前责任人/后继收据真实链、并发锁竞争和末端整事务rollback关闭，000014仅两个handover completed CHECK全catalog2120项，新真SHA863538a8dd81e85c8f50bec2d18ad714f6c3d87abf3b10844a3c80421d54cdb1；PR23合并SHA2073397070270aeda3056b75a21112e81763cc1a。P受检HEAD97087f2aab4dcb7ad94cd5ea6cc4777b76900459同SHA CI38024572379 19/19 PG16 success，P1 10/P2 11及旧17全回归；A-P-01员工Vehicle不能仅凭CRM+Team擅自读/导出，没有正式Vehicle→Team/4S归属时P_VEHICLE_SCOPE_UNPROVEN安全拒绝，F04/F07接续；PR24合并SHA2c65bbfd04fbba5438160f8b0e8fe8274f15d940。A报告：07_重建工作区/F03双工作包G_P_A主控二轮独立验收PR23_PR24正式合并闭环_2026-10-10.md。按多包协作规范正式放行F03工作包V：07_重建工作区/F03工作包V_A主控工程覆盖核账跨模块总回归与后续承接完整施工单_2026-10-10.md，B唯一下一责任，24/24独立PG16、新旧两个物理版本不混用，59条能力/治理逐项真实核账，下游承接不允许虚报F03/产品上线。C/H01与产品基线NOT_READY。

## 2026-10-10｜A主控F03-V独立验收PR25正式合并与F04-1技术施工单放行（工程裁决，不新增PDM业务规则）

- **V受检与真实证据**：B分支`feat/f03-package-v-coverage-final-gate`最终HEAD `2ee8c0327b7e59792cf22e908b12d780494fa3a5`，同SHA GitHub Actions `38027132087`，24/24个独立非特权真实PG16 job `completed/success`。A检查V新增两个独立job各7/7、全目录各2120项、原生source字节M94与G000014仅2个CHECK差异、九文件新增白名单、59行45能力+14治理审计与59条负断言；旧服务/迁移不改。PR #25 经标准GitHub merge合法合入main，merge SHA `1a0f0d85eb6cc7d120d754fc82d1a4131f3b653e`。A独立签收报告：`07_重建工作区/F03工作包V_A主控独立验收PR25合并及阶段技术裁决_2026-10-10.md`。这是**F03合成隔离技术阶段有限签收**，不自动验收生产业务、真实财务、H01或整体V1产品。

- **A技术裁决 F03-V-DEC-01（历史能力#8）**：`vehicle.internal_wholesale_price.read` 的正向业务读取及真实Vehicle数据/内价来源在**F05**实现，F04实现合法HTTP会话、当前Vehicle对象scope与独立`internal.price.view`边界；PDM-02§8、PDM-10§6为唯一正式产品Authority。4S查看名邦内价HARD DENY，不因经理/店长角色或Internal Mode默认获得；没有真实对象Team/商户绑定及独立权限一律DENY。
- **A技术裁决 F03-V-DEC-02（历史能力#9）**：`vehicle.internal_wholesale_price.edit` 按 PDM-10§5/5.1 归F05的**正常车辆编辑字段**，需`vehicle.manage`与额外独立`internal.price.view`及当前对象scope/state，F04路由校验；不得恢复独立调价动作/permission或把上游批发价变可写。
- **A技术裁决 F03-V-DEC-03（历史能力#21）**：`system.four_s_account.manage` 归**F04 System Admin控制平面**正式账户正向治理/允许permission及审计；PDM-02§3及P02-A19支持，不赋予4S互管或新建4S组织层级。
- 上述三项在V原始覆盖TSV中保留历史`F03_STILL_OPEN`，当前A裁决标记**`A_RESOLVED_TO_F04_F05_OPEN_DEPENDENCY`**，表示**已决定责任归属而非实现完成**；原F03技术安全拒绝保持，F04/F05仍需各自真实施工、验收和最终生产门禁。

- **A正式工作单放行**：`07_重建工作区/F04-1_A主控接口合同与安全路由启动完整施工单_2026-10-10.md`，唯一B工程分支`feat/f04-1-contract-safety-gate`，从最新main启动并独立自验：历史218旧接口源追踪不造假、Current IA/Low-Fi现行路由DTO/权限、隔离HTTP/PG16现时多主体撤权与无可信对象全拒、F05/F06/F07/H03/H04后续消费合同。**旧24项独立PG16冻结回归+2项新独立PG16=26/26同最终B SHA CI成功**、完整中文交接后交A独立验收；仅许可施工单白名单路径，禁止新DDL、旧F03服务改写、真实生产/第三方/资金及B自行PR合并。
- **唯一下一责任B｜NEXT_TASK F04_1_CONTRACT_AND_SAFE_HTTP_CI_PACKAGE**；C/H01高保真独立未最终验收；F04～F07与用户UAT待做；`PRODUCT_BASELINE=NOT_READY`，不得称V1已可上线。该工程裁决不改写以上任一已确认PDM Final产品规则。


## 2026-10-10｜F04-1 PR26首次A独立审查：三项技术整改（无新产品规则裁决）

- B原`feat/f04-1-contract-safety-gate`受检HEAD `cb5a96699a4b93bc42dc0f81188c22ee8d5b49c7`，同SHA CI `38029582060` 26/26独立真实非特权PG16作业成功，新HTTP15/15与库存溯源7/7、10个仅新增白名单文件全部确认；旧24项合格证据保留。**A拒绝将CI绿视为接口正确性与权限范围已验收。**
- **A-F04-01（确定性真实来源错误）**：实际旧OpenAPI存在**198个真实paths、218对method/path**，B虽然记录218行，但仅136不同paths，包含操作后缀`:authorize/:unlock/:test`等合法**62条**被归入前一无冒号路由。实例 `POST /customer/me/phone:authorize`误记`POST /customer/me/profile`；`POST /customer/vehicles/{vehicle_id}/price-access:unlock`误记`POST /customer/me/favorites`；`POST /admin/integrations/collector/connection:test`误记无`:test`的connection路径。源代码测试的`[^:]*`路径正则同源漏检；需逐条真实path与源行检验，禁止虚报218准确映射。
- **A-F04-02（旧接口处置错误）**：218行全部硬设`MODIFY`，包括现行已禁恢复的Collector连接GET/PATCH/TEST接口；须对确定已禁恢复标`RETIRE`并测试硬拒，对能由现行IA/PDM证明的逐一写实五类实际动作，对不可证的明确`UNREVIEWED_SOURCE_GAP`、不得冒充全部可修改或当前业务已映射。
- **A-F04-03（对象scope正向证明不足）**：当前F04-R03最小本人Customer读取只核现时owner及员工**某个**有效Team scope，未建立目标Customer与该scope的权威当前范围链接；按PDM-02§4/PDM-16§9必须有实际对象范围证明和本人/越Team/跨店/撤权正反例。旧M94无法证明则保持业务对象读取DENY/OPEN_DEPENDENCY，绝不为取200新增未授权假事实/DDL。本条是待补**证明缺口**，非宣称已通过真实泄漏复现。
- **唯一整改单已落main**：`07_重建工作区/F04-1_A主控首次独立审查与接口溯源权限证明完整定向整改单_2026-10-10.md`，PR26已留审查评论ID `6094614904`。正式状态 **`A_CHANGES_REQUESTED / NOT_ACCEPTED / NOT_MERGED / NEXT_OWNER=B`**，B继续原`feat/f04-1-contract-safety-gate`一次整改，重新取得最终HEAD匹配完整独立PG16 **26/26 success**和更新证据后交A。PR26不得先合并或启动F04-2；F03-V旧签收、C/H01及`PRODUCT_BASELINE=NOT_READY`不变。


## 2026-10-10｜F04-1 PR26 A二轮正式验收通过、标准合并与F04-2下一包技术放行

- **受检对象**：F04-1 原B分支`feat/f04-1-contract-safety-gate`，最终SHA `6af50664ec230f11caf62c73562449069d086b15`，真实同SHA [Actions38031443210](https://github.com/suzhe868-arch/mb/actions/runs/38031443210) **26/26独立真实非特权PG16 success**，两项新Job原生日志F04安全HTTP20/20、原始接口核账10/10，33真实Artifacts、F04原始artifact IDs 11663240223、11662501440；原94表/608列/435约束/163索引/2120目录SHA `7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659`，12个新增文件均获授权且无旧SQL/业务服务/CI/正式server/产品Final修改。
- **A-F04-01 CLOSED**：直接阅读源OpenAPI独立复算198真实path/218 method+path，其中62条含冒号path；新版每条`legacy_id/source_line/method/full_path`与原始文件逐一匹配，**零误映射**，Parser拒绝重复、畸形与缺method来源。
- **A-F04-02 CLOSED**：禁止恢复的旧Collector connection GET/PATCH及connection:test POST 3项明确`RETIRE/FORBIDDEN`，真实隔离HTTP旧路由不可达；其余**215项当前Authority映射仍标`UNREVIEWED_SOURCE_GAP`**，不等于完成Current IA/PDM逐条业务决策，禁止泛设`MODIFY`。
- **A-F04-03 CLOSED**：受限CI合成客户最小ID读取必须以可信现时target Customer的`object scope + crm.customer.view`同scope capability binding + current owner + 实时role/个人deny/session/account状态成立，原M94已有fixture合法正例，越Team、缺对象范围、owner改变、绑定过期、旧token、4S和System Admin业务越权等真HTTPS/PG16负例全部成功。不可从持有任意Team scope推断目标Customer可读。
- **正式A动作**：PR #26 A独立验收评论 `6094838831`；标准GitHub PR合并返回`merged=true`，merge SHA **`20479f3712a5aaa862f7db4378d8db2369695d79`**，重新取PR证实`closed/merged=true`；正式报告`07_重建工作区/F04-1_A主控二轮独立验收PR26正式合并与下一阶段归属_2026-10-10.md`。**A_ACCEPTED_MERGED_PR26_CI_ONLY_SCOPE**，不是F04全业务实现、产品可上线。
- **新的完整技术包A正式放行B**：`07_重建工作区/F04-2_A主控现行215接口Authority映射与4S账号安全控制前置完整施工单_2026-10-10.md`，指定`feat/f04-2-authority-route-mapping`（B开始时从最新main创建），要求真实Current IA/PDM/Low-Fi逐项证据映射215未裁候选，确实缺证不得猜Authority；4S账号System Admin控制面仅CI-only只读资格/对象安全预检，不开放账号变更。**28/28同B最终HEAD真正独立PG16 jobs（冻结旧26+新2）**、原生证据/反例/中文交接后交A，B不得自行合并或启动F04-3；当前`A_RELEASED_FOR_B / B_NOT_STARTED / NEXT_OWNER=B`。F04、F05～F07、C/H01、三端UAT和产品基线仍`NOT_READY`。


## 2026-10-10｜F04-2 PR27首次A独立复核：真实引用但业务动作不对应、域责任错分（产品Final未改变）

- B原受检`feat/f04-2-authority-route-mapping` SHA `b3535bbe70c0708e4ba386293e7298408f163da8`与真实[Actions38034145668](https://github.com/suzhe868-arch/mb/actions/runs/38034145668)完全同SHA，**28/28个独立非特权PostgreSQL16 jobs success**（旧26+新2）、新Authority8/8和4S loopback HTTPS9/9，37份Artifacts，M94结构封印与11文件白名单均确认。4S当前无商户归属证明仍403、System Admin最小身份只读CI验证无需返工；F04-1 PR26既有已验收成果没有改动。
- **A-F04-2-01 技术阻断（引用真实但不对应接口动作）**：B `current-authority-route-matrix.tsv` 215历史候选中105`EVIDENCE_MATCHED`、110`SOURCE_GAP`，但实际抽核旧`LEGACY-001`微信会话引用“手机号授权+我的Tab”，`LEGACY-019`Consultation创建引用“打开车辆+三类车源”，`LEGACY-020`候补引用“打开车辆+三类车源”，`LEGACY-069～072`咨询开始/处理/无效/转派引用“修改内部客户称呼”，`LEGACY-079`车辆发布引用“进入内部模式”，`LEGACY-085`价格改写不能由内部模式证明编辑权。真正Current IA导航现有`C03-03提交咨询`、`C01-01登记候补`、`E02发布车辆`等独立动作。其`source-verifier.mjs`仅按行`startsWith(quote)`核文档字节存在，原8/8不能识别同文件内不相关真实动作。故必须真实语义审查全部105候选：同主体+同动作+同业务对象/PDM、补真实异动作引用负例；无法证明降SOURCE_GAP而非凑105。
- **A-F04-2-02 技术阻断（Domain/owner错分）**：LEGACY-019创建Consultation及LEGACY-020登记Waitlist按URI `/vehicles/`前缀被分入`family=VEHICLE`/`responsible_owner=F05`，实际受PDM-15（咨询）和PDM-18（锁车候补）独立约束，Waitlist下游为F06。须区别F04 route contract owner、实际业务implementation owner、PDM domain authority，未知部分留`OWNER_REVIEW_GAP`，补跨域负例。
- 已独立写[PR27审核意见](https://github.com/suzhe868-arch/mb/pull/27)，评论ID `6095831957`；正式完整整改单`07_重建工作区/F04-2_A主控首次独立复核Authority动作误配完整定向整改单_2026-10-10.md`已落main。正式`A_CHANGES_REQUESTED / NOT_ACCEPTED / PR27_NOT_MERGED / NEXT_OWNER=B`。B留原`feat/f04-2-authority-route-mapping`分支完成两项整改，自验/完整旧新PG16 **28/28同最终HEAD成功**、原生Artifacts和中文交接后交A复验。无须用户逐项批准技术修复；未合并不得启动F04-3。F04、C/H01与整个产品仍`NOT_READY`。


## 2026-10-10｜F04-2 PR27二轮A验收通过、正式合并与F04-3技术施工授权

- **A独立受检B final SHA** `d09038917c91446eb8914f53f3e1881345ba7d1a`；官方[Actions run38041020114](https://github.com/suzhe868-arch/mb/actions/runs/38041020114) head SHA一致、`completed/success`，**28/28独立非特权真实PG16作业成功**（F04-1/旧F03冻结旧26+新2），Authority/Source/业务动作 11/11、4S只读loopback HTTPS 9/9，37份原生Artifacts，新原生ID 11666040902、11665941117，M94 94表目录/2120 SHA与G000014版本隔离有效。PR27总13个变动均授权白名单；未改旧代码、旧迁移、正式server、Final/IA或C设计。
- **A-F04-2-01/02全部`PASS/CLOSED`**：原215候选映射从105粗簇匹配/110未证，严格改为**23同动作/同主体`EVIDENCE_MATCHED`+192`SOURCE_GAP`**；旧来源218 methods/198 paths/62含冒号路径、3禁恢复Collector严格保留。引入真文档“存在却不同动作”语义负例，Consultation域PDM-15、Waitlist域PDM-18→F06，F04 HTTP合同与真实业务实施责任分离。全部215仍`UNDECIDED/CONTRACT_ONLY`，23仅现行业务动作证据充分，不代表旧URL获正式迁移/生产批准。
- A独立正面PR27评论ID `6096462233`；GitHub标准PR `merge`并核实`closed/merged=true`，**合并提交`70d1f68490c851823cf5d1415c703667c0305cb4`**；正式二轮报告`07_重建工作区/F04-2_A主控二轮独立验收PR27正式合并与F04-3交接_2026-10-10.md`已落main。F04-2状态**`A_ACCEPTED_MERGED_PR27_CI_ONLY`**。
- **新完整施工授权**：`07_重建工作区/F04-3_A主控Current新接口注册表DTO与路由安全门禁完整施工单_2026-10-10.md`；**`F04_3_A_RELEASED_FOR_B / B_NOT_STARTED / NEXT_OWNER=B`**；指定**`feat/f04-3-current-action-api-registry`**，实际B开工从最新main新建。整包实施Current动作导出的**新**HTTP/DTO合同、23证实与192缺口、真实PG16+loopback TLS安全路由/拒绝边界，保留F04-2冻结旧28个独立CI job并新增2个PG16 job，最终**30/30**同B最终SHA success＋真实Artifacts、中文交接，**B不直接合并main/不启F04-4**。仅CI-only合成可测，无生产启用、新DDL、4S真实账号/资金写、第三方实际调用；高保真C/H01及产品总基线保持`NOT_READY`。


## 2026-10-10｜F04-3首次A独立技术审查：三项整改，业务Final不变

- PR28 B最终HEAD `ce99e604d4fb58aa04f859231fd55fd37daa3891`，同SHA GitHub Actions `38045766826`、30/30独立真PG16 success，41原生Artifacts、13文件白名单与旧28 CI冻结保留，确认为真实工程证据而非已签收业务接口合同。
- A发现并签发三项**工程阻断**：`A-F04-3-01` 29个业务DTO占位、OpenAPI字段schema不完整；`A-F04-3-02` 6个新增Current动作同操作/主体/资源语义证据和真实异动作负例不足；`A-F04-3-03` CUSTOMER误声明PC Cookie合法认证，以及员工治理缺System Admin控制平面合法主体独立边界。见`07_重建工作区/F04-3_A主控首次独立复核DTO实质合同与主体权限完整定向整改单_2026-10-10.md`，PR28 A评论 `6096753581`。
- **不是新产品决策**，PDM Final/IA/Low-Fi一律不变；既有21X旧接口禁恢复、F05～F07实施及C/H01安全门禁不变。`F04_3=A_CHANGES_REQUESTED / PR28_NOT_MERGED / NEXT_OWNER=B`。B在原分支一次性整改、完整同SHA30/30真PG16+Artifacts交A复验，不能自行合并main或启动F04-4。产品基线仍`NOT_READY`。


## 2026-10-10｜F04-3二轮A独立验收正式闭环、PR28合并；F04-4现行技术包授权（无新产品裁决）

- B最终SHA `f86f592056303e9ac6e04ad5af5be93accf41b80`与真实Actions `38048203956` head SHA一致，30/30独立非特权PG16 success；新Source/DTO/Current语义16/16、新TLS/身份/对象安全13/13、41份原生Artifacts，新IDs `11668517606/11668526569`，M94 94表2120项/G14封印完整。16个文件仅增F04-3批准白名单，冻结旧28 CI不变。
- A-F04-3-01/02/03定向整改经独立源码、错误引文负例、Source/DTO schema/Actor/Auth隔离审查全部PASS；A正式评论`6097071207`；标准[PR28](https://github.com/suzhe868-arch/mb/pull/28)真实合并SHA `a1f7ebcbfdf1184ed2b1e1143afe01e877119694`；正式A报告`07_重建工作区/F04-3_A主控二轮独立验收PR28正式合并与F04-4接力_2026-10-10.md`。F04-3 `A_ACCEPTED_MERGED_PR28_CI_ONLY`，不是生产实现，旧215/32新候选无旧URL或业务权限自动批准。
- A按既有PDM Final/Current IA规则**新签F04-4完整技术工作单** `07_重建工作区/F04-4_A主控Current全量动作覆盖消费合同与隔离安全门禁完整施工单_2026-10-10.md`；`NEXT_OWNER=B / A_RELEASED_FOR_B / B_NOT_STARTED`，限Current全动作与C/E/P/4S消费者覆盖台账、typed DTO追加、独立32/32真PG16验收；不变更任何产品原子/Final、不复活Collector、不造4S组织、不对真实资金/账号/第三方操作，不擅合并main。C/H01/F04整体/V1仍`NOT_READY`。


## 2026-10-10｜F04-4首次A独立技术验收：增量typed DTO动作语义单项整改（无新产品裁决）

- B受检HEAD`3e2e5a2f27c2c88dbc595f3312a6520f843c6a84`与官方Actions`38051029689`完全同SHA、32/32独立真非特权PG16 success、45份原生Artifacts（新Source`11669133122`及TLS`11669622637`）及14新增文件白名单通过。437 Current行级来源/258三向桥接与215旧候选23/192、3禁恢复仍保守。
- 技术整改`A-F04-4-01`：8项新增typed DTO均只接受一个正整数对象ID；PDM24 Announcement“新建”没有证据要求客户端先传既存announcementId，Vehicle source_type修改未携目标类型，Markup规则save与车型mapping bind未携能定义动作的业务参数；不能将形式上类型化的单ID占位称为实质业务请求合同。A整改单`07_重建工作区/F04-4_A主控首次独立审查增量动作DTO业务语义完整定向整改单_2026-10-10.md`，PR29审核评论`6097622718`；B在原分支整改真实字段语义/按源降缺口并补负例、最后32/32同SHA再交A，当前`A_CHANGES_REQUESTED/PR29_NOT_MERGED/NEXT_OWNER=B`。
- Page Manifest文件标题自称140 logical载体但目前物理C/E/P表可实证132，差8项保留`SOURCE_GAP`，**不是本轮独立阻断、没有确认是哪8个真实页面**。Final/IA/Low-Fi保持冻结、禁止编造页面或恢复旧禁项。F04全阶段与H01、V1产品仍`NOT_READY`。


## 2026-10-10｜F04-4二轮A验收、PR29标准合并、F05-1下一工程单放行（无新增产品裁决）

- B最终HEAD`92452b124c293bfe646cea99d3a8afd46e54f2e8`与官方Actions`38053741869` head.sha一致，32/32独立真实PG16 jobs通过，Source18/18+TLS8/8、45原生Artifacts、旧30 job定义不变、14文件白名单无越界；A-F04-4-01整改真实二轮PASS。PR29 A评论`6097766248`，标准merge SHA`8de73cdf0fa89d3aa02af9a352b5e203e66e8bb8`，A验收报告`07_重建工作区/F04-4_A主控二轮独立验收PR29正式合并与F05-1交接_2026-10-10.md`。
- 新8 Current动作严格只有1项Vehicle source_type最小CI合成typed请求，其余7项`INTENT_ONLY/REQUEST_SCHEMA_SOURCE_GAP`且不授业务生产许可；437来源/258三向追溯、215老候选23/192与3个禁恢复Collector继续保守；PageManifest140声明/132可检行差8仍未证，禁止造页。F04总体、H01、V1均NOT_READY。
- A正式签发F05-1`07_重建工作区/F05-1_A主控Vehicle可信归属与最小安全投影完整施工单_2026-10-10.md`；`NEXT_OWNER=B / B_NOT_STARTED`，新分支`feat/f05-1-vehicle-scope-safe-projection`从最新main建立，限真实M94物理车辆归属/4S合作主体/员工scope证明与字段安全最小投影、隔离34/34真实PG16；没有可信归属不能准许车辆操作，禁止本包新DDL/生产写/旧Final变更。F05-2所需结构和实施独立后续放行。


## 2026-10-10｜F05-1正式A验收PR30标准合并及F05-2新施工授权（无新增产品裁决）

- B最终SHA`146129d94af0df6570bba7bb17781f1528d00a7c`=官方Actions`38056158521`的head.sha，34/34独立真PG16 success、原生51个Artifacts，物理源9/9+TLS9/9，旧32job全文冻结。F05-1由A签收、A评论`6098084371`、[PR30](https://github.com/suzhe868-arch/mb/pull/30)已标准merge SHA`5f70588905a8cadbb47a3bc4a8eb6af411b94597`，正式报告`07_重建工作区/F05-1_A主控独立验收PR30正式合并与F05-2可信归属接力_2026-10-10.md`。
- M94现存26表153字段/99FK等真实证明Vehicle/ListingCycle存在，但`REAL_VEHICLE_SCOPE_PROVEN=0`（归属物理权源缺失），不能以created_by/店铺/4S来源/CRM owner/客户可见grant/Publisher自动放权；252矩阵三类来源7出口全部403，安全仅CI-only。F05完整经营业务、F04生产路由/H01和V1均NOT_READY。
- A依据已签PDM Final/Current IA批准`07_重建工作区/F05-2_A主控Vehicle当前管理责任可信关系增量迁移与真实权限闭环完整施工单_2026-10-10.md`：`F05_2_A_RELEASED_FOR_B / NEXT_OWNER=B / B_NOT_STARTED`，在新`feat/f05-2-vehicle-stewardship-physical-scope`分支建立可信Vehicle现时责任关系/独立历史、只在临时PG16执行单独增量迁移并测试真实正向+撤权/来源变更/最后提交并发；不可新建4S组织、不可伪造权益或自动回填旧车，旧M94/G14各自封印不可混用。冻结旧34独立PG16加2个新真PG16，最终36/36同SHA成功，B自验后交A。无生产DDL/真实资金/第三方许可。

## 2026-10-11｜F05-2 A首次独立复验与四项定向技术整改单（非产品决议）

- PR31最终HEAD `52078ba41fe205ead1da373bc4bf52fc2610ccd8`、Actions `38059665296` 同SHA36/36真独立PG16成功、59原生Artifacts及16新增文件白名单均已由A复核属实；工程CI绿灯不等于正式权限验收。
- **A-F05-2-01** 主负责人交接后原普通销售仍可能按Team `vehicle.read` 读取；**A-F05-2-02** inactive后复职可意外恢复旧车辆责任；**A-F05-2-03** 自签所谓受信人工发布历史事件未具真正独立业务来源；**A-F05-2-04** 权限撤销/读取和source变更的真实跨事务竞态缺口。四项均为现行PDM Final与原F05-2施工单的技术门禁，不是A新授予业务规则。
- 正式状态 `A_CHANGES_REQUESTED / PR31_NOT_MERGED / NEXT_OWNER=B`；完整整改单：`07_重建工作区/F05-2_A主控首次独立复验权限交接与并发闭环完整整改单_2026-10-11.md`；PR评论ID `6099902681`。B在原分支一次性整改，更新真实PG16负例与同最终SHA36/36及原生Artifacts，复交A；不进入F05-3、不生产、不合并。F05/H01/V1保持`NOT_READY`。

## 2026-10-11｜F05-2 A二轮独立复验：旧四项PASS、自动撤权Actor真实性新阻断（技术门禁，不是新产品选择）

- B/PR31受检最终HEAD`68a263add2ae68ba3860f939a78b949589a0bb55`与Actions`38071814138`完全同SHA，36/36独立PG16成功；旧34 job原文不变，物理16/16、HTTPS11/11；59份Artifacts新`11676863942/11676953699`可用，16文件全部新增白名单。A-F05-2-01～04均经过独立审查判`PASS/CLOSED`，不再要求重做。
- **A-F05-2-05=A_CHANGES_REQUESTED**：F05-2新迁移自动治理撤权触发器 `f05_2_close_steward_links` 将受影响原负责人 `responsible_employee_id`误写进审计执行人`actor_employee_id`，自动撤权或他人治理修改不可变地记为被撤权者本人操作，违反PDM-25 Final §2真实human/system actor要求。B在本批专属目录修正真实Actor vs SYSTEM触发器/受影响负责人、原生历史因果及新PG16负例，既有旧四项不返工。
- 正式整改单`07_重建工作区/F05-2_A主控二轮独立复验自动撤权审计Actor真实性完整定向整改单_2026-10-11.md`，PR31审核评论ID`6100420933`。当前`F05_2=A_CHANGES_REQUESTED / PR31_NOT_MERGED / NEXT_OWNER=B`，不得合并、提前F05-3或进入生产；整改同SHA36/36与两原生Artifacts再交A第三轮复验。F05/H01/V1`NOT_READY`。

## 2026-10-11｜F05-2 A第三轮独立验收通过、PR31正式合并、F05-3A正式开工授权（无新产品选择）

- A以GitHub PR31最终B HEAD `50e28b69b60c4a48c50714abb003e514ec1f8205`=官方Actions`38074648994` head_sha、36/36真实独立非特权PG16成功、旧34 job逐行不变、物理21/21和HTTPS11/11、59原生Artifacts、新`11677953440/11677713304`及16项仅新增白名单独立复验；五项`A-F05-2-01/02/03/04/05`全部PASS。System自动撤权Actor标SYSTEM/NULL且previous_employee单独记录，审计不可变；没有生产运行。
- A批准PR审核评论ID`6100698698`，亲自执行标准合并，merge SHA `fec72e9245845c252c551f6c172ecca7de5b4467`，main经GitHub验证；报告`07_重建工作区/F05-2_A主控第三轮独立验收PR31正式合并与F05-3接力_2026-10-11.md`。F05-2状态`A_ACCEPTED_MERGED_PR31_CI_ONLY`，五项原阻断关闭。
- 下一增量授权`F05_3A_A_RELEASED_FOR_B / NEXT_OWNER=B`，完整施工单`07_重建工作区/F05-3A_A主控4S单成员经营责任可信来源与Vehicle隔离权限验证完整施工单_2026-10-11.md`，新分支`feat/f05-3a-four-s-member-trust-scope`由B自最新main新建。限独立PG16 4S单账号受信发布/对象权限与治理撤销，不建设4S组织、不实用JYT/价格/生产；冻结旧36+追加2独立真PG16，可信来源不足强制`SOURCE_GAP`，B不自合并或越过下游分包。
- F05总域、C/H01、V1产品基线始终`NOT_READY`。仅工程技术签收/放行，不对PDM Final/Current IA/Low-Fi作新裁决。

## 2026-10-11｜F05-3A A独立确认4S当前责任可信source缺口与受控首次发布技术裁决（非新增产品规则）

- PR32 B最终HEAD`6785b5e7130b5ba9b0c7996c70de2a5222bd8a46`与Actions`38076660267`同SHA38/38真非特权PG16全部success，冻结旧36Job逐项字节完全一致，新两个Job源码真实G-A01～07 7/7、G-B01～07 7/7，69原生Artifacts（新`11678686225/11679205872`有效），8项仅批准新增白名单。A确认来源缺口与fail-closed保护实证通过，但由于没有4S合法首发200，**F05-3A没有达到业务正向门禁，PR32保持Draft不合并**。
- PDM-02 Final§3、PDM-04 Final§9/10、PDM-06 Final§1/6/7/13已经批准4S单账号=合作主体、4S本人固定只发4S、System Admin控制许可/数据范围、正式发布服务端重验；不需要用户新产品裁决。A定向明确**受信System Admin确认新对象创建资格/范围→真实4S本人Session正式首发→同事务新Vehicle/Cycle、4S本人对象Scope、不可变审计**；先证创建资格再拥有新对象，旧车不补权；禁止额外4S组织/假名邦Team和测试seed偷渡200。若admin可信来源无法证明则继续SOURCE_GAP。
- 正式一单技术补证指令`07_重建工作区/F05-3A_A主控首次独立审查4S受信来源缺口技术裁决与定向补证施工单_2026-10-11.md`；PR32 A评论ID`6101074294`；`NEXT_OWNER=B`继续原`feat/f05-3a-four-s-member-trust-scope`和PR32，补合法正向及跨账号/撤权/并发负例，并以最新同SHA38/38、原生两制品交A；B不合并，F05/H01/V1持续NOT_READY。

## 2026-10-11｜F05-3A A主控二轮独立复验与三项物理可信归属定向整改（非新增产品决议）

- 官方PR32受检HEAD`4bd39d7e4b925346a6867870399260d9aaf85d87`=Actions`38085191145`同SHA38/38独立真PG16成功，原F05-2旧36 Job逐字冻结，新物理14/14、HTTPS10/10，原生71个Artifacts新`11682206471/11681796730`均可用，18个批准新文件无越界；4S可信Admin发证→本人真实首次发布→同事务Vehicle/Cycle/经营对象/审计→真实HTTPS最小200及负例已通过A源码/官方日志复核。
- A独立发现3个本包工程安全缺口：①新的publication.license_id与member_employee_id没有复合归属约束，读路径未校验license.employee_id=当前member，且当前来源身份可直接SQL改导致跨账号挪用有效license；② revoked_at可直接由非NULL改NULL以复活旧license/Vehicle对象责任，物理不可逆性缺失；③H-A11/H-A14并发测试仅同步读取尚未完成的Promise即放行，没有第二真实PG16写SQL确已等待锁的证据。要求补DB强制约束/身份不可变、撤权不可逆触发器及真正跨连接锁冲突/最终COMMIT负例。
- 完整定向整改单`07_重建工作区/F05-3A_A主控二轮独立复验对象归属绑定复活与并发证据完整定向整改单_2026-10-11.md`，PR32审核评论`6102199600`。现`F05_3A=A_CHANGES_REQUESTED / PR32_NOT_MERGED / NEXT_OWNER=B`，原分支`feat/f05-3a-four-s-member-trust-scope`最小修复、旧36全文冻结、新2新增测试最终同SHA38/38+两新原生Artifact，再交A复验；不返工已合格Admin治理+4S首发正向、不新增产品许可、不进F05-3B/生产，F05/H01/V1`NOT_READY`。

## 2026-10-11｜F05-3A A三轮独立正式验收、PR32标准合并和F05-3B签发（无新增产品决议）

- B/PR32 HEAD`285d0c7519ed28803eddbf160d37493aa16d5e87`和官方Actions`38087341051`同SHA，38/38非特权独立PG16真job完成，原36 job逐字不变，物理16/16+HTTPS11/11、71原生Artifacts（新`11681669932/11681904341`有效），仅18个本批新增白名单；A源码检查`000016`新增复合`license_id/member_employee_id`强FK、签发来源身份不可变、revoked_at严格不可逆，真实H-A11/14另一个PG16 backend实际锁等待超时`55P03`，重测末次403与不可变审计。原三项`A-F05-3A-01/02/03`全部PASS/CLOSED，4S本人受信正向最小detail200也已独立确认。
- A正式PR评论`6102629625`，安全标准合并GitHub PR32 merge SHA`73a369554d98b3afac58c414fda1815aef190e42`；正式报告`07_重建工作区/F05-3A_A主控第三轮独立验收PR32正式合并与F05-3B接力_2026-10-11.md`。`F05_3A=A_ACCEPTED_MERGED_PR32_CI_ONLY`，非生产许可。
- A据PDM-04 Final三个固定JYT同步API、car_code身份冲突、真实下架与ListingCycle等已确认规则正式下发新包`07_重建工作区/F05-3B_A主控JYT批发身份来源上架周期与三接口隔离安全完整施工单_2026-10-11.md`。`F05_3B_A_RELEASED_FOR_B / NEXT_OWNER=B / B_NOT_STARTED`；B从最新main新建`feat/f05-3b-jyt-wholesale-lineage-cycle`，隔离JYT合成来源与独立车源同步Credential/权限及三API合同，旧38 Job冻结加2真PG16=40/40同SHA，原生两Artifact后交A；无可信source即SOURCE_GAP，禁止生产/JYT真实网络/电话/资金、一键转名邦（后续F05-3C）及B合并main。
- F05整体、F04生产、C/H01和V1基线仍`NOT_READY`。

## 2026-10-11｜F05-3B A真实独立验收合并PR33、F05-3C新正式施工单放行（无新增产品规则）

- GitHub三方同受检SHA：B/PR33/Actions`38091991627` = `6c5d1c9d7eeef4b503cc96152d9e06d9ddbd15a8`；40/40独立真PG16 jobs成功，原38job全文冻结，新增真实物理17/17、环回TLS9/9、85原生Artifacts，新核心`11685175262/11684104098`有效；PR仅12项批准目录新增文件，旧000001～000016/生产/产品Final/C不变。按F05-3B施工单核对car_code唯一身份、真实上下架cycle、三独立API启停/受信CI同步Credential、批发核心冲突与名邦历史冲突自动屏蔽、安全DTO/审计/非特权PG16锁`55P03`，均通过本轮A独立复验。
- A正式签收PR评论`6103550202`，A按PR受检HEAD保护标准合并GitHub PR33，merge SHA`f983f13b6631d194c23c9b7ace77d6d691955c76`，完整报告`07_重建工作区/F05-3B_A主控独立验收PASS_PR33正式合并与F05-3C接力_2026-10-11.md`。仅`F05_3B=A_ACCEPTED_MERGED_PR33_CI_ONLY`，真实JYT源/生产依然SOURCE_GAP。
- 依据现行PDM04 Final同车同周期单向转名邦、现时Employee正常管理许可/对象范围、锁车交易/客户权益保留、历史JYT lineage封印、隐藏重算及图片资产可信落地之规则，A正式放行`07_重建工作区/F05-3C_A主控批发一键转名邦同车同周期经营来源单向转换与历史安全完整施工单_2026-10-11.md`：`F05_3C_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`，B从最新main建`feat/f05-3c-convert-wholesale-to-mingbang`，仅CI-only批准新目录，冻结旧40作业并增2真PG16，最终42/42同SHA与原生Artifacts、中文交接；来源/图片/历史权益carrier不足须报告SOURCE_GAP，不得伪造全通过或自行合并/接生产。
- F05整个工程域、F04生产、C/H01、V1基线`NOT_READY`。

## 2026-10-11｜F05-3C A首次独立复验跨版本技术裁决与PR34原分支一次性整改单（无新增产品规则）

- PR34 Draft B最新HEAD`31edd5a0a83291f38bc1d9a4985ed76b89856bde`≠Actions`38097826807` HEAD`7cc68ca7078944728c7985511fe69086dbec7e83`；run真实42 Job/40 success/2新增物理与TLS失败，原生日志旧F05-3B`F05_3B_FROZEN_000016_REQUIRED`：`000018`后16版历史使旧签000017 v17源码只准15版而fail-closed。PR全部12新增白名单，旧40冻结jobs第一个39逐字一致，`f05-3b-jyt-three-apis-https-pg16`仅末尾额外空行；必须恢复原文。
- A按正式PDM Final选定**真实双阶段源引导**：先在未迁v18的v17隔离PG16由原签F03 Admin/独立Sync Credential真实入库JYT批发Vehicle/Cycle/INTEGRATION审计，再严格物理封印追加000018并在新目录当前版本校验，后执行现时Employee/已有受信业务对象scope的单向同Vehicle同Cycle转换。旧v17在v18上拒绝是已签防篡改要求，不改旧000017/旧migration/旧CI、不删除版本或假签。v18三源API如要求继续工作，仅本包新目录中建严格v18兼容适配真实核凭据/开关/来源/锁/审计，并做物理/TLS正反；实证不足保留`F05_3B_V18_FORWARD_COMPAT_SOURCE_GAP`。
- PDM08 Final §12/13/13.1转换与图片资产化解耦/3A受控CDN过渡规则既签，不重新请用户选择；无外部对象存储证据明确`IMAGE_LOCALIZATION_SOURCE_GAP`，缺多原因隐藏matcher保守hidden并标`HIDE_REASON_RECALCULATION_SOURCE_GAP`，缺Favorite现时carrier与无当期受信Vehicle对象scope各自SOURCE_GAP，不能用模拟表或历史JYT car_code授名邦经营权。
- 正式A原PR34定向整改单`07_重建工作区/F05-3C_A主控首次独立验收跨版本兼容技术裁决与原PR34完整定向整改单_2026-10-11.md`，A正式PR评论`6104424172`；**`NEXT_OWNER=B`**原分支`feat/f05-3c-convert-wholesale-to-mingbang`完成受信source修复、旧40全文冻结、新2真PG16最终同SHA42/42与新两原生Artifacts+中文自验后交A。现在`F05_3C=A_REVIEW_BLOCKED`，**PR34不合并、不启F05-3D/生产**，F05/H01/V1`NOT_READY`。

## 2026-10-11｜F05-3C A二轮独立复验旧版本阻断关闭、新v18批量offline幂等计数真实回归一项整改

- B/PR34 HEAD`2bbae12fe648f96c02b4caf3afa51761d4761bd7`与Actions`38104964738`同SHA、42/42独立非特权真PG16 Jobs成功，旧40全文逐job一致，新物理16/16、真实TLS7/7、87官方Artifacts、新源`11689216636`与TLS`11689605814`有效、PR全15个批准新文件。A原要求的v17先签源→000018真实受信版本→v18精确CI前向适配/转换、真双PG16 `55P03`及敏感出口403均有源码及官方原生日志证据；旧版本源缺口与旧40末尾空行已修复通过。
- **A-F05-3C-04 新阻断**：新v18 `v18-sync.mjs`批量下架对任一重复已签事件总返回`count:0`，然而已正式签收的原F05-3B `contract.mjs`返回`count:existing.count_rows`。新源码可确定：首次count>0成功时同事件重试会误报0；C-A12现缺此原生回归。按原三固定接口一致性合同必须修复并补真实PG16 positive/noop/payload-collision/不可变一次回执。当前42/42虽全绿但不算F05-3C最终A PASS。
- A完整正式定向整改单`07_重建工作区/F05-3C_A主控二轮独立复验v18批量下架重试回执计数定向整改单_2026-10-11.md`，PR34 A评论`6104730168`。**`F05_3C_A_SECOND_REVIEW_CHANGES_REQUESTED / PR34_NOT_MERGED / NEXT_OWNER=B`**；B在原分支原PR只修本批v18适配和独立测试/中文交接，不变旧40 jobs、旧迁移、PDM Final/生产；最后同B/PR/Actions SHA42/42全绿与两新未过期原生Artifact再次交A。不新增用户产品裁决、不进F05-3D。
- PDM08图片转换与资产化解耦、`IMAGE_LOCALIZATION_SOURCE_GAP`；多原因hidden Matcher、Favorite物理、无现时Vehicle对象责任授权、真实生产JYT/新车型映射仍分别标`SOURCE_GAP`，F05整体/C-H01/V1`NOT_READY`。

## 2026-10-11｜F05-3C A二轮独立复核：同SHA42项成功但当前Lock归属竞态与v18下架重放数量2项定向阻断（无新产品选择）

- B分支/PR34/Actions`38104964738`受检HEAD同为`2bbae12fe648f96c02b4caf3afa51761d4761bd7`；GitHub官方42/42真实非特权PG16独立jobs成功，旧F05-3B 40个Job正文严格逐块不变，新物理16/16和loopback TLS7/7，87原生Artifacts，新物理`11689216636`、HTTPS`11689605814`未过期，15个PR新增文件仅白名单。上轮A version 000017→000018兼容裁决已由真实v17先签受信JYT源→迁000018精确v18封印→本包内精确v18 API adapter及真正同车同Cycle条件式员工转换/PG16/HTTPS正反证据关闭。
- A源码二轮另检两处未在现有42 Job覆盖的本工作合同缺口：`A-F05-3C-04` 当前锁车负责对象只计数不锁作为授权来源的Lock行直到转换COMMIT，现有两backend竞态只覆盖Transaction/employee治理，不覆盖Lock-only被取消、移交的TOCTOU；`A-F05-3C-05` v18批量下架首次count_rows=1，但同eventKey重放固定返回count0，违背冻结v17返回原收据count_rows的接口幂等合同。要求B在本新包加Lock行FOR SHARE/等价DB守卫与双PG16实际锁等待55P03、终止Lock COMMIT后转换拒绝；修v18同事件offline原值1→1并新负例。无需更改旧迁移或产品规则。
- A已签完整新整改单`07_重建工作区/F05-3C_A主控二轮独立复验同SHA42项通过但对象责任并发与批量下架重放合同定向整改单_2026-10-11.md`，PR34 A评论`6105828398`，当前 **`F05_3C=A_SECOND_REVIEW_CHANGES_REQUESTED / PR34_DRAFT=false但未合并 / NEXT_OWNER=B`**，原`feat/f05-3c-convert-wholesale-to-mingbang`原PR最小整改、旧40job正文完全冻结、新两独立PG16最终同SHA42/42及两新原生Artifact/B中文交接再交A。图片落地、隐藏规则、Favorite现时Carrier、无Lock/Transaction的普通批发车Scope、未知新JYT上游车型与生产真实连通均SOURCE_GAP，F05/F04生产/H01/V1持续`NOT_READY`。未合并/不启F05-3D。

## 2026-10-11｜F05-3C A三轮最终真实PG16审查PASS、PR34标准合并与F05-3D正式放行（无新产品决议）

- 独立确认B/PR34/Actions`38117365590`最终SHA`b719ff21c8e95c94313604669e12924ae5ed70b7`一致；GitHub42/42非特权PG16 success，旧40 Job YAML定义由A逐块对比全文相同。真实源码新物理18/18和TLS7/7原生Job`114404835815/114404835801`通过，87 Artifacts中新源`11694680695`与TLS`11694007038`有效、15新增文件全部许可目录。旧迁移、生产Server、PDM Final/IA/C未改。
- 原A-F05-3C-04 Lock-only行级FOR SHARE/双真实PG16后端修改Lock超时`55P03`及过期Lock拒、A-F05-3C-05 v18批次事件原收据count_rows一致回放（1→1/0→0/并发两车2→2、错误event拒）经真实PG16代码+日志独立确认关闭。先旧v17真Admin签名邦合成受信JYT source并生成Vehicle/Cycle/INTEGRATION收据→真000018版本封印→新v18独立CI适配、真实Employee有效Lock/活动Transaction对象Scope同Vehicle/Cycle单向转换，业务历史原样保留、交易completed拒绝，以上仅在CI受信条件下成立。
- A正式签收PR34评论`6106235671`，A实际GitHub带`expected_head_sha`标准合并返回`merged=true`，merge commit`0384a5792a272f3344ba72b305380fe0c8966251`。详细A验收文件`07_重建工作区/F05-3C_A主控三轮最终独立验收PR34条件式CI通过正式合并与F05-3D接力_2026-10-11.md`。裁定仅`F05_3C_CONDITIONAL_CI_ACCEPTED_MERGED_PR34`，F05/V1仍`NOT_READY`。
- A正式发布`07_重建工作区/F05-3D_A主控普通批发车对象管理Scope可信来源与授权隔离完整施工单_2026-10-11.md`，下一个`F05_3D_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`；B从最新main新建`feat/f05-3d-wholesale-object-scope-trust`，仅新受信Scope核账与最窄CI适配，不创建通用伪Owner、不是自动授予全部JYT车辆权。旧42非特权Job逐字冻结，新增2 PG16，新最终同SHA44/44与原生证据、中文交接交A；缺实物理可信来源不得认受信正向。PDM08真实图片资产、hidden原因、Favorite当前物理源、未知新JYT车型/真实同步控制面继续SOURCE_GAP，另批承接，不启生产。

## 2026-10-11｜F05-3D A独立审计/拒绝验收PASS、PR35正式合并、F05-3E可信hidden原因隔离工程放行

- B/PR35/Actions`38122141246`同SHA `3dab7ee19b11a6f11d20d3e739ff202140b2f4f0`；官方44/44独立非特权真PG16 success，原42job完整原文冻结，新物理D-A01～08 **8/8**、真实TLS D-B01～07 **7/7**，89份原生Artifacts中新物理`11695554078`/TLS`11695782435`有效，PR仅新增6许可目录文件。实数据库F05-2人工current responsibility来源`source_snapshot`CHECK仅支持mingbang/four_s，伪wholesale签Owner真PG16 SQLSTATE23514；F05-3B JYT lineage只证明车源身份，不证明Employee经营Scope。当前无当期本人Lock/活动Transaction的普通批发车不能凭Team/role/SyncCredential/JYT publisher伪造经营管理权，HTTPS403正确，PG16双Backend撤权/Vehicle离线锁争用55P03通过。**仅SOURCE_GAP审计和安全拒绝PASS，不签普通批发正向转换**。
- A签收PR35评论`6106867501`，GitHub带`expected_head_sha`标准合并`merged=true`，merge SHA `876904c8bb1d7953d4e8fd08f22ee997f8d34f1b`。完整A正式报告`07_重建工作区/F05-3D_A主控独立验收PR35可信来源审计PASS正式合并与F05-3E接力_2026-10-11.md`。`F05_3D_TRUSTED_SCOPE_AUDIT_ACCEPTED_SOURCE_GAP_CONFIRMED_CI_ONLY`；`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP`**仍待实际受信签发事件/人来源裁决**，不能由B追加通用Owner表自授权、不能虚称F05已生产READY。
- A独立放行`07_重建工作区/F05-3E_A主控自动隐藏规则命中原因现时承载与来源转换重算可信隔离完整施工单_2026-10-11.md`：`F05_3E_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`，指定B从最新main建`feat/f05-3e-hide-reason-trust-recalculation`，勘验PDM04 Final既定规则中心source_scope、不同字段AND/同字段多值OR/多规则OR、转换后的重新命中集合/人工hidden永久独立/真实在售四条件，可信原因Carrier不足则只能审计+保守hidden、显式SOURCE_GAP，不能人工签假解除。冻结旧44真PG16 job完整源码，新2独立真PG16 jobs、最终46/46同SHA和两原生Artifacts、中文交接；B不得合并main或接生产。
- 图片真实对象存储双成功、Favorite物理Carrier、通用JYT无锁转名邦受信Owner、新JYT车型上线/生产鉴权、客户资金/电话均继续各自SOURCE_GAP；F05整体/F04生产/C-H01/V1基线`NOT_READY`。

## 2026-10-11｜F05-3D A原生来源审计通过、PR35已合并，F05-3E独立隐藏原因可信源工程放行（无未经批准新权限）

- GitHub B/PR35/Actions`38122141246`同SHA`3dab7ee19b11a6f11d20d3e739ff202140b2f4f0`，44/44真实非特权PG16 jobs成功；冻结旧42 YAML Job原文全部不变；新物理D-A01…08 8/8、HTTPS D-B01…07 7/7，89原生制品中本批`11695554078/11695782435`有效，PR 6个批准新增文件，旧000001～000018/生产/PDM/C未动。A独立查库证明F05-2 Vehicle Steward PG16`source_snapshot`仅支持mingbang/four_s，JYT`car_code` lineage无员工Owner签发权，无Lock/活动Transaction对象关系的普通批发车合法管理责任缺真实Carrier；Team/静态权限不能取代单Vehicle产权。原生HTTPS403/PG16 23514及双Backend治理撤权/源下架55P03通过。该包仅审计+fail-closed通过，**不签通用批发车转换正向PASS**。
- A PR35正式验收评论`6106873556`，核查该PR已由并行授权合并，不重复执行合并；实测GitHub merge SHA`876904c8bb1d7953d4e8fd08f22ee997f8d34f1b`。A签收报告`07_重建工作区/F05-3D_A主控独立来源审计PASS_PR35已合并与后续缺口规划_2026-10-11.md`。**`F05_3D_A_ACCEPTED_MERGED_PR35_AUDIT_ONLY`**。
- 下一包可独立工程`07_重建工作区/F05-3E_A主控自动隐藏与人工原因可信来源及转换重算隔离完整施工单_2026-10-11.md`，即`F05_3E_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`，分支`feat/f05-3e-hide-reason-trust-recalculation`；B核PDM04 Final自动hidden不同字段AND/同字段OR/多规则OR、手动/其他原因签发及来源变更重算，只有真可信来源足够才允许在隔离PG16按最窄隐性安全开展正例，否则继续保守hidden及SOURCE_GAP。冻结旧44真实PG16 job，增2新Job，可信情况下目标46/46同SHA、原生证据，不碰生产。
- **待用户集中裁决/NOT_CLOSED，不得放宽代码**：`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`：无本人当期Lock/活动Transaction的普通批发车是否能由特定名邦经理/店长依据经证实经营归属事件授予某员工单辆车/当前Cycle可撤销、可审计管理权？此为候选方案不是已签产品规则；未经批准没有允许正向200的授权链。F05/F04生产/H01/V1基线继续NOT_READY；图片对象存储、其他hidden原因、Favorite实体、未知JYT新车型和生产真源维持SOURCE_GAP。

## 2026-10-11｜F05-3E A可信隐藏源真实PG16审计通过PR36已合并，F05-3F收藏关系载体来源隔离审计放行（无新增产品规则）

- GitHub B/PR36/[Actions38126797933](https://github.com/suzhe868-arch/mb/actions/runs/38126797933)最终HEAD`19cbfae8aff44b7c3e1641db22a82b2f627d5932`一致；官方46/46独立非特权真PG16成功、旧44 Job完整块全文逐字不变；新source E-A01～08 **8/8**与loopback TLS E-B01～07 **7/7**且真正PG16并发`55P03`；91原生Artifacts中source`11697378026`和HTTPS`11697891984`有效；PR8新增文件都在本包批准白名单，旧迁移/F03～F05-3D/PDM Final/生产/C均未动。A签收PR36评论`6107603063`并实际同SHA标准合并成功，merge SHA`84c87268718de03ad5a8d04acdf6b5375289b4e0`，正式验收报告`07_重建工作区/F05-3E_A主控独立验收隐藏原因可信来源审计PASS_PR36正式合并与F05-3F接力_2026-10-11.md`。
- 工程结论仅`F05_3E_TRUSTED_HIDE_REASON_SOURCE_AUDIT_COMPLETED_SOURCE_GAP`：M94当前`vehicle_hide_rules`的source_scope/conditions JSON与UpdatedBy FK不是受信发行/撤销/不可变版本/人工hidden和其他原因ledger，也没有当前真实规范品牌/地区/年款/关键词可信matcher映射；合法Employee+当前已转名邦Vehicle无完整原因时只fail closed/保持hidden，不得自动visible。静态JSON样例仅证明不可宣称已签命中正向重算。完整隐藏重算权限与物理来源仍待后续正式裁决/施工，F05总域不因审计绿灯完成。
- A下一唯一放行`07_重建工作区/F05-3F_A主控收藏当前物理载体可信来源与同车同周期业务关系保真完整施工单_2026-10-11.md`：**F05-3F Favorite当前物理Carrier+同Vehicle同Cycle已成立客户Lock/Transaction/Recommendation/查价等关系保全独立来源审计**，B从最新main新建`feat/f05-3f-favorite-carrier-preservation`，旧46个非特权PG16 Jobs逐字冻结仅加2新Job，48/48同SHA+两原生Artifacts/中文证据后交A；缺Favorite已签承载不得自造表/权限/假200，保留`FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`。无Lock/活动Transaction普通批发车现时Owner签发缺口`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`仍待用户明确，B不得替用户创造权限。
- 状态`F05_3E=A_AUDIT_ACCEPTED_MERGED_PR36_SOURCE_GAP / F05_3F=A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`，F05/F04真实生产/C-H01/V1基线`NOT_READY`；真实JYT/图片双成功/电话/资金无生产授权。

## 2026-10-11｜F05-3F A独立验收合并PR37、F05-3G隔离工程放行（工程状态登记，不是新增产品裁决）

- A实审B/PR37/Actions38131580736最终HEAD `0e84c08ca88b91aa19dc16ac32f9767fc207ee7a`一致，GitHub48/48独立非特权真PG16 success、旧46个Workflow Job正文逐个完全相同，新增source Job`114446837464` F-A01～08 8/8、loopback TLS Job`114446837672` F-B01～07 7/7，两Backend原生`55P03`及已有客户/Vehicle/Cycle关系行哈希不变。新增两官方有效Artifacts `11699197064`/`11699177384`，PR仅8个白名单新增文件。A验收意见[6108149003](https://github.com/suzhe868-arch/mb/pull/37#issuecomment-6108149003)，正常`expected_head_sha`合并成功 `merged=true`，merge SHA`34e840a0f9ec63d5d7092bd48d6026513afcfd78`。A报告`07_重建工作区/F05-3F_A主控独立验收PR37审计限定PASS正式合并与F05-3G施工交接_2026-10-11.md`。
- 受限工程结果只签`FAVORITE_CARRIER_AUDIT_COMPLETED_SOURCE_GAP / EXISTING_RELATIONSHIP_PRESERVATION_REAL_PG16`；**真实Favorite Customer+Vehicle当期实体/取消/幂等历史载体不存在，`FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`仍开启**，不得宣称收藏功能实现。当前客户/锁车/推荐/当前Cycle查价关系保全并非Favorite真实现时记录已被保全。
- **不新增产品规则**，据已签PDM-20 Final §23/§31、PDM-04 Final §15.2.1、PDM-01/PDM-25 Final，A独立技术放行F05-3G隔离新增Favorite物理载体+不可变幂等事件：施工单`07_重建工作区/F05-3G_A主控收藏独立现时物理载体与历史幂等事件隔离增量施工单_2026-10-11.md`。B最新main建`feat/f05-3g-favorite-physical-carrier`；旧48项真实PG16 Job原样、只新增2独立真PG16 Job（目标50/50同SHA+2原生Artifacts+中文交接），000019只能在旧000018精确真实签源之后隔离追加，旧迁移/旧代码/Final/生产/C零修改，无可信真实Customer微信Session时正向HTTP fail-closed。
- 未决的`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`仍须用户裁决**有Lock/活动Transaction以外**的普通JYT车谁可签发具名Employee+Vehicle+Cycle的单车管理权及撤权依据；F05-3G绝不借收藏表签发车辆Owner。隐藏原因/图片真实双成功/未知JYT车型及生产第三方继续SOURCE_GAP；F05/C-H01/V1基线均`NOT_READY`。当前`F05_3F_A_ACCEPTED_MERGED_PR37 / F05_3G_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`。

## 2026-10-12｜F05-3G A首次独立审查50项CI全绿但收藏历史安全2项整改单（工程登记，非新增产品裁决）

- B`feat/f05-3g-favorite-physical-carrier`/[PR38](https://github.com/suzhe868-arch/mb/pull/38)/[Actions38159418079](https://github.com/suzhe868-arch/mb/actions/runs/38159418079)最终HEAD一致`9bd9a0b91972dfa374d0a77ce9793c909519f750`，官方第2尝试50/50真实非特权PG16 Jobs success，旧48 Job全文逐条冻结，新Source G-A01～08 8/8和TLS G-B01～07 7/7，真双PG16后端`55P03`；95份原生Artifacts中新的Source`11709519396`、TLS`11709848032`有效，PR12个新增文件均在本包目录+专属Workflow。全部CI事实保留。
- A独立代码审查发现2项CI未覆盖的工程安全空缺（与已签PDM-20/PDM-25不变量直接相关）：**A-F05-3G-01** Favorite Current可以直接按合法版本/时间DML改状态，但`000019`的trigger不强制匹配同一事务不可变Event，且伪造Event可独立插入，必须真实PG16强制事件因果+负例；**A-F05-3G-02** v19`verify()`对已签前版000018 checksum/结构SHA未重新核证，升级后的历史迁移元数据篡改可能漏检，必须在v19真实库独立负向复核。这不是改变收藏产品规则，也不是允许B修改旧已签迁移。
- 已在[PR38正式A审查意见](https://github.com/suzhe868-arch/mb/pull/38#issuecomment-6111960790)及主线`07_重建工作区/F05-3G_A主控首次独立验收50项CI全绿但收藏事件因果与历史版本签名两项定向整改单_2026-10-12.md`签发**一次性完整工程整改**。当前`F05_3G_A_FIRST_REVIEW_CHANGES_REQUESTED / PR38_NOT_MERGED / NEXT_OWNER=B`，B继续原分支PR、仅修新本包文件、旧48 Job字节不变；新最终同SHA官方50/50成功与新原生Artifacts和B中文交接后交A复验；A未合并main，不放行后续F05-3H。
- 尚未获得真实微信Customer Session→Favorite Actor来源，不得真客户收藏HTTP正向；普通JYT无Lock/活动Transaction的管理Owner签发仍`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`需用户未来产品裁决；隐藏重算、图片双成功、真实JYT/资金/电话/生产等缺口不变，F05/C-H01/V1仍`NOT_READY`。

## 2026-10-12｜F05-3G A二轮独立验收两项历史安全阻断CLOSED、PR38正式合并；F05-3H微信Customer受信来源审计放行（工程状态，无新产品裁决）

- F05-3G B `feat/f05-3g-favorite-physical-carrier` / [PR38](https://github.com/suzhe868-arch/mb/pull/38) / [Actions38163355029](https://github.com/suzhe868-arch/mb/actions/runs/38163355029) 三方最终SHA`428f2697054cfba4e181217f82483520091c49e4`一致，GitHub官方50/50独立非特权PG16 Jobs success。A逐YAML完整块核冻结旧48 Job原文不变；新增source10/10、TLS7/7、真实双backend`55P03`及旧前置回归，原生Artifacts`11711291347`（79781B）/`11711112264`（79474B）存在非空未过期，12新文件均白名单。
- A前次`A-F05-3G-01`Current/Event数据库历史不一致与`A-F05-3G-02`v19漏验旧v18签名两项真实阻断现已**CLOSED**：新000019 PG16 deferred constraint triggers在COMMIT拒绝无事件Current直接INSERT/合法状态更新及虚假Event；新v19`verify()`重验固定v18源checksum/结构SHA与前16迁移历史不可变attestation，G-A09、G-A10真实负例与恢复均有效。A[正式验收PR评论](https://github.com/suzhe868-arch/mb/pull/38#issuecomment-6112247134)后带`expected_head_sha`标准合并，GitHub实际`merged=true`，merge SHA`592089f83009d7604364ec0cc985a710e470a215`。验收报告`07_重建工作区/F05-3G_A主控二轮独立验收历史因果与v18签名双整改PASS_PR38正式合并及F05-3H接力_2026-10-12.md`。
- **下一工程正式放行F05-3H**：`07_重建工作区/F05-3H_A主控微信Customer身份与Favorite受信Actor现时来源审计安全隔离完整施工单_2026-10-12.md`，仅审已签PG16`customer_wechat_identities`与`customers`真身份载体、微信官方服务端会话→唯一Customer受信链与Favorite权限的来源事实，未证实不能伪造成功。指定B从最新main新建`feat/f05-3h-customer-wechat-actor-trust`，旧50完整PG16 CI Job正文冻结、新增2独立PG16审计作业（官方最终52/52同SHA+2原生Artifacts+完整中文交接）交A；B不自行合并main，不触真实微信生产/资金/电话/JYT。
- **不新增任何产品规则**。PDM-01 Final微信身份→稳定Customer、PDM-20 Final独立收藏与可见域、PDM-25 Final鉴权历史最小展示保持；微信账号真实code/session签名尚未受信验证，`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`继续阻断真客户收藏；通用无Lock/交易JYT经营Owner`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`继续待用户裁决；隐藏原因、图片双成功、未知车型、跨版本在线转换和实际生产第三方缺口不动。**`F05_3G_A_ACCEPTED_MERGED_PR38 / F05_3H_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`，V1/F05/C-H01/F04生产基线`NOT_READY`**。

## 2026-10-12｜F05-3H A独立来源审计PASS、PR39正式合并与F05-3I v19既有收藏一键转名邦兼容施工放行（工程技术登记、非新增产品裁决）

- A独立核B指定分支`feat/f05-3h-customer-wechat-actor-trust`/[PR39](https://github.com/suzhe868-arch/mb/pull/39)/[Actions38166372689](https://github.com/suzhe868-arch/mb/actions/runs/38166372689)最终SHA`5dca08996f67e41fbc6e6a27584473695b6b4898`一致，官方52/52个独立PG16 Jobs success；旧50 Job完整YAML连续原文逐字相同、新仅行内定义h-source和h-https两PG16 Jobs。H-A01～08 8/8、H-B01～07 7/7原生通过，真不同PG backend Customer治理`55P03`和微信identity到Customer复合唯一/FK/停用均实测；新增两官方未过期Artifact **名称`source` ID`11712197256`**（78,217B）/**名称`https` ID`11712271937`**（78,190B），总97份，9个新增文件全部允许范围，冻结旧迁移及正式产品规则/生产不改。
- A正式验收[PR39评论](https://github.com/suzhe868-arch/mb/pull/39#issuecomment-6112665012)：`F05_3H_A_SOURCE_AUDIT_ACCEPTED_FAIL_CLOSED_CI_ONLY`。Customer微信身份**物理映射**已签，但没有受信微信官方服务端code/session签发/撤销→Customer本人持有授权来源；`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`持续阻断真实收藏，不能把Employee/4S/Admin/JYT或伪Customer ID作为本人授权。A携`expected_head_sha`正常PR合并，GitHub真实`merged=true`，merge SHA`1368572b2a470adb0646970811fa99e9d4173327`。中文报告`07_重建工作区/F05-3H_A主控微信Customer可信来源审计PASS_PR39正式合并与F05-3I接力_2026-10-12.md`。
- A基于原PDM-04 §15.2.1、PDM-20 §23及原F05-3C/F05-3G已签语义，正式放行F05-3I**另一个无需真实微信服务端授权即可完成的CI正向技术闭环**：`07_重建工作区/F05-3I_A主控v19收藏现时关系与批发转名邦同车同周期兼容完整施工单_2026-10-12.md`。当前原F05-3C服务严格v18版本验证导致v19已有Favorite时不能调用转换；A仅**技术授权**B在`engineering/f05/wholesale-to-mingbang-conversion/service.mjs`修改精确受信**v18/v19版本验签入口**，绝不改变原受控Employee+Team/capability/本人当前Lock或未完成Transaction对象权限、JYT当前lineage/周期、hidden/图片、事件账。其余只允许新`engineering/f05/favorite-conversion-v19-compat/**`和一个新专属Workflow；旧000001～000019迁移/其他旧代码不可改。真实PG16须**先有v19 Favorite Current及不可变Event，再合法转名邦，前后同Vehicle/Cycle、收藏与其他已签客户关系全文哈希保真**，不能拿v18先转再收藏替代。旧52个独立PG16 Job完整定义冻结、新2个Source/TLS原生Job，目标54/54官方同SHA成功＋2原生Artifact与中文交接交A。
- **保留独立待裁产品项**：普通无Lock/活动Transaction批发车具名Employee管理权`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`仍需用户业务裁决；隐藏多原因`HIDE_REASON_RECALCULATION_SOURCE_GAP`、图片`IMAGE_LOCALIZATION_SOURCE_GAP`、真实微信Customer会话及第三方/电话/资金/生产、新JYT车型继续SOURCE_GAP。**`F05_3H_A_ACCEPTED_MERGED_PR39 / F05_3I_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**，F05/F04生产/C-H01/V1产品基线`NOT_READY`。本条不更改任何PDM Final规则。

## 2026-10-12｜F05-3I A正式技术裁决：单文件容量限制，准许同SHA双Workflow 52+2真正PG16门禁（工程登记，非产品规则变更）

- **权威技术裁决`A-F05-3I-CI-GATE-SPLIT-01`**：原F05-3I单一Workflow一次54/54要求因旧52 Job签名YAML实际511990 UTF8字节而难以可靠执行，上次超至512893字节服务端没创建任何Job。A正式只修改**同最终SHA的CI运行载体**：分别由**完全原文冻结的旧52 Job独立workflow真实52/52 success**和**本包两个新真实PG16 Job另一个workflow 2/2 success**，两个GitHub官方run的`head_sha`都必须与B分支/PR40最终完整SHA一致，两run真实54 Job全部success才可A合并。严禁借旧SHA结果、修改旧Job、降低PG16/原生证据覆盖。
- A独立核B`feat/f05-3i-favorite-conversion-v19-compat`/[PR40](https://github.com/suzhe868-arch/mb/pull/40)/[Actions38168629659](https://github.com/suzhe868-arch/mb/actions/runs/38168629659)现HEAD`0cfd74821eb7909c099ea8afe977f671fea47723`，**新增仅2/2 Job success**而非54/54；本批source I-A01～11含02b **12/12 PASS**、HTTPS I-B01～07 **7/7 PASS**，旧前置F05-3C v18 18/18、真双PG16 backend`55P03`；新Artifacts source`11712859478`（79462B）及https`11713385063`（78678B）有效。A实际源码核唯一`engineering/f05/wholesale-to-mingbang-conversion/service.mjs`修改是精确受信v18/v19 verifier选择，旧Employee/Team/Lock/Transaction/current JYT objectScope/CAS业务主体未改；原生正向证明**v19已有Favorite Current+不可变ADD事件→原已签合法一键转名邦→同Vehicle/Cycle、收藏及关系SQL行SHA全部不变**。这些受检事实仅说明新增2 Job业务自验成功；**PR40不得合并**，旧52还没在最终B SHA上重跑。
- **A完整正式裁决/补正单**：`07_重建工作区/F05-3I_A主控技术裁决单_同一提交双工作流52加2真实PG16门禁与B一次性CI补正_2026-10-12.md`，并已下发[PR40 A正式技术裁决](https://github.com/suzhe868-arch/mb/pull/40#issuecomment-6112969869)。B继续原分支PR，只**额外新增**`.github/workflows/f05-3i-frozen-52-revalidation.yml`，把最新main原签F05-3H Workflow`jobs:`以下52个完整旧Job正文逐字拷入，`jobs:`以前用短合法header触发B分支；保留现有本批i-source/i-https两个新PG16 Job的独立Workflow。两run同一新最终SHA真实52/52+2/2、两新Artifacts、原生日志和B中文全包交接再交A复验。禁止改冻结旧workflow/000001～000019、Final/IA/C/生产或扩大Employee管理权；B不得自合并、不进后继批次。**`F05_3I_A_TECH_DECISION_SPLIT_CI_B_REMEDY_PENDING / PR40_NOT_MERGED / NEXT_OWNER=B`**。
- 实际微信Customer持有身份`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`、无Lock/活动交易通用JYT经营Owner产品待裁`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`、隐藏原因重算、图片双成功、真实第三方/资金/电话、生产等全部保留。F05/F04生产/C-H01/V1基线继续`NOT_READY`，本登记**不构成新PDM产品裁决**。

## 2026-10-12｜F05-3I同SHA拆分CI 54/54独立PG16全部PASS、PR40正式合并；F05-3J离线重上架跨Cycle收藏保真放行（工程记录、无新产品裁决）

- A按前次技术裁决`A-F05-3I-CI-GATE-SPLIT-01`独立重验B最终`feat/f05-3i-favorite-conversion-v19-compat`/[PR40](https://github.com/suzhe868-arch/mb/pull/40) /[冻结旧52项Actions38169649160](https://github.com/suzhe868-arch/mb/actions/runs/38169649160)/[新增2项Actions38169649123](https://github.com/suzhe868-arch/mb/actions/runs/38169649123)，四方共同最终SHA`4308a81b23301e911eb02bcd495a7b63a123a0ff`。两个官方run attempt1 completed/success，A通过官方完整分页证实冻结**52/52**、本批**2/2**独立真正非特权PG16 Jobs success，**合计54/54**没有skip/failure。冻结旧52Job原始Workflow从`jobs:`至EOF 510382字符与新独立回归Workflow全文严格相同，修改仅新workflow的push触发分支头；旧Job正文、服务版本、测试定义一个字符不变。Source I-A01～11含02b 12/12，HTTPS I-B01～07 7/7，两个新原生Artifacts source ID`11713756564`（79448B）/TLS ID`11713696913`（78692B）均非空未过期。
- A独立原生PG16和源码核证`v19已实际存在Favorite Current/不可变ADD Event→旧F05-3C受信Employee凭同Vehicle/Cycle当前合法Lock执行批发一键转名邦→原Vehicle/Cycle保持、完整Favorite Current/Event和受检相关客户对象原生行SHA256全部不变`；无对象Owner的普通批发车即使被收藏也不授予转换权，错误版本/假token/不同event/锁争用`55P03`拒绝。原`engineering/f05/wholesale-to-mingbang-conversion/service.mjs`只对真实迁移记录精确16/17条静态选旧v18或完整新v19验签入口，原Employee/Team/capability/Lock/Transaction/JYT lineage/CAS/幂等/审计业务函数主体全文不动。旧000001～000019迁移/PDM Final/IA/C/生产未改。
- A[PR40完整正式独立验收评论](https://github.com/suzhe868-arch/mb/pull/40#issuecomment-6113097761)签`F05_3I_A_FINAL_REVIEW_PASS_54_OF_54_SPLIT_SAME_SHA_CI_ONLY`，Github带`expected_head_sha`真实标准合并返回`merged=true`，**merge SHA`1170b2d39b0ce101e4b5d627f41c250cd00400b1`**。正式A报告`07_重建工作区/F05-3I_A主控同SHA52加2共54项PG16独立验收PASS_PR40合并与F05-3J接力_2026-10-12.md`。
- **下一唯一正式工程施工单F05-3J**：`07_重建工作区/F05-3J_A主控v19既存收藏跨JYT真实下架重新上架同车不同周期保全完整施工单_2026-10-12.md`；从main新分支`feat/f05-3j-favorite-jyt-relist-v19-compat`。按照已签PDM-20 §23，真v19先有Customer+Vehicle Favorite/不可变Event，随后用原已签F05-3B受信JYT Credential+SystemAdmin控制API使Vehicle确实offline结束旧Cycle，再合法relist新Cycle**同Vehicle、Favorite全历史不变，旧ListingCycle查价权不能变新Cycle查价权**，不穿透hidden/Priority。仅许可对原`engineering/f05/jyt-wholesale-lineage-cycle/contract.mjs`与`ci-router.mjs`受信版本验证入口作真实v17/v19精确校验小补丁，不允许更改Admin/API Credential/JYT真实权限和业务操作；新增本批工程目录与三个独立Workflow，冻结旧52+上批i 2，新添j source/TLS 2，三个run同SHA官方56/56真PG16 success+两原生Artifacts及中文B交接后交A；B不得自合并。
- 真实微信Customer Session`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`、普通无Lock/活动Transaction批发车Employee经营Scope`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`仍独立保留待用户业务决定，隐藏原因/图源双成功/外部JYT或微信及资金电话、新车型等不在本次范围。**`F05_3I_A_FINAL_ACCEPTED_MERGED_PR40 / F05_3J_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**；F05全域/F04生产/C-H01/V1基线**`NOT_READY`**。本条只登记工程与现有PDM规则，不作任何新产品裁决。

## 2026-10-12｜F05-3J同SHA真PG16 56/56正式验收PASS合并PR41、F05-3K上游旧car_code重放抑制集成正式放行（工程记录，非产品裁决）

- A独立查B`feat/f05-3j-favorite-jyt-relist-v19-compat`/[PR41](https://github.com/suzhe868-arch/mb/pull/41)/三GitHub Actions [旧52 run38171029004](https://github.com/suzhe868-arch/mb/actions/runs/38171029004)（官方attempt2最终52/52 success，attempt1有两次公共PostgreSQL16镜像限流）、[旧I2 run38171028962](https://github.com/suzhe868-arch/mb/actions/runs/38171028962)（2/2 success）、[新J2 run38171029006](https://github.com/suzhe868-arch/mb/actions/runs/38171029006)（2/2 success）四方同最终SHA`f04335f83181eee3ca2e0b9140b04331cc9f780f`，**真实56/56独立PG16 Job全部成功**，无skip/pending。旧H52个`jobs:`至EOF 510382字符原文与新冻结旧52工作流严格相同；旧I2原文1969字符与新冻结I2严格相同。新Source J-A01～10 **10/10**，新TLS J-B01～07 **7/7**，2个真实Artifacts源ID`11714510958`（79012B）、TLS ID`11714416211`（78782B）非空、未过期。
- A真PG16核证v19已存在Customer+Wholesale Vehicle Favorite Current及不可变ADD事件，再SystemAdmin授予独立JYT Credential按已签F05-3B API真实offline关旧Cycle、新active同Vehicle开新Cycle，Favorite整行Event历史Hash全保留、旧Cycle价格权限与扣额历史仅属旧周期，新Cycle不继承，hidden不自动发布。原JYT`contract.mjs`只改严密v17/v18/v19受信版本选择及去除陈旧once捷径，原`ci-router.mjs`只改HTTP启动签名选择；A逐字确认全部旧JYT治理/数据/审计/API路由主体不改，迁移000001～000019/Final/IA/C/生产不改。[PR41 A正式验收评论](https://github.com/suzhe868-arch/mb/pull/41#issuecomment-6113514400)判`F05_3J_A_FINAL_REVIEW_PASS_56_OF_56_CI_ONLY`，按`expected_head_sha` GitHub标准合并回执`merged=true`、**merge SHA`86963d34cb757bbd5e7185ed5747f1b5b9728a68`**。A正式报告`07_重建工作区/F05-3J_A主控同SHA56项PG16独立验收PASS_PR41正式合并与F05-3K接力_2026-10-12.md`。
- **下一唯一正式F05-3K施工**：`07_重建工作区/F05-3K_A主控v19既存收藏转名邦后JYT旧车源事件重放抑制同车同周期保全完整施工单_2026-10-12.md`，指定从main开`feat/f05-3k-favorite-converted-jyt-replay-guard`。本批是将三条已签真实F05-3B JYT可信来源、F05-3C合法员工转名邦、F05-3G v19 Favorite Current/Event在**同个真实隔离PG16**串接：先原JYT导入同码批发+真实收藏，Employee凭当前合法Lock/Team/capability完成真正批发转名邦，此后旧JYT`car_code`新active/offline/current、冲突型号、回放/并发不可复活或复制Wholesale，也不得改变Favorite/ListingCycle/价权/客户历史，真实双backend`55P03`。不改任何旧源码、000001～000019、产品Final/IA/C/生产，**只新增**本批隔离工程目录及4新工作流，完整冻结历史52/52+旧I2 2/2+旧J2 2/2，新增K2 2/2共**58/58独立真PG16同最终B/PR/四官方Runs SHA全绿+本批2份原生Artifacts**、中文交接后交A，B不自合并。
- 保留`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`、`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`普通无Lock/Transaction批发车管理权、`HIDE_REASON_RECALCULATION_SOURCE_GAP`、`IMAGE_LOCALIZATION_SOURCE_GAP`与真实JYT/微信/资金/电话/生产等缺口。**`F05_3J_A_ACCEPTED_MERGED_PR41 / F05_3K_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**，V1基线`NOT_READY`，本条仅现有产品下工程技术登记，不新增任何PDM产品裁决。

## 2026-10-12｜F05-3K独立真PG16 58/58 PASS、PR42正式合并；F05-4客户查价权益来源/原子性完整施工放行（工程记录，非新产品裁决）
- A复核B `feat/f05-3k-favorite-converted-jyt-replay-guard` / [PR42](https://github.com/suzhe868-arch/mb/pull/42) 最终SHA `9428a3753240198b4a1f01732a7ef09b95897e81`，官方 [H52 Actions38174161044](https://github.com/suzhe868-arch/mb/actions/runs/38174161044) attempt2 52/52、[I2 Actions38174161057](https://github.com/suzhe868-arch/mb/actions/runs/38174161057) 2/2、[J2 Actions38174161046](https://github.com/suzhe868-arch/mb/actions/runs/38174161046) 2/2、[K2 Actions38174161053](https://github.com/suzhe868-arch/mb/actions/runs/38174161053) 2/2，四run同最终SHA、`completed/success`共58/58独立真实PG16；原旧H52/I2/J2 `jobs:\n`至EOF完整正文510382/1969/1981字符与新冻结文件逐字一致，11项变更只新增授权文件，无旧源码/迁移/正式产品规则改写。第一次H52因公共PG16镜像拉取限流2 Job未开测，attempt2官方同SHA失败Job重跑后全绿。
- K本批新Source K-A01～10 10/10 + HTTPS K-B01～07 7/7 原生日志实核：真实v19 Favorite Current/Event先存在，原合法Employee Lock+Team/capability调用F05-3C将Wholesale变名邦，同Vehicle/Cycle，原JYT上游老码active/核心车型冲突/offline/current及乱序重放全部不得恢复Wholesale或复制、变更现有Favorite/价权/历史。真两PG16 backend `55P03`、客户关系逐SQL行Hash、不法反转SQL拒绝。K原生source Artifact ID11715535282（80031B）及https ID11714479629（79258B）同SHA真实有效。A[PR42正式独立验收意见](https://github.com/suzhe868-arch/mb/pull/42#issuecomment-6113788105)同意后GitHub `expected_head_sha`标准merge回执`merged=true`，**merge SHA `53d0bcc126225878af638c7a741aa80937c90b6a`**。中文A报告`07_重建工作区/F05-3K_A主控58项PG16独立验收PR42合并与F05-4接力_2026-10-12.md`。
- **下一唯一正式完整施工F05-4**：`07_重建工作区/F05-4_A主控PDM10客户批发查价每日额度与周期隔离受信完整施工单_2026-10-12.md`，按已批准PDM-10 Final LIMITED/UNLIMITED、UTC+8每日额度与临时追加、单Customer+Vehicle+ListingCycle查价权、Recommendation合法免费权、3A等级当天切换、账号停用恢复与真实授权原子性，B从最新main建`feat/f05-4-customer-price-entitlement-cycle`。仅隔离真实PG16/合成Customer受信context与现行F03 Employee安全；不假造真实微信Customer Session或生产Customer Detail成功。只允许新专属工程目录、必要时唯一新增v20签名迁移和5新独立Workflow，冻结旧H52/I2/J2/K2合计58 Jobs全文逐字，新增F05-4 source/TLS 2 Jobs，共**同最终B/PR/5官方run SHA 60/60独立PG16 success+2原生Artifacts+中文B全包自审**交A。缺受信源保守拒绝并真实登记，B不自行合并。
- 保留`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`、`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`、`HIDE_REASON_RECALCULATION_SOURCE_GAP`、`IMAGE_LOCALIZATION_SOURCE_GAP`；真实JYT/微信/电话/资金/生产/C-H01均未签，F05/F04生产/V1基线`NOT_READY`。**`F05_3K_A_ACCEPTED_MERGED_PR42 / F05_4_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**。

## 2026-10-12｜F05-4独立PG16 60/60通过、PR43正式合并与F05-5客户当天查价免费加次工程放行（非产品规则修改）

- A依次检查[PR43](https://github.com/suzhe868-arch/mb/pull/43) / B最终40位SHA `cbf1c3f83e0c8f0b17ce89bd9f4edbc45bf9abfa`，Github compare ahead3 behind0、19项全新增白名单；旧H52/I2/J2/K2原Workflow从`jobs:\n`到EOF 510382/1969/1981/2012字符与本批冻结文件**逐字100%一致**，旧正式业务源码、000001～000019迁移/旧CI/PDM/IA/生产均不修改。
- 官方全部同最终SHA且`completed/success` attempt1：冻结[H52 run38177212934](https://github.com/suzhe868-arch/mb/actions/runs/38177212934) **52/52**、[I2 run38177212886](https://github.com/suzhe868-arch/mb/actions/runs/38177212886) **2/2**、[J2 run38177212901](https://github.com/suzhe868-arch/mb/actions/runs/38177212901) **2/2**、[K2 run38177212889](https://github.com/suzhe868-arch/mb/actions/runs/38177212889) **2/2**，新[F05-4 run38177212996](https://github.com/suzhe868-arch/mb/actions/runs/38177212996) **2/2**，总计**60/60真实独立非特权PG16全成功、无skip/failure**；旧校正提交失败不计入最终门禁。
- A直接审两个原生Job完整日志source`114582017133` 16/16、HTTPS`114582017047` 7/7均`# fail 0`，真实两PG backend对同Customer原子单扣、sameCycle和quota边界、UTC+8/3A临时追加/Account inactive、v20 CI-only签名、原生schema/catalog、HTTPS真实微信Customer issuer缺失安全拒绝，source原生Artifact **11716138787（81472B）**及https原生Artifact **11715779852（80589B）**同SHA有效。A正式[PR43独立验收意见](https://github.com/suzhe868-arch/mb/pull/43#issuecomment-6114138032)后以`expected_head_sha`标准merge返回`merged=true`，**merge SHA `ab664859aee927a6d1514d5654ba5fe2f8dba60b`**。报告：`07_重建工作区/F05-4_A主控独立验收60项PG16_PR43合并与F05-5接力_2026-10-12.md`。
- **F05-5已经由A正式签发**：`07_重建工作区/F05-5_A主控Employee当天查价临时加次可信Owner权限和3A账本完整施工单_2026-10-12.md`；B从最新main新建`feat/f05-5-employee-price-quota-adjustment`，真实隔离PG16核 PDM-10 §11/11.1 所定销售current owner+Permission、经理/店长Scope、4S/SystemAdmin拒绝、当天免费加次、UNLIMITED禁止新增、3A当日保留及UTC+8跨日、旧负责人/撤权并发；只允许新本包工程目录与6新增Workflow和必要受信CI-only v21，旧H52/I2/J2/K2/F05-4共60 jobs逐字冻结，再加新Source/TLS 2，目标六官方run同B/PR最终SHA **62/62真PG16 success+2本批非空原生Artifacts+完整中文B交接**。无法证明Issuer应`BLOCKED_SOURCE_GAP`，不能造生产允许正例；B不得合并main。
- 真实微信Customer Session`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`、正式客户展示价`CUSTOMER_DISPLAY_NUMERIC_PRICE_PRODUCTION_SOURCE_GAP`、Recommendation免费Issuer`F05_4_RECOMMENDATION_GRANT_ISSUER_SOURCE_GAP`、Employee加次Issuer`F05_4_EMPLOYEE_QUOTA_ADDITION_CURRENT_SCOPE_SOURCE_GAP`、普通批发Owner、隐藏重算、图片资产化和实际JYT/微信/资金/电话生产缺口均未关闭。F05/F04生产、C-H01和V1依旧`NOT_READY`。**`F05_4_A_FINAL_ACCEPTED_MERGED_PR43_CI_ONLY / F05_5_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**。

## 2026-10-12｜F05-5 A独立首次复验：同SHA真PG16 62/62通过，但Owner与Permission撤权并发竞态证明未闭环（退B原PR44整改）

- A读[PR44](https://github.com/suzhe868-arch/mb/pull/44)当前B最终HEAD `8a5ed0fd8733e9f89f39f60d49c6a02a330e6086`；六原生官方Actions [H52 38178976123](https://github.com/suzhe868-arch/mb/actions/runs/38178976123) 52/52 attempt2、I2 38178976144 2/2、J2 38178976179 2/2、K2 38178976110 2/2、F05-4 38178976118 2/2、本批F05-5 38178976134 2/2，最终同SHA真实独立PG16 **62/62 success、0 skipped**；新Source18/18，HTTPS7/7，source原生Artifact11717147410(82942B)与https11716758591(81968B)非空同SHA有效。旧五组60 jobs从`jobs:\n`全文510382/1969/1981/2012/2015字符逐字符一致；compare ahead3 behind0、20文件全部白名单新增，原签工程/迁移/PDM/生产无修改。
- **A明确不准合并PR44**：F05-5已签施工单明定真实两PG backend“权限撤销与加次事务竞争”“Owner交接与变更竞态”。目前新Source 5-A04是同请求Key并发、5-A13是静态personal deny再请求、5-A16是先改Customer Owner再请求，尚缺正在执行的真实加次事务与另一个PG backend Owner更新及Permission撤销**同时交错**、DB锁等待/`55P03`和两类提交次序后的账本/不可变事件完整证据。既有62绿灯不能代替未测项目；不得虚报最终验收PASS。
- A正式[PR44整改单评论6114488249](https://github.com/suzhe868-arch/mb/pull/44#issuecomment-6114488249)与新仓库`07_重建工作区/F05-5_A主控首次独立验收62项同SHA全绿但Owner撤权并发证据不完整定向整改单_2026-10-12.md`一次签署三项：A-F05-5-01真实Customer Owner竞争、A-F05-5-02真Permission撤销及可用Scope绑定变更竞争、A-F05-5-03新最终SHA六官方run 62/62与2份本批新Artifacts及中文完整交接。B继续原分支`feat/f05-5-employee-price-quota-adjustment`/PR44、仅授权白名单内整改，不合并main或开始F05-6，完成一次性交A二轮独立验收；当前`NEXT_OWNER=B`。
- 所有CI正例仍限定合成`customer.quota.add.ci.synthetic` Fixture，真实`F05_5_EMPLOYEE_ADDITION_SOURCE_GAP`未关闭；Customer微信会话、正式数字客户价、Recommendation免费Issuer、普通批发Owner、隐藏与图片及外部JYT/资金/电话/生产保持SOURCE_GAP，F05/F04生产、C-H01/V1 `NOT_READY`。**`F05_5_A_FIRST_REVIEW_CORRECTION_REQUIRED_B_REWORK / PR44_NOT_MERGED / NEXT_OWNER=B`**。

## 2026-10-12｜F05-5 A二轮独立并发验收PASS PR44正式合并与F05-6 PDM11找车Application/Demand接力授权

- 上轮[PR44定向整改单](https://github.com/suzhe868-arch/mb/pull/44#issuecomment-6114488249)所有实质问题被B在原PR新终HEAD `9f1d0fb86ce5187bf4be4c1fbb5e173adcba7b10`补齐。A亲查新Source原生Job `114592366085`，旧前置18/18＋新F05-5 5-A01~A22 **22/22**；Source测试源码是真实F03 Employee Session与PG事务checkpoint，并非mock：Customer Owner变更服务/写PG PID208/209，personal permission deny 208/210，scope binding revoke 208/211；三组真实双Backend争锁返回原生`55P03`；业务先commit然后撤权更新commit、新旧请求Key均拒绝、旧Owner/权限无重复额度、当日日账与原`customer_quota_adjustments`及不可变CI receipt原生计数SHA256不变；reverse先Owner/deny提交同样拒绝。HTTPS原生Job `114592365998` 7/7全fail-closed，旧M94+v21迁移历史/PG Catalog封印与rollback验证成立。
- 六条GitHub Actions与该B/PR HEAD同SHA、均`completed/success`：H52 [38180672311](https://github.com/suzhe868-arch/mb/actions/runs/38180672311) **52/52** attempt2（公共PG16镜像拉取限流仅官方同SHA复跑），I2 [38180672443](https://github.com/suzhe868-arch/mb/actions/runs/38180672443) **2/2**，J2 [38180672306](https://github.com/suzhe868-arch/mb/actions/runs/38180672306) **2/2**，K2 [38180672428](https://github.com/suzhe868-arch/mb/actions/runs/38180672428) **2/2**，F05-4 [38180672288](https://github.com/suzhe868-arch/mb/actions/runs/38180672288) **2/2**，新F05-5 [38180672441](https://github.com/suzhe868-arch/mb/actions/runs/38180672441) **2/2**，**62/62独立非superuser PG16 Job success无skip**。五组历史Job正文从`jobs:\n`到EOF逐字符全同(510382/1969/1981/2012/2015字)，20个本批变更均白名单新增，无旧业务/已签迁移/PDM/生产修改；最新SHA原生非空Artifact Source`11717611263`(88073B)、HTTPS`11716809234`(83255B)未过期。A最终PR验收评论[6114740787](https://github.com/suzhe868-arch/mb/pull/44#issuecomment-6114740787)。
- A正式以`merge_pull_request(expected_head_sha=9f1d0fb86ce5187bf4be4c1fbb5e173adcba7b10,merge_method=merge)`标准合并[PR44](https://github.com/suzhe868-arch/mb/pull/44)，GitHub回执`merged=true`，**merge SHA`32ccc088b5662d8d11aad41dd596af5b8b9c2697`**；后查main及PR closed/merged为true，初审纠错历史保留但本批已最终通过。完整A归档`07_重建工作区/F05-5_A主控二轮真实并发验收62项PG16_PR44正式合并与F05-6接力_2026-10-12.md`。
- A按`B工程完整施工路线图_F01至F08.md`F05“找车匹配/推荐/CRM”及**正式PDM-11 Final**`COMPLETE / USER_APPROVED`，发布下一唯一施工单`07_重建工作区/F05-6_A主控PDM11找车Application与Demand独立生命周期等级权益Owner受信安全完整施工单_2026-10-12.md`。指定B分支`feat/f05-6-find-car-application-demand-eligibility`，从**实施时main最新基线**建；限定新`engineering/f05/find-car-application-demand-eligibility/**`+7份新的workflow（冻结H52/I2/J2/K2/F05-4-2/F05-5-2共62个旧Job全文，新增Source与HTTPS各1，七官方run最终同SHA**64/64**真实PG16成功+两原生Artifact）。产品关键硬约束：Application pending≠Demand，普通客户可交合格申请但不得正式Demand；粉丝VIP也要按动态等级find-car权益与员工受信人工激活；手机/Owner/current status、个人permission/scope、active接客池须有真正签发Issuer，缺环生产一律SOURCE_GAP并fail-closed。禁止自动Matching/Recommendation/Priority/Lock或将价权益替找车权益；B不得自行合并main、跨施工单操作或改PDM。
- F05-5仍然只验收**CI-only**；`F05_5_EMPLOYEE_ADDITION_SOURCE_GAP`、Customer微信身份及手机号授权、正式客户数字价、Recommendation免费Issuer、一般批发管理Scope、隐藏与图片资产化、外部JYT/资金/电话均持续未关闭。全域F05/F04生产、C-H01和V1维持`NOT_READY`。**正式当前`F05_5_A_FINAL_ACCEPTED_MERGED_PR44_CI_ONLY / F05_6_A_RELEASED_FOR_B / NEXT_OWNER=B`**。更早“PR44初审退B”只表示发生过的历史审查，不得继续当当前状态。

## 2026-10-12｜F05-6 PDM11找车Application/Demand A独立64项PG16 PASS、PR45标准合并与F05-7 PDM12确定性Matching正式接力

- **F05-6 A独立审查完成**：B原分支`feat/f05-6-find-car-application-demand-eligibility`、[PR45](https://github.com/suzhe868-arch/mb/pull/45)最后HEAD `96f9d918e29c68803ff9ee167347fce2df5a7221`，compare原main ahead4/behind0、21项白名单全新增，未改任何旧签源码/迁移000001～000021/PDM/生产。A重新读取所有旧六组与新冻结Workflow的`jobs:\n`到EOF全文，六组**510382/1969/1981/2012/2015/2012**字符逐字符一致；为满足GitHub 512k工作流大小限制，H52只换等价最短触发头，没有删Job。七条官方同最终SHA run H52 [38183188457](https://github.com/suzhe868-arch/mb/actions/runs/38183188457) **52/52** attempt2，I2 [38183188367](https://github.com/suzhe868-arch/mb/actions/runs/38183188367) 2/2，J2 [38183188537](https://github.com/suzhe868-arch/mb/actions/runs/38183188537) 2/2，K2 [38183188365](https://github.com/suzhe868-arch/mb/actions/runs/38183188365) 2/2，F05-4 [38183188450](https://github.com/suzhe868-arch/mb/actions/runs/38183188450) 2/2，F05-5 [38183188426](https://github.com/suzhe868-arch/mb/actions/runs/38183188426) 2/2，F05-6 [38183188361](https://github.com/suzhe868-arch/mb/actions/runs/38183188361) 2/2，真正独立非superuser PG16 **64/64 success，0skip/fail/pending**；H52公共PG Docker镜像限流是同SHA官方成功复跑后全绿。
- A直接取得两新Job原生完整日志：Source Job`114599908551`前置18/18、本批Source **24/24 #fail0**；HTTPS Job`114599908415`新 **7/7 #fail0**。真PG16不同backend真实Owner变更服务/写PID222/225、权限撤销222/228、等级find权关闭222/231在激活事务尚未提交时相争，均原生SQLSTATE **55P03**，激活先COMMIT/撤权随后COMMIT、后续新/重放请求安全拒绝；普通find OFF申请pending≠自动Demand、find ON仍需Employee受信人工激活、当前Owner与Demand负责人独立、当前合同无自动Matching/Recommendation/Priority/Lock/客户价扣额。追加v22只在可抛弃隔离PG16，原v21完整Seal验证，注入回滚/当前catalog均通过。官方原生同SHA有效Source Artifact`11718354406`(88531B)、HTTPS Artifact`11718258034`(85972B)，ZIP SHA记录于原生日志。A正式[PR45验收评论6115027598](https://github.com/suzhe868-arch/mb/pull/45#issuecomment-6115027598)。
- A真实GitHub标准`merge_pull_request(expected_head_sha=96f9d918e29c68803ff9ee167347fce2df5a7221,merge_method=merge)`收到`merged=true`，**PR45 merge SHA `ef66aeac1b782b201ccb1146bad4031f92d3955f`**，无强推/无先变更B代码。正式A审查报告`07_重建工作区/F05-6_A主控独立验收64项PG16_PR45合并与F05-7接力_2026-10-12.md`。
- **下一唯一工程F05-7**：按已签`07_重建工作区/PDM-12_最终完整规则.md`及F05工程路线，A正式下发`07_重建工作区/F05-7_A主控PDM12确定性匹配Readiness四级结果与受信来源隔离完整施工单_2026-10-12.md`。B指定分支`feat/f05-7-deterministic-matching-readiness-four-tier`从执行时最新main建立；仅新增`engineering/f05/deterministic-matching-readiness-four-tier/**`与8份本批Workflow，旧H52+I2+J2+K2+F05-4+F05-5+F05-6共**64**Jobs全文`jobs:\n`保持原样，加新Source+HTTPS**2**，八官方Runs同唯一最终B/PR SHA **66/66真正非特权PG16** success且两个本批新Artifacts有效。PDM12正式guard：pending Application绝不Matching，active Demand尚未sales描述/合法确定性条件不得matching-ready，字段hard/preferred/tolerance/unknown及四级result可解释，预算只用合法Customer展示价，hidden与offline分层，Match Result不自动产生Recommendation/Priority/Customer visibility/Lock/价扣额；真实Issuer缺失生产fail-closed。B一次完成施工/CI/归档再交A，B不得合并main或提前进入F05-8。
- Customer微信Session/手机号合法授权、CustomerLevel找车权益及Employee人工Demand激活/Rule正式Issuer、生产客户价与增额、Recommendation免费Issuer、普通批发Owner、hidden来源重算/图片本地化与真实JYT/电话/钱仍BLOCKED_SOURCE_GAP；F05/F04生产、C-H01高保真及整个名邦V1 **`NOT_READY`**。当前`F05_6_A_FINAL_ACCEPTED_MERGED_PR45_CI_ONLY / F05_7_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`。


## 2026-10-12｜F05-7 A首次独立验收66项PG16全绿但PDM12四项产品规则未闭环，PR46退B

> **本节仅记录A工程技术验收裁决及接力，不新增、不修改任何PDM Final用户产品规则。** 产品Authority继续严格依据`PDM-12_最终完整规则.md`§8/§16/§18/§22/§30，最新指针以main顶部README/PROJECT_STATE/NEXT_ACTION为准。

- A正式取得B/PR46 HEAD `855bb463096652ca70ef4327c86e10db4d092825` 的八原生官方Run：`38185881710` H52 52/52 attempt2，`38185881669` I2、`38185881678` J2、`38185881716` K2、`38185881683` F05-4、`38185881661` F05-5、`38185881687` F05-6 各2/2，`38185883832`本批Source/HTTPS2/2 attempt2，全部同SHA `completed/success`，**66/66真正非特权PG16 Job成功零skip**。Source原生24/24与HTTPS7/7通过，真实PG双Backend锁PID216/217及216/225、SQLSTATE55P03。A再独立比对七组冻结旧`jobs:\n`到EOF全文与现有main源相同；25文件只新增在授权白名单。Artifact Source`11719249451`(94862B)、HTTPS`11719408424`(92141B)同SHA有效。
- **正式A独立评判不通过业务代码**：`contract.mjs` 当前在明确preferred fact缺失时仍可能评为high，违反PDM-12 §8；`service.mjs`未携带active Lock已占用事实，违反§18；`000023_matching_ci.sql`与本批服务尚无Rule部分重算失败集合与仅失败对象幂等retry，违反§30；`resolveRules`车系年款范围为简单等值，且多事实来源优先级无实现，未覆盖§22、§16。原24个Source绿灯用例没有运行以上产品边界正反例，**CI通过不等于A接受**。
- PR46正式[首次A独立验收及一口气整改单](https://github.com/suzhe868-arch/mb/pull/46#issuecomment-6115435460)，仓库`07_重建工作区/F05-7_A主控首次独立验收66项真PG16通过但PDM12业务边界未闭环整改单_2026-10-12.md`。**`F05_7_A_FIRST_REVIEW_CHANGES_REQUESTED_B_REWORK / PR46_OPEN_NOT_MERGED / NEXT_OWNER=B`**。B仅在原分支整改R01～R04补PG16真测试与R05完整同**最新SHA**66/66官方CI/Artifacts/中文交接；不得自行合并main，不得开始F05-8/F06。
- 实际生产Customer微信/电话权限、find/Rule生产Issuer、客户数字价、一般批发Owner、图片、JYT、资金及C/H01均`SOURCE_GAP`，F05/C-H01/V1`NOT_READY`。上述R01～R04均已有最终PDM12权威，不需用户新增产品裁决；历史F05-7初放行与B首次66成功不构成A最终接受。


## 2026-10-12｜F05-7 A二轮66/66独立正式验收PR46标准合并、F05-8 PDM13正式放行B

> 本节是**工程技术验收、GitHub真实合并及下批施工授权台账**，不是修改已获用户批准的PDM-12/13/14 Final产品规则，不自动关闭任何生产SOURCE_GAP。

- **F05-7独立二轮验收PASS**：B最终HEAD`99c38d013f67cc56975f1664120fb87c204afc3c`，PR46 A实签[独立验收评论](https://github.com/suzhe868-arch/mb/pull/46#issuecomment-6115975938) ID`6115975938`。A独立调用官方GitHub Actions run/jobs API，同HEAD八组`38189425576` H52 52/52、`38189425640` I2、`38189425565` J2、`38189425539` K2、`38189425599` F05-4、`38189425553` F05-5、`38189425588` F05-6各2/2、`38189425635`本批2/2，**66/66**真实非超级用户PG16成功无skip/fail。七历史冻结旧Job正文全文与main已签源相同；Source**28/28**、HTTPS**7/7**，真实PG双backend PID223/224与223/225的`55P03`，两个官方同SHA有效Artifact Source`11721556439`（101246B）/HTTPS`11721595542`（96332B）；真实M94→v23旧20+新1完整历史与注入回滚成立。
- **F05-7首审四阻断已关闭**：PDM12 §8 preferred missing不能high（原生7-A25 PASS）；§18 active Lock占用事实随Result签名、lock cancel转旧Result stale（7-A26 PASS）；§30 Rule affected partial failure记录失败集合/不可变attempt且只补偿失败对象（7-A27 PASS）；§22、§16 series_year年款闭区间及JYT原始车型事实优先、四来源provenance和同级冲突unknown（7-A28 PASS）。旧首验评论6115435460为已闭合历史，不再作为当前阻断。完整A归档`07_重建工作区/F05-7_A主控二轮独立验收66项真PG16_PR46标准合并与F05-8技术交接_2026-10-12.md`。
- **真实GitHub标准合并**：A在全部门禁PASS后执行`merge_pull_request(expected_head_sha=99c38d013f67cc56975f1664120fb87c204afc3c, merge_method=merge)`实际返回`merged=true`，**merge SHA `a56cc04e5a1d79fd67ad5332992d33348d123557`**；复查[PR46](https://github.com/suzhe868-arch/mb/pull/46)为`closed/merged=true`。F05-7只`CI_ONLY`，生产并未放行，F05/C-H01/V1`NOT_READY`。
- **下一唯一完整工程F05-8技术放行**：按2026-10-05用户最终批准`PDM-13_最终完整规则.md`，A已签`07_重建工作区/F05-8_A主控PDM13_Priority资格仲裁TTL排他与责任交接CI隔离完整施工单_2026-10-12.md`；B从实施时最新main新建唯一分支`feat/f05-8-priority-arbitration-ttl-handover`，只新增`engineering/f05/priority-arbitration-ttl-handover/**`和8份`.github/workflows/f05-8-*.yml`，不修改正式旧源码/PDM/迁移/工作流。范围Priority资格独立、current合法high/acceptable候选、同车唯一与多Demand折叠、`high>acceptable>Demand.created_at>demand_id`、TTL24h冻结、release/suppression、trigger变更、active Lock/Transaction、公海/Customer visibility、责任handover与审计，真实Issuer欠缺的只允许可抛弃CI synthetic。B完整开发测试与自验后交A复核，不得自行合并main或进行F05-9/F06/生产。
- **新的同SHA真实68作业技术裁决**：前七条新工作流严格原样冻结H52+I/J/K+F05-4/5/6旧64个PG16 Job，末第八份新工作流拥有4个独立真实非超级用户PG16 Job：两项**F05-7旧28/7业务测试兼容等效重验证**+两项新F05-8 Priority Source/HTTPS，总`52+2+2+2+2+2+2+4=68/68`，四份本批新有效Artifact。已签F05-7旧Source作业内`ci-verify-workflows.mjs`硬绑定F05-7旧分支触发路径，简单原样复制到F05-8将必然因旧分支无法同新SHA触发而失败；A在下一施工单明确允许只在**新目录**构建兼容运行器，真正继续运行未改`tests/source.test.mjs`28项、`tests/https.test.mjs`7项，F05-8自己的GitHub只读新审计替代旧分支专用结果汇总；绝不编辑旧签本体、跳过业务断言或假报job count。全部68项必须同**最终B/PR SHA**真实跑完。
- Customer微信及手机号合法授权、正式Priority/Rule/CustomerLevel当前find-car Issuer、Customer数字显示价、一般批发管理Scope、图片/JYT/电话/资金等生产来源持续`SOURCE_GAP`，F05/C-H01/V1均为`NOT_READY`。**当前`F05_7_A_FINAL_ACCEPTED_MERGED_PR46_CI_ONLY / F05_8_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`。**


## 2026-10-12｜F05-8 A首次正式审查：68/68同SHA真实PG16成功，但Priority四类业务边界退B

> 本节记录真实CI工程验收及技术整改结论，**不修改PDM-13/14 Final的任何已批准用户产品裁决**。下述旧CI成功与A新退回结论并存，均不得删除历史。

- **F05-8 B正式交审**：PR [#47](https://github.com/suzhe868-arch/mb/pull/47)，唯一交审B HEAD `8c296513c5f9f7b2a176560313c3e6db30a61abc`、compare原main `ahead35/behind0`、23个全新增文件均本批白名单，不改生产、旧迁移或已签历史工作流。A直接读取GitHub官方八组Push run及`/jobs?per_page=100`：H52`38200112071`52/52 attempt2，I2`38200112052`、J2`38200112045`、K2`38200111930`、F05-4`38200111921`、F05-5`38200111927`、F05-6`38200112289`各2/2，F05-8`38200112015`4/4 attempt2，**68/68真实非超级用户PG16独立Job success零skip/fail**；F05-7原生Source28/28 HTTPS7/7等效兼容、Priority本批Source20/20 HTTPS10/10真库通过，真PG两个PID263/264争锁`SQLSTATE55P03`。同SHA四份官方有效Artifact `11724649956`(109027B)/`11725170394`(99427B)/`11725116058`(103037B)/`11725315587`(99013B)，v24新CI迁移/ledger/catalog及注入回滚已验证。
- **A独立代码/产品复验暂不通过**：A正式[PR47独立验收评论6117566975](https://github.com/suzhe868-arch/mb/pull/47#issuecomment-6117566975)及`07_重建工作区/F05-8_A主控首次独立验收68项真PG16通过但PDM13生命周期及可见性边界未闭环整改单_2026-10-12.md`裁定四项必须实现并在真实PG16补未覆盖反例：**R01** 原Customer的另一活跃旧Demand凭不同Match签名可能突破已release/TTL的Customer×Vehicle×cycle suppression（PDM13§9/12/13）；**R02** Demand/Match/Customer/Vehicle/Employee等源状态实际提交后，缺失受影响范围事件驱动Priority自动失效或trigger替代，现仅锁/交易有DB触发，测试在改事实后手动arb才清旧事实（PDM13§14/30）；**R03** 客户可见性投影只用Recommendation/Grant与Priority，不读最新Customer active/find Level/cycle，因此合法旧授权可在当前已禁状态漏可见（PDM14§10/11/15及PDM13§15/18）；**R04** TTL过期仍保持`status=active`且受唯一索引占用，无独立自动due结束、同周期抑制及后继仲裁闭环（PDM13§10/13/26/28/30）。这四项均为当前已签PDM规定，非新增业务选择。
- **正式状态**：`F05_8_A_FIRST_REVIEW_CHANGES_REQUESTED_B_REWORK / PR47_OPEN_NOT_MERGED / NEXT_OWNER=B`。B原分支在本批新目录一次性补四项与真PG16正反例，完整历史旧64+兼容2+新2**重新以最后B/PR SHA同SHA 68/68成功**、四新非空有效Artifact及中文交审后交A复验；此前`8c296513...`的CI不能替代改后SHA。不得合并main，不放行F05-9/F06或生产。
- Customer微信/手机号及正式Priority/Rule/find权益Issuer、数字客户价、JYT图片电话/资金、部署UAT均`SOURCE_GAP`；F05、C-H01、V1持续`NOT_READY`。

## 2026-10-12｜A-F05-8二轮独立验收裁决：工程68/68 PASS，PDM13恢复仲裁与责任交接三项仍退B（唯一最新）

- **工程事实**：PR47 B HEAD `e873adeabc2e4a40149eb6b8c8a20a9189d69319`；八官方同SHA Push run `38208004686/38208004665/38208004648/38208004630/38208004508/38208004595/38208004624/38208004633`，**68/68**真实PG16成功，冻结旧64 Jobs原字节不变；旧F05-7兼容28/7、本批Source27/HTTPS10、四有效Artifact `11727729260/11727933765/11728063884/11728185904`及v24校验和真实双PID/55P03。首次R01～R04有B对应修复及真实PG用例，但本次独立审查不放过新增遗漏。
- **正式规则结论**：A二轮仍`CHANGES_REQUESTED`：R05 Demand从paused恢复、Vehicle重新可售等在不存在active Priority时不触发affected-scope自动仲裁；R06 Lock/Transaction结束或撤销不触发依据当前合法Match的恢复重仲裁；R07 Employee失效及个人Scope撤权的自动路径未建PDM13§25/26正式Handover Batch、可能提前将本可在剩余TTL内交接的保护让给他Customer。根据已签PDM13§22/25/26/29/30修复，不新建产品裁决。精确可执行A整改单：`07_重建工作区/F05-8_A主控二轮独立验收68项真PG16通过但恢复仲裁与责任交接未闭环整改单_2026-10-12.md`，对应[PR47](https://github.com/suzhe868-arch/mb/pull/47) A二轮正式审核评论。
- **下一责任B**：`F05_8_A_SECOND_REVIEW_CHANGES_REQUESTED_B_REWORK / PR47_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。B现分支一次性按R05～R07整改新PG16真实反例，保持旧64冻结、F05-7旧28/7和既有Priority27/10；新HEAD八同SHA官方68/68和四新原生Artifact、中文交接后交A复验。A未签通过且**未合并PR47**；F05-9/F06未放行，真实生产Issuer/客户/JYT/资金等`SOURCE_GAP`，F05/C-H01/V1`NOT_READY`。

## 2026-10-12｜A-F05-8三轮独立审查R08/R09技术安全裁决（唯一最新；不新增产品Authority）

- 已独立核最新B/PR47 HEAD `8b46d25be418160bee08dffa878c425485f88ffa`：八个官方Push workflow `38212636374/38212636372/38212636299/38212636403/38212636380/38212636389/38212636376/38212636369` 合计**68/68真实PG16 Jobs success**。签名F05-7旧Source28/HTTPS7、新Priority Source34/HTTPS10原生成功；原生双PG263/271 `55P03`、R07 272后端锁等待，四份本SHA有效Artifact `11730350811/11730225983/11729847696/11729553952`。此前R05–R07的恢复及Batch实现与测试保留，但本轮独立反向安全审计指出已批准PDM-13§24/25/31仍未满足两项。
- **R08**：交接成功后`service.mjs.retryHandoverCI`仅写Priority.responsible，不消费/验证合法签名Demand current responsible归属已转给目标；`f05_8_handover_source_valid_ci`仍验证Customer owner等于原Demand responsible，完成后`reArbitrate`又因handover完成而豁免与源同步，构成Priority与真正trigger Demand现时责任不同源，后续Object可见性失信。**R09**：目标只经`f05_8_responsible_authorized_ci(targetEmployeeId)`任意Team/Store有效Scope判定，未绑定该Customer/trigger Demand/Vehicle实际业务对象Scope，允许理论跨Team/Store接管。两项均为既签规则的工程遗漏，非新用户裁决。
- 完整正式整改单：`07_重建工作区/F05-8_A主控三轮独立验收68项PG16通过但Priority交接源责任与对象Scope失配整改单_2026-10-12.md`，PR47第三轮A正式评论作为唯一B整改入口。当前`F05_8_A_THIRD_REVIEW_CHANGES_REQUESTED_B_REWORK / PR47_OPEN_NOT_MERGED / NEXT_OWNER=B`；不A_ACCEPTED、不合并、不放行F05-9/F06。B原分支一次性按R08/R09真实PG16正反例和受信责任来源、对象Scope完成整改后新SHA八官方68/68+四有效Artifact与中文交接再交A。生产与整体V1仍`NOT_READY`。

## 2026-10-12｜A-F05-8第四轮独立验收R10/R11工程安全裁决（现行唯一，不新增产品Authority）

- 当前GitHub PR47 B HEAD `2d2bb3beb5943319b73a08f1fb1efb10fecd4b73` 仍未合并，A实际确认8官方**Push** run `38222101865/38222102061/38222101879/38222102212/38222101868/38222101889/38222101915/38222102083` 同SHA **68/68真PG16成功**；四份同SHA有效Push Artifact `11735530228/11734941344/11734881494/11734204434`；旧签F05-7 Source28/HTTPS7、Priority Source34/HTTPS10原生成功。B交审的第八运行`38222105342`实为PR事件，正式Push是`38222102083`，不能混称，但实有Push成功故CI门禁认可。B原R08 Demand/Customer/Match双源一致与R09 target对象scope已有修复及真PG证明。
- 依据已批准PDM13§14/25/26/30/31，A本轮发现**R10** `initiateHandoverCI/retryHandoverCI`的actor仅校验请求teamId一般Scope、未核当次Priority/Customer/Demand业务对象范围，可由不相关员工创建handover；**R11** 待交接的`f05_8_pending_source_ci`在owner漂移时未要求任何current high/acceptable Match，造成签名结果stale却继续active排他。非新用户裁决，需B原白名单新增真实跨团队无权DENY与Pending+stale原生COMMIT即时失效正反例。完整施工整改：`07_重建工作区/F05-8_A主控第四轮独立验收68项PG16通过但待交接合法匹配与操作者对象Scope未闭环整改单_2026-10-12.md`。
- **当前唯一状态**：`F05_8_A_FOURTH_REVIEW_CHANGES_REQUESTED_B_REWORK / PR47_OPEN_NOT_MERGED / NEXT_OWNER=B / F05_C-H01_V1_NOT_READY`。不A_ACCEPTED、不合并、不启动F05-9/F06。B原分支保留旧64冻结、兼容28/7及Priority34/10，新的8Push同SHA68/68、四新有效Push原生Artifact、中文B交接后再次交A。Production Issuer/微信/JYT/资金等仍SOURCE_GAP。

## 2026-10-12｜A-F05-8第五轮独立验收R12/R13权限与责任技术裁决（唯一最新；不新增产品规则）

- 本次PR47 B最新HEAD `f534b2ec60ddfedc36f154dcae4d41ff9f3227b2`，8条官方原生Push workflow同SHA真实PG16 Job **68/68 success**（H52 `38231248375` 52项、其余六冻结各2项、新F05-8 Push `38231248611` 4项）；F05-7 Source28/HTTPS7、Priority Source36/HTTPS10原生PASS；四份新Push同SHA有效Artifact `11739594838/11739106790/11738972335/11738742541`；A认定R10跨Team无权拒绝及R11 pending失效Match结束有实际代码和独立日志。
- **R12**：根据已签PDM-02§2/4，合法跨店/跨Team管理由明确Permission + DataScope确定；新`scopeSQL`强制目标store=员工主store，`actor_priority_scope_ci`强制对象Team Membership及主Store相同，错误拒绝明确授权经理/店长处理合法跨Store/同Store另一Team业务（现测试只克隆同Store外国Team）。**R13**：根据PDM-13§24/25/31与PDM-03历史责任不等于当前权，`actor_priority_scope_ci`允许仅凭旧`Priority.responsible`或`Handover.original`给Sales操作权，Demand/Customer已正式转到新负责人而Pending尚未完成期间可能继续操作、变更Batch/失败Attempt。
- **当前唯一裁决**：`F05_8_A_FIFTH_REVIEW_CHANGES_REQUESTED_B_REWORK / PR47_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`；第五轮完整可执行单：`07_重建工作区/F05-8_A主控第五轮独立验收68项真PG16通过但跨店合法Scope与交接旧销售撤权未闭环整改单_2026-10-12.md`。B仅限原F05-8 CI-only白名单补R12/R13真PG16合法跨店/无权跨店正反例、旧销售待交接撤权和真并发，旧冻结64/兼容28+7/Priority36+10不删弱；新最终HEAD重新8条Push 68/68和四新同SHA有效原生Artifact交A。A验收前PR47不合并、F05-9/F06不放行；生产真实身份、Issuer/JYT价格/资金继续SOURCE_GAP，F05/C-H01/V1 NOT_READY。

## 2026-10-12｜F05-8第六轮独立验收最终PASS/PR47真实标准合并与F05-9正式CI-only技术放行（现行唯一）

- **唯一已验收工程结论**：F05-8 PDM13 Priority资格仲裁/独占TTL/交接被A第六轮独立复审`A_ACCEPTED`。B最终工程HEAD `1dc08927b6b11e2327050d55e6f72f6f19984e8e`；[PR47](https://github.com/suzhe868-arch/mb/pull/47)签字评论`6123630533`；真实GitHub标准合并`merged=true`且merge SHA `d37b3fc9e44f4affd3b611c38c7c303bac93acb2`。第五轮R12合法跨店经理/店长数据范围、第十三项R13原销售待交接失权，已由最终源码与真实物理双PG COMMIT/Scope revoke负例闭合，R01～R11保留。本批更改23项均为新增F05-8 CI-only白名单，不碰旧签生产/PDM/旧迁移。完整正式中文验收合并档案：`07_重建工作区/F05-8_A主控第六轮独立验收68项PG16通过_PR47正式合并与F05-9技术接力_2026-10-12.md`。
- **A独立硬验门禁**：八GitHub官方真正Push同HEAD H52`38242775587` 52/52；I2`38242775430`、J2`38242775671`、K2`38242775501`、F05-4`38242775553`、F05-5`38242775395`、F05-6`38242775391`各2/2；F05-8`38242775552` 4/4。合计**68/68真独立非特权PG16全部SUCCESS零skip/fail**；Priority Source37/37、HTTPS10/10，兼容F05-7 Source28/HTTPS7全PASS，v24坏迁移注错rollback及原签Ledger/Catalog seal一致。四份真正Push同SHA有效非空原生Artifact `11744252155/11744295810/11743416591/11744405973`。CI-only PASS **不是生产READY**。
- **下一技术包已独立正式放行B**：F05-9 PDM14 Recommendation独立业务对象、hidden车对Customer本人单车Visibility、Priority临时抑制与恢复、推荐批发当前周期免费价权及不可变历史价格快照、普通Share安全导航/不继承上一人权限。Authority为已冻结`PDM-14 Final`与相关PDM-02/03/07/10/11/12/13/15/18/19/20/21/25；完整工程施工单`07_重建工作区/F05-9_A主控PDM14正式推荐隐藏车单车可见性免费批发查价和普通分享隔离完整施工单_2026-10-12.md`，状态`F05_9_A_RELEASED_FOR_B / NEXT_OWNER=B`。B从实时main新建`feat/f05-9-recommendation-visibility-grants`，仅新`engineering/f05/recommendation-visibility-grants/**`与`.github/workflows/f05-9-*.yml`实施可抛弃PG16 v25最小sidecar，**旧68独立PG16冻结+新2≥70同最终SHA、预计9官方Push workflows、新旧至少6新原生证据**，完整中文B交接后由A独立验收；未经A通过不合并，不跨越生产和旧迁移。
- **持续安全红线**：真实微信/手机号、Priority/Recommendation生产Issuer、真实数字报价、JYT图片/电话及正式外部同步、线上资金、真实UAT/部署未得到此工程包授权，仍`SOURCE_GAP`。F05整体、C/H01高保真、V1产品基线保持`NOT_READY`；F06未被F05-9工程单自动放行。以上是工程既签Authority下的技术执行，不新增/更改PDM裁决。

## 2026-10-12｜F05-9 A首次独立验收：70/70同SHA真PG16成功，但PDM14 R01～R04缺实证，正式技术裁决退B（现行）

- **当前唯一裁决**：`F05_9_A_FIRST_REVIEW_CHANGES_REQUESTED_B_REWORK / PR48_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。PR48最新受验B HEAD `019ddc76e760b390265c017efed72a56aca65d8b`，九条真正官方Push同SHA总70/70非特权PG16 SUCCESS（H52 `38260081399` 52/52；I/J/K/F05-4/5/6六项Run各2/2；F05-8 `38260081438` 4/4；F05-9 `38260081460` 2/2），六份该SHA真实Push原生有效Artifact `11751748628/11751603749/11751613563/11751209234/11752691126/11752167581`；Source12/12、HTTPS7/7及旧F05-8 Source37/HTTPS10、F05-7兼容28/7全通过。B的CI成果认可，不等于PDM14必须反例已验收。
- **A四项已签Authority实施和物理证明缺口**：R01未测真正其他Customer合法Priority的B旧Recommendation/hidden Grant/free价格权保留、Share抑制及结束恢复；R02未测Level find权益off/on、不同Store的Manager/StoreHead与4S/旧销售失责和个人deny，`sourceAuth(forTermination:true)`对Customer被禁用或find失效仍强制active+entitled存在历史end/void治理闭锁风险；R03未测价格咨询后补数字价、调价snapshot、批发同车同cycle转名邦、不同cycle价权隔离；R04未测真实Lock/Transaction占用不无条件禁止合法推荐、真实跨Store范围权限、两全新合法Vehicle独立批量部分成功、其他业务域双PG时序。逐条符合`PDM-14 Final`及已经正式放行F05-9完整施工单，需**真实PG16正反例**，无证据不能自称PASS；不以未测断言代码肯定有漏洞。
- **正式完整中文整改单**：`07_重建工作区/F05-9_A主控首次独立验收70项真PG16全绿但PDM14跨域权限与权益生命周期缺证整改单_2026-10-12.md`。B继续原`feat/f05-9-recommendation-visibility-grants`仅新CI-only白名单修补R01～R04，保留原12/7、旧68独立Job与全部前序签名源码/迁移/工作流；新最终SHA重新九官方Push至少70/70 success和≥6份本新SHA真正Push非空未过期Artifact/SQL日志，正式`READY_FOR_A_SECOND_INDEPENDENT_REVIEW`后交A。**PR48不合并、不放行F06**，真实微信Customer、Recommendation/批发价权生产Issuer、JYT/资金/UAT继续SOURCE_GAP，V1 NOT_READY。

## 2026-10-13｜F05-9 A二轮独立终验PASS、PR48标准合并；F05-10 PDM15新CI工程单正式放行B（现行）

- **A最终工程验收/merge事实**：F05-9 / PDM-14 Recommendation/hidden visibility/current-cycle free wholesale price-right/ordinary share CI-only包经A第二轮`A_ACCEPTED`，B最终SHA `d3cbaee088f6ba7d6b81fbd014813bedcf77671f`，GitHub [PR48](https://github.com/suzhe868-arch/mb/pull/48) 正式审核评论 `6128118804`，**GitHub真实merge SHA `eb33d4b5ad31d44a9e5fdc0eff98d83bdf3f0842`，merged=true**，已实际合入main。A证据归档：`07_重建工作区/F05-9_A主控二轮独立验收70项真PG16_PR48标准合并及F05-10接力_2026-10-13.md`。
- **九官方Push与所有真实证据**：H52 `38271143903`=52/52，I/J/K/F05-4/F05-5/F05-6六Run各2/2，F05-8 `38271143990`=4/4，F05-9 `38271144191`=2/2；9个Run均`event=push/head_sha=d3cbaee.../completed/success`，共70/70真正非超级用户PG16 Job成功，无skip/fail；Priority Source37/HTTPS10、兼容F05-7 Source28/HTTPS7、新F05-9 Source17/HTTPS7，旧真实迁移账、v25 SQL/Catalog checksum及注错ROLLBACK、安全两个真PG COMMIT时序。六份最后B SHA真正Push、非空未过期有效Artifact `11756614385/11757197692/11757263373/11757083818/11758705112/11757137942`。首轮审查R01其他Customer Priority压制+恢复、R02 entitlement/customer hold及当前角色权限、R03价格咨询→数字价/同车转名邦及历史快照、R04真实Lock/Transaction/跨店合法scope/多车批量正反例均在新增真PG中闭合且签名旧源码未被重写。
- **下一个已正式书面授权包**：F05-10｜PDM-15 Consultation独立工单四主状态/真实来源/独立assignee/合法handover/Customer disable独立Hold/15分钟首次真实人工响应SLA。一级Authority `07_重建工作区/PDM-15_最终完整规则.md`及全部相关冻结PDM，正式完整施工单`07_重建工作区/F05-10_A主控PDM15咨询工单来源独立负责人转派人工首响SLA与客户停用Hold_CI隔离完整施工单_2026-10-13.md`，状态`F05_10_A_RELEASED_FOR_B / NEXT_OWNER=B`。B须从实际最新main新建`feat/f05-10-consultation-assignee-sla`，仅新增`engineering/f05/consultation-assignee-sla/**`和`.github/workflows/f05-10-*.yml`，CI-only v26增量非生产迁移，旧70PG16冻结+新2≥72/72、预计10个官方同最后SHA Push与至少八原生有效同SHA Artifact，最后中文正式交审交A。B不得自行合并或修改旧签名PDM/迁移/原旧代码。
- **不扩大授权**：真实微信/手机号/咨询、价权或Priority生产Issuer、真实电话/JYT/飞书消息/财务/退款、正式Share/UAT部署未签；继续`SOURCE_GAP`。F05全域、C/H01高保真、V1基线仍`NOT_READY`；F06仍未正式技术放行。此次仅按照用户已确认的持续非生产技术执行流程进行阶段放行，并非修改任何产品裁决。

## 2026-10-13｜F05-10 A首轮独立验收：同HEAD 72/72真PG16成功、但PDM15 R01～R04业务安全来源未闭环，退B（唯一现行）

- **正式裁决**：`F05_10_A_FIRST_REVIEW_CHANGES_REQUESTED_B_REWORK / PR49_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。PR49最终B SHA `a3bde06e7615a9fcab2d16ed6ac1ec8e23d3ce2b`，24项均为F05-10新增CI-only白名单，GitHub `mergeable=true`但**A未签A_ACCEPTED/未合并**。
- **A已实际独立认定成功的证据**：十条真正`event=push`且同该B HEAD全部`completed/success`，H52 `38281583828` 52/52，I2 `38281583865`、J2 `38281583800`、K2 `38281583933`、F05-4 `38281583801`、F05-5 `38281583835`、F05-6 `38281583908`六组各2/2，F05-8 `38281583819` 4/4，F05-9 `38281583810` 2/2，新F05-10 `38281583838` 2/2，逐Run审`jobs?per_page=100`总**72/72真非特权PG16成功/0skip/fail**；新Source 12/12、HTTPS7/7及已签前序整套回归通过，v26注错ROLLBACK/Catalog seal验证通过。八份真正Push同该HEAD原生非空未过期SHA256 Artifact `11761586923/11761447292/11761078603/11760993509/11761885974/11761861412/11761478131/11761427751`。
- **本轮发现的已签PDM15业务矩阵阻断，不等于CI未成功**：**R01**：原服务`assignee_handover_pending`仅经理手动`assignee_invalid`赋值，Employee/Permission/DataScope突发失效未给出自动Guard/真实两PG COMMIT时序；**R02**：真实Recommendation来源、Demand/Owner/接客Pool当前合法优先级、Owner pending/公海、Owner变化Consultation assignee独立、跨Store合法Manager/StoreHead/4S/System Admin权限原生实测未闭合；**R03**：目前只凭任意格式符合Regex的`call/message`事件引用字符串就记首次真人响应，缺可信CI源事实与伪来源拒绝，SLA配置改动/timeout/DND/Customer disable Hold剩余时间续跑及真实并发缺物理证据；**R04**：尚缺NORMAL_CLOSED和invalid负例、Vehicle offline/hidden/4S合法来源、完整内容当前授权及Consultation不得变动推荐/价权/Lock/Transaction的真PG前后不变性证据。
- **唯一完整正式技术整改单**：`07_重建工作区/F05-10_A主控首轮独立验收72项真PG16全绿但PDM15交接自动Guard与首响SLA证据未闭环整改单_2026-10-13.md`。B继续原`feat/f05-10-consultation-assignee-sla`，仅新CI-only目录/workflow白名单包内修正R01～R04、增加真正2 PG Backend SQL验收、保留原Source12/HTTPS7和完整旧70冻结/PG v26 seal；新唯一最终SHA重新10真正官方Push **至少72/72 PG16** 全Success、≥8份新同SHA有效原生Push Artifact及完整中文`READY_FOR_A_SECOND_INDEPENDENT_REVIEW`交A再独立复核。PR49不合并、不放行下一F05/F06，真实手机号/微信/电话、人工沟通/通知、JYT/价格/资金及生产Issuer均SOURCE_GAP，F05/C-H01/V1 NOT_READY。

## 2026-10-13｜F05-10 A主控第二轮独立验收：72/72真PG16成功、R01认可、R02/R03/R04局部缺证退B（现行唯一）

- **正式A工程裁决，不修改产品规则**：`F05_10_A_SECOND_REVIEW_CHANGES_REQUESTED_B_REWORK / PR49_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。受验B HEAD `609edea9dddbdbe814a108e6edeed58a540dac3e`；24新增CI-only白名单；A直接核10真正Push同SHA完成成功，完整H52官方52/52，全部72/72独立真实PG16成功、Source24/24、HTTPS7/7、v26注错ROLLBACK/SQL Ledger/Catalog Seal及八份同SHA有效官方Artifact。原生Run：`38328311320/38328311329/38328311381/38328311469/38328311256/38328311305/38328311318/38328311293/38328311346/38328311242`；Artifact：`11782326670/11781232412/11781561726/11781691835/11781446878/11781346928/11781363060/11781307045`。
- **R01自动Pending/真实双PG撤权COMMIT/合法经理交接已通过；R02 Recommendation/Demand Owner与跨Store管理、R03可信合成证据/配置与Hold、R04四态/4S/下架仍有已通过物理正例，禁止删弱**。
- **尚缺签约技术实证，未签A_ACCEPTED**：R02缺公海合法归属形成后咨询成功/签名System Admin及非法目标交接拒绝；R03无真实DND/quiet状态下SLA不暂停实测、缺disable/恢复/withdraw完整双PG竞态；R04 count/hash只验证一次普通followup，缺创建至终结全生命周期以及真实其他Customer Priority竞争。完整正式整改单：`07_重建工作区/F05-10_A主控二轮独立验收72项真PG16全绿但公海授权DND并发与跨域全生命周期缺证整改单_2026-10-13.md`。
- **唯一B下一责任**：保持`feat/f05-10-consultation-assignee-sla`原白名单，新增真实Source测试、必要CI-only最小修复、新HEAD 10真Push同SHA≥72/72全部success、至少八份有效Artifact，最后`READY_FOR_A_THIRD_INDEPENDENT_REVIEW`正式交A。当前PR49不合并、不启动F06、非生产Issuer/JYT/微信/资金/UAT不放行，F05/C-H01/V1继续NOT_READY。

## 2026-10-13｜F05-10第三轮A主控独立复验与PDM17 Owner前置CI来源技术裁决（现行）

- **工程审查（非产品裁决）**：PR49受验B HEAD `d280a37ef6337156ecc2301bbea7f1383d7d82e5`。A从GitHub官方独立核10条真Push同SHA成功（H52官方52/52，全部72/72真非特权PG16 Job成功）、F05-10 Source30/30、HTTPS7/7、v26坏SQL ROLLBACK/旧签名账和Catalog seal、8份本SHA未过期非空SHA256原生Artifact。A直接读取F05-10真实源码与30项Source/7项HTTPS日志确认R01突发失效守护、R02当前权限/非法目标、R03 DND/quiet与disable-resume-withdraw两PG竞态、R04 Priority与跨域完整生命周期。这些成绩全部保留，不据此前缺证再次要求无根据重测。
- **唯一缺少的权威事实**：PDM15 §11/PDM17 §§9～14规定公海`owner=null`必须由合法PDM17 Owner claim/后台分配先形成唯一`current owner`才能开始咨询。现行F03接客池`reportPool`只是Employee接客资格；F03 Owner handover只支持已分配Owner→Owner，不提供公海→Owner首次认领。已查工程tree及现有真实服务，当前**未确认任何已签可调用的首次认领Issuer**。判定`SOURCE_GAP_PDM17_PUBLIC_POOL_OWNER_CLAIM`，不能以直接SQL或F05-10伪造认领事实。A不签`A_ACCEPTED`，**PR49继续open/unmerged**；所有Production SourceGap和V1 NOT_READY不变。
- **技术依赖裁决/正式放行（沿用冻结PDM Final，不要求新的用户产品裁决）**：先执行独立`F05-10-D1` PDM17公海合法领取/后台指定分配/人工咨询前Owner来源CI-only模块，完整施工单`07_重建工作区/F05-10-D1_A主控PDM17公海Owner合法领取指定分配和咨询前置来源_CI隔离完整施工单_2026-10-13.md`；B从实际最新main新建`feat/f05-10-d1-pdm17-public-pool-owner-claim`，只增`engineering/f05/pdm17-public-pool-owner-claim/**`与`.github/workflows/f05-10-d1-*.yml`，不抢F05-10 v26迁移序号、不动旧签版/生产/PR49。必须真实PG16 Source+HTTPS、双PID权限与同Customer claim并发、旧70回归+新增≥2且≥72/72真Push Job全部成功、≥8份最后SHA原生有效Artifact和中文交A。
- **合并顺序**：D1 B_SELF_TESTED交A独立验收→A_ACCEPTED后**只先合并D1的独立PR**→B从更新main回PR49原分支真实集成PDM17 Owner先claim后Consultation→PR49新HEAD重新十Push72/72与8 Artifact→A完整终验后才能决定是否合并PR49。C/H01、F05、F06、生产/UAT、V1仍未READY。完整第三轮A报告：`07_重建工作区/F05-10_A主控第三轮独立验收72项全绿_PDM17公海Owner合法认领来源缺口技术裁决_2026-10-13.md`。
- **唯一最新执行指针**：`F05_10_A_THIRD_REVIEW_SOURCE_GAP_PDM17 / F05_10_D1_A_RELEASED_FOR_B / PR49_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。

## 2026-10-13｜F05-10-D1 A首轮独立验收真72/72全绿但四项保护合同缺证退B（现行）

- **正式A技术验收结论，未改任何产品Final**：`F05_10_D1_A_FIRST_REVIEW_CHANGES_REQUESTED_B_REWORK / PR50_OPEN_NOT_MERGED / PR49_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。最后B HEAD `43e94834ba1e805b3222fad45d84b3169ab29b01`；A通过GitHub官方逐Run核10条真实push同SHA全部success、H52真52/52、72/72非超级用户独立PG16 Job成功、Source18/18/HTTPS7/7、签名旧M94-v25/Public Catalog seal、注错ROLLBACK及8份最后SHA原生有效Artifact。正确实现与既有成功测试全部保留。
- **仍缺四项真正签名安全合同验证/修正**：D1-R01保护函数只认旧`priority_leases`而不认F05-8当前`f05_8_priority_ci`，只认Transaction `in_progress`而漏签名`trading/pending/active`；D1-R02客户主动服务只尝试资格预筛pool中的第一人，可能漏真正合法第二人；D1-R03配置中`cooldown_seconds`仍缺真实非零冷却、版本变化与拒绝不写历史的PG正反例；D1-R04`acquire()`在重验当前权限/Scope前便对旧requestKey返回内部ownerId/receiptId，缺失权后安全幂等负例。完整书面A整改单：`07_重建工作区/F05-10-D1_A主控首轮独立验收与四项整改_2026-10-13.md`。未测不声称生产已经发生问题；严格以PDM17签版防越权。
- **B唯一当前下一步**：继续`feat/f05-10-d1-pdm17-public-pool-owner-claim`原分支，仅D1新增CI-only白名单一次性整改，保留旧70+新2 PG16全部真工作流和原Source18/HTTPS7，新增真正物理保护/候选回退/冷却/撤权重放测试，最终新SHA十Push72/72全success+≥8同新SHA有效原生Artifact/中文`READY_FOR_A_SECOND_INDEPENDENT_REVIEW`交A；**不合并PR50也不合并PR49**。待D1真正A验收及标准合并后才恢复PR49业已放行的合法公海Owner形成→Consultation集成与最终验收。F06/生产微信/电话/JYT/资金及UAT不放行，F05/C-H01/V1继续NOT_READY。

## 2026-10-13｜F05-10-D1 A二轮验收正式通过并合并PR50，放行PR49最后CI集成（现行）

- **正式A独立终验（仅CI-only）**：B最终受验HEAD `3edf40b7cda1ddf8cb4ca340f0fb33dfc0b0d50a`；A再次调用GitHub官方REST查十条同SHA真正Push工作流均completed/success、完整H52真52/52、总72/72独立非超级用户PG16 Job成功；D1 Source23/23、HTTPS7/7、SQL注错Rollback与旧M94-v25 catalog/ledger seal成功；八份同SHA官方SHA256非空未过期Push Artifact。PR50只新增24项D1 CI白名单，没有更改F03/F04/F05-1～9、PDM Final、旧签名迁移、PR49或生产。A首轮四项R01当前v24 Priority/交易保护、R02接客候选合法回退、R03PG时钟冷却和配置版本、R04失权同key幂等读守卫，已亲读源码/真实PG Source日志全部闭环。
- **真实标准PR Merge**：A先在PR50 [签署A_ACCEPTED](https://github.com/suzhe868-arch/mb/pull/50#issuecomment-6138873276)，再以原HEAD为expected_head_sha调用GitHub标准PR合并；返回**merged=true，merge SHA `9c9e73d5eaa8ab9aa15a45ba1be38b39d1dc7403`**。后验main与PR50确认主线已含D1、PR50 closed/merged=true。完整A验收归档：`07_重建工作区/F05-10-D1_A主控二轮独立验收23项Source72项PG16全绿并合并PR50正式报告_2026-10-13.md`。
- **唯一后续正式A放行**：`F05-10 Final Integration`继续**原**`feat/f05-10-consultation-assignee-sla`及PR49，正式完整施工单`07_重建工作区/F05-10_A主控D1合并后公海Owner到Consultation真PG16集成与PR49最终终验正式施工单_2026-10-13.md`。B以最新main已合入D1为不可变依赖，仅在F05-10 CI-only白名单真实同库实现`pool owner=null→D1合法当前Owner→PDM15 Consultation创建`、授权拒绝/两物理PG时序/跨域不变性；特别验证D1 v25 sidecar与F05-10 v26签名迁移的合法顺序，不能修改D1、旧签版、迁移账或冒充生产。保留旧70 Job与原Source30/HTTPS7，新增Source>30项，PR49新末次B HEAD重新十条真Push/≥72/72独立PG16 Job成功、≥8份新SHA原生证据及中文READY_FOR_A_FINAL_INDEPENDENT_REVIEW后交A。**原PR49尚未A_ACCEPTED、未合并**；不得提前启动F06。
- **真实产品/上线边界未改变**：D1公海进入Issuer、独立Permission与Quota为`CI_SYNTHETIC_AUTHORITY_ONLY`，生产`PDM17_OWNER_ISSUER_GAP`；真微信手机号、电话、JYT/飞书、真实资金、部署UAT均仍SOURCE_GAP。F05整体、C/H01、V1`NOT_READY`，不把局部CI通过升级为生产READY。最新执行状态：`F05_10_D1_A_ACCEPTED_MERGED_PR50 / F05_10_FINAL_INTEGRATION_A_RELEASED_FOR_B / PR49_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。

## 2026-10-13｜F05-10 PR49 A终验35项Source72项PG16真全绿并标准合并；放行F05-11审计不等于F06放行（现行）

- **A唯一正式终审与标准合并**：PR49 B最终受验HEAD `d1f721bd1d332f14241960562b631145af250265`，26项全CI-only白名单，无改前序正式签版或D1，A核10条真正event=push同SHA成功、H52原生52/52、全部72/72独立非特权PG16 Job成功、原F05-10 Source30/30+新D1同库真实集成5/5、HTTPS7/7，原生八份同末次SHA有效GitHub SHA256 Artifact。真v25 D1 Owner claim/经理指定/service、双PG CAS→同库v26真实Consultation Service create/reuse/两物理Backend和12域count/hash不变、原v25/v26 Ledger/CatalogSeal、注错rollback均真实PASS。A官方PR评论：[A_ACCEPTED](https://github.com/suzhe868-arch/mb/pull/49#issuecomment-6139577391)；GitHub正式标准PR merge校验expected_head_sha成功，**实际merge SHA=`ac1dbda3e6bbd079c3739b3705eb339b275d628c`**，PR49 closed/merged=true。正式终验文档：`07_重建工作区/F05-10_A主控最终独立验收35项Source72项真PG16_PR49标准合并_2026-10-13.md`。**仅CI-only工程验收，不是F05总体/生产READY**。
- **A继续完成本轮主控职责并正式放行完整F05-11包**：`07_重建工作区/F05-11_A主控F05已签全域覆盖核账与F06前置依赖只读安全审计_CI隔离完整施工单_2026-10-13.md`。下一责任B，最新main新分支`feat/f05-11-cross-domain-readiness-audit`，仅允许新增`engineering/f05/integrated-readiness-audit/**`及新增`.github/workflows/f05-11-*.yml`。逐已签F05-1～10+D1源、PDM Final、Current IA/Low-Fi/真实 route/actor 形成双向机器可核覆盖矩阵：`SIGNED_CI_VERIFIED/CI_SYNTHETIC_ONLY/CONTRACT_ONLY/SOURCE_GAP/NOT_RUN/BLOCKED`；三组当前真实PG跨域安全负例、两个独立PG物理后端、旧Catalog/ledger不变、F06只读Lock/Waitlist/Transaction依赖，不执行LockRequest业务、Deposit/Refund资金或任何生产Issuer。最后新B HEAD要求11真Push同SHA**≥74/74独立非特权PG16 Job成功**（旧72+新2，H52真52）、≥10份本SHA原生有效Artifact，新Source≥20及HTTPS≥7真实断言/中文证据与缺口报告，先交A独立验收，B不得自行合并。
- **当前唯一指针**：`F05_10_A_ACCEPTED_MERGED_PR49_CI_ONLY / F05_11_A_RELEASED_FOR_B / NEXT_OWNER=B / F05_GLOBAL_NOT_READY / V1_NOT_READY`。已合并前序F05-1～10并不能证明现实客户身份/手机、正式PDM17公海Issuer、C/H01/H02/H03、真实JYT图片电话/飞书/资金/部署/UAT完整可用。**F06正式研发尚未放行**，更不能触发真实锁车意向金或退款；所有`SOURCE_GAP/NOT_RUN`必须如实存在，未经新的产品裁决不补新业务权益。

## 2026-10-13｜F05-11 A首轮74/74独立PG16全绿但Priority服务拒绝/双PG失权COMMIT/F06行级保护缺证退B（现行）

- **A正式独立已核实实绩**：PR [#51](https://github.com/suzhe868-arch/mb/pull/51)受验B最后HEAD `8aaf2fa4c7d52020903fa63d9ff2625a95a1f0d3`，21项均仅新增F05-11 CI-only白名单，官方11条真正同SHA Push全部completed/success、**74/74独立非超级用户PostgreSQL16 Job成功，H52官方完整52/52**、新Source25/25与HTTPS8/8。A通过GitHub Artifact API亲核新F05-11两、F05-8四、F05-9两、F05-10两至少10份最终SHA真原生Artifact均非空、未过期、具官方SHA256；机器21模块、32动作、12真实Issuer/UI/资金缺口、签名v26 Ledger/Public Catalog seal与跨域count+hash不变均保留正确。ECR限流已同SHA官方rerun失败Job闭环。
- **正式裁决三项缺证（不等于已证明生产漏洞）**：**R01** 新S16只造真实现行v24其他Customer Priority而用SQL count判排斥，`otherGrant>=0`永真，缺真正现行Service对普通share/Grant业务拒绝及Priority结束恢复；**R02** 新S21两个物理PG连接仅read-only并查询Owner总数，没有第二Backend真实scope/permission revoke或Customer disable COMMIT后旧Employee动作与敏感读fail-closed；**R03** 新S20仅验证`to_regclass('locks/waitlists/transactions')`，不是基于已签真Lock/Waitlist/Transaction行状态与F05 current Owner/Priority/Consultation联动的只读保护审计。这三项是现行A已签F05-11完整施工单原生合同，74/74通用Job绿灯无法替代业务漏场景验证。
- **完整A首轮整改单已提交main**：`07_重建工作区/F05-11_A主控首轮独立验收74项PG16全绿但三组跨域源事实与竞态缺证定向整改单_2026-10-13.md`；PR51正式A审查评论https://github.com/suzhe868-arch/mb/pull/51#issuecomment-6141273454。**PR51保持open/unmerged**，B继续原`feat/f05-11-cross-domain-readiness-audit`仅此批新增CI白名单一次补R01-R03，保留旧72、新Source25/HTTPS8及机器台账所有通过事实；新唯一B HEAD重新**11真Push≥74/74 PG16 Job全部success、至少10份该SHA有效官方Artifact**和真实双PG/业务状态正反例中文证据，`READY_FOR_A_SECOND_INDEPENDENT_REVIEW`交A，无需用户逐项批准、不允许B合并。
- **当前唯一项目责任**：`F05_11_A_FIRST_REVIEW_CHANGES_REQUESTED / NEXT_OWNER=B / F05_GLOBAL_NOT_READY / F06_NOT_RELEASED / V1_NOT_READY`。F06真实锁车申请/后补、Deposit/Refund、微信手机号、JYT电话图片、4S经营、飞书、生产、UAT仍按真实来源缺口保护，不把F05-11 CI扫描或Schema存在升级为完成。

## 2026-10-13｜F05-11 A二轮74/74真PG16全绿R01～R03业务闭环，R04整改后原DB全域审计封印缺证退B（现行）

- **A亲自独立二轮受验PR51唯一HEAD**：`a709023708314452fc9e8769f27b6bee3f723853`；23项全新F05-11 CI-only白名单。官方11真Push同SHA均success、完整H52官方52/52、总74/74非特权独立PG16 Job全success；本批Source **29/29**、HTTPS**8/8**。A取原生Source Job`115213259612`、HTTPS Job`115213259489`及GitHub官方至少10份该HEAD非空未到期带SHA256 Artifact，均亲自核过，而非只依据B自验；前序冻结70+F05-10两项继续可认。
- **首轮三项定向业务阻断已独立解除**：R01真实v25 F05-9 Service产生Recommendation-linked现时Grant，真正v24他客Priority压制F05-9投影及v26 F05-10 Consultation普通分享创建、结束后恢复；R02真双PG PID336/337另一连接COMMIT revoke Permission和Customer disable后旧签Employee敏感投影/动作分别拒绝、失败Event零；R03 PG16真实Lock102、Waitlist32、Transaction64行及活动/终止状态、Customer/Vehicle/ListingCycle/Owner/Consultation交叉读取，并由BEGIN READ ONLY阻断写，业务保护表hash不变。R01～R03皆`A_PASS`且不要因后续隔离整改删除测试。
- **本次唯一新真实阻断R04**：原F05-11完整施工单要求跨Domain只读审计结束后Public + D1 Sidecar原始账`count+full-row-md5`、合法业务场景测试`ROLLBACK`或严格独立库。现`compat-f05-10.sh`先执行旧Source25的`S24 F05_11_CROSS_DOMAIN_UNCHANGED`，**之后**才追加执行整改Source4；`pre-v26-grant.mjs`提前同库真正UPDATE Vehicle hidden/Service Recommendation Grant/直接Priority ended；整改R01/R01G直插/结束Priority并签名Service新建Consultation；R02真COMMIT员工Permission deny再allow/Customer disabled再active，依签名PDM15触发的Customer Hold/历史可能保留。新证据`evidence.mjs`只核catalog/ledger/D1 Attestation而不核这些真实写入后的Customer/Employee权限/Owner/Priority/Grant/Consultation/Events/Lock/Transaction/Audit全行哈希，`f06DependencyReadOnly:true`不足以替代事实。**此为可销毁PG16 CI测试隔离完整性风险，非生产数据被改，更不等于已证实生产漏洞。**
- **正式A全中文R04整改单已落main**：`07_重建工作区/F05-11_A主控二轮独立验收29项Source74项PG16全绿_R01至R03通过但审计后原生数据回滚不变性缺证整改单_2026-10-13.md`；[PR51 A二轮审查裁决评论](https://github.com/suzhe868-arch/mb/pull/51#issuecomment-6142625763)。B原`feat/f05-11-cross-domain-readiness-audit`/PR51仅本批新CI-only文件整改：带COMMIT的签名业务正反例单独可销毁PG16情境库，另独立完全干净已签PG16核账库最后测真正全业务表/sidecar初末count+md5及Ledger/Catalog seal，**不可用手工UPDATE掩盖回滚；不可删除R01-R03真实Service/双PG/只读F06行级实证**。下轮唯一新B HEAD重跑11真Push同SHA74/74成功（H52真52）及≥10份新SHA有效Artifact，形成真实`F05_11_POST_REMEDIATION_TRUE_GLOBAL_READONLY_SEAL_PASS`与中文`READY_FOR_A_THIRD_INDEPENDENT_REVIEW`交A。PR51继续open/unmerged。
- **全局状态仍**：`F05_11_A_SECOND_REVIEW_CHANGES_REQUESTED_R04 / NEXT_OWNER=B / F05_GLOBAL_NOT_READY / F06_NOT_RELEASED / V1_NOT_READY`。C/H01、真实微信/手机号、4S/JYT图片电话、资金/Deposit/Refund、飞书、生产部署/UAT仍SourceGap/NotRun，F06不放行；一般工程测试完整性整改不需用户新裁决。

## 2026-10-13｜F05-11第三轮R04两独立PG数据库与151表原生全行Seal A终验PR51标准合并；F06-1仅CI-only正式放行B（现行）

- **A第三轮独立签A_ACCEPTED的唯一B代码**：PR51 B最后SHA `a342e05e501d52b1d14008558546a3548041fb38`；25项全部仅新增F05-11 CI白名单，官方11条真正同HEAD event=push均success，74/74独立非特权PG16 Job均success（H52 52/52），新Source原25+R01～R03/R01G四项及新审计库单独R03重复验证全部通过，HTTPS8/8，至少10份同SHA非空未过期官方SHA256真原生Artifact均A亲核。R01 v25 Grant/现行Priority业务Service真实拒绝释放；R02双PG已提交撤权/Customer disable后旧签Employee Token拒绝；R03真Lock102/Waitlist32/Transaction64行状态只读保护均PASS。二轮唯一R04在第三轮真实修复：隔离合成业务情境数据库PG OID16385运行合法业务COMMIT及副作用后**物理DROP**，用整改前签名v25原生快照恢复物理不同PG OID21998，真实新库完整重建D1 Sidecar→v26；此后仅只读审计，**151张public+D1实际表全行count/MD5在审计初末一致**，Public Catalog/24条Signed Ledger/D1 Attestation SHA一致。正式全域Seal`F05_11_POST_REMEDIATION_TRUE_GLOBAL_READONLY_SEAL_PASS`由真正比较器算得（`32516be3965401ab23012377a24c2b7fc1f72243e7f6c948c82c0eac0a013e0e`），不是简单echo。R01～R04均闭合。
- **A已在PR正式验收签署并真实标准合并**：A独立签字评论 https://github.com/suzhe868-arch/mb/pull/51#issuecomment-6143519010 ；GitHub `merge` with `expected_head_sha=a342e05e501d52b1d14008558546a3548041fb38` 实际回复**`merged=true`，PR51真正merge SHA`e11e93bae1f6bc74757fea98b3c079d9ecf01e7a`**。A最终验收归档`07_重建工作区/F05-11_A主控第三轮独立验收R04双物理库151表封印74项真PG16_PR51标准合并正式报告_2026-10-13.md`。后续A正式状态文件主线提交不改变PR合并SHA。
- **A下一唯一安全工作包已正式完整下发B**：`07_重建工作区/F06-1_A主控PDM18锁车申请6小时审批唯一Lock与竞争自动候补_CI隔离正式完整施工单_2026-10-13.md`。只允许新分支`feat/f06-1-lockrequest-approval-waitlist-ci`，从开工时**最新main**建PR；只新增`engineering/f06/lockrequest-approval-waitlist-ci/**`与新增`.github/workflows/f06-1-*.yml`，只在隔离非特权可销毁PG16真实测试已签PDM18 LockRequest 6h PENDING/合法Employee审批、唯一active Lock赢家/72h创建快照与其余合格竞争申请LOCK_CONFLICT原子自动Waitlist、实际当前Owner/Permission/Scope、two PG Backend竞态/撤权与签名v26旧账保全。B末次新SHA官方须**12条真正同SHA Push，至少76/76独立PG16 Jobs成功（旧74+新2、H52真52），至少12份该末次HEAD有效原生SHA256 Artifact**，真实Source≥20、HTTPS≥7；完整中文B自验交A，不得B自行merge。
- **严格区别CI包放行与真实F06/资金**：本次只`F06_1_A_RELEASED_FOR_B_CI_ONLY`，未放行F06-2正式Lock延期/到期或F06-3 Deposit/Transaction/Refund真实资金及它们的生产调用；微信/手机号/4S/JYT电话图片/飞书/高保真/线上Lock/生产UAT依旧SOURCE_GAP/NOT_RUN。**F05整体、C/H01、F06整体和V1仍NOT_READY**。现行唯一`NEXT_OWNER=B / NEXT_TASK=F06_1_LOCKREQUEST_6H_APPROVAL_UNIQUE_LOCK_AND_AUTO_WAITLIST_CI_ONLY`；不得凭F05-11 CI验收或M94表存在自动宣告上线。

## 2026-10-13｜F06-1 A首轮76项真PG16全绿但Priority本人转Lock未原子结束与Priority-origin独占可见缺证退B（现行）

- **独立工程实际已通过事实**：PR [#52](https://github.com/suzhe868-arch/mb/pull/52)受验B最后HEAD`0d6a94dc6e81b5096ffa54e6d19fc0b43f8cd2d0`，25项均added在本批F06-1 CI-only白名单，没有修改F02/F03/F04/F05/D1/旧migration或PDM。GitHub官方**12条Push Workflow全同SHA completed/success，逐条真实Jobs合计76/76非超级用户PostgreSQL16成功（H52 52/52）**；新Source 40/40、HTTPS9/9，A亲核12份最后HEAD有效原生Artifact均非空、未过期、官方sha256 digest。真PG请求6h、签Employee permission+scope审批、72h时长/数值或咨询价快照、不同Actor/Responsible、物理两个Backend撤权COMMIT后旧Token拒绝、两个Backend竞态唯一Lock赢家且两他客自动真实Waitlist、PG错注Rollback均通过。测试业务场景库OID21998物理销毁、新审计PG OID26495真151张public+D1表全行count/MD5及v26 Catalog/24 Ledger/D1 seal不漂移。原全绿验收成果全保留。
- **A已发现R01业务硬事实缺口**：现行权威`07_重建工作区/PDM-18_最终完整规则.md`**§27**明确“正式Lock成立，当前active Priority ended，本人Lock记录`converted_to_lock`，结束不恢复旧Priority”。新`engineering/f06/lockrequest-approval-waitlist-ci/service.mjs`的`priority()`只查v24 Priority并在`lock_snapshots.priority_origin_customer_id`记来源，整个`decisionCI`创建`public.locks`、审批`public.lock_requests`、处理竞争`public.waitlists`期间**从未UPDATE签名`public.f05_8_priority_ci`到ended或记合法Priority历史事件**。Origin字段不是Priority状态转换。必须与Lock成功在同一PG16事务实际结束Priority，错误整体回滚，旧签F05-8本体不可改。
- **A已发现R02客户域权限缺口**：PDM18 Final **§28**明确普通VIP/粉丝Lock不隐藏原可见Vehicle，Priority-origin Lock虽结束原Priority但Lock活跃期间对其他普通Customer保留排他列表/详情可见权。新F06-1 CI服务/测试只存Origin ID，**无signed真实Priority→Lock后受限Customer Projection读拒/允许及普通Lock对照PG正反例**。B必须在本批新增CI-only路径真实来源承载下加入合法客户受限Projection，保留生产微信与其他Issuer`SOURCE_GAP`并按原真实F05 signed facts计算，不宣布线上已实现。
- **完整A正式整改已在main、PR52评论已发**：`07_重建工作区/F06-1_A主控首轮独立验收76项真PG16全绿但Priority转Lock未原子结束且独占可见无实证定向整改单_2026-10-13.md`、https://github.com/suzhe868-arch/mb/pull/52#issuecomment-6145393454。**PR52必须保持open/unmerged**。B继续原`feat/f06-1-lockrequest-approval-waitlist-ci`，仅新F06-1白名单补两项PDM18签名业务真PG测试，保留原Source40/HTTPS9、旧74、151表后置seal，唯一新末次SHA重新12个真Push≥76/76 Job成功、H52 52/52、≥12份新SHA有效官方sha256 Artifact，完整中文`READY_FOR_A_SECOND_INDEPENDENT_REVIEW`交A；B不自merge。
- **唯一现行状态**：`F06_1_A_FIRST_REVIEW_CHANGES_REQUESTED_R01_R02 / NEXT_OWNER=B / F06_GLOBAL_NOT_READY / F05_GLOBAL_NOT_READY / V1_NOT_READY`。F06-2/3、真实线上Lock/微信手机号、JYT/4S来源、资金/Deposit/Refund/Transaction、真实UAT/部署与C/H01都没有放行。本裁决属于工程技术完善，不需用户重新选择已冻结PDM业务。
