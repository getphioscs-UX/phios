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
 for(const path of Object.keys(current.sharedFileSuccessorProof||{}))assertPostR4SharedSuccessor(r4,current,path);
 for(const [path,proof] of Object.entries(current.unchangedR4SuccessorProof||{})){
  assert.equal(proof.remainsExactPprR4Successor,true);
  assert.equal(proof.sha256,r4.sharedFileSuccessorProof?.[path]?.successorSha256,`PPR-R4 unchanged successor record mismatch: ${path}`);
  assert.equal(proof.sha256,sha(path),`PPR-R4 unchanged successor drift: ${path}`);
 }
 return Object.freeze({recon,r4,w10a,current,postR4Proof:path=>current.sharedFileSuccessorProof?.[path]||null,w10aProof:path=>w10a.authorizedFiles?.[path]||null});
}
