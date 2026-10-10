# F03-V｜下游工程正式接口消费与闭环责任表

> 2026-10-10。此文件只记录A已签既有F03合成PG16技术成果与真正未完成项。任何下游模块仍需独立正式施工单、真实端到端PG16/浏览器/小程序UAT，不得凭V安全测试通过就宣称正式业务已实现。

| 承接方向 | 已提供的受限工程能力 | 必须真正施工/验收的消费合同 | 失败时的当前安全终态 |
| --- | --- | --- | --- |
| F04｜身份、PC、CRM和正式HTTP | F03-1隔离PC login/sessions、即时撤权；F03-2当前角色/Team/个人deny与G人员治理CI | 生产授权源、正式微信customer_identity、真实session中间件、员工与SystemAdmin控制面分离、当前CRM Customer权与对象Scope、正式前端请求/导出审计、员工实际停用/调店审批和通知 | 无权威现时对象/有效session一律拒绝，合成`CI=true`及`entitlementAttested`永不成为生产HTTP鉴权凭据 |
| F04/F07｜员工读车辆及4S商户业务归属 | P在M94员工业务车辆出口严格`P_VEHICLE_SCOPE_UNPROVEN` | 真实`vehicle_id + listing_cycle_id`到最新`source_type + merchant/4S/store/team`的可信签发来源；员工当前角色、独立Vehicle读/编辑、导出/打印/历史/缓存权限、scope/个人deny/ownership变更后的撤权 | 任何Team CRM读权限、source_type、`created_by_employee_id`、客户端teamId或公开可见性都不等于Vehicle归属，证据缺失一律不输出业务字段 |
| F05｜车辆报价、客户等级、配额 | P客户侧LIMITED批发列表隐藏数字报价、详情无本周期unlock只返回`P_NEEDS_F05_ATOMIC_UNLOCK`；UNLIMITED无扣次；名邦/4S独立状态；优先推荐从Demand派生 | 服务端正式普通/粉丝/VIP到LIMITED/UNLIMITED的当前策略与可配置每天额度、销售增加次数；严格原子账本和幂等`unlock`/当前挂牌周期；真实报价`price_kind`及加价规则；等级改变即撤权 | 未签真实报价/权益时拒绝数字价；原测试`customer_display`和`entitlementAttested`不算真实报价与授权，绝不先显示后客户端隐藏 |
| F06｜Lock/Waitlist/Transaction/Refund | L/M真实合成领域负责人变更与锁车有效期/真实转换原因守卫；G真实收据链/资金阻断与事务回滚 | 正式锁车申请→审批→默认3天锁车→到期/后补，真实Deposit/Refund/Transaction状态机、金额、并发/超时及不同Role和客户主体授权，业务资金审计 | 不因F03中员工有业务责任就允许正式资金动作；有在途退款不得解除关联人员治理或虚构财务完成状态 |
| F07｜JYT/Collector/Publisher和CDN | P客户/员工输出不含内部批发价、VIN、发布人电话；现有敏感能力按发布人ID计算原则 | 真实`publisher_id/upstream_publisher_id`取得当前合法号码、上游缓存有效性、敏感角色+当前Vehicle对象授权、系统拨号；微信小程序受信自有域名图片/CDN转换及资产化/采集异常 | 不再恢复`car_code`或新增`can_call_wholesale_phone`；缺Publisher来源/单独能力/团队对象范围不得下发号码 |
| H03/H04｜C/E/P三端及浏览器 | 只提供CI安全投影和禁止字段清单，没有高保真前端UAT | 所有页面与真实F04～F07后端接入后重新渲染，普通无数字价、粉丝/VIP动态价格、锁车/候补/优先级、复制/打印/导出与撤权缓存即时失效，旧页面/微信分享内容重新拉取 | 本地已保存的旧截图无法远程销毁；应对过期缓存不可再次用作授权，严禁把旧Response直接再发新用户 |
| C/H01｜视觉设计 | B只履行工程包技术证据，不决定审美方向 | 真正H01/H02高保真浏览器渲染与用户视觉验收独立于V；C用已确认4:3车辆照片及页面风格，工程与设计按A安排后续对齐 | `C/H01=NOT_READY`，不借V24个PG16测试宣布UI通过 |

## 必须独立承担的风险登记

- 旧的45 Capability和14 Governance是承接候选，不是“59个F03必须全部写正向业务API”。当且仅当本V矩阵标`F03_ACCEPTED_SCOPE`时，也只承认已有A签的CI合成边界；`F03_STILL_OPEN`归A独立技术裁定；`OWNED_BY_*`需下游确切工作单+具体独立验收/用户UAT。
- `employee.receiving.manage`与当前最后可接客保护、`employee.handover`与完成SG06合成批次/多域immutable receipt、`Priority`和正常Demand、`SystemAdmin`与普通员工权限作用域不能相互混用。
- 正式部署必须单独许可，包括用户真实数据、微信/JYT/飞书凭据、生产密码及手机号、资金/余额和迁移/删除；此次V工作包的`B_SELF_TESTED`不授予上线权限。
- 下游上线门禁由A结合F03技术范围最终签收、C/H01用户视觉验收、F04～F07/UAT与真实法律/安全边界决定；任何失败保留现在的服务器安全拒绝，而非补“先开放再说”。

参考：`coverage-current.tsv`每条下一owner、`safety-negative-assertions.tsv`逐项否定条件、`schema-boundary.md`严格M94/G14版本分离。
