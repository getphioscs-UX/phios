import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {startSessionServer} from '../reality-information-contract-r1/L1/server.mjs';
const out='tools/review/world-answer-quality-r1/';const freeze=JSON.parse(fs.readFileSync(out+'PRE-UNSEEN-SOURCE-HASHES.json'));for(const f of process.argv.includes('--replay')?[]:freeze.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(f.path)).digest('hex'),f.sha256,'Candidate changed before holdout definition');
const cases=[
['柴油更贵时，食品价格是否必须按同一比例上涨？','When diesel gets dearer, must food prices rise by the same proportion?'],
['GDP 增长很好，为什么我拿到的工资还是买不起更多东西？','GDP growth looks strong; why might my pay still buy no more than before?'],
['一个矿产丰富的国家出口增加，本地人为何未必得到更多公共服务？','If a mineral-rich country exports more, why might residents see no better public services?'],
['AI 能处理工作中的任务，能否证明整份工作已经被取代？','Does AI being able to perform tasks prove that the whole job has already been replaced?'],
['退休人口增加，怎样区分照护需求和实际劳动力减少？','As more people retire, how should care needs be distinguished from a fall in actual labour supply?'],
['工厂地租便宜却经常停电，应该怎样比较选址成本？','How should I compare factory locations when cheap rent comes with frequent power outages?'],
['战争影响了航运时，本地进口商品为什么可能更贵？','When war disrupts shipping, why might imported goods cost more locally?'],
['新地铁站开通之后，附近房租为什么会上涨？','Why might nearby rents rise after a new railway station opens?'],
['2024年马来西亚房贷真实拒绝率是多少？','What was Malaysia’s actual mortgage rejection rate in 2024?'],
['马来西亚和越南2024年制造业就业人数各是多少？','How many people worked in manufacturing in Malaysia and Vietnam in 2024?']];
if(!process.argv.includes('--replay'))fs.writeFileSync(out+'UNSEEN-QUESTIONS.json',JSON.stringify({definedAt:new Date().toISOString(),candidateHashFile:'PRE-UNSEEN-SOURCE-HASHES.json',questions:cases},null,2));
const s=await startSessionServer(),results=[];try{for(const [i,pair]of cases.entries())for(const[j,question]of pair.entries()){const response=await fetch(s.origin+'/api/world-question-explanation',{method:'POST',headers:{origin:s.origin,'content-type':'application/json'},body:JSON.stringify({question,locale:j?'en':'zh-Hans'})});assert.equal(response.status,200);const data=await response.json();const a=data.explanation;assert.ok(a.directAnswer);assert.equal(a.providerCalls,0);assert.ok(a.nextSteps.length>=1&&a.nextSteps.length<=2||a.quality==='PARTIAL_GUIDANCE_ONLY');if(a.quality==='DIRECT_USEFUL_BOUNDED'){assert.ok(a.segments.every(p=>p.sourceRefs.every(id=>a.sources.some(s=>s.sourceId===id))));assert.ok(!/\d/.test(a.directAnswer),'No unsupported number in mechanism answer');}
const pr=await fetch(s.origin+'/api/local-ric/answer',{method:'POST',headers:{origin:s.origin,'content-type':'application/json'},body:JSON.stringify({question,locale:j?'en':'zh-Hans',region:'USA',year:2024})});assert.equal(pr.status,200);const product=await pr.json();results.push({id:i+1,locale:j?'en':'zh-Hans',question,answer:a,product:{state:product.answer.answerState,directAnswer:product.answer.directAnswer,providerCalls:product.providerCalls,sourceCount:Object.keys(product.sources).length}});}
fs.writeFileSync(out+'UNSEEN-RESULTS.json',JSON.stringify(results,null,2));console.log(results.map(r=>`${r.id} ${r.locale} ${r.answer.quality} ${r.answer.directAnswer.slice(0,90)}`).join('\n'));}finally{await s.stop();}
