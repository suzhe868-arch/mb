# 名邦汽车 V1｜F07-4 PR67 第二轮 A 独立复验与补充整改施工单

> 2026-10-16｜**A_REVIEW_ROUND2_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B**。只对原授权的F07-4隔离CI包追加两个精确阻断，A01—A05已经有最新原生来源及源码支持，不得全部推倒重来。保留C-APP-01并行轨道，生产授权始终为否。

## 一、唯一审查事实与已验证成果
- 真正`main`复验起点`083e88bcab56902804a76831d08733a9f8457610`；仍为原`feat/f07-4-notification-sla-incident-gate-ci`和[PR67](https://github.com/suzhe868-arch/mb/pull/67)；本轮HEAD `4543169f1847aa5ea5ad80578294b303e9f3538d`，compare`ahead38/behind6`，**9/9文件均为原白名单新建** `engineering/f07/notification-sla-incident-gate-ci/**`与 `.github/workflows/f07-4-*.yml`；未变更父签源码/正式迁移/PDM/旧Workflow/前端，`PR=open,merged=false,mergeable=true`；A未发起合并。
- [唯一最终同HEAD真Push Run38829122302](https://github.com/suzhe868-arch/mb/actions/runs/38829122302)真实`event=push,completed/success,attempt=1`；两个独立非超级用户PG16 Jobs：Source `116743508589`的**83合成业务+10冻结F03已签父权限负证**，loopback HTTPS `116743508266`的**26真TLS+PG16**，共**119/119**独立子例，Node父Suite未计入。原生Job日志`#fail 0`、真实双Backend`78/79`、SQLSTATE`55P03`可核查。
- 最终SHA两个官方非空、未过期工件：Source `12016441901` 5355字节，`sha256:81a8058bffe8df1b892fe8a199813ea74cd725903e9512503f498e42134910a3`；HTTPS `12016661437` 1665字节，`sha256:9f15cf2e96c948a1ec17adc9a9a6b87d275513faee43590e61556e36c7682c84`。仅独立核官方metadata，**未下载ZIP复算**。
- 首轮A01—A05：A01`signedParentCalls=0`及`syntheticPgReads`区分、本地Guard不冒充父；A02 SLA未来deadline/已响应/hold有效性负证；A03恢复路径同Incident有真正CI`active→cleared`和`recovery_notified`互斥；A04脱敏`recipient_ref/route_ref`和配置版本/状态日志；A05本地CA+SAN`rejectUnauthorized:true`及错误CA/假域握手拒绝。以上已有具体代码及119场景测试；**本轮仅补发现的新问题，不撤销已经核实的工作**。

## 二、R2-A07｜P1｜Incident已cleared后仍可发送过期 active 告警

**真实代码路径：**
- `gate.mjs::seed()`创建`kind='incident_active',incident_active=true`并`activateIncident(db,incidentId)`；`clearIncident(db,incidentId)`仅把同一`f07_4_ci.incident_lifecycle.status`写成`cleared`，**不修改历史事件行**的`event.incident_active`。
- `dispatch()`中`SELECT ... incident_lifecycle ... FOR UPDATE`只针对`kind==='incident_recovery'`，`incident_active`路由仅判断事件行的旧`incident_active=true`和`cadence_minutes>0`，**从未再次查询本故障的当前生命周期**。因此`clearIncident()`成功后，只要旧事件标记未人工同步，后续一个达到cadence的新时间桶仍可以`SENT`，写`mock_outbox`及`notification_log`。
- 现有`S44`靠测试手工把`event.incident_active=false`模拟停止，**未覆盖真实`clearIncident`只改lifecycle的竞态**；新S71—S77全都验证Recovery出站，无一验证旧Active出站在真正cleared后关闭。违反`07_重建工作区/PDM-23_最终完整规则.md` §8：“真实recovery/cleared后停止重复”与正式F07-4工作单N05“Incident仍active方可重复”。

**B必须修复：**在`dispatch`的active分支，于同一个PG16事务里锁/重验**同incident_id**的`incident_lifecycle`当前状态（行锁或等价防TOCTOU方案），明确验证`ever_active=true/status=active`、需要时`activated_at<=at`及`cleared_at IS NULL`，否则FailClosed；不要依赖事件行旧布尔值，也不要把Incident/Recovery状态机复制到正式父域。与`clearIncident`和恢复通知锁顺序一致以规避死锁。只有Mock本CI临时schema允许变更，不迁移`public`。
- 必须增加有原生PG16证明的正反例：①第一次Active正常成功；②按`clearIncident`真正清除后**不改原事件布尔值**，到达下一cadence也不得投递新Active；③没有生命周期/不同incident_id但伪造`incident_active=true`不得发送；④`clearIncident`与Active dispatch两个Backend锁竞争，若清除先COMMIT则后续不得出站；⑤Recovery消息不得在`at<cleared_at`的事件时间伪造“提前恢复”，防倒序/回放；⑥原S12与S71—S83持续通过，DND/路由/失败重试语义不退化。
- 若CI时钟是显式可控合成时间，明确区分投递处理时钟、事件发生时钟和`activated_at/cleared_at`，不能用一次测试模拟值掩盖已cleared的当前事实。生命周期真正来源依然`INCIDENT_SIGNED_ISSUER_SOURCE_GAP/CI_SYNTHETIC_ONLY`。

## 三、R2-A08｜P2｜最终HEAD遗留旧F05 CI全部queued，未具备终态
- A于本轮真实读取`commits/4543169.../check-runs?per_page=100`：30个check **2 success / 28 queued / 0 failure**，后28个均属10条旧F05 `pull_request`工作流；`fetch_commit_workflow_runs`也真实显示10条`queued`。**没有任何最终失败Job可供该HEAD分类**，所以B目前无法声称旧F05全绿、全部失败已消除或A06已关闭；不能把前一HEAD旧红灯套用当前HEAD，也不能擅自解除必需Check。
- B完成A07后推最终唯一HEAD真正Push，记录最新30项Check、10条旧F05 Workflow实际结论及队列（包含检查时间、Job IDs）；能取得失败Job日志则独立逐Job分类并修本包真正问题。若仍queued，明确写`A08_EXTERNAL_CHECK_PENDING`，**不要等待、不要造绿、不要自行豁免**；由A在末次复审时决定是否仍阻断，必要时核GitHub required checks/branch rules。A的既有PR64/65/66范围限定CI裁决不自动适用PR67。
- 必须保留冻结旧Workflow，不重写旧F05历史测试或降低权限门禁，不修改本PR以外路径。

## 四、复测与交付
1. **继续原B分支、原PR67**；允许新增/修改仅上面两个F07-4白名单。B只修R2-A07及补齐R2-A08末SHA客观状态，保留首轮A01—A05代码和测试。
2. 最后唯一HEAD不得少于已完成的**83 Source+10真F03父负证+26 HTTPS**，新增原生边界和并发反例须有真实`# fail 0`、非超级用户PG16、最少两真正同SHA Push Jobs completed/success、两同SHA官方非空SHA256 Artifact及中文分级证据。同步两个TSV来源矩阵和`B自验与A交接.md`，按实际案例数量，不把Node父Suite混计。
3. 交A时在PR附完整中文交接：最终SHA、路径清单、R2-A07各用例及TOCTOU锁、旧F05 latest动态Checks、双PG16原生Job及真实Artifacts、父签`SOURCE_GAP`、当前未完项，签`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。B不得合并；A独立再核代码/日志/分支保护，合格才正常PR merge并同步5份状态文件。
4. **并行C-APP-01 PR68不变**；仍只MockFeishu、不接真实飞书、JYT/Collector、第三方凭据/客户/资金、正式迁移、H03正式API联调、UAT/生产。F05/F06/F07全域、V1仍`NOT_READY`。

**裁决：`F07_4_PR67_A_R2_CHANGES_REQUESTED_NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F07_4_PR67_R2_A07_A08_INCIDENT_CLEARED_GUARD_AND_CI_RECHECK`。**
