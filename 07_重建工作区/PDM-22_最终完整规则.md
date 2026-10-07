# PDM-22｜最终完整规则

> 域：PC 后台信息架构 / 业务管理 / 配置归属 / 上游运行管理  
> 当前状态：`COMPLETE / INTEGRITY_PASS`  
> Final 前完整性复核：`R2 PASS / FINAL_CANDIDATE_READY`  
> 正式规则 / 用户裁决单元：`58`

## 1. 核心定位

PDM-22 是：

> **名邦 PC 后台业务管理承载、业务配置承载、采集系统 / Integration API 接入及上游运行管理的唯一 Authority。**

PDM-22 负责把 PDM-01～21 已冻结的业务真相落实为：

- PC 业务管理入口；
- 配置入口；
- 运行状态与诊断；
- 必要历史查看；
- Employee / System Admin 的 PC 身份与 credential 承载。

PDM-22 不重新定义 Customer、Employee、Vehicle、Price、Demand、Matching、Priority、Recommendation、Consultation、CRM、Public Pool、Lock、Transaction 等底层业务 Authority。

## 2. PC 身份与登录

PC 后台不是 System Admin 专属。

### Employee

- 继续使用唯一稳定 `employee_id`；
- 如需使用 PC，在同一 employee_id 上增加独立 PC 登录凭证；
- V1 使用“登录账号 + 密码”；
- 登录账号全局唯一；
- 不强制手机号或 employee_id 作为账号；
- 初始密码由后台设置 / 重置；
- 首次成功登录必须修改密码；
- Employee 可修改自己的 PC 密码；
- 开通 / 禁用 / 重置归 P04 Employee account governance；
- PC 登录不会新建第二 Employee，也不会增加 role / permission / data scope；
- Employee inactive 后 PC 登录及旧登录态立即失效。

### System Admin

- 使用 P05 独立 system identity + 独立 credential；
- 不属于销售 / 经理 / 店长 / 4S 角色树；
- 同一真人如同时拥有 Employee 与 System Admin，仍是两套身份；
- System Admin 不因登录 PC 自动获得 CRM、车辆、价格、Lock、Transaction 等 Employee 业务权；
- 首个 System Admin 由 bootstrap 建立；
- 后续只能由 active System Admin 治理；
- 系统始终至少保留 1 个 active System Admin；
- 不允许停用最后一个 active System Admin。

### 4S

- 4S 默认不进入名邦 PC 业务后台；
- 只有明确授予 PC 车辆管理能力时才开放对应登录；
- 只开放其合法 4S 车辆裁剪范围；
- 4S hard DENY 不得被任何后台配置绕过。

## 3. 全局 PC 权限原则

所有 PC mutation 提交时必须重新校验：

> current identity + permission/capability + data scope + object/config state

页面能打开、按钮曾显示、旧登录态仍存在，都不得绕过提交时重验。

重要配置修改不得追改已固化历史，例如：

- Lock expires_at；
- Consultation first-response deadline；
- Priority expires_at；
- Transaction / Lock / Price 历史快照。

## 4. P01 Dashboard

Dashboard 保持轻量，只做聚合与跳转。

可聚合：

- 在售车源 / 今日新增；
- Consultation 待处理；
- Application / Demand；
- Lock / Waitlist；
- Transaction / Refund；
- 供应 / Integration 异常；
- 关键人工待办。

Dashboard：

- 不建设第二套 BI / 状态机；
- 卡片、数量、异常必须按当前 permission + data scope 计算；
- 不得通过总数或卡片泄露全局敏感数据；
- 点击后仍服从对应业务 Guard。

## 5. P02 Vehicle / Model / Hidden Rule

### Vehicle

- Draft 与 Formal Vehicle 分层；
- Draft 可按 PDM-06 删除；
- Formal Vehicle 不提供通用物理 Delete；
- hidden / offline / sold / source_type / listing_cycle 继续消费 PDM-04 Authority；
- 有合法车辆管理能力的 Employee 可在 scope / object state 合法时修改 source_type；
- 不恢复 source_type 专属高权限纠错 permission。

### Model

System Admin 控制平面承载：

- 本地车型主数据；
- JYT mapping；
- MODEL_MISSING；
- mapping conflict；
- merge / 质量治理。

JYT 已知车型事实不得因 mapping pending 被降为 unknown 或阻断合法搜索 / Matching。

### 自动 / 批量隐藏

P02 建立独立“隐藏规则”子页面：

