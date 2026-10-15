# F07-1｜B首轮反向安全审查清单

> 范围：仅新建CI侧车与合成HTTPS回传。GitHub原生CI尚待核验；此清单**不是验收结果**。

- [x] 保留方向 Collector → 名邦 Integration，未接真实JYT或生产Collector。
- [x] 发布人复合键为 `source_platform + upstream_publisher_id`，不使用车码及单车缓存主键。
- [x] 每次员工敏感访问从独立PG16侧车的当前Employee/Session/Vehicle/Scope事实重新读取并锁定，默认拒绝4S与Admin业务身份。
- [x] 电话能力复用 `publisher.phone.sensitive` 的合同语义；没有创建新产品权限位。
- [x] 回传签名、时间窗、nonce、request_id与publisher绑定；仅TEST合成号码可存储；最新失败不空覆盖。
- [x] 单Publisher当前缓存/历史、pending job唯一约束、事务行锁；audit不存号码；端侧拨号仅抽象为系统拨号器标识。
- [ ] GitHub官方最后唯一SHA上的真实非特权PG16 Source/HTTPS两Job成功与官方Artifact核验。
- [ ] 证明生产版真实F03 Employee Session/Scope和F04 Integration路由实装：**本次未授权，SOURCE_GAP**，不得冒称完成。
- [ ] 依据PG原生红灯修复后输出最终B交接报告。

任何未获得真实PG16通过证据的项不标 `READY_FOR_A_REVIEW`。
