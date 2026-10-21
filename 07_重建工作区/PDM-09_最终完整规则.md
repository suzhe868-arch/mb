# PDM-09｜上游发布人电话 / Collector / 缓存 / 获取最新 / 敏感能力｜最终完整规则

> 日期：2026-10-04  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> Coverage：`SOURCE_DECISION_COVERAGE = 100%`  
> Final→Source：`100%`  
> Unmapped：`0`  
> 2026-10-05 完成 Legacy Final Integrity Audit；用户新增裁决 3A：上游电话入口只属于当前批发 source_type。2026-10-22 用户显式批准“按员工单独授权 + 两种上游电话访问范围”，详见第 2 节；该裁决不代表真实 Collector/JYT 来源或物理权限接线已完成。

---

## 1. 电话归属与身份

1. 上游电话属于**上游发布人**，不是 Vehicle 自身固有属性。
2. Vehicle 保存 `upstream_publisher_id`。
3. 当前电话缓存统一按：
   > `source_platform + upstream_publisher_id`
   管理。
4. 同一 publisher 的多台车辆共享该 publisher 的当前电话事实。
5. `car_code`、单 `vehicle_id` 不作为电话查询 / 缓存身份。

---

## 2. 展示与敏感权限

1. 客户端永远不得展示上游发布人电话。
2. 员工默认客户安全视图也不得返回 / 展示该电话。
3. 上游电话是独立敏感能力。
4. 员工必须同时满足：
   - active 有效员工身份；
   - 当前 Vehicle 的 `source_type = wholesale / JYT 批发`；
   - 当前车辆命中该员工针对 `publisher.phone.sensitive` 配置的上游电话专项访问范围；该专项范围按本节第 10–15 条判定，不扩大通用车辆经营 data scope；
   - 具备上游电话敏感能力；
   才能查看电话区域、获取最新电话、拨号。
5. 无电话权限时整个电话区域不显示。
6. Internal Mode 本身不授予电话权限。
7. 4S 身份本身不自动获得电话权限。
8. **3A｜source_type 电话入口裁剪**：上游电话是“当前批发车源”的日常敏感业务能力；同一 Vehicle 完成批发 → 名邦转换后，即使仍保留历史 `upstream_publisher_id`，车辆详情也不再展示、刷新或拨打原上游发布人电话；当前为 4S 来源同样不得因历史 publisher 事实自动出现电话入口。
9. 3A 只关闭当前车辆详情的日常业务入口，不删除 publisher 来源事实、当前缓存、history 或既有审计；P03-05 在合法诊断/历史场景仍可保留 publisher 记录。
10. **后台配置位置与授权方式**：在 PC 后台「员工管理 → 员工详情 → 权限设置」中，对单个员工独立配置既有 `publisher.phone.sensitive` 能力，并为该能力选择且仅选择一种访问范围。配置人必须服从 PDM-02 现有员工权限治理权限及 data scope，不因本项规则向经理、店长或其他角色新增配置权。
11. **范围模式一 `LOCKED_ONLY`｜仅当前有效锁定车辆可联系**：员工已被单独授予 `publisher.phone.sensitive` 且当前车辆存在有效、未过期、未取消的正式 Lock 状态时，才允许查看/获取该车上游电话。仅 LockRequest 申请中、被拒绝、已取消或已过期均不满足。批发车不需要逐车指定员工负责人；本模式依据现有车辆 Lock 状态判定，不引入单车 owner。
12. **范围模式二 `ALL_ACTIVE_JYT`｜全部当前在售 JYT 批发车可联系**：员工已被单独授予 `publisher.phone.sensitive` 后，可查看/获取所有符合现有车源状态规则、当前仍在售的 JYT/wholesale 车辆上游电话，无须先有 Lock 或 Transaction，也不要求逐车指定负责人。已转为名邦/4S 来源或已下架的车辆不符合本模式。
13. 两种模式是该敏感能力的**专项访问范围**，是 PDM-02「permission + data scope + object state」模型在上游电话动作上的具体配置；它们不改变员工通用车辆经营 data scope，也不授予车辆编辑、转名邦、下架/隐藏、锁车审批、Transaction、价格或资金权限。不得新增独立的 `can_call_wholesale_phone` 权限。
14. 未开通 `publisher.phone.sensitive`、员工非 active、存在个人 deny/hard DENY、车辆当前 source/state 不符合条件，或当前专项范围不满足时，必须拒绝电话读取、获取最新电话和拨号；无权限时整个电话区域不显示。
15. 后台授予/撤销该能力或变更范围模式必须依 PDM-02 留存审计；每次敏感读取、取号和拨号均按当时最新的员工状态、permission/deny、当前车辆 source/state、当前 Lock 状态及专项范围重新校验。撤权或锁定到期后，旧页面/缓存不得继续允许后续操作。

