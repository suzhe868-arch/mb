# PDM-02｜员工身份 / 组织 / 角色 / 权限 / 数据范围 / System Admin / 4S 身份｜规则原子重建工作版

> 日期：2026-09-24  
> 状态：`BATCH_1_COMPLETE_PREPARE_BATCH_2`  
> 说明：严格按当前 GitHub 原始证据重新重建，不使用旧聊天记忆替代证据。Batch 1｜稳定一致项已于 2026-09-24 经用户全部确认；当前允许准备 Batch 2，但不得自动批准任何 Batch 2 规则。

## 1. 证据范围

- 9/19 主底盘：`Phase1_当前唯一业务合并基线.md` → R1《账号 / 员工 / 组织 / 角色 / 权限》
- 9/17 及更早：CN11 `名邦汽车_V1_SSOT_CHECKPOINT_2026-09-06.md`、`名邦汽车_V1_DECISION_REGISTER_2026-09-06.md`
- 9/20～9/22 后续承载：`IA_CURRENT.md`、`IA_V5_PERMISSION_CONTRACT.md`、Low-Fi Navigation/Page Manifest、9/22 冻结台账
- Engineering Delta：仅用于核对是否出现后续业务变更，不反向替代产品规则

## 2. Batch 1｜稳定一致项

| Atom | 当前候选规则 | 前后证据结论 | 状态 |
|---|---|---|---|
| P02-A01 | 员工主角色统一为：普通销售、经理、店长、4S 成员；同一员工同一时刻只有一个主角色，不同时兼任名邦角色与 4S 成员 | 9/19 R1 明确；CN11 与后续 IA 未出现相反规则 | `USER_CONFIRMED` |
| P02-A02 | 同一现实员工只保留一个稳定 `employee_id`；调店、升降职、普通销售/经理/店长/4S 角色变化、离职后重新入职均复用原 ID，历史角色/责任/操作事实不改写 | CN11、9/19、IA Step5/Step7 一致 | `USER_CONFIRMED` |
| P02-A03 | System Admin 与员工业务账号完全分离，不属于员工四角色树，不自动进入接客池，不自动承担客户/锁车/交易等销售业务；同一真人兼任时使用两个独立身份 | CN11、9/19、9/22 VR-P-017、IA 一致 | `USER_CONFIRMED` |
| P02-A04 | System Admin 只能由 active System Admin 管理；必须始终至少保留 1 个 active System Admin，停用最后一个必须阻止；其变更需审计 | CN11 DEC、9/19 R1、9/22 VR-P-017、IA P05 一致 | `USER_CONFIRMED` |
| P02-A05 | 名邦员工同一时刻只有一个主归属门店；跨店/跨团队能力不靠多重正式归属，而靠权限 + 数据范围；调店复用原 `employee_id` 且历史门店事实不改写 | 9/19 R1 明确；后续 IA 继续以 data scope 承载跨范围管理 | `USER_CONFIRMED` |
| P02-A06 | 不建立“4S 店组织”层级；4S 成员是独立合作员工账号，并继续共用同一员工体系/应用，由权限和数据范围裁剪，不建立独立 4S App/IA | CN11、9/19 R1、IA、9/22 后续承载一致 | `USER_CONFIRMED` |
| P02-A07 | 权限统一按“角色默认权限 + 员工个人明确授权/禁用 + 数据范围 + 对象状态”共同判定；明确禁止优先于默认允许 | 9/19 R1 明确；9/22 VR-P-013 与 IA CO-O24 同向 | `USER_CONFIRMED` |
| P02-A08 | 数据范围决定“能操作哪些对象”，具体 permission 决定“能做哪些敏感动作”；个人授权不能突破本人数据范围，授权者也不能授予超过自身边界的能力 | 9/19、9/22 VR-P-013/014、IA 一致 | `USER_CONFIRMED` |
| P02-A09 | 页面可见、字段返回、按钮显示不能替代真正授权；提交敏感动作时必须重新校验当前身份、权限、数据范围和对象状态 | 9/19“对象状态参与最终校验”；IA Step4、Navigation、9/22 P04 规则一致 | `USER_CONFIRMED` |
| P02-A10 | 员工禁止自我提权、扩大自身数据范围、给自己加敏感权限，也禁止通过中间人越级绕过；本人权限调整必须由另一名具足够授权边界的 active 管理人员执行 | 9/19 R1、9/22 VR-P-014、IA CR-S4-C02 一致 | `USER_CONFIRMED` |
| P02-A11 | 普通销售不能管理员工或权限 | 9/19 R1、IA 角色入口一致 | `USER_CONFIRMED` |
| P02-A12 | 员工进入 inactive/离职后立即失去员工端访问和当前业务权限，旧登录态不能继续操作；`employee_id`、历史操作、客户关系、审计记录保留 | CN11、9/19、IA Step5/Step7、9/22 VR-P-016 一致 | `USER_CONFIRMED` |
| P02-A13 | 重新入职继续复用原 `employee_id`，按新的当前角色/权限/数据范围重新授权；不自动恢复离职前权限、旧客户、旧业务责任，接客默认关闭 | CN11 DEC-041、9/19 R1、IA ACT-V4-027/CO-O02 一致 | `USER_CONFIRMED` |
| P02-A14 | 计划中的调店、角色切换、降权如果会使员工失去当前业务承责资格，应先完成相应业务交接再生效；突发 inactive 则立即撤权，由 active 管理人员补完交接；历史事实不改写 | 9/19 R1 与 IA Step5 E08 一致 | `USER_CONFIRMED` |
| P02-A15 | 进入内部模式本身不授予任何业务权限；实际敏感能力仍逐项按员工身份、permission、data scope、object state 校验；4S 成员不得查看名邦内部价/批发价 | 9/19 R1、IA Internal Mode、Navigation、9/22 VR-E-002/007 同向 | `USER_CONFIRMED` |

## 3. 本批暂不处理的事项

以下不属于 Batch 1，后续再进入 Batch 2～4：

- 经理 / 店长具体员工管理边界是否全部保持 9/19 口径；
- 角色模板是否“实时默认”及模板变更细节；
- 各具体敏感 permission 的默认角色分配；
- 4S 成员管理权限与 cooperation scope 的后续细化；
- 内部价、一键转名邦、上游电话、展示价覆盖等具体权限点的版本变化；
- 接客状态的详细管理与“最后一名合格接客人”保护；
- 员工手机号维护客户手机号的具体 capability（承接 PDM-01 留待 PDM-02 的权限问题）；
- 审计字段的最终横切规范。

## 4. Batch 1 门禁结果

- P02-A01～P02-A15：`USER_CONFIRMED`
- Batch 1：`COMPLETE_USER_CONFIRMED`
- Decision Register：`PDM02-DEC-A01`～`PDM02-DEC-A15` + `PDM02-GATE-B1`
- 下一步：准备 PDM-02 Batch 2｜明确废弃 / 明确替代 / DO_NOT_RESTORE；Batch 2 展示后仍须停止等待用户确认。

