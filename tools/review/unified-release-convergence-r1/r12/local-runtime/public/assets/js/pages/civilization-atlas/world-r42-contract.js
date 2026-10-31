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
