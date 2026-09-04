import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const readJson=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const exists=p=>fs.existsSync(path.join(root,p));
const planPath='content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json';
const acceptancePath='content/customer-experience-rebuild/acceptance/p1-physical-legacy-delete-acceptance-v1.json';
const routeRegistryPath='content/customer-experience-rebuild/authority/canonical-customer-route-registry-v5.json';

for(const p of [planPath,acceptancePath,routeRegistryPath,'_redirects','package.json'])assert.ok(exists(p),`P1 delete prerequisite missing: ${p}`);
const plan=readJson(planPath),acceptance=readJson(acceptancePath),routes=readJson(routeRegistryPath);
assert.equal(plan.status,'PHYSICAL_LEGACY_PRESENTATION_DELETE_COMPLETE');
assert.equal(acceptance.browserAcceptance,'HUMAN_ACCEPTED_BY_USER_CONFIRMATION');
assert.equal(acceptance.redirectCompatibilityPreserved,true);
assert.equal(routes.status,'P1_PRIORITY_ROUTES_ACTIVE_BROWSER_ACCEPTED_LEGACY_PRESENTATION_DELETED');
const candidates=plan.candidates.map(x=>x.path);
assert.deepEqual(candidates,[
  'my-reality.html',
  'reality-dashboard.html',
  'personal-runtime.html',
  'professional/personal-runtime/index.html',
  'financial-reality.html',
  'ask.html',
  'knowledge-search.html'
]);
const canonical=['reality/index.html','perspectives/personal/index.html','professional/financial/index.html','knowledge/ask/index.html'];
for(const p of canonical)assert.ok(exists(p),`canonical P1 successor missing: ${p}`);
const redirects=fs.readFileSync(path.join(root,'_redirects'),'utf8');
for(const line of [
  '/my-reality /reality/ 308','/my-reality.html /reality/ 308','/reality-dashboard /reality/ 308','/reality-dashboard.html /reality/ 308',
  '/personal-runtime /perspectives/personal/ 308','/personal-runtime.html /perspectives/personal/ 308','/professional/personal-runtime /perspectives/personal/ 308','/professional/personal-runtime/ /perspectives/personal/ 308',
  '/financial-reality /professional/financial/ 308','/financial-reality.html /professional/financial/ 308',
  '/ask /knowledge/ask/ 308','/ask.html /knowledge/ask/ 308','/knowledge-search /knowledge/ask/ 308','/knowledge-search.html /knowledge/ask/ 308'
])assert.ok(redirects.includes(line),`compatibility redirect missing before delete: ${line}`);
for(const p of candidates){
  const abs=path.resolve(root,p);assert.ok(abs.startsWith(root+path.sep),'delete target escapes repository root');
  if(fs.existsSync(abs))fs.unlinkSync(abs);
}
const emptyDir=path.join(root,'professional/personal-runtime');
if(fs.existsSync(emptyDir)&&fs.statSync(emptyDir).isDirectory()&&fs.readdirSync(emptyDir).length===0)fs.rmdirSync(emptyDir);
for(const p of candidates)assert.equal(exists(p),false,`P1 retired presentation still exists after delete: ${p}`);
console.log('✓ P1 physical legacy delete applied: 7 retired presentation files removed; compatibility redirects and four canonical successor surfaces preserved.');
