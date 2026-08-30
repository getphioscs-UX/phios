import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const BASELINE='492ecdddc1f84e5a915f416c60c61ed23e4fcb7f';
const CURRENT_MAIN='7b7fe69c6fe72cee9e8205969e3d24c18cd98719';
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const read=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const shaText=text=>crypto.createHash('sha256').update(Buffer.from(text,'utf8')).digest('hex');
const R4_PATH='content/professional/personal-reality/r4/authority/ppr-r4-method-input-successor-freeze-v1.json';
const CURRENT_PATH='content/professional/personal-reality/r4/authority/ppr-r4-current-main-successor-reconciliation-v1.json';
const W10A_PATH='content/professional/personal-reality/r3/authority/ppr-r3-w10a-ast-target-context-shared-input-successor-v1.json';
const R5_PATH='content/professional/personal-reality/r5/authority/ppr-r5-editorial-successor-v1.json';
const R4V2_PATH='content/professional/personal-reality/r4/authority/ppr-r4-ast-target-context-input-successor-v2.json';
const R5_PROTECTED_RECON_PATH='content/professional/personal-reality/r5/authority/ppr-r5-protected-method-input-successor-reconciliation-v1.json';

function assertPostR4SharedSuccessor(r4,current,path){
 const proof=current?.sharedFileSuccessorProof?.[path];
 if(!proof)return null;
 const r4Proof=r4?.sharedFileSuccessorProof?.[path];
 assert(r4Proof,`PPR-R4 current successor has no predecessor proof: ${path}`);
 assert.equal(proof.predecessorSha256,r4Proof.successorSha256,`PPR-R4 current successor predecessor mismatch: ${path}`);
 assert.equal(proof.successorSha256,sha(path),`PPR-R4 current successor digest drift: ${path}`);
 assert.equal(proof.replacesPprR3RendererAuthority,false,`PPR-R4 current successor must not replace PPR-R3 renderer authority: ${path}`);
 assert.equal(proof.createsMeaning,false,`PPR-R4 current successor must not create meaning: ${path}`);
 assert.equal(proof.createsCalculation,false,`PPR-R4 current successor must not create calculation: ${path}`);
 assert.equal(proof.createsProjection,false,`PPR-R4 current successor must not create projection: ${path}`);
 if(proof.changeClass==='ECR_SCOPED_STYLESHEET_LINK_ONLY'){
  const text=read(path),line=`${proof.authorizedInsertedLine}\n`;
  assert.equal(text.split(proof.authorizedInsertedLine).length-1,1,`PPR-R4 ECR stylesheet successor must add exactly one governed link: ${path}`);
  assert.equal(proof.requiredStylesheet,'/assets/customer-ui/surfaces/ecr-specialist.css');
  assert.match(text,/\/assets\/customer-ui\/surfaces\/ecr-specialist\.css/);
  const reversed=text.replace(line,'');
  assert.equal(shaText(reversed),proof.predecessorSha256,`PPR-R4 ECR stylesheet successor contains changes beyond the admitted link: ${path}`);
 }
 return proof;
}

