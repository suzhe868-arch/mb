# PDM-20｜客户端浏览 / 搜索 / 筛选 / 排序 / 列表 / 详情 / 收藏 / 分享 / 个人中心 / 地域｜规则原子重建工作版

> 当前状态：`COMPLETE / INTEGRITY_PASS`  
> 核心定位：`P20-R00 = USER_APPROVED / APPLIED`  
> Incoming Handoff：14 / 14 `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`  
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
- `INCOMING_HANDOFF_COUNT = 14`
- `INCOMING_HANDOFF_ACCEPTED = 14`

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

> 注：Register 中 target=PDM-20 的正式 handoff **实际为 14 条**。Startup Gate 以 Register 当前 14 行逐条接受，不把同一 handoff 内的多个语义拆成虚假的第 15 条。

## 2.3 已识别但不在 Startup Gate 偷渡的后续冲突 / informed changes

- R10 旧“首次进入不自动 owner”不能覆盖 PDM-01 当前 owner 规则；
- R10 旧“我要这辆车”合并咨询/锁车模型不能恢复；
- R10 旧 Priority 客户天然可看详情不能恢复；
- R10 旧批发价“点击查看价格再决定是否扣次数”不能覆盖 PDM-10 当前自动解锁 / quota Authority；
- Current / Low-Fi 中 Consultation `CANCELLED`、旧 Lock/Waitlist 状态壳、旧交易壳只能做 carrier 差异，不得反向改写 completed PDM；
- Banner / Announcement 的运营规则由 PDM-24 承接，PDM-20 仅后续消费客户端投影。

以上进入 Batch 2 / 3 / 4 或 Final 前完整性复核，不在 Startup Gate 自动裁决。

---

# 3. Batch 1｜稳定基础规则｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED`。  
> 用户裁决：`P20-A01～P20-A18 = 全部同意`；随后明确“确认执行”。  
> 原则：只放“已在 R10 / 历史规则中稳定，且与 PDM-01～19 Final 不冲突”的客户端基础规则。

## P20-A01｜PDM-20 只做 Customer Safe Projection，不反向发明业务状态｜USER_APPROVED / APPLIED

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

## P20-A02｜首次进入直接进入客户端，不建设显式登录页｜USER_APPROVED / APPLIED

正常首入：

> 微信身份识别 → 创建 / 找到 customer_id → C01 车辆首页。

- 普通公开浏览不要求手机号；
- 头像 / 昵称不作为浏览门槛；
- 人工服务动作的手机号门槛继续服从 PDM-01；
- Customer 停用时公开浏览可继续，但受停用影响的业务/权益 mutation 暂停；
- 身份识别失败只提供失败 + 重试，不新增传统账号密码登录页。

## P20-A03｜客户端车源首页保留三来源频道，默认批发车源｜USER_APPROVED / APPLIED

一级来源：

> **批发车源｜名邦车源｜4S 店车源**

默认进入：

> **批发车源**

批发车源页内部可按当前查询条件显示：

1. 名邦机会块；
2. 4S 机会块；
3. 正常批发列表。

机会块无真实匹配时直接隐藏，不自动放宽条件、不塞“最接近车辆”。

## P20-A04｜地域默认全国，彻底废弃 700km 自动扩展｜USER_APPROVED / APPLIED

- 默认地域 = 全国；
- 定位城市只做快捷选择，不自动切换；
- 拒绝定位仍正常全国浏览；
- 可手动选择其他城市；
- 同一时刻只使用一个地域条件；
- 地域条件在来源切换 / 搜索 / 详情返回中保持；
- 不恢复“定位城市 → 700km → 全国”自动扩展。

## P20-A05｜客户端搜索与 PDM-12 共用确定性解析字典｜USER_APPROVED / APPLIED

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

## P20-A06｜车型与筛选语义｜USER_APPROVED / APPLIED

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

## P20-A07｜排序固定七种，不恢复“综合排序”｜USER_APPROVED / APPLIED

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

## P20-A08｜分页、刷新与查询上下文必须稳定｜USER_APPROVED / APPLIED

- 每页 15 台；
- 首次 15 台，继续加载每次 +15；
- 下拉刷新保留来源 / 搜索 / 筛选 / 地域 / 排序，并从第 1 页重载；
- 来源切换保留当前查询上下文；
- 列表 → 详情 → 返回时恢复来源 / 搜索 / 筛选 / 地域 / 排序 / 滚动位置；
- 详情动作导致车辆不再符合列表时，只局部移除 / 更新，不重置整个列表。

## P20-A09｜普通 Feed 只投影真实公开可浏览集合｜USER_APPROVED / APPLIED

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

## P20-A10｜公共“在售车源 / 今日新增”统计口径｜USER_APPROVED / APPLIED

首页公共统计：

- 不随当前来源 / 搜索 / 筛选变化；
- 在售车源 = 当前客户端真正公开可浏览的全部在售 Vehicle；
- hidden / offline / sold / draft / unavailable 不计；
- 非普通公开可浏览的 Priority protected Vehicle 不计；
- locked / trading 但底层仍公开在售的 Vehicle 仍计入；
- 今日新增 = 今天第一次进入系统并正式公开在售、且当前仍公开可浏览的新 Vehicle；
- 历史 Vehicle relist 不计今日新增；
- 两个数字只展示，不可点击触发筛选。

## P20-A11｜分享直达复用同一车辆详情，不建设第二套详情页｜USER_APPROVED / APPLIED

- 普通内部进入与分享直达使用同一套 Vehicle Detail；
- 分享直达态额外提供“查看更多车源”；
- “查看更多车源”进入新的 C01 首页，不恢复分享者查询上下文；
- 分享链接不能绕过当前 visibility / Vehicle state；
- 旧链接对应 Vehicle 已不可公开时，显示“当前车源不可查看” + “查看更多车源”；
- Customer 本人若存在合法历史业务，可从自己的历史业务记录进入历史详情，而不是靠旧公开分享链接穿透。

## P20-A12｜车辆详情只下发 Customer Safe 内容｜USER_APPROVED / APPLIED

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

## P20-A13｜车辆图片统一安全序列与 4:3 交互｜USER_APPROVED / APPLIED

- 列表主图 4:3；
- 详情轮播 4:3；
- 普通客户可见 Vehicle 图片不再按外观/内饰/细节等强制分类 Tab；
- 统一按顺序左右滑动；
- 支持序号、全屏、双指缩放、双击放大/还原、长按保存；
- 退出全屏返回原图片位置；
- 敏感证件不进入普通轮播。

## P20-A14｜收藏是独立轻量关系，不要求手机号｜USER_APPROVED / APPLIED

收藏：

