# PDM-07｜车辆档案 / 车况 / 客户可见报告 / 成交交付材料核验｜最终完整规则

> 日期：2026-09-24  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> 说明：汇总 PDM-07 Batch 1～4 经用户逐批裁决并经最终总览批准后的正式当前规则；2026-10-05 已完成 Legacy Final Integrity Audit，并同步 PDM-08 已完成的报告 / 档案资源承载。  
> IA / Low-Fi 仅登记 `STALE_CARRIER`，统一延后到 PDM-25 完成并通过 PDM-01～25 全局最终总复核后集中对齐。

---

## 1. 原始敏感档案默认内部可见

以下原始敏感车辆资料默认仅内部可见，包括但不限于：

- 行驶证；
- 绿本；
- 保单；
- 完整 VIN；
- 其他含敏感身份 / 权属信息的原始资料。

内部已上传：

> 不等于客户可直接查看原件。

---

## 2. 客户可见档案 / 报告

客户侧只展示：

> **明确允许客户查看的档案、报告、检测结果、摘要或结论。**

可包括：

- 第三方检测报告；
- 维保摘要；
- 车况结论；
- 其他允许公开的报告 / 结果。

完整 VIN 和未明确允许公开的敏感原件：

> 始终不向客户展示。

若当前 Vehicle 没有任何客户可见档案 / 报告：

> 客户端整个档案 / 报告模块隐藏，不显示“暂无资料”空壳。

---

## 3. 档案允许后补

人工车辆正式发布时：

> 不要求所有车辆档案一次性齐全。

可后补包括：

- 行驶证；
- 绿本；
- 出险记录；
- 4S 维保；
- 第三方检测；
- 保单；
- 车况核验；
- 其他车辆资料。

档案不完整：

> 不得把人工车辆长期卡在草稿或阻塞正常前段销售业务。

---

## 4. 档案不完整的业务边界

在其他业务条件满足时，档案不完整仍允许：

- 正式发布；
- 客户浏览；
- Consultation；
- Recommendation；
- Lock；
- Waitlist；
- 创建 Transaction。

不得恢复：

> “档案没补齐就阻塞发布 / 咨询 / 推荐 / 锁车 / 创建 Transaction”

的旧方向。

---

## 5. 成交 / 交付前必要资料核验

真正完成成交 / 交付前：

> 必须通过本笔 Transaction 所需必要车辆资料核验。

缺必要资料时：

- 可以保留已经创建的 Transaction；
- 可以继续补资料；
- 但不得完成 Transaction / 交付闭环。

不得把“缺必要材料”扩大为：

> 不允许创建 Transaction。

---

## 6. 成交 / 交付 required-field set

成交 / 交付必要资料清单：

> **后台可配置，不在代码或产品基线中写死一套全国统一清单。**

规则：

- 配置由具备明确“员工业务配置”能力的人员执行；
- System Admin 身份本身不自动获得该业务配置能力；
- 配置变化必须留审计；
- Transaction 完成时读取当时有效 required-field set；
- 返回当前缺失项；
- 缺失只阻止完成，不影响已创建 Transaction。

---

## 7. 档案跟 Vehicle 走

车辆档案属于 Vehicle 业务历史，不属于某个员工个人。

负责人 / 管理责任发生变化时：

- 已上传档案不删除；
- 新的有权限车辆管理人员可继续补齐、核验和维护；
- 原上传人保留；
- 原上传时间保留；
- 历史修改事实保留。

---

## 8. VIN / 原始档案内部查看权限

VIN / 原始敏感档案：

> 不再建立独立“VIN 查看权限 / 原始档案查看权限”。

名邦员工只要同时满足：

- 对该 Vehicle 具有有效编辑 / 管理能力；
- Vehicle 位于其数据范围内；

即可从内部管理入口查看和维护对应档案。

4S 成员：

> 只在自己有权管理的 4S Vehicle 范围内查看 / 维护对应档案。

取消独立权限：

> 不等于取消身份、数据范围、对象状态和车辆管理权限校验。

---

## 9. 内部档案事实与客户可见性分离

一份档案作为内部事实存在：

> 与客户是否可见是两个不同维度。

设置 / 取消客户可见：

- 不删除内部原始档案；
- 不改写原始上传事实；
- 不抹除历史。

敏感证件：

> 不进入普通车辆图片轮播。

