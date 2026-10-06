# PDM-21｜最终完整规则

> 域：员工工作台 / 车辆列表 / 客户中心 / Internal Mode / 敏感动作裁剪  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> Final 前完整性复核：`R2 PASS / FINAL_CANDIDATE_READY`  
> 正式规则 / 用户裁决单元：`56`

## 1. 核心定位

PDM-21 是：

> **员工端产品体验、工作台编排与 Employee Action Projection 的唯一 Authority。**

负责：

- E01 工作台；
- E02 车源列表、员工车辆详情、发布/编辑、Internal Mode；
- E03 客户中心 / CRM；
- E04 我的；
- E05 找车；
- E06 咨询；
- E07 Lock / Waitlist / Deposit / Transaction / Refund；
- E08 公海 / 待公海 / Collaboration；
- 员工端导航、卡片、优先级、状态展示、敏感 Action 入口、确认流程、错误/空态/只读态；
- 4S 成员在同一员工端中的合法裁剪。

PDM-21 不重新定义 Customer、Employee permission、Vehicle、Price、Demand、Matching、Priority、Recommendation、Consultation、CRM、Public Pool、Lock、Transaction 等底层业务真相。

员工端只能消费 PDM-01～20 的 completed Authority。

## 2. 一级结构

一级 Tab：

> **E01 工作台｜E02 车源｜E03 客户｜E04 我的**

业务模块：

> **E05 找车｜E06 咨询｜E07 锁车/交易｜E08 公海**

4S 继续使用同一员工端，不建设第二套 App / IA。

## 3. 全局权限原则

必须始终保持：

1. 页面可见 ≠ permission；
2. Internal Mode ≠ permission；
3. 职位名 ≠ permission；
4. System Admin 控制平面身份 ≠ 员工业务 actor；
5. 历史 uploader / assignee / owner ≠ 永久当前操作权；
6. 所有 mutation 提交时重验 identity + permission/capability + data scope + object state；
7. 4S 使用同一 App，但按 hard DENY、scope、source_type、object state 做裁剪；
8. 员工端不得用 UI 状态创造新的 Domain 主状态。

## 4. E01 工作台三类语义分离

工作台同时可展示：

1. **强待办 / 今日必须处理**
2. **Customer Opportunity**
3. **Source Radar**

三类可以同屏，但不得共享同一 task/state lifecycle。

Opportunity 是聚合客户机会信号。

Source Radar 是 Demand-centered Matching change discovery。

强待办是真实责任与时效。

## 5. 接客状态

员工本人唯一切换入口：

> **E01 顶部：接客中 / 暂停接客**

E04 只展示，不提供第二个开关。

接客状态只影响未来自动分配，不反写现有 owner / responsible。

是否允许暂停、最后一名 active receiver 保护继续服从 PDM-02 / PDM-03。

## 6. E01 强待办统一排序

统一采用：

> **deadline / urgency first**

规则：

1. 已超时 Consultation 永远最前；
2. 其他有明确 deadline / expires_at 的强待办按剩余时间由短到长；
3. 包括即将超时 Consultation、LockRequest 6h deadline、Priority expires_at 等；
4. 无 deadline 的 pending Application / 新 Consultation 等按创建时间由早到晚；
5. 状态变化后实时重排；
6. 排序不改变任何底层业务状态。

## 7. Consultation 工作台优先级

Consultation 内部排序：

1. 已超时；
2. 即将超时；
3. 新咨询 / 新服务意向。

“即将超时”阈值：

> `剩余时间 <= min(5分钟, 当前 Consultation 固化 SLA 时长 ÷ 3)`

该阈值只影响 E01 展示，不改变 Consultation 主状态或 SLA 业务事实。

## 8. E02 车辆列表

E02 职责：

> **找车、识别车辆、进入详情。**

可复用客户端基础搜索 / 筛选 / 排序。

列表卡片不直接堆：

