# 名邦汽车 V1｜F07-3 PR66 B工程A01—A05整改、自验及A复核交接

> 2026-10-15｜仅隔离CI｜已完成定向代码整改与原生PG16全包回归。本记录属于原PR66/原分支；最终提交SHA、同SHA成功Run/官方Artifact及旧PR检查快照，应以PR66最后一条B正式交接评论对本文件的补充为准。不得将文档提交前Run冒充最终提交Run。
>
> **B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A（仅在PR最终HEAD原生CI两个独立Job全部success且两工件同HEAD后生效）**。B绝不合并main，F05/F06/F07及V1仍NOT_READY、NO_PRODUCTION。

## 1. 正式Authority与严格文件边界

- 正式整改指令：`07_重建工作区/F07-3_A主控PR66首轮独立验收不通过_HTTPS判定车辆并发与来源重放定向整改正式施工单_2026-10-15.md`，A裁决号`F07-3-PR66-A-REVIEW-01`。
- 原PR：<https://github.com/suzhe868-arch/mb/pull/66>；原B受验SHA `394cc5d76d3e264b193982cd958daf9917e6f9d0`；原主线工作基线 `6fe05ba81d6f1eb1a6c6d0308a11ffc41c5ca85f`。
- 本次仅改 `engineering/f07/trusted-upstream-parent-gate-ci/**` 与 `.github/workflows/f07-3-trusted-parent-source.yml`。不改正式F03/F05/06父源、PDM Final、旧Workflow、正式DDL，不建新PR/不改main。
- 产品依据：PDM-02/04/07/08/09 Final；复用冻结 `IsolatedAuth`、`readCurrentFacts`、F05签名迁移Verifier与 `convertWholesaleToMingbang`。

## 2. A01—A05整改定位、正反例与实证等级

| A项 | 已实施的代码和测证 | 不可越界的事实 |
|---|---|---|
| A01 HTTPS恒403 | `server.mjs`逐请求保留`signedRead`判定对象并经仅CI闭包`onAudit`记录最终拒绝码、真正父`readCurrentFacts`调用次数和父拒绝码；`gate.mjs`新增受控trace，不含token/手机号/车辆原件；`https.test.mjs`逐项核查H01—H19，另验4S及SystemAdmin、epoch撤权，HTTP仍统一DENIED、无泄漏 | 正确形状的错误Publisher尚无正式Issuer/Scope/Vehicle实物绑定正例；只能证明每次父事实重读及硬DENY，不声明生产对象级正向授权 |
| A02 空数组可PASS | `signedF05ReadOnly`增加转换真实COUNT、`Vehicle+ListingCycle`关联/计数与父FK校验；F05-03/05禁止把`Array.isArray([])`当作签名转换正例；新增F05-21—24和物理全表COUNT/MD5快照，对拒绝后Vehicle、Cycle、Lock、Transaction、Recommendation及存在的Favorite等关系作前后比对 | 正式F05转换正例COUNT=0，`F05_CONVERSION_POSITIVE_SOURCE_GAP`。未取得合法Lock/Transaction Issuer，不可造转换成功、更不可把合成图片失败当成真实图片双成功 |
| A03 锁错账号 | F05-16改为两个独立真PG16 Backend对已存在的`public.vehicles`父行 `FOR UPDATE`争锁，观测原生`55P03`，两个事务ROLLBACK之后同父表全关系COUNT/MD5一致；Workflow必须grep真实车辆锁证据才绿 | F03-25原员工账号锁仍保留作登录侧负例，绝不再算Vehicle并发证明 |
| A04 Collector重放和三API | 新增`inspectCollectorOnce`，在可销毁PG16非public一次性schema上使用Publisher/Vehicle/Job/nonce复合唯一键，双Backend并发唯一登记、重放拒绝、撤销Job；运行后`DROP SCHEMA`并重新通过冻结F03全库身份/Seal验签；新增`mapSyntheticSyncApi`按PDM-04三固定API分别映射新增更新、批量下架、在售批发列表，校验credential隔离与同car_code不同Publisher | 这是一次性CI来源验证，`PRODUCTION_JYT_JOB_ISSUER_SOURCE_GAP`持续保留，无真实JYT/Collector的Issuer、nonce生产存储或外部API接线 |
| A05 矩阵/旧红灯 | `来源与签名父权限矩阵.tsv`修正来源级别；`跨域有效场景矩阵.tsv`逐例共90行，F03-11—18明确标`CI_INPUT_VALIDATION_PRE_PARENT`，HTTPS路由/输错前置拒绝亦不冒充父授权；本文件拆分主Push双Job和旧F05 pull_request工作流 | PR66下旧F05红灯保留，之前PR62/64/65个案例外不自动沿用；最终准确快照随原PR66最后一条B评论 |

