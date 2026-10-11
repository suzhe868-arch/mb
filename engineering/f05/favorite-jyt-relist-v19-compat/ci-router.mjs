// F05-3J CI-only path adapter. Delegates every auth, rate limit, body, origin,
// credential, immutable receipt and safe response rule to the signed F05-3B router.
import {createJytSyncContractHandler} from '../jyt-wholesale-lineage-cycle/ci-router.mjs';
export async function createRelistCIHandler(auth){
 const original=await createJytSyncContractHandler(auth);
 return async(req,res)=>{
  const route=req.url||'';
  if(!route.startsWith('/__ci__/f05-3j/v1/vehicles/')){
   res.writeHead(404,{'content-type':'application/json','cache-control':'private, no-store'});
   res.end(JSON.stringify({code:'F05_3J_CI_ROUTE_NOT_REGISTERED'}));return;
  }
  req.url='/__ci__/f05-3b/v1/vehicles/'+route.slice('/__ci__/f05-3j/v1/vehicles/'.length);
  return original(req,res);
 };
}
