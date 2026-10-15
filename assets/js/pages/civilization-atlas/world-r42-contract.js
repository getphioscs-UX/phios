// Read-only projection over existing World objects; never a second Atlas registry.
export function compareWorldObjects(a,b){
 if(!a||!b)return {state:'COMPARABILITY_UNKNOWN',reasons:['OBJECT_MISSING']};
 const reasons=[];if(a.unit&&b.unit&&a.unit!==b.unit)reasons.push('INCOMPATIBLE_UNITS');if(a.methodology&&b.methodology&&a.methodology!==b.methodology)reasons.push('INCOMPATIBLE_METHODS');if(reasons.length)return {state:'NOT_COMPARABLE',reasons};
 if(a.type!==b.type)return {state:'NOT_COMPARABLE',reasons:['DIFFERENT_OBJECT_CLASSES']};
 if(a.id===b.id)return {state:'COMPARABILITY_UNKNOWN',reasons:['SELECT_TWO_DISTINCT_OBJECTS']};
 if(!a.source||!b.source||!a.time||!b.time)return {state:'COMPARABILITY_UNKNOWN',reasons:['SOURCE_OR_TIME_UNKNOWN']};
 if(a.unit&&b.unit&&(a.time.start!==b.time.start||a.time.end!==b.time.end))return {state:'NOT_COMPARABLE',reasons:['MEASUREMENT_PERIODS_DIFFER']};
 return {state:a.comparisonBasis&&a.comparisonBasis===b.comparisonBasis?'COMPARABLE':'PARTIALLY_COMPARABLE',reasons:a.comparisonBasis===b.comparisonBasis&&a.comparisonBasis?[]:['DESCRIPTIVE_SOURCE_ROWS_ONLY_NO_RANK_OR_CAUSAL_INFERENCE']};
}
export function timelineInterval(o){const start=o?.time?.start,end=o?.time?.end;return {id:o.id,start:Number.isFinite(start)?start:null,end:Number.isFinite(end)?end:null,boundary:o.time?.precision||o.datePrecision||'PRECISION_NOT_ESTABLISHED',openEnded:end==null,source:o.source||null,href:o.href,personalFact:false};}
