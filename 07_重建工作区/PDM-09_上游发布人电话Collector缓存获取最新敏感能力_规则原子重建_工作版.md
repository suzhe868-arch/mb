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
