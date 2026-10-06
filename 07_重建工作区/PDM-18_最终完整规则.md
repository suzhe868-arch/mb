# PDM-18｜最终完整规则

> 域：LockRequest / 正式 Lock / Waitlist / 延期 / 释放  
> 当前状态：`COMPLETE / INTEGRITY_PASS`  
> Final 前完整性复核：`R2 PASS / FINAL_CANDIDATE_READY`  
> Final Integrity：`PASS`  
> 用户已最终批准并确认执行。本文件为 PDM-18 当前正式产品 Authority。

## 1. 核心定位

PDM-18 是：

> **LockRequest（锁车申请）/ 正式 Lock（锁车）/ Waitlist（候补）以及延期、释放、到期、责任交接的唯一业务 Authority。**

负责：

- LockRequest 创建、复用、审批、失效与结果；
- 正式 Lock 创建、唯一性、时长、价格快照、延期、释放、取消、到期；
- Waitlist 创建、自动候补、幂等、顺序、结束、重新确认；
- Lock / Waitlist responsible 与 handoff；
- Priority / Recommendation / Matching / visibility 的 Lock 边界；
- 供应异常、Customer disable、Vehicle source/visibility/archive 变化下的 Lock/Waitlist 保真；
- 上述业务的幂等、并发与跨域 handoff。

不重建 Customer identity/account、Customer owner/public pool、permission/data scope、Vehicle/listing_cycle、Archive、Price Authority、Matching、Priority、Recommendation、Deposit/Transaction/Refund/换车、客户端/员工端最终 IA、通知渠道、统一审计底层实现。

Deposit / Transaction / Refund / 换车由 PDM-19 承接。

## 2. 三对象严格分离

### LockRequest
客户提出“申请锁车”的正式申请对象。

- PENDING 不占车；
- 不生成 Lock price/duration snapshot；
- 不启动正式 Lock 72h。

### Lock
车辆正式占用事实。

- 同一 Vehicle 同时最多一个 active Lock；
- 同一 Customer 可锁多个不同 Vehicle。

### Waitlist
他人已有 active Lock 时的候补/意向事实。

- 不占车；
- 不自动升级 Lock。

Consultation、Recommendation、Priority 均不得替代 Lock。

## 3. 客户锁车入口

客户在合法 Vehicle + listing_cycle 上点击“锁车”：

> 创建 / 复用 `LockRequest.PENDING`。

客户点击按钮本身不直接创建 Lock、不占车、不开始 72h、不冻结 Lock 价格快照。

旧“我要这辆车”把咨询与锁车混成一个入口的模型不得恢复。

## 4. LockRequest 6 小时与结果合同

PENDING 最长 6 小时，以服务端时钟为准，到期后不能 approve。

PENDING 是唯一 live 申请态。

合法结束结果：

- `APPROVED`：正式 Lock 原子创建成功，关联 `resulting_lock_id`；
- `REJECTED`：合法员工明确拒绝；
- `EXPIRED`：超过 6h；
- `LOCK_CONFLICT`：其他请求先形成 active Lock；
- `CLOSED_NOT_LOCKABLE`：最终重验时因非竞争原因已经不可锁。

终态不回到 PENDING；新的真实申请需要新 LockRequest。

## 5. LockRequest 权限与入口

LockRequest approve/reject 属于名邦内部受控业务动作。

- 4S Member hard DENY；
- 最终提交必须重验 identity、permission/capability、data scope、Customer/account、Vehicle/listing_cycle、current lockability、active Lock；
- 职位名本身不自动授权；
- System Admin 控制平面身份本身不取得 Lock 业务执行权。

V1 客户端：

- 不提供 LockRequest 主动 cancel/withdraw；
- 不建设独立申请进度详情页；
- 通过当前页面/“我的”投影真实结果。

## 6. 多个 LockRequest 与正式获锁顺序

同一 Vehicle + listing_cycle：

- 可有多个 Customer 的 PENDING；
- PENDING 不占车；
- 申请 created_at 不产生正式 Lock 优先权；
- Priority 也不产生 LockRequest 抢车分值。

正式 Lock winner：

> 第一个合法 approve 且原子创建 Lock 成功者。

