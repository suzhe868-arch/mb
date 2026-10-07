
# PDM-20｜最终完整规则

> 域：客户端浏览 / 搜索 / 筛选 / 排序 / 列表 / 详情 / 收藏 / 分享 / 个人中心 / 地域  
> 当前状态：`COMPLETE / INTEGRITY_PASS`  
> Final 前完整性复核：`R2 PASS / FINAL_CANDIDATE_READY`  
> Final 用户批准：`PASS`  
> Final closeout：`DONE`  
> 正式规则 / 用户裁决单元：`53`

## 1. 核心定位

PDM-20 是：

> **客户端产品体验与 Customer Safe Projection 的唯一 Authority。**

负责：

- C01 车辆首页、Feed、来源频道、地域、搜索、筛选、排序、分页、刷新；
- 车辆列表卡片、公共统计、机会块；
- Vehicle Detail、历史详情、图片、档案、车况、当前顾问、来源标签；
- 收藏；
- 普通分享、分享直达、分享内容与旧分享重验；
- 客户端价格安全投影；
- C02 找车工作区；
- C03 我的收藏、推荐、咨询、Lock/Waitlist、交易、公告、个人资料、我的顾问、推荐朋友；
- 客户端 CTA、状态文案、导航、错误/重试、复制与字段安全。

PDM-20 不重新定义：

- Customer identity / phone / owner；
- Vehicle / source / listing_cycle；
- Model；
- Archive / Condition；
- Image asset；
- Price / quota；
- Application / Demand；
- Matching / Rule Dictionary；
- Priority；
- Recommendation；
- Consultation；
- LockRequest / Lock / Waitlist；
- Deposit / Transaction / Refund；
- Announcement / Banner 后台运营；
- Employee / PC / Notification / Audit 的最终 Authority。

客户端只能消费这些 completed PDM 的真实业务事实，不得用页面状态反向创造新的 Domain 主状态。

## 2. 首次进入与 Customer owner

正常首入：

> 微信身份识别 → 创建/找到 customer_id → 进入 C01 车辆首页。

不建设传统显式登录页。

普通公开浏览：

- 不要求手机号；
- 不要求头像/昵称完善。

新 Customer owner：

1. 先判断有效分享 / 直接转介绍等合法优先来源；
2. 有优先来源 → 按 PDM-03 形成 owner；
3. 无优先来源 → 立即进入当前合法接客池轮询；
4. 只有接客池异常为空时，才允许 owner_assignment_pending。

不得恢复“正常首入暂时没有 owner，等第一次咨询/锁车才分配”的旧主流程。

## 3. C01 来源频道与首页结构

一级来源频道：

> **批发车源｜名邦车源｜4S 店车源**

默认进入：

> **批发车源**

批发页内部顺序允许：

1. 名邦机会块；
2. 4S 机会块；
3. 正常批发列表。

机会块：

- 必须使用当前完整查询条件；
- 无真实匹配直接隐藏；
- 不展示“暂无结果”空壳；
- 不自动放宽条件；
- 不做 closest / nearest fallback。

## 4. 地域

默认地域：

> **全国**

规则：

- 定位城市只作为快捷选择；
- 不自动切换为定位城市；
- 拒绝定位仍全国浏览；
- 可手动选其他城市；
- 同一时刻只使用一个地域条件；
- 来源切换、搜索、详情返回继续保留当前地域。

不得恢复：

> 定位城市 → 周边 700km → 全国

自动扩展逻辑。

## 5. 搜索与 Rule Dictionary

客户端搜索必须复用：

> **PDM-12 Rule Dictionary / deterministic parser**

例如 `26款 奥迪A6` 应解析成结构化车型事实，不退化成普通 contains/fuzzy keyword。

搜索只消费结构化解析结果，不创建：

- Demand；
- Match Result；
- Priority；
- Recommendation；
- Lock。

车型年款与首次上牌年份必须分开。

## 6. Search / Filter 与 Matching 解耦

以下字段即使不参与 V1 自动四级 Matching，也仍可作为客户端 Search / Filter：

- 变速箱；
- 配置偏好；
- 过户次数；
- 城市 / 距离；
- 排放标准；
- 车源类型。

客户端筛选条件：

> 不得因为用户使用，就自动升级成 Demand Matching hard condition。

Rule Dictionary 能解析：

> 也不等于正式 Matching 自动采用。

