import {numerologyPublicLabel} from './numerology-public-labels-v1.js';
import {buildNumerologyPriorityNarrative} from './numerology-priority-narrative-v1.js';
import {buildNumerologyRadialOverview} from './numerology-radial-overview-v1.js';
const SCHEMA='PHI-OS-NUM-CX-CUSTOMER-READING-ENVELOPE-v1.0.0';
const CHART_SCHEMA='PHI-OS-NUM-CX-CHART-MODEL-v1.0.0';
const CORE_ROLES=new Set(['LIFE_PATH','BIRTHDAY_NUMBER','ATTITUDE_NUMBER']);
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
const arr=value=>Array.isArray(value)?value:[];
const clean=value=>String(value??'').trim();
function fail(code){const e=new Error(code);e.code=code;throw e}
function digest(value){const text=JSON.stringify(value);let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}return `NUMCX-${(hash>>>0).toString(16).padStart(8,'0').toUpperCase()}`}
function label(locale,en,zh){return locale==='zh-Hans'?zh:en}
function snapshotNode(item,locale='en'){return freeze({id:item.role,label:numerologyPublicLabel(item.role,locale)||item.label,value:item.value,rawValue:item.rawValue??null,reductionSteps:arr(item.reductionSteps),masterNumberPreserved:item.masterNumberPreserved===true,tier:CORE_ROLES.has(item.role)?'CORE':'SECONDARY'})}
function relationshipEdge(item){return freeze({type:item.code,value:item.value??null,roles:arr(item.roles),priority:item.priority??null,title:item.title||null})}
function buildPatternBoard(expansion){const d=expansion?.sections?.digitDistribution,g=expansion?.sections?.energyGrouping;if(!d&&!g)return null;const frequency=d?.frequency||{};return freeze({frequency:Array.from({length:9},(_,i)=>{const digit=i+1,count=Number(frequency[digit]??0);return freeze({digit,count,present:count>0,repeated:count>1})}),presentDigits:arr(d?.presentDigits),missingDigits:arr(d?.missingDigits),repeatedDigits:arr(d?.repeatedDigits),axes:g?.axes||{},elements:g?.elements||{},boundaries:{absenceMeansDeficit:false,repetitionMeansIdentity:false,traitInferenceAllowed:false}})}
function buildNameLayer(expansion,locale){const n=expansion?.sections?.nameNumbers;if(!n?.customerPublishable||!n?.values)return null;const roleByCode={expression:'EXPRESSION',soulUrge:'SOUL_URGE',personality:'PERSONALITY',maturity:'MATURITY'};const values=Object.entries(n.values).map(([code,item])=>{const role=roleByCode[code]||String(code).toUpperCase();return freeze({code,role,label:numerologyPublicLabel(role,locale),value:item?.reducedValue??null,rawValue:item?.rawValue??null,reductionSteps:arr(item?.reductionSteps)})});return freeze({enabled:true,values,customerConfirmed:n.input?.customerConfirmed===true,sourceAlignedMeaningRequired:true})}
function buildSecondaryChart(depth){const s=depth?.sections?.secondaryChart;if(!s||s.availability!=='AVAILABLE')return null;return freeze({enabled:true,hiddenPassions:arr(s.hiddenPassions),karmicLessons:arr(s.karmicLessons),subconsciousSelf:s.subconsciousSelf??null,balance:s.balance?.value??null,rationalThought:s.rationalThought?.value??null,bridges:s.bridges||{},planes:s.planes||{},groups:s.groups||{},boundaries:{absenceMeansDeficit:false,compatibilityScoreAllowed:false,fortunePredictionAllowed:false}})}
function buildCycleTimeline(ir,locale){const expansion=ir?.sections?.expansion?.sections||{},depth=ir?.sections?.depth||{};const pc=expansion.pinnacleChallenge,life=expansion.lifePeriod;const longMeanings=arr(depth?.sections?.longCycleMeanings);return freeze({labels:{period:numerologyPublicLabel('PERIOD_CYCLE',locale),pinnacle:numerologyPublicLabel('PINNACLE_CYCLE',locale),challenge:numerologyPublicLabel('CHALLENGE_CYCLE',locale)},lifePeriods:arr(life?.calculatedPatterns).map(x=>freeze({bandCode:x.bandCode,startAge:x.startAge,endAge:x.endAge,pattern:x.pattern,positionCode:x.positionCode})),pinnacles:arr(pc?.pinnacles).map((value,i)=>freeze({sequence:i+1,value,meaningAvailable:longMeanings.some(x=>x.role==='PINNACLE_CYCLE'&&x.cycleNumber===i+1)})),challenges:arr(pc?.challenges).map((value,i)=>freeze({sequence:i+1,value,meaningAvailable:longMeanings.some(x=>x.role==='CHALLENGE_CYCLE'&&x.cycleNumber===i+1)})),ageBoundaryState:pc?.ageBoundaryValidation||null})}
function buildTimingBand(ir,locale){const timing=ir?.sections?.timing||{},alt=ir?.sections?.expansion?.sections?.alternativeTiming;return freeze({western:arr(timing.calendar).map(x=>freeze({code:x.code,label:numerologyPublicLabel(x.code,locale)||x.label||x.code,value:x.value,targetDate:x.targetDate||null})),energy:alt?.runtimeUseAllowed===true?freeze({label:label(locale,'Energy Numerology','能量数字学'),targetDate:alt.targetDate,phaseCode:alt.phaseCode,phasePattern:alt.phasePattern?.displayPattern||null,flowYearCode:alt.flowYear?.code||null,flowYearNumber:alt.flowYear?.number??null,schoolSeparation:alt.schoolSeparation||null}):null,boundaries:{schoolsMerged:false,eventPredictionAllowed:false}})}
function buildEnergyPatternMap(ir){const d=ir?.sections?.depth;return freeze({patterns:arr(d?.sections?.energyPatternMeanings).map(x=>freeze({observedPattern:x.observedPattern||x.pattern||x.canonicalClaimPattern||null,canonicalPattern:x.canonicalClaimPattern||null,sourceClaimId:x.sourceClaimId||null,customerPublishable:x.customerPublishable===true})),unknownMeaningInvented:false})}
function buildRelationshipOverlay(ir){const r=ir?.sections?.expansion?.sections?.relationship;if(!r?.customerPublishable)return null;return freeze({sharedPresentDigits:arr(r.sharedPresentDigits),mutualMissingDigits:arr(r.mutualMissingDigits),leftOnlyDigits:arr(r.leftOnlyDigits),rightOnlyDigits:arr(r.rightOnlyDigits),relationshipNumber:r.relationshipNumber?.availability==='AVAILABLE'?freeze({leftMainNumber:r.relationshipNumber.leftMainNumber,rightMainNumber:r.relationshipNumber.rightMainNumber,rawValue:r.relationshipNumber.rawValue,reducedValue:r.relationshipNumber.reducedValue,reductionSteps:arr(r.relationshipNumber.reductionSteps)}):null,boundaries:{compatibilityScoreCreated:false,compatibilityJudgmentCreated:false,relationshipOutcomePredicted:false}})}

