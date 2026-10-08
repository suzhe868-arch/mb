# 名邦汽车 V1｜F03-G0｜身份与会话安全合同

> 类型：静态设计与工程边界合同，**不是已实现的登录、会话、动态鉴权或数据库结构**。签发依据：`07_重建工作区/F03-G0_A主控正式施工放行_2026-10-09.md`。Authority：PDM-02 Final §§1/3/4/5/6/9/10/12、PDM-22 Final §§2/3/7/8、PDM-01/03/05/09/10/15～21/25 Final。

## 一、当前唯一身份来源

| Principal | 持久身份 | 可信证明候选 / 后续批次 | 运行授权边界 |
|---|---|---|---|
| 名邦 Employee | 原 `employee_id`；当前主角色 sales/manager/store_manager 唯一；当前门店唯一 | PC 密码认证成功后生成可撤销会话，F03-1 待决 | 当前 active + 当前模板/个人覆盖 + scope + object state；inactive 立即失效 |
| 4S Employee | 仍为稳定 `employee_id`；主角色 four_s，不建立 4S 组织 | 同 PC 账户凭证体系；是否允许 PC 车辆管理由明确授权决定 | P02 仅自己的合法 4S Vehicle；CRM/Lock/Transaction/P04/P05/名邦内部价/一键转名邦 hard DENY |
| System Admin | 独立 `system_admin_id`，不复用 Employee 身份 | PC 独立主体类别，首个账号 bootstrap，后续 active Admin 治理 | 治理控制平面；不能以此身份作为销售、接客、owner、业务负责人 |
| Customer | 持久 `customer_id`，微信身份与手机号属于不同属性 | 微信官方身份与手机号绑定由后续明确授权接入 | 不使用 PC 密码或 System Admin 会话代替 Customer 微信身份 |

同一真人具有两个不同主体，不合并角色、凭证账户、权限事实、owner 或审计主体。任何“身份转换”必须重新完成对应身份验证；不允许把一方已有业务权限继承给另一方。

## 二、PC 单一凭证权威

1. **仅 `pc_login_accounts.password_hash` 是 Employee/4S/System Admin PC 密码凭证唯一存储位置**；不在 `employees`、`system_admins` 新增账号或密码副本。
2. 只接受完成密码证明的当前主体身份；登录账号与 `employee_id`/`system_admin_id` 需独立映射，两个主体永远不能同时出现在一条合法凭证关系中。
3. 后台设置初始临时密码或要求改密时，首次成功认证只取得“限定改密”会话；在 `force_password_change` 为真时，正式业务、治理、查询敏感字段全部拒绝；成功改密才申请正常会话。
4. 密码哈希方案、计算成本、尝试限速、错误次数防护、解锁、临时密码有效期、会话存储介质、撤销机制属于 **F03-1 待 A 审定**；F03-G0 不为其引入服务、数据库表、配置或密钥。
5. 登录失败响应不揭露账号是否存在；密码、哈希、令牌、重置码等不得进入日志、审计或 CI 工件。敏感错误只返回可公开的通用原因及受控追踪 ID。
6. 4S 不存在第二套 PC 密码、第二 Employee，System Admin 不存在名邦员工默认业务授权。

## 三、信任边界与事实新鲜度

| 信任层 | F03-G0 允许 | 运行期必须做但本批 NOT_RUN |
|---|---|---|
| 请求 Cookie / Bearer / 微信凭据 | **不读取、不生成** | 验签、issuer/audience、签名算法/轮换、过期、session id、防重放，不能信任客户端声称的角色或权限 |
| 本次纯权限输入 | 由假数据提供明确的 `actor`、`facts`、`resource`，必要事实缺失则拒绝 | 由受信服务端事实解析器从真实持久层加载当前角色模板、个人 allow/deny、scope、account、object state |
| 客户身份与员工/管理员身份 | 不跨用；只模拟 Employee/4S/System Admin 控制/业务边界 | 微信身份、PC 登录及会话完全分离；不得用手机号做永久身份 ID |
| 角色/个人覆盖 | 使用当次提供的事实重新决策；过期的模拟 session 不授予权限 | 角色模板实时更新、个人 deny 优先、撤销生效并阻止旧会话/旧缓存继续操作 |
| data scope | 依据主体 ID、对象 ID、关系（owner/responsible/assignee/store/team/four_s_owned）、明确当前对象 grant 判定 | 关系与授权记录应由受信存储证明，必须防缓存漂移、越权 grant、跨主体重放 |
| object state / account status | 缺失/不在明确允许状态即拒绝 | 提交时事务内重验，对可能并发变化的事实采用合适的锁/版本检查 |
| 响应 payload/历史导出 | 纯函数白名单演示，排除敏感字段 | F03-3/F04 按当前 scope 字段级过滤查询/响应/导出/分享/缓存，不返回数据库整行 |

