# PDM-24｜公告 / Banner / 运营位 / 客户触达｜规则原子重建工作版

> 域：Announcement / Banner / Placement / Schedule / Customer-facing Operations  
> 当前状态：`IN_PROGRESS / STARTUP_GATE_PASS / BATCH_1_PASS / BATCH_2_PASS / BATCH_3_PASS / BATCH_4_PENDING_SCAN`  
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

# 2. Batch 1｜稳定一致规则｜PASS / USER_APPROVED / APPLIED

以下规则已由用户“全部同意”，并在随后明确执行后正式进入 PDM-24 当前 Authority。

## P24-A01｜公告与 Banner 是两个独立运营对象｜USER_APPROVED / APPLIED

- Announcement 与 Banner 分开管理；
- 二者可以共享“排期、启停、排序、审计”等运营能力；
- 不合并成一个通用 Message / Campaign 主对象；
- 不因两者都面向客户展示就建立通用客户消息中心。

## P24-A02｜公告基础管理闭环｜USER_APPROVED / APPLIED

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

## P24-A03｜公告客户端只保留 active 与 history 业务入口｜USER_APPROVED / APPLIED

客户端保留“公告”业务：

- 查看当前 active 公告；
- 查看历史公告。

不新增第四个“消息”Tab，不扩成泛化消息中心。

## P24-A04｜公告主动弹层每日频控｜USER_APPROVED / APPLIED

同一 Announcement + 同一 Customer：

> **按统一业务时区，每日最多主动弹出 1 次。**

该规则限制“主动弹层”，不禁止客户主动进入公告列表查看。

## P24-A05｜关闭公告弹层不创建已读事实｜USER_APPROVED / APPLIED

客户关闭公告主动弹层：

- 只结束本次展示；
- 不生成 read / unread 主状态；
- 不改变 Announcement active / ended；
- 不阻止客户主动进入公告查看。

## P24-A06｜多个主动弹层同刻只展示一个｜USER_APPROVED / APPLIED

公告与头像 / 昵称完善提醒等主动弹层同时命中时：

> 同一时刻只展示一个主动弹层。

具体视觉优先级 / 动画 / 排队样式不在 PDM-24 冻结；不得用“连续强制弹多个”破坏关键业务操作。

## P24-A07｜Banner 固定 placement 只有 HOME_TOP / VEHICLE_DETAIL｜USER_APPROVED / APPLIED

V1 当前正式 placement：

- `HOME_TOP`；
- `VEHICLE_DETAIL`。

新增 placement 需要新的明确产品 Authority，不允许后台自由输入任意 Page ID 作为新 placement。

## P24-A08｜VEHICLE_DETAIL 是固定广告位能力｜USER_APPROVED / APPLIED

复用 P24-R01：

- 所有合法车辆详情页具备该广告位；
- 无有效 Banner 时不展示具体广告内容；
- 不能把无内容误判成 placement 不存在。

## P24-A09｜Banner 数量投影｜USER_APPROVED / APPLIED

对一个 placement 当前有效 Banner：

- 0 条 → 不渲染具体广告内容；
- 1 条 → 单图；
- 2～5 条 → 轮播；
- >5 条 → 按后台有效排序取前 5。

该数量投影继续服从 PDM-20 客户端 Authority。

## P24-A10｜Banner 跳转目标可为空｜USER_APPROVED / APPLIED

Banner target：

- 可以为空；
- target 为空时 Banner 仍可正常展示；
- 纯展示 Banner 不因为没有跳转目标而无效。

## P24-A11｜Banner 跳转只允许内部白名单合法目标｜USER_APPROVED / APPLIED

当 Banner 配置 target 时：

- 只能指向已存在、允许的内部小程序页面 / 业务对象；
- 保存 / 启用时重新校验；
- 不允许任意外链、任意页面字符串或绕过 Customer Safe 导航边界的目标；
- 目标失效 / 过期 / 不再合法时，Banner 可继续作为纯展示，但不得点击跳转。

## P24-A12｜Banner 排期、启停与排序相互独立校验｜USER_APPROVED / APPLIED

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

## P24-A13｜运营 mutation 服从 PC 当前鉴权｜USER_APPROVED / APPLIED

公告 / Banner 所有写操作提交时必须重验：

> current identity + explicit permission/capability + data scope + object/config state

- System Admin 身份本身不自动获得运营业务配置权；
- 页面能打开、按钮曾显示、旧会话仍存在，都不能代替提交时重验；
- 4S 默认不得因其身份获得名邦运营配置能力。

## P24-A14｜重要运营配置变更必须可追溯｜USER_APPROVED / APPLIED

公告 / Banner 的创建、编辑、启停、排期、排序、target / placement 等重要变更应形成可追溯事实。

至少交给 PDM-25 统一审计/历史标准承接：

- before；
- after；
- actor；
- time。

PDM-24 不另建第二套跨域 Audit Authority。

## P24-A15｜不建设万能运营/营销平台｜USER_APPROVED / APPLIED

V1 当前明确不建设：

