# F03-2-1B｜B自验、结构差异与A复验交接

日期：2026-10-09。**B执行范围仅 F03_2_1B_AUTHORIZED，F03_2_1B_ACCEPTED=NO，F03_2_ACCEPTED=NO，PRODUCT_BASELINE=NOT_READY。**

## 起点与合法范围

- A放行原文：`main/07_重建工作区/F03-2-1B_A主控成果合并与客户范围隔离施工放行_2026-10-09.md`；从含正式放行的main `e6d7787829e04c0b150e0ff98748a4b52a40881a`新建`feat/f03-runtime-scope`。
- 变更只允许`engineering/f03/runtime-scope/**`与`.github/workflows/f03-2-1b-runtime-scope.yml`。旧F02 000001/F03-1 000002及80表原Guard、1A事实读取器、权限政策、所有旧CI、Authority均不修改，B不合并main/C。
- 新DDL由SG01正式批准：`employee_capability_scope_bindings(employee_id BIGINT,permission_id BIGINT,scope_id BIGINT,granted_at TIMESTAMPTZ,ended_at TIMESTAMPTZ)`五列；`PK(scope_id,permission_id)`、`FK(permission_id)`、`FK(scope_id,employee_id)`、CHECK结束不早于开始、新(employee_id,permission_id)索引、旧employee_data_scopes唯一(scope_id,employee_id)。**除上述外无SG02～08结构**，旧迁移历史不覆盖。
- 单独新`000003_employee_capability_scope_bindings`及 `000003.manifest.json`。只在当次一次性CI PG16，由已验收旧runner先精确建立/验证80表，再由新runner原子追加。旧Guard必须实际拒绝81表；独立新Guard拒绝非完整物理指纹与非三迁移链。

## 物理结构不变与新增差异

| 字段 | 旧 000002 | 新 000003 | 准确物理差异 |
|---|---:|---:|---|
| 用户业务表及CI封印总表数 | 80 | 81 | +1 approved scope bindings |
| SQL列数 | 487 | 492 | +5 新表列 |
| PG约束数 | 299 | 304 | +5（旧scope UNIQUE、PK、2FK、CHECK） |
| PG索引数 | 123 | 126 | +3（unique,PK,nonunique） |
| 物理完整结构指纹 | `8af70f5f3ca32f2a7b84a4ad69d68dbf7c81bd9b6c97d79ad7481ce3a8c23ee5` | `229aa6dc167cd3ccb8da89fd9d08076af2588b6b4bd1cfbdc8d779c31dfeffe0` | 固定于正式manifest，不动态采信运行库 |
| 新SQL SHA256 | — | `fe34a689d4b11d5c4225f609f1415a26b16ec43891e5723b417ca45aa9a154d0` | 由CI真实回滚型DDL得出后冻结 |

- `old-structure.json`、`new-structure.json`记录`getPublicStructure`的实际全定义对象列表；`evidence.mjs --check`逐对象比对，**旧对象不得消失或变更定义**，新对象只能是被批准的SG01项。新表还会出现新索引对应的6条物理index列属性——总增量为23条全目录条目（4 relation + 11 columns含index列 + 5 constraint + 3 index）。
- `pg16_schema_only.sql`、`pg16_inventory.json`、`sha256sums.txt`均由**同最终SHA的CI**实际导出，`node:crypto`按原始文件逐字节复算哈希；禁止用另一CI附件冒充。同次CI还检查原始F02→F03-1校验和、三个迁移版本与当次run封印。
- 真正CI运行/Job ID、三作业状态与以上附件的准确URL请A以本文件最终提交SHA对应GitHub Actions核对；任何中间成功CI不能代替最终HEAD CI。

## 验收与测试目录

- `测试覆盖表.tsv`逐项列出M01-M06、S01-S07、H01-H02、E01-E02及安全回归R01-R02；真实数据库迁移（并发/回滚）与受信登录、逐能力scope/object状态、4S/Admin硬禁令、SQL FK/时间约束、实时撤权和真正HTTPS先允许后拒绝。
- 旧真实登录集成11项与HTTPS安全4项各使用自己的全新80表PG16数据库及run封印，不在新81表库伪装旧认证守卫或关闭旧版本Guard；全都运行原旧代码原测试。
- CI测试专用HTTPS仅绑定127.0.0.1，不加入旧server、不发布正式客户/电话API，只有最小allowed/code判定；完全未修改电话内容和customer_id/owner/来源/主要手机号业务事实。

## 未闭合风险（不可隐瞒）

1. 本批只对`customer.phone.manage`→`customers`显式`scope_kind=object`真实范围验证；其他22个F03-G0动作、Store/Team/Global/Owner/Responsible来源及4S车辆范围均仍DEFER。
2. F03-1会话锁和单条SQL快照能证实**撤权已提交后下一次请求**拒绝；**敏感业务写提交**防TOCTOU、跨域治理版本同步/审计、交接与最后管理员/接客者锁不在本批，不可冒称完成。
3. 本次仅独立CI临时PG16合成fixture，不是生产环境、已有库、正式HTTP路由或客户级实际授权数据迁移。生产上线、真实数据校验、发布人电话关联与身份主要手机号绑定一律未授权。
4. 000003 rollback仅限CI库且非空绑定时必须拒绝；不提供既有/生产库一键降级。外部接入、部署、治理/全部23动作逐范围范围Guard须另行由A与用户批准。
5. `TECH_ALIAS_PENDING_A`其他动作继续DEFER；不能借这次SG01授权扩展CRM、lock、transaction或电话内容变更。

**最终状态（只有A可改）：B_READY_FOR_A_REVIEW_PENDING_FINAL_CI，F03_2_1B_ACCEPTED=NO。**
