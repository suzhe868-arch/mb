# PDM-10｜价格 / 查价 / 客户展示价覆盖｜规则原子重建工作版

> 日期：2026-10-04  
> 当前状态：`COMPLETE_USER_CONFIRMED / FINAL_USER_APPROVED`  
> 业务权威语言：中文（zh-CN）  
> 当前域：PDM-10｜价格体系 / 客户展示价 / 阶梯加价 / 覆盖价 / 查价 / 价格快照  
> 执行边界：Batch 1～4 与最终完整规则总览均已由用户确认；本工作版保留裁决过程，正式当前规则以《PDM-10_最终完整规则.md》为准。

---

## 1. 本轮证据范围

本轮实际读取并交叉核对：

- `README.md`
- `CURRENT_PROJECT_STATE.md`
- `NEXT_ACTION.md`
- `PROJECT_STATE.json`
- `IMPORT_STATUS.md`
- `00_先读/01_产品基线重建执行规范_冻结工作版.md`
- `00_先读/02_9月19日产品全域覆盖地图_未裁决版.md`
- `07_重建工作区/DECISION_REGISTER.md`
- 9/19：`R4_完整价格体系与查价权限_当前版.md`
- 9/19：`R11_员工内部模式与敏感操作能力_当前版.md`
- 补回原件：`R4_完整价格体系与查价权限_业务重审最终总结.md`
- CN11：`名邦汽车_V1_SSOT_CHECKPOINT_2026-09-06.md`
- CN11：`名邦汽车_V1_DECISION_REGISTER_2026-09-06.md`
- CN11：`CN9_价格与隐藏车辆可见性收口完成报告_2026-09-17.md`
- 9/22：`02_用户视觉评审问题总台账_冻结版.md`
- IA V5：Price / Price Check / Customer Display Price Override 相关 Current、Action、Permission、State 承载
- 实际 Low-Fi：C01-01 价格态、P08-01 阶梯价格、P08-04 覆盖价相关页面
- 工程 Delta：`工程总闭环待执行Delta清单.md`
- 001～078：M11 共 17 个归档单元

001～078 只作为反向差集雷达，不直接继承其旧判断。

---

## 2. CURRENT IMPLEMENTATION FACT｜当前已实现 / 已测试事实卡

### 2.1 已能由当前仓库证据证明的实现事实

CN9 当前验收材料明确证明：

- JYT `price_label` 固定作为上游标价事实：
  - raw → `upstream_list_price_label`
  - parsed → `upstream_list_price_cents`
- `upstream_wholesale_price_cents` 独立保存真实批发价；
- `base_wholesale_price_cents` 已按 wholesale → list 回退派生；
- CN9 对应 Starter / Foundation 验收为 82 tests / 81 PASS / 0 FAIL / 1 SKIP；
- Baseline checksums 434 OK。

### 2.2 当前不能冒充“已实现”的内容

当前仓库没有足够证据证明以下 PDM-10 全链路已经完成真实工程实现并端到端验收：

- 每日查价额度完整服务端链；
- 客户等级变化后的额度重算；
- 销售临时追加当天查价次数；
- 全局加价 ON/OFF 完整运行语义；
- 单车覆盖价三类车源的全部员工端操作入口；
- 调价独立 permission 的完整 Action / Guard；
- 一键转名邦在“同一 vehicle_id 转换模型”下的最终价格字段迁移/继承行为。

IA V5 / Low-Fi 只能证明结构承载，工程 Delta 明确是待执行输入，均不能直接当 CURRENT_IMPLEMENTED_FACT。

### 2.3 当前实现事实与产品权威冲突

对已证明的 JYT 原始价格字段分层与 `base_wholesale_price` 回退：

> **未发现与 9/06 SSOT、9/19 R4 的产品语义冲突。**

其余未证明实现项不做“实现正确/错误”的猜测。

---

## 3. Batch 1｜稳定一致项｜已用户确认

> 下列只纳入前史、9/19、9/22/IA 后续没有发现真实业务反转的规则原子。  
> 2026-10-04 用户明确“全部同意”。Batch 1 已关闭。

### P10-A01｜批发车原始价格事实与基础批发价

JYT 批发车必须分开保存：

- 上游标价 `upstream_list_price`；
- 上游真实批发价 `upstream_wholesale_price`；
- 基础批发价 `base_wholesale_price`。

基础批发价规则：