- 不要求手机号；
- 不要求头像/昵称完善；
- 点击后先完成收藏；
- hidden 后收藏关系保留，但不得借收藏穿透 visibility；
- offline / sold 后收藏关系保留并进入历史展示；
- 同一 vehicle_id relist 后收藏关系继续存在；
- 新 listing_cycle 的价格访问权重新判断，不继承旧 cycle price right；
- 收藏不自动创建 Consultation / Recommendation / LockRequest。

## P20-A15｜普通分享只传递安全归因，不传递业务权益｜USER_APPROVED / APPLIED

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

## P20-A16｜客户端价格只消费 PDM-10 Authority｜USER_APPROVED / APPLIED

批发价格客户端投影严格服从 PDM-10：

- LIMITED：列表不泄露精确数字价；
- Customer 真实主动进入详情时按 PDM-10 当前规则自动解锁，不恢复旧“再点一次查看价格”主流程；
- quota 耗尽时主价格字段使用 PDM-10 当前安全表现，不伪造数字价格；
- UNLIMITED：列表/详情按 Authority 直接显示可显示数字价；
- Vehicle 本身没有有效数字价才显示“价格咨询”；
- 搜索 / 筛选 / 排序可使用真实客户展示价做服务端判断，但未授权 payload 不得泄露该数字；
- Customer disable 时价格权益暂停，页面只投影当前真实 Authority。

## P20-A17｜C02 是多对象找车工作区，不重新发明 Demand 状态｜USER_APPROVED / APPLIED

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

## P20-A18｜C03「我的」只投影真实对象，不混合状态机｜USER_APPROVED / APPLIED

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

- `P20-A01～P20-A18 = PASS / USER_APPROVED / APPLIED`
- `STABLE_RULE_CONFLICT_COUNT = 0`
- `DUPLICATE_BUSINESS_AUTHORITY = 0`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

当前唯一下一步：

> **P20-A01～P20-A18 已批准并执行。当前唯一下一步：用户审查 Batch 2（P20-B2-01～P20-B2-09）。未经确认不得进入 Batch 3。**

---

# 5. Batch 1 Gate｜PASS

- 用户裁决：`P20-A01～P20-A18 = 全部同意`；
- 执行授权：用户随后明确“确认执行”；
- `BATCH_1 = PASS / USER_APPROVED / APPLIED`；
- 18 条稳定基础规则已进入当前工作 Authority；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 6. Batch 2｜明确废弃 / Superseded / DO_NOT_RESTORE｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED`。  
> 用户裁决：`P20-B2-01～P20-B2-09 = 全部同意`；随后以“确认指型”明确执行。  
> Reverse Conflict Scan：`PASS / FALSE_DEPRECATION_COUNT=0`。  
> 原则：只登记已被 R10 后续冻结、PDM-10/13/14/15/18 等 completed Authority 明确覆盖或禁止恢复的旧客户端方向；“Current/Low-Fi 缺承载”的能力不在本批误判为废弃。

## P20-B2-01｜“默认定位城市 / 700km 自动扩展”不得恢复｜USER_APPROVED / APPLIED

旧客户端地域曾采用：

- 默认定位城市；
- 定位城市无结果后自动扩到周边 700km；
- 再自动扩全国。

R10 后续已明确覆盖为：

> **默认全国。**

当前正式口径：

- 定位城市只作为用户主动选择的快捷地域条件；
- 拒绝定位仍全国浏览；
- 不进行自动 700km 扩展；
- 不因结果少而偷偷扩大地域。

因此：

> **默认定位城市 + 700km 自动扩展 = SUPERSEDED / DO_NOT_RESTORE。**

## P20-B2-02｜“综合排序”不得恢复｜USER_APPROVED / APPLIED

R10 已明确删除：

> **综合排序**

当前客户端排序使用明确、可解释的排序条件：

- 最新上架；
- 价格升/降；
- 首次上牌年份升/降；
- 里程升/降。

不得重新增加一个含义不透明、可以偷偷混入权重的“综合排序”。

因此：

> **综合排序 = DO_NOT_RESTORE。**

## P20-B2-03｜旧“我要这辆车”合并咨询 + 锁车语义不得恢复｜USER_APPROVED / APPLIED

旧客户端曾用一个：

> **“我要这辆车”**

同时承载咨询 / 购车意向 / 锁车等多种语义。

PDM-15 / PDM-18 已明确拆分：

- 沟通车辆 → Consultation / “咨询”；
- 锁车 → LockRequest / Lock；
- Recommendation → Employee 正式推荐。

因此客户端不得重新用一个按钮同时创建 / 触发多类正式业务对象。

> **旧“我要这辆车”混合入口 = SUPERSEDED / DO_NOT_RESTORE。**

## P20-B2-04｜Consultation `CANCELLED` 第五主状态不得恢复｜USER_APPROVED / APPLIED

PDM-15 正式 Consultation 主状态只有：

- pending；
- processing；
- resolved；
- invalid。

客户撤回 / 正常关闭：

> `resolved + close_reason`

客户端可以显示“已取消 / 已撤回 / 已关闭”等文案，但：

> **UI 文案不得反向创造 `CANCELLED` 第五 Domain 主状态。**

因此 Current/Low-Fi 若仍保留 CANCELLED carrier，只能作为 stale display carrier 后续对齐。

## P20-B2-05｜Priority 自动授客户详情 visibility / 客户端暴露 Priority 内部术语不得恢复｜USER_APPROVED / APPLIED

PDM-13 已明确禁止：

- Priority 自动给 Customer 详情 visibility；
- 客户端暴露 Priority / 优先保护 / 客户专属 / 内部仲裁等术语。

Priority Customer 本人也不能仅凭 Priority 就自动打开详情；必须读取 Recommendation / visibility grant / 当前合法访问 Authority。

因此：

> **“有 Priority = 客户天然可看详情”与“客户端展示 Priority 内部身份”均 = DO_NOT_RESTORE。**

## P20-B2-06｜LIMITED 客户“进入详情后再点一次查看价格”不得恢复｜USER_APPROVED / APPLIED

PDM-10 已明确取消：

> **进入详情后再次点击“查看价格”才解锁 / 扣额**

当前 LIMITED 客户：

- 真实主动进入批发车详情；
- Guard 合法；
- 有数字客户价；
- 有 quota / 免费权；

则按 PDM-10 自动完成本周期首次价格解锁。

客户端不得恢复二次点击为强制主流程，也不得借“预加载”偷扣 quota。

因此旧二次查看价流程：

> `SUPERSEDED / DO_NOT_RESTORE`

## P20-B2-07｜普通分享固定 TTL / 权限继承链 / 第二套 Share Detail 不得恢复｜USER_APPROVED / APPLIED

PDM-14 已明确：

- 普通 Vehicle share link **无固定 N 天 TTL**；
- 再转发不继承上一 Customer 的 Recommendation / price-right / visibility / Internal Mode；
- 普通 share 不创建 Recommendation；
- share 不能改变已有 owner；
- SHARE_DIRECT 使用统一 Vehicle Detail，不建立第二套 Share Detail 业务状态机。

因此以下旧方向均不得恢复：

- 普通分享固定 3 天 / 7 天 / N 天过期；
- A 分享给 B 后 B 继承 A 的查价权 / visibility / Recommendation；
- 分享页维护独立的业务状态机；
- 旧 share link 穿透 hidden / Priority / offline / sold。

## P20-B2-08｜Waitlist 客户端保证性排名 / 自动晋升不得恢复｜USER_APPROVED / APPLIED

PDM-18 已明确：

- Waitlist 内部可以有稳定处理顺序；
- 但不代表“第几名就一定获得下一笔 Lock”；
- 原占用 Lock release/expiry/cancel 后，不自动把下一位升级成 Lock；
- V1 客户端不展示保证性“第1名 / 第2名”。

因此客户端不得恢复：

- “你排第 N 名”作为保证承诺；
- 候补按排名自动晋升锁车；
- 候补顺序直接等同正式 Lock 优先权。

> **保证性排名 / 自动晋升 = DO_NOT_RESTORE。**

## P20-B2-09｜LockRequest 客户端主动撤回 / 独立申请进度详情页不得恢复｜USER_APPROVED / APPLIED

PDM-18 已冻结 V1 边界：

- 客户端不提供 LockRequest 主动 cancel / withdraw；
- 不建设独立 LockRequest 申请进度详情页；
- 当前页面 / “我的”只投影真实申请结果与 Lock / Waitlist 状态。

因此旧方向：

- 客户在独立“锁车申请详情”里主动撤回 pending LockRequest；
- 为 LockRequest 单独建设一套完整进度中心；

当前均：

> **DO_NOT_RESTORE。**

这不影响客户端在“我的”里看到必要的真实结果摘要。

---

## 6.1 Reverse Conflict Scan

本轮没有把以下有效能力误判为废弃：

- 客户端定位权限本身；
- 用户主动选择城市；
- 七种明确排序；
- Search / Rule Dictionary；
- 分享功能；
- “查看更多车源”；
- Consultation 客户撤回这个真实动作；
- Priority 排他业务本身；
- LIMITED 查价权益本身；
- Waitlist 当前/历史展示；
- LockRequest 创建与结果投影；
- Customer Safe historical detail；
- 我的推荐 / 我的咨询 / 我的锁车候补 / 我的交易。

因此：

- `FALSE_DEPRECATION_COUNT = 0`
- `BATCH_2_CONFLICT_SCAN = PASS`

当前唯一下一步：

> **P20-B2-01～P20-B2-09 已批准并执行。当前唯一下一步：用户审查 Batch 3（P20-B3-01～P20-B3-08）。未经确认不得进入 Batch 4。**

---

## 6.2 Batch 2 Gate｜PASS

- `P20-B2-01～P20-B2-09 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS`；
- `FALSE_DEPRECATION_COUNT = 0`；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 7. Batch 3｜后续明确新增 / 明确变更｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED`。  
> 用户裁决：`P20-B3-01～P20-B3-08 = 全部同意`；随后明确“确认执行”。  
> Conflict Isolation：`PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`。  
> 原则：只收录 completed PDM 已明确冻结、相对于旧 R10 / Current 属于后续明确新增或明确变更的客户端语义；Current/Low-Fi 单纯缺页面、缺字段、缺导航等留 Batch 4 / Final 前完整性复核。

