/*
 * PHI OS Reality Reconstruction Renderer
 * File: assets/js/modules/reconstruction-render.js
 * Version: 1.0.0
 *
 * Responsibilities
 * ----------------
 * - Render Runtime Entry summary.
 * - Render Figure 0A Formation Arcs and G1–G15 states.
 * - Render Figure 4A Initialization Coordinates and Carrier Signatures.
 * - Render Figure 5E Conscious Runtime stages C1–C5.
 * - Render Evidence Boundary.
 * - Render Reconstruction Direction.
 * - Render Runtime Inspector values.
 *
 * This module does not:
 * - Read sessionStorage.
 * - Call APIs.
 * - Perform reconstruction logic.
 * - Navigate to the next page.
 */

import {
  qs,
  escapeHTML,
  cleanText
} from '../shared.js';

import { t } from '../i18n.js';


/* =========================================================
   CONSTANTS
========================================================= */

const ARC_ORDER = Object.freeze([
  {
    id: 'formation',
    label: 'Formation Arc',
    chineseLabel: '现实形成弧',
    grammars: ['G1', 'G2', 'G3', 'G4']
  },
  {
    id: 'activation',
    label: 'Activation Arc',
    chineseLabel: '现实激活弧',
    grammars: ['G5', 'G6', 'G7']
  },
  {
    id: 'internalization',
    label: 'Internalization Arc',
    chineseLabel: '现实内化弧',
    grammars: ['G8', 'G9', 'G10', 'G11']
  },
  {
    id: 'reorganization',
    label: 'Reorganization Arc',
    chineseLabel: '现实重组弧',
    grammars: ['G12', 'G13', 'G14']
  },
  {
    id: 'continuity',
    label: 'Continuity Arc',
    chineseLabel: '现实持续弧',
    grammars: ['G15']
  }
]);


const GRAMMAR_NAMES = Object.freeze({
  G1: 'Difference',
  G2: 'Constraint',
  G3: 'Structure',
  G4: 'Field',
  G5: 'Activation',
  G6: 'Carrier',
  G7: 'Runtime',
  G8: 'Experience',
  G9: 'Compression',
  G10: 'Action',
  G11: 'Feedback',
  G12: 'Settlement',
  G13: 'Reconfiguration',
  G14: 'Emergence',
  G15: 'Continuity'
});


const COORDINATE_LABELS = Object.freeze([
  'DNA',
  'Nervous System',
  'Circadian Rhythm',
  'Hormone System',
  'Body Structure',
  'Perception System'
]);


const SIGNATURE_LABELS = Object.freeze([
  'Structural Signature',
  'Navigational Signature',
  'Relational Signature',
  'Resource Signature',
  'Directional Signature',
  'Temporal Signature'
]);


const CONSCIOUS_STAGE_LABELS = Object.freeze({
  C1: 'Carrier Runtime Style',
  C2: 'Experience Style',
  C3: 'Expression Style',
  C4: 'Agency Style',
  C5: 'Identity Style'
});


