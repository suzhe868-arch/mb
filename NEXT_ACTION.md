# 名邦汽车 V1｜NEXT_ACTION 当前唯一指针｜2026-10-21

## 当前已完成事项

- F06 Issue #171 已通过非生产子范围 A 独立验收，Issue 已关闭，PR #174 已标准合并。
- 业务 SHA：`06c880d7f53adda7862da88cde0b790fdc60f415`；合并/main SHA：`86f59431768f393232b8746cd3deb62f1044d85c`。
- 官方 Push Run #39602409488 / Job #119229953562 全步骤成功；Artifact #12347892081（36,014 bytes）有效至 2026-11-04T13:01:30Z。
- F07-1～F07-4 与 F08-1 的已验收 CI-only 成果直接复用，不重做旧包。

## 下一唯一任务

- `NEXT_OWNER=B`
- `NEXT_TASK=F07_NONPROD_RUNTIME_INTEGRATION_01`
- `NEXT_ISSUE=178`
- `NEXT_BRANCH=feat/f07-runtime-integration-nonprod-01`
- 正式施工单：`07_重建工作区/F07真实应用Runtime四域接线非生产整包_A主控B正式施工单_2026-10-21.md`
- F07 差异核查：`07_重建工作区/F07现有CI成果与真实Runtime缺口_A主控核查_2026-10-21.md`

本指针随包含上述施工单与状态更新的 A 治理 PR 标准合并 main 后生效。B 开工时必须重新读取最新 main；禁止依赖本文件或 Issue 中的旧 SHA 作为当前基线。

## 执行边界

1. 本包只把已验收 F07 电话回传、图片资产化、可信父来源、通知/SLA/Incident 合同接入当前应用的**非生产 Runtime**，并做实际应用入口级 PG16/HTTP 集成测试。
2. 只允许施工单中的新增路径及 `engineering/src/app.mjs`、`engineering/src/server.mjs` 最小接线；旧 F07 CI、F03/F05/F06 已验业务、正式 PDM/Schema/Migration、`engineering/src/config.mjs` 生产拒绝门禁、C 轨全部冻结。
3. 缺少签名父事实或授权时必须 `SOURCE_GAP/FailClosed`；不得新增产品权限，不接真实 JYT、CDN/OSS、Feishu，不用真钱，不开启生产。
4. B 完成语法与路径门禁、受影响范围关联回归、最终 SHA 官方 Push 双 PG16 Job/Artifact 后交 A 独立验收；B 不合并 main、不更新主控状态。
5. F06/F07/F08/V1 总体仍 `NOT_READY`。F08-1 已验成果复用；F08 完整阶段正常验收后，B 后端最终整体验收由 A 独立负责。C PR #68 继续独立。

