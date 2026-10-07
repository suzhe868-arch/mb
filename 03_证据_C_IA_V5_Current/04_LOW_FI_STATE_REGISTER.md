# 04 LOW-FI STATE REGISTER — PHASE 1.5 IA CURRENT

<!-- IA-GLOBAL-B4-STATE -->
> **IA Batch 4 State 正规化｜2026-10-08**
>
> - P02-06 的 `SUPPLY_ANOMALY / REVIEWING / CLEARED_HISTORICAL` 是风险事实/复核状态，不是“全部新业务禁止”总状态。
> - P03-03 / P03-04 Collector 电话连接状态退出 Current。
> - P06-06 独立 Recommendation qualification 状态退出 Current。

<!-- IA-GLOBAL-B2-B3-STATE -->
> **IA Batch 2 + 3 State 覆盖｜2026-10-08**
>
> **DEPRECATED / DO_NOT_RESTORE**
> - RECOMMENDATION_QUALIFIED / NOT_QUALIFIED；
> - Customer-specific Matching / customer-exclusive Matching states；
> - 人工 Priority create/transfer/override/renew/revive；
> - Opportunity 旧阈值/工单/SLA/close 主状态机；
> - Consultation CANCELLED 第五主状态；
> - Refund partial 主状态；
> - Waitlist 自动晋升 Lock；
> - 客户保证性候补排名；
> - Announcement 旧三档 frequency / republish-reset；
> - 通用消息 read/unread 主状态机。
>
> **当前真实状态**
> - Model governance：mapping_pending、model_missing、mapping_conflict 必须分层；JYT 已知车型事实不因本地 mapping pending/conflict 变 unknown。
> - Draft：多个独立 draft；正式发布前不进入 Vehicle/listing_cycle。
> - Archive：current version / invalidated / superseded history 与 customer_visible 独立。
> - Image assetization：processing / success / partial_failed / failed；临时受控回源不等于 success。
> - Phone：cached/latest/PHONE_UNAVAILABLE 分层；latest 未取新号码但存在旧有效缓存时不得进入“完全无号码”状态。
> - Price：LIMITED / UNLIMITED；customer disable 只暂停 protected price capability，不删除既有 price-right。
> - Matching：high / acceptable / confirmation_needed / no_match；confirmation 后先补事实再重算，不直接写 tier。
> - Priority：qualification enabled/disabled 与 active/ended Priority 分层；active Priority 不等于 visibility/price-right。
> - Recommendation：其他 Customer Priority 期间可临时 suppression，但历史对象不删除。
> - LockRequest：PENDING / APPROVED / REJECTED / EXPIRED / LOCK_CONFLICT / CLOSED_NOT_LOCKABLE；LOCK_CONFLICT 可关联 resulting_waitlist_id。
> - Waitlist：active/history/end；无自动 promotion。
> - Lock：active/ended + expires_at；普通 Lock 与 Priority-origin Lock 的 visibility projection 分层；Deposit 后不再按普通倒计时释放语义。
> - Refund：pending / refunded / closed；closed ≠ refunded。
> - Transaction：in_progress / completed / cancelled；correction 是追加真实事实，不抹除历史，不自动 relist/new cycle。
> - Announcement 与 Banner 为独立对象；Banner placement = HOME_TOP / VEHICLE_DETAIL。


<!-- IA-GLOBAL-B1-STATE -->
> **IA Batch 1 状态覆盖｜2026-10-08**
>
> 当前新增/修正 canonical state 语义：
>
> - `owner_assignment_pending`：仅用于接客池异常为空且无其他合法优先归属来源的新 Customer；接客池恢复后自动重试 owner 分配。
> - `MERGE_*` / `merge_blocked` / `merge_ready` / `merge_confirm` / `merged`：全部 `DEPRECATED / DO_NOT_RESTORE`，不再属于 V1 Current 状态集合。
> - Vehicle 状态按三层事实承载：真实资源/可售事实、visibility（visible/hidden）、业务对象占用/交易事实；禁止合并成单一 `vehicle_status`。
> - `hidden` 不代表 offline；`locked` / `trading` 不改变底层真实车辆事实。
> - `source_type` 修改及 wholesale→mingbang 转换不是 listing_cycle 状态迁移；不产生新 cycle。
> - 只有真实不可售/失效后再次真实可售才产生新 `listing_cycle`。


## Rules

- `LOADING / EMPTY / ERROR / PERMISSION_DENIED / DISABLED` are rendering/control states only.
- `LOCKED / WAITLISTED / COMPLETED / CANCELLED / EXPIRED / HISTORICAL / PROCESSING / PARTIAL_FAILURE` are used only on screens whose underlying SSOT/State/Decision supports the corresponding fact.
- Low-Fi does not create new domain states.

