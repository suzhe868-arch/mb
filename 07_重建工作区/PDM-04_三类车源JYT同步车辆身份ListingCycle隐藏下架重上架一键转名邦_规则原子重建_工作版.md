# PDM-04｜三类车源 / JYT 同步 / 车辆身份 / Listing Cycle / 隐藏 / 下架 / 重上架 / 一键转名邦｜规则原子重建工作版

> 日期：2026-09-24  
> 状态：`USER_REVIEW_BATCH_4_PENDING`  
> 说明：严格按当前 GitHub 原始证据重新重建，不使用旧聊天记忆替代证据。PDM-01～PDM-03 已正式 COMPLETE；PDM-04 Batch 1～3 已完成用户审查，当前开放 Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择，共 5 条。

## 1. 本轮证据范围

- 9/19 主底盘：
  - `Phase1_当前唯一业务合并基线.md`
  - 重点：R2《三类车源 / JYT 同步 / 车源生命周期》
- 9/17 及更早 CN11 原始证据：
  - `名邦汽车_V1_DECISION_REGISTER_2026-09-06.md`
  - `名邦汽车_V1_SSOT_CHECKPOINT_2026-09-06.md`
  - `02_V1_FEATURE_SCOPE_REGISTER.md`
- 后续承载：
  - `IA_CURRENT.md`
  - `IA_V5_PERMISSION_CONTRACT.md`
- 9/22 冻结台账：
  - `02_用户视觉评审问题总台账_冻结版.md`
- 已正式冻结的跨域约束：
  - `PDM-01_最终完整规则.md`
  - `PDM-02_最终完整规则.md`
  - `PDM-03_最终完整规则.md`

## 2. Batch 1｜稳定一致项

