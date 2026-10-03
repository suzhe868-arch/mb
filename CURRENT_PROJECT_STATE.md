# 名邦汽车 V1｜当前项目状态

> 更新时间：2026-10-04  
> 状态源：GitHub `suzhe868-arch/mb` / `main`  
> 业务权威语言：中文（zh-CN）

## 当前阶段

`PRODUCT_BASELINE_REBUILD / DOMAIN_RULE_RECONSTRUCTION / USER_REVIEW_GATE`

当前域：

> **PDM-09｜上游发布人电话 / Collector / 缓存 / 获取最新 / 敏感能力**

当前域状态：

> `USER_REVIEW_BATCH_2_PENDING`

## 已完成

- 六类证据完整导入并校验；
- 产品全域覆盖地图完整性校验 PASS；
- 25 个一级产品域冻结为重建覆盖骨架；
- IA V5 25 个 Canonical Object 均有 PDM 落点；
- 001～078 的 224/224 单元均可挂载；
- PDM-01：`COMPLETE`；
- PDM-02：`COMPLETE`；
- PDM-03：`COMPLETE`；
- PDM-04：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-04_最终完整规则.md`；
- PDM-05：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-05_最终完整规则.md`；
- PDM-06：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-06_最终完整规则.md`；
- PDM-07：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-07_最终完整规则.md`；
- 已新增并启用《用户全量审查四批门禁规范》。

## 新增硬门禁

从现在开始：

> **任何规则原子都必须经过用户本人审查，不能因模型判断为稳定一致、明确废弃、已知情修改等而自动进入最终产品基线。**

每个 PDM 固定：

1. Batch 1｜稳定一致项；
2. Batch 2｜明确废弃 / 明确替代；
3. Batch 3｜明确知情修改 / 后续明确新增；
4. Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择；
5. 四批结束后再做一次 PDM 完整最终总览。

每批都必须停下来等用户确认。

## 当前 PDM-05

已按当前 GitHub 原始证据完成 PDM-05 Batch 1 稳定一致项筛选，共形成：

> **P05-A01～P05-A09**

工作版：

> `07_重建工作区/PDM-05_车型主数据年款JYT车型映射MODEL_MISSING_规则原子重建_工作版.md`

Batch 1 当前状态：

> `USER_REVIEW_PENDING`

本批只纳入前史、R3、9/19 与后续承载之间未发现真实业务反转的稳定一致项。JYT 未映射时精确事实使用边界、VR-P-010 与本地映射关系、MODEL_MISSING 原地新建车型 Action 冲突、重复车型合并等遗漏、明确废弃机制等均已留到后续批次，不在 Batch 1 偷偷收口。

## 2026-09-24｜PDM-05 车型 ID 映射口径修正

用户明确确认：

- 车型身份以 JYT `model_id` 为上游身份键；
- 通过 source mapping 映射到本地 `vehicle_model_id`；
- 两边 ID 数值不要求相同；
- 车型名称仅用于展示 / 快照 / 搜索 / Admin 辅助判断，不作为身份主键；
- 品牌 / 车系是否与 JYT 共用相同 ID 值，当前不作假定；
- P05-A03 / A05 / A06 涉及的映射确认、修正、冲突处理统一由后台 Admin 处理。

当前 Batch 1 已确认：P05-A03、P05-A05、P05-A06。
仍待审：P05-A01、P05-A02、P05-A04、P05-A07、P05-A08、P05-A09。

## 2026-09-24｜PDM-05 Batch 1 完成并进入 Batch 2

P05-A01～P05-A09 已全部用户确认。

其中：

- P05-A03 已修正为 JYT `model_id` → 本地 `vehicle_model_id` 的 ID-based source mapping；
- P05-A07 当前实际管理主体收口为后台 Admin，普通销售不得处理车型主数据/映射/冲突；
- Batch 1 状态：`COMPLETE_USER_CONFIRMED`。

当前进入：

