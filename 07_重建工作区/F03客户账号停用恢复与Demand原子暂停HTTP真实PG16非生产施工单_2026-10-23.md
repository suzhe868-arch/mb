# 名邦汽车 V1｜F03 客户账号停用／恢复与 Demand 原子暂停｜A 正式非生产施工单

> 发布日期：2026-10-23  
> Issue：[ #235 ](https://github.com/suzhe868-arch/mb/issues/235)  
> TASK：`F03_CUSTOMER_ACCOUNT_DISABLE_RESTORE_DEMAND_PAUSE_HTTP_PG16_01`  
> 指定 B 分支：`feat/f03-customer-account-disable-restore-demand-pause-pg16-01`  
> **生效条件：A 对应状态治理 PR 标准合并至最新 main 后，B 才可正式开工。**  
> 最终交接：`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`；A 独立验收合并。

## 一、A 已确认的 PDM 权威与代码差异

- **产品规则不重新设计：** PDM-01 §11、PDM-02 §4/§6/§15.1、PDM-11 客户停用与 Demand、PDM-22 §10、PDM-25 审计为冻结依据。
- `engineering/f03/policy.mjs` 仅提供 `customer.account.disable` 的静态动作映射；`engineering/f03/permission-contract.tsv` 标注该业务由后续 F03/F04 承接；`engineering/src/app.mjs` 尚无对应 Customer 停用／恢复后端 handler。现有 #221/#227/#231 均无此真实业务 HTTP 写入闭环。
- 后端只补充非生产最小纵切；不可把它作为所有下游 Customer 业务域已经生产接入的证明。

## 二、必须实现的业务原子性

1. **主体授权：** active System Admin 在现有认证事务内可直接执行 Customer 账号治理；普通员工按当前 `customer.account.disable` capability（role default+个人明确 allow/deny、deny 优先）、active Employee、有效 Customer object Scope/Binding 与当前 Customer state 校验。4S 必须 hard DENY；普通销售默认不授但可合法单独授权。任何身份检查不可绕过真实当前会话或 `withSession`。
2. **状态及事务：** 当前 `public.customers.account_status` 的 active/inactive 状态受控更新；停用时，对同 Customer 的 `public.demands` 将全部 `active` 原子更改为 `paused`；原 paused、completed、cancelled 保持；保留 owner、客户 ID、转介绍、其他历史及已发生的资金事实。恢复账号仅更改账号可用性，绝不自动将 paused Demand 恢复 active。
3. **审计与幂等：** 记录 actor/principal、目标、变更前后、reason、变更时间、暂停 Demand 的 ID 与数量，以及 RequestKey 归一化哈希；重复合法请求不重复改变事实/生成审计，不同 payload 同 RequestKey 明确冲突。拒绝或异常不得遗留任何部分 Customer/Demand/审计记录。只在隔离库中按需使用私有 CI sidecar；不能改变 public DDL。
4. **并发与锁序：** 遵循现有 F03 会话及主体/权限锁序，Customer 行与相关 Demand 行锁定必须稳定，不引入全表写锁。真实 PG16 双连接覆盖停用与合法 Demand activation、停用与恢复、停用与 capability deny/Scope ended 的竞态；不得出现 Demand 已被停用而继续 active、死锁、脏审计或丢更新。
5. **可用性边界：** 停用只暂停需要该 Customer 身份的正常业务，不把真实 Lock/Waitlist/Consultation/Recommendation/Transaction/Refund 强行修改成 completed/cancelled/refunded 或物理删除。对关联旧服务已具备的 active Customer Guard 可做范围内证据联检；其他尚未正式接线域必须明确 `NOT_CONNECTED`，不跨包擅自修改冻结旧业务服务。
6. **HTTPS 合同：** 只暴露明确的 `/__ci__/f03/customer-account-status` 非生产入口，包含 read/disable/restore 与严谨状态、JSON、身份/Scope、转发 Header、重复 Header、请求键与错误脱敏；正式生产 server 不接线，不开放客户自助页面。

## 三、真实验收最低要求

- 至少两个独立非超级用户真实 PostgreSQL 16 Job。每个 Job 在当次 HEAD/Run/Ref 建立可销毁测试库、角色/默认及个人 permission、Customer object Scope、active/inactive 客户和 active/paused/completed/cancelled Demand 夹具；真正调用 `IsolatedAuth.withSession`，使用现有 auth 身份及真实 PG16 事实（不是 mock）。
- 强制矩阵：System Admin 成功，合法经理/店长/特授销售成功；4S/无 Scope/个人 deny/能力缺失/停用员工/凭据 disabled/强制改密/无效 Customer 失败；Scope 和 Binding 撤权，幂等重放/冲突，事务故障回滚，并发下权限撤销与 Demand 激活不越权。
- 真实 TLS/HTTPS 合同至少 10 项，DB 业务断言至少 24 项（含安全负例与竞争）；实施安全脱敏/非生产专用域名/缺省无生产路由，相关 Node/F03 Guard/F05 Demand 回归按受影响性执行。
- 两个 PG16 Job 都 `completed/success`，失败 0/跳过 0；最终 SHA 官方 Push Workflow 必须与真实分支、GitHub Run/Ref、测试日志和至少两份 Artifact 完全一致，A 可重新下载复算 ZIP SHA256 与内部完整文件哈希。
- B 必须在最终提交前逐文件 `node --check`、`git diff --check`、精确文件白名单/用途双审；中文证据交接明确 `CI_ONLY_F03_CUSTOMER_ACCOUNT_STATUS` 与未授权范围，`READY_FOR_A_REVIEW` 后交 A。B 不合并 main、不更新正式项目状态文件。

## 四、精确施工写入白名单

1. 新增 `engineering/f03/customer-account-status/**`（私有测试数据、真实 PG16 测试、证据、必要非生产私有侧车、中文交接）。
2. 新增 `engineering/src/f03-customer-account-status-service.mjs` 与 `engineering/src/f03-customer-account-status-http.mjs`。
3. 仅允许在 `engineering/src/app.mjs` 精确增加 `customerAccountStatusHandler` 可选插槽、仅 `/__ci__/f03/customer-account-status` 前缀消费；不得修改其他 handler/生产路由。
4. 新增 `.github/workflows/f03-customer-account-status-pg16.yml`；仅本指定分支、精确相关路径监听，具备两个独立 PG16 Job。

**其余现行正式 PDM、公共 Schema/迁移、旧 F03/F05/F06/F07 业务服务、旧 Workflow、生产 server、PC/C 页面全冻结只读。** 确认不兼容后 B 应提交证据与 `BLOCKED_A_RULING_REQUIRED`，不能擅自扩权。

## 五、父级门禁

Issue #187 继续 `SOURCE_GAP/FAIL_CLOSED`；F06/F07/F08/V1 继续 `NOT_READY/NO_PRODUCTION`。本子包不需要 JYT/Collector、CDN/OSS、Feishu，也不授权真实电话、真实客户、真钱、退款执行或部署。

---

## 附：原 Issue #235 任务说明与工程验收矩阵

# 名邦汽车 V1｜F03 客户账号停用／恢复及 Demand 原子暂停｜A 待正式生效施工任务

> **权限状态：只有 A 状态治理 PR 标准合并最新 main 后，本 Issue 才正式放行 B 施工；Issue 创建本身不构成提前开工授权。**

- TASK：`F03_CUSTOMER_ACCOUNT_DISABLE_RESTORE_DEMAND_PAUSE_HTTP_PG16_01`
- 指定 B 分支：`feat/f03-customer-account-disable-restore-demand-pause-pg16-01`
- 正式中文施工单：`07_重建工作区/F03客户账号停用恢复与Demand原子暂停HTTP真实PG16非生产施工单_2026-10-23.md`
- 现行规则：PDM-01 §11、PDM-02 §4/§6/§15.1、PDM-11 客户停用与 Demand 生命周期、PDM-22 §10、PDM-25 审计
- 与父级 Issue #187 并行但**不解除**其 `SOURCE_GAP/FAIL_CLOSED`

## 实码缺口与不重复施工证据
最新 `main` 的 `engineering/f03/policy.mjs` 仅列出 `customer.account.disable` 静态动作映射；`engineering/f03/permission-contract.tsv` 标记 F03 静态政策/后续业务实现；`engineering/src/app.mjs` 只接入 `customerOtherPhoneHandler` 等已有独立服务，未注册 Customer 账号停用／恢复处理器。既有 #227 仅实现“其他联系电话”修改，#221 实现“员工批发电话”权限配置，#231 是 F05→F06 同车快照证据，均不等于 Customer 账号治理。因此需新增独立、有限的真实 PG16/HTTPS 后端纵切。

## 正式业务要求
1. System Admin：active + 合法当前凭据/会话且非强制改密，直接以控制平面身份执行；不得由此取得 Customer owner、CRM、销售、Lock/Transaction 等业务权限。
2. 员工：只有 active 名邦经理、店长或获明确权限的 active 普通销售，满足 `customer.account.disable` 当前有效 capability、个人 allow/deny 优先级、目标 Customer 当前有效 object scope/binding、对象状态和会话实时校验才能操作。**4S hard DENY**，仅是 owner、同店、管理者头衔或可见页面都不产生权限。
3. 在同一 PG16 事务内锁定当前 Customer、记录 account_status 的 `active↔inactive` 实际变更，停用时将该 Customer 的所有 **active Demand → paused**，其他 paused/completed/cancelled 不变；Customer ID、owner、来源、推荐历史、资金与其他历史记录不删不重建。
4. 恢复 Customer 仅重新开放账号可用性，原来暂停的 Demand、pending Application、已结束/过期 Lock/Waitlist/Recommendation/Transaction/Refund 不自动恢复或重新激活。不能因停用而写入虚假的 completed/cancelled/refunded。
5. 所有实际操作具备 reason、actor、时间、变更前后状态与逐 Demand 影响数/关联审计；失败与拒绝不能留下 account/Demand/audit 的部分副作用。
6. 无客户自助账号停用按钮；仅非生产 PC 管控 HTTP/API 合同。所有客户身份权限操作应在正式业务入口依据最新 Customer 状态拒绝，**本子任务只确认受验范围，其他业务域尚未正式接线的 Guard 必须单列仍未验收，不许宣称全站权限闭环**。

## 技术与验收限定
- 复用现有 `IsolatedAuth.withSession`、F03 签名 DB readiness、现行 schema 与已验的 object Scope 绑定校验模式；不可开后门或伪造生产授权。
- 按数据库既有约束实现，禁修改公共表 DDL / 迁移或给生产默认插入权限种子。可在可销毁 PG16 数据库中新增本任务私有 sidecar（若幂等/审计证明确有必要）；需单独 seal/校验。若现有公共表、迁移或测试身份不兼容，则先精确记录 `BLOCKED_A_RULING_REQUIRED`，不要绕开。
- 使用固定锁顺序及真实双连接竞态测试：账号停用 vs Demand 激活/其他账号业务写入、停用 vs 恢复、Scope/permission 撤权 vs 停用，验证无死锁、不可越权、无丢更新；已失效凭据、system admin 停用、4S、失效 Scope、明确 deny 与越权对象均拒绝。
- 使用真实 TLS/HTTPS 负例校验 JSON 合同、重复/歧义 Header、请求键幂等、重放冲突、异常脱敏和精确状态；不得只运行 Node mock。
- ≥2 个独立非超管 PG16 Job，各自从空库准备真实 F03 登录/权限/Scope/Customer/Demand，运行正常及负例、必要关联回归，官方最后 SHA 的 Push CI 及至少两份可复算 Artifact 完整成功；B 中文自验/证据归档后 `READY_FOR_A_REVIEW`，A 独立验收并合并。
- 不接 JYT/Collector/CDN/飞书；不改 F06 资金/历史、F07 外部 Runtime、生产 `server.mjs`、C/PC 页面，不产生真实服务账户变更。

## 施工写入白名单（严格）
1. 新增 `engineering/f03/customer-account-status/**`（隔离 PG16 schema/fixtures/tests/证据/中文 B 交接）；
2. 新增 `engineering/src/f03-customer-account-status-service.mjs` 与 `engineering/src/f03-customer-account-status-http.mjs`；
3. `engineering/src/app.mjs` **仅允许增加一个关在 `/__ci__/f03/customer-account-status` 下的显式可选非生产 handler 插槽**，默认不注册到正式生产；
4. 新增 `.github/workflows/f03-customer-account-status-pg16.yml`，只监听本分支/本包白名单路径。

其余文件（包括 F03 冻结 reader、F05 已验业务服务、公共 schema/migrations、旧 Workflow、PDM、生产路由、PC/C）均只读。需要扩大范围必须先交 A 定向裁决，不得带越界代码交付。

## 最终硬边界
本 Issue 只允许签发非生产 `CI_ONLY_F03_CUSTOMER_ACCOUNT_STATUS` 子包。父 Issue #187 继续 `SOURCE_GAP/FAIL_CLOSED`；F06/F07/F08/V1 继续 `NOT_READY/NO_PRODUCTION`；不恢复已终止业务对象，不提供生产开关，不自动启动其他包。
