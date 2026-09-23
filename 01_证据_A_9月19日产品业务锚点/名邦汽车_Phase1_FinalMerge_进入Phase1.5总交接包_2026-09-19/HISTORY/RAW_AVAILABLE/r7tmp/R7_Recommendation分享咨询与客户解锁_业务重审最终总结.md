# R7｜Recommendation / 分享 / 咨询 / 客户解锁｜业务重审最终总结

## 1. 模块状态

- `BUSINESS_REVIEW = COMPLETE`
- 当前阶段：Phase 1｜业务重审
- 本文仅用于业务规则收口、主线合并与后续 Phase 2 工程闭环输入
- **不自动启动 DB / API / Worker / Storage / 前端 / Tests 等工程施工**
- 若本文与 CN11 旧 Recommendation / 分享 / 咨询 / 客户解锁规则冲突，仅在 R7 范围内以本文最新冻结结论为准
- 与本文不冲突的既有规则继续保留

---

## 2. R7 适用范围

R7 只处理：

1. 正式 Recommendation 的资格、创建、重复、结束、作废与历史；
2. 正式 Recommendation 与普通分享的边界；
3. 普通分享的转发与来源归因；
4. Consultation（咨询）的创建、复用、负责人、移交、终态与审计；
5. Recommendation 与批发车查价权限的交叉边界；
6. `listing_cycle` 对 Recommendation、咨询、查价权限的边界；
7. 客户身份、微信登录与 `customer_id` 对上述业务的约束；
8. Recommendation 客户资格的开启 / 关闭 / 审计。

R7 不重新打开已经冻结的 R4 价格体系、R5 客户归属、R6 CRM / 公海 / 协作、R2 车源生命周期等模块，只补充它们与 R7 的直接交叉边界。

---

# 一、Recommendation 基本模型

## 3. 正式 Recommendation 与普通分享严格分离

正式 Recommendation 是系统内明确的业务对象。

只有当前 customer owner 对自己负责的、且已具备 Recommendation 资格的客户，才能创建正式 Recommendation。

普通分享只是车辆传播 / 进入路径：

- 不创建 Recommendation；
- 不授予批发车查价权；
- 不改变 customer owner；
- 不产生其他车辆权限；
- 不因为被转发而继承原客户权限。

---

## 4. Recommendation 客户资格

不是所有客户默认都能被正式推荐车辆。

规则：

- 普通客户默认不开通 Recommendation 资格；
- 只有明确开启该资格的客户，当前 owner 才能创建正式 Recommendation；
- 资格属于客户级状态，不属于某个销售个人；
- owner 变化后资格继续保留，除非有权限人员主动关闭；
- 资格不按固定天数自动到期。

### 4.1 谁能开启 / 关闭资格

Recommendation 资格只能由**拥有对应“推荐资格管理权限”且数据范围覆盖该客户**的人员开启 / 关闭。

- 普通销售不能直接开启 / 关闭；
- 经理只有后台明确授予该权限时才能操作；
- 店长同样只有后台明确授予该权限时才能操作；
- 职位本身不自动等于拥有该能力；
- System Admin 与员工业务权限体系分离，不因 System Admin 身份自动获得该业务能力。

### 4.2 关闭 / 重开

关闭资格后：

- 只禁止以后新建正式 Recommendation；
- 已存在 Recommendation 不删除；
- 已经授予的当前 `listing_cycle` 查价权不追回；
- 历史不删除。

重新开启后：

- 只恢复未来新建 Recommendation 的资格；
- 不自动恢复此前已经结束 / 作废 / 失效的 Recommendation。

### 4.3 资格审计

开启、关闭、重新开启必须记录：

- 修改前状态；
- 修改后状态；
- 操作人；
- 操作时间。

原因 / 备注可选，不强制。

---

## 5. 谁可以创建正式 Recommendation

正式 Recommendation 只能由：

> **该客户当前 customer owner**

创建。

因此：

- 经理 / 店长即使能看到或管理客户，也不能“代 owner”创建正式 Recommendation；
- 协作销售不能正式 Recommendation；
- 其他销售不能给不属于自己的客户正式推荐；
- 经理 / 店长如果本人正好是该客户 current owner，则可以以 owner 身份创建。

