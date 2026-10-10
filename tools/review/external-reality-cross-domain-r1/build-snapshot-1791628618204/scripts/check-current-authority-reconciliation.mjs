import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const arg=(process.argv[2]||'ALL').toUpperCase();
const should=w=>arg==='ALL'||arg===w;
const base='content/governance/current-authority-reconciliation/';

function w0(){
 const a=read(base+'carc-w0-canonical-node-reconciliation-v1.json');
 const old=read(a.predecessor.path).nodes, cur=read(a.current.path).nodes, pub=read(a.publicProjection.path).records;
 const oldc=new Set(old.map(x=>x.nodeCode)), curc=new Set(cur.map(x=>x.nodeCode)), pubc=new Set(pub.map(x=>x.nodeCode));
 const added=cur.filter(x=>!oldc.has(x.nodeCode));
 assert.equal(old.length,718); assert.equal(cur.length,931); assert.equal(added.length,213);
 assert.equal(new Set(cur.map(x=>x.nodeCode)).size,931); assert.equal([...oldc].filter(x=>!curc.has(x)).length,0);
 assert.equal(added.filter(x=>x.canonicalAdmission?.action==='promote').length,192);
 assert.equal(added.filter(x=>x.canonicalAdmission?.action==='supersede').length,21);
 assert.ok(added.filter(x=>x.canonicalAdmission?.action==='promote').every(x=>x.canonicalAdmission.sourceOutlineAuthority));
 assert.ok(added.filter(x=>x.canonicalAdmission?.action==='supersede').every(x=>x.canonicalAdmission.lineage));
 assert.ok(added.every(x=>x.canonicalAdmission?.status==='HUMAN_APPROVED_BOOK_W1D'));
 assert.ok(added.every(x=>x.publicationBookCode&&x.publicationPartCode));
 assert.ok(added.every(x=>x.registryStatus==='planned'&&x.productionReady===false&&!pubc.has(x.nodeCode)));
 assert.equal(a.accounting.silentDeletionCount,0); assert.equal(a.accounting.duplicateIdentityCount,0); assert.equal(a.proof.countOnlyReconciliation,false);
 console.log('✓ CARC-W0 canonical node reconciliation: 718 → 931 is lineage/ownership governed (192 promote + 21 supersede), not count replacement.');
}
function w1(){
 const a=read(base+'carc-w1-knowledge-relationship-reconciliation-v1.json'); const rel=read(a.relationshipSource.path); const nodes=read(a.canonicalNodeAuthority.path).nodes; const pub=read(a.publicationAuthority.path).records;
 const set=new Set(nodes.map(x=>x.nodeCode)), pset=new Set(pub.map(x=>x.nodeCode));
 assert.equal(a.result,'EXPECTED_SUCCESSOR_CHANGE'); assert.equal(sha(a.relationshipSource.path),a.relationshipSource.sha256);
 assert.notEqual(a.successorEvidence.current?.sha256||a.successorEvidence.current?.relationshipSha256,a.predecessorFreeze.relationshipSnapshot?.sha256||'');
 for(const r of rel.records){ assert.ok(set.has(r.sourceNodeCode)&&set.has(r.targetNodeCode),`Unknown relationship node: ${r.relationshipCode}`); assert.equal(Boolean(r.targetPublished),pset.has(r.targetNodeCode),`Publication status mismatch: ${r.relationshipCode}`); }
 assert.equal(a.validation.directDigestAcceptance,false); assert.equal(a.validation.unknownCanonicalNodeReferenceCount,0); assert.equal(a.validation.publicationFlagMismatchCount,0);
 console.log(`✓ CARC-W1 KAP relationship reconciliation: ${rel.records.length} relationships = EXPECTED_SUCCESSOR_CHANGE; provenance and publication authority verified.`);
}
function w2(){
 const a=read(base+'carc-w2-mir-reconciliation-v1.json');
 assert.equal(a.status,'RECONCILED_NO_SECOND_INTERPRETATION_RUNTIME'); assert.equal(a.proof.newInterpretationRuntimeCreated,false);
 for(const x of a.artifacts){ assert.ok(fs.existsSync(x.path)); assert.equal(sha(x.path),x.sha256,`MIR artifact drift: ${x.role}`); }
 const roles=new Set(a.artifacts.map(x=>x.role)); for(const r of ['INTERPRETATION_KERNEL','SHARED_INTERPRETATION_COMPOSITION','CANONICAL_MEANING_RUNTIME','KNOWLEDGE_RUNTIME','RMO_INTERPRETATION_STATE_OR_BOUNDARY','READING_RUNTIME']) assert.ok(roles.has(r));
 assert.equal(new Set(a.artifacts.map(x=>x.path)).size,a.artifacts.length);
 assert.equal(a.rules.interpretationKernelIsNotComposition,true); assert.equal(a.rules.interpretationIsNotCanonicalMeaning,true); assert.equal(a.rules.interpretationIsNotKnowledgeAuthority,true); assert.equal(a.rules.interpretationIsNotRmoState,true); assert.equal(a.rules.interpretationIsNotReadingRuntime,true);
 console.log('✓ CARC-W2 MIR reconciliation: Interpretation Kernel / Composition / Meaning / Knowledge / RMO / Reading remain distinct; no second runtime.');
}
function w3(){
 const a=read(base+'carc-w3-wpr-route-reconciliation-v1.json'); const rr=read(a.routeRegistry.path), sr=read(a.surfaceRegistry.path); const sm=new Map(sr.entries.map(x=>[x.surfaceCode,x]));
 assert.equal(new Set(rr.entries.map(x=>x.routeCode)).size,rr.entries.length); assert.equal(new Set(rr.entries.map(x=>x.path)).size,rr.entries.length);
 assert.equal(a.proof.missingSurfaceOwnerCount,0); assert.equal(a.proof.missingConsumerCount,0); assert.equal(a.proof.unknownProductionStatusCount,0);
 for(const r of a.routes){ assert.ok(sm.has(r.surfaceCode)); assert.equal(r.localeOwnership,'RUNTIME_LOCALE'); assert.equal(r.consumerExists,true); assert.ok(r.canonicalOwner.length>0); assert.ok(['PUBLIC','RESTRICTED'].includes(r.visibility)); }
 console.log(`✓ CARC-W3 WPR route reconciliation: ${a.routes.length} routes have owner, locale, consumer, visibility and explicit production state.`);
}
function w4(){
 const a=read(base+'carc-w4-deployment-evidence-v1.json');
 assert.equal(a.repository.sha,'3e4f22cf33e55a93b4eaf9764ab17202acf3b844'); assert.equal(a.build.state,'NOT_OBSERVED_FOR_CURRENT_REPOSITORY_SHA');
 assert.notEqual(a.cloudflareDeployment.sha,a.repository.sha); assert.equal(a.cloudflareDeployment.state,'STALE_RECORDED_DEPLOYMENT'); assert.equal(a.acceptance.productionAccepted,false); assert.equal(a.acceptance.deploymentCurrentMainVerified,false);
 assert.equal(a.rules.localCheckerGreenDoesNotEqualProductionAccepted,true); assert.equal(a.rules.oldProductionShaCannotAuthorizeNewRepoSha,true);
 console.log('✓ CARC-W4 deployment evidence: current repo is explicit, current build/deployment is unverified, PRODUCTION_ACCEPTED remains false.');
}
function w5(){
 const a=read(base+'carc-w5-public-asset-base-v1.json'); for(const x of a.layers){ assert.ok(fs.existsSync(x.path)); assert.equal(sha(x.path),x.sha256,`Asset owner layer drift: ${x.layer}`); }
 assert.equal(a.proof.duplicateCurrentOwnerPerLayer,false); assert.equal(a.proof.clientVisualCreatesSecondAssetResolver,false); assert.equal(a.proof.clientVisualCreatesPublicationAuthority,false);
 for(const k of ['hero','figure','icon','bookCover']) assert.ok(a.requiredAssetClasses[k].count>0,`Missing ${k} assets`);
 assert.deepEqual(a.requiredAssetClasses.localeAsset.exists,[true,true]); assert.equal(a.rules.privateR2IsNotPublicAssetProjection,true);
 console.log(`✓ CARC-W5 public asset base: ${a.publicRegistry.assetCount} public registry records; canonical/public/presentation/R2 lifecycle owners remain distinct.`);
}
function w6(){
 const a=read(base+'carc-w6-checker-lifecycle-registry-v1.json'), pkg=read('package.json'); assert.equal(sha(a.historicalFreeze.checkerPath),a.historicalFreeze.checkerSha256); assert.equal(a.historicalFreeze.preserved,true);
 for(const x of a.successorAliases){ assert.ok(pkg.scripts[x.historicalAlias]); assert.ok(pkg.scripts[x.explicitHistoricalAlias]); assert.ok(pkg.scripts[x.currentAlias]); assert.notEqual(pkg.scripts[x.currentAlias],pkg.scripts[x.explicitHistoricalAlias]); }
 assert.equal(a.postCbsPackageEvolution.removedScriptsBeforeCarc.length,0); assert.ok(a.postCbsPackageEvolution.changedScriptsBeforeCarc.includes('check:part-k'));
 assert.equal(a.rules.currentAggregateMayNotCallHistoricalAlias,true);
 console.log('✓ CARC-W6 checker lifecycle: historical freezes preserved; CBS/CKA/CPR current successors are explicit and non-ambiguous.');
}
function w7(){
 const a=read(base+'carc-w7-current-chain-v1.json'), pkg=read('package.json'); assert.ok(pkg.scripts['check:current']); assert.equal(a.npmAlias,'check:current'); assert.ok(a.checks.every(x=>x.class==='CURRENT'));
 const cmd=pkg.scripts['check:current']; for(const forbidden of a.historicalAliasesForbidden) assert.ok(!cmd.includes(`npm run ${forbidden}`),`Historical alias in current aggregate: ${forbidden}`);
 console.log(`✓ CARC-W7 current chain defined: ${a.checks.length} current gates; historical aggregate excluded.`);
}
function w8(){
 const a=read(base+'carc-w8-exit-gate-v1.json'); assert.equal(a.status,'PHASE_1_CURRENT_AUTHORITY_RECONCILIATION_FROZEN'); for(const [k,v] of Object.entries(a.exitGate)) assert.equal(v,0,`${k} is not zero`); assert.equal(a.productionAcceptance.currentRepositoryDeploymentAccepted,false);
 for(const e of a.frozenEvidence){ assert.ok(fs.existsSync(e.path),`Missing W8 evidence: ${e.path}`); assert.equal(sha(e.path),e.sha256,`W8 evidence drift: ${e.path}`); }
 const backfill=read(a.dependencyBackfill.artifact); assert.equal(backfill.restoredFileCount,backfill.restoredFiles.length); for(const f of backfill.restoredFiles){ assert.ok(fs.existsSync(f.path),`Missing dependency backfill: ${f.path}`); assert.equal(sha(f.path),f.sha256,`Dependency backfill drift: ${f.path}`); }
 console.log(`✓ CARC-W8 exit gate: 0 unexplained canonical/MIR/KAP drift, 0 checker ambiguity, 0 unknown production authority; ${backfill.restoredFileCount} exact-byte dependency backfills pinned.`);
}
const all=[['W0',w0],['W1',w1],['W2',w2],['W3',w3],['W4',w4],['W5',w5],['W6',w6],['W7',w7],['W8',w8]];
let ran=0; for(const [id,fn] of all){ if(should(id)){ if(id==='W8'&&!fs.existsSync(base+'carc-w8-exit-gate-v1.json')&&process.argv.includes('--pre-exit')) continue; fn(); ran++; } }
assert.ok(ran>0 || process.argv.includes('--pre-exit'),'No CARC work selected');
