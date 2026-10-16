# 名邦汽车 V1｜F05-7 阶段2前 HTTPS 端口冲突与 H52 调度风险：B 工程交接

> Task: `F05_7_PRE_PHASE2_BLOCKER_CLOSEOUT_01`。当前文档归档状态：`B_WORK_IN_PROGRESS_PENDING_FINAL_HEAD_CI`；仅当最终真实同 SHA Push 与 PR CI 以及官方 Artifact 符合施工单才可在 PR 评论宣布 `B_SELF_TESTED / READY_FOR_A_REVIEW_PHASE2_PRECHECK`。H52 实际历史 52 Job 新版调度并未授权，**不得伪称调度已证明**。

## 1. 起点与严格权限

- 基线 GitHub `main`：`77e252511643d837ddf829d633d798b6dca33eee`；A 正式放行单 `07_重建工作区/F05-7_阶段2前HTTPS端口冲突及H52无Job风险闭环_A主控正式施工单_2026-10-17.md`；独立工作分支 `fix/f05-7-phase2-precheck-https-h52-01`，独立 PR #86。
- 唯一允许修改原有文件：`engineering/f05/deterministic-matching-readiness-four-tier/tests/https.test.mjs`；只改变测试监听及对端 TCP port，保留所有原业务和安全断言。新增目录 `engineering/f05/source-controlled-recovery-03/**` 和新增路径限制独立验证工作流 `.github/workflows/f05-7-phase2-readiness-audit.yml`。
- 原 `.github/workflows/f05-7-frozen-h52-revalidation.yml`、其它七份 F05-7 工作流、其它四条 Source、原旧分支 `feat/f05-7-deterministic-matching-readiness-four-tier` 均禁止写入、Push、dispatch，禁止旧 66 Job 重跑。无真实客户/JYT/资金/生产操作。

## 2. EADDRINUSE 根因与最小改动

- PR84 后 A 查阅原 F05-7 HTTPS 原生 Job `117170785651`，原HTTPS脚本固定 `server.listen(48988,'127.0.0.1')`；执行 `test.before()` 即 `EADDRINUSE`，七个 HTTPS 负例 `hookFailed`，0/7真正执行，不是业务断言失败。
- 本批只把监听改成操作系统原子分配 `server.listen(0,'127.0.0.1')`，从 `server.address().port` 获取实际端口，对每次 HTTPS 请求设置实际 TCP transport port。**CI逻辑 authority 未改**：`origin='https://127.0.0.1:48988'`、显式 `Host: 127.0.0.1:48988`、原签名 Auth/CSRF Cookie、来源拒绝判定、原 TLS key/cert 与原 `rejectUnauthorized:false` 自签 CI 运行前提全部不变。Node HTTPS 物理连接在随机 loopback TCP 上，逻辑 Host/Origin 仍同冻结 CI Router 要求一致；未修改 `ci-router.mjs`。无端口碰运气、sleep 或弱化断言。
- 原 B01~B07 所有 test 体字节不变。审计直接从 GitHub main 原Git Blob `5fc9861b6341e4ee066c594c808557b321d9b95e` 验证后，比对 `const match='/__ci__/f05-7/v1/match'` 起到文件末尾的原七案例字节完全一致。
- 新 `https-port-collision-probe.mjs` 在独立 Runner 先永久持有本次进程旧 `127.0.0.1:48988`，用第二个原生 TCP bind 真实复现 `EADDRINUSE`；仍保持占用运行 **原完整** `bash engineering/f05/deterministic-matching-readiness-four-tier/ci-job.sh https`，包括非特权合成 PG16 迁移全套、原 TLS 十分严格的 7 个 Bxx 拒绝断言、原证据校验/归档。结束释放持有的监听器。

## 3. 原生 CI 回归证据与历史意义

- 开发期间首个专用 Push Run `38963108650` 的原生 **native-https** Job `117182830983` 实际 completed/success，日志明确：
  - `F05_7_LEGACY_FIXED_PORT_EADDRINUSE_REPRODUCED`
  - `F05_7_HTTPS_EPHEMERAL_LOOPBACK_BIND {port:42397,logicalOrigin:https://127.0.0.1:48988,host:127.0.0.1:48988}`；
  - 原真实PG16预检 18/18 成功、真实 HTTPS拒绝 7/7 success、`F05_7_NATIVE_PG16_V23_https_CI_COMPLETE` 与 `F05_7_PORT_COLLISION_CLOSED_NATIVE_HTTPS_PASS`；
  - 官方非空 Artifact `12074135700`（含原 TLS/PG16 归档及占用端口负例）。
- 同一早期 Run 的 H52 static Job 最初 10/12 通过，失败仅是审计新添加的两条**文本匹配断言**：一条未包含 H52 最后2个 YAML 内联 Job；另一条错误地把只读验证脚本中被审查的字符串 `git push` 也当成实际副作用。已在原新测试脚本内修复审计判断，不修改 H52 源文件。最终同HEAD必须真实原生重新核验，不能借旧阶段绿灯。
- 最终验收须核对 *同最终 PR head SHA* 新专用 Push 与 PR 各包含两个 Job：`h52-readonly-preflight` 和 `native-https-occupied-port-nonprivileged-pg16`，两组各 success 且各真实非空官方工件。最新 URL/sha/Job IDs 在同 SHA 的正式 PR #86 B 交接评论提供。

## 4. H52 风险分级与审计上限

- H52只读 Git Blob `687a9f767b0d0b144372550735da6159066b4833` 与 main 保持一致。检查8工作流/66旧Job、H52 52 Job（含2内联）、50个Alpine服务、1个YAML标量锚点+49次引用、总62服务、6处 F03 `contents:read`、30条原跨F03 Push字符串、原旧Push分支范围均完整。
- 读取旧 H52 失败 Run `38958160214` 的 REST 元数据/Job列表、对应 workflow registry state 和检查套件可公开注释（如Actions Read权限可获得）。静态 Ruby YAML alias 解析通过、H52字节数低于512000、旧历史运行曾通过仅说明“静态可读/历史可运行”；**不代表现在的新版H52能被 GitHub 原旧 ref 真正调度52Job**。
- 如未取得 GitHub 官方编排具体根因及新版原生证据，必须标记 `H52_GITHUB_SCHEDULER_NOT_PROVEN`，下一步交 A 决定是否补充工作流编译/隔离无害探针白名单或必须保留该阻断。B不触碰旧 ref，不申请66作业运行，也不凭只读API把推定变成通过。

## 5. 仍保持的门禁与下一责任

五份 F05 Source `SOURCE_GAP` 未被真实原分支同 SHA 的66Job证明，旧 F05-8/9/10/D1 Source 失败不可为了降低 PR 红灯伪绿；前端 C PR68 真双端构建、V1、生产均 `NOT_READY`。本批**只用于修测试环境端口冲突和调查 H52 调度风险**，不意味着 phase2 放行。

- 新 CI 通过可交 `B_SELF_TESTED / READY_FOR_A_REVIEW_PHASE2_PRECHECK` 同时明确 `H52_GITHUB_SCHEDULER_NOT_PROVEN`（如未获编排证实）；由A集中裁定是否合并当前限定成果和需何种额外安全检查。旧历史原分支快进/Push/66Job仍必须随后A另签 `PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED`、精确old/target SHA与配额/停止规则，B无权实施。
