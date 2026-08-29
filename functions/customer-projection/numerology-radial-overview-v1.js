const SCHEMA='PHI-OS-NUM-RW-RADIAL-OVERVIEW-v1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))freeze(x)}return value};
const arr=value=>Array.isArray(value)?value:[];
const clean=value=>String(value??'').trim();
const text=(locale,en,zh)=>locale==='zh-Hans'?zh:en;
const joinValues=values=>arr(values).filter(v=>v!==null&&v!==undefined&&clean(v)).map(v=>clean(v)).join(' · ');
function coreById(chart,id){return arr(chart?.overviewTiles).find(x=>x?.id===id)||arr(chart?.coreNumberMap?.nodes).find(x=>x?.id===id)||null}
function repeatedMetric(board){const repeated=arr(board?.frequency).filter(x=>Number(x?.count)>1);if(repeated.length)return repeated.slice(0,3).map(x=>`${x.digit}×${x.count}`).join(' · ');const present=arr(board?.frequency).filter(x=>x?.present).map(x=>x.digit);return present.length?`${present.length}/9`:''}
function nameMetric(layer){return joinValues(arr(layer?.values).map(x=>x?.value)).replace(/ · /g,'·')}
function secondaryMetric(chart,locale){const hp=arr(chart?.hiddenPassions).slice(0,2),kl=arr(chart?.karmicLessons);if(hp.length)return `${text(locale,'H','热')} ${joinValues(hp).replace(/ · /g,'·')}`;if(kl.length)return `${text(locale,'K','缺')} ${kl.length}`;const values=[chart?.balance,chart?.rationalThought].filter(v=>v!==null&&v!==undefined);return joinValues(values).replace(/ · /g,'·')}
function cycleMetric(timeline,locale){const p=arr(timeline?.pinnacles).map(x=>x?.value).filter(v=>v!==null&&v!==undefined).slice(0,2),c=arr(timeline?.challenges).map(x=>x?.value).filter(v=>v!==null&&v!==undefined).slice(0,2);if(p.length||c.length)return `${text(locale,'P','峰')} ${joinValues(p).replace(/ · /g,'·')}${p.length&&c.length?' / ':''}${c.length?`${text(locale,'C','挑')} ${joinValues(c).replace(/ · /g,'·')}`:''}`;const life=arr(timeline?.lifePeriods).map(x=>x?.pattern).filter(Boolean).slice(0,2);return joinValues(life).replace(/ · /g,' / ')}
function timingMetric(timing){const western=arr(timing?.western).map(x=>x?.value).filter(v=>v!==null&&v!==undefined);if(western.length)return joinValues(western).replace(/ · /g,'·');const energy=timing?.energy;if(energy)return [energy.flowYearCode,energy.phasePattern].filter(Boolean).join(' / ');return ''}
function energyMetric(map){return arr(map?.patterns).filter(x=>x?.customerPublishable===true).map(x=>x.observedPattern||x.canonicalPattern).filter(Boolean).slice(0,2).join(' / ')}
function relationshipMetric(rel,locale){if(rel?.relationshipNumber?.reducedValue!==null&&rel?.relationshipNumber?.reducedValue!==undefined)return `${text(locale,'R','关')} ${rel.relationshipNumber.reducedValue}`;const shared=arr(rel?.sharedPresentDigits);return shared.length?`${text(locale,'Shared','共')} ${joinValues(shared).replace(/ · /g,'·')}`:''}
function sector({id,label,metric,targetSection,priority='P4',available=true}){if(!available)return null;return freeze({id,label,metric:clean(metric),availability:'AVAILABLE',priority,targetSection,sourceRefs:[]})}
export function buildNumerologyRadialOverview({chartModel,integratedReading=null,locale='en'}={}){
 if(!chartModel||chartModel.methodId!=='NUM')return null;
 const life=coreById(chartModel,'LIFE_PATH'),birthday=coreById(chartModel,'BIRTHDAY_NUMBER'),attitude=coreById(chartModel,'ATTITUDE_NUMBER');
 const center=freeze({targetSection:'CORE_NUMBER_MAP',lifePath:life?freeze({label:life.label,value:life.value}):null,birthday:birthday?freeze({label:birthday.label,value:birthday.value}):null,attitude:attitude?freeze({label:attitude.label,value:attitude.value}):null});
 const priorities=arr(chartModel?.priorityNarrative?.items);
 const sectors=[
  sector({id:'KEY_SYNTHESIS',label:text(locale,'Read first','先看重点'),metric:priorities.length?`TOP ${Math.min(3,priorities.length)}`:'',targetSection:'KEY_SYNTHESIS',priority:'P0',available:priorities.length>0}),
  sector({id:'WHOLE_CHART_PATTERN',label:text(locale,'Whole chart','整体结构'),metric:repeatedMetric(chartModel.wholeChartPattern),targetSection:'WHOLE_CHART_PATTERN',priority:'P1',available:Boolean(chartModel.wholeChartPattern)}),
  sector({id:'NAME_LAYER',label:text(locale,'Name layer','姓名层'),metric:nameMetric(chartModel.nameLayerMap),targetSection:'NAME_LAYER',priority:'P3',available:Boolean(chartModel.nameLayerMap)}),
  sector({id:'SECONDARY_CHART',label:text(locale,'Secondary','次级结构'),metric:secondaryMetric(chartModel.secondaryChartMap,locale),targetSection:'SECONDARY_CHART',priority:'P5',available:Boolean(chartModel.secondaryChartMap)}),
  sector({id:'LONG_CYCLES',label:text(locale,'Long cycles','长期周期'),metric:cycleMetric(chartModel.cycleTimeline,locale),targetSection:'LONG_CYCLES',priority:'P4',available:Boolean(chartModel.cycleTimeline)}),
  sector({id:'CURRENT_TIMING',label:text(locale,'Current timing','当前时序'),metric:timingMetric(chartModel.timingBand),targetSection:'CURRENT_TIMING',priority:'P2',available:Boolean(arr(chartModel?.timingBand?.western).length||chartModel?.timingBand?.energy)}),
  sector({id:'ENERGY_PATTERNS',label:text(locale,'Energy patterns','能量组合'),metric:energyMetric(chartModel.energyPatternMap),targetSection:'ENERGY_PATTERNS',priority:'P6',available:Boolean(arr(chartModel?.energyPatternMap?.patterns).length)}),
  sector({id:'RELATIONSHIP_OVERLAY',label:text(locale,'Relationship','关系结构'),metric:relationshipMetric(chartModel.relationshipOverlay,locale),targetSection:'RELATIONSHIP_OVERLAY',priority:'P4',available:Boolean(chartModel.relationshipOverlay)}),
  sector({id:'REALITY_REFLECTION',label:text(locale,'Reality reflection','现实对照'),metric:arr(integratedReading?.realityReflection).length?`${arr(integratedReading.realityReflection).length} ${text(locale,'Q','问')}`:'',targetSection:'REALITY_REFLECTION',priority:'P6',available:Boolean(arr(integratedReading?.realityReflection).length)})
 ].filter(Boolean);
 return freeze({schemaVersion:SCHEMA,chartId:'NUM_READING_OVERVIEW_WHEEL',methodId:'NUM',locale,presentationOnly:true,createsMeaning:false,center,sectors,sectorCount:sectors.length,boundaries:freeze({calculationCreated:false,meaningCreated:false,schoolSystemsMerged:false,compatibilityScoreCreated:false,fortunePredictionCreated:false,unavailableModuleInvented:false})});
}
export {SCHEMA as NUM_RW_RADIAL_OVERVIEW_SCHEMA};
export default Object.freeze({buildNumerologyRadialOverview,NUM_RW_RADIAL_OVERVIEW_SCHEMA:SCHEMA});
