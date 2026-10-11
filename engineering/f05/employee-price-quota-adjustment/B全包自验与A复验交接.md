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


## A第一次独立复核定向整改：Owner、permission、scope真实并发

A首次确认先前62/62同SHA通过，但拒绝PR44验收，因为此前5-A04只是同幂等Key并发、5-A13/16只是静态先更改后访问。现仅新增原Source测试5-A19～5-A22作为真实并发证据，**不得在新的官方CI完成前宣布整改成功**。

- 5-A19：真实`addSyntheticDailyQuota(auth,...) `业务事务在`after_current_customer_and_employee_scope_guard`后挂起（已锁Current Customer和独立Permission）；独立`pg`后端发实际`UPDATE customers.current_owner_employee_id`，当前业务锁阻止更新，`lock_timeout=250ms`接到**真PG SQLSTATE 55P03**。写连接ROLLBACK、服务完成COMMIT、写连接再更新Owner并COMMIT。对同key重放/新key旧sales各执行一次拒绝，三张账本/不可变事件行数不再变；反向先Owner COMMIT再发旧Owner加次也拒绝。
- 5-A20：真实当前销售个人独立CI权限`employee_permission_overrides`在加次完成current Permission/Scope检查后仍被`FOR SHARE`持锁；另一`pg`连接`UPDATE decision='deny'`被`55P03`拒绝，待服务COMMIT再通过UPDATE/COMMIT撤销。之后新请求与同键重放均`SOURCE_GAP`拒绝，三个账表不再变化；撤权-first后同样拒绝。测试结束回到CI权限允许态供另一并发场景。
- 5-A21：同理对当前`employee_capability_scope_bindings`的`ended_at=now()`执行真实双连接竞争；服务提交前另连接`UPDATE`真实`55P03`；服务先提交后scope revoke COMMIT，新/重放均失败无副作用。
- 5-A22：所有三种原生测试均要求不同`pg_backend_pid()`、原生SQLSTATE=55P03、明确事件时序和数据库`clock_timestamp`、每次前/成功后/撤权后/重放后的账本及不可变审计条数、SHA256 row digest，再写入新GitHub Artifact的`owner-permission-scope-real-pg16-concurrency.json`；由新Source Job原生日志和两份独立Github Native Artifacts供A验收。

生产`F05_5_EMPLOYEE_ADDITION_SOURCE_GAP`依旧BLOCKED，所有新增正向测试只使用`CI_SYNTHETIC_ROLE_FIXTURE_NOT_PRODUCTION`。未改原既有F03/DDL/Workflow、不部署生产。六组62项最终同新SHA结果及原生Artifact ID**以最新PR交接为准**。