/* =========================================================
   GENERAL HELPERS
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

function localizedStatus(value) {
  const normalized = cleanText(value).toLowerCase();
  const keys = {
    active: 'active',
    provisional: 'provisional',
    not_established: 'notEstablished',
    unobserved: 'unobserved',
    unclear: 'unclear'
  };
  const key = keys[normalized];
  return key
    ? t(`reconstruction.status.${key}`)
    : humanize(value);
}

function localizedArc(arc) {
  return t(`reconstruction.arcs.${arc.id}`, {}, arc.label);
}

function localizedGrammar(code, fallback = '') {
  return t(`reconstruction.grammars.${code}`, {}, fallback || GRAMMAR_NAMES[code] || code);
}

function localizedCoordinate(label) {
  const keys = {
    DNA: 'dna',
    'Nervous System': 'nervousSystem',
    'Circadian Rhythm': 'circadianRhythm',
    'Hormone System': 'hormoneSystem',
    'Body Structure': 'bodyStructure',
    'Perception System': 'perceptionSystem'
  };
  const key = keys[cleanText(label)];
  return key ? t(`reconstruction.coordinates.${key}`) : cleanText(label);
}

function localizedSignature(label) {
  const keys = {
    'Structural Signature': 'structural',
    'Navigational Signature': 'navigational',
    'Relational Signature': 'relational',
    'Resource Signature': 'resource',
    'Directional Signature': 'directional',
    'Temporal Signature': 'temporal'
  };
  const key = keys[cleanText(label)];
  return key ? t(`reconstruction.signatures.${key}`) : cleanText(label);
}

function localizedConsciousStage(code, fallback = '') {
  return t(`reconstruction.consciousStages.${code}`, {}, fallback || CONSCIOUS_STAGE_LABELS[code] || code);
}


function getText(value, fallback = t('reconstruction.notEstablished')) {
  const cleaned = cleanText(value);

  return cleaned || fallback;
}


function safeSetText(selector, value, fallback = t('reconstruction.notEstablished')) {
  const element = qs(selector);

  if (!element) {
    return;
  }

  element.textContent =
    getText(value, fallback);
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
    item.focus ||
    item.label ||
    item.name ||
    item.effect ||
    item.source ||
    ''
  );
}


function uniqueTextList(value) {
  const seen = new Set();

  return arrayValue(value)
    .map(normalizeListItem)
    .filter(item => {
      if (!item) {
        return false;
      }

      const key = item.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}


function renderListHTML(
  value,
  fallback = t('reconstruction.notEstablished')
) {
  const items =
    uniqueTextList(value);

  if (items.length === 0) {
    return `
      <li>
        ${escapeHTML(fallback)}
      </li>
    `;
  }

  return items
    .map(item => `
      <li>
        ${escapeHTML(item)}
      </li>
    `)
    .join('');
}


/* =========================================================
   NORMALIZATION
========================================================= */

function normalizeGrammarStates(reconstruction) {
  const directStates =
    arrayValue(
      reconstruction?.grammarStates
    );

  if (directStates.length > 0) {
    return directStates
      .filter(isPlainObject)
      .map(item => ({
        code:
          cleanText(item.code)
            .toUpperCase(),

        label:
          cleanText(item.label) ||
          GRAMMAR_NAMES[
            cleanText(item.code)
              .toUpperCase()
          ] ||
          '',

        status:
          cleanText(item.status) ||
          'not_established',

        confidence:
          clampScore(item.confidence),

        summary:
          cleanText(item.summary),

        arc:
          cleanText(item.arc)
      }))
      .filter(item => item.code);
  }

  const legacyStates =
    arrayValue(
      reconstruction
        ?.formation
        ?.activeGrammars
    );

  return legacyStates
    .filter(isPlainObject)
    .map(item => ({
      code:
        cleanText(item.code)
          .toUpperCase(),

      label:
        cleanText(item.label) ||
        GRAMMAR_NAMES[
          cleanText(item.code)
            .toUpperCase()
        ] ||
        '',

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
        ),

      arc:
        cleanText(item.arc)
    }))
    .filter(item => item.code);
}


