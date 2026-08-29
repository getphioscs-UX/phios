import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {hash,RESEARCH,measureDepth} from './audit-cx-smr-enrichment-depth.mjs';
import {loadW01,validateW01} from './check-cx-smr-enrichment-w01.mjs';
import {validateBook} from './check-cx-smr-enrichment-w2.mjs';
import {AST_FP_COMPOSITION_VERSION,AST_FP_RULES,AST_FP_ASPECT_POLICY} from '../functions/interpretation-runtime/ast-full-production-composer-v1.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const current=read('content/professional/ast-full-production/acceptance/ast-fp-current-baseline-v1.json');
const contract=read('content/professional/ast-full-production/contracts/ast-fp-engineering-contract-v1.json');
const legacySmrManifest=read('content/customer-experience-rebuild/r12r4b/smr/history/v1/legacy-smr-v1-evidence-manifest.json');
const legacyRecordByOriginal=new Map(legacySmrManifest.records.map(row=>[row.originalPath,row]));
const archivedLegacyPath=new Map(legacySmrManifest.records.filter(row=>row.archivePath).map(row=>[row.originalPath,row.archivePath]));
const resolveHistoricalPath=p=>archivedLegacyPath.get(p)||p;
const w01=loadW01();validateW01(w01);
assert.equal(current.baselineCommit,'2211d9bd1cdecb2d238f4c05d1f58345efd11804');
assert.equal(current.historicalBaselineRewritten,false);
assert.equal(current.currentReconciledMainCommit,'a06506cbbc9bf0bdd11ff1c740f7be65276d84d9');
assert.equal(current.packageValidationPolicy?.mode,'AST_SCRIPT_PROJECTION');
assert.equal(current.protectedFileReconciliation.length,w01.baseline.protectedFiles.length);
for(const row of current.protectedFileReconciliation){
 const historical=w01.baseline.protectedFiles.find(x=>x.path===row.path);assert.ok(historical);
 assert.equal(row.historicalSha256,historical.lfNormalizedSha256);
 const resolvedPath=resolveHistoricalPath(row.path);const legacyRecord=legacyRecordByOriginal.get(row.path);const hasPhysicalEvidence=fs.existsSync(resolvedPath);
 if(!hasPhysicalEvidence){
  assert.ok(legacyRecord,`Protected source missing without historical manifest evidence: ${row.path}`);
  assert.equal(legacyRecord.disposition,'ARCHIVED_HISTORICAL_EVIDENCE',`Missing protected source is not archived historical evidence: ${row.path}`);
  assert.equal(legacyRecord.sha256,row.currentSha256,`Historical manifest digest mismatch: ${row.path}`);
  continue;
 }
 const normalized=fs.readFileSync(resolvedPath,'utf8').replace(/\r\n/g,'\n');
 if(row.path==='package.json'){
  // package.json is shared orchestration, not AST semantic authority.
  // NUM/SMR/other successors may append unrelated scripts without invalidating AST.
  assert.equal(row.validationMode,'AST_SCRIPT_PROJECTION','AST package validation must stay projection-scoped');
  const pkg=JSON.parse(normalized);
  const projection={checkAstProduction:pkg.scripts?.['check:ast-production'],checkAstFullProduction:pkg.scripts?.['check:ast-full-production'],checkAstFpR2:pkg.scripts?.['check:ast-fp-r2'],checkAstFpR3:pkg.scripts?.['check:ast-fp-r3'],checkAstFpR4:pkg.scripts?.['check:ast-fp-r4'],checkAstFpR4a:pkg.scripts?.['check:ast-fp-r4a'],checkAstFpR5:pkg.scripts?.['check:ast-fp-r5'],checkAstFpR2W9W12:pkg.scripts?.['check:ast-fp-r2-w9-w12'],checkAstFpR2W13W16:pkg.scripts?.['check:ast-fp-r2-w13-w16'],checkAstR2W17:pkg.scripts?.['check:ast-r2-w17'],checkAstR2W18:pkg.scripts?.['check:ast-r2-w18'],checkAstR2W19:pkg.scripts?.['check:ast-r2-w19'],checkAstR2W20:pkg.scripts?.['check:ast-r2-w20'],checkAstR2W17W20:pkg.scripts?.['check:ast-r2-w17-w20'],smokeAstR2W20Live:pkg.scripts?.['smoke:ast-r2-w20-live']};
  assert.equal(hash(JSON.stringify(projection)),row.astScriptProjectionSha256,'AST package-script authority projection changed');
  assert.ok(projection.checkAstFullProduction?.includes('check-ast-fp-current.mjs'));
  assert.ok(projection.checkAstFullProduction?.includes('check:ast-fp-r2'));
  assert.ok(projection.checkAstFullProduction?.includes('check:ast-fp-r3'));
  assert.ok(projection.checkAstFullProduction?.includes('check:ast-fp-r4'));
  assert.ok(projection.checkAstFullProduction?.includes('check:ast-fp-r4a'));
  assert.ok(projection.checkAstFullProduction?.includes('check:ast-fp-r5'));
  assert.ok(projection.checkAstFullProduction?.includes('check:ast-fp-r2-w9-w12'));
  assert.ok(projection.checkAstFullProduction?.includes('check:ast-fp-r2-w13-w16'));
  assert.ok(projection.checkAstFullProduction?.includes('check:ast-r2-w17-w20'));
  assert.equal(projection.checkAstFpR2W13W16,'node scripts/check-ast-fp-r2-w13-w16.mjs');
  assert.equal(projection.checkAstR2W17,'node scripts/check-ast-r2-w17-production-machine-campaign.mjs');
  assert.equal(projection.checkAstR2W18,'node scripts/check-ast-r2-w18-final-customer-human-acceptance.mjs');
  assert.equal(projection.checkAstR2W19,'node scripts/check-ast-r2-w19-method-scoped-production-admission.mjs');
  assert.equal(projection.checkAstR2W20,'node scripts/check-ast-r2-w20-deployment-readiness.mjs');
  assert.equal(projection.checkAstR2W17W20,'npm run check:ast-r2-w17 && npm run check:ast-r2-w18 && npm run check:ast-r2-w19 && npm run check:ast-r2-w20');
  assert.equal(projection.smokeAstR2W20Live,'node scripts/smoke-ast-r2-w20-live.mjs');
 }else assert.equal(hash(normalized),row.currentSha256,`Current protected file changed: ${row.path}`);
 if(row.currentSha256!==row.main2211Sha256)assert.ok(['AST_FP_EXPLICIT_SUCCESSOR','SHARED_MAIN_SUCCESSOR'].includes(row.changeCategory),`Unsupported protected successor category: ${row.path}`);
}
for(const row of current.preservedResearchFiles){const resolvedPath=resolveHistoricalPath(row.path);assert.ok(fs.existsSync(resolvedPath),`Research history missing after canonical cleanup: ${row.path}`);assert.equal(hash(fs.readFileSync(resolvedPath,'utf8').replace(/\r\n/g,'\n')),row.sha256,`Research history changed: ${row.path}`);}
assert.deepEqual(measureDepth(process.cwd()),w01.metrics,'Old 48-case evidence must not be rewritten');
const mapping=read('content/professional/canonical-meaning-production/successors/canonical-method-meaning-mapping-v4.json').mappings.filter(m=>m.sourcePluginCode==='AST');
assert.equal(mapping.length,41);
const meanings=new Set(mapping.map(m=>m.targetMeaningCode));
const rules=new Set(['CX-COMP-AST-PLANET-SIGN-HOUSE-v1','CX-COMP-AST-ASPECT-v1','CX-COMP-AST-PLACEMENT-v1']);
let cards=0;const ids=[];
for(const id of w01.contract.executionOrder){
 const book=read(`${RESEARCH}/w2/${id}-extractions-v1.json`);validateBook(book,w01,meanings,rules);
 cards+=book.cards.length;ids.push(...book.cards.map(c=>c.cardId));
 const invalid=structuredClone(book);invalid.productionAllowed=true;assert.throws(()=>validateBook(invalid,w01,meanings,rules));
}
assert.equal(cards,25);assert.equal(new Set(ids).size,25);
assert.equal(contract.candidate.compositionVersion,AST_FP_COMPOSITION_VERSION);
assert.deepEqual(contract.candidate.rules.map(r=>r.ruleRef),AST_FP_RULES);
const aspectPolicy=read(contract.candidate.orbPolicySource);
for(const a of aspectPolicy.aspects){
 const code=a.code||a.aspectCode;const runtime=AST_FP_ASPECT_POLICY[code];assert.ok(runtime,JSON.stringify(a));
 assert.equal(runtime.angle,a.angleDegrees);assert.equal(runtime.orb,a.orbDegrees);
}
assert.equal(contract.candidate.productionAllowed,false);
assert.equal(contract.candidate.defaultEnabled,false);
assert.equal(contract.gates.fullProductionClaimAllowed,false);
const admission=read('content/customer-experience-rebuild/r12r4b/smr/history/v1/admission/smr-production-admission-v1.json');
assert.equal(admission.productionAllowed,false);assert.equal(admission.customerCutoverAllowed,false);
const human=read('content/customer-experience-rebuild/r12r4b/smr/history/v1/review/smr-human-review-results-v1.json');assert.equal(human.accepted,0);assert.equal(human.pending,48);
const pkg=read('package.json');execFileSync('sh',['-n','-c',pkg.scripts.check]);
assert.ok(pkg.scripts.check.includes('check:ast-full-production'));
console.log(JSON.stringify({status:'PASS',currentBaseline:current.baselineCommit,currentReconciledMainCommit:current.currentReconciledMainCommit||null,historicalProtectedFiles:current.protectedFileReconciliation.length,researchFilesPreserved:current.preservedResearchFiles.length,sources:5,cards,historicalChecksRetained:true,packageValidationMode:current.protectedFileReconciliation.find(x=>x.path==='package.json')?.validationMode||'FULL_FILE',sourceProductionAdmission:false},null,2));
