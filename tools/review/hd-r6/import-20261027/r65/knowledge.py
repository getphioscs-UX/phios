import json,pathlib,re,hashlib,collections
from PIL import Image
D=pathlib.Path('tools/review/hd-r6/import-20261027/r65');raw=json.loads(pathlib.Path('.tmp/hd-r65-private/workbook-exact-cells.json').read_text(encoding='utf-8'));j=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8'));save=lambda n,v:(D/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');hashtext=lambda x:hashlib.sha256(str(x).encode()).hexdigest()
end=j('content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W8-channel-source-structural-resolution-v1.json')['channelEndpoints'];pairs={frozenset([x['gateA'],x['gateB']]):x for x in end};units=[];audit=[];duplicates=[];risks=[]
gateOwner={x['gate']:x for x in j('content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W9-gate-source-resolution-v1.json')['gates']}
for s in raw:
 cells={x['coordinate']:x['value'] for x in s['cells']};seen={}
 for coord,value in cells.items():
  text=str(value)
  if len(text)>100:
   h=hashtext(text)
   if h in seen:duplicates.append({'language':s['language'],'sheet':s['sheet'],'cell':coord,'duplicateOf':seen[h],'sha256':h})
   seen[h]=coord
   if re.search(r'治愈|疾病|癌|疗愈|heal|disease|cancer|diagnos',text,re.I):risks.append({'language':s['language'],'sheet':s['sheet'],'cell':coord,'status':'MEDICAL_OR_HEALING_REVIEW_HOLD','sha256':h})
 if s['sheet'] not in ['闸门','通道']:continue
 gates=set();channels=[]
 for row in range(2,38):
  pair=str(cells.get('B'+str(row),''));m=re.fullmatch(r'(\d+)\s*[-–—]\s*(\d+)',pair.lstrip("'‘’ "))
  if not m:continue
  a,b=map(int,m.groups());gates.update([a,b]);channels.append([a,b]);owner=pairs.get(frozenset([a,b]));audit.append({'language':s['language'],'sheet':s['sheet'],'row':row,'gates':[a,b],'endpointIdentity':'MATCH_EXISTING_OWNER' if owner else 'FAIL','centers':[owner['centerA'],owner['centerB']] if owner else None,'proseSemantics':'PENDING_PARAGRAPH_REVIEW','circuit':'NOT_INFERRED_FROM_ROW_GROUP'})
  for gate,labelcol,bodycol in ([(a,'C','D'),(b,'E','F')] if s['sheet']=='闸门' else [(None,'F','G')]):
   coord=bodycol+str(row);text=str(cells.get(coord,''));unit={'semanticId':f'HD-R65-{s["language"]}-{s["sheet"]}-{gate or pair}','topic':'GATE' if gate else 'CHANNEL','gate':gate,'channel':[a,b],'sourceOwnerId':owner['sourceUnitId'] if owner else None,'source':{'fileSHA256':s['sourceSHA256'],'sheet':s['sheet'],'cell':coord,'labelCell':labelcol+str(row),'textSHA256':hashtext(text)},'sourceLabel':str(cells.get(labelcol+str(row),'')),'rights':'UNESTABLISHED_EXPRESSION_DO_NOT_COPY','editorial':'PRIVATE_SOURCE_REVIEW','semantic':'STRUCTURAL_IDENTITY_ONLY_NOT_PROSE_ADMISSION','namespace':'CORE_HD','applicability':{'line':None,'side':None,'planet':None,'rule':'No exact Line/side/planet authorization inferred from generic Gate prose'},'publicationAllowed':False}
   unit['semanticId']+='-'+coord
   unit['language']=s['language']
   unit['canonicalIdentity']={'topic':unit['topic'],'gate':gate,'channel':None if gate else [a,b]}
   if gate:unit['sourceOwnerId']=gateOwner[gate]['primarySourceUnitId'];unit['center']=gateOwner[gate]['center'];unit['relationSourceUnitIds']=gateOwner[gate]['relationSourceUnitIds']
   if s['language']=='en' and s['sheet']=='闸门' and coord=='D35':unit.update({'semantic':'QUARANTINED_WRONG_HARMONIC_GATE_AND_CENTER_LABEL','selectionAllowed':False})
   units.append(unit)
  # Specific misidentity detection checks claims within prose, beyond short labels.
  if s['language']=='en' and s['sheet']=='闸门':
   for gate,col in [(a,'D'),(b,'F')]:
    text=str(cells.get(col+str(row),''));claimed=[int(x) for x in re.findall(r'Gate\s+(\d+)\b',text,re.I)]
    if any(x!=gate for x in claimed):risks.append({'language':'en','sheet':'闸门','cell':col+str(row),'expectedGate':gate,'mentionedGates':claimed,'status':'POTENTIAL_IDENTITY_OR_CONTEXT_CONFLICT_REVIEW','sha256':hashtext(text)})
 assert len(channels)==36 and gates==set(range(1,65)),(s['language'],s['sheet'],len(channels),len(gates))
