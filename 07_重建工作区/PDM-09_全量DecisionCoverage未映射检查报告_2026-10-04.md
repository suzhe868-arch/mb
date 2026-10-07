> **HISTORICAL_AUDIT_TRAIL｜历史执行记录**  
> 本文件记录当时阶段性审查 / 待批准 / 覆盖检查 / 切窗状态。文中的“当前 / 下一步 / PENDING / BLOCKED / Startup Gate / Batch”等阶段表述均只代表当时，不是仓库当前状态。  
> 当前状态与唯一下一步以根目录 `README.md`、`CURRENT_PROJECT_STATE.md`、`NEXT_ACTION.md`、`PROJECT_STATE.json` 为准；不得据本文件恢复旧阶段指针或覆盖正式 Final。

# PDM-09｜全量 Decision Coverage / 未映射检查报告

> 日期：2026-10-04  
> 域：PDM-09｜上游发布人电话 / Collector / 缓存 / 获取最新 / 敏感能力  
> 结论：**PASS**  
> SOURCE_DECISION_COVERAGE：**100%（20/20）**  
> UNMAPPED：**0**

---

## 1. 审计范围

本次覆盖检查同时核对：

- PDM-09 Batch 1～4 全部已审 Atom；
- 9/19 C1、R10、R11、R12；
- 9/06 SSOT / CN11 电话原始规则；
- 001～078 中 M07-002 / M07-003 等电话与 Collector 相关归档；
- IA V5 Current；
- Low-Fi Navigation / State Register；
- 当前已确认的 P09-A04-R1、P09-A11-R1、P09-B4-01～06。

Batch 3 无新增 Atom，因此不额外增加 Decision 单元。

---

## 2. Decision Coverage Ledger

| 单元 | 最终去向 | 状态 |
|---|---|---|
| P09-A01 | 电话归属 / 缓存身份统一为 `source_platform + upstream_publisher_id` | EFFECTIVE |
| P09-A02 | 客户端 / 客户安全视图禁止展示上游电话 | EFFECTIVE |
| P09-A03 | 上游电话为独立敏感能力 + data scope | EFFECTIVE |
| P09-A04 | 被 P09-A04-R1 替代 | SUPERSEDED |
| P09-A04-R1 | Collector 负责 JYT 取号；结果经名邦既有 Integration API / 回传体系返回 | EFFECTIVE |
| P09-A05 | 普通查看 / 有缓存拨打 cache-first | EFFECTIVE |
| P09-A06 | “获取最新电话”独立强制刷新；失败不覆盖旧缓存 | EFFECTIVE |
| P09-A07 | phone history 仅历史 / 审计，不参与当前取值 | EFFECTIVE |
| P09-A08 | 同 publisher latest single-flight；不同 publisher 可并发 | EFFECTIVE |
| P09-A09 | 系统拨号器；不建后台代拨 / 独立 call permission | EFFECTIVE |
| P09-A10 | 查看 / latest / 拨打 / 刷新结果审计 | EFFECTIVE |
| P09-A11 | 被 P09-A11-R1 替代 | SUPERSEDED |
| P09-A11-R1 | 名邦提供自身 Integration API；P03 不再配置 Collector URL / Phone Path | EFFECTIVE |
| P09-B2-01 | car_code / vehicle 维度电话身份不得恢复 | DO_NOT_RESTORE |
| P09-B2-02 | 名邦直连 JYT / 管理 JYT 电话凭证不得恢复；旧网络方向文字被 A04-R1 替代 | EFFECTIVE_CORE + PARTIAL_SUPERSEDE |
| P09-B2-03 | 不新增独立“拨打电话权限” | DO_NOT_RESTORE |
| P09-B4-01 | 无缓存拨打按需取号；成功缓存后拨；失败不拨 | EFFECTIVE |
| P09-B4-02 | expires_at / freshness 不构成普通缓存硬失效 | EFFECTIVE |
| P09-B4-03 | 车源同步不批量预取电话 | EFFECTIVE |
| P09-B4-04 | 旧“Collector 配置测试失败如何激活”产品问题撤回 | WITHDRAWN |
| P09-B4-05 | P03-05 收口为 publisher 电话缓存管理 / 诊断页 | EFFECTIVE |
| P09-B4-06 | V1 不提供专门一键复制 / 长按复制上游电话 | EFFECTIVE |

> Coverage 计数口径：原始审查单元按 Batch 1 的 11 项 + Batch 2 的 3 项 + Batch 4 的 6 项，共 20 个；每个原始单元均有 EFFECTIVE / SUPERSEDED / DO_NOT_RESTORE / WITHDRAWN 的明确去向，因此 20/20。

---

## 3. 历史 / Current 证据映射

### 3.1 publisher 身份与缓存

历史内容：

- `upstream_publisher_id` 为发布人身份；
- cache key = `source_platform + upstream_publisher_id`；
- car_code 不参与电话查询。

最终映射：

- P09-A01
- P09-B2-01

结果：**COVERED**

### 3.2 普通查看 / 拨打 / 无缓存取号

历史内容：