## 7. 车型与筛选

车型选择 UI 可表现为：

> 品牌 → 车系 → 年款分组 → 具体车型

但年款不是新的第四级主数据实体，主数据继续服从 PDM-05。

主筛选至少支持：

> 排序｜品牌/车系｜价格｜年份｜里程｜更多

其中：

- 年份 = 首次上牌年份；
- 价格 = 当前真实客户展示价；
- 明确数字价格区间排除“价格咨询”；
- 里程支持区间与单侧；
- 更多可承载能源、排量、颜色、变速箱；
- 支持已选 chips；
- 删除上级条件同步清理依赖子条件；
- 支持重置。

## 8. 排序

固定七种：

1. 最新上架（默认）
2. 价格低→高
3. 价格高→低
4. 年份新→旧
5. 年份旧→新
6. 里程少→多
7. 里程多→少

规则：

- 最新上架读取当前 listing_cycle 的 listing_started_at；
- 年份读取首次上牌年份；
- 价格咨询排在所有数字价格之后；
- 多台价格咨询再按最新上架；
- 未解锁数字价仍可按真实客户展示价参与服务端排序；
- payload 不得泄露未授权精确数字价。

不恢复“综合排序”。

## 9. 分页、刷新与上下文恢复

- 每页 15 台；
- 首次 15 台；
- 继续加载每次 +15；
- 下拉刷新保留来源/搜索/筛选/地域/排序；
- 刷新从第 1 页重载；
- 来源切换保留当前查询上下文；
- 列表 → 详情 → 返回恢复来源/搜索/筛选/地域/排序/滚动位置；
- 详情动作导致车辆不再符合当前列表时，只局部更新/移除，不重置整个 Feed。

## 10. Public Feed 可见性

正常 Feed 不显示：

- draft；
- 无合法授权的 hidden；
- offline；
- sold；
- unavailable；
- 未通过必要发布条件的车辆。

但只要 Vehicle 底层仍真实公开在售：

- 普通 Lock；
- 已有真实 Deposit 的持续占用；
- in-progress Transaction

本身不自动让 Vehicle 从公共 Feed 消失。

对其他 Customer：

- 只展示安全占用状态；
- 不泄露谁锁的；
- 不泄露 Deposit 金额；
- 不泄露 Transaction 内部进度。

Priority protected Vehicle：

> 不得向无关 Customer 通过普通 Feed / Search / Filter / Share / old link 穿透。

## 11. 列表占用标签

同一 Vehicle 对当前 Customer 命中多个关系时，只展示一个最高优先级标签：

1. 我的交易；
2. 我的锁车；
3. 我的候补；
4. 已锁定。

不得堆叠冲突标签。

Priority-origin Lock 对无关普通 Customer：

> 直接保持排他不可见。

## 12. 公共统计

首页公共统计：

> **在售车源 / 今日新增**

不随当前来源、搜索、筛选变化。

在售车源：

- 统计当前客户端真正公开可浏览的全部在售 Vehicle；
- hidden/offline/sold/draft/unavailable 不计；
- 当前不属于普通公开集合的 Priority protected Vehicle 不计；
- locked/trading 但底层仍公开在售的 Vehicle 仍计入。

今日新增：

- 今天第一次进入名邦系统并正式公开在售；
- 且当前仍公开可浏览；
- 历史 Vehicle relist 不计今日新增。

两个数字：

> 只展示，不点击触发筛选。

## 13. Vehicle 时间字段

必须区分：

- `listing_started_at`：当前 listing_cycle 正式上架/重新上架时间；
- 人工车上传/创建时间：名邦/4S 本地录入事实；
- JYT `first_seen_at`：名邦第一次收录该 JYT Vehicle 的事实。

不得：

> 把 `first_seen_at` 伪称为“上游上传时间 / 车商发布时间”。

relist：

- 可改变 listing_started_at；
- 不改变原 first_seen_at / 原始人工创建时间；
- 不重新计入今日新增。

## 14. Vehicle Detail 统一模型

普通内部进入与 Share Direct：

> 使用同一套 Vehicle Detail。

Share Direct 额外提供：

> **查看更多车源**

查看更多车源进入：

> 新的正常 C01 首页

不恢复分享者查询上下文。

旧 share：

- 不能绕过当前 visibility；
- 当前不可查看 → “当前车源不可查看” + “查看更多车源”。

