# PDM-20｜客户端浏览 / 搜索 / 筛选 / 排序 / 列表 / 详情 / 收藏 / 分享 / 个人中心 / 地域｜规则原子重建工作版

> 当前状态：`IN_PROGRESS / STARTUP_GATE_PASS / BATCH_1_PENDING_USER_REVIEW`  
> 核心定位：`P20-R00 = USER_APPROVED / APPLIED`  
> Incoming Handoff：15 / 15 `HANDOFF_ACCEPTED`  
> IA / Low-Fi / Engineering：`NO_CONSTRUCTION`

---

# 1. P20-R00｜核心定位｜USER_APPROVED / APPLIED

PDM-20 是：

> **客户端产品体验与 Customer Safe Projection 的唯一 Authority。**

负责：

- C01 车辆首页 / Feed / 来源切换；
- 搜索、车型选择、筛选、排序、地域；
- 分页、刷新、查询上下文恢复；
- 车辆列表卡片 / 占用安全状态；
- 车辆详情 / 历史详情；
- 客户可见档案 / 车况 / 图片交互；
- 收藏；
- 普通分享 / 分享直达 / 分享卡片；
- 客户端价格安全投影；
- C02 找车工作区的客户端投影；
- C03「我的」及收藏 / 推荐 / 咨询 / Lock / Waitlist / Transaction / 个人资料 / 我的顾问 / 推荐朋友等客户端投影；
- 客户端 CTA、状态文案、导航与安全字段裁剪。

PDM-20 **不重新定义**：

- Customer identity / phone / owner；
- Vehicle / source / listing_cycle / hidden / offline / sold；
- Model 主数据；
- Archive / 车况 provenance；
- 图片资产 / 敏感原件；
- Price / price check entitlement / quota；
- Demand / Matching / Rule Dictionary；
- Priority；
- Recommendation；
- Consultation；
- LockRequest / Lock / Waitlist；
- Deposit / Transaction / Refund；
- Banner / Announcement 后台运营 Authority；
- 员工端、PC、通知、统一审计实现。

以上业务真相必须读取 completed PDM Authority，PDM-20 只决定**客户端如何安全展示、如何进入合法动作、如何保持导航/查询上下文**。

---

# 2. Startup Gate

## 2.1 Current Authority Refresh

已重新读取并对齐：

- 9/19 R10 客户端体验规则；
- 001～078：M16 + 与 PDM-20 直接相关的 M10 / M11；
- Current IA / Action / State / Low-Fi carrier；
- PDM-01 / 03 / 04 / 05 / 07 / 08 / 10 / 11 / 12 / 13 / 14 / 15 / 18 / 19 Final；
- CROSS_PDM_HANDOFF_REGISTER 中 target=PDM-20 的全部 handoff。

结果：

- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `INCOMING_HANDOFF_COUNT = 15`
- `INCOMING_HANDOFF_ACCEPTED = 15`

## 2.2 Incoming Handoff

已接受：

1. `HO-P01-P20-001`
2. `HO-P03-P20-001`
3. `HO-P04-P20-001`
4. `HO-P05-P20-001`
5. `HO-P07-P20-001`
6. `HO-P08-P20-001`
7. `HO-P10-P20-001`
8. `HO-P11-P20-001`
9. `HO-P12-P20-001`
10. `HO-P13-P20-001`
11. `HO-P14-P20-001`
12. `HO-P15-P20-001`
13. `HO-P18-P20-001`
14. `HO-P19-P20-001`
15. `HO-P03-P20-001` 的分享归属 / 推荐朋友入口语义并入同一 accepted handoff，不另造重复规则对象。

> 注：Register 中实际唯一 handoff 行为 14 个来源域、15 条 target=PDM-20 语义承接项；Startup Gate 以 Register 当前全部 target=PDM-20 行逐条接受，不用历史记忆补造。

## 2.3 已识别但不在 Startup Gate 偷渡的后续冲突 / informed changes