- 通用 Campaign Engine；
- 任意页面动态 Placement Builder；
- 任意用户分群 × 任意触发 × 任意渠道营销自动化；
- 通用客户 inbox / read-unread；
- 公告自动映射微信订阅消息；
- Banner 点击自动获得业务权限或绕过当前对象 Guard。

后续扩展必须重新获得明确产品 Authority。

---

# 3. Batch 2｜明确废弃 / 已覆盖 / 不得恢复｜PASS / USER_APPROVED / APPLIED

本批只收纳有明确来源证据、且已经被当前 Authority 覆盖的旧方向。  
Reverse Conflict Scan 规则：

- 不把当前仍有效规则误判为 deprecated；
- 不把“尚未决定的新产品选择”塞进 Batch 2；
- 不把纯 IA / Low-Fi 视觉差异当产品规则废弃；
- 与 PDM-20 / PDM-23 已完成 Authority 冲突的旧方向不得恢复。

当前扫描结果：

- `REVERSE_CONFLICT_SCAN = PASS`
- `FALSE_DEPRECATION_COUNT = 0`
- `NEW_PRODUCT_CHOICE_INTRODUCED = 0`

## P24-B2-01｜不恢复客户端第四个“消息”Tab / 泛化消息中心｜USER_APPROVED / APPLIED

明确不得恢复：

- 客户端新增第四个“消息”一级 Tab；
- 把公告、咨询、锁车、交易、通知等重新塞入一个通用 Message Center；
- 用“消息”壳覆盖现有真实业务入口。

当前继续保持：

> 客户端公告 = Announcement；其他业务回到各自已完成 Domain Authority。

## P24-B2-02｜不恢复公告已读 / 未读主状态机｜USER_APPROVED / APPLIED

明确不得恢复：

- Announcement read / unread 主状态；
- 已读数 / 未读数作为公告生命周期核心事实；
- 为公告建立通用 inbox badge / unread count 体系。

公告 active / history 与客户端是否主动打开是两类不同事实。

## P24-B2-03｜关闭公告弹层 ≠ 已读公告｜USER_APPROVED / APPLIED

明确不得恢复：

- 关闭 C-O03 即写入 read；
- 关闭弹层即改变 Announcement active / history；
- 因一次关闭而永久阻断客户主动查看公告。

关闭只结束本次主动展示。

## P24-B2-04｜不恢复“VEHICLE_DETAIL 广告位本身可有可无”｜USER_APPROVED / APPLIED

历史“详情 Banner 是可选模块 / 不强制所有车辆显示”的表述中：

- “不强制任何时刻必须存在有效广告内容”继续保留；
- “车辆详情页广告位能力本身可有可无”已被用户最新 P24-R01 明确覆盖。

因此不得恢复：

> 某些车辆详情页没有 VEHICLE_DETAIL placement，或由单车字段决定是否拥有广告位。

## P24-B2-05｜不恢复任意 / 通用多运营位｜USER_APPROVED / APPLIED

V1 不恢复：

- 后台自由输入任意 placement 名称；
- 任意页面都可动态挂载 Banner；
- 通用 Placement Builder；
- 由运营人员自行新增第三、第四、任意 placement 而无需产品 Authority。

当前正式 placement 仅：

- HOME_TOP；
- VEHICLE_DETAIL。

## P24-B2-06｜不把 Banner 扩成广告推荐 / 定向 / 计费平台｜USER_APPROVED / APPLIED

明确不得恢复或新增为 V1：

- 广告计费；
- CPC / CPM；
- 定向广告投放；
- 推荐算法驱动 Banner；
- 复杂投放计划；
- 完整广告统计 / 归因平台；
- 基于客户画像自动决定不同广告内容的营销推荐引擎。

PDM-24 当前只是固定 placement 的运营配置，不是广告平台。

## P24-B2-07｜不恢复任意外链 / 任意目标字符串｜USER_APPROVED / APPLIED

Banner target 不得恢复为：

- 任意 URL；
- 任意外部网页；
- 任意 Page ID 字符串；
- 未经白名单验证的业务对象地址。

当前只允许：

> 已存在、内部白名单、合法的页面 / 业务对象目标。

## P24-B2-08｜无效 / 失效 target 不得继续跳转｜USER_APPROVED / APPLIED

明确不得恢复：

- target 已失效仍继续点击跳转；
- target 权限 / 对象失效后仍通过旧 Banner 绕过当前 Guard；
- Banner 链接作为永久授权票据。

目标失效时可保留纯展示，但点击不得产生非法导航。

## P24-B2-09｜target 为空不等于 Banner 无效｜USER_APPROVED / APPLIED

明确不得恢复：

- “Banner 必须配置 target 才能启用”；
- 无 target 就不能展示；
- 无 target 就自动停用 Banner。

当前合法模型：

> target 可为空；为空时是纯展示 Banner。

## P24-B2-10｜不恢复连续强迫多个主动弹层｜USER_APPROVED / APPLIED

当 Announcement 与资料完善提醒等同时命中时，不得恢复：

- 连续强制弹多个；
- 关闭第一个立即强制弹第二个；
- 在客户关键业务提交过程中用运营弹层打断流程。

当前产品边界：

