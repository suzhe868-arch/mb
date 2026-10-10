# 名邦汽车 V1｜F03 工作包 V：B 全包自验与 A 独立复验交接

> 日期：2026-10-10（Asia/Taipei）。唯一正式施工单：`07_重建工作区/F03工作包V_A主控工程覆盖核账跨模块总回归与后续承接完整施工单_2026-10-10.md`。执行分支 `feat/f03-package-v-coverage-final-gate` 从正式main `0b52030add22514dd7404837bc65b980727242cb` 独立建立。
>
> **严格状态门禁**：V所有文件形成的最终分支HEAD对应GitHub Actions完整24/24真实独立非特权PG16作业必须实际`completed/success`且run.head_sha===branch HEAD，才可标`B_SELF_TESTED/READY_FOR_A_REVIEW/NEXT_OWNER=A`。否则本报告仅为施工和自验过程材料，不得向A冒称已完成。请以PR所绑定最新CI实际结果核实。

## 1. 原 A 正式放行范围和独立性

已先核：G PR23及P PR24均经过A二轮完整验收合并main；其正式证据分别是G final `19af2955d81ac14d79e0c4e6adc661a3a1aabd8e`／Actions38025357614 20/20与P final `97087f2aab4dcb7ad94cd5ea6cc4777b76900459`／Actions38024572379 19/19。V仅创建 `engineering/f03/package-v-final-gate/**` 与专用工作流 `.github/workflows/f03-package-v-final-gate.yml`，不改任何旧F03-1、H～N、G/P服务、旧CI、迁移、PDM Final、F04～F07正式代码、权限种子，无000015或新增DDL，不触碰生产。

## 2. V1 59行独立核账及残余处理

- `coverage-current.tsv`：对应旧快照45 Capability+14 Governance，每条保留编号、名字/正式Authority、当前授权/硬拒或未来owner、真实源码路径、CI来源、安全负断言和当前数据作用域；已反查并修复指向不存在的三个旧服务路径。24条归`F03_ACCEPTED_SCOPE`（**仅A已验收CI合成技术范围**），3条`F03_STILL_OPEN`须A核定独立安全实现范围，21条`OWNED_BY_F04`、2条`OWNED_BY_F05`、5条`OWNED_BY_F06`、4条`OWNED_BY_F07`。旧53条DEFER_DENY不是当前进度。
- `safety-negative-assertions.tsv`：59行禁止宽放的事实或后续合同；明确是动态旧模块PG16证据、CI限定Guard还是`DOWNSTREAM_UNVERIFIED_CONTRACT_ONLY`，绝不宣称逐条真实生产测试已跑。
- 对普通LIMITED批发列表不出价、详情无当前周期F05原子unlock不得出数字、UNLIMITED依可信现时权益非等级字符串永久硬编码、4S内部价与员工对象导出一律因无归属证明拒绝、PublisherID拨号不得恢复car_code、Priority仅合法Demand派生不延TTL、G planned与emergency顺序区别、复职不复活旧Session/owner/role/Scope、Refund在途阻断、最后接客与SystemAdmin控制面隔离均逐条交叉审查；严格保留旧真实权限/内价/财务/角色/缓存硬拒。

## 3. V2 24个真正独立PG16组合工作作业

新CI `.github/workflows/f03-package-v-final-gate.yml`只在指定V分支触发，带24份各自GitHub Actions独立PG16 services，每份新库不同数据库实例；旧17完整N/M/L/K/J/I/H/G/F/E/D/C/B/A与F03-1身份及HTTPS80岗位测试，G1/G2/G3原版16/7/4，P1/P2原版10/11，V-Evidence和V-Composition两个额外真实测试。CI不借在G14上调用P/M94旧服务伪装兼容。

- `v1-evidence.test.mjs`真实M94独立库（在本V job另先执行原P1完整10项）：物理sealed M94、反向G14不兼容，59行源矩阵结构与负断言检查、真实F03-1初次密码变更/重新登录、LIMITED和UNLIMITED合成权益安全、批发/名邦/4S员工Vehicle business view/export/cache对象归属缺证一律无字段、跨来源变化和当前个人deny/停用旧会话防重放、旧M94对`completed`状态数据库CHECK硬拒。
- `v2-composition.test.mjs`真实G000014独立库（在本V job另先执行原G1完整16项及真实旧H收据/原N只读）：验G14完整物理及反向M94结构拒绝、Customer真正不可变H receipt→G item/batch completed→audit→计划disable撤旧session、合法`77→4→6`多次交接全链证明与未经receipt直接改owner拒绝、跨batch Priority和部分SG06不可冒全完、退款/财务只读无假变更、证明G14绝不自动扩大P/M94数据输出权限。
- 每个V新Job生成**独立原生完整`pg_dump --schema-only`、`full-catalog.json`、原始N/M source inventory副本、SHA256sums、测试完整日志与两版本目标指纹**，保留真实GitHub Actions原生Artifact 30天，不用截图或人工说明代替PG16原始字节。
- 严格物理：M94旧000001～000013恰好94表608列435约束163索引2120对象，SHA`7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659`；G000014同数量，只有`handover_items.status`和`handover_batches.status`的2 CHECK变化，SHA`863538a8dd81e85c8f50bec2d18ad714f6c3d87abf3b10844a3c80421d54cdb1`。
- 过去首轮旧版本 #38026882572 中旧17+G3+P2+V-Composition共**23/24成功**，额外V-Evidence有4项测试断言失败；B定位并修复自验误把`next_owner=F04`这类合法短代号判为空值，以及V独立合成PC账号没有先完成F03-1首次改密并重新登录。旧服务/权限校验均未放宽。**此历史运行只作整改过程证据，不能当最终通过**。

## 4. V3后续承接与A仍需独立判断

成果：`schema-boundary.md`（两个不同版本完整物理校验与不得假组合）、`f03-final-stage-gate.md`（59条统计和F03阶段候选/3项未签技术问题）、`downstream-handoff-F04-F07-H03-H04.md`（正式业务消费合同和对象/权限缺证硬拒）、本交接与两个TSV、两个额外真实PG16测试。
当前阶段仍无法声称真实员工调店、正式Vehicle对象导出、账户/资金/微信/客户额度/敏感电话/JYT、正式小程序端业务已实现；不能以CI执行成功清空F04～F07和H03/H04/C/H01未完成项。F03整体是否能够技术阶段正式签收**唯一决定权归A**，不得把`B_SELF_TESTED`冒充`A_ACCEPTED`。

## 5. PR与最终版本一致性

待最后一次真正全绿的GitHub Actions Run产生后，B应先核：
1. `branch HEAD == run.head_sha`；
2. `run.status=completed`且`conclusion=success`，**24/24 jobs success，0 failed/skipped**；
3. V-Evidence/V-Composition日志`# fail 0`，G1 16、G2 7、G3 4、P1 10、P2 11、旧原17全独立，两个真实物理checksum和旧Source字节PASS；
4. git diff仅白名单目录+专用workflow，最终原始证据和完整交接可供A独立浏览。

以上全满足才是`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`，由A决定F03技术阶段和PR正常合并；B不擅合并main、不启动下一生产批。**产品基线`NOT_READY`。**
