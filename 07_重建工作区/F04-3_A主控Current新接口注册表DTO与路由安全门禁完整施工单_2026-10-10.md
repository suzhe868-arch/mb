# 名邦汽车 V1｜F04-3｜A主控完整工程施工单：Current新接口动作注册表、DTO权限合同与真实PG16安全路由门禁

> 2026-10-10 Asia/Singapore 正式签发｜**A_RELEASED_FOR_B / B_NOT_STARTED / CI_ONLY_NOT_PRODUCTION**；下一责任B，指定新分支 **`feat/f04-3-current-action-api-registry`**，在实际开工时从GitHub最新main新建。A签单不意味着B已经开分支或执行，更不意味着F04-2将旧218条URL恢复。B在授权技术范围一次性开发、自测、整改、跑真实CI、全套归档再交A独立验收，无需用户逐项批准。

## 0. 权威与已验收事实

1. 正式Final PDM-01～25及Current IA/Low-Fi为业务Authority；`07_重建工作区/B工程完整施工路线图_F01至F08.md` F04范围是Current OpenAPI/DTO、路由注册、权限/错误/幂等合同、生成物一致性，**不等同**旧218接口直接上线。
2. F04-1正式已验收合并PR26，F04-2正式已验收合并PR27。最新F04-2 A报告`07_重建工作区/F04-2_A主控二轮独立验收PR27正式合并与F04-3交接_2026-10-10.md`；B正式最终HEAD `d09038917c91446eb8914f53f3e1881345ba7d1a`、原生Actions `38041020114`同SHA**28/28独立PG16成功**、PR27 merge SHA `70d1f68490c851823cf5d1415c703667c0305cb4`。封印原旧代码/CI、M94 94表与G000014独立版本。
3. 历史`legacy-endpoint-inventory.tsv`有198真实path/218 method+path、62冒号路径，三条禁止恢复Collector连接永远RETIRE/FORBIDDEN；F04-2 Current evidence matrix为**215旧候选=23条相同当前动作引用可证+192条真实缺口**，但全部**`decision=UNDECIDED/current_stage=CONTRACT_ONLY`**，没有任何一个旧URL凭此获得生产准入。每条Current合同必须追溯到真实IA动作/Final规则，不能把23条匹配当23个“已上线”URL。
4. 当前F04-1只是CI-only HTTPS最小Customer object-scope只读与Vehicle硬拒，F04-2只是CI-only System Admin→4S治理最小身份证明（当前4S商户与员工绑定无法证明时403）。F05 Vehicle/Team/4S可信归属和价权、F06 Lock/Waitlist/Transaction、F07 JYT publisher_id电话/CDN仍无运行期受权落地。任何需要未证领域事实的真实业务route都硬拒。

## 1. F04-3A｜正式Current动作到新接口/DTO的可执行合同目录

A. 从最新main已签`03_证据_C_IA_V5_Current/IA_CURRENT.md`、`IA_V5_ACTION_CONTRACT.md`、`IA_V5_PERMISSION_CONTRACT.md`、`IA_V5_CANONICAL_GUARD_CONTRACT.md`、`04_LOW_FI_NAVIGATION_REGISTER.md`、`04_LOW_FI_PAGE_MANIFEST.md`及对应PDM Final读取真实Current动作。建立**新的、版本化的Current接口合同目录**（建议`engineering/f04/current-action-api-registry/current-route-contracts.tsv`及`current-openapi.yaml`/对应可执行schema，形式由B在技术边界内自定）。旧`/customer/`、`/staff/`、`/admin/`历史path不是现行Authority，**任何新HTTP path均由当前动作/合法主体/独立业务对象驱动重新定义**；本批所有新路径仅为`CI_ONLY_PROPOSED`，不得在生产路由注册。
B. **至少覆盖已验证23条旧候选各自对应的Current业务动作**的显式合同：操作ID、消费C/E/P具体动作和页面、源PDM Final+行/引用、HTTP method及拟定规范化新path、请求DTO/响应字段白名单/版本、会话身份主体、独立permission、对象级归属范围、4S硬拒/个人deny、实时状态/幂等/审计、错误码、业务领域Owner、未来消费F04/F05/F06/F07及真实`implementation_state`。共享Current动作可以多个消费页，但合并动作不能混同不同权限；尚无同动作证据不能为凑数转为已准入API。**对215旧候选的23/192/3保留只读连接**，不更改F04-2源矩阵和旧来源，另列一个“旧ID → Current动作合同 → 证据/缺口/未来Owner”桥接表，保证新合同不会误把SOURCE_GAP填KEEP。
C. 同时从Current IA识别至少一组**旧218历史URL未覆盖、但Final/IA正式需要的现行新动作**作为`NEW_CURRENT_ACTION`候选，如锁车申请6小时审核状态、安全手机号授权、分享owner/CRM负责人、安全查价模式、商户账号实际治理等；只能在具备同主体/对象/Final权威后写合同，缺实际下游实现则`DEPENDENCY_BLOCKED`，不可以有生产成功假象。**New Current动作不等于ADD已批准**。
D. 对每条拟议Contract明确分开：`PRODUCT_AUTHORITY_EVIDENCE`、`HTTP_CONTRACT_REVIEW_STATE`、`CI_ROUTE_TEST_STATUS`、`DOMAIN_IMPLEMENTATION_STATUS`、`PRODUCTION_ENABLEMENT_STATUS`，保守默认`NOT_APPROVED/NOT_IMPLEMENTED/NOT_PRODUCTION`。源真实矛盾归`CONFLICT_REQUIRES_USER`而非代码悄悄裁决。导出OpenAPI/DTO必须有可执行校验，源码→产物一致，拒绝手动生成表混入未知路径、参数、敏感字段。

