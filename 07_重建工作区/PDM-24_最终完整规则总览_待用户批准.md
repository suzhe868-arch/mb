> **HISTORICAL_AUDIT_TRAIL｜历史执行记录**  
> 本文件记录当时阶段性审查 / 待批准 / 覆盖检查 / 切窗状态。文中的“当前 / 下一步 / PENDING / BLOCKED / Startup Gate / Batch”等阶段表述均只代表当时，不是仓库当前状态。  
> 当前状态与唯一下一步以根目录 `README.md`、`CURRENT_PROJECT_STATE.md`、`NEXT_ACTION.md`、`PROJECT_STATE.json` 为准；不得据本文件恢复旧阶段指针或覆盖正式 Final。

# PDM-24｜最终完整规则总览｜用户已最终批准

> 域：公告 / Banner / 运营位 / 客户触达  
> 当前状态：`USER_FINAL_APPROVED / FINAL_CLOSEOUT_DONE`  
> Final 前完整性复核：`R2 PASS / FINAL_CANDIDATE_READY`  
> 正式规则 / 用户裁决单元：`40`

## 1. 核心定位

PDM-24 是 Announcement（客户公告）与 Banner / Placement 运营生命周期的唯一产品 Authority。

负责公告创建、编辑、启停、排期、生效、结束、排序、active/history、自动弹层频控，以及 Banner 创建、编辑、启停、排期、placement、排序与合法跳转目标。

不重新定义 Customer、Vehicle、Customer Safe Projection、Notification / 飞书 / DND / Incident、通用 audit/history/timezone、IA / Low-Fi 或 Engineering。

公告与 Banner 是两个独立对象，不合并为通用 Message / Campaign / 营销自动化平台。

## 2. 公告后台与生命周期

Announcement 至少支持：列表、新建、编辑、标题、正文、启用/停用、生效开始日期、结束日期、自动弹出开关、排序、创建人、修改人、创建/修改时间。

V1 至少按“年-月-日”设置有效周期。开始日期不得晚于结束日期；无效周期不得启用。

公告生命周期至少能表达 draft / scheduled / active / ended。

## 3. 公告客户端

客户端只保留公告业务入口：

- 当前 active 公告；
- 历史公告。

不建设通用消息中心，不建设 read/unread 主状态机。关闭公告弹层只结束本次展示，不形成“已读”主状态，也不改变 Announcement 生命周期。

## 4. 公告 active/history 与再启用

公告到期或人工停用后退出 active 并进入 history，不物理删除。

人工停用后如果仍在合法有效周期内，可以重新启用；已经过期则必须先设置新的合法有效周期。

自动弹出关闭不等于 Announcement 停用：合法 active 公告即使 auto-popup OFF，客户仍可主动查看。

## 5. UTC+8 与每日自动弹出

公告的开始日期、结束日期、“当天”、“每日”和“当天第一次进入”统一按 Asia/Shanghai（UTC+8）业务自然日解释，以后台统一业务时区为 Authority，不使用客户设备本地时区决定跨日。

结束日期当天仍有效。

当前最终频控：

> **同一 Customer 在同一 UTC+8 业务自然日内，公告主动弹层全局最多实际展示 1 条。**

不是每个 Announcement 各自每天一次。

只有同时满足“已启用 + 当前有效周期 + 自动弹出开启”的 Announcement 才进入候选。

## 6. 当天第一次进入与多公告选择

触发时机固定为客户当天第一次进入 / 打开小程序。

同一时刻有多条有效候选公告时，按后台当前有效排序择一，只自动展示 1 条，不连续弹第二、第三条。

当天后续再次进入不再补弹其他公告；第二天重新获得当天第一次进入机会。

客户主动进入公告业务入口查看不受自动弹层每日上限限制。

## 7. 与其他主动弹层冲突｜3A

公告与头像/昵称完善等其他合法主动弹层同时命中时，同一时刻只展示一个主动弹层。

采用用户最终批准的 3A：如果客户当天第一次进入时最终由其他主动弹层占用，则 Announcement 当天不再补弹。

若 Announcement 没有真正展示，则不写“Announcement 已展示”事实；但当天第一次进入触达机会已经结束。关闭其他弹层后不得立即连续强制补弹，当天第二次、第三次进入也不补弹。

## 8. 公告普通编辑与新一轮触达

普通编辑现有 Announcement 的标题、正文、周期、排序等，不重置客户当天已经产生的自动展示事实。

