// Explicit contract-version candidate. No production import or activation.
// Existing publication/rights owner supplies units; no permission minted here.
import {understandKirQuestion,expandKirQuery} from './kir-r2-intelligence.js';
import {rerankKirContentFragments} from './kir-r2-answer-intelligence.js';
import {queryTerms} from '../knowledge-runtime/manuscript-source-runtime.js';
const norm=s=>String(s||'').normalize('NFKC').toLowerCase();
const uniq=a=>[...new Set(a)];
export function argumentTypes(text){
 const s=norm(text),out=[];
 for(const [kind,re] of [['DEFINITION',/是指|定义|means|defined|refers to/],['MECHANISM',/因为|导致|使得|因此|because|leads to|through|affects/],['CONDITION',/如果|当|取决于|if\b|when\b|depends/],['DISTINCTION',/区别|不同|并不等于|rather than|unlike|difference/],['LIMITATION',/不能|不一定|未必|限制|not necessarily|cannot|limited/],['EXAMPLE',/例如|比如|for example|such as/],['UNKNOWN',/未知|尚无|不清楚|unknown|uncertain/]])if(re.test(s))out.push(kind);
 return out.length?out:['UNCLASSIFIED'];
}
export function questionRequirements(question,locale='en'){
 if(typeof question!=='string'||!question.trim()||question.length>500)throw Error('QUESTION_INVALID');
 if(!['en','zh-Hans'].includes(locale))throw Error('LOCALE_INVALID');
 const q=norm(question);let type=/计算|多少|百分|比率|\bcalculate|\bhow much|\bhow many|\bpercentage|\brate in/.test(q)?'FACT':/比较|相比|差别|区别|compare|versus|difference|\bvs\b/.test(q)?'COMPARISON':/我该|我应该|should i|my choice/.test(q)?'PERSONAL':/假如|如果.*会|what if|suppose/.test(q)?'SCENARIO':/为什么|为何|why|how does|如何影响/.test(q)?'MECHANISM':'DEFINITION';
 if(/计算|calculate/.test(q))type='CALCULATION';
 const dimensions={FACT:['OBSERVATION','TIME','DEFINITION'],MECHANISM:['CAUSE','TRANSMISSION','CONDITIONS'],COMPARISON:['SIDE_A','SIDE_B','COMMON_DEFINITION','DIFFERENCE'],CALCULATION:['INPUTS','FORMULA','UNITS'],PERSONAL:['KNOWN_CONDITIONS','OPTIONS','UNKNOWNS'],SCENARIO:['ASSUMPTION','MECHANISM','LIMITS'],DEFINITION:['MEANING','BOUNDARY']}[type];
 return {version:'QUESTION-REQUIREMENT-LOCAL-1',question,locale,type,requirements:dimensions.map(id=>({id,required:true})),specificPoints:question.split(/[；;]|\band\b|以及/u).map(s=>s.trim()).filter(Boolean),humanConfirmed:false};
}
export function retrieveQuality({question,locale='en',units,concepts=[],profiles=[],adjudications=[]}){
 const contract=questionRequirements(question,locale),understanding=understandKirQuestion({question,locale});
 const matchedConcepts=concepts.filter(c=>[c.en,c['zh-Hans']].filter(Boolean).some(t=>norm(question).includes(norm(t))));
 const expanded=uniq([...queryTerms(question),...matchedConcepts.flatMap(c=>[c.en,c['zh-Hans']]).filter(Boolean)]);
 const eligible=units.filter(u=>u.permission?.qaEligible===true&&u.permission?.publicationOwnerVerified===true&&!u.permission?.revoked&&u.language===locale);
 // Reuse current KIR scorer; semantic vectors intentionally not fabricated.
 const expansion=expandKirQuery(understanding,profiles);
 const ranked=rerankKirContentFragments({understanding:{...understanding,question:question+' '+expanded.join(' ')},expansion,contentSources:eligible.map(u=>({...u,sourceId:u.id,text:u.text,locale:u.language}))});
 // Offline sparse retrieval: term rarity and length normalization reduce the
 // advantage of long, broadly related paragraphs. This is BM25, not an embedding.
 const tokenLists=eligible.map(u=>queryTerms(u.text));
 const average=tokenLists.reduce((n,t)=>n+t.length,0)/Math.max(1,tokenLists.length);
 const documents=new Map(eligible.map((u,i)=>[u.id,tokenLists[i]]));
 const df=new Map(expanded.map(t=>[t,tokenLists.filter(list=>list.includes(t)).length]));
 const scored=ranked.results.map(row=>{const tokens=documents.get(row.sourceId)||[],body=norm(row.text);let sparse=0;
  for(const term of expanded){if(!tokens.includes(term)&&!body.includes(norm(term)))continue;const frequency=Math.min(4,body.split(norm(term)).length-1);const rarity=Math.log(1+(eligible.length-(df.get(term)||0)+.5)/((df.get(term)||0)+.5));sparse+=rarity*(frequency*2.2)/(frequency+1.2*(.25+.75*tokens.length/Math.max(1,average)));}
  return {...row,rerankScore:Number((sparse+.15*row.rerankScore).toFixed(5)),features:{...row.features,sparseBM25:sparse,semanticVector:false}};
 }).sort((a,b)=>b.rerankScore-a.rerankScore||a.sourceId.localeCompare(b.sourceId));
 const reading=scored.slice(0,20).map(row=>{
  const unit=eligible.find(u=>u.id===row.sourceId),hits=queryTerms(question).filter(t=>norm(unit.text).includes(t));
  const review=adjudications.find(a=>a.question===question&&a.locale===locale&&a.unitId===unit.id&&a.textVersion===unit.textVersion&&a.humanAccepted===true);
  // Heuristic hints are not entailment or human approval. Never upgrade background by count.
  const classification=review?.classification||'BACKGROUND';
  return {...row,unit,classification,supports:review?.supports||[],matchedTerms:hits,reviewed:Boolean(review),score:row.rerankScore};
 });
 const evidence=reading.filter(r=>['DIRECT','PARTIAL'].includes(r.classification)).sort((a,b)=>(a.classification==='DIRECT'?-1:0)-(b.classification==='DIRECT'?-1:0)||b.score-a.score);
 const covered=uniq(evidence.flatMap(e=>e.supports)).filter(id=>contract.requirements.some(r=>r.id===id));
 const missing=contract.requirements.filter(r=>!covered.includes(r.id)).map(r=>r.id);
 return {contract,expandedConceptIds:matchedConcepts.map(c=>c.id),relatedReading:reading,answerEvidence:evidence,coverage:{covered,missing,complete:missing.length===0},providerCalls:0};
}
export function minimalEvidencePack(result,{maxChars=6000,maxSources=5}={}){
 const rows=[];let chars=0;
 for(const r of result.answerEvidence){if(rows.length>=maxSources)break;if(chars+r.text.length>maxChars)continue;rows.push({sourceId:r.sourceId,text:r.text,version:r.unit.textVersion,href:r.unit.href,supports:r.supports});chars+=r.text.length;}
 return {question:result.contract.question,locale:result.contract.locale,sources:rows,chars,missing:result.contract.requirements.filter(p=>!rows.some(r=>r.supports.includes(p.id))).map(p=>p.id),paidAuthorization:false};
}
export function customerAnswer(result){
 const zh=result.contract.locale==='zh-Hans',pack=minimalEvidencePack(result);
 return {directAnswer:pack.sources.length?(zh?'这些原文支持问题的一部分；尚未核实的部分仍需补齐。':'These passages support part of the question; the remaining points still need verification.'):(zh?'已找到可能相关的阅读材料，但尚未核实它们能解释你所问的具体原因。可以先查看段落，明确需要查证的环节。':'There is potentially relevant reading, but its support for your specific question has not been verified. Inspect the passages and identify the link that needs checking.'),evidence:pack.sources,reading:result.relatedReading.slice(0,5).map(r=>({title:r.title,text:r.text,href:r.unit.href})),nextSteps:zh?['查看相关原文及适用条件','补充你要核实的事实或比较对象']:['Check the passages and their conditions','Specify the fact or comparison you want to verify'],complete:result.coverage.complete&&pack.missing.length===0,providerCalls:0};
}
