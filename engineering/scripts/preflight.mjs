import { access } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const required = [
  'README.md',
  'CURRENT_PROJECT_STATE.md',
  'NEXT_ACTION.md',
  'PROJECT_STATE.json',
  '07_重建工作区/工程启动门禁_工程基础施工单与验收标准_2026-10-08.md',
  '07_重建工作区/PDM-25_最终完整规则.md',
  '03_证据_C_IA_V5_Current/IA_CURRENT.md',
  '04_证据_D_实际_LowFi/REGISTERS/LOW_FI_STATE_REGISTER.md',
  'engineering/package-lock.json',
  'engineering/src/app.mjs',
];
for (const path of required) {
  await access(new URL(path, root));
}
console.log('F01 preflight: required Current sources present:', required.length);