| Atom | 当前候选规则 | 前后证据结论 | 状态 |
|---|---|---|---|
| P04-A01 | V1 当前只存在三类车源：①批发车源（JYT/上游同步）；②名邦车源；③4S 合作车源。批发车由上游集成产生；名邦与4S属于人工车源体系。 | 9/19 R2 §2、后续 C/E/P 页面来源分类一致；未发现后续增加第四种正式车源类型 | `USER_CONFIRMED` |
| P04-A02 | Vehicle 的“真实资源状态 / 平台展示状态 / 业务占用状态”必须分层，不得合成一个巨大 `vehicle_status`。批发资源至少区分 active/offline；人工资源至少区分 available/unavailable/sold_external；平台层区分 visible/hidden；业务层由 Lock/Transaction 等独立事实表达。 | CN11 DEC-043、9/19 C3/R2、IA Vehicle/Listing Cycle current 一致 | `USER_CONFIRMED` |
| P04-A03 | JYT 上游原始车辆事实与上游原始价格为**只读来源事实**。上游同步可以更新其允许更新的上游字段，但普通人工不得直接改写；上游同步不得覆盖名邦本地业务字段、人工 hidden、客户业务关系等本地事实。 | 9/19 R2 §3/§6、9/22 VR-E-006、IA Current V01～V03 一致 | `USER_CONFIRMED` |
| P04-A04 | JYT 导入/普通同步的业务 Actor 是上游集成服务，而不是虚构“人工逐车操作员”；人工只处理连接配置、异常与需要人工确认的事项。系统同步必须保留来源、时间与处理结果日志。 | IA Current S5-C09、9/19 R2 同向；无后续反转 | `USER_CONFIRMED` |
| P04-A05 | 对正常 JYT 同步，同一上游 `car_code` 默认复用既有车辆身份，不因普通更新或重新出现而静默新建第二个同源 vehicle。若品牌/车系/具体车型/年款等核心身份发生明显冲突，必须进入身份异常/人工核验，不得静默覆盖。 | 9/19 R2 §8、IA Current Vehicle identity conflict 一致 | `USER_CONFIRMED` |
| P04-A06 | 批发车由上游确认真实下架/offline 后，名邦侧同步退出正常可售：不再公开展示、不再参与正常匹配、不再新增普通销售业务；但已存在的 Lock / Transaction 等正式历史或进行中业务事实不得被直接删除，交由各自业务生命周期处理。 | 9/19 R2 §7、CN11 状态分层、IA Vehicle lifecycle 一致 | `USER_CONFIRMED` |
| P04-A07 | `hidden` 与真实下架/offline严格不同。hidden 只暂停公共展示，不改变底层真实在售事实；批发车 hidden 后上游普通同步仍可更新资料，但**不得因为普通同步自动解除 hidden**；恢复显示属于名邦本地动作。 | CN11 DEC-044、9/19 C3/R2 §9/§10、9/22 VR-P-004/VR-X-005 一致 | `USER_CONFIRMED` |
| P04-A08 | `listing_cycle` 只在**真实不可售/失效 → 再次真实可售**时开启新周期。hidden→visible、普通编辑、改价均不新建 cycle；旧周期永久保留历史。人工车与批发车确认是同一 vehicle 的真实 relist 都应复用 vehicle 身份并建立新 cycle。 | CN11 DEC-044/045/046、9/19 R2 §8/§10、IA Current relist、9/22 VR-X-006 一致 | `USER_CONFIRMED` |
| P04-A09 | 同一人工名邦/4S车辆真实下架后再次正式在售，只要确认仍是同一真实车辆，就复用原 `vehicle_id`，新建 `listing_cycle`；不得为了 relist 新建第二个 vehicle 导致收藏、历史和业务链分裂。 | CN11 DEC-046、9/19 R2 §10、IA Listing Cycle 一致 | `USER_CONFIRMED` |
| P04-A10 | **已被后续用户裁决整体替代。** 原候选为“双 vehicle + conversion relation”；当前改用 P04-A15 的**同一 vehicle_id 批发→名邦来源转换**。 | 2026-09-24 用户在 Batch 2 主动改写 | `SUPERSEDED_BY_P04-A15` |
| P04-A11 | **业务结果继续有效、数据模型已改写。** 批发→名邦完成后，同一 `vehicle_id` 不得因 JYT 后续普通同步/重新出现再次变回批发在售，也不得再创建新的批发 vehicle；JYT `car_code` 与来源事实作为历史 lineage 保留。 | 原 A11“不复活”结果保留；“原批发与新名邦两个独立 vehicle”部分被 P04-A15 覆盖 | `USER_CONFIRMED_MODIFIED` |
| P04-A12 | 不做无可靠依据的跨来源自动合并。没有可靠唯一身份依据时，不能仅凭品牌、车型、年款、里程、图片相似自动认定批发/名邦/4S记录为同一实体并 merge。**批发→名邦是明确业务来源转换，不属于模糊自动 merge，按 P04-A15 在同一 vehicle_id 上完成并保留来源历史。** | CN11 DEC-053/055 的“禁止模糊自动 merge”继续有效；conversion 示例随 P04-A15 修正 | `USER_CONFIRMED_MODIFIED` |
| P04-A13 | 4S 合作车源**不再执行周期性在售确认**。不得恢复“定期确认→超期自动暂停→名邦代确认”整套机制；4S车辆状态只因真实业务事件变化。 | 9/19 R2 §13 明确废弃；后续用户冻结方向一致 | `USER_CONFIRMED` |
| P04-A14 | 4S 成员 inactive/停止合作后，其当前负责且仍在售的4S车先暂停正常展示与匹配；已有 Lock/Transaction 等存量业务不自动取消。名邦可重新指定当前负责人/管理责任，若车辆仍真实有效可恢复业务，**不需要重建 vehicle**；来源仍保持4S，除非另有合法 `source_type` 变更。 | 9/19 R2 §14～17、IA Current “失去承责资格→handoff” 同向；未发现后续反转 | `USER_CONFIRMED` |

## 3. 本批明确不处理的事项

以下存在后续明确修改、跨域新规则或证据冲突，不放入 Batch 1：

