from pathlib import Path
import yaml,re,json
src=Path('packages/contracts/openapi.yaml'); out=Path('packages/contracts/generated/types.ts')
d=yaml.safe_load(src.read_text(encoding='utf-8')); schemas=d['components']['schemas']
def q(s): return json.dumps(str(s),ensure_ascii=False)
def refname(ref): return ref.rsplit('/',1)[-1]
def union(xs):
    parts=[]
    for x in xs:
        if x not in parts: parts.append(x)
    return ' | '.join(parts) if parts else 'unknown'
def ts(schema):
    if schema is None: return 'unknown'
    if schema is True: return 'unknown'
    if schema is False: return 'never'
    if '$ref' in schema: return refname(schema['$ref'])
    if 'oneOf' in schema: return union([ts(x) for x in schema['oneOf']])
    if 'anyOf' in schema: return union([ts(x) for x in schema['anyOf']])
    if 'allOf' in schema:
        return ' & '.join(f'({ts(x)})' for x in schema['allOf']) or 'unknown'
    if 'enum' in schema: return union([q(x) if isinstance(x,str) else ('true' if x is True else 'false' if x is False else 'null' if x is None else str(x)) for x in schema['enum']])
    typ=schema.get('type')
    if isinstance(typ,list): return union([ts({**schema,'type':t}) for t in typ])
    if typ=='null': return 'null'
    if typ=='string': return 'string'
    if typ in ('integer','number'): return 'number'
    if typ=='boolean': return 'boolean'
    if typ=='array': return f"Array<{ts(schema.get('items',{}))}>"
    if typ=='object' or 'properties' in schema or 'additionalProperties' in schema:
        props=schema.get('properties',{}) or {}; req=set(schema.get('required',[]) or []); parts=[]
        for name,sub in props.items():
            safe=name if re.fullmatch(r'[A-Za-z_$][A-Za-z0-9_$]*',name) else q(name); opt='' if name in req else '?'; parts.append(f'  {safe}{opt}: {ts(sub)};')
        ap=schema.get('additionalProperties')
        if isinstance(ap,dict): parts.append(f'  [key: string]: {ts(ap)};')
        elif ap is True: parts.append('  [key: string]: unknown;')
        if not parts: return 'Record<string, unknown>'
        return '{\n'+'\n'.join(parts)+'\n}'
    return 'unknown'
lines=['/* AUTO-GENERATED from packages/contracts/openapi.yaml. DO NOT EDIT. */','']
for name,schema in schemas.items(): lines += [f'export type {name} = {ts(schema)};','']
out.write_text('\n'.join(lines),encoding='utf-8'); print(f'generated {len(schemas)} schema types -> {out}')
