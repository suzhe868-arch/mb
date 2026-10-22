// Route adapter: injection-tested on real Node HTTP, never a __ci__ handler.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const FORGED_IDENTITY_HEADER=/(?:^x-)?(?:customer[-_]?id|customer[-_]?level|price[-_]?quota|quota|scope|price[-_]?access(?:[-_]?mode)?|entitlement|owner[-_]?id)$/i;
export function createCatalogHandler(service){
 if(!service||typeof service.list!=='function'||typeof service.detail!=='function'||typeof service.stats!=='function')throw Error('CATALOG_SERVICE_MISSING');
 return async(req,res)=>{
  let url;try{url=new URL(req.url,'http://127.0.0.1')}catch{return false}
  const stats=url.pathname==='/api/v1/catalog/stats';
  if(!stats&&!url.pathname.startsWith('/api/v1/catalog/vehicles'))return false;
  const list=url.pathname==='/api/v1/catalog/vehicles',detail=url.pathname.match(/^\/api\/v1\/catalog\/vehicles\/([^/]+)$/);
  if(!list&&!detail&&!stats){send(res,404,{code:'NOT_FOUND'});return true}
  if(req.method!=='GET'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(req.headers.cookie||Object.keys(req.headers).some(h=>FORGED_IDENTITY_HEADER.test(h)||/^x-(?:customer|entitlement|quota|scope|price)-/i.test(h))){
   send(res,403,{code:'UNTRUSTED_CATALOG_IDENTITY_HEADER'});return true;
  }
  let customerToken=null;
  if(!stats&&req.headers.authorization!==undefined){
   const auth=req.headers.authorization,match=typeof auth==='string'&&/^Bearer ([A-Za-z0-9_-]{43})$/.exec(auth);
   if(!match){send(res,401,{code:'CUSTOMER_IDENTITY_REQUIRED'});return true}
   customerToken=match[1];
  }
  const params=Object.fromEntries(url.searchParams.entries());
  if([...url.searchParams].length!==Object.keys(params).length){send(res,400,{code:'DUPLICATE_QUERY'});return true}
  if(detail&&url.search){send(res,400,{code:'DETAIL_QUERY_NOT_SUPPORTED'});return true}
  if(stats&&url.search){send(res,400,{code:'STATS_QUERY_NOT_SUPPORTED'});return true}
  try{
   const result=stats?await service.stats():list?await service.list(params,{customerToken}):await service.detail(detail[1],{customerToken});
   send(res,result.status,result.body);
  }catch{send(res,503,{code:'CATALOG_DEPENDENCY_NOT_READY'})}
  return true;
 };
}
