/*
 * PHI OS Reality Reconstruction Inspector
 * File: assets/js/modules/reconstruction-inspector.js
 * Version: 1.0.0
 *
 * Responsibilities
 * ----------------
 * - Render Runtime Inspector metrics.
 * - Summarize Grammar, Evidence, Carrier and Conscious Runtime status.
 * - Calculate display-level maturity and readiness indicators.
 * - Expose diagnostics for development and later My Reality integration.
 *
 * This module does not:
 * - Call APIs.
 * - Read sessionStorage directly.
 * - Render the central Reconstruction sections.
 * - Navigate to the Reading page.
 */

import {
  qs,
  cleanText,
  escapeHTML
} from '../shared.js';
import { t } from '../i18n.js';


/* =========================================================
   CONSTANTS
========================================================= */

const STATUS_WEIGHT = Object.freeze({
  not_established: 0,
  unobserved: 0,
  inactive: 0.05,
  contradicted: 0.1,
  emerging: 0.35,
  provisional: 0.55,
  active: 0.75,
  revised: 0.8,
  stable: 1
});


const ARC_LABELS = Object.freeze({
  formation: 'Formation Arc',
  activation: 'Activation Arc',
  internalization: 'Internalization Arc',
  reorganization: 'Reorganization Arc',
  continuity: 'Continuity Arc'
});


const GRAMMAR_LABELS = Object.freeze({
  G1: 'Difference',
  G2: 'Constraint',
  G3: 'Structure',
  G4: 'Field',
  G5: 'Activation',
  G6: 'Carrier',
  G7: 'Runtime',
  G8: 'Experience',
  G9: 'Expression',
  G10: 'Agency',
  G11: 'Identity',
  G12: 'Feedback',
  G13: 'Settlement',
  G14: 'Reconfiguration',
  G15: 'Emergence',
  G16: 'Continuity'
});


/* =========================================================
   BASIC HELPERS
========================================================= */

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}


function arrayValue(value) {
  return Array.isArray(value)
    ? value
    : [];
}


function numberValue(value, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}


function clampScore(value) {
  return Math.max(
    0,
    Math.min(
      1,
      numberValue(value)
    )
  );
}


function percent(value) {
  return `${Math.round(clampScore(value) * 100)}%`;
}


function humanize(value = '') {
  return cleanText(String(value))
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      letter => letter.toUpperCase()
    );
}


function safeText(selector, value, fallback = t('reconstruction.notEstablished')) {
  const element = qs(selector);

  if (!element) {
    return;
  }

  const resolved =
    cleanText(value) ||
    fallback;

  element.textContent =
    resolved;
}


function normalizeListItem(item) {
  if (typeof item === 'string') {
    return cleanText(item);
  }

  if (!isPlainObject(item)) {
    return '';
  }

  return cleanText(
    item.statement ||
    item.question ||
    item.summary ||
    item.evidenceNeed ||
    item.label ||
    item.name ||
    item.effect ||
    ''
  );
}


function uniqueCount(value) {
  const values =
    arrayValue(value)
      .map(normalizeListItem)
      .filter(Boolean)
      .map(item =>
        item.toLowerCase()
      );

  return new Set(values).size;
}


/* =========================================================
   GRAMMAR NORMALIZATION
========================================================= */

