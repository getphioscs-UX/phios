import { createFinancialProfessionalDomain } from './professional-domains-financial.js';
/**
 * Step 2.5.3B — bounded Navigation path generation.
 *
 * Reads only the Reading → Navigation handoff contract. It may expose
 * bounded options and a display priority, but it never selects a path,
 * issues deterministic commands, or uses Unknown Reality as inference data.
 */

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueText(values, maximum = Infinity) {
  const output = [];
  const seen = new Set();

  for (const value of list(values)) {
    const text = cleanText(value?.statement || value?.summary || value);
    const key = text.toLocaleLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
    if (output.length >= maximum) break;
  }

  return output;
}

function normalizeLanguage(value) {
  const language = cleanText(value).toLowerCase();
  return language === 'zh' || language.startsWith('zh-') ? 'zh' : 'en';
}

const COPY = Object.freeze({
  en: Object.freeze({
    observe: {
      title: 'Observe what changes the reading',
      summary: 'Track a small set of observable signals before changing the current interpretation.',
      boundary: 'Observation records change; it does not prove cause or predict an outcome.'
    },
    clarify: {
      title: 'Clarify the remaining boundary',
      summary: 'Resolve the most important missing distinction before moving into a stronger intervention.',
      boundary: 'Clarification keeps unresolved Reality open instead of filling it with assumptions.'
    },
    verify: {
      title: 'Verify the current reading',
      summary: 'Look for evidence that distinguishes the current reading from another plausible explanation.',
      boundary: 'Verification may weaken or revise the reading; it does not protect the current conclusion.'
    },
    experiment: {
      title: 'Try a small reversible change',
      summary: 'Use a limited, reversible test to learn whether the current direction produces an observable difference.',
      boundary: 'The test must remain low-impact, reversible, and reviewable; one result is not a universal conclusion.'
    },
    reposition: {
      title: 'Adjust the current position',
      summary: 'Review how attention, resources, boundaries, or decision weight are currently allocated.',
      boundary: 'Repositioning changes the operating position; it does not determine what another person must do.'
    },
    professional: {
      title: 'Bring in qualified professional review',
      summary: 'Use qualified review where the decision crosses a professional or high-impact boundary.',
      boundary: 'PHI OS does not replace financial, legal, medical, safety, or other regulated professional judgment.'
    }
  }),
  zh: Object.freeze({
    observe: {
      title: '观察哪些变化会改变当前读取',
      summary: '在改变当前理解之前，先持续记录一小组可以观察的信号。',
      boundary: '观察只能记录变化，不能单独证明因果，也不能预测结果。'
    },
    clarify: {
      title: '厘清仍未建立的边界',
      summary: '在进入较强的行动之前，先厘清最关键、仍未分辨清楚的部分。',
      boundary: '厘清会保留尚未确认的现实，不用假设把空白填满。'
    },
    verify: {
      title: '验证当前读取是否成立',
      summary: '寻找能够区分当前读取与另一种可能解释的证据。',
      boundary: '验证可能削弱或修正当前读取，而不是保护既有结论。'
    },
    experiment: {
      title: '尝试一个小型可逆改变',
      summary: '通过范围有限、可以撤回的测试，观察当前方向是否带来可见差异。',
      boundary: '测试必须低影响、可逆并可复查；一次结果不能成为普遍结论。'
    },
    reposition: {
      title: '调整目前所处的位置',
      summary: '重新查看注意力、资源、边界或决策权重目前如何分配。',
      boundary: '调整位置只改变自己的运行位置，不决定他人必须怎样行动。'
    },
    professional: {
      title: '引入合资格的专业复核',
      summary: '当决定跨越专业或高影响边界时，引入相应领域的合资格复核。',
      boundary: 'PHI OS 不取代财务、法律、医疗、安全或其他受监管专业判断。'
    }
  })
});

function path(id, type, copy, evidenceBasis = [], extra = {}) {
  return {
    id,
    pathType: type,
    title: copy.title,
    summary: copy.summary,
    boundary: copy.boundary,
    evidenceBasis: uniqueText(evidenceBasis, 6),
    status: 'available',
    userChoiceRequired: true,
    automaticSelection: false,
    deterministicCommand: false,
    ...extra
  };
}

function scoreCandidate(candidates, candidate, score, reason) {
  const existing = candidates.find(item => item.path.id === candidate.id);
  if (existing) {
    existing.score += score;
    if (reason && !existing.reasons.includes(reason)) existing.reasons.push(reason);
    return;
  }
  candidates.push({ path: candidate, score, reasons: reason ? [reason] : [] });
}

