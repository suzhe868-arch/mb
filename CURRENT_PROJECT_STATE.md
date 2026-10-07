## 2026-10-07｜PDM-25 Batch 2 已批准并执行，进入 Batch 3

- `P25-B2-01～P25-B2-08 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan：`PASS / FALSE_DEPRECATION_COUNT=0`；
- Customer Merge 不得因历史审计项恢复；
- 独立 Recommendation qualification / P06-06 不得恢复；
- 独立“调价”Action / permission 不得恢复；
- 不新增独立 `can_call_wholesale_phone`；
- Announcement 旧三档频率 / 重新发布重置触达模型不得恢复；
- “详情 Banner 不是强制模块”旧语义不得恢复，VEHICLE_DETAIL 继续是固定 placement 能力；
- reason 不做全局必填；
- 历史审计对象清单不得作为 Current 业务能力复活清单；
- 24 / 24 incoming handoff 继续 `HANDOFF_ACCEPTED`，Final Closeout 前不关闭 / 不 source backwrite；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**PDM-25 Batch 3｜明确知情修改 / 后续明确新增审查。**

## 2026-10-07｜PDM-25 Batch 1 已批准并执行，进入 Batch 2

- `P25-A01～P25-A17 = PASS / USER_APPROVED / APPLIED`；
- Batch 1 confirmed count = 17；
- 审计只读、重要 mutation 可追溯、reason 按来源域决定、普通浏览不强制高等级审计；
- Current Projection / Historical Fact 分离，纠错采用追加事实，不抹除真实历史；
- 重要配置 before/after/actor/time 可追溯，新配置默认不追改已固化 snapshot；
- 统一业务自然日：`Asia/Shanghai (UTC+8)`；
- 权限撤销后旧页面/session/deep-link/敏感 payload 不再构成授权；
- human actor / system actor 必须可区分；
- 幂等、唯一 active、并发 winner、不重复扣减、不超退等只冻结产品结果，不冻结 DB/MQ/事务框架；
- 24 / 24 incoming handoff 继续 `HANDOFF_ACCEPTED`，Final Closeout 前不得关闭或 source backwrite；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**PDM-25 Batch 2｜明确废弃 / 已覆盖 / 不得恢复审查。**

## 2026-10-07｜PDM-25 Startup Gate 已批准并执行

- `P25-R00 = USER_APPROVED / APPLIED`；
- PDM-25 定位：全项目审计 / 历史 / 时区 / 配置版本 / 终态真实性 / 横切完整性的唯一产品 Authority；
- 工作版：`07_重建工作区/PDM-25_审计历史时区配置版本终态与横切完整性_规则原子重建_工作版.md`；
- target=PDM-25 的 24 / 24 incoming handoff：`HANDOFF_ACCEPTED`；
- `INCOMING_HANDOFF_GAP = 0`；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `GLOBAL_INVARIANT_CONFLICT = 0`；
- 历史 R12 P11“Customer Merge 审计”仅保留历史 carrier，不恢复 V1 Customer Merge；
- 统一业务时区：`Asia/Shanghai (UTC+8)`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**PDM-25 Batch 1｜稳定一致规则审查。**

## 2026-10-07｜PDM-24 Final Closeout COMPLETE

- 用户已最终批准 PDM-24 Final Domain Overview，并随后明确“确定执行”；
- 正式 Authority：`07_重建工作区/PDM-24_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-24_最终完整性复核_2026-10-07.md / PASS`；
- `PDM-24 = COMPLETE / INTEGRITY_PASS`；
- 正式规则 / 裁决单元：40；
- `HO-P20-P24-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-20 §40 旧“详情 Banner 可选”已正式回写为：VEHICLE_DETAIL 为固定广告位能力，内容可为空；
- `HO-P24-P25-001 = HANDOFF_OPEN`；
- PDM-25 当前 incoming handoff：24 条，全部等待 Startup Gate 正式接收；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-25 Startup Gate。**

## 2026-10-07｜PDM-24 Prefinal R2 PASS，Final Candidate Ready

- R2 报告：`07_重建工作区/PDM-24_Final前完整性复核_R2_2026-10-07.md`；
- `PDM24_PREFINAL_R2 = PASS / FINAL_CANDIDATE_READY`；
- `PDM24_FORMAL_UNITS = 40`；
- Source→Atom / Atom→Source / Semantic Completeness / Completed-PDM Invariant / Negative Claims 均 PASS；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 0`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- PDM-20 旧“详情 Banner 可选”已确认是待 Final Closeout source backwrite 的历史尾巴，不构成当前硬冲突；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`；
- `HO-P24-P25-001 = HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**形成 PDM-24 Final Domain Overview，并提交用户最终批准。**

## 2026-10-07｜PDM-24 Prefinal R1 修复已执行，进入 R2

- `PREFINAL_R1 = REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- R1 报告：`07_重建工作区/PDM-24_Final前完整性复核_R1_2026-10-07.md`；
- `P24-LIA-01～P24-LIA-04 = PASS / USER_APPROVED / APPLIED`；
- LIA-01：公告日期 / 每日频控统一按 Asia/Shanghai（UTC+8）业务自然日解释，结束日期当天仍有效；
- LIA-02：Announcement 到期 / 停用进入 history、不删除；合法周期内可再启用，过期需新排期；
- LIA-03：采用 3A；当天第一次进入被其他主动弹层占用时，Announcement 当天不补弹；
- LIA-04：无效公告周期不得启用；Banner 非空 target 保存 / 启用时必须合法，后续失效降为纯展示；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`；
- `HO-P24-P25-001 = HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-24 Prefinal Integrity R2。**

## 2026-10-07｜PDM-24 Batch 4 已批准并执行，进入 Prefinal Integrity

- `P24-B4-01～P24-B4-07 = PASS / USER_APPROVED / APPLIED`；
- B4-01：用户修订为“公告设置有效周期 + 自动弹出开关；同一客户每天公告主动弹层全局最多 1 条；取消仅首次一次/三档频率”；
- B4-02：采用 2A，普通编辑不重置当天展示事实；需要新一轮触达时新建公告；
- B4-03：多条有效公告当天第一次进入按后台排序择一，不补弹其他公告；
- B4-04：补齐标题、正文、开始/结束日期、自动弹出开关等字段；
- B4-05：采用 5A，Banner V1 继续仅内部白名单合法目标，不开放外链；
- B4-06：Banner 停用不删除，可再启用并重新校验；
- B4-07：`HO-P24-P25-001 = HANDOFF_OPEN` 已正式登记；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`，Final Closeout 前仍不关闭、不 source backwrite；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-24 Final 前完整性复核（Prefinal Integrity）**。

## 2026-10-07｜PDM-24 Batch 3 已执行并完成窗口切换交接

- `BATCH_3 = NO_NEW_ATOMS / PASS / USER_APPROVED / APPLIED`；
- `BATCH_3_CONFLICT_ISOLATION = PASS`；
- `NEW_INDEPENDENT_ATOMS = 0`；
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`；
- 窗口交接快照：`07_重建工作区/PDM-24_窗口切换交接_2026-10-07.md`；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`，未关闭、未 source backwrite；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-24 Batch 4 Final-gap Scan。**

## 2026-10-07｜PDM-24 Batch 2 已执行并进入 Batch 3

- `P24-B2-01～P24-B2-12 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 later-addition / explicit-change scan = `NO_NEW_ATOMS / PENDING_USER_REVIEW`；
- `NEW_INDEPENDENT_ATOMS = 0`；
- `DUPLICATE_RULE_CREATION = 0`；
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`；
- `HO-P20-P24-001` 继续 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**用户审查 PDM-24 Batch 3“无新增独立规则原子”结论。**

## 2026-10-07｜PDM-24 Batch 1 已执行并进入 Batch 2

- `P24-A01～P24-A15 = PASS / USER_APPROVED / APPLIED`；
- Batch 1 confirmed count = 15；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 2 候选：`P24-B2-01～P24-B2-12 / PENDING_USER_REVIEW`；
- Batch 2 仅包含明确废弃 / 已覆盖 / DO_NOT_RESTORE 方向，不引入新产品选择；
- `HO-P20-P24-001` 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**用户审查 PDM-24 Batch 2。**

## 2026-10-07｜PDM-24 Startup Gate PASS 并进入 Batch 1

- `P24-R00 = USER_APPROVED / APPLIED`；
- `P24-R01 = USER_APPROVED / APPLIED`：VEHICLE_DETAIL 为车辆详情页固定广告位能力；无有效 Banner 时可不展示具体广告内容，但广告位能力本身固定存在；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`，Final Closeout 前不关闭、不 source backwrite；
- completed-PDM hard conflict = 0；incoming gap = 0；
- 当前正式 placement = `HOME_TOP / VEHICLE_DETAIL`；
- 不建设通用消息中心、营销自动化平台或万能 Placement Engine；
- Batch 1 候选：`P24-A01～P24-A15 / PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**用户审查 PDM-24 Batch 1。**

## 2026-10-07｜PDM-23 Final Closeout COMPLETE

- 用户已最终批准并明确“确认执行”；
- 正式 Authority：`07_重建工作区/PDM-23_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-23_最终完整性复核_2026-10-07.md / PASS`；
- 65 个正式规则 / 裁决单元全部进入 Final；
- 10 / 10 incoming handoff = `HANDOFF_CLOSED / source_backwrite=YES`；
- 10 / 10 来源 PDM Final 已完成反向回写；
- `HO-P23-P25-001 = HANDOFF_OPEN`；
- PDM-23 = `COMPLETE / INTEGRITY_PASS`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-24 Startup Gate**。

## 2026-10-07｜PDM-23 Prefinal R1 修复已执行，R2 PASS

- Prefinal R1 = `REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- `P23-LIA-01～P23-LIA-04 = PASS / USER_APPROVED / APPLIED`；
- LIA-01：同一业务事件/同一通知阶段原则上只通知一次；Consultation 同一次 SLA timeout 原则上只做一次群告警；
- LIA-02：SLA 群告警最小必要内容 + 敏感字段最小化 + deep-link 重鉴权；
- LIA-03：持续 Incident 重复告警是普通去重例外；只按已配置 cadence，不恢复旧固定 2/5/15 分钟默认；
- LIA-04：微信“可接入”≠“当前已启用”；无明确 customer-WeChat allowlist + 合法平台能力/模板 + 用户授权前不自动发送；
- Prefinal R2 = `PASS / FINAL_CANDIDATE_READY`；
- 正式规则 / 裁决单元 = 65；
- missing rule = 0；semantic detail gap = 0；completed-PDM hard conflict = 0；
- 10 / 10 incoming handoff 继续 HANDOFF_ACCEPTED，最终批准前不关闭；
- HO-P23-P25-001 继续 HANDOFF_OPEN；
- Final Overview：`07_重建工作区/PDM-23_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**用户最终审查 / 批准 PDM-23 最终完整规则总览。**

## 2026-10-07｜PDM-23 Batch 4 历史重扫重建版已批准并执行

- 历史重扫已完成：9/06 SSOT/Decision、R12、001～078、Current P09 carrier 与 completed-PDM Final 已复核；
- 旧 `P23-B4-01～P23-B4-06` 保留为历史草案，状态 `SUPERSEDED_NOT_APPROVED_NOT_APPLIED`；
- 新正式 Batch 4：`P23-B4R-01～P23-B4R-10 = PASS / USER_APPROVED / APPLIED`；
- 微信小程序订阅消息：保留未来接入能力，当前不作为核心业务依赖，不建通用客户消息中心；
- 飞书：保留公司总开关、员工个人提醒开关、合法总群路由；取消重复的独立“群总开关”；
- 员工级“其 SLA 超时是否进入飞书总群”正式保留，默认开启，由合法管理/配置能力控制；
- 未来独立 App Push 仅预留 notification channel 接入能力，V1 不实现；PC 主动 Push V1 不做；
- `HO-P23-P25-001` 已正式登记为 HANDOFF_OPEN；
- completed-PDM hard conflict = 0；local product choice unresolved = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-23 Final 前完整性复核（Prefinal Integrity）**。

## 2026-10-07｜PDM-23 窗口切换交接已保存｜Batch 4 暂停审查并要求重建

- Startup Gate + Batch 1～3 = 已正式 PASS / APPLIED；
- 原 P23-B4-01～P23-B4-06 完整保留，但改为“旧版 Batch 4 草案”，未批准、未执行；
- 本窗口新增讨论已保存：微信小程序消息能力、飞书多层开关、员工级总群 SLA 超时通告开关、PC 暂不做主动通知、未来 App Push 仅预留；
- “员工级总群 SLA 超时通告开关”当前只标记为 conversation-recovered candidate，必须历史重扫；
- 交接文件：`07_重建工作区/PDM-23_窗口切换交接_2026-10-07.md`；
- 当前门禁：`BATCH_4_REVIEW_SUSPENDED / REBUILD_REQUIRED_AFTER_HISTORICAL_RESCAN`；
- 当前唯一下一步：新窗口读取交接快照并重新扫描通知历史，再生成完整 Batch 4；
- IA / Low-Fi / Engineering 未施工。

## 2026-10-07｜PDM-23 Batch 3 已执行并进入 Batch 4

- `P23-B3-01～P23-B3-16 = PASS / USER_APPROVED / APPLIED`；
- Batch 4 Final-gap 已形成：`P23-B4-01～P23-B4-06 / PENDING_USER_REVIEW`；
- 真正产品选择 = 1；稳定收口项 = 5；
- 推荐选择：`1A`；
- P23→P25 outgoing handoff 尚待本批批准；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-23 Batch 4。

## 2026-10-07｜PDM-23 Batch 2 已执行并进入 Batch 3

- `P23-B2-01～P23-B2-14 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 已形成：`P23-B3-01～P23-B3-16 / PENDING_USER_REVIEW`；
- Batch 3 未引入新产品选择：`NEW_PRODUCT_CHOICE_INTRODUCED=0`；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-23 Batch 3。

## 2026-10-07｜PDM-23 Batch 1 已执行并进入 Batch 2

- `P23-A01～P23-A20 = PASS / USER_APPROVED / APPLIED`；
- Batch 2 Reverse Conflict Scan 已形成：`P23-B2-01～P23-B2-14 / PENDING_USER_REVIEW`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-23 Batch 2。

## 2026-10-07｜PDM-23 Startup Gate PASS 并进入 Batch 1

- `P23-R00 = USER_APPROVED / APPLIED`；
- PDM-23 核心定位：通知 / 飞书 / 主动提醒 / 夜间免打扰 / Incident 通知投递 / 通知日志唯一 Authority；
- 10 / 10 incoming handoff = `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；incoming gap = 0；
- Current P09 carrier 已读取，但不等同工程实现；
- Batch 1 已形成：`P23-A01～P23-A20 / PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-23 Batch 1。

## 2026-10-07｜PDM-22 Final Closeout COMPLETE

- 用户已对 PDM-22 Final Domain Overview 最终批准并确认执行；
- 正式 Final：`07_重建工作区/PDM-22_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-22_最终完整性复核_2026-10-07.md / PASS`；
- PDM-22 = `COMPLETE / INTEGRITY_PASS`；
- 正式规则 / 裁决单元 = `58`；
- 18 / 18 incoming handoff = `HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-22 → PDM-23 / PDM-25 两条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：`PDM-23 Startup Gate`。

## 2026-10-07｜PDM-22 R1 修复已执行；Prefinal R2 PASS

- `P22-LIA-01～P22-LIA-06 = PASS / USER_APPROVED / APPLIED`；
- R1 repair closed = `6 / 6`；
- PDM-22 → PDM-23 / PDM-25 outgoing handoff 已正式登记为 `HANDOFF_OPEN`；
- Final 前完整性复核 R2 = `PASS / FINAL_CANDIDATE_READY`；
- 正式规则 / 裁决单元 = `58`；
- missing=0；semantic gap=0；completed-PDM conflict=0；incoming gap=0；outgoing gap=0；local product choice=0；
- 18/18 incoming handoff 仍保持 `HANDOFF_ACCEPTED`，最终批准前不关闭；
- Final Domain Overview 已生成：`07_重建工作区/PDM-22_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户最终审查 / 批准 PDM-22 Final Domain Overview。

