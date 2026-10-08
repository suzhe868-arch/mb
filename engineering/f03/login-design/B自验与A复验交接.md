# 名邦汽车 V1｜F03-1-G0｜B自验与A独立复验交接

日期：2026-10-09（Asia/Singapore）。A 签发单：`07_重建工作区/F03-1-G0_A主控登录安全方案施工放行_2026-10-09.md`。

状态：**DESIGN_ONLY / B_STATIC_TEST_PASS / READY_FOR_A_REVIEW / F03_1_G0_ACCEPTED=NO**。报告单独提交后形成的新 HEAD 仍须以其自身 CI 复核。

## 一、施工基线
- `feat/f03-login` 基于 main `872ae597c7e5ced71b82be0433fb2be94bdc3ee8` 新建，未修改 main、旧验收分支、F02冻结SQL/checksum、PDM/IA/Low-Fi。
- 已验收 F03-G0 的合同与纯策略在 main，无需重做工程逻辑。F03-1-G0 本次只在 `engineering/f03/login-design/**` 和专用 `.github/workflows/f03-1-g0-login-design.yml` 添加文件。

## 二、方案交付与正反例
1. `password-session-design.md`：内置成熟 Node `crypto.scrypt` 候选、16B独立随机盐、scrypt N32768/r8/p3（OWASP推荐档之一）、32B结果、64MiB maxmem、格式自描述及版本升级、KDF并发风险和 A 待裁定项。
2. `credential-state-machine.tsv`：14 条凭证与主体状态处理义务（受限改密、正常会话、重置、禁用、复职和异步治理责任）。`state-model.mjs` 仅在假数据上做决策。
3. `session-contract.md`：opaque CSPRNG 会话、HMAC摘要、Server撤销与凭证世代、有限期限、Cookie/CSRF、当前主体/PC资格/权限重查、匿名错误和限速责任。
4. `schema-delta.tsv`：机械对照 F02-1 已冻结 31 项已有身份/凭证/审计字段、2 项旧重复管理员凭证排除项；未来拟议独立迁移含 1 项 `credential_epoch` 列及独立 Session 表 9 列、2 项索引，**全部未施工**。
5. `schema-migration-advice.md`：原子迁移、完整约束、DDL失败整事务回滚、上线失败前滚/禁用服务策略、审计脱敏与并发测试责任，禁止重写历史 Initial DDL。
6. `authority-test-coverage.tsv`：15 项 PDM 权威到静态检查/未施工责任对应；技术别名未成为新权限。
7. Node 假数据测试：未知身份、不同主体、禁用、首次强制改密、不能从旧会话取得权限、凭证世代变化、管理员与Employee隔离、4S资格、scope/state、审计/秘密不回显，以及实际冻结矩阵及编译 SQL 字段交叉核验。

## 三、2026-10-09｜A 定向复核两项整改（当前有效）

**当前整改状态：** `B_TARGETED_CHANGES_FIXED / SAME_CODE_SHA_CI_SUCCESS / A_REVIEW_PENDING / F03_1_G0_ACCEPTED=NO`。旧 p=1 方案与旧 CI 只保留历史追溯，不得用于这次 A 复验。

### A-01｜治理身份绑定及目标状态

- `state-model.mjs` 新建共同目标校验 `principalFacts`，每次 `ADMIN_RESET_PASSWORD / DISABLE_CREDENTIAL / ENABLE_CREDENTIAL / SET_INITIAL_PASSWORD` 都必须独立验证合法 PC `account` 的 `kind/principalId/employeeId|systemAdminId` 与 `subject.kind/id` 一致且事实状态完整。`governanceTargetBound=true` 只是另一个必要条件，**绝不能覆盖不同 kind 或 ID 的硬拒绝**。
- 逐操作的假数据状态约束：

| 意图 | 账号状态 | 主体状态 | 结果与效应 |
|---|---|---|---|
| `ADMIN_RESET_PASSWORD` | enabled | active | 可由独立授权治理者重置；强制改密、提升世代、撤销旧会话并审计 |
| `DISABLE_CREDENTIAL` | enabled | active 或 inactive | 可授权禁用；包括主体已 inactive 时的安全撤权；提升世代并撤销全部旧会话 |
| `ENABLE_CREDENTIAL` | disabled | 必须 active | **合法正例**：启用但不恢复旧会话，保持强制改密标志、提升世代、撤销旧会话并审计 |
| `SET_INITIAL_PASSWORD` | 新建且 enabled / forcePasswordChange=true，明确当前初始开通事实 | 必须 active | 初始化当前唯一 PC 凭证的哈希，提升世代、强制改密、撤销旧会话并审计 |

- 拒绝测试包含账号与主体 kind 不同、ID 不同（含 Employee 与 System Admin）、仅有 `governanceTargetBound=true` 但绑定无效、inactive 目标重置/启用/初设、已 enabled 时重复启用、已 disabled 时重复禁用/重置、初始开通事实缺失、epoch/force 状态缺失等。所有拒绝不得有可执行 effects。
- 注意 `initialProvisioning` 目前仅是**由假数据模拟的可信后端状态事实**，以后真实服务不得从 HTTP 传入的布尔量直接信任；真正创建账号/重置凭证还须 F03-1 实现批另行放行。

### A-02｜OWASP scrypt 成本档同步

