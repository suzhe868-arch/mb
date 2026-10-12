# F05-9｜PDM14 Recommendation/hidden/Share/批发免费价权｜B工程施工与A交接

## A首轮验收整改｜R01～R04 第二轮施工记录

A已在main `03b3823fd4fcaeb9a3e4ae1753ad2b2bc30bbf25`下达正式整改：`07_重建工作区/F05-9_A主控首次独立验收70项真PG16全绿但PDM14跨域权限与权益生命周期缺证整改单_2026-10-12.md`。**原70/70及六份Artifact仅为前B SHA `019ddc76…`的历史证据，不能替代本轮新SHA门禁。**

- R01：真实v23 high/acceptable Match、v24 Customer A资格与Priority物理行，另一Customer B旧Recommendation/Grant/价权历史保留；真实另一PostgreSQL backend在Vehicle持锁写Priority期间，B普通分享SafeProjection必须串行等COMMIT，之后detail/ordinary_share/my_recommendations抑制；签名v24 reconcile终止Priority后动态恢复，不自动公开隐藏车。Customer A不因Priority凭空得到Recommendation或免费价权。
- R02：Customer Level find off/on、停用/恢复、旧历史end/void/同cycle新Recommendation保护；对end/void合法治理与新create entitlement分离，仍检查当前owner、F03身份与权限scope，旧recommender不永久赋权；禁用或无find时客户端当前推荐专属权限暂停，历史审计与已成立价权不删除。
- R03：真实v20当前数字报价初始NULL而free right已成立、后补及调价动态数字价、不可变当时快照、0 daily quota debit；合法CI同车批发→名邦source_type/cycle维持原推荐与已成立免费权，新名邦Recommendation不自动获批发免费权。
- R04：两辆新合法Vehicle真实Recommendation分别成功与第三辆无效Vehicle逐车独立部分失败；真实Lock/Transaction占用而仍可售时推荐合法、offline拒绝；物理跨Store/Team经理和店长必须明确Scope、4S hard deny、个人permission deny及旧销售在Owner变更后失权。
- 原冻结12项Source和7项HTTPS全部保留。新版Source以**17项物理用例**执行，非生产真Issuer仍`SOURCE_GAP`。新测试实际是否PASS以**最终同SHA真正Push原生Job**为准，当前不得预签`A_ACCEPTED`或`READY_FOR_A_SECOND_INDEPENDENT_REVIEW`。


> 当前本文为 **施工阶段证明，而非验收通过声明**。正式状态：`F05_9_B_ENGINEERING_IN_PROGRESS / NEXT_OWNER=B / V1_NOT_READY`。B必须在最终单一SHA取得九条官方Push工作流、70/70独立PG16作业、6份有效Push证据后，才追加本GitHub PR上的最终正式交A评论；不得在等待时冒写成功数据。

## 正式施工授权与冻结边界

