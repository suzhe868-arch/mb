# F05历史CI治理｜B施工中基线与不越权判定
- 正式来源：最新main `e0f9a04ae0c25031ae47ed4af107890550f56b56`；从该SHA创建独立分支，不修改main。
- 基线旧PR69最后受验HEAD `f368ed870a4d432f25eb2fb1fb3915f78a4fd720`，本轮B重新查询时旧F05共28 checks：19 success / 8 failure / 1 in_progress；比A上轮19 success/7 failure/2 in_progress变化，故**绝不套旧时间点结果**。
- 原6项镜像限流（独立已读原生Job日志）中Job116801294103明确`toomanyrequests: Data limit exceeded`；原F05-9 Job116801293436数据库17/17成功后 `F05_9_NOT_IN_OFFICIAL_NEW_PUSH` 拒绝，属来源证据门禁正确拒绝；F05-7 Job116801293634真实28/28 PG测试成功后 `F05_7_CANNOT_PROVE_66_SAME_SHA_OFFICIAL_PG16_JOBS_IN_BOUNDED_CI_RUN`，不能升级为父证明。旧F05-8一项暂无法下载日志，维持未知，不可判PASS。
- 旧5份主工作流共12个service从ECR改官方`postgres:16`，不改原工作流其它内容。独立新Node+PG16仅给CI治理兼容证明，不代替旧正式Push。
- branch protection API 403；required checks=UNKNOWN；此提交不改旧PR触发配置、不关闭任何检查。
- 最终双Job、新SHA、两Artifact、28项旧Check和镜像恢复以新PR官方结果和随后B正式验收评论为准。**当前不宣称已修复全部旧CI或所有原父业务来源**。

## R2已获A追加正式施工白名单（2026-10-16）
- A已追加放行冻结5份revalidation Workflow中16项PG16服务镜像/本地镜像ID alias验证，维持原工作流版本、Job入口、Artifact及原签父Push证据门槛。
- 交接以最终PR70新SHA真实Push CI、Node+PG16双Job及两官方同SHA工件为准；旧28项真实状态见PR中文正式评论，不得用ECR旧失败/新Success冒充父业务签证。