e=next(s for s in raw if s['language']=='en' and s['sheet']=='闸门');ec={x['coordinate']:str(x['value']) for x in e['cells']};corrections=[]
topicSheets={'类型':'TYPE','内在权威':'AUTHORITY','中心':'CENTER','角色pg2':'PROFILE','PHS & RAVE':'PHS','环境':'ENVIRONMENT','视角':'PERSPECTIVE','动力':'MOTIVATION','爻':'LINE'}
for s in raw:
 topic=topicSheets.get(s['sheet'])
 if s['sheet']=='几分人' and s['language']=='en':topic='DEFINITION'
 if not topic:continue
 cells={x['coordinate']:x['value'] for x in s['cells']}
 for coord,value in cells.items():
  if len(str(value))<45:continue
  identity=None;col=re.sub(r'\d','',coord);row=int(re.sub(r'\D','',coord))
  if topic=='TYPE' and row==2:identity={'typeCode':{'A':'MANIFESTOR','B':'GENERATOR','C':'MANIFESTING_GENERATOR','D':'PROJECTOR','E':'REFLECTOR'}.get(col)}
  if topic=='AUTHORITY' and row==3:identity={'authority':{'A':'EMOTIONAL','B':'SACRAL','C':'SPLENIC','D':'EGO_UNSPECIFIED_REQUIRES_SUBTYPE','E':'SELF_PROJECTED','F':'MENTAL'}.get(col)}
  if topic=='PROFILE':
   label=str(cells.get(col+str(row-1),''));m=re.fullmatch(r'[‘’\x27 ]*([1-6]/[1-6])',label)
   if m:identity={'profileCode':m.group(1)}
  units.append({'semanticId':f'HD-R65-{s["language"]}-{topic}-{coord}','topic':topic,'language':s['language'],'canonicalIdentity':identity,'sourceOwnerId':'EXISTING_HD_PRO_R3_TOPIC_OWNER','source':{'fileSHA256':s['sourceSHA256'],'sheet':s['sheet'],'cell':coord,'textSHA256':hashtext(value)},'rights':'UNESTABLISHED_EXPRESSION_DO_NOT_COPY','editorial':'PRIVATE_SOURCE_REVIEW','semantic':'PENDING_EXACT_MEANING_AND_SCHOOL','mapping':'EXPLICIT_IDENTITY_ONLY' if identity else 'UNMAPPED_DO_NOT_SELECT','publicationAllowed':False})
assert len({u['semanticId'] for u in units})==len(units)
for cell,gate,wrong,label,zh,en in [('D5',17,52,'Opinions','当你提出一个判断时，先区分观察到的模式、形成的意见和仍待验证的细节。意见能够帮助整理问题；只有经过事实检验，才能成为可依赖的结论。','An opinion can organize a pattern into a proposal. Keep the observed pattern separate from your interpretation, then invite a check of the details before treating that proposal as a dependable conclusion.'),('F32',54,42,'Ambition','追求更大的参与空间时，明确你希望承担什么、能够贡献什么，以及这段合作需要哪些公平条件。抱负可以形成方向；资源、技能和对方的选择仍会影响机会。','Ambition can focus attention on a larger role. Define the contribution you can make and the conditions of a fair exchange. Skills, resources and the other person’s choices still shape which opportunities are workable.')]:
 actual=ec[cell];valid=label.lower() in actual.lower() and not re.search(r'Gate\s+'+str(wrong)+r'\b',actual,re.I);corrections.append({'sourceCell':'闸门!'+cell,'expectedGate':gate,'expectedLabel':label,'historicalWrongGate':wrong,'currentSHA256':hashtext(actual),'currentObservation':'IDENTITY_CORRECT_HISTORICAL_ERROR_NOT_REPRODUCED' if valid else 'QUARANTINED_SOURCE_IDENTITY_ERROR','historicalBadVariant':'DENY_AS_INTERPRETIVE_INPUT','correctedCandidate':{'semanticId':f'HD-R65-GATE-{gate}-ORIGINAL-REVIEW-v1','zh-Hans':zh,'en':en,'editorial':'PENDING','semantic':'PENDING','commercial':False}})
alignment={}
for u in units:
 u['immutableContentHash']=u['source']['textSHA256'];u['textVersion']=u['source']['fileSHA256']+':'+u['source']['cell'];identity=u.get('canonicalIdentity')
 if identity:
  key=u['topic']+':'+json.dumps(identity,sort_keys=True);a=alignment.setdefault(key,{'topic':u['topic'],'identity':identity,'zh-Hans':[],'en':[],'meaningEquivalent':'REQUIRES_SEMANTIC_REVIEW_NOT_LITERAL_TRANSLATION'})
  a[u['language']].append(u['semanticId'])
