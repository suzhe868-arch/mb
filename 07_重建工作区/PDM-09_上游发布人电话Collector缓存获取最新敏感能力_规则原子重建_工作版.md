# PDM-09｜上游发布人电话 / Collector / 缓存 / 获取最新 / 敏感能力｜规则原子重建工作版

> 日期：2026-10-04  
> 当前状态：`BATCH_1_COMPLETE_USER_CONFIRMED / BATCH_2_USER_REVIEW_PENDING`  
> 业务权威语言：中文（zh-CN）  
> 证据方法：9/19 C1、R11、R12 为主底盘；向前扫描 CR-007/CN11 电话原始证据；向后核对 9/22 冻结、IA V5、实际 Low-Fi、001～078。  
> 注意：旧聊天记忆只可作检索线索，不作为本文件裁决依据。

---

## 1. Batch 1｜稳定一致项

2026-10-04 用户明确“全部同意”，P09-A01～P09-A11 全部通过。

### P09-A01｜电话归属与身份键

上游电话是**上游发布人属性**，不是 Vehicle 自身固有属性。

- 车辆保存 `upstream_publisher_id`；
- 电话当前缓存以 `source_platform + upstream_publisher_id` 为身份键；
- 同一上游发布人的多台车辆共用该发布人的当前电话；
- 不按 Vehicle / `car_code` 建立各自独立当前电话事实。

状态：`USER_APPROVED`

### P09-A02｜客户侧与客户安全视图禁止展示

- 客户端永远不得展示上游发布人电话；
- 员工打开车辆详情时默认客户安全视图同样不得返回/展示该电话；
- 电话只允许进入受权限控制的员工内部敏感能力投影。

状态：`USER_APPROVED`

### P09-A03｜独立敏感能力

上游电话继续作为独立敏感能力控制。

员工必须同时满足：

1. 当前有效员工身份；
2. 当前车辆处于本人可访问的数据范围；
3. 当前具备上游电话敏感能力；

才可看到电话区域并执行查看、拨打、获取最新电话。

- 无电话权限：整个电话区域不显示；
- 进入内部模式本身不自动授予电话权限；
- 4S 身份本身也不自动授予电话权限。

状态：`USER_APPROVED`

### P09-A04｜唯一取号链

正式取号链：

> **名邦 Backend → Collector → JYT**

- 员工端 / 客户端不得直接访问 Collector 或 JYT；
- 名邦业务层不得绕过 Collector 直接调用 JYT 电话接口；
- JYT URL、Token、Header、`callCode` 等调用细节由 Collector 管理。

状态：`USER_APPROVED`

### P09-A05｜普通使用缓存优先

普通查看 / 拨打时：

- 若本地已有该 publisher 当前有效电话缓存，直接使用；
- 不得因为普通查看或已有缓存的拨打动作再次请求 Collector / JYT。

状态：`USER_APPROVED`

### P09-A06｜“获取最新电话”与普通拨打分离

“获取最新电话”是主动强制刷新动作，与普通拨打分离。

- 按当前 `upstream_publisher_id` 通过 Collector 强制刷新；
- 不使用普通缓存结果替代本次 latest；
- 成功后更新当前号码；
- 原有号码按历史规则保留；
- 刷新失败不得删除或覆盖已有有效缓存；
- 刷新失败时旧缓存只能标记为 cached，不能冒充 latest。

状态：`USER_APPROVED`

### P09-A07｜历史只用于历史 / 审计

`publisher_phone_history`：

- 用于历史号码及审计追溯；
- 不作为普通当前号码的权威取值源；
- 当前号码以 publisher 当前缓存事实为准。

状态：`USER_APPROVED`

### P09-A08｜并发边界

- 同一个 publisher 同时发生多个“获取最新电话”请求时，采用 single-flight（单航班合并）；
- 同一真实刷新结果可供并发请求共享；
- 不同 publisher 之间允许并发。

状态：`USER_APPROVED`

### P09-A09｜拨打方式与权限复用

合法取得当前电话后：

