# 名邦汽车 V1｜F05-7 V2 官方只读取证与独立可信签署门禁｜B 工程交接报告

> 2026-10-17｜任务：`F05_7_V2_TRUSTED_READONLY_ATTESTATION_AND_ISSUER_GOVERNANCE_01`  
> B 当前状态：`B_SELF_TESTED / READY_FOR_A_REVIEW_BLOCKED`  
> 来源状态：`FORMAL_ISSUER_NOT_SIGNED / SOURCE_GAP_OPEN / FAIL_CLOSED`  
> 此报告不是正式来源签发或生产放行。

## 1. 权威与允许范围

- 仓库 `suzhe868-arch/mb`，本轮读取 `main@e3ad49b39e2d4811f6957986635bb5657f35a38d`；A 受限合并前批 PR111，main merge `996d032252535cda8487b4c25e62ae3c72f39a3a`。
- 正式单：`07_重建工作区/F05-7_V2来源候选官方只读取证与可信签名门禁_A主控B正式施工单_2026-10-17.md`。
- B 本轮未改原 8 冻结工作流、原匹配验证器、五正式 Source/Issuer、业务/DDL/PDM/C/生产或旧 ref。旧来源 ref `99c38d013f67cc56975f1664120fb87c204afc3c` 继续禁止推送。
- 合规允许的新代码目录：`engineering/f05/v2-attestation-gate/**` 和已有 `engineering/f05/v2-issuer-candidate/**`，拟用分支 `feat/f05-7-v2-trusted-attestation-issuer-gate-01`。

## 2. GitHub 官方只读取证与独立原文复算

唯一真实 Run 为 `39035485532`，`push`、attempt1、最终 `completed/failure`，HEAD `bdffc492df7dc09d9192d3ac485d598df7a8c040`。分片0失败，分片1/2/3成功：

| 分片 | 官方 Job | 官方 Artifact | ZIP 摘要 sha256 | 文件 | 原 Job |
| --- | ---: | ---: | --- | ---: | ---: |
| 0 | 117404318608 | 12101319115 | d0d6723e8b6fb5a6ad6ec442b8d71f9426589f10b5a1d49e9ddf9a77acd04649 | 220 | 17 |
| 1 | 117404318768 | 12102520536 | d3eb27569b09068498781a284467e636e79261b14d2e9a068ed43a8ca7a06cda | 220 | 17 |
| 2 | 117404318646 | 12101854148 | 6e2acf179aa7058b2eaee19ed76c3a8837001f67619dda9bdecd5c6df9a8884f | 252 | 16 |
| 3 | 117404318687 | 12102560092 | cb87bcc89f74007a5eb835a7f7f33792a3c2ddb8550ba38d32c9a432bae255c0 | 239 | 16 |

本轮真实通过 GitHub 连接器读取 run/jobs/check-runs/artifacts 元数据，并下载四个官方 ZIP；本地重新检验 4/4 外层官方 sha256、4/4 内层 ZIP、931/931 原始文件 hash 与长度、66/66 唯一 Job、原日志 hash、原 Artifact hash 和执行成功标记。按正文实际记录：**63 PG16 原业务成功、2 原 NonPG 成功、旧 `match-source` 第二来源 Oracle Shell 结构性阻断 1 项**。不能宣称 66/66 原生来源签约成功。

八个 source Blob 与本轮 GitHub 官方 `main` 相应八份 YAML 的 Blob SHA 全部一致。但真实旧 ref `99c38d013f67cc56975f1664120fb87c204afc3c` 下同名 YAML 文件的 Blob SHA 与当前 main **不同**：此身份差异必须供 A 在独立新版协议中审签；不能拿 B 当前 main Blob 去冒充旧 ref 的原生父签。原工作流 step/permission/env 的完整重派生仍需要 A 在独立审计环境复核。

扫描明文 `::add-mask::`、PEM 私钥、完整 F03_1 合成 HMAC 样式，本轮 931 文件未命中；不能据此称历史泄漏调查已结案。四份 Artifact 官方留存到 2026-10-18 13:17:56–13:18:48 UTC 左右，不能用一日附件冒充长期保存。上批风险 Artifact `12099312017` 已由 GitHub 官方 Run39027727248 Artifact 列表确认仍存在且 `expired=false`，官方到期时间 `2026-10-18T11:17:32Z`；属于仍待删除或到期复查的合成 HMAC 脱敏风险，不包含已确认生产凭据泄漏结论。

## 3. 候选工程与实际测试

