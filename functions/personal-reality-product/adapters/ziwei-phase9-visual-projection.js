import {freeze,list,text,localeOf,fail} from './product-envelope-core.js';
import {sha256Stable,stableStringify} from '../../zi-wei-runtime/zwr-utils.js';

export const ZIWEI_PVP_PHASE9_VISUAL_SCHEMA='PHI-OS-ZIWEI-PVP-PHASE9-VISUAL-PROJECTION-v1.0.0';
export const ZIWEI_PVP_PHASE9_VISUAL_TYPE='ZIWEI_PVP_PHASE9_VISUAL_SET';
export const ZIWEI_PVP_PHASE9_MFIG_IDS=Object.freeze({
  twelvePalace:'MFIG-051',priorityMap:'MFIG-052',starPalaceComposition:'MFIG-053',fourTransformationFlow:'MFIG-054',palaceNetwork:'MFIG-055',timingTimeline:'MFIG-056',topicMap:'MFIG-057',realityBridge:'MFIG-058'
});

const professionalOf=product=>list(product?.visuals).find(v=>v?.type==='ZIWEI_PRO_R2_PROFESSIONAL_PRESENTATION')?.payload||null;
const presentationOf=product=>list(product?.visuals).find(v=>v?.type==='ZIWEI_SPECIALIST_PRESENTATION')?.payload||null;
const brief=(value,max=92)=>{const s=String(value||'').trim();if(!s)return '';const cut=s.search(/[。！？!?；;.!]/);if(cut>0&&cut<=max)return s.slice(0,cut+1);return s.length>max?`${s.slice(0,max)}…`:s;};

function palaceProjection(pro,presentation){
  const pByCode=new Map(list(presentation?.palaces).map(p=>[p?.palaceCode||p?.title,p]));
  return list(pro?.palaces).map((p,index)=>{
    const visual=list(presentation?.palaces)[index]||pByCode.get(p.palaceCode)||{};
    const d=p.chartDensity||{};
    return freeze({
      palaceCode:p.palaceCode,palaceLabel:p.title||d.palaceLabel||visual.title||p.palaceCode,
      branchLabel:p.branchLabel||d.branchLabel||visual.branchLabel||'',stemBranchLabel:d.stemBranchLabel||'',
      row:Number(visual.row)||null,col:Number(visual.col)||null,
      isLifePalace:p.isLifePalace===true,isBodyPalace:p.isBodyPalace===true,
      isCurrentDaXian:d.isCurrentDaXian===true,isCurrentLiuNian:d.isCurrentLiuNian===true,
      daXianAgeRange:d.daXianAgeRange||null,
      stars:list(d.stars).map(s=>freeze({label:s.label||'',starClass:s.starClass||null,classLabel:s.classLabel||null,stateLabel:s.stateCustomerVisible===true?s.stateLabel||null:null})),
      natalTransformations:list(d.natalTransformations).map(x=>freeze({layer:'NATAL',label:x.label,targetStarLabel:x.targetStarLabel||'',palaceCode:p.palaceCode,palaceLabel:p.title||d.palaceLabel||p.palaceCode})),
      currentTransformations:list(d.currentTransformations).map(x=>freeze({layer:x.layer,label:x.label,targetStarLabel:x.targetStarLabel||'',palaceCode:p.palaceCode,palaceLabel:p.title||d.palaceLabel||p.palaceCode})),
      network:freeze({triads:list(p.network?.triadLabels||p.network?.triadPalaces),opposite:p.network?.oppositeLabel||p.network?.oppositePalace||null,flanks:list(p.network?.flankLabels||p.network?.flankPalaces)}),
      readingQuestion:p.readingQuestion||null
    });
  });
}

