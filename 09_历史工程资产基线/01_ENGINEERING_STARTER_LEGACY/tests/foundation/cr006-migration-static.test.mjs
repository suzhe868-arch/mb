import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const s=fs.readFileSync('database/migrations/000003_cr006_vehicle_master_data.sql','utf8');
test('CR-006 migration has identity/concurrency/publish guards',()=>{
 for(const x of ['CREATE TABLE vehicle_models','CREATE TABLE vehicle_model_source_mappings','CREATE TABLE vehicle_model_match_cases','uq_vehicle_model_match_case_open','vehicle_model_id BIGINT','ck_vehicle_model_match_consistency','guard_manual_vehicle_model_publish','trg_guard_manual_vehicle_model_publish','CREATE TABLE upstream_publishers','upstream_image_id','vehicle.model.manage','uq_vehicle_models_normalized_identity']) assert.ok(s.includes(x),x);
 assert.match(s,/BEGIN;/); assert.match(s,/COMMIT;\s*$/);
});