## 四、撤权、离职、调店和交接

- inactive/离职：当前会话必须立即失去业务资格；`employee_id` 不变；历史关系、审计、当时角色和当时门店保持不可变。
- 复职：仅恢复稳定身份，不自动恢复旧 permission、Customer、工作责任、session；接客默认关闭。
- 计划调店、降权、主角色转换：如失去当前 owner/负责人资格，必须先完成 Handover Batch 后生效；突然失效先撤权再合法交接，禁止为交接继续开放失效账号。
- Customer 当前 owner、Demand responsible、Consultation assignee、Lock/Transaction responsible 等不可混成同一 `owner` 字段。纯决策中只使用指定关系与当前事实，不推导隐含关系。
- System Admin 管理账号/模板不等于可直接执行业务；同一真人应切换独立 Employee 账号后再按实际权限授权。
- 最后一个 active System Admin 的停用禁止、最后一个 active+eligible+accepting 接客员工的正常关闭保护，需要**F03-2 后续真实并发事务**，不能以静态角色规则代替。异常被动池空需另走 `owner_assignment_pending`，不得用 System Admin 做销售兜底。

## 五、权限计算顺序（本批纯决策实现）

1. action 必须来自受控工程合同，未知/废弃动作拒绝。
2. actor 必须有有效主体身份和当前 active 状态；System Admin 与 Employee 身份不得混用。
3. 产品级 hard DENY 最优先；4S 的禁止项不能被个人 allow/模板或管理员配置绕过。
4. 当前业务对象类型、状态、来源和关联事实必须完整、合法。
5. 每项所需 capability 在**当前**模板允许或有效个人 allow 下取得；个人 deny 与 hard DENY 优先拒绝。
6. 每一项 capability 独立通过当前主体与当前对象的 data scope 检查；缺少/跨客户/跨车源/跨主体必拒绝。
7. 历史、价格、上游发布人电话使用后端白名单和独立敏感字段判断；Internal Mode 只是入口投影，并不是授权来源。

当前纯函数没有验证任何真实 session、数据库来源、并发竞态、微信/JYT、API、端到端业务或缓存撤销；故所有运行链路仍 **NOT_RUN**。

## 六、F03-1 / F03-2 / F03-3 逐项交接

- **F03-1**：A 先审定密码哈希与会话技术选型、服务端可撤销会话存储、首次强制改密、账号失效、限速、凭证重设和匿名错误码。若需新增表/列，需提供精确差异及独立原子迁移设计；不能回改已经冻结的 F02-1 `000001_current_initial` 和 SHA。
- **F03-2**：当前 role/permission/override/scope 读取及管理事务、旧会话新事实失权、最后管理员/最后接客者并发保护、治理审计、handover batch；必须在获批的独立测试环境进行实际数据库验证。
- **F03-3**：受控字段投影、导出、缓存、分享、敏感电话和价格等具体业务 adapter。与 F04 后端路由/请求合同明确衔接；不能把 G0 假数据模块宣称成已经装配的 API。

## 七、英文 capability 映射审查原则

现行 Final 已明示的 `customer.phone.manage`、`customer.account.disable`、`vehicle.model.manage`、`matching.rule.manage` 直接引用。当前只有中文能力名时，`permission-contract.tsv` 标为 `TECH_ALIAS_PENDING_A`，仅作为纯函数测试中的**工程别名**；不表示新增产品权限、已批准代码标识或默认角色种子。A 需逐项确定映射才能供后续真实接口接入。
