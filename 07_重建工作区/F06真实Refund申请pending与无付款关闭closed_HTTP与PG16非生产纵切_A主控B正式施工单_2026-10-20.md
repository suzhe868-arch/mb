# 名邦汽车 V1｜F06真实Refund申请pending与无实际退款关闭closed HTTP + PG16非生产纵切｜A主控B正式施工单

- 任务：`F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01`
- 正式放行：`A_RELEASED_FOR_B_NONPRODUCTION_REFUND_PENDING_CLOSED_HTTP_PG16`
- Issue：[ #140 ](https://github.com/suzhe868-arch/mb/issues/140)
- 下一责任窗口：**B**，A独立验收、创建正式PR与标准合并
- 指定B工作分支：`feat/f06-real-refund-pending-closed-http-pg16-01`，**只允许从B开工时真正最新main创建**，不能固定历史SHA
- 当前可信父链：F06真实LockRequest/审批候补PR129；普通Lock生命周期PR131；真实合成Deposit HTTP/PG16 PR135；原子合成Lock→Transaction及可信退款前置PR139。受验PR139 B HEAD `20bb5333b3fb2b64fe9fde8f1e8ac6ba65ff182b`，官方Run `39395616127`/Job`118537844979`同SHA **319/319**，PR139 merge `7ebd75337d2bbf1bd37bd697fc58cb0c19888774`（仅用于追溯）
- 产品/工程生产状态：`NOT_READY`。**只允许真隔离PG16中的合成退款申请/无付款关闭，禁止退款到账、真实资金、生产Issuer、线上DDL、部署**。新增付费预算$0。

## 1. 唯一Authority和本批分界

1. PDM-19 Final §§2～5、19～26、29～31，尤其`Lock XOR Transaction`退款主体、已签Deposit/Correction余额、Refund `pending/refunded/closed`中`pending`未实际退、`closed`决定不退+必须close_reason、`refunded`是真实资金动作而本包**完全禁止**，不新增`partial`主状态、不新增close专用permission/审批。PDM-18 Final现时Lock/失效/候补/历史、PDM-02/03 Final现时签名Employee/权限Scope与客户负责人、PDM-17 Final公海保护、PDM-25 Final审计为上位规则；不得编造政策。
2. 本包只执行**合成Lock侧 Refund**新真实HTTP/PG16路径：（a）当前合法signed Lock含真实源签合成Deposit且有正数可退净余额、**未建立owning Transaction**时，真正当前合法负责人可在独立退款权限/Scope内发起`pending`申请；（b）现时合法处理员工可关闭合法`pending`为`closed`并必填reason，**不实际退款**。原F06-3C1退款父服务/Sidecar只读复用且原生验签，业务可在新版本化受限适配器中实现，不得通过未签实体绕开锁序/退款余额。不得恢复旧`refunded`生产Issuer。
3. Transaction侧Refund只能依据真实已签`cancelled`或`completed`来源和可退余额执行；现有真实新纵切尚无这些实际生产态签发，因此本包**不开放Transaction侧Refund申请**，对`in_progress`与非法/未签completed/cancelled硬拒；新建`pending`后亦不能自动影响交易的真实资金历史。若用户业务规则涉及更多裁决，B返回A而不扩大scope。

## 2. 业务/权限/安全必须亲自证明的正反条件

- **可信父来源**：对每次退款mutation核验冻结原生F06-3B/3C1父sidecar签名、24条迁移/公签Catalog、真实当前F06-3A Deposit原件与不可变Correction/Reversal、Lock/Customer/vehicle/listing_cycle/原owner及退款subject；0公共退款行而原签3C1 Carrier缺席也必须失败。来源漂移、旧退款支付事实或资金Issuer无法核实，均`SOURCE_GAP`Fail Closed。
- **权限**：真正现时F03签名Employee session + permission`refund.ci.request`及capability+Team/Store/Object Scope+业务object归属重验；销售/经理/店长的职位本身不给免费操作权；ControlPlane SystemAdmin、4S、非负责员工、跨团队/门店、停用账户/客户、撤权旧Token、失效capability拒绝。close使用当前合法权限，不增加新close permission。
- **申请pending**：金额CNY正整数（最小单位分）且小于等于有效可退余额；幂等键绑定actor、action、subject、amount、reason，正常重放返回同条真实pending，异Lock/金额/原因拒绝；现时同scope不允许冲突pending；余额=真实签名合成Deposit与其纠错净额扣除其他受信资金/退款事实，在不可核实时拒绝。真正数据库事务按Vehicle→Lock→Deposit/Refund签名行→新pending/请求Key/Audit锁序写入；跨车辆/周期不相互污染。
- **无付款closed**：只允许`pending→closed`，提交时重验负责员工权限/Scope、原签Refund来源及现时资金/无付款，无付款时必须有close_reason；原pending事件、原金额、actor/time保留并追加合法close事件与审计；closed不可复活成pending，不增加`refund_payments`，不将closed计入退款到账。若后续合法要重启退款必须新建符合当前签名来源的新申请。
- **占用和公海**：pending是Customer未完资金责任，不能当成无业务客户回公海；它**不占Vehicle**。合法closed只停止该条pending本身的公海保护，不得自动解锁其他Deposit/Lock/Transaction/Priority等现时职责。不能取消或改写旧Transaction、Priority、Waitlist、Recommendation、Consultation、Demand。
- **与PR139交互和竞态**：合法pending先commit后新Transaction必须拒绝且0半写；新Transaction先commit后旧Lock Refund申请拒绝且0pending；两个独立真PG16 backend/进程同时发起，最少能证明签名Session与Vehicle/Lock锁序下至多一个有资格提交。记录两侧backend PID和调度时序，**如签名Session层已完成互斥不得夸称两边同时拿Vehicle锁**，如从产品权限能合法生成多主体竞争须额外明确执行；包含多个并发pending争用/超额退款、注错Rollback与SQLSTATE的真实负例。
- **生产与隐私**：仅在`127.0.0.1`开`/__ci__/f06-real-refund/**`隔离HTTP，生产`/api/v1/refunds`、`/api/v1/refund_payments`及真实退款确认/交易完成/真实收款、支付银行微信、真实用户/客户身份端点全部404/严格拒绝；TLS安全拒绝覆盖Token、角色、scope伪造及VIN/手机号/金额细节不泄漏。禁止向外部系统写款、日志真实个人数据。

## 3. 唯一代码路径与环境成本门禁

1. B只可在工作分支内**新增**：
   - `engineering/f06/refund-pending-closed-http-pg16/**`
   - `.github/workflows/f06-real-refund-pending-closed-pg16-onejob.yml`
2. 不可更改任何既有`engineering/src/**`、`engineering/scripts/**`、`engineering/sql/**`、`engineering/integration/**`、父F06/旧workflow、公共M94→v26正式DDL/24条签名Ledger、PDM/IA/Low-Fi Final、C端/PC端正式路由；严禁真实Production Issuer/真正付款/退款与角色新增永久权限。不允许删父测试或把旧不安全F06-3B直接入口声称修好。
3. CI只有**标准免费ubuntu-24.04单Runner、单`postgres:16-alpine`服务、单Job**，GH `contents:read`，精准本新分支Push和以上两路径；排查工作流触发时必须对执行时全部实际旧workflow做`push_matches=1`、`pr_matches=0`，不能回退触发过滤制造批量队列。禁止matrix/Artifact上传/付费缓存/付费Runner，新增预算$0；所有临时数据必须只在Runner/test专用非超管f03_ci PG16库。
4. 每个入口强核验真实`GITHUB_REPOSITORY=suzhe868-arch/mb`、`GITHUB_REF`、`GITHUB_SHA`等于真实checkout、`GITHUB_RUN_ID`、`GITHUB_EVENT_NAME=push`、`GITHUB_ACTIONS=true`、`CI=true APP_ENV=test NODE_ENV=test`、127.0.0.1数据库及双独立环境隔离许可；不具备证据立即hard fail。旧F06-3C1父源码有历史ref守卫，允许本包先验证所有真实事件/SHA/Run/DB授权，仅对子进程/隔离范围短暂提供兼容Ref，不能改官方变量或父服务字节。拒绝伪造父Refund源/付款事件或通过双独立PG事务模拟原子保护。

## 4. 完整同SHA真PG16/HTTP/TLS验收门槛

1. **在本包最终HEAD同一官方Push Run/单Job**完整运行上批PR139的父319/319：LockRequest Node54、Lock生命周期Node37、原LockRequest PG16/HTTP21、生命周期PG16/HTTP36、F05来源事件25、F06-3A Source28/HTTPS9、Deposit HTTP/PG16 38/TLS9、Transaction HTTP/PG16 53/TLS9。不得拼不同SHA/历史旧Run；父测试要按其原本门禁真实跑完，0失败/跳过/取消。
2. 本包新增**真实Refund Lock-side HTTP/PG16至少32项**，覆盖签名pending/closed、退款金额余额、幂等、签名来源缺席、无真钱、不允许`refunded`、权限Scope/Customer、public历史不可变、与Transaction双先后+双Backend/事务真实Rollback、Customer公海、Vehicle不占用，以及CNY/时间/上架周期/非法主体；新增**TLS回环生产与真钱拒绝至少9项**。正式验收总数≥**360**（319+32+9），全部0失败、0跳过、0取消。
3. 由本Run中原生F06-3A Source生成并验签的四Schema **161张完整父实体Manifest**（Schema名、全表集合、逐表COUNT/MD5、Digest）作为冻结基础，不减少真父表；扩展后的退款Sidecar数不允许硬套161假称所有表。验证24迁移/Public Catalog/D1/F06-1/F06-2父attestations、原F06-3B/3C1真正Source checksum、真实两物理不同OID恢复与backend PID，实验库必须真正DROP，独立审计副本保持，恢复前后逐表Seal一致且不覆盖历史父文件。
4. 真实PG16异常路径记录两个独立backend PID、测试失败点、0半成品Lock/Transaction/Deposit/Refund/Key/Audit；SQL故障注入不仅捕获错误码，还核对业务事实/Sidecar历史。禁止外部网络实际支付/退款或生成真实收款证明。
5. 新目录`B自验与A交接.md`必须在最终提交中完整记录同SHA官方Run/Job、测试计数、父原生Seal签名与OID/PID、所有可信退款/权限/竞态及源头不可用负例、代码路径白名单、实际生产功能缺口并标`F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01_B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。B不建PR、不合并main，A独立检验后才决定PR/标准merge。

## 5. 授权出口及禁止越界

本任务**不授权**真实退款确认、`refunded`、`refund_payments`、真实收款或退款/支付平台、成交完成/correction、换车、Transaction侧实际退款、生产DDL/Issuer、第三方写入、真实Customer/Employee业务资料、UAT/部署或开通线上Refund接口；F06/F07/F08和V1整体`NOT_READY`。A不因本包真实PG16合成成功而宣布真实资金合法上线。下一责任B按本单在已授权范围内连续完成到`READY_FOR_A_REVIEW`，用户无须逐项确认。
