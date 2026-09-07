import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { loadR2RetrievalCorpus, searchManuscriptCorpus } from '../functions/knowledge-runtime/manuscript-source-runtime.js';
import { deterministicGroundedAnswer } from '../functions/_lib/knowledge-access-api.js';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const nodes=json('content/knowledge/registry/nodes.json');
const nodeList=Array.isArray(nodes)?nodes:(nodes.nodes||[]);
const r5Path='content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json'; const r5Active=fs.existsSync(r5Path);
if(r5Active){const r5=json(r5Path);assert.equal(nodeList.length,718);assert.equal(sha('content/knowledge/registry/nodes.json'),r5.canonicalAuthority.successorSha256);assert.equal(r5.canonicalAuthority.predecessorSha256,'61c1d8bd00a13af5fa3d41e802fa3a787c97750c60b04e037377b585a3d01431');}else{assert.equal(nodeList.length,716);assert.equal(sha('content/knowledge/registry/nodes.json'),'61c1d8bd00a13af5fa3d41e802fa3a787c97750c60b04e037377b585a3d01431');}

const contract=json('content/knowledge/source-access/contracts/ksar-r1-r8-reconciliation-contract-v1.json');
assert.deepEqual(contract.stage,['KSAR-R1','KSAR-R2','KSAR-R3','KSAR-R4','KSAR-R5','KSAR-R6','KSAR-R7','KSAR-R8']);
assert.equal(contract.authorityBoundaries.KAUR2CandidateDoesNotEqualApprovedBinding,true);
assert.equal(contract.authorityBoundaries.rawFullBookDeliveryBlocked,true);

const registry=json('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v1.json');
assert.equal(registry.records.length,2);
assert.deepEqual(registry.records.map(r=>r.r2ObjectKey),['books/book-1/materialized/v2/retrieval-corpus.json','books/book-2/materialized/v1/retrieval-corpus.json']);
assert.deepEqual(registry.records.map(r=>r.retrievalCorpusSha256),['2756bf5f18a42772d40d46cfccd141e26e07d2ca416c5a9448a36eeb037bba6a','83ae5f5af63652b1f45faf82ede922069b69e5eb2703b1ba2a617170619d2c8e']);
assert(registry.records.every(r=>r.transportIntegrity==='ACTUAL_BYTES_SHA256_REQUIRED'));

const remote=json('content/knowledge/source-access/registries/r2-manuscript-object-verification-v1.json');
assert.equal(remote.records.length,2);
assert(remote.records.every(r=>r.localBytesVerified===true));
const reviewedRegistry=json('content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json');
assert.equal(reviewedRegistry.recordCount,448);
assert(remote.records.every(r=>r.expectedRetrievalCorpusSha256===reviewedRegistry.records.find(s=>s.sourceCode===r.sourceCode).retrievalCorpusSha256));

const readability=json('content/knowledge/source-access/registries/manuscript-readability-review-v1.json');
assert.equal(readability.recordCount,448);
assert.equal(readability.records.length,448);
assert.equal(Object.values(readability.riskCounts).reduce((a,b)=>a+b,0),448);
assert(readability.records.every(r=>!Object.hasOwn(r,'text')),'Public readability registry must not contain manuscript body text.');
assert(readability.records.every(r=>['LOW','MEDIUM','HIGH'].includes(r.riskLevel)));

const bindings=json('content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json');
const kauR3Acceptance=json('content/knowledge/reconciliation/kau-r3/kau-r3-acceptance-v1.json');
assert.equal(kauR3Acceptance.status,'HUMAN_ACCEPTED_VOLUME_I_RECONCILIATION_FROZEN');
assert.equal(kauR3Acceptance.humanAcceptance.decision,'ACCEPT_WITH_CHANGES');
assert.equal(kauR3Acceptance.summary.ksarApprovedBindingsWritten,62);
const b1Bindings=bindings.records.filter(r=>r.bookCode==='BOOK-1');
assert.equal(b1Bindings.length,62,'KAU-R3 human-accepted Volume-I bindings must remain projected exactly once.');
assert(b1Bindings.every(record=>record.status==='APPROVED'&&record.authority==='KAU-R3_HUMAN_ACCEPTED_VOLUME_I_RECONCILIATION'));
if(r5Active){const b2Bindings=bindings.records.filter(r=>r.bookCode==='BOOK-2');assert.equal(bindings.records.length,235);assert.equal(b2Bindings.length,173);assert(b2Bindings.every(record=>record.status==='APPROVED'));}else assert.equal(bindings.records.length,62);
const corrections=json('content/knowledge/source-access/registries/manuscript-editorial-correction-v1.json');
assert.equal(corrections.status,'ACTIVE_HUMAN_CONFIRMED_CORRECTIONS');
assert.equal(corrections.records.length,1);