- 唯一有效Authority：最新main的`07_重建工作区/F05-9_A主控PDM14正式推荐隐藏车单车可见性免费批发查价和普通分享隔离完整施工单_2026-10-12.md`，其下一级`07_重建工作区/PDM-14_最终完整规则.md`共52条已签规则；F05-8第六轮A真实验收PR47合并，merge SHA `d37b3fc9e44f4affd3b611c38c7c303bac93acb2`。
- B新分支：`feat/f05-9-recommendation-visibility-grants`，从开始执行时main `14f9d78570b13822e1f73b7577fb797f5c826420`新建；未延续F05-8分支；只在`engineering/f05/recommendation-visibility-grants/**`和`.github/workflows/f05-9-*.yml`内施工。明确不修改旧签Migration、旧业务源码、旧Action工作流、PDM、生产API或Customer微信身份。
- 原M94实表`public.recommendations`是正式Recommendation对象载体（含recommender/source_demand/status），`public.vehicle_visibility_grants`是hidden Customer单车授权载体；二者原定义/原字段未更改。本批v25新sidecar`f05_9_recommendation_facts_ci`只冻结recommendation价格snapshot/创建时事实；`f05_9_price_right_ci`只合成**current-cycle批发免费价权**，`f05_9_recommendation_events_ci`只追加审计；新Migration记录`M94_TO_V24_SIGNED_LEDGER`来源并使原v24及旧M94完好，禁止生产Issuer。
- 入口只认`IsolatedAuth.withSession`真实F03员工会话；通过物理Employee、Customer、当前Demand、Team/Store、个人Permission、Capability/DataScope的实时查询和行锁；普通销售必须当前负责及本team成员，Manager/StoreHead需显式有效对象范围。4S/SystemAdmin/失效Session一律Fail Closed。由于**正式Recommendation Employee Permission Issuer尚缺**，隔离实验以已签`matching.rule.manage.ci.synthetic`合成能力作代理，而不是声称线上Recommendation权限已签发。
- Vehicle包含真实`vehicle_id/listing_cycle_id/source_type/source_sale_status/platform_visibility/archived_at`，current-cycle/真实可售通过才创建，hidden不等于offline；其他Customer active Priority排他拒绝新推荐。Match/Priority/Share/Consultation本身绝不签发Recommendation；Lock占用本身不是自动禁止推荐原因。
- 只有原source_type=wholesale的合法创建才立刻生成**仅本Customer+Vehicle+listing_cycle**不可变免费Price Right；只读取v20的`f05_4_current_price_ci`的**CI合成**当前客户报价。没有数字价也保存price consultation快照，之后同cycle出现合法数字价才动态读取；不得写入旧`customer_price_unlock_events` quota扣减事实；end/void/owner改动/source_type同车转换不删既有免费事实；old-cycle自然失效。
- 动态visible→hidden触发器以active + current-cycle Recommendation作为Grant唯一来源，不能反写public visibility；客户停用/失find/他Customer Priority时只暂停当前访问，不删历史或价权；Source为普通分享时客户端仅以接收人的Customer ID导航并重新投影，无sender权限扩散，绝不泄露VIN、内价、Token、JYT号码、原件。
- CLI新增`runner.mjs --inject-rollback|--apply|--verify`，SQL的事务注错必须让v24旧catalog/旧Ledger保持原封不动。新Source/HTTPS在**各自全新非超级用户PG16**重建历史M94→v23→v24→v25并真实测试。新HTTPS只开放localhost合成只拒绝入口；绝不开放生产路由。

## CI全部冻结复验与正式交审门禁

九个`f05-9-*.yml`官方工作流：原F05-8 H52（52）、I/J/K及F05-4/5/6（共12）、旧F05-8兼容+Priority四独立（4）、v25新Source/HTTPS（2）= **至少70个非特权PG16独立Job**。所有必须属于最终唯一HEAD并且`event=push,status=completed,conclusion=success`，0fail/skip/pending。
- 历史旧F05-8 F05-7完整Source 28、HTTPS 7；Priority Source 37、HTTPS 10保留真实运行；旧64 Jobs正文（新文件中只改branch filter）不删旧完整业务测试。旧F05-8新复制工作流中仅将依赖旧Branch的GitHub68审计调用胶水替换为F05-9自己只读70审计；**不能删减旧业务测试**。
- 真新v25 Source应有真实SQL/事务/签名对象/双PG锁竞争及快照、Grant、免费价权、share拒绝；新HTTPS应该是独立PG16 + loopback真实TLS、明确production-deny，不伪造成功生产接口。
- 本批新增矩阵`F05-9_来源权利与展示权限矩阵.tsv`逐项注明`REAL_SIGNED`、`CI_SYNTHETIC`及`SOURCE_GAP`。
- **有效Artifact至少6份**：旧F05-8本次真正Push Run生成的4份 + 新Source与新HTTPS各1份，必须与最终同SHA、非空、未过期并有SHA256。必须检查GitHub官方API物理`jobs?per_page=100`全部52条H52，禁止把pull_request run当Push，不能拼旧SHA。
- 发现失败先看GitHub原生日志：测试失败修复白名单代码并重新触发全部同SHA；`public.ecr.aws` Docker镜像限流`toomanyrequests`可使用官方同SHA rerun，**不更改已签旧Job或删用例**。最后正式交接本PR以`F05_9_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A / V1_NOT_READY`标记。

## 尚未授权上线的真实来源

`WECHAT_SIGNED_CUSTOMER_ISSUER`、`RECOMMENDATION_PRODUCTION_EMPLOYEE_CAPABILITY`、`PRODUCTION_DIGITAL_WHOLESALE_PRICE`、`PRODUCTION_PRIORITY_ISSUER`、真实JYT/上传报告/手机号、生产Customer share route、资金和真实UAT仍全部`SOURCE_GAP`。本批CI合成事实**不是**真实线上推荐/数字报价/微信分享许可；F05、C/H01高保真、V1仍为`NOT_READY`。B不合并main、不启动F06。
