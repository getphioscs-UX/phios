import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeBaziFinalStructuralVerdictR2} from '../functions/bzr-full-production/bazi-final-structural-verdict-r2.js';

const chart={
 schemaVersion:'PHI-OS-BAZI-CANONICAL-CHART-IR-v1.0.0',
 chartDigest:'GEN01-CONTROLLED',
 dayMaster:{code:'GENG',zh:'庚',element:'METAL',polarity:'YANG'},
 monthCommand:{season:'WINTER',branch:{code:'ZI',zh:'子'}},
 pillars:[
  {position:'YEAR',stem:{element:'METAL'},branch:{element:'METAL'}},
  {position:'MONTH',stem:{element:'WOOD'},branch:{element:'WATER'}},
  {position:'DAY',stem:{element:'METAL'},branch:{element:'EARTH'}},
  {position:'HOUR',stem:{element:'METAL'},branch:{element:'WOOD'}}
 ]
};
const relationships={
 schemaVersion:'PHI-OS-BAZI-STEM-BRANCH-RELATIONSHIPS-v1.0.0',
 relations:[
  {type:'BRANCH_THREE_HARMONY',members:['SHEN','ZI','CHEN'],element:'WATER',positions:['YEAR','MONTH','DAY'],transformationEstablished:false},
  {type:'BRANCH_CLASH',members:['YIN','SHEN'],positions:['HOUR','YEAR'],transformationEstablished:false}
 ]
};
const strengthSeasonal={
 schemaVersion:'PHI-OS-BAZI-STRENGTH-SEASONAL-EVIDENCE-v1.0.0',
 seasonalContext:{monthElementRelationToDayMaster:'OUTPUT_DRAIN'},
 rootEvidence:[{match:'EXACT_DAY_STEM'}],
 evidenceSummary:{
  rootEvidenceCount:1,
  unweightedVisibleRelationCounts:{PEER_SUPPORT:3,RESOURCE_SUPPORT:1,OUTPUT_DRAIN:1,CONTROLLED_BY_DAY_MASTER:2,PRESSURE_ON_DAY_MASTER:0}
 }
};
const patterns={
 schemaVersion:'PHI-OS-BAZI-PATTERN-CANDIDATE-IR-v1.0.0',
 patternCandidates:[{candidateId:'MONTH_COMMAND_GUI',patternFamily:'SHANG_GUAN',tenGodZh:'伤官'}]
};
const out=await analyzeBaziFinalStructuralVerdictR2({chart,relationships,strengthSeasonal,patterns});
assert.equal(out.relationshipVerdicts[0].configurationEstablished,true);
assert.equal(out.relationshipVerdicts[0].fullElementalTransformationEstablished,false);
assert.equal(out.strength.verdict,'BALANCED_LEAN_WEAK');
assert.equal(out.pattern.primaryPattern,'SHANG_GUAN');
assert.equal(out.pattern.formationPath,'SHANG_GUAN_SHENG_CAI');
assert.equal(out.usefulGod.primaryReportUse.usefulGod,'EARTH');
assert.deepEqual(out.usefulGod.primaryReportUse.supportingElements,['METAL']);
assert.equal(out.usefulGod.schoolViews.find(x=>x.schoolCode==='DI_TIAN_SUI_TIAOHOU_R2').elementCandidates[0],'FIRE');

const pack=JSON.parse(fs.readFileSync('docs/acceptance/bazi-paid-report/editorial/GEN-01-AUTHORITY-PACK-R2.json','utf8'));
assert.equal(pack.chart.finalStructuralVerdictR2.dayMasterStrength.verdictCode,'BALANCED_LEAN_WEAK');
assert.equal(pack.chart.finalStructuralVerdictR2.primaryPattern.familyCode,'SHANG_GUAN');
assert.equal(pack.chart.finalStructuralVerdictR2.usefulGod.primary.element,'EARTH');
const api=fs.readFileSync('functions/api/bazi-full-reading-r2.js','utf8');
assert.match(api,/analyzeBaziFinalStructuralVerdictR2/);
assert.match(api,/REPORT-PRO-COMPOSER-R1/);

console.log('PASS BAZI-FP-R2 final structural verdict: GEN-01 resolves three-harmony configuration, strength, primary pattern and school-qualified useful-god views.');