如其他人员只是想把车辆发给客户：

> 使用普通分享。

若确实要由其他销售承担正式 Recommendation：

> 先按既有规则正式变更 customer owner，再由新的 owner 创建。

---

## 6. Recommendation 的推荐人

Recommendation 创建时：

> `recommender` 永远记录创建当时的 customer owner。

后续：

- owner 变化；
- 原推荐人离职；
- 客户移交；

都不能改写历史推荐人。

---

## 7. Recommendation 适用车源

对具备 Recommendation 资格的客户：

- 名邦车源可以正式推荐；
- 4S 合作车源可以正式推荐；
- JYT 批发车可以正式推荐。

其中只有需要查价保护的批发车，Recommendation 才额外产生 R4 已冻结的：

> 客户 + 车辆 + 当前 `listing_cycle` 免费查价权。

名邦车 / 4S 合作车本身不因 Recommendation 额外产生批发车查价机制。

---

# 二、Recommendation 生命周期

## 8. 同车同周期重复推荐

同一：

> customer + vehicle + `listing_cycle`

已经存在有效 Recommendation 时：

- 再次推荐不重复创建第二条有效 Recommendation；
- 不重复授予查价权；
- 只新增一次新的推荐触达历史；
- 不改写原 Recommendation 的创建人、创建时间和原始推荐事实。

---

## 9. 多车推荐

同一客户可以同时拥有多辆有效 Recommendation。

一次勾选多辆车推荐时：

- UI 可以表现为一次操作；
- 业务记录仍按每辆车分别建立 Recommendation；
- 不合并成一条模糊的“推荐了一组车”记录。

---

## 10. Recommendation 再次打开

客户再次从同一 Recommendation 进入车辆时：

- 复用原 Recommendation；
- 不重复创建新 Recommendation；
- 不重复授予权限。

---

## 11. Recommendation 结束

Recommendation 可以人工结束。

可按权限执行结束操作的包括：

- 原推荐销售；
- 当前 owner；
- 管理范围内具有对应权限的经理 / 店长。

结束后：

- 历史永久保留；
- 不物理删除；
- 已经授予的当前 `listing_cycle` 查价权仍按 R4 规则持续到周期结束；
- 不自动关闭已经存在的咨询。

---

## 12. Recommendation 不按固定天数自动过期

Recommendation 不设计“创建后 N 天自动失效”。

当前有效作用结束的主要方式：

- 人工结束；
- 作废；
- 车辆真实下架；
- 对应 `listing_cycle` 结束。

历史始终保留。

---

## 13. Recommendation 创建错了

创建错误时：

- 不物理删除；
- 可以标记为“无效 / 作废 / 结束”；
- 已经产生的历史不删除；
- 已经授予的当前 `listing_cycle` 查价权不追回。

Recommendation 的核心对象创建后不可直接改写：

- `customer_id`
- 车辆
- `listing_cycle`
- 推荐人

建错时：

> 结束 / 作废原记录，再重新创建正确 Recommendation。

---

## 14. 同周期结束后再次正式推荐

原 Recommendation 已结束，但车辆仍处于同一个 `listing_cycle` 时：

- 可以创建一次新的 Recommendation，作为新的正式推荐行为；
- 客户如果已经拥有本周期查价权，不重复授予，也不重复扣查价额度。

---

## 15. 新 `listing_cycle` 必须重新 Recommendation

车辆真实下架后重新上架形成新的 `listing_cycle`：

- 旧 Recommendation 只保留历史；
- 不能自动成为新周期有效 Recommendation；
- 如仍要正式推荐，必须创建新周期 Recommendation；
- 旧周期查价权不能跨到新周期。

---

## 16. 推荐人离职 / inactive

推荐销售离职、inactive 或失去业务资格后：

- Recommendation 历史保留；
- 已经授予客户的当前 `listing_cycle` 免费查价权不追回；
- 后续如果产生咨询，按当前有效咨询负责人规则重新判断；
- 不能继续给离职销售产生新的业务责任。

