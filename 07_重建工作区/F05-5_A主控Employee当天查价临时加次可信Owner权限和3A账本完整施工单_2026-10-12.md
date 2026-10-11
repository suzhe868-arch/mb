# F05-5｜A主控完整施工单：Employee客户当天查价临时加次可信Owner、独立权限及UTC+8 3A日账（CI-only）

> 2026-10-12｜`F05_5_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B / CI_ONLY / V1_NOT_READY`。**一次完成本正式任务包所有范围内工程施工、整改、真实CI、证据及交A验收，不逐子项请用户批准。**

## 一、目标、单批责任与权威

- 从最新main创建B指定分支 `feat/f05-5-employee-price-quota-adjustment`，B负责本次技术实现/测试/真实CI/完整中文交接，A独立审核、产品技术裁决、PR标准合并与主线维护。不得用当前启动词SHA覆盖最新main。
- 权威首先为`07_重建工作区/PDM-10_最终完整规则.md` **§7～§11.1**（尤其§11普通销售current owner+专属permission、经理/店长data scope+permission、4S硬拒、System Admin只配置不执行、UTC+8同日可多次加次、客户免费、UNLIMITED下禁止新增加次，3A切换保留旧追加、next-day失效），并结合PDM-01 Customer停用恢复、PDM-02 Employee能力/个人deny/Scope、PDM-04 ListingCycle、PDM-20 客户价格、PDM-25审计历史；现行F02真实M94物理`customers/customer_day_quota_ledger/customer_quota_adjustments`、F03登录治理与实时权限、F04 Current action合同、F05-2当前负责人可信交接、F05-4 v20 CI-only合成价格日账与来源缺口、全旧60 PG16测试。
- **本包主要目标是补齐F05-4明确未证明的`F05_4_EMPLOYEE_QUOTA_ADDITION_CURRENT_SCOPE_SOURCE_GAP`。** 优先核出、绑定**真实已签**现时Customer owner/Team、employee role/default+明确allow/deny、数据范围、动作独立Permission、account/object状态及权限变更并发来源。任何一环未证明，保守拒绝并标真实来源缺口，禁止用`isManager`、`ownerId`、`permission=true`等HTTP自报冒充Issuer。

## 二、工程施工范围（完整、可执行、fail-closed）

### F05-5A｜真实物理Issuer与最小权限合同

1. 全新、每Job独立、仅非superuser一次性PostgreSQL16，使用所有旧签真实M94迁移至v19；仅为隔离合成数据及确实需要本批原子签发事实时加载F05-4旧CI-only v20（绝不称生产迁移已部署），严格验证历史封印。阅读`customer_quota_adjustments`、`customer_day_quota_ledger`、`customers.current_owner_employee_id`、`customer_assignment_history`等实际存在性和约束，不凭文案猜字段；与Current PDM-10及F03 scope/permission资料逐项建立`actor×role×liveOwner×dataScope×capability×objectStatus×quotaMode×UTC8Day`矩阵，输出原生SQL与可追溯真实来源证据。
2. 如果既有Permission名称/关系、归属与签发Issuer不存在完整可验真的权限链，禁止造“经理可一律增加”“销售本人即可”的合法200，按`F05_5_EMPLOYEE_ADDITION_SOURCE_GAP`或更精确差异逐项报告。允许**在该批完全隔离PG16的新增合成Fixture**测试已签权限关系运行效果，但必须显式区分`CI_SYNTHETIC_ROLE_FIXTURE`与已有真实可用生产Issuer，真实正例不成立不得声称SOURCE_GAP已关闭。
3. 输出`Employee加次可信物理Issuer矩阵.tsv`、`PDM10权限对象状态与Owner时序表.md`、`SOURCE_GAP及实时权限证据.md`与可复用证据脚本。

### F05-5B｜免费当天增加次数的原子合法动作（受控CI-only）

