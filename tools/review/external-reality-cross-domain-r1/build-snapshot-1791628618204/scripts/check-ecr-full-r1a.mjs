import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fullReportFixture} from './lib/ecr-full-report-fixture.mjs';
import {normalizePersonalCurrentRealityInput,canonicalizeCurrentRealityObservations,buildRealityComparisons,REALITY_COMPARISON_STATES,buildEcrContextEvidenceIntake} from '../functions/current-reality/personal-current-reality-runtime.js';
import {projectEcrContext} from '../functions/interpretation-runtime/ecr-context-projection.js';
import {ECR_CONTEXT_MAPPING_RULES} from '../functions/interpretation-runtime/ecr-context-mapping-rules.js';
import {renderEcrProduct} from '../assets/customer-ui/js/specialists/ecr/product-renderer.js';
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const writeReview=process.argv.includes('--write-review'),dir='docs/ecr-full-r1/context-review';
if(writeReview)fs.mkdirSync(dir+'/cases',{recursive:true});
const results=[],reviews=[],counts={EMBODIED_CONFIGURATION:0,EXPERIENCE_EXPRESSION:0,CURRENT_REALITY_COMPARISON:0};
const situations=[['Work has frequent interruptions','工作中经常被打断'],['Quiet space is available','有安静的空间'],['Resources are shared with family','资源需要与家人共享'],['A deadline limits available time','期限限制了可用时间'],['I have support for a transition','转变过程中有人支持我'],['Recovery space has increased','恢复空间增加了'],['Priorities are changing','优先事项正在变化'],['I can keep a steady rhythm','我可以维持稳定的节奏']];
for(let i=0;i<96;i++){
 const locale=Math.floor(i/12)%2?'zh-Hans':'en',scenario=i%12,f=await fullReportFixture(i%64,locale),core=f.report(true),before=hash(f.readingIR),zh=locale==='zh-Hans';
 const fields=buildEcrContextEvidenceIntake(locale);assert.equal(fields.length,7);
 const texts=[zh?'我注意到可用时间有限，但不能据此判断健康。':'I notice limited available time; this does not establish a health condition.',situations[Math.floor(i/12)][zh?1:0],zh?'我最近反复注意团队合作。':'I have repeatedly attended to team coordination.',zh?'在有明确分工时，这份经验更持续。':'The experience persists when roles are clear.',zh?'我从参与者而非旁观者的立场观察。':'I observe as a participant rather than a bystander.',zh?'这影响我目前的责任安排。':'This matters to my present responsibilities.',zh?'独处时，上述描述不一定成立。':'When alone, the account does not always fit.'];
 let raw=fields.map((field,j)=>({promptId:field.promptId,domain:field.domain,text:texts[j]}));
 if(scenario===0)raw=[];
 else if(scenario===1)raw=raw.slice(0,1);
 else if(scenario===2)raw=raw.slice(0,2);
 else if(scenario===6)raw=raw.filter(x=>x.promptId!=='EXPERIENCE_SELECTION');
 else if(scenario===7)raw=raw.map(x=>({...x,domain:x.promptId==='CARRIER_CONDITIONS'?'CURRENT_STATE':x.domain}));
 else if(scenario!==4&&scenario!==5)raw=raw.slice(0,6);
 const normalized=normalizePersonalCurrentRealityInput({optIn:raw.length>0,purposeCode:'PERSONAL_READING_REALITY_COMPARISON',observations:raw},locale),observationIr=canonicalizeCurrentRealityObservations(normalized);
 let comparisonIr=null;
 if(scenario>=8)comparisonIr=buildRealityComparisons({candidates:[{candidateId:'ECR-BASELINE',methodId:'ECR',claimRef:core.claims[0].claimId}],responses:[{candidateId:'ECR-BASELINE',state:REALITY_COMPARISON_STATES[scenario-8],observationRefs:observationIr.observations.slice(0,2).map(x=>x.observationId),note:zh?'这是我当前的核对，不是方法真实性评分。':'This is my present comparison, not a method truth score.'}],observationIr});
 const context=projectEcrContext({coreReport:core,observationIr,comparisonIr,reviewMode:true});
 assert.deepEqual(context,projectEcrContext({coreReport:core,observationIr,comparisonIr,reviewMode:true}));
 assert.equal(projectEcrContext({coreReport:core,observationIr,comparisonIr}).sections.length,0);
 const ids=context.sections.map(x=>x.sectionId);
 assert.equal(ids.includes('EMBODIED_CONFIGURATION'),![0,1,7].includes(scenario));
 assert.equal(ids.includes('EXPERIENCE_EXPRESSION'),![0,1,2,6,7].includes(scenario));
 assert.equal(ids.includes('CURRENT_REALITY_COMPARISON'),scenario>=8);
 const full=f.report(true,context),free=f.report(false,context);
 assert.deepEqual(full.structuralIdentity,core.structuralIdentity);assert.equal(hash(f.readingIR),before);
 assert.equal(free.sections.some(s=>s.number>11),false);assert.equal(free.claims.length,0);
 for(const c of context.claims){assert.equal(c.confidenceClass,'CONDITIONAL_REVIEW_CANDIDATE');assert(c.lineage.contextEvidenceRefs.length);assert(c.lineage.sourceRefs.length);assert(c.conditions.length);if([4,5].includes(scenario))assert(c.counterEvidenceRefs.length);}
 const product=f.product(full),html=renderEcrProduct({product}).readingHtml;
 for(const id of ['EMBODIED_CONFIGURATION','EXPERIENCE_EXPRESSION','CURRENT_REALITY_COMPARISON'])assert.equal(html.includes(`data-ecr-full-section="${id}"`),ids.includes(id));
 assert(!html.includes('Coming soon'));assert(!html.includes('Placeholder interpretation'));
 if(scenario>=8){const unit=context.sections.find(s=>s.number===14).comparisons[0];assert.equal(unit.comparisonState,REALITY_COMPARISON_STATES[scenario-8]);assert(unit.currentRealityEvidenceRefs.length);if(unit.comparisonState==='OPEN')assert.equal(unit.counterObservations.length,0);}
 const caseId=`ECR-CONTEXT-${String(i+1).padStart(3,'0')}`;
 results.push({caseId,scenario,locale,sections:ids,status:'PASS',digest:hash(full)});
 if(writeReview){const focus=Object.keys(counts).filter(x=>ids.includes(x)&&counts[x]<12).sort((a,b)=>counts[a]-counts[b])[0];if(focus){counts[focus]++;fs.writeFileSync(`${dir}/cases/${caseId}.json`,JSON.stringify({caseId,synthetic:true,focus,paid:product,free:f.product(free),evidence:observationIr,comparison:comparisonIr},null,2)+'\n');reviews.push({caseId,focus,locale,fixture:`cases/${caseId}.json`,decision:'PENDING',digest:hash(full)});}}
}
for(const locale of ['en','zh-Hans'])for(let scenario=0;scenario<12;scenario++)assert.equal(results.filter(x=>x.locale===locale&&x.scenario===scenario).length,4,'Every scenario must cover both locales');
assert.deepEqual(REALITY_COMPARISON_STATES,['CURRENTLY_RESONANT','PARTIALLY_RESONANT','CURRENTLY_NOT_RESONANT','OPEN']);
if(writeReview){assert.deepEqual(Object.values(counts),[12,12,12]);fs.writeFileSync(`${dir}/cases.json`,JSON.stringify({work:'ECR-FULL-R1A',caseCount:36,status:'PENDING',focusCounts:counts,cases:reviews},null,2)+'\n');}
fs.writeFileSync('docs/ecr-full-r1/context-machine-results.json',JSON.stringify({work:'ECR-FULL-R1A',caseCount:96,status:'MACHINE_PASS_HUMAN_PENDING',productionAdmission:false,results},null,2)+'\n');
fs.writeFileSync('docs/ecr-full-r1/context-mapping-rules.json',JSON.stringify({owner:'CANONICAL_INTERPRETATION_KERNEL',status:'PENDING_HUMAN_REVIEW',rules:ECR_CONTEXT_MAPPING_RULES},null,2)+'\n');
console.log('PASS ECR-FULL-R1A: 96 contextual cases; 36 focused human cases prepared when --write-review is used. No contextual production admission.');
