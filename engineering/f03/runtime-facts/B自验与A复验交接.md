# F03-2-1A｜B工程自验与A独立复验交接（2026-10-09）

**当前：B施工证据整理 / F03_2_1A_ACCEPTED=NO / F03_2_ACCEPTED=NO / PRODUCT_BASELINE=NOT_READY。**

## A首轮 CHANGES_REQUESTED 补测与补证（R1、R2、E1，2026-10-09）

依据 `main/07_重建工作区/F03-2-1A_A主控首轮复验与补测补证清单_2026-10-09.md` 对首轮 `319db71604e1efd2ce12dbba7990c7ed1d3bc62a` 的复核结论，B只在原工作范围整改。

**逐项闭合台账：** `A首轮R1-R2-E1补测补证闭合表.tsv`，各项状态`B_FIXED_A_REVIEW_PENDING`，绝不冒称A已通过。

- **R1**：`tests/integration.test.mjs` 增加 R1-01/02/03。R1-01在真实PG16用**独立连接**调店，使用*同旧会话真实事实读取器*拦截其单条可信SQL响应，仅在测试内断言store_id实际依次为1→11→1，不更改HTTP回应，不放开业务授权。R1-02对4S CRM/Lock/Transaction/内部价每项作`HARD_DENY_FOUR_S`及对Admin作`SYSTEM_ADMIN_NO_BUSINESS_RIGHT`确切原因断言，包括4S注入现存权限行的负例。R1-03针对无效ID、跨主体ID混合、重复候选行做受控测试内SQL行篡改，不破坏物理DB CHECK。
- **R2**：增加两个与本批权限测试库**分别完全隔离**的全新PG16作业，均按原F02 000001→F03-1 000002、当次run封印及`f03-1/fixtures.mjs`建立一次性测试库；**直接运行未修改的** `f03-1/tests/integration.test.mjs` 和 `f03-1/tests/https.test.mjs`，而不是仅运行其静态设计测试。首轮补测源CI `37890672133` 独立安全回归分别为集成11/11、真实HTTPS 4/4，原始登录与HTTPS测试文件、服务端和迁移均原字节不变。
- **E1**：归档源run `37890672133`、工程 SHA `a64398702706bbb035d744965dc485bf4e650146` 的真正同一CI附件原字节到`evidence/pg16_schema_only.sql`、`pg16_inventory.json`、`sha256sums.txt`，详见`evidence/SOURCE.md`和`evidence/E1_原始证据与跨运行校验说明.md`；新`evidence-hashes.mjs`重算每个原始Buffer的真实SHA256并严格对照其对应manifest。归档SQL原始哈希`d8b97b54f5beea7bcc07eee2dd2762789ac913729d4645825f9b4cebf6e78b1f`，inventory哈希`98c8bbe019ba5025504873c8a77d73ef3a28382449a3bda199dedb4dd47e7119`。跨运行`pg_dump`随机成对`\\restrict`/`\\unrestrict`标记允许差异，但验证严格拒绝其他任何结构字节变化；原文和每次真实SHA不修改、不伪称相同。
- **复验用最终版本号**必须以本次交接后`feat/f03-runtime-facts`HEAD为准；首轮补测源run虽然3个job均completed/success且本批当前PG16 12/12、临时HTTPS3/3、原F03-1集成11/11、原F03-1 HTTPS4/4，但**不能代替含闭合表及归档的最终SHA成功CI**。CI另外执行F01/F02/F03原静态回归、原F03-1隔离KDF与结构Guard；真实数据库仍为仅CI一次性空PG16。
- 保留原有产品与施工限制：没有新表、没有业务接口、没有真正调店治理/锁车/成交、没有完整逐capability scope和目标状态Guard，不进入后批，不合并main、不改C。

## 基线与授权
- main放行基线：`a2b41213479ef4e228d8131eb08099817d4797b7`；B新分支：`feat/f03-runtime-facts`。
- A放行单：`07_重建工作区/F03-2-1A_A主控方案合并与当前权限事实隔离施工放行_2026-10-09.md`；原工作单正式增补同日期。
- 已验收F02→F03-1唯一真实PG16结构版本链在当次一次性GitHub Actions新库以`f03-1/runner.mjs --bootstrap/--apply/--verify`复用，后续只插入和更新合成权限事实**行**。无F03-2物理DDL或迁移，无新业务HTTP API，原工程文件字节不变。所有实际验证须凭CI最终HEAD证据，不以既往运行代替。

