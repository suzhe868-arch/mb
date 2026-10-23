# F03→F07 发布人电话 Ed25519 签名授权（仅非生产）

本目录实现 Issue #248 已放行的隔离测试协议：F07 创建一次性 challenge，F03 使用当前会话和当前权限事实签发短时 Ed25519 断言，F07 验签并原子消费 challenge，然后必须调用现有 `authorizePublisherPhone` Guard 再校验员工权限、车辆来源和当前锁车事实。

**强边界：** 仅 `CI_SYNTHETIC_ONLY`，两个独立非超管 PostgreSQL 16 数据库，loopback HTTPS，运行时临时密钥。没有生产路由、正式信任根、真实电话号码、真实 JYT/Collector、CDN/OSS、飞书、客户或资金数据。成功结果始终包含 `formalSourceSigned=false` 与 `productionReady=false`。

先读：
- [签名协议与威胁模型](./签名协议与威胁模型.md)
- [工程说明](./工程说明.md)
- [B自验与A复验交接](./B自验与A复验交接.md)
- [测试矩阵](./测试矩阵.tsv)

官方最终 SHA/Run/Attempt、双 PG16 Job、实测 TAP、工作流触发审计和逐文件 SHA-256 由最终 Run Artifact 内的 `f03-f07-evidence.json`、`测试矩阵.tsv`、`最终运行交接.md` 与 `f03-f07-sha256sums.txt` 共同绑定。不要以静态测试清单替代官方测试结果。