---

## 10. 单份档案客户可见规则

档案类型分为：

### 10.1 固定仅内部

包括：

- 完整 VIN；
- 行驶证；
- 绿本；
- 保单；
- 其他明确认定为敏感原件的档案。

这些类型：

> 不允许通过“客户可见”设置直接向客户公开原件。

### 10.2 可对客报告 / 结果

允许公开的报告、检测结果、摘要、结论：

> 上传 / 维护时可以选择“客户可见 / 仅内部”。

操作者必须：

- 对 Vehicle 有当前管理能力；
- Vehicle 在其数据范围内；
- 4S 成员仅限自己有权管理的 4S Vehicle。

客户可见状态变化：

> 必须审计。

---

## 11. JYT 车况来源

批发车车况以：

- JYT 原始车况描述；
- JYT 原始车况标签；

作为主要来源事实。

不要求销售：

> 为批发车重新录入一套重复车况。

JYT 返回的原始车况描述和标签：

- 原样保留；
- 允许展示；
- 保留来源 provenance。

---

## 12. JYT 车况标签

历史已明确存在：

> `sub.tags`

展示位置：

> 车况区域，位于 `description` 上方。

来源规则：

- JYT source tags 保留 JYT provenance；
- 人工选择标签保留 manual provenance；
- 人工标签不得提升为“名邦已检测 / 名邦已认证”事实。

---

## 13. 车况用于筛选 / Matching

JYT 原始车况描述与标签可以作为：

> 确定性筛选 / Matching 的输入。

规则：

- 上游已有可直接使用的标签 / 字段 → 优先直接映射；
- 需要标准化时，只派生 Matching 真正需要的标准车况事实；
- 原始 Source Data 永远保留；
- 派生字段不得覆盖原始事实；
- 无法确定 → 保持 `unknown` / `confirmation_needed`；
- 禁止猜测。

本域不强制：

> 机械恢复旧版全部固定车况字段。

---

## 14. 名邦 / 4S 人工车况

名邦 / 4S 人工车源：

> 展示员工维护的真实车况信息。

人工维护车况：

- 必须保留人工来源；
- 不得伪装成 JYT 上游事实；
- 不得伪装成第三方检测事实。

无车况数据时：

> 整个车况模块隐藏。

---

## 15. 名邦真实检测结果

名邦真实完成的检测结果：

> 作为独立检测 / 档案事实管理。

不得与：

- JYT 上游描述；
- JYT 标签；
- 普通人工车况备注；

混成同一种来源。

只有名邦真实完成对应检测 / 服务时，才能使用：

- 名邦检测；
- 名邦认证；
- 名邦质保；

等真实业务表述。

---

## 16. 档案维护操作链

对当前有 Vehicle 编辑 / 管理能力且在数据范围内的员工，车辆档案至少支持：

- 上传 / 新增档案；
- 后补档案；
- 更新 / 替换档案；
- 查看内部原始档案；
- 查看档案历史；
- 执行档案核验。

4S 成员：

> 仍只在自己有权管理的 4S Vehicle 范围内执行。

档案维护：

> 不自动改变客户可见性。

---

## 17. 错误档案处理

正式上传成功的档案：

> 不提供普通物理删除。

如果档案录错：

- 可以作废；
- 可以上传新版本替代；
- 作废后不参与当前核验；
- 作废后不参与客户展示；
- 原文件记录保留；
- 原上传人、上传时间保留；
- 作废人、作废时间保留；
- 适用时保留原因；
- 新旧版本关系保留。

尚未真正提交 / 上传成功的本地临时选择：

> 不构成正式档案事实。

---

## 18. 档案审计

至少覆盖：

- 档案新增；
- 档案更新 / 替换；
- 档案作废；
- 档案核验；
- 客户可见性调整；
- 重要档案修改。

至少能够追溯：

- actor；
- time；
- Vehicle / 档案对象；
- 操作结果；
- 适用时 before / after；
- 适用时原因。

具体 audit table / event name：

> 留工程阶段定义。

---

## 19. 明确 DO_NOT_RESTORE

不得恢复：

