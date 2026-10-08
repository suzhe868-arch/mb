# F03-G0｜Authority → 能力合同 → 自动测试反向覆盖

> 当前仅为已批准的静态合同/纯函数范围。**45 条操作或治理责任映射不等于 45 项已实现业务授权。** `permission-contract.tsv` 中的 `F03_G0_STATIC` 为本批纯决策；`DEFER_NOT_IMPLEMENTED` 只完成责任归属，不冒充运行实现。
>
> 未确认的英文 capability 只在 `permission-contract.tsv` 标为 `TECH_ALIAS_PENDING_A`；A 必须在后续动态实现前确认。所有测试都使用假数据，禁止真实数据库和账户。

| 上游 Current Authority | 本批能力映射 / 控制要点 | 纯函数/测试落点 | 未完成交接 |
|---|---|---|---|
| PDM-02 §§1/3/4/5/6/9/12；PDM-22 §§2/3/7 | Employee/4S/System Admin 分离；实时模板/个人 allow-deny/hard DENY；当前授权 | `policy.mjs authorize`; `policy.test.mjs`：模板、个人禁用、失效账号、4S、System Admin、混用拒绝 | F03-1 实际会话；F03-2 真实凭据/实时读取与治理 |
| PDM-02 §§4/5；PDM-25 Final | 关键授权事实变动、当前权限而非历史权限；操作历史必须保留 | `policy.test.mjs`：模板变动、旧 session 无效、历史安全字段投影 | F03-2 DB 事务审计；F03-3 导出适配 |
| PDM-02 §6/7/10；PDM-03 §§10/13/14 | System Admin 控制平面；最后管理员与接客保护；承责及交接 | `policy.test.mjs`：系统身份隔离、系统权限与 Employee 不互通；`permission-contract.tsv` 交接责任行 | 最后活跃管理员/接客保护、Handover Batch、并发均 F03-2/F05 |
| PDM-02 §§8/14；PDM-10 §§4/5/6；PDM-21 §§9/19 | 内部价独立权限，编辑内部价额外要求；普通价格编辑无独立“调价” | `policy.test.mjs`：两项能力均必需，4S DENY，内部模式不授予，价格字段白名单 | F03-3/F04 实际价格投影/写入 |
| PDM-04 §§9/16；PDM-21 §§16/17 | 正常车辆编辑；一键转名邦复用车辆管理能力；4S 不得转 | `policy.test.mjs`：来源、操作状态、已退役独立权限拒绝 | F04/F05 实际车辆生命周期 |
| PDM-09 §§2/6/9/13；PDM-22 §6 | Publisher phone 独立敏感能力复用，当前 wholesale + publisher 身份，Integration 管理≠电话 | `policy.test.mjs`：批发/转名邦后、无 publisher、integration only 均拒绝；投影脱敏 | F03-3/F04 Collector/缓存/电话审计 |
| PDM-01/02 §11；PDM-22 §10 | 其他联系电话独立管理；Customer 停用控制平面合法 System Admin | `policy.test.mjs`：Customer scope、4S 禁止、控制平面、不允许 inactive 后新增业务 | 主要手机号官方绑定 F03-1/F04；账户状态交易 F03-2/F05 |
| PDM-03 §12；PDM-15/16/17 Final；PDM-21 §§25/36/41 | 当前 Customer owner、assignee、responsible 不可混同；历史查阅按当前 scope | `policy.test.mjs`：owner/assignee/responsible 独立、当前 history 字段白名单 | 实际 Consultation/CRM/Public Pool 处理 F04/F05/F06 |
| PDM-18/19 Final；PDM-22 §11 | Lock/Waitlist/Transaction/Refund 的 scope/state 与资金事实 | `policy.test.mjs`：基础 Lock/Transaction 身份/状态/4S DENY；`permission-contract.tsv` 交接行 | 实际余额、候补、退款三态、幂等、责任交接 F05/F06 |
| PDM-05/12/13 Final；PDM-22 §§5/9 | Model master-data 治理与 Matching Rule、Priority 当前资格 | `policy.test.mjs`：System Admin model 控制、不自动业务授权；Matching Rule hard DENY | P05 管理写入、Priority TTL 等 F04/F05 |
| PDM-21 §9/13/14/24；PDM-02 §12 | 4S PC 授权仅自身车源；内部/分享无电话和批发价；Customer-Safe | `policy.test.mjs`：4S own PC 车辆、受控字段投影、敏感字段后端排除 | F03-3/F04 DTO/缓存/分享/导出 |
| PDM-02 §§4/12；PDM-22 §3 | hard DENY 优先、数据范围不可省；测试须对删除关键检查敏感 | `sensitivity.test.mjs`：生成临时移除 hard DENY 和 scope 校验的变体，观察原拒绝断言失效 | F03-2 真实请求/事务重验 |
| 全表 PDM 最终原子归属及当前独立首批门禁 | 已登记 F03-G0 纯模块的每个 action 需要独立合法假事实可到达；未知动作默认拒绝 | `contract.test.mjs`：源/能力/范围/状态/投影/责任字段完整、无重复动作、所有注册 action 正向覆盖、retired action 无入口 | 技术 capability 代码名待 A 确认；其余细节按标记批次施工 |