单车同一时刻只允许一个 active Lock。

## 7. 竞争申请自动候补

一笔 LockRequest 成功形成正式 Lock 后：

- 其他仍有效、且仅因该 Lock 成立而失去获锁机会的同车同 cycle PENDING 进入 `LOCK_CONFLICT`；
- 同时自动创建 / 复用 Waitlist；
- 不要求客户再次点击“候补”。

LockRequest 本体继续保持 `LOCK_CONFLICT`，可关联 `resulting_waitlist_id`，不直接变成 Waitlist 状态。

自动 Waitlist 创建仍必须满足当前 Customer/account/phone/Vehicle/cycle/active Lock 等 Guard。

若车辆已 sold/offline/unavailable/cycle ended 等不允许候补：

> 不机械创建 Waitlist。

## 8. Waitlist 内部顺序

竞争申请自动形成的 Waitlist：

1. 按原 `LockRequest.created_at`；
2. 时间相同再按稳定 request_id tie-break。

该顺序只用于内部稳定处理和员工后续联系 / 人工重确认。

它不代表自动获得下一笔 Lock，也不代表客户拥有“第几名就一定锁到”的承诺。

V1 客户端不展示保证性“第1名 / 第2名”，只显示“候补中 / 等待确认”等中性状态。

## 9. Waitlist 的手机号门槛

客户主动登记 Waitlist 属于人工服务动作：

- 必须有当前可用手机号；
- 无手机号时走 PDM-01 统一授权；
- 授权成功自动继续原动作；
- 拒绝/取消不创建新的 Waitlist。

自动 Waitlist 也重验当前 phone/customer/account。

普通浏览不因这一规则被强制手机号。

## 10. Waitlist 创建来源与幂等

当前 V1 正式 Waitlist 产生路径：

1. 客户在他人 active Lock 场景主动登记候补；
2. 竞争 LockRequest 按本 PDM 自动候补。

当前无充分 Authority 支持另建“员工替任意新客户手工加候补”的独立入口，因此不擅自新增。

同 Customer + Vehicle 同时最多一个 active Waitlist。

重复合法提交：

> 复用当前 active Waitlist，不重复创建。

## 11. Waitlist responsible

创建 Waitlist 时按当前合法事实确定 responsible：

1. 本次真实 Recommendation recommender；
2. 当前 active/paused Demand responsible；
3. Customer current owner；
4. 均不存在合法承接人时，先完成合法 owner/responsible assignment，再创建 Waitlist。

创建成功后：

- responsible 固化；
- 普通 owner/Demand responsible 后续变化不自动漂移；
- inactive/离职/失去资格必须正式 handoff；
- 自动候补不把“批准别人 Lock 的员工”自动变成所有候补 responsible。

## 12. 客户不能自助取消 Waitlist

V1 客户端：

- 可查看当前/历史候补；
- 不提供“取消候补”业务 mutation。

Waitlist 可由当前合法 responsible，或具有明确 capability + data scope 的管理人员人工 end。

人工 end 必填 reason 并审计。

## 13. Waitlist 结束矩阵

以下真实事实结束当前 cycle 对应 active Waitlist：

- completed；
- offline；
- unavailable；
- sold_external；
- listing_cycle ended；
- 其他正式不可售终态。

单纯 hidden 不结束 Waitlist。

某候补 Customer 后来合法获得该 Vehicle 正式 Lock：

> 只结束该 Customer 自己的 Waitlist。

原占用 Lock release/expiry/cancel：

- 不自动结束其他 Waitlist；
- 不自动把下一位升级成 Lock；
- 进入人工重新确认。

已 ended Waitlist：

> 不因误成交纠错、Vehicle 恢复或 Customer 再次表达意向自动复活。

## 14. 正式 Lock 的创建入口

合法正式 Lock 有两条路径：

### 客户申请路径
Customer LockRequest approve → 原子创建正式 Lock。

### 员工直接路径
合法名邦 Employee 已明确 Customer + Vehicle 上下文时，可以直接创建正式 Lock。

不要求所有 Lock 必须先有 Customer LockRequest。

4S Member 对名邦 Lock 业务 hard DENY。