function normalizeGrammarStates(reconstruction) {
  const direct =
    arrayValue(
      reconstruction?.grammarStates
    );

  if (direct.length > 0) {
    return direct
      .filter(isPlainObject)
      .map(item => ({
        code:
          cleanText(item.code)
            .toUpperCase(),

        label:
          cleanText(item.label) ||
          GRAMMAR_LABELS[
            cleanText(item.code)
              .toUpperCase()
          ] ||
          '',

        arc:
          cleanText(item.arc),

        status:
          cleanText(item.status) ||
          'not_established',

        confidence:
          clampScore(item.confidence),

        summary:
          cleanText(item.summary)
      }))
      .filter(item => item.code);
  }

  const legacy =
    arrayValue(
      reconstruction
        ?.formation
        ?.activeGrammars
    );

  return legacy
    .filter(isPlainObject)
    .map(item => ({
      code:
        cleanText(item.code)
          .toUpperCase(),

      label:
        cleanText(item.label) ||
        GRAMMAR_LABELS[
          cleanText(item.code)
            .toUpperCase()
        ] ||
        '',

      arc:
        cleanText(item.arc),

      status:
        item.confidence >= 0.75
          ? 'active'
          : 'provisional',

      confidence:
        clampScore(item.confidence),

      summary:
        cleanText(
          item.reason ||
          item.summary
        )
    }))
    .filter(item => item.code);
}


function resolvePrimaryArc(reconstruction) {
  return (
    cleanText(
      reconstruction?.primaryArc
    ) ||
    cleanText(
      reconstruction
        ?.formation
        ?.primaryArc
    ) ||
    'formation'
  );
}


function resolveStrongestGrammar(reconstruction) {
  const states =
    normalizeGrammarStates(
      reconstruction
    );

  return [...states]
    .sort(
      (a, b) =>
        b.confidence -
        a.confidence
    )[0] || null;
}


/* =========================================================
   CARRIER / CONSCIOUS STATUS
========================================================= */

function statusScore(status) {
  const normalized =
    cleanText(status)
      .toLowerCase();

  return STATUS_WEIGHT[normalized] || 0;
}


function summarizeObjectStates(items) {
  const normalized =
    arrayValue(items)
      .filter(isPlainObject);

  const established =
    normalized.filter(item => {
      return (
        statusScore(item.status) >=
        STATUS_WEIGHT.provisional
      );
    }).length;

  const emerging =
    normalized.filter(item => {
      return (
        statusScore(item.status) >
          STATUS_WEIGHT.not_established &&
        statusScore(item.status) <
          STATUS_WEIGHT.provisional
      );
    }).length;

  const notEstablished =
    Math.max(
      0,
      normalized.length -
      established -
      emerging
    );

  const averageScore =
    normalized.length > 0
      ? normalized.reduce(
          (sum, item) =>
            sum +
            statusScore(item.status),
          0
        ) /
        normalized.length
      : 0;

  return {
    total:
      normalized.length,

    established,

    emerging,

    notEstablished,

    averageScore:
      Number(
        averageScore.toFixed(2)
      )
  };
}


function summarizeCarrier(reconstruction) {
  const coordinates =
    arrayValue(
      reconstruction
        ?.carrier
        ?.initializationCoordinates
    );

  const signatures =
    arrayValue(
      reconstruction
        ?.carrier
        ?.carrierSignatures
    );

  return {
    coordinates:
      summarizeObjectStates(
        coordinates
      ),

    signatures:
      summarizeObjectStates(
        signatures
      )
  };
}


function summarizeConscious(reconstruction) {
  const stages =
    arrayValue(
      reconstruction
        ?.conscious
        ?.stages
    );

  return summarizeObjectStates(
    stages
  );
}


/* =========================================================
   EVIDENCE SUMMARY
========================================================= */

