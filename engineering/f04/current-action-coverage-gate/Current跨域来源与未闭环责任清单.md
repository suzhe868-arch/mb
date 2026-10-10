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