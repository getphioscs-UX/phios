import pathlib,json,re,sys,html,difflib,hashlib
root=pathlib.Path(sys.argv[1]);out=root/'r33-publication';index=json.loads((root/'CURRENT-EFFECTIVE-CHAPTERS.json').read_text(encoding='utf8'));ir=json.loads((out/'private-runtime-ir.json').read_text(encoding='utf8'));legacy=json.loads((out/'private-legacy-comparison.json').read_text(encoding='utf8'))['projection']
def load(entry):return (pathlib.Path(entry['folder'])/'exact-text.txt').read_text(encoding='utf8')
def para(text):return [{'paragraph':n+1,'text':p} for n,p in enumerate(re.split(r'\n\s*\n',text)) if len(re.sub(r'\s+','',p))>35 and not p.startswith('#')]
allparas=[{'section':e['sectionId'],'locale':e['locale'],**p} for e in index['versions'] for p in para(load(e))]
themes=[('承担所有责任',r'所有.{0,10}责任|不必.{0,30}承担|不需要.{0,30}承担|替.{0,10}承担|承担.{0,20}一切'),('值得被理解',r'值得.{0,20}(?:理解|看见)|被理解|被看见|有人.{0,15}理解'),('可以休息',r'休息|停下来|慢下来'),('不必证明价值',r'证明.{0,20}价值|不必.{0,15}证明|不需要.{0,15}证明'),('贡献与长期运行',r'长期.{0,15}(?:运行|贡献|付出)|持续.{0,15}(?:运行|贡献|付出)|贡献.{0,30}(?:长期|持续)')]
recurrences=[]
for label,pattern in themes:
 matches=[p for p in allparas if p['locale']=='zh-Hans' and re.search(pattern,p['text'])]
 if len(set(p['section'] for p in matches))>1:recurrences.append({'theme':label,'reason':'跨章反复出现相同安慰或责任主题；可能是有意的叙事呼应，不等于应自动删除。建议作者决定是否只在最相关章节充分展开。','occurrences':matches})
near=[]
gram_cache={id(p):set(re.sub(r'\s+','',p['text'])[i:i+4] for i in range(max(0,len(re.sub(r'\s+','',p['text']))-3))) for p in allparas}
for n,a in enumerate(allparas):
 for b in allparas[n+1:]:
  if a['locale']!=b['locale'] or a['section']==b['section']:continue
  sa=re.sub(r'\s+','',a['text']);sb=re.sub(r'\s+','',b['text'])
  if min(len(sa),len(sb))/max(len(sa),len(sb))<.65:continue
  ga=gram_cache[id(a)];gb=gram_cache[id(b)]
  if len(ga&gb)/max(1,len(ga|gb))<.38:continue
  ratio=difflib.SequenceMatcher(None,sa,sb,autojunk=False).ratio()
  if ratio>=.72:near.append({'first':a,'second':b,'similarity':round(ratio,3),'reason':'相同语言的段落具有较高文本相似度；仅列为出版修订建议，不改动已接受稿。'})
rows=ir['initialization']['activations'];known={str(a['p64']['gate'])+'.'+str(a['p64']['line']) for a in rows};personalization=[];bilingual=[]
tokens=['G11','Q11','R7','R5','A4','H42','M6','M2']
for sid in [f'{i:02}' for i in range(1,11)]:
 pair={e['locale']:load(e) for e in index['versions'] if e['sectionId']==sid};coords={lang:sorted(set(re.findall(r'(?<![\d.])(?:[1-9]|[1-5]\d|6[0-4])\.[1-6](?![\d.])',text))) for lang,text in pair.items()}
 refs={lang:{token:len(re.findall(r'(?<![A-Za-z0-9])'+token+r'(?![A-Za-z0-9])',text)) for token in tokens} for lang,text in pair.items()}
 paragraphs=[p for p in allparas if p['section']==sid]
 personalization.append({'section':sid,'coordinateMentions':coords,'mentionsNotInBaseline26':{lang:[c for c in cs if c not in known] for lang,cs in coords.items()},'identityMentions':refs,'explicitCoordinateEvidence':any(coords.values()),'meaning':'引用坐标可证明个案绑定，但不能证明个人叙述已经成为通用解释或科学验证。'})
 risks=[{'locale':lang,'paragraph':p['paragraph'],'text':p['text'],'reason':'确定性措辞需与另一语言逐段核对，不能仅凭关键词认定存在或不存在命运判断。'} for lang in ['en'] for p in paragraphs if p['locale']==lang and re.search(r'\bdestined\b|\bguaranteed\b|\bwill definitely\b|\bcertain to\b',p['text'],re.I)]
 bilingual.append({'section':sid,'coordinateSetsMatch':coords.get('zh-Hans')==coords.get('en'),'zhOnlyCoordinates':sorted(set(coords.get('zh-Hans',[]))-set(coords.get('en',[]))),'enOnlyCoordinates':sorted(set(coords.get('en',[]))-set(coords.get('zh-Hans',[]))),'identityTokenCounts':refs,'deterministicEnglishFlags':risks,'semanticEquivalence':'HUMAN_REVIEW_REQUIRED_NOT_PROVEN_BY_NUMBER_MATCH','pairedParagraphs':{'zh-Hans':[p for p in paragraphs if p['locale']=='zh-Hans'],'en':[p for p in paragraphs if p['locale']=='en']}})
