# F03-2-1A｜可信当前权限事实读取与旧会话撤权（隔离真实PG16）

**阶段：仅A于2026-10-09放行F03_2_1A；F03_2_1A_ACCEPTED=NO；F03_2_ACCEPTED=NO；PRODUCT_BASELINE=NOT_READY。**

- 基准：最新main `a2b41213479ef4e228d8131eb08099817d4797b7`，分支 `feat/f03-runtime-facts`；主控放行 `07_重建工作区/F03-2-1A_A主控方案合并与当前权限事实隔离施工放行_2026-10-09.md`。
- 文件严格限 `engineering/f03/runtime-facts/**` 与独立工作流 `.github/workflows/f03-2-1a-runtime-facts.yml`，只在GitHub Actions当次全新PG16封印库运行。main/F02/F03-G0/F03-1源码、runner、manifest和迁移不修改。

## 可信读取与授权边界

1. `current-facts.mjs` 调用已验收 `verifyAuthDatabase(auth.pool)` 精确PG16身份/版本/封印/物理指纹校验，然后复用 `IsolatedAuth.withSession(token,callback,{normalOnly:true})`；不实现新登录/凭证/会话/HTTP业务栈。已验收F03-1账号先锁→会话后锁、旧会话/epoch/受限/失效阻断直接沿用。
2. 同一现存F03-1短事务内通过**单条参数化SQL声明快照**读`pc_login_accounts`、`employees`、`roles`、`system_admins`、`permissions`、`role_permission_defaults`、`employee_permission_overrides`。BIGINT均转字符串，不用客户端ID代替subject；不存在权限行或异常多行默认拒绝；4S再次从真实个人明确allow验证PC准入。
3. 产品身份硬禁令高于个人deny、个人allow和模板enabled；独立System Admin不继承销售业务权限。F03-G0 `TECH_ALIAS_PENDING_A`只做现行权限事实读取，不把别名转为已批准；`role_default_permission_history`和个人历史不授予当前权。
4. **全部业务最终允许为false**：本小批无SG-01逐能力scope证据或可信对象状态，所以事实有权的最强结论是`CURRENT_CAPABILITY_PRESENT_SCOPE_AND_OBJECT_DEFER`，不等于业务授权；任何action不存在或身份/权限缺失则更早拒绝。产品业务路由和正式`server.mjs`完全不挂载。
5. `test-probe-contract.mjs`仅为**当次CI临时回环HTTPS测试**：只接受一个operation，拒绝客户端actor、role、owner、global、team；响应仅`code`，状态403，绝不返回完整facts、token/秘密、权限列表和用户字段，不部署。

## 时序边界与已明确未覆盖

- F03-1会话自身账号/会话锁与校验复用，身份/权限通过一个SQL statement读取其一致性快照。后续独立请求重查询当前状态，不在session或进程缓存role、权限、store、scope。
- 撤权提交前**已经获得的响应不能回收**；同一次已开始的请求可能合法地完成，但下一独立请求必须读到已提交撤权。权限表写入还未统一与会话锁协调：F03-2-2治理提交事务内版本复验/锁顺序由后续施工批准，此批不能冒充完整TOCTOU写事务防护。
- SG-01～SG-08、管理员控制面精确动作、团队/eligible/交接、电话关联、字段级敏感投影、真实业务对象更新/业务HTTP Guard和正式路由全部**DEFER/NOT_RUN**。SG-09直接复用现有模板历史表，不新增物理表或权限种子。
- schema-only及inventory CI附件只含数据库结构/迁移版本，不包含行数据、密码、哈希、token、cookie、电话。CI密钥与TLS私钥只在runner`/tmp`临时存在。

## CI测试与证据

在本分支推送时触发 `.github/workflows/f03-2-1a-runtime-facts.yml`，job独立启动PostgreSQL 16并通过已验收 `f03-1/runner.mjs --bootstrap/--apply/--verify` 创建/验证唯一当次库；`f03-1/fixtures.mjs`仅提供合成账号，本批再插入合成权限行用于负例，不是产品权限种子。

- `tests/integration.test.mjs`：真PG16+F03-1真实登录/首次改密、受限、角色/身份、Admin隔离、模板/个人覆盖最新提交读取、4S明确个人allow和撤销、历史不可代替、失效epoch、BIGINT超2^53安全精度、未知操作等。
- `tests/https-revocation.test.mjs`：新进程同run回环HTTPS临时探针，真登录/改密→正常旧session→外部PG连接提交撤权→**同token新HTTPS请求拒绝**。不挂正式server、不开放业务路由。
- `check-evidence.mjs`：在无DB连接情况下检查本次真正导出的schema-only/inventory，80表/487列/299约束/123索引、且只有F02 000001和F03-1 000002版本链，8类未批准的SG表不存在。
- 工作流同时跑已验收F01/F02-G0/F03-G0/F03-1-G0/F03-2-G0静态回归及F03-1原真实KDF、结构guard回归；最终`f03-1/runner --verify`再次核验全物理指纹/运行号封印。

本README不代替真实CI记录。A须核对**最终提交SHA对应的**`completed/success`真实run/job、测试覆盖表、schema和inventory及sha256、残余风险。B不合并main、不进入后续批次。
