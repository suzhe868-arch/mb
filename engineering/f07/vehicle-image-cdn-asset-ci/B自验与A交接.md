# 名邦汽车 V1｜F07-2 B自验与A独立验收交接

> 2026-10-15｜任务状态：B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A（最终官方SHA及Run以PR交接评论和GitHub HEAD校验为准，不以历史绿证代替）。

## 1. 权威、分支与严格白名单

- main开工基准：0a976910bf5846d6266eb0b6c7943df8fe49eae9；A正式F07-2施工单与PDM-08 Final §1—29。PR：#65；分支：feat/f07-2-vehicle-image-cdn-asset-contract-ci。全程未修改或合并main。
- 只新增 engineering/f07/vehicle-image-cdn-asset-ci/** 及 .github/workflows/f07-2-vehicle-image-asset.yml。未修改旧PDM/CI、F03/F04/F05/F06/F07-1、正式DB迁移及权限。
- 当前工程交付为一份可销毁PG16 schema、可执行合同、MockStorage/MockCDN、loopback HTTPS服务、3组安全回归、中文来源/用例矩阵和工程边界说明。

## 2. 真实业务合同与反向安全审查

- 来源冻结：DB原始相对path/source/upstream_image_id/order一次性入库；JYT图片试图重排或改写来源触发SQLSTATE 23514；后续普通同步不得追加或覆盖；合法批发→名邦只保留同一个vehicle_id和listing_cycle。
- 受控URL：只允许名邦图片/报告配置域；禁止../、绝对URL、userinfo、编码斜杠、百分号二次解码、Unicode NFKC混淆、CRLF、任意HTTP回源和Metadata SSRF。CDN HIT/MISS以本机TEST_IMAGE Mock演算，浏览不进行永久对象写入。
- UI边界合成：首图失败按冻结顺序后补，恢复选回首张，零图/全失效显示占位；详情首阶段2—5，第3张触发6及后续队列；并发只是工程可配参数，不恢复旧固定产品窗口。
- 双成功：转换后仅独立图片job执行Mock对象PUT+PG合法object_key二者同时成立；DB CHECK注错23514/模拟中断/Mock写失败会回滚并清理孤儿；同图双后端行锁串行/重复重入免重做；部分失败只重试失败项；销售/锁车/交易等只作不变合成业务标记，不声称调用真实F05父。
- 3A：转换后资产尚未完成可继续通过名邦受控CDN读取Mock JYT源；成功后立即读取自有对象；对象丢失不会绕过本地资产状态偷偷回JYT，需单图恢复。
- 权限隔离：报告/H5单独Namespace、报告域白名单；当前customer_visible、Vehicle Read、hidden/Priority独占、Session及Scope每次读取PG重新核验；旧URL/缓存/历史分享不构成永久许可；敏感原件禁止直接外读，分享卡仅安全三字段。
- 反向检查：无真实网络抓图、无真图片、无真实客户/VIN/电话/资金，未连公网CDN、JYT、对象存储或生产服务；模拟TLS只监听127.0.0.1；未改父表、父Workflow或正式迁移。

## 3. 真正运行过的原生证据和最新门禁

- 首轮官方真正push Run 38715659074，SHA 40cf8516a21790ef9e1ab9061a8d03ccff912389，Source/HTTPS双真实PG16 Job 2/2 success；对应两个GitHub官方有效sha256 Artifact。其结果只证明首轮SHA，不替代后续提交。
- 补强后官方真正push Run 38716038626，SHA 06871de63ffb2e7e38e3f416142ef2e1cdc3de55，Source(60场景及额外路径和9门禁)及loopback HTTPS16 2/2 success。该Run证明该时点源码及工作流通过，不替代本报告最终SHA。
- 加固后实际代码唯一SHA 6a99a8dbbecd1aabd42c68695466e83cf6c64098，官方真正push Run 38716589550 completed/success，2个独立PG16 Job 2/2 success；官方工件Source ID 11962649154、3901字节、sha256:051cdbf4e11de457dd3554ba38c4994ec46969b699e6100bceb393060abb899d；HTTPS ID 11962308911、1271字节、sha256:8432e06a8eba5e7d3a376afa431a0822ffb756b29217fcb360369ae42a6233f0，均expired=false。此证据不取代报告提交后的最终HEAD证明。
- 最终量化门禁：68条真实PG16业务场景、12个恶意path负例、9个隔离CI/DB环境负例另加1个真实PG16 SET ROLE提权拒绝、20项loopback TLS+独立PG16黑箱；包括两真PG Backend PID、行锁55P03、对象实际put/delete计数、SQL23514真实回滚与最新权限拒绝。总计110条独立子例（68+12+9+1+20），各项子例由Node test报告数，不把父suite作为业务用例。
- 后续反向安全加固阶段：可见车Priority仍需独占本人/负责销售、零图片首次冻结永久阻止后续同步补图、对象写成功后模拟崩溃遗留孤儿对账、占位返回前权限复查、上传图片必须保留不可变origin_source_type，正式PG16分别有负例。加固前的真PG16 Run38717301357 SHA41eab1ea9b3a27c0bd8765677f2d3f0dcc89e6c5两个Job completed/success，Source与HTTPS官方sha256 Artifact分别为11963795393/11963955526，均非空且未过期；只证明该SHA，不替代加固后终验。旧Run38717223046与38717270058红灯均发生在日志标记仍检查60或16而测试已经扩大至68/20的历史中间SHA，事实保留，不得当作全绿。
- 本报告提交会形成新HEAD并重新触发官方GitHub push；必须复核新HEAD独立Source及HTTPS两个Job均completed/success、对应真实非空未过期sha256官方Artifact，再向A宣布READY，不允许以过去SHA绿证冒充最终状态。

## 4. SOURCE_GAP / 未获授权事项

- F05来源转换已签父服务、正式图片表、已签F03 Session/Permission/Scope/Object与真实Priority物理数据 **未实际对接**；本包只是侧车PG16合成事实及当前读拒合同，不得声明生产用户授权PASS。
- 真JYT来源/Collector抓图、CDN域名/DNS回源、对象存储/密钥、真实报告H5鉴权网关、真实车辆图片、微信端/H03/H04、UAT与上线均未实施；没有生产权限或数据库迁移授权。
- F05/F06/F07整域和V1仍NOT_READY；F07-1电话能力TECH_ALIAS_PENDING_A及其SOURCE_GAP继续保留。不能把本批合同证据推广为生产能力。

## 5. 与A交接的最终签字规则

B在施工白名单内完成实现、真实PG16业务/攻击/错误环境测试、反向安全复核和中文证据归档，自验标记 **B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A**。最终提交的SHA、真实push Run/两Job/两工件在PR交接评论按最终HEAD补全；若该最终HEAD任何F07-2新Job失败，READY状态即时失效并须B继续整改。B不自行合并main、不扩大本包CI-only性质，A须独立复核所有SOURCE_GAP及历史旧红灯后裁决。

## 6. A独立验收特别关注

1. 图片原始`origin_source_type`只存首次图片源类型（`wholesale/mingbang/four_s`），不同于可依法更新的Vehicle经营`source_type`；JYT来源触发器封存原始来源、图片身份、路径和顺序。首次0图冻结写`image_frozen=true`，不得因后续JYT同步补图。
2. Priority独占不允许因`visible=true`而绕开；当前Scope和Session每次请求重读，但此B侧车中的Session是合成事实，不得冒充已签F03真实连接。
3. 正式图片读取失败的允许fallback仅为预期单图不可用，不能吞掉未知数据库或授权错误并伪装成占位。
4. 进程直接终止后的孤儿清理只在同一进程MockStorage枚举模拟，真实分布式对象存储清理、事务外可靠队列与孤儿账本仍未接线，明确SOURCE_GAP。
5. 最终PR #65为草稿期间绝对不得合入main；确认同最终HEAD双官方新PG16 Job、工件和A安全边界后B方可变更READY状态，A独立验收之前不把F07整域或V1称READY。
