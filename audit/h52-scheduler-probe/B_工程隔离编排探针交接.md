# 名邦汽车 V1｜F05-7 H52 原生 GitHub 调度轻量隔离探针 B 工程交接

> 任务：`F05_7_H52_SCHEDULER_ISOLATED_DIAGNOSTIC_01`。工程基线 `main@56fe3c64094c9bbb7a1bbd8cd35a9864b03d0bf6`，隔离分支 `audit/f05-7-h52-parser-isolation-01`。状态 `B_PROBES_IMPLEMENTED / NATIVE_CI_VERIFICATION_REQUIRED`，是否可标记 `READY_FOR_A_REVIEW_H52_PARSER_DIAGNOSTIC` 依赖最终同SHA官方GitHub证据，仓库这份文档不预先冒称成功。

## 实验设计与边界
- 白名单仅新增两份非F05文件 `.github/workflows/h52-scheduler-alias-control.yml`（小控制）和 `.github/workflows/h52-scheduler-size-probe.yml`（511380 UTF8字节的大文件），以及 `audit/h52-scheduler-probe/**` 内可复现合成生成器、源文件严格审计、Node正反例、结果文件与本中文交接。两份GitHub Workflow只观察自身workflow文件路径和本审计目录，均只有1 Job、8分钟限制、`contents:read`，无PG16、Source、重写历史分支、workflow_dispatch或任何外部敏感请求。
- YAML标量锚点及引用使用 `- run: &z echo H52_SAFE_SCALAR_ALIAS_EXECUTED` 与 `- run: *z`，两个真实步骤都会执行；安全检查额外验证固定原始H52 Git Blob SHA `687a9f767b0d0b144372550735da6159066b4833` 未变。大文件用无害的生成注释`# H52_SYNTHETIC_PADDING_ONLY_`及P填充到511380B，绝不复制原H52业务或测试命令。小文件同语法未填充。
- 生成器 `generate.mjs --check` 逐字节核对实际两份YAML生成结果与精确长度；`verify.mjs small|large` 核验路径、字节、Job数量、最小权限、脚本内容、安全禁止字符串、旧H52原Blob只读签名，并写非敏感证据及GitHub Actions官方Artifact。原生GitHub执行每个workflow各最多1个小额Job。
- 旧历史H52失败 Run [38958160214](https://github.com/suzhe868-arch/mb/actions/runs/38958160214) 为较早B head `bf9c698fabff721a52154fba662dc9b230d9a319` 的`completed/failure`、0 Job；新版正式H52仍511380B、52 Job，静态Ruby可解析，registry active。**即使两个合成workflow官方绿色运行，也只说明GitHub接受基本alias和相似大小单Job语法，绝不证明H52完整52Job新版在原F05来源分支可安全调度或源签发成功**。`H52_GITHUB_SCHEDULER_NOT_PROVEN` 与五份`SOURCE_GAP`仍OPEN。

## 官方证据与升级要求
- 需要记录**同最终B head SHA**的Push和PR event各两个新Workflow真实GitHub原生Run（各1Job）、日志中的 `H52_SYNTHETIC_GITHUB_JOB_EXECUTED`、有效非空同SHA Artifact、完整Job status/conclusion；任何0 Job失败须原样归档，不得改成Mock绿色。独立PR由A验收决定是否合并main。
- 原旧F05-7来源ref继续冻结 `99c38d013f67cc56975f1664120fb87c204afc3c`（实际值需提交A前再读GitHub验证），本任务未启动历史8Workflow/66PG16 Job，无数据库、业务变更、客户、资金或生产行为。要修改原H52或未来原ref单次fast-forward/Push，必须A额外签精确白名单/old/target SHA/预算和失败停止条件。
