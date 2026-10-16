# 名邦汽车V1｜CI跨窗口重复触发治理：B只读清册、实证与待签白名单

> 任务：`CI_TRIGGER_SCOPE_GOVERNANCE_01`；权限：`A_RELEASED_FOR_B_NOW` 但原旧Workflow修改另需**逐文件A书面批准**；取证基线main `f4682abbc57f94cf4f9727450759bb8314998aab`。只读预检，不是最终CI治理完成。

## 一、根因不是所有F05，而是10份广谱PR工作流

真实官方 `main` git tree：治理分支产生前**321份** `.github/workflows/*.yml|*.yaml`，其中96份`f05-*`；增加本批专用CI后治理分支清册是**322份**（其中96份F05），没有删除或修改旧文件。真实GitHub Actions终版动态扫描识别出**10份 `pull_request.branches: [main]` 且没有paths的F05重型/正式Source工作流**，所有10份需要原签名保护及A逐项确认。不能把320（A旧统计）或322文件数说成运行排队数。

原旧10份Source/兼容冻结工作流路径、Git Blob SHA、两次真实PR运行ID及实际结果见 [十项跨轨误触发候选_A逐文件授权前置清单.tsv](./十项跨轨误触发候选_A逐文件授权前置清单.tsv)，**原件每一项均状态 `NOT_AUTHORIZED`**。此清单用于向A申请逐文件审核，不是B自批白名单。

重复显示名：动态扫描还发现多组冻结工作流共用`name`（例如“F05-8 PDM13 Priority CI PG16 and signed F05-7 equivalent true compatibility”对应不同yaml路径）。GitHub Checks/工作流身份不能只按显示名合并；取消并发也须以路径、PR维度隔离，不能互相取消不同Workflow来源。

## 二、真实GitHub PR before快照（动态Job读取；不是模拟）

