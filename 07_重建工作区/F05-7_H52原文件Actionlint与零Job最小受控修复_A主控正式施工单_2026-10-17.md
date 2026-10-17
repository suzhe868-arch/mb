# 名邦汽车 V1｜F05-7 原H52 Actions Schema/actionlint精准核证与最小安全修复｜A主控完整正式施工单

> **任务** `F05_7_H52_ORIGINAL_SCHEMA_MINIMAL_REPAIR_01`；**状态** `A_RELEASED_FOR_B_PROVEN_H52_SCHEMA_ERROR_MINIMAL_REPAIR_ONLY`；B工程执行，A独立代码/CI/安全验收。**阶段2现为NO-GO**，本单绝不授权原旧Source Ref快进Push、原8Workflow/66PG16执行，其他四正式Source、客户资金或生产操作。

## 1. 基线与真正目标
- 唯一权威是执行时实际GitHub最新`main`（本单形成基线`3489bad8dfc0da02784a4a7fd2337f8e487a19a8`），以及五正式状态、上游F05 Source守卫、[PR92 A NO-GO验收](07_重建工作区/F05-7_PR92_A主控原H52零Job根因预算预审与阶段2NO_GO裁决_2026-10-17.md)。新工程隔离分支固定`fix/f05-7-h52-proven-schema-minimal-01`，独立PR；不得以`feat/f05-7-deterministic-matching-readiness-four-tier`为目标，旧ref最近确认SHA `99c38d013f67cc56975f1664120fb87c204afc3c`仍严禁写。
- 目前原main H52 `.github/workflows/f05-7-frozen-h52-revalidation.yml` Git Blob`687a9f767b0d0b144372550735da6159066b4833`、511380 UTF8 B、52Jobs/其中50PG16服务、`&z`1/`*z`49、30条跨F03 guarded Push字符串；历史0Job[Run38958160214](https://github.com/suzhe868-arch/mb/actions/runs/38958160214)属中间版本映射anchor、SHA`bf9c698fabff721a52154fba662dc9b230d9a319`，最新真正复杂H52原生调度**仍未证实**。目标**停止无依据的合成探针循环**，转为对实际原H52的GitHub Actions语法/表达式/工作流schema进行可复现实证；确有错误则修、没有错误则NO-GO保持阻断。

## 2. 白名单与硬性停止条件
- 可新增审计/测试/中文报告仅限`audit/h52-proven-schema-repair-01/**`；可新增**仅一份**路径/分支限制的低成本只读CI`.github/workflows/h52-proven-schema-readonly-audit.yml`（只有1 Job、8分钟、`contents:read`、无PG16、无Source执行或写Token、仅对新隔离分支上的该审计目录/CI/H52文件变更触发，绝不得匹配原旧来源分支）。
- **唯一有条件可修改的既存文件**：`.github/workflows/f05-7-frozen-h52-revalidation.yml`。修改前须由B得到**固定版本且有可核SHA或依赖锁的actionlint、GitHub兼容静态schema证据**或GitHub官方确切原生error，证实**具体文件、行号、报错、影响**，提交before/after可机器验证的精确hunk，且具Git原Blob一致性预检。**无明确对应的schema/表达式错误，就禁止修改该既存YAML**，不得为“试一试”改映射/标量锚点、权限、Job、source或触发器；若无实证直接出`BLOCKED_OFFICIAL_ROOT_CAUSE_UNKNOWN`给A。
- 合法最小修订必须**保留全部原52个Job键/名字/执行命令/并发条件、全部50 H52 PG16服务、原原生branch触发器、原F03跨分支精确Ref校验与30条Guarded Push、全部Source Fail Closed逻辑、权限减权边界、原7份其它冻结Workflow Git Blob、业务/DDL/PDM/C零变更**。如确需调整anchor/alias，仅可在`actionlint`有实证并建立完整**命令字节/步骤顺序完全语义等价**的机械对照和独立负例条件下进行；改变Source签名、安全拒绝、工作流触发器、生产凭证、权限写入均绝对禁止。当前H52文件已511380B，任何修改不得突破512000B安全边界；无法在预算内保证等价则停，不得擅拆分工作流或压缩掉安全guard。
- 不得修改任何其他已有Workflow（包括原主F05-7、F05-8/9/10/D1）、旧来源分支、原Source脚本、生产/资金/客户数据；本任务对原source的写入权限严格为零。一个审计PR是否绿**不能代替**原H52在旧来源新SHA的52Job原生成功。

## 3. B一次性工程验证
1. **定点工具核验**：下载/使用固定版本带哈希校验的actionlint（或等价成熟GitHub Actions兼容lint）；对原main H52和失败SHA H52运行，记录工具版本、固定校验和、完整STDOUT/STDERR及实际return code。分别检查workflow-level triggers、52 Job、表达式、YAML anchors/aliases、大小限制、GitHub Actions合法schema；明确区分`linter 0 error`与`GitHub原生调度已证明`，并记录官方0Job root cause无法读取限制。
2. **历史三版本最小差分**：只读比较原来源ref H52、真正0Job失败SHA H52、当前main H52 Blob，搜集可复制完整hunk与对应linter错误；若存在确凿最小错误，在唯一H52文件修订，逐Blob校验7份其它原冻结文件未变；52Job、50PG16、49别名（如调整需等价机械审计）、30跨F03 guard、Source保护器、敏感拒绝与main已有修复不退化。不能消除错误则保持NO-GO。
3. **CI门禁**：若新增独立低成本Workflow，必须真实Push最终B HEAD原生Runner success，Node正负例/actionlint及1份非空、同SHA、未过期的官方Artifact；严格只运行**独立1 Job**。历史52Job/66PG16绝不能为验证“真正Github接受原H52”而在原分支Push，亦不能在此PR的yaml里偷偷替代成空绿。
4. **成本与失败规则不变**：原8 Workflow理论66Job/64PG服务/110 Artifact调用点/3520 Runner分钟、并发/工件GiB未签上限；任何PR通过不解除原Source `SOURCE_GAP`。如发现确实要调整GitHub仓库策略或原Source工作流外的任何代码、需要超1 Job测试/旧ref Push，则**停止并整理集中技术裁决方案交A**，不自行突破。
5. **交付形式**：PR标`B_SELF_TESTED / READY_FOR_A_REVIEW_H52_SCHEMA_REPAIR`且写出`SCHEMA_ERROR_PROVEN_AND_PATCHED`或`BLOCKED_OFFICIAL_ROOT_CAUSE_UNKNOWN_NO_H52_PATCH`，附末HEAD/原Blob/工具SHA256/若有具体错误行和修订hunk/静态正反例/原生同SHA CI/Artifact/回归排除项、阶段2仍`NO_GO`；后一阻断场景不强行改H52，直接提交真实结论让A决定是否接受残余未知与具体预算措施。
 
## 4. 权责与后续GO
- B只可做本单定义的验证与可证的原H52**最小**语义等价修补，不能自行决定阶段2。在A单独签署包含当时`expected_old_sha`/`target_main_sha`、明确并发Runner/分钟/工件容量和停止条件的`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED`前，绝不可触碰旧正式来源ref或执行原66Job。
- A独立验收B阶段结果；若找到证据充分的schema错误，确认修补后仍需另签受控恢复；若找不到已证明错误，就按阻断明示`OFFICIAL_ROOT_CAUSE_UNKNOWN`、`H52_ORIGINAL_52_JOB_SCHEDULER_NOT_PROVEN`、`SOURCE_GAP_OPEN`，不再无限循环造合成成功。C PR68与V1/生产边界完全不变。

**下一责任窗口B。根据本单一次性施工、测试、报告及正式交接，无需逐项询问用户；超白名单或额外阶段2权限必须先由A独立另签。**