- **人工名邦 / 4S 的 `source_type` 后续能否双向修改**：CN11 DEC-054 与后续用户裁决存在真实变化，留 Batch 3；
- **采集批发车自动隐藏规则**：9/22 后新增完整规则中心，留 Batch 3；
- **一键转名邦后的新名邦展示状态**：早期存在“原批发 hidden → 新名邦也 hidden”，后续又冻结“新名邦立即上架”，留 Batch 3/4；
- **一键转名邦具体 permission**：9/19 曾写普通销售默认可用，但 PDM-02 已明确留 PDM-04/PDM-21 重审，不放稳定项；
- 一键转名邦的具体价格复制与展示价 → PDM-10；
- 一键转名邦图片转存/失败/重试 → PDM-08；
- 人工新增/草稿/发布门槛/VIN/删除边界 → PDM-06；
- hidden 对 Matching/Priority/Recommendation/客户逐车授权的完整可见性 → PDM-12～PDM-14；
- 交易纠错后是否恢复原 cycle 的特殊例外 → 与 PDM-19 联动，在后续批次核冲突，不在本批自动扩写。

## 4. Batch 1 门禁结果

- P04-A01～P04-A14：`USER_CONFIRMED`
- Batch 1：`COMPLETE_USER_CONFIRMED`
- Decision Register：`PDM04-DEC-A01`～`PDM04-DEC-A14` + `PDM04-GATE-B1`

下一步开放：

> **PDM-04 Batch 2｜明确废弃 / 明确替代 / DO_NOT_RESTORE**

Batch 2 展示后必须停止等待用户确认。


## 5. Batch 2｜明确废弃 / 明确替代 / DO_NOT_RESTORE

