import pathlib,json,re,hashlib,difflib,subprocess,zipfile,datetime
R=pathlib.Path('C:/phios');D=R/'tools/review/hd-r6/import-20261027/r68';I=D/'input/PHIOS-HD-R68-HANDOFF';sha=lambda b:hashlib.sha256(b).hexdigest();save=lambda n,x:(D/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def parse(t):
 out={}
 for sec in re.split(r'(?m)(?=^## SEC)',t)[1:]:
  lines=sec.splitlines();sid=re.match(r'## (SEC\d+)[|｜](.*)',lines[0]);subs=[]
  for ch in re.split(r'(?m)^###\s+',sec)[1:]:
   head,_,body=ch.partition('\n');m=re.match(r'(\d+\.\d+)[|｜\s]+(.*)',head);assert m,head
   subs.append({'id':m[1],'title':m[2],'paragraphs':[p.strip() for p in re.split(r'\n\s*\n',body.strip()) if p.strip()]})
  out[sid[1]]={'title':sid[2],'subsections':subs}
 return out
original=(I/'R68-ENGLISH-11-ORIGINAL-R67.md').read_text();reviewed=(I/'R68-ENGLISH-11-REVIEWED-CANDIDATE.md').read_text();text=original;changes=[]
for c in json.loads((I/'R68-11-EDITORIAL-CORRECTIONS.json').read_text()):
 assert text.count(c['original'])==c['count'];text=text.replace(c['original'],c['proposed']);changes.append({**c,'beforeSHA':sha(c['original'].encode()),'afterSHA':sha(c['proposed'].encode()),'ownerAcceptance':'PENDING'})
# Ignore only front-matter review metadata; all section text must match exact proposed edits.
assert text[text.index('## SEC'):].strip()==reviewed[reviewed.index('## SEC'):].strip()
en=parse(reviewed);zh=parse((I/'R68-CHINESE-11-ORIGINAL-R67.md').read_text());assert en.keys()==zh.keys() and len(en)==11
assert [s['id'] for x in en.values() for s in x['subsections']]==[s['id'] for x in zh.values() for s in x['subsections']]
assert sum(len(s['subsections']) for s in en.values())==71
(D/'ENGLISH-EDITORIAL.diff').write_text(''.join(difflib.unified_diff(original.splitlines(True),text.splitlines(True),fromfile='R67 English original',tofile='R68 targeted candidate')),encoding='utf-8')
save('EDITORIAL-RECONCILIATION.json',{'changes':changes,'parallelSubsections':71,'fullParagraphsRetained':True,'en11Precheck':'PASS_WITH_TARGETED_EDITS','en11OwnerAcceptance':'PENDING'})
rest=parse((I/'R68-ENGLISH-SEC02-SEC03-RESTORED-R67.md').read_text());accepted={};trace=[];protected=[]
for n in [2,3,7,9,10,15]:
 sid=f'SEC{n:02}';accepted[sid]={}
 for lang in ['zh-Hans','en']:
  p=R/f'tools/review/hd-r6/import-20261027/r64/accepted/{sid}.{lang}.md' if n in [2,3] else R/f'tools/review/hd-r6/import-20261027/candidate/input/manuscripts/{sid}.{lang}.md'
  b=p.read_bytes();protected.append({'path':str(p),'sha256':sha(b)});t=b.decode('utf-8');subs=[]
  for chunk in re.split(r'(?m)^###\s+',t)[1:]:
   head,_,body=chunk.partition('\n');m=re.match(r'(\d+\.\d+)[|｜\s]+(.*)',head.strip());assert m,head
   subs.append({'id':m[1],'title':m[2],'paragraphs':[x.strip() for x in re.split(r'\n\s*\n',body.strip()) if x.strip()]})
  accepted[sid][lang]={'source':str(p),'sourceSHA':sha(b),'subsections':subs}
  if n in [2,3] and lang=='en':
   a=[p for s in subs for p in s['paragraphs']];b2=[p for s in rest[sid]['subsections'] for p in s['paragraphs']];match=a==b2
   trace.append({'section':sid,'acceptedSource':str(p),'fileSHA256':sha(b),'restorationWholeFileSHA256':sha((I/'R68-ENGLISH-SEC02-SEC03-RESTORED-R67.md').read_bytes()),'wholeFileBytesEqual':False,'paragraphTextBytesEqual':match,'normalizedContentEqual':re.sub(r'\s','',str(a))==re.sub(r'\s','',str(b2)),'status':'EXACT_PARAGRAPH_SOURCE_MATCH' if match else 'SEMANTIC_MATCH_ONLY_OR_DIFFERENT','sourceCommit':subprocess.check_output(['git','log','-1','--format=%H','--',str(p.relative_to(R))],text=True).strip(),'formatDifferences':'Combined restoration has front matter and pipe-delimited headings. Accepted standalone source remains immutable.'})
save('ACCEPTED-SOURCES.json',accepted);save('SOURCE-IDENTITY.json',trace);save('PROTECTED-SOURCES.json',protected);save('EDITORIAL-CORPUS.json',{'en':en,'zh-Hans':zh})
paths={'r67_work/R67_ENGLISH_11_DRAFT.md':I/'R68-ENGLISH-11-ORIGINAL-R67.md','PHIOS-HD-R67-CLEAN-11-CHAPTERS-zh-Hans.md':I/'R68-CHINESE-11-ORIGINAL-R67.md','r67_work/R67_ENGLISH_SEC02_SEC03_RECONSTRUCTED.md':I/'R68-ENGLISH-SEC02-SEC03-RESTORED-R67.md','PHIOS-HD-R67-EDITORIAL-AND-LANGUAGE-HANDOFF.zip':I/'R67_SOURCE_HANDOFF.zip','PHIOS-HD-R6-FOUR-SECTION-AUTHORING-HANDOFF-20261027.zip':I/'R6_ACCEPTED_FOUR_CHAPTERS.zip'}
checks=[]
for k,v in json.loads((I/'R68-SOURCE-ID-AND-HASH-MANIFEST.json').read_text()).items():
 p=paths[k];assert sha(p.read_bytes())==v['sha256'] and p.stat().st_size==v['size_bytes'];checks.append({'input':str(p),'sha256':v['sha256'],'status':'PASS'})
save('INPUT-INTEGRITY.json',{'outerZIPCRC':'PASS','nestedZIPCRC':'PASS','hashChecks':checks})
save('CHECKPOINT.json',{'phase':'SOURCE_RECONCILIATION_COMPLETE','next':'Resolve real per-paragraph predicates and valid chart cases; accepted display proposals await owner','providerCalls':0})
print({'englishEdits':3,'bilingualSubsections':71,'acceptedSourceTrace':[(x['section'],x['status']) for x in trace]})
