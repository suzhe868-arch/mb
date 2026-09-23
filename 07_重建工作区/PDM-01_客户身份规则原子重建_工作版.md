# PDM-01｜客户身份 / 微信 / 手机号 / 资料 / 客户生命周期｜规则原子重建工作版

> 日期：2026-09-23  
> 状态：`USER_REVIEW_BATCH_1_PENDING`  
> 业务域：PDM-01  
> 说明：本文件严格依据当前 GitHub 仓库证据重建，不使用旧聊天记忆替代证据；当前仍是工作版，不是最终产品业务基线。
> **2026-09-23 用户全量审查门禁覆盖说明：** 本文件中任何“保留 / 稳定 / 建议保留 / 可直接保留”均仅代表模型证据分类，不代表用户已批准。P01-A01～A20 全部必须进入四批用户审查；未经用户明确确认，任何规则不得进入最终产品基线。


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

1. `R3_R5来源说明.md` 明确说明：R5 当前版是依据此前正式吸收主线的冻结结论重建，原 R5 分支最终文件在当时环境未能再次物化，因此不能假装已经拥有全部 R5 原始历史附件。
2. `IA_SOURCE_INDEX.md` 明确写到 IA V5 的业务权威来自 `Phase1.5上游权威/` 七份文件，但这七份文件**不在当前仓库 Manifest 中**。因此 IA 中引用的 D13、Step5、Step7 等可以证明“IA 当前怎么承载”，但不能单独升级成新的产品业务权威。
3. 001～078 未裁决归档可用于历史证据线索及其中逐字保留的历史文本，但其旧 `STILL_VALID / SUPERSEDED / HISTORICAL_RULE_LOSS` 等判定不直接继承。
4. 9/22 冻结台账在 PDM-01 范围只找到 `VR-C-018`：C-O02 仅保留“授权手机号 / 取消”，`success resume` 不画成按钮。没有找到 9/22 对手机号换绑方式、完整 Customer Merge 语义、客户停用/注销完整生命周期的独立冻结裁决。
5. Engineering Delta 没有新增 PDM-01 身份规则；只在 LockRequest 交叉边界强调其不改变 customer owner 等既有关系。

## 3. 规则原子重建

