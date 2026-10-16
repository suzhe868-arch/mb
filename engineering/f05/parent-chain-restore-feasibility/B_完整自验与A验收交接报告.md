# 名邦汽车 V1｜F05正式父链恢复可行性 B 完整自验与 A 独立验收交接

> 执行日期：2026-10-16｜`F05_PARENT_CHAIN_RESTORE_FEASIBILITY_01`｜`A_RELEASED_FOR_B_READ_ONLY_FEASIBILITY`
>
> 本批交付是**恢复可行性裁决的实证资料、静态逆向、只读可重现审计工具及防伪测试**；没有恢复/重跑正式父来源，没有修改旧Source或发放新父签。当前F05业务、F08全域、V1、生产仍然NOT_READY。
>
> **证据版本规则**：本文件提交后产生最终新HEAD。只能以最终PR评论中引用的**同一最终HEAD真实Push Run/Job及Artifact**确认`B_SELF_TESTED / READY_FOR_A_REVIEW`；本静态文件不得凭当前或此前成功Run冒充未来同SHA成功。

## 一、已正式审核前批与本批范围

- A已独立验收并标准合并PR72，merge SHA `bf0de40b6fda3285dc38cef17d47db7fa953ac10`；本B从执行时实际最新 `main` `a3bf0876da2da24514afc8b610e10e1ea5880af2` 开新分支 `feat/f05-parent-chain-restore-feasibility-01`。
- 唯一Authority：`07_重建工作区/F05_五项正式父级来源链恢复可行性核证_A主控下一阶段完整施工单_2026-10-16.md`。
- B只增 `engineering/f05/parent-chain-restore-feasibility/**` 和 `.github/workflows/f05-parent-chain-feasibility-*.yml`；没有改README、NEXT_ACTION、PROJECT_STATE、DECISION_REGISTER、旧Source/workflows/branch、PDM、业务、DDL、C PR68、F08、保护或生产。
- 交付文件：
  - `核证工具.mjs`：动态读取五个原始分支及全部指定45份同HEAD旧Workflow官方原始Push、Job、Artifact；代码仅产生历史可信候选，绝不对main颁发父证明。
  - `tests/核证工具.test.mjs`：跨SHA/repo/分支/event/attempt/Job/Artifact/API错误、模拟完整父链拒发正式证明。
  - `五源原生官方历史证据清单.tsv`：5原分支SHA与官方Source Run/Job/Artifact及保留期。
  - `五源父链恢复可行性与A裁决选项.md`：五源逐项逆向、遗留风险、三个决策选项与分批恢复实验方案。
  - `.github/workflows/f05-parent-chain-feasibility-audit.yml`：真GitHub Actions独立只读Node Push + PR隔离CI，强制上传同SHA测试日志及动态JSON证据。本包未新建PG16工作流，不冒充原生PG16 Job。
- 本轮真实历史取证来源仅GitHub官方只读API与原始Job日志，没有访问外部第三方/客户/真实业务数据库/资金，没有调用任何 Actions 重跑或 Git ref 修改接口。

## 二、关键新事实：旧父链不是从未通过

**截至2026-10-16的官方历史原始分支事实**：五个旧分支的最后HEAD均保留8、8、9、10、10份原始Push成功工作流；五个自身Source原生日志都含原Verifier的同SHA完整Job通过标志，分别为**66、68、70、72、72**（名义348项分支隔离PG16工作位置）。

