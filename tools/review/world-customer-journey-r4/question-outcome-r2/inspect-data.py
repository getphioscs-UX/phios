from pathlib import Path
import json
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios')
for f in ['content/civilization-atlas/geography/world-selection-geometry-r2.json','content/civilization-atlas/cases/civilization-case-registry-v1.json','content/civilization-atlas/search/world-search-index-v1.json']:
 d=json.loads((r/f).read_text(encoding='utf-8'));print(f,list(d)[:8])
 if 'features'in d: print(json.dumps({k:v for k,v in d['features'][0].items() if k not in ['geometry','rings','polygons','coordinates','path']},ensure_ascii=True))
 if 'cases'in d:
  print(json.dumps([{'id':c['caseId'],'title':c['title'],'region':c['region'],'time':c['timeWindow']}for c in d['cases']if any(x in json.dumps(c).lower() for x in ['malaysia','malacca','singapore'])],ensure_ascii=True)[:3500])
 if 'rows'in d: print(json.dumps([{'id':c['id'],'title':c.get('title'),'regionId':c.get('regionId'),'region':c.get('region'),'time':c.get('time'),'source':c.get('source'),'locales':list(c.get('locales',{}))}for c in d['rows']if c.get('type')=='published-reading' and any(x in json.dumps(c).lower() for x in ['malaysia','malacca','singapore'])],ensure_ascii=True)[:2500])
