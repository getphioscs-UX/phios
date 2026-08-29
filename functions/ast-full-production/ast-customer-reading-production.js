/** R2-W13–W16 AST customer-reading orchestration. Release gate remains fail-closed until final surface human acceptance + R3. */
import {buildAstProfessionalSemanticProjection} from './ast-professional-semantic-runtime.js';
import {buildAstWholeChartSynthesis} from './ast-whole-chart-synthesis-runtime.js';
import {buildAstCustomerReadingV2} from './ast-customer-reading-v2-runtime.js';
import {resolveAstCustomerIntent} from './ast-intent-responsive-composition.js';
import {buildAstGovernedTemporalReadingIR} from './ast-temporal-reading-adapter.js';
import {buildAstInteractiveWorkspace} from './ast-interactive-workspace-runtime.js';
import {executeAstTransitRequest} from '../ast-transit/transit-runtime.js';
import {buildAstTransitMeaningBundle} from '../ast-transit/transit-meaning-runtime.js';
import {buildAstTransitReadingIR} from '../ast-transit/transit-reading-ir.js';
import {AST_R4_AUTHORITY,AST_R4_REGISTRIES,AST_R4A_CLAIMS,AST_R4A_ADMISSION,AST_MEANING_ONTOLOGY,AST_R5_COMPOSITION_RULES,AST_READER_LANGUAGE_REGISTRY,AST_READING_IA,AST_CONTENT_OWNERSHIP,AST_READING_LAYOUT,AST_INTENT_ROUTING_REGISTRY,AST_SURFACE_CUTOVER_GATE} from './ast-customer-reading-authority-v2.js';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
function targetComplete(t){return Boolean(t?.targetDate&&t?.targetTime&&t?.targetTimezone?.iana&&t?.targetTimezone?.utcOffsetAtTarget)}
export function getAstCustomerWorkspaceCapability(){return freeze({schemaVersion:'PHI-OS-AST-CUSTOMER-WORKSPACE-CAPABILITY-v1.0.0',surfaceCutoverActive:AST_SURFACE_CUTOVER_GATE.surfaceCutoverActive===true&&AST_SURFACE_CUTOVER_GATE.customerCutoverAllowed===true,intentResponsiveCompositionAvailable:true,explicitTargetTimingAvailable:true,interactiveWorkspaceAvailable:true,requiresExplicitTargetContext:true});}
export async function buildAstCustomerWorkspaceCandidate({canonicalProjection,rawIntent='',explicitIntentProfileId=null,locale='en',targetContext=null,consentRecordId='ENGINEERING-CANDIDATE',sourceMainCommit='3f6825a9b57dc9e62e34fb69bc55d2aac2c39768',astronomyModuleLoader}={}){
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
 const workspace=buildAstInteractiveWorkspace({canonicalProjection,reading,intentResolution,languageRegistry:AST_READER_LANGUAGE_REGISTRY,cutoverGate:AST_SURFACE_CUTOVER_GATE,temporalIR});
 return freeze({schemaVersion:'PHI-OS-AST-CUSTOMER-WORKSPACE-CANDIDATE-BUNDLE-v1.0.0',intentResolution,professionalSemanticProjection,synthesis,temporalIR,astt,reading,workspace,cutoverGate:AST_SURFACE_CUTOVER_GATE});
}
export async function maybeBuildActiveAstCustomerWorkspace(args={}){if(AST_SURFACE_CUTOVER_GATE.customerCutoverAllowed!==true||AST_SURFACE_CUTOVER_GATE.surfaceCutoverActive!==true)return null;const bundle=await buildAstCustomerWorkspaceCandidate(args);return bundle.workspace.governance.customerPublicationAllowed?bundle.workspace:null;}
export default Object.freeze({getAstCustomerWorkspaceCapability,buildAstCustomerWorkspaceCandidate,maybeBuildActiveAstCustomerWorkspace});