## 15. Vehicle Detail Customer Safe Projection

可展示：

- 车型；
- 上牌时间；
- 表显里程；
- 变速箱；
- 排量/能源；
- 车身/内饰颜色；
- 车辆位置；
- 新能源有效扩展字段；
- 客户安全价格；
- 轻量来源；
- customer_visible 档案/检测报告；
- provenance 真实的车况；
- 普通车辆图片。

不得向普通客户端详情下发：

- VIN；
- 绿本/行驶证等敏感证件原件；
- 内部价/批发价；
- 上游电话；
- JYT/金鱼塘等内部上游名称；
- Priority/Match 内部仲裁事实；
- 保障金；
- 其他 Customer 信息。

无 customer_visible 资料：

> 整个资料模块隐藏。

## 16. 详情核心参数与 Current Advisor

核心参数优先：

1. 上牌时间；
2. 表显里程；
3. 变速箱；
4. 排量/能源；
5. 车身/内饰颜色；
6. 车辆位置。

新能源有真实有效数据再追加：

- 电池容量；
- 纯电续航；
- 总功率。

无有效数据：

> 整项隐藏，不显示 `--`、0 或空白占位。

Current Advisor 优先级：

1. 当前 Vehicle 相关合法业务 responsible；
2. Customer current owner；
3. 都没有 → “暂无服务顾问”。

打开 Vehicle Detail 不得自动分配 owner。

## 17. 车况、档案与来源

customer_visible Archive：

- 只展示明确客户可见的报告/结果；
- 无可见资料整块隐藏。

车况：

- JYT/批发只能展示上游真实事实/描述；
- 不得包装成名邦检测、名邦认证或质保；
- 名邦/4S 展示员工真实维护事实；
- 无数据整块隐藏；
- 名邦真实检测报告仍作为独立 customer_visible 档案。

来源标签只使用：

- 批发车源；
- 名邦车源；
- 4S店车源。

标签轻量、不可点击。

## 18. 图片

- 列表主图 4:3；
- 详情轮播 4:3；
- 普通车辆图片统一按顺序左右滑动；
- 不强制外观/内饰/细节分类 Tab；
- 支持序号；
- 全屏；
- 双指缩放；
- 双击放大/还原；
- 长按保存；
- 退出全屏返回原图片位置；
- 敏感证件不进入普通轮播。

## 19. Vehicle Detail CTA

普通内部详情底部：

> **收藏｜咨询｜锁车/候补/当前业务状态**

Share Direct：

> **更多车源｜收藏｜咨询｜锁车/候补/当前业务状态**

状态切换：

- 可锁 → 锁车；
- 已有 LockRequest.PENDING → 锁车申请中；
- 他人普通 Lock、本人未候补 → 候补；
- 本人已有 Waitlist → 候补中 / 我的候补；
- 本人 active Lock → 我的锁车 / 已锁定；
- 本人 in-progress Transaction → 查看交易；
- sold/offline/unavailable/history → 只读。

咨询与锁车：

> 永远是两个独立业务动作。

不恢复旧“我要这辆车”混合入口。

## 20. LockRequest / Waitlist / Lock

点击“锁车”：

> 创建/复用 `LockRequest.PENDING`

不是直接创建 Lock。

LockRequest PENDING 最长：

> **6 小时**

结果可包括：

- APPROVED；
- REJECTED；
- EXPIRED；
- LOCK_CONFLICT；
- CLOSED_NOT_LOCKABLE。

竞争申请：

- 某申请先成功形成 Lock；
- 其他仍有效且仅因冲突失败的 pending → LOCK_CONFLICT；
- 自动创建/复用 Waitlist；
- 客户无需再点一次“候补”。

不得展示：

- 保证性第几名；
- 自动晋升承诺。

V1 不提供：

- pending LockRequest 客户主动撤回；
- 独立锁车申请进度中心。

## 21. 普通 Lock vs Priority-origin Lock

普通 VIP/粉丝直接 Lock：

- 形成正式占用；
- Vehicle 底层仍公开时，其他合法 Customer 仍可看；
- 对其他人显示安全“已锁定”；
- 可按 Waitlist 规则候补。

Priority-origin Lock：

- Priority ended(converted_to_lock)；
- Lock 继承该 Customer 的排他客户侧 visibility；
- Lock 有效期间其他普通 Customer 不进入普通 Feed/Detail；
- Waitlist 不授普通详情 visibility。