1. 有上游批发价 → 取上游批发价；
2. 无上游批发价但有上游标价 → 回退取上游标价；
3. 两者均无有效数字 → `base_wholesale_price = null`。

派生价格不得改写上游原始价格事实。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

---

### P10-A02｜名邦 / 4S 人工车价格体系独立

名邦人工车、4S 合作车独立保存：

- 客户标价；
- 内部批发价。

两者均允许为空。

人工名邦 / 4S 车：

> **不参加 JYT 批发车统一阶梯加价体系。**

本条只冻结价格数据模型与加价边界，不在 PDM-10 重新定义 Lock 资格。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

---

### P10-A03｜客户价格与内部批发价严格隔离

无论批发车还是人工车：

- 客户侧只能看到当前合法的客户展示价格；
- 内部批发价 / `base_wholesale_price` 不能因为客户价格缺失而直接作为客户售价兜底；
- 当前合法价格逻辑最终得不到可展示数字时，客户显示：
  > **价格咨询**

本条不提前裁决“全局加价开关 OFF 时具体取什么价格”；该演进项留后续批次。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

---

### P10-A04｜同一车辆同一时刻只有一个客户展示价

客户等级、客户身份、查价资格决定：

> **客户当前是否有权看到价格。**

不得因为不同客户等级、不同 owner、不同销售归属而让同一车辆在同一时刻形成不同售价。

即：

> **权益控制可见性，不参与车辆售价计算公式。**

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

---

### P10-A05｜阶梯加价规则启用前必须完整校验

准备正式启用的阶梯加价规则必须满足：

- 区间不重叠；
- 声明覆盖范围内无空档；
- 任一适用 `base_wholesale_price` 能唯一确定计算结果。

存在重叠、空档或无法唯一计算时：

> **不得正式启用。**

编辑中 / 校验失败 / 保存失败的版本不得替换当前有效价格规则，也不得让前端自行猜价。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

---

### P10-A06｜阶梯价格采用未生效版本 → 正式启用模型

阶梯规则修改采用：

> **草稿 / 未生效版本 → 校验 → 正式启用**

正式启用成功后：

- 新规则一次性成为当前有效规则；
- 旧规则退出“当前有效”身份，但保留历史；
- 不能边编辑边改变线上当前客户价格。

本条只冻结版本生效模型；“加价 ON/OFF 时的具体客户价格公式”留后续批次单独复核。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

---

### P10-A07｜批发车查价权以 customer + vehicle + listing_cycle 为核心

客户侧批发车价格查看资格以：

> **customer + vehicle + listing_cycle**

共同确定。

客户已经成功解锁某辆批发车当前 `listing_cycle` 后：

- 当前周期重复查看不重复扣额度；
- 当前周期普通调价 / 阶梯规则变化 / 覆盖价变化不重新扣额度；
- 权限代表“可看当前最新价格”，不是冻结旧数字售价。

真实下架后重新上架形成新 `listing_cycle`：

> **旧周期查价权不得自动跨周期。**

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

---

### P10-A08｜只有成功解锁新的批发车数字价格才扣查价额度

一次客户每日查价额度真正消耗，至少必须满足：

- 客户侧；
- 批发车；
- 当前 `listing_cycle` 尚未成功解锁；
- 本次成功得到数字客户展示价。

以下情况不扣额度：

- 权限拒绝；
- 请求失败；
- 超时；
- 幂等重试；
- 当前只能得到“价格咨询”；
- 当前周期已经解锁；
- 已存在合法免费查价权；
- 员工按员工身份查看价格。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

---

### P10-A09｜正式 Recommendation 与普通分享 / 收藏的查价边界

正式 Recommendation 可免费授予：

> **对应 customer + 对应 vehicle + 当前 listing_cycle**

的批发车价格查看权，不消耗客户每日普通查价额度。

该权利：

- 只限被正式 Recommendation 的车辆；
- 不解锁整个批发车库；
- 普通分享本身不授价；
- 收藏不能绕过查价额度；
- 客户不能通过再次分享把自己的查价权传给其他客户；
- Recommendation 后续结束、owner/负责人变化或原销售离职，不追回已经取得的本周期价格查看权；
- 权利持续边界仍是当前 `listing_cycle`。

Recommendation 自身创建/结束流程仍归 PDM-14，本条只冻结其价格权益边界。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

---

### P10-A10｜客户等级查价权益可配置为有限额或不限量，不改变车辆售价

