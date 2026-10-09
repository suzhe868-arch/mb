# F03-2-2M｜A主控正式施工单：SG06 Transaction交易负责人单域移交、资金终态守卫与六域全局请求编号

> 日期：2026-10-10（新加坡）｜A_TECH_ADJUDICATED / RELEASED_FOR_B / B_NOT_STARTED。
> 唯一B施工分支 feat/f03-transaction-responsible-handover-2m。从执行时最新main建立，已经存在须先核对沿用，不得reset/强推/直接main施工。B一次性完成代码、全部PG16真实测试、常规错误整改、结构证据和中文交接，最后READY_FOR_A_REVIEW并把NEXT_OWNER切换A；B不得自行合并PR或开始后续批次，不需要用户逐项批准普通工程修复。

## 一、唯一Authority、数据封印和可施工路径

以 PDM-19_最终完整规则.md §§6～10、18～26、27～30 为Transaction/Deposit/Refund唯一业务Authority，以PDM-03 Final§11～14逐项交接/历史不可变、PDM-02 Final当前授权+精确Team/store/customer scope+personal deny，PDM-18 Final真实Lock来源，PDM-13/14/15的Priority/Recommendation/Consultation不反写，PDM-25审计横切为冻结规则。真实冲突默认DEFER_DENY交A，不得自行新增产品状态或重写PDM Final。

