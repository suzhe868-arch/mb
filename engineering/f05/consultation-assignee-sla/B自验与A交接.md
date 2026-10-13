# F05-10｜B工程D1合并后PR49最终跨域集成与交接（2026-10-13）

> **工程范围：A已合并D1/PR50，正式放行B实施PR49的真实Owner→Consultation集成。当前文件是CI施工证据说明，不能替代最终HEAD完成的GitHub Actions原生验收。最终状态以PR49正文中的最新SHA、运行ID、作业ID、Artifact与A审查为准。** V1依然NOT_READY，生产Issuer仍SOURCE_GAP。

## 权威与技术边界

- A正式任务：`07_重建工作区/F05-10_A主控D1合并后公海Owner到Consultation真PG16集成与PR49最终终验正式施工单_2026-10-13.md`。
- 分支：`feat/f05-10-consultation-assignee-sla`，PR49。保持原PR49独立Source30、HTTPS7和冻结旧70作业；本轮新增`integration-before-v26.mjs`与`tests/d1-integration.test.mjs`，只改F05-10本批新增目录及新增Workflow；D1本体、F03/F04/F05-1～9、签名DDL/迁移账、Final、生产API一律不改。
- 接受的D1库：M94→v25签名PG16在独立`d1_owner_ci`侧Schema执行原D1 **真实service** `claimCI/assignCI/serviceAssignCI`。仍按原D1规则使用合成公海来源和登录Employee7/Manager1、权限、对象范围与配额，Owner成功前必须产生不可变原始来源、OwnerHistory、Audit及D1 Receipt。不以直接UPDATE customer伪造“已认领”。
- **顺序不能反转**：同一全新非超级用户PG16数据库先执行D1 rollback/apply/verify→D1 fixtures→真Owner服务/权限阻断/两个实际PG PID并发→F05-10 v26注错回滚/正式apply/verify→F05-10原 fixtures/Source30→D1-Consultation真实集成Source新增5。F05-10只适配自己的PG连接以允许已验收的D1侧Schema；v26和旧v25签名Ledger/Public Catalog仍物理核验，绝不调用D1的v25-only verifier来伪验v26。
- `tests/d1-integration.test.mjs`在Owner形成后取原生合法可售车辆，正式调用F05-10 `createConsultationCI`（不创建另一个模拟咨询API）。第1项证实pending/无权/禁用的旧客户owner为空无法咨询，第2项Sales claim→Consultation create+reuse，第3项Manager assign→Consultation，第4项SyntheticServiceRequest→接客Owner→Consultation，第5项真实两个PG连接同时create、同Customer只有一个open Consultation。每次成功后证明现有D1 Receipt、OwnerHistory、Audit、Customer等与Recommendation/Grant/PriceRight/Priority/Lock/Transaction/Demand的原生count+row MD5不变。
- `integration-before-v26.mjs`还真实执行SystemAdmin/4S拒绝、保护事实拒绝、禁用客户拒绝、全部接客资格暂停后Owner仍空且pool标记pending、两独立PID的Claim和Assign竞争只一赢家。CI不会把普通分享、手机号合成同意当作生产正式Issuer，也不直接改写其他业务域的Owner。
- CI原生证据输出：Source原30、D1新5两个独立Node PG16 TAP日志、真实D1 v25前置调用日志、v26运行时日志、签名SQL dump含`public`和`d1_owner_ci`、最终D1原账封印及收据count/row MD5、版本签名、Hash清单与完整Source权限矩阵。需最终单一SHA十组真Push全部Success，旧70+新2共72/72独立非超级用户PG16作业0 skip/fail，至少8份同HEAD未过期有官方SHA256的Artifact。

## 业务守门与生产状态

- 此CI证明 **PDM17合法Owner前置事实→PDM15正式Consultation** 在同一PG16数据库与明确签名版本衔接，D1仅CI合成PDM17公海发行者；真正微信身份、手机号、线上公海Issuer、真实来电/飞书、JYT电话/价格、支付及生产UAT仍为`SOURCE_GAP`。
- A必须独立复核PR49新最终SHA的源码、安全边界、权限、PG16日志与完整冻结CI，并由A独立决定是否标准合并。B不合并main，F05/C-H01/V1继续`NOT_READY`、F06不提前启动。
