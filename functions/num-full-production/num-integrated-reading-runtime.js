import {
 NUM_FP_SCHEMA,NUM_FP_VERSION,NUM_FP_CORE_ROLES,NUM_FP_PRIMARY_ROLES,NUM_FP_CUSTOMER_RELATION_ROLES,NUM_FP_CALENDAR_CYCLES,NUM_FP_MASTER_NUMBERS,
 numFpRoleMeta,numFpIsMaster,numFpIsKarmicCandidateRaw
} from './num-full-production-rules.js';
import {buildNumRichReviewPreview} from './num-rich-reading-preview.js';

export const NUM_INTEGRATED_READING_IR_SCHEMA='PHI-OS-NUM-INTEGRATED-READING-IR-v1.0.0';
function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value;}
function sentenceList(items,locale){const xs=items.filter(Boolean);if(!xs.length)return '';if(locale==='zh-Hans')return xs.join('、');if(xs.length===1)return xs[0];if(xs.length===2)return `${xs[0]} and ${xs[1]}`;return `${xs.slice(0,-1).join(', ')}, and ${xs.at(-1)}`;}
function roleFromMeaning(item){return item?.sourceProjectionRef?.selector?.match?.code||'';}
function meaningByRole(localeProjection){const map=new Map();for(const item of localeProjection?.items||[]){const role=roleFromMeaning(item);if(role&&!map.has(role))map.set(role,item);}return map;}
function valueMap(projection){return new Map((projection.calculation?.values||[]).map(x=>[x.code,x]));}
function cycleGroups(projection){
 const cycles=projection.calculation?.cycles||[];
 return Object.freeze({calendar:Object.freeze(cycles.filter(x=>NUM_FP_CALENDAR_CYCLES.includes(x.code))),pinnacles:Object.freeze(cycles.filter(x=>x.code==='PINNACLE_CYCLE')),challenges:Object.freeze(cycles.filter(x=>x.code==='CHALLENGE_CYCLE'))});
}
function coreSnapshot(projection,locale){
 return Object.freeze((projection.calculation?.values||[]).filter(x=>NUM_FP_CORE_ROLES.includes(x.code)).map(x=>{const m=numFpRoleMeta(x.code,locale);return freeze({role:x.code,label:m.label,brief:m.brief,value:x.value,rawValue:x.rawValue,reductionSteps:Object.freeze([...(x.reductionSteps||[])]),masterNumberPreserved:x.masterNumberPreserved===true,certainty:x.certainty||'UNKNOWN'});}));
}
function relationshipFindings(projection,locale){
 const allValues=(projection.calculation?.values||[]).filter(x=>NUM_FP_CORE_ROLES.includes(x.code)&&Number.isFinite(Number(x.value)));
 const values=allValues.filter(x=>NUM_FP_CUSTOMER_RELATION_ROLES.includes(x.code));
 const byValue=new Map(); for(const x of values){const key=Number(x.value);if(!byValue.has(key))byValue.set(key,[]);byValue.get(key).push(x);}
 const findings=[];
 for(const [value,items] of byValue){if(items.length<2)continue;const roles=items.map(x=>x.code);const labels=roles.map(x=>numFpRoleMeta(x,locale).label);findings.push(freeze({code:'REPEATED_CORE_VALUE',value,roles:Object.freeze(roles),priority:NUM_FP_PRIMARY_ROLES.some(r=>roles.includes(r))?100:82,customerMeaningDepth:'STRUCTURAL_RELATION_ONLY',title:locale==='zh-Hans'?`数字 ${value} 在多个位置重复`:`${value} repeats across roles`,summary:locale==='zh-Hans'?`${sentenceList(labels,locale)}得到同一个归约值 ${value}。这说明多个计算位置出现结构重复，但这些角色仍须分别阅读。`:`${sentenceList(labels,locale)} resolve to the same value ${value}. This is a structural repetition; the roles remain distinct.`}));}
 for(const x of allValues.filter(x=>x.masterNumberPreserved===true&&numFpIsMaster(x.value))){const role=numFpRoleMeta(x.code,locale);findings.push(freeze({code:'MASTER_NUMBER_PRESERVED',value:x.value,roles:Object.freeze([x.code]),priority:88,customerMeaningDepth:'STRUCTURAL_RELATION_ONLY',title:locale==='zh-Hans'?`${role.label}保留主数 ${x.value}`:`${role.label} preserves master number ${x.value}`,summary:locale==='zh-Hans'?`当前归约规则在${role.label}保留 ${x.value}，没有继续化简。此处只陈述计算状态，不附加尚未准入的主数人格或命运含义。`:`The current reduction rule preserves ${x.value} in ${role.label}. This states calculation state only; no unadmitted personality or destiny meaning is added.`}));}
 const cycles=(projection.calculation?.cycles||[]).filter(x=>['PERSONAL_YEAR','PERSONAL_MONTH','PERSONAL_DAY'].includes(x.code));
 for(const c of cycles){const matches=values.filter(v=>v.value===c.value);if(!matches.length)continue;const cycle=numFpRoleMeta(c.code,locale);const labels=matches.map(x=>numFpRoleMeta(x.code,locale).label);findings.push(freeze({code:'CORE_CYCLE_ECHO',value:c.value,roles:Object.freeze(matches.map(x=>x.code)),cycleRole:c.code,priority:c.code==='PERSONAL_YEAR'?78:68,customerMeaningDepth:'STRUCTURAL_RELATION_ONLY',title:locale==='zh-Hans'?`${cycle.label}与核心位置出现同值`:`${cycle.label} echoes a core value`,summary:locale==='zh-Hans'?`${cycle.label}为 ${c.value}，与${sentenceList(labels,locale)}的数值相同。它可作为现实观察线索，但不构成事件预测。`:`${cycle.label} is ${c.value}, matching ${sentenceList(labels,locale)}. It can be used as a reflection cue, not an event prediction.`}));}
 return Object.freeze(findings.sort((a,b)=>b.priority-a.priority||a.code.localeCompare(b.code)||String(a.value).localeCompare(String(b.value))));
}
function meaningClusters(localeProjection){
 const byCode=new Map();
 for(const item of localeProjection?.items||[]){if(!item.meaningCode)continue;const role=roleFromMeaning(item);if(!byCode.has(item.meaningCode))byCode.set(item.meaningCode,{meaningCode:item.meaningCode,label:item.label,definition:item.definition,roles:[]});byCode.get(item.meaningCode).roles.push(role);}
 return Object.freeze([...byCode.values()].map(x=>freeze({...x,roles:Object.freeze([...new Set(x.roles)].filter(Boolean))})));
}
function themes(projection,relationships,locale){
 const out=[];const repeats=relationships.filter(x=>x.code==='REPEATED_CORE_VALUE');for(const x of repeats.slice(0,2))out.push(freeze({themeCode:`REPETITION_${x.value}`,priority:x.priority,title:x.title,summary:x.summary,evidence:Object.freeze(x.roles.map(role=>({type:'ROLE_VALUE',role,value:x.value})))}));
 const masters=relationships.filter(x=>x.code==='MASTER_NUMBER_PRESERVED');for(const x of masters.slice(0,1))out.push(freeze({themeCode:`MASTER_${x.value}`,priority:x.priority,title:x.title,summary:x.summary,evidence:Object.freeze([{type:'MASTER_PRESERVED',role:x.roles[0],value:x.value}])}));
 const echoes=relationships.filter(x=>x.code==='CORE_CYCLE_ECHO');for(const x of echoes){if(out.length>=3)break;out.push(freeze({themeCode:`CYCLE_ECHO_${x.cycleRole}_${x.value}`,priority:x.priority,title:x.title,summary:x.summary,evidence:Object.freeze([{type:'CYCLE_ECHO',cycleRole:x.cycleRole,roles:x.roles,value:x.value}])}));}
 if(!out.length){const vals=(projection.calculation?.values||[]).filter(x=>NUM_FP_PRIMARY_ROLES.includes(x.code));for(const x of vals.slice(0,3)){const role=numFpRoleMeta(x.code,locale);out.push(freeze({themeCode:`CORE_${x.code}`,priority:x.code==='LIFE_PATH'?60:50,title:locale==='zh-Hans'?`${role.label} · ${x.value}`:`${role.label} · ${x.value}`,summary:locale==='zh-Hans'?`${role.label}是本次读取中的一个主要计算位置。`:`${role.label} is one of the primary calculated positions in this reading.`,evidence:Object.freeze([{type:'ROLE_VALUE',role:x.code,value:x.value}])}));}}
 return Object.freeze(out.sort((a,b)=>b.priority-a.priority).slice(0,3));
}
function integratedNarrative(projection,relationships,locale){
 const map=valueMap(projection);const primary=NUM_FP_PRIMARY_ROLES.map(r=>map.get(r)).filter(Boolean);
 const lead=locale==='zh-Hans'?`这次数字结构的主要位置是${sentenceList(primary.map(x=>`${numFpRoleMeta(x.code,locale).label} ${x.value}`),locale)}。`:`The primary calculated positions are ${sentenceList(primary.map(x=>`${numFpRoleMeta(x.code,locale).label} ${x.value}`),locale)}.`;
 const repeat=relationships.find(x=>x.code==='REPEATED_CORE_VALUE');
 const relation=repeat?(locale==='zh-Hans'?`其中 ${repeat.value} 在${sentenceList(repeat.roles.map(r=>numFpRoleMeta(r,locale).label),locale)}重复，因此综合阅读应把“同值、不同角色”放在一起比较，而不是把同一段数字说明重复两次。`:`Value ${repeat.value} repeats in ${sentenceList(repeat.roles.map(r=>numFpRoleMeta(r,locale).label),locale)}, so the integrated reading compares the same value across distinct roles instead of repeating one definition.`):(locale==='zh-Hans'?'主要位置没有出现需要优先合并的同值重复，因此本次读取保留各角色的区别。':'No primary repeated value requires merging, so the reading keeps each role distinct.');
 const cg=cycleGroups(projection);const personal=cg.calendar.filter(x=>['PERSONAL_YEAR','PERSONAL_MONTH','PERSONAL_DAY'].includes(x.code));
 const timing=personal.length?(locale==='zh-Hans'?`目标日期周期为${sentenceList(personal.map(x=>`${numFpRoleMeta(x.code,locale).label} ${x.value}`),locale)}。这些周期只提供结构化观察视角，不证明未来事件。`:`Target-date cycles are ${sentenceList(personal.map(x=>`${numFpRoleMeta(x.code,locale).label} ${x.value}`),locale)}. They are structural reflection lenses, not evidence of future events.`):(locale==='zh-Hans'?'本次没有提供目标日期，因此个人年、月、日周期不参与综合读取。':'No target date was supplied, so Personal Year, Month, and Day do not participate in this reading.');
 return Object.freeze([lead,relation,timing]);
}
function reflectionPrompts(relationships,projection,locale){
 const out=[];const repeat=relationships.find(x=>x.code==='REPEATED_CORE_VALUE');if(repeat){const labels=repeat.roles.map(r=>numFpRoleMeta(r,locale).label);out.push(locale==='zh-Hans'?`在现实经验中，${sentenceList(labels,locale)}这几个位置是否真的呈现相似之处？哪些情境反而能看出它们的角色差异？`:`In lived experience, where do ${sentenceList(labels,locale)} seem similar, and where do their different roles become clearer?`);}
 const echo=relationships.find(x=>x.code==='CORE_CYCLE_ECHO');if(echo){out.push(locale==='zh-Hans'?`当${numFpRoleMeta(echo.cycleRole,locale).label}与核心位置出现同一个数值 ${echo.value} 时，当前现实里有什么主题值得你特别观察，而不是预先假定会发生什么？`:`When ${numFpRoleMeta(echo.cycleRole,locale).label} repeats the core value ${echo.value}, what is worth observing now without assuming a specific event will occur?`);}
 if(out.length<2){out.push(locale==='zh-Hans'?'如果把这些数字只当作不同计算位置，而不是人格标签，哪一个位置最容易与你现在的现实经验进行核对？':'If these numbers are treated as distinct calculated roles rather than personality labels, which role is easiest to compare with your current reality?');}
 if(out.length<3){out.push(locale==='zh-Hans'?'哪些部分与你的经验不吻合？保留这些反例有助于避免把数字解释成完整身份。':'Which parts do not fit your experience? Keeping counterexamples prevents a numeric reading from becoming a total identity claim.');}
 return Object.freeze(out.slice(0,3));
}
function compoundReviewCandidates(projection){return Object.freeze((projection.calculation?.values||[]).filter(x=>numFpIsKarmicCandidateRaw(x.rawValue)).map(x=>freeze({role:x.code,rawValue:x.rawValue,reducedValue:x.value,classification:'SOURCE_REVIEW_CANDIDATE_ONLY',customerMeaningEligible:false})));}
export function buildNumIntegratedReadingIR({projection,bundle,localeProjection}={}){
 if(projection?.method?.publicMethodCode!=='NUMEROLOGY_PROJECTION')fail('NUM_FP_REQUIRES_NUM_PROJECTION');
 if(bundle?.sourceProjection?.projectionId!==projection.projectionId)fail('NUM_FP_PROJECTION_LINEAGE_MISMATCH');
 if(localeProjection?.sourceBundleCode!==bundle.bundleCode)fail('NUM_FP_LOCALE_LINEAGE_MISMATCH');
 const locale=localeProjection.locale==='zh-Hans'?'zh-Hans':'en';const snapshot=coreSnapshot(projection,locale);const relationships=relationshipFindings(projection,locale);const groups=cycleGroups(projection);const meanings=meaningClusters(localeProjection);const standoutThemes=themes(projection,relationships,locale);const richReviewPreview=buildNumRichReviewPreview({snapshot,relationships,calendar:groups.calendar,locale});
 const result={schemaVersion:NUM_INTEGRATED_READING_IR_SCHEMA,rulesSchema:NUM_FP_SCHEMA,runtimeVersion:NUM_FP_VERSION,methodCode:'NUMEROLOGY',publicationState:'PRE_ADMISSION_CANDIDATE',customerPublishable:false,reviewPreviewEligible:true,sourceProjectionId:projection.projectionId,sourceMeaningBundleCode:bundle.bundleCode,locale,executionCompleteness:projection.projection?.status==='COMPLETE'?'COMPLETE':projection.projection?.status==='PARTIAL'?'PARTIAL':'UNAVAILABLE',sections:{snapshot,standoutThemes,relationships,canonicalMeaningClusters:meanings,timing:{calendar:groups.calendar,pinnacles:groups.pinnacles,challenges:groups.challenges,lifePeriod:{availability:'BLOCKED_NOT_IN_CURRENT_CALCULATION_AUTHORITY'}},integratedNarrative:integratedNarrative(projection,relationships,locale),realityReflection:reflectionPrompts(relationships,projection,locale),calculationDetails:{values:snapshot,structures:projection.calculation?.structures||[],evidence:projection.evidence||[],unknown:projection.unknown||[]},sourceReviewCandidates:{karmicDebtCompounds:compoundReviewCandidates(projection)},richReviewPreview},semanticDepth:{numberMeaning:'STRUCTURAL_SLOT_ONLY',roleNumberRichMeaning:'NOT_ADMITTED',relationships:'STRUCTURAL_RELATION_ONLY',timingMeaning:'STRUCTURAL_CYCLE_ONLY'},deduplication:{canonicalMeaningsBefore:(localeProjection.items||[]).length,canonicalMeaningClustersAfter:meanings.length,repeatedRoleDefinitionsSuppressed:true},boundaries:{fortunePredictionCreated:false,professionalJudgmentCreated:false,recalculated:false,meaningInvented:false,karmicDebtMeaningAsserted:false,lifePeriodInvented:false,identityFactCreated:false}};
 return freeze(result);
}
export default Object.freeze({buildNumIntegratedReadingIR});