## 2026-10-07｜PDM-22 Batch 4 已执行；Final 前完整性复核 R1 = REPAIR_REQUIRED

- `P22-B4-01～P22-B4-08 = PASS / USER_APPROVED / APPLIED`；
- 用户选择：`1A / 2A / 3同意 / 4A / 5A / 6A / 7同意 / 8同意`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Prefinal R1：`REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- missing=2；semantic gap=3；incoming landing gap=3；outgoing handoff gap=1 group；
- 修复候选：`P22-LIA-01～P22-LIA-06 / PENDING_USER_REVIEW`；
- 18/18 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P22-LIA-01～P22-LIA-06。

## 2026-10-07｜PDM-22 Batch 3 已批准执行并进入 Batch 4

- `P22-B3-01～P22-B3-09 = PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- `NEW_DOMAIN_STATE_MACHINE=0`；
- 对 18 条 incoming handoff 与 R12 / PDM-01～21 Final 再扫描后形成 Batch 4：`P22-B4-01～P22-B4-08 / PENDING_USER_REVIEW`；
- Batch 4 含 5 个真正 PC 产品承载选择，推荐 `1A / 2A / 4A / 5A / 6A`；
- B4-03 / B4-07 / B4-08 为稳定 carrier 补漏，不新增业务选择；
- 18/18 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-22 Batch 4。

## 2026-10-07｜PDM-22 Batch 2 已批准执行并进入 Batch 3

- `P22-B2-01～P22-B2-11 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- B2-01 已按已执行的 `P22-ADD-01` 明确：PC 网页账号密码绑定原 employee_id，不创建第二 Employee；
- 已形成 Batch 3 Conflict Isolation：`P22-B3-01～P22-B3-09 / PENDING_USER_REVIEW`；
- Batch 3 只补齐 PDM-01～21 已冻结上游语义的 PC carrier，不新增业务状态机；
- `MISCLASSIFIED_PRODUCT_CHOICE=0`，`NEW_DOMAIN_STATE_MACHINE=0`；
- 18/18 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-22 Batch 3。

## 2026-10-07｜PDM-22 新增 PC 网页登录身份规则已执行

- 用户明确确认：现有销售 / 经理 / 店长 Employee 不新建第二身份，而是在原 `employee_id` 上增加 PC 网页“登录账号 + 密码”；
- `P22-ADD-01 = USER_APPROVED / APPLIED`；
- 客户端 / 销售端微信侧入口与 PC 网页后台认证正式分层；
- PC 登录成功后继续读取原 Employee 的角色、permission、data scope、account status 与 object state；
- 开通 PC 登录不增加业务权限，Employee 停用后 PC 登录及旧登录态立即失效；
- System Admin 继续独立系统身份 / 独立登录凭证，不与 Employee PC 登录合并；
- 4S 默认不开 PC，仅明确授予 PC 车辆管理能力时才允许启用对应登录；
- B2-01 已同步补充“网页认证 ≠ 第二 Employee 身份”的边界；
- Batch 2 本身仍为 `P22-B2-01～P22-B2-11 / PENDING_USER_REVIEW`，未偷渡通过；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：继续审查 PDM-22 Batch 2。

## 2026-10-07｜PDM-22 Batch 1 用户批准并执行

- 用户对 `P22-A01～P22-A22` 全部同意，随后确认执行；
- `P22-A01～P22-A22 = PASS / USER_APPROVED / APPLIED`；
- 22 条稳定 PC 后台 / 配置 / Integration 基础规则正式进入当前工作 Authority；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- 形成 `P22-B2-01～P22-B2-11 / PENDING_USER_REVIEW`；
- 旧 System Admin 专属后台、独立 Recommendation qualification、旧 Refund 两状态、旧 Collector Phone API 方向、旧内部价权限删除、mapping pending 阻断、source_type 冻结等均进入明确废弃 / 替代扫描；
- 18 / 18 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-22 Batch 2。

## 2026-10-07｜PDM-22 Startup Gate 通过并进入 Batch 1 审查

- 用户已批准并明确“确认执行” `P22-R00`；
- PDM-22 核心定位已补齐采集系统三个固定车源 API、名邦 Integration API 与 Collector 电话回传链路；
- Startup Gate = `PASS`；
- CROSS_PDM_HANDOFF_REGISTER 机械复核 target=PDM-22 = 18 条；
- 18 / 18 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- global invariant conflict = 0；
- 旧 Recommendation 独立资格、旧 Refund 两状态、旧内部价 permission 删除、旧 Mingbang→Collector Phone API 等均已隔离为 stale，不进入 Batch 1；
- 工作版：`07_重建工作区/PDM-22_PC后台信息架构业务管理配置归属上游运行管理_规则原子重建_工作版.md`；
- Batch 1 候选：`P22-A01～P22-A22`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-22 Batch 1。

## 2026-10-06｜PDM-21 Final 正式发布并完成 Closeout

- 用户明确“最终批准确认执行”；
- 正式 Authority：`07_重建工作区/PDM-21_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-21_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-21 = COMPLETE / INTEGRITY_PASS`；
- 56 个正式规则 / 用户裁决单元全部进入 Final；
- 19 / 19 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-02～PDM-20 共 19 个 Final 已反向回写；
- PDM-21 → PDM-23 / PDM-25 两条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：PDM-22 Startup Gate。

## 2026-10-06｜PDM-21 Prefinal R1 修复执行完成，R2 PASS

- 用户对 `P21-LIA-01～P21-LIA-09` 全部同意，随后明确“确认执行”；
- `P21-LIA-01～P21-LIA-09 = PASS / USER_APPROVED / APPLIED`；
- `R1_REPAIR_CLOSED = 9 / 9`；
- PDM-21 → PDM-23 / PDM-25 两条 outgoing handoff 已正式登记并保持 `HANDOFF_OPEN`；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Final 前完整性复核 R2 = `PASS / FINAL_CANDIDATE_READY`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 0`；
- Final Overview：`07_重建工作区/PDM-21_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户最终批准 PDM-21 Final Domain Overview。

## 2026-10-06｜PDM-21 Batch 4 批准执行并完成 Final 前 R1

- 用户裁决 `P21-B4-01～P21-B4-07 = 1A～7A`，随后明确“确认执行”；
- `P21-B4-01～P21-B4-07 = PASS / USER_APPROVED / APPLIED`；
- 用户补充确认：正常车辆详情 Internal Mode 有“隐藏车源”，hidden Vehicle 对应“恢复显示 / 解除隐藏”；hidden/restore 与 offline/relist 严格分离；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Final 前完整性复核 R1 = `REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- 报告：`07_重建工作区/PDM-21_Final前完整性复核_R1_2026-10-06.md`；
- 形成 `P21-LIA-01～P21-LIA-09 / PENDING_USER_REVIEW`；
- R1：missing=5，semantic detail=3，incoming landing gap=7，outgoing handoff gap=1 group；
- completed-PDM hard conflict = 0；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P21-LIA-01～P21-LIA-09。

## 2026-10-06｜PDM-21 Batch 3 用户批准并执行

- 用户对 `P21-B3-01～P21-B3-10` 全部同意，随后明确“确认执行”；
- `P21-B3-01～P21-B3-10 = PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- Batch 4 Gap / Choice Scan 已完成；
- 形成 `P21-B4-01～P21-B4-07 / PENDING_USER_REVIEW`，推荐 `1A～7A`；
- 7 项分别为：4S Internal Mode、敏感 Action 页面归位、隐藏车源入口、一键转名邦确认、Consultation 即将超时阈值、Internal Mode 后台超时退出、E01 强待办统一排序；
- completed-PDM mutation = 0；
- new domain state machine = 0；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户裁决 PDM-21 Batch 4。

## 2026-10-06｜PDM-21 Batch 2 用户批准并执行

- 用户对 `P21-B2-01～P21-B2-09` 明确“全部同意确认执行”；
- `P21-B2-01～P21-B2-09 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- 形成 `P21-B3-01～P21-B3-10 / PENDING_USER_REVIEW`；
- 4S Internal Mode 进入方式、敏感 Action 页面归位、Consultation“即将超时”阈值等真正产品选择继续留 Batch 4；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-21 Batch 3。

## 2026-10-06｜PDM-21 Batch 1 用户批准并执行

- 用户对 `P21-A01～P21-A20` 全部同意，随后确认执行；
- `P21-A01～P21-A20 = PASS / USER_APPROVED / APPLIED`；
- 20 条稳定员工端基础规则正式进入当前工作 Authority；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- 形成 `P21-B2-01～P21-B2-09 / PENDING_USER_REVIEW`；
- 4S Internal Mode 具体进入方式、敏感动作页面归位等仍需产品判断的事项未误塞 Batch 2；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-21 Batch 2。

## 2026-10-06｜PDM-21 Startup Gate 通过并进入 Batch 1 审查

- 用户已批准并确认执行 `P21-R00`：PDM-21 是员工端产品体验、工作台编排与 Employee Action Projection 的唯一 Authority；
- Startup Gate = `PASS`；
- CROSS_PDM_HANDOFF_REGISTER 机械复核确认 target=PDM-21 **实际为 19 条**；
- 19 / 19 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P02/P03/P04/P05/P06/P07/P08/P09/P10/P11/P12/P13/P14/P15/P16/P17/P18/P19/P20 → PDM-21；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- global invariant conflict = 0；
- Current Authority Refresh 已覆盖 9/19 R10/R11、001～078 M15/M17、Current IA/Low-Fi 与 PDM-01～20 Final；
- 旧内部价权限语义、4S Internal Mode 整体 DENY、一键转名邦独立 permission、旧“我要这辆车”工作台、CRM 直接锁车等已识别为后续冲突/替代项，未偷渡进 Batch 1；
- 工作版：`07_重建工作区/PDM-21_员工工作台车辆列表客户中心内部模式敏感动作裁剪_规则原子重建_工作版.md`；
- Batch 1 候选：`P21-A01～P21-A20`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-21 Batch 1。

## 2026-10-06｜PDM-20 Final 正式发布并完成 Closeout

- 用户最终批准 PDM-20 Final Domain Overview，并明确确认执行；
- 正式 Authority：`07_重建工作区/PDM-20_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-20_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-20 = COMPLETE / INTEGRITY_PASS`；
- 53 个正式规则 / 用户裁决单元全部进入 Final；
- 14 / 14 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01/03/04/05/07/08/10/11/12/13/14/15/18/19 Final 已反向回写；
- 4 条 outgoing handoff（PDM-21 / PDM-22 / PDM-24 / PDM-25）继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-21 Startup Gate。

## 2026-10-06｜PDM-20 Prefinal R1 修复执行完成，R2 PASS

- 用户已批准并确认执行 `P20-LIA-01～P20-LIA-07`；
- `R1_REPAIR_CLOSED = 7 / 7`；
- PDM-20 → PDM-21 / 22 / 24 / 25 四条 outgoing handoff 已正式登记为 `HANDOFF_OPEN`；
- PDM-20 stale carrier 已登记，当前不施工；
- Final 前完整性复核 R2 = `PASS / FINAL_CANDIDATE_READY`；
- 正式规则 / 裁决单元总数 = 53；
- missing rule = 0；
- semantic detail gap = 0；
- completed-PDM conflict = 0；
- incoming handoff gap = 0；
- outgoing handoff gap = 0；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`，Final closeout 前不关闭；
- Final Overview：`07_重建工作区/PDM-20_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终批准 PDM-20 Final Domain Overview。

## 2026-10-06｜PDM-20 Batch 4 批准执行并完成 Final 前 R1

- 用户对 `P20-B4-01～P20-B4-10` 全部同意，按推荐 `1A～10A`，随后明确“确认执行”；
- `P20-B4-01～P20-B4-10 = PASS / USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Final 前完整性复核 R1 已完成：`REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- 报告：`07_重建工作区/PDM-20_Final前完整性复核_R1_2026-10-06.md`；
- 形成 `P20-LIA-01～P20-LIA-07` 七项修复候选；
- R1：missing=3，semantic detail=3，cross-PDM alignment=1，outgoing handoff gap=1 group；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- outgoing handoff 待 LIA-07 用户批准后正式登记；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P20-LIA-01～P20-LIA-07。

## 2026-10-06｜PDM-20 Batch 3 用户批准并执行

- 用户对 `P20-B3-01～P20-B3-08` 全部同意，随后明确“确认执行”；
- `P20-B3-01～P20-B3-08 = PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- Batch 4 Gap / Choice Scan 已完成；
- 形成 `P20-B4-01～P20-B4-10 / PENDING_USER_REVIEW`，推荐 `1A～10A`；
- completed-PDM mutation = 0；
- new domain state machine = 0；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-20 Batch 4。

## 2026-10-06｜PDM-20 Batch 2 用户批准并执行

- 用户对 `P20-B2-01～P20-B2-09` 全部同意，随后以“确认指型”明确执行；
- `P20-B2-01～P20-B2-09 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- 形成 `P20-B3-01～P20-B3-08 / PENDING_USER_REVIEW`；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-20 Batch 3。

## 2026-10-06｜PDM-20 Batch 1 用户批准并执行

- 用户对 `P20-A01～P20-A18` 全部同意，随后明确“确认执行”；
- `P20-A01～P20-A18 = PASS / USER_APPROVED / APPLIED`；
- 18 条稳定客户端基础规则进入当前 Authority；
- Batch 2 Reverse Conflict Scan 已完成：`PASS / FALSE_DEPRECATION_COUNT=0`；
- 形成 `P20-B2-01～P20-B2-09 / PENDING_USER_REVIEW`；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-20 Batch 2。

## 2026-10-06｜PDM-20 Startup Gate 通过并进入 Batch 1 审查

- 用户已批准并确认执行 `P20-R00`：PDM-20 是客户端产品体验与 Customer Safe Projection 的唯一 Authority；
- Startup Gate = `PASS`；
- CROSS_PDM_HANDOFF_REGISTER 机械复核后确认 target=PDM-20 **实际为 14 条**，此前口头“15条”已纠正；
- 14 / 14 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P01/P03/P04/P05/P07/P08/P10/P11/P12/P13/P14/P15/P18/P19 → PDM-20；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- Current Authority Refresh 已覆盖 9/19 R10、001～078 M16/M10/M11、Current IA/Low-Fi 与 PDM-01/03/04/05/07/08/10/11/12/13/14/15/18/19 Final；
- R10 旧 owner、旧“我要这辆车”、旧 Priority visibility、旧批发查价等已识别为后续冲突/替代项，未偷渡进 Batch 1；
- 工作版：`07_重建工作区/PDM-20_客户端浏览搜索筛选排序列表详情收藏分享个人中心地域_规则原子重建_工作版.md`；
- Batch 1 候选：`P20-A01～P20-A18`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-20 Batch 1。

## 2026-10-06｜PDM-19 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview，并以“确认指向”明确执行；
- 正式 Authority：`07_重建工作区/PDM-19_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-19_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-19 = COMPLETE / INTEGRITY_PASS`；
- 41 个正式规则 / 用户裁决单元全部进入 Final；
- 10 / 10 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 02 / 03 / 04 / 07 / 13 / 14 / 15 / 17 / 18 Final 已反向回写；
- 5 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-20 Startup Gate。

