# F03-2-2H｜SG06 Customer Owner单域移交

仅在GitHub Actions独立非特权PG16合成事实中演练。正式A工作单限制：独立`customer.owner.transfer`单域权限，真实PC经理或有正式范围的店长，单Customer CAS、历史、审计、不可变收据原子写；不存在允许全部SG06完成的批次状态，不更改其他业务域，不借`employee.manage`。新增迁移`000008`最多一张收据表，不修改冻结000001~000007。

## 2026-10-10｜A-H-01～03整改

全局`request_key_sha256`数据库UNIQUE，服务在Owner修改之前检验跨Item/Batch/Customer/recipient同Key碰撞；operator暂停接客不剥夺独立Customer Owner能力（但recipient必须仍接受接客且eligible）；经理有签发的精确跨店Team scope+当前双向Team成员可执行所覆盖Customer的单域移交，而store_head必须在本人主店有明确store/team scope，跨店即使额外Team binding仍拒绝。新增真实PG16多员工独立客户并发同Key恰有一个成功、19专项例、19/19通过；只改合成isolated PG16，新000008 89表/548列/360约束/143索引/1890目录定义+50授权新增键，原88表1840定义不变。唯一来源以最新`evidence/SOURCE.md`及最终同SHA 11个真实PG16 CI为准。非生产，整个SG06及F03-2/C-H01仍未验收，`NOT_READY`。