每个客户等级都可以在后台独立配置批发车价格查看权益，包括普通注册客户、粉丝、VIP 及后续扩展等级。

每个等级支持两种业务模式：

1. 有限额：配置每日可成功解锁的新批发车数字价格数量；
2. 不限量：当前等级在列表页与详情页均可直接查看合法数字客户展示价，不受每日次数限制。

不限量必须作为独立业务语义表达，不使用 999999 等超大数字模拟。

无论有限额还是不限量：

- 都不改变车辆当前客户展示价；
- 都不允许形成不同等级不同售价；
- 当前没有合法数字客户价格时仍显示“价格咨询”。

等级变化后立即按新等级权益生效：

- 有限额 → 有限额：当天剩余额度按新等级基础额度重新计算；
- 有限额 → 不限量：立即获得不限量查看权益；
- 不限量 → 有限额：立即恢复新等级限额规则。

有限额模式下推荐计算：

remaining = max(0, current_today_base_quota + today_temp_additions - today_consumed_new_vehicle_unlocks)

已经明确取得的 customer + vehicle + listing_cycle 单车查价权，以及正式 Recommendation 已授予的当前周期免费查价权，不因等级降低而追回。

仅仅因为客户曾处于不限量等级并浏览过车辆，不把这些浏览自动转化成永久单车查价权；不限量是“当前等级权益”，不是批量制造单车授权。

每日自然日边界统一为 UTC+8 00:00。

**状态：** STABLE_BASE_REFINED_BY_FINAL_REVIEW / USER_APPROVED

---

### P10-A11｜价格历史、审计与价格快照不得被后续改价覆盖

价格业务必须保留必要历史和审计。

至少包括：

- 关键价格变更前后值；
- 操作人；
- 操作时间；
- 适用的 `listing_cycle`；
- 必要的价格来源 / 规则来源。

Recommendation / Lock 等关键业务发生时保存的价格快照：

> **属于当时业务事实，后续调价不得回写覆盖。**

客户侧默认只消费当前有效价格 / 当前“价格咨询”状态，不因价格历史存在而获得内部历史价格查看权。

Recommendation、Lock 自身生命周期不在 PDM-10 展开，只冻结其价格快照不可变边界。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

---

### P10-A12｜V1 不恢复服务费 / 预计到手价独立报价体系

V1 不建设或恢复以下独立客户报价体系：

- 服务费；
- 物流费报价；
- 检测费报价；
- 过户费报价；
- 其他附加费用报价；
- 预计到手价 / 到手价测算；
- 后台费用规则。

客户侧核心车辆价格事实继续是：

> **当前有效客户展示价 / 价格咨询。**

成交阶段实际成交价属于 Transaction 事实，不因此重新引入“预计到手价”体系。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

---

## 4. 已识别但明确不进入 Batch 1 的事项

以下均已从证据中识别，因存在后续演进、历史遗漏、当前承载冲突或跨域新模型，禁止混入“稳定一致项”。

### 4.1 后续明确演进候选

- 全局加价开关 OFF：
  - CN11 旧语义存在“没有有效加价规则 → 价格咨询”；
  - 后续 R4 明确改为“加价关闭 → 上游标价”；
  - 必须按知情修改单独审查。
- 客户展示价覆盖适用范围：
  - 较早 R4 总结曾只用于批发车；
  - R11 后续明确扩展为批发 / 名邦 / 4S 三类；
  - 属于后续明确变化，不伪装成长期一致。
- 名邦员工内部价查看：
  - R11 明确取消独立内部价查看 permission；
  - Current Permission / Low-Fi 存在部分重新引入痕迹；
  - 需单独复核。
- 调价继续保留独立 permission：
  - R11 有明确规则；
  - Current Action / Permission 承载不完整；
  - 不在 Batch 1 自动补回。

### 4.2 历史遗漏 / 当前承载缺口

- 销售为客户临时追加当天查价次数完整能力；
- 追加 quota 的 owner 变化 / 次日失效 / 审计链；
- 批发价未解锁时仍按真实当前客户展示价参与价格排序 / 筛选的完整合同；
- 价格展示格式（“万”等）；
- 低于基础价 / 内部价允许保存但必须风险警告；
- 员工端内部模式的覆盖价操作入口；
- 4S 内部模式角色边界冲突。

这些分别进入后续 Batch 4 或映射到 PDM-20 / PDM-21 的承载边界，不在本批自行裁决。