## 2026-10-06｜PDM-19 Prefinal R1 修复执行并完成 R2

- `P19-LIA-01～P19-LIA-06 = PASS / USER_APPROVED / APPLIED`；
- `R1_REPAIR_CLOSED = 6 / 6`；
- 5 条 outgoing handoff 已正式登记并保持 `HANDOFF_OPEN`；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Final 前完整性复核 R2 = `PASS / FINAL_CANDIDATE_READY`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 0`；
- Final Overview：`07_重建工作区/PDM-19_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户最终批准 PDM-19 Final Domain Overview。

## 2026-10-06｜PDM-19 Batch 4 批准执行并完成 Final 前 R1

- 用户裁决 `1A～11A`，随后明确“确认执行”；
- `P19-B4-01～P19-B4-11 = PASS / USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- B3-03 与 B4-01/B4-09 已统一为：pending Refund 不再退款时直接 close + 原因，不新增专门 close permission；
- Final 前完整性复核 R1 已完成：`REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- 报告：`07_重建工作区/PDM-19_Final前完整性复核_R1_2026-10-06.md`；
- 形成 `P19-LIA-01～P19-LIA-06` 六项修复候选；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- outgoing handoff 待 LIA-06 用户批准后正式登记；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P19-LIA-01～P19-LIA-06。

## 2026-10-06｜PDM-19 Batch 3 用户批准并执行

- 用户对 `P19-B3-01～P19-B3-03` 全部同意，随后明确“确认执行”；
- `P19-B3-01 / P19-B3-02 = PASS / USER_APPROVED / APPLIED`；
- `P19-B3-03 = USER_REVISED / PASS / USER_APPROVED / APPLIED`；
- B3-03 最终口径：pending Refund 确定不再退款时可直接关闭，只填写原因；不新增专门关闭 permission，不增加审批；closed 不等于 refunded；
- Batch 4 扫描形成 `P19-B4-01～P19-B4-11 / PENDING_USER_REVIEW`；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-19 Batch 4。

## 2026-10-06｜PDM-19 Batch 2 用户批准并执行

- 用户对 `P19-B2-01～P19-B2-06` 明确全部同意，随后以“真执行”授权落仓；
- `P19-B2-01～P19-B2-06 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 扫描形成 3 条后续明确新增 / 变更候选：Transaction 首次完成独立敏感权限、Deposit 追加式纠错、pending Refund 撤回/关闭但未退款；
- Batch 3 = `P19-B3-01～P19-B3-03 / PENDING_USER_REVIEW`；
- `closed_not_refunded` 的 Domain 状态/历史 outcome 映射、Transaction 成交纠错完整权限等冲突/遗漏继续留 Batch 4；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-19 Batch 3。

## 2026-10-06｜PDM-19 Batch 1 用户批准并执行

- 用户明确“全部同意”，随后明确“确认执行”；
- `P19-A01～P19-A14 = PASS / USER_APPROVED / APPLIED`；
- 14 条稳定规则正式进入当前工作 Authority；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 2 候选：`P19-B2-01～P19-B2-06`；
- Batch 2 只包含明确废弃 / superseded / DO_NOT_RESTORE 旧模型；Transaction 完成权限、Refund closed、责任人等未提前裁决；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-19 Batch 2。

## 2026-10-06｜PDM-19 Startup Gate 通过并进入 Batch 1 审查

- 用户已批准并确认执行 `P19-R00`：PDM-19 是 Deposit / Transaction / Refund / 成交纠错，以及换车资金与交易收口的唯一业务 Authority；
- Startup Gate = `PASS`；
- target=PDM-19 的 10 条 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P01-P19-001 / HO-P02-P19-001 / HO-P03-P19-001 / HO-P04-P19-001 / HO-P07-P19-001 / HO-P13-P19-001 / HO-P14-P19-001 / HO-P15-P19-001 / HO-P17-P19-001 / HO-P18-P19-001；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- Current Authority Refresh 已覆盖 9/19 C4/R8/R12、001～078 M14、Current IA CO-O18/O19/O20 与 PDM-01/02/03/04/07/13/14/15/17/18 Final；
- Current 中 Transaction 首次完成权限、Deposit correction、Refund closed-not-refunded 等后续细化已识别，但未偷渡进 Batch 1；
- 工作版：`07_重建工作区/PDM-19_意向金Transaction退款成交纠错换车_规则原子重建_工作版.md`；
- Batch 1 候选：`P19-A01～P19-A14`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-19 Batch 1。

## 2026-10-06｜PDM-18 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并确认执行；
- 正式 Authority：`07_重建工作区/PDM-18_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-18_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-18 = COMPLETE / INTEGRITY_PASS`；
- 43 个正式规则 / 用户裁决单元全部进入 Final；
- 10 / 10 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 02 / 03 / 04 / 07 / 10 / 12 / 13 / 14 / 17 Final 已反向回写；
- 6 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-19 Startup Gate。

## 2026-10-06｜PDM-18 Final Overview 用户最终批准

- 用户明确“同意”；
- `PDM-18 Final Overview = USER_FINAL_APPROVED`；
- `Final closeout = PENDING_EXECUTION_CONFIRMATION`；
- 10/10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- 6 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- 当前不得发布 Final、不得 source backwrite、不得进入 PDM-19；
- 当前唯一下一步：等待明确执行 Final closeout。

# 名邦汽车 V1｜当前项目状态

> 更新时间：2026-10-06  
> 状态源：GitHub `suzhe868-arch/mb` / `main`  
> 业务权威语言：中文（zh-CN）

## 当前阶段

`PRODUCT_BASELINE_REBUILD / DOMAIN_RULE_RECONSTRUCTION / PDM-24_BATCH_4_FINAL_GAP_SCAN`

> **当前有效快照以本文件顶部、`NEXT_ACTION.md` 与 `PROJECT_STATE.json` 为准。下方按日期保留的旧“当前状态 / 下一步”属于历史审计轨迹，不代表现在仍停留在该节点。**

当前域：

> **PDM-22｜PC 后台信息架构 / 业务管理 / 配置归属 / 上游运行管理**

当前域状态：

> `PDM-23 COMPLETE / INTEGRITY_PASS；PDM-24 STARTUP_GATE_PASS / BATCH_1_PASS / BATCH_2_PASS / BATCH_3_PENDING_USER_REVIEW`

当前工作文件：

> `07_重建工作区/PDM-22_PC后台信息架构业务管理配置归属上游运行管理_规则原子重建_工作版.md`

当前已纠正：

- P10-B2-10 原“禁止内部价独立 permission”分类已回开失效；
- P10-A15 已撤回 Batch 3 并转 Batch 4；
- P10-B4-01 已按用户裁决确认：内部价 / 底价查看采用后台可配置独立 permission；
- PDM-02 已在 Legacy Final Integrity Audit 中同步 PDM-10 当前内部价/调价语义，并补齐权限撤销、交接、System Admin 治理等细节；
- 新增全局 Step 5A / Batch 2、3 反向冲突硬门禁。

当前唯一下一步：

> **PDM-24 Batch 4 Final-gap Scan。**

## 2026-10-06｜PDM-18 R1 修复完成并通过 R2

- 用户对 `P18-LIA-01～P18-LIA-06` 全部同意并明确执行；
- `R1_REPAIR_CLOSED = 6/6`；
- 6 条 PDM-18 outgoing handoff 已登记 `HANDOFF_OPEN`；
- PDM-18 stale carrier 已登记 `CARRIER_DEFERRED`，当前不施工；
- Final 前完整性复核 R2：`PASS / FINAL_CANDIDATE_READY`；
- `MISSING_RULE_UNRESOLVED=0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED=0`；
- `COMPLETED_PDM_INVARIANT_CONFLICT=0`；
- `INCOMING_HANDOFF_GAP=0`；
- `OUTGOING_HANDOFF_GAP=0`；
- 已生成：`07_重建工作区/PDM-18_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终审查 PDM-18 Final Domain Overview。

## 2026-10-06｜PDM-18 Batch 4 批准执行并完成 Final 前 R1

- 用户裁决 `1A～10A`，随后明确执行；
- `P18-B4-01～P18-B4-10 = PASS / USER_APPROVED / APPLIED`；
- P18-A06/A13 已按“竞争 LockRequest 自动候补”修正；
- P18-A18 已补“Priority-origin Lock 继承客户侧排他可见性”；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Final 前完整性复核 R1 已完成：`REPAIR_REQUIRED`；
- 形成 `P18-LIA-01～P18-LIA-06`：手机号候补门槛、客户不自助取消候补、LockRequest 结果/审计、Lock 幂等、内部候补顺序 vs 客户不展示保证性排名、outgoing handoff + stale carrier/alignment；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P18-LIA-01～P18-LIA-06。

## 2026-10-06｜PDM-18 Batch 3 用户批准并执行

- 用户对当前 Batch 3 剩余 `P18-B3-01 + P18-B3-03` 明确“全部同意”，随后“确认执行”；
- `P18-B3-01 + P18-B3-03 = PASS / USER_APPROVED / APPLIED`；
- `P18-B3-02` 保持 `WITHDRAWN_FROM_BATCH3 / MOVED_TO_BATCH4`；
- Batch 4 扫描已形成 `P18-B4-01～P18-B4-10 / PENDING_USER_REVIEW`；
- B4-01（Priority→Lock 排他可见性）与 B4-02（竞争 LockRequest 自动候补）沿用用户已确认方向，但尚未正式应用；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-18 Batch 4。

## 2026-10-06｜PDM-18 Batch 3 候选重分类

- 用户对原 `P18-B3-02｜LOCK_CONFLICT 后只能主动候补`提出反向裁决：应自动转候补；
- 用户认可调整并随后确认执行；
- `P18-B3-02 = WITHDRAWN_FROM_BATCH3 / RECLASSIFIED_TO_BATCH4`；
- Batch 3 当前只剩 `P18-B3-01 + P18-B3-03 / PENDING_USER_REVIEW`；
- 新增 `P18-B4-PRE-02 = USER_DIRECTION_APPROVED / NOT_APPLIED`；
- 新方向：同车同 cycle 一笔 LockRequest 获锁后，其他仍有效 PENDING 自动转 Waitlist；候补顺序按原 LockRequest.created_at；Waitlist 不占车、不自动转 Lock；
- 该方向与已批准 P18-A06/A13 局部冲突，已标记 `BATCH4_CONFLICT_PENDING`，Batch 4 正式裁决前不提前改写 Authority；
- 原 `P18-B4-PRE-01` Priority→Lock 排他可见性方向仍为 NOT_APPLIED；
- 当前唯一下一步：用户审查 P18-B3-01 与 P18-B3-03。

## 2026-10-06｜PDM-18 Batch 2 用户批准并执行

- 用户对 `P18-B2-01～P18-B2-06` 明确“全部同意”，随后以“确认指向”按既有用法授权执行；
- `P18-B2-01～P18-B2-06 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 扫描形成 3 条明确 later-change Atom：4S 不审批 LockRequest、LOCK_CONFLICT 后另行主动候补、名邦员工在明确 Customer+Vehicle 上下文可直接正式 Lock；
- Batch 3 = `P18-B3-01～P18-B3-03 / PENDING_USER_REVIEW`；
- 用户已认可“普通 Lock 与 Priority→Lock 可见性差异”方向，但仅登记为 Batch 4 pending direction，尚未应用；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-18 Batch 3。

## 2026-10-06｜PDM-18 Batch 1 用户批准并执行

- 用户明确“全部同意确认执行”；
- `P18-A01～P18-A18 = PASS / USER_APPROVED / APPLIED`；
- 18 条稳定规则覆盖 LockRequest/Lock/Waitlist 分层、6h、并发审批、唯一 active Lock、72h、意向金超时边界、人工延期、Waitlist、owner/responsible、账号/车辆历史、价格快照、Priority/Recommendation/Matching 分层；
- 特别保留：合法名邦员工在 Customer + Vehicle 上下文明确且 Guard 合法时可直接创建正式 Lock；不得把 LockRequest 错做成所有 Lock 的强制前置；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 2 候选：`P18-B2-01～P18-B2-06`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-18 Batch 2。

## 2026-10-06｜PDM-18 Startup Gate 通过并进入 Batch 1 审查

- 用户已确认并授权执行 P18-R00：PDM-18 是 LockRequest / 正式 Lock / Waitlist / 延期 / 释放 / 到期 / 责任交接的唯一业务 Authority；
- Deposit / Transaction / Refund / 换车继续由 PDM-19 承接；
- Startup Gate = `PASS`；
- target=PDM-18 的 10 条 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P01-P18-001 / HO-P02-P18-001 / HO-P03-P18-001 / HO-P04-P18-001 / HO-P07-P18-001 / HO-P10-P18-001 / HO-P12-P18-001 / HO-P13-P18-001 / HO-P14-P18-001 / HO-P17-P18-001；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- Current Authority Refresh 已覆盖 9/19 R8/R10/R12、001～078 M13、Current C01-01/E07-08/P07，以及 PDM-01/02/03/04/07/10/12/13/14/17 Final；
- 明确识别 9/19 后新增 LockRequest 前置模型：客户锁车申请不等于正式 Lock，PENDING 6h 不占车，approve 成功才创建正式 Lock 并开始 72h；
- 旧“到期前默认 30 分钟提醒”等未重新确认细节未进入 Batch 1；
- 工作版：`07_重建工作区/PDM-18_LockRequest正式LockWaitlist延期释放_规则原子重建_工作版.md`；
- Batch 1 候选：`P18-A01～P18-A18`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-18 Batch 1。

## 2026-10-06｜PDM-17 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并确认执行；
- 正式 Authority：`07_重建工作区/PDM-17_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-17_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-17 = COMPLETE / INTEGRITY_PASS`；
- 34 个正式规则 / 用户裁决单元全部进入 Final；
- 6 / 6 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-02 / 03 / 11 / 13 / 15 / 16 Final 已反向回写；
- 6 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-18 Startup Gate。

## 2026-10-06｜PDM-17 Final 前完整性复核 R2 PASS

- P17-LIA-01～P17-LIA-05 已全部用户批准并执行；
- outgoing handoff 6 条已正式登记并保持 `HANDOFF_OPEN`；
- stale carrier 已登记为 `CARRIER_DEFERRED`，未修改 IA / Low-Fi；
- R2 报告：`07_重建工作区/PDM-17_Final前完整性复核_R2_2026-10-06.md`；
- `SOURCE_TO_ATOM = PASS`；
- `ATOM_TO_SOURCE = PASS`；
- `SEMANTIC_COMPLETENESS = PASS`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 0`；
- `PDM17_FINAL_CANDIDATE_READY = YES`；
- Final Overview 候选：`07_重建工作区/PDM-17_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终批准 Final Domain Overview；批准前不得发布 Final / 关闭 incoming / source backwrite / 进入 PDM-18。

## 2026-10-06｜PDM-17 Final 前完整性复核 R1

- 报告：`07_重建工作区/PDM-17_Final前完整性复核_R1_2026-10-06.md`；
- 结论：`REPAIR_REQUIRED`；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- local product choice unresolved = 0；
- 修复候选：`P17-LIA-01～P17-LIA-05`；
- 发现 1 处 Current Low-Fi stale carrier：P06-05 指定分配二次确认与 P17-A11 冲突；当前只登记，不施工；
- 当前唯一下一步：用户审查 P17-LIA-01～P17-LIA-05，未经批准不得进入 R2 / Final Overview。

## 2026-10-06｜PDM-17 Batch 4 用户批准并执行

- 用户选择：`1A、2A、3A、4A、5A、6A、7A、8A、9A`；
- 用户随后明确“确认执行”；
- `P17-B4-01～P17-B4-09 = PASS / USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- 6 / 6 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：Final 前完整性复核 R1。

