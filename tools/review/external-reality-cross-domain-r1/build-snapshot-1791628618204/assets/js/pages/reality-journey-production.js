import { initializeI18n, onLocaleChange, t } from '../i18n.js';
import { escapeHTML } from '../shared.js';

const JR_FREEZE_URL = '/content/runtime/journey-runtime/freeze/jr-v2-freeze-v1.json';
const JR_STAGE_URL = '/content/runtime/journey-runtime/registries/canonical-journey-stage-registry-v2.json';
const JR_COMPAT_URL = '/content/runtime/journey-runtime/registries/journey-stage-compatibility-registry-v1.json';

async function readJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`JR_AUTHORITY_UNAVAILABLE:${url}`);
  return response.json();
}

function validateAuthority({ freeze, stages, compatibility }) {
  if (freeze?.status !== 'JR-v2.0.0-FROZEN') {
    throw new Error('JR_FREEZE_NOT_ACTIVE');
  }
  if (freeze?.wprHandoff?.wprW20ReadOnlyProjectionEligible !== true) {
    throw new Error('JR_WPR_W20_HANDOFF_NOT_ELIGIBLE');
  }
  const canonical = stages?.canonicalStages;
  if (!Array.isArray(canonical) || canonical.length !== 8) {
    throw new Error('JR_CANONICAL_STAGE_REGISTRY_INVALID');
  }
  const order = canonical.map(item => item.code);
  if (JSON.stringify(order) !== JSON.stringify(stages.canonicalOrder)) {
    throw new Error('JR_CANONICAL_STAGE_ORDER_INVALID');
  }
  if (compatibility?.status !== 'compatibility_only') {
    throw new Error('JR_COMPATIBILITY_REGISTRY_INVALID');
  }
  return canonical;
}

function renderStageList(canonicalStages) {
  const target = document.querySelector('[data-wpr-jr-canonical-stages]');
  if (!target) return;

  target.innerHTML = canonicalStages.map(stage => `
    <li class="wpr-jr-canonical-stage" data-jr-canonical-stage="${escapeHTML(stage.code)}">
      <span class="wpr-jr-canonical-stage__number">${String(stage.ordinal).padStart(2, '0')}</span>
      <h3>${escapeHTML(t(`journeyCanonical.stages.${stage.code}.name`, {}, stage.code))}</h3>
      <p>${escapeHTML(t(`journeyCanonical.stages.${stage.code}.purpose`, {}, ''))}</p>
    </li>
  `).join('');
}

function renderStatus() {
  const status = document.querySelector('[data-wpr-jr-authority-status]');
  if (!status) return;
  status.innerHTML = `
    <li>${escapeHTML(t('journeyCanonical.authority.statusFrozen'))}</li>
    <li>${escapeHTML(t('journeyCanonical.authority.statusReadOnly'))}</li>
    <li>${escapeHTML(t('journeyCanonical.authority.statusNoPersistence'))}</li>
  `;
}

function renderError(error) {
  console.error('WPR-W20 JR v2 authority projection failed.', error);
  document.body.dataset.jrAuthorityState = 'unavailable';
  const target = document.querySelector('[data-wpr-jr-authority-error]');
  if (!target) return;
  target.hidden = false;
  target.textContent = t(
    'journeyCanonical.dashboard.unavailableCopy',
    {},
    'JR v2 authority could not be loaded. Existing local state is left unchanged.'
  );
}

async function boot() {
  initializeI18n();
  try {
    const [freeze, stages, compatibility] = await Promise.all([
      readJson(JR_FREEZE_URL),
      readJson(JR_STAGE_URL),
      readJson(JR_COMPAT_URL)
    ]);
    const canonicalStages = validateAuthority({ freeze, stages, compatibility });
    document.body.dataset.jrAuthorityState = 'ready';
    document.body.dataset.jrAuthorityVersion = freeze.runtimeVersion || '2.0.0';

    const render = () => {
      renderStageList(canonicalStages);
      renderStatus();
    };
    render();
    onLocaleChange(render);
  } catch (error) {
    renderError(error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
