import crypto from 'node:crypto';
import {ECR_HD_COMPARISON_IR_VERSION} from './ecr-human-design-comparison-ir.js';

export const ECR_HD_REALITY_BRIDGE_IR_VERSION='PHI-OS-ECR-R3-ECR-HD-REALITY-BRIDGE-IR-v1.0.0';
export const ECR_HD_REALITY_BRIDGE_RULE_VERSION='PHI-OS-ECR-R3-ECR-HD-REALITY-BRIDGE-RULES-v1.0.0';
export const ECR_HD_REALITY_BRIDGE_RESPONSE_VERSION='PHI-OS-ECR-R3-ECR-HD-REALITY-BRIDGE-RESPONSE-v1.0.0';

const RESPONSE_OPTIONS=Object.freeze([
  Object.freeze({code:'REPEATS_RELIABLY',en:'Repeats reliably',zhHans:'会稳定重复'}),
  Object.freeze({code:'CONTEXT_DEPENDENT',en:'Depends on context',zhHans:'只在特定情境出现'}),
  Object.freeze({code:'NOT_CLEAR_YET',en:'Not clear yet',zhHans:'现在还看不出来'}),
  Object.freeze({code:'CONTRADICTS_READING',en:'Contradicts this reading',zhHans:'现实经验与这份读取不符合'})
]);
const RESPONSE_CODES=new Set(RESPONSE_OPTIONS.map(item=>item.code));
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const list=value=>Array.isArray(value)?value:[];
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const localeOf=value=>value==='zh-Hans'?'zh-Hans':'en';
const clean=value=>String(value??'').trim();
function fail(code,details={}){throw Object.assign(new TypeError(code),{code,...details})}
function validComparison(comparison){
  return Boolean(
    comparison?.schemaVersion===ECR_HD_COMPARISON_IR_VERSION&&
    comparison?.publicationState==='COMPARISON_IR_READY'&&
    comparison?.comparisonDigest&&
    comparison?.boundaries?.comparisonIrCreated===true&&
    comparison?.boundaries?.ecrRemainsPhiOsNative===true&&
    comparison?.boundaries?.humanDesignRemainsCustomerSuppliedExternalContext===true&&
    comparison?.boundaries?.directFieldEquivalenceCreated===false&&
    comparison?.boundaries?.methodAgreementClaimed===false&&
    comparison?.boundaries?.compatibilityScoreCreated===false&&
    comparison?.boundaries?.currentRealityEvidenceCreated===false&&
    comparison?.boundaries?.currentRealityConclusionCreated===false
  );
}
function responseOptions(locale){const zh=locale==='zh-Hans';return freeze(RESPONSE_OPTIONS.map(item=>freeze({code:item.code,label:zh?item.zhHans:item.en})))}
function promptOf(dimension,index){
  if(!dimension||dimension.status==='NO_SOURCE_MATERIAL'||!clean(dimension.observationQuestion))return null;
  return freeze({
    promptId:`ECR-HD-RB-${clean(dimension.dimensionId)||String(index+1)}`,
    dimensionId:clean(dimension.dimensionId)||`DIMENSION_${index+1}`,
    label:clean(dimension.label)||clean(dimension.dimensionId)||`Dimension ${index+1}`,
    relationClass:clean(dimension.relationClass)||null,
    comparisonStatus:clean(dimension.status)||null,
    observationQuestion:clean(dimension.observationQuestion),
    comparisonStatement:clean(dimension.comparisonStatement)||null,
    sourceLineage:freeze({
      ecrInterpretationUnitRefs:freeze(list(dimension?.ecr?.interpretationUnitRefs).filter(Boolean)),
      humanDesignClaimRefs:freeze(list(dimension?.humanDesign?.claimRefs).filter(Boolean))
    })
  });
}
export function buildEcrHumanDesignRealityBridgeIR({comparisonIr,locale='en'}={}){
  if(!validComparison(comparisonIr))fail('ECR_HD_REALITY_BRIDGE_GOVERNED_COMPARISON_REQUIRED');
  const l=localeOf(locale||comparisonIr.locale);
  const prompts=freeze(list(comparisonIr.dimensions).map(promptOf).filter(Boolean));
  if(!prompts.length)fail('ECR_HD_REALITY_BRIDGE_PROMPT_REQUIRED');
  const seed=freeze({
    schemaVersion:ECR_HD_REALITY_BRIDGE_IR_VERSION,
    ruleVersion:ECR_HD_REALITY_BRIDGE_RULE_VERSION,
    state:'OBSERVATION_BRIDGE_READY',
    locale:l,
    sourceComparisonDigest:comparisonIr.comparisonDigest,
    sourceComparisonRuleVersion:comparisonIr.comparisonRuleVersion||null,
    prompts,
    responseOptions:responseOptions(l),
    boundaries:freeze({
      bridgeCreatesMeaning:false,
      bridgeCreatesFieldMapping:false,
      bridgeCreatesAgreementClaim:false,
      bridgeCreatesCompatibilityScore:false,
      observationPromptOnly:true,
      currentRealityEvidenceCreated:false,
      currentRealityConclusionCreated:false,
      currentRealityFactPromoted:false,
      userResponseRequiredBeforeReportedContext:true,
      userResponseIsReportedContextNotEvidence:true,
      contradictionMustRemainVisible:true,
      automaticPersistence:false,
      runtimeMemoryWritten:false
    })
  });
  return freeze({...seed,bridgeDigest:digest(seed)});
}
export function validateEcrHumanDesignRealityBridgeResponse(response,{bridgeIr}={}){
  if(response==null)return null;
  if(response?.schemaVersion!==ECR_HD_REALITY_BRIDGE_RESPONSE_VERSION)fail('ECR_HD_REALITY_BRIDGE_RESPONSE_SCHEMA_INVALID');
  if(!bridgeIr||bridgeIr?.schemaVersion!==ECR_HD_REALITY_BRIDGE_IR_VERSION)fail('ECR_HD_REALITY_BRIDGE_IR_REQUIRED_FOR_RESPONSE');
  if(response.bridgeDigest!==bridgeIr.bridgeDigest||response.sourceComparisonDigest!==bridgeIr.sourceComparisonDigest)fail('ECR_HD_REALITY_BRIDGE_RESPONSE_LINEAGE_MISMATCH');
  const prompts=new Map(bridgeIr.prompts.map(item=>[item.promptId,item]));
  const entries=list(response.entries).map(entry=>{
    const prompt=prompts.get(clean(entry?.promptId));
    const responseCode=clean(entry?.responseCode);
    if(!prompt||!RESPONSE_CODES.has(responseCode))fail('ECR_HD_REALITY_BRIDGE_RESPONSE_ENTRY_INVALID');
    return freeze({promptId:prompt.promptId,dimensionId:prompt.dimensionId,responseCode,note:clean(entry?.note).slice(0,240)||null});
  });
  if(!entries.length)return null;
  return freeze({
    schemaVersion:ECR_HD_REALITY_BRIDGE_RESPONSE_VERSION,
    bridgeDigest:bridgeIr.bridgeDigest,
    sourceComparisonDigest:bridgeIr.sourceComparisonDigest,
    entries:freeze(entries),
    boundaries:freeze({customerReported:true,realityEvidence:false,realityConclusion:false,perspectiveTruthClaim:false,automaticPersistence:false})
  });
}
export default Object.freeze({ECR_HD_REALITY_BRIDGE_IR_VERSION,ECR_HD_REALITY_BRIDGE_RULE_VERSION,ECR_HD_REALITY_BRIDGE_RESPONSE_VERSION,buildEcrHumanDesignRealityBridgeIR,validateEcrHumanDesignRealityBridgeResponse});
