import fs from 'node:fs';import assert from 'node:assert/strict';
const dir='tools/review/free-ask-manuscript-r1/',base=process.env.PHIOS_LIVE_BASE||'https://getphios.com';
const source=JSON.parse(fs.readFileSync('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v5.json')).records.find(r=>r.bookCode==='BOOK-3');
const cases=[
{id:'LIVE-MAINTENANCE',q:'为什么持续运行必然产生维护需求？',terms:['成本','起点']},
{id:'LIVE-RESIDUAL',q:'残余负荷是什么，为什么事情结束了却还没有真正结束？',terms:['负荷','容量']},
{id:'LIVE-CAPACITY',q:'维持容量为什么决定一个运行还能持续多久？',terms:['当前','资源']},
{id:'LIVE-SHARED',q:'共享资源为什么会产生协调需要？',terms:['其他','资源']},
{id:'LIVE-CONTINUITY',q:'可持续连续是不是表示现实可以永远不变？',terms:['下一轮','条件']},
{id:'LIVE-COMPARE',q:'运行饱和与单纯高负荷有什么区别？',terms:['高负荷','自由空间']},
{id:'LIVE-NEW-1',q:'维持容量为什么不是载体在最好状态下曾经达到的能力？',terms:['当前','恢复']},
{id:'LIVE-NEW-2',q:'残余负荷：任务交付后仍然不断等待后续，为什么还会占据容量？',terms:['责任','容量']},
{id:'LIVE-OUTSIDE',q:'人工运行维护需要哪些具体步骤？',closed:true},
{id:'LIVE-PAGE',q:'请解释第三册第50页图中每一个箭头的意义',closed:true},
{id:'LIVE-QA-ESCALATION',q:'人工运行维护需要哪些具体步骤？',closed:true,extra:{qa:true,scope:'ALL',PHIOS_MANUSCRIPT_DERIVATIVE_QA:true,PHIOS_MANUSCRIPT_TEXT_SCOPE_QA:true}},
{id:'LIVE-NO-SOURCE',q:'水星蛋糕的精确矿物配方是什么？',closed:true},
{id:'LIVE-PREDICT',q:'保证下周公司的运营一定不会失败可以吗？',state:'SOURCE_LIMIT',terms:['不能支持']},
{id:'LIVE-ENGLISH',q:'What creates residual load after an event ends?',locale:'en',closed:true,state:'SOURCE_INSUFFICIENT'}
];
const results=[];for(const c of cases){const payload={task:'KNOWLEDGE_BASIC',question:c.q,locale:c.locale||'zh-Hans',contexts:[{contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-3'}],guidedRouting:false,methodGuidanceRequested:false,...c.extra};const r=await fetch(base+'/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});const body=await r.json(),answer=body.view?.answer?.text||'',citations=(body.view?.basedOn?.sources||[]).filter(s=>s.sectionCode);const pass=r.ok&&body.execution?.providerCalls===0&&(!c.terms||c.terms.every(t=>answer.includes(t)))&&(!c.terms||c.state||citations.some(s=>s.sourceSha256===source.sourceSha256&&s.supportRange))&&(!c.closed||!citations.some(s=>s.sourceSha256===source.sourceSha256))&&(!c.state||body.view?.state===c.state);results.push({...c,pass,status:r.status,answer,citations,state:body.view?.state,execution:body.execution});fs.writeFileSync(dir+'BOOK-III-CURRENT-LIVE-ANSWERS.json',JSON.stringify({at:new Date().toISOString(),base,sourceSha256:source.sourceSha256,results,passed:results.filter(r=>r.pass).length,total:cases.length,providerCalls:results.map(r=>r.execution?.providerCalls),state:results.every(r=>r.pass)?'PASS_LIMITED_LIVE_RANGE':'FAILED_ROLLBACK_REQUIRED'},null,2)+'\n');}
console.log(results.map(r=>({id:r.id,pass:r.pass,state:r.state})));assert(results.every(r=>r.pass));