上批L的A验收PR20 merge SHA 9ed6db2a6aeefb382298460004768edd11df20b6。000001～000012迁移、旧CI、旧manifest、旧SQL、旧原子保护和生产权限种子全部冻结。旧实际PostgreSQL结构为93表、596列、420约束、159索引、2074完整catalog对象；结构SHA 9ab7221f9a0f5f81c0af37441d4cd5b824e2ac7322f8d40f952ba2cecea0e2f9。新施工仅允许新增 engineering/f03/runtime-transaction-responsible-handover/** 和新独立 .github/workflows/f03-2-2m-transaction-responsible-handover.yml。如必须新迁移，只允许000013最多新建一张append-only Transaction交接收据表及从属合法FK、唯一约束、触发器，严禁修改旧表列/约束/enum。新表物理增量、checksum、结构SHA必须真实PG16 discovery并归档，不得预先编数字。

为满足六域全局请求Key双向约束，唯一A技术例外：仅在已签H/I/J/K/L五份旧service.mjs中当前commit/retry跨域Key守卫、新表to_regclass存在性和完整版本seal选用处作最小修改；对各自旧H89/I90/J91/K92/L93独立PG16必须后向兼容，不能修改旧授权、审计历史或业务字段。其他旧文件一律不改。

## 二、对象边界：只能改Transaction一个当前责任字段

旧public.transactions具有transaction_id、source_lock_id、customer_id、vehicle_id、listing_cycle_id、status、responsible_employee_id、completed_at。PDM-19正式状态仅in_progress、completed、cancelled；后两者为终态历史，本批严禁重新移交或复活。合法业务转派只能修改已有in_progress Transaction的responsible_employee_id一个字段；不修改status/completed_at、来源Lock、成交价快照、Customer owner、Deposit/Refund、原创建人与历史actor。

真实Transaction必须有来源Lock，customer/vehicle/listing_cycle一致；Lock→Transaction的实际原子转换已是其他Authority形成的历史，本批不得再创建Transaction、关闭或恢复Lock、修改Lock价格或强造交易占用。Customer owner及来源Lock responsible的普通变化不得自动漂移Transaction responsible。

真实Deposit可有多笔且只有真实收款事实；不得臆造“未结清/已结清/部分结清”主状态。Refund仅pending/refunded/closed，禁止恢复partial主状态或把closed伪造成refunded，退款可能归Lock或Transaction但必须满足XOR真实关系。不得通过交易负责人转派执行或覆盖收退款、改变历史金额、恢复已经结束Lock或把Transaction取消自动还原Priority/Waitlist。in_progress Transaction与pending Refund继续保护客户，不可因owner/public pool变化静默进入公海。若资金、供应异常、账户停用或历史来源事实无法证明，按当前Authority保守拒绝，而不是发明兼容假数据。

## 三、四个精确接口

1. prepareTransactionResponsibleHandover：只读核现存SG06合法batch、精确Transaction item、真实原始责任人/目标/Team、当前活跃受控PC manager/store_head、独立合成permission transaction.responsible.transfer+current capability+精确scope。检验in_progress、当前负责人、关联Customer/Vehicle/cycle/来源Lock及真实Deposit/Refund关系、终态、当前权限和对象资格。拒绝旧登录、System Admin控制平面、4S、普通销售、错误batch、不可证明的资金/来源；不颁发签名commit token。
2. commitTransactionResponsibleHandover：使用现行SG06全局advisory事务锁306/309及M域独立稳定锁顺序，同一真实PG16事务锁住batch/item/Transaction和必要来源/资金可信事实，重验当前会话、独立permission、个人deny、精确Team/store/customer scope、source sudden_inactive受信任批次及接替员工合法资格，仅以CAS更新transactions.responsible_employee_id，严格限定status=in_progress。同步写真实before/after/actor/time/batch/item/requestKey摘要audit、可信append-only单域receipt；五点注错必须真ROLLBACK而不留下Ghost owner/audit/receipt。暂停接客只影响自然新客分配，不能误当管理权撤销。
3. readTransactionResponsibleHandoverReceipt：读权限同样要求当前独立capability+scope，交叉验证receipt真实batch/item/Transaction/customer/source/Team/actor与事务audit字段及时间；同一Transaction两次合法独立batch移交后，早期、后期两个不可变receipt都能被合法当前审计者读取；无可信后继receipt的current responsible漂移和仅FK合法却缺业务审计的伪造receipt必须拒绝。历史原source失活不删除历史，reader当前撤scope/个人deny不可读，不暴露成交价和财务敏感内容。
4. retryTransactionResponsibleHandover：同item+同Key+同完整意图仅返回可验证真实历史receipt，绝无重复写；跨item/batch/Customer/Domain同Key必须冲突，已完成同item不同Key也拒绝，同一Transaction新合法batch可以形成下一次连续独立移交；两个PG16当前合法会话CAS只一笔成功，报错或超时后无部分提交。

## 四、六域全局RequestKey、权限及资金安全

H/I/J/K/L/M六域任意两个分别按“先甲域成功、后乙域同Key拒绝”执行全部30种有向真实PG16案例；六个合法当前PC员工会话同Key并发只能一域成功，六个不同合法Key各自成功。共享SG06事务锁+各域receipt物理UNIQUE+双向收据摘要守卫+完整当前版本seal缺一不可，不得只让M查旧5域而H/I/J/K/L反向不查M；旧各库没有M表时其完整旧版Guard和用例必须照常运行。

新 permission 只在本批CI synthetic fixtures受控注册，不设生产role seed、不借employee.manage或H/I/J/K/L敏感权限。当前session/权限撤销、Team scope expiry、个人deny、跨店精准经理scope与本店店长边界、source失活/recipient失活、同时交易完成取消或退款状态变化都必须测试并保守失败。交易当前负责人不能因为Customer owner、Deposit或供应异常变化自动赋给经理。

## 五、M01～M11真实PG16验收门禁

M01｜冻结旧000001～000012的全部版本/checksum、旧93表596列420约束159索引2074完整catalog与SHA逐项完全不变；新000013最多一张不可变M收据表，实际discover/apply/strict verify/注错rollback/未使用前rollback+reapply/已使用不可回滚真实测试，新物理数和SHA自动测量。

M02｜F03-1合成真实PC当前会话、经理/店长独立permission与Team/store/customer current scope、personal deny、非经理/4S/System Admin/限制会话、跨店越权、接客暂停、source突然inactive受信任与recipient有无资格全正负例。

M03｜in_progress合法，completed/cancelled/未知终态拒绝；真实source_lock的customer/vehicle/listing_cycle一致、Transaction唯一在途占用、原Lock转换事实、Customer失活、供应异常/财务状态不可核实安全拒绝；多笔Deposit/Refund pending、历史refund和成交价不可修改。

M04｜Transaction当前responsible唯一列CAS+同事务audit+append-only receipt、五注错点全回滚、双事务同对象竞争仅一笔生效，返回DENY不能留下写入。

M05｜六域H/I/J/K/L/M全部30方向请求Key真冲突、六真实PC会话同Key一胜、不同Key各成功；旧H/I/J/K/L在旧版DB维持完全封印和真实回归，防止历史模块反向漏检。

M06｜同Transaction两次合法连续交接、早期历史收据仍可靠、审计链独立、不真实伪造FK审计、当前reader撤权/个人deny/历史source inactive后的正反例，completed/cancelled旧成交事实永不改写。

M07｜Transaction status/completed_at、Lock/LockRequest、Customer owner、Demand、Priority TTL、Recommendation、Consultation/SLA、Waitlist、Deposit/Refund/Transaction资金及价格、Vehicle/listing_cycle、公海/SG06 batch/items前后逐行快照一致，只有当前Transaction负责人和新audit/receipt可合法不同。

M08｜**16/16个真正相互独立全新非特权PG16 CI作业成功**：新M真实独立库+旧L93完整29例+K92完整29例+J91完整27例+I90完整27例+H89+G/F/E88+D86+C84+B82双+A81+F03-1认证/HTTPS两个。不能在M新库跑几例就声称旧版本全回归。

M09｜真实PG16自动导出的old/new full catalog JSON、原始pg_dump schema-only、inventory、manifest/全部SHA256、SOURCE源run/source SHA，最新同SHA CI核对所有旧2074键不变、新仅白名单；原pg_dump只有原生严格配对的restrict/unrestrict随机标记允许受控归一，不准上传真实用户/真实资金行或凭证。

M10｜Transaction同时completed/cancelled、账户停用、Team权限撤销、资金/Refund关联状态变化、source Lock关系变化的真实PG16双会话锁/时序测试，事务最后核对当前对象状态，无法证明则必须throw使整事务ROLLBACK；不得重现上批L的提交前TOCTOU漏洞。

M11｜B最后分支HEAD精确等于最终run.head_sha，16/16 jobs逐项completed/success，新M测试与L29/K29/J27/I27旧模块真日志成功，旧/新物理SHA/SOURCE和涉及旧H/I/J/K/L五份service的最小差异中文列明，更新完整B交接B_SELF_TESTED/READY_FOR_A_REVIEW/NEXT_OWNER=A，不得自行PR合并或推进下批。不可实现时fail closed列证据交A而非修改旧产品规则。

## 六、尚未授权

本批不实现真实Transaction创建/完成/取消、成交纠错、交易退款支付、换车、公海释放、员工离职后的真正权限撤销、正式跨域SG06全部completed或生产接口。F03-2整体和C/H01视觉仍未最终验收，PRODUCT_BASELINE=NOT_READY。下一阶段是否做跨域总收口由A在M独立验收后另行批准。

NEXT_OWNER=B / NEXT_TASK=F03_2_2M_TRANSACTION_RESPONSIBLE_SINGLE_DOMAIN_REAL_PG16_16_INDEPENDENT_JOBS_READY_FOR_A。