- “拨打”只调起手机系统拨号器；
- 由员工最终确认是否实际拨打；
- 不建设名邦后台代拨；
- 继续复用现有上游电话敏感能力；
- 不新增独立 `can_call_wholesale_phone` 权限。

状态：`USER_APPROVED`

### P09-A10｜电话高风险审计

至少对以下电话敏感行为形成可追溯审计：

- 查看；
- 获取最新电话；
- 拨打；
- 刷新成功 / 失败结果。

至少保留：

- 操作人；
- 操作时间；
- 结果；
- 必要业务对象 / publisher 关联事实。

前端隐藏不能替代服务端权限校验和审计。

状态：`USER_APPROVED`

### P09-A11｜名邦 P03 的 Collector 配置边界

名邦 P03 只管理 Mingbang → Collector 连接，包括：

- Collector Base URL；
- 相对 Phone Path；
- Collector 内部鉴权 Secret Reference / 状态；
- timeout；
- 连接测试；
- 当前连接状态。

明确禁止重新把以下内容带回名邦后台：

- JYT 电话 Token；
- JYT 电话 Header；
- JYT `callCode`；
- JYT 电话接口内部请求细节。

完整内部 Secret 不得普通回显；Collector 根 Host allowlist 由部署环境控制。

状态：`USER_APPROVED`

---

## 2. Batch 1 Gate

- Batch 1：`COMPLETE_USER_CONFIRMED`
- 已确认：P09-A01～P09-A11，共 11 条
- 用户裁决：2026-10-04 “全部同意”
- 未经用户审查，不得自动批准 Batch 2。

---

## 3. 已识别但明确留后续批次的问题

### 留 Batch 2｜明确废弃 / 替代

至少包括：

- 任何按 `car_code` 查询 / 缓存电话的旧契约；
- 名邦直接管理 JYT 电话凭证或直连 JYT 电话接口的旧架构；
- 为拨打另建独立 `can_call_wholesale_phone` 权限的旧方向；
- 与当前 cache-first / publisher-key 规则相冲突的旧电话读取口径。

### 留 Batch 4｜冲突 / 缺口

重点包括：

- **本地无缓存时点击“拨打”是否允许自动向 Collector 拉取一次电话**：9/19 C1 摘要“普通查看/拨打不调用上游”与 R10 / IA “cache miss fetch succeeds”存在真实文本冲突；
- 历史 `expires_at` 与普通缓存读取的关系是否仍保留；
- 采集入库阶段是否明确禁止批量预取电话；
- Collector 候选配置测试失败后的生效 / 回滚边界是否作为产品规则保留。

---

## 4. 当前下一步

> **PDM-09 / Batch 2｜明确废弃 / 明确替代 / DO_NOT_RESTORE｜USER_REVIEW_PENDING**

必须展示 Batch 2 全部候选并停止等待用户确认。


---

## 5. Batch 2｜明确废弃 / 明确替代 / DO_NOT_RESTORE｜待用户审查

### P09-B2-01｜禁止恢复 car_code / Vehicle 维度电话查询

拟进入最终基线：

> **任何以 `car_code`、单个 `vehicle_id` 或“每车一个电话缓存”为电话查询身份/缓存主键的旧契约均废弃，不得恢复。**

当前唯一稳定身份维度为：

> `source_platform + upstream_publisher_id`

`car_code` 仍可作为车辆来源标识使用，但不参与上游发布人电话查询身份。

证据结论：2026-09-16 CR-007 已明确 `car_code` phone lookup = superseded；R11/R12 后统一 publisher 维度。  
分类：`DEPRECATED_SUPERSEDED_DO_NOT_RESTORE`  
用户审查：`PENDING`

### P09-B2-02｜禁止恢复名邦直连 JYT / 名邦管理 JYT 电话凭证

拟进入最终基线：

> **废弃“名邦直接调用 JYT 电话接口、名邦后台保存/展示/轮换 JYT 电话 Token/Header/callCode、名邦配置 JYT 电话请求细节”的旧架构。**

