# 04 LOW-FI NAVIGATION REGISTER — PHASE 1.5 IA CURRENT

<!-- IA-GLOBAL-B4-NAV -->
> **IA Batch 4 Navigation 正规化｜2026-10-08**
>
> - 删除 P03“保存/测试 Collector 电话连接”和 P06-06 Recommendation qualification 当前入口。
> - P02-06 Supply Anomaly 只提供真实异常查看/复核/清除，不因 anomaly 标签统一隐藏所有新业务动作；动作是否可用读取真实 source/resource 与对应业务 Guard。
> - Recommendation 入口按当前合法业务 responsible + find-car entitlement + permission/capability + scope + object state 重验；4S Vehicle 不因来源类型被禁止名邦合法推荐。
> - E03-02 / P06-03 增加独立服务称呼维护承载；不得并入 Personal Note / Shared Profile。

<!-- IA-GLOBAL-B2-B3-NAV -->
> **IA Batch 2 + 3 Navigation 覆盖｜2026-10-08**
>
> **移除/禁用旧入口**
> - P06-06 独立 Recommendation 资格页；人工 Priority 创建/转让/override；独立 priority.view/manage/override。
> - 独立“调价”页/动作；Collector Base URL / Phone Path/JYT 电话凭证配置；客户端泛化消息中心；Opportunity 通用规则配置；CRM“先锁车再选 Vehicle”；LockRequest 独立进度中心；客户主动取消 Waitlist；Announcement republish-reset；万能杂项配置中心。
>
> **补齐真实入口**
> - E02→更多→草稿车源：多草稿列表/继续编辑/正式发布/删除；MODEL_MISSING 完成后回原 draft。
> - E02/P02 Vehicle：已发布车辆保存修改；合法 source_type 修改；Archive/报告维护；同 vehicle_id source conversion。
> - P05：车型主数据/JYT mapping/MODEL_MISSING/conflict/duplicate 治理。
> - P03-05：publisher 电话缓存/历史/latest/异常/审计诊断，不出现 Collector 电话 URL 配置。
> - P08：LIMITED/UNLIMITED、markup/quota、customer display override、临时增加当天查价次数。
> - E05/P06：销售匹配描述保存、确定性解析、四级 Match Result、confirmation 后重算、Rule Dictionary 全生命周期、Priority qualification/TTL/release。
> - CRM：真实“记录跟进”提交；Source Radar 只读消费 Matching change fact。
> - 公海：合法指定分配后立即形成 owner；批量治理逐客户返回结果。
> - E07/P07/C03：LockRequest conflict→Waitlist、Lock 72h/延期、普通 Lock 与 Priority-origin Lock visibility、Refund closed、Transaction/Deposit correction/handoff。
> - C01/C02/C03：真实搜索/筛选/7种排序、Vehicle Detail、我的推荐/咨询/锁车候补/交易/公告/顾问/推荐朋友。
> - Banner：HOME_TOP / VEHICLE_DETAIL 两个正式 placement。


<!-- IA-GLOBAL-B1-NAV -->
> **IA Batch 1 导航/入口覆盖｜2026-10-08**
>
> - Customer 首入不新增独立登录/资料完善页；身份识别后直接进入客户端，owner 归属由分享/转介绍优先、自然轮询兜底。
> - `owner_assignment_pending` 为异常待分配状态，不构造“无负责人正式业务”页面。
> - 客户分享/转介绍入口必须能保留来源客户与销售归属解析；已有 owner 不提供“被分享链接改绑销售”动作。
> - Customer Merge 相关页面/弹层/确认入口全部从 Current IA 移除，不得恢复。
> - P04/Handover 必须承载批次→受影响 Customer/活跃业务→原负责人→目标负责人→校验结果→失败项重试的真实映射，不再使用仅有成功/失败提示的通用壳。
> - P05 System Admin 必须存在后续 System Admin 的新增/启用/停用/基础治理入口，并保护“最后 1 个 active Admin 不可停用”。
> - 4S 继续员工端裁剪视图；明确授予 PC 车辆管理能力后，只进入其有权 4S 车辆的 P02 裁剪投影。
> - P02 Vehicle 必须提供合法人工车 `source_type: mingbang <-> 4S` 修改入口；4S 成员本人上传车不得自行改为名邦。
> - “一键转名邦”入口作用于当前同一 vehicle，不跳转/创建第二 Vehicle；成功后仍停留/进入同一 vehicle 的名邦来源详情。


This register is the self-contained current IA authority for action routing. It does not normatively depend on any historical `06_PAGE_ACTION_MATRIX.md`; pure read-only pages receive no invented business action.

