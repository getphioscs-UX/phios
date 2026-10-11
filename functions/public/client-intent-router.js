import {ASK_CAPABILITIES} from '../../assets/js/ask-entry-capabilities.js';
import {routeHealthSafety} from '../health/health-reality-runtime.js';
const rules=[
 ['PHI_CONFIGURATION',/phi\s*(?:configuration|构型)|构型/i,6],['PROFILE',/profile|个人画像|自陈|测评/i,5],
 ['ACADEMY',/academy|learning|course|tutorial|video lesson|learn|study|学院|学习|课程|视频教学/i,6],
 ['BOOKS',/books|book\s*(?:[1-7]|i{1,3}|iv|v|vi|vii)\b|book catalog|书籍|书册|书库|阅读第|读第/i,6],
 ['WILL',/遗嘱|estate planning|\b(?:will (?:draft|writing|information)|(?:prepare|write|draft|executed|a|the|my|signed) (?:a |my )?will)\b/i,6],
 ['CONTINUITY',/continuity|membership|subscription|quota|会员|订阅|额度/i,6],
 ['THESIS',/thesis|research\s*(?:paper|pdf)|核心论述|论文|研究 PDF/i,6],
 ['PROFESSIONAL',/professional (?:assistance|service|help)|consultation|专业(?:协助|服务|帮助)|咨询服务/i,5],
 ['PERSONAL_METHODS',/八字|四柱|紫微|占星|人类图|数字学|bazi|four pillars|zi\s*wei|astrology|human design|numerology|birth chart|personal methods|个人方法/i,5],
 ['RELATIONSHIP',/关系|丈夫|伴侣|夫妻|relationship|husband|wife|partner|spouse/i,3],
 ['FINANCIAL',/财务|收支|现金流|收入|支出|预算|financial|finances|cash flow|income|expense|budget/i,3],
 ['WORLD',/文明|重组|世界|政策|atlas|civilization|reconfiguration|world|policy/i,3],
 ['HEALTH_CARE',/健康|照护|症状|\b(?:health|care|symptoms?)\b/i,3],
 ['REFLECTION',/塔罗|易经|问题与反思|反思|reflection|tarot|i ching/i,5],
 ['REALITY',/报告.*(?:不一致|经历)|我的现实|继续现实|my reality|report.*(?:experience|disagree|different)/i,6]
];
const aliases={PERSONAL:'PERSONAL_METHODS',FINANCIAL:'FINANCIAL',REALITY:'REALITY',JOURNEY:'REALITY',LEARN:'KNOWLEDGE',WORK:'PROFESSIONAL',KNOWLEDGE:'KNOWLEDGE'};
const caps=ASK_CAPABILITIES.capabilities;
const methodMentions=q=>[['BAZI',/八字|四柱|bazi|four pillars/i],['ASTROLOGY',/占星|astrology/i],['ZI_WEI_DOU_SHU',/紫微|zi\s*wei/i],['NUMEROLOGY',/数字学|numerology/i],['HUMAN_DESIGN',/人类图|human design/i],['ECR',/构型|phi configuration/i],['TAROT',/塔罗|tarot/i],['I_CHING',/易经|i ching/i]].filter(([,pattern])=>pattern.test(q)).map(([id])=>id);
const routingText=raw=>raw.replace(/(?:不想|不要|不需要|不感兴趣|不喜欢|别推荐|不是(?:问|要了解)|don't want|do not want|not interested in|not asking about|do not recommend|don't recommend|no need for)\s*[\s\S]*?(?=[，,。.;；!?！？]|\bbut\b|\binstead\b|而是|但是|但|只想|$)/ig,'').replace(/(?:[“"][^”"]*[”"]|‘[^’]*’)/g,'');
const methodTargets={BAZI:['PERSONAL_METHODS','/perspectives/personal/?method=bazi#personal-input','BaZi','八字'],ASTROLOGY:['PERSONAL_METHODS','/perspectives/personal/?method=astrology#personal-input','Astrology','占星'],ZI_WEI_DOU_SHU:['PERSONAL_METHODS','/perspectives/personal/?method=ziwei#personal-input','Zi Wei','紫微'],NUMEROLOGY:['PERSONAL_METHODS','/perspectives/personal/?method=numerology#personal-input','Numerology','数字学'],HUMAN_DESIGN:['PERSONAL_METHODS','/perspectives/personal/#perspective-human-design','Human Design','人类图'],ECR:['PHI_CONFIGURATION','/perspectives/phi-configuration/','PHI Configuration','PHI 构型'],TAROT:['REFLECTION','/perspectives/tarot/','Tarot','塔罗'],I_CHING:['REFLECTION','/perspectives/iching/','I Ching','易经']};
const methodCandidate=(id,locale)=>{const [cap,fallback,en,zh]=methodTargets[id];const registered=ASK_CAPABILITIES.methods.find(m=>m.methodId===id);const href=cap==='PERSONAL_METHODS'&&registered?.formValue?'/perspectives/personal/?method='+encodeURIComponent(registered.formValue)+'#personal-input':fallback;return {...caps.find(c=>c.capabilityId===cap),canonicalRoute:href,methodId:id,displayLabels:{en,'zh-Hans':zh},label:locale==='zh-Hans'?zh:en};};
function classifyClientIntent(input={}){
 const raw=String(input.question||input.q||'').normalize('NFKC').trim(),locale=input.locale==='zh-Hans'?'zh-Hans':'en',zh=locale==='zh-Hans';
 const base={schemaVersion:'PHI-OS-CLIENT-INTENT-ROUTE-v2',indexVersion:ASK_CAPABILITIES.version,task:'ENTRY',generationMode:'DETERMINISTIC',providerInvoked:false,providerCalls:0,questionPresent:!!raw,boundaries:{methodChosenByClientRouter:false,lensExecutionAllowed:false,modelCalculationAllowed:false,persistenceAllowed:false,automaticRealityCase:false,automaticJourneyActivation:false}};
 const result=(outcome,ids=[],clarification=null)=>{const candidates=ids.slice(0,3).map(id=>caps.find(c=>c.capabilityId===id)).filter(Boolean).map(c=>({...c,label:c.displayLabels[locale],reason:zh?'与你的问题中明确的主题或任务相关；由你选择继续。':'Matches an explicit topic or task; you choose whether to continue.'}));return {...base,outcome,candidates,clarification,surface:candidates[0]?.capabilityId||'ASK',href:candidates[0]?.canonicalRoute||'/knowledge/ask/',routeReason:outcome};};
 if(!raw&&!input.capabilityId&&!input.surface)return result('NEEDS_INPUT',[],zh?'你想了解什么？':'What would you like to understand?');
 if(raw.length>2000)return {...result('NEEDS_INPUT'),error:'QUESTION_TOO_LONG'};
 const safety=routeHealthSafety({question:raw});if(['EMERGENCY','URGENT_EVALUATION'].includes(safety.careState))return {...result('PROFESSIONAL_HANDOFF',['HEALTH_CARE']),safety};
 const q=routingText(raw);
 const brand=/\bphi[\s-]*os\b/i.test(q);
 if(/book\s*(?:viii|8)\b|第?八册|第八部/i.test(q))return {...result('LIMITED_SUPPORT'),href:'/books/',clarification:zh?'第八册是非公开销售的 operating volume；可以从公开书籍目录继续。':'Book VIII is an operating volume outside public sale; you can continue through the public books catalog.',primaryAction:{href:'/books/',label:zh?'公开书籍目录':'Public book catalog'}};
 if(/遗嘱|\bwill\b/i.test(q)&&/法律效力|签署生效|有法律效力|legally valid|executed|guarantee.*legal/i.test(q))return {...result('LIMITED_SUPPORT',['WILL']),clarification:zh?'现有功能是遗嘱资料整理稿，不能生成具有法律效力的签署遗嘱。':'The available function produces an informational Will draft, not a legally valid executed Will.'};
 if(/诊断|完整健康报告|diagnos|full health report/i.test(q))return {...result('LIMITED_SUPPORT',['HEALTH_CARE']),clarification:zh?'现有入口只提供健康整理与现实照护路由，不提供诊断或完整健康报告。':'The existing entrance supports health organization and care routing, not diagnosis or a full health report.'};
 const chosen=caps.find(c=>c.capabilityId===input.capabilityId);if(chosen&&input.selectionConfirmed===true){const id=input.selectedMethodId;if(id&&(!methodTargets[id]||methodTargets[id][0]!==chosen.capabilityId))return {...result('NEEDS_CLARIFICATION'),error:'METHOD_SELECTION_NOT_IN_CAPABILITY'};if(id){const candidate=methodCandidate(id,locale);return {...result('MATCHED_CAPABILITY',[chosen.capabilityId]),href:candidate.canonicalRoute,candidates:[candidate]};}return {...result('MATCHED_CAPABILITY',[chosen.capabilityId]),task:/下载|付款状态|已买|账户|预约|退款|取消订阅|download|payment status|purchased|account|appointment|refund|cancel subscription|how (?:do i|to) use/i.test(q)?'PRODUCT_HELP':'ENTRY'};}
 const introduction=/是什么|什么是|介绍|说明|用途|用来|关于|如何(?:使用|用)|怎么(?:使用|用)|怎样(?:使用|用)|有什么功能|能做什么|如何开始|\b(?:about|what\s+is|introduce|introduction|how\s+(?:do\s+i\s+)?use|how\s+to\s+use|features?|overview|purpose|what\s+can|can\s+(?:it|you)\s+do|get\s+started|tell\s+me\s+about)\b/i.test(q);
 if((brand||/这个(?:平台|网站|系统)|这里|this (?:platform|site)|your platform/i.test(q))&&(introduction||/^\s*phi[\s-]*os[?？!！。.]?\s*$/i.test(q)))return {...result('PLATFORM_INTRODUCTION',['ABOUT']),surface:'ABOUT',href:'/about/founder/#how',primaryAction:{href:'/about/founder/#how',label:zh?'了解 PHI OS 与使用方式':'Learn about PHI OS and how to use it'},auxiliaryActions:[{href:'/knowledge/',label:zh?'探索知识':'Explore knowledge'},{href:'/reality/',label:zh?'进入 My Reality':'Open My Reality'}]};
 if(/下载|付款状态|已买|账户|预约|退款|取消订阅|download|payment status|purchased|account|appointment|refund|cancel subscription|how (?:do i|to) use/i.test(q)){
  const helpIds=[...new Set(rules.filter(([,pattern])=>pattern.test(q)).map(([id])=>id))];
  if(/预约|appointment/i.test(q))return {...result('PRODUCT_HELP',['APPOINTMENT']),task:'PRODUCT_HELP'};
  if(/已买|付款状态|账户|purchased|payment status|account|refund|退款/i.test(q))return {...result('PRODUCT_HELP',['PRODUCT_HELP']),task:'PRODUCT_HELP'};
  if(helpIds.length>1)return {...result('MULTI_DOMAIN_CLARIFY',helpIds,zh?'你想先处理哪一个功能的使用问题？':'Which function would you like help using first?'),task:'PRODUCT_HELP'};
  return {...result('PRODUCT_HELP',helpIds.length?helpIds:['PRODUCT_HELP']),task:'PRODUCT_HELP'};
 }
 if(/今天|最新|today|latest/i.test(q)&&/政策|policy/i.test(q))return result('NEEDS_INPUT',['WORLD'],zh?'涉及哪个地区、哪项政策和日期？请先选择当前来源；历史资料不能证明今天的影响。':'Which jurisdiction, policy and date? Select a current source first; historical material cannot establish today’s effect.');
 const explanatory=/为什么|为何|为啥|怎么会|如何|怎样(?:形成|影响|理解)|原因是什么|形成原因|理解.*(?:原因|概念|含义)|解释|\b(?:why|how|explain|what\s+causes|what\s+makes|tell\s+me\s+about)\b/i.test(q);
 if(input.task==='KNOWLEDGE_BASIC'||explanatory)return {...result('KNOWLEDGE_LOOKUP',['KNOWLEDGE']),task:'KNOWLEDGE_BASIC',query:raw,retrievalQuery:q,generalExplanation:true};
 if(input.task==='KNOWLEDGE_BASIC'||/什么是|是什么意思|在哪里读|哪里读|文章|知识|有什么不同|比较|what is|what are|means|where.*read|article|knowledge|definition|difference|compare/i.test(q))return {...result('KNOWLEDGE_LOOKUP',['KNOWLEDGE']),task:'KNOWLEDGE_BASIC',query:raw,retrievalQuery:q};

 const explicit=caps.find(c=>c.capabilityId===input.capabilityId)?.capabilityId||aliases[String(input.surface||'').toUpperCase()];if(explicit)return result('MATCHED_CAPABILITY',[explicit]);
 const scores=rules.filter(([,r])=>r.test(q)).map(([id,,score])=>({id,score})).sort((a,b)=>b.score-a.score);
 const ids=[...new Set(scores.map(s=>s.id))];
 if(methodMentions(q).length>1&&['PERSONAL_METHODS','PHI_CONFIGURATION','REFLECTION'].includes(ids[0])){const r=result('MULTI_DOMAIN_CLARIFY',ids,zh?'你提到了多个方法。请选择先进入的方法；这里不会执行计算或抽牌。':'You mentioned multiple methods. Choose one to enter first; no calculation or draw is performed here.');return {...r,candidates:methodMentions(q).slice(0,3).map(id=>methodCandidate(id,locale))};}
 if(ids.length>1)return result('MULTI_DOMAIN_CLARIFY',ids,zh?'你提到了多个领域。请选择先处理的方面。':'You mentioned multiple areas. Choose which one to address first.');
 if(ids.length){let r=result('MATCHED_CAPABILITY',ids);if(ids[0]==='PERSONAL_METHODS'){const m=ASK_CAPABILITIES.methods.find(m=>m.formValue&&new RegExp(({BAZI:'八字|四柱|bazi|four pillars',ZI_WEI_DOU_SHU:'紫微|zi\\s*wei',ASTROLOGY:'占星|astrology',NUMEROLOGY:'数字学|numerology'})[m.methodId]||'(?!)','i').test(q));if(m)r={...r,href:'/perspectives/personal/?method='+encodeURIComponent(m.formValue)+'#personal-input',candidates:r.candidates.map((c,i)=>i?c:{...c,canonicalRoute:'/perspectives/personal/?method='+encodeURIComponent(m.formValue)+'#personal-input'})};}if(ids[0]==='REFLECTION'&&/易经|i ching/i.test(q))r={...r,href:'/perspectives/iching/',candidates:r.candidates.map((c,i)=>i?c:{...c,canonicalRoute:'/perspectives/iching/'})};return r;}
 if(/工作|career|job|work/i.test(q))return result('MULTI_DOMAIN_CLARIFY',['REALITY','KNOWLEDGE'],zh?'你想整理自己的工作处境，还是理解一个一般工作概念？':'Would you like to organize your work situation or understand a general work concept?');
 if(/不知道从哪里|不知从何|我想了解|不确定|uncertain|not sure|where.*start|feel lost/i.test(q))return result('NEEDS_CLARIFICATION',[],zh?'你想找一个功能、理解一般知识，还是整理当前处境？':'Are you looking for a function, general knowledge, or a way to organize your current situation?');
 return result('NO_MATCH',[],zh?'目前没有可靠的对应功能。请补充你想了解的主题，或直接浏览知识。':'No supported capability matches yet. Clarify the topic or browse knowledge directly.');
}

export function routeClientIntent(input={}){
 const route=classifyClientIntent(input),ids=[...new Set(route.candidates.map(c=>c.capabilityId))];
 const domainHints=rules.filter(([,pattern])=>pattern.test(routingText(String(input.question||input.q||'')))).flatMap(([id])=>caps.find(c=>c.capabilityId===id)?.canonicalDomainRefs||[]);
 const taskAxis=route.task==='KNOWLEDGE_BASIC'?'KNOWLEDGE_BASIC':route.task==='PRODUCT_HELP'||route.outcome==='PRODUCT_HELP'?'PRODUCT_HELP':route.outcome==='PROFESSIONAL_HANDOFF'?'SAFETY_HANDOFF':ids[0]==='REALITY'&&route.outcome==='MATCHED_CAPABILITY'?'REALITY_NAVIGATION':'ENTRY';
 return {...route,ruleVersion:'ENTRY_TASK_DOMAIN_R1',axes:{task:taskAxis,canonicalDomains:[...new Set([...route.candidates.flatMap(c=>c.canonicalDomainRefs||[]),...domainHints])],products:ids,methodSelection:route.href?.includes('?method=')?new URL(route.href,'https://phios.local').searchParams.get('method'):null},handoff:{execution:'DISCOVERY_ONLY',originalQuestionTransport:'EXPLICIT_SAME_ORIGIN_EPHEMERAL_INPUT_ONLY',automaticGeneration:false,automaticPersistence:false,providerCalls:0}};
}
