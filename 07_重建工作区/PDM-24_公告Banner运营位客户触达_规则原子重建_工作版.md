# PDM-24｜公告 / Banner / 运营位 / 客户触达｜规则原子重建工作版

> 域：Announcement / Banner / Placement / Schedule / Customer-facing Operations  
> 当前状态：`IN_PROGRESS / STARTUP_GATE_PASS / BATCH_1_PASS / BATCH_2_PASS / BATCH_3_PASS / BATCH_4_PASS / PREFINAL_R2_PASS / FINAL_CANDIDATE_READY`  
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

## P24-A02｜公告基础管理闭环｜USER_APPROVED / APPLIED / B4_COMPLETENESS_REVISED

公告至少支持：

- 列表；
- 新建；
- 编辑；
- 标题；
- 正文；
- 启用 / 停用；
- 生效开始日期；
- 结束日期；
- 自动弹出开关；
- 排序；
- 创建人；
- 修改人；
- 创建 / 修改时间。

V1 至少支持按“年-月-日”设置公告有效周期。公告生命周期至少能表达 draft / scheduled / active / ended 等运营事实；具体数据库枚举与时间存储格式留 Engineering。


## P24-A03｜公告客户端只保留 active 与 history 业务入口｜USER_APPROVED / APPLIED

客户端保留“公告”业务：

- 查看当前 active 公告；
- 查看历史公告。

不新增第四个“消息”Tab，不扩成泛化消息中心。

## P24-A04｜公告主动弹层每日频控｜USER_APPROVED / APPLIED / B4_REVISED

Batch 4 已对本条做正式收口，当前 Authority 为：

> **同一 Customer 在同一业务自然日内，公告主动弹层全局最多展示 1 条。**

不是“每个 Announcement 各自每天 1 次”。

同时：

- 只有处于有效周期、已启用且“自动弹出”开启的 Announcement 才进入自动展示候选；
- 触发时机为客户当天第一次进入 / 打开小程序时；
- 当天已经实际展示过 1 条公告后，当天再次进入不再自动弹其他公告；
- 第二天若仍有合法有效公告，则重新获得当天 1 次自动展示机会；
- 自动弹出关闭时，公告仍可在公告业务入口中按其 active/history 规则被主动查看；
- 取消历史“仅首次自动弹出一次”频率模式，不再保留多档频率选择。

客户主动进入公告列表查看不受该每日自动弹层上限限制。


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

## P24-A14｜重要运营配置变更必须可追溯｜USER_APPROVED / APPLIED / B4_COMPLETENESS_REVISED

公告 / Banner 的创建、编辑、启停、排期、排序、target / placement 等重要变更应形成可追溯事实。

公告至少还包括：

- 生效开始日期 / 结束日期变更；
- 自动弹出开关变更；
- 标题 / 正文等内容编辑；
- 普通编辑不重置既有当天展示事实；
- 新建公告形成新的 Announcement 身份，但仍受客户每日全局最多 1 条主动公告约束。

Banner 至少还包括：

- 停用；
- 再启用；
- 再启用前重新校验 placement / target / schedule / permission。

至少交给 PDM-25 统一审计/历史标准承接：

- before；
- after；
- actor；
- time；
- 统一业务时区解释。

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
| Announcement 自动弹层按 Customer + 业务自然日全局最多 1 条；有效周期与自动弹出开关由 Batch 4 收口 | P24-A04 + P24-B4-01～B4-03 |
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

# 7. Batch 4｜Final-gap Scan｜PASS / USER_APPROVED / APPLIED

本批重新对照 9/06 SSOT / Decision、9/19 R10/R12、9/22 Frozen Visual Review、001～078、Current IA、completed-PDM Final 与本窗口用户补充裁决，关闭公告频控、内容字段、Banner 再启用与 PDM-24→PDM-25 outgoing handoff 缺口。

## P24-B4-01｜公告有效周期 + 自动弹出开关 + 每客户每日全局最多 1 条｜USER_APPROVED / APPLIED / USER_REVISED

用户明确取消历史“仅首次自动弹出一次”模式，当前规则：

