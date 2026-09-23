# PDM-01｜客户身份 / 微信 / 手机号 / 资料 / 客户生命周期｜规则原子重建工作版

> 日期：2026-09-23  
> 状态：`FINAL_REVIEW_PENDING`  
> 业务域：PDM-01  
> 说明：本文件严格依据当前 GitHub 仓库证据重建，不使用旧聊天记忆替代证据；当前仍是工作版，不是最终产品业务基线。
> **2026-09-23 用户全量审查门禁覆盖说明：** 本文件中任何“保留 / 稳定 / 建议保留 / 可直接保留”均仅代表模型证据分类，不代表用户已批准。P01-A01～A20 全部必须进入四批用户审查；未经用户明确确认，任何规则不得进入最终产品基线。


## 0.1｜2026-09-24 R5 原始最终总结已补回

此前本工作版写有“原 R5 分支最终文件未物化”的证据限制。该限制现已发生变化：

- 用户已重新找到并上传 R5 原始业务重审最终总结；
- 原件已补入 GitHub：`01_证据_A_9月19日产品业务锚点/补回原始证据_2026-09-24/R5_客户注册归属分享转介绍离职交接_业务重审最终总结.md`；
- 因此后续不得再以“R5 原件不存在”作为证据缺口；
- 当前 Batch 3 暂停，先用原 R5 对 Batch 1 / Batch 2 及未决 Atom 做一次证据重基准；
- 已确认规则若与原件冲突，不静默撤销，必须显式交用户复核。

重点：原 R5 明确“首次进入不立即分配 owner；首次有效归属事件发生后才形成 owner”，与本轮已确认 P01-A04 存在需要解释的版本/时间关系，必须在继续 Batch 3 前处理。

## 1. 本轮证据范围

### 9/19 正向锚点

- `01_证据_A_9月19日产品业务锚点/.../CURRENT/MODULES/R5_客户注册归属分享转介绍离职交接_当前版.md`
- `.../CURRENT/MODULES/R7_Recommendation分享咨询与客户解锁_当前版.md`
- `.../CURRENT/MODULES/R10_客户端员工端核心体验IA_当前版.md`
- `.../CURRENT/Phase1_当前唯一业务合并基线.md`

### 9/19 前历史入口

- `.../HISTORY/INDEX/R3_R5来源说明.md`
- `06_证据_F_001至078历史反向差集/001至078_按业务模块全量归档_未裁决版.md` 中 M01-001～M01-006 的逐字归档原文。

### 9/19 后证据

- `02_证据_B_9月22日冻结台账/02_用户视觉评审问题总台账_冻结版.md`
- `03_证据_C_IA_V5_Current/` 全部 Current 合同与登记表
- `04_证据_D_实际_LowFi/` 中 C-O01、C-O02、P06-01 及 Merge 状态
- `05_证据_E_工程总闭环待执行Delta/工程总闭环待执行Delta清单.md`

## 2. 证据边界与缺口

1. 历史上 `R3_R5来源说明.md` 曾记录 R5 原分支最终文件未物化；该历史事实保留，但 2026-09-24 用户已重新找回并补入 R5 原始最终总结。因此当前证据缺口已关闭，后续必须直接读取补回原件。
2. `IA_SOURCE_INDEX.md` 明确写到 IA V5 的业务权威来自 `Phase1.5上游权威/` 七份文件，但这七份文件**不在当前仓库 Manifest 中**。因此 IA 中引用的 D13、Step5、Step7 等可以证明“IA 当前怎么承载”，但不能单独升级成新的产品业务权威。
3. 001～078 未裁决归档可用于历史证据线索及其中逐字保留的历史文本，但其旧 `STILL_VALID / SUPERSEDED / HISTORICAL_RULE_LOSS` 等判定不直接继承。
4. 9/22 冻结台账在 PDM-01 范围只找到 `VR-C-018`：C-O02 仅保留“授权手机号 / 取消”，`success resume` 不画成按钮。没有找到 9/22 对手机号换绑方式、完整 Customer Merge 语义、客户停用/注销完整生命周期的独立冻结裁决。
5. Engineering Delta 没有新增 PDM-01 身份规则；只在 LockRequest 交叉边界强调其不改变 customer owner 等既有关系。

## 3. 规则原子重建

