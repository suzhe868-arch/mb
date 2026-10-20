# 名邦汽车 V1｜B工程自验与A交接｜F06移交后Transaction取消

> 当前状态：B_IMPLEMENTED_PENDING_OFFICIAL_CI；**尚未达到 READY_FOR_A_REVIEW**。
> 任务：F06_REAL_POST_HANDOFF_TRANSACTION_CANCEL_HTTP_PG16_01；Issue #154。
> 起点 main：29da12bc093d85349e65ef409b6c7b8679693391。
> 分支：feat/f06-real-post-handoff-cancel-http-pg16-01。

## 已实施（仅非生产合成数据）
- 新版独立 `f06_real_post_handoff_cancel_ci` 签名侧车（不可变Attestation、Origins、Events、Keys）。
- 以原PR139初建不可变签名＋PR153 Handoff完整版本链作为可信来源；限定当前链尾Employee有独立Cancel Permission、Capability和Team/Store Scope。
- HTTP仅127.0.0.1 `/__ci__/f06-real-post-handoff-cancel/cancel`，签名Employee Session隔离，不扩生产API。
- 当前负责人指定Version安全取消；状态、Event、Key、Public Audit单PG16事务，注错回滚、幂等、拒绝旧PR146来源伪造。
- 执行前继承父585项真实单Job回归；新增80条新目录HTTP断言（前40重放真实Handoff业务，后40验证新Cancel）、至少11条TLS及生产接口拒绝测试；原161张父签名表、24迁移、不同物理OID完整Seal复验。

## 必须取得且暂未取得的终验门禁
- 官方同末SHA Push单Job完成并证实至少630项，失败、跳过、取消均为0。
- PG16非超管真实执行、签名Version、两不同Employee后端PID、真实Rollback与完整父Seal前后相等。
- 官方Run/Job、实际通过数量、OID和Seal必须从日志确认后填写；不能凭代码或历史父Run伪称通过。
- 旧PR150 Refund对本批新Cancel来源必须继续FailClosed；不可冒充真实资金/生产就绪。

## 最终交接状态
`NOT_READY_FOR_A_REVIEW`（CI等待实际验证）；B不得创建业务PR或合并main。
