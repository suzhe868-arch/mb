# 02 V1 FEATURE SCOPE REGISTER

## Classification rules

Allowed: `IN_V1 / OUT_V1 / DEFER_V1_1 / TECH_OPTIONAL / DECISION_REQUIRED`.
No historical mention is promoted into V1 without authority evidence.

| Feature | Status | Authority evidence | Notes |
|---|---|---|---|
| C01 顶部 Banner / 运营位 `HOME_TOP` | **IN_V1** | Prior explicit user confirmation recovered from 2026-09-01: single Banner area, 3–5 rotating slides, first-screen visible, scrolls away; search/core filters may stick. | Existing capability retained; now one of two explicitly registered V1 placements. |
| 微信服务号 | **DEFER_V1_1** | Current SSOT/IA: future/auxiliary customer reach & return capability; not a V1 core notification dependency. | Preserve architecture note; no V1 core dependency. |
| H5 / mobile web | **OUT_V1** | Prior explicit scope freeze: V1 customer entry is WeChat mini-program; H5/mobile web does not enter V1. Current baseline contains no H5 product end. | Do not create H5 page inventory/API projection for V1. |
| 独立 App | **OUT_V1** | Prior scope freeze + current SSOT product ends. | Employee/4S use unified mini-program. |
| AI 找车 / AI 正式匹配 | **OUT_V1** | Current SSOT + DEC appendix explicitly prohibit AI in V1 formal matching. | Deterministic rules only. |
| AI 估价 | **DEFER_V1_1** | Current SSOT says V1 does not require formal AI valuation; future V1.1/V2 may introduce it. | Data foundations may be retained. |
| AI 比价 / 问AI收车价 | **DEFER_V1_1** | User decision FS-001=A on 2026-09-06; DEC-074 CLOSED. | V1 preserves data foundation only; no AI UI/API/product capability. |
| IM / 客户-销售即时聊天 | **OUT_V1** | No authoritative V1 requirement found. Existing consultation is a business object/SLA, not an IM subsystem. | No authority to add. |
| 微信小程序订阅消息 | **OUT_V1** | SSOT + Decision appendix explicitly prohibit V1 subscription-message system. | Do not restore. |
| 客户通用消息中心 / read-unread | **OUT_V1** | SSOT/IA/Decision appendix explicitly prohibit; C03-06 is announcement only. | Do not restore. |
| 客户小程序公告 | **IN_V1** | Current SSOT/IA explicitly define lightweight announcements and display frequency. | Not a message center. |
| 在线支付 | **OUT_V1** | SSOT: V1 records offline payment facts only; no online payment. | Deposit/refund are factual records, not payment processing. |
| Customer Merge | **OUT_V1** | SSOT + DEC explicitly: no complex customer merge in V1. | Same phone must not auto-merge different customer_id. |
| Change-car / 换车专用关系 | **OUT_V1** | SSOT + Decision appendix explicitly cancel dedicated change-car object/state. | New car uses normal new lock flow after old business is handled. |
| 服务费 / 物流费 / 检测费 / 过户费 / 预计到手价 | **OUT_V1** | SSOT + Decision appendix explicitly cancelled. | Do not restore old fee/landed-price model. |
| 直播 | **OUT_V1** | No authoritative V1 requirement found. | Historical evidence insufficient to include. |
| 视频业务能力 | **OUT_V1** | No authoritative V1 requirement found. | Vehicle images remain in V1; no video subsystem. |
| 地图业务能力 | **OUT_V1** | No authoritative V1 requirement found. | Region/city filtering does not imply map UI. |
| 海报生成 | **OUT_V1** | No authoritative V1 requirement found. | Existing share capability does not imply poster generation. |
| SaaS / 多租户 | **OUT_V1** | Prior explicit V1 scope freeze excludes SaaS/multi-tenant; current baseline is a single Mingbang product domain. | Do not introduce tenant_id architecture as a product requirement. |
| PC Customer 前台 | **OUT_V1** | Current product ends are customer mini-program + employee mini-program + PC Admin. | PC is administrative, not customer frontend. |
| 车辆详情运营位 `VEHICLE_DETAIL` | **IN_V1** | CR-PD-002 CLOSED: reuse P12 Banner backend; module is absent when no effective content. | Fixed registered placement only; not a generic ad-slot framework. |
| 额外运营推荐位（除 `HOME_TOP` / `VEHICLE_DETAIL`） | **OUT_V1** | No authority for arbitrary additional placements. | Avoid expanding into a generic multi-slot ad platform. |
| Banner 后台内容管理方式 | **IN_V1** | User decision FS-002=B on 2026-09-06; DEC-075 CLOSED. | PC Admin lightweight configuration only; no ad platform. |
| 批量运营能力 | **OUT_V1** | No authoritative V1 requirement found. | Individual/config-specific admin actions remain only where separately authorized. |
| 客户历史 / 业务历史 | **IN_V1** | SSOT/IA include CRM history, follow-up timeline, historical find-car/recommendation/consultation/lock/waitlist/transaction. | History is object/timeline based, not a generic global history dump. |
| 收藏 | **IN_V1** | SSOT/IA explicitly define favorite behavior and history. | Immediate low-threshold action. |
| 浏览历史（独立页面） | **OUT_V1** | SSOT explicitly: sold/offline vehicle may be reached from existing business histories; V1 does not add independent browse history. | Do not create page/table solely for user-visible browsing-history product. |

## Scope gate

- Known scope classifications completed.
- Recovered Banner requirement written back to SSOT / IA / Low-Fi.
- CR-001 adds only the fixed `VEHICLE_DETAIL` placement, optional vehicle-detail dates, the reduced copy whitelist and authorized upstream-phone dialing; no other V1 scope expansion.
- FS-001 and FS-002 were explicitly resolved by the user and written back as DEC-074 / DEC-075.
- No unresolved historical feature-scope item remains in the audited gray-zone list.

`ZERO_UNKNOWN_FEATURE_SCOPE = PASS`
