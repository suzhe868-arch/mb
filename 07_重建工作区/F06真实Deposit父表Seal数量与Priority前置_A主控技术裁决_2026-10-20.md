# 名邦汽车 V1｜F06 Deposit 父表 Seal 数量与 Priority 前置：A 主控正式技术裁决

- 日期：2026-10-20
- 状态：`A_TECHNICAL_RULING_ISSUED / B_REMEDIATION_REQUIRED / NO_ACCEPTANCE / NO_MERGE`
- 任务：`F06_REAL_DEPOSIT_LEDGER_HTTP_PG16_01`
- 下一责任：`B`；原工程分支：`feat/f06-real-deposit-ledger-http-pg16-01`
- 正式追踪：[Issue #132](https://github.com/suzhe868-arch/mb/issues/132)
- 裁决基准 `main@634e9b729ed9f79764c718f231e7556c2afe33e2`，审查 B HEAD `9d93ff4317379b3e8f91532e2e352adf4ae18cf4`；B 继续施工时须重新同步最新 main
- 审阅真实原生证据：[Run #39366495173](https://github.com/suzhe868-arch/mb/actions/runs/39366495173) 与 [Run #39366833724](https://github.com/suzhe868-arch/mb/actions/runs/39366833724)，后者为 **failure**；本次不是验收通过。

## 一、190 张父表的来源裁决

此前正式施工单第 5 节写“当前 main 全部已签父实体为 190 张”，但现行已签父链及真实运行日志均**不能支持这个固定数字**。在 F06-2 完成的父层 Seal，真实日志记录 158 张表；在 F06-3A 同 SHA 的 `F06_3A_TRUE_SIGNED_DATABASE_BEFORE_SCENARIOS` 与 `F06_3A_DISPOSABLE_SCENARIO_AND_SIGNED_AUDIT_GLOBAL_SEAL_PASS`，完整物理父表数为 **161**，签名迁移账本 24 条、Public Catalog SHA `5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4` 与 D1/F06-1/F06-2 父 Sidecar 验证通过。161 属于 **F06-3A 场景清除后的四个父 Schema**：`public`、`d1_owner_ci`、`f06_1_lock_ci`、`f06_2_ci`。158 属于更早父层阶段，不能与 161 混为同一个验收阶段。

现行 `engineering/f06/deposit-ledger-ci/audit-seal.mjs` 以这四个 Schema 中 `pg_class.relkind IN ('r','p')` 的**完整表名集合**逐表统计 `COUNT(*)` 与有序行 JSON 的 MD5，并比较场景前后在不同 OID 库的全量摘要；代码门槛是 `paths.length>=160`，不存在该父验证器签署“190张”的证据。故本次裁定：**施工单“恰好 190 张”是未经证实的技术计数口径，予以勘误；不是新增29张表，也不是允许少验表。**

## 二、替代的严格验收口径

仅就**本批经验证的当前 main、固定四 Schema 父层**，以在官方同 SHA 原生 F06-3A Source 全链中实际生成并通过父验签的 **161 张完整物理表集合**作为冻结预期。B 必须：

1. 在该单 Job/同 SHA/同 Run 的原生 F06-3A 前置全链成功后，从其已验签的 `audit-before.json`、`audit-global-seal-pass.json` 或等价可信父 Seal 读取**完整有序 Schema.表名清单 + 每表 COUNT/MD5 + 整体摘要**，核对后保存父来源 SHA/Run/阶段/摘要证据；不得仅以“我刚查询到 N 张”自我证实 N。
2. 本包新 Seal 独立枚举 `public`、`d1_owner_ci`、`f06_1_lock_ci`、`f06_2_ci` 全部 `r/p` 表，核对**集合完全相等**、161 个实体逐表 COUNT/MD5 均与本轮已验父 Seal 一致。场景前原库与审计副本、场景后新 OID 恢复库与不变审计副本均逐表相同；不同物理数据库 OID 与 Backend PID 继续强制验证；不允许排除失败表、重签旧 Catalog、覆盖快照或修改旧 Seal 生成代码。
3. 独立验证 24 条真实迁移 Ledger、Public Catalog SHA、D1/F06-1/F06-2 attestation，且 F06-3A Source 28/28；测试后的 F06-3A CI Sidecar 消失，正式产品/资金生产 Issuer 始终无权限。
4. 如新 main 的真正已签父范围出现结构变化，或新枚举与已验签父 manifest 不一致，**失败停工并交 A 重新裁定**，不得自动接受任意新数量。不得将本裁决推及其它工程单、全部生产业务表或真实财务签署。

此条仅替换原施工单第 5 节和 B 报告内针对“190张”及其相关测试断言；其它全部验收矩阵、非生产硬边界与白名单继续生效。

## 三、现有同 SHA CI 失败及 B 的必须整改

官方 Run #39366833724 真实运行通过 F06-3A Source 28/28、LockRequest Node 54/54、Lock 生命周期 Node 37/37；**在 LockRequest 原生 PG16 的初始化 fixture 第1项失败**：`original authorized F05 Priority source must survive signed v26`。原始 Priority 读取需要原 F05 授权签发结果、活跃时限、当前版本的 source signature 关联和无其它 active Lock 等条件；不能用手工伪造 Priority、虚构 Issuer、放宽原锁车安全断言、跳过真 PG16 测试的方式修复。

B 须在原分支、仅本批新增白名单目录中查清父链场景恢复后原签发 Priority 为何不再满足既有 fixture：核对源表行与关系、时限、当前版本、Active Lock 竞争、先后顺序与真实 PG16 状态；如存在合法的原生父快照/测试排序兼容方式，调整**本批脚本**以重用真实已验签父事实，做到旧原生21/21与生命周期36/36完整通过，并确保24迁移及其 SHA、父实体未被修改。若真实已验父事实已经失效且无法合法复建，报告 `BLOCKED_TRUSTED_PRIORITY_FIXTURE`，不借非真实数据冒充原签发来源。

已发现本批新增 `engineering/f06/deposit-ledger-http-pg16/disposable-db.sh` 的参数展开写成 `mode="§{1:-}"`，不是 Bash 的 `mode="${1:-}"`，导致 `prepare/restore-source` 分支不能正常识别；B 须在白名单内修正并加入可核查命令/回归负例，不能以跳过脚本方式绕过恢复验收。

B 必须重跑**同一最终 HEAD**正式单 Job：根 Node54、生命周期 Node37、LockRequest PG16/HTTP21、生命周期 PG16/HTTP36、F05初始化18、F06-3A Source28/HTTPS9、新 Deposit HTTP/PG16 至少24（当前实现计划38）、新 TLS 拒绝至少9，均 **0失败、0跳过、0取消**；补全不可变追加、并发/回滚、同 Key 幂等、Scope撤权/跨域拒绝、Lock资金事实硬拒绝及生产路由不存在的原生实证。测试通过后 B 更新中文自验与交接，并标记 `READY_FOR_A_REVIEW`；此前不得创建 PR / merge。

## 四、裁决边界与当前终态

审查确认本批 B 分支相对 `main@634e9b7` ahead 4/behind 0，共 10 个新增文件，路径属于授权白名单；误建 Draft PR #133 已关闭且未合并。B 保持原分支修复，**不再创建 PR**；A 只有在其全部硬门槛通过、独立审查后决定创建/合并标准 PR。

不接真实支付/收款/退款、不创建真实 Transaction、不修改旧 F06 代码/公共 DDL/PDM Final/生产路由，不改变既有产品规则，新增付费预算 $0。F06/F07/F08、正式 Source 与 V1 整体仍 `NOT_READY`。

**最终状态：** `A_RULING_COMPLETE / B_REMEDIATION_REQUIRED / NEXT_OWNER=B / NO_PR_FOR_DEPOSIT / NO_MERGE / NOT_READY_FOR_A_REVIEW`。只有 B 在原分支交同 SHA 全绿且正式提交 `READY_FOR_A_REVIEW` 后才由 A 独立验收。
