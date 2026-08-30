import {AST_R2_METHOD_SCOPED_ADMISSION} from '../../ast-full-production/ast-r2-production-admission-authority.js';
import {AST_CUSTOMER_PRODUCT_PROJECTION_V3_SCHEMA} from '../../ast-full-production/ast-customer-product-projection-v3.js';
import {buildMethodProductEnvelope,section,visual,list,text,localeOf,fail,PPR_R3_SPECIALIST_RENDERER_REFERENCE_CONTRACT} from './product-envelope-core.js';

function v3Of(workspace){
 const v3=workspace?.customerProductProjection;
 return v3?.schemaVersion===AST_CUSTOMER_PRODUCT_PROJECTION_V3_SCHEMA?v3:null;
}
function sectionsFromV3(v3,l){
 if(!v3)return null;
 const reading=v3.wholeChartReading||{},themes=list(v3.keyConfigurations),support=list(reading.support),tension=list(reading.tension);
 const sections=[
  section({sectionId:'READING',title:text(l,'Whole-chart reading','整盘读取'),summary:v3.overview?.readerSummary||null,payload:{overview:v3.overview,themes:themes.slice(0,5),unknowns:list(reading.unknowns)},sourceRefs:list(v3.overview?.sourceRefs)}),
  section({sectionId:'THEMES',title:text(l,'Whole-chart themes','整盘主题'),payload:themes,sourceRefs:themes.flatMap(x=>list(x.sourceRefs))}),
  section({sectionId:'SUPPORT_TENSION',title:text(l,'Support and tension','支持与张力'),payload:{support,tension},sourceRefs:[...support,...tension].flatMap(x=>list(x.sourceRefs))}),
  ...(v3.timing?.state==='AVAILABLE'?[section({sectionId:'CURRENT_ACTIVATION',title:text(l,'Current activation','当前激活'),payload:v3.timing,sourceRefs:list(v3.timing?.sourceRefs)})]:[]),
  section({sectionId:'DETAILS',title:text(l,'Evidence & lineage','证据与来源'),payload:v3.technical||null,kind:'EVIDENCE',sourceRefs:list(v3.technical?.sourceRefs)})
 ];
 return sections;
}
export function adaptAstPersonalRealityProduct({workspace,locale=workspace?.locale||'en'}={}){
 if(workspace?.schemaVersion!=='PHI-OS-AST-INTERACTIVE-WORKSPACE-v1.0.0')fail('PPR_R2_AST_WORKSPACE_REQUIRED');
 const l=localeOf(locale),v3=v3Of(workspace),allowed=AST_R2_METHOD_SCOPED_ADMISSION.customerPublicationAllowed===true&&AST_R2_METHOD_SCOPED_ADMISSION.customerCutoverAllowed===true&&workspace.governance?.customerPublicationAllowed===true;
 const themes=v3?list(v3.keyConfigurations):list(workspace.themes),support=v3?list(v3.wholeChartReading?.support):list(workspace.supportTension?.support||workspace.supportTension?.items).filter(x=>!x?.kind||x.kind==='SUPPORT_SIGNAL'),tension=v3?list(v3.wholeChartReading?.tension):list(workspace.supportTension?.tension||workspace.supportTension?.items).filter(x=>x?.kind==='TENSION_SIGNAL');
 const sections=sectionsFromV3(v3)||[
  section({sectionId:'READING',title:text(l,'Whole-chart reading','整盘读取'),summary:workspace.overview?.readerSummary||workspace.overview?.summary||null,payload:workspace.overview||null,sourceRefs:list(workspace.overview?.sourceRefs)}),
  section({sectionId:'THEMES',title:text(l,'Whole-chart themes','整盘主题'),payload:themes,sourceRefs:themes.flatMap(x=>list(x.sourceRefs))}),
  section({sectionId:'SUPPORT_TENSION',title:text(l,'Support and tension','支持与张力'),payload:{support,tension},sourceRefs:[...support,...tension].flatMap(x=>list(x.sourceRefs))}),
  ...(workspace.timing?.state&&workspace.timing.state!=='UNAVAILABLE'?[section({sectionId:'CURRENT_ACTIVATION',title:text(l,'Current activation','当前激活'),payload:workspace.timing,sourceRefs:list(workspace.timing?.sourceRefs)})]:[]),
  section({sectionId:'DETAILS',title:text(l,'Evidence & lineage','证据与来源'),payload:workspace.technical||null,kind:'EVIDENCE',sourceRefs:list(workspace.technical?.items).flatMap(x=>list(x.sourceRefs))})
 ];
 const specialistRenderer={rendererId:'PPR_R3_AST_PRODUCT_V1',surfaceContract:PPR_R3_SPECIALIST_RENDERER_REFERENCE_CONTRACT,capabilities:['METHOD_NAVIGATION_SLOT','NATAL_CHART_VISUAL','WHOLE_CHART_READING','TIMING','AST_CUSTOMER_PRODUCT_PROJECTION_V3','AST_PROFESSIONAL_IA','AST_NATAL_CHART_V2','AST_CHART_EXPLORER','AST_CORE_CONFIGURATION','AST_PLANETS_HOUSES_EXPLORER','AST_ASPECT_PATTERN_NETWORK','AST_RULERSHIP_NETWORK','AST_ELEMENT_MODALITY_MATRIX']};
 const summary=v3?.overview?.readerSummary||workspace.overview?.readerSummary||workspace.overview?.summary||null;
 const chart=v3?.chart||workspace.chartModel||null;
 return buildMethodProductEnvelope({
  methodId:'AST',productType:'ASTROLOGY_PROFESSIONAL_READING',locale:l,state:allowed?'CUSTOMER_PUBLISHABLE':'UPSTREAM_CUTOVER_BLOCKED',
  publication:{customerPublishable:allowed,authorityRef:'functions/ast-full-production/ast-r2-production-admission-authority.js',status:AST_R2_METHOD_SCOPED_ADMISSION.status,blockers:allowed?[]:['R3_INDEPENDENT_EPHEMERIS_CERTIFICATION_REQUIRED']},
  hero:{eyebrow:text(l,'ASTROLOGY · WHOLE-CHART READING','占星 · 整盘读取'),title:v3?.overview?.readerTitle||workspace.overview?.readerTitle||text(l,'Start with the chart as a whole','先从整张盘开始'),summary,highlights:themes.slice(0,3).map(x=>x.readerTitle).filter(Boolean)},
  navigation:list(workspace.navigation).length?workspace.navigation:sections.map(x=>x.sectionId),sections,
  visuals:[visual({visualId:'AST_CHART',type:'ASTROLOGY_CHART',title:text(l,'Natal chart','出生星盘'),payload:chart,sourceRefs:[workspace.projectionId].filter(Boolean)})],
  specialistRenderer,
  lineage:{projectionId:workspace.projectionId||null,workspaceSchema:workspace.schemaVersion,customerProductProjectionSchema:v3?.schemaVersion||null,customerProductSemanticDigest:v3?.semanticDigest||null,productionAdmissionRef:'AST-R2-W19',sourceRefs:v3?list(v3.technical?.sourceRefs):list(workspace.technical?.items).flatMap(x=>list(x.sourceRefs))},
  boundaries:{currentRealityKnown:false,fortunePredictionCreated:false,liveIndividualHumanReviewClaimed:false,customerProductProjectionCreatesMeaning:false},
  // Keep the W16 workspace as the renderer compatibility carrier for W0-W4.
  // AST-CX-R3 W5+ will move the specialist renderer to the v3 projection directly.
  sourceProduct:workspace
 });
}
export default Object.freeze({adaptAstPersonalRealityProduct});
