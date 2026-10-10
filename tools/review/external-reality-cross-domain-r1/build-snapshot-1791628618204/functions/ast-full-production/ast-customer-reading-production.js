/** R2-W13–W16 AST customer-reading orchestration. Release gate remains fail-closed until final surface human acceptance + R3. */
import {buildAstProfessionalSemanticProjection} from './ast-professional-semantic-runtime.js';
import {buildAstWholeChartSynthesis} from './ast-whole-chart-synthesis-runtime.js';
import {buildAstCustomerReadingV2} from './ast-customer-reading-v2-runtime.js';
import {resolveAstCustomerIntent} from './ast-intent-responsive-composition.js';
import {buildAstGovernedTemporalReadingIR} from './ast-temporal-reading-adapter.js';
import {buildAstInteractiveWorkspace} from './ast-interactive-workspace-runtime.js';
import {buildAstCustomerProductProjectionV3} from './ast-customer-product-projection-v3.js';
import {buildAstCustomerExperienceProjectionV1} from './ast-customer-experience-projection-v1.js';
import {executeAstTransitRequest} from '../ast-transit/transit-runtime.js';
import {buildAstTransitMeaningBundle} from '../ast-transit/transit-meaning-runtime.js';
import {buildAstTransitReadingIR} from '../ast-transit/transit-reading-ir.js';
import {AST_R4_AUTHORITY,AST_R4_REGISTRIES,AST_R4A_CLAIMS,AST_R4A_ADMISSION,AST_MEANING_ONTOLOGY,AST_R5_COMPOSITION_RULES,AST_READER_LANGUAGE_REGISTRY,AST_READING_IA,AST_CONTENT_OWNERSHIP,AST_READING_LAYOUT,AST_INTENT_ROUTING_REGISTRY,AST_SURFACE_CUTOVER_GATE} from './ast-customer-reading-authority-v2.js';
import {AST_R2_METHOD_SCOPED_ADMISSION} from './ast-r2-production-admission-authority.js';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const list=v=>Array.isArray(v)?v:[];
function targetComplete(t){return Boolean(t?.targetDate&&t?.targetTime&&t?.targetTimezone?.iana&&t?.targetTimezone?.utcOffsetAtTarget)}
function readingSection(reading,id){return list(reading?.sections).find(x=>x.sectionId===id)}
const EFFECTIVE_AST_CUTOVER_GATE=Object.freeze({...AST_SURFACE_CUTOVER_GATE,surfaceCutoverActive:AST_R2_METHOD_SCOPED_ADMISSION.methodFlags?.AST===true&&AST_R2_METHOD_SCOPED_ADMISSION.customerCutoverAllowed===true,customerRuntimeUseAllowed:AST_R2_METHOD_SCOPED_ADMISSION.customerRuntimeUseAllowed===true,customerPublicationAllowed:AST_R2_METHOD_SCOPED_ADMISSION.customerPublicationAllowed===true,productionAllowed:AST_R2_METHOD_SCOPED_ADMISSION.productionAllowed===true,customerCutoverAllowed:AST_R2_METHOD_SCOPED_ADMISSION.customerCutoverAllowed===true,admissionSuccessor:'R2-W19'});

function buildIntentLensVariants({canonicalProjection,professionalSemanticProjection,locale,baseThemeRefs,sourceMainCommit}){
 const baseSet=new Set(baseThemeRefs),views=[];
 for(const [intentId,profile] of Object.entries(AST_INTENT_ROUTING_REGISTRY.profiles||{})){
  const intentResolution=resolveAstCustomerIntent({explicitProfileId:intentId,registry:AST_INTENT_ROUTING_REGISTRY});
  const synthesis=buildAstWholeChartSynthesis({canonicalProjection,professionalSemanticProjection,meaningOntology:AST_MEANING_ONTOLOGY,r4aClaims:AST_R4A_CLAIMS,r4aAdmission:AST_R4A_ADMISSION,compositionRules:AST_R5_COMPOSITION_RULES,locale,customerIntent:{intentId}});
  const reading=buildAstCustomerReadingV2({synthesis,professionalSemanticProjection,languageRegistry:AST_READER_LANGUAGE_REGISTRY,iaContract:AST_READING_IA,ownershipContract:AST_CONTENT_OWNERSHIP,layoutContract:AST_READING_LAYOUT,r4aAdmission:AST_R4A_ADMISSION,temporalIR:null,sourceMainCommit});
  const variantRefs=list(readingSection(reading,'CORE_THEMES')?.items).map(x=>x.themeRef).filter(ref=>baseSet.has(ref));
  const priorityThemeRefs=[...variantRefs,...baseThemeRefs.filter(ref=>!variantRefs.includes(ref))];
  const intentItem=list(readingSection(reading,'INTENT')?.items)[0]||null;
  views.push(freeze({intentId,label:profile?.label?.[locale]||profile?.label?.en||intentId,priorityThemeRefs,readerText:intentItem?.readerText||null,sourceRefs:list(intentItem?.sourceRefs),meaningChanged:intentResolution.meaningChanged===true}));
 }
 return freeze(views);
}

