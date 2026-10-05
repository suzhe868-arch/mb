# PDM-01｜客户身份 / 微信 / 手机号 / 资料 / 客户生命周期｜最终完整规则

> 日期：2026-09-24  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> 说明：PDM-01 四批用户审查及最终总览均已于 2026-09-24 获用户明确批准；2026-10-04 按新标准完成 Legacy Final Integrity Audit。本文为 PDM-01 当前正式规则基线；已同步 PDM-02 / PDM-03 后续闭环规则，并纳入 2026-10-04 用户确认的轻量客户账号停用 / 恢复规则。

---

## 1. Customer 身份主键

1. Customer 使用稳定的 `customer_id` 作为业务主身份。
2. 微信身份用于识别 / 创建 / 找到对应 Customer。
3. 手机号、头像、昵称都不是 Customer 唯一身份主键。
4. 同一 Customer 后续再次购车、找车、咨询等，只在原 Customer 下新建新的业务对象，不因新一轮业务创建新的 Customer。
5. 不建设显式独立登录页，也不建设独立传统账号密码登录体系；首次进入直接按“微信身份识别 → 创建 / 找到 `customer_id` → 客户端首页”完成身份进入。

---

## 2. 首次进入与 owner

1. 首次进入：微信身份识别 → 创建 / 找到 `customer_id` → 进入客户端。
2. 首次进入不要求先填写手机号、头像、昵称，不得阻断普通浏览。
3. 微信身份识别失败时允许重试。
4. 当前主动新规则：
   - 无有效销售分享、直接转介绍等优先归属来源时，新 Customer 建立 / 识别 `customer_id` 后，在接客池正常可用时立即进入 active + eligible + accepting 接客池自动轮询，形成唯一 `current owner`；
   - 若因突发 inactive / 资格失效等异常导致接客池被动为 0，且没有其他有效优先归属来源，则 Customer 身份仍可建立，但进入 `owner_assignment_pending`；不得创建 `responsible = null` 的正式人工业务对象，不得使用 System Admin 临时兜底成为 owner；接客池恢复后自动重试 owner 分配，并记录池空、待分配、恢复、补分的告警 / 审计；
   - 有效直接转介绍优先于普通自然轮询，由推荐人在事件发生时的 `current owner` 承接；
   - **2026-09-24 PDM-03 用户主动修正：客户侧车源分享不再是纯 `SOURCE_ONLY`。对尚无正式 owner 的新 Customer，分享链可直接形成转介绍/获客归属：新客户按该分享链实际绑定的销售形成 `current owner`，并保留来源客户/推荐关系；已有正式 owner 的老客户仍不得因后续分享被抢客。**
5. “首次进入只建 customer_id、不形成 owner”的旧规则已被 2026-09-24 用户主动修改覆盖，不得恢复。

---

## 3. 手机号作为人工服务门槛

1. 手机号是现实人工联系方式，也是人工服务动作的硬门槛，但不是普通浏览 / 收藏门槛。
2. 普通浏览、搜索、查看详情、收藏等不要求手机号。
3. 客户执行需要人工服务的动作且当前没有可用手机号时，触发微信小程序手机号授权流程。
4. 授权成功：
   - 保存有效手机号；
   - 自动继续客户刚才的原业务动作；
   - 客户不需要再次点击提交。
5. 拒绝 / 取消授权：
   - 不创建对应正式人工服务对象；
   - 当前成品交互只保留“授权手机号 / 取消”；
   - `success resume` 是系统自动行为，不是第三个按钮。
6. 找车表单的特殊保真规则：客户已经在当前页面填写找车内容、提交时因缺手机号触发手机号授权，如果客户拒绝 / 取消授权，则不创建正式找车申请、不通知员工、不创建人工服务对象；当前页面已填写内容允许临时保留，便于继续修改或再次提交，但这不是服务端正式草稿，也不承诺页面销毁、小程序关闭、刷新或长时间离开后仍可恢复。

---

## 4. 多手机号与手机号身份连续性

1. 一个 Customer 支持：
   - 1 个主要手机号；
   - 0～多个其他联系电话。
