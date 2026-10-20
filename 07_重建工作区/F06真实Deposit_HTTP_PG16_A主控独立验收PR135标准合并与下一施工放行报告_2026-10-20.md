# 名邦汽车 V1｜F06真实Deposit HTTP/PG16：A主控独立验收、PR #135标准合并与下一施工单放行

**日期：** 2026-10-20；**正式状态：** `A_ACCEPTED_F06_REAL_DEPOSIT_LEDGER_HTTP_PG16_01 / PR135_STANDARD_MERGED / NEXT_OWNER=B`。  
**生产：** `formal_source_signed=false / production_ready=false / V1_NOT_READY`。

## 一、仓库与受验精确范围

- 主仓：`suzhe868-arch/mb`；A复验前 `main@25b1ef1e423e702773d835bb1aaba51a72d22d79`（此前A Seal裁决 PR #134），B分支 `feat/f06-real-deposit-ledger-http-pg16-01`。
- 受验B最终HEAD：`8598df31d71ed3d9e2e13dcdc962002b152f152a`；与main ahead15/behind0，共11个**新增**文件。真实 GitHub compare 的11份文件全部为 `engineering/f06/deposit-ledger-http-pg16/**` + `.github/workflows/f06-real-deposit-ledger-pg16-onejob.yml`；**未变更**既有公共DDL/M94、24迁移/签名Catalog、旧F06服务和旧workflow、`engineering/src/**`、`engineering/scripts/**`、`engineering/sql/**`、`engineering/integration/**`、PDM Final或正式业务路由。
- 误建旧Draft PR #133此前已关闭未合并；本次PR #135由A创建，HEAD为上述最终SHA，base为上述main；创建后验证mergeable与同SHA成功Check，无新不相干PR工作流触发。
- 正式标准合并：[PR #135](https://github.com/suzhe868-arch/mb/pull/135)，A调用GitHub标准`merge`并检查`expected_head_sha`，实际merge SHA **`ffcf9d8609fc9972a0a8780012ddbc52f85cc221`**，GitHub返回`merged=true`。

## 二、A独立读取官方最终同SHA原生日志

- [官方Push Run #39379307863](https://github.com/suzhe868-arch/mb/actions/runs/39379307863)，[Job #118484492475](https://github.com/suzhe868-arch/mb/actions/runs/39379307863/job/118484492475)：`completed/success`；真实源码HEAD、日志中的`head=8598df31...`、runId `39379307863` 一致。
- Node LockRequest：**54/54**；Lock生命周期Node：**37/37**；LockRequest原生PG16/HTTP：**21/21**；Lock生命周期PG16/HTTP：**36/36**；F05事件/来源：**25/25**；F06-3A Source：**28/28**、原F06-3A HTTPS：**9/9**；新Deposit真实HTTP/PG16：**38/38**；新TLS拒绝：**9/9**。以上九组**257/257**，均0失败、0跳过、0取消；父来源其他真实测试在单Job内也执行但不虚加进257。
- 旧F06 Priority真实签发兼容验证：`F06_REAL_DEPOSIT_PRIORITY_COMPAT_BRIDGE_VERIFIED`、`..._COMPLETE`、`F06_AUTHENTIC_F05_V26_PRIORITY_BASE_READY`、`F06_AUTHENTIC_PRIORITY_SOURCE_COPY_PASS count=4`；原LockRequest21项恢复全通过。新compat桥只对既有签发子进程单独提供历史Ref，真实分支/Push/SHA/Run保持不变；未修改旧F05-8签发源码或伪造原签名Priority。
- 新增`disposable-db.sh`修正`mode="${1:-}"`，`bash -n`与无效mode退出码64负例日志 `F06_REAL_DEPOSIT_DISPOSABLE_MODE_NEGATIVE_PASS`，prepare/restore-source均真实运行成功。
- 工作流：精确单分支push+paths、1个标准Ubuntu Job和PG16服务，权限`contents:read`、无Artifact上传、无生产Secrets与付费资源。Run日志结尾有`READY_FOR_A_REVIEW branch=feat/f06-real-deposit-ledger-http-pg16-01 head=8598df31... run_id=39379307863`。

## 三、完整性与业务安全独立审查

1. 原F06-2签父阶段 `F06_2_DISPOSABLE_SCENARIO_AND_SIGNED_AUDIT_GLOBAL_SEAL_PASS` 输出158张；随后已验F06-3A四Schema完整物理父层 `F06_3A_DISPOSABLE_SCENARIO_AND_SIGNED_AUDIT_GLOBAL_SEAL_PASS` 为**161张**，原生父Manifest digest `ad8445f87a6eebe4277ce17c13cdbff559fc659995e1c70e98d07519f15c8664`。
2. 本包新的独立seal读取与同Run/同SHA原F06-3A `audit-before.json` 和 PASS回执绑定，并枚举四Schema全体物理表名，对**161表逐表COUNT/MD5**及整体名集合做独立深比较。前 `F06_REAL_DEPOSIT_PARENT_SEAL_BEFORE_PASS` 与后 `...AFTER_PASS` 均输出24条迁移、完整行摘要 `ce6f2d0caca02b6e348bcd373ccce92e33e8eb2436d7f0341bc813c27d68f30a` 相同。
3. 实际source数据库 OID **35222**，初始审计副本 **39338**，恢复后source OID **43578**、审计副本OID仍**39338**；不同PID原始605/606，恢复后645/646。原生父Public Catalog SHA `5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4`、D1与F06-1/F06-2 attestation及24条签名迁移没有被改写。新侧场景中真实合成事实/更正写入后，审计副本继续保持原行Seal，来源恢复后复得相同Seal。
4. A审查新`server.mjs`、继承的`deposit-ledger-ci/service.mjs`和38项真实HTTP/PG16测试：当前员工签名Session、角色/许可覆盖/capability与Team/Store/Object Scope、Customer/Lock/Cycle，合成CNY正额、多笔Deposit/幂等、独立经理/店长Correction权限、超额纠错/负额/并发、SQL注错Rollback/追加不可变、撤权旧Token、跨Lock/Cycle、Lock资金事实到期保护、未知Issuer拒绝/净额零不自动释放都在本Job真库执行。TLS 9项拒绝生产路由与错误敏感信息；生产app未注册CI路由。
5. **限制必须保留**：PR #135只提供可销毁PG16+localhost的非生产合成Deposit纵切；未证明正式真实资金Source、收款/退款/银行微信、生产Transaction/Refund、用户验收或生产部署。旧F06-3B Lock pending Refund→Transaction不安全直接入口仍保留已知缺口；PR #135不替其修复或解除门禁。

## 四、独立结论与下一步

**A验收结论：`A_ACCEPTED_NONPRODUCTION_HTTP_PG16 / PR135_MERGED`。** 上轮190/161父表计数与Priority前置两项已按PR #134裁决真复验；不为旧失败Run重新标绿，不把本次非生产验收写成V1生产完成。

**下个完整任务：** `F06_REAL_LOCK_TO_TRANSACTION_HTTP_PG16_01`；下一责任 **B**；[Issue #136](https://github.com/suzhe868-arch/mb/issues/136)；指定 `feat/f06-real-lock-transaction-http-pg16-01` 从执行时最新main新建。A正式施工单：`07_重建工作区/F06真实Lock转换Transaction原子占用HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md`。

F06/F07/F08全域、正式Source签署和V1整体仍`NOT_READY`，新增付费预算$0。C PR #68独立Draft，未经用户视觉确认不合并。本轮主控全部范围已完成，交B施工，B完成同SHA自验后再交A。
