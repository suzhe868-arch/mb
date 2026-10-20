# 名邦汽车 V1｜F06真实Transaction正常取消｜A独立验收PR146、合并与下一包放行报告｜2026-10-20

## 一、验收对象与结论

- 正式任务：`F06_REAL_TRANSACTION_CANCEL_HTTP_PG16_01`；[Issue #144](https://github.com/suzhe868-arch/mb/issues/144) 已完成关闭。
- B实际最终 HEAD：`fa327ccece5efc1fe18d91558b1f7ff7d8a7299c`；提交树对比合并前main `d7f365356fe6f28db19c97cdaf4fb6f12fd23640`：ahead1、behind0，**11项新增文件**，严格限制于 `engineering/f06/transaction-cancel-http-pg16/**` 和单一新Workflow。未修改旧父签名、PDM Final、公共DDL、线上路由。
- A独立取得官方[Run #39415825663](https://github.com/suzhe868-arch/mb/actions/runs/39415825663)和[Job #118604456336](https://github.com/suzhe868-arch/mb/actions/runs/39415825663/job/118604456336)真实运行结果：全部步骤 `completed/success`，父 **392/392**、新Cancel真实HTTP/PG16 **43/43**、TLS真实拒绝 **10/10**，计**445/445**，失败0、跳过0、取消0。仅一次Run、同B末SHA，不拼接历史成功。
- A独立读取新service/worker/server/sidecar/CI脚本、43项HTTP测试、TLS测试及原 `IsolatedAuth.withSession` 事务实现，逐点比对PDM-19 Final §§6–10、19–28与签发B施工单。旧冻结4A源 `f06_3b_ci.transaction_origins` 与PR139源 `f06_real_tx_ci.origins` **实际不兼容**；本次真实PG16对旧服务调用返回 `F06_4A_UNSIGNED_OR_DRIFTED_ORIGIN`，没有伪造3B签名。
- 在可销毁PG16中新增仅CI `f06_real_cancel_ci` 受限来源，正常`in_progress→cancelled` 与origin/event/request_key/audit同`IsolatedAuth.withSession` BEGIN/COMMIT，异常ROLLBACK；历史Lock保持 `released/converted_to_transaction`。测试对Status/Event/Audit三处抛错后原状态和所有新记录均0残留。
- 真实两个PG Backend PID **1505/1506** 争抢同Tx，仅一人提交；但共享Employee Session账号行可能先行互斥，**不宣称两者同时持有Vehicle锁**。供应状态 `unavailable`、周期已结束后合法取消通过，绝不重新上架/生成新周期。权限撤销、Capability/Scope失效、4S、伪Token、非负责员工、幂等和不同Key均有实际拒绝测试。
- 真源OID **35233**；独立父审计OID **39349**，父Deposit/Transaction/Refund/Cancel恢复OID **43594/60893/69611/78558**。冻结父四Schema **161张表逐表COUNT+MD5**、24条迁移、跨OID恢复与全行Seal `90137b1f289c59ffa3430daae0710f88625d70fc1b3dc4e30c06ce85da35786c` 一致。新Cancel sidecar不冒充161旧父全集。

**A结论：`A_ACCEPTED`。** 标准[PR #146](https://github.com/suzhe868-arch/mb/pull/146) 已实际合并，GitHub merge commit `6bba1f42ec1f9d11851a181b8ab28bbb44fcc900`；Issue #144 已关闭。

## 二、不可省略的残余限制

旧F06-3B直接不安全Lock转换入口没有因本PR修复；冻结4A/4C也不能直接当新PR139 Transaction取消器。同Employee Session先锁仍限制跨主体Vehicle锁等待的强证明，需独立后续授权补探针。真实完成 `completed`、成交价/纠错、退款付款和入账、真实Employee多方handoff、Issuer、真实支付/微信/银行、生产路由/DDL/客户资料、UAT/部署均未放行。F06/F07/F08/V1整体仍`NOT_READY`，预算新增$0。

## 三、下一完整授权

按PDM-19 Final §§19–26、28–30及现已验真实父源，A下一批放行 `F06_REAL_TRANSACTION_REFUND_PENDING_CLOSED_HTTP_PG16_01`，[Issue #147](https://github.com/suzhe868-arch/mb/issues/147)；下一责任 **B**，执行时从最新main新建 `feat/f06-real-transaction-refund-http-pg16-01`，仅**已真实签名取消的合成Transaction**申请Txn侧pending退款或无真钱关闭closed。Lock侧Refund不得换subject冒用；必须新独立签名Tx来源并真实PG16同事务保护余额/归属/资金。旧父445同最终B SHA复跑，新增真实PG16 >=40、TLS>=10，总>=495项并恢复父161及24迁移/跨OID Seal。B不得建业务PR/合并，达到`READY_FOR_A_REVIEW`交A独立验收。

正式施工单：《F06真实Transaction侧Refund待处理与无付款关闭HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md》。本A报告不授予生产、真实资金或新产品权限。
