# F05-2｜B工程完整自验与A独立复验交接

> 日期：2026-10-10（新加坡时间）
> 施工责任：B｜接收复验：A
> 分支：`feat/f05-2-vehicle-stewardship-physical-scope`
> 前置正式main：`26bbb1175d884e2195295b4a496c2eaeb7d3b327`
> 仅隔离PostgreSQL 16 CI；**不是生产部署，不代表F05整体或V1 READY**。
> **最终交审门禁**：以本分支最新HEAD、PR HEAD和成功CI的run.head_sha完全一致，且36/36独立真实非特权PG16、两项新原生Artifact均PASS为必要条件。审核需读取GitHub最终执行证据；禁止仅凭此文件声明成功。

## 一、正式Authority与冻结边界

1. 完整任务源：`07_重建工作区/F05-2_A主控Vehicle当前管理责任可信关系增量迁移与真实权限闭环完整施工单_2026-10-10.md`。
2. PDM-02/04/06/21/22/25 Final；当前IA/Low-Fi；F03角色权限+Team对象范围+HTTPS Session；F05-1 M94 94表/608列/435约束/163索引/2120 catalog。
3. 保留000001～000014、旧34 PG16 jobs、旧F01～F05-1源码、产品Final/IA/Low-Fi、生产`engineering/src/server.mjs`、C分支，不改主线、不触碰真实客户/生产凭据/资金/第三方。
4. G14修正两项原CHECK属于独立不同物理谱系。本批M94旧结构`7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659`，旧F03版本从000002起，000001记录在独立F02登记表；本批迁移校验精确与原生inventory比对，禁止G14未审强行共用。

## 二、新增源码和证据载体

- `000015_vehicle_responsibility.sql`：仅CI用新物理当前主责任/审计表、复合Vehicle+ListingCycle FK、当前关系唯一索引、不可变审计触发器，不创建4S组织层。
- `migration.mjs` + `runner.mjs`：真非特权PG16身份/run封印，旧M94字节一致，SQL/版本校验，rollback故障注入及再入幂等，旧目录原对象不变。
- `service.mjs`：合法发布来源在另一认证事务记入真实PG16审计，随后按源身份/物理Vehicle/ListingCycle/当前角色权限/个人deny/团队scope复验签发；另含撤权、由合法经理/店长发起且接收人有合法数据scope的正式责任交接；真实历史保留与版本/CAS；仅最小detail读取。
- `ci-vehicle-router.mjs`：loopback真实TLS、会话Cookie、禁止前端自报team/merchant/owner/scope、no-store，只可能返回`vehicleId/listingCycleId/sourceKind`三字段。
- `fixtures.mjs`与`tests/physical.test.mjs`/`tests/https.test.mjs`：一次性合成角色权限、合法发布、名邦上传4S合作车、批发/4S缺可信来源硬拒，权限撤销、来源变更、旧cycle、非法出口、并发行锁、主负责人交接、历史不可变。
- `evidence.mjs`：原PG16 full catalog、新目录/差异、schema-only SQL、inventory、原始测试日志及全部文件sha256，GitHub原生Artifacts；不留真实凭据。

## 三、测试与关键安全断言

| 方面 | 期待门禁 |
|---|---|
| 原工程回归 | 保留旧34独立PG16原工作定义，不删除/弱化 |
| 新真实物理PG16 | M94 SHA、旧版本、回滚注入、DDL前后差异、新签发和撤权、不可变历史、PG行锁NOWAIT并发 |
| 新真实HTTPS PG16 | 当前员工正常Session源事实正向最小Vehicle 200，失效/个人deny/错来源/旧周期/伪claim与六非详情出口403 |
| 责任交接 | manager/store_head且同时拥有当前cap+Team scope；接收人当前合法，非经理不得交接，不向自己转，已交接旧版本重试拒 |
| 权限根原则 | created_by、source_type=four_s、4S任意账号、历史owner、Publisher、Priority/VisibilityGrant、System Admin、前端自报数据均不是经营授权事实 |
| 隔离 | 生产server、真实API、真实JYT/资金/账号写入持续禁止 |

## 四、实际CI与审计纪律

- [F05-1 已由A批准的PR30](https://github.com/suzhe868-arch/mb/pull/30)：来源封印和旧34工作完整参考。
- F05-2首个取得36/36成功的历史技术运行：[Actions 38058902135](https://github.com/suzhe868-arch/mb/actions/runs/38058902135)（**旧B SHA，不是最终交审证据**）。后续主动新增独立可信发布源事件和正式经理交接测试，必须以这些变更后**最新提交的CI**重验，不能借旧绿灯判定全部通过。
- 最终本分支 HEAD / PR HEAD / Actions run.head_sha、36个job状态、PG16版本、新增两项原生Artifacts、sha256校验由 A 独立复核；若有1项失败则`NOT_READY_FOR_A_REVIEW`，B继续原分支整改。

## 五、下游与仍未实现

F05-2仅CI-only隔离车辆业务责任证据，不等于真实批发/JYT合作责任源、正式4S代表经营链、生产Vehicle接口、原始价格与电话敏感字段、全量列表/导出、F06/F07/资金、C/H01高保真已完成。无完整权限来源一律403。F05-3、F04、H03继承未完成部分，经A另行正式放行后执行；本分支**不自行合并main**。

## 六、交接约定

最终状态标志只能由**最新同SHA真实CI36/36完全通过、两项新Artifact可用、且文件范围白名单确认后**报告：
`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。
以上任一条件未满足即`B_IN_PROGRESS`，不能宣称已验收或已上线。