> `PDM-05 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

Batch 2 待审：P05-B2-01～P05-B2-05。

## 2026-09-24｜PDM-05 Batch 2 完成并进入 Batch 3

P05-B2-01～P05-B2-05 已全部用户确认，Batch 2 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-05 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / USER_REVIEW_PENDING`

当前唯一待审：P05-A10。

## 2026-09-24｜PDM-05 Batch 3 完成并进入 Batch 4

用户确认：

- P05-A10：本地车型映射未完成，不阻塞 JYT 已明确车型事实用于正常业务；
- P05-A11：只要 JYT 已明确品牌、车系、年款、具体车型/款式等足够事实，即使 `vehicle_model_id` 尚未映射，也可参加精确搜索、筛选和自动 Matching。

因此“本地车型归属”和“车辆自身车型事实”正式分层。

当前进入：

> `PDM-05 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`

Batch 4 待审：P05-B4-01、P05-B4-02。

## 2026-09-24｜PDM-05 Batch 4 完成并生成最终总览

用户完成 Batch 4 裁决：

- P05-B4-01：后台 Admin 可直接新增缺失品牌 / 车系 / 具体车型并完成绑定；若来源于 JYT 采集车型，应在本次处理或紧接后的同一后台流程中尽快同步建立 `JYT model_id → local vehicle_model_id` source mapping，避免长期悬空；
- P05-B4-02：后台 Admin 可修正车型层级、合并重复车型、迁移车辆引用与 JYT mapping；真实旧车型长期保留。

至此 PDM-05 四批用户审查全部完成。

已生成：

> `07_重建工作区/PDM-05_最终完整规则总览_待用户批准.md`

当前状态：

> `FINAL_REVIEW_PENDING`

未经用户最终批准，不得将 PDM-05 标记 COMPLETE，不得进入 PDM-06。

## 2026-09-24｜PDM-05 最终完成

用户最终明确批准 PDM-05《最终完整规则总览》。

- PDM-05 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-05_最终完整规则.md`；
- Decision Register 已登记 `PDM05-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-05，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-06｜人工车辆发布 / 草稿 / VIN / 删除边界**

## 2026-09-24｜PDM-06 Batch 1 已形成

已严格按 GitHub 当前原始证据完成 PDM-06 稳定一致项筛选，共形成：

> **P06-A01～P06-A11**

工作版：

> `07_重建工作区/PDM-06_人工车辆发布草稿VIN删除边界_规则原子重建_工作版.md`

本批只纳入没有发现真实业务反转的规则，包括人工来源边界、草稿/正式车分层、最低发布字段、0 图发布、价格可空、VIN 非必填、正式发布校验、删除边界与授权编辑。

多草稿 vs DRAFT_RESUME、VIN 精确重复 Gate、已发布车辆“保存修改”正式生效、source_type 新建交互等已留后续批次，不在 Batch 1 偷偷收口。

## 2026-09-24｜PDM-06 Batch 1 完成并进入 Batch 2

用户确认 P06-A01～P06-A11 全部通过；P06-A12 多草稿管理已提前确认。

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-06 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

Batch 2 待审：P06-B2-01～P06-B2-08。

## 2026-09-24｜PDM-06 Batch 2、3 完成并进入 Batch 4

用户确认 P06-B2-01～P06-B2-08 全部通过。

Batch 3 经 GitHub 证据复核没有新的未审原子：
- P06-A12 多草稿规则已由用户本轮明确确认；
- source_type 发布后可修改规则已在 PDM-04 正式批准并由 PDM-06 继承。

当前进入：

> `PDM-06 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`

待审：P06-B4-01～P06-B4-05。

## 2026-09-24｜PDM-06 Batch 4 完成并生成最终总览

用户确认 P06-B4-01～P06-B4-05 全部通过。

至此 PDM-06 Batch 1～4 全部完成。

已生成：

> `07_重建工作区/PDM-06_最终完整规则总览_待用户批准.md`