| Atom | 明确不得恢复的旧方向 | 当前替代规则 / 理由 | 证据 | 状态 |
|---|---|---|---|---|
| P04-B2-01 | 用一个巨大 `vehicle_status` 同时表达资源、平台展示、锁车/交易等全部状态 | **不得恢复。** 资源事实、平台 `visible/hidden`、业务占用必须分层 | CN11 DEC-043；P04-A02 | `USER_CONFIRMED` |
| P04-B2-02 | 把 `hidden` 当成 `offline` / 真实下架；隐藏或恢复就结束/新建 listing_cycle | **不得恢复。** hidden 只控制平台公开性，恢复继续原 cycle | CN11 DEC-044；P04-A07/A08 | `USER_CONFIRMED` |
| P04-B2-03 | 普通编辑、改价、资料更新也算“重新上架”并开启新 listing_cycle | **不得恢复。** 只有真实不可售→再次真实可售才开启新 cycle | CN11 DEC-045；P04-A08 | `USER_CONFIRMED` |
| P04-B2-04 | 同一人工名邦/4S车辆真实 relist 时新建第二个 vehicle_id | **不得恢复。** 确认同一真实车辆后复用原 vehicle_id，只开新 listing_cycle | CN11 DEC-046；P04-A09 | `USER_CONFIRMED` |
| P04-B2-05 | 原候选“禁止 wholesale vehicle 直接转为 Mingbang” | **已撤回。** 用户改为 P04-A15：同一 `vehicle_id` 直接完成批发→名邦来源转换，并永久保留 JYT lineage / car_code / 转换历史。 | 2026-09-24 用户主动反转 | `WITHDRAWN_REPLACED_BY_P04-A15` |
| P04-B2-06 | 对同一批发车重复点击/并发执行一键转名邦时重复创建车辆或重复执行来源转换 | **不得恢复。** 同 `vehicle_id` 转换必须幂等；一旦当前来源已成为名邦，再次执行应返回既有结果/拒绝重复转换，不能新建任何重复 vehicle。 | P04-A15 + 用户授权同步修正 | `USER_CONFIRMED_MODIFIED` |
| P04-B2-07 | 已完成批发→名邦来源转换的上游 `car_code`，因为 JYT 后续又同步/重新出现而重新成为批发在售，或再创建一条批发 vehicle | **不得恢复。** 系统永久保存“该 `car_code` 已转名邦”的来源转换事实；后续 JYT 同 `car_code` 只允许记录/更新允许保留的上游来源信息，**不得改变当前名邦来源状态、不得重新创建批发在售记录**。若同 `car_code` 出现明显不同核心车辆身份，则进入 `VEHICLE_IDENTITY_CONFLICT`/人工核验，而不是自动上架。 | P04-A05 + P04-A15 + 用户明确要求解决 JYT 再次上架问题 | `USER_CONFIRMED_MODIFIED` |
| P04-B2-08 | 人工隐藏的批发车因为普通上游更新就自动恢复公开 | **不得恢复。** 上游可更新来源事实，但不能覆盖名邦本地 hidden；只有合法恢复显示动作才解除 | 9/19 R2 §9/§19；P04-A07 | `USER_CONFIRMED` |
| P04-B2-09 | 普通名邦员工进入批发详情后，可以人工修改 JYT 原始车辆事实/原始价格 | **不得恢复。** JYT 来源事实只读；“可进入详情”不等于“可改上游事实” | 9/19 R2 §3/§6/§19；VR-E-006；P04-A03 | `USER_CONFIRMED` |
| P04-B2-10 | 无 VIN / 无可靠唯一身份时，仅凭品牌、车型、年款、里程、图片相似自动认定跨来源同一实体并 merge | **不得恢复。** 不做模糊跨来源自动合并；显式 conversion 等关系单独保存 | CN11 DEC-053/055；9/19 R2 §11/§19；P04-A12 | `USER_CONFIRMED` |
| P04-B2-11 | 恢复 4S 周期性在售确认、超期自动暂停、名邦代确认机制 | **不得恢复。** 4S 车辆状态只因真实业务事件变化 | 9/19 R2 §13/§19；P04-A13 | `USER_CONFIRMED` |
| P04-B2-12 | 解释为“只有 4S 成员停用以后，名邦员工才第一次获得该车编辑/管理能力” | **不得恢复。** 车辆管理能力由员工身份、permission、data scope、object state 决定；停用后的接管只是责任/负责人交接 | 9/19 R2 §14～15/§19；PDM-02 权限模型；P04-A14 | `USER_CONFIRMED` |
| P04-B2-13 | 一键转名邦成功后必须先生成草稿，再由员工二次发布才进入正式在售 | **不得恢复。** conversion 本身不是“生成草稿待二次发布”的两步工作流；转换完成后的最终展示状态仍按后续最新规则在 Batch 3/4 单独收口 | CN11 DEC-049 明确禁止“转名邦→草稿→再发布”；后续 VR-X-009 也未恢复两步发布 | `USER_CONFIRMED` |

## 6. Batch 2 边界说明

以下**不在本批直接判废弃**：

- “一键转名邦是否必须独立 permission”：9/19 R2 曾写“不需要独立权限”，但 PDM-02 已明确留 PDM-04/PDM-21 重审，后续单独裁决；
- “正式人工车 source_type 能否在名邦/4S之间修改”：历史与后续用户裁决存在真实变化，留 Batch 3；
- “原批发 hidden 时，新名邦车转换后是否仍 hidden”：历史与后续冻结口径有冲突，留 Batch 3/4；
- 图片失败是否回滚 conversion 的完整恢复/重试规则：图片域 PDM-08 负责，但 PDM-04 最终至少承接“图片问题不得破坏已成立的 vehicle conversion”这一跨域不变量，后续再核；
- 活动 Lock/Transaction 中是否允许一键转名邦：CN11 有明确规则，但本轮 Batch 1 未收录，留 Batch 4 做遗漏核验。

## 7. Batch 2 门禁结果

- P04-B2-01～B2-04、B2-08～B2-13：`USER_CONFIRMED`
- P04-B2-05：`WITHDRAWN_REPLACED_BY_P04-A15`
- P04-B2-06、B2-07：`USER_CONFIRMED_MODIFIED`
- Batch 2：`COMPLETE_USER_CONFIRMED`
- Decision Register：`PDM04-GATE-B2`