| Page ID | State | Authority basis | Rendering rule |
|---|---|---|---|
| C01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C01 | LOADING | Generic UI execution state; no domain mutation | 骨架屏；不显示伪数据 |
| C01 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| C01 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| C01-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C01-01 | LOADING | Generic UI execution state; no domain mutation | 骨架屏；不显示伪数据 |
| C01-01 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| C01-01 | LOCKED | Underlying SSOT/IA business state/history/recovery fact | 车辆/锁车已锁定事实 |
| C01-01 | WAITLISTED | Underlying SSOT/IA business state/history/recovery fact | 当前有效候补事实 |
| C01-01 | HISTORICAL | Underlying SSOT/IA business state/history/recovery fact | 历史只读安全投影 |
| C01-01 | PERMISSION_DENIED | Generic UI execution state; no domain mutation | 无权限，不泄露受保护字段 |
| C02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C02 | LOADING | Generic UI execution state; no domain mutation | 骨架屏；不显示伪数据 |
| C02 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| C02 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| C02 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| C02 | COMPLETED | Underlying SSOT/IA business state/history/recovery fact | 业务已完成/终态只读 |
| C02 | CANCELLED | Underlying SSOT/IA business state/history/recovery fact | 已取消/终态只读 |
| C02-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C02-01 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| C02-01 | COMPLETED | Underlying SSOT/IA business state/history/recovery fact | 业务已完成/终态只读 |
| C02-01 | CANCELLED | Underlying application closure/withdrawal fact | 员工关闭或客户撤回 pending application；终态只读，不创建正式 Demand |
| C02-01 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| C02-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C02-02 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| C02-02 | PAUSED | Underlying Demand paused fact | 员工暂停正式 Demand 的客户安全投影；可恢复前不参与 active matching，但不是终态 |
| C02-02 | COMPLETED | Underlying SSOT/IA business state/history/recovery fact | 业务已完成/终态只读 |
| C02-02 | CANCELLED | Underlying SSOT/IA business state/history/recovery fact | 已取消/终态只读 |
| C02-02 | HISTORICAL | Underlying SSOT/IA business state/history/recovery fact | 历史只读安全投影 |
| C03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C03 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| C03-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C03-01 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| C03-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C03-02 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| C03-02 | ACTIVE | Underlying active Recommendation fact | 当前 customer+vehicle+listing_cycle 的有效推荐；与 Priority 和查价权分离 |
| C03-02 | ENDED | Underlying manually ended or cycle-ended Recommendation fact | 已结束且不复活；保留来源与周期历史 |
| C03-02 | VOID | Underlying voided Recommendation fact | 建错后作废；保留原因和历史；修正须新建 Recommendation |
| C03-02 | HISTORICAL | Underlying Recommendation history | 旧 cycle/终态只读；新 cycle 需新 Recommendation |
| C03-03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C03-03 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| C03-03 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| C03-03 | COMPLETED | Underlying SSOT/IA business state/history/recovery fact | 业务已完成/终态只读 |
| C03-03 | INVALID | Underlying Consultation invalid fact | 员工端无效结论的客户安全投影；不改变 customer owner |
| C03-03 | CANCELLED | Underlying Consultation withdrawal/normal closure fact | 客户撤回或正常关闭；不得混同 INVALID |
| C03-03 | HISTORICAL | Underlying Consultation terminal history | 终态后历史只读；后续新建新 Consultation |
| C03-04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C03-04 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| C03-04 | LOCKED | Underlying SSOT/IA business state/history/recovery fact | 车辆/锁车已锁定事实 |
| C03-04 | WAITLISTED | Underlying SSOT/IA business state/history/recovery fact | 当前有效候补事实 |
| C03-04 | RELEASED | Underlying Lock release fact | 原 Lock 已结束；候补仅等待人工重新确认，不自动晋升 |
| C03-04 | NOT_LOCKABLE | Current vehicle/cycle/occupancy guard | 车辆当前不可锁；展示阻断原因，不创建 Lock |
| C03-04 | EXPIRED | Underlying SSOT/IA business state/history/recovery fact | 到期/失效事实 |
| C03-04 | HISTORICAL | Underlying SSOT/IA business state/history/recovery fact | 历史只读安全投影 |
| C03-05 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C03-05 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| C03-05 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| C03-05 | COMPLETED | Underlying SSOT/IA business state/history/recovery fact | 业务已完成/终态只读 |
| C03-05 | CANCELLED | Underlying SSOT/IA business state/history/recovery fact | 已取消/终态只读 |
| C03-05 | HISTORICAL | Underlying SSOT/IA business state/history/recovery fact | 历史只读安全投影 |
| C03-06 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C03-07 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C-O01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C-O02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C-O03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| C-O04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E01 | LOADING | Generic UI execution state; no domain mutation | 骨架屏；不显示伪数据 |
| E01 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| E01 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| E01 | PERMISSION_DENIED | Generic UI execution state; no domain mutation | 无权限，不泄露受保护字段 |
| E01-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E01-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E01-03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E01-04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E02 | LOADING | Generic UI execution state; no domain mutation | 骨架屏；不显示伪数据 |
| E02 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| E02 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| E02-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E02-01 | LOADING | Generic UI execution state; no domain mutation | 骨架屏；不显示伪数据 |
| E02-01 | LOCKED | Underlying SSOT/IA business state/history/recovery fact | 车辆/锁车已锁定事实 |
| E02-01 | HISTORICAL | Underlying SSOT/IA business state/history/recovery fact | 历史只读安全投影 |
| E02-01 | PERMISSION_DENIED | Generic UI execution state; no domain mutation | 无权限，不泄露受保护字段 |
| E02-M01 | AUTHORIZED | Temporary internal projection | 长按价格约3秒并通过后端权限/范围校验后显示内部能力 |
| E02-M01 | PERMISSION_DENIED | Temporary authz failure state | 保持客户安全详情，不返回任何内部字段 |
| E02-M01 | ACTION_DISABLED | Per-action authorization/scope/object guard | 已进入内部模式但当前敏感动作不可用；不补权；可退出回 E02-01 |
| E02-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E02-02 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| E02-02 | PARTIAL_FAILURE | Underlying SSOT/IA business state/history/recovery fact | 部分失败，列出成功/失败并允许合法重试 |
| E02-02 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| E02-02 | DISABLED | Generic UI execution state; no domain mutation | 前置条件不满足，展示阻断原因 |
| E02-02 | MODEL_MISSING | Current manual-upload valid-local-model requirement | 未找到可绑定的有效本地车型；普通销售只能保留草稿；`vehicle.model.manage` 人员可进入 P02-08 绑定既有有效节点或保留/纠正现有映射，车辆页不推导创建车型权限 |
| E02-02 | DRAFT_RESUME | 再次进入时继续上次或放弃重新发布 | 不创建 listing_cycle；放弃需删除本人未完成草稿 |
| E02-03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E02-04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E03 | LOADING | Generic UI execution state; no domain mutation | 骨架屏；不显示伪数据 |
| E03 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| E03 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| E03 | PERMISSION_DENIED | Generic UI execution state; no domain mutation | 无权限，不泄露受保护字段 |
| E03-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E03-01 | LOADING | Generic UI execution state; no domain mutation | 骨架屏；不显示伪数据 |
| E03-01 | PERMISSION_DENIED | Generic UI execution state; no domain mutation | 无权限，不泄露受保护字段 |
| E03-01 | HISTORICAL | Underlying SSOT/IA business state/history/recovery fact | 历史只读安全投影 |
| E03-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E03-03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E03-04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E03-04 | RECOMMENDATION_ACTIVE | Underlying active Recommendation fact | 仅 current owner 可按已确认边界结束/作废本人负责客户的有效 Recommendation |
| E03-04 | RECOMMENDATION_ENDED | Manual end or listing_cycle end | 终止当前有效性并保留历史；资格恢复不复活 |
| E03-04 | RECOMMENDATION_VOID | Current owner voided incorrect object | 记录原因、操作者、时间；重建新对象，不覆盖旧事实 |
| E03-04 | HISTORICAL | Underlying customer business history | Recommendation 终态和 cycle 历史只读 |
| E03-05 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E03-06 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E05 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E05-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E05-01 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| E05-01 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| E05-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E05-02 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| E05-02 | COMPLETED | Underlying SSOT/IA business state/history/recovery fact | 业务已完成/终态只读 |
| E05-02 | CANCELLED | Underlying SSOT/IA business state/history/recovery fact | 已取消/终态只读 |
| E05-03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E05-03 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| E05-04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E05-04 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| E05-04 | PAUSED | Underlying Demand paused fact | 可恢复、完成或取消；不参与 active Demand 匹配；仍阻断 Customer 合并 |
| E05-04 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| E05-04 | COMPLETED | Underlying SSOT/IA business state/history/recovery fact | 业务已完成/终态只读 |
| E05-04 | CANCELLED | Underlying SSOT/IA business state/history/recovery fact | 已取消/终态只读 |
| E05-05 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E05-05 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| E05-05 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| E05-05 | PARTIAL_FAILURE | Underlying SSOT/IA business state/history/recovery fact | 部分失败，列出成功/失败并允许合法重试 |
| E05-05 | HIGH | HR-01 four-tier Matching result | 高匹配候选；仍需服从 Priority 仲裁与对象状态，不自动成为 Recommendation |
| E05-05 | ACCEPTABLE | HR-01 four-tier Matching result | 可接受候选；仍需服从 Priority 仲裁与对象状态 |
| E05-05 | CONFIRMATION_NEEDED | HR-01 four-tier Matching result | 进入 E05-06 人工确认；未确认前不创建 Priority |
| E05-05 | NO_MATCH | HR-01 four-tier Matching result | 无匹配；允许修改 Demand 条件或等待后续匹配，不偷偷放宽硬条件 |
| E05-05 | HIDDEN_CONTROLLED | HR-03 controlled hidden-vehicle visibility | 仅对应客户与授权员工在 Demand/Priority 上下文可见；不进入公共 Feed |
| E05-06 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E05-06 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| E05-06 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| E05-06 | CONFIRMATION_NEEDED | HR-01 confirmation boundary | 展示待确认条件/冲突；不创建 Priority |
| E05-06 | CONFIRMED | Explicit sales confirmation fact | 返回 E05-05 并进入正常 Priority 仲裁，不自动创建 Recommendation |
| E05-06 | REJECTED | Explicit rejection/correction fact | 返回 E05-04 修正/继续 Demand；不创建 Priority |
| E06 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E06-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E06-01 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| E06-01 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| E06-01 | COMPLETED | Underlying SSOT/IA business state/history/recovery fact | 业务已完成/终态只读 |
| E06-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E06-02 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| E06-02 | COMPLETED | Underlying SSOT/IA business state/history/recovery fact | 业务已完成/终态只读 |
| E06-02 | INVALID | Underlying Consultation invalid fact | 无效终态；同步客户 C03-03 INVALID，不改变 owner |
| E06-02 | CANCELLED | Underlying SSOT/IA business state/history/recovery fact | 已取消/终态只读 |
| E06-02 | HISTORICAL | Underlying SSOT/IA business state/history/recovery fact | 历史只读安全投影 |
| E07 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E07 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| E07-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E07-01 | LOCKED | Underlying SSOT/IA business state/history/recovery fact | 车辆/锁车已锁定事实 |
| E07-01 | EXPIRED | Underlying SSOT/IA business state/history/recovery fact | 到期/失效事实 |
| E07-01 | HISTORICAL | Underlying SSOT/IA business state/history/recovery fact | 历史只读安全投影 |
| E07-01 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| E07-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E07-02 | WAITLISTED | Underlying SSOT/IA business state/history/recovery fact | 当前有效候补事实 |
| E07-02 | HISTORICAL | Underlying SSOT/IA business state/history/recovery fact | 历史只读安全投影 |
| E07-02 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| E07-03 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| E07-03 | COMPLETED | Underlying SSOT/IA business state/history/recovery fact | 业务已完成/终态只读 |
| E07-03 | CANCELLED | Underlying SSOT/IA business state/history/recovery fact | 已取消/终态只读 |
| E07-03 | HISTORICAL | Underlying SSOT/IA business state/history/recovery fact | 历史只读安全投影 |
| E07-03 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| E07-04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E07-04 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| E07-04 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| E07-05 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| E07-05 | COMPLETED | Underlying SSOT/IA business state/history/recovery fact | 业务已完成/终态只读 |
| E07-05 | CLOSED | D11 pending Refund close/withdraw fact | 已关闭但未退款；保留原因、操作者、时间，不占车 |
| E07-05 | HISTORICAL | Underlying Refund history | pending/completed/closed 均保留来源与多笔事实；车辆可锁性另按正常 guard |
| E07-05 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| E07-06 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E07-06 | HISTORICAL | Underlying SSOT/IA business state/history/recovery fact | 历史只读安全投影 |
| E07-06 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| E08 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| E08 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| E08 | PERMISSION_DENIED | Generic UI execution state; no domain mutation | 无权限，不泄露受保护字段 |
| E08-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P01 | LOADING | Generic UI execution state; no domain mutation | 骨架屏；不显示伪数据 |
| P01 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| P01 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| P02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P02 | LOADING | Generic UI execution state; no domain mutation | 骨架屏；不显示伪数据 |
| P02 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| P02 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| P02-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P02-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P02-03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P02-04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P02-05 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P02-06 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P02-07 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P02-07 | LOADING | Generic UI execution state; no domain mutation | 骨架屏；不显示伪数据 |
| P02-07 | HISTORICAL | Underlying SSOT/IA business state/history/recovery fact | 历史只读安全投影 |
| P02-07 | PERMISSION_DENIED | Generic UI execution state; no domain mutation | 无权限，不泄露受保护字段 |
| P02-07 | PARTIAL_FAILURE | Underlying SSOT/IA business state/history/recovery fact | 部分失败，列出成功/失败并允许合法重试 |
| P03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P03-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P03-01 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| P03-01 | PARTIAL_FAILURE | Underlying SSOT/IA business state/history/recovery fact | 部分失败，列出成功/失败并允许合法重试 |
| P03-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P03-05 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P03-06 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P03-06 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| P03-06 | COMPLETED | Underlying SSOT/IA business state/history/recovery fact | 业务已完成/终态只读 |
| P03-06 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| P03-07 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P04-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P04-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P04-03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P04-04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P04-05 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P04-06 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P04-06 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| P04-06 | PARTIAL_FAILURE | Underlying SSOT/IA business state/history/recovery fact | 部分失败，列出成功/失败并允许合法重试 |
| P04-06 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| P04-06 | DISABLED | Generic UI execution state; no domain mutation | 前置条件不满足，展示阻断原因 |
| P04-07 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P05 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P05-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P05-01 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| P05-01 | PERMISSION_DENIED | Generic UI execution state; no domain mutation | 无权限，不泄露受保护字段 |
| P05-01 | DISABLED | Generic UI execution state; no domain mutation | 前置条件不满足，展示阻断原因 |
| P05-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P06 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P06-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P06-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P06-03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P06-04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P06-05 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P06-05 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| P06-05 | DISABLED | Generic UI execution state; no domain mutation | 前置条件不满足，展示阻断原因 |
| P06-05 | PERMISSION_DENIED | Generic UI execution state; no domain mutation | 无权限，不泄露受保护字段 |
| P06-07 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P06-08 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P06-09 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P06-10 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P06-10 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| P06-10 | PARTIAL_FAILURE | Underlying SSOT/IA business state/history/recovery fact | 部分失败，列出成功/失败并允许合法重试 |
| P06-10 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| P06-11 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P06-11 | PROCESSING | Underlying Consultation processing fact | PC 与 E06-02 为同一 Consultation 状态投影 |
| P06-11 | COMPLETED | Underlying Consultation resolved fact | 已解决终态，只读保留历史并同步 C03-03 |
| P06-11 | INVALID | Underlying Consultation invalid fact | 无效终态，不改变 customer owner，并同步 C03-03 |
| P06-11 | CANCELLED | Underlying Consultation withdrawal/normal-close fact | 客户撤回或授权负责人正常关闭；与 C03-03/E06-02 同一对象终态，绝不混同 INVALID |
| P06-11 | REASSIGN_DENIED | D5 actor/scope/target guard failed | 不改变 Consultation；不泄露越权目标数据 |
| P06-11 | HISTORICAL | Underlying terminal history | 终态历史只读；后续咨询新建对象 |
| P07 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P07-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P07-01 | LOCK_CREATE_CONFIRM_REQUIRED | Waitlist manual-review path | 只表示 PC 提交确认页；最终提交使用 E02-04/E03-06 同一 canonical guard：active eligible Mingbang、非 4S、明确 Lock capability、customer/vehicle scope、current cycle/source/occupancy，并重验 identity/permission/scope/state；取消不创建 Lock |
| P07-01 | LOCKED / RELEASED / EXPIRED / HISTORICAL | Underlying Lock lifecycle | 与 E07-01/C03-04 同一事实；结束后旧 Lock 不复活 |
| P07-01 | PERMISSION_DENIED | Lock action authz/scope guard | 不执行敏感动作，不泄露超范围数据 |
| P07-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P07-02 | WAITLISTED / RELEASED / NOT_LOCKABLE / HISTORICAL | Underlying Waitlist and current Lock guard | Waitlist itself never occupies the vehicle; release only opens manual review/revalidation and never auto-promotes to Lock |
| P07-02 | PERMISSION_DENIED | Waitlist action authz/scope guard | 不结束或新建业务对象 |
| P07-03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P07-03 | EMPTY / RECORDED / CORRECTED / HISTORICAL | Deposit fact and append-only correction history | 实收与更正分离；原事实不覆盖 |
| P07-03 | PERMISSION_DENIED | Deposit action authz/scope guard | 不记录收款或更正 |
| P07-04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P07-04 | IN_PROGRESS / COMPLETED / CANCELLED / HISTORICAL | Transaction lifecycle fact | 首次完成独立鉴权；取消不恢复旧 Lock/Waitlist |
| P07-04 | PERMISSION_DENIED | Transaction action authz/scope guard | 不创建、完成或取消 Transaction |
| P07-05 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P07-05 | PROCESSING / COMPLETED / CLOSED / HISTORICAL | Refund lifecycle fact | pending/completed/closed 均不占车；CLOSED 不是 refunded |
| P07-05 | PERMISSION_DENIED | Refund action authz/scope guard | 不创建、确认或关闭 Refund |
| P07-06 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P07-06 | PROCESSING | Underlying SSOT/IA business state/history/recovery fact | 处理中，防重复提交 |
| P07-06 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| P07-06 | HISTORICAL | Underlying SSOT/IA business state/history/recovery fact | 历史只读安全投影 |
| P08 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P08-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P08-01 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| P08-01 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| P08-01 | DISABLED | Generic UI execution state; no domain mutation | 前置条件不满足，展示阻断原因 |
| P08-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P08-03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P08-04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P09 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P09-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P09-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P09-03 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P09-04 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P09-04 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| P09-04 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| P10 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P10-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P10-01 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| P10-01 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| P10-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P12 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P12-01 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P12-01 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| P12-01 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| P12-01 | DISABLED | Generic UI execution state; no domain mutation | 前置条件不满足，展示阻断原因 |
| P12-02 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P12-02 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| P12-02 | DISABLED | Generic UI execution state; no domain mutation | 前置条件不满足，展示阻断原因 |
| P11 | NORMAL | Underlying SSOT/IA business state/history/recovery fact | 正常业务内容 |
| P11 | EMPTY | Generic UI execution state; no domain mutation | 真实空态 + 合法下一步 |
| P11 | ERROR | Generic UI execution state; no domain mutation | 加载/提交失败 + 重试 |
| P11 | PERMISSION_DENIED | Generic UI execution state; no domain mutation | 无权限，不泄露受保护字段 |

