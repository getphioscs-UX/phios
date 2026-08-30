const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const list=v=>Array.isArray(v)?v:[];
const uniq=v=>[...new Set(list(v).filter(Boolean))];
function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
function localeOf(v){return v==='zh-Hans'?'zh-Hans':'en'}
function text(locale,en,zh){return localeOf(locale)==='zh-Hans'?zh:en}
function acceptedUnitIndex(reading){return new Map(list(reading?.insights).map(x=>[x.insightId,x]));}
function cardGroupTitle(locale,groupId){const labels={CORE:['Core structure','核心结构'],DRIVER:['What keeps this moving','驱动力'],GIFT:['Usable capacities','可用能力'],TENSION:['Tensions to watch','需要留意的张力'],FIELD:['Supporting conditions','支持场域'],PHASE:['Where the baseline sits','运行阶段']};const pair=labels[groupId]||[groupId,groupId];return text(locale,pair[0],pair[1]);}
function cardSection(locale,card,index){const unitId=card?.lineage?.interpretationUnitId||null,unit=unitId?index.get(unitId):null;return freeze({sectionId:`${card.groupId}_READING`,groupId:card.groupId,title:cardGroupTitle(locale,card.groupId),card:{cardId:card.cardId,title:card.title,subtitle:card.subtitle,oneLineInsight:card.oneLineInsight,canonicalCustomerMeaning:card.canonicalCustomerMeaning,flowingExpression:card.flowingExpression,strainedExpression:card.strainedExpression,observationPrompt:card.observationPrompt,asset:card.asset||null},acceptedInterpretation:unit?{interpretationUnitId:unit.insightId,title:unit.title||null,summary:unit.summary||null,body:unit.body||null,plainLanguageExplanation:unit.plainLanguageExplanation||unit.body||null,observableSignals:list(unit.observableSignals),alternativeInterpretations:list(unit.alternativeInterpretations),openQuestions:list(unit.openQuestions),confidenceBoundary:unit.confidenceBoundary||null}:null,sourceRefs:[unitId].filter(Boolean)});}
export function buildEcrCustomerFullReport({readingIR,acceptedReading,phiCardSpread,customerAdmission,locale=readingIR?.locale||acceptedReading?.locale||'en'}={}){
 if(readingIR?.schemaVersion!=='PHI-OS-ECR-RUNTIME-READING-IR-v1.0.0')fail('ECR_FULL_REPORT_READING_IR_REQUIRED');
 if(acceptedReading?.methodId!=='ECR'||acceptedReading?.state!=='READY_TO_READ'||acceptedReading?.technical?.acceptanceBasis!=='ADMITTED_COMPOSITION_RULESET')fail('ECR_FULL_REPORT_ACCEPTED_READING_REQUIRED');
 if(phiCardSpread?.schemaVersion!=='PHI-OS-ECR-PHI-CARD-SPREAD-v1.0.0'||list(phiCardSpread.cards).length!==6)fail('ECR_FULL_REPORT_SIX_CARD_SPREAD_REQUIRED');
 if(customerAdmission?.customerAdmission!==true)fail('ECR_FULL_REPORT_CARD_ADMISSION_REQUIRED');
 const localeId=localeOf(locale),index=acceptedUnitIndex(acceptedReading),sections=list(phiCardSpread.cards).map(card=>cardSection(localeId,card,index));
 const technicalUnits=list(acceptedReading?.technical?.interpretationUnits);
 const technicalLineage=freeze({
  compositionRuleVersion:acceptedReading?.technical?.compositionRuleVersion||null,
  projectionRefs:uniq(technicalUnits.flatMap(x=>list(x.projectionRefs))),
  meaningRefs:uniq(technicalUnits.flatMap(x=>list(x.meaningRefs))),
  compositionRuleRefs:uniq(technicalUnits.flatMap(x=>list(x.derivationRefs))),
  boundaryRefs:uniq(technicalUnits.flatMap(x=>list(x.boundaryRefs)))
 });
 const used=new Set(sections.flatMap(x=>x.sourceRefs));
 const deeper=list(acceptedReading.insights).filter(x=>!used.has(x.insightId)).map(x=>freeze({interpretationUnitId:x.insightId,title:x.title||null,summary:x.summary||null,body:x.body||null,plainLanguageExplanation:x.plainLanguageExplanation||x.body||null,observableSignals:list(x.observableSignals),alternativeInterpretations:list(x.alternativeInterpretations),openQuestions:list(x.openQuestions),confidenceBoundary:x.confidenceBoundary||null}));
 const report=freeze({schemaVersion:'PHI-OS-ECR-CUSTOMER-FULL-REPORT-v1.0.0',reportId:`ECR-FULL-REPORT-${String(readingIR.sourceProjectionId||'UNKNOWN').slice(-16)}`,methodId:'ECR',locale:localeId,state:'CUSTOMER_PUBLISHABLE',publicationState:'CUSTOMER_PUBLISHABLE',title:text(localeId,'PHI Configuration Reading','PHI 构型专业读取'),subtitle:text(localeId,'A complete reading of the calculated configuration, with the six PHI Cards as its visual summary.','以完整构型读取为主报告，六张 PHI Card 作为这次结果的视觉摘要。'),customerNotice:text(localeId,'The cards do not replace this report and are not randomly drawn. Both surfaces consume the same admitted ECR result.','这些卡牌不会替代完整报告，也不是随机抽取；卡牌与报告都消费同一份已获准的 ECR 结果。'),sections,deeperReading:deeper,evidenceAndBoundaries:{sourceProjectionId:readingIR.sourceProjectionId||null,sourceMeaningBundleCode:readingIR.sourceMeaningBundleCode||null,interpretationResultId:acceptedReading.technical.interpretationResultId||null,admissionRef:acceptedReading.technical.admissionRef||null,phiCardAdmissionRef:'content/ecr-phi-card/admission/ecr-phi-card-customer-admission-v1.json',technicalLineage,boundaries:{...readingIR.boundaries,currentRealityKnown:false,randomDrawUsed:false,cardsReplaceReport:false,reportCreatesNewMeaning:false,rendererCreatesMeaning:false}},authority:{compositionClass:'CUSTOMER_PRESENTATION_ASSEMBLY_ONLY',allCustomerMeaningInheritedFromAcceptedInterpretation:true,cardCopyInheritedFromAdmittedDeck:true,newCanonicalMeaningCreated:false},sourceRefs:[readingIR.sourceProjectionId,readingIR.sourceMeaningBundleCode,acceptedReading.technical.interpretationResultId].filter(Boolean)});
 return report;
}
export default Object.freeze({buildEcrCustomerFullReport});
