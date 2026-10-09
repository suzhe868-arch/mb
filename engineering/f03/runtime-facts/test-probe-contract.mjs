// Strict test-only probe request: no client principal, capability, scope,
// resource, or SQL identifier can be used as a trusted authorization fact.
export function validateProbe(data){
 if(data===null||typeof data!=='object'||Array.isArray(data))return {valid:false};
 const keys=Object.keys(data);
 if(keys.length!==1||keys[0]!=='operation'||typeof data.operation!=='string'||
    data.operation.length>128)return {valid:false};
 return {valid:true,operation:data.operation};
}
export function parseHostCookie(raw){
 if(typeof raw!=='string'||raw.length>4096)return null;
 const all=raw.split(';').map(x=>x.trim()).filter(x=>x.startsWith('__Host-mb_pc='));
 if(all.length!==1)return null;
 const token=all[0].slice('__Host-mb_pc='.length);
 return /^[A-Za-z0-9_-]{43}$/.test(token)?token:null;
}