legacyStructures={s['code']:s['items'] for s in legacy['calculation']['structures']}
identity={'requestedIdentityTokens':tokens,'legacyCompatibilityStructures':legacyStructures,'v41GQRPersonalSelection':[{'topic':t['topic'],'status':t['GQRPersonalSelection']} for t in ir['topicSelection']['topics']],'v41Rule':'P64 activations and four-factor semantic tags are current; legacy single-solar-anchor G/Q/R selections are historical compatibility, not new V4.1 semantic admission.','legacyCoordinatesNotSilentlyPromoted':True,'authorWordsChanged':False}
candidate=[]
for e in index['versions']:
 for p in para(load(e)):
  coords=sorted(set(re.findall(r'(?<![\d.])(?:[1-9]|[1-5]\d|6[0-4])\.[1-6](?![\d.])',p['text'])))
  if not coords:continue
  deps=[]
  for c in coords:
   for a in rows:
    if f"{a['p64']['gate']}.{a['p64']['line']}"==c:
     driver=next((d['driverId'] for d in ir['driverField']['drivers'] if a['bodyCode'] in d['bodyBinding']),None)
     deps.append({'gate':a['p64']['gate'],'line':a['p64']['line'],'driverId':driver,'bodyCode':a['bodyCode'],'layer':a['layer'],'mappingVersion':a['p64']['mappingVersion']})
  candidate.append({'moduleId':f"PRIVATE-CASE-EXCERPT-S{e['sectionId']}-{e['locale']}-P{p['paragraph']}",'sectionId':e['sectionId'],'locale':e['locale'],'calculationDependencies':deps,'canonicalFactorRefs':sorted({f for d in deps for f in [f"BASE:{d['gate']}",f"LINE:{d['line']}",f"DRIVER:{d['driverId']}",f"LAYER:{d['layer']}"]}),'admittedMeaningRefs':[],'editorialText':p['text'],'applicabilityConditions':{'status':'NEEDS_SOURCE_AND_CONDITION_REVIEW','contexts':['PRIVATE_AUTHOR_CASE_ONLY']},'contradictions':['Other Driver/Layer/Line or missing required positions must not receive this whole personal conclusion.'],'prohibitedInferences':['No profession, resources, relationships, ability or future result is established without separately authorized customer evidence.'],'personalEvidenceRequired':['REALITY_OBSERVATIONS_FOR_LIVED_FACTS'],'authorReview':{'status':'REUSABLE_CANDIDATE','caseTextAcceptedOnly':True},'rightsState':'RIGHTS_REVIEW_REQUIRED','caseSpecific':True,'exactVersionDigest':hashlib.sha256(p['text'].encode()).hexdigest(),'productionSelectionAllowed':False})
report={'private':True,'crossChapterThemes':recurrences,'nearDuplicateParagraphs':near,'personalization':personalization,'bilingual':bilingual,'identityProvenance':identity,'editorialDecision':'AUTHOR_DECIDES_ANY_PUBLICATION_REVISION; NO_SOURCE_TEXT_EDITED','semanticAdmissionsGranted':0}
(out/'CONTENT-QUALITY-AUDIT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');(out/'REUSABLE-SEMANTIC-PREPARATION.json').write_text(json.dumps({'private':True,'candidates':candidate,'selectionAllowed':False,'automaticAdmission':False,'classification':['CALCULATED','CANONICAL_THEORY','AUTHOR_ACCEPTED_PRIVATE_CASE','REUSABLE_CANDIDATE','NOT_ADMITTED','CUSTOMER_EVIDENCE_REQUIRED']},ensure_ascii=False,indent=2),encoding='utf8')
esc=lambda x:html.escape(str(x))
parts=['<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><title>Private Content Quality Review</title><style>body{font:16px/1.8 system-ui;max-width:1100px;margin:40px auto;padding:24px;color:#173d40;background:#faf8ef}article{padding:20px;border:1px solid #c5b78d;margin:20px 0}blockquote{white-space:pre-wrap;background:white;padding:20px}summary{cursor:pointer;font-weight:bold}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}</style><h1>私人作者稿 · 十章质量审核</h1><p>全部原文保持不变。下列重复、坐标差异及语义疑点仅供 Founder 决定是否启动出版修订；技术检测不能代替逐段双语语义接受。</p>']
for group in recurrences:
 parts.append('<article><h2>'+esc(group['theme'])+'</h2><p>'+esc(group['reason'])+'</p>')
 for p in group['occurrences']:parts.append('<details><summary>Section '+p['section']+' · 段落 '+str(p['paragraph'])+'</summary><blockquote>'+esc(p['text'])+'</blockquote></details>')
 parts.append('</article>')
for group in bilingual:
 parts.append('<article><h2>Section '+group['section']+' · 中英对照</h2><p>坐标集合一致：'+str(group['coordinateSetsMatch'])+'。完整语义仍需人审。</p><div class="pair">')
 for lang in ['zh-Hans','en']:
  parts.append('<div><h3>'+lang+'</h3>')
  for p in group['pairedParagraphs'][lang]:parts.append('<details><summary>段落 '+str(p['paragraph'])+'</summary><blockquote>'+esc(p['text'])+'</blockquote></details>')
  parts.append('</div>')
 parts.append('</div></article>')
parts.append('</html>');(out/'CONTENT-QUALITY-REVIEW.html').write_text(''.join(parts),encoding='utf8')
print(json.dumps({'qualitySections':len(personalization),'crossChapterThemes':len(recurrences),'nearDuplicatePairs':len(near),'privateCandidateExcerpts':len(candidate),'sourceTextsChanged':False,'semanticAdmission':False}))
