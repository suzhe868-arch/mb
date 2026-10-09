# F03-2-1A｜B工程自验与A独立复验交接（2026-10-09）

**当前：B施工证据整理 / F03_2_1A_ACCEPTED=NO / F03_2_ACCEPTED=NO / PRODUCT_BASELINE=NOT_READY。**

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
- `check-evidence.mjs`：审查CI实际导出的schema-only/inventory并保证80表、487列、299约束、123索引、只有2条认可迁移，无SG01～08新表；artifact只含日志/结构和sha256，不上传任何凭证行数据或秘密。

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
