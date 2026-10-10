# 名邦汽车 V1｜F04-2 B全包整改、自验与A独立复验交接

> 2026-10-10｜F04-2已正式放行的A-F04-2-01/02两项整改，不新增任务边界。分支 `feat/f04-2-authority-route-mapping`，PR #27，未自行合并main。下述“终验READY”仅在本文件所在最终提交获得同SHA 28/28真实成功CI时成立。

## 一、Authority真实错引纠正与215行全账

1. 原215候选含105条簇级`EVIDENCE_MATCHED`、110条`SOURCE_GAP`。本次依《A整改105条动作语义逐项复核.tsv》全量审查105/105：**23条**能同时证明相同主体、业务对象与操作意图的Current Final/IA/Low-Fi一致动作；其余**82条**缺精准证据，降为`SOURCE_GAP`，得到**23/192**。不存在为了凑105而填充KEEP/MODIFY。
2. 独立可机读`action-semantic-contract.mjs`逐ID固定导航动作、主体、动作语义、PDM Final、具体原文行及低保真页面，`source-verifier.mjs`拒绝“字节真实但动作不相关”的匹配以及跨Domain Owner错分；`tests/source-authority.test.mjs`新增F04-A09～A11三个原生负例测试，真实Authority job **11/11** PASS。
3. `LEGACY-001`微信会话与手机号授权不混同、`019`咨询创建与`020`候补从Vehicle浏览分开、`069～072`咨询生命周期不引用员工内部称呼、`079`按E02真实发布校核；`085/086`旧独立价格override并未从内部模式获得业务准入，保留来源缺口。
4. 218历史method+path、198真实path、62含冒号path、3条禁恢复Collector连接均不变；215候选全部`UNDECIDED/CONTRACT_ONLY`，无老接口正式恢复。

## 二、业务Domain与实施责任修正

- 215行新增`domain_authority`、`contract_owner`、`business_implementation_owner`、`owner_review_gap`，全部F04仅承担本批HTTP合同核账，不能冒充真实业务功能实现。
- `LEGACY-019`与`067～072`归PDM-15 Consultation；真实下游业务实施Owner仍缺正式可证责任划界，标`OWNER_REVIEW_GAP`由A技术审查，不伪认F05车辆写权限。
- `LEGACY-020`归PDM-18 Waitlist与F06锁车候补，不再`VEHICLE/F05`；Price依PDM-10/F05且原独立调价禁恢复。
- 新F04-A10原生负向实测：任意把上述业务Owner改F05必须失败。原4S目标商户当前物理归属无可靠证明仍403硬拒，不新增账号写/生产权限。

## 三、真实CI来源、同SHA及物理结构

**整改代码冻结验证 SHA：** `a7eb27ef703ead516780230c245ffa412c755ce6`。同SHA真实 [Actions #38040837511](https://github.com/suzhe868-arch/mb/actions/runs/38040837511)：`completed/success`，**28/28独立非特权PostgreSQL16作业成功**（旧26原样完整回归+新Authority/4S各自独立新PG16）。Authority job ID `114180587161`，原生 **11/11** PASS；4S真实loopback HTTPS job ID `114180587197`，原生 **9/9** PASS。37份GitHub Actions原始Artifacts，其中新增：

- Authority独立原生PG16证据：Artifact `11666450256`。
- 4S独立原生PG16证据：Artifact `11666050546`。

原生两新作业均保存真实PG16 schema-only、full-catalog、inventory、frozen-source、true-pg16-tests.log及SHA256 checksums。原F03-2M M94结构封印PASS：94表、608列、435约束、163索引，目录SHA `7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659`，G000014与M94仍隔离；没有DDL、没有弱化已签F04-1/旧F03 CI或修改任何PDM/IA。

**交接文件归档后的最终CI要求**：本文件自身进入新提交会改变B HEAD，所以须以新HEAD再次获得`run.head_sha=最终B SHA`和完整28/28作业`completed/success`为终验。上面的 #38040837511 是当前代码整改全绿的真实证据，不冒充未来新SHA证据；请以PR #27本次最终运行结果及本分支最新HEAD为唯一即时验收结论。

## 四、已完成范围与仍然受限范围

- 当前分支仅修改/新增`engineering/f04/authority-route-mapping/**` 目录内文件；未修改`main`、F04-1源码和工作流、原F03模块、迁移000001～000014、正式server、PDM Final、Current IA、C设计文件。
- F04真实4S治理写、Customer完整CRM、F05～F07业务、产品上线、C/H01高保真与三端UAT均未完成或签收，`PRODUCT_BASELINE_STATUS=NOT_READY`。
- B不得合并PR27或启动F04-3，不操作真实账户、第三方、资金或客户数据；本轮B只将受限隔离成果交A复验。

**退出门禁**：若本最终提交与28/28成功CI同SHA，则 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`；否则仅为`B_CI_PENDING / NEXT_OWNER=B`。