- Recommendation mutation；
- Lock mutation；
- 隐藏/恢复；
- 上下架；
- 内部价格修改；
- 电话刷新。

敏感 Action 进入详情或对应业务上下文再执行。

## 9. 员工车辆详情默认 Customer-Safe

E02-01 默认使用 Customer-Safe Projection。

默认不返回 / 展示：

- 内部价 / 批发价；
- 上游电话；
- 完整敏感档案原件；
- 员工内部敏感备注；
- 其他仅 Internal Mode 可见字段。

不能只靠前端遮挡，后端也必须按身份 / mode / permission / scope 控制 payload。

## 10. 车辆详情外层 Action

客户安全详情外层只保留安全、高频入口：

- 分享；
- 推荐给客户；
- 锁车；
- 纯查看型客户安全信息。

内部价格、电话、编辑、价格 override、隐藏/恢复、上下架、一键转名邦等统一进入 Internal Mode。

## 11. Internal Mode 进入方式

员工车辆详情：

> **长按价格区域约 3 秒进入 Internal Mode。**

进入本身不授予任何新 permission。

进入后看到什么、能做什么，继续逐项读取：

- source_type；
- Employee identity；
- permission/capability；
- data scope；
- object state；
- completed-PDM Guard。

## 12. Internal Mode 生命周期

以下场景恢复 Customer-Safe：

- 返回 / 离开详情；
- 重新打开 / 页面重新进入；
- 切换 Vehicle；
- 分享 Vehicle；
- 发起 Recommendation；
- App 连续后台 ≥5 分钟。

App 后台 <5 分钟返回：

> 也必须重新校验身份、permission、scope、object state。

权限撤销、scope 变化、Employee inactive、Vehicle 状态变化后：

> 旧页面不得凭旧会话继续执行敏感 mutation。

## 13. 敏感字段与按钮裁剪

如果员工缺少 permission / capability：

> 对应敏感字段、区域、Action 不返回 / 不展示。

不采用“按钮还在，只是灰色”表达权限不足。

只有：

> 员工具备能力，但当前 object state 暂不可执行

时，才可显示 disabled + reason。

## 14. 4S Internal Mode

4S 成员查看自己当前 data scope 内有权管理的 4S Vehicle 时：

> **进入同一个 E02-M01 Internal Mode，但严格裁剪。**

可承载：

- 自己有权 Vehicle 的字段管理；
- 图片；
- 档案；
- 正常 customer_list_price 编辑；
- 当前合法普通车辆管理能力。

HARD DENY：

- 名邦内部价 / 批发价；
- internal_wholesale_price；
- 客户展示价 override；
- 一键转名邦；
- 名邦 CRM / Demand / Consultation / Recommendation / Lock / Transaction；
- 将 4S source_type 改成名邦。

不建设独立 4S 管理 App / IA。

## 15. 隐藏车源

E02 入口：

> **更多 → 隐藏车源**

仅有合法查看/管理能力时显示。

默认正常列表不混入 hidden Vehicle。

单车详情 Internal Mode：

- 正常可见 Vehicle → **隐藏车源**
- hidden Vehicle → **恢复显示 / 解除隐藏**

必须严格区分：

> hidden / visible ≠ offline / relist

解除隐藏不得把真实 offline Vehicle 错误恢复在售。

隐藏/恢复与真实下架/重新上架是两套动作、两套语义。

## 16. 正式 Vehicle source_type 修改

合法名邦 Employee 在权限、scope、state 合法时，可将正式人工 Vehicle：

> **名邦 ↔ 4S**

不允许人工改成批发/JYT。

修改：

- 不重建 vehicle_id；
- 不新建 listing_cycle；
- 不改写历史；
- 修改后按新 source_type 重新计算可编辑字段、权限、责任和可见性。

4S Member 不具备改成名邦的能力。

## 17. 一键转名邦

只面向合法名邦 Employee。

4S HARD DENY。

不设置独立 `vehicle.convert_mingbang` permission。

点击后：

