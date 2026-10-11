# F05-6｜SOURCE_GAP与生产入口阻断记录

1. `CUSTOMER_WECHAT_SESSION_TO_APPLICATION_ACTOR_SOURCE_GAP`：当前缺真实微信code→稳定Customer的受信签发链，HTTP请求体customerId/hasPhone/isFan不可作为证据。新WeakSet Customer Actor是进程内CI合成对象。
2. `CUSTOMER_PHONE_AUTHORIZATION_ISSUER_SOURCE_GAP`：M94仅有customer_phone_facts物理事实，不能证明真实合法的手机号授权/绑定Issuer。v22正向使用明确合成bytea哑数据，不包含真实号码。
3. `CUSTOMER_OWNER_REFERRED_ASSIGNMENT_POOL_SOURCE_GAP`：现有current_owner能用于合成Owner时序审计；无Owner时不能凭伪造分享/转介绍/池标签临时分配，保持拒绝无responsible Application。
4. `F05_6_PRODUCTION_LEVEL_FIND_ENTITLEMENT_ISSUER_SOURCE_GAP`：M94只有Customer Level身份，没有正式level→find_enabled权威可配来源，本批只增加隔离CI合成权益配置，不复用F05-4的price_mode。
5. `F05_6_DEMAND_ACTIVATION_PERMISSION_CURRENT_SCOPE_SOURCE_GAP`：虽然F03 Employee current Session、current scope物理结构已有签名，`demand.activate`业务生产权限Issuer仍未完整签发；本批在CI合成权限码`demand.activate.ci.synthetic`上演练真实权限/Owner竞态；不开放真实Employee人工激活。
6. 继承`F05_5_EMPLOYEE_ADDITION_SOURCE_GAP`、`CUSTOMER_DISPLAY_NUMERIC_PRICE_PRODUCTION_SOURCE_GAP`、Recommendation免费Issuer、一般批发经营Owner、隐藏重算、图片资产化、JYT/资金/电话。

隔离loopback HTTPS只在`/__ci__/f05-6/**`有效，所有客户提交Application及员工激活Demand真实HTTP均拒绝，无`/api/`生产路由200；不得暴露原Phone ciphertext、VIN、批发价、JYT Token和真实个人信息。

**整个V1与F05/F04生产及C-H01高保真仍NOT_READY。**