---

## 3. 当前正式取号与回传架构

1. 名邦业务上下文确定需要获取哪个 `upstream_publisher_id` 的电话。
2. Collector / 采集端负责调用 JYT 获取该发布人的电话。
3. 电话获取结果通过**名邦 Backend 已提供的 Integration API / 既有数据回传体系**返回名邦。
4. 名邦收到结果后更新 publisher 当前电话缓存，并按规则保留历史。
5. 员工端 / 客户端不得直接访问 JYT。
6. 名邦不得直接管理或持有 JYT 电话调用细节，包括：
   - JYT 电话 Token；
   - Header；
   - `callCode`；
   - JYT 电话接口内部请求参数。
7. JYT 电话调用细节只属于 Collector / 采集端。
8. 旧“名邦直接调用 Collector Phone API”网络方向不再作为当前产品架构。

> 具体“取号任务如何交给 Collector”属于 Engineering，不在产品层另造第二套可编辑 Collector URL / Phone Path。

---

## 4. 普通查看与缓存优先

普通查看 / 拨打：

1. 若已有当前 publisher 电话缓存，直接使用。
2. 有缓存时不得因普通查看或普通拨号再次向上游取号。
3. `expires_at` / freshness 只表达号码新鲜度，不作为普通查看 / 拨打的硬失效门槛。
4. 只要缓存仍存在有效号码，即使 freshness 到期也可继续使用。
5. 可以展示最近获取时间 / 新鲜度状态。
6. 不得仅因 freshness 到期自动删除号码、阻断查看 / 拨打或强制取号。

---

## 5. 无缓存时首次按需取号

员工点击“拨打”但当前 publisher 没有电话缓存时：

1. 针对当前 `upstream_publisher_id` 发起一次按需取号需求；
2. Collector / 采集端向 JYT 获取；
3. 成功结果经名邦既有 Integration API / 回传体系返回；
4. **只有返回合法、非空、可作为电话号码使用的有效号码时，才写入 / 更新 publisher 当前缓存；**
5. 若本次请求成功返回但无有效号码、空值或明显非法号码：不得写空覆盖；若存在旧有效缓存则保留旧缓存并记录本次未取得有效新号码，若不存在旧缓存则进入 `PHONE_UNAVAILABLE`；
6. 只有取得有效号码后才调起手机系统拨号器；
7. 获取失败或未取得有效号码均不发起拨号；
8. 前端提示失败 / 暂无有效号码，并允许合法重试。

该行为只是 cache miss 下的首次按需取号，不等同于“获取最新电话”。

---

## 6. “获取最新电话”

“获取最新电话”是独立主动强制刷新动作：

1. 按当前 `upstream_publisher_id` 获取最新号码；
2. 不使用普通缓存替代本次 latest；
3. Collector / 采集端负责实际 JYT 取号；
4. 成功结果经名邦既有 Integration API / 回传体系返回；
5. 只有取得合法、非空、可作为电话号码使用的有效新号码，才更新当前号码；
6. 原号码进入历史，不物理抹除；
7. latest 请求失败，或请求完成但未取得有效电话号码，都不得删除 / 覆盖已有有效缓存；
8. 有旧缓存时继续保留并标记为 cached，不能冒充 latest；
9. 无旧缓存且本次未取得有效号码时进入 `PHONE_UNAVAILABLE`；
10. 无有效号码、空值、非法号码以及刷新失败结果都必须可审计，但不能把“请求成功”误写成“号码刷新成功”。

---

## 7. 电话历史与当前权威

`publisher_phone_history`：

1. 用于历史号码与审计追溯；
2. 不作为普通当前号码的权威取值源；
3. 当前号码以 publisher 当前缓存事实为准；
4. 联系人变化 / 电话变化时保留旧事实。

---

## 8. 并发

1. 同一 publisher 同时发生多个 latest 请求时采用 single-flight。
2. 同一真实刷新结果可供并发请求共享。
3. 不同 publisher 之间允许并发。
4. cache miss / latest 的技术幂等、队列和 timeout 由 Engineering 设计，但不得改变产品语义。

---

## 9. 拨打

合法取得当前电话后：

1. “拨打”只调起手机系统拨号器；
2. 由员工最终确认是否实际拨出；
3. 不建设名邦后台自动代拨；
4. 不新增独立 `can_call_wholesale_phone`；
5. 继续复用现有上游电话敏感能力 + data scope。

---