- R10 旧“首次进入不自动 owner”不能覆盖 PDM-01 当前 owner 规则；
- R10 旧“我要这辆车”合并咨询/锁车模型不能恢复；
- R10 旧 Priority 客户天然可看详情不能恢复；
- R10 旧批发价“点击查看价格再决定是否扣次数”不能覆盖 PDM-10 当前自动解锁 / quota Authority；
- Current / Low-Fi 中 Consultation `CANCELLED`、旧 Lock/Waitlist 状态壳、旧交易壳只能做 carrier 差异，不得反向改写 completed PDM；
- Banner / Announcement 的运营规则由 PDM-24 承接，PDM-20 仅后续消费客户端投影。

以上进入 Batch 2 / 3 / 4 或 Final 前完整性复核，不在 Startup Gate 自动裁决。

---

# 3. Batch 1｜稳定基础规则候选

> 状态：`PENDING_USER_REVIEW`。  
> 原则：只放“已在 R10 / 历史规则中稳定，且与 PDM-01～19 Final 不冲突”的客户端基础规则。

## P20-A01｜PDM-20 只做 Customer Safe Projection，不反向发明业务状态

客户端页面必须读取真实业务 Authority：

- Customer → PDM-01 / PDM-03；
- Vehicle/listing_cycle → PDM-04；
- Model → PDM-05；
- Archive/车况 → PDM-07；
- 图片 → PDM-08；
- Price → PDM-10；
- Demand → PDM-11；
- Matching / Rule Dictionary → PDM-12；
- Priority → PDM-13；
- Recommendation → PDM-14；
- Consultation → PDM-15；
- LockRequest / Lock / Waitlist → PDM-18；
- Deposit / Transaction / Refund → PDM-19。

客户端文案 / CTA / 页面状态不能创造新的 Domain 主状态。

## P20-A02｜首次进入直接进入客户端，不建设显式登录页

正常首入：

> 微信身份识别 → 创建 / 找到 customer_id → C01 车辆首页。

- 普通公开浏览不要求手机号；
- 头像 / 昵称不作为浏览门槛；
- 人工服务动作的手机号门槛继续服从 PDM-01；
- Customer 停用时公开浏览可继续，但受停用影响的业务/权益 mutation 暂停；
- 身份识别失败只提供失败 + 重试，不新增传统账号密码登录页。

## P20-A03｜客户端车源首页保留三来源频道，默认批发车源

一级来源：

> **批发车源｜名邦车源｜4S 店车源**

默认进入：

> **批发车源**

批发车源页内部可按当前查询条件显示：

1. 名邦机会块；
2. 4S 机会块；
3. 正常批发列表。

机会块无真实匹配时直接隐藏，不自动放宽条件、不塞“最接近车辆”。

## P20-A04｜地域默认全国，彻底废弃 700km 自动扩展

- 默认地域 = 全国；
- 定位城市只做快捷选择，不自动切换；
- 拒绝定位仍正常全国浏览；
- 可手动选择其他城市；
- 同一时刻只使用一个地域条件；
- 地域条件在来源切换 / 搜索 / 详情返回中保持；
- 不恢复“定位城市 → 700km → 全国”自动扩展。

## P20-A05｜客户端搜索与 PDM-12 共用确定性解析字典

搜索框不是普通字符串搜索。

必须复用：

> **PDM-12 Rule Dictionary / deterministic parser**

搜索只消费结构化解析结果，不创建：

- Demand；
- Match Result；
- Priority；
- Recommendation；
- Lock。

车型年款解析与“首次上牌年份”筛选必须保持两个不同字段。

## P20-A06｜车型与筛选语义

车型选择 UI 可以表现为：

> 品牌 → 车系 → 年款分组 → 具体车型

但主数据仍服从 PDM-05，年款不是独立第四级实体。

主筛选至少支持：

> 排序｜品牌/车系｜价格｜年份｜里程｜更多

其中：

- “年份” = 首次上牌年份；
- 价格 = 当前真实客户展示价；
- 明确数字价格区间时，“价格咨询”车辆不参与；
- 里程支持区间 / 单侧；
- 更多支持能源、排量、颜色、变速箱；
- 已选条件使用 chips；
- 删除上级条件时清理依赖子条件；
- 支持重置。

## P20-A07｜排序固定七种，不恢复“综合排序”

排序：