## P20-B3-01｜首次进入后 Customer owner 规则改为“优先来源，否则立即轮询”｜USER_APPROVED / APPLIED

PDM-01 / PDM-03 后续已明确覆盖旧首入模型：

- 微信身份识别成功后创建 / 找到 customer_id；
- 先判断有效分享 / 转介绍等优先归属来源；
- 有合法优先来源 → 按该来源形成唯一 current owner；
- 无优先来源 → 立即进入 `active + eligible + accepting` 接客池轮询；
- 不再等待第一次咨询 / 找车 / 锁车等人工服务动作才分配 owner；
- 只有接客池异常为 0 时，才允许 `owner_assignment_pending`；
- 页面打开 / 刷新 / 重试不得重复改 owner。

客户端因此不得继续投影旧“刚进入暂时没有 owner、等以后服务动作再分配”的正常主流程。

若确实处于 pool-empty 异常：

> 可以显示“暂无服务顾问 / 服务顾问分配中”类安全结果，但不得让 System Admin 临时冒充 owner。

## P20-B3-02｜客户车源分享 / 直接转介绍可以形成 ownerless 新客户的销售归属｜USER_APPROVED / APPLIED

PDM-03 后续已明确修改“普通客户分享只记 SOURCE_ONLY”的旧规则。

对 ownerless 新客户 B：

### 明确销售绑定分享上下文
- A 转发绑定销售 S 的链接 → B 归 S；
- S 必须仍 active + eligible；
- S 仅暂停 accepting 不影响本人主动分享获客。

### 客户 A 自己的分享上下文
- 保存 A→B 直接来源 / 推荐关系；
- B 在有效进入时读取 **A 当时的 current owner**；
- B 归 A 当时的 current owner；
- A 以后 owner 变化，只影响之后新发生的分享进入，不回写旧 B。

### 已有 owner 的客户
- 后续任何普通分享不得抢原 owner。

直接转介绍也采用：

> 新客户由推荐人在事件发生时的 current owner 承接。

V1 只保留直接关系，不做多级归属 / 佣金 / 积分。

客户端 P20 因此必须提供真实“推荐朋友 / 直接转介绍”入口与安全归因，但不能把分享本身变成 Recommendation。

## P20-B3-03｜客户点击“锁车”只创建 / 复用 LockRequest.PENDING｜USER_APPROVED / APPLIED

9 月 22 日后的 LockRequest 规则已经明确变更客户端锁车入口：

客户点击“锁车”：

> 创建 / 复用 `LockRequest.PENDING`

而不是：

- 直接形成正式 Lock；
- 直接占车；
- 直接开始 Lock 72h；
- 直接冻结 Lock price snapshot。

LockRequest PENDING 最长：

> **6 小时**

合法结果包括：

- APPROVED；
- REJECTED；
- EXPIRED；
- LOCK_CONFLICT；
- CLOSED_NOT_LOCKABLE。

客户端详情 / “我的”只投影真实结果，不自己创造额外申请主状态。

## P20-B3-04｜竞争 LockRequest 失败后自动创建 / 复用 Waitlist｜USER_APPROVED / APPLIED

