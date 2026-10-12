// Create legitimate F05-6 CI synthetic Demand via ORIGINAL signed v22 API before v23 schema.
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {connect,verify} from '../find-car-application-demand-eligibility/migration.mjs';
import {syntheticCustomerActor,submitCIApplication,activateCIDemand} from '../find-car-application-demand-eligibility/service.mjs';
const c=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48988'});
try{
 await verify(c);
 const s=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f05-7-ci-real-F03-synthetic'});
 if(s.code!=='AUTH_OK')throw Error('F05_7_F03_VALID_EMPLOYEE_REQUIRED');
 for(const id of [899612,899613,899618,899619,899620]){
  const application=await submitCIApplication(syntheticCustomerActor(id),{applicationKey:'f05-7-before-v23-app-'+id+'-signed',desiredVehicle:'Audi A6 2026'});
  if(application.code!=='F05_6_APPLICATION_PENDING')throw Error('F05_7_PRESEED_APPLICATION_'+application.code);
  const x=await activateCIDemand(auth,s.token,{applicationId:application.applicationId,requestKey:'f05-7-before-v23-demand-'+id+'-signed',teamId:901});
  if(x.code!=='F05_6_MANUAL_DEMAND_ACTIVATED')throw Error('F05_7_PRESEED_DEMAND_'+x.code);
 }
 const p=await submitCIApplication(syntheticCustomerActor(899611),{applicationKey:'f05-7-ordinary-pending-899611-signed',desiredVehicle:'BMW'});
 if(p.code!=='F05_6_APPLICATION_PENDING')throw Error('F05_7_PRESEED_ORDINARY_PENDING');
 console.log('F05_7_F05_6_V22_SIGNED_ORIGINAL_APPLICATION_DEMAND_SOURCE_CREATED_BEFORE_V23');
}finally{await auth.close();await c.end();secret.fill(0)}