## PHASE 04.5 added execution variants

- `4S_PERMISSION_VARIANT`: existing permission/scope rendering; Customer CRM-related navigation is hidden for default 4S role.
- `E-AUTH01/P-AUTH01`: authentication bootstrap/denial states derive from existing identity-domain technical contract and do not add product states.

## CR-001 STATE DELTA
No new product/business state. Banner effective/empty is a render condition; copy/dial are UI actions; date visibility is configuration-derived.

| P02-08 | NORMAL | HR mapping confirmation and `vehicle.model.manage` boundary | pending/conflict/resolved filters；仅 bind existing / retain / correct；不从本页推导 model creation authority |

## CR-006.2 states

| SCREEN_ID | States | Rule |
|---|---|---|
| E02-02 | NORMAL / PROCESSING / PARTIAL_FAILURE / ERROR / DISABLED / MODEL_MISSING / DRAFT_RESUME | PREVIEW removed; draft recovery is explicit |
| E02-05 | NORMAL | wholesale source snapshot is read-only |
| C01-BS01 / C01-BS02 / C01-M01 / C01-M02 / E07-M01 / P07-M01 / P12-M01 | NORMAL | physical overlays for registered actions |

## Phase 1.5 IA execution states

These are UI/IA projections or historical outcomes. They do not create additional business master states unless the Phase 1.5 Decision Register already requires the underlying fact.

