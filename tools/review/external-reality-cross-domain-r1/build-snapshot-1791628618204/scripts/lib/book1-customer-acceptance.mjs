export const tasks=[
 {id:'FIND_MECHANISM',label:'找到一个 mechanism',evidence:'记录名称、objectId，以及你怎样找到它。'},
 {id:'EXPLAIN_MECHANISM',label:'理解它',evidence:'用自己的话解释它是什么，并说明一个限制；不要只复制页面定义。'},
 {id:'FIND_RELATED',label:'看到关联机制',evidence:'记录页面提供的关联对象及入口；找不到则标记 FAIL，不把相邻目录当作关联。'},
 {id:'READ_SOURCE',label:'进入原文',evidence:'记录实际打开的章节／页码和访问结果。只看到页码或访问提示不算已进入原文。'},
 {id:'CONTINUE_ASK',label:'继续 Ask',evidence:'记录提问、所携带主题与实际返回结果；仅存在 Ask 链接不算完成。'}
];
export function validateAcceptanceDraft(packet,draft){
 const tasks=packet.tasks;
 const errors=[];
 if(draft.sourceDigest!==packet.sourceDigest)errors.push('STALE_PACKET');
 if(!draft.reader?.trim()||draft.firstTimeReader!==true)errors.push('READER_REQUIRED');
 if(!['en','zh-Hans'].includes(draft.locale))errors.push('LOCALE_REQUIRED');
 if(!draft.testUrl?.startsWith('https://'))errors.push('TEST_URL_REQUIRED');
 if(!Number.isFinite(draft.elapsedSeconds)||draft.elapsedSeconds<=0)errors.push('TIMING_REQUIRED');
 if(!Array.isArray(draft.results)||draft.results.length!==tasks.length||new Set(draft.results?.map(r=>r.id)).size!==tasks.length)errors.push('TASK_SET_INVALID');
 for(const task of tasks){const r=draft.results?.find(r=>r.id===task.id);if(!r||!['PASS','FAIL','NOT_RUN'].includes(r.status))errors.push('TASK_INVALID:'+task.id);else if(r.status!=='NOT_RUN'&&!r.observation?.trim())errors.push('OBSERVATION_REQUIRED:'+task.id);}
 return {errors,eligibleForAcceptanceReview:errors.length===0&&(packet.timeBudgetSeconds==null||draft.elapsedSeconds<=packet.timeBudgetSeconds)&&draft.results.every(r=>r.status==='PASS'),humanAcceptanceApplied:false};
}