2. 首次需要手机号时，通过微信小程序官方手机号能力完成有效绑定。
3. 后续其他联系电话维护已由 PDM-02 收口为独立 capability：`customer.phone.manage`。
4. `customer.phone.manage` 当前边界：
   - active 名邦员工只有同时具备该 capability，且 Customer 位于其 data scope，才能新增、修改、失效“其他联系电话”；
   - 4S 成员 hard DENY；
   - 全部变更必须审计；
   - 该 capability 不默认允许直接修改客户主要手机号；主要手机号更换继续遵守本 PDM 的客户正式授权 / 绑定与身份连续性规则。
5. 主要手机号更换、其他联系电话新增 / 修改 / 失效，都继续使用原 `customer_id`。
6. 手机号变化不得改变：
   - current owner；
   - 原始来源 / 转介绍来源；
   - Demand；
   - Consultation；
   - Lock；
   - Transaction；
   - 查价权益及其他既有业务关系。
7. 手机号新增、修改、删除 / 失效必须保留必要历史与审计。
8. 换手机号不得新建 Customer。

---

## 5. CRM 按手机号搜索

1. CRM 客户搜索支持手机号。
2. 主要手机号和全部其他已登记联系电话都参与手机号搜索。
3. 输入任一已登记号码，应可找到对应 Customer。
4. 同一手机号可以登记在多个不同 Customer 下。
5. 同号命中多个 Customer 时：
   - 返回全部匹配 Customer；
   - 不自动认定为同一自然人；
   - 不自动 Merge；
   - 不改变 owner；
   - 不迁移历史、权益或业务对象。

---

## 6. Customer Merge / 账号合并

V1 **完全取消 Customer Merge**。

1. 不提供自动 Merge。
2. 不提供人工 Merge。
3. 不提供手机号合并账号。
4. 不提供确认同一自然人后的账号合并。
5. 不同微信身份形成的不同 `customer_id` 始终保持独立 Customer，即使现实中确认属于同一自然人。
6. 两个 Customer 不互相迁移 / 合并：
   - owner；
   - 来源；
   - 客户等级；
   - Recommendation；
   - 查价次数 / 权益；
   - Demand；
   - Consultation；
   - Lock；
   - Transaction；
   - 其他业务对象。
7. 用户已明确接受同一自然人使用多个微信账号时，各 Customer 权益和业务关系分别计算的结果。
8. 因此原 A10 Merge 历史迁移、A11 Merge Guard、A12 surviving customer_id / 冲突处理全部不再适用。

---

## 7. 头像与客户昵称 / 称呼

1. 头像和客户昵称 / 称呼属于客户个人资料，不是身份主键，也不是人工服务硬门槛。
2. 客户可以：
   - 主动选择微信当前允许的头像能力；
   - 自主选择 / 上传头像；
   - 使用微信昵称快捷填写能力；
   - 自己输入或修改客户昵称 / 称呼。
3. 业务数据模型使用“客户昵称 / 称呼”语义，不永久绑定某个微信平台字段。
4. 微信头像 / 昵称能力必须是客户主动选择 / 填写，不得理解为后台静默读取。
5. 头像 / 昵称未完善时，客户仍可正常浏览、搜索、查看详情、收藏及执行人工服务动作。
6. 跳过、拒绝、关闭资料完善提示，不得阻断业务。
7. 客户可以在个人资料中后续修改头像和客户昵称 / 称呼。
8. 用户自主提交的头像 / 昵称应按微信平台当前适用的内容安全能力进行校验；校验失败不得作为正式资料保存 / 展示。

---

## 8. 头像 / 昵称提醒频控

当前有效规则：

1. 收藏成功后，如头像 / 昵称未完善，可提醒一次。
2. 持续浏览场景最多每 20 分钟主动提醒一次。
3. 每个客户每日最多 10 次主动提醒。
4. 多个触发条件同时发生时合并为一次提示。
5. Lock、Transaction、找车提交等关键业务执行中，不得被资料完善提示打断。
6. 两者均完善后停止提醒。
7. 旧“每天最多一次 / 第 5、10 台 / 30 分钟冷却 / 每天最多 4 次”等频控规则已废弃，不得恢复。

---

## 9. 个人资料 / 我的顾问

客户个人资料至少包含：

- 头像；
- 客户昵称 / 称呼；
- 手机号；
- 我的顾问。

规则：

