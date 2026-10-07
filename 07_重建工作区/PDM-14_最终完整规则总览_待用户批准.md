> **HISTORICAL_AUDIT_TRAIL｜历史执行记录**  
> 本文件记录当时阶段性审查 / 待批准 / 覆盖检查 / 切窗状态。文中的“当前 / 下一步 / PENDING / BLOCKED / Startup Gate / Batch”等阶段表述均只代表当时，不是仓库当前状态。  
> 当前状态与唯一下一步以根目录 `README.md`、`CURRENT_PROJECT_STATE.md`、`NEXT_ACTION.md`、`PROJECT_STATE.json` 为准；不得据本文件恢复旧阶段指针或覆盖正式 Final。

# PDM-14｜Recommendation / 普通分享 / 单车授权 / 隐藏车客户可见性｜最终完整规则总览｜用户已最终批准

> 日期：2026-10-06  
> 状态：`USER_FINAL_APPROVED / APPROVAL_TRACE`  
> Batch 1～4：`ALL_USER_APPROVED`  
> P14-R01～R04：`ALL_USER_APPROVED / APPLIED`  
> P14-LIA-01～10：`ALL_USER_APPROVED / APPLIED`  
> Final 前完整性复核 R2：`PASS / FINAL_CANDIDATE_READY`  
> 未决产品冲突：`0`  
> 用户已于 2026-10-06 对本 Final Domain Overview 明确批准并随后“确定执行”。本文件作为最终批准留痕保存；正式 Authority 另见 `07_重建工作区/PDM-14_最终完整规则.md`。

---

## 1. 本域最终边界

PDM-14 正式负责 Recommendation 正式对象及生命周期、普通分享与 Recommendation 的边界、hidden Vehicle 对特定 Customer 的单车 visibility authorization、Recommendation 与 listing_cycle / find-car entitlement / 价格 / Demand / Matching / Priority / Consultation / Lock / Transaction 的关系，以及 Customer disable/restore、entitlement loss/restore、Priority suppression/restore、历史、价格快照、来源 Demand、批量操作和审计承接。

本域不重新定义 Customer identity/owner、Vehicle/listing_cycle、Vehicle Archive、Price、Customer Level/Demand、Matching、Priority、Consultation、Lock/Waitlist、Transaction、客户端/员工端最终页面、通知与横向审计；分别由 PDM-01/03/04/07/10/11/12/13/15/18/19/20/21/23/25 承接。

---

## 2. Recommendation 是独立正式业务对象

Recommendation 与 Match Result、Priority、普通 Share、visibility grant、Consultation、Lock、Transaction 严格分离。

- high/acceptable Match Result 不自动 Recommendation；
- Priority created 不自动 Recommendation；
- 普通分享不创建 Recommendation；
- Consultation 不创建 Recommendation；
- visibility grant 不是 Recommendation 本体；
- 对象间可以有关联字段用于追溯，但不得合并状态机。

---

## 3. 核心身份、幂等与批量推荐

Recommendation 核心绑定：

> `customer_id + vehicle_id + listing_cycle`

同一 Customer + Vehicle + listing_cycle 已存在 active Recommendation：

- 不重复创建第二条 active Recommendation；
- 重复操作只记录 touch / interaction / audit；
- 不改 recommendation_id、recommender、created_at。

同一 Customer 可以同时拥有多辆 active Recommendation。

批量推荐只允许 UI 批量：底层必须逐 Vehicle 独立 Guard、幂等、create/reuse，并分别保留 recommendation_id、source_demand_id、price snapshot、visibility 与历史。禁止 group Recommendation。

---

## 4. 生命周期与历史

Recommendation 不使用固定 N 天 TTL。

当前作用可因人工 end、创建错误 void、listing_cycle 结束、Vehicle 真实终止状态等合法事实结束；历史始终保留，不物理删除。

Recommendation 创建后至少以下历史事实不可普通编辑：

- customer_id；
- vehicle_id；
- listing_cycle；
- recommender；
- created_at；
- 原始 source Demand；
- 创建时 price snapshot。

创建错误时必须 void/end 原记录并保留历史，再创建正确对象。

同一 listing_cycle 内旧 Recommendation 已 ended/void 后，如当前 Guard 再次合法，可以创建新的 Recommendation。Vehicle 进入新 listing_cycle 后旧 Recommendation 只保留历史，新周期必须重新建立，不继承旧周期 Recommendation/price-right。