function normalizePrimaryArc(reconstruction) {
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


function normalizeCoordinates(reconstruction) {
  const direct =
    arrayValue(
      reconstruction
        ?.carrier
        ?.initializationCoordinates
    );

  if (direct.length > 0) {
    return direct;
  }

  return COORDINATE_LABELS.map(label => ({
    label,
    status: 'not_established',
    summary:
      t('reconstruction.noSupportingEvidence')
  }));
}


function normalizeSignatures(reconstruction) {
  const direct =
    arrayValue(
      reconstruction
        ?.carrier
        ?.carrierSignatures
    );

  if (direct.length > 0) {
    return direct;
  }

  return SIGNATURE_LABELS.map(label => ({
    label,
    status: 'unobserved',
    summary:
      t('reconstruction.insufficientEvidence')
  }));
}


function normalizeConsciousStages(reconstruction) {
  const direct =
    arrayValue(
      reconstruction
        ?.conscious
        ?.stages
    );

  if (direct.length > 0) {
    return direct;
  }

  return Object.entries(
    CONSCIOUS_STAGE_LABELS
  ).map(([code, label]) => ({
    code,
    label,
    status: 'not_established',
    summary:
      t('reconstruction.noConsciousPattern')
  }));
}


function normalizeEvidenceBoundary(
  reconstruction,
  runtimeEntry
) {
  const directBoundary =
    reconstruction?.evidenceBoundary;

  const legacyEvidence =
    reconstruction?.evidence;

  return {
    knownReality:
      arrayValue(
        directBoundary?.observedEvidence
      ).length > 0
        ? directBoundary.observedEvidence
        : arrayValue(
            legacyEvidence?.knownReality
          ).length > 0
          ? legacyEvidence.knownReality
          : arrayValue(
              runtimeEntry?.knownReality
            ),

    reportedExperience:
      arrayValue(
        directBoundary?.reportedExperience
      ).length > 0
        ? directBoundary.reportedExperience
        : arrayValue(
            legacyEvidence?.reportedExperience
          ),

    interpretation:
      arrayValue(
        directBoundary?.interpretation
      ).length > 0
        ? directBoundary.interpretation
        : arrayValue(
            legacyEvidence?.interpretiveMaterial
          ).length > 0
          ? legacyEvidence.interpretiveMaterial
          : runtimeEntry?.userInterpretation
            ? [runtimeEntry.userInterpretation]
            : [],

    counterEvidence:
      arrayValue(directBoundary?.counterEvidence).length > 0
        ? directBoundary.counterEvidence
        : arrayValue(runtimeEntry?.counterEvidence),

    dependencies:
      arrayValue(directBoundary?.dependencies).length > 0
        ? directBoundary.dependencies
        : arrayValue(runtimeEntry?.dependencies),

    unknownReality:
      arrayValue(
        directBoundary?.unknownReality
      ).length > 0
        ? directBoundary.unknownReality
        : arrayValue(
            legacyEvidence?.unknownReality
          ).length > 0
          ? legacyEvidence.unknownReality
          : arrayValue(
              runtimeEntry?.unknownReality
            ),

    dependency:
      isPlainObject(reconstruction?.dependency)
        ? reconstruction.dependency
        : isPlainObject(
          legacyEvidence?.dependency
        )
        ? legacyEvidence.dependency
        : {
            summary:
              t('reconstruction.dependencyUnclear'),
            status:
              'unclear'
          }
  };
}


function reconstructionAnswer(runtimeEntry, target) {
  return arrayValue(runtimeEntry?.reconstructionEvidence)
    .filter(item => cleanText(item?.target) === target)
    .map(normalizeListItem)
    .filter(Boolean)
    .at(-1) || '';
}


function labeledAnswer(runtimeEntry, target) {
  const answer = reconstructionAnswer(runtimeEntry, target);
  if (!answer) return '';
  return `${t(`reconstruction.inquiryTargets.${target}`)}: ${answer}`;
}


export function customerReconstructionViewModel(
  reconstruction,
  runtimeEntry
) {
  const evidence = normalizeEvidenceBoundary(
    reconstruction,
    runtimeEntry
  );
  const change = cleanText(
    runtimeEntry?.realityChange?.normalizedStatement ||
    runtimeEntry?.realityChange?.rawStatement
  );
  const timing = cleanText(
    runtimeEntry?.timing?.normalizedTiming ||
    runtimeEntry?.timing?.statedTiming
  );
  const process = uniqueTextList([
    timing ? `${t('reconstruction.timing')}: ${timing}` : '',
    labeledAnswer(runtimeEntry, 'carrier_coordinates'),
    labeledAnswer(runtimeEntry, 'experience_style'),
    labeledAnswer(runtimeEntry, 'expression_style'),
    labeledAnswer(runtimeEntry, 'agency_style'),
    labeledAnswer(runtimeEntry, 'identity_style')
  ]);

  const dependencyConditions = arrayValue(evidence.dependencies)
    .map(item => cleanText(item?.source) || normalizeListItem(item));
  const conditions = uniqueTextList([
    ...arrayValue(runtimeEntry?.initialContext?.relevantConditions),
    labeledAnswer(runtimeEntry, 'carrier_signatures'),
    ...dependencyConditions
  ]);
  const confirmed = uniqueTextList([
    ...evidence.knownReality,
    ...evidence.counterEvidence
  ]);
  const unclear = uniqueTextList([
    ...evidence.unknownReality,
    ...arrayValue(evidence.interpretation).map(item => {
      const value = normalizeListItem(item);
      return value
        ? `${t('reconstruction.interpretations')}: ${value}`
        : '';
    })
  ]);

  return { change, process, conditions, confirmed, unclear };
}


export function renderCustomerReconstruction(
  reconstruction,
  runtimeEntry
) {
  const view = customerReconstructionViewModel(
    reconstruction,
    runtimeEntry
  );

  safeSetText('#customerChange', view.change);

  const targets = [
    ['#customerProcess', view.process, 'reconstruction.customerNoProcess'],
    ['#customerConditions', view.conditions, 'reconstruction.customerNoConditions'],
    ['#customerConfirmed', view.confirmed, 'reconstruction.customerNoConfirmed'],
    ['#customerUnclear', view.unclear, 'reconstruction.customerNoUnknown']
  ];

  for (const [selector, values, fallbackKey] of targets) {
    const element = qs(selector);
    if (element) {
      element.innerHTML = renderListHTML(values, t(fallbackKey));
    }
  }
}


function normalizeDirection(
  reconstruction,
  runtimeEntry
) {
  const direction =
    reconstruction?.direction;

  const entryDirection =
    runtimeEntry?.reconstructionDirection;

  return {
    focus:
      cleanText(direction?.focus) ||
      cleanText(entryDirection?.focus) ||
      t('reconstruction.defaultFocus'),

    rationale:
      cleanText(direction?.rationale) ||
      cleanText(entryDirection?.rationale) ||
      t('reconstruction.defaultRationale'),

    priorityEvidence:
      arrayValue(
        direction?.priorityEvidence
      ).length > 0
        ? direction.priorityEvidence
        : arrayValue(
            entryDirection?.priorityEvidence
          ).length > 0
          ? entryDirection.priorityEvidence
          : [
              t('reconstruction.defaultPriorityOne'),
              t('reconstruction.defaultPriorityTwo'),
              t('reconstruction.defaultPriorityThree')
            ]
  };
}


/* =========================================================
   RUNTIME ENTRY RENDERING
========================================================= */

export function renderRuntimeEntry(
  runtimeEntry
) {
  if (!runtimeEntry) {
    return;
  }

  safeSetText(
    '#observedChange',
    runtimeEntry
      ?.realityChange
      ?.normalizedStatement ||
    runtimeEntry
      ?.realityChange
      ?.rawStatement
  );

  safeSetText(
    '#entryTiming',
    runtimeEntry
      ?.timing
      ?.normalizedTiming ||
    runtimeEntry
      ?.timing
      ?.statedTiming,
    t('reconstruction.notEstablished')
  );

  const domains =
    arrayValue(
      runtimeEntry.affectedDomains
    )
      .map(item => {
        if (typeof item === 'string') {
          return t(`domains.${cleanText(item).toLowerCase()}`, {}, humanize(item));
        }

        const domain = cleanText(item?.domain).toLowerCase();
        return t(`domains.${domain}`, {}, humanize(item?.domain));
      })
      .filter(Boolean)
      .join(' · ');

  safeSetText(
    '#entryDomains',
    domains,
    t('reconstruction.notEstablished')
  );

  safeSetText(
    '#entryTension',
    runtimeEntry
      ?.emergingTension
      ?.summary,
    t('reconstruction.notEstablished')
  );

  safeSetText(
    '#runtimeEntityId',
    runtimeEntry.runtimeEntityId,
    '—'
  );

  safeSetText(
    '#runtimeEntryId',
    runtimeEntry.runtimeEntryId,
    '—'
  );
}


/* =========================================================
   FORMATION ARC RENDERING
========================================================= */

export function renderFormationArcs(
  reconstruction
) {
  const container =
    qs('#formationArcs');

  if (!container) {
    return;
  }

  const grammarStates =
    normalizeGrammarStates(
      reconstruction
    );

  const grammarMap =
    new Map(
      grammarStates.map(item => [
        item.code,
        item
      ])
    );

  const primaryArc =
    normalizePrimaryArc(
      reconstruction
    );

  container.innerHTML =
    ARC_ORDER.map(arc => {
      const isPrimary =
        arc.id === primaryArc;

      const activeCount =
        arc.grammars.filter(
          code => grammarMap.has(code)
        ).length;

      return `
        <section
          class="formation-arc ${
            isPrimary
              ? 'is-primary'
              : ''
          }"
          data-arc="${escapeHTML(arc.id)}"
        >
          <span>
            ${
              isPrimary
                ? t('reconstruction.primaryArcBadge')
                : t('reconstruction.activeCount', {
                    active: activeCount,
                    total: arc.grammars.length
                  })
            }
          </span>

          <h4>
            ${escapeHTML(localizedArc(arc))}
          </h4>

          <div class="grammar-tags">
            ${
              arc.grammars.map(code => {
                const state =
                  grammarMap.get(code);

                const label =
                  localizedGrammar(code, state?.label);

                const title = state
                  ? [
                      `${code} ${label}`,
                      localizedStatus(state.status),
                      state.summary,
                      percent(state.confidence)
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : `${code} ${label} · ${t('reconstruction.notEstablished')}`;

                return `
                  <span
                    class="grammar-tag ${
                      state
                        ? 'is-active'
                        : ''
                    }"
                    title="${escapeHTML(title)}"
                  >
                    ${escapeHTML(code)}
                    ${escapeHTML(label)}
                  </span>
                `;
              }).join('')
            }
          </div>
        </section>
      `;
    }).join('');

  const primaryArcObject =
    ARC_ORDER.find(
      arc => arc.id === primaryArc
    );

  safeSetText(
    '#primaryArc',
    (primaryArcObject ? localizedArc(primaryArcObject) : '') ||
    humanize(primaryArc),
    t('reconstruction.notEstablished')
  );

  const strongestState =
    [...grammarStates]
      .sort(
        (a, b) =>
          b.confidence -
          a.confidence
      )[0];

  safeSetText(
    '#strongestSignal',
    strongestState
      ? `${strongestState.code} ${localizedGrammar(strongestState.code, strongestState.label)}`
      : '',
    t('reconstruction.notEstablished')
  );
}


