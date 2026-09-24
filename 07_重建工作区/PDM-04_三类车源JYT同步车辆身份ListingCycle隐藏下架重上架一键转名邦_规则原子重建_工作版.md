# PDM-04｜三类车源 / JYT 同步 / 车辆身份 / Listing Cycle / 隐藏 / 下架 / 重上架 / 一键转名邦｜规则原子重建工作版

> 日期：2026-09-24  
> 状态：`USER_REVIEW_BATCH_3_PENDING`  
> 说明：严格按当前 GitHub 原始证据重新重建，不使用旧聊天记忆替代证据。PDM-01～PDM-03 已正式 COMPLETE；PDM-04 Batch 1～2 已完成用户审查，当前开放 Batch 3｜明确知情修改 / 后续明确新增。A15/A16 已由用户提前确认，A17～A20 待审。

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
| P04-A15 | **一键转名邦采用同一 `vehicle_id` 来源转换。** 转换前当前来源为批发/JYT，转换后当前来源成为名邦；永久保留原 `car_code`、JYT 来源 lineage、转换前来源事实/快照、`converted_at`、operator 等历史。转换后由名邦业务数据独立维护，JYT 后续同 `car_code` 不得覆盖当前名邦来源状态、不得重新创建批发在售记录。 | 2026-09-24 用户主动反转旧“双 vehicle + conversion relation”模型 | `USER_CONFIRMED_PRECONFIRMED` |
| P04-A16 | **已有有效 Lock 的批发车允许直接一键转名邦。** 因 `vehicle_id` 不变，原 Lock、客户、负责人、锁车快照和后续业务继续绑定同一 vehicle，不做跨 vehicle 迁移。当前只明确 locked；trading/completed 是否允许转换留 Batch 4。 | 2026-09-24 用户明确提出并确认 | `USER_CONFIRMED_PRECONFIRMED` |
| P04-A17 | **正式人工车的 `source_type` 允许在“名邦 ↔ 4S”之间后续修改。** 名邦内部员工只要对该车辆具备正常管理能力即可通过专门业务动作修改，不限定必须经理/店长/特殊纠错权限；必须审计修改前、修改后、操作人、操作时间，不强制填写原因。修改后当前权限/可操作能力立即按新来源重新计算；若现负责人因此失去资格则走正式责任交接。**4S 成员自己上传的车辆仍固定为 4S，不能自行改为名邦。** | 9/22 VR-E-003 + Phase1 后续 R10/R11/IA S5-C10 明确覆盖 CN11 DEC-054“正式发布后来源冻结” | `USER_REVIEW_PENDING` |
| P04-A18 | **采集批发车新增自动隐藏规则中心。** 默认只作用于采集批发车，不自动作用名邦/4S。每一条屏蔽规则都是独立规则，可单独按地区/城市、品牌、车系、年款、具体车型、关键词等条件建立；**多条规则之间按 OR 生效：任一规则命中即隐藏。** 例如可分别建立“地区=内蒙古赤峰”“品牌=沃尔沃”“车型=S90”三条独立规则，三条可同时启用、互不覆盖；也可以另建“地区=赤峰 AND 品牌=沃尔沃”等更窄的组合规则。单条规则内部若配置多个不同字段则按 AND，同一字段多个值按 OR。规则既作用未来采集，也可对存量批发车重算；必须记录全部命中规则/原因。自动恢复公开时必须同时满足：无其他自动隐藏、无人工 hidden、车辆仍真实在售；绝不能把 offline 车辆“恢复显示”成重新上架。 | 9/22 VR-P-006～P-009 + 2026-09-24 用户明确补充“赤峰/沃尔沃/S90均可各自独立成规则并可同时生效” | `USER_REVIEW_PENDING_CLARIFIED` |
| P04-A19 | **一键转名邦成功后不进入草稿等待二次发布。** 同一 vehicle 完成来源转换后，应直接进入名邦可售业务状态，而不是要求员工再走一次“发布”。至于转换前若平台状态为 hidden，转换后是否自动清除 hidden 并公开展示，单独留 Batch 4 裁决。 | CN11 DEC-049“禁止转名邦→草稿→再发布” + 9/22 VR-X-009“新名邦立即上架”；结合 P04-A15 同 vehicle 模型重新表述 | `USER_REVIEW_PENDING` |
| P04-A20 | **普通名邦销售执行一键转名邦不再设置额外独立 permission。** 具备 active 名邦员工身份、对目标批发车有正常管理/查看范围且对象状态允许时即可执行；入口可在内部模式展示，但进入内部模式本身不授予能力。4S 成员 hard DENY。 | Phase1 R10/R11 明确“普通名邦销售默认可用、不设一键转名邦独立权限”；PDM-02 已把该点留到 PDM-04/PDM-21 重新确认 | `USER_REVIEW_PENDING` |

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

## 12. Batch 3 门禁

当前：
- P04-A15：`USER_CONFIRMED_PRECONFIRMED`
- P04-A16：`USER_CONFIRMED_PRECONFIRMED`
- P04-A17～P04-A20：`USER_REVIEW_PENDING`

只有 A17～A20 获得用户明确确认后，才允许进入：

> **PDM-04 Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择**


### P04-A18 补充说明｜独立规则与组合规则

自动隐藏规则采用“**规则之间 OR、单条规则内部按条件组合**”：

- 规则 1：地区 = 内蒙古赤峰 → 隐藏全部赤峰采集批发车；
- 规则 2：品牌 = 沃尔沃 → 隐藏全部沃尔沃采集批发车；
- 规则 3：具体车型 = S90 → 隐藏全部 S90 采集批发车；
- 上述三条可同时启用，互不覆盖，车辆命中任一条即 hidden；
- 也允许另建更窄的组合规则，例如“地区=赤峰 AND 品牌=沃尔沃”；
- 同一字段若配置多个值，例如车型=S90/S60，则同字段内部按 OR；
- 规则删除/停用后，只能在“没有其他自动隐藏命中 + 没有人工 hidden + 车辆仍真实在售”时恢复 visible。

该补充只明确规则组合语义，不改变“自动隐藏仅作用平台展示层、不等于 offline、不新建 listing_cycle”的既有边界。