| Atom | 规则原子 | 9/19 / 前史 | 9/22 / IA / Low-Fi / Delta | 当前分类 | 当前处理 |
|---|---|---|---|---|---|
| P01-A01 | Customer 使用稳定 `customer_id`；手机号、头像、昵称不是唯一身份主键 | M01-001 历史原文明确；R5/R10 以微信身份创建/找到 customer_id | IA ACT-V4-001 / CO-O01 继续承载 | `USER_CONFIRMED` | 用户于 2026-09-24 明确确认“剩余14条全部通过”；已写入 Decision Register |
| P01-A02 | 首次进入：微信身份识别 → 创建/找到 customer_id → 直接进入 C01；不建设显式独立登录页 | R10-55 明确 | IA 首入 Action/State 一致 | `USER_CONFIRMED` | 用户于 2026-09-24 明确确认“剩余14条全部通过”；已写入 Decision Register |
| P01-A03 | 首次进入不要求手机号、头像、昵称，不阻挡普通浏览 | R10-55 明确 | IA 一致 | `USER_CONFIRMED` | 用户于 2026-09-24 明确确认“剩余14条全部通过”；已写入 Decision Register |
| P01-A04 | 首次进入建立/识别 customer_id 后进入归属判定：无有效分享/直接转介绍等优先归属来源时，进入自然注册自动轮询接客池并形成唯一 current owner；通过有效直接转介绍进入时，新客户记录直接推荐关系，并由推荐人事件发生时的 current owner 承接，不再参加普通自然注册轮询；普通客户侧车源转发仍为 SOURCE_ONLY，不据此分配或改变 owner | 补回 R5 原件、9/19 CURRENT R5、R10-55、IA Current 均明确旧规则为“首次进入不立即形成 owner；有效分享/转介绍或首次人工服务事件才形成 owner”。2026-09-24 用户在知悉该直接冲突后明确裁决“继续用 A04”，因此 A04 是当前主动新修改，不再把 IA 的 natural registration / auto-round-robin 解释为历史已支持首次进入立即分配 | `USER_CONFIRMED_NEW_CHANGE` | 用户于 2026-09-24 重基准后再次明确确认“继续用 A04”；已写入 PDM01-DEC-R5-REB-001，后续必须按新规则继承 |
| P01-A05 | 微信身份识别失败可重试 | R10-55 明确 | IA BUS-V4-001 / CO-O01 一致；实际 Low-Fi 首入专门失败态承载不足 | `USER_CONFIRMED` | 用户于 2026-09-24 明确确认“剩余14条全部通过”；已写入 Decision Register |
| P01-A06 | 手机号是人工服务硬门槛，但不是浏览/收藏门槛 | R10-11、M01-001 明确 | IA / C-O02 一致 | `USER_CONFIRMED` | 用户于 2026-09-24 明确确认“剩余14条全部通过”；已写入 Decision Register |
| P01-A07 | 无手机号触发授权；成功保存并自动继续原动作；拒绝/取消不创建正式人工服务对象 | R10-11 明确 | IA C-O02 Guard 一致；9/22 VR-C-018 仅要求界面保留“授权手机号/取消”，success resume 不画成按钮 | `USER_CONFIRMED` | 用户于 2026-09-24 明确确认“剩余14条全部通过”；已写入 Decision Register |
| P01-A08 | 同一手机号不能自动认定为同一 Customer，也不能自动 merge | R5-13 明确；M01-002/M01-004 前史一致 | 后续没有相反裁决 | `USER_CONFIRMED` | 用户于 2026-09-24 明确确认“剩余14条全部通过”；已写入 Decision Register |
| P01-A09 | 不同 `customer_id` 始终保持独立 Customer；即使确认现实中属于同一自然人，V1 也不提供 Customer Merge / 账号合并 | CN11 2026-09-06 原规则本就主张 V1 不做正式 Merge；9/19 后曾恢复人工 Merge | 2026-09-24 用户再次主动修改，明确“两个账号就两个账号，不需要合并” | `USER_CONFIRMED_NEW_CHANGE` | `PDM01-DEC-MERGE-CANCEL-001` 覆盖此前 A09 旧裁决 |
| P01-A10 | V1 不再执行 Customer Merge，因此 Merge 后历史迁移/保留规则不再作为可执行产品能力；既有 Customer 各自历史继续按原 customer_id 独立保留 | 9/19 曾定义 Merge 历史保留 | 2026-09-24 用户取消 Merge 后该执行规则失去适用场景 | `SUPERSEDED_BY_NO_MERGE` | 不建设 Merge，不做跨 Customer 历史迁移 |
| P01-A11 | Customer Merge Guard | 后续 IA 曾承载 active/paused Demand 阻断、permission/scope、显式确认 | 2026-09-24 用户已取消 V1 Customer Merge | `CANCELLED_NA` | 整项关闭，不再需要 Demand Guard / Merge permission / Merge confirm |
| P01-A12 | Merge 后 surviving customer_id、owner/source/权益/活动业务冲突处理 | 9/19 曾提出但未完整定义 | 2026-09-24 用户已取消 V1 Customer Merge | `CANCELLED_NA` | 整项关闭；不存在 surviving customer_id 或跨 Customer 权益/业务合并 |
| P01-A13 | 手机号是可变联系方式而不是 Customer 身份；主要手机号更换或其他联系电话新增/修改/失效均继续使用原 customer_id，并保留必要历史；owner、来源、既有业务与权益不因手机号变化而迁移/重建 | CN11 DEC-057 / SSOT 与补回 R5 原件直接支持 | 2026-09-24 用户确认，并与 A14 多手机号管理规则组成统一体系 | `USER_CONFIRMED` | 已写入 PDM01-DEC-A13 |
| P01-A14 | Customer 支持 1 个主要手机号 + 0～多个其他联系电话；首次需要手机号时通过微信小程序官方手机号能力完成有效绑定；后续有权限员工可新增/维护其他联系电话；CRM 手机号搜索覆盖全部已登记号码；同号命中多个 Customer 时全部返回且不得自动 Merge | CN11/R5 证明手机号是可变联系方式、换号不换 Customer；R10-15 证明 CRM 客户搜索支持手机号；但历史未证明多手机号或员工新增号码已冻结 | 2026-09-24 用户明确新增并确认；具体手机号维护角色权限留 PDM-02 | `USER_CONFIRMED_NEW_CHANGE` | 已写入 PDM01-DEC-A14；与已确认 A13 身份连续性规则共同生效 |
| P01-A15 | 客户停用/注销不物理删除业务历史；确认原客户后仍应沿用原身份而不是新建“历史清空”Customer | R5-14 明确；M01-003 一致 | IA CO-O01 继续表达“停用不删历史；确认身份可恢复” | `USER_CONFIRMED` | 用户于 2026-09-24 明确确认“剩余14条全部通过”；已写入 Decision Register |
| P01-A16 | 客户可发起停用，授权后台人员可停用/恢复；有未结束 Demand/Consultation/Lock/Transaction 时阻断停用；停用不删身份/历史且禁止新增人工服务；owner/source 历史不清空；恢复沿用原 customer_id，不自动复活终止/过期业务与权益 | R5 原件确认停用不删历史与恢复原身份；细节原先未冻结 | 2026-09-24 用户确认采用 V1 最小闭环，跨域恢复细节留对应 PDM | `USER_CONFIRMED_NEW_CHANGE` | 已写入 PDM01-DEC-A16 |
| P01-A17 | 头像/昵称不是硬门槛；跳过/拒绝不能阻断业务 | R10-56 明确 | IA/Low-Fi 原则承载，但 C-O01 使用 `completed profile` / `required avatar/nickname` 类措辞有误导风险 | `USER_CONFIRMED` | 用户于 2026-09-24 明确确认“剩余14条全部通过”；已写入 Decision Register |
| P01-A18 | 头像/昵称提醒：收藏成功可提醒一次；持续浏览最多每20分钟一次；每天最多10次；多触发合并一次；关键业务执行中不打断 | R10-56 明确，且明确覆盖旧“每天一次/第5、10台/30分钟/每天4次” | IA/Low-Fi 未完整下沉这组频控与 no-interrupt Guard | `USER_CONFIRMED` | 用户于 2026-09-24 明确确认“剩余14条全部通过”；已写入 Decision Register |
| P01-A19 | 个人资料展示头像、昵称、手机号、我的顾问；打开资料页本身不分配销售 | R10-22 明确 | 无后续冲突 | `USER_CONFIRMED` | 用户于 2026-09-24 明确确认“剩余14条全部通过”；已写入 Decision Register |
| P01-A20 | Customer 跨后续购车/找车/咨询保持同一身份；新一轮业务在原 Customer 下新建，不因新业务重建 Customer | Phase1 Merge 的 R6 部分明确 | 无后续冲突 | `USER_CONFIRMED` | 用户于 2026-09-24 明确确认“剩余14条全部通过”；已写入 Decision Register |

