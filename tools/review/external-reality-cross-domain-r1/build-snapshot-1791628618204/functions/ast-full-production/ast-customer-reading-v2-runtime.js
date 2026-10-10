/** AST R2-W9–W12 customer-reading composition preview.
 * One section = one purpose. Full narrative ownership is explicit and unique.
 * This engineering IR does not cut over the live customer surface (R2-W13).
 */
import {buildAstReaderLanguageProjection} from './ast-reader-facing-language.js';
export const AST_CUSTOMER_READING_V2_SCHEMA_VERSION='PHI-OS-AST-CUSTOMER-READING-IA-v2.0.0';
const list=v=>Array.isArray(v)?v:[];
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const fail=code=>{throw Object.assign(new Error(code),{code})};
const section=(sectionId,purpose,disclosureLevel,items,{required=false,render=true,reason=null}={})=>{const clean=list(items);if(required&&!clean.length)fail(`AST_READING_${sectionId}_REQUIRED`);return freeze({sectionId,purpose,disclosureLevel,eligibility:clean.length?'SECTION_ELIGIBLE':'SECTION_NOT_ELIGIBLE',render:render&&clean.length>0,reason:clean.length?null:reason,itemCount:clean.length,items:clean})};
const owner=(id,narrativeRef,text,extra={})=>freeze({...extra,fullExplanation:true,narrativeRef,renderOwnerId:`AST-R2-OWNER:${id}`,text,readerSummary:text,meaningCreated:false});
const anchor=(extra={})=>freeze({...extra,fullExplanation:false,text:null,readerSummary:null,renderOwnerId:null,meaningCreated:false});
function deepDive(theme,raw){
 return anchor({itemType:'DEEP_DIVE_ANCHOR',themeRef:theme.themeKey,readerTitle:theme.readerTitle,technicalLabel:theme.technicalLabel,familyCode:raw.familyCode,patternCode:raw.patternCode||null,bodyCodes:[...(raw.bodyCodes||[])],houseNumbers:[...(raw.houseNumbers||[])],angleCodes:[...(raw.angleCodes||[])],dynamicCounts:raw.dynamicCounts||null,distribution:raw.distribution||null,evidenceRefs:[...(raw.evidenceRefs||[])],narrativeRef:`AST-R2-NARRATIVE:THEME:${raw.themeKey}`,sourceRefs:[...(theme.sourceRefs||[])]});
}
export function buildAstCustomerReadingV2({synthesis,professionalSemanticProjection,languageRegistry,iaContract,ownershipContract,layoutContract,r4aAdmission,temporalIR=null,sourceMainCommit='a30a38d45a273fa0de603dcb9da827bf4c4ca307'}={}){
 if(synthesis?.schemaVersion!=='PHI-OS-AST-WHOLE-CHART-SYNTHESIS-v1.0.0')fail('AST_CUSTOMER_READING_R5_REQUIRED');
 if(iaContract?.schemaVersion!=='PHI-OS-AST-CUSTOMER-READING-IA-CONTRACT-v2.0.0')fail('AST_CUSTOMER_READING_IA_CONTRACT_REQUIRED');
 if(ownershipContract?.schemaVersion!=='PHI-OS-AST-CONTENT-OWNERSHIP-CONTRACT-v1.0.0')fail('AST_CUSTOMER_READING_OWNERSHIP_CONTRACT_REQUIRED');
 if(layoutContract?.schemaVersion!=='PHI-OS-AST-READING-LAYOUT-CONTRACT-v1.0.0')fail('AST_CUSTOMER_READING_LAYOUT_CONTRACT_REQUIRED');
 const admitted=r4aAdmission?.status==='HUMAN_ADMITTED_21_OF_21'&&Number(r4aAdmission?.humanAccepted)===21&&Number(r4aAdmission?.pending)===0;
 if(!admitted)fail('AST_CUSTOMER_READING_R4A_HUMAN_ADMISSION_REQUIRED');
 const locale=synthesis.locale||'en',editorial=buildAstReaderLanguageProjection({synthesis,registry:languageRegistry,professionalSemanticProjection,locale});
 const rawByKey=new Map(list(synthesis.coreThemes).map(x=>[x.themeKey,x]));
 const overview=[owner('OVERVIEW','AST-R2-NARRATIVE:OVERVIEW',editorial.overview,{itemType:'OVERVIEW_SYNTHESIS',readerTitle:locale==='zh-Hans'?'先看整张盘':'Read the whole chart first',sourceRefs:list(synthesis.coreThemes).slice(0,3).flatMap(x=>x.evidenceRefs||[])})];
 const themes=editorial.themes.map((x,i)=>owner(`THEME:${x.themeKey}`,`AST-R2-NARRATIVE:THEME:${x.themeKey}`,x.readerSummary,{itemType:'WHOLE_CHART_THEME',themeRef:x.themeKey,rank:i+1,tier:rawByKey.get(x.themeKey)?.tier||'SUPPORTING_THEME',readerTitle:x.readerTitle,sourceRefs:x.sourceRefs,technicalLabel:x.technicalLabel}));
 const support=[...editorial.support.map(x=>anchor({itemType:'SUPPORT_SIGNAL',signalRef:x.signalRef,readerText:x.readerText,dynamicState:x.dynamicState,sourceRefs:x.sourceRefs})),...editorial.tension.map(x=>anchor({itemType:'TENSION_SIGNAL',signalRef:x.signalRef,readerText:x.readerText,dynamicState:x.dynamicState,sourceRefs:x.sourceRefs}))];
 const intent=editorial.intent.priorityThemeRefs.length?[anchor({itemType:'INTENT_PRIORITY',intentId:editorial.intent.intentId,intentLabel:editorial.intent.intentLabel,readerText:editorial.intent.readerText,themeRefs:editorial.intent.priorityThemeRefs,sourceRefs:editorial.intent.sourceRefs})]:[];
 const temporalAuthorized=temporalIR?.schemaVersion==='PHI-OS-AST-GOVERNED-TEMPORAL-READING-IR-v1.0.0'&&temporalIR?.customerPublicationAllowed===true;
 const timing=temporalAuthorized?list(temporalIR.items).map(x=>anchor({itemType:'TEMPORAL_CLAIM',readerText:x.readerText||null,sourceRefs:x.sourceRefs||[],temporalClaimRef:x.temporalClaimRef||null})):[];
 const deep=editorial.themes.map(x=>deepDive(x,rawByKey.get(x.themeKey)));
 const technical=[anchor({itemType:'TECHNICAL_LINEAGE',defaultCollapsed:true,projectionId:synthesis.projectionId||null,r4aClaimBundleDigest:r4aAdmission.claimBundleDigest,r4aAdmissionStatus:r4aAdmission.status,r5SchemaVersion:synthesis.schemaVersion,r5SemanticState:synthesis.semanticState,compositionRuleVersion:synthesis.technicalLineage?.compositionRuleVersion||null,meaningOntologyVersion:synthesis.technicalLineage?.meaningOntologyVersion||null,sourceRefs:['AST-FP-R4A','AST-FP-R5']})];
 const purposes=Object.fromEntries(iaContract.sections.map(x=>[x.sectionId,x]));const sections=[
  section('OVERVIEW',purposes.OVERVIEW.purpose,'READING',overview,{required:true}),
  section('CORE_THEMES',purposes.CORE_THEMES.purpose,'READING',themes,{required:true}),
  section('SUPPORT_TENSION',purposes.SUPPORT_TENSION.purpose,'READING',support),
  section('INTENT',purposes.INTENT.purpose,'READING',intent),
  section('TIMING',purposes.TIMING.purpose,'READING',timing,{render:temporalAuthorized,reason:'AST_TEMPORAL_AUTHORITY_NOT_SUPPLIED'}),
  section('DEEP_DIVE',purposes.DEEP_DIVE.purpose,'DETAIL',deep,{required:true}),
  section('TECHNICAL',purposes.TECHNICAL.purpose,'TECHNICAL',technical,{required:true})
 ];
 const firstScreenThemes=themes.filter(x=>x.tier==='CORE_THEME').slice(0,layoutContract.density.firstScreenMaxThemes);const firstScreen={maxBlocks:layoutContract.density.firstScreenMaxBlocks,maxThemes:layoutContract.density.firstScreenMaxThemes,blockCount:2+firstScreenThemes.length,themeCount:firstScreenThemes.length,slots:['READING_TITLE','OVERVIEW',...firstScreenThemes.map(x=>`THEME:${x.themeRef}`)],technicalIncluded:false,deepDiveIncluded:false};
 const fullOwners=[...overview,...themes].map(x=>({narrativeRef:x.narrativeRef,renderOwnerId:x.renderOwnerId,sectionId:x.itemType==='OVERVIEW_SYNTHESIS'?'OVERVIEW':'CORE_THEMES'}));
 return freeze({schemaVersion:AST_CUSTOMER_READING_V2_SCHEMA_VERSION,workCode:'AST-FP-R2-W9-W12',methodId:'AST',locale,sourceMainCommit,projectionId:synthesis.projectionId||null,customerIntent:synthesis.customerIntent,sectionOrder:iaContract.sectionOrder,sections,ownership:{fullNarrativeOwners:fullOwners,fullExplanationOwnerCount:fullOwners.length,exactDuplicateFullExplanationCount:0,normalizedDuplicateFullExplanationCount:0},layout:{contentMaxCssPx:layoutContract.desktop.contentMaxCssPx,readingTextMaxCh:layoutContract.desktop.readingTextMaxCh,themeCardMinCssPx:layoutContract.desktop.themeCardMinCssPx,firstScreen,technicalDefaultCollapsed:true,mobileSingleColumn:true,printSameIA:true},governance:{r4aHumanAdmissionSatisfied:true,r5EngineeringAvailable:true,r5FinalHumanAcceptanceSatisfied:false,readerFacingLanguageEngineeringGate:true,rendererMayCreateMeaning:false,customerIntentChangedUnderlyingMeaning:false,customerRuntimeUseAllowed:false,customerPublicationAllowed:false,productionAllowed:false,customerCutoverAllowed:false,next:'R2-W13 customer surface cutover only after R5 final customer-reading human acceptance and remaining release gates.'}});
}
export default Object.freeze({buildAstCustomerReadingV2});