const fixtureSource={sourceCode:'FIXTURE',bookCode:'BOOK-1',locale:'zh-Hans',sourceSha256:'s'.repeat(64),corpusSha256:'c'.repeat(64),recordCount:1};
const fixtureCorpus={bookCode:'BOOK-1',locale:'zh-Hans',sourceSha256:fixtureSource.sourceSha256,corpusSha256:fixtureSource.corpusSha256,recordCount:1,records:[{sectionCode:'FIX-1',segmentType:'SECTION',partCode:'P1',sequence:1,heading:'现实如何形成',startPage:1,endPage:2,textSha256:'a'.repeat(64),text:'现实形成需要区分差异、约束与结构。结构稳定之后，运行才有可以持续的载体。'}]};
const fixtureText=JSON.stringify(fixtureCorpus);
fixtureSource.retrievalCorpusSha256=crypto.createHash('sha256').update(fixtureText).digest('hex');
fixtureSource.r2ObjectKey='books/fixture/retrieval-corpus.json';
const loaded=await loadR2RetrievalCorpus({get:async key=>({body:fixtureText,key})},fixtureSource);
assert.equal(loaded.bookCode,fixtureCorpus.bookCode);
assert.equal(loaded.sourceSha256,fixtureCorpus.sourceSha256);
assert.equal(loaded.records.length,fixtureCorpus.recordCount);
await assert.rejects(()=>loadR2RetrievalCorpus({get:async()=>({body:fixtureText+' '})},fixtureSource),error=>error?.code==='MANUSCRIPT_RETRIEVAL_CORPUS_BYTES_MISMATCH');

const fixtureBindings={records:[{mappingCode:'FIX-MAP-1',sectionCode:'FIX-1',nodeCode:'KN-PREFACE-001',status:'APPROVED'}]};
const fixtureCorrections={records:[{correctionCode:'FIX-CORR-1',sectionCode:'FIX-1',field:'heading',rawValue:'现实如何形成',correctedValue:'现实形成机制',status:'APPROVED',rawSourcePreserved:true}]};
const searched=searchManuscriptCorpus({corpus:fixtureCorpus,source:fixtureSource,bindings:fixtureBindings,corrections:fixtureCorrections,query:'现实 结构'});
assert.equal(searched.length,1);
assert.equal(searched[0].canonicalBinding.status,'APPROVED');
assert.deepEqual(searched[0].canonicalBinding.nodeCodes,['KN-PREFACE-001']);
assert.equal(searched[0].heading,'现实形成机制');
assert.equal(searched[0].editorialCorrections[0].correctionCode,'FIX-CORR-1');

const grounding={allowed:true,sources:[{sourceId:'MANUSCRIPT:FIX-1',sourceType:'COMPLETED_MANUSCRIPT',text:'现实形成需要区分差异、约束与结构。结构稳定之后，运行才有可以持续的载体。'}]};
const answer=deterministicGroundedAnswer('现实如何形成',grounding,'zh-Hans');
assert.equal(answer.present,true);
assert.equal(answer.generativeModelUsed,false);
assert(answer.sourceReferences.includes('MANUSCRIPT:FIX-1'));

