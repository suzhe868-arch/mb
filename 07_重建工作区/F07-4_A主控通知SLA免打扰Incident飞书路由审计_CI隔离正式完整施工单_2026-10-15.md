# 名邦汽车 V1｜F07-4 A主控正式完整施工单：通知、SLA、免打扰、Incident与模拟飞书投递（仅隔离CI）

> 签发：2026-10-15｜`F07_4_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B`。**B须从开工时最新main新建隔离分支，唯一main来源不可用本单历史SHA替代。** 此单只允许短生命周期非生产PostgreSQL16、模拟Feishu接收端和127.0.0.1回环TLS，无任何真实飞书凭据、外网请求、客户消息或生产资源。F05/F06/F07/V1仍`NOT_READY`。

## 一、Authority、前置依赖与禁止越权
1. 先读取当前main六份规范：`README.md`、`CURRENT_PROJECT_STATE.md`、`NEXT_ACTION.md`、`PROJECT_STATE.json`、`07_重建工作区/DECISION_REGISTER.md`、`07_重建工作区/A_B_C三窗口协作与验收规范.md`。并读取`07_重建工作区/PDM-23_最终完整规则.md`全文、`PDM-25_最终完整规则.md`审计/时区/配置版本、`PDM-15_最终完整规则.md`既有首次响应SLA、`PDM-16/17/18/19/22`对应业务已签边界、PDM-02当前身份Scope及F07-1/2/3真正合并源码/正式A报告。
2. F07-3 PR66标准merge SHA `d90fcaa8e4e636668d6b0c1d07b4f2609a0f6a6c` **只证明F03/F05已签父源的拒绝/缺口与合成Collector合同**。不得把未签电话Alias/转车正向Issuer/JYT来源/图片CDN前端或Feishu当作本包真实allow。F05/F06业务对象正向签名读取如缺合法目录，必须输出`SOURCE_GAP`和可复现拒绝，不能假造已签业务事件。
3. **仅允许新增** `engineering/f07/notification-sla-incident-gate-ci/**` 和 `.github/workflows/f07-4-*.yml`；F03/F04/F05/F06/F07旧目录、PDM Final、现有Workflow、`public`正式schema/旧迁移、main状态文件均B禁改。需要CI状态表时可在一次性新测试schema和单Runner临时PG16上创建，必须真实身份Gate先于DDL/DELETE/TRUNCATE运行。不可恢复通用消息策略中心或增加生产表。
4. 唯一分支 `feat/f07-4-notification-sla-incident-gate-ci`，新PR目标main。不得将B其他活跃分支直接合入此分支；已有主线不允许破坏性重写。

## 二、交付范围与硬边界（逐项落实代码+证据，不是纯说明）
**N01 事件合约/allowlist（至少12条）**：仅消费PDM-23已签新咨询/首次响应SLA超时、公海领取首次跟进、LockRequest结果、自动Waitlist必要结果/释放、已配置Lock提前提醒、供应异常、Transaction/Refund变动与有效上游Incident/Recovery。普通浏览/点击/Matching/Opportunity/SourceRadar不推送；Recommendation新建/终止不自动客户微信消息。任何通知不得变更客户归属、锁车、候补、咨询首次响应、退款、资金或源业务状态。未验签有效父事件只可 `SOURCE_GAP/NOT_ALLOWLISTED/SKIPPED`，不把测试sidecar布尔值升格为业务真源。
**N02 当前接收人与开关（至少9条）**：发送时从真正合法当前owner/assignee/responsible以及current员工+Feishu映射求值，个人提醒总开关（公司最高优先级）、员工个人开关、员工SLA是否进总群开关、合法总群路由各自独立；inactive/权限撤销/无映射/切换负责人立即拒绝或跳过，不建立第二套notification owner、不可自动转派。SystemAdmin身份无默认业务NotificationConfig权。配置写必须current identity+explicit capability+scope+object并在COMMIT前重验；父调用缺口出原生负证，不许自己捏造F03正向授权。
**N03 DND/有效性复判（至少8条）**：PDM23默认为**业务时区23:00—次日08:30，后台可配置**；跨午夜两端边界、提前/延后及午夜重放、队列隔夜、配置更新、business clock继续计时。SLA/Incident/资金不豁免DND。DND结束必须重新验证event/recipient/route/channel开关；失效丢弃，继续有效方可模拟投递。业务时区通过明确配置与PDM25一致，不以runner UTC/用户设备时区偷换；锁到期提醒只能读已合法配置的提前量，不恢复30分钟常数。
**N04 去重、投递、错误重试（至少10条）**：普通事件同event+stage原则一次；`SENT`后重投返回`DEDUPED/SKIPPED`；两个独立PG16 Backend对同事件并发只允许单次合法派发声明（按本CI Mock adapter原生可审计结果），真实唯一约束/事务锁/重放/断网/Timeout/回滚/重复回执必须有零重复发送证据。重试不得生成新业务阶段、不能改源状态；真实外部Feishu网络与token坚决禁止。工程可选择模拟重试策略但不得谎称产品默认次数。
**N05 Incident生命周期（至少7条）**：同持续Incident复用唯一故障身份；只有已配置cadence且仍active、group/channel/DND均有效才允许模拟周期重复；无cadence必须抑制，**禁止恢复旧2/5/15分钟默认值**；Recovery通知以真状态变化证据为准并停止后续重复。SLA首次响应超时只读PDM15/22 deadline，不重启计时；先前read/点击deep-link不作首次响应。
**N06 Notification Log、审计、敏感投影、HTTPS（至少15个回环黑箱）**：落原生隔离PG16 NotificationLog，显示 event/object/recipient/channel/stage/scheduled/sent/result/failure/dnd/revalidated字段，保证SENT/FAILED/SKIPPED/DEDUPED/NOT_ALLOWLISTED准确且不可作为源业务审计Authority。Mock群内容只包含必要客户非敏感标识、员工、咨询摘要、超时长与安全入口；不写完整手机号/上游电话/原始Token/VIN/内部价/资金敏感数据，GitHub日志也不可打印随机凭据。deep-link/分享URL重查当前Session/Scope/Object，异常Host、编码穿越、SSRF、撤权、个人DENY一律拒绝，外部HTTP不泄细节，测试闭包可验证具体拒绝码/父调用次数。

