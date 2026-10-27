import pathlib,json,hashlib,datetime,shutil
D=pathlib.Path('tools/review/hd-r6/import-20261027/r65');j=lambda n:json.loads((D/n).read_text());save=lambda n,x:(D/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
h='f22a1fe71d105bbfd187511591360d1bfc1baed4ed6fbe42eb226154653683aa';assert hashlib.sha256((D/'asset-reads/SEC11-REUPLOAD-VERIFY.webp').read_bytes()).hexdigest()==h
for n in ['DELIVERY-MANIFEST.json','PDF-QA.json','VISUAL-QA.json','READINESS.json']:
 p=D/('PRE-SEC11-ACCEPTANCE-'+n)
 if not p.exists():shutil.copyfile(D/n,p)
save('SEC11-OWNER-VISUAL-ACCEPTANCE.json',{'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'authority':'EXPLICIT_USER_CONFIRMATION','userDecision':'就是正确的图，请一定要接入','sha256':h,'key':'images/reports/human-design/editorial/shared/VIS-REPORT-HD-SEC-11-ENVIRONMENT-PERCEPTION.webp','scope':'Fixed bilingual educational chapter visual in local R65 reader/PDF','includesGenericInnerVisionLabel':True,'personalTone4CognitionInferenceAllowed':False,'withdrawnPersonalInterpretationRemainsDisabled':True,'commercialOrProductionReleaseAuthorized':False,'supersedes':'Prior Codex exclusion of this exact fixed image; old receipts retained'})
m=j('R2-ASSET-MANIFEST.json');a=next(x for x in m['rows'] if x['section']==11);a.update({'disposition':'EMBED_OWNER_CONFIRMED_FIXED_EDUCATIONAL_ART','localDesignAdmission':'EXPLICIT_OWNER_VISUAL_ACCEPTANCE','acceptanceReceipt':'SEC11-OWNER-VISUAL-ACCEPTANCE.json'});m.update({'embeddedSectionPosters':17,'missingRequiredReplacement':[],'all17IntegrationPass':'PENDING_ACTUAL_PDF_PIXEL_PROOF'});save('R2-ASSET-MANIFEST.json',m)
s=j('FULL-REPORT-SELECTION.json');s['sections'][10]['visual']='FIXED_BILINGUAL_R2_OPENER_OWNER_EXPLICIT';save('FULL-REPORT-SELECTION.json',s)
def edit(file,pairs):
 p=D/file;t=p.read_text(encoding='utf-8')
 for a,b in pairs:
  assert a in t,(file,a);t=t.replace(a,b)
 p.write_text(t,encoding='utf-8')
edit('render.py',[("a['section'] not in [11,'BODY']","a['section']!='BODY'"),("'embeddedPosters':16","'embeddedPosters':17"),("SEC11 revised artwork missing; sixteen actual fixed openers embedded","Seventeen actual fixed openers embedded; SEC11 exact bytes explicitly confirmed by Owner"),("Sixteen exact fixed bilingual images; staleSEC11 excluded","Seventeen exact fixed bilingual images; SEC11 Owner-confirmed educational artwork")])
p=D/'reader.py';t=p.read_text(encoding='utf-8');start=t.index(" if n!=11 else ");end=t.index('\n',start);t=t[:start]+t[end:];p.write_text(t,encoding='utf-8')
edit('pdf-qa.py',[("'expected':'HOLD_STALE' if int(sec)==11 else 'EMBED'","'expected':'EMBED_OWNER_CONFIRMED' if int(sec)==11 else 'EMBED'"),("==16;assert not next(x for x in posterproof if x['section']==11)['exactDecodedPixelMatch']","==17;assert next(x for x in posterproof if x['section']==11)['exactDecodedPixelMatch']"),("16/17","17/17")])
print({'fixedPosters':17,'ownerExactSHA':h,'personalCognitionInference':False})
