# F05-7｜匹配资格、四级结果与生产来源缺口

本工程只允许运行于真实、独立、可抛弃的 PostgreSQL 16 测试数据库，所有正向规则和车况样例明确标为 CI_SYNTHETIC_MATCHING_INPUTS_NOT_PRODUCTION。

只有 Customer active、Level 当前找车权益 ON、正式 Demand active、销售匹配描述已保存且词典能形成可执行标准条件，才可创建 Match Result。

四级顺序：任一明确硬不满足 no_match；没有硬失败但硬事实缺失 confirmation_needed；硬满足但偏好失败或合法宽容 acceptable；全部满足 high。预算采用分单位整数 BigInt 计算 100% 和 105% 边界；六类禁自动匹配字段不参与硬条件。hidden 不等于 offline；占用事实不等于可新锁车权。

## 未闭环生产签发来源
- CUSTOMER_WECHAT_SESSION_TO_APPLICATION_ACTOR_SOURCE_GAP
- CUSTOMER_PHONE_AUTHORIZATION_ISSUER_SOURCE_GAP
- F05_6_PRODUCTION_LEVEL_FIND_ENTITLEMENT_ISSUER_SOURCE_GAP
- F05_6_DEMAND_ACTIVATION_PERMISSION_CURRENT_SCOPE_SOURCE_GAP
- F05_7_SALES_DESCRIPTION_AND_RULE_MANAGEMENT_ISSUER_SOURCE_GAP
- CUSTOMER_DISPLAY_NUMERIC_PRICE_PRODUCTION_SOURCE_GAP
- GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION
- IMAGE_LOCALIZATION_SOURCE_GAP

Match Result 不自动创建 Recommendation、Priority、Grant、Lock、成交、价格扣额或修改 Customer owner。生产全部 fail-closed；F05、C-H01、V1 仍 NOT_READY。
