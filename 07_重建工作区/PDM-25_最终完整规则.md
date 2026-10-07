# PDM-25｜最终完整规则

> 域：审计 / 历史 / 时区 / 配置版本 / 终态 / 横切完整性  
> 当前状态：`COMPLETE / INTEGRITY_PASS`  
> Final 完整性：`PASS`  
> 正式规则 / 用户裁决单元：`37`

## 1. 核心定位

PDM-25 是全项目 Audit / History / business-time / configuration-version / terminal-truth / cross-cutting integrity 的唯一横切产品 Authority。

它不建立第二套 Customer、Vehicle、Demand、Matching、Priority、Recommendation、Consultation、CRM、Public Pool、Lock、Transaction、Notification、Announcement 等业务状态机。

## 2. Audit / History 基础合同

统一审计入口只读，合法用户可查询、筛选、查看详情和必要关联。

普通业务后台不得修改、覆盖或删除真实审计事件。纠错通过 correction / void / replacement / new fact 表达，原历史保留。

重要 mutation 至少能表达：
- time；
- human/system actor；
- 当时 identity / role context；
- domain / object；
- action；
- before / after；
- result；
- 来源域要求时的 reason / note；
- related IDs / source context。

普通浏览、页面打开和无风险展示不强制升级为高等级 Audit Event。

## 3. 权限与敏感信息

审计/历史不是权限旁路。

查看详情继续服从 current identity、permission/capability、data scope、account/object state 与来源 hard DENY。

Token/Secret 不记录完整明文；手机号、上游电话、内部价、资金与敏感身份资料按 current permission + scope 最小展示。

copy-before-view：没有查看权就没有复制权；复制动作不能绕过字段权限。

## 4. Current 与 Historical 分离

Current Projection 可以变化；Historical Fact 不因当前状态变化被重写成“从未发生”。

后续调店、升降职、scope/permission 变化、inactive/复职，不回写旧事件当时的 role / store / scope / responsibility context。

stable employee_id 用于长期关联，但历史仍保留动作发生时身份上下文。

## 5. 配置、版本与 snapshot

重要配置变化保留 before / after / actor / time。

配置继续归属来源业务域，不建设万能杂项配置中心。

来源域已定义 version 模型时，区分 draft / inactive / current / historical version。失败版本不得替换 current；新版本生效后旧版本退出 current 但历史保留。

新配置默认不追改已固化 Lock deadline、SLA deadline、price/entitlement/conversion/Priority/Transaction/Refund 等历史 snapshot，除非来源 Final 明确规定动态读取。

## 6. 时间与 UTC+8

业务自然日统一按 Asia/Shanghai（UTC+8）解释。

UTC+8 统一“当天/每日/跨日”边界与业务展示，不把不同时间事实合并：
- source time；
- received / first_seen / processed；
- created；
- expires/deadline；
- planned / actual；
- actual display。

系统正式 mutation / Audit Event 以可信后台/服务端事实为 Authority；客户端本地时钟不是最终 Authority。

## 7. 失败、重试、幂等与批量

FAILED / SKIPPED / DEDUPED / no-result 等不得伪装成业务成功。

同一实际 mutation 的 duplicate click / network retry / worker retry 只能形成与真实结果一致的一次正式成功业务事实；attempt 可以多次，但 success 不能伪造多次。

来源域允许批量 mutation 时，每对象独立 Guard、独立 result；来源允许 partial success 时，成功项不因其他失败整体回滚，retry 只处理未闭环对象。

PDM-25 不因此给 Lock/Waitlist 等来源域未允许批量 mutation 的对象新增批量能力。

## 8. 组合入口与 cross-object correlation

UI 可以提供组合入口，但不同 domain action 必须分别 Guard、执行、记录 result 和 history。

可以通过 related IDs / correlation 关联 LockRequest→Lock、Lock conflict→Waitlist、Notification→business event 等事实。

关联不等于共享状态机，也不等于互相授予 permission。

## 9. Customer Safe Projection

权限、visibility、Customer/account/object state 变化后，旧敏感 UI 和已经返回的受保护字段都必须撤销。

Customer Safe Projection 必须按字段级安全矩阵验证，不能只验证页面按钮。

