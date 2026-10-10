# F05-2｜B 依 A 首轮整改单四项闭环整改与二轮交审证据

> 2026-10-11 Asia/Singapore；原 PR #31 持续使用 `feat/f05-2-vehicle-stewardship-physical-scope`。本页为 B 重新交审依据，不是 A 已签收记录。
> A 首轮结论：`A_CHANGES_REQUESTED / PR31_NOT_MERGED / NEXT_OWNER=B`。
> 最新 CI 门槛：**最后提交 SHA = PR HEAD = Actions run.head_sha，且 36/36 真 PG16 jobs success、两项新 Artifacts 存在、原34 job正文冻结**；未满足前 `B_IN_PROGRESS`。

## 一、正式整改单闭环

依据 `07_重建工作区/F05-2_A主控首次独立复验权限交接与并发闭环完整整改单_2026-10-11.md`，不得使用 2026-10-10 旧绿灯 Actions 38059665296 取代整改回归。

| A 阻断 | 失效复现与最小修复 | 新真实数据库负例 |
|---|---|---|
| A-F05-2-01 交接后旧销售可读 | Employee.sales 必须等于当前 `responsible_employee_id`；Manager/店长必须单独拥有实时 `vehicle.read` + `vehicle.manage` + Team/Object 范围，角色不自动授权。 | R-A10 / R-B07：old sales 同Team403；new sales200；有证manager200/权限deny403 |
| A-F05-2-02 复职后旧责任自动复活 | 仅新增隔离PG16的 F05-2 DDL 中，受控员工身份、Team、scope、override、capability、Role、Store、Vehicle 来源与 Cycle 更新挂**治理失效触发器**；同治理事务把旧当前责任永久 `revoked_at` 关闭并写不可变审计。复职、重授权不能清空旧撤销事实。 | R-A05/A06/A07、R-B08/B10：失活→激活、scope终止→恢复、调店→回店、source变更→恢复仍403 |
| A-F05-2-03 旧车可事后补造发布来源 | 原独立 `recordTrustedManualPublicationEvent` 与 `issueFromTrustedManualPublication` **始终拒绝**。改为仅 CI 隔离的 `publishAndIssueFromCurrentTransaction`：当前Session+车辆管理cap+团队范围校验之后，在**同一个SQL事务**创建此前不存在的人工车辆、ListingCycle、责任唯一索引记录、真实发布 `audit_events` 和不可变责任审计。旧车绝不能补办，无 JYT/无 4S组织伪关系。 | R-A02/A03/A04/A13、R-B01/B02/B03：旧 uploader/老时间戳/异身份重签一律403，合法新车同事务最小200，同事件并行唯一 |
| A-F05-2-04 权限撤销读写竞态 | `withSession` 中为真实 Employee 使用同事务 advisory ownership 锁，独立 PG16 失效触发器持相同锁并更新当前责任行；读取锁 Vehicle/Cycle + 责任行至会话COMMIT，交接同锁校验接收人。任何治理COMMIT与读COMMIT形成可确定的先后顺序。 | R-A11/A12/A14：另一个非特权PG16连接尝试权限deny/source_type更新/接收人失权，以 `lock_timeout` 确定真实锁冲突；读/交接COMMIT后治理提交即403。无sleep/模拟权限 |

## 二、白名单、原始来源和权威状态

旧正式 M94 结构SHA = `7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659`；仅在现有 F05-2 新迁移`000015_vehicle_responsibility.sql`添加独立触发器与事务守卫，无修改 000001～000014 的文件内容。审计触发器是追加目录对象，不覆盖任何旧物理对象的结构定义。生成的真实新目录 SHA 随迁移更改，应从**新原生 Artifact**核查，不得复用旧F05-2物理SHA。

所有变更仅在 `engineering/f05/vehicle-stewardship-physical-scope/**` 与本批专属工作流 `.github/workflows/f05-2-vehicle-stewardship-physical-scope.yml`；仍只运行非特权一次性PG16 test库，绝不连接生产server、生产DDL、JYT、真实账号、资金或C设计。旧34个CI job全文保持不变，新两项为迁移与TLS安全，合计36项。

## 三、复验必要证据

- R-A01～A16：独立真实PG16物理测试，含16项现时对象责任、治理撤销、并发和事务COMMIT断言。
- R-B01～B11：实际loopback TLS+真实Session+真PG16读写，含11项反例与最小合法 200。
- `runner.mjs --inject-rollback/--apply/--verify`：原生结构/版本检查、隔离守卫、DDL注入回滚、非特权用户。
- `evidence.mjs --record`：原始/新增 schema catalog、原生 PG16 schema-only SQL、变更diff、来源链、sha256、真正测试控制台输出。
- GitHub 原生两项专属 Artifacts: `f05-2-vehicle-responsibility-migration-independent-real-PG16-evidence` 与 `f05-2-vehicle-https-current-scope-independent-real-PG16-evidence`。

## 四、状态和交接

工程审查必须同时验证最终同 SHA 36/36 成功、真实PG16日志、受信正式发布正向200、全部复现负例403、独立原生证据与最终 PR Head；否则本轮状态维持 `B_IN_PROGRESS`，由B原分支整改，不交A。仅全部确认后可将 PR31 交 A 二轮独立验收，B不得自行合并 main。

F05完整业务、F04生产接口、F06/F07、C/H01高保真和V1产品基线均 `NOT_READY`，不可用本次CI替代上线批准。

---

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
