import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runKirR2ProductionProjection,KIR_R2_PRODUCTION_PROFILE_PATH,KIR_R2_PRODUCTION_ARTICLE_BINDING_PATH} from '../functions/_lib/kir-r2-production.js';
import {articleAuthorityToKirSources} from '../functions/_lib/kir-r2-answer-intelligence.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const benchmark=read('content/knowledge/knowledge-intelligence-r2/benchmarks/kir-r2-w15r-100-question-answer-benchmark-v2.json');
const profiles=read(KIR_R2_PRODUCTION_PROFILE_PATH);
const bindings=read(KIR_R2_PRODUCTION_ARTICLE_BINDING_PATH);
if(!process.env.OPENAI_API_KEY)throw new Error('OPENAI_API_KEY is required for W16R2 live campaign.');
if(!process.env.DEEPSEEK_API_KEY)throw new Error('DEEPSEEK_API_KEY is required for W16R2 live campaign escalation coverage.');
const env={...process.env,PHIOS_KIR_R2_MODEL_GATEWAY_ENABLED:'true',ASSETS:{fetch:async req=>{const p=new URL(req.url).pathname.slice(1);if(p===KIR_R2_PRODUCTION_PROFILE_PATH)return Response.json(profiles);if(p===KIR_R2_PRODUCTION_ARTICLE_BINDING_PATH)return Response.json(bindings);return new Response('not found',{status:404});}}};
const output={schemaVersion:'PHI-OS-KIR-R2-W16R2-100-CASE-LIVE-MODEL-CAMPAIGN-v1.0.0',baselineCommit:'db794e5a22d8d0ecc36ebaab6420b3bca804a7ce',startedAt:new Date().toISOString(),status:'RUNNING',cases:[]};
const outPath=path.join(root,'review','KIR-R2-W16R2-100-CASE-LIVE-RESULTS.json');
for(let i=0;i<benchmark.cases.length;i++){
  const c=benchmark.cases[i];const authority=read(c.expected.authorityPath);const articleSources=articleAuthorityToKirSources(authority,c.expected.bookCode);const groundingBundle={sources:articleSources};
  const started=performance.now();const projection=await runKirR2ProductionProjection({question:c.question,locale:c.locale,env,upstreamGroundingBundle:groundingBundle});const latencyMs=Number((performance.now()-started).toFixed(2));
  const answer=projection?.result?.answer||null;const providerMeta=answer?.providerMeta||null;
  output.cases.push({caseId:c.caseId,question:c.question,locale:c.locale,expected:c.expected,status:projection.status,applied:projection.applied===true,answer:answer?.text||'',providerMeta,baseGuard:projection?.result?.guard||null,successorGuard:projection?.w16r2?.successorGuard||null,escalated:projection?.w16r2?.escalated||false,attempts:projection?.w16r2?.attempts||1,latencyMs});
  fs.writeFileSync(outPath,JSON.stringify(output,null,2));console.log(`[${i+1}/100] ${c.caseId} ${projection.status} ${providerMeta?.providerId||'NO_PROVIDER'}`);
}
output.completedAt=new Date().toISOString();output.status='LIVE_CAMPAIGN_COMPLETED_HUMAN_REVIEW_REQUIRED';output.summary={caseCount:output.cases.length,applied:output.cases.filter(x=>x.applied).length,escalated:output.cases.filter(x=>x.escalated).length,openaiLuna:output.cases.filter(x=>x.providerMeta?.providerId==='OPENAI_LUNA').length,deepseekV4Flash:output.cases.filter(x=>x.providerMeta?.providerId==='DEEPSEEK_V4_FLASH').length,guardPassed:output.cases.filter(x=>x.successorGuard?.passed===true).length};fs.writeFileSync(outPath,JSON.stringify(output,null,2));console.log(JSON.stringify(output.summary,null,2));console.log(`Wrote ${path.relative(root,outPath)}`);
