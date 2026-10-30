from pathlib import Path
import sys,json,hashlib,re,unicodedata,time
from pypdf import PdfReader,PdfWriter
from pypdf.generic import DecodedStreamObject,NameObject
import pypdfium2 as pdfium
from PIL import ImageChops,ImageStat
r=Path('C:/phios/tools/review/bazi-r1-1-publication-closure');sys.path.insert(0,'C:/phios/tools/review/report-storage-optimization-r1')
from audit import inspect_pdf
from optimize import optimize
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
norm=lambda s:re.sub(r'\s+','',unicodedata.normalize('NFKC',s))
def outlines(reader):
 out=[]
 def walk(xs,depth=0):
  for x in xs:
   if isinstance(x,list):walk(x,depth+1)
   else:out.append([depth,str(x.title),reader.get_destination_page_number(x)])
 walk(reader.outline);return out
manifest=json.loads((r/'PDF-RENDER-CHECKS.json').read_text(encoding='utf8'));assert len(manifest['rows'])==3
results=[]
for row in manifest['rows']:
 id=row['id'];existing=r/f'PDF-QA-{id}.json'
 if existing.exists():
  completed=json.loads(existing.read_text(encoding='utf8'))
  if completed.get('rawSHA256')==row['sha256'] and Path(completed['optimized']).exists() and sha(completed['optimized'])==completed['optimizedSHA256']:
   results.append(completed);print('Reuse verified candidate '+id,flush=True);continue
 raw=Path(row['path']);ir=json.loads((r/'cases'/id/'ir.json').read_text(encoding='utf8'));snapshot=json.loads((r/'cases'/id/'snapshot.json').read_text(encoding='utf8'));assert row['publicationDigest']==ir['digest'];assert sha(raw)==row['sha256'];reader=PdfReader(raw);native_bookmarks=outlines(reader);assert native_bookmarks
 identity=ir['publicationIdentity'];binding=json.dumps({k:identity[k]for k in ['reportRef','subjectRef','orderRef']},sort_keys=True,separators=(',',':'));metadata={'/Title':f'PHI OS BaZi R1.1 SYNTHETIC {id}','/PHIOSReportId':identity['reportRef'],'/PHIOSSourceReportReference':identity['reportRef'],'/PHIOSSubjectRef':identity['subjectRef'],'/PHIOSOrderRef':identity['orderRef'],'/PHIOSSubjectOrderBindingSHA256':hashlib.sha256(binding.encode()).hexdigest(),'/PHIOSChartDigest':ir['consistency']['chartDigest'],'/PHIOSNativeSourceDigest':ir['consistency']['sourceDigest'],'/PHIOSPublicationDigest':ir['digest'],'/PHIOSManuscriptDigest':ir['manuscript']['digest'],'/PHIOSLanguage':'bilingual','/PHIOSHumanReview':'PENDING_R1_1_NOT_CUSTOMER_ISSUED','/PHIOSCommercialWatermarkPolicy':'NOT_ADMITTED_SYNTHETIC_REVIEW_MARK_ONLY'}
 writer=PdfWriter(clone_from=reader);alias_fixes=[];seen_fonts=set()
 for page in writer.pages:
  for font_ref in page['/Resources'].get('/Font',{}).values():
   key=str(font_ref)
   if key in seen_fonts:continue
   seen_fonts.add(key);font=font_ref.get_object();cmap=font.get('/ToUnicode')
   if not cmap:continue
   data=cmap.get_object().get_data();fixed,count=re.subn(rb'(?im)^(\s*<[0-9a-f]+>\s*<)2e92(>\s*)$',rb'\g<1>5DF3\g<2>',data)
   if count:
    new=DecodedStreamObject();new.set_data(fixed);font[NameObject('/ToUnicode')]=writer._add_object(new);alias_fixes.append({'from':'U+2E92','to':'U+5DF3','mappings':count,'source':'https://www.unicode.org/charts/PDF/U2E80.pdf#page=3'})
 if alias_fixes:metadata['/PHIOSUnicodeExtractionCorrection']='U2E92_TO_U5DF3_SOURCE_GLYPH_ALIAS_ONLY'
 writer.add_metadata(metadata);sealed=r/f'SYNTHETIC-BZR-R1-1-{id}-BILINGUAL-SEALED.pdf'
 with sealed.open('wb')as f:writer.write(f)
 sr=PdfReader(sealed);assert outlines(sr)==native_bookmarks;assert len(sr.pages)==ir['publication']['pageCount'];texts=[p.extract_text()for p in sr.pages];source_checks=[]
 for page in ir['publication']['pages']:
  if page.get('content'):
   for lang,entries in page['content'].items():
    for entry in entries:source_checks.append({'page':page['pageNumber'],'locale':lang,'sourceRef':entry.get('sourceRef'),'present':norm(entry['text'])in norm(texts[page['pageNumber']-1])})
 missing=[x for x in source_checks if not x['present']];assert not missing,missing[:3]
 body=[{'page':p['pageNumber'],'section':p.get('sectionId'),'characters':len(norm(texts[p['pageNumber']-1])),'role':p['role']}for p in ir['publication']['pages']if p['role'].startswith('INTERPRETATION')];assert all(p['characters']>100 for p in body)
 assert all('SYNTHETIC QA' in text for text in texts)
 assert all(abs(float(p.mediabox.width)-595.28)<1 and abs(float(p.mediabox.height)-841.89)<1 for p in sr.pages)
 before=inspect_pdf(sealed,'BZR-R1-1-'+id,'BZR','Exact source-complete frozen R1.1 review candidate; not issued customer artifact')
 optimized=r/f'SYNTHETIC-BZR-R1-1-{id}-BILINGUAL-Q87-CANDIDATE.pdf';opt=optimize(before,87,output_path=optimized);assert opt['passStructural'];orr=PdfReader(optimized);assert outlines(orr)==native_bookmarks;assert all(str(orr.metadata[k])==v for k,v in metadata.items())
 native=pdfium.PdfDocument(sealed);compact=pdfium.PdfDocument(optimized);visual=[];screens=r/'page-screenshots'/id/row['sha256'][:16];screens.mkdir(parents=True,exist_ok=True)
 for i in range(len(native)):
  a=native[i];b=compact[i];ab=a.render(scale=1);bb=b.render(scale=1);ai=ab.to_pil().convert('RGB');bi=bb.to_pil().convert('RGB');diff=ImageChops.difference(ai,bi);mae=sum(ImageStat.Stat(diff).mean)/3;visual.append({'page':i+1,'mae255':round(mae,6)});bi.save(screens/f'page-{i+1:03d}.png')
  if i+1 in [1,6,7,8,9,14,18,22,26,30,34,38,42,46,47,48]:ai.save(screens/f'original-page-{i+1:03d}.png')
  ab.close();bb.close();a.close();b.close()
 native.close();compact.close();qa={'id':id,'screenshotsDirectory':str(screens),'rawPrint':str(raw),'rawSHA256':sha(raw),'sealed':str(sealed),'sealedBytes':sealed.stat().st_size,'sealedSHA256':sha(sealed),'optimized':str(optimized),'optimizedBytes':optimized.stat().st_size,'optimizedSHA256':sha(optimized),'pages':len(sr.pages),'bookmarks':native_bookmarks,'bookmarkCount':len(native_bookmarks),'linkAnnotations':sum(len(p.get('/Annots',[]))for p in sr.pages),'allVisibleSyntheticMarks':True,'allSourceUnitsPresent':not missing,'unicodeAliasCorrections':alias_fixes,'sourceChecks':source_checks,'bodyPages':body,'metadata':metadata,'optimization':opt,'visual':{'allPagesMeasured':len(visual),'maxMAE255':max(x['mae255']for x in visual),'meanMAE255':sum(x['mae255']for x in visual)/len(visual),'perPage':visual},'commercialWatermark':'PENDING_OWNER_POLICY_NOT_APPROVED','humanReview':'PENDING','formalArtifactStoreWrites':0};results.append(qa);(r/f'PDF-QA-{id}.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps({'id':id,'pages':qa['pages'],'bookmarks':qa['bookmarkCount'],'sealedBytes':qa['sealedBytes'],'q87Bytes':qa['optimizedBytes'],'reduction':opt['reductionPercent'],'maxMAE255':qa['visual']['maxMAE255']}),flush=True)
(r/'FINAL-CANDIDATE-MANIFEST.json').write_text(json.dumps({'reports':results,'newHumanAccept':False,'sourceR11OwnerConfirmation':'USER_MESSAGE','customerIssued':False,'formalArtifactStoreWrites':0},ensure_ascii=False,indent=2),encoding='utf8')