---

## 5. recommender、owner 与 Demand responsible 分层

recommender 记录创建当时真正执行正式推荐的合法 Employee，是不可改写历史事实。

以后 Customer owner 变化、Demand responsible 变化、recommender 离职/inactive、正式 handover 均不得回写 historical recommender，也不自动 end/void Recommendation。

Recommendation create/end/void 本身不得改变 Customer owner 或 Demand responsible；后续 mutation 必须读取当前合法业务责任，而不是让历史 recommender 永久保留操作权。

---

## 6. Recommendation 资格

旧独立 Recommendation qualification、`RECOMMENDATION_QUALIFIED / NOT_QUALIFIED`、P06-06 推荐资格开关及仅服务该旧开关的独立资格管理能力全部废弃，不得恢复。

当前正式 Recommendation 资格统一由：

> **Customer Level 当前 `find-car entitlement`**

决定。

Priority qualification 保持独立，只决定 Priority 排他保护，不决定普通 Recommendation。

---

## 7. Recommendation mutation Guard

create/end/void 提交时必须重新检查：

- active、eligible 的名邦 Employee；
- 当前 Customer/source Demand 合法业务责任；
- 对应 permission/capability；
- data scope；
- Customer / Vehicle / listing_cycle / Recommendation 当前状态；
- find-car entitlement；
- active Priority 等其他当前 Guard。

经理/店长/协作身份、System Admin 身份、历史 recommender 都不天然授权。4S Employee 对名邦 Recommendation 业务 hard DENY。

---

## 8. 三类车源

名邦车源、4S 合作车源、JYT 批发车源均可被合法名邦负责销售正式 Recommendation。

4S Employee hard DENY 不等于 4S Vehicle 不可推荐。

只有进入 PDM-10 批发价格保护机制的 Vehicle，Recommendation 才额外产生当前 `customer + vehicle + listing_cycle` 免费批发数字价格查看权；名邦/4S 不会因 Recommendation 凭空变成批发查价对象。

---

## 9. source_demand_id

Recommendation 可关联 0 或 1 个真实 source_demand_id。

- Demand 上下文中 Customer/Demand 已知，不重新选择；
- Customer 详情上下文 Customer 已知，不重新选择；
- 无 Customer 上下文才选 Customer；
- 多 Demand 时必须保存本次真实来源 Demand；
- Recommendation 不反向把 paused/completed/cancelled Demand 激活。

---

## 10. Customer disable / restore

Customer disable 不自动删除、end、void Recommendation，不删除历史、快照或已成立 current-cycle price-right fact；但停用期间禁止新 Recommendation，并暂停依赖 Customer 身份的 Recommendation 客户侧能力，包括 Recommendation-only hidden visibility。

Customer restore 继续原 customer_id；不复活 ended/void/已结束 cycle 对象。仅对恢复时仍 active、同合法 cycle、Vehicle/Customer 当前合法且无其他 Guard 阻断的 Recommendation 重新开放客户侧能力。

---

## 11. find-car entitlement loss / restore

entitlement 有效→无效：

- 禁止新 Recommendation；
- 已有 Recommendation 不删除、不自动 end/void；
- 历史、price snapshot、已成立 current-cycle free price-right 保留；
- Recommendation-only 客户侧能力暂停。

entitlement 无效→有效：

- 不复活 ended/void/old-cycle Recommendation；
- 对仍 active 且当前全部 Guard 合法的对象恢复客户侧能力。

find-car entitlement 与价格 Authority 始终分层。

---

## 12. hidden Vehicle 与 customer-specific visibility

hidden != offline。hidden Vehicle 不进入普通公开浏览，但仍可能真实可售，可参与合法 Matching/Priority/Recommendation。

hidden Vehicle 正式 Recommendation 后，为该 Customer 建立/确保单车 visibility authorization：

- 只属于该 Customer；
- 不改变 Vehicle hidden；
- 不回到公共 Feed；
- 不开放给其他 Customer；
- Priority 本身不能创建该授权。

---

## 13. visible ↔ hidden 动态变化

同一 listing_cycle 内，只要 Recommendation 仍 active：