> **必须进入专门确认 Sheet / Page**

确认内容至少包括：

- 同一 vehicle_id；
- 同一当前 listing_cycle；
- source_type 从 wholesale/JYT 单向变名邦；
- 不创建第二辆 Vehicle；
- 不直接转回批发；
- Existing Lock / Waitlist / Transaction / Favorite / Recommendation 继续绑定原 vehicle；
- 转换前价格快照；
- 名邦 customer_list_price 不自动继承批发客户展示价；
- internal_wholesale_price 仅在真实 upstream_wholesale_price 存在时复制；
- 图片资产化为后续独立子任务；
- 图片 partial_failed / failed 不回滚已经完成的来源转换；
- 自动 hidden 重算；
- 人工 hidden 不自动解除。

提交时再次重验当前 Employee、scope、object state。

## 18. 上游电话

电话区域仅在合法 wholesale/JYT source context 出现。

必须区分：

- latest success；
- cache available；
- latest failed + cached；
- unavailable。

提供：

> **拨打**

不提供：

> **复制**

转名邦/4S 后不得因为历史 upstream_publisher_id 继续出现日常上游电话入口。

Internal Mode 本身不授电话权限。

## 19. 员工价格能力

员工端区分：

- customer_list_price 正常车辆编辑；
- internal_wholesale_price 编辑；
- 客户展示价 override；
- LIMITED Customer 临时增加当天查价次数。

规则：

- internal_wholesale_price 修改者必须具备独立内部价 permission；
- override 使用独立敏感 Action / Sheet；
- UNLIMITED Customer 不提供追加次数入口；
- 不恢复独立“调价 permission / 调价动作”。

## 20. 图片管理

员工端承载：

- 上传；
- 删除；
- 排序；
- 资产化进度；
- 失败重试；
- 人工恢复。

必须区分：

1. CDN / 展示加载失败；
2. wholesale → Mingbang 资产化 partial_failed / failed；
3. manual recovered。

不得用单一 IMAGE_RETRYING 混所有生命周期。

图片失败不得回滚已完成来源转换。

## 21. 人工车辆新增 / 草稿 / 发布

E02-02 承载：

- 新增车源；
- 显式保存草稿；
- 草稿列表；
- 恢复编辑；
- source_type 选择；
- Draft 阶段合法修改 source_type；
- 车型选择；
- MODEL_MISSING；
- VIN duplicate；
- 保存修改；
- 正式发布；
- 发布后继续补充非发布硬门槛资料。

正式 Vehicle：

> 不提供普通物理删除入口。

## 22. Model / MODEL_MISSING

选择有效具体车型后：

> 自动带出车型年款、排量、变速箱、排放、能源等由车型唯一确定的固定属性。

销售不重复填写。

MODEL_MISSING：

- 保留原 draft_id；
- 保留已填内容；
- System Admin 补齐后返回原草稿；
- 带回有效车型；
- 重新执行发布校验。

JYT 已明确车型事实、本地 mapping pending：

> 不得投影成“车型未知”，也不得仅因此阻断合法业务。

车型映射冲突：

> 明确提示，但不自动等于 Vehicle 不可售。

员工端不提供 System Admin 车型主数据治理动作。

## 23. Vehicle Archive

员工端承载：

- 上传 / 新增；
- 后补；
- 更新 / 替换；
- 作废；
- 查看历史 / 版本；
- 核验；
- 设置 / 取消 customer_visible；
- 查看合法内部原始档案。

原记录、上传人、上传时间、作废/替换历史不得覆盖删除。

customer_visible：

> 只决定 Customer Safe Projection，不自动开放 VIN / 绿本 / 行驶证敏感原件。

Archive 不完整本身：

> 不得被员工端投影成不可推荐 / 不可咨询 / 不可锁车。

## 24. 员工分享

员工从合法车辆详情分享。

分享：

