# 名邦汽车 V1｜F05-3H A主控完整正式施工单：微信Customer身份与Favorite受信Actor来源审计及安全隔离

> 2026-10-12正式放行｜`F05_3H_A_RELEASED_FOR_B / NEXT_OWNER=B / CI_ONLY`。此批仅在真实隔离PostgreSQL16及回环HTTPS内核可信会话/身份来源和严格拒绝；不接真实微信第三方，不提供生产收藏接口，不凭模拟Customer生成成功授权。

## 一、正式Authority与白名单

1. 先从最新GitHub`main`读README、CURRENT_PROJECT_STATE、NEXT_ACTION、PROJECT_STATE.json、Decision Register、A/B/C三窗口规范、PDM-01/03/20/25 Final、F03认证与客户结构、F05-3F/3G已签证据/报告、本正式施工单。
2. 正式已签产品规则：PDM-01 Final §1/§2规定**微信识别→创建/找到稳定`customer_id`**，无独立传统账号密码页；`customer_id`是业务主身份，手机号/头像/昵称非主键，多个微信身份彼此不自动合并，不恢复Customer Merge；Customer停用后不允许基于身份的收藏新动作而旧历史保留。PDM-20 Final §23收藏为独立Customer→Vehicle关系，hidden保留但不得穿透权限，offline/sold保历史，同`vehicle_id` relist收藏持续，当前Cycle价格权益独立重验；PDM-25 Final要求现时鉴权与历史分离、不可伪造业务成功和幂等。
3. 已签旧PG16结构**真实存在**`public.customer_wechat_identities`(`wechat_identity_id`,`customer_id`,`identity_scope`,`wechat_identity_key`,`first_seen_at`)与`public.customers`；原M94已定义`(identity_scope,wechat_identity_key)`唯一索引及指向Customer的FK。但**物理唯一键本身不证明真实微信客户端code有效、后端与微信官方通信验签、当前session持有权或可由客户自行冒充的`customer_id`不能越权**。不得把历史存在身份关系和真实受信登录混为一谈。
4. B从最新main开工作分支`feat/f05-3h-customer-wechat-actor-trust`，仅可新增`engineering/f05/customer-wechat-actor-trust/**`与唯一新专属`.github/workflows/f05-3h-customer-wechat-actor-trust.yml`。冻结所有已签代码/结构、旧000001～000019、旧50独立真实PG16 Job **全文逐个原样**、PDM Final/IA/Low-Fi/C前端/生产server；不得修改/重命名它们或接真实微信、JYT、资金、电话、图片/CDN。不得自行合并`main`。

## 二、工程任务和真实来源核验

**H1｜真实PG16当前身份来源目录与关系校验**
- 使用完整隔离真实PG16从受信M94一路迁移到原F05-3G v19的精确seal，核`customers`、`customer_wechat_identities`、FK、唯一索引、`identity_scope`语义是否存在已签可信来源、客户`active/inactive`、跨不同WeChat身份禁止任意合并的真实关系；仅使用独立CI最小合成测试行，禁止将真实微信openid/unionid/token以明文放日志/artifacts。核对仓库是否真实具备受信code-to-session服务器端校验、发给Customer的不可伪造持有凭据、登录撤销与客户account_status动态检查。
- 从真实源码辨别原F03 PC`IsolatedAuth`针对`Employee/SystemAdmin/4S`身份及权限，**绝不能把PC登录cookie、System Admin或Role scope转换成Customer本人会话**。若只有微信identity业务外键而缺可信Customer session/issuer，审计结论只能`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`。

**H2｜真信任链与Favorite授权的证据矩阵**
- 形成`WeChat官方服务端来源 → 当前有效code/session校验 → identity_scope/key → 当前唯一customer_id → active状态 → 目标Favorite Customer+Vehicle → 动作授权与CSRF/Origin/重试/撤销`逐边物理与源码证据；每条标`SIGNED_SOURCE`/`UNVERIFIED_SOURCE`/`SOURCE_GAP`，不臆造已有微信网络契约/生产密钥。明确“只有微信前端传来openid/身份key、URL/header/customerId、自称trusted=true”一律不是受信证明。
- 本批不得新建假Production Customer session表、放行合成PC Cookie的Customer bearer、硬编码openid或给Employee代签Favorite；没有真实服务端微信校验时，直接保持fail-closed，可只增加可信来源审计函数，不给消费者正向功能入口。
- 真实Favorite`000019`的CI-only合成`SYNTHETIC_CUSTOMER_CONTEXT_CI_ONLY`必须仍保持隔离；H批审计函数对已知Employee/4S/Admin/JYT Token伪冒、小程序code伪值、伪customerId与伪identity_scope键、重复Cookie、错误CSRF/Origin、已停用Customer、不同微信身份间交叉主张、隐藏车辆敏感字段均拒绝或作“不可信来源待确认”，不可导出微信key、内部价格、号码、凭据。
- 核真实Customer身份和Favorite object独立FK的`vehicle_id`同车关系、旧v19校验和event/current不可变因果，在审计路径不产生任何真实Customer Favorite ADD/REMOVE或HTTP200；旧Customer/Lock/Recommendation/周期查价/current关系不得有副作用。

**H3｜测试与证据门禁**
- 追加一个真实独立非特权PG16 source审计Job、一个独立非特权PG16回环HTTPS安全拒绝Job，保留本批前原**50个完整原生Job定义严格全文冻结**，最终**52/52 GitHub Actions成功**且B分支HEAD=PR HEAD=Actions run.head_sha，新的两份非空未过期原生Artifacts包括旧原生结构、当前实际catalog/PG16-only schema、source矩阵、sha256sums、新真实测试日志、旧新版本Seal链与中文交接；严禁删/弱化旧PG16回归或拿JS mock冒充真DB来源。
- 必须有两不同真实PG16 backend的原生身份映射/状态治理并发时序，证明当前Customer禁用与身份关系锁、持有者身份跨Customer不能通过；若当前真实微信session不存在，**不得人工模拟“已证明登录”正向成功**，用真PG16 FK/唯一性可正向，Customer authenticator保持未签`SOURCE_GAP`并HTTPS全部fail-closed。
- A最终只签源审计/隔离安全范围；`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`只有经过真实可信会话/服务端代码及权限证据才可从gap中解除。本包不能把真实微信服务接入、Customer线上收藏或DB最小运行Role授权默默纳入施工；若新证据足以确定安全实施方案，形成**下一任务建议**由A正式单独下发，不得B自行扩范围。
- 原F05-3D普通无Lock/活动Transaction的JYT批发车Owner`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`需用户业务裁决但不阻止此批独立身份审计。隐藏原因、实际图源双成功、新JYT车型/第三方和生产边界仍冻结，F05/F04生产/C-H01/V1基线`NOT_READY`。

## 三、施工交接与完成标准

B在本分支一次性完成代码、真实PG16/回环TLS正反例、自审安全、原生CI和新Artifacts、中文矩阵与交接；若只能证明来源不足，应明确`TRUST_SOURCE_AUDIT_COMPLETED_SOURCE_GAP / FAIL_CLOSED / CI_ONLY`，不能称已上线。最后在原PR评论记录最终B/PR/Actions一致SHA、52/52 jobs成功、旧50 job冻结核对、新两个原生Artifacts、完整中文交接并标`READY_FOR_A_REVIEW / NEXT_OWNER=A`，不得自行合并或启动后继批次。A独立验收后才能合并、更新主线五份SSOT与放行后续工作。