function semanticClaim(item){
 if(!item||item.customerPublishable!==true)return null;
 const value=item.value&&typeof item.value==='object'?null:item.value??null;
 return freeze({role:item.role||item.code||null,value,text:item.text||item.summary||null,sourceClaimId:item.sourceClaimId||null,school:item.school||null,cycleNumber:item.cycleNumber??null,component:item.component||null});
}
function projectPublicIntegratedReading(ir,{expansionInput={},chartModel=null,locale='en'}={}){
 const rich=ir?.sections?.richReading||{},depth=ir?.sections?.depth||{},sections=depth?.sections||{};
 const compact=list=>arr(list).map(semanticClaim).filter(Boolean);
 let narrative=arr(ir?.sections?.integratedNarrative);
 if(clean(expansionInput?.targetDate)&&!arr(chartModel?.timingBand?.western).length){
   narrative=narrative.filter(item=>!/No target date was supplied|未提供目标日期|本次没有提供目标日期/.test(clean(item)));
   narrative=[...narrative,label(locale,'A target date was supplied. The alternative energy timing lane is available where supported; the standard Personal Year / Month / Day lane remains omitted when this run does not establish its required timezone context.','已提供目标日期。资料支持时会显示替代能量时间层；如果本次运行没有建立标准个人年／月／日所需的时区资料，该时间层会继续保持不显示。')];
 }
 return freeze({
   schemaVersion:'PHI-OS-NUM-CX-INTEGRATED-READING-PUBLIC-v1.0.0',
   customerPublishable:ir?.customerPublishable===true,
   numD8State:depth?.state||null,
   narrative,
   realityReflection:arr(ir?.sections?.realityReflection),
   roleReadings:arr(rich?.roleReadings).filter(x=>x?.runtimeUseAllowed===true).map(x=>freeze({role:x.role,value:x.value,text:x.text})),
   relationshipSynthesis:arr(rich?.relationshipSynthesis).filter(x=>x?.runtimeUseAllowed===true).map(x=>freeze({code:x.code,value:x.value??null,roles:arr(x.roles),text:x.text})),
   cycleReadings:arr(rich?.cycleReadings).filter(x=>x?.customerPublishable===true||x?.runtimeUseAllowed===true).map(x=>freeze({code:x.code||x.role||null,value:x.value??null,label:x.label||null,text:x.text||x.summary||null})),
   depth:freeze({
     nameRoleMeanings:compact(sections.nameRoleMeanings),
     hiddenPassionMeanings:compact(sections.hiddenPassionMeanings),
     karmicLessonMeanings:compact(sections.karmicLessonMeanings),
     secondaryRoleMeanings:compact(sections.secondaryRoleMeanings),
     longCycleMeanings:compact(sections.longCycleMeanings),
     energyPatternMeanings:compact(sections.energyPatternMeanings)
   }),
   boundaries:freeze({identityTotalizationAllowed:false,fortunePredictionAllowed:false,compatibilityScoreAllowed:false,empiricalTruthClaimed:false,schoolMergeCreated:false})
 });
}

