import fs from 'node:fs';
import path from 'node:path';

const PACK = process.env.PHIOS_BAKEOFF_PACK || path.resolve(process.argv[2] || './PHIOS-KIR-R2-24-CASE-COMPOSER-BAKEOFF-PACK.json');
const OUT = process.env.PHIOS_BAKEOFF_OUT || path.resolve(process.argv[3] || './PHIOS-KIR-R2-24-CASE-COMPOSER-BAKEOFF-RESULTS.json');
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'));

const providers = [
  {
    id: 'OPENAI_LUNA', label: 'OpenAI GPT-5.6 Luna', env: 'OPENAI_API_KEY', model: 'gpt-5.6-luna',
    pricing: { input: 0.20, cachedInput: 0.02, output: 1.20, unit: 'USD_PER_1M_TOKENS' }
  },
  {
    id: 'MISTRAL_SMALL_4', label: 'Mistral Small 4', env: 'MISTRAL_API_KEY', model: 'mistral-small-2603',
    pricing: { input: 0.15, cachedInput: 0.015, output: 0.60, unit: 'USD_PER_1M_TOKENS' }
  },
  {
    id: 'GEMINI_25_FLASH_LITE', label: 'Gemini 2.5 Flash-Lite', env: 'GEMINI_API_KEY', altEnv: 'GOOGLE_API_KEY', model: 'gemini-2.5-flash-lite',
    pricing: { input: 0.10, cachedInput: 0.01, output: 0.40, unit: 'USD_PER_1M_TOKENS' }
  },
  {
    id: 'DEEPSEEK_V4_FLASH', label: 'DeepSeek V4 Flash', env: 'DEEPSEEK_API_KEY', model: 'deepseek-v4-flash',
    pricing: {
      offPeak: { inputMiss: 0.22, inputHit: 0.007, output: 0.66 },
      peak: { inputMiss: 0.44, inputHit: 0.014, output: 1.32 },
      unit: 'USD_PER_1M_TOKENS',
      peakUtc: 'Mon–Fri 01:00–04:00 and 06:00–10:00 UTC'
    }
  }
];

const SYSTEM = `You are the PHI OS answer composer. You are NOT the knowledge authority.
Use only the supplied PHI OS evidence. Do not add external facts or unsupported PHI OS claims.
Answer the user's actual question in Simplified Chinese, directly and naturally.
If the question asks why or how, explain the actual causal/process mechanism rather than listing concepts.
Do not mention evidence packs, canonical nodes, registries, governance, internal runtimes, or model/provider names.
Do not use reusable meta-openings such as “围绕……需要追踪……” or “起点/中间/随后/最终” unless those labels are genuinely required by the specific content.
Do not merely paraphrase the question. Do not turn every answer into the same chain template.
Preserve epistemic boundaries: if PHI OS is offering a theoretical framing rather than an externally established fact, phrase it as a PHI OS interpretation/framework.
Target roughly 220–520 Chinese characters unless a shorter answer fully resolves the question.
Return only the customer-facing answer.`;

function userPrompt(c) {
  const ev = [...(c.evidencePack.primaryEvidence || []), ...(c.evidencePack.supportingEvidence || [])];
  const blocks = ev.map((e, i) => `[E${i + 1}] ${e.sourceType} | ${e.title || c.articleTitle}\n${e.text}`).join('\n\n');
  return `用户问题：${c.question}\n\n问题类型：${c.questionType}\n\nPHI OS 证据：\n${blocks}`;
}

function deepseekPeakAt(date) {
  const d = date.getUTCDay(); const h = date.getUTCHours();
  const weekday = d >= 1 && d <= 5;
  return weekday && ((h >= 1 && h < 4) || (h >= 6 && h < 10));
}

function usd(x) { return Number((x || 0).toFixed(8)); }
function basicCost({input=0,cached=0,output=0}, p) {
  const uncached = Math.max(0, input - cached);
  return usd((uncached * p.input + cached * p.cachedInput + output * p.output) / 1_000_000);
}
function deepseekCost(usage, at) {
  const tier = deepseekPeakAt(at) ? 'peak' : 'offPeak';
  const p = providers.find(x=>x.id==='DEEPSEEK_V4_FLASH').pricing[tier];
  const hit = usage.cachedInput || 0; const miss = Math.max(0, (usage.input || 0) - hit);
  return { tier, usd: usd((miss*p.inputMiss + hit*p.inputHit + (usage.output||0)*p.output)/1_000_000) };
}