当前状态：

> `FINAL_REVIEW_PENDING`

未经用户最终批准，不得将 PDM-06 标记 COMPLETE，不得进入 PDM-07。

## 2026-09-24｜PDM-06 最终完成

用户最终明确批准 PDM-06《最终完整规则总览》。

- PDM-06 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-06_最终完整规则.md`；
- Decision Register 已登记 `PDM06-GATE-FINAL`；
- 当前进入 PDM-07。

## 2026-09-24｜PDM-07 Batch 1 已形成

已基于 R9 / R10 / R11 / R12、CN11、IA V5 与 001～078 M10 形成稳定一致项：

> **P07-A01～P07-A11**

工作版：

> `07_重建工作区/PDM-07_车辆档案车况客户可见报告成交交付材料核验_规则原子重建_工作版.md`

结构化车况孤儿规则、档案维护 Action、客户可见性设置动作、交付材料配置机制等留后续批次。

## 2026-09-24｜PDM-07 Batch 1 完成并进入 Batch 2

用户确认 P07-A01～P07-A11 全部通过。

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-07 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

待审：P07-B2-01～P07-B2-04。

## 2026-09-24｜PDM-07 Batch 2、3 完成并进入 Batch 4

用户确认 P07-B2-01～P07-B2-04 全部通过。

Batch 3 经当前 GitHub 证据复核无新的未审原子，已关闭。

当前进入：

> `PDM-07 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`

待审：P07-B4-01～P07-B4-05。

## 2026-09-24｜PDM-07 Batch 4 完成并生成最终总览

用户确认 P07-B4-01～P07-B4-05 全部通过。

其中 P07-B4-01 已按 JYT 原始车况描述 + JYT `sub.tags` 的真实链路收窄：
- 不重复人工录入批发车车况；
- 标签保留来源 provenance；
- 标签/描述既可展示，也可作为确定性 Matching 输入；
- 只做必要标准化，unknown 不猜。

至此 PDM-07 Batch 1～4 全部完成。

已生成：

> `07_重建工作区/PDM-07_最终完整规则总览_待用户批准.md`

当前状态：

> `FINAL_REVIEW_PENDING`

未经用户最终批准，不得将 PDM-07 标记 COMPLETE，不得进入 PDM-08。

## 2026-09-25｜PDM-07 最终完成并进入 PDM-08

用户最终批准 PDM-07《最终完整规则总览》。

- PDM-07 状态：`COMPLETE`；
- 正式规则：`07_重建工作区/PDM-07_最终完整规则.md`；
- Decision Register 已登记 `PDM07-GATE-FINAL`；
- PDM-08 Batch 1 已形成：P08-A01～P08-A12。

## 2026-09-25｜PDM-01～07 反向覆盖校验

已完成正式反向覆盖校验。

报告：

> `07_重建工作区/PDM-01至07_反向覆盖校验报告_2026-09-25.md`

结果：
- PDM-01：PASS
- PDM-02：PASS
- PDM-03：PASS
- PDM-04：FAIL
- PDM-05：PASS_WITH_HANDOFF_GAP
- PDM-06：FAIL
- PDM-07：PASS

当前发现 5 个补漏项，尚未达到 `UNMAPPED=0`。

PDM-08 临时暂停，先完成反向覆盖补漏 Gate。

## 当前唯一下一步

> **审查 PDM-01～PDM-07 反向覆盖校验发现的 5 个补漏项，然后停止等待用户确认。**

## 当前禁止事项

- 不自动批准 PDM-06 Batch 1；
- 未经用户确认不得进入 PDM-06 Batch 2；
- 不得跳过任何 PDM-06 用户审查批次；
- 不得在 PDM-06 最终总览批准前进入 PDM-07；
- 不得静默改写 PDM-01～PDM-05 已确认规则；
- 不使用旧聊天记忆替代仓库证据；
- 不修改 IA / Low-Fi；
- 不执行 Engineering Delta。

## 当前产品基线状态

`NOT_READY`

## 2026-09-24｜R3/R4/R5 原件补回

已新增恢复证据目录：

> `01_证据_A_9月19日产品业务锚点/补回原始证据_2026-09-24/`

当前已补回 R3、R4、R5 原始业务重审最终总结；R2 已校正为“当时没有独立分支最终原件”，不再误判为缺失。

PDM-01 的 R5 证据重基准已完成：

- Batch 1 / Batch 2 已确认项共 20 条；
- 唯一真实冲突组 `P01-A04 + P01-B2-01` 已由用户裁决继续 A04，并登记为主动新修改；
- 其余 18 条已确认项无真实冲突；
- A12 / A13 / A16 的原始证据强度或边界得到补全，但仍须按四批门禁接受用户审查；
- R3 对 PDM-01 无直接身份规则；R4 仅有价格/查价与客户身份的交叉边界，不改写 PDM-01 身份规则。


## 2026-09-24｜CN11 精选业务原始证据补回

已新增：

> `01_证据_A_9月19日产品业务锚点/前置历史原始证据_2026-09-17_CN11/`

本次仅提取 21 份产品/业务高价值 Markdown 原件，未导入 DB/SQL、OpenAPI、代码、Starter、测试、SVG、CSV 等工程文件。

使用边界：

- CN11 是 9/19 之前的历史原始证据，不是当前最终 Authority；
- 001～078 继续作为历史问题雷达；
- 以后涉及 CN11 的规则原子，应优先回 CN11 原件核验，再与 9/19、9/22/后续证据比较；
- 不因补回 CN11 自动推翻已经过用户审查的规则；发现真实冲突必须显式交用户裁决。

PDM-01 当前已完成 Batch 1～4，状态为 `FINAL_REVIEW_PENDING`。
## 2026-09-24｜Customer Merge 主动取消

用户明确决定 V1 不建设 Customer Merge：不同微信身份对应的不同 `customer_id` 始终保持独立，即使现实中确认属于同一自然人也不做自动/人工 Merge。一个手机号允许登记在多个 Customer；手机号搜索可返回多个命中，但不触发合并。该裁决主动覆盖此前 A09 / A10 / B2-02，并使 A11 / A12 关闭为 N/A。


## 2026-09-24｜PDM-01 Batch 4 完成

用户已确认 A13 与 A16。A13 明确“手机号是可变联系方式，换手机号不是换 Customer”，与 A14 多手机号管理规则统一；A16 采用客户停用/恢复 V1 最小闭环。至此 Batch 4 全部完成，PDM-01 四批用户审查结束，进入 `FINAL_REVIEW_PENDING`。下一步仅生成最终完整规则总览，未经用户最终批准不得进入 PDM-02。


## 2026-09-24｜PDM-01 最终完成

用户已明确批准 PDM-01《最终完整规则总览》。

- PDM-01 状态：`COMPLETE`
- 正式规则文件：`07_重建工作区/PDM-01_最终完整规则.md`
- 最终候选文件保留作为审计轨迹；
- PDM-01 后续不得被其他 PDM 静默改写；若发现真实跨域冲突，必须重新显式提交用户裁决。

当前进入：

> **PDM-02｜员工身份 / 组织 / 角色 / 权限 / 数据范围 / System Admin / 4S 身份**


## 2026-09-24｜PDM-02 Batch 1 完成

用户明确确认 P02-A01～P02-A15 全部同意。Batch 1 状态：`COMPLETE_USER_CONFIRMED`。下一步准备 Batch 2，未经用户审查不得自动批准。


## 2026-09-24｜PDM-02 Batch 2 完成

用户明确确认 Batch 2 剩余 12 条全部同意。最终结果：B2-02 撤回并由 P02-A16 反转替代；B2-04 已确认；B2-01、B2-03、B2-05～B2-14 全部确认。Batch 2 状态：`COMPLETE_USER_CONFIRMED`。下一步准备 Batch 3，未经用户审查不得自动批准。


## 2026-09-24｜PDM-02 Batch 3 完成

用户确认 P02-A18：一个 4S 成员账号直接代表一家合作 4S 店/合作主体；不建设 4S 店组织层级，不使用 cooperation scope。4S 账号新增、启用、停用、基础资料及允许范围内业务 permission 配置由名邦后台具备相应管理权限的 active 内部管理人员统一处理；4S hard DENY 不得绕过。至此 A16/A17/A18 全部确认，Batch 3 状态：`COMPLETE_USER_CONFIRMED`。


## 2026-09-24｜System Admin 控制平面模型修正

用户明确修正此前过度限制：System Admin 与员工业务身份继续分离，但其角色应是系统治理/控制平面，而不是“不能管理业务权限”。新增 P02-A19：System Admin 可治理员工与4S账号、角色、permission、data scope、角色模板、接客配置等，但 System Admin 身份本身不获得员工业务执行权；同一真人要亲自做业务必须使用独立员工身份；hard DENY 不可绕过。该规则部分修正 A17/A18，并将 B4-02“店长由谁任命”关闭为由 System Admin 配置。


## 2026-09-24｜PDM-02 Batch 4 完成

用户明确“其他的都同意”，确认 B4-01、B4-03、B4-04、B4-05、B4-06；B4-02 已由 P02-A19 提前关闭。至此 Batch 4 六项全部完成，状态：`COMPLETE_USER_CONFIRMED`。

已生成最终候选：

> `07_重建工作区/PDM-02_最终完整规则总览_待用户批准.md`

当前进入 `FINAL_REVIEW_PENDING`，未经用户最终批准不得将 PDM-02 标记 COMPLETE，也不得进入 PDM-03。


## 2026-09-24｜PDM-02 最终完成

用户最终确认 PDM-02《最终完整规则总览》无其他问题，并特别确认：普通销售、经理、店长都可以接待客户；经理和店长满足 active + eligible + accepting 时可进入接客池并成为 Customer owner；4S 成员与 System Admin 不进入接客池。

- PDM-02 状态：`COMPLETE`
- 正式规则文件：`07_重建工作区/PDM-02_最终完整规则.md`
- 最终候选文件保留作为审计轨迹；
- 后续 PDM 不得静默改写 PDM-02，发现真实跨域冲突必须显式交用户裁决。

当前进入：

> **PDM-03｜Owner / 来源归因 / 分享注册 / 转介绍 / 接客 / 离职交接**


## 2026-09-24｜PDM-03 Batch 1 已形成

已严格按 GitHub 当前原始证据完成 PDM-03 稳定一致项筛选，共形成 P03-A01～P03-A13 十三条候选规则。自然注册立即分配 owner、普通客户车辆转发 SOURCE_ONLY、接客池异常为空 owner_assignment_pending 等后续主动修改明确留到后续批次，不伪装成历史稳定项。当前状态：`USER_REVIEW_BATCH_1_PENDING`。


## 2026-09-24｜PDM-03 Batch 1 完成

用户明确“没问题，进行下一步”，确认 P03-A01～P03-A13 十三条稳定一致项全部通过。Batch 1 状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 2 筛选，共形成 P03-B2-01～P03-B2-09 九条明确废弃 / 替代 / DO_NOT_RESTORE 候选项，当前等待用户审查。


## 2026-09-24｜PDM-03 Batch 2 完成

用户明确“全部确认”，确认 P03-B2-01～P03-B2-09 九条明确废弃 / 替代 / DO_NOT_RESTORE 全部通过。Batch 2 状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 3 筛选，共形成三条待审：P03-A14 自然注册立即形成 owner、P03-A15 普通客户车辆转发 SOURCE_ONLY 与直接转介绍分离、P03-A16 接客池异常为空 owner_assignment_pending。


## 2026-09-24｜PDM-03 A15 客户分享归属规则反转

用户明确修正此前“普通客户车辆转发仅 SOURCE_ONLY”的方案：客户车源分享本身可以作为转介绍/获客归属链。对尚无正式 owner 的新客户 B，A 分享车源链接给 B，B 通过该链接进入后，按分享链实际绑定的销售建立 current owner，同时保留 A→B 的来源/推荐关系。A 转发张三链接则 B 归张三；转发李四链接则 B 归李四；A 使用自己的客户分享链接时，也保留 A 为来源客户/间接推荐人，并按该分享链对应销售归属 B。已有正式 owner 的老客户仍不得被分享链接抢走。

该裁决显式覆盖 P01-A04 中“普通客户侧车辆转发仅 SOURCE_ONLY、不据此分配 owner”的子句；P01-A04 其余自然注册/直接转介绍规则继续有效。

尚未裁决：A 发出链接后、B 打开前若 A 的 current owner 发生变化，旧链接的销售绑定时点。该项留 PDM-03 Batch 4。


## 2026-09-24｜PDM-03 Batch 3 完成

用户明确“十四十六都同意”，确认 P03-A14 与 P03-A16；P03-A15 已在前一轮按“客户分享即转介绍/获客归属链”主动修正并确认。至此 Batch 3 三项全部完成，状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 4 缺口扫描，共形成 P03-B4-01～P03-B4-04 四条待审项，重点关闭客户分享链销售绑定时点、A→B 关系留存、失效销售兜底、分享归属与自然轮询的并发顺序。


## 2026-09-24｜PDM-03 Batch 4 完成

用户明确“这个问题同意”，确认 P03-B4-01～P03-B4-04 四条冲突 / 缺口 / 新选择全部通过。至此 PDM-03 四批门禁全部完成。

已生成最终候选：

> `07_重建工作区/PDM-03_最终完整规则总览_待用户批准.md`

当前进入 `FINAL_REVIEW_PENDING`，未经用户最终批准不得将 PDM-03 标记 COMPLETE，也不得进入 PDM-04。


## 2026-09-24｜PDM-03 最终完成

用户最终明确批准 PDM-03《最终完整规则总览》。

- PDM-03 状态：`COMPLETE`
- 正式规则文件：`07_重建工作区/PDM-03_最终完整规则.md`
- 最终候选文件保留作为审计轨迹；
- 后续 PDM 不得静默改写 PDM-03，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-04｜三类车源 / JYT 同步 / 车辆身份 / Listing Cycle / 隐藏 / 下架 / 重上架 / 一键转名邦**


## 2026-09-24｜PDM-04 Batch 1 已形成

已严格按 GitHub 当前原始证据完成 PDM-04 稳定一致项筛选，共形成 P04-A01～P04-A14 十四条候选规则。

明确未混入本批的后续变化/冲突包括：人工名邦/4S source_type 双向修改、采集批发车自动隐藏、一键转名邦后的新名邦展示状态、一键转名邦具体 permission，以及图片/价格等跨域细节。

当前状态：`USER_REVIEW_BATCH_1_PENDING`。


## 2026-09-24｜PDM-04 Batch 1 完成

用户明确“全部都同意”，确认 P04-A01～P04-A14 十四条稳定一致项全部通过。Batch 1 状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 2 筛选，共形成 P04-B2-01～P04-B2-13 十三条明确废弃 / 替代 / DO_NOT_RESTORE 候选项，当前等待用户审查。


## 2026-09-24｜PDM-04 Batch 2 完成与转名邦模型反转

用户确认 Batch 2 其余项均无争议，并主动反转 B2-05：一键转名邦不再创建第二个 vehicle，而是在同一 vehicle_id 上完成批发→名邦来源转换；永久保留 JYT car_code / 来源历史，并阻止后续 JYT 同 car_code 重新生成批发在售。B2-06/B2-07 已按该模型同步修正。用户同时确认 locked 批发车可直接转名邦，Lock 保持绑定同一 vehicle_id。


## 2026-09-24｜PDM-04 Batch 3 已形成

P04-A15/A16 已由用户提前确认；新增四条待审：A17 source_type 名邦↔4S 后续修改、A18 采集批发自动隐藏、A19 转名邦后不走草稿二次发布、A20 一键转名邦不设额外独立 permission。listing_cycle、pre-conversion hidden、trading/completed 与 car_code 被上游复用冲突留 Batch 4。


## 2026-09-24｜PDM-04 Batch 3 完成

用户明确确认 A17～A20，其中 A18 按“每条自动隐藏规则独立；规则之间 OR；单条规则内不同字段 AND、同字段多个值 OR”的补充口径落版。加上此前已确认的 A15/A16，Batch 3 六项全部完成。

随后形成 Batch 4 五条待审：listing_cycle、hidden 原因继承、trading/completed 转换、car_code 复用冲突、conversion 单向性。


## 2026-09-24｜PDM-04 A18 适用车源范围扩展与 B4-02 完成

用户补充确认：自动/批量隐藏规则增加显式 `source_scope`，可多选批发、名邦、4S，至少选择一类；未选择不得生效，不默认影响三类全部车源。原“采集批发自动隐藏”继续作为 `source_scope=批发` 的一种配置。

车辆来源变化后，自动隐藏规则按新的 `source_type` 与各规则 `source_scope` 重新计算。由此 P04-B4-02 已正式关闭：仅适用于批发的自动隐藏原因在批发→名邦后失效；scope 含名邦且条件仍命中的规则继续 hidden；人工 hidden 与其他有效 hidden 原因继续保留。

当前 Batch 4 剩余待审：P04-B4-01、P04-B4-03、P04-B4-04、P04-B4-05。


## 2026-09-24｜PDM-04 Batch 4 完成与最终总览生成

用户最终完成 Batch 4 裁决：

- P04-B4-01：同 vehicle 批发→名邦继续当前 listing_cycle，不新建 cycle；
- P04-B4-02：此前已确认，按 source_type + source_scope 重算自动 hidden，人工 hidden 保留；
- P04-B4-03：locked / trading 允许同 vehicle 转名邦，completed 禁止；
- P04-B4-04：若已转名邦历史 car_code 后续出现明显不同实体身份，系统自动屏蔽/抑制该冲突上游记录，不进入人工决断，不创建新的可售批发 vehicle；
- P04-B4-05：批发→名邦为单向经营转换，不提供转回批发。

至此 PDM-04 四批用户审查全部完成。

已生成：

> `07_重建工作区/PDM-04_最终完整规则总览_待用户批准.md`

当前状态：`FINAL_REVIEW_PENDING`。未经用户最终批准，不得将 PDM-04 标记 COMPLETE，不得进入 PDM-05。


## 2026-09-24｜PDM-04 最终完成

用户最终明确批准 PDM-04《最终完整规则总览》。

- PDM-04 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-04_最终完整规则.md`；
- Decision Register 已登记 `PDM04-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-04，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-05｜车型主数据 / 年款 / JYT 车型映射 / MODEL_MISSING**


## 2026-09-24｜PDM-05 Batch 1 已形成

已严格按 GitHub 当前证据完成 PDM-05 稳定一致项筛选，形成 P05-A01～P05-A09 九条候选规则。存在知情修改、废弃项、IA Action Contract 冲突及历史细节遗漏的内容均未混入本批。

当前状态：`USER_REVIEW_BATCH_1_PENDING`。未经用户审查不得自动批准或进入 Batch 2。


## 2026-10-04｜PDM-08 最终完成

用户最终明确批准 PDM-08《最终完整规则总览》。

- PDM-08 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-08_最终完整规则.md`；
- IMG-001～IMG-030：30/30 已有明确去向；
- `SOURCE_DECISION_COVERAGE = 100%`；
- `UNMAPPED = 0`；
- Decision Register 已登记 `PDM08-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-08，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-09｜上游发布人电话 / publisher_id / 电话获取与缓存边界**


## 2026-10-04｜PDM-09 Batch 1 完成并进入 Batch 2

已严格按 GitHub 当前证据重新完成 PDM-09 Batch 1 审查，用户明确“全部同意”：

> **P09-A01～P09-A11，共 11 条。**

工作版：

> `07_重建工作区/PDM-09_上游发布人电话Collector缓存获取最新敏感能力_规则原子重建_工作版.md`

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

本批正式确认的核心边界包括：

- 电话按 `source_platform + upstream_publisher_id` 归属与缓存；
- 客户端 / 客户安全视图禁止展示上游电话；
- 电话为独立敏感能力；
- 唯一上游链为 Mingbang Backend → Collector → JYT；
- 有缓存时普通查看 / 拨打 cache-first，不重复请求上游；
- “获取最新电话”强制刷新，失败不覆盖旧缓存；
- phone history 只做历史 / 审计；
- 同 publisher latest single-flight，不同 publisher 可并发；
- 拨打只调系统拨号器，不新增独立 call permission；
- 电话敏感行为必须审计；
- 名邦 P03 只管理 Collector 连接，不管理 JYT 电话凭证 / Header / callCode。

当前进入：

> `PDM-09 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