## 3.1 P01-A04 专项修正记录（用户已确认）

本轮用户先确认 A04 为“首次进入后自然注册自动分配 owner”。2026-09-24 补回 R5 原始最终总结后重新核证，确认此前证据解释需要纠正：

- R5 原件、9/19 CURRENT R5、R10-55 均明确“首次进入不自动分配 owner”；
- IA Current 虽存在 `natural registration / auto-round-robin`，但同一 IA 也明确“首次进入只建立 customer_id，不会仅因建立身份自动形成 owner”，因此该短语不能证明历史上支持“首次进入立即分配”；
- R5 / IA 对有效分享、直接转介绍、首次人工服务事件形成 owner 的旧规则是一致的；
- 用户在知悉上述直接冲突后明确裁决“继续用 A04”。因此 A04 现在应被定义为 2026-09-24 的主动新修改，而不是对旧证据的解释性恢复。

当前修正版候选：

> 新客户首次进入先通过微信身份建立/识别 `customer_id`。若不存在有效销售分享、直接转介绍等优先归属来源，则立即进入自然注册自动分配流程，从当前 active + eligible + accepting 的接客池中产生唯一 current owner。若通过有效直接转介绍进入，则记录直接推荐关系，并由推荐人事件发生时的 current owner 承接，不再参加普通自然注册轮询。

注意：普通客户侧“转发车源”仍是 `SOURCE_ONLY`，不等同于正式“直接转介绍”，不能据此分配或改变 owner。

状态：`USER_CONFIRMED_NEW_CHANGE`。用户于 2026-09-24 在 R5 原件补回、冲突被完整呈现后再次明确确认“继续用 A04”。已追加 Decision Register `PDM01-DEC-R5-REB-001`。该规则现在明确覆盖旧 R5 / R10 / IA 的“首次进入不立即形成 owner”规则，并继续作为后续批次和相关 PDM 的当前有效约束。

## 4. 知情修改测试

### 4.1 没有真实冲突的稳定项

除 P01-A04 外，P01-A01～A03、A05～A10、A15、A17～A20 与 9/19 规则没有发现真实后续冲突。P01-A04 已发现“首次进入不自动分配 owner”与后续 `natural registration / auto-round-robin` 承载之间的语义冲突，并已由用户明确裁决为“自然注册自动分配 + 直接转介绍优先承接”的修正版。其余差异主要是承载不足或结构显式化，不构成产品规则改写。

### 4.2 P01-A11｜Phase1.5 Merge Guard

后续 IA 明确存在：

