# 名邦汽车 V1｜F04-3 B全包自验与A复验交接

## 范围及权限

A正式施工单：`07_重建工作区/F04-3_A主控Current新接口注册表DTO与路由安全门禁完整施工单_2026-10-10.md`。分支 `feat/f04-3-current-action-api-registry`，实际从最新main `955b98d80bbbe9598571b24bee558a039d9d9329` 创建；只新增`engineering/f04/current-action-api-registry/**`与专属F04-3工作流，不允许合并main。

## 实际实现（当前代码阶段）

1. F04-3A：以23条A验收同动作依据+6个新Current动作+1个F04-1已签最小CustomerId只读证明形成30个规范化CI新路径；每条包含产品Final/IA/页面来源、method/DTO/permission/scope、状态与业务实施Owner。旧215候选=23 matched+192 SOURCE_GAP、3禁恢复独立；全部旧URL仍UNDECIDED/CONTRACT_ONLY，无KEEP/MODIFY或生产授权。
2. F04-3B：真实非特权PG16 M94和loopback TLS校验、F03 Session对象级身份、员工/4S/SystemAdmin角色隔离、CSRF/幂等/错误/响应最小白名单；仅委托原F04-1已验收CustomerId精准对象scope读可合成200；所有未实现F05/F06/F07业务保持DEPENDENCY_BLOCKED/403，无真实CRUD/生产注册。
3. F04-3C：专属CI完整复制已签F04-2原28个独立PG16作业+新来源OpenAPI DTO与新TLS路由两个独立PG16作业。旧F03/F04-1/F04-2工作流、服务、SQL000001～000014、PDM/IA/C设计全部不变。

## 出口门槛（运行事实待固化）

必须按最后B分支HEAD对应GitHub Actions的真实30/30个独立PG16作业success，附新两个Artifact ID、原生schema-only/full-catalog/inventory/frozen-source SHA256、运行证据，再将本交接更新为`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。当前文档不虚报未来CI通过；只记录`B_CI_PENDING`。

风险/未证事项：真实4S商户归属、F05价权车辆、F06 Lock/资金、F07 Collector/CDN、C/H01视觉和H03/H04三端生产，均仍为OPEN_DEPENDENCY或NOT_READY。

**当前状态：B_CODE_COMPLETE_PENDING_REAL_CI / NEXT_OWNER=B**。
