import fs from 'node:fs';
import {METHODS,W18_BASELINE_COMMIT,diversityCases,buildDiversityCase,campaignSummary} from './smr-r2-diversity-support.mjs';
const out=[];
for(const methodId of METHODS){
  for(const c of diversityCases[methodId]){
    const built=await buildDiversityCase(methodId,c);
    out.push(built.row);
    console.log(`${built.row.caseId} ${built.row.semanticDigest} ${built.row.counts.claims}/${built.row.counts.themes}/${built.row.counts.eligibleSections}`);
  }
}
const summary=campaignSummary(out);
const campaign={
  schemaVersion:'PHI-OS-SMR-R2-STRUCTURAL-DIVERSITY-CAMPAIGN-v1.0.0',baselineCommit:W18_BASELINE_COMMIT,workCode:'R2-W18',status:'MACHINE_CAMPAIGN_GENERATED',
  purpose:'Product structural diversity campaign after five founder-accepted benchmarks; not a repeat of method Full Production machine campaigns.',
  required:{methods:{AST:8,BZR:8,ZWR:8,NUM:8,ECR:8},total:40,sameChartDifferentLocaleDoesNotCount:true,sameChartDifferentQuestionDoesNotCount:true,dimensions:['METHOD_NATIVE_STRUCTURE','PRIORITY_PROFILE','THEME_DISTRIBUTION','SUPPORT_TENSION_RATIO','SECTION_ELIGIBILITY']},
  cases:out,summary,
  governance:{methodCalculationAuthorityReused:true,rendererCreatesMeaning:false,rawProjectionCreatesCustomerConclusion:false,liveCustomerIndividuallyHumanReviewed:false,benchmarkHumanAcceptancePrerequisite:'R2-W17_5_OF_5_ACCEPTED'},
  next:'R2-W19 PRODUCT_INTEGRATION_HUMAN_REVIEW_20_CASES'
};
fs.mkdirSync('content/customer-experience-rebuild/r12r4b/smr-r2/campaign',{recursive:true});
fs.writeFileSync('content/customer-experience-rebuild/r12r4b/smr-r2/campaign/smr-r2-structural-diversity-campaign-v1.json',JSON.stringify(campaign,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
