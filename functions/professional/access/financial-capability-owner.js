import {evaluateCapability,FEATURES,INITIAL_REGISTRY,projectCapabilityDecision} from './financial-capability-decision.js';
import {loadOwnedDraft} from '../../account/financial-will-draft-store.js';
import {validateToolScenarios} from '../../financial/calculation-runtime/customer-finance-tools.js';
import {ruleMaintenanceState} from '../../financial/professional-review/official-source-lifecycle.js';
const fail=code=>{throw Object.assign(new Error(code),{code,status:422});};
export async function readOwnerRegistry(context,path,{testOwner}={}){if(testOwner){if(context.env.PHIOS_ENVIRONMENT!=='local-test'||typeof testOwner.read!=='function')fail('TEST_REGISTRY_FORBIDDEN');return structuredClone(await testOwner.read(path));}const response=await context.env.ASSETS.fetch(new Request(new URL(path,context.request.url)));if(!response.ok)fail('OWNER_REGISTRY_UNAVAILABLE');const data=await response.json();if(JSON.stringify(data).includes('TEST_ONLY'))fail('TEST_REGISTRY_FORBIDDEN');return data;}
export async function evaluateFinancialCapabilities(context,{savedDraftRef}={},options={}){
 const ref=savedDraftRef;if(!ref||!Number.isInteger(ref.version))fail('SAVED_DRAFT_REFERENCE_REQUIRED');
 const source=await loadOwnedDraft(context,{draftId:ref.draftId,version:ref.version,expectedRef:ref,kind:'FINANCIAL'});
 const jurisdiction=await readOwnerRegistry(context,'/content/legal/will/registries/will-jurisdiction-registry-v1.json',options);
 const clauses=await readOwnerRegistry(context,'/content/legal/will/registries/will-clause-registry-v1.json',options);
 const binding=await readOwnerRegistry(context,'/content/financial/product-activation/registries/financial-preparation-capability-bindings-v1.json',options);
 // Admission cannot be inferred from the existence of reference templates or clauses.
 const admittedWill=(jurisdiction.jurisdictions||[]).filter(x=>x.willAssemblyProductionEnabled===true&&x.approvedClauseBundleVersion&&x.approvedExecutionRequirementVersion&&x.legalAuthoritySource);
 const bundles=(binding.bundles||[]).filter(b=>b.kind!=='WILL'||admittedWill.some(j=>j.approvedClauseBundleVersion===b.version)&&(clauses.clauses||[]).filter(c=>b.approvedClauseIds?.includes(c.clauseId)).length===b.approvedClauseIds?.length);
 const instant=new Date().toISOString();
 const registry={...INITIAL_REGISTRY,id:binding.registryCode,environment:options.testOwner?'TEST_ONLY':'PRODUCTION_OWNER',bundles:bundles.map(b=>{const state=ruleMaintenanceState(b,{now:instant,policy:binding.maintenancePolicy});return ['CURRENT','CURRENT_REVIEWED_CACHE'].includes(state)?b:{...b,sourceStatus:state};})};
 const asOfDate=instant.slice(0,10),facts={...(source.payload.jurisdictionProfile||{}),profileRevision:source.savedDraftRef.sourceRef};
 let math=false;try{if(Object.keys(source.payload.toolScenarios||{}).length){validateToolScenarios(source.payload.toolScenarios);math=true;}}catch{}
 const runtime={features:Object.fromEntries(Object.values(FEATURES).map(feature=>[feature,{integration:['BASIC_PREPARATION','PURE_MATH','WILL_PREPARATION'].includes(feature)?'INTEGRATED':'NOT_INTEGRATED',contractVersion:'FINANCE-PREPARATION-R1'}]))};
 if(options.testOwner&&binding.testRuntime)Object.assign(runtime.features,binding.testRuntime);
 const evidence={mathInputsValidated:math,mathModelVersionBound:math,taxInputsValidated:options.testOwner&&binding.testTaxInputsValidated===true,reportSourceValidated:true,reportContractBound:false};
 const decisions=Object.values(FEATURES).map(feature=>projectCapabilityDecision(evaluateCapability({feature,facts,evidence,runtime,registry,asOfDate,asOfInstant:instant,evaluationMode:options.testOwner?'TEST_ONLY':'PRODUCTION'})));
 return {source:source.savedDraftRef,evaluatedAt:instant,decisions,authorizationReusable:false,productionWrite:false};
}
export async function withFinancialCapability(context,request,operation,options={}){const evaluated=await evaluateFinancialCapabilities(context,request,options),decision=evaluated.decisions.find(d=>d.feature===request.feature);if(!decision||decision.status!=='READY')fail('CURRENT_FINANCIAL_CAPABILITY_REQUIRED');return operation({source:evaluated.source,decision,evaluatedAt:evaluated.evaluatedAt});}