- 只携带必要安全归因；
- 不创建 Recommendation；
- 不赠送 price-right；
- 不传播 visibility grant；
- 不传播 Internal Mode；
- 不传播电话 / 内部价；
- 旧 share 打开仍重新校验当前 Vehicle / Customer visibility。

Owner 继续服从 PDM-03。

## 25. E03 CRM

E03 是员工 CRM 客户中心，不重建 CRM Domain。

承载：

- Customer 基础资料；
- 当前业务；
- Follow-up；
- Customer Profile；
- 历史业务；
- Opportunity；
- 聚合兴趣。

经理 / 店长在合法 scope 内可切：

> **我的客户 / 团队客户**

Customer Detail 快捷操作：

- 记录跟进；
- 找车服务；
- 推荐车辆。

不得恢复：

> Customer Detail → 锁车 → 再选 Vehicle

## 26. Personal Note / Shared Profile

Personal Note：

> 仅作者本人可见，owner 变化不转移。

Shared Profile：

> 按 PDM-16 owner / Collaboration / manager scope 维护。

不恢复历史大字段 CRM Profile。

Recent behavior：

> 只做聚合兴趣，不默认开放逐点击流水或完整收藏监控。

## 27. CRM Follow-up

E03-03 必须真实可写：

- 新增 Follow-up；
- 填写内容；
- 提交；
- 成功后追加时间线。

Correction / invalidation：

> 使用追加式更正，不覆盖原 actor / time / content。

Owner 变化不改写历史 Follow-up。

## 28. E04 我的

仅展示：

- 姓名 / 头像；
- 角色；
- 名邦 Employee 主门店；
- 当前接客状态；
- 当前可见权限摘要；
- 飞书绑定；
- 账号 / 必要设置。

4S 不伪造名邦主门店。

E04：

- 不放第二个接客切换；
- 不重复 Customer / Vehicle / Find-car / Lock / Transaction 业务模块。

## 29. E05 Application 与 Demand

Application 和 Demand 必须分开。

pending Application：

- 所有 Customer 可存在；
- 无 entitlement 也可 pending；
- 进入工作台“找车服务待处理”；
- 卡片只进入处理详情；
- 不一键直接 active Demand。

员工可合法调整 Customer Level，但：

> 等级变化本身不自动激活 Demand。

正式激活时重新校验：

- entitlement；
- phone；
- identity；
- permission；
- scope；
- object state。

## 30. Demand 员工端状态

Demand 主状态：

- active；
- paused；
- completed；
- cancelled。

员工端承载：

- activate；
- pause；
- resume；
- complete；
- cancel；
- ending request 处理。

Customer 结束请求：

> 进入员工待处理，再按真实语义落 completed 或 cancelled。

合法 Employee：

> 也可直接结束 Demand，不要求先有 Customer 请求。

责任交接 / inactive / 离职：

> 不改写历史 responsible / 状态事实。

## 31. Matching 员工端

流程：

> 销售匹配描述 → deterministic parse → standard conditions → recalc → four-tier result → explanation → confirmation_needed

confirmation_needed：

> 只能补事实 → 重算 → 读取新正式 tier。

不得直接手工变 high/acceptable、Priority、Recommendation。

## 32. Matching stale / retry

旧 Match Result 因输入或状态变化失效时：

> 显示为 history / stale，不得冒充 current。

recalculation：

- pending / failed 必须有明确状态；
- partial failure 成功对象保留新结果；
- 失败对象进入 retry set；
- retry 只针对失败集合且幂等。

stale / failed：

> 不得驱动新的 Priority / Recommendation。

## 33. Priority 员工端

Priority 是系统事实投影，不提供人工 creator。

可显示：

- Vehicle；
- Customer；
- trigger Demand；
- Match tier；
- responsible；
- TTL / expires_at；
- history / business context。

合法动作：

- 进入 Recommendation；
- 提前 release Priority；
- 进入 Vehicle / Demand。

不得：

- 手工创建；
- transfer 给其他 Customer；
- override；
- 改 expires_at；
- renew；
- revive ended Priority。