/* =========================================================
   CARRIER RENDERING
========================================================= */

export function renderCarrierRuntime(
  reconstruction
) {
  const coordinateGrid =
    qs('#coordinateGrid');

  const signatureGrid =
    qs('#signatureGrid');

  const coordinates =
    normalizeCoordinates(
      reconstruction
    );

  const signatures =
    normalizeSignatures(
      reconstruction
    );

  if (coordinateGrid) {
    coordinateGrid.innerHTML =
      coordinates
        .map(item => `
          <article class="coordinate-card">
            <span>
              ${escapeHTML(
                localizedCoordinate(item?.label) ||
                t('reconstruction.coordinatesTitle')
              )}
            </span>

            <strong>
              ${escapeHTML(
                getText(
                  item?.summary,
                  t('reconstruction.noSupportingEvidence')
                )
              )}
            </strong>

            <span class="state-badge">
              ${escapeHTML(
                localizedStatus(
                  item?.status ||
                  'not_established'
                )
              )}
            </span>
          </article>
        `)
        .join('');
  }

  if (signatureGrid) {
    signatureGrid.innerHTML =
      signatures
        .map(item => `
          <article class="signature-card">
            <span>
              ${escapeHTML(
                localizedSignature(item?.label) ||
                t('reconstruction.signaturesTitle')
              )}
            </span>

            <strong>
              ${escapeHTML(
                getText(
                  item?.summary,
                  t('reconstruction.insufficientEvidence')
                )
              )}
            </strong>

            <span class="state-badge">
              ${escapeHTML(
                localizedStatus(
                  item?.status ||
                  'unobserved'
                )
              )}
            </span>
          </article>
        `)
        .join('');
  }
}