- `官方证据离线验真.py`：冻结上述官方元数据与八份 current-main Git Blob，不读取手写伪 REST JSON；实际检查 ZIP 两层路径/摘要/manifest/原 66 Job/明文秘密/PG16 版本/原 Artifact。缺 ZIP 和任何差异直接 FAIL_CLOSED；**不具有签署能力**。
- `独立签署验签门禁.mjs`：候选协议 `V2_SOURCE_ORACLE_REPLACEMENT_V1`。校验来源事实、旧 Oracle 必须阻断、官方四摘要、受信 A 归档承诺、五个消费者；只有受保护的 A 外部固定 Ed25519 公钥 SHA 指纹、公钥验证、撤销、24h 有效期和**A 实际持久化 nonce 重放账本**才能做下一步候选验证。B 自选公钥、非持久账本或 CLI 均不得签发；测试临时密钥是合成负例，不是 A 生产或真实签署密钥。
- Python 本地真实官方数据审计：`F05_V2_OFFICIAL_ARTIFACT_DIR=/mnt/data python -m unittest -q test_官方证据离线验真.py` **7/7 成功**；`python 官方证据离线验真.py --zip-dir /mnt/data` 输出 **931/931、66/66** 原文校验。
- Node 本地测试：`node --test test_独立签署验签门禁.mjs` **25/25 成功**，覆盖伪造签名、公钥、跨 SHA、修改摘要、绕过旧 Oracle、过期、撤销、重放、未迁移消费者等。
- **未跑新远程 CI，也未重新跑旧原 66**。这是施工单的资源禁止条件，不可把旧 Run 的结果伪装为本轮新 SHA CI。

## 4. 五个 Source 消费者与回退

依次为 `F05-7`、`F05-8`、`F05-9`、`F05-10-D1`、`F05-10`。新版候选仅在 A 单独批准独立只读审核执行身份、受保护验证代码版本、外部信任锚、可信长期不可变工件归档、真实签署记录及每消费者独立迁移后才可评估。正式源必须同时核验证据版本、原 8 Blob 根、66 原 Job 矩阵摘要、原始正文根、Run/HEAD、有效期、撤销和历史旧 Oracle 的真实阻断。任一缺失都保持五个旧 Source `SOURCE_GAP_OPEN/FAIL_CLOSED`，无生产启用。回滚即停用 V2 候选准入，不自动放行旧 Source。

## 5. 精确阻断与 A 决策

1. `BLOCKED_SIGNER_TRUST`：无 A 控制的独立审计主体、不可由 B 自选的公钥指纹、A 签发私钥和外部持久 nonce/吊销账本。
2. `BLOCKED_IMMUTABLE_ARCHIVE`：四 ZIP 1 日过期；尚无 A 授权、成本有界且 B 不可改写的长期归档。
3. `BLOCKED_READONLY_END_TO_END_A_CONTEXT`：本轮实际完成官方连接器 API 取证＋独立离线原文字节校验，但**尚无在 A 独立账户下运行的单一端到端官方 REST 验签者、逐 step/权限全量可信证明**。
4. `BLOCKED_REMOTE_CI_NOT_AUTHORIZED`：施工单不许擅自增加 Runner、工件存储或反复 push。尚无本批 GitHub PR 最终 SHA/新同 SHA CI；若需要，须 A 集中批准明确成本/触发器门槛。
5. `BLOCKED_LEGACY_ORACLE`：旧 `match-source` 来源签约 Oracle 原样保持拒绝，不可换 PASS。
6. `RISK_STATUS_UNVERIFIED`：历史 #12099312017 一次性合成 HMAC 工件的删除/到期未确认。

**B 工程可自主完成的本地候选与实际原文审计已经完成；完整 A 验收条件尚未闭合。状态 `READY_FOR_A_REVIEW_BLOCKED`，下一责任人 A 决定独立可信签署/长期存储/受限远程 CI。`FORMAL_ISSUER_NOT_SIGNED`，F05/V1/生产继续 `NOT_READY`，B 未合并 main。**


## 6. 新增固定证据承诺与真实交接限制

- 本轮补充基于四份官方 ZIP 的三个固定摘要：八份当前 main Blob SHA 映射根 `319d4bc6264f597d354ff3b6eec98c182c170e5dd9983632185243a40241ef44`；66 项原 Job 记录矩阵根 `b24ab94147d6586b327318794158eed8cd6c5d71567165b8bc469da5dfbd56b0`；931 份正文路径/长度/哈希叶的确定性二叉 Merkle 根 `f28eb01052054bb1427d8aad0bb678e82288d6b9be7e43a4e78a6ebbc9f2eed2`。三者由离线验证器从实际 ZIP 重新计算并与固定预期核对。
- Node 签署函数现在仅返回 `cryptographic_signature_check_only=true`，且强制 `authorization_granted=false`、`formal_issuer_signed=false`。输入一个模拟 A 公钥及临时重放集合，即使密码学验签通过，也**绝不构成真实 A 身份或正式 Source 签署**。
- 最终实际测试为：Python **7/7**（传入四份真实官方 ZIP，未跳过）、Node **25/25**。这些均为本地真实执行；旧 Run 不得冒充新代码的同 SHA CI。
- 当前工作区已形成可供 A 获取的完整非生产候选源码、中文说明和审计摘要的 ZIP 交付包。**GitHub 新分支、PR、末 SHA、新 CI 均未创建**：由于部分旧 PR 工作流对 `engineering/f05/**` 有宽泛触发器，A 施工单明确不批准未经裁决的新增 Runner/存储开支，B 没有擅自推送触发。这是 `READY_FOR_A_REVIEW_BLOCKED`，不是满足“末 SHA 同 CI 绿灯”的完整交验。
- 本压缩包不包含四份原始 CI ZIP、原始日志、生产密钥或任何真实个人数据。完整原始证据的 1 日过期风险按原官方 Artifact 身份供 A 独立只读下载与验收；后续如无合法长期归档，必须 Fail Closed。


