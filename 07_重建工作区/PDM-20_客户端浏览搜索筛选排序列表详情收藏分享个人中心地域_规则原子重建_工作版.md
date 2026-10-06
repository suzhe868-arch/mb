# PDM-20｜客户端浏览 / 搜索 / 筛选 / 排序 / 列表 / 详情 / 收藏 / 分享 / 个人中心 / 地域｜规则原子重建工作版

> 当前状态：`IN_PROGRESS / STARTUP_GATE_PASS / BATCH_1_PASS / BATCH_2_PENDING_USER_REVIEW`  
> 核心定位：`P20-R00 = USER_APPROVED / APPLIED`  
> Incoming Handoff：14 / 14 `HANDOFF_ACCEPTED`  
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

# 6. Batch 2｜明确废弃 / Superseded / DO_NOT_RESTORE 候选

> 状态：`PENDING_USER_REVIEW`。  
> Reverse Conflict Scan：`PASS / FALSE_DEPRECATION_COUNT=0`。  
> 原则：只登记已被 R10 后续冻结、PDM-10/13/14/15/18 等 completed Authority 明确覆盖或禁止恢复的旧客户端方向；“Current/Low-Fi 缺承载”的能力不在本批误判为废弃。

## P20-B2-01｜“默认定位城市 / 700km 自动扩展”不得恢复

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

## P20-B2-02｜“综合排序”不得恢复

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

## P20-B2-03｜旧“我要这辆车”合并咨询 + 锁车语义不得恢复

旧客户端曾用一个：

> **“我要这辆车”**

同时承载咨询 / 购车意向 / 锁车等多种语义。

PDM-15 / PDM-18 已明确拆分：

- 沟通车辆 → Consultation / “咨询”；
- 锁车 → LockRequest / Lock；
- Recommendation → Employee 正式推荐。

因此客户端不得重新用一个按钮同时创建 / 触发多类正式业务对象。

> **旧“我要这辆车”混合入口 = SUPERSEDED / DO_NOT_RESTORE。**

## P20-B2-04｜Consultation `CANCELLED` 第五主状态不得恢复

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

## P20-B2-05｜Priority 自动授客户详情 visibility / 客户端暴露 Priority 内部术语不得恢复

PDM-13 已明确禁止：

- Priority 自动给 Customer 详情 visibility；
- 客户端暴露 Priority / 优先保护 / 客户专属 / 内部仲裁等术语。

Priority Customer 本人也不能仅凭 Priority 就自动打开详情；必须读取 Recommendation / visibility grant / 当前合法访问 Authority。

因此：

> **“有 Priority = 客户天然可看详情”与“客户端展示 Priority 内部身份”均 = DO_NOT_RESTORE。**

## P20-B2-06｜LIMITED 客户“进入详情后再点一次查看价格”不得恢复

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

## P20-B2-07｜普通分享固定 TTL / 权限继承链 / 第二套 Share Detail 不得恢复

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

## P20-B2-08｜Waitlist 客户端保证性排名 / 自动晋升不得恢复

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

## P20-B2-09｜LockRequest 客户端主动撤回 / 独立申请进度详情页不得恢复

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

> **用户审查 P20-B2-01～P20-B2-09。未经用户批准与后续明确执行，不得进入 Batch 3。**
