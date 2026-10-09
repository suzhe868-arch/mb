# F03-2-2G｜SG06客户/业务只读承接预检

遵守A正式施工单，四个内部函数只在一次性隔离PG16+F03-1合成身份下运行。只读核对Customer、Demand、Priority Lease、Recommendation、Consultation、Waitlist、Lock与Transaction；精确经理身份、Team成员、个人permission及能力binding。未知状态或域适配缺失必须DEFER_DENY；不得将pending账本、受限employee.manage或预检输出等同真实业务交接。无DDL、无客户Owner/业务负责人/账本/权限/审计修改，不新增正式HTTP或第三方路由。正常F03-1会话时间戳更新不视为业务写。

## 2026-10-10｜A-G-01～04 整改边界

源员工突然inactive时既有可信planned_disable/sudden_inactive账本仍可在当前显式Team授权下只读扫描；身份/Team已失效则HANDOVER_AUTHORITY_GAP。模拟提交增加固定顺序表锁（防幻读）、逐对象FOR SHARE行锁及超时拒绝，所有输出继续writeDenied:true。缺项MISSING_ITEM、真实PENDING_ITEM与跨批重复CONFLICT各自区分，外国Team域只报告聚合OUT_OF_SCOPE_DEFER_DENY，不返回对象ID、负责人或状态。真实隔离PG16针对这四项分别新增测试，无业务写/DDL/正式交接。执行与最终数据以本目录交接和最新SHA成功CI为准。