客户端不得把所有 Lock 统一处理成“都公开”或“都隐藏”。

## 22. Deposit 后的 Lock 客户投影

普通无真实 Deposit 的 Lock：

- 可显示 expires_at；
- 默认新 Lock 72h，后台可配置；
- 合法延期后显示新 expires_at / 已延期。

已有真实 Deposit：

- 不继续把普通倒计时当成“到点一定释放”；
- 客户自己的“我的锁车/交易”可展示：
  > **已支付意向金 · 车辆持续锁定中**
- 可以展示 Customer 自己真实支付金额；
- 不得向其他 Customer 泄露 Deposit 金额。

## 23. 收藏

收藏是独立轻量关系：

- 不要求手机号；
- 不要求头像/昵称；
- 收藏不创建 Consultation/Recommendation/LockRequest；
- hidden 后收藏关系保留，但不得穿透 visibility；
- offline/sold 后收藏关系保留并进入历史展示；
- 同一 vehicle_id relist 后收藏继续存在；
- 新 listing_cycle 的 price-right 重新判断。

## 24. 客户价格投影

客户端价格严格服从 PDM-10。

### LIMITED

列表：

- 不泄露批发车精确数字客户价。

详情：

- Customer 主动进入；
- 当前 cycle 未解锁；
- 有合法数字价；
- quota 可用；

则：

> 自动完成首次解锁并直接显示数字价。

不要求二次点击“查看价格”。

quota exhausted：

- 主价格字段 `--万`；
- 不用长文替代；
- 明确提示今日查看次数已用完；
- 可升级到当前真实配置为 UNLIMITED 的等级；
- 可联系顾问免费增加今日次数；
- 联系顾问本身不自动增加次数。

### UNLIMITED

只要有合法数字客户价：

- 列表直接显示；
- 详情直接显示。

Vehicle 本身没有数字价：

> **价格咨询**

`--万` 与“价格咨询”不得混淆。

## 25. 价格格式

客户数字价格主要使用：

> **万**

例如：

- `12.8万`
- `18万`
- `12.58万`

整数不强制 `.0`。

不使用冗长“万元”作为主要格式。

## 26. 普通分享

使用微信官方分享能力。

分享卡片：

- 主图；
- 完整车型名；
- 查看详情引导。

不得固化：

- 动态客户展示价；
- 内部价；
- VIN；
- 上游电话；
- Priority/Recommendation/Lock/Transaction 内部事实。

普通 share：

- 不创建 Recommendation；
- 不传播 price-right；
- 不传播 visibility grant；
- 不传播 Internal Mode；
- 无固定 N 天 TTL；
- 每次打开重新判断 current Vehicle/listing_cycle/Customer/Priority/visibility。

已有 owner Customer：

> 不能被别人分享抢走 owner。

ownerless 新 Customer：

> 按 PDM-03 当前分享/转介绍归属规则形成 owner。

## 27. 分享内容配置

分享标题：

- 采用轻量可配置模板；
- 不把某句营销文案永久写死。

分享图：

1. 优先当前合法真实 Vehicle 首图；
2. 无可用真实图 → 统一默认分享图。

模板只允许 Customer Safe 白名单字段。

首页/列表：

> 不增加独立分享快捷按钮。

Vehicle 分享从详情使用微信官方能力完成。

## 28. 历史详情与旧 share

Customer 自己存在合法 Recommendation / Consultation / Lock / Transaction 历史：

> 可以从“我的”进入 Customer Safe Historical Detail。

Historical Detail：

- 只读；
- 不创建新 Consultation；
- 不创建 LockRequest；
- 不创建 Waitlist；
- 不创建 Transaction。

旧 share：

- 永远不是永久访问 grant；
- 当前不可公开 → 当前车源不可查看；
- 同 vehicle_id 新 listing_cycle 重新公开后，可以继续作为 Vehicle 导航入口；
- 但所有 visibility / price-right / Lock 状态按当前新 cycle 重算。

## 29. C02 找车工作区

C02 可以同时投影：

- pending Application；
- active Demand；
- paused Demand；
- Recommendation；
- completed/cancelled history。

Application：

- 所有 Customer 都可以提交；
- 最低必填“想找什么车”；
- 先 pending；
- 不自动生成 active Demand。

正式 Demand：

- 由合法 Employee 人工激活；
- 即使 Customer 已有 entitlement，也不自动 active。