### 4.3 一键转名邦价格规则冲突

证据存在至少三层演进：

1. 早期 R4：转换时继承当前客户展示价；
2. 9/22 `VR-X-009`：批发价复制，名邦标价不继承；
3. 已完成 PDM-04：一键转名邦已经改为**同一 vehicle_id 的来源转换**，不再创建第二个 Vehicle。

因此原“新名邦车价格复制”前提已经发生变化。

> **该项必须后续单独做跨 PDM 冲突裁决，Batch 1 不处理。**

---

## 5. Batch 1 门禁结果

确认原子：

> **P10-A01 ～ P10-A12，共 12 条。**

用户结论：

> **全部同意**

状态：

> `COMPLETE_USER_CONFIRMED`

Batch 1 门禁已关闭，允许进入 Batch 2；不得自动批准 Batch 2。

---

## 6. Batch 2｜明确废弃 / 明确替代｜已用户确认

> 本批只确认“哪些旧方向不得恢复”。  
> 2026-10-04 用户明确“全部同意”。Batch 2 已关闭；对应新规则仍须按 Batch 3 / Batch 4 单独审查。

### P10-B2-01｜禁止恢复“覆盖价只适用于单一车源类型”

不得恢复：

> **客户展示价覆盖仅适用于批发车 / 单一来源类型。**

后续“最终覆盖范围到底是哪些车源”作为演进规则单独进入 Batch 3。

**状态：** `DEPRECATED_SUPERSEDED / USER_APPROVED`

---

### P10-B2-02｜禁止恢复“加价关闭后一律价格咨询”

不得把：

> **加价关闭 = 所有批发车统一显示价格咨询**

恢复为默认规则。

加价关闭后的当前正确价格来源属于明确演进项，留 Batch 3 审查。

**状态：** `DEPRECATED_SUPERSEDED / USER_APPROVED`

---

### P10-B2-03｜禁止把内部批发价直接暴露为客户售价

任何情况下都不得因为：

- 加价关闭；
- 阶梯规则无效；
- 客户价缺失；

就直接把 `base_wholesale_price` / 内部真实批发价作为客户展示价。

**状态：** `DO_NOT_RESTORE / USER_APPROVED`

---

### P10-B2-04｜禁止普通分享 / 收藏自动获得批发查价权

不得恢复以下旧方向：

- 普通分享免费授批发车查价权；
- 点击分享链接即解锁价格；
- 收藏绕过每日查价额度。

普通传播行为不能代替正式价格授权事实。

**状态：** `DO_NOT_RESTORE / USER_APPROVED`

---

### P10-B2-05｜禁止 Recommendation 扩散为全库或二次分享价格权限

不得恢复：

- 推荐一辆车后解锁整个批发库存；
- 客户把自己的价格权限通过普通分享传给其他客户；
- 打开小程序 / 分享链接形成全局批发价权限。

**状态：** `DO_NOT_RESTORE / USER_APPROVED`

---

### P10-B2-06｜禁止旧 listing_cycle 价格权限跨新周期

不得恢复：

- 旧周期查价解锁自动延续到新 `listing_cycle`；
- 旧 Recommendation 免费查价权自动泄露新周期当前价格；
- 新周期自动继承旧周期覆盖价。

真实新周期必须重新判断当前周期价格权限与覆盖事实。

**状态：** `DO_NOT_RESTORE / USER_APPROVED`

---

### P10-B2-07｜禁止重复扣额 / 非成功结果扣额

不得恢复：

- 同一 `listing_cycle` 每次查看都重复扣额度；
- 只看到“价格咨询”也扣一次；
- 请求失败 / 超时仍扣额度；
- 员工查看价格消耗客户查价额度。

**状态：** `DO_NOT_RESTORE / USER_APPROVED`

---

### P10-B2-08｜禁止无效阶梯规则上线或草稿直接影响线上

不得恢复：

- 阶梯区间有重叠仍可启用；
- 声明范围有空档仍可启用；
- 无法唯一算价仍上线；
- 编辑中的草稿边改边影响当前客户价格；
- 保存失败后覆盖当前有效规则。

**状态：** `DO_NOT_RESTORE / USER_APPROVED`

---

### P10-B2-09｜禁止人工车被强制纳入 JYT 加价 / 内部价锁车门槛

不得恢复：

