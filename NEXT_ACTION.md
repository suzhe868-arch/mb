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

# 2026-10-09｜F03-2-2A A独立验收已通过，GitHub合并入口暂阻断（当前最新）

- 用户单次明确批准本批，A已正式放行、B从含放行的main建立`feat/f03-governance-template-2a`并完成限定施工。
- 已验收B HEAD `da8a17ec5ce7e004ae158f3d3165469650c344c5`；同SHA [真实CI37948076366](https://github.com/suzhe868-arch/mb/actions/runs/37948076366)三个隔离PG16作业success，2A实际事务9/9、原F03-1认证11/11及HTTPS4/4通过。A已独立检查7新增路径、旧1179文件全部blob不变；签发见`07_重建工作区/F03-2-2A_A主控独立验收签发与真实CI证据_2026-10-09.md`。
- **合并状态：NOT_MERGED / PR_CREATE_TOOL_BLOCKED**。GitHub标准PR创建操作被工具安全检查拦截，未产生PR；不得通过直接变更main引用绕过约定的PR合并门禁，不能将本批报告为已合并。当前main只增加了放行与A独立验收文档。
- **当前唯一工程动作**：恢复可用的标准GitHub PR创建与合并能力后，对本已授权同批B固定HEAD复核并正常合并，无需用户再次批准；在接口无法使用期间不强行合并、不开始下一批。新施工批次仍须单独明确授权。
- C/H01独立视觉尚待验收；未访问正式业务/生产库，`PRODUCT_BASELINE=NOT_READY`。

---

# 2026-10-09｜当前唯一工程下一步（A已准备）

A已完成F03-2-2A下一批技术门禁、施工单及45项能力＋14类治理的承接矩阵，三份材料已提交main。当前未授权B施工，不开新工程分支。下一步仅需用户对`07_重建工作区/F03-2-2A_角色模板限定启用与原子历史审计施工单_待用户批准_2026-10-09.md`作一次施工确认。此确认同时包含该批A验收通过后的合并，不需重复批准。完整F03-2及C/H01未验收；PRODUCT_BASELINE=NOT_READY。

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

B当前无需重做已验收F03-G0；等待A/用户批准下一工作单后再开新分支。A已完成验收、合并和本工作单准备。

---

# HISTORICAL｜F03-G0施工时的下一步

- 用户于2026-10-09明确“同意放行”；A正式签发 `F03_G0_AUTHORIZED / USER_APPROVED / NOT_YET_IMPLEMENTED`。
- 正式放行单：`07_重建工作区/F03-G0_A主控正式施工放行_2026-10-09.md`；详细范围：`07_重建工作区/F03_开工门禁与分批施工建议_待用户批准_2026-10-09.md`（顶部放行增补为准）。
- **B当前任务**：从包含本次放行登记的最新main新建 `feat/f03-auth`，只施工F03-G0权限合同、身份会话合同、纯权限决策模块与假数据静态正反例；提交SHA、真实CI、规则覆盖表与风险交A验收。原 `feat/f02-schema` 保留。
- 本批不连接数据库，不做真实登录/微信接入、会话表迁移或F04业务API。F03-1/2/3、F02-2/3/4及其它后续正式施工仍未授权。
- F02-G0/F02-1已验收并合并，C/H01继续原独立视觉审查，不因本放行自动验收/合并或扩展折叠屏；产品Authority不变，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_G0_B_IMPLEMENTATION_A_REVIEW_AND_H01_VISUAL_REVIEW`。下面旧待批准状态是本次用户批准前的历史记录。

---

# HISTORICAL｜F03-G0待用户批准时的下一步

- **F02-G0/F02-1 = ACCEPTED / MERGED_TO_MAIN**。[PR #2](https://github.com/suzhe868-arch/mb/pull/2)已合并，merge SHA `3412dc76815e97a7df9024d8b7812a2aece7036c`；已验收B SHA `9f10f65be293fd892e4787a3a3bdff2676c487ea`。
- 合并记录：`07_重建工作区/F02-1_工程合并main与后续门禁记录_2026-10-09.md`；核对B 83个engineering/workflow blob一致、main原有979文件全部保留。63新增文件，无产品Authority改写。
- 真实F02 CI证据来自已验收B SHA，不将其写成合并后main独立回归；本次没有重跑数据库测试。
- **当前唯一工程下一步：用户审查并决定是否批准F03-G0限定首批。** 工作单：`07_重建工作区/F03_开工门禁与分批施工建议_待用户批准_2026-10-09.md`；只准备门禁，B当前暂不施工，F03-1及其余批次另行放行。
- C/H01独立视觉复核继续，未最终验收；F02-2/3/4、F04及其他正式施工、业务/已迁/生产库、C合并仍未授权；不增加折叠屏专项，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_G0_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`。以下较早“当前/最新”均为历史过程。

建议批准的范围：仅F03-G0权限词典/身份会话合同/纯服务端决策层与假数据静态核验；不放行真实登录、会话表迁移或F04业务API。获批后B从包含本门禁的最新main新建feat/f03-auth，旧B分支保留。

---

# HISTORICAL｜2026-10-09 F02-1验收登记时的下一步

## F02-1已验收；后续工程门禁等待用户批准

- **A 正式签发：`F02_1_ACCEPTED / A_SIGNED / USER_APPROVED`**。验收 B `feat/f02-schema` 精确 SHA `9f10f65be293fd892e4787a3a3bdff2676c487ea`；[F02-1 CI 37843224982](https://github.com/suzhe868-arch/mb/actions/runs/37843224982) 与 [G0 CI 37843225062](https://github.com/suzhe868-arch/mb/actions/runs/37843225062) 同一 SHA、completed/success。
- 正式签发与风险记录：`07_重建工作区/F02-1_A主控最终验收签发与残余风险_2026-10-09.md`。独立核验实际工件：76业务表、464字段、160外键、28额外唯一索引、39 CHECK、5历史触发器；5/5非表对象拒绝、32项fixture、事务失败回滚、1 applied +3 idempotent并发及结构漂移负例通过。
- **本次仅将 A 验收与状态登记 main；B 工程代码仍在 B 分支，未合并。** main 没有因此获得 F02-1 工程实现；上述运行证据来自已验收 B SHA，不是 main 业务/部署测试。
- 当前工程下一步：A 提交已验收工程合并及下一阶段门禁建议，等待用户另行批准；B 本阶段结束，暂不启动新施工。C/H01 独立视觉复核继续，未最终验收，暂不增加折叠屏专项。
- F02-2/3/4、F03/F04正式施工、B/C合并main、业务/已迁/生产库访问仍未授权；PDM Final / Current IA / Current Low-Fi 不变，`PRODUCT_BASELINE=NOT_READY`。
- 唯一现行指针：`F02_1_ACCEPTED_A_NEXT_GATE_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`。以下历史“当前/最新”描述不覆盖本节。

### 下一阶段建议与必须具备的门禁（建议，不是施工授权）

1. 先单独审核并申请将已验收 B 提交纳入 main：确认只包含获验收的 G0/F02-1工程文件，保留main最新治理资料，处理冲突并确定合并后的回归验证范围；本次不执行合并。
2. F03身份与动态权限可作为下一张独立开工门禁建议：逐项引用PDM Final、落实hard DENY/身份隔离/范围与审计、列出静态Schema未覆盖的运行期守卫、隔离环境、假数据正反例和批次验收标准；正式代码施工须用户批准独立工作单。
3. F02-2无获批历史库快照/版本证据，继续UNKNOWN/NO_OPERATION；F02-3仅可提出CSV只读核验/staging方案，正式导入不授权；F02-4与F04需先核对各自合同和依赖，不借本次验收自动开工。
4. C/H01沿原独立视觉审查推进；H02/H03不因工程验收自动放行。

B无需重做本阶段已通过的整改，当前等待A/用户下一阶段明确指令。

---

# HISTORICAL｜名邦汽车 V1 下一步快照｜2026-10-08

## HISTORICAL｜F02-1获准隔离施工时的下一步

- **A 正式签发：`G0_ACCEPTED / A_SIGNED`**。用户明确同意；验收依据 `07_重建工作区/F02-G0_A主控最终验收签发与F02-1隔离施工放行_2026-10-08.md`、B `feat/f02-schema` HEAD `f2cdb0e8c7967aeaa8cfea5c6b466c9b45a68946`、[真实 CI #37722491859](https://github.com/suzhe868-arch/mb/actions/runs/37722491859)（90/90 PASS）。
- 现行 F02-G0 模型合同：510 条候选字段，其中 `464 INCLUDE / 33 DEFER / 13 EXCLUDE`；76 个拟建最小实体、137 条显式静态 FK。PC 登录凭证唯一权威在 `pc_login_accounts`；原管理员两套重复凭证字段保留编号并排除建表。
- **B 当前工程任务**：按 `07_重建工作区/F02_正式施工单_数据库模型与隔离开发_2026-10-08.md` §2 在**原工程分支** `feat/f02-schema` 实施 F02-1：全新一次性隔离 PostgreSQL 16 空库建表/迁移、真实约束与安全门禁、重复/失败恢复/并发测试和 schema dump；提交 SHA、执行命令、真实测试日志、残余风险交 A 独立验收。
- **禁越界**：不合并 main，不访问真实已迁/生产数据库，不使用旧危险迁移；F02-2/3/4、F03/F04 业务施工未自动授权。F02-1 `AUTHORIZED_FOR_ISOLATED_IMPLEMENTATION / NOT_RUN`，须 A 以后另行验收；G0 静态 PASS 不等于物理建表 PASS。
- **C/H01**：独立对照用户视觉参考返修验收；不因 F02-G0 放行 H02，不增加折叠屏专项范围。全项目 `PRODUCT_BASELINE=NOT_READY`。
- **全局唯一下一步**：`F02_1_ISOLATED_CURRENT_SCHEMA_B_IMPLEMENTATION_A_REVIEW_AND_H01_VISUAL_REVIEW`。下面旧“当前/最新”工作焦点全部属于历史背景，以上为唯一现行指针。

---


## HISTORICAL｜F02-G0 四域物理承载范围一致性补审（此前阶段）

- 用户明确“同意，确定执行”，批准 A 主控将四项范围一致性发现落实为正式补审单：`07_重建工作区/F02-G0_A主控范围一致性定向补审单_SystemAdmin_匹配_CRM_公海_2026-10-08.md`。B 分支 `feat/f02-schema` 上次 A 核验 HEAD `ea14fb372a6ab598177d1a8a067e2b1df3ebf480`，GitHub CI [37712078050](https://github.com/suzhe868-arch/mb/actions/runs/37712078050) 成功。
- **已闭环**：F02-G0 环境与静态安全测试、G0-CL-01 外键依赖、G0-CL-02 最小完整实体结构；413 字段、53 拟建实体、96 显式静态 FK 的 A 独立核验通过，本次不得无故重做。
- **B 当前唯一工程任务**：核实整表延期的 `system_admins`、`demand_match_results`、`crm_followups`、`public_pool_events` 是否完整覆盖 F02-1 正式施工单要求；逐事实提供具体拟施工实体/字段、历史和身份约束、最小补纳或合法延期理由及对应自动负例。若无法闭合，精确标 `BLOCKED` 交 A 技术裁定；不可将笼统“以后做”充当范围裁定。只在 `feat/f02-schema` 提交和测试。
- 当前门禁：`G0_ENVIRONMENT_PASS / G0_CL01_CL02_PASS / G0_SCOPE_COVERAGE_PENDING / G0_MODEL_FREEZE_PENDING / G0_ACCEPTED=NO`。F02-1 尚未启动（此前只是通过 G0 后的条件授权），F02-2/3/4、F03/F04、真实业务库、main 合并继续禁止。
- C/H01 仍独立视觉整改，不启动 H02。**全局唯一下一步**：`F02_G0_FOUR_DOMAIN_SCOPE_MAPPING_B_EXECUTION_A_REVIEW_AND_H01_VISUAL_REVIEW`。以下较早焦点和指针为历史施工背景，以本节为准。

---

## 当前执行焦点｜F02-G0 最终门禁定向整改（2026-10-08，用户确认执行）

- **用户“同意，确定执行”后 A 已签发**：`07_重建工作区/F02-G0_A主控最终门禁整改单_外键闭合与实体完整性_2026-10-08.md`。A 独立审查 B 分支 `feat/f02-schema` HEAD `95fb1776eec535fb4e83b48d292034dfcb49c8fb`，CI `37710259345` 成功，确认 413 字段候选/30 项 G0 单测及 PG16 隔离边界；但发现拟施工外键指向延期目标、局部实体缺主键/基础依赖两类未闭合缺口。
- **B 当前唯一工程动作**：继续在 `feat/f02-schema` 对 `G0-CL-01 外键依赖闭合` 和 `G0-CL-02 最小可实施实体闭合` 做**定向修正与新增正反例**，提交 SHA、字段纳入/延期矩阵、真实 CI 与残余风险交 A 复审。不得重做五项已批准的领域设计或擅改上层 PDM/IA/Low-Fi。
- **门禁状态**：`G0_ENVIRONMENT_PASS / G0_MODEL_FREEZE_PENDING / G0_CHANGE_REQUEST_USER_APPROVED / G0_ACCEPTED=NO`。F02-1 只在 A 以后另行**签发 G0_ACCEPTED** 时按原条件授权开始一次性 PG16 空库开发；F02-2/3/4、F03/F04、真实库和 main 合并继续冻结。
- **C/H01**：继续独立视觉返修与 A 审查，不随 B 的 G0 校验自动放行 H02。
- **当前唯一全局指针**：`F02_G0_CLOSURE_CORRECTION_B_EXECUTE_A_REVIEW_AND_H01_VISUAL_REVIEW`；下方原“最新执行焦点”是上一阶段已授权的施工背景，本节优先。

---

## 最新执行焦点｜F02-G0 / 条件 F02-1（2026-10-08）

- 2026-10-08 用户明确“确认执行”：A 审核 F02 开工门禁，批准将 B 三份交接报告与 A 正式施工单、技术裁定落库，从最新 main 建 `feat/f02-schema`；**现在放行 F02-G0 隔离环境和逐字段基线工作，只有 G0 经过 A 验收后才能执行 F02-1 独立 PG16 空库 Schema 开发/测试**。
- 唯一最新工作单：`07_重建工作区/F02_正式施工单_数据库模型与隔离开发_2026-10-08.md`；A 技术裁定：`07_重建工作区/F02_主控技术裁定与开工门禁_2026-10-08.md`。三份 B 门禁报告原文已登记 main 的 `07_重建工作区/工程执行回报/`；旧 `feat/f01-foundation` 分支保留不重置、不继续施工。
- F02-2 真实已迁库兼容升级、F02-3 正式种子导入、F02-4 跨域施工，及 F03/F04 代码/真实生产数据库/历史清库/合并 main **均未授权**。F01 数据库探针安全 Guard 不得放松，PG16 测试库与 F01 探针库严格分离。
- C/H01 设计修订和用户“汽车品牌展厅”视觉讨论继续独立；本次不修改/合并 C，不启动 H02/H03，不改变 PDM Final、Current IA、Current Low-Fi。
- F01 已验收并合并；F02 实施和业务 Schema 测试目前仍 `NOT_RUN`；整个 V1 `PRODUCT_BASELINE=NOT_READY`。
- **当前唯一执行指针**：`F02_G0_THEN_F02_1_ISOLATED_H01_REVIEW`。

---


## HISTORICAL｜F01 验收后旧执行指针（已由 F02-G0 授权替代）

- **工程 F01：ACCEPTED / MERGED_TO_MAIN**。A 主控已核验 B 基础工程施工、真实 PostgreSQL 16 连接/断库/恢复与 CI，用户明确“确认执行”后完成 [PR #1](https://github.com/suzhe868-arch/mb/pull/1) 合并；验收细节、真实 CI 范围及残余风险见 `07_重建工作区/F01_工程基础验收与合并记录_2026-10-08.md`。
- **当前业务与工程并未整体完成**：`PRODUCT_BASELINE=NOT_READY`。218 个历史接口只有归属审计，不是已实现接口；F02/F03/F04/F05/F06/F07/F08 均 **NOT_STARTED/NOT_AUTHORIZED_FOR_CONSTRUCTION**。F01 仅说明基础工程工作单可验收。
- **C 设计当前下一步**：在 `design/h01-design-system` 完成 H01 局部返修与 A 审核，和用户讨论并确认核心汽车品牌展厅风格/品牌正式资产；未经确认不得宣告 H01 最终视觉通过，不得批量施工 H02/H03。
- **B 工程当前下一步**：F01 已结束；读取当前施工单与 F01 遗留风险，准备 `F02 数据库/增量迁移`、`F03 身份权限`、`F04 API/架构` 的**独立开工门禁与非破坏性技术方案**，提交 A 核验。正式迁移、权限或接口业务代码施工必须获得各自阶段独立授权，不能因为路线图或 F01 验收而启动。
- **A 主控工作**：核对 H01 审查与视觉决策、规划 F02/F03/F04 依赖与各阶段授权、跟踪 F01 Node ESM/TypeScript 选型风险；不直接合并 C、不改 PDM/IA/Low-Fi。
- **当前唯一执行指针**：`F01_ACCEPTED_H01_REVIEW_ENGINEERING_NEXT_GATE`。这组后续动作包含 H01 设计复核与工程下一阶段**门禁准备**，不是批准多张正式施工单。
- 本次 F01 合并后的 main 本身尚无新的独立 CI 运行日志：成功测试发生于 B 工程分支 [CI 37695813678](https://github.com/suzhe868-arch/mb/actions/runs/37695813678)，不应误写成“main 部署测试成功”。

---


## HISTORICAL｜A/B/C 三窗口建立时的执行口径（F01 已完成，以下旧指针不得复用）

- 用户已批准在 main 一次性建立三窗口协作机制和 B/C 完整路线图；**这是规划与接力文档落库，不表示 F01/H01 已经完成，也不表示所有 F/H 阶段获得施工许可**。
- A 主控执行入口：`07_重建工作区/A_B_C三窗口协作与验收规范.md`。
- B 执行入口：`07_重建工作区/B工程完整施工路线图_F01至F08.md`；指定分支 `feat/f01-foundation`。当前按本窗口获批范围从 F01 开始；每个批次提交真实代码/日志/SHA 给 A 验收，F02～F08 仍分别门禁放行。
- C 执行入口：`07_重建工作区/C设计完整执行路线图_H01至H04.md`；指定分支 `design/h01-design-system`。当前按本窗口获批范围从 H01 开始，关键视觉方向和 H02 批次由用户审查，正式前端 H03 待“High-Fi 确认一批→开发一批”。
- B/C 须显式**从 main 读取这些新文档**，因为各自当前施工分支可能尚未包含最新治理提交；在自己的分支继续工作，不擅自更新 main、重置分支或合并。
- B/C 过程回报先写各自分支，A 可读 GitHub 分支直接验收；如发生新产品冲突仅暂停受影响项，留证并转用户裁决。
- 唯一下一组任务不变：**F01 + H01 双轨**；工程和高保真均未按本次治理动作宣告施工完成，产品总基线仍为 `NOT_READY`。

## HISTORICAL｜Engineering Startup Gate｜PASS / USER_APPROVED / APPLIED（F01 开工前快照）

- 门禁已通过：`PASS`（只针对旧资产分类、风险、施工单/验收标准和开工资格，不证明实际功能实现）。
- **唯一并行下一组任务：`F01｜工程基础环境与骨架` + `H01｜Design System / 核心模板`**。
- 工程：`FOUNDATION_READY / NO_CONSTRUCTION`；高保真：`READY_TO_START / NOT_STARTED`；产品总基线：`NOT_READY`。
- 主控必须先读：三份门禁文档 → PDM-01～25 Final → Current IA → Current Low-Fi；旧工程与 9/22 Delta 均为 INPUT_ONLY。
- F01 建可运行工程骨架、依赖/预检、健康检查、隔离数据库安全基线；H01 做统一设计规范和核心模板；双方可并行。
- F02/F03/F04 的设计准备可并行，但禁止在没有对应施工单执行批准与环境核验时运行迁移或修改正式业务代码。
- 正式前端：**High-Fi 确认一批 → Frontend 只开发该批**；不要求所有 Low-Fi 图片逐张确认。
- 用户对新产品裁决、关键视觉方向、真实账号/环境、UAT/上线保持批准权；技术细节可按已冻结规则实施并审计。
- 不得恢复：旧 Collector 电话 API 方向和电话连接配置、单草稿索引、旧 Refund 两态、旧锁车冲突不候补、其他与 PDM Final 冲突项。
- **本次门禁提交未执行代码、数据库、测试、页面施工。**

## 当前工作载体

- `07_重建工作区/工程启动门禁_历史工程复用与差异台账_2026-10-08.md`
- `07_重建工作区/工程启动门禁_工程基础施工单与验收标准_2026-10-08.md`
- `07_重建工作区/工程启动门禁_最终审查报告_2026-10-08.md`
- 仓库控制入口：README、CURRENT_PROJECT_STATE、NEXT_ACTION、PROJECT_STATE.json、DECISION_REGISTER。

---

# 历史阶段记录｜先前的“当前唯一下一步”仅作历史，不再作为执行指针

## HISTORICAL｜Engineering Startup Gate 曾为 READY（已被 Gate PASS 替代）

- 当前唯一动作：Engineering Startup Gate｜工程启动门禁
- Engineering：STARTUP_GATE_READY / NO_CONSTRUCTION
- High-Fi / Design System：PLANNED_AFTER_GATE / NOT_STARTED
- Startup Gate 只做审计、对齐、分类和施工单，不直接施工
- Current Authority：PDM-01～25 Final → Current IA → Current Low-Fi
- 9/22 Engineering Delta / Legacy Engineering：INPUT_ONLY，必须重验
- Gate PASS 后双轨：Engineering Foundation + High-Fi / Design System
- 正式前端：High-Fi 确认一批 → Frontend 放行一批

## Low-Fi Global Alignment｜COMPLETE

- LF-B1-01～LF-B1-07：PASS / USER_APPROVED / APPLIED
- LF-B2-01～LF-B2-07：PASS / USER_APPROVED / APPLIED
- LF-B3-01～LF-B3-04：PASS / USER_APPROVED / APPLIED
- LF-B4-01：PASS / USER_APPROVED / APPLIED
- Low-Fi：COMPLETE / FINAL_GAP_PASS
- FINAL_GAP_SCAN：PASS
- LOW_FI_BUSINESS_CONFLICT：0
- LOW_FI_VALID_MISSING_CARRIER：0
- LOW_FI_DANGLING_NAV_TARGET：0
- LOW_FI_MISSING_PHYSICAL_ASSET：0
- LOW_FI_STATE_ASSET_GAP：0
- LOW_FI_INCOMPLETE_PAGE：0
- Retired Low-Fi SVG / retained historical assets：26
- IA：COMPLETE / FINAL_GAP_PASS
- Engineering：READY_TO_START / NO_CONSTRUCTION
- Product Baseline：NOT_READY

# HISTORICAL｜旧版名邦汽车 V1 下一步唯一动作记录

> 更新时间：2026-10-08

## HISTORICAL｜当时记录的当前唯一动作

- 当前阶段：`ENGINEERING_STARTUP_GATE_READY`
- 当前唯一下一步：**Engineering Startup Gate｜工程启动门禁**
- 上层 Authority：`PDM-01～25 Final + Current IA + Current Low-Fi`
- `LF-B1-01～LF-B1-07 = PASS / USER_APPROVED / APPLIED`
- `LF-B2-01～LF-B2-07 = PASS / USER_APPROVED / APPLIED`
- `LF-B3-01～LF-B3-04 = PASS / USER_APPROVED / APPLIED`
- `LF-B4-01 = PASS / USER_APPROVED / APPLIED`
- `Low-Fi = COMPLETE / FINAL_GAP_PASS`
- `FINAL_GAP_SCAN = PASS`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- Engineering 施工必须读取 PDM Final + Current IA + Current Low-Fi；不得反向改写产品 Authority
- Engineering：`STARTUP_GATE_READY / NO_CONSTRUCTION`
- 当前 Gate 输入：`05_证据_E_工程总闭环待执行Delta/工程总闭环待执行Delta清单.md`
- Gate 期间：`NO_CONSTRUCTION`，只做旧工程 / Schema / API / Permission / Test / Delta 盘点、Current Authority 对齐与施工分类
- Gate PASS 后：`Engineering Foundation + High-Fi / Design System` 双轨并行
- 前端放行规则：`High-Fi 确认一批 → Frontend 开发一批`
- High-Fi / Design System：`PLANNED_AFTER_GATE / NOT_STARTED`

## HISTORICAL_AUDIT_TRAIL｜以下为历史执行记录

## PDM-25 Prefinal R2 执行结果

- P25-LIA-01～P25-LIA-03：PASS / USER_APPROVED / APPLIED
- R1 Repair Closed：3 / 3
- PDM-25 信息保真检查卡：CREATED / COMPLETE
- Source → Atom：PASS
- Atom → Source：PASS
- SOURCE_DECISION_COVERAGE：100%
- UNMAPPED：0
- FINAL_TO_SOURCE_TRACEABILITY：100%
- SEMANTIC_COMPLETENESS：PASS
- NEGATIVE_CLAIMS_VERIFIED：PASS
- IMPLEMENTATION_READY：PASS
- PDM25_FORMAL_UNITS：37
- PDM25_FINAL_CANDIDATE_READY：YES
- Incoming Handoff Landing：24 / 24 PASS
- Incoming Handoff Status：24 / 24 HANDOFF_ACCEPTED（最终批准前不关闭 / 不 source backwrite）
- Final Overview：`07_重建工作区/PDM-25_最终完整规则总览_待用户批准.md` / FINAL_REVIEW_PENDING
- IA / Low-Fi / Engineering：NO_CONSTRUCTION

## PDM-25 Batch 4 执行结果

- P25-B4-01～P25-B4-04：PASS / USER_APPROVED / APPLIED
- CHOICES：1A / 2A / 3A / 4A
- Final-gap Scan：PASS
- COMPLETED_PDM_HARD_CONFLICT：0
- SEMANTIC_DETAIL_GAP_UNRESOLVED：0
- LOCAL_PRODUCT_CHOICE_UNRESOLVED：0
- INCOMING_HANDOFF_GAP：0
- PDM-25 incoming handoffs：24 / 24 HANDOFF_ACCEPTED（Final Closeout 前不关闭）
- IA / Low-Fi / Engineering：NO_CONSTRUCTION
- Prefinal Integrity：PENDING

## PDM-25 Batch 3 执行结果

- P25-B3-01～P25-B3-04：PASS / USER_APPROVED / APPLIED
- Conflict Isolation：PASS
- MISCLASSIFIED_PRODUCT_CHOICE：0
- DUPLICATE_RULE_CREATION：0
- NEW_BUSINESS_STATE_MACHINE：0
- COMPLETED_PDM_HARD_CONFLICT：0
- INCOMING_HANDOFF_GAP：0
- LOCAL_PRODUCT_CHOICE_UNRESOLVED：0
- PDM-25 incoming handoffs：24 / 24 HANDOFF_ACCEPTED（Final Closeout 前不关闭）
- IA / Low-Fi / Engineering：NO_CONSTRUCTION
- Batch 4：Final-gap Scan（冲突 / 遗漏 / 缺口 / 新选择）/ PENDING_USER_REVIEW

## PDM-25 Batch 2 执行结果

- P25-B2-01～P25-B2-08：PASS / USER_APPROVED / APPLIED
- Reverse Conflict Scan：PASS
- FALSE_DEPRECATION_COUNT：0
- COMPLETED_PDM_HARD_CONFLICT：0
- INCOMING_HANDOFF_GAP：0
- LOCAL_PRODUCT_CHOICE_UNRESOLVED：0
- PDM-25 incoming handoffs：24 / 24 HANDOFF_ACCEPTED（Final Closeout 前不关闭）
- IA / Low-Fi / Engineering：NO_CONSTRUCTION
- Batch 3：明确知情修改 / 后续明确新增 / PENDING_USER_REVIEW

## PDM-25 Batch 1 执行结果

- P25-A01～P25-A17：PASS / USER_APPROVED / APPLIED
- Batch 1 confirmed count：17
- COMPLETED_PDM_HARD_CONFLICT：0
- INCOMING_HANDOFF_GAP：0
- GLOBAL_INVARIANT_CONFLICT：0
- LOCAL_PRODUCT_CHOICE_UNRESOLVED：0
- PDM-25 incoming handoffs：24 / 24 HANDOFF_ACCEPTED（Final Closeout 前不关闭）
- IA / Low-Fi / Engineering：NO_CONSTRUCTION
- Batch 2：明确废弃 / 已覆盖 / 不得恢复 / PENDING_USER_REVIEW

## PDM-25 Startup Gate 结果

- P25-R00：USER_APPROVED / APPLIED
- Startup Gate：PASS
- Workfile：07_重建工作区/PDM-25_审计历史时区配置版本终态与横切完整性_规则原子重建_工作版.md
- Incoming handoffs：24 / 24 HANDOFF_ACCEPTED
- INCOMING_HANDOFF_GAP：0
- COMPLETED_PDM_HARD_CONFLICT：0
- GLOBAL_INVARIANT_CONFLICT：0
- LOCAL_PRODUCT_CHOICE_UNRESOLVED：0
- IA / Low-Fi / Engineering：NO_CONSTRUCTION


## PDM-24 Final Closeout 结果

- PDM-24：COMPLETE / INTEGRITY_PASS
- Final Overview：07_重建工作区/PDM-24_最终完整规则总览_待用户批准.md / USER_FINAL_APPROVED
- Final：07_重建工作区/PDM-24_最终完整规则.md
- Final Integrity：07_重建工作区/PDM-24_最终完整性复核_2026-10-07.md / PASS
- Formal Units：40
- HO-P20-P24-001：HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE
- HO-P24-P25-001：HANDOFF_OPEN
- PDM-25 incoming handoffs：24 / 24 PENDING_STARTUP_GATE_ACCEPTANCE
- IA / Low-Fi / Engineering：NO_CONSTRUCTION

## PDM-24 Prefinal R2 结果

- Prefinal R2：PASS / FINAL_CANDIDATE_READY
- R2 报告：07_重建工作区/PDM-24_Final前完整性复核_R2_2026-10-07.md
- Formal Units：40
- MISSING_RULE_UNRESOLVED：0
- SEMANTIC_DETAIL_GAP_UNRESOLVED：0
- COMPLETED_PDM_HARD_CONFLICT：0
- INCOMING_HANDOFF_GAP：0
- OUTGOING_HANDOFF_GAP：0
- LOCAL_PRODUCT_CHOICE_UNRESOLVED：0
- HO-P20-P24-001：HANDOFF_ACCEPTED
- HO-P24-P25-001：HANDOFF_OPEN
- IA / Low-Fi / Engineering：NO_CONSTRUCTION


## PDM-24 Prefinal R1 修复结果

- Prefinal R1：REPAIR_REQUIRED / NO_HARD_CONFLICT
- R1 报告：07_重建工作区/PDM-24_Final前完整性复核_R1_2026-10-07.md
- P24-LIA-01～P24-LIA-04：PASS / USER_APPROVED / APPLIED
- P24-LIA-03：CHOICE_3A
- LOCAL_PRODUCT_CHOICE_UNRESOLVED：0
- HO-P20-P24-001：HANDOFF_ACCEPTED
- HO-P24-P25-001：HANDOFF_OPEN
- IA / Low-Fi / Engineering：NO_CONSTRUCTION
- Prefinal R2：PENDING


## PDM-24 Batch 4 执行结果

- P24-B4-01～P24-B4-07：PASS / USER_APPROVED / APPLIED
- B4-01：USER_REVISED（有效周期 + 自动弹出开关 + 每客户每天全局最多1条主动公告）
- B4-02：CHOICE_2A
- B4-05：CHOICE_5A
- LOCAL_PRODUCT_CHOICE_UNRESOLVED：0
- HO-P20-P24-001：HANDOFF_ACCEPTED（Final Closeout 前不关闭）
- HO-P24-P25-001：HANDOFF_OPEN
- IA / Low-Fi / Engineering：NO_CONSTRUCTION

## PDM-24 Batch 3 执行结果

- Batch 3：NO_NEW_ATOMS / PASS / USER_APPROVED / APPLIED
- Conflict Isolation：PASS
- NEW_INDEPENDENT_ATOMS：0
- MISCLASSIFIED_PRODUCT_CHOICE：0
- 窗口交接：07_重建工作区/PDM-24_窗口切换交接_2026-10-07.md
- HO-P20-P24-001：HANDOFF_ACCEPTED
- IA / Low-Fi / Engineering：NO_CONSTRUCTION

## PDM-24 Batch 2 执行结果

- P24-B2-01～P24-B2-12：PASS / USER_APPROVED / APPLIED
- Reverse Conflict Scan：PASS / FALSE_DEPRECATION_COUNT=0
- Batch 3：NO_NEW_ATOMS / PENDING_USER_REVIEW
- NEW_INDEPENDENT_ATOMS：0
- DUPLICATE_RULE_CREATION：0
- MISCLASSIFIED_PRODUCT_CHOICE：0
- HO-P20-P24-001：HANDOFF_ACCEPTED
- IA / Low-Fi / Engineering：NO_CONSTRUCTION

## PDM-24 Batch 1 执行结果

- P24-A01～P24-A15：PASS / USER_APPROVED / APPLIED
- Reverse Conflict Scan：PASS / FALSE_DEPRECATION_COUNT=0
- Batch 2：P24-B2-01～P24-B2-12 / PENDING_USER_REVIEW
- HO-P20-P24-001：HANDOFF_ACCEPTED
- IA / Low-Fi / Engineering：NO_CONSTRUCTION

## PDM-24 Startup Gate 结果

- Startup Gate：PASS
- P24-R00：USER_APPROVED / APPLIED
- P24-R01：USER_APPROVED / APPLIED
- VEHICLE_DETAIL：车辆详情页固定广告位能力
- HO-P20-P24-001：HANDOFF_ACCEPTED
- Batch 1：P24-A01～P24-A15 / PENDING_USER_REVIEW
- IA / Low-Fi / Engineering：NO_CONSTRUCTION

## PDM-24 当前门禁

- PDM-23：COMPLETE / INTEGRITY_PASS
- PDM-23 Final：07_重建工作区/PDM-23_最终完整规则.md
- PDM-23 Final Integrity：07_重建工作区/PDM-23_最终完整性复核_2026-10-07.md / PASS
- PDM-23 10/10 incoming handoff：HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE
- HO-P23-P25-001：HANDOFF_OPEN
- PDM-20→PDM-24：HO-P20-P24-001 / HANDOFF_ACCEPTED
- IA / Low-Fi / Engineering：NO_CONSTRUCTION

## PDM-23 当前门禁

- Prefinal R1：REPAIR_REQUIRED / NO_HARD_CONFLICT
- P23-LIA-01～P23-LIA-04：PASS / USER_APPROVED / APPLIED
- Prefinal R2：PASS / FINAL_CANDIDATE_READY
- Formal Units：65
- Final Overview：07_重建工作区/PDM-23_最终完整规则总览_待用户批准.md
- 10/10 incoming handoff：HANDOFF_ACCEPTED
- HO-P23-P25-001：HANDOFF_OPEN
- IA / Low-Fi / Engineering：NO_CONSTRUCTION

## 当前状态

- PDM-01 ～ PDM-10 = COMPLETE（历史裁决完成状态）
- PDM-01 ～ PDM-10 Legacy Final Integrity Audit = COMPLETE
- PDM-01 Integrity Audit = INTEGRITY_PASS
- PDM-02 Integrity Audit = INTEGRITY_PASS
- PDM-03 Integrity Audit = INTEGRITY_PASS
- PDM-04 Integrity Audit = INTEGRITY_PASS
- PDM-05 Integrity Audit = INTEGRITY_PASS
- PDM-06 Integrity Audit = INTEGRITY_PASS
- PDM-07 Integrity Audit = INTEGRITY_PASS
- PDM-08 Integrity Audit = INTEGRITY_PASS
- PDM-09 Integrity Audit = INTEGRITY_PASS
- PDM-10 Integrity Audit = INTEGRITY_PASS
- PDM-01～10 Global Cross-PDM / Handoff / Global Invariant Audit = PASS
- 当前域：PDM-24（Startup Gate / Batch 1～4 = PASS / USER_APPROVED / APPLIED；Prefinal R2 = PASS / FINAL_CANDIDATE_READY；等待 Final Domain Overview 用户最终批准；PDM-23 已 COMPLETE / INTEGRITY_PASS）
- PDM-20 = COMPLETE / INTEGRITY_PASS
- PDM-21 Startup Gate = PASS
- PDM-21 核心定位 P21-R00 = USER_APPROVED / APPLIED
- PDM-21 incoming handoffs = 19 / 19 HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE
- PDM-21 工作版 = `07_重建工作区/PDM-21_员工工作台车辆列表客户中心内部模式敏感动作裁剪_规则原子重建_工作版.md`
- PDM-21 Batch 1 = P21-A01～P21-A20 / PASS / USER_APPROVED / APPLIED
- PDM-21 Batch 2 = P21-B2-01～P21-B2-09 / PASS / USER_APPROVED / APPLIED
- PDM-21 Batch 3 = P21-B3-01～P21-B3-10 / PASS / USER_APPROVED / APPLIED
- PDM-21 Batch 4 = P21-B4-01～P21-B4-07 / PASS / USER_APPROVED / APPLIED / CHOICES=1A～7A
- PDM-21 Prefinal R1 = REPAIR_REQUIRED / NO_HARD_CONFLICT / REPORT=`07_重建工作区/PDM-21_Final前完整性复核_R1_2026-10-06.md`
- PDM-21 Prefinal Repair R1 = P21-LIA-01～P21-LIA-09 / PASS / USER_APPROVED / APPLIED
- PDM-21 Outgoing Handoffs = PDM-23 / PDM-25 / 2 HANDOFF_OPEN
- PDM-21 Prefinal R2 = PASS / FINAL_CANDIDATE_READY / REPORT=`07_重建工作区/PDM-21_Final前完整性复核_R2_2026-10-06.md`
- PDM-21 Final Overview = `07_重建工作区/PDM-21_最终完整规则总览_待用户批准.md` / USER_FINAL_APPROVED
- PDM-21 Final = `07_重建工作区/PDM-21_最终完整规则.md` / COMPLETE / INTEGRITY_PASS
- PDM-21 Final Integrity = `07_重建工作区/PDM-21_最终完整性复核_2026-10-06.md` / PASS
- PDM-21 Source Backwrite = 19 / 19 DONE
- PDM-21 Final Closeout = COMPLETE
- PDM-22 Startup Gate = PASS
- PDM-22 核心定位 P22-R00 = USER_APPROVED / APPLIED
- PDM-22 incoming handoffs = 18 / 18 HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE
- PDM-22 工作版 = `07_重建工作区/PDM-22_PC后台信息架构业务管理配置归属上游运行管理_规则原子重建_工作版.md`
- PDM-22 Batch 1 = P22-A01～P22-A22 / PASS / USER_APPROVED / APPLIED
- PDM-22 新增规则 P22-ADD-01 = PC 网页账号密码绑定现有 employee_id / USER_APPROVED / APPLIED
- PDM-22 Batch 2 = P22-B2-01～P22-B2-11 / PASS / USER_APPROVED / APPLIED
- PDM-22 Batch 2 Reverse Conflict Scan = PASS / FALSE_DEPRECATION_COUNT=0
- PDM-22 Batch 3 = P22-B3-01～P22-B3-09 / PASS / USER_APPROVED / APPLIED
- PDM-22 Batch 3 Conflict Isolation = PASS / MISCLASSIFIED_PRODUCT_CHOICE=0
- PDM-22 Batch 4 = P22-B4-01～P22-B4-08 / PASS / USER_APPROVED / APPLIED
- PDM-22 Prefinal R1 Repair = P22-LIA-01～P22-LIA-06 / PASS / USER_APPROVED / APPLIED
- PDM-22 Prefinal R2 = PASS / FINAL_CANDIDATE_READY
- PDM-22 Formal Units = 58
- PDM-22 Final Overview = 07_重建工作区/PDM-22_最终完整规则总览_待用户批准.md / USER_FINAL_APPROVED
- PDM-22 Final = `07_重建工作区/PDM-22_最终完整规则.md` / COMPLETE / INTEGRITY_PASS
- PDM-22 Final Integrity = `07_重建工作区/PDM-22_最终完整性复核_2026-10-07.md` / PASS
- PDM-22 Source Backwrite = 18 / 18 DONE
- PDM-22 Final Closeout = COMPLETE
- PDM-23 Startup Gate = PASS
- PDM-23 核心定位 P23-R00 = USER_APPROVED / APPLIED
- PDM-23 incoming handoffs = 10 / 10 HANDOFF_ACCEPTED
- PDM-23 工作版 = `07_重建工作区/PDM-23_通知飞书SLA免打扰Incident通知日志_规则原子重建_工作版.md`
- PDM-23 Batch 1 = P23-A01～P23-A20 / PASS / USER_APPROVED / APPLIED
- PDM-23 Batch 2 = P23-B2-01～P23-B2-14 / PASS / USER_APPROVED / APPLIED
- PDM-23 Batch 2 Reverse Conflict Scan = PASS / FALSE_DEPRECATION_COUNT=0
- PDM-23 Batch 3 = P23-B3-01～P23-B3-16 / PASS / USER_APPROVED / APPLIED
- PDM-23 旧 Batch 4 = P23-B4-01～P23-B4-06 / SUPERSEDED / NOT_APPROVED / NOT_APPLIED
- PDM-23 重建版 Batch 4 = P23-B4R-01～P23-B4R-10 / PASS / USER_APPROVED / APPLIED
- PDM-23 Batch 4 Historical Rescan = COMPLETE
- PDM-23 Local Product Choice Unresolved = 0
- PDM-23 Outgoing Handoff = HO-P23-P25-001 / HANDOFF_OPEN
- PDM-23 IA / Low-Fi / Engineering = NO_CONSTRUCTION
- PDM-22 Outgoing Handoffs = PDM-23 / PDM-25 / 2 HANDOFF_OPEN
- PDM-22 completed-PDM hard conflict = 0
- PDM-22 incoming handoff gap = 0
- PDM-22 IA / Low-Fi / Engineering = NO_CONSTRUCTION
- PDM-21 Local Product Choice Unresolved = 0
- PDM-21 Batch 3 Conflict Isolation = PASS / MISCLASSIFIED_PRODUCT_CHOICE=0
- PDM-21 Batch 2 Reverse Conflict Scan = PASS / FALSE_DEPRECATION_COUNT=0
- PDM-21 completed-PDM hard conflict = 0
- PDM-21 incoming handoff gap = 0
- PDM-21 IA / Low-Fi / Engineering = NO_CONSTRUCTION
- PDM-15 Startup Gate = PASS
- PDM-15 incoming handoffs = 5 / 5 HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE
- PDM-15 工作版 = `07_重建工作区/PDM-15_Consultation咨询生命周期来源负责人转派与SLA_规则原子重建_工作版.md`
- PDM-15 核心定位 P15-R00 = USER_APPROVED / APPLIED
- PDM-15 Batch 1 = P15-A01～P15-A08 / PASS / USER_APPROVED / APPLIED
- PDM-15 Batch 2 = P15-B2-01～P15-B2-05 / PASS / USER_APPROVED / APPLIED
- PDM-15 Batch 2 Reverse Conflict Scan = PASS / FALSE_DEPRECATION_COUNT=0
- PDM-15 Batch 3 = P15-B3-01～P15-B3-04 / PASS / USER_APPROVED / APPLIED
- PDM-15 Batch 3 Conflict Isolation = PASS / CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3=0
- PDM-15 Batch 4 = P15-B4-01～P15-B4-07 / PASS / USER_APPROVED / APPLIED / CHOICES=1A,2A,3A,4A,5A,6A,7A
- PDM-15 Local Product Choice Unresolved = 0
- PDM-15 Pre-Final Integrity R1 = REPAIR_REQUIRED / REPORT=`07_重建工作区/PDM-15_Final前完整性复核_R1_2026-10-06.md`
- PDM-15 Pre-Final Repair R1 = P15-LIA-01～P15-LIA-05 / PASS / USER_APPROVED / APPLIED
- PDM-15 Outgoing Handoffs = 8 / COMPLETE_REGISTERED / HANDOFF_OPEN
- PDM-15 Pre-Final Integrity R2 = REPAIR_REQUIRED / REPORT=`07_重建工作区/PDM-15_Final前完整性复核_R2_2026-10-06.md`
- PDM-15 Pre-Final Repair R2 = P15-LIA-06 / PASS / USER_APPROVED / APPLIED
- PDM-15 Pre-Final Integrity R3 = PASS / FINAL_CANDIDATE_READY / REPORT=`07_重建工作区/PDM-15_Final前完整性复核_R3_2026-10-06.md`
- PDM-15 Final Overview = `07_重建工作区/PDM-15_最终完整规则总览_待用户批准.md` / USER_FINAL_APPROVED
- PDM-15 Final = `07_重建工作区/PDM-15_最终完整规则.md` / COMPLETE / INTEGRITY_PASS
- PDM-15 Final Integrity = `07_重建工作区/PDM-15_最终完整性复核_2026-10-06.md` / PASS
- PDM-15 Source Backwrite = 5 / 5 DONE
- PDM-16 Startup Gate = PASS
- PDM-16 incoming handoffs = 6 / 6 HANDOFF_ACCEPTED
- PDM-16 核心定位 P16-R00 = USER_APPROVED / APPLIED
- PDM-16 工作版 = `07_重建工作区/PDM-16_CRM客户画像阶段跟进标签机会与SourceRadar_规则原子重建_工作版.md`
- PDM-16 Batch 1 = P16-A01～P16-A12 / PASS / USER_APPROVED / APPLIED
- PDM-16 Batch 2 = P16-B2-01～P16-B2-07 / PASS / USER_APPROVED / APPLIED
- PDM-16 Batch 2 Reverse Conflict Scan = PASS / FALSE_DEPRECATION_COUNT=0
- PDM-16 Batch 3 = P16-B3-01～P16-B3-06 / PASS / USER_APPROVED / APPLIED
- PDM-16 Batch 3 Conflict Isolation = PASS / MISCLASSIFIED_PRODUCT_CHOICE=0
- PDM-16 Batch 3 Completeness Repair = P16-B3-R01～P16-B3-R02 / PASS / USER_APPROVED / APPLIED
- PDM-16 Batch 3 Completeness Gap = 0
- PDM-16 Batch 4 = P16-B4-01～P16-B4-05 / PASS / USER_APPROVED / APPLIED / CHOICES=1A,2A,3A,4A,5A
- PDM-16 Local Product Choice Unresolved = 0
- PDM-16 Pre-Final Integrity R1 = REPAIR_REQUIRED / REPORT=`07_重建工作区/PDM-16_Final前完整性复核_R1_2026-10-06.md`
- PDM-16 Pre-Final Repair R1 = P16-LIA-01～P16-LIA-03 / PASS / USER_APPROVED / APPLIED
- PDM-16 Pre-Final Integrity R2 = PASS / FINAL_CANDIDATE_READY / REPORT=`07_重建工作区/PDM-16_Final前完整性复核_R2_2026-10-06.md`
- PDM-16 Final Overview = `07_重建工作区/PDM-16_最终完整规则总览_待用户批准.md` / USER_FINAL_APPROVED
- PDM-16 Final = `07_重建工作区/PDM-16_最终完整规则.md` / COMPLETE / INTEGRITY_PASS
- PDM-16 Final Integrity = `07_重建工作区/PDM-16_最终完整性复核_2026-10-06.md` / PASS
- PDM-16 Source Backwrite = 6 / 6 DONE
- PDM-16 Outgoing Handoffs = PDM-17 / PDM-21 / PDM-22 / PDM-23 / PDM-25 = HANDOFF_OPEN
- PDM-17 Startup Gate = PASS
- PDM-17 核心定位 P17-R00 = USER_APPROVED / APPLIED
- PDM-17 incoming handoffs = 6 / 6 HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE
- PDM-17 工作版 = `07_重建工作区/PDM-17_公海待公海领取指定分配与协作_规则原子重建_工作版.md`
- PDM-17 Batch 1 = P17-A01～P17-A15 / PASS / USER_APPROVED / APPLIED
- PDM-17 Batch 2 = P17-B2-01～P17-B2-04 / PASS / USER_APPROVED / APPLIED
- PDM-17 Batch 2 Reverse Conflict Scan = PASS / FALSE_DEPRECATION_COUNT=0
- PDM-17 Batch 3 = NO_NEW_ATOMS / PASS / USER_APPROVED / APPLIED
- PDM-17 Batch 3 Conflict Isolation = PASS / MISCLASSIFIED_PRODUCT_CHOICE=0
- PDM-17 Batch 4 = P17-B4-01～P17-B4-09 / PASS / USER_APPROVED / APPLIED / CHOICES=1A,2A,3A,4A,5A,6A,7A,8A,9A
- PDM-17 Local Product Choice Unresolved = 0
- PDM-17 Pre-Final Integrity R1 = REPAIR_REQUIRED / REPORT=`07_重建工作区/PDM-17_Final前完整性复核_R1_2026-10-06.md`
- PDM-17 Pre-Final Repair R1 = P17-LIA-01～P17-LIA-05 / PASS / USER_APPROVED / APPLIED
- PDM-17 Outgoing Handoffs = 6 / COMPLETE_REGISTERED / HANDOFF_OPEN
- PDM-17 Pre-Final Integrity R2 = PASS / FINAL_CANDIDATE_READY / REPORT=`07_重建工作区/PDM-17_Final前完整性复核_R2_2026-10-06.md`
- PDM-17 Final Overview = `07_重建工作区/PDM-17_最终完整规则总览_待用户批准.md` / USER_FINAL_APPROVED
- PDM-17 Final = `07_重建工作区/PDM-17_最终完整规则.md` / COMPLETE / INTEGRITY_PASS
- PDM-17 Final Integrity = `07_重建工作区/PDM-17_最终完整性复核_2026-10-06.md` / PASS
- PDM-17 Source Backwrite = 6 / 6 DONE
- PDM-18 Startup Gate = PASS
- PDM-18 核心定位 P18-R00 = USER_APPROVED / APPLIED
- PDM-18 incoming handoffs = 10 / 10 HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE
- PDM-18 工作版 = `07_重建工作区/PDM-18_LockRequest正式LockWaitlist延期释放_规则原子重建_工作版.md`
- PDM-18 Batch 1 = P18-A01～P18-A18 / PASS / USER_APPROVED / APPLIED
- PDM-18 Batch 2 = P18-B2-01～P18-B2-06 / PASS / USER_APPROVED / APPLIED
- PDM-18 Batch 2 Reverse Conflict Scan = PASS / FALSE_DEPRECATION_COUNT=0
- PDM-18 Batch 3 = P18-B3-01 + P18-B3-03 / PASS / USER_APPROVED / APPLIED
- PDM-18 Batch 3 Reclassified = P18-B3-02 / WITHDRAWN_FROM_BATCH3 / MOVED_TO_BATCH4
- PDM-18 Batch 3 Conflict Isolation = PASS / MISCLASSIFIED_PRODUCT_CHOICE=0
- PDM-18 Batch 4 Pending Direction = P18-B4-PRE-01 / SUPERSEDED_BY_FORMAL_B4-01 / APPLIED
- PDM-18 Batch 4 Pending Direction = P18-B4-PRE-02 / SUPERSEDED_BY_FORMAL_B4-02 / APPLIED
- PDM-18 Prefinal R1 = REPAIR_REQUIRED / REPAIR_CLOSED
- PDM-18 Prefinal R1 Report = 07_重建工作区/PDM-18_Final前完整性复核_R1_2026-10-06.md
- PDM-18 Prefinal Repair = P18-LIA-01～P18-LIA-06 / PASS / USER_APPROVED / APPLIED
- PDM-18 Prefinal R2 = PASS / FINAL_CANDIDATE_READY
- PDM-18 Final Overview = 07_重建工作区/PDM-18_最终完整规则总览_待用户批准.md / USER_FINAL_APPROVED
- PDM-18 Final = 07_重建工作区/PDM-18_最终完整规则.md / COMPLETE / INTEGRITY_PASS
- PDM-18 Final Integrity = 07_重建工作区/PDM-18_最终完整性复核_2026-10-06.md / PASS
- PDM-18 Source Backwrite = 10 / 10 DONE
- PDM-18 Outgoing Handoffs = PDM-19 / PDM-20 HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE；PDM-21 / PDM-22 / PDM-23 / PDM-25 = HANDOFF_OPEN
- PDM-18 Final Closeout = COMPLETE
- PDM-18 Batch 4 = P18-B4-01～P18-B4-10 / PASS / USER_APPROVED / APPLIED / CHOICES=1A～10A
- PDM-18 Batch 4 Cross-PDM Review = PASS / COMPLETED_PDM_NO_HARD_CONFLICT
- PDM-19 = COMPLETE / INTEGRITY_PASS
- PDM-19 Startup Gate = PASS
- PDM-19 核心定位 P19-R00 = USER_APPROVED / APPLIED
- PDM-19 incoming handoffs = 10 / 10 HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE
- PDM-19 工作版 = `07_重建工作区/PDM-19_意向金Transaction退款成交纠错换车_规则原子重建_工作版.md`
- PDM-19 Batch 1 = P19-A01～P19-A14 / PASS / USER_APPROVED / APPLIED
- PDM-19 Batch 2 = P19-B2-01～P19-B2-06 / PASS / USER_APPROVED / APPLIED
- PDM-19 Batch 3 = P19-B3-01～P19-B3-03 / PASS / USER_APPROVED / APPLIED（B3-03 USER_REVISED）
- PDM-19 Batch 4 = P19-B4-01～P19-B4-11 / PASS / USER_APPROVED / APPLIED / CHOICES=1A,2A,3A,4A,5A,6A,7A,8A,9A,10A,11A
- PDM-19 Local Product Choice Unresolved = 0
- PDM-19 Prefinal Integrity R1 = REPAIR_REQUIRED / NO_HARD_CONFLICT / REPORT=`07_重建工作区/PDM-19_Final前完整性复核_R1_2026-10-06.md`
- PDM-19 Prefinal Repair R1 = P19-LIA-01～P19-LIA-06 / PASS / USER_APPROVED / APPLIED
- PDM-19 Outgoing Handoffs = PDM-20 HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE；PDM-21 / PDM-22 / PDM-23 / PDM-25 = HANDOFF_OPEN
- PDM-19 Prefinal Integrity R2 = PASS / FINAL_CANDIDATE_READY / REPORT=`07_重建工作区/PDM-19_Final前完整性复核_R2_2026-10-06.md`
- PDM-19 Final Overview = `07_重建工作区/PDM-19_最终完整规则总览_待用户批准.md` / USER_FINAL_APPROVED
- PDM-19 Final = `07_重建工作区/PDM-19_最终完整规则.md` / COMPLETE / INTEGRITY_PASS
- PDM-19 Final Integrity = `07_重建工作区/PDM-19_最终完整性复核_2026-10-06.md` / PASS
- PDM-19 Source Backwrite = 10 / 10 DONE
- PDM-19 Final Closeout = COMPLETE
- PDM-20 Startup Gate = PASS
- PDM-20 核心定位 P20-R00 = USER_APPROVED / APPLIED
- PDM-20 incoming handoffs = 14 / 14 HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE
- PDM-20 completed-PDM hard conflict = 0
- PDM-20 incoming handoff gap = 0
- PDM-20 Current Authority Refresh = PASS
- PDM-20 工作版 = `07_重建工作区/PDM-20_客户端浏览搜索筛选排序列表详情收藏分享个人中心地域_规则原子重建_工作版.md`
- PDM-20 Batch 1 = P20-A01～P20-A18 / PASS / USER_APPROVED / APPLIED
- PDM-20 Batch 2 = P20-B2-01～P20-B2-09 / PASS / USER_APPROVED / APPLIED
- PDM-20 Batch 3 = P20-B3-01～P20-B3-08 / PASS / USER_APPROVED / APPLIED
- PDM-20 Batch 4 = P20-B4-01～P20-B4-10 / PASS / USER_APPROVED / APPLIED / CHOICES=1A～10A
- PDM-20 Prefinal R1 = REPAIR_REQUIRED / NO_HARD_CONFLICT / `07_重建工作区/PDM-20_Final前完整性复核_R1_2026-10-06.md`
- PDM-20 Prefinal Repair = P20-LIA-01～P20-LIA-07 / PASS / USER_APPROVED / APPLIED
- PDM-20 Outgoing Handoff = P21/P22/P24/P25 / 4 HANDOFF_OPEN
- PDM-20 Prefinal R2 = PASS / FINAL_CANDIDATE_READY / `07_重建工作区/PDM-20_Final前完整性复核_R2_2026-10-06.md`
- PDM-20 Final Overview = `07_重建工作区/PDM-20_最终完整规则总览_待用户批准.md` / USER_FINAL_APPROVED
- PDM-20 Final Candidate Ready = true
- PDM-20 Final = `07_重建工作区/PDM-20_最终完整规则.md` / COMPLETE / INTEGRITY_PASS
- PDM-20 Final Integrity = `07_重建工作区/PDM-20_最终完整性复核_2026-10-06.md` / PASS
- PDM-20 Source Backwrite = 14 / 14 DONE
- PDM-20 Final Closeout = COMPLETE
- PDM-21 Startup Gate = PENDING
- PDM-20 Batch 4 completed-PDM mutation = 0
- PDM-20 Batch 4 new domain state machine = 0
- PDM-20 Batch 3 Conflict Isolation = PASS / MISCLASSIFIED_PRODUCT_CHOICE=0
- PDM-20 Batch 2 Reverse Conflict Scan = PASS / FALSE_DEPRECATION_COUNT=0
- PDM-19 Batch 4 Cross-PDM Review = PASS / NO_COMPLETED_PDM_MUTATION
- PDM-19 Batch 3 Conflict Isolation = PASS / MISCLASSIFIED_PRODUCT_CHOICE=0
- PDM-19 Batch 2 Reverse Conflict Scan = PASS / FALSE_DEPRECATION_COUNT=0
- PDM-19 Current Authority Refresh = PASS
- PDM-19 completed-PDM hard conflict = 0
- PDM-19 incoming handoff gap = 0
- PDM-11 = COMPLETE / INTEGRITY_PASS
- PDM-12 = COMPLETE / INTEGRITY_PASS
- PDM-11 启动门禁 = UNBLOCKED
- `HO-P01-P11-001 = HANDOFF_SUPERSEDED`
- `HO-P01-P11-002 = HANDOFF_CLOSED`
- PDM-12 incoming handoffs = 4 / 4 HANDOFF_CLOSED
- PDM-13 incoming handoffs = 5 / 5 HANDOFF_CLOSED / source_backwrite=YES
- PDM-13 Batch 1 = PASS / USER_APPROVED（P13-A01～P13-A11）
- PDM-13 Batch 2 = PASS / USER_APPROVED（P13-B2-01～P13-B2-05）
- PDM-13 Batch 2 Reverse Conflict Scan = PASS
- PDM-13 Batch 3 = PASS / USER_APPROVED（P13-B3-01～P13-B3-06）
- PDM-13 Batch 3 Conflict Isolation = PASS
- PDM-13 Batch 4 = PASS / USER_APPROVED（B4-01 用户修正版；2A、3A、4A、5A、6A、7A、8A）
- PDM-13 Local Product Choice Unresolved = 0
- PDM-13 outgoing handoffs = PDM-14 / PDM-17 / PDM-18 / PDM-19 / PDM-20 HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE；PDM-21 / PDM-22 / PDM-25 = HANDOFF_OPEN
- PDM-13 Pre-Final Repair = P13-LIA-01～P13-LIA-08 / PASS / USER_APPROVED / APPLIED
- PDM-13 Pre-Final Integrity R1 = PASS / HISTORICAL / REOPENED_BY_FINAL_OVERVIEW_REVIEW
- PDM-13 Pre-Final Integrity R2 = PASS / FINAL_CANDIDATE_READY
- PDM-13 Final Overview = USER_FINAL_APPROVED
- PDM-13 Final = `07_重建工作区/PDM-13_最终完整规则.md` / COMPLETE / INTEGRITY_PASS
- PDM-13 Final Integrity = `07_重建工作区/PDM-13_最终完整性复核_2026-10-05.md` / PASS
- PDM-14 incoming handoffs = 8 / 8 HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE
- PDM-14 Start Gate = PASS
- PDM-14 Batch 1 = PASS / USER_APPROVED（P14-A01～P14-A14）
- PDM-14 用户追加裁决 = P14-R01～P14-R04 / USER_APPROVED / APPLIED
- PDM-14 Batch 2 = PASS / USER_APPROVED（P14-B2-01～P14-B2-11）
- PDM-14 Batch 2 Reverse Conflict Scan = PASS / FALSE_DEPRECATION_COUNT=0
- PDM-14 Batch 3 = PASS / USER_APPROVED（P14-B3-01～P14-B3-05）
- PDM-14 Batch 3 Conflict Isolation = PASS / CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3=0
- PDM-14 Batch 4 = PASS / USER_APPROVED（P14-B4-01～P14-B4-08；CHOICES=1A,2B,3A,4A,5A,6A,7A,8A）
- PDM-14 Local Product Choice Unresolved = 0
- PDM-14 Pre-Final Repair = P14-LIA-01～P14-LIA-10 / USER_APPROVED / APPLIED
- PDM-14 Pre-Final Integrity R2 = PASS / FINAL_CANDIDATE_READY
- PDM-14 Pre-Final Report = `07_重建工作区/PDM-14_Final前完整性复核_R2_2026-10-06.md`
- PDM-14 Final Overview = USER_FINAL_APPROVED
- PDM-14 Final = `07_重建工作区/PDM-14_最终完整规则.md` / COMPLETE / INTEGRITY_PASS
- PDM-14 Final Integrity = `07_重建工作区/PDM-14_最终完整性复核_2026-10-06.md` / PASS
- PDM-14 outgoing handoffs = HO-P14-P15-001 HANDOFF_CLOSED; HO-P14-P18/P19/P20/P21/P23/P25 = HANDOFF_OPEN
- PDM-11 Batch 1 = PASS / USER_APPROVED（P11-A01～P11-A13）
- PDM-11 Batch 2 = PASS / USER_APPROVED
- P11-B2-08 = USER_MODIFIED / USER_APPROVED
- PDM-11 Batch 3 = PASS / USER_APPROVED（P11-B3-01 用户修正版）
- PDM-11 Batch 4 = PASS / USER_APPROVED（P11-B4-01、P11-B4-02）
- PDM-11 Pre-Final Integrity = PASS / FINAL_CANDIDATE_READY

总控工作单：

> `07_重建工作区/PDM-22_PC后台信息架构业务管理配置归属上游运行管理_规则原子重建_工作版.md`

## 当前唯一下一步

> **当前唯一下一步：PDM-01～25 全局 Cross-PDM / Handoff / Global Invariant 最终总复核。**

每个 PDM 必须同时执行：

1. Missing Rule Audit｜重新从原始证据查整条遗漏；
2. Semantic Detail Audit｜查条件、例外、权限、scope、hard DENY、生命周期、失败/幂等、历史等是否被压缩丢失；
3. Cross-PDM Integrity Audit｜查 PDM-01～10 相互冲突、静默覆盖、handoff 丢失、stale rule；
4. Source→Final；
5. Final→Source；
6. Semantic Completeness Matrix；
7. 仅对发现问题的 Atom / 段落 reopen；
8. 真正改变产品语义的 reopen 必须重新提交用户裁决；
9. 达到 `INTEGRITY_PASS` 后再进入下一个 PDM。

## PDM-11 启动硬门禁｜已通过

以下条件现已全部满足：

- PDM-01～PDM-10 全部 `INTEGRITY_PASS`；
- PDM-01～10 全局 Cross-PDM / Handoff / Global Invariant 总复核 PASS；
- MISSING_RULE_UNRESOLVED = 0；
- SEMANTIC_DETAIL_GAP_UNRESOLVED = 0；
- CROSS_PDM_CONFLICT = 0；
- HANDOFF_GAP_UNRESOLVED = 0；
- GLOBAL_INVARIANT_CONFLICT = 0；
- IMPLEMENTATION_READY = PASS。

## 当前禁止

- PDM-12 已最终批准并正式发布：`COMPLETE / INTEGRITY_PASS`；正式 Authority = `07_重建工作区/PDM-12_最终完整规则.md`；4 条 incoming handoff 已 CLOSED 并 source backwrite；
- PDM-13 已最终批准并正式发布：`COMPLETE / INTEGRITY_PASS`；正式 Authority = `07_重建工作区/PDM-13_最终完整规则.md`；5 条 incoming handoff 已 CLOSED 并 source backwrite；
- 不把旧 PDM 的 `COMPLETE` 直接等同于通过当前新完整性标准；
- 不只检查 Final 文案而跳过原始证据遗漏扫描；
- 不把 PDM-01～10 全部推倒重做；只 reopen 真正有问题的 Atom / 段落；
- 不用聊天记忆替代仓库证据；
- 不在 PDM-01～25 产品规则阶段修改 IA / Low-Fi；发现冲突只登记 `STALE_CARRIER`、正确 Authority 与未来修正要求；
- IA / Low-Fi 集中对齐固定延后到 PDM-25 完成并通过 PDM-01～25 全局最终总复核之后；
- 不执行 Engineering Delta。

## Cross-PDM Handoff 强制读取

继续任何 PDM 前必须先读取：

> `07_重建工作区/CROSS_PDM_HANDOFF_REGISTER.md`

固定规则：

- 来源 PDM 产生 handoff → 登记 `HANDOFF_OPEN`；
- 目标 PDM 接收 → `HANDOFF_ACCEPTED`；
- 目标 PDM 完成 → `HANDOFF_CLOSED` 或 `HANDOFF_SUPERSEDED`；
- 目标关闭后同一次收口必须反向回写来源 PDM；
- 目标已 COMPLETE 但来源仍写“留后续” = `STALE_HANDOFF / SOURCE_BACKWRITE_PENDING`；
- 当前 PDM 作为目标时，只要 incoming handoff 未关闭，不得 COMPLETE / INTEGRITY_PASS。

当前 PDM-01～PDM-24 均已完成对应 Final / Integrity Closeout；PDM-25 Startup Gate 已 PASS，24/24 incoming handoff 已 HANDOFF_ACCEPTED。当前唯一下一步：PDM-01～25 全局 Cross-PDM / Handoff / Global Invariant 最终总复核。

## PDM-25 后 Carrier 对齐硬顺序

```text
PDM-01～25 产品规则全部完成
→ PDM-01～25 全局 Cross-PDM / Handoff / Global Invariant 最终总复核
→ PDM-01～PDM-25 Final / Integrity 历史阶段尾巴统一清理与 Current / History 边界标注
→ IA 全局集中对齐
→ Low-Fi 全局集中对齐
→ Engineering / 施工
```

## PDM-25 后历史阶段尾巴统一收口

- PDM-11～25 期间不反复批量清理各 PDM Final / Integrity 报告中当时真实的阶段进度尾巴；
- 当前控制入口若出现 stale current pointer，仍必须立即修正；
- PDM-25 + PDM-01～25 全局最终总复核 PASS 后，一次性完成 Final / Integrity 的 Current / Historical Audit Trail 边界标注；
- 历史事实保留，不物理删除，不改变业务规则语义；
- 该统一清理完成后再进入 IA 全局集中对齐。
