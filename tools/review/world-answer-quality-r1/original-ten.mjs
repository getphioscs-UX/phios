import fs from 'node:fs';import assert from 'node:assert/strict';import {startSessionServer} from '../reality-information-contract-r1/L1/server.mjs';
const out='tools/review/world-answer-quality-r1/';const s=await startSessionServer();let cookie='';
async function api(route,body){const r=await fetch(s.origin+route,{method:body?'POST':'GET',headers:{origin:s.origin,cookie,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return {status:r.status,data:await r.json()};}
const questions=[
['油价上涨后，为什么连买菜和送货也可能变贵？','Why can rising oil costs make groceries and deliveries more expensive?'],
['工资没涨，经济增长的数据对家庭有什么意义？','What does economic growth mean for a household whose wages have not risen?'],
['矿产很多的地方，为什么就业和公共服务仍然薄弱？','Why can a mineral-rich place still have weak jobs and public services?'],
['如果企业开始用人工智能，我应该观察哪些就业变化？','If firms adopt artificial intelligence, what employment changes should I watch?'],
['老年人口增加会如何改变家庭照护和劳动供给？','How can an older population change family care and labour supply?'],
['为什么工厂选址要同时考虑用水、港口和供电？','Why does factory location depend on water, ports and electricity together?'],
['远方战争如何传导到本地商品和运输成本？','How can a distant war affect local goods and transport costs?'],
['马来西亚与越南的制造业能直接用一个数字比较吗？','Can manufacturing in Malaysia and Vietnam be compared using a single number?'],
['政策利率下降是否意味着每个人都更容易拿到房贷？','Does a policy rate cut mean everyone can obtain a mortgage more easily?'],
['准备换工作时，怎样区分世界变化与自己的实际条件？','When considering a job change, how can I distinguish world trends from my own conditions?']];
try{
const results=[];for(const [i,pair]of questions.entries())for(const [j,question]of pair.entries()){const r=await api('/api/world-question-explanation',{question,locale:j?'en':'zh-Hans'});assert.equal(r.status,200);const product=await api('/api/local-ric/answer',{question,locale:j?'en':'zh-Hans',region:'USA',year:2024});assert.equal(product.status,200);results.push({id:i+1,locale:j?'en':'zh-Hans',question,...r.data,product:{state:product.data.answer.answerState,directAnswer:product.data.answer.directAnswer,limits:product.data.answer.limits,sourceCount:Object.keys(product.data.sources).length}});}
fs.writeFileSync(out+'QUESTION-RESULTS.json',JSON.stringify(results,null,2));console.log(results.map(x=>`${x.id} ${x.locale} ${x.explanation?.sources?.length} ${x.explanation?.directAnswer?.slice(0,150)}`).join('\n'));
const body={action:'start',locale:'en',question:'Should I take a longer commute for more predictable work?',situation:'Synthetic case: contract ends in three months.',known:'Savings cover four months\nCurrent commute is twenty minutes',unknown:'Net pay after travel\nCare schedule',nextReview:'After receiving a written offer',options:[{name:'Stay and search nearby',benefit:'Keep care schedule',tradeoff:'Uncertain next contract',unknown:'Local vacancies'},{name:'Explore the longer commute',benefit:'Potential stable schedule',tradeoff:'Travel cost and time',unknown:'Written pay and hours'}]};
const checks=[];const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);};
check('default consent denied',(await api('/api/local-ric/workbench',{...body,consent:false})).status!==200);
let r=await api('/api/local-ric/workbench',{...body,consent:true});check('real owner start',r.status===200&&r.data.available);check('no fabricated choice',!r.data.chosen);check('no verified history or edges',r.data.historyState==='NO_VERIFIED_HISTORY'&&r.data.relationEdges.length===0);
r=await api('/api/local-ric/workbench',{action:'choose',optionId:'direction-1',reason:'I will first verify net pay and care hours.',consent:true});check('explicit choice',r.status===200&&r.data.chosen.id==='direction-1');
r=await api('/api/local-ric/workbench',{action:'observe',statement:'Synthetic later observation: written hours conflict with care duties.',consent:true});check('reported observation',r.status===200&&!!r.data.observation);
r=await api('/api/local-ric/workbench',{action:'review',reflection:'The stable schedule does not fit care duties; compare nearby roles first.',nextReview:'After two local interviews',consent:true});check('full review',r.status===200&&!!r.data.reflection&&!r.data.persisted&&!r.data.saveAuthorized);
fs.writeFileSync(out+'REALITY-RESULT.json',JSON.stringify(r.data,null,2));
await api('/api/local-ric/revoke',{});check('public revocation preserves separate personal consent',(await api('/api/local-ric/workbench')).data.available);
const own=cookie;cookie='';check('identity isolation',!(await api('/api/local-ric/workbench')).data.available);cookie=own;
await api('/api/local-ric/revoke',{scope:'workbench'});check('revocation clears personal use',!(await api('/api/local-ric/workbench')).data.available);
check('revoked update denied',(await api('/api/local-ric/workbench',{action:'review',reflection:'x',nextReview:'x',consent:true})).status!==200);
const answer=await api('/api/local-ric/answer',{question:questions[0][1],locale:'en',region:'USA',year:2024});console.log('RIC answer',answer.status,answer.data.code||answer.data.answer?.answerState);check('published explanation crosses RIC',answer.status===200);
fs.writeFileSync(out+'HTTP-VERIFICATION.json',JSON.stringify({at:new Date().toISOString(),checks,calls:s.calls,providerCalls:0,costUSD:0},null,2));
}finally{await s.stop();}
