# F03-2-2K｜SG06 Waitlist负责人单域交接｜CI隔离PG16

A正式授权施工单：`07_重建工作区/F03-2-2K_A主控SG06_Waitlist候补负责人单域移交完整施工单_2026-10-10.md`。仅合成PG16，不是产品上线API，未经A复验不可合并。

- Waitlist旧表**没有status字段**，以`ended_at IS NULL`、原始source LockRequest/active Lock事实、Customer和车辆listing_cycle来检验仍可移交。不能从Customer owner/Demand自动重分配现有Waitlist负责人，不改候补顺序或自动转Lock。
- `service.mjs`：`prepareWaitlistResponsibleHandover`、`commitWaitlistResponsibleHandover`、`retryWaitlistResponsibleHandover`和`readWaitlistResponsibleHandoverReceipt`；独立敏感能力`waitlist.responsible.transfer`只在`fixtures.mjs`测试注册，当前scope+deny，CAS仅变一列+原子audit/append-only receipt。
- `000011.sql`新一张append-only `waitlist_responsible_handover_receipts`，已通过真实PG16发现+结构封印。旧91表/1982目录对象不变，新92表/2028目录项（+46），manifest/版本checksum及跨run原始PG16 SQL归档执行全量精确验证。
- H/I/J四Domain以共享306/309事务锁加专属K313及四向Key查重守卫，已合法commit/retry并发跨域同Key最多一笔成功，不同Key可分别成功；H/I/J旧代码只有A已预授权的三项最小入口升级。
- `tests/integration.test.mjs`：29个真实PG16集成测试；`.github/workflows/f03-2-2k-waitlist-responsible-handover.yml`：共**14个独立真实PG16 job**，旧J完整27/I完整27，所有旧回归独立全新库。
- `evidence/SOURCE.md`记录首次原始PG16结构证据来源；最新测试、当前验收状态、所有作业逐项结果详见`B自验与A复验交接.md`。

状态`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。完整F03-2/C-H01及产品基线仍`NOT_READY`。不可由B合并main或进入2L。