Historical Detail 继续只读；query / scroll context restore 属 PDM-20 客户端体验事实，PDM-25 不重建 UI 状态机。

## 10. Internal Mode 与高风险 Employee Action

Internal Mode 是临时 session，不是永久权限状态。

PDM-21 已批准：
- 连续后台 ≥5 分钟 → 退出 Internal Mode，恢复 Customer Safe View；
- <5 分钟返回 → 仍重新校验 current identity / permission / scope / object state；
- 离开详情、切车、重新打开、分享/推荐或权限变化 → 按来源规则恢复安全视图或重验；
- 权限撤销后旧 Internal Mode 页面立即失效。

来源域要求审计的高风险员工动作，应保留必要 entry_context + actor/time/before/after/result/failure。

entry_context 只说明合法入口，不授予 permission。

## 11. Business History 与 Technical Log retention

来源 Final 明确要求永久保留 / 不物理删除 / append-only 的业务历史，继续保持产品级永久真实性。

PDM-25 不规定全局统一 180 天、1 年、3 年或永久等 Audit Log 固定保存期，也不要求全部永久热存储。

技术日志、运行日志、冷热分层和归档策略留 Engineering / 合规，但不得破坏来源域要求长期存在的业务历史与可追溯关系。

## 12. 权限撤销后的旧载体

旧页面、旧 session、旧 deep-link、旧敏感 payload、旧 Internal Mode、历史复制载体都不能成为永久授权票据。

敏感 mutation 提交时必须重新执行来源域 current Guard。

## 13. 明确不得恢复

不得恢复：
1. Customer Merge；
2. 独立 Recommendation qualification / P06-06；
3. 独立“调价” Action / permission；
4. 独立 `can_call_wholesale_phone`；
5. Announcement 旧三档 frequency；
6. republish-reset touch 模型；
7. “VEHICLE_DETAIL Banner 可有可无”的旧语义；
8. Audit reason 全局强制必填；
9. 旧 audit object list 作为业务能力复活清单；
10. 通过 audit/history 绕过 current permission；
11. 用 retry / duplicate 伪造多次业务成功；
12. 把技术日志 retention 当成删除永久业务历史的依据。

## 14. Engineering 边界

PDM-25 只冻结产品结果，不冻结：
- DB / table schema；
- index / unique index；
- MQ；
- distributed lock；
- transaction framework；
- retry count / backoff；
- log engine；
- timestamp 物理存储格式；
- technical-log retention implementation。

## 15. Handoff 状态

target=PDM-25 的 24 条 incoming handoff 均已在产品语义上明确 landing。

当前仍保持：

> **24 / 24 = HANDOFF_CLOSED / source_backwrite=YES**

24 条 incoming handoff 已在 Final Closeout 中关闭并完成 source backwrite。

## 16. Final 前完整性结果

- `SOURCE_TO_ATOM = PASS`
- `ATOM_TO_SOURCE = PASS`
- `SOURCE_DECISION_COVERAGE = 100%`
- `UNMAPPED = 0`
- `FINAL_TO_SOURCE_TRACEABILITY = 100%`
- `SEMANTIC_COMPLETENESS = PASS`
- `MISSING_RULE_UNRESOLVED = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`
- `GLOBAL_INVARIANT_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `NEGATIVE_CLAIMS_VERIFIED = PASS`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `IMPLEMENTATION_READY = PASS`
- `PDM25_FORMAL_UNITS = 37`
- `PDM25_FINAL_CANDIDATE_READY = YES`

## 17. Final Closeout

- 用户已最终批准 PDM-25 Final Domain Overview；
- 用户随后明确“确定执行”；
- 正式 Authority：`07_重建工作区/PDM-25_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-25_最终完整性复核_2026-10-07.md / PASS`；
- 37 个正式规则 / 用户裁决单元全部进入 Final；
- 24 / 24 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- 来源 PDM-01～24 Final 与 Integrity 均已反向回写；
- PDM-25：`COMPLETE / INTEGRITY_PASS`；
- IA / Low-Fi / Engineering 未施工；
- 历史阶段下一步（HISTORICAL_AUDIT_TRAIL，当时）：**PDM-01～25 全局 Cross-PDM / Handoff / Global Invariant 最终总复核。**
