import pathlib,json,hashlib,re,sys
from pypdf import PdfReader
root=pathlib.Path(sys.argv[1]);assert str(root).replace('\\','/').startswith('D:/PHIOS/QA-TEMP/SIX-METHOD-R2/')
final=json.loads((root/'R33-FINAL-IDENTITY.json').read_text(encoding='utf-8'));result=json.loads((root/'R33-RESULT.json').read_text(encoding='utf-8'))
p=pathlib.Path(final['pdf']['path']);b=p.read_bytes();assert hashlib.sha256(b).hexdigest()==final['pdf']['sha256'];r=PdfReader(p)
assert len(r.pages)==48 and len(r.outline)==10
expected=[p['page']-1 for p in result['ast']['layout'] if p['role']=='FIXED_MASTER_SECTION']
assert [r.get_destination_page_number(o) for o in r.outline]==expected
texts=[p.extract_text() or '' for p in r.pages];assert all('ISOLATED QA - NOT CUSTOMER RELEASE' in t for t in texts)
alltext='\n'.join(texts);assert 'Ascendant Gemini' in alltext and 'Midheaven Aquarius' in alltext
assert not re.search('Cancer rising|Aries Midheaven|Moon is the chart’s entry point|Mars in Scorpio in house 4',alltext)
original=PdfReader(result['ast']['pdf']['path']);streamsRetained=[]
for old,new in zip(original.pages,r.pages):
 a=old.get_contents().get_data();bb=new.get_contents().get_data();assert a in bb
 streamsRetained.append(hashlib.sha256(a).hexdigest())
proof={'status':'PASS_FULL_PUBLISHER_PDF_IDENTITY_QA_LABELS_BOOKMARKS_AND_CURRENT_ANGLES','pdf':final['pdf'],'allOriginalPageContentStreamsRetained':True,'originalStreamSHA256':streamsRetained,'outlineTargets':expected,'currentAnglesPresent':True,'referenceSpecificCaptionLeak':False,'qaLabelsOnAll48Pages':True,'customerPublicationAccepted':False,'newAccountDeliveryClaimed':False}
(root/'PDF-VERIFICATION.json').write_text(json.dumps(proof,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in proof.items() if k not in ['originalStreamSHA256','outlineTargets']}))
