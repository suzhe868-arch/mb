import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('spec/FINAL_DEV_READY');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
test('manual formal publish allows zero real images',()=>{
  const first=read('00_READ_FIRST.md');
  const ssot=read('02_SSOT/名邦汽车_V1_SSOT_CHECKPOINT_2026-09-06.md');
  assert.ok(first.includes('Vehicle images are optional for formal publish'));
  assert.ok(ssot.includes('Vehicle images are optional for formal publish'));
  assert.ok(ssot.includes('人工车辆允许 0 张图片先发布'));
  assert.ok(ssot.includes('图片可为空；无客户标价显示“价格咨询”，无图片使用默认占位图'));
  assert.equal(first.includes('at least one vehicle image'),false);
  assert.equal(ssot.includes('at least one vehicle image'),false);
});