## 交付项目与覆盖
- `current-facts.mjs`：复用已验收F03-1`verifyAuthDatabase`物理/版本/run seal Guard以及`IsolatedAuth.withSession(token, callback, {normalOnly:true})`；在现有account→session锁下用单条参数化SQL同一语句快照读取当前主体、主店、角色和role/personal permission。没有第二套登录栈。
- `test-probe-contract.mjs`：只识别一个已冻结operation；任何actor/role/team/global/owner/SQL或重复Cookie拒绝；正式server绝不挂载。
- `tests/integration.test.mjs`：全新PG16的真实登录/改密、动态模板与个人allow/deny/revoke、系统管理员与4S准入、失效会话、BIGINT高精度、无scope无业务grant等。
- `tests/https-revocation.test.mjs`：真实临时回环HTTPS，正确登录→首次强制改密→正常会话→第一次请求→独立PG连接撤权并提交→**原token下一HTTPS请求实际拒绝**。
- `45项合同覆盖映射.tsv`：全45条原F03权限合同反向逐条列明当前验证、HTTP负例、后批责任和DEFER；没有把22项未授权操作写成已执行。
- `测试覆盖表.tsv`：G01～G15实际测试/证据及未来审查范围。
- `check-evidence.mjs` + `evidence-hashes.mjs`：对CI导出原始Buffer实际重算SHA256，对源归档原始Buffer用原归档manifest独立核验，严格只允许跨run SQL中成对`pg_dump`随机\restrict标记差异；inventory逐字节相同。验证80表/487列/299约束/123索引、2条迁移、无SG01～08新表，且不上传行数据/密钥。

## 验收证据的精确读取路径
- 最新提交SHA = GitHub分支`feat/f03-runtime-facts`的HEAD；CI运行号 = workflow `f03-2-1a-runtime-facts.yml`针对该SHA的run，必须**completed/success**且所有步骤成功。
- 成功CI必须提供Job ID及名为`f03-2-1a-pg16-current-facts-and-revocation`的下载附件，包含`pg16_schema_only.sql`、`pg16_inventory.json`、`sha256sums.txt`、`pg16-current-facts-tests.log`、`https-revocation-tests.log`。
- `f03-1/runner.mjs --verify`前后验证F02-1/F03-1迁移链、run seal与物理结构指纹；CI附件校验SHA以真实工作流输出为准。
- CI中间失败提交不算成功证据；如交接文档形成新HEAD，A仍要求这个**最终HEAD同SHA成功**。

## 明确剩余风险及A后续裁定
1. **范围事实不足**：`employee_data_scopes`无逐capability关联，SG01–08未获施工批准。当前有效模板/个人权限不等于最终业务授权，所有最终业务`finalAllowed=false`。下一批1B单独裁定物理关联/对象状态Guard。
2. **快照竞争**：F03-1服务端withSession锁住账号与会话，单条SQL看到当前主体/角色/默认/覆盖的一致语句快照；在此批没有治理写事务Guard或跨目标版本同步，不能宣称并发敏感写提交TOCTOU已解决。撤权后**新请求**重验、已完成响应不可擦除。
3. **别名与控制面**：`TECH_ALIAS_PENDING_A`只读取对应数据库permission_code的事实，绝不种子或升级为获批业务动作。System Admin仅独立控制主体；控制面范围/锁另批。
4. **客户和4S业务对象**：未执行当前车辆对象状态、顾客关系、优先级Grant、发布人号码、匹配与销售流程；4S的PC准入为现有个人明确allow，非业务车辆授权。
5. **环境范围**：仅CI一次性PG16+临时127.0.0.1 HTTPS，不能推断生产网络、已有数据库、正式服务端路径或分布式节点撤权一致性。未部署、无正式前端或跨环境效果。

交A复验后最多签发`F03_2_1A_ACCEPTED`。B不合并main、不推进F03-2-1B/2/3、F03-3、F04或C设计分支。