- active/paused Demand 阻断；
- merge permission/scope；
- MERGE_READY；
- 显式确认；
- immutable merge history。

但当前仓库没有 `IA_SOURCE_INDEX.md` 所称的 `Phase1.5上游权威/` 七份原始业务文件。

因此：

> **当前不能判 `POST_919_INFORMED_CHANGE_CANDIDATE = PASS`。**

现阶段只能保持：

> `EVIDENCE_INCOMPLETE`

这不是否定该 Guard，而是拒绝用 IA 结构替代原始业务裁决证据。

### 4.3 P01-A13｜手机号变化保持原 Customer

历史归档逐字保留 DEC-057：

> 换电话号码不是换客户；继续原 customer_id，只更新 current phone，并保留必要历史，owner / Demand / Consultation / Lock / Transaction / price rights 等不因换号变化。

9/19 R5 当前版没有完整承接这段，但也没有任何相反规则。

因此当前标记：

> `PRE_919_OMISSION_CANDIDATE`

按冻结执行规范，这类遗漏需要用户重新确认后才能进入当前唯一基线。

## 5. 实际 Low-Fi / IA 承载问题登记（本阶段不施工）

### C-O01｜头像昵称完善提示

当前实际 SVG 中仍出现：

- `Use WeChat pro`
- `later`
- `close`
- Guard 注释含 `completed profile`

这些不是当前中文产品业务权威表达，且容易把“可选完善”误读为“必须完成”。后续进入 Low-Fi 校准时应按 P01-A17/A18 改为中文并显式体现“可跳过、不阻断关键业务”。

### C-O02｜手机号授权

当前实际 SVG 中包含：

- `Authorize`
- `reject`
- `success resume`

9/22 VR-C-018 已冻结：成品仅保留“授权手机号 / 取消”语义，`success resume` 不是可点击按钮。当前属于待施工视觉/旅程差异，不改变 P01-A07 的业务规则。

### P06-01｜Customer Merge

当前实际 SVG / IA 已有：

- MERGE_BLOCKED
- MERGE_READY
- MERGING
- MERGED
- MERGE_HISTORICAL
- active/paused Demand 阻断
- merge permission/scope
- explicit confirm

但该完整流程的原始 Phase1.5 业务权威文件未随仓库导入，因此只能作为“当前结构投影证据”，不能自动成为最终产品规则。

## 6. 当前 NEEDS_DECISION

### PDM01-D01｜手机号换绑核心规则是否恢复

是否确认恢复历史规则：

> **同一微信 Customer 更换手机号仍使用原 customer_id；只更新当前手机号并保留修改历史；owner、权益和已有业务不变。**

当前建议动作不是替用户决定，而是要求明确裁决：`CONFIRM_RESTORE / REJECT / MODIFY`。

### PDM01-D02｜手机号换绑的具体方式

需要从产品层明确 V1 采用哪一种：

- A：仅允许微信手机号授权更新；
- B：允许输入其他手机号，并通过短信验证码验证；
- C：客户不自助换绑，只由授权后台人员处理；
- D：其他明确方案。

此项当前没有足够仓库证据自动决定。

### PDM01-D03｜Customer Merge 完整语义

至少需要明确：

1. “疑似重复 Customer”由什么证据进入人工合并候选；
2. 是否吸收当前 IA 的 active/paused Demand 阻断、permission/scope、显式确认；
3. 合并后保留哪个 customer_id；
4. 双方 owner/source/客户权益/未结束业务发生冲突时如何处理。

9/19 已经允许“确认同一自然人后人工合并”，因此这里不是重新讨论“要不要有 Merge”，而是补齐可执行语义。

### PDM01-D04｜客户停用 / 注销完整生命周期

至少需要明确：

1. V1 是否允许客户自助注销；
2. 后台谁可停用 / 恢复；
3. 存在 active Demand / Consultation / Lock / Transaction 时能否停用，还是必须先处理；
4. 停用后的普通浏览、人工服务、owner、Recommendation/查价权益怎么处理；
5. 恢复后哪些当前关系恢复、哪些只保留历史。

当前只能确定“不删历史、确认原身份后不能另造新 Customer”。

## 7. 当前阶段结论

- Batch 1 共 15 条已全部由用户明确确认：P01-A01～A10、A15、A17～A20 均为 `USER_CONFIRMED`；其中 A04 为专项修正规则，其余 14 条于 2026-09-24 用户明确回复“剩余14条全部通过”。
- 历史遗漏强候选：P01-A13。
- 证据不完整：P01-A11。
- 需要真实产品裁决：P01-A12、A14、A16，并形成 D01～D04。
- Decision Register 已写入 Batch 1 全部 15 条用户确认记录；这些规则从现在起共同作为后续 Batch 2～4 和相关 PDM 的当前有效约束。
- PDM-01 状态：`USER_REVIEW_BATCH_4_PENDING`。
- Batch 1、Batch 2、Batch 3 均已完成并通过；下一步进入 Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择。Batch 4 展示后必须再次停下等待用户确认；四批和最终总览均经用户确认前，不生成正式 PDM-01 最终规则，也不进入 PDM-02。

## 一句话索引