- 推荐时 hidden → 幂等确保 customer-specific visibility；
- 推荐时 visible，后续 visible→hidden → 自动确保授权生效，不要求重新推荐；
- hidden→visible → 公共 visibility 恢复，但 Recommendation 不结束；
- 同 cycle 再次 hidden → active Recommendation 继续作为授权来源。

Recommendation end/void 只结束由它支撑的 visibility；Lock/Transaction/其他独立 Authority 按各自规则保留。

---

## 14. end / void

当前合法业务责任人可在 permission + data scope + object state 合法时执行。

原 recommender 仅在当前仍有合法身份、责任、permission、scope 时可操作。经理/店长职位本身不授权。

void 表示创建错误或该 Recommendation 不应成立，必须记录可审计原因。普通 end 表示业务结束，可记录原因但 V1 不统一强制必填。

end/void 不改写核心历史字段，也不追回已成立 current-cycle Recommendation 免费 price-right。

---

## 15. Priority × Recommendation

Priority 与 Recommendation 完全独立：

- Priority 不创建 Recommendation；
- Priority 不授 visibility；
- Priority 不授 price-right；
- Recommendation end 不自动 release Priority；
- Priority release/expiry 不自动 end Recommendation。

Priority 可保存 recommendation_id 作为追溯字段，但不得形成生命周期耦合。

当 Customer B 已有合法 Recommendation，Customer A 后来获得同 Vehicle active Priority：

- B Recommendation/history/price-right fact 不删除、不结束；
- B 客户侧 Vehicle visibility 临时 suppression；
- B 不得通过“我的推荐”、旧 share、历史入口穿透 A 的 Priority。

A Priority ended 后重新读取 B Recommendation、listing_cycle、Vehicle、Customer、新 Priority、Lock、Transaction 等当前事实，只有全部合法才 restore。

---

## 16. Lock / Transaction × Recommendation

active Lock 或 in-progress Transaction 的占用事实本身不自动禁止 Recommendation。

只要 Vehicle 底层仍真实可售、cycle 有效、Customer entitlement/责任/权限合法且无其他 Customer active Priority 等排他 Guard，仍可 Recommendation。

但 Recommendation：

- 不产生 Lock 排队优先权；
- 不产生抢车分值；
- 不 takeover Lock；
- 不撤销 Transaction；
- 不绕过当前占用。

Vehicle 最终 sold/offline/unavailable/cycle end 后不得新建当前周期 Recommendation。

---

## 17. Recommendation 免费批发查价权

对于进入批发价格保护机制的 Vehicle，正式 Recommendation 合法成立即免费授：

> `customer + vehicle + current listing_cycle`

批发数字价格查看权。

- 不消耗 daily quota；
- 只限被推荐 Vehicle；
- 不解锁全库；
- 普通 share/Favorite/Consultation 不授；
- 不通过转发转移；
- Recommendation end、owner/responsible 变化、recommender 离职不追回；
- listing_cycle 结束自然终止。

若 Recommendation 创建时只有“价格咨询”，free price-right fact 仍立即成立；同 cycle 后续出现数字价直接查看，不扣 daily quota、不要求重新 Recommendation。

---

## 18. Recommendation price snapshot

Recommendation 创建时保存不可变 recommendation_price_snapshot，表示推荐发生当时价格事实。

后续上游调价、阶梯、覆盖价、source_type 变化不得回写历史快照。

历史页面若同时展示当前价格，必须另行读取当前 Vehicle/listing_cycle、Customer 当前 visibility 与 PDM-10 当前价格 Authority。旧 cycle Recommendation 不授权新 cycle 当前价格。

---

## 19. 普通分享

普通 Share 只提供 Vehicle 传播/导航，不授：

- Recommendation；
- Recommendation price-right；
- visibility grant；
- Consultation；
- owner；
- Internal Mode；
- 原 Customer 的其他权限。

接收人始终按自己的 customer_id、owner、Level、visibility、price Authority 判断。

ownerless 新 Customer 的归属服从 PDM-03 当前分享/转介绍规则；已有 owner 不被后续 share 抢走。

---

## 20. 普通 share link 生命周期

普通 Vehicle share link 无固定 N 天 TTL，可以继续转发。

每次打开都实时判断：

- Vehicle 当前状态；
- listing_cycle；
- hidden；
- Priority；
- Customer 当前 Authority；
- Lock/Transaction；
- price-right。

再转发不得形成多级 Recommendation、price-right、visibility、Internal Mode 权限继承链。