PDM-18 后续明确新增：

当同一 Vehicle + listing_cycle 的某一 LockRequest 首先合法 approve 并成功创建正式 Lock 后：

- 其他仍有效、且仅因该 Lock 成立失去机会的 PENDING → `LOCK_CONFLICT`；
- 同时自动创建 / 复用 Waitlist；
- 客户不需要再次点击“登记候补”；
- LockRequest 本体仍保留 LOCK_CONFLICT，不直接改成 Waitlist 状态；
- 如果车辆已经 sold / offline / unavailable / cycle ended，不机械创建 Waitlist。

客户端应安全展示：

- 锁车申请未成功；
- 已进入候补 / 等待确认（如 Waitlist 实际成立）；

但不得展示保证性排名或自动晋升承诺。

## P20-B3-05｜普通 Lock 与 Priority-origin Lock 的客户端可见性必须分开｜USER_APPROVED / APPLIED

PDM-18 后续已明确两种正式 Lock 的客户侧可见性不同。

### 普通 VIP / 粉丝直接 Lock
- 只形成正式占车；
- Vehicle 底层仍公开在售时，其他合法普通 Customer 仍可看到该车；
- 对其他人显示安全“已锁定”；
- 其他人可按合法 Waitlist 规则候补。

### Priority-origin Lock
当 active Priority Customer 转成正式 Lock：
- Priority 本体 ended；
- Lock 继承该客户原 Priority 的客户侧排他 visibility；
- Lock 有效期间，除该 Lock Customer 外，其他普通 Customer 不进入普通公开列表 / 详情；
- 内部 Employee / PC / Matching 继续读取真实 Vehicle 与占用事实；
- 竞争 PENDING 可以形成 Waitlist，但 Waitlist 本身不恢复普通 Vehicle Detail。

因此客户端不能使用“一切 Lock 都公开显示已锁定”或“一切 Lock 都隐藏”这种单一规则。

## P20-B3-06｜真实 Deposit 后，客户自己的 Lock 不再展示普通倒计时｜USER_APPROVED / APPLIED

PDM-18 / PDM-19 后续明确：

普通无 Deposit 的 Lock：

- 客户可看到当前 expires_at；
- 默认新 Lock 时长 72h，后台可配置；
- 员工合法延期后显示新的 expires_at / 已延期。

一旦该 Lock 已存在真实 Deposit：

- 不得仅因普通 expires_at 自动释放；
- 客户端不再继续把普通倒计时当作“到点一定释放”的承诺；
- “我的锁车 / 交易”可安全展示：
  > **已支付意向金 · 车辆持续锁定中**
- 可以展示该 Customer 自己真实支付的 Deposit 事实 / 金额；
- 不得向其他 Customer 泄露 Deposit 金额。

本条只负责客户端投影，不重新定义资金 / Lock lifecycle。

## P20-B3-07｜C02 找车改为“Application 先 pending，Demand 人工激活 + 客户结束请求”｜USER_APPROVED / APPLIED

PDM-11 已明确新增 / 修改客户端找车流程：

### 所有 Customer 都可以提交 Application
- 最低必填“想找什么车”；
- 无正式 find-car entitlement 的 Customer 也能提交；
- Application 先进入 pending；
- 不自动创建 active Demand。

### 已有 entitlement 也不再自动 active
- 正式 Demand 只能由有权限员工人工激活；
- 等级升级只恢复“具备被激活资格”，不会自动激活旧 pending Application。

### 客户结束 Demand
- 客户点击“结束找车”不直接猜 completed / cancelled；
- 创建待员工确认的结束请求；
- Demand 主状态暂时保持 active / paused；
- 客户端可以展示派生：
  > **结束处理中**
- “结束处理中”不是第五个 Demand 主状态。

### 动态等级提示
- 文案读取当前 Customer Level 配置；
- 不永久写死“粉丝 / VIP 才能找车”。

P20 必须投影这套真实流程，而不是恢复旧单状态“找车页”。

## P20-B3-08｜“我的交易”新增 Refund `closed` 与 PDM-19 Customer Safe Projection｜USER_APPROVED / APPLIED

PDM-19 后续已把资金 / 交易模型进一步收口，客户端“我的交易”必须消费这些新事实：

### Transaction
- `in_progress / completed / cancelled`；
- completed / cancelled 为历史终态；
- Transaction cancel 不复活旧 Lock / Waitlist；
- Customer 只看安全 Vehicle 摘要、状态、时间、当前负责人等本人相关信息。

### Deposit
- 展示 Customer 自己真实 Deposit 事实；
- 不展示内部资金权限 / correction 权限；
- 多笔 Deposit / correction 由 PDM-19 计算真实结果。

### Refund
当前正式主状态：
- `pending`
- `refunded`
- `closed`

其中：
- `closed` = 决定不再退款而关闭；
- 不得把 closed 显示成“已退款”；
- 实际当场已经退款可以直接 refunded，不要求先出现假的 pending；
- 只展示 Customer 自己相关退款事实。

客户端不得暴露：

- 内部审批 / permission；
- 其他 Customer；
- 内部资金操作细节；
- correction 内部治理字段。

---

## 7.1 Conflict Isolation

以下内容没有偷渡到 Batch 3：

- C01/C03 当前缺失的具体 Navigation；
- “我的交易 / 我的顾问 / 我的推荐 / 我的咨询 / 我的锁车候补”真人页面具体字段排版；
- 客户详情当前顾问模块；
- customer_visible 档案 / 检测报告模块；
- 车况来源模块；
- “服务 / 购买说明”及 PC 配置；
- 首页统计/来源切换/机会块 Current carrier 缺失；
- 分享标题模板与默认分享图配置；
- 通用 loading/error/retry；
- 复制权限合同；
- 图片全屏细节；
- 价格“万”显示格式与顶部 back/home 的具体 visual contract。

这些多数是历史规则仍有效但 Current / Low-Fi 未完整投影，属于 Batch 4 / Final 前完整性修复，不属于“后续新增 / 明确变更”。

因此：