function summarizeEvidence(
  reconstruction,
  runtimeEntry
) {
  const boundary =
    reconstruction?.evidenceBoundary ||
    {};

  const legacy =
    reconstruction?.evidence ||
    {};

  const knownReality =
    arrayValue(
      boundary.observedEvidence
    ).length > 0
      ? boundary.observedEvidence
      : arrayValue(
          legacy.knownReality
        ).length > 0
        ? legacy.knownReality
        : arrayValue(
            runtimeEntry?.knownReality
          );

  const reportedExperience =
    arrayValue(
      boundary.reportedExperience
    ).length > 0
      ? boundary.reportedExperience
      : arrayValue(
          legacy.reportedExperience
        );

  const interpretation =
    arrayValue(
      boundary.interpretation
    ).length > 0
      ? boundary.interpretation
      : arrayValue(
          legacy.interpretiveMaterial
        ).length > 0
        ? legacy.interpretiveMaterial
        : runtimeEntry?.userInterpretation
          ? [runtimeEntry.userInterpretation]
          : [];

  const unknownReality =
    arrayValue(
      boundary.unknownReality
    ).length > 0
      ? boundary.unknownReality
      : arrayValue(
          legacy.unknownReality
        ).length > 0
        ? legacy.unknownReality
        : arrayValue(
            runtimeEntry?.unknownReality
          );

  const entryEvidence =
    arrayValue(
      runtimeEntry?.entryEvidence
    );

  return {
    knownCount:
      uniqueCount(knownReality),

    reportedCount:
      uniqueCount(
        reportedExperience
      ),

    interpretationCount:
      uniqueCount(
        interpretation
      ),

    unknownCount:
      uniqueCount(
        unknownReality
      ),

    evidenceItemCount:
      entryEvidence.length
  };
}


/* =========================================================
   MATURITY CALCULATION
========================================================= */

function grammarMaturity(reconstruction) {
  const states =
    normalizeGrammarStates(
      reconstruction
    );

  if (states.length === 0) {
    return 0;
  }

  const average =
    states.reduce(
      (sum, item) =>
        sum +
        Math.max(
          statusScore(item.status),
          item.confidence * 0.8
        ),
      0
    ) /
    15;

  return clampScore(average);
}


function evidenceMaturity(summary) {
  const positive =
    summary.knownCount * 1.5 +
    summary.reportedCount * 0.7 +
    summary.evidenceItemCount * 0.9;

  const uncertaintyPenalty =
    summary.unknownCount * 0.35;

  return clampScore(
    (
      positive -
      uncertaintyPenalty
    ) /
    10
  );
}


function carrierMaturity(summary) {
  const coordinateScore =
    summary
      .coordinates
      .averageScore;

  const signatureScore =
    summary
      .signatures
      .averageScore;

  return clampScore(
    coordinateScore * 0.45 +
    signatureScore * 0.55
  );
}


function consciousMaturity(summary) {
  return clampScore(
    summary.averageScore
  );
}


export function calculateInspectorMaturity(
  result
) {
  const reconstruction =
    result?.reconstruction ||
    {};

  const runtimeEntry =
    result?.runtimeEntry ||
    {};

  const backendScore =
    clampScore(
      reconstruction.maturityScore
    );

  const grammarScore =
    grammarMaturity(
      reconstruction
    );

  const evidenceSummary =
    summarizeEvidence(
      reconstruction,
      runtimeEntry
    );

  const evidenceScore =
    evidenceMaturity(
      evidenceSummary
    );

  const carrierSummary =
    summarizeCarrier(
      reconstruction
    );

  const carrierScore =
    carrierMaturity(
      carrierSummary
    );

  const consciousSummary =
    summarizeConscious(
      reconstruction
    );

  const consciousScore =
    consciousMaturity(
      consciousSummary
    );

  const computed =
    clampScore(
      backendScore * 0.4 +
      grammarScore * 0.25 +
      evidenceScore * 0.2 +
      carrierScore * 0.075 +
      consciousScore * 0.075
    );

  return {
    overall:
      Number(
        computed.toFixed(2)
      ),

    backend:
      Number(
        backendScore.toFixed(2)
      ),

    grammar:
      Number(
        grammarScore.toFixed(2)
      ),

    evidence:
      Number(
        evidenceScore.toFixed(2)
      ),

    carrier:
      Number(
        carrierScore.toFixed(2)
      ),

    conscious:
      Number(
        consciousScore.toFixed(2)
      )
  };
}


/* =========================================================
   READING READINESS
========================================================= */

