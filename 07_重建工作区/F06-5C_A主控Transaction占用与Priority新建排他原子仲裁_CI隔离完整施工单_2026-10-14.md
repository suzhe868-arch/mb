# 名邦汽车 V1｜F06-5C A主控正式完整施工单：在途Transaction与新Priority准入原子排他（仅隔离CI）

> 2026-10-14 A技术放行：`F06_5C_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_5C_TRANSACTION_PRIORITY_ADMISSION_ATOMIC_GUARD_CI_ONLY`。本工作单仅执行已签PDM规则下的工程保障，不批准真实数据、产品规则变更、生产接口、资金动作、UAT或上线。

## 1. 前置与Authority
1. 产品最高依据：PDM-19 Final§15规定**in-progress Transaction禁止新Priority、active Priority经合法Transaction后结束、Transaction取消或纠错不得复活旧Priority**；PDM-13 Final Priority仲裁/TTL/锁车边界；PDM-02员工身份+独立Permission+Data Scope+Object State，PDM-17公海保护、PDM-18合法Lock、PDM-25不可变审计，现行Current IA和Current Low-Fi。
2. 唯一正式父：F06-5B PR61已于2026-10-14 A独立验收并标准merge；唯一B HEAD`c7ab2336a425075b4ac4cfaf7203e2987deab98a`、merge SHA`1a9b87a2e109190fff0380bbe85e7702a95dcd5e`；21/21同SHA真Push、94/94非特权PG16 Job(H52 52)、Source54/54、HTTPS9/9、94有效原生Artifact及旧188表双OID Seal。A完整报告见`07_重建工作区/F06-5B_A主控独立验收21条Push94项PG16与94工件_PR61标准合并正式报告_2026-10-14.md`。
3. 技术缺口：5B版本化`syntheticNewOccupancyGuardCI`只提供“调用方在同Vehicle锁内自行原子复验”的CI守卫，尚非原Priority正式签发入口；F06-1原已完成Priority→Lock时`converted_to_lock`签名终止，F06-3B旧入口仍有历史pending退款漏洞。本单**只验证Transaction占用与新Priority的原子准入互斥边界**，不擅自改动旧正式Priority实现，不把“查询无交易后独立调用旧Priority API”视为安全。
4. 真实父结构若无法在同PG事务与Vehicle锁序下安全调用原Priority来源/签发，必须输出`UPSTREAM_PRIORITY_ADMISSION_ATOMIC_SOURCE_GAP`并保持拒绝，B须提交实证，不得伪造PASS。

## 2. 工作分支和绝对边界
- 从开工时GitHub真实最新main（不得硬编码历史head作为起点）新建独立`feat/f06-5c-transaction-priority-admission-ci`和PR，只允许**新增**`engineering/f06/transaction-priority-admission-ci/**`及`.github/workflows/f06-5c-*.yml`。不修改旧F05/F06父源码/Workflow、公签DDL、24旧迁移Ledger、生产权限Issuer、客户/车源真实服务、PDM/IA/Low-Fi与main。旧签历史不得改写。
- 环境：真正GitHub`event=push`，仓库、分支、SHA签名，非特权可销毁本地PostgreSQL16，F03-1和F05-2双隔离确认；网络仅loopback TLS；仅合成Customer、Employee、Vehicle、Lock/Priority/Transaction与假资金，不接银行/微信/JYT/飞书真实凭据。新版本Sidecar独立签名，不覆盖任何父Seal。
- 统一正交门禁：不同Employee与Customer身份、店/团队Scope、独立权限、状态、版本号、真实物理PG两Backend、锁序、注错回滚、审计和重放；生产/付款/退款/completed/correction路径全部FailClosed。

