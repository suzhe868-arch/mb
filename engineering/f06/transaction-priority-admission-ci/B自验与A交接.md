# F06-5C｜B 工程隔离执行与上游阻断记录

> 状态：B_IMPLEMENTATION_IN_PROGRESS / BLOCKED_UPSTREAM
>
> 此文件是阻断与代码审计记录，**尚不是 READY_FOR_A_REVIEW**，不得当成同 SHA 官方成功验收证明。

## 1. 授权基点与边界

- A正式授权main起点：4d9dfc7aff880d4e02f8a6d4f5d9a5ed5e80d2dd。
- 唯一工作分支：feat/f06-5c-transaction-priority-admission-ci。
- 仅新增 engineering/f06/transaction-priority-admission-ci/** 与 .github/workflows/f06-5c-*.yml。
- 不改旧F05/F06父代码、公签DDL、24条迁移、真实权限或资金；不合并main。
- F05/F06、C/H01、V1仍 NOT_READY。

## 2. 上游原子来源缺口

在 engineering/f05/priority-arbitration-ttl-handover/service.mjs 中，
旧签发入口 arbitrateCI(auth,token,...) 在其内部会话事务里持有Vehicle行锁，
内部函数 reArbitrate(c,...) 不对外导出，也没有同一Client和同一事务中插入
F06-3B/5B签名交易复验的已签协议。

因此不能在5C先查交易，然后在另一个事务调用原 arbitrateCI，这会构成
TOCTOU竞态。新代码始终在真实Vehicle锁下验证事务及现有来源，
确认不满足时拒绝；即使数据看似无占用，也返回
UPSTREAM_PRIORITY_ADMISSION_ATOMIC_SOURCE_GAP，而不创造新Priority。

该拒绝机制是安全保底，不是业务正向仲裁成功。
原签发来源没有经正式工作单允许修改，因此需A决定下一独立安全父契约方案。
不能通过直接写public.f05_8_priority_ci绕过原签名与匹配权限。

## 3. 审计数量需要实际核实

旧F06-5B工作单在实际5B迁移前核对188张旧表。
5B隔离Sidecar新增attestation和guard_events两张表，因此5C前序
可能只有190张旧表，低于本单要求的至少192张。
此值只是静态计算，不是已完成的真实PG16审计。
脚本保留>=192硬门禁，需实测Catalog；若不足如实阻断，
不得增设无意义数据表凑数或擅自降低A已签门禁。

## 4. 已编写的工程范围（不表示已通过）

- 新Sidecar、父sha256签名核对、24 Ledger和公共Catalog封印；
- 原子车辆锁、交易/public与父3B双源校验、结束Priority历史、Permission与Scope；
- 严格隔离Issuer，防止实际生产Priority、Transaction、退款和支付入口；
- 36项Source和9项TLS测试定义；
- 可销毁双真实物理PG16库、OID、PID、逐表全行COUNT+MD5和父Sidecar封印脚本；
- 当前批次工作流及冻结父回归桥接。

未真实取得Github对应最后SHA的官方全部22个Push工作流与96个PG16 Job成功，
尚未取得32份有效官方sha256 Artifact和双OID一致的完整实物证据。
不能填写假Run ID、假测试通过率或READY标记。

## 5. 下一项工程门禁

只有A认可的同事务Priority正向签发来源真实可用、新旧合成正反竞态全部通过、
22项真正Push/96项真实PG16 Job、签名Artifacts、所有父级结构Seal通过，
且经B最终SHA自验后，才能签 B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW。

任何真实财务、completed/refunded、生产身份Issuer、部署/UAT或main合并，仍禁止。


## 6. 2026-10-14 B依据A补充施工单整改（等待官方CI真值）

- 按A正式勘误，将190张旧父真实全行COUNT+MD5作为精确断言，5C新增1张Sidecar仍单独签名，旧192硬门槛保留在历史记录不再执行。
- 依A裁决引入受限auth.withSession包装，先锁Vehicle、同事务核实签名来源，再调用原F05-8 arbitrateCI；绝不自行INSERT父Priority；要求回读created事件、winner和同PG PID/txid。不匹配时抛错，强制原Session回滚。
- Source增加12项真实登录、父5B原子Transaction、原3B漏洞、跨Backend争用和撤权相关测试，总48项定义；测试定义并非真实PASS。旧36项形式测试不得冒充完整36项真实业务矩阵。
- 仍须官方Push96 Job、两OID、全190旧父Seal与>=32 SHA256证据全绿，且补足真实合法Priority正向/取消后新仲裁的充分业务测试，方可修改此记录为READY。