- 每条 Announcement 可设置生效开始日期与结束日期，V1 至少按“年-月-日”配置；
- Announcement 仍需处于启用且有效周期内，才属于当前有效公告；
- 每条 Announcement 具有“自动弹出：开 / 关”；
- 自动弹出开启时，同一 Customer 在同一业务自然日内，公告主动弹层全局最多实际展示 1 条；
- 触发点为客户当天第一次进入 / 打开小程序；
- 当天已经展示过 1 条公告后，再次进入不继续自动弹其他公告；
- 第二天若仍存在合法有效公告，可重新展示当天 1 条；
- 自动弹出关闭时，不主动弹出，但不因此删除公告；客户仍可按 active/history 规则主动查看；
- 不再建设“仅首次一次 / 每天一次 / 不自动弹”三档频率模式，其中“不自动弹”由独立自动弹出开关承担。

本条正式修订 P24-A04 原“同 Announcement + 同 Customer 每日 1 次”的粒度，收紧为“同 Customer 每日全局最多 1 条公告主动弹层”。

## P24-B4-02｜普通编辑不重置当天展示事实；重新触达用新公告｜USER_APPROVED / APPLIED / CHOICE_2A

- 对现有 Announcement 普通编辑标题、正文、周期、排序等，不重置客户当天已经产生的公告自动展示事实；
- 客户当天已经看过 1 条自动公告后，即使该公告后来被编辑，当天也不再次自动弹出；
- 客户当天尚未进入时，第一次进入读取当时最新有效内容；
- V1 不新增独立“重新发布并重置触达”动作；
- 确需开启一轮新的运营触达时，新建新的 Announcement；
- 新 Announcement 仍受“同一 Customer 每日全局最多 1 条自动公告”约束；
- 旧 Announcement 与旧展示 / 配置历史不得物理覆盖。

## P24-B4-03｜多条有效公告的自动展示选择｜USER_APPROVED / APPLIED

当同一自然日有多条同时满足“启用 + 有效周期 + 自动弹出开启”的 Announcement：

- 客户当天第一次进入时只自动展示 1 条；
- 按后台当前有效排序择一；
- 不连续强制弹出第二、第三条；
- 当天后续再次进入不再自动补弹其他公告；
- 客户主动进入公告业务入口时，可按当前 active/history 规则查看合法公告，不受每日自动弹层上限限制；
- 与资料完善提醒等其他主动弹层同时命中时，继续服从 P24-A06“同一时刻只展示一个主动弹层”；
- 不建立复杂营销优先级 / 客户定向引擎。

## P24-B4-04｜公告字段完整性补回｜USER_APPROVED / APPLIED

Announcement 当前至少具备：

- 标题；
- 正文；
- 启用 / 停用；
- 生效开始日期；
- 结束日期；
- 自动弹出开关；
- 排序；
- 创建人；
- 修改人；
- 创建 / 修改时间。

以上补回到 P24-A02，不再保留独立“频率档位”字段作为产品要求。

## P24-B4-05｜Banner V1 继续只允许内部白名单目标｜USER_APPROVED / APPLIED / CHOICE_5A

对历史“安全外链”表述正式收口：

- V1 Banner target 继续只允许已存在、内部白名单、合法的小程序页面 / 业务对象；
- 不开放任意外链，也不恢复“安全外链”作为当前 V1 能力；
- 后续确需 H5 / 外部链接时，必须重新获得明确产品 Authority，并单独定义域名白名单、平台能力与导航安全边界；
- P24-A11 / P24-B2-07 继续有效。

## P24-B4-06｜Banner 停用不删除；允许再启用并重新校验｜USER_APPROVED / APPLIED

- Banner 停用只把它移出当前有效展示集合，不物理删除对象、配置和历史；
- 停用后允许再次启用；
- 再启用提交时必须重新校验 current identity + permission/capability + scope + placement + target + schedule + object/config state；
- 已过结束日期的 Banner 若需再次展示，必须先形成新的合法有效排期；
- 排序只控制同一 placement 内当前有效 Banner 的展示顺序；
- Banner 不需要复制 Announcement 的 active/history 客户端状态机；历史事实由对象保留 + 配置 / 审计历史承接。