## 2026-10-06｜PDM-17 Batch 3 通过并进入 Batch 4

- 用户明确同意 Batch 3“无新增独立规则原子”结论，随后确认执行；
- `BATCH_3 = NO_NEW_ATOMS / PASS / USER_APPROVED / APPLIED`；
- `NEW_INDEPENDENT_ATOMS=0`；
- `DUPLICATE_RULE_CREATION=0`；
- `MISCLASSIFIED_PRODUCT_CHOICE=0`；
- Batch 4 已完成历史 R6、001～078 与当前 PDM-17 的冲突/遗漏扫描；
- 形成 `P17-B4-01～P17-B4-09` 共 9 个待裁决项；
- 其中明确发现：长期未真实跟进公海候选“三条件 AND”历史规则丢失；公海普通领取人在领取前仅看必要摘要、敏感联系方式默认隐藏的规则尚未完整进入当前 PDM-17；
- 仓库未发现已正式冻结的“后台指定分配为主、主动领取弱化”覆盖性裁决，因此该运营模式仍作为 Batch 4 新产品选择提交，不从聊天记忆静默覆盖；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户裁决 PDM-17 Batch 4。

## 2026-10-06｜PDM-17 Batch 2 用户批准并执行

- 用户对 `P17-B2-01～P17-B2-04` 明确“全部同意”，随后以“真执行”明确授权执行；
- `P17-B2-01～P17-B2-04 = PASS / USER_APPROVED / APPLIED`；
- 已明确禁止恢复：Customer Merge×公海迁移、职位名称自动等于全部公海治理权、System Admin 作为公海业务执行者/兜底 owner、分享/转介绍绕过公海治理恢复历史 owner；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- 主动领取、后台指定分配、待公海人工处理、领取限制、Collaboration 等当前合法能力未被误废弃；
- Batch 3 新增/变更扫描已完成：6 条 incoming handoff 中的 later additions 均已在 Batch 1 对应规则中吸收，未发现新的独立 Atom；
- Batch 3 = `NO_NEW_ATOMS / PENDING_USER_REVIEW`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 3“无新增项”结论。

## 2026-10-06｜PDM-17 Batch 1 用户批准并执行

- 用户先明确更正为“全部同意”，随后明确“确认执行”；
- `P17-A01～P17-A15 = PASS / USER_APPROVED / APPLIED`；
- 已冻结：唯一 owner 与公海状态边界、禁止自动抢入公海、合法进入公海触发、待公海人工三向处理、未完成责任/保护 Guard、公海 scope、原子领取与并发、接客开关与主动领取分离、领取数量/频率限制、主动服务触发 owner 分配、后台指定分配、再次释放 Guard、历史保留、Collaboration 非 owner / 非万能授权、Collaboration 建立/scope/结束/历史；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，不得提前关闭；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 2 候选：`P17-B2-01～P17-B2-04`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-17 Batch 2。

## 2026-10-06｜PDM-17 Startup Gate 通过并进入 Batch 1 审查

- 用户已确认并授权执行 P17-R00：PDM-17 是公海治理与 Collaboration（协作关系）业务 Authority；
- PDM-17 负责：待公海处理、人工判断、进入/退出公海、领取、指定分配、主动人工服务触发的 owner 分配、再次释放，以及 Collaboration 建立/范围/结束；
- PDM-17 不重建 Customer / CRM / Demand / Priority / Consultation / Recommendation / Lock / Transaction 第二套状态机；
- Startup Gate = `PASS`；
- target=PDM-17 的 6 条 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P02-P17-001 / HO-P03-P17-001 / HO-P11-P17-001 / HO-P13-P17-001 / HO-P15-P17-001 / HO-P16-P17-001；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- Current Authority Refresh 已覆盖 9/19 R6/R10/R12、001～078 M02/M17、Current E08/E08-01/P06-03/04/05，以及 PDM-02/03/11/13/15/16 Final；
- Startup Scan 已登记：待公海三选一、领取数量/频率、并发领取、无待确认领取、主动人工服务自动分配退出公海、首次跟进提醒、Collaboration 两级 scope 等历史细节在 Current carrier 中存在不同程度缺口；当前只进入规则审查，不修改 IA / Low-Fi / Engineering；
- 工作版：`07_重建工作区/PDM-17_公海待公海领取指定分配与协作_规则原子重建_工作版.md`；
- Batch 1 候选：`P17-A01～P17-A15`，状态 `PENDING_USER_REVIEW`；
- 当前唯一下一步：用户审查 PDM-17 Batch 1。

## 2026-10-06｜PDM-16 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并确认执行；
- 正式 Authority：`07_重建工作区/PDM-16_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-16_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-16 = COMPLETE / INTEGRITY_PASS`；
- 36 个正式规则 / 用户裁决单元全部进入 Final；
- 6 / 6 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 02 / 03 / 11 / 12 / 15 Final 已反向回写；
- 5 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-17 Startup Gate。

## 2026-10-06｜PDM-16 Final 前完整性复核 R2

- P16-LIA-01～P16-LIA-03 已 USER_APPROVED / APPLIED；
- R2 报告：`07_重建工作区/PDM-16_Final前完整性复核_R2_2026-10-06.md`；
- Source→Atom = PASS；
- Atom→Source = PASS；
- Semantic Completeness = PASS；
- Missing Rule = 0；
- Semantic Detail Gap = 0；
- completed-PDM conflict = 0；
- incoming handoff gap = 0；
- outgoing handoff gap = 0；
- local product choice unresolved = 0；
- `PDM16_FINAL_CANDIDATE_READY = YES`；
- Final Overview：`07_重建工作区/PDM-16_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终审查 Final Overview。

## 2026-10-06｜PDM-16 Final 前完整性复核 R1

- 报告：`07_重建工作区/PDM-16_Final前完整性复核_R1_2026-10-06.md`；
- 结论：`REPAIR_REQUIRED`；
- `MISSING_RULE_UNRESOLVED = 1`：Customer Address 搜索 / 卡片投影；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 1`：CRM Stage / important Tag / 服务称呼 mutation audit；
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 1 group`：待登记 PDM-17 / 21 / 22 / 23 / 25；
- 修复候选：`P16-LIA-01～P16-LIA-03`；
- `PDM16_FINAL_CANDIDATE_READY = NO`；
- 当前唯一下一步：用户审查修复候选。

## 2026-10-06｜PDM-16 Batch 4 用户裁决并执行

- 用户选择并确认执行：`1A、2A、3A、4A、5A`；
- `P16-B4-01～P16-B4-05 = PASS / USER_APPROVED / APPLIED`；
- CRM Stage = 公司级受控可配置字典；
- Consultation / Demand / Lock / Transaction 等具体业务事件默认不自动改 CRM Stage；
- Customer Tags = 公司级受控 Tag 字典 + Customer 多选；
- V1 不建设通用 Customer Opportunity 规则引擎；
- Source Radar“不适合”抑制当前有效 Demand×Vehicle 匹配事实，底层匹配输入实质变化后允许重新出现；
- Batch 4 Cross-PDM Conflict Review = PASS；
- `PDM16_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- 当前唯一下一步：Final 前完整性复核。

## 2026-10-06｜PDM-16 Batch 3 Completeness Repair 已执行

- 用户对 `P16-B3-R01～P16-B3-R02` 明确“全部同意确认执行”；
- Repair = `PASS / USER_APPROVED / APPLIED`；
- `BATCH_3_COMPLETENESS_GAP = 0`；
- CRM 未完成待办/回访/未来跟进责任交接已恢复；
- “暂不联系/暂无意向”与 owner / 公海 / 具体业务状态严格分离；
- Batch 4 重建后形成 5 个真实产品选择：CRM Stage 字典治理、Stage 自动改写、Customer Tags 模型、Opportunity 规则来源、Radar 不适合抑制范围；
- 建议：`1A、2A、3A、4A、5A`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

## 2026-10-06｜PDM-16 Batch 3 用户批准并执行

- 用户对 `P16-B3-01～P16-B3-06` 全部同意并确认执行；
- Batch 3 = `PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation = `PASS`；
- `CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3 = 0`；
- 已补齐 CRM Follow-up mutation、员工内部称呼历史、CRM 列表真实搜索/筛选、Customer Detail 六区块、Opportunity 最小聚合事实、Source Radar 事件与人工处理闭环；
- 完整性回查另发现 2 条明确历史规则尚未完整承接：CRM 待办/回访提醒/未来跟进责任交接；“暂不联系/暂无意向”只属于 CRM 判断且不自动进公海；
- 已形成修复候选 `P16-B3-R01～P16-B3-R02`；
- Batch 4 暂不开始；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

## 2026-10-06｜PDM-16 Batch 2 用户批准并执行

- 用户对 `P16-B2-01～P16-B2-07` 明确“全部同意确认执行”；
- Batch 2 = `PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS`；
- `FALSE_DEPRECATION_COUNT = 0`；
- 已明确废弃：Customer Merge、CRM 直接锁车旧入口、7d/40/3d Opportunity 旧阈值、大字段 CRM、历史服务永久访问、P06-07 假 CRUD/config、Opportunity 独立工单/强待办/SLA；
- 已确认没有误废弃当前合法的 Opportunity、CRM Stage、Tags、Follow-up、Shared Profile、CRM 业务概览、Source Radar 等能力；
- Batch 3 候选：`P16-B3-01～P16-B3-06`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 3。

## 2026-10-06｜PDM-16 Batch 1 用户批准并执行

- 用户对 `P16-A01～P16-A12` 明确“全部同意”，随后“确认执行”；
- Batch 1 = `PASS / USER_APPROVED / APPLIED`；
- 已冻结：CRM Stage 与具体业务状态分离、Stage mutation 权限、Follow-up append-only、统一 CRM Follow-up 关联、Personal Note/Shared Profile/内部称呼分层、Tags/历史不随 owner 清空、CRM 只聚合真实业务事实、历史服务不产生永久访问权、最近行为只做聚合兴趣、Customer Opportunity 非独立工单、Source Radar 只消费 PDM-12、Opportunity/Radar/强待办三类语义分离；
- Batch 1 未误纳 Customer Merge、CRM 直接锁车旧入口、旧机会阈值、大字段 CRM 画像等 superseded 内容；
- Batch 2 候选：`P16-B2-01～P16-B2-07`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 2。

## 2026-10-06｜PDM-16 Startup Gate 通过并进入 Batch 1 审查

- 用户已确认 P16-R00：CRM = 客户经营资料与统一跟进层，不重建 Customer / Demand / Consultation / Recommendation / Lock / Transaction 状态机；
- Startup Gate = `PASS`；
- target=PDM-16 的 6 条 incoming handoff 已全部 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- 工作版：`07_重建工作区/PDM-16_CRM客户画像阶段跟进标签机会与SourceRadar_规则原子重建_工作版.md`；
- Startup Scan 已登记：Customer Merge stale carrier、CRM 直接锁车旧入口、旧机会阈值、大字段 CRM、永久访问误义、E03-03 跟进提交链缺失、P06-07 假 CRUD/config 风险、Opportunity/Radar/强待办 carrier 缺口；
- Batch 1 候选：`P16-A01～P16-A12`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 1。

## 2026-10-06｜PDM-15 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并确认执行；
- Final Approval Trace：`07_重建工作区/PDM-15_最终完整规则总览_待用户批准.md`；
- 正式 Authority：`07_重建工作区/PDM-15_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-15_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-15 = COMPLETE / INTEGRITY_PASS`；
- 31 个正式规则 / 用户裁决单元全部进入 Final；
- 5 / 5 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 02 / 03 / 07 / 14 Final 已反向回写；
- 8 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-16 Startup Gate。

## 2026-10-06｜PDM-15 Final 前完整性复核 R3

- P15-LIA-06 已 USER_APPROVED / APPLIED；
- R3：`PASS / FINAL_CANDIDATE_READY`；
- Source→Atom = PASS；
- Atom→Source = PASS；
- Semantic Completeness = PASS；
- Missing Rule = 0；
- Semantic Detail Gap = 0；
- Completed-PDM Conflict = 0；
- Incoming/Outgoing Handoff Gap = 0；
- Final Overview 候选：`07_重建工作区/PDM-15_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终审查 Final Domain Overview。

## 2026-10-06｜PDM-15 Final 前完整性复核 R2

- P15-LIA-01～P15-LIA-05 已 USER_APPROVED / APPLIED；
- PDM-15 outgoing handoff 共 8 条，已完整登记并保持 HANDOFF_OPEN；
- R2 报告：`07_重建工作区/PDM-15_Final前完整性复核_R2_2026-10-06.md`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 1`；
- 唯一剩余修复候选：`P15-LIA-06` Consultation mutation actor/authority 精确矩阵；
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`；
- `HANDOFF_GAP_UNRESOLVED = 0`；
- `PDM15_FINAL_CANDIDATE_READY = NO`；
- 当前唯一下一步：用户审查 P15-LIA-06。

## 2026-10-06｜PDM-15 Final 前完整性复核 R1

- 报告：`07_重建工作区/PDM-15_Final前完整性复核_R1_2026-10-06.md`；
- 结论：`REPAIR_REQUIRED`；
- Source→Atom：发现 4 个未完整承接业务语义；
- Atom→Source：PASS；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- outgoing handoff gap = 1 group；
- 修复候选：`P15-LIA-01～P15-LIA-05`；
- `PDM15_FINAL_CANDIDATE_READY = NO`；
- 当前唯一下一步：用户审查 Final 前修复候选。

## 2026-10-06｜PDM-15 Batch 4 用户裁决并执行