- 名邦 / 4S 人工车参加 JYT 统一阶梯加价；
- 仅因为人工车内部批发价为空就禁止进入后续锁车业务。

本条只确认旧价格方向不得恢复；Lock 全流程仍归后续 PDM-18。

**状态：** `DO_NOT_RESTORE / USER_APPROVED`

---

### P10-B2-10｜【已回开并失效】原“禁止恢复内部价独立 permission”结论

本条曾在 Batch 2 被错误分类为：

> **不得恢复名邦员工内部价 / 批发价独立查看 permission。**

当时主要依据 R11 后期总结“取消独立权限门槛”。

2026-10-04 全局反向复核后确认，该分类遗漏了三组更高优先级 / 冲突证据：

1. R4 正式规则明确“内部批发价按员工权限 + data scope 控制”；
2. 已完成且用户最终批准的 **PDM-02 正式规则**已经明确恢复“查看名邦内部价 / 批发价”独立 permission，并注明这是用户主动反转 9/19 旧规则后的当前口径；
3. IA V5 / 001～078 已记录 internal price permission 的反向承载与 R11 冲突，说明该点从未真正无冲突收口。

因此：

> **P10-B2-10 原结论失效，不再作为当前 DO_NOT_RESTORE 规则。**

原 Batch 2 用户确认记录保留作审计，但本条被后续全局证据复核和用户当前明确口径覆盖。

当前正确规则转入 Batch 4 冲突项 P10-B4-01，并按 PDM-02 当前正式规则继承。

**状态：** `REOPENED / INVALID_CLASSIFICATION / SUPERSEDED_BY_P10-B4-01`

---

### P10-B2-11｜禁止用内部批发价强填客户标价

不得恢复：

- 一键转名邦时因为客户价缺失，就拿内部批发价强行填客户标价；
- 人工车客户标价为空时用内部批发价自动补成客户价。

同一 vehicle_id 转名邦后的最终价格字段处理仍留 Batch 4 做跨 PDM 裁决。

**状态：** `DO_NOT_RESTORE / USER_APPROVED`

---

### P10-B2-12｜禁止恢复客户完整历史价格与第二套费用报价体系

不得恢复：

- 客户查看完整内部价格历史；
- 服务费；
- 物流 / 检测 / 过户等独立报价；
- 预计到手价 / 到手价测算；
- 后台费用规则。

内部审计历史可以保留，但不能因此变成客户侧第二套报价体系。

**状态：** `DO_NOT_RESTORE / USER_APPROVED`

---

## 7. Batch 2 门禁结果

确认原子：

> **P10-B2-01 ～ P10-B2-12，共 12 条。**

用户结论：

> **全部同意**

状态：

> `COMPLETE_USER_CONFIRMED`

Batch 2 门禁已关闭，允许进入 Batch 3；对应替代规则不得因本批确认而自动视为已批准。

---

## 8. Batch 3｜知情修改 / 明确新增｜已用户确认

> 本批只放“旧规则后来被明确修改”或“后来明确扩展的新业务口径”。  
> 当前实现、IA、Low-Fi 是否已经完全跟上，不影响本批的产品裁决；承载缺口留 Batch 4 / 后续工程阶段。

### P10-A13｜全局加价关闭后的客户价格改为上游标价

早期 CN11 曾存在：

> 没有有效加价规则且无单车覆盖价 → 批发车显示“价格咨询”。

后续 R4 已明确修改为：

1. 有有效客户展示覆盖价 → 覆盖价最高优先；
2. 无覆盖价 + 加价开启 → `base_wholesale_price + 当前有效阶梯加价`；
3. 无覆盖价 + 加价关闭 → **显示当前上游标价 `upstream_list_price`**；
4. 按当前分支仍得不到合法数字客户价格 → 显示“价格咨询”。

明确禁止：

> 加价关闭时把 `base_wholesale_price` / 真实批发价直接暴露给客户。

这是对 CN11 旧“无有效加价规则即价格咨询”口径的**知情修改**。

**状态：** `INFORMED_CHANGE / USER_APPROVED`

---

### P10-A14｜客户展示价覆盖正式扩展到批发 / 名邦 / 4S 三类车源

较早 R4 曾把单车覆盖价限定为 JYT 批发车。

后续 R11 / 当前 R4 已明确扩展为：

> **批发、名邦、4S 三类车源均支持客户展示价覆盖。**

共同规则：

