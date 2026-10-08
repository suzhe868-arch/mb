export function verifyF021Target(env=process.env){
 const exact={GITHUB_ACTIONS:'true',CI:'true',APP_ENV:'test',NODE_ENV:'test',F02_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F02_1_NEW_EMPTY_PG16_SCHEMA_ONLY',F02_1_OPERATION:'isolated_current_schema'};
 for(const [key,val] of Object.entries(exact))if(env[key]!==val)throw Error('F02_1_REFUSED_'+key);
 let u;try{u=new URL(env.F02_1_DATABASE_URL||'')}catch{throw Error('F02_1_REFUSED_DATABASE_URL')}
 if(!['postgres:','postgresql:'].includes(u.protocol)||u.hostname!=='127.0.0.1'||u.port!=='5432'||u.pathname!=='/f02_schema_test'||decodeURIComponent(u.username)!=='f02_ci'||!u.password||u.search||u.hash)throw Error('F02_1_REFUSED_TARGET');
 if(env.F02_1_INJECT_TX_FAILURE&&env.F02_1_INJECT_TX_FAILURE!=='CI_TEST_AFTER_DDL')throw Error('F02_1_REFUSED_FAULT_INJECTION');
 return {connectionString:env.F02_1_DATABASE_URL};
}
export function verifyDatabaseIdentity(row){
 if(row.database_name!=='f02_schema_test'||row.db_user!=='f02_ci'||row.version_num<160000||row.version_num>=170000||row.is_superuser!==false||row.can_create_database!==false||row.can_create_roles!==false||row.non_public_user_schema_count!==0)throw Error('F02_1_REFUSED_PG16_IDENTITY_OR_NONPUBLIC_SCHEMA');
}
export function checkMigrationVersions(rows,checksum){
 for(const r of rows)if(r.migration_id!=='000001_current_initial')throw Error('F02_1_UNKNOWN_MIGRATION_VERSION');
 if(rows.length>1)throw Error('F02_1_DUPLICATE_MIGRATION_META');
 if(rows.length===1&&rows[0].checksum!==checksum)throw Error('F02_1_MIGRATION_CHECKSUM_DRIFT');
 return rows.length===1;
}
