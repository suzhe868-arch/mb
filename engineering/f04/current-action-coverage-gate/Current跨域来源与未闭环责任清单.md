# F04-4｜Current跨域来源与未闭环责任清单

基于当前源文件逐行编制独立台账：Navigation 228、Action 58、Guard 16、Page 132、Collector禁恢复3，共437来源记录。该总量是行级来源（包含页面、只读导航、对象守卫），不是437个HTTP API。机器分区为CURRENT_ACTION_COVERAGE 50，PAGE_NAV_ONLY 258，CONTRACT_CANDIDATE_TYPED 30，CURRENT_AUTHORITY_GAP 19，DOMAIN_IMPLEMENTATION_BLOCKED 77，RETIRED_FORBIDDEN 3；总和=437。Source Gap不会提升历史接口批准状态。

旧218 method+path / 198 distinct path / 62 colon path，历史候选215=23同动作证据+192 SOURCE_GAP，全部UNDECIDED。3条Collector连接管理接口禁恢复；不恢复独立电话能力、人工Priority create、独立调价或通用消息read/unread。

## 域责任

| Domain | 技术已证来源 | 下游真实实施 |
|---|---|---|
| PDM-02 | 一个4S账号代表一个合作主体；SystemAdmin控制面与Employee独立 | F04/F05可信物理4S绑定；无组织树 |
| PDM-15 | Consultation为独立域，不能凭URL归为Vehicle | OWNER_REVIEW_GAP，具体F06交接 |
| PDM-18 | LockRequest 6小时/最终审批/冲突与Waitlist独立 | F06权限、对象时序与幂等 |
| PDM-10 | 阶梯加价与查价权益各自校验，内部批发价不外泄 | F05价格域 |
| PDM-04/05/06/21 | Vehicle来源、ListingCycle、车型映射与图片恢复分离 | F05/F07 |
| PDM-24 | Announcement与Banner分别运营，无消息通用状态机 | F04/H03 |

八个新动作仅为有来源的CI-only合成contract，各自仍DOMAIN_IMPLEMENTATION_BLOCKED。真实Customer身份、4S商户/车辆对象、资金、价格、微信/JYT/飞书均未在本批获得操作批准。
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