| Page | IA state / projection | Meaning and exit |
|---|---|---|
| E03-02 / P06-03 | PERSONAL_NOTE_VISIBLE | Visible to author and authorized manager only; owner transfer does not pass it to the new owner |
| E03-02 / P06-03 | SHARED_PROFILE_VISIBLE | Visible to current owner, explicit collaborators and authorized managers/store managers in scope |
| E06-02 / P06-11 | REASSIGN_DENIED | Actor lacks authority/scope or target is inactive/ineligible; consultation master state is unchanged |
| E07-03 / P07-04 | COMPLETE_PERMISSION_DENIED | Only an authorized manager/store manager in scope may first mark completed; transaction remains in progress |
| E07-04 / P07-03 | CORRECTION_CONFIRM_REQUIRED | Append-only deposit correction requires funds-correction authority, reason and audit |
| E07-05 / P07-05 | REFUND_PENDING_CLOSE_AVAILABLE | Authorized manager/store manager may withdraw/close an unexecuted pending refund with reason |
| E07-05 / P07-05 | REFUND_CLOSED_NOT_REFUNDED | Historical display after withdrawal/closure; it is not `refunded` and does not change vehicle occupancy |
| C01-M01 / C01-01 | PRICE_CHECK_FAILED_NO_DEBIT | Failure/timeout does not debit quota; retry is idempotent; no internal wholesale price is exposed |
| P06-01 | CUSTOMER_MERGE_BLOCKED_ACTIVE_DEMAND | Merge cannot proceed until active/paused Demand is completed or cancelled |
| P08-04 / P02-07 | NEW_CYCLE_OVERRIDE_NOT_INHERITED | Old manual display-price override ended with old listing cycle |
| E02-01 / P03-05 | LATEST_PHONE_FAILED_CACHE_AVAILABLE | Latest fetch failed; cached phone may remain usable but must not be labeled latest |
| C01 / C01-01 | BANNER_DISPLAY_ONLY | No target, invalid target or expired target; display is allowed but navigation is disabled |
| P09-04 / P11 | NOTIFICATION_FAILED_BUSINESS_UNCHANGED | Delivery failure is logged; business fact and master state do not change |