Vehicle visible 且无排他 Guard → 普通详情；hidden/Priority 下只有接收人自己拥有合法当前访问 Authority 才可进入，否则显示当前不可查看并保留“查看更多车源”等安全出口。

offline/sold/cycle ended 时普通分享不得继续作为在售详情产生新 Recommendation/Consultation/Lock；本人历史业务从自己的历史入口访问。

Vehicle 后续进入新 listing_cycle，旧普通 share 仍可作为同一 Vehicle 导航入口，但所有业务权按新 cycle 重新判断。

---

## 21. 分享详情与统一业务详情

不建立第二套 Share Detail 业务状态机。

SHARE_DIRECT 使用统一 Vehicle Detail Authority，只允许增加“查看更多车源”等分享场景轻量入口。Favorite/Consultation/Lock 等继续读取当前 Customer 与当前 Vehicle 真实状态；分享入口不得绕过 visibility。

具体页面布局归 PDM-20。

---

## 22. “咨询”与“锁车”拆分

旧“我要这辆车”不得同时承载咨询、Recommendation、Lock 多种语义。

当前：

- 沟通车辆 → Consultation / “咨询”；
- 锁车 → LockRequest / Lock；
- Recommendation → Employee 正式推荐动作。

三个对象独立。

---

## 23. Recommendation × Consultation 双向不反写

Recommendation end/void 不自动结束既有 Consultation。

同 Customer+Vehicle 当前周期已有未结束 Consultation 时，后来新 Recommendation：

- 不自动创建第二条 Consultation；
- 不抢当前 Consultation 负责人；
- 不改最初 source。

反方向：

- Consultation 不自动创建 Recommendation；
- 不授 Recommendation free price-right；
- 不授 hidden visibility；
- resolved/invalid/cancelled/其他合法终态不自动 end/void 仍合法 Recommendation。

Consultation 若真实来源于 Recommendation，只保存真实 source relation，不绑定生命周期。

---

## 24. “我的推荐”与历史

“我的推荐”只展示正式 Recommendation，不混入 Match candidate、Source Radar、Priority、未正式推荐 Vehicle。

至少包含：

- Vehicle；
- Recommendation 时间；
- recommender；
- source Demand（如有）；
- 当前 Vehicle 状态；
- 当前 listing_cycle 价格访问状态。

明确区分当前与历史，不建立 Customer accept/reject Recommendation 状态机。

Demand 结束、recommender 离职、Customer owner 变化、Vehicle 下架/sold、cycle end、Customer disable、entitlement loss 都不能删除 Recommendation 历史。

历史存在不等于当前仍可访问；从历史进入必须重新读取当前 Authority。

---

## 25. Vehicle Archive 与 Customer Safe Projection

档案/报告不完整本身不得阻止合法 Recommendation。

Recommendation/visibility grant 不自动开放 VIN、绿本、行驶证敏感原件、内部保单、内部档案等；客户报告继续服从 PDM-07 customer_visible。

Recommendation/visibility 只授 Customer Safe Projection，不得自动下发 Internal Mode、敏感内部价、上游发布人电话、完整 VIN、敏感档案、Priority/Match 内部事实等员工/后台数据。

---

## 26. source_type / 一键转名邦

合法 source_type 修改与批发→名邦一键转换发生在同一 vehicle_id；当前模型下一键转名邦保持同一 listing_cycle。

既有 Recommendation：

- 不迁移；
- 不重建；
- 不复制；
- 不清空。

recommendation_id、customer_id、vehicle_id、listing_cycle、recommender、source_demand_id、price snapshot、已成立 current-cycle price-right 均保留。

转换后只重新读取当前 availability/visibility/price。

---

## 27. JYT / 上游同步边界

JYT/外部同步只维护合法 Source Data / Vehicle facts，不得直接 create/end/void/delete/overwrite Recommendation 或 customer-specific visibility grant，也不得覆盖 Customer/owner/Demand/Lock/Transaction 等名邦 Business Data。

若上游事实导致 availability/listing_cycle 变化，由名邦业务域消费事实后按本域 Authority 执行生命周期。

---

## 28. 明确不得恢复

以下全部 DO_NOT_RESTORE / SUPERSEDED：