| source_page | control | target_page | condition |
|---|---|---|---|
| C01 | 打开车辆 | C01-01 | vehicle visible in feed |
| C01 / C03-02 | 头像昵称不完整时继续身份相关动作 | C-O01 | current customer profile lacks required avatar/nickname; dismissing does not fabricate completion |
| C-O01 | 完成或取消完善提示 | C01 / C03-02 | completed profile returns to originating page; cancel preserves prior profile and performs no protected action |
| C02 / C03-03 | 需要手机号的提交动作 | C-O02 | phone authorization is required and not yet granted; do not create application/Consultation before success |
| C-O02 | 授权成功/取消 | C02 / C03-03 | success returns to originating submission for revalidation; cancel creates no business object |
| C01 / C01-01 | 命中有效客户公告 | C-O03 | enabled announcement within effective window; same announcement/customer shown proactively at most once per UTC+8 day |
| C-O03 | 关闭公告 | C01 / C01-01 | return to originating page; closing does not create a read fact |
| C01-01 / E02-01 / E02-02 | 查看车辆图片 | C-O04 | actor must already have current vehicle-view permission in the same visibility context; image access inherits vehicle visibility, including hidden/Priority controlled visibility; selected image belongs to the visible frozen image set |
| C-O04 | 关闭图片预览 | C01-01 / E02-01 / E02-02 | return to exact originating page; no vehicle/image mutation |
| C01 | 客户转发车源 | C01-M03 | vehicle safe projection exists; record customer-side re-share as SOURCE_ONLY only; it never assigns owner or grants Recommendation/price-check rights |
| E02-01 | 员工分享车源给客户 | C01-M03 | active eligible Mingbang employee with vehicle in scope creates a D1 share link; when customer identity is established, apply SOURCE_ONLY/OWNER_ASSIGNED/OWNER_UNCHANGED under D1; sharing grants no Recommendation/price-check right |
| C01-M03 | 完成员工分享结果确认 | E02-01 | originating action was employee share and result is SOURCE_ONLY, OWNER_ASSIGNED or OWNER_UNCHANGED; error remains retryable |
| C01-M03 | 完成客户转发结果确认 | C01 | originating action was customer re-share and result is SOURCE_ONLY; no owner mutation |
| C01-M03 | 完成直接转介绍结果确认 | C03-07 | result is DIRECT_REFERRAL_CAPTURED; return to referral origin; later owner changes do not rewrite source |
| C01 | 筛选 | C01-BS01 | none |
| C01-BS01 | 应用筛选 | C01 | valid filter; zero-result state must allow modifying/clearing filter without silent relaxation |
| C01-BS01 | 取消 | C01 | no mutation |
| C01 | 排序 | C01-BS02 | none |
| C01-BS02 | 应用排序 | C01 | supported sort selected |
| C01-BS02 | 取消 | C01 | no mutation |
| C01-01 | 收藏/取消收藏 | C01-01 / C03-01 | vehicle exists |
| C01-01 | 查看价格 | C01-M01 / C01-01 | current listing cycle; existing successful unlock does not debit again; failed/timeout response does not debit; retry idempotent |
| C01-M01 | 成功确认 | C01-01 | price unlock succeeded; debit once for customer+vehicle+listing_cycle; persist price snapshot |
| C01-M01 | 失败/超时重试 | C01-M01 | no quota debit; same idempotency key; cached/customer-safe state remains |
| C01-M01 | 取消 | C01-01 | no quota debit or price unlock mutation |
| C01-01 | 我要这辆车 | E01-01 / C01-01 | phone authorized; create/reuse one employee work item, never a Lock; employee confirmation later applies normal lockability guard; unavailable vehicle creates no Lock |
| C01-01 | 登记候补 | C01-M02 | REF_GUARD[WAITLIST]；local_ui_fact=other customer has active lock; no own lock/waitlist |
| C01-M02 | 确认登记候补 | C03-04 | REF_GUARD[WAITLIST]；local_ui_fact=revalidate other active Lock and no own active Lock/Waitlist; create/reuse active Waitlist idempotently |
| C01-M02 | 取消 | C01-01 | no Waitlist mutation |
| C02 | 提交找车需求 | C02/C02-01 | valid form + eligible receiver |
| C02-01 | 修改申请 | C02-01 | application pending |
| C02 | 新增找车需求 | C02 | none |
| C03-03 | 提交咨询 | C03-03 | phone authorized; eligible vehicle/business context; create or idempotently reuse one open Consultation and project it as pending in E06-01/E06-02 |
| C03-03 | 撤回咨询 | C03-03 | current customer owns the same pending/processing Consultation; submit revalidates identity and open state; close normally as CANCELLED, never INVALID |
| E01-04 | 推荐给客户 | E03-05 | REF_GUARD[RECOMMENDATION]；local_ui_fact=actor is current legal business responsible; customer+demand+vehicle+listing_cycle known; vehicle recommendable; open shared Recommendation confirmation flow |
| E01-04 | 标记不合适 | E01-04 | match exists |
| E02-01 | 推荐给客户 | E02-03 / E02-01 | REF_GUARD[RECOMMENDATION]；local_ui_fact=actor is current customer owner; customer+vehicle+listing_cycle known; vehicle recommendable; idempotent in cycle |
| E02-01 | 锁车 | E02-04 / E07-01 | REF_GUARD[LOCK_CREATE_CANCEL]；local_ui_fact=actor is active eligible Mingbang employee, not 4S; explicit Lock capability; customer and vehicle in data scope; current listing_cycle/source/occupancy lockable; final submit rechecks identity, capability, scope and object state; internal wholesale price may be absent |
| E02-01 | 进入内部模式 | E02-M01 | long press ~3s + active Mingbang employee authentication; not 4S; vehicle in data scope; entering grants no business permission |
| E02-M01 | 退出内部模式 | E02-01 | clear temporary internal projection; no business fact or permission changes |
| E02-01 | 一键转名邦 | E02-01 / P02-07 | ordinary Mingbang salesperson or other eligible employee; wholesale source + business normal; create the new Mingbang vehicle and preserve source relation, make the original wholesale listing unavailable without later automatic revival; the two vehicle identities/history remain distinct; image partial_failed/failed never rolls back the created Mingbang vehicle; no independent convert permission invented |
| E03-01 | 记录跟进 | E03-03 | customer visible in scope |
| E03-02 / P06-03 | 新增/更新本人 Personal Note | E03-02 / P06-03 | actor is the note author and customer is visible in scope; personal note remains author-private and is not transferred with owner |
| E03-02 / P06-03 | 更新 Shared Profile | E03-02 / P06-03 | actor is current owner, explicit collaborator within collaboration scope, or authorized manager/store manager covering customer scope; audit before/after; never expose personal notes |
| E03-02 / P06-03 | 新增/更新员工内部客户称呼 / 服务称呼 | E03-02 / P06-03 | actor has current CRM access in scope; service-name fact is separate from Personal Note and Shared Profile; preserve author/time/source/change history; former service history alone grants no current CRM access |
| E03-01 | 找车服务 | E05 | customer visible |
| E03-01 | 推荐车辆 | E03-05 | REF_GUARD[RECOMMENDATION]；local_ui_fact=actor is current customer owner; customer+vehicle+listing_cycle known; vehicle recommendable; idempotent in cycle |
| E03-01 | 锁车 | E03-06/E07-01 | REF_GUARD[LOCK_CREATE_CANCEL]；local_ui_fact=same canonical Lock guard as E02-01/P07-01: active eligible Mingbang employee, not 4S; explicit Lock capability; customer and vehicle scope; current listing_cycle/source/occupancy; submit recheck |
| E03-01 | 查看业务历史 | E03-04 | customer is visible in actor data scope; read-only history projection |
| E02-03 | 确认正式推荐 | E03-04 | REF_GUARD[RECOMMENDATION]；local_ui_fact=revalidate current legal business responsible, customer, vehicle, demand when present and listing_cycle; create/reuse one Recommendation idempotently |
| E02-03 | 取消推荐 | E02-01 | REF_GUARD[RECOMMENDATION]；local_ui_fact=no Recommendation mutation |
| E03-05 | 确认正式推荐 | E03-04 | REF_GUARD[RECOMMENDATION]；local_ui_fact=revalidate current legal business responsible, customer, vehicle, demand when present and listing_cycle; create/reuse one Recommendation idempotently |
| E03-05 | 取消推荐 | E03-01 | REF_GUARD[RECOMMENDATION]；local_ui_fact=no Recommendation mutation |
| E03-04 | 结束 Recommendation | E03-04 / C03-02 | REF_GUARD[RECOMMENDATION]；local_ui_fact=active Recommendation; actor is the current legal business responsible; submit revalidates owner, object and listing_cycle; end current object and preserve history; do not alter Priority or price-check facts already granted for the cycle |
| E03-04 | 作废 Recommendation | E03-04 / C03-02 | REF_GUARD[RECOMMENDATION]；local_ui_fact=active Recommendation was created incorrectly; actor is the current legal business responsible; submit revalidates owner and object; mark VOID with reason and preserve history; correction requires a new Recommendation |
| E03-04 | 查看 cycle 结束后的推荐历史 | E03-04 / C03-02 | REF_GUARD[RECOMMENDATION]；local_ui_fact=listing_cycle ended; Recommendation is no longer active and never revives if qualification or a later cycle appears |
| E02-04 | 确认创建 Lock | E07-01 | REF_GUARD[LOCK_CREATE_CANCEL]；local_ui_fact=canonical final-submit Lock guard: actor is active eligible Mingbang employee, not 4S, with explicit Lock capability; customer and vehicle in data scope; current listing_cycle/source/occupancy lockable; recheck identity, capability, scope and object state; create/reuse one active Lock idempotently and project LOCKED to C03-04 |
| E02-04 | 取消 | E02-01 | no Lock mutation |
| E03-06 | 确认创建 Lock | E07-01 | REF_GUARD[LOCK_CREATE_CANCEL]；local_ui_fact=exact canonical final-submit guard from E02-04/P07-01: active eligible Mingbang employee, not 4S, explicit Lock capability, customer/vehicle scope, current listing_cycle/source/occupancy and submit-time identity/capability/scope/state recheck; create/reuse one active Lock idempotently and project LOCKED to C03-04 |
| E03-06 | 取消 | E03-01 | no Lock mutation |
| E05-04 | 暂停 | E05-04 | demand.status=active |
| E05-04 | 完成 | E05-04 | demand.status=active |
| E05-04 | 取消 | E05-04 | demand.status=active |
| E05-04 | 恢复 | E05-04 | demand.status=paused |
| E05-04 | 完成 | E05-04 | demand.status=paused |
| E05-04 | 取消 | E05-04 | demand.status=paused |
| E05-02 | 开通正式找车服务 | E05-04 | application pending + entitlement/authorization |
| E05-02 | 关闭申请 | E05-02 | application pending |
| E05-04 | 启动/刷新匹配 | E05-05 | demand.status=active; deterministic AND-between-fields / OR-within-field matching; hard conditions not relaxed |
| E05-05 | 查看 high / acceptable 结果 | E05-05 | matching result tier is high or acceptable; candidate context recorded |
| E05-05 | 查看 confirmation_needed | E05-06 | result tier is confirmation_needed; no Priority is created before explicit confirmation |
| E05-06 | 确认候选条件 | E05-05 | actor is current responsible employee or authorized manager/store manager in scope; result becomes eligible for normal Priority arbitration |
| E05-06 | 拒绝/返回修正 | E05-04 | no Priority created; Demand remains active unless separately paused/completed/cancelled |
| E05-05 | 查看隐藏车受控详情 | E02-01 | REF_GUARD[HIDE_RESTORE]；local_ui_fact=active authorized Demand/Priority context; visible only to corresponding customer and authorized employee; never restores public Feed |
| E05-05 | 正式推荐 | E03-05 | REF_GUARD[RECOMMENDATION]；local_ui_fact=actor is current legal business responsible; confirmed candidate; customer+vehicle+listing_cycle known; Recommendation idempotent in cycle and distinct from Priority/price-check right |
| E06-02 | 开始处理/标记处理中 | E06-02 | consultation pending |
| E06-02 | 记录真实跟进 | E06-02/E03-03 | consultation open |
| E06-02 | 解决 | E06-02 | consultation open |
| E06-02 | 无效 | E06-02 | consultation open; project INVALID to customer C03-03 without changing owner |
| E06-02 | 正常关闭 | E06-02 / C03-03 | consultation open; actor is current responsible employee or authorized manager/store manager in data scope; close as CANCELLED, never INVALID |
| E06-02 | 转派 | E06-M01 | current consultation owner for own consultation, or authorized manager/store manager in data scope; target active and eligible |
| E06-M01 | 确认转派 | E06-02 / P06-11 | revalidate actor/scope/target; record previous/new owner, actor and time; return to originating Consultation context; customer owner unchanged |
| E06-M01 | 取消 | E06-02 / P06-11 | return to originating Consultation context; no Consultation mutation |
| P06-11 | 开始处理/标记处理中 | P06-11 | consultation pending; actor is responsible employee or authorized manager/store manager in data scope |
| P06-11 | 记录真实跟进 | P06-11 / E03-03 | consultation open; actor is current responsible employee or authorized manager/store manager in data scope; append follow-up without changing customer owner |
| P06-11 | 解决 | P06-11 | consultation open; revalidate responsibility/scope and project COMPLETED to C03-03 |
| P06-11 | 无效 | P06-11 | consultation open; revalidate responsibility/scope and project INVALID to C03-03 without changing customer owner |
| P06-11 | 正常关闭 | P06-11 / C03-03 | consultation open; current responsible employee or authorized manager/store manager in scope; close as CANCELLED, never INVALID |
| P06-11 | 转派 | E06-M01 | same D5 actor/scope/eligible-target guard as E06-02; confirmation returns to the same Consultation context |
| E07-01 | 开始交易 | E07-03 | REF_GUARD[TRANSACTION_CANCEL_CORRECT]；local_ui_fact=actor is current business/Transaction owner with covering data scope; active lock; create an incomplete Transaction |
| E07-01 | 释放/取消锁车 | E07-M01 | REF_GUARD[LOCK_CREATE_CANCEL]；local_ui_fact=active lock; actor is current responsible employee or authorized manager/store manager with covering data scope; manual reason required |
| E07-M01 | 确认释放/取消 | E07-01 / P07-01 | revalidate active Lock; end Lock and preserve history; return to originating Lock context; notify active Waitlist responsibility; never auto-create Lock |
| E07-M01 | 取消 | E07-01 / P07-01 | return to originating Lock context; no Lock mutation |
| E07-01 | 记录意向金 | E07-04 | actor is current business/Transaction owner with covering data scope; lock/transaction valid |
| E07-02 | 结束候补 | E07-02 | REF_GUARD[WAITLIST]；local_ui_fact=active waitlist; actor is current responsible employee or authorized manager/store manager with covering data scope; reason required |
| E07-03 | 成交 | E07-03 | transaction in_progress; only manager/store manager with transaction-complete permission and covering data scope |
| E07-03 | 取消交易 | E07-03 | REF_GUARD[TRANSACTION_CANCEL_CORRECT]；local_ui_fact=actor is current Transaction owner with covering data scope; transaction in_progress |
| E07-05 | 记录实际退款 | E07-05 | REF_GUARD[REFUND_CLOSE]；local_ui_fact=refund pending and refundable amount remains; only manager/store manager with refund/funds permission and covering data scope; preserve source and history; vehicle occupancy unchanged |
| P07-01 | 释放/取消锁车 | E07-M01 | REF_GUARD[LOCK_CREATE_CANCEL]；local_ui_fact=active Lock; current responsible employee or authorized manager/store manager with covering data scope; reason required; reuse one Lock release confirmation |
| P07-01 | 确认创建 Lock | P07-01 / E07-01 / C03-04 | REF_GUARD[LOCK_CREATE_CANCEL]；local_ui_fact=exact canonical final-submit Lock guard as E02-04/E03-06: page state=LOCK_CREATE_CONFIRM_REQUIRED; actor is active eligible Mingbang employee, not 4S, and is current responsible employee or authorized manager/store manager with explicit Lock capability; submit revalidates identity, permission, customer/vehicle scope, current listing_cycle and source/occupancy lockability; create/reuse one active Lock idempotently |
| P07-01 | 取消创建 Lock | P07-02 | REF_GUARD[LOCK_CREATE_CANCEL]；local_ui_fact=page state=LOCK_CREATE_CONFIRM_REQUIRED; no Lock mutation |
| P07-01 | 记录意向金 | P07-03 | actor is current business/Transaction owner with covering data scope; active Lock/Transaction valid |
| P07-01 | 开始交易 | P07-04 | REF_GUARD[TRANSACTION_CANCEL_CORRECT]；local_ui_fact=actor is current business/Transaction owner with covering data scope; active Lock; create an incomplete Transaction |
| P07-02 | 结束候补 | P07-02 | REF_GUARD[WAITLIST]；local_ui_fact=active Waitlist; responsible employee or authorized manager/store manager in scope; reason required; preserve history |
| P07-02 | 人工重验并发起 Lock | P07-01 | REF_GUARD[LOCK_CREATE_CANCEL]；local_ui_fact=prior Lock ended; same canonical Lock guard as E02-04/E03-06 including active eligible Mingbang identity, explicit non-4S exclusion, current responsibility/authorized manager-store-manager authority, Lock capability and customer/vehicle scope; enter LOCK_CREATE_CONFIRM_REQUIRED; final submit revalidates identity/permission/scope/current cycle/source/occupancy; no automatic promotion |
| P07-02 | 车辆不可锁 | P07-02 | current source/cycle/occupancy guard fails; show NOT_LOCKABLE; do not create Lock |
| P07-03 | 记录实际意向金 | P07-03 | actor is current business/Transaction owner with covering data scope; valid Lock/Transaction; append actual receipt fact idempotently |
| P07-04 | 创建交易 | P07-04 | REF_GUARD[TRANSACTION_CANCEL_CORRECT]；local_ui_fact=actor is current business/Transaction owner with covering data scope; active Lock; create/reuse incomplete Transaction idempotently |
| P07-04 | 首次完成交易 | P07-04 | REF_GUARD[TRANSACTION_CANCEL_CORRECT]；local_ui_fact=transaction in_progress; only manager/store manager with transaction-complete permission and covering data scope |
| P07-04 | 取消交易 | P07-04 | REF_GUARD[TRANSACTION_CANCEL_CORRECT]；local_ui_fact=actor is current Transaction owner with covering data scope; transaction in_progress; old Lock/Waitlist never revive |
| P07-05 | 创建退款单 | P07-05 | REF_GUARD[REFUND_CLOSE]；local_ui_fact=same refundable subject/balance/conflict guard and owner responsibility as E07-05 |
| P07-05 | 记录实际退款 | P07-05 | REF_GUARD[REFUND_CLOSE]；local_ui_fact=same manager/store manager refund/funds permission, scope and pending refundable-balance guard as E07-05; vehicle occupancy unchanged |
| E08 | 认领客户 | E03-01 | REF_GUARD[PUBLIC_POOL]；local_ui_fact=actor has public-pool claim permission and customer is in data scope; owner=NULL; no unfinished protection conflict; actor active and eligible |
| P04-06 | 完成交接 | P04-07 | REF_GUARD[EMPLOYEE_HANDOFF]；local_ui_fact=all affected active objects have explicit mappings to eligible targets; enter batch confirmation; submit rechecks every target and object state |
| P05-02 | 停用/恢复 System Admin | P05-02 | actor active; last-active guard |
| P06-05 | 放入公海 | P06-05 | REF_GUARD[PUBLIC_POOL]；local_ui_fact=actor has public-pool transfer permission and customer is in data scope; zero protection conditions; reason and history required |
| P07-06 | 成交撤销/纠错 | P07-M01 | completed transaction; actor is manager/store manager with transaction-correction permission and covering data scope; reason and audit required; correction is a single append-only correction flow and does not require a second approval layer |
| P07-M01 | 确认成交撤销/纠错 | P07-06 / P02-07 | revalidate completed Transaction and correction authority; append correction fact in the same authorized flow with no second-level approval; never erase original completion or revive old Lock/Waitlist |
| P07-M01 | 取消 | P07-06 | no Transaction mutation |
| P08-01 | 启用阶梯规则 | P08-01 | no overlaps + complete declared range |
| P10-02 | 启用/停用公告 | P10-01 | valid effective window |
| P12-02 | 保存/启用 Banner | P12-01/C01 | target optional; if present it must resolve to an internal allowlisted mini-program page/business object; valid time range |
| E02 | 发布车辆 | E02-02 | REF_GUARD[PUBLISH_UNPUBLISH]；local_ui_fact=authenticated and eligible source |
| E02-02 | 自动保存 | E02-02 | form changed; debounce/leave flush |
| E02-02 | 发布 | E02-01 | REF_GUARD[PUBLISH_UNPUBLISH]；local_ui_fact=source, brand, series, valid model, year, mileage, city; image count may be 0 |
| E02-02 | MODEL_MISSING 交由车型映射 | P02-08 | REF_GUARD[MAPPING_CORRECTION]；local_ui_fact=save originating manual-upload draft; actor has vehicle.model.manage; no model creation is inferred |
| E02-M01 | 查看名邦内部价 | E02-M01 | active Mingbang employee, not 4S; vehicle in data scope; existing employee internal-price visibility applies; internal mode itself grants nothing |
| E02-M01 | 编辑 | E02-05 / E02-02 | active eligible employee; corresponding vehicle edit permission; vehicle in data scope; source_type and object state determine editable fields; no uploader-only rule |
| E02-M01 | 拨打 | E02-M01 | active employee with independent phone capability; vehicle in data scope; cached phone present or cache-miss fetch succeeds |
| E02-M01 | 最新电话 | E02-M01 / E02-01 / P03-05 | REF_GUARD[PHONE_REFRESH]；local_ui_fact=active employee with independent phone capability; vehicle in data scope; publisher_id available; success labels latest; failure keeps cached phone labeled cached and offers idempotent retry |
| E07-05 | 创建退款单 | E07-05 | REF_GUARD[REFUND_CLOSE]；local_ui_fact=actor is current business/Transaction owner with covering data scope; exactly one subject: refundable Lock with valid deposit and no owning Transaction, or completed/cancelled Transaction; refundable balance > 0; no conflicting open case |
| E07-04 | 追加冲正/更正 | E07-M02 | manager/store manager with funds-correction permission and covering data scope; append-only reason required |
| E07-M02 | 确认追加冲正/更正 | E07-04 | revalidate authority/scope; append correction fact; preserve original deposit and audit actor/time/reason |
| E07-M02 | 取消 | E07-04 | no Deposit mutation |
| P07-03 | 追加冲正/更正 | P07-M02 | same business guard as E07-04: manager/store manager with funds-correction permission and covering data scope; append-only reason required |
| P07-M02 | 确认追加冲正/更正 | P07-03 | revalidate authority/scope; append correction fact and audit; preserve original deposit |
| P07-M02 | 取消 | P07-03 | no Deposit mutation |
| E07-05 | 撤回/关闭 pending Refund | E07-M03 | REF_GUARD[REFUND_CLOSE]；local_ui_fact=manager/store manager with refund-management permission and covering data scope; reason required; never record as refunded |
| E07-M03 | 确认撤回/关闭 | E07-05 | revalidate pending Refund and authority; append closed-not-refunded history; vehicle occupancy unchanged |
| E07-M03 | 取消 | E07-05 | Refund remains pending |
| P07-05 | 撤回/关闭 pending Refund | P07-M03 | REF_GUARD[REFUND_CLOSE]；local_ui_fact=same business guard as E07-05; manager/store manager with refund-management permission and covering data scope; reason required |
| P07-M03 | 确认撤回/关闭 | P07-05 | revalidate pending Refund and authority; append closed-not-refunded history; vehicle occupancy unchanged |
| P07-M03 | 取消 | P07-05 | Refund remains pending |
| P08-04 | 查看新 cycle 覆盖价结果 | P08-04 / P02-07 | REF_GUARD[PRICE_OVERRIDE]；local_ui_fact=a new listing cycle never inherits an old manual-vehicle display-price override |
| P08 | 设置客户展示价覆盖 | P08 | actor has display-price override permission and covering vehicle data scope; record before/after value, actor and time |
| P08 | 取消客户展示价覆盖 | P08 | actor has display-price override permission and covering vehicle data scope; return to current latest customer display price; record before/after value, actor and time |
| P06-02 | 转派归属 | P06-02 / P04-06 | actor has owner-transfer permission and customer is in actor data scope; target owner is active and eligible; all unfinished Consultation/Demand/Lock/Transaction must be completed, cancelled or mapped through handoff before owner change commits |
| P04-01 | 新增 4S 成员 | P04-01 | actor is store manager with 4S-member-management permission and covering cooperation scope, or manager explicitly granted both; System Admin identity alone is ineligible; preserve lifecycle audit |
| P04-01 | 停用 4S 成员并启动接管 | P04-06 / P02-04 | REF_GUARD[4S_TAKEOVER]；local_ui_fact=same D7 authority/scope guard; immediately revoke access, pause affected 4S vehicle display/matching, preserve source_type=4S and existing Lock/funds/Transaction, then map responsibility to eligible Mingbang targets; invalid supply enters anomaly review |
| P04-03 | 授予/撤销 4S 成员管理权限 | P04-03 | active business employee authorizer with sufficient grant boundary; no self-elevation; scope cannot exceed authorizer cooperation scope |
| P04-04 | 设置 4S cooperation scope | P04-04 / P02-04 | actor has 4S-member-management permission and covers target cooperation scope; changes affect current visibility/actions and are audited |
| E04 | 查看合作身份与本人 4S 管理范围 | E04 | active 4S member; show cooperation identity instead of fictitious main-store field; no Mingbang CRM/internal-price entry |
| P02-04 | 管理合作范围内 4S 车源 | P02-04 / P02-07 | active employee with corresponding vehicle action permission and covering cooperation scope; source remains 4S; sensitive actions separately authorized |
| P12-01 | 启用/停用 | P12-M01/P12-01 | banner exists |
| P12-M01 | 确认启用/停用 | P12-01 | revalidate banner, schedule, placement and optional allowlisted target; audit transition |
| P12-M01 | 取消 | P12-01 | no Banner mutation |
| C01-01 | 长按复制车辆名称/车况 | C01-01 | visible field; client clipboard available |
| E02-01 | 长按复制车辆名称/车况 | E02-01 | visible field; client clipboard available |
| E03-01 | 客户手机号拨打 | E03-01 | authorized full phone visible; system dialer available |
| E03-01 | 客户手机号/昵称/销售称呼复制 | E03-01 | authorized field visible |
| E03-02 | 客户画像摘要复制 | E03-02 | authorized summary visible |
| E05-02 | 客户原始找车要求复制 | E05-02 | application text visible |
| E05-04 | 销售匹配描述/需求说明复制 | E05-04 | demand text visible |
| P02-07 | VIN 复制 | P02-07 | actor has normal vehicle view/manage permission and covering vehicle data scope; no separate VIN-specific business permission is introduced; authorized VIN is visible |
| E02-01 | 拨打上游电话 | E02-01 | active employee with independent phone capability; vehicle in data scope; authorized current phone visible; 4S/default customer-safe views excluded |
| P12-02 | 保存 placement | P12-01 | placement belongs to fixed enum |
| C01 | 点击 Banner | C01 | no/invalid/expired target stays C01; a valid Banner instance stores one exact existing allowlisted Page ID and navigation uses that stored Page ID |
| C01-01 | 点击 Banner | C01-01 | no/invalid/expired target stays C01-01; a valid Banner instance stores one exact existing allowlisted Page ID and navigation uses that stored Page ID |
| P02-08 | 绑定已有车型 | P02-08 / P02-07 | vehicle.model.manage permission; select canonical model; preserve upstream facts; audit before/after mapping |
| P02-08 | 确认保留/纠正映射并关闭任务 | P02-08 / P02-07 | REF_GUARD[MAPPING_CORRECTION]；local_ui_fact=vehicle.model.manage permission; conflict task open; retain or correct explicitly; audit actor/time/old/new mapping |
| P02-08 | MODEL_MISSING 处理 | P02-08 | REF_GUARD[MAPPING_CORRECTION]；local_ui_fact=vehicle.model.manage permission; bind/select an existing valid local model or retain/correct an existing mapping; no model-creation authority is inferred; manual-upload draft stays unpublished until valid model exists |
| P02-08 | 完成 MODEL_MISSING 映射并恢复草稿 | E02-02 | REF_GUARD[MAPPING_CORRECTION]；local_ui_fact=originating manual-upload draft exists; valid existing local model is now bound; return to the originating draft and revalidate all publish fields before publish |
| E07-02 | 收到 Lock 释放后的候补待办 | E07-02 | REF_GUARD[WAITLIST]；local_ui_fact=prior Lock ended; active Waitlist remains historical/awaiting manual reconfirmation; responsible employee is notified; no automatic promotion |
| E07-02 | 人工重新确认并发起 Lock | E02-04 / E07-01 | REF_GUARD[LOCK_CREATE_CANCEL]；local_ui_fact=same canonical Lock guard as E02-04/E03-06/P07-01: active eligible Mingbang identity, not 4S, current responsibility/authorized manager-store-manager authority, explicit Lock capability, customer/vehicle scope and current listing_cycle/source/occupancy submit recheck |
| E07-02 | 车辆不可锁 | E07-02 | vehicle not lockable due to real source state/current cycle/other active occupancy; show NOT_LOCKABLE and keep history; do not create Lock |
| E07-03 | 取消交易后的车辆投影 | E07-03 / E02-01 | REF_GUARD[TRANSACTION_CANCEL_CORRECT]；local_ui_fact=Transaction becomes cancelled and historical; old Lock/Waitlist stay ended; vehicle re-entry eligibility is recalculated only from real source state, current listing_cycle and other active occupancy |
| E07-05 | Refund 状态后的车辆投影 | E07-05 / E02-01 | REF_GUARD[REFUND_CLOSE]；local_ui_fact=pending/completed/closed Refund never occupies vehicle and never by itself changes lockability; subsequent Lock/Transaction uses normal guards and refundable history remains |
| E02-01 | 真实下架 | E02-01 / P02-07 | REF_GUARD[DELIST_RELIST]；local_ui_fact=authorized vehicle action; end current listing_cycle and public availability; hidden-only action is not delist |
| E02-01 | 重新上架 | E02-01 / P02-07 | REF_GUARD[DELIST_RELIST]；local_ui_fact=same vehicle was truly delisted and is now genuinely available; create a new listing_cycle; old override not inherited; frozen images not re-fetched by ordinary relist; a wholesale source record that already exited sale because of one-click conversion never auto-revives |
| E02-01 | 隐藏 | E02-01 / P02-07 | REF_GUARD[HIDE_RESTORE]；local_ui_fact=authorized vehicle action and vehicle in scope; remove ordinary public-feed visibility without ending listing_cycle; preserve history |
| E02-01 | 恢复隐藏车辆 | E02-01 / P02-07 | REF_GUARD[HIDE_RESTORE]；local_ui_fact=authorized vehicle action and vehicle remains valid in current listing_cycle; restore only permitted visibility; no new cycle |
| P02-07 | 真实下架 | P02-07 | REF_GUARD[DELIST_RELIST]；local_ui_fact=authorized vehicle action and covering data scope; end current listing_cycle; never treat hide as delist |
| P02-07 | 重新上架 | P02-07 | REF_GUARD[DELIST_RELIST]；local_ui_fact=truly delisted vehicle becomes genuinely available; create new listing_cycle; do not inherit old override; a wholesale source record already retired by one-click conversion is excluded from automatic revival |
| P02-07 | 隐藏/恢复 | P02-07 | REF_GUARD[HIDE_RESTORE]；local_ui_fact=authorized vehicle action and covering scope; preserve current listing_cycle; audit visibility transition |
| E02-05 / P02-07 | 修改 source_type | E02-01 / P02-07 | REF_GUARD[SOURCE_TYPE]；local_ui_fact=corresponding vehicle edit permission and scope; preserve vehicle_id/cycle/history; immediately recompute responsibility, editable fields and visibility from new source_type |
| C03-03 | 查看 Consultation 终态 | C03-03 | same Consultation projects PROCESSING/COMPLETED/INVALID/CANCELLED/HISTORICAL from employee-side facts; timeout remains reminder only |
| C02-01 | 查看申请关闭结果 | C02-01 | employee closed/withdrawn pending application projects CANCELLED; no formal Demand is created |