- 用户选择并确认执行：`1A、2A、3A、4A、5A、6A、7A`；
- `P15-B4-01～P15-B4-07 = PASS / USER_APPROVED / APPLIED`；
- Consultation 保持四主状态，`CANCELLED` 不作为第五主状态；
- 首次响应仅由真实人工服务动作完成，转派不完成/不重置 SLA；
- SLA 初始默认 15 分钟，可配置，创建时固化 deadline；
- 初始负责人按当前合法责任关系 → Demand responsible → Customer owner → 合格接客池；无人可承接时不得创建 responsible=null，也不得 System Admin 兜底；
- Customer 停用采用独立 `customer_disabled_hold`，暂停常规推进与未完成 SLA，恢复账号不自动恢复 Consultation；
- Transaction 不自动结束 Consultation；
- 工作台 SLA 优先级移交 PDM-21；
- `PDM15_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- 当前唯一下一步：Final 前完整性复核。

## 2026-10-06｜PDM-15 Batch 3 用户批准、执行与冲突隔离 PASS

- 用户对 `P15-B3-01～P15-B3-04` 明确“全部同意确认执行”；
- Batch 3 = `PASS / USER_APPROVED / APPLIED`；
- Batch 3 Conflict Isolation = `PASS`，`CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3=0`；
- 已确认：Customer 可撤回 open Consultation；员工可记录真实跟进；员工结束语义区分解决/无效/正常关闭；Consultation 创建时消费有效 SLA 配置并固化本次 deadline；
- 未提前裁决：`CANCELLED` 第五主状态、首次真实人工响应完成条件、默认 15 分钟、负责人优先级、Customer 停用运行态、Transaction 负向边界；
- 形成 Batch 4 候选 `P15-B4-01～P15-B4-07`，建议 `1A、2A、3A、4A、5A、6A、7A`；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 4。

## 2026-10-06｜PDM-15 Batch 2 用户批准、执行与反向冲突扫描 PASS

- 用户对 `P15-B2-01～P15-B2-05` 全部同意并启动执行；
- Batch 2 = `PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS`，`FALSE_DEPRECATION_COUNT=0`；
- 明确废弃/不得恢复：旧“我要这辆车”统一意向、timeout 第五主状态/自动关闭、Customer Merge/Consultation 迁移、assignee 与 Customer owner 合一、Recommendation 驱动 Consultation 生命周期；
- 明确保留：客户撤回/正常关闭动作、SLA 与 timeout 提醒、正式 Consultation 转派、状态驱动 CTA、真实 Recommendation source relation、独立 Customer owner；
- 历史 Phase1.5 曾存在 Customer Merge Flow，但当前 Authority 已被 PDM-01 Final“V1 完全取消 Customer Merge”覆盖；
- Batch 3 候选：`P15-B3-01～P15-B3-04`；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P15-B3-01～P15-B3-04。

## 2026-10-06｜PDM-15 Batch 1 用户批准并执行

- 用户对 `P15-A01～P15-A08` 明确“全部同意”，随后明确“确定执行”；
- Batch 1 = `PASS / USER_APPROVED / APPLIED`；
- 已冻结：显式咨询建单、初始来源不可改写、同 customer+vehicle+listing_cycle 未终结幂等、Vehicle lifecycle 分层、Consultation assignee 与 Customer owner 分离、Recommendation 双向独立、档案不完整不阻断、4S Member 不进入名邦 Consultation 处理链；
- 状态机 `CANCELLED` 冲突、SLA 首次真实人工动作、负责人优先级、Customer 停用运行态等未被 Batch 1 偷渡裁决；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Batch 2 候选：`P15-B2-01～P15-B2-05`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P15-B2-01～P15-B2-05。

## 2026-10-06｜PDM-15 Startup Gate 通过并进入 Batch 1

- 用户已确认 PDM-15 核心定位：Consultation = 客户正式咨询工单，承接“明确咨询 → 合法负责人 → 真人跟进 → 合法结束”；
- Consultation 与 Customer owner / Recommendation / Lock / Transaction 分离，只保存必要真实关联，不自动互相改写主状态；
- Startup Gate = `PASS`；completed-PDM hard conflict = 0；incoming handoff gap = 0；
- target=PDM-15 的 5 条 incoming handoff 全部由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- 工作版已建立：`07_重建工作区/PDM-15_Consultation咨询生命周期来源负责人转派与SLA_规则原子重建_工作版.md`；
- 已登记 Current carrier 冲突：CANCELLED 主状态歧义、SLA 首次真实人工动作语义缺失、Consultation assignee 与 Customer owner 术语污染、Customer 停用运行态、Transaction 负向边界、工作台 SLA 优先级边界、负责人优先级/无合法负责人兜底；
- Batch 1 候选：`P15-A01～P15-A08`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P15-A01～P15-A08。

## 2026-10-06｜PDM-14 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并明确“确定执行”；
- Final Approval Trace：`07_重建工作区/PDM-14_最终完整规则总览_待用户批准.md`；
- 正式 Authority：`07_重建工作区/PDM-14_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-14_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-14 = COMPLETE / INTEGRITY_PASS`；
- 52 个正式规则 / 裁决单元全部进入 Final；
- 8 / 8 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 03 / 04 / 07 / 10 / 11 / 12 / 13 Final 已反向回写；
- outgoing `HO-P14-P15/P18/P19/P20/P21/P23/P25` 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-15 Startup Gate。

## 2026-10-06｜PDM-14 Final 前完整性复核 R2 通过

- 报告：`07_重建工作区/PDM-14_Final前完整性复核_R2_2026-10-06.md`；
- `SOURCE_TO_ATOM = PASS`；
- `ATOM_TO_SOURCE = PASS`；
- `SEMANTIC_COMPLETENESS = PASS`；
- `COMPLETED_PDM_INVARIANT = PASS`；
- `INCOMING_HANDOFF_SEMANTIC_COVERAGE = PASS`；
- `OUTGOING_HANDOFF_INTEGRITY = PASS`；
- `NEGATIVE_CLAIMS_VERIFIED = PASS`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `CROSS_PDM_CONFLICT = 0`；
- `HANDOFF_GAP_UNRESOLVED = 0`；
- `PDM14_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `PDM14_LOCAL_DEFERRED_UNRESOLVED = 0`；
- `PDM14_FINAL_CANDIDATE_READY = YES`；
- 当前唯一下一步：生成 PDM-14 Final Domain Overview 候选。

## 2026-10-06｜PDM-14 Final 前完整性修复 LIA-01～10 已执行

- `P14-LIA-01～P14-LIA-10 = USER_APPROVED / APPLIED`；
- 三类车源均可被正式 Recommendation；4S member hard DENY 与 4S Vehicle 可推荐明确分层；批发免费查价权仅适用于批发查价机制；
- Recommendation create/end/void 补齐 current responsibility + permission/capability + data scope + object state 提交重验；4S hard DENY，System Admin 不因身份自动执行业务；
- 批量推荐 UI 可批量，但底层逐 Vehicle 独立 Recommendation；
- Recommendation 不改变 Customer owner / Demand responsible；
- 普通 share link 无固定 N 天 TTL，可继续转发但不传播 Recommendation/price-right/visibility/Internal Mode；
- 批发车 Recommendation 创建时若仅“价格咨询”，同 cycle 后续出现数字价仍沿用免费权，不扣 daily quota；
- Recommendation/visibility 仅授 Customer Safe Projection，不扩大内部敏感字段；
- JYT/上游同步不得直接覆盖 Recommendation/visibility 等名邦 Business Data；
- Consultation 不反向创建 Recommendation、不授免费 price-right、不授 hidden visibility；
- outgoing handoff 已扩展到 PDM-15 / 18 / 19 / 20 / 21 / 23 / 25；
- 8 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- 当前唯一下一步：Final 前完整性复核 R2。

## 2026-10-06｜PDM-14 Batch 4 用户裁决并执行

- 用户选择：`1A、2B、3A、4A、5A、6A、7A、8A`；
- `P14-B4-01～P14-B4-08 = PASS / USER_APPROVED / APPLIED`；
- `PDM14_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Recommendation end/void 改为按当前合法业务责任 + permission/data scope/object state 判断，不给历史 recommender 或经理/店长永久/天然操作权；
- Customer 失去 find-car entitlement 后不删除已有 Recommendation，但暂停 Recommendation-only 客户侧能力；恢复权益时仅恢复当时仍合法 active 对象；
- active Recommendation 在同 cycle 内持续作为 visible→hidden 后的 customer-specific visibility 授权来源；
- 普通分享链接只提供导航，每次打开按当前 Vehicle/listing_cycle/Customer/Priority/独立业务 Authority 实时重算；新 cycle 不继承旧周期权益；
- Recommendation 历史 price snapshot 与当前价格严格分层；旧 cycle Recommendation 不授权新 cycle 当前价格；
- 合法 source_type 修改 / 一键转名邦不重建、迁移或清空 Recommendation；
- active Lock / in-progress Transaction 占用本身不自动禁止 Recommendation，但 Recommendation 不产生锁车优先权、不绕过占用；
- Recommendation 与 Consultation 不相互反写；新增 `HO-P14-P15-001 = HANDOFF_OPEN`，由 PDM-15 承接 Consultation 完整生命周期；
- 8 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- 当前唯一下一步：PDM-14 Final 前完整性复核。

## 2026-10-06｜PDM-14 Batch 3 用户批准并执行

- `P14-B3-01～P14-B3-05 = PASS / USER_APPROVED`；
- Batch 3 Conflict Isolation：`PASS / CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3=0`；
- 分享直达与普通进入统一使用同一套车辆详情业务页；SHARE_DIRECT 只增加必要轻量入口，不能复制第二套详情业务逻辑或绕过当前 visibility；
- 旧“我要这辆车”语义正式拆分：沟通车辆统一走 Consultation/“咨询”，锁车走独立 LockRequest/Lock 链；Recommendation 不由该按钮自动产生；
- “我的推荐”明确区分当前与历史；历史长期保留，但历史存在不等于当前仍有详情 visibility 或当前价格权，进入时重新读取当前事实；
- PDM-07 incoming handoff 正式承接：档案/报告不完整本身不得阻止 Recommendation；Recommendation/visibility grant 也不自动授客户查看 VIN、敏感原件或仅内部档案；
- PDM-13 incoming handoff 进一步冻结：Priority 可保存 recommendation_id 仅作关联追溯；Priority 与 Recommendation 生命周期仍完全独立；
- LockRequest 的 6h/审批/Waitlist 等完整生命周期未被抢入 PDM-14，继续归 PDM-18；
- 分享模板、分享图、营销文案等页面细节未因 Batch 3 被误冻结为 PDM-14 核心生命周期规则；
- 8 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- 当前唯一下一步：PDM-14 Batch 4 冲突 / 遗漏 / 缺口 / 新产品选择候选重建。

## 2026-10-05｜PDM-14 Batch 2 用户批准并执行

- `P14-B2-01～P14-B2-11 = PASS / USER_APPROVED`；
- Batch 2 Reverse Conflict Scan：`PASS / FALSE_DEPRECATION_COUNT=0`；
- 独立 Recommendation qualification、P06-06、RECOMMENDATION_QUALIFIED/NOT_QUALIFIED 与仅服务旧开关的独立管理能力正式废弃；
- 经理/店长/协作身份本身不产生 Recommendation 创建权；旧“只有 Customer current owner 才能推荐”的绝对规则被 owner/handover/Demand responsibility 当前合法业务负责关系替代；
- Priority responsible 不得成为新的 Recommendation 授权来源；
- 旧“客户转发永远 SOURCE_ONLY”被 PDM-03 当前分享归属 Authority 替代，但 SOURCE_ONLY 状态本身继续保留；
- REC 专属 URL / Recommendation-specific link / 第二套推荐分享链路明确 DO_NOT_RESTORE；
- “所有 Vehicle 必须 Recommendation 后才可见”正式废弃；hidden Customer 详情权必须由正式 Recommendation + visibility grant 建立，Demand/Priority 本身不授客户详情权；
- 其他 Customer active Priority 期间不得删除/结束既有 Recommendation，只做 suppression，ended 后按当前事实 restore；
- Customer Merge 与 Recommendation/price-right/Consultation 等权益迁移继续按 PDM-01 Final 全面禁止；P06-01/P06-M01 Merge carrier 登记 stale；
- Recommendation 创建后的系统自动微信发送/发送成功失败状态机不得恢复；
- 新增 stale carrier：old owner-only 阻断合法 Demand responsible、customer re-share always SOURCE_ONLY、REC 专属链路、HIDDEN_CONTROLLED Demand/Priority 直授客户详情、P06-01/P06-M01 Merge；
- 8 条 incoming handoff 继续保持 `HANDOFF_ACCEPTED`，未提前关闭；
- 当前唯一下一步：PDM-14 Batch 3 明确知情修改 / 显式新增候选重建。

## 2026-10-05｜PDM-14 Start Gate、Batch 1 与四项用户裁决已执行

- PDM-14 工作版已建立：`07_重建工作区/PDM-14_Recommendation分享单车授权与可见性_规则原子重建_工作版.md`；
- Start Gate：`PASS`；
- target=PDM-14 的 8 条 incoming handoff：全部由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`，Final / Integrity closeout 前不得关闭；
- Batch 1：`P14-A01～P14-A14 = PASS / USER_APPROVED`；
- Recommendation 与 Matching / Priority / 普通分享 / visibility grant 分离；同 customer+vehicle+listing_cycle active 幂等；无固定 N 天 TTL；核心历史事实不可普通改写；同周期结束后可重建、新周期不继承；
- 普通分享不授 Recommendation / price / visibility；分享接收人按自身 Customer 权益判断，owner 归属服从 PDM-03 当前 Authority；
- hidden 可售 Vehicle 可通过正式 Recommendation 建 Customer 单车 visibility grant，Priority 本身不授客户详情权；
- Recommendation 免费查价权继承 PDM-10 当前 cycle Authority；Recommendation price snapshot 为不可变历史；
- source_demand_id 为 0/1 真实来源，“我的推荐”只承载正式 Recommendation；
- `P14-R01`：Priority qualification 属于 Customer，不属于 Employee；Priority 不改变既有 owner / 合法业务责任关系，也不额外创造 Recommendation 权限；
- `P14-R02`：取消独立 Recommendation qualification；正式找车 / Recommendation 资格统一读取 Customer Level `find-car entitlement`；Priority qualification 继续独立，只负责 Priority；
- `P14-R03`：Customer disable 只暂停 Recommendation 客户侧能力并禁止新建，不删除/结束历史；restore 只重新开放恢复时仍合法有效的对象，不复活 ended/void/周期失效 Recommendation；
- `P14-R04`：其他 Customer active Priority 期间，既有 Recommendation/visibility 历史不删除，只临时 suppression 客户访问；Priority ended 后按当前 Recommendation/listing_cycle/Vehicle/Customer/Priority/Lock/Transaction 事实决定 restore；
- 旧 `P06-06 / RECOMMENDATION_QUALIFIED / NOT_QUALIFIED` 等独立推荐资格 carrier 已登记为 `CARRIER_DEFERRED`，不得施工；
- 对 PDM-01～PDM-13 Final 复核：上述新口径无 completed-PDM 冲突；冲突集中在旧 R7 / Current IA / Low-Fi carrier；
- 当前下一步：PDM-14 Batch 2 明确废弃 / 替代 / DO_NOT_RESTORE 候选审查。

## 2026-10-05｜PDM-13 Final 正式发布与完整性收口

- 用户对 PDM-13 Final Domain Overview 明确“全部同意”，随后明确“确认执行”；
- 正式 Authority：`07_重建工作区/PDM-13_最终完整规则.md`；
- 用户最终批准留痕：`07_重建工作区/PDM-13_最终完整规则总览_待用户批准.md`；
- Final 前当前有效 Gate：`07_重建工作区/PDM-13_Final前完整性复核_R2_2026-10-05.md`；
- Final Integrity：`07_重建工作区/PDM-13_最终完整性复核_2026-10-05.md`；
- 38 条正式规则 / 修复 Atom 全部进入 Final；
- 5 条 incoming handoff：HO-P03-P13-001 / HO-P04-P13-001 / HO-P07-P13-001 / HO-P11-P13-001 / HO-P12-P13-001 = `HANDOFF_CLOSED`；
- PDM-03 / 04 / 07 / 11 / 12 Final 同次完成 source backwrite；
- PDM-13 outgoing 8 条 handoff 继续 `HANDOFF_OPEN`；
- `SOURCE_TO_FINAL / FINAL_TO_SOURCE / SEMANTIC_COMPLETENESS / COMPLETED_PDM_INVARIANT / CROSS_PDM_INTEGRITY / HANDOFF_INTEGRITY / NEGATIVE_CLAIMS = PASS`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `CROSS_PDM_CONFLICT = 0`；
- `HANDOFF_GAP_UNRESOLVED = 0`；
- PDM-13 = `COMPLETE / INTEGRITY_PASS`；
- 下一域允许进入 PDM-14。

## 2026-10-05｜PDM-13 修正 Final Overview 候选已生成

- 候选文件：`07_重建工作区/PDM-13_最终完整规则总览_待用户批准.md`；
- 状态：`FINAL_CANDIDATE / WAITING_USER_FINAL_APPROVAL`；
- 当前正式规则 / 修复 Atom = 38；
- 已纳入 LIA-07：Match tier downgrade 立即重评；
- 已纳入 LIA-08：TTL 是最长保护上限、销售可 TTL 前 release / 不推荐此车、Recommendation/Priority 两对象独立、Lock/Transaction 不反向撤销；
- R2 完整性报告 = `07_重建工作区/PDM-13_Final前完整性复核_R2_2026-10-05.md`；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- PDM-13 Final 仍未发布；
- 当前唯一下一步：等待用户最终批准该总览。

