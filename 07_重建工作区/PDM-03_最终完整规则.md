# PDM-03｜Owner / 来源归因 / 分享注册 / 转介绍 / 接客 / 离职交接｜最终完整规则

> 日期：2026-09-24  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> 说明：本文件为 PDM-03 经 Batch 1～4 与最终总览用户批准后的**正式当前规则**；2026-10-05 已按新标准完成 Legacy Final Integrity Audit，并同步 PDM-01 / PDM-02 / PDM-10 当前已完成跨域规则。后续 PDM 不得静默改写；若发现真实跨域冲突，必须重新提交用户显式裁决。  
> IA / Low-Fi 仅登记 `STALE_CARRIER`，统一延后到 PDM-25 完成并通过 PDM-01～25 全局最终总复核后集中对齐。

---

## 1. Customer Owner 基本不变量

1. 同一 Customer 同一时刻只能存在一个正式 `current owner`。
2. 不允许两个销售同时作为并列正式 owner。
3. owner 是当前 CRM 承责事实，不等同于原始来源、来源销售、推荐人或分享人。
4. 原始来源、来源销售、直接推荐人 / 转介绍来源、current owner 必须分离保存。
5. owner 后续合法变化，不得反向改写：
   - 原始来源；
   - 历史 owner；
   - 历史推荐 / 分享关系；
   - 历史操作与责任事实。

---

## 2. 新 Customer 首次 owner 产生顺序

新 Customer 建立 / 识别 `customer_id` 后，按以下顺序形成 owner：

1. 先判断是否存在有效的分享 / 转介绍等优先归属来源；
2. 有合法 share / referral owner 时，直接按该归属形成唯一 current owner；
3. 不再执行普通自然轮询；
4. 只有不存在任何有效优先归属来源时，才进入当前 `active + eligible + accepting` 接客池自动轮询；
5. owner 一旦成功形成，重复打开、刷新、重试及后续其他分享必须幂等，不得再次改变 owner。

因此：

> **有效分享 / 转介绍归属优先于自然轮询；自然轮询是无优先归属来源时的默认兜底。**

---

## 3. 自然注册立即形成 owner

1. 不再采用“首次进入只创建 customer_id，等首次人工服务事件才分配 owner”的旧规则。
2. 新 Customer 若无有效分享 / 转介绍等更高优先归属来源：
   - 立即进入 `active + eligible + accepting` 接客池；
   - 自动轮询；
   - 形成唯一 `current owner`。
3. 该规则为 2026-09-24 用户主动修改，明确覆盖 R5 / 9-19 / 旧 IA 中“首次进入暂不形成 owner”的旧口径。

---

## 4. 员工本人销售分享获客

对于尚无 owner 的新客户：

1. 通过某 active 且 eligible 员工的有效销售分享上下文进入，可直接归该员工。
2. 该员工仅仅关闭 `accepting`：
   - 只退出自然轮询；
   - 不取消本人主动分享获客能力。
3. 员工若已 inactive / 离职 / 失去业务资格，则不能继续承接新的 Customer owner，按失效分享兜底规则处理。

---

## 5. 客户分享车源 = 转介绍 / 获客归属链

客户车源分享不再是纯 `SOURCE_ONLY`。

对尚无正式 owner 的新客户 B：

> **客户 A 分享车源给 B，B 从该分享链进入后，可以直接形成销售归属，同时必须保存 A→B 的来源 / 推荐关系。**

当前规则区分两种分享上下文。

### 5.1 明确销售绑定链接

如果 A 分享 / 转发的是明确绑定销售 S 的分享上下文：

- A 转发张三绑定链接 → ownerless 新 B 归张三；
- A 转发李四绑定链接 → ownerless 新 B 归李四；
- S 在 B 进入时必须仍为 active + eligible；
- S 仅关闭 accepting 不影响主动分享获客。

### 5.2 客户 A 自己的分享上下文

