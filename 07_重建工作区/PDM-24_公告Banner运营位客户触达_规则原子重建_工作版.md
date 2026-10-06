# PDM-24｜公告 / Banner / 运营位 / 客户触达｜规则原子重建工作版

> 域：Announcement / Banner / Placement / Schedule / Customer-facing Operations  
> 当前状态：`IN_PROGRESS / STARTUP_GATE_PASS / BATCH_1_PENDING_USER_REVIEW`  
> IA / Low-Fi / Engineering：`NO_CONSTRUCTION`

---

# 1. Startup Gate

## 1.1 P24-R00｜核心定位｜USER_APPROVED / APPLIED

PDM-24 是：

> **Announcement（客户公告）与 Banner / Placement 运营生命周期的唯一产品 Authority。**

PDM-24 负责：

- 公告创建、编辑、启用、停用、排期、生效、结束、排序与 active/history；
- Banner 创建、编辑、启用、停用、排期、生效、结束、排序；
- 当前正式 Banner placement；
- Banner 合法跳转目标；
- 客户端公告主动弹层的运营频控；
- 与客户展示有关的运营配置事实及其必要操作历史。

PDM-24 不负责重新定义：

- Customer identity / owner / level；
- Vehicle / listing_cycle / visibility；
- 客户端 Customer Safe Projection；
- Notification / 飞书 / DND / Incident；
- 通用 audit/history/timezone Authority；
- IA / Low-Fi 视觉排版；
- Engineering 表结构、缓存、队列或投放实现。

PDM-24 不是：

- 通用客户消息中心；
- 已读 / 未读消息状态机；
- 营销自动化平台；
- 任意事件 × 任意渠道触达引擎；
- 任意页面都可动态挂载的万能 Placement Engine。

新增客户触达渠道或新增正式 placement，必须重新获得明确产品 Authority。

## 1.2 P24-R01｜车辆详情页固定广告位能力｜USER_APPROVED / APPLIED

用户在 PDM-24 Startup Gate 明确裁决：

> **车辆详情页固定存在广告位能力。**

正式口径：

- `VEHICLE_DETAIL` 是固定产品 placement，不是“某台车可选是否拥有广告模块”；
- 所有合法车辆详情页都具备该统一广告位能力；
- 后台存在当前有效 Banner 时，按 PDM-24 规则投放；
- 当前没有有效 Banner 时，可以不渲染具体广告内容；
- “当前无广告内容”不得解释为“详情页没有广告位能力”；
- 重新存在合法有效 Banner 后，该固定 placement 可继续展示；
- 不为每台 Vehicle 创建独立的“是否有广告位”业务字段。

本条覆盖旧历史中“详情 Banner 是可选模块 / 不强制每车显示”容易造成的错误解释：

> 保留正确部分：“不强制任何时刻必须有有效广告内容”；  
> 废弃错误部分：“详情页广告位本身可有可无”。

## 1.3 当前正式 placement

Startup Gate 当前冻结：

- `HOME_TOP`；
- `VEHICLE_DETAIL`。

其中：

- HOME_TOP = 首页顶部广告位；
- VEHICLE_DETAIL = 车辆详情页固定广告位能力。

PDM-24 当前不把这两个 placement 扩成任意页面可配置的通用运营位体系。

## 1.4 Incoming Handoff

当前 target=PDM-24 的正式 incoming handoff：

> `HO-P20-P24-001 = HANDOFF_ACCEPTED`

承接范围：

- Announcement / Banner 创建、编辑、启停、active/history；
- Schedule；
- Placement；
- 后台排序；
- 运营管理；
- HOME_TOP / VEHICLE_DETAIL；
- 客户端数量投影继续服从 PDM-20 Final；
- 不反向改变 Customer Safe 展示与导航边界。

Final Closeout 前：

- 不得提前标 `HANDOFF_CLOSED`；
- 不得 source backwrite PDM-20；
- 不得把 PDM-24 标 COMPLETE。

## 1.5 Startup Gate 结果

