import json,pathlib,hashlib
D=pathlib.Path('tools/review/world-r3/gate2c-verification');schema=json.loads(pathlib.Path('tools/review/world-r3/gate2c/WORLD-R3-GMCH-ANSWER-SCHEMA.json').read_text(encoding='utf-8'));results=[]
for p in (D/'EVIDENCED-ANSWERS').glob('*.json'):
 a=json.loads(p.read_text(encoding='utf-8'))
 if 'question' not in a:continue
 typ=p.name.split('-')[0];lang=a['question']['lang'];qid={'MY':'Q02','US':'Q05','COMPARE':'Q16','HOUSEHOLD':'Q11'}[typ]
 a['figures']=[{'kind':'existing_offline_source_table_and_chart' if typ in ['MY','HOUSEHOLD'] else 'existing_definition_and_scope_table','href':'../../gate2c/WORLD-R3-GMCH-PROTOTYPE.html?id='+qid+'&lang='+lang+'&country='+('USA' if typ=='US' else 'MYS')+'&period=2024','source_binding':'Existing prototype uses same SHA-bound normalized observations; Atlas illustration is not numeric evidence','mode':'OFFLINE_PREVIEW_NOT_PRODUCT'}]
 errors=[]
 for k in schema['required']:
  if k not in a:errors.append('MISSING:'+k)
 for k in ['question','scope','direct_answer']:
  for key in schema['properties'][k]['required']:
   if key not in a[k]:errors.append('MISSING:'+k+'.'+key)
 for c in a['claims']:
  for key in ['id','kind','text','support']:
   if key not in c:errors.append('CLAIM_MISSING:'+key)
  if not all(any(s['id']==x for s in a['sources']) for x in c['support']):errors.append('CLAIM_SOURCE_NOT_BOUND')
 for s in a['sources']:
  raw=pathlib.Path(s['path']).read_bytes()
  if hashlib.sha256(raw).hexdigest()!=s['sha256']:errors.append('HASH:'+s['id'])
  if s['kind']=='published_interpretation_not_statistics':
   obj=json.loads(raw)
   for key in s['locator'].strip('/').split('/'):obj=obj[int(key)] if isinstance(obj,list) else obj[key]
   if s['text'] not in json.dumps(obj,ensure_ascii=False):errors.append('PASSAGE_TEXT:'+s['id'])
 p.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');results.append({'file':p.name,'passed':not errors,'errors':errors,'schemaOwner':'Existing Gate2C schema, additive provenance only','scope':'Shape/source-byte/locator checks, curated semantic review separate'})
(D/'ANSWER-OBJECT-VALIDATION.json').write_text(json.dumps({'results':results,'passed':all(r['passed'] for r in results)},ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(results);assert all(r['passed'] for r in results)