正式边界固定为：

> Mingbang Backend → Collector → JYT

名邦只管理 Collector 连接与内部鉴权引用；JYT 电话凭证和调用细节只属于 Collector。

同时不得恢复已经删除的旧电话凭证管理入口/契约，包括但不限于：

- `POST /integrations/jyt/upstream-credential`
- `POST /admin/jyt/upstream-credential:test`
- 仅服务上述旧链路的 `CredentialRotateRequest`
- 仅服务上述旧链路的 `CredentialStatusDTO`
- 用 `jyt.integration.manage` 管理上游电话凭证

证据结论：CR007-013/014/061 与《电话旧契约清理完成报告》明确完成替代与删除。  
分类：`DEPRECATED_SUPERSEDED_DO_NOT_RESTORE`  
用户审查：`PENDING`

### P09-B2-03｜禁止新增独立拨打电话权限

拟进入最终基线：

> **有上游电话权限的员工，在自己有权访问的批发车源中，可以直接查看、获取最新电话并发起拨号；不再额外设置一个单独的“拨打电话权限”。**

取得合法号码后，“拨打”只调起手机系统拨号器，由员工最终确认是否拨出。

证据结论：CR-PD-006 明确决定“不新增 `can_call_wholesale_phone`”。  
分类：`DEPRECATED_SUPERSEDED_DO_NOT_RESTORE`  
用户审查：`PENDING`

### Batch 2 当前门禁

- 已确认：P09-B2-01～P09-B2-03
- 状态：`COMPLETE_USER_CONFIRMED`
- 本批不得混入：
  - cache miss 拨打是否自动取号；
  - `expires_at` 是否控制普通缓存读取；
  - 同步入库是否禁止批量预取电话；
  - Collector 候选配置测试失败后的生效边界。
- 上述问题继续留 Batch 4 / 后续证据裁决。


---

## 6. Batch 2 Gate

- P09-B2-01～P09-B2-03：`USER_APPROVED`
- Batch 2：`COMPLETE_USER_CONFIRMED`
- 用户裁决：2026-10-04 “明白了，全部同意”
- B2-03 最终采用人话口径：有上游电话权限且车辆在本人当前数据范围内，即可查看、获取最新电话和发起拨号；不再另拆一个“拨打电话权限”。
- 当前进入 Batch 3 证据筛选；未经用户审查不得自动进入 Batch 4。


---

## 7. Batch 3｜明确知情修改 / 后续明确新增｜待用户确认

### 证据复核结论

经 9/19 主底盘、9/20 IA ChangeLog、9/22 视觉冻结台账、IA V5、实际 Low-Fi、工程 Delta 与 001～078 交叉核对：

> **本批无新的未审业务规则原子。**

后续出现的以下内容均属于对既有规则的投影、补承载或失败态表达，不构成新的产品业务规则：

- E02-M01 电话统一投影；
- `PHONE_CACHE_AVAILABLE`；
- `PHONE_LATEST`；
- `PHONE_LATEST_FAILED_CACHE_AVAILABLE`；
- `PHONE_UNAVAILABLE`；
- P03-03 Collector 电话连接；
- P03-04 Collector 连接测试；
- P03-05 publisher 电话缓存；
- IA-20 “最新电话失败与缓存值分离、重试”。

上述内容均能回指 9/19 或更早已存在的业务语义：

- 普通查看缓存；
- latest 强制刷新；
- latest 失败保留旧缓存且不得冒充最新；
- 查看/拨打/刷新审计；
- Collector 边界；
- publisher 维度。

因此：

- 不把 UI/State/IA 补承载伪装成“后续新业务规则”；
- 不重复创建已在 Batch 1 / Batch 2 审过的原子；
- 真正文本冲突与历史缺口继续留 Batch 4。

### Batch 3 Gate

当前结论：

> `NO_NEW_UNREVIEWED_ATOMS`

状态：

> `USER_REVIEW_PENDING`

用户确认前不得进入 Batch 4。


---

## 8. Batch 3 Gate

