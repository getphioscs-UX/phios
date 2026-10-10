import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  understandKirQuestion,
  expandKirQuery,
  hybridKirRetrieve,
  rerankKirEvidence,
  deduplicateKirEvidence,
  buildKirEvidencePack
} from '../../functions/_lib/kir-r2-intelligence.js';

const ROOT = process.cwd();
const BASELINE_COMMIT = '1f81638d214bd946778e4ac721a0f7b265eac116';
const RECORDED_AT = '2026-09-10';
const PATHS = Object.freeze({
  book123Profiles: 'content/knowledge/knowledge-intelligence-r2/semantic-profiles/kir-r2-book-i-iii-semantic-retrieval-profiles-v1.json',
  book4Profiles: 'content/knowledge/knowledge-intelligence-r2/semantic-profiles/successors/book4-a2/book4-retrieval-semantic-profiles-v1.json',
  book4Canonical: 'content/knowledge/registry/successors/book4-a1-final/canonical-nodes-v1.json',
  book4Inventory: 'content/knowledge/manuscripts/extraction/book-4-final-section-inventory-v1.json',
  articleMap: 'content/knowledge/production-planning/plans/book4-a3-final-article-map-v1.json',
  legacyBenchmark: 'content/knowledge/knowledge-intelligence-r2/benchmarks/kir-r2-w15-100-question-machine-benchmark-v1.json',
  activeAdmission: 'content/knowledge/knowledge-intelligence-r2/registries/kir-r2-book-i-iii-source-admission-v1.json'
});

const readJson = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const digestFile = p => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, p))).digest('hex');
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const rate = (n,d) => Number((d ? n/d : 0).toFixed(6));
const cjk = /[\u3400-\u9fff]/;

function pickQuestion(profile, locale){
  const qs = profile.naturalQuestions || [];
  if (locale === 'zh-Hans') return qs.find(q => cjk.test(q)) || profile.canonicalMeaning?.canonicalQuestion || profile.canonicalName?.['zh-Hans'];
  return qs.find(q => !cjk.test(q) && /[A-Za-z]/.test(q)) || `What does “${profile.canonicalName?.en || profile.nodeCode}” mean in Reality Expansion?`;
}

function runRetrieval(question, locale, profiles){
  const understanding = understandKirQuestion({question, locale});
  const expansion = expandKirQuery(understanding, profiles);
  const retrieval = hybridKirRetrieve({understanding, expansion, profiles});
  const reranked = rerankKirEvidence({understanding, retrieval});
  const deduplicated = deduplicateKirEvidence(reranked);
  const evidencePack = buildKirEvidencePack({understanding, deduplicated});
  return {understanding, expansion, retrieval, reranked, deduplicated, evidencePack};
}

function buildSourceGroundingChecker({nodes, inventory, articleMap}){
  const nodeByCode = new Map(nodes.map(n => [n.nodeCode, n]));
  const sectionByCode = new Map(inventory.sections.filter(s => s.segmentType === 'SECTION').map(s => [s.sectionCode, s]));
  const articleByNode = new Map();
  for (const article of articleMap.articles || []) {
    for (const binding of article.sourceBindings || []) articleByNode.set(binding.nodeCode, {article, binding});
  }
  return profile => {
    const node = nodeByCode.get(profile.nodeCode);
    const source = profile.bookSources?.[0];
    const canonical = node?.canonicalSourceBinding;
    const inventorySection = sectionByCode.get(source?.sectionCode);
    const articleRecord = articleByNode.get(profile.nodeCode);
    const articleBinding = articleRecord?.binding;
    const inventoryPages = inventorySection ? [inventorySection.startPage, inventorySection.endPage] : null;
    const checks = {
      canonicalNodeExists: Boolean(node),
      finalInventorySectionExists: Boolean(inventorySection),
      a3ArticleBindingExists: Boolean(articleBinding),
      profileToCanonicalSection: source?.sectionCode === canonical?.sectionCode,
      profileToCanonicalDigest: source?.textSha256 === canonical?.textSha256,
      profileToCanonicalPages: same(source?.pages, canonical?.pages),
      inventoryToProfileDigest: inventorySection?.textSha256 === source?.textSha256,
      inventoryToProfilePages: same(inventoryPages, source?.pages),
      articleToProfileSection: articleBinding?.sectionCode === source?.sectionCode,
      articleToProfileDigest: articleBinding?.textSha256 === source?.textSha256,
      articleToProfilePages: same(articleBinding?.pages, source?.pages),
      articleToProfileId: articleBinding?.profileId === profile.profileId
    };
    return {passed:Object.values(checks).every(Boolean), checks, articlePlanId:articleRecord?.article?.articlePlanId || null};
  };
}