客户当天尚未进入时，第一次进入读取当时最新有效内容。

V1 不建设独立“重新发布并重置触达”动作。需要新一轮运营触达时，新建新的 Announcement；新公告仍受客户每日全局最多 1 条主动公告约束。

## 9. Banner placement 与数量投影

V1 正式 placement 只有：

- `HOME_TOP`；
- `VEHICLE_DETAIL`。

`VEHICLE_DETAIL` 是所有合法车辆详情页固定具备的广告位能力，不由单车字段决定是否存在。无有效 Banner 时只是不渲染具体广告内容。

同一 placement 当前有效 Banner：

- 0 条：不渲染具体广告内容；
- 1 条：单图；
- 2～5 条：轮播；
- >5 条：按后台有效排序取前 5。

## 10. Banner target

Banner target 可以为空；为空时仍是合法纯展示 Banner。

若配置 target，只允许当前存在、合法、内部白名单的小程序页面 / 业务对象。V1 不开放任意外链或任意 Page ID。

保存 / 启用时必须重新校验 target。Banner 已合法启用后，如果 target 后续失效，Banner 不删除，退化为纯展示且不得点击跳转。

Banner 点击只是导航入口，不授予权限，不创建 Recommendation / Consultation / Lock / Transaction，也不得绕过 Customer Safe Projection。

## 11. Banner 停用、再启用与排序

Banner 停用只移出当前有效展示集合，不删除对象、配置和历史；允许再次启用。

再启用提交时必须重新校验 current identity + permission/capability + data scope + placement + target + schedule + object/config state。

已过结束日期的 Banner 如需再次展示，必须先形成新的合法有效排期。

排序只控制同一 placement 内当前有效 Banner 的展示顺序，不修改 placement、target、schedule 或业务对象状态。

## 12. 权限、追溯与 PDM-25

公告 / Banner 所有写操作提交时重验 current identity + explicit permission/capability + data scope + object/config state。

System Admin 身份本身不自动获得运营配置权，4S 身份也不自动获得名邦运营配置能力。

公告 / Banner 的重要配置变更必须可追溯。统一 before / after / actor / time、历史与时区标准交由 PDM-25 承接。

`HO-P24-P25-001 = HANDOFF_OPEN`，PDM-25 不得反向改变 PDM-24 已冻结的产品语义。

## 13. 明确不得恢复

不得恢复：

1. 客户端第四个“消息”Tab / 泛化消息中心；
2. Announcement read/unread 主状态机；
3. 关闭弹层 = 已读；
4. VEHICLE_DETAIL 广告位能力可有可无；
5. 任意 / 通用 placement；
6. Banner 广告计费、CPC/CPM、定向、推荐、归因平台；
7. 任意外链 / 任意目标字符串；
8. 失效 target 继续跳转；
9. target 为空就不能展示；
10. 连续强制多个主动弹层；
11. Announcement 自动升级为微信 / 飞书 / App / PC Push；
12. Banner 点击直接授权或创建业务对象；
13. “仅首次一次 / 每天一次 / 不自动弹”三档频率模式。

## 14. Handoff 与 Final Closeout

`HO-P20-P24-001` 已在本次 Final Closeout 中正式：

> `HANDOFF_CLOSED / target=PDM-24 Final / source_backwrite=YES`

PDM-20 中旧“Vehicle Detail Banner 可选，不强制每车显示”的来源表述已完成 source backwrite：当前 Authority 为 P24-R01——详情页广告位能力固定存在，无有效 Banner 时只是不显示具体广告内容。

`HO-P24-P25-001` 继续 `HANDOFF_OPEN`。

## 15. Final 完整性

- `SOURCE_TO_FINAL = PASS`
- `FINAL_TO_SOURCE = PASS`
- `SEMANTIC_COMPLETENESS = PASS`
- `MISSING_RULE_UNRESOLVED = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `OUTGOING_HANDOFF_GAP = 0`
- `NEGATIVE_CLAIMS_VERIFIED = PASS`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM24_FORMAL_UNITS = 40`

## 16. 最终状态

用户已最终批准，并明确“确定执行”。

- 正式 Authority：`07_重建工作区/PDM-24_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-24_最终完整性复核_2026-10-07.md / PASS`；
- PDM-24：`COMPLETE / INTEGRITY_PASS`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：`PDM-25 Startup Gate`。
