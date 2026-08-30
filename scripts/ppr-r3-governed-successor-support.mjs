import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const ECR='content/embodied-configuration/ecr-customer-mandala-authority-audit-v1.json';
const W10A='content/professional/personal-reality/r3/authority/ppr-r3-w10a-ast-target-context-shared-input-successor-v1.json';
const W10B='content/professional/personal-reality/r3/authority/ppr-r3-w10b-product-assembly-successor-reconciliation-v1.json';
const R4V1='content/professional/personal-reality/r4/authority/ppr-r4-method-input-successor-freeze-v1.json';
const R4V2='content/professional/personal-reality/r4/authority/ppr-r4-ast-target-context-input-successor-v2.json';
const CURRENT='content/professional/personal-reality/r4/authority/ppr-r4-current-main-shared-successor-reconciliation-7c61264-v1.json';
const R5='content/professional/personal-reality/r5/authority/ppr-r5-editorial-successor-v1.json';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const optional=p=>fs.existsSync(p)?j(p):null;
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const allFalse=o=>Object.values(o||{}).every(v=>v===false);

function retirement(path){
 const ecr=optional(ECR);return ecr?.baselineRetiredFiles?.[path]||null;
}
export function assertPprR3RetiredPath(path,label='PPR-R3'){
 const r=retirement(path);assert(r,`${label} missing governed retirement witness: ${path}`);
 assert.equal(r.state,'ABSENT_ON_BASELINE',`${label} retirement state mismatch: ${path}`);
 assert.equal(r.baselineFactOnly,true,`${label} retirement must remain a baseline fact: ${path}`);
 assert.equal(r.createsRetirementAuthority,false,`${label} retirement must not create authority: ${path}`);
 assert.equal(fs.existsSync(path),false,`${label} retired path unexpectedly restored: ${path}`);
 for(const witness of r.replacementWitnesses||[])assert(fs.existsSync(witness),`${label} retirement witness missing: ${witness}`);
 if(r.canonicalSurfaceWitness){
  const s=fs.readFileSync(r.canonicalSurfaceWitness,'utf8');
  assert.doesNotMatch(s,/from ['"]\.\/single-method-reading\.js['"]/,`${label} retired renderer import restored`);
  assert.match(s,/renderProductRoute/,`${label} canonical product route missing`);
 }
 return r;
}
function edge(path,from,to,kind,validate){return from&&to?{path,from,to,kind,validate}:null}
function edgesFor(path){
 const edges=[];
 const ecr=optional(ECR),w10a=optional(W10A),w10b=optional(W10B),r4v1=optional(R4V1),r4v2=optional(R4V2),current=optional(CURRENT),r5=optional(R5);
 const ep=ecr?.protectedSuccessors?.[path];if(ep)edges.push(edge(path,ep.predecessorSha256,ep.successorSha256,'ECR',()=>{
  const allowed={
   'perspectives/personal/index.html':'ECR_BRAND_ASSET_CORRECTION_ONLY',
   'assets/customer-ui/js/surfaces/personal-reality.js':'BASELINE_RETIRED_RENDERER_DANGLING_IMPORT_REMOVAL_ONLY',
   'functions/personal-reality-product/product-assembly.js':'ECR_MANDALA_PROJECTION_WIRING_ONLY'
  };assert.equal(ep.changeClass,allowed[path],`ECR successor class mismatch: ${path}`);if(path.endsWith('product-assembly.js'))assert.equal(ep.forbiddenAuthorityCreation,true);
 }));
 const wa=w10a?.authorizedFiles?.[path];if(wa)edges.push(edge(path,wa.predecessorSha256,wa.successorSha256,'PPR-R3-W10A',()=>{
  for(const k of ['createsMeaning','createsCalculation','createsProjection','createsCurrentReality'])assert.equal(wa[k],false,`W10A ${k} must stay false: ${path}`);
  assert.equal(allFalse(w10a.boundaries),true,'W10A boundary changed');
 }));
 const rv1=r4v1?.sharedFileSuccessorProof?.[path];if(rv1)edges.push(edge(path,rv1.predecessorSha256,rv1.successorSha256,'PPR-R4-v1',()=>{
  assert.equal(rv1.changeClass,'PPR_R4_METHOD_INPUT_EXTENSION_ONLY',`PPR-R4 v1 class mismatch: ${path}`);
  assert.equal(r4v1.boundaries?.pprR3SpecialistRendererAuthorityReplaced,false);
 }));
 const cr=current?.currentSharedProof?.[path];if(cr)edges.push(edge(path,cr.predecessorSha256,cr.currentSha256,'CURRENT-MAIN-RECONCILIATION',()=>{
  assert.equal(current.status,'CURRENT_MAIN_SHARED_SUCCESSOR_RECONCILED');
  assert.equal(cr.changeClass,'CURRENT_MAIN_PERSONAL_REALITY_MARKUP_SUCCESSOR_RECONCILIATION_ONLY');
  assert.equal(cr.runtimeMutationByThisReconciliation,false);assert.equal(cr.futureDriftAuthorized,false);
  assert.equal(allFalse(current.boundaries),true,'current-main reconciliation boundary changed');
  if(path==='perspectives/personal/index.html'){
   const html=fs.readFileSync(path,'utf8');assert.match(html,/rel="canonical" href="\/perspectives\/personal\/"/);assert.match(html,/data-cx-personal-form/);assert.match(html,/data-ppr-r4-method-input-mount/);
  }
 }));
 const r5p=r5?.sharedFileSuccessorProof?.[path];if(r5p)edges.push(edge(path,r5p.predecessorSha256,r5p.successorSha256,'PPR-R5',()=>{
  assert.equal(r5.status,'EDITORIAL_SUCCESSOR_IMPLEMENTED','PPR-R5 successor status changed');
  assert.equal(r5.canonicalRoute,'/perspectives/personal/','PPR-R5 canonical route changed');
  assert.equal(r5p.changeClass,'PPR_R5_EDITORIAL_SURFACE_SUCCESSOR',`PPR-R5 successor class mismatch: ${path}`);
  for(const k of ['createsMeaning','createsCalculation','createsProjection','replacesPprR3RendererAuthority','changesMethodInputSemantics','changesApiContract'])assert.equal(r5p[k],false,`PPR-R5 ${k} must stay false: ${path}`);
  assert.equal(allFalse(r5.boundaries),true,'PPR-R5 boundary changed');
 }));
 const rv2=r4v2?.sharedFileSuccessorProof?.[path];if(rv2)edges.push(edge(path,rv2.predecessorSha256,rv2.successorSha256,'PPR-R4-v2',()=>{
  assert.equal(r4v2.status,'ACTIVE_SUCCESSOR_RECONCILING_PPR_R4_WITH_AST_W10A');assert.equal(rv2.changeClass,'PPR_R4_METHOD_INPUT_EXTENSION_ONLY');assert.equal(allFalse(r4v2.boundaries),true,'PPR-R4 v2 boundary changed');
 }));
 if(w10b?.reconciledFile?.path===path){const x=w10b.reconciledFile;edges.push(edge(path,x.currentMainSha256,x.reconciledSha256,'PPR-R3-W10B',()=>{
  assert.equal(w10b.status,'AUTHORIZED_CONCURRENT_SUCCESSOR_RECONCILIATION_IMPLEMENTED');assert.equal(allFalse(w10b.boundaries),true,'W10B boundary changed');
  for(const token of x.requiredAstTransport||[])assert(fs.readFileSync(path,'utf8').includes(token),`W10B AST transport token missing: ${token}`);
  for(const token of x.requiredEcrMandala||[])assert(fs.readFileSync(path,'utf8').includes(token),`W10B ECR token missing: ${token}`);
 }));}
 return edges.filter(Boolean);
}
export function assertPprR3GovernedPath(path,predecessorSha,label='PPR-R3'){
 if(!fs.existsSync(path)){assertPprR3RetiredPath(path,label);return Object.freeze({state:'RETIRED',path});}
 const current=sha(path);if(current===predecessorSha)return Object.freeze({state:'UNCHANGED',path,current});
 const edges=edgesFor(path),q=[{digest:predecessorSha,chain:[]}],seen=new Set([predecessorSha]);
 while(q.length){const cur=q.shift();for(const e of edges.filter(x=>x.from===cur.digest)){
   e.validate();const chain=[...cur.chain,e.kind];if(e.to===current)return Object.freeze({state:'GOVERNED_SUCCESSOR',path,current,chain});
   if(!seen.has(e.to)){seen.add(e.to);q.push({digest:e.to,chain});}
  }}
 assert.fail(`${label} drift is not reachable through governed successor edges: ${path}; predecessor=${predecessorSha}; current=${current}; edges=${edges.map(e=>`${e.kind}:${e.from.slice(0,8)}→${e.to.slice(0,8)}`).join(',')}`);
}
export function assertPprR4AstInputSuccessorIntegrity(){
 const v2=j(R4V2),reg=j('content/professional/personal-reality/r4/registries/ppr-r4-method-input-registry-v2.json'),contract=j('content/professional/personal-reality/r4/contracts/ppr-r4-ast-target-context-input-extension-contract-v1.json');
 assert.equal(v2.status,'ACTIVE_SUCCESSOR_RECONCILING_PPR_R4_WITH_AST_W10A');assert.equal(reg.status,'ACTIVE');assert.equal(contract.status,'ACTIVE_METHOD_INPUT_SUCCESSOR_CONTRACT');assert.equal(allFalse(v2.boundaries),true);
 assert.equal(sha('assets/customer-ui/js/surfaces/personal-reality.js'),v2.sharedFileSuccessorProof['assets/customer-ui/js/surfaces/personal-reality.js'].successorSha256);
 assert.equal(sha('assets/customer-ui/js/personal-inputs/method-input-extension-registry.js'),v2.genericFileSuccessorProof['assets/customer-ui/js/personal-inputs/method-input-extension-registry.js'].successorSha256);
 assert.equal(sha('assets/customer-ui/js/specialists/ast/input-extension.js'),v2.methodOwnedFiles['assets/customer-ui/js/specialists/ast/input-extension.js']);
 assert.equal(sha('assets/customer-ui/surfaces/astrology-input-extension.css'),v2.methodOwnedFiles['assets/customer-ui/surfaces/astrology-input-extension.css']);
 assert.equal(sha(v2.unchangedApiWitness.path),v2.unchangedApiWitness.sha256);
 return Object.freeze({v2,reg,contract});
}
export default Object.freeze({assertPprR3GovernedPath,assertPprR3RetiredPath,assertPprR4AstInputSuccessorIntegrity});
