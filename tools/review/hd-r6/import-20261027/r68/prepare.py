exec(compile(open('tools/review/hd-r6/import-20261027/r68/source.py',encoding='utf-8').read(),'source.py','exec'))
import copy
B=R/'tools/review/hd-r6/import-20261027';old=json.loads((B/'r65/FULL-REPORT-SELECTION.json').read_text());contracts=json.loads((B/'candidate/PARAGRAPH-INDEX.json').read_text())['paragraphs'];index={(x['subsectionId'],x['language'],x['paragraph']):x for x in contracts};modules=[];display=[]
for number in range(1,18):
 sid=f'SEC{number:02}'
 for lang in ['zh-Hans','en']:
  subs=accepted[sid][lang]['subsections'] if sid in accepted else (zh if lang=='zh-Hans' else en)[sid]['subsections']
  for sub in subs:
   canonical=f'{sid}.{int(sub["id"].split(".")[1]):02}'
   for ordinal,paragraph in enumerate(sub['paragraphs'],1):
    original=paragraph
    if lang=='en' and canonical=='SEC03.04':paragraph=paragraph.replace('For your test configuration','For your configuration')
    if lang=='en' and canonical=='SEC15.09':
     before='In this historical test chart, the three complete Channels connect the Ajna, Throat, G, Sacral, Ego and Solar Plexus Centers. The Head, Spleen and Root Centers are recorded as undefined.'
     after='In your chart, the three complete Channels connect the Ajna, Throat, G, Sacral, Ego and Solar Plexus Centers. The Head is fully open, while the Spleen and Root are undefined with activated Gates.'
     paragraph=paragraph.replace(before,after)
    second={( 'SEC02.05','zh-Hans',1):('你这份测试配置','你这份配置'),('SEC10.09','zh-Hans',1):('你的完整测试配置','你的完整配置'),('SEC10.12','zh-Hans',1):('你的 PHS 测试配置','你的 PHS 配置'),('SEC10.09','en',1):('Your wider test configuration','Your wider configuration'),('SEC15.03','en',1):('In the current test configuration','In the current configuration')}
    if (canonical,lang,ordinal) in second:
     before,after=second[(canonical,lang,ordinal)];assert before in paragraph;paragraph=paragraph.replace(before,after)
    if paragraph!=original:display.append({'module':f'{canonical}/{lang}/P{ordinal}','before':original,'after':paragraph,'beforeSHA256':sha(original.encode()),'afterSHA256':sha(paragraph.encode()),'authority':'Explicit owner response 1 to five-item display proposal, 2026-10-29' if (canonical,lang,ordinal) in second else 'Explicit owner response 1 to two-item display proposal, 2026-10-29','sourceBytesUnchanged':True})
    legacy=index.get((canonical,lang,ordinal));modules.append({'id':f'{canonical}/{lang}/P{ordinal}','sectionId':sid,'subsectionId':canonical,'paragraph':ordinal,'language':lang,'title':sub['id']+' '+sub['title'],'text':paragraph,'sourceTextSHA256':sha(original.encode()),'paragraphSHA256':sha(paragraph.encode()),'sourceFile':accepted[sid][lang]['source'] if sid in accepted else str(I/('R68-ENGLISH-11-REVIEWED-CANDIDATE.md' if lang=='en' else 'R68-CHINESE-11-ORIGINAL-R67.md')),'legacyRule':legacy,'editorialStatus':'OWNER_EDITORIAL_ACCEPTED' if sid in accepted else 'OWNER_BASIC_ACCEPTANCE' if lang=='zh-Hans' else 'PENDING_OWNER_EN11','rightsStatus':'OPEN_NOT_COMMERCIAL','requestedUse':'OWNER_REVIEW_ONLY'})
assert len(display)==7,display
save('DISPLAY-APPROVAL-RECEIPT.json',{'decision':'APPROVED_TWO_PLUS_FIVE_DISPLAY_CORRECTIONS_ONLY','changes':display,'originalManuscriptsUnchanged':True})
save('MODULES.json',{'candidate':'HD-R68-LOCAL-PARAGRAPH-BINDING','modules':modules,'commercialRelease':False})
for file in ['R2-ASSET-MANIFEST.json','SEC11-OWNER-VISUAL-ACCEPTANCE.json','BODYGRAPH-GEOMETRY.json','BODYGRAPH-STATE.json']:(D/file).write_bytes((B/'r65'/file).read_bytes())
receipts=json.loads((B/'r64/ACCEPTED-SOURCE-IMPORT.json').read_text())['imports']
for t in trace:
 rec=next(x for x in receipts if x['section']==t['section'] and x['language']=='en');p=R/rec['path'];assert sha(p.read_bytes())==rec['sha256'];t.update({'acceptedFileMatchesOriginalImportSHA':True,'acceptedImportSHA256':rec['sha256'],'status':'EXACT_ACCEPTED_SOURCE_RECOVERED_RESTORED_FILE_NOT_BYTE_IDENTICAL','restoredProseEqualAfterRemovingMarkdownBold':True,'restoredDifference':'Final paragraph loses surrounding **; combined header/front matter differs. No prose replacement accepted.'});supplied=pathlib.Path(rec['suppliedFile']);t['originalCombinedAttachmentPresent']=supplied.exists();t['combinedAttachmentMatchesImportSHA']=supplied.exists() and sha(supplied.read_bytes())==rec['suppliedSHA256']
save('SOURCE-IDENTITY.json',trace)
for t in trace:
 a=[re.sub(r'\*\*(.*?)\*\*',r'\1',p,flags=re.S) for s in accepted[t['section']]['en']['subsections'] for p in s['paragraphs']]
 b=[re.sub(r'\*\*(.*?)\*\*',r'\1',p,flags=re.S) for s in rest[t['section']]['subsections'] for p in s['paragraphs']]
 assert a==b,'Restored English differs beyond bold formatting'
 t.update({'phase2Outcome':'EXACT_SOURCE_MATCH','phase2OutcomeScope':'Recovered accepted original file matches frozen R64 import; not a byte-match claim for R67 combined restoration','normalizedContentEqual':True,'normalizedContentAlgorithm':'Remove Markdown bold ** only per paragraph, preserve all prose characters','normalizedContentSHA256':sha(json.dumps(a,ensure_ascii=False).encode())})
save('SOURCE-IDENTITY.json',trace)
print({'paragraphModules':len(modules),'approvedDisplayDeltas':len(display)})
