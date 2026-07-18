/*
 * PHI OS Reality Reading Renderer
 * File: assets/js/modules/reading-render.js
 * Version: 1.1.0
 *
 * Renders a canonical Reality Reading without changing its evidence classes.
 * Runtime schema values remain canonical English; only display labels are
 * translated by the interface language runtime.
 */

import {
  qs,
  cleanText,
  escapeHTML
} from '../shared.js';

import { t } from '../i18n.js';

const REGION_KEYS = Object.freeze({
  R1: 'reading.regions.direction',
  R2: 'reading.regions.understanding',
  R3: 'reading.regions.expression',
  R4: 'reading.regions.position',
  R5: 'reading.regions.resource',
  R6: 'reading.regions.execution',
  R7: 'reading.regions.relationship',
  R8: 'reading.regions.survival',
  R9: 'reading.regions.driver'
});

const STATUS_KEYS = Object.freeze({
  active: 'reading.runtimeLabels.status.active',
  emerging: 'reading.runtimeLabels.status.emerging',
  stable: 'reading.runtimeLabels.status.stable',
  provisional: 'reading.runtimeLabels.status.provisional',
  ready: 'reading.runtimeLabels.status.ready',
  not_established: 'reading.runtimeLabels.status.notEstablished',
  complete: 'status.complete',
  partial: 'status.partial',
  unresolved: 'status.unresolved',
  available: 'status.available',
  unavailable: 'status.unavailable',
  confirmed: 'status.confirmed',
  reported: 'status.reported',
  unclear: 'status.unclear',
  possible: 'status.possible'
});

const COORDINATE_KEYS = Object.freeze({
  dna: 'reading.runtimeLabels.coordinates.dna',
  nervous_system: 'reading.runtimeLabels.coordinates.nervousSystem',
  circadian_rhythm: 'reading.runtimeLabels.coordinates.circadianRhythm',
  hormones: 'reading.runtimeLabels.coordinates.hormones',
  body_structure: 'reading.runtimeLabels.coordinates.bodyStructure',
  perception: 'reading.runtimeLabels.coordinates.perception'
});

const SIGNATURE_KEYS = Object.freeze({
  structural_signature: 'reading.runtimeLabels.signatures.structural',
  relational_signature: 'reading.runtimeLabels.signatures.relational',
  resource_signature: 'reading.runtimeLabels.signatures.resource',
  temporal_signature: 'reading.runtimeLabels.signatures.temporal',
  directional_signature: 'reading.runtimeLabels.signatures.directional',
  positional_signature: 'reading.runtimeLabels.signatures.positional'
});

const ARC_KEYS = Object.freeze({
  formation: 'reading.runtimeLabels.arcs.formation',
  activation: 'reading.runtimeLabels.arcs.activation',
  internalization: 'reading.runtimeLabels.arcs.internalization',
  reorganization: 'reading.runtimeLabels.arcs.reorganization',
  continuity: 'reading.runtimeLabels.arcs.continuity'
});

const CONSCIOUS_KEYS = Object.freeze({
  C1: 'reading.runtimeLabels.conscious.experience',
  C2: 'reading.runtimeLabels.conscious.compression',
  C3: 'reading.runtimeLabels.conscious.expression',
  C4: 'reading.runtimeLabels.conscious.action',
  C5: 'reading.runtimeLabels.conscious.identity'
});


const CUSTOMER_SUMMARY_LIMIT = 220;

function normalizedStatement(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[\s\u00a0]+/g, ' ')
    .replace(/[.!?。！？]+$/g, '')
    .trim();
}

function uniqueStatements(values, owned = new Set()) {
  const output = [];

  for (const value of list(values)) {
    const statement = cleanText(value);
    const key = normalizedStatement(statement);

    if (!statement || !key || owned.has(key)) continue;

    owned.add(key);
    output.push(statement);
  }

  return output;
}

function customerTextBlock(value, sourceKey) {
  const text = translatedKnownText(value);
  const source = t(sourceKey);

  if (text.length <= CUSTOMER_SUMMARY_LIMIT) {
    return `
      <div class="reading-customer-statement">
        <span class="reading-source-label">${escapeHTML(source)}</span>
        <p>${escapeHTML(text)}</p>
      </div>
    `;
  }

  const summary = `${text.slice(0, CUSTOMER_SUMMARY_LIMIT).trim()}…`;

  return `
    <div class="reading-customer-statement">
      <span class="reading-source-label">${escapeHTML(source)}</span>
      <p>${escapeHTML(summary)}</p>
      <details class="reading-full-answer">
        <summary>${escapeHTML(t('reading.customer.expandFull'))}</summary>
        <p>${escapeHTML(text)}</p>
      </details>
    </div>
  `;
}

