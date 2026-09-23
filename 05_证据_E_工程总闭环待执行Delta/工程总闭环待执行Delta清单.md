# 名邦汽车 V1｜工程总闭环待执行 Delta 清单｜2026-09-22

> 状态：`ENGINEERING_CLOSURE_PHASE = READY`；本清单是工程实施输入，不代表代码、数据库或 API 已经完成。

## 1. Business Rule Delta｜业务规则

必须实现并保持：

- 普通详情：`收藏｜咨询这辆车｜锁车体系状态位`。
- 分享详情：增加 `更多车源`，并跳转 C01 车源首页。
- `咨询这辆车` 只进入 Consultation，不得创建 LockRequest / Lock。
- 客户点击 `锁车` 只提交/复用 `LockRequest.PENDING`。
- LockRequest 不占车、不生成 Lock Snapshot、不启动正式 Lock TTL。
- PENDING 固定 6 小时，以服务端时钟为唯一判定源。
- 同客户 + vehicle + listing_cycle 同时最多 1 个 PENDING。
- 同车允许多个客户同时 PENDING；申请先后不产生优先权。
- 正式 Lock 同车唯一；第一个合法 approve 并成功创建正式 Lock 的申请获锁。
- 其他同车同 cycle PENDING 在正式 Lock 成功后 -> `LOCK_CONFLICT`；不得自动转 Waitlist。
- `REJECTED / EXPIRED` 后，车辆仍可申请时允许重新提交。
- PENDING 遇已售/下架/不可售/不可锁或 listing_cycle 失效 -> `CLOSED_NOT_LOCKABLE`。
- 客户无 LockRequest 主动取消/撤回能力；客户端不提供申请进度详情页。

## 2. Data Model Delta｜数据模型

新增/落实 `lock_requests` 对象/表，状态仅：

```text
PENDING
APPROVED
REJECTED
EXPIRED
LOCK_CONFLICT
CLOSED_NOT_LOCKABLE
```

工程至少需要承载：

- customer / vehicle / listing_cycle 关联；
- `created_at`；
- `expires_at = created_at + 6h`；
- 审核 actor / 审核结果 / 审核时间；
- `resulting_lock_id`；
- 完整审计所需关联字段。

不得重新引入旧 Vehicle Intent Work Item 作为当前业务对象。

## 3. Client Delta｜C 端

### C01-01 普通详情

锁车体系状态位必须按当前实时投影：

1. 当前客户 active Lock -> `锁车进度`；
2. 其他客户 active Lock：本人已有 active Waitlist -> `候补中`，否则 `候补`；
3. 当前客户有 PENDING LockRequest -> `锁车申请中`（不可点击）；
4. 满足申请条件 -> `锁车`；
5. 否则 -> `暂不可锁车`（disabled）。

### 分享直达

- 额外显示 `更多车源`；
- `更多车源 -> C01`；
- 保持 SHARE_DIRECT Entry Context，不改变业务事实。

### Consultation

- `咨询这辆车` 创建/复用现有 open Consultation；
- 与 LockRequest 完全分离。

## 4. Employee Delta｜E 端

员工链：

```text
E01 工作台待办
-> E07-07 锁车申请列表
-> E07-08 锁车申请详情
-> 同意 / 拒绝
```

必须实现：

- E01 `锁车申请待处理（N）`；
- E07-07 / E07-08 返回并展示服务端计算的剩余有效时间；
- 责任销售优先；
- 责任销售不可处理、离职或权限失效时，由具备 Lock capability + scope 的经理/店长承接；
- 4S 成员 DENY；
- 已过期申请不可批准。

## 5. API / Service Delta｜接口与服务

需要具备以下能力（本清单不虚构具体 URL）：

- 客户 submit LockRequest：幂等；同客户+车+cycle 单 PENDING；
- 员工 list / detail；
- 员工 approve / reject；
- 服务端超时处理 EXPIRED；
- 车辆/周期失效时关闭为 CLOSED_NOT_LOCKABLE；
- 客户结果状态查询应由详情投影承载，不新增“申请进度页”要求。

无客户端 cancel / withdraw LockRequest 要求。

## 6. Concurrency / Idempotency｜并发与幂等

必须验证：

- 客户重复点击、网络重试不会产生重复 PENDING；
- approve 幂等；
- 多个员工并发 approve 时，正式 Lock 只能一个成功；
- active Lock 唯一约束继续有效；
- 过期申请在边界时刻不可被错误批准；
- 6h 判定只使用服务端时间。