- 默认可用于 wholesale / JYT，并按已批准范围选择来源；
- 品牌 / 车系 / 年款 / 车型 / 地区 / 关键词；
- 不同字段 AND；
- 同字段多值 OR；
- 规则新增 / 编辑 / 启停；
- source_type / 条件变化后重新计算；
- hidden 与 offline / unavailable 分离；
- hidden 但真实可售仍可进入合法内部 Matching / Recommendation；
- 单车详情只展示当前命中结果，不在单车页编辑整套规则。

## 6. P03 Integration / Publisher Phone

### 车源同步

固定三个业务 API：

1. 新增 / 更新车源；
2. 批量确认下架；
3. 获取当前名邦仍在售批发车源。

P03 承载：

- 独立启停；
- 名邦车源同步 credential；
- 调用统计；
- 运行状态；
- 成功 / 失败及必要处理数量。

### Credential 隔离

名邦车源同步 credential 不等于：

- JYT 登录 Token；
- JYT 电话 Token；
- Collector 电话鉴权；
- JYT Header / callCode。

JYT / Collector 内部调用参数属于 Collector / Engineering，不在名邦 PC 暴露为业务配置。

### 电话链路

固定为：

> 名邦确定 publisher → Collector 向上游取号 → 经名邦既有 Integration API / 回传体系返回 → 名邦更新 cache

不得恢复：

- Mingbang → Collector Phone API；
- Collector Base URL；
- Phone Path；
- “保存 / 测试 Collector 电话连接”。

publisher cache / 诊断统一按：

> `source_platform + upstream_publisher_id`

定位。

Integration 管理权不自动授电话明文查看 / latest / 拨打权限。

当前日常电话入口只属于当前 wholesale / JYT 车源；转名邦 / 4S 后保留历史 publisher/cache，但当前详情不再展示、刷新或拨打原上游电话。

P03 下分两个子页面：

1. 车源同步 / Integration API；
2. Publisher / 电话诊断。

## 7. P04 Employee / Permission / Scope

P04 PC 控制面承载：

- 员工账号；
- 角色模板；
- permission；
- 个人 allow / deny；
- data scope；
- 接客资格 / 状态治理；
- 调店 / 离职交接；
- Employee PC credential 开通 / 禁用 / 重置。

角色模板、个人覆盖、hard DENY、data scope、object state 共同决定最终能力。

配置权不等于业务执行权。

## 8. P05 System Admin

P05 承载：

- System Admin 账号治理；
- System Admin bootstrap / active 约束；
- System Admin 自身 credential；
- 车型主数据 / mapping 控制平面；
- 其他明确的系统治理能力。

System Admin 不自动成为 Employee business actor。

## 9. P06 Customer / Find-car / Matching / CRM / Public Pool

### Customer Level

同一等级体系承载多个独立 entitlement：

- find-car entitlement；
- 批发价格 LIMITED / UNLIMITED；
- daily base quota 等价格权益。

V1 不提供单 Customer find-car override。

等级支持：

- 新增；
- 改名；
- 排序；
- 启用 / 停用；
- 历史保留。

### Application / Demand

统一放 P06「客户 / 找车管理」：

- Application 子视图；
- Demand 子视图；
- Customer Detail 与二者双向跳转。

不单独再造新的一级“找车后台”。

### Rule Dictionary

真实支持：

- 新增；
- 编辑；
- 启用 / 停用；
- scope；
- 测试解析；
- 必要历史；
- PROCESSING / PARTIAL_FAILURE / ERROR；
- 失败集合 retry。

正式写动作受 matching.rule.manage 控制；4S hard DENY；System Admin 身份本身不自动获得。

### Priority qualification / TTL

qualification：

- 只允许单 Customer 开 / 关；
- V1 禁止批量；
- 不与 Customer Level find-car entitlement 合并；
- 普通 owner 不自动获得开启资格；
- 保存时重验 identity + permission/capability + data scope + object/account state；
- 记录 before / after / actor / time；
- 默认不强制 reason。

PC 不得：

- 人工创建 Priority；
- 人工续期；
- 恢复 ended Priority；
- override 单笔 Priority；
- 手改 expires_at。

默认 TTL：

> 24h / 86400s

只影响后续新 Priority，不追改既有实例。

### Consultation

P06 承载 Consultation PC 管理与首次人工响应 SLA 配置：

- 默认 15 分钟；
- 新对象创建时固化 deadline；
- 后改配置不追改旧对象；
- timeout 只是派生标记 / 筛选 / 提醒，不是第五主状态。

### CRM Stage / Customer Tag

使用公司级受控字典：

- 新增；
- 改名；
- 排序；
- 启用 / 停用；
- 历史保留。

不得恢复任意 Customer Opportunity 通用规则引擎。

