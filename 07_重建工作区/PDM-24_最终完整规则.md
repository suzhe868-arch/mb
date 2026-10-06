# PDM-24｜最终完整规则

> 域：公告 / Banner / 运营位 / 客户触达  
> 当前状态：COMPLETE / INTEGRITY_PASS  
> Final 前完整性复核：R2 PASS / FINAL_CANDIDATE_READY  
> 正式规则 / 用户裁决单元：40

## 1. 核心定位

PDM-24 是 Announcement（客户公告）与 Banner / Placement 运营生命周期的唯一产品 Authority。

负责：
- Announcement 创建、编辑、启停、排期、生效、结束、排序、active/history 与主动弹层频控；
- Banner 创建、编辑、启停、排期、placement、排序与合法 target；
- 客户展示相关运营配置事实及必要追溯。

不重新定义 Customer、Vehicle、Customer Safe Projection、Notification、飞书、DND、Incident、跨域 Audit、IA / Low-Fi 或 Engineering。

Announcement 与 Banner 是两个独立对象，不合并为通用 Message / Campaign，也不建设万能营销平台。

## 2. Announcement 管理与生命周期

Announcement 至少支持：列表、新建、编辑、标题、正文、启用/停用、生效开始日期、结束日期、自动弹出开关、排序、创建人、修改人、创建/修改时间。

V1 至少按“年-月-日”设置有效周期。开始日期不得晚于结束日期，无效周期不得启用。生命周期至少可表达 draft / scheduled / active / ended。

客户端只保留：
- 当前 active 公告；
- history 公告。

不建设通用消息中心，不建设 read / unread 主状态机。关闭公告弹层只结束本次展示，不改变 Announcement 生命周期。

公告到期或人工停用后退出 active 并进入 history，不物理删除。人工停用后如果仍处于合法有效周期，可重新启用；已经过期则必须先设置新的合法有效周期。

auto-popup OFF 不等于 Announcement 停用；合法 active 公告仍可由客户主动查看。

## 3. UTC+8 与每日主动弹层

Announcement 的开始日期、结束日期、“当天”、“每日”和“当天第一次进入”统一按 Asia/Shanghai（UTC+8）业务自然日解释，以后台统一业务时区为 Authority，不以客户设备本地时区决定跨日。

结束日期当天仍有效。

最终频控：

> 同一 Customer 在同一 UTC+8 业务自然日内，Announcement 主动弹层全局最多实际展示 1 条。

不是“每个 Announcement 各自每天一次”。

只有“已启用 + 当前有效周期 + auto-popup ON”的 Announcement 才进入候选。

历史“仅首次一次 / 每天一次 / 不自动弹”三档频率模式正式废弃；“不自动弹”由独立 auto-popup 开关承担。

## 4. 当天第一次进入、多公告与其他弹层

触发机会固定为 Customer 当天第一次进入 / 打开小程序。

多条有效候选同时存在时：
- 按后台当前有效排序择一；
- 只自动展示 1 条；
- 不连续展示第二、第三条；
- 当天后续再次进入不补弹其他 Announcement。

第二天重新获得当天第一次进入机会。客户主动进入公告入口查看不受每日自动弹层上限限制。

Announcement 与头像/昵称完善等其他合法主动弹层同时命中时，同一时刻只展示一个。

采用 3A：
- 如果当天第一次进入最终由其他主动弹层占用，Announcement 当天不再补弹；
- Announcement 未真正展示时，不写“已展示”事实；
- 但当天第一次进入触达机会已经结束；
- 关闭其他弹层后不得立即连续补弹；
- 当天第二次、第三次进入也不补弹。

## 5. Announcement 普通编辑与新一轮触达

普通编辑同一个 Announcement 的标题、正文、周期、排序等，不重置客户当天已经产生的自动展示事实。

客户当天尚未进入时，第一次进入读取当时最新有效内容。

V1 不建设“重新发布并重置触达”动作。需要新一轮触达时，新建新的 Announcement。新 Announcement 仍受同一 Customer 每日全局最多 1 条主动公告约束。

## 6. Banner placement

V1 正式 placement 只有：
- HOME_TOP；
- VEHICLE_DETAIL。

新增 placement 必须重新获得产品 Authority。

VEHICLE_DETAIL 是所有合法车辆详情页固定具备的广告位能力，不由单车字段决定是否存在。

无有效 Banner 时只是不渲染具体广告内容，不代表详情页没有广告位能力。

同一 placement 当前有效 Banner：
- 0 条：不渲染具体广告内容；
- 1 条：单图；
- 2～5 条：轮播；
- >5 条：按后台当前有效排序取前 5。

