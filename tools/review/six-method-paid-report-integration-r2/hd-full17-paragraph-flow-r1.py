"""Configure the existing Full17 section-flow code with supplied full paragraphs.
No frozen Publisher main module, old personal introduction or PDF build executes.
The caller still needs validated Subject/Consent/source and an existing Report.
"""
import ast,copy,hashlib,json
from pathlib import Path
from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.platypus import PageBreak,KeepTogether,Flowable

def _existing_decorative_consumers(raw,binding,asset_path_by_key):
 registry=Path(__file__).resolve().parents[3]/'functions/report-delivery/hd-full17-decorative-bindings-r1.json'
 encoded=registry.read_bytes()
 if hashlib.sha256(encoded).hexdigest()!='87fdc60ca73b7d5052de1d3763a6c4fb902894bb6d33bc9ba3318bd9a6d7b0a9':raise ValueError('HD_DECORATIVE_REGISTRY_DRIFT')
 canonical=json.loads(encoded)
 if binding!=canonical or binding.get('scope')!='LOCAL_OWNER_DESIGN_ONLY' or any(binding.get(k) is not False for k in ['semanticAuthority','commercialAdmission','assetActivation']):raise ValueError('HD_DECORATIVE_TRUSTED_BINDING_REQUIRED')
 if hashlib.sha256(raw).hexdigest()!=binding['publisherCoreSHA256']:raise ValueError('HD_DECORATIVE_ORIGINAL_PUBLISHER_DRIFT')
 expected=['BODY']+['SEC%02d'%n for n in range(1,18)]
 if [r['id'] for r in binding['rows']]!=expected:raise ValueError('HD_DECORATIVE_ALL17_AND_BODY_REQUIRED')
 if set(asset_path_by_key or {})!={r['objectKey'] for r in binding['rows']}:raise ValueError('HD_DECORATIVE_EXACT_ASSET_KEYS_REQUIRED')
 images={}
 for row in binding['rows']:
  file=Path(asset_path_by_key[row['objectKey']])
  if not file.is_absolute() or not file.is_file():raise ValueError('HD_DECORATIVE_LOCAL_FILE_REQUIRED')
  payload=file.read_bytes()
  if len(payload)!=row['bytes'] or hashlib.sha256(payload).hexdigest()!=row['sha256']:raise ValueError('HD_DECORATIVE_ASSET_BYTES_DRIFT')
  with Image.open(file) as im:
   if im.format!='WEBP':raise ValueError('HD_DECORATIVE_WEBP_REQUIRED')
   images[row['id']]=ImageReader(im.convert('RGB'))
 tree=ast.parse(raw)
 poster=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Poster')
 report=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Report')
 background=next(n for n in report.body if isinstance(n,ast.FunctionDef) and n.name=='background')
 safe_report=ast.ClassDef(name='_ExistingReportBackground',bases=[],keywords=[],body=[copy.deepcopy(background)],decorator_list=[])
 palette=[]
 allowed={'W','H','navy','teal','gold','ivory','red'}
 for node in tree.body:
  if isinstance(node,ast.Assign):
   names={x.id for target in node.targets for x in ast.walk(target) if isinstance(x,ast.Name)}
   if names and names<=allowed:palette.append(copy.deepcopy(node))
 module=ast.Module(body=palette+[copy.deepcopy(poster),safe_report],type_ignores=[]);ast.fix_missing_locations(module)
 namespace={'HexColor':HexColor,'Flowable':Flowable,'bodyImage':images['BODY'],'posterImages':{n:images['SEC%02d'%n] for n in range(1,18)}}
 # Only original decorative methods and literal palette run. No Publisher
 # __init__, old Subject/preview load, Graphic or build_story intro executes.
 exec(compile(module,'existing-HD-Publisher::decorative-only','exec'),namespace)
 method=namespace['_ExistingReportBackground'].background
 def background_callback(canvas,doc):return method(doc,canvas,doc)
 return {'poster':namespace['Poster'],'background':background_callback,'ids':expected,'source':'ORIGINAL_R65_POSTER_AND_REPORT_BACKGROUND'}

def build_existing_full17_section_flow(*,publisher_core_path,publisher_core_sha256,selection,packets,languages,paragraph,body_style,h1_style,h2_style,poster_factory=None,current_graphic_factory=None,figures=None,decorative_binding=None,asset_path_by_key=None):
 raw=open(publisher_core_path,'rb').read()
 if hashlib.sha256(raw).hexdigest()!=publisher_core_sha256:raise ValueError('HD_FULL17_PUBLISHER_CORE_DRIFT')
 expected=['SEC%02d'%n for n in range(1,18)]
 if [s['id'] for s in selection['sections']]!=expected or [p['sectionId'] for p in packets]!=expected:raise ValueError('HD_FULL17_COMPLETE_SECTION_ORDER_REQUIRED')
 if not languages or any(l not in ['zh-Hans','en'] for l in languages):raise ValueError('HD_FULL17_LANGUAGE_REQUIRED')
 decorative=None
 if decorative_binding is not None:
  decorative=_existing_decorative_consumers(raw,decorative_binding,asset_path_by_key)
  poster_factory=decorative['poster']
 if not callable(poster_factory):raise ValueError('HD_EXISTING_FIXED_POSTER_OWNER_REQUIRED')
 if figures and current_graphic_factory is None:raise ValueError('HD_CURRENT_SUBJECT_GRAPHIC_OWNER_REQUIRED')
 tree=ast.parse(raw);owner=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='build_story')
 loop=next(n for n in owner.body if isinstance(n,ast.For) and ast.unparse(n.target)=='(sec, packet)')
 # Only the original multi-page section/subsection flow is compiled. Source text
 # and figures are inputs; the reference Subject and build_story intro are absent.
 module=ast.Module(body=[copy.deepcopy(loop)],type_ignores=[]);ast.fix_missing_locations(module)
 for s,p in zip(selection['sections'],packets):
  for locale in languages:
   if not any(row['language']==locale for row in p['paragraphs']):raise ValueError('HD_FULL17_LANGUAGE_BODY_MISSING')
  if any(not row.get('title') or not row.get('text') for row in p['paragraphs']):raise ValueError('HD_FULL17_PARAGRAPH_REQUIRED')
 namespace={'selection':selection,'pack':packets,'langs':languages,'z':languages==['zh-Hans'],'s':[],'figures':figures or {},'P':paragraph,'body':body_style,'h1':h1_style,'h2':h2_style,'Graphic':current_graphic_factory,'Poster':poster_factory,'PageBreak':PageBreak,'KeepTogether':KeepTogether,'copy':copy,'W':595.2756}
 exec(compile(module,publisher_core_path+'::original-section-flow', 'exec'),namespace)
 return {'flowables':namespace['s'],'sectionCount':17,'paragraphCount':sum(sum(r['language'] in languages for r in p['paragraphs']) for p in packets),'originalPersonalIntroExecuted':False,'oldGraphicBranchesExecuted':False,'pdfGenerated':False,'backgroundCallback':decorative['background'] if decorative else None,'decorativeAssetsConsumed':decorative['ids'] if decorative else [],'decorativeSource':decorative['source'] if decorative else None,'commercialAdmission':False}