## 3. 已确认的原生真PG16成功运行与物理数据

**已完成的整改代码同SHA回归里程碑**：`d80868ba5149f00a99048ce0c61d88a1553d6d6a`，真正Push GitHub Actions Run <https://github.com/suzhe868-arch/mb/actions/runs/38738475961>，两个独立真PG16 Job全部`completed/success`：

- Source Job `116433734972`：F03 **47/47** + F05 **24/24** =71业务子场景，非超级用户`f03_ci`，F03物理PID 90，F05 PID 148，F05 OID 17972（F03为另一数据库物理OID），两个车辆锁Backend PID `150/148` 且真`55P03`。
- HTTPS Job `116433735282`：独立PG16、一次性TLS本机回环、逐请求父Trace，**19/19** HTTP安全负例成功，无权限正文泄漏。合计 **90/90** 业务子测试成功；Node父suite另计。
- F05真实父数据计数：`vehicles=100`，`vehicle_listing_cycles=100`，`locks=93`，`transactions=61`，`recommendations=1`，`f05_3b_sync_lineages=0`，`f05_3c_wholesale_conversions=0`，`f05_3c_conversion_audit=0`。Favorite物理表在这次限定投影中未出现，**不宣称已经验证Favorite独立真关系**。父表结构、COUNT/MD5详见该Run原生Source日志，未输出敏感行。
- 同该里程碑SHA官方Source Artifact `11973439910`，4,930 bytes，SHA256元数据`c4580194060f9393eda6f3f1153437a2f74b584db44e28f3f6f2a73f7929148d`，`expired=false`；HTTPS Artifact `11973804511`，1,172 bytes，SHA256元数据`fe8c07ad1b394bef916f2412eb80c59d8a93dd51acb3f22aa1d1be8e6e94f872`，`expired=false`。官方元数据合法，不冒充逐ZIP独立复算。
- 上述 SHA **不是证据矩阵和本报告修订后的最终HEAD**；提交最终文档后，PR66最后一条B评论必须填入其真实最后SHA、最后同SHA两个独立成功Job及两官方工件，否则不得签交A。

## 4. 旧CI真实失败记录与适用边界

- A独立审查最初受验PR66 `394cc5d`时，额外10条旧F05 `pull_request` 工作流为**2 success / 7 failure / 1 in_progress**；旧Source有Docker Hub `toomanyrequests`，另有冻结F05自身非新Push凭据检查`F05_10_NOT_NEW_OFFICIAL_PUSH`。这些历史真实红灯仍在，不得删除/粉饰。
- 本整改连续Push的早期部分Run亦有真实失败，如 `38737987749`，源用例扩展后发现F03冻结Verifier明确要求不存在额外schema，已通过执行完合成nonce后销毁CI schema和重新真实验签解决；`38738475961`已验证整改后全通过。旧失败继续可检索，不宣称所有CI一直绿。
- 最终PR66同HEAD旧F05工作流完成情况及具体失败归类由最终B评论独立记录；**原PR66仍需A独立裁定其适用性及required check，不能套用PR62/64/65特例，也不允许绕过GitHub保护**。

## 5. 当前未解除的SOURCE_GAP和退出条件

`TECH_ALIAS_PENDING_A / SIGNED_F03_PHONE_ALLOW_SOURCE_GAP`、`SIGNED_F03_F05_SCHEMA_VERSION_SOURCE_GAP`、`F05_CONVERSION_POSITIVE_SOURCE_GAP`、`F05_CURRENT_OBJECT_SCOPE_OR_ISSUER_SOURCE_GAP`、`PRODUCTION_JYT_JOB_ISSUER_SOURCE_GAP`、`REAL_CDN_OSS_REPORT_GATEWAY_SOURCE_GAP`、Favorite物理独立关联缺口、前端/三端联调/UAT/资金/生产均继续未完成或未授权。

### B最终结论

本工程包的**定向整改代码及90项原生场景已经形成一次实际成功记录**。将以原PR66最后HEAD对应的**两个真正Push的非超级用户PG16独立Job、两份未过期同HEAD官方SHA256工件、旧F05十条检查独立快照**作为正式交A依据。最终满足则`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`；否则`B_BLOCKED`，不得自行合并main、扩展授权或报生产READY。
