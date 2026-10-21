# 名邦汽车 V1｜F06 Issue #171｜F05 Match/Priority 版本正确的非生产预置路径最小补充裁决

> 日期：2026-10-21  
> 裁决角色：A 主控  
> 关联：[Issue #171](https://github.com/suzhe868-arch/mb/issues/171)、[PR #174](https://github.com/suzhe868-arch/mb/pull/174)、[PR #173 已合并的五文件签名来源裁决](https://github.com/suzhe868-arch/mb/pull/173)  
> **生效条件：本补充裁决治理 PR 合并到 main 后生效。此裁决本身不代表 PR #174 通过验收，也不授予合并 PR #174 的权限。**

## 一、裁决原因

Issue #171 的真实 Priority-origin Lock 负向测试必须引用真实、可验证的 F05-7 Match 与 F05-8 Priority 事实。F05-7 的正式服务只接受它自己的签名 v23 账本，F05-8 正式服务只接受它自己的签名 v24 账本；不能在已经推进到 v26（24 条签名迁移）的同一数据库上重新调用旧 F05-7 服务。直接 SQL 插入 Match/Priority 或用 Mock 代替真实 PG16 均不允许。

PR #173 已授权的五文件裁决将 `核对同Ref上游签名PG16.sh` 的唯一修改原先限定为真实分支门禁扩展。现需要再作一项更窄的补充：仅允许在 Issue #171 的精确真实 Push 分支上，按正确账本版本调用**未修改的现有 F05 正式服务**，生成非生产测试所需的可信源事实。除此之外，原裁决全部约束继续有效。

## 二、唯一新增授权

仅允许修改：

- `engineering/f06/nonprod-single-runtime-integration/核对同Ref上游签名PG16.sh`：在 Issue #171 精确分支 profile 内增加下列版本正确的测试预置阶段，并明确保留 Issue164 旧分支原始执行路径。
- 如为避免内联脚本过长确有必要，可新增 `engineering/f06/nonprod-composite-lock-lifecycle/**` 内的专用 CI 测试辅助脚本；辅助脚本必须由当前真实 Push SHA/RunID、当前非超管 PG16 和现有 F05 服务执行，且纳入新 profile 的源码摘要。不得另建通用 Fixture/Issuer API。

### Issue171 新分支的唯一合法顺序

1. **签名 v23（21 条迁移）阶段**：调用现有、冻结的 `engineering/f05/priority-arbitration-ttl-handover/preseed-v23.mjs`。随后只读调用原 F05-7 migration `verify` 并核实确有当前、有效的 high/acceptable Match 结果。该步骤必须发生在 F05-8/v24 迁移之前。
2. **签名 v24（22 条迁移）阶段**：调用现有 F05-8 runner 的 `--apply` 和 `--verify`；随后以真实有效 F03 员工会话、正式 Permission/DataScope 与当前 Demand/Customer 范围，调用原有 `setQualificationCI` 服务生成 Priority。随后只读验证 Priority 为 active、未过期，并与真实 F05-7 `source_match_result_id/source_signature` 对应且签名相同。
3. 继续执行原有 F05-9、D1/PDM17、F05-10/Consultation 的既有迁移顺序，最终仍须验证 v26/24 条迁移；不得改变这些迁移的源码、SQL 或签名规则。

### Issue164 旧分支的保护要求

- 旧分支 `feat/f06-nonprod-single-runtime-trusted-source-01` 必须保留原先 F05-8、F05-9、D1、F05-10 的既有迁移循环与顺序；**不得**运行 Issue171 的 Match/Priority 预置阶段。
- 分支选择只能依赖前置真实 GitHub Push / `GITHUB_REF` / `GITHUB_REF_NAME` / 本地 HEAD-SHA 严格校验之后的精确分支值。不得设置、覆盖或伪造任何 GitHub 环境变量。
- 旧 profile 的历史来源、签名规则、事件、迁移、数据库与 Legacy 行为不得因本补充裁决改变。

## 三、禁止事项

- 不修改冻结的 F05-7/F05-8 源码、migration、SQL、父签名表、公共 DDL 或原始签名公式。
- 不得用原始 SQL 插入、更新或伪造 `f05_7_result_versions_ci`、`f05_8_priority_ci`、`f05_8_events_ci` 的业务/签名事实。SQL 仅可用于只读校验测试结果。
- 不得使用 Mock、复制另一物理数据库中的 Priority 行、复用旧 Run/旧 SHA 签名或放松 ledger/version 校验。
- 不得改变 PR #173 对五个签名来源文件的精确白名单；仅按本补充裁决允许父链脚本中的上述新分支专用预置阶段。
- 不授权生产 Issuer、真实收付款、真实退款 `refunded`、成交 `completed`、部署/UAT 或 F07/F08 开工。

## 四、验收与状态

- 该预置路径只是让 Priority 来源测试具备合法输入，**不代表**测试已通过或 PR #174 已达 `READY_FOR_A_REVIEW`。
- B 必须在原分支继续，完成 Priority-origin Lock 的 extend/release/cancel/expire 四动作真实 PG16 无副作用矩阵、签名来源负向矩阵、161 张父表/24 条迁移跨三个物理 OID 的同 SHA Seal、Legacy 定向回归、证据门禁及有效 Artifact。
- 任何步骤失败均如实整改；最终必须以最后 SHA 的官方 Push Run 全步骤成功、0 skipped、同 SHA 原生证据为准，统一交 A 独立复验。
- 在 A 独立复验并另行签发接受结论前，PR #174 保持 open/unmerged，Issue #171 保持开放，`NEXT_OWNER=B`。F06/F07/F08/V1 均继续 `NOT_READY`。