| 旧域 | 原Branch末SHA（首12位） | 原 Source 官方Run | 原Source Job | 原原生链证据 |
| --- | --- | --- | --- | --- |
| F05-7 | `99c38d013f67` | [38189425635](https://github.com/suzhe868-arch/mb/actions/runs/38189425635) | 114618772149 | 官方日志64旧＋2本新同SHA审计成功 |
| F05-8 | `1dc08927b6b1` | [38242775552](https://github.com/suzhe868-arch/mb/actions/runs/38242775552) | 114790910558 | 官方日志64旧＋4本新同SHA审计成功 |
| F05-9 | `d3cbaee088f6` | [38271144191](https://github.com/suzhe868-arch/mb/actions/runs/38271144191) | 114885412991 | 官方日志68旧＋2本新同SHA审计成功 |
| F05-10 | `d1f721bd1d33` | [38352572708](https://github.com/suzhe868-arch/mb/actions/runs/38352572708) | 115154863290 | 官方日志70旧＋2本新同SHA审计成功 |
| F05-10-D1 | `3edf40b7cda1` | [38348593551](https://github.com/suzhe868-arch/mb/actions/runs/38348593551) | 115137912268 | 官方日志70旧＋2本新同SHA审计成功 |

五个Source自身工件有效、官方SHA256摘要元数据存在；原始完整作业名单/尝试次数/关联Run和工件详见另两文件以及CI动态`f05-parent-chain-live.json`。ZIP字节摘要独立复算未执行，不将官方元数据冒充本地独立复算。

**核心边界**：这证明五个**原始分支各自旧SHA**的正式原生检查历史真实成功；当前 main（及PR70/PR72以后更改）的SHA不同，所以不能把五个旧成功Run当成当前main/新PR已拥有同SHA正式父签。这与PR72原受验SHA旧五Source红灯没有矛盾。

## 三、恢复实验实际阻断与技术结论

1. 本B并未发现旧Source必须在自身运行前要求自己`completed`的逻辑死锁；原脚本允许自身Source job运行、其他Job已complete，原历史成功已给出反证。**不把原始父链永久不可达`UNRECOVERABLE_AS_IS`写成事实**。
2. 原五分支当前的`f05-*-frozen-h52-revalidation.yml`仍保留旧`public.ecr.aws/docker/library/postgres:16-alpine`镜像及`contents:write`局部权限；PR70在main上的DockerHub修复尚未传播原五分支。未来重跑可能再次限流/排队或引出权限审计事项，不能靠新Node工具修复。
3. 合法新原分支`push`和当前main同SHA之间的Git历史快进/工作流触发能否实现，尚未获得A许可进行写入/分支变动实验。必须先对每个原分支做受控Git祖先性与触发器快照，再由A决定准许何种最小安全Push；不得重置或强推。
4. 五批名义至少348个PG16 Job，且所有原分支不共SHA，不能不问来源就彼此复用作业；面临GitHub Runner队列、ECR镜像、原生长轮询、资源用量、工件到期和GitHub API速率上限。**348不是已经执行的作业数，不是预算报价，也不是本B回归项目数**。
5. 最小合法恢复实验建议由A另签`F05_PARENT_RESTORE_EXPERIMENT_01`：先只允许F05-7，明确原分支安全快进、所需原生66Job、镜像兼容整改白名单与不可更改的原始业务断言、自动停止/回滚原则；A确认成功后才可放行F05-8（68）、F05-9（70）、F05-10（72）、D1（72），绝不越过冻结SOURCE安全门禁。若快进条件无法满足则在该分支明确`BLOCKED_REQUIRE_A_NEW_AUTHORIZATION`，不私自强推或补造父签。

### 下一阶段A三选一

- **A推荐：仅正式放行F05-7最小原分支受控实验。** 本批仅提供实证与施工方案；后续分支/工作流变动需要新的A签字。
- **B保守归档：** 维持历史原生成功证据，当前main五旧Source继续 `SOURCE_GAP`，业务NOT_READY。
- **C发现无法满足同SHA的实际Git祖先冲突：** 停止且上报`UNRECOVERABLE_AS_IS`，由A另行技术裁决，不篡改原签名行为。

此次不是新的用户产品规则选择；需A工程技术裁决。C轨PR68首页详情仍用户功能/视觉否决、R3独立执行，本B未碰C任何文件。

## 四、CI真实性与故障处理

- 全部新增Node正反例和GitHub真实只读API通过后才可交A。实际Node CI依赖官方`push`、官方GitHub Token（仅Actions只读），在45份旧workflow中按原分支SHA严格绑定Run/Job/Attempt/Artifact。对过期/缺失工件、401/403/429、GitHub分页不完整等必须 `SOURCE_GAP` 或失败，不得继续输出虚假正式证明。
- 全套真实Node用例的历史状态、运行Job ID、最后受验SHA与官方Artifact以**PR提交后的末SHA成功Push运行事实**为准。提交最终报告/PR后不得再靠“上一提交已绿”充当当前版本CI通过。
- 运行程序永远输出`formal_parent_positive:false / production_authorized:false`。模拟虚构完整父链时仅判断 `HISTORICAL_COMPLETE_METADATA_ONLY_NOT_NEW_PARENT_PROOF`，测试通过是工具安全覆盖，不是业务官方签发。
- 本次不新增隔离PG16实际执行包，故本轮只有只读Node CI；旧分支真实PG16由**既存官方原生日志、Run及Artifact**核证，不虚构本批启动过原生数据库。
- 未经A独立复验和GitHub标准合并，不得声明PR完成或正式恢复；未来更改原旧SOURCE或运行原始Job均需要新工作单。

**交接条件**：最终HEAD真Push Node PASS，官方Artifact非空未过期及SHA256元数据、动态45Workflow证据、7?条授权新增文件差集、五源真实结论完整归档时，登记 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A / NO_PRODUCTION`。如最后CI不满足则`B_IN_PROGRESS / BLOCKED`，不可提前交付。
