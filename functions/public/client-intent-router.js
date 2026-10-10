import {ASK_CAPABILITIES} from '../../assets/js/ask-entry-capabilities.js';
import {routeHealthSafety} from '../health/health-reality-runtime.js';
const rules=[
 ['PHI_CONFIGURATION',/phi\s*(?:configuration|构型)|构型/i,6],['PROFILE',/profile|个人画像|自陈|测评/i,5],
 ['PERSONAL_METHODS',/八字|紫微|占星|人类图|数字学|bazi|zi\s*wei|astrology|human design|numerology|birth chart/i,5],
 ['RELATIONSHIP',/关系|丈夫|伴侣|夫妻|relationship|husband|wife|partner/i,3],
 ['FINANCIAL',/财务|现金流|收入|支出|预算|financial|cash flow|income|expense|budget/i,3],
 ['WORLD',/文明|重组|世界|政策|atlas|civilization|reconfiguration|world|policy/i,3],
 ['HEALTH_CARE',/健康|照护|症状|health|care|symptom/i,3],
 ['REFLECTION',/塔罗|易经|tarot|i ching/i,5],
 ['REALITY',/报告.*(?:不一致|经历)|我的现实|继续现实|my reality|report.*(?:experience|disagree|different)/i,6]
];
const aliases={PERSONAL:'PERSONAL_METHODS',FINANCIAL:'FINANCIAL',REALITY:'REALITY',JOURNEY:'REALITY',LEARN:'KNOWLEDGE',WORK:'PROFESSIONAL',KNOWLEDGE:'KNOWLEDGE'};
const caps=ASK_CAPABILITIES.capabilities;
export function routeClientIntent(input={}){
 const raw=String(input.question||input.q||'').trim(),locale=input.locale==='zh-Hans'?'zh-Hans':'en',zh=locale==='zh-Hans';
 const base={schemaVersion:'PHI-OS-CLIENT-INTENT-ROUTE-v2',indexVersion:ASK_CAPABILITIES.version,task:'ENTRY',generationMode:'DETERMINISTIC',providerInvoked:false,providerCalls:0,questionPresent:!!raw,boundaries:{methodChosenByClientRouter:false,lensExecutionAllowed:false,modelCalculationAllowed:false,persistenceAllowed:false,automaticRealityCase:false,automaticJourneyActivation:false}};
 const result=(outcome,ids=[],clarification=null)=>{const candidates=ids.slice(0,3).map(id=>caps.find(c=>c.capabilityId===id)).filter(Boolean).map(c=>({...c,label:c.displayLabels[locale],reason:zh?'与你的问题中明确的主题或任务相关；由你选择继续。':'Matches an explicit topic or task; you choose whether to continue.'}));return {...base,outcome,candidates,clarification,surface:candidates[0]?.capabilityId||'ASK',href:candidates[0]?.canonicalRoute||'/knowledge/ask/',routeReason:outcome};};
 if(!raw&&!input.capabilityId&&!input.surface)return result('NEEDS_INPUT',[],zh?'你想了解什么？':'What would you like to understand?');
 if(raw.length>2000)return {...result('NEEDS_INPUT'),error:'QUESTION_TOO_LONG'};
 const safety=routeHealthSafety({question:raw});if(['EMERGENCY','URGENT_EVALUATION'].includes(safety.careState))return {...result('PROFESSIONAL_HANDOFF',['HEALTH_CARE']),safety};
 if(/下载|付款状态|已买|账户|预约|download|payment status|purchased|account|appointment/i.test(raw))return result('PRODUCT_HELP',[/预约|appointment/i.test(raw)?'PROFESSIONAL':'PRODUCT_HELP']);
 if(input.task==='KNOWLEDGE_BASIC'||/什么是|是什么意思|在哪里读|哪里读|文章|知识|有什么不同|比较|what is|what are|means|where.*read|article|difference|compare/i.test(raw))return {...result('KNOWLEDGE_LOOKUP',['KNOWLEDGE']),task:'KNOWLEDGE_BASIC'};
 if(/今天|最新|today|latest/i.test(raw)&&/政策|policy/i.test(raw))return result('NEEDS_INPUT',['WORLD'],zh?'涉及哪个地区、哪项政策和日期？请先选择当前来源；历史资料不能证明今天的影响。':'Which jurisdiction, policy and date? Select a current source first; historical material cannot establish today’s effect.');
 const explicit=caps.find(c=>c.capabilityId===input.capabilityId)?.capabilityId||aliases[String(input.surface||'').toUpperCase()];if(explicit)return result('MATCHED_CAPABILITY',[explicit]);
 const q=raw.replace(/(?:不想|不要|不是|don't want|do not want|not interested in)\s*(?:抽|看|用|draw|use|a)?\s*(?:塔罗|易经|tarot|i ching)/ig,'');
 const scores=rules.filter(([,r])=>r.test(q)).map(([id,,score])=>({id,score})).sort((a,b)=>b.score-a.score);
 const ids=[...new Set(scores.map(s=>s.id))];
 if(ids.length>1&&scores[0].score<5)return result('MULTI_DOMAIN_CLARIFY',ids,zh?'先处理哪一部分：工作与生活、关系，还是收入与支出？':'Which part should we start with: work and life, relationships, or income and expenses?');
 if(ids.length){let r=result('MATCHED_CAPABILITY',ids);if(ids[0]==='PERSONAL_METHODS'){const m=ASK_CAPABILITIES.methods.find(m=>m.formValue&&new RegExp(({BAZI:'八字|bazi',ZI_WEI_DOU_SHU:'紫微|zi\\s*wei',ASTROLOGY:'占星|astrology',NUMEROLOGY:'数字学|numerology'})[m.methodId]||'(?!)','i').test(q));if(m)r={...r,href:'/perspectives/personal/?method='+encodeURIComponent(m.formValue)+'#personal-input',candidates:r.candidates.map((c,i)=>i?c:{...c,canonicalRoute:'/perspectives/personal/?method='+encodeURIComponent(m.formValue)+'#personal-input'})};}if(ids[0]==='REFLECTION'&&/易经|i ching/i.test(q))r={...r,href:'/perspectives/iching/',candidates:r.candidates.map((c,i)=>i?c:{...c,canonicalRoute:'/perspectives/iching/'})};return r;}
 if(/工作|career|job|work/i.test(q))return result('MULTI_DOMAIN_CLARIFY',['REALITY','PERSONAL_METHODS'],zh?'你想整理实际工作处境，还是了解一种个人方法？':'Would you like to organize your work situation or explore a personal method?');
 return result('NO_MATCH',[],zh?'目前没有可靠的对应功能。请补充你想了解的主题，或直接浏览知识。':'No supported capability matches yet. Clarify the topic or browse knowledge directly.');
}