## 7. Atomic Formal Lock Creation｜正式 Lock 原子事务

approve 必须在同一原子事务中完成：

1. request 仍为 PENDING；
2. `now < expires_at`；
3. actor permission + scope 仍有效；
4. listing_cycle 有效；
5. 车辆仍可锁；
6. 无 active Lock；
7. 创建/复用正式 Lock；
8. LockRequest -> APPROVED；
9. 写 `resulting_lock_id`；
10. 生成 Lock Snapshot；
11. 从此时开始既有正式 Lock 72h TTL；
12. 其他同车同 cycle PENDING -> LOCK_CONFLICT；
13. 执行既有 Priority Lock takeover。

事务任一步失败不得留下“request 已批准但正式 Lock 未成立”的半状态。

## 8. Waitlist Interaction｜候补联动

- 只有“他人 active Lock”时允许候补；
- `LOCK_CONFLICT` 不自动创建 Waitlist；
- 客户下一次查看详情时显示 `候补`，由客户主动登记；
- 本人已有 active Waitlist -> `候补中`。

## 9. Notification Delta｜通知

客户结果通知至少覆盖：

```text
APPROVED
REJECTED
EXPIRED
LOCK_CONFLICT
CLOSED_NOT_LOCKABLE
```

员工侧需要新申请待办/提醒；具体通知渠道沿用项目既有能力，不在本 Delta 中新增未冻结渠道。

## 10. Audit Delta｜审计

必须完整记录：

- 申请创建；
- 幂等复用；
- 自动过期；
- 员工批准/拒绝；
- actor 与 permission/scope 结果；
- Lock conflict；
- CLOSED_NOT_LOCKABLE 原因；
- resulting_lock_id；
- 正式 Lock / Snapshot 创建结果。

## 11. 与既有规则的映射｜DO NOT BREAK

### 正式 Lock 72 小时

不变。72h 从员工 approve 并成功创建正式 Lock 的时刻开始，不从 LockRequest 创建时开始。

### Lock Snapshot

不变。LockRequest PENDING 不生成 Snapshot；正式 Lock 原子创建成功时生成。

### Priority

LockRequest 不改变 Priority；正式 Lock 后执行既有 Lock takeover。

### Recommendation / Visibility / Customer Owner

LockRequest 本身不授予新 visibility，不改变 Recommendation，不改变 customer owner。

### Transaction

不得把 LockRequest 当作正式 Lock 或 Transaction；后续交易仍从正式 Lock 既有链路承接。

## 12. Page / State / Navigation / Permission Delta

工程实现必须以最新 Current/Registers 为准：

```text
CURRENT_PAGE_TOTAL = 119
CURRENT_OVERLAY_TOTAL = 20
CURRENT_LOGICAL_STATE_TOTAL = 479
CURRENT_NAVIGATION_TOTAL = 244
CURRENT_SVG_TOTAL = 497
```

重点对象：

- C01-01：NORMAL / LOCK_REQUEST_PENDING / LOCKED_BY_SELF / LOCKED_BY_OTHER / WAITLISTED / CLOSED_NOT_LOCKABLE + SHARE_DIRECT；
- E01：锁车申请待处理提醒；
- E07-07：申请列表；
- E07-08：PENDING / PROCESSING / APPROVED / REJECTED / EXPIRED / LOCK_CONFLICT / CLOSED_NOT_LOCKABLE / PERMISSION_DENIED / HISTORICAL。

## 13. Test Matrix｜工程验收测试

至少覆盖：

- Consultation 与 LockRequest 严格分离；
- 重复 submit / 网络重试；
- 同客户同车同 cycle 单 PENDING；
- 多客户同车多 PENDING；
- 申请先后无优先级；
- 6h 到期边界；
- 过期后 approve；
- 并发 approve；
- 车辆下架/已售/不可锁；
- listing_cycle 失效；
- LOCK_CONFLICT；
- Waitlist 不自动转入；
- 责任销售失效后的经理/店长承接；
- 4S DENY；
- permission/scope；
- Lock Snapshot；
- 正式 Lock 72h 起点；
- Priority / Recommendation / Visibility / Owner 无 LockRequest 副作用；
- 通知与审计完整性；
- 普通详情和分享详情的状态按钮投影。

## 14. 工程完成判定

本清单当前只标记：

```text
ENGINEERING_IMPLEMENTED = FALSE
ENGINEERING_CLOSURE_PHASE = READY
```

只有真实代码、Schema、API、测试和回归全部完成并有直接证据后，才能升级工程实现状态。