---

# 三、普通分享

## 17. 普通分享的业务定义

普通分享只提供：

> **对应车辆的进入路径。**

它不授予：

- Recommendation 关系；
- 批发车查价权；
- customer owner；
- 咨询关系；
- 其他车辆权限；
- 原客户的任何业务权限。

---

## 18. 普通分享可以继续转发

普通分享链接允许被再次转发。

每次访问：

- 可以记录本次直接分享人 / 直接传播来源；
- 不建立多级权限继承；
- 不产生多级客户归属；
- 不改变客户原始来源；
- 不改变 customer owner；
- 不授予 Recommendation；
- 不授予查价权。

---

## 19. Recommendation 链接被其他客户打开

Recommendation 明确绑定具体 `customer_id`。

如果 A 的 Recommendation 链接被 B 打开：

- B 必须以自己的微信身份 / `customer_id` 正常进入；
- 对 B 来说，该链接只是一条进入该车辆的路径；
- B 不继承 A 的 Recommendation；
- 不继承 A 的免费查价权；
- 不继承 A 的 owner；
- 不继承 A 的咨询；
- 不继承 A 的其他客户权限。

B 的查价、咨询等业务全部按照 B 自己的身份和权限重新判断。

---

## 20. 普通分享链接不按固定天数失效

只要车辆当前仍可访问：

> 原普通分享链接可以继续打开。

车辆真实下架后：

- 链接仍保留历史来源；
- 打开时明确显示“车辆已下架 / 当前不可售”；
- 不允许继续产生新的该车咨询或 Recommendation。

---

## 21. 旧周期普通分享与重新上架

普通分享本质指向这辆车，而不是授予旧周期权限。

车辆进入新 `listing_cycle` 后：

- 旧普通分享仍可打开该车辆当前的新在售状态；
- 查价权限按新周期重新判断；
- Recommendation 按新周期重新判断；
- 咨询按新周期重新判断。

---

## 22. 离职销售旧普通分享

销售离职 / inactive 后，其以前发出的普通车辆分享：

- 车辆仍可售时，旧链接仍可打开；
- 原分享人历史继续保留；
- 不能再给离职销售形成新的 customer owner；
- 不能继续产生离职销售的新业务权限；
- 客户后续需要人工服务时，按当前 customer owner / 接客规则处理。

---

# 四、客户身份与登录

## 23. 客户端不存在匿名继续浏览状态

客户进入小程序后：

> 必须先完成微信身份识别 / 登录，才能继续正常浏览。

这个过程可以是：

- 无感识别；
- 无感登录；
- 或其他正常微信身份流程。

完成后立即建立稳定 `customer_id`。

因此后续：

- 分享；
- Recommendation；
- 查价；
- 咨询；

发生时，系统已经知道对应哪个 `customer_id`。

### 23.1 微信身份 ≠ 手机号绑定

微信登录不等于必须立刻绑定手机号。

手机号门槛继续按照 R5：

> 当客户进入需要人工服务等业务动作时，再按对应业务规则处理。

---

## 24. 换微信账号

同一设备切换成另一个微信账号后：

- 按另一个 `customer_id` 处理；
- 不能因为设备相同继承前一个客户的 Recommendation；
- 不继承查价权；
- 不继承咨询；
- 不继承 owner 关系。

---

## 25. 客户身份人工合并后的 R7 业务

R5 确认多个 `customer_id` 确属同一自然人并完成人工合并后：

当前仍有效的：

- Recommendation；
- 当前 `listing_cycle` 查价权；
- 未结束咨询；

迁移到保留的主 `customer_id`。

历史记录仍保留原客户身份来源，不抹掉合并前事实。

---

# 五、Consultation（咨询）

## 26. 咨询状态

统一采用：

- `pending`
- `processing`
- `resolved`
- `invalid`

正常流转：

1. 新咨询 → `pending`
2. 负责人开始实际处理 → `processing`
3. 正常结束 → `resolved`
4. 误触 / 重复 / 无效 → `invalid`