### 公海

V1 采用后台指定分配 / 人工治理为主，主动领取保留但弱化。

配置只承载 PDM-17 已批准参数：

- 近期真实 Customer 主动活跃时间参数；
- 最后一次真实 CRM Follow-up 阈值；
- 继续当前 owner 后重新检查周期；
- 主动领取数量上限；
- 主动领取频率限制；
- 领取后首次跟进提醒时间。

不得：

- 恢复固定 30 天未跟进；
- 自动进公海；
- 自动收回 Customer；
- 自动改 owner；
- 建设任意 public-pool rule engine。

批量治理直接在 P06 公海 / 待公海页面进入批量处理模式，逐 Customer 重验并允许部分成功。

## 10. Customer 账号停用 / 恢复

PC 必须真实承载 Customer 账号停用 / 恢复。

- System Admin 可作为控制平面治理动作执行；
- 经理 / 店长 / 被授权 Employee 按 capability + scope 执行；
- 4S hard DENY；
- 停用不删除 Customer，不等于降级；
- active Demand → paused；
- 其他进行中业务按各自 Authority 停止继续按正常账号推进；
- 已发生历史事实保留；
- 恢复账号只恢复账号可用性，不自动恢复暂停 / 终止 / 过期业务。

## 11. P07 Lock / Waitlist / Transaction / Fund

### Lock

- 默认正式 Lock 时长当前 72h，可配置；
- 新 Lock 创建时固化 expires_at；
- 后改默认值不追改旧 Lock。

竞争申请：

- 一笔成功形成正式 Lock 后；
- 其他仍有效 PENDING 自动转 Waitlist；
- 顺序沿用原 LockRequest.created_at；
- 自动候补不等于自动取得 Lock；
- 原 Lock 结束后 Waitlist 不自动晋升。

普通 Lock 与 Priority-origin Lock 可见性分离：

- 普通 VIP / 粉丝 Lock 不自动全站隐藏；
- Priority-origin Lock 在有效期内继承 Priority 的排他 visibility；
- Lock 结束后按当前真实 Vehicle / Recommendation / Priority / visibility 重算。

### Lock 到期提醒

P07 提供业务配置：

- 是否启用即将到期提醒；
- 提前量。

不得写死提前 30 分钟。

该配置不改变 Lock.expires_at，也不制造新的 Lock 主状态。

P22 只承载业务配置值；通知渠道、飞书、DND、频控、去重、失败日志交 PDM-23。

### Transaction / Deposit / Refund

P07 承载真实：

- Deposit；
- Transaction；
- Refund；
- correction；
- responsible；
- 当前状态；
- 必要业务历史 / 时间线。

Refund 主状态：

- pending；
- refunded；
- closed。

pending 确定不再退款：

- 当前合法处理人可直接 closed；
- 必填 close reason；
- 不新增 close permission；
- 不增加二级审批；
- closed ≠ refunded。

actual deal price / completed Transaction 属于历史主事实，后续价格、markup、source_type 不得回写。

correction 使用追加事实，不覆盖原 completed / Deposit / Refund 历史。

## 12. P08 Price / Entitlement / Quota

### JYT markup

P08 明确配置：

- markup ON / OFF；
- 阶梯加价规则。

阶梯规则采用：

> 草稿 / 未生效版本 → 校验 → 正式启用

启用前必须：

- 区间不重叠；
- 声明范围无空档；
- 任一适用 base_wholesale_price 唯一命中。

校验失败 / 保存失败不得替换当前有效版本。

新版本启用后旧版本退出 current，但保留历史。

markup OFF：

> 回 upstream_list_price

不得暴露 upstream_wholesale_price / base_wholesale_price。

### Customer display override

JYT、名邦、4S 均支持 customer display override 数据能力。

操作：

- 读取独立 override permission；
- 读取 data scope / object state；
- 4S 成员 hard DENY。

### 正常价格编辑

名邦 / 4S customer_list_price、internal_wholesale_price 属于普通 Vehicle 编辑。

不恢复：

- 独立“调价 action”；
- 独立“调价 permission”。

修改 internal_wholesale_price 仍需要内部价查看独立 permission。

### LIMITED / UNLIMITED

P08 / Customer Level 统一承载：

- LIMITED；
- UNLIMITED；
- daily base quota。

LIMITED Customer 可由有权限 Employee 免费增加当天查价次数：

- 同日可多次累计；
- UTC+8 次日清零；
- UNLIMITED 当前生效期间不允许新增临时加次；
- 已有合法加次事实不因进入 UNLIMITED 被删除；
- V1 不建设购买查价次数 / 按次收费。