## 34. Recommendation

合法真人入口：

1. Vehicle Detail；
2. CRM Customer Detail；
3. Find-car candidate。

批量推荐 UI 可多选 Vehicle，但后端逐车 Guard / idempotent create/reuse。

create/end/void 提交时重新校验：

- active eligible Mingbang Employee；
- current business responsibility；
- permission/capability；
- data scope；
- object state；
- Priority / Customer Guard。

4S HARD DENY。

System Admin 身份本身不自动执行业务。

## 35. Source Radar

Radar Event 可查看匹配详情并进入合法 Recommendation。

“标记不适合”：

- 不改 Match Result；
- 不改 Rule Dictionary；
- 不改 Demand；
- 只抑制当前 Demand × Vehicle 当前 Radar 事实；
- 不形成永久黑名单；
- Matching 输入实质变化后允许生成新 Radar Event；
- 历史人工处理保留。

## 36. Consultation

E06 与 E01 使用同一 PDM-15 Consultation Authority。

员工端承载：

- processing；
- Follow-up；
- resolve；
- invalid；
- normal close；
- reassign。

打开 / 已读 / 改 processing / reassign：

> 不等于 first real response。

4S HARD DENY。

不得恢复：

> CANCELLED 第五主状态。

## 37. LockRequest 六种结果

员工端明确区分：

- PENDING；
- APPROVED；
- REJECTED；
- EXPIRED；
- LOCK_CONFLICT；
- CLOSED_NOT_LOCKABLE。

PENDING：

- 进入 E01 强待办；
- 使用 6h 服务端 deadline；
- 参与 urgency 排序。

APPROVED：

> 关联 resulting_lock_id。

LOCK_CONFLICT：

- 表示其他请求先形成 active Lock；
- 合法时关联 resulting_waitlist_id。

CLOSED_NOT_LOCKABLE：

> 表示非竞争原因最终不可锁。

终态不回 PENDING。

## 38. Lock / Waitlist

E07 可承载：

- 明确 Customer + Vehicle 上下文直接创建合法 Lock；
- LockRequest approve；
- Lock 延期；
- release；
- cancel；
- Waitlist 查看 / end；
- responsible handoff。

竞争 LockRequest：

> LOCK_CONFLICT 后自动创建 / 复用 Waitlist。

不得恢复：

- conflict 后要求 Customer 再点一次候补；
- Waitlist 自动晋升 Lock；
- V1 批量 approve / release / extension / Waitlist mutation。

## 39. Deposit / Transaction / Refund

E07 承载：

- 记录真实 Deposit；
- Deposit correction；
- Transaction create；
- complete；
- cancel；
- correct；
- Refund create；
- 实际退款确认；
- pending Refund 直接 close + reason；
- supply anomaly cancel/change-car/refund；
- Transaction responsible handoff。

入口存在不得放宽真实 permission/capability。

## 40. Employee Vehicle Feed 占用安全

占用展示优先级：

> **trading > locked**

列表不得泄露：

- 无关 Customer 姓名；
- 手机号；
- Deposit 金额；
- Transaction 详细进度。

不得直接复用客户端：

- 我的锁车；
- 我的候补。

## 41. E08 公海

承载：

- 查看公海；
- 合法主动领取；
- 待公海三向处理；
- 指定分配 / 人工治理结果；
- Collaboration 建立；
- scope 调整；
- Collaboration 结束；
- 进入 Customer 详情。

后台指定分配 / 人工治理为主。

主动领取：

> 保留但弱化，并受 permission/config/protection/concurrency Guard。

E08 不重建 owner/public-pool/Collaboration 状态机。

## 42. 明确废弃 / 不得恢复

不得恢复：