- `NEW_INDEPENDENT_ATOMS = 8`
- `DUPLICATE_RULE_CREATION = 0`
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`
- `BATCH_3 = P20-B3-01～P20-B3-08 / PASS / USER_APPROVED / APPLIED`

当前唯一下一步：

> **P20-B3-01～P20-B3-08 已批准并执行。当前唯一下一步：用户审查 Batch 4（P20-B4-01～P20-B4-10）。**

---

## 7.2 Batch 3 Gate｜PASS

- `P20-B3-01～P20-B3-08 = PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation = `PASS`；
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 8. Batch 4｜冲突 / 遗漏 / 语义缺口 / 最终裁决｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED / CHOICES=1A,2A,3A,4A,5A,6A,7A,8A,9A,10A`。  
> 用户裁决：`全部同意`，按推荐 `1A～10A`；随后明确“确认执行”。  
> 本批不再重开已完成 PDM 的底层业务规则，只补 PDM-20 客户端 Authority 中尚未完整冻结的真实页面行为。  
> 建议：`1A～10A`。

## P20-B4-01｜车辆详情 / 分享直达 CTA 状态矩阵｜CHOICE=A / USER_APPROVED / APPLIED

### A｜按真实对象分离 CTA（推荐）

普通内部 Vehicle Detail 底部：

> **收藏｜咨询｜锁车/候补/当前业务状态**

分享直达额外增加：

> **更多车源｜收藏｜咨询｜锁车/候补/当前业务状态**

其中：

- 正常可售且可申请锁车 → “锁车”；
- 当前 Customer 已有 LockRequest.PENDING → 显示“锁车申请中”类状态，不再重复创建；
- 他人普通 Lock 且当前 Customer 未候补 → “候补”；
- 当前 Customer 已有 Waitlist → “候补中 / 我的候补”；
- 当前 Customer 自己已有 active Lock → “我的锁车 / 已锁定”；
- 当前 Customer 自己已有 in-progress Transaction → “查看交易”；
- 他人普通 Lock / trading 但 Vehicle 仍公开时，Consultation 仍可独立存在，锁车位只显示合法占用/候补动作；
- Priority-origin Lock 对无关 Customer 本身不可进入普通详情，因此不出现可绕过的 CTA；
- sold/offline/unavailable/history → 只读，不创建新 Consultation / LockRequest / Waitlist。

“咨询”与“锁车”始终是两个独立动作；收藏也不自动创建任何正式业务对象。

### B｜重新合并为一个主按钮

不推荐；会重新制造旧“我要这辆车”混合语义。

**建议：A。**

## P20-B4-02｜客户列表占用标签采用单一最高优先级｜CHOICE=A / USER_APPROVED / APPLIED

### A｜固定优先级（推荐）

同一 Vehicle 对当前 Customer 命中多个关系时，列表只展示一个最高优先级客户视角标签：

1. **我的交易**
2. **我的锁车**
3. **我的候补**
4. **已锁定**

规则：

- 普通 Lock / 有真实 Deposit 的持续占用 / in-progress Transaction，只要底层仍公开在售，就不因占用本身从普通 Feed 消失；
- 对其他 Customer 统一隐藏 Customer、Deposit、Transaction 内部细节；
- Priority-origin Lock 的排他可见性优先，其他普通 Customer 不进入普通 Feed/详情；
- sold/offline/unavailable 才按 Vehicle Authority 离开正常在售 Feed。

### B｜允许堆叠多个标签

不推荐；容易同时出现“我的锁车 / 我的候补 / 已锁定”等冲突表达。

**建议：A。**

## P20-B4-03｜车辆详情顾问 / 参数 / 档案 / 车况 / 来源标签｜CHOICE=A / USER_APPROVED / APPLIED

### A｜恢复完整 Customer Safe Detail Contract（推荐）

#### 核心参数
固定优先展示：

1. 上牌时间；
2. 表显里程；
3. 变速箱；
4. 排量 / 能源；
5. 车身 / 内饰颜色；
6. 车辆位置。

新能源有真实有效数据时追加：

- 电池容量；
- 纯电续航；
- 总功率。

无有效数据：

> 整项隐藏，不显示 `--`、0 或空白占位。

#### 当前顾问
Vehicle Detail 当前顾问优先级：

1. 当前 Vehicle 相关合法业务 responsible；
2. Customer current owner；
3. 都没有 → “暂无服务顾问”。

打开详情不得因此自动分配 owner。

#### 客户可见档案
只展示 `customer_visible`：

- 检测报告；
- 合法客户可见档案 / 资料。

无可见资料：

> 整块隐藏。

不得泄露 VIN、绿本/行驶证等敏感原件、内部文件。

#### 车况
- JYT/批发：只能按“上游事实车况/描述”展示，不包装成名邦检测、认证、质保；
- 名邦/4S：展示员工真实维护车况；
- 无数据整块隐藏；
- 名邦真实检测报告继续作为独立 customer_visible 档案。

#### 来源标签
只使用轻量不可点击：

- 批发车源；
- 名邦车源；
- 4S店车源。

不得显示 JYT / 金鱼塘等内部上游名称。

### B｜维持“基本信息”泛化壳

不推荐；无法防止字段漏失和 provenance 混淆。

**建议：A。**

## P20-B4-04｜C03「我的」必须是真实主导航与业务历史页，不保留通用壳｜CHOICE=A / USER_APPROVED / APPLIED

### A｜补齐真实入口和字段（推荐）

C03 一级必须可进入：

- 我的收藏；
- 我的推荐；
- 我的咨询；
- 我的锁车/候补；
- 我的交易；
- 个人资料/我的顾问；
- 推荐朋友/直接转介绍；
- 公告入口。

#### 我的推荐
至少展示：

- Vehicle；
- Recommendation 时间；
- recommender；
- source Demand（如有）；
- 当前 Vehicle 状态；
- 当前 listing_cycle 价格访问状态；
- 历史 Recommendation 只读保留。

不得混入 Match candidate / Source Radar / Priority。

#### 我的咨询
至少展示：

- Vehicle；
- Consultation 创建时间；
- 当前状态；
- 当前 assignee / 顾问；
- source；
- resolved/invalid 的真实结束事实与必要原因；
- 当前 / 历史分区。

#### 我的锁车/候补
至少展示：

- 当前 / 历史；
- 普通 Lock expires_at；
- 合法延期后的新 expires_at / 已延期；
- 已支付真实 Deposit 后切换为持续锁定表达；
- Customer 自己的真实 Deposit 金额（如适用）；
- Waitlist 当前/历史；
- 不展示保证性排名。

#### 我的交易
至少展示：

- 当前交易；
- completed；
- cancelled；
- Vehicle；
- created_at；
- 当前 responsible；
- Customer 自己的 Deposit / Refund 安全事实。

#### 个人资料 / 我的顾问
至少展示：

- 头像；
- 昵称；
- 手机号；
- current owner / 顾问；
- 无顾问 → “暂无服务顾问”；
- “推荐朋友 / 直接转介绍”真实入口。

### B｜继续使用“当前记录/历史记录/对象摘要”通用壳

不推荐；无法成为可开发、可验收的客户端业务合同。

**建议：A。**

## P20-B4-05｜车辆详情统一“服务 / 购买说明”｜CHOICE=A / USER_APPROVED / APPLIED

### A｜恢复单一全局模块（推荐）

客户端 Vehicle Detail 只保留一个：

> **服务 / 购买说明**

规则：

- 客户端消费后台当前有效的一份全局内容；
- 内容为空 → 整个模块隐藏；
- 不拆成“购车流程 / 过户说明 / 交易流程 / 质保说明”等多个重复模块；
- 不建设服务费计算器；
- 不计算物流费 / 检测费 / 过户费报价 / 预计到手价。

后台配置、富文本、Word 基础格式兼容、清理危险 HTML / style / script、修改审计由后续 PC Authority 承接；PDM-20 只冻结客户侧消费与隐藏规则。

### B｜取消该模块

不推荐；与 R10-60 明确历史规则冲突。

**建议：A。**

## P20-B4-06｜普通分享内容采用轻量安全配置，不把营销文案写死｜CHOICE=A / USER_APPROVED / APPLIED

### A｜轻量模板 + 安全图片选择（推荐）

Vehicle 分享：

- 使用微信官方分享能力；
- 标题使用轻量可配置模板；
- 不把某一句营销标题写成永久 SSOT；
- 分享图片优先首张当前合法、真实可用 Vehicle 图片；
- 没有可用真实车图 → 使用统一默认分享图；
- 模板只能使用 Customer Safe 白名单字段；
- 不允许拼入客户展示价、内部价、VIN、电话、Priority/Recommendation/Lock/Transaction 内部状态。

首页 / 品牌层分享标题与分享图可在后续对应配置 Authority 中轻量配置。

同时：

> 首页 / 列表卡片不增加独立分享快捷按钮；车辆分享从 Vehicle Detail 完成。

不建设无限通用模板引擎。

### B｜固定写死一句营销标题

不推荐；后续改文案必须改代码且与 DEC-068 冲突。

**建议：A。**

## P20-B4-07｜历史详情只读 + 旧分享链接按当前事实实时重算｜CHOICE=A / USER_APPROVED / APPLIED

### A｜严格区分公开分享与本人历史（推荐）

- sold/offline/cycle-ended Vehicle 不再进入正常在售 Feed；
- Customer 如果自己存在 Recommendation / Consultation / Lock / Transaction 等合法历史关系，可从“我的”进入 Customer Safe Historical Detail；
- Historical Detail 只读；
- 不从历史页创建新的 Consultation / LockRequest / Waitlist / Transaction；
- 旧 share link 永远不是永久访问 grant；
- Vehicle 当前对接收人不可公开时 → “当前车源不可查看” + “查看更多车源”；
- 同一 vehicle_id 后续进入新的 listing_cycle 且当前重新公开可见时，旧普通 share 可以继续作为 Vehicle 导航入口，但所有 visibility / price-right / Lock 等按新 cycle 当前事实重新计算；
- Customer 自己的历史访问权仍从“我的历史”入口判断，不靠旧公开 share 穿透。

### B｜旧 share 永久绑定当时详情

不推荐；会穿透后续 hidden/offline/sold/Priority 和新 cycle 权限。

**建议：A。**

## P20-B4-08｜手机号授权拒绝后的找车表单只做页面临时保真｜CHOICE=A / USER_APPROVED / APPLIED

### A｜临时保留当前填写内容，不创建服务端草稿（推荐）

Customer 已填写找车表单后，提交时因无手机号触发统一手机号授权：

- 授权成功 → 保存手机号并自动继续原提交；
- 拒绝 / 取消 → 不创建 Application、不通知 Employee、不形成正式服务关系；
- 当前页面已填写内容临时保留，允许继续修改并再次提交；
- 临时保留不是 server-side draft；
- 页面销毁 / 小程序关闭 / 刷新 / 长时间离开后不承诺恢复；
- 不新增“未授权找车草稿”主状态。

### B｜拒绝授权也先在服务端保存正式草稿

不推荐；会制造未授权人工服务对象/状态。

**建议：A。**

## P20-B4-09｜客户端通用加载 / 失败 / 重试 / 复制权限合同｜CHOICE=A / USER_APPROVED / APPLIED

### A｜统一交互安全合同（推荐）

关键页面至少支持：

- 首次加载 / skeleton；
- 分页加载；
- empty；
- 网络错误；
- 服务端错误；
- retry；
- submit pending；
- 防重复提交；
- 图片加载失败占位。

当权限 / visibility / Customer state 在页面停留期间发生变化：

> 必须撤销旧敏感 UI 与旧敏感数据，不允许继续展示缓存中的受保护字段。

复制能力统一：

> **先有查看权限，才允许复制。**

客户端只允许复制当前 Customer 本身合法可见的安全文本；不可见字段不能借长按/复制绕过权限。

复制成功可反馈：

> `已复制`

### B｜各页面自行决定

不推荐；会造成重复提交、缓存泄露和权限绕过。

**建议：A。**

## P20-B4-10｜价格格式与 Vehicle Detail 顶部导航｜CHOICE=A / USER_APPROVED / APPLIED

### A｜恢复明确显示与 entry-context 导航（推荐）

#### 客户数字价格格式
- 主要单位使用“万”；
- 例如 `12.8万`、`18万`；
- 整数不强制显示 `18.0万`；
- 不写冗长 `18万元`；
- 无数字价继续显示“价格咨询”；
- `--万` 只用于 PDM-10 明确的 LIMITED quota exhausted 场景，不能和“车辆无数字价”混淆。

#### Vehicle Detail 顶部
内部正常进入：
- 左上角官方风格返回箭头；
- 不显示“返回”文字；
- 返回原页面并恢复查询/滚动上下文。

分享 / 外部直达、没有有效上一页：
- 左上角显示“主页”；
- 点击进入新的正常 C01 首页。

顶部中间固定：

> **车辆详情**

不把完整车型塞进标题栏。

顶部不额外增加自定义分享按钮；使用微信官方分享能力。

### B｜沿用 Current 泛化标题 / 导航壳

不推荐；会丢失 entry context 和历史已冻结文案。

**建议：A。**

---

## 8.1 Batch 4 Gate（待用户裁决）

- `P20-B4-01～P20-B4-10 = PASS / USER_APPROVED / APPLIED / CHOICES=1A～10A`
- 推荐：`1A,2A,3A,4A,5A,6A,7A,8A,9A,10A`
- `COMPLETED_PDM_MUTATION = 0`
- `NEW_DOMAIN_STATE_MACHINE = 0`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

本批批准后：

> **Batch 4 已执行。Final 前完整性复核 R1 = REPAIR_REQUIRED；当前唯一下一步：用户审查 P20-LIA-01～P20-LIA-07。**

---

## 8.2 Batch 4 Gate｜PASS

- 用户裁决：`P20-B4-01～P20-B4-10 = 全部同意 / 1A～10A`；
- 用户随后明确“确认执行”；
- `P20-B4-01～P20-B4-10 = PASS / USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 9. Final 前完整性复核 R1

