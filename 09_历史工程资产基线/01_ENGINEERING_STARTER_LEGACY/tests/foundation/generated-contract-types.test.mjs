import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('generated contract type layer contains the current critical W04/W06 DTOs',()=>{
 const body=fs.readFileSync('packages/contracts/generated/types.ts','utf8');
 const exported=(body.match(/^export type /gm)||[]).length;
 assert.equal(exported,180);
 for(const name of ['VehicleCardCustomerDTO','VehicleCustomerDetailDTO','StaffVehicleSafeDTO','StaffVehicleInternalDTO','AdminVehicleDTO','CustomerDTO','StaffCustomerDTO','AdminCustomerDTO','FollowupDTO','AliasNoteDTO','StaffSelfDTO','VehicleBrandCreateRequest','VehicleSeriesCreateRequest','VehicleModelDTO','VehicleModelPageDTO','EmployeeReportPreferencesDTO','EmployeeReportPreferencesRequest','VehicleModelMatchCaseDTO','CustomerVehicleCardPageDTO','StaffVehicleCardPageDTO']){
   assert.match(body,new RegExp(`^export type ${name}\\s*=`,`m`),name);
 }
 assert.match(body,/owner_employee_id\?: string;/,'public-pool owner must be optional in generated type');
});
