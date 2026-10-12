# F05-8｜Priority资格、仲裁、TTL与事务时序审计（CI-only）
- 资格是Customer独立单人开关；默认FALSE。Customer Level/价格/Find-car不授Priority。
- 消费唯一已签PDM-12 current Match Result，与active Demand、当前Customer、find entitlement、可售cycle及真实Employee current权限一起校验。新Priority绝不二次判车型、价格、车况。
- 多Customer候选按high > acceptable > immutable Demand.created_at > demand_id；同一Customer多个Demand只保留一名候选。Vehicle+cycle原生partial UNIQUE索引只允许一个active，允许一个Customer跨车多active。
- 事务锁为第一排他事实；即使Match仍可用，active Lock/交易中不会授新Priority。signed Lock/Transaction变更仅触发v24 Priority关闭，不改源Lock/资金历史。
- TTL创建时取独立全局86400秒并冻结expires_at，配置变更、重算、Handover不能修改。严禁人工续期、ended revive。
- employee_released/customer_abandoned/ttl_expired对Customer+Vehicle+cycle保存source_signature suppression；旧事实不自动抢回，签名新事实重新评估。Recommendation cancellation不属于Priority ended。
- 当前合法responsible=trigger Demand合法employee；旧员工/个人DENY/Scope撤销阻断操作。handover按批次物理failure-only retry，attempt不可变。
- CI可见性投影：Priority自身不发Grant、不解锁价、不建Recommendation、不改Owner，active期间屏蔽普通列表/统计/旧分享；ended返回基础hidden/合法Recommendation权益判断，绝不无条件公开。
- 真实生产Issuer/微信/手机号/数价/JYT/资金缺环全部SOURCE_GAP，正式/线上入口只有DENY。
