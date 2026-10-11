# F05-6｜A主控正式完整施工单：PDM-11找车Application与Demand独立生命周期、等级找车资格与Owner可信门禁（CI-only）

> **正式授权状态：`F05_6_A_RELEASED_FOR_B / NEXT_OWNER=B / CI_ONLY / V1_NOT_READY`**（2026-10-12）。本批只有本文件与main正式状态构成B当前授权。B从执行时GitHub最新main建立`feat/f05-6-find-car-application-demand-eligibility`，按完整授权一次性施工、CI、整改、交接；A独立验收并负责标准PR合并。不得在本批未验收时自行进入F05-7、F06或生产。

## 一、权威依据与目标

- 一级产品Authority：`07_重建工作区/PDM-11_最终完整规则.md`，特别§§1–11、14–21（找车Application≠Demand、手机门槛、Current Owner、等级可配找车权益、人工激活、状态/时间/工作台、公海保护与价格权益独立）；联动`PDM-01/02/10/12/14/16/17/20/21/22/25_最终完整规则.md`。工程路标：`07_重建工作区/B工程完整施工路线图_F01至F08.md`，继承F02/M94、F03身份/Customer Owner与Demand负责人交接、F04安全路由、F05-4价格独立权益、F05-5 CI-only v21真实Employee加次测试及62个冻结作业。
- 本批目标是**首次建立可信Application→Demand起点的最小物理事实/权益门禁/状态保护与受信来源差异**，不是一次完成整个F05找车匹配/推荐/Priority/CRM；不得把当前CI身份/权限当真实线上微信/手机号、不得将旧代码或客户自报身份恢复成生产可信Issuer。
- 三类必须彼此独立：① 客户只表达找车要求的Find-car Application（pending/activated/closed），② 员工授权后建立正式持续Demand（active/paused/completed/cancelled），③ Matching Result/Recommendation/Priority是后续单独Authority。本包严禁提交Application后直接创建Demand或触发Matching/推荐/锁车/交易。客户等级价格额度与找车资格是两套独立配置，不得复用price_mode或LIMITED来决定find-car entitlement。

## 二、F05-6A｜真实物理关系与Issuer事前审计

1. 首先读取main的PDM-11 Final与现行F02签名迁移物理事实：`find_car_applications`实际表名/字段、`demands`、`customers`、`customer_levels`、owner assignments/history、`employee_team_memberships`、`permissions/role templates/overrides`、`demand_responsible_handover_receipts`、现有phone authorization/verification，以及F03真实Employee Session/权限合同。**不允许凭本施工单假定表名、字段、授权Issuer已存在**；逐个列“物理源→字段→签名版本→可原生证明→SOURCE_GAP/生产状态”矩阵，引用真实PG catalog/SHA和原F03来源。
2. Customer微信session→受信Customer ID、服务手机号合法授权、真正可用Customer等级find-car entitlement配置、active+eligible+accepting销售池、Customer合法current owner及分享转介绍解析链、Employee有权人工激活独立permission/current data scope逐环判断。**缺任一必须报具体SOURCE_GAP并生产fail-closed**。不得以请求体`customerId,hasPhone,isFan,hasEntitlement,ownerId,isManager,canActivate`等声称成受信事实。V1无客户级独立find-car entitlement override，不能新造单客户override绕开Level。
3. 实证输出`F05-6_ApplicationDemand可信Issuer与物理关系矩阵.tsv`、`PDM11状态机_权限_Origin_Owner_下游保护矩阵.md`、`SOURCE_GAP与生产入口阻断记录.md`。可用全新仅CI合成fixture验证真实已签结构和确定性状态机，但要显式记录`CI_SYNTHETIC_CUSTOMER_ACTOR_NOT_PRODUCTION`、`CI_SYNTHETIC_PHONE_GATE_NOT_PRODUCTION`、`CI_SYNTHETIC_FIND_CAR_ENTITLEMENT_NOT_PRODUCTION`等来源差异；无可签原生事实则**只作安全拒绝与原生来源审计**，不伪造“线上已实现”。

## 三、F05-6B｜限定CI正向/生产始终拒绝的业务状态机

