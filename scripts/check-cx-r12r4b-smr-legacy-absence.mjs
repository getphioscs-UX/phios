import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const root=process.cwd();
const exists=p=>fs.existsSync(path.join(root,p));
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const hashFile=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const canonicalRuntime='functions/single-method-reading';
const canonicalContent='content/customer-experience-rebuild/r12r4b/smr';
const constructionRuntime='functions/single-method-reading-r2';
const constructionContent='content/customer-experience-rebuild/r12r4b/smr-r2';

assert.equal(exists(constructionRuntime),false,'construction runtime directory still exists');
assert.equal(exists(constructionContent),false,'construction content directory still exists');
assert.equal(exists(canonicalRuntime),true,'canonical SMR runtime is missing');
assert.equal(exists(canonicalContent),true,'canonical SMR content is missing');

const deletedRuntimeBasenames=[
  'accepted-method-result-adapter.js','astrology-single-method-composer.js','bazi-single-method-composer.js','method-composer-base.js','numerology-single-method-composer.js','single-method-priority-resolver.js','single-method-reading-eligibility.js','single-method-reading-ir.js','single-method-reading-quality.js','single-method-section-resolver.js','single-method-theme-clusterer.js','smr-registry-v1.js','ziwei-single-method-composer.js'
];
for(const name of deletedRuntimeBasenames)assert.equal(exists(`${canonicalRuntime}/${name}`),false,`legacy runtime file survived hard replacement: ${name}`);
for(const p of ['scripts/generate-cx-r12r4b-smr-campaign.mjs','scripts/smr-campaign-support.mjs'])assert.equal(exists(p),false,`legacy campaign implementation survived: ${p}`);
for(const p of [
  `${canonicalContent}/single-method-reading-contract-v1.json`,`${canonicalContent}/single-method-reading-ir-v1.json`,`${canonicalContent}/single-method-reading-section-registry-v1.json`,`${canonicalContent}/smr-method-priority-registry-v1.json`,`${canonicalContent}/admission/smr-method-section-registry-freeze-v1.json`
])assert.equal(exists(p),false,`legacy active content survived: ${p}`);

const canonicalRequired=[
  `${canonicalRuntime}/single-method-reading-production.js`,`${canonicalRuntime}/method-production-adapter-core.js`,`${canonicalRuntime}/customer-claim-ir.js`,`${canonicalRuntime}/customer-priority-resolver.js`,`${canonicalRuntime}/customer-theme-composer.js`,`${canonicalRuntime}/claim-deduplicator.js`,`${canonicalRuntime}/section-information-gain-resolver.js`,`${canonicalRuntime}/contradiction-preservation.js`,`${canonicalRuntime}/customer-narrative-ir.js`,`${canonicalRuntime}/customer-reading-ia.js`,`${canonicalRuntime}/customer-reading-layout.js`,`${canonicalRuntime}/smr-native-authority.js`,
  `${canonicalContent}/admission/smr-production-admission-v1.json`,`${canonicalContent}/acceptance/smr-w20-production-cutover-acceptance-v1.json`,`${canonicalContent}/history/v1/legacy-smr-v1-evidence-manifest.json`
];
for(const p of canonicalRequired)assert.ok(exists(p),`canonical SMR file missing: ${p}`);