1. 档案未补齐就阻塞正式发布；
2. 档案未补齐就阻塞 Consultation / Recommendation / Lock / Waitlist / 创建 Transaction；
3. 内部上传敏感原件后默认直接展示给客户；
4. 独立“VIN 查看权限 / 原始车辆档案查看权限”；
5. 把 JYT 上游描述 / 标签包装成名邦检测 / 认证 / 质保；
6. 把来源未知或无法确定的车况事实靠猜测补成符合 / 不符合；
7. 把已经正式上传的档案通过普通物理删除抹掉历史。

---

## 20. Cross-PDM 承接状态

### 20.1 PDM-06｜人工发布边界｜HANDOFF_CLOSED

PDM-06 已正式冻结：

- 人工车辆发布最低字段；
- 图片 / 价格 / VIN 的发布硬门槛；
- VIN 精确重复 Gate；
- 草稿 / 正式 Vehicle；
- source_type；
- 正式 Vehicle 不普通物理删除。

PDM-07 不重新定义这些规则。

车辆档案：

> 不是人工车辆正式发布硬门槛。

状态：

> `HO-P06-P07-001 = HANDOFF_CLOSED`

### 20.2 PDM-08｜报告 / 档案资源承载｜HANDOFF_CLOSED

PDM-08 已完成本域后续的图片 / CDN / H5 资源承载，当前正式结果回写如下：

- 名邦 / 4S 自上传的报告、档案图片直接进入名邦自有对象存储，DB 保存 object_key / path 等引用；
- 出险记录图片属于报告 / 档案资源，不自动进入普通车辆相册；
- 4S 维保图片作为维保报告图片处理，不进入普通车辆相册；
- 4S 维保 H5 可保存上游完整 URL 作为原始报告来源事实，但客户端不得直接暴露上游 H5 域名，对外通过名邦可控报告域名映射输出；
- 报告 / 档案资源与普通车辆相册是两个业务集合，即使共用 CDN / 回源基础设施也不得混为一套图片集合；
- CDN / 对象存储 / 回源方式只决定技术承载，不决定客户是否可见；
- 报告 / 档案客户可见性仍唯一服从本 PDM 的 `customer_visible`、敏感原件与客户端可见性规则。

状态：

> `HO-P07-P08-001 = HANDOFF_CLOSED / source_backwrite = YES`

### 20.3 后续业务域必须继承的 Guard

PDM-07 已冻结的车况 / 档案边界必须由后续业务域继续承接：

