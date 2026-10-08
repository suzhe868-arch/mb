# 名邦汽车 V1｜F03-G0｜B 工程自验与 A 独立复验交接

> 2026-10-09｜A 放行：`F03_G0_AUTHORIZED / USER_APPROVED`；A 放行单：`07_重建工作区/F03-G0_A主控正式施工放行_2026-10-09.md`。
> 本报告初始与工程实现同一提交，**真实 CI 证据须在工作流完成后核实并追加登记**。本报告不是 A 正式验收凭据，`F03_G0_ACCEPTED=NO`。

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

## 三、真实测试与交 A 应附证据

- 精确 B HEAD SHA：以提交后 GitHub 分支实际 HEAD 和 Action `head_sha` 为准。
- F03-G0 CI：必须取得 `completed/success` 与 job 原始输出，含通过测试数、失败数、正反例、敏感性、合同覆盖、F01/G0 回归。
- 若 CI 未通过，标明 `NOT_VERIFIED/CHANGES_REQUIRED`，修正代码并重新提交到本分支。不能用旧 SHA 的结果顶替新 SHA。
- 测试工件应包含 `f03-g0-node-test.log`；CI 不是数据库测试，**不生成 pg_dump，不应以缺少数据库结构导出视为缺口**。

## 四、责任范围和残余风险

- 合同仅建模本批 representative operation 与延后责任；全部真实敏感 route/事务/字段完整覆盖仍 `NOT_RUN`。
- `global` 与其它关系授权来自提供的模拟可信事实，不证明真实 DB grant/source 不可伪造。执行敏感操作前的实时事实解析和会话失效属于 F03-1/2。
- 中文业务权限 → 英文技术别名待 A 逐项确认；不能自动登记为新默认种子、角色授权或独立业务动作。
- 仅示范了字段级白名单；真实 API serializer、缓存、导出、分享、并发状态与价格展示资格需要后续独立施工。
- 最后活跃 System Admin 与最后合格接客员工、handover batch、财务交易、Refund、Lock/Waitlist 的真实事务验证仍未实施。
- 产品基线仍 `NOT_READY`。C/H01 不因本次测试变化。

## 五、门禁

本批最多 `READY_FOR_A_REVIEW`；绝不自行签发 `F03_G0_ACCEPTED`，不合并 main，不启 F03-1/2/3、F02-2/3/4、F04。
