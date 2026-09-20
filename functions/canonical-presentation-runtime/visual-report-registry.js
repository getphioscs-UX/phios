import {REPORT_REFERENCE_BLUEPRINTS} from './report-blueprint-reference.js';
import {commercialRuntime} from '../pws/commercial/commercial-runtime.js';
const commerceCatalog=commercialRuntime.projectReportCatalog();
// Presentation reads all prices and eligibility from the existing PWS owner.
// Method interpretation, calculation and entitlement remain with their owners.
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const VISUAL_COMPONENTS = freeze(['RADIAL_MAP','DONUT','BAR','STACKED_BAR','DISTRIBUTION_RING','SCATTER','TIMELINE','CYCLE','MATRIX','HEATMAP','NETWORK','FLOW','LAYER_STACK','SPLIT_COMPARE','DOMAIN_GRID','RANKED_CARDS','NODE_MAP','STRUCTURAL_DIAGRAM','MINI_CARD','SPARKLINE','CONFIDENCE_OR_EVIDENCE_BADGE']);
const definitions = [
 ['COVER',['STRUCTURAL_DIAGRAM','RADIAL_MAP']], ['IDENTITY_CARD',['MINI_CARD']],
 ['SNAPSHOT_DASHBOARD',['DOMAIN_GRID','MINI_CARD']], ['RADIAL_STRUCTURAL_MAP',['RADIAL_MAP','STRUCTURAL_DIAGRAM']],
 ['DISTRIBUTION',['BAR','DONUT','STACKED_BAR','DISTRIBUTION_RING','SCATTER']], ['MATRIX_GRID',['MATRIX','HEATMAP','DOMAIN_GRID']],
 ['TIMELINE_CYCLE',['TIMELINE','CYCLE','SPARKLINE']], ['NETWORK_RELATIONSHIP',['NETWORK','NODE_MAP']],
 ['COMPARISON',['SPLIT_COMPARE']], ['LAYER_STACK',['LAYER_STACK']], ['INSIGHT_CARDS',['RANKED_CARDS','MINI_CARD']],
 ['NAVIGATION',['FLOW','MINI_CARD']], ['METHOD_BOUNDARY',['SPLIT_COMPARE','CONFIDENCE_OR_EVIDENCE_BADGE']],
 ['FLOW_PROCESS',['FLOW']], ['EVIDENCE_SOURCE',['NETWORK','CONFIDENCE_OR_EVIDENCE_BADGE']], ['ADAPTIVE_MODULE',['DOMAIN_GRID','STRUCTURAL_DIAGRAM']]
];
export const VISUAL_TEMPLATES = freeze(Object.fromEntries(definitions.map(([purpose, allowedVisualTypes], i) => {
 const templateId = `RPT-T${String(i).padStart(2,'0')}`;
 return [templateId,{templateId,purpose,allowedVisualTypes,minVisualArea:.45,targetVisualArea:[.55,.70],maxBodyArea:.30,maxClaims:3,textBudget:{'zh-Hans':{target:[60,140],max:180,unit:'CHARACTERS'},en:{target:[40,90],max:110,unit:'WORDS'}},requiredSlots:['question','title','visual','evidenceRefs'],optionalSlots:['subtitle','insights','navigationPrompt'],forbiddenContent:['UNSOURCED_VALUE','INVENTED_RANK','UNADMITTED_CLAIM','FILLER','DUPLICATE_PROSE'],fallback:'SUPPRESS_UNBOUND_PAGE',mobile:'REFLOW_WITH_LABELS_AND_RELATIONS_PRESERVED',print:'A4_ONE_PAGE_NO_VISUAL_SPLIT',accessibility:'TEXT_LABELS_SOURCE_TABLE_AND_NON_COLOR_SELECTION'}];
})));
const report = (methodId, productId, accent, modules, authority) => ({methodId,productId,targetMyr:commerceCatalog.products.find(p=>p.productId===productId).price.amountMinor/100,currency:'MYR',accent,assetId:`COM-REPORT-${productId.replace('_FULL_REPORT','')}-FULL`,modules,authority,review:'PENDING',customerPublishable:false,commerceBinding:commerceCatalog.contractId});
export const VISUAL_REPORT_PRODUCTS = freeze([
 report('BZR','BAZI_FULL_REPORT','#986536',['COVER','SNAPSHOT','FOUR_PILLARS','ELEMENTS','RELATIONSHIPS','PATTERNS','DOMAINS','RESOURCES','TIMING','SELECTED_TIMING','NAVIGATION','BOUNDARY'],'BZR_FULL_PRODUCTION'),
 report('ZWR','ZIWEI_FULL_REPORT','#786391',['COVER','SNAPSHOT','TWELVE_PALACES','LIFE_PALACE','STAR_NETWORK','DOMAINS','CAREER_RESOURCES','RELATIONSHIPS','SELF','TIMING','SELECTED_TIMING','NAVIGATION','BOUNDARY'],'ZIWEI_PRO_R2'),
 report('AST','ASTROLOGY_FULL_REPORT','#486c9a',['COVER','SNAPSHOT','NATAL_CHART','DISTRIBUTIONS','HOUSES','ASPECTS','DOMINANT_THEMES','DOMAINS','TIMING','SELECTED_FOCUS','NAVIGATION','BOUNDARY'],'AST_FULL_PRODUCTION'),
 report('NUM','NUMEROLOGY_FULL_REPORT','#a07728',['COVER','SNAPSHOT','NUMBER_ROLES','DISTRIBUTION','NUMBER_RELATIONSHIPS','CYCLES','THEMES','STRENGTH_FRICTION','NAVIGATION','BOUNDARY'],'NUM_FULL_PRODUCTION'),
 report('PROFILE','PROFILE_FULL_REPORT','#827b94',['COVER','SNAPSHOT','EVIDENCE','DOMAINS','CONFIGURATION','STRENGTH_FRICTION','SELF_ASSESSMENT?','BIG_FIVE?','CAREER_INTEREST?','FINANCIAL_CAPABILITY?','EXTERNAL_PROFILE?','INFERENCE_EVIDENCE?','COMPARISON','SIGNALS','NAVIGATION','BOUNDARY'],'PROFILE_PPR_VISUAL_OUTPUT_AUTHORITY_V2'),
 report('ECR','ECR_FULL_REPORT','#247579',['COVER','PHI_CARD','OVERVIEW','CORE_QUESTION','CAPABILITY_REGION','DRIVER_PRIORITY','MOTION','PHI_CONFIGURATION','ACTIVATION','OBSERVABLE_SIGNALS','REALITY_NAVIGATION','EMBODIED_CONFIGURATION?','EXPERIENCE_EXPRESSION?','CURRENT_REALITY_COMPARISON?'],'ECR_FULL_R1_R1A'),
 report('HD','HD_FULL_REPORT','#526797',['ADAPTIVE_HD_PRO_R3_BLUEPRINT'],'content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/report/hd-pro-r3-report-blueprint-authority-v1.json'),
 report('CROSS','CROSS_FULL_REPORT','#9c8247',['COVER','METHOD_COVERAGE','SNAPSHOT','SEMANTIC_MATRIX','COMMON','COMPLEMENTARY','TENSION','CONTEXT_DEPENDENT','OPEN','IDENTITY','RELATIONSHIPS','WORK','RESOURCES','TIMING','CURRENT_REALITY?','PRIORITY','NAVIGATION','EVIDENCE'],'CROSS_METHOD_RUNTIME_READING_IR_V2')
]);
export const VISUAL_REPORT_BUNDLES = freeze(commerceCatalog.products.filter(p=>p.kind==='BUNDLE').map(p=>({...p,targetMyr:p.price.amountMinor/100,currency:p.price.currency,assetId:`COM-REPORT-${p.productId.replaceAll('_','-')}`,createsCrossReading:false,blocker:'HUMAN_REVIEW_AND_EXISTING_PRODUCTION_GATE'})));