> PDM-01 Batch 1～3 已全部通过；Batch 3 无新增未审规则。下一步进入 Batch 4，集中处理 A11 / A12 / A13 / A14 / A16 等证据缺口、历史遗漏与新选择。

## 8. Batch 2｜明确废弃 / 明确替代 / DO_NOT_RESTORE｜用户审查清单

> 状态：`USER_CONFIRMED`。2026-09-24 用户明确确认“Batch 2 五项全部通过”；五项均已写入 Decision Register，并作为后续 Batch 3～4 的排除/替代约束持续继承。

| ID | 旧规则 / 旧口径 | 当前替代 / 排除方向 | 原始证据结论 | 与 Batch 1 已确认规则关系 | 当前状态 |
|---|---|---|---|---|---|
| P01-B2-01 | 首次进入只建立 `customer_id`，不因首次进入形成 owner；普通浏览不是归属触发条件 | DO_NOT_RESTORE：改为已确认 A04——无优先归属来源时，首次进入建立/识别 customer_id 后立即进入 active + eligible + accepting 接客池自动轮询形成唯一 current owner；直接转介绍优先由推荐人当时 current owner 承接 | R5 原件 / 9/19 CURRENT R5 / R10-55 / IA Current 均直接支持该旧口径；2026-09-24 用户在重基准冲突复核后仍明确选择 A04，因此旧口径作为被主动新修改覆盖的规则不得恢复 | 由 P01-A04 的 2026-09-24 主动新修改替代 | `USER_CONFIRMED` |
| P01-B2-02 | V1 不建设复杂 Customer Merge / 不做正式 Customer Merge | DO_NOT_RESTORE：允许受控人工 Merge；只有确认同一自然人后才允许合并，并保留历史/来源/owner变化；完整 Merge 细节留 Batch 4 | 001～078 M01-002 逐字保留 2026-09-06 旧规则；9/19 R5 §13 已明确“确认同一自然人后允许人工合并” | 与已确认 P01-A09/A10 一致，旧“完全不做 Merge”不得恢复 | `USER_CONFIRMED` |
| P01-B2-03 | 同手机号自动认定同一客户并自动 Merge | DO_NOT_RESTORE：相同手机号最多只能作为重复客户提示证据之一，不得自动 Merge / 改 owner / 搬历史 / 搬权益 | 001～078 M01-002 明确记录该旧口径当时已废弃；9/19 R5 §13 再次明确相同手机号不能自动合并 | 已确认 P01-A08/A09 | `USER_CONFIRMED` |
| P01-B2-04 | 换手机号时新建 Customer / 新 `customer_id` | DO_NOT_RESTORE：手机号是可变联系方式；同一微信 Customer 换号仍保持原 `customer_id`，旧号保留必要历史；具体怎么换绑留 Batch 4 | 001～078 M01-004 / M01-006 逐字保留 DEC-057，并明确禁止“换手机号新建 customer” | 不与 Batch 1 冲突；正向恢复规则 P01-A13 仍留 Batch 4 重新确认 | `USER_CONFIRMED` |
| P01-B2-05 | 头像/昵称旧提醒频控：每天最多一次；第5/10台车触发；30分钟冷却；每天最多4次 | DO_NOT_RESTORE：采用已确认 A18——收藏成功可提醒一次；持续浏览最多每20分钟一次；每日最多10次；多触发合并；关键业务中不打断 | 9/19 R10-56 原文明确“覆盖旧规则”；001～078 M01-005 再逐字保留“这些旧口径不得恢复” | 已确认 P01-A18 | `USER_CONFIRMED` |

### Batch 2 边界说明

- “手机号是否允许输入其他号码 + 短信验证码”不是废弃项，仍属于 P01-A14 / Batch 4 未决选择，本批不提前裁决；
- “Customer Merge 的 active/paused Demand 阻断、permission/scope、surviving customer_id 等”不是本批废弃项，仍留 Batch 4；
- Current 中 `required avatar/nickname` 只是承载措辞风险，没有证据证明它曾成为正式产品规则，因此本批不把它虚构成一条“已废弃旧规则”。

## 9. 2026-09-24｜R5 原件补回后的 PDM-01 证据重基准检查

> 状态：`EVIDENCE_REBASE_COMPLETE / CONFLICT_REVIEW_PENDING`。本节只重建证据谱系，不自动撤销用户已确认规则。

### 9.1 重基准范围

本次重新读取并对照：

- 补回原件 `R5_客户注册归属分享转介绍离职交接_业务重审最终总结.md`；
- 补回目录 `README_来源边界与补回说明.md` 与 `RECOVERED_EVIDENCE_MANIFEST_SHA256.csv`；
- R2 来源状态说明；
- 9/19 CURRENT R5、R10；
- IA V5 Current 与 Navigation Register；
- 9/22 冻结台账；
- 当前 PDM-01 工作版与 Decision Register 中 Batch 1 / Batch 2 用户确认项。

R3 原件经 PDM-01 关键词交叉扫描未发现客户身份 / 手机号 / Customer Merge / 注销规则；R4 仅出现客户身份/owner 对查价和价格权益的交叉边界，不改写 PDM-01 客户身份规则。因此本次 PDM-01 重基准的直接新增权威证据是 R5 原件。

### 9.2 Batch 1 / Batch 2 已确认项复核结果