export function generateNavigationPaths(handoff = {}, options = {}) {
  const input = isObject(handoff) ? handoff : {};
  const language = normalizeLanguage(options.outputLanguage || options.locale);
  const copy = COPY[language];

  if (input.navigationReady !== true || list(input.blockers).length > 0) {
    return {
      availablePaths: [],
      recommendedPriority: [],
      pathGeneration: {
        generated: false,
        reason: 'navigation_not_ready',
        userChoiceRequired: true,
        automaticSelection: false,
        unknownRealityUsedForInference: false
      }
    };
  }

  const candidates = [];
  const watch = uniqueText(input.evidenceWatch, 8);
  const constraints = uniqueText(input.constraints, 8);
  const transition = cleanText(input.currentTransition);
  const direction = cleanText(input.desiredDirection);
  const currentReality = isObject(input.currentReality) ? input.currentReality : {};
  const patternEstablished = currentReality.primaryPattern?.established === true;
  const confidence = Number(currentReality.confidence) || 0;
  const unknownCount = list(input.unknownReality).length;
  const professional = isObject(input.professionalBoundary)
    ? input.professionalBoundary
    : {};

  const commonEvidence = uniqueText([
    transition,
    direction,
    ...watch
  ], 6);

  if (watch.length > 0 || confidence < 0.7) {
    scoreCandidate(
      candidates,
      path('observe-reading-signals', 'observe', copy.observe, watch),
      70 + Math.min(watch.length * 4, 16),
      'evidence_watch_available'
    );
  }

  if (unknownCount > 0) {
    scoreCandidate(
      candidates,
      path('clarify-reading-boundary', 'clarify', copy.clarify, commonEvidence),
      65 + Math.min(unknownCount * 3, 15),
      'unknown_boundary_present'
    );
  }

  if (patternEstablished && confidence < 0.8) {
    scoreCandidate(
      candidates,
      path('verify-current-reading', 'verify', copy.verify, commonEvidence),
      58 + Math.round((0.8 - confidence) * 30),
      'reading_requires_distinguishing_evidence'
    );
  }

  if (constraints.length > 0) {
    scoreCandidate(
      candidates,
      path('reposition-current-constraints', 'reposition', copy.reposition, constraints),
      52 + Math.min(constraints.length * 4, 16),
      'active_constraints_present'
    );
  }

  if (
    patternEstablished &&
    confidence >= 0.65 &&
    direction &&
    professional.escalationNeeded !== true
  ) {
    scoreCandidate(
      candidates,
      path('small-reversible-experiment', 'reconfigure', copy.experiment, commonEvidence, {
        reversibilityRequired: true,
        lowImpactRequired: true,
        reviewRequired: true
      }),
      48 + Math.round(confidence * 10),
      'bounded_reversible_test_available'
    );
  }

  if (professional.escalationNeeded === true) {
    scoreCandidate(
      candidates,
      path('professional-review', 'professional_review', copy.professional, professional.reasons, {
        professionalDomains: uniqueText(professional.domains, 6),
        requiresProfessionalReview: true,
        professionalBoundary: createFinancialProfessionalDomain({
          language,
          reasons: professional.reasons
        })
      }),
      100,
      'professional_boundary_present'
    );
  }

  if (candidates.length === 0) {
    scoreCandidate(
      candidates,
      path('observe-reading-signals', 'observe', copy.observe, commonEvidence),
      50,
      'bounded_default_observation'
    );
    scoreCandidate(
      candidates,
      path('verify-current-reading', 'verify', copy.verify, commonEvidence),
      45,
      'bounded_default_verification'
    );
  }

  if (candidates.length === 1 && professional.escalationNeeded !== true) {
    const fallback = candidates[0].path.pathType === 'observe'
      ? path('verify-current-reading', 'verify', copy.verify, commonEvidence)
      : path('observe-reading-signals', 'observe', copy.observe, watch);
    scoreCandidate(candidates, fallback, 40, 'minimum_choice_set');
  }

  candidates.sort((left, right) => right.score - left.score || left.path.id.localeCompare(right.path.id));

  const selected = candidates.slice(0, 4);
  const availablePaths = selected.map(item => item.path);
  const recommendedPriority = selected.map(item => item.path.id);

  return {
    availablePaths,
    recommendedPriority,
    pathGeneration: {
      generated: true,
      method: 'bounded_rule_engine',
      pathCount: availablePaths.length,
      audit: selected.map(item => ({
        pathId: item.path.id,
        score: item.score,
        reasons: item.reasons
      })),
      userChoiceRequired: true,
      automaticSelection: false,
      unknownRealityUsedForInference: false,
      aiUsed: false
    }
  };
}

export default generateNavigationPaths;