未经用户确认不得自动进入 Batch 3。


## 2026-10-04｜PDM-09 Batch 2 已形成

经 CR-007、电话旧契约清理报告、R11/R12、Decision Register 与 001～078 复核，当前明确废弃 / 替代项共 3 组：

> **P09-B2-01～P09-B2-03**

分别为：

1. 禁止恢复 `car_code` / Vehicle 维度电话查询与缓存身份；
2. 禁止恢复名邦直连 JYT / 名邦管理 JYT 电话凭证与旧凭证 API；
3. 禁止新增独立 `can_call_wholesale_phone` 拨打权限。

当前状态：

> `PDM-09 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

真实冲突与证据缺口不混入本批。


## 2026-10-04｜PDM-09 Batch 2 完成

用户确认 P09-B2-01～P09-B2-03 全部通过。

其中 P09-B2-03 最终表述明确为：

> 有上游电话权限的员工，在自己有权访问的批发车源中，可以直接查看、获取最新电话并发起拨号；不再额外设置一个单独的“拨打电话权限”。

Batch 2 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-09 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / EVIDENCE_REVIEW`


## 2026-10-04｜PDM-09 Batch 3 证据筛选完成

经 9/20 IA ChangeLog、9/22 冻结台账、IA V5、实际 Low-Fi 与 001～078 复核：

> **Batch 3 无新的未审业务规则原子。**

电话状态页、latest 失败态、统一投影及 P03 页面均属于既有电话规则的 IA / Low-Fi 承载补全，不构成后续知情修改或新业务规则。

当前状态：

> `PDM-09 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / USER_REVIEW_PENDING_NO_NEW_ATOMS`

用户确认前不得进入 Batch 4。


## 2026-10-04｜PDM-09 Batch 3 完成并进入 Batch 4

用户明确确认 Batch 3“无新增原子”结论。

Batch 3 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-09 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / EVIDENCE_REVIEW`


## 2026-10-04｜PDM-09 Batch 4 已形成

经主底盘、CN11 前史、9/22、IA V5、实际 Low-Fi 与 001～078 反查，形成 6 条真正需要用户审查的冲突 / 遗漏 / 缺口：

> **P09-B4-01～P09-B4-06**

覆盖：

1. cache miss 拨打是否自动按需取号；
2. `expires_at` 是否阻断普通缓存；
3. 同步阶段是否禁止批量预取电话；
4. Collector 新配置测试失败后的激活 / 回滚；
5. P03-05 publisher 电话缓存页真实内容；
6. 上游电话是否提供复制动作。

当前状态：

> `PDM-09 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`
