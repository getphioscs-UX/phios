import fs from 'node:fs';
import crypto from 'node:crypto';

const sourcePath = 'content/knowledge/knowledge-intelligence-r2/benchmarks/kir-r2-w15-100-question-machine-benchmark-v1.json';
const outputPath = 'content/knowledge/knowledge-intelligence-r2/benchmarks/kir-r2-deterministic-answerability-census-v1.json';
const sourceText = fs.readFileSync(sourcePath, 'utf8');
const source = JSON.parse(sourceText);
const classMap = {
  T0: 'T0_DETERMINISTIC',
  T1: 'T1_CANONICAL_ASSEMBLY',
  T2: 'T2_LIGHT_COMPOSITION',
  T3: 'T3_DEEP_COMPOSITION'
};

const cases = source.cases.map(item => {
  const aiExecutionClass = classMap[item.actual.modelTier];
  if (!aiExecutionClass) throw new Error(`UNKNOWN_KIR_EXECUTION_CLASS:${item.caseId}`);
  const evidenceSize = item.actual.top5.length;
  const before = evidenceSize * 360;
  const retained = aiExecutionClass === 'T0_DETERMINISTIC' ? 1 : Math.min(evidenceSize, 3);
  const after = retained * 240;
  const compositionRequired = aiExecutionClass === 'T2_LIGHT_COMPOSITION' || aiExecutionClass === 'T3_DEEP_COMPOSITION';
  return {
    caseId: item.caseId,
    intent: item.actual.intent,
    evidenceCoverage: item.actual.coverage,
    evidenceSize,
    aiExecutionClass,
    deterministicEligible: aiExecutionClass === 'T0_DETERMINISTIC',
    canonicalAssemblyEligible: aiExecutionClass === 'T0_DETERMINISTIC' || aiExecutionClass === 'T1_CANONICAL_ASSEMBLY',
    compositionRequired,
    deepCompositionRequired: aiExecutionClass === 'T3_DEEP_COMPOSITION',
    reasonCodes: aiExecutionClass === 'T0_DETERMINISTIC'
      ? ['DIRECT_SINGLE_EVIDENCE_DETERMINISTIC']
      : aiExecutionClass === 'T1_CANONICAL_ASSEMBLY'
        ? ['MULTI_FRAGMENT_CANONICAL_ASSEMBLY_SUFFICIENT']
        : aiExecutionClass === 'T2_LIGHT_COMPOSITION'
          ? ['GROUNDED_MODERATE_SYNTHESIS']
          : ['DEEP_CROSS_NODE_SYNTHESIS'],
    estimatedInputTokensWithoutOptimization: before,
    estimatedInputTokensAfterEvidenceDiscipline: after,
    estimatedTokensAvoided: before - after,
    classificationConfidence: item.metrics.sourceSupported && item.metrics.directAnswer ? 'HIGH' : 'MEDIUM',
    providerSelectedByCensus: null
  };
});

const counts = Object.fromEntries(Object.values(classMap).map(code => [code, cases.filter(item => item.aiExecutionClass === code).length]));
const totalEstimatedBefore = cases.reduce((sum, item) => sum + item.estimatedInputTokensWithoutOptimization, 0);
const totalEstimatedAfter = cases.reduce((sum, item) => sum + item.estimatedInputTokensAfterEvidenceDiscipline, 0);
const output = {
  schemaVersion: 'PHI-OS-KIR-R2-DETERMINISTIC-ANSWERABILITY-CENSUS-v1.0.0',
  baselineCommit: '454a7d1771feec5e2f6ab00bffdde46a5aa661f0',
  status: 'DETERMINISTIC_ANSWERABILITY_BASELINE_READY',
  sourceBenchmark: sourcePath,
  sourceBenchmarkSha256: crypto.createHash('sha256').update(sourceText).digest('hex'),
  authorityCreation: 'NONE',
  classifierOwner: 'KIR_R2',
  economicsConsumer: 'PAI_R1',
  aggregate: {
    totalCases: cases.length,
    t0Count: counts.T0_DETERMINISTIC,
    t1Count: counts.T1_CANONICAL_ASSEMBLY,
    t2Count: counts.T2_LIGHT_COMPOSITION,
    t3Count: counts.T3_DEEP_COMPOSITION,
    deterministicAnswerRate: counts.T0_DETERMINISTIC / cases.length,
    canonicalAssemblyRate: counts.T1_CANONICAL_ASSEMBLY / cases.length,
    llmRequiredRate: (counts.T2_LIGHT_COMPOSITION + counts.T3_DEEP_COMPOSITION) / cases.length,
    deepModelRequiredRate: counts.T3_DEEP_COMPOSITION / cases.length,
    averageEvidenceSize: cases.reduce((sum, item) => sum + item.evidenceSize, 0) / cases.length,
    estimatedTokenAvoidance: totalEstimatedBefore - totalEstimatedAfter,
    wrongClassificationRate: null,
    wrongClassificationRateState: 'REQUIRES_PILOT_HUMAN_OBSERVATION'
  },
  boundaries: {
    providerSelectedByCensusCount: 0,
    commerceDecisionCount: 0,
    retrievalMeaningMutationCount: 0,
    secondSemanticTruthBatchCreated: false
  },
  cases
};
fs.mkdirSync(outputPath.slice(0, outputPath.lastIndexOf('/')), {recursive: true});
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`✓ Generated ${cases.length}-case deterministic answerability census.`);
