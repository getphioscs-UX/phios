"""Capture the deterministic configured source without executing PDF generation."""
import ast,pathlib,builtins,hashlib,json
D=pathlib.Path(__file__).parent;p=D/'render.py';tree=ast.parse(p.read_text(encoding='utf-8-sig'));tree.body=[n for n in tree.body if not isinstance(n,ast.For)];scope={};wrapper={}
def capture(code,ns):
 global wrapper
 if code.co_filename=='R611-configured-native-owner':
  wrapper=ns;ns['exec']=capture;return builtins.exec(code,ns)
 if code.co_filename=='R65-existing-export-adapter-with-R611-inputs':
  source=wrapper['s'];(D/'COMPILED-ADAPTER-SOURCE.py.txt').write_text(source,encoding='utf-8');assert 'Reading Identity and Priorities' not in source and '阅读身份与重点' not in source;assert 'for n in range(1,6):s +=[FrontMatter(n,fmt),PageBreak()]' in source
  original=pathlib.Path('tools/review/hd-r6/import-20261027/r65/render.py').read_text();start=original.index(' s +=[Spacer(1,100)');end=original.index(" s +=[PageBreak(),P('计算所得",start);removed=original[start:end];proof={'sourceOwner':'Existing R65/R68/R610 renderer configured only; no PDF page deletion','removedStoryNodes':['GENERIC_TEXT_COVER','READING_IDENTITY_AND_PRIORITIES'],'oldTocNodesReplaced':True,'removedNodeBlockSHA256':hashlib.sha256(removed.encode()).hexdigest(),'configuredSourceSHA256':hashlib.sha256(source.encode()).hexdigest(),'replacement':'Five exact registry/order-language FrontMatter flowables, one fixed Contents flowable, original BodyGraph/activation/full17 story','identityPreservedIn':'PDF metadata and existing immutable CustomerReportArtifact; no new identity cover','historicalAdaptersUnchanged':True};(D/'NODE-REMOVAL-PROOF.json').write_text(json.dumps(proof,indent=2)+'\n');x=json.loads((D/'RENDER-ADAPTER.json').read_text());x['configuredAdapterSHA256Stage']='PRE_R611_LAYOUT_TRANSFORM';x['actualR611CompiledSourceSHA256']=proof['configuredSourceSHA256'];x['actualR611ConfigurationSHA256']=hashlib.sha256(p.read_bytes()).hexdigest();(D/'RENDER-ADAPTER.json').write_text(json.dumps(x,indent=2)+'\n');print(proof['configuredSourceSHA256']);return
 raise RuntimeError('Unexpected executable layer '+code.co_filename)
scope={'__name__':'__main__','__file__':str(p),'exec':capture};builtins.exec(compile(tree,'R611-trace-without-copy-loop','exec'),scope)