| 复核类别 | 结果 |
|---|---|
| 已确认项总数 | 20（Batch 1 = 15；Batch 2 = 5） |
| 真实冲突 | 2 个已确认条目，实质为同一冲突组：P01-A04 + P01-B2-01 |
| 无真实冲突 | 其余 18 个已确认条目 |
| 自动撤销已确认规则 | 0 |

### 9.3 唯一真实冲突组｜P01-A04 / P01-B2-01

补回 R5 原件明确：

- 首次进入先建立 `customer_id`，**不因为首次进入本身立即分配 owner**；
- 浏览、搜索、收藏等纯浏览行为不触发正式归属；
- 自然进入客户在首次触发需要人工服务动作时，才进入正常合格接客池完成 owner 分配；
- 有效销售分享 / 老客户转介绍可以作为首次有效归属事件。

9/19 CURRENT R5 与 R10-55 同样明确“首次进入不自动分配 owner”。

后续 IA V5 Current 也明确：

> 客户首次进入只建立稳定 `customer_id`，不会仅因建立身份自动形成 owner；owner 由分享 / 接客 / 公海 / 正式转派等路径产生。

IA 中“接客关闭只影响未来自然注册 / 自动轮询”不能单独证明“首次进入立即分配 owner”，因为同一份 IA Current 已直接写明首次建立身份不自动形成 owner。因此此前把该短语解释为“自然首次注册立即自动分配销售”的证据推断不成立。

而 2026-09-24 用户已明确确认 P01-A04：无优先来源时，新客户首次进入后立即进入 active + eligible + accepting 接客池自动轮询形成唯一 current owner；P01-B2-01 又确认旧“不立即分配 owner”不得恢复。

因此当前正确状态不是自动恢复历史 R5，也不是静默维持 A04，而是：

> `USER_CONFIRMED_NEW_CHANGE`

2026-09-24 用户在知悉 R5 原件、9/19 CURRENT R5、R10-55、IA Current 均支持旧规则后，明确裁决“继续用 A04”。因此冲突已关闭：A04 作为主动新修改覆盖旧规则，P01-B2-01 继续有效。

### 9.4 无冲突但证据谱系增强的已确认项

- P01-A01：R5 原件直接确认稳定 `customer_id` 与手机号非唯一身份主键；
- P01-A03 / A06：R5 原件直接确认普通浏览不要求一进入就完成手机号/销售归属，人工服务动作再进入手机号与 owner 规则；
- P01-A08 / A09 / A10：R5 原件直接确认同手机号不能自动合并、须确认同一自然人才可人工 Merge、合并保留历史/来源/owner 变化；
- P01-A15：R5 原件直接确认停用/注销不物理删除历史、原客户回来恢复原身份；
- P01-B2-02 / B2-03 / B2-04：R5 原件直接支持“允许受控人工 Merge”“同手机号自动 Merge 不得恢复”“换手机号新建 Customer 不得恢复”。

其余已确认规则主要由 R10 / 9/22 / IA 承载，R5 原件未提供相反规则，因此保持已确认状态。

### 9.5 未确认 Atom 的证据重分类

#### P01-A11｜Merge Demand Guard

R5 原件没有 `active/paused Demand` 阻断 Merge 的规则；该细节仍只在后续 IA / Phase1.5 D13 投影中出现，而仓库仍缺 Phase1.5 上游七份原始文件。因此 `EVIDENCE_INCOMPLETE` 状态不变。

#### P01-A12｜Merge 后主 customer_id / owner 冲突

R5 原件首次补回了两项直接业务证据：

- 合并后保留一个主 `customer_id`，但**未定义如何选择哪个 ID 存活**；
- 两侧 owner 冲突时，系统不得自动判定，由有权限经理 / 店长人工指定合并后的 current owner，并保留审计。

因此 A12 从“整体未定义”改为“部分已由 R5 原件直接定义，surviving customer_id 选择规则及其他 source/rights/active business 冲突仍未完整定义”。仍需进入后续用户审查。

#### P01-A13｜手机号变化保持原 Customer

R5 原件已直接明确：更换手机号不新建 `customer_id`，不改变 current owner，不改变原始分享/转介绍来源。此前仅依赖 001～078 / DEC-057 的证据强度已升级为“R5 原件直接证据”。该规则仍未经本轮用户正向确认，不能自动跳过四批门禁。

#### P01-A14｜客户手机号管理 / 多手机号 / 搜索

2026-09-24 用户已完成裁决。CN11/R5 原件只证明手机号可变且换号不换 Customer，R10-15 证明 CRM 搜索支持手机号；本轮进一步主动新增：

- 一个 Customer 支持 1 个主要手机号 + 0～多个其他联系电话；
- 首次需要手机号时通过微信小程序官方手机号能力完成有效绑定；
- 后续有权限员工可新增/维护其他联系电话；
- CRM 手机号搜索覆盖主要手机号及其他已登记手机号；
- 同一手机号命中多个 Customer 时全部返回，不自动认定同一人、不自动 Merge；
- 具体手机号维护权限留 PDM-02。

当前状态：`USER_CONFIRMED_NEW_CHANGE`；Decision Register = `PDM01-DEC-A14`。

#### P01-A16｜停用 / 注销完整生命周期

