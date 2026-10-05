import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZwrVfrCompactAuthoringPack} from '../functions/personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {planZwrFiveCallExperiment,composeZwrFiveCallExperiment} from '../functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js';
import {validateZwrFiveCallBatch} from '../functions/personal-reading/visual-first/ziwei-vfr-five-call-manuscript.js';

const fixture=JSON.parse(
 fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-02-en.json','utf8')
);
const pack=await buildZwrVfrCompactAuthoringPack({evidence:fixture.evidence});
const plan=planZwrFiveCallExperiment({pack});

assert.equal(plan.providerCallsPlanned,5);
assert.equal(plan.semanticReviewCallsPlanned,0);
assert.equal(plan.model,'gpt-5.6-sol');
assert.equal(plan.batches.length,5);
assert(plan.batches.every(b=>b.sectionIds.length===2));
assert(
 plan.estimatedMaxTotalCost<=1,
 'five-call experiment exceeds USD1 max preflight: '+plan.estimatedMaxTotalCost
);
assert.equal(plan.allowed,true);

let touched=false;
await assert.rejects(
 ()=>composeZwrFiveCallExperiment({
  pack,
  env:{},
  fetcher:async()=>{
   touched=true;
   throw Error('MUST_NOT_FETCH');
  }
 }),
 /VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED/
);
assert.equal(touched,false);

const samplePack={
 sections:[
  {
   sectionId:'S08',
   claims:[{claimId:'C1'}]
  }
 ]
};

const base={
 sections:[
  {
   sectionId:'S08',
   authorityRefs:['C1'],
   zhHans:{
    sectionThesis:'这是压力容量的结构读取，并不表示患有任何疾病。',
    structuralMechanism:[
     '疾厄宫只用于压力容量结构的解释，不等于医学结论。',
     '此结构需要结合现实负荷与恢复条件共同观察。'
    ],
    livedScenarios:[
     '任务拖滞时持续加力。',
     '压力高时更依赖量化。',
     '恢复不足时忽略柔性讯号。'
    ],
    constructiveExpression:[
     '在条件适合时，纪律执行可以支持长期任务。'
    ],
    pressureDistortion:[
     '压力累积后，持续可能变成循环用力。'
    ],
    counterweight:[
     '恢复条件与现实支持会改变这种结构的表现。'
    ],
    timingOverlay:[
     '时序只改变观察优先级，不构成疾病诊断。'
    ],
    realityNavigation:[
     '观察负荷与恢复是否同步变化。'
    ]
   },
   en:{
    sectionThesis:'This is a pressure-capacity reading and does not diagnose disease.',
    structuralMechanism:[
     'The Health Palace is used here for structural pressure reading, not a medical conclusion.',
     'Real workload and recovery conditions must be observed together.'
    ],
    livedScenarios:[
     'Effort rises when work stalls.',
     'Metrics dominate under pressure.',
     'Softer recovery signals may be ignored.'
    ],
    constructiveExpression:[
     'Disciplined execution can support long tasks when conditions fit.'
    ],
    pressureDistortion:[
     'Under strain, persistence can become repetitive force.'
    ],
    counterweight:[
     'Recovery conditions and support can alter expression.'
    ],
    timingOverlay:[
     'Timing changes observation priority and does not diagnose illness.'
    ],
    realityNavigation:[
     'Observe whether load and recovery move together.'
    ]
   }
  }
 ]
};

const negated=await validateZwrFiveCallBatch({
 batchPack:samplePack,
 output:base
});
assert.equal(
 negated.accepted,
 true,
 'negated medical boundary must not be rejected'
);

const affirmative=structuredClone(base);
affirmative.sections[0].zhHans.sectionThesis='这个结构表示患有某种疾病。';

const rejected=await validateZwrFiveCallBatch({
 batchPack:samplePack,
 output:affirmative
});
assert.equal(
 rejected.accepted,
 false,
 'affirmative medical diagnosis must be rejected'
);

const composerSource=fs.readFileSync(
 'functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js',
 'utf8'
);
const runnerSource=fs.readFileSync(
 'scripts/run-zwr-vfr-five-call-experiment.mjs',
 'utf8'
);

assert(
 composerSource.includes('onBatchCompleted'),
 'five-call composer must expose checkpoint callback'
);
assert(
 runnerSource.includes('CHECKPOINT.json'),
 'five-call runner must persist resumable checkpoint'
);

console.log(
 'PASS ZWR-VFR five-call pre-live: '+
 'batches=5x2 sections; '+
 'semantic review=0; '+
 'estimated max total cost=$'+plan.estimatedMaxTotalCost+'; '+
 'medical-negation guard regression PASS; '+
 'checkpoint/resume present; '+
 'provider not called.'
);