- Batch 3：`COMPLETE_USER_CONFIRMED`
- 新增未审规则原子：0
- 用户裁决：2026-10-04 “batch3 同意”
- 后续 IA / Low-Fi 电话状态与页面继续作为既有业务规则的承载，不单独重复造产品规则原子。
- 允许进入 Batch 4。


---

## 9. Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择｜用户已确认

### P09-B4-01｜无缓存时点击“拨打”的取号行为

**最终收口：**

> 有缓存：直接使用当前 publisher 电话缓存并调起系统拨号器，不重新取号。  
> 无缓存：本次拨打针对当前 `upstream_publisher_id` 按需发起一次取号；Collector / 采集端负责向 JYT 获取电话，结果通过名邦既有 Integration API / 回传体系返回名邦；名邦写入 publisher 当前缓存后再调起系统拨号器。  
> 获取失败：不发起拨号，提示获取失败并允许重试。  
> “获取最新电话”仍然是独立主动强制刷新动作。

状态：`USER_APPROVED`

### P09-B4-02｜expires_at 是否阻断普通缓存使用

**最终收口：**

> `expires_at` / freshness 不作为普通查看 / 拨打的硬失效门槛。  
> 只要当前 publisher 缓存仍存在有效号码，普通查看 / 拨打可继续使用；可显示最近获取时间 / 新鲜度。  
> 不得仅因时间到期自动删除已有号码、阻断普通查看 / 拨打，或强制重新取号。  
> 需要确认最新号码时，由具备权限的员工主动执行“获取最新电话”。

状态：`USER_APPROVED`

### P09-B4-03｜车源同步阶段是否批量预取电话

**最终收口：**

> JYT 车源采集、更新、改价、下架、重新上架流程均不批量预取上游发布人电话。  
> 电话继续按需获取：已有缓存直接使用；无缓存且实际需要电话时按需取一次；主动“获取最新电话”时按既定 latest 规则强制刷新。

状态：`USER_APPROVED`

### P09-B4-04｜Collector 新配置测试失败时如何生效

**最终处理：撤回。**

> 原问题依赖“名邦 P03 配置 Collector Base URL / Phone Path”的旧前提。  
> 当前正式架构中该前提不存在。采集端连接名邦 API 的保存 / 测试 / 回滚属于 Collector / Engineering 配置安全，不再作为 PDM-09 名邦产品规则。

状态：`USER_APPROVED_WITHDRAWN`

### P09-B4-05｜P03-05 publisher 电话缓存页面真实承载内容

**最终收口：**

P03-05 作为电话缓存的**管理 / 诊断页**，至少承载：

- `upstream_publisher_id`；
- 当前电话；
- 当前联系人（上游有返回时）；
- 最近获取时间；
- 当前号码状态 / 新鲜度；
- 历史号码；
- 最近获取 / 刷新结果；
- 必要的异常、日志与审计入口。

权限与动作：

- 明文电话继续受上游电话敏感能力控制；
- 具备相应后台电话敏感能力且数据范围允许的管理员，可从 publisher 记录执行“获取最新电话”；
- latest 成功 / 失败继续服从 P09-A06 / A04-R1 的缓存与回传规则；
- 本页面不再提供 Collector Base URL / Phone Path 等旧连接配置；
- 本页面不是普通销售日常拨号入口。

状态：`USER_APPROVED`

### P09-B4-06｜上游电话是否提供复制动作

**最终收口：**

> V1 上游发布人电话允许查看、获取最新和发起系统拨号，但不提供专门的“一键复制 / 长按复制电话”动作。  
> 后续若销售业务确有需要，应作为新的明确产品决定增加，不从普通文本复制能力中自然获得。

状态：`USER_APPROVED`

### Batch 4 Gate

用户明确“全部同意”。

- P09-B4-01：`USER_APPROVED`
- P09-B4-02：`USER_APPROVED`
- P09-B4-03：`USER_APPROVED`
- P09-B4-04：`USER_APPROVED_WITHDRAWN`
- P09-B4-05：`USER_APPROVED`
- P09-B4-06：`USER_APPROVED`
- Batch 4：`COMPLETE_USER_CONFIRMED`

