# F05-7｜V2 Source 协议候选（非正式签发）

唯一标记：V2_SOURCE_CONTRACT_MIGRATION_CANDIDATE_ONLY_V1。本文件和配套校验器只能产生待A审核的设计候选，不能修改任何正式 Source/Issuer，不能改变 SOURCE_GAP_OPEN / FAIL_CLOSED 或 V1/生产 NOT_READY。

## 旧来源严格合同

旧 match-source 的原第二 Shell 从 GitHub 官方读取七份冻结父 Workflow 的 64 个原 Job，要求当前 SHA 上官方 push 运行、正确身份和全部成功；原 F05-7 source/https 两 Job 再构成 66 项。旧来源ref 99c38d013f67cc56975f1664120fb87c204afc3c 禁止 Push。禁止使用伪 token/伪 GET 响应或修改旧签发器绕过断言。V2新隔离Runner仅可证明原业务执行，不能证明旧Workflow已经以相同SHA运行。

## 未来独立候选协议差异及最低门禁

1. 从旧8个固定Git Blob和66唯一Job ID重建不可变清册，验证完整Shell、条件、权限和Artifact契约；真实类型为64 PG16加2 NONPG。任何原业务断言未真正执行的Job不得记通过。
2. 未来同一V2候选HEAD下，应获取全部原Job的真正GitHub官方Run/Job/Check/Artifact和每步Shell/日志摘要，完整分页和独立ZIP正文SHA256，不能将PR104旧SHA的2项历史成功并入当前SHA父签。
3. 原父签工作流Job独立身份和新版16项分片执行身份不同。新版必须另外审计services/permissions/if/GITHUB_ENV/原Artifact命名与聚合、并发与异常，差异经A单独确认；不得自动认定等价。
4. v2-source-contract.mjs 仅做不可签发的数据结构防伪候选检验，明确拒绝跨SHA、错run、伪工件/日志哈希、重复JobID、伪NONPG、伪签发。通过单元测试不等于独立取证。
5. 以后需要独立A主控审签新的Issuer版本、正确的密钥与授权主体、正式五Source原子迁移和回退预案；本包没有批准签发、替换原ci-verify-workflows.mjs或启用生产。

## 本轮不可解决的结构性阻断

match-source 原Shell强制要求七旧冻结Workflow的64项同SHA原生推送成功，而原ref/8旧Workflow禁推和整体执行仍NO-GO。该原Job必须保持 BLOCKED_EQUIVALENCE_LEGACY_SOURCE_ORACLE，不能通过只读Token绕过，也不能标为REAL_PG16_PASS。当前按实证最多63/64且需真正复现HTTPS后才成立，旧父签仍不会因此自动通过。

原历史SHA 346fb11133f0883014b7911effb58052bd17b2c1 两项实测只记历史；本候选默认 source_gap=OPEN、Issuer=false，V1/生产NOT_READY。
