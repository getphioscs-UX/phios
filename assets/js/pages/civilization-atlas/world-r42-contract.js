// Read-only projection over existing World objects; never a second Atlas registry.
export function compareWorldObjects(a,b){
 if(!a||!b)return {state:'COMPARABILITY_UNKNOWN',reasons:['OBJECT_MISSING']};
 const reasons=[];for(const [field,reason]of [['indicatorId','INDICATOR_DEFINITIONS_DIFFER'],['spatialLevel','SPATIAL_SCOPES_DIFFER'],['priceBasis','PRICE_BASES_DIFFER']])if(a[field]&&b[field]&&a[field]!==b[field])reasons.push(reason);if(a.unit&&b.unit&&a.unit!==b.unit)reasons.push('INCOMPATIBLE_UNITS');if(a.methodology&&b.methodology&&a.methodology!==b.methodology)reasons.push('INCOMPATIBLE_METHODS');if(reasons.length)return {state:'NOT_COMPARABLE',reasons};
 if(a.type!==b.type)return {state:'NOT_COMPARABLE',reasons:['DIFFERENT_OBJECT_CLASSES']};
 if(a.id===b.id)return {state:'COMPARABILITY_UNKNOWN',reasons:['SELECT_TWO_DISTINCT_OBJECTS']};
 if(!a.source||!b.source||!a.time||!b.time)return {state:'COMPARABILITY_UNKNOWN',reasons:['SOURCE_OR_TIME_UNKNOWN']};
 if(a.unit&&b.unit&&(a.time.start!==b.time.start||a.time.end!==b.time.end))return {state:'NOT_COMPARABLE',reasons:['MEASUREMENT_PERIODS_DIFFER']};
 return {state:a.comparisonBasis&&a.comparisonBasis===b.comparisonBasis?'COMPARABLE':'PARTIALLY_COMPARABLE',reasons:a.comparisonBasis===b.comparisonBasis&&a.comparisonBasis?[]:['DESCRIPTIVE_SOURCE_ROWS_ONLY_NO_RANK_OR_CAUSAL_INFERENCE']};
}
export function timelineInterval(o){const start=o?.time?.start,end=o?.time?.end;return {id:o.id,start:Number.isFinite(start)?start:null,end:Number.isFinite(end)?end:null,boundary:o.time?.precision||o.datePrecision||'PRECISION_NOT_ESTABLISHED',openEnded:end==null,source:o.source||null,href:o.href,personalFact:false};}
// Customer wording is separate from machine comparability states.
export function comparisonMessage(result,locale='en'){
 const zh=locale==='zh-Hans',messages={OBJECT_MISSING:['Select two source objects.','请选择两个来源对象。'],INCOMPATIBLE_UNITS:['The units differ.','单位不同。'],INCOMPATIBLE_METHODS:['The methods differ.','口径不同。'],DIFFERENT_OBJECT_CLASSES:['These are different object categories.','对象类别不同。'],SELECT_TWO_DISTINCT_OBJECTS:['Choose a different second object.','请选择另一个对象。'],SOURCE_OR_TIME_UNKNOWN:['Source or time coverage is not established.','来源或时期覆盖尚未确定。'],MEASUREMENT_PERIODS_DIFFER:['The observation periods differ.','观察时期不同。'],DESCRIPTIVE_SOURCE_ROWS_ONLY_NO_RANK_OR_CAUSAL_INFERENCE:['Descriptive comparison only; no ranking or causal conclusion.','仅作描述性对照，不产生排名或因果结论。'],INDICATOR_DEFINITIONS_DIFFER:['The indicator definitions differ.','指标定义不同。'],SPATIAL_SCOPES_DIFFER:['The geographic levels differ.','空间层级不同。'],PRICE_BASES_DIFFER:['The price bases differ.','价格口径不同。']};
 return result.reasons.length?result.reasons.map(r=>messages[r]?.[zh?1:0]||(zh?'比较依据仍待核对。':'The comparison basis needs verification.')).join(' '):(zh?'已登记相同的比较口径；仅限列明维度。':'A shared comparison basis is registered, limited to the listed dimensions.');
}

