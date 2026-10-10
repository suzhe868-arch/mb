# F05-3A｜A首次审核后的 System Admin→4S单成员首发受信技术桥接

> 技术出处：`07_重建工作区/F05-3A_A主控首次独立审查4S受信来源缺口技术裁决与定向补证施工单_2026-10-11.md`。以下是隔离CI PG16的技术补证；不是生产许可、不修改正式PDM Final/IA/Low-Fi。

## 一、物理可信来源与互斥业务角色

- System Admin 必须使用现有F03-1的`system_admin`真实密码校验和`withSession(normalOnly)`，校验独立`system_admin_id`、active控制平面身份、登录未受限。由`grantMemberCreateLicense`签发，仅针对指定的真实active`four_s`个人Employee和`NEW_OWN_FOUR_S_MANUAL_VEHICLE`一次来源对象范围。System Admin不是4S Vehicle Owner，也没有Vehicle敏感字段读取权。
- 原`pc.four_s.vehicle.manage`个人静态allow只是F03登录资格/局部许可，Customer301 object scope与空store不是Vehicle签发范围。独立增量`000016_four_s_member_trust.sql`中的`f05_3a_member_create_licenses`才提供受信当前**创建自己新的人工4S车辆**资格；受信签发行为及Actor写入`f05_3a_member_trust_audit`不可变历史。
- 4S本人真实`withSession`在DB完成验签后，使用PDM-06的sourceType、品牌、车系、当前完整车型、年款、里程、城市原生值。先校验车型/品牌/车系物理FK和真实完整/active状态，再**同一PG16事务**创建此前不存在的Vehicle、ListingCycle、`f05_3a_member_publications`本人当前对象责任及`MEMBER_PUBLISH`审计。受影响者是本人，发布Actor也必须是自己当前Session。
- 不再拿F05-2`team_id NOT NULL`的名邦内部Team表当4S商户所有权；不新建合作4S组织表、不拿历史`created_by`追认、不自动授予别的成员，已有车一律不能进入新建事务。
- 仅新独立CI loopback TLS `/__ci__/f05-3a/v1/vehicles/{id}/detail`提供真实有当前授权者的最小`vehicleId/listingCycleId/sourceKind`正向200。F05-2旧明邦车辆detail不改，4S其他六敏感/导出出口全部403。

## 二、撤销、Actor与终局并发

- 显式`revokeMemberCreateLicense`在真实Admin Session/目标当前帐号行锁/CAS下注销license，记录真实`actor_kind=SYSTEM_ADMIN`和合法System Admin身份；同事务自动关闭该许可签发的全部当前Vehicle对象责任。
- 账号停用、主角色/门店/employee状态及4S个人permission override由**新增隔离PG16触发器**注销当前member licence并连带关闭其当前经营对象；单车的source/status变更或listingCycle结束仅注销**该Vehicle/Cycle对象责任**，不误撤该成员其他车或新的首发资格，所有治理动作均记`actor_kind=SYSTEM`；自动系统事件不冒充受影响4S本人。
- 旧成员恢复active、role/allow恢复、上架周期变化不会复活已经撤销的license或Vehicle责任。新授权只能由当前合法System Admin单独再次签发，且仅用于新的车辆。
- 控制平面的目标账号行锁与业务发布当前同一账号Session互斥；member licence`FOR SHARE`和Admin撤销`FOR UPDATE`串行；已提交撤销后的读取/发布均不能返回200。真实双连接测试见`tests/bridge-source.test.mjs`。
- 不可变审计含before/after、eventKey、licenseId、publicationId、SYSTEM_ADMIN/FOUR_S_MEMBER/SYSTEM三类Actor，无人类身份伪造。新Migration通过隔离PG16前版本结构封印+新版本SHA校验；旧000001~000015均禁止变更。

## 三、证据任务边界

- 原新工作流的**36个旧job定义原文不变**；仅当前F05-3A两个新增job追加真PG16 `runner --inject-rollback/--apply/--verify`，再分别执行原始7+7缺源负例、新增授权正向/业务撤销/PG16物理竞态与真实TLS正反例。
- 非生产测试`fixtures.mjs`只构建合成Vehicle车型FK和另一个4S成员**身份**；没有直接种Admin licence/经营owner/可信true。真正license必须由经过账号密码验证的Admin Session产生，Vehicle必须由真实4S Member Session在事务内创建。
- 所有新作业生成`pg_dump --schema-only`、`full-catalog.json`、`inventory.json`、`sha256sums.txt`、原生测试日志和审计矩阵，GitHub Actions Artifacts原地保留。
- F05-3B JYT、转名邦、采购价格、电话、生产路由、4S账户治理正式上线均未获本批授权；F05/C/H01/V1维持NOT_READY。
