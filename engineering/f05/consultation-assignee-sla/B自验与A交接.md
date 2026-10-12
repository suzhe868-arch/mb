# F05-10｜B工程A首轮整改单整改与A复验交接（待CI验证）

> 状态：`F05_10_B_REWORK_IN_PROGRESS / NEXT_OWNER=B / CI_ONLY / V1_NOT_READY`。这是 B 分支工作记录，不构成已经通过的 A 交审。

## 授权与范围

- 来源为最新 `main` 的 A 首轮 F05-10 整改单 R01～R04；仅使用 `feat/f05-10-consultation-assignee-sla`，只改 `engineering/f05/consultation-assignee-sla/**` 内新 CI 文件；PR49 保持开放。前批已签 F03/F04/F05-1～9、正式生产/迁移、PDM、`main` 均未更改。
- 已追加工程源码：创建时固化 Consultation 对象 Team/Store origin，当前 Employee employment / personal permission deny / capability Scope / data Scope / membership 物理变化触发新 v26 CI 表的自动 pending Guard及不可变事件；每次合法 Employee 操作再次查询当前实际权限与 Guard。增加独立可核对的合成首次真人服务 evidence 源、actor/type/Consultation 外键及一次性消费约束，拒绝任意格式合法但不存在源事实的 call/message 引用。
- 新增 PostgreSQL16 原生 Source 用例：伪证拒绝、close_normal/invalid 与客户withdraw独立；新版 SLA policy 对新工单生效、旧 source snapshot 不变；Hold 剩余时长及恢复；1秒 timeout 不自动关闭；至少两个 PG backend 对 Employee disabled 触发器提交与旧Mutation竞争；个人 deny /scope撤销与 receiving pool 回退；真实 v25 推荐 direct source、Owner 与 Assignee 不漂移、隐藏车分享不继承；真实 Recommendation、Priority、Grant、价格权、Lock、Transaction、Owner 物理行数/哈希不变；已开单在车辆下架后保持原状态。
- 追加跨Store真实签名合成：独立 Store/Team、员工业务 Scope 与 Owner、真实远端Consultation/接客员工、经理/店长个人明确权限与远端 Store 范围、正式 handover receipt、个人 deny 和 4S 角色拒绝；并对独立员工来源 DELETE / role 变化做额外实时 Guard 保护。
- 尚待官方 Actions 核实及可能修复：旧70 Job和新增2 Job 的唯一新HEAD全量成功；本批 Source 新用例无 skip/fail、八份有效同 SHA 原生 Artifact；A R02 的完整 Demand/跨Store Manager/StoreHead/4S/SystemAdmin 矩阵、A R03 双后端客户停用与 DND 正反例，以及 4S 合法车源等仍需逐项实测或列明确阻断。

## 必须保留的 SOURCE_GAP

真实微信/手机号、Customer与Employee生产 Issuer、电话/消息/飞书、JYT 真实电话、生产价格来源与资金、UAT/线上迁移均不在本 CI-only 任务的授权范围内。不能把 CI合成授权、CI服务证据或成功 CI 当成已可上线。未完成全部 A 实证/同SHA CI 之前不得写 `READY_FOR_A_SECOND_INDEPENDENT_REVIEW`。