function buildReadingIA(blocks){
 const rows=[
  ['READING_HERO',true],['CORE_NUMBER_MAP',Boolean(blocks.coreNumberMap?.nodes?.length)],['WHOLE_CHART_PATTERN',Boolean(blocks.wholeChartPattern)],['KEY_SYNTHESIS',true],['NAME_LAYER',Boolean(blocks.nameLayerMap)],['SECONDARY_CHART',Boolean(blocks.secondaryChartMap)],['LONG_CYCLES',Boolean(blocks.cycleTimeline)],['CURRENT_TIMING',Boolean(blocks.timingBand?.western?.length||blocks.timingBand?.energy)],['ENERGY_PATTERNS',Boolean(blocks.energyPatternMap?.patterns?.length)],['RELATIONSHIP_OVERLAY',Boolean(blocks.relationshipOverlay)],['REALITY_REFLECTION',true],['METHOD_EVIDENCE',true]
 ];
 return freeze({schemaVersion:'PHI-OS-NUM-CX-READING-IA-v1.0.0',presentation:'CHART_FIRST',blocks:rows.map(([blockId,available],i)=>freeze({blockId,order:i+1,available})),technicalEvidenceCollapsedByDefault:true,genericAtomicCardLoopForbidden:true});
}
export function buildNumerologyChartModel({integratedReading,locale='en'}={}){
 if(integratedReading?.customerPublishable!==true)fail('NUM_CX_PUBLISHABLE_INTEGRATED_READING_REQUIRED');
 const snapshot=arr(integratedReading.sections?.snapshot);const expansion=integratedReading.sections?.expansion;const depth=integratedReading.sections?.depth;
 const base={schemaVersion:CHART_SCHEMA,chartSpecVersion:'PHI-OS-NUM-CX-CHART-SPEC-v1.0.0',methodId:'NUM',locale,overviewTiles:snapshot.filter(x=>CORE_ROLES.has(x.role)).map(x=>snapshotNode(x,locale)),coreNumberMap:{nodes:snapshot.map(x=>snapshotNode(x,locale)),relations:arr(integratedReading.sections?.relationships).map(relationshipEdge)},wholeChartPattern:buildPatternBoard(expansion),nameLayerMap:buildNameLayer(expansion,locale),secondaryChartMap:buildSecondaryChart(depth),cycleTimeline:buildCycleTimeline(integratedReading,locale),timingBand:buildTimingBand(integratedReading,locale),energyPatternMap:buildEnergyPatternMap(integratedReading),relationshipOverlay:buildRelationshipOverlay(integratedReading),priorityThemes:arr(integratedReading.sections?.standoutThemes).slice(0,5).map(x=>freeze({themeCode:x.themeCode,priority:x.priority,title:x.title,summary:x.summary,evidence:arr(x.evidence)}))};
 const priorityNarrative=buildNumerologyPriorityNarrative({integratedReading,chartModel:base,locale,limit:5});
 const enriched={...base,priorityNarrative};
 const radialOverview=buildNumerologyRadialOverview({chartModel:enriched,integratedReading:projectPublicIntegratedReading(integratedReading,{locale}),locale});
 return freeze({...enriched,radialOverview,readingIA:buildReadingIA(enriched),boundaries:{chartCreatesMeaning:false,chartChangesCalculation:false,schoolMergeCreated:false,compatibilityScoreCreated:false,fortunePredictionCreated:false}})
}
export function buildNumerologyCustomerReadingEnvelope({canonicalProjection,meaningPayload,expansionInput={},locale='en'}={}){
 if(canonicalProjection?.method?.publicMethodCode!=='NUMEROLOGY_PROJECTION')fail('NUM_CX_NUMEROLOGY_PROJECTION_REQUIRED');
 const ir=meaningPayload?.integratedReading;if(ir?.customerPublishable!==true||ir?.sections?.depth?.state!=='NUM_D8_FULL_PRODUCTION_ACTIVE')fail('NUM_CX_NUM_D8_CUSTOMER_READING_REQUIRED');
 const chartModel=buildNumerologyChartModel({integratedReading:ir,locale});const snapshot=arr(ir.sections?.snapshot);
 const readingDigest=digest({projectionId:canonicalProjection.projectionId,bundle:meaningPayload?.meaningBundle?.bundleCode||ir.sourceMeaningBundleCode,ir:ir.schemaVersion,d8:ir.sections?.depth?.state,snapshot:snapshot.map(x=>[x.role,x.value,x.rawValue])});
 return freeze({schemaVersion:SCHEMA,methodId:'NUM',publicMethodCode:'NUMEROLOGY_PROJECTION',locale,canonicalProjection,calculationSummary:snapshot.map(x=>snapshotNode(x,locale)),chartModel,integratedReading:projectPublicIntegratedReading(ir,{expansionInput,chartModel,locale}),sourceLineage:{meaningBundleCode:meaningPayload?.meaningBundle?.bundleCode||ir.sourceMeaningBundleCode||null,integratedReadingSchema:ir.schemaVersion,numD8State:ir.sections?.depth?.state||null},availability:{customerPublishable:ir.customerPublishable===true,nameLayer:Boolean(chartModel.nameLayerMap),secondaryChart:Boolean(chartModel.secondaryChartMap),timing:Boolean(chartModel.timingBand?.western?.length||chartModel.timingBand?.energy),relationship:Boolean(chartModel.relationshipOverlay)},inputCoverage:{birthDate:Boolean(clean(expansionInput?.birthDate)),targetDate:Boolean(clean(expansionInput?.targetDate)),confirmedBirthName:expansionInput?.identityInput?.customerConfirmed===true&&Boolean(clean(expansionInput?.identityInput?.fullBirthName)),relationshipComparison:Boolean(clean(expansionInput?.relationship?.comparisonBirthDate))},boundaries:{rawCanonicalProjectionPubliclyExposed:false,browserCreatesMeaning:false,chartCreatesMeaning:false,identityTotalizationAllowed:false,fortunePredictionAllowed:false,compatibilityScoreAllowed:false,schoolMergeCreated:false},readingDigest})
}
export function projectNumerologyEnvelopeForCustomer(envelope){if(!envelope)return null;const {canonicalProjection:_privateProjection,...safe}=envelope;return freeze({...safe,boundaries:{...(safe.boundaries||{}),rawCanonicalProjectionPubliclyExposed:false}})}
export default Object.freeze({buildNumerologyChartModel,buildNumerologyCustomerReadingEnvelope,projectNumerologyEnvelopeForCustomer});
