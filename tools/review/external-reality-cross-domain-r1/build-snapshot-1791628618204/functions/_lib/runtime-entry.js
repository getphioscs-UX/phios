import { SCHEMA_IDS } from '../runtime/shared/schema-registry.js';
import { THRESH, completeness } from './utils.js';

function cleanText(value) {
  if (typeof value !== 'string') return '';
  const cleaned = value
    .replace(/```(?:\w+)?/g, '')
    .replace(/^\s*(?:有|yes)[。.!]?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return /^(?:有|yes)[。.!]?$/i.test(cleaned) ? '' : cleaned;
}

function itemText(value) {
  if (typeof value === 'string') return cleanText(value);
  if (!value || typeof value !== 'object') return '';
  return cleanText(
    value.statement || value.summary || value.sourceText ||
    value.question || value.source || ''
  );
}

function uniqueText(values) {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).map(itemText).filter(value => {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

export function buildRuntimeEntry({ model = {}, scores = {}, request = {}, forced = false }) {
  const fields = model.extractedFields || {};
  const assessment = completeness(scores);
  const now = new Date().toISOString();
  const conversation = array(request.conversation);
  const initial = cleanText(
    conversation.find(item => item?.role === 'user')?.content || ''
  );
  const minimumRounds = Number(model?.assessment?.minimumRounds) || 3;
  const minimumRoundsMet = Number(request.entryRound) >= minimumRounds;
  const complete = model?.assessment?.entryComplete === true ||
    (assessment.entryComplete && minimumRoundsMet) || forced;
  const userCorpus = conversation
    .filter(item => item?.role === 'user')
    .map(item => cleanText(item.content))
    .join(' ')
    .toLowerCase();
  const proposedTiming = cleanText(fields.time?.rawExpression);
  const statedTiming = proposedTiming && userCorpus.includes(proposedTiming.toLowerCase())
    ? proposedTiming
    : '';
  const exactTiming = fields.time?.precision === 'exact_date' && Boolean(statedTiming);
  const observedEvidence = uniqueText(fields.evidence);
  const reportedExperience = uniqueText(fields.reportedExperience);
  const interpretations = uniqueText(fields.interpretations);
  const counterEvidence = uniqueText(fields.counterEvidence);
  const dependencies = array(fields.dependencies)
    .map(item => ({
      source: itemText(item),
      effect: cleanText(item?.effect),
      status: cleanText(item?.status) || 'reported'
    }))
    .filter(item => item.source);
  const unknown = uniqueText(fields.unknownReality);
  const tension = cleanText(fields.currentTension);
  const desiredTransition = cleanText(fields.desiredTransition);
  const reconstructionEvidence = array(fields.reconstructionEvidence)
    .map((item, index) => ({
      evidenceId: `entry_re_${String(index + 1).padStart(3, '0')}`,
      evidenceType: 'reported_experience',
      source: 'entry_adaptive_evidence',
      confidence: 1,
      target: cleanText(item?.target),
      statement: itemText(item),
      answeredAt: now
    }))
    .filter(item => item.target && item.statement);

  return {
    schemaVersion: SCHEMA_IDS.RUNTIME_ENTRY,
    runtimeEntityId: request.runtimeEntityId || `rt_${crypto.randomUUID().slice(0, 8)}`,
    runtimeEntryId: request.runtimeEntryId || `entry_${crypto.randomUUID().slice(0, 8)}`,
    status: complete ? 'ready_for_reconstruction' : 'collecting',
    entrySource: {
      interface: 'website',
      mode: 'conversation',
      language: /[\u3400-\u9fff]/.test(initial) ? 'zh-Hans' : 'en',
      startedAt: request.currentReading?.runtimeEntry?.entrySource?.startedAt || now,
      lastUpdatedAt: now
    },
    realityChange: {
      rawStatement: initial,
      normalizedStatement: cleanText(fields.observedChange),
      changeType: 'unclear',
      confidence: scores.observed_change
    },
    timing: {
      statedTiming,
      normalizedTiming: exactTiming
        ? cleanText(fields.time?.normalizedTime) || statedTiming
        : statedTiming,
      certainty: exactTiming ? 'exact' : statedTiming ? 'relative' : 'unknown'
    },
    affectedDomains: array(fields.affectedRealities).map(item => ({
      domain: cleanText(item?.domain) || 'unknown',
      relevance: item?.role === 'connected' ? 'contributing' : cleanText(item?.role) || 'possible',
      confidence: scores.affected_realities
    })),
    initialContext: {
      summary: uniqueText(fields.context).join('; '),
      involvedEntities: [],
      relevantConditions: uniqueText(fields.context)
    },
    entryEvidence: observedEvidence.map((statement, index) => ({
      evidenceId: `ev_${String(index + 1).padStart(3, '0')}`,
      evidenceType: 'user_statement',
      source: 'entry_conversation',
      statement,
      observedAt: '',
      reportedAt: now,
      confidence: scores.evidence
    })),
    knownReality: observedEvidence.map(statement => ({
      statement,
      supportedBy: [],
      confidence: scores.evidence
    })),
    userInterpretation: {
      summary: interpretations.join('; '),
      confidence: scores.evidence
    },
    emergingTension: {
      summary: tension,
      competingForces: uniqueText([tension, desiredTransition]),
      confidence: tension ? scores.current_tension : 0
    },
    desiredTransition,
    counterEvidence,
    dependencies,
    reconstructionEvidence,
    reconstructionEvidenceCoverage:
      model.reconstructionEvidenceCoverage || {},
    entryEvidenceAcquisitionComplete: complete,
    evidenceBoundary: {
      observedEvidence,
      reportedExperience,
      interpretation: interpretations,
      professionalAssessment: [],
      counterEvidence,
      dependencies,
      unknownReality: unknown
    },
    unknownReality: unknown.map(question => ({ question, significance: 'high' })),
    missingEvidence: Object.keys(THRESH)
      .filter(key => scores[key] < THRESH[key])
      .map(key => ({
        evidenceNeed: key.replaceAll('_', ' '),
        purpose: 'To improve Reconstruction without filling the gap with assumptions.',
        priority: 'high',
        requiredForEntry: false,
        suggestedCollectionMethod: 'reconstruction_conversation'
      })),
    reconstructionDirection: {
      focus: `Reconstruct the sequence, conditions and evidence around ${cleanText(fields.observedChange) || 'the reported change'}.`,
      rationale: 'Separate reported Reality, observable evidence, interpretation and unresolved alternatives.',
      priorityEvidence: uniqueText([...counterEvidence, ...unknown]).slice(0, 4)
    },
    entryAssessment: {
      maturityScore: assessment.entryCompleteness,
      requiredFieldsPresent: Object.keys(THRESH).filter(key => scores[key] >= THRESH[key]),
      missingRequiredFields: Object.keys(THRESH).filter(key => scores[key] < THRESH[key]),
      questionCount: Number(request.entryRound) || 0,
      entryComplete: complete,
      completionReason: forced && !assessment.entryComplete
        ? 'Maximum Entry depth reached; unresolved fields were preserved.'
        : model?.assessment?.noQuestionRemaining
          ? 'No additional high-value Entry question remained; unresolved fields were preserved.'
          : !minimumRoundsMet
            ? 'Minimum evidence-acquisition depth has not yet been reached.'
            : 'The Runtime Entry is sufficiently stable for Reconstruction.'
    },
    consent: {
      storageAllowed: false,
      reconstructionAllowed: true
    }
  };
}

export function chooseReply(model, target, ready, latest) {
  if (ready) {
    return /[\u3400-\u9fff]/.test(latest)
      ? '你的 Reality Entry 已足够稳定，可以进入重建。未确定的部分已保留为 Unknown Reality。'
      : 'Your Reality Entry is sufficiently stable for Reconstruction. Unresolved fields have been preserved as Unknown Reality.';
  }
  const candidate = array(model.questionCandidates)
    .find(item => item.target === target) || array(model.questionCandidates)[0];
  return [cleanText(model.acknowledgement), cleanText(candidate?.question)]
    .filter(Boolean)
    .join('\n\n');
}
