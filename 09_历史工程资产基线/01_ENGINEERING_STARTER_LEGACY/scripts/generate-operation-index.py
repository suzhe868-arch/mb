from pathlib import Path
import yaml,json
src=Path('packages/contracts/openapi.yaml'); out=Path('packages/contracts/generated/operation-index.json')
d=yaml.safe_load(src.read_text(encoding='utf-8')); rows=[]
for path,item in d.get('paths',{}).items():
    for method,op in item.items():
        if method.lower() not in {'get','post','put','patch','delete'} or not isinstance(op,dict): continue
        rows.append({'method':method.upper(),'path':path,'operationId':op.get('operationId',''),'identityDomain':op.get('x-identity-domain',''),'permission':op.get('x-permission',''),'scope':op.get('x-scope',''),'projection':op.get('x-projection',''),'idempotency':op.get('x-idempotency',''),'fieldPermissions':op.get('x-field-permissions',{}) or {}})
rows.sort(key=lambda x:(x['path'],x['method']))
out.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); print(f'generated {len(rows)} operations -> {out}')
