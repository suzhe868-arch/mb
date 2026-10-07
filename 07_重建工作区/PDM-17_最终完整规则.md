# PDM-17｜公海 / 待公海处理 / 主动领取 / 指定分配 / Collaboration｜最终完整规则

> 域：公海 / 待公海处理 / 主动领取 / 指定分配 / Collaboration  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> Final 前完整性复核：`R2 PASS / FINAL_CANDIDATE_READY`  
> 本文件为 PDM-17 当前正式中文产品 Authority。用户已于 2026-10-06 最终批准并确认执行。

## 1. 核心定位

PDM-17 是：

> **名邦 Customer 公海治理与 Collaboration 业务 Authority。**

负责：

- 待公海候选；
- 人工判断；
- 正式进入 / 退出公海；
- 主动领取；
- 后台指定分配；
- 公海 Customer 主动发起人工服务时的 owner 分配；
- 再次释放；
- Collaboration 建立、范围、权限边界、结束；
- 上述动作的保护条件、并发、历史与审计。

不重建：

- Customer identity；
- CRM；
- Demand；
- Priority；
- Consultation；
- Recommendation；
- Lock / Waitlist；
- Transaction / Refund。

这些业务对象继续由各自 PDM Authority 负责，PDM-17 只消费其当前真实保护事实和责任状态。

## 2. Customer 与公海的基本关系

1. Customer 同一时刻只有一个正式 current owner。
2. 正式进入公海成功后：
   - current owner = null；
   - 原 owner 进入历史；
   - 不产生第二 owner。
3. 被主动领取或后台指定分配成功后，只形成一个新的 current owner。
4. 历史 owner、来源销售、分享人、推荐人、collaborator 都不得冒充第二 owner。
5. owner 变化不得反向改写原始 source、转介绍关系或历史 owner。

## 3. 禁止自动抢入公海

以下事实本身均不得自动把 Customer 放入公海：

- 长期未登录 / 未访问；
- 已完成购车；
- 暂无意向；
- 暂不联系；
- 销售关闭自然接客；
- 销售短期休假；
- 跟进超期；
- 长期未联系；
- Customer Opportunity 命中。

系统可以：

- 生成待公海候选；
- 提醒；
- 限制操作。

但 owner 改变必须来自合法明确业务动作。

## 4. 正式进入公海的合法触发

可以来自：

- 当前 owner 主动释放；
- 有合法 permission/capability + data scope 的授权管理人员处理；
- 员工 inactive / 离职且不存在合法接替 owner，在必要责任治理完成后进入；
- 待公海候选经合法人工确认。

提交时必须重新校验：

- Customer 当前状态；
- current owner；
- actor；
- permission/capability；
- data scope；
- 当前保护事实；
- 当前未完成责任。

## 5. 待公海处理

“待公海处理”只是人工治理层，不是公海状态本身，不直接修改 owner。

合法处理结果只有：

1. 正式进入公海；
2. 继续当前 owner；
3. 直接移交其他合法 owner。

选择“继续当前 owner”：

- owner 不变；
- 记录本次处理结果；
- 支持后台配置重新检查周期；
- 周期内不重复生成；
- 到期后仍满足当前候选规则时，可以重新生成候选。

## 6. 长期未真实跟进三条件候选

只有以下三个条件同时满足，才生成“疑似长期未真实跟进”的待公海人工候选：

1. 近期存在真实 Customer 主动活跃；
2. 距最后一次真实 CRM Follow-up 超过后台可配置阈值；
3. 当前不存在 PDM-17 认可的保护业务 / 未完成责任。

并且：

- 只生成候选；
- 不自动进公海；
- 不自动改 owner；
- 不自动飞书；
- 不建立独立 lifecycle / state；
- 后台心跳、系统行为、员工代操作不算 Customer 主动活跃；
- 长期完全不活跃的沉默 Customer 不因为销售没跟进自动成为候选；
- 正常成交后长期沉默 Customer 不仅凭“没跟进”进入候选；
- 不恢复固定“30 天未跟进”硬规则。

## 7. 未完成责任 / 保护事实

存在以下适用事实时，不得直接把 Customer 丢入公海：

- pending Find-car Application；
- active / paused Demand；
- active Priority；
- open Consultation；
- active Lock / Waitlist；
- in-progress Transaction；
- 未完成 CRM 跟进任务；
- 回访提醒；
- 未来跟进计划；
- 其他真实未完成业务责任。

必须先由对应 Authority：

- 完成；
- 取消；
- 或正式交接。

Priority qualification 本身不是保护事实；active Priority 才是。

PDM-17 不替其他业务对象发明新的完成 / 取消 / 交接状态。

## 8. 公海范围与身份权限

公海不是默认全公司共享池。

Customer 进入公海后，继续按当前：

> identity + permission/capability + data scope + object/account state