本轮同时形成并已获用户明确确认的主动新规则：
- P04-A15｜一键转名邦改为同一 vehicle_id 来源转换；
- P04-A16｜已有有效 Lock 的批发车允许直接转名邦，Lock 保持绑定同一 vehicle_id。

下一步允许准备：

> **PDM-04 Batch 3｜明确知情修改 / 后续明确新增**


## 8. Batch 3 预确认项

| Atom | 当前规则 | 来源 | 状态 |
|---|---|---|---|
| P04-A15 | **一键转名邦采用同一 `vehicle_id` 来源转换。** 转换前是批发/JYT来源，转换后当前来源成为名邦；永久保留原 `car_code`、JYT来源事实、转换前来源快照、`converted_at`、operator 等历史。系统不再保留第二条可售 wholesale vehicle，也不创建第二个 Mingbang vehicle。后续 JYT 同 `car_code` 不得使其重新成为批发在售。 | 2026-09-24 用户主动修改 B2-05 | `USER_CONFIRMED_PRECONFIRMED_FOR_BATCH_3` |
| P04-A16 | **已有有效 Lock 的批发车允许直接一键转名邦。** 因 `vehicle_id` 不变，Lock、客户、负责人、锁车快照及后续业务继续绑定原 vehicle，不做对象迁移。当前仅确认 locked；trading/completed 是否允许转换留 Batch 4。 | 2026-09-24 用户明确提出并确认同 vehicle_id 方案 | `USER_CONFIRMED_PRECONFIRMED_FOR_BATCH_3` |

> 注：Batch 3 仍需继续扫描其他“后续明确修改 / 新增”项。P04-A15/A16 不会重复要求用户再次确认，但会与其他 Batch 3 项一起展示完整边界。


## 9. Batch 3｜明确知情修改 / 后续明确新增

| Atom | 当前候选规则 | 修改 / 新增来源 | 状态 |
|---|---|---|---|
| P04-A15 | **一键转名邦采用同一 `vehicle_id` 来源转换。** 转换前当前来源为批发/JYT，转换后当前来源成为名邦；永久保留原 `car_code`、JYT 来源 lineage、转换前来源事实/快照、`converted_at`、operator 等历史。转换后由名邦业务数据独立维护，JYT 后续同 `car_code` 不得覆盖当前名邦来源状态、不得重新创建批发在售记录。 | 2026-09-24 用户主动反转旧“双 vehicle + conversion relation”模型 | `USER_CONFIRMED` |
| P04-A16 | **已有有效 Lock 的批发车允许直接一键转名邦。** 因 `vehicle_id` 不变，原 Lock、客户、负责人、锁车快照和后续业务继续绑定同一 vehicle，不做跨 vehicle 迁移。当前只明确 locked；trading/completed 是否允许转换留 Batch 4。 | 2026-09-24 用户明确提出并确认 | `USER_CONFIRMED` |
| P04-A17 | **正式人工车的 `source_type` 允许在“名邦 ↔ 4S”之间后续修改。** 名邦内部员工只要对该车辆具备正常管理能力即可通过专门业务动作修改，不限定必须经理/店长/特殊纠错权限；必须审计修改前、修改后、操作人、操作时间，不强制填写原因。修改后当前权限/可操作能力立即按新来源重新计算；若现负责人因此失去资格则走正式责任交接。**4S 成员自己上传的车辆仍固定为 4S，不能自行改为名邦。** | 9/22 VR-E-003 + Phase1 后续 R10/R11/IA S5-C10 明确覆盖 CN11 DEC-054“正式发布后来源冻结” | `USER_CONFIRMED` |
| P04-A18 | **车源自动/批量隐藏规则中心。** 每条隐藏规则必须显式配置适用车源范围 `source_scope`，可多选：①批发车源；②名邦车源；③4S店车源，至少选择一类；未选择不得生效，且不得默认影响三类全部车源。原“采集批发车自动隐藏”属于 `source_scope=批发车源` 的一种配置。每一条规则独立生效；多条规则之间按 OR，任一命中即 hidden；单条规则内不同字段按 AND，同一字段多个值按 OR。规则可按地区/城市、品牌、车系、年款、具体车型、关键词等条件建立；既可作用未来新增车源，也可对适用范围内的存量车源重算，并记录全部命中规则/原因。车辆 `source_type` 变化后必须按新的车源类型重新评估这些规则。自动恢复 visible 必须同时满足：已不命中任何适用于当前来源的自动隐藏规则、无人工 hidden、无其他仍有效 hidden 原因、车辆仍真实在售；绝不能把 offline 车辆“恢复显示”成重新上架。 | 9/22 VR-P-006～P-009 + 2026-09-24 用户先确认独立规则组合语义，后进一步明确隐藏规则可选择批发/名邦/4S适用范围，并同意同步改写 B4-02 | `USER_CONFIRMED_MODIFIED` |
| P04-A19 | **一键转名邦成功后不进入草稿等待二次发布。** 同一 vehicle 完成来源转换后，应直接进入名邦可售业务状态，而不是要求员工再走一次“发布”。至于转换前若平台状态为 hidden，转换后是否自动清除 hidden 并公开展示，单独留 Batch 4 裁决。 | CN11 DEC-049“禁止转名邦→草稿→再发布” + 9/22 VR-X-009“新名邦立即上架”；结合 P04-A15 同 vehicle 模型重新表述 | `USER_CONFIRMED` |
| P04-A20 | **普通名邦销售执行一键转名邦不再设置额外独立 permission。** 具备 active 名邦员工身份、对目标批发车有正常管理/查看范围且对象状态允许时即可执行；入口可在内部模式展示，但进入内部模式本身不授予能力。4S 成员 hard DENY。 | Phase1 R10/R11 明确“普通名邦销售默认可用、不设一键转名邦独立权限”；PDM-02 已把该点留到 PDM-04/PDM-21 重新确认 | `USER_CONFIRMED` |