## Removed state/configuration interpretations

- `DP-01（原历史候选 HO-12）`: no 7-day inactivity, single-day browsing count or consecutive-3-day threshold control.
- Consultation timeout is an SLA flag/filter only, never a fifth consultation master state.
- Refund pending never occupies a vehicle.
- Transaction cancellation never restores an old Lock.
- Waitlist release never auto-promotes to Lock.
- Internal mode never grants a permission by itself.

## Phase 1.5 enhanced cold-start projections

以下状态用于把已确认业务事实持久化到 IA，不新增业务主状态。

| Page / Overlay | IA state / projection | Authority basis | Entry / exit / rendering rule |
|---|---|---|---|
| C01-M03 | NORMAL | Overlay interaction shell | Waiting for share/referral result; no source or owner fact is implied before completion |
| C01-M03 | SOURCE_ONLY | D1; Step5 C02 | 有效分享已记录来源，但分享人不合格/inactive 或其他 owner 规则不成立；按原始入口返回 |
| C01-M03 | OWNER_ASSIGNED | D1; Step5 C02 | 无 owner 且本人有效分享人 active/合格时形成 owner；按 originating action 返回 E02-01 |
| C01-M03 | OWNER_UNCHANGED | Step5 C03 | 已有 owner 时追加触达但不抢客；按 originating action 返回 E02-01 |
| C01-M03 | ERROR | Generic UI failure | 分享结果未确认；可重试，不伪造 owner |
| C01-BS01 / C01-BS02 | NORMAL | Existing filter/sort interaction | C01 进入；应用或取消均回 C01；零结果不自动放宽条件 |
| C01-M02 | NORMAL | Existing Waitlist confirmation | C01-01 进入；确认后 C03-04，取消回 C01-01 |
| E07-M01 | NORMAL | HO-06 Lock release confirmation | E07-01 进入；确认结束 Lock 并回 E07-01，取消无变更 |
| P07-M01 | NORMAL | HO-07 correction confirmation | P07-06 进入；确认追加纠错并回 P07-06/P02-07，取消无变更 |
| E06-M01 | NORMAL / DENIED / ERROR | D5 Consultation reassignment | E06-02 进入；确认后回 E06-02；拒绝/错误不改变 Consultation |
| E07-M02 / P07-M02 | NORMAL / DENIED / ERROR | D10 Deposit correction | E07-04/P07-03 进入；确认追加事实；取消/拒绝不改变 Deposit |
| E07-M03 / P07-M03 | NORMAL / DENIED / ERROR | D11 Refund close | E07-05/P07-05 进入；确认形成 CLOSED_NOT_REFUNDED；取消保持 pending |
| P06-M01 | NORMAL / MERGE_BLOCKED / MERGE_READY / MERGING / MERGED / MERGE_HISTORICAL | D13; Step7; NEW-01 | NORMAL 为 overlay shell；active/paused Demand 时只能返回 P06-09 处理或取消；无阻断后可显示 READY、显式确认并投影 MERGING/MERGED；历史不可变 |
| P12-M01 | NORMAL | D6 Banner lifecycle confirmation | P12-01 进入；确认/取消均回 P12-01；无效目标不得启用导航 |
| E02-M01 | AUTHORIZED | DP-05; Step4 E02/S4-C15 | 仅代表 active Mingbang employee 通过身份/范围校验；各字段/动作继续独立鉴权；退出回 E02-01 |
| E02-M01 | PERMISSION_DENIED | DP-05 | 保持客户安全详情，不返回内部价/电话/VIN；退出回 E02-01 |
| E02-M01 | ACTION_DISABLED | Step4 S4-C15 | 某敏感动作缺权限、超范围或对象状态不允许；内部模式本身不补权 |
| E05-04 | MATCHING_READY | HR-01 | active Demand 可启动/刷新匹配；paused/terminal 不进入匹配 |
| E05-05 | PRIORITY_ACTIVE | HR-02 | high/acceptable 或已确认候选按唯一仲裁形成 active Priority；同车同刻唯一，和 Recommendation/查价权分离 |
| E05-05 | PRIORITY_ENDED | HR-02/03 | 到期/释放/Lock 接管等结束后恢复底层可见性；hidden 仍不回公共 Feed |
| E07-02 / C03-04 | WAITLIST_RELEASE_REVIEW | HO-06 | Waitlist never occupies the vehicle; after prior Lock release notify responsibility, then manual recheck may enter normal Lock; never auto-promote |
| E07-03 / C03-05 | TRANSACTION_CANCELLED | HO-05 | Transaction 终止并历史化；旧 Lock/候补不复活；车辆资格按真实车源、current cycle、其他占用重算 |
| E07-05 / C03-05 | REFUND_PENDING | HO-04/D11 | 单 pending、余额和客户一致；不占车；等待授权经理/店长完成或关闭 |
| E07-05 / C03-05 | REFUND_COMPLETED | HO-04/D4 | 实际退款事实已确认；保留来源/金额；不单独改变车辆可锁性 |
| E07-05 / C03-05 | REFUND_CLOSED_NOT_REFUNDED | D11 | 未执行 pending 已关闭；不是 refunded，不占车；后续走正常 Lock/Transaction guard |
| E02-01 / P02-07 | LISTING_CYCLE_ENDED | Step5 C15/V05; Step7 Listing Cycle | 真实下架结束旧 cycle；隐藏不触发 |
| E02-01 / P02-07 | RELIST_NEW_CYCLE | Step5 C15/V05; D8 | 同车真实再上架创建新 cycle；旧覆盖价不继承；普通 relist 不重抓冻结图片 |
| E02-01 / P02-07 | HIDDEN_IN_CURRENT_CYCLE / RESTORED_IN_CURRENT_CYCLE | Step5 V04/V05 | 隐藏/恢复只改变受控可见性并审计，不结束或新建 listing_cycle |
| E02-05 / P02-07 | SOURCE_TYPE_CHANGED | Step5 V08 | 保留 vehicle_id、current cycle 与历史；即时按新 source_type 重算责任、可编辑字段和可见性 |
| C01-M01 / P08-02 | PRICE_CHECK_SUCCESS_DEBITED | HR-08/D12 | 仅成功解锁价格时扣当日额度；同 customer+vehicle+cycle 幂等，不重复扣 |
| C01-M01 / P08-02 | PRICE_CHECK_FAILED_NO_DEBIT | D12 | 失败/超时不扣；可幂等重试 |
| P08-04 / P02-07 | PRICE_SNAPSHOT_HISTORY | HR-08 | 价格/覆盖值按 listing cycle 留快照与前后值；新 cycle 不继承旧人工覆盖 |
| E08 / P06-05 | PUBLIC_POOL_CLAIM_DENIED | HR-09 | 缺权限、超范围、已有 owner 或存在保护冲突时阻断，不改变 owner |
| E08 / P06-05 | PUBLIC_POOL_OWNER_ASSIGNED | HR-09 | 合法领取/指定分配后形成唯一 owner，并保留来源和 owner 历史 |
| P03-06 / P09-03/04 | UTC8_DEADLINE_AND_DND | HR-12/13 | deadline 以服务端 UTC+8 固化；免打扰期暂停发送，恢复后重判事件是否仍有效 |
| P10-01/02 / C-O03 | DAILY_ANNOUNCEMENT_FREQUENCY | HR-14 | 同公告同客户 UTC+8 每日最多主动弹一次；关闭弹层不生成已读状态 |
| E02-02 / P02-07 / P11 | VEHICLE_TIME_LABELS | HR-15/16 | 分别展示人工上传时间、JYT 接入时间、current cycle 上架时间；历史追加保留、不物删 |
| P04-01/03/04 | FOUR_S_MANAGEMENT_ALLOWED | D7 | 店长须有 4S 管理权限+合作范围；经理仅显式授予后可用；System Admin 不自动获得 |
| P04-01/03/04 | FOUR_S_MANAGEMENT_DENIED | D7 | 缺权限/范围、自提权、越级或 System Admin 单一身份时禁用并说明原因 |
| P02-04 / E04 | FOUR_S_COOPERATION_SCOPE | D7; Step4 S4-C08/09 | 只展示/管理 cooperation scope 内 4S 身份与车源；敏感车辆动作另验权限；不显示名邦内部价 |