export function calculateReadingReadiness(
  result
) {
  const reconstruction =
    result?.reconstruction ||
    {};

  const runtimeEntry =
    result?.runtimeEntry ||
    {};

  const maturity =
    calculateInspectorMaturity(
      result
    );

  const evidence =
    summarizeEvidence(
      reconstruction,
      runtimeEntry
    );

  const grammarStates =
    normalizeGrammarStates(
      reconstruction
    );

  const activeGrammarCount =
    grammarStates.filter(
      item =>
        item.confidence >= 0.45
    ).length;

  const hasDifference =
    grammarStates.some(
      item =>
        item.code === 'G1'
    );

  const hasActivation =
    grammarStates.some(
      item =>
        item.code === 'G5'
    );

  const hasExperience =
    grammarStates.some(
      item =>
        item.code === 'G8'
    );

  const hasEvidence =
    evidence.knownCount > 0 ||
    evidence.evidenceItemCount > 0;

  const backendReady =
    reconstruction
      ?.nextStage
      ?.ready === true ||
    reconstruction
      ?.readingBoundary
      ?.readyForInitialReading === true;

  const ruleReady =
    (
      maturity.overall >= 0.4 &&
      activeGrammarCount >= 4 &&
      hasDifference &&
      (
        hasActivation ||
        hasExperience
      )
    );

  const ready =
    backendReady ||
    ruleReady;

  const reasons = [];

  if (!hasDifference) {
    reasons.push(
      'G1 Difference has not been established.'
    );
  }

  if (
    !hasActivation &&
    !hasExperience
  ) {
    reasons.push(
      'Activation or Experience has not been established.'
    );
  }

  if (activeGrammarCount < 4) {
    reasons.push(
      'Fewer than four Runtime Grammars are currently active.'
    );
  }

  if (!hasEvidence) {
    reasons.push(
      'No supporting Runtime evidence has been recorded.'
    );
  }

  if (
    maturity.overall < 0.4
  ) {
    reasons.push(
      'Reconstruction maturity remains below the initial Reading threshold.'
    );
  }

  return {
    ready,

    score:
      maturity.overall,

    activeGrammarCount,

    evidenceAvailable:
      hasEvidence,

    unknownCount:
      evidence.unknownCount,

    reasons,

    status:
      ready
        ? (
            evidence.unknownCount > 0
              ? 'ready_with_unknowns'
              : 'ready'
          )
        : 'not_ready'
  };
}


/* =========================================================
   INSPECTOR CARD ENHANCEMENT
========================================================= */

function findOrCreateInspectorDetails() {
  let container =
    qs('#runtimeInspectorDetails');

  if (container) {
    return container;
  }

  const inspector =
    qs('.reconstruction-inspector');

  if (!inspector) {
    return null;
  }

  container =
    document.createElement('div');

  container.id =
    'runtimeInspectorDetails';

  container.className =
    'runtime-inspector-details';

  inspector.appendChild(
    container
  );

  return container;
}