如果 A 使用的是“A 自己的客户分享上下文”，没有额外明确销售绑定：

- A 是来源客户 / 推荐人；
- B 在有效进入时读取 **A 当时的 current owner**；
- B 归 A 当时的 current owner；
- 不永久锁死 A 最初销售或 A 发出链接时的历史 owner。

因此：

> **A 后来正式转交给新销售后，A 以前发出的客户分享链接仍然有效；以后通过该客户分享链进入的新客户，跟 A 当时的 current owner。**

---

## 6. 分享关系与销售归属必须同时保留

客户分享不能只保存“最终归哪个销售”。

每次客户分享形成可追溯的 share attribution context，产品层至少必须能够区分并追溯：

- `source_customer_id`；
- A→B 分享 / 推荐事件；
- 有效 sales binding 或 sales binding 的解析来源；
- B 最终形成的 current owner。

不得把以下事实压成一个字段：

- 来源客户 A；
- 实际承接销售；
- 当前 owner。

具体 share token、scene 参数、服务端 share context ID 等属于技术实现，不在 PDM-03 写死。

---

## 7. 已有 owner 客户不得被分享抢走

如果 B 已经存在正式 current owner：

1. 后续点击其他员工分享链接；
2. 后续收到其他客户分享；
3. 重复打开不同分享链接；

均不得改变 B 的 current owner。

系统可以新增：

- A→B 分享 / 推荐事件；
- 新来源触达事实；
- 分享上下文历史。

但不得：

- “最后分享者抢客”；
- 用新分享覆盖已有 owner；
- 反写原始来源。

---

## 8. 直接转介绍

明确的直接转介绍业务事件：

1. 保存推荐客户 / 推荐关系；
2. 新客户由推荐人在事件发生时的 `current owner` 承接；
3. 推荐人以后换 owner，只影响以后新发生的转介绍；
4. 不反向改写以前已经发生的推荐来源与归属历史。

V1 只认直接推荐关系：

- A→B：B 的直接推荐人是 A；
- B→C：C 的直接推荐人是 B；
- 不建立 A 对 C 的多级归属、返佣、奖励、积分或裂变等级体系。

---

## 9. 分享链销售失效后的兜底

如果分享链绑定的销售在新客户进入前已经：

- 离职；
- inactive；
- 失去业务资格；

则：

1. 分享链接仍然可以打开；
2. 历史来源、来源客户、分享关系继续保留；
3. 不得把新 Customer owner 分给失效销售；
4. 若存在明确且合法的接替人 → 新 Customer 归接替人；
5. 若没有明确接替人 → 进入当前合格接客池；
6. 若接客池异常为空 → 进入 `owner_assignment_pending`。

仅关闭 accepting、但员工仍 active + eligible 时，不触发上述失效兜底，主动分享获客继续有效。

---

## 10. 接客池与异常为空

### 10.1 正常接客

普通销售、经理、店长均可按 PDM-02 规则参与接客。

进入自然接客池必须满足：

- active；
- eligible；
- accepting。

4S 成员与 System Admin 不进入接客池。

### 10.2 关闭接客

员工关闭 accepting：

- 只影响未来自然轮询；
- 不自动转走已有客户；
- 不取消 active + eligible 员工的主动分享获客能力。

### 10.3 接客池异常为空

正常运营必须避免合格接客池为 0。

若因突发 inactive / 资格失效导致池被动为 0：

1. Customer 身份仍可建立；
2. 若没有其他有效优先归属来源，进入 `owner_assignment_pending`；
3. 不使用 System Admin 兜底成为销售 / owner；
4. 不使用 `responsible = null` 建立正式人工业务；
5. 不创建无负责人的正式人工服务对象；
6. 合格接客池恢复后自动重试 owner 分配；
7. 池空、待分配、恢复、补分均需告警 / 审计。

---

## 11. Owner 变化与业务负责人分层