## 15. 正式 Lock responsible 与 approver/actor 分离

每笔正式 Lock 必须有合法 responsible，不允许 `responsible=null`。

LockRequest 路径：

- 默认使用 Customer 当前合法业务承接 employee；
- manager/authorized employee 代审批时记录真实 approver/actor；
- 代审批不会自动把 manager 变成 Lock responsible。

员工直接 Lock：

- actor 本人就是合法当前承接人 → 可成为 responsible；
- 否则必须明确合法 responsible。

普通 Customer owner 变化不自动漂移 Lock responsible。

inactive/离职必须正式 handoff，保留 old/new responsible、actor、time、reason。

## 16. 正式 Lock 唯一性与幂等

核心 invariant：

> 同一 Vehicle 同一时刻最多一个 active Lock。

正式 Lock 创建必须幂等/retry-safe：

- approve 重试不得创建第二个 Lock；
- 员工直接 Lock 重试不得创建第二个 Lock；
- 网络超时 / 重复点击 / worker retry 不得放大成多笔 active Lock；
- 已成功重试返回/识别已有结果。

具体数据库/事务实现交 PDM-25/Engineering。

## 17. 默认 Lock 时长

默认正式 Lock：

> **72 小时。**

后台可配置。

新 Lock：

- 按创建时当前有效配置计算 expires_at；
- 创建后该笔初始 expires_at 固化。

后续改默认值：

> 不追改已有 Lock。

LockRequest 6h 与 Lock 72h 是两个独立业务时钟。

## 18. 默认 Lock 时长配置权限

默认 Lock 时长属于业务配置：

- actor 必须有明确 business-config permission/capability；
- data/config scope 必须合法；
- System Admin 控制平面身份本身不自动拥有该业务配置权；
- 不硬编码经理/店长职位名必然可改；
- 记录 old/new/actor/time；
- 只影响之后的新 Lock。

PDM-18 不额外发明固定 min/max。

## 19. 普通 Lock 到期与真实意向金

普通、没有真实 Deposit 的 active Lock：

> 到 expires_at 可按正式超时规则释放。

一旦存在对应真实 Deposit：

> 不得仅因普通 expires_at 到期自动释放。

PDM-18 只消费“真实 Deposit 已存在”的事实；Deposit/退款/换车等由 PDM-19 负责。

## 20. 正式 Lock 人工延期

授权员工可对仍处于普通有效期管理的 Lock：

- 延长同一个 Lock 的 expires_at；
- 不新建第二个 Lock；
- 记录 old expires_at / new expires_at / actor / time；
- 客户侧读取新的当前 expires_at；
- 可展示“已延期”。

已有真实 Deposit 后的持续占用：

> 不再按普通倒计时延期模型处理。

## 21. Lock 人工释放 / 取消

人工 release/cancel 必须：

- 重验 identity；
- permission/capability；
- data scope；
- object state；
- 必填 reason；
- 记录 actor/time/before/after/reason。

当前 responsible 可在自身合法范围处理。

其他管理人员必须有明确 capability + scope，不能仅凭职位名。

自动 expiry 使用系统 reason，不要求人工输入。

## 22. 供应异常

Vehicle 在 active Lock 后发生上游失效 / 供应异常：

- 不自动取消 Lock；
- 不删除 price snapshot；
- 不删除 Deposit/Transaction 等已经发生事实；
- 不伪造成普通 expiry；
- 建立/挂接独立 supply_anomaly 事实；
- 当前 responsible / 合法管理人员人工核实后决定 release、换车、Transaction/Refund 等后续路径。

具体资金/换车后果交 PDM-19。

## 23. Lock 价格快照

正式 Lock 创建时冻结客户价格事实：

- 有数字有效客户展示价 → 保存数字；
- 当时为“价格咨询” → 保存明确“价格咨询”事实；
- 不用 0 / 假价格替代。

后续上游调价、markup/阶梯变化、override、source_type 变化均不得回写历史 Lock price snapshot。

## 24. Customer disable / restore

Customer account 停用：