1. **申请创建**：只有可归属的Customer、真实生效的手机号人工服务门槛和合法Customer current owner才能创建**pending Application**；如无Owner按PDM-11顺序当前Owner→合法分享/转介绍→合格接客池，若任一来源不签且没有合格接客人则不创建`responsible=null`，不发通知、不造员工任务，而只记录pending分配异常。申请最低必填“想找什么车”，预算等可选；拒绝手机号→零Application/零通知/零Demand；未授权时不造服务端“未授权草稿”。
2. **Pending与普通客户**：普通/未有找车权益Customer在**满足手机号+Owner前置条件时可提交pending Application**，但**不能激活Demand**，也不启动Matching；粉丝/VIP不自动激活，必须查**当前等级配置**的find-car entitlement，不能用等级名称、价格无限查看或历史权益猜测。pending可以同对象编辑与撤回/关闭，重复创建/编辑幂等、任务不重复；pending属于公海保护事实，Owner失效须正式接管/待处理，不能自动丢到公海。
3. **唯一人工激活**：只有合法现时Employee Session、明确独立`demand.activate`或已签等价真实业务permission、当前Customer active、Application pending/owner+phone门禁、当前等级找车权益 ON、员工真实data scope与合法Customer/申请归属，才在**一原生PG事务**将pending激活一次并创建唯一Demand；先写真实Demand历史`created_at`不可变、`demand_responsible_sales_id`有权且非空，Application状态activated/唯一demand_id与不可变actor事件一致；并发两个真实PG backend/同request_key重试仅有一个Demand和一条激活审计，不得成功返回第二个。没有正式Employee许可Issuer时限定CI fixture正向，真实HTTP全403。
4. **独立状态与3A守卫**：Customer等级从find-car ON→OFF、账号停用、Owner/Employee停用、业务权限撤销时，active Demand应有**受信原因控制**进入paused或必须保守阻断新activate/resume；不能自动delete/complete/cancel。等级恢复/账户恢复**不自动activate pending或resume paused**。already completed/cancelled终态不可原地恢复，历史、`created_at`、负责人固定审计保留。Customer Owner变化不自动漂移`demand_responsible_sales_id`；多Demand合法，不恢复“一客户只一Demand”。不得把Customer主动“结束找车”直接转换completed：只能发唯一pending结束请求，由员工按事实决断。此后续生命周期如现阶段缺完整Issuer，可产出准确阻断+分批依赖报告，不强行扩大本包至整套CRM。
5. **下游隔离**：Application pending绝非Matching-ready Demand；`Demand=active`也不直接等于PDM-12 matching-ready。新CI服务不得自动创建Rule、Match Result、Recommendation、Priority、vehicle visibility grant、Lock/Transaction、客户等级加次/价格扣额，不能读取或泄漏JYT真实批发电话、VIN、内部价格、Customer敏感手机号。保持原有F05-4/5当日价额度、旧Favorites/同周期关系、F03 Owner独立权限完全不受影响。
6. 如果原物理`Application/Demand`签名约束无法支撑独立幂等不可变关联，可**只在本批一次性测试库的全新专属目录**加CI-only新版本`000022`迁移与合成Origin/事件最小表，必须先校验**M94+正式签名v15～v21全19条**、catalog SHA与原序列无更改，旧Migration历史不可重写，附测试库rollback injected/不同PG backend/唯一性证据；不部署真正生产迁移或改已有Production接口。任何情况不得新建平行的通用Owner、双套Matching/客户等级正式表。

## 四、F05-6C｜原生CI安全测试与证据范围