export function getAstCustomerWorkspaceCapability(){return freeze({schemaVersion:'PHI-OS-AST-CUSTOMER-WORKSPACE-CAPABILITY-v1.0.0',surfaceCutoverActive:EFFECTIVE_AST_CUTOVER_GATE.surfaceCutoverActive===true&&EFFECTIVE_AST_CUTOVER_GATE.customerCutoverAllowed===true,intentResponsiveCompositionAvailable:true,explicitTargetTimingAvailable:true,interactiveWorkspaceAvailable:true,professionalWholeChartReadingAvailable:true,customerExperienceProjectionAvailable:true,realityComparisonConsumerAvailable:true,requiresExplicitTargetContext:true});}
export async function buildAstCustomerWorkspaceCandidate({canonicalProjection,rawIntent='',explicitIntentProfileId=null,locale='en',targetContext=null,realityComparison=null,consentRecordId='ENGINEERING-CANDIDATE',sourceMainCommit='a06506cbbc9bf0bdd11ff1c740f7be65276d84d9',astronomyModuleLoader,cutoverGateOverride=null}={}){
 const intentResolution=resolveAstCustomerIntent({rawIntent,explicitProfileId:explicitIntentProfileId,registry:AST_INTENT_ROUTING_REGISTRY});
 const professionalSemanticProjection=buildAstProfessionalSemanticProjection({canonicalProjection,authority:AST_R4_AUTHORITY,registries:AST_R4_REGISTRIES});
 const synthesis=buildAstWholeChartSynthesis({canonicalProjection,professionalSemanticProjection,meaningOntology:AST_MEANING_ONTOLOGY,r4aClaims:AST_R4A_CLAIMS,r4aAdmission:AST_R4A_ADMISSION,compositionRules:AST_R5_COMPOSITION_RULES,locale,customerIntent:{intentId:intentResolution.intentId}});
 let temporalIR=null,astt=null;
 if(targetComplete(targetContext)){
  const transit=await executeAstTransitRequest({schemaVersion:'PHI-OS-AST-TRANSIT-EXECUTION-REQUEST-v1.0.0',requestId:`ASTW-${canonicalProjection.projectionId||'PROJECTION'}-${targetContext.targetDate}-${targetContext.targetTime}`,natalProjection:canonicalProjection,targetContext,consentRecordId},{astronomyModuleLoader});
  const meaningBundle=await buildAstTransitMeaningBundle({projection:transit.projection,locale});const transitReading=buildAstTransitReadingIR({projection:transit.projection,meaningBundle});
  temporalIR=buildAstGovernedTemporalReadingIR({projection:transit.projection,reading:transitReading,meaningBundle,languageRegistry:AST_READER_LANGUAGE_REGISTRY,locale});astt=freeze({projection:transit.projection,meaningBundle,reading:transitReading});
 }
 const reading=buildAstCustomerReadingV2({synthesis,professionalSemanticProjection,languageRegistry:AST_READER_LANGUAGE_REGISTRY,iaContract:AST_READING_IA,ownershipContract:AST_CONTENT_OWNERSHIP,layoutContract:AST_READING_LAYOUT,r4aAdmission:AST_R4A_ADMISSION,temporalIR,sourceMainCommit});
 const customerProductProjection=await buildAstCustomerProductProjectionV3({canonicalProjection,professionalSemanticProjection,synthesis,reading,intentResolution,languageRegistry:AST_READER_LANGUAGE_REGISTRY,temporalIR});
 const baseThemeRefs=list(customerProductProjection.keyConfigurations).map(x=>x.themeRef);
 const intentViews=buildIntentLensVariants({canonicalProjection,professionalSemanticProjection,locale:customerProductProjection.locale,baseThemeRefs,sourceMainCommit});
 const customerExperienceProjection=await buildAstCustomerExperienceProjectionV1({customerProductProjection,reading,intentViews,realityComparison});
 const workspaceGate=cutoverGateOverride||EFFECTIVE_AST_CUTOVER_GATE;
 const workspace=buildAstInteractiveWorkspace({canonicalProjection,reading,intentResolution,languageRegistry:AST_READER_LANGUAGE_REGISTRY,cutoverGate:workspaceGate,temporalIR,customerProductProjection,customerExperienceProjection});
 return freeze({schemaVersion:'PHI-OS-AST-CUSTOMER-WORKSPACE-CANDIDATE-BUNDLE-v1.0.0',intentResolution,professionalSemanticProjection,synthesis,temporalIR,astt,reading,customerProductProjection,customerExperienceProjection,workspace,cutoverGate:workspaceGate});
}
export async function maybeBuildActiveAstCustomerWorkspace(args={}){if(EFFECTIVE_AST_CUTOVER_GATE.customerCutoverAllowed!==true||EFFECTIVE_AST_CUTOVER_GATE.surfaceCutoverActive!==true)return null;const bundle=await buildAstCustomerWorkspaceCandidate(args);return bundle.workspace.governance.customerPublicationAllowed?bundle.workspace:null;}
export default Object.freeze({getAstCustomerWorkspaceCapability,buildAstCustomerWorkspaceCandidate,maybeBuildActiveAstCustomerWorkspace});
