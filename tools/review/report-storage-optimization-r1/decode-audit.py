import json,hashlib,collections,io
from pathlib import Path
from pypdf import PdfReader
from pypdf.generic import IndirectObject
from optimize import decode_image
from audit import ROOT,read,save,sha
v=read(ROOT/'SIZE-AUDIT.json');registry=read('content/reports/shared/report-visual-assets-r2.json');rows=[]
for r in v['reports']:
 reader=PdfReader(r['path']);groups=collections.defaultdict(list)
 for im in r['images']:
  obj=IndirectObject(*map(int,im['object'].split(':')),reader).get_object()
  try:
   image=decode_image(obj);digest=sha(image.tobytes());im['decodedPixelSHA256']=digest;im['decodedMode']=image.mode;groups[(digest,image.size,image.mode)].append(im)
  except Exception as e:im['decodedPixelStatus']=str(e)
 d=[{'objects':[i['object']for i in g],'pages':sorted(set(p for i in g for p in i['pages']))}for g in groups.values()if len(g)>1];r['decodedDuplicateGroups']=d
 for p in r['pages']:p['repeatedSameImageDrawsOnPage']=len(p['imageObjects'])<p['imageDraws']
 r['pagesWithRepeatedSameImageDraw']=sum(p['repeatedSameImageDrawsOnPage']for p in r['pages']);save('forensics/'+r['id']+'.json',r)
 if r['primary']:
  aa=[a for a in registry['assets']if a['methodId']==r['method']and a['pageId']!='SECTION-STYLE'and(r['method']!='NUM'or a['language']=='bilingual')];rows.append({'id':r['id'],'mainRegistryAssetRows':len(aa),'referenceRegistryWebpBytes':sum(a.get('bytes',0)for a in aa),'note':'Registry reference set, not proven per-object asset binding unless matched by source owner. Main R2 registry intentionally has no BZR/HD asset rows.'if not aa else'Reference set excludes SECTION-STYLE; NUM selects bilingual variants. Original immutable bytes are not altered.','registryByteCountMissing':sum('bytes'not in a for a in aa),'pdfImageBytes':r['totalEncodedImageBytes'],'decodedDuplicateGroups':d,'pagesWithRepeatedImageDraw':r['pagesWithRepeatedSameImageDraw']})
 print(r['id'],'decodedDuplicates',len(d),flush=True)
save('SIZE-AUDIT.json',v);save('DECODED-IMAGE-AND-ASSET-ANALYSIS.json',{'rows':rows,'definition':'Decoded duplicates require identical mode, dimensions and decoded pixels. Near-duplicate photographs are not assumed equal. Repeated draw commands do not imply repeated stored image bytes and can be legitimate clipped CSS fragments.'})
