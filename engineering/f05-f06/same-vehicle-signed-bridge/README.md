# F05→F06同车签名跨Runtime桥接（非生产）

本目录是 Issue #231 的唯一新增业务桥接目录。所有流程必须在真实当前 GitHub Ref、同一 HEAD SHA、真实 PostgreSQL 16 和非超级用户 f03_ci 下运行；不覆盖 GITHUB_REF、不伪造旧签名根、不使用生产数据库。

## 正向流程

1. prepare-source.test.mjs 通过 F05 #214 原生 HTTPS/API 创建并正式发布名邦车辆，生成脱敏来源清单。源库保持 F05 14 条正式迁移和原有私有草稿侧车。
2. CI 将源库改名保留其原 OID，并从源库模板创建独立 F06 目标库。目标库继续原有 F05 17～23 迁移和 F06 24 条签名迁移、161表父链封印及 Composite/财务侧车；F05源库不运行后续迁移。
3. bridge-test.mjs 只在 F06 目标库建立允许的客户展示价投影与私有桥接来源封印，再通过现有 F06 原生 LockRequest/审批、合成 Deposit 和 Transaction HTTP/业务服务完成真实闭环。
4. CI 暂时切换数据库名称，将原 F05 源库恢复到服务要求的 f03_auth_test，通过 F05 #216 原生 HTTPS/API 编辑同一 Vehicle；源库 OID 不变。
5. verify-after-edit.mjs 恢复 F06目标库连接，逐行复核 public Vehicle/Cycle/责任/客户展示价、Lock/LockSnapshot、Deposit/receipt provenance、Transaction/origin、Composite签名事件和相关审计行。编辑前后快照必须完全相等。
6. 运行两个独立 PG16 矩阵 Job。最终 SHA 的每个 Job 都生成来源清单、编辑清单、前后快照、161表Seal、TAP日志、中文交接和 SHA-256 清单。

## 隔离规则

- F05源库：f03_auth_test 原生发布，随后固定为 f05_vehicle_source，只保留 14 条正式迁移。
- F06目标库：独立数据库 OID，完成 24 条签名迁移；桥接过程不修改 public.vehicles 或 public.vehicle_listing_cycles，只有在无现有客户展示价事实时才建立由F05原始标价驱动的customer_display投影。
- f03_auth_baseline 是 24 条迁移/161表的独立基线；f03_auth_restore 是父表封印后创建的独立恢复副本。
- 合成定金标记 CI_SYNTHETIC_NOT_REAL_MONEY，绝不代表真实资金。
- VIN、电话、登录密码和会话令牌不进入 Artifact。来源清单仅保存 VIN/描述/条件标签哈希。
- B 不合并 main；只有官方最终 SHA、两个独立 PG16 Job 和证据清单全部通过后，才标记 READY_FOR_A_REVIEW 并交 A 独立验收。
