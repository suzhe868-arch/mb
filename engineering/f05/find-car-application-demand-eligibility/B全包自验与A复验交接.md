# F05-6｜B全包自验与A独立验收交接

## 严格范围
仅新增engineering/f05/find-car-application-demand-eligibility/**和七份新专属Workflow；旧M94及v15~v21迁移、旧F03/旧F05业务、旧工作流、PDM Final/IA/Low-Fi/C/生产全冻结。
新增仅可抛弃真实非特权PG16中的000022版本，验证原19行签名账、v21结构SHA、原attestation后追加最小CI origin/独立find-level entitlement/不可变激活事件、真实catalog seal；不认为生产正式表已有完备trusted Issuer。

## Source和HTTPS
Source必须核客户身份和手机号缺源拒绝、无Owner拒绝、普通找车权益OFF可pending、find ON仍不能自动Demand、同对象编辑/关闭及幂等、F03员工Session/Scope、真正原demands人工原子唯一开通、4S/Admin拒绝、created_at历史冻结、两后端同申请并发、Owner/permission/find entitlement撤销与有效激活并发、原生55P03/前后原表笔数哈希与无下游Match/Recommendation/价格/资金副作用；HTTPS拒绝伪造User/Phone/Token/Role/CSRF/Origin。

## 强制A交付
最终B/PR与七官方工作流全部同SHA，冻结旧H52/I2/J2/K2/F05-4/F05-5共62 jobs原样，新本包Source+HTTPS两jobs，合计64/64 success，0skip；附两非空原生Artifacts、catalog/schema-only/version ledger、Source/HTTPS真实测试日志、原生Owner/Scope/Level竞争SQLSTATE、完整中文自验和SOURCE_GAP。若CI失败需同白名单整改，不能提前称PASS；B不自行合并main。

正式生产Employee Demand激活Issuer/Customer微信与手机来源尚缺，CI全绿只证明隔离测试算法，V1继续NOT_READY。
