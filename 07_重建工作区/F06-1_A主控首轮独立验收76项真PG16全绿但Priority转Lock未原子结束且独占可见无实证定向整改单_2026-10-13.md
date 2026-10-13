# 名邦汽车 V1｜F06-1 A主控首轮独立验收：76个真PG16 Job全绿、原子Lock/Waitlist合成CI事实通过，但Priority→Lock双合同缺证（2026-10-13）

> **正式裁决：`F06_1_A_FIRST_REVIEW_CHANGES_REQUESTED_R01_R02 / PR52_OPEN_NOT_MERGED / NEXT_OWNER=B / F06_GLOBAL_NOT_READY / V1_NOT_READY`**。
> A独立受验唯一B HEAD`0d6a94dc6e81b5096ffa54e6d19fc0b43f8cd2d0`；2026-10-13。此处属于**已签PDM18与本正式施工单要求的CI-only业务实现及实证缺失**，不是“线上发现真实漏洞”。不要求B重做已通过的完整锁车申请/权限/并发/旧回归。

## 一、A正式认可且不得删弱的客观成果
1. GitHub PR [#52](https://github.com/suzhe868-arch/mb/pull/52) 以main`9389a1556afb8c6e36e970516965d68056bad89f`为B分支基线，当前open/unmerged/mergeable=true；25项变更**全部added、全部新F06-1 CI-only白名单**`engineering/f06/lockrequest-approval-waitlist-ci/**`与新`.github/workflows/f06-1-*.yml`，F02～F05/D1签名migration、业务源码、PDM和生产路由零改动。
2. A用GitHub官方REST`actions/runs?head_sha=0d6a94dc6e81b5096ffa54e6d19fc0b43f8cd2d0&event=push`取得**12/12个真正Push Workflow同SHA completed/success**，逐个`jobs?per_page=100`确认**76/76真实独立非特权PG16 Job success（H52 run38391979627=52/52、F05-8 run38391979655=4/4、其余10条各2/2，0fail/skip/pending）**，成功不借用旧SHA。外部ECR限流尝试按官方同SHA rerun成功，不视为业务失败。
3. A直接核原生Source Job`115282660155`有**40/40测试pass**、HTTPS Job`115282658616`有**9/9 pass**，新签名CI-only sidecar、原签公共v26 Catalog SHA`5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4`，Ledger原24、D1独立签名、完整H52旧合同保留；真正两PG Backend Permission revoke COMMIT旧Token拒绝日志`F06_1_TWO_NATIVE_PG16_BACKENDS_COMMITTED_REVOKE_DENIES_OLD_TOKEN`、两PG并发唯一Lock胜者`F06_1_TRUE_TWO_PHYSICAL_BACKEND_ATOMIC_SINGLE_WINNER`及两名其他有效申请自动Waitlist和responsible本源全部实测。
4. 真实业务COMMIT仅在可销毁场景库OID`21998`，随后销毁再建立不同物理OID`26495`独立已签审计库，**151张public+D1表全行count＋MD5前后全部一致**，签名Ledger/D1/Catalog未改，真实日志`F06_1_DISPOSABLE_SCENARIO_AND_SIGNED_AUDIT_GLOBAL_SEAL_PASS`的综合hash`7c72e41f486c32200e3a02637225508ef5eeed2cb509d43eded43bf508b0f039`。A通过官方Artifacts API亲核**至少12份最后B HEAD原生非空、未过期、官方sha256**：F06-1`11811170059/11810857369`、F05-11`11811210003/11810430212`、F05-10`11810650228/11809541349`、F05-9`11810540331/11810435368`、F05-8`11811020679/11810960457/11810935604/11810350344`。合法成功全部保留。
5. 已证实PDM18 LockRequest PG服务端6h、PENDING复用、不抢锁，Employee当前permission/scope审批、4S/SystemAdmin生产硬拒，真实Lock72h/数字价或咨询价历史快照，合法Customer/Owner与审批人独立，单车双PG竞争唯一赢家、其他两名有效申请LOCK_CONFLICT→Waitlist、业务注错整组ROLLBACK、已售或Customer disabled候补拒绝、真实Demand responsible不借审批人等均有Source通过事实。未证明的PDM18 §27/§28必须另列缺口，不能“40通过即全PDM18完成”。

## 二、A找到两项相互关联的明确阻断

### R01：现行active Priority→本人正式Lock后，原Priority未原子ended/未保留原签Priority历史

- **唯一规则Authority** `07_重建工作区/PDM-18_最终完整规则.md` §27 明确：正式Lock成立时“**当前active Priority ended；Priority Customer自己Lock可记录`converted_to_lock`**；Lock结束不恢复旧Priority”。此前F05-8签名`public.f05_8_priority_ci`是该事实的唯一载体，结束时原F05-8`events_ci`承载真实历史。
- **审查当前B业务源码实际** `engineering/f06/lockrequest-approval-waitlist-ci/service.mjs`：`access()`→`priority()`只`SELECT priority_id,customer_id`确认无其他Customer抢独占；`decisionCI()`获锁后原子`INSERT public.locks`、`INSERT f06_1_lock_ci.lock_snapshots`且`priority_origin_customer_id=...`、`UPDATE public.lock_requests approved`与`conflict(...)`。**全函数没有一次对`public.f05_8_priority_ci`执行合法状态`active→ended`、没有写对应签名Priority结束事实**；只记录副本Origin不等于合法结束Priority。
- 新`tests/source.test.mjs`40个Source虽测试失效/普通隐藏，但**没有构造“真v23 Match→合法v24 active Priority→该Priority Customer合法请求→审批成Lock”的物理Signed Source路径**，因此绿灯不能证明§27。此问题也导致旧Priority超时后旧公开域可能变化，且旧Priority历史不是真实“转Lock”状态。
- **B修复**：只在本批新`engineering/f06/lockrequest-approval-waitlist-ci/**`中实现，同一物理PG16事务和Vehicle互斥下锁定当前signed Priority并重验Customer/Vehicle/Cycle/expiresAt，合法成功Lock同原子提交时将其ended、记精确`converted_to_lock`或已签兼容原因、actor/time、原签事件不可变；真注错ROLLBACK应同时回退Lock/Priority/请求/所有Waitlist/Event；竞争旧Token及双PG同一Vehicle只能一人获锁，不得先单独提交release导致普通公开一瞬间泄漏。绝不改F05-8旧migration/旧Service/旧正式权限，不复活过期Priority。必要时沿用已经验收的Priority Service合法事件/触发器及v24历史模式，并保留Old PG Schema SHA。

### R02：Priority-origin Lock有效期的排他可见权未形成当前客户业务安全投影/实证

- **唯一规则Authority** `PDM-18_最终完整规则.md` §28：**普通VIP/粉丝Lock不隐藏其他客户原可见车；Priority-origin Lock即使Priority本体ended，Lock有效期间除Lock Customer外的普通Customer不能进入普通列表/详情；Employee/PC/Matching依然可读真实占用和Waitlist。**
- 本次B新增`lock_snapshots.priority_origin_customer_id`字段能承载来源，但新`service.mjs`没有提供当前客户列表/详情访问的受限Projection，也没有从该持久来源强制竞争客户的普通详情读取fail-closed。原`tests/source.test.mjs`40项**无一物理Signed Priority-origin Lock在Priority ended后仍拒绝另一Customer访问、同时允许该Owner及业务内部可审计读取；无一普通Lock不越权隐藏车的正向对比**。若现阶段真实客户端/线上Issuer未有签名入口，应当仍标`PRODUCTION_PROJECTION_ISSUER_GAP`，不可冒充生产可见保护已上线，但本包批准的是**非生产CI当前安全投影与受限路径实证**。
- **B修复**：在本批CI-only实现/实际调用面向Customer的真实PG查询or受限Projection：对当前Lock `lock_status='active'`且Lock对应**正式签名Priority-origin不可变快照**，对非Lock Customer的普通列表/详情hard DENY；对Owner合法当前对象返回受权限裁剪状态；对普通非Priority-origin Lock其他Customer仍按原本Vehicle/Grant/等级资格可见但显式“已锁不可重复锁”。Lock历史结束后不恢复旧Priority，重算当前可见域；真实Employee/PC/Match受信合法读不应被客户侧隐藏规则误拦。必须至少一次基于**真实已签v23 Match/v24 Priority + LockRequest→Lock**原生PG16 Source正反例，不以JavaScript假对象、手动插纯Origin字符串或SQL count替代。
- R01+R02必须一起通过：Priority正常结束与排他可见权转交必须在**同一个原子成功事务**达成，不能出现“旧Priority结束但新Lock尚未建立”和“Lock已获胜但仍旧Priority占用”的中间可提交事实；价格快照72h及员工/顾问/Waitlist全沿原签现时事实。

## 三、B继续原PR52一次性定向补齐与最终冻结门禁

- **唯一责任B**，继续`feat/f06-1-lockrequest-approval-waitlist-ci`原分支/原PR52，以本报告、A PR52审查评论和最新main为据，只修改此前授权**本批新增CI-only白名单**；旧F02/F03/F04/F05/D1公共Schema/签名业务与PDM不改、F06-2/3与资金/微信真实Issuer/生产/H01绝不施工。**不因这两项缺口重新做已通过38～40个现行正常场景**，而是增添真实signed Priority转Lock状态与Origin Lock独占可见的必要测试。
- 证明真v23 current Match→v24真active Priority（仅在独立可销毁合成业务库）、Customer账户/现时Owner/phone、Employee授权approve。保留旧CI Snapshot sidecar，新增**Priority ended＋history完整事务/失败rollback＋普通锁／原Priority锁客户投影正反例、不同Customer和旧Cycle/LockEnded安全边界**，对现时Grant/Recommendation/PriceRight/Consultation/Owner不出现旁路，R01/R02有独立可审查的机器可读状态差异及原生PG16日志。
- 必须保留**旧74冻结真Job**、已过的新Source40/40及HTTPS9/9，以及151表物理审计封印；新Source增加真实测试而不删弱，HTTPS维持≥9。最后新唯一B SHA重新**12条真实`event=push`同SHA、至少76/76个独立非特权PG16 Job全部completed/success（H52真52/52，0fail/skip/pending）、至少12份该末次SHA官方非空未过期含SHA256的Artifact**，完整Run/Job/Artifact ID与官方Digest。
- B更新中文`engineering/f06/lockrequest-approval-waitlist-ci/B自验与A交接.md`、PR正文及末次唯一B评论，报告`F06_1_B_SELF_TESTED / READY_FOR_A_SECOND_INDEPENDENT_REVIEW / NEXT_OWNER=A`；B不自行merge。不用新用户产品裁决，因为依据已批准PDM18 Final和原F06-1 A完整施工单即可处理这两项工程缺口。
- **全局仍`F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / C_H01_NOT_READY / V1_NOT_READY`，F06-2/3、实际Deposit/Transaction/Refund和真实线上锁车/电话/微信/资金未授权。** A完成下一次独立业务源码＋原生Job/Artifact验收后再裁决PR52。

**结论：F06-1首轮为`A_CHANGES_REQUESTED`，不是全面通过。任务继续交B，A不合并。**