## 10. Batch 3 边界说明

- P04-A15/A16 已经由用户明确确认，本批只作为完整规则集展示，不重复要求用户再确认。
- P04-A17 只处理人工名邦/4S来源变更；批发来源只能由 JYT 同步产生，不能通过普通人工 source_type 编辑把一辆人工车改成“批发”。
- P04-A18 的自动隐藏仅改变平台展示层，不等于 source offline，也不新建 listing_cycle。
- P04-A19 只确认“不走草稿二次发布”；**pre-conversion hidden 是否在 conversion 后自动解除**仍未决。
- P04-A20 只处理“一键转名邦是否需要独立 permission”；页面位置和交互留 PDM-21。

## 11. 明确留到 Batch 4 的问题

1. 同一 `vehicle_id` 批发→名邦转换时，是否继续当前 `listing_cycle`，还是开新 cycle；
2. 转换前若 vehicle 处于 `hidden`，转换后是否自动清除 hidden 并变成 visible；
3. `trading` / `completed` 状态是否允许一键转名邦（locked 已明确允许）；
4. JYT 后续同 `car_code` 出现明显不同核心车辆身份时，转换抑制与“car_code 被上游复用”冲突的最终人工处理出口。

## 12. Batch 3 门禁结果

- P04-A15～P04-A20：`USER_CONFIRMED`
- Batch 3：`COMPLETE_USER_CONFIRMED`
- Decision Register：`PDM04-DEC-A15`～`PDM04-DEC-A20` + `PDM04-GATE-B3`

下一步开放：

> **PDM-04 Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择**


### P04-A18 补充说明｜独立规则、组合规则与适用车源范围

自动/批量隐藏规则采用“**显式 source_scope + 规则之间 OR + 单条规则内部按条件组合**”。

每条规则必须先明确选择适用车源类型，可多选：

- 批发车源；
- 名邦车源；
- 4S店车源。

至少选择一类；不允许因为未配置范围就默认影响三类全部车源。

示例：