async function httpJson(url, options) {
  const r = await fetch(url, options);
  const text = await r.text();
  let body; try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}: ${JSON.stringify(body).slice(0,1200)}`);
  return body;
}

function openAiText(body) {
  if (typeof body.output_text === 'string') return body.output_text.trim();
  const out=[]; for(const item of body.output||[]) for(const c of item.content||[]) if(c.type==='output_text'&&c.text) out.push(c.text);
  return out.join('\n').trim();
}
async function callOpenAI(key,c) {
  const body = await httpJson('https://api.openai.com/v1/responses', {
    method:'POST', headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:'gpt-5.6-luna', reasoning:{effort:'none'}, instructions:SYSTEM, input:userPrompt(c), max_output_tokens:900})
  });
  const u=body.usage||{}; const cached=u.input_tokens_details?.cached_tokens||0;
  return {text:openAiText(body), usage:{input:u.input_tokens||0,cachedInput:cached,output:u.output_tokens||0,total:u.total_tokens||0}, rawId:body.id||null};
}
function mistralText(content){if(typeof content==='string')return content.trim();return (content||[]).filter(x=>x?.type==='text').map(x=>x.text).join('').trim()}
async function callMistral(key,c){
  const body=await httpJson('https://api.mistral.ai/v1/chat/completions',{
    method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:'mistral-small-2603',messages:[{role:'system',content:SYSTEM},{role:'user',content:userPrompt(c)}],reasoning_effort:'none',max_tokens:900,random_seed:42})
  });
  const u=body.usage||{}; return {text:mistralText(body.choices?.[0]?.message?.content),usage:{input:u.prompt_tokens||0,cachedInput:u.prompt_tokens_details?.cached_tokens||0,output:u.completion_tokens||0,total:u.total_tokens||0},rawId:body.id||null};
}
async function callGemini(key,c){
  const url=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(key)}`;
  const body=await httpJson(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    systemInstruction:{parts:[{text:SYSTEM}]},contents:[{role:'user',parts:[{text:userPrompt(c)}]}],
    generationConfig:{maxOutputTokens:900,thinkingConfig:{thinkingBudget:0}}
  })});
  const text=(body.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('').trim();
  const u=body.usageMetadata||{}; return {text,usage:{input:u.promptTokenCount||0,cachedInput:u.cachedContentTokenCount||0,output:(u.candidatesTokenCount||0)+(u.thoughtsTokenCount||0),visibleOutput:u.candidatesTokenCount||0,thinkingOutput:u.thoughtsTokenCount||0,total:u.totalTokenCount||0},rawId:body.responseId||null};
}
async function callDeepSeek(key,c){
  const body=await httpJson('https://api.deepseek.com/chat/completions',{
    method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:'deepseek-v4-flash',messages:[{role:'system',content:SYSTEM},{role:'user',content:userPrompt(c)}],thinking:{type:'disabled'},max_tokens:900})
  });
  const u=body.usage||{}; return {text:String(body.choices?.[0]?.message?.content||'').trim(),usage:{input:u.prompt_tokens||0,cachedInput:u.prompt_cache_hit_tokens||u.prompt_tokens_details?.cached_tokens||0,output:u.completion_tokens||0,total:u.total_tokens||0},rawId:body.id||null};
}

const calls={OPENAI_LUNA:callOpenAI,MISTRAL_SMALL_4:callMistral,GEMINI_25_FLASH_LITE:callGemini,DEEPSEEK_V4_FLASH:callDeepSeek};
const configured=providers.map(p=>({...p,key:process.env[p.env]||process.env[p.altEnv||'__NONE__']||''}));
const unavailable=configured.filter(p=>!p.key).map(p=>p.id);
if(unavailable.length){
  console.error(`Missing API credentials for: ${unavailable.join(', ')}. No provider call has been faked.`);
  console.error('Set OPENAI_API_KEY, MISTRAL_API_KEY, GEMINI_API_KEY (or GOOGLE_API_KEY), and DEEPSEEK_API_KEY, then rerun.');
  process.exit(2);
}

const results=[]; const startedAt=new Date();
for(let i=0;i<pack.cases.length;i++){
  const c=pack.cases[i];
  console.log(`[${i+1}/${pack.cases.length}] ${c.caseId} ${c.question}`);
  const rows=await Promise.all(configured.map(async p=>{
    const t0=performance.now(); const at=new Date();
    try{
      const r=await calls[p.id](p.key,c); const latencyMs=Math.round((performance.now()-t0)*1000)/1000;
      let cost;
      if(p.id==='DEEPSEEK_V4_FLASH') cost=deepseekCost(r.usage,at);
      else cost={tier:'standard',usd:basicCost(r.usage,p.pricing)};
      return {providerId:p.id,providerLabel:p.label,model:p.model,status:'OK',answer:r.text,usage:r.usage,costUsd:cost.usd,pricingTier:cost.tier,latencyMs,requestStartedAt:at.toISOString(),rawId:r.rawId};
    }catch(e){return {providerId:p.id,providerLabel:p.label,model:p.model,status:'ERROR',error:String(e?.message||e),answer:'',usage:null,costUsd:null,pricingTier:null,latencyMs:Math.round((performance.now()-t0)*1000)/1000,requestStartedAt:at.toISOString()};}
  }));
  results.push({caseId:c.caseId,question:c.question,bookCode:c.bookCode,nodeCode:c.nodeCode,selectionBucket:c.selectionBucket,priorHumanStatus:c.priorHumanReview.status,providers:rows});
  fs.writeFileSync(OUT,JSON.stringify({schemaVersion:'PHI-OS-KIR-R2-COMPOSER-BAKEOFF-RESULT-v1.0.0',startedAt:startedAt.toISOString(),updatedAt:new Date().toISOString(),packPath:PACK,modelPolicy:{reasoningMode:'NONE_OR_DISABLED_FOR_LOW_COST_T1_COMPOSER_COMPARISON',sameEvidence:true,sameCompositionContract:true},providerPricing:Object.fromEntries(providers.map(p=>[p.id,p.pricing])),results},null,2)+'\n');
}
const totals={};
for(const p of providers){const rows=results.flatMap(x=>x.providers).filter(x=>x.providerId===p.id&&x.status==='OK');totals[p.id]={cases:rows.length,totalCostUsd:usd(rows.reduce((n,x)=>n+(x.costUsd||0),0)),avgLatencyMs:rows.length?Math.round(rows.reduce((n,x)=>n+x.latencyMs,0)/rows.length):null,totalInputTokens:rows.reduce((n,x)=>n+(x.usage?.input||0),0),totalOutputTokens:rows.reduce((n,x)=>n+(x.usage?.output||0),0)};}
const final=JSON.parse(fs.readFileSync(OUT,'utf8'));final.completedAt=new Date().toISOString();final.totals=totals;fs.writeFileSync(OUT,JSON.stringify(final,null,2)+'\n');
console.log(JSON.stringify(totals,null,2));