> 同一时刻只主动展示一个；具体视觉优先级 / 调度表现留后续 IA。

## P24-B2-11｜公告不自动升级为微信 / 飞书 / 通知发送任务｜USER_APPROVED / APPLIED

明确不得把 Announcement 自动映射成：

- 微信订阅消息；
- 飞书消息；
- App Push；
- PC Push；
- PDM-23 Notification allowlist 事件。

公告自身的客户端 active/history/主动弹层属于 PDM-24；若未来新增外部主动渠道，必须重新获得明确产品 Authority，并服从 PDM-23 渠道边界。

## P24-B2-12｜不把 Banner 点击当业务授权或业务 mutation｜USER_APPROVED / APPLIED

Banner 点击不得：

- 授予 Customer / Employee 新权限；
- 创建 Recommendation / Consultation / Lock / Transaction；
- 绕过 Customer Safe Projection；
- 改写 Vehicle / Customer / owner / visibility 等业务事实。

Banner 只能导航到当前合法目标；进入目标后仍由目标 Domain Guard 决定可看、可做什么。

---

# 4. Batch 2 执行结果

- `P24-B2-01～P24-B2-12 = PASS / USER_APPROVED / APPLIED`
- `REVERSE_CONFLICT_SCAN = PASS`
- `FALSE_DEPRECATION_COUNT = 0`
- `NEW_PRODUCT_CHOICE_INTRODUCED = 0`
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

---

# 5. Batch 3｜明确新增 / 后续变化扫描｜PASS / USER_APPROVED / APPLIED

本轮重新对照：

- Phase 1.5 D6；
- HR-14；
- S4-C13 / S4-C15；
- Step 7 Announcement / Banner closure；
- NEW4-01 Announcement lifecycle；
- fifth-round Banner reorder；
- Current IA 的 `BANNER_DISPLAY_ONLY` / `DAILY_ANNOUNCEMENT_FREQUENCY`；
- PDM-20 Final；
- 用户在 PDM-24 Startup Gate 新增的 `P24-R01`。

## 5.1 后续变化映射

| 后续新增 / 变化事实 | 当前已承接位置 |
|---|---|
| Banner target 可选；无 target 纯展示；失效 target 不可点击；只允许内部白名单 | P24-A10 / A11 + P24-B2-07 / B2-08 / B2-09 |
| Announcement 同公告+同客户按统一业务时区每日最多主动弹一次 | P24-A04 |
| 关闭公告弹层不创建已读事实 | P24-A05 + P24-B2-02 / B2-03 |
| Announcement lifecycle 的 draft / scheduled / active / ended / reorder | P24-A02 / A12 / A14 |
| Banner reorder 只改展示顺序，不改 target / schedule / placement | P24-A12 / A14 |
| 当前身份 + permission/capability + scope + object/config state 提交重验 | P24-A13 |
| Announcement / Banner 生命周期与关键变更进入审计历史 | P24-A14 |
| `VEHICLE_DETAIL` 详情页广告位固定存在 | P24-R01 / P24-A08 / P24-B2-04 |
| 不建设通用消息中心 / 广告推荐平台 / 任意 Placement Engine | P24-A15 + P24-B2-01 / B2-05 / B2-06 |

## 5.2 Conflict Isolation

扫描结论：

- 上述 later additions / explicit changes 已被 Startup Gate、Batch 1 或 Batch 2 完整吸收；
- 不需要再复制为第二组重复正式规则；
- 未发现新的独立业务对象；
- 未发现新的独立产品状态机；
- 未发现需要用户在多个产品方向间选择却被误塞进 Batch 3 的事项；
- 未把 IA / Low-Fi 视觉承载差异误当成产品规则新增。

因此：

- `NEW_INDEPENDENT_ATOMS = 0`
- `DUPLICATE_RULE_CREATION = 0`
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`
- `BATCH_3_CONFLICT_ISOLATION = PASS`
- `BATCH_3 = NO_NEW_ATOMS / PASS / USER_APPROVED / APPLIED`

这并不代表 PDM-24 已经没有 Final-gap。真正的遗漏 / 缺口 / 新产品选择仍应留到 Batch 4，不得偷渡进 Batch 3。

# 6. Batch 3 执行结果

- `BATCH_3 = NO_NEW_ATOMS / PASS / USER_APPROVED / APPLIED`
- `BATCH_3_CONFLICT_ISOLATION = PASS`
- `NEW_INDEPENDENT_ATOMS = 0`
- `DUPLICATE_RULE_CREATION = 0`
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

# 7. 当前唯一下一步

> **PDM-24 Batch 4 Final-gap Scan：冲突、历史遗漏、证据不足、新业务选择。**

窗口切换后继续时：

- 先读取本工作版与窗口切换交接快照；
- 不重复 Startup Gate / Batch 1 / Batch 2 / Batch 3；
- 直接进入 Batch 4 Final-gap Scan；
- Batch 4 任何候选仍需用户逐项审查；
- Final Closeout 前不得关闭 `HO-P20-P24-001`；
- Final Closeout 前不得 source backwrite PDM-20；
- 不施工 IA / Low-Fi / Engineering。
