# PDM-02｜员工身份 / 组织 / 角色 / 权限 / 数据范围 / System Admin / 4S 身份｜规则原子重建工作版

> 日期：2026-09-24  
> 状态：`BATCH_2_COMPLETE_PREPARE_BATCH_3`  
> 说明：严格按当前 GitHub 原始证据重新重建，不使用旧聊天记忆替代证据。Batch 1 已完成；当前开放 Batch 2｜明确废弃 / 明确替代 / DO_NOT_RESTORE，未经用户确认不得进入 Batch 3。

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



## 5. Batch 2｜明确废弃 / 明确替代 / DO_NOT_RESTORE

| Atom | 明确不得恢复的旧方向 | 当前替代规则 / 说明 | 证据 | 状态 |
|---|---|---|---|---|
| P02-B2-01 | 把“编辑非本人上传车辆”本身设置成一个独立敏感权限 | 是否可管理车辆由数据范围 + 当前车辆权限 + 对象状态决定，不再以“是不是本人上传”作为额外门槛 | 9/19 R1 §16 明确废弃；后续 IA 继续 no uploader-only rule | `USER_CONFIRMED` |
| P02-B2-02 | 名邦员工查看内部价 / 批发价必须额外拥有一个“内部价查看权限” | **该废弃候选已撤回。** 2026-09-24 用户主动恢复独立 permission；改由 P02-A16 生效：名邦员工需独立 permission 才能看内部价 / 批发价，4S hard DENY | 9/19 R1 为旧规则；本轮用户主动反转 | `WITHDRAWN_SUPERSEDED_BY_P02-A16` |
| P02-B2-03 | 只要进入内部模式，就自动获得全部敏感操作权限 | 内部模式只是内部工具投影；编辑、电话、调价、覆盖价等继续逐项按身份/permission/scope/object state 校验 | 9/19 R1 §16；IA Deprecated；9/22 VR-E-002/007 | `USER_CONFIRMED` |
| P02-B2-04 | System Admin 自动拥有员工业务管理权 / 员工业务权限 | System Admin 为独立 P05 身份域；其系统权限由其他 active System Admin 管理；需要员工业务能力时必须切换独立员工身份并由 P04 正常授权，不得凭 System Admin 身份获得或给自己发员工业务权 | 9/19 R1 §3/§16；IA P05/CR-S4-C02；P02-A17 | `USER_CONFIRMED` |
| P02-B2-05 | 建立“4S 店组织”层级 | 4S 成员为独立合作员工账号，不挂 4S 组织层级；合作范围由权限 / data scope 表达 | 9/19 R1 §4.2/§16；IA 废弃 4S 独立组织 IA | `USER_CONFIRMED` |
| P02-B2-06 | 同一员工同时挂多个正式主归属门店 | 名邦员工同一时刻只有一个主归属门店；跨店管理由 permission + data scope 解决 | 9/19 R1 §4.1/§16 | `USER_CONFIRMED` |
| P02-B2-07 | 员工可以给自己提权、扩大范围或通过中间人越级授权 | 禁止自提权 / 越级授权 / 中间人绕过；本人变更由另一名具足够授权边界的 active 管理者执行 | 9/19 R1 §6/§16；9/22 VR-P-014；IA CR-S4-C02 | `USER_CONFIRMED` |
| P02-B2-08 | 员工离职后重新入职时新建新的 `employee_id` | 确认同一真人后继续复用原 `employee_id`，重新授权，不自动拿回旧权限/客户/业务 | CN11 DEC-037 明确“禁止恢复：rehire 新建 employee_id”；9/19/IA 同向 | `USER_CONFIRMED` |
| P02-B2-09 | 普通销售 / 经理 / 店长 / 4S 角色变化时新建新的员工账号 | 角色变、人不变；继续同一 `employee_id`，只更新当前 role/permission/data scope | CN11 DEC-038 明确禁止恢复；9/19/IA 同向 | `USER_CONFIRMED` |
| P02-B2-10 | 员工当前角色变化后，把历史操作记录中的历史角色一起改成当前角色 | 历史操作保留事件发生当时的角色、门店和责任事实，不做历史回写 | CN11 DEC-038 被否决方案；9/19 R1 身份连续性同向 | `USER_CONFIRMED` |
| P02-B2-11 | 为 4S 成员建设独立 4S App / 独立 4S IA | 4S 成员共用员工端，由角色、权限和 data scope 裁剪 | CN11 DEC-002 + 全局 Superseded 附录；IA 废弃项继续确认 | `USER_CONFIRMED` |
| P02-B2-12 | 允许普通员工 / 经理 / 店长直接管理 System Admin 账号 | System Admin 账号只允许 active System Admin 管理 | CN11 DEC-069 明确“禁止恢复”；9/19 R1 §3；9/22 VR-P-017 | `USER_CONFIRMED` |
| P02-B2-13 | V1 再增加一层“超级管理员 / Owner”高于 System Admin | 不新增第二层管理员角色；System Admin 自身采用 active/inactive + 至少一名 active 的治理模型 | CN11 DEC-069 明确“禁止恢复：V1 新增超级管理员/Owner 第二层级”；后续无恢复 | `USER_CONFIRMED` |
| P02-B2-14 | 当接客池无人时，让 System Admin 临时兜底成为销售 / 客户负责人 | System Admin 不承担销售业务；接客池可用性由员工接客资格和运营保护解决，不用 System Admin 填业务权限缺口 | CN11 DEC-039 明确“禁止恢复：System Admin 兜底销售”；9/19/IA 坚持 System Admin 独立域 | `USER_CONFIRMED` |