Customer owner 与各具体业务对象负责人分层。

普通 Customer owner 变化：

> **不得自动把所有已固化业务负责人一起漂移。**

包括但不限于：

- Demand；
- Priority 相关业务关系；
- Consultation；
- Waitlist；
- Lock；
- Transaction。

确需调整具体业务负责人或业务关系时：

1. 对对应业务执行正式 reassignment / handoff；
2. 保留原负责人 / 原关系；
3. 保留新负责人 / 新关系；
4. 保留操作人与时间；
5. 不抹除历史。

Customer owner 变化本身不等于上述对象负责人已经完成迁移；具体对象是否需要转交、如何转交，继续服从对应 PDM 的当前 lifecycle 与 reassignment 规则。

---

## 12. Owner 正式移交与权限

1. 普通销售不得自行抢走他人客户。
2. Customer 可以提出更换负责销售，但客户提出只是正式 owner 移交的业务触发来源之一，不直接由客户端自行改写 owner。
3. 有权限且 data scope 覆盖目标客户的经理 / 店长可执行正式 owner 移交或冲突仲裁。
4. 普通 owner 移交至少必须保留：
   - 原 owner；
   - 新 owner；
   - 操作人；
   - 操作时间。
5. 普通 owner 移交默认不强制每次填写原因；若具体业务、风控或后续 PDM 对特定场景明确要求 reason，则服从该更具体规则。
6. 经理 / 店长作为交接处理人，不因此自动成为全部被交接客户的新 owner。
7. Customer 完整业务历史属于公司客户档案；新 owner 只在其当前合法 data scope 内查看必要历史。原销售以后是否仍可查看，取决于其当前 identity / permission / data scope，不因“历史上服务过”自动永久拥有访问权。

---

## 13. 离职 / inactive 交接

员工离职、inactive 或失去承责资格后：

1. 不得继续承接新的 Customer owner；
2. 当前客户 owner 必须合法交接；
3. 不能只交接 Customer owner；
4. 还必须同步检查并处理其当前负责的活跃客户业务与业务关系；
5. 至少检查 Demand、Priority、Consultation、Waitlist、Lock、Transaction 等适用对象；
6. Priority 是否继续、如何随当前客户业务关系承接以及 TTL / 可见性细节，已由 PDM-13 Final 冻结：Priority current responsible 跟随 trigger Demand 当前合法 responsible employee；离职 / inactive / 调店 / 降权 / 失去承责资格进入正式 Handover Batch；TTL 在交接期间继续自然运行，不暂停、不延长、不重置；没有合法 responsible employee 时不得新建车辆级 Priority；历史 creator / created_at / 原 responsible 不改写；
7. 当前责任需要合法交接；
8. 历史事实不得改写。

必须保留：

- 原始来源；
- 历史 owner；
- 历史业务负责人 / 历史业务关系；
- 原负责人 / 新负责人或原关系 / 新关系；
- 操作人；
- 操作时间；
- 交接原因；
- 历史操作；
- 历史贡献。

---

## 14. Handover Batch

离职 / inactive / 资格丧失交接必须形成可追溯 handover batch。

至少需要能够追溯：

- `handover_batch_id`；
- departed / invalid employee；
- departed / invalid time；
- 当时正式归属 Customer 清单；
- 相关活跃业务 / 业务关系清单；
- 每个受影响对象的原 owner / 原负责人 / 原关系；
- 目标新 owner / 新负责人 / 新关系；
- 操作人；
- 操作时间；
- 交接原因；
- 后续再次分配历史。

每个受影响对象都应具有明确映射结果；确认 / 提交时重新校验目标人员当前 active / eligible / permission / data scope / object state 等适用条件。

批量交接发生部分失败时：

- 已成功完成的映射不得为了失败项整体回滚；
- 未完成 / 校验失败项继续保持待处理；
- 后续重试只处理尚未闭环的对象；
- 不得因为批次部分失败而抹掉已完成交接事实或原批次来源。