下一步：

> **执行 PDM-09 全量 Decision Coverage / 未映射检查，确认 SOURCE_DECISION_COVERAGE 与 UNMAPPED 后，再生成最终完整规则总览。**

未经最终总览用户批准，不得把 PDM-09 标记 COMPLETE，不得进入 PDM-10。

---

## 10. CURRENT IMPLEMENTATION FACT｜电话 API 架构复核｜2026-10-04

> 本节按 2026-10-04 新增“当前已实现 / 已测试事实优先识别”方法建立。  
> 本节用于确认当前现实和识别旧实现污染，不直接绕过用户裁决。

### 10.1 当前已验证事实

1. 名邦 Backend 是名邦 Integration API 的提供方 / 接收方；
2. Collector 侧配置并调用名邦 API，把采集到的车辆业务事件可靠回传名邦；
3. 当前采集后台已存在名邦 API 配置中心 / Outbox 可靠投递能力；
4. 采集端负责 JYT Token、JYT URL、Header、callCode / 电话上游适配；
5. 电话结果由采集端获取后返回 / 同步给名邦；
6. 用户再次明确当前最终架构：**名邦后台生成 / 提供 API；采集端通过这套名邦 API 与车源信息同一回传体系把电话结果回传名邦**；
7. 名邦不需要为电话再配置一个可编辑的“Collector Base URL / Phone Path”业务入口；
8. 旧文档 / 旧实现中出现的独立 `POST /integrations/jyt/phone`（Mingbang → Collector）属于历史中间方案 / 实现残留，不得再自动作为现行产品业务方向。

### 10.2 当前三问

- **谁提供 API？** 名邦 Backend 提供名邦 Integration API。
- **谁调用 API？** Collector / 采集端作为名邦数据回传调用方。
- **数据往哪边流？** JYT → Collector → 名邦；车辆事实和电话获取结果均最终进入名邦。

业务上“需要获取哪个发布人电话”的目标仍由名邦业务上下文产生，使用 `upstream_publisher_id` / publisher 身份；具体任务下发 / 调度实现属于 Engineering，不在产品层凭空新增第二套可编辑 URL。

### 10.3 当前实现与历史污染

检测到历史材料仍混有两套方案：

- 当前保留主通道：Collector → Mingbang Integration API；
- 旧中间电话反向通道：Mingbang → Collector Phone API。

后者不得因旧 V7/V9 文档仍存在就自动恢复为产品规则。

状态：`CURRENT_IMPLEMENTATION_FACT_ESTABLISHED / PRODUCT_REVALIDATION_REQUIRED`

---

## 11. 已确认 Atom 回开复核｜待用户确认

### P09-A04-R1｜唯一上游取号责任与数据回传链｜修订候选

原 P09-A04 中“JYT 只能经 Collector、客户端不得直连、JYT 调用细节归 Collector”继续成立。

需要修正的是原来的网络方向表述：

> ~~名邦 Backend → Collector → JYT~~

修订为：

> **名邦业务上下文确定目标 `upstream_publisher_id`；Collector / 采集端负责调用 JYT 获取该发布人的电话；结果通过名邦 Backend 已提供的 Integration API / 既有数据回传体系返回名邦。**

同时：

- 员工端 / 客户端不得直接访问 JYT；
- 名邦不保存 / 管理 JYT 电话 Token、Header、callCode 等；
- 电话结果进入名邦 publisher 电话缓存 / 历史；
- 不为电话另造一套普通产品后台可编辑的 Collector URL。

状态：`USER_APPROVED_SUPERSEDES_P09_A04`

### P09-A11-R1｜P03 / API 配置边界｜修订候选

撤销原 A11 中以下当前产品表述：

- Collector Base URL；
- relative Phone Path；
- Mingbang → Collector 电话连接配置；
- Collector 根 Host allowlist 作为 P03 电话业务配置。

