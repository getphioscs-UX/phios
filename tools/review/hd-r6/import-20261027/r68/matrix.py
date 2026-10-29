import pathlib,json,csv,hashlib
D=pathlib.Path('tools/review/hd-r6/import-20261027/r68');j=lambda n:json.loads((D/n).read_text());save=lambda n,x:(D/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');C=j('COHORT-96.json')['cohort'];dec=j('PARAGRAPH-DECISIONS.json');primary=j('CURRENT-PLAN.json')['preview']['chart'];g=j('BODYGRAPH-GEOMETRY.json')['gates']
has=lambda c,n:any(a['gate']==n for a in c['activations']);act=lambda c,s,b:next(a for a in c['activations'] if a['layer']==s and a['bodyCode']==b)
queries={
'R02':lambda c:c['typeCode']!='GENERATOR','R03':lambda c:c['typeCode']=='MANIFESTING_GENERATOR','R04':lambda c:c['authority']!='EMOTIONAL','R05':lambda c:c['profile']['profileCode']=='6/2',
'R06':lambda c:c['definition']['definitionCode'] in ['SINGLE_DEFINITION','SPLIT_DEFINITION','QUADRUPLE_SPLIT_DEFINITION'],
'R07':lambda c:'HEAD' in c['definedCenters'],'R08':lambda c:'HEAD' not in c['definedCenters'] and any(g[str(a['gate'])]['center']=='HEAD' for a in c['activations']),
'R09':lambda c:has(c,43) and not has(c,23),'R10':lambda c:act(c,'PERSONALITY','SUN')['gate']==43 and act(c,'PERSONALITY','SUN')['line']==4,
'R11':lambda c:any(a['gate']==43 and a['line']==5 and (a['layer'],a['bodyCode'])!=('PERSONALITY','SUN') for a in c['activations']),
'R12':lambda c:has(c,29) and not has(c,46),'R13':lambda c:c['incarnationCross']['configurationCode']=='23/43|30/29',
'R15':lambda c:c['variables']['fields']['designLower']['color']!=3,'R16':lambda c:c['variables']['fields']['personalityUpper']['color']==5}
rows=list(csv.DictReader((D/'input/PHIOS-HD-R68-HANDOFF/R68-MULTI-CHART-REGRESSION-MATRIX.csv').open(encoding='utf-8-sig')))
for r in rows:
 id=r['id'];r['evidence']=[]
 if id in queries:
  matches=[v for v in C if queries[id](v['chart'])];r.update(status='PASS_VALID_CALCULATED_FIXTURES' if matches else 'BLOCKED_VALID_FIXTURE_NOT_IN_EXISTING_96',observed_result=f'{len(matches)} valid recalculated fixtures; no manually mutated chart counted',fixtureIds=[x['id'] for x in matches],evidence=['COHORT-96.json','FIELD-BINDINGS.json'])
  if id=='R06':r['remaining']='Single and Split exercised; Quadruple not found in existing cohort. Quadruple-specific regression remains unexecuted.';r['status']='PARTIAL_SINGLE_SPLIT_QUADRUPLE_MISSING'
  if id=='R08':r['remaining']='Canonical geometry distinguishes fully open from undefined with activation; no generic undefined-to-open coercion.'
 else:r.update(status='PENDING_DOWNSTREAM',observed_result='Await final physical PDF / entitlement checks')
 if id=='R14':r.update(status='PASS',observed_result='namedCross is null in actual reference; ordered gate identity retained; no book narrative admitted',evidence=['TARGETED-CHECKS.json'])
 if id=='R17':r.update(status='PASS_FAIL_CLOSED_GUARDS',observed_result='Missing factual values rejected in existing owner; all Low Sound subtype paragraphs held. Negative guard tests do not claim valid alternative Tone charts.',evidence=['TARGETED-CHECKS.json','PARAGRAPH-DECISIONS.json'])
 if id=='R18':r.update(status='PARTIAL_NO_COGNITION_INFERENCE',observed_result='Actual reference Tone4 and cognition=null. No withdrawn textual inference selected. A valid independently populated Cognition fixture is unavailable; approved SEC11 generic artwork is intentionally retained.',evidence=['PARAGRAPH-DECISIONS.json','SEC11-OWNER-VISUAL-ACCEPTANCE.json'])
 if id=='R19':r.update(status='PASS_NO_DISPUTED_LINE_INTERPRETATION',observed_result='Calculated Venus position unchanged. No Venus46.2/46.3 personalized line paragraph selected; no text manipulation to resolve calculation precision.',evidence=['PARAGRAPH-DECISIONS.json','CURRENT-PLAN.json'])
 if id=='R20':r.update(status='PASS_GAPS_RETAINED',observed_result='Two contrasting real chart generation attempts in all three languages explicitly report missing semantic sections; unauthorized source lists select zero paragraphs.',evidence=['CONTRAST-1.json','CONTRAST-2.json','TARGETED-CHECKS.json'])
 if id=='R21':r.update(status='PASS',observed_result='Changed birth identity with existing signed token rejected as stale; cross-account, revoked access and expiry rejected',evidence=['TARGETED-CHECKS.json'])
save('MULTI-CHART-REGRESSION-MATRIX.json',{'cases':rows,'caseCount':26,'notAllPass':True,'scope':'Actual valid 96-chart cohort plus separately labeled guard tests. No hand-mutated Type fixtures. No missing fixture is reported PASS.'})
print([(r['id'],r['status']) for r in rows if r['status'].startswith(('BLOCKED','PARTIAL'))])
