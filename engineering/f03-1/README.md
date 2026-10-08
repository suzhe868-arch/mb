# 名邦汽车 V1｜F03-1 真正账号认证限定施工（CI一次性 PG16）

**状态：B_IMPL / A_PENDING**。放行：`07_重建工作区/F03-1_A主控方案合并与真实登录隔离施工放行_2026-10-09.md`。

仅接受 GitHub Actions 新建的 127.0.0.1:5432 / f03_auth_test / f03_ci 非特权账号，匹配 `GITHUB_RUN_ID` 创建封印，以及 `CI/GITHUB_ACTIONS/APP_ENV/NODE_ENV` 和独立确认标志。迁移器拒绝已有对象、其他目标和不匹配版本链；不修改 F02-1 的 Initial、runner、guard、checksum、manifest。

| 文件 | 内容 |
|---|---|
| migration.mjs / runner.mjs | 独立F02基线加载封印与F03追加DDL/版本登记、原子失败回滚、幂等锁 |
| fixtures.mjs | CI临时合成账号和凭证；永不输出密码/哈希 |
| inventory.mjs | PostgreSQL16真实 schema-only 对象目录、版本链，JSON 不含行数据 |
| tests/integration.test.mjs | PG16真实 KDF、身份隔离、首次改密、退出、撤销、4S身份与当前资格、内部受信治理和并发测试 |
| tests/https.test.mjs | 临时回环TLS、三认证路由、Origin、CSRF、Cookie、改密与退出 |
| artifacts/（仅 CI 生成） | pg_dump schema-only、inventory、真实测试日志/工作进程；30天保留 |

Node 顶层 `engineering/src/f03-auth-*.mjs` 仅独立注入原单一 server 的测试认证服务。业务路由、治理 HTTP、微信/JYT、生产部署均未启用。默认配置不加载认证，继续 F01 health/ready/404。受限会话只能本人修改密码/退出；不提供“查看身份”旁路。已有 F03-G0 权限决策与角色/scope 尚未被认作完全动态授权。

不运行真实/已迁/生产数据库，不向外提供任何 `--drop` 重置命令；保留 F02 冻结迁移原字节。全套测试在 GitHub Actions 中使用一次性服务库、临时证书和临时 HMAC 密钥。当前不声明已通过，需真实 CI 同SHA证据。