## Phase 1.5 authority note

- This register is the current IA navigation authority for the Phase 1.5-adjusted set.
- It changes no first-level navigation, creates no independent App and creates no new core business module.
- Controls removed by `DP-01（原历史候选 HO-12）` must not remain as configurable thresholds.
- `ENGINEERING_ONLY` items from IA-25 create no navigation row.

## V2 unified remediation action routes

本节补齐五轮冻结问题；相同 source/control 的旧简写若冲突，以本节为准。

| source_page | control | target_page | condition |
|---|---|---|---|
| C03-07 | 发起直接转介绍 | C01-M03 | current customer identifies direct referrer; record one-level referral; assign new customer to referrer's current owner at event time when eligible; later owner change never rewrites source; no commission |
| E01-01 | 确认客户车辆意向并发起 Lock | E02-04 / E07-01 | REF_GUARD[LOCK_CREATE_CANCEL]；local_ui_fact=pending vehicle-intent work item; actor is current responsible employee or authorized manager/store manager in scope; apply the canonical Lock guard: active eligible Mingbang identity, explicit Lock capability, customer/vehicle scope, current listing_cycle/source/occupancy and submit recheck |
| E01-01 | 关闭车辆意向—当前不可锁 | E01-01 / C01-01 | pending work item; canonical Lock guard fails because vehicle/source/cycle/occupancy is not lockable; close as CLOSED_NOT_LOCKABLE with reason/history; never create Lock |
| C02-01 | 撤回待处理申请 | C02-01 | application=pending and belongs to current customer; revalidate then close as CANCELLED; never create Demand |
| P06-03 / P06-04 | 建立 Collaboration | P06-03 / P06-04 | actor is current owner or authorized manager in customer/business scope; participants active/eligible; persist exact scope |
| P06-03 / P06-04 | 结束 Collaboration | P06-03 / P06-04 | actor authorized or owner/business/participant eligibility ended; close current collaboration and preserve history; rebuild requires a new record |
| P06-05 | 指定分配公海客户 | P06-02 | REF_GUARD[PUBLIC_POOL]；local_ui_fact=actor has public-pool assignment permission and customer scope; owner=NULL; protections clear; target active/eligible; revalidate and audit source/old/new owner |
| E01 | 开启/关闭本人接客 | E01 | active eligible employee; cannot close the last active eligible accepting employee; affects future natural registration/auto-round-robin only; existing customers/responsibilities do not move; D1-valid own share can still establish owner while employee remains active/eligible |
| P04-01 | 新增/停用/恢复普通员工 | P04-01 | authorized store/business manager in scope; employee_id remains the stable identity across reinstatement; inactive triggers handoff and blocks new responsibility; restore requires fresh authorization, accepting defaults OFF, and does not revive old permissions/customers/business |
| P04-02 / P04-03 / P04-04 | 设置角色/权限覆盖/数据范围/接客状态 | P04-02 / P04-03 / P04-04 | authorizer may not grant beyond own boundary or self-elevate; change audited; loss of eligibility triggers handoff |
| P04-06 | 启动资格丧失交接 | P04-07 | REF_GUARD[EMPLOYEE_HANDOFF]；local_ui_fact=employee inactive, source_type responsibility changed, or 4S cooperation/eligibility disabled; map all active responsibility before completion |
| P04-07 | 为交接对象逐项选择新负责人 | P04-07 | REF_GUARD[EMPLOYEE_HANDOFF]；local_ui_fact=batch open; each Customer/Demand/Consultation/Lock/Transaction/vehicle responsibility maps to an active eligible target with covering scope; preserve original responsibility history |
| P04-07 | 确认交接批次 | P04-07 / P04-06 | REF_GUARD[EMPLOYEE_HANDOFF]；local_ui_fact=every affected object mapped; submit rechecks target eligibility, scope and object state; partial failure keeps unresolved objects in batch and does not roll back completed mappings |
| P06-02 | owner 变化后的 Collaboration 处理 | P06-03 / P06-04 | terminate affected collaboration; do not rewrite its historical owner/participants; create a new collaboration only after current eligibility validation |
| P02-06 | 查看系统/上游已标记的 identity conflict / supply anomaly | P02-06 | anomaly is produced by verified source/system evidence; page is read/triage entry, not an invented manual anomaly-creation authority; anomaly itself does not block all new business; current source/resource saleability, visibility and each business object's own Guard decide action availability; existing Lock/funds/Transaction and history remain |
| P02-06 | 人工审查并清除异常 | P02-06 | authorized reviewer; evidence/reason required; revalidate actual source before allowing new business; never erase anomaly history |
| E02-01 / E02-02 / P02-07 | 重试失败图片 | E02-01 / E02-02 / P02-07 | image state partial_failed/failed; retry only failed items; successful frozen images and business facts remain |
| E02-01 / E02-02 / P02-07 | 人工补录/恢复图片 | E02-01 / E02-02 / P02-07 | authorized vehicle editor in scope; append recovery fact and audit; no rollback of successful frozen set |
| P02-08 | 查看 JYT mapping pending | P02-08 / P02-07 | upstream vehicle may continue publish/normal business when other publish guards pass; mapping remains independently pending and auditable |
| P08-01 | 新建/修改/保存阶梯价格规则 | P08-01 | display-price permission/scope; draft validation includes no overlap and declared range; failed save leaves current effective rule unchanged |
| P08-02 | 配置每日查价额度/权益 | P08-02 | authorized price-entitlement manager; UTC+8 business-day boundary; changes audited and do not retroactively change consumed facts |
| P08-04 | 保存单车覆盖价草稿 | P08-04 | REF_GUARD[PRICE_OVERRIDE]；local_ui_fact=authorized override; failed save keeps current effective customer price; successful activation records before/after/cycle |
| P09-01 / P09-02 / P09-03 | 配置员工映射/SLA/DND | P09-01 / P09-02 / P09-03 | REF_GUARD[NOTIFICATION_CONFIG]；local_ui_fact=active employee with explicit P09 configuration capability for employee mapping/SLA/DND; submit rechecks data scope and config object state; exact incident cadence only when configured; every send re-evaluates DND and event validity; no editable notification-template authority is invented |
| P09-04 | 查看发送结果 | P09-04 | read SENT/FAILED/SKIPPED/DEDUPED logs; no manual delivery-retry command is invented; queue retry remains Phase 2 engineering; outcome never mutates business master state |
| P10-01 / P10-02 | 新建/编辑/保存/排期/排序公告 | P10-01 / P10-02 | authorized content manager; valid window; sorting changes presentation only and is audited |
| P07-04 | 校验交易/交付材料 | P07-04 | show missing fields returned by current configured required-field set; IA does not invent the set; invalid result blocks completion only |
| P07-01 | 配置默认 Lock 时长 | P07-01 | REF_GUARD[LOCK_CREATE_CANCEL]；local_ui_fact=authorized employee business configuration, never System Admin identity alone; new Locks snapshot duration at creation; existing Locks unchanged |
| P12-01 / P12-02 | 调整 Banner 排序 | P12-01 | authorized content manager; reorder active/scheduled items; preserve target/window and audit |
| C01 / C01-01 | 渲染无有效客户价 | C01 / C01-01 | show value fact `价格咨询`; it is not a clickable CTA and exposes no internal price |

### V2 notification allowlist

Only new Consultation, SLA timeout, Waitlist release, Lock expiry, supply anomaly and important Transaction changes may proactively notify. Browse, click, matching, intake, profile, price, mapping and responsibility changes must not proactively notify.

## V5 canonical action authority

旧 Journey/Object 摘要型 Action Registry 已撤销。当前真实 command/action 全集由 `IA_V5_ACTION_CONTRACT.md` 定义；本登记表仅保留实际页面/控件路由，并通过 V5 canonical guard contract 引用统一 guard。

| E02 | 更多→草稿车源 | E02-02 | actor has current manual-vehicle publish/manage capability and scope; open DRAFT_LIST; never auto-select a single old draft |
| E02-02 | 继续编辑目标草稿 | E02-02 | selected draft remains in current scope; reopen same draft_id; revalidate permission/scope/model/source_type and current form facts |
| E02-02 | 删除纯草稿 | E02-02 | selected object is still pure draft; second confirmation; submit revalidates permission/scope/object state; only target draft is deleted |