修订为：

> **名邦 Backend 提供 / 管理自身 Integration API 与鉴权；Collector / 采集端配置名邦 API 的连接信息并负责向名邦可靠回传。P03 名邦侧只承载集成状态、接收结果、电话缓存 / 历史、调用 / 异常诊断与必要审计，不提供普通管理员修改 Collector 电话 URL / Path 的产品能力。**

仍然保持：

- JYT Token / URL / Header / callCode 只属于采集端；
- Secret 不明文回显；
- 真实连接参数与部署细节由 Engineering / 采集端配置体系承接。

状态：`USER_APPROVED_SUPERSEDES_P09_A11`

### P09-B4-04-R1｜原候选撤回

原 B4-04：

> “Collector 新配置测试失败时如何生效”

其前提依赖“名邦 P03 可编辑 Collector Base URL / Phone Path”，与当前确认架构不一致。

处理候选：

> **撤回原 P09-B4-04，不再作为产品业务问题。**

若采集端修改“名邦 API Base URL / Path / Secret”时需要候选配置、测试、回滚，这是 Collector / Engineering 配置安全策略，不再在 PDM-09 中创造名邦产品规则。

状态：`USER_APPROVED_WITHDRAWN`

### 本轮门禁

本轮只复核：

- P09-A04-R1
- P09-A11-R1
- P09-B4-04-R1

用户确认前：

- 原 A04 / A11 不静默改写；
- 原 B4-04 不静默删除；
- Batch 4 其余 B4-01 / 02 / 03 / 05 / 06 暂停不动。


---

## 12. API 架构回开复核 Gate｜2026-10-04

用户明确“同意”，正式确认：

### P09-A04-R1｜USER_APPROVED
- 名邦业务上下文确定目标 `upstream_publisher_id`；
- Collector / 采集端负责调用 JYT 获取发布人电话；
- 电话结果通过名邦 Backend 已提供的 Integration API / 既有回传体系返回名邦；
- 名邦再更新 publisher 电话当前缓存 / 历史；
- 员工端 / 客户端不直连 JYT；
- JYT Token / URL / Header / callCode 继续只归采集端管理。

原 P09-A04 中“名邦 Backend → Collector → JYT”作为网络方向表达被本条替代。

### P09-A11-R1｜USER_APPROVED
- 名邦 Backend 提供 / 管理自身 Integration API 与鉴权；
- Collector / 采集端配置名邦 API 连接信息并负责可靠回传；
- 名邦 P03 不再提供 Collector Base URL / Phone Path 的普通产品配置入口；
- P03 仅承载集成状态、接收结果、电话缓存 / 历史、异常诊断、日志与审计；
- JYT 侧真实调用参数仍只属于采集端 / Engineering。

原 P09-A11 被本条替代。

### P09-B4-04-R1｜USER_APPROVED_WITHDRAWN
原“Collector 新配置测试失败时如何生效”不再作为 PDM-09 名邦产品规则。

原因：
- 其前提依赖“名邦 P03 配置 Collector URL / Phone Path”；
- 当前正式架构中该前提不存在；
- 采集端如何保存 / 测试 / 回滚名邦 API 连接参数属于 Collector / Engineering 配置安全。

### 对 P09-B2-02 的一致性说明
P09-B2-02 已批准的核心 DO_NOT_RESTORE 仍有效：

- 名邦不得直连 JYT 电话接口；
- 名邦不得保存 / 展示 / 轮换 JYT 电话 Token/Header/callCode；
- JYT 电话调用细节不得回到名邦后台。

但其中旧的“正式链固定 Mingbang Backend → Collector → JYT”网络方向表述，已被 P09-A04-R1 的现行 Integration API / 回传架构替代。该处理属于同一已确认架构的文字一致性收口，不恢复旧反向 Phone API。

### 当前 Batch 4
剩余待审：

- P09-B4-01
- P09-B4-02
- P09-B4-03
- P09-B4-05
- P09-B4-06

P09-B4-04 已撤回，不再计入待审项。
