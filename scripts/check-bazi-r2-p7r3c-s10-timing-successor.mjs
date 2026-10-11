import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {classifySpan,selectPublicationSpans} from '../functions/personal-reading/publication-fit/bazi-publication-lead-selector.js';
import {compileBaziDeepPublication,manuscriptSentences} from '../functions/personal-reading/deep-manuscript/bazi-deep-manuscript-publication.js';
import {FIELD} from '../functions/personal-reading/deep-manuscript/bazi-deep-manuscript-contract.js';
import {ROOT,loadBaziReviewAuthority} from './lib/bazi-deep-manuscript-review.mjs';
import {layoutProfile} from '../functions/personal-reading/publication-fit/bazi-publication-layout-profiles.js';
const dir='content/production-closure/live-customer-commercial-convergence/bazi-r2-p7/',selector='functions/personal-reading/publication-fit/bazi-publication-lead-selector.js',read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),hash=x=>sha(JSON.stringify(x)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
globalThis.fetch=async()=>{throw Error('P7R3C_NETWORK_FORBIDDEN');};
const concept=text=>({daYunConceptPresent:/大运|运柱|Da Yun|luck[ -]pillar/i.test(text),annualConceptPresent:/流年|年度|年层|annual|year[ -]layer/i.test(text)});
const snapshot=read(ROOT+'LIVE-MANUSCRIPT-SNAPSHOT-R2-CLOSURE.json'),s10=snapshot.sections.find(s=>s.sectionId==='S10'),v1=read(dir+'BAZI-R2-CURRENT-PRODUCTION-PUBLICATION-BASELINE-V1.json');
const selection=ir=>{const s=ir.editorial.sections.find(s=>s.sectionId==='S10');return Object.fromEntries(Object.entries(s).filter(([l])=>['en','zh-Hans'].includes(l)).map(([l,x])=>[l,{excerptA:x.excerpts[0],excerptB:x.excerpts[1],insightCards:x.insightCards,...concept(x.excerpts.flat().map(s=>s.text).join(' ')),timingRolePresent:x.excerpts.flat().some(s=>s.roles.includes('TIMING'))}]));};
if(process.argv.includes('--before')){
 assert.equal(sha(fs.readFileSync(selector)),'ecfe67c5c4d7d092667dd16afdd7c6d2e79d8be559974147e514f17fc6fbbb47');
 const source=Object.fromEntries(Object.entries(FIELD).map(([l,f])=>[l,{...concept(s10[f]),sentences:manuscriptSentences(s10[f]).map(s=>({...classifySpan(s,'S10'),paragraphIndex:s10[f].slice(0,s.start).split(/\n\s*\n/).length-1,length:s.text.length}))}]));
 const modes=Object.fromEntries(Object.keys(v1.modes).map(m=>[m,selection(read(v1.modes[m].path))]));
 const prior=read(dir+'P7R3B-PROTECTED-BEFORE.json'),paths=new Set(Object.keys(prior.hashes));for(const p of [dir+'P7R3B-GENG-BASELINE-RECONCILIATION.json',dir+'BAZI-R2-CURRENT-PRODUCTION-PUBLICATION-BASELINE-V1.json','content/production-closure/live-customer-commercial-convergence/BAZI-R2-P5-2-BASELINE-RECONCILIATION.json'])paths.add(p);
 const before={selectorSha256:sha(fs.readFileSync(selector)),coverageFunctionSha256:sha(fs.readFileSync(selector,'utf8').split('export function publicationCoverage')[1]),source,modes,protectedHashes:Object.fromEntries([...paths].filter(p=>p!==selector).map(p=>[p,sha(fs.readFileSync(p))]))};
 write(dir+'P7R3C-S10-SELECTION-BEFORE.json',before);fs.copyFileSync(selector,dir+'P7R3C-SELECTOR-BEFORE.js');for(const l of ['en','zh-Hans'])assert(before.source[l].daYunConceptPresent&&before.source[l].annualConceptPresent,'S10_SOURCE_MANUSCRIPT_TIMING_COVERAGE_MISSING');console.log('P7R3C source support confirmed; before audit captured.');
}else{
 const before=read(dir+'P7R3C-S10-SELECTION-BEFORE.json');const r={status:'RUNNING',selectorBeforeSha256:before.selectorSha256,selectorAfterSha256:sha(fs.readFileSync(selector)),sourceSupport:{zhHans:{daYun:before.source['zh-Hans'].daYunConceptPresent,annual:before.source['zh-Hans'].annualConceptPresent},en:{daYun:before.source.en.daYunConceptPresent,annual:before.source.en.annualConceptPresent}},beforeSelection:before.modes,afterSelection:{},coverage:{},changedPages:{},unchangedPages:{},referenceSpecificPatternsPresent:false,historicalAcceptedArtifactsUnchanged:false,currentBaselineV1:dir+'BAZI-R2-CURRENT-PRODUCTION-PUBLICATION-BASELINE-V1.json',currentBaselineV2:null,providerCalls:0,providerCostUSD:0,providerNetworkCalls:0,genericityMatrix:[]};
 try{
  const source=fs.readFileSync(selector,'utf8');assert(!/己巳|丙寅|Ji-Si|Bing-Yin|BDM-REFERENCE-GENG/.test(source),'REFERENCE_SELECTOR_LEAK_REINTRODUCED');assert.equal(sha(source.split('export function publicationCoverage')[1]),before.coverageFunctionSha256);
  const fixture=(name,locale,text,expected,budget=locale==='en'?120:45)=>{text+=Array.from({length:8},(_,i)=>locale==='en'?` The Day Master mechanism connects daily work with support and recovery in observation ${i+1}.`:` 日主结构提供机制背景，日常工作需要支持与恢复，观察项目${i+1}。`).join('');const out=selectPublicationSpans(manuscriptSentences(text),text,{sectionId:'S10',locale,authorityDigest:'SYNTHETIC_ZERO_PROVIDER',compilerVersion:'TEST',profile:{bodyBudget:{[locale]:budget},cardBudget:{[locale]:400}},pass:0});const visible=out.excerpts.flat(),terms=concept(visible.map(x=>x.text).join(' '));if(expected){assert.equal(out.selectionStatus,'PASS',name);assert(terms.daYunConceptPresent&&terms.annualConceptPresent);assert(visible.some(x=>x.roles.includes('TIMING')));for(const spans of out.excerpts){assert(spans.reduce((n,s)=>n+s.text.length,0)<=budget);for(const s of spans)assert.equal(text.slice(s.start,s.end),s.text);}}else assert.equal(out.selectionStatus,'PUBLICATION_REPAIR');r.genericityMatrix.push({name,status:'PASS',expectedSelection:expected?'PASS':'PUBLICATION_REPAIR',selected:visible.map(s=>s.text),...terms});};
  const en=' Your work and daily choices need support. Resources help recovery. This interpretation describes a mechanism. ',zh=' 日主的结构在工作生活中需要支持。资源支持恢复。此处说明机制。';
  fixture('1_EN_SINGLE','en','The current Luck Pillar and annual layer are read together.'+en,true);
  fixture('2_EN_SPLIT','en','The current Da Yun describes a timing layer. The annual influence adds another layer.'+en,true);
  fixture('3_ZH_SINGLE','zh-Hans','当前大运与年度层需要分层阅读。'+zh,true);
  fixture('4_ZH_SPLIT','zh-Hans','当前大运说明一个时序层。年度层提供另一层背景。'+zh,true);
  fixture('5_DIFFERENT_CUSTOMER','en','The current Jia-Xu Luck Pillar and Bing-Wu annual layer are read together.'+en,true);
  fixture('6_UNKNOWN_BOUNDARY','en','Current Da Yun information is not available. Annual layer information remains unavailable.'+en,true);
  fixture('7_NO_TIMING','en',en,false);
  fixture('8_TOO_SMALL_BUDGET','en','The current Da Yun and annual layer cannot be reduced to a single prediction.'+en,false,5);
  for(const row of r.genericityMatrix){
   const timing=row.selected.filter(text=>{const c=concept(text);return c.daYunConceptPresent||c.annualConceptPresent;});
   if(/^[135]_/.test(row.name)){assert.equal(timing.length,1,'COMBINED_SOURCE_SPAN_NOT_REUSED');assert(concept(timing[0]).daYunConceptPresent&&concept(timing[0]).annualConceptPresent);}
   if(/^[246]_/.test(row.name))assert.equal(timing.length,2,'SEPARATE_SOURCE_SPANS_NOT_PRESERVED');
   row.selectedTimingSpanCount=timing.length;
  }
  const pack=await loadBaziReviewAuthority(),baseline={schemaVersion:'BAZI_R2_CURRENT_PRODUCTION_PUBLICATION_BASELINE_V2',state:'MACHINE_REGRESSION_BASELINE',humanAcceptance:'NOT_HUMAN_ACCEPT',selectorSha256:r.selectorAfterSha256,compilerSha256:v1.compilerSha256,diagramOwnerSha256:v1.diagramOwnerSha256,cssSha256:v1.cssSha256,snapshotDigest:snapshot.digest,authorityDigest:pack.authorityDigest,lineage:['P5.2_CUSTOMER_NATIVE_SELECTOR','P7R3B_BASELINE_RECONCILIATION','P7R3C_S10_REQUIRED_CONCEPT_SUCCESSOR'],modes:{}};
  for(const mode of ['BILINGUAL','EN','ZH_HANS']){
   const prior=read(v1.modes[mode].path),ir=await compileBaziDeepPublication({snapshot,pack,presentationMode:mode,recomposePass:v1.modes[mode].recomposePass});
   assert.deepEqual(ir.manuscript,prior.manuscript);assert.deepEqual(ir.technical.diagrams,prior.technical.diagrams);assert.equal(ir.publication.pages.length,48);assert.equal(ir.technical.diagrams.length,15);
   const changed=ir.publication.pages.map((p,i)=>hash(p)===hash(prior.publication.pages[i])?null:i+1).filter(Boolean);assert(changed.every(n=>[45,46].includes(n)),'SELECTOR_SUCCESSOR_SCOPE_ESCAPED');
   const plan=p=>p.map(({content,insightCards,...rest})=>rest);assert.deepEqual(plan(ir.publication.pages),plan(prior.publication.pages),'SELECTOR_SUCCESSOR_SCOPE_ESCAPED');
   const locales=mode==='BILINGUAL'?['zh-Hans','en']:mode==='EN'?['en']:['zh-Hans'];const coverage=ir.editorial.coverage.find(s=>s.sectionId==='S10');for(const l of locales)assert.equal(coverage.locales[l].status,'PASS','S10_REQUIRED_CONCEPT_SELECTION_UNRESOLVED');
   const selected=selection(ir);for(const l of locales)assert(selected[l].daYunConceptPresent&&selected[l].annualConceptPresent&&selected[l].timingRolePresent,'S10_REQUIRED_CONCEPT_SELECTION_UNRESOLVED');
   for(const l of locales){const cap=layoutProfile(mode).bodyBudget[l];for(const excerpt of [selected[l].excerptA,selected[l].excerptB]){assert(excerpt.reduce((n,s)=>n+s.text.length,0)<=cap,'GOVERNED_BODY_BUDGET_EXCEEDED');for(const span of excerpt)assert.equal(s10[FIELD[l]].slice(span.start,span.end),span.text,'SPAN_NOT_EXACT_IMMUTABLE_SOURCE');}selected[l].budgetVerified=true;selected[l].exactSourceOffsetsVerified=true;}
   r.afterSelection[mode]=selected;r.coverage[mode]=Object.fromEntries(locales.map(l=>[l==='zh-Hans'?'zhHans':l,coverage.locales[l].status]));r.changedPages[mode]=changed;r.unchangedPages[mode]=Array.from({length:48},(_,i)=>i+1).filter(n=>!changed.includes(n));
   const output=dir+'P7R3C-CURRENT-PRODUCTION-'+mode+'.json';write(output,ir);baseline.modes[mode]={presentationMode:mode,recomposePass:ir.publication.recomposePass,path:output,publicationDigest:ir.digest,pagesDigest:hash(ir.publication.pages),diagramDigest:hash(ir.technical.diagrams),s10Coverage:coverage.locales};
  }
  r.historicalAcceptedArtifactsUnchanged=Object.entries(before.protectedHashes).every(([p,h])=>sha(fs.readFileSync(p))===h);assert(r.historicalAcceptedArtifactsUnchanged);
  r.currentBaselineV2=dir+'BAZI-R2-CURRENT-PRODUCTION-PUBLICATION-BASELINE-V2.json';write(r.currentBaselineV2,baseline);r.status='PASS_LOCAL';r.nextAction='STOP_AFTER_P7R3C. A future separately authorized D05/D10 repair may use baseline V2; no Authority/topology repair applied.';write(dir+'P7R3C-S10-TIMING-COVERAGE-SUCCESSOR.json',r);console.log(JSON.stringify({status:r.status,coverage:r.coverage,changedPages:r.changedPages,selectorAfterSha256:r.selectorAfterSha256}));
 }catch(error){assert.equal(sha(fs.readFileSync(selector)),r.selectorAfterSha256,'CONCURRENT_SELECTOR_CHANGE_NO_ROLLBACK');fs.copyFileSync(dir+'P7R3C-SELECTOR-BEFORE.js',selector);r.status='FAIL_ROLLED_BACK';r.remainingBlocker=error.message;write(dir+'P7R3C-S10-TIMING-COVERAGE-SUCCESSOR.json',r);throw error;}
}