## 2026-10-05｜PDM-13 Final Overview 复查补漏与 R2 PASS

- Final Overview 复查发现 `P13-LIA-07～P13-LIA-08`；
- LIA-07：active Priority 的 current Match Result 若由 high/acceptable 降为 confirmation_needed/no_match，必须立即重评；有同 Customer 其他合法 Demand 则切 trigger_demand_id 且 expires_at 不变，无则 ended 并重新仲裁；
- LIA-08：TTL 是最长自动保护上限，不要求等满；合法 responsible employee 可在 TTL 前主动“释放 Priority / 不推荐此车”，释放后立即重新仲裁；
- 尚未 Recommendation 时，Priority release 不得叫“取消推荐”；
- 已有 Recommendation 时，Recommendation end 与 Priority release 可在体验层组合，但底层必须分别执行、校验、审计；
- Recommendation cancellation alone 不结束 Priority，也不单独触发 same-cycle suppression；
- Priority release / expiry alone 不结束仍合法 Recommendation；
- Recommendation cancel / Priority release / expiry 不得反向撤销已合法成立 Lock / Transaction；
- 正式 Recommendation 成立后 Priority 可保存 recommendation_id 作为关联追溯，但生命周期仍分离；
- B4-04/B4-08 旧“Recommendation cancellation 自动等于 Priority ended / same-cycle suppression”口径已被 LIA-08 用户修正版 supersede；
- R1 报告继续保留历史；当前有效 Final 前 Gate 报告为 `07_重建工作区/PDM-13_Final前完整性复核_R2_2026-10-05.md`；
- R2：Source→Atom / Atom→Source / Semantic Completeness / Completed-PDM Invariant / Cross-PDM Handoff / Negative Claims = PASS；
- 正式规则/修复 Atom 总数由 36 增至 38；
- incoming handoff 5 / 5 继续 `HANDOFF_ACCEPTED`；
- 当前唯一下一步：重新生成修正后的 PDM-13 Final Domain Overview 候选并提交用户最终批准。

## 2026-10-05｜PDM-13 Final 前修复与二次完整性复核 PASS

- 第一轮 Final 前审计发现 `P13-LIA-01～P13-LIA-06`，用户全部同意并明确“确认执行”；
- 已补齐：单 Customer Priority 资格开关生命周期、单 Customer 多 Vehicle active Priority 无上限、event-driven 重评、普通入口/公共统计排他、Priority 与价格/查价权隔离、PDM-20/21/22 future handoff；
- 新增 `HO-P13-P20-001 / HO-P13-P21-001 / HO-P13-P22-001 = HANDOFF_OPEN`；
- PDM-13 outgoing future handoff 当前共 8 条：PDM-14 / 17 / 18 / 19 / 20 / 21 / 22 / 25；
- 二次复核：Source→Atom / Atom→Source / Semantic Completeness / Completed-PDM Invariant / Cross-PDM Handoff / Negative Claims 全部 PASS；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `CROSS_PDM_CONFLICT = 0`；
- `HANDOFF_GAP_UNRESOLVED = 0`；
- `PDM13_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `PDM13_LOCAL_DEFERRED_UNRESOLVED = 0`；
- 报告：`07_重建工作区/PDM-13_Final前完整性复核_2026-10-05.md`；
- 5 条 incoming handoff 继续保持 `HANDOFF_ACCEPTED`，未提前关闭；
- 当前唯一下一步：生成 PDM-13 Final Domain Overview 候选并提交用户最终批准。

## 2026-10-05｜PDM-13 Batch 4 用户批准并执行

- 用户最终裁决：B4-01 按用户修正版；B4-02=2A、B4-03=3A、B4-04=4A、B4-05=5A、B4-06=6A、B4-07=7A、B4-08=8A；
- Priority 资格固定为后台针对单个 Customer 的独立开关，不由 Customer Level 自动产生；Customer Level 继续只决定正式 find-car entitlement；
- 所有合法正式 Demand 共用 PDM-12 一套 Matching；hidden 但真实可售 Vehicle 仍可内部 Matching；
- active Priority 是 Matching 后的限时排他保护：其他普通客户/无关员工不能通过普通后续链路获得该车；Priority Customer 本人也不会因 Priority 自动获得详情权；
- trigger Demand 当前合法负责人先处理并决定 Recommendation；Recommendation/visibility grant 合法成立后客户才可见；
- 不建设独立全局 priority.view / priority.manage / priority.override；Priority 查看/处理跟随业务责任、合法管理范围及 PDM-02 通用权限模型；
- 多 Priority Customer 仲裁：high > acceptable → Demand.created_at 更早 → demand_id 更小；
- 默认 TTL=24h/86400s，后台全局可配，创建时冻结，不人工续期；Recommendation、重算、trigger Demand 切换、责任交接均不重置；
- same listing_cycle 对客户放弃/员工释放/Recommendation 取消/TTL expired 做自动再获得抑制；新真实事实或新 listing_cycle 可重新参加仲裁；
- trigger Demand 失效时优先切同 Customer 其他合法 Demand，原 expires_at 不变；无可切换 Demand 则 ended；
- active Lock 不阻断 Matching 但阻止新 Priority；正式 Lock / in-progress Transaction 可结束 active Priority；释放/取消后不恢复旧 Priority，重新按当前事实仲裁；
- Priority current responsible 跟随 trigger Demand responsible；Handover Batch 中 TTL 自然运行，不暂停、不延长、不重置；无合法负责人不得新建 Priority；
- Priority 资格本身不是公海保护，active Priority 才是；ended 后重读其他保护事实；
- ended 必须保留真实 reason，并在 Vehicle 合法重新开放后读取所有 Customer 当前合法 Match Result 再决定新 Priority 或普通业务流；
- 新增 PDM-13→PDM-14/17/18/19/25 future handoff，均登记 HANDOFF_OPEN；
- PDM-13 incoming 5 条 handoff 继续 HANDOFF_ACCEPTED，待 Final / Integrity closeout；
- stale carrier 新增：历史独立 priority.view 全局穿透查看方向已 superseded；
- 当前唯一下一步：PDM-13 Final 前完整性复核。

## 2026-10-05｜PDM-13 Batch 3 用户批准并执行

- `P13-B3-01～P13-B3-06 = PASS / USER_APPROVED`；
- Batch 3 冲突隔离 = PASS；
- Priority 员工侧查看/处理统一继承 PDM-02 `identity + permission + data scope + object state`；
- Priority 交接正式进入 Handover Batch，部分失败不整体回滚，历史不改写；
- 若 Priority 仲裁使用 Demand 创建先后，只能读取不可变 `Demand.created_at`，但是否采用该维度仍留 Batch 4；
- Demand/Matching 退出 current valid 后，已有 Priority 必须重新评估，不得继续依赖 stale/invalidated Match Result；
- active Lock 不阻断 PDM-12 Matching，PDM-13 只处理 Lock×Priority 关系；
- Priority 重评只消费 PDM-12 current Match Result / Matching change fact，不复制第二套 Matching Authority；
- 资格来源 / 等级关系 / 精确仲裁 / TTL / 续期 / same-cycle / trigger_demand / active Lock 最终答案 / Transaction / 公海保护 / 无 owner 与 capability 最终边界继续 Batch 4；
- 5 条 incoming handoff 继续保持 `HANDOFF_ACCEPTED`；
- 当前唯一下一步：PDM-13 Batch 4 真实冲突 / 缺口 / 新产品选择候选审查。

## 2026-10-05｜PDM-13 Batch 2 用户批准并执行

- `P13-B2-01～P13-B2-05 = PASS / USER_APPROVED`；
- Batch 2 反向冲突扫描 = PASS；
- 明确禁止恢复：独立“客户专属”体系、人工创建/转让/覆盖/延长 Priority、Priority 作为 Lock 优先权、客户端暴露 Priority 内部术语、Priority 本身直接授予客户详情权；
- Current Navigation `E05-05｜创建 Priority` 正式登记为 stale carrier，不得按人工创建实现；
- Current `E05-05::HIDDEN_CONTROLLED` 中“Priority 直接让客户可见”的旧语义正式标记 superseded；
- 明确没有废弃：Priority qualification / Customer Level 关系 / 精确仲裁 / `Demand.created_at` tie-break / TTL 默认数值 / TTL 配置主体 / 续期 / 完整结束原因 / same-cycle / trigger_demand / active Lock / Transaction / 公海保护 / 重仲裁事件；
- 5 条 incoming handoff 继续保持 `HANDOFF_ACCEPTED`，不得在 Final 前提前关闭；
- 当前唯一下一步：PDM-13 Batch 3 明确新增 / 明确变更候选重建。

## 2026-10-05｜PDM-13 Batch 1 用户批准并执行

- PDM-13 工作版已建立：`07_重建工作区/PDM-13_Priority仲裁TTL与Lock边界_规则原子重建_工作版.md`；
- target=PDM-13 的 5 条 incoming handoff 已全部读取并接收：HO-P03-P13-001 / HO-P04-P13-001 / HO-P07-P13-001 / HO-P11-P13-001 / HO-P12-P13-001 = `HANDOFF_ACCEPTED`；
- Current Authority Refresh / Current Implementation Fact 已完成；
- Batch 1：`P13-A01～P13-A11 = PASS / USER_APPROVED`；
- 已冻结：Priority 不复制 Matching、只消费当前合法 high/acceptable、不得猜测/篡改 provenance、同车唯一 active、同 customer+vehicle+listing_cycle 幂等、TTL 创建时冻结、交接不改历史、Priority 不改 owner、与 Recommendation 分离、不改 Vehicle/listing_cycle、结束只恢复底层应有状态、历史不可抹除；
- 明确未偷渡：Priority 客户资格 / Customer Level 关系 / 精确仲裁顺序 / TTL 默认数值与配置 actor / 续期 / 完整结束原因 / active Lock / Transaction / 客户详情 visibility / 公海保护等继续后续批次；
- stale carrier 已登记：Navigation 残留“创建 Priority”；E05-05 HIDDEN_CONTROLLED 残留“Priority 本身给客户详情权”的旧口径；
- 当前唯一下一步：PDM-13 Batch 2 明确废弃 / 替代 / DO_NOT_RESTORE 候选重建，形成候选后停下用户审查。

## 2026-10-05｜PDM-12 Final 用户最终批准并正式发布

- Final Domain Overview：用户最终全部同意；
- 此前确认执行的执行授权继续有效，已正式发布；
- 正式 Authority：`07_重建工作区/PDM-12_最终完整规则.md`；
- 用户批准留痕：`07_重建工作区/PDM-12_最终完整规则总览_待用户批准.md`；
- 最终完整性报告：`07_重建工作区/PDM-12_最终完整性复核_2026-10-05.md`；
- 44 个正式 Atom 全部进入 Final；
- Source→Final / Final→Source / Semantic Completeness / Completed-PDM Invariant / Handoff / Negative Claims = PASS；
- HO-P04-P12-001 / HO-P05-P12-001 / HO-P07-P12-001 / HO-P11-P12-001 = HANDOFF_CLOSED；
- PDM-04 / 05 / 07 / 11 Final 已完成 source backwrite；
- PDM-12 outgoing handoff 到 PDM-13 / 14 / 16 / 18 / 20 / 21 / 22 / 25 继续 OPEN；
- PDM-12 = `COMPLETE / INTEGRITY_PASS`；
- 当前进入 PDM-13 启动门禁。

## 2026-10-05｜PDM-12 Final 前完整性修复与二次复核 PASS

- `P12-LIA-01～P12-LIA-06 = USER_APPROVED / APPLIED`；
- LIA-01：客户未填写正式条件 = 不限，不等于 unknown；
- LIA-02：补齐 matching readiness，部分 component 待确认不必停止整个 Demand Matching；
- LIA-03：confirmation_needed 不占车、不排他、不阻断其他 Customer/Demand；
- LIA-04：补齐 Matching 集合进入/退出与 stale result invalidation；
- LIA-05：active Lock 本身不等于不可 Matching；新增 `HO-P12-P18-001`；
- LIA-06：人工确认执行主体继承 PDM-02；精化 PDM-20 车型年款/首次上牌年份与数字价格筛选边界；PDM-21 固定确认事实→重算→再读 tier；
- PDM-12 stale carrier 6 项已登记，只登记不施工；
- Final 前二次复核：Source→Atom / Atom→Source / Semantic Completeness / Completed-PDM Invariant / Cross-PDM Handoff / Negative Claims 全部 PASS；
- 报告：`07_重建工作区/PDM-12_Final前完整性复核_2026-10-05.md`；
- 当前唯一下一步：生成 PDM-12 Final Domain Overview 候选并提交用户最终批准。

## 2026-10-05｜PDM-12 Batch 4 用户批准

- `P12-B4-01～P12-B4-06 = PASS / USER_APPROVED`；
- 用户裁决：`1A / 2A / 3A / 4A / 5A / 6A`；
- 无预算 + 价格咨询：价格维度不限；有预算 + 价格咨询：`confirmation_needed`；
- 里程只把最高可接受里程作为 hard condition，低于表达下限仍可符合；
- 变速箱 / 配置偏好 / 过户次数 / 城市距离 / 排放标准 / 车源类型继续不参与 V1 自动四级 Matching；
- Rule Dictionary 正式规则不普通物理删除，只停用/废弃并保留历史审计；
- partial failure 不整体回滚，成功对象保留新结果，只重试失败集合；失败对象旧 Match Result 不得继续驱动新的 Priority/Recommendation；
- 新增 `matching.rule.manage`：active 名邦 Employee 受独立 permission 控制，4S hard DENY，System Admin 只配置权限、不因身份自动取得写规则能力；
- `PDM12_LOCAL_DEFERRED_UNRESOLVED = 0`；
- outgoing future handoff 已登记到 PDM-13 / 14 / 16 / 20 / 21 / 22 / 25；
- 当前唯一下一步：PDM-12 Final 前完整性复核。

## 2026-10-05｜PDM-12 Batch 3 用户批准

- `P12-B3-01～P12-B3-07 = PASS / USER_APPROVED`；
- find-car entitlement 在正式 Matching / 重算前动态重验，并与 PDM-11 active/paused/readiness 状态机统一；
- P06-10 Rule Dictionary 恢复为真实可维护业务对象，补字段、基础 Action、scope priority、same-level conflict 与无副作用测试解析；
- VR-P-021 / VR-P-022 正式承接：正/反向表达、hard/preferred/tolerance、局部例外、证据优先级、component 局部影响；
- Matching 结果必须可解释；
- 词典变化按受影响范围重解析/重算，禁止无脑全库；
- 新增 `HO-P12-P16-001 = HANDOFF_OPEN`：PDM-12 产生 Matching change fact，PDM-16 Source Radar 消费，不复制第二套 Matching Authority；
- 当前唯一下一步：Batch 4 真实冲突 / 语义缺口 / 新产品选择候选审查。

## 2026-10-05｜PDM-12 Batch 2 用户批准

- `P12-B2-01～P12-B2-10 = PASS / USER_APPROVED`；
- 冻结不得恢复：第二套客户专属/独立匹配、普通关键词搜索替代共享解析、客户原话/AI 猜测直入 Matching、mapping pending 阻断已明确 JYT 车型事实、hidden=offline、猜测车况、恢复整套旧车况字段、closest fallback、Match Result 自动制造下游对象、定时全库扫描作为唯一更新机制；
- Batch 2 反向冲突扫描 = PASS；
- 明确排除：旧字段排除清单、里程特殊规则、P06-10 完整治理、VR-P-021/022、无预算+价格咨询、Priority 完整生命周期均继续后续审查，不属于已废弃；
- 当前唯一下一步：形成 Batch 3 后续明确新增 / 明确变更项候选并停下等待用户审查。

## 2026-10-05｜PDM-12 Batch 1 用户批准

- Current Authority Refresh / Current Implementation Fact 已完成；
- Batch 1：`P12-A01～P12-A15 = PASS / USER_APPROVED`；
- P12-A15 正式冻结：车源主页搜索与正式 Demand Matching 共用同一套确定性解析 / 匹配词典；共享解析层，但搜索不创建 Match Result / Priority / Recommendation / Demand / Lock；
- M03-001～M03-003 Source→Atom 反查完成；
- 首轮发现 `SEARCH_MATCH_SHARED_DICTIONARY` 属于“证据已读但 Atom 未生成”，现已修复；
- 当前 `UNMAPPED_STABLE_BATCH1_RULE = 0`；
- P06-10 Action/scope/test/retry、旧字段排除、里程特殊规则、VR-P-021/022 等均显式保留到后续批次，不视为丢失；
- 当前唯一下一步：形成 Batch 2（废弃 / 禁止恢复项）候选并停下等待用户审查。

## 2026-10-05｜PDM-11 最终批准并进入 PDM-12

- PDM-11 Final 用户批准：PASS；
- 正式 Authority：`07_重建工作区/PDM-11_最终完整规则.md`；
- Final Integrity：`INTEGRITY_PASS`；
- `HO-P01-P11-002 = HANDOFF_CLOSED`；
- PDM-01 source backwrite 已完成；
- PDM-12 工作版已建立；
- PDM-12 incoming：HO-P04-P12-001 / HO-P05-P12-001 / HO-P07-P12-001 / HO-P11-P12-001 均已 ACCEPTED；
- PDM-12 尚未开始 Batch 结论，仅进入证据重建。

## 2026-10-05｜PDM-11 Final 前完整性复核完成

- P11-LIA-01：补齐无 owner / pool-empty Application 创建 Guard，不允许 `responsible=null`；
- P11-LIA-02：pending Application 明确为公海保护事实，并扩展 PDM-17 handoff；
- P11-LIA-03：用户裁决双向结束——客户发起结束请求，员工确认后按真实结果落 `completed / cancelled`；员工也可直接结束；不新增第五主状态；
- P11-LIA-04：补齐不可变 `Demand.created_at`，供 PDM-13 后续仲裁引用；
- P11-LIA-05：客户端等级升级提示必须读取当前真实 entitlement 配置，粉丝/VIP 仅当前配置示例；
- P11-LIA-06：PDM-12/13/14/16/17/20/21/22/25 handoff 已扩展，禁止“交后面做”时再次压缩丢细节；
- P11-LIA-07：补 PDM11-GATE-B1，修 Current stale；
- Customer disable 对 pending Application：保留历史、不自动关闭、停用期间不得激活，恢复后也不自动激活；
- 当前状态：`PREFINAL_INTEGRITY_PASS / FINAL_CANDIDATE_READY`。

## 2026-10-05｜PDM-11 Batch 4 全部确认

- P11-B4-01：所有 Find-car Application 均先 pending；不因已有 entitlement 自动 active；必须由合法员工在处理详情中人工创建 / 激活唯一 Demand；
- P11-B4-02：正式找车资格只来自 Customer Level 配置；普通客户当前无正式找车权益；需要开通时通过等级升级到具备权益的粉丝 / VIP 等等级；不建设单 Customer find-car entitlement override；
- 客户等级调整继承 PDM-02 permission + data scope + object state，不建设固定多级审批；经理 / 店长可按配置拥有，个别销售可明确授权；
- 普通客户可提交找车 Application，但无权益时只保持 pending；客户端必须明确提示升级等级 / 联系顾问；
- 联动回写 PDM-10：daily quota 只限制批发车；LIMITED 列表隐藏精确数字价，详情真实进入时有额度自动解锁，无二次“查看价格”点击；quota 耗尽主字段 `--万`；UNLIMITED 列表/详情直接显示数字价；临时增加当天次数对客户免费；
- PDM-11 已正式登记 PDM-12/13/14/16/17/20/21/22/25 future handoff；
- Batch 4 = `PASS / USER_APPROVED`；
- 当前进入 PDM-11 Final 前完整性复核。

## 2026-10-05｜PDM-11 Batch 3 用户修正并通过

- 用户否决旧“账号停用不自动改变 Demand 状态”的口径；
- 当前 Authority：Customer 停用 → active Demand 自动 paused；历史、条件、推荐/匹配/跟进、负责人/状态历史全部保留；
- 账号恢复后不自动恢复 Demand，需正式 resume；
- PDM-01 Final §11 已完成 source backwrite；
- `HO-P01-P11-001 = HANDOFF_SUPERSEDED`；
- `HO-P01-P11-002 = HANDOFF_ACCEPTED`；
- Batch 3 = `PASS / USER_APPROVED`；
- 当前进入 Batch 4：`P11-B4-01 / P11-B4-02`。
## 2026-10-05｜PDM-11 Batch 2 全部确认

- 用户确认 P11-B2-01～P11-B2-07、P11-B2-09、P11-B2-10 全部同意；
- P11-B2-08 继续采用此前用户主动修正版；
- Batch 2 = `PASS / USER_APPROVED`；
- 当前进入 Batch 3；
- Batch 3 当前正式待审项：`P11-B3-01`。
## 2026-10-05｜PDM-11 P11-B2-08 用户修正

- 原候选“找车权益下降不得自动影响 active Demand”撤回；
- 当前规则：entitlement 下降/取消 → active Demand 自动 paused；
- Demand、条件、历史匹配、Recommendation、CRM 跟进、状态/负责人历史全部保留；
- entitlement 恢复后不自动 active，需客户本人或有权限员工正式恢复；
- Customer 账号停用与 entitlement 下降严格分离；账号停用本身不自动改 Demand 状态；
- P11-B2-08 = `USER_MODIFIED / USER_APPROVED`；
- Batch 2 剩余 9 条继续 `USER_REVIEW_PENDING`。
## 2026-10-05｜PDM-11 Batch 1 全部确认

- 用户明确确认 `P11-A01～P11-A13` 全部同意；
- Batch 1 = `PASS / USER_APPROVED`；
- 未将 Customer 停用后续修改偷渡入 Batch 1，继续保留在 Batch 3；
- 未将 Application 激活时机 / 找车资格来源真实冲突偷渡入 Batch 1，继续保留在 Batch 4；
- 当前进入 Batch 2：`P11-B2-01～P11-B2-10 / USER_REVIEW_PENDING`。
## 2026-10-05｜PDM-11 启动与证据重建完成

- 已读取并承接 `HO-P01-P11-001`，状态从 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- 已建立 PDM-11 Completed-PDM Dependency Card、术语表、Current Implementation Fact 卡；
- 已重新读取 9/06 SSOT / Decision、9/19 C2 / R10 / R12、IA V5、实际 Low-Fi、M03/M16/M17、已完成 PDM Final；
- 已形成 Batch 1 稳定一致候选 `P11-A01～P11-A13`；
- 已识别真实历史冲突：找车权益客户是否可直接激活 Demand vs 9/19 统一 pending 后由员工激活，暂挂 Batch 4，不静默选择；
- 已识别找车资格来源模型缺口，暂挂 Batch 4；
- Customer 轻量停用不终止既有 Demand 属于 PDM-01 后续明确知情修改，预挂 Batch 3；
- 当前状态：`BATCH_1_USER_REVIEW_PENDING`。
## 2026-10-05｜PDM-01～10 全局总复核完成

- `GLOBAL_PDM01_10_CROSS_PDM_AUDIT = PASS`；
- PDM-01～10 内部 handoff 无 OPEN / ACCEPTED 残留；
- CLOSED handoff 全部有目标 Authority 且 `source_backwrite=YES`；
- future PDM-11～25 保留 69 条合法 `HANDOFF_OPEN`；
- 全局 invariant：Customer / Employee / Vehicle 身份、owner、permission、System Admin、4S、listing_cycle、source facts、snapshot、sensitive access、Customer disable、formal-history delete 全部 PASS；
- 本轮仅修正两项控制性 stale：PDM-01～07 顶部状态元数据、PDM-01 §10 对 PDM-02 的过期“留后续”文字；
- 全局报告：`07_重建工作区/PDM-01至10_全局Cross-PDM_Handoff_GlobalInvariant总复核_2026-10-05.md`；
- PDM-11 启动门禁：`UNBLOCKED`；
- PDM-11 incoming：`HO-P01-P11-001`。
## 2026-10-05｜PDM-10 Legacy Final Integrity Audit 完成

- PDM-10 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 5 组问题：Customer 停用价格权益真实闭环、DAILY_PRICE_QUOTA_EXHAUSTED→联系顾问、3A LIMITED/UNLIMITED 与临时额度、PDM-14/18/20/21/22/25 formal handoff、IA/Low-Fi stale carrier；
- 用户最终裁决 3A：UNLIMITED 时禁止新增临时查价次数；当天已有 today_temp_additions 保留，同日回 LIMITED 后继续有效；UNLIMITED 浏览不计 quota consumption；
- PDM-01～PDM-10 单域 Legacy Final Integrity Audit 至此全部 `INTEGRITY_PASS`；
- 审计报告：`07_重建工作区/PDM-10_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：`GLOBAL_PDM01_10_CROSS_PDM_AUDIT`；
- PDM-11 继续 BLOCKED，直到全局总复核 PASS。
## 2026-10-05｜PDM-09 Legacy Final Integrity Audit 完成