- 覆盖价只改变客户最终展示结果；
- 不修改原始来源价格 / 底层客户标价 / 内部批发价；
- 覆盖期间底层价格事实仍可正常更新；
- 覆盖操作继续保留独立权限控制和必要审计。

其中：

**批发车**
- 覆盖价优先于统一阶梯加价 / 加价关闭逻辑；
- 取消覆盖后回到取消时刻的当前正常批发车价格逻辑。

**名邦 / 4S**
- 有覆盖价 → 显示覆盖价；
- 无覆盖价 → 显示当前最新客户标价；
- 客户标价为空 → “价格咨询”；
- 取消覆盖 → 回到取消时最新客户标价。

这是对旧“覆盖价仅批发车”的**明确扩展**。

**状态：** `INFORMED_CHANGE / USER_APPROVED`

---

### P10-A15｜【撤回并转 Batch 4】原“取消独立查看权限门槛”候选

原候选基于 R11，拟定为：

> 名邦员工进入内部模式后，不再额外要求 internal-price-view permission。

经 2026-10-04 全局复核确认，该候选与以下当前有效约束冲突：

- R4：内部批发价按员工权限 + data scope 控制；
- PDM-02 正式最终规则：**“查看名邦内部价 / 批发价”恢复为独立 permission**；
- IA V5：internal price 在多角色上仍存在 ALLOW / CONDITIONAL permission 承载；
- 001～078：已明确记录 R11 取消 permission 后 Current 又反向复活的冲突。

根据新增 Step 5A / Batch 2、3 反向冲突门禁：

> 本项不得继续作为 Batch 3“明确知情修改”确定项。

因此 P10-A15 撤回并重新归类为 Batch 4 冲突项，由 P10-B4-01 承接。

**状态：** `WITHDRAWN_FROM_BATCH_3 / RECLASSIFIED_TO_BATCH_4`

---

## 9. Batch 3 门禁结果

本批原候选：

> **P10-A13 ～ P10-A15，共 3 条。**

2026-10-04 用户审查与全局复核结果：

- P10-A13：用户确认无问题，`USER_APPROVED`；
- P10-A14：用户明确“同意”，`USER_APPROVED`；
- P10-A15：因遗漏 PDM-02 正式规则及跨证据冲突，撤回 Batch 3，转入 Batch 4。

因此 Batch 3 有效确认原子为：

> **P10-A13、P10-A14，共 2 条。**

状态：

> `COMPLETE_USER_CONFIRMED_WITH_ONE_RECLASSIFIED`

Batch 3 门禁关闭，允许进入 Batch 4；不得自动批准 Batch 4 其余未形成项。

---

## 10. Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择

### P10-B4-01｜名邦内部价 / 批发价查看采用后台可配置独立 permission

#### 冲突来源

历史 / 当前证据同时存在：

1. R4：内部批发价按员工权限 + data scope 控制；
2. R11：一度取消名邦员工内部价独立 permission；
3. PDM-02 最终正式规则：用户已主动反转 R11 / 9/19 该口径，恢复独立 permission；
4. IA V5：当前仍存在 internal price ALLOW / CONDITIONAL permission 承载；
5. 001～078：明确记录该点存在“取消后反向复活”的冲突。

#### 当前用户裁决

2026-10-04 用户再次明确：

> **后台应可配置名邦员工是否能看内部价 / 底价；勾选权限则能看，不勾选则不能看。**

当前正式规则：

1. “查看名邦内部价 / 批发价”作为独立 permission 纳入统一权限体系；
2. permission 可由角色模板提供默认值，也可按员工个人明确授权 / 禁用覆盖；
3. 名邦员工查看内部价必须同时满足：
   - 当前为有效名邦员工；
   - 已进入内部模式；
   - 具备内部价查看 permission；
   - 目标车辆在其 data scope 内；
   - 当前对象状态允许；
4. 普通销售、经理、店长均不因职位本身自动获得该 permission；
5. 后台有权管理者可以按现有权限治理体系配置角色默认值和员工个人覆盖；
6. “能查看内部价”不等于获得调价、客户展示价覆盖、电话、上下架等其他敏感能力，这些继续分别按独立权限判断；
7. 4S 成员查看名邦内部价 / 批发价继续 hard DENY，不得通过角色模板或个人授权绕过。

本条直接继承并再次确认 PDM-02 当前正式规则，不修改历史 R11 证据原件。

**状态：** `CONFLICT_RESOLVED / USER_APPROVED / UPSTREAM_AUTHORITY_RESTORED`

