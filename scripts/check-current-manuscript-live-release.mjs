import fs from 'node:fs';import assert from 'node:assert/strict';
const dir='tools/review/free-ask-manuscript-r1/',base=process.env.PHIOS_LIVE_BASE||'https://getphios.com';
const cases=[
 {id:'REG-BOUNDARY',book:'BOOK-4',q:'扩展为什么有尺度边界',heading:'尺度边界',required:['限制','载体']},
 {id:'REG-CAPACITY',book:'BOOK-4',q:'增加规模为什么可能不再带来新的能力？',heading:'扩展饱和',required:['承载','协调']},
 {id:'REG-LIVING',book:'BOOK-6',q:'为什么生活环境不是个人选择的简单结果',heading:'生活环境',required:['土地制度','收入结构']},
 {id:'REG-COMPARE',book:'BOOK-6',q:'文明重组与普通变化有什么区别',heading:'什么是文明重组',required:['关系','权力']},
 {id:'NEW-BOUNDARY',book:'BOOK-4',q:'尺度边界为什么受到运行载体和组织条件的限制？',heading:'尺度边界',required:['载体','限制']},
 {id:'NEW-LIVING',book:'BOOK-6',q:'生活环境里的住房和交通，为什么并不是个人偏好就能独立决定的？',heading:'生活环境',required:['交通','制度']},
 {id:'FALSE-PREMISE',book:'BOOK-4',q:'扩展饱和是不是证明规模越大能力就必然越高？',heading:'扩展饱和',required:['并不意味着']},
 {id:'OUTSIDE',book:'BOOK-6',q:'苏联运行的控制结构有哪些？',closed:true},
 {id:'FIGURE',book:'BOOK-4',q:'请解释第四册第20页图中每个箭头的方向与图表标签',closed:true},
 {id:'PREDICTION',book:'BOOK-6',q:'预测明天战争一定发生在哪里',state:'SOURCE_LIMIT',required:['不能支持','确定预测']},
 {id:'NO-SOURCE',book:'BOOK-4',q:'火星上的早餐蓝色矿物配方是什么',closed:true},
 {id:'ENGLISH',book:'BOOK-6',q:'How does civilization reconfiguration differ from ordinary change?',locale:'en',closed:true},
 {id:'CLIENT-QA-ESCALATION',book:'BOOK-6',q:'苏联运行',closed:true,extra:{PHIOS_MANUSCRIPT_DERIVATIVE_QA:true,PHIOS_MANUSCRIPT_TEXT_SCOPE_QA:true,PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED:true,qa:true,scope:'ALL',source:'manuscript'}}
];
const locked={createdAt:new Date().toISOString(),description:'New live expressions fixed before first production run; no rule tuning',cases};if(!fs.existsSync(dir+'CURRENT-IV-VI-LIVE-SET.json'))fs.writeFileSync(dir+'CURRENT-IV-VI-LIVE-SET.json',JSON.stringify(locked,null,2));
const results=[];for(const c of cases){const locale=c.locale||'zh-Hans';const payload={task:'KNOWLEDGE_BASIC',question:c.q,locale,contexts:[{contextType:'KNOWLEDGE',contextRef:'BOOK:'+c.book}],guidedRouting:false,methodGuidanceRequested:false,...c.extra};const response=await fetch(base+'/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});let body;try{body=await response.json()}catch{body={error:'NON_JSON_RESPONSE'}}const text=body.view?.answer?.text||'',citations=(body.view?.basedOn?.sources||[]).filter(s=>s.sectionCode);const version=c.book==='BOOK-4'?'ab265b9004dafd286b8b58f536f81e6c30bf3deec27f6431b8224d5c1816e07c':'15d80720d10c8a16115b06237043da5acc381f87f632175f40da99db9745c68a';const pass=response.ok&&body.execution?.providerCalls===0&&(!c.heading||citations.some(s=>s.sourceSha256===version&&s.supportRange))&&(!c.required||c.required.every(x=>text.includes(x)))&&(!c.closed||citations.length===0)&&(!c.state||body.view?.state===c.state);results.push({...c,status:response.status,pass,answer:text,state:body.view?.state,citations,execution:body.execution,response:body});fs.writeFileSync(dir+'CURRENT-IV-VI-LIVE-RESULTS.json',JSON.stringify({at:new Date().toISOString(),base,results,passed:results.filter(x=>x.pass).length,total:cases.length,providerCalls:results.map(x=>x.execution?.providerCalls),state:results.every(x=>x.pass)?'PASS_BOUNDED_LIVE_API':'FAILED_ROLLBACK_REQUIRED'},null,2));}
const entry=[];for(const [question,locale]of[['PHIOS 是什么','zh-Hans'],['人为什么不快乐','zh-Hans'],['How do I use PHI OS?','en'],['Why does a shared reality need coordination?','en']]){const r=await fetch(base+'/api/client-intent-route',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question,locale})});const b=await r.json();entry.push({question,locale,status:r.status,response:b});}
fs.writeFileSync(dir+'CURRENT-ENTRY-LIVE-ZERO-PROVIDER.json',JSON.stringify({at:new Date().toISOString(),base,results:entry},null,2));console.log(results.map(x=>({id:x.id,pass:x.pass,state:x.state})));assert(results.every(x=>x.pass),'LIVE_FAILURE_REQUIRES_ROLLBACK');