1. 无当前顾问时显示“暂无服务顾问”。
2. 打开个人资料页本身不得改变 owner。
3. 客户可在个人资料中主动维护头像 / 昵称。
4. 手机号展示和手机号维护遵守本 PDM 的多手机号 / 身份连续性规则。

---

## 10. 员工内部客户称呼 / 备注名｜交叉边界

CN11 原始规则已存在以下能力，本 PDM 只登记身份边界；统一 permission / data scope 权限模型已由 PDM-02 当前 Final 承接，具体 CRM 备注业务与页面承载继续移交 PDM-16：

1. 客户本人昵称 / 称呼与员工内部客户称呼 / 备注名必须分离。
2. 有权限员工可维护内部客户称呼 / 备注名。
3. 不同员工的备注不得互相覆盖。
4. 应保留备注人、时间和修改历史。
5. owner 交接后，历史客户称呼备注应向新的合法服务人员可见，以延续服务经验。
6. 新 owner 可以新增自己的称呼，但不得覆盖 / 删除旧备注历史。
7. 客户本人看不到员工内部客户称呼备注。
8. 客户称呼备注不得替代 CRM 跟进、客户画像或 Demand 说明。

---

## 11. 客户账号停用 / 恢复｜轻量后台控制

V1 保留轻量后台控制，不建设复杂的客户注销 / 账号删除状态机。

1. 客户不需要自助“停用账号”入口；客户不想继续使用时，不登录即可。
2. 后台可对 Customer 执行“停用 / 恢复”，该动作属于独立受控 capability：`customer.account.disable`。
3. 权限边界：
   - 该 capability 继承 PDM-02 的统一权限模型：角色模板默认权限 + 员工个人明确 allow / deny + data scope + object state；
   - System Admin 可直接执行 Customer 账号停用 / 恢复；该动作定义为控制平面治理动作，不因此获得销售、CRM、owner、Lock、Transaction 等客户业务执行能力；
   - 经理 / 店长等 active 名邦员工只有同时具备 `customer.account.disable` 且 Customer 位于其 data scope，才能执行；普通销售默认关闭但可按需要明确授权；
   - 4S 成员 hard DENY；
   - 该规则不改变 PDM-02“默认 permission 不在产品基线硬编码”的原则。
4. 停用后的客户仍允许打开网站 / 小程序并浏览公开内容，但暂停依赖该 Customer 身份或客户权益的业务账号能力，包括但不限于收藏、咨询、找车、锁车 / 候补、查价及客户等级权益使用。
5. 停用不是业务对象删除 / 完成 / 取消动作，但**账号停用后，仍在运行的客户业务不得继续按“账号正常”状态推进**：
   - 不物理删除 Customer；
   - 不清空 `customer_id`、current owner、原始来源、转介绍关系及历史；
   - 对仍在进行中的客户业务，停用后必须停止继续运行；具体表现可由各业务域定义为暂停、冻结、禁止新动作或保留当前现实事实，但不得仅因为账号停用就把真实业务直接改成 completed / cancelled 或物理删除；
   - Demand 已由 PDM-11 当前用户裁决明确：`active → paused`；原本 `paused` 保持 paused；`completed / cancelled` 不改写；账号恢复后也不得自动恢复 active，必须通过正式“恢复”动作；
   - Consultation、Recommendation、Lock / Waitlist、Transaction / Refund 等对象的具体停用效果继续由各自 PDM 冻结；其中已经发生的推荐、锁定、交易、资金与审计事实不得因账号停用被抹除或伪造为未发生；
   - owner 后续失效时仍按 PDM-03 的交接规则处理。
6. 停用本身不自动降客户等级，也不强制删除尚未自然失效的既有权益事实；但账号停用期间，这些依赖 Customer 身份 / 权益的业务能力暂停使用。若业务目的只是调整客户等级，应使用既有“客户等级调整”机制，而不是停用账号。
7. 恢复后继续使用原 `customer_id`，保留停用前全部历史；恢复只重新开放账号可用性，**不得自动恢复各业务对象的运行状态**。已经终止、过期、周期结束的对象或权益不得复活；处于暂停 / 冻结的对象是否恢复、如何恢复，由对应业务域的正式动作决定。
8. 停用 / 恢复必须记录操作人、时间、原因、变更前后状态等审计信息。

