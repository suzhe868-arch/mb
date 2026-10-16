# 名邦汽车 V1｜A 主控 F07-4 PR67 首轮独立验收不通过：完整定向整改施工单

> 日期：2026-10-16｜裁决：**`F07-4-PR67-A-REVIEW-01 = A_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B`**。本单为已签发F07-4原包内部安全合规整改，不是新F07-5或F08授权；不得把绿色CI当作父权限业务正向签名。

## 一、审查对象、实际证据与范围
- 最新审查基线：main **`1350024a0f45e71c45bb6d4512ff6b2251e3dcef`**；原B分支 `feat/f07-4-notification-sla-incident-gate-ci`，**PR [#67](https://github.com/suzhe868-arch/mb/pull/67)**，B末HEAD **`984f49ca6c2d6e535efc47867bc2057ac4639fc7`**，GitHub compare`ahead28/behind0`且9/9文件`added`、均为原授权两白名单。PR open/merged=false，A未合并。
- A独立读当前main六份项目规范、F07-4正式完整施工单、PDM-23/25与PR代码/测试/工作流、原生官方Job日志。唯一同SHA真实Push [Run38822445991](https://github.com/suzhe868-arch/mb/actions/runs/38822445991) `completed/success`，两个真PG16非超级用户独立Job `116721960097`（63 Source合成业务+10签名F03父Session拒绝，共73）和`116721960429`（20回环TLS）皆成功，**93/93子例全过（Node父suite不重计）**。原生行锁`55P03`、双Backend PID`78/79`有真日志。
- 官方未过期同SHA工件：Source `12013263644` 4521字节 `sha256:e61ac5f1852bff479119be5b75182fb3e3cd0adeacaa8e0e010730d6ac1639cb`、HTTPS `12013829112` 1359字节 `sha256:d534e34b98b23468ed19130d30e694aefeaa04fe6bbf1610eee877158baf2b53`。仅官方metadata摘要，**没有独立下载ZIP复算**。
- **红灯现状不能抹去**：同HEAD GitHub 30个Check A再次读取快照`9 success/11 failure/3 in_progress/7 queued`（动态变化，须B最终再查）；来自旧F05的多个PR工作流，已知含公共容器镜像限流、旧F05分支专属新Push、API 403等。A本轮**不出旧CI适用性豁免、不声明所有Check绿**，先修下述源合同缺证，最终由A再完整独立分类。特别注意其它PR62/64/65/66限定CI裁决不能跨PR移植。
- 所有改动只可继续在原分支/原PR #67、原两白名单 `engineering/f07/notification-sla-incident-gate-ci/**`、`.github/workflows/f07-4-*.yml`；绝不修改`main`、PDM Final、旧F03/F05父代码、旧Workflows、正式DDL、生产或C手机端并行分支。

## 二、A独立代码审查发现的六个闭环事项

### A01｜P1｜HTTPS父调用统计误报
`server.mjs`的 `GET /__ci__/f07-4/link` 分支**直接**令`parentCalls=1`，随后仅调用同步本地`deepLinkGuard(...)`，从未调用`readCurrentFacts`或任何真实冻结F03父读取器。当前H15仅断言`parentCalls===1`，把“合成逻辑执行”错报为“真实父授权调用次数”；与原工作单N06“测试闭包可验证真正父调用次数”不符。
- 整改：统计只能由实际被调用的真实父读取器入口/trace事件递增，不可静态赋值。无法合法对接F03当前Session/Scope/Object时必须明确`parentCalls=0`并输出`LINK_CURRENT_SESSION_SCOPE_OBJECT_SOURCE_GAP`，保持deep-link外部403/最小DENIED。若接已签F03读取器，只断言**确实收到父拒绝码**，不得编造正例。区分`syntheticPgReads`和`signedParentCalls`，两者不可混算。
- 补至少三例HTTPS：拒绝型链接不虚增真实父调用、撤权后仍拒、传合成`signedParentVerified=true`仍不得签allow，且审计不泄token。

### A02｜P1｜SLA超时只检查deadline是否存在，尚未证明已到期
`gate.mjs dispatch`在`consultation_sla_timeout`时仅判断`!event.deadline`，没有判断当前有效`at`是否达到该deadline，既没有以PDM15已成立的首次人工响应/hold等事实拒绝错误“超时”。用合成事件只写一个**未来**deadline也可返回`SENT`写入MockOutbox；`S60`只验证`deadline=null`。
- 整改：在CI的合成PDM15只读事实模型明确区分`deadline not reached`、`first response already completed`、`hold/validity not established`、`SLA_EVENT_SOURCE_GAP`与真实已成立timeout。不得在F07-4里另造/重算PDM15的SLA业务时钟、15分钟默认值或覆盖配置；如合法父签timeout不能取得，只能证明合成层不得在未来deadline放行，并如实标`CI_SYNTHETIC_ONLY/SOURCE_GAP`，不能宣称SIGNED父正向SLA事件已接通。
- 至少补未来deadline拒绝、恰到deadline与时间边界、已响应/事件失效/hold状态不误投、保持SLA原父不可变COUNT/MD5。

### A03｜P1｜Incident Recovery缺少从active到cleared的事实转移证据
`gate.mjs`仅在`kind=incident_recovery`且`incident_active=false`时允许Mock群消息；`source.test.mjs`白名单循环里的`S12`就以**从未建立过active故障**的合成recovery事件获得SENT。只看恢复事件“当前不是active”不等于曾有真实故障及恢复变迁，违反原施工单N05“Recovery通知以真状态变化证据为准”。
- 整改：利用**仅CI临时schema**原生记录持续Incident身份及前态active→后态cleared（或有签发事件的只读来源证明）；重复active只能同一故障，recovery必须匹配同故障/合法转移、不得任意新ID假恢复。补无前态recovery拒绝、一次真实合成转移只发一次、cleared停止cadence、跨Incident串线/恢复重放拒绝、DND期间变更后二次有效性判定。缺正式外部Incident Issuer时仍记`SOURCE_GAP`。

### A04｜P1｜Notification Log缺接收人/路由维度的审计
`gate.mjs` `f07_4_ci.notification_log`列当前为`event_id,kind,stage,employee_id,channel,scheduled_at,result,code,dnd,revalidated,sent_at,backend_pid`，**没有合法投递`recipient`与`route`事实字段**；尤其群路由当前仅在MockOutbox，FAILED/SKIPPED/DEDUPED日志不具当次接收对象/路由状态的可追索证据。PDM23 §14及原施工单N06明确要求recipient/route/channel。
- 整改：仅CI schema增加安全脱敏`recipient_ref/route_ref`、必要配置`version`和重判依据，按发送时当前路由/群/负责人，准确区分失败/跳过/去重/失效，禁止完整个人Feishu token、手机号、VIN、敏感客户/群原始密钥外泄；无映射要保留`ROUTE_SOURCE_GAP`原因而不是伪造路由。补群与个人、owner变更、开关关闭、DND、FAILED/DEDUPED、Incident重发/恢复的对应Log与Outbox一致性断言，不能只验列存在。

### A05｜P2｜HTTPS测试主动关闭TLS证书验证
`tests/https.test.mjs` 用 `rejectUnauthorized:false`，所以20个HTTPS测试虽然建立加密连接，但**没有验证本机自签名证书的服务端身份**。原Workflow已在TLS Job生成带127.0.0.1 SAN的一次性证书。
- 整改：用`ca=readFileSync(F07_4_TLS_CERT)`并启用默认/显式`rejectUnauthorized:true`的真实证书链与127.0.0.1 SAN校验；加错误CA/伪主机证书连接失败的反例，保留原20项真实业务黑箱与内审计，不能用关闭校验来让HTTPS green。仍仅127.0.0.1，不允许实际出站。

### A06｜P2｜末SHA旧F05 Check异步红灯及证据必须重新核定
最终全部A01—A05修复后，B重推唯一最后HEAD并实际读取`commits/<HEAD>/check-runs`和所有相关失败Job日志，逐条分`旧F05分支独占Push证明/Docker限流/API403/真实功能测试失败/未完成`；不能假设本次与PR66十条旧红灯相同，不能删旧workflow、伪造绿灯、擅自豁免或绕过GitHubrequired checks。若存在真实业务/基础门禁不可归类失败，明确`BLOCKED`并交A裁决。

## 三、原包B复测与最终交接门槛
1. B在**原分支、原PR67**直接连续修正上述A01—A06；不另建F07-5/F08、不触生产JYT、正式飞书、真实客户、资金、真实通知/微信推送、第三方凭据/外网、正式迁移或C前端。主线2026-10-15 C-APP-01并行职责保持独立，不能改C-PR68。
2. 重新跑旧全部63 Source＋10真签F03父拒绝＋20 HTTPS，新增反例不能减少旧覆盖；原生两独立PG16真Push Job `completed/success`，有真竞争`55P03`/事务回滚/未更改旧签父事实、PG16非超级用户/数据库+来源trace，至少**2份最后同HEAD官方非空未过期SHA256工件**（明确未独立ZIP重算或确有重算）。
3. 同时修`PDM23事件与渠道权限矩阵.tsv`、`通知投递场景矩阵.tsv`、中文`B自验与A交接.md`；案例逐行注明`CI_SYNTHETIC_ONLY`、`SIGNED_PARENT_NEGATIVE_ONLY`、`SOURCE_GAP`、`PRE_PARENT_VALIDATION`等真实级别，严禁把本地PG读取写为父能力positive。F05/F06/F07/V1整体继续`NOT_READY/NO_PRODUCTION`。
4. PR末尾完整中文正式交接包括原main审查点、**最新实际HEAD**、compare的全路径清单、6项修复定位和正反例、两个独立最后同SHA Job与真实日志、两Artifact id/digest及到期、旧所有Check真实分类、未获业务Issuer/Scope/实际Feishu事实，B只能签`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`交独立A复审，**不得自行合main**。
5. A只在所有本包真实门禁通过后，重新独立评估其时主线、正式PR与各类旧Check，必要时仅对本PR签限定适用性裁决后经**标准GitHub PR**合并；首次验收本轮为`A_CHANGES_REQUESTED / NO_MERGE`。

**正式状态：`F07_4_PR67_A_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F07_4_PR67_A01_A06_REMEDIATION_AND_NATIVE_RETEST`。**
