# 名邦汽车 V1｜F04-3 B全包自验与A复验正式交接

> 2026-10-10 Asia/Singapore｜本批仅CI-only合成技术范围；**B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A**；实际最终提交的同SHA 30/30 CI和原生附件必须由GitHub最新运行独立复核后才能正式接受，B不自行合并main。

## 一、权威、分支与白名单

- A施工单：`07_重建工作区/F04-3_A主控Current新接口注册表DTO与路由安全门禁完整施工单_2026-10-10.md`。
- 分支：`feat/f04-3-current-action-api-registry`，正式最新main起点 `955b98d80bbbe9598571b24bee558a039d9d9329`，沿该分支追加，未改main。
- 仅新增`engineering/f04/current-action-api-registry/**`与`.github/workflows/f04-3-current-action-api-registry.yml`。原F04-1/2、F03源码、旧29? 非本次工作流与旧迁移000001～000014、正式server、PDM、IA、C视觉资产未改。
- 旧F04-2 frozen工作流完整28个独立PG16作业被新工作流逐字复用，其原有脚本未删除或削弱；另追加2个独立非特权PostgreSQL16作业，共30。

## 二、A/B/C本包施工范围与真实边界

1. 新Current注册表：30条受控动作合同，23条源F04-2已证同主体/动作、6条原旧接口之外的Current动作、1条F04-1已通过真实PG16 object scope最小CustomerId读取。每条具备PDM/IA/Low-Fi来源、动作ID、method、新path、DTO版本、权限/对象scope/deny、业务Domain owner及CI/生产状态。
2. OpenAPI 3.1完整30条新路由；旧215条候选桥接保留23 EVIDENCE_MATCHED/192 SOURCE_GAP，旧218=215+3禁恢复、198 distinct path、62 colon path，旧215全部`UNDECIDED/CONTRACT_ONLY`，不批量KEEP或恢复旧API。
3. 独立`source-guard.mjs`按真实PDM、IA、Low-Fi、F04-2源字节校验，拒绝伪文档、不同动作、PDM/domain错配、未知/重复operationId、重叠method+path、额外OpenAPI route、未批准生产200及对象范围漂移。
4. 独立`current-router.mjs`仅允许新分支单独PG16、CI与127.0.0.1 HTTPS的显式环境门禁；读现时F03 Session、角色/个人deny与F04-1 Customer object scope。仅原F04-1已签最小CustomerId可在合成环境返回200，其他有真实依赖的业务`403/501`，无生产业务成功态；POST不接受未经授权DTO/CSRF/幂等键，不注册正式服务或修改业务对象。
5. 不把SystemAdmin/4S代入销售、Customer、Vehicle/Price/Lock业务权限，不以URL车辆前缀分派Consultation或Waitlist，4S商户scope未知硬拒。F05/F06/F07真实业务及C/H01/H03/H04仍`NOT_READY`。

## 三、B自验真实作业和证据

**完整独立同SHA代码自验通过的基础运行：**

- GitHub Actions [38045574528](https://github.com/suzhe868-arch/mb/actions/runs/38045574528)，受检代码提交`a6f294f6f3a97a9038b3f26dfbd6174e0b393197`，真实**30/30** PostgreSQL16作业均`completed/success`，原旧28无失败。
- 新Current来源/OpenAPI/DTO PG16 job `114194301330`，**8/8**原生测试成功；新TLS真实授权路由 PG16 job `114194301265`，**11/11**原生测试成功，含撤权、目标Owner漂移、4S/SystemAdmin/普通员工边界、Cookie/CSRF/query/path/DTO负例。
- 本次run共**41份**原生Artifacts，两份新增：Source `11667383718`、TLS `11667128922`，均未过期；每份含真实M94 schema-only、full catalog、inventory、原始SOURCE、当前合同source及SHA256与原始测试日志。
- M94结构不变：94表、608列、435约束、163索引、2120目录项，结构封印SHA `7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659`；N来源有真实`F03_2N_ORIGINAL_FULL_CATALOG_AND_INVENTORY_BYTE_PASS`证明、G14物理版本仍按旧CI独立验证。

**最终交审SHA以本文件落库后GitHub最新完整30/30 success的run.head_sha=本分支HEAD为准**；前述run为源码及新增测试在交接文件正式更新之前取得的已验证完整结果，不能直接冒充最终新提交的同SHA证明。A请依据本分支的最新CI及PR评论再次独立比对运行号与原始Artifacts，作为最终结论依据。

## 四、反向自审、未实现项及A接收

- 旧F04-1/F04-2及Frozen完整服务、旧CI、数据库迁移未删改；新模块不在`engineering/src/server.mjs`注册，未接任何真实微信/JYT/飞书/生产数据/账号与资金。
- 已保留`B端安全威胁矩阵.tsv`、`当前动作与DTO原始来源及负例清单.md`、`F04与下游真实依赖清单.md`、215条桥接和Collector禁恢复证明。
- 未完：F04真实全量业务、4S账号治理可信商户绑定、F05价格/Vehicle、F06 Lock/Waitlist/Transaction、F07 publisher_id与CDN、H01设计、高保真、三端UAT均未实施或验收，产品基线始终`NOT_READY`。

**本次B已做完本批已授权技术实现与全套真实回归，最终同SHA CI交审状态由最新GitHub运行裁决：B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A；PR由A独立验收后决定是否合并main。**