客户结束找车：

- 创建待 Employee 确认的结束请求；
- Demand 主状态暂时仍为 active/paused；
- 客户端可以显示：
  > **结束处理中**
- 这不是第五 Demand 主状态。

等级提示：

> 读取当前 Customer Level 配置，不把“粉丝/VIP”永久写死成算法。

## 30. 手机号授权拒绝后的找车表单

提交人工服务动作需要手机号时：

授权成功：

> 保存手机号并自动继续原提交。

拒绝/取消：

- 不创建 Application；
- 不通知 Employee；
- 不形成正式服务对象；
- 当前页面填写内容临时保留；
- 可继续修改并再次提交；
- 不创建 server-side draft；
- 页面销毁/关闭/刷新/长时间离开后不承诺恢复。

## 31. C03 我的

一级真实入口：

- 我的收藏；
- 我的推荐；
- 我的咨询；
- 我的锁车/候补；
- 我的交易；
- 公告；
- 个人资料/我的顾问；
- 推荐朋友/直接转介绍。

不得继续用“当前记录/历史记录/对象摘要”的泛化壳代替真实业务字段。

## 32. 我的推荐

只展示正式 Recommendation。

至少包括：

- Vehicle；
- Recommendation 时间；
- recommender；
- source Demand（如有）；
- 当前 Vehicle 状态；
- 当前 listing_cycle price access；
- 当前 / 历史。

不得混入：

- Match candidate；
- Source Radar；
- Priority。

## 33. 我的咨询

Consultation 正式主状态只有：

- pending；
- processing；
- resolved；
- invalid。

resolved 用 close_reason 区分：

- RESOLVED；
- NORMAL_CLOSED；
- CUSTOMER_WITHDRAWN。

UI 可以显示：

- 已解决；
- 已关闭；
- 已取消/已撤回。

但不得创造 `CANCELLED` 第五状态。

至少展示：

- Vehicle；
- 创建时间；
- 当前状态；
- assignee/顾问；
- source；
- 必要结束事实；
- 当前 / 历史。

## 34. 我的锁车 / 候补

至少展示：

- 当前 / 历史；
- LockRequest 必要结果摘要；
- 普通 Lock expires_at；
- 延期后的新 expires_at / 已延期；
- 真实 Deposit 后持续锁定文案；
- 本人真实 Deposit 金额（适用时）；
- Waitlist 当前 / 历史。

不展示保证性排名。

## 35. 我的交易

Transaction：

- in_progress；
- completed；
- cancelled。

至少展示：

- Vehicle；
- created_at；
- 当前状态；
- 当前 responsible；
- Customer 自己的 Deposit / Refund 安全事实。

Refund：

- pending；
- refunded；
- closed。

closed：

> 表示决定不再退款而关闭，不能显示成“已退款”。

实际当场已退款：

> 可以直接 refunded，不制造假 pending。

## 36. correction / change-car 客户投影

Transaction completed/cancelled/corrected：

> 不自动改变 Consultation 主状态。

Transaction completed：

> 不自动批量结束 Customer 的 Demand。

误成交 correction：

- 如果 Vehicle 从未真实不可售；
- 不制造 relist；
- 不制造今日新增；
- 不制造 new cycle。

换车：

- 不建设独立客户端 Domain 状态机；
- 旧车 Lock/Transaction/Deposit/Refund 保留历史；
- 新车重新建立 Lock/Transaction/Deposit；
- 可以展示必要“旧业务→新业务”关联；
- 不得显示“旧 Deposit 直接转挂到新车”。

## 37. 个人资料 / 我的顾问 / 推荐朋友

个人资料至少包含：

- 头像；
- 昵称；
- 手机号；
- 当前顾问。

无合法顾问：

> **暂无服务顾问**

打开个人资料：

> 不自动分配 owner。

推荐朋友 / 直接转介绍：

- 必须有真实可操作入口；
- 保存直接来源关系；
- ownerless 新 Customer 按事件发生时推荐人的 current owner 承接；
- 已有 owner 不被后续分享/转介绍抢走；
- V1 不做多级 owner / 多级佣金 / 积分链。

## 38. Customer disable

Customer disable 后：

### 公开浏览
仍可进行普通公开浏览。

### Price
价格 entitlement 暂停，不得继续用旧缓存显示受保护数字价。