- PDM-12｜`HANDOFF_CLOSED`：PDM-12 Final §§15-16 已正式承接——Matching 保留 JYT 原始车况描述/标签及 provenance，只做必要确定性标准化；证据优先级为结构化事实 > 明确检测 > 详细车况描述 > 模糊关键词；无法确定保持 unknown / confirmation_needed，禁止猜测；
- PDM-13｜`HANDOFF_CLOSED`：PDM-13 Final §§4-6,14 已承接——Priority 只消费 PDM-12 当前合法 Match Result，不复制 Matching、不篡改 JYT / manual / Mingbang provenance，不把 unknown / confirmation_needed 猜成 high/acceptable；Match tier 降级时按当前真实事实立即重评；
- PDM-14｜`HANDOFF_CLOSED`：PDM-14 Final 已正式承接——档案/报告不完整本身不得阻止合法 Recommendation；Recommendation/visibility 只授 Customer Safe Projection，不自动开放 VIN、绿本、行驶证敏感原件或内部档案；客户报告仍服从本 PDM customer_visible；`HO-P07-P14-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-15｜`HANDOFF_CLOSED`：PDM-15 Final 已正式承接“档案/检测报告/维保资料不完整本身不得阻止 Consultation”，仅真实 offline/unavailable 阻断新增 Consultation；`HO-P07-P15-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-18｜`HANDOFF_CLOSED`：PDM-18 Final 已正式承接“档案不完整本身不得阻止合法 Lock / Waitlist”，并明确既有档案/报告历史不因 Lock 状态变化被删除或重写；`HO-P07-P18-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-19｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-19 Final 已正式承接“档案不完整不阻止合法 Transaction 创建；首次真正 completion/delivery 时读取当时有效 required-field set，缺失只阻止完成、不回滚已创建 Transaction”；`HO-P07-P19-001 = HANDOFF_CLOSED / source_backwrite=YES`。

PDM-12 承接状态：

> `HO-P07-P12-001 = HANDOFF_CLOSED / target=PDM-12 Final §§15-16 / source_backwrite=YES`

### 20.4 客户端 / 员工端 / PC / 审计承接

- PDM-20｜`HANDOFF_CLOSED`：PDM-20 Final 已正式承接 customer_visible 档案/报告、无可见资料整块隐藏、VIN/敏感原件禁止下发，以及 JYT/人工/名邦真实检测 provenance 的 Customer Safe Projection；`HO-P07-P20-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-21｜`HANDOFF_CLOSED`：PDM-21 Final 已正式承接档案上传/后补/替换/作废/历史/核验/customer_visible 与 4S 合法范围投影；`HO-P07-P21-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-22｜`HANDOFF_CLOSED / source_backwrite=YES`：成交/交付 required-field set 的 PC 配置 carrier 已由 PDM-22 Final 承接；System Admin 身份本身仍不自动获得该业务配置权；
- PDM-25｜`HANDOFF_CLOSED / source_backwrite=YES`：archive create/update/replace/void/verify、customer visibility before/after、required-field config change、上传人/时间、新旧版本关系等统一审计与历史留存标准。

统一登记：

> `07_重建工作区/CROSS_PDM_HANDOFF_REGISTER.md`

### 20.5 IA / Low-Fi stale carrier

本轮确认但当前不修改的旧承载至少包括：

- Current / Low-Fi 基本只剩 `P07-04 校验交易/交付材料`，缺档案上传 / 后补 / 更新 / 替换完整操作链；
- 缺正式档案作废 / 新版本替代 / 档案历史；
- 缺单份档案 `customer_visible` 设置 / 取消动作；
- 客户端缺“无客户可见资料时整块隐藏”的完整投影；
- JYT / manual / Mingbang真实检测 provenance 区分承载不完整；
- 4S 本人有权 Vehicle 的内部档案访问路径可能仍受旧 Internal Mode 整体 DENY 污染；
- Vehicle Archive 专属 audit carrier 不完整。

统一登记：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

这些 carrier 不具有产品 Authority，不得反向覆盖本 Final。

---

## 21. 最终状态

PDM-07 Batch 1～4 与最终完整规则总览均已完成用户明确批准。

2026-10-05 Legacy Final Integrity Audit 关闭 4 组问题：PDM-08 报告/档案资源承载反向闭环、PDM-12/13/14/15/18/19 业务 handoff 登记、PDM-20/21/22/25 页面/配置/审计 handoff 登记，以及 IA / Low-Fi stale carrier ledger。

本轮未发现需要重新产品裁决的新语义；历史结构化车况整套字段不恢复，继续执行 P07-B4-01 已批准的“保留来源事实 + 只做 Matching 必要确定性标准化”方案。

当前状态：

> **`COMPLETE / INTEGRITY_PASS`**

```text
MISSING_RULE_UNRESOLVED = 0
SEMANTIC_DETAIL_GAP_UNRESOLVED = 0
CROSS_PDM_CONFLICT = 0
HANDOFF_GAP_UNRESOLVED = 0
GLOBAL_INVARIANT_CONFLICT = 0
SOURCE_DECISION_COVERAGE = 100%
FINAL_TO_SOURCE_TRACEABILITY = 100%
SEMANTIC_INTEGRITY = PASS
NEGATIVE_CLAIMS_VERIFIED = PASS
IMPLEMENTATION_READY = PASS
HANDOFF_REGISTER_SYNC = PASS
```

本文件作为 PDM-07 当前正式规则。后续 PDM 可以补充各自业务域，但不得静默推翻本文件已确认规则；若发现真实跨域冲突，必须重新显式提交用户裁决。

下一审计域进入：

> **PDM-08｜Legacy Final Integrity Audit**

> 2026-10-07 Source Backwrite：对应 PDM-22 handoff 已由 `07_重建工作区/PDM-22_最终完整规则.md` 正式承接；以 CROSS_PDM_HANDOFF_REGISTER 的 `HANDOFF_CLOSED / source_backwrite=YES` 为准。


> 2026-10-07 Source Backwrite｜HO-P07-P25-001：`HANDOFF_CLOSED / source_backwrite=YES`。PDM-25 已由 `07_重建工作区/PDM-25_最终完整规则.md` 正式承接本域移交的审计 / 历史 / 时区 / 配置版本 / 横切完整性语义；PDM-25 不反向改写本 PDM 已冻结的业务状态机与产品规则。