save('PRIVATE-NORMALIZATION-CONTRACT.json',{'extends':['HD-PRO-R3-W8 existing channel owner','HD-PRO-R3-W9 existing Gate owner','R6 conditional paragraph selector'],'rawCellsLocation':'.tmp/hd-r65-private/workbook-exact-cells.json','units':units,'bilingualConceptIndex':list(alignment.values()),'topicCounts':dict(collections.Counter(u['topic'] for u in units)),'predicatePolicy':{'facts':'Exact immutable confirmed calculation','narrative':'Only matched local editorial candidate; commercial semantic/rights approval separately required','withdrawnCognition':'ALWAYS_DENY','specialist':'No BG5/GeneKeys/astrology/medical/DreamRave import','conflicts':'Hold conflicting unit, do not combine prose','bilingual':'Source languages kept independent; no forced literal equivalence','unmapped':'NO_AUTO_SELECTION'},'modelCost':{'capUsd':5,'followups':4,'reserveUsd':0.5,'providerCalls':0}})
corrections.append({'sourceCell':'闸门!D35','language':'en','expectedGate':10,'currentSHA256':hashtext(ec['D35']),'currentObservation':'CONFIRMED_WRONG_HARMONIC_50_SHOULD_BE57_AND_GATE34_CENTER_LABEL','actual':'Gate10 to Spleen through Gate50; Gate34 labelled Life Force/Heart Center','expected':'Existing owner:10–57 to Spleen,10–34 to Sacral,10–20 to Throat. Gate50 belongs to27–50.','status':'QUARANTINED_DO_NOT_SELECT','correctedCandidate':{'semanticId':'HD-R65-GATE-10-RELATION-CORRECTION-v1','zh-Hans':'闸门10位于G中心。结构上的相关完整通道为10–20、10–34和10–57，分别连向喉咙、荐骨和脾中心；是否形成完整连接，须核对两个端点的实际激活。','en':'Gate10 is in G. Its possible complete Channels are10–20 to Throat,10–34 to Sacral and10–57 to Spleen. A completed connection requires both endpoints to be activated.','editorial':'PENDING','structuralCheck':'MATCH_EXISTING36CHANNEL_OWNER','commercial':False}})
for risk in risks:
 if 'expectedGate' not in risk:continue
 allowed={risk['expectedGate'],*gateOwner[risk['expectedGate']]['harmonicGates']}
 risk['reviewDisposition']='HARMONIC_CONTEXT_NOT_AUTOMATIC_IDENTITY_ERROR' if set(risk['mentionedGates'])<=allowed else 'GATE11_MENTAL_CONTEXT_REFERENCE_REQUIRES_SEMANTIC_REVIEW' if risk['cell']=='D7' else 'CONFIRMED_QUARANTINED_D35'
save('IDENTITY-CORRECTION-MATRIX.json',{'corrections':corrections,'allGateChannelRows':audit,'rawOriginalCellsUnmodified':True,'duplicateParagraphCandidates':duplicates,'semanticRiskCells':risks,'coverage':{'languages':2,'channelRowsPerLanguage':36,'gateIdentitiesPerLanguage':64,'lineNarrativeCoverage':'NOT_384_OR_26_PLANET_SPECIFIC','fullProseSemanticPass':False},'historicalAuditVsCurrent':'Current D5/F32 differ from historical audit. D35 is a separately proven error. Historical audit retained.'})
assets=j(D/'R2-ASSET-READS.json');rows=[]
for a in assets['rows']:
 if not a.get('file'):continue
 im=Image.open(a['file']);im.load();a.update({'width':im.width,'height':im.height,'decode':'PASS','effectiveDpiA4Width':round(im.width/(210/25.4)),'printStatus':'BELOW_300_DPI_PHYSICAL_PRINT_UNVERIFIED','registeredCurrentHdApproval':'NO_HD_BINDING_IN_SHARED_CURRENT_REGISTRY','renderRole':'BODY_BACKGROUND_WITH_OPAQUE_READING_PANEL' if a['section']=='BODY' else 'FIXED_BILINGUAL_CHAPTER_OPENER','localDesignAdmission':'OWNER_R65_LOCAL_ONLY','disposition':'EXCLUDE_STALE_WITHDRAWN_INNER_VISION' if a['section']==11 else 'EMBED_OWNER_REVIEW_CANDIDATE_NOT_COMMERCIAL'})
 if a['section']==11:assert a['sha256']=='f22a1fe71d105bbfd187511591360d1bfc1baed4ed6fbe42eb226154653683aa'
 rows.append(a)
save('R2-ASSET-MANIFEST.json',{'rows':rows,'embeddedSectionPosters':16,'missingRequiredReplacement':['SEC11 exact approved replacement bytes/hash not supplied; fresh GET matches stale oldSHA'],'print300DpiPass':False,'all17IntegrationPass':False,'bodyReused':True,'writes':0})
save('CHECKPOINT.json',{'stage':'SOURCE_IDENTIFIED_ASSETS_FRESH_NORMALIZATION_READY','next':'Shared64Gate36Channel geometry, controlled section packets, original depth writing, three PDF candidates and physical QA','providerCalls':0,'productionWrites':0})
print(json.dumps({'sourceUnits':len(units),'structuralRows':len(audit),'riskCells':len(risks),'duplicates':len(duplicates),'corrections':[x['currentObservation'] for x in corrections],'assetsDecoded':len(rows),'posterEmbeddable':16}))
