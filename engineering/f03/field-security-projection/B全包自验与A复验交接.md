# 名邦汽车 V1｜F03工作包P：B全包自验与A独立复验交接

> 2026-10-10｜工作包：P1字段权益安全投影、P2历史/导出/缓存防越权、P3 F04～F07消费合同。分支：`feat/f03-package-p-field-projection`。
> 当前为B实现与真实CI自验，不等于A_ACCEPTED、F03整体完成或任何正式生产上线。

## 一、严格授权与源码清单

A已放行施工单：`07_重建工作区/F03工作包P_A主控F03-3字段权限与安全投影完整施工单_2026-10-10.md`。新增目录仅`engineering/f03/field-security-projection/`及专用工作流`.github/workflows/f03-package-p-field-projection.yml`；无旧迁移/旧H～N服务/旧CI/PDM Final/正式F04业务API修改；无新增DDL。

- P1服务实现`service.mjs`、CI合成事实`fixtures.mjs`和`tests/projection.test.mjs`，10个正负例：LIMITED批发列表隐藏、DETAIL未解锁绝不读数价、当前周期既有unlock正确读报价、UNLIMITED零扣次、未受信身份deny、无报价价格咨询、名邦非批发正常价、隐藏无grant拒绝、VIN/内价不泄漏和M94完整封印。
- P2测试`tests/security-exports.test.mjs`，6个当下授权与拒绝案例：当前F03-1 PC身份、manager/4S/SystemAdmin隔离、导出/打印/复制/历史/缓存均重验权限，个人deny、capability结束、inactive旧session、跨Team和旧claim越权。服务端白名单永不输出VIN、上游电话、内部批发价。
- P3签署中文内容的`projection-contract.md`、`f04-f07-handoff.md`、`field-capability-matrix.tsv`、`test-coverage.tsv`，F04正式身份/DTO、F05原子额度/价格与独立CRM、F06锁车/资金业务、F07发布人电话和后续H03/H04三端集成分责清楚。

## 二、关键负面边界与安全逆向审查

1. 本P包**仅CI隔离合同**；合成`entitlementAttested`标记绝非真实用户权益签名，不能据此建立微信/PC生产HTTP路由。缺失F05正式等级/模式当前映射与报价类型时必须DEFER，禁止把合成`customer_display`价格种类作为真实生产报价证明。没有可信合法数字报价时只显示「价格咨询」。
2. 普通LIMITED批发列表一律无数字价格；没有本周期既有合法unlock时详情返回`P_NEEDS_F05_ATOMIC_UNLOCK`，不扣账、不增额度、不创建unlock；UNLIMITED由未来可信权益源确定，不把普通/粉丝/VIP硬编码成永久价格开关。名邦/4S独立于批发额度。
3. 发布人联系能力依现有PDM-09出版人ID和原敏感能力；**不新增can_call_wholesale_phone**，不从车对象可读权限推导电话。无当前独立内部底价权限及合法对象scope时客户/4S/控制面和员工安全输出均不返回底价，不能偷用client隐藏。
4. 旧session/旧导出任务/旧缓存不具备持续鉴权；本CI服务在每次服务器输出时重验当前PC session、授权/override、当前Team membership和scope。历史上当过manager并不会保留未来敏感资格。已在终端保存的旧字节不可能由服务端收回，列为H03/H04真实联调义务。
5. 对没有正式签发的F04车辆team归属、F05额度原子记账、F06 Lock退款、F07采集Publisher/CDN映射不创造新SQL字段，明确交下游。未实现正式微信认证、微信客户端前端、生产HTTP、实时JYT、真实资金及交易。

## 三、首次最终代码CI实证与物理不变式

- P源码（含当前安全修正）提交：`e14a1122f23bc0c577321c8094cea0cf34fc520e`，同SHA真实[GitHub Actions运行38020096708](https://github.com/suzhe868-arch/mb/actions/runs/38020096708)：**completed/success、19/19相互独立PG16工作作业全部success**；P1 **10/10**、P2 **6/6**，原N94 **21/21**、M94 **31/31**、L/K93/92 **29/29**、J/I91/90 **27/27**及其余11项旧冻结独立回归全成功，0失败。
- P专用两项作业均使用原M94版本和真正非特权独立PG16，每项获得原M完整目录`F03_2M_EVIDENCE_FULL_CATALOG_PASS`和N原始`F03_2N_ORIGINAL_FULL_CATALOG_AND_INVENTORY_BYTE_PASS`；物理仍94表、608列、435约束、163索引、2120项，原SHA`7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659`。
- GitHub Actions原始原生pg_dump/schema-only、目录、inventory、SHA校验值、完整安全回归测试日志均在该运行的两项P独立作业及artifact中，来源分别明确，不把合成场景当生产授权。

**严格最终版本门禁**：本中文交接会形成新的分支HEAD。仅当该最终HEAD本身同SHA的最新GitHub Actions确实completed/success并为**19/19**独立真实PG16作业全部成功，才视为本P包B_SELF_TESTED / READY_FOR_A_REVIEW。若最新run未完、CI失败或仓库实际HEAD漂移，本报告前述源码成功只能算阶段证据，不能提前通知A已可验收。

## 四、仍未完成及包间隔离

P包不依赖尚未合并的G新000014和治理实现；G/P不得自行合并main。工作包V尚未签发。真实生产身份、额度扣减、正式车辆价格、权限Cache API、手机号及前端联调均按P3交接待F04～F07/H03/H04独立实施和验收。F03-2整体、C/H01高保真及产品基线`NOT_READY`。

最终提交同SHA CI全绿后：**B_SELF_TESTED / READY_FOR_A_REVIEW**（须与G包共同交A集中验收）；`NEXT_OWNER=A`。B不自行合并。