### P02-A16｜内部价 / 批发价查看独立 permission｜用户主动新修改

状态：`USER_CONFIRMED_NEW_CHANGE`

2026-09-24 用户明确修改：

- “查看名邦内部价 / 批发价”恢复为独立 permission；
- 名邦员工只有具备该 permission，且车辆在其 data scope、对象状态允许时，才能查看内部价 / 批发价；
- 进入内部模式本身不能自动获得该 permission；
- 经理 / 店长也不因职位自动获得，仍按权限配置；
- 4S 成员对此能力为 hard DENY，不能通过角色模板或个人授权绕过。

本规则主动覆盖 9/19 R1 “内部价查看不需要独立权限”的旧口径。

Decision Register：`PDM02-DEC-A16`。

### P02-A17｜System Admin 权限来源 / 首次初始化｜用户确认补充

状态：`USER_CONFIRMED_NEW_CHANGE`

- System Admin 的 P05 系统账号域权限，由其他 active System Admin 管理；
- 必须始终保留至少 1 个 active System Admin；
- 第一个 System Admin 由系统初始化 / bootstrap 建立，不从员工业务角色中产生；
- System Admin 身份不授予员工业务 permission；
- 同一真人若还需要 CRM / 车辆 / 价格 / Lock / Transaction 等业务权限，使用独立员工身份；
- 该员工身份的角色、permission、data scope 由另一名具足够授权边界的 active 员工管理者在 P04 配置；
- 禁止 System Admin 利用系统身份给自己的员工身份提权或绕过 P02-A10。

Decision Register：`PDM02-DEC-A17`。

## 6. Batch 2 边界说明

本批只登记已经有“明确废弃 / 禁止恢复 / 明确替代”证据的旧方向。

以下暂不放入 Batch 2：

- 一键转名邦是否需要独立 permission：属于车辆业务动作的跨域权限，留 PDM-04 / PDM-21 结合当前规则处理；
- 经理 / 店长默认具备哪些敏感能力：不是单纯废弃项，后续 Batch 3～4 处理；
- 角色模板实时继承、接客保护、4S cooperation scope：属于当前有效细则，不属于本批废弃项；
- 员工维护客户手机号的具体 capability：属于本轮新权限选择，后续 Batch 4 处理。

## 7. Batch 2 门禁

P02-B2-02 已撤回并由 P02-A16 替代；P02-B2-04 已确认；P02-B2-01、B2-03、B2-05～B2-14 已全部确认。Batch 2 已完成。

Batch 2：`COMPLETE_USER_CONFIRMED`。

下一步允许准备：

> PDM-02 Batch 3｜明确知情修改 / 后续明确新增。

Batch 3 仍须单独展示并等待用户确认。