- 有缓存直接使用；
- 无缓存时按需获取；
- latest 与普通拨打分离。

最终映射：

- P09-A05
- P09-A06
- P09-B4-01
- P09-B4-02

结果：**COVERED**

### 3.3 latest 失败 / history / 并发

历史内容：

- latest 失败保留旧缓存，不冒充 latest；
- history 只做审计；
- 同 publisher single-flight；
- 不同 publisher 可并发。

最终映射：

- P09-A06
- P09-A07
- P09-A08

结果：**COVERED**

### 3.4 权限 / 展示 / 拨号 / 复制

历史内容：

- 客户端永不展示上游电话；
- 电话是独立敏感能力；
- 合法号码只调系统拨号；
- 不新增独立 call permission；
- 上游电话不进入复制白名单。

最终映射：

- P09-A02
- P09-A03
- P09-A09
- P09-B2-03
- P09-B4-06

结果：**COVERED**

### 3.5 Collector / JYT / Integration API 边界

历史材料中存在两套方向：

1. 旧中间方案：Mingbang → Collector Phone API；
2. 当前已验证方案：Collector 负责 JYT 取号，结果进入名邦现有 Integration API / 回传体系。

最终映射：

- P09-A04-R1
- P09-A11-R1
- P09-B2-02
- P09-B4-04（撤回旧连接配置问题）

结果：**COVERED / OLD_DIRECTION_SUPERSEDED**

### 3.6 P03 电话管理页

历史 / Current 内容：

- 当前电话；
- 历史电话；
- latest；
- 异常 / 日志 / 审计；
- P03-05 publisher 电话缓存。

最终映射：

- P09-A07
- P09-A10
- P09-B4-05

结果：**COVERED**

### 3.7 同步阶段电话获取时机

历史 SSOT：

- 车源同步阶段不批量取电话；
- 实际需要时按需取。

最终映射：

- P09-B4-03

结果：**COVERED**

---

## 4. IA / Low-Fi Carrier 检查

### 4.1 当前正确承载

以下载体已有明确产品规则对应：

- `PHONE_CACHE_AVAILABLE` → A05 / B4-01 / B4-02
- `PHONE_LATEST` → A06
- `PHONE_LATEST_FAILED_CACHE_AVAILABLE` → A06 / A07
- `PHONE_UNAVAILABLE` → A03 / B4-01
- E02-M01 “拨打” → A03 / A05 / A09 / B4-01
- E02-M01 “最新电话” → A03 / A06
- P03-05 publisher 电话缓存 → A07 / A10 / B4-05
- CO-O15 Publisher Phone 生命周期 / 审计 → A05 / A06 / A07 / A10

状态：**MAPPED**

### 4.2 STALE_CARRIER｜后续 IA / Engineering 需清理，但不是产品未映射

当前 IA / Navigation 仍有旧表述：

- P03 “保存 Collector 电话连接”；
- P03 “发送测试”；
- P03-04 “测试 Collector 连接”；
- `HTTPS + allowlisted host + relative path + timeout + secret reference` 的旧电话连接 Guard；
- 部分 Current 文本仍使用“名邦调用采集端 / Collector Phone API”的旧网络方向；
- 部分位置泛化为 `publisher_id`，后续实现时应统一到 `upstream_publisher_id` 业务身份。

最终处理：

- 以上均已被 P09-A04-R1 / P09-A11-R1 / P09-B4-04 的裁决覆盖；
- 不再作为新的产品 Decision；
- 后续 IA / Low-Fi / Engineering Delta 阶段必须删除或重写旧 carrier。

状态：**MAPPED_TO_SUPERSEDE / STALE_CARRIER**
  
不计入 UNMAPPED。

---

## 5. Engineering Handoff｜不是产品缺口

以下内容已经有产品结果，但具体实现方式留 Engineering：

- 名邦业务侧如何把待取号的 `upstream_publisher_id` 交给 Collector；
- Collector 如何排队 / 拉取 / 消费该取号任务；
- 电话结果如何复用现有 Integration API / Outbox / 回传协议；
- 重试、timeout、幂等、内部队列；
- Integration API Secret 的具体生成、轮换和部署；
- stale IA carrier 的代码 / 页面迁移方式。

这些都不得重新创造第二套产品级 Collector URL / Phone Path。

状态：**ENGINEERING_HANDOFF / NOT_UNMAPPED**

---

## 6. 最终结果

- Batch 1：PASS
- Batch 2：PASS
- Batch 3：PASS（0 新 Atom）
- Batch 4：PASS
- API 方向冲突：已由 A04-R1 / A11-R1 关闭
- B4-04：已明确撤回
- IA / Low-Fi 旧载体：有明确 supersede 去向
- 产品未裁决项：0
- SOURCE_DECISION_COVERAGE：**100%（20/20）**
- UNMAPPED：**0**
- STALE_CARRIER：**存在，进入后续 IA / Engineering 整改，不阻塞 PDM-09 最终产品规则审批**

结论：

> **PDM-09 已具备生成《最终完整规则总览_待用户批准》的条件。**
