# 名邦汽车 V1｜F05-7 原 H52 Actionlint 受控取证与 B 正式交接

> **B_SELF_TESTED / READY_FOR_A_REVIEW_H52_SCHEMA_REPAIR / HISTORICAL_SCHEMA_ERROR_PROVEN_CURRENT_MAIN_CLEAN_NO_H52_PATCH**  
> **OFFICIAL_ROOT_CAUSE_UNKNOWN / H52_ORIGINAL_52_JOB_SCHEDULER_NOT_PROVEN / SOURCE_GAP_OPEN / PHASE2_NO_GO / NEXT_OWNER=A**

## 一、正式施工与文件边界

- 任务 `F05_7_H52_ORIGINAL_SCHEMA_MINIMAL_REPAIR_01`；A 放行 `A_RELEASED_FOR_B_PROVEN_H52_SCHEMA_ERROR_MINIMAL_REPAIR_ONLY`。
- 起点 `main=2d53c138afc12d2d7593c30368f21acd28ee0f51`；工作分支 `fix/f05-7-h52-proven-schema-minimal-01`。
- 只新增 `.github/workflows/h52-proven-schema-readonly-audit.yml` 和 `audit/h52-proven-schema-repair-01/**` 的脚本、测试、中文证据。**原 `.github/workflows/f05-7-frozen-h52-revalidation.yml` 及其它 7 份冻结 Workflow 全部未修改**；旧正式 Source 分支未更新。
- 本轮唯一受控 Workflow 仅新分支 Push 触发、只有 1 个 8 分钟只读 Runner、不使用 PG16 服务、不签发 Source、不操作业务、客户、资金及生产。

## 二、固定可复现 Actionlint 工具

- 官方 `rhysd/actionlint v1.7.12`（Linux amd64 发布包），GitHub Releases 官方摘要：`sha256:8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8`。
- 原生 GitHub Runner `curl --fail --location` 获取包后执行 `sha256sum --check --status`，校验成功才解压运行；`actionlint -version` 校验版本。
- 以 `-shellcheck= -pyflakes=` 排除非本次可裁的 Shell/Python 附加静态检查，保留 Actionlint YAML、GitHub Actions workflow schema、表达式的原生检查。完整 stdout、stderr、return code、错误行与规则均归档在官方同 SHA Artifact 内。该限域**不是**完整业务 Shell/Source 回归测试。

## 三、三个真实 Git Blob 版本及准确问题

| 版本 | Git Blob | 固定版 Actionlint | 发现 |
| --- | --- | --- | --- |
| 历史 0Job 失败 HEAD `bf9c698fabff721a52154fba662dc9b230d9a319` | `3a13bab79b4e45fb4e037a1d6fd4431593506148` | **退出码 1，2 个 syntax-check 错误** | 第 34 行映射锚点的步骤结构不符合 Actions schema |
| 旧正式原 Source HEAD `99c38d013f67cc56975f1664120fb87c204afc3c` | `eda68ce30bbccfa802f459e009ef0a6889918648` | **退出码 0，无错误** | 旧版静态合法，不等于同新 main 的父签恢复 |
| 当前 main 原 H52 | `687a9f767b0d0b144372550735da6159066b4833` | **退出码 0，无错误** | 已没有这一静态错误，但未原生跑过真正复杂 52Job 新版本 |

历史失败版原样 Actionlint v1.7.12 确切报错行号均为 **34:9**：

`element of "steps" section is scalar node but mapping node is expected`

`step must run script with "run" section or run action with "uses" section`

历史旧版 `- &z name: ...` / `- *z` 将步骤锚点以映射/别名形式嵌入；当前 main 改为 `- run: &z ...` / `- run: *z` 的 run 标量别名，当前文件已能通过固定版 Actionlint。此为**历史具体 Schema 违规的独立实证**，但不是 GitHub 官方原生 Check Suite annotation；不能声称已取得 GitHub 后台对 0Job 的官方精确错误文本。

当前 main 原 H52 511380 字节、52 个唯一 Job、50 个 PG16 service 声明、`&z=1`、`run:*z=49`、跨 F03 guarded git push 字符串 30 处、contents:write=0，静态不变量守卫均成立。代码未调整任何这些字段，**没有需要修改的当前 Actionlint 错误，遵守 A“无明确当前错误不得盲改”禁令**。

## 四、真实 CI 及缺陷闭环

- 首次隔离 Run [38998472999](https://github.com/suzhe868-arch/mb/actions/runs/38998472999) 的 9/9 正反例及工具下载校验成功，但自研 Job 键扫描不识别 `h-source` / `h-https` 两个携带内联 YAML 锚点值的 Job，随后失败。仅修审计器，不改 H52。
- 修复扫描后 Run [38998539336](https://github.com/suzhe868-arch/mb/actions/runs/38998539336)：`completed/success`、9/9 Node 正反例通过，三个真实 H52 文件 Actionlint 分别 2/0/0 errors、exit 1/0/0；Git Blob 原字节均符合固定值；官方有效非空 Artifact **12088057985**、2542 字节、`sha256:6ed3aa845f192e8dd3af8415443d67c5bec17fcd206bfbfa25e327d9bcf7f67f`，该 Run HEAD `034c78142ab1bff63a809d5483b4fcd112e5af43`。
- 末次提交额外**严格断言历史第 34 行两项 schema 错误且当前及旧来源 Actionlint 为 0**，执行 CI 的最终结果及工件须以最终 PR HEAD 的真实 GitHub Run 为准；不同 SHA 历史成功不得替代末次校验。

## 五、阻断、风险与 A 下一步

- **当前原 H52 不做任何修补**：原 H52 已对本次固定版 schema 检查 0 error，没有需要修改的可证具体 hunk；不制造伪修复，不改变 52Job/50PG16/30 guard/权限/Source 条件。
- 原 H52 **真正复杂 52Job 在旧来源分支的新 HEAD 原生调度**尚未证明；GitHub 官方 0Job 解析错误仍不可读取。**旧五 Source 的 SOURCE_GAP 仍保持 Fail-Closed**。
- 阶段 2 仍 A 正式 `NO_GO`；8 份原 Workflow 66Job、64 PG16、110 Artifact 调用点、3520 理论最大 Runner 分钟，并发及工件 GiB 未签预算。没有 `PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED` 时严禁旧 ref Push、快进、重试或 66Job 运行。
- PR #68 的 C 端真实双端/视觉，V1 产品及生产继续 NOT_READY。

**B 结论**：历史映射锚点导致的 Actionlint 语法错误已独立复现，当前主线该错误已消除，**本批无需修改原 H52**。请 A 独立验收这项精准证据，并裁决是否仍要进一步获取 GitHub 官方原生错误或另行签发有严格成本、并发和止损边界的受控恢复许可。
