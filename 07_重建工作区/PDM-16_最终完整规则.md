# PDM-16｜CRM / 客户画像 / 阶段 / 跟进 / 标签 / Customer Opportunity / Source Radar｜最终完整规则

> 域：CRM / 客户画像 / 阶段 / 跟进 / 标签 / Customer Opportunity / Source Radar  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> 本文件为 PDM-16 当前正式中文产品 Authority。用户已于 2026-10-06 最终批准并确认执行。

## 1. 核心定位

PDM-16 的职责是：

> **客户经营资料与统一跟进层。**

它负责：

- Customer Profile；
- Personal Note；
- Shared Profile；
- 员工内部客户称呼 / 服务称呼历史；
- CRM Stage；
- Customer Tags；
- CRM Follow-up；
- CRM 待办 / 回访 / 未来跟进责任；
- CRM Customer list / detail；
- Customer Opportunity；
- Source Radar。

它不重新创造：

- Customer 身份；
- Demand；
- Consultation；
- Recommendation；
- Lock / Waitlist；
- Transaction；
- Matching。

这些对象的真实状态机继续由各自 PDM Authority 负责。

## 2. CRM Stage

1. CRM Stage 是 Customer 的总体经营阶段，不属于某个销售个人。
2. 它与 Consultation / Demand / Lock / Transaction 等具体业务状态严格分离。
3. owner 变化、进入公海、重新领取不自动重置 CRM Stage。
4. “已成交”不永久锁死未来 CRM Stage。
5. 当前 owner 可在合法权限下维护本人 Customer 的 CRM Stage。
6. 经理 / 店长只有在具备对应 permission/capability 且 data scope 覆盖时才可调整。
7. Collaboration 身份本身不自动授予主阶段修改权。
8. 每次 mutation 都必须重新校验 identity + permission/capability + data scope + object/account state。
9. CRM Stage 采用**公司级受控可配置字典**：
   - 可新增；
   - 改名；
   - 排序；
   - 启用；
   - 停用；
   - 已被历史 Customer 使用的阶段不得普通物理删除；
   - 停用不改写历史事实。
10. 销售不得自由文本冒充正式 Stage。
11. Consultation / Demand / Lock / Transaction 等业务事件默认**不自动改写 CRM Stage**；可以提供上下文 / 建议，但真正修改由合法 actor 显式提交。
12. “暂不联系 / 暂无意向”只属于 CRM Stage / Tag / 服务判断：
   - 不自动清 owner；
   - 不自动进公海；
   - 不自动结束 Customer；
   - 不自动取消其他业务对象；
   - 后续新真实需求出现时可正常更新。

## 3. Customer Tags

1. Customer Tags 是 Customer 的共享经营事实。
2. owner 变化、进入公海、重新领取不自动清空 Tags。
3. Customer Tags 采用：
   > **公司级受控 Tag 字典 + Customer 多选**
4. Tag 可新增、改名 / 排序、启用、停用。
5. 已进入历史的 Tag 不普通物理删除。
6. Tag 停用不抹掉历史 Customer Tag 事实。
7. “重点客户”等作为普通共享 Tag，不建立第二套重点客户状态机。
8. 销售个人自由文本不得冒充共享 Tag，应进入 Personal Note / 服务称呼等对应区域。

## 4. Personal Note / Shared Profile / 服务称呼

### Personal Note

- 作者私有；
- owner 变化不转移；
- 新 owner 不继承前 owner Personal Note；
- 授权管理查看仍服从当前权限；
- 不得泄露给 Shared Profile。

### Shared Profile

- 属于公司共享客户画像；
- current owner、明确 Collaboration scope 内协作者、授权经理 / 店长可按当前权限维护；
- 修改必须记录 before / after；
- 不得混入 Personal Note。

### 员工内部客户称呼 / 服务称呼

- 与客户本人昵称分离；
- 与 Personal Note / Shared Profile 分离；
- 不同员工称呼不互相覆盖；
- 保留 author、时间、来源和修改历史；
- 正式交接后新的合法服务者可看到公司服务历史中的称呼并新增自己的称呼；
- 客户本人不可见；
- 原作者失去当前 CRM 权限后，不因历史称呼继续拥有 Customer 访问权。

不恢复历史“大字段 CRM 画像模型”。

## 5. CRM Follow-up

1. 所有历史 Follow-up 长期保留。
2. owner 变化 / 进公海 / 重新领取不得删除或重置。
3. 每条至少包含：
   - customer_id；
   - actor；
   - occurred_at / created_at；
   - content；
   - 可选 business type / business id；
   - 必要 source/context。
4. Follow-up 是 append-only：
   - 不物理删除；
   - 不直接覆盖；
   - 错误通过补充更正、作废 / 无效表达；
   - 原始内容 / actor / 时间保留。