计算查看与操作资格。

规则：

- 4S Member 不领取名邦公海 Customer；
- 4S Member 不成为 Customer-level collaborator；
- 4S 具体车辆 / 交易协作留在对应业务模块；
- System Admin 控制平面身份本身不成为 Customer owner、claimant、业务 collaborator；
- 同一真人需要执行业务时，必须使用合法 Employee 业务身份。

## 9. 公海运营主路径

V1 采用：

> **后台指定分配 / 待公海人工治理为主，主动领取保留但弱化。**

主动领取仍是合法能力：

- 可按 permission / 角色模板 / 配置开放；
- 不作为唯一公海运营主流程；
- 不得用一个 accepting 开关同时代表自然接客资格与主动领取资格。

## 10. 主动领取

合法领取成功：

- Customer 立即退出公海；
- claimant 立即成为唯一 current owner；
- 不增加“待确认领取”中间主状态；
- 提交时重新校验 Customer 仍在公海、owner 仍为空、保护事实仍允许、actor 仍合法。

并发：

- 只有一个请求可以成功；
- 其他请求读取已被领取后的当前真实结果；
- 原 owner 没有任何优先权。

原 owner 如果当前仍：

- active + eligible；
- 有领取 permission/capability；
- data scope 覆盖；
- 未触发领取限制；
- Customer 仍可领取；

则可以和其他 claimant 一样重新领取自己曾释放的 Customer，但没有历史优先权。

## 11. 接客开关与主动领取分离

关闭自然 accepting：

- 只退出未来自然注册 / 自动轮询；
- 不丢失已有 Customer；
- 不因为这个开关单独禁止合法主动领取。

自然接客资格与主动公海领取资格必须分离计算。

## 12. 领取数量 / 频率

后台可配置：

- 主动领取数量上限；
- 主动领取频率限制。

达到限制：

- 只阻止新的主动领取；
- 不自动收回已经形成 owner 的 Customer；
- 不改历史。

释放 / 完成处理后，是否恢复额度按当前配置重新计算。

PDM-17 不写死具体数字、时间窗口或默认值；配置 carrier 已由 PDM-22 Final 承接。

## 13. 公海 Customer 主动发起人工服务

公海 Customer 主动发起 Consultation、找车等需要真人承接的服务时：

1. 不要求先等待销售手工领取；
2. 先按合法接客 / 服务规则形成唯一 Customer owner；
3. owner 分配成功后退出公海；
4. 再由对应 PDM 创建 / 复用正式业务对象。

若当前不存在合法承接人：

- 进入 owner assignment pending / 安全失败路径；
- 不创建 responsible=null 的正式人工业务；
- System Admin 不做临时业务 owner。

## 14. 后台指定分配

有合法 assignment permission/capability + data scope 的员工，可把公海 Customer 直接指定给 active + eligible 合法目标员工。

成功后：

- 目标员工立即成为唯一 current owner；
- Customer 退出公海；
- 不需要目标员工再次确认；
- 提交时重新校验 Customer 当前仍在公海、目标员工仍合法；
- 必须保留可追溯历史。

职位名本身不自动授予 assignment 权。

## 15. 批量公海治理

V1 保留批量治理。

授权管理人员可批量：

- 正式进入公海；
- 继续当前 owner；
- 直接移交 / 指定分配。

每个 Customer 必须独立：

- 重新校验 current owner；
- 重新校验保护事实；
- 重新校验目标员工；
- 重新校验 permission / data scope；
- 独立执行结果。

允许 partial success。

必须返回每个 Customer 的：

- 成功 / 失败；
- 失败原因。

只对成功项产生 owner / public-pool mutation 和审计。

## 16. 再次释放

领取 / 分配后的 Customer 可以再次释放进入公海，但仍必须先处理：

- 未完成业务；
- CRM 待办 / 回访 / 未来计划；
- 当前其他保护事实。

合法重新进入后形成新一轮公海经历，不覆盖上一轮历史。

原因 / 备注默认可选，不作为成功硬门槛。

## 17. 公海领取前敏感信息

普通 claimant 在领取前只看判断是否领取所需的最小必要摘要。

默认不因“能看公海”而开放：

- 手机号；
- 完整联系方式；
- 私密备注；
- 其他敏感 CRM 字段。

领取成功成为 current owner 后，再按正常 CRM permission + data scope 返回。

授权管理人员的治理查看仍按 PDM-02 敏感字段 permission + data scope 计算。

## 18. 分享 / 转介绍边界

已经处于公海 / 待公海治理链路的 Customer：

- 点击历史销售分享链接；
- 再打开旧客户分享；
- 新产生转介绍 / 分享事件；

均不得：

- 恢复历史 owner；
- 自动归最后分享销售；
- 绕过公海领取 / 指定分配；
- 用分享事实覆盖当前公海 / owner 治理事实。

