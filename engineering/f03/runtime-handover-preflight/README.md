# F03-2-2G｜SG06客户/业务只读承接预检

遵守A正式施工单，四个内部函数只在一次性隔离PG16+F03-1合成身份下运行。只读核对Customer、Demand、Priority Lease、Recommendation、Consultation、Waitlist、Lock与Transaction；精确经理身份、Team成员、个人permission及能力binding。未知状态或域适配缺失必须DEFER_DENY；不得将pending账本、受限employee.manage或预检输出等同真实业务交接。无DDL、无客户Owner/业务负责人/账本/权限/审计修改，不新增正式HTTP或第三方路由。正常F03-1会话时间戳更新不视为业务写。
