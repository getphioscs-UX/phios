from pathlib import Path
import json,hashlib,datetime
root=Path('tools/review/world-answer-quality-r1')
paths=['functions/_lib/world-published-explanation.js','functions/_lib/world-answer-quality.js','functions/_lib/world-synthesis-admission.js','content/world/local-answer-quality-r1.json','assets/js/pages/civilization-atlas/world-customer-answer.js','functions/customer-projection/ric-world-session.js','assets/customer-ui/js/surfaces/ric-world-session-panel.js','assets/customer-ui/js/surfaces/ric-reality-workbench.js','tools/review/reality-information-contract-r1/L1/server.mjs']
manifest=[{'path':p,'sha256':hashlib.sha256(Path(p).read_bytes()).hexdigest()} for p in paths]
(root/'PRE-UNSEEN-SOURCE-HASHES.json').write_bytes(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'note':'Source frozen before writing additional question cases. This is not Human ACCEPT.', 'files':manifest},indent=2).encode())
for old,new in [('tools/review/world-reality-value-r1/browser.mjs','browser.mjs'),('tools/review/world-reality-value-r1/world-browser.mjs','world-browser.mjs'),('tools/review/world-reality-value-r1/safety.mjs','safety.mjs'),('tools/review/world-reality-value-r1/legacy-local.test.mjs','legacy-local.test.mjs')]:
 s=Path(old).read_text(encoding='utf-8').replace('tools/review/world-reality-value-r1/','tools/review/world-answer-quality-r1/')
 if new=='browser.mjs':
  s=s.replace("assert.equal(await p.locator('[data-developer-details] pre').isVisible(),false);", "assert.equal(await p.locator('[data-developer-details]').count(),0);await p.locator('[data-evidence-source]').first().click();assert.equal(await p.locator('[data-source-details]').getAttribute('open'),'');await p.locator('[data-source-details] summary').click();")
 (root/new).write_bytes(s.encode())