## 3. 原子测试目标与最小反例
1. 新准入Adapter必须在**同一真实PG物理事务**先锁Vehicle、复验当前有效listing_cycle/Vehicle/Customer与实际有来源签名的in-progress Transaction（public和独立F06-3B/5B来源双读），只要交易占用则绝对不可签发新Priority，即使用户为交易原Customer、具高等级或经理/店长，也不得绕开；丢失上游签名FailClosed。合法无交易、资格及独立来源通过时才可用版本化隔离Priority签发。
2. 已在F06-1合法Priority→Lock的原Priority（带`converted_to_lock`原子签名）在转换Transaction后不得恢复；取消Transaction后仍不复活旧Priority，Vehicle只按当前真实可售、cycle和其它业务Guard重新仲裁**新**Priority。旧Priority历史和Owner、Recommendation、Price/Deposit/Waitlist不可被误写。
3. 两独立真实PG Backend在同Vehicle同listing_cycle竞态：A申请新Priority、B由合法active Lock转5B安全Transaction，锁序确定且至多一个合格结果；败者拒绝且0半写/0幽灵占用。分别覆盖Transaction先COMMIT、新Priority先完成、交错锁超时、授权中途撤销、会话失效、重复/异Key、跨customer/cycle、并发不同Vehicle不受误阻。
4. 并发验证应证明**真正存在的Authority关系**，若“先成功Priority再交易”的后继缺乏真实合法Lock/来源，不可制造非法Transaction强凑双赢反例；应先合法结束/转换Priority并建立Lock，再走新Transaction。不能为方便测试删弱Priority来源。
5. 当只有已终止Transaction、无当前占用时，不能简单当成所有顾客必然可Priority；仍重验PDM-13规则、真实Source/Visibility、Match、Scope、公海保护及Lock/Waitlist占用。对未知资金、签名缺失、旧3B未保护路径、已完成真实资金一律只拒绝，不创造事实。
6. 必须保留冻结父5B S53–54真实危险基线以及新版拒绝、新旧F06/F05回归，不得以注释/替代Runner/改父workflows绕开。并验证HTTPS非生产路由9项生产Issuer拒绝。

## 4. 独立验证门禁
- 新本域真正PG16 Source **≥36** 正反/竞态/权限/注错测试、HTTPS loopback TLS **≥9**；父5B Source54/HTTPS9和5A Source82/HTTPS9、上游源签名必须独立回归。
- 上批21条真Push/94个PG16 Job（H52原生52/52）在本最后SHA原样重验，再新增Source+HTTPS各一个Job：目标**22/22同最终HEAD真正GitHub Push工作流成功、96/96真非特权PG16 Job success**，≥32个同HEAD有效非空未过期官方sha256 Artifact。父Runner签名环境桥接必须显式验证真实当前5C分支，不能偷换GitHub event/SHA/Job或跳过旧父测试。
- 新Sidecar DDL真注错ROLLBACK；在两个独立物理PG库真实销毁重建审计后，至少**192张旧public/D1/F05/F06父实体**逐表全行COUNT+MD5一致、24旧Ledger、公共Catalog、D1及前十父Sidecar原字节Seal不漂移；记录数据库两OID、独立PG backend PID、每项原生Job/Run/Artifact ID及SHA256。
- 提供中文`B自验与A交接.md`、`来源与权限矩阵.tsv`、逐项原生证据与真实负例/残余SOURCE_GAP，自查TOCTOU、锁序、role/deny/scope撤权、旧代码冻结与无生产Issuer。所有失败包内自修后在末次HEAD重新完整回归。

## 5. 交接标准与风险禁令
- B完成全部包级真实代码/隔离PG16测试/安全反查、同末次SHA官方全绿和可追溯证据后，独立PR正式`F06_5C_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`交A；**B绝不合并main**，A独立验收后方可标准PR merge。
- 任何需要真实Priority/Transaction签发来源但既有父契约不支持的部分，标`SOURCE_GAP/BLOCKED_UPSTREAM`并提交精确触发条件，不得虚构生产完成。禁止生产Transaction/Refund/Priority Issuer、真实客户或员工账号、真实收退资金、`refunded`、`completed`、银行卡/微信、UAT/部署/迁移、F06-3C-2/F07/F08。F05/F06域、C/H01、V1继续`NOT_READY`。