export function buildBook4A4Benchmark(){
  const book123Doc = readJson(PATHS.book123Profiles);
  const book4Doc = readJson(PATHS.book4Profiles);
  const canonicalDoc = readJson(PATHS.book4Canonical);
  const inventoryDoc = readJson(PATHS.book4Inventory);
  const articleMap = readJson(PATHS.articleMap);
  const legacyBenchmark = readJson(PATHS.legacyBenchmark);
  const activeAdmission = readJson(PATHS.activeAdmission);

  if (book4Doc.profiles.length !== 125) throw new Error(`BOOK4_A4_EXPECTED_125_PROFILES:${book4Doc.profiles.length}`);
  if (canonicalDoc.nodes.length !== 125) throw new Error(`BOOK4_A4_EXPECTED_125_NODES:${canonicalDoc.nodes.length}`);
  if ((articleMap.articles || []).length !== 53) throw new Error(`BOOK4_A4_EXPECTED_53_ARTICLES:${(articleMap.articles || []).length}`);
  if (book4Doc.profiles.some(p => p.productionEligible !== false || p.bookIVAdmitted !== false)) throw new Error('BOOK4_A4_PRE_ADMISSION_BOUNDARY_BROKEN');
  if ((activeAdmission.productionBooks || []).includes('BOOK-4')) throw new Error('BOOK4_A4_ACTIVE_ADMISSION_MUST_REMAIN_CLOSED');

  // Admission benchmark only: Book IV profiles are injected into the existing KIR-R2
  // retrieval functions without changing the active Book I–III source registry.
  // Pre-admission article candidates are deliberately suppressed so they cannot be
  // mislabeled as PUBLISHED_ARTICLE evidence by the generic hybrid retriever.
  const book4Profiles = book4Doc.profiles.map(p => ({...p, articleSources:[]}));
  const combinedProfiles = [...book123Doc.profiles, ...book4Profiles];
  const sourceGrounding = buildSourceGroundingChecker({nodes:canonicalDoc.nodes, inventory:inventoryDoc, articleMap});

  const positiveCases = [];
  let index = 0;
  for (const profile of book4Profiles) {
    for (const locale of ['zh-Hans','en']) {
      index += 1;
      const question = pickQuestion(profile, locale);
      const result = runRetrieval(question, locale, combinedProfiles);
      const top = result.deduplicated.results?.[0] || null;
      const top5 = result.deduplicated.results.slice(0,5).map(x => x.nodeCode);
      const top5Books = [...new Set(result.deduplicated.results.slice(0,5).map(x => x.bookCode))];
      const grounding = sourceGrounding(profile);
      const dedupNodeCodes = result.deduplicated.results.map(x => x.nodeCode);
      const dedupUnique = new Set(dedupNodeCodes).size === dedupNodeCodes.length;
      const top5Recall = top5.includes(profile.nodeCode);
      const directAnswerPotential = top5Recall && grounding.passed && Boolean(profile.canonicalMeaning?.canonicalQuestion) && (profile.bookSources || []).length > 0;
      positiveCases.push({
        caseId:`BOOK4-A4-${String(index).padStart(3,'0')}`,
        locale,
        question,
        expected:{nodeCode:profile.nodeCode,bookCode:'BOOK-4',partCode:profile.partCode,profileId:profile.profileId},
        actual:{
          topNode:top?.nodeCode || null,
          topBook:top?.bookCode || null,
          top5,
          top5Books,
          candidateCount:result.expansion.canonicalCandidates.length,
          rawRetrievalCount:result.retrieval.results.length,
          rerankedCount:result.reranked.results.length,
          deduplicatedCount:result.deduplicated.results.length,
          evidenceCoverage:result.evidencePack.coverage
        },
        sourceGrounding:{passed:grounding.passed,articlePlanId:grounding.articlePlanId},
        metrics:{
          top1NodeCorrect:top?.nodeCode === profile.nodeCode,
          top5Recall,
          book4Top1:top?.bookCode === 'BOOK-4',
          wrongBookTop1:Boolean(top) && top.bookCode !== 'BOOK-4',
          sourceGrounded:grounding.passed,
          dedupUnique,
          directAnswerPotential
        }
      });
    }
  }

  const legacyControlCases = [];
  for (const oldCase of legacyBenchmark.cases || []) {
    const result = runRetrieval(oldCase.question, oldCase.locale, combinedProfiles);
    const top = result.deduplicated.results?.[0] || null;
    const top5 = result.deduplicated.results.slice(0,5).map(x => x.nodeCode);
    legacyControlCases.push({
      caseId:`BOOK4-A4-CTRL-${oldCase.caseId}`,
      sourceCaseId:oldCase.caseId,
      locale:oldCase.locale,
      question:oldCase.question,
      expected:oldCase.expected,
      actual:{topNode:top?.nodeCode || null,topBook:top?.bookCode || null,top5},
      metrics:{
        expectedNodeTop1:top?.nodeCode === oldCase.expected.nodeCode,
        expectedNodeTop5:top5.includes(oldCase.expected.nodeCode),
        expectedBookTop1:top?.bookCode === oldCase.expected.bookCode,
        book4HijackTop1:top?.bookCode === 'BOOK-4'
      }
    });
  }

  const count = (arr,key) => arr.filter(c => c.metrics[key] === true).length;
  const positiveCount = positiveCases.length;
  const zh = positiveCases.filter(c => c.locale === 'zh-Hans');
  const en = positiveCases.filter(c => c.locale === 'en');
  const controlCount = legacyControlCases.length;
  const wrongBookCount = count(positiveCases,'wrongBookTop1');
  const controlHijacks = count(legacyControlCases,'book4HijackTop1');
  const summary = {
    book4PositiveCaseCount:positiveCount,
    localeDistribution:{'zh-Hans':zh.length,en:en.length},
    top1NodePrecision:rate(count(positiveCases,'top1NodeCorrect'),positiveCount),
    top5Recall:rate(count(positiveCases,'top5Recall'),positiveCount),
    book4Top1Precision:rate(count(positiveCases,'book4Top1'),positiveCount),
    wrongBookTop1Rate:rate(wrongBookCount,positiveCount),
    sourceGroundingRate:rate(count(positiveCases,'sourceGrounded'),positiveCount),
    dedupIntegrityRate:rate(count(positiveCases,'dedupUnique'),positiveCount),
    directAnswerPotentialRate:rate(count(positiveCases,'directAnswerPotential'),positiveCount),
    byLocale:{
      'zh-Hans':{
        caseCount:zh.length,
        top1NodePrecision:rate(count(zh,'top1NodeCorrect'),zh.length),
        top5Recall:rate(count(zh,'top5Recall'),zh.length),
        wrongBookTop1Rate:rate(count(zh,'wrongBookTop1'),zh.length)
      },
      en:{
        caseCount:en.length,
        top1NodePrecision:rate(count(en,'top1NodeCorrect'),en.length),
        top5Recall:rate(count(en,'top5Recall'),en.length),
        wrongBookTop1Rate:rate(count(en,'wrongBookTop1'),en.length)
      }
    },
    legacyControl:{
      caseCount:controlCount,
      expectedNodeTop1Rate:rate(count(legacyControlCases,'expectedNodeTop1'),controlCount),
      expectedNodeTop5Recall:rate(count(legacyControlCases,'expectedNodeTop5'),controlCount),
      expectedBookTop1Rate:rate(count(legacyControlCases,'expectedBookTop1'),controlCount),
      book4HijackTop1Rate:rate(controlHijacks,controlCount)
    }
  };

  const thresholds = {
    minimumTop1NodePrecision:0.90,
    minimumTop5Recall:0.98,
    minimumBook4Top1Precision:0.99,
    maximumWrongBookTop1Rate:0.01,
    minimumSourceGroundingRate:1,
    minimumDedupIntegrityRate:1,
    minimumDirectAnswerPotentialRate:0.98,
    minimumPerLocaleTop5Recall:0.95,
    minimumPerLocaleTop1NodePrecision:0.80,
    minimumLegacyControlTop5Recall:1,
    maximumLegacyBook4HijackTop1Rate:0.01
  };
  const machineAccepted =
    summary.top1NodePrecision >= thresholds.minimumTop1NodePrecision &&
    summary.top5Recall >= thresholds.minimumTop5Recall &&
    summary.book4Top1Precision >= thresholds.minimumBook4Top1Precision &&
    summary.wrongBookTop1Rate <= thresholds.maximumWrongBookTop1Rate &&
    summary.sourceGroundingRate >= thresholds.minimumSourceGroundingRate &&
    summary.dedupIntegrityRate >= thresholds.minimumDedupIntegrityRate &&
    summary.directAnswerPotentialRate >= thresholds.minimumDirectAnswerPotentialRate &&
    summary.byLocale['zh-Hans'].top5Recall >= thresholds.minimumPerLocaleTop5Recall &&
    summary.byLocale.en.top5Recall >= thresholds.minimumPerLocaleTop5Recall &&
    summary.byLocale['zh-Hans'].top1NodePrecision >= thresholds.minimumPerLocaleTop1NodePrecision &&
    summary.byLocale.en.top1NodePrecision >= thresholds.minimumPerLocaleTop1NodePrecision &&
    summary.legacyControl.expectedNodeTop5Recall >= thresholds.minimumLegacyControlTop5Recall &&
    summary.legacyControl.book4HijackTop1Rate <= thresholds.maximumLegacyBook4HijackTop1Rate;

  const residualDiagnostics = {
    top5Misses:positiveCases.filter(c => !c.metrics.top5Recall).map(c => ({caseId:c.caseId,locale:c.locale,expectedNode:c.expected.nodeCode,question:c.question,topNode:c.actual.topNode,topBook:c.actual.topBook,top5:c.actual.top5})),
    wrongBookTop1:positiveCases.filter(c => c.metrics.wrongBookTop1).map(c => ({caseId:c.caseId,locale:c.locale,expectedNode:c.expected.nodeCode,question:c.question,topNode:c.actual.topNode,topBook:c.actual.topBook,expectedStillInTop5:c.metrics.top5Recall})),
    interpretation:'Residual diagnostics are carried into BOOK-IV-A5 human acceptance; passing thresholds do not erase these cases.'
  };

  const benchmark = {
    schemaVersion:'PHI-OS-BOOK4-A4-MACHINE-RETRIEVAL-BENCHMARK-v1.0.0',
    work:'BOOK-IV-A4',
    status:machineAccepted?'MACHINE_ACCEPTED_A5_READY_PUBLICATION_CLOSED':'MACHINE_BENCHMARK_FAILED',
    baselineCommit:BASELINE_COMMIT,
    recordedAt:RECORDED_AT,
    bookCode:'BOOK-4',
    runtimeModule:'functions/_lib/kir-r2-intelligence.js',
    fixtureProvenance:'250 bilingual node-level questions derived from the 125 BOOK-IV-A2 semantic profiles (one zh-Hans + one en per final node), plus the existing 100-case KIR-R2 W15 Book I–III benchmark replayed as a no-hijack control. No production traffic is claimed.',
    preAdmissionSimulation:{
      existingKirRuntimeReused:true,
      activeBook123ProfilesInjected:true,
      book4A2ProfilesInjectedOnlyForBenchmark:true,
      book4ArticleSourcesSuppressed:true,
      reason:'Book IV article candidates are pre-admission and must not be represented as PUBLISHED_ARTICLE evidence before A6.',
      activeKIRRegistryMutated:false
    },
    sourceIntegrity:{
      activeBook123ProfileSha256:digestFile(PATHS.book123Profiles),
      activeAdmissionRegistrySha256:digestFile(PATHS.activeAdmission),
      book4A2ProfileSha256:digestFile(PATHS.book4Profiles),
      book4A1CanonicalSha256:digestFile(PATHS.book4Canonical),
      book4FinalInventorySha256:digestFile(PATHS.book4Inventory),
      book4A3ArticleMapSha256:digestFile(PATHS.articleMap)
    },
    thresholds,
    summary,
    residualDiagnostics,
    positiveCases,
    legacyControlCases,
    machineAccepted,
    boundaries:{
      bookIVAdmitted:false,
      productionEligible:false,
      publicationOpened:false,
      activeKIRSourceRegistryMutationPerformed:false,
      canonicalMeaningMutationPerformed:false,
      articleTextGeneratedByA4:false,
      humanAcceptanceClaimed:false,
      integratedProgramPhaseAdvancedByA4:false,
      nextWorkStep:'BOOK-IV-A5_HUMAN_ACCEPTANCE'
    }
  };

  const acceptance = {
    schemaVersion:'PHI-OS-BOOK4-A4-MACHINE-ACCEPTANCE-v1.0.0',
    work:'BOOK-IV-A4',
    status:machineAccepted?'MACHINE_ACCEPTED_A5_HUMAN_PENDING':'MACHINE_REJECTED',
    baselineCommit:BASELINE_COMMIT,
    recordedAt:RECORDED_AT,
    benchmarkPath:'content/knowledge/knowledge-intelligence-r2/benchmarks/book4-a4-machine-retrieval-benchmark-v1.json',
    authorityPath:'content/knowledge/contracts/book-4-machine-benchmark-authority-v1.json',
    summary,
    thresholds,
    machineAccepted,
    residualDiagnostics:{top5MissCount:residualDiagnostics.top5Misses.length,wrongBookTop1Count:residualDiagnostics.wrongBookTop1.length,carriedToA5:true},
    boundaries:benchmark.boundaries,
    nextGate:'BOOK-IV-A5 Human Acceptance'
  };

  const audit = {
    schemaVersion:'PHI-OS-BOOK4-A4-MACHINE-RETRIEVAL-AUDIT-v1.0.0',
    stage:'BOOK-IV-A4',
    status:machineAccepted?'COMPLETE_MACHINE_ACCEPTED':'FAILED',
    baselineCommit:BASELINE_COMMIT,
    recordedAt:RECORDED_AT,
    bookCode:'BOOK-4',
    benchmarkPath:acceptance.benchmarkPath,
    counts:{
      finalCanonicalNodes:125,
      positiveCases:positiveCount,
      zhHansCases:zh.length,
      enCases:en.length,
      legacyBook123ControlCases:controlCount,
      articleIdentitiesMapped:53,
      batches:11
    },
    gates:{
      retrievalRecall:summary.top5Recall >= thresholds.minimumTop5Recall,
      retrievalPrecision:summary.top1NodePrecision >= thresholds.minimumTop1NodePrecision,
      wrongBookRate:summary.wrongBookTop1Rate <= thresholds.maximumWrongBookTop1Rate,
      sourceGrounding:summary.sourceGroundingRate >= thresholds.minimumSourceGroundingRate,
      dedup:summary.dedupIntegrityRate >= thresholds.minimumDedupIntegrityRate,
      directAnswerPotential:summary.directAnswerPotentialRate >= thresholds.minimumDirectAnswerPotentialRate,
      legacyNoHijack:summary.legacyControl.expectedNodeTop5Recall >= thresholds.minimumLegacyControlTop5Recall && summary.legacyControl.book4HijackTop1Rate <= thresholds.maximumLegacyBook4HijackTop1Rate
    },
    residualDiagnostics,
    admissionBoundary:{bookIVAdmitted:false,publicationOpened:false,A5Required:true,A6Required:true}
  };

  return {benchmark, acceptance, audit};
}

export { BASELINE_COMMIT, RECORDED_AT, PATHS };
