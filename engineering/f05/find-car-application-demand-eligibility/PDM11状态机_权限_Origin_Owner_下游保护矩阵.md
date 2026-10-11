# F05-6｜PDM-11状态机、权限、Origin、Owner与下游保护矩阵

**物理基线已核实**：M94原表find_car_applications仅application_id/customer_id/status/assigned_employee_id/activated_demand_id/created_at，原demands仅demand_id/customer_id/responsible_employee_id/demand_state/criteria_json/created_at；本批用独立v22 CI-only最小origin表承载原Application欠缺的文本和唯一request_key，并以不可变activation事件封存独立Demand时间。

| 动作 | Customer / Employee与来源 | 状态结果 | 不允许 |
|---|---|---|---|
| 客户申请 | 内部合成Customer Actor +CI synthetic Phone +实时active Customer/current合法Owner+最低车辆描述 | 原Application pending；写唯一origin | 不自动Demand/Matching/Recommendation/交易，无Owner不落库 |
| 普通等级申请 | find_enabled=false不限制表达申请 | pending | 不能激活正式Demand |
| 已有权益申请 | 独立find_enabled=true | 同样pending | 不能因粉丝/VIP或价格UNLIMITED自动Demand |
| 修改/撤回 | 同身份同pending Application，事务保护 | 同一Application revision+1或closed | 不重造对象、closed不原地复活 |
| 员工人工开通 | F03 normal Employee Session、原Customer/Owner、Phone、当前独立find ON、额外CI permission+团队current Scope | 单PG事务创建原demands active、原Application activated+唯一Demand ID、不可变事件 | 无Issuer拒绝，重复key同需求幂等，旧key新对象拒绝 |
| Customer/等级停用 | active或find OFF | 禁止新激活，Demand历史不删 | 不自动完成/取消/恢复已paused Demand |
| 当前Owner变更 | 原Customer Owner行真实FOR UPDATE竞争 | 活跃Demand负责人仍固定原独立Employee | 不能Owner变了就同步挪Demand |
| Level/权限撤销竞争 | 当前权益配置/权限行真实FOR SHARE且事务未提交 | 争抢UPDATE必须真实55P03，撤销后新/重放拒绝 | 不能用客户端assertion绕过 |
| 后续PDM12匹配 | 需另签matching readiness | 本批仅active Demand，不产生Matching | 不新增match result/rule/priority |

**暂停/恢复/完成/结束请求**：缺完整issuer和作用域，本批没有创设新的生产生命周期操作。历史保持；Customer主动结束只可形成待审核结束请求，不得直接判completed/cancelled，留后续正式批次处理。
