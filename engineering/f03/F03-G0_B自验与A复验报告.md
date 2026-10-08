# 名邦汽车 V1｜F03-G0｜B 工程自验与 A 独立复验交接

> 2026-10-09｜A 放行：`F03_G0_AUTHORIZED / USER_APPROVED`；A 放行单：`07_重建工作区/F03-G0_A主控正式施工放行_2026-10-09.md`。
> 本报告记录 B 自验，通过后只提交 A 独立复验。状态：**`READY_FOR_A_REVIEW / F03_G0_ACCEPTED=NO`**；本轮仅纯 Node ESM 假数据静态检验，非真实会话或数据库授权验收。

## 本轮追加｜A 两项定向整改（2026-10-09）

> 当前为 B 整改自验记录，**不是 A 最终签发**。`F03_G0_ACCEPTED=NO`。以下为已验证**源码提交** `5a55dbb29d70c502c0b828af9205ffd35230046a` 的 CI；本交接文字提交后产生的新 HEAD 必须再核验对应同一 SHA 的 GitHub Actions SUCCESS，不得用先前提交的 CI 代替。

1. **车辆/客户主键缺失不得投影**：`policy.mjs projectRecord` 在已获当前身份、capability、scope、object state 许可后，另行强制要求 `vehicle.read` 的 `record.vehicle_id` 或 `customer.crm.read/customer.history.read` 的 `record.customer_id` 存在、有效且与授权 `context.resource.id` 严格相等。不存在、`undefined`、`null`、0、空字符串、对象/数组 → `RECORD_RESOURCE_ID_REQUIRED`；ID 存在却不一致 → `RECORD_RESOURCE_ID_MISMATCH`。所有拒绝均返回 `allowed:false,fields:{}`。
2. **历史嵌套敏感值绝不原样返回**：历史投影检查所有允许输出的 Customer 基础字段及历史 actor/role/store/event/time 字段。任意白名单字段含数组、对象、Date、函数或其它非基础标量时整体拒绝，错误 `UNSAFE_NESTED_HISTORY_VALUE`，输出空对象；未列入白名单的外层及嵌套数据始终不复制。嵌套史实未来如需合法展示，必须在后续获批批次为每个允许子字段建立独立投影规则，不能把原始审计 JSON 直接透传。
3. **正反例**：`tests/policy.test.mjs` 证明授权和 scope 本身已通过时，缺主键、错主键仍被拒绝；合法的同一车辆、同一客户可通过。历史白名单内 `history_event`、`contact_name`、`actor_role_at_time`、`actor_store_at_time`、`customer_level` 的嵌套敏感夹具必须拒绝；非白名单嵌套值不泄漏，合法扁平历史保留当时 actor/role/store。
4. **敏感性证明**：`tests/sensitivity.test.mjs` 构造真实模块变体，移除数据主键存在性/一致性检查后，无编号记录由拒绝变允许；移除历史嵌套过滤后秘密确实进入输出，使原始安全断言失败。夹具明确使用合法当前 scope，防止其它拒绝机制掩盖目标缺口。
5. **真实代码 CI**：[F03-G0 #37851898309](https://github.com/suzhe868-arch/mb/actions/runs/37851898309)；`head_sha=5a55dbb29d70c502c0b828af9205ffd35230046a`，`completed/success`。前一轮 [#37851805040](https://github.com/suzhe868-arch/mb/actions/runs/37851805040) 的测试夹具曾先命中 `SCOPE_DENIED`，本轮修复了夹具并要求 scope 先通过；不得把该失败记录误作生产守卫失效。
6. **执行边界**：只改 `engineering/f03/policy.mjs`、`tests/policy.test.mjs`、`tests/sensitivity.test.mjs` 和本批 B 工程交接材料；不触碰 Final、IA、Low-Fi、main、F02 结构、业务/生产库、真实账号与会话，也不开展 F03-1/2/3 或 F04。保留 `READY_FOR_A_REVIEW`。

---

## 一、基线 / 施工边界

- 从最新 main `570022a663c51cce137178a8ad90f1a8f35c41b4` 创建 `feat/f03-auth`。
- 本轮文件仅 `engineering/f03/**` 及 `.github/workflows/f03-g0-static-policy.yml`。main、原 `feat/f02-schema`、C分支、PDM Final、IA/Low-Fi、F01/F02工程都不修改。
- 本批从未连接 PostgreSQL、业务/已迁/生产库；没有注册 API、运行登录、真实微信/JYT、会话迁移或真实权限种子。
- 已验收 F02-1 的 76表/464列/160外键仅作为已合并的前提，不以静态 G0 模块替代真实 F03-1/2/3 授权。

## 二、完成的限定成果

1. 权限合同 `permission-contract.tsv`：逐项给出来源 Final、身份类型、能力/代码映射、hard DENY、data scope、object state、字段投影、DB/TX/F03/F04 归责和状态；标注 `TECH_ALIAS_PENDING_A` 的标签不代表新产品授权。
2. 身份/会话合同：单一 `pc_login_accounts.password_hash` 凭证权威、4S与System Admin隔离、强制改密、active/inactive与撤销新鲜度、信任和 F03-1 必须独立决策的表/算法/会话方案。
3. 纯 Node ESM `policy.mjs`：角色当前模板＋个人allow/deny＋最高优先hard DENY＋每项capability 的当前对象 scope＋对象状态；严格拒绝未知/缺失事实。System Admin控制面不自动得到CRM、Lock和车辆业务权；4S 自有车辆范围及 hard DENY；电话/内部价隔离、历史及Customer安全字段白名单。
4. 假数据正反例、每个注册动作独立可达测试，以及移除hard DENY/scope后原拒绝测试应失败的变体敏感性测试。
5. CI `f03-g0-static-policy.yml`：原 F01 工程与 F02-G0 只读检查、纯函数不连接数据库检查、Node ESM测试并上传完整输出工件。

## 三、真实 CI、执行命令与可核查证据

- 可核查工程代码 SHA：`2d38da86ab9781d8cc4491fe89a5c32c79a62e75`（初始首版 `76a8ab0d748f79bddbfa1a8b009277b9130e9be3` 后又补 4S 管理目标和资源记录匹配安全测试）。本报告落库产生的新 HEAD 必须以其**自身** CI 再次核实；不将上一 SHA 的通过虚报为最新 SHA。
- [F03-G0 实测 CI #37849197221](https://github.com/suzhe868-arch/mb/actions/runs/37849197221)（code SHA `2d38da86ab9781d8cc4491fe89a5c32c79a62e75`）：`completed/success`；job `113557601563`，全部相关步骤成功。
- 已运行的 CI 关键命令（工作目录 `engineering`）：

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
node f02-g0/closure-audit.mjs
node f02-g0/full-domain-audit.mjs
node f02-g0/scope-audit.mjs
node f03/verify-contract.mjs
node --check f03/policy.mjs
node --check f03/tests/policy.test.mjs
node --check f03/tests/contract.test.mjs
node --check f03/tests/sensitivity.test.mjs
node --test f03/tests/*.test.mjs
```

- 真实日志：F01 基础 **13/13 PASS**；F02-G0 CL/全域/SCOPE 静态审计 **PASS**；F03-G0 Node **29/29 PASS，0 FAIL**。测试包含 45 条来源与实现责任映射、23 个已注册纯动作逐项合法样本、未知身份/操作拒绝、4S hard DENY、System Admin 控制面、个人 deny 与当前模板、每 capability 的当前 scope、电话/内部价字段、历史安全投影、目标错绑拒绝，以及移除 hard DENY/scope 检查后负例翻转的真实变体测试。
- [F03-G0 原始 job 运行日志](https://github.com/suzhe868-arch/mb/actions/runs/37849197221/job/113557601563)。测试 Artifact：`11580937532` / `f03-g0-static-policy-evidence`，包含 `f03-g0-node-test.log`；已完成上传。可从同一 run 的 Artifacts 下载。
- 新增修改总范围：`engineering/f03/**` 和 `.github/workflows/f03-g0-static-policy.yml`。没有数据库服务、PostgreSQL连接、认证会话、旧 Schema 初始化或任何外部账户操作；因此**本批没有，也不应生成 pg_dump**。
- GitHub Actions 中由第三方 actions 打印 Node 废弃提醒（punycode/url.parse/actions Node20）为**非阻断提示**，不将其视为 F03 业务代码已接入这些废弃 API。

## 四、责任范围和残余风险

- 合同仅建模本批 representative operation 与延后责任；全部真实敏感 route/事务/字段完整覆盖仍 `NOT_RUN`。
- `global` 与其它关系授权来自提供的模拟可信事实，不证明真实 DB grant/source 不可伪造。执行敏感操作前的实时事实解析和会话失效属于 F03-1/2。
- 中文业务权限 → 英文技术别名待 A 逐项确认；不能自动登记为新默认种子、角色授权或独立业务动作。
- 仅示范了字段级白名单；真实 API serializer、缓存、导出、分享、并发状态与价格展示资格需要后续独立施工。
- 最后活跃 System Admin 与最后合格接客员工、handover batch、财务交易、Refund、Lock/Waitlist 的真实事务验证仍未实施。
- 产品基线仍 `NOT_READY`。C/H01 不因本次测试变化。

## 五、门禁

本批最多 `READY_FOR_A_REVIEW`；绝不自行签发 `F03_G0_ACCEPTED`，不合并 main，不启 F03-1/2/3、F02-2/3/4、F04。