/* =========================================================
   CONSCIOUS RUNTIME RENDERING
========================================================= */

export function renderConsciousRuntime(
  reconstruction
) {
  const container =
    qs('#consciousPipeline');

  if (!container) {
    return;
  }

  const stages =
    normalizeConsciousStages(
      reconstruction
    );

  container.innerHTML =
    stages
      .map(stage => {
        const code =
          cleanText(stage?.code) ||
          '';

        const label =
          localizedConsciousStage(code, cleanText(stage?.label));

        return `
          <article class="conscious-stage">
            <span>
              ${escapeHTML(code)}
            </span>

            <h4>
              ${escapeHTML(label)}
            </h4>

            <p>
              ${escapeHTML(
                getText(
                  stage?.summary,
                  t('reconstruction.noConsciousPattern')
                )
              )}
            </p>

            <span class="state-badge">
              ${escapeHTML(
                localizedStatus(
                  stage?.status ||
                  'not_established'
                )
              )}
            </span>
          </article>
        `;
      })
      .join('');
}


/* =========================================================
   EVIDENCE RENDERING
========================================================= */

export function renderEvidenceBoundary(
  reconstruction,
  runtimeEntry
) {
  const evidence =
    normalizeEvidenceBoundary(
      reconstruction,
      runtimeEntry
    );

  const knownReality =
    qs('#knownReality');

  const reportedExperience =
    qs('#reportedExperience');

  const interpretiveMaterial =
    qs('#interpretiveMaterial');

  const unknownReality =
    qs('#unknownReality');

  if (knownReality) {
    knownReality.innerHTML =
      renderListHTML(
        evidence.knownReality,
        t('reconstruction.noObservedEvidence')
      );
  }

  if (reportedExperience) {
    reportedExperience.innerHTML =
      renderListHTML(
        evidence.reportedExperience,
        t('reconstruction.noReportedExperience')
      );
  }

  if (interpretiveMaterial) {
    interpretiveMaterial.innerHTML =
      renderListHTML(
        evidence.interpretation,
        t('reconstruction.noInterpretation')
      );
  }

  if (unknownReality) {
    unknownReality.innerHTML =
      renderListHTML(
        evidence.unknownReality,
        t('reconstruction.noUnknownReality')
      );
  }

  safeSetText(
    '#dependencySummary',
    evidence
      ?.dependency
      ?.summary,
    t('reconstruction.dependencyUnclear')
  );

  safeSetText(
    '#dependencyStatus',
    localizedStatus(
      evidence
        ?.dependency
        ?.status ||
      'unclear'
    ),
    t('reconstruction.status.unclear')
  );

  safeSetText(
    '#unknownCount',
    String(
      uniqueTextList(
        evidence.unknownReality
      ).length
    ),
    '0'
  );
}