- 规则 1：source_scope=批发 + 地区=内蒙古赤峰 → 只隐藏**赤峰地区全部批发车源**；
- 规则 2：source_scope=名邦 + 品牌=沃尔沃 → 只隐藏**全国名邦车源中的沃尔沃**；
- 规则 3：source_scope=批发+名邦 + 车型=S90 → 隐藏**批发与名邦两类车源中的全部 S90**，4S 不受影响；
- 规则 4：source_scope=批发+名邦+4S + 车型=S60 → 三类车源中的 S60 均可命中。

组合语义保持：

- 多条规则之间 OR，命中任意一条即 hidden；
- 单条规则内多个不同字段 AND；
- 同一字段多个值 OR；
- 规则删除/停用、车辆 source_type 变化或条件变化后，都必须重新计算当前命中集合；
- 只有在“无任何适用于当前来源的自动隐藏命中 + 无人工 hidden + 无其他有效 hidden 原因 + 车辆仍真实在售”时才恢复 visible。

该规则只改变平台展示层，不等于 offline，也不因 hidden/visible 本身新建 listing_cycle。

## 13. Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择

| Atom | 冲突 / 缺口 | 当前候选规则 | 证据与原因 | 状态 |
|---|---|---|---|---|
| P04-B4-01 | **同一 vehicle_id 批发→名邦后，当前 listing_cycle 是继续还是重开？** 旧“双 vehicle”模型天然会让新名邦车开首 cycle；新“同 vehicle”模型不再成立 | **候选：继续当前 listing_cycle，不因 source conversion 单独新建 cycle。** 一键转名邦只是同一真实车辆的来源/经营方式转换，并未发生“真实不可售→再次真实可售”；因此沿用当前 cycle、原 listing_started_at 和本周期业务关联。只有未来真实下架再重新上架才开启新 cycle | P04-A08 已确认“只有真实不可售→再次真实可售才新 cycle”；IA CO-O09 同向；新 P04-A15 保持同 vehicle | `USER_REVIEW_PENDING` |
| P04-B4-02 | **转换前 hidden 怎么处理？** 旧证据存在“人工 hidden 转后仍 hidden”与“转名邦立即上架”的表面冲突；同时 P04-A18 现已允许每条自动隐藏规则选择批发/名邦/4S适用范围 | **用户确认：转换后按 hidden 来源逐项处理，并按新的 source_type 重新计算自动隐藏规则。** ① 仅因“只适用于批发”的自动隐藏规则而 hidden：转为名邦后该命中失效；若无其他 hidden 原因则 visible；② 若某条自动隐藏规则的 source_scope 也包含名邦，且转换后条件仍命中，则继续 hidden；③ 人工 hidden 不因来源转换自动解除，继续 hidden，需有权限人员主动恢复；④ 其他仍有效 hidden 原因继续保留。A19“直接进入名邦可售状态”不等于“无条件公开展示”。 | P04-A07 + 经用户补充修改后的 P04-A18 + 2026-09-24 用户明确同意按 source scope 重算并同步改写 B4-02 | `USER_CONFIRMED` |
| P04-B4-03 | **locked 已允许转换，那么 trading / completed 呢？** CN11 DEC-072 旧规则因“双 vehicle迁移困难”禁止 locked/trading/completed；其核心前提已被 P04-A15 推翻 | **候选：locked、trading 都允许同 vehicle 转名邦；completed 禁止。** 转换时现有 Lock / Waitlist / Transaction 继续绑定同一 vehicle_id，不迁移、不重建、不改历史快照。Transaction 已 completed 后属于终态历史，不再为了后续经营转换来源；若 Transaction cancelled 且车辆恢复可售/normal，可按当前正常规则再转换 | DEC-072 的旧禁止理由是“新旧 vehicle_id 与业务对象迁移无法唯一推出”；P04-A15/A16 已消除此问题。CN11 DEC-059 又明确 locked/trading 期间仍允许记录真实 vehicle facts 且不得自动取消业务 | `USER_REVIEW_PENDING` |
| P04-B4-04 | **已转名邦的旧 car_code 被 JYT 真正复用给另一辆实体车怎么办？** 单纯永久屏蔽 car_code 会误伤新车；直接接受又会污染原名邦车 | **候选：先隔离，不自动更新/上架。** 若同 car_code 的品牌/车系/车型/年款等核心身份明显冲突，进入身份冲突人工核验。人工确认“仍是原实体车”→继续保持已转名邦抑制，不恢复批发；人工确认“JYT 确实复用了 car_code 给另一辆真实车”→原名邦 vehicle 永久保留旧 car_code 历史 lineage，但结束它对该 car_code 的当前活动绑定；为新实体建立新的批发 vehicle / 新的一段上游身份绑定。未核验前不自动上架、不自动覆盖 | P04-A05 已确认 core identity conflict 必须人工核验；9/19 R2 §8 明确防止 JYT 复用 car_code；P04-B2-07 又要求已转名邦不能被普通同 car_code 更新复活 | `USER_REVIEW_PENDING` |
| P04-B4-05 | **一键转名邦是否可逆？** 同 vehicle_id 模型若不明确，会出现员工把名邦车手工改回“批发”的歧义 | **候选：批发→名邦的一键转换为单向经营转换，不提供“转回批发”。** 转换后可按 A17 在“名邦↔4S”之间合法修改人工来源，但不能人工改成批发；批发来源只能由 JYT 集成建立。只有 B4-04 中确认 car_code 被上游复用为另一真实车时，才为那辆新实体建立新的批发身份，不是把旧名邦车转回批发 | A17 已明确人工 source_type 只处理名邦↔4S；A01/A03 已确认批发由 JYT 集成产生；B2-07 已确认转换后不得复活为批发在售 | `USER_REVIEW_PENDING` |