R5 原件直接确认“客户可以停止当前账号使用或进入停用状态、历史不得物理删除、能够确认原客户时恢复原身份”；但仍未定义发起权限、active Demand/Consultation/Lock/Transaction 处理、owner/权益恢复等完整生命周期。状态继续为部分缺口。

### 9.6 跨域恢复证据登记

R5 原件还恢复了销售分享、老客户转介绍、原始来源与 current owner 分离、关闭接客、短期休假、离职旧分享链接、离职交接、直接推荐关系等完整细节。这些主要属于 PDM-03，当前只作为 PDM-01 的交叉边界证据登记，**不在 PDM-01 中提前裁决 PDM-03**。

### 9.7 当前门禁结论

- PDM-01 证据重基准检查已完成；
- `P01-A04 + P01-B2-01` 冲突已由用户知情裁决：继续 A04，作为 2026-09-24 主动新修改覆盖旧 R5 / R10 / IA 规则；
- 其余 18 个已确认条目无真实冲突；
- 当前恢复 `USER_REVIEW_BATCH_3_PENDING`；
- 不修改 IA / Low-Fi / Engineering。

## 10. Batch 3｜明确知情修改 / 后续明确新增｜用户审查清单

> 状态：`USER_CONFIRMED`。2026-09-24 用户明确确认“Batch 3 无新增项，通过”；本批没有新增业务规则，仅确认本批筛选完整并允许进入 Batch 4。

### 10.1 本批实际命中的两项

| ID | 后续修改 / 新增 | 证据结论 | 当前处理 |
|---|---|---|---|
| P01-B3-01 | P01-A04：首次进入后无优先归属来源时立即进入 active + eligible + accepting 接客池自动轮询形成唯一 current owner | 这是 2026-09-24 在补回 R5 原件、明确知悉旧 R5 / R10 / IA 均写“首次进入不立即形成 owner”之后，由用户再次明确选择“继续用 A04”的主动新修改 | `ALREADY_USER_CONFIRMED`；Decision Register = `PDM01-DEC-R5-REB-001`，本批不重复要求同一规则再次裁决 |
| P01-B3-02 | 9/22 `VR-C-018`：手机号授权成品只保留“授权手机号 / 取消”；`success resume` 不画成可点击按钮 | 9/19 R10-11 已先明确“授权成功自动继续刚才动作”；9/22 只是把这个自动续接从错误 UI 按钮中剥离，是后续明确 Visual/Journey 收口，不改变业务结果 | 已包含在 P01-A07，并由用户在 Batch 1 明确确认；`ALREADY_USER_CONFIRMED` |

### 10.2 不进入 Batch 3 的候选

- P01-A11：虽然 IA Current 明确出现 active/paused Demand 阻断 Merge、permission/scope、显式确认等后续细节，但 `IA_SOURCE_INDEX.md` 指向的 `Phase1.5上游权威/` 七份原始文件当前不在仓库 Manifest 中；因此不能证明为来源完整的“知情修改”，继续留 Batch 4 / 证据缺口处理。
- P01-A12：R5 原件只补回部分 Merge 冲突语义，剩余仍未完整，留 Batch 4。
- P01-A13：属于 9/19 前历史遗漏恢复，不属于“后续新增”，留 Batch 4。
- P01-A14：手机号具体换绑方式未冻结，属于新选择，留 Batch 4。
- P01-A16：停用/注销完整生命周期仍有缺口，留 Batch 4。

### 10.3 Batch 3 结论

- 新增未审规则原子：`0`；
- 已命中但此前已由用户确认：`2`（A04 主动新修改；A07/VR-C-018 后续 UI 收口）；
- 因证据不足转 Batch 4：A11；
- 因历史遗漏/未决/缺口转 Batch 4：A12、A13、A14、A16；
- 用户已明确确认“Batch 3 无新增项，通过”；Batch 3 门禁完成，下一步进入 Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择。

## 11. Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择｜用户审查清单

> 状态：`USER_REVIEW_PENDING`。本批只裁真正未决部分；Batch 1～3 已确认内容不重复裁。

### B4-01 / B4-02｜P01-A11 + P01-A12｜Customer Merge 整体取消

**状态：`USER_CONFIRMED_NEW_CHANGE / CLOSED`。**

2026-09-24 用户明确裁决：

- V1 不建设 Customer Merge；
- 不论两个 Customer 是否手机号相同、是否疑似/确认属于同一自然人，只要是不同微信身份形成的不同 `customer_id`，就保持两个独立 Customer；
- 不提供自动 Merge、人工 Merge、账号合并、手机号合并；
- 不迁移、不合并两个 Customer 的 owner、来源、权益、Demand、Consultation、Lock、Transaction 等业务对象；
- 一个手机号可以登记到多个 Customer；手机号搜索命中多个 Customer 时全部返回，仅作为检索/提示，不产生合并动作；
- 同一自然人如果用多个微信账号形成多个 Customer，其客户等级、查价次数、Recommendation 等按各自 `customer_id` 独立计算；用户已明确接受这一结果。

因此：

- A09 旧“确认同一自然人后允许人工 Merge”被主动覆盖；
- A10 Merge 后历史迁移语义不再是可执行能力；
- A11 Demand Guard / Merge permission / confirm 全部 N/A；
- A12 surviving customer_id / owner/source/rights/business conflict 全部 N/A；
- Batch 2 B2-02 被本次新裁决反向覆盖；
- A08 / B2-03 的“同手机号不能自动 Merge”继续成立，但已被更强规则“V1 不存在任何 Merge”包含。

