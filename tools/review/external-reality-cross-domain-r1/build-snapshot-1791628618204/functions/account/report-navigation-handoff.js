import {personIdentity} from './canonical-person-store.js';
import {openOwnedMethodReport} from './method-report-delivery.js';
import {createReportGenerationStore} from '../personal-reading/report-generation-store.js';
import {reportNavigationProjection} from '../report-delivery/customer-report-artifact.js';
import {commerceEnvironment} from '../commerce/commerce-environment.js';
import {digest} from './oidc-auth.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
export async function saveReportNavigationHandoff(context,body){
 if(!['local','qa','preview'].includes(context.env.PHIOS_ENVIRONMENT))fail('REPORT_NAVIGATION_NOT_ADMITTED');
 const owner=personIdentity(context).userId;
 if(!body||Object.keys(body).some(k=>!['reportId','requestId','acceptInterpretiveContext','decisionObject','humanConfirmsDecisionObject'].includes(k))||body.acceptInterpretiveContext!==true||!/^[-a-zA-Z0-9_]{16,100}$/.test(body.requestId||''))fail('REPORT_NAVIGATION_EXPLICIT_ACCEPTANCE_REQUIRED');
 if(body.decisionObject!=null&&(typeof body.decisionObject!=='string'||!body.decisionObject.trim()||body.decisionObject.length>2000||body.humanConfirmsDecisionObject!==true))fail('NAVIGATION_HUMAN_DECISION_CONFIRMATION_REQUIRED');
 const {candidate,artifact}=await openOwnedMethodReport(context,body.reportId);if(!artifact)fail('REPORT_CANONICAL_ARTIFACT_REQUIRED');
 const binding=candidate.paidReportBinding;if(!binding||binding.ownerAccountId!==owner)fail('REPORT_UNAVAILABLE');
 const projection=reportNavigationProjection(artifact),accepted={sourceArtifactId:artifact.reportArtifactId,projectionVersion:projection.projectionVersion,acceptedContext:projection,userDecisionObject:body.decisionObject||null,humanConfirmedDecision:body.decisionObject!=null,currentRealityRefs:[],createdAt:new Date().toISOString(),requestId:body.requestId};
 const requestDigest=await digest(JSON.stringify(body)),store=await createReportGenerationStore(context.env,{...binding,environment:commerceEnvironment(context.env)},{scope:'delivery'});
 return store.withLock('navigation-handoff',async()=>{const key=`navigation:${body.requestId}`,prior=await store.get(key);if(prior){if(prior.requestDigest!==requestDigest)fail('NAVIGATION_HANDOFF_IDEMPOTENCY_CONFLICT');return {...prior.handoff,providerCalls:0,cacheHit:true};}await store.putIfAbsent(key,{requestDigest,handoff:accepted});return {...accepted,providerCalls:0,cacheHit:false};});
}
