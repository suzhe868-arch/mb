# 名邦汽车 V1｜F05-8 Priority 到期有限批次清算真实 PG16 交接

> 2026-10-18，B工程执行窗口。受测代码SHA `390120045e366613ed1a2daf1c6ef347497dca9c`；[Run39140309523](https://github.com/suzhe868-arch/mb/actions/runs/39140309523) GitHub Actions `completed/success`，Node **147/147**、非特权真实PG16 **243/243**，0 fail/0 skip。此为隔离测试能力而非生产自动调度器/最终A验收。

## 本轮实际代码

- `engineering/src/f05-priority-ttl-sweep-worker.mjs`：`createIsolatedPriorityTtlSweepWorker({pool,env}).runOnce({limit})`。只在APP_ENV=test/NODE_ENV=test/127.0.0.1且一次性明确隔离测试Consent下实例化；每次只扫描最多25个已超时active租约，再按车辆逐笔事务重新核对。传入limit不足1或超过25立即拒绝。
- 每笔事务按与员工RECONCILE相同顺序锁住PG16同车advisory xact lock与`vehicles FOR UPDATE`，再检查同一租约是否**仍**expired+active，防两个Worker重复结束、重判或延长Lease。原租约更新`ended`并保留历史，先对该customer/vehicle/old cycle所有已有Match Results构造上界抑制，再从**同一**PDM12安全当前Match和现有PDM13 rank SQL查询合法新的候选。
- 共享的PDM13候选SQL收紧了真实当前责任：`customers.account_status='active'`、`current_owner_employee_id = demands.responsible_employee_id`、`employees.employment_status='active'`和角色`sales/manager/store_head`，继续要求独立Customer资格、员工明确可管范围和源匹配证据有效。下一位客户只有仍有合法高/可接受Match并且车辆仍在有效上市周期/合法可售、无活跃Lock或Transaction占用时才可创建**新Lease**；TTL按配置新冻结，绝不从旧Lease续期或凭历史事件直接授权。
- `engineering/catalog/000043_priority_ttl_sweep_disposable_test_only.sql`新增仅用于测试的immutable sweep audit（按旧`priority_id`物理唯一），记录原Vehicle/Customer/新Lease/结局。审计失败则旧Lease结束、抑制和新Lease一同PG事务回滚。原始F02-1的76业务表不改；测试侧表总41、物理表总117、隔离触发器24。
- Workflow增加`engineering/integration/f05-priority-ttl-sweep.pg16.test.mjs`的真实PG16整组回归，现有F05-7/8/9、批发价格及历史全部相同HEAD运行。不引入Priority自动Grant、Recommendation、客户免费查价Right或Lock；这四类仍是独立业务事实。

## 七组新增真实PG16验收

1. 非隔离环境和超过25条的非法批次请求直接拒绝，空待清单返回0；
2. 用真实F05-7 recompute产生10条受限合法high/acceptable源匹配结果，不以Mock高分制造候选；
3. 人为创建三个已有过期的物理Priority Lease，`limit=2`首次结束并下一Customer仲裁2条，返回`hasMore=true`，第二批处理剩余1条，再次执行无动作；
4. 两个独立worker同时选到同一过期租约，原Lease只一次清算，审计只有一条，下一Lease不重复；
5. PG16对audit写入故障注入造成整个Worker Promise拒绝，原Lease保持active、没有新Lease或错误的suppression；移除故障后重试成功；
6. 下一Customer优先资格失效时不得自动获得Priority；旧TTL仍被原子结束并保存日志；
7. 审计历史不能UPDATE/DELETE，运行期间不产生任何Recommendation/隐藏车Grant/批发查看价格解锁。

## 正式阻断与下一职责

本轮实现的是**必须显式调用的runOnce核心**，没有安装生产定时Cron、Webhook、Queue或用户端触发器；不会在无人触发时周期性清算。读端`f05_priority_safe_active_test`仍会按时间即时排除过期Lease，避免普通客户可见性被raw active永久错误屏蔽，但F05生产事件链/物理历史清算仍需真实可信Scheduler与恢复治理。优先级开关、正式权限Issuer、员工交接、三类车源、微信Customer、生产M94迁移、C/E端真实访问和跨锁车/交易闭环尚未验收。

**状态为 `B_IN_PROGRESS / NOT_READY_FOR_A_REVIEW / PRODUCTION_NOT_READY`**。现行`main` `9181a997edae1ad46fcda1b5a4777826512be955`不变。无A独立验收或正式PR，不触发F06/F07/F08，下一责任B。