后续 Customer 多次 owner 变化，不得抹掉最初离职交接批次来源。

---

## 15. 复职 / 从 inactive 恢复 active

员工重新入职或从 inactive 恢复 active：

- 复用原 `employee_id`；
- 按当前事实重新授权；
- 不自动拿回已经完成交接的旧 Customer；
- 不自动恢复离职 / inactive 前业务负责人身份；
- 不自动恢复旧 permission；
- 不自动恢复 accepting，恢复后接客默认 OFF，需按 PDM-02 当前规则重新开启；
- 旧登录态不得复活。

后续客户 / 业务归属按恢复后的合法当前 identity + permission + data scope + object state 重新形成。

---

## 16. 明确不得恢复的旧方向

以下旧方向不得重新进入当前基线：

1. 首次进入只建 customer_id、长期不形成 owner，直到首次人工服务才分配；
2. 最后点击哪个销售分享链接就把已有客户抢给谁；
3. 把原始来源、来源销售和 current owner 合成同一事实；
4. owner 变化后反写原始来源；
5. 老客户后续转介绍永久跟其历史 owner / 最初销售；
6. 关闭接客 / 短期休假后自动转走全部已有客户；
7. inactive / 离职员工继续承接新 Customer owner；
8. 普通销售自行抢走 / 修改其他销售客户 owner；
9. Customer owner 一变化就自动漂移所有具体业务负责人；
10. 多级客户归属、多级返佣、多级奖励、多级积分、多级裂变等级体系；
11. 普通客户车源分享永远只记 `SOURCE_ONLY`、绝不影响 owner；
12. 已有 owner 客户因后续分享被覆盖；
13. 历史 owner 覆盖客户当前正式 owner。

---

## 17. 与 PDM-01 / PDM-02 的跨域关系

### PDM-01

PDM-01 的以下规则继续有效：

- 稳定 `customer_id`；
- 自然注册无优先归属来源时立即形成 owner；
- Customer Merge V1 取消；
- 手机号变化不改变 owner / 来源 / 既有业务；
- Customer 账号停用 / 恢复不清空 `customer_id`、current owner、原始来源、转介绍关系或历史；恢复继续使用原 Customer，不重新制造第二套 owner 历史。

其中 PDM-01 原“普通客户侧车辆转发仅 `SOURCE_ONLY`”子句已被 P03-A15 显式修正：

> 客户车源分享对 ownerless 新客户可以形成转介绍 / 获客归属，同时保存 A→B 来源关系。

### PDM-02

PDM-02 的以下规则继续有效：

- 普通销售、经理、店长可参与接客；
- 进入自然接客池需 active + eligible + accepting；
- 4S 与 System Admin 不进入接客池；
- System Admin 可以治理接客配置，但不会因此成为 owner；
- 员工 inactive 后立即失去业务资格；
- 复职不自动恢复旧 Customer / 业务责任。

---

## 18. 跨域承接状态

### 18.1 已完成承接

1. PDM-01 已冻结 Customer 身份连续性与账号停用 / 恢复：停用不删除 current owner / 来源 / 历史，恢复继续原 Customer。
2. PDM-02 已冻结 employee lifecycle、accepting、inactive / 复职与 handover batch 的权限 / 数据范围边界；本 Final 已同步。
3. PDM-10 已冻结分享与价格权边界：
   - 普通分享不授价格查看权；
   - 收藏不授价格查看权；
   - 二次分享不得转移已有价格权；
   - 正式 Recommendation 才能授予对应 `customer + vehicle + listing_cycle` 的免费查价权；
   - Recommendation 权利本体与 lifecycle 已由 PDM-14 Final 正式承接；Recommendation 不改变 Customer owner，普通分享 owner 归属继续服从本 PDM。

### 18.2 仍待后续 PDM 承接