## 7. A 二轮独立复核后的 B 整改记录（后记，覆盖上文旧“下一责任A”描述）

A 已于 Issue #106 评论 `6235232694` 独立读取离线包并重新验证官方四 ZIP；裁决 `A_CHANGES_REQUESTED / NEXT_OWNER=B`，并确认未达到仓库代码提交及本 HEAD 正式 CI 验收。

B 继续工作：独立只读读取正式 main 的工作流目录元数据（335 个 YAML），并完整读取 10 个确认匹配本任务 `engineering/f05/**` 路径的 `pull_request` 工作流，查得合计 **28 个配置 Job、1,350 分钟累计超时上限**。其余工作流的完整 trigger/Job 静态审计未能在本次受限工具环境完成，**所以 10/28 不是全仓可能触发上限**。具体逐文件 Git Blob、验证办法、机器失败即关闭的 CI 只读检查脚本参见 `CI触发预算门禁审计_2026-10-17.md`。

新增 `CI触发容量只读预检.py` 及测试；真实 Python **13/13 无跳过**（原 7 条含全部四份官方 ZIP、另 6 条触发负例）、Node **25/25 成功**；离线 931/931 原始正文验证仍成功。全程不新增任何远程 GitHub Runner 和 Artifact，也不接触 A 签名者权限。

**剩余正式阻断**：`BLOCKED_REMOTE_TRIGGER_BUDGET` 使 B 无权进行会启动上述旧 CI 的标准 PR；尚无本次新分支 SHA、本 HEAD GitHub PR 或 CI。`BLOCKED_SIGNER_TRUST`、`BLOCKED_IMMUTABLE_ARCHIVE`、`BLOCKED_LEGACY_ORACLE`、完整 A 独立在线验签及五正式 Source 仍待处理。新代码留在当前聊天可下载的完整工程包（不上传真实工件/日志/秘密），GitHub Issue 仅归档事实，不能视为代码已入库。

**下一责任：A 主控集中裁决触发成本/分支及 PR 放行方式；未放行前 B 状态 `READY_FOR_A_REVIEW_BLOCKED`，不得假装 PR 已存在或 Source 已签署。**


## 8. A三轮复核后335份工作流完整只读审计结论（最新）

- A第三轮正式意见参见 [Issue #106 评论6235497329](https://github.com/suzhe868-arch/mb/issues/106#issuecomment-6235497329)，B获**附条件单次分支创建**权限，但**无PR授权**。
- B按 `main@e3ad49b39e2d4811f6957986635bb5657f35a38d` 逐一读取335/335份YAML及真实Git Blob SHA。完整SHA清册、335条机器判别、10条PR工作流、静态Job/Artifact上限见 [Issue #106 评论6235711783](https://github.com/suzhe868-arch/mb/issues/106#issuecomment-6235711783)。
- 目标 `feat/f05-7-v2-trusted-attestation-issuer-gate-01` **push配置匹配0、create配置匹配0**。PR(main)仍匹配**10工作流、28配置Job、28 Artifact上传步骤、配置超时合计1,350分钟**；非本次PR费用授权。
- 修正CI触发静态预检对单行 `on: {push: {branches: ...}}` 的过度保守解析并补充四条精确匹配反例；本地使用四真实官方ZIP重测 Python **17/17 PASS，Node 25/25 PASS**。
- 仅当**10个纯代码与报告文件在单一父main的commit中一次性创建指定branch**、且GitHub最新main仍与审计SHA一致、绝不打开PR时，才能将其视为`BRANCH_ONLY_SOURCE_CANDIDATE`。分支本身不是CI验收、不是五正式Source授权。若无法完成单次refs写入则维持本地候选，停止推送。
- A审查后的下一责任仍B继续受限入库；签署身份、长期存储与旧Oracle不等价仍Fail Closed。
