# 名邦汽车 V1｜F04-3｜A定向整改后B全包自审及二轮A复验交接

> 2026-10-10 Asia/Singapore｜只限隔离CI合成技术合同；不表示生产、真实权限或所有业务完成。
>
> 本文件记录A-F04-3-01/02/03全部整改、对应证据与复验门槛。**最终交审状态以GitHub最终分支HEAD、该SHA真实30/30全部success及两份新原生Artifacts同时成立为准；在此之前只能是B_CI_PENDING。**

## 0. 正式依据及已签范围

- **A整改授权**：`07_重建工作区/F04-3_A主控首次独立复核DTO实质合同与主体权限完整定向整改单_2026-10-10.md`；A首次审核评论PR28 #`6096753581`。
- 原A施工单：`07_重建工作区/F04-3_A主控Current新接口注册表DTO与路由安全门禁完整施工单_2026-10-10.md`。
- B分支：`feat/f04-3-current-action-api-registry`；PR [#28](https://github.com/suzhe868-arch/mb/pull/28)保持**open/未合并**；B不改main。
- **唯一变更范围**：`engineering/f04/current-action-api-registry/**` 与专属 `.github/workflows/f04-3-current-action-api-registry.yml`。旧F03/F04-1/F04-2源码、已有28个工作流job的正文、SQL迁移000001～000014、M94/G14物理封印、正式生产server、PDM Final、Current IA/Low-Fi、C视觉资源均保持冻结。

## 1. A-F04-3-01｜修复29条占位DTO，32条Current合同全部可校验

**A旧阻断**：原30中29条只有 `v1:none/unknown-blocked` / `pending-domain-implementation`，OpenAPI只有一个CustomerId schema；恶意字段增删无法被双向机器拒绝。

**本次修复**：
1. 以Current真实业务主体/资源重新定义候选路径，不再仅套旧LEGACY编号`/actions/*`。当前目录**32条**：原23项F04-2同动作已证、6项新增Current、1项已签F04-1最小CustomerId读；另外按PDM-02 §6.2独立补**2项System Admin控制平面员工停用/启用**。均为`CI_ONLY_PROPOSED/NOT_APPROVED/NOT_PRODUCTION`；不宣称原旧URL已被迁移。
2. `dto-contract-lock.json`一一对应32个schema：具体`type`、`required`、`additionalProperties:false`、有限范围`integer/boolean/enum`、请求字段来源/未证标记与确定性400/401/403/404/405/422/501/503错误码响应字段白名单。OpenAPI 3.1新增32项请求+响应schema及组件schema，`source-guard.mjs`比对**源合同↔DTO封印↔OpenAPI operations↔OpenAPI components**，变异注入VIN、电话、`internalWholesalePrice`、额外成功字段、错误码、缺字段/类型均拒绝。
3. 依据真实Final对关键对象做专项校准：正式发布输入目标`draftId`而非凭空已发布`vehicleId`（PDM-06 §4/§6）；新Banner placement仅`HOME_TOP`或`VEHICLE_DETAIL`（PDM-24 §6）；锁车申请查看使用显式`lockRequestId`路径参数与类型、必填封印（PDM-18）。
4. **字段级真实边界**：最小候选字段是业务对象标识/允许状态，不自动形成实际业务提交DTO；`fieldSources`同时保留Final出处/证据状态。缺完整的发布表单字段、真实商户归属、客户认证、业务状态机及资金细节时标为`SOURCE_GAP`或`DEPENDENCY_BLOCKED`；本批router仍拒绝业务Body或返回403/501，不能借格式合规生成生产成功。
5. 原23个已证实是**业务动作级来源匹配**，不是旧HTTP URL获批；旧215候选**23 MATCHED / 192 SOURCE_GAP**、3个禁恢复Collector、218 methods/198 distinct paths/62冒号paths不变，215项全部`UNDECIDED/CONTRACT_ONLY`。

**回归定位**：`tests/a-rectification-contract.test.mjs`新增A-F04-3-01-1/2/3/4，`tests/source-registry.test.mjs`原不变量；验证实际合法正例与恶意遗漏/类型/响应Schema污染负例；新增Source作业在真实独立非特权PG16 M94实例上执行。

## 2. A-F04-3-02｜六项NEW_CURRENT_ACTION真实业务语义封印

**A旧阻断**：PDM/IA文档行存在不等于同一个主体、同动作、同资源和状态。

**本次修复**：
- `current-action-semantic-lock.json`为原6项分别固定：Final PDM文件、真实原行、Current Nav带条件全文、Page全文、actor、resource、target state、PDM domain、真正业务实施Owner/未定Owner；同时为新增的两项System Admin控制面能力固定PDM-02 §6.2的同等来源。
- `source-guard.mjs`在运行期对当前签署仓库真实文档**逐行**复核，亦以独立常量复核各动作语义；任一同文件不同真实引文、别的导航动作、其他resource、Customer/Employee/Control-plane混淆、状态或Domain变更都拒绝。
- Consultation仍PDM-15、实施Owner真实未定则`OWNER_REVIEW_GAP`；LockRequest/Waitlist PDM-18、F06；不按Vehicle URL头部假设F05，也不把“打开审核”当“直接通过”。
- 没有把`NEW_CURRENT_ACTION`当自动获批准生产方法。来源事实与未证运行权限分别表达。

**回归定位**：新测试A-F04-3-02-1/2，对**真实但不相关文档行**、错误身份/Domain/状态和错用控制面进行强拒。

## 3. A-F04-3-03｜Customer、Employee、经理、System Admin与4S分面

**A旧阻断**：32条候选不能一律用PC员工Cookie认证；PDM-02 §6.2明确System Admin有员工账号治理主体，不能被`EMPLOYEE_MANAGER`替代。

**本次修复**：
- Customer动作OpenAPI操作`security:[]`，明确`x-customer-authentication-dependency.status=BLOCKED`、PC Cookie硬拒；独立futureCustomerSession安全方案标`x-runtime-disabled`，绝不接受伪造未来Header/客户端等级布尔值，真实HTTP统一403 `CUSTOMER_AUTH_DEPENDENCY_BLOCKED`。
- Employee与Manager/业务运营配置actor分别声明独立capability、个人deny、当前目标对象及data scope，不以经理职位本身授权；无目标合法事实则403。
- PDM-02 §6.2当前System Admin治理员工账号启用/停用明确拆成**2项控制面候选**，`systemAdminControlSession`与`managerEmployeePcSession`分别声明；真实系统Admin会话不继承员工业务能力，目标员工/商户绑定未证时403 `CONTROL_PLANE_TARGET_UNPROVEN`；无实际修改账号。
- 4S身份不能进入名邦控制平面、Lock/Consultation/完整CRM/内部价业务。F04-1已签正例仍仅对真实PG16 Session+Employee`crm.customer.view`+目标精确object scope的最小CustomerId返回合成200。

**回归定位**：新A-F04-3-03-1/2 Schema负例、真实TLS B12/B13模拟PC盗用Customer、伪future认证头、SystemAdmin与经理权限互换、旧owner撤权和CRM安全出口；无资金和真实账户写入。

## 4. 数据库回归和最后证据封印

- **阶段已成功验证的源码基线**：`102d7cf5d5738b4cd96d2d759099fc12ef353184`，原生[Actions 38047662592](https://github.com/suzhe868-arch/mb/actions/runs/38047662592)：30/30独立真实PostgreSQL16成功；此记录不等于包含最后一轮OpenAPI组件交叉校验和中文交接文本的**最终**SHA通过。
- 原28冻结job不得删除、合并、降级；新Source+DTO及TLS job各独立PG16，原生schema-only、full catalog、inventory、frozen source、sha256sums、测试日志、两新Artifacts均须与最终RUN关联。
- 旧M94 94表、608列、435约束、163索引、2120目录项封印sha `7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659` 与F03 G000014不同物理版本的独立封印必须实际保持，不能用缓存绿灯代替。
- **最终B交审必须由实际GitHub run证明**：最新B branch HEAD=PR28 HEAD=run.head_sha、`completed/success`、30/30独立PG16 job全部成功、41份左右原生Artifacts（以实际计数为准）、新2份非过期源码/结构/测试工件完整。最终跑完后在PR28正式评论里明确run ID、最终SHA、原生new Artifacts ID及真实测试数量；该评论不修改commit，不引发额外CI循环。

## 5. 白名单复审、未实现和交接责任

- 当前F04-3只是**Current合约结构可执行验证及CI-only路由安全基础包**，不证明全业务DTO已足够正式上线。所有32个Current候选仍`NOT_APPROVED / NOT_PRODUCTION`，只有唯一已验收F04-1精确CustomerId合成读返回200；其余缺真实业务身份、目标scope和实现时硬拒`403/501`，无业务写、无实钱/外部调用。
- F04整体、F05 Vehicle/Price、F06 LockRequest/Waitlist/资金、F07 publisher_id/Collector/CDN、4S真实商户管理、H01高保真、H03/H04前端与三端UAT、V1产品总基线均保持`NOT_READY`。
- B不得自行合并PR28或创建下一包施工单；**正式交A二轮独立验收**，A通过后才可标准合并main并签发后续任务。

**本文件落库时状态：B_RECTIFICATION_IMPLEMENTED / FINAL_HEAD_CI_REQUIRED；符合最终同SHA全绿门槛后PR评论声明 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。**
