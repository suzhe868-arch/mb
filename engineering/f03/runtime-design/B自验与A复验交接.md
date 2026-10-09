# F03-2-G0｜B自验与A独立复验交接｜2026-10-09

**状态：B_REMEDIATION_READY_FOR_CI / F03_2_G0_ACCEPTED=NO / F03_2_ACCEPTED=NO / PRODUCT_BASELINE=NOT_READY**。

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

## 4. 已知阻断缺口、风险与A技术裁定事项
1. **SG-01** scope表无`permission_id`，逐capability绑定需后批确定关系与存储；本批演示`capabilityScopeProofs`纯假证据，真实Guard默认拒绝。
2. **SG-02/03** 无现行团队关系表与独立eligible字段；经理team跨对象管理及接客资格不能靠同门店/accepting推定。
3. **SG-04/05** 管理员固有控制面与自定义范围、最后effective Admin（身份+凭证）及正常接客池全体串行锁需A裁定并真实并发验证。
4. **SG-06/07** 批次/单对象handover物理承载和模板/权限提交版本协议尚缺；静态`observedVersion`不允许接客户端输入。
5. **SG-08/09** Vehicle与publisher上游ID的合法链接尚待核实；角色模板独立不可变历史的实际承载需要A复核，不能将已写changed_at冒充历史。
6. **TECH_ALIAS_PENDING_A** 的英文动作名不能假设获批，也不为缺少证据的客户/4S/管理员隐式开启权限。
7. 静态历史/权限投影不意味着F03-3缓存、导出、字段隔离已经完成；敏感数据一经发至客户端不可宣称远端撤回。

## 5. NOT_RUN与A验收边界
真实PG16测试、DB事实加载器、HTTP Guard、生产用户/账号、可信OID/角色与权限种子、事务/锁/回滚、系统管理员最后一人真实禁用、接客池与handover数据迁移、正式业务路由和部署全部NOT_RUN且未授权。此批若通过，A只能签`F03_2_G0_ACCEPTED`，不得签`F03_2_ACCEPTED`；B不得合并main或进入后续批次。
