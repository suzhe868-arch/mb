# F05-4｜B全包自验与A复验交接

## 施工/验收边界
仅新增engineering/f05/customer-price-entitlement-cycle目录、必要单独v20 CI-only增量及五个新工作流。冻结旧H52/I2/J2/K2 jobs全文逐字不改，原000001～000019、旧源码、旧Workflow和PDM/IA/C/生产未改。

## Source与TLS回归
原F05-3B可信系统管理员JYT Credential在v18导入5台真实合成来源车辆，再原样按v19→v20附加签名链；M94真实日账/单车周期权/扣额事件测试LIMITED首扣、幂等重试、双PG16 backend并发原子单扣、额度耗尽、无码价咨询、预取不扣、UNLIMITED不扣与无永久权、3A临时追加保留、UTC+8日切、inactive暂停和历史不可变。
TLS只允许新/__ci__/f05-4/**回环路径；无真实微信Issuer下所有真实Customer价格接口拒绝。SystemAdmin/Employee/4S/JYT Token与自报顾客身份、假CSRF和缓存预取不能授予价权。
Recommendation免费Issuer和Employee加次合法Scope尚未证明，因此功能正例明确BLOCKED_SOURCE_GAP，不能将CI全绿冒充生产功能验收。

## 官方门禁
按A施工单：最终同一B/PR SHA，冻结H52+I2+J2+K2合58及新增F05-4 source+TLS各1共60成功、两个新原生Artifacts和中文PR最终评论后才READY_FOR_A_REVIEW。本文是基础交接说明，最终成功数字需依GitHub Actions官方结果单独确认。

产品整体NOT_READY。