- 不物理删除既有 Lock/Waitlist；
- 不把真实业务伪造成未发生；
- 禁止依赖正常 Customer account 的新动作；
- 当前 mutation 读取最新 account/object/permission 状态；
- ordinary Lock 的现实占用/超时等按本域当前事实处理，而不是因 account disable 直接取消。

恢复：

- 继续原 customer_id；
- 不复活 ended/expired/cancelled/old-cycle Lock/Waitlist；
- 不伪造新 Lock。

## 25. Vehicle source / visibility / archive

source_type 变化不改写已有 Lock/Waitlist 历史。

hidden：

- 不等于 Lock ended；
- 不等于 Waitlist ended。

Archive / 报告不完整本身不阻止合法 Lock/Waitlist。

Lock 状态变化不删除 / 重写车辆档案历史。

## 26. Matching × Lock

active Lock：

- 不使底层真实可售 Vehicle 从 Matching 消失；
- 其他 Demand 仍可产生带“已锁/占用”事实的 Match Result；
- 不得据此创建第二个 active Lock；
- 不得新建 Priority。

旧：

> active Lock = no_match

不得恢复。

## 27. Priority × Lock

正式 Lock 成立：

- 当前 active Priority ended；
- Priority Customer 自己 Lock 可记录 `converted_to_lock`；
- Priority 不作为 LockRequest 排队优先级/抢车分值。

Lock 结束：

- 不恢复旧 Priority；
- 不恢复旧 Priority expires_at；
- 车辆真正开放后按当前事实重新仲裁。

## 28. 普通 Lock 与 Priority-origin Lock 的可见性

### 普通 VIP/粉丝直接 Lock
只形成正式占车：

- 不自动把 Vehicle 对所有其他 Customer 隐藏；
- 其他 Customer 若按底层规则本来可见，仍可看到“已锁定”；
- 不能形成第二 active Lock；
- 可按本域合法 Waitlist 规则候补。

### Priority-origin Lock
Priority Customer 从 active Priority 转正式 Lock：

- Priority 本体 ended；
- Lock 继承原 Priority 客户侧排他 visibility；
- Lock 有效期间，除 Lock Customer 外其他普通 Customer 不进入普通公开列表/详情；
- 内部 Employee / PC / Matching 仍读取真实 Vehicle 和占用事实；
- 原有竞争 PENDING 仍可自动形成业务层 Waitlist，但不因此恢复普通 Vehicle Detail。

Lock 结束：

> 不恢复旧 Priority，按当前 Vehicle / Recommendation / Priority / visibility 重新计算。

## 29. Recommendation × Lock

Recommendation 与 Lock 独立：

- Recommendation 不产生 Lock 排队优先；
- 不产生抢车分值；
- 不 takeover Lock；
- Recommendation end/void 不取消已成立 Lock；
- Priority release/expiry 也不取消已成立 Lock。

active Lock/Transaction 的占用事实本身是否允许 Recommendation 继续存在，由 PDM-14 当前 Authority 判断；PDM-18 只保证 Recommendation 不绕过 Lock。

## 30. 不恢复固定“到期前30分钟提醒”

旧“默认到期前30分钟提醒”没有获得后续可靠重确认。

因此 PDM-18：

> 不写死 30 分钟。

如产品需要即将到期提醒，是否开启、提前多久、通知渠道/DND/去重/失败日志由 PDM-22/PDM-23 承接。

## 31. V1 不做批量 Lock / Waitlist mutation

V1 不提供批量：

- 创建正式 Lock；
- approve LockRequest；
- release/cancel Lock；
- 延期；
- 创建/结束 Waitlist。

可以批量查看、筛选、治理列表，但业务 mutation 逐对象独立提交和 Guard。

## 32. 核心历史与审计

至少需要可追溯：

### LockRequest
create/reuse、approve/reject/expire/conflict/closed-not-lockable、request/customer/vehicle/cycle、actor/system/time、before/after/reason/result、resulting_lock_id/resulting_waitlist_id。

### Lock
create、responsible、price snapshot、duration/expires_at snapshot、extension、release/cancel/expiry、handoff、supply_anomaly 关联。

### Waitlist
create/reuse/auto-create、source LockRequest（适用时）、responsible、internal order、end/system terminal end、handoff。

