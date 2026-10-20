# 名邦汽车 V1｜F06已签负责人移交后Transaction正常取消 HTTP与PG16非生产纵切｜A主控B正式施工单｜2026-10-21

> A正式放行：`F06_REAL_POST_HANDOFF_TRANSACTION_CANCEL_HTTP_PG16_01`；唯一任务 [Issue #154](https://github.com/suzhe868-arch/mb/issues/154)；责任B／审核A。B必须从执行时**最新main**建立分支 `feat/f06-real-post-handoff-cancel-http-pg16-01`。只允许合成PG16、127.0.0.1本地CI、无真钱、无生产环境和客户。预算新增$0。

## 一、Authority和必须先确认的现状
- PDM-19 Final §§8–10,19–26；PDM-02/03/17/18/25 Final。A已验并合PR139 Lock转Tx、PR143 Lock退款、PR146 Tx普通Cancel、PR150 Tx Refund、PR153真正负责人Handoff。最新[PR153](https://github.com/suzhe868-arch/mb/pull/153)合并 `70c9372a55865d59c5a3772b368d236775154038`；B受验HEAD `4d499810cd9a97bd483ffb257b5d03b01f6bb062`，同SHA [Run39458177954](https://github.com/suzhe868-arch/mb/actions/runs/39458177954)/Job118750396752父534+Handoff40+TLS11=**585/585**，旧父161表/24迁移不同OID Seal一致。详见本批A验收报告《F06真实Transaction负责人移交_A主控独立验收PR153合并与移交后取消正式放行报告_2026-10-21.md》。
- 本批必须明确：冻结PR139源的初建负责人永不变；PR153新Handoff sidecar签名源现已存多版本old/new/actor/time/reason，public当前Responsible为版本链尾。冻结PR146旧Cancel的`trustedTransaction()`对原Responsible作硬相等，**移交后的新负责人不能直接复用旧Cancel**。旧PR150 Refund还只认PR146合法Cancel，不可把新取消原件冒充原Cancel。旧F06-3B/4B签名不可伪造。

## 二、B唯一授权业务与禁止
- 在**非特权、可销毁PG16同一事务**建立 PR139签名原Tx `in_progress`→至少一条经PR153原生合法签名Handoff→当前链尾员工发起`cancelled`的版本化**新合成Post-Handoff Cancel**。验证Customer/Vehicle/listing_cycle/原Lock一致、原Tx初始签名、3A原生Deposit+Correction所有签名与净额、旧3C1锁侧退款归属、PR153每条Event/Key/Audit版本顺序及当前Public Responsible、当前Permission/Scope/Object状态。不准通过构造无签父或替换原始签名实现。
- 员工当前Session独立`transaction.ci.cancel`及其独立capability、当前Team/Store/DataScope，必须**当前真实链尾Transaction responsible**且有效才可取消；旧负责人、Customer owner、未经明确授权的经理/店长、SystemAdmin职位或4S、失权、inactive、失效scope/非法对象/错误团队一律FailClosed。不得为“测试方便”直接赋予任何真实生产权限。
- 单独新CI签名Sidecar`f06_real_post_handoff_cancel_ci`保存不可变Origin、Event/Key、源Tx原始SHA、PR153 Handoff链最后版本及完整Digest、当前Responsible/Actor、原因/时间、幂等与签名Attestation。**不允许**写/改冻结`f06_real_cancel_ci`、`f06_3b_ci`或PR139/Handoff原始Sidecar签名。
- 一个真正PG16认证Session/事务按Vehicle→Transaction→source Lock→现有Handoff/Deposit/Refund及Scope有序检查；`status='cancelled'`与新Origin/Event/Key/Public Audit原子提交，至少status/event/audit三处注错Rollback均无半写，真实两Employee不同后台连接并发/重复/冲突、异Key同Tx至多一次合法取消、同Key重复幂等，Handoff发生新版本改变时旧Version不可绕过。真实支付/未知退款、未解除pending、错误金额与未签Correction硬拒；cancelled不恢复原Lock、Waitlist、Priority、Visibility或伪新期次。不能更改原价格/完成成交/资金。
- **显式限制**：新取消成功不能虚构旧PR146 Origin；此后旧PR150 Refund仍必须FailClosed，待下一A工作单另行解决合法版本退款来源。不得在本任务中改冻结父以求接口全通。

## 三、严格文件与可验证合约
- 只允许**新增**：`engineering/f06/post-handoff-cancel-http-pg16/**` 和`.github/workflows/f06-real-post-handoff-cancel-pg16-onejob.yml`。冻结PR139/143/146/150/153、老3A/3B/3C1/4A/4B、公共24迁移/M94、公表DDL、`engineering/src|scripts|sql|integration`、PDM Final、旧工作流与生产API/Issuer全只读。新增路由仅`/__ci__/f06-real-post-handoff-cancel/**`，生产路由与真钱Issuers 404/hard deny。
- 单免费Ubuntu24.04 Runner、单postgres:16-alpine服务、一个Push-only精确branch+上述两路径的Job、contents:read，无PR trigger、矩阵、上传工件、付费、真实Secrets；本次新Workflow全库Trigger预检Push=1/PR=0前后复核。所有真PG16父签名、HTTP、回滚、跨物理OID恢复必须在**最终B HEAD同SHA单官方Run**完成，完整父**585/585**+新真实HTTP/PG16**>=35**+TLS安全拒绝**>=10**，合计**>=630**，0失败/跳过/取消。旧父四Schema原161张表逐表COUNT/MD5、24迁移、独立真实物理恢复两套不同OID并确认完整行Seal一致，新Sidecar另列。临时shim仅可用于旧父历史branch changed-path预检，不能跳过任何父PG/资金/签名/测试。
- B中文正式自验与A交接：`engineering/f06/post-handoff-cancel-http-pg16/B自验与A交接.md`，本Issue永久备注末SHA/官方Run/Job/PG Backend PID/原161表Oid+Seal/真两名Employee授权和撤权证据、版本链/新取消历史签名、注错Rollback和旧PR150不兼容的严格FailClosed。B不能建业务PR或自合main；只有达到`READY_FOR_A_REVIEW / NEXT_OWNER=A`交A，若缺真实签名父或权限授权就报`BLOCKED_SIGNED_POST_HANDOFF_CANCEL_CARRIER_OR_SCOPE`。

## 四、非授权边界
真实生产的Cancel/Handoff/Refund、真实钱款、`refunded`、`completed`成交/成交纠错/金额、银行微信、真实Customer、UAT/部署、Public生产DDL等不在本包；F06/F07/F08/V1全局仍`NOT_READY`，C PR68仍独立Draft。

## 五、原GitHub正式Issue不可省略
以下为A正式放行Issue中的原始施工约束（与本文件同时生效）：

# A主控正式放行｜F06已签Handoff后当前负责人合法Transaction取消 HTTP/PG16

**唯一B任务**：`F06_REAL_POST_HANDOFF_TRANSACTION_CANCEL_HTTP_PG16_01`；**NEXT_OWNER=B / REVIEW_OWNER=A**。B指定新分支 `feat/f06-real-post-handoff-cancel-http-pg16-01`，从实际开工**最新`main`**创建；先读本Issue和下列随标准治理PR合入main的**完整A施工单** `07_重建工作区/F06真实负责人移交后Transaction正常取消HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-21.md`；B不得自行创建业务PR/合main。

## 依赖与冻结规则
- 前置 [Issue #151](https://github.com/suzhe868-arch/mb/issues/151) 已A独立验收并标准合并[PR #153](https://github.com/suzhe868-arch/mb/pull/153)，实际merge `70c9372a55865d59c5a3772b368d236775154038`。B末SHA `4d499810cd9a97bd483ffb257b5d03b01f6bb062`，官方同SHA [Run #39458177954](https://github.com/suzhe868-arch/mb/actions/runs/39458177954)/Job118750396752 **585/585**（父534、新Handoff40、TLS11），原161表/24迁移、OID87819→97329、Seal `9833de68dfd2ab9cc1f6c65995359589d29247a7dcb6ca980eaaa94b7962d5c0`。旧3B/4B非真实PR139来源；旧PR146的`trustedTransaction()`要求公共`t.responsible_employee_id`仍等于最初PR139 origin Responsible，因此Handoff后旧Cancel按安全FailClosed，并非产品完成。
- PDM-19 Final §§8–10、19–26，PDM-02/03/17/18/25 Final。**已签合法Handoff后的真实当前Transaction responsible**，在权限/Scope/Object State合法且Transaction仍`in_progress`时，应能执行普通`cancelled`，旧负责人/Customer owner不得越权代签；只允许合成同一个最新已验PR139+PR153原生签名历史，不造旧3B/4B，不能修改PR146父侧车使其假兼容。

## 本批唯一业务（无钱）
- 首先独立读并真实证明：PR139合法签名Tx在本次独立PG16创建，PR153新`f06_real_handoff_ci.events/request_keys`存在至少一笔**真实合法Handoff**，其`currentSignedResponsibleCI()`可验完整有序版本链，原始Responsible留在不可变PR139 origin、公表当前Responsible等于链尾。验证PR146旧Cancel确实FailClosed、旧PR150 Refund在未Cancel时拒绝；**这不意味着新Cancel可以复用旧PR146签名origin**。
- 仅新本批独立`f06_real_post_handoff_cancel_ci`版本化签名Sidecar（Origination、Event、RequestKey、不可变签封与Attestation）；签明交易/原Lock/Customer/Vehicle/cycle、PR139 Tx原签Digest、PR153签名handoff完整最新version/digest及最后New responsible/actor/current permission/scope，作为**新的安全取消链**，而非伪造`f06_real_cancel_ci.origins`、`f06_3b_ci.transaction_origins`或复用旧PR146流水。
- 用当前有效原生Employee Session与**当前签名链尾responsible本人**拥有`transaction.ci.cancel`独立permission+capability+data scope/object state验证，历史old responsible、manager职位本身、SystemAdmin、4S、禁用User/Customer、跨Team/Store/失效Membership、伪Token拒绝；同一Employee`current owner`不同于Tx Responsible不准绕过。**不能擅自扩权限**或改冻结PDM。
- 在一个真实非超管PG16事务中Vehicle→Transaction→source Lock→Handoff签名/资金事实同序锁定，`in_progress→cancelled`、新合法版本签名Cancel origin/event/Key及Public Audit**原子提交**；旧Lock/Waitlist/Priority不可复活，listing_cycle/source_status/visibility不臆造恢复，其他资金/未知Refund、现有pending、Payment、Source失签FailClosed。相同Key/Actor/Subject/Payload重放幂等，不同Key/Actor/Reason冲突，status/event/audit真实故障注入全Rollback；不同Employee Token/真实PG backend竞态与同Tx不双Cancel、Handoff和Cancel相互竞争的签名版本变化必须安全拒。
- 新Cancel成功后`public.transactions.status='cancelled'`为终态；旧PR146侧车依旧无此Transaction记录，**PR150原退款对这种新的Cancel来源应FailClosed**，等待后续A正式批准的版本化退款衔接任务；不得为了假“退款已通”造旧PR146 Cancel origin。不得产生`completed`、`refunded`、`refund_payments`或任何真实钱款。

## 强制工程和CI边界
- **仅新增**`engineering/f06/post-handoff-cancel-http-pg16/**` 与专属唯一 `.github/workflows/f06-real-post-handoff-cancel-pg16-onejob.yml`；原3A/3B/3C1、PR139/143/146/150/153服务和Sidecar/Public M94/24迁移/原工作流、生产资金Issuer/API、PDM Final、`engineering/src|scripts|sql|integration`只读。只有127.0.0.1 `/__ci__/f06-real-post-handoff-cancel/**`本地合成路由。仅可销毁`f03_ci`非超管PG16。
- 单免费Ubuntu24.04 Runner、单PG16 service、只读`contents`、一个Push-only精确branch+新目录paths的Job，无PR触发/矩阵/Artifact上传/付费资源/生产Secret，新增预算**$0**。最终B HEAD唯一官方Push Run**同一SHA**继承真实父**585/585**，新增真实HTTP/PG16**>=35**和TLS/生产拒绝**>=10**，总**>=630**且失败/跳过/取消皆0；必须再验证161签父表逐表COUNT+MD5、24迁移、两个不同PG物理OID独立恢复前后全行Seal一致、新侧车单列。父工作流嵌套旧branch预检若不匹配，仅历史路径预检可有临时shim，不能跳过任一业务父测试、签名、PG、Seal，本批自身预检Push1/PR0至少两次。
- B完整中文交接`engineering/f06/post-handoff-cancel-http-pg16/B自验与A交接.md`，Issue写末SHA、Run/Job、父585、新测试数、PG backend PID、OID/Seal、权限Scope、真实PR139→PR153 Handoff→本批Cancel事件版本摘要、真正原子Rollback、未知资金拒绝、不兼容旧PR150退款仍FailClosed，`READY_FOR_A_REVIEW / NEXT_OWNER=A`；仅A做PR/merge。不可实现父签名/Permission兼容就报`BLOCKED_SIGNED_POST_HANDOFF_CANCEL_CARRIER_OR_SCOPE`、不得绕签造旧签名。

**仍未授权**生产Handoff/Cancel/Refund、实际付款/退款、`refunded`、`completed`、成交价、真实客户/业务账号、外部联调/UAT/部署。F06/F07/F08/V1整体`NOT_READY`，C PR68维持独立Draft。