1. 最新上架（默认）
2. 价格低→高
3. 价格高→低
4. 年份新→旧
5. 年份旧→新
6. 里程少→多
7. 里程多→少

规则：

- 最新上架读取当前 listing_cycle 上架时间；
- “年份”读取首次上牌年份；
- 价格咨询排在所有数字价格之后；
- 多台价格咨询再按最新上架；
- 未解锁数字价仍按真实客户展示价参与排序；
- 不恢复“综合排序”。

## P20-A08｜分页、刷新与查询上下文必须稳定

- 每页 15 台；
- 首次 15 台，继续加载每次 +15；
- 下拉刷新保留来源 / 搜索 / 筛选 / 地域 / 排序，并从第 1 页重载；
- 来源切换保留当前查询上下文；
- 列表 → 详情 → 返回时恢复来源 / 搜索 / 筛选 / 地域 / 排序 / 滚动位置；
- 详情动作导致车辆不再符合列表时，只局部移除 / 更新，不重置整个列表。

## P20-A09｜普通 Feed 只投影真实公开可浏览集合

正常 Feed 不显示：

- draft；
- hidden 且无当前合法 Customer visibility；
- offline；
- sold；
- unavailable；
- 未通过必要发布条件的车辆。

但如果 Vehicle 底层仍真实在售：

- 普通 Lock；
- 已有真实 Deposit 的持续占用；
- in-progress Transaction

本身不自动把车辆从公共 Feed 移除。

对其他普通客户只做安全占用投影，不泄露：

- 谁锁的；
- Deposit 金额；
- Transaction 内部进度；
- Customer 身份。

Priority protected Vehicle 不得向无关 Customer 穿透普通 Feed / 搜索 / 分享。

## P20-A10｜公共“在售车源 / 今日新增”统计口径

首页公共统计：

- 不随当前来源 / 搜索 / 筛选变化；
- 在售车源 = 当前客户端真正公开可浏览的全部在售 Vehicle；
- hidden / offline / sold / draft / unavailable 不计；
- 非普通公开可浏览的 Priority protected Vehicle 不计；
- locked / trading 但底层仍公开在售的 Vehicle 仍计入；
- 今日新增 = 今天第一次进入系统并正式公开在售、且当前仍公开可浏览的新 Vehicle；
- 历史 Vehicle relist 不计今日新增；
- 两个数字只展示，不可点击触发筛选。

## P20-A11｜分享直达复用同一车辆详情，不建设第二套详情页

- 普通内部进入与分享直达使用同一套 Vehicle Detail；
- 分享直达态额外提供“查看更多车源”；
- “查看更多车源”进入新的 C01 首页，不恢复分享者查询上下文；
- 分享链接不能绕过当前 visibility / Vehicle state；
- 旧链接对应 Vehicle 已不可公开时，显示“当前车源不可查看” + “查看更多车源”；
- Customer 本人若存在合法历史业务，可从自己的历史业务记录进入历史详情，而不是靠旧公开分享链接穿透。

## P20-A12｜车辆详情只下发 Customer Safe 内容

详情可展示：

- 车型；
- 上牌时间；
- 表显里程；
- 变速箱；
- 排量 / 能源；
- 车身 / 内饰颜色；
- Vehicle 位置；
- 新能源有效扩展字段；
- 客户安全价格；
- 轻量车源类型；
- customer_visible 档案 / 检测报告；
- 真实 provenance 的车况信息；
- 普通车辆图片。

不得向客户端普通详情下发 / 展示：

- VIN；
- 敏感证件原件；
- 内部价 / 批发价；
- 上游电话；
- JYT / 金鱼塘等内部上游名称；
- 内部 Priority / Match 仲裁事实；
- 保障金；
- 其他 Customer 信息。

无 customer_visible 资料时整个资料模块隐藏。

## P20-A13｜车辆图片统一安全序列与 4:3 交互

- 列表主图 4:3；
- 详情轮播 4:3；
- 普通客户可见 Vehicle 图片不再按外观/内饰/细节等强制分类 Tab；
- 统一按顺序左右滑动；
- 支持序号、全屏、双指缩放、双击放大/还原、长按保存；
- 退出全屏返回原图片位置；
- 敏感证件不进入普通轮播。