5. Demand Follow-up 使用统一 CRM Follow-up 并关联 demand_id，不建立第二套 Demand 跟进表。
6. Consultation 的真实服务动作可进入统一 CRM history，但不复制 Consultation 状态机。
7. 普通 CRM Follow-up 不自动算 Consultation first-response SLA；只有满足 PDM-15 的可审计真实人工服务动作才可完成 first response。
8. CRM Follow-up 不反向改 Demand / Consultation / Recommendation / Lock / Transaction 主状态。

## 6. CRM 待办 / 回访 / 未来跟进责任

1. CRM Follow-up = 已发生的服务历史。
2. CRM 待办 / 回访提醒 / 未来跟进计划 = 尚未完成的未来责任。
3. 两类事实不得混为一体。
4. 未完成责任必须有当前合法负责人。
5. owner 正式变化时：
   - 可随 Customer 交接给新 owner；
   - 或由有权限管理人员重新指定合法 active + eligible + scope 覆盖的负责人。
6. 原负责人 inactive / 离职 / 失去 scope 时，不得继续悬挂。
7. 已完成历史待办不改写。
8. 进入公海前的完成 / 取消 / 交接治理交 PDM-17。

## 7. CRM Customer List

搜索至少支持：

- 姓名 / 昵称；
- Customer Address；
- 内部客户称呼 / 合法内部备注；
- 手机号；
- 找车车型 / Demand 相关关键词。

手机号搜索继承 PDM-01：

- 主要手机号；
- 其他已登记手机号；
- 同号命中多个 Customer 时返回多个，不自动 Merge。

筛选可包含：

- Customer Level；
- Tags；
- active Demand；
- pending Application；
- Lock / Waitlist；
- Transaction；
- 跟进状态；
- 最近活跃；
- current owner。

经理 / 店长在合法 scope 内可切：

- 我的客户；
- 团队客户。

Customer 卡片主要显示：

- 身份摘要；
- Customer Address / internal note 必要摘要；
- Level；
- 核心 Tags；
- 当前核心业务状态；
- 最近跟进；
- 下次跟进；
- 团队视角 owner。

列表卡片不堆叠大量跨域 mutation。

## 8. CRM Customer Detail

保持六区块：

1. 基础资料；
2. 当前业务；
3. 快捷操作；
4. 跟进时间线；
5. 历史业务；
6. 最近行为 / 兴趣。

允许聚合展示：

- Level；
- find-car entitlement；
- pending Application；
- active / paused / completed / cancelled Demand；
- Consultation；
- Recommendation；
- Lock / Waitlist；
- Transaction / Refund；
- owner；
- Tags；
- recent Follow-up。

CRM 只消费真实业务事实，不复制或反向修改对应状态机。

快捷操作可包含：

- 记录跟进；
- 找车服务；
- 推荐车辆。

**不得恢复：**

> CRM Customer Detail → 锁车 → 再选 Vehicle

Lock 必须在合法 Customer + Vehicle 上下文进入 PDM-18。

## 9. CRM Access / Privacy

当前完整 CRM 访问按：

> identity + permission/capability + data scope + current owner / valid Collaboration / manager scope + object/account state

计算。

规则：

- 历史服务过不等于永久访问；
- 正式移交后原 owner 默认失去当前完整 CRM 访问；
- 当前合法 Collaboration / manager scope 才可能继续访问；
- 4S Member 不进入完整名邦 CRM；
- System Admin 身份本身不自动获得员工 CRM 业务访问权；
- Customer 历史属于公司，但当前访问权不是历史永久属性。

最近行为 / 兴趣只展示最小必要聚合：

- 收藏数量；
- 聚合品牌 / 车系兴趣；
- 业务机会摘要；
- 必要活跃概览。

默认不开放：

- 每一次点击；
- 完整浏览流水；
- 完整收藏明细；
- 员工可见的行为监控轨迹。

## 10. Customer Opportunity

Customer Opportunity 是：

> **聚合 deterministic interest / opportunity signal**

不是：

- Consultation；
- 独立 task；
- 独立业务对象；
- 独立 assignee；
- SLA 对象。

因此不建立：

- pending / processing / closed 复杂 lifecycle；
- 独立 owner；
- 关闭机会主状态；
- SLA；
- 逐条自动飞书。

规则：

1. 匿名访客不生成具名 Opportunity。
2. heartbeat / token refresh / 后台轮询 / 员工代操作不算客户主动兴趣。
3. 相同 / 等价信号可去重 / 冷却。
4. 条件不再命中时，从当前 Opportunity 自然消失。
5. V1 不做 AI 意向评分。
6. 旧 7 天无活动 / 单日 >40 / 连续 3 天等阈值及对应控件：
   > **DO_NOT_RESTORE**
7. V1 **不建设通用 Opportunity 规则引擎**。
8. 只有未来经明确产品批准的 deterministic signal producer 才可形成 Opportunity；没有合法 signal producer 时允许真实空态。
9. P06-07 不得因页面名“客户机会规则”自行恢复 CRUD / config。

