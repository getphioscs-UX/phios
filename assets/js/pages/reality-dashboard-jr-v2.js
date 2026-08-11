import { initializeI18n, onLocaleChange, t } from '../i18n.js';
import { escapeHTML } from '../shared.js';

const JR_FREEZE_URL = '/content/runtime/journey-runtime/freeze/jr-v2-freeze-v1.json';
const JR_STAGE_URL = '/content/runtime/journey-runtime/registries/canonical-journey-stage-registry-v2.json';
const JR_COMPAT_URL = '/content/runtime/journey-runtime/registries/journey-stage-compatibility-registry-v1.json';

let authority = null;

async function readJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`JR_AUTHORITY_UNAVAILABLE:${url}`);
  return response.json();
}

function validateAuthority({ freeze, stages, compatibility }) {
  if (freeze?.status !== 'JR-v2.0.0-FROZEN') throw new Error('JR_FREEZE_NOT_ACTIVE');
  if (freeze?.wprHandoff?.wprW20ReadOnlyProjectionEligible !== true) {
    throw new Error('JR_WPR_W20_HANDOFF_NOT_ELIGIBLE');
  }
  if (!Array.isArray(stages?.canonicalStages) || stages.canonicalStages.length !== 8) {
    throw new Error('JR_CANONICAL_STAGE_REGISTRY_INVALID');
  }
  if (compatibility?.status !== 'compatibility_only') {
    throw new Error('JR_COMPATIBILITY_REGISTRY_INVALID');
  }
}

function currentLegacyStage() {
  const current = document.querySelector(
    '#dashboardStages [data-legacy-journey-stage].is-current'
  );
  return current?.dataset.legacyJourneyStage
    || document.body.dataset.legacyJourneyStage
    || null;
}

function canonicalStageFor(legacyStage) {
  if (!legacyStage || !authority) return null;
  const mapped = authority.compatibility.legacyM3cStageMappings?.[legacyStage];
  if (!mapped) return null;
  return authority.stages.canonicalStages.find(stage => stage.code === mapped) || null;
}

function render() {
  const target = document.querySelector('[data-wpr-jr-dashboard-authority]');
  if (!target || !authority) return;

  const legacy = currentLegacyStage();
  const canonical = canonicalStageFor(legacy);
  const current = target.querySelector('[data-wpr-jr-canonical-current]');
  const state = target.querySelector('[data-wpr-jr-dashboard-state]');

  if (!canonical) {
    current.textContent = t('journeyCanonical.dashboard.unavailable');
    state.textContent = t('journeyCanonical.dashboard.unavailableCopy');
    target.dataset.jrProjectionState = 'mapping-unavailable';
    return;
  }

  current.textContent = t(
    `journeyCanonical.stages.${canonical.code}.name`,
    {},
    canonical.code
  );
  state.textContent = `${String(canonical.ordinal).padStart(2, '0')} · ${canonical.code}`;
  target.dataset.jrProjectionState = 'mapped';
  target.dataset.jrCanonicalStage = canonical.code;
  target.dataset.jrLegacyStage = legacy;
}

function renderUnavailable(error) {
  console.error('WPR-W20 Journey dashboard canonical mapping failed.', error);
  const target = document.querySelector('[data-wpr-jr-dashboard-authority]');
  if (!target) return;
  target.dataset.jrProjectionState = 'authority-unavailable';
  const current = target.querySelector('[data-wpr-jr-canonical-current]');
  const state = target.querySelector('[data-wpr-jr-dashboard-state]');
  if (current) current.textContent = t('journeyCanonical.dashboard.unavailable');
  if (state) state.textContent = t('journeyCanonical.dashboard.unavailableCopy');
}

async function boot() {
  initializeI18n();
  try {
    const [freeze, stages, compatibility] = await Promise.all([
      readJson(JR_FREEZE_URL),
      readJson(JR_STAGE_URL),
      readJson(JR_COMPAT_URL)
    ]);
    validateAuthority({ freeze, stages, compatibility });
    authority = { freeze, stages, compatibility };

    const refresh = () => render();
    refresh();
    onLocaleChange(refresh);

    const stageList = document.getElementById('dashboardStages');
    if (stageList) {
      const observer = new MutationObserver(refresh);
      observer.observe(stageList, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-legacy-journey-stage']
      });
    }
  } catch (error) {
    renderUnavailable(error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
