# 名邦汽车 V1｜PR76 主分支保护核销与十个历史F05 Workflow逐文件有条件放行｜A主控正式裁决

> 日期：2026-10-16；任务`CI_TRIGGER_SCOPE_GOVERNANCE_01`；技术状态`A_REQUIRED_CHECKS_BLOCK_RESOLVED_BY_ADMIN_UI / A_SIGNED_TEN_FILE_CONDITIONAL_WHITELIST / B_AUTHORIZED_IMPLEMENTATION_IN_PR76_ONLY / CI_NOT_FIXED_YET / NO_PRODUCTION`。
> 
> **后签优先**：本文件是对前次`CI触发范围治理_PR76_A主控第一轮独立验收_必需检查权限阻断与十项待批裁决_2026-10-16.md`中`REQUIRED_CHECKS_UNKNOWN`阻断的**有证据限域解除**。旧审计完成与旧5 Source红灯依然成立；不得回写旧报告或把C-only省掉不相关F05 Run当成F05业务获签。

## 1. GitHub管理员可见证据的复核与边界

用户在当前会话提供两张GitHub登录仓库管理员界面截图（截图保存在对话中，不伪造下载/仓库附件）：

1. 仓库`suzhe868-arch/mb`的`Code/main`首页醒目提示：**Your main branch isn't protected**。
2. 仓库`Settings → Branches` 显示：**Classic branch protections have not been configured**，且没有已设置的传统保护规则。
3. 先前B/A实读`GET /repos/suzhe868-arch/mb/rulesets?includes_parents=true`返回空数组`[]`；A本次再次核实仍为`[]`。当前GitHub App读`branches/main/protection`返回403只代表其**API管理端点访问受限**，已不应再凭403将仓库现有main必需检查记为“有待用户提供”；也不应把没有保护误写成“GitHub全项目运行检验全通过”。

**限域裁决**：在这组管理员页面与父规则集现状持续成立时，`main`不存在配置了的required status checks。原`REQUIRED_CHECKS_UNKNOWN_HTTP_403`已**由管理员UI核销**，解除纯配置读取阻断。B须在实施前后再查询Rulesets并在真GitHub PR UI检查保护有无变化；若新设置规则、分支保护或获取相反证据，**立即停止而不是按本书面批准强行提交**。

## 2. A独立逐文件实质核证与修改白名单

A对B提交的 `engineering/ci-trigger-governance/十项跨轨误触发候选_A逐文件授权前置清单.tsv` 的**十个真实main文件逐一读取**并比对原Blob SHA，**10/10一致**。每份触发器均为原指定`feat/f05-*`的`push` + 对任何main PR无路径限制`pull_request` + `workflow_dispatch`，内部确实包含真实隔离PG16、Source/HTTPS/兼容Job及Artifact。

本次书面放行的是**仅在指定PR76工程分支上，向下列十份原文件的 `on.pull_request` 段新增必要路径过滤**。未批准自行变更push/dispatch、冻结脚本、Job或合并main。

| 序 | 仅可修改的旧Workflow路径 | A复核原Git Blob SHA | 来源保护身份 | 单文件结论 |
| ---: | --- | --- | --- | --- |
| 1 | `.github/workflows/f05-7-deterministic-matching-readiness-four-tier.yml` | `cb56f8587807709ad598311e6964fa44a49d3020` | F05-7 主Source/HTTPS | **CONDITIONAL_ALLOW_PR_PATHS_ONLY** |
| 2 | `.github/workflows/f05-8-priority-arbitration-ttl-handover.yml` | `9dcac53085220e21c3e98fefc41d8c54d11dc867` | F05-8 主Source/HTTPS/兼容 | **CONDITIONAL_ALLOW_PR_PATHS_ONLY** |
| 3 | `.github/workflows/f05-9-recommendation-visibility-grants.yml` | `05c7663b252bc61fe09c226a9e31ab32770fbd8f` | F05-9 主Source/HTTPS | **CONDITIONAL_ALLOW_PR_PATHS_ONLY** |
| 4 | `.github/workflows/f05-10-consultation-assignee-sla.yml` | `6f8d814b370b7ba3aaea0e60c3f2b43e739a212f` | F05-10 主Source/HTTPS | **CONDITIONAL_ALLOW_PR_PATHS_ONLY** |
| 5 | `.github/workflows/f05-10-d1-public-pool-owner-claim.yml` | `dcb6c5c6a56965419d1723153ceb6a0ddcc5649f` | F05-10-D1 主Source/HTTPS | **CONDITIONAL_ALLOW_PR_PATHS_ONLY** |
| 6 | `.github/workflows/f05-9-frozen-f05-8-four-revalidation.yml` | `867346565654667601988a3ed90f92f84ce92bbc` | F05-9冻结F05-8四项 | **CONDITIONAL_ALLOW_PR_PATHS_ONLY** |
| 7 | `.github/workflows/f05-10-frozen-f05-8-four-revalidation.yml` | `5dba5c672be7f914a15dc89a57df0e78e7bf5baf` | F05-10冻结F05-8四项 | **CONDITIONAL_ALLOW_PR_PATHS_ONLY** |
| 8 | `.github/workflows/f05-10-d1-frozen-f05-8-four-revalidation.yml` | `2e66de2af3022d870678f068fd9f636b586f4515` | D1冻结F05-8四项 | **CONDITIONAL_ALLOW_PR_PATHS_ONLY** |
| 9 | `.github/workflows/f05-10-frozen-f05-9-two-revalidation.yml` | `def7c12248cb17d832a1d6a750e42ceb2601aeac` | F05-10冻结F05-9两项 | **CONDITIONAL_ALLOW_PR_PATHS_ONLY** |
| 10 | `.github/workflows/f05-10-d1-frozen-f05-9-two-revalidation.yml` | `279734b953484e6648a7f8019b00672a170f2fc5` | D1冻结F05-9两项 | **CONDITIONAL_ALLOW_PR_PATHS_ONLY** |

