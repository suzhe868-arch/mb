# F03-2-2J｜Consultation负责人单域交接（隔离PG16）

仅供A已签发的F03-2-2J B工程验收，非生产API。

- Authority：PDM-15 Final Consultation四状态/首响SLA、PDM-14 Recommendation不反写、PDM-03 Customer owner独立、PDM-02精确Team权限；正式施工单见`07_重建工作区/F03-2-2J_A主控SG06_Consultation咨询负责人单域移交与SLA保留完整施工单_2026-10-10.md`。
- `service.mjs` CI-only导出`prepareConsultationAssigneeHandover`、`commitConsultationAssigneeHandover`、`retryConsultationAssigneeHandover`、`readConsultationAssigneeHandoverReceipt`。只改一列`assignee_employee_id`及新增同事务真实审计和不可变收据；绝不当作首响，不动15分钟原deadline。
- `000010.sql`独立新增一张不可变收据表。PG16真实发现的manifest固定结构SHA`ef3bcd0c89c959225764d0853b203047116282c3bd6f976e41aff1cd7b95e735`。旧000001～000009完全保持，旧H/I单域入口仅经A事先授权补第三域RequestKey防撞。
- `tests/integration.test.mjs`：27组真实PG16场景，含6种H/I/J方向、同Key三路并发与不同Key三路并发、历史两次合法转派、首响SLA/源关系及其它域原行不变、权限/角色负例与五点事务rollback。
- 专用工作流：`.github/workflows/f03-2-2j-consultation-assignee-handover.yml`，包含13个独立PG16作业；新增旧I90独立原模块27/27全量回归，与J91的27/27分别在全新PG16运行；首次原始归档来源请查`evidence/SOURCE.md`，全量证据与最终CI信息查`B自验与A复验交接.md`。

产品基线仍`NOT_READY`；B只交A验收，绝不自行合并main或进入2K。