## 14. Batch 4 关键解释

### B4-01｜为什么候选“不新建 cycle”

现在已经不是“批发旧车结束 → 新建一辆名邦车”了，而是：

> 同一真实车 + 同一 vehicle_id + 同一轮持续在售，只发生来源转换。

因此如果车一直真实可售，仅仅转换来源就开新 cycle，会和已确认的“真实 relist 才开新 cycle”相冲突。

### B4-02｜“可售”与“visible”继续分开｜已确认

转名邦成功可以立即成为名邦**可售业务车**，但平台是否公开展示仍由 hidden 原因和自动隐藏规则的 `source_scope` 决定。

- 转换完成后，所有自动隐藏规则按新的 source_type 重新计算；
- 仅适用于批发的规则在转为名邦后不再命中；
- source_scope 包含名邦且条件仍满足的规则继续命中，车辆继续 hidden；
- 人工 hidden 不因来源转换自动解除；
- 只有不存在任何自动/人工/其他有效 hidden 原因时才 visible。

### B4-03｜为什么 trading 候选允许、completed 候选禁止

同 vehicle_id 后，活动 Transaction 不需要迁移，所以旧 DEC-072 最大技术/业务冲突已经消失；转换不会改变 Lock/Transaction 的原始快照和历史。

但 completed 已是终态成交历史，没必要在成交结束后再改当前经营来源；若是误成交，应先走 Transaction correction，恢复真实可售状态后再判断转换。

### B4-04｜car_code 不是永远等于同一实体车

默认仍把同 car_code 视为同一上游身份；但核心身份明显冲突必须先隔离。只有人工明确确认“上游复用了 car_code”后，才允许建立新的批发实体，避免永久 suppress 一辆真正的新车。

### B4-05｜人工来源和上游来源边界

- 名邦 ↔ 4S：属于人工来源，可按 A17 修改；
- 批发：属于 JYT 集成来源，不能人工改回；
- 一键转名邦：是批发 → 人工名邦的单向经营转换。

## 15. Batch 4 门禁

当前 Batch 4 状态：

- P04-B4-02：`USER_CONFIRMED`
- P04-B4-01、P04-B4-03、P04-B4-04、P04-B4-05：`USER_REVIEW_PENDING`

剩余 4 条全部获得用户明确裁决后，才允许生成：

> **PDM-04｜最终完整规则总览｜待用户批准**