export const REPORT_BLUEPRINT_SUCCESSOR=freeze(VISUAL_REPORT_PRODUCTS.map(p=>({
 methodId:p.methodId,productId:p.productId,authority:p.authority,
 pagePlan:REPORT_REFERENCE_BLUEPRINTS.find(b=>b.methodId===p.methodId).pages.map(({sourceText,...page})=>page),
 staticRoles:['COVER','METHOD_INTRO','ORIGIN','PHIOS_LENS','HOW_TO_READ'],
 dynamicRoles:REPORT_REFERENCE_BLUEPRINTS.find(b=>b.methodId===p.methodId).pages.filter(p=>p.pageNumber>5).map(p=>p.role),
 targetPages:{BZR:[26,26],AST:[26,26],ZWR:[26,26],NUM:[24,24],PROFILE:[12,26],ECR:[26,26],HD:[28,32],CROSS:[28,34]}[p.methodId],
 eligibility:{missingEvidence:'DATA_REQUIRED',optionalAbsent:'NOT_APPLICABLE',pendingAdmission:'CONDITIONAL',paidDoesNotGrantMissingInputs:true},
 requiredContext:p.methodId==='ECR'?{pages:[18,19,20],requirement:'INDEPENDENT_CURRENT_REALITY_OBSERVATIONS'}:p.methodId==='HD'?{advanced:['VARIABLES','PHS'],requirement:'ACTUAL_ADMITTED_INPUT'}:p.methodId==='CROSS'?{requirement:'ADMITTED_METHODS_ONLY',relationshipClasses:['COMMON','COMPLEMENTARY','TENSION','CONTEXT_DEPENDENT','OPEN']}:null,
 editorialRegistry:'functions/canonical-presentation-runtime/report-editorial-registry.js',customerPublishable:false,humanReview:'PENDING'
})));
