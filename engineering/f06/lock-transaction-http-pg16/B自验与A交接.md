# F06真实Lock转Transaction｜B自验与A交接

当前状态：IN_PROGRESS，禁止标记 READY_FOR_A_REVIEW。新任务 Issue #136；只在授权分支和隔离PG16环境实施。

- 开工 main: `38faaf890bca5a2c7f133c50c9c96901fab03029`
- 工程分支: `feat/f06-real-lock-transaction-http-pg16-01`
- 白名单: `engineering/f06/lock-transaction-http-pg16/**` 与 `.github/workflows/f06-real-lock-transaction-pg16-onejob.yml`
- 旧 F06-3B 待退款安全缺口保留，不改旧服务；生产 Transaction Issuer 与真实资金/退款继续完全关闭。
- 本次预检：main 339个Workflow，逐批核对原有Push与PR精确分支/paths，新分支无旧工作流命中；首次运行最终须由新代码自动重复核验。
- 关键实现：数据库同一事务内按 Vehicle→Lock→Refund/Deposit→Transaction 顺序获取锁，签名Employee+真实权限/Scope，已签Lock和资金只读，禁止pending/refunded/未知来源退款，追加侧表与审计，最终状态复核。
- 测试计数/最终SHA/Run/Job/PG16 PID、OID、161父表Seal及恢复：**尚未执行，不得声称通过**。
- NEXT_OWNER：B（完成同SHA官方全部回归与证据后才能交A）。
