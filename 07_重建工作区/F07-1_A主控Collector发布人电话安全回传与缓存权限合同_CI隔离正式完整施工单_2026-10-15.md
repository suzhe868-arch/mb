# 名邦汽车 V1｜F07-1 A主控正式完整施工单：Collector发布人电话回传、缓存与敏感权限安全合同（仅隔离CI）

> 日期：2026-10-15｜正式放行：`A_RELEASED_FOR_B_F07_1_CI_ONLY / NEXT_OWNER=B / F06_GLOBAL_NOT_READY / F07_GLOBAL_NOT_READY / V1_NOT_READY`。
> **本包是F07独立集成阶段第一个受限工程包，不是生产JYT采集服务，不代表真实电话链路部署。** 不受上一F06-5C工程测试的生产权限推导。
> 唯一权威基线：最新GitHub `suzhe868-arch/mb/main`，其中PR62已标准merge `e54872b3f92cd66b3b51bd5465670e0d6e7de3c1`，A报告：`07_重建工作区/F06-5C_A主控PR62独立验收96项真PG16标准合并与F07前置分阶段放行正式报告_2026-10-15.md`；B开工前再实际拉取**最新main**，不得把该历史SHA当成永不变起点。

## 一、真实Authority、现状与依赖

1. 必读`README.md`、`CURRENT_PROJECT_STATE.md`、`NEXT_ACTION.md`、`PROJECT_STATE.json`、`07_重建工作区/DECISION_REGISTER.md`、三窗口验收规范、PDM-09/02/04/08/25各最终完整规则、F04-1至F04-4已签合同、F03身份/当前角色/个人DENY/范围与F05真实Vehicle/source变化契约、F05-11旧全域Gap台账。若合同细节冲突，按已签最高权威逐项升级A，禁止B创建新业务规则。
2. PDM-09唯一方向：**Collector在采集端取JYT发布人电话，结果经名邦Backend现有Integration API/数据回传体系回传名邦**；名邦不直接控制JYT取号Token、内部请求参数，不恢复“名邦直接调用Collector Phone API”的旧反向架构。取号对象和缓存身份均为`source_platform+upstream_publisher_id`，不是`car_code`、单车ID或手机号，publisher多个批发车共用缓存。
3. 只有当前`source_type=wholesale`且该Vehicle在当前Employee data scope、active Employee具独立上游电话敏感能力与有效会话时才能查看/取得号码/拨号；4S、System Admin作为客户业务身份、无许可销售、已撤权旧会话、内部模式无自动授权；批发→名邦转换后即刻关闭日常电话入口，历史Publisher事实保留。不得恢复/新增`can_call_wholesale_phone`权限位。
4. 普通查看有有效缓存应直接使用；有旧缓存即使新鲜度过期可继续使用；无缓存按需single-flight请求，主动“获取最新”强制取新但合法新号码不足时原缓存**不得清空**，无有效缓存进入`PHONE_UNAVAILABLE`；不得用latest失败冒充已更新。号码真实拨打只允许合法取得后调用终端系统拨号器（本包不接真实终端）。
5. PDM-08的图片/CDN及F07其它集成、通知、重试**不在本包可执行范围**。即使存在旧工程`collector-phone.ts`也只是历史复用候选，必须重新验证当前PDM-09方向。F05/F06原CI-only合并事实不代表生产API、真实银行或真实Collector已经接线。

## 二、唯一工作分支、白名单与禁止

- B从执行时最新main新建分支`feat/f07-1-collector-publisher-phone-callback-ci`，新PR指向main；只允许**新增**`engineering/f07/collector-publisher-phone-callback-ci/**`和`.github/workflows/f07-1-*.yml`。其中可包含Node真实安全回传Handler、适配器、模拟Collector、本批独立可销毁PG16 sidecar、合同/权限矩阵、源测试、HTTPS测试、审计和中文B交接；可以只读import已有已签Auth/Vehicle/Permission/Scope，无权修改冻结旧F03/F04/F05/F06模块、SQL migration、所有旧CI、PDM Final/IA/Low-Fi及五项main Authority。
- **绝不连真实JYT/Collector、真实客户号码、短信、微信、飞书/生产域名、对象存储或生产数据库**；只在可销毁非superuser PG16与loopback TLS中使用明显合成的发布人ID和非真实可拨号码。无真实密钥，不可把号码、鉴权密钥或Token打印到日志/官方Artifact。
- 本包新增API属于隔离工程可运行原型，**不登记为生产路由、不部署、不开放公网、不发生产Collector凭据**。生产通信鉴权方案需独立工程安全批准，本包只能证明一个严格FailClosed的合同与模拟回传安全行为。
- 不新增产品角色/业务权限，不改变当前cache-key或Publisher生命周期。若旧物理Schema缺少正式publisher缓存/历史字段，只能在本批隔离sidecar表达测试合同并将真实业务实现标`SOURCE_GAP`；不得悄悄发正式public迁移或声称实际已经连线。

## 三、代码与真实业务验收要求

**R01 回传来源与认证**：模拟Collector向名邦可运行loopback Integration API Handler入站投递`source_platform`、`upstream_publisher_id`、synthetic phone/result、request_id、签发时点。对请求签名/有效时间窗口/nonce或幂等Key、回放、伪签、过期、缺字段、异常格式、跨publisher替换、乱序结果、不同请求同key异payload一律服务端FailClosed；只接受来自本包显式可信合成Collector凭证，不硬编码实用生产密钥。不允许响应携带原始JYT Token。采用安全日志与不可变审计，不回显秘密或真实电话号码。

