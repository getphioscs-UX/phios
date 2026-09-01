import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd();
const readJson=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const txt=p=>fs.readFileSync(path.join(root,p),'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const walk=dir=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]):[];
const rel=p=>path.relative(root,p).replaceAll('\\','/');
const freeze=readJson('content/personal-reading/final-acceptance/ownership/w68-shared-file-ownership-freeze-v1.json');
const contract=readJson('content/personal-reading/final-acceptance/contracts/w68-no-legacy-leak-contract-v1.json');
const current=readJson('content/professional/personal-reality/current/ppr-current-shared-owner-registry-v1.json');
const historical=readJson('content/professional/personal-reality/r2/authority/ppr-r2-w1-shared-file-ownership-v1.json');
assert.equal(freeze.owner,'PERSONAL_REALITY_PRODUCT_ORCHESTRATION');
assert.equal(historical.owner,'PERSONAL_REALITY_PRODUCT_ORCHESTRATION');
assert.equal(current.owner,'PPR_CURRENT_SHARED_RUNTIME');
for(const [file,proof] of Object.entries(freeze.sharedFiles)){
  assert.ok(fs.existsSync(path.join(root,file)),`missing ${file}`);
  assert.equal(sha(file),proof.sha256,`W68 shared owner digest drift: ${file}`);
  assert.equal(current.files?.[file]?.currentSha256,proof.sha256,`current byte registry must match W68 freeze: ${file}`);
}
assert.equal(freeze.profileInputOwner,'PERSONAL_REALITY_PRODUCT_ORCHESTRATION');
assert.equal(freeze.selfAssessmentOwner,'PERSONAL_REALITY_PRODUCT_ORCHESTRATION');
assert.equal(freeze.sharedPersonBInputOwner,'PERSONAL_REALITY_PRODUCT_ORCHESTRATION');
// Narrative provider is technical only: no specialist-surface ownership and no raw method-calculation imports.
const narrativeFiles=walk(path.join(root,'functions/personal-reading/narrative')).filter(f=>/\.js$/.test(f));
const rawMethodTokens=['functions/ast-full-production','functions/bzr-full-production','functions/zi-wei-full-production','functions/num-expansion','functions/embodied-configuration','functions/ecr-phi-card'];
const sharedSurfaceTokens=['perspectives/personal/index.html','assets/customer-ui/js/surfaces/personal-reality.js','functions/api/customer-personal-reality.js'];
for(const f of narrativeFiles){const s=fs.readFileSync(f,'utf8').replaceAll('\\','/');for(const token of [...rawMethodTokens,...sharedSurfaceTokens])assert.ok(!s.includes(token),`${rel(f)} leaked narrative ownership token ${token}`);}
// Model/provider identity and client success page are never customer/entitlement authority.
const customerSurface=[txt('perspectives/personal/index.html'),txt('assets/customer-ui/js/personal-products/final-personal-reading-experience.js')].join('\n');
for(const token of ['OPENAI_NARRATIVE_MODEL','OPENAI_API_KEY','fixture-model-v1'])assert.ok(!customerSurface.includes(token),`customer surface leaked provider authority token ${token}`);
const success=txt('payment-success.html');
for(const token of ['NARRATIVE_ENTITLEMENT','generationAllowed','SERVER_VERIFIED_PAYMENT_EVENT','admitVerifiedNarrativePurchase'])assert.ok(!success.includes(token),`payment success page may not own entitlement: ${token}`);
const commerce=txt('functions/personal-reading/narrative/narrative-commerce-entitlement.js');
assert.match(commerce,/SERVER_VERIFIED_PAYMENT_EVENT/);assert.match(commerce,/clientSuccessPageAuthority:false/);
// Specialist method roots may consume canonical ProfileSignalEnvelope refs but may not create alternate Profile/Assessment or shared Person-B forms.
const methodRoots=['functions/ast-full-production','functions/bzr-full-production','functions/zi-wei-full-production','functions/num-expansion','functions/embodied-configuration','functions/ecr-phi-card'];
const forbiddenFormTokens=['name="externalProfile','name="profileAssessment','name="personB','data-cx-person-b-input','SPECIFIC_PERSON_RELATIONSHIP_FORM'];
for(const mr of methodRoots)for(const f of walk(path.join(root,mr)).filter(x=>/\.(?:js|mjs|html)$/.test(x))){const s=fs.readFileSync(f,'utf8');for(const t of forbiddenFormTokens)assert.ok(!s.includes(t),`${rel(f)} creates alternate shared Profile/Person-B form via ${t}`);}
// Duplicate Person-B aliases may exist only as explicitly registered adapter aliases, never as a competing shared input owner.
const aliases=contract.duplicatePersonBAliasesToScan;const productRoots=['functions','assets/customer-ui','assets/js/pages','perspectives'];
for(const alias of aliases){const allowed=new Set(freeze.allowedAdapterAliases?.[alias]||[]);const re=new RegExp(`\\b${alias}\\b`);for(const pr of productRoots)for(const f of walk(path.join(root,pr)).filter(x=>/\.(?:js|mjs|html)$/.test(x))){const r=rel(f);if(!re.test(fs.readFileSync(f,'utf8')))continue;assert.ok(allowed.has(r),`W68 duplicate Person-B alias outside registered adapter: ${alias} @ ${r}`);}}
console.log('✓ W68 Shared-file Ownership + No Legacy Leak passed.');
console.log(`  ${Object.keys(freeze.sharedFiles).length}/3 convergence files frozen to PERSONAL_REALITY_PRODUCT_ORCHESTRATION; current byte registry matches.`);
console.log('  Narrative provider/raw-method/customer-authority/payment-success leaks rejected; Profile and shared Person-B alternate owners rejected.');