// Observation adapters extend the existing R4.2 comparison owner; no score or new registry.
export function compareWorldObservationValues(a,b){
 const absent=!a||!b||![a?.value,b?.value].every(Number.isFinite);if(absent)return {state:'NOT_COMPARABLE',reasons:['MISSING_VALUE_NOT_ZERO'],difference:null};
 const reasons=[];for(const k of ['indicatorId','unit','currency','priceBasis','frequency','definitionVersion','sourceVersion','scope'])if(a[k]===undefined||a[k]!==b[k])reasons.push('OBSERVATION_'+k.toUpperCase()+'_MISMATCH');
 if(a.admission!=='ARCHIVAL_CWA_SOURCE_BOUND'||b.admission!=='ARCHIVAL_CWA_SOURCE_BOUND')reasons.push('SOURCE_ADMISSION_REQUIRED');
 if(a.fiscalCoverageVerified===false||b.fiscalCoverageVerified===false)reasons.push('GOVERNMENT_COVERAGE_NOT_VERIFIED');
 if(reasons.length)return {state:'NOT_COMPARABLE',reasons,difference:null};const comparison=compareWorldObjects(a,b);if(comparison.state!=='COMPARABLE')return {...comparison,difference:null};
 return {...comparison,difference:a.value-b.value,differenceUnit:a.unit.startsWith('percent')?'percentage_points':a.unit,methodRef:'WORLD_R42_OBSERVATION_DELTA_V1',formula:'left - right',sourceRefs:[a.id,b.id],causality:false,ranking:false};
}
export function describeWorldObservationSeries(rows,{start,end}={}){
 const reasons=[];if(!Number.isInteger(start)||!Number.isInteger(end)||end<=start||end-start>100)reasons.push('EXPLICIT_MULTI_POINT_WINDOW_REQUIRED');const points=[...rows].filter(r=>r.time?.start>=start&&r.time.start<=end).sort((a,b)=>a.time.start-b.time.start),first=points[0];
 if(points.length<2||points.length!==end-start+1)reasons.push('MISSING_WINDOW_POINTS');for(let i=0;i<points.length;i++){const p=points[i];if(!Number.isFinite(p.value))reasons.push('MISSING_VALUE_NOT_ZERO');if(p.frequency!=='ANNUAL')reasons.push('ANNUAL_SOURCE_REQUIRED');if(p.admission!=='ARCHIVAL_CWA_SOURCE_BOUND')reasons.push('SOURCE_ADMISSION_REQUIRED');if(p.fiscalCoverageVerified===false)reasons.push('GOVERNMENT_COVERAGE_NOT_VERIFIED');if(i&&p.time.start!==points[i-1].time.start+1)reasons.push('MISSING_OR_DUPLICATE_PERIOD');for(const k of ['subjectId','indicatorId','unit','currency','priceBasis','frequency','definitionVersion','sourceVersion','scope'])if(p[k]===undefined||p[k]!==first[k])reasons.push('SERIES_'+k.toUpperCase()+'_MISMATCH');}
 if(reasons.length)return {state:'INSUFFICIENT_SERIES',reasons:[...new Set(reasons)],points:[],change:null,noInterpolation:true,window:{start,end},nextAction:'CHECK_MATCHING_SOURCE_PERIODS'};
 return {state:'TREND_OBSERVATION',scope:'DATED_OBSERVED_SEQUENCE_NOT_FORECAST',window:{start,end,samplingFrequency:'ANNUAL'},count:points.length,points:points.map(p=>({period:p.time.start,value:p.value,observationId:p.id})),first:first.value,last:points.at(-1).value,change:points.at(-1).value-first.value,unit:first.unit.startsWith('percent')?'percentage_points':first.unit,sourceRefs:points.map(p=>p.id),methodRef:'WORLD_R42_ANNUAL_OBSERVED_SEQUENCE_V1',noInterpolation:true,persistence:null,noise:null,thresholdState:'NOT_EVALUATED',forecast:false,causality:false};
}