**R02 publisher当前缓存与历史**：复用`source_platform+upstream_publisher_id`；不同Vehicle同Publisher读同一当前事实；不同平台/Publisher互不污染。只有有效非空号码更新当前缓存，历史保留旧号码更新证据，latest失败/非法/超时不得空覆盖；cache miss仅取一次、普通缓存命中不重复上游请求、latest强制新取但不伪造成功。不同publisher并发、同publisher single-flight、幂等重复、乱序旧回传不得覆盖更晚有效事实。使用真实PG行锁/唯一约束/事务证明，拒绝仅用进程内Map模拟所有原子性。

**R03 当前请求者授权**：真实隔离PG16已签Employee会话校验，在接通敏感动作时重验当前身份、独立电话敏感能力、个人deny、data scope、当前车辆source_type、listing_cycle/object状态；无权者禁止取号任务创建/读号码/刷新/拨号。4S、管理员客户业务身份、历史离职/撤权、另店/另团队、旧会话复用、批发转名邦及无publisher不可越权；入口隐藏不能替代服务端拒绝；普通业务安全投影、分享H5、客户端响应始终不输出电话，拒绝使用旧`car_code`或单`vehicle_id`缓存键。

**R04 原子并发与可信工程边界**：两个不同真实PG Backend对同publisher latest竞争、失败回滚及不同publisher隔离，证明至多一个被选为当前有效结果，旧缓存和历史不可因失败漂移；同一个publisher的不同车读取仍一致。权限撤销/车辆来源转换COMMIT与旧请求回传交错时，要定义接收结果存档与能否继续对外展示的分界：允许保留合法publisher缓存与历史，但当前车辆入口必须实时拒绝（PDM-09 3A）。审计事件与业务变更同一事务，无法签名/权限不明时拒绝而非放行。

**R05 缺口反向核验**：输出`Action→PDM最终规则→真实F03/F04/F05来源→Auth/Role/Scope→Publisher/Cache→Handler→真实PG断言→接线状态`矩阵。任何未实际接入生产Integration API、未落实真实Collector验证的事项一律标`CONTRACT_ONLY/CI_SYNTHETIC_ONLY/SOURCE_GAP`，不可写`PRODUCTION_READY`。审计现有F04公开合同、旧`collector-phone.ts`并列出现的旧反向API逻辑，形成禁止复活映射，不在旧文件动刀。

## 四、不可降低的GitHub CI与证据

1. 新分支真实`event=push`，只允许自身名下新`f07-1-*.yml`；至少**2个独立真非特权PostgreSQL16**的Source/loopback TLS Job，全程CI-only隔离。真实Source **≥25项相互清晰可审计安全/缓存/回传/并发断言**，HTTPS **≥9项服务端认证、权限、异常和无敏感泄漏断言**；至少2个不同PG Backend PID/txid和可复现锁等待／冲突证据，至少一次注错ROLLBACK且原缓存、历史和审计全行COUNT/MD5不出现半写。对重启前后同键重放/乱序使用PG持久证据，不靠内存变量。
2. 复核已合并F03/F04/F05必需的真实签名父与官方证据，不修改其CI/物理DDL；原已验F06-5C不要求复制96个旧冻结GitHub专属分支工作流到F07，本包需书面说明历史运行与**本批真正运行**的界限，不得以旧96项替代新的F07 Source/HTTPS。自行补本包环境安全门禁、JSON/TS合同静态检查、可销毁真实PG和API黑箱服务测试。
3. GitHub官方Job与Artifact必须属于**最后唯一HEAD**，全部success、无skip/pend；每个新Job有非空、未过期且官方sha256摘要Artifact，保留真实日志、PG OID/PID、失败码、具体正反操作、全体当前权限来源与经过脱敏的审计。Docker/ECR限流不得借失败日志冒称通过；同HEAD rerun可在可追溯前提下恢复。
4. B提交中文`B自验与A交接.md`、`来源与权限矩阵.tsv`、`有效业务用例矩阵.tsv`、真实日志/证据目录及明确未实现缺口。自行排障、评审、整改、全部回归直到包级闭环，最终PR说明`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`，A按实际main与唯一末SHA独立验收后才可合并。禁止把原生业务单元数与HTTP字段校验机械累加，正反和安全域必须可信。

## 五、不得越过的阶段边界和退出

- F06真实退款、completed/refunded、资金记录、实际Deposit入账、F05/F06整域上线、真实JYT/Collector对接、CDN图片、真实微信/飞书通知、生产敏感电话、生产电话鉴权/拨号、UAT/部署及F08整体验收一概**未放行**。
- 遇到现有源或权限API真实无法满足时保留最小可重现FailClosed和`SOURCE_GAP`，提交A技术裁决；不得修改冻结父、写假已完成。C/H01/员工界面及PC后台也未由本包实施。
- **唯一下一责任：B工程执行**。`NEXT_TASK=F07_1_COLLECTOR_TO_INTEGRATION_PUBLISHER_PHONE_CALLBACK_CACHE_SCOPE_CI_ONLY`。`NEXT_OWNER=B`；F07及V1继续`NOT_READY`。本任务的完整授权只在上述白名单、合成隔离环境中成立。
