# 名邦汽车 V1｜原H52三版本Actionlint定点取证 B 工程说明

**任务**：`F05_7_H52_ORIGINAL_SCHEMA_MINIMAL_REPAIR_01`。
**授权**：`A_RELEASED_FOR_B_PROVEN_H52_SCHEMA_ERROR_MINIMAL_REPAIR_ONLY`；原来源阶段2 NO-GO。
**执行分支**：`fix/f05-7-h52-proven-schema-minimal-01`，从最新正式main `2d53c138afc12d2d7593c30368f21acd28ee0f51`起。

## 工具及可复核输入
- 使用actionlint `v1.7.12`（GitHub rhysd/actionlint发布资产 linux_amd64），发布元数据 SHA256 `8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8`；GitHub CI必须下载并强制sha256sum验证，否则失败关闭。
- 只读 checkout fetch-depth=0；对历史0Job SHA `bf9c698fabff721a52154fba662dc9b230d9a319`、原来源ref SHA `99c38d013f67cc56975f1664120fb87c204afc3c`、当前main原H52各执行actionlint；通过`git hash-object`核Git Blob `3a13...` / `eda68...` / `687a...`。
- actionlint禁用非本任务可裁的ShellCheck/Pyflakes附加规则，仅判GitHub workflow/schema/表达式；固定工具return code、完整stdout/stderr、具体行号和规则写入本批官方非空Artifact。历史零Job官方annotation不可读时根因继续`UNKNOWN`。

## 禁止变更
- 此初始审计不修改原H52；只有经过原文件具体schema/表达式error及完整语义等价机械验证，才允许在该文件做最小修订。
- 不改原旧来源ref，不Push/dispatch/re-run旧52或66 PG16 Jobs，不修改其它七旧F05-7工作流、业务或资金/生产权限。
- 即使Actionlint 0 error，也不能宣称GitHub最新原复杂H52已经原生调度；五SOURCE_GAP/C与V1仍NOT_READY。

## 最终审计记录
最终应以同HEAD GitHub原生Run、Job、官方Artifact、真实actionlint三个退出码/诊断、若有改动的精确hunk与Source静态等价证据为准。独立A验收前不声明`A_ACCEPTED`。