---

## 11. Batch 4 当前状态

已解决：

> **P10-B4-01｜内部价查看独立 permission**

其余 Batch 4 冲突 / 历史遗漏 / 缺口尚需继续按全局证据形成，不得因为 B4-01 已解决就自动完成 Batch 4。

当前状态：

> `BATCH_4_EVIDENCE_REVIEW`

下一步：

> **继续形成 PDM-10 其余 Batch 4 候选，并逐项提交用户审查。**


## 12. Batch 4｜剩余冲突 / 历史遗漏 / 证据缺口 / 新选择｜最终收口

### P10-B4-02｜JYT → 名邦同 vehicle_id / listing_cycle 转换后的价格规则

一键转名邦继续使用同一 vehicle_id、同一 listing_cycle，不创建第二辆车，也不新建价格周期。

转换瞬间必须保存不可变价格事实快照，至少包括：上游标价、上游真实批发价、base_wholesale_price、阶梯计算结果、当时最终客户展示价、是否存在覆盖价、转换时间、操作人。

转换后：

- 停止 JYT 当前阶梯价格计算；
- JYT 后续普通调价不得继续自动修改名邦当前价格；
- JYT 原始价格只保留为 Source Data / 历史事实；
- 名邦 customer_list_price 不自动继承转换前批发车客户展示价；
- 当前同 listing_cycle 的有效覆盖价继续生效；
- 后续取消覆盖且名邦 customer_list_price 为空时显示“价格咨询”；
- 当前周期既有查价权继续有效；
- Recommendation / Lock / Transaction 已形成的历史价格快照不得回写。

internal_wholesale_price 初始化只允许使用真实 upstream_wholesale_price；不存在真实上游批发价则为空。禁止用 upstream_list_price 或派生 base_wholesale_price 冒充真实内部批发价。

**状态：** CONFLICT_RESOLVED / USER_APPROVED

---

### P10-B4-03｜临时增加客户当天查价次数

临时追加的是 customer-day quota，不是销售个人额度。

- 普通销售：必须是该客户 current owner，同时具备“增加当天查价次数” permission；
- 经理 / 店长：不要求本人是 current owner，但必须具备该 permission，且客户位于其 data scope；
- 4S 成员：HARD DENY；
- System Admin：可配置该 permission，但不以销售身份执行该业务动作。

提交时重新校验 identity + permission + data scope + object state。

同一天允许多次追加并累计；UTC+8 次日失效。owner 变化、原销售暂停接客或离职，不撤销已经追加的当天次数；有权限的新责任人员可继续追加。

不强制填写原因，备注可选。审计至少记录客户、操作人、时间、增加次数、操作前后剩余额度与当天累计追加量。

**状态：** HISTORICAL_RULE_RESTORED_AND_REFINED / USER_APPROVED

---

### P10-B4-04｜未解锁价格仍使用真实客户展示价参与筛选和排序

“能否看见精确数字”与“系统内部是否使用真实客户展示价做查询”分离。

客户尚未解锁批发价时，前端显示“查看价格”，但：

- 排序使用当前真实客户展示价；
- 数字价格区间筛选使用当前真实客户展示价；
- 解锁前后不得改变车辆排序位置；
- 查询本身不建立查价权、不消耗额度；
- 响应 payload 不得向未授权客户返回精确数字价格。

“价格咨询”车辆不进入明确数字价格区间；价格排序放在所有数字价格之后，其内部顺序按既定上架时间等规则处理。

**状态：** HISTORICAL_RULE_RESTORED / USER_APPROVED

---

### P10-B4-05｜低于基础价 / 内部价允许保存，但必须风险警告和审计

- JYT 客户展示覆盖价低于 base_wholesale_price：允许保存并生效，明显风险警告；
- 名邦 / 4S customer_list_price 低于 internal_wholesale_price：允许保存并生效，明显风险警告；
- 名邦 / 4S 覆盖价低于 internal_wholesale_price：同样允许并警告。

比较基准为空时不比较、不警告，不用 0 或其他价格伪造基准。

不增加经理审批、店长确认、强制亏损理由等产品硬门槛。必须保留 before / after / baseline / risk flag / actor / time / listing_cycle / operation type 等审计事实。

**状态：** USER_APPROVED

---

### P10-B4-06｜取消独立“调价 permission / 调价动作”

