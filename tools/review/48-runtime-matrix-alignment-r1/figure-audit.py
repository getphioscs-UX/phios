import json,hashlib
from pathlib import Path
from pypdf import PdfReader
base=Path(__file__).parent
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
windows=['16101–15688 BC','15689–15278 BC','15277–14866 BC','14865–14454 BC','14453–14042 BC','14041–13630 BC','13629–13218 BC','13217–12806 BC','12805–12394 BC','12393–11982 BC','11981–11570 BC','11569–11158 BC','11157–10746 BC','10745–10334 BC','10333–9922 BC','9921–9510 BC','9509–9098 BC','9097–8686 BC','8685–8274 BC','8273–7862 BC','7861–7450 BC','7449–7038 BC','7037–6626 BC','6625–6214 BC','6213–5802 BC','5801–5390 BC','5389–4978 BC','4977–4566 BC','4565–4154 BC','4153–3742 BC','3741–3330 BC','3329–2928 BC','2927–2506 BC','2505–2094 BC','2093–1682 BC','1681–1270 BC','1269–858 BC','857–446 BC','445–34 BC','33 BC–378 AD','379–790 AD','791–1202 AD','1203–1614 AD','1615–2026 AD','2027–2438 AD','2439–2850 AD','2851–3262 AD','3263–3674 AD']
registry=json.loads(Path('content/registry/runtime-position-48-source-windows-v1.json').read_text(encoding='utf-8-sig'))
norm=lambda s:''.join(s.replace('–','-').replace('—','-').split())
rows=[{'positionId':f'RP-{i+1:02d}','figureWindow':w,'registryWindow':registry['positions'][i]['sourceWindowLabel'],'sameLiteralIgnoringSpacing':norm(w)==norm(registry['positions'][i]['sourceWindowLabel'])} for i,w in enumerate(windows)]
figures=[]
for figure in ['13H','13I']:
 for locale in ['en','zh-Hans']:
  path=f'.tmp/integrated-r42-figures/{figure}-{locale}.webp'
  figures.append({'figure':figure,'locale':locale,'path':path,'sha256':sha(path),'state':'EXISTING_LOCAL_IMAGE_BYTES_READ','acceptance':'Existing task calls figure accepted; exact immutable acceptance digest receipt not located by this audit; no new acceptance inferred'})
reader=PdfReader('C:/Users/Guest Account/Desktop/PHI-OS-Book-6-en-v1.pdf')
excerpts=[{'pdfPage':i,'text':reader.pages[i-1].extract_text() or ''} for i in range(234,242)]
extraction=json.loads(Path('.tmp/free-ask-manuscripts/book-6/owner-final-20261011-15d80720d10c/full-extraction.json').read_text(encoding='utf-8'))
zh=[p for p in extraction['pages'] if 333<=p['pageNumber']<=340]
private=Path('.tmp/m48-source-pages.json');private.write_text(json.dumps({'english':excerpts,'chineseExistingVerifiedExtraction':zh},ensure_ascii=False),encoding='utf-8')
report={'figures':figures,'source48Phase':'SOURCE_NOT_AVAILABLE_IN_REPO_DESKTOP_OR_COMPLETED_TARGETED_LOCATIONS; broader user-home read scan status recorded separately','figureCoordinateTranscription':{'method':'Manual visual transcription from actual existing English FIG13H and rendered publication page235, not OCR or generated replacement','rows':rows},'all48WindowLabelsMatch':all(r['sameLiteralIgnoringSpacing'] for r in rows),'publication':{'englishPdfSha256':sha('C:/Users/Guest Account/Desktop/PHI-OS-Book-6-en-v1.pdf'),'englishPages':list(range(234,242)),'englishAcceptanceBinding':'NOT_LOCATED','chineseSha256':extraction['sourceSha256'],'chinesePages':[p['pageNumber'] for p in zh],'chineseSourceMatchesDesktop':extraction['sourceSha256']==sha('C:/Users/Guest Account/Desktop/PHI-OS-Book-6-v1.pdf'),'privateWorkingExcerpts':str(private),'textInterpretation':'Both publication languages distinguish positions, temporary Lock, condition-dependent possibility families and thresholds. Neither inspected passage assigns G8 to a named Arc or resolves the visual/registry boundary.'},'verdict':{'13HRegistryArc':'FIGURE_PRESENTATION_AMBIGUITY / HUMAN_DECISION_REQUIRED','13H48Coordinates':'PASS_LITERAL_VISUAL_CROSSCHECK' if all(r['sameLiteralIgnoringSpacing'] for r in rows) else 'FAIL','13I':'Six direction families visible; English label Successor vs manuscript succession is a terminology difference, not an authorized automatic RP mapping. Figure identity acceptance receipt unresolved.','noAssetOrCanonicalMutation':True}}
(base/'FIGURE-PUBLICATION-CROSSCHECK.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'matching48':report['all48WindowLabelsMatch'],'differences':[r for r in rows if not r['sameLiteralIgnoringSpacing']]}))