- PDM-09 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 5 组问题：P03-05 source_platform+upstream_publisher_id 与电话明文权限隔离、无有效号码不覆盖旧缓存、3A source_type 电话入口裁剪、PDM-21/22/23/25 future handoff、IA/Low-Fi/旧实现 stale carrier；
- 用户最终裁决 3A：上游电话只作为当前 wholesale/JYT 批发车源的日常敏感能力；批发→名邦或当前为 4S 后，车辆详情关闭查看/latest/拨打入口，但 publisher 来源事实、缓存、history、审计不删除；
- P09-A04-R1 / P09-A11-R1 的 Collector 取号→名邦 Integration API 回传架构保持不变；
- 审计报告：`07_重建工作区/PDM-09_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-10 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-08 Legacy Final Integrity Audit 完成

- PDM-08 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 5 组问题：分享卡片动态价格 DENY、报告/H5旧 URL 权限重验、3A 资产化未闭环临时受控回源、PDM-20/21/22/25 future handoff、IMG-001～030 traceability 归一；
- 用户最终裁决 3A：转名邦后尚未成功资产化的图片，在任务未闭环期间可通过名邦受控 CDN 临时回源 JYT；成功后立即切自有对象存储，禁止长期依赖 JYT；
- 工作版早期 IMG mapping 降为 historical/superseded，以 2026-10-03 CDN 重映射为唯一 Current traceability；
- 审计报告：`07_重建工作区/PDM-08_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-09 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-07 Legacy Final Integrity Audit 完成

- PDM-07 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 4 组问题：PDM-08 报告/档案资源 handoff closure、PDM-12/13/14/15/18/19 业务 handoff、PDM-20/21/22/25 页面/配置/审计 handoff、IA/Low-Fi stale carrier；
- PDM-08 已完成的出险图片、4S维保图片/H5、报告/档案与普通相册隔离、名邦可控报告域名等资源承载已反向写回 PDM-07；
- 历史整套结构化车况字段不恢复，继续执行 P07-B4-01 的来源事实 + 必要确定性标准化方案；
- 审计报告：`07_重建工作区/PDM-07_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-08 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-06 Legacy Final Integrity Audit 完成

- PDM-06 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 6 组问题：草稿发布前 source_type 合法修改、PDM-07 档案 handoff closure、PDM-08 图片 handoff closure、PDM-10 价格 handoff closure、PDM-21/22/25 future handoff、IA/Low-Fi stale carrier；
- PDM-07/08/10 已完成承接均已反向写回 PDM-06；
- Cross-PDM Handoff Register 已登记 PDM-21/22/25 future handoff；
- 审计报告：`07_重建工作区/PDM-06_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-07 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-05 Legacy Final Integrity Audit 完成

- PDM-05 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 7 组问题：PDM-06 stale handoff、mapping conflict 业务连续性、pending/conflict 明确提示、后台 Admin/System Admin 身份歧义、车型固定属性纠错 current/history 边界、future handoff register、IA/Low-Fi stale carrier；
- 用户最终裁决 4A：车型主数据/JYT mapping/MODEL_MISSING/conflict/merge 归 System Admin 控制平面治理，`vehicle.model.manage` 为治理 Guard；
- 用户最终裁决 5A：车型唯一确定的固定属性当前值跟随有效车型主档纠错，历史业务快照与 JYT source facts 不追改；
- PDM-02 / PDM-06 已完成跨域反向同步；
- Cross-PDM Handoff Register 已登记 PDM-12/20/21/22/25 future handoff；
- 审计报告：`07_重建工作区/PDM-05_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-06 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-04 Legacy Final Integrity Audit 完成

- PDM-04 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 11 组问题：listing_cycle started_at、车辆时间概念分离、4S source_type 与成员权限、locked/trading 真实事实更新、PDM-08 图片 handoff、PDM-10 价格 handoff、PDM-05～10 stale handoff、car_code/电话隔离、JYT 三个固定业务 API、IA/Low-Fi stale carrier、Supply Anomaly 新业务 Guard；
- 用户最终裁决 Supply Anomaly=B：anomaly 只作为风险告警，不统一阻断新增业务；真实 offline / unavailable 才按不可售事实硬阻断；
- Cross-PDM Handoff Register 已同步：PDM-05～10 CLOSED；PDM-20 / PDM-22 / PDM-23 新 handoff 正式 OPEN；
- 审计报告：`07_重建工作区/PDM-04_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-05 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜Cross-PDM Handoff 双向闭环启用

- 已新增统一总账：`07_重建工作区/CROSS_PDM_HANDOFF_REGISTER.md`；
- 已把 PDM-01～PDM-10 已出现的 integrity 问题、已完成 handoff、仍开放 handoff 与 post-PDM25 stale carrier 持续回填到统一总账；
- 以后来源 PDM 只写“交后续”不算闭环；目标 PDM 完成后必须反向回写来源 Final / Integrity 报告 / Register / 状态文件；
- PDM-04 §20 已把 PDM-05～10 的旧“留后续”改为 `HANDOFF_CLOSED`；
- PDM-04 已通过 Integrity Audit；Supply Anomaly 采用用户裁决 B：anomaly 本身只告警、不统一阻断新增业务，真实 offline / unavailable 才硬阻断；
- IA / Low-Fi 仍不施工，只登记 stale carrier，继续遵守 PDM-25 后集中对齐规则。
## 2026-10-05｜PDM-03 Legacy Final Integrity Audit 完成

