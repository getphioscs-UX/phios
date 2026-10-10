import {digest,deepFreeze} from '../personal-reading/deep-manuscript/bazi-deep-manuscript-contract.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
export const CUSTOMER_ARTIFACT_VERSION='CUSTOMER_REPORT_ARTIFACT_V1';
export async function createCustomerReportArtifact(value){
 for(const k of ['reportArtifactId','customerId','personId','methodCode','productCode','entitlementId','inputDigest','authorityPackVersion','reportContentVersion','rendererVersion'])if(typeof value[k]!=='string'||!value[k])fail('CUSTOMER_ARTIFACT_IDENTITY_REQUIRED');
 if(!value.inputSnapshot||!value.calculationSnapshot||!value.publicationIR||!Array.isArray(value.generatedSections)||!value.generatedSections.length||!value.htmlSnapshotOrRenderState?.objectKey)fail('CUSTOMER_ARTIFACT_CONTENT_REQUIRED');
 const generatedCopy=structuredClone(value.generatedSections),contentDigest=await digest(generatedCopy);
 const {artifactDigest:priorDigest,...input}=structuredClone(value);
 const body={...input,schemaVersion:CUSTOMER_ARTIFACT_VERSION,generatedCopy,contentDigest,status:'FROZEN_CUSTOMER_COPY',pdfPolicy:'ON_DEMAND_DERIVATIVE',sharedAssetsEmbedded:false};
 if(JSON.stringify(body).includes('data:image/'))fail('CUSTOMER_ARTIFACT_EMBEDDED_ASSET_FORBIDDEN');
 body.sourceDigest=await digest({input:value.inputSnapshot,calculation:value.calculationSnapshot,authority:value.authorityPackVersion});
 return deepFreeze({...body,artifactDigest:await digest(body)});
}
export async function verifyCustomerReportArtifact(artifact,{customerId,reportArtifactId}={}){
 const {artifactDigest,...body}=artifact||{};
 if(body.schemaVersion!==CUSTOMER_ARTIFACT_VERSION||body.status!=='FROZEN_CUSTOMER_COPY'||body.customerId!==customerId||body.reportArtifactId!==reportArtifactId||await digest(body)!==artifactDigest||await digest(body.generatedCopy)!==body.contentDigest)fail('CUSTOMER_ARTIFACT_INTEGRITY_OR_OWNER_MISMATCH');
 return artifact;
}
export function reportNavigationProjection(artifact){
 return {schemaVersion:'REPORT_NAVIGATION_PROJECTION_V1',sourceArtifactId:artifact.reportArtifactId,projectionVersion:'1',contentDigest:artifact.contentDigest,interpretiveContext:artifact.generatedSections.map(s=>({sectionId:s.sectionId,sourceRef:`${artifact.reportArtifactId}#${s.sectionId}`,sourceClass:'REPORT_INTERPRETATION'})),possibleQuestions:[],valueCandidates:[],frictionCandidates:[],capacityQuestions:[],timingContext:artifact.calculationSnapshot?.timing||null,unknowns:['DECISION_OBJECT_NOT_CONFIRMED','CURRENT_REALITY_NOT_SUPPLIED'],authorityBoundary:'INTERPRETIVE_CONTEXT_ONLY',decisionObject:null,decisionAuthority:false,materialFact:false};
}
export function reportFollowupContext(artifact,question){
 if(typeof question!=='string'||!question.trim()||question.length>2000)fail('FOLLOWUP_QUESTION_INVALID');
 return {schemaVersion:'REPORT_FOLLOWUP_CONTEXT_V1',reportArtifactId:artifact.reportArtifactId,contentDigest:artifact.contentDigest,question,facts:{sourceClass:'REPORT_FACT',inputSnapshot:artifact.inputSnapshot,calculationSnapshot:artifact.calculationSnapshot},interpretations:{sourceClass:'REPORT_INTERPRETATION',sections:artifact.generatedCopy},currentReality:{sourceClass:'CURRENT_REALITY',state:'UNKNOWN'},userReported:{sourceClass:'USER_REPORTED',question},unknown:{sourceClass:'UNKNOWN',decisionObject:null},regenerateReport:false};
}
