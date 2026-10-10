import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
for(const p of ['perspectives/index.html','perspectives/iching/index.html','perspectives/tarot/index.html']){const s=read(p);assert.match(s,/data-cx-surface=/);assert.match(s,/assets\/customer-ui/);assert.doesNotMatch(s,/puxr-|public-shell-v2|phios-public-v2\.css/)}
const routes=JSON.parse(read('content/customer-experience-rebuild/authority/canonical-customer-route-registry-v1.json'));
for(const [id,path] of [['PERSPECTIVES','/perspectives/'],['I_CHING_PERSPECTIVE','/perspectives/iching/'],['TAROT_PERSPECTIVE','/perspectives/tarot/']])assert.equal(routes.routes.find(x=>x.routeId===id)?.canonicalPath,path);
const redirects=read('_redirects');assert.match(redirects,/\/readings\/symbolic\/? \/perspectives\/ 308/);
const ich=read('perspectives/iching/index.html'),tar=read('perspectives/tarot/index.html');assert.match(ich,/disabled/);assert.match(tar,/disabled/);assert.doesNotMatch(ich,/publicRunAllowed\s*=\s*true/);assert.doesNotMatch(tar,/publicRunAllowed\s*=\s*true/);
const css=read('assets/css/pxr-public-experience.css');assert.match(css,/object-fit:contain/);assert.match(css,/aspect-ratio:auto/);
const viewer=read('assets/customer-ui/js/figure-viewer.js');for(const token of ['data-cx-expandable-figure','data-cx-zoom-in','data-cx-zoom-out','Enter','showModal'])assert.ok(viewer.includes(token),token);
const acc=JSON.parse(read('content/customer-experience-rebuild/acceptance/cx-symbolic-figure-presentation-acceptance-v1.json'));assert.equal(acc.locationInput.humanAccepted,true);assert.equal(acc.symbolicPerspectives.personalRealityContainsSymbolicExecution,false);
console.log('✓ CX Symbolic + Figure presentation passed: canonical /perspectives/ IA, separate I Ching/Tarot CX surfaces with inherited execution gates, location Human Accepted, and intrinsic expandable figures.');
