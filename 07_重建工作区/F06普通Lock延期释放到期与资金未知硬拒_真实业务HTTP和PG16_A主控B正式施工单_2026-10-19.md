# 名邦汽车 V1｜F06 第二条真实业务纵切：普通Lock延期、人工释放/取消与无款超时保护｜A主控B正式施工单

> **2026-10-19 正式放行：`A_RELEASED_FOR_B / NEXT_OWNER=B / NEXT_TASK=F06_REAL_LOCK_LIFECYCLE_HTTP_PG16_02`。**
> 主责任B，A独立终验与标准PR合并。指定新分支 `feat/f06-real-lock-lifecycle-http-pg16-02`，必须从A本轮**最新正式main**创建。
> **非生产/隔离PG16真业务纵切**；正式微信/Customer/F03 Employee Source Issuer、生产部署、真实意向金/交易/退款依旧绝对不授权。用户新增付费预算`$0`。B在本包内一次性完成工程、测试、安全自审和真实CI证据交接，不需要用户反复输入“继续”。

## 一、正式产品Authority与当前可复用实物

1. 主Authority：`07_重建工作区/PDM-18_最终完整规则.md`，尤其§§2、13～25、27～29、31～32；真实Deposit/Transaction/Refund受`PDM-19_最终完整规则.md`只读边界及员工权限PDM-02、客户安全投影PDM-20、E端合同PDM-21、业务配置PDM-22、审计PDM-25共同约束。遇冲突以这些已正式批准Final和现行IA为准，不自创释放/资金规则。
2. 本包父实物：[PR #129](https://github.com/suzhe868-arch/mb/pull/129)由A完成真实独立验收并标准合并 `main@c3fa09646e10c9f0392c62ee1f35f56668b25494`。已验非生产Node54/54、PG16真实HTTP 21/21、PR本HEAD 10个工作流28/28全绿；[中文报告](PR129_A主控F06真实锁车申请审批候补HTTP与PG16独立验收合并报告_2026-10-19.md)。
3. 原 `engineering/f06/lock-lifecycle-ci/**` 是旧F06-2**CI-only**实现；含旧签署/固定ref/历史Sidecar，不是可直接上线的REST实现。允许只读复用其状态机/业务负例思路，**不允许改动旧冻结源码、签署器或迁移封印**以迁就本次新业务分支。新实际服务必须建立在PR129已验 `engineering/src/f06-lock-*.mjs`、`f06_real_lock_test.lock_snapshots` 的现有真库数据和原生Node HTTP路由上，绝不能另外造一个脱离最新Lock实例的Mock服务。

## 二、唯一交付目标与接口合同

在PR129建立的实际应用层中新增 **合法员工操作正式Lock的最小真实HTTP纵切**（非生产身份限定）：

1. **人工延期**：`POST /api/v1/locks/:lockId/actions`，`action=extend`，携带独立强幂等键、必填审计原因及被审批有效的新延长时长/期限；只对`active`、尚未到期、仍处于普通72h/可配置有效期管理、当前Customer/Vehicle/Cycle与合法对象Scope允许且**可以合法证明无真实Deposit**的Lock放行。使用PG服务端时钟及事务更新**同一条Lock**当前`expires_at`，保留创建时72h／初始价格/策略快照、老期限、actor、reason、old→new不可变事件。不得对Priority-origin或真实付款后的Lock走普通延期假路径，不得因后台新默认期限追改旧Lock。
2. **人工Release或Cancel**：同一路径独立`action=release`或`cancel`，合法当前responsible在自身Scope内或具有**独立`lock.ci.manage`业务capability＋当前对象scope**的名邦管理人员可执行。SystemAdmin控制面、4S Member、过期会话、没有明确capability、他客/其他团队员工、已撤权、已失效Customer/owner、错误车辆周期一律拒绝。理由必填，完整旧态/新态/actor/time/理由及幂等审计；不物理删除Lock、旧Price/Source Snapshot、Waitlist、Priority历史、Deposit/Transaction事实。
3. **普通无款系统到期**：新增**仅服务端内部调用**的明确测试许可system expiry操作，在独立PG事务以数据库时钟判断确已过期且可信只读资金状态证明没有真实Deposit/Transaction后结束Lock，带系统actor/system reason写入审计。不提供可由HTTP任意Caller调用的生产公开Expire端点、不假装已部署生产定时调度；提前到期/来源未验证/有款/有Transaction/竞争中全部Fail Closed。
4. **付款/交易来源安全闸门**：本任务无正式Deposit Issuer，**不得以`SELECT 0 rows`或空表推断“已确认没有付款”**。允许在明确的`DISPOSABLE_TEST_ONLY`真PG16隔离测试数据库内，由受控的合成财务负/正事实签发适配器建立**显式可核验合成absence/present/unknown**证明，并同时只读实际`public.deposit_receipts`/Transaction关联事实；unknown/真实签发源无法核证、有款、存在交易时拒绝任何普通自动到期/普通延期/有越权风险的release，绝不改动真钱或生成Refund。合成absent仅可使本次非生产正例通过，不能扩展到生产。
5. **Lock结束后的合法一致性**：不自动把任何Waitlist提升为下一笔Lock，不清空排队顺序、不恢复原Priority、不覆盖客服责任或原始占用历史。失效/隐藏/供应异常、Archive、Customer停用、Owner变动的状态按PDM-18保真；供应异常不冒充到期自动release。普通Lock可见性按底层规则，Priority-origin存续/结束后的投影不得向其他客户泄漏。
6. **客户安全读取**：在已有`GET /api/v1/lock-requests/:id/status`或按PDM-20冻结的最小安全投影增加**本人Lock当前有效期限/延期/终态**（只限已验非生产Customer会话），不构造全新用户进度页，不显示价格内参、实际付款、手机号、actor、他客、队列保证名次。仍必须经source/cycle/visibility/identity逐次核验。

## 三、代码路径白名单、禁止区和资金边界

- 允许在`engineering/src/f06-lock-lifecycle-*.mjs`新增service/HTTP/隔离启动模块、在现有`engineering/src/f06-lock-*.mjs`与`engineering/src/app.mjs`、`engineering/src/server.mjs`做本包明确必要的小量接线；新增`engineering/integration/f06-lock-lifecycle.pg16.test.mjs`、`engineering/tests/f06-lock-lifecycle-*.test.mjs`、`engineering/sql/f06-lock-lifecycle-disposable-only.sql`、`engineering/scripts/f06-lock-lifecycle-*.mjs/.sh`，以及中文自验与证据。`engineering/package.json`原则不改，已有`pg`依赖复用。
- **禁止**修改PDM Final/IA、原`engineering/f06/lock-lifecycle-ci/**`、`engineering/f06/lockrequest-approval-waitlist-ci/**`、全部原F05/F06冻结Workflow、公共M94生产表/迁移、五Source/Issuer签发器、真实线上Vehicle/资金/客户库、C PR68、F07/F08工程文件。现有PR129已合并的服务语义不得回退；任何不可通过Sidecar表达的真实M94表缺口以`PRODUCTION_PHYSICAL_CARRIER_GAP`报告A，不擅自改旧结构。
- 身份始终为受控loopback、`APP_ENV=NODE_ENV=test`、F06专用显式许可及原生隔离PG16可信24条F03/M94/F05台账，角色`f06_lock_ci`、库`f06_lock_test`。所有生产Issuer默认拒绝；不部署真正微信或付款/退款动作。不接受请求体／转发HTTP header虚构permission、employee、Scope、paid事实。
- 幂等、操作回放、并发的结论必须依赖真实PG16行锁、唯一键、事务与后置重新校验权限，不允许在浏览器/纯JS缓存保证唯一。坏授权或失败rollback不得留下半笔事件、Lock状态或资金侧表变更。

## 四、真实测试和CI门禁

1. **先冻结PR129成功基线**：在本批最终业务SHA、完整checkout与新空隔离PG16中复现旧**Node54/54＋PG16原21/21**正反例，不得将旧Run 39273318026冒称为新SHA已重跑。新生命周期要求至少 **20条新增真实PG16事务/HTTP正反例**，0FAIL/0SKIP/0CANCEL；Node新增足量状态、身份、拒绝、JSON合同负例，并实际回归。两客户/两个员工并发、到期与人工操作冲突须有真正独立PG backend与最后COMMIT后的物理状态检查。
2. 用真实请求/真SQL断言：无/有/未知资金证明三分支、未到期/已到期、Priority-origin原子保真、72h初始快照不变、只一笔active Lock、合同的员工角色与Scope/当前owner、撤权与账号停用/4S/SystemAdmin、重复key与变更payload冲突、参数注入、真实rollback、同车跨Cycle、防员工越权、当前与历史Waitlist不自动升级、客户本人新期限投影/他客404、供应异常与Customer停用保留历史。
3. **免费CI条件授权**：首次远程Push前仅对本次准确变动路径静态计算最新`main`现存Workflow的`push`分支和`paths`，不得重新扫无关旧工作流或盲重跑旧66。若可证明只触发一份本任务新增**仅指定F06-2分支push**的非冻结Workflow，则允许单个标准`ubuntu-24.04` Job + `postgres:16-alpine`服务容器、Node22.16.0、45分钟上限、contents:read、checkout禁凭据、npm ci --ignore-scripts、不上传Artifacts/付费cache、无matrix无生产Secrets，新增付费预算`$0`。发现F05旧工作流扇出或预算风险则**不得Push**，记录确切冲突交A，而非skip-ci。
4. 本次旧F06-1经A批准的CI工作流只绑定旧B分支，不能挪动/伪造`GITHUB_REF`来重跑；新Job必须用自己当下合法分支、SHA，从正版原M94/F05可复用脚本构造合法测试库；F03 24条账本源/目标必须核摘要并证明非超管。如果合法基础不能构造则Fail Closed报告`BLOCKED_TRUSTED_F03_F05_BASELINE`，不得“补写签署行”。
5. 测试顺序：完整main同SHA来源/数据库真实性→旧F06申请审批真回归→新生命周期真库全部正反→安全自审/完整接口契约→中文证据与GitHub Job日志。旧测试不得删除/跳过/减弱，业务发现缺陷在本隔离分支修好后重跑；不制造重复大CI队列。

## 五、退出门槛及下一责任

- B须交：唯一最终B branch/HEAD、真实标准GitHub同SHA Run/Job链接、Node/旧PG16/新增PG16分别计数、真实迁移与账本SHA、非法权限/资金未知/竞态/回滚/客户投影原生日志、变更白名单反向安全自审与各类`SOURCE_GAP`，一份**中文**B自验报告。达到`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`才算本次B施工完成。
- **B不得自行创建PR或合并main**。本任务工作分支从实时最新main新建，禁止强推重置任何旧F06/F05分支；A在包尾独立读代码和真实PG16日志，确认安全范围后按仓库现行规范决定唯一标准PR触发/合并。PR自然触发的旧门禁须由A实际检查，不得借其它PR旧绿灯。
- 后续F06实交易/Deposit/Refund与F07、F08不在本包，无真钱、无生产，C PR68独立Draft。没有新的产品规则争议时，用户无需重复批准本已冻结产品Authority内的非生产实际开发。

**A正式放行签字：2026-10-19。当前下一负责人：B工程执行。任务：`F06_REAL_LOCK_LIFECYCLE_HTTP_PG16_02`。**
