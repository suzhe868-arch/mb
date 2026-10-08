// F02-G0: GitHub Actions disposable PG16 only; F01 guard remains unchanged.
export function verifyIsolatedConfig(env=process.env) {
  for(const [key,val] of Object.entries({GITHUB_ACTIONS:'true', CI:'true', APP_ENV:'test', NODE_ENV:'test', F02_G0_ISOLATION_CONFIRM:'I_ACKNOWLEDGE_F02_G0_DISPOSABLE_DATABASE',F02_G0_OPERATION:'readonly_preflight'})) {
    if(env[key]!==val)throw Error('F02_G0_REFUSED_'+key);
  }
  if(!env.F02_G0_DATABASE_URL) throw Error('F02_G0_REFUSED_MISSING_URL');
  let u;
  try { u=new URL(env.F02_G0_DATABASE_URL); }
  catch {throw Error('F02_G0_REFUSED_URL_SYNTAX');}
  if(!['postgres:','postgresql:'].includes(u.protocol)||u.hostname!=='127.0.0.1'||u.port!=='5432'||u.pathname!=='/f02_schema_test'||decodeURIComponent(u.username)!=='f02_ci'||!u.password||u.search||u.hash) {
    throw Error('F02_G0_REFUSED_TARGET');
  }
  return {connectionString:env.F02_G0_DATABASE_URL,database:'f02_schema_test',role:'f02_ci',host:'127.0.0.1',port:5432};
}
export function forbidMigrationExecution(args=[]) {
  if(args.length)throw Error('F02_G0_MIGRATION_EXECUTION_DISABLED');
}
export function assertReadOnlyPg16Identity(row) {
  if(row?.database_name!=='f02_schema_test'||row.db_user!=='f02_ci'||!Number.isInteger(row.version_num)||row.version_num<160000||row.version_num>=170000||row.is_superuser!==false||row.can_create_database!==false||row.can_create_roles!==false||row.public_table_count!==0||row.non_public_user_schema_count!==0||row.user_relation_count!==0) {
    throw Error('F02_G0_DATABASE_IDENTITY_OR_EMPTY_BOUNDARY_FAILED');
  }
}
