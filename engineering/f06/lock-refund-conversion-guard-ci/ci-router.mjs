// Pure loopback TLS CI route: no production-facing refund issuer exists.
export function ciFailClosedRouter(){return(req,res)=>{
 const path=new URL(req.url,'https://127.0.0.1').pathname;
 const inside=path.startsWith('/__ci__/f06-5b/');
 res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('cache-control','no-store');res.setHeader('x-content-type-options','nosniff');
 res.statusCode=!inside?404:req.method==='POST'?403:405;
 res.end(JSON.stringify({code:!inside?'F06_5B_NO_PRODUCTION_ROUTE':req.method!=='POST'?'F06_5B_METHOD_DENIED':'F06_5B_REAL_REFUND_ISSUER_NOT_AUTHORIZED'}));
}}
