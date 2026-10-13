export function ciFailClosedRouter(){return(req,res)=>{
 const path=new URL(req.url,'https://127.0.0.1').pathname,inside=path.startsWith('/__ci__/f06-3b/');
 res.setHeader('content-type','application/json; charset=utf-8');
 res.setHeader('cache-control','no-store');res.setHeader('x-content-type-options','nosniff');
 res.statusCode=!inside?404:req.method==='POST'?403:405;
 res.end(JSON.stringify({code:!inside?'F06_3B_PRODUCTION_ROUTE_ABSENT':
  req.method!=='POST'?'F06_3B_METHOD_DENIED':'F06_3B_PRODUCTION_TRANSACTION_ISSUER_NOT_WIRED'}));
}};