# PDM-04｜三类车源 / JYT 同步 / 车辆身份 / Listing Cycle / 隐藏 / 下架 / 重上架 / 一键转名邦｜规则原子重建工作版

> 日期：2026-09-24  
> 状态：`USER_REVIEW_BATCH_1_PENDING`  
> 说明：严格按当前 GitHub 原始证据重新重建，不使用旧聊天记忆替代证据。PDM-01～PDM-03 已正式 COMPLETE；本批仅展示 PDM-04 Batch 1｜稳定一致项，未经用户确认不得进入 Batch 2。

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
| P04-A01 | V1 当前只存在三类车源：①批发车源（JYT/上游同步）；②名邦车源；③4S 合作车源。批发车由上游集成产生；名邦与4S属于人工车源体系。 | 9/19 R2 §2、后续 C/E/P 页面来源分类一致；未发现后续增加第四种正式车源类型 | `USER_REVIEW_PENDING` |
| P04-A02 | Vehicle 的“真实资源状态 / 平台展示状态 / 业务占用状态”必须分层，不得合成一个巨大 `vehicle_status`。批发资源至少区分 active/offline；人工资源至少区分 available/unavailable/sold_external；平台层区分 visible/hidden；业务层由 Lock/Transaction 等独立事实表达。 | CN11 DEC-043、9/19 C3/R2、IA Vehicle/Listing Cycle current 一致 | `USER_REVIEW_PENDING` |
| P04-A03 | JYT 上游原始车辆事实与上游原始价格为**只读来源事实**。上游同步可以更新其允许更新的上游字段，但普通人工不得直接改写；上游同步不得覆盖名邦本地业务字段、人工 hidden、客户业务关系等本地事实。 | 9/19 R2 §3/§6、9/22 VR-E-006、IA Current V01～V03 一致 | `USER_REVIEW_PENDING` |
| P04-A04 | JYT 导入/普通同步的业务 Actor 是上游集成服务，而不是虚构“人工逐车操作员”；人工只处理连接配置、异常与需要人工确认的事项。系统同步必须保留来源、时间与处理结果日志。 | IA Current S5-C09、9/19 R2 同向；无后续反转 | `USER_REVIEW_PENDING` |
| P04-A05 | 对正常 JYT 同步，同一上游 `car_code` 默认复用既有车辆身份，不因普通更新或重新出现而静默新建第二个同源 vehicle。若品牌/车系/具体车型/年款等核心身份发生明显冲突，必须进入身份异常/人工核验，不得静默覆盖。 | 9/19 R2 §8、IA Current Vehicle identity conflict 一致 | `USER_REVIEW_PENDING` |
| P04-A06 | 批发车由上游确认真实下架/offline 后，名邦侧同步退出正常可售：不再公开展示、不再参与正常匹配、不再新增普通销售业务；但已存在的 Lock / Transaction 等正式历史或进行中业务事实不得被直接删除，交由各自业务生命周期处理。 | 9/19 R2 §7、CN11 状态分层、IA Vehicle lifecycle 一致 | `USER_REVIEW_PENDING` |
| P04-A07 | `hidden` 与真实下架/offline严格不同。hidden 只暂停公共展示，不改变底层真实在售事实；批发车 hidden 后上游普通同步仍可更新资料，但**不得因为普通同步自动解除 hidden**；恢复显示属于名邦本地动作。 | CN11 DEC-044、9/19 C3/R2 §9/§10、9/22 VR-P-004/VR-X-005 一致 | `USER_REVIEW_PENDING` |
| P04-A08 | `listing_cycle` 只在**真实不可售/失效 → 再次真实可售**时开启新周期。hidden→visible、普通编辑、改价均不新建 cycle；旧周期永久保留历史。人工车与批发车确认是同一 vehicle 的真实 relist 都应复用 vehicle 身份并建立新 cycle。 | CN11 DEC-044/045/046、9/19 R2 §8/§10、IA Current relist、9/22 VR-X-006 一致 | `USER_REVIEW_PENDING` |
| P04-A09 | 同一人工名邦/4S车辆真实下架后再次正式在售，只要确认仍是同一真实车辆，就复用原 `vehicle_id`，新建 `listing_cycle`；不得为了 relist 新建第二个 vehicle 导致收藏、历史和业务链分裂。 | CN11 DEC-046、9/19 R2 §10、IA Listing Cycle 一致 | `USER_REVIEW_PENDING` |
| P04-A10 | “一键转名邦”不是把原批发 vehicle 直接改 `source_type`。成功转换后保留原 wholesale vehicle，并创建**新的名邦 vehicle_id**；两者用永久 conversion relation 连接，至少可追溯 source / target / converted_at / operator。重复或并发转换不得生成第二个名邦目标车，应复用既有 conversion target。 | CN11 DEC-047、IA Current V06、9/19 R2 §4 一致；后续未恢复“原 vehicle 直接改类型” | `USER_REVIEW_PENDING` |
| P04-A11 | 已成功一键转名邦的原批发记录必须退出当前可售，并且**不能因为 JYT 后续普通同步、重新出现或普通 relist 规则而复活为可售批发车**；原批发与新名邦的身份和历史继续独立保留。 | 9/19 R2 §4/§8、IA Current V05/V06、9/22 VR-X-009 同向 | `USER_REVIEW_PENDING` |
| P04-A12 | 不做无可靠依据的跨来源自动合并。没有可靠唯一身份依据时，不能仅凭品牌、车型、年款、里程、图片相似自动认定批发/名邦/4S记录为同一实体并 merge。明确业务关系（例如 wholesale→Mingbang conversion）由系统维护显式 relation，而不是糊成一个 vehicle。 | CN11 DEC-053/055、9/19 R2 §11 一致；后续未恢复模糊自动 merge | `USER_REVIEW_PENDING` |
| P04-A13 | 4S 合作车源**不再执行周期性在售确认**。不得恢复“定期确认→超期自动暂停→名邦代确认”整套机制；4S车辆状态只因真实业务事件变化。 | 9/19 R2 §13 明确废弃；后续用户冻结方向一致 | `USER_REVIEW_PENDING` |
| P04-A14 | 4S 成员 inactive/停止合作后，其当前负责且仍在售的4S车先暂停正常展示与匹配；已有 Lock/Transaction 等存量业务不自动取消。名邦可重新指定当前负责人/管理责任，若车辆仍真实有效可恢复业务，**不需要重建 vehicle**；来源仍保持4S，除非另有合法 `source_type` 变更。 | 9/19 R2 §14～17、IA Current “失去承责资格→handoff” 同向；未发现后续反转 | `USER_REVIEW_PENDING` |

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

## 4. Batch 1 门禁

当前 P04-A01～P04-A14 全部为：

> `USER_REVIEW_PENDING`

只有用户明确确认本批后，才允许进入：

> **PDM-04 Batch 2｜明确废弃 / 明确替代 / DO_NOT_RESTORE**
