#!/usr/bin/env python3
"""Offline structural-only QA for the PHI OS HD R6 handoff. Never proves rights or clinical validity."""
from pathlib import Path
import json,re,hashlib
base=Path(__file__).resolve().parent.parent
status=[]
def check(name,condition):
 status.append({'check':name,'pass':bool(condition)});
 if not condition:print('FAIL:',name)
for sec in ('SEC07','SEC09','SEC10','SEC15'):
 for lang in ('zh-Hans','en'):
  p=base/'manuscripts'/f'{sec}.{lang}.md';check(f'{sec} {lang} exists',p.is_file() and p.stat().st_size>1000)
  if p.is_file():
   t=p.read_text(encoding='utf8'); ids=re.findall(r'^###\s+(\d{2}\.\d{1,2})',t,re.M)
   expect=6 if sec=='SEC09' else 11 if sec=='SEC10' else 12
   check(f'{sec} {lang} count',len(ids)==expect)
   check(f'{sec} {lang} unique IDs',len(set(ids))==len(ids))
   check(f'{sec} {lang} no withdrawn named cognition',all(x not in t.casefold() for x in ('inner vision','内在视觉')))
check('SEC10 old 10.7 absent',all('### 10.7' not in (base/'manuscripts'/f'SEC10.{l}.md').read_text() for l in ('zh-Hans','en')))
check('Withdrawn Cognition source units absent from active source index',all(x not in (base/'provenance/SOURCE-AND-RIGHTS-INDEX.json').read_text() for x in ('HD-UA-COGNITION-4','HD-R3-W11-COGNITION-4')))
r=json.loads((base/'contracts/CONDITIONAL-SECTION-CONTRACT.proposed.json').read_text())
check('all contract selectors exist',len(r['selectionRules'])==6+12+11+12)
check('all source rights unresolved',all(x.get('inheritance',{}).get('productionEligible') is False for x in r['selectionRules']))
check('no paid generation',r['globalAdmissionGate']['allowCommercialGeneration'] is False)
print(json.dumps({'checks':len(status),'passed':sum(x['pass'] for x in status),'failed':[x['check'] for x in status if not x['pass']]},ensure_ascii=False,indent=2))
raise SystemExit(0 if all(x['pass'] for x in status) else 1)