## 13. 基础资源与客户端轻量配置

PDM-22 可承载：

- 名邦公开图片域名；
- JYT Origin；
- report 域名；
- 对象存储源站；
- 全局单一“服务 / 购买说明”；
- 普通分享标题模板；
- 默认分享图；
- Customer Safe 字段白名单；
- 已批准首页 / 品牌分享基础配置。

“服务 / 购买说明”：

- 全局只维护一份；
- 支持基础富文本；
- 支持 Word 基础格式兼容；
- 保存前 sanitize；
- 内容为空时客户端整块隐藏；
- 不按车辆 / source_type / 门店再造多份；
- 不扩成万能模板引擎。

## 14. 配置统一原则

1. 配置必须回到所属业务模块，不建设大杂烩配置中心；
2. mutation 提交时重新校验；
3. 已固化历史对象不因默认配置变化被追改；
4. 重要配置至少记录 before / after / actor / time；
5. 默认不要求所有配置变更填写 reason；
6. 具体业务 Authority 要求 reason 时按其规则执行；
7. 统一配置版本 / 历史 / 时区 /审计检索由 PDM-25 承接。

## 15. 明确不得恢复

不得恢复：

1. PC 业务后台 = System Admin 专属；
2. System Admin 自动获得 Employee 业务权；
3. Employee PC 登录创建第二 Employee；
4. 手机号强制作为 PC 登录账号；
5. 内部价无需独立 permission；
6. 独立 Recommendation qualification；
7. Priority qualification 批量开关；
8. 人工创建 / 续期 / override Priority；
9. Refund 只有 pending / refunded 两状态；
10. car_code / vehicle_id 作为 publisher phone 唯一身份；
11. Mingbang 主动调用 Collector Phone API；
12. 名邦 PC 管理全部 JYT / Collector credential；
13. mapping pending 把 JYT 已知车型降为 unknown；
14. Formal Vehicle 通用物理 Delete；
15. source_type 正式发布后冻结或经理 / 店长专属修改；
16. 固定 30 天未跟进自动进公海；
17. 固定提前 30 分钟 Lock 到期提醒；
18. 万能配置中心；
19. 任意 Customer Opportunity / public-pool rule engine；
20. 通知成功 / 失败反写业务状态；
21. 4S 绕过 hard DENY。

## 16. Handoff 状态

### Incoming

target=PDM-22：

> **18 / 18 = HANDOFF_CLOSED / source_backwrite=YES**

用户已最终批准并确认执行；18 条 incoming handoff 已正式关闭并完成 source backwrite。

### Outgoing

已登记：

- HO-P22-P23-001｜`HANDOFF_CLOSED / source_backwrite=YES`：通知相关业务配置值与 PDM-23 carrier 边界已由 `07_重建工作区/PDM-23_最终完整规则.md` 正式承接；
- HO-P22-P25-001｜HANDOFF_OPEN。

## 17. Final 前完整性结果

R2：

- SOURCE_TO_ATOM = PASS；
- ATOM_TO_SOURCE = PASS；
- SEMANTIC_COMPLETENESS = PASS；
- MISSING_RULE_UNRESOLVED = 0；
- SEMANTIC_DETAIL_GAP_UNRESOLVED = 0；
- COMPLETED_PDM_INVARIANT_CONFLICT = 0；
- INCOMING_HANDOFF_GAP = 0；
- OUTGOING_HANDOFF_GAP = 0；
- NEGATIVE_CLAIMS_VERIFIED = PASS；
- LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0；
- PDM22_FORMAL_UNITS = 58；
- PDM22_FINAL_CANDIDATE_READY = YES。

## 18. Final Closeout

用户已最终批准并确认执行。

- 正式 Authority：`07_重建工作区/PDM-22_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-22_最终完整性复核_2026-10-07.md / PASS`；
- 58 个正式规则 / 用户裁决单元全部进入 Final；
- 18 / 18 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P21-P23-001 已 `HANDOFF_CLOSED / source_backwrite=YES`；HO-P21-P25-001 继续 `HANDOFF_OPEN`；
- PDM-22：`COMPLETE / INTEGRITY_PASS`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：`PDM-23 Startup Gate`。


> 2026-10-07 Source Backwrite｜HO-P22-P25-001：`HANDOFF_CLOSED / source_backwrite=YES`。PDM-25 已由 `07_重建工作区/PDM-25_最终完整规则.md` 正式承接本域移交的审计 / 历史 / 时区 / 配置版本 / 横切完整性语义；PDM-25 不反向改写本 PDM 已冻结的业务状态机与产品规则。
