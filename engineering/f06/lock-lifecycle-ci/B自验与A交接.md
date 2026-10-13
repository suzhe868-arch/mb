# F06-2｜B工程执行自验与A交接（CI-only）

> 状态：**F06_2_B_TRUE_PG16_ALL_GATE_PASSED_ON_EVIDENCE_BASELINE_SHA / FINAL_HANDOFF_SHA_REVALIDATION_PENDING / NEXT_OWNER=B**。A正式交接以本证据归档提交后PR #53最后HEAD所有原生Push再次全绿为准，B不合并main。

- A正式工单：`07_重建工作区/F06-2_A主控正式Lock延期到期与人工释放资金只读保护_CI隔离完整施工单_2026-10-13.md`。
- 来源：A签字合并F06-1 PR52，保持F03/F05/M94-v26、D1、旧F06-1签名不变，仅新增`engineering/f06/lock-lifecycle-ci/**`和`.github/workflows/f06-2-*.yml`。
- 用`f06_2_ci`模拟可信财务Issuer缺口，**只有隔离合成明确断言无Deposit且物理只读确认无Deposit/Transaction**才允许普通Lock延期/释放/到期。未知、有资金均拒绝；真实资金Issuer始终SOURCE_GAP。
- 保留Lock初始72h价格与原responsible历史；同Lock更新当前期限，追加不可变事件与系统审计，幂等键绑定相同Lock/Actor/Action；权限与DataScope/当前停用/车辆周期重新判断；时间来自真PostgreSQL。
- 测试门禁：新Source至少30，HTTPS 9，新本域2个PG16 Job；全批13条同最终SHA Push、78/78独立非特权PG16 Job(H52 52)、≥14份有效SHA256 Artifact；双不同OID业务库销毁与151 public+D1表及旧F06-1侧表完整count/MD5 Seal。
- 真实线上Employee/Customer/微信、Deposit/Refund/Transaction写入、定时器/部署/UAT及F06-3均**未授权**。F05_GLOBAL/F06_GLOBAL/C_H01/V1均NOT_READY。


## B增量整改与新增真PG16安全覆盖（待最终CI核验）

- 本批补充的合成隔离工程错误修复仅在本批新增文件内：\`runner.mjs\` 注错异常名与实际 migration 抛出严格一致；\`audit-seal.mjs\` 精确校验 F06-2 真实 GitHub Push 分支且证据输出在本批独立目录；\`disposable-db.sh\` 快照/物理DROP/RESTORE分支门禁从误写修正为正式 \`feat/f06-2-lock-lifecycle-ci\`。
- 本批新增 Source 由24项扩为 **30项**。新增双真PG16 Backend(第二连接 COMMIT 撤权、同Lock行锁竞争与无半提交)、真签Transaction阻断资金未知普通取消、普通Lock不隐藏他客、本人与负责销售签名的v23→v24 Priority-origin Lock排他与Release后原Priority不可复活、Customer disabled情形真实PG时钟到期正反例。旧24项原封保留。
- HTTPS 9项仍独立在真TLS回环 + 非特权PG16运行；不开放Customer/Employee/Deposit/Refund/Transaction实际生产issuer。
- **不得把上轮旧SHA绿灯算作最终证据。** 最终须核对当前PR #53唯一末次HEAD的13条GitHub原生Push、真正78/78非特权PG16 Job（H52 52/52）、新Source30/30、HTTPS9/9、≥14个非空未过期官方SHA256 Artifact、物理不同OID双库及旧151张public+D1 + F06-1侧表全行count/MD5与Ledger/D1/Catalog完整Seal。结论只有达标后才可改为\`F06_2_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A\`。

待同最后SHA全量GitHub原生验证成功后，再签`F06_2_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`。

## 2026-10-13 B完整真PG16先验结果｜证据封印基线SHA `3482e81770acdeb53572256d859abbdf845ebed7`

本 SHA 已在 GitHub Actions **13/13条event=push工作流completed/success**，按官方jobs?per_page=100完整枚举 **78/78非特权PG16 Job成功**（冻结H52工作流`38422741667`真正52/52）；原生Source **30/30**，HTTPS **9/9**，旧F06-1 Source **48/48**、HTTPS **9/9**全部真实日志`# fail 0`。至少14官方Artifact要求超过：**123/123非空、未过期、具官方sha256摘要，全部属于本SHA**。F05-5官方run attempt=2成功，其余工作流含H52均completed/success。

**13个真实Workflow Run ID（本次证据基线）：**
`38422741667`（H52），`38422741659`（F05-9），`38422741848`（F05-5），`38422741857`（F05-8），`38422741913`（综合），`38422741732`（F05-6），`38422741658`（K2），`38422741682`（F06-1），`38422741705`（F05-4），`38422741623`（J2），`38422741657`（F05-10），`38422741674`（F06-2），`38422741655`（I2）。

**新本域官方Job ID**：Source `115384058977`，HTTPS `115384059738`；冻结F06-1 Source `115384059480`，HTTPS `115384059009`。全部**78个Job ID及123份Artifact的官方ID、非空字节数、expiry、GitHub sha256摘要、绑定HEAD SHA和所属Run ID**见本分支新增完整机器可核证据：`engineering/f06/lock-lifecycle-ci/evidence/official-ci-evidence.json`，不以手写“已通过”代替原生列表。

业务注错PG事务ROLLBACK后F06-1独立双库旧151张`public+D1`实体表原封重建，且本批追加F06-1旧侧表完整Seal后，**157张表完整数据COUNT+MD5**、旧24行Ledger、D1、Catalog及F06-1 attestation SHA全部一致：业务场景物理数据库OID `26507` 完整DROP；新独立审计库OID `30632`，backend PID `505`→`585`。本批最终seal日志`F06_2_DISPOSABLE_SCENARIO_AND_SIGNED_AUDIT_GLOBAL_SEAL_PASS`；前置冻结F06-1 `F06_1_DISPOSABLE_SCENARIO_AND_SIGNED_AUDIT_GLOBAL_SEAL_PASS`。

实测安全合同：资金Issuer未知/真实Deposit/真实Transaction普通延期、release/cancel、系统timeout全部 fail closed；签名Employee当前Permission+Capability+Team/Store Scope二次PG COMMIT撤权拒绝旧Session；普通可见Lock不连带隐藏合法其他Customer；Priority-origin Lock排他到正确release且历史Priority永不复活；系统到期取真实PG时间且Customer disable不删除历史；Waitlist排位不自动升级；不可变审计及注错回滚验证成功。真实Issuer/资金写入/生产定时器/微信与PC路由、部署和UAT仍`SOURCE_GAP / BLOCKED / NOT_READY`。

**严禁提前签章规则**：本记录是已通过的证据基线HEAD，归档提交会产生新HEAD。必须再次核验**新的最后HEAD**独立完成同样13/13、78/78、Source30/30、HTTPS9/9、官方Artifact和跨OID Seal，才可以在PR #53 Conversation正式签 `F06_2_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`。不得将旧HEAD证据偷当新HEAD。