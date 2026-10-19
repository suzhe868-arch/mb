// F05 test-only runtime route contract: startup fails if any actual handler is absent.
// Formal identity/source issuers remain refused by createIsolatedCatalogRuntime.
export const REQUIRED_F05_HANDLERS=Object.freeze([
 'favoriteHandler','consultationHandler','employeeStartHandler','handoverHandler',
 'slaHoldHandler','priceUnlockHandler','quotaAdditionHandler',
 'findCarHandler','findCarActivationHandler','demandLifecycleHandler','matchingHandler',
 'dictionaryHandler','discoveryHandler','recommendationHandler',
 'priorityHandler','priorityQualificationHandler','employeeVehicleReadHandler'
]);
export function createIsolatedCatalogServerOptions(runtime,env=process.env){
 if(env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||
    env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('F05_CATALOG_RUNTIME_TEST_ONLY');
 if(!runtime||typeof runtime.handler!=='function'||typeof runtime.ready!=='function')
  throw Error('F05_CATALOG_RUNTIME_INCOMPLETE');
 const options={catalogHandler:runtime.handler,readinessProbe:runtime.ready,readinessTimeoutMs:3000};
 for(const name of REQUIRED_F05_HANDLERS){
  if(typeof runtime[name]!=='function')throw Error('F05_CATALOG_RUNTIME_MISSING_'+name);
  options[name]=runtime[name];
 }
 return Object.freeze(options);
}
