"""Import supplied drafts only; preserve source bytes and frozen question authority."""
import pathlib,re,json,hashlib,sys
ROOT=pathlib.Path.cwd(); BASE=ROOT/'content/ecr-phi-card/customer-reading-r2';BASE.mkdir(exist_ok=True)
sources={'C':'93050034-34be-45dd-9f50-d0cdabeedd6c','D':'41705f90-70c8-42fd-92b8-0e1fe971d4f6','F':'e23b7fe8-0c3c-4498-922c-d431396e336a','G':'b713b852-ae6e-4214-93d6-e5e35ac7bf20','P':'646222ee-bc24-46e9-9c8e-5b0fe4d2c251','T':'84df0ef6-16eb-402a-a03e-c7abd558e59d'}
deck=json.loads((ROOT/'content/ecr-phi-card/ecr-phi-card-deck-registry-v2.json').read_text(encoding='utf-8'));cards={c['cardId']:c for c in deck['cards']}
patterns=[('glance','一句话理解'),('invitation','这张卡想提醒什么'),('examples','现实中可能如何出现'),('approach','什么做法更有帮助'),('watch','什么情况需要留意'),('action','现在可以做什么'),('proposedQuestion','留给自己的问题')]
cjk=lambda s:bool(re.search(r'[\u3400-\u9fff]',s))
records={};audit=[];source_receipts=[]
for family,attachment in sources.items():
 raw=(pathlib.Path('C:/Users/Guest Account/.codex/attachments')/attachment/'Pasted text.txt').read_bytes();text=raw.decode('utf-8-sig');(BASE/f'{family}-source.txt').write_bytes(raw)
 source_receipts.append({'series':family,'attachmentId':attachment,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)})
 matches=list(re.finditer(r'^#\s+([CDGTFP]0[1-8])\s*[—–-].*$',text,re.M));assert len(matches)==8,(family,len(matches))
 for i,m in enumerate(matches):
  short=m[1];cid='ECR-PC-'+short;chunk=text[m.end():matches[i+1].start() if i+1<len(matches) else len(text)];frozen=cards[cid];sections={k:{'zh-Hans':[],'en':[]} for k,_ in patterns};boundary={'zh-Hans':[],'en':[]};current=None;in_boundary=False;ignored=[]
  for para in re.split(r'\n\s*\n',chunk):
   para=para.strip()
   if not para:continue
   if re.fullmatch(r'[-_*]{3,}',para):in_boundary=True;continue
   heading=next((k for k,label in patterns if label in para and len(para)<140),None)
   if heading:current=heading;in_boundary=False;continue
   if re.fullmatch(r'[#*_\s]*(?:At a Glance|What This Card Invites You to Consider|How It May Appear in Real Life|A Helpful Approach|What to Watch For|One Small Action|Your Reflection Question)[*_\s]*',para):continue
   clean=re.sub(r'^#{1,6}\s*','',para);clean=clean.replace('**','').strip('_').strip()
   if not current:ignored.append(clean);continue
   target=boundary if in_boundary else sections[current]
   # Paired bilingual example headings are divided, never duplicated in a language DOM.
   if re.match(r'^(?:#+|\\*\\*)',para) and '\n' not in para and cjk(clean) and re.search(r'\s[/|｜]\s',clean):
    for part in re.split(r'\s[/|｜]\s',clean):target['zh-Hans' if cjk(part) else 'en'].append(part.strip())
   else:target['zh-Hans' if cjk(clean) else 'en'].append(clean)
  entry={'cardId':cid,'status':'SOURCE_SUPPLIED_CANDIDATE_NOT_R2_HUMAN_ACCEPTED','source':{'file':family+'-source.txt','cardBlockSha256':hashlib.sha256(chunk.encode()).hexdigest()},'locales':{}}
  for lang in ['zh-Hans','en']:
   data={k:v[lang] for k,v in sections.items() if k!='proposedQuestion'}
   data['sourceProposedQuestion']=sections['proposedQuestion'][lang];data['reflectionQuestion']=frozen['observationPrompt'][lang];data['sourceBoundary']=boundary[lang];data['subtitle']=frozen['subtitle'][lang]
   data['sha256']=hashlib.sha256(json.dumps(data,ensure_ascii=False,sort_keys=True).encode()).hexdigest();entry['locales'][lang]=data
   missing=[k for k in ['glance','invitation','examples','approach','watch','action'] if not data[k]]
   audit.append({'cardId':cid,'locale':lang,'missing':missing,'sourceQuestionMatchesFrozen':'\n\n'.join(data['sourceProposedQuestion'])==data['reflectionQuestion'],'bodyParagraphs':sum(len(data[k]) for k in ['glance','invitation','examples','approach','watch','action']),'contentSha256':data['sha256']})
  records[cid]=entry
out={'schemaVersion':'PHI_CARD_CUSTOMER_READING_R2_1','status':'LOCAL_HUMAN_REVIEW_CANDIDATE','canonicalRegistryReplaced':False,'r1AdmissionInheritedForNewCopy':False,'sources':source_receipts,'cards':records}
(BASE/'customer-reading-copy.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
review=ROOT/'tools/review/phi-card-customer-experience-r2';review.mkdir(exist_ok=True)
(review/'COPY-COVERAGE.json').write_text(json.dumps({'cards':len(records),'languageVersions':len(audit),'missing':[r for r in audit if r['missing']],'questionDifferences':[r for r in audit if not r['sourceQuestionMatchesFrozen']],'policy':'Display frozen observationPrompt exactly; proposed draft questions retained separately, never override registry.','rows':audit,'sources':source_receipts},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'cards':len(records),'versions':len(audit),'missing':sum(bool(r['missing']) for r in audit),'questionDifferences':sum(not r['sourceQuestionMatchesFrozen'] for r in audit)}))