客户端数量投影继续服从 PDM-20 Customer Safe Projection。

## 7. Banner 管理与 target

Banner 至少支持：placement、图片、标题/必要说明、启用/停用、生效时间、结束时间、排序、可选合法 target、创建/修改记录。

排序只改变同一 placement 中当前有效 Banner 的展示顺序，不修改 target、placement、schedule 或业务对象状态。

target 可以为空；为空时 Banner 仍可正常展示，作为纯展示 Banner。

若配置 target，只允许当前存在、合法、内部白名单的小程序页面 / 业务对象。V1 不开放任意外链或任意 Page ID。

保存 / 启用时必须重新校验 target。

已合法启用的 Banner，如果 target 后续失效：
- Banner 不删除；
- 可以继续纯展示；
- 不允许继续点击跳转；
- 不得通过旧 target 绕过 Customer Safe Navigation 或对象 Guard。

## 8. Banner 停用与再启用

Banner 停用只移出当前有效展示集合，不物理删除对象、配置和历史。

停用后允许再次启用。再启用时必须重新校验：
current identity + explicit permission/capability + data scope + placement + target + schedule + object/config state。

已超过结束日期的 Banner，如需再次展示，必须先形成新的合法有效排期。

Banner 不复制 Announcement 的 active/history 客户端状态机。

## 9. 权限与追溯

Announcement / Banner 所有写操作提交时必须重验：
current identity + explicit permission/capability + data scope + object/config state。

System Admin 身份本身不自动获得运营配置权；4S 身份也不自动获得名邦运营配置能力。

重要运营变更必须可追溯。统一 before / after / actor / time、history 与 timezone 标准由 PDM-25 承接。

PDM-24 不另建第二套跨域 Audit Authority。

## 10. 明确边界

Banner 点击只是导航入口，不授予新权限，不创建 Recommendation、Consultation、Lock、Transaction，也不得改写 Vehicle / Customer / owner / visibility 等业务事实。

Announcement 不自动映射为微信订阅消息、飞书消息、App Push 或 PC Push。

V1 不建设：
- 通用客户消息中心；
- Announcement read/unread 主状态机；
- 任意 placement；
- 任意外链；
- 广告计费 / CPC / CPM；
- 定向广告 / 推荐广告 / 完整归因平台；
- 通用 Campaign Engine；
- 连续强制多个主动弹层。

## 11. Cross-PDM Handoff

Incoming：
HO-P20-P24-001 在本次 Final Closeout 中正式关闭：

> HANDOFF_CLOSED / target=PDM-24 Final / source_backwrite=YES

PDM-20 的客户端数量投影、Customer Safe Projection 与导航 Guard 继续有效。

Outgoing：
HO-P24-P25-001 = HANDOFF_OPEN。

PDM-25 承接 Announcement / Banner 配置变化、每日展示事实、before / after / actor / time、history、timezone 等统一审计标准，不得反向改变 PDM-24 产品语义。

## 12. 正式单元

40 个正式规则 / 裁决单元：
- P24-R00～P24-R01：2；
- P24-A01～P24-A15：15；
- P24-B2-01～P24-B2-12：12；
- P24-B4-01～P24-B4-07：7；
- P24-LIA-01～P24-LIA-04：4。

Batch 3 = NO_NEW_ATOMS / PASS，不增加正式单元。

## 13. Final Integrity

- SOURCE_TO_FINAL = PASS
- FINAL_TO_SOURCE = PASS
- SEMANTIC_COMPLETENESS = PASS
- MISSING_RULE_UNRESOLVED = 0
- SEMANTIC_DETAIL_GAP_UNRESOLVED = 0
- COMPLETED_PDM_INVARIANT_CONFLICT = 0
- INCOMING_HANDOFF_GAP = 0
- OUTGOING_HANDOFF_GAP = 0
- NEGATIVE_CLAIMS_VERIFIED = PASS
- LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0
- PDM24_FORMAL_UNITS = 40

## 14. Final Closeout

用户已最终批准并明确“确定执行”。

- 正式 Authority：07_重建工作区/PDM-24_最终完整规则.md；
- Final 前完整性复核 R2：PASS / FINAL_CANDIDATE_READY；
- Final Integrity：07_重建工作区/PDM-24_最终完整性复核_2026-10-07.md / PASS；
- HO-P20-P24-001 = HANDOFF_CLOSED / source_backwrite=YES；
- HO-P24-P25-001 = HANDOFF_OPEN；
- PDM-24 = COMPLETE / INTEGRITY_PASS；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：PDM-25 Startup Gate。