1. Internal Mode 自动授内部价；
2. Internal Mode 自动授全部敏感能力；
3. 页面可见 = permission；
4. manager/store manager 职位 = 全权限；
5. System Admin = Employee business actor；
6. 独立 4S App / IA；
7. 一键转名邦独立 permission；
8. “我要这辆车”合并 Consultation / LockRequest；
9. CRM 先锁车再选 Vehicle；
10. 人工 Priority create / transfer / override / edit TTL / renew / revive；
11. confirmation_needed 直接变成功 / Priority；
12. Waitlist 自动晋升 Lock；
13. LockRequest conflict 后要求 Customer 再次手动候补；
14. 列表卡片堆隐藏/上下架/电话/内部价等敏感快捷 mutation；
15. hidden 与 offline 混为同一状态；
16. stale Match Result 驱动新 Priority / Recommendation；
17. Archive 不完整自动阻止 Recommendation / Consultation / Lock；
18. share / Recommendation 携带 Internal Mode / internal price / phone；
19. 第二套 employee-side owner / permission / CRM / Lock 状态机。

## 43. Cross-PDM Handoff

### Incoming｜Final closeout 前保持 HANDOFF_ACCEPTED

共 19 条：

- HO-P02-P21-001；
- HO-P03-P21-001；
- HO-P04-P21-001；
- HO-P05-P21-001；
- HO-P06-P21-001；
- HO-P07-P21-001；
- HO-P08-P21-001；
- HO-P09-P21-001；
- HO-P10-P21-001；
- HO-P11-P21-001；
- HO-P12-P21-001；
- HO-P13-P21-001；
- HO-P14-P21-001；
- HO-P15-P21-001；
- HO-P16-P21-001；
- HO-P17-P21-001；
- HO-P18-P21-001；
- HO-P19-P21-001；
- HO-P20-P21-001。

### Outgoing｜HANDOFF_OPEN

- HO-P21-P23-001｜`HANDOFF_CLOSED / source_backwrite=YES`：员工工作台通知投影与 deep-link Guard 已由 `07_重建工作区/PDM-23_最终完整规则.md` 正式承接；
- HO-P21-P25-001。

## 44. Stale Carrier

Current IA / Low-Fi 只作为 carrier，不反向覆盖当前 Authority。

明确 stale / 待 Post-PDM25 对齐的至少包括：

- 4S 被整体挡在 Internal Mode 外；
- vehicle.convert_mingbang 独立 permission；
- Internal Mode 自动可看 internal price；
- E02-01 客户安全详情直接挂敏感 Action；
- CRM Customer Detail 直接锁车；
- “我要这辆车”咨询类旧待办；
- hidden source entry 缺失；
- employee price carrier 不完整；
- Model / Archive / Matching failure / LockRequest 状态 carrier 不完整；
- E01 Opportunity / Radar / Public Pool / strong-task nav 不完整。

统一：

> `CARRIER_DEFERRED / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

当前不施工 IA / Low-Fi / Engineering。

## 45. Final 前完整性结论

R2：

- `SOURCE_TO_ATOM = PASS`
- `ATOM_TO_SOURCE = PASS`
- `SEMANTIC_COMPLETENESS = PASS`
- `M15_M17_M16_COVERAGE = PASS`
- `MISSING_RULE_UNRESOLVED = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `OUTGOING_HANDOFF_GAP = 0`
- `NEGATIVE_CLAIMS_VERIFIED = PASS`
- `PDM21_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM21_FORMAL_UNITS = 56`
- `PDM21_FINAL_CANDIDATE_READY = YES`

## 46. Final Closeout

用户已最终批准并确认执行。

- 正式 Authority：`07_重建工作区/PDM-21_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-21_最终完整性复核_2026-10-06.md / PASS`；
- 56 个正式规则 / 用户裁决单元全部进入 Final；
- 19 / 19 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P21-P23-001 已 `HANDOFF_CLOSED / source_backwrite=YES`；HO-P21-P25-001 继续 `HANDOFF_OPEN`；
- PDM-21：`COMPLETE / INTEGRITY_PASS`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：`PDM-22 Startup Gate`.