const knowledgeSearch=fs.readFileSync('assets/js/pages/knowledge-search.js','utf8');
const currentKnowledge=fs.readFileSync('assets/customer-ui/js/surfaces/knowledge.js','utf8');
const library=fs.readFileSync('assets/js/pages/library.js','utf8');
const kapAnswerAcceptance=json('content/knowledge/answer-projection/acceptance/kap-w11-w17-answer-composition-acceptance-v1.json');
const kapGuidedSuccessor=json('content/knowledge/answer-projection/reconciliation/kap-w17-w18-guided-reading-surface-successor-v1.json');
const hpc2CkaClientSuccessor=json('content/web-production/reconciliation/hpc2-w6-cka-client-surface-successor-v1.json');
assert.equal(kapAnswerAcceptance.status,'ACCEPTED_ASK_PHIOS_INDEPENDENT_DETERMINISTIC_PRODUCTION');
assert.equal(kapAnswerAcceptance.acceptance.upstreamGroundedAnswerConsumed,false);
assert.equal(kapGuidedSuccessor.status,'ACTIVE_ADDITIVE_SURFACE_SUCCESSOR');
assert.equal(kapGuidedSuccessor.authorizedDrift.path,'assets/js/pages/knowledge-search.js');
assert.equal(hpc2CkaClientSuccessor.currentClientSurface.path,kapGuidedSuccessor.authorizedDrift.path);
assert.equal(sha(hpc2CkaClientSuccessor.currentClientSurface.path),hpc2CkaClientSuccessor.currentClientSurface.sha256);
assert.equal(hpc2CkaClientSuccessor.currentClientSurface.ckaW0W4CheckerAccepted,true);
assert.equal(hpc2CkaClientSuccessor.authorityBoundary.kapW11W17AuthorityRewritten,false);
assert.equal(hpc2CkaClientSuccessor.authorityBoundary.knowledgeAuthorityCreated,false);
assert.equal(hpc2CkaClientSuccessor.authorityBoundary.guidedContextActivated,false);
assert.equal(kapGuidedSuccessor.authorityBoundary.askPhiosSemanticsChanged,false);
assert.equal(kapGuidedSuccessor.authorityBoundary.askPhiosAiProviderActivated,false);
assert.equal(kapGuidedSuccessor.authorityBoundary.askPhiosMethodExecutionActivated,false);
assert.equal(kapGuidedSuccessor.authorityBoundary.guidedReadingIsSeparateCapability,true);
assert(knowledgeSearch.includes("import { askPhios }"));
const directAskRender=knowledgeSearch.includes('render(await askPhios(');
const guidedSuccessorAskRender=
  knowledgeSearch.includes('lastAskPayload=await askPhios(') &&
  knowledgeSearch.includes('render(lastAskPayload)');
const hpc2CkaSuccessorAskRender=
  knowledgeSearch.includes('const payload = await askPhios({') &&
  knowledgeSearch.includes('renderAnswer(payload)');
assert(
  directAskRender||guidedSuccessorAskRender||hpc2CkaSuccessorAskRender,
  'Ask PHI OS response must be rendered directly or through an accepted KAP/HPC2 CKA client successor.'
);
assert(knowledgeSearch.includes("new URLSearchParams(location.search).get('q')"));
assert(currentKnowledge.includes('/knowledge/ask/'));
assert(currentKnowledge.includes('loadPublishedArticles'));
assert(library.includes("id: 'knowledge-access'"));

const freeze=json('content/knowledge/source-access/freeze/ksar-r1-r8-reconciliation-v1.json');
assert.equal(freeze.status,'HUMAN_REVIEW_GATE_CLOSED_REMOTE_R2_GATE_PENDING');
assert.equal(freeze.acceptance.productionFreezeEligible,false);
assert(freeze.productionBlockers.includes('REMOTE_R2_GET_SHA256_VERIFICATION_PENDING'));
assert.equal(freeze.acceptance.all448HumanReadabilityReviewsComplete,true);
assert.equal(freeze.acceptance.reviewedCorpusPromotionComplete,true);
assert.deepEqual(freeze.productionBlockers,['REMOTE_R2_GET_SHA256_VERIFICATION_PENDING']);

const pkg=json('package.json');
assert.equal(pkg.scripts['check:ksar-r1-r8'],'node scripts/check-ksar-r1-r8-reconciliation.mjs');
assert(pkg.scripts.check.includes('npm run check:ksar-r1-r8'));
assert.equal(pkg.scripts['ksar:review'],'node scripts/build-ksar-manuscript-review-projection.mjs');
assert.equal(pkg.scripts['ksar:reviewed-corpus'],'node scripts/build-ksar-reviewed-corpus.mjs');
assert.equal(pkg.scripts['ksar:verify-corpora'],'node scripts/verify-ksar-r2-corpora.mjs');

console.log('✓ KSAR-R1～R8 Reconciliation passed.');
console.log('  R1 actual-bytes corpus hashes and canonical books/ object keys are reconciled; remote GET evidence remains explicit pending state.');
console.log(r5Active ? '  R2-R4 human-accepted Volume I/II bindings plus KAU-R5 Canonical successor projection are active without putting manuscript bodies in public Git.' : '  R2-R4 KAU-R3 human-accepted Volume I bindings and editorial correction projection are active without putting manuscript bodies in public Git.');
console.log('  R5-R6 unified hybrid retrieval plus deterministic grounded answer projection are active.');
console.log('  R7 Knowledge Search, Free Explore and Library gateways route into Knowledge Access.');
console.log('  R8 Human Review Gate is closed; production freeze remains correctly blocked only until reviewed-corpus remote R2 hash verification completes.');
