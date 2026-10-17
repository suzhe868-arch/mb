# F05-7｜V2 来源协议候选，同 SHA 真业务 + 官方独立取证（非正式 Issuer）

版本：V2_SOURCE_CANDIDATE_66_NEW_HEAD_V1。唯一分支：feat/f05-7-v2-versioned-source-66-candidate-01。本工程是非生产候选，不具有正式 Source 签发权，也不赋予旧ref Push权限。

## 旧版 Oracle 与新版候选的不可混同点

- 冻结旧验证器 ci-verify-workflows.mjs 必须核实七份旧 Workflow 64 原Job 同SHA push成功，另外两个 F05-7 原 native Source/HTTPS Job 也同SHA成功。旧八份工作流和旧来源 ref @99c38d013f67cc56975f1664120fb87c204afc3c 均严禁整体重新激活。
- 新版使用 catalog.rb 固定八原Workflow Git Blob SHA 和 66 原Job ID/原Shell命令/步骤内容/原PG16服务/旧Artifact契约；每次在新 HEAD 四个受限 Runner 内重新逐 Job 隔离原样执行。之前 PR104 旧SHA的两份PG16 Job 本次也必须真实重新执行，不采纳历史跨SHA结果。
- 原 match-source 的旧 Source Oracle 第二Shell在隔离V2不可能达到原生旧七Workflow同HEAD成功要求，保留 BLOCKED_EQUIVALENCE_LEGACY_SOURCE_ORACLE。旧原Job只能按原始完整Shell是否成功分类；新版本仅提出 V2_SOURCE_ORACLE_REPLACEMENT_CANDIDATE_PENDING_A_SIGNOFF，任何时刻不得将其标REAL_ORIGINAL_JOB_PASS。
- 新候选的聚合Job与旧原生 Workflow Job身份不同；要审查原 Job条件与并行依赖、host service镜像与端口、permissions/credentials、setup-node/checkout actions、原 Artifact独立命名与存储，以及原Shell的安全脱敏重写。这些属于候选与旧签发协议的显式差异，不能用4个外层Runner绿色覆盖原66项原生真实状态。

## 可复验的工程入口

1. 真实GitHub新分支 checkout末HEAD后运行 Ruby 原 catalog，验证八Blob字节未改变，输出66个确切Job对象。
2. 运行 plan66.mjs 生成66格同SHA源清册，检查8源66真实ID、64PG16+2NONPG及2项历史需当前SHA重新跑。
3. 四个 ubuntu-24.04 独立 Runner，每个最多40分钟且并发4，按 index%4 分成17/17/16/16。每原 Job由旧V2安全执行器创建独立Git worktree/独立PG16（2个原非PG不启动PG）、只读权限，保留原断言；不能安全等价则Fail Closed。
4. 逐Shard无损原日志/工件上传前扫描GitHub mask、临时合成HMAC原值、PEM私钥、可疑Token，超限不上载不裁剪。官方Artifact每片≤5MiB、仅1天。
5. 待完整Run结束后，由持有只读Actions Token的独立审验者运行命令：GH_ACTIONS_READ_TOKEN=[REDACTED] node engineering/f05/v2-issuer-candidate/verify-official.mjs HEAD_SHA RUN_ID。只读脚本从GitHub官方REST分页读取Run/Job/Check/Artifact元数据，下载四个ZIP、验证GitHub digest，安全解压并全量复算内ZIP和每个原文件SHA与每项Shell记录，拒绝跨SHA、重名、过期、缺页、伪造Job/Check/Artifact、原Shell未执行的假通过。
6. 候选报告只能含 CANDIDATE_FOR_A_REVIEW_BLOCKED_LEGACY_ORACLE、formal_issuer_signed=false、SOURCE_GAP_OPEN、production_ready=false。任一来源API/证据失败，报告Fail Closed并列明原Job/分片，不推出正式Source可用结论。

## A正式签发前必须另行作出的决定

A需逐差异批准新协议版本及对应独立签名主体/最小权限：谁有权从GitHub API形成可信声明，如何保留新HEAD官方验证链，如何区分聚合Runner运行与旧Workflow原生作业身份，如何将旧Source消费方迁移到新版本。需以A控制的签名/审计权限形成可回放证据，并建立回退原正式Source禁签状态的开关，分阶段迁移五正式Source。本B任务不得修改五正式Issuer、旧Oracle、生产/DDL/PDM或C端。

## 安全与预算

本次只许1次最后受控Push，最大4标准Runner×40分钟，每个Shard ZIP≤5MiB/留1天。PR创建可能额外触发宽范围旧PR Check；必须记录成本和失败状态。无法证明成本或异常扇出即停止，不为数字重复Push。旧一次性合成HMAC历史Artifact#12099312017须单独记录到期/删除状态，不得暗示本工程已清除。全局F05/V1/生产仍NOT_READY。