function priorityProjection(pro){
  return list(pro?.priority).slice(0,5).map(x=>freeze({rank:x.rank,priorityCode:x.priorityCode,title:x.title,summary:brief(x.evidenceSummary||x.whyItMatters,96),realityCheck:brief(x.realWorldCheck,96)}));
}
function transformations(palaces){return palaces.flatMap(p=>[...list(p.natalTransformations),...list(p.currentTransformations)]).map(x=>freeze({...x}));}
function timingProjection(pro){const t=pro?.timingProfessional||{};return freeze({currentDaXian:t.currentDaXian?freeze({title:t.currentDaXian.title,focusPalaceCode:t.currentDaXian.focusPalaceCode,focusPalaceLabel:t.currentDaXian.focusPalaceLabel,period:t.currentDaXian.period,summary:brief(t.currentDaXian.interpretation,120)}):null,currentYear:t.currentYear?freeze({title:t.currentYear.title,calendarYear:t.currentYear.calendarYear,focusPalaceCode:t.currentYear.focusPalaceCode,focusPalaceLabel:t.currentYear.focusPalaceLabel,summary:brief(t.currentYear.interpretation,120)}):null,crossLayer:t.crossLayer?freeze({classification:t.crossLayer.classification,summary:brief(t.crossLayer.interpretation,140),counterEvidence:brief(t.crossLayer.counterEvidence,120)}):null,years:list(t.navigationWindow?.years).map(y=>freeze({calendarYear:y.calendarYear,direction:y.direction,annualFocusLabel:y.annualFocusLabel,daXianFocusLabel:y.daXianFocusLabel,classification:y.classification,transformationLabels:list(y.annualTransformationLabels),summary:brief(y.interpretation,128)}))});}
function topicProjection(pro,palaces){const labels=new Map(palaces.map(p=>[p.palaceCode,p.palaceLabel]));return list(pro?.topicsProfessional).map(t=>freeze({topicCode:t.topicCode,title:t.title,primaryPalaces:list(t.primaryPalaceCodes).map(code=>freeze({palaceCode:code,label:labels.get(code)||code})),contextPalaces:list(t.contextPalaceCodes).map(code=>freeze({palaceCode:code,label:labels.get(code)||code})),summary:brief(t.sections?.coreStructure,110),realityCheck:brief(t.sections?.realityCheck,110)}));}
function realityProjection(pro,topics){const priority=list(pro?.priority).slice(0,3).map(x=>freeze({source:'PRIORITY',label:x.title,question:x.realWorldCheck}));const topic=list(topics).slice(0,2).map(x=>freeze({source:'TOPIC',label:x.title,question:x.realityCheck}));return freeze({mode:'OBSERVATION_PROMPTS_ONLY',autoConsumesRealityContext:false,prompts:[...priority,...topic].filter(x=>x.question)});}

