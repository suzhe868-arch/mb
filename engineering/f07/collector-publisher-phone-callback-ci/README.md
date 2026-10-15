# F07-1｜发布人电话回传与缓存权限（仅隔离CI）

此目录只实现可销毁 PostgreSQL 16 sidecar + 合成 Collector→名邦 HTTPS 入站 + 当前员工敏感权限合同。无外网通信、真实电话号码、生产数据迁移、真实JYT凭据、真实拨号和生产路由。

- `schema.sql`：隔离 `f07_phone` schema，仅测试角色创建，无 public DDL。
- `contract.mjs`：每次员工敏感读、latest、拨号授权都从PG16行锁和当前会话/角色/个人DENY/scope/source_type确认。Collector回传必须签名、5分钟时窗、nonce、request_id与publisher绑定。
- `server.mjs`：仅CI上 127.0.0.1 TLS，禁止生产注册。
- `tests/source.test.mjs`：40项业务安全/并发PG16原生测试。
- `tests/https.test.mjs`：15项loopback HTTPS黑箱测试。
- `tests/restart-proof.mjs`：真实PostgreSQL16容器重启后缓存/凭据持久、重复与乱序不可倒灌。
- `schema.sql`审计/历史/收据的不可修改触发器与两Backend幂等竞态断言。
- `来源与权限矩阵.tsv`：当前合同/源码/差距对应。

明确缺口：生产Integration API实际注册、正式Collector接线鉴权、生产缓存DDL、真实员工会话/角色/Vehicle查询统一适配、真实终端拨号均未实施。本包侧车是隔离接口合同，不可理解为直接调用已有真实F03数据库的完整生产服务。F05/F06/F07/V1继续 NOT_READY。
