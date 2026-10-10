# F05-1｜B工程全包自验与A独立复验交接

> 范围：只在新分支 feat/f05-1-vehicle-scope-safe-projection、新增engineering/f05/vehicle-scope-safe-projection/**及新F05-1独立workflow；只在非特权一次性M94 PG16与localhost HTTPS执行，**不授权任何生产Vehicle API**。
>
> B最终正式状态须待本文件对应分支HEAD与GitHub Actions原生34/34独立成功后，以PR交接评论中实际不可变SHA和run/job/artifact为准。本报告不提前谎称A已验收，也不自合并main。

## 前置与物理来源

- A正式单：07_重建工作区/F05-1_A主控Vehicle可信归属与最小安全投影完整施工单_2026-10-10.md。起点main SHA b0be8663d3cdf5652d7f372a489ec67a02d415e6。
- 物理冻结归档：engineering/f03/runtime-handover-reconciliation/evidence/pg16_full_catalog.json；M94原94表、608列、435约束、163索引，目录2120项，结构SHA **7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659**。000001～000013签收版本保持不变，G000014为另一不同旧基线独立seal，不得混成M94。
- 本批依据原物理catalog对26张涉及Vehicle/Employee/4S/Quota/Publisher/Images/Priority/Visibility/Scope的表逐字段提取**153行**及来源/数据类型/可空性/隐私出口状态，逐行原归档校验；不少字段存在而**不能自动提供业务授权**。
- 确认vehicles.source_type物理枚举为wholesale/mingbang/four_s，非UI本地文案“名邦/4S”。真实车辆周期vehicle_listing_cycles与vehicle_id可证；当前Vehicle与员工Team/Store/4S合作主体可信业务owner绑定**无已签M94关系和现权出处**。created_by_employee_id、employees.store_id、客户owner、Team Membership、源Publisher、Customer visibility grants、Priority均不可冒充Vehicle当前授权。
- 物理归属状态：**REAL_VEHICLE_SCOPE_PROVEN=0；VEHICLE_SCOPE_SOURCE_GAP_BLOCKED=全部**。不是“0辆车”，而是**无一个业务Vehicle对象具有可独立验收的可信当前归属关系**。禁止创建合成授权表或临时grant以凑200。

## F05-1A：覆盖矩阵/物理验证

- Vehicle真实物理关系与来源证据.tsv：153原生列全部追溯到M94 full catalog列名与类型、敏感字段分类和当前归属不得推断语义。
- Vehicle三来源Actor对象Scope矩阵.tsv：6种主体（Employee/Manager/4S/System Admin/Customer-PC/匿名）×3来源×2种周期×7个业务出口=**252条**；所有未证归属均DENY403，拒绝4S主体伪绑定、店铺/Team/员工上传推定授权。
- Vehicle原始M94封印.json和source-verifier.mjs：原始M94 sha/count、字段、三向总数、真实缺口及反向恶意变异。对“把VIN安全投影”“错column/type”“删M94行”“将旧店归属变成授权”“虚构4S合作对象”等造假都必须使测试FAIL。
- 真PG源码验证测试：tests/physical.test.mjs，冻结seal、真实物理存在、三类车源、敏感字段白名单、伪scope禁止与无Vehicle物理授权正例。

## F05-1B：最小字段白名单与现时Session TLS硬门禁

- 候选白名单：**vehicleId、listingCycleId、sourceKind**；只是数据库安全字段存在性，**不是允许客户或业务员工看到这些值**。
- source-verifier.mjs使用调用者**无法通过JSON或布尔变量伪造**的内部不可发放Scope标记；现阶段没有物理签收的Vehicle归属证明，任何直接构造{trustedCurrentVehicleOwnership:true}均无法获取投影。
- ci-vehicle-router.mjs仅在CI=true+GITHUB_ACTIONS=true+真实非特权隔离PG16/M94 exact-seal+本机HTTPS启动；每次重验F03 PC会话、身份和物理对象现时source/cycle。SystemAdmin不可混Employee；4S成员没有物理合作主体证明不得放行；Customer不可以拿员工PC cookie当客户登录。
- 七类业务出口detail/list/export/copy/cache/print/history：**全部返回403 F05_VEHICLE_SCOPE_UNPROVEN**（没有{fields}；no-store）；未知/Collector路径404、错误方法405、恶意编码URI400、传入owner/team/merchant/VIP/price/phone/query/body均无权限，禁止任何写数据库。
- 只有先前F04-1签收的 **精确CustomerId当前owner对象最小CI只读** 能得到有限的合法合成200，owner漂移立即失效；它不代表Vehicle详情正向验收。F04-1～4全部既签模块和C/H01均不改。
- 真TLS测试：tests/https.test.mjs覆盖员工/4S/SystemAdmin、三来源七出口、历史周期、查询头/body、重复Cookie、无会话、伪Bearer、CRM owner动态撤权、数据计数不改变。

## F05-2可执行前置与不得在F05-1越权补齐的缺口

- Vehicle缺口与后续可信归属建议.md详细提出最小可信Vehicle/ListingCycle+本体+当前Team/Store/4S代表主体关系、迁移/回滚/并发CAS/历史兼容和独立产品source evidence；**本包绝不实施新DDL**，不创建4S组织树。
- F05下游字段Projection合同.md明确F04-4唯一已证UI合成source_type请求与真实物理枚举不同，未来F05-2需实证映射；不得把历史uploader/store/CRM owner/隐藏grant做Vehicle授权。
- F05-1不能宣告F05车辆真实读写、微信客户登录、JYT/飞书外部接口、真实锁车/资金/敏感价和Publisher电话已实现；产品/高保真/总体基线仍NOT_READY。

## 真实CI核验与A交接

- 新.github/workflows/f05-1-vehicle-scope-safe-projection.yml仅替换顶部触发分支，冻结F04-4已有32个独立真实非特权PostgreSQL16作业的正文，一个也不删减或合并；新增A与B各自独立的PostgreSQL16数据库和真实日志导出作业，共**34个**。
- 两新增作业都重新建立M94原封印、运行旧F04-4真实来源/HTTPS回归与本批新测试、各自产生schema-only.sql/full-catalog.json/inventory.json/frozen-source.md/Vehicle source+matrix+lock/sha256sums.txt/true-pg16-tests.log。原生Artifact由GitHub Actions归档，不在B提交中伪造数据库导出。
- 先前版本可能出现的CI失败必须以最终HEAD的全量同SHA重新真实34/34成功为准；无真绿灯一律不得标交审成功。
- 请A最后独立核查：Physical真实缺口未冒充已证scope、TLS拒绝是否包含一切出口与角色、旧32冻结字节、最终HEAD=PR HEAD=Actions run.head_sha、34/34 success、两个新Artifact未过期、无生产/DDL/旧CI/PDM/IA改动。

**最终交审时目标：B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A，PR仍不得由B合并main。**


## 补证｜真实FK/唯一/Check并非业务Vehicle归属

新增Vehicle真实FK唯一状态约束核验.tsv，对上述26张真实表的99条PG16 M94原constraint（FK/PK/UNIQUE/CHECK）按原目录definition完整追溯，包括车辆created_by→Employee仅为上传引用、Employee.store_id→Store和Team.store_id→Store仅证明员工组织、ListingCycle→Vehicle证明周期实体完整性、Priority与visibility_grants证明客户侧权限对象，**均不推出可信现时Vehicle业务owner/team/4S represented-principal**。两新独立CI artifacts均随源字段记录一起归档该约束原文与SHA256；不能把有外键误作有业务归属。
