import fs from 'node:fs';
import crypto from 'node:crypto';

const paths = {
  live: 'review/KIR-R2-W16R2-100-CASE-LIVE-RESULTS.json',
  bakeoff: 'content/knowledge/knowledge-intelligence-r2/benchmarks/kir-r2-w16r2-24-case-provider-bakeoff-summary-v1.json',
  human: 'content/knowledge/knowledge-intelligence-r2/acceptance/kir-r2-w16r-final-human-acceptance-v1.json'
};
const raw = Object.fromEntries(Object.entries(paths).map(([key,path]) => [key,fs.readFileSync(path,'utf8')]));
const live = JSON.parse(raw.live);
const bakeoff = JSON.parse(raw.bakeoff);
const human = JSON.parse(raw.human);
const calls = live.cases.filter(item => item.providerMeta?.providerId);
const usage = calls.reduce((total,item) => ({
  inputTokens: total.inputTokens + Number(item.providerMeta.usage?.input || 0),
  cachedInputTokens: total.cachedInputTokens + Number(item.providerMeta.usage?.cachedInput || 0),
  outputTokens: total.outputTokens + Number(item.providerMeta.usage?.output || 0),
  latencyMs: total.latencyMs + Number(item.latencyMs || 0)
}),{inputTokens:0,cachedInputTokens:0,outputTokens:0,latencyMs:0});
const providerCostUsd = Object.values(bakeoff.providers).reduce((sum,item)=>sum+Number(item.totalCostUsdObserved||0),0);
const output = {
  schemaVersion: 'PHI-OS-PAID-ASK-EXISTING-REAL-EVIDENCE-CALIBRATION-v1.0.0',
  baselineCommit: '90d4a7ce304a3a2fe5a0f6547ff911565144faee',
  status: 'REAL_PROVIDER_AND_RELEVANCE_CALIBRATION_AVAILABLE_NOT_PAID_COHORT_EVIDENCE',
  sources: Object.entries(paths).map(([key,path])=>({key,path,sha256:crypto.createHash('sha256').update(raw[key]).digest('hex')})),
  liveCompositionCalibration: {
    evidenceClass: 'REAL_PROVIDER_CALIBRATION',
    requestCount: calls.length,
    providerDistribution: Object.fromEntries([...new Set(calls.map(item=>item.providerMeta.providerId))].map(provider=>[provider,calls.filter(item=>item.providerMeta.providerId===provider).length])),
    inputTokens: usage.inputTokens,
    cachedInputTokens: usage.cachedInputTokens,
    outputTokens: usage.outputTokens,
    averageLatencyMs: usage.latencyMs / calls.length,
    guardPassed: live.summary.guardPassed
  },
  observedProviderCostCalibration: {
    evidenceClass: 'REAL_PROVIDER_CALIBRATION',
    requestCount: bakeoff.caseCount * Object.keys(bakeoff.providers).length,
    comparedQuestionCount: bakeoff.caseCount,
    totalCostUsdObserved: providerCostUsd,
    providers: Object.fromEntries(Object.entries(bakeoff.providers).map(([key,value])=>[key,{humanAcceptanceRate:value.humanAcceptanceRate,totalCostUsdObserved:value.totalCostUsdObserved,avgLatencyMsObserved:value.avgLatencyMsObserved}]))
  },
  relevanceCalibration: {
    evidenceClass: 'REAL_PROVIDER_CALIBRATION',
    effectiveAccepted: human.effectiveSuccessorAcceptance.effectiveAccepted,
    effectiveTotal: human.effectiveSuccessorAcceptance.effectiveTotal,
    criticalFailures: human.effectiveSuccessorAcceptance.criticalFailures
  },
  paidPilotBoundary: {
    paidCohortParticipantsObserved: 0,
    commerceTransactionsObserved: 0,
    creditDebitsObserved: 0,
    upgradeConversionsObserved: 0,
    actualPaidAskMarginObserved: false,
    maySatisfyPaidAskAcceptance: false
  }
};
const target='content/ai-economics/paid-ask/evidence/paid-ask-existing-real-evidence-calibration-v1.json';
fs.mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});
fs.writeFileSync(target,`${JSON.stringify(output,null,2)}\n`);
console.log(`✓ Generated Paid Ask calibration from ${calls.length} live composition requests and ${bakeoff.caseCount} provider comparisons.`);