## P20-A14｜收藏是独立轻量关系，不要求手机号

收藏：

- 不要求手机号；
- 不要求头像/昵称完善；
- 点击后先完成收藏；
- hidden 后收藏关系保留，但不得借收藏穿透 visibility；
- offline / sold 后收藏关系保留并进入历史展示；
- 同一 vehicle_id relist 后收藏关系继续存在；
- 新 listing_cycle 的价格访问权重新判断，不继承旧 cycle price right；
- 收藏不自动创建 Consultation / Recommendation / LockRequest。

## P20-A15｜普通分享只传递安全归因，不传递业务权益

车辆详情使用微信官方分享能力。

分享卡片保持安全：

- 主图；
- 完整车型名；
- 查看详情引导。

不得固化：

- 动态客户展示价；
- 内部价；
- VIN；
- 上游电话；
- Priority / Recommendation / Lock / Transaction 内部事实。

分享链可携带安全、轻量归因上下文。

但：

- 已有 Customer 打开别人分享，不抢原 owner；
- 新 Customer 的归因服从 PDM-03；
- 普通分享不创建 Recommendation；
- 不赠送 price-right；
- 不传播 visibility grant；
- 不传播 Internal Mode；
- 旧分享再次打开必须按当前 Customer + Vehicle + listing_cycle + Priority + visibility Authority 重算。

## P20-A16｜客户端价格只消费 PDM-10 Authority

批发价格客户端投影严格服从 PDM-10：

- LIMITED：列表不泄露精确数字价；
- Customer 真实主动进入详情时按 PDM-10 当前规则自动解锁，不恢复旧“再点一次查看价格”主流程；
- quota 耗尽时主价格字段使用 PDM-10 当前安全表现，不伪造数字价格；
- UNLIMITED：列表/详情按 Authority 直接显示可显示数字价；
- Vehicle 本身没有有效数字价才显示“价格咨询”；
- 搜索 / 筛选 / 排序可使用真实客户展示价做服务端判断，但未授权 payload 不得泄露该数字；
- Customer disable 时价格权益暂停，页面只投影当前真实 Authority。

## P20-A17｜C02 是多对象找车工作区，不重新发明 Demand 状态

C02 可同时投影：

- pending Application；
- active / paused Demand；
- Recommendation；
- completed / cancelled history。

规则：

- Application 最低必填“想找什么车”；
- pending 可编辑 / 撤回；
- entitlement 不足时仍服从 PDM-11 当前 application / activation 规则，不在客户端写死“只有粉丝/VIP”；
- active 可暂停；
- paused 可恢复；
- Customer 请求结束 Demand 时投影“结束处理中”等真实请求过程，不制造 Demand 第五主状态；
- Recommendation 卡片进入统一 Vehicle Detail 后再走当前合法 CTA。

## P20-A18｜C03「我的」只投影真实对象，不混合状态机

客户端“我的”可承载：

- 我的收藏；
- 我的推荐；
- 我的咨询；
- 我的 Lock / Waitlist；
- 我的交易；
- 公告入口；
- 个人资料；
- 我的顾问；
- 推荐朋友 / 转介绍入口。

其中：

- “我的推荐”只展示正式 Recommendation；
- Consultation 只投影 PDM-15 四主状态 + close_reason，不恢复第五主状态；
- LockRequest / Lock / Waitlist 按 PDM-18 当前/历史真实状态投影；
- Transaction / Deposit / Refund 按 PDM-19 Customer Safe Projection；
- Priority / Match Result 等内部对象不直接暴露给 Customer；
- 若没有合法顾问，显示“暂无服务顾问”；
- 打开个人资料本身不得自动分配 owner。

---

# 4. Batch 1 Gate

当前：

- `P20-A01～P20-A18 = PENDING_USER_REVIEW`
- `STABLE_RULE_CONFLICT_COUNT = 0`
- `DUPLICATE_BUSINESS_AUTHORITY = 0`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

当前唯一下一步：

> **用户审查 P20-A01～P20-A18。未经用户批准与后续明确执行，不得进入 Batch 2。**
