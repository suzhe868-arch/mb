# 名邦汽车 V1｜B 工程交接：V2 独立签署影子验证与五消费者攻击负例

- 任务：`F05_7_V2_INDEPENDENT_SIGNER_SHADOW_AND_FIVE_CONSUMER_NEGATIVES_01`
- 正式起点：`main@03cb6fce646dc875c5587942d17ea06ad0f51cde`
- 指定隔离分支：`feat/f05-7-v2-source-shadow-trust-gate-01`
- 当前受限结论：`B_SELF_TESTED / READY_FOR_A_REVIEW_BLOCKED_FORMAL_ISSUER`，仅代表离线候选，不代表已完成在线可信签署或已合并。

## 本轮工程内容

- `official_shadow_manifest.py`：复用原正式main中的`engineering/f05/v2-attestation-gate/官方证据离线验真.py`；必须四个真实原ZIP全部在场且满足官方原digest/931文件/66项记录的固定身份，才构造严格去敏、白名单JSON。原件缺失、替换、过期必须阻断。
- `official_shadow_manifest.json`：本轮使用四原官方ZIP真正计算的离线快照，包含原Run/HEAD/Artifact hash与三项证据Merkle根；五正式来源、生产、独立A在线REST审阅与签名均写`false`。此快照不可代替原件及持久WORM。
- `shadow_gate.mjs`：对已固定的历史证据、Sigstore **声明接口**、经A保护的外部信任锚输入、私有不可变原件身份、持久原子nonce/撤销接口作受限负向审查。**不包含实际Sigstore密码学验签实现**，任何看似合法的外部JSON仍不允许替代真实A身份。所有决策硬返回`authorization_granted=false`与`formal_issuer_signed=false`。
- `F05-7/F05-8/F05-9/F05-10-D1/F05-10`五消费者仅影子只读、全部拒绝，不能少一个、重排、迁移、绕过、改成旧的假成功回滚。
- 所有文件仅在`audit/f05-v2-source-shadow-trust/**`；未修改五正式Source、旧八冻结工作流、原66业务Oracle、PDM/DDL/数据库、C前端和生产。

## 本地真实执行（2026-10-18）

环境：Python 3.13、Node.js，四份从GitHub官方Run `39035485532` 保存的原始ZIP作为输入。命令：

```bash
cd <repo-root>
F05_V2_OFFICIAL_ARTIFACT_DIR=/mnt/data python -m unittest discover -s audit/f05-v2-source-shadow-trust -p 'test_*.py' -v
node --test audit/f05-v2-source-shadow-trust/test_shadow_gate.test.mjs
python audit/f05-v2-source-shadow-trust/official_shadow_manifest.py --zip-dir /mnt/data > /tmp/f05shadowdoc.json
node audit/f05-v2-source-shadow-trust/shadow_gate.mjs /tmp/f05shadowdoc.json
```

- Python实跑 **5/5 PASS，0 skipped**；其中一项真实四ZIP完整验证，其他为过期/缺失、篡改、假签署字段及源码扫描负例。
- Node实跑 **52/52 PASS，0 skipped**；范围包括Repo/Run/HEAD/Event/Attempt/四Digest/冻结根与原文字节数篡改、自签、自审、未验证签署者、假的受保护环境与归档、过期/撤销/双并发nonce/非持久本地Set、五消费者遗漏/越权/回滚假成功。
- 真ZIP CLI返回纯去敏 manifest，其标准化hash=`034418349b767fd966371f7f9c0c0cb4a18385d51f32ecc6c41483656fded438`；五消费者全部`authorized=false`、签署`formal_issuer_signed=false`，`legacy_native_66_success=false`，7项阻断。
- 对旧真实运行仍保留 **63个PG16+2个NonPG＝65/66完整原业务通过、1项旧Oracle BLOCKED_EQUIVALENCE**；不能冒充历史原生66签约完成。

## 远程费用与身份阻断

- 完整GitHub动作必须先对新main`03cb6fce...`和本次七个精确路径核实所有335份工作流对branch push/create/main PR/PR-target零触发，且实核原Blob，未知Fail Closed；校验结果记录于 [Issue106审计评论#6238456325](https://github.com/suzhe868-arch/mb/issues/106#issuecomment-6238456325)。
- 用户费用硬上限为每月Actions **$0**，禁止主动使用收费Runner、Artifact、Sigstore签署、Secret、GitHub Workflow重跑、公开原ZIP上传。
- 五Source`SOURCE_GAP_OPEN/FAIL_CLOSED`与生产`NOT_READY`。真实独立Reviewer、受保护Workflow/Environment、真正加密Sigstore验证、公私隔离WORM归档、A独立REST分页核验、外部原子持久nonce撤销台账目前均无实际批准/证明。
- 老ref`99c38d013f67cc56975f1664120fb87c204afc3c`严禁Push，历史66原作业无需重跑；不使用skip-ci假造绿色。

## 交A审阅条件

审查本目录代码、52条Node和5条Python测试、真ZIP输入与stdout纯白名单、五方一致拒绝、攻击负例、精确目标路径触发审计与本仓库末SHA（如确能合法落分支）；审批主体由A控制，B无权把影子接口提升为正式Issuer。不存在主线合并/生产放行的主张。
