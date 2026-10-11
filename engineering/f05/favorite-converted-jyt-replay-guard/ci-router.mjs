// F05-3K: isolated HTTPS path shims only. Delegate ALL authentication,
// lock, origin, CSRF, credential, audit and business semantics to signed services.
import {createJytSyncContractHandler} from '../jyt-wholesale-lineage-cycle/ci-router.mjs';
import {createConversionCIHandler} from '../favorite-conversion-v19-compat/ci-router.mjs';
function absent(res){
 res.writeHead(404,{'content-type':'application/json','cache-control':'private, no-store'});
 res.end(JSON.stringify({code:'F05_3K_CI_ROUTE_NOT_REGISTERED'}));
}
export async function createKJytHandler(auth){
 const original=await createJytSyncContractHandler(auth);
 const prefix='/__ci__/f05-3k/jyt/v1/vehicles/';
 return async(req,res)=>{
  if(typeof req.url!=='string'||!req.url.startsWith(prefix))return absent(res);
  req.url='/__ci__/f05-3b/v1/vehicles/'+req.url.slice(prefix.length);
  return original(req,res);
 };
}
export async function createKConversionHandler(auth){
 const original=await createConversionCIHandler(auth);
 const prefix='/__ci__/f05-3k/employee/v1/vehicles/';
 return async(req,res)=>{
  if(typeof req.url!=='string'||!req.url.startsWith(prefix))return absent(res);
  req.url='/__ci__/f05-3i/v1/vehicles/'+req.url.slice(prefix.length);
  return original(req,res);
 };
}
