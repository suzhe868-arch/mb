# F04-4｜B 全包自验与 A 独立复验交接（工程签收前）

> **B_SELF_TESTED（以最终同SHA 32/32 CI为通过条件） / READY_FOR_A_REVIEW（满足下述条件后） / NEXT_OWNER=A**。本报告与同 PR 最终交接评论共同构成真实SHA、GitHub Actions、原生Artifacts的可追溯依据；**最后一次CI运行以最终PR评论和GitHub原生工作流为准**，本报告不自行伪填无法在提交前确定的当前提交SHA。

## 一、正式放行、变更范围和禁止项

- SSOT：最新main的正式施工单 `07_重建工作区/F04-4_A主控Current全量动作覆盖消费合同与隔离安全门禁完整施工单_2026-10-10.md`。B分支 `feat/f04-4-current-action-coverage-gate`，从A最新main（当时SHA `74fa9943062519310704f03e348aad9c85b27e1d`）新建。
- 本批只新增 `engineering/f04/current-action-coverage-gate/**` 与 `.github/workflows/f04-4-current-action-coverage-gate.yml`；**未改**既签F03、F04-1/2/3业务源码/迁移/旧CI job正文、生产server、PDM Final、IA、Low-Fi或C/H01资产。不创建新DDL、不执行生产/资金/JYT/微信/飞书或客户个人数据读写。
- A已签F04-1/2/3仅是CI-only技术门禁。32条原Current CI候选全部仍未批准生产；旧215路由仍`UNDECIDED/CONTRACT_ONLY`，仅23条可证Current同动作+192条SOURCE_GAP；旧Collector 3条`RETIRE/FORBIDDEN`。

## 二、F04-4A：全量Current来源、准确计数和未决

| 原始Current行级载体 | 已枚举行数 | 解释 |
|---|---:|---|
| Current Navigation | 228 | 页面控件和导航条件；**纯浏览/只读不是写操作** |
| Current IA V5 Action Contract | 58 | 其中50条ACTION、8条非Command分类 |
| Current Canonical Guard | 16 | 约束而非可执行HTTP |
| Current Page Manifest C/E/P表行 | 132 | 页面与覆盖载体，不视作132个API |
| 3条旧Collector禁恢复项 | 3 | 必须硬拒、不可复活 |
| **合计** | **437** | 依据真实每行、稳定语义键和源文件号机器重建 |

互斥分类：`CURRENT_ACTION_COVERAGE=50`；`PAGE_NAV_ONLY=258`；`CONTRACT_CANDIDATE_TYPED=30`；`CURRENT_AUTHORITY_GAP=19`；`DOMAIN_IMPLEMENTATION_BLOCKED=77`；`RETIRED_FORBIDDEN=3`；**50+258+30+19+77+3=437**。每条包含来源文件/准确行/原文、当前Source Page、Control、目标页、Actor、Resource、Guard、能力、data scope、DTO、Owner、未证原因、版本，强制语义稳定键覆盖页面/操作/Actor/Resource/Guard/version及原始行。

**独立未闭环事实：** Page Manifest正文自称`140 logical Page/Overlay rows`，但本次可机检的实际C/E/P页面表行只有`132`，相差8。已在封印JSON明确标为`SOURCE_GAP_DECLARED_140_VS_CURRENT_TABLE_132_NO_INVENTED_PAGE`。本批没有虚构8个页面或改写正式IA；请A独立核实口径、重复计数或真实漏项。此项不表示擅自否定任何产品页面。

## 三、F04-4B：三向桥接与8项增量候选

- `Current旧新三向可追溯台账.tsv` 为 **258条**：旧215历史来源 + 既签32条Current CI候选 + 新8条合成候选 + 3条Collector禁恢复。来源标注Current与Legacy的不同权威层级，历史路由不提升为KEEP/MODIFY或生产URL。
- 新8项：PDM-18/F06 LockRequest最终同意与最终拒绝（6h/PENDING/对象守卫）；PDM-06/F05 发布后Vehicle source_type变更；PDM-04/F05 真实下架；PDM-05/F05 SystemAdmin车型mapping控制平面；PDM-10/F05 阶梯加价规则保存；PDM-21/F07 图片失败重试；PDM-24/F04 新公告。各项均核真实Final与对应当前Nav准确行、Actor/资源/状态/Owner、版本化仅CI路径及至少最小强类型target对象身份，拒绝额外字段/内部价格/电话/VIN/伪造角色/VIP/merchant。
- 8项协议`CI_ONLY_PROPOSED_NOT_PRODUCTION`，均`DEPENDENCY_BLOCKED`。目前无真正业务写入、无合法新200响应；未证的复杂请求DTO、精准业务scope与物理对象归`SOURCE_GAP/OBJECT_SCOPE_UNPROVEN`并交F04/F05/F06/F07/H03/H04后续批次。
- PDM-02明确单4S成员账号直接代表合作主体，**绝无新增4S门店组织树/商户穿透**；SystemAdmin控制平面与Employee业务actor独立。Consultation实施Owner保持未解`OWNER_REVIEW_GAP`，Waitlist/LockRequest不归Vehicle普通F05；不得恢复独立电话权限、人工Priority、独立调价和消息read/unread。