不设计“超时自动关闭”。

超时最多：

> 提醒。

---

## 27. 咨询重复创建

同一：

> customer + vehicle + 当前 `listing_cycle`

已经存在 `pending / processing` 咨询时：

- 不创建第二条咨询；
- 继续复用原咨询；
- 后续从新的 Recommendation、普通分享、搜索、收藏等入口再次进入，只记录新的触达历史。

原咨询的：

- 最初直接来源；
- 原负责人历史；

不能被后续入口改写。

---

## 28. 终态后再次咨询

原咨询已经：

- `resolved`
- `invalid`

之后客户又针对同一车辆再次发起咨询：

> 创建新的咨询记录。

旧咨询不覆盖、不复用。

---

## 29. 新 `listing_cycle` 的咨询

车辆进入新的 `listing_cycle` 后：

- 视为新的在售周期；
- 客户再次咨询时创建新的咨询记录；
- 旧周期咨询历史保留；
- 不直接复用旧周期咨询。

---

## 30. 车辆真实下架后的咨询

车辆真实下架后：

- 不允许新增该车咨询；
- 已存在的 `pending / processing` 咨询不自动删除；
- 由负责人继续处理到合适终态，例如 `resolved / invalid`。

---

## 31. 咨询直接来源

咨询创建时记录：

> 客户这一次实际进入咨询的直接来源。

例如：

- 某条 Recommendation；
- 普通分享；
- 搜索；
- 收藏；
- 其他入口。

规则：

- 不能简单取历史最近一次 Recommendation 作为咨询来源；
- 咨询创建后的最初来源不改写；
- 后续其他入口只新增触达记录。

---

## 32. Recommendation 与咨询来源

如果客户确实从某条 Recommendation 进入并发起咨询：

> 咨询关联该条 Recommendation。

Recommendation 后续即使：

- 结束；
- 作废；
- 失效；

也不反向修改这条咨询当时的来源事实。

---

## 33. 咨询负责人优先级

当咨询发生时，按以下顺序确定负责人：

1. 本次直接来源 Recommendation 的推荐销售，且该销售仍 active、仍具备当前业务处理资格；
2. 对应 demand 负责人；
3. 当前有效 customer owner；
4. 仍无人可承接时，进入正常合格接客池分配。

因为正式 Recommendation 只能由创建当时的 customer owner 创建，所以“推荐销售”本质上是创建推荐当时的 owner。

---

## 34. owner 变化不自动改咨询负责人

咨询已经进入 `processing` 后：

> customer owner 变化，不自动更换当前咨询负责人。

只有以下情况才调整咨询负责人：

- 正式移交；
- 当前负责人离职 / inactive；
- 当前负责人失去业务资格；
- 其他明确需要重新分配的业务事件。

---

## 35. 咨询负责人失去资格

当前咨询负责人：

- 离职；
- inactive；
- 失去业务处理资格；

则必须重新分配。

重新分配优先：

1. 当前有效 customer owner；
2. 正常合格接客池。

历史负责人记录保留。

---

## 36. 咨询可以正式移交

咨询可以转给另一名销售处理，但必须走正式移交。

必须记录：

- 原负责人；
- 新负责人；
- 操作人；
- 操作时间。

咨询负责人变化：

> 不自动改变 customer owner。

---

## 37. 咨询结束 / 作废权限

可以处理自己负责咨询的：

- 当前咨询负责人。

管理范围内具有对应权限的：

- 经理；
- 店长；

也可以处理。

其他销售不能随意：

- 结束；
- 作废；
- 修改别人负责的咨询。

---

## 38. 客户主动撤回咨询

客户明确表示“不咨询了”时：

- 不删除咨询；
- 正常结束该咨询；
- 记录为客户主动取消 / 结束。

`invalid` 主要用于：

- 误触；
- 重复；
- 明显无效咨询。

正常撤回不混入无效数据。

---

## 39. `invalid` 的边界

咨询标记 `invalid`：

- 只表示这条咨询本身无效；
- 不删除历史；
- 不改变 customer owner；
- 不改变 Recommendation；
- 不改变原始来源；
- 不修改其他业务对象。

