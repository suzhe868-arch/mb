import {assertEnvironment,connect} from './environment.mjs';
assertEnvironment();
const pool=await connect();
try{
 const count=(await pool.query('SELECT count(*)::int n FROM public.customer_phone_facts')).rows[0].n;
 if(count!==0)throw Error('CUSTOMER_PHONE_FIXTURE_DATABASE_NOT_EMPTY');
 const permission=(await pool.query("SELECT count(*)::int n FROM public.permissions WHERE permission_code='customer.phone.manage'")).rows[0].n;
 if(permission!==1)throw Error('CUSTOMER_PHONE_CAPABILITY_FIXTURE_MISSING');
 console.log('CUSTOMER_PHONE_EXISTING_SCHEMA_FIXTURE_READY');
}finally{await pool.end()}