**修改允许范围**：对每个文件只能在现有`on.pull_request.branches: [main]`紧邻增添 `paths` 正向过滤（及必要原样缩进）。路径规则须先在B报告中按真实工程依赖闭包给出并由新静态/原生测试验证，至少包含：
- F05自身代码与签据脚本`engineering/f05/**`及受源脚本依赖的共享后端（含实际引用的F01~F04、共享脚本、数据库/迁移/SQL、工程配置；禁止只看目录前缀猜测安全依赖）。
- `engineering/shared/**`及确实对F05原生回归产生影响的root/engineering包管理清单和锁文件。
- **十个Workflow自身路径**以及同一父来源/兼容测试直接依赖的其他F05 Workflow路径；可将`.github/workflows/f05-*.yml`（并覆盖使用的`*.yaml`）列入需要触发的文件；同理须识别`.github/actions/**`与被复用的共享Workflow引用。
- 仅`apps/mobile/**`、`c-app`自身Workflow/文档变化不得引入上述十个重型F05 PR Run；共享和混合变更必须取各域**并集**，而不是把旧测试过滤失踪。

**不准修改**：`name`、任何`jobs`内容/Job显示名、测试脚本、PG16数据库服务镜像、`actions/upload-artifact`、权限、workflow-level`concurrency`、`if`条件、`paths-ignore`、`push.branches`、`workflow_dispatch`、源Verifier原分支/同SHA/Event/Attempt/Job数/Artifact核证、旧任意Source/HTTPS断言。若要做上述任何一项改动，需要**新A逐项授权**；本次没有给。`on.pull_request.paths`不是新父签凭据；因变更路径未命中而没有Run不得被当成“源PASS”。

## 3. B在原PR76连续执行与真验收合同

- **单分支施工**：`fix/ci-trigger-scope-governance-01`，原[PR76](https://github.com/suzhe868-arch/mb/pull/76)，施工前复核执行时最新main原Blob等于上表、HEAD与base变更来源；不新开不相关PR，不改C PR68、不擅合main，不依赖用户逐条同意。若Blob变化、已有main required checks规则、新Source合法性冲突或依赖闭包不可明确，标`BLOCKED`交A，严禁无证据继续。
- **差异约束**：每份旧Workflow历史内容必须除`on.pull_request.paths`插入之外逐字保持；原Blob、补丁、回滚定位、SHA对照及十文件全量防越权合同纳入 `engineering/ci-trigger-governance/**`新增回归，覆盖七类源码变更映射；显式测试原Source仍`push`生效、事件/branch/attempt/Artifact还原。
- **真GitHub测试**：至少独立实证 C-only、F05-only、shared dependency、workflow-self、mixed(C+F05)五类 `pull_request` Run/Check/Job/Artifact；能在同一PR76分支组合可靠观察的，提供确切SHA和影响文件；需额外分支/PR时必须只用于受控测试并交完整证据，不能伪造Run或单靠Node静态测试。明确未测试类别`NOT_VERIFIED`。
- **要求的结果**：C-only真实PR不应产生这10项无关F05；F05本域和共享/混合修改必须保有必要F05真实PG16安全检查，原Source如缺原指定合法Push则仍真实FAIL；该被过滤的检查不作为required check强制门槛（当前main无保护），不创建永久Pending；不把任意测试的成功视为全业务可生产。
- **最终交A**：提供B中文差异清单、10行逐文件白名单核对、路径依赖闭包、各场景真实GitHub BEFORE/AFTER及时间/Job数、原正式SOURCE红灯事实、最终新HEAD官方CI logs/未过期有效Artifact、回滚策略。状态仅在五场景及所有安全覆盖达标时可申请`READY_FOR_A_REVIEW_FINAL`，A再次独立审核合规后才标准PR合并并更新所有主线状态。

## 4. 范围和责任

- **本轮A结论**：`ADMIN_UI_EVIDENCE_ACCEPTED`；`TEN_FILE_TRIGGER_ONLY_CONDITIONAL_A_WHITELIST_RELEASED`；前置审计PR76已通过，正式整改**尚未完成**、PR76保持open。
- 下一责任窗口：**B**，任务 `CI_TRIGGER_SCOPE_GOVERNANCE_01_IMPL_PR76`，只在原PR76分支执行上述最小修改、真GitHub回归和中文证据。
- 旧五条F05正式Source `SOURCE_GAP`、F05/F08全域、V1、真实客户/资金、生产依旧`NOT_READY`；F05-7 66 Job正式恢复前置任务依旧排后，不能趁本批重复启动。
- C PR68继续R3用户功能/视觉复评，独立于B PR76；C未通过不许合并。

**注意**：这次截图证实的是“没有现存分支保护”，而非“今后永远不需要保护”。在修复CI后，应按真实必需Check身份独立设计main保护，禁止现在突增未知必需检查造成PR76回归永久Pending。