export function assertPprC1CurrentSuccessor(){
 const recon=readJson('content/customer-experience-rebuild/ppr-c1/audit/ppr-c1-current-main-reconciliation-492ecdd-v1.json');
 const r4=readJson(R4_PATH);
 const current=readJson(CURRENT_PATH);
 const w10a=readJson(W10A_PATH);
 const r5=fs.existsSync(R5_PATH)?readJson(R5_PATH):null;
 const r4v2=fs.existsSync(R4V2_PATH)?readJson(R4V2_PATH):null;
 const r5ProtectedRecon=fs.existsSync(R5_PROTECTED_RECON_PATH)?readJson(R5_PROTECTED_RECON_PATH):null;
 assert.equal(recon.baselineCommit,BASELINE);
 assert.equal(recon.status,'RECONCILED_TO_CURRENT_SUCCESSOR_AUTHORITY');
 assert.equal(recon.canonical.route,'/perspectives/personal/');
 assert.equal(recon.canonical.api,'/api/customer-personal-reality');
 assert.equal(recon.canonical.liveSharedSingleMethodRenderer,null);
 assert.equal(fs.existsSync('assets/customer-ui/js/surfaces/single-method-reading.js'),false,'retired live generic renderer must stay absent');
 assert.equal(fs.existsSync(recon.canonical.nonLiveCompatibilityCopy),true,'non-live compatibility copy missing');
 const client=read('assets/customer-ui/js/surfaces/personal-reality.js');
 assert.doesNotMatch(client,/from ['"]\.\/single-method-reading\.js['"]/);
 assert.match(client,/renderProductRoute/);
 const productRenderers=read('assets/customer-ui/js/personal-products/personal-product-renderers.js');
 const registry=read('assets/customer-ui/js/personal-products/specialist-renderer-registry.js');
 assert.match(productRenderers,/mountApprovedSpecialistRenderer/);
 assert.match(registry,/PPR_R3_BAZI_PRODUCT_V1/);
 assert.equal(r4.baselineCommit,BASELINE);
 assert.equal(r4.status,'ACTIVE_SUCCESSOR_OF_PPR_R3_INPUT_BOUNDARY');
 assert.equal(r4.boundaries.pprR3SpecialistRendererAuthorityReplaced,false);
 assert.equal(w10a.status,'AUTHORIZED_SHARED_INPUT_SUCCESSOR_IMPLEMENTED');
 assert.equal(w10a.predecessorFreeze,'content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json');
 assert.equal(w10a.boundaries.historicalFreezeRecordRewritten,false);
 for(const [path,proof] of Object.entries(w10a.authorizedFiles||{})){
  assert.equal(proof.createsMeaning,false,`PPR-R3 W10A successor must not create meaning: ${path}`);
  assert.equal(proof.createsCalculation,false,`PPR-R3 W10A successor must not create calculation: ${path}`);
  assert.equal(proof.createsProjection,false,`PPR-R3 W10A successor must not create projection: ${path}`);
  assert.equal(proof.createsCurrentReality,false,`PPR-R3 W10A successor must not create current Reality: ${path}`);
 }
 assert.equal(current.currentMainCommit,CURRENT_MAIN);
 assert.equal(current.status,'CURRENT_MAIN_SUCCESSOR_CHAIN_RECONCILED');
 assert.equal(current.predecessorAuthority,R4_PATH);
 assert.equal(current.historicalRecordsRewritten,false);
 assert.equal(current.boundaries.historicalPprR4FreezeMutated,false);
 assert.equal(current.boundaries.sharedPprRendererSemanticsChanged,false);
 if(r5){
  assert.equal(r5.baselineCommit,'ffb6e102bd3bccf02d2fb620df68561e98ba4b9f');
  assert.equal(r5.status,'EDITORIAL_SUCCESSOR_IMPLEMENTED');
  assert.equal(r5.predecessorAuthority,CURRENT_PATH);
 }
 for(const [path,historicalProof] of Object.entries(current.sharedFileSuccessorProof||{})){
  const editorialProof=r5?.sharedFileSuccessorProof?.[path]||null;
  if(editorialProof){
   assert.equal(editorialProof.predecessorSha256,historicalProof.successorSha256,`PPR-R5 predecessor mismatch: ${path}`);
   assert.equal(editorialProof.successorSha256,sha(path),`PPR-R5 successor digest drift: ${path}`);
   assert.equal(editorialProof.changeClass,'PPR_R5_EDITORIAL_SURFACE_SUCCESSOR',`PPR-R5 successor class mismatch: ${path}`);
   assert.equal(editorialProof.createsMeaning,false,`PPR-R5 must not create meaning: ${path}`);
   assert.equal(editorialProof.createsCalculation,false,`PPR-R5 must not create calculation: ${path}`);
   assert.equal(editorialProof.createsProjection,false,`PPR-R5 must not create projection: ${path}`);
   assert.equal(editorialProof.replacesPprR3RendererAuthority,false,`PPR-R5 must not replace PPR-R3 renderer authority: ${path}`);
  }else assertPostR4SharedSuccessor(r4,current,path);
 }
 for(const [path,proof] of Object.entries(current.unchangedR4SuccessorProof||{})){
  assert.equal(proof.remainsExactPprR4Successor,true);
  assert.equal(proof.sha256,r4.sharedFileSuccessorProof?.[path]?.successorSha256,`PPR-R4 unchanged successor record mismatch: ${path}`);
  const liveSha=sha(path);
  if(liveSha===proof.sha256)continue;
  const v2Proof=r4v2?.sharedFileSuccessorProof?.[path]||null;
  assert(v2Proof,`PPR-R4 unchanged historical witness requires a governed later successor: ${path}`);
  assert.equal(r4v2.status,'ACTIVE_SUCCESSOR_RECONCILING_PPR_R4_WITH_AST_W10A');
  assert.equal(v2Proof.predecessorSha256,proof.sha256,`PPR-R4 v2 predecessor mismatch: ${path}`);
  assert.equal(v2Proof.successorSha256,liveSha,`PPR-R4 v2 successor digest drift: ${path}`);
  assert.equal(v2Proof.changeClass,'PPR_R4_METHOD_INPUT_EXTENSION_ONLY',`PPR-R4 v2 successor class mismatch: ${path}`);
  const reconciliation=r5ProtectedRecon?.protectedFileReconciliation?.[path]||null;
  assert(reconciliation,`PPR-R5 protected witness reconciliation missing: ${path}`);
  assert.equal(r5ProtectedRecon.status,'HISTORICAL_STALE_PROTECTED_WITNESS_RECONCILED_TO_PREEXISTING_R4V2');
  assert.equal(reconciliation.historicalPprR5ProtectedSha256,proof.sha256,`PPR-R5 historical protected witness mismatch: ${path}`);
  assert.equal(reconciliation.r4v2PredecessorSha256,v2Proof.predecessorSha256,`PPR-R5/R4v2 predecessor reconciliation mismatch: ${path}`);
  assert.equal(reconciliation.r4v2SuccessorSha256,v2Proof.successorSha256,`PPR-R5/R4v2 successor reconciliation mismatch: ${path}`);
  assert.equal(reconciliation.currentMainSha256,liveSha,`PPR-R5 current protected successor drift: ${path}`);
  assert.equal(reconciliation.newRuntimeMutationByThisReconciliation,false,`PPR-R5 reconciliation must not create a runtime mutation: ${path}`);
 }
 if(r5){
  for(const [path,proof] of Object.entries(r5.addedFiles||{})){
   assert(fs.existsSync(path),`PPR-R5 added file missing: ${path}`);
   assert.equal(proof.sha256,sha(path),`PPR-R5 added file digest drift: ${path}`);
   assert.equal(proof.changesRuntimeBehavior,false,`PPR-R5 editorial file must not change runtime behavior: ${path}`);
  }
  for(const [path,proof] of Object.entries(r5.protectedFiles||{})){
   assert.equal(proof.mustRemainUnchanged,true,`PPR-R5 protected file contract missing: ${path}`);
   const liveSha=sha(path);
   if(liveSha===proof.sha256)continue;
   const reconciliation=r5ProtectedRecon?.protectedFileReconciliation?.[path]||null;
   const v2Proof=r4v2?.sharedFileSuccessorProof?.[path]||null;
   assert(reconciliation&&v2Proof,`PPR-R5 protected file drift lacks governed reconciliation: ${path}`);
   assert.equal(proof.owner,'PPR-R4_METHOD_INPUT_SUCCESSOR',`PPR-R5 protected owner changed: ${path}`);
   assert.equal(reconciliation.historicalPprR5ProtectedSha256,proof.sha256,`PPR-R5 protected predecessor mismatch: ${path}`);
   assert.equal(v2Proof.predecessorSha256,proof.sha256,`PPR-R4 v2 must descend from the PPR-R5 protected witness: ${path}`);
   assert.equal(v2Proof.successorSha256,liveSha,`PPR-R4 v2 current protected successor drift: ${path}`);
   assert.equal(reconciliation.currentMainSha256,liveSha,`PPR-R5 protected reconciliation current digest drift: ${path}`);
  }
 }
 return Object.freeze({recon,r4,w10a,current,r5,r4v2,r5ProtectedRecon,postR4Proof:path=>{const r5Proof=r5?.sharedFileSuccessorProof?.[path]||null;if(!r5Proof)return current.sharedFileSuccessorProof?.[path]||null;const r4Proof=r4?.sharedFileSuccessorProof?.[path]||null;return Object.freeze({...r5Proof,predecessorSha256:r4Proof?.successorSha256||r5Proof.predecessorSha256,successorSha256:r5Proof.successorSha256,successorChain:[current.sharedFileSuccessorProof?.[path]||null,r5Proof].filter(Boolean)});},historicalPostR4Proof:path=>current.sharedFileSuccessorProof?.[path]||null,w10aProof:path=>w10a.authorizedFiles?.[path]||null});
}