## 2. F04-3B｜真实隔离PG16+HTTPS新路由注册与边界验证

A. 在`engineering/f04/current-action-api-registry/**`独立新增可复用的**Current route policy registry/validator/router**与最小非生产HTTP测试入口；不得修改正式`engineering/src/server.mjs`或注册生产端点。启动门禁至少继承F04-2的真实CI环境、显式F04-3授权开关、新建隔离非特权PG16、127.0.0.1 TLS、F03 Session与M94/G14准确目录封印，失效一律停止，不相信伪造Host/Origin/Header/User-role。
B. 路由级能力与字段授权必须以现时F03/F04-1真实数据库会话、scope/binding/Target resource和当前角色验证，不能以Current IA页面上的“可见”推导真实API读写权限。按来源隔离Customer、Employee、SystemAdmin、4S Member；前台客户等级普通/粉丝/VIP的查价显示需要F05现时真实账本/物理证据，不得凭传来的`vip=true`或前端Price强行通过。员工内价和电话与车辆公开价是独立capability和出口；Customer/Vehicle/4S商户未证对象关系一律fail closed。**合法正例只可走已经有真实数据库证明的最小权限/最小安全字段（例如现有F04-1目标Customer-id CI只读）**。未知业务Action/Method/参数严格404/405或拒绝，不能笼统200。
C. 正式F04-3不作任何真实Customer/Vehicle/Consultation/Lock/Waitlist/Transaction/Refund/4S Account创建修改或集成写入。对缺真实服务的合同行为按确定性规范返回`NOT_IMPLEMENTED/DEPENDENCY_BLOCKED`或权限拒绝，**不可`200/成功`假装落地**。旧3条Collector禁恢复和旧218条除已有已签F04模块安全合成入口外不得因新registry复活。对同一路径不同method、重复operationId、相撞路由模板、大小写、冒号path、参数路径及恶意path traversal、DTO泄密字段、登录退出/撤权/owner变化、跨店、4S互管、SystemAdmin越业务权限、CSRF、过期/重放/幂等键、缓存导出/打印/Copy边界执行真实负例。
D. 输出`B端安全威胁矩阵`、`当前动作与DTO原始来源/负例清单`、`F04↔F05/06/07/H03/04真实依赖清单`，不能把所有未解决的接口Authority汇成“已开发完成”。

## 3. F04-3C｜独立CI 30/30真实PG16、证据封印与交接

1. 白名单仅允许**新增**`engineering/f04/current-action-api-registry/**`和**新增**`.github/workflows/f04-3-current-action-api-registry.yml`；不得修改F04-2/1已签源码或工作流、旧F03旧CI/Service、迁移000001～000014/原始M94/G14封印、正式server、产品Final、Current IA/Low-Fi或设计分支。新包通过import/wrapper复用既签安全代码。
2. B最终须取得**30/30真正彼此独立非特权PostgreSQL 16 GitHub Actions jobs success**，完整冻结F04-2原**28个独立PG16作业**和其实际旧新用例，另增加**2个各自全新PG16实例的job**：Current Source/OpenAPI/DTO证据+生成物验证；隔离TLS+真实F03/PG16 Current安全路由正负例。两新增各独立跑原M94全目录校验（需G000014时独立使用其对应seal），不能合并旧job数量、修改旧jobs脚本或只依据缓存。每份新job都归档原生schema-only、full catalog、inventory、frozen-source/contract SHA、sha256sums、完整原生测试日志、job ID和完整GitHub Actions artifacts，保证源commit/head_sha严格相同；保留对应版本旧值封印。
3. CI追加针对旧`SOURCE_GAP`->批准URL、旧禁恢复Collector复活、未证4S对象scope、系统管理员直接读取Vehicle、Customer等级伪造、Consultation/Waitlist主体混淆、DTO泄露电话/VIN/内价、禁止修改真实生产账户/业务等负例，并保证新Current操作目录**不会依照URL前缀推导业务PDM Domain/Owner**。
4. B在已授权范围自行修复完整代码、类型/链接/Schema、业务语义、真PG16新旧完整回归、最终git diff审查，归档中文`engineering/f04/current-action-api-registry/B全包自验与A复验交接.md`、Authority差异表与全部测试证据。交接声明哪些是真正`CI_ONLY_TESTED`、哪些是`BLOCKED`及下游负责，不能冒领生产。
5. 只有最新B分支HEAD=GitHub run.head_sha、**30/30真正PG16 jobs均`completed/success`**、2份新原生Artifacts齐全、无越权/假通过、白名单合规才`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。否则B继续在**同一分支**整改并重跑，A下一次独立验收前不得合并main，不得开始F04-4或F05真实业务。

## 4. 下游与不可超越边界

- F04-3是**可运行、可校验、受限合成的Current新接口合同及路由安全基础包**，不是全量C/E/P生产业务API；它必须为真实F04后续、F05车辆/价权/CRM、F06锁车候补/资金、F07 phone/CDN的业务实现提供可信、不会越权的契约与消费门禁。
- 禁止恢复Collector旧连接配置GET/PATCH/TEST、单独`can_call_wholesale_phone`等禁恢复项，禁止依旧业务旧API覆盖Final。生产上线、新DDL/商户可信归属、真实4S账号CRUD、真实微信/JYT/飞书及资金写入均不在授权范围。
- C/H01视觉独立且尚未最终A验收，H03/H04应用与V1产品总基线继续**`NOT_READY`**。A/B/C分支职责和“先完整施工自验—后A独立验收—仅A合并”继续执行。

**正式放行状态：`F04_3_A_RELEASED_FOR_B / B_NOT_STARTED / BRANCH=feat/f04-3-current-action-api-registry / 30_INDEPENDENT_REAL_PG16_JOBS / PRODUCT_BASELINE_NOT_READY`。**