| 对照 | HEAD / 范围 | 同HEAD原生PR Run | F05误触发 | 官方实际Job数 | 累计Job运行时长代理 |
| --- | --- | ---: | ---: | ---: | ---: |
| [C-only PR68](https://github.com/suzhe868-arch/mb/pull/68) | `a02ca27d2109e365c5830b641a18cfb059fe3684`，`apps/mobile/**`+`c-app` CI与C文档 | 11 | **10** | **29** | **28.684分钟** |
| [B F05-only PR75](https://github.com/suzhe868-arch/mb/pull/75) | `9e974f5c89195130c4fe4d8dfe325c7d1ef99c70`，F05审计源码及其单独CI | 11 | 10份旧F05＋1份自身F05审计 | **29** | **26.949分钟** |

两组Run均通过GitHub官方按`head_sha+event=pull_request`逐条取Run，随后按`run.id/jobs?filter=latest`实际GET每组11个Run的原始Jobs求和；0项Job元数据缺失。28.684和26.949为各Job开始/结束时间差之和，**不是GitHub官方计费账单或单个Workflow最大耗时**；运行历史可能发生重试，不能仅凭本快照估算全年费用。

C端真实渲染Run为`38909117378`，而无关F05正式Source失败Run有`38909118102`（F05-7）、`38909117558`（F05-9）、`38909117652`（F05-10）、`38909117319`（D1）等；通过身份只读核验的是**原生Run的正确失败**，不是新增CI造成的业务失败。B PR75有`38910704810`冻结F05-8兼容Run。每个任务的原 `SOURCE_GAP` 均须保留。

## 三、变更路径和必须保留的测试覆盖矩阵

| 变更内容 | 应有检查与SOURCE边界 | 本批验证状态 |
| --- | --- | --- |
| C-only `apps/mobile/**` 及 `c-app` | 前端真H5/Weapp/渲染和用户验收；不应多触发10份F05重型PR作业 | **Before真实失败**；路径静态负例通过；After未授权实跑 |
| F05-only `engineering/f05/**` | 相关F05 PG16/Source/HTTPS以及正式来源同SHA原Push强门禁不放宽 | Before PR75真实11 Run；After未授权 |
| F08-only `engineering/f08/**` | F08原PG16/权限契约与共享依赖，不从F05历史签据偷借 | 静态矩阵通过；After待真PR |
| shared `engineering/shared/**` / lockfile | C/F05/F08全部依赖并集，禁止目录路径过滤造成缺回归 | 静态矩阵通过；After待真PR |
| 改 `.github/workflows/f05-*.yml` 自身 | 原冻结业务安全和CI变更检查，保留合法原分支push及dispatch | 静态矩阵通过；旧Workflow一行未改，After待A白名单 |
| mixed `apps/mobile/**+engineering/f05/**` | C与F05安全检查并集，无选择性遗漏 | 静态矩阵通过；After待真PR |
| docs-only `07_重建工作区/*.md` | 文档/治理检查；不能把文档PR当正式新Source签据 | 静态矩阵通过；After待真PR |

**技术防绕过**：同 SHA、原Push事件/原分支、PG16非特权、原Source失败、旧Artifact必传及历史反向权限/并发安全均不得通过取消/中性/Skipped替代。新轻量CI PASS仅表明清册与矩阵工具工作，**绝不是旧F05 Source已通过**。

## 四、required checks 权限实证与单文件决策门禁

- GitHub官方 `GET /repos/suzhe868-arch/mb/branches/main/protection` 返回 **HTTP403 Resource not accessible by integration**；`GET /rulesets?includes_parents=true` 返回空数组。这意味着**无法确认main是否有其它必需检查**，不得将空rulesets武断理解为无branch protection。动态证据明确写`REQUIRED_CHECKS_UNKNOWN_HTTP_403`。
- 本批10个候选全部带Source或frozen PG16签证风险，**在A正式逐文件核查并签白名单前，不准添加paths、paths-ignore、`if:false`、条件Skip、修改Job display name、禁用workflow、删除历史branch push**。没有完成after实际真PR对照，不能标记`CI_GOVERNANCE_FIXED`。
- A需从仓库 Settings → Branches → Branch protection/Rulesets 及 Actions Checks核实旧10个Workflow对应**Job name / App / required contexts**，记录截图或提升只读API权限；将每份文件的Source依赖、兼容Job及是否必需附于明确白名单，才能决定采用只针对非必需且无签名功能的路径过滤，或保留always-on合格门禁的调度方案。
- 如A核证必需检查，则切勿把整条Workflow`pull_request`靠paths直接剔除，否则C-only PR可能永远Pending；考虑**始终出现的保守判定Job+隔离重型测试**，但不能因Skipped旧必需签名Job变成中性而伪绿，设计仍需A独立裁决。
- 若最终允许安全`concurrency`，group必须包括`workflow_ref`（标识具体文件）与PR号码/分支，不得跨不同同显示名Workflow误取消，`cancel-in-progress`不得对正式原分支签据和长PG16父证明擅自启用。
- 所有旧Workflow最小变更前后须保存原 Git Blob SHA、原trigger、原Job/Artifact/SOURCE正反行为字节基线与回滚SHA；本批10项Blob与原PR证据已在TSV列出。

## 五、A审核后实际施工顺序（此单**尚未实施**）

1. A以十项清单逐条准许修改或拒绝，查明必需检查；优先更改对C-only无关且非必需者。被拒的冻结项继续保留红灯，不做批量禁用。
2. B在**现PR原分支**最小修旧配置（须属于经A批准文件），保持正式push路径、workflow_dispatch、PG16/Source脚本和Artifact内容，做源文件安全字节diff与Node负例。
3. 真实构造C-only、F05-only、shared、workflow-self、mixed 5组GitHub PR提交/Runs，核对最终HEAD各路径所需Job、必要检查没有Pending、Source正确报红或合法证明完成。仅当A许可验证对照PR，才能声明所观察类别已经真正治理。
4. 记录修复后的真实Before/After工作流数、Job数及Job运行分钟；**当前After＝NOT_TESTED，节省幅度＝UNVERIFIED**。A独立审核再标准合并`main`。

## 六、B本批真实交付

- `trigger-scope-audit.mjs` 扫描全部真实checkout工作流并生成`ci-trigger-workflow-inventory.tsv`、`ci-trigger-policy.json`，调用GitHub官方只读API生成`ci-trigger-official-sample.json`；失败的API保持fail-closed。工件实际记录所有Workflow路径、名称、push/PR触发类别、paths、concurrency、静态Job数/名义timeout上限、PG16标志、原Source风险、重复名称、真实Job时间。
- `tests/trigger-scope.test.mjs` 原生Node 28项合同，覆盖push.paths不能冒充PR有过滤、双域依赖并集、冻结Source保护、display名相同不得混算等反例。
- `.github/workflows/ci-trigger-scope-governance-audit.yml` 仅自有工具路径触发，GitHub原生非生产Node runner、只读token和同SHA工件；**未新建任何原PG16业务测试、没有修改旧320+文件**。
- [十项待A批准清单](./十项跨轨误触发候选_A逐文件授权前置清单.tsv) 只读证据；任何 `NOT_AUTHORIZED` 行绝不因本包报告变更为准许。

**本批目前为预检，待A新裁决**：`B_PREFLIGHT_SELF_TESTED / READY_FOR_A_REVIEW_PREFLIGHT / A_TECHNICAL_BLOCKED_REQUIRED_CHECKS_UNKNOWN / NEXT_OWNER=A / SOURCE_GAP_OPEN / NO_PRODUCTION`。
