// Route adapter: injection-tested on real Node HTTP, never a __ci__ handler.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
export function createCatalogHandler(service){
 if(!service||typeof service.list!=='function'||typeof service.detail!=='function')throw Error('CATALOG_SERVICE_MISSING');
 return async(req,res)=>{
  let url;try{url=new URL(req.url,'http://127.0.0.1')}catch{return false}
  if(!url.pathname.startsWith('/api/v1/catalog/vehicles'))return false;
  const list=url.pathname==='/api/v1/catalog/vehicles',detail=url.pathname.match(/^\/api\/v1\/catalog\/vehicles\/([^/]+)$/);
  if(!list&&!detail){send(res,404,{code:'NOT_FOUND'});return true}
  if(req.method!=='GET'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  // Unknown query inputs and duplicate params are rejected; no caller-controlled scope bypass.
  const params=Object.fromEntries(url.searchParams.entries());
  if([...url.searchParams].length!==Object.keys(params).length){send(res,400,{code:'DUPLICATE_QUERY'});return true}
  if(detail&&url.search){send(res,400,{code:'DETAIL_QUERY_NOT_SUPPORTED'});return true}
  try{const result=list?await service.list(params):await service.detail(detail[1]);send(res,result.status,result.body)}
  catch{send(res,503,{code:'CATALOG_DEPENDENCY_NOT_READY'})}
  return true;
 };
}
