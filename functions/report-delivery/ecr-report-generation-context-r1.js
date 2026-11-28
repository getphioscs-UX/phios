import accepted from './ecr-accepted-editorial-source-r1.js';
import policy from '../../content/embodied-configuration/v4-1/semantic-admission-r2/composition-policy.json';
import evidence from '../../content/embodied-configuration/v4-1/semantic-admission-r2/operational-tag-evidence-r7-v1.json';
import {resolveEcrReusableModules} from '../embodied-configuration/ecr-semantic-composition-r2.js';
import {buildEcrDeepReadingR2} from '../ecr-full-report/ecr-deep-reading-r2.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {prepareOpenAIStructuredRequest} from '../personal-reading/narrative/narrative-provider.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};

// Source preparation only, using the original resolver and request builder.
// This does not dispatch, create an order, change a gate or admit a paid body.
export async function buildEcrReportGenerationContext({ir,subjectBinding,locale,sectionIds,explicitBackground=null}={}){
 if(!['zh-Hans','en'].includes(locale))fail('ECR_REPORT_LANGUAGE_REQUIRED');
 if(!subjectBinding?.ownerAccountId||!subjectBinding.personId||!Number.isSafeInteger(subjectBinding.personVersion)||subjectBinding.personVersion<1||!subjectBinding.inputDigest)fail('ECR_REPORT_SUBJECT_BINDING_REQUIRED');
 if(!Array.isArray(sectionIds)||!sectionIds.length||new Set(sectionIds).size!==sectionIds.length||sectionIds.some(id=>!/^SEC-(0[1-9]|10)$/.test(id)))fail('ECR_REPORT_SECTION_SCOPE_REQUIRED');
 const resolved=await resolveEcrReusableModules({ir,modules:accepted.modules,policy,tagEvidence:Array.isArray(evidence)?evidence:evidence.entries||evidence.evidence||evidence.records,locale,context:'BASELINE_CONFIGURATION_READING'});
 const native=buildEcrDeepReadingR2({ir,locale,reviewMode:true});
 const sections=sectionIds.map(sectionId=>{
  const section=native.sections.find(s=>s.id===sectionId.slice(4)&&!s.interactive);if(!section)fail('ECR_REPORT_NATIVE_SECTION_REQUIRED');
  const editorial=resolved.selected.filter(s=>accepted.modules.find(m=>m.moduleId===s.moduleId).sectionId===section.id).map(s=>{
   const m=accepted.modules.find(m=>m.moduleId===s.moduleId);
   return {...s,calculationDependencies:m.calculationDependencies,referenceUse:m.referenceUse,rightsScope:m.rightsScope,applicabilityConditions:m.applicabilityConditions};
  });
  // Missing applicable combination is a technical/source-scope result, not a
  // request for the Human to resubmit already supplied material.
  if(Number(section.id)>=4&&!editorial.length)fail('ECR_REPORT_APPROVED_MODULE_NOT_APPLICABLE_'+sectionId);
  return {sectionId,nativeSource:{semanticStatus:section.semanticStatus,content:section.semanticStatus==='SOURCE_PROJECTION'?section.content:null,sourceSections:section.predecessors},approvedConditionalEditorial:editorial,
   basisState:editorial.length?'FINITE_ACCEPTED_CONDITIONAL_EDITORIAL':'EXISTING_STRUCTURAL_SOURCE',nativeGateChanged:false};
 });
 const pack={version:'ECR-REPORT-CONDITIONAL-SOURCE-CONTEXT-R1',subjectBinding,locale,sourceConfigurationId:ir.configurationId,sourceCalculationDigest:ir.initialization.calculationDigest,
  sourceConfigurationSHA256:await sha256Stable(ir),acceptedModulePackSHA256:await sha256Stable(accepted),interpretationContext:'BASELINE_CONFIGURATION_READING',sections,explicitBackground,
  boundaries:{originalGateLineAuthorshipClaimed:false,personalFactsInferred:false,customerPublishable:false,completePaidManuscript:false,paidFullReportContextAdmitted:false},providerCalls:0};
 return {...pack,digest:await sha256Stable(pack)};
}

export const ECR_REPORT_WRITER_PROMPT=`Write only the requested ECR report sections in the supplied language. Use only the current subject's calculated configuration, original structural source and selected accepted conditional editorial modules. Preserve Gate, Line, Driver, Layer, calculation dependencies, source coordinates and scope. Canon identity tags are not original Gate/Line author prose. Do not invent a missing meaning, expand a finite editorial acceptance into unrestricted PAID_FULL_REPORT authority, or transfer another subject's body. Explain the specific supplied configuration with connected paragraphs and explicit supportRefs. Separate calculation from symbolic interpretation, conditional applications and user-provided background. Do not infer personal experiences, emotions, motives, relationships, diagnoses or guaranteed results. Titles obey the same limits. Unknown remains Unknown with a concrete reason. Return the requested JSON only. No tools, searches, automatic retries or calculations.`;

export async function prepareEcrReportRequest({authorityPack,model,maxOutputTokens,schema}={}){
 const {digest,...body}=authorityPack||{};
 if(!digest||digest!==await sha256Stable(body))fail('ECR_REPORT_AUTHORITY_PACK_CHANGED');
 if(!model||typeof model!=='string'||!Number.isSafeInteger(maxOutputTokens)||maxOutputTokens<1||!schema)fail('ECR_REPORT_EXPLICIT_MODEL_PLAN_REQUIRED');
 return prepareOpenAIStructuredRequest({model,systemPrompt:ECR_REPORT_WRITER_PROMPT,userPayload:{authorityPack},schema,schemaName:'ecr_report_sections',maxOutputTokens});
}
