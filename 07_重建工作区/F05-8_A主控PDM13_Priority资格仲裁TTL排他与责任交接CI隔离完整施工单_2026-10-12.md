# F05-8｜A主控正式完整施工单：PDM-13 Priority资格、仲裁、TTL、排他与责任交接（CI-only）

> **正式技术放行**：`F05_8_A_RELEASED_FOR_B / NEXT_OWNER=B / CI_ONLY / NO_PRODUCTION`（2026-10-12）。
> 负责人：B工程执行；唯一工作仓库：`suzhe868-arch/mb`；指定B工程分支：`feat/f05-8-priority-arbitration-ttl-handover`，**从B实际接单时最新GitHub`main`新建**，不得沿用F05-7旧分支施工；未经A对F05-8的单独验收不得由B自行合并main。
> 任务按本单完整边界一次性研发、自审、修复、真实PG16回归、提交正式交接，不逐项征求用户技术同意。任何生产身份/资金/真实第三方写入与产品新规则均不在本单授权中。

## 一、正式依赖与 Authority 冻结

1. 一级产品 Authority 为`07_重建工作区/PDM-13_最终完整规则.md`（2026-10-05、`COMPLETE/INTEGRITY_PASS/ALL_USER_APPROVED`），尤其§2–4资格与共用匹配、§6–9仲裁、§10–14 TTL/release/替代Demand、§15–20可见性/推荐/公开计数/价格分离、§21–29 Lock/Transaction/handover/公海/结束原因、§30–32事件范围/权限；联动PDM-12 Final current high/acceptable Match Result、PDM-11 find-car entitlement和Demand生命周期、PDM-14 Recommendation visibility/grant/price-right、PDM-18 Lock、PDM-19 Transaction、PDM-01/02/03/25身份责任/审计。
2. 实际基线：GitHub [PR #46](https://github.com/suzhe868-arch/mb/pull/46)已由A二轮正式验收并标准合并，B最后HEAD `99c38d013f67cc56975f1664120fb87c204afc3c`，真实merge `a56cc04e5a1d79fd67ad5332992d33348d123557`。A验收记录`07_重建工作区/F05-7_A主控二轮独立验收66项真PG16_PR46标准合并与F05-8技术交接_2026-10-12.md`和[PR46评论](https://github.com/suzhe868-arch/mb/pull/46#issuecomment-6115975938)。每次开工、CI及PR均以**当时最新main及B最后HEAD**为准，不持旧SHA作为本批验证。
3. 已签M94→v23 CI完整链、F03真实员工正常会话/独立能力/个人deny/范围、F05-6受信Demand/当前负责人、F05-7确定性Match/占用快照与source_signature允许在**可抛弃CI库**作为上下游测试依赖；不能以旧CI synthetic相当于正式生产Issuer。不得修改任何既有M94、F03/F04/F05迁移、正式PDM、C视觉、客户实际产品代码、既有GitHub Actions，亦不合入真实JYT、微信、资金或任何生产数据。

## 二、F05-8A｜先核实际物理来源与权限（不凭文档猜表/身份）

1. 在每个独立全新非超级用户PostgreSQL16测试库上，先按M94→v23顺序验旧迁移、各历史账seal、实体结构和非超级用户、不可变账本，再查询**实际**`Customer`、Priority qualification/独立开关的存在性、`Demand`不可变created_at、responsible/current owner与handover、`Vehicle/listing_cycle`、`Match Result status/version/tier`、`Lock`、Transaction、Recommendation、visibility grant与公共列表来源，记录表/列/类型/约束/旧触发器。
2. 提交`F05-8_PDM13受信来源与优先级权利矩阵.tsv`，逐源`REAL_SIGNED / CI_SYNTHETIC / SOURCE_GAP`明确标注。真实Priority Customer后台开关Issuer、客户会话、负责人权限或资金交易签发如无证据，**仅允许新CI-only独立合成控制事实**，正式`/api`一律fail-closed；不得将synthetic字段写回原始正式Customer Level。
3. 如签名物理Priority结构不足，**仅在本次`engineering/f05/priority-arbitration-ttl-handover/**`追加`000024_priority_ci.sql`**至可抛弃PG16 v24，包含与原 signed`Customer/Demand/Vehicle/cycle/Match Result`一致的身份关系、独立qualification、active Priority唯一索引、历史/ended cause、TTL创建冻结、candidate仲裁事实、同周期suppression、trigger Demand、Lock占用/Transaction守卫、批次handover与失败集合/不可变尝试账；全部具原生约束及版本失效事实，必须支持坏迁移注入回滚与新旧catalog seal。已有真正可用的物理结构优先复用；不能假造 production sign-off。

## 三、F05-8B｜正式Priority产品逻辑（本批签名CI合同）

### 1. Customer级资格与合法候选
- Customer Priority qualification **单客户独立后台属性**，非 CustomerLevel、VIP称号或PDM-11 find entitlement。资格开关本身不创建Demand/Priority、不改CustomerLevel/Owner；开启触发已有合法active Demand和Match Result的受影响范围评估；关闭结束该Customer现active Priority并**按当前合法候选**重仲裁，同时保留Demand和历史。
- 所有客户共用F05-7 PDM-12唯一Matching，Priority**只消费当前合法、同source_signature、同cycle、已验证`high/acceptable`**，绝不为Priority执行第二套车型价格判断；`confirmation_needed/no_match/stale/oldcycle/无matching-ready Demand`不产生候选。hidden可内部候选但不因此对Customer可见；paused Demand、失去entitlement、账户停用均禁止新Priority。

### 2. 仲裁与唯一
- 同一Vehicle+当前cycle最多一个active Priority；同一Customer同车多个Demand首先选其唯一最佳`trigger_demand_id`，跨Customer只算一人，避免多Demand刷权；多Customer按**high先于acceptable → PDM-11原始不可变Demand.created_at更早 → demand_id更小**。不得混入VIP、销售职位、渠道来源或updated_at。支持Customer一人多车并行、不限制Customer整体active数量。
- 两合法员工/两Demand争同一Vehicle需真实PG16两个独立后端竞争，利用事务/行锁/唯一索引原生失败或顺序commit证明单active、无脏写、回放不创建第二条；客户级候选竞争必须在相同事实版本下确定性。事件Key幂等与旧Key失效后防重放须真库验证。

### 3. TTL、release、suppression与重仲裁
- 全局默认TTL=24h/86400秒（后台可配置后续新对象），每条Priority新建时**冻结expires_at**；调整全局默认、页面访问/推荐、Match重算、trigger Demand切换、责任交接**不重置/不延长**。TTL不等于Lock默认3天，不能人工续期、手改已生成expires_at或将ended手工复活。
- trigger Demand现责任人的**合法员工**可明确提前release/不推荐；立即ended并记真实actor/time/reason，再读取其他Customer完整合法当前候选重仲裁。**同Customer+Vehicle+同cycle**因release、主动放弃、TTL expiry产生suppression，原旧事实不得自动重获；真正有新的Demand/Vehicle事实或新cycle按正式Guard进入新候选。Recommendation取消本身不得隐含Priority release。
- 高/可接受降级为unknown/no_match，Demand状态暂停/失效/销售描述readiness失效时，先寻找**同Customer其他真实有效Demand**可替代trigger，找到只换trigger不改expires_at；找不到ended后重新跨Customer仲裁。所有history只append或受限ended迁移，不得物理抹除。
- TTL到期、人工release、qual off、车辆失效、Lock/Transaction进入/结束等变更使用事件驱动受影响范围评估；定时逻辑仅到期/异常补偿，不得恢复全库固定扫作为唯一匹配。重复结束事件、过期竞争、先后顺序失效事实不准生成两active。

### 4. PDM13独占与其他业务域硬隔离
- **Priority created ≠ Recommendation ≠ Customer visibility grant ≠ Lock ≠ Price unlock ≠ Owner**；不授客户详情权限、不默认免费查价、不改quota/批发价/客户数字价、不创建推荐/锁/事务/客户Owner。当前Priority仅当前合法业务员工可内部处理；hidden不可被顺带改unhide。
- active Priority的普通Feed/Search/Sort/Filter、普通share/历史链接、公开在售统计、其它无合法Authority的Recommendation历史入口必须有**可核的排他投影/Guard**，而非只在Priority表记active。仅CI隔离投影证明；不新增正式生产HTTP路由。Priority ended时回到按底层hidden、公开规则和当时合法Recommendation的权利决定，而非无条件public。
- 原合法Customer B的Recommendation/免费周期价格权事实，在Customer A得到active Priority时**保留历史和价格权而临时抑制B可见性**；A Priority ended后按PDM14当前有效全部事实恢复，不得穿透历史链接。Priority本身不授推荐/价格权。
- active Lock不阻PDM12匹配，**禁止新Priority**；正式Lock成立即结束Priority（本Customer`converted_to_lock`/他人合法锁独立takeover reason），Lock结束不能复活旧Priority，只能依据最新可售事实重新仲裁。in-progress Transaction同理阻止新Priority、开始时结束active、撤销不复活旧Priority，不能修改LockRequest/Transaction/退款旧表来满足测试。
- active Priority构成公海保护事实，单有qualification和历史ended均不是。Vehicle被Priority保护期间客户公开统计必须排除，结束后重新读取原公开资格。

### 5. 当前责任/接客/交接
- current responsible始终跟随**trigger Demand当前合法responsible employee**，不能缓存Customer.owner/历史creator作为固定授权。Owner更改、Employee失活/离职/调店/降权/失去Scope，旧员工立即禁止读和release/操作；按F03正式职责和Handover Batch隔离产生待交接与历史，成功切合法负责人/未成功仅失败对象重试；不能用旧责任授权。
- Handover中Priority在其它Guard仍合法时可active，但TTL依真实到期时钟持续运行，不能冻结/重置，直到期满即expired；失败/重试必须局部、append审计且不扩大数据scope。Priority create/ended/re-arbitrate均不得直接改Customer Owner，公海保护须重算其它现有权益事实。
- Employee permission须当前有效account/role/individual allow-deny/scope/team/签名Employee Session全部通过，SystemAdmin和4S业务不自动获得Priority控制权，历史creator/曾是责任员工不构成永续权限；签发Issuer缺失一律fail-closed。

## 四、F05-8C｜原生真实PG16测试矩阵与授权界限

1. Source至少覆盖：qualification与find独立开关/ON/OFF；active高/可接受候选与unknown/no_match/历史禁止；相同Customer不同Demand折叠；跨Customer`high>acceptable>created_at>demand_id`全序；hidden可处理但不授客户Visibility；同车唯一与同Customer多车；双PG16独立连接竞争；TTL冻结与配置改变、人工release、同cycle suppress、新事实和新cycle可恢复；match tier downgrade和trigger替换不重TTL；Lock active阻Priority与Lock成立结束/取消后不复活；Transaction中阻建/结束；Priority不自动Recommendation/Grant/Price/Owner；B已有推荐/价格权保留但可见性受A排他抑制及事后有条件恢复；Employee失活/权限deny/scope/交接Batch、fail-only retry、到期中handover；公海保护与公开数排除；不可变ended audit/key重放；来源缺口负例。**不能只列项目名称，必须在真PG16表/原生行锁/事件对照里实际断言。**
2. HTTPS至少测试：无真实合法PriorityIssuer的`/api`入口403/404、伪造Customer ID/资格、4S/SystemAdmin、历史Employee Cookie或禁用/降权、跨Origin/CSRF/重复Cookie、造数字价/修改锁钱、普通链接绕过Priority和旧推荐详情穿透均拒绝或安全投影；禁止正向开放生产Priority API，必须非生产TLS loopback并保留原生日志。
3. 对于无法由旧正式生产Issuer签发的正向路径，使用明确的`CI_SYNTHETIC_PRIORITY_*_NOT_PRODUCTION`固定隔离身份，旧F03真实员工Session和现成签定实体/状态必须查询并与会话绑定，禁止仅凭.env、传入`authorized:true`或伪造role放行。若既有物理来源并未签署，不造`REAL_SIGNED`结论。
4. 真数据库竞态至少两个**不同`pg_backend_pid()`**及真正`SQLSTATE 55P03`或清楚可复现的原生事务调度；验证最后COMMIT后的Priority排他、无双active、锁/交易合法先后与权限撤销。完整导出Source/HTTPS测试原生日志、旧migration ledger及v24 seal、`pg_dump --schema-only`、catalog hash、唯一索引/触发器、批次重试历史、原始re-arbitration事实、源缺口与逐文件SHA256。

## 五、F05-8D｜不可变历史回归的技术难点及正式裁决（必须遵守）

**不可照抄F05-7两项新Job正文。** GitHub新签F05-7`ci-job.sh source`会启动`ci-verify-workflows.mjs`，此脚本**硬编码要在相同HEAD上存在F05-7旧七份指定Workflow的push run**。这些旧workflow触发器只监听F05-7专属分支；将旧Source Job正文搬到F05-8新分支，不可能在不改旧签文件的情况下满足同SHA运行，必然报错。A明确裁定：**旧代码绝对不改，新F05-8专属兼容再执行器从旧源码只读调用完全相同的PG16测试本体，替代“本批专属GitHub运行汇总审计”一小段环节；新的本批GitHub只读审计重新核66旧兼容及新2。不得将这一已知自引用审计故障冒充PG16业务回归失败。**

为既保真覆盖又保持独立68项作业，正式采用**8份新Workflow / 68个真实独立非超级用户PG16 Jobs**：

- **七个新增冻结历史Workflow：** `.github/workflows/f05-8-frozen-h52-revalidation.yml` (52)、`f05-8-frozen-i2-revalidation.yml` (2)、`f05-8-frozen-j2-revalidation.yml` (2)、`f05-8-frozen-k2-revalidation.yml` (2)、`f05-8-frozen-f05-4-2-revalidation.yml` (2)、`f05-8-frozen-f05-5-2-revalidation.yml` (2)、`f05-8-frozen-f05-6-2-revalidation.yml` (2)。**七份全部从main已签对应F05-7冻结旧workflow的`jobs:\n`起至文件末尾逐字复制，正文实际64个Job原样，不能删减/替换/mock/静态矩阵冒充。** H52接近GitHub 512000B YAML平台硬上限，触发头使用只匹配本批指定分支的有效短glob，不能改旧Job正文。
- **第八个新Workflow：** `.github/workflows/f05-8-priority-arbitration-ttl-handover.yml`，恰好**4个各自独立真正PG16 Job**：`compat-f05-7-source`、`compat-f05-7-https`、`priority-source`、`priority-https`。四个作业各自新建隔离Postgres16容器、非superuser DB并独立提供原生日志和Artifact；**不允许一份PG16里循环跑四组测试来伪装四Job**。
   - `compat-f05-7-source`必须依旧真实M94→v23验证原封原有`tests/source.test.mjs`的**28/28真实原生PG16**以及迁移/结构/seed/negative，`compat-f05-7-https`运行未改的`tests/https.test.mjs`**7/7真实PG16**。可在新工作目录建纯兼容准备脚本，**仅用当前F05-8的独立68-job read-only audit代替旧F05-7自指`ci-verify-workflows`校验**，不得关闭F05-7任何业务测试、历史签名或改写其旧脚本；兼容脚本必须注明其执行的真实旧测试路径/原生test count/PID/SQL及结构哈希。
   - `priority-source`、`priority-https`在各自独立PG16中跑含旧v23 attestation的新`000024`与本批Priority真实正反例，输出新原生Artifacts；新Source Job用`actions:read`只读GitHub官方API核七冻结64项、两个兼容回归Job及四新Job总**68/68、全部同最终HEAD且completed/success，零skip**；绝不直接改历史`ci-verify-workflows`。新Source在它自身尚未完成时可只读验证另外67个已完成Job并仅在自身所有真实测试通过后最终完成，记录`F05_8_OFFICIAL_GITHUB_64_FROZEN_PLUS_2_COMPAT_PLUS_2_NEW`与官方run ids、jobs数、同SHA证据。
   - 旧F05-7 Source/HTTPS Job“自身版本的跨工作流审计”仍是F05-7历史已签事实，**本批不重新制造其原定F05-7分支GitHub run**。新兼容Job完整保留业务回归28/7及真实PG16环境与日志，该等效重验证明原文逐项可核、不是绕过失败。
- 故**八个官方run且唯一最后B/PR HEAD一致，实际Jobs为`52+2+2+2+2+2+2+4=68/68`**，任何失败、skip、未完成都不能算数。新第八条run须产**至少四份**非空、有效、同最终HEAD原生Artifacts（compat source / compat HTTPS / priority source / priority HTTPS）。公共postgres容器镜像限流只允许GitHub官方同SHA成功复跑留证据。多个PR event引发的重复jobs不计入已指定八个push run。

## 六、唯一修改白名单、交付文件与退出条件

1. 唯一B分支`feat/f05-8-priority-arbitration-ttl-handover`。仅**新增**`engineering/f05/priority-arbitration-ttl-handover/**`及上列**8份新的`.github/workflows/f05-8-*.yml`；不能改`main`的任何旧文件，不能回头改F05-7签名SQL/测试/业务代码、PDM/IA/Low-Fi、C设计、上游/生产接入、已签旧workflows。若某实际必须修改的旧文件超出白名单，B须记录`BLOCKED_SCOPE`交A先裁定，不能偷改。
2. 必须交：中文`B全包自验与A复验交接.md`（权威与禁止方向、目录新增白名单、源矩阵、测试清单和负例、用GitHub官方run IDs原生jobs逐组成功、唯一最新B SHA、四个原生Artifact及size/hash/非过期、先验旧签链和新增v24 seal、真实两个PG PID/SQLSTATE、差异历史、SOURCE_GAP）；`F05-8_PDM13来源权限矩阵.tsv`；`Priority_资格仲裁TTL与事件时序审计.md`；SQL、服务/纯算法、fixture、测试、evidence、兼容再执行/官方CI只读核验脚本、可验证原生结构证据。
3. B须在最新`main`起分支，实现→运行四独立真实PG16新Job与64冻结Job→缺陷自己改→**最后提交SHA重新跑完整68/68**→四原生有效Artifacts→原生逐项计数与兼容旧测试28/7日志→完整中文PR交接。最后状态`F05_8_B_SELF_TESTED / SAME_SHA_68_OF_68_SUCCESS / READY_FOR_A_REVIEW / NEXT_OWNER=A`；**B禁止自行合并main**，不得自动做F05-9 Recommendation / F06 / 生产动作。
4. A在B正式交接后独立复核PDM-13各规则、F05-7等效回归的技术例外是否真的保留测试、与老64个Job原文一致、四原生Artifacts/SQL seal/权限/并发和新最终SHA，全门禁PASS方标准合并。仍存真实Customer微信/手机号/权限Issuer/客户显示价格/Price与JYT/图片/资金等生产缺口，**无论本批CI能否全绿，`F05/C-H01/V1=NOT_READY`**。

## 七、正式交接指针

- **A本轮已实际完成**：F05-7 二轮独立验收、GitHub标准合并PR46、main权威验收报告、本F05-8完整正式施工单与白名单/技术兼容裁决。
- **唯一下一执行人**：`NEXT_OWNER=B`；任务`B_IMPLEMENT_F05_8_PDM13_PRIORITY_ARBITRATION_TTL_HANDOVER_CI_ONLY_68_PG16`。
- 本文件是现行工程**施工授权**，不是F05-8完成证明、PR或生产授权；B尚未开始时状态`B_NOT_STARTED`。A/B/C跨聊天只通过GitHub本文件与main五项指针交接，不能声称另一窗口已经收到消息或启动。