---

## 40. Recommendation 结束不自动结束咨询

Recommendation 后续：

- 结束；
- 作废；
- 失效；

都不会自动关闭已经建立的 `pending / processing` 咨询。

咨询继续按照自己的生命周期完成。

---

## 41. 已有咨询时新增 Recommendation

同一客户 + 同一车辆当前周期已有未结束咨询时，又创建了新的有效 Recommendation：

- 不新建第二条咨询；
- 新 Recommendation 只作为新的推荐 / 触达事实；
- 不自动抢走当前咨询负责人；
- 不改写原咨询最初来源。

---

## 42. 咨询本身不授予批发价权限

发起咨询：

> **不会自动获得批发车数字价格查看权。**

咨询与查价是两套业务规则。

客户仍按 R4：

- 每日查价额度；
- 已有当前周期查价权；
- Recommendation 免费查价权；

判断是否可以看到受保护批发价。

---

## 43. 咨询负责人变更审计

每次咨询负责人调整必须保留：

- 原负责人；
- 新负责人；
- 操作人；
- 操作时间。

不得只保存“当前是谁负责”而覆盖历史。

---

## 44. 咨询内容可见范围

完整咨询内容可以按权限查看的包括：

- 当前咨询负责人；
- customer owner；
- 管理范围内具有对应权限的经理 / 店长；
- 明确参与该具体业务、且协作范围允许的协作销售。

其他销售：

> 不能因为能看到车辆，就查看客户完整咨询。

---

# 六、查价权限与 R7 的边界

## 45. 查价权绑定维度

批发车查价权继续按 R4：

> `customer_id + vehicle + listing_cycle`

绑定。

它不绑定：

- 设备；
- 某个微信入口；
- 某条分享链接。

客户换设备，只要还是同一个 `customer_id`：

> 当前周期已经取得的查价权继续有效。

---

## 46. Recommendation 免费查价

只有客户本身已经具备 Recommendation 资格，并由当前 owner 创建正式 Recommendation 后：

对于批发车：

> 免费授予该客户该车辆当前 `listing_cycle` 查价权。

该权限：

- 不消耗普通每日查价额度；
- 不解锁其他车辆；
- 不通过分享转给别人；
- 不因为 Recommendation 后续结束而追回；
- 不因为推荐销售离职而追回；
- 到当前 `listing_cycle` 结束时结束。

---

# 七、与 R5 / R6 的归属边界

## 47. Recommendation 不改变 customer owner

正式 Recommendation 是：

> 当前 owner 对自己客户的推荐行为。

因此 Recommendation 本身不产生：

- 抢客户；
- owner 变更；
- 第二个 owner。

---

## 48. 普通分享不改变 owner

已有 owner 的客户：

- 点击其他销售普通分享；
- 打开其他客户转发链接；

都不会改变当前 owner。

分享来源可以留痕，但只用于传播归因。

---

## 49. 咨询负责人 ≠ customer owner

必须区分：

- customer owner：长期正式客户负责人；
- consultation assignee：某一次咨询的当前处理人。

咨询负责人变化：

> 不自动改变 customer owner。

customer owner 变化：

> 也不自动重置已在处理中的咨询负责人。

---

# 八、关联 R1 的补充冻结规则

本分支过程中额外确认了一项组织权限规则，需要主窗口同步回 R1：

1. **同一门店允许配置多个店长**；
2. 员工仍然只有一个主归属门店；
3. 一个店长可以通过后台“权限 + 数据范围”被授权管理多个门店；
4. 不通过给同一个人建立多个门店员工身份实现跨店管理；
5. 当前员工业务体系不新增“区域经理 / 总经理”等更高角色；
6. 店长仍是当前员工业务体系最高管理角色；
7. System Admin 与员工业务体系分离，不属于“店长上一级”。

该补充不改变此前 R1：

> 单一主归属门店 + 额外数据范围授权

的基础设计。

---

# 九、本轮明确作废 / 修正的讨论项

以下讨论结论不得误吸收到主线：

