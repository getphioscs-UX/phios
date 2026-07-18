import { FIELD_NAMES, THRESH, completeness, nextTarget } from '../../_lib/utils.js';
import evaluateEntryRuleFirst from './rule-entry.js';
import { isSourceTextGrounded } from './provider-contract.js';
import runWorkersAIEntry from './providers/workers-ai.js';
import runOpenAIEntry from './providers/openai.js';

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function clamp(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function uniqueText(values) {
  const seen = new Set();
  return list(values).map(cleanText).filter(value => {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function groundedCandidate(candidate, conversation) {
  const sourceText = cleanText(candidate?.sourceText);
  if (!sourceText || !isSourceTextGrounded(sourceText, conversation)) return null;
  return { ...candidate, sourceText, confidence: clamp(candidate?.confidence) };
}

function groundedCandidates(candidates, conversation, limit) {
  const seen = new Set();
  const output = [];

  for (const candidate of list(candidates)) {
    const grounded = groundedCandidate(candidate, conversation);
    const key = grounded?.sourceText.toLowerCase();
    if (!grounded || seen.has(key)) continue;
    seen.add(key);
    output.push(grounded);
    if (output.length >= limit) break;
  }

  return output;
}

function explicitDate(value) {
  const text = cleanText(value);
  return /(?:19|20)\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}/.test(text) ||
    /\d{1,2}[-/.]\d{1,2}[-/.](?:19|20)?\d{2}/.test(text);
}

function raisedScore(current, candidateConfidence, ceiling = 0.72) {
  return Math.max(clamp(current), Math.min(ceiling, clamp(candidateConfidence) * 0.8));
}

function addUnique(base, additions, limit = 8) {
  return uniqueText([...list(base), ...list(additions)]).slice(0, limit);
}

function conflictsWithObserved(sourceText, observedEvidence) {
  const candidate = cleanText(sourceText).toLowerCase();
  return list(observedEvidence).some(value => {
    const observed = cleanText(value).toLowerCase();
    return candidate && observed && (
      candidate === observed ||
      observed.includes(candidate) ||
      candidate.includes(observed)
    );
  });
}

function explicitProfessionalSource(sourceText) {
  return /\b(?:doctor|physician|lawyer|accountant|therapist|psychologist|psychiatrist|auditor|licensed|certified|diagnosed)\b|(?:医生|医师|律师|会计师|治疗师|心理师|精神科|审计师|持牌|认证|诊断)/i.test(
    cleanText(sourceText)
  );
}

function providerQuestions(enrichment, missingFields) {
  return list(enrichment?.questionCandidates)
    .filter(item => (
      missingFields.includes(cleanText(item?.target)) &&
      cleanText(item?.question)
    ))
    .map(item => ({
      target: cleanText(item.target),
      question: cleanText(item.question)
    }))
    .slice(0, 3);
}

function nextUnaskedTarget(fieldCompleteness, askedTargets = []) {
  const asked = new Set(list(askedTargets).map(cleanText));
  let target = nextTarget(fieldCompleteness);

  if (!asked.has(target)) return target;

  target = FIELD_NAMES.find(field => (
    fieldCompleteness[field] < THRESH[field] &&
    !asked.has(field)
  ));

  return target || 'none';
}

function mergeProviderEnrichment(ruleEntry, providerResult, entryInput) {
  const conversation = entryInput?.conversation;
  const enrichment = providerResult?.enrichment || {};
  const extracted = {
    ...ruleEntry.extractedFields,
    time: { ...(ruleEntry.extractedFields?.time || {}) },
    context: [...list(ruleEntry.extractedFields?.context)],
    affectedRealities: [...list(ruleEntry.extractedFields?.affectedRealities)],
    counterEvidence: [...list(ruleEntry.extractedFields?.counterEvidence)],
    dependencies: [...list(ruleEntry.extractedFields?.dependencies)],
    reportedExperience: [...list(ruleEntry.extractedFields?.reportedExperience)],
    interpretations: [...list(ruleEntry.extractedFields?.interpretations)],
    reconstructionEvidence: [...list(ruleEntry.extractedFields?.reconstructionEvidence)]
  };
  const fieldCompleteness = { ...ruleEntry.fieldCompleteness };
  let acceptedCandidateCount = 0;

  const time = groundedCandidate(enrichment.timeCandidate, conversation);
  if (time && extracted.time?.precision === 'unknown') {
    const precision = explicitDate(time.sourceText)
      ? 'exact_date'
      : ['month', 'year', 'relative'].includes(time.precision)
        ? time.precision
        : 'relative';
    extracted.time = {
      rawExpression: time.sourceText,
      normalizedTime: time.sourceText,
      precision
    };
    fieldCompleteness.timeline = raisedScore(
      fieldCompleteness.timeline,
      time.confidence,
      precision === 'exact_date' ? 0.9 : 0.7
    );
    acceptedCandidateCount += 1;
  }

  const triggers = groundedCandidates(enrichment.triggerCandidates, conversation, 3);
  if (!cleanText(extracted.trigger) && triggers.length) {
    extracted.trigger = triggers[0].sourceText;
    fieldCompleteness.trigger = raisedScore(fieldCompleteness.trigger, triggers[0].confidence);
    acceptedCandidateCount += 1;
  }

  const contexts = groundedCandidates(enrichment.contextCandidates, conversation, 5);
  const priorContextCount = extracted.context.length;
  extracted.context = addUnique(extracted.context, contexts.map(item => item.sourceText), 8);
  const addedContexts = extracted.context.length - priorContextCount;
  if (addedContexts > 0) {
    fieldCompleteness.context = raisedScore(
      fieldCompleteness.context,
      Math.max(...contexts.map(item => item.confidence)),
      0.68
    );
    acceptedCandidateCount += addedContexts;
  }

  const domains = list(enrichment.affectedRealityCandidates)
    .map(candidate => groundedCandidate(candidate, conversation))
    .filter(Boolean)
    .filter(candidate => cleanText(candidate.domain))
    .slice(0, 4);
  const existingDomains = new Set(
    extracted.affectedRealities.map(item => cleanText(item?.domain).toLowerCase())
  );
  for (const candidate of domains) {
    const domain = cleanText(candidate.domain);
    if (existingDomains.has(domain.toLowerCase())) continue;
    existingDomains.add(domain.toLowerCase());
    extracted.affectedRealities.push({
      domain,
      role: ['primary', 'connected', 'possible'].includes(candidate.role)
        ? candidate.role
        : 'possible',
      effect: `Explicitly referenced by the user: ${candidate.sourceText}`
    });
    acceptedCandidateCount += 1;
  }
  if (domains.length) {
    fieldCompleteness.affected_realities = raisedScore(
      fieldCompleteness.affected_realities,
      Math.max(...domains.map(item => item.confidence)),
      0.7
    );
  }

  const counterEvidence = groundedCandidates(enrichment.counterEvidenceCandidates, conversation, 4);
  const priorCounterCount = extracted.counterEvidence.length;
  extracted.counterEvidence = addUnique(
    extracted.counterEvidence,
    counterEvidence.map(item => item.sourceText),
    6
  );
  if (extracted.counterEvidence.length > priorCounterCount) {
    fieldCompleteness.counter_evidence = raisedScore(
      fieldCompleteness.counter_evidence,
      Math.max(...counterEvidence.map(item => item.confidence)),
      0.68
    );
    acceptedCandidateCount += extracted.counterEvidence.length - priorCounterCount;
  }

  const dependencies = list(enrichment.dependencyCandidates)
    .map(candidate => groundedCandidate(candidate, conversation))
    .filter(Boolean)
    .slice(0, 4);
  const dependencySources = new Set(
    extracted.dependencies.map(item => cleanText(item?.source).toLowerCase())
  );
  for (const candidate of dependencies) {
    const key = candidate.sourceText.toLowerCase();
    if (dependencySources.has(key)) continue;
    dependencySources.add(key);
    extracted.dependencies.push({
      source: candidate.sourceText,
      effect: 'The dependency was reported; its mechanism remains unverified.',
      status: candidate.status === 'reported' ? 'reported' : 'unclear'
    });
    acceptedCandidateCount += 1;
  }
  if (dependencies.length) {
    fieldCompleteness.dependency = raisedScore(
      fieldCompleteness.dependency,
      Math.max(...dependencies.map(item => item.confidence)),
      0.65
    );
  }

  const observedEvidence = ruleEntry.evidenceBoundary?.observedEvidence;
  const experiences = groundedCandidates(enrichment.reportedExperienceCandidates, conversation, 5)
    .filter(item => !conflictsWithObserved(item.sourceText, observedEvidence));
  const priorExperienceCount = extracted.reportedExperience.length;
  extracted.reportedExperience = addUnique(
    extracted.reportedExperience,
    experiences.map(item => item.sourceText),
    8
  );
  acceptedCandidateCount += extracted.reportedExperience.length - priorExperienceCount;

  const interpretations = groundedCandidates(enrichment.interpretationCandidates, conversation, 5)
    .filter(item => !conflictsWithObserved(item.sourceText, observedEvidence));
  const priorInterpretationCount = extracted.interpretations.length;
  extracted.interpretations = addUnique(
    extracted.interpretations,
    interpretations.map(item => item.sourceText),
    8
  );
  acceptedCandidateCount += extracted.interpretations.length - priorInterpretationCount;

  const professional = groundedCandidates(
    enrichment.professionalAssessmentCandidates,
    conversation,
    3
  ).filter(item => (
    explicitProfessionalSource(item.sourceText) &&
    !conflictsWithObserved(item.sourceText, observedEvidence)
  ));
  acceptedCandidateCount += professional.length;

  const tension = groundedCandidate(enrichment.currentTensionCandidate, conversation);
  if (!cleanText(extracted.currentTension) && tension) {
    extracted.currentTension = tension.sourceText;
    fieldCompleteness.current_tension = raisedScore(
      fieldCompleteness.current_tension,
      tension.confidence,
      0.68
    );
    acceptedCandidateCount += 1;
  }

  const desired = groundedCandidate(enrichment.desiredTransitionCandidate, conversation);
  if (!cleanText(extracted.desiredTransition) && desired) {
    extracted.desiredTransition = desired.sourceText;
    fieldCompleteness.desired_transition = raisedScore(
      fieldCompleteness.desired_transition,
      desired.confidence,
      0.65
    );
    acceptedCandidateCount += 1;
  }

  const completion = completeness(fieldCompleteness);
  const entryRound = ruleEntry.assessment.entryRound;
  const minimumRoundsMet = entryRound >= ruleEntry.assessment.minimumRounds;
  const maximumRoundsReached = entryRound >= ruleEntry.assessment.maximumRounds;
  const missingFields = FIELD_NAMES.filter(field => fieldCompleteness[field] < THRESH[field]);
  const unknownReality = missingFields.map(field => `${field.replaceAll('_', ' ')} remains unestablished.`);
  extracted.unknownReality = unknownReality;

  const askedTargets = list(ruleEntry.assessment?.askedTargets);
  const questions = providerQuestions(enrichment, missingFields)
    .filter(item => !askedTargets.includes(item.target));
  const ruleQuestions = list(ruleEntry.questionCandidates)
    .filter(item => !askedTargets.includes(cleanText(item?.target)));
  const availableQuestions = questions.length ? questions : ruleQuestions;
  const noQuestionRemaining = availableQuestions.length === 0;
  const entryComplete = noQuestionRemaining || maximumRoundsReached || (
    minimumRoundsMet && (
      completion.entryComplete
    )
  );
  const nextQuestionTarget = entryComplete
    ? 'none'
    : questions[0]?.target ||
      ruleEntry.questionCandidates?.[0]?.target ||
      nextUnaskedTarget(fieldCompleteness, askedTargets);

  return {
    acceptedCandidateCount,
    entry: {
      ...ruleEntry,
      entryMethod: `rule_first+${providerResult.provider}`,
      acknowledgement: cleanText(enrichment.acknowledgement) || ruleEntry.acknowledgement,
      fieldCompleteness,
      questionCandidates: availableQuestions,
      extractedFields: extracted,
      evidenceBoundary: {
        observedEvidence: [...list(ruleEntry.evidenceBoundary?.observedEvidence)],
        reportedExperience: extracted.reportedExperience,
        interpretation: extracted.interpretations,
        professionalAssessment: addUnique(
          ruleEntry.evidenceBoundary?.professionalAssessment,
          professional.map(item => item.sourceText),
          5
        ),
        unknownReality
      },
      assessment: {
        ...ruleEntry.assessment,
        minimumRoundsMet,
        maximumRoundsReached,
        entryCompleteness: completion.entryCompleteness,
        entryComplete,
        noQuestionRemaining,
        nextQuestionTarget,
        missingFields
      },
      routingHints: {
        ...ruleEntry.routingHints,
        modelInferenceUseful: false,
        reason: 'A bounded provider enrichment was accepted; remaining gaps return to Rule Engine questioning.'
      }
    }
  };
}

function attemptError(error) {
  return cleanText(error?.message || error).slice(0, 240) || 'Unknown provider error.';
}

function ruleInference(ruleEntry, reason, attempts = []) {
  return {
    provider: 'rule_engine',
    model: null,
    workersAIUsed: false,
    openAIUsed: false,
    externalInferenceUsed: false,
    reason,
    attempts
  };
}

export async function routeRuntimeEntry({ env = {}, entryInput = {}, options = {} }) {
  const ruleEntry = evaluateEntryRuleFirst(entryInput);
  const attempts = [];

  if (ruleEntry.assessment.entryComplete && entryInput.mode !== 'revision') {
    return {
      entry: ruleEntry,
      inference: ruleInference(
        ruleEntry,
        'The Rule Engine completed or bounded the Runtime Entry without model inference.'
      )
    };
  }

  if (!ruleEntry.routingHints.modelInferenceUseful) {
    return {
      entry: ruleEntry,
      inference: ruleInference(
        ruleEntry,
        'The Rule Engine can select the next evidence question without model inference.'
      )
    };
  }

  const workersAIConfigured = Boolean(env?.AI && typeof env.AI.run === 'function');
  const workersAIAllowed = options.workersAIAllowed !== false;
  let workersAIAttempted = false;

  if (workersAIConfigured && workersAIAllowed) {
    workersAIAttempted = true;
    try {
      const providerResult = await runWorkersAIEntry(env, entryInput, ruleEntry);
      const merged = mergeProviderEnrichment(ruleEntry, providerResult, entryInput);

      if (merged.acceptedCandidateCount < 1) {
        throw new Error('Workers AI returned no grounded Runtime Entry candidates.');
      }

      attempts.push({
        provider: 'workers_ai',
        success: true,
        acceptedCandidateCount: merged.acceptedCandidateCount
      });
      return {
        entry: merged.entry,
        inference: {
          provider: providerResult.provider,
          model: providerResult.model,
          workersAIUsed: true,
          openAIUsed: false,
          externalInferenceUsed: true,
          billing: providerResult.billing,
          usage: providerResult.usage,
          reason: 'Workers AI supplied grounded candidates after Rule Engine extraction remained insufficient.',
          attempts
        }
      };
    } catch (error) {
      attempts.push({ provider: 'workers_ai', success: false, error: attemptError(error) });
    }
  }

  const openAIAllowed = options.openAIAllowed !== false && Boolean(cleanText(env?.OPENAI_API_KEY));

  if (openAIAllowed) {
    try {
      const providerResult = await runOpenAIEntry(env, entryInput, ruleEntry, {
        workersAIAttempted,
        workersAISucceeded: false,
        workersAIUnavailable: !workersAIConfigured || !workersAIAllowed
      });
      const merged = mergeProviderEnrichment(ruleEntry, providerResult, entryInput);

      if (merged.acceptedCandidateCount < 1) {
        throw new Error('OpenAI returned no grounded Runtime Entry candidates.');
      }

      attempts.push({
        provider: 'openai',
        success: true,
        acceptedCandidateCount: merged.acceptedCandidateCount
      });
      return {
        entry: merged.entry,
        inference: {
          provider: providerResult.provider,
          model: providerResult.model,
          workersAIUsed: workersAIAttempted,
          openAIUsed: true,
          externalInferenceUsed: true,
          billing: providerResult.billing,
          usage: providerResult.usage,
          reason: 'OpenAI supplied grounded candidates only after Workers AI failed or was unavailable.',
          attempts
        }
      };
    } catch (error) {
      attempts.push({ provider: 'openai', success: false, error: attemptError(error) });
    }
  }

  return {
    entry: ruleEntry,
    inference: {
      ...ruleInference(
        ruleEntry,
        attempts.length
          ? 'External enrichment failed validation; the Rule Engine result and Unknown Reality were preserved.'
          : 'No eligible external provider is configured; the Rule Engine continues evidence acquisition.',
        attempts
      ),
      professionalReviewRecommended: ruleEntry.assessment.maximumRoundsReached === true
    }
  };
}

export default routeRuntimeEntry;
