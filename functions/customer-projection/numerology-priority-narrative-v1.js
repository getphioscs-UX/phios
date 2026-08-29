import {numerologyPublicLabel} from './numerology-public-labels-v1.js';
const arr=value=>Array.isArray(value)?value:[];
const clean=value=>String(value??'').trim();
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
const norm=text=>clean(text).toLowerCase().replace(/\s+/g,' ');
const tierWeight=Object.freeze({P0:700,P1:600,P2:500,P3:400,P4:300,P5:200,P6:100});
function item({id,tier,kind,title,summary,anchorRefs=[],sourceClaimIds=[],evidence=[]}){return freeze({id,tier,kind,title,summary,anchorRefs:arr(anchorRefs),sourceClaimIds:arr(sourceClaimIds).filter(Boolean),evidence:arr(evidence)})}
function titleForRole(role,value,locale){const label=numerologyPublicLabel(role,locale);return value==null?label:`${label} ${value}`}
export function buildNumerologyPriorityNarrative({integratedReading,chartModel,locale='en',limit=5}={}){
 const ir=integratedReading||{},rich=ir.sections?.richReading||{},depth=ir.sections?.depth?.sections||{};const candidates=[];
 for(const theme of arr(ir.sections?.standoutThemes))candidates.push(item({id:`THEME:${theme.themeCode}`,tier:'P0',kind:'WHOLE_CHART_THEME',title:theme.title||theme.themeCode,summary:theme.summary||'',anchorRefs:arr(theme.evidence).map(x=>x.role).filter(Boolean),evidence:theme.evidence}));
 for(const reading of arr(rich.roleReadings).filter(x=>x?.runtimeUseAllowed===true))candidates.push(item({id:`ROLE:${reading.role}:${reading.value}`,tier:'P1',kind:'CORE_ROLE_READING',title:titleForRole(reading.role,reading.value,locale),summary:reading.text||'',anchorRefs:[reading.role]}));
 for(const reading of arr(depth.nameRoleMeanings))candidates.push(item({id:`NAME:${reading.role}:${reading.value}`,tier:'P3',kind:'NAME_ROLE_READING',title:titleForRole(reading.role,reading.value,locale),summary:reading.text||'',anchorRefs:[reading.role],sourceClaimIds:[reading.sourceClaimId]}));
 for(const reading of arr(depth.longCycleMeanings))candidates.push(item({id:`CYCLE:${reading.role}:${reading.cycleNumber??''}:${reading.value}`,tier:'P4',kind:'LONG_CYCLE_READING',title:titleForRole(reading.role,reading.value,locale),summary:reading.text||'',anchorRefs:[reading.role],sourceClaimIds:[reading.sourceClaimId]}));
 for(const reading of arr(depth.energyPatternMeanings))candidates.push(item({id:`ENERGY:${reading.sourceClaimId}`,tier:'P6',kind:'ENERGY_PATTERN_READING',title:numerologyPublicLabel('ENERGY_PATTERN',locale),summary:reading.text||'',anchorRefs:['ENERGY_PATTERN'],sourceClaimIds:[reading.sourceClaimId]}));
 const seen=new Set();const sorted=candidates.filter(x=>{const k=norm(x.summary||x.title);if(!k||seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>(tierWeight[b.tier]||0)-(tierWeight[a.tier]||0));
 const selected=[];const core=sorted.filter(x=>x.tier==='P0').slice(0,2);selected.push(...core);
 for(const x of sorted){if(selected.includes(x))continue;if(selected.length>=limit)break;selected.push(x)}
 return freeze({schemaVersion:'PHI-OS-NUM-CX-PRIORITY-NARRATIVE-v1.0.0',work:'NUM-CX-W9',items:selected.map((x,i)=>freeze({...x,rank:i+1})),suppressedCount:Math.max(0,sorted.length-selected.length),boundaries:{newMeaningCreated:false,semanticDedupApplied:true,priorityChangesTruthValue:false,chartAnchorRequired:true}})
}
export default Object.freeze({buildNumerologyPriorityNarrative});