export function projectZiweiPhase9VisualSet({product}={}){
  if(product?.methodId!=='ZWR'||product?.productType!=='ZIWEI_FULL_PRODUCTION')fail('PVP_PHASE9_ZIWEI_PRODUCT_REQUIRED');
  if(product?.state!=='CUSTOMER_PUBLISHABLE')fail('PVP_PHASE9_ZIWEI_CUSTOMER_PUBLISHABLE_REQUIRED');
  const l=localeOf(product.locale),pro=professionalOf(product),presentation=presentationOf(product);if(!pro||!presentation)fail('PVP_PHASE9_ZIWEI_PROFESSIONAL_PRESENTATION_REQUIRED');
  const snap=stableStringify(product),palaces=palaceProjection(pro,presentation),priority=priorityProjection(pro),flow=transformations(palaces),timing=timingProjection(pro),topics=topicProjection(pro,palaces),reality=realityProjection(pro,topics);
  const base={schemaVersion:ZIWEI_PVP_PHASE9_VISUAL_SCHEMA,work:'PHASE9-ZV-R3-PVP-W17-W24',methodId:'ZWR',locale:l,status:'CUSTOMER_VISUAL_PROJECTION_ACTIVE',mfigRegistry:'content/professional/method-runtime/canonical-mfig-authority-registry-v2.json',mfigIds:ZIWEI_PVP_PHASE9_MFIG_IDS,
    twelvePalace:freeze({mfigId:ZIWEI_PVP_PHASE9_MFIG_IDS.twelvePalace,palaces,center:freeze({fiveElementBureau:pro.chartProfessionalDensity?.fiveElementBureau?.label||null,lifePalace:pro.chartProfessionalDensity?.lifePalace?.branchLabel||null,bodyPalace:pro.chartProfessionalDensity?.bodyPalace?.palaceLabel||null})}),
    priorityMap:freeze({mfigId:ZIWEI_PVP_PHASE9_MFIG_IDS.priorityMap,items:priority,freeVisibleCount:3,scoreVisible:false}),
    starPalaceComposition:freeze({mfigId:ZIWEI_PVP_PHASE9_MFIG_IDS.starPalaceComposition,palaces:palaces.map(p=>freeze({palaceCode:p.palaceCode,palaceLabel:p.palaceLabel,stars:p.stars}))}),
    fourTransformationFlow:freeze({mfigId:ZIWEI_PVP_PHASE9_MFIG_IDS.fourTransformationFlow,edges:flow,goodBadClassificationCreated:false}),
    palaceNetwork:freeze({mfigId:ZIWEI_PVP_PHASE9_MFIG_IDS.palaceNetwork,palaces:palaces.map(p=>freeze({palaceCode:p.palaceCode,palaceLabel:p.palaceLabel,network:p.network}))}),
    timingTimeline:freeze({mfigId:ZIWEI_PVP_PHASE9_MFIG_IDS.timingTimeline,...timing,eventPrediction:false}),
    topicMap:freeze({mfigId:ZIWEI_PVP_PHASE9_MFIG_IDS.topicMap,topics,freeIndexOnly:true}),
    realityBridge:freeze({mfigId:ZIWEI_PVP_PHASE9_MFIG_IDS.realityBridge,...reality}),
    experienceStates:freeze({activeState:'FREE',free:freeze({state:'ACTIVE',shows:['TWELVE_PALACE_CHART','LIFE_PALACE','BODY_PALACE','TOP_3_PRIORITY_SIGNALS','CURRENT_DA_XIAN','CURRENT_LIU_NIAN','TOPIC_INDEX'],usefulInterpretationVisible:true,fullSemanticLayersExpanded:false}),topic:freeze({state:'AVAILABLE_GOVERNED_SELECTION',topicCount:topics.length,clientSelectionCreatesMeaning:false}),deep:freeze({state:'LOCKED_SERVER_ENTITLEMENT_REQUIRED',visibleLockedDepth:['FULL_PRIORITY_MAP','STAR_PALACE_COMPOSITION','FOUR_TRANSFORMATION_FLOW','PALACE_NETWORK','MULTI_YEAR_TIMING_DEPTH','TOPIC_READING_DEPTH'],clientMaySelfUnlock:false}),reality:freeze({state:'OPTIONAL_HANDOFF',autoContextConsumption:false,explicitContextRequiredForPersonalRealityReuse:true})}),
    boundaries:freeze({visualProjectionCreatesMeaning:false,visualProjectionRunsCalculation:false,visualProjectionCreatesScore:false,visualProjectionPredictsEvents:false,visualProjectionOwnsCommerce:false,clientMayGrantPaidEntitlement:false,pricesHardCoded:false,creditsHardCoded:false,existingZiweiTruthPreserved:true,existingProfessionalReadingPreserved:true})};
  const projectionDigest=sha256Stable(base);if(stableStringify(product)!==snap)fail('PVP_PHASE9_ZIWEI_INPUT_MUTATION_FORBIDDEN');return freeze({...base,projectionDigest});
}
export default Object.freeze({projectZiweiPhase9VisualSet,ZIWEI_PVP_PHASE9_VISUAL_SCHEMA,ZIWEI_PVP_PHASE9_VISUAL_TYPE,ZIWEI_PVP_PHASE9_MFIG_IDS});
