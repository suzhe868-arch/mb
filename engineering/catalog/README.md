# 2026-10-18｜B工程窗口F05咨询实际HTTP+PG16新建复用与跨周期防重放｜最新进度

- **唯一受测代码提交** `07a95f772f88e59e379e6b73aeff2192a8e233ac`；官方[Run39106903367](https://github.com/suzhe868-arch/mb/actions/runs/39106903367)在隔离PG16作业中实测 **Node HTTP安全79/79、目录PG16 19/19、收藏PG16 13/13、咨询PG16 10/10**。合计真库**42/42**，所有计数同一SHA、0失败、0跳过，非超管`f05_catalog_ci`，正式F02-1冻结76物理表外加8个TEST侧表（测试库84张关系表，**不是84张正式Schema实体**）。
- **本轮实际应用写入**：`POST /api/v1/catalog/vehicles/:vehicleId/consultations`仅在loopback、`APP_ENV=test`、隔离确认与随机Bearer测试Customer会话下可调用。实际向冻结`public.consultations`写入，创建`pending`，首次人工响应期限为PDM-15默认**15分钟**，保存不可改写的初始direct source，以及独立不可变追加操作记录。对`customer_id + vehicle_id + listing_cycle_id`未终结工单严格复用并追加`TOUCHED`历史；终结后再咨询和新listing_cycle不跨周期复用。请求键SHA256绑定真实三元组；源周期的旧幂等键在重上架后**409拒绝**。
- **必要的硬拒绝与正反例**：没有会话/停用客户、未具测试手机号同意证明和当前电话关联、owner_assignment_pending、公海无Owner、员工inactive/非合法角色、隐藏/下架或已过期可见性证明均拒绝。非法路径/多余参数、伪造Customer/owner/phone/forwarded头拒绝；模拟操作审计写入错误造成完整事务回滚。工单不改变Customer owner、Vehicle、Recommendation或锁车对象，不自动授价格权益。
- **关键安全边界**：客户Bearer及手机号同意、员工工作权限来自`f05_catalog_customer_sessions_test`和`f05_catalog_consultation_actor_proof_test`，为**DISPOSABLE_TEST_ONLY**。缺少真实微信身份验证/手机号授权验签、真实员工permission+scope及配置化SLA，**正式Consultation创建仍处于EXTERNAL_GATE_BLOCKED**，本轮测试不是生产交付或F05全部验收。未实现正式reassign、首次人工响应触达事实、Customer withdraw、resolved/invalid及SLA暂停恢复，不能声称PDM-15整个生命周期完成。
- 原F05-10 CI-only服务和历史66项测试不篡改、不重新运行。旧10条面向main目标PR的广泛触发器仍未获可合法隔离裁决，故**没有开PR/合并main**。F06/F07/F08继续暂停；五正式Source仍`SOURCE_GAP_OPEN/FAIL_CLOSED`、生产`NOT_READY`、B状态`B_IN_PROGRESS/NOT_READY_FOR_A_REVIEW`。使用标准单GitHub Actions作业，未启用付费服务；不把CI成功写成财务已核账。

---

# 2026-10-18｜B窗口F05实业务收藏HTTP首个PG16写入纵切｜最新进度

- **最新真实已通过代码HEAD：** `4010608e3bcb5d9902ca8db9cf19eaa9af3350fa`。GitHub官方[Run39104836133](https://github.com/suzhe868-arch/mb/actions/runs/39104836133) `isolated_real_pg16`在同一SHA执行Node **73/73**、目录PG16 **19/19**、收藏PG16 **13/13**（**总真库32/32**），全部0失败、0跳过。目录与收藏夹具改为**同一Job顺序运行**，避免独立测试互相污染。
- **真实HTTP业务写入与查询：** `GET /api/v1/catalog/vehicles/:vehicleId/favorite`、`POST .../favorite`、`DELETE .../favorite`。非生产当前可运行 Node Foundation 服务，经数据库`f05_catalog_customer_sessions_test`中受约束的**随机不可猜测试会话**映射到实际`public.customers`表，有效状态才能读写；请求中的customerId/role/owner/header/forwarded/cookie一律不能伪造身份。正式微信Customer Issuer缺失时，正式请求**绝不被标为已授权**。
- **PG16真写入：** 在F02冻结76张物理实体之外加入**3张收藏测试专用会话/当前关系/追加审计侧表**，加前期目录3张临时侧表，合计物理82张（76+6；临时不是正式Schema）。收藏键为`customer_id+vehicle_id`，不绑`listing_cycle_id`；收藏ADD、REMOVE、状态READ和多次重试均实际事务提交。取消后历史事件不可篡改、不物理删除历史；来源转换维持收藏关系；Customer disabled/会话撤销/隐藏新增收藏拒绝。外键、幂等键唯一约束、跨Customer幂等复用与同时并发、事务触发失败后的真正回滚均在非超管PG16真库HTTP测试验证。
- **身份与正式门禁（不可混淆）：** 此会话属于`DISPOSABLE_TEST_ONLY`，需`APP_ENV=test/NODE_ENV=test`＋环回绑定＋精确隔离确认＋独立`f05_catalog_test`库才能使用。**没有正式微信/员工/4S/JYT签发、五Source签署或生产部署授权**；隔离测试的正例不代表真实客户已可使用，`F05_PARTIAL_TEST_ONLY`。旧F05-3G服务和旧66项未重跑或改写。
- **A施工单剩余缺口：** 完整F05各业务域写入、正式Customer/Employee受信Issuer、价格额度、找车Demand、Priority/推荐grant、咨询/Owner、公海等真实生产凭据与完整M94版本迁移链仍未实现。原10项对main PR广谱触发仍未获独立裁决，因此**尚未开PR，也未宣称READY_FOR_A_REVIEW**；F06/F07/F08暂停，`main`未改。
- **费用：** 只使用标准GitHub Actions单作业，未购买额外Runner、存储或付费套餐；无法从CI记录直接证明用户账单绝对为零，仍按$0新增预算管理。

---

# 2026-10-18｜F05本轮增量：图片首图安全路径＋真实公开数量统计

- **受测代码SHA：** `194bec857c26e758c0102c1115a5b0b1dc99a77d`；官方[Run39103198886](https://github.com/suzhe868-arch/mb/actions/runs/39103198886)已在隔离PostgreSQL16完成：**Node HTTP／安全测试67/67、真实PG16集成19/19，0失败、0跳过**。采用GitHub标准运行器，原F02-1冻结76实体+3个隔离测试侧表；未改动生产库、旧66项来源检查或F06/F07/F08。
- **业务接口新增：** `GET /api/v1/catalog/stats`返回全国当前公开可见车辆总数及`wholesale/mingbang/four_s`分类。统计与列表/详情复用同一受限SQL可见性：Priority保护、hidden、offline、sold、过期目录证明都不可计入。`todayNewCount=null`+`FIRST_SEEN_DEPENDENCY_BLOCKED`是未掌握可信首次入库事实的正确拒绝，不是“今日新增=0”。
- **车辆主图：** 列表和详情安全DTO新增`coverImagePath`，只输出普通车辆图片合法**相对路径**；非法协议URL、回退路径、双斜杠、编码绕过均过滤，原始`source_url_fact`永不出现在SQL投影/JSON；无合法顺序证明时返回`null`。不得把该相对路径解释为已验证的CDN真实可访问URL。
- **真实物理缺口：** F02-1冻结`vehicle_images`没有`sort_index`，只在候选字段矩阵出现过。不能擅自修改正式Schema，也不能把image_id伪当冻结原图顺序。当前为测试专用`f05_real_catalog_photo_order_test`提供原始顺序与来源隔离证明；已在PG16验证不可信图跳过、原序回退和重验证。正式来源证据及CDN绑定仍**待完成**。
- **范围未结束：** F05-1～11的完整可信Customer/Employee/JYT/4S来源、收藏、价格权益、找车、Priority正式授予、推荐、咨询等应用HTTP＋完整PG16尚未交付。所有当前正例的来源证明仍是`DISPOSABLE_TEST_PROOF_NOT_SIGNED`；`F05_PARTIAL_TEST_ONLY / NOT_READY_FOR_A_REVIEW`。
- **PR阻断未绕过：** `main`的旧10项无paths的F05 PR触发器仍有旧66来源测试误触发风险，本轮未创建PR、未改这些Workflow；不宣称生产、可信签发、完整F05验收或额外付费账户实际结算核查已完成。

---

# 2026-10-18｜F05车型展示与年款真实HTTP＋PG16交付进展

- 官方[Run39101785459](https://github.com/suzhe868-arch/mb/actions/runs/39101785459)在**代码HEAD `54e18058be857773c7645c93d0999893610b2810`**的标准免费运行器通过：**63/63 Node真实HTTP及安全单测，16/16 物理PostgreSQL16双连接集成，0失败、0跳过**。采用F02-1冻结初始76实体、非超级用户、可销毁测试库。
- 在原列表/详情真实SQL基础上加入`vehicle_models.model_name/model_year`、`vehicle_brands.brand_name`、`vehicle_series.series_name`物理读取，输出客户安全白名单`brandId,seriesId,brandName,seriesName,modelName,modelYear`。车型主数据缺失可以返回null，不推断假品牌车系；异常、冲突关系和非法字段拒绝、默认隐藏价。
- 新增`modelYear=2026`**车型年款精确筛选**，SQL物理条件为`vm.model_year`，不把年款冒充首次上牌年份；HMAC版本V4游标绑定年款/车型/车系/品牌/来源/排序，跨条件重放400。
- 车辆普通图片的`vehicle_images.relative_path`、来源`source_url_fact`和CDN临时回源仍需正式资产/运行配置；本次不输出原始上游URL，不把图片投影或C联调列为通过。
- F05其他正式客户写入、JYT/4S/Customer员工Issuer、六类依赖价格/年份/里程排序、城市位置/Rule Dictionary、生产可用性尚未完成；**只算目录隔离测试功能的实际进展，不算F05整体合格**。旧10个面向main的广谱PR来源Workflow未获独立安全裁决，本次未开正式PR，绝不重跑旧66项；F06/F07/F08继续暂停。
- GitHub Actions新增付费预算仍为$0，没有购买机器、开通付费服务或执行生产部署。

---

# 2026-10-18｜F05本轮真实业务续作最终汇总（最优先读本节）

- **本轮实际代码**：从两张简化表迁移到F02-1正式冻结编译器生成的**76张初始真实业务物理表**，保持PostgreSQL16、专用非超级用户和可销毁环境；官方同SHA运行 [Run39100830009](https://github.com/suzhe868-arch/mb/actions/runs/39100830009) 的Node HTTP **59/59**、物理PG16 **15/15**，均0失败、0跳过。
- **真实接口功能**：`GET /api/v1/catalog/vehicles`、`GET /api/v1/catalog/vehicles/:vehicleId`；当前合法`wholesale/mingbang/four_s`，全国，15台一页，最新上架真实上架周期排序，PDM05车型`modelId`／品牌`brandId`／车系`seriesId`的PG16实际精确查询与组合过滤；游标V3 HMAC绑定所有已生效条件，跨品牌/车型/频道复用拒绝。
- **安全**：真实PG约束禁止双活跃上架周期；隐藏、失效、变更来源后旧可见凭证、Priority测试保护、事务回滚、游标篡改、非法BIGINT及VIN/内部价/电话泄漏均有正反例。
- **PDM20七类排序仍未全部实现**：仅`sort=newest`具备真实字段且成功。合法其余六种暂返回HTTP 503 `CATALOG_SORT_DEPENDENCY_BLOCKED`，非法旧`oldest`返回400；不以假排序冒充完成。
- **边界**：已验证的76表是`F02-1 Current Initial`，**历史M94全版本迁移链、真实Customer/Employee/4S/JYT签发未证实**；所有来源可见凭证是测试侧表，服务只在`APP_ENV=test`＋环回网络运行，未授权生产、真实身份、客户权益价、收藏/找车/匹配/Priority正式授予/推荐/咨询/公海Owner写入，仍`F05_PARTIAL_REAL_HTTP_PG16`。
- **PR未创建**：当前main仍存在10个对任何main目标PR无paths的旧F05工作流，直接开PR会批量触发冻结来源检查且与用户禁重跑冲突；无逐文件合法裁决前不绕过。已有正常工程分支和同SHA真实官方Run，不伪称可交A全量验收。
- 历史旧66项仍**65成功＋1旧Oracle阻断**；PR113 **23成功、5旧Source失败**；本次59/15不能与原65/66合并或覆盖。五正式Source`FAIL_CLOSED`、F06/F07/F08暂停、生产`NOT_READY`、GitHub不增加付费。

具体HTTP接口与C端消费契约见 [F05车辆目录真实查询与接口联调契约_2026-10-18.md](./F05车辆目录真实查询与接口联调契约_2026-10-18.md)。

---

# 2026-10-18｜PDM-20七排序接口整改（继续按A工作单）

- 禁止旧候选`sort=oldest`冒充PDM-20正式排序；PDM-20只允许最新上架与价格双向、首次上牌年份双向、里程双向七类。服务端仅对已有真实时间来源的`sort=newest`返回成功。
- 其他六项合法排序，在未具备真实客户展示价／首次上牌年份／里程物理事实前，**严格HTTP 503 CATALOG_SORT_DEPENDENCY_BLOCKED**，而非假排序或泄露价；单测和物理PG16都覆盖负例。
- 这不是六类排序功能已交付，仍计F05业务缺口。真库证据以新SHA官方Run为准。

---

# 2026-10-18｜B最新同SHA官方真实验收与PR阻断（优先读此节）

- 受测代码HEAD：`64dc9c4b28c4f379562366d8b2f32411749e4fab`；GitHub官方 [Run39099173163](https://github.com/suzhe868-arch/mb/actions/runs/39099173163)，`push/completed/success`，唯一`isolated_real_pg16` job。**Node真实HTTP＋注入式数据库单测54/54，物理PostgreSQL16双连接／事务／回滚／安全查询集成12/12，全部0失败0跳过。** 两组不是旧Source66项，不应合并口径。
- 实际修复：车辆`source_type`与可销毁测试可见凭证做物理SQL关联；跨批发／名邦／4S类型变更后必须重新取得该来源合法凭据。迁移侧表、物理schema启动校验和真实PG16的来源切换负例同步更新。
- 实际PG16采用可销毁`postgres:16-alpine`、`f05_catalog_test`非超级用户，**M94_FULL_SCHEMA=NO、来源证明DISPOSABLE_TEST_PROOF_NOT_SIGNED**；只算目录隔离增量，不代表F05-1～11全真实业务交付、正式Issuer或生产可用。
- PR前置触发风险：main已存在10份无paths的`pull_request.branches:[main]`旧F05工作流，原A逐文件修改授权仍`NOT_AUTHORIZED`；创建指向main的PR将引起与用户“不重跑旧来源”相冲突的批量触发，故**本轮没有创建PR**。没有修改这10份旧工作流，也没有重跑历史65+1来源校验。
- 详细中文交接：[B_F05真实PG16安全补强与PR阻断交接_2026-10-18.md](B_F05真实PG16安全补强与PR阻断交接_2026-10-18.md)。正式状态：`B_IN_PROGRESS / BLOCKED_PR_TRIGGER_AND_FULL_F05_SCOPE / NOT_READY_FOR_A_REVIEW`，F06～F08继续暂停；GitHub付费工件0新增。

---

# 已实证的新证据（B阶段增量，非全F05验收）

- GitHub标准运行器成功完成一次**真实PG16服务容器**：Run [39074540750](https://github.com/suzhe868-arch/mb/actions/runs/39074540750)，原提交 `e09439eb75e327138353290df8061d5779d838f7`。
- 原HEAD **54/54 Node HTTP/安全测试 + 6/6 PG16两连接真实HTTP集成测试**、0 fail、0 skip；一项早期Run39074466516因容器Health引号失败，已修复，不能隐去历史。
- **此PG16为真实服务但使用极简Vehicle/Cycle可销毁测试结构，M94全量物理迁移=NO**；也不是真实Customer/Owner/JYT受信签发，未对F05全部入口做实际验收。
- 本次加入PG16隐藏/售出/结束周期/多活跃周期/事务回滚负例；新扩展用例是否成功以最新GitHub run和同SHA日志为准，禁止仅凭代码预报成功。
- PR暂不创建：含`engineering/src/**`变更可能触发旧PR工作流；尚未完成全量PR事件路径预检，零新增付费和不重跑旧工作流要求优先。

# F05真实业务整改：首条车辆目录非生产纵切（B阶段部分交付）

**状态：B_IN_PROGRESS / SELECTED_PG16_REAL_RUN_PASSED / NO_PR / NOT_READY_FOR_A_REVIEW（2026-10-18 复核）。** 此包没有满足F05全部真实业务验收，禁止以已通过的Node HTTP测试替代原PG16测试。

## 代码范围

- `engineering/src/app.mjs`/`server.mjs`：在现有F01单一服务加入仅测试环境可启用的catalog；保留F03 HTTPS独立认证路径。
- `engineering/src/catalog-readiness.mjs`：数据库必须是本机/专属`f05_catalog_test`、用户`f05_catalog_ci`、PostgreSQL 16、实体表真实存在；APP_ENV=test、loopback与精确同意短语必填。**无真实账号时严格无法启服务**。
- `engineering/src/catalog-service.mjs`：物理`vehicles` + `vehicle_listing_cycles`，仅当匿名可见证据存在、没有Priority等显式保护、上架状态正确且未结束归档时200；安全字段白名单、15台Keyset、HMAC不透明游标、当前周期的started_at，默认全国批发。只作安全小范围查询，不伪称7类排序、全部PDM20筛选已实现。
- `engineering/catalog/000027_catalog_disposable_test_only.sql`：**独立临时测试侧表**用于验证物理PG、保护否决、过期和回滚；没有真实业务Issuer，不能上线。原F02/M94/frozen schema未改。
- `engineering/tests/catalog.test.mjs`：Node实际监听127.0.0.1，通过真实HTTP请求，但数据库是注入的替身；必须明确为HTTP单测不是PG16实测。新增 `catalog-regression.test.mjs` 对微秒分页、BIGINT、错位双周期、HMAC及分支权限作攻击回归。
- `engineering/integration/catalog.pg16.test.mjs`：需要真实独立PG16和已播种的M94车辆+当前周期，缺失即非零退出；物理BEGIN/ROLLBACK、HTTP 200、Priority阻断、过期拒绝和泄漏负例。
- `F05_1_to_11_真实交付核对矩阵.tsv`：明确各模块真正未补的生产Issuer及业务接口。

## 自验

```sh
node --test engineering/tests/catalog.test.mjs engineering/tests/catalog-regression.test.mjs
node --check engineering/src/server.mjs
# 仅在拥有独立PG16可销毁测试库时；无PG16不允许声称PASS：
export APP_ENV=test NODE_ENV=test API_HOST=127.0.0.1
export F05_CATALOG_TEST_CONSENT=I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY
export F05_CATALOG_DATABASE_URL='postgres://f05_catalog_ci:...@127.0.0.1:5432/f05_catalog_test'
# 在已封印M94 schema且充分播种业务FK后，以隔离测试身份执行 v27 DDL
export F05_CATALOG_TEST_VEHICLE_ID=<已播种真实VehicleId>
export F05_CATALOG_TEST_CYCLE_ID=<该车当前ListingCycleId>
node --test engineering/integration/catalog.pg16.test.mjs
```

HTTP测试只证明真实Node HTTP协议和响应安全，不证明PG16真实业务。当前运行容器无`postgres`、`pg_ctl`、`psql`、`pg` Node模块，软件包源不可达；PG16集成测试**未执行成功**。
本轮改写真正PG16集成为**writer Client/HTTP reader Pool两条独立后端连接**，先校验事务未提交时对外不可见、后提交可见、Priority写入未提交不改变对外读取、提交后拒绝、撤销恢复、过期拒绝、最后清理自身临时侧表；测试库必须先确认不已有同车测试侧表。该逻辑只有实际PG16可运行后才可计合格。
本轮增加 `pg_catalog.pg_attribute / pg_constraint` 物理字段类型和外键验证，以冻结M94真实字段为基线。测试环境 URI 必须是127.0.0.1:5432、f05_catalog_test、f05_catalog_ci、非空口令，不接受查询参数中host/hostaddr/sslmode覆写或fragment，且严格 APP_ENV=test、NODE_ENV=test。正式Customer/员工Issuer、完整Priority及推荐业务均缺，故F05不可能在本子单标完成，F06按用户最新决策仍暂停。

## 遗留安全与测试

1. **旧历史**Run39035485532仍65/66 + 1 BLOCKED_EQUIVALENCE，PR113仍23/28；这是保留事实，不是本HEAD测试通过。
2. PostgreSQL真实安装/迁移及权限正反例均未在本工作环境运行；A需要审查本子包是否允许在合法独立CI内运行临时PG16，保持Github Actions费用$0。
3. 有效生产Customer身份与图片可信发布/CDN/JYT上游均未授权；不能通过伪造账号/编辑cookie/JWT绕过。
4. **客户端C PR68不会自动可用**，本包无微信实测。

## 本轮新增可验证缺陷修复（相对上一轮10文件候选）

1. 当前上架周期分页游标传递PostgreSQL微秒精度，避免JS Date毫秒截断导致同秒翻页遗漏；真实PG16的SQL语义尚待环境复核。
2. 车辆与周期ID按PostgreSQL有符号64位上界验证，不再将合法BIGINT转换为`Number`。
3. 两个同时活跃的上架周期按**严格拒绝**处理，避免任取一个周期造成越权展示。
4. 健康探针每次检验真实PG16版本、隔离数据库/用户和4张基础/侧表；不再以`SELECT 1`冒充车辆业务就绪。
5. 测试新增输入篡改、跨来源游标重放、敏感字段、断链、双周期、禁写方法与真实HTTP负例，本轮54/54条Node通过，0 skipped。

**正式验收硬界：** 未安装PG16和`pg`驱动、未建立受控测试库/M94种子、未具备可信Customer/正式车辆Scope/外部Publisher，因此尚无“PG16业务真通过”记录。整个F05-1～11非生产全功能仍不具备READY条件，五正式Source和生产继续禁用。

## 2026-10-18 续作（B进度，不是验收）

- **Node本轮：54/54 PASS，0 FAIL，0 SKIP**。仅验证真实 HTTP + 注入式数据库响应；并非原生 PG16。
- **隔离PG16：未真实运行**。两连接语义、物理FK/字段校验、非持久测试侧表清理已写在可执行脚本中；需要真实PG16 + M94测试fixture + `pg@8.23.0`，缺任一应非零失败。
- **实际正式Customer/Employee信任Issuer、F05全模块业务正例、完整查询排序及C联调**：仍未完成。客户非生产查询永远返回`price:null`、`productionReady:false`；未接来源授权的新写操作不予开放。
- **旧Oracle**保持`65/66 + BLOCKED_EQUIVALENCE`，PR113旧签源`23/28`，不可改写。B不启动旧66或F06，不签发Source，不发布生产。
- GitHub分支/PR须在本阶段真正可交付功能和CI路径/费用预检后创建；本地自测不是A验收，不能写`READY_FOR_A_REVIEW`。