### Application / Demand
- pending Application 保留；
- 不得激活；
- Customer 侧新增/编辑暂停；
- active Demand → paused；
- paused 保持；
- completed/cancelled 不变；
- 恢复账号后不自动 active。

### Consultation
- 保留原主状态；
- 进入 customer_disabled_hold；
- Customer 普通动作暂停；
- 不伪造成 resolved/invalid/cancelled；
- 恢复账号后不由客户端自动解除 hold。

### Lock / Transaction / Deposit / Refund
真实当前与历史事实都保留，不伪造成业务消失。

## 39. Announcement

客户端不建设泛化“消息中心”。

保留：

> **公告**

用于：

- active 公告；
- history 公告。

公告与头像/昵称提醒同时需要主动出现时：

> 同一时刻只展示一个主动弹层。

具体运营优先级由后续载体阶段处理。

## 40. Banner

客户端 placement：

- `HOME_TOP`
- `VEHICLE_DETAIL`

数量规则：

- 0 条 → 区域隐藏；
- 1 条 → 单张；
- 2～5 条 → 轮播；
- >5 条 → 按后台排序取前 5。

Vehicle Detail Banner：

> **VEHICLE_DETAIL 为所有合法车辆详情页固定具备的广告位能力；无有效 Banner 时只是不渲染具体广告内容，不代表该详情页没有广告位。**

Announcement/Banner 的创建、编辑、启停、Schedule、Placement、排序与运营管理已由 PDM-24 Final Authority 正式承接。

## 41. 服务 / 购买说明

Vehicle Detail 只保留一个：

> **服务 / 购买说明**

客户端：

- 消费后台当前有效的一份全局内容；
- 内容为空 → 整块隐藏。

不拆分：

- 购车流程；
- 过户说明；
- 交易流程；
- 质保说明；
- 多个重复服务模块。

V1 不建设：

- 服务费计算器；
- 物流费报价；
- 检测费报价；
- 过户费报价；
- 预计到手价。

后台配置已由 PDM-22 Final 承接。

## 42. 通用加载、失败与重试

关键页面至少支持：

- 首次加载/skeleton；
- 分页加载；
- empty；
- 网络错误；
- 服务端错误；
- retry；
- submit pending；
- 防重复提交；
- 图片失败占位。

权限/visibility/Customer state 在页面停留期间变化：

> 必须撤销旧敏感 UI 与旧敏感 payload。

不得继续展示失权前缓存敏感数据。

## 43. 复制权限

原则：

> **先有查看权限，才允许复制。**

客户端只复制当前 Customer 合法可见安全文本。

不可见字段：

> 不得借长按/复制绕过权限。

复制成功可反馈：

> **已复制**

## 44. Vehicle Detail 顶部导航

内部正常进入：

- 左上角官方风格返回箭头；
- 不显示“返回”文字；
- 返回上一页；
- 恢复原查询/滚动上下文。

Share / external direct、没有有效上一页：

- 左上角显示“主页”；
- 点击进入新的正常 C01 首页。

顶部中间固定：

> **车辆详情**

不把完整车型名塞进标题栏。

顶部不额外加自定义分享按钮。

## 45. 明确废弃 / 不得恢复

不得恢复：

1. 默认定位城市主流程；
2. 700km 自动扩展；
3. 综合排序；
4. 旧“我要这辆车”混合 Consultation/Lock；
5. Consultation `CANCELLED` 第五主状态；
6. Priority 自动授 Customer 详情 visibility；
7. 客户端显示 Priority/优先保护/客户专属等内部术语；
8. LIMITED 二次点击查看价格；
9. 普通 share 固定 N 天 TTL；
10. share 权限继承链；
11. 第二套 Share Detail 业务状态机；
12. Waitlist 保证性排名；
13. Waitlist 自动晋升 Lock；
14. LockRequest 客户端主动撤回；
15. 独立 LockRequest 申请进度中心；
16. 旧 share 永久穿透 hidden/offline/sold/Priority；
17. Customer Historical Detail 创建新业务；
18. 客户端泄露 VIN/内部价/上游电话/其他 Customer 信息；
19. 客户端页面状态反向创造新的 Domain 主状态。

## 46. Cross-PDM Handoff

### Incoming｜Final closeout 已关闭

14 条：

