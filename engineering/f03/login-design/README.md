# F03-1-G0｜PC 登录安全方案与物理结构差异预审

**状态：仅 A 放行的方案 / 假数据批次。** `F03_1_G0_ACCEPTED=NO`。工程分支 `feat/f03-login` 从包含 A 正式放行登记的 `main` 建立。

| 文件 | 内容 |
|---|---|
| `password-session-design.md` | 候选成熟 scrypt 密码哈希、盐、成本、版本升级、账号治理安全与 A 待裁决项 |
| `credential-state-machine.tsv` | 合成凭证状态变化、强制改密、会话撤销与审计职责 |
| `session-contract.md` | Server session、撤销、轮换、Cookie/CSRF、身份和当前授权事实合同 |
| `schema-delta.tsv` | 已验收 F02-1 物理字段和可追加（未授权施工）迁移列/索引精确差异 |
| `authority-test-coverage.tsv` | 权威规则 → 事实与状态 → 测试 → 后续责任反向覆盖 |
| `state-model.mjs` | **纯假数据状态判定**，无 HTTP、数据库或真实 token；非认证实现 |
| `test/*.test.mjs` | 纯契约、真实冻结矩阵/SQL 编译读取核对与恶意/合法合成数据 |
| `benchmark-scrypt.mjs` | 用内存中合成样本检查 Node 22 scrypt 可用与耗时，仅输出参数和时长 |
| `B自验与A复验交接.md` | GitHub 成功 CI、源规则反向覆盖与残余风险 |

本批无数据库服务、无真实密码、无 KDF 输出或 token 文件，不修改 F02 Initial SQL、PDM、IA、Low-Fi、F04 或 main。后续实际方案必须由 A 独立裁决后另行放行。

运行方式（仅假数据）：

```sh
cd engineering
node f03/login-design/verify-contract.mjs
node f03/login-design/benchmark-scrypt.mjs
node --test f03/login-design/test/*.test.mjs
```
