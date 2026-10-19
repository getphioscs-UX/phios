import {evaluateCapability,FEATURES,INITIAL_REGISTRY,projectCapabilityDecision} from './financial-capability-decision.js';
import {loadOwnedDraft} from '../../account/financial-will-draft-store.js';
import {validateToolScenarios} from '../../financial/calculation-runtime/customer-finance-tools.js';
const fail=code=>{throw Object.assign(new Error(code),{code,status:422});};
export async function readOwnerRegistry(context,path){const response=await context.env.ASSETS.fetch(new Request(new URL(path,context.request.url)));if(!response.ok)fail('OWNER_REGISTRY_UNAVAILABLE');const data=await response.json();if(JSON.stringify(data).includes('TEST_ONLY'))fail('TEST_REGISTRY_FORBIDDEN');return data;}
export async function evaluateFinancialCapabilities(context,{savedDraftRef}={}){
 const ref=savedDraftRef;if(!ref||!Number.isInteger(ref.version))fail('SAVED_DRAFT_REFERENCE_REQUIRED');
 const source=await loadOwnedDraft(context,{draftId:ref.draftId,version:ref.version,expectedRef:ref,kind:'FINANCIAL'});
 const jurisdiction=await readOwnerRegistry(context,'/content/legal/will/registries/will-jurisdiction-registry-v1.json');
 const clauses=await readOwnerRegistry(context,'/content/legal/will/registries/will-clause-registry-v1.json');
 const binding=await readOwnerRegistry(context,'/content/financial/product-activation/registries/financial-preparation-capability-bindings-v1.json');
 // Admission cannot be inferred from the existence of reference templates or clauses.
 const admittedWill=(jurisdiction.jurisdictions||[]).filter(x=>x.willAssemblyProductionEnabled===true&&x.approvedClauseBundleVersion&&x.approvedExecutionRequirementVersion&&x.legalAuthoritySource);
 const bundles=(binding.bundles||[]).filter(b=>b.kind!=='WILL'||admittedWill.some(j=>j.approvedClauseBundleVersion===b.version)&&(clauses.clauses||[]).filter(c=>b.approvedClauseIds?.includes(c.clauseId)).length===b.approvedClauseIds?.length);
 const registry={...INITIAL_REGISTRY,id:binding.registryCode,environment:'PRODUCTION_OWNER',bundles};
 const instant=new Date().toISOString(),asOfDate=instant.slice(0,10),facts={...(source.payload.jurisdictionProfile||{}),profileRevision:source.savedDraftRef.sourceRef};
 let math=false;try{if(Object.keys(source.payload.toolScenarios||{}).length){validateToolScenarios(source.payload.toolScenarios);math=true;}}catch{}
 const runtime={features:Object.fromEntries(Object.values(FEATURES).map(feature=>[feature,{integration:['BASIC_PREPARATION','PURE_MATH','WILL_PREPARATION'].includes(feature)?'INTEGRATED':'NOT_INTEGRATED',contractVersion:'FINANCE-PREPARATION-R1'}]))};
 const evidence={mathInputsValidated:math,mathModelVersionBound:math,taxInputsValidated:false,reportSourceValidated:true,reportContractBound:false};
 const decisions=Object.values(FEATURES).map(feature=>projectCapabilityDecision(evaluateCapability({feature,facts,evidence,runtime,registry,asOfDate,asOfInstant:instant,evaluationMode:'PRODUCTION'})));
 return {source:source.savedDraftRef,evaluatedAt:instant,decisions,authorizationReusable:false,productionWrite:false};
}