## P24-B4-07｜正式登记 PDM-24 → PDM-25 outgoing handoff｜USER_APPROVED / APPLIED / HANDOFF_REGISTERED

正式 outgoing：

> `HO-P24-P25-001 = HANDOFF_OPEN`

移交 PDM-25 统一承接：

### Announcement

- 创建 / 编辑 / 启停；
- 生效开始日期 / 结束日期；
- 排序；
- 自动弹出开关；
- 标题 / 正文变更；
- 普通编辑不重置当天展示事实；
- 新建公告重新形成 Announcement 身份；
- 每日自动展示事实与统一业务时区解释；
- before / after / actor / time。

### Banner

- 创建 / 编辑 / 启停；
- schedule；
- sort；
- placement；
- target；
- 停用 / 再启用；
- 再启用校验；
- before / after / actor / time。

PDM-25 负责统一 audit / history / timestamp / timezone 标准，不得反向改变 PDM-24 已冻结的 Announcement / Banner 产品语义。

---

# 8. Batch 4 执行结果

- `P24-B4-01～P24-B4-07 = PASS / USER_APPROVED / APPLIED`
- `B4-01 = USER_REVISED`
- `B4-02 = CHOICE_2A`
- `B4-05 = CHOICE_5A`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `NEW_BUSINESS_OBJECT = 0`
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`
- `HO-P24-P25-001 = HANDOFF_OPEN`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

Final Closeout 前仍然：

- 不关闭 `HO-P20-P24-001`；
- 不 source backwrite PDM-20；
- 不把 PDM-24 标记为 COMPLETE；
- 不进入 PDM-25。

# 9. Prefinal Integrity R1｜REPAIR_REQUIRED / NO_HARD_CONFLICT

R1 复核范围：

- P24-R00 / R01；
- P24-A01～A15；
- P24-B2-01～B2-12；
- P24-B4-01～B4-07；
- target=PDM-24 incoming handoff；
- HO-P24-P25-001；
- 9/19 R10 / R12；
- 9/22 Frozen Visual Review；
- 001～078；
- Current IA；
- completed-PDM Final。

R1 未发现 completed-PDM 硬冲突，但发现 4 个语义完整性缺口。用户已“全部同意”，并随后明确“确认执行”。

## P24-LIA-01｜公告日期与每日频控统一按 UTC+8 业务自然日解释｜USER_APPROVED / APPLIED

公告的：

- 生效开始日期；
- 结束日期；
- “当天”；
- “每日”；
- 每日第一次进入机会；

统一按项目业务时区：

> **Asia/Shanghai（UTC+8）**

解释。

规则：

- 后台服务时间 / 统一业务时区是判断 Authority；
- 不信任客户设备本地时区来决定是否跨日；
- 例如配置 10 月 7 日～10 月 30 日，则 10 月 7 日当天进入有效期，10 月 30 日全天仍属于有效期；
- 到 UTC+8 的 10 月 31 日才结束该日期周期；
- PDM-25 继续负责统一 timestamp/history/timezone 技术标准，但不得改变本条产品语义。

## P24-LIA-02｜Announcement 停用 / 到期后的 active-history 转换与再启用｜USER_APPROVED / APPLIED

Announcement：

- 到达结束日期后，从当前 active 集合退出并进入 history；
- 人工停用后，从当前 active 集合退出并进入 history；
- 停用 / 到期都不物理删除 Announcement；
- 原配置、内容与操作历史继续保留；
- 人工停用后若再次启用，只有当前仍处于合法有效周期内时才能重新回到 active；
- 若原周期已经结束，必须先配置新的合法有效周期，再允许重新生效；
- 自动弹出关闭不等于 Announcement 停用：自动弹出关闭时，合法 active Announcement 仍可供客户主动查看。

因此：

> active/history 是 Announcement 生命周期投影；auto-popup 是独立运营开关，二者不得混为同一个状态。

## P24-LIA-03｜当天第一次进入机会被其他主动弹层占用时不补弹公告｜USER_APPROVED / APPLIED / CHOICE_3A

当 Customer 当天第一次进入 / 打开小程序，同时命中 Announcement 与其他合法主动弹层时：

- 继续服从 P24-A06：同一时刻只展示一个主动弹层；
- 具体谁先展示不在 PDM-24 冻结；
- 如果该次首次进入最终没有实际展示 Announcement，则本次不写入“Announcement 已展示”事实；
- 但当天“第一次进入”的公告自动触达机会已经结束；
- 关闭其他主动弹层后，不允许立即连续强制补弹 Announcement；
- 当天第二次、第三次再次进入，也不再补弹 Announcement；
- Customer 仍可主动进入公告业务入口查看当前合法公告。

本条正式采用：

> **3A｜严格按当天第一次进入机会解释，不做当天后续补弹。**

这不会改变“同一 Customer 每业务自然日公告主动弹层全局最多实际展示 1 条”的上限。

## P24-LIA-04｜Announcement 排期 Guard + Banner target 合法性 Guard｜USER_APPROVED / APPLIED

### Announcement 排期

- 生效开始日期不得晚于结束日期；
- 无效日期区间不得启用；
- 已结束 Announcement 如需重新生效，必须先形成新的合法有效周期；
- 是否允许保存尚未启用的草稿，不由本条额外制造新的草稿限制；但启用时必须通过有效周期校验。

### Banner target

Banner target 继续可为空。

若配置 target：

- 保存 / 启用时必须是当前存在、内部白名单且合法的小程序页面 / 业务对象；
- 非法 target 不得作为可点击目标保存并带入启用状态；
- Banner 已合法启用后，如果 target 后续因为页面、对象、权限边界等变化而失效，Banner 不物理删除；
- 该 Banner 自动退化为纯展示，不允许点击跳转；
- 再启用或重新配置 target 时，继续重验 current identity + permission/capability + scope + placement + target + schedule + object/config state。

本条继续保持 P24-A10 / A11、P24-B2-07 / B2-08 / B2-09 与 P24-B4-06 的一致性。

---

# 10. Prefinal R1 修复执行结果

- `P24-LIA-01～P24-LIA-04 = PASS / USER_APPROVED / APPLIED`
- `P24-LIA-03 = CHOICE_3A`
- `PREFINAL_R1 = REPAIR_REQUIRED / NO_HARD_CONFLICT`
- `PREFINAL_R1_REPAIR = COMPLETE`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`
- `HO-P24-P25-001 = HANDOFF_OPEN`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

