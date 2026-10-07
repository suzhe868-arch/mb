> **HISTORICAL_AUDIT_TRAIL｜历史执行记录**  
> 本文件记录当时阶段性审查 / 待批准 / 覆盖检查 / 切窗状态。文中的“当前 / 下一步 / PENDING / BLOCKED / Startup Gate / Batch”等阶段表述均只代表当时，不是仓库当前状态。  
> 当前状态与唯一下一步以根目录 `README.md`、`CURRENT_PROJECT_STATE.md`、`NEXT_ACTION.md`、`PROJECT_STATE.json` 为准；不得据本文件恢复旧阶段指针或覆盖正式 Final。

# PDM-03｜Owner / 来源归因 / 分享注册 / 转介绍 / 接客 / 离职交接｜最终完整规则总览｜待用户批准

> 日期：2026-09-24  
> 状态：`FINAL_REVIEW_PENDING`  
> 说明：本文件汇总 PDM-03 Batch 1～4 经用户逐批裁决后的**当前有效候选规则**。只有用户再次明确批准本总览后，PDM-03 才可标记为 `COMPLETE`。  
> 本文件不修改 IA / Low-Fi / Engineering。

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
- Consultation；
- Waitlist；
- Lock；
- Transaction。

确需调整具体业务负责人时：

1. 对对应业务执行正式 reassignment；
2. 保留原负责人；
3. 保留新负责人；
4. 保留操作人与时间；
5. 不抹除历史。

---

## 12. Owner 正式移交与权限

1. 普通销售不得自行抢走他人客户。
2. 有权限且 data scope 覆盖目标客户的经理 / 店长可执行正式 owner 移交或冲突仲裁。
3. 具体动作必须保留：
   - 原 owner；
   - 新 owner；
   - 操作人；
   - 操作时间；
   - 必要审计事实。
4. 经理 / 店长作为交接处理人，不因此自动成为全部被交接客户的新 owner。

---

## 13. 离职 / inactive 交接

员工离职、inactive 或失去承责资格后：

1. 不得继续承接新的 Customer owner；
2. 当前客户 owner 必须合法交接；
3. 不能只交接 Customer owner；
4. 还必须同步检查并处理其当前负责的活跃客户业务；
5. 当前责任需要交接；
6. 历史事实不得改写。

必须保留：

- 原始来源；
- 历史 owner；
- 历史业务负责人；
- 历史操作；
- 历史贡献。

---

## 14. Handover Batch

离职交接必须形成可追溯 handover batch。

至少需要能够追溯：

- departed employee；
- departed time；
- 离职当时正式归属 Customer 清单；
- 相关活跃业务的交接事实；
- 后续新 owner / 新负责人；
- 再次分配历史。

后续 Customer 多次 owner 变化，不得抹掉最初离职交接批次来源。

---

## 15. 复职

员工重新入职：

- 复用原 `employee_id`；
- 不自动拿回离职前 Customer；
- 不自动恢复离职前业务负责人身份；
- 不自动恢复旧 permission；
- 不自动恢复 accepting。

后续客户 / 业务归属按重新入职后的合法当前规则形成。

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
- 手机号变化不改变 owner / 来源 / 既有业务。

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

## 18. 跨域留待后续 PDM

以下不在 PDM-03 提前写死：

- Priority 的 TTL / 可见隔离 / 交接影响 → PDM-13；
- Recommendation 与正式推荐关系 → PDM-14；
- 分享后的单车授权 / hidden 车辆可见性 → PDM-14；
- 分享是否授予查价权限 → PDM-10 / PDM-14；
- Consultation 完整负责人 / 转派 / SLA → PDM-15；
- CRM 跟进、画像、阶段、Source Radar → PDM-16；
- 公海 / 待公海处理 / 领取 / Collaboration → PDM-17；
- Waitlist / Lock 负责人状态机 → PDM-18；
- Transaction / Refund 负责人状态机 → PDM-19；
- 客户端分享入口、分享页、交互和视觉 → PDM-20；
- 员工端分享入口与交互 → PDM-21；
- 审计字段统一标准 → PDM-25。

后续 PDM 不得静默推翻本 PDM 已确认的 owner、来源、分享归属和交接边界；发现真实冲突必须重新提交用户显式裁决。

---

## 19. 四批门禁状态

- Batch 1｜稳定一致项：`COMPLETE_USER_CONFIRMED`
- Batch 2｜明确废弃 / 替代：`COMPLETE_USER_CONFIRMED`
- Batch 3｜明确知情修改 / 新增：`COMPLETE_USER_CONFIRMED`
- Batch 4｜冲突 / 遗漏 / 缺口 / 新选择：`COMPLETE_USER_CONFIRMED`

当前仅剩：

> **最终完整规则总览用户批准门禁**

用户批准前：

- PDM-03 不标记 `COMPLETE`；
- 不进入 PDM-04；
- 不修改 IA / Low-Fi；
- 不执行 Engineering Delta。
