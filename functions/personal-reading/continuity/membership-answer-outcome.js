export const ANSWER_COMPLETENESS=Object.freeze(['COMPLETE','PARTIAL','SOURCE_INSUFFICIENT','FAILED']);
// Execution state and answer coverage are distinct. Legacy rows are projected,
// never rewritten or assumed complete merely because their task is COMPLETE.
export function answerOutcome(saved,taskState){
 if(saved?.answerCompleteness&&ANSWER_COMPLETENESS.includes(saved.answerCompleteness))return saved.answerCompleteness;
 const quality=saved?.semanticAssessment?.quality||'';
 if(quality.startsWith('PARTIAL_'))return 'PARTIAL';
 if(quality.startsWith('COMPLETE_WITHIN_'))return 'COMPLETE';
 if(!saved?.answer)return taskState==='FAILED'||taskState==='RECONCILIATION'?'FAILED':'SOURCE_INSUFFICIENT';
 return 'UNCLASSIFIED_LEGACY';
}
export function completenessLabel(state,locale='zh-Hans'){
 const labels={COMPLETE:['来源范围内完整回答','Complete within source scope'],PARTIAL:['部分回答','Partial answer'],SOURCE_INSUFFICIENT:['来源不足','Insufficient sources'],FAILED:['未交付','Not delivered'],UNCLASSIFIED_LEGACY:['答案范围未分类','Answer coverage unclassified']};
 return (labels[state]||labels.UNCLASSIFIED_LEGACY)[locale==='en'?1:0];
}