> 报告：`07_重建工作区/PDM-20_Final前完整性复核_R1_2026-10-06.md`  
> 结果：`REPAIR_REQUIRED / NO_HARD_CONFLICT`。  
> Final candidate：`NOT_READY`。

本轮 Source→Atom / Atom→Source / Incoming Handoff / Semantic Detail / M16 全域 / Negative Claim / Cross-PDM 扫描发现 7 组 Final 前补齐项。

## P20-LIA-01｜Vehicle 时间字段客户端标签必须分离｜USER_APPROVED / APPLIED

PDM-04 已明确把以下时间事实分开：

- `listing_started_at`：当前 listing_cycle 正式上架 / 重新上架时间；
- 人工车上传 / 首次创建时间：名邦 / 4S 人工录入事实；
- JYT `first_seen_at` / 平台收录时间：名邦第一次接入 / 收录该 JYT Vehicle 的事实。

客户端必须保持这些语义分离：

- “最新上架”排序继续读取当前 cycle 的 `listing_started_at`；
- 如展示“上架时间”，指当前 cycle 的 listing_started_at；
- 如展示人工车“上传/创建时间”，必须明确这是名邦/4S 本地录入事实；
- 如展示 JYT `first_seen_at`，只能使用“平台收录时间 / 名邦收录时间”等真实标签；
- **不得把 `first_seen_at` 伪称“上游上传时间 / 车商发布时间”**；
- relist 后 listing_started_at 可以变化，但 first_seen_at / 原始人工创建时间不随新 cycle 改写；
- “今日新增”继续按 P20-A10，不把 relist 伪造成第一次新增。