/* =========================================================
   RECONSTRUCTION DIRECTION RENDERING
========================================================= */

export function renderReconstructionDirection(
  reconstruction,
  runtimeEntry
) {
  const direction =
    normalizeDirection(
      reconstruction,
      runtimeEntry
    );

  safeSetText(
    '#reconstructionFocus',
    direction.focus
  );

  safeSetText(
    '#reconstructionRationale',
    direction.rationale
  );

  const priorityEvidence =
    qs('#priorityEvidence');

  if (priorityEvidence) {
    priorityEvidence.innerHTML =
      renderListHTML(
        direction.priorityEvidence,
        t('reconstruction.noAdditionalEvidence')
      );
  }
}


/* =========================================================
   INSPECTOR RENDERING
========================================================= */

export function renderRuntimeInspector(
  result
) {
  const reconstruction =
    result?.reconstruction || {};

  const runtimeEntry =
    result?.runtimeEntry || {};

  safeSetText(
    '#runtimeEntityId',
    result.runtimeEntityId ||
    runtimeEntry.runtimeEntityId,
    '—'
  );

  safeSetText(
    '#runtimeEntryId',
    result.runtimeEntryId ||
    runtimeEntry.runtimeEntryId,
    '—'
  );

  safeSetText(
    '#reconstructionMethod',
    reconstruction.reconstructionMethod === 'rule_first'
      ? t('reconstruction.ruleFirst')
      : reconstruction.reconstructionMethod ||
    reconstruction.methodLabel ||
    reconstruction.method ||
    t('reconstruction.ruleFirst'),
    t('reconstruction.ruleFirst')
  );

  const primaryArc =
    normalizePrimaryArc(
      reconstruction
    );

  const primaryArcObject =
    ARC_ORDER.find(
      item => item.id === primaryArc
    );

  safeSetText(
    '#primaryArc',
    (primaryArcObject ? localizedArc(primaryArcObject) : '') ||
    humanize(primaryArc),
    t('reconstruction.notEstablished')
  );

  const grammarStates =
    normalizeGrammarStates(
      reconstruction
    );

  const strongest =
    [...grammarStates]
      .sort(
        (a, b) =>
          b.confidence -
          a.confidence
      )[0];

  safeSetText(
    '#strongestSignal',
    strongest
      ? `${strongest.code} ${localizedGrammar(strongest.code, strongest.label)}`
      : '',
    t('reconstruction.notEstablished')
  );

  const evidence =
    normalizeEvidenceBoundary(
      reconstruction,
      runtimeEntry
    );

  safeSetText(
    '#unknownCount',
    String(
      uniqueTextList(
        evidence.unknownReality
      ).length
    ),
    '0'
  );

  safeSetText(
    '#reconstructionScore',
    percent(
      reconstruction.maturityScore
    ),
    '0%'
  );
}


