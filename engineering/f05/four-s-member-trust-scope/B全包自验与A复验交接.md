# F05-3A｜A定向来源补证后续工程交接（现行）

> 本节覆盖下文**初轮历史SOURCE_GAP勘验**。原始证据保留，不是当前工程的最终结论。本次严格执行A于main的`F05-3A_A主控首次独立审查4S受信来源缺口技术裁决与定向补证施工单_2026-10-11.md`。本报告CI具体run/SHA/Artifacts以PR#32最终正式B交审评论为准，未获最新完整同SHA绿灯不计交审完成。

**已经补齐的受信路径**：在新隔离`000016`中新增System Admin审核并签发的4S`NEW_OWN_FOUR_S_MANUAL_VEHICLE`当前license、4S真实Session完成首次新Vehicle+Cycle+模型/城市/里程校验并同事务记录本人当前经营对象和不可变MEMBER_PUBLISH事件。未取代F05-2名邦Team来源，未创建4S组织，未追认旧Vehicle owner。缺Admin许可继续`POSITIVE_4S_TRUST_SOURCE_BLOCKED`。

**实际代码**：
- 新增`000016_four_s_member_trust.sql`、`migration.mjs`、`runner.mjs`、`evidence.mjs`、`fixtures.mjs`、`ci-four-s-handler.mjs`；
- 仅重写本批`source-gate.mjs`，保留旧`publishFourSVehicle`/`issueFourSResponsibility`历史补填入口恒拒；
- 新增`tests/bridge-source.test.mjs`的H-A01～14真实物理+CAS/双连接与`tests/bridge-https.test.mjs`的H-B01～10真实TLS/账号Scope正反；保留原G-A01～07/G-B01～07缺源拒绝回归；
- 原F05-2完整36个job定义逐字冻结，仅本批新增的两项CI作业追加真实独立PG16增量版本、Admin许可证、同事务新车、撤权及审计测试；两job追加原生新版schema-only、catalog/inventory、sha256、真实测试日志和Artifact。
- 当前来源与审计完整说明见`F05-3A受信Admin许可证与4S本人首发物理审计及回归合同.md`；14项新旧Actor矩阵见`F05-3A新旧正反Actor权限审计矩阵.tsv`。

**关键真实安全事实**：业务Actor永远来自活跃4S本人Session；颁证Actor为活跃System Admin控制面Session；自动治理撤权为SYSTEM、无被影响者伪装human Actor；旧上架、另一4S账号、名邦发布4S/JYT、System Admin业务读、6非详情出口、伪造header均拒；账户/permission/Vehicle source/cycle变化关闭license和对象，重新active不会复活。全部只在独立PG16和loopback HTTPS运行，不修改000001～000015或生产Server。

**最终交A门槛**：PR Head=最新分支HEAD=Actions run.head_sha，旧36+新2的**38/38成功**、新原生物理与TLS两个Artifacts、原生H-A14/H-B10不含假阳性，A独立复验后才可合并main；B不得自行合并。F05全域、F04生产、C/H01和V1基线仍`NOT_READY`。

---

# F05-3A｜B工程勘验、自验与 A 来源阻断交接

> 2026-10-11 Asia/Singapore。任务：A正式施工单 `07_重建工作区/F05-3A_A主控4S单成员经营责任可信来源与Vehicle隔离权限验证完整施工单_2026-10-11.md`。
>
> **交接结论：`BLOCKED_SOURCE_GAP / POSITIVE_4S_TRUST_SOURCE_BLOCKED / NEXT_OWNER=A_SOURCE_DECISION`。**
> 本次**不是**F05-3A准予正向200后的`READY_FOR_A_REVIEW`。B未伪造4S合作经营来源或组织映射，也未将一个失败的受信源事实改造成“测试PASS”。

## 一、已经完成的授权范围内工作

1. 从最新main `cd735708dc6876dc2689a51fd0f767eb1024a4a7`创建指定分支 `feat/f05-3a-four-s-member-trust-scope`，未在main直接施工。
2. 读取F05-2最终A验收、工作单、F04-2 4S商户归属与对象权限缺口证明、F03-1真实匿名隔离源、M94封印和F05-2增量000015。输出 `4S真实来源缺口与受信关系物理勘验.md` 和 `4S当前业务Owner及敏感出口隔离矩阵.tsv`。
3. 新增只读 `source-gate.mjs`：真实CI-only PG16+账号Session鉴别真实four_s身份但严格`POSITIVE_4S_TRUST_SOURCE_BLOCKED`，假发布和责任签发两个入口恒拒绝。无生产HTTP、DDL、INSERT owner或自造4S Scope。
4. 新增两套真正非特权PG16正反来源测试：A物理身份/角色/权限码与对象归属缺口；B真实TLS/当前Session/名邦员工首发four_s与4S成员隔离/伪header/停用复职/其他出口403。4S合法本人首发200明确标记**不可测试/来源阻断**，不编造正向。
5. 新增独立workflow `.github/workflows/f05-3a-four-s-member-trust-scope.yml`，仅改变工作流触发分支/显示名称，保留之前36个job定义**逐字不变**，新增2个独立真实PG16证据Job（合计38），保留M94/F05-2已验收基线。新增负例若全绿，也只证明**无证时安全拒绝**，不能视作4S合法发布授权已建立。

## 二、证据与未闭环的唯一本质前置

- 真实employee2为`role=four_s`且已拥有`pc.four_s.vehicle.manage`静态permission allow；但其 `store_id=NULL`，当前仅有customer_id=301的Customer object scope，**没有一条合法可验证的Vehicle/ListingCycle/4S经营主体与该账号的受信发布事务、scope与审计来源链**。
- F05-2签收的 `vehicle_current_responsibilities.team_id NOT NULL` 属于名邦员工团队管理链，不会因 `vehicle.source_type=four_s` 或 `created_by_employee_id`而自动授权 4S 员工。
- F04-2 已独立拒绝“某4S账号—某合作4S商户”的经营映射：`F04_4S_ACCOUNT_SCOPE_UNPROVEN`。B不能通过自造4S组织表、直接INSERT owner、设置`trusted=true`、新建任意scope seed补齐此Authority缺口。
- **需要A主控正式指定可验证的4S本人首次人工发布与经营对象权限授予的真实可信来源及签发入口**；在此之前任何正向`200`均非法。A可安排下一项独立源身份/授权事务工作包；与之无关的JYT、批发转名邦、价格、电话和生产接口均不在本批施工。

## 三、测试/CI冻结纪律

- 前置A验收F05-2为 PR #31，36/36真PG16同SHA通过，已A签收合并main，不再修改旧000001～000015或原工作流。
- 本批两新增真实PG16 job应各自生成原生 `schema-only.sql/full-catalog.json/inventory.json/sha256sums.txt`、原生source/HTTPS测试日志、来源矩阵和两份GitHub Artifacts。
- 两个新增 job 与旧36冻结回归通过后，仅能记作 `SOURCE_GAP_SAFETY_EVIDENCE_VERIFIED`；**不可记作F05-3A_PASS**，也不自行合并。
- 本次禁止真实4S账号/客户/供应商/JYT/资金/生产数据库，F05/F04生产/H01和V1基线持续`NOT_READY`。

## 四、唯一接力

**`NEXT_OWNER=A` — 独立核对物理来源缺口并确定可供B合法签发4S成员对象管理权的受信来源合同。** 若A核实此信源确实不存在，则应以`SOURCE_GAP`记入正式状态并放行针对来源的后继单，而不是把本次纯拒绝负例的38作业绿灯合并成F05-3A合格。