- HO-P01-P20-001；
- HO-P03-P20-001；
- HO-P04-P20-001；
- HO-P05-P20-001；
- HO-P07-P20-001；
- HO-P08-P20-001；
- HO-P10-P20-001；
- HO-P11-P20-001；
- HO-P12-P20-001；
- HO-P13-P20-001；
- HO-P14-P20-001；
- HO-P15-P20-001；
- HO-P18-P20-001；
- HO-P19-P20-001。

### Outgoing

- HO-P20-P21-001｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-21 Final 已正式承接 Employee Vehicle Feed / Detail 的 occupancy `trading > locked`、客户/资金敏感字段裁剪与员工文案边界；
- HO-P20-P22-001｜`HANDOFF_CLOSED / source_backwrite=YES`：服务/购买说明、分享标题模板、默认分享图、Customer Safe 白名单等轻量配置已由 PDM-22 Final 承接；
- HO-P20-P24-001｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-24 Final 已正式承接 Announcement / Banner 运营 Authority；`VEHICLE_DETAIL` 固定广告位能力已完成 source backwrite；
- HO-P20-P25-001。

## 47. Stale Carrier

已登记但当前不施工：

- 首入暂不 owner；
- 700km / 综合排序；
- “我要这辆车”；
- Consultation CANCELLED；
- Priority 自动 visibility；
- LIMITED 二次查看价格；
- Waitlist 排名/自动晋升；
- LockRequest 旧进度/撤回；
- C03 通用壳；
- Vehicle Detail 泛化壳；
- Announcement/Banner carrier 不完整；
- PDM-19 交易资金旧壳。

统一：

> `CARRIER_DEFERRED / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

## 48. Final 前完整性结论

R2：

- `SOURCE_TO_ATOM = PASS`
- `ATOM_TO_SOURCE = PASS`
- `SEMANTIC_COMPLETENESS = PASS`
- `M16_COVERAGE = PASS`
- `MISSING_RULE_UNRESOLVED = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `OUTGOING_HANDOFF_GAP = 0`
- `NEGATIVE_CLAIMS_VERIFIED = PASS`
- `PDM20_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM20_FORMAL_UNITS = 53`
- `PDM20_FINAL_CANDIDATE_READY = YES`

## 49. Final Closeout

用户已最终批准本 PDM-20 Final Domain Overview，并随后明确确认执行。

- 正式 Authority：`07_重建工作区/PDM-20_最终完整规则.md`；
- Final 前完整性复核 R2：`PASS / FINAL_CANDIDATE_READY`；
- Final Integrity：`PASS`；
- 53 个正式规则 / 用户裁决单元全部进入 Final；
- 14 / 14 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-20 → PDM-21 已 `HANDOFF_CLOSED / source_backwrite=YES`；PDM-22 已 `HANDOFF_CLOSED / source_backwrite=YES`；PDM-24 / PDM-25 继续 `HANDOFF_OPEN`；
- PDM-20：`COMPLETE / INTEGRITY_PASS`；
- IA / Low-Fi / Engineering 继续禁止提前施工；
- 下一步：`PDM-21 Startup Gate`。

当前唯一下一步：

> **PDM-21 Startup Gate。**

> 2026-10-07 Source Backwrite：对应 PDM-22 handoff 已由 `07_重建工作区/PDM-22_最终完整规则.md` 正式承接；以 CROSS_PDM_HANDOFF_REGISTER 的 `HANDOFF_CLOSED / source_backwrite=YES` 为准。


> 2026-10-07 Source Backwrite｜PDM-24 Final Closeout：`HO-P20-P24-001 = HANDOFF_CLOSED / source_backwrite=YES`。PDM-20 §40 中旧“Vehicle Detail Banner 可选，不强制每车显示”已正式回写为：`VEHICLE_DETAIL` 是所有合法车辆详情页固定具备的广告位能力；无有效 Banner 时只是不渲染具体广告内容。Announcement / Banner 后台运营 Authority 以 `07_重建工作区/PDM-24_最终完整规则.md` 为准；PDM-20 Customer Safe Projection、数量投影和导航 Guard 继续有效。


> 2026-10-07 Source Backwrite｜HO-P20-P25-001：`HANDOFF_CLOSED / source_backwrite=YES`。PDM-25 已由 `07_重建工作区/PDM-25_最终完整规则.md` 正式承接本域移交的审计 / 历史 / 时区 / 配置版本 / 横切完整性语义；PDM-25 不反向改写本 PDM 已冻结的业务状态机与产品规则。