统一底层审计 carrier 由 PDM-25 承接。

## 33. 明确废弃 / 不得恢复

不得恢复：

1. “我要这辆车”把 Consultation/LockRequest/Lock 混成统一入口；
2. 客户点击锁车直接创建正式 Lock；
3. 默认正式 Lock = 2h；
4. Priority = Lock queue priority / 抢车分值；
5. active Lock = no_match；
6. Recommendation/Priority end 反向撤销合法 Lock；
7. CRM“先锁车再选车辆”旧入口；
8. LOCK_CONFLICT 后必须客户再次手动点候补；
9. Waitlist 自动升级成 Lock；
10. 普通 owner 变化自动漂移 Lock/Waitlist responsible；
11. 供应异常自动取消 Lock；
12. fixed 30 分钟到期提醒；
13. System Admin 身份本身自动拥有 Lock 业务/config 权限；
14. 客户端显示保证性候补名次；
15. V1 批量 Lock/Waitlist mutation。

## 34. Cross-PDM Handoff

### Incoming｜Final closeout 已关闭

- HO-P01-P18-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P02-P18-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P03-P18-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P04-P18-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P07-P18-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P10-P18-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P12-P18-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P13-P18-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P14-P18-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P17-P18-001。

### Outgoing｜PDM-19 已 CLOSED，其余未来 handoff 保持 OPEN

- HO-P18-P19-001｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-19 Final 已正式承接正式 Lock 后的 Deposit / Transaction / Refund / 换车；真实 Deposit 阻止普通 Lock timeout 自动释放；Lock→Transaction 原子转换、供应异常、退款/换车均建立新真实事实，不回写 PDM-18 Lock 历史；
- HO-P18-P20-001｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-20 Final 已正式承接 LockRequest / Lock / Waitlist Customer Safe Projection、普通 Lock 与 Priority-origin Lock 的可见性差异、自动候补、expires_at/延期、真实 Deposit 后持续锁定文案与非保证性候补展示；
- HO-P18-P21-001｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-21 Final 已正式承接 LockRequest 六种结果、E01 强待办、Lock/Waitlist 管理、延期/release/cancel/end 与 responsible handoff；
- HO-P18-P22-001；
- HO-P18-P23-001；
- HO-P18-P25-001。

## 35. Stale Carrier

已登记但当前不施工：

- LOCK_CONFLICT 不自动 Waitlist / 必须手工再点；
- 所有正式 Lock 客户可见性完全相同；
- 内部 Waitlist 顺序直接显示客户保证性排名；
- Lock 无独立配置入口；
- 正式 Lock 延期 / expires_at / supply_anomaly / Waitlist 结束矩阵操作投影不足。

统一留 PDM-25 完成 + PDM-01～25 全局最终总复核 PASS 后做 IA / Low-Fi Alignment。

## 36. Final 前完整性结论

R2：

- `SOURCE_TO_ATOM = PASS`
- `ATOM_TO_SOURCE = PASS`
- `SEMANTIC_COMPLETENESS = PASS`
- `MISSING_RULE_UNRESOLVED = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `OUTGOING_HANDOFF_GAP = 0`
- `NEGATIVE_CLAIMS_VERIFIED = PASS`
- `PDM18_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM18_FINAL_CANDIDATE_READY = YES`

当前唯一下一步：

## 37. Final Closeout

用户已最终批准并确认执行。

- 正式 Authority：`07_重建工作区/PDM-18_最终完整规则.md`；
- Final 前完整性复核 R2：`PASS / FINAL_CANDIDATE_READY`；
- Final Integrity：`PASS`；
- 43 个正式规则 / 用户裁决单元全部进入 Final；
- 10 / 10 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P18-P19-001、HO-P18-P20-001、HO-P18-P21-001 已 `HANDOFF_CLOSED / source_backwrite=YES`；其余 PDM-22 / PDM-23 / PDM-25 共 3 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- PDM-18：`COMPLETE / INTEGRITY_PASS`；
- IA / Low-Fi / Engineering 继续禁止提前施工；
- 下一步：`PDM-19 Startup Gate`。

当前唯一下一步：

> **PDM-19 Startup Gate。**
