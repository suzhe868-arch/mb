// F04-1 deterministic restricted parser for the frozen historical OpenAPI.
// No route name is inferred from operationId or the preceding path.
// Reject unexpected YAML structures rather than silently merging routes.
const METHODS=new Set(['get','post','put','patch','delete','head','options','trace']);
const PATH=/^  (\/.*):[ \t]*(?:#.*)?$/;
const METHOD=/^    ([a-zA-Z]+):(?:[ \t]*(?:#.*)?)?$/;
export function parseLegacyOpenApi(source){
  if(typeof source!=='string'||source.length<1)throw Error('OPENAPI_SOURCE_REQUIRED');
  const lines=source.split(/\r?\n/);
  let inPaths=false,seenPaths=0,pathsStarted=0,active=null,method=null;
  const paths=[],endpoints=[],pathNames=new Set(),keys=new Set(),operationIds=new Set();
  function checkPath(){
    if(method&&!method.operationId)throw Error('OPENAPI_OPERATION_ID_MISSING_LINE_'+method.line);
    method=null;
  }
  function parsePath(raw,line){
    if(!raw.startsWith('/')||!/^\/[A-Za-z0-9_./{}:~+-]+$/.test(raw))throw Error('OPENAPI_UNSUPPORTED_PATH_'+line);
    if(raw.includes('#')||raw.endsWith(':'))throw Error('OPENAPI_BAD_PATH_'+line);
    if(pathNames.has(raw))throw Error('OPENAPI_DUPLICATE_PATH_'+line);
    pathNames.add(raw);
    active={path:raw,line,metadataKeys:new Set()};
    paths.push(active);
  }
  for(let i=0;i<lines.length;i++){
    const line=lines[i],lineno=i+1;
    if(line==='paths:'){
      if(pathsStarted++)throw Error('OPENAPI_DUPLICATE_PATHS_ROOT');
      inPaths=true;continue;
    }
    if(!inPaths)continue;
    if(/^[^\s#][^:]*:\s*(?:#.*)?$/.test(line)){
      checkPath();inPaths=false;continue;
    }
    if(!line.trim()||line.trimStart().startsWith('#'))continue;
    if(/^  \S/.test(line)){
      checkPath();
      const found=line.match(PATH);
      if(!found)throw Error('OPENAPI_NONCANONICAL_PATH_KEY_LINE_'+lineno);
      parsePath(found[1],lineno);continue;
    }
    const m=line.match(METHOD);
    if(m){
      if(!active)throw Error('OPENAPI_ORPHAN_METHOD_'+lineno);
      if(m[1]==='parameters'){
        // OpenAPI permits path-item "parameters" at exactly the same
        // indentation as a method. It is metadata, NEVER a route.
        if(active.metadataKeys.has('parameters'))throw Error('OPENAPI_DUPLICATE_PATH_PARAMETERS_'+lineno);
        active.metadataKeys.add('parameters');
        checkPath();continue;
      }
      if(!METHODS.has(m[1].toLowerCase())){
        throw Error('OPENAPI_UNKNOWN_METHOD_OR_PATH_KEY_'+lineno);
      }
      checkPath();
      const lower=m[1].toLowerCase(),k=lower.toUpperCase()+' '+active.path;
      if(keys.has(k))throw Error('OPENAPI_DUPLICATE_METHOD_'+lineno);
      keys.add(k);
      method={method:lower,path:active.path,line:lineno,pathLine:active.line,operationId:null};
      endpoints.push(method);continue;
    }
    if(/^      operationId:/.test(line)){
      if(!method)throw Error('OPENAPI_ORPHAN_OPERATION_ID_'+lineno);
      if(method.operationId)throw Error('OPENAPI_DUPLICATE_OPERATION_ID_FIELD_'+lineno);
      const value=line.slice('      operationId:'.length).trim();
      if(!/^[A-Za-z0-9_]+$/.test(value)||operationIds.has(value))throw Error('OPENAPI_OPERATION_ID_INVALID_OR_DUPLICATE_'+lineno);
      operationIds.add(value);method.operationId=value;
    }
    if(/^ {1,3}\S/.test(line))throw Error('OPENAPI_INVALID_PATH_INDENT_'+lineno);
    // Other >= 6-spaces operation metadata are not route identifiers.
  }
  checkPath();
  if(pathsStarted!==1||!paths.length||!endpoints.length)throw Error('OPENAPI_PATHS_EMPTY');
  return Object.freeze({paths,endpoints});
}
export const FORBIDDEN_LEGACY_ENDPOINTS=Object.freeze([
  Object.freeze({method:'GET',path:'/admin/integrations/collector/connection'}),
  Object.freeze({method:'PATCH',path:'/admin/integrations/collector/connection'}),
  Object.freeze({method:'POST',path:'/admin/integrations/collector/connection:test'})
]);
export const forbiddenKey=(method,path)=>
 FORBIDDEN_LEGACY_ENDPOINTS.some(r=>r.method===String(method).toUpperCase()&&r.path===path);
export function assertLegacyDecision(record){
  const forbidden=forbiddenKey(record.http_method,record.legacy_path);
  if(forbidden){
    if(record.review_action!=='RETIRE'||record.current_stage!=='FORBIDDEN'||
       record.review_status!=='CURRENT_AUTHORITY_CONFIRMED_DO_NOT_RESTORE'||
       record.authority_evidence==='UNVERIFIED')
      throw Error('FORBIDDEN_LEGACY_NOT_RETIRED_'+record.legacy_id);
    return;
  }
  if(record.review_status==='UNREVIEWED_SOURCE_GAP'){
    if(record.review_action!==''||record.current_stage!=='SOURCE_GAP'||
       record.authority_evidence!=='UNVERIFIED')
      throw Error('GAP_MISLABELED_'+record.legacy_id);
    return;
  }
  if(!['KEEP','MODIFY','RETIRE','REPLACE'].includes(record.review_action)||
     !record.pdm_final_authority||record.pdm_final_authority.includes('NOT_MAPPED')||
     record.authority_evidence==='UNVERIFIED')
    throw Error('APPROVED_ACTION_MISSING_AUTHORITY_'+record.legacy_id);
}