function renderInspectorDetails(
  result
) {
  const container =
    findOrCreateInspectorDetails();

  if (!container) {
    return;
  }

  const reconstruction =
    result?.reconstruction ||
    {};

  const runtimeEntry =
    result?.runtimeEntry ||
    {};

  const maturity =
    calculateInspectorMaturity(
      result
    );

  const readiness =
    calculateReadingReadiness(
      result
    );

  const evidence =
    summarizeEvidence(
      reconstruction,
      runtimeEntry
    );

  const carrier =
    summarizeCarrier(
      reconstruction
    );

  const conscious =
    summarizeConscious(
      reconstruction
    );

  container.innerHTML = `
    <section class="inspector-extended-block">
      <span>${escapeHTML(t('reconstruction.readingReadiness'))}</span>

      <strong>
        ${escapeHTML(
          t(`reconstruction.readinessStatus.${readiness.status}`)
        )}
      </strong>

      <small>
        ${escapeHTML(
          readiness.ready
            ? t('reconstruction.readyDetail')
            : readiness.reasons[0] ||
              t('reconstruction.moreRequired')
        )}
      </small>
    </section>

    <section class="inspector-extended-block">
      <span>${escapeHTML(t('reconstruction.grammarActivation'))}</span>

      <strong>
        ${escapeHTML(
          String(
            readiness.activeGrammarCount
          )
        )} / 15
      </strong>

      <small>
        ${escapeHTML(t('reconstruction.grammarActivationDetail'))}
      </small>
    </section>

    <section class="inspector-extended-block">
      <span>${escapeHTML(t('reconstruction.evidenceBoundary'))}</span>

      <strong>
        ${escapeHTML(
          t('reconstruction.evidenceCounts', { known: evidence.knownCount, reported: evidence.reportedCount })
        )}
      </strong>

      <small>
        ${escapeHTML(
          t('reconstruction.interpretationCounts', { interpreted: evidence.interpretationCount, unknown: evidence.unknownCount })
        )}
      </small>
    </section>

    <section class="inspector-extended-block">
      <span>${escapeHTML(t('reconstruction.carrierState'))}</span>

      <strong>
        ${escapeHTML(
          t('reconstruction.visibleCount', { visible: carrier.signatures.emerging + carrier.signatures.established, total: carrier.signatures.total || 6 })
        )}
      </strong>

      <small>
        ${escapeHTML(t('reconstruction.carrierStateDetail'))}
      </small>
    </section>

    <section class="inspector-extended-block">
      <span>${escapeHTML(t('reconstruction.conscious'))}</span>

      <strong>
        ${escapeHTML(
          t('reconstruction.visibleCount', { visible: conscious.emerging + conscious.established, total: conscious.total || 5 })
        )}
      </strong>

      <small>
        ${escapeHTML(t('reconstruction.consciousDetail'))}
      </small>
    </section>

    <section class="inspector-extended-block">
      <span>${escapeHTML(t('reconstruction.inferenceCost'))}</span>

      <strong>
        ${escapeHTML(t('reconstruction.noPaidAi'))}
      </strong>

      <small>
        ${escapeHTML(t('reconstruction.ruleFirstDetail'))}
      </small>
    </section>
  `;
}


/* =========================================================
   CORE INSPECTOR RENDERING
========================================================= */

export function renderReconstructionInspector(
  result
) {
  if (
    !result ||
    typeof result !== 'object'
  ) {
    throw new Error(
      'Cannot render the Runtime Inspector without a Reconstruction result.'
    );
  }

  const reconstruction =
    result.reconstruction ||
    {};

  const runtimeEntry =
    result.runtimeEntry ||
    {};

  const maturity =
    calculateInspectorMaturity(
      result
    );

  const readiness =
    calculateReadingReadiness(
      result
    );

  const primaryArc =
    resolvePrimaryArc(
      reconstruction
    );

  const strongest =
    resolveStrongestGrammar(
      reconstruction
    );

  const evidence =
    summarizeEvidence(
      reconstruction,
      runtimeEntry
    );

  safeText(
    '#runtimeEntityId',
    result.runtimeEntityId ||
    runtimeEntry.runtimeEntityId,
    '—'
  );

  safeText(
    '#runtimeEntryId',
    result.runtimeEntryId ||
    runtimeEntry.runtimeEntryId,
    '—'
  );

  safeText(
    '#reconstructionMethod',
    reconstruction.reconstructionMethod === 'rule_first'
      ? t('reconstruction.ruleFirst')
      : reconstruction
      .reconstructionMethod ||
    reconstruction
      .methodLabel ||
    reconstruction
      .method ||
    t('reconstruction.ruleFirst'),
    t('reconstruction.ruleFirst')
  );

  safeText(
    '#primaryArc',
    t(`reconstruction.arcs.${primaryArc}`) ||
    ARC_LABELS[primaryArc] ||
    humanize(primaryArc),
    t('reconstruction.notEstablished')
  );

  safeText(
    '#strongestSignal',
    strongest
      ? `${strongest.code} ${t(`reconstruction.grammars.${strongest.code}`)}`
      : '',
    t('reconstruction.notEstablished')
  );

  safeText(
    '#unknownCount',
    String(
      evidence.unknownCount
    ),
    '0'
  );

  safeText(
    '#reconstructionScore',
    percent(
      maturity.overall
    ),
    '0%'
  );

  const continueButton =
    qs('#continueToReading');

  if (continueButton) {
    continueButton.disabled =
      readiness.ready !== true;

    continueButton.setAttribute(
      'aria-disabled',
      readiness.ready
        ? 'false'
        : 'true'
    );

    continueButton.title =
      readiness.ready
        ? t('reconstruction.continueReadingTitle')
        : readiness.reasons.join(' ');
  }

  renderInspectorDetails(
    result
  );

  document.dispatchEvent(
    new CustomEvent(
      'phiOS:reconstructionInspectorRendered',
      {
        detail: {
          runtimeEntityId:
            result.runtimeEntityId ||
            runtimeEntry.runtimeEntityId ||
            '',

          runtimeEntryId:
            result.runtimeEntryId ||
            runtimeEntry.runtimeEntryId ||
            '',

          maturity,

          readiness
        }
      }
    )
  );

  return {
    rendered: true,
    maturity,
    readiness,
    primaryArc,
    strongestGrammar:
      strongest
  };
}