- 密码方案 `password-session-design.md` 与 Node 合成测试 `benchmark-scrypt.mjs` 均从 **`N=32768,r=8,p=1` 改为 `N=32768,r=8,p=3`**；16B 独立 salt、32B 导出结果、64MiB maxmem 提议保持不变。
- 依据：[OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) 的 scrypt `N=2^15,r=8,p=3` 推荐档。合成 KDF 性能测试两次 **199ms / 190ms**（仅 Node 22 GitHub runner 环境），不输出盐、派生结果、密码或令牌；不冒充生产压力测试、真实密码写入或参数最终裁定。
- `test/schema-contract.test.mjs` 新增方案与可执行探针一致性断言，禁止 `p=1` 旧参数回归；凭证状态表和 Authority 覆盖表已同步。

### 真实代码 CI 记录

- 整改**源码版** SHA：`15c02f15eece2f7ee5a893d173b554f7dc7fba12`，对应 [CI #37856077778](https://github.com/suzhe868-arch/mb/actions/runs/37856077778)：`completed/success`。工作流 job [#113580457749](https://github.com/suzhe868-arch/mb/actions/runs/37856077778/job/113580457749)。
- 日志：本批 Node 假数据 **19/19 PASS、0 FAIL**，F03-G0 **34/34 PASS**，F01 **13/13 PASS**，F02-G0 CL/ALL/SCOPE 静态检查 **PASS**；31 原有字段与 2 个旧重复凭证排除项仍通过冻结结构比对。
- 已上传 `f03-1-g0-login-design-evidence`，artifact `11583633645`，保存状态模型测试、冻结结构只读核验和 p=3 合成成本实证。
- **交接报告落库会形成新提交 SHA**：A 应以最后一次 `feat/f03-login` HEAD 以及它的**同一 SHA 完成且 SUCCESS 的 CI**为最终提交验收依据；不能把上一版的 run 误标为新 SHA 测试。

**未执行：** 真实账号密码校验、账号治理持久化、会话签发、HTTP/Cookie/限速、真实 DB 连接/DDL/迁移、并发安全、生产数据及部署。上述实施须另行批准；本轮仅静态方案与合成测试。后续 A 仍需裁定 scrypt 成本/并发预算、治理可信事实来源及事务一致性。

## 四、历史首次交付 CI（p=1，已被本轮取代）

**已核验源码提交 SHA：** `c5bb9d966ebcc3893d40d4db271814073d03f96b`。
- [F03-1-G0 CI #37855224165](https://github.com/suzhe868-arch/mb/actions/runs/37855224165)，`head_sha=c5bb9d966ebcc3893d40d4db271814073d03f96b`，`completed/success`；[完整 job #113577670220](https://github.com/suzhe868-arch/mb/actions/runs/37855224165/job/113577670220)，全部关键检查成功。
- 真实输出：F01 **13/13 PASS**、F03-G0 **34/34 PASS**、F02-G0 CL/ALL/SCOPE **PASS**、F03-1-G0 **15/15 PASS（0 FAIL）**；包括从冻结 F02-G0 矩阵和 F02-1 编译 Initial SQL **只读机械核对** 31 已纳字段、2 排除字段、76 表、464 字段、160 外键，拟议迁移列/索引只在 TSV 中存在。
- Node22 `crypto.scrypt` 两次瞬时**合成**可用性测量：`N=32768,r=8,p=1,maxmem=64MiB,keyLength=32B,salt=16B`；分别 **46ms、44ms**。样本 KDF 派生结果、盐与合成口令均未写磁盘或输出；性能值不能外推真实主机容量和安全阈值，参数须 A 复审。
- 已上传工件 `f03-1-g0-login-design-evidence`，artifact ID `11583831530`（来自该 SHA CI）；内含假数据测试日志、静态无数据库边界检查、scrypt 成本日志，不包含 pg_dump（本批无数据库）。
- 初始 [CI #37855122827](https://github.com/suzhe868-arch/mb/actions/runs/37855122827) 的冻结矩阵测试相对路径错误已修复；认证成功的纯合成事件另新增 `passwordProofVerified===true`、`rateLimitPassed===true` 双项显式证明守卫与负例。这些整改包含在本次成功 CI 代码 SHA。
- 实际工作流命令：

```sh
cd engineering
npm ci --ignore-scripts --no-audit --no-fund
npm run check
node f02-g0/closure-audit.mjs
node f02-g0/full-domain-audit.mjs
node f02-g0/scope-audit.mjs
node f03/verify-contract.mjs
node --test f03/tests/*.test.mjs
node f03/login-design/verify-contract.mjs
node --test f03/login-design/test/*.test.mjs
node f03/login-design/benchmark-scrypt.mjs
```

本报告自身新增提交之后，A 应以分支最终 HEAD 对应的**新 CI SUCCESS**作为交接精确证据，避免引用上一版源码 CI。

## 五、未执行事项与风险
- 无 PostgreSQL 连接/建表/迁移、真实密码校验、真实登录/HTTP服务、真正会话签发或 Cookie、真实角色授权、账号、手机号/微信、JYT、业务/生产库、并发事务/限流实现或部署；全部 **NOT_RUN**。
- scrypt 参数与生产容量需要 A 裁定和部署场景压测；Argon2id 及其依赖未引入。
- 现有单凭证主表保持冻结；新增结构只在精确 TSV 作为待裁定独立版本。身份审计不能保存凭证敏感值。
- 真实 session 撤权及时性、跨节点一致性、主身份离职后复职、4S 资格及最后管理员治理并发需要 F03-1 实施批/F03-2 的独立授权测试。
- F03-1 实现批、F03-2/3、F02-2/3/4、F04 及 C/H01 合并未授权。**`F03_1_G0_ACCEPTED=NO`，等待 A 独立验收**。