- PDM-03 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 9 组问题：客户主动要求更换销售触发条件、普通 owner 移交 reason 非必填、inactive→active 复职边界、离职交接对象范围、Handover Batch 逐对象映射与部分失败、PDM-10 分享/查价 handoff closure、公司客户历史访问边界、Customer 停用对 owner 的影响、IA/Low-Fi stale carrier ledger；
- 用户确认：9 组问题全部同意；IA / Low-Fi 当前只登记 `STALE_CARRIER`，不修改承载文件；
- 审计报告：`07_重建工作区/PDM-03_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-04 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-04｜PDM-02 Legacy Final Integrity Audit 完成

- PDM-02 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 8 组问题：权限变化即时生效、inactive 恢复 accepting 默认 OFF、调店前交接、治理审计最小字段、接客/离职交接与 handover batch、System Admin 自身治理、System Admin 直接停用/恢复 Customer、已完成跨域 handoff 清理；
- 用户新增裁决：System Admin 可直接执行 Customer 账号停用 / 恢复，定义为控制平面治理动作；不因此获得销售 / CRM / owner / Lock / Transaction 等业务执行权；
- PDM-01 已同步 `PDM01-DEC-A16-R2`，保持 `INTEGRITY_PASS`；
- 审计报告：`07_重建工作区/PDM-02_历史最终版完整性复核_2026-10-04.md`；
- 当前进入：PDM-03 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。

## 2026-10-04｜IA / Low-Fi 集中对齐时点冻结

用户明确决定：不在 PDM-01～10 完成后单独对齐 IA / Low-Fi。

固定流程：

> PDM-01～10 Integrity Audit → 01～10 全局总复核 → PDM-11～25 → PDM-01～25 全局最终总复核 → IA 集中对齐 → Low-Fi 集中对齐 → Engineering。

PDM-01～25 期间发现的 IA / Low-Fi 错误统一登记 `STALE_CARRIER` 与正确 Authority，不直接修改 carrier。
## 2026-10-04｜PDM-01 Legacy Final Integrity Audit 完成

- PDM-01 Integrity：`INTEGRITY_PASS`；
- 本轮共关闭 6 组 reopen：显式登录页语义、手机号授权拒绝时找车表单临时保留、PDM-02 手机号维护 handoff、接客池异常为空、PDM-03 owner/分享 handoff、客户账号停用/恢复轻量后台控制；
- 客户账号停用最终口径：后台受控停用/恢复；停用后仍可进入网站/小程序并浏览公开内容，但暂停依赖 Customer 身份/权益的业务账号能力；不删除 customer_id / owner / 来源 / 历史；若只需降权使用客户等级调整；
- IA / Low-Fi 中旧“首次无 owner / SOURCE_ONLY / Customer Merge”等只登记为 stale carrier，本轮不修改；
- 审计报告：`07_重建工作区/PDM-01_历史最终版完整性复核_2026-10-04.md`；
- 当前进入：PDM-02 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。

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
- PDM-08：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-08_最终完整规则.md`；
- PDM-09：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-09_最终完整规则.md`；
- PDM-10：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-10_最终完整规则.md`；
- 已新增并启用《用户全量审查四批门禁规范》。

## 2026-10-04｜PDM-01～PDM-10 Legacy Final Integrity Audit 前置阶段

用户明确要求：PDM-10 完成后先不要进入 PDM-11，先用 2026-10-04 新的信息保真 / 一次性收口标准重新复核 PDM-01～PDM-10。

本轮不是只做“细检”，必须同时：

- 重新查整条业务规则遗漏；
- 检查现有 Final 是否压掉条件、例外、权限、生命周期、历史等细节；
- 检查 PDM-01～10 之间的冲突、静默覆盖、handoff 丢失与 stale rule。

已新增方法门禁：

> `00_先读/01_产品基线重建执行规范_冻结工作版.md` §3.3 Legacy Final Integrity Audit Gate

总控工作单：

> `07_重建工作区/PDM-01至10_全域完整性复核_总控工作单.md`

执行顺序：PDM-01 → ... → PDM-10 → 01～10 全局 Cross-PDM / Handoff / Global Invariant 总复核 → PASS 后才允许 PDM-11。

原 PDM-01～10 `COMPLETE` 保留为历史裁决完成状态；在本轮 Integrity Audit PASS 前，不声称旧 Final 已满足当前新完整性标准。

---
## 2026-10-04｜PDM-10 最终完成

用户最终批准 PDM-10《价格 / 查价 / 客户展示价覆盖》完整规则，并明确“确定执行”写入仓库。

- PDM-10 状态：`COMPLETE`；
- 正式规则：`07_重建工作区/PDM-10_最终完整规则.md`；
- 完整性检查卡：`07_重建工作区/PDM-10_信息保真与一次性收口检查卡_2026-10-04.md`；
- Coverage 报告：`07_重建工作区/PDM-10_全量DecisionCoverage未映射检查报告_2026-10-04.md`；
- M11-001～M11-017：17/17 有明确去向；
- SOURCE_DECISION_COVERAGE = 100%；
- UNMAPPED = 0；
- FINAL_TO_SOURCE_TRACEABILITY = 100%；
- CROSS_PDM_CONFLICT = 0；
- SEMANTIC_INTEGRITY = PASS；
- USER_FINAL_APPROVED = YES；
- IMPLEMENTATION_READY = PASS；
- PDM-02 / PDM-06 的旧独立调价语义已显式 supersede 并同步加注；
- PDM-20/21/22/25 等后续 carrier handoff 已登记完整 Guard，不修改 IA / Low-Fi / Engineering。

当前允许进入 PDM-11 准备，但不得跳过新方法的依赖卡和证据刷新。

---
## 2026-10-04｜信息保真 / 一次性收口方法升级

用户明确要求停止“越写越丢、后续 PDM 再反复重建”的循环。本轮已把防丢失要求升级为全局硬门禁：

- Memory Zero-Trust：模型记忆 / 聊天上下文只能作为检索线索，不能代替当前 GitHub 证据；
- Current Authority Refresh：重要判断前重新读取当前状态、Decision、相关已完成 PDM Final；
- PDM Scope ≠ Evidence Scope：业务域不限制证据读取范围；
- Completed-PDM Dependency Card：任何新 PDM 在 Batch 1 前必须建立跨 PDM 依赖卡；
- Global Invariant Gate：identity / permission / data scope / owner / vehicle_id / listing_cycle / hard DENY / audit 等跨域不变量必须显式检查；
- Terminology / Field Normalization：中文词、技术字段、历史别名统一后再检索；
- No Summary-on-Summary：禁止摘要继续摘要成为唯一证据；
- Bidirectional Traceability：Source→Final 与 Final→Source 双向追溯；
- Negative Claim Proof：所有“没有 / 已废弃 / 不存在 / 不需要”必须多路证明；
- Conflict Before Classification：完整证据扫完后才能分 Batch；
- Deferred Handoff Closure：跨域移交必须有目标、有完整语义、有接收状态；
- Change Impact Analysis：reopen / supersession / 新裁决必须立即检查受影响 PDM、Decision、IA/Low-Fi/Engineering；
- Semantic Completeness Matrix：权限、scope、hard DENY、生命周期、异常、并发、历史等适用维度不得静默省略；
- Final Semantic Integrity + Implementation-Ready Gate：`UNMAPPED=0` 不再足以标记 COMPLETE，最终文件必须可直接承接后续施工。

强制执行模板：

> `07_重建工作区/PDM_信息保真与一次性收口检查模板.md`

该模板是执行留痕，不是新的业务 Authority。

---

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


## 2026-10-04｜产品基线重建方法补强

用户批准新增全局硬规则：

> **先识别当前已实现 / 已测试事实，再执行原有 9/19 主底盘 + 前后历史反查 + 知情修改测试 + 四批用户裁决。**

新增要求：

- 已实现 / 已测试事实用于确定“当前系统实际上怎么跑”，但不自动成为产品权威；
- 当前实现与正式业务规则冲突时进入 `CURRENT_IMPLEMENTATION_CONFLICT`，不得模型自行覆盖；
- 涉及 API / Collector / 同步 / 鉴权时，必须先确认“谁提供 API、谁调用 API、数据流方向、当前版本、测试验收状态”；
- 历史“建议 / 推荐 / 候选 / 未施工”不得覆盖已验证当前实现；
- 当前 PDM-09 已发现电话 API 链存在旧方案污染迹象，继续 Batch 4 前必须对相关已确认项做显式复核，不静默改写。

当前 PDM-09 仍为 IN_PROGRESS。


## 2026-10-04｜PDM-09 当前实现事实卡完成

按新方法完成电话 API 架构复核。

当前事实：

- 名邦 Backend 提供 / 生成名邦 Integration API；
- Collector / 采集端配置并调用名邦 API，承担 JYT 采集与上游电话获取；
- 车辆数据和电话结果最终通过名邦既有回传体系进入名邦；
- 旧独立 Mingbang→Collector Phone API / Collector Base URL / Phone Path 方案属于历史中间方案或实现残留，不再自动视为当前产品规则。

因此回开：

- P09-A04 → P09-A04-R1
- P09-A11 → P09-A11-R1
- P09-B4-04 → 建议撤回

当前等待用户复审以上三项，Batch 4 其余候选暂不推进。


## 2026-10-04｜PDM-09 API 架构回开复核完成

用户明确“同意”，确认：

- P09-A04-R1：Collector / 采集端负责 JYT 取号，电话结果通过名邦 Backend 已有 Integration API / 回传体系返回名邦；
- P09-A11-R1：名邦 P03 撤销 Collector Base URL / Phone Path 产品配置，保留集成状态、缓存/历史、诊断、日志、审计；
- P09-B4-04-R1：原 B4-04 撤回，不再作为名邦产品规则。

P09-B2-02 的核心“名邦不直连 JYT / 不管理 JYT 电话凭证”继续有效；其旧网络方向文字由 A04-R1 替代。

当前 Batch 4 剩余待审：P09-B4-01、P09-B4-02、P09-B4-03、P09-B4-05、P09-B4-06。


## 2026-10-04｜PDM-09 Batch 4 完成

用户明确“全部同意”，一次性确认剩余：

- P09-B4-01：无缓存时按需取号，成功缓存后拨号；
- P09-B4-02：expires_at / freshness 不作为普通查看 / 拨打硬失效门槛；
- P09-B4-03：车源同步阶段不批量预取电话；
- P09-B4-05：P03-05 收口为 publisher 电话缓存管理 / 诊断页，不再承载 Collector URL / Phone Path；
- P09-B4-06：V1 不提供上游电话专门复制动作。

P09-B4-04 已在前轮确认撤回。

至此 PDM-09 Batch 1～4 用户审查全部完成。

当前下一步：

> **执行 PDM-09 全量 Decision Coverage / 未映射检查。**

PDM-09 尚未 FINAL APPROVED，不得标记 COMPLETE，不得进入 PDM-10。


## 2026-10-04｜PDM-09 全量覆盖校验完成

已完成 PDM-09 全量 Decision Coverage / 未映射检查。

结果：

- SOURCE_DECISION_COVERAGE = 100%（20/20）
- UNMAPPED = 0
- Batch 1～4 全部审查单元均有明确最终去向；
- 原 A04/A11/B2-02 的旧网络方向已由 A04-R1/A11-R1 正确替代；
- B4-04 已撤回且无孤儿产品 Decision；
- 当前 IA / Low-Fi 仍存在少量旧 Collector 电话连接 carrier，但均已有明确 supersede 去向，标记为 STALE_CARRIER，进入后续 IA / Engineering 整改，不阻塞 PDM-09 产品最终审批。

已生成：

- `07_重建工作区/PDM-09_全量DecisionCoverage未映射检查报告_2026-10-04.md`
- `07_重建工作区/PDM-09_最终完整规则总览_待用户批准.md`

当前状态：

> `PDM-09 / FINAL_REVIEW_PENDING`

未经用户最终批准，不得标记 PDM-09 COMPLETE，不得进入 PDM-10。


## 2026-10-04｜PDM-09 最终完成

用户最终明确确认 PDM-09《最终完整规则总览》。

- PDM-09 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-09_最终完整规则.md`；
- SOURCE_DECISION_COVERAGE = 100%（20/20）；
- UNMAPPED = 0；
- A04/A11 的旧 API 方向已由 A04-R1/A11-R1 正式替代；
- B4-04 已正式撤回；
- 旧 IA / Low-Fi Collector 电话连接 carrier 保留为后续对齐整改项，不属于未决产品规则；
- Decision Register 已登记 `PDM09-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-09，真实跨域冲突必须显式提交用户裁决。

当前进入准备：

> **PDM-10｜价格 / 查价 / 客户展示价覆盖**


## 2026-10-04｜PDM-10 Batch 1 已形成

已按冻结执行规范完成 PDM-10 前置证据扫描：

- 先识别当前已实现 / 已测试价格事实；
- 再读取 9/19 R4 / R11；
- 向前扫描 CN11 / 9/06 SSOT 与 Decision；
- 向后核对 9/22、IA V5、实际 Low-Fi、工程 Delta；
- 使用 001～078 M11 的 17 个归档单元做反向差集。

已形成：

> **P10-A01～P10-A12，共 12 条稳定一致候选。**

工作版：

> `07_重建工作区/PDM-10_价格查价客户展示价覆盖_规则原子重建_工作版.md`

已明确排除出 Batch 1 的包括：

- 加价 OFF 语义演进；
- 三类车源覆盖价范围演进；
- 内部价 permission 演进；
- 调价 permission 承载缺口；
- 临时追加查价次数历史遗漏；
- 排序 / 格式 / 低价警告等承载缺口；
- 同一 vehicle_id 一键转名邦后的价格继承冲突。

当前状态：

> `PDM-10 / BATCH_1_STABLE_CONSISTENT / USER_REVIEW_PENDING`

未经用户确认不得进入 Batch 2。


## 2026-10-04｜PDM-10 Batch 1 完成并进入 Batch 2

用户明确“全部同意”，确认 P10-A01～P10-A12 全部通过。

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

Decision Register 已登记 PDM10-DEC-A01～A12 与 PDM10-GATE-B1。

已继续完成 Batch 2 筛选，共形成：

> **P10-B2-01～P10-B2-12**

当前进入：

> `PDM-10 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

未经用户确认不得进入 Batch 3。


## 2026-10-04｜PDM-10 Batch 2 完成并进入 Batch 3

用户明确“全部同意”，确认 P10-B2-01～P10-B2-12 全部通过。

Batch 2 状态：

> `COMPLETE_USER_CONFIRMED`

Decision Register 已登记 PDM10-DEC-B2-01～B2-12 与 PDM10-GATE-B2。

经后续证据复核，Batch 3 不凑数量，只形成 3 条真正的知情修改 / 明确新增：

- P10-A13：加价关闭显示上游标价；
- P10-A14：覆盖价扩展到批发 / 名邦 / 4S；
- P10-A15：名邦内部价查看取消独立 permission 门槛。

当前进入：

> `PDM-10 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / USER_REVIEW_PENDING`

未经用户确认不得进入 Batch 4。


## 2026-10-04｜Batch 2/3 反向冲突门禁与 PDM-10 内部价权限纠正

用户批准将“Batch 2 / Batch 3 入批前反向冲突检查”写入全局执行规范与四批门禁。

本次触发问题：

- R4 存在内部价 permission + data scope 正式规则；
- R11 后来取消独立 permission；
- 已完成 PDM-02 最终规则已经由用户主动反转回“独立 permission”；
- IA V5 / 001～078 又记录反向承载与冲突；
- PDM-10 前一轮却误把 R11 当作最终演进，形成错误的 P10-B2-10 / P10-A15。

纠正结果：

- P10-B2-10：`REOPENED / INVALID_CLASSIFICATION`；
- P10-A15：`WITHDRAWN_FROM_BATCH_3 / RECLASSIFIED_TO_BATCH_4`；
- P10-A13、P10-A14：用户已确认；
- P10-B4-01：`USER_APPROVED`，内部价查看恢复/继承为后台可配置独立 permission；
- PDM-10 当前进入 `BATCH_4_EVIDENCE_REVIEW`。

本次未修改 R11 / IA / Low-Fi 历史证据原件。