/* =========================================================
   COMPLETE PAGE RENDERING
========================================================= */

export function renderReconstructionResult(
  result
) {
  if (
    !result ||
    typeof result !== 'object'
  ) {
    throw new Error(
      'Cannot render an empty reconstruction result.'
    );
  }

  const runtimeEntry =
    result.runtimeEntry ||
    {};

  const reconstruction =
    result.reconstruction ||
    {};

  renderCustomerReconstruction(
    reconstruction,
    runtimeEntry
  );

  renderRuntimeEntry(
    runtimeEntry
  );

  renderFormationArcs(
    reconstruction
  );

  renderCarrierRuntime(
    reconstruction
  );

  renderConsciousRuntime(
    reconstruction
  );

  renderEvidenceBoundary(
    reconstruction,
    runtimeEntry
  );

  renderReconstructionDirection(
    reconstruction,
    runtimeEntry
  );

  renderRuntimeInspector(
    result
  );

  return {
    rendered: true,

    runtimeEntityId:
      result.runtimeEntityId ||
      runtimeEntry.runtimeEntityId ||
      '',

    runtimeEntryId:
      result.runtimeEntryId ||
      runtimeEntry.runtimeEntryId ||
      '',

    maturityScore:
      clampScore(
        reconstruction.maturityScore
      ),

    primaryArc:
      normalizePrimaryArc(
        reconstruction
      )
  };
}


/* =========================================================
   RENDERER STATUS
========================================================= */

export function getReconstructionRendererStatus() {
  return {
    module:
      'PHI OS Reality Reconstruction Renderer',

    version:
      '2.5.2A',

    sections: [
      'customer_reconstruction_five_block',
      'runtime_entry',
      'formation_grammar',
      'carrier_runtime',
      'conscious_runtime',
      'evidence_boundary',
      'reconstruction_direction',
      'runtime_inspector'
    ],

    openAIRequired:
      false,

    workersAIRequired:
      false
  };
}
