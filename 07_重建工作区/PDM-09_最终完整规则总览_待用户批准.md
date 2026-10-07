> **HISTORICAL_AUDIT_TRAIL｜历史执行记录**  
> 本文件记录当时阶段性审查 / 待批准 / 覆盖检查 / 切窗状态。文中的“当前 / 下一步 / PENDING / BLOCKED / Startup Gate / Batch”等阶段表述均只代表当时，不是仓库当前状态。  
> 当前状态与唯一下一步以根目录 `README.md`、`CURRENT_PROJECT_STATE.md`、`NEXT_ACTION.md`、`PROJECT_STATE.json` 为准；不得据本文件恢复旧阶段指针或覆盖正式 Final。

# PDM-09｜上游发布人电话 / Collector / 缓存 / 获取最新 / 敏感能力｜最终完整规则总览｜待用户批准

> 日期：2026-10-04  
> 状态：`FINAL_REVIEW_PENDING`  
> Coverage：`SOURCE_DECISION_COVERAGE = 100%`  
> Unmapped：`0`

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
   - 当前车辆在本人 data scope；
   - 具备上游电话敏感能力；
   才能查看电话区域、获取最新电话、拨号。
5. 无电话权限时整个电话区域不显示。
6. Internal Mode 本身不授予电话权限。
7. 4S 身份本身不自动获得电话权限。

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
4. 名邦写入 publisher 当前缓存；
5. 再调起手机系统拨号器；
6. 获取失败则不发起拨号；
7. 前端提示失败，并允许合法重试。

该行为只是 cache miss 下的首次按需取号，不等同于“获取最新电话”。

---

## 6. “获取最新电话”

“获取最新电话”是独立主动强制刷新动作：

1. 按当前 `upstream_publisher_id` 获取最新号码；
2. 不使用普通缓存替代本次 latest；
3. Collector / 采集端负责实际 JYT 取号；
4. 成功结果经名邦既有 Integration API / 回传体系返回；
5. 成功后更新当前号码；
6. 原号码进入历史，不物理抹除；
7. latest 失败不得删除 / 覆盖已有有效缓存；
8. latest 失败时旧缓存只能标记为 cached，不能冒充 latest。

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

- `upstream_publisher_id`；
- 当前电话；
- 当前联系人（上游有返回时）；
- 最近获取时间；
- 当前号码状态 / 新鲜度；
- 历史号码；
- 最近获取 / 刷新结果；
- 必要异常、日志与审计入口。

权限：

- 明文电话继续受上游电话敏感能力控制；
- 具备相应后台电话敏感能力且 data scope 允许的管理员，可执行“获取最新电话”。

该页：

- 不是普通销售日常拨号入口；
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

## 17. IA / Low-Fi 后续整改提醒

当前 IA / Low-Fi 中仍存在少量旧 carrier，例如：

- “保存 Collector 电话连接”；
- “测试 Collector 连接”；
- relative path / allowlisted host 等旧电话连接 Guard；
- 部分旧“名邦调用采集端”方向文字。

这些已经有明确产品去向：

> `STALE_CARRIER → A04-R1 / A11-R1 / B4-04 WITHDRAWN`

后续 IA / Low-Fi / Engineering Delta 阶段应清理，但不构成新的产品未裁决问题。

---

## 18. Coverage

- Batch 1：COMPLETE_USER_CONFIRMED
- Batch 2：COMPLETE_USER_CONFIRMED
- Batch 3：COMPLETE_USER_CONFIRMED / 0 new atoms
- Batch 4：COMPLETE_USER_CONFIRMED
- SOURCE_DECISION_COVERAGE：**100%（20/20）**
- UNMAPPED：**0**
- STALE_CARRIER：存在，但已全部有 supersede 去向

当前状态：

> `FINAL_REVIEW_PENDING`

只有用户最终批准本总览后：

- 才生成 PDM-09 正式最终规则；
- 才将 PDM-09 标记 `COMPLETE`；
- 才允许进入 PDM-10。
