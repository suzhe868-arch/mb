# 名邦汽车 V1｜Issue171｜F06 Composite单Runtime普通Lock生命周期可信接线｜A主控B正式工程施工单

> **授权状态：本文件及治理PR正式合并main后生效。**  
> Issue：[ #171 ](https://github.com/suzhe868-arch/mb/issues/171)；任务ID：`F06_NONPROD_COMPOSITE_LOCK_LIFECYCLE_INTEGRATION_01`  
> B指定分支：`feat/f06-nonprod-composite-lock-lifecycle-01`（从执行时最新main创建）。  
> A事实核查：[《Issue164后F06真实Runtime与Issuer剩余差异》](F06_Issue164后真实Runtime与Issuer剩余差异_A主控定向核查_2026-10-21.md)。  
> **本单授权类别：仅CI/127.0.0.1/可销毁非超管PG16签名Composite，非生产、无真钱、无新用户产品规则。**

## 一、为什么必要、为什么不是重复施工

1. Issue164/PR169已验 `COMPOSITE_NONPROD_SIGNED_V1` 单库、9签名事件及Lock到Synthetic Refund pending/closed，42/42+32/32+6/6+Legacy审计1/1；**保留已验所有源码和官方证据**，绝不重建PR139/PR150/PR153/PR156/PR162或第二套金额公式。
2. 原`f06-lock-runtime.mjs` 在旧CI库中确实含独立生命周期Service+Handler，但`f06-nonprod-composite-runtime.mjs`当前只挂Lock Service+Handler，没有普通Lock lifecycle动作。
3. 旧Lifecycle的`assertF06TestEnvironment`、`verifyF06TestDatabase`、`f06_real_lock_test`、`employee_sessions`、`DISPOSABLE_TEST_ONLY`、旧合成`lock_lifecycle_finance_proofs`并非本次Composite真实签名来源。直接挂载会失信或运行失败。B必须**显式新旧双入口、原Legacy行为完整保留**，不能粗暴关闭原guard。
4. 旧LockRequest 6小时申请有效期、竞争自动候补和客户安全查询已有，**只对与本单相互影响的边界做关联回归**。普通无资金Lock的延期/释放/取消/到期应复用已有被验业务状态机；3天默认锁定期/权限/源头条件继续按现行PDM，不增加新产品政策。

## 二、唯一允许的技术实现

- 同Node、同物理`f03_auth_test/f03_ci`真实非特权PG16、同Composite受控当前GH Push SHA/RunID和合法版本化源签、可信真实F03 Employee Session。由服务端内部模式选择Composite，HTTP仅原业务字段和Bearer业务Session，拒绝客户端自述`issuer`、`employee`、`role`或`trusted`。
- 在原受控Lifecycle Service上仅作必要最小双入口/委托，或在**本Issue新目录**对Legacy核心建立薄适配。不能复制整个Lock状态机、金额/退款核心；`CI_LEGACY`默认旧数据库、Issuer、事件命名、双同意门禁、审计、旧请求语义和旧只读资金判定全部保持。
- 对Composite读取真实本PG16当前`public.locks`、父签名`attestation/events/key`及`deposit_receipts/transactions/refund_cases`，在同事务同行锁下确定`无合法资金事实`而非依旧`f06_real_lock_test.lock_lifecycle_finance_proofs`自证；来源缺失/无法验真必须拒绝，资金存在则按现行权限和业务规则拒绝普通Lifecycle操作。不准将取消/到期作为解除签名财务占用的捷径。
- 普通Lock`extend/release/cancel/expireOrdinary`只有在权限/Scope、当前身份/归属和规则允许时运行；受控时钟到期只能信PG时钟，普通到期不触发真实资金流；Priority来源期仍独占，保护规则不得弱化。每个动作必须有旧状态/新状态、不可变新Issuer签名Event、唯一Key与同事务`public.audit_events`，跨真实两个Backend并发/idempotency及注错Rollback。
- 合法接续的LockRequest 6h/自动候补/客户安全进度只增最小关联测试；不可假造已验合同范围为新完成。若真实现有signed core不能安全适配，只报告`BLOCKED_F06_COMPOSITE_LIFECYCLE_SIGNED_SOURCE_GAP`及真实源/函数/SQL和所需最小A裁决，不得改冻结父源码或报假通过。
- 禁止生产/公网，禁止正式资金Issuer/真实支付、`completed`、`refunded`、在线银行微信/开票/交付确认、任何PDM新规则；F07/F08/C轨不在此任务。

## 三、精确文件白名单 + 用途授权（两条件均必要）

**允许新建**
- `engineering/f06/nonprod-composite-lock-lifecycle/**`：非生产特定Composite私有事件/只读来源适配、隔离测试、证据归档，可建独立隔离sidecar.sql但**不可改旧任何sidecar.sql或公共DDL**。
- `.github/workflows/f06-nonprod-composite-lock-lifecycle-onejob.yml`：本次专项唯一CI工作流；勿改旧workflow/required check，勿制造无关旧F模块全量运行。

**仅必要时允许最小改动**
- `engineering/src/f06-nonprod-composite-runtime.mjs`：只增加严格受控Lifecycle适配和HTTP入口、签名源校验，保留现有6个合成业务路由及单PG门禁。
- `engineering/src/f06-lock-lifecycle-service.mjs`、`engineering/src/f06-lock-lifecycle-http.mjs`：只准Composite独立适配、受控真实Session、只读同PG资金签名守卫/记录新源事件；CI Legacy原先业务响应/限制不变化。
- `engineering/src/f06-lock-runtime.mjs`：只有Legacy兼容确需的最小调整。
- `engineering/src/f06-lock-service.mjs`：只有Lifecycle所需已验Composite Lock快照/事实只读衔接，不得变更历史审批/6h/候补核心。
- `engineering/src/server.mjs`：只有开关组合确需挂载时最小调整；优先在已经单Runtime封装的Composite内完成，不得放宽现有受控test条件。

**只读冻结**
- `engineering/f06/**`除上述新增目录之外所有旧资金/签名/sidecar服务/迁移，`engineering/f02*/**`、`f03*/**`、`f05*/**`，`engineering/src/app.mjs`、公共SQL/DDL、24迁移、旧workflow、PDM Final/IA、生产配置、正式支付/退款/成交实现、F07/F08、C PR68。

## 四、B目标测试与自审

- 单本次最终HEAD的官方Push Job：**不少于16项真正新增且已执行的Native PG16/HTTP场景**，至少覆盖普通无钱Lock延长/释放/取消/到期（四种真实正例）、当前员工会话/Permission/Scope/归属现时校验、PG数据库时钟前后边界、跨Backend并发及幂等重放、真实PG事务中途失败全回滚、同车唯一Lock、资金/Transaction/Refund事实存在时拒绝、来源/Issuer签名缺失拒绝、Priority锁拒普通到期/延期、申请6h/候补的受影响关联回归。
- 跑本任务真实影响的旧Legacy生命周期与Issue164 Composite业务正反核心回归（不是机械重跑F01～F05所有CI）；写明不同模块数字，不能把旧42/42重新冒充新16测试。
- 若修改161父表或24签名迁移所验相关领域的输入/策略或生成新签名侧车，要以本SHA真实不同OID的161表/24迁移Seal和不可变历史数据核验；不得沿用上一SHA封印值宣称本次真跑。
- 反证重点：`CI_LEGACY`默认路由和审计不变化；单GH Push不能伪造旧多branch；源缺失时启动/动作硬拒；支付、真实Refund/Transaction completed继续强拒。
- **每批改动后、每commit前**：`git diff --check`，全部变更JS/MJS/CJS`node --check`（如Shell也做`bash -n`）；逐路径、逐关键hunk核对最新A白名单+用途。官方CI不能替代本地语法门禁，整包完成后一次交A。
- 交接内容：中文摘要、精确`base SHA/head SHA`、真实新/受影响旧测试命令及原生0fail/0skip日志、PG16非超级用户/物理OID/资金只读证明、权限/签名失败例与签名父Seal、有效官方Run/Job/Artifact、变更范围/用途矩阵、残余`SOURCE_GAP`。B只申请`READY_FOR_A_REVIEW`，不自行合并main或关闭Issue。

## 五、结束与下一阶段

仅本单`F06_NONPROD_COMPOSITE_LIFECYCLE`可申请A技术验收；F06整个阶段、F07、F08、V1都`NOT_READY`，生产/真钱/真实客户使用始终禁止。A验收本任务后才另行独立核对F07合同、来源与已有资产，依工程路线决定后续B阶段授权。F08正常A验收后B后端整体终验由A另行负责；不反复审查已验F01～F05。
