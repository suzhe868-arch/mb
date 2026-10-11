# F05-4｜客户等级日额周期权益与Actor状态矩阵

## 已签业务来源
PDM-10 Final §7～13要求LIMITED/UNLIMITED等级配置、UTC+8自然日、同customer+vehicle+listing_cycle单周期权、主动DETAIL首次扣额、UNLIMITED不扣额不生成永久解锁、3A既有当日临时追加保留。
M94已有customer_levels、customers、customer_day_quota_ledger、customer_price_cycle_unlocks、customer_price_unlock_events、recommendations、customer_quota_adjustments。v19 Favorite证明Customer→Vehicle收藏，不自动授价。
新v20仅提供标明SYNTHETIC_CI_ONLY的等级价格配置及合成数字客户展示价，既有账本与周期权继续用M94旧签表；新数据不等于正式客户价源或微信会话。

## 状态与来源边界
- Active+LIMITED+合成主动DETAIL+合成数字价：真PG16原子扣一次；线上仍无真实微信Session及价源。
- UNLIMITED合成详情/列表：直接读取CI合成价，不增加日账、永久周期解锁。
- Recommendation同Customer/Vehicle/Cycle复合FK可核，但未签发合法Issuer时拒绝免费价正例。
- 3A同日临时追加：测试只预置已存在历史fact，不冒充真实Employee加次授权。
- 合法JYT车源通过原F05-3B可信API导入，不用造假Vehicle SQL冒充上游。
- 名邦转换/新周期权益保留由冻结旧I/J/K原始58项CI继续验证；新v20只证明价格账本状态机。
- Customer停用后拒绝数字查价，不删除已有周期权或历史；恢复只自然恢复有效周期权。
- 真实客户线上所有查价HTTP仍403，不开放生产路由。

整体F05/F04生产、C-H01、V1为NOT_READY。