### R7-14 旧版
旧版曾允许经理 / 店长 / 协作销售在某些场景创建正式 Recommendation。

**已作废。**

当前最终规则：

> 只有当前 customer owner 可以给自己负责且具备 Recommendation 资格的客户创建正式 Recommendation。

### R7-35 旧版
旧版讨论过“未识别 customer_id 的客户能否消耗查价次数”。

**该前提作废。**

当前规则：

> 客户进入小程序后先完成微信身份识别并建立 `customer_id`，之后才能正常浏览。

### R7-43
“非 owner 推荐销售给客户正式推荐”的前提不成立。

**整条删除。**

### R7-53
“Recommendation 创建后微信自动消息发送成功 / 失败”的前提不成立。

系统不负责自动微信发送。

**整条删除。**

### R7-57
曾讨论“普通客户先自己查价，后来又被正式 Recommendation”。

由于普通客户默认不具备 Recommendation 资格，该讨论前提不完整。

**整条删除。**

当前规则改为：

> 只有已明确开通 Recommendation 资格的客户才能被正式推荐。

---

# 十、R7 决策追踪表

| 决策 | 最终状态 |
|---|---|
| R7-01 | 咨询归因认本次实际进入咨询的直接来源 |
| R7-02 | 同客户同车同周期已有有效 Recommendation 时不重复建有效记录，只记新触达 |
| R7-03 | 普通分享只提供对应车辆进入路径，不授批发价权限或其他车辆权限 |
| R7-04 | processing 咨询不因 customer owner 变化自动换负责人 |
| R7-05 | Recommendation 推荐人仍 active 且有资格时才优先成为该次咨询负责人 |
| R7-06 | Recommendation 可结束；历史与当前周期已授查价权保留 |
| R7-07 | 已有未结束咨询时新增 Recommendation 不新建咨询、不抢负责人 |
| R7-08 | 车辆真实下架后禁止新咨询，已有咨询继续处理到终态 |
| R7-09 | invalid 只影响咨询本身，不改其他关系 |
| R7-10 | 已真实下架车辆禁止新建 Recommendation |
| R7-11 | 同 Recommendation 再次打开复用原记录 |
| R7-12 | 普通分享转给第三人不传递客户权限 |
| R7-13 | 咨询终态后再次咨询新建记录 |
| R7-14 | **新版：只有当前 customer owner 可创建正式 Recommendation** |
| R7-15 | 同周期原 Recommendation 已结束后允许重新正式推荐 |
| R7-16 | 咨询结束不自动结束 Recommendation |
| R7-17 | 下架后的历史分享 / Recommendation 链接只展示不可售，不产生新业务 |
| R7-18 | 一个客户可同时有多辆有效 Recommendation |
| R7-19 | 批量推荐 UI 可一次操作，但每辆车分别建 Recommendation |
| R7-20 | owner 变化不改写历史推荐人 |
| R7-21 | Recommendation 可按权限人工结束，历史与已授查价权保留 |
| R7-22 | Recommendation 结束不影响处理中咨询 |
| R7-23 | 咨询负责人失去资格后重分配，优先当前有效 owner，再接客池 |
| R7-24 | 新 listing_cycle 再咨询必须新建咨询 |
| R7-25 | 分享来源只做传播归因，不改 owner / Recommendation / 查价权 / 原始来源 |
| R7-26 | 客户主动撤回咨询按正常结束记录，不混入 invalid |
| R7-27 | 已有未结束咨询时其他入口继续复用原咨询 |
| R7-28 | 咨询负责人变更必须审计 |
| R7-29 | 离职销售旧普通分享仍可打开，但不再形成其新业务关系 |
| R7-30 | 咨询不会自动授予批发价权限 |
| R7-31 | 咨询最初直接来源创建后不改写 |
| R7-32 | 咨询负责人及有权限经理/店长可结束/作废，其他销售不可 |
| R7-33 | 咨询状态为 pending / processing / resolved / invalid，不超时自动关闭 |
| R7-34 | 查价权绑定 customer_id + vehicle + listing_cycle |
| R7-35 | **新版：客户先微信识别/登录并建立 customer_id 后才能正常浏览** |
| R7-36 | 普通分享转发不产生多级权限继承 |
| R7-37 | 正式 Recommendation 必须绑定具体 customer_id |
| R7-38 | Recommendation 链接被其他客户打开，只作为该客户自己的车辆进入路径 |
| R7-39 | 客户身份合并后迁移当前有效 R7 业务关系，历史来源保留 |
| R7-40 | 切换微信账号按另一 customer_id 处理，不继承前一客户权限 |
| R7-41 | Recommendation 不按固定天数自动过期 |
| R7-42 | 新 listing_cycle 必须重新 Recommendation |
| R7-43 | **删除：前提不成立** |
| R7-44 | 推荐人离职不追回当前周期已授查价权 |
| R7-45 | 同有效 Recommendation 再触达只新增触达历史 |
| R7-46 | 经理/店长不能代 owner 创建正式 Recommendation |
| R7-47 | 协作销售不能创建正式 Recommendation |
| R7-48 | recommender 固定为创建当时 customer owner |
| R7-49 | Recommendation 建错不物理删除，标记作废/结束，已授当前周期查价权不追回 |
| R7-50 | Recommendation 核心对象创建后不可直接修改 |
| R7-51 | Recommendation 后续作废不改写既有咨询来源 |
| R7-52 | 完整咨询内容按负责人 / owner / 管理权限 / 明确协作范围查看 |
| R7-53 | **删除：系统不负责微信自动消息发送** |
| R7-54 | 普通分享链接不按固定天数过期 |
| R7-55 | 旧周期普通分享可进入重新上架后的当前车辆状态，权限按新周期判断 |
| R7-56 | 咨询可正式移交负责人并审计，不自动改变 customer owner |
| R7-57 | **删除：普通客户默认无 Recommendation 资格** |
| R7-58 | 三类车源均可对具备资格的客户正式 Recommendation |
| R7-59 | **新版：Recommendation 资格仅由具备明确权限 + 数据范围的人开启/关闭** |
| R7-60 | 关闭资格只禁止未来新 Recommendation，不追回已有关系和当前周期查价权 |
| R7-61 | Recommendation 资格属于客户级资格，owner 变化后继续保留 |
| R7-62 | 重新开启资格不自动恢复已结束 / 作废 Recommendation |
| R7-63 | Recommendation 资格不自动到期 |
| R7-64 | Recommendation 资格随客户保留，不随 owner 变化丢失 |
| R7-65 | Recommendation 资格变化必须审计 |