const allowedGovernance=new Set([
  `${canonicalContent}/audit/smr-w20a-consumer-absence-audit-v1.json`,
  `${canonicalContent}/acceptance/smr-w20b-hard-delete-legacy-acceptance-v1.json`,
  `${canonicalContent}/acceptance/smr-w20c-canonical-rename-acceptance-v1.json`,
  `${canonicalContent}/acceptance/smr-w20d-legacy-absence-acceptance-v1.json`
]);
const allowedHistory=`${canonicalContent}/history/v1`;
function walk(dir){if(!exists(dir))return[];return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const productionFiles=[...walk('functions'),...walk('assets/customer-ui'),...walk('perspectives'),...walk(canonicalContent),'package.json']
  .filter(p=>typeof p==='string'&&exists(p))
  .filter(p=>!p.startsWith(allowedHistory)&&!allowedGovernance.has(p))
  .filter(p=>/\.(?:js|mjs|json|html|md|txt|css)$/.test(p)||p==='package.json');
const forbiddenProductionPatterns=[
  ['construction runtime path',/single-method-reading-r2(?:\/|\\)/],
  ['construction content path',/customer-experience-rebuild[\\/]r12r4b[\\/]smr-r2(?:\/|\\)/],
  ['legacy campaign helper',/(?:\.\/|scripts[\\/])smr-campaign-support\.mjs/],
  ['legacy campaign generator',/generate-cx-r12r4b-smr-campaign\.mjs/]
];
for(const file of productionFiles){
  const src=fs.readFileSync(path.join(root,file),'utf8');
  for(const [label,rx] of forbiddenProductionPatterns)assert.doesNotMatch(src,rx,`${label} remains in production file: ${file}`);
}
const scriptFiles=walk('scripts').filter(p=>/\.(?:mjs|js)$/.test(p));
for(const file of scriptFiles){
  const src=fs.readFileSync(path.join(root,file),'utf8');
  assert.doesNotMatch(src,/(?:from\s*|import\s*\()['"][^'"]*single-method-reading-r2(?:\/|\\)/,`construction runtime import remains in checker/tool: ${file}`);
  assert.doesNotMatch(src,/(?:from\s*|import\s*\()['"][^'"]*customer-experience-rebuild[\\/]r12r4b[\\/]smr-r2(?:\/|\\)/,`construction content import remains in checker/tool: ${file}`);
}
for(const file of [...productionFiles,...scriptFiles])assert.doesNotMatch(path.basename(file),/smr-r2/i,`construction suffix remains in active filename: ${file}`);

const pkg=read('package.json');
for(const key of Object.keys(pkg.scripts||{}))assert.doesNotMatch(key,/smr-r2/i,`construction package script alias remains: ${key}`);
assert.equal(pkg.scripts?.['check:cx-r12r4b:smr'],'node scripts/check-cx-r12r4b-smr.mjs');
assert.ok(pkg.scripts?.check?.includes('npm run check:cx-r12r4b:smr'));
assert.doesNotMatch(pkg.scripts?.check||'',/smr-r2/i);

const api=fs.readFileSync(path.join(root,'functions/api/customer-personal-reality.js'),'utf8');
assert.match(api,/\.\.\/single-method-reading\/single-method-reading-production\.js/);
assert.doesNotMatch(api,/single-method-reading-r2/);
const production=fs.readFileSync(path.join(root,`${canonicalRuntime}/single-method-reading-production.js`),'utf8');
assert.match(production,/PHI-OS-SINGLE-METHOD-READING-PRODUCTION-v2\.0\.0/);
assert.match(production,/export async function maybeBuildProductionSingleMethodReading\(/);
assert.doesNotMatch(production,/export async function maybeBuildProductionSingleMethodReadingR2/);

const manifest=read(`${canonicalContent}/history/v1/legacy-smr-v1-evidence-manifest.json`);
const pprR3FreezePath='content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json';
const pprR3Freeze=exists(pprR3FreezePath)?read(pprR3FreezePath):null;
const governedSuccessorDigests=new Map(Object.entries({...(pprR3Freeze?.protectedConvergenceFiles||{}),...(pprR3Freeze?.sharedSingleMethodReadingFiles||{}),...(pprR3Freeze?.successorFiles||{})}));
assert.equal(manifest.status,'HISTORICAL_EVIDENCE_ARCHIVED_LEGACY_IMPLEMENTATION_DELETED');
assert.equal(manifest.policy.legacyRuntimeMayExecute,false);assert.equal(manifest.policy.historicalEvidenceImmutable,true);assert.equal(manifest.policy.archivedEvidenceMayBeUsedAsProductionAuthority,false);
let archived=0,deleted=0,replaced=0;
for(const row of manifest.records){
  if(row.disposition==='ARCHIVED_HISTORICAL_EVIDENCE'){
    archived++;assert.ok(row.archivePath&&exists(row.archivePath),`archived evidence missing: ${row.originalPath}`);assert.equal(hashFile(row.archivePath),row.sha256,`archived historical evidence mutated: ${row.originalPath}`);
  }else if(row.disposition==='DELETED_LEGACY_IMPLEMENTATION'){
    deleted++;assert.equal(exists(row.originalPath),false,`deleted legacy implementation reappeared: ${row.originalPath}`);
  }else if(row.disposition==='REPLACED_BY_CANONICAL_SUCCESSOR_AT_SAME_PATH'){
    replaced++;if(row.archivePath){assert.ok(exists(row.archivePath),`replaced predecessor archive missing: ${row.originalPath}`);assert.equal(hashFile(row.archivePath),row.sha256,`replaced predecessor archive mutated: ${row.originalPath}`);}assert.ok(row.canonicalSuccessorPath&&exists(row.canonicalSuccessorPath));assert.notEqual(hashFile(row.canonicalSuccessorPath),row.sha256,'canonical successor still equals deleted legacy implementation');const currentSuccessorDigest=hashFile(row.canonicalSuccessorPath),governedSuccessorDigest=governedSuccessorDigests.get(row.canonicalSuccessorPath);assert.ok(currentSuccessorDigest===row.canonicalSuccessorSha256||(governedSuccessorDigest&&currentSuccessorDigest===governedSuccessorDigest),`canonical successor drift without governed successor authority: ${row.canonicalSuccessorPath}`);
  }else assert.fail(`unknown legacy manifest disposition: ${row.disposition}`);
}

const acceptance=read(`${canonicalContent}/acceptance/smr-w20d-legacy-absence-acceptance-v1.json`);
assert.equal(acceptance.status,'LEGACY_ABSENCE_ACCEPTED');assert.equal(acceptance.gates.constructionRuntimeAbsent,true);assert.equal(acceptance.gates.constructionContentAbsent,true);assert.equal(acceptance.gates.legacyImplementationAbsent,true);assert.equal(acceptance.gates.canonicalRuntimeOnly,true);assert.equal(acceptance.gates.packageConstructionAliasesAbsent,true);
console.log(`✓ W20D legacy absence passed: canonical SMR only; ${deleted} legacy implementation records deleted, ${replaced} same-path runtime replaced, ${archived} immutable evidence records archived.`);