Decision Register：`PDM01-DEC-MERGE-CANCEL-001`。

---

### B4-03｜P01-A13｜换手机号仍保持原 Customer

**状态：`USER_CONFIRMED`。**

2026-09-24 用户确认：A13 与 A14 属于同一手机号体系。

- 手机号只是可变联系方式，不是 Customer 身份；
- 主要手机号更换、其他联系电话新增/修改/失效，都继续使用原 `customer_id`；
- 保留必要手机号历史与审计；
- current owner、原始来源、Demand / Consultation / Lock / Transaction / 查价权益等既有业务关系不因手机号变化而迁移或重建；
- 与 A14 的“一个主要手机号 + 多个其他联系电话”规则共同生效。

Decision Register：`PDM01-DEC-A13`。

---

### B4-04｜P01-A14｜客户手机号管理 / 多手机号 / 搜索

**状态：`USER_CONFIRMED_NEW_CHANGE`。**

2026-09-24 用户明确确认：

- 一个 Customer 支持 **1 个主要手机号 + 0～多个其他联系电话**；
- 客户首次需要手机号时，继续使用微信小程序官方手机号能力完成有效手机号绑定；
- 后续由**有权限的员工**在员工端 / PC 客户资料中新增或维护其他联系电话；
- 具体哪些员工角色拥有维护权限，不在 PDM-01 提前写死，留 PDM-02 权限域裁决；
- 销售端 CRM 原本已经支持“按手机号搜索客户”，现在明确升级为：**主要手机号和所有其他已登记手机号都参与搜索**；
- 输入任一已登记手机号都可找到对应 Customer；
- 如果同一手机号同时登记在多个 Customer 上，搜索结果必须全部返回，不能自动判定为同一自然人，也不能自动 Merge；
- 新增/修改手机号不得改变 `customer_id`、current owner、原始来源或已有业务关系；
- 手机号新增、修改、删除/失效等维护动作必须保留必要审计记录。

**证据边界：**

- CN11 DEC-057 / SSOT 与补回 R5 原件证明“手机号可变但 Customer 身份连续”；
- R10-15 明确 CRM 客户列表搜索支持手机号；
- 但“一个 Customer 多手机号”和“员工可新增其他联系电话”不是旧证据已经冻结的能力，而是本轮用户明确新增的产品规则；
- 因此不得把该规则伪装成历史恢复，应标记为 2026-09-24 主动新增。

Decision Register：`PDM01-DEC-A14`。

---

### B4-05｜P01-A16｜客户停用 / 注销完整生命周期

**已经确定：**

- 客户可停止账号使用或进入停用状态；
- 不物理删除客户及咨询、找车、锁车、候补、交易、转介绍、owner 变化等历史；
- 后续确认是原客户时恢复原 Customer 身份，不新建第二套历史。

**仍未定义：**

- 客户是否可以自助停用/注销；
- 后台谁能操作；
- 有 active Demand / Consultation / Lock / Transaction 时能否停用；
- 停用后是否还能浏览/发起人工服务；
- owner、权益如何处理；
- 恢复时恢复哪些当前关系。

**建议的 V1 最小闭环：**

- 客户可在个人资料发起“停用账号”；授权后台人员也可停用/恢复；
- 若存在未结束 Demand / Consultation / Lock / Transaction，则先阻断停用，提示先结束/取消相关业务；
- 停用后保留身份和历史，但禁止新增人工服务业务；普通公开车源浏览不以该 Customer 的服务身份继续产生新业务；
- current owner / 原始来源历史不清空；owner 若仍有效则保留，若员工已失效则按 PDM-03 的交接规则处理；
- 恢复时继续原 `customer_id`；不自动复活已经终止/过期的业务对象或权益；
- 具体 Recommendation / 查价权益、Lock / Transaction 等跨域恢复行为，留对应 PDM 决定，PDM-01 只冻结“身份连续、不删历史、不静默复活”。

**状态：`USER_CONFIRMED`。**

2026-09-24 用户明确同意方案 A，即采用上述 V1 最小闭环。

Decision Register：`PDM01-DEC-A16`。

### Batch 4 当前门禁

A11 / A12 已因取消 Customer Merge 关闭；A13 / A14 / A16 均已由用户明确确认。Batch 4 门禁已通过，PDM-01 四批审查全部完成；下一步进入 PDM-01 最终完整规则总览，仍须用户再次批准后才能进入 PDM-02。



## 12. Batch 4 门禁结果

- A11 / A12：因用户明确取消 V1 Customer Merge，关闭为 N/A；
- A13：已确认，手机号变化不改变 Customer 身份；
- A14：已确认，多手机号管理 + 员工维护 + CRM 手机号搜索；
- A16：已确认客户停用 / 恢复 V1 最小闭环；
- Batch 4：`USER_CONFIRMED_COMPLETE`；
- PDM-01 当前状态：`FINAL_REVIEW_PENDING`；
- 下一步只允许生成 PDM-01 最终完整规则总览并交用户审查，不得直接进入 PDM-02。
