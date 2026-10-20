# 名邦汽车 V1｜F06真实Transaction正常取消HTTP/PG16｜B自验与A交接

## 正式授权与执行起点
- Issue #144：`F06_REAL_TRANSACTION_CANCEL_HTTP_PG16_01`，B独立施工；A独立验收/创建PR及标准合并。
- 正式`main`开工基线：`d7f365356fe6f28db19c97cdaf4fb6f12fd23640`；指定隔离分支：`feat/f06-real-transaction-cancel-http-pg16-01`。
- 上一批PR143已A验收合并，父`392/392`，原签名四Schema 161张全表COUNT/MD5、24迁移、独立不同OID恢复；本批真实新单Job必须同最终SHA重新全跑，不能复用旧Run。
- 不准B创建PR或合并main。生产/真实资金/UAT/部署一概`NOT_READY`。新增付费预算$0。

## 一、真实签名来源兼容矩阵（A强制第一门禁）

| 来源及服务 | 所依赖的签名Transaction Carrier | 对PR139真实Transaction的判断 |
|---|---|---|
| 冻结F06-3B CI旧签名来源 | `f06_3b_ci.transaction_origins` | PR139没有为其伪造/补造原生3B origin |
| 冻结F06-4A正常取消 | `signedOrigin()`读取`f06_3b_ci.transaction_origins` | **不兼容，须严格FailClosed**，不能直接对PR139新Tx声称旧4A授权 |
| 冻结F06-4C交易责任/衔接 | 以冻结3B/4A等旧签名链为来源 | 不得未经其原生签名确认便当作PR139新Source兼容 |
| PR139真实Lock→Transaction原子签名 | `f06_real_tx_ci.origins/events/request_keys` + 原F06-3A/3B/3C1/Lock源 | 已A验收的新合成真实Transaction来源，只允许新版本化受限校验器 |
| **本批隔离新Cancel** | **真实PR139合成Tx origin和旧原生3C1/3B/3A签名 + 新取消Sidecar attestation** | 若原生父、锁/顾客/车/期次/资金历史不一致、未知/未支付来源或Audit缺失即FailClosed |

本工程不写一条伪造旧`f06_3b_ci.transaction_origins`记录，不改4A/4C任何文件，也不通过两个物理Transaction进行“先改公表再签名”伪造原子。新的`f06_real_cancel_ci`仅存在于本批可销毁PG16，与`public.transactions.status='cancelled'`、Cancel Origin、append-only Event、Key和Audit在**同一PG16事务**提交。只负责`in_progress→cancelled`，不会写退款付款或完成成交。

## 二、代码白名单
仅新增：
- `engineering/f06/transaction-cancel-http-pg16/sidecar.sql`
- `engineering/f06/transaction-cancel-http-pg16/service.mjs`
- `engineering/f06/transaction-cancel-http-pg16/worker.mjs`
- `engineering/f06/transaction-cancel-http-pg16/server.mjs`
- `engineering/f06/transaction-cancel-http-pg16/runner.mjs`
- `engineering/f06/transaction-cancel-http-pg16/tests/http.test.mjs`
- `engineering/f06/transaction-cancel-http-pg16/tests/https.test.mjs`
- `engineering/f06/transaction-cancel-http-pg16/trigger-preflight.mjs`
- `engineering/f06/transaction-cancel-http-pg16/ci-job.sh`
- `engineering/f06/transaction-cancel-http-pg16/B自验与A交接.md`
- `.github/workflows/f06-real-transaction-cancel-pg16-onejob.yml`

## 三、必须核验的运行与安全证据

最终同SHA官方Push单Job目标：原父392/392 + 新取消HTTP/PG16 43/43 + TLS10/10 = **445/445**，0失败、0跳过、0取消。必须出现原生冻结3A/3B/3C1/4A Apply+Verify；旧4A对PR139源真实PG16拒绝；新侧验证原生签名及侧车 SHA/公共Catalog/24迁移，非特权PG16正常取消，确切pg_backend_pid和双Backend竞争/注错Rollback完整实体计数，公海/锁车/交易/退款资金历史不变；源可售状态变更后原交易仍可cancel，不能重新上架。

原生完整父161个**原物理表**逐表COUNT/MD5+24迁移、完整Catalog/D1/F06-1/F06-2签名以及多次真实不同OID恢复、全行Seal必须一致；增加的新表与旧父签名161的统计范围分别记录。

**本地自验与A交接不替代官方Run**，请以Issue #144中本最终SHA的实际官方Run/Job/OID/PID/Seal补充报告为准；若源签不兼容且受限Adapter无法安全实现，必须报`BLOCKED_SIGNED_REAL_TRANSACTION_CANCEL_SOURCE`，不可凑数。

## 四、严格保留缺口

真实`completed`、成交确认/纠错、付款收款、真钱退款/refunded/refund_payments、真实资金Issuer、跨主体正式责任交接/源签（当前仅同Employee有限测试可证）、微信银行、线上生产DDL/HTTP路由、UAT/部署绝不实施；旧F06-3B不安全直接入口仍未修。两个真实PG Backend可能先被同Employee Session锁序列化，不宣称同时持有Vehicle行锁。F06/F07/F08/V1整体`NOT_READY`。

待最后官方同SHA CI完成后在Issue #144填证并标：
`F06_REAL_TRANSACTION_CANCEL_HTTP_PG16_01_B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。