## 10. 复制边界

V1：

- 允许查看；
- 允许获取最新；
- 允许系统拨号；
- **不提供专门的一键复制 / 长按复制上游电话动作。**

后续如确有销售业务需要，应作为新的明确产品决定增加。

---

## 11. 车源同步阶段

JYT 车源：

- 采集；
- 更新；
- 改价；
- 下架；
- 重新上架；

均**不批量预取发布人电话**。

电话继续按需获取：

- 已有缓存直接使用；
- 无缓存且实际需要时按需取一次；
- 主动“获取最新电话”时强制刷新。

---

## 12. 审计

以下电话敏感行为必须可追溯：

- 查看；
- 获取最新电话；
- 拨打；
- 刷新成功；
- 刷新失败；
- 必要的异常 / 使用结果。

至少保留：

- 操作人；
- 操作时间；
- 结果；
- publisher；
- 必要车辆关联；
- 有上下文时的客户 / Demand 等业务关联。

前端隐藏不能替代服务端权限校验和审计。

---

## 13. P03-05 publisher 电话缓存页

P03-05 定位为：

> **电话缓存管理 / 诊断页**

至少展示：

- `source_platform`；
- `upstream_publisher_id`；
- 当前电话；
- 当前联系人（上游有返回时）；
- 最近获取时间；
- 当前号码状态 / 新鲜度；
- 历史号码；
- 最近获取 / 刷新结果；
- 必要异常、日志与审计入口。

身份：

> **P03-05 的 publisher 记录与当前缓存必须继续按 `source_platform + upstream_publisher_id` 唯一定位，不能只按裸 `upstream_publisher_id` 合并。**

权限：

- 明文电话继续受**独立上游电话敏感能力**控制；
- P03-05 只能投影当前操作者 data scope 可触达的 publisher / 关联 Vehicle 范围，不得因为进入集成管理页扩大电话数据范围；
- 具备相应后台电话敏感能力且 data scope 允许的管理员，可执行“获取最新电话”；
- System Admin 身份本身不自动获得明文上游电话查看 / latest 权；
- `integration / Collector manage`、Integration API 配置能力、运行状态 / 日志查看能力，都不能自动推导为上游电话明文权限。

该页：

- 不是普通销售日常拨号入口；
- 允许查看 publisher 当前/历史事实不等于把电话重新挂回已转名邦/4S Vehicle 的日常详情；
- 不提供 Collector Base URL / Phone Path 等旧电话连接配置。

---

## 14. 名邦 Integration API 与配置边界

1. 名邦 Backend 提供 / 管理自身 Integration API 与必要鉴权。
2. Collector / 采集端配置名邦 API 连接信息并负责可靠回传。
3. 名邦侧可承载：
   - 集成运行状态；
   - 接收结果；
   - 电话缓存 / 历史；
   - 异常诊断；
   - 调用 / 回传日志；
   - 必要审计。
4. 名邦 P03 不再提供普通管理员修改 Collector 电话 URL / Phone Path 的能力。
5. JYT Token / URL / Header / callCode 等真实上游调用参数只属于采集端 / Engineering。
6. Secret 不得普通明文回显。

---

## 15. 明确废弃 / 不得恢复

不得恢复：

1. 以 `car_code`、单 `vehicle_id`、每车一份电话缓存作为电话身份；
2. 名邦直接调用 JYT 电话接口；
3. 名邦保存 / 展示 / 轮换 JYT 电话 Token / Header / callCode；
4. 旧 JYT 电话凭证管理入口 / DTO / permission；
5. 独立 `can_call_wholesale_phone`；
6. 普通查看有缓存仍强制取号；
7. freshness 到期自动使缓存不可拨打；
8. 车源同步阶段批量预取电话；
9. 名邦 P03 中旧 Collector Base URL / Phone Path 电话配置模型；
10. 旧 Mingbang → Collector Phone API 作为当前产品网络方向。

---

## 16. B4-04 撤回说明

原问题：

> “Collector 新配置测试失败时如何生效 / 回滚”

已撤回，不再是 PDM-09 产品规则。

原因：

- 它依赖旧“名邦 P03 配置 Collector Base URL / Phone Path”前提；
- 当前产品架构不存在该前提。

Collector 如何保存 / 测试 / 回滚名邦 Integration API 连接参数：

> 属于 Collector / Engineering 配置安全，不重新创造名邦产品规则。

---

## 17. Cross-PDM 承接状态

### 17.1 已完成 incoming handoff

