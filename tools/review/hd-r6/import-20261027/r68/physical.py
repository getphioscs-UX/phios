import pathlib,json,hashlib,datetime
from PIL import Image
D=pathlib.Path('tools/review/hd-r6/import-20261027/r68');j=lambda n:json.loads((D/n).read_text());rows=[]
for f in j('PDF-MANIFEST.json')['files']:
 rasters=pathlib.Path('.tmp/hd-r68-private')/('pages-current-'+f['format']);pages=sorted((p for p in rasters.glob('p-*.jpg') if int(p.stem.split('-')[-1])<=f['pages']),key=lambda p:int(p.stem.split('-')[-1]));assert len(pages)==f['pages'];samples=[]
 for i,p in enumerate(pages,1):
  with Image.open(p) as im:
   im.load();assert im.width>500 and im.height>=800
   if i>1:
    colors=[im.convert('RGB').getpixel((round(x/595.2756*im.width),round(y/841.8898*im.height))) for x in [40,555] for y in [110,350,650]]
    ok=all(max(abs(a-b) for a,b in zip(v,(255,253,248)))<=16 for v in colors)
    samples.append({'page':i,'opaqueReadingPanelMarginSamples':ok})
   
 assert all(s['opaqueReadingPanelMarginSamples'] for s in samples),(f['format'],[s['page'] for s in samples if not s['opaqueReadingPanelMarginSamples']])
 stats=next(r for r in j('PDF-QA.json')['results'] if r['format']==f['format']);rows.append({'format':f['format'],'pdfSHA256':f['sha256'],'physicalPages':len(pages),'rasterDecodedAll':True,'panelSamples':samples,'lastPageTextHeightPt':stats['pageStats'][-1]['textHeight'],'lastPageCharacters':stats['pageStats'][-1]['characters'],'contactSheets':[str(p).replace('\\','/') for p in sorted((D/'current-review').glob(f['format']+'-contact-*.jpg'))],'contactInspection':'CODEX_INSPECTED_ALL_PAGES_AT_CONTACT_SCALE','fullSizeRepresentatives':'See specific files below; not a claim every page was manually proofread at full-size','status':'PASS_LOCAL_OWNER_VISUAL_ACCEPTANCE_PENDING'})
files=sorted((D/'current-review').glob('*representative*.png'));contacts=sorted((D/'current-review').glob('*contact*.jpg'))
record={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'results':rows,'totalPages':sum(x['physicalPages'] for x in rows),'allContactSheetsViewedByCodex':len(contacts),'fullSizeViewed':['en-representative-52.png','en-representative-92.png','bilingual-representative-77.png','bilingual-representative-142.png','zh-Hans-representative-4.png'],'representativesAvailable':[str(p).replace('\\','/') for p in files],'beforeEvidence':'input/PHIOS-HD-R68-HANDOFF/R68-PDF-PROBLEM-PAGES.jpg','oldR67PDFBytes':'NOT_AVAILABLE_NO_HASH_EQUIVALENCE_CLAIM','improvements':['Opaque ivory beneath all long prose','Known internal QA card omitted; approved display corrections retained','English/bilingual final text height206.08pt to412.08pt; no filler or font reduction','Exact17 fixed openers once per edition','Full actual vector BodyGraph preserved'],'sourceSemanticAndOwnerAcceptance':'PENDING_INDEPENDENT_REVIEW','printQuality':'Screen rendering verified; physical press proof not performed'}
(D/'PHYSICAL-INSPECTION.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n');print({'pages':record['totalPages'],'contacts':len(contacts),'actualRastersDecoded':True,'opaquePanelsSampled':True})
