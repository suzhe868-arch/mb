# 2026-10-11｜F05-3A A二轮独立复验：4S首次合法正向链PASS，新增3项物理归属与并发阻断；PR32不合并，B整改（唯一最新）

- **A已独立确认真实正向及CI来源**：[PR #32](https://github.com/suzhe868-arch/mb/pull/32) 最新B/PR HEAD `4bd39d7e4b925346a6867870399260d9aaf85d87` = [Actions #38085191145](https://github.com/suzhe868-arch/mb/actions/runs/38085191145) `run.head_sha`；官方38/38真实非特权独立PG16 jobs success，冻结旧36全文不变；新增数据库14/14、HTTPS10/10，71原生Artifacts、新物理`11682206471`与TLS`11681796730`未过期；PR全部18项仅本包新白名单，000001～000015/旧F03/F04/F05/生产server/Final/IA/Low-Fi/C未改。
- **此前4S合法发布可信来源`SOURCE_GAP`已由本次受信链解决、无需重做**：System Admin真Session签发仅创建本人新4S人工Vehicle的license/scope，4S本人Session经PG16车型与必要字段核对，在同一DB事务建立全新Vehicle+ListingCycle+当前4S本人经营对象责任和不可变审计；真实TLS自己最小详情200，另4S/名邦/System Admin/旧车/JYT/六非详情出口403。
- **A二轮另发现3项必须修复的技术安全阻断**：`A-F05-3A-01` 新publication的license_id和member_employee_id各自独立FK、不强制license归于同一4S成员，现时read缺license.employee_id一致性校验且发布者身份事实可直接SQL改，可能把员工2合法license授权给未受管理员许可的员工8；`A-F05-3A-02` 两当前关系表缺`revoked_at`撤销后禁止UPDATE恢复的数据库不可逆约束，旧授权/旧归属可能物理复活；`A-F05-3A-03` H-A11/H-A14仅检查Promise启动瞬间尚未完成即释放锁，没有第二真实PG16 SQL确定已进入锁等待的可复现证据。
- **A正式完整二轮整改施工单**：`07_重建工作区/F05-3A_A主控二轮独立复验对象归属绑定复活与并发证据完整定向整改单_2026-10-11.md`；[PR32 A审核评论](https://github.com/suzhe868-arch/mb/pull/32#issuecomment-6102199600)。状态 **`F05_3A_A_CHANGES_REQUESTED_THREE_BLOCKERS / PR32_NOT_MERGED / NEXT_OWNER=B`**：B继续`feat/f05-3a-four-s-member-trust-scope`原PR32，仅修三项、真实PG16负例及独立确定性竞态，冻结旧36Jobs＋新2最终同SHA38/38与两新原生Artifacts及中文交接，再交A三轮复验；不得自行合并/进入F05-3B/生产。
- F05整体、F04生产Vehicle API、C/H01高保真和V1产品基线持续`NOT_READY`；本次仍仅隔离PG16和本地TLS验收，不触真实业务环境。

---

# 2026-10-11｜F05-3A A首次独立审查：真实4S来源缺口属实；原PR32保留Draft，A技术裁决及定向补证交B（唯一最新）

- **A已实查工程及原生证据**：[PR #32](https://github.com/suzhe868-arch/mb/pull/32) B/PR HEAD `6785b5e7130b5ba9b0c7996c70de2a5222bd8a46`与[Actions #38076660267](https://github.com/suzhe868-arch/mb/actions/runs/38076660267) `run.head_sha`完全一致，官方**38/38独立非特权PG16 CI成功**；原F05-2签收的**36个Job全文冻结未变**，新真实物理`G-A01～07 7/7`、真实HTTPS`G-B01～07 7/7`；原生**69份Artifacts**，新物理 `11678686225`、TLS `11679205872` 未过期；本PR仅**8项批准的新增白名单文件**、旧迁移/生产/Final/IA/C零改。**此仅证明没有受信source时安全拒绝，未有4S本人合法正式发布的正向200**；A独立确认`SOURCE_GAP_EVIDENCE_VERIFIED / F05_3A_BUSINESS_POSITIVE_NOT_ACCEPTED`。
- **缺口实质**：真实F03 PG16可证employee2 4S账号、active、`pc.four_s.vehicle.manage`个人allow，但现有scope仅Customer301、没有经授权的新Vehicle创建范围与4S本人同正式发布事务的Vehicle+Cycle+owner+审计收据；F05-2`team_id NOT NULL`只属名邦Team，不能拿4S来源字段或旧上传者伪签。A据PDM-02 Final§3/4、PDM-04§9/10及PDM-06§1/6/7/13作出**已有产品规则下技术裁决**：一个4S成员账号直接作为合作经营主体，不增4S组织；先由受信System Admin管控真实“仅创建本人新4S车”的资格/Scope，再由4S本人合规Session+正式发布完整字段在单PG16事务建立全新Vehicle/Cycle/本人的当前对象责任和不可变审计；旧车不得追认，没授权则403。
- **正式A定向补证施工单**：`07_重建工作区/F05-3A_A主控首次独立审查4S受信来源缺口技术裁决与定向补证施工单_2026-10-11.md`；[PR32正式A评论](https://github.com/suzhe868-arch/mb/pull/32#issuecomment-6101074294)。**状态`F05_3A_A_SOURCE_BRIDGE_RELEASED_FOR_B / PR32_DRAFT_NOT_MERGED / NEXT_OWNER=B`**，原分支`feat/f05-3a-four-s-member-trust-scope`追加许可内的受信来源/真PG16事务和独立正反测试，旧36冻结＋新2同SHA38/38、两原生Artifacts归档后交A复审；不擅自合并main、不开始F05-3B、不接生产。技术源证明仍缺则明确BLOCKED，不造200。
- F05全阶段、F04生产Vehicle接口、C/H01高保真与V1产品基线保持`NOT_READY`。F05-2已PASS并入main，原五项阻断不是当前问题。

---

# 2026-10-11｜F05-2 A第三轮验收PASS、PR31已合并；F05-3A 4S单成员可信来源隔离包正式放行（唯一最新）

- **F05-2 A正式PASS/CLOSED**：五项`A-F05-2-01～05`独立验收全部通过；[PR #31](https://github.com/suzhe868-arch/mb/pull/31)已由A**标准合并main**，merge SHA `fec72e9245845c252c551f6c172ecca7de5b4467`。受检B最终HEAD `50e28b69b60c4a48c50714abb003e514ec1f8205`与[Actions #38074648994](https://github.com/suzhe868-arch/mb/actions/runs/38074648994) run.head_sha一致，**36/36独立真实PG16 job success**；旧34个Job逐项原文冻结，新物理**21/21**、真实HTTPS**11/11**；59份Artifacts，新`11677953440`/`11677713304`未过期，旧M94封印不变，合并16项仅在批准新增白名单。A合并批准评论[6100698698](https://github.com/suzhe868-arch/mb/pull/31#issuecomment-6100698698)。
- **审计Actor问题真正关闭**：隔离`000015`治理触发器自动撤权为`SYSTEM`、human actor `NULL`、被撤权原负责员工仍单记`previous_employee_id`，before/after/事务/因果有物理证据、不可变；人工签发/主动撤权/经理交接记当前真实Session操作者；R-A17～21真实PG16反例合格。五项历史阻断只保留为审计记录，不再视为当前待修。
- **正式A报告**：`07_重建工作区/F05-2_A主控第三轮独立验收PR31正式合并与F05-3接力_2026-10-11.md`。**F05-3A新完整施工单已放行**：`07_重建工作区/F05-3A_A主控4S单成员经营责任可信来源与Vehicle隔离权限验证完整施工单_2026-10-11.md`，范围仅“4S单成员真实身份发布来源及经营责任+最小隔离授权/撤权审计”（旧36真PG16全文冻结、至少新2项独立真PG16=>条件具备时**38/38**）。指定新分支`feat/f05-3a-four-s-member-trust-scope`，**NEXT_OWNER=B / B_NOT_STARTED**，由B从最新main创建并一次性开发/自测/归档后交A，不擅自合并；来源实证不足必须`SOURCE_GAP`阻断，禁止造4S组织或越权200。
- **边界不变**：F05整体、F04生产Vehicle端点、C/H01高保真和V1总基线`NOT_READY`；F05-2 CI-only并非生产授权，不接真实JYT/采购价格/电话/资金或现有车辆自动回填Owner。F05-3B JYT/转名邦/定价等另行放行。

---

# 2026-10-11｜F05-2 A二轮独立复验：旧四项均PASS，新增自动撤权审计Actor真实性唯一阻断（唯一最新）

- **二轮原生事实已独立证明**：[PR31](https://github.com/suzhe868-arch/mb/pull/31)最终受检B/PR HEAD `68a263add2ae68ba3860f939a78b949589a0bb55` = [Actions 38071814138](https://github.com/suzhe868-arch/mb/actions/runs/38071814138) run.head_sha；官方**36/36真实独立非特权PG16 job success**，冻结旧34个job逐一原文不变，新增真实物理**16/16**、HTTPS**11/11**；59份原生Artifacts，新物理`11676863942`、TLS`11676953699`均未过期；PR16项全部是批准的新增路径，无生产/原旧迁移/Final/IA/C改动。
- **旧阻断 A-F05-2-01/02/03/04 全部 PASS/CLOSED（不要求返工）**：经A审源码及真实PG16/HTTPS负例，原普通销售交接后403、复职不自动恢复旧Vehicle责任、禁止历史created_by事后补造信任源、真正新人工发布同事务创建Vehicle/Cycle/责任/审计、独立两PG16连接验证权限/source/交接与读写最终COMMIT顺序，均满足本批CI-only门禁。
- **A二轮仅新增 `A-F05-2-05` 审计Actor真实性阻断**：在新增`000015_vehicle_responsibility.sql` `f05_2_close_steward_links`内，自动撤权的审计`actor_employee_id`错误地取自被撤权的`responsible_employee_id`，可把System Admin/其他治理人或系统触发的权限变化不可变地记成该员工“本人执行”，违反PDM-25 Final §2与PDM-02治理历史真实性。应准确区分SYSTEM自动动作、真实人工操作者及被影响原负责员工，不许捏造human Actor。
- **已正式写完整单份二轮整改单**：`07_重建工作区/F05-2_A主控二轮独立复验自动撤权审计Actor真实性完整定向整改单_2026-10-11.md`，PR31 A评论`6100420933`。状态 **`F05_2=A_CHANGES_REQUESTED / PR31_NOT_MERGED / NEXT_OWNER=B`**：B继续原`feat/f05-2-vehicle-stewardship-physical-scope`和PR31，仅修复审计归责/添加真实PG16负例，旧34冻结＋2新全部重跑最终同SHA36/36、两原生Artifacts与中文自验再交A，不得擅合并或先施工F05-3。F05整体、F04真实生产、C/H01和V1基线依旧`NOT_READY`。

---

# 2026-10-11｜F05-2 A首次独立复验发现四项对象权限及并发阻断（唯一最新）

- **受检PR [#31](https://github.com/suzhe868-arch/mb/pull/31) CI事实全部有效**：B最终SHA `52078ba41fe205ead1da373bc4bf52fc2610ccd8` = PR HEAD = [Actions 38059665296](https://github.com/suzhe868-arch/mb/actions/runs/38059665296) head_sha；官方36/36独立真实非特权PG16 jobs success（冻结旧34不变，新2），新增A物理11/11、HTTPS9/9，59份原生Artifacts（新`11672373434`、`11673021019`），本PR仅16份批准的新增文件。上述不等于A接受权限语义。
- **A复审结论：`F05_2=A_CHANGES_REQUESTED / PR31_NOT_MERGED / NEXT_OWNER=B`**。四项明确阻断：**01** 交接后原普通销售仍凭Team vehicle.read看他人Vehicle；**02** inactive/旧scope恢复导致旧Vehicle责任自动复活（PDM-02 §9.4禁止）；**03** 旧车created_by+发布时间可事后自建受信发布审计并签发业务owner，缺真实发布事务独立来源；**04** 权限/身份/scope撤销与读取/交接的真实PG16最终COMMIT竞态未测且缺守卫。详见`07_重建工作区/F05-2_A主控首次独立复验权限交接与并发闭环完整整改单_2026-10-11.md`和PR31 A评论 `6099902681`。
- **B立即在原分支一次性完成整单整改**：保留旧34项逐字冻结、补旧owner/复职/可信来源/权限并发正反例，再取得整改最终同SHA36/36（或补充新独立Job）、真实两新Artifacts及中文自验交A二轮复验。A未验收前不得合并PR31或开始F05-3。F05全域、F04正式生产、C/H01及V1产品基线继续`NOT_READY`；不新增生产/账号/资金/第三方权限。

---

# 2026-10-10｜F05-1 A主控独立验收正式通过、PR30合并；F05-2 Vehicle可信责任物理关系及权限并发包正式放行（唯一最新）

- **F05-1已由A独立验收/标准合并**：[PR #30](https://github.com/suzhe868-arch/mb/pull/30)；B最终HEAD `146129d94af0df6570bba7bb17781f1528d00a7c`与官方[Actions #38056158521](https://github.com/suzhe868-arch/mb/actions/runs/38056158521) `run.head_sha`完全相同，**34/34真实独立非特权PG16 jobs success**；新增真实物理/99条约束 **9/9**、TLS/Session/Vehicle七出口 **9/9**；**51份原生Artifacts**，新Source `11671056231`、新TLS `11671291921`；A对照旧F04-4原**32个job正文逐一不变**、仅12项批准白名单新增文件，无旧迁移/Final/IA/生产server/C设计改动。A正面验收评论`6098084371`；**标准merge SHA `5f70588905a8cadbb47a3bc4a8eb6af411b94597`**。正式验收报告`07_重建工作区/F05-1_A主控独立验收PR30正式合并与F05-2可信归属接力_2026-10-10.md`。
- **正式源事实，不能误判为功能已完成**：M94真实94表/608列/435约束/163索引/2120目录项；26表153列、99项原FK/PK/UNIQUE/CHECK实证，Vehicle物理source值`wholesale/mingbang/four_s`。目前**REAL_VEHICLE_SCOPE_PROVEN=0**，即未有可信签发的Vehicle→当前经营负责人/Team/4S代表主体绑定，不是零车辆。员工上传者/Employee.store_id/CRM owner/历史/客户端merchantId/Priority/Recommendation grant均不能发放经营读取权限。6主体×3来源×2周期×7业务出口252项全部保守拒，七类Vehicle detail/list/export/copy/cache/print/history在归属未证时统一`403 F05_VEHICLE_SCOPE_UNPROVEN`且无敏感字段，F04-1原CustomerId精准CRM合法合成读仍为唯一既签正例。F05-1仅CI-only，F05全阶段/正式生产Vehicle读写仍`NOT_READY`。
- **A现正式放行F05-2完整施工单**：`07_重建工作区/F05-2_A主控Vehicle当前管理责任可信关系增量迁移与真实权限闭环完整施工单_2026-10-10.md`，状态**`F05_2_A_RELEASED_FOR_B / B_NOT_STARTED / NEXT_OWNER=B`**。B执行时从最新main新建`feat/f05-2-vehicle-stewardship-physical-scope`，依据PDM-02/04/06/21/22/25及现时F03权限/Scope审查可信车辆业务责任事件/历史；只在一次性隔离非特权PG16**安全增量新版本迁移**和受信合成实体证明合法责任签发、撤权/交接与现时最小Vehicle读，**必须真实正向PG16授权证据**，并发/越权负例完整，不能把created_by或4S source_type自动当Owner，不建立4S组织层；无源动作持续403/显式阻断，不造许可。**冻结旧34个独立真PG16 job，加2个独立真PG16 job，最终36/36同SHA成功**；仅新增F05-2包与新workflow、不得修改000001～000014、旧源码、Final/IA/生产server/C，不得真实生产DDL/账号/资金/第三方写入。B完成归档原生Artifacts和中文自验后交A独立复核，不自合并main、不提前F05-3。
- **产品及设计不变**：F04真实生产路由、F05 Vehicle全域、F06/F07和C/H01高保真、H03/H04及V1整体保持`NOT_READY`，用户生产迁移、资金或真实第三方连接另行独立授权。本节覆盖历史“F05-1等待B交审”的状态指针，不改写其真实工程过程。

---

# 2026-10-10｜F04-4 A二轮独立验收通过、PR29合并；F05-1车辆可信归属与最小安全投影完整施工单放行（唯一最新）

- **正式F04-4验收与合并**：B最终SHA `92452b124c293bfe646cea99d3a8afd46e54f2e8`；[Actions #38053741869](https://github.com/suzhe868-arch/mb/actions/runs/38053741869)同SHA**32/32真正独立非特权PG16 jobs success**，新Source 18/18、Consumer TLS 8/8，45份原生Artifacts，新Source `11670013141`及TLS `11670647334`；A独立比较旧30个job逐一正文未修改，14个新增文件仅在F04-4批准白名单。PR [#29](https://github.com/suzhe868-arch/mb/pull/29)由A二轮正面复核评论`6097766248`正式许可并**标准合并**，merge SHA **`8de73cdf0fa89d3aa02af9a352b5e203e66e8bb8`**。正式A验收报告：`07_重建工作区/F04-4_A主控二轮独立验收PR29正式合并与F05-1交接_2026-10-10.md`。旧阻断`A-F04-4-01=PASS/CLOSED`。
- **DTO实际边界（不能混淆）**：新增8项Current动作有真实意图来源，但只**1项Vehicle source_type修改有合法最小CI合成typed字段**`vehicleId/targetSourceType∈{名邦,4S}`，物理wire/scope仍待后续证实；其余**7项INTENT_ONLY_CI_CONTRACT/REQUEST_SCHEMA_SOURCE_GAP**，禁止冒称8个可执行生产DTO。Current逐原文437项，三向桥接258项，旧215=23同动作有证/192 SOURCE_GAP且全部UNDECIDED、3 Collector禁恢复；Page Manifest标题140 logical与可检表行132差8保留SOURCE_GAP、不造页面、不阻本批签收。F04整体、C/H01、真实业务接口、V1总基线继续`NOT_READY`。
- **唯一新工程工作包**：A已正式下发`07_重建工作区/F05-1_A主控Vehicle可信归属与最小安全投影完整施工单_2026-10-10.md`，**`F05_1_A_RELEASED_FOR_B / B_NOT_STARTED / NEXT_OWNER=B`**。B必须从执行时最新main新建`feat/f05-1-vehicle-scope-safe-projection`，按当前Final/IA/Low-Fi核M94真实Vehicle/ListingCycle/三种车源及员工/4S归属scope，独立字段白名单安全投影和HTTPS现时Session安全；无可信物理scope一律403，不用uploader/store/CRM owner/客户端merchant字段发放业务权限；**禁止本包新DDL、旧迁移/冻结代码改动、生产server接线/资金/第三方业务写入**，将实际缺口/独立迁移方案归F05-2。新专属workflow冻结原32真PG16旧job+独立2个真PG16，最终**34/34个独立PG16 success、B HEAD=PR HEAD=run.head_sha、两新原生Artifacts**与中文交接后交A独立验收。
- **当前A主控已完成所有合法签收、合并、报告与新工作单放行；不需要用户做技术子项确认。** 本节覆盖上一段F04-4 A_CHANGES_REQUESTED / PR29未合并的历史指针，但其审计事实及首次整改单持续留库。

---

# 2026-10-10｜F04-4 B同SHA32/32真PG16成功，但A独立审查发现新增动作DTO业务语义单项阻断（唯一最新）

- **B交审的工程测试/证据真实成立**：PR [#29](https://github.com/suzhe868-arch/mb/pull/29) 指定`feat/f04-4-current-action-coverage-gate`最终HEAD `3e2e5a2f27c2c88dbc595f3312a6520f843c6a84`，与[Actions 38051029689](https://github.com/suzhe868-arch/mb/actions/runs/38051029689) head SHA逐字相同；分页全取真实**32/32独立非特权PostgreSQL16 jobs success**，**45份原生Artifacts**（新Source `11669133122`、新TLS `11669622637`），14个新增文件严格在白名单，不改F03/F04-1/2/3冻结旧代码/工作流及000001～000014/产品Final/IA/C。437条逐原文Current来源、258条旧新三向桥接、旧215个23 matched/192 SOURCE_GAP及3个Collector禁恢复核账仍保留。上述测试绿灯不自动等于A通过。
- **A-F04-4-01独立阻断：8条“typed DTO”全把单一正整数ID当唯一必填动作参数**。明确业务不匹配：`ANNOUNCEMENT_CREATE`强制现有`announcementId`但PDM-24/Current导航没有为“新建”证明既存ID输入；`VEHICLE_SOURCE_TYPE_EDIT`只有`vehicleId`不携目标`source_type`；`MARKUP_RULE_SAVE`只有`markupRuleId`不带规则参数/草稿范围；`SYSTEM_MODEL_MAPPING_BIND`仅有mapping ID而无目标车型绑定事实。验证器/负例只证明单个整数、禁额外敏感字段，无法证明Current操作的有效输入。B必须按Final/IA补**动作语义正确且字段出处真实的最小typed合同**，缺业务请求出处标`REQUEST_SCHEMA_SOURCE_GAP/INTENT_ONLY_CI_CONTRACT`并不得冒称可执行typed DTO；新增变异负例后完整同SHA32/32重新验收。
- **140 vs132 Page Manifest真实差额另立未闭来源事实**：B对Current C/E/P页面物理表行可独立证明132、文件标题声明140，8项差额未能证具体Page ID，已保守`SOURCE_GAP`；A判**本轮不是额外阻断**，禁止捏造8张页面或修改权威Final/IA，可继续后续来源核查。
- **A正式单份完整技术整改单已落主线**：`07_重建工作区/F04-4_A主控首次独立审查增量动作DTO业务语义完整定向整改单_2026-10-10.md`；PR29 A审核评论`6097622718`；**`F04_4=A_CHANGES_REQUESTED / PR29_NOT_MERGED / NEXT_OWNER=B`**。B留原`feat/f04-4-current-action-coverage-gate`分支/PR29一次性整改、自测、完整最终SHA对应32/32真PG16全成功、两新原生Artifacts及中文交接再交A二轮审查。不得自行合并main、改Final/旧迁移/生产server、开启实账户/资金/第三方或启动F04-5/F05。F04全阶段、C/H01高保真与产品V1基线继续`NOT_READY`。本节覆盖旧“F04-4 A已放行/B未开始”的过时指针，不改写F04-3正式验收事实。

---

# 2026-10-10｜F04-3 A二轮独立验收通过、PR28标准合并；F04-4完整施工单正式放行B（唯一最新）

- **F04-3已由A真实验收并标准合并**：[PR #28](https://github.com/suzhe868-arch/mb/pull/28) 为 `closed/merged=true`；B最终HEAD `f86f592056303e9ac6e04ad5af5be93accf41b80` 与 [Actions #38048203956](https://github.com/suzhe868-arch/mb/actions/runs/38048203956) `head_sha`完全一致，**30/30独立非特权PostgreSQL16 jobs全部成功**，新增Source/DTO/语义 **16/16**、TLS/身份与对象权限 **13/13**；41份原生Artifacts，新Source ID `11668517606`、新TLS ID `11668526569`；M94原94表/2120目录及G000014不同版本封印未损。全部16个变更文件均属新增F04-3白名单，原冻结28 job正文未修改。A正面审查评论ID `6097071207`；**GitHub标准merge提交 `a1f7ebcbfdf1184ed2b1e1143afe01e877119694`**。二轮报告：`07_重建工作区/F04-3_A主控二轮独立验收PR28正式合并与F04-4接力_2026-10-10.md`。
- **A-F04-3-01/02/03全部PASS/CLOSED**：B按首次A定向整改单，将占位DTO升级成32项类型化合成Current合同并有OpenAPI/DTO双方字节/schema/字段白名单与敏感字段反例，6个Current新动作与2个System Admin治理新动作核真实Final/IA/Low-Fi语义，Customer认证不能借员工PC Cookie、SystemAdmin控制面与业务经理独立，4S未证scope继续硬拒。只有F04-1原签最小CustomerId对象级CI只读返回合成200；其他未实施业务仍403/501。32项全部 `NOT_APPROVED/NOT_PRODUCTION`，**不是生产32个已上线接口**。
- **F04-2历史来源冻结**：旧218 method+path/198 paths/62个冒号paths，215候选中23个同动作Current证据、192个`SOURCE_GAP`，215项全部`UNDECIDED/CONTRACT_ONLY`，三条Collector连接管理禁恢复持续RETIRE；F04-1/2/3均仅CI-only技术批验收，F04全量Current/真实4S商户管理/客户认证/F05～F07/C-H01及产品基线依然`NOT_READY`。
- **A正式放行新的完整F04-4施工包**：工作单`07_重建工作区/F04-4_A主控Current全量动作覆盖消费合同与隔离安全门禁完整施工单_2026-10-10.md`；**`NEXT_OWNER=B / F04_4_A_RELEASED_FOR_B / B_NOT_STARTED`**；B在执行时从最新main新建独立分支 `feat/f04-4-current-action-coverage-gate`（A没有假称已创建），完整清点Current IA/Navigation/Guard全部真实动作与C/E/P/4S消费缺口，构建三向旧新追溯与新增合法CI-only typed DTO/消费权限门禁；不编造旧192条批准状态，不创4S组织层级、不增加DDL、不启生产/资金/真实第三方。**最终32/32彼此独立真非特权PG16 CI成功（冻结旧30+新增2）**且run.head_sha同B最终HEAD，原生Artifacts和完整中文交接后交A。B不得自行合并main或启动F04-5/F05，C/H01仍未最终验收、按原授权独立并行。
- **唯一下一步：B按F04-4完整单施工、测试、自验与证据交A；本轮无需用户裁决。** 本节覆盖旧“F04-3待B整改/PR28未合并”的历史指针，不更改其历史审计事实。

---

# 2026-10-10｜F04-3 B自验同SHA30/30成功，但A独立复核发现三项合同阻断（唯一当前最新）

- **B真实工程及CI核验成功但不等于A签收**：PR [#28](https://github.com/suzhe868-arch/mb/pull/28) 当前open，指定分支`feat/f04-3-current-action-api-registry` 最终B HEAD `ce99e604d4fb58aa04f859231fd55fd37daa3891`，与原生 [Actions 38045766826](https://github.com/suzhe868-arch/mb/actions/runs/38045766826) head_sha完全一致，`completed/success`、**30/30独立真实非特权PostgreSQL16作业成功**（冻结旧28+新2）；**41份原生Artifacts**，新Source ID `11667603668`、TLS ID `11667613585`，均未过期。PR只新增13份授权文件，旧28份workflows job正文未改变、冻结F03/F04-1/2及迁移/产品Final/IA/Low-Fi未动。新增来源8/8、HTTP/TLS11/11为已证明的隔离合成测试，不是全合同验收。
- **A-F04-3-01 DTO实质性阻断**：30条候选中29条仍用`v1:none/unknown-blocked`或`v1:pending-domain-implementation`，且统一`code+dependency`占位响应；OpenAPI仅定义`CiMinimalCustomer`一个数据Schema，29条业务动作缺逐动作可执行请求/响应字段白名单、对象身份、类型和Schema强校验。`source-guard`只判断`v1:`前缀，没有实质敏感字段负例。沿历史旧号生成`/actions/...-019`也不能自动等同基于Current业务对象产生的接口合同。按Current真Authority落实可类型校验的CI-only DTO；未证字段显式gap，不能编造生产实施。
- **A-F04-3-02 Current新动作Authority语义不足**：6条NEW_CURRENT_ACTION的证据校验当前只证Final文档目标行存在和某Nav行字面动作，并无同主体/资源/业务状态/Domain强约束或真实但不相关引文负例；必须按Current Final+IA+Low-Fi重证并加入相关变异测试。
- **A-F04-3-03 Actor/认证边界错配**：OpenAPI全部30操作声明PC员工Cookie方案，尽管有CUSTOMER主体动作，真实路由全部对CUSTOMER硬拒；不能将PC认证写成客户动作合法认证合同。员工新增/停用/恢复等仅`EMPLOYEE_MANAGER`也漏掉PDM-02 §6.2 System Admin控制平面的合法治理语义。需区分Control Plane与Business Actor、合法客户身份尚未实现的依赖缺口，同时保持当前硬拒和CI-only。
- **A已正式签署整改单并留PR评论ID `6096753581`**：`07_重建工作区/F04-3_A主控首次独立复核DTO实质合同与主体权限完整定向整改单_2026-10-10.md`；当前**`A_CHANGES_REQUESTED / PR28_NOT_MERGED / NEXT_OWNER=B`**。B继续原分支按同份整改单一次性整改上述三项、补真变异负例、完整30/30真PG16旧新回归与最终SHA匹配、两份新原生Artifacts和中文交接，再交A二轮独立验收。**不得B自行合并、启动F04-4、扩大生产/DDL/资金/第三方或变更已冻结规则**。H01未签、F04整个阶段及产品基线依旧`NOT_READY`。此段覆盖下方旧“F04-3 B_NOT_STARTED”的过时历史指针，不改写F04-2已验收事实。

---

# 2026-10-10｜F04-2 A二轮独立验收正式通过并合并PR27；F04-3完整施工单已放行B（唯一当前最新）

- **A真实已合并PR27：** [PR #27](https://github.com/suzhe868-arch/mb/pull/27) `closed/merged=true`；最终B提交`d09038917c91446eb8914f53f3e1881345ba7d1a`；官方[Actions 38041020114](https://github.com/suzhe868-arch/mb/actions/runs/38041020114)与B最终HEAD完全同SHA、`completed/success`、**28/28独立真实非特权PostgreSQL16 jobs成功**（既有26全部冻结＋新2），新Authority 11/11、4S loopback HTTPS 9/9；37份原生Artifacts含新`11666040902/11665941117`、旧M94原94表与G14隔离封印无削弱。PR27共13个授权文件，只在`engineering/f04/authority-route-mapping/**`和新独立workflow；A正面验收评论ID `6096462233`；**标准merge提交`70d1f68490c851823cf5d1415c703667c0305cb4`**。正式报告：`07_重建工作区/F04-2_A主控二轮独立验收PR27正式合并与F04-3交接_2026-10-10.md`。
- **上轮A双阻断均关闭**：F04-2 215个旧候选当前按真实同主体/同动作/Final/IA/Low-Fi语义重新核证后只有**23 `EVIDENCE_MATCHED` + 192 `SOURCE_GAP`**，原粗粒度105中的82下调缺口并有105条逐行复核。咨询Consultation归PDM-15，候补Waitlist归PDM-18/F06，F04合同责任与实际Domain实施分开；假Nav/PDM证据和真实但**不同动作**引用均有独立负例。旧218 methods/198 paths/62个冒号paths与3 Collector禁恢复仍原样保守；所有215依旧`decision=UNDECIDED / current_stage=CONTRACT_ONLY`，23不是已批准老路由，192不能私自恢复。
- **本批只验收CI-only技术能力，不是正式业务完成**：System Admin→4S控制面仅是隔离HTTPS最小只读，真实4S商户对象绑定尚无证据，目标一律403；正式CRM/车辆价权/锁车交易退款/JYT-CDN/真实生产路由与C/H01高保真仍有缺口。F04整体及产品基线`NOT_READY`。
- **A已独立正式签发下一完整工程施工单：** `07_重建工作区/F04-3_A主控Current新接口注册表DTO与路由安全门禁完整施工单_2026-10-10.md`。**NEXT_OWNER=B / F04_3_A_RELEASED_FOR_B / B_NOT_STARTED**，B需从执行时最新main建立新指定分支`feat/f04-3-current-action-api-registry`（尚未假称分支已创建），一次性完成Current PDM/IA/Low-Fi动作证实的**新**HTTP/DTO合同目录、23匹配/192缺口/3禁恢复追溯、CI-only安全路由和真实会话/object scope/错误/敏感出口门禁；所有未实现F05/F06/F07业务不得假200或生产启用。最终**30/30真正独立非特权PG16 CI jobs（冻结原28+新2）**、run.head_sha同最终B HEAD，独立原生Artifacts及完整中文交接后交A。B不得自行合并main、扩大生产/DDL/4S真实账号或资金权限，也不得启动F04-4。
- **唯一正式下一步：B按新F04-3施工单整包施工、完整CI及证据交A复验；C设计原授权独立并行，A等待正式交付再独立验收。** 本段覆盖旧“F04-2未通过/PR27未合并”的历史状态叙述，不修改历史验收事实。

---

# 2026-10-10｜F04-2 B自验28/28成功、A独立审查发现Authority语义错配及Domain责任错分（唯一当前最新）

- **B真实证据合格但不等于A通过**：PR [#27](https://github.com/suzhe868-arch/mb/pull/27) 原B分支`feat/f04-2-authority-route-mapping`受检HEAD `b3535bbe70c0708e4ba386293e7298408f163da8`与真实[Actions38034145668](https://github.com/suzhe868-arch/mb/actions/runs/38034145668) head SHA一致，**28/28独立非特权PostgreSQL16作业success**（冻结旧26+2新）；新Authority原生PG16 **8/8**与新4S真实HTTPS **9/9**，37份原始Artifacts，新Artifact IDs 11662184264/11662909011、M94原94表2120对象封印PASS；11文件严格新增白名单。B所做4S CI-only System Admin最小身份自检/未证明商户归属均403拒绝，本轮无单独安全阻断；此前F04-1/旧F03源码与正式PDM/IA没有改动。
- **A-F04-2-01阻断：语义失配**。B矩阵215行中**105行标`EVIDENCE_MATCHED`、110行`SOURCE_GAP`**，但多条真实引文引用了**另一种动作**：LEGACY-001微信会话↔手机号授权；LEGACY-019创建Consultation↔“C01打开车辆”；LEGACY-020登记候补↔“C01打开车辆”；LEGACY-069～072咨询处理/完结/转派↔“修改内部客户称呼”；LEGACY-079车辆发布↔“进入内部模式”；LEGACY-085价格修改不可借“内部模式”证明编辑权限。当前`source-verifier.mjs::quoteCheck`只验证真实文档字节存在，不核动作/主体/PDM相符，原8/8无法识别此类错配。B须反查所有105`EVIDENCE_MATCHED`、更换真正同动作权限来源或降`SOURCE_GAP`、补真实但**不相关**引文的负例与重审前后数量统计，不能编造批准KEEP/MODIFY。
- **A-F04-2-02阻断：Domain/Owner错配**。LEGACY-019 Consultation创建与LEGACY-020 Waitlist候补按URL前缀被分至`VEHICLE/F05`，实际PDM-15/18独立业务域；尤其Waitlist属PDM-18、下游F06锁车候补，不得借vehicle前缀移交F05。明确区分F04 HTTP路由合同Owner与各业务Domain真实实施Owner，真缺口记`OWNER_REVIEW_GAP`；补跨域真实对应测试和中文交接。
- **正式一次性A整改单**：`07_重建工作区/F04-2_A主控首次独立复核Authority动作误配完整定向整改单_2026-10-10.md`，PR27已有A审核评论ID `6095831957`。**A_CHANGES_REQUESTED / PR27_NOT_MERGED / NEXT_OWNER=B**。B只能在原`feat/f04-2-authority-route-mapping`完成本批全部整改，自审/更新原生Artifacts、重新取得最新HEAD同SHA完整**28/28独立PG16 success**后交A；不自行合并或启动F04-3。F04-1 PR26已签并合并、F04整体/真实4S治理/F05～F07/C-H01高保真/三端UAT/产品基线均`NOT_READY`。本段覆盖以下旧“F04-2 B未开始”历史指针，不重写旧事实。

---

# 2026-10-10｜F04-1 A二轮独立验收通过、PR26正式合并；F04-2完整施工单已正式放行B（唯一当前最新）

- **F04-1最终验收且标准合并完成**：PR [#26](https://github.com/suzhe868-arch/mb/pull/26) 受检B HEAD `6af50664ec230f11caf62c73562449069d086b15`；同SHA真实[Actions 38031443210](https://github.com/suzhe868-arch/mb/actions/runs/38031443210) **26/26独立非特权PG16 job全部成功**（旧24+F04-1 2），新F04 Route-security原始HTTPS日志 **20/20**、Contracts-inventory原始PG16日志 **10/10**，33份run原始Artifacts；合并SHA **`20479f3712a5aaa862f7db4378d8db2369695d79`**，已实查PR `closed / merged=true`。A正式复验：`07_重建工作区/F04-1_A主控二轮独立验收PR26正式合并与下一阶段归属_2026-10-10.md`。F04-1仅**隔离CI合同/安全路由**子批签收，并非218历史API上线或F04全阶段通过。
- **三项前轮阻断已由A独立关闭**：A-F04-01源OpenAPI**198真实paths/218 method+path/62含冒号paths**全与新台账匹配，0来源路径误归，独立严格Parser+结构反例；A-F04-02旧Collector连接GET/PATCH/TEST三条`RETIRE/FORBIDDEN`，其余215个旧候选**`UNREVIEWED_SOURCE_GAP`**，没有伪装成Final批准可改/可用；A-F04-03`crm.customer.view`当前独立能力＋目标**Customer exact object scope**＋current owner＋有效Session/Role个人deny才可隔离读取最小customerId，真PG16/TLS的owner变更、越Team、越界/撤权/跨店测试通过；无合法目标scope则403。
- **A正式放行下一个完整B工程包F04-2**：工作单`07_重建工作区/F04-2_A主控现行215接口Authority映射与4S账号安全控制前置完整施工单_2026-10-10.md`；工作分支`feat/f04-2-authority-route-mapping`，由B从开始时最新main创建。F04-2A逐行按真实Current IA/Low-Fi/PDM映射215历史候选，证据缺口须标明不能编造；F04-2B在CI-only真实PG16/HTTPS做System Admin→4S账号控制面**只读资格/身份预检，业务修改硬禁**；F04-2C全链28个独立真实PG16 jobs（冻结旧26+新2），B负责一次性实施/测试/自审/证据交A；**本次A只签发，未宣布B分支已建或B已施工**。
- **NEXT_OWNER=B / NEXT_TASK=F04_2_CURRENT_AUTHORITY_MAPPING_AND_4S_PRECHECK**；禁止B自行合并、擅改旧F03/F04-1或PDM、未授权生产/微信/JYT/资金与F04-3。剩余215项Current Authority、F04实际4S治理和CRM、F05～F07真实业务、C/H01高保真及三端UAT仍待后续真实实现/验收；`PRODUCT_BASELINE_STATUS=NOT_READY`。本段覆盖以下F04-1“待B整改”的历史指针（不删除旧证据）。

---

# 2026-10-10｜F04-1 B自验26/26通过，但A独立审查发现三项接口来源与对象权限证明阻断（当前唯一最新）

- **本轮B交审事实保留**：指定`feat/f04-1-contract-safety-gate`分支受检HEAD `cb5a96699a4b93bc42dc0f81188c22ee8d5b49c7`，真实同SHA[Actions 38029582060](https://github.com/suzhe868-arch/mb/actions/runs/38029582060) `26/26`独立PG16 `completed/success`（冻结旧24+F04新增2），新HTTP 15/15、Inventory 7/7，10个新增文件严格白名单，未改旧F03服务/迁移/CI；当前B仅`READY_FOR_A_REVIEW`，**不等于A验收成功**。
- **A独立复核不通过**：A-F04-01 实际OpenAPI **198个不同路径/218 method+path**，B仅记录136个不同路径、62条含冒号的路径错归前一条（`phone:authorize`、`price-access:unlock`、`connection:test`等），旧Inventory测试同错正则自证；A-F04-02 218条全部`MODIFY`，甚至已禁恢复Collector连接GET/PATCH/TEST，须按真实Final/IA分类，禁恢复`RETIRE`、未核实`UNREVIEWED_SOURCE_GAP`不得假认；A-F04-03 已允许的最小客户本人owner正向HTTP读没有证明目标Customer本身与当前data scope的对象级授权链，需真实对象范围证明和跨Team/store正反例，缺证回安全拒绝。
- **正式一次性整改单**：`07_重建工作区/F04-1_A主控首次独立审查与接口溯源权限证明完整定向整改单_2026-10-10.md`，并已写[PR26审查评论](https://github.com/suzhe868-arch/mb/pull/26)。**A_CHANGES_REQUESTED / NOT_ACCEPTED / NOT_MERGED / NEXT_OWNER=B**。B留原`feat/f04-1-contract-safety-gate`分支一次性整改，修复可解决问题并取得最终新HEAD一致的26/26独立真PG16成功，归档完整源路径、负例、权限证明及中文交接后交A；**禁止自行合并PR26及开启F04-2**。
- F03-V已验收合并PR25，已签产品Final/既有工程封印不变；C/H01高保真、F04全业务、F05～F07及产品整体仍`NOT_READY`。本段覆盖下文历史`F04-1首次放行、B未施工`的过时指针，不覆盖历史证据。

---

# 2026-10-10｜F03工作包V A独立验收PR25已合并；F04-1接口合同与隔离安全路由完整施工单正式放行（当前唯一最新）

- **F03-V A验收及标准合并完成**：B受检提交 `2ee8c0327b7e59792cf22e908b12d780494fa3a5` 与 [真实Actions 38027132087](https://github.com/suzhe868-arch/mb/actions/runs/38027132087) head SHA完全一致；**24/24独立真实非特权PostgreSQL16作业成功**（旧17+G3+P2+V2），V新增两个独立作业各7/7。A审查59条（45能力+14治理）与59条负断言、M94/G000014双物理封印、九文件白名单及原始schema/source/catalog；标准[PR25](https://github.com/suzhe868-arch/mb/pull/25)已合并，merge SHA `1a0f0d85eb6cc7d120d754fc82d1a4131f3b653e`。独立A报告：`07_重建工作区/F03工作包V_A主控独立验收PR25合并及阶段技术裁决_2026-10-10.md`。
- **A完成三个遗留能力的真实责任归属技术裁决**：内部批发价独立权限读取以及在正常Vehicle编辑下附带的内部价修改，由**F05车辆价格业务＋F04现时对象授权/安全路由**正式实现；4S账号管理由**F04 System Admin控制面**实现。V源覆盖矩阵原3项`F03_STILL_OPEN`作为历史审计保留，正式下游状态为`A_RESOLVED_TO_F04_F05_OPEN_DEPENDENCY`，**不是已实施**。未知vehicle→Team/4S商户归属、独立Vehicle/内部价权限/数据scope或合法对象状态一律保持硬拒；4S名邦内部价HARD DENY，4S不可互管。
- **A已签发下一完整工程包F04-1**：施工单`07_重建工作区/F04-1_A主控接口合同与安全路由启动完整施工单_2026-10-10.md`，分支`feat/f04-1-contract-safety-gate`；B须从执行时最新main建立，连续完成历史218接口的可追溯核账（缺证标SOURCE_GAP不得编造）、新现行route/DTO/权限及错误合同、CI-only真实PG16安全路由、F05～F07/H03/H04消费合同、B全包自验，最终**26/26独立PG16成功（冻结旧24+新2）且与B最终SHA一致**后交A。不准修改旧迁移/服务/产品Final、未经授权开放生产或自行合并。
- **NEXT_OWNER=B；NEXT_TASK=F04_1_CONTRACT_AND_SAFE_HTTP_CI_PACKAGE**。F03技术**仅已验收隔离合成安全范围**，F04/F05/F06/F07真实接口、C/H01高保真及三端UAT均未最终验收；`PRODUCT_BASELINE_STATUS=NOT_READY`。本段覆盖以下历史旧“V待B执行”快照，历史不删除。

---

# 2026-10-10｜F03 G/P双工作包A二轮正式验收、PR23/PR24合并；V全量核账与最终总回归工作包正式放行（当前最新）

- G包：B最终SHA 19af2955d81ac14d79e0c4e6adc661a3a1aabd8e，真实同SHA Actions38025357614 **20/20独立PG16全成功**（G1 16/G2 7/G3 4、旧N21/M31/L29/K29/J27/I27完整回归）。A-G-01已独立验证当前真实owner/responsible必须沿最后合法后继immutable receipt/audit链一致；计划员工治理最后COMMIT前再次重验，两个PG16会话竞争或源漂移真正全事务ROLLBACK。000014仅2个handover completed CHECK，旧94表608列435约束163索引2120项结构对象数保持，新真SHA 863538a8dd81e85c8f50bec2d18ad714f6c3d87abf3b10844a3c80421d54cdb1；原SOURCE/全catalog PASS。A标准PR23已合并，merge SHA 2073397070270aeda3056b75a21112e81763cc1a。
- P包：B最终SHA 97087f2aab4dcb7ad94cd5ea6cc4777b76900459，真实同SHA Actions38024572379 **19/19独立PG16全成功**（P1 10/P2 11、旧17全回归）。A-P-01已以真实对象级fail-closed方式修正：员工拥有CRM Team权限≠有任意可见Vehicle业务查询/导出权；旧M94没有可信vehicle→Team/4S所属关系时所有员工对象业务出口不返回字段、明确P_VEHICLE_SCOPE_UNPROVEN并交F04/F07；未冒称真实业务已开放。无DDL，原94表2120项完整SHA/SOURCE原字节不变。A标准PR24已合并，merge SHA 2c65bbfd04fbba5438160f8b0e8fe8274f15d940。
- A双包完整正式验收报告：07_重建工作区/F03双工作包G_P_A主控二轮独立验收PR23_PR24正式合并闭环_2026-10-10.md。**下一包V正式放行**：07_重建工作区/F03工作包V_A主控工程覆盖核账跨模块总回归与后续承接完整施工单_2026-10-10.md；分支feat/f03-package-v-coverage-final-gate，V1核账旧45权限+14治理的当前真实main完成/未做/硬DENY/正式F04～F07承接，V2两个真实隔离PG16跨模块与不同000013/000014 schema封印总回归，V3真实缺口/工程阶段候选和下游交接，总共**24/24独立PG16作业要求**（旧17+G3+P2+V2），B内部完成整个V包自审/回归/整改后一次性交A，**B不得自行合并或宣告F03全完成**。
- **NEXT_OWNER=B**，G/P技术本批签收不代表真实离职权限、正式车辆导出/会员查价、F03全模块或C/H01高保真已生产可用；PRODUCT_BASELINE=NOT_READY。

---

# 2026-10-10｜F03多任务包G/P首次A集中复核：两项定向整改、保持双包一次性交A（当前最新）

- G原分支 feat/f03-package-g-governance-closure，受检最终SHA 708fb889db8c473cc1cd92d38896aa1bbfdfb973，Actions38022820421 同SHA 20/20独立真实PG16成功，新G1 15/G2 7/G3 4及旧N21/M31/L29/K29/J27/I27等全部旧版回归成功；000014仅替换handover_batches/items两CHECK，新物理目录2120项数量不变，SHA863538a8dd81e85c8f50bec2d18ad714f6c3d87abf3b10844a3c80421d54cdb1。**A-G-01阻断**：G2计划停用/降权/调店只验证完成SG06批次历史及源员工无活跃职责，未再核业务对象当前owner/responsible确实符合真实最后合法后继receipt链，可能放过无审计直接漂移。
- P原分支 feat/f03-package-p-field-projection，受检SHA82fec31338040c020f147a1107bdbddc5364d916，Actions38020721875 同SHA 19/19独立PG16成功，新P1 10/P2 6和旧17作业全过，原M94 2120项零物理变化。**A-P-01阻断**：employee vehicle查询/导出只以crm.customer.view+当前员工请求Team作权限，未证明请求vehicle自身属于该业务对象范围/4S归属，缺来源还不应给business export。
- 两包正式统一整改：07_重建工作区/F03多任务包G_P_A主控首次独立审查与两项定向整改清单_2026-10-10.md。B留在G/P原分支各自包内自行一次修复、完整回归与逆向自审，再分别取得与最终SHA相同G20/20、P19/19独立真实PG16成功，**两个包都READY后统一交A集中验收**；两包均A_CHANGES_REQUESTED、未合并、V仍PREPLAN_NOT_RELEASED，NEXT_OWNER=B。
- F03-2整体、C/H01高保真及产品基线NOT_READY。

---

# 2026-10-10｜F03-2-2N A二轮正式验收PR22合并；F03多任务包G+P正式同批放行（最新）

- **2N已正式A签收**：B最终HEAD`5ae79377c5c09155ac1b04105e5a265a61ced20e`，最新同SHA[Actions38018758218](https://github.com/suzhe868-arch/mb/actions/runs/38018758218) **17/17独立真实PG16 job success**，N94 **21/21**含A-N-01新增7个跨batch/source/Team派生Priority真实性测试及事务漂移全回滚，旧M31/L29/K29/J27/I27及其余独立原版全成功。94表608列435约束163索引2120全catalog一项不变，无000014；真实N+M来源原始PG16字节、完整目录封印PASS。标准[PR22](https://github.com/suzhe868-arch/mb/pull/22)已merge，merge SHA`32419cff011b15c1e2f1f202d257f7b2c00cb30d`。A正式验收：`07_重建工作区/F03-2-2N_A主控二轮独立验收及PR22正式合并闭环_2026-10-10.md`。
- **已按用户同意启用多任务包连续执行机制**：A一次性签发工作包G`07_重建工作区/F03工作包G_A主控SG06真实收口与F03-2-3员工治理完整施工单_2026-10-10.md`，指定`feat/f03-package-g-governance-closure`，内含G1 SG06正式item/batch安全收口（仅A批准000014扩两旧CHECK completed且旧DDL保持不变）、G2计划调店/降权/停用、G3突发inactive/复职/旧会话撤权及最后接客/管理员保护，**20/20独立真实PG16 jobs**（新G三独立+旧17全独立）成功；工作包P`07_重建工作区/F03工作包P_A主控F03-3字段权限与安全投影完整施工单_2026-10-10.md`，指定`feat/f03-package-p-field-projection`，内含P1字段/等级价格权益投影、P2导出/历史/缓存撤权、P3对F04～F07正式字段合同交接，**19/19独立真实PG16 jobs**（新P两个+旧17全独立）成功且零DDL。两包不同分支、禁止未经合并的互相依赖/自行PR合并，B各包连续开发自审/整改直到双包READY，**一次性统一交A独立审查**，不需要每个小子项用户来回切换。
- 工作包V（F03旧45能力+14治理逐项核账、真正跨模块阶段总复审）继续**预规划未放行**，待G/P双方经A独立接受/合并再正式签发；不能把旧矩阵53个DEFER一律当F03新实施义务或已验收。任何不可证新业务规则/未授权DDL仍需A安全裁决。
- **NEXT_OWNER=B**，下一是`F03_PACKAGE_G_AND_P`双包完整施工。F03-2整体、C/H01高保真和V1产品基线`NOT_READY`；无正式生产员工状态、真实资金或API上线授权。

---

# 2026-10-10｜F03-2-2N B真实PG16 CI全绿，但A独立复核Priority跨批来源映射缺口（当前最新）

- B最终SHA`70fdae880cfc707a405d607378aa5ab172b432a0`，同SHA真实[CI38016127258](https://github.com/suzhe868-arch/mb/actions/runs/38016127258) **17/17独立PG16 job success**：新N14/14、旧M31/31、L29/29、K29/29、J/I27/27，其余旧H/G/F/E/D/C/B/A/F03-1各自独立成功；94表608列435约束163索引2120完整catalog项一项未改，N真实SOURCE、原字节和全目录校验PASS。仅11个新N模块/专用workflow文件，旧000001～000013及H/I/J/K/L/M服务均未修改。
- **A-N-01技术安全阻断**：新N`priority()`只验证当前trigger Demand负责人和任一最新可信Demand收据，**未证明当前Priority待交接item的原员工、所属batch和授权Team与对应Demand正式交接事实吻合**；代码引用旧handover_items上不存在的`scope_team_id`后自行回退当前receipt Team，等同未验Team来源。其它批次已经合法Demand交接可能被错误拿来证明当前批次的Priority也已承接，违反2N N03/N04/PDM-03逐项来源证明。原N14项未覆盖**跨batch pending Priority+仅旧batch Demand receipt**、错误source/Team负例。唯一A正式整改单：`07_重建工作区/F03-2-2N_A主控独立复核Priority派生跨批次来源证明定向整改单_2026-10-10.md`；B沿用原`feat/f03-handover-reconciliation-2n`，只修新N服务/合成数据/PG16测试/交接，最终同SHA17/17成功交A。其余已过门禁保持冻结。
- **A_CHANGES_REQUESTED / NOT_ACCEPTED / NOT_MERGED / NEXT_OWNER=B**；多任务包G/P/V已预排但继续`A_PREPLAN_NOT_RELEASED`，不得提前施工或修改既有2N授权。F03-2整体/C-H01/产品基线`NOT_READY`。

---

# 2026-10-10｜F03-2-2M A二轮正式验收通过PR21合并；F03-2-2N已签发（当前最新）

- **2M经A二轮独立验收并正式合并**：B最终SHA 556720eb8a80a5ff83fe0a02fc54ea44cf40476e，同SHA[CI 38010658030](https://github.com/suzhe868-arch/mb/actions/runs/38010658030)**16/16独立PG16成功，新M94 31/31**（含A-M-01新6项实际合法converted_to_transaction来源、五种伪released、prepared漂移、CAS后源码失真全rollback及双会话锁竞争），旧L29/K29/J27/I27全部原版本完整通过。旧93表2074项零改，新000013仅1张不可变Transaction收据表后94表/608列/435约束/163索引/2120完整目录项，仅增46，PG16全目录和SOURCE原始字节PASS。A审查22个白名单变更，标准[PR21](https://github.com/suzhe868-arch/mb/pull/21) merge SHA 71847176ccd2fd93a323fe274f0f144d4aea2712。正式验收报告：07_重建工作区/F03-2-2M_A主控二轮独立验收及PR21正式合并闭环_2026-10-10.md。
- **下一2N正式放行B**：SG06已有6个域H/I/J/K/L/M的受限CI单域不可变收据，Priority只能从trigger Demand当前合法责任派生。但数据库handover_items和batch现物理CHECK均**没有completed终态**，不能据单域已转派宣布实际整批完成/解除离职权限。因此A正式签发**全域收据安全只读对账与收口前置门禁**：07_重建工作区/F03-2-2N_A主控SG06全域收据对账与正式收口前置门禁只读施工单_2026-10-10.md；分支 feat/f03-handover-reconciliation-2n，只能新增新N服务/独立CI、不批准旧DDL或生产更新，**17/17个独立真实PG16 job全成功**（包含旧M31/L29/K29/J27/I27原版完整回归），只读输出绝不得使handover_batches/items completed或员工禁用。
- **NEXT_OWNER=B**。完整F03-2/正式SG06生产交接/C-H01高保真仍未最终验收，PRODUCT_BASELINE=NOT_READY。

---

# 2026-10-10｜F03-2-2M B自验全绿，A发现来源Lock真实转换缺证，正式定向整改（当前最新）

- B分支`feat/f03-transaction-responsible-handover-2m`最终受检SHA`608779547db3f6ffce76f8c7ee030e4f30242eeb`、同SHA真实[Actions38008698898](https://github.com/suzhe868-arch/mb/actions/runs/38008698898)**16/16独立PG16作业success**、M25/25、旧L29/K29/J27/I27各自在冻结旧库完整成功；H/I/J/K/L/M六域30向Key冲突及并发通过。旧93表2074物理catalog定义零改，新增000013仅一张Transaction收据表后94表608列435约束163索引2120目录定义(+46)，PG16 SOURCE原始字节及完整catalog PASS。
- **A-M-01唯一阻断**：新M`service.mjs`仅凭source Lock`lock_status='released'`加customer/vehicle/cycle相同就承认Transaction来源合法，完全未校验PDM-19正式必须存在的`converted_to_transaction`类真实历史结束原因；合成fixture所有source Lock都为`released`但没有`end_reason`（NULL），因此M25全绿没有证明合法来源。正式A完整整改单：`07_重建工作区/F03-2-2M_A主控独立复核来源Lock合法转交易证据定向整改单_2026-10-10.md`。B在原分支只补新M source转换真实性Guard及prepare/commit/precommit时序实测、正确合成fixture和源审计证明，最终同SHA16/16全成功后交A。冻结旧000001～000013及所有旧CI/业务服务不改。
- **A_CHANGES_REQUESTED / NOT_ACCEPTED / NOT_MERGED；NEXT_OWNER=B**，暂不进入2N；完整F03-2、C/H01和产品基线`NOT_READY`。

---

# 2026-10-10｜F03-2-2L A二轮正式验收PR20已合并，下一F03-2-2M正式施工单已签发（当前最新）

- **2L已A正式签收并合并**：B最终SHA 408e7a581264c43220ce3cc326a73ee610c051a5、同SHA [真实CI38005762988](https://github.com/suzhe868-arch/mb/actions/runs/38005762988) **15/15独立真实PG16作业success**；新L29/29含8项到期事务竞态与全回滚测试，旧K29/29、J27/27、I27/27及其它全部旧模块独立成功。旧92表2028完整目录不变，新000012仅一张Lock收据表后93表596列420约束159索引2074项(+46)，结构SHA 9ab7221f9a0f5f81c0af37441d4cd5b824e2ac7322f8d40f952ba2cecea0e2f9，真实SOURCE字节和全catalog校验PASS。A-L-01用PG数据库即时钟CAS及正式提交前throw整事务ROLLBACK完全闭环；旧SQL/旧CI/业务Final不改。标准 [PR20](https://github.com/suzhe868-arch/mb/pull/20) merge SHA 9ed6db2a6aeefb382298460004768edd11df20b6。正式A验收：07_重建工作区/F03-2-2L_A主控二轮独立验收及PR20正式合并闭环_2026-10-10.md。
- **下一批2M已A技术裁决放行**：依据PDM-19 Transaction独立负责人及真实资金/交易终态不可变，仅CI隔离PG16合成Transaction current responsible单域CAS+append-only receipt；H/I/J/K/L/M六域RequestKey 30方向必须双向保护，旧000001～000012完整冻结，新000013最多一张Transaction收据表。仅允许旧H/I/J/K/L service commit/retry跨域Key与结构封印最小守卫。完整施工单07_重建工作区/F03-2-2M_A主控SG06_Transaction交易负责人单域移交完整施工单_2026-10-10.md，B指定 feat/f03-transaction-responsible-handover-2m，最终**16/16个独立PG16作业成功**含旧L29/K29/J27/I27原版全测试后交A，不能自行合并。
- NEXT_OWNER=B。F03-2整体、C/H01高保真、真实SG06离职交接及产品基线均NOT_READY。

---

# 2026-10-10｜F03-2-2L B自验CI全绿，A独立复核发现锁车到期临界事务阻断（当前最新）

- B原分支`feat/f03-lock-responsible-handover-2l`，最终受检HEAD `244b68a2e168624e2a4f65aa17fc1cc587d54fcf`，同SHA真实[CI38003745347](https://github.com/suzhe868-arch/mb/actions/runs/38003745347)**15/15独立PG16 job全成功**：新L21/21、旧K29/29、J27/27、I27/27及其余全部旧模块独立回归成功。旧92表2028物理目录不变，新增000012唯一一张合成Lock收据表后93表/596列/420约束/159索引/2074完整键(+46)，新结构SHA`9ab7221f9a0f5f81c0af37441d4cd5b824e2ac7322f8d40f952ba2cecea0e2f9`，完整catalog/source原字节校验PASS。H/I/J/K/L跨域Key真实20个方向与5会话并发测试通过。保留B已完成合格项。
- **A-L-01阻断**：`service.mjs`的`facts()`仅在早期第59行以`new Date()`检`expires_at`，真正锁车负责人CAS第118行只校验`lock_status='active'`/旧employee，**没有DB当前时钟有效期谓词，也没有最终COMMIT前过期的原子回滚守卫**；Lock可在第一次检查与CAS或后续事务提交间自然到期而仍成功转派。旧L21测试无实际中途到期的PG16时序用例，违反L03/L04/L10门禁。正式唯一整改单`07_重建工作区/F03-2-2L_A主控独立复核锁车到期事务竞态定向整改单_2026-10-10.md`，要求B只改新L服务/测试（旧迁移、H/I/J/K均不可变），增加PG16真正`before_update`和`after_receipt/before_commit`跨有效期时序与整事务回滚，最终同SHA15/15全成功并更新B交接。
- **A_CHANGES_REQUESTED / NOT_ACCEPTED / NOT_MERGED / NEXT_OWNER=B**。不能先验收/合并2L或启动2M。产品F03-2整体/C-H01仍`NOT_READY`。此段覆盖下文历史已放行2L的旧状态，历史保留。

---

# 2026-10-10｜F03-2-2K A独立验收通过标准PR19合并，F03-2-2L正式施工单已放行（当前最新）

- **2K已正式签收**：B最终SHA `8cc1f7b6e7df5ecdb57d6e4d2b8be7e3627bde7b`、同SHA真实[CI37999317037](https://github.com/suzhe868-arch/mb/actions/runs/37999317037) **14/14独立PG16成功，K92 29/29、J91 27/27、I90 27/27**，旧H89、G/F/E88、D86、C84、B82双、A81、F03-1认证/HTTPS80全独立通过；H/I/J/K四Domain相同Key全向/四会话并发与Waitlist交接不可变收据已受限验证。旧91表/1982目录项零更改，新000011仅新增一张Waitlist不可变收据表至92表/584列/405约束/155索引/2028完整目录项（+46），新结构SHA `6b6932e4855074ed63ec0ceda89b568e1b4b1f62d111c759f9c7a77a841a3c76`，SOURCE原始字节与catalog三域校验PASS。标准[PR19](https://github.com/suzhe868-arch/mb/pull/19) merge SHA `3fdb965733fce0750bc00a4a6b04f12e338fda5e`。完整A验收报告`07_重建工作区/F03-2-2K_A主控独立验收及PR19正式合并闭环_2026-10-10.md`。
- **下一批2L已正式技术裁决并放行B**：根据PDM-18/03/19，只限新隔离PG16的**正式Lock当前负责人单域受控移交**、锁车有效期/真实Deposit独立守卫、原价格/LockRequest/Waitlist/Transaction不反写、H/I/J/K/L五Domain全局Key双向阻重。旧000001～000011及旧CI/已签规则全部冻结；新`000012`最多一张Lock逐项不可变收据表，必要时旧H/I/J/K只限commit/retry跨域Key守卫新表检查。正式施工单`07_重建工作区/F03-2-2L_A主控SG06_Lock正式锁车负责人单域移交完整施工单_2026-10-10.md`。B指定分支`feat/f03-lock-responsible-handover-2l`，**新旧共15/15独立PG16 CI成功**（K29/J27/I27均完整回归）后交A，B不得自行合并或进入下一批。
- **NEXT_OWNER=B**；C/H01高保真、完整F03-2与产品基线继续`NOT_READY`，不宣称生产上线。

---

# 2026-10-10｜F03-2-2J A二轮正式验收通过PR18合并，下一F03-2-2K已放行（当前最新）

- **F03-2-2J A正式签收并合并**：B最终SHA `8abd2849877ff7884ea3ff2c27cde59f14b70ce7`、同SHA[真实PG16 CI `37996676662`](https://github.com/suzhe868-arch/mb/actions/runs/37996676662)**13/13独立PG16 job成功**，旧I90真实27/27、新J91真实27/27、H89/G/F/E88/D86/C84/B82双/A81/F03-1认证与HTTPS80全部独立成功，前轮A-J-01缺失I90完整回归已关闭。旧90表1936完整目录对象未改，新000010只添1张Consultation不可变收据表至91表/572列/390约束/151索引/1982目录对象(+46)，SOURCE全目录及原始字节校验PASS；H/I旧服务仅为A已授权的J跨域Key守卫最小补强。标准[PR #18](https://github.com/suzhe868-arch/mb/pull/18)合并SHA `367ff5d16fe913f5e6b2002abd559522f4cc4d26`。正式验收：`07_重建工作区/F03-2-2J_A主控二轮独立验收及PR18正式合并闭环_2026-10-10.md`。
- **F03-2-2K A技术裁决并正式放行B**：依据PDM-18 Waitlist既有responsible固化、inactive正式移交、`ended_at`/active Lock/锁车申请关系与候补顺序不反写，仅在隔离真实PG16合成Waitlist单域CAS、不可变收据、四域H/I/J/K全局Key唯一及旧完整回归；允许本批000011最多一张新收据表及H/I/J旧服务中仅跨域Key最小Guard兼容补强，旧迁移/旧CI完全冻结。完整施工单`07_重建工作区/F03-2-2K_A主控SG06_Waitlist候补负责人单域移交完整施工单_2026-10-10.md`。B分支`feat/f03-waitlist-responsible-handover-2k`，**必须新旧共14个独立PG16 CI全绿**（含旧J91/I90各完整27例），最终HEAD同SHA才交A，不得B自行合并。
- **NEXT_OWNER=B**，C/H01及完整F03-2/产品基线仍`NOT_READY`。此段覆盖后文过时的J旧I90待整改历史记录，历史不删除。

---

# 2026-10-10｜F03-2-2J B自验完成但A发现旧I90独立PG16回归缺失（当前最新）

- B分支`feat/f03-consultation-assignee-handover-2j`最终受检SHA`b2e296d8b49b69a40e3b6ea053eec41386b6ffa5`，同SHA[真实CI 37994434333](https://github.com/suzhe868-arch/mb/actions/runs/37994434333)现有12/12独立job success、新J91真实27/27测试成功，旧90表catalog不变、新000010仅新增一张收据表至91表/572列/390约束/151索引/1982目录定义。A独立审查确认J咨询转派/SLA保持与三域Key防重本批测试已通过。
- **A-J-01明确阻断**：正式J08要求独立旧I90表完整PG16回归，但J工作流/最新job列表完全**缺少旧I90的独立作业**；仅新J job应用I迁移与部分业务测试不算旧I完整回归。因此实际要求**13/13独立job**。唯一正式整改单：`07_重建工作区/F03-2-2J_A主控独立复核旧I90表回归缺失定向整改单_2026-10-10.md`。B可仅改本批新工作流新增旧I90独立PG16完整27例与证据，不用重做旧工程；最后必须取得同SHA 13/13全成功且J/I各27/27。
- **A_CHANGES_REQUESTED / NOT_ACCEPTED / NOT_MERGED，NEXT_OWNER=B**，保留现有B分支，修复后交A复验，不提前2K。不修改PDM Final、旧数据库迁移/CI，F03-2整体/C-H01仍未验收，产品基线`NOT_READY`。

---

# 2026-10-10｜F03-2-2I A二轮独立复验通过、PR17正式合并；F03-2-2J已正式放行（当前最新）

- **2I已正式闭环**：B最终SHA`c92ff2a07b06b94dd7a8c53a9b888248856f61bd`、同SHA[真实PG16 CI37991845213](https://github.com/suzhe868-arch/mb/actions/runs/37991845213)**12/12独立作业成功、I27/27集成测试通过**；A-I-01 H/I双向请求Key真实顺序与并发拒绝、A-I-02 Demand合法二次交接不可变收据及历史链均已验收。旧H只依A正式整改单限定修改单个服务跨域Key守卫，其余旧工程/迁移/CI未改。旧89表/1890目录键零改、新000009一张Demand收据表后90表/560列/375约束/147索引/1936目录键新增46，PG16原始归档和物理指纹跨run PASS。A标准[PR17](https://github.com/suzhe868-arch/mb/pull/17)已合并，merge SHA`9bc5e17be2153d4646816c808d6af77409513308`。正式A签字：`07_重建工作区/F03-2-2I_A主控二轮独立验收及PR17正式合并闭环_2026-10-10.md`。
- **2J已A技术裁决并放行B**：依据PDM-15 Consultation四状态、正式咨询负责人转派/15分钟首响SLA，PDM-14 Recommendation不反写及PDM-03业务与Customer owner分层，B在独立隔离PG16真实测试Consultation assignee单域CAS/不可变交接收据、首响deadline不重置、历史连转可审计；H/I/J三域请求Key必须三向全局保护。仅允许新的`000010`最多一张合成收据表与两个已验收H/I服务入口的最小跨域守卫兼容补强；旧迁移、旧CI、旧业务规则绝不修改。正式施工单`07_重建工作区/F03-2-2J_A主控SG06_Consultation咨询负责人单域移交与SLA保留完整施工单_2026-10-10.md`，B指定分支`feat/f03-consultation-assignee-handover-2j`，完整实施+PG16+证据+最新同SHA全成功后交A，不得自行合并main。
- **NEXT_OWNER=B**；C/H01高保真、F03-2整体和产品基线仍`NOT_READY`。本段覆盖下文旧2I待整改历史状态，历史记录不删除。

---

# 2026-10-10｜F03-2-2I B自验全绿，但A发现2项跨域幂等/不可变历史阻断（当前最新）

- B分支`feat/f03-demand-responsible-handover-2i`真实HEAD`9445a68c00a809b9f69aba7542af3b403f9b7b1c`，同SHA[真实CI 37989284356](https://github.com/suzhe868-arch/mb/actions/runs/37989284356)**12/12独立PG16作业success、新I 21/21测试通过**；仅18个批准新文件、旧main零修改。旧000001～000008 89表1890完整目录对象零变更；候选000009一张Demand收据表后90表/560列/375约束/147索引、1936对象新增46目录键，真实原始结构跨运行校验成功。**B自验通过不等于A验收。**
- A独立审查H已合并服务和I新服务：①**跨域RequestKey仅I查询H，H反向不检查I**，可先Demand成功再用同Key做Customer Owner第二次合法提交，且所谓跨域测试只证明H表为空；②I收据真伪校验硬要求Demand现任负责人等于历史收据to，合法二次改派后早期不可变收据无法再读。完整定向整改单：`07_重建工作区/F03-2-2I_A主控独立复核与跨域幂等历史收据整改清单_2026-10-10.md`，附A限定唯一H旧服务守卫补强技术例外、双向真实PG16及历史连续移交正负例。
- **A_CHANGES_REQUESTED / NOT_ACCEPTED / NOT_MERGED；NEXT_OWNER=B。** B在原2I分支一次性完成两项修复、旧H89表和I90表CI完全回归、原始schema/目录证据及最新同SHA12/12全绿后`READY_FOR_A_REVIEW`交A；**禁止自行合并及启动2J**。C/H01和F03-2整体仍未验收，产品基线`NOT_READY`。

---

# 2026-10-10｜F03-2-2H三项整改A二轮复验通过并PR16合并，F03-2-2I已正式放行（当前最新）

- **F03-2-2H A正式签收**：B最终SHA `f60d15aaa8fcc4c6fb955c2eaf394fea5895d4df`、同SHA真实[PG16 CI `37985367539`](https://github.com/suzhe868-arch/mb/actions/runs/37985367539) **11/11独立PG16作业成功、本批19/19测试通过**。前轮A-H-01跨item/batch请求Key唯一冲突、A-H-02暂停接客经理/店长合法交接、A-H-03精确跨店Team scope全部独立复验闭环。18个授权新增文件，旧文件无修改；原88表/1840目录对象保留，新000008仅新增一张收据表至89表/548列/360约束/143索引/1890目录对象(增量50)。原始结构来源`37985015633`与最终新run目录及来源字节校验PASS。标准[PR #16](https://github.com/suzhe868-arch/mb/pull/16) `mergeable=clean`后合并成功，合并提交 `acdc65e140c341916160bd02dd92eb93448ade06`。正式验收报告：`07_重建工作区/F03-2-2H_A主控二轮独立验收及PR16正式合并闭环_2026-10-10.md`。
- **下一批F03-2-2I（A已技术裁决签发）**：仅在新隔离PG16合成环境演练Demand当前responsible单域权限、CAS、逐项不可变历史/收据与Priority trigger Demand派生责任/TTL保持；其它Domain不得改写，不得把单域收据冒充整批SG06 completed。旧000001～000008封印不动，只有本批新目录和专用CI，允许在可证明安全边界下提出000009最多一张新收据表。完整施工单：`07_重建工作区/F03-2-2I_A主控SG06_Demand负责人单域移交与Priority派生责任完整施工单_2026-10-10.md`；B指定分支`feat/f03-demand-responsible-handover-2i`，全部自测/归档并取得最新同SHA成功CI后交A，不能自行合并。
- **NEXT_OWNER=B**。C/H01高保真仍未独立通过；完整F03-2、真实生产交接、其它七域适配及SG07整体仍未完成，`PRODUCT_BASELINE=NOT_READY`。本段覆盖下文过时的2H暂缓验收台账，旧历史保留。

---

# 2026-10-10｜F03-2-2H B交付A独立复核提出3项阻断整改（当前最新）

- B固定受检SHA `88c762eb88e8cdbb7d1bc9850fa29d39f47bde50`、同SHA [PG16 CI37982757484](https://github.com/suzhe868-arch/mb/actions/runs/37982757484) **11/11独立作业全success、本批14/14测试全通过**，仅18个授权新增文件，旧main零修改，旧88表结构封印不变；000008提议新增唯一一张收据表并生成89表/548列/359约束/142索引与完整目录。B已`READY_FOR_A_REVIEW`，但**A尚不验收也未合并**。
- A独立审查发现三项施工单/PDM边界未闭环：①**相同请求Key可以跨item/batch/Customer生成第二个收据与Owner改写**，不满足A批准的`COLLISION_DENY`；②代码要求操作经理/店长处于`receiving`，把暂停接客误当成撤销其合法管理员工/Customer交接权；③要求经理和双方业务员工当前主门店一律等于Team店，未正确覆盖PDM-02批准的显式跨门店权限/data scope。完整一次性整改单：`07_重建工作区/F03-2-2H_A主控独立验收完整定向整改单_2026-10-10.md`。
- **NEXT_OWNER=B**。B在**原**`feat/f03-customer-owner-handover-2h`分支一次性整改A-H-01～03，重新生成000008物理证据和最新同SHA11作业PG16成功CI，更新中文交接，再交A独立复验。**未经A通过不得PR合并或开启下一批**。C/H01高保真与F03-2整体仍未验收，`PRODUCT_BASELINE=NOT_READY`。

---

# 2026-10-10｜F03-2-2G整改四项A独立复验通过、标准PR15合并、F03-2-2H已正式放行（当前最新）

- **本批2G闭环通过**：B固定SHA `1069f26b87f772f28d9ed1bfb19c983a4e197729`、同SHA [PG16 CI `37978981732`](https://github.com/suzhe868-arch/mb/actions/runs/37978981732) **10/10个独立作业success、本批18/18真实测试**；A复核前轮A-G-01～04（离职inactive源仍合法只读、PG16行锁和防幻读、跨批账本缺项重复、跨Team最小披露）全部闭环。14个新增文件、旧main无修改；88表/536列/344约束/138索引，1840完整catalog对象零变动，跨运行原始字节校验成功。标准[PR #15](https://github.com/suzhe868-arch/mb/pull/15)成功合并SHA `b405e83cfadf9f0f6d89ada32ae2f45b5b20a6bd`。A正式验收：`07_重建工作区/F03-2-2G_A主控二轮独立验收及PR15正式合并闭环_2026-10-10.md`。
- **正式放行下一F03-2-2H**：严格只在新隔离PG16合成数据中演练SG06 **Customer唯一current owner的单域受控敏感写、独立权限/范围、owner历史与幂等不可变收据**；不得借`employee.manage`越权，不得迁移其它七域负责人或把单域收据冒充整个batch completed；允许专用`000008`最多一张收据表的隔离增量技术提案，旧000001～000007和旧88表Guard全部保持不变。正式施工单：`07_重建工作区/F03-2-2H_A主控SG06唯一CustomerOwner受限真实逐项移交及事务收据施工单_2026-10-10.md`；指定B分支`feat/f03-customer-owner-handover-2h`，从最新main创建，全部测试/归档/同SHA全绿后`READY_FOR_A_REVIEW`交A，无需逐项请用户点击。
- **NEXT_OWNER=B**。C/H01高保真仍未独立通过；F03-2整体、真实各域逐项移交及生产均未验收，`PRODUCT_BASELINE=NOT_READY`。本段覆盖下文历史过期2G整改未完成状态，旧条目不删除。

---

# 2026-10-10｜F03-2-2G B已交审、A独立验收提出四项定向整改（当前最新）

- B分支 `feat/f03-handover-preflight-2g` 实际最新HEAD `f9f42c4fde6832522b770403029a4ec2ddc11f7f`；同SHA真实 [PG16 CI37976033469](https://github.com/suzhe868-arch/mb/actions/runs/37976033469) **10/10独立作业成功**、本批12/12测试全绿；14个文件均为授权新增，旧main无修改/删除、真实88表/536列/344约束/138索引的结构SHA不变。B交接达到`READY_FOR_A_REVIEW`，但**CI绿不代表A验收通过**。
- A独立检查`service.mjs`、交接、测试及旧PDM Final后判定 `A_CHANGES_REQUESTED`：①已离职/inactive源员工会被`batch()`硬拒，无法清点突发失效交接；②模拟提交前未锁Customer Owner及七域责任行，G05仅二次SELECT；③缺失账本item被混报PENDING且同目标跨批重复未辨识；④仅验证源员工Team scope却回传关联客户其他团队负责域明细。全部整改与新增测试在 `07_重建工作区/F03-2-2G_A主控独立复核一次性整改清单_2026-10-10.md`，不改变Final、旧迁移或准许业务写。
- 本轮**无A验收、无PR合并**。**NEXT_OWNER=B**，继续原分支一次性完成A-G-01～04全部整改、最新同SHA 10独立PG16成功CI、归档与完整中文交接后交A；无需用户每步同意。C/H01仍未最终验收，完整F03-2和产品基线`NOT_READY`。

---

# 2026-10-10｜A验收F03-2-2F并正式合并PR14，已放行F03-2-2G只读交接预检（当前最新）

- **F03-2-2F全部闭环**：B验收SHA `703d96a492a62870dbf9e70e13a808b981802bc4`，同SHA [真实PG16 CI 37972431347](https://github.com/suzhe868-arch/mb/actions/runs/37972431347) **9/9独立作业成功**，本批10/10；原main全文件未改，仅14个批准新增文件。原始1840个数据库目录对象零变更，88表/536列/344约束/138索引，SHA `96328994b19e1fef7261ae41bd890575bd196210e85baec685d0192676aff0dd`，源CI37972106107与末次run结构原文跨运行核验成功。A独立审查后标准[PR #14](https://github.com/suzhe868-arch/mb/pull/14)合并SHA `25fd4634e76915d9c5a6409ff753b4c4b7432b94`。报告：`07_重建工作区/F03-2-2F_A主控独立验收及PR14正式合并闭环_2026-10-10.md`。
- **A已正式准备并限定放行下一批F03-2-2G**：只在全新隔离PG16、沿用88表原结构，完成SG06 Customer Owner及Demand/Priority/Consultation/Waitlist/Lock/Transaction活跃承责映射的真实**只读预检**、合法经理/接替人/Team/current权限/跨域缺口证明；**不新增DDL、不执行Owner/任何业务负责人变更、不写completed、不放行调店或降权**。完整施工单：`07_重建工作区/F03-2-2G_A主控SG06客户与活跃业务承接预检完整施工单_2026-10-10.md`。B执行分支`feat/f03-handover-preflight-2g`，完成全量代码、真实并发/失败测试、旧多版回归、原始PG16零变更证据和最新同SHA成功CI后`READY_FOR_A_REVIEW`交A，不需用户反复确认。
- **当前唯一工程下一责任人：B**；C/H01仍未最终验收，完整F03-2尚未验收，`PRODUCT_BASELINE=NOT_READY`。最新指针：`F03_2_2F_ACCEPTED_MERGED_PR14_F03_2_2G_A_RELEASED_NEXT_OWNER_B_H01_VISUAL_PENDING`，下文旧2F未施工仅为历史记录。

---

# 2026-10-10｜F03-2-2E已验收并正式合并，A已放行下一受限权限治理批（当前最新）

- **上一工程批F03-2-2E完整闭环**：B最终SHA `86e838fa1f66f44827dfb399dbaf1887a9934283`、同SHA [真实CI 37968929785](https://github.com/suzhe868-arch/mb/actions/runs/37968929785) 八独立PG16作业全部success，本批88表pending-only ledger 11/11，旧86/84/82/81/80表冻结回归均通过。A复核原main1248文件完整未动、仅17个批准新增文件，正常[PR #13](https://github.com/suzhe868-arch/mb/pull/13) merge SHA `59fdb3623c1d9d2845e7bed9dd13c1b6ef0b41bf`。结构000007仅增加两表、88表/536列/344约束/138索引。A正式签发：`07_重建工作区/F03-2-2E_A主控独立验收及PR13正式合并闭环_2026-10-10.md`。
- **A已完整审查并放行下一批F03-2-2F**：SG04中严格限定`employee.manage`个人allow/deny/revoke及现有显式Team capability scope可信治理，仅在全新隔离PG16中运行、**无新增DDL**、不改旧权限/结构/生产。正式全量施工单：`07_重建工作区/F03-2-2F_A主控SG04员工个人权限与Team范围受限治理施工单_2026-10-10.md`。不允许把该能力扩成经理默认高权、正式业务写、Customer owner交接或员工调店降权。
- **下一唯一工程责任人：B**。B从执行时最新main创建`feat/f03-manager-team-governance-2f`，按现行三窗口连续执行规范一次完成全部实现、同SHA真实CI、并发/故障回滚、旧各版本独立PG16回归、原始结构零变更证据与完整B交接，最终`READY_FOR_A_REVIEW`交A；A独立验收合格后标准PR合并，不再逐项问用户。
- C/H01仍独立等待高保真视觉最终审查。F03-2完整治理/SG06各域业务交接/SG07/SG08和产品基线尚未通过；`PRODUCT_BASELINE=NOT_READY`。**2F是A放行但B未施工，不得报告2F已验收。**
- 最新唯一指针：`F03_2_2E_ACCEPTED_MERGED_PR13_F03_2_2F_A_RELEASED_NEXT_OWNER_B_H01_VISUAL_PENDING`。下文曾有的2E待施工等属于旧阶段历史。

---

# 2026-10-10｜F03-2-2D已验收并合并，A已放行SG06账本下一工程批（当前最新）

- **F03-2-2D全链路闭环**：A独立复核B最终HEAD `1f4578f4d9604e426c46f442e6e658402ad70b85`，同SHA [真实CI37964554999](https://github.com/suzhe868-arch/mb/actions/runs/37964554999) 七个相互独立PG16作业全部success；SG02 Team Scope真实9/9，旧SG03 11/11、SG05 10/10与bootstrap1/1、2A模板9/9、原F03-1认证11/11及HTTPS4/4。正式[PR #12](https://github.com/suzhe868-arch/mb/pull/12)正常merge提交 `e53a4faa0228afb9ec18372f32125ccd3a4befcf`；原main1229个文件全部未改，仅17新增授权范围文件。A签发报告：`07_重建工作区/F03-2-2D_A主控独立验收与PR12合并闭环_2026-10-10.md`。
- **A已完成下一工程批全部技术准备并正式限定放行**：`F03-2-2E SG06交接批次/明细可信账本、原子失败保留及逐项幂等`，完整施工单`07_重建工作区/F03-2-2E_A主控SG06交接账本与逐项幂等施工单_2026-10-10.md`。只允许一次性隔离PG16新迁移`000007`两表及技术账本内部动作；**不得声称账本即真实客户/业务交接成功**，不改Customer owner/业务负责人、调店/降权及生产。
- **下一唯一工程责任人：B**。B从执行时最新main新建`feat/f03-handover-ledger-2e`，读取本main/新版A/B/C连续协作规范与施工单，一次完成全部代码、独立真实PG16并发/幂等/失败回滚、所有旧版本独立回归、同SHA成功CI、原始schema-only/结构指纹证据与完整中文B交接，达`READY_FOR_A_REVIEW`直接交A。无需用户逐项点击，B不得自行合并main。
- **界限**：F03-2整体未验收，SG04/完整SG06域移交/SG07/08及正式PC/生产均待后续严格门禁；C/H01视觉仍单独待审，`PRODUCT_BASELINE=NOT_READY`。2E仅A已放行，B尚未施工、没有可声明的2E CI成功。
- 当前主控指针：`F03_2_2D_ACCEPTED_MERGED_PR12_F03_2_2E_A_RELEASED_NEXT_OWNER_B_H01_VISUAL_PENDING`。下文旧阶段2D待B或其它阻断仅为历史快照，不再代表当前下一步。

---

# 2026-10-10｜F03-2-2C 正式验收合并，A已放行下一SG02团队范围工程（当前最新）

- F03-2-2C 已完成全部B工程、A独立审核和标准[PR #11](https://github.com/suzhe868-arch/mb/pull/11)合并。工程B SHA `d7eb69e1fd2a8c53ef75aa250f5a01e5aa645dd4`，同SHA真实[CI37959483511](https://github.com/suzhe868-arch/mb/actions/runs/37959483511)六个独立PG16作业全部success（本批84表接客11/11、旧82表管理员10/10与bootstrap1/1、旧81表模板9/9、旧80表认证11/11与HTTPS4/4），标准merge SHA `955a6bb8da6213e13a6249709fb11db65841a3bc`。旧main1210个文件逐blob不变，只新增17授权文件。A独立验收报告：`07_重建工作区/F03-2-2C_A主控独立验收与PR11正式合并闭环_2026-10-10.md`。
- **A已继续完成下一批技术裁决、完整施工单和限定工程放行**：F03-2-2D｜SG02显式名邦团队及Team Scope可信成员范围证明，现行施工单：`07_重建工作区/F03-2-2D_A主控SG02团队关系与可信范围完整工程施工单_2026-10-10.md`。仅允许隔离CI新追加`000006`建议两表、显式组织数据/团队成员及内部权限范围事实，不赋予经理默认权、无正式员工管理API、无Customer Owner/交接/生产业务、不得修改旧迁移。
- **下一唯一工程负责人B**：在最新main新建`feat/f03-team-scope-2d`，按A/B/C连续执行规则一次完成真实PG16新增迁移/可信团队成员关系、严格capability-specific team scope、并发/原子审计/负例、冻结80/81/82/84回归、原始结构证据和同SHA成功CI，自验`READY_FOR_A_REVIEW`后交A；不得每小步向用户要确认，也不得自行合并main。
- C/H01仍待独立高保真视觉复核；完整F03-2尚未签收，`PRODUCT_BASELINE=NOT_READY`。F03-2-2D仅A已放行、**B尚未施工**，不能当作已实施或CI通过。
- 当前指针：`F03_2_2C_ACCEPTED_MERGED_PR11_F03_2_2D_A_RELEASED_NEXT_OWNER_B_H01_VISUAL_PENDING`。下文旧“2C待执行、2B待批准”等仅为历史记录。

---

# 2026-10-10｜F03-2-2B 已全部验收合并；A已放行F03-2-2C，下一窗口B（当前最新）

- **F03-2-2B完全闭环**：A独立核验B固定SHA`448869df7258a868292601791d8460c346414dd3`、同SHA [CI37955103517](https://github.com/suzhe868-arch/mb/actions/runs/37955103517) 五个一次性PG16作业全部success；通过 [PR #10](https://github.com/suzhe868-arch/mb/pull/10) 标准merge正式合并main，merge SHA`bd31e81a16a9fe219e678f1f01020965deae320b`，原main 1189个文件完全未动，仅新增19个B实物文件。完整A验收与证据：`07_重建工作区/F03-2-2B_A主控独立验收及PR10合并闭环_2026-10-10.md`。
- **A已一次完成下一工程批次技术审查、依赖裁定及完整施工单**：`F03-2-2C SG03接客资格与最后合格接客池并发保护`，限定新一次性PG16/受限内部操作/精确新增`000005`候选、无正式自然注册Owner或生产业务入口，所有风险边界和真正测试门禁写于`07_重建工作区/F03-2-2C_A主控接客资格与最后接客池完整施工单_2026-10-10.md`。施工单已正式放行，B不得自行扩大范围。
- **当前唯一工程下一负责人：B**。B从执行时最新main新建`feat/f03-receiving-pool-2c`，按现行`07_重建工作区/A_B_C三窗口协作与验收规范.md`一次完成全部实施、真实PG16并发/失败回滚、旧80/81/82各版本回归、同SHA成功CI、原始结构证据归档及自验，最终`READY_FOR_A_REVIEW`交A；无需每个子步骤向用户申请确认。A随后独立验收，通过后标准PR合并。
- C/H01设计仍独立待视觉复审，不能因B工程成功自动认定H01通过；完整F03-2仍未验收，`PRODUCT_BASELINE=NOT_READY`。**2C施工尚未开始/CI尚未运行**，不冒充完成。
- 当前主控指针：`F03_2_2B_ACCEPTED_MERGED_PR10_F03_2_2C_A_RELEASED_NEXT_OWNER_B_H01_VISUAL_PENDING`。下文2B待施工、PR10未合并等仅为历史快照。

---

# 2026-10-09｜A完成下一批准备，现由B直接执行（当前最新指针）

- **用户已修改A/B/C全项目协作流程**：`07_重建工作区/A_B_C三窗口协作与验收规范.md`现行版生效。A、B、C各窗口收到目标后**在本窗口完整闭环**（审查/工作单/施工/测试/整改/实证/交接），不再每一步向用户申请“确认”。新批已在当前Final与隔离技术工程范围内，由A完成必要裁决及技术放行；A验收通过后直接按标准PR合并并同步main，无二次审批。只有实质产品冲突、关键视觉未确定、真实数据/外部连接/生产等高风险事项集中请用户决策。
- **F03-2-2A全流程已完成**：已验收合并 [PR #9](https://github.com/suzhe868-arch/mb/pull/9)，原B提交`da8a17ec5ce7e004ae158f3d3165469650c344c5`、同SHA成功CI37948076366、合并提交`6cb9cc0768cb3b3f6644b457a64b715e3828fc9a`，A完成主控状态闭环`0e41568241bd9c1d451e19bec85c80d92ce94e82`。历史PR工具阻断已解除。
- **当前唯一工程下一责任人：B**。A对`F03-2-2B｜SG05 System Admin最后active/最后有效登录保护 + 一次性bootstrap claim`已完成全部技术依赖裁决、完整工作单、测试/并发/版本边界和正式限定放行。完整施工单：`07_重建工作区/F03-2-2B_A主控技术裁决与完整工程施工单_2026-10-09.md`。B应从执行时最新main新建`feat/f03-admin-population-2b`，在独立一次性PG16完成新增`000004`可信守卫、真实并发/故障回滚、旧80/81表独立回归、同SHA CI、原始结构证据和最终交接；**一次做到`READY_FOR_A_REVIEW`再交A，不需中途问用户**。A会独立验收，合格后标准PR合并main。
- C/H01是**独立并行设计轨**：仍待实际高保真视觉整改/复核；C读最新main现行规范，按其已下达的整体视觉任务一轮做完再交A，不能把H01未审当已通过。
- 2B尚未由B施工，无实测CI可宣告；完整F03-2也尚未验收，`PRODUCT_BASELINE=NOT_READY`。
- 全局状态：`F03_2_2B_A_FULL_SCOPE_RELEASED_NEXT_OWNER_B_C_H01_VISUAL_PENDING`。下方较旧“2B待批”“1B/2A待合并”等仅为历史快照，不再是有效下一步。

---

# 2026-10-09｜F03-2-2A 完成标准 PR #9 合并（当前最新）

- **本批工程全部闭环**：用户一次授权、B限定施工、A独立验收、真实同SHA CI成功，以及标准 [PR #9](https://github.com/suzhe868-arch/mb/pull/9) 合并均已完成。验收B SHA `da8a17ec5ce7e004ae158f3d3165469650c344c5`；同SHA [CI37948076366](https://github.com/suzhe868-arch/mb/actions/runs/37948076366) 3/3独立PG16成功（治理9/9、原认证11/11、原HTTPS4/4）。
- merge提交 [`6cb9cc0768cb3b3f6644b457a64b715e3828fc9a`](https://github.com/suzhe868-arch/mb/commit/6cb9cc0768cb3b3f6644b457a64b715e3828fc9a)；A独立核验原main 1180文件blob全不变、7新增文件全部与B验收HEAD一致，无旧文件修改/删除，无越界。
- **此前`PR_CREATE_TOOL_BLOCKED / NOT_MERGED`已解除**：标准PR实际创建并正常合并；下文历史阶段标为曾经状态，不再是当前阻断，不需要用户重新点击。
- 本批仅合成PG16环境的独立System Admin设置现有`sales × customer.phone.manage`模板true的current/history/audit原子事务；SG02～08、其它能力、模板降权/员工停用、交接、正式控制面或客户电话业务API均未开放。完整`F03_2_ACCEPTED=NO`，`PRODUCT_BASELINE=NOT_READY`。
- **当前唯一下一步：A继续审查并准备剩余F03-2技术依赖的下一独立施工单；B等待下一批单次授权**。C/H01设计仍待独立视觉验收。详见`07_重建工作区/F03-2-2A_A主控PR9合并完成与下一步_2026-10-09.md`。
- 当前指针：`F03_2_2A_MERGED_A_REVIEW_NEXT_F03_2_DEPENDENCIES_B_WAIT_H01_VISUAL_PENDING`。

---

# 2026-10-09｜F03-2-2A已验收、标准PR创建受阻（当前最新）

- 用户已经一次性授权F03-2-2A施工和验收后直接合并；A正式放行，B限定7新增文件完成，固定SHA `da8a17ec5ce7e004ae158f3d3165469650c344c5`，同SHA真实CI37948076366三作业3/3成功（2A PG16治理9/9、原F03-1认证11/11、原HTTPS4/4）。
- A独立复验确认旧1179文件逐blob不变，新7文件均在授权目录和独立工作流，无DDL、正式接口或业务数据库。A验收报告`07_重建工作区/F03-2-2A_A主控独立验收签发与真实CI证据_2026-10-09.md`已在main签发。
- **唯一未完成：标准GitHub PR创建调用被当前工具安全检查拦截，没有创建PR、更没有合并。** 保留B分支，拒绝通过绕过PR门禁改写main；此批既有用户一次确认足以授权未来正常合并，无需重复审批。
- B暂停；下一批未批准；C/H01未最终验收。PRODUCT_BASELINE=NOT_READY。此节覆盖以下历史指针。

---

# 2026-10-09｜最新A工程主控状态（覆盖下方历史快照）

- F03-2-1B已通过PR #8正式合并，合并SHA `eeeb4f12936b313c0405ebd880717d4be90feb53`；验收 B SHA `3376f2efff8f95462d7bdaa79c688c3208d2eeac`及同SHA CI37904745833。旧main 1150文件原字节未变、B新增24文件blob精确一致。
- A已完成F03-2-2A下一批技术依赖裁决、限定施工单及45项能力/14类治理承接矩阵，均已落库。施工单：`07_重建工作区/F03-2-2A_角色模板限定启用与原子历史审计施工单_待用户批准_2026-10-09.md`。门禁：`07_重建工作区/F03-2-2A_A主控依赖裁决与启动门禁_待用户批准_2026-10-09.md`。
- **当前唯一工程下一步：用户对F03-2-2A明确限定施工单一次批准；B目前等待、新分支未创建、该批CI未执行。** 单次批准涵盖B施工和A独立验收通过后符合合并门禁的直接合并，不再二次申请；失败/越权/冲突则停止。
- 2A只建议隔离PG16上System Admin对已有sales×customer.phone.manage模板enabled=true的原子治理和history/audit；不改原迁移、不新增DDL、不开放正式接口。其它治理、其它权限映射和跨域交接仍未授权。C/H01待独立视觉复审，PRODUCT_BASELINE=NOT_READY。

---

# 2026-10-09｜F03-2-1B正式合并完成（当前最新）

- [PR #8](https://github.com/suzhe868-arch/mb/pull/8) 正常merge成功，SHA `eeeb4f12936b313c0405ebd880717d4be90feb53`。冻结B验收HEAD `3376f2efff8f95462d7bdaa79c688c3208d2eeac` 的真实CI37904745833三作业成功。原main 1150文件全部不变，新增24文件全部与B验收SHA的Git blob一致。
- **正式状态：F03_2_1B_ACCEPTED / MERGED_TO_MAIN**；未获完整F03_2_ACCEPTED、后批施工或C/H01最终验收，`PRODUCT_BASELINE=NOT_READY`。
- 用户已确定：今后对明确新批次一次批准后，A独立验收通过且无冲突/越权，可直接合并，不再就同一批的合并重复审批；新批施工仍另行批准，异常阻断。
- **当前唯一工程下一步：A准备F03-2-1剩余范围与F03-2-2治理事务的前置技术裁决及独立施工单；B等待，C/H01视觉复审待办。** 合并复核：`07_重建工作区/F03-2-1B_A主控PR8合并完成及后续门禁_2026-10-09.md`。
- 以下旧“待合并/待整改”系历史状态，不再生效。

---

# 2026-10-09｜F03-2-1B正式验收通过、合并待单独批准（当前最新）

- 用户在A窗口明确“同意”A登记1B正式验收及准备合并核验材料；A签发 **F03_2_1B_ACCEPTED / A_SIGNED / LIMITED_SG01_OBJECT_SCOPE_INTERNAL_GUARD_ONLY / NOT_MERGED**。完整F03-2-1、F03_2_ACCEPTED均未签，`PRODUCT_BASELINE=NOT_READY`。
- B冻结验收HEAD `3376f2efff8f95462d7bdaa79c688c3208d2eeac`，同SHA [真实CI37904745833](https://github.com/suzhe868-arch/mb/actions/runs/37904745833)三个独立PG16作业成功；迁移9/9、Scope7/7、HTTPS2/2，源归档测试与旧登录11/11、原HTTPS4/4回归成功。A独立闭合R1完整迁移链、R2用户命名空间隔离、R3精确约束/HTTPS负例、E1结构原文与真实哈希。
- A独立读取原结构全文/归档，验证旧对象1664、新对象1687，**只新增SG01的23个物理目录条目，旧对象删除/定义变化均为0**；80→81表、487→492列、299→304约束、123→126索引。归档源CI37901077203并非最终HEAD产物，最终CI独立校验两者结构一致（SQL只允许配对pg_dump随机key差异）。
- **当前唯一工程下一步：用户审查本批合并核验材料并单独决定是否允许A合并B分支main；B等待，不再继续R1/R2/R3/E1整改。** 报告：`07_重建工作区/F03-2-1B_A主控最终验收签发与残余风险_2026-10-09.md`；合并材料：`07_重建工作区/F03-2-1B_A主控合并核验材料_待用户批准_2026-10-09.md`。
- 本轮只更新A主控文档及状态，不合并B/C、不创建后批施工授权；仅CI一次性PG16和`customer.phone.manage`的内部object范围，不修改电话、不开放正式接口。C/H01尚未最终验收，PDM Final/Current IA/Low-Fi与已有工程不变。
- 当前指针：`F03_2_1B_ACCEPTED_A_MERGE_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下首轮整改内容为历史，不得再当作当前未闭合阻断。

---

# 2026-10-09｜F03-2-1B首轮整改补证（当前最新）

- A独立复验B `feat/f03-runtime-scope` HEAD `df27522891438c51ff8847cc5e018b698c0a98fc`；同SHA [CI37901077203](https://github.com/suzhe868-arch/mb/actions/runs/37901077203)三个独立PG16作业成功。本批迁移6/6、范围7/7、HTTPS2/2，但存在版本门禁与测试覆盖缺口。
- **结论：CHANGES_REQUESTED / F03_2_1B_ACCEPTED尚未签发。** 报告：`07_重建工作区/F03-2-1B_A主控首轮复验与三项整改及补证清单_2026-10-09.md`。
- **当前唯一工程下一步：B在当前分支闭合R1完整版本链、R2非public命名空间隔离、R3有针对性的约束/HTTPS负例，补可读结构原文和实际校验，提交新SHA与同SHA成功CI交A复验。**
- 原1B限定结构/Guard及独立全新PG16授权持续有效；只在runtime-scope及本批新工作流整改，不改旧工程/产品Authority、不新增范围或业务接口、不合并B/C。
- 1A已验收合并；后续治理/交接、其他动作/范围、SG02～08、F03-3/F04、部署/正式前端未授权。C/H01独立未最终验收、不加折叠屏专项；不访问已有/业务/生产库，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1B_B_FIX_VERSION_ISOLATION_TEST_GAPS_AND_ARCHIVE_EVIDENCE_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下初次放行信息为历史。

---

# HISTORICAL｜F03-2-1B初次放行时

- 用户在A窗口明确“确认”，批准1A成果合并及1B施工单；A已完成 [PR #7](https://github.com/suzhe868-arch/mb/pull/7) merge，SHA `22c4d8ea405f4f6d47c0c128d68f69dbd417e812`。
- 18新增文件blob均与验收HEAD `bc1261ce090180d87b262744bd2b16e7c6caf60f` 完全一致，main原有1128文件原字节保持，合并后1146文件；旧Authority/工程不变。1A验收真实CI37891029812仍为对应HEAD既有证据，不冒称本批测试。
- **A正式签发F03_2_1B_AUTHORIZED / USER_APPROVED / A_RELEASED / NOT_YET_IMPLEMENTED。当前唯一工程下一步：B从含本放行的最新main新建`feat/f03-runtime-scope`，执行逐能力客户范围与限定真实Guard施工单，完成后交A独立验收。**
- 放行：`07_重建工作区/F03-2-1B_A主控成果合并与客户范围隔离施工放行_2026-10-09.md`；施工单：`07_重建工作区/F03-2-1B_逐能力客户范围与限定真实Guard施工单_待用户批准_2026-10-09.md`（以本次正式放行增补为准）。
- 只允许独立一次性PG16全新空库。此次明确批准SG01限定一张五列scope关联表、旧scope表追加一个复合唯一约束、所列FK/CHECK/索引、000003独立追加迁移和精确81表新Guard；旧000001/000002及80表Guard保持，其他SG02～08不施工。
- 业务判断正例仅`customer.phone.manage`匹配具体客户object范围及当前状态的**内部Guard**；不实际修改电话、不开放业务接口，其他动作/范围仍DEFER。新增仅`engineering/f03/runtime-scope/**`及`.github/workflows/f03-2-1b-runtime-scope.yml`。
- 本批测试NOT_RUN、F03_2_1B_ACCEPTED未签；完整F03-2-1/F03_2_ACCEPTED未签。治理/交接、F03-3/F04等后批、部署/正式前端、本批分支合并仍分别未授权。
- C/H01独立未最终验收，不合并C、不加折叠屏专项；PDM Final/Current IA/Low-Fi不改，不访问已有/业务/生产库，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1B_B_CAPABILITY_CUSTOMER_SCOPE_GUARD_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下旧待批准/等待信息为历史。

---

# HISTORICAL｜1A合并与1B施工单待批准时

- A已整理1A合并材料并创建 [草稿PR #7](https://github.com/suzhe868-arch/mb/pull/7)，尚未合并；验收HEAD `bc1261ce090180d87b262744bd2b16e7c6caf60f` 不变，F03_2_1A_ACCEPTED有效。
- 合并材料：`07_重建工作区/F03-2-1A_A主控合并核验材料_待用户批准_2026-10-09.md`；下一批建议：`07_重建工作区/F03-2-1B_逐能力客户范围与限定真实Guard施工单_待用户批准_2026-10-09.md`。
- **当前唯一工程下一步：用户分别审查批准1A合并与1B施工单，A随后登记并执行相应授权；B暂时等待。**
- 1B建议先把已冻结customer.phone.manage与具体客户范围绑定，完成限定内部Guard的真实允许/越界拒绝；提出一张逐能力scope关联表、旧scope表追加一个唯一约束、000003追加迁移及独立精确新版Guard。当前仅技术建议，结构和施工未授权。
- 已验收80表旧Guard保持原字节且必须拒绝81表新库；1B建议独立新Guard和独立测试库，不能简单改计数或关校验。无实际电话业务改动，无正式接口，其他范围/业务动作与治理/交接另批。
- 本次用户“同意”只批准A准备材料；未创建1B工程分支、未测试/迁移，TESTS=NOT_RUN。已有/业务/生产库、部署/正式前端、后批施工仍未授权。
- C/H01独立未最终验收、不合并C、不加折叠屏专项；PDM Final/Current IA/Low-Fi及已验收工程保持，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1A_MERGE_AND_F03_2_1B_SCOPE_WORK_ORDER_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下既有验收记录为历史。

---

# HISTORICAL｜F03-2-1A验收签发时

- A正式签发 **F03_2_1A_ACCEPTED / A_SIGNED / LIMITED_CURRENT_FACTS_AND_REVOCATION_ONLY / NOT_MERGED**；R1、R2、E1已闭合。完整F03-2-1、F03_2_ACCEPTED未签。
- B验收SHA `bc1261ce090180d87b262744bd2b16e7c6caf60f`；同SHA [CI37891029812](https://github.com/suzhe868-arch/mb/actions/runs/37891029812)三个独立PG16作业全部成功。本批当前事实12/12、HTTPS旧会话3/3、证据校验4/4；原真实认证11/11及HTTPS安全4/4回归通过。
- 验收报告：`07_重建工作区/F03-2-1A_A主控最终验收签发与残余风险_2026-10-09.md`。A已读取归档SQL及inventory原文，独立计算SHA256与源清单精确吻合；结构与已验收F03-1一致（仅pg_dump配对随机key不同），无F03-2新DDL。
- **当前唯一工程下一步：A整理本批合并核验，以及逐能力范围结构与完整Guard下一批的技术裁决/施工单，供用户分别审查；B等待。** 合并本分支及下一批施工尚未获批。
- 本批只证明当前可信事实读取与撤权后的新请求重验。业务最终允许仍因scope/对象证据不足拒绝，未开放业务接口；SG01～08结构、完整写提交Guard、治理/交接及后批仍需分别授权。
- G0已验收合并；PDM Final/Current IA/Low-Fi及既有工程保持。C/H01独立未最终验收、不合并C、不增加折叠屏专项；不访问已有/业务/生产库、不部署或正式前端施工，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1A_ACCEPTED_A_MERGE_AND_SCOPE_GUARD_GATE_PREPARATION_AND_H01_VISUAL_REVIEW`；以下首轮整改信息保留为历史。

---

# HISTORICAL｜F03-2-1A首轮整改时

- A独立复验B `feat/f03-runtime-facts` HEAD `319db71604e1efd2ce12dbba7990c7ed1d3bc62a`；同SHA [CI37886758651](https://github.com/suzhe868-arch/mb/actions/runs/37886758651)成功，当前PG16测试9/9、HTTPS探针3/3。旧会话撤权测试可见，但完整验收仍有补项。
- **结论：CHANGES_REQUESTED / F03_2_1A_ACCEPTED尚未签发。** 报告：`07_重建工作区/F03-2-1A_A主控首轮复验与补测补证清单_2026-10-09.md`。
- **当前唯一工程下一步：B在当前分支补齐当前主店变化/身份硬禁令的真实测试、已验收F03-1真实认证与HTTPS安全回归，并归档本批CI结构证据，提交新SHA与同SHA成功CI交A复验。**
- 本批限定隔离PG16、无新DDL的授权持续有效；只允许原runtime-facts目录和本批工作流。完整scope Guard、SG01～08结构、治理/交接及后批未授权；不合并本B分支或C。
- G0已验收合并；PDM Final/Current IA/Low-Fi及既有工程保持。C/H01独立未最终验收、不增加折叠屏专项；不访问已有/业务/生产库、不部署或正式前端施工，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1A_B_CLOSE_TEST_AND_EVIDENCE_GAPS_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下初次放行信息为历史。

---

# HISTORICAL｜F03-2-1A初次放行时

- 用户在A窗口确认“确实”，批准A合并已验收G0方案并放行施工单中限定的F03-2-1A；A已完成 [PR #6](https://github.com/suzhe868-arch/mb/pull/6) merge，SHA `df4135f1e2eb37b109e4e23ff63642c211a643fa`。
- 合并验收：18新增文件blob均与B验收HEAD `d2c76ef2d27775a700fe1dbfa4be546c03253f1a` 完全相同，main原有1105文件保持原字节；合并后1123文件。G0验收CI36/36、A模型检查11/11仍为既有证据，不冒充本批测试。
- **A正式签发F03_2_1A_AUTHORIZED / USER_APPROVED / A_RELEASED / NOT_YET_IMPLEMENTED。当前唯一工程下一步：B从含本放行的最新main新建`feat/f03-runtime-facts`，执行当前身份/权限事实读取、旧会话撤权重验和缺范围证据拒绝的限定施工单，完成后交A独立验收。**
- 放行记录：`07_重建工作区/F03-2-1A_A主控方案合并与当前权限事实隔离施工放行_2026-10-09.md`；施工单：`07_重建工作区/F03-2-1A_当前身份权限事实读取与撤权重验施工单_待用户批准_2026-10-09.md`（以本次正式放行增补为准）。
- 仅在GitHub Actions独立PG16全新空库施工及测试，复用已验收F02→F03-1基线与隔离Guard；不新增F03-2 DDL、不启动F04业务接口。允许新增`engineering/f03/runtime-facts/**`和`.github/workflows/f03-2-1a-runtime-facts.yml`；既有工程/迁移/manifest/工作流保持，必要入口修改须先交A具体审查。
- 本批测试NOT_RUN、F03_2_1A_ACCEPTED尚未签发；完整范围Guard、SG01～08结构、治理事务/交接、F03-3/F04等仍另批。C/H01独立未最终验收、不合并C；PDM Final/Current IA/Low-Fi保持，不访问已有/业务/生产库、不部署、不启动正式前端、不加折叠屏专项，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1A_B_TRUSTED_RUNTIME_FACTS_AND_REVOCATION_A_REVIEW_AND_H01_VISUAL_REVIEW`。以下准备时“未批准/等待”状态仅为历史。

---

# HISTORICAL｜G0合并与1A施工单待批准时

- A已整理已验收G0的合并材料及 [草稿PR #6](https://github.com/suzhe868-arch/mb/pull/6)；尚未合并。工程HEAD仍为`d2c76ef2d27775a700fe1dbfa4be546c03253f1a`，同SHA CI36/36，五项整改闭合，F03_2_G0_ACCEPTED有效。
- 合并材料：`07_重建工作区/F03-2-G0_A主控合并核验材料_待用户批准_2026-10-09.md`；建议下一小批：`07_重建工作区/F03-2-1A_当前身份权限事实读取与撤权重验施工单_待用户批准_2026-10-09.md`。
- **当前唯一工程下一步：用户审查并分别批准G0合并与F03-2-1A施工单，A随后登记及执行对应授权；B暂时等待。**
- F03-2-1A建议在独立全新一次性PG16验证当前身份/权限事实读取、旧会话撤权和缺范围证据拒绝；无F03-2 DDL，不开放业务接口。此建议尚未放行，未创建施工分支，测试NOT_RUN。
- SG01～08新结构、完整范围Guard、治理事务/交接及F03-3/F04等后批仍未授权。本次用户“同意”仅批准A准备材料。
- PDM Final/Current IA/Low-Fi、既有工程不变；不访问已有/业务/生产库，不部署；C/H01独立未最终验收、不合并C、不加折叠屏专项，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_G0_MERGE_AND_F03_2_1A_WORK_ORDER_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`。以下既有验收登记保留为历史。

---

# HISTORICAL｜F03-2-G0验收签发时

- A正式签发 **F03_2_G0_ACCEPTED / A_SIGNED / STATIC_DESIGN_ONLY / NOT_MERGED**；五项整改R1～R5已闭合。本结论不等于F03_2_ACCEPTED。
- 验收工程：B `feat/f03-runtime-g0`，SHA `d2c76ef2d27775a700fe1dbfa4be546c03253f1a`；同SHA [CI37880600267](https://github.com/suzhe868-arch/mb/actions/runs/37880600267)成功，G0测试36/36；A独立补充检查11/11通过。
- 验收记录：`07_重建工作区/F03-2-G0_A主控最终验收签发与残余风险_2026-10-09.md`。范围仅设计、合同、纯假数据模型及静态检查；没有真实数据库、运行期Guard或治理事务验收。
- **当前唯一工程下一步：A整理本批合并核验材料，以及F03-2-1真实权限校验所需的技术裁决和施工单，交用户审查；B等待，不开始新施工。** 分支合并及下一批施工仍须分别授权。
- SG09复用已有`role_default_permission_history`；SG01～08仍为待裁决建议，不能据G0验收直接建表。真实锁/并发、撤权HTTP重验、事务审计及交接适配未执行。
- F03-1已验收合并；C/H01独立未最终验收。PDM Final/Current IA/Low-Fi不变；不访问已有/业务/生产库、不部署、不启动正式前端；F03-2后续实现批、F03-3、F02-2/3/4、F04未授权，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_2_G0_ACCEPTED_A_MERGE_AND_IMPLEMENTATION_GATE_PREPARATION_AND_H01_VISUAL_REVIEW`。以下首轮整改和初次放行信息仅保留为历史。

---

# HISTORICAL｜F03-2-G0首轮复验未通过，五项整改

- A已独立复验B `feat/f03-runtime-g0` HEAD `a56cb746ae14a2047be791a204b8b367767c7c9f`；同SHA[CI37877324106](https://github.com/suzhe868-arch/mb/actions/runs/37877324106)成功22/22及既有静态回归通过，但发现5项独立语义阻断。
- **结论：CHANGES_REQUESTED；F03_2_G0_ACCEPTED尚未签发。** 整改记录：`07_重建工作区/F03-2-G0_A主控首轮复验与五项整改清单_2026-10-09.md`。
- **当前唯一工程下一步：B继续当前分支，在G0静态范围修复已有历史表误报、模板治理身份、正常最后接客者保护、4S PC撤权重验及真实脱敏审计前后值；提交新SHA与同SHA成功CI/闭合表交A复验。**
- 原F03-2-G0限定设计/静态授权持续有效；不连接数据库，不修改已验收工程，不将22/22视为全批验收；后续真实Guard/治理/交接、F03-3、F02-2/3/4、F04未授权。
- F03-1已验收合并；B/C不合并，C/H01独立未最终验收；PDM Final/Current IA/Low-Fi不变，不访问已有/业务/生产库、不部署或正式前端施工，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_2_G0_B_FIX_FIVE_BLOCKERS_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下旧初次施工状态为历史。

---

# HISTORICAL｜F03-2-G0初次施工放行时

- 用户在A窗口明确“同意”；A正式签发 **F03_2_G0_AUTHORIZED / USER_APPROVED / A_RELEASED / NOT_YET_IMPLEMENTED**。
- 放行记录：`07_重建工作区/F03-2-G0_A主控事实映射与事务方案施工放行_2026-10-09.md`；工作单：`07_重建工作区/F03-2_运行期权限校验与治理事务施工单_待用户批准_2026-10-09.md`，以顶部正式放行增补为准。
- **当前唯一工程下一步：B从含本放行登记的最新main新建`feat/f03-runtime-g0`，完成事实/字段映射、scope及治理事务/撤权并发方案、结构缺口建议、纯假数据检查和静态CI，提交同SHA证据交A独立验收。**
- 本批不连接数据库，不实现真实Guard或业务路由，不执行迁移；已验收F02/F03-G0/F03-1工程保持。F03-2后续实现批、F03-3、F02-2/3/4、F04及部署/正式前端未授权。
- F03-1已验收并合并；C/H01独立未最终验收，不合并B/C、不增加折叠屏专项；PDM Final/Current IA/Low-Fi不变，`PRODUCT_BASELINE=NOT_READY`。
- 本轮仅登记正式放行，F03-2-G0测试NOT_RUN、验收未签发；现行指针：`F03_2_G0_B_RUNTIME_DESIGN_A_REVIEW_AND_H01_VISUAL_REVIEW`。以下旧待批准状态为历史。

---

# HISTORICAL｜F03-2工作单待批准时

- 用户已批准A整理下一批施工单；A已完成：`07_重建工作区/F03-2_运行期权限校验与治理事务施工单_待用户批准_2026-10-09.md`。
- **建议首先批准F03-2-G0：数据库当前事实映射、scope与治理事务合同、精确结构建议及纯假数据核验。** 待用户审查与A正式放行，不能把“同意整理”当成B施工授权。
- **当前唯一工程下一步：用户审查本施工单，决定是否批准限定F03-2-G0；B暂不创建分支或施工。** 获批后计划分支`feat/f03-runtime-g0`，从含正式放行的最新main建立。
- G0验收后，真实数据库动态Guard、治理事务/最后管理员及接客者保护、完整交接适配仍分别另批；F03-2-1/2/3、F03-3、F02-2/3/4、F04未授权。
- F03-1已验收并经[PR #5](https://github.com/suzhe868-arch/mb/pull/5)合并，merge SHA `3a7e5dbc389533cdcf05850cbaff595b97e3812b`；本轮只上传治理文档，没有新增F03-2测试、代码或数据库操作。
- PDM Final/Current IA/Low-Fi不变；C/H01独立未最终验收，不合并C、不增加折叠屏专项；已有/业务/生产库、部署与正式前端未授权，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_2_G0_RUNTIME_DESIGN_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下旧准备状态为历史。

---

# HISTORICAL｜F03-1合并后A门禁准备时

- 用户在A窗口明确“同意”，A已通过[PR #5](https://github.com/suzhe868-arch/mb/pull/5)将已验收F03-1工程合并main；merge SHA `3a7e5dbc389533cdcf05850cbaff595b97e3812b`。
- **F03_1_ACCEPTED / A_SIGNED / MERGED_TO_MAIN_USER_APPROVED**；工程验收SHA `0c2a9d3c998149fb086a5eac19639a1a0ca9e71a`，归档交接SHA `73e794119fea9630fd81eb84dd7c08eda7c9f664`。合并记录：`07_重建工作区/F03-1_工程合并main与后续门禁记录_2026-10-09.md`。
- A核验22个变更文件与B验收归档blob完全一致，main另外1076文件全部保留；此前1078文件中仅2个已验收工程入口文件变更，新增20文件，总1098文件。
- 真实CI37863317173属于工程验收SHA，专项19/19及既有回归通过；归档仅证据skip ci，本次未重跑测试，不冒称新main独立CI。
- **当前唯一工程下一步：A准备F03-2运行期权限校验施工单与验收门禁，提交用户审查；B暂不施工下一批。** 本次合并不授权F03-2/3、F02-2/3/4或F04。
- 业务/已有/生产库、部署及正式前端未授权；C/H01仍独立未最终验收，不合并C、不增加折叠屏专项；PDM Final/Current IA/Low-Fi不变，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_2_A_GATE_PREPARATION_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下旧合并待批准状态为历史。

---

# HISTORICAL｜F03-1验收后合并待批准时

- **A正式签发 F03_1_ACCEPTED / A_SIGNED（仅全新隔离PG16实现）**；验收记录：`07_重建工作区/F03-1_A主控最终验收签发与残余风险_2026-10-09.md`。
- 工程验收SHA `0c2a9d3c998149fb086a5eac19639a1a0ca9e71a`，真实[CI37863317173](https://github.com/suzhe868-arch/mb/actions/runs/37863317173)成功；专项19/19及既有回归通过，四项阻断闭合。
- B归档SHA `73e794119fea9630fd81eb84dd7c08eda7c9f664`仅追加3个证据文件，源码/工作流不变；归档skip ci，无新CI。A独立校验两个完整导出文件与原CI SHA256一致，80表/487字段/299约束/123索引核对通过。
- **当前唯一工程下一步：A提交已验收B工程纳入main的合并建议，等待用户批准；B本阶段完成，暂不施工下一批。**
- 本次仅登记A验收与状态，B工程尚未合并main；没有新main工程CI。F03-2/3、F02-2/3/4、F04、业务/已有/生产库、正式前端及部署仍未授权。
- C/H01独立推进未最终验收，不合并C、不增加折叠屏专项；PDM Final/Current IA/Low-Fi不变，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_1_ACCEPTED_A_MERGE_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下旧当前状态为历史。

---

# HISTORICAL｜F03-1施工放行时

- 用户明确“同意”；A已通过[PR #4](https://github.com/suzhe868-arch/mb/pull/4)合并已验收F03-1-G0方案，merge SHA `aa09c9a21752a5d3ce428253e29d2a0b88f76f46`；15文件与验收B一致，原main1061文件全部保持。
- **F03-1实际登录限定施工已正式放行**：`F03_1_IMPLEMENTATION_AUTHORIZED / USER_APPROVED / NOT_YET_IMPLEMENTED`；正式放行单：`07_重建工作区/F03-1_A主控方案合并与真实登录隔离施工放行_2026-10-09.md`；详细范围：`07_重建工作区/F03-1_真实登录与密码安全实现施工单_待批准_2026-10-09.md`顶部增补。
- **当前唯一工程下一步：B从含本放行登记的最新main新建 `feat/f03-login-impl`，实现登录/强制改密/退出/撤销会话及精确追加迁移，并仅在本次CI全新一次性PG16测试；提交同SHA真实CI、结构导出和并发/回滚证据交A验收。**
- 当前实际认证/PG事务测试NOT_RUN；原方案CI19/19属于已验收B SHA，本次没有新的独立main工程测试；F03_1_ACCEPTED尚未签发。
- F03-2/3、F02-2/3/4、F04、真实业务/生产/已有库、部署及正式前端未授权；PDM Final/IA/Low-Fi不变。C/H01继续独立审查未最终验收，本次不写/合并C，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_1_B_ISOLATED_LOGIN_IMPLEMENTATION_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下旧待批准/未合并状态仅为历史。

---

# HISTORICAL｜F03-1实现工作单待批准状态

- F03-1-G0方案批已验收，真实登录仍未施工；B验收SHA `d5987afc14d591db683facf15ebf767f9762af2a`，同SHA CI37856201791成功19/19；方案分支未合并main。
- **A已完成实际登录施工单准备**：`07_重建工作区/F03-1_真实登录与密码安全实现施工单_待批准_2026-10-09.md`；涵盖账号密码、强制改密、本人改密/退出、撤销会话、隔离PG16追加迁移、HTTPS和并发证据。
- **当前唯一工程下一步：用户审查该施工单，决定是否批准A纳入已验收G0方案并签发限定F03-1实现放行。** 批准前B不施工，A本轮不合并B/C、不运行数据库。
- 工程接线限制已写清：单一Node入口、原F01安全探针/build边界保持、F03独立guard/迁移器处理追加版本，不能篡改F02冻结runner/checksum。
- C/H01独立审查未最终验收；F03-2/3、F02-2/3/4、F04、真实业务/生产库和部署未授权；PDM Final/IA/Low-Fi不变，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_1_IMPLEMENTATION_WORK_ORDER_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下旧准备/施工状态为历史。本次只上传治理文档，工程测试NOT_RUN。

---

# HISTORICAL｜F03-1-G0验收后工作单准备状态

- **A正式签发F03_1_G0_ACCEPTED（仅方案与假数据批）**：验收B `feat/f03-login` SHA `d5987afc14d591db683facf15ebf767f9762af2a`；[同SHA CI 37856201791](https://github.com/suzhe868-arch/mb/actions/runs/37856201791)成功19/19，A另补查17/17通过，两项整改已闭合。
- 验收记录：`07_重建工作区/F03-1-G0_A主控验收签发与残余风险_2026-10-09.md`。真实登录、数据库/会话迁移及事务/部署仍NOT_RUN，不能将静态模型验收写成完整F03-1实现通过。
- **当前唯一工程下一步：A准备F03-1实际实现工作单及待裁定参数，交用户批准；B暂不施工下一批。** 工程分支尚未合并，合并需另行用户批准。
- C/H01独立审查继续且未最终验收。F03-1实现、F03-2/3、F02-2/3/4、F04及业务/生产库未授权，不改PDM Final/Current IA/Low-Fi，不擅自合并B/C，`PRODUCT_BASELINE=NOT_READY`。
- 本次只登记A治理文件，没有新增main独立测试；现行指针：`F03_1_G0_ACCEPTED_A_IMPLEMENTATION_GATE_PREPARATION_AND_H01_VISUAL_REVIEW`。以下旧施工状态为历史。

---

# HISTORICAL｜F03-1-G0方案施工时状态

- 用户于2026-10-09在A窗口明确“同意”；A正式登记 **F03_1_G0_AUTHORIZED / USER_APPROVED / NOT_YET_IMPLEMENTED**。
- 正式放行单：`07_重建工作区/F03-1-G0_A主控登录安全方案施工放行_2026-10-09.md`；工作范围见`07_重建工作区/F03-1_账号登录与密码安全工作单_待批准_2026-10-09.md`顶部放行增补。
- **当前唯一工程下一步：B从包含本放行登记的最新main新建 `feat/f03-login`，完成登录和密码安全方案、身份状态/会话合同、精确结构差异与纯假数据检查；提交精确SHA、同SHA成功CI、覆盖表和风险交A独立验收。** 已验收`feat/f03-auth`保留为历史。
- 仅方案批获准；真实登录、HTTP认证服务、数据库连接/建表/会话迁移及F03-1实现批仍未授权。本次登记没有运行新工程测试，不表示安全方案已验收。
- F03-G0已验收并合并；C/H01继续独立审查且未最终验收。F03-2/3、F02-2/3/4、F04及业务/生产库未授权，不改PDM Final、Current IA/Low-Fi，不擅自合并B/C，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_1_G0_B_SAFETY_DESIGN_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下旧待批准/施工状态仅为历史。

---

# HISTORICAL｜F03-G0验收合并后、F03-1方案待批准

- **F03-G0已正式验收并合并main**：B SHA `b4b56401b68ba91776ddd7edfa0b545586137720`；[CI 37852018024](https://github.com/suzhe868-arch/mb/actions/runs/37852018024)同SHA成功，34/34静态检查；[PR #3](https://github.com/suzhe868-arch/mb/pull/3)已merged，merge SHA `6983709937ebf1d9ae8a7f6cd0a4267bb2269ac6`。
- A验收/合并记录：`07_重建工作区/F03-G0_A主控验收与合并记录_2026-10-09.md`。缺编号与历史嵌套内容泄露两处阻断已闭合；本批仅合同/纯模块/假数据，不表示真实登录或DB动态授权已完成。
- **A下一批工作单已准备**：`07_重建工作区/F03-1_账号登录与密码安全工作单_待批准_2026-10-09.md`。建议先批准F03-1-G0账号登录与密码安全方案、状态/会话合同及精确结构差异小批；用户批准前B不施工。实际认证、会话表迁移另行审查放行。
- 真实测试证据来自B精确SHA，合并后main没有新的独立测试运行；本次只登记治理记录，没有部署或访问数据库。
- C/H01独立审查继续；F03后续批、F02-2/3/4、F04正式施工及业务/生产库未授权，不擅改PDM Final/Current IA/Low-Fi，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_1_G0_SAFETY_DESIGN_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下较早待施工状态为历史。

---

# HISTORICAL｜F03-G0限定首批获准施工时

- 用户于2026-10-09明确“同意放行”；A正式签发 `F03_G0_AUTHORIZED / USER_APPROVED / NOT_YET_IMPLEMENTED`。
- 正式放行单：`07_重建工作区/F03-G0_A主控正式施工放行_2026-10-09.md`；详细范围：`07_重建工作区/F03_开工门禁与分批施工建议_待用户批准_2026-10-09.md`（顶部放行增补为准）。
- **B当前任务**：从包含本次放行登记的最新main新建 `feat/f03-auth`，只施工F03-G0权限合同、身份会话合同、纯权限决策模块与假数据静态正反例；提交SHA、真实CI、规则覆盖表与风险交A验收。原 `feat/f02-schema` 保留。
- 本批不连接数据库，不做真实登录/微信接入、会话表迁移或F04业务API。F03-1/2/3、F02-2/3/4及其它后续正式施工仍未授权。
- F02-G0/F02-1已验收并合并，C/H01继续原独立视觉审查，不因本放行自动验收/合并或扩展折叠屏；产品Authority不变，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_G0_B_IMPLEMENTATION_A_REVIEW_AND_H01_VISUAL_REVIEW`。下面旧待批准状态是本次用户批准前的历史记录。

---

# HISTORICAL｜2026-10-09 F02-1合并后F03待批准状态

- **F02-G0/F02-1 = ACCEPTED / MERGED_TO_MAIN**。[PR #2](https://github.com/suzhe868-arch/mb/pull/2)已合并，merge SHA `3412dc76815e97a7df9024d8b7812a2aece7036c`；已验收B SHA `9f10f65be293fd892e4787a3a3bdff2676c487ea`。
- 合并记录：`07_重建工作区/F02-1_工程合并main与后续门禁记录_2026-10-09.md`；核对B 83个engineering/workflow blob一致、main原有979文件全部保留。63新增文件，无产品Authority改写。
- 真实F02 CI证据来自已验收B SHA，不将其写成合并后main独立回归；本次没有重跑数据库测试。
- **当前唯一工程下一步：用户审查并决定是否批准F03-G0限定首批。** 工作单：`07_重建工作区/F03_开工门禁与分批施工建议_待用户批准_2026-10-09.md`；只准备门禁，B当前暂不施工，F03-1及其余批次另行放行。
- C/H01独立视觉复核继续，未最终验收；F02-2/3/4、F04及其他正式施工、业务/已迁/生产库、C合并仍未授权；不增加折叠屏专项，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_G0_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`。以下较早“当前/最新”均为历史过程。

---

# HISTORICAL｜2026-10-09 F02-1验收登记时（合并前）

- **A 正式签发：`F02_1_ACCEPTED / A_SIGNED / USER_APPROVED`**。验收 B `feat/f02-schema` 精确 SHA `9f10f65be293fd892e4787a3a3bdff2676c487ea`；[F02-1 CI 37843224982](https://github.com/suzhe868-arch/mb/actions/runs/37843224982) 与 [G0 CI 37843225062](https://github.com/suzhe868-arch/mb/actions/runs/37843225062) 同一 SHA、completed/success。
- 正式签发与风险记录：`07_重建工作区/F02-1_A主控最终验收签发与残余风险_2026-10-09.md`。独立核验实际工件：76业务表、464字段、160外键、28额外唯一索引、39 CHECK、5历史触发器；5/5非表对象拒绝、32项fixture、事务失败回滚、1 applied +3 idempotent并发及结构漂移负例通过。
- **本次仅将 A 验收与状态登记 main；B 工程代码仍在 B 分支，未合并。** main 没有因此获得 F02-1 工程实现；上述运行证据来自已验收 B SHA，不是 main 业务/部署测试。
- 当前工程下一步：A 提交已验收工程合并及下一阶段门禁建议，等待用户另行批准；B 本阶段结束，暂不启动新施工。C/H01 独立视觉复核继续，未最终验收，暂不增加折叠屏专项。
- F02-2/3/4、F03/F04正式施工、B/C合并main、业务/已迁/生产库访问仍未授权；PDM Final / Current IA / Current Low-Fi 不变，`PRODUCT_BASELINE=NOT_READY`。
- 唯一现行指针：`F02_1_ACCEPTED_A_NEXT_GATE_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`。以下历史“当前/最新”描述不覆盖本节。

---

# HISTORICAL｜2026-10-08 A签发G0并放行F02-1时的状态

- 用户本轮明确“同意”，正式批准 A 将 F02-G0 最终通过结果落库；验收签发：`07_重建工作区/F02-G0_A主控最终验收签发与F02-1隔离施工放行_2026-10-08.md`。A 已验证 B 工程 HEAD `f2cdb0e8c7967aeaa8cfea5c6b466c9b45a68946` 对应真实 CI `37722491859`，F01 13/13 + G0分级2/2 + G0全量75/75 共 90/90 PASS。
- G0 经独立终审的候选台账：25/25 PDM 全域映射、510/510 字段编号完整（464 INCLUDE / 33 DEFER / 13 EXCLUDE）、82 候选实体、76 F02-1 最小拟建实体、137 显式外键断链为0；System Admin/Matching/CRM/公海与G0-ALL-05单一 PC 凭证全部静态闭环。A 正式签发 `G0_ACCEPTED / A_SIGNED`；不等于已运行 F02-1 业务 DDL。
- B 现行施工单 `07_重建工作区/F02_正式施工单_数据库模型与隔离开发_2026-10-08.md` §2，按原用户条件批准 `F02-1 AUTHORIZED_FOR_ISOLATED_IMPLEMENTATION / NOT_RUN`，仅在 `feat/f02-schema` 的一次性隔离 PG16 空库进行新 Current Schema 建表、迁移/回滚/幂等/约束/并发实测，提交真实代码 SHA、迁移/SQL、日志及 schema dump 交 A 复验。
- F02-2/3/4、F03/F04 正式施工、生产/已迁真实库、危险旧脚本及 B 合并 main 未获批准；C/H01 独立视觉审查，H02 未授权。正式 PDM Final / Current IA / Low-Fi 未改，`PRODUCT_BASELINE=NOT_READY`。以下此前标记“当前”的 G0-CL/G0-SC 状态均是历史，不再覆盖本签发。

---

# HISTORICAL｜2026-10-08 四域范围一致性补审（此前状态）

- 用户明确“同意，确定执行”：正式 A 补审单 `07_重建工作区/F02-G0_A主控范围一致性定向补审单_SystemAdmin_匹配_CRM_公海_2026-10-08.md` 已落库；发现 F02-1 正式施工单涉及 System Admin 身份、Demand/Match Result、CRM Follow-up 与公海历史保护，但 B `deferred-entity-register.tsv` 对应四实体仍整表延期、尚未提供完整替代承载映射。
- B 最新独立复验基点 `feat/f02-schema=ea14fb372a6ab598177d1a8a067e2b1df3ebf480`，CI `37712078050` SUCCESS。F01 13/13、G0 40/40、PG16 安全隔离通过；413 字段分流、53 拟建实体、96 静态 FK 断链 0。G0-CL-01/02 本轮确认闭环，**不重做**。
- B 当前仅在工程分支逐事实映射四项最低持久化身份/结果/历史/保护承载，必要时提出最小字段补纳并维持原矩阵闭合；只以“后续阶段处理”为由整表延期不可接受。A 根据新 SHA、矩阵及真实 CI 复验，仍由 A 独立判断 G0 签发。
- `G0_ENVIRONMENT_PASS / G0_CL01_CL02_PASS / G0_SCOPE_COVERAGE_PENDING / G0_MODEL_FREEZE_PENDING / G0_ACCEPTED=NO`；F02-1 尚未开始，条件授权未满足。F02-2/3/4、F03/F04、业务/已迁/生产数据库和 main 合并继续未获授权。
- PDM-01～25 Final、Current IA、Current Low-Fi 未改；C/H01 独立视觉返修、无 H02 放行；`PRODUCT_BASELINE=NOT_READY`。以下旧“当前最新”标题保留作历史过程，均不能覆盖本条。

---

# HISTORICAL｜2026-10-08 A 主控 G0-CL01/02 两类定向整改（此前状态）

- 用户明确“同意，确定执行”：A 独立复验 B `feat/f02-schema` HEAD `95fb1776eec535fb4e83b48d292034dfcb49c8fb`、GitHub CI `37710259345`（F01 13/13、G0 30/30 和 PG16 环境通过）。A 查出两类**字段拟施工集合完整性缺口**：纳入的 FK 引用被延期表；局部实体只纳个别业务字段却延期其身份键/必要关联。
- 主控定向整改单：`07_重建工作区/F02-G0_A主控最终门禁整改单_外键闭合与实体完整性_2026-10-08.md`，要求 B 只在工程分支修订纳入/延期范围、依赖与最小实体闭合，补负例及真实 CI；完成后交 A 独立验收。本次**不是 A 代 B 实施，也不是 G0 模型冻结通过**。
- `G0_ENVIRONMENT_PASS / G0_MODEL_FREEZE_PENDING / G0_CHANGE_REQUEST_USER_APPROVED / G0_ACCEPTED=NO`；F02-1 按已批准规则只有 A 签发 G0_ACCEPTED 才能在独立 PG16 空库开发。F02-2/3/4、F03/F04、main 合并、旧库、生产库均未获授权。
- C/H01 仍在独立视觉返修审查；PDM-01～25 Final、Current IA、Current Low-Fi 不变；`PRODUCT_BASELINE=NOT_READY`。本节覆盖以下前一阶段“现行最新状态”描述，以下保留为历史实况。

---

# HISTORICAL｜2026-10-08 F02-G0 与条件 F02-1 原始施工获批（前次状态）

- 用户明确“确认执行”：批准从本次全部 main 状态文件落库后最新提交新建 `feat/f02-schema`，并向 B 放行 F02-G0 独立测试环境/字段基线；**F02-G0 经 A 实证验收后**才可施工 F02-1 的 disposable PG16 新装 Current Schema 与真实测试。正式工作单 `07_重建工作区/F02_正式施工单_数据库模型与隔离开发_2026-10-08.md`、技术裁定 `07_重建工作区/F02_主控技术裁定与开工门禁_2026-10-08.md`。
- B 旧 `feat/f01-foundation` 上新增的三份 F02/F03/F04 Gate 材料已原文收录 main；旧分支不重置、未合并旧分支的落后主控内容；未来 F02 仅在新分支施工。
- A-G02-01～10 工程裁定包括：PG16 隔离、受控 `pg` 迁移器原子/checksum/advisory lock；新装与真实已迁库升级分流；独立多草稿、三级车型/source mapping、LockRequest/Lock/Waitlist 与 Refund 三态分离；F03 权限 hard DENY 不由数据库表存在隐含授权；F04 单入口 TypeScript/Fastify 仍需独立验证。
- **未授权**：F02-2 已迁/生产真实数据库兼容升级、F02-3 正式历史 CSV 导入、F02-4 业务跨域施工、F03/F04 正式施工、旧清库脚本、main 合并；未经批准不能访问任何真实用户数据。F02 Schema/DDL/集成测试当前为 `NOT_RUN`。
- F01=`ACCEPTED/MERGED_TO_MAIN` 不变；C/H01 仍待 A 修订复核与用户视觉确认，C 分支未修改/合并；PDM-01～25 Final、Current IA 和 Current Low-Fi 不变。
- 当前唯一执行指针 `F02_G0_THEN_F02_1_ISOLATED_H01_REVIEW`，`PRODUCT_BASELINE=NOT_READY`。以下是此前历史状态快照，不得覆盖本条最新状态。

---

# HISTORICAL｜2026-10-08 F01 验收及合并时的旧主控状态

- **F01 = ACCEPTED / MERGED_TO_MAIN / 用户“确认执行”**；A 主控完成 `feat/f01-foundation` 的 11 个提交、27 个新增文件检查，以及 [PR #1](https://github.com/suzhe868-arch/mb/pull/1) 合并；GitHub merge commit = `16354f9784cb187dfc44289d9e5010e1471b1b81`。
- 正式 A 验收记录与风险台账：`07_重建工作区/F01_工程基础验收与合并记录_2026-10-08.md`。验证来源为 B 分支 GitHub CI 运行 `37695813678`：13 项基础测试 + 5 项真实 PG 集成测试通过，隔离 PostgreSQL 16 停库/同一 HTTP 进程恢复成功。**main 合并后没有新增独立 CI 成功记录**，不可虚报。
- F01-1 / F01-2 / F01-3 / F01-4 全部 `ACCEPTED`，仅表示当前工作单的**基础 HTTP/环境/预检/开发隔离/PG ready**实现完成；当前脚本只做 JavaScript 语法检查/复制，未进行 TypeScript 类型编译。
- 工程未完成项保持明确：F02 业务 Schema/增量迁移、F03 身份权限、F04 现行接口、F05～F07 业务及 F08 综合验收；**218 历史接口不等于正式可运行接口**；F01 只实现健康检查端点和隔离 PG 测试，生产模式继续阻断。
- 设计 `design/h01-design-system` **仍在独立分支**，本次未修改/合并；H01 处于 `READY_FOR_A_REVIEW / CHANGES_REQUESTED / USER_VISUAL_PENDING`，设计样稿和品牌展厅风格需 A 与用户进一步确认，不得推断 H01/H02 已获最终批准。
- 当前唯一下一组行动：**C 的 H01 返修复核与用户视觉方向讨论 + B/A 的 F02/F03/F04 分阶段门禁与非破坏性技术方案准备**。实际数据库迁移/权限/API 施工需要各阶段另获用户批准；H02/H03 亦需按批准页面批次放行。
- **产品总基线仍 `NOT_READY`**；PDM-01～25 Final、Current IA、Current Low-Fi 和原工程启动门禁三份文档没有因 F01 验收而更改。
- 当前全局唯一指针为 `F01_ACCEPTED_H01_REVIEW_ENGINEERING_NEXT_GATE`；以下此前状态条目均是按产生日期保留的**历史快照**，不覆盖本次最新结论。

---

# HISTORICAL｜2026-10-08 A/B/C 三窗口协作与完整路线图落库（仅治理资料，F01 已完成）

- 用户明确回复“确认执行”，批准将 `A_B_C三窗口协作与验收规范.md`、`B工程完整施工路线图_F01至F08.md`、`C设计完整执行路线图_H01至H04.md` 写入 `main/07_重建工作区/`，并更新接力入口和全局状态说明。
- 本次修改定位：**三窗口管理、施工路线、验收/分支交接**。不触及 PDM-01～25 Final、Current IA、Current Low-Fi、工程门禁三份正式文档、业务代码、数据库、设计执行分支或历史资产。
- A 主控审核全局、合并决策；B 工程在 `feat/f01-foundation` 按获批范围处理 F01；C 设计在 `design/h01-design-system` 按获批范围处理 H01。F02～F08、H02～H04 **仅为预先路线规划**，必须另验依赖与阶段授权。
- main 会新增治理提交，B/C 分支不自动包含；B/C 须读取 `ref=main` 的三个最新文档而继续在原工作分支施工，不擅自合并/重置。B/C 在各自分支提交可复现证据，A 读取分支审查。
- 继续执行的全局唯一下一组任务：`F01 + H01` 双轨。产品总基线 `NOT_READY`；工程 Gate `PASS`，但 F01/H01 的实际施工/测试/验收不得因本次文档落库而虚记完成。
- H03 正式前端继续受“High-Fi 具体批次由用户确认 + 可联调 API + A 放行”约束；H04 联调/UAT/上线另行审批。

# HISTORICAL｜2026-10-08 工程启动门禁正式 PASS（F01 开工前快照）

- Gate：`PASS / USER_APPROVED / APPLIED`；不等于 F01/H01 已启动，更不等于工程代码、数据库、接口或页面已施工。
- 审查源 HEAD：`0ff42c5782192541baa06bf12f8bfdc285a5f5ca`；本次文档/状态同步提交为正式写入凭据。
- 历史工程资产：160/160 路径级分类（39 候选复用、30 必须改、1 禁恢复旧实现、6 数据校验、2 重新生成、30 重做测试基准、52 历史参考）。
- 旧接口：218/218 路径级 PDM 主要归属与施工责任（207 待逐字段审查、6 重构、4 禁恢复、1 可复用候选）；字段安全、运行路由和测试不在 Gate 内冒充 PASS。
- 差异风险：EG-01～32；新增当前需求：ADD-01～09；对应 F01～F08 施工单，H01～H04 设计/前端门禁。
- 门禁三份交付：
  - `07_重建工作区/工程启动门禁_历史工程复用与差异台账_2026-10-08.md`
  - `07_重建工作区/工程启动门禁_工程基础施工单与验收标准_2026-10-08.md`
  - `07_重建工作区/工程启动门禁_最终审查报告_2026-10-08.md`
- Current Authority：PDM-01～25 Final → Current IA → Current Low-Fi；历史 9/22 Delta / Legacy Engineering = INPUT_ONLY，不得直接施工。
- 特别封堵 PDM-06 草稿歧义：以 **多草稿自动保存、无手动保存按钮** 为 Current；历史“禁止自动保存”说法不是权威。
- 当前唯一下一组行动：**F01 工程基础环境与骨架 + H01 Design System / 核心模板（并行）**；F02～F04 仅可先做不破坏的设计准备。
- F01/H01 开工之后每项另按施工单验收；正式前端依然是“高保真确认一批 → 开发一批”。
- `PRODUCT_BASELINE=NOT_READY`；`ENGINEERING=STARTUP_GATE_PASS / FOUNDATION_READY / NO_CONSTRUCTION`；`HIGH_FI=READY_TO_START / NOT_STARTED`。

## HISTORICAL_AUDIT_TRAIL｜以下保留先前阶段真实状态，不再作为当前指针

## 2026-10-08｜工程启动流程已冻结，当前进入 Engineering Startup Gate

- PDM-01～25 Final：继续作为最高产品业务 Authority
- IA：`COMPLETE / FINAL_GAP_PASS`
- Low-Fi：`COMPLETE / FINAL_GAP_PASS`
- Engineering：`STARTUP_GATE_READY / NO_CONSTRUCTION`
- High-Fi / Design System：`PLANNED_AFTER_GATE / NOT_STARTED`
- 当前唯一下一步：**Engineering Startup Gate｜工程启动门禁**
- Gate 输入：`05_证据_E_工程总闭环待执行Delta/工程总闭环待执行Delta清单.md` + `09_历史工程资产基线/` + 当前可取得工程资产
- Gate 期间：只读、比对、分类、登记风险、生成施工单；**禁止正式业务代码 / Schema / API / 权限 / 前端施工**
- 旧工程与 9/22 Delta：只作候选复用/历史证据，必须按 `PDM Final → Current IA → Current Low-Fi` 重验
- Gate PASS 后双轨：`Engineering Foundation` + `High-Fi / Design System`
- 工程底层可先做：Database / Domain Model / Permission / State Machine / API / Service / Test Harness
- 正式前端：`High-Fi 确认一批 → Frontend 放行一批`
- High-Fi 不要求全部 Low-Fi SVG 逐张确认；先 Design System / 代表模板 / 核心页面 / 关键链路，再批量覆盖重复状态
- Engineering / High-Fi 如发现产品冲突：登记 Delta → 暂停受影响项 → 返回产品裁决 → 用户确认 → 更新 Authority → 再施工
- AI 为主执行者；用户保留新产品选择、Authority 修改、核心视觉方向、真实生产账号/环境、UAT/上线批准
- Product Baseline：`NOT_READY`

## 2026-10-08｜Low-Fi Batch 4 Final-gap 已执行，Low-Fi 全局集中对齐 COMPLETE

- `LF-B4-01 = PASS / USER_APPROVED / APPLIED`
- Low-Fi：`COMPLETE / FINAL_GAP_PASS`
- `FINAL_GAP_SCAN = PASS`
- `LOW_FI_BUSINESS_CONFLICT = 0`
- `LOW_FI_VALID_MISSING_CARRIER = 0`
- `LOW_FI_DANGLING_NAV_TARGET = 0`
- `LOW_FI_MISSING_PHYSICAL_ASSET = 0`
- `LOW_FI_STATE_ASSET_GAP = 0`
- `LOW_FI_INCOMPLETE_PAGE = 0`
- LockRequest V2 carrier index closure：`5 / 5 PASS / NO_PRODUCT_SEMANTIC_CHANGE`
- IA Current 已登记：`C01-M04 / E07-07 / E07-08 / E07-M04 / E07-M05`
- Low-Fi 新 Page / State / SVG：`0 / 0 / 0`
- 历史退役资产：`26 / RETAIN_FILE_NOT_CURRENT`
- IA：继续 `COMPLETE / FINAL_GAP_PASS`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- Engineering：`READY_TO_START / NO_CONSTRUCTION`
- Product Baseline：`NOT_READY`
- 当前唯一下一步：**Engineering / 施工**
- Engineering 当前入口：`05_证据_E_工程总闭环待执行Delta/工程总闭环待执行Delta清单.md`

## 2026-10-08｜Low-Fi Batch 3 已执行，进入 Batch 4 Final-gap Scan

- `LF-B3-01～LF-B3-04 = PASS / USER_APPROVED / APPLIED`
- Low-Fi：`IN_PROGRESS / BATCH_1_2_3_APPLIED`
- `VALID_NEW_CARRIER_GAP = 0`
- `LOW_FI_NEW_PAGE = 0`
- `LOW_FI_NEW_STATE = 0`
- `LOW_FI_NEW_SVG = 0`
- IA stale carrier repair：`4 / 4 PASS / NO_PRODUCT_SEMANTIC_CHANGE`
- E01-01 机械假缺口：`FALSE_MISSING_CARRIER / DO_NOT_ADD`
- Publisher 电话诊断 Current 指针：`P03-02`
- C01-01 Lock 投影：`LOCK_REQUEST_PENDING / LOCKED_BY_SELF / LOCKED_BY_OTHER`
- Refund close 文案：`确认关闭`
- LF-B3 定向 stale-current scan：`0`
- IA：继续 `COMPLETE / FINAL_GAP_PASS`
- Engineering：`NO_CONSTRUCTION`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- 当前唯一下一步：**Low-Fi Batch 4｜Final-gap Scan（冲突 / 遗漏 / 缺口 / 新选择）**

## 2026-10-08｜Low-Fi Batch 2 已执行，进入 Batch 3

- `LF-B2-01～LF-B2-07 = PASS / USER_APPROVED / APPLIED`
- Low-Fi：`IN_PROGRESS / BATCH_1_2_APPLIED`
- Page / Navigation / State / Asset Map：MD + CSV 已同步
- P06-07 Opportunity rules：`RETIRED / DO_NOT_RESTORE`
- Refund：主状态已收口为 `pending / refunded / closed`
- Announcement：同 Customer / UTC+8 业务日主动弹层全局最多 1 条
- 累计 `RETAIN_FILE_NOT_CURRENT = 26`
- LF-B2 定向 stale-current scan：`0`
- 反向发现的 IA stale carrier 已同步修复：`PASS / NO_PRODUCT_SEMANTIC_CHANGE`
- IA：继续 `COMPLETE / FINAL_GAP_PASS`
- Engineering：`NO_CONSTRUCTION`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- 当前唯一下一步：**Low-Fi Batch 3｜后续明确新增 / 承载补齐审查**

## 2026-10-08｜Low-Fi Batch 1 已执行，进入 Batch 2

- `LF-B1-01～LF-B1-07 = PASS / USER_APPROVED / APPLIED`
- Low-Fi：`IN_PROGRESS / BATCH_1_APPLIED`
- Page / Navigation / State / Asset Map：MD + CSV 已同步
- 实际 Low-Fi SVG：保留页面已按 Final/IA 调整；25 个旧 SVG 已标记 `RETIRED / DO_NOT_RESTORE`
- LF-B1 定向 stale-current scan：`0`
- 反向发现的 IA stale carrier 已同步修复：`PASS / NO_PRODUCT_SEMANTIC_CHANGE`
- IA：继续 `COMPLETE / FINAL_GAP_PASS`
- Engineering：`NO_CONSTRUCTION`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- 当前唯一下一步：**Low-Fi Batch 2｜明确废弃 / 已覆盖 / 不得恢复审查**

## 2026-10-08｜IA Batch 4 已执行，IA 全局集中对齐完成

- `IA-B4-01～IA-B4-06 = PASS / USER_APPROVED / APPLIED`
- IA：`COMPLETE / FINAL_GAP_PASS`
- Batch 4 关闭剩余 `CARRIER_DEFERRED = 4`
- 当前剩余 `CARRIER_DEFERRED = 0`
- IA Current 目录 11 份文件 current-row stale 扫描：`0`
- `FINAL_GAP_SCAN = PASS`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM_FINAL_BUSINESS_SEMANTIC_CHANGE = 0`
- Low-Fi：`READY_TO_START`
- Engineering：`NO_CONSTRUCTION`
- 当前唯一下一步：**Low-Fi 全局集中对齐**

## 2026-10-08｜IA Batch 2 + 3 已执行，进入 Batch 4

- `IA-B2-01～IA-B2-19 = PASS / USER_APPROVED / APPLIED`
- `IA-B3-01～IA-B3-30 = PASS / USER_APPROVED / APPLIED`
- IA：`IN_PROGRESS / BATCH_1_2_3_APPLIED`
- 本轮关闭 stale carrier：`104`
- 当前剩余 `CARRIER_DEFERRED = 4`
- Low-Fi / Engineering：`NO_CONSTRUCTION`
- 当前唯一下一步：**IA Batch 4｜Final-gap Scan（冲突 / 遗漏 / 缺口 / 新选择）**

## 2026-10-08｜IA Batch 1 已执行

- `IA-B1-01～IA-B1-16 = PASS / USER_APPROVED / APPLIED`
- IA：`IN_PROGRESS / BATCH_1_APPLIED`
- 对应 16 条 stale carrier：`CARRIER_CLOSED_IA_BATCH1`
- Low-Fi / Engineering：`NO_CONSTRUCTION`
- 当前唯一下一步：**IA Batch 2｜明确废弃 / 已覆盖 / 不得恢复审查**

## 2026-10-07｜Final / Integrity 历史尾巴清理 PASS，IA 全局集中对齐 READY_TO_START

- PDM-01～25 Global Final Audit：`PASS`；
- Final / Integrity 历史阶段尾巴清理：`PASS`；
- 历史载体显式标注：`68 / 68`；
- 正式 Final 旧阶段尾巴修正：`12`；
- 正式 Final Integrity 旧阶段尾巴修正：`13`；
- `STALE_CURRENT_POINTER_UNQUALIFIED = 0`；
- `FINAL_BUSINESS_SEMANTIC_CHANGE = 0`；
- Current / History Boundary：`PASS`；
- 复核报告：`07_重建工作区/PDM-01至25_Final_Integrity历史阶段尾巴清理与Current_History边界复核_2026-10-07.md`；
- IA：`READY_TO_START / NO_CHANGES_APPLIED`；
- Low-Fi / Engineering：`NO_CONSTRUCTION`；
- `PRODUCT_BASELINE = NOT_READY`；
- 当前唯一下一步：**IA 全局集中对齐。**

## 2026-10-07｜PDM-01～25 全局最终总复核 PASS，进入历史阶段尾巴统一清理

- PDM-01～25：`25 / 25 COMPLETE / INTEGRITY_PASS`；
- Global Final Audit R1：4 组控制面 stale pointer 已全部修复；
- Global Final Audit R2：`PASS`；
- 正式报告：`07_重建工作区/PDM-01至25_全局跨域移交与全局不变量最终总复核_2026-10-07.md`；
- Cross-PDM Handoff：165 条 = 164 `HANDOFF_CLOSED` + 1 `HANDOFF_SUPERSEDED`；
- `HANDOFF_OPEN = 0`；
- `HANDOFF_ACCEPTED = 0`；
- `SOURCE_BACKWRITE_PENDING = 0`；
- `CROSS_PDM_CONFLICT = 0`；
- `GLOBAL_INVARIANT_CONFLICT = 0`；
- `NEGATIVE_CLAIMS_VERIFIED = PASS`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- `PRODUCT_BASELINE = NOT_READY`；
- 当前唯一下一步：**PDM-01～25 Final / Integrity 历史阶段尾巴统一清理与 Current / History 边界标注。**

## 2026-10-07｜PDM-25 Final Closeout 完成，进入 PDM-01～25 全局最终总复核

- PDM-25 Final Domain Overview：`USER_FINAL_APPROVED`；
- 用户随后明确：`确定执行`；
- PDM-25：`COMPLETE / INTEGRITY_PASS`；
- 正式 Final：`07_重建工作区/PDM-25_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-25_最终完整性复核_2026-10-07.md / PASS`；
- `PDM25_FORMAL_UNITS = 37`；
- 24 / 24 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-01～24 Final / Integrity source backwrite：`24 / 24 DONE`；
- `SOURCE_DECISION_COVERAGE = 100%`；
- `FINAL_TO_SOURCE_TRACEABILITY = 100%`；
- `SEMANTIC_INTEGRITY = PASS`；
- `NEGATIVE_CLAIMS_VERIFIED = PASS`；
- `IMPLEMENTATION_READY = PASS`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- `PRODUCT_BASELINE = NOT_READY`，仍需完成 PDM-01～25 全局最终总复核以及后续 carrier 集中对齐；
- 当前唯一下一步：**PDM-01～25 全局 Cross-PDM / Handoff / Global Invariant 最终总复核。**

## 2026-10-07｜PDM-25 Prefinal R1 修复完成，R2 PASS / FINAL_CANDIDATE_READY

- `P25-LIA-01～P25-LIA-03 = PASS / USER_APPROVED / APPLIED`；
- PDM-25 专属信息保真检查卡已建立；
- HO-P20-P25-001：copy-before-view / Customer Safe Projection 字段级安全 landing 已补齐；
- HO-P21-P25-001：Internal Mode / 5 分钟后台退出 / entry_context landing 已补齐；
- `R1_REPAIR_CLOSED = 3 / 3`；
- `SOURCE_TO_ATOM = PASS`；
- `ATOM_TO_SOURCE = PASS`；
- `SOURCE_DECISION_COVERAGE = 100%`；
- `UNMAPPED = 0`；
- `FINAL_TO_SOURCE_TRACEABILITY = 100%`；
- `SEMANTIC_COMPLETENESS = PASS`；
- `NEGATIVE_CLAIMS_VERIFIED = PASS`；
- `IMPLEMENTATION_READY = PASS`；
- `PDM25_FORMAL_UNITS = 37`；
- `PDM25_FINAL_CANDIDATE_READY = YES`；
- 24 / 24 incoming handoff landing 已通过，但仍保持 `HANDOFF_ACCEPTED`，最终批准前不关闭 / 不 source backwrite；
- Final Overview 候选：`07_重建工作区/PDM-25_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**用户最终审查 / 批准 PDM-25 Final Domain Overview。**

## 2026-10-07｜PDM-25 Batch 4 已批准并执行，进入 Prefinal Integrity

- `P25-B4-01～P25-B4-04 = PASS / USER_APPROVED / APPLIED`；
- `CHOICES = 1A / 2A / 3A / 4A`；
- Final-gap Scan：`PASS`；
- 审计保留动作发生当时的身份上下文，后续角色 / 门店 / scope 变化不回写旧事件；
- UTC+8 统一业务自然日与展示解释，不把 source / received / planned / actual 等不同时间事实压成一个时间；
- 幂等 / retry-safe 不制造重复业务成功历史，attempt 与 actual success 分离；
- 采用 4A：不规定全局统一 Audit Log retention 天数；来源域要求永久保留的业务历史继续永久真实，技术日志 retention / 归档实现留 Engineering / 合规；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- 24 / 24 incoming handoff 继续 `HANDOFF_ACCEPTED`，PDM-25 Final Closeout 前不关闭 / 不 source backwrite；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**PDM-25 Final 前完整性复核（Prefinal Integrity）。**

## 2026-10-07｜PDM-25 Batch 3 已批准并执行，进入 Batch 4 Final-gap Scan

- `P25-B3-01～P25-B3-04 = PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation：`PASS`；
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`；
- `DUPLICATE_RULE_CREATION = 0`；
- version 模型只承接来源域已存在版本语义，不给普通配置强造版本状态机；
- 失败 / 跳过 / 去重 / 无有效结果不得伪装成成功；
- 合法批量 mutation 保留逐对象结果，并服从来源域是否允许 partial success；
- 组合入口不合并独立 domain action，分别 Guard / result / history；
- 24 / 24 incoming handoff 继续 `HANDOFF_ACCEPTED`，Final Closeout 前不关闭 / 不 source backwrite；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**PDM-25 Batch 4｜Final-gap Scan（冲突 / 遗漏 / 缺口 / 新选择）。**

## 2026-10-07｜PDM-25 Batch 2 已批准并执行，进入 Batch 3

- `P25-B2-01～P25-B2-08 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan：`PASS / FALSE_DEPRECATION_COUNT=0`；
- Customer Merge 不得因历史审计项恢复；
- 独立 Recommendation qualification / P06-06 不得恢复；
- 独立“调价”Action / permission 不得恢复；
- 不新增独立 `can_call_wholesale_phone`；
- Announcement 旧三档频率 / 重新发布重置触达模型不得恢复；
- “详情 Banner 不是强制模块”旧语义不得恢复，VEHICLE_DETAIL 继续是固定 placement 能力；
- reason 不做全局必填；
- 历史审计对象清单不得作为 Current 业务能力复活清单；
- 24 / 24 incoming handoff 继续 `HANDOFF_ACCEPTED`，Final Closeout 前不关闭 / 不 source backwrite；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**PDM-25 Batch 3｜明确知情修改 / 后续明确新增审查。**

## 2026-10-07｜PDM-25 Batch 1 已批准并执行，进入 Batch 2

- `P25-A01～P25-A17 = PASS / USER_APPROVED / APPLIED`；
- Batch 1 confirmed count = 17；
- 审计只读、重要 mutation 可追溯、reason 按来源域决定、普通浏览不强制高等级审计；
- Current Projection / Historical Fact 分离，纠错采用追加事实，不抹除真实历史；
- 重要配置 before/after/actor/time 可追溯，新配置默认不追改已固化 snapshot；
- 统一业务自然日：`Asia/Shanghai (UTC+8)`；
- 权限撤销后旧页面/session/deep-link/敏感 payload 不再构成授权；
- human actor / system actor 必须可区分；
- 幂等、唯一 active、并发 winner、不重复扣减、不超退等只冻结产品结果，不冻结 DB/MQ/事务框架；
- 24 / 24 incoming handoff 继续 `HANDOFF_ACCEPTED`，Final Closeout 前不得关闭或 source backwrite；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**PDM-25 Batch 2｜明确废弃 / 已覆盖 / 不得恢复审查。**

## 2026-10-07｜PDM-25 Startup Gate 已批准并执行

- `P25-R00 = USER_APPROVED / APPLIED`；
- PDM-25 定位：全项目审计 / 历史 / 时区 / 配置版本 / 终态真实性 / 横切完整性的唯一产品 Authority；
- 工作版：`07_重建工作区/PDM-25_审计历史时区配置版本终态与横切完整性_规则原子重建_工作版.md`；
- target=PDM-25 的 24 / 24 incoming handoff：`HANDOFF_ACCEPTED`；
- `INCOMING_HANDOFF_GAP = 0`；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `GLOBAL_INVARIANT_CONFLICT = 0`；
- 历史 R12 P11“Customer Merge 审计”仅保留历史 carrier，不恢复 V1 Customer Merge；
- 统一业务时区：`Asia/Shanghai (UTC+8)`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**PDM-25 Batch 1｜稳定一致规则审查。**

## 2026-10-07｜PDM-24 Final Closeout COMPLETE

- 用户已最终批准 PDM-24 Final Domain Overview，并随后明确“确定执行”；
- 正式 Authority：`07_重建工作区/PDM-24_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-24_最终完整性复核_2026-10-07.md / PASS`；
- `PDM-24 = COMPLETE / INTEGRITY_PASS`；
- 正式规则 / 裁决单元：40；
- `HO-P20-P24-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-20 §40 旧“详情 Banner 可选”已正式回写为：VEHICLE_DETAIL 为固定广告位能力，内容可为空；
- `HO-P24-P25-001 = HANDOFF_OPEN`；
- PDM-25 当前 incoming handoff：24 条，全部等待 Startup Gate 正式接收；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-25 Startup Gate。**

## 2026-10-07｜PDM-24 Prefinal R2 PASS，Final Candidate Ready

- R2 报告：`07_重建工作区/PDM-24_Final前完整性复核_R2_2026-10-07.md`；
- `PDM24_PREFINAL_R2 = PASS / FINAL_CANDIDATE_READY`；
- `PDM24_FORMAL_UNITS = 40`；
- Source→Atom / Atom→Source / Semantic Completeness / Completed-PDM Invariant / Negative Claims 均 PASS；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 0`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- PDM-20 旧“详情 Banner 可选”已确认是待 Final Closeout source backwrite 的历史尾巴，不构成当前硬冲突；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`；
- `HO-P24-P25-001 = HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**形成 PDM-24 Final Domain Overview，并提交用户最终批准。**

## 2026-10-07｜PDM-24 Prefinal R1 修复已执行，进入 R2

- `PREFINAL_R1 = REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- R1 报告：`07_重建工作区/PDM-24_Final前完整性复核_R1_2026-10-07.md`；
- `P24-LIA-01～P24-LIA-04 = PASS / USER_APPROVED / APPLIED`；
- LIA-01：公告日期 / 每日频控统一按 Asia/Shanghai（UTC+8）业务自然日解释，结束日期当天仍有效；
- LIA-02：Announcement 到期 / 停用进入 history、不删除；合法周期内可再启用，过期需新排期；
- LIA-03：采用 3A；当天第一次进入被其他主动弹层占用时，Announcement 当天不补弹；
- LIA-04：无效公告周期不得启用；Banner 非空 target 保存 / 启用时必须合法，后续失效降为纯展示；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`；
- `HO-P24-P25-001 = HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-24 Prefinal Integrity R2。**

## 2026-10-07｜PDM-24 Batch 4 已批准并执行，进入 Prefinal Integrity

- `P24-B4-01～P24-B4-07 = PASS / USER_APPROVED / APPLIED`；
- B4-01：用户修订为“公告设置有效周期 + 自动弹出开关；同一客户每天公告主动弹层全局最多 1 条；取消仅首次一次/三档频率”；
- B4-02：采用 2A，普通编辑不重置当天展示事实；需要新一轮触达时新建公告；
- B4-03：多条有效公告当天第一次进入按后台排序择一，不补弹其他公告；
- B4-04：补齐标题、正文、开始/结束日期、自动弹出开关等字段；
- B4-05：采用 5A，Banner V1 继续仅内部白名单合法目标，不开放外链；
- B4-06：Banner 停用不删除，可再启用并重新校验；
- B4-07：`HO-P24-P25-001 = HANDOFF_OPEN` 已正式登记；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`，Final Closeout 前仍不关闭、不 source backwrite；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-24 Final 前完整性复核（Prefinal Integrity）**。

## 2026-10-07｜PDM-24 Batch 3 已执行并完成窗口切换交接

- `BATCH_3 = NO_NEW_ATOMS / PASS / USER_APPROVED / APPLIED`；
- `BATCH_3_CONFLICT_ISOLATION = PASS`；
- `NEW_INDEPENDENT_ATOMS = 0`；
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`；
- 窗口交接快照：`07_重建工作区/PDM-24_窗口切换交接_2026-10-07.md`；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`，未关闭、未 source backwrite；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-24 Batch 4 Final-gap Scan。**

## 2026-10-07｜PDM-24 Batch 2 已执行并进入 Batch 3

- `P24-B2-01～P24-B2-12 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 later-addition / explicit-change scan = `NO_NEW_ATOMS / PENDING_USER_REVIEW`；
- `NEW_INDEPENDENT_ATOMS = 0`；
- `DUPLICATE_RULE_CREATION = 0`；
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`；
- `HO-P20-P24-001` 继续 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**用户审查 PDM-24 Batch 3“无新增独立规则原子”结论。**

## 2026-10-07｜PDM-24 Batch 1 已执行并进入 Batch 2

- `P24-A01～P24-A15 = PASS / USER_APPROVED / APPLIED`；
- Batch 1 confirmed count = 15；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 2 候选：`P24-B2-01～P24-B2-12 / PENDING_USER_REVIEW`；
- Batch 2 仅包含明确废弃 / 已覆盖 / DO_NOT_RESTORE 方向，不引入新产品选择；
- `HO-P20-P24-001` 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**用户审查 PDM-24 Batch 2。**

## 2026-10-07｜PDM-24 Startup Gate PASS 并进入 Batch 1

- `P24-R00 = USER_APPROVED / APPLIED`；
- `P24-R01 = USER_APPROVED / APPLIED`：VEHICLE_DETAIL 为车辆详情页固定广告位能力；无有效 Banner 时可不展示具体广告内容，但广告位能力本身固定存在；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`，Final Closeout 前不关闭、不 source backwrite；
- completed-PDM hard conflict = 0；incoming gap = 0；
- 当前正式 placement = `HOME_TOP / VEHICLE_DETAIL`；
- 不建设通用消息中心、营销自动化平台或万能 Placement Engine；
- Batch 1 候选：`P24-A01～P24-A15 / PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**用户审查 PDM-24 Batch 1。**

## 2026-10-07｜PDM-23 Final Closeout COMPLETE

- 用户已最终批准并明确“确认执行”；
- 正式 Authority：`07_重建工作区/PDM-23_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-23_最终完整性复核_2026-10-07.md / PASS`；
- 65 个正式规则 / 裁决单元全部进入 Final；
- 10 / 10 incoming handoff = `HANDOFF_CLOSED / source_backwrite=YES`；
- 10 / 10 来源 PDM Final 已完成反向回写；
- `HO-P23-P25-001 = HANDOFF_OPEN`；
- PDM-23 = `COMPLETE / INTEGRITY_PASS`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-24 Startup Gate**。

## 2026-10-07｜PDM-23 Prefinal R1 修复已执行，R2 PASS

- Prefinal R1 = `REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- `P23-LIA-01～P23-LIA-04 = PASS / USER_APPROVED / APPLIED`；
- LIA-01：同一业务事件/同一通知阶段原则上只通知一次；Consultation 同一次 SLA timeout 原则上只做一次群告警；
- LIA-02：SLA 群告警最小必要内容 + 敏感字段最小化 + deep-link 重鉴权；
- LIA-03：持续 Incident 重复告警是普通去重例外；只按已配置 cadence，不恢复旧固定 2/5/15 分钟默认；
- LIA-04：微信“可接入”≠“当前已启用”；无明确 customer-WeChat allowlist + 合法平台能力/模板 + 用户授权前不自动发送；
- Prefinal R2 = `PASS / FINAL_CANDIDATE_READY`；
- 正式规则 / 裁决单元 = 65；
- missing rule = 0；semantic detail gap = 0；completed-PDM hard conflict = 0；
- 10 / 10 incoming handoff 继续 HANDOFF_ACCEPTED，最终批准前不关闭；
- HO-P23-P25-001 继续 HANDOFF_OPEN；
- Final Overview：`07_重建工作区/PDM-23_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**用户最终审查 / 批准 PDM-23 最终完整规则总览。**

## 2026-10-07｜PDM-23 Batch 4 历史重扫重建版已批准并执行

- 历史重扫已完成：9/06 SSOT/Decision、R12、001～078、Current P09 carrier 与 completed-PDM Final 已复核；
- 旧 `P23-B4-01～P23-B4-06` 保留为历史草案，状态 `SUPERSEDED_NOT_APPROVED_NOT_APPLIED`；
- 新正式 Batch 4：`P23-B4R-01～P23-B4R-10 = PASS / USER_APPROVED / APPLIED`；
- 微信小程序订阅消息：保留未来接入能力，当前不作为核心业务依赖，不建通用客户消息中心；
- 飞书：保留公司总开关、员工个人提醒开关、合法总群路由；取消重复的独立“群总开关”；
- 员工级“其 SLA 超时是否进入飞书总群”正式保留，默认开启，由合法管理/配置能力控制；
- 未来独立 App Push 仅预留 notification channel 接入能力，V1 不实现；PC 主动 Push V1 不做；
- `HO-P23-P25-001` 已正式登记为 HANDOFF_OPEN；
- completed-PDM hard conflict = 0；local product choice unresolved = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-23 Final 前完整性复核（Prefinal Integrity）**。

## 2026-10-07｜PDM-23 窗口切换交接已保存｜Batch 4 暂停审查并要求重建

- Startup Gate + Batch 1～3 = 已正式 PASS / APPLIED；
- 原 P23-B4-01～P23-B4-06 完整保留，但改为“旧版 Batch 4 草案”，未批准、未执行；
- 本窗口新增讨论已保存：微信小程序消息能力、飞书多层开关、员工级总群 SLA 超时通告开关、PC 暂不做主动通知、未来 App Push 仅预留；
- “员工级总群 SLA 超时通告开关”当前只标记为 conversation-recovered candidate，必须历史重扫；
- 交接文件：`07_重建工作区/PDM-23_窗口切换交接_2026-10-07.md`；
- 当前门禁：`BATCH_4_REVIEW_SUSPENDED / REBUILD_REQUIRED_AFTER_HISTORICAL_RESCAN`；
- 当前唯一下一步：新窗口读取交接快照并重新扫描通知历史，再生成完整 Batch 4；
- IA / Low-Fi / Engineering 未施工。

## 2026-10-07｜PDM-23 Batch 3 已执行并进入 Batch 4

- `P23-B3-01～P23-B3-16 = PASS / USER_APPROVED / APPLIED`；
- Batch 4 Final-gap 已形成：`P23-B4-01～P23-B4-06 / PENDING_USER_REVIEW`；
- 真正产品选择 = 1；稳定收口项 = 5；
- 推荐选择：`1A`；
- P23→P25 outgoing handoff 尚待本批批准；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-23 Batch 4。

## 2026-10-07｜PDM-23 Batch 2 已执行并进入 Batch 3

- `P23-B2-01～P23-B2-14 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 已形成：`P23-B3-01～P23-B3-16 / PENDING_USER_REVIEW`；
- Batch 3 未引入新产品选择：`NEW_PRODUCT_CHOICE_INTRODUCED=0`；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-23 Batch 3。

## 2026-10-07｜PDM-23 Batch 1 已执行并进入 Batch 2

- `P23-A01～P23-A20 = PASS / USER_APPROVED / APPLIED`；
- Batch 2 Reverse Conflict Scan 已形成：`P23-B2-01～P23-B2-14 / PENDING_USER_REVIEW`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-23 Batch 2。

## 2026-10-07｜PDM-23 Startup Gate PASS 并进入 Batch 1

- `P23-R00 = USER_APPROVED / APPLIED`；
- PDM-23 核心定位：通知 / 飞书 / 主动提醒 / 夜间免打扰 / Incident 通知投递 / 通知日志唯一 Authority；
- 10 / 10 incoming handoff = `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；incoming gap = 0；
- Current P09 carrier 已读取，但不等同工程实现；
- Batch 1 已形成：`P23-A01～P23-A20 / PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-23 Batch 1。

## 2026-10-07｜PDM-22 Final Closeout COMPLETE

- 用户已对 PDM-22 Final Domain Overview 最终批准并确认执行；
- 正式 Final：`07_重建工作区/PDM-22_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-22_最终完整性复核_2026-10-07.md / PASS`；
- PDM-22 = `COMPLETE / INTEGRITY_PASS`；
- 正式规则 / 裁决单元 = `58`；
- 18 / 18 incoming handoff = `HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-22 → PDM-23 / PDM-25 两条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：`PDM-23 Startup Gate`。

## 2026-10-07｜PDM-22 R1 修复已执行；Prefinal R2 PASS

- `P22-LIA-01～P22-LIA-06 = PASS / USER_APPROVED / APPLIED`；
- R1 repair closed = `6 / 6`；
- PDM-22 → PDM-23 / PDM-25 outgoing handoff 已正式登记为 `HANDOFF_OPEN`；
- Final 前完整性复核 R2 = `PASS / FINAL_CANDIDATE_READY`；
- 正式规则 / 裁决单元 = `58`；
- missing=0；semantic gap=0；completed-PDM conflict=0；incoming gap=0；outgoing gap=0；local product choice=0；
- 18/18 incoming handoff 仍保持 `HANDOFF_ACCEPTED`，最终批准前不关闭；
- Final Domain Overview 已生成：`07_重建工作区/PDM-22_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户最终审查 / 批准 PDM-22 Final Domain Overview。

## 2026-10-07｜PDM-22 Batch 4 已执行；Final 前完整性复核 R1 = REPAIR_REQUIRED

- `P22-B4-01～P22-B4-08 = PASS / USER_APPROVED / APPLIED`；
- 用户选择：`1A / 2A / 3同意 / 4A / 5A / 6A / 7同意 / 8同意`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Prefinal R1：`REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- missing=2；semantic gap=3；incoming landing gap=3；outgoing handoff gap=1 group；
- 修复候选：`P22-LIA-01～P22-LIA-06 / PENDING_USER_REVIEW`；
- 18/18 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P22-LIA-01～P22-LIA-06。

## 2026-10-07｜PDM-22 Batch 3 已批准执行并进入 Batch 4

- `P22-B3-01～P22-B3-09 = PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- `NEW_DOMAIN_STATE_MACHINE=0`；
- 对 18 条 incoming handoff 与 R12 / PDM-01～21 Final 再扫描后形成 Batch 4：`P22-B4-01～P22-B4-08 / PENDING_USER_REVIEW`；
- Batch 4 含 5 个真正 PC 产品承载选择，推荐 `1A / 2A / 4A / 5A / 6A`；
- B4-03 / B4-07 / B4-08 为稳定 carrier 补漏，不新增业务选择；
- 18/18 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-22 Batch 4。

## 2026-10-07｜PDM-22 Batch 2 已批准执行并进入 Batch 3

- `P22-B2-01～P22-B2-11 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- B2-01 已按已执行的 `P22-ADD-01` 明确：PC 网页账号密码绑定原 employee_id，不创建第二 Employee；
- 已形成 Batch 3 Conflict Isolation：`P22-B3-01～P22-B3-09 / PENDING_USER_REVIEW`；
- Batch 3 只补齐 PDM-01～21 已冻结上游语义的 PC carrier，不新增业务状态机；
- `MISCLASSIFIED_PRODUCT_CHOICE=0`，`NEW_DOMAIN_STATE_MACHINE=0`；
- 18/18 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-22 Batch 3。

## 2026-10-07｜PDM-22 新增 PC 网页登录身份规则已执行

- 用户明确确认：现有销售 / 经理 / 店长 Employee 不新建第二身份，而是在原 `employee_id` 上增加 PC 网页“登录账号 + 密码”；
- `P22-ADD-01 = USER_APPROVED / APPLIED`；
- 客户端 / 销售端微信侧入口与 PC 网页后台认证正式分层；
- PC 登录成功后继续读取原 Employee 的角色、permission、data scope、account status 与 object state；
- 开通 PC 登录不增加业务权限，Employee 停用后 PC 登录及旧登录态立即失效；
- System Admin 继续独立系统身份 / 独立登录凭证，不与 Employee PC 登录合并；
- 4S 默认不开 PC，仅明确授予 PC 车辆管理能力时才允许启用对应登录；
- B2-01 已同步补充“网页认证 ≠ 第二 Employee 身份”的边界；
- Batch 2 本身仍为 `P22-B2-01～P22-B2-11 / PENDING_USER_REVIEW`，未偷渡通过；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：继续审查 PDM-22 Batch 2。

## 2026-10-07｜PDM-22 Batch 1 用户批准并执行

- 用户对 `P22-A01～P22-A22` 全部同意，随后确认执行；
- `P22-A01～P22-A22 = PASS / USER_APPROVED / APPLIED`；
- 22 条稳定 PC 后台 / 配置 / Integration 基础规则正式进入当前工作 Authority；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- 形成 `P22-B2-01～P22-B2-11 / PENDING_USER_REVIEW`；
- 旧 System Admin 专属后台、独立 Recommendation qualification、旧 Refund 两状态、旧 Collector Phone API 方向、旧内部价权限删除、mapping pending 阻断、source_type 冻结等均进入明确废弃 / 替代扫描；
- 18 / 18 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-22 Batch 2。

## 2026-10-07｜PDM-22 Startup Gate 通过并进入 Batch 1 审查

- 用户已批准并明确“确认执行” `P22-R00`；
- PDM-22 核心定位已补齐采集系统三个固定车源 API、名邦 Integration API 与 Collector 电话回传链路；
- Startup Gate = `PASS`；
- CROSS_PDM_HANDOFF_REGISTER 机械复核 target=PDM-22 = 18 条；
- 18 / 18 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- global invariant conflict = 0；
- 旧 Recommendation 独立资格、旧 Refund 两状态、旧内部价 permission 删除、旧 Mingbang→Collector Phone API 等均已隔离为 stale，不进入 Batch 1；
- 工作版：`07_重建工作区/PDM-22_PC后台信息架构业务管理配置归属上游运行管理_规则原子重建_工作版.md`；
- Batch 1 候选：`P22-A01～P22-A22`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-22 Batch 1。

## 2026-10-06｜PDM-21 Final 正式发布并完成 Closeout

- 用户明确“最终批准确认执行”；
- 正式 Authority：`07_重建工作区/PDM-21_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-21_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-21 = COMPLETE / INTEGRITY_PASS`；
- 56 个正式规则 / 用户裁决单元全部进入 Final；
- 19 / 19 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-02～PDM-20 共 19 个 Final 已反向回写；
- PDM-21 → PDM-23 / PDM-25 两条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：PDM-22 Startup Gate。

## 2026-10-06｜PDM-21 Prefinal R1 修复执行完成，R2 PASS

- 用户对 `P21-LIA-01～P21-LIA-09` 全部同意，随后明确“确认执行”；
- `P21-LIA-01～P21-LIA-09 = PASS / USER_APPROVED / APPLIED`；
- `R1_REPAIR_CLOSED = 9 / 9`；
- PDM-21 → PDM-23 / PDM-25 两条 outgoing handoff 已正式登记并保持 `HANDOFF_OPEN`；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Final 前完整性复核 R2 = `PASS / FINAL_CANDIDATE_READY`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 0`；
- Final Overview：`07_重建工作区/PDM-21_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户最终批准 PDM-21 Final Domain Overview。

## 2026-10-06｜PDM-21 Batch 4 批准执行并完成 Final 前 R1

- 用户裁决 `P21-B4-01～P21-B4-07 = 1A～7A`，随后明确“确认执行”；
- `P21-B4-01～P21-B4-07 = PASS / USER_APPROVED / APPLIED`；
- 用户补充确认：正常车辆详情 Internal Mode 有“隐藏车源”，hidden Vehicle 对应“恢复显示 / 解除隐藏”；hidden/restore 与 offline/relist 严格分离；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Final 前完整性复核 R1 = `REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- 报告：`07_重建工作区/PDM-21_Final前完整性复核_R1_2026-10-06.md`；
- 形成 `P21-LIA-01～P21-LIA-09 / PENDING_USER_REVIEW`；
- R1：missing=5，semantic detail=3，incoming landing gap=7，outgoing handoff gap=1 group；
- completed-PDM hard conflict = 0；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P21-LIA-01～P21-LIA-09。

## 2026-10-06｜PDM-21 Batch 3 用户批准并执行

- 用户对 `P21-B3-01～P21-B3-10` 全部同意，随后明确“确认执行”；
- `P21-B3-01～P21-B3-10 = PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- Batch 4 Gap / Choice Scan 已完成；
- 形成 `P21-B4-01～P21-B4-07 / PENDING_USER_REVIEW`，推荐 `1A～7A`；
- 7 项分别为：4S Internal Mode、敏感 Action 页面归位、隐藏车源入口、一键转名邦确认、Consultation 即将超时阈值、Internal Mode 后台超时退出、E01 强待办统一排序；
- completed-PDM mutation = 0；
- new domain state machine = 0；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户裁决 PDM-21 Batch 4。

## 2026-10-06｜PDM-21 Batch 2 用户批准并执行

- 用户对 `P21-B2-01～P21-B2-09` 明确“全部同意确认执行”；
- `P21-B2-01～P21-B2-09 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- 形成 `P21-B3-01～P21-B3-10 / PENDING_USER_REVIEW`；
- 4S Internal Mode 进入方式、敏感 Action 页面归位、Consultation“即将超时”阈值等真正产品选择继续留 Batch 4；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-21 Batch 3。

## 2026-10-06｜PDM-21 Batch 1 用户批准并执行

- 用户对 `P21-A01～P21-A20` 全部同意，随后确认执行；
- `P21-A01～P21-A20 = PASS / USER_APPROVED / APPLIED`；
- 20 条稳定员工端基础规则正式进入当前工作 Authority；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- 形成 `P21-B2-01～P21-B2-09 / PENDING_USER_REVIEW`；
- 4S Internal Mode 具体进入方式、敏感动作页面归位等仍需产品判断的事项未误塞 Batch 2；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-21 Batch 2。

## 2026-10-06｜PDM-21 Startup Gate 通过并进入 Batch 1 审查

- 用户已批准并确认执行 `P21-R00`：PDM-21 是员工端产品体验、工作台编排与 Employee Action Projection 的唯一 Authority；
- Startup Gate = `PASS`；
- CROSS_PDM_HANDOFF_REGISTER 机械复核确认 target=PDM-21 **实际为 19 条**；
- 19 / 19 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P02/P03/P04/P05/P06/P07/P08/P09/P10/P11/P12/P13/P14/P15/P16/P17/P18/P19/P20 → PDM-21；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- global invariant conflict = 0；
- Current Authority Refresh 已覆盖 9/19 R10/R11、001～078 M15/M17、Current IA/Low-Fi 与 PDM-01～20 Final；
- 旧内部价权限语义、4S Internal Mode 整体 DENY、一键转名邦独立 permission、旧“我要这辆车”工作台、CRM 直接锁车等已识别为后续冲突/替代项，未偷渡进 Batch 1；
- 工作版：`07_重建工作区/PDM-21_员工工作台车辆列表客户中心内部模式敏感动作裁剪_规则原子重建_工作版.md`；
- Batch 1 候选：`P21-A01～P21-A20`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-21 Batch 1。

## 2026-10-06｜PDM-20 Final 正式发布并完成 Closeout

- 用户最终批准 PDM-20 Final Domain Overview，并明确确认执行；
- 正式 Authority：`07_重建工作区/PDM-20_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-20_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-20 = COMPLETE / INTEGRITY_PASS`；
- 53 个正式规则 / 用户裁决单元全部进入 Final；
- 14 / 14 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01/03/04/05/07/08/10/11/12/13/14/15/18/19 Final 已反向回写；
- 4 条 outgoing handoff（PDM-21 / PDM-22 / PDM-24 / PDM-25）继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-21 Startup Gate。

## 2026-10-06｜PDM-20 Prefinal R1 修复执行完成，R2 PASS

- 用户已批准并确认执行 `P20-LIA-01～P20-LIA-07`；
- `R1_REPAIR_CLOSED = 7 / 7`；
- PDM-20 → PDM-21 / 22 / 24 / 25 四条 outgoing handoff 已正式登记为 `HANDOFF_OPEN`；
- PDM-20 stale carrier 已登记，当前不施工；
- Final 前完整性复核 R2 = `PASS / FINAL_CANDIDATE_READY`；
- 正式规则 / 裁决单元总数 = 53；
- missing rule = 0；
- semantic detail gap = 0；
- completed-PDM conflict = 0；
- incoming handoff gap = 0；
- outgoing handoff gap = 0；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`，Final closeout 前不关闭；
- Final Overview：`07_重建工作区/PDM-20_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终批准 PDM-20 Final Domain Overview。

## 2026-10-06｜PDM-20 Batch 4 批准执行并完成 Final 前 R1

- 用户对 `P20-B4-01～P20-B4-10` 全部同意，按推荐 `1A～10A`，随后明确“确认执行”；
- `P20-B4-01～P20-B4-10 = PASS / USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Final 前完整性复核 R1 已完成：`REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- 报告：`07_重建工作区/PDM-20_Final前完整性复核_R1_2026-10-06.md`；
- 形成 `P20-LIA-01～P20-LIA-07` 七项修复候选；
- R1：missing=3，semantic detail=3，cross-PDM alignment=1，outgoing handoff gap=1 group；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- outgoing handoff 待 LIA-07 用户批准后正式登记；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P20-LIA-01～P20-LIA-07。

## 2026-10-06｜PDM-20 Batch 3 用户批准并执行

- 用户对 `P20-B3-01～P20-B3-08` 全部同意，随后明确“确认执行”；
- `P20-B3-01～P20-B3-08 = PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- Batch 4 Gap / Choice Scan 已完成；
- 形成 `P20-B4-01～P20-B4-10 / PENDING_USER_REVIEW`，推荐 `1A～10A`；
- completed-PDM mutation = 0；
- new domain state machine = 0；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-20 Batch 4。

## 2026-10-06｜PDM-20 Batch 2 用户批准并执行

- 用户对 `P20-B2-01～P20-B2-09` 全部同意，随后以“确认指型”明确执行；
- `P20-B2-01～P20-B2-09 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- 形成 `P20-B3-01～P20-B3-08 / PENDING_USER_REVIEW`；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-20 Batch 3。

## 2026-10-06｜PDM-20 Batch 1 用户批准并执行

- 用户对 `P20-A01～P20-A18` 全部同意，随后明确“确认执行”；
- `P20-A01～P20-A18 = PASS / USER_APPROVED / APPLIED`；
- 18 条稳定客户端基础规则进入当前 Authority；
- Batch 2 Reverse Conflict Scan 已完成：`PASS / FALSE_DEPRECATION_COUNT=0`；
- 形成 `P20-B2-01～P20-B2-09 / PENDING_USER_REVIEW`；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-20 Batch 2。

## 2026-10-06｜PDM-20 Startup Gate 通过并进入 Batch 1 审查

- 用户已批准并确认执行 `P20-R00`：PDM-20 是客户端产品体验与 Customer Safe Projection 的唯一 Authority；
- Startup Gate = `PASS`；
- CROSS_PDM_HANDOFF_REGISTER 机械复核后确认 target=PDM-20 **实际为 14 条**，此前口头“15条”已纠正；
- 14 / 14 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P01/P03/P04/P05/P07/P08/P10/P11/P12/P13/P14/P15/P18/P19 → PDM-20；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- Current Authority Refresh 已覆盖 9/19 R10、001～078 M16/M10/M11、Current IA/Low-Fi 与 PDM-01/03/04/05/07/08/10/11/12/13/14/15/18/19 Final；
- R10 旧 owner、旧“我要这辆车”、旧 Priority visibility、旧批发查价等已识别为后续冲突/替代项，未偷渡进 Batch 1；
- 工作版：`07_重建工作区/PDM-20_客户端浏览搜索筛选排序列表详情收藏分享个人中心地域_规则原子重建_工作版.md`；
- Batch 1 候选：`P20-A01～P20-A18`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-20 Batch 1。

## 2026-10-06｜PDM-19 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview，并以“确认指向”明确执行；
- 正式 Authority：`07_重建工作区/PDM-19_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-19_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-19 = COMPLETE / INTEGRITY_PASS`；
- 41 个正式规则 / 用户裁决单元全部进入 Final；
- 10 / 10 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 02 / 03 / 04 / 07 / 13 / 14 / 15 / 17 / 18 Final 已反向回写；
- 5 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-20 Startup Gate。

## 2026-10-06｜PDM-19 Prefinal R1 修复执行并完成 R2

- `P19-LIA-01～P19-LIA-06 = PASS / USER_APPROVED / APPLIED`；
- `R1_REPAIR_CLOSED = 6 / 6`；
- 5 条 outgoing handoff 已正式登记并保持 `HANDOFF_OPEN`；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Final 前完整性复核 R2 = `PASS / FINAL_CANDIDATE_READY`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 0`；
- Final Overview：`07_重建工作区/PDM-19_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户最终批准 PDM-19 Final Domain Overview。

## 2026-10-06｜PDM-19 Batch 4 批准执行并完成 Final 前 R1

- 用户裁决 `1A～11A`，随后明确“确认执行”；
- `P19-B4-01～P19-B4-11 = PASS / USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- B3-03 与 B4-01/B4-09 已统一为：pending Refund 不再退款时直接 close + 原因，不新增专门 close permission；
- Final 前完整性复核 R1 已完成：`REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- 报告：`07_重建工作区/PDM-19_Final前完整性复核_R1_2026-10-06.md`；
- 形成 `P19-LIA-01～P19-LIA-06` 六项修复候选；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- outgoing handoff 待 LIA-06 用户批准后正式登记；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P19-LIA-01～P19-LIA-06。

## 2026-10-06｜PDM-19 Batch 3 用户批准并执行

- 用户对 `P19-B3-01～P19-B3-03` 全部同意，随后明确“确认执行”；
- `P19-B3-01 / P19-B3-02 = PASS / USER_APPROVED / APPLIED`；
- `P19-B3-03 = USER_REVISED / PASS / USER_APPROVED / APPLIED`；
- B3-03 最终口径：pending Refund 确定不再退款时可直接关闭，只填写原因；不新增专门关闭 permission，不增加审批；closed 不等于 refunded；
- Batch 4 扫描形成 `P19-B4-01～P19-B4-11 / PENDING_USER_REVIEW`；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-19 Batch 4。

## 2026-10-06｜PDM-19 Batch 2 用户批准并执行

- 用户对 `P19-B2-01～P19-B2-06` 明确全部同意，随后以“真执行”授权落仓；
- `P19-B2-01～P19-B2-06 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 扫描形成 3 条后续明确新增 / 变更候选：Transaction 首次完成独立敏感权限、Deposit 追加式纠错、pending Refund 撤回/关闭但未退款；
- Batch 3 = `P19-B3-01～P19-B3-03 / PENDING_USER_REVIEW`；
- `closed_not_refunded` 的 Domain 状态/历史 outcome 映射、Transaction 成交纠错完整权限等冲突/遗漏继续留 Batch 4；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-19 Batch 3。

## 2026-10-06｜PDM-19 Batch 1 用户批准并执行

- 用户明确“全部同意”，随后明确“确认执行”；
- `P19-A01～P19-A14 = PASS / USER_APPROVED / APPLIED`；
- 14 条稳定规则正式进入当前工作 Authority；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 2 候选：`P19-B2-01～P19-B2-06`；
- Batch 2 只包含明确废弃 / superseded / DO_NOT_RESTORE 旧模型；Transaction 完成权限、Refund closed、责任人等未提前裁决；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-19 Batch 2。

## 2026-10-06｜PDM-19 Startup Gate 通过并进入 Batch 1 审查

- 用户已批准并确认执行 `P19-R00`：PDM-19 是 Deposit / Transaction / Refund / 成交纠错，以及换车资金与交易收口的唯一业务 Authority；
- Startup Gate = `PASS`；
- target=PDM-19 的 10 条 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P01-P19-001 / HO-P02-P19-001 / HO-P03-P19-001 / HO-P04-P19-001 / HO-P07-P19-001 / HO-P13-P19-001 / HO-P14-P19-001 / HO-P15-P19-001 / HO-P17-P19-001 / HO-P18-P19-001；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- Current Authority Refresh 已覆盖 9/19 C4/R8/R12、001～078 M14、Current IA CO-O18/O19/O20 与 PDM-01/02/03/04/07/13/14/15/17/18 Final；
- Current 中 Transaction 首次完成权限、Deposit correction、Refund closed-not-refunded 等后续细化已识别，但未偷渡进 Batch 1；
- 工作版：`07_重建工作区/PDM-19_意向金Transaction退款成交纠错换车_规则原子重建_工作版.md`；
- Batch 1 候选：`P19-A01～P19-A14`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-19 Batch 1。

## 2026-10-06｜PDM-18 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并确认执行；
- 正式 Authority：`07_重建工作区/PDM-18_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-18_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-18 = COMPLETE / INTEGRITY_PASS`；
- 43 个正式规则 / 用户裁决单元全部进入 Final；
- 10 / 10 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 02 / 03 / 04 / 07 / 10 / 12 / 13 / 14 / 17 Final 已反向回写；
- 6 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-19 Startup Gate。

## 2026-10-06｜PDM-18 Final Overview 用户最终批准

- 用户明确“同意”；
- `PDM-18 Final Overview = USER_FINAL_APPROVED`；
- `Final closeout = PENDING_EXECUTION_CONFIRMATION`；
- 10/10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- 6 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- 当前不得发布 Final、不得 source backwrite、不得进入 PDM-19；
- 当前唯一下一步：等待明确执行 Final closeout。

# 名邦汽车 V1｜当前项目状态

> 更新时间：2026-10-06  
> 状态源：GitHub `suzhe868-arch/mb` / `main`  
> 业务权威语言：中文（zh-CN）

## 当前阶段

`PRODUCT_BASELINE_REBUILD / DOMAIN_RULE_RECONSTRUCTION / PDM-24_BATCH_4_FINAL_GAP_SCAN`

> **当前有效快照以本文件顶部、`NEXT_ACTION.md` 与 `PROJECT_STATE.json` 为准。下方按日期保留的旧“当前状态 / 下一步”属于历史审计轨迹，不代表现在仍停留在该节点。**

当前域：

> **PDM-22｜PC 后台信息架构 / 业务管理 / 配置归属 / 上游运行管理**

当前域状态：

> `PDM-23 COMPLETE / INTEGRITY_PASS；PDM-24 STARTUP_GATE_PASS / BATCH_1_PASS / BATCH_2_PASS / BATCH_3_PENDING_USER_REVIEW`

当前工作文件：

> `07_重建工作区/PDM-22_PC后台信息架构业务管理配置归属上游运行管理_规则原子重建_工作版.md`

当前已纠正：

- P10-B2-10 原“禁止内部价独立 permission”分类已回开失效；
- P10-A15 已撤回 Batch 3 并转 Batch 4；
- P10-B4-01 已按用户裁决确认：内部价 / 底价查看采用后台可配置独立 permission；
- PDM-02 已在 Legacy Final Integrity Audit 中同步 PDM-10 当前内部价/调价语义，并补齐权限撤销、交接、System Admin 治理等细节；
- 新增全局 Step 5A / Batch 2、3 反向冲突硬门禁。

当前唯一下一步：

> **PDM-24 Batch 4 Final-gap Scan。**

## 2026-10-06｜PDM-18 R1 修复完成并通过 R2

- 用户对 `P18-LIA-01～P18-LIA-06` 全部同意并明确执行；
- `R1_REPAIR_CLOSED = 6/6`；
- 6 条 PDM-18 outgoing handoff 已登记 `HANDOFF_OPEN`；
- PDM-18 stale carrier 已登记 `CARRIER_DEFERRED`，当前不施工；
- Final 前完整性复核 R2：`PASS / FINAL_CANDIDATE_READY`；
- `MISSING_RULE_UNRESOLVED=0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED=0`；
- `COMPLETED_PDM_INVARIANT_CONFLICT=0`；
- `INCOMING_HANDOFF_GAP=0`；
- `OUTGOING_HANDOFF_GAP=0`；
- 已生成：`07_重建工作区/PDM-18_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终审查 PDM-18 Final Domain Overview。

## 2026-10-06｜PDM-18 Batch 4 批准执行并完成 Final 前 R1

- 用户裁决 `1A～10A`，随后明确执行；
- `P18-B4-01～P18-B4-10 = PASS / USER_APPROVED / APPLIED`；
- P18-A06/A13 已按“竞争 LockRequest 自动候补”修正；
- P18-A18 已补“Priority-origin Lock 继承客户侧排他可见性”；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Final 前完整性复核 R1 已完成：`REPAIR_REQUIRED`；
- 形成 `P18-LIA-01～P18-LIA-06`：手机号候补门槛、客户不自助取消候补、LockRequest 结果/审计、Lock 幂等、内部候补顺序 vs 客户不展示保证性排名、outgoing handoff + stale carrier/alignment；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P18-LIA-01～P18-LIA-06。

## 2026-10-06｜PDM-18 Batch 3 用户批准并执行

- 用户对当前 Batch 3 剩余 `P18-B3-01 + P18-B3-03` 明确“全部同意”，随后“确认执行”；
- `P18-B3-01 + P18-B3-03 = PASS / USER_APPROVED / APPLIED`；
- `P18-B3-02` 保持 `WITHDRAWN_FROM_BATCH3 / MOVED_TO_BATCH4`；
- Batch 4 扫描已形成 `P18-B4-01～P18-B4-10 / PENDING_USER_REVIEW`；
- B4-01（Priority→Lock 排他可见性）与 B4-02（竞争 LockRequest 自动候补）沿用用户已确认方向，但尚未正式应用；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-18 Batch 4。

## 2026-10-06｜PDM-18 Batch 3 候选重分类

- 用户对原 `P18-B3-02｜LOCK_CONFLICT 后只能主动候补`提出反向裁决：应自动转候补；
- 用户认可调整并随后确认执行；
- `P18-B3-02 = WITHDRAWN_FROM_BATCH3 / RECLASSIFIED_TO_BATCH4`；
- Batch 3 当前只剩 `P18-B3-01 + P18-B3-03 / PENDING_USER_REVIEW`；
- 新增 `P18-B4-PRE-02 = USER_DIRECTION_APPROVED / NOT_APPLIED`；
- 新方向：同车同 cycle 一笔 LockRequest 获锁后，其他仍有效 PENDING 自动转 Waitlist；候补顺序按原 LockRequest.created_at；Waitlist 不占车、不自动转 Lock；
- 该方向与已批准 P18-A06/A13 局部冲突，已标记 `BATCH4_CONFLICT_PENDING`，Batch 4 正式裁决前不提前改写 Authority；
- 原 `P18-B4-PRE-01` Priority→Lock 排他可见性方向仍为 NOT_APPLIED；
- 当前唯一下一步：用户审查 P18-B3-01 与 P18-B3-03。

## 2026-10-06｜PDM-18 Batch 2 用户批准并执行

- 用户对 `P18-B2-01～P18-B2-06` 明确“全部同意”，随后以“确认指向”按既有用法授权执行；
- `P18-B2-01～P18-B2-06 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 扫描形成 3 条明确 later-change Atom：4S 不审批 LockRequest、LOCK_CONFLICT 后另行主动候补、名邦员工在明确 Customer+Vehicle 上下文可直接正式 Lock；
- Batch 3 = `P18-B3-01～P18-B3-03 / PENDING_USER_REVIEW`；
- 用户已认可“普通 Lock 与 Priority→Lock 可见性差异”方向，但仅登记为 Batch 4 pending direction，尚未应用；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-18 Batch 3。

## 2026-10-06｜PDM-18 Batch 1 用户批准并执行

- 用户明确“全部同意确认执行”；
- `P18-A01～P18-A18 = PASS / USER_APPROVED / APPLIED`；
- 18 条稳定规则覆盖 LockRequest/Lock/Waitlist 分层、6h、并发审批、唯一 active Lock、72h、意向金超时边界、人工延期、Waitlist、owner/responsible、账号/车辆历史、价格快照、Priority/Recommendation/Matching 分层；
- 特别保留：合法名邦员工在 Customer + Vehicle 上下文明确且 Guard 合法时可直接创建正式 Lock；不得把 LockRequest 错做成所有 Lock 的强制前置；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 2 候选：`P18-B2-01～P18-B2-06`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-18 Batch 2。

## 2026-10-06｜PDM-18 Startup Gate 通过并进入 Batch 1 审查

- 用户已确认并授权执行 P18-R00：PDM-18 是 LockRequest / 正式 Lock / Waitlist / 延期 / 释放 / 到期 / 责任交接的唯一业务 Authority；
- Deposit / Transaction / Refund / 换车继续由 PDM-19 承接；
- Startup Gate = `PASS`；
- target=PDM-18 的 10 条 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P01-P18-001 / HO-P02-P18-001 / HO-P03-P18-001 / HO-P04-P18-001 / HO-P07-P18-001 / HO-P10-P18-001 / HO-P12-P18-001 / HO-P13-P18-001 / HO-P14-P18-001 / HO-P17-P18-001；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- Current Authority Refresh 已覆盖 9/19 R8/R10/R12、001～078 M13、Current C01-01/E07-08/P07，以及 PDM-01/02/03/04/07/10/12/13/14/17 Final；
- 明确识别 9/19 后新增 LockRequest 前置模型：客户锁车申请不等于正式 Lock，PENDING 6h 不占车，approve 成功才创建正式 Lock 并开始 72h；
- 旧“到期前默认 30 分钟提醒”等未重新确认细节未进入 Batch 1；
- 工作版：`07_重建工作区/PDM-18_LockRequest正式LockWaitlist延期释放_规则原子重建_工作版.md`；
- Batch 1 候选：`P18-A01～P18-A18`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-18 Batch 1。

## 2026-10-06｜PDM-17 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并确认执行；
- 正式 Authority：`07_重建工作区/PDM-17_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-17_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-17 = COMPLETE / INTEGRITY_PASS`；
- 34 个正式规则 / 用户裁决单元全部进入 Final；
- 6 / 6 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-02 / 03 / 11 / 13 / 15 / 16 Final 已反向回写；
- 6 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-18 Startup Gate。

## 2026-10-06｜PDM-17 Final 前完整性复核 R2 PASS

- P17-LIA-01～P17-LIA-05 已全部用户批准并执行；
- outgoing handoff 6 条已正式登记并保持 `HANDOFF_OPEN`；
- stale carrier 已登记为 `CARRIER_DEFERRED`，未修改 IA / Low-Fi；
- R2 报告：`07_重建工作区/PDM-17_Final前完整性复核_R2_2026-10-06.md`；
- `SOURCE_TO_ATOM = PASS`；
- `ATOM_TO_SOURCE = PASS`；
- `SEMANTIC_COMPLETENESS = PASS`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 0`；
- `PDM17_FINAL_CANDIDATE_READY = YES`；
- Final Overview 候选：`07_重建工作区/PDM-17_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终批准 Final Domain Overview；批准前不得发布 Final / 关闭 incoming / source backwrite / 进入 PDM-18。

## 2026-10-06｜PDM-17 Final 前完整性复核 R1

- 报告：`07_重建工作区/PDM-17_Final前完整性复核_R1_2026-10-06.md`；
- 结论：`REPAIR_REQUIRED`；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- local product choice unresolved = 0；
- 修复候选：`P17-LIA-01～P17-LIA-05`；
- 发现 1 处 Current Low-Fi stale carrier：P06-05 指定分配二次确认与 P17-A11 冲突；当前只登记，不施工；
- 当前唯一下一步：用户审查 P17-LIA-01～P17-LIA-05，未经批准不得进入 R2 / Final Overview。

## 2026-10-06｜PDM-17 Batch 4 用户批准并执行

- 用户选择：`1A、2A、3A、4A、5A、6A、7A、8A、9A`；
- 用户随后明确“确认执行”；
- `P17-B4-01～P17-B4-09 = PASS / USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- 6 / 6 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：Final 前完整性复核 R1。

## 2026-10-06｜PDM-17 Batch 3 通过并进入 Batch 4

- 用户明确同意 Batch 3“无新增独立规则原子”结论，随后确认执行；
- `BATCH_3 = NO_NEW_ATOMS / PASS / USER_APPROVED / APPLIED`；
- `NEW_INDEPENDENT_ATOMS=0`；
- `DUPLICATE_RULE_CREATION=0`；
- `MISCLASSIFIED_PRODUCT_CHOICE=0`；
- Batch 4 已完成历史 R6、001～078 与当前 PDM-17 的冲突/遗漏扫描；
- 形成 `P17-B4-01～P17-B4-09` 共 9 个待裁决项；
- 其中明确发现：长期未真实跟进公海候选“三条件 AND”历史规则丢失；公海普通领取人在领取前仅看必要摘要、敏感联系方式默认隐藏的规则尚未完整进入当前 PDM-17；
- 仓库未发现已正式冻结的“后台指定分配为主、主动领取弱化”覆盖性裁决，因此该运营模式仍作为 Batch 4 新产品选择提交，不从聊天记忆静默覆盖；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户裁决 PDM-17 Batch 4。

## 2026-10-06｜PDM-17 Batch 2 用户批准并执行

- 用户对 `P17-B2-01～P17-B2-04` 明确“全部同意”，随后以“真执行”明确授权执行；
- `P17-B2-01～P17-B2-04 = PASS / USER_APPROVED / APPLIED`；
- 已明确禁止恢复：Customer Merge×公海迁移、职位名称自动等于全部公海治理权、System Admin 作为公海业务执行者/兜底 owner、分享/转介绍绕过公海治理恢复历史 owner；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- 主动领取、后台指定分配、待公海人工处理、领取限制、Collaboration 等当前合法能力未被误废弃；
- Batch 3 新增/变更扫描已完成：6 条 incoming handoff 中的 later additions 均已在 Batch 1 对应规则中吸收，未发现新的独立 Atom；
- Batch 3 = `NO_NEW_ATOMS / PENDING_USER_REVIEW`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 3“无新增项”结论。

## 2026-10-06｜PDM-17 Batch 1 用户批准并执行

- 用户先明确更正为“全部同意”，随后明确“确认执行”；
- `P17-A01～P17-A15 = PASS / USER_APPROVED / APPLIED`；
- 已冻结：唯一 owner 与公海状态边界、禁止自动抢入公海、合法进入公海触发、待公海人工三向处理、未完成责任/保护 Guard、公海 scope、原子领取与并发、接客开关与主动领取分离、领取数量/频率限制、主动服务触发 owner 分配、后台指定分配、再次释放 Guard、历史保留、Collaboration 非 owner / 非万能授权、Collaboration 建立/scope/结束/历史；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，不得提前关闭；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 2 候选：`P17-B2-01～P17-B2-04`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-17 Batch 2。

## 2026-10-06｜PDM-17 Startup Gate 通过并进入 Batch 1 审查

- 用户已确认并授权执行 P17-R00：PDM-17 是公海治理与 Collaboration（协作关系）业务 Authority；
- PDM-17 负责：待公海处理、人工判断、进入/退出公海、领取、指定分配、主动人工服务触发的 owner 分配、再次释放，以及 Collaboration 建立/范围/结束；
- PDM-17 不重建 Customer / CRM / Demand / Priority / Consultation / Recommendation / Lock / Transaction 第二套状态机；
- Startup Gate = `PASS`；
- target=PDM-17 的 6 条 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P02-P17-001 / HO-P03-P17-001 / HO-P11-P17-001 / HO-P13-P17-001 / HO-P15-P17-001 / HO-P16-P17-001；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- Current Authority Refresh 已覆盖 9/19 R6/R10/R12、001～078 M02/M17、Current E08/E08-01/P06-03/04/05，以及 PDM-02/03/11/13/15/16 Final；
- Startup Scan 已登记：待公海三选一、领取数量/频率、并发领取、无待确认领取、主动人工服务自动分配退出公海、首次跟进提醒、Collaboration 两级 scope 等历史细节在 Current carrier 中存在不同程度缺口；当前只进入规则审查，不修改 IA / Low-Fi / Engineering；
- 工作版：`07_重建工作区/PDM-17_公海待公海领取指定分配与协作_规则原子重建_工作版.md`；
- Batch 1 候选：`P17-A01～P17-A15`，状态 `PENDING_USER_REVIEW`；
- 当前唯一下一步：用户审查 PDM-17 Batch 1。

## 2026-10-06｜PDM-16 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并确认执行；
- 正式 Authority：`07_重建工作区/PDM-16_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-16_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-16 = COMPLETE / INTEGRITY_PASS`；
- 36 个正式规则 / 用户裁决单元全部进入 Final；
- 6 / 6 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 02 / 03 / 11 / 12 / 15 Final 已反向回写；
- 5 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-17 Startup Gate。

## 2026-10-06｜PDM-16 Final 前完整性复核 R2

- P16-LIA-01～P16-LIA-03 已 USER_APPROVED / APPLIED；
- R2 报告：`07_重建工作区/PDM-16_Final前完整性复核_R2_2026-10-06.md`；
- Source→Atom = PASS；
- Atom→Source = PASS；
- Semantic Completeness = PASS；
- Missing Rule = 0；
- Semantic Detail Gap = 0；
- completed-PDM conflict = 0；
- incoming handoff gap = 0；
- outgoing handoff gap = 0；
- local product choice unresolved = 0；
- `PDM16_FINAL_CANDIDATE_READY = YES`；
- Final Overview：`07_重建工作区/PDM-16_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终审查 Final Overview。

## 2026-10-06｜PDM-16 Final 前完整性复核 R1

- 报告：`07_重建工作区/PDM-16_Final前完整性复核_R1_2026-10-06.md`；
- 结论：`REPAIR_REQUIRED`；
- `MISSING_RULE_UNRESOLVED = 1`：Customer Address 搜索 / 卡片投影；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 1`：CRM Stage / important Tag / 服务称呼 mutation audit；
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 1 group`：待登记 PDM-17 / 21 / 22 / 23 / 25；
- 修复候选：`P16-LIA-01～P16-LIA-03`；
- `PDM16_FINAL_CANDIDATE_READY = NO`；
- 当前唯一下一步：用户审查修复候选。

## 2026-10-06｜PDM-16 Batch 4 用户裁决并执行

- 用户选择并确认执行：`1A、2A、3A、4A、5A`；
- `P16-B4-01～P16-B4-05 = PASS / USER_APPROVED / APPLIED`；
- CRM Stage = 公司级受控可配置字典；
- Consultation / Demand / Lock / Transaction 等具体业务事件默认不自动改 CRM Stage；
- Customer Tags = 公司级受控 Tag 字典 + Customer 多选；
- V1 不建设通用 Customer Opportunity 规则引擎；
- Source Radar“不适合”抑制当前有效 Demand×Vehicle 匹配事实，底层匹配输入实质变化后允许重新出现；
- Batch 4 Cross-PDM Conflict Review = PASS；
- `PDM16_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- 当前唯一下一步：Final 前完整性复核。

## 2026-10-06｜PDM-16 Batch 3 Completeness Repair 已执行

- 用户对 `P16-B3-R01～P16-B3-R02` 明确“全部同意确认执行”；
- Repair = `PASS / USER_APPROVED / APPLIED`；
- `BATCH_3_COMPLETENESS_GAP = 0`；
- CRM 未完成待办/回访/未来跟进责任交接已恢复；
- “暂不联系/暂无意向”与 owner / 公海 / 具体业务状态严格分离；
- Batch 4 重建后形成 5 个真实产品选择：CRM Stage 字典治理、Stage 自动改写、Customer Tags 模型、Opportunity 规则来源、Radar 不适合抑制范围；
- 建议：`1A、2A、3A、4A、5A`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

## 2026-10-06｜PDM-16 Batch 3 用户批准并执行

- 用户对 `P16-B3-01～P16-B3-06` 全部同意并确认执行；
- Batch 3 = `PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation = `PASS`；
- `CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3 = 0`；
- 已补齐 CRM Follow-up mutation、员工内部称呼历史、CRM 列表真实搜索/筛选、Customer Detail 六区块、Opportunity 最小聚合事实、Source Radar 事件与人工处理闭环；
- 完整性回查另发现 2 条明确历史规则尚未完整承接：CRM 待办/回访提醒/未来跟进责任交接；“暂不联系/暂无意向”只属于 CRM 判断且不自动进公海；
- 已形成修复候选 `P16-B3-R01～P16-B3-R02`；
- Batch 4 暂不开始；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

## 2026-10-06｜PDM-16 Batch 2 用户批准并执行

- 用户对 `P16-B2-01～P16-B2-07` 明确“全部同意确认执行”；
- Batch 2 = `PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS`；
- `FALSE_DEPRECATION_COUNT = 0`；
- 已明确废弃：Customer Merge、CRM 直接锁车旧入口、7d/40/3d Opportunity 旧阈值、大字段 CRM、历史服务永久访问、P06-07 假 CRUD/config、Opportunity 独立工单/强待办/SLA；
- 已确认没有误废弃当前合法的 Opportunity、CRM Stage、Tags、Follow-up、Shared Profile、CRM 业务概览、Source Radar 等能力；
- Batch 3 候选：`P16-B3-01～P16-B3-06`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 3。

## 2026-10-06｜PDM-16 Batch 1 用户批准并执行

- 用户对 `P16-A01～P16-A12` 明确“全部同意”，随后“确认执行”；
- Batch 1 = `PASS / USER_APPROVED / APPLIED`；
- 已冻结：CRM Stage 与具体业务状态分离、Stage mutation 权限、Follow-up append-only、统一 CRM Follow-up 关联、Personal Note/Shared Profile/内部称呼分层、Tags/历史不随 owner 清空、CRM 只聚合真实业务事实、历史服务不产生永久访问权、最近行为只做聚合兴趣、Customer Opportunity 非独立工单、Source Radar 只消费 PDM-12、Opportunity/Radar/强待办三类语义分离；
- Batch 1 未误纳 Customer Merge、CRM 直接锁车旧入口、旧机会阈值、大字段 CRM 画像等 superseded 内容；
- Batch 2 候选：`P16-B2-01～P16-B2-07`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 2。

## 2026-10-06｜PDM-16 Startup Gate 通过并进入 Batch 1 审查

- 用户已确认 P16-R00：CRM = 客户经营资料与统一跟进层，不重建 Customer / Demand / Consultation / Recommendation / Lock / Transaction 状态机；
- Startup Gate = `PASS`；
- target=PDM-16 的 6 条 incoming handoff 已全部 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- 工作版：`07_重建工作区/PDM-16_CRM客户画像阶段跟进标签机会与SourceRadar_规则原子重建_工作版.md`；
- Startup Scan 已登记：Customer Merge stale carrier、CRM 直接锁车旧入口、旧机会阈值、大字段 CRM、永久访问误义、E03-03 跟进提交链缺失、P06-07 假 CRUD/config 风险、Opportunity/Radar/强待办 carrier 缺口；
- Batch 1 候选：`P16-A01～P16-A12`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 1。

## 2026-10-06｜PDM-15 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并确认执行；
- Final Approval Trace：`07_重建工作区/PDM-15_最终完整规则总览_待用户批准.md`；
- 正式 Authority：`07_重建工作区/PDM-15_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-15_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-15 = COMPLETE / INTEGRITY_PASS`；
- 31 个正式规则 / 用户裁决单元全部进入 Final；
- 5 / 5 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 02 / 03 / 07 / 14 Final 已反向回写；
- 8 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-16 Startup Gate。

## 2026-10-06｜PDM-15 Final 前完整性复核 R3

- P15-LIA-06 已 USER_APPROVED / APPLIED；
- R3：`PASS / FINAL_CANDIDATE_READY`；
- Source→Atom = PASS；
- Atom→Source = PASS；
- Semantic Completeness = PASS；
- Missing Rule = 0；
- Semantic Detail Gap = 0；
- Completed-PDM Conflict = 0；
- Incoming/Outgoing Handoff Gap = 0；
- Final Overview 候选：`07_重建工作区/PDM-15_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终审查 Final Domain Overview。

## 2026-10-06｜PDM-15 Final 前完整性复核 R2

- P15-LIA-01～P15-LIA-05 已 USER_APPROVED / APPLIED；
- PDM-15 outgoing handoff 共 8 条，已完整登记并保持 HANDOFF_OPEN；
- R2 报告：`07_重建工作区/PDM-15_Final前完整性复核_R2_2026-10-06.md`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 1`；
- 唯一剩余修复候选：`P15-LIA-06` Consultation mutation actor/authority 精确矩阵；
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`；
- `HANDOFF_GAP_UNRESOLVED = 0`；
- `PDM15_FINAL_CANDIDATE_READY = NO`；
- 当前唯一下一步：用户审查 P15-LIA-06。

## 2026-10-06｜PDM-15 Final 前完整性复核 R1

- 报告：`07_重建工作区/PDM-15_Final前完整性复核_R1_2026-10-06.md`；
- 结论：`REPAIR_REQUIRED`；
- Source→Atom：发现 4 个未完整承接业务语义；
- Atom→Source：PASS；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- outgoing handoff gap = 1 group；
- 修复候选：`P15-LIA-01～P15-LIA-05`；
- `PDM15_FINAL_CANDIDATE_READY = NO`；
- 当前唯一下一步：用户审查 Final 前修复候选。

## 2026-10-06｜PDM-15 Batch 4 用户裁决并执行

- 用户选择并确认执行：`1A、2A、3A、4A、5A、6A、7A`；
- `P15-B4-01～P15-B4-07 = PASS / USER_APPROVED / APPLIED`；
- Consultation 保持四主状态，`CANCELLED` 不作为第五主状态；
- 首次响应仅由真实人工服务动作完成，转派不完成/不重置 SLA；
- SLA 初始默认 15 分钟，可配置，创建时固化 deadline；
- 初始负责人按当前合法责任关系 → Demand responsible → Customer owner → 合格接客池；无人可承接时不得创建 responsible=null，也不得 System Admin 兜底；
- Customer 停用采用独立 `customer_disabled_hold`，暂停常规推进与未完成 SLA，恢复账号不自动恢复 Consultation；
- Transaction 不自动结束 Consultation；
- 工作台 SLA 优先级移交 PDM-21；
- `PDM15_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- 当前唯一下一步：Final 前完整性复核。

## 2026-10-06｜PDM-15 Batch 3 用户批准、执行与冲突隔离 PASS

- 用户对 `P15-B3-01～P15-B3-04` 明确“全部同意确认执行”；
- Batch 3 = `PASS / USER_APPROVED / APPLIED`；
- Batch 3 Conflict Isolation = `PASS`，`CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3=0`；
- 已确认：Customer 可撤回 open Consultation；员工可记录真实跟进；员工结束语义区分解决/无效/正常关闭；Consultation 创建时消费有效 SLA 配置并固化本次 deadline；
- 未提前裁决：`CANCELLED` 第五主状态、首次真实人工响应完成条件、默认 15 分钟、负责人优先级、Customer 停用运行态、Transaction 负向边界；
- 形成 Batch 4 候选 `P15-B4-01～P15-B4-07`，建议 `1A、2A、3A、4A、5A、6A、7A`；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 4。

## 2026-10-06｜PDM-15 Batch 2 用户批准、执行与反向冲突扫描 PASS

- 用户对 `P15-B2-01～P15-B2-05` 全部同意并启动执行；
- Batch 2 = `PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS`，`FALSE_DEPRECATION_COUNT=0`；
- 明确废弃/不得恢复：旧“我要这辆车”统一意向、timeout 第五主状态/自动关闭、Customer Merge/Consultation 迁移、assignee 与 Customer owner 合一、Recommendation 驱动 Consultation 生命周期；
- 明确保留：客户撤回/正常关闭动作、SLA 与 timeout 提醒、正式 Consultation 转派、状态驱动 CTA、真实 Recommendation source relation、独立 Customer owner；
- 历史 Phase1.5 曾存在 Customer Merge Flow，但当前 Authority 已被 PDM-01 Final“V1 完全取消 Customer Merge”覆盖；
- Batch 3 候选：`P15-B3-01～P15-B3-04`；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P15-B3-01～P15-B3-04。

## 2026-10-06｜PDM-15 Batch 1 用户批准并执行

- 用户对 `P15-A01～P15-A08` 明确“全部同意”，随后明确“确定执行”；
- Batch 1 = `PASS / USER_APPROVED / APPLIED`；
- 已冻结：显式咨询建单、初始来源不可改写、同 customer+vehicle+listing_cycle 未终结幂等、Vehicle lifecycle 分层、Consultation assignee 与 Customer owner 分离、Recommendation 双向独立、档案不完整不阻断、4S Member 不进入名邦 Consultation 处理链；
- 状态机 `CANCELLED` 冲突、SLA 首次真实人工动作、负责人优先级、Customer 停用运行态等未被 Batch 1 偷渡裁决；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Batch 2 候选：`P15-B2-01～P15-B2-05`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P15-B2-01～P15-B2-05。

## 2026-10-06｜PDM-15 Startup Gate 通过并进入 Batch 1

- 用户已确认 PDM-15 核心定位：Consultation = 客户正式咨询工单，承接“明确咨询 → 合法负责人 → 真人跟进 → 合法结束”；
- Consultation 与 Customer owner / Recommendation / Lock / Transaction 分离，只保存必要真实关联，不自动互相改写主状态；
- Startup Gate = `PASS`；completed-PDM hard conflict = 0；incoming handoff gap = 0；
- target=PDM-15 的 5 条 incoming handoff 全部由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- 工作版已建立：`07_重建工作区/PDM-15_Consultation咨询生命周期来源负责人转派与SLA_规则原子重建_工作版.md`；
- 已登记 Current carrier 冲突：CANCELLED 主状态歧义、SLA 首次真实人工动作语义缺失、Consultation assignee 与 Customer owner 术语污染、Customer 停用运行态、Transaction 负向边界、工作台 SLA 优先级边界、负责人优先级/无合法负责人兜底；
- Batch 1 候选：`P15-A01～P15-A08`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P15-A01～P15-A08。

## 2026-10-06｜PDM-14 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并明确“确定执行”；
- Final Approval Trace：`07_重建工作区/PDM-14_最终完整规则总览_待用户批准.md`；
- 正式 Authority：`07_重建工作区/PDM-14_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-14_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-14 = COMPLETE / INTEGRITY_PASS`；
- 52 个正式规则 / 裁决单元全部进入 Final；
- 8 / 8 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 03 / 04 / 07 / 10 / 11 / 12 / 13 Final 已反向回写；
- outgoing `HO-P14-P15/P18/P19/P20/P21/P23/P25` 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-15 Startup Gate。

## 2026-10-06｜PDM-14 Final 前完整性复核 R2 通过

- 报告：`07_重建工作区/PDM-14_Final前完整性复核_R2_2026-10-06.md`；
- `SOURCE_TO_ATOM = PASS`；
- `ATOM_TO_SOURCE = PASS`；
- `SEMANTIC_COMPLETENESS = PASS`；
- `COMPLETED_PDM_INVARIANT = PASS`；
- `INCOMING_HANDOFF_SEMANTIC_COVERAGE = PASS`；
- `OUTGOING_HANDOFF_INTEGRITY = PASS`；
- `NEGATIVE_CLAIMS_VERIFIED = PASS`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `CROSS_PDM_CONFLICT = 0`；
- `HANDOFF_GAP_UNRESOLVED = 0`；
- `PDM14_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `PDM14_LOCAL_DEFERRED_UNRESOLVED = 0`；
- `PDM14_FINAL_CANDIDATE_READY = YES`；
- 当前唯一下一步：生成 PDM-14 Final Domain Overview 候选。

## 2026-10-06｜PDM-14 Final 前完整性修复 LIA-01～10 已执行

- `P14-LIA-01～P14-LIA-10 = USER_APPROVED / APPLIED`；
- 三类车源均可被正式 Recommendation；4S member hard DENY 与 4S Vehicle 可推荐明确分层；批发免费查价权仅适用于批发查价机制；
- Recommendation create/end/void 补齐 current responsibility + permission/capability + data scope + object state 提交重验；4S hard DENY，System Admin 不因身份自动执行业务；
- 批量推荐 UI 可批量，但底层逐 Vehicle 独立 Recommendation；
- Recommendation 不改变 Customer owner / Demand responsible；
- 普通 share link 无固定 N 天 TTL，可继续转发但不传播 Recommendation/price-right/visibility/Internal Mode；
- 批发车 Recommendation 创建时若仅“价格咨询”，同 cycle 后续出现数字价仍沿用免费权，不扣 daily quota；
- Recommendation/visibility 仅授 Customer Safe Projection，不扩大内部敏感字段；
- JYT/上游同步不得直接覆盖 Recommendation/visibility 等名邦 Business Data；
- Consultation 不反向创建 Recommendation、不授免费 price-right、不授 hidden visibility；
- outgoing handoff 已扩展到 PDM-15 / 18 / 19 / 20 / 21 / 23 / 25；
- 8 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- 当前唯一下一步：Final 前完整性复核 R2。

## 2026-10-06｜PDM-14 Batch 4 用户裁决并执行

- 用户选择：`1A、2B、3A、4A、5A、6A、7A、8A`；
- `P14-B4-01～P14-B4-08 = PASS / USER_APPROVED / APPLIED`；
- `PDM14_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Recommendation end/void 改为按当前合法业务责任 + permission/data scope/object state 判断，不给历史 recommender 或经理/店长永久/天然操作权；
- Customer 失去 find-car entitlement 后不删除已有 Recommendation，但暂停 Recommendation-only 客户侧能力；恢复权益时仅恢复当时仍合法 active 对象；
- active Recommendation 在同 cycle 内持续作为 visible→hidden 后的 customer-specific visibility 授权来源；
- 普通分享链接只提供导航，每次打开按当前 Vehicle/listing_cycle/Customer/Priority/独立业务 Authority 实时重算；新 cycle 不继承旧周期权益；
- Recommendation 历史 price snapshot 与当前价格严格分层；旧 cycle Recommendation 不授权新 cycle 当前价格；
- 合法 source_type 修改 / 一键转名邦不重建、迁移或清空 Recommendation；
- active Lock / in-progress Transaction 占用本身不自动禁止 Recommendation，但 Recommendation 不产生锁车优先权、不绕过占用；
- Recommendation 与 Consultation 不相互反写；新增 `HO-P14-P15-001 = HANDOFF_OPEN`，由 PDM-15 承接 Consultation 完整生命周期；
- 8 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- 当前唯一下一步：PDM-14 Final 前完整性复核。

## 2026-10-06｜PDM-14 Batch 3 用户批准并执行

- `P14-B3-01～P14-B3-05 = PASS / USER_APPROVED`；
- Batch 3 Conflict Isolation：`PASS / CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3=0`；
- 分享直达与普通进入统一使用同一套车辆详情业务页；SHARE_DIRECT 只增加必要轻量入口，不能复制第二套详情业务逻辑或绕过当前 visibility；
- 旧“我要这辆车”语义正式拆分：沟通车辆统一走 Consultation/“咨询”，锁车走独立 LockRequest/Lock 链；Recommendation 不由该按钮自动产生；
- “我的推荐”明确区分当前与历史；历史长期保留，但历史存在不等于当前仍有详情 visibility 或当前价格权，进入时重新读取当前事实；
- PDM-07 incoming handoff 正式承接：档案/报告不完整本身不得阻止 Recommendation；Recommendation/visibility grant 也不自动授客户查看 VIN、敏感原件或仅内部档案；
- PDM-13 incoming handoff 进一步冻结：Priority 可保存 recommendation_id 仅作关联追溯；Priority 与 Recommendation 生命周期仍完全独立；
- LockRequest 的 6h/审批/Waitlist 等完整生命周期未被抢入 PDM-14，继续归 PDM-18；
- 分享模板、分享图、营销文案等页面细节未因 Batch 3 被误冻结为 PDM-14 核心生命周期规则；
- 8 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- 当前唯一下一步：PDM-14 Batch 4 冲突 / 遗漏 / 缺口 / 新产品选择候选重建。

## 2026-10-05｜PDM-14 Batch 2 用户批准并执行

- `P14-B2-01～P14-B2-11 = PASS / USER_APPROVED`；
- Batch 2 Reverse Conflict Scan：`PASS / FALSE_DEPRECATION_COUNT=0`；
- 独立 Recommendation qualification、P06-06、RECOMMENDATION_QUALIFIED/NOT_QUALIFIED 与仅服务旧开关的独立管理能力正式废弃；
- 经理/店长/协作身份本身不产生 Recommendation 创建权；旧“只有 Customer current owner 才能推荐”的绝对规则被 owner/handover/Demand responsibility 当前合法业务负责关系替代；
- Priority responsible 不得成为新的 Recommendation 授权来源；
- 旧“客户转发永远 SOURCE_ONLY”被 PDM-03 当前分享归属 Authority 替代，但 SOURCE_ONLY 状态本身继续保留；
- REC 专属 URL / Recommendation-specific link / 第二套推荐分享链路明确 DO_NOT_RESTORE；
- “所有 Vehicle 必须 Recommendation 后才可见”正式废弃；hidden Customer 详情权必须由正式 Recommendation + visibility grant 建立，Demand/Priority 本身不授客户详情权；
- 其他 Customer active Priority 期间不得删除/结束既有 Recommendation，只做 suppression，ended 后按当前事实 restore；
- Customer Merge 与 Recommendation/price-right/Consultation 等权益迁移继续按 PDM-01 Final 全面禁止；P06-01/P06-M01 Merge carrier 登记 stale；
- Recommendation 创建后的系统自动微信发送/发送成功失败状态机不得恢复；
- 新增 stale carrier：old owner-only 阻断合法 Demand responsible、customer re-share always SOURCE_ONLY、REC 专属链路、HIDDEN_CONTROLLED Demand/Priority 直授客户详情、P06-01/P06-M01 Merge；
- 8 条 incoming handoff 继续保持 `HANDOFF_ACCEPTED`，未提前关闭；
- 当前唯一下一步：PDM-14 Batch 3 明确知情修改 / 显式新增候选重建。

## 2026-10-05｜PDM-14 Start Gate、Batch 1 与四项用户裁决已执行

- PDM-14 工作版已建立：`07_重建工作区/PDM-14_Recommendation分享单车授权与可见性_规则原子重建_工作版.md`；
- Start Gate：`PASS`；
- target=PDM-14 的 8 条 incoming handoff：全部由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`，Final / Integrity closeout 前不得关闭；
- Batch 1：`P14-A01～P14-A14 = PASS / USER_APPROVED`；
- Recommendation 与 Matching / Priority / 普通分享 / visibility grant 分离；同 customer+vehicle+listing_cycle active 幂等；无固定 N 天 TTL；核心历史事实不可普通改写；同周期结束后可重建、新周期不继承；
- 普通分享不授 Recommendation / price / visibility；分享接收人按自身 Customer 权益判断，owner 归属服从 PDM-03 当前 Authority；
- hidden 可售 Vehicle 可通过正式 Recommendation 建 Customer 单车 visibility grant，Priority 本身不授客户详情权；
- Recommendation 免费查价权继承 PDM-10 当前 cycle Authority；Recommendation price snapshot 为不可变历史；
- source_demand_id 为 0/1 真实来源，“我的推荐”只承载正式 Recommendation；
- `P14-R01`：Priority qualification 属于 Customer，不属于 Employee；Priority 不改变既有 owner / 合法业务责任关系，也不额外创造 Recommendation 权限；
- `P14-R02`：取消独立 Recommendation qualification；正式找车 / Recommendation 资格统一读取 Customer Level `find-car entitlement`；Priority qualification 继续独立，只负责 Priority；
- `P14-R03`：Customer disable 只暂停 Recommendation 客户侧能力并禁止新建，不删除/结束历史；restore 只重新开放恢复时仍合法有效的对象，不复活 ended/void/周期失效 Recommendation；
- `P14-R04`：其他 Customer active Priority 期间，既有 Recommendation/visibility 历史不删除，只临时 suppression 客户访问；Priority ended 后按当前 Recommendation/listing_cycle/Vehicle/Customer/Priority/Lock/Transaction 事实决定 restore；
- 旧 `P06-06 / RECOMMENDATION_QUALIFIED / NOT_QUALIFIED` 等独立推荐资格 carrier 已登记为 `CARRIER_DEFERRED`，不得施工；
- 对 PDM-01～PDM-13 Final 复核：上述新口径无 completed-PDM 冲突；冲突集中在旧 R7 / Current IA / Low-Fi carrier；
- 当前下一步：PDM-14 Batch 2 明确废弃 / 替代 / DO_NOT_RESTORE 候选审查。

## 2026-10-05｜PDM-13 Final 正式发布与完整性收口

- 用户对 PDM-13 Final Domain Overview 明确“全部同意”，随后明确“确认执行”；
- 正式 Authority：`07_重建工作区/PDM-13_最终完整规则.md`；
- 用户最终批准留痕：`07_重建工作区/PDM-13_最终完整规则总览_待用户批准.md`；
- Final 前当前有效 Gate：`07_重建工作区/PDM-13_Final前完整性复核_R2_2026-10-05.md`；
- Final Integrity：`07_重建工作区/PDM-13_最终完整性复核_2026-10-05.md`；
- 38 条正式规则 / 修复 Atom 全部进入 Final；
- 5 条 incoming handoff：HO-P03-P13-001 / HO-P04-P13-001 / HO-P07-P13-001 / HO-P11-P13-001 / HO-P12-P13-001 = `HANDOFF_CLOSED`；
- PDM-03 / 04 / 07 / 11 / 12 Final 同次完成 source backwrite；
- PDM-13 outgoing 8 条 handoff 继续 `HANDOFF_OPEN`；
- `SOURCE_TO_FINAL / FINAL_TO_SOURCE / SEMANTIC_COMPLETENESS / COMPLETED_PDM_INVARIANT / CROSS_PDM_INTEGRITY / HANDOFF_INTEGRITY / NEGATIVE_CLAIMS = PASS`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `CROSS_PDM_CONFLICT = 0`；
- `HANDOFF_GAP_UNRESOLVED = 0`；
- PDM-13 = `COMPLETE / INTEGRITY_PASS`；
- 下一域允许进入 PDM-14。

## 2026-10-05｜PDM-13 修正 Final Overview 候选已生成

- 候选文件：`07_重建工作区/PDM-13_最终完整规则总览_待用户批准.md`；
- 状态：`FINAL_CANDIDATE / WAITING_USER_FINAL_APPROVAL`；
- 当前正式规则 / 修复 Atom = 38；
- 已纳入 LIA-07：Match tier downgrade 立即重评；
- 已纳入 LIA-08：TTL 是最长保护上限、销售可 TTL 前 release / 不推荐此车、Recommendation/Priority 两对象独立、Lock/Transaction 不反向撤销；
- R2 完整性报告 = `07_重建工作区/PDM-13_Final前完整性复核_R2_2026-10-05.md`；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- PDM-13 Final 仍未发布；
- 当前唯一下一步：等待用户最终批准该总览。

## 2026-10-05｜PDM-13 Final Overview 复查补漏与 R2 PASS

- Final Overview 复查发现 `P13-LIA-07～P13-LIA-08`；
- LIA-07：active Priority 的 current Match Result 若由 high/acceptable 降为 confirmation_needed/no_match，必须立即重评；有同 Customer 其他合法 Demand 则切 trigger_demand_id 且 expires_at 不变，无则 ended 并重新仲裁；
- LIA-08：TTL 是最长自动保护上限，不要求等满；合法 responsible employee 可在 TTL 前主动“释放 Priority / 不推荐此车”，释放后立即重新仲裁；
- 尚未 Recommendation 时，Priority release 不得叫“取消推荐”；
- 已有 Recommendation 时，Recommendation end 与 Priority release 可在体验层组合，但底层必须分别执行、校验、审计；
- Recommendation cancellation alone 不结束 Priority，也不单独触发 same-cycle suppression；
- Priority release / expiry alone 不结束仍合法 Recommendation；
- Recommendation cancel / Priority release / expiry 不得反向撤销已合法成立 Lock / Transaction；
- 正式 Recommendation 成立后 Priority 可保存 recommendation_id 作为关联追溯，但生命周期仍分离；
- B4-04/B4-08 旧“Recommendation cancellation 自动等于 Priority ended / same-cycle suppression”口径已被 LIA-08 用户修正版 supersede；
- R1 报告继续保留历史；当前有效 Final 前 Gate 报告为 `07_重建工作区/PDM-13_Final前完整性复核_R2_2026-10-05.md`；
- R2：Source→Atom / Atom→Source / Semantic Completeness / Completed-PDM Invariant / Cross-PDM Handoff / Negative Claims = PASS；
- 正式规则/修复 Atom 总数由 36 增至 38；
- incoming handoff 5 / 5 继续 `HANDOFF_ACCEPTED`；
- 当前唯一下一步：重新生成修正后的 PDM-13 Final Domain Overview 候选并提交用户最终批准。

## 2026-10-05｜PDM-13 Final 前修复与二次完整性复核 PASS

- 第一轮 Final 前审计发现 `P13-LIA-01～P13-LIA-06`，用户全部同意并明确“确认执行”；
- 已补齐：单 Customer Priority 资格开关生命周期、单 Customer 多 Vehicle active Priority 无上限、event-driven 重评、普通入口/公共统计排他、Priority 与价格/查价权隔离、PDM-20/21/22 future handoff；
- 新增 `HO-P13-P20-001 / HO-P13-P21-001 / HO-P13-P22-001 = HANDOFF_OPEN`；
- PDM-13 outgoing future handoff 当前共 8 条：PDM-14 / 17 / 18 / 19 / 20 / 21 / 22 / 25；
- 二次复核：Source→Atom / Atom→Source / Semantic Completeness / Completed-PDM Invariant / Cross-PDM Handoff / Negative Claims 全部 PASS；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `CROSS_PDM_CONFLICT = 0`；
- `HANDOFF_GAP_UNRESOLVED = 0`；
- `PDM13_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `PDM13_LOCAL_DEFERRED_UNRESOLVED = 0`；
- 报告：`07_重建工作区/PDM-13_Final前完整性复核_2026-10-05.md`；
- 5 条 incoming handoff 继续保持 `HANDOFF_ACCEPTED`，未提前关闭；
- 当前唯一下一步：生成 PDM-13 Final Domain Overview 候选并提交用户最终批准。

## 2026-10-05｜PDM-13 Batch 4 用户批准并执行

- 用户最终裁决：B4-01 按用户修正版；B4-02=2A、B4-03=3A、B4-04=4A、B4-05=5A、B4-06=6A、B4-07=7A、B4-08=8A；
- Priority 资格固定为后台针对单个 Customer 的独立开关，不由 Customer Level 自动产生；Customer Level 继续只决定正式 find-car entitlement；
- 所有合法正式 Demand 共用 PDM-12 一套 Matching；hidden 但真实可售 Vehicle 仍可内部 Matching；
- active Priority 是 Matching 后的限时排他保护：其他普通客户/无关员工不能通过普通后续链路获得该车；Priority Customer 本人也不会因 Priority 自动获得详情权；
- trigger Demand 当前合法负责人先处理并决定 Recommendation；Recommendation/visibility grant 合法成立后客户才可见；
- 不建设独立全局 priority.view / priority.manage / priority.override；Priority 查看/处理跟随业务责任、合法管理范围及 PDM-02 通用权限模型；
- 多 Priority Customer 仲裁：high > acceptable → Demand.created_at 更早 → demand_id 更小；
- 默认 TTL=24h/86400s，后台全局可配，创建时冻结，不人工续期；Recommendation、重算、trigger Demand 切换、责任交接均不重置；
- same listing_cycle 对客户放弃/员工释放/Recommendation 取消/TTL expired 做自动再获得抑制；新真实事实或新 listing_cycle 可重新参加仲裁；
- trigger Demand 失效时优先切同 Customer 其他合法 Demand，原 expires_at 不变；无可切换 Demand 则 ended；
- active Lock 不阻断 Matching 但阻止新 Priority；正式 Lock / in-progress Transaction 可结束 active Priority；释放/取消后不恢复旧 Priority，重新按当前事实仲裁；
- Priority current responsible 跟随 trigger Demand responsible；Handover Batch 中 TTL 自然运行，不暂停、不延长、不重置；无合法负责人不得新建 Priority；
- Priority 资格本身不是公海保护，active Priority 才是；ended 后重读其他保护事实；
- ended 必须保留真实 reason，并在 Vehicle 合法重新开放后读取所有 Customer 当前合法 Match Result 再决定新 Priority 或普通业务流；
- 新增 PDM-13→PDM-14/17/18/19/25 future handoff，均登记 HANDOFF_OPEN；
- PDM-13 incoming 5 条 handoff 继续 HANDOFF_ACCEPTED，待 Final / Integrity closeout；
- stale carrier 新增：历史独立 priority.view 全局穿透查看方向已 superseded；
- 当前唯一下一步：PDM-13 Final 前完整性复核。

## 2026-10-05｜PDM-13 Batch 3 用户批准并执行

- `P13-B3-01～P13-B3-06 = PASS / USER_APPROVED`；
- Batch 3 冲突隔离 = PASS；
- Priority 员工侧查看/处理统一继承 PDM-02 `identity + permission + data scope + object state`；
- Priority 交接正式进入 Handover Batch，部分失败不整体回滚，历史不改写；
- 若 Priority 仲裁使用 Demand 创建先后，只能读取不可变 `Demand.created_at`，但是否采用该维度仍留 Batch 4；
- Demand/Matching 退出 current valid 后，已有 Priority 必须重新评估，不得继续依赖 stale/invalidated Match Result；
- active Lock 不阻断 PDM-12 Matching，PDM-13 只处理 Lock×Priority 关系；
- Priority 重评只消费 PDM-12 current Match Result / Matching change fact，不复制第二套 Matching Authority；
- 资格来源 / 等级关系 / 精确仲裁 / TTL / 续期 / same-cycle / trigger_demand / active Lock 最终答案 / Transaction / 公海保护 / 无 owner 与 capability 最终边界继续 Batch 4；
- 5 条 incoming handoff 继续保持 `HANDOFF_ACCEPTED`；
- 当前唯一下一步：PDM-13 Batch 4 真实冲突 / 缺口 / 新产品选择候选审查。

## 2026-10-05｜PDM-13 Batch 2 用户批准并执行

- `P13-B2-01～P13-B2-05 = PASS / USER_APPROVED`；
- Batch 2 反向冲突扫描 = PASS；
- 明确禁止恢复：独立“客户专属”体系、人工创建/转让/覆盖/延长 Priority、Priority 作为 Lock 优先权、客户端暴露 Priority 内部术语、Priority 本身直接授予客户详情权；
- Current Navigation `E05-05｜创建 Priority` 正式登记为 stale carrier，不得按人工创建实现；
- Current `E05-05::HIDDEN_CONTROLLED` 中“Priority 直接让客户可见”的旧语义正式标记 superseded；
- 明确没有废弃：Priority qualification / Customer Level 关系 / 精确仲裁 / `Demand.created_at` tie-break / TTL 默认数值 / TTL 配置主体 / 续期 / 完整结束原因 / same-cycle / trigger_demand / active Lock / Transaction / 公海保护 / 重仲裁事件；
- 5 条 incoming handoff 继续保持 `HANDOFF_ACCEPTED`，不得在 Final 前提前关闭；
- 当前唯一下一步：PDM-13 Batch 3 明确新增 / 明确变更候选重建。

## 2026-10-05｜PDM-13 Batch 1 用户批准并执行

- PDM-13 工作版已建立：`07_重建工作区/PDM-13_Priority仲裁TTL与Lock边界_规则原子重建_工作版.md`；
- target=PDM-13 的 5 条 incoming handoff 已全部读取并接收：HO-P03-P13-001 / HO-P04-P13-001 / HO-P07-P13-001 / HO-P11-P13-001 / HO-P12-P13-001 = `HANDOFF_ACCEPTED`；
- Current Authority Refresh / Current Implementation Fact 已完成；
- Batch 1：`P13-A01～P13-A11 = PASS / USER_APPROVED`；
- 已冻结：Priority 不复制 Matching、只消费当前合法 high/acceptable、不得猜测/篡改 provenance、同车唯一 active、同 customer+vehicle+listing_cycle 幂等、TTL 创建时冻结、交接不改历史、Priority 不改 owner、与 Recommendation 分离、不改 Vehicle/listing_cycle、结束只恢复底层应有状态、历史不可抹除；
- 明确未偷渡：Priority 客户资格 / Customer Level 关系 / 精确仲裁顺序 / TTL 默认数值与配置 actor / 续期 / 完整结束原因 / active Lock / Transaction / 客户详情 visibility / 公海保护等继续后续批次；
- stale carrier 已登记：Navigation 残留“创建 Priority”；E05-05 HIDDEN_CONTROLLED 残留“Priority 本身给客户详情权”的旧口径；
- 当前唯一下一步：PDM-13 Batch 2 明确废弃 / 替代 / DO_NOT_RESTORE 候选重建，形成候选后停下用户审查。

## 2026-10-05｜PDM-12 Final 用户最终批准并正式发布

- Final Domain Overview：用户最终全部同意；
- 此前确认执行的执行授权继续有效，已正式发布；
- 正式 Authority：`07_重建工作区/PDM-12_最终完整规则.md`；
- 用户批准留痕：`07_重建工作区/PDM-12_最终完整规则总览_待用户批准.md`；
- 最终完整性报告：`07_重建工作区/PDM-12_最终完整性复核_2026-10-05.md`；
- 44 个正式 Atom 全部进入 Final；
- Source→Final / Final→Source / Semantic Completeness / Completed-PDM Invariant / Handoff / Negative Claims = PASS；
- HO-P04-P12-001 / HO-P05-P12-001 / HO-P07-P12-001 / HO-P11-P12-001 = HANDOFF_CLOSED；
- PDM-04 / 05 / 07 / 11 Final 已完成 source backwrite；
- PDM-12 outgoing handoff 到 PDM-13 / 14 / 16 / 18 / 20 / 21 / 22 / 25 继续 OPEN；
- PDM-12 = `COMPLETE / INTEGRITY_PASS`；
- 当前进入 PDM-13 启动门禁。

## 2026-10-05｜PDM-12 Final 前完整性修复与二次复核 PASS

- `P12-LIA-01～P12-LIA-06 = USER_APPROVED / APPLIED`；
- LIA-01：客户未填写正式条件 = 不限，不等于 unknown；
- LIA-02：补齐 matching readiness，部分 component 待确认不必停止整个 Demand Matching；
- LIA-03：confirmation_needed 不占车、不排他、不阻断其他 Customer/Demand；
- LIA-04：补齐 Matching 集合进入/退出与 stale result invalidation；
- LIA-05：active Lock 本身不等于不可 Matching；新增 `HO-P12-P18-001`；
- LIA-06：人工确认执行主体继承 PDM-02；精化 PDM-20 车型年款/首次上牌年份与数字价格筛选边界；PDM-21 固定确认事实→重算→再读 tier；
- PDM-12 stale carrier 6 项已登记，只登记不施工；
- Final 前二次复核：Source→Atom / Atom→Source / Semantic Completeness / Completed-PDM Invariant / Cross-PDM Handoff / Negative Claims 全部 PASS；
- 报告：`07_重建工作区/PDM-12_Final前完整性复核_2026-10-05.md`；
- 当前唯一下一步：生成 PDM-12 Final Domain Overview 候选并提交用户最终批准。

## 2026-10-05｜PDM-12 Batch 4 用户批准

- `P12-B4-01～P12-B4-06 = PASS / USER_APPROVED`；
- 用户裁决：`1A / 2A / 3A / 4A / 5A / 6A`；
- 无预算 + 价格咨询：价格维度不限；有预算 + 价格咨询：`confirmation_needed`；
- 里程只把最高可接受里程作为 hard condition，低于表达下限仍可符合；
- 变速箱 / 配置偏好 / 过户次数 / 城市距离 / 排放标准 / 车源类型继续不参与 V1 自动四级 Matching；
- Rule Dictionary 正式规则不普通物理删除，只停用/废弃并保留历史审计；
- partial failure 不整体回滚，成功对象保留新结果，只重试失败集合；失败对象旧 Match Result 不得继续驱动新的 Priority/Recommendation；
- 新增 `matching.rule.manage`：active 名邦 Employee 受独立 permission 控制，4S hard DENY，System Admin 只配置权限、不因身份自动取得写规则能力；
- `PDM12_LOCAL_DEFERRED_UNRESOLVED = 0`；
- outgoing future handoff 已登记到 PDM-13 / 14 / 16 / 20 / 21 / 22 / 25；
- 当前唯一下一步：PDM-12 Final 前完整性复核。

## 2026-10-05｜PDM-12 Batch 3 用户批准

- `P12-B3-01～P12-B3-07 = PASS / USER_APPROVED`；
- find-car entitlement 在正式 Matching / 重算前动态重验，并与 PDM-11 active/paused/readiness 状态机统一；
- P06-10 Rule Dictionary 恢复为真实可维护业务对象，补字段、基础 Action、scope priority、same-level conflict 与无副作用测试解析；
- VR-P-021 / VR-P-022 正式承接：正/反向表达、hard/preferred/tolerance、局部例外、证据优先级、component 局部影响；
- Matching 结果必须可解释；
- 词典变化按受影响范围重解析/重算，禁止无脑全库；
- 新增 `HO-P12-P16-001 = HANDOFF_OPEN`：PDM-12 产生 Matching change fact，PDM-16 Source Radar 消费，不复制第二套 Matching Authority；
- 当前唯一下一步：Batch 4 真实冲突 / 语义缺口 / 新产品选择候选审查。

## 2026-10-05｜PDM-12 Batch 2 用户批准

- `P12-B2-01～P12-B2-10 = PASS / USER_APPROVED`；
- 冻结不得恢复：第二套客户专属/独立匹配、普通关键词搜索替代共享解析、客户原话/AI 猜测直入 Matching、mapping pending 阻断已明确 JYT 车型事实、hidden=offline、猜测车况、恢复整套旧车况字段、closest fallback、Match Result 自动制造下游对象、定时全库扫描作为唯一更新机制；
- Batch 2 反向冲突扫描 = PASS；
- 明确排除：旧字段排除清单、里程特殊规则、P06-10 完整治理、VR-P-021/022、无预算+价格咨询、Priority 完整生命周期均继续后续审查，不属于已废弃；
- 当前唯一下一步：形成 Batch 3 后续明确新增 / 明确变更项候选并停下等待用户审查。

## 2026-10-05｜PDM-12 Batch 1 用户批准

- Current Authority Refresh / Current Implementation Fact 已完成；
- Batch 1：`P12-A01～P12-A15 = PASS / USER_APPROVED`；
- P12-A15 正式冻结：车源主页搜索与正式 Demand Matching 共用同一套确定性解析 / 匹配词典；共享解析层，但搜索不创建 Match Result / Priority / Recommendation / Demand / Lock；
- M03-001～M03-003 Source→Atom 反查完成；
- 首轮发现 `SEARCH_MATCH_SHARED_DICTIONARY` 属于“证据已读但 Atom 未生成”，现已修复；
- 当前 `UNMAPPED_STABLE_BATCH1_RULE = 0`；
- P06-10 Action/scope/test/retry、旧字段排除、里程特殊规则、VR-P-021/022 等均显式保留到后续批次，不视为丢失；
- 当前唯一下一步：形成 Batch 2（废弃 / 禁止恢复项）候选并停下等待用户审查。

## 2026-10-05｜PDM-11 最终批准并进入 PDM-12

- PDM-11 Final 用户批准：PASS；
- 正式 Authority：`07_重建工作区/PDM-11_最终完整规则.md`；
- Final Integrity：`INTEGRITY_PASS`；
- `HO-P01-P11-002 = HANDOFF_CLOSED`；
- PDM-01 source backwrite 已完成；
- PDM-12 工作版已建立；
- PDM-12 incoming：HO-P04-P12-001 / HO-P05-P12-001 / HO-P07-P12-001 / HO-P11-P12-001 均已 ACCEPTED；
- PDM-12 尚未开始 Batch 结论，仅进入证据重建。

## 2026-10-05｜PDM-11 Final 前完整性复核完成

- P11-LIA-01：补齐无 owner / pool-empty Application 创建 Guard，不允许 `responsible=null`；
- P11-LIA-02：pending Application 明确为公海保护事实，并扩展 PDM-17 handoff；
- P11-LIA-03：用户裁决双向结束——客户发起结束请求，员工确认后按真实结果落 `completed / cancelled`；员工也可直接结束；不新增第五主状态；
- P11-LIA-04：补齐不可变 `Demand.created_at`，供 PDM-13 后续仲裁引用；
- P11-LIA-05：客户端等级升级提示必须读取当前真实 entitlement 配置，粉丝/VIP 仅当前配置示例；
- P11-LIA-06：PDM-12/13/14/16/17/20/21/22/25 handoff 已扩展，禁止“交后面做”时再次压缩丢细节；
- P11-LIA-07：补 PDM11-GATE-B1，修 Current stale；
- Customer disable 对 pending Application：保留历史、不自动关闭、停用期间不得激活，恢复后也不自动激活；
- 当前状态：`PREFINAL_INTEGRITY_PASS / FINAL_CANDIDATE_READY`。

## 2026-10-05｜PDM-11 Batch 4 全部确认

- P11-B4-01：所有 Find-car Application 均先 pending；不因已有 entitlement 自动 active；必须由合法员工在处理详情中人工创建 / 激活唯一 Demand；
- P11-B4-02：正式找车资格只来自 Customer Level 配置；普通客户当前无正式找车权益；需要开通时通过等级升级到具备权益的粉丝 / VIP 等等级；不建设单 Customer find-car entitlement override；
- 客户等级调整继承 PDM-02 permission + data scope + object state，不建设固定多级审批；经理 / 店长可按配置拥有，个别销售可明确授权；
- 普通客户可提交找车 Application，但无权益时只保持 pending；客户端必须明确提示升级等级 / 联系顾问；
- 联动回写 PDM-10：daily quota 只限制批发车；LIMITED 列表隐藏精确数字价，详情真实进入时有额度自动解锁，无二次“查看价格”点击；quota 耗尽主字段 `--万`；UNLIMITED 列表/详情直接显示数字价；临时增加当天次数对客户免费；
- PDM-11 已正式登记 PDM-12/13/14/16/17/20/21/22/25 future handoff；
- Batch 4 = `PASS / USER_APPROVED`；
- 当前进入 PDM-11 Final 前完整性复核。

## 2026-10-05｜PDM-11 Batch 3 用户修正并通过

- 用户否决旧“账号停用不自动改变 Demand 状态”的口径；
- 当前 Authority：Customer 停用 → active Demand 自动 paused；历史、条件、推荐/匹配/跟进、负责人/状态历史全部保留；
- 账号恢复后不自动恢复 Demand，需正式 resume；
- PDM-01 Final §11 已完成 source backwrite；
- `HO-P01-P11-001 = HANDOFF_SUPERSEDED`；
- `HO-P01-P11-002 = HANDOFF_ACCEPTED`；
- Batch 3 = `PASS / USER_APPROVED`；
- 当前进入 Batch 4：`P11-B4-01 / P11-B4-02`。
## 2026-10-05｜PDM-11 Batch 2 全部确认

- 用户确认 P11-B2-01～P11-B2-07、P11-B2-09、P11-B2-10 全部同意；
- P11-B2-08 继续采用此前用户主动修正版；
- Batch 2 = `PASS / USER_APPROVED`；
- 当前进入 Batch 3；
- Batch 3 当前正式待审项：`P11-B3-01`。
## 2026-10-05｜PDM-11 P11-B2-08 用户修正

- 原候选“找车权益下降不得自动影响 active Demand”撤回；
- 当前规则：entitlement 下降/取消 → active Demand 自动 paused；
- Demand、条件、历史匹配、Recommendation、CRM 跟进、状态/负责人历史全部保留；
- entitlement 恢复后不自动 active，需客户本人或有权限员工正式恢复；
- Customer 账号停用与 entitlement 下降严格分离；账号停用本身不自动改 Demand 状态；
- P11-B2-08 = `USER_MODIFIED / USER_APPROVED`；
- Batch 2 剩余 9 条继续 `USER_REVIEW_PENDING`。
## 2026-10-05｜PDM-11 Batch 1 全部确认

- 用户明确确认 `P11-A01～P11-A13` 全部同意；
- Batch 1 = `PASS / USER_APPROVED`；
- 未将 Customer 停用后续修改偷渡入 Batch 1，继续保留在 Batch 3；
- 未将 Application 激活时机 / 找车资格来源真实冲突偷渡入 Batch 1，继续保留在 Batch 4；
- 当前进入 Batch 2：`P11-B2-01～P11-B2-10 / USER_REVIEW_PENDING`。
## 2026-10-05｜PDM-11 启动与证据重建完成

- 已读取并承接 `HO-P01-P11-001`，状态从 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- 已建立 PDM-11 Completed-PDM Dependency Card、术语表、Current Implementation Fact 卡；
- 已重新读取 9/06 SSOT / Decision、9/19 C2 / R10 / R12、IA V5、实际 Low-Fi、M03/M16/M17、已完成 PDM Final；
- 已形成 Batch 1 稳定一致候选 `P11-A01～P11-A13`；
- 已识别真实历史冲突：找车权益客户是否可直接激活 Demand vs 9/19 统一 pending 后由员工激活，暂挂 Batch 4，不静默选择；
- 已识别找车资格来源模型缺口，暂挂 Batch 4；
- Customer 轻量停用不终止既有 Demand 属于 PDM-01 后续明确知情修改，预挂 Batch 3；
- 当前状态：`BATCH_1_USER_REVIEW_PENDING`。
## 2026-10-05｜PDM-01～10 全局总复核完成

- `GLOBAL_PDM01_10_CROSS_PDM_AUDIT = PASS`；
- PDM-01～10 内部 handoff 无 OPEN / ACCEPTED 残留；
- CLOSED handoff 全部有目标 Authority 且 `source_backwrite=YES`；
- future PDM-11～25 保留 69 条合法 `HANDOFF_OPEN`；
- 全局 invariant：Customer / Employee / Vehicle 身份、owner、permission、System Admin、4S、listing_cycle、source facts、snapshot、sensitive access、Customer disable、formal-history delete 全部 PASS；
- 本轮仅修正两项控制性 stale：PDM-01～07 顶部状态元数据、PDM-01 §10 对 PDM-02 的过期“留后续”文字；
- 全局报告：`07_重建工作区/PDM-01至10_全局Cross-PDM_Handoff_GlobalInvariant总复核_2026-10-05.md`；
- PDM-11 启动门禁：`UNBLOCKED`；
- PDM-11 incoming：`HO-P01-P11-001`。
## 2026-10-05｜PDM-10 Legacy Final Integrity Audit 完成

- PDM-10 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 5 组问题：Customer 停用价格权益真实闭环、DAILY_PRICE_QUOTA_EXHAUSTED→联系顾问、3A LIMITED/UNLIMITED 与临时额度、PDM-14/18/20/21/22/25 formal handoff、IA/Low-Fi stale carrier；
- 用户最终裁决 3A：UNLIMITED 时禁止新增临时查价次数；当天已有 today_temp_additions 保留，同日回 LIMITED 后继续有效；UNLIMITED 浏览不计 quota consumption；
- PDM-01～PDM-10 单域 Legacy Final Integrity Audit 至此全部 `INTEGRITY_PASS`；
- 审计报告：`07_重建工作区/PDM-10_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：`GLOBAL_PDM01_10_CROSS_PDM_AUDIT`；
- PDM-11 继续 BLOCKED，直到全局总复核 PASS。
## 2026-10-05｜PDM-09 Legacy Final Integrity Audit 完成

- PDM-09 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 5 组问题：P03-05 source_platform+upstream_publisher_id 与电话明文权限隔离、无有效号码不覆盖旧缓存、3A source_type 电话入口裁剪、PDM-21/22/23/25 future handoff、IA/Low-Fi/旧实现 stale carrier；
- 用户最终裁决 3A：上游电话只作为当前 wholesale/JYT 批发车源的日常敏感能力；批发→名邦或当前为 4S 后，车辆详情关闭查看/latest/拨打入口，但 publisher 来源事实、缓存、history、审计不删除；
- P09-A04-R1 / P09-A11-R1 的 Collector 取号→名邦 Integration API 回传架构保持不变；
- 审计报告：`07_重建工作区/PDM-09_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-10 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-08 Legacy Final Integrity Audit 完成

- PDM-08 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 5 组问题：分享卡片动态价格 DENY、报告/H5旧 URL 权限重验、3A 资产化未闭环临时受控回源、PDM-20/21/22/25 future handoff、IMG-001～030 traceability 归一；
- 用户最终裁决 3A：转名邦后尚未成功资产化的图片，在任务未闭环期间可通过名邦受控 CDN 临时回源 JYT；成功后立即切自有对象存储，禁止长期依赖 JYT；
- 工作版早期 IMG mapping 降为 historical/superseded，以 2026-10-03 CDN 重映射为唯一 Current traceability；
- 审计报告：`07_重建工作区/PDM-08_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-09 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-07 Legacy Final Integrity Audit 完成

- PDM-07 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 4 组问题：PDM-08 报告/档案资源 handoff closure、PDM-12/13/14/15/18/19 业务 handoff、PDM-20/21/22/25 页面/配置/审计 handoff、IA/Low-Fi stale carrier；
- PDM-08 已完成的出险图片、4S维保图片/H5、报告/档案与普通相册隔离、名邦可控报告域名等资源承载已反向写回 PDM-07；
- 历史整套结构化车况字段不恢复，继续执行 P07-B4-01 的来源事实 + 必要确定性标准化方案；
- 审计报告：`07_重建工作区/PDM-07_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-08 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-06 Legacy Final Integrity Audit 完成

- PDM-06 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 6 组问题：草稿发布前 source_type 合法修改、PDM-07 档案 handoff closure、PDM-08 图片 handoff closure、PDM-10 价格 handoff closure、PDM-21/22/25 future handoff、IA/Low-Fi stale carrier；
- PDM-07/08/10 已完成承接均已反向写回 PDM-06；
- Cross-PDM Handoff Register 已登记 PDM-21/22/25 future handoff；
- 审计报告：`07_重建工作区/PDM-06_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-07 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-05 Legacy Final Integrity Audit 完成

- PDM-05 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 7 组问题：PDM-06 stale handoff、mapping conflict 业务连续性、pending/conflict 明确提示、后台 Admin/System Admin 身份歧义、车型固定属性纠错 current/history 边界、future handoff register、IA/Low-Fi stale carrier；
- 用户最终裁决 4A：车型主数据/JYT mapping/MODEL_MISSING/conflict/merge 归 System Admin 控制平面治理，`vehicle.model.manage` 为治理 Guard；
- 用户最终裁决 5A：车型唯一确定的固定属性当前值跟随有效车型主档纠错，历史业务快照与 JYT source facts 不追改；
- PDM-02 / PDM-06 已完成跨域反向同步；
- Cross-PDM Handoff Register 已登记 PDM-12/20/21/22/25 future handoff；
- 审计报告：`07_重建工作区/PDM-05_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-06 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-04 Legacy Final Integrity Audit 完成

- PDM-04 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 11 组问题：listing_cycle started_at、车辆时间概念分离、4S source_type 与成员权限、locked/trading 真实事实更新、PDM-08 图片 handoff、PDM-10 价格 handoff、PDM-05～10 stale handoff、car_code/电话隔离、JYT 三个固定业务 API、IA/Low-Fi stale carrier、Supply Anomaly 新业务 Guard；
- 用户最终裁决 Supply Anomaly=B：anomaly 只作为风险告警，不统一阻断新增业务；真实 offline / unavailable 才按不可售事实硬阻断；
- Cross-PDM Handoff Register 已同步：PDM-05～10 CLOSED；PDM-20 / PDM-22 / PDM-23 新 handoff 正式 OPEN；
- 审计报告：`07_重建工作区/PDM-04_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-05 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜Cross-PDM Handoff 双向闭环启用

- 已新增统一总账：`07_重建工作区/CROSS_PDM_HANDOFF_REGISTER.md`；
- 已把 PDM-01～PDM-10 已出现的 integrity 问题、已完成 handoff、仍开放 handoff 与 post-PDM25 stale carrier 持续回填到统一总账；
- 以后来源 PDM 只写“交后续”不算闭环；目标 PDM 完成后必须反向回写来源 Final / Integrity 报告 / Register / 状态文件；
- PDM-04 §20 已把 PDM-05～10 的旧“留后续”改为 `HANDOFF_CLOSED`；
- PDM-04 已通过 Integrity Audit；Supply Anomaly 采用用户裁决 B：anomaly 本身只告警、不统一阻断新增业务，真实 offline / unavailable 才硬阻断；
- IA / Low-Fi 仍不施工，只登记 stale carrier，继续遵守 PDM-25 后集中对齐规则。
## 2026-10-05｜PDM-03 Legacy Final Integrity Audit 完成

- PDM-03 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 9 组问题：客户主动要求更换销售触发条件、普通 owner 移交 reason 非必填、inactive→active 复职边界、离职交接对象范围、Handover Batch 逐对象映射与部分失败、PDM-10 分享/查价 handoff closure、公司客户历史访问边界、Customer 停用对 owner 的影响、IA/Low-Fi stale carrier ledger；
- 用户确认：9 组问题全部同意；IA / Low-Fi 当前只登记 `STALE_CARRIER`，不修改承载文件；
- 审计报告：`07_重建工作区/PDM-03_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-04 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-04｜PDM-02 Legacy Final Integrity Audit 完成

- PDM-02 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 8 组问题：权限变化即时生效、inactive 恢复 accepting 默认 OFF、调店前交接、治理审计最小字段、接客/离职交接与 handover batch、System Admin 自身治理、System Admin 直接停用/恢复 Customer、已完成跨域 handoff 清理；
- 用户新增裁决：System Admin 可直接执行 Customer 账号停用 / 恢复，定义为控制平面治理动作；不因此获得销售 / CRM / owner / Lock / Transaction 等业务执行权；
- PDM-01 已同步 `PDM01-DEC-A16-R2`，保持 `INTEGRITY_PASS`；
- 审计报告：`07_重建工作区/PDM-02_历史最终版完整性复核_2026-10-04.md`；
- 当前进入：PDM-03 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。

## 2026-10-04｜IA / Low-Fi 集中对齐时点冻结

用户明确决定：不在 PDM-01～10 完成后单独对齐 IA / Low-Fi。

固定流程：

> PDM-01～10 Integrity Audit → 01～10 全局总复核 → PDM-11～25 → PDM-01～25 全局最终总复核 → IA 集中对齐 → Low-Fi 集中对齐 → Engineering。

PDM-01～25 期间发现的 IA / Low-Fi 错误统一登记 `STALE_CARRIER` 与正确 Authority，不直接修改 carrier。
## 2026-10-04｜PDM-01 Legacy Final Integrity Audit 完成

- PDM-01 Integrity：`INTEGRITY_PASS`；
- 本轮共关闭 6 组 reopen：显式登录页语义、手机号授权拒绝时找车表单临时保留、PDM-02 手机号维护 handoff、接客池异常为空、PDM-03 owner/分享 handoff、客户账号停用/恢复轻量后台控制；
- 客户账号停用最终口径：后台受控停用/恢复；停用后仍可进入网站/小程序并浏览公开内容，但暂停依赖 Customer 身份/权益的业务账号能力；不删除 customer_id / owner / 来源 / 历史；若只需降权使用客户等级调整；
- IA / Low-Fi 中旧“首次无 owner / SOURCE_ONLY / Customer Merge”等只登记为 stale carrier，本轮不修改；
- 审计报告：`07_重建工作区/PDM-01_历史最终版完整性复核_2026-10-04.md`；
- 当前进入：PDM-02 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。

## 已完成

- 六类证据完整导入并校验；
- 产品全域覆盖地图完整性校验 PASS；
- 25 个一级产品域冻结为重建覆盖骨架；
- IA V5 25 个 Canonical Object 均有 PDM 落点；
- 001～078 的 224/224 单元均可挂载；
- PDM-01：`COMPLETE`；
- PDM-02：`COMPLETE`；
- PDM-03：`COMPLETE`；
- PDM-04：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-04_最终完整规则.md`；
- PDM-05：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-05_最终完整规则.md`；
- PDM-06：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-06_最终完整规则.md`；
- PDM-07：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-07_最终完整规则.md`；
- PDM-08：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-08_最终完整规则.md`；
- PDM-09：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-09_最终完整规则.md`；
- PDM-10：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-10_最终完整规则.md`；
- 已新增并启用《用户全量审查四批门禁规范》。

## 2026-10-04｜PDM-01～PDM-10 Legacy Final Integrity Audit 前置阶段

用户明确要求：PDM-10 完成后先不要进入 PDM-11，先用 2026-10-04 新的信息保真 / 一次性收口标准重新复核 PDM-01～PDM-10。

本轮不是只做“细检”，必须同时：

- 重新查整条业务规则遗漏；
- 检查现有 Final 是否压掉条件、例外、权限、生命周期、历史等细节；
- 检查 PDM-01～10 之间的冲突、静默覆盖、handoff 丢失与 stale rule。

已新增方法门禁：

> `00_先读/01_产品基线重建执行规范_冻结工作版.md` §3.3 Legacy Final Integrity Audit Gate

总控工作单：

> `07_重建工作区/PDM-01至10_全域完整性复核_总控工作单.md`

执行顺序：PDM-01 → ... → PDM-10 → 01～10 全局 Cross-PDM / Handoff / Global Invariant 总复核 → PASS 后才允许 PDM-11。

原 PDM-01～10 `COMPLETE` 保留为历史裁决完成状态；在本轮 Integrity Audit PASS 前，不声称旧 Final 已满足当前新完整性标准。

---
## 2026-10-04｜PDM-10 最终完成

用户最终批准 PDM-10《价格 / 查价 / 客户展示价覆盖》完整规则，并明确“确定执行”写入仓库。

- PDM-10 状态：`COMPLETE`；
- 正式规则：`07_重建工作区/PDM-10_最终完整规则.md`；
- 完整性检查卡：`07_重建工作区/PDM-10_信息保真与一次性收口检查卡_2026-10-04.md`；
- Coverage 报告：`07_重建工作区/PDM-10_全量DecisionCoverage未映射检查报告_2026-10-04.md`；
- M11-001～M11-017：17/17 有明确去向；
- SOURCE_DECISION_COVERAGE = 100%；
- UNMAPPED = 0；
- FINAL_TO_SOURCE_TRACEABILITY = 100%；
- CROSS_PDM_CONFLICT = 0；
- SEMANTIC_INTEGRITY = PASS；
- USER_FINAL_APPROVED = YES；
- IMPLEMENTATION_READY = PASS；
- PDM-02 / PDM-06 的旧独立调价语义已显式 supersede 并同步加注；
- PDM-20/21/22/25 等后续 carrier handoff 已登记完整 Guard，不修改 IA / Low-Fi / Engineering。

当前允许进入 PDM-11 准备，但不得跳过新方法的依赖卡和证据刷新。

---
## 2026-10-04｜信息保真 / 一次性收口方法升级

用户明确要求停止“越写越丢、后续 PDM 再反复重建”的循环。本轮已把防丢失要求升级为全局硬门禁：

- Memory Zero-Trust：模型记忆 / 聊天上下文只能作为检索线索，不能代替当前 GitHub 证据；
- Current Authority Refresh：重要判断前重新读取当前状态、Decision、相关已完成 PDM Final；
- PDM Scope ≠ Evidence Scope：业务域不限制证据读取范围；
- Completed-PDM Dependency Card：任何新 PDM 在 Batch 1 前必须建立跨 PDM 依赖卡；
- Global Invariant Gate：identity / permission / data scope / owner / vehicle_id / listing_cycle / hard DENY / audit 等跨域不变量必须显式检查；
- Terminology / Field Normalization：中文词、技术字段、历史别名统一后再检索；
- No Summary-on-Summary：禁止摘要继续摘要成为唯一证据；
- Bidirectional Traceability：Source→Final 与 Final→Source 双向追溯；
- Negative Claim Proof：所有“没有 / 已废弃 / 不存在 / 不需要”必须多路证明；
- Conflict Before Classification：完整证据扫完后才能分 Batch；
- Deferred Handoff Closure：跨域移交必须有目标、有完整语义、有接收状态；
- Change Impact Analysis：reopen / supersession / 新裁决必须立即检查受影响 PDM、Decision、IA/Low-Fi/Engineering；
- Semantic Completeness Matrix：权限、scope、hard DENY、生命周期、异常、并发、历史等适用维度不得静默省略；
- Final Semantic Integrity + Implementation-Ready Gate：`UNMAPPED=0` 不再足以标记 COMPLETE，最终文件必须可直接承接后续施工。

强制执行模板：

> `07_重建工作区/PDM_信息保真与一次性收口检查模板.md`

该模板是执行留痕，不是新的业务 Authority。

---

## 新增硬门禁

从现在开始：

> **任何规则原子都必须经过用户本人审查，不能因模型判断为稳定一致、明确废弃、已知情修改等而自动进入最终产品基线。**

每个 PDM 固定：

1. Batch 1｜稳定一致项；
2. Batch 2｜明确废弃 / 明确替代；
3. Batch 3｜明确知情修改 / 后续明确新增；
4. Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择；
5. 四批结束后再做一次 PDM 完整最终总览。

每批都必须停下来等用户确认。

## 当前 PDM-05

已按当前 GitHub 原始证据完成 PDM-05 Batch 1 稳定一致项筛选，共形成：

> **P05-A01～P05-A09**

工作版：

> `07_重建工作区/PDM-05_车型主数据年款JYT车型映射MODEL_MISSING_规则原子重建_工作版.md`

Batch 1 当前状态：

> `USER_REVIEW_PENDING`

本批只纳入前史、R3、9/19 与后续承载之间未发现真实业务反转的稳定一致项。JYT 未映射时精确事实使用边界、VR-P-010 与本地映射关系、MODEL_MISSING 原地新建车型 Action 冲突、重复车型合并等遗漏、明确废弃机制等均已留到后续批次，不在 Batch 1 偷偷收口。

## 2026-09-24｜PDM-05 车型 ID 映射口径修正

用户明确确认：

- 车型身份以 JYT `model_id` 为上游身份键；
- 通过 source mapping 映射到本地 `vehicle_model_id`；
- 两边 ID 数值不要求相同；
- 车型名称仅用于展示 / 快照 / 搜索 / Admin 辅助判断，不作为身份主键；
- 品牌 / 车系是否与 JYT 共用相同 ID 值，当前不作假定；
- P05-A03 / A05 / A06 涉及的映射确认、修正、冲突处理统一由后台 Admin 处理。

当前 Batch 1 已确认：P05-A03、P05-A05、P05-A06。
仍待审：P05-A01、P05-A02、P05-A04、P05-A07、P05-A08、P05-A09。

## 2026-09-24｜PDM-05 Batch 1 完成并进入 Batch 2

P05-A01～P05-A09 已全部用户确认。

其中：

- P05-A03 已修正为 JYT `model_id` → 本地 `vehicle_model_id` 的 ID-based source mapping；
- P05-A07 当前实际管理主体收口为后台 Admin，普通销售不得处理车型主数据/映射/冲突；
- Batch 1 状态：`COMPLETE_USER_CONFIRMED`。

当前进入：

> `PDM-05 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

Batch 2 待审：P05-B2-01～P05-B2-05。

## 2026-09-24｜PDM-05 Batch 2 完成并进入 Batch 3

P05-B2-01～P05-B2-05 已全部用户确认，Batch 2 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-05 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / USER_REVIEW_PENDING`

当前唯一待审：P05-A10。

## 2026-09-24｜PDM-05 Batch 3 完成并进入 Batch 4

用户确认：

- P05-A10：本地车型映射未完成，不阻塞 JYT 已明确车型事实用于正常业务；
- P05-A11：只要 JYT 已明确品牌、车系、年款、具体车型/款式等足够事实，即使 `vehicle_model_id` 尚未映射，也可参加精确搜索、筛选和自动 Matching。

因此“本地车型归属”和“车辆自身车型事实”正式分层。

当前进入：

> `PDM-05 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`

Batch 4 待审：P05-B4-01、P05-B4-02。

## 2026-09-24｜PDM-05 Batch 4 完成并生成最终总览

用户完成 Batch 4 裁决：

- P05-B4-01：后台 Admin 可直接新增缺失品牌 / 车系 / 具体车型并完成绑定；若来源于 JYT 采集车型，应在本次处理或紧接后的同一后台流程中尽快同步建立 `JYT model_id → local vehicle_model_id` source mapping，避免长期悬空；
- P05-B4-02：后台 Admin 可修正车型层级、合并重复车型、迁移车辆引用与 JYT mapping；真实旧车型长期保留。

至此 PDM-05 四批用户审查全部完成。

已生成：

> `07_重建工作区/PDM-05_最终完整规则总览_待用户批准.md`

当前状态：

> `FINAL_REVIEW_PENDING`

未经用户最终批准，不得将 PDM-05 标记 COMPLETE，不得进入 PDM-06。

## 2026-09-24｜PDM-05 最终完成

用户最终明确批准 PDM-05《最终完整规则总览》。

- PDM-05 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-05_最终完整规则.md`；
- Decision Register 已登记 `PDM05-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-05，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-06｜人工车辆发布 / 草稿 / VIN / 删除边界**

## 2026-09-24｜PDM-06 Batch 1 已形成

已严格按 GitHub 当前原始证据完成 PDM-06 稳定一致项筛选，共形成：

> **P06-A01～P06-A11**

工作版：

> `07_重建工作区/PDM-06_人工车辆发布草稿VIN删除边界_规则原子重建_工作版.md`

本批只纳入没有发现真实业务反转的规则，包括人工来源边界、草稿/正式车分层、最低发布字段、0 图发布、价格可空、VIN 非必填、正式发布校验、删除边界与授权编辑。

多草稿 vs DRAFT_RESUME、VIN 精确重复 Gate、已发布车辆“保存修改”正式生效、source_type 新建交互等已留后续批次，不在 Batch 1 偷偷收口。

## 2026-09-24｜PDM-06 Batch 1 完成并进入 Batch 2

用户确认 P06-A01～P06-A11 全部通过；P06-A12 多草稿管理已提前确认。

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-06 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

Batch 2 待审：P06-B2-01～P06-B2-08。

## 2026-09-24｜PDM-06 Batch 2、3 完成并进入 Batch 4

用户确认 P06-B2-01～P06-B2-08 全部通过。

Batch 3 经 GitHub 证据复核没有新的未审原子：
- P06-A12 多草稿规则已由用户本轮明确确认；
- source_type 发布后可修改规则已在 PDM-04 正式批准并由 PDM-06 继承。

当前进入：

> `PDM-06 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`

待审：P06-B4-01～P06-B4-05。

## 2026-09-24｜PDM-06 Batch 4 完成并生成最终总览

用户确认 P06-B4-01～P06-B4-05 全部通过。

至此 PDM-06 Batch 1～4 全部完成。

已生成：

> `07_重建工作区/PDM-06_最终完整规则总览_待用户批准.md`

当前状态：

> `FINAL_REVIEW_PENDING`

未经用户最终批准，不得将 PDM-06 标记 COMPLETE，不得进入 PDM-07。

## 2026-09-24｜PDM-06 最终完成

用户最终明确批准 PDM-06《最终完整规则总览》。

- PDM-06 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-06_最终完整规则.md`；
- Decision Register 已登记 `PDM06-GATE-FINAL`；
- 当前进入 PDM-07。

## 2026-09-24｜PDM-07 Batch 1 已形成

已基于 R9 / R10 / R11 / R12、CN11、IA V5 与 001～078 M10 形成稳定一致项：

> **P07-A01～P07-A11**

工作版：

> `07_重建工作区/PDM-07_车辆档案车况客户可见报告成交交付材料核验_规则原子重建_工作版.md`

结构化车况孤儿规则、档案维护 Action、客户可见性设置动作、交付材料配置机制等留后续批次。

## 2026-09-24｜PDM-07 Batch 1 完成并进入 Batch 2

用户确认 P07-A01～P07-A11 全部通过。

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-07 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

待审：P07-B2-01～P07-B2-04。

## 2026-09-24｜PDM-07 Batch 2、3 完成并进入 Batch 4

用户确认 P07-B2-01～P07-B2-04 全部通过。

Batch 3 经当前 GitHub 证据复核无新的未审原子，已关闭。

当前进入：

> `PDM-07 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`

待审：P07-B4-01～P07-B4-05。

## 2026-09-24｜PDM-07 Batch 4 完成并生成最终总览

用户确认 P07-B4-01～P07-B4-05 全部通过。

其中 P07-B4-01 已按 JYT 原始车况描述 + JYT `sub.tags` 的真实链路收窄：
- 不重复人工录入批发车车况；
- 标签保留来源 provenance；
- 标签/描述既可展示，也可作为确定性 Matching 输入；
- 只做必要标准化，unknown 不猜。

至此 PDM-07 Batch 1～4 全部完成。

已生成：

> `07_重建工作区/PDM-07_最终完整规则总览_待用户批准.md`

当前状态：

> `FINAL_REVIEW_PENDING`

未经用户最终批准，不得将 PDM-07 标记 COMPLETE，不得进入 PDM-08。

## 2026-09-25｜PDM-07 最终完成并进入 PDM-08

用户最终批准 PDM-07《最终完整规则总览》。

- PDM-07 状态：`COMPLETE`；
- 正式规则：`07_重建工作区/PDM-07_最终完整规则.md`；
- Decision Register 已登记 `PDM07-GATE-FINAL`；
- PDM-08 Batch 1 已形成：P08-A01～P08-A12。

## 2026-09-25｜PDM-01～07 反向覆盖校验

已完成正式反向覆盖校验。

报告：

> `07_重建工作区/PDM-01至07_反向覆盖校验报告_2026-09-25.md`

结果：
- PDM-01：PASS
- PDM-02：PASS
- PDM-03：PASS
- PDM-04：FAIL
- PDM-05：PASS_WITH_HANDOFF_GAP
- PDM-06：FAIL
- PDM-07：PASS

当前发现 5 个补漏项，尚未达到 `UNMAPPED=0`。

PDM-08 临时暂停，先完成反向覆盖补漏 Gate。

## 当前唯一下一步

> **审查 PDM-01～PDM-07 反向覆盖校验发现的 5 个补漏项，然后停止等待用户确认。**

## 当前禁止事项

- 不自动批准 PDM-06 Batch 1；
- 未经用户确认不得进入 PDM-06 Batch 2；
- 不得跳过任何 PDM-06 用户审查批次；
- 不得在 PDM-06 最终总览批准前进入 PDM-07；
- 不得静默改写 PDM-01～PDM-05 已确认规则；
- 不使用旧聊天记忆替代仓库证据；
- 不修改 IA / Low-Fi；
- 不执行 Engineering Delta。

## 当前产品基线状态

`NOT_READY`

## 2026-09-24｜R3/R4/R5 原件补回

已新增恢复证据目录：

> `01_证据_A_9月19日产品业务锚点/补回原始证据_2026-09-24/`

当前已补回 R3、R4、R5 原始业务重审最终总结；R2 已校正为“当时没有独立分支最终原件”，不再误判为缺失。

PDM-01 的 R5 证据重基准已完成：

- Batch 1 / Batch 2 已确认项共 20 条；
- 唯一真实冲突组 `P01-A04 + P01-B2-01` 已由用户裁决继续 A04，并登记为主动新修改；
- 其余 18 条已确认项无真实冲突；
- A12 / A13 / A16 的原始证据强度或边界得到补全，但仍须按四批门禁接受用户审查；
- R3 对 PDM-01 无直接身份规则；R4 仅有价格/查价与客户身份的交叉边界，不改写 PDM-01 身份规则。


## 2026-09-24｜CN11 精选业务原始证据补回

已新增：

> `01_证据_A_9月19日产品业务锚点/前置历史原始证据_2026-09-17_CN11/`

本次仅提取 21 份产品/业务高价值 Markdown 原件，未导入 DB/SQL、OpenAPI、代码、Starter、测试、SVG、CSV 等工程文件。

使用边界：

- CN11 是 9/19 之前的历史原始证据，不是当前最终 Authority；
- 001～078 继续作为历史问题雷达；
- 以后涉及 CN11 的规则原子，应优先回 CN11 原件核验，再与 9/19、9/22/后续证据比较；
- 不因补回 CN11 自动推翻已经过用户审查的规则；发现真实冲突必须显式交用户裁决。

PDM-01 当前已完成 Batch 1～4，状态为 `FINAL_REVIEW_PENDING`。
## 2026-09-24｜Customer Merge 主动取消

用户明确决定 V1 不建设 Customer Merge：不同微信身份对应的不同 `customer_id` 始终保持独立，即使现实中确认属于同一自然人也不做自动/人工 Merge。一个手机号允许登记在多个 Customer；手机号搜索可返回多个命中，但不触发合并。该裁决主动覆盖此前 A09 / A10 / B2-02，并使 A11 / A12 关闭为 N/A。


## 2026-09-24｜PDM-01 Batch 4 完成

用户已确认 A13 与 A16。A13 明确“手机号是可变联系方式，换手机号不是换 Customer”，与 A14 多手机号管理规则统一；A16 采用客户停用/恢复 V1 最小闭环。至此 Batch 4 全部完成，PDM-01 四批用户审查结束，进入 `FINAL_REVIEW_PENDING`。下一步仅生成最终完整规则总览，未经用户最终批准不得进入 PDM-02。


## 2026-09-24｜PDM-01 最终完成

用户已明确批准 PDM-01《最终完整规则总览》。

- PDM-01 状态：`COMPLETE`
- 正式规则文件：`07_重建工作区/PDM-01_最终完整规则.md`
- 最终候选文件保留作为审计轨迹；
- PDM-01 后续不得被其他 PDM 静默改写；若发现真实跨域冲突，必须重新显式提交用户裁决。

当前进入：

> **PDM-02｜员工身份 / 组织 / 角色 / 权限 / 数据范围 / System Admin / 4S 身份**


## 2026-09-24｜PDM-02 Batch 1 完成

用户明确确认 P02-A01～P02-A15 全部同意。Batch 1 状态：`COMPLETE_USER_CONFIRMED`。下一步准备 Batch 2，未经用户审查不得自动批准。


## 2026-09-24｜PDM-02 Batch 2 完成

用户明确确认 Batch 2 剩余 12 条全部同意。最终结果：B2-02 撤回并由 P02-A16 反转替代；B2-04 已确认；B2-01、B2-03、B2-05～B2-14 全部确认。Batch 2 状态：`COMPLETE_USER_CONFIRMED`。下一步准备 Batch 3，未经用户审查不得自动批准。


## 2026-09-24｜PDM-02 Batch 3 完成

用户确认 P02-A18：一个 4S 成员账号直接代表一家合作 4S 店/合作主体；不建设 4S 店组织层级，不使用 cooperation scope。4S 账号新增、启用、停用、基础资料及允许范围内业务 permission 配置由名邦后台具备相应管理权限的 active 内部管理人员统一处理；4S hard DENY 不得绕过。至此 A16/A17/A18 全部确认，Batch 3 状态：`COMPLETE_USER_CONFIRMED`。


## 2026-09-24｜System Admin 控制平面模型修正

用户明确修正此前过度限制：System Admin 与员工业务身份继续分离，但其角色应是系统治理/控制平面，而不是“不能管理业务权限”。新增 P02-A19：System Admin 可治理员工与4S账号、角色、permission、data scope、角色模板、接客配置等，但 System Admin 身份本身不获得员工业务执行权；同一真人要亲自做业务必须使用独立员工身份；hard DENY 不可绕过。该规则部分修正 A17/A18，并将 B4-02“店长由谁任命”关闭为由 System Admin 配置。


## 2026-09-24｜PDM-02 Batch 4 完成

用户明确“其他的都同意”，确认 B4-01、B4-03、B4-04、B4-05、B4-06；B4-02 已由 P02-A19 提前关闭。至此 Batch 4 六项全部完成，状态：`COMPLETE_USER_CONFIRMED`。

已生成最终候选：

> `07_重建工作区/PDM-02_最终完整规则总览_待用户批准.md`

当前进入 `FINAL_REVIEW_PENDING`，未经用户最终批准不得将 PDM-02 标记 COMPLETE，也不得进入 PDM-03。


## 2026-09-24｜PDM-02 最终完成

用户最终确认 PDM-02《最终完整规则总览》无其他问题，并特别确认：普通销售、经理、店长都可以接待客户；经理和店长满足 active + eligible + accepting 时可进入接客池并成为 Customer owner；4S 成员与 System Admin 不进入接客池。

- PDM-02 状态：`COMPLETE`
- 正式规则文件：`07_重建工作区/PDM-02_最终完整规则.md`
- 最终候选文件保留作为审计轨迹；
- 后续 PDM 不得静默改写 PDM-02，发现真实跨域冲突必须显式交用户裁决。

当前进入：

> **PDM-03｜Owner / 来源归因 / 分享注册 / 转介绍 / 接客 / 离职交接**


## 2026-09-24｜PDM-03 Batch 1 已形成

已严格按 GitHub 当前原始证据完成 PDM-03 稳定一致项筛选，共形成 P03-A01～P03-A13 十三条候选规则。自然注册立即分配 owner、普通客户车辆转发 SOURCE_ONLY、接客池异常为空 owner_assignment_pending 等后续主动修改明确留到后续批次，不伪装成历史稳定项。当前状态：`USER_REVIEW_BATCH_1_PENDING`。


## 2026-09-24｜PDM-03 Batch 1 完成

用户明确“没问题，进行下一步”，确认 P03-A01～P03-A13 十三条稳定一致项全部通过。Batch 1 状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 2 筛选，共形成 P03-B2-01～P03-B2-09 九条明确废弃 / 替代 / DO_NOT_RESTORE 候选项，当前等待用户审查。


## 2026-09-24｜PDM-03 Batch 2 完成

用户明确“全部确认”，确认 P03-B2-01～P03-B2-09 九条明确废弃 / 替代 / DO_NOT_RESTORE 全部通过。Batch 2 状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 3 筛选，共形成三条待审：P03-A14 自然注册立即形成 owner、P03-A15 普通客户车辆转发 SOURCE_ONLY 与直接转介绍分离、P03-A16 接客池异常为空 owner_assignment_pending。


## 2026-09-24｜PDM-03 A15 客户分享归属规则反转

用户明确修正此前“普通客户车辆转发仅 SOURCE_ONLY”的方案：客户车源分享本身可以作为转介绍/获客归属链。对尚无正式 owner 的新客户 B，A 分享车源链接给 B，B 通过该链接进入后，按分享链实际绑定的销售建立 current owner，同时保留 A→B 的来源/推荐关系。A 转发张三链接则 B 归张三；转发李四链接则 B 归李四；A 使用自己的客户分享链接时，也保留 A 为来源客户/间接推荐人，并按该分享链对应销售归属 B。已有正式 owner 的老客户仍不得被分享链接抢走。

该裁决显式覆盖 P01-A04 中“普通客户侧车辆转发仅 SOURCE_ONLY、不据此分配 owner”的子句；P01-A04 其余自然注册/直接转介绍规则继续有效。

尚未裁决：A 发出链接后、B 打开前若 A 的 current owner 发生变化，旧链接的销售绑定时点。该项留 PDM-03 Batch 4。


## 2026-09-24｜PDM-03 Batch 3 完成

用户明确“十四十六都同意”，确认 P03-A14 与 P03-A16；P03-A15 已在前一轮按“客户分享即转介绍/获客归属链”主动修正并确认。至此 Batch 3 三项全部完成，状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 4 缺口扫描，共形成 P03-B4-01～P03-B4-04 四条待审项，重点关闭客户分享链销售绑定时点、A→B 关系留存、失效销售兜底、分享归属与自然轮询的并发顺序。


## 2026-09-24｜PDM-03 Batch 4 完成

用户明确“这个问题同意”，确认 P03-B4-01～P03-B4-04 四条冲突 / 缺口 / 新选择全部通过。至此 PDM-03 四批门禁全部完成。

已生成最终候选：

> `07_重建工作区/PDM-03_最终完整规则总览_待用户批准.md`

当前进入 `FINAL_REVIEW_PENDING`，未经用户最终批准不得将 PDM-03 标记 COMPLETE，也不得进入 PDM-04。


## 2026-09-24｜PDM-03 最终完成

用户最终明确批准 PDM-03《最终完整规则总览》。

- PDM-03 状态：`COMPLETE`
- 正式规则文件：`07_重建工作区/PDM-03_最终完整规则.md`
- 最终候选文件保留作为审计轨迹；
- 后续 PDM 不得静默改写 PDM-03，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-04｜三类车源 / JYT 同步 / 车辆身份 / Listing Cycle / 隐藏 / 下架 / 重上架 / 一键转名邦**


## 2026-09-24｜PDM-04 Batch 1 已形成

已严格按 GitHub 当前原始证据完成 PDM-04 稳定一致项筛选，共形成 P04-A01～P04-A14 十四条候选规则。

明确未混入本批的后续变化/冲突包括：人工名邦/4S source_type 双向修改、采集批发车自动隐藏、一键转名邦后的新名邦展示状态、一键转名邦具体 permission，以及图片/价格等跨域细节。

当前状态：`USER_REVIEW_BATCH_1_PENDING`。


## 2026-09-24｜PDM-04 Batch 1 完成

用户明确“全部都同意”，确认 P04-A01～P04-A14 十四条稳定一致项全部通过。Batch 1 状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 2 筛选，共形成 P04-B2-01～P04-B2-13 十三条明确废弃 / 替代 / DO_NOT_RESTORE 候选项，当前等待用户审查。


## 2026-09-24｜PDM-04 Batch 2 完成与转名邦模型反转

用户确认 Batch 2 其余项均无争议，并主动反转 B2-05：一键转名邦不再创建第二个 vehicle，而是在同一 vehicle_id 上完成批发→名邦来源转换；永久保留 JYT car_code / 来源历史，并阻止后续 JYT 同 car_code 重新生成批发在售。B2-06/B2-07 已按该模型同步修正。用户同时确认 locked 批发车可直接转名邦，Lock 保持绑定同一 vehicle_id。


## 2026-09-24｜PDM-04 Batch 3 已形成

P04-A15/A16 已由用户提前确认；新增四条待审：A17 source_type 名邦↔4S 后续修改、A18 采集批发自动隐藏、A19 转名邦后不走草稿二次发布、A20 一键转名邦不设额外独立 permission。listing_cycle、pre-conversion hidden、trading/completed 与 car_code 被上游复用冲突留 Batch 4。


## 2026-09-24｜PDM-04 Batch 3 完成

用户明确确认 A17～A20，其中 A18 按“每条自动隐藏规则独立；规则之间 OR；单条规则内不同字段 AND、同字段多个值 OR”的补充口径落版。加上此前已确认的 A15/A16，Batch 3 六项全部完成。

随后形成 Batch 4 五条待审：listing_cycle、hidden 原因继承、trading/completed 转换、car_code 复用冲突、conversion 单向性。


## 2026-09-24｜PDM-04 A18 适用车源范围扩展与 B4-02 完成

用户补充确认：自动/批量隐藏规则增加显式 `source_scope`，可多选批发、名邦、4S，至少选择一类；未选择不得生效，不默认影响三类全部车源。原“采集批发自动隐藏”继续作为 `source_scope=批发` 的一种配置。

车辆来源变化后，自动隐藏规则按新的 `source_type` 与各规则 `source_scope` 重新计算。由此 P04-B4-02 已正式关闭：仅适用于批发的自动隐藏原因在批发→名邦后失效；scope 含名邦且条件仍命中的规则继续 hidden；人工 hidden 与其他有效 hidden 原因继续保留。

当前 Batch 4 剩余待审：P04-B4-01、P04-B4-03、P04-B4-04、P04-B4-05。


## 2026-09-24｜PDM-04 Batch 4 完成与最终总览生成

用户最终完成 Batch 4 裁决：

- P04-B4-01：同 vehicle 批发→名邦继续当前 listing_cycle，不新建 cycle；
- P04-B4-02：此前已确认，按 source_type + source_scope 重算自动 hidden，人工 hidden 保留；
- P04-B4-03：locked / trading 允许同 vehicle 转名邦，completed 禁止；
- P04-B4-04：若已转名邦历史 car_code 后续出现明显不同实体身份，系统自动屏蔽/抑制该冲突上游记录，不进入人工决断，不创建新的可售批发 vehicle；
- P04-B4-05：批发→名邦为单向经营转换，不提供转回批发。

至此 PDM-04 四批用户审查全部完成。

已生成：

> `07_重建工作区/PDM-04_最终完整规则总览_待用户批准.md`

当前状态：`FINAL_REVIEW_PENDING`。未经用户最终批准，不得将 PDM-04 标记 COMPLETE，不得进入 PDM-05。


## 2026-09-24｜PDM-04 最终完成

用户最终明确批准 PDM-04《最终完整规则总览》。

- PDM-04 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-04_最终完整规则.md`；
- Decision Register 已登记 `PDM04-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-04，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-05｜车型主数据 / 年款 / JYT 车型映射 / MODEL_MISSING**


## 2026-09-24｜PDM-05 Batch 1 已形成

已严格按 GitHub 当前证据完成 PDM-05 稳定一致项筛选，形成 P05-A01～P05-A09 九条候选规则。存在知情修改、废弃项、IA Action Contract 冲突及历史细节遗漏的内容均未混入本批。

当前状态：`USER_REVIEW_BATCH_1_PENDING`。未经用户审查不得自动批准或进入 Batch 2。


## 2026-10-04｜PDM-08 最终完成

用户最终明确批准 PDM-08《最终完整规则总览》。

- PDM-08 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-08_最终完整规则.md`；
- IMG-001～IMG-030：30/30 已有明确去向；
- `SOURCE_DECISION_COVERAGE = 100%`；
- `UNMAPPED = 0`；
- Decision Register 已登记 `PDM08-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-08，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-09｜上游发布人电话 / publisher_id / 电话获取与缓存边界**


## 2026-10-04｜PDM-09 Batch 1 完成并进入 Batch 2

已严格按 GitHub 当前证据重新完成 PDM-09 Batch 1 审查，用户明确“全部同意”：

> **P09-A01～P09-A11，共 11 条。**

工作版：

> `07_重建工作区/PDM-09_上游发布人电话Collector缓存获取最新敏感能力_规则原子重建_工作版.md`

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

本批正式确认的核心边界包括：

- 电话按 `source_platform + upstream_publisher_id` 归属与缓存；
- 客户端 / 客户安全视图禁止展示上游电话；
- 电话为独立敏感能力；
- 唯一上游链为 Mingbang Backend → Collector → JYT；
- 有缓存时普通查看 / 拨打 cache-first，不重复请求上游；
- “获取最新电话”强制刷新，失败不覆盖旧缓存；
- phone history 只做历史 / 审计；
- 同 publisher latest single-flight，不同 publisher 可并发；
- 拨打只调系统拨号器，不新增独立 call permission；
- 电话敏感行为必须审计；
- 名邦 P03 只管理 Collector 连接，不管理 JYT 电话凭证 / Header / callCode。

当前进入：

> `PDM-09 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

未经用户确认不得自动进入 Batch 3。


## 2026-10-04｜PDM-09 Batch 2 已形成

经 CR-007、电话旧契约清理报告、R11/R12、Decision Register 与 001～078 复核，当前明确废弃 / 替代项共 3 组：

> **P09-B2-01～P09-B2-03**

分别为：

1. 禁止恢复 `car_code` / Vehicle 维度电话查询与缓存身份；
2. 禁止恢复名邦直连 JYT / 名邦管理 JYT 电话凭证与旧凭证 API；
3. 禁止新增独立 `can_call_wholesale_phone` 拨打权限。

当前状态：

> `PDM-09 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

真实冲突与证据缺口不混入本批。


## 2026-10-04｜PDM-09 Batch 2 完成

用户确认 P09-B2-01～P09-B2-03 全部通过。

其中 P09-B2-03 最终表述明确为：

> 有上游电话权限的员工，在自己有权访问的批发车源中，可以直接查看、获取最新电话并发起拨号；不再额外设置一个单独的“拨打电话权限”。

Batch 2 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-09 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / EVIDENCE_REVIEW`


## 2026-10-04｜PDM-09 Batch 3 证据筛选完成

经 9/20 IA ChangeLog、9/22 冻结台账、IA V5、实际 Low-Fi 与 001～078 复核：

> **Batch 3 无新的未审业务规则原子。**

电话状态页、latest 失败态、统一投影及 P03 页面均属于既有电话规则的 IA / Low-Fi 承载补全，不构成后续知情修改或新业务规则。

当前状态：

> `PDM-09 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / USER_REVIEW_PENDING_NO_NEW_ATOMS`

用户确认前不得进入 Batch 4。


## 2026-10-04｜PDM-09 Batch 3 完成并进入 Batch 4

用户明确确认 Batch 3“无新增原子”结论。

Batch 3 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-09 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / EVIDENCE_REVIEW`


## 2026-10-04｜PDM-09 Batch 4 已形成

经主底盘、CN11 前史、9/22、IA V5、实际 Low-Fi 与 001～078 反查，形成 6 条真正需要用户审查的冲突 / 遗漏 / 缺口：

> **P09-B4-01～P09-B4-06**

覆盖：

1. cache miss 拨打是否自动按需取号；
2. `expires_at` 是否阻断普通缓存；
3. 同步阶段是否禁止批量预取电话；
4. Collector 新配置测试失败后的激活 / 回滚；
5. P03-05 publisher 电话缓存页真实内容；
6. 上游电话是否提供复制动作。

当前状态：

> `PDM-09 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`


## 2026-10-04｜产品基线重建方法补强

用户批准新增全局硬规则：

> **先识别当前已实现 / 已测试事实，再执行原有 9/19 主底盘 + 前后历史反查 + 知情修改测试 + 四批用户裁决。**

新增要求：

- 已实现 / 已测试事实用于确定“当前系统实际上怎么跑”，但不自动成为产品权威；
- 当前实现与正式业务规则冲突时进入 `CURRENT_IMPLEMENTATION_CONFLICT`，不得模型自行覆盖；
- 涉及 API / Collector / 同步 / 鉴权时，必须先确认“谁提供 API、谁调用 API、数据流方向、当前版本、测试验收状态”；
- 历史“建议 / 推荐 / 候选 / 未施工”不得覆盖已验证当前实现；
- 当前 PDM-09 已发现电话 API 链存在旧方案污染迹象，继续 Batch 4 前必须对相关已确认项做显式复核，不静默改写。

当前 PDM-09 仍为 IN_PROGRESS。


## 2026-10-04｜PDM-09 当前实现事实卡完成

按新方法完成电话 API 架构复核。

当前事实：

- 名邦 Backend 提供 / 生成名邦 Integration API；
- Collector / 采集端配置并调用名邦 API，承担 JYT 采集与上游电话获取；
- 车辆数据和电话结果最终通过名邦既有回传体系进入名邦；
- 旧独立 Mingbang→Collector Phone API / Collector Base URL / Phone Path 方案属于历史中间方案或实现残留，不再自动视为当前产品规则。

因此回开：

- P09-A04 → P09-A04-R1
- P09-A11 → P09-A11-R1
- P09-B4-04 → 建议撤回

当前等待用户复审以上三项，Batch 4 其余候选暂不推进。


## 2026-10-04｜PDM-09 API 架构回开复核完成

用户明确“同意”，确认：

- P09-A04-R1：Collector / 采集端负责 JYT 取号，电话结果通过名邦 Backend 已有 Integration API / 回传体系返回名邦；
- P09-A11-R1：名邦 P03 撤销 Collector Base URL / Phone Path 产品配置，保留集成状态、缓存/历史、诊断、日志、审计；
- P09-B4-04-R1：原 B4-04 撤回，不再作为名邦产品规则。

P09-B2-02 的核心“名邦不直连 JYT / 不管理 JYT 电话凭证”继续有效；其旧网络方向文字由 A04-R1 替代。

当前 Batch 4 剩余待审：P09-B4-01、P09-B4-02、P09-B4-03、P09-B4-05、P09-B4-06。


## 2026-10-04｜PDM-09 Batch 4 完成

用户明确“全部同意”，一次性确认剩余：

- P09-B4-01：无缓存时按需取号，成功缓存后拨号；
- P09-B4-02：expires_at / freshness 不作为普通查看 / 拨打硬失效门槛；
- P09-B4-03：车源同步阶段不批量预取电话；
- P09-B4-05：P03-05 收口为 publisher 电话缓存管理 / 诊断页，不再承载 Collector URL / Phone Path；
- P09-B4-06：V1 不提供上游电话专门复制动作。

P09-B4-04 已在前轮确认撤回。

至此 PDM-09 Batch 1～4 用户审查全部完成。

当前下一步：

> **执行 PDM-09 全量 Decision Coverage / 未映射检查。**

PDM-09 尚未 FINAL APPROVED，不得标记 COMPLETE，不得进入 PDM-10。


## 2026-10-04｜PDM-09 全量覆盖校验完成

已完成 PDM-09 全量 Decision Coverage / 未映射检查。

结果：

- SOURCE_DECISION_COVERAGE = 100%（20/20）
- UNMAPPED = 0
- Batch 1～4 全部审查单元均有明确最终去向；
- 原 A04/A11/B2-02 的旧网络方向已由 A04-R1/A11-R1 正确替代；
- B4-04 已撤回且无孤儿产品 Decision；
- 当前 IA / Low-Fi 仍存在少量旧 Collector 电话连接 carrier，但均已有明确 supersede 去向，标记为 STALE_CARRIER，进入后续 IA / Engineering 整改，不阻塞 PDM-09 产品最终审批。

已生成：

- `07_重建工作区/PDM-09_全量DecisionCoverage未映射检查报告_2026-10-04.md`
- `07_重建工作区/PDM-09_最终完整规则总览_待用户批准.md`

当前状态：

> `PDM-09 / FINAL_REVIEW_PENDING`

未经用户最终批准，不得标记 PDM-09 COMPLETE，不得进入 PDM-10。


## 2026-10-04｜PDM-09 最终完成

用户最终明确确认 PDM-09《最终完整规则总览》。

- PDM-09 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-09_最终完整规则.md`；
- SOURCE_DECISION_COVERAGE = 100%（20/20）；
- UNMAPPED = 0；
- A04/A11 的旧 API 方向已由 A04-R1/A11-R1 正式替代；
- B4-04 已正式撤回；
- 旧 IA / Low-Fi Collector 电话连接 carrier 保留为后续对齐整改项，不属于未决产品规则；
- Decision Register 已登记 `PDM09-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-09，真实跨域冲突必须显式提交用户裁决。

当前进入准备：

> **PDM-10｜价格 / 查价 / 客户展示价覆盖**


## 2026-10-04｜PDM-10 Batch 1 已形成

已按冻结执行规范完成 PDM-10 前置证据扫描：

- 先识别当前已实现 / 已测试价格事实；
- 再读取 9/19 R4 / R11；
- 向前扫描 CN11 / 9/06 SSOT 与 Decision；
- 向后核对 9/22、IA V5、实际 Low-Fi、工程 Delta；
- 使用 001～078 M11 的 17 个归档单元做反向差集。

已形成：

> **P10-A01～P10-A12，共 12 条稳定一致候选。**

工作版：

> `07_重建工作区/PDM-10_价格查价客户展示价覆盖_规则原子重建_工作版.md`

已明确排除出 Batch 1 的包括：

- 加价 OFF 语义演进；
- 三类车源覆盖价范围演进；
- 内部价 permission 演进；
- 调价 permission 承载缺口；
- 临时追加查价次数历史遗漏；
- 排序 / 格式 / 低价警告等承载缺口；
- 同一 vehicle_id 一键转名邦后的价格继承冲突。

当前状态：

> `PDM-10 / BATCH_1_STABLE_CONSISTENT / USER_REVIEW_PENDING`

未经用户确认不得进入 Batch 2。


## 2026-10-04｜PDM-10 Batch 1 完成并进入 Batch 2

用户明确“全部同意”，确认 P10-A01～P10-A12 全部通过。

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

Decision Register 已登记 PDM10-DEC-A01～A12 与 PDM10-GATE-B1。

已继续完成 Batch 2 筛选，共形成：

> **P10-B2-01～P10-B2-12**

当前进入：

> `PDM-10 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

未经用户确认不得进入 Batch 3。


## 2026-10-04｜PDM-10 Batch 2 完成并进入 Batch 3

用户明确“全部同意”，确认 P10-B2-01～P10-B2-12 全部通过。

Batch 2 状态：

> `COMPLETE_USER_CONFIRMED`

Decision Register 已登记 PDM10-DEC-B2-01～B2-12 与 PDM10-GATE-B2。

经后续证据复核，Batch 3 不凑数量，只形成 3 条真正的知情修改 / 明确新增：

- P10-A13：加价关闭显示上游标价；
- P10-A14：覆盖价扩展到批发 / 名邦 / 4S；
- P10-A15：名邦内部价查看取消独立 permission 门槛。

当前进入：

> `PDM-10 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / USER_REVIEW_PENDING`

未经用户确认不得进入 Batch 4。


## 2026-10-04｜Batch 2/3 反向冲突门禁与 PDM-10 内部价权限纠正

用户批准将“Batch 2 / Batch 3 入批前反向冲突检查”写入全局执行规范与四批门禁。

本次触发问题：

- R4 存在内部价 permission + data scope 正式规则；
- R11 后来取消独立 permission；
- 已完成 PDM-02 最终规则已经由用户主动反转回“独立 permission”；
- IA V5 / 001～078 又记录反向承载与冲突；
- PDM-10 前一轮却误把 R11 当作最终演进，形成错误的 P10-B2-10 / P10-A15。

纠正结果：

- P10-B2-10：`REOPENED / INVALID_CLASSIFICATION`；
- P10-A15：`WITHDRAWN_FROM_BATCH_3 / RECLASSIFIED_TO_BATCH_4`；
- P10-A13、P10-A14：用户已确认；
- P10-B4-01：`USER_APPROVED`，内部价查看恢复/继承为后台可配置独立 permission；
- PDM-10 当前进入 `BATCH_4_EVIDENCE_REVIEW`。

本次未修改 R11 / IA / Low-Fi 历史证据原件。


## 2026-10-08｜Legacy Engineering Baseline 纳入规则

- 用户确认将 2026-09-17 CR007 历史工程资产作为后续工程复用底盘纳入当前仓库。
- 已建立：`09_历史工程资产基线/`。
- 该目录定位为 `Legacy Engineering Baseline`，不是 Current Product Authority，不改变 PDM-01～25 Final 的权威结论。
- Authority 顺序固定为：`PDM-01～25 Final → Current IA → Current Low-Fi → Current Engineering Baseline / Work Order → Legacy Engineering Baseline`。
- 后续工程施工前，旧工程资产必须经过 Engineering Delta，并按 `KEEP_DATA / KEEP_CANDIDATE_VERIFY / MODIFY_REQUIRED / ADD_REQUIRED / DEPRECATED_LOGIC_REFERENCE / REFERENCE_ONLY` 分类。
- 已冻结禁恢复项包括：旧 Mingbang→Collector Phone API 方向、旧 Collector Base URL / Phone Path 后台配置、旧 vehicles.biz_status 单一 Authority、旧锁车冲突不自动候补、旧草稿自动保存等。
- 采集 / Collector 程序本体为独立已运行系统，本项目不重写采集后台，只完成名邦侧 Integration API Contract 与联调。
- 当前产品阶段不因此前移：`PRODUCT_BASELINE = NOT_READY`。
- 当前唯一下一步保持：**IA 全局集中对齐**（`NEXT = IA_GLOBAL_ALIGNMENT`）。
- 说明：治理入口已纳入仓库；大体积 Legacy 工程资产本体需解压后置于 `09_历史工程资产基线/01_ENGINEERING_STARTER_LEGACY/`，不得只提交 ZIP。