1. 独立 Recommendation qualification / P06-06 / RECOMMENDATION_QUALIFIED；
2. 经理/店长/协作身份天然 Recommendation 权限；
3. “只有 current owner 才能 Recommendation”的旧绝对规则用于阻断合法 Demand responsible/handover；
4. Priority responsible 自动成为 Recommendation 授权来源；
5. REC 专属 URL / 第二套 Recommendation Share；
6. “所有 Vehicle 必须 Recommendation 才可看”；
7. Demand/Priority 本身直接授 hidden Customer visibility；
8. active Priority 时删除其他 Customer 既有 Recommendation；
9. Customer Merge 与 Recommendation/权益迁移；
10. Recommendation 自动微信发送状态机；
11. 历史 recommender 永久拥有当前操作权；
12. entitlement 失效后 Recommendation-only visibility 无条件继续；
13. visible→hidden 时 active Recommendation 不补授权；
14. share link 穿透 hidden/Priority/offline/sold；
15. source_type 转换时重建/迁移/清空 Recommendation；
16. active Lock/Transaction 一律禁止 Recommendation；
17. group Recommendation；
18. Recommendation mutation 顺带改 owner/Demand responsible；
19. 普通 share 固定 N 天 TTL；
20. 二次分享继承上一 Customer 权限；
21. “价格咨询”后出现数字价再次扣 Recommendation Customer daily quota；
22. Recommendation/visibility 泄露 Internal Mode/敏感数据；
23. JYT 同步直接写 Recommendation/visibility；
24. Consultation 反向创建/结束 Recommendation 或授 price/visibility。

Current IA / Low-Fi 对应旧承载统一登记：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

当前不得施工。

---

## 29. Incoming Handoff

PDM-14 已实质承接：

- HO-P01-P14-001；
- HO-P03-P14-001；
- HO-P04-P14-001；
- HO-P07-P14-001；
- HO-P10-P14-001；
- HO-P11-P14-001；
- HO-P12-P14-001；
- HO-P13-P14-001。

Final 发布 closeout 时统一 CLOSED + source backwrite。

---

## 30. Outgoing Handoff

PDM-14 正式输出：

- HO-P14-P15-001：Consultation 双向不反写；
- HO-P14-P18-001：Lock/Waitlist × Recommendation；
- HO-P14-P19-001：Transaction × Recommendation；
- HO-P14-P20-001：客户端“我的推荐”/share/history/safe projection；
- HO-P14-P21-001：员工端 create/batch/end/void/Guard；
- HO-P14-P23-001：Recommendation 不自动形成微信主动通知状态机；
- HO-P14-P25-001：Recommendation/visibility 全量审计与历史标准。

当前均为 HANDOFF_OPEN，待目标域按 ACCEPTED → CLOSED/SUPERSEDED → source backwrite 流程承接。

---

## 31. Final Integrity

当前正式规则/裁决单元：

- Batch 1：14；
- 用户追加裁决：4；
- Batch 2：11；
- Batch 3：5；
- Batch 4：8；
- P14-LIA：10。

合计：

> **52 个。**

Final 前完整性 R2：

```text
SOURCE_TO_ATOM = PASS
ATOM_TO_SOURCE = PASS
SEMANTIC_COMPLETENESS = PASS
COMPLETED_PDM_INVARIANT = PASS
INCOMING_HANDOFF_SEMANTIC_COVERAGE = PASS
OUTGOING_HANDOFF_INTEGRITY = PASS
NEGATIVE_CLAIMS_VERIFIED = PASS
STALE_CARRIER_LEDGER = REGISTERED

MISSING_RULE_UNRESOLVED = 0
SEMANTIC_DETAIL_GAP_UNRESOLVED = 0
CROSS_PDM_CONFLICT = 0
HANDOFF_GAP_UNRESOLVED = 0
PDM14_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0
PDM14_LOCAL_DEFERRED_UNRESOLVED = 0

PDM14_PREFINAL_INTEGRITY_R2 = PASS
PDM14_FINAL_CANDIDATE_READY = YES
```

---

## 32. Final Gate

用户已于 2026-10-06 最终批准本 Final Domain Overview，并随后明确“确定执行”。

本文件作为最终批准留痕保存；正式 Authority：

> `07_重建工作区/PDM-14_最终完整规则.md`

Final closeout 必须关闭 8 条 incoming handoff、完成 source backwrite，并生成 Final Integrity 报告。IA / Low-Fi / Engineering 继续禁止施工。