1. 在可签的Actor/capability/Owner/scoped Customer事实都存在时，通过**既有原生F03当前真实Employee Session**调用新**只在CI暴露**的加次服务，提交瞬间重新读取员工current active/role/capability/data scope、顾客账户active及当前owner/等级模式，对普通销售必须现时current owner，经理/店长要相应scope；System Admin/4S和停止授权者拒绝，错误Customer、任意旧负责人、跨团队、撤权/离职/并发变更均不能加次。若受信来源不足，提交口只能安全拒绝，任何CI允许态必须标明synthetic fixture的来源局限。
2. 对每个请求严格正整数、最大授权范围及唯一幂等Key；多笔追加在同一UTC+8自然日累加`temp_additions`，同一请求只加一次，出错/超时/权限冲突不得改账，不能把加次等同于客户付款或价格修改；所有不可变事件与`customer_day_quota_ledger`必须事务一体，使用真实两PG backend并发+权限撤销竞争（不得仅mock concurrency）；已有时效事实、原消费数、Level变为UNLIMITED之前已加的当日次数不能删除，UNLIMITED期间禁止新加，返回LIMITED按`base+temps-consumed`恢复，UTC+8跨日归零且保留审计，Customer暂停不漏加。
3. 如果现行物理schema不能支持具有不变Issuer且幂等的追加事件，且PDM已唯一确定语义，允许仅在新目录中创建**CI-only顺序新迁移000021**和严格新旧catalog SHA、版本Seal、rollback与历史防篡改；不得修改000001～000020旧签迁移或另造真实生产Customer auth。数据库无确定Issuer则不施行无法合法审计的正向DDL，提交不可证限制/差异给A。
4. 不将F05-4的合成数字价和WeChat context包装成正式Customer动作；客户浏览/每天Quota消费保持旧CI流程，新增员工能力不能篡改既有Customer price_unlock_events、推荐免费权或原始价格事实。真实微信/上游JYT/电话/付款/生产均禁止连接。

### F05-5C｜双层真实PG16与HTTPS安全隔离

1. 新Source PG16真实用例覆盖：当前有权Owner/个人allow与deny/当前管理scope/客户active、经理店长合规scope与普通销售非Owner拒绝、4S/SystemAdmin禁止业务加次、等级UNLIMITED拒绝、LIMITED加次幂等并发只一次、同日二次累计、同日3A升降级保护、UTC+8午夜隔离、客户inactive、旧Owner交接与变更竞态、非法参数/重放/事务回滚、幂等Key恶意跨Customer碰撞、只增加今天且客户免费、不变Actor/审计历史、迁移完整性/SQL catalog/真实SQLSTATE。如尚无真实可签Issuer，正例必须明确隔离合成Fixture，不足部分标`BLOCKED_SOURCE_GAP`，不得造系统级权限来源。
2. 新loopback HTTPS仅在`/__ci__/f05-5/**`并严格隔离启用，真F03Employee cookie+CSRF/Origin/Method/CurrentScope边界按已签身份模型；匿名、旧session、客户自报Owner/manager/Store/Role、JYT token、4S/SystemAdmin/历史路径/重复Cookie/跨源/URL编码攻击均拒绝，不得开启生产加次或微信Customer数字价接口。
3. 每个真实新PG16 Job有独立`schema-only.sql`、完整catalog/Seal历史、来源与当前授权矩阵、源与HTTPS原始测试日志、两独立PG backend竞态证据、sha256sums、中文B交接，以及GitHub真实非空未过期Artifacts。对于来源不足的行为，验收为**明确安全阻断**而非功能可用。

## 三、严格工程白名单、60+2同SHA CI与交接

- **只允许新增**`engineering/f05/employee-price-quota-adjustment/**`以及下列**六个新的**本批专属Workflow：`.github/workflows/f05-5-frozen-52-revalidation.yml`、`f05-5-frozen-i2-revalidation.yml`、`f05-5-frozen-j2-revalidation.yml`、`f05-5-frozen-k2-revalidation.yml`、`f05-5-frozen-f05-4-2-revalidation.yml`、`f05-5-employee-price-quota-adjustment.yml`。不得更改现有工程文件、既有v20合成测试、旧签迁移、PDM Final/Current IA/Low-Fi/C及生产。
- 冻结旧H52/I2/J2/K2/F05-4-2 **合计60个作业**，新5份冻结workflows `jobs:\n`至EOF必须从现行正式main原样逐字符复制完整旧正文，仅设置本批分支合法触发header；第六新workflow仅2个本批独立真正非特权PG16 Source+HTTPS Job。最终需六条原生Actions run **同唯一最终B HEAD=PR HEAD=六run.head_sha**，官方`completed/success` **52+2+2+2+2+2=62/62成功，无跳过**，两个新Job原生Artifacts非空有效、日志真实#fail0、全证据SHA256和中文`B全包自验与A复验交接.md`。
- B一次性完成全部授权内任务、代码自审、整改、真PG16回归、证据保全、PR正式中文交接；完成后才`READY_FOR_A_REVIEW/NEXT_OWNER=A`。B不自行合并main、不启动F05-6。对真实业务Issuer/source不能证明者继续保守拒绝，集中报告A技术裁决；不可为了凑62绿灯用fake current role/owner/permission授权生产。F05/F04生产、C-H01、V1保持`NOT_READY`。