- Priority 的 TTL / 可见隔离 / 交接 lifecycle → PDM-13｜`HANDOFF_CLOSED`：PDM-13 Final §§15-17,24-26 已正式承接；Priority 不直接授 Customer visibility，current responsible 跟随 trigger Demand，责任失效进入 Handover Batch，TTL 继续自然运行且不因交接重置。
- Recommendation 生命周期、正式推荐关系、hidden 单车可见授权 → PDM-14｜`HANDOFF_CLOSED`：PDM-14 Final 已冻结 Recommendation/普通分享分离、ownerless 分享归属继续服从 PDM-03、已有 owner 不被抢、hidden Vehicle 需 Recommendation + customer-specific visibility；`HO-P03-P14-001 = HANDOFF_CLOSED / source_backwrite=YES`。
- Consultation 完整负责人 / 转派 / SLA → PDM-15｜`HANDOFF_CLOSED`：PDM-15 Final 已冻结 Customer owner 与 Consultation assignee 分层、owner 变化不自动漂移 assignee、owner_assignment_pending / 公海创建顺序、正式 handover、15 分钟 SLA 与首次真实人工响应；`HO-P03-P15-001 = HANDOFF_CLOSED / source_backwrite=YES`。
- CRM 跟进、画像、阶段、Source Radar 与公司客户历史的具体页面 / 字段访问投影 → PDM-16；不得把“历史服务过”解释成永久访问权。
- 公海 / 待公海处理 / 后台分配 / 领取 / Collaboration → PDM-17；不得通过分享链接绕过已有 owner / 公海的正式治理规则。
- Waitlist / Lock 负责人状态机 → PDM-18。
- Transaction / Refund 负责人状态机 → PDM-19。
- 客户端分享入口、分享页、直接转介绍 / 推荐朋友入口、交互和视觉 → PDM-20。
- 员工端分享入口与交互 → PDM-21。
- 审计字段统一标准 → PDM-25。

### 18.3 IA / Low-Fi stale carrier 处理

当前发现但本轮不修改的旧承载至少包括：

- “首次进入建立 Customer 但暂不形成 owner”的旧首入投影；
- 客户侧分享被固化成永远 `SOURCE_ONLY` 的旧状态 / Guard；
- C03-07 等页面直接转介绍 / 推荐朋友真人入口不足；
- P04-06 / P04-07 等离职交接页仍大量使用通用壳，未完整表现受影响对象、新负责人映射、部分失败与继续处理。

以上统一登记：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

IA / Low-Fi 不具有反向覆盖当前 PDM Final 的产品 Authority。

后续 PDM 不得静默推翻本 PDM 已确认的 owner、来源、分享归属和交接边界；发现真实冲突必须重新提交用户显式裁决。

---

## 19. 四批门禁与最终批准状态

- Batch 1｜稳定一致项：`COMPLETE_USER_CONFIRMED`
- Batch 2｜明确废弃 / 替代：`COMPLETE_USER_CONFIRMED`
- Batch 3｜明确知情修改 / 新增：`COMPLETE_USER_CONFIRMED`
- Batch 4｜冲突 / 遗漏 / 缺口 / 新选择：`COMPLETE_USER_CONFIRMED`
- Final Domain Overview：`USER_APPROVED`
- PDM-03：`COMPLETE`
- 2026-10-05 Legacy Final Integrity Audit：`INTEGRITY_PASS`
- Missing Rule unresolved：`0`
- Semantic Detail Gap unresolved：`0`
- Cross-PDM Conflict：`0`
- Handoff Gap unresolved：`0`
- Implementation Ready：`PASS`

2026-09-24 用户最终明确批准本总览；2026-10-05 用户对本轮 9 组 Legacy Integrity 修正全部同意并确认执行。

PDM-03 历史 COMPLETE 保留；2026-10-05 已通过当前 Legacy Final Integrity Audit。PDM-01～10 本轮复核的下一域为 PDM-04。