来源 / 推荐历史继续保留。

### 公海 Customer 产生新的转介绍 Customer

公海 Customer 当前 owner=null：

- 仍保留“谁介绍来的”直接来源；
- 不恢复推荐人的历史 owner；
- 不因历史 owner 自动归属销售；
- 因不存在合法 referral owner，新 Customer 按 PDM-03 正常 active + eligible + accepting 接客池形成 owner。

## 19. Customer 历史不可清空

进入公海、领取、指定分配、再次释放均不得清空或重建：

- customer_id；
- 原始 source；
- 转介绍来源；
- 历史 owner；
- CRM Stage；
- Customer Tags；
- Shared Profile；
- 历史 Follow-up；
- 历史业务；
- 历史 Collaboration；
- 每次进入 / 领取 / 分配事实。

历史服务过不等于永久拥有当前 CRM 访问权。

## 20. Collaboration 基本模型

Collaboration 只表示：

> **参与服务。**

它不改变 current owner。

Customer 可以：

- 一个 current owner；
- 一个或多个合法 collaborator。

有效能力由：

> Collaboration scope + 自身 permission/capability + data scope + object/account state

共同决定。

Collaboration 不自动授予：

- 完整敏感 Customer 信息；
- 内部敏感价格；
- owner 修改；
- source 修改；
- 退款 / 资金；
- Transaction 纠错；
- 其他超出自身当前业务能力的权限。

## 21. Collaboration scope

V1 只保留两层：

1. 具体业务级 Collaboration；
2. Customer-level Collaboration。

具体业务级：

- 默认优先；
- 只访问 / 操作对应业务必要内容；
- 对应业务正式结束后结束。

Customer-level：

- 仅长期共同服务时建立；
- 可查看更完整 CRM，但仍受自身 permission + data scope；
- 不因此形成第二套“只读 / 可跟进 / 可交易”等权限系统。

## 22. Collaboration 建立与结束

可以建立 / 移除：

- current owner 对自己负责的 Customer / 具体业务；
- 有合法 permission/capability + data scope 的授权管理人员。

禁止：

- 普通销售自行把自己加到别人 Customer；
- collaborator 仅凭 collaborator 身份继续邀请新的 collaborator。

结束：

- 具体业务级：对应业务正式结束；
- Customer-level：owner / 授权管理人员取消、owner 正式变化、collaborator inactive / 离职。

重新参与必须建立新 Collaboration，不能复活旧记录。

## 23. 正式进入公海与 Collaboration

正式进入公海成功属于：

> owner → null 的正式 owner 变化。

因此：

- 旧 Customer-level Collaboration 立即结束；
- 历史 Collaboration 永久保留；
- 具体业务级 Collaboration 若仍依附未完成业务，该业务必须先完成、取消或正式交接；
- 未完成责任未处理时，不允许正式进入公海。

## 24. collaborator 可以做什么

合法 collaborator 在明确 scope 内，可以：

- 新增 CRM Follow-up；
- 处理被授权的具体协作业务；
- 在自身 permission/capability + data scope + object/account state 范围内参与服务。

默认不得因为 Collaboration 获得：

- Customer 主阶段修改权；
- owner / source 修改权；
- 敏感内部价格；
- 资金 / 退款；
- Transaction 纠错等额外权限。

CRM Follow-up 本体继续由 PDM-16 负责。

## 25. Collaboration 失效

collaborator 被移除、inactive、离职或失去资格后：

- 当前访问 / 操作权立即失效；
- 历史 Collaboration 保留；
- 本人历史操作保留。

如果仍有未完成任务：

- 由 current owner；
- 或有合法权限的管理人员；

重新安排合法负责人。

owner 正式变化后旧 Collaboration 默认结束；新 owner 如仍需要原 collaborator，必须重新建立。

## 26. 核心审计

以下核心 mutation 至少记录：

- before；
- after；
- actor；
- time。

至少覆盖：

- 正式进入 / 退出公海；
- 主动领取；
- 后台指定分配 / owner transfer；
- “继续当前 owner”人工确认；
- Collaboration 新增 / 移除；
- Collaboration scope 变化。

reason / note 默认可选。

普通 CRM Follow-up 继续走 PDM-16 append-only history，不升级为重型 mutation audit。

## 27. 配置边界

PDM-17 只冻结业务语义“可配置”，不写死数值。

已由 PDM-22 Final 承接的配置 carrier：

- 待公海候选条件；
- 继续当前 owner 后重新检查周期；
- 主动领取数量上限；
- 主动领取频率限制；
- 领取后首次跟进提醒时间。

首次跟进提醒：

- 超时只提醒；
- 不自动收回 Customer；
- 不自动重新进公海；
- 如需重新判断，走待公海人工治理。