- `HO-P02-P09-001 = HANDOFF_CLOSED`：电话为独立敏感能力；Internal Mode 不授权；4S 身份不自动获得电话能力；
- `HO-P04-P09-001 = HANDOFF_CLOSED`：电话定位不得恢复 car_code / Vehicle 维度，统一按 publisher identity。

### 17.2 仍待后续 PDM 承接

- PDM-21｜`HANDOFF_CLOSED`：PDM-21 Final 已正式承接员工端电话 latest/cache/latest failed+cached/unavailable、拨打不复制及 source_type/permission 裁剪；`HO-P09-P21-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-22｜`HANDOFF_CLOSED / source_backwrite=YES`：P03-05 publisher cache / 诊断、复合 publisher identity、Integration / 电话明文权限隔离已由 PDM-22 Final 承接；
- PDM-23｜`HANDOFF_CLOSED / source_backwrite=YES`：Collector / 电话链路 incident、异常/恢复通知、运行事件已由 `07_重建工作区/PDM-23_最终完整规则.md` 正式承接；通知层不得重新定义 publisher phone 当前值或缓存状态；
- PDM-25｜`HANDOFF_CLOSED / source_backwrite=YES`：电话查看、拨打、latest、latest 成功/失败/无有效号码、缓存 before/after、source_platform + publisher、必要 Vehicle / Customer / Demand context 的统一审计。

### 17.3 IA / Low-Fi / 旧实现 stale carrier

当前只登记、不修改：

- “保存 Collector 电话连接 / 测试 Collector 连接”；
- Collector Base URL / relative Phone Path / allowlisted host 等旧网络方向 Guard；
- 部分旧“名邦调用采集端 / Collector Phone API”文字；
- 部分 carrier 仍使用泛化 `publisher_id`，未统一为 `upstream_publisher_id`；
- P03-05 / 旧 CR-007 实现语义存在把 `integration.collector.manage` 等集成管理能力误解成明文电话权限的风险；
- `PHONE_UNAVAILABLE` 尚未完整区分“本次无有效新号码 + 仍有旧缓存”与“完全无缓存”；
- 3A 批发→名邦后电话入口关闭尚未形成 Current / Low-Fi source_type 投影。

统一登记：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

IA / Low-Fi / 旧实现载体不得反向覆盖本 PDM Final。

---

## 18. Coverage

- Batch 1：COMPLETE_USER_CONFIRMED
- Batch 2：COMPLETE_USER_CONFIRMED
- Batch 3：COMPLETE_USER_CONFIRMED / 0 new atoms
- Batch 4：COMPLETE_USER_CONFIRMED
- SOURCE_DECISION_COVERAGE：**100%（20/20）**
- UNMAPPED：**0**
- STALE_CARRIER：存在，但已全部有 supersede 去向

2026-10-05 Legacy Final Integrity Audit 关闭 5 组问题：P03-05 复合身份与权限边界、无有效号码不得覆盖旧缓存、用户裁决 3A source_type 电话入口裁剪、PDM-21/22/23/25 future handoff、IA/Low-Fi/旧实现 stale carrier。

最终状态：

> **`COMPLETE / INTEGRITY_PASS`**

```text
MISSING_RULE_UNRESOLVED = 0
SEMANTIC_DETAIL_GAP_UNRESOLVED = 0
CROSS_PDM_CONFLICT = 0
HANDOFF_GAP_UNRESOLVED = 0
GLOBAL_INVARIANT_CONFLICT = 0
SOURCE_DECISION_COVERAGE = 100%
FINAL_TO_SOURCE_TRACEABILITY = 100%
SEMANTIC_INTEGRITY = PASS
NEGATIVE_CLAIMS_VERIFIED = PASS
IMPLEMENTATION_READY = PASS
HANDOFF_REGISTER_SYNC = PASS
```

下一审计域：

> **PDM-10｜Legacy Final Integrity Audit**

PDM-09 正式封版。后续 PDM / IA / Low-Fi / Engineering 不得静默改写本文件；若发现真实跨域冲突，必须显式提出并重新裁决。

> 2026-10-07 Source Backwrite：对应 PDM-22 handoff 已由 `07_重建工作区/PDM-22_最终完整规则.md` 正式承接；以 CROSS_PDM_HANDOFF_REGISTER 的 `HANDOFF_CLOSED / source_backwrite=YES` 为准。


> 2026-10-07 Source Backwrite｜HO-P09-P25-001：`HANDOFF_CLOSED / source_backwrite=YES`。PDM-25 已由 `07_重建工作区/PDM-25_最终完整规则.md` 正式承接本域移交的审计 / 历史 / 时区 / 配置版本 / 横切完整性语义；PDM-25 不反向改写本 PDM 已冻结的业务状态机与产品规则。
