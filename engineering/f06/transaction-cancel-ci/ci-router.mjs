// F06-4A: CI-only TLS cannot cancel/complete/pay any real Transaction.
export function ciFailClosedRouter(){return(req,res)=>{
 const pathname=new URL(req.url,'https://127.0.0.1').pathname;
 const inside=pathname.startsWith('/__ci__/f06-4a/');
 res.setHeader('content-type','application/json; charset=utf-8');
 res.setHeader('cache-control','no-store');res.setHeader('x-content-type-options','nosniff');
 res.statusCode=!inside?404:req.method==='POST'?403:405;
 res.end(JSON.stringify({code:!inside?'F06_4A_NO_PRODUCTION_ROUTE':
  req.method!=='POST'?'F06_4A_METHOD_DENIED':'F06_4A_NO_PRODUCTION_TRANSACTION_ISSUER'}));
}};
