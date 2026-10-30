from pathlib import Path
q=Path('C:/phios/tools/review/world-customer-journey-r4');o=q/'revision-r1';(o/'preview/regression/screens').mkdir(parents=True,exist_ok=True)
for src,dest in [('preview-browser-checks.mjs','preview-regression.mjs'),('preview-home-journeys.mjs','preview-home.mjs'),('preview-readonly.mjs','preview-identity.mjs')]:
 s=(q/src).read_text(encoding='utf-8').replace('55ced5c1.phios-github.pages.dev','b06b462a.phios-github.pages.dev').replace('fc5c693c986ab875dc627eceb5d8962304019512','29d2a31ae482072bca3797bf6463025bdcd5406b').replace('PREVIEW_EXACT_FC5C693C','PREVIEW_EXACT_29D2A31A').replace("humanAcceptance:'PENDING'","humanAcceptance:'REVISE_PENDING_RECHECK'")
 s=s.replace('C:/phios/tools/review/world-customer-journey-r4/preview', 'C:/phios/tools/review/world-customer-journey-r4/revision-r1/preview')
 if dest=='preview-home.mjs':s=s.replace("from '../../../scripts/lib/world-browser-runtime.mjs'","from '../../../../scripts/lib/world-browser-runtime.mjs'")
 (o/dest).write_text(s,encoding='utf-8')