本条补齐 `HO-P04-P20-001` 中尚未显式承接的时间展示语义。

## P20-LIA-02｜DAILY_PRICE_QUOTA_EXHAUSTED 的客户端提示必须完整｜USER_APPROVED / APPLIED

P20-A16 / B4-10 已承接 `--万` 与“价格咨询”的区分，但 `HO-P10-P20-001` 还要求完整权益提示。

LIMITED Customer 当前 cycle 未解锁、存在合法数字价、但当日 quota 已耗尽时：

- 主价格字段：`--万`；
- 不用“无权限查看价格”长文替代主价格字段；
- 价格区之外明确提示：
  - 今日批发车数字价格查看次数已用完；
  - 可升级到**当前实际配置为 UNLIMITED 的等级**；
  - 业务文案可举粉丝 / VIP，但不能把等级名写死进算法；
  - 也可联系顾问**免费增加今日查看次数**；
- “联系顾问”本身不自动加次数；只有合法员工真实追加后 quota 才变化；
- Customer disable 时价格权益暂停，页面不得用旧缓存继续显示本不应显示的数字价；
- `--万` 只代表“有数字价但当前 quota exhausted”，车辆本身无数字价仍为“价格咨询”。

## P20-LIA-03｜Customer disable 的客户端跨对象投影必须形成一张统一矩阵｜USER_APPROVED / APPLIED

当前各 completed PDM 已分别冻结 disable 语义，PDM-20 Final 必须统一投影：

### 公开浏览
- Customer 身份仍存在；
- 普通公开浏览可继续；
- 不因停用删除收藏 / 历史 / owner / 来源。

### Price
- 价格权益暂停；
- 不得继续使用停用前缓存的受保护数字价作为当前可见权。

### Find-car Application / Demand
- pending Application 保留；
- 停用期间不得激活；
- Customer 侧依赖账号能力的新增 / 编辑暂停；
- active Demand → paused；
- 已 paused 保持；
- completed / cancelled 不改；
- 恢复账号后不自动激活 pending Application，不自动恢复 Demand active。

### Consultation
- open Consultation 保留原主状态；
- 进入独立 `customer_disabled_hold` Guard；
- 客户侧普通动作暂停；
- **不得把 hold 显示成 resolved / invalid / cancelled 等终态**；
- 账号恢复后也不由客户端自动解除 hold，等合法 Employee 恢复。

### Lock / Transaction / Deposit / Refund
- 历史和真实当前事实不删除；
- 是否允许新的 mutation 继续服从各自 Authority；
- 客户端只展示安全真实状态，不伪造业务“消失”。

本条补齐 `HO-P01-P20-001`、`HO-P10-P20-001`、`HO-P11-P20-001`、`HO-P15-P20-001` 的共同客户端 Guard。

## P20-LIA-04｜Search / Filter 与六类 auto-Matching 排除字段必须显式解耦｜USER_APPROVED / APPLIED

PDM-12 已明确：

> 变速箱、配置偏好、过户次数、城市/距离、排放标准、车源类型不参与 V1 自动四级 Matching，不等于客户端禁止搜索/筛选这些字段。

PDM-20 必须冻结：

- 客户端 Search / Filter 可以合法消费这些结构化 Vehicle 字段；
- 当前已经存在的“变速箱 / 地域 / 来源频道”等继续正常作为客户端查询条件；
- 后续若在“更多”中承载配置偏好、过户次数、排放标准等，也只能作为 Feed Query / Filter；
- **不得因为用户设置了这些客户端筛选，就反向把它们升级成 Demand Matching hard condition**；
- 同样，Rule Dictionary 能解析这些字段，也不代表正式 Matching 自动使用；
- P20-A06 的主筛选 UI 与 PDM-12 Matching field set 是两套用途，不得错误绑定。

本条不强制新增一套复杂筛选页，只补“客户端可筛选 ≠ 自动 Matching 条件”的边界。

## P20-LIA-05｜Announcement / Banner 客户端投影必须正式承接，运营 Authority 留 PDM-24｜USER_APPROVED / APPLIED

R10 明确保留客户端公告与 Banner，但 PDM-20 Batch 1～4 尚未完整写入。

### Announcement
客户端不建设泛化“消息中心”。

保留：

> **公告**

用于：

- active 公告；
- history 公告。

公告与头像/昵称提醒同时需要主动弹出时：

> 同一时刻只展示一个主动弹层。

具体优先级可以留后续 Low-Fi，但不能连续强迫弹多个。

### Banner
客户端支持两个 placement：

- `HOME_TOP`
- `VEHICLE_DETAIL`

数量投影：

- 0 条 → 整个区域隐藏；
- 1 条 → 单张；
- 2～5 条 → 轮播；
- >5 条 → 按当前后台排序只取前 5。

Vehicle Detail Banner 是可选模块，不强制每车显示。

PDM-20 只冻结：

> 客户端展示 / 导航 / 空态投影。

