# 名邦汽车 V1｜F06-5C B 工程整改自验与 A 独立验收交接

> 2026-10-15。责任：B；原分支 `feat/f06-5c-transaction-priority-admission-ci`；[PR #62](https://github.com/suzhe868-arch/mb/pull/62)；范围仅 CI 隔离。A 原 [完整整改单](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F06-5C_A主控PR62独立验收未通过_交易取消来源与原子并发整改施工单_2026-10-15.md)。  
> **已完成业务代码对应的验收基线** `f3bea8c9a4543f7175afa6e10bf86253473dba34` 已由 B 实际对 GitHub 原生日志复核；本中文交接文档一经提交会形成新的分支 HEAD，故**最终提交是否达到 READY_FOR_A_REVIEW 必须以新 HEAD 的 22 Push/96 Job/Source/HTTPS/H52/双 OID/工件复验和 PR 最终签名评论为准**，不能拿旧 SHA 绿灯冒充。  
> F05/F06 整域、V1 和任何生产/真实资金操作始终 `NOT_READY`，禁止 B 合并 main。

## 一、A整改单 B-01/B-02/B-03 包内整改闭环

1. **交易签名终态和重仲裁**：只读原 F06-3B 不可变 `in_progress` 历史、F06-5B 原子 Guard、F06-4A/4C 取消来源与请求事件、F06-4B 负责人移交链；仅当原签取消完整、无 Lock/Waitlist/资金异常且匹配资格当前有效，才在同 Vehicle `FOR UPDATE` 事务调用冻结 F05-8 `arbitrateCI`。未签 public 假取消、旧不安全 3B、Guard 漂移和财务未知均 FailClosed。旧 ended Priority 不复活。
2. **原服务、同 PG Client 和真实并发**：F03 有签 Employee Session、单一 PG backend PID/txid、原父签发器与事件；winner 不一致抛异常回滚，不直接插入 Priority。业务 S65 使用两个独立 PG 后端、子进程中原 5B 安全 Lock→Transaction 转换、原 4A 真 Cancel 后原 F05-8 来源触发的唯一新 Priority，二次重入零新增；业务 S66 用原 F06-1 双 pending→合法 approve→真实 Waitlist，再经 5B/4A 后仍严拒 Priority 插队。旧父实现、原 DDL、24 迁移一字未改。
3. **权限/回滚安全**：覆盖真实员工身份与个人 deny、团队 Scope 失效、Customer 失活、Match/Qualification 校验、ListingCycle、active Lock/Waitlist、资金/Refund pending、重放、行锁争用/回滚及真实付款零写入；未恢复旧生产缺口。
4. **额外检查分类**：本包 `push` 与 GitHub `pull_request` 上冻结旧工作流的失败不得混为一谈，须保留以下真实失败与说明：
   - [PR F05-10-D1 Run 38613300839](https://github.com/suzhe868-arch/mb/actions/runs/38613300839)：原 Source 业务 PASS，但旧分支 Push 限定签发器 `D1_NOT_NEW_OFFICIAL_PUSH`；HTTPS PASS。
   - [PR F05-10 Run 38613300343](https://github.com/suzhe868-arch/mb/actions/runs/38613300343)：原 Source 业务 PASS，但旧事件签门禁 `F05_10_NOT_NEW_OFFICIAL_PUSH`；HTTPS PASS。
   - [PR F05-7 Run 38613301321](https://github.com/suzhe868-arch/mb/actions/runs/38613301321)：原 Source 业务测试 `# fail 0`，后续冻结工作流审计调用 GitHub Actions API 返回 403；HTTPS PASS。
   - [PR F05-8 Run 38613300358](https://github.com/suzhe868-arch/mb/actions/runs/38613300358)：Source 业务 `# fail 0`，后续冻结 Actions API 403；其余 3 Job PASS。
   - [PR F05-9 Runs 38613300674、38613300550](https://github.com/suzhe868-arch/mb/actions/runs/38613300674)：Docker `toomanyrequests: Data limit exceeded` 镜像拉取限流；另一合法 Job PASS，重跑仍限流。
   - [本包 Push F05-8 Run 38613290450](https://github.com/suzhe868-arch/mb/actions/runs/38613290450)：首次两 HTTPS `127.0.0.1:48988 EADDRINUSE`，通过 GitHub 原生 `rerun-failed-jobs` 后 attempt2 整个 Run success。历史错误保留。
   - GitHub 主线 `protected=false`、Rulesets 列表为空；需注意连接器无法读取细项 `required_status_checks`（403），这 6 条旧 PR 非成功检查**最终是否阻断合并由 A 独立裁定**，B 不更改冻结父工作流以伪装绿色。

## 二、经核实的业务代码 SHA 原生证据

**验收基线（文档更新前）**：`f3bea8c9a4543f7175afa6e10bf86253473dba34`，严禁沿用到另一个新 HEAD。

| 门禁 | 原生核验结果及证据 |
| --- | --- |
| 22 条 `event=push` | 22/22 `completed/success`，全部同本节 SHA |
| 真 PostgreSQL16 作业 | 96/96 GitHub Jobs API 成功；其中 H52 官方 `per_page=100` 列全 52/52 PASS |
| 本域 Source | [Run 38613290467](https://github.com/suzhe868-arch/mb/actions/runs/38613290467)，Job 116022000893，68/68 PASS，0 fail，S65/S66 实际通过 |
| 本域 HTTPS | 同 Run Job 116022001063，9/9 原生成功、生产发行器未接 |
| 原父表封印 | Scenario OID `68460` 真 DROP → Audit OID `73483`，旧190表逐表全行 COUNT/MD5；原24迁移、父签与 Catalog/D1 未漂移 |
| 工件 | 22 条成功 Push 所有 Run 官方 96 份同 SHA、非空、未过期、`sha256:<64 hex>` 元数据有效；**不把元数据检查冒称96份ZIP逐字节复算** |
| 回归范围 | F05 旧兼容、F06-1/2/3A/3B/3C1/4A/4B/4C/5A/5B 与 H52 原生同SHA工作流通过 |

旧表摘要：`fd51c9708ff119af7f09d694d30c5f70119a51e248b55b3168fdb39426297acf`；迁移签名：`b9beed2d9e5fda2511bef6cbcd6d050862971714b9464624dc6439888c118033`。详细来源矩阵见同目录 `来源与权限矩阵.tsv`；GitHub 原生执行与失败分类见 [PR 审核说明 #6175521120](https://github.com/suzhe868-arch/mb/pull/62#issuecomment-6175521120)。

## 三、反向代码自审与保留缺口

- 本 PR 对 main 比较新增代码/CI 文件仅限 `engineering/f06/transaction-priority-admission-ci/**` 与 `.github/workflows/f06-5c-*.yml`；不改已冻结父 F05/F06、正式迁移、生产权限、个人真实资料或现金支付。
- 一律禁止未签来源、伪造取消、资金 refunded/refund_payments、完成成交、生产 Issuer、真实外部第三方、生产迁移、UAT/F07/F08；旧 F06-3B pending Refund 不安全转换漏洞仍未从冻结父入口消失。
- 源码静态自审仅能证明文件范围与调用结构；真实并发、回滚和 Seal 必须以最终 SHA 的 PG16 原生日志为准；附加 PR 旧检查争议属于 A 独立复验及正式合并决策。
- **最新文档提交之后还要完整同 SHA 再测。** 在本文件对应新提交复验全部通过、PR 正文/末次签名评论写出最终 SHA 以前，不得宣称实际 `READY_FOR_A_REVIEW`。满足全部门禁后由 B 在 PR 正式签 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`；A 独立验收并合规合并。

## 四、A验收关注点

请 A 独立核对最新 HEAD，特别是新提交后的 22/22 Push、96/96真PG16 Jobs、H52 52/52、Source68/HTTPS9、两OID旧190全量封印及≥32有效 GitHub Artifact、合法交易取消重仲裁/真实候补保留、额外 PR 6 个旧检查失败的性质与是否 required。B 不自行合并 main。