## 11. Source Radar

Source Radar：

> 以 active Demand / 当前服务上下文为中心，消费 PDM-12 Matching change fact。

不得：

- 重建 parser；
- 重建 Rule Dictionary；
- 重建 Matching Engine；
- 反向覆盖 PDM-12 Match Result。

Radar Event 至少保留：

- source Demand / Customer context；
- Vehicle；
- trigger type；
- 当前 Match Result / explanation 引用；
- created_at / latest change time；
- 当前是否仍有效。

员工可：

- 查看 Radar Event / 匹配详情；
- 从合法上下文进入正式 Recommendation；
- 标记“本次 Radar 不适合 / 忽略”。

“标记不适合”规则：

1. 不改变 PDM-12 Match Result；
2. 不修改 Rule Dictionary；
3. 不改 Demand 条件；
4. 抑制当前 Demand × Vehicle 的当前有效匹配事实，避免重复刷屏；
5. Vehicle / Demand / 价格 / Rule Dictionary / Match tier or explanation / listing_cycle 等合法 Matching 输入发生实质变化后，可生成新的 Radar Event；
6. 历史人工处理保留；
7. 不形成永久黑名单；
8. 不自动创建 Recommendation / Priority / Lock。

## 12. Opportunity / Radar / 强待办三类分离

- Customer Opportunity = 聚合兴趣 / 机会信号；
- Source Radar = Demand-centered Matching change discovery；
- 强待办 = 明确服务责任 / 时间敏感工作项。

三者不得合并成一个 task/state system。

PDM-16 只冻结对象语义和数据边界；员工工作台排序、卡片、入口和强待办优先级交 PDM-21。

## 13. CRM 核心审计

至少要求：

### CRM Stage
- before；
- after；
- actor；
- changed_at；
- 必要 source/context。

### Important Customer Tag
- 新增 / 移除 / 替换的 before/after 或等价可追溯变化事实；
- actor；
- changed_at。

### Shared Profile
- before / after。

### 服务称呼
- author；
- time；
- source；
- 修改历史；
- 不覆盖旧事实。

### Follow-up
- append-only；
- correction / invalidation 不抹除原历史。

普通日常非核心字段不因此一律升级为重型审计。

## 14. 明确废弃 / 不得恢复

1. Customer Merge / MERGE_*；
2. CRM 直接锁车旧入口；
3. 旧 7d / 40 / 3d Opportunity 阈值；
4. 大字段 CRM 画像；
5. 历史服务永久 CRM 访问；
6. P06-07 假 CRUD / config；
7. Opportunity 独立工单 / assignee / SLA / close lifecycle；
8. Opportunity / Radar / 强待办合并；
9. Radar“不适合”反写 Matching；
10. 具体业务对象自动改 CRM Stage；
11. 逐点击行为监控；
12. 第二套 Demand / Consultation / Matching 状态机。

## 15. Cross-PDM Handoff

### Incoming｜Final closeout 前保持 HANDOFF_ACCEPTED

- HO-P01-P16-001；
- HO-P02-P16-001；
- HO-P03-P16-001；
- HO-P11-P16-001；
- HO-P12-P16-001；
- HO-P15-P16-001。

### Outgoing｜保持 HANDOFF_OPEN

- HO-P16-P17-001｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-17 Final 已承接公海/待公海治理，并把 CRM 未完成待办、回访提醒、未来跟进计划等作为正式进入公海前必须完成/取消/交接的保护责任；
- HO-P16-P21-001｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-21 Final 已正式承接员工 CRM list/detail/follow-up、Opportunity、Source Radar、my/team customers 与强待办语义分离；
- HO-P16-P22-001｜Stage / Tag 配置与 Opportunity 配置边界；
- HO-P16-P23-001｜CRM 提醒 / 通知边界；
- HO-P16-P25-001｜CRM 审计 / 历史 / 横切。

## 16. Final 前完整性结论

Final 前 R2：

- `SOURCE_TO_ATOM = PASS`
- `ATOM_TO_SOURCE = PASS`
- `SEMANTIC_COMPLETENESS = PASS`
- `MISSING_RULE_UNRESOLVED = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `OUTGOING_HANDOFF_GAP = 0`
- `PDM16_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM16_FINAL_CANDIDATE_READY = YES`

## 17. Final Closeout

用户已最终批准并确认执行。

- 正式 Authority：`07_重建工作区/PDM-16_最终完整规则.md`；
- Final 前完整性复核 R2：`PASS / FINAL_CANDIDATE_READY`；
- 6 条 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- 1 条 outgoing（PDM-17）已 `HANDOFF_CLOSED / source_backwrite=YES`；其余 4 条继续 `HANDOFF_OPEN`；
- PDM-16：`COMPLETE / INTEGRITY_PASS`；
- 下一步：`PDM-17 Startup Gate`；
- IA / Low-Fi / Engineering 继续禁止提前施工。