公告/Banner 创建、编辑、启停、Schedule、Placement、后台排序与运营管理仍由 **PDM-24** 承接。

## P20-LIA-06｜PDM-19 客户交易资金投影补齐 correction / 换车 / 跨对象负向边界｜USER_APPROVED / APPLIED

`HO-P19-P20-001` 不只要求 Refund `closed`。

客户端“我的交易”还必须明确：

- Transaction `completed / cancelled / corrected` 等事实不得自动改变 Consultation 页面主状态；
- Transaction completed 不自动把 Customer 的 Demand 批量完成/取消；
- completed Transaction correction 只投影真实更正后的安全结果与历史，不把旧成交历史“删掉”；
- 误成交 correction 如果 Vehicle 从未真实不可售，不得在客户端制造“重新上架 / 今日新增 / 新 cycle”假象；
- 换车不显示成一个独立 Domain 状态机：
  - 旧车 Lock / Transaction / Deposit / Refund 保留历史；
  - 新车建立新的 Lock / Transaction / Deposit；
  - 客户端可以做必要的“旧业务 → 新业务”安全关联说明；
  - 不得表现为“旧 Deposit 已直接转到新车”；
- Customer 只能看到自己的 Deposit / Refund / Transaction 安全事实，不下发内部 correction permission / actor 治理字段 / 其他 Customer 信息。

## P20-LIA-07｜Outgoing Handoff + stale carrier / Final alignment｜USER_APPROVED / APPLIED

PDM-20 Final 前必须正式登记自身产生的 future handoff。

### PDM-20 → PDM-21
承接 M16 中员工侧客户端体验越界部分：

- Employee Vehicle Feed 的占用状态：
  - `交易中 > 已锁定`；
- 不在列表泄露 Customer 姓名、手机号、Deposit 金额、详细交易进度；
- Employee 车辆详情/工作台继续消费真实 Lock/Transaction Authority；
- 不把客户侧“我的锁车 / 我的候补”文案直接复用到员工端。

### PDM-20 → PDM-22
承接 PC 配置：

- “服务 / 购买说明”全局单内容配置；
- 基础富文本、Word 基础格式兼容与安全清理；
- 保存 / 更新 / 审计；
- 普通分享标题模板 / 默认分享图 / 允许字段白名单等轻量配置；
- 不建设无限通用模板引擎。

### PDM-20 → PDM-24
承接：

- Announcement 创建 / 编辑 / 启停 / active-history；
- Banner `HOME_TOP / VEHICLE_DETAIL`；
- 数量、排序、Schedule、Placement 与运营位管理；
- 客户主动弹层运营策略。

PDM-24 不得反向改变 PDM-20 已冻结的客户安全展示与导航边界。

### PDM-20 → PDM-25
承接：

- 客户端权限变化后旧敏感 UI / payload 撤销；
- copy-before-view Guard；
- historical detail 只读；
- query context restore；
- submit idempotency / duplicate prevention；
- Customer Safe Projection 的字段级测试矩阵；
- stale carrier alignment 与跨 PDM Final 审计。

同时登记至少以下 stale carrier：

1. Current 正常首入“暂不 owner”旧语义；
2. `700km` / 默认定位城市旧地域 carrier；
3. 旧“我要这辆车”混合 Consultation/Lock；
4. Consultation `CANCELLED` 第五状态；
5. Priority 自动授客户 visibility / 客户端 Priority 内部术语；
6. LIMITED 二次点击“查看价格”；
7. Waitlist 保证排名 / 自动晋升；
8. LockRequest 手动再点候补、独立申请进度/主动撤回；
9. C03 多个页面仍是通用壳 / 主导航缺失；
10. Vehicle Detail 顾问/档案/车况/服务说明/顶部导航/价格格式等 Current 投影不足；
11. Announcement / Banner Current carrier 不完整；
12. PDM-19 Refund closed / 交易资金投影旧壳。

统一：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

---

## 9.1 R1 结论

- `PDM20_PREFINAL_R1 = REPAIR_REQUIRED`
- `SOURCE_ATOMS_CHECKED = 46`
- `MISSING_RULE_UNRESOLVED = 3`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 3`
- `CROSS_PDM_ALIGNMENT_GAP = 1`
- `OUTGOING_HANDOFF_GAP = 1_GROUP`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `REPAIR_ATOMS = P20-LIA-01～P20-LIA-07`
- `FINAL_CANDIDATE_READY = false`

当前唯一下一步：

> **P20-LIA-01～P20-LIA-07 已全部批准并执行；Final 前完整性复核 R2 = PASS / FINAL_CANDIDATE_READY。当前唯一下一步：用户最终审查 PDM-20 Final Domain Overview。**

---

# 10. Final 前 R1 修复｜PASS / USER_APPROVED / APPLIED

> 用户裁决：`P20-LIA-01～P20-LIA-07 = 全部同意`；随后明确“确认执行”。  
> 状态：`PASS / USER_APPROVED / APPLIED`。

## 10.1 R1 Repair Gate｜PASS

- `P20-LIA-01～P20-LIA-07 = PASS / USER_APPROVED / APPLIED`；
- `R1_REPAIR_CLOSED = 7 / 7`；
- outgoing handoff = 4 条 `HANDOFF_OPEN`；
- stale carrier 已登记，当前不施工；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 11. Final 前完整性复核 R2｜PASS

> 报告：`07_重建工作区/PDM-20_Final前完整性复核_R2_2026-10-06.md`

结果：

- `SOURCE_TO_ATOM = PASS`
- `ATOM_TO_SOURCE = PASS`
- `SEMANTIC_COMPLETENESS = PASS`
- `MISSING_RULE_UNRESOLVED = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `OUTGOING_HANDOFF_GAP = 0`
- `NEGATIVE_CLAIMS_VERIFIED = PASS`
- `PDM20_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM20_FINAL_CANDIDATE_READY = YES`

当前唯一下一步：

> **用户已最终批准并确认执行；PDM-20 Final closeout 已完成。当前唯一下一步：PDM-21 Startup Gate。**


---

# 12. Final Closeout｜COMPLETE / INTEGRITY_PASS

- Final Domain Overview：用户最终批准；
- Final 执行：已明确确认执行；
- 正式 Authority：`07_重建工作区/PDM-20_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-20_最终完整性复核_2026-10-06.md / PASS`；
- 53 个正式规则 / 用户裁决单元全部进入 Final；
- 14 / 14 incoming handoff：`HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01/03/04/05/07/08/10/11/12/13/14/15/18/19 Final 已反向回写；
- 4 条 outgoing handoff：PDM-21 / PDM-22 / PDM-24 / PDM-25 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- PDM-20：`COMPLETE / INTEGRITY_PASS`；
- 下一步：`PDM-21 Startup Gate`。