function renderCustomerList(selector, values, sourceKey, fallbackKey) {
  const element = qs(selector);
  if (!element) return;

  const items = uniqueStatements(values);
  element.classList.add('reading-customer-list');
  element.innerHTML = items.length
    ? items.map(value => `<li>${customerTextBlock(value, sourceKey)}</li>`).join('')
    : `<li>${escapeHTML(t(fallbackKey))}</li>`;
}
const EVIDENCE_KEYS = Object.freeze({
  observed_evidence: 'evidence.observed',
  reported_experience: 'evidence.reported',
  interpretation: 'evidence.interpreted',
  professional_assessment: 'evidence.professional',
  unknown_reality: 'evidence.unknown'
});

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function enumKey(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function humanize(value) {
  return cleanText(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function percent(value) {
  const score = Math.max(0, Math.min(1, Number(value) || 0));
  return `${Math.round(score * 100)}%`;
}

function translatedFromMap(map, value, fallback = '') {
  const source = cleanText(value);
  const key = map[enumKey(source)] || map[source.toUpperCase()];

  return key
    ? t(key, {}, fallback || source)
    : fallback || source;
}

function translatedStatus(value) {
  const status = enumKey(value) || 'not_established';
  const key = STATUS_KEYS[status];

  return key
    ? t(key, {}, humanize(status))
    : humanize(status);
}

function translatedRegion(region) {
  if (!isObject(region)) return '';

  const id = cleanText(region.id).toUpperCase();
  const label = REGION_KEYS[id]
    ? t(REGION_KEYS[id], {}, cleanText(region.label))
    : cleanText(region.label);

  return [id, label].filter(Boolean).join(' ');
}

function translatedArc(value) {
  return translatedFromMap(ARC_KEYS, value, humanize(value));
}

function translatedCoordinate(value) {
  return translatedFromMap(COORDINATE_KEYS, value, cleanText(value));
}

function translatedSignature(value) {
  return translatedFromMap(SIGNATURE_KEYS, value, cleanText(value));
}

function translatedConsciousStage(stage) {
  const code = cleanText(stage?.code).toUpperCase();
  const key = CONSCIOUS_KEYS[code];

  return key
    ? t(key, {}, cleanText(stage?.label))
    : cleanText(stage?.label) || t('reading.dynamic.consciousRuntime');
}

function translatedEvidenceClass(value) {
  return translatedFromMap(EVIDENCE_KEYS, value, humanize(value));
}

function translatedKnownText(
  value,
  fallbackKey = 'reading.dynamic.notEstablished'
) {
  const source = cleanText(value);
  const normalized = source.toLowerCase().replace(/[.!。]+$/g, '');

  if (
    !source ||
    normalized === 'not established' ||
    normalized === 'not yet established' ||
    normalized === 'no supporting carrier evidence has been supplied' ||
    normalized === 'insufficient cross-runtime evidence'
  ) {
    return t(fallbackKey);
  }

  if (normalized === 'pattern not established') {
    return t('reading.integratedSection.patternNotEstablished');
  }

  if (normalized === 'no alternative reading has been established') {
    return t('reading.integratedSection.noAlternative');
  }

  return source;
}

function setText(
  selector,
  value,
  fallbackKey = 'reading.dynamic.notEstablished'
) {
  const element = qs(selector);

  if (!element) return;

  element.textContent = translatedKnownText(value, fallbackKey);
}

function renderList(
  selector,
  values,
  fallbackKey = 'reading.dynamic.notEstablished'
) {
  const element = qs(selector);

  if (!element) return;

  const items = list(values)
    .map(value => cleanText(value))
    .filter(Boolean);

  element.innerHTML = items.length
    ? items.map(value => `<li>${escapeHTML(value)}</li>`).join('')
    : `<li>${escapeHTML(t(fallbackKey))}</li>`;
}

function renderCoordinates(reading) {
  const container = qs('#readingCoordinateGrid');

  if (!container) return;

  const coordinates = list(
    reading.initializationCoordinates
  ).filter(isObject);

  container.innerHTML = coordinates.map(item => {
    const status = enumKey(item.status) || 'not_established';

    const summary = status === 'not_established'
      ? t('reading.dynamic.notEstablished')
      : translatedKnownText(item.summary);

    return `
      <article class="reading-coordinate-card">
        <span>${escapeHTML(translatedCoordinate(item.label))}</span>
        <strong>${escapeHTML(summary)}</strong>
        <small class="reading-state-badge">
          ${escapeHTML(translatedStatus(status))}
        </small>
      </article>
    `;
  }).join('');
}

function renderSignatures(reading) {
  const container = qs('#readingSignatureGrid');

  if (container) {
    const signatures = list(
      reading.carrierSignatures
    ).filter(isObject);

    container.innerHTML = signatures.map(item => {
      const status = enumKey(item.status) || 'not_established';

      const summary = status === 'not_established'
        ? t('reading.dynamic.notEstablished')
        : translatedKnownText(item.summary);

      return `
        <article class="reading-signature-card">
          <span>${escapeHTML(translatedSignature(item.label))}</span>
          <strong>${escapeHTML(summary)}</strong>
          <small class="reading-state-badge">
            ${escapeHTML(translatedStatus(status))}
          </small>
        </article>
      `;
    }).join('');
  }

  setText(
    '#strongestSignature',
    reading.strongestSignature
  );

  setText(
    '#signatureStability',
    reading.signatureStability
  );
}

function renderRegions(reading) {
  document.querySelectorAll('[data-region]').forEach(card => {
    card.classList.remove('is-active');
    card.dataset.regionStatus = 'not_established';
    card.removeAttribute('title');

    const small = card.querySelector('small');

    if (small) {
      small.textContent = t('reading.dynamic.notEstablished');
    }
  });

  for (
    const region of list(reading.runtimeRegions).filter(isObject)
  ) {
    const regionId = cleanText(region.id).toUpperCase();

    const card = document.querySelector(
      `[data-region="${regionId}"]`
    );

    if (!card) continue;

    const status = enumKey(region.status) || 'not_established';
    const confidence = percent(region.confidence);
    const statusText = translatedStatus(status);

    card.classList.toggle(
      'is-active',
      ['active', 'emerging'].includes(status)
    );

    card.dataset.regionStatus = status;
    card.title = `${statusText} · ${confidence}`;

    const small = card.querySelector('small');

    if (small) {
      small.textContent = `${statusText} · ${confidence}`;
    }
  }

  setText(
    '#primaryRuntimeRegion',
    translatedRegion(reading.primaryRuntimeRegion)
  );

  setText(
    '#connectedRuntimeRegions',
    list(reading.connectedRuntimeRegions)
      .filter(isObject)
      .map(translatedRegion)
      .filter(Boolean)
      .join(' · ')
  );
}

function translatedConfigurationLabel(value, type) {
  const normalized = cleanText(value).toLowerCase();

  if (!normalized || normalized === 'not established') {
    return t('reading.dynamic.notEstablished');
  }

  const keys = {
    relational: 'reading.configurationSection.relational',
    organizational: 'reading.configurationSection.organizational',
    contextual: 'reading.configurationSection.contextual'
  };

  if (
    normalized === 'relational configuration' ||
    normalized === 'organizational configuration' ||
    normalized === 'multi-domain context'
  ) {
    return t(keys[type], {}, value);
  }

  return cleanText(value);
}

function renderConfiguration(type, configuration) {
  const value = isObject(configuration)
    ? configuration
    : {};

  const status = enumKey(value.status);

  const isMissing =
    !cleanText(value.label) ||
    status === 'not_established' ||
    status.includes('no_stable_configuration');

  setText(
    `#${type}Configuration`,
    translatedConfigurationLabel(value.label, type)
  );

  const statusElement = qs(
    `#${type}ConfigurationStatus`
  );

  if (statusElement) {
    statusElement.textContent = isMissing
      ? t('reading.configurationSection.noStable')
      : `${t('reading.runtimeLabels.status.provisional')} · ${percent(value.confidence)}`;
  }
}

function renderConfigurations(reading) {
  const configurations = isObject(reading.configurations)
    ? reading.configurations
    : {};

  renderConfiguration(
    'relational',
    configurations.relational
  );

  renderConfiguration(
    'organizational',
    configurations.organizational
  );

  renderConfiguration(
    'contextual',
    configurations.contextual
  );
}

function renderInterfaces(reading) {
  const selected = new Set(
    list(reading?.interpretiveInterfaces?.selected)
      .map(value => cleanText(value).toLowerCase())
      .filter(Boolean)
  );

  document
    .querySelectorAll('[data-reading-interface]')
    .forEach(button => {
      const interfaceId = cleanText(
        button.dataset.readingInterface
      ).toLowerCase();

      const enabled = selected.has(interfaceId);

      button.setAttribute(
        'aria-pressed',
        enabled ? 'true' : 'false'
      );

      button.textContent = enabled
        ? t('reading.interfacesSection.enabled')
        : t('reading.interfacesSection.consentRequired');

      button.disabled = !enabled;

      button
        .closest('[data-interface]')
        ?.classList.toggle('is-enabled', enabled);
    });
}

function renderIntegrated(reading) {
  const integrated = isObject(reading.integratedReading)
    ? reading.integratedReading
    : {};

  const sentenceOwnership = new Set();
  const observedEvidence = uniqueStatements(
    integrated.observedEvidence,
    sentenceOwnership
  );
  const unknownReality = uniqueStatements(
    integrated.unknownReality,
    sentenceOwnership
  );

  renderCustomerList(
    '#readingKnownReality',
    observedEvidence,
    'reading.customer.sourceReported',
    'reading.dynamic.noObservedEvidence'
  );

  renderCustomerList(
    '#readingUnknownReality',
    unknownReality,
    'reading.customer.sourceUnconfirmed',
    'reading.dynamic.noUnknownReality'
  );

  const pattern = isObject(integrated.primaryPattern)
    ? integrated.primaryPattern
    : {};

  const patternElement = qs(
    '#primaryRuntimePattern'
  );

  if (patternElement) {
    patternElement.innerHTML = `
      <span class="reading-source-label">${escapeHTML(
        t('reading.customer.sourceSystem')
      )}</span>
      <strong>${escapeHTML(
        translatedKnownText(
          pattern.name,
          'reading.integratedSection.patternNotEstablished'
        )
      )}</strong>
      ${customerTextBlock(
        pattern.summary,
        'reading.customer.sourceSystem'
      )}
      <small>
        ${escapeHTML(t('reading.customer.customerMeaningLabel'))}
        ·
        ${escapeHTML(
          t('reading.dynamic.confidenceLabel', {
            confidence: percent(pattern.confidence)
          })
        )}
      </small>
    `;
  }

  const alternative = isObject(
    integrated.alternativeReading
  )
    ? integrated.alternativeReading
    : {};

  const alternativeElement = qs(
    '#alternativeReading'
  );

  if (alternativeElement) {
    const evidenceNeeded = list(
      alternative.evidenceNeeded
    )
      .map(value => cleanText(value))
      .filter(Boolean)
      .join(' · ');

    alternativeElement.innerHTML = `
      ${customerTextBlock(
        translatedKnownText(
          alternative.summary,
          'reading.integratedSection.noAlternative'
        ),
        'reading.customer.sourcePossible'
      )}
      <small>${escapeHTML(
        t('reading.dynamic.evidenceNeeded', {
          evidence:
            evidenceNeeded ||
            t('reading.dynamic.notEstablished')
        })
      )}</small>
    `;
  }

  const trail = qs('#readingEvidenceTrail');

  if (trail) {
    const items = list(
      integrated.evidenceTrail
    ).filter(isObject);

    trail.innerHTML = items.length
      ? items.map(item => `
          <li>
            <span>${escapeHTML(
              translatedEvidenceClass(
                item.evidenceClass
              )
            )}</span>

            <p>${escapeHTML(
              cleanText(item.statement)
            )}</p>
          </li>
        `).join('')
      : `<li>${escapeHTML(
          t('reading.dynamic.notEstablished')
        )}</li>`;
  }

  const conscious = qs(
    '#consciousReadingGrid'
  );

  if (conscious) {
    conscious.innerHTML = list(
      integrated.consciousRuntime
    )
      .filter(isObject)
      .map(stage => `
        <article>
          <span>${escapeHTML(
            cleanText(stage.code)
          )}</span>

          <strong>${escapeHTML(
            translatedConsciousStage(stage)
          )}</strong>

          <small>${escapeHTML(
            translatedStatus(stage.status)
          )}</small>
        </article>
      `).join('');
  }

  renderList(
    '#readingStrengths',
    integrated.strengths
  );

  renderList(
    '#readingRisks',
    integrated.risks
  );

  setText(
    '#readingCurrentRuntime',
    ARC_KEYS[enumKey(integrated.currentRuntime)]
      ? translatedArc(integrated.currentRuntime)
      : integrated.currentRuntime
  );

  setText(
    '#readingCurrentTransition',
    integrated.currentTransition
  );

  renderCustomerList(
    '#readingEvidenceWatch',
    uniqueStatements(integrated.evidenceWatch, sentenceOwnership),
    'reading.customer.sourceNextEvidence',
    'reading.dynamic.notEstablished'
  );
}

function translatedReadingMode(value) {
  const mode = enumKey(value);

  if (
    !mode ||
    mode === 'initial_integrated_reading'
  ) {
    return t('reading.inspector.initialMode');
  }

  return humanize(value);
}

function translatedProvider(value) {
  const provider = enumKey(value);

  if (
    !provider ||
    provider === 'rule_engine' ||
    provider === 'rule_first'
  ) {
    return t('reading.inspector.ruleEngine');
  }

  if (provider === 'workers_ai') {
    return 'Workers AI';
  }

  if (provider === 'openai') {
    return 'OpenAI';
  }

  return humanize(value);
}

function renderInspector(response) {
  const reading = isObject(response.reading)
    ? response.reading
    : {};

  const inference = isObject(response.inference)
    ? response.inference
    : {};

  const interfaceCount = list(
    reading?.interpretiveInterfaces?.selected
  ).length;

  setText(
    '#readingRuntimeEntityId',
    response.runtimeEntityId,
    'common.notAvailable'
  );

  setText(
    '#readingRuntimeEntryId',
    response.runtimeEntryId,
    'common.notAvailable'
  );

  setText(
    '#readingMode',
    translatedReadingMode(reading.readingMode)
  );

  setText(
    '#readingPrimaryArc',
    translatedArc(reading.primaryArc)
  );

  setText(
    '#readingInspectorRegion',
    translatedRegion(
      reading.primaryRuntimeRegion
    )
  );

  const unknownCount = qs(
    '#readingUnknownCount'
  );

  if (unknownCount) {
    unknownCount.textContent = String(
      list(
        reading?.evidenceBoundary?.unknownReality
      ).length
    );
  }

  const patternEstablished =
    reading?.patternAssessment?.established === true;

  setText(
    '#readingPatternBoundary',
    patternEstablished
      ? t('reading.inspector.established')
      : t('reading.inspector.possibleReading')
  );

  setText(
    '#readingNavigationBoundary',
    reading?.navigationReadiness?.ready === true
      ? t('reading.inspector.allowed')
      : t('reading.inspector.blocked')
  );

  const allowedSources = qs('#readingAllowedSources');

  if (allowedSources) {
    allowedSources.textContent = String(
      list(reading?.evidenceAudit?.patternSources).length
    );
  }

  setText(
    '#readingInterfaceCount',
    interfaceCount > 0
      ? t('reading.inspector.enabledCount', {
          count: interfaceCount
        })
      : t('reading.inspector.noneEnabled')
  );

  setText(
    '#readingInferenceProvider',
    translatedProvider(inference.provider)
  );

  setText(
    '#readingPaidAIUsed',
    inference.paidInferenceUsed
      ? t('common.yes')
      : t('common.no')
  );
}

export function renderRealityReading(response) {
  if (!isObject(response?.reading)) {
    throw new Error(
      'Cannot render an empty Reality Reading.'
    );
  }

  const reading = response.reading;
  const confidence = qs('#readingConfidence');

  if (confidence) {
    confidence.textContent = percent(
      reading.confidence
    );
  }

  renderCoordinates(reading);
  renderSignatures(reading);
  renderRegions(reading);
  renderConfigurations(reading);
  renderInterfaces(reading);
  renderIntegrated(reading);
  renderInspector(response);

  return {
    rendered: true,
    confidence:
      Number(reading.confidence) || 0,
    navigationReady:
      reading?.navigationReadiness?.ready === true
  };
}

export function getReadingRendererStatus() {
  return {
    module:
      'PHI OS Reality Reading Renderer',

    version:
      '1.1.0',

    localized:
      true,

    layers: [
      'coordinate',
      'signature',
      'region',
      'configuration',
      'interfaces',
      'integrated'
    ]
  };
}