仍然不得：

- 提前关闭 HO-P20-P24-001；
- 提前 source backwrite PDM-20；
- 提前把 PDM-24 标记为 COMPLETE；
- 在 R2 之前直接判定 FINAL_CANDIDATE_READY；
- 修改 IA / Low-Fi / Engineering。

# 11. Prefinal Integrity R2｜PASS / FINAL_CANDIDATE_READY

正式报告：

> `07_重建工作区/PDM-24_Final前完整性复核_R2_2026-10-07.md`

R2 结果：

- `SOURCE_TO_ATOM = PASS`
- `ATOM_TO_SOURCE = PASS`
- `SEMANTIC_COMPLETENESS = PASS`
- `COMPLETED_PDM_INVARIANT = PASS`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `OUTGOING_HANDOFF_GAP = 0`
- `NEGATIVE_CLAIMS = PASS`
- `MISSING_RULE_UNRESOLVED = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM24_FORMAL_UNITS = 40`
- `FINAL_CANDIDATE_READY = YES`

PDM-20 Final 中旧“Vehicle Detail Banner 可选”属于已被 P24-R01 覆盖、待 PDM-24 Final Closeout 时 source backwrite 的历史来源尾巴，不构成 R2 hard conflict。

Final Closeout 前继续：

- `HO-P20-P24-001 = HANDOFF_ACCEPTED`；
- `HO-P24-P25-001 = HANDOFF_OPEN`；
- 不 source backwrite PDM-20；
- 不把 PDM-24 标 COMPLETE；
- 不进入 PDM-25；
- 不施工 IA / Low-Fi / Engineering。

# 12. 当前唯一下一步

> **形成 PDM-24 Final Domain Overview，并提交用户最终批准。**