## 三、真实PG16及CI工程强制标准
1. 新Workflow只在上述唯一开发分支真正`push`并且变更仅本白名单时触发；最少**2个彼此独立的真PostgreSQL16非超级用户Job**：Source含至少**40个独立可复现业务/安全子例**，HTTPS含至少**15个回环TLS黑箱子例**（Node父suite不能混计）。CI流程必须先核`CI/GITHUB_ACTIONS/event/repo/ref/run/APP_ENV=test`、唯一固定本地PG16 DSN、实际db/role/vers/非superuser；危险SQL操作前执行物理Gate，错误DSN/repo/ref/角色的负例必须零写入。
2. 至少一条真双Backend对同事件+阶段并发互斥和COMMIT/ROLLBACK，有`pg_backend_pid`、实际行锁或唯一冲突SQLSTATE及数据库前后COUNT/MD5。队列重试/失效/凌晨边界/Incident重复需在真PG16保持事件签名、Mock投递记录与Audit/Log一致；销毁测试schema后验证冻结父Catalog/已签表Count/MD5不变。测试可自由创建`f07_4_ci`非public隔离schema但不修改冻结父或正式业务数据。
3. 源数据为真实已签F03 Session/权限时，只在原父可调用边界实测登录/撤权和`SIGNED_PARENT_NEGATIVE_ONLY`；F05/PDM15/23的真实业务正向源若不可接，则明确 `SLA_EVENT_SOURCE_GAP` / `NOTIFICATION_SIGNED_ISSUER_SOURCE_GAP`。合成通知消息只标`CI_SYNTHETIC_ONLY`，没有真签父positive时不准写`SIGNED_PARENT_VERIFIED`。不许为了测试绿在父permission表永久加入不签能力。
4. 输出中文`B自验与A交接.md`、`PDM23事件与渠道权限矩阵.tsv`、`通知投递场景矩阵.tsv`、真实执行Audit快照，逐例标明`SIGNED_PARENT_VERIFIED`、`SIGNED_PARENT_NEGATIVE_ONLY`、`CI_SYNTHETIC_ONLY`、`SOURCE_GAP`。最后B唯一HEAD的两项真正GitHub Push PG16 Job必须`completed/success`，两份同HEAD官方非空未过期sha256 digest Artifact（并明确是否独立下载复算），报告最终Run/Job/Artifact/旧工作流红灯与真实未测项，B签 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A` 交A。不得B自行PR merge。
5. CI MockFeishu只允许loopback/内存或PG模拟sink，**禁止真实飞书Robot/Webhook/APP凭据、外网发送、私有手机号/客户、生产日志、微信订阅、App Push/PC Push、真实资金/退款、部署/正式迁移及UAT**。允许继续既有技术包之间正常接口契约/失败证据，但未满足上游父签依赖时不得抹去`SOURCE_GAP`。

## 四、包尾审查和下一责任
B包内一次性完成代码、测试、错误注入、负面权限复验、反向安全审查、缺陷修补、旧父验证、同最终SHA官方原生CI与两工件及完整中文交接。A基于真实源码、PDM23/25与独立PG16复查，失败给一份完整整改单，成功才按GitHub**标准PR merge**合main。此包合格也仅意味着F07-4非生产通知投递合同合格，F07整域/F08最终质量/实际Feishu或上线仍`NOT_READY`。

**正式放行：`F07_4_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F07_4_PDM23_NOTIFICATION_DND_INCIDENT_MOCK_FEISHU_PG16_CI_ONLY`**。