/* =========================================================
   DIAGNOSTICS
========================================================= */

export function createReconstructionDiagnostics(
  result
) {
  const reconstruction =
    result?.reconstruction ||
    {};

  const runtimeEntry =
    result?.runtimeEntry ||
    {};

  const grammarStates =
    normalizeGrammarStates(
      reconstruction
    );

  const maturity =
    calculateInspectorMaturity(
      result
    );

  const readiness =
    calculateReadingReadiness(
      result
    );

  const evidence =
    summarizeEvidence(
      reconstruction,
      runtimeEntry
    );

  const carrier =
    summarizeCarrier(
      reconstruction
    );

  const conscious =
    summarizeConscious(
      reconstruction
    );

  return {
    module:
      'PHI OS Reality Reconstruction Inspector',

    version:
      '1.0.0',

    runtimeEntityId:
      cleanText(
        result?.runtimeEntityId ||
        runtimeEntry.runtimeEntityId
      ),

    runtimeEntryId:
      cleanText(
        result?.runtimeEntryId ||
        runtimeEntry.runtimeEntryId
      ),

    primaryArc:
      resolvePrimaryArc(
        reconstruction
      ),

    strongestGrammar:
      resolveStrongestGrammar(
        reconstruction
      ),

    grammarStateCount:
      grammarStates.length,

    maturity,

    readiness,

    evidence,

    carrier,

    conscious,

    inference: {
      provider:
        result
          ?.inference
          ?.provider ||
        reconstruction
          ?.reconstructionMethod ||
        'rule_engine',

      openAIUsed:
        result
          ?.inference
          ?.openAIUsed === true,

      workersAIUsed:
        result
          ?.inference
          ?.workersAIUsed === true,

      paidInferenceUsed:
        result
          ?.inference
          ?.paidInferenceUsed === true
    },

    persistence: {
      requested:
        result
          ?.persistence
          ?.requested === true,

      performed:
        result
          ?.persistence
          ?.performed === true,

      reason:
        cleanText(
          result
            ?.persistence
            ?.reason
        )
    }
  };
}


/* =========================================================
   STATUS
========================================================= */

export function getReconstructionInspectorStatus() {
  return {
    module:
      'PHI OS Reality Reconstruction Inspector',

    version:
      '1.0.0',

    capabilities: [
      'runtime_identity',
      'reconstruction_maturity',
      'grammar_summary',
      'evidence_summary',
      'carrier_summary',
      'conscious_runtime_summary',
      'reading_readiness',
      'cost_visibility',
      'diagnostics'
    ],

    openAIRequired:
      false,

    workersAIRequired:
      false
  };
}