- `STARTUP_GATE = PASS`
- `P24_R00 = USER_APPROVED_APPLIED`
- `P24_R01 = USER_APPROVED_APPLIED`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_COUNT = 1`
- `INCOMING_HANDOFF_ACCEPTED = 1`
- `INCOMING_HANDOFF_GAP = 0`
- `GLOBAL_INVARIANT_CONFLICT = 0`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

---

# 2. Batch 1｜稳定一致规则｜PENDING_USER_REVIEW

以下为 Startup Gate 完成后，从 R10 / R12 / Phase 1.5 Current IA / PDM-20 Final / 用户最新裁决提取的稳定一致候选。**尚未用户批准，不属于已执行正式 Atom。**

## P24-A01｜公告与 Banner 是两个独立运营对象

- Announcement 与 Banner 分开管理；
- 二者可以共享“排期、启停、排序、审计”等运营能力；
- 不合并成一个通用 Message / Campaign 主对象；
- 不因两者都面向客户展示就建立通用客户消息中心。

## P24-A02｜公告基础管理闭环

公告至少支持：

- 列表；
- 新建；
- 编辑；
- 启用 / 停用；
- 生效时间；
- 结束时间；
- 排序；
- 创建人；
- 修改人。

公告生命周期至少能表达 draft / scheduled / active / ended 等运营事实；具体数据库枚举留 Engineering。

## P24-A03｜公告客户端只保留 active 与 history 业务入口

客户端保留“公告”业务：

- 查看当前 active 公告；
- 查看历史公告。

不新增第四个“消息”Tab，不扩成泛化消息中心。

## P24-A04｜公告主动弹层每日频控

同一 Announcement + 同一 Customer：

> **按统一业务时区，每日最多主动弹出 1 次。**

该规则限制“主动弹层”，不禁止客户主动进入公告列表查看。

## P24-A05｜关闭公告弹层不创建已读事实

客户关闭公告主动弹层：

- 只结束本次展示；
- 不生成 read / unread 主状态；
- 不改变 Announcement active / ended；
- 不阻止客户主动进入公告查看。

## P24-A06｜多个主动弹层同刻只展示一个

公告与头像 / 昵称完善提醒等主动弹层同时命中时：

> 同一时刻只展示一个主动弹层。

具体视觉优先级 / 动画 / 排队样式不在 PDM-24 冻结；不得用“连续强制弹多个”破坏关键业务操作。

## P24-A07｜Banner 固定 placement 只有 HOME_TOP / VEHICLE_DETAIL

V1 当前正式 placement：

- `HOME_TOP`；
- `VEHICLE_DETAIL`。

新增 placement 需要新的明确产品 Authority，不允许后台自由输入任意 Page ID 作为新 placement。

## P24-A08｜VEHICLE_DETAIL 是固定广告位能力

复用 P24-R01：

- 所有合法车辆详情页具备该广告位；
- 无有效 Banner 时不展示具体广告内容；
- 不能把无内容误判成 placement 不存在。

## P24-A09｜Banner 数量投影

对一个 placement 当前有效 Banner：

- 0 条 → 不渲染具体广告内容；
- 1 条 → 单图；
- 2～5 条 → 轮播；
- >5 条 → 按后台有效排序取前 5。

该数量投影继续服从 PDM-20 客户端 Authority。

## P24-A10｜Banner 跳转目标可为空

Banner target：

- 可以为空；
- target 为空时 Banner 仍可正常展示；
- 纯展示 Banner 不因为没有跳转目标而无效。

## P24-A11｜Banner 跳转只允许内部白名单合法目标

当 Banner 配置 target 时：

- 只能指向已存在、允许的内部小程序页面 / 业务对象；
- 保存 / 启用时重新校验；
- 不允许任意外链、任意页面字符串或绕过 Customer Safe 导航边界的目标；
- 目标失效 / 过期 / 不再合法时，Banner 可继续作为纯展示，但不得点击跳转。

## P24-A12｜Banner 排期、启停与排序相互独立校验

Banner 至少支持：

- placement；
- 图片；
- 标题 / 必要说明；
- 启用 / 停用；
- 生效时间；
- 结束时间；
- 排序；
- 可选合法 target。

排序只改变展示顺序，不修改原 target、placement、schedule 或业务对象状态。

## P24-A13｜运营 mutation 服从 PC 当前鉴权

公告 / Banner 所有写操作提交时必须重验：

> current identity + explicit permission/capability + data scope + object/config state

- System Admin 身份本身不自动获得运营业务配置权；
- 页面能打开、按钮曾显示、旧会话仍存在，都不能代替提交时重验；
- 4S 默认不得因其身份获得名邦运营配置能力。

## P24-A14｜重要运营配置变更必须可追溯

公告 / Banner 的创建、编辑、启停、排期、排序、target / placement 等重要变更应形成可追溯事实。

至少交给 PDM-25 统一审计/历史标准承接：

- before；
- after；
- actor；
- time。

PDM-24 不另建第二套跨域 Audit Authority。

## P24-A15｜不建设万能运营/营销平台

V1 当前明确不建设：

- 通用 Campaign Engine；
- 任意页面动态 Placement Builder；
- 任意用户分群 × 任意触发 × 任意渠道营销自动化；
- 通用客户 inbox / read-unread；
- 公告自动映射微信订阅消息；
- Banner 点击自动获得业务权限或绕过当前对象 Guard。

后续扩展必须重新获得明确产品 Authority。

---

# 3. 当前唯一下一步

> **用户审查 PDM-24 Batch 1：P24-A01～P24-A15。**

未经用户批准与明确执行：

- 不把 Batch 1 标 PASS；
- 不关闭 HO-P20-P24-001；
- 不进入 Batch 2；
- 不施工 IA / Low-Fi / Engineering。