## 审核时反向检查的方法

1. 从 `PDM Final` 找到对应节与语义，再在 `permission-contract.tsv` 按 `source_final` 搜索；实际动作只在 `F03_G0_STATIC` 范围可以声称纯函数证明。
2. 从 `policy.mjs` 的 `ACTIONS` 出发，`contract.test.mjs` 保证**每个注册动作都必须有合同来源行**，而且每个已实现静态合同均有注册动作；每个动作必须用合法假事实实际允许一次。
3. 从 `policy.test.mjs` 和 `sensitivity.test.mjs` 逆向核对 deny/no-scope/4S/price/phone/field projection；移除主要 hard DENY 或 scope 校验时，关键负例确实翻转。
4. 对 `DEFER_NOT_IMPLEMENTED` 的规则只有“已映射责任批次”，测试结果不得称业务已实现；F03-1/2/3及F04～F06需要独立放行和真实执行证据。

## 风险与明确不主张的覆盖

- 本批合同覆盖的是 F03-G0 已批准权限/身份边界的**代表动作和治理责任**，不把所有 PDM-01～25 业务操作转化为已实现决策；历史 218 个 API 不是本批授权。
- `global` 当前 grant 由可信事实提供；本批不提供真实可信数据读取器、不证明 grant 不被伪造、不建会话。
- 4S、System Admin 控制面治理及账户状态仍必须在后续真实事务层防自我提权、并发和旧权限穿透。
- 状态机/自动候补/退款余额/持续匹配等跨域业务条件未建模：`NOT_RUN`。
- 全局 `PRODUCT_BASELINE=NOT_READY`；本批只申请 A 复验，不自行签发通过。

## 2026-10-09｜A 定向复验两项额外防线

| A复验发现 | Current Authority / 已授权边界 | 对应代码 | 正反例与敏感性测试 | 后续责任 |
|---|---|---|---|---|
| 授权通过但车辆/客户投影行丢失主键 | PDM-02 §4：current identity + capability + scope + object state；PDM-21 §9/13；PDM-03 §12；F03-G0 只做安全示例 | `policy.mjs projectRecord` 要求业务行 `vehicle_id/customer_id` 有效存在且等于本次授权 `resource.id`，否则拒绝而不是返回匿名记录 | `policy.test.mjs`：获授权且合法scope时缺失、null、0、数组、错ID全部拒绝，合法同ID通过；`sensitivity.test.mjs`：移除双重ID检查后负例翻转为允许 | F03-3/F04 实际 serializer/ORM 查询与多对象批量投影防关联错绑 |
| 历史白名单字段出现嵌套敏感对象 | PDM-02 §4/9 当前权限与历史不改写；PDM-03 §12 历史查阅限当前 scope；PDM-25 Final 审计历史；F03-G0只允许示例白名单 | `projectRecord('customer.history.read')` 若任何白名单字段是非标量，`UNSAFE_NESTED_HISTORY_VALUE` 整体拒绝；非白名单字段从不复制 | `policy.test.mjs`：嵌套密钥/上游电话/内部价和数组/Date阻断，合法扁平历史输出，非白名单嵌套丢弃；`sensitivity.test.mjs`：去掉检查后实际泄露秘密 | F03-3 若需显示合法嵌套历史，必须提供明确的逐字段映射/投影测试，不能透传审计JSON |

保留风险：不对真实数据库行、批量分页、缓存、旧会话、实际接口 serializer 作运行承诺；这些仍需下一批独立授权。**F03-G0仍等待A验收。**

---