- **Source**：真实PG16非superuser、F03 Employee Session与真实现有signed schema，附经明确声明来源的CI fixture。测试真实手机号缺签安全拒绝、Customer owner不存在/接客池为空、普通可申请但不能激活、权益ON也不能自动激活、权益配置ON/OFF与price_mode独立、pending→activated仅员工同事务唯一、pending closed不可再激活、两个不同PG backend同request_key竞争/真正`55P03`或等价行锁并发、Customer停用/entitlement downgrade与正在激活事务竞争、Scope/permission撤销与提交竞态、活跃Demand负责人不自动随Customer owner改变、created_at不可变、终态不复活、公海保护、事件/审计真实PG行、没有匹配推荐/资金/价格副作用。某一受信来源缺失时以明确`SOURCE_GAP`拒绝代替虚假正例。
- **HTTPS**：新增仅隔离CI回环`/__ci__/f05-6/**`，HTTPS Origin/Host/CSRF/cookie/body严格处理；任何真实生产Customer Find-Car提交或Employee人工激活Issuer欠缺时匿名、伪造微信令牌、伪造phone/Owner/Level/Role、跨租户/跨scope、4S/SystemAdmin、重复Cookie、过期会话、重放及跨源必须拒绝；**禁止开放`/api/`生产找车HTTP成功路径**，不得触真实微信/电话/JYT/钱。
- 每个新PG16 Job提供不可变M94→v21（若新增CI v22则含v22）完整迁移版本/catalog SHA、`schema-only.sql`、Source/HTTPS全部原生测试日志`#fail0`、不同PG backend并发SQLSTATE与事件时间戳、全受信矩阵与SOURCE_GAP、真实逐表笔数/哈希、sha256sums、完整中文B工程报告；两份GitHub**原生非空未过期Artifact**，从官方最终SHA Job生成。

## 五、严格代码白名单、旧62作业零修改与64/64门禁

- 指定B分支：`feat/f05-6-find-car-application-demand-eligibility`（从**当前最新main**，含PR44实际合并和A本施工单）。**只能新增**`engineering/f05/find-car-application-demand-eligibility/**`及如下**七个新专属GitHub Workflow**：
  1. `.github/workflows/f05-6-frozen-h52-revalidation.yml`
  2. `.github/workflows/f05-6-frozen-i2-revalidation.yml`
  3. `.github/workflows/f05-6-frozen-j2-revalidation.yml`
  4. `.github/workflows/f05-6-frozen-k2-revalidation.yml`
  5. `.github/workflows/f05-6-frozen-f05-4-2-revalidation.yml`
  6. `.github/workflows/f05-6-frozen-f05-5-2-revalidation.yml`
  7. `.github/workflows/f05-6-find-car-application-demand-eligibility.yml`
- 旧H52/I2/J2/K2/F05-4-2/F05-5-2 **六组共62个Jobs**，新六个对应冻结YAML从正式main已签源workflow的`jobs:\n`至EOF**逐字符全文复制（510382/1969/1981/2012/2015及当时F05-5最新版实际字长）**，只改专属workflow触发头为指定B分支；不得删一条Job、跳过用例或把CI变成静态判断。第七新Workflow恰好**两项**分别Source/HTTPS隔离非特权PG16 Job。
- 七个官方Workflow run必须共同`head_sha==PR_HEAD==B_final_HEAD`，GitHub全部`completed/success`，共**52+2+2+2+2+2+2=64/64真正不同PG16 job无skip**；镜像平台临时限流只能官方同SHA安全重跑并保留起始异常证据。新两Job日志提供原生真实测试/镜像/version/签名账及GitHub原生Source+HTTPS Artifacts，二者从最终head运行且非空未过期。严格禁止改旧Workflow、旧工程/迁移000001～000021、PDM Final/IA/Low-Fi、旧C及生产；若发现旧表结构无法支持，按可信物理约束报告SOURCE_GAP，不能回写旧库假造真实可用服务。
- B完成后在分支提交**全量中文自验与A验收交接**及PR：最终40位SHA、七官方RunID+各Job数、两Artifact ID/字节、source/HTTPS实测、具体合成与真实Issuer区分、双Backend真实SQLSTATE、前后Schema历史SHA、所有未闭环来源缺口与本批白名单合规证据，且状态`READY_FOR_A_REVIEW / NEXT_OWNER=A`。B必须一次性内部审查/完整整改后才交A；不合并main、不自动进入F05-7或F06、不逐小项要求用户批准。
- **始终保持**：F05-5员工加次真实Issuer、微信Customer Session与手机号合法授权、真实客户数字价格、Recommendation免费Issuer、一般批发Vehicle scope、hidden reason重算、图片资产化与资金/电话/JYT等真实SOURCE_GAP；F05/F04生产、C-H01高保真和名邦V1整体`NOT_READY`。
