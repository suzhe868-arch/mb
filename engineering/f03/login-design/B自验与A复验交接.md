# 名邦汽车 V1｜F03-1-G0｜B自验与A独立复验交接

日期：2026-10-09（Asia/Singapore）。A 签发单：`07_重建工作区/F03-1-G0_A主控登录安全方案施工放行_2026-10-09.md`。

状态：**DESIGN_ONLY / B_IMPLEMENTED / CI_PENDING_FINAL_EVIDENCE / F03_1_G0_ACCEPTED=NO**。

## 一、施工基线
- `feat/f03-login` 基于 main `872ae597c7e5ced71b82be0433fb2be94bdc3ee8` 新建，未修改 main、旧验收分支、F02冻结SQL/checksum、PDM/IA/Low-Fi。
- 已验收 F03-G0 的合同与纯策略在 main，无需重做工程逻辑。F03-1-G0 本次只在 `engineering/f03/login-design/**` 和专用 `.github/workflows/f03-1-g0-login-design.yml` 添加文件。

## 二、方案交付与正反例
1. `password-session-design.md`：内置成熟 Node `crypto.scrypt` 候选、16B独立随机盐、scrypt N32768/r8/p1、32B结果、64MiB maxmem、格式自描述及版本升级、KDF并发风险和 A 待裁定项。
2. `credential-state-machine.tsv`：14 条凭证与主体状态处理义务（受限改密、正常会话、重置、禁用、复职和异步治理责任）。`state-model.mjs` 仅在假数据上做决策。
3. `session-contract.md`：opaque CSPRNG 会话、HMAC摘要、Server撤销与凭证世代、有限期限、Cookie/CSRF、当前主体/PC资格/权限重查、匿名错误和限速责任。
4. `schema-delta.tsv`：机械对照 F02-1 已冻结 31 项已有身份/凭证/审计字段、2 项旧重复管理员凭证排除项；未来拟议独立迁移含 1 项 `credential_epoch` 列及独立 Session 表 9 列、2 项索引，**全部未施工**。
5. `schema-migration-advice.md`：原子迁移、完整约束、DDL失败整事务回滚、上线失败前滚/禁用服务策略、审计脱敏与并发测试责任，禁止重写历史 Initial DDL。
6. `authority-test-coverage.tsv`：15 项 PDM 权威到静态检查/未施工责任对应；技术别名未成为新权限。
7. Node 假数据测试：未知身份、不同主体、禁用、首次强制改密、不能从旧会话取得权限、凭证世代变化、管理员与Employee隔离、4S资格、scope/state、审计/秘密不回显，以及实际冻结矩阵及编译 SQL 字段交叉核验。

## 三、真实 CI 证据（待补）
- 将以**本报告最后提交产生的新 HEAD 的同 SHA completed/success**为准填入。
- 执行命令：`npm run check`、F02-G0 三项审计、F03-G0 假数据回归、`node f03/login-design/verify-contract.mjs`、`node --test f03/login-design/test/*.test.mjs`、`node f03/login-design/benchmark-scrypt.mjs`。
- 合成 KDF 成本只报告时长与参数，不输出或上传盐、密码、哈希或真实令牌。

## 四、未执行事项与风险
- 无 PostgreSQL 连接/建表/迁移、真实密码校验、真实登录/HTTP服务、真正会话签发或 Cookie、真实角色授权、账号、手机号/微信、JYT、业务/生产库、并发事务/限流实现或部署；全部 **NOT_RUN**。
- scrypt 参数与生产容量需要 A 裁定和部署场景压测；Argon2id 及其依赖未引入。
- 现有单凭证主表保持冻结；新增结构只在精确 TSV 作为待裁定独立版本。身份审计不能保存凭证敏感值。
- 真实 session 撤权及时性、跨节点一致性、主身份离职后复职、4S 资格及最后管理员治理并发需要 F03-1 实施批/F03-2 的独立授权测试。
- F03-1 实现批、F03-2/3、F02-2/3/4、F04 及 C/H01 合并未授权。**`F03_1_G0_ACCEPTED=NO`，等待 A 独立验收**。