## PC role projection matrix

| Role | View entry | Action projection | Negative permission projection |
|---|---|---|---|
| SALES | 授权的 P01/P02/P03/P06/P07/P08/P09/P10/P11/P12 数据范围 | 当前负责人及已授业务动作 | P04/P05 隐藏；首次成交、资金/成交纠错、Refund close 禁用 |
| MANAGER | SALES + 授权团队 CRM/公海/交接/业务页 | 只有独立 permission + scope 的管理动作 | 职位不自动获得敏感车辆、资金、4S、Recommendation 管理能力 |
| STORE_MANAGER | MANAGER + 本店 P04 | 本店员工/范围管理；敏感动作仍独立鉴权 | 禁止自提权与超范围 |
| FOUR_S | 默认无 PC；显式车辆授权时仅 P02-04/P02-07 裁剪视图 | cooperation scope 内且已授车辆动作 | P04/P05/P06/P07、名邦内部价、一键转名邦隐藏 |
| SYSTEM_ADMIN | P05 | System Admin 账号治理 | P01～P04/P06～P12 员工业务动作全部不可由系统身份直接执行 |

## V2 unified remediation states

| Page / Object | IA state / projection | Authority basis | Entry / exit / rendering rule |
|---|---|---|---|
| C01-M03 | SOURCE_ONLY / OWNER_ASSIGNED / OWNER_UNCHANGED | D1; Step5 | Employee-originated share uses these outcomes; it never implies customer referral, Recommendation or quota rights |
| C01-M03 / C03-07 | DIRECT_REFERRAL_CAPTURED | Step5 C04; third-round NEW-04 | Freeze direct referrer and referrer's current owner at event time; later owner change does not rewrite source; no multilevel/commission |
| C01-M03 / C01 | SOURCE_ONLY | D1 actor boundary | Customer-side re-share uses the same source-only result, never assigns owner, and returns to C01 |
| C01-01 / E01-01 | VEHICLE_INTENT_WORK_ITEM_PENDING / CONFIRM_LOCK_GUARD / CONFIRMED / CLOSED_NOT_LOCKABLE | third-round NEW-05 | Phone required; creates employee work item, not Lock; confirmation enters the canonical submit-time Lock guard; unavailable vehicle closes without Lock |
| P06-01 / P06-M01 | MERGE_BLOCKED / MERGE_READY / MERGING / MERGED / MERGE_HISTORICAL | D13; Step7; NEW-01 | active/paused Demand yields BLOCKED; after complete/cancel recheck, explicit confirmation reaches MERGED; both entry page and overlay use the same projection and preserve immutable history |
| P06-03 / P06-04 | COLLABORATION_ACTIVE / COLLABORATION_ENDED / REBUILD_REQUIRED / COLLABORATION_HISTORICAL | Step5; NEW-03 | Exact customer/business scope; owner change, business end or inactive participant ends current record; rebuild is new record |
| P04-01 / P04-06 / P04-07 | EMPLOYEE_ACTIVE / INACTIVE_HANDOFF_REQUIRED / HANDOFF_IN_PROGRESS / HANDOFF_COMPLETED / REINSTATED_NO_AUTO_RESTORE | Step4/5; NEW-02/NEW4-01 | employee_id remains stable; inactive/lost eligibility blocks new responsibility and active work is mapped; reinstatement requires fresh authorization, accepting defaults OFF, and never revives old permissions/customers/business/responsibility |
| P04-01 / P04-06 / P02-04 | FOUR_S_DISABLED_TAKEOVER_REQUIRED / FOUR_S_VEHICLES_PAUSED / MINGBANG_TAKEOVER_IN_PROGRESS / TAKEOVER_COMPLETED / SUPPLY_ANOMALY_REVIEW | Step5 V09; D7 | Disable revokes access and pauses affected display/matching; preserve source_type=4S and existing Lock/funds/Transaction; map responsibility to eligible Mingbang target; invalid supply enters anomaly review |
| P04-07 | HANDOFF_MAPPING_REQUIRED / HANDOFF_MAPPING_PARTIAL / HANDOFF_READY_TO_CONFIRM / HANDOFF_COMPLETED | Step4/5; NEW-02 | Every affected active object requires an eligible scoped target; confirmation rechecks all mappings; partial failure preserves completed mappings and keeps unresolved items open |
| E05-05 | PRIORITY_ACTIVE_TTL_FROZEN / PRIORITY_DUPLICATE_SUPPRESSED / PRIORITY_HISTORICAL | NEW4-03 | TTL snapshot at create; unique within customer+vehicle+cycle; handoff never rewrites creator/history |
| P02-06 | VEHICLE_IDENTITY_CONFLICT / SUPPLY_ANOMALY / REVIEWING / CLEARED_HISTORICAL | IA-B4-01 | Anomaly is a risk/review fact and does not uniformly block new business; real offline/unavailable/sold source facts plus each object's Guard decide availability; authorized clear retains history |
| E02-01 / E02-02 / P02-07 | IMAGE_PARTIAL_FAILED / IMAGE_FAILED / IMAGE_RETRYING / IMAGE_MANUAL_RECOVERY / IMAGE_RECOVERED | fifth-round A-NEW-03 | Retry failed images only; successful frozen set and business facts remain; manual recovery is audited |
| P02-08 / P02-07 | JYT_MAPPING_PENDING_NON_BLOCKING | NEW-06; Step5/6 | Upstream mapping remains pending independently; does not block otherwise valid publish/business; manual MODEL_MISSING draft rule unchanged |
| E02-M01 / E02-01 / P03-05 | PHONE_LATEST / PHONE_CACHE_AVAILABLE / PHONE_LATEST_FAILED_CACHE_AVAILABLE / PHONE_UNAVAILABLE | NEW-07 | One consistent projection; failed latest fetch never overwrites cache or labels cache as latest |
| C01-M01 / P08-02 | QUOTA_DAY_UTC8_ACTIVE / QUOTA_DAY_RESET / PRICE_CHECK_FAILED_NO_DEBIT | HR-12; D12; NEW-08 | Server UTC+8 business-day key changes at 00:00; success debits once; fail/timeout no debit; retry idempotent |
| C01 / C01-01 | CUSTOMER_PRICE_EFFECTIVE / PRICE_CONSULTATION_VALUE_FACT | NEW4-05 | No effective price renders non-clickable `价格咨询`; never exposes internal price or invents a CTA |
| P08-01 / P08-04 | PRICE_DRAFT / PRICE_SAVE_FAILED_EFFECTIVE_UNCHANGED / PRICE_EFFECTIVE | NEW4-01/05 | Draft/failure never replaces current effective price; activation audits before/after and cycle |
| P09-04 / P11 | NOTIFICATION_SENT / FAILED / SKIPPED / DEDUPED | NEW4-04; fifth-round | Log outcome only; business state unchanged; automatic queue retry remains Phase 2 engineering and revalidates allowlist, event validity and DND |
| P09-01 / P09-03 / P09-04 | NOTIFICATION_NOT_ALLOWLISTED / DND_RECHECK_PENDING | NEW4-04 | Non-allowlisted events never proactively notify; allowed events re-evaluate DND at send time |
| P09-02 | INCIDENT_CADENCE_CONFIGURED / CADENCE_NOT_CONFIGURED | N4-01 | Render exact cadence only if configured; IA supplies no default interval |
| P07-04 | REQUIRED_FIELDS_VALID / REQUIRED_FIELDS_MISSING_CONFIGURED | N4-02 | Display only configured validator output; IA does not define an unfrozen complete field set |
| C02-01 | APPLICATION_PENDING / WITHDRAW_CONFIRM_REQUIRED / CANCELLED | fifth-round A-NEW-01 | Current customer may withdraw pending application; cancellation creates no Demand and preserves history |
| P06-05 / P06-02 | PUBLIC_POOL_ASSIGN_CONFIRM_REQUIRED / ASSIGNED / ASSIGN_DENIED | fifth-round A-NEW-02 | Permission, scope, owner-null, protections and target eligibility rechecked; audit owner/source history |
| E01 | SELF_ACCEPTING_ON / SELF_ACCEPTING_OFF | fifth-round expansion | Applies prospectively; turning off does not erase history and may trigger handoff for lost eligibility |
| P07-01 | DEFAULT_LOCK_DURATION_CONFIGURED / LOCK_DURATION_SNAPSHOTTED | fifth-round expansion | Employee business config; each new Lock freezes its value; System Admin identity alone cannot configure |
| P10-01 / P10-02 | ANNOUNCEMENT_DRAFT / SCHEDULED / ACTIVE / ENDED / REORDERED | NEW4-01 | CRUD, schedule and reorder audited; customer UTC+8 display frequency remains separate |
| P12-01 / P12-02 | BANNER_REORDERED | fifth-round expansion | Reorder changes presentation only; target/window remain independently validated |

## V5 canonical state authority

旧的 journey/object 句子拆分型 Canonical State Registry 与 Manifest mirror 已撤销。当前 canonical state dictionary 与 projection contract 分别由 `证据工程V5/IA_V5_CANONICAL_STATE_DICTIONARY.csv`、`证据工程V5/IA_V5_STATE_PROJECTION_CONTRACT.csv` 定义。
