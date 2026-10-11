# F05-5｜B全包自验与A复验交接

## 严格边界
仅新增engineering/f05/employee-price-quota-adjustment/**与6份新专属Workflow；原M94/v15～v20/旧业务源/旧CI/PDM Final/C/生产完全不变。只限隔离CI真实非超级用户PG16，旧60个Job必须从正式main jobs全文逐字冻结。
## 业务测试说明
CI使用真实F03 Employee Session和M94现时Owner/Team及原Quota账本，**另以明确标记CI_SYNTHETIC_ROLE_FIXTURE_NOT_PRODUCTION**的权限码、allow和team binding验证Sales/current owner、经理/店长team scope、4S/Admin拒绝、User active、UNLIMITED 3A、同日多次累计、UTC+8日切、同key真双会话并发去重、实时撤权、旧Owner拒绝和不变审计。v21仅用于CI合成Issuer成功证明。
## 原生安全测试
新loopback TLS只注册/__ci__/f05-5/**；因生产正式独立Employee permission和完整Issuer未签，所有HTTP加次保持fail-closed，原微信客户查看价格路由不开放。
## 来源缺口
F05_5_EMPLOYEE_ADDITION_SOURCE_GAP仍未解决生产权限Issuer；真实身份存在≠正式业务授权；原F05-4 Customer Session和正式数字价格等来源亦未关闭。全域NOT_READY。
## 原生CI门禁
按A主控，正式最终同SHA旧H52+I2+J2+K2+F05-4的2共60，加本批Source+HTTPS2，六组共62/62无skip；2个新原生Artifact及完整PG catalog/SQL/日志/结构校验后方可标READY_FOR_A_REVIEW。实际run和SHA由B最终PR评论记录，不在此预先宣称。