| Atom | 规则原子 | 9/19 / 前史 | 9/22 / IA / Low-Fi / Delta | 当前分类 | 当前处理 |
|---|---|---|---|---|---|
| P01-A01 | Customer 使用稳定 `customer_id`；手机号、头像、昵称不是唯一身份主键 | M01-001 历史原文明确；R5/R10 以微信身份创建/找到 customer_id | IA ACT-V4-001 / CO-O01 继续承载 | `STABLE_CONSISTENT` | 保留 |
| P01-A02 | 首次进入：微信身份识别 → 创建/找到 customer_id → 直接进入 C01；不建设显式独立登录页 | R10-55 明确 | IA 首入 Action/State 一致 | `STABLE_CONSISTENT` | 保留 |
| P01-A03 | 首次进入不要求手机号、头像、昵称，不阻挡普通浏览 | R10-55 明确 | IA 一致 | `STABLE_CONSISTENT` | 保留 |
| P01-A04 | 建立 customer_id 不自动形成 owner；owner 只在有效归因/服务事件建立 | R5、R10-55 明确 | IA CO-O01 一致 | `STABLE_CONSISTENT` | 保留；Owner 细节归 PDM-03 |
| P01-A05 | 微信身份识别失败可重试 | R10-55 明确 | IA BUS-V4-001 / CO-O01 一致；实际 Low-Fi 首入专门失败态承载不足 | `STABLE_CONSISTENT` | 业务保留；承载问题留后续 IA/Low-Fi 校准 |
| P01-A06 | 手机号是人工服务硬门槛，但不是浏览/收藏门槛 | R10-11、M01-001 明确 | IA / C-O02 一致 | `STABLE_CONSISTENT` | 保留 |
| P01-A07 | 无手机号触发授权；成功保存并自动继续原动作；拒绝/取消不创建正式人工服务对象 | R10-11 明确 | IA C-O02 Guard 一致；9/22 VR-C-018 仅要求界面保留“授权手机号/取消”，success resume 不画成按钮 | `STABLE_CONSISTENT` | 保留；9/22 仅作为视觉/Journey 修正 |
| P01-A08 | 同一手机号不能自动认定为同一 Customer，也不能自动 merge | R5-13 明确；M01-002/M01-004 前史一致 | 后续没有相反裁决 | `STABLE_CONSISTENT` | 保留 |
| P01-A09 | 重复 Customer 只有确认属于同一自然人后才允许人工合并 | R5-13 明确 | IA 已出现 P06-01 Merge Flow，但“如何确认同一自然人”没有完整产品规则 | `STABLE_CONSISTENT` + 细节 `HISTORICAL_UNRESOLVED` | 核心原则保留；识别标准待裁 |
| P01-A10 | Merge 必须保留历史、来源与 owner 变化，不物理抹除旧记录 | R5-13 明确 | IA P06-01 要求 preserve source/owner/business history、immutable history | `STABLE_CONSISTENT` | 保留 |
| P01-A11 | Merge 时 active/paused Demand 阻断；处理后重验；actor 需 merge permission/scope；显式确认 | 9/19 R5 未明确这组细节 | 001～078 记载后续 D13；IA/Low-Fi 已施工该流程，但仓库缺少 IA_SOURCE_INDEX 所称的 `Phase1.5上游权威/` 原始七文件；9/22 冻结台账无此项 | `EVIDENCE_INCOMPLETE` | 不能仅凭 IA 自动升格；需要补原始裁决证据或用户重新确认 |
| P01-A12 | Merge 后保留哪个 customer_id、冲突的 owner/source/权益/活动业务如何合并 | 9/19 只冻结“保留历史/来源/owner变化” | IA/Low-Fi 没有形成完整业务语义 | `HISTORICAL_UNRESOLVED` | 需用户裁决 |
| P01-A13 | 同一微信 Customer 更换手机号时仍使用原 customer_id；仅更新 current phone 并保留必要历史，owner/权益/已有业务不变 | 001～078 的逐字历史归档引用 DEC-057；9/19 R5 当前版未完整写回该细节，但不冲突 | Current/Low-Fi 无真实手机号更新链；9/22 未重新裁 | `PRE_919_OMISSION_CANDIDATE` | 强候选恢复；按方法要求需重新确认 |
| P01-A14 | 手机号具体怎么更换：微信手机号授权、手输其他号码+验证码、或不开放客户自助换绑 | 历史只冻结“换号码不是换 Customer”，未冻结具体交互/验证方式 | C-O02 只证明授权/拒绝；9/22 只冻结授权手机号/取消 | `HISTORICAL_UNRESOLVED` | 需用户裁决，禁止模型自行新增“其他手机号”输入 |
| P01-A15 | 客户停用/注销不物理删除业务历史；确认原客户后仍应沿用原身份而不是新建“历史清空”Customer | R5-14 明确；M01-003 一致 | IA CO-O01 继续表达“停用不删历史；确认身份可恢复” | `STABLE_CONSISTENT` | 保留原则 |
| P01-A16 | 停用/注销完整生命周期：谁能发起、客户是否自助注销、active Demand/Consultation/Lock/Transaction 怎么处理、owner/权益如何处理、恢复权限和状态 | 9/19 未冻结完整细节 | IA 只有摘要性 END/RECOVER，且 BUS-V4-022 与“确认身份可恢复”之间承载语义不够完整 | `HISTORICAL_UNRESOLVED` | 需用户裁决 |
| P01-A17 | 头像/昵称不是硬门槛；跳过/拒绝不能阻断业务 | R10-56 明确 | IA/Low-Fi 原则承载，但 C-O01 使用 `completed profile` / `required avatar/nickname` 类措辞有误导风险 | `STABLE_CONSISTENT` | 业务保留；后续校准承载措辞 |
| P01-A18 | 头像/昵称提醒：收藏成功可提醒一次；持续浏览最多每20分钟一次；每天最多10次；多触发合并一次；关键业务执行中不打断 | R10-56 明确，且明确覆盖旧“每天一次/第5、10台/30分钟/每天4次” | IA/Low-Fi 未完整下沉这组频控与 no-interrupt Guard | `STABLE_CONSISTENT` | 业务保留；后续进入 IA/Low-Fi Delta |
| P01-A19 | 个人资料展示头像、昵称、手机号、我的顾问；打开资料页本身不分配销售 | R10-22 明确 | 无后续冲突 | `STABLE_CONSISTENT` | 保留；“我的顾问”关系细节归 PDM-03 |
| P01-A20 | Customer 跨后续购车/找车/咨询保持同一身份；新一轮业务在原 Customer 下新建，不因新业务重建 Customer | Phase1 Merge 的 R6 部分明确 | 无后续冲突 | `STABLE_CONSISTENT` | 保留 |

## 4. 知情修改测试

### 4.1 没有真实冲突的稳定项

P01-A01～A10、A15、A17～A20 与 9/19 规则没有发现真实后续冲突；9/22 / IA / Low-Fi 的差异主要是承载不足或结构显式化，不构成产品规则改写。

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

- 第一批候选稳定项：P01-A01～A10、A15、A17～A20；**全部状态改为 USER_REVIEW_PENDING，必须由用户逐批审查，不得自动保留。**
- 历史遗漏强候选：P01-A13。
- 证据不完整：P01-A11。
- 需要真实产品裁决：P01-A12、A14、A16，并形成 D01～D04。
- Decision Register 暂不写入，因为尚未产生本轮新的用户裁决。
- PDM-01 状态：`USER_REVIEW_BATCH_1_PENDING`。
- 当前先执行 Batch 1 稳定一致项用户审查；随后按 Batch 2 → Batch 3 → Batch 4 → PDM 最终总览。四批和最终总览均经用户确认前，不生成正式 PDM-01 最终规则，也不进入 PDM-02。

## 一句话索引

> PDM-01 的主体规则已重建清楚；当前真正阻塞只剩手机号换绑、Merge 完整语义、客户停用/注销生命周期三组产品决策，以及一项 Phase1.5 Merge Guard 原始业务来源缺失，其他身份/手机号门槛/头像昵称规则均可稳定保留。