---

## 12. 明确废弃 / 被后续覆盖的旧规则

以下规则不得恢复：

1. 手机号作为 Customer 唯一身份主键；
2. 首次进入必须先完善手机号 / 头像 / 昵称；
3. 头像 / 昵称未完善禁止浏览或人工服务；
4. 首次进入只建立 customer_id、完全不形成 owner；
5. 同手机号自动认定同一 Customer；
6. 同手机号自动 Merge；
7. 确认同一自然人后允许人工 Customer Merge；
8. Merge 后 surviving customer_id / owner / 权益 / 业务迁移体系；
9. 换手机号新建 Customer；
10. 旧头像昵称提醒频控；
11. 客户停用 / 注销即物理删除业务历史；
12. 恢复客户时新建一套历史；
13. 停用恢复时自动复活已经终止 / 过期的业务对象或权益；
14. 恢复“客户自助停用账号 + 未结束业务必须先全部完成 / 取消才允许停用”的旧复杂状态机；
15. 把停用等同于降级，或把客户等级调整等同于账号停用；
16. Customer 已停用后，仍让 active Demand 或其他持续服务像账号正常一样继续自动运行。

---

## 13. 跨域承接状态

已经闭环的跨域事项：

1. 手机号“其他联系电话”维护权限已由 PDM-02 冻结为 `customer.phone.manage + data scope`；4S hard DENY，主要手机号不因此开放直接修改。
2. owner、分享 / 转介绍、接客池、离职交接已由 PDM-03 冻结；PDM-01 原“普通客户侧车辆转发仅 SOURCE_ONLY”已经被 PDM-03 显式覆盖，不得恢复。
3. 接客池异常为空时的 `owner_assignment_pending` 规则已经由 PDM-02 / PDM-03 承接，并已同步回本 Final。
4. 客户账号停用 / 恢复 capability 继承 PDM-02 统一 permission / data scope / hard DENY 模型，不新增第二套权限体系。
5. 查价权益本体继续遵守 PDM-10；账号停用只作为客户账号能力的上层可用性 Guard，不重写查价权本身的产生、有效期与周期规则。

仍由后续 PDM 承接的事项：

1. Demand 生命周期 → PDM-11；2026-10-05 用户已明确并最终批准：Customer 停用时 active Demand 自动 paused、历史保留、恢复账号不自动恢复 Demand；PDM-11 已 `COMPLETE / INTEGRITY_PASS`，`HO-P01-P11-002 = HANDOFF_CLOSED`；旧“停用不改变 Demand 状态”口径已被覆盖且不得恢复；
2. Recommendation 具体生命周期与当前 listing cycle 权利 → PDM-14｜`HANDOFF_CLOSED`：PDM-14 Final 已正式承接 Recommendation 独立对象、当前 listing_cycle 边界、Customer disable/restore、find-car entitlement loss/restore、历史保留与 Customer identity 不重建；`HO-P01-P14-001 = HANDOFF_CLOSED / source_backwrite=YES`；
3. Consultation → PDM-15；
4. CRM 客户画像、跟进、员工内部客户称呼承载 → PDM-16；
5. Lock / Waitlist → PDM-18；
6. Transaction / Refund → PDM-19；
7. 客户端个人资料与“账号已停用”具体页面表现 → PDM-20；
8. 审计字段、历史留存实现细节 → PDM-25。

---

## 14. 最终门禁状态

- Batch 1：`COMPLETE_USER_CONFIRMED`
- Batch 2：`COMPLETE_USER_CONFIRMED`
- Batch 3：`COMPLETE_USER_CONFIRMED_NO_NEW_ATOMS`
- Batch 4：`COMPLETE_USER_CONFIRMED`
- 历史 Final 状态：`COMPLETE`
- 最终总览：`USER_APPROVED`
- 2026-10-04 Legacy Final Integrity Audit：`INTEGRITY_PASS`
- Missing Rule unresolved：`0`
- Semantic Detail Gap unresolved：`0`
- Cross-PDM Conflict：`0`
- Handoff Gap unresolved：`0`
- Implementation Ready：`PASS`

PDM-01 已通过当前新完整性标准。PDM-01～10 本轮复核的下一域为：

> **PDM-02｜Legacy Final Integrity Audit**
