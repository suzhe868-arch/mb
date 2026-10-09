# F03-2-G0｜B自验与A独立复验交接｜2026-10-09

**状态：B_READY_FOR_A_REVIEW_AFTER_FINAL_SAME_SHA_CI / F03_2_G0_ACCEPTED=NO / F03_2_ACCEPTED=NO / PRODUCT_BASELINE=NOT_READY**。

## A首轮复验后R1～R5整改闭合证据（2026-10-09，等待A签发）

- A审查源：`main/07_重建工作区/F03-2-G0_A主控首轮复验与五项整改清单_2026-10-09.md`；首次拒绝旧版本为`a56cb746ae14a2047be791a204b8b367767c7c9f`。本次只在原分支追加整改，绝无旧工程/main变更。
- B本轮实际整改中间完整代码版本：`ed22072f496f526b04d7d41660302b63b578386f`；[真实静态CI `37880483331`](https://github.com/suzhe868-arch/mb/actions/runs/37880483331)，job `113658801976`，本批已核对所有steps completed/success，原F01 13/13、F03-G0 34/34、F03-1-G0 19/19、本批合成36/36成功；其中包含新增14组A独立整改探针及R1真实SQL反查/错误缺口变异负例。
- **最终交接提交另包含本闭合表和报告，不能拿上述较早代码版的CI替代。A须再次核对最终分支HEAD的同SHA新成功CI（具体运行号由提交后产生的Actions决定）。**
- 独立闭合表：`A首轮R1-R5整改闭合表.tsv`，每条有原阻断、现有证据、正反例、残余风险，状态均`B_FIXED_A_REVIEW_PENDING`，**绝不标为A已签发**。
- R1：已验收SQL `role_default_permission_history` 含7字段；改成现有结构的模板历史原子追加方案，不再建议重复表。
- R2：`template.set`只认当前System Admin，经理/店长的员工治理权益仍单独保留，伪高权限无法跨身份。
- R3：`planned_disable`与正常接客关闭同池保护，操作后仍须≥1合法active+eligible+accepting；4S/System Admin不计数；突然失效仍先撤权。
- R4：4S保持F03-1的个人明确allow PC准入，不通过模板自动扩权，旧会话在deny/revoke后所有PC车辆动作拒绝。
- R5：最小真实治理before/after、当时actor/role/store、模板history与审计同一合成提交边界；新建before可空、撤销after真实null、审计失败事实与历史不残留，敏感秘密不入审计。

**保留风险**：这仍是纯合成模型、静态矩阵和已归档SQL文本校验，未连接任何数据库；未执行真实授权查询、数据库跨事务锁/并发或权限审计写入。结构SG-01～08仍为待A裁定建议，SG-09现有表已确认，产品Authority不变。A最多签发`F03_2_G0_ACCEPTED`，不能签`F03_2_ACCEPTED`。

## 1. 基准、放行与提交
- A正式签发`F03_2_G0_AUTHORIZED / USER_APPROVED / A_RELEASED`；正式放行：`07_重建工作区/F03-2-G0_A主控事实映射与事务方案施工放行_2026-10-09.md`。详细范围遵守F03-2工作单§§4～7。
- 从获批后的最新main `57ab53611ffe213c9917443c83133d527383f792` 新建 `feat/f03-runtime-g0`，不回到旧登录实现分支，不更改main或C。
- **最终交A提交SHA必须读取本报告所在分支HEAD**；每次报告内容变更将触发新提交，必须核查该最新HEAD本身同SHA真实CI成功，不能以前次旧版本PASS冒充。
- 只允许`engineering/f03/runtime-design/**`与`.github/workflows/f03-2-g0-runtime-design.yml`新增；不改F02、F03-G0、F03-1原工程和PDM Final、Current IA/Low-Fi。

## 2. G0-01～G0-12 自验覆盖/验收证据
- `authority-test-coverage.tsv`逐项列明G0-01..12静态模型、测试入口、预期正反例与未来真实测试责任。需要CI实际完成且0失败才能向A签发“B自验通过”。
- `authority-fact-map.tsv`全45条原F03 permission-contract动作反向对照，源自冻结F02 464 INCLUDE，已持久事实列与缺列分开，绝不虚构team、eligible、handover物理关系。
- `capability-scope-contract.tsv`全45条含每cap独立scope、System Admin与4S、既有role/personal优先级、hard DENY和未知别名状态。
- `governance-action-contract.tsv`包含14组治理动作，`transaction-and-revocation.md`设计全体Admin/接客锁协议、撤权与敏感提交重验、计划交接/突发失效、复职及部分成功。模拟并发的结果不得等同真实PG并发事实。
- `schema-gap-and-migration-advice.md`的SG-01..09仅为**拟议结构**；这些新增表、权限别名与技术映射均需A明确裁定、后续独立施工单，不得借本批直接DDL。

## 3. 静态执行记录与同SHA证据
- 命令：`cd engineering && node f03/runtime-design/verify-contract.mjs && node --test f03/runtime-design/tests/*.test.mjs`。
- 独立CI：`.github/workflows/f03-2-g0-runtime-design.yml`，job `f03-2-g0-static-only`；必须按最终分支HEAD的run核查`completed/success`与所有步骤。
- 保留原F01安全静态、F02-G0契约、F03权限合同与F03-1-G0密码方案静态回归。**不执行**F02/F03-1真实PG16、迁移、HTTP/HTTPS或schema导出。
- 正反例已按G0-01～12由`tests/model.test.mjs`和`tests/sensitivity.test.mjs`编制。失败则按实际日志继续修复，不能提前声称PASS。

## 3.1 已完成的独立CI核验证据（报告写入前）

- 代码与测试阶段完整SHA：`127873a444b71af8a52f145a6fc04075605477b7`。
- [静态CI运行 37877243606](https://github.com/suzhe868-arch/mb/actions/runs/37877243606)，`completed/success`，精确`head_sha=127873a444b71af8a52f145a6fc04075605477b7`；job `113648538263`，所有步骤通过。
- F01基础静态/安全打包，既有F02-G0、F03-G0与F03-1-G0静态回归：均通过。
- 本批机械检查：45/45 operation、464/464冻结INCLUDE字段、23/23原F03-G0 policy operation、14组治理合同、12/12门禁记录及无DB/HTTP/环境读取检查：通过。
- 本批纯合成模型与保护敏感性变异用例：**22/22通过，0失败**。包括模板变更、scope失效、旧会话、BIGINT、4S/System Admin边界、经理/店长、本人的接客开关、管理员交叉停用/单例bootstrap、计划交接、突发inactive/复职、审计回滚、部分交接和去除hard DENY/scope/commit重验的检测。
- 前两个中间测试SHA存在静态核验规则不完整、模拟竞态前置权限条件不完整的问题，已经由后续提交定向修复；**不得将失败记录写成成功**。当前成功证据仅来自上面所列代码版。
- **本交接报告落库将产生更新的HEAD**：A必须独立核验更新后的最终HEAD也有`completed/success`的同SHA CI，不能以这节列出的较早代码SHA CI取代完整报告版验收。

## 4. 已知阻断缺口、风险与A技术裁定事项
1. **SG-01** scope表无`permission_id`，逐capability绑定需后批确定关系与存储；本批演示`capabilityScopeProofs`纯假证据，真实Guard默认拒绝。
2. **SG-02/03** 无现行团队关系表与独立eligible字段；经理team跨对象管理及接客资格不能靠同门店/accepting推定。
3. **SG-04/05** 管理员固有控制面与自定义范围、最后effective Admin（身份+凭证）及正常接客池全体串行锁需A裁定并真实并发验证。
4. **SG-06/07** 批次/单对象handover物理承载和模板/权限提交版本协议尚缺；静态`observedVersion`不允许接客户端输入。
5. **SG-08** Vehicle与publisher上游ID的合法链接仍待核实；**SG-09已按已验收SQL闭合**：`role_default_permission_history`及全部七字段真实存在，无需重复表；真实模板治理及历史审计原子性仍待F03-2-2。
6. **TECH_ALIAS_PENDING_A** 的英文动作名不能假设获批，也不为缺少证据的客户/4S/管理员隐式开启权限。
7. 静态历史/权限投影不意味着F03-3缓存、导出、字段隔离已经完成；敏感数据一经发至客户端不可宣称远端撤回。

## 5. NOT_RUN与A验收边界
真实PG16测试、DB事实加载器、HTTP Guard、生产用户/账号、可信OID/角色与权限种子、事务/锁/回滚、系统管理员最后一人真实禁用、接客池与handover数据迁移、正式业务路由和部署全部NOT_RUN且未授权。此批若通过，A只能签`F03_2_G0_ACCEPTED`，不得签`F03_2_ACCEPTED`；B不得合并main或进入后续批次。
