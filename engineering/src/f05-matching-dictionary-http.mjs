// PDM12/PDM22 test-only HTTP dictionary management & simulation; no public production route.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8',
 'cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
export function createIsolatedDictionaryHandler(service,env=process.env){
 if(!service||typeof service.mutate!=='function'||typeof service.preview!=='function'||
  env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||
  env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('RULE_DICTIONARY_FORMAL_ISSUER_REQUIRED');
 return async(req,res)=>{
  const path=req.url??'';
  if(!path.startsWith('/api/v1/catalog/matching/rules'))return false;
  if(path.length>180||/[?#%\\\0]/.test(path)){send(res,400,{code:'RULE_INVALID_PATH'});return true}
  const match=/^\/api\/v1\/catalog\/matching\/rules(?:\/([1-9][0-9]{0,18})|\/(test-parse))?$/.exec(path);
  if(!match){send(res,400,{code:'RULE_INVALID_PATH'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  const headers=req.headers;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket?.remoteAddress)||
   headers.host!=='127.0.0.1:'+req.socket?.localPort||headers.cookie||
   headers['transfer-encoding']||headers['content-type']!=='application/json'||
   Number(headers['content-length'])>1400||
   Object.keys(headers).some(x=>/(customer|employee|owner|role|scope|price|grant|priority|recommendation|phone|wechat|forwarded|^x-forwarded-)/.test(x))){
   send(res,403,{code:'RULE_UNTRUSTED_REQUEST'});return true;
  }
  const token=headers.authorization;
  if(typeof token!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(token)){
   send(res,401,{code:'RULE_EMPLOYEE_IDENTITY_REQUIRED'});return true;
  }
  let content='';
  try{
   for await(const chunk of req){
    content+=chunk.toString('utf8');
    if(Buffer.byteLength(content,'utf8')>1400){send(res,413,{code:'RULE_BODY_TOO_LARGE'});return true}
   }
   let v;try{v=JSON.parse(content)}catch{send(res,400,{code:'RULE_INVALID_JSON'});return true}
   if(!v||typeof v!=='object'||Array.isArray(v)){send(res,400,{code:'RULE_INVALID_JSON'});return true}
   let out;
   if(match[2]){
    if(Object.keys(v).some(k=>!['text','context'].includes(k))){send(res,400,{code:'RULE_INVALID_PREVIEW'});return true}
    out=await service.preview({credential:token.slice(7),text:v.text,context:v.context??{}});
   }else{
    if(Object.keys(v).some(k=>!['action','expectedVersion','definition'].includes(k))){
     send(res,400,{code:'RULE_INVALID_BODY'});return true;
    }
    const eventKey=headers['x-idempotency-key'];
    out=await service.mutate({credential:token.slice(7),eventKey,
      action:match[1]?v.action:'CREATE',ruleId:match[1]??null,
      expectedVersion:match[1]?v.expectedVersion:null,definition:v.definition??null});
   }
   send(res,out.status,out.body);
  }catch{send(res,503,{code:'RULE_DATABASE_OR_FORMAL_ISSUER_NOT_READY'})}
  return true;
 };
}
