# 名邦汽车 V1｜CI治理 PR76｜A 第三轮验收与Stage1合并、Stage2原生验收交接

> 2026-10-17｜真实阶段状态：`A_STAGE1_APPROVED_STANDARD_MERGED / STAGE2_NATIVE_MATRIX_INCOMPLETE / CI_GOVERNANCE_FINAL_NOT_READY / F05_SOURCE_GAP_OPEN / NO_PRODUCTION`。

## I. A独立审核依据
- 任务`CI_TRIGGER_SCOPE_GOVERNANCE_01_IMPL_PR76`；[PR76](https://github.com/suzhe868-arch/mb/pull/76)末HEAD `1864447f84ad65dcc0396d907f255fd7ccdafde4`。本A直接复核全PR Patch/真正GitHub Compare: 16份文件（6新增只读审计、新增测试/交接、10份旧F05工作流修改）；十份旧工作流每份**仅+32行（paths字段+31正向过滤）、0删减**，未更动`push`原历史分支、`workflow_dispatch`、安全Job、PG16、真实Source验证、HTTPS负例、Artifact、权限。B测试十旧SHA字节复算签字合同。
- [同末SHA官方 Push Run38930888210](https://github.com/suzhe868-arch/mb/actions/runs/38930888210)，原生Job117074271472，日志36/36 Node通过、0 fail；清册扫描322份Workflow/96份F05/广谱PR=0。官方同SHA有效工件12058507557，16018字节，官方摘要`sha256:572f76db5b82eeac1b8a143d498282aa05a2fee68524b01c593a20fbb0ec3a4e`（A未独立ZIP字节复算）。
- PR76真Source安全负例仍真实失败：`F05_9_NOT_IN_OFFICIAL_NEW_PUSH`、`F05_10_NOT_NEW_OFFICIAL_PUSH`、`D1_NOT_NEW_OFFICIAL_PUSH`；其余F05-7/8在观察时运行中，不能借PR主分支合并宣告正式来源恢复。
- 用户GitHub管理员两张截图确认`main isn't protected`、未配置 classic branch protections；本轮GitHub官方Rulesets依旧`[]`。阶段1严格按此前逐文件批准的限制。
- A发现五类真实PR After在PR76合并前不可独立验证：因PR自身必然含十份F05 workflow的修改，使任何添入的C-only变化仍命中工作流自路径。为保留真实验收而非伪造通过，A已[签署双阶段技术裁决](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/CI触发治理_PR76_A主控第三轮独立验收_两阶段真实回归技术裁决_2026-10-17.md)并在[PR76独立审核评论](https://github.com/suzhe868-arch/mb/pull/76#issuecomment-6219986802)归档。

## II. 实际Stage1标准合并（不是最终“CI_FIXED”）
- A使用GitHub标准`merge`，`expected_head_sha=1864447f84ad65dcc0396d907f255fd7ccdafde4`，服务器实际响应`merged:true`、**合并提交SHA `a4bcd2969fd1c01fed1711a35bade78f31d6db11`**。
- 合并内容限上述十份F05 workflow正向paths过滤及非生产Node审计；无强推、删原分支、跳过正式验证或减Source签据。A的**正式判定**仅`A_STAGE1_STANDARD_MERGED_PENDING_STAGE2`。
- 尚缺原生完整After矩阵，包括真正C-only、F05-only、shared、mixed；如以后验证失败，须经A批准保留可追踪的普通revert PR，不能强推。用户不应被告知“最终已修复”。

## III. Stage2 首条真实实验与局限
- A从刚合并的main SHA `a4bcd2969fd1c01fed1711a35bade78f31d6db11` 创建了隔离草稿 [PR77｜C-only CI路由验证](https://github.com/suzhe868-arch/mb/pull/77)，实验分支`audit/ci-trigger-c-only-after-pr76`，单条非业务变更`apps/mobile/evidence/CI_TRIGGER_SCOPE_C_ONLY_PROBE_20261017.md`，HEAD `c90e5917aa81fcb69be0effcdd89d3fa27e8ab9e`。此草稿绝不允许合并main。
- GitHub原生API于查看时对该SHA报告`total Actions Run=0 / total Check Run=0`，**未观察到任何旧F05误触发**，符合静态预期；但这是一个**尚未充分证明成功的负例观察**，必须复核Actions事件创建及正例触发才能锁定。尤其`.github/workflows/c-app-01-build-render.yml`仅存在C正在整改的PR68分支、尚未在main：本次PR77没有跑C端构建，不能称“C必需CI保持绿灯”。
- 先前PR76自身修改十份F05 workflow，真PR Run已证实`WORKFLOW_SELF`阳性，并且三条旧Source硬门禁正确保持FAIL；还需要严格归档最终Job/Run/Artifact和其他三类正例。

## IV. B下一唯一授权与停止线
1. **继续本CI任务的Stage2原生验证，不要再开F05-7来源恢复**；B在A既有治理工作区`engineering/ci-trigger-governance/**`内整理只读After验证证据及静态对照，**另开隔离临时PR**（不可合并）做F05-only、真正shared、mixed；Stage2需五类均取得同SHA原生Run→Job/Check/Artifact或明确Not Verified。B可以使用A现有PR77作为C-only负例，勿触碰C PR68已在进行的R3用户未验收代码。
2. 真F05-only/shared/mixed正例会触发10份历史PG16工作流，需**串行/有预算上限**执行并留官方Job数据，禁止并行打开大量PR引发新队列风暴。原正式Source失败保持失败，不能为了让整页绿灯绕过它。遇到平台资源或旧签据拒绝应如实保留红灯。
3. **先核对动作触发确实工作**：PR77 0 Run不能单独证明安全，应与合法F05-only workflow自路径阳性Run进行对照，并记录相关CI事件的时间和状态、是否Draft/是否受外部政策影响；复核C专用workflow尚未进入main的事实。
4. **禁止B自行关闭/合并真实业务PR**；PR77及所有探针PR保持Draft或先行close并提供证据链接，永不合并main。A独立验证全部真实After矩阵、安全门禁及真实漏检后，才正式`CI_TRIGGER_SCOPE_GOVERNANCE_FIXED`；失败则A写有凭据的回滚PR。
5. F05五条父Source`SOURCE_GAP`、F05/F08全域、V1和生产`NOT_READY`；C PR68仍独立进行R3，项目全面可用性不受Stage1治理证书替代。

## V. 项目指针
`NEXT_OWNER=B`；`NEXT_TASK=CI_TRIGGER_SCOPE_GOVERNANCE_01_STAGE2_NATIVE_AFTER`；`CURRENT_WORK_FILE=07_重建工作区/CI触发治理_PR76_A主控第三轮Stage1标准合并与Stage2真场景交接报告_2026-10-17.md`。当前任务不是F05-7开发、不是生产上线。
