import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='content/production-closure/live-customer-commercial-convergence/bazi-r2-p7/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const write=(n,v)=>fs.writeFileSync(dir+n,JSON.stringify(v,null,2)+'\n');
const selector='functions/personal-reading/publication-fit/bazi-publication-lead-selector.js';
const owners=['functions/report-delivery/bazi-customer-native-inputs.js','functions/personal-reading/publication-fit/bazi-diagram-fidelity.js','functions/personal-reading/publication-fit/bazi-publication-fit-gate.js','functions/personal-reading/deep-manuscript/bazi-deep-manuscript-publication.js'];
assert.equal(sha(selector),'0ffb2aa0815044f534734bbab9729eafc5c04768d3f353013df03310e1c10042');
if(process.argv.includes('--freeze')){
 assert(!fs.existsSync(dir+'P7R3C-FREEZE.json'),'FREEZE_ALREADY_EXISTS');
 const protectedFiles=new Set([selector,...Object.keys(read(dir+'P7R3C-S10-SELECTION-BEFORE.json').protectedHashes||{})]);
 for(const name of fs.readdirSync(dir))if(/^(P7R[123BC]|BAZI-R2-CURRENT-PRODUCTION-PUBLICATION-BASELINE-V[12])/.test(name)&&fs.statSync(dir+name).isFile())protectedFiles.add(dir+name);
 const hashes=Object.fromEntries([...protectedFiles].filter(p=>fs.existsSync(p)).map(p=>[p,sha(p)]));
 write('P7R3C-FREEZE.json',{state:'PASS_LOCAL_FROZEN',humanAcceptance:'NOT_HUMAN_ACCEPT',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),hashes,receiptSha256:sha(dir+'P7R3C-S10-TIMING-COVERAGE-SUCCESSOR.json'),baselineV2Sha256:sha(dir+'BAZI-R2-CURRENT-PRODUCTION-PUBLICATION-BASELINE-V2.json'),selectorSha256:sha(selector)});
 write('P7R3D-BEFORE.json',{owners:Object.fromEntries(owners.map(p=>[p,sha(p)])),status:execFileSync('git',['status','--porcelain'],{encoding:'utf8'})});
 console.log('P7R3C frozen; selector exact SHA verified.');
 process.exit(0);
}
const {projectBaziNativeChartFacts,assertBaziNativeAuthorityComplete}=await import('../functions/report-delivery/bazi-customer-native-inputs.js');
const {compileBaziDeepPublication}=await import('../functions/personal-reading/deep-manuscript/bazi-deep-manuscript-publication.js');
const {enrichBaziDiagram}=await import('../functions/personal-reading/publication-fit/bazi-diagram-fidelity.js');
const {loadBaziReviewAuthority,ROOT}=await import('./lib/bazi-deep-manuscript-review.mjs');
const {digest}=await import('../functions/personal-reading/deep-manuscript/bazi-deep-manuscript-contract.js');
const audit=read(dir+'P7R3-D05-D10-SOURCE-AUDIT.json'),before=read(dir+'P7R3D-BEFORE.json'),freeze=read(dir+'P7R3C-FREEZE.json');
const receipt={status:'RUNNING',authorityProjection:{},customerTopology:{},customerRelativeGate:'NOT_IMPLEMENTED_SCOPE_BLOCKER',diversityMatrix:[],negativeTests:{status:'NOT_RUN',reason:'Stage B stopped before gate changes; A–H browser tests remain required.'},ownersChanged:[],beforeSha256:before.owners,afterSha256:{},baselineV3:'NOT_CREATED',targeted1920:'NOT_RUN',fullP7:'NOT_RUN',print:'NOT_RUN',pdf:'NOT_RUN',immutableReopen:'NOT_RUN',providerCalls:0,providerCostUSD:0,providerNetworkCalls:0,remainingBlocker:null};
try{
 const facts=projectBaziNativeChartFacts({chart:audit.chart,tenGods:audit.canonicalTenGods,relationships:audit.canonicalRelationships});
 assert.deepEqual(facts.relationships,audit.canonicalRelationships.relations);
 const hidden=facts.tenGodFacts.filter(f=>f.position==='DAY_BRANCH_HIDDEN');
 assert.equal(facts.relationships.length,1);assert.equal(hidden.length,3);
 for(const f of hidden){assert.deepEqual(f.canonicalRecord,audit.canonicalTenGods.hiddenStems.find(t=>t.location===f.canonicalRecord.location));assert.equal(f.token,f.canonicalRecord.hiddenStemZh);assert.equal(f.tenGod,f.canonicalRecord.tenGodZh);}
 receipt.authorityProjection={status:'PASS_LOCAL',d05CanonicalCount:1,d05ProjectedCount:1,d10CanonicalHiddenCount:3,d10ProjectedHiddenCount:3,exactSourceEquivalence:true};
 // Adapter-only fixtures retain source records verbatim; no chart recalculation.
 const reference=await loadBaziReviewAuthority();
 for(const kind of ['ZERO','ONE','MULTIPLE']){const r=structuredClone(audit.canonicalRelationships);r.relations=kind==='MULTIPLE'?structuredClone(reference.natal.relationships):r.relations.slice(0,kind==='ZERO'?0:1);if(kind==='MULTIPLE')assert(r.relations.length>1);const f=projectBaziNativeChartFacts({chart:audit.chart,tenGods:audit.canonicalTenGods,relationships:r});assert.deepEqual(f.relationships,r.relations);receipt.diversityMatrix.push({dimension:'relationships',count:r.relations.length,status:'PASS',fixture:kind==='MULTIPLE'?'ADAPTER_ONLY_EXISTING_GENG_RECORDS_NOT_CUSTOMER_AUTHORITY':'AUDITED_SOURCE_SUBSET'});}
 for(const count of [1,2,3]){const chart=structuredClone(audit.chart),tg=structuredClone(audit.canonicalTenGods);chart.pillars.find(p=>p.position==='DAY').hiddenStems=chart.pillars.find(p=>p.position==='DAY').hiddenStems.slice(0,count);tg.hiddenStems=tg.hiddenStems.filter(t=>t.pillar!=='DAY'||t.order<=count);const f=projectBaziNativeChartFacts({chart,tenGods:tg,relationships:audit.canonicalRelationships});assert.equal(f.tenGodFacts.filter(t=>t.position==='DAY_BRANCH_HIDDEN').length,count);receipt.diversityMatrix.push({dimension:'dayHidden',count,status:'PASS',fixture:'SYNTHETIC_ADAPTER_ONLY_SOURCE_SUBSET'});}
 const missing=structuredClone(facts);missing.tenGodFacts=missing.tenGodFacts.filter(f=>f.position!=='DAY_BRANCH_HIDDEN');assert.throws(()=>assertBaziNativeAuthorityComplete({chart:audit.chart,tenGods:audit.canonicalTenGods,relationships:audit.canonicalRelationships,projection:missing}),e=>e.code==='BAZI_NATIVE_AUTHORITY_PROJECTION_INCOMPLETE'&&e.responsibilityOwner==='PHIOS_SYSTEM');receipt.projectionLossNegativeTest='PASS';
 const snapshot=read(ROOT+'LIVE-MANUSCRIPT-SNAPSHOT-R2-CLOSURE.json'),v2=read(dir+'BAZI-R2-CURRENT-PRODUCTION-PUBLICATION-BASELINE-V2.json');
 receipt.gengCurrentSuccessorRegression={};
 for(const mode of ['BILINGUAL','EN','ZH_HANS']){const current=JSON.parse(JSON.stringify(await compileBaziDeepPublication({snapshot,pack:reference,presentationMode:mode,recomposePass:v2.modes[mode].recomposePass}))),previous=read(v2.modes[mode].path);assert.deepEqual(current.publication.pages,previous.publication.pages);assert.deepEqual(current.editorial,previous.editorial);assert.deepEqual(current.technical.diagrams,previous.technical.diagrams);assert.equal(current.publication.pageCount,48);assert.equal(current.technical.diagrams.length,15);receipt.gengCurrentSuccessorRegression[mode]='PASS';}
 const pack=structuredClone(audit.pack);Object.assign(pack.natal,facts);pack.authorityDigest=await digest({natal:pack.natal,globalVerdict:pack.globalVerdict,sections:pack.sections,boundaries:pack.boundaries});delete pack.digest;pack.digest=await digest(pack);
 const original=read(v2.modes.BILINGUAL.path);
 for(const id of ['D05','D10']){const diagram=enrichBaziDiagram(structuredClone(original.technical.diagrams.find(d=>d.id===id)),pack);receipt.customerTopology[id]={expectedNodes:id==='D05'?['year','month','day','hour']:['day','hidden0','hidden1','hidden2'],expectedEdges:id==='D05'?['year>month']:['day>hidden0','day>hidden1','day>hidden2'],actualIrNodes:diagram.graph.nodes.map(n=>n.id),actualIrEdges:diagram.graph.edges.map(e=>e.from+'>'+e.to),renderedNodes:null,renderedEdges:null,status:id==='D05'?'AUTHORITY_PRESENT_GRAPH_DROPPED':'PASS_IR_ONLY'};}
 // Reference prose is only a bounded compiler compatibility probe, never customer material.
 const probe=structuredClone(snapshot);probe.authorityDigest=pack.authorityDigest;probe.timingDigest=pack.timingDigest;probe.realityDigest=pack.realityDigest;probe.fixture=true;probe.reviewSource='P7R3D_COMPILER_COMPATIBILITY_PROBE_NOT_CUSTOMER_MATERIAL';delete probe.digest;probe.digest=await digest(probe);
 try{await compileBaziDeepPublication({snapshot:probe,pack,presentationMode:'BILINGUAL',recomposePass:0});receipt.compileAfterProjection='PASS';}
 catch(e){receipt.compileAfterProjection={status:'FAIL',message:e.message,stack:e.stack};receipt.remainingBlocker={code:'D15_CANONICAL_RELATION_CONSUMER_SCHEMA_INCOMPATIBLE',owner:'functions/personal-reading/publication-fit/bazi-diagram-fidelity.js',diagram:'D15',expression:'r.branches.join',canonicalRelationType:pack.natal.relationships[0].type,canonicalRecordHasBranches:Object.hasOwn(pack.natal.relationships[0],'branches'),requiredScope:'D15 canonical relationship display compatibility',authorizationBoundary:'Attachment section 11: Do not change other diagrams.',message:e.message};receipt.status='BLOCKED_SCOPE';}
 assert.equal(receipt.status,'BLOCKED_SCOPE','REVIEW_NEXT_STAGE_REQUIRED');
}catch(error){receipt.status='FAILED';receipt.remainingBlocker={message:error.message,stack:error.stack};throw error;}finally{
 receipt.afterSha256=Object.fromEntries(owners.map(p=>[p,sha(p)]));receipt.ownersChanged=owners.filter(p=>before.owners[p]!==receipt.afterSha256[p]);receipt.baselineV2Unchanged=sha(dir+'BAZI-R2-CURRENT-PRODUCTION-PUBLICATION-BASELINE-V2.json')===freeze.baselineV2Sha256;receipt.protectedFileDrift=Object.entries(freeze.hashes).filter(([p,h])=>p!==owners[0]&&sha(p)!==h).map(([p])=>p);receipt.protectedFilesUnchanged=receipt.protectedFileDrift.length===0;write('P7R3D-CUSTOMER-NATIVE-AUTHORITY-TOPOLOGY.json',receipt);assert(receipt.protectedFilesUnchanged);
}
console.log(JSON.stringify({status:receipt.status,authorityProjection:receipt.authorityProjection,geng:receipt.gengCurrentSuccessorRegression,blocker:receipt.remainingBlocker},null,2));
process.exitCode=receipt.status==='BLOCKED_SCOPE'?2:0;