名邦 / 4S 的 customer_list_price 与 internal_wholesale_price 属于车辆正常可编辑业务字段，不再单独建立“调价 permission”或独立“调价动作”。

具备对应车辆编辑 / 管理能力并满足 data scope、object state 的人员，通过普通车辆编辑的“保存修改”提交正常价格字段。

JYT 上游标价、上游批发价、base_wholesale_price 继续只读。

客户展示价覆盖仍是独立敏感动作与独立 permission，因为它是可设置 / 修改 / 取消的展示层覆盖，不改底层价格事实。

本条显式 supersede：
- PDM-02 中把“调价”作为独立敏感 permission 的旧表述；
- PDM-06 中“调价不得混入保存修改”的旧表述；
- R11 / Current 中相应旧 carrier。

**状态：** USER_APPROVED / CROSS_PDM_SUPERSESSION

---

### P10-B4-07｜客户展示价覆盖仅由名邦内部人员执行

三类车源都支持客户展示价覆盖，但“支持该数据能力”不等于所有来源主体都可操作。

名邦员工执行覆盖必须满足 active + override permission + data scope + object state，并在提交时重验。

4S 成员对覆盖价 HARD DENY，即使是本人可管理的 4S 车辆也不能设置、修改、取消覆盖价。4S 成员可以在正常车辆编辑权限范围内修改自己车辆的 customer_list_price，这不是覆盖价。

**状态：** USER_APPROVED / HARD_DENY_CONFIRMED

---

### P10-B4-08｜价格展示格式与语义标签

客户数字价格统一主要使用“万”：

- 128000 → 12.8万；
- 180000 → 18万；
- 125800 → 12.58万；
- 不强制显示 .0。

无合法数字客户价格 → “价格咨询”。
批发车价格尚未解锁 → “查看价格”。

员工内部界面必须明确区分：当前客户展示价、客户标价、内部批发价，以及 JYT 场景下的上游标价 / 上游批发价等，不允许用含糊“价格”把不同价格事实混在一起。

**状态：** USER_APPROVED

---

### P10-B4-09｜4S 成员可以进入自己车辆的管理视图，再按 hard DENY 裁剪能力

4S 成员不得被整体阻断于车辆管理承载之外。

4S 成员可以进入自己有权管理的 4S 车辆管理视图，正常维护允许的车辆资料与正常客户标价；随后继续按 identity + permission + data scope + object state 与 4S hard DENY 裁剪具体能力。

继续禁止：管理名邦车、管理 JYT 批发车、查看名邦内部价 / 批发价、一键转名邦、客户展示价覆盖、越过自己的 4S data scope。

Current IA 中“4S member | internal mode | DENY”的整体角色门禁属于 stale carrier，后续 PDM-21 / IA 对齐时修正。

**状态：** CURRENT_SEMANTIC_CONFLICT_RESOLVED / USER_APPROVED

---

### P10-B4-10｜修改 internal_wholesale_price 还必须具备内部价查看 permission

取消独立“调价 permission”不等于内部敏感字段失去字段级保护。

修改 internal_wholesale_price 必须同时满足：

- 正常车辆编辑 / 管理能力；
- 合法 data scope；
- 当前 object state 允许；
- 具备内部价查看 permission。

没有内部价查看 permission 时，后端不返回 internal_wholesale_price，页面不展示，也不得通过接口直接提交修改该字段。

修改 customer_list_price 不要求内部价查看 permission，只服从正常车辆编辑 / 管理能力及 data scope / object state。

**状态：** USER_APPROVED / FIELD_GUARD_CONFIRMED

---

## 13. Batch 4 门禁结果

P10-B4-01～P10-B4-10 均已完成用户明确裁决。

其中：
- B4-03 已按最终“普通销售 owner / 经理店长 data scope”模型修正；
- B4-05 已由用户明确“确认 P10-B4-05”；
- B4-06 对 PDM-02 / PDM-06 的旧调价模型形成显式 supersession；
- B4-10 解决“正常编辑价格字段”与“内部价独立查看 permission”的最后交叉冲突。

状态：COMPLETE_USER_CONFIRMED。

---

## 14. 最终批准

2026-10-04，用户在收到 PDM-10 最终完整规则总览并确认 P10-B4-10 后，明确回复“同意”，完成 Final Domain Overview 最终批准。

最终正式规则文件：

> 07_重建工作区/PDM-10_最终完整规则.md

最终状态：

> COMPLETE