## 四、真实安全门禁和负例

- `coverage-verify.mjs`、`tri-bridge-verify.mjs`：真实逐行原文和稳定语义键核验，old215签收状态、冻结32合同和Current新增8的Actor/Domain/DTO双向锁；同文档内无关真引文/错页/错资源、删行、伪Source Gap授权、Collector复活、虚构4S组织和敏感字段均实际注入失败。
- `consumer-router.mjs`：仅GitHub Actions`CI=true`+独立非特权M94 PG16+TLS本机环回+F03真实当前PC会话+CSRF/request-key启用，未知URI/伪造Cookie/Header/Body/导出/越Scope硬拒；所有新业务始终403/501。只有冻结F04-1精准CustomerId对象Owner读取允许合成200，Owner漂移随时撤权。真实Customer微信Session未实现，不以PC Cookie冒充。
- 两个F04-4新增测试：真实M94来源/覆盖/DTO/三向桥接变异负例、真实M94本机HTTPS/会话/对象权正反例；G000014与M94旧版本独立隔离。原F04-3 30个**独立PG16** job字节冻结，新两job各自独立PG16、全目录封印、各自产生`schema-only.sql`/`full-catalog.json`/`inventory.json`/`frozen-source.md`/`sha256sums.txt`和真实测试日志/Current来源合同，旧证据不可充当新作业。
- 真实执行前次完整基线跑证：[Actions 38050382856](https://github.com/suzhe868-arch/mb/actions/runs/38050382856) 共32/32成功；本报告后的扩展语义稳定键、三向桥接、异常显性标注和变异测试必须在**最终B HEAD同SHA**再全部32/32成功，详见最终PR评论证据。**未有最终同SHA绿灯不得交A或称完成。**

## 五、最终接力条件

A独立复验请确认：最终PR HEAD与最后成功Actions`head_sha`一致、32/32个真实PG16 job success、新独立Source/TLS原生Artifacts存在未过期、旧30正文冻结、仅上述白名单新增文件、三向258/Current437台账机器能复现及Page Manifest 140 vs 132未证差额是否需要A后续裁定。B绝不自行合并`main`或启动F04-5/F05；本轮F04整体、H01和V1产品基线继续`NOT_READY`。

**只有满足同SHA最终绿灯才标`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`；最终版本、run、job、artifact精确信息记录于PR交接评论。**

## 2026-10-10｜A-F04-4-01 首次独立验收业务DTO整改（二轮交A）

A认可既有437来源/258追溯/真实32独立PG16及45原生工件，但8个新增动作全用一个必填正整数ID是假typed业务请求。原PR29未合并，本批在原分支修复；F04-4仍CI-only。

- 八个Current动作意图仍有PDM Final + Navigation原文；请求字段与物理对象/权限没有全部得到生产证明。严格计数：1项有据的最小CI合成typed请求 + 7项INTENT_ONLY/REQUEST_SCHEMA_SOURCE_GAP，不再称8项已完成可执行DTO。
- VEHICLE_SOURCE_TYPE_EDIT明确Vehicle目标vehicleId，以及必填targetSourceType，仅支持名邦或4S（PDM-06第342/348行）。该vehicleId整数wire编码是CI合成假设，待F05证实；批发/错误enum与VIN/手机号/批发价/伪VIP不允许。
- ANNOUNCEMENT_CREATE是新建，PDM-24第23/25行可证标题/正文/有效周期/开关/排序语义，但复合Nav291无法证明新建HTTP必填/可选字段与表示。撤销原伪必填announcementId，明确INTENT_ONLY_CI_CONTRACT，不冒充生产创建DTO。
- MARKUP_RULE_SAVE有草稿/校验/范围/生效区别，但区间、加价金额和版本的真实请求结构未证；SYSTEM_MODEL_MAPPING_BIND应选已有合法vehicle_model_id，原modelMappingId作为必填未经证明。两者均降REQUEST_SCHEMA_SOURCE_GAP，必须在下游F05补全。
- LockRequest approve/reject、Vehicle真实下架、图片失败重试均有动作证据，但HTTP请求编码、物理Scope/状态/幂等结构不完整：仅intent、不造完整DTO。
- 校验器现在逐项锁定真实操作动词、Final/Nav原文、字段级Final来源、状态/枚举及响应。新增合法vehicle正例，以及缺目标source_type、公告CREATE误传旧ID、阶梯无区间仍声称完整、映射无canonical目标、错PDM/Actor等实质负例。
- 新接口仅CI-only硬拒403/501，唯旧F04-1受签收的精准CRM CustomerId合成只读可200；不改生产/第三方/资金，不恢复Collector3条。
- 页面Manifest声明140、实际来源枚举132差8仍SOURCE_GAP，非本轮单独阻断；旧215=23/192不变。最终需要同HEAD真实32/32独立PG16，且原生新Source/TLS artifacts；A二轮复审后方可合并。