---

# 十一、R7 最终结论

R7：

> **Recommendation / 分享 / 咨询 / 客户解锁**

已完成业务重审。

当前状态：

`BUSINESS_REVIEW = COMPLETE`

本轮已经形成完整可承接业务规则：

- Recommendation 客户资格；
- 正式 Recommendation 创建权限；
- Recommendation 生命周期；
- 普通分享与转发；
- 微信身份与 customer_id；
- Consultation 状态、来源、负责人、移交、终态；
- Recommendation 与查价权限边界；
- `listing_cycle` 边界；
- owner / 推荐人 / 咨询负责人三者关系；
- 相关审计与历史保留。

当前没有阻塞 R7 收口的剩余业务问题。

本轮只完成：

> **业务规则收口与冻结。**

**不得因为本文完成而自动启动数据库、接口、Worker、Storage、前端或 Tests 等工程整改。**

主窗口吸收本文后，应：

1. 将 R7 标记为 `BUSINESS_REVIEW = COMPLETE`；
2. 将本文作为 R7 当前最新业务规则；
3. 若与 CN11 旧 Recommendation / 分享 / 咨询 / 客户解锁规则冲突，仅在 R7 范围内以本文为准；
4. 保留与本文不冲突的既有规则；
5. 同步本文“关联 R1 的补充冻结规则”；
6. 不把业务冻结误认为工程已经实施；
7. 当前仍停留在 Phase 1｜业务重审；
8. 下一模块进入 R8：**锁车 / 候补 / 意向金 / Transaction / 换车**。
