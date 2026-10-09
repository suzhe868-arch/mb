# F03-2-2E｜SG06 交接账本与逐项幂等

这是受限CI内部技术登记账本，不是真正业务交接。全部运行限GitHub Actions一次性独立PG16测试库、合成PC身份，绝无生产业务或客户owner更新。

- 000007新增且只新增handover_batches与handover_items。batch精确绑定source、initiator、kind和唯一client_request_key；item的组合唯一键为(batch_id,object_kind,object_id)，全部状态严格禁止completed。
- 只支持原负责人可由真实数据库字段证明的Customer与Demand合成对象登记为pending；其它对象必须DEFER_DENY，不提供真实域adapter或业务成功的权限。
- createHandoverDraft/addPendingHandoverItem/recordItemFailure/retryPendingItem始终使用真实F03-1正常PC会话+当前DB manager权限+明确Team Scope+双人当前成员关系；不自动授权经理/4S/System Admin。
- 先锁batch，再锁具体item；独立事务中状态、attempt_count、batch version、脱敏audit全体成功或全体回滚。重放审计intent只存SHA256；部分失败不回滚此前已提交的其它item。
- CI 2E主作业真实检查E01～E08并发、幂等、回滚和结构，并另运行旧86/84/82/81/80各版本独立PG16回归；archive-check比对pg16_schema_only原文和inventory，随机pg_dump restrict key特殊处理。
- 完整B交接、限制和真实证据在B自验与A复验交接.md；最终READY_FOR_A_REVIEW必须同SHA 8/8 CI成功。A验收并通过标准PR后才可合并main。