通知渠道 / 频控 / DND / 日志交 PDM-23。

## 28. 明确废弃 / 不得恢复

1. Customer Merge × 公海迁移 / owner 冲突旧分支；
2. 经理 / 店长职位名称本身自动拥有全部公海权限；
3. System Admin 直接领取公海、成为 Customer owner、Customer-level collaborator 或接客兜底 owner；
4. 分享 / 转介绍绕过公海治理恢复历史 owner；
5. 固定 30 天未跟进自动进入候选 / 公海；
6. “指定分配后目标员工还要二次确认”的旧主状态；
7. 通过长期不活跃、暂无意向、跟进超期等事实自动抢走 owner；
8. Collaboration 作为第二 owner；
9. Collaboration 内再造第二套权限体系。

## 29. Cross-PDM Handoff

### Incoming｜Final closeout 前保持 HANDOFF_ACCEPTED

- HO-P02-P17-001；
- HO-P03-P17-001；
- HO-P11-P17-001；
- HO-P13-P17-001；
- HO-P15-P17-001；
- HO-P16-P17-001。

### Outgoing｜PDM-18/PDM-19 已 CLOSED，其余未来 handoff 保持 OPEN

- HO-P17-P18-001｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-18 Final 已正式承接 active Lock/Waitlist 作为公海保护事实，并冻结 Customer owner 与 Lock/Waitlist responsible 分层；owner / 公海变化不得静默取消、漂移或改写既有 Lock/Waitlist，未完成责任进入公海前必须完成、取消或正式交接；
- HO-P17-P19-001｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-19 Final 已正式承接 in-progress Transaction / pending Refund 作为未完成责任与公海保护事实；owner / 公海变化不得静默取消、漂移或重建 Transaction/Refund 当前责任与历史，进入公海前必须完成、取消或正式 handoff；
- HO-P17-P21-001｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-21 Final 已正式承接员工端公海/待公海、主动领取、人工治理结果与 Collaboration 操作投影；
- HO-P17-P22-001｜`HANDOFF_CLOSED / source_backwrite=YES`：公海配置 carrier 已由 PDM-22 Final 承接；
- HO-P17-P23-001｜`HANDOFF_CLOSED / source_backwrite=YES`：提醒 / 通知 carrier 已由 `07_重建工作区/PDM-23_最终完整规则.md` 正式承接；
- HO-P17-P25-001｜统一审计 / 历史。

## 30. Stale Carrier

当前明确登记、但不在 PDM-17 修改：

`04_证据_D_实际_LowFi/CURRENT/PC/P06-05/P06-05-V5-PUBLIC_POOL_ASSIGN_CONFIRM_REQUIRED.svg`

它与当前 Authority 冲突：

> 指定分配成功后目标员工立即成为唯一 owner，不存在二次确认主状态。

该项统一留到 PDM-25 完成 + PDM-01～25 全局最终总复核 PASS 后 IA / Low-Fi Alignment。

## 31. Final 前完整性结论

R2：

- `SOURCE_TO_ATOM = PASS`
- `ATOM_TO_SOURCE = PASS`
- `SEMANTIC_COMPLETENESS = PASS`
- `MISSING_RULE_UNRESOLVED = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `OUTGOING_HANDOFF_GAP = 0`
- `NEGATIVE_CLAIMS_VERIFIED = PASS`
- `PDM17_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM17_FINAL_CANDIDATE_READY = YES`

## 32. Final Closeout

用户已最终批准并确认执行。

- 正式 Authority：`07_重建工作区/PDM-17_最终完整规则.md`；
- Final 前完整性复核 R2：`PASS / FINAL_CANDIDATE_READY`；
- 34 个正式规则 / 用户裁决单元全部进入 Final；
- 6 条 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-23 已 `HANDOFF_CLOSED / source_backwrite=YES`；其余未承接 handoff 继续按总账状态管理；
- PDM-17：`COMPLETE / INTEGRITY_PASS`；
- 历史阶段下一步（HISTORICAL_AUDIT_TRAIL，当时）：`PDM-18 Startup Gate`；
- IA / Low-Fi / Engineering 继续禁止提前施工。

> 2026-10-07 Source Backwrite：对应 PDM-22 handoff 已由 `07_重建工作区/PDM-22_最终完整规则.md` 正式承接；以 CROSS_PDM_HANDOFF_REGISTER 的 `HANDOFF_CLOSED / source_backwrite=YES` 为准。


> 2026-10-07 Source Backwrite｜HO-P17-P25-001：`HANDOFF_CLOSED / source_backwrite=YES`。PDM-25 已由 `07_重建工作区/PDM-25_最终完整规则.md` 正式承接本域移交的审计 / 历史 / 时区 / 配置版本 / 横切完整性语义；PDM-25 不反向改写本 PDM 已冻结的业务状态机与产品规则。
