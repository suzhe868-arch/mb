# F05-8｜B完整施工、自验与A独立复验交接（CI-only）
> 状态：`B_IN_PROGRESS / 68_SAME_SHA_OFFICIAL_PG16_REQUIRED / NEXT_OWNER=B`；必须以最终B/PR唯一SHA运行8个官方工作流68/68以及4有效Artifacts后才能交A。
> 授权施工单：`07_重建工作区/F05-8_A主控PDM13_Priority资格仲裁TTL排他与责任交接CI隔离完整施工单_2026-10-12.md`；Authority PDM-13 Final；固定branch `feat/f05-8-priority-arbitration-ttl-handover`。
## 范围
只新增 `engineering/f05/priority-arbitration-ttl-handover/**` 与八份 `.github/workflows/f05-8-*.yml`；前七Workflow以F05-7签名冻结 `jobs:\n` 到 EOF逐字复制旧64个真实PG16 Job，H52使用窄触发头避开512000B限制。
八份新Workflow：7冻（52+2+2+2+2+2+2）+1本批四项真实非超级用户独立PG16（兼容F05-7 Source 28/28、HTTPS7/7；新Priority Source/HTTPS）。
旧F05-7 `ci-verify-workflows.mjs` 是上一分支专属GitHub Actions审计。新 `compat-job.sh` 在CI临时同目录执行完全相同旧迁移、种子与旧28/7业务测试，只把原本无可能在新分支找到的旧分支专属Github run查询替换为新F05-8独立68项只读审计；没有修改/跳过旧业务断言。
## CI物理对象
仅新增 `000024_priority_ci.sql`：资格、TTL单例、Priority唯一active及append/history、同周期suppression、handover重试不可变尝试；从原v23完整前21条signed ledger滚动签入新v24第22条。需真PG16注入事务回滚、catalog SHA封印与pg_dump -s。
## 业务验证
8-A01起真实Source：资格/Find分离、current Match候选、created_at仲裁/一客户多Demand、同车唯一、TTL冻结、release/suppression/rearb、tier invalidation/替代Demand、active Lock及hidden/可见、Employee权限、同SHA两个pg_backend_pid的55P03并发、handover异常只补失败与不可变历史、价格/owner/Recommendation无副作用。
8-B01起 HTTPS：真实本地TLS下伪造Priority资格、VIP、客户手机号、数字价、Lock/Transaction和身份Cookie/CSRF/跨域/旧链接均403/404，绝无生产HTTP正向授权。
## 禁止夸大
真实Customer微信会话、正式Priority资格Issuer、Rule/Find/价格/一般批发/上游JYT/Lock资金等缺口仍为SOURCE_GAP。F05/C-H01/V1维持NOT_READY；B不合并main、不入F05-9。
## 最终证据占位
等待最终唯一提交对应8原生Run全部成功、Source/HTTPS4份Artifacts ID/bytes/hash、PG PID/SQLSTATE与真实优先级审计。不得用本段占位冒充最终验收。
