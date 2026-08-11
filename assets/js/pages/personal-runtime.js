import { initializeI18n, onLocaleChange, t } from '../i18n.js';
import { escapeHTML } from '../shared.js';
import { resolvePublicVocabulary } from '../runtime/web-production/vocabulary-resolver.js';

const PROJECTION_URL = '/content/web-production/registries/wpr-personal-runtime-projection-registry-v1.json';
const VOCABULARY_URL = '/content/web-production/registries/wpr-public-vocabulary-registry-v2.json';

async function readJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`WPR_W21_AUTHORITY_UNAVAILABLE:${url}`);
  return response.json();
}

function statusKey(code) {
  if (code === 'READY_FOR_ELIGIBILITY_DECISION') return 'readyW26';
  if (code === 'ACTIVATION_CANDIDATE') return 'candidate';
  if (code === 'BLOCKED') return 'blocked';
  return 'registered';
}

function renderMethods(projection, vocabulary) {
  const target = document.querySelector('[data-personal-runtime-methods]');
  if (!target) return;
  target.innerHTML = projection.entries.filter(entry => entry.visibleOnSetupSurface === true).map(entry => {
    const vocab = vocabulary.entries.find(item => item.vocabularyCode === entry.vocabularyCode);
    if (!vocab) throw new Error(`WPR_W21_VOCABULARY_MISSING:${entry.vocabularyCode}`);
    const resolved = resolvePublicVocabulary({ registry: vocabulary, internalCode: vocab.internalCodes[0], locale: document.documentElement.lang === 'zh-Hans' ? 'zh-Hans' : 'en', audience: 'PUBLIC' });
    return `<article class="pr-method-card" data-availability="${escapeHTML(entry.availabilityCode)}"><span class="pr-method-state">${escapeHTML(t(`personalRuntime.status.${statusKey(entry.availabilityCode)}`))}</span><h3>${escapeHTML(resolved.publicLabel)}</h3></article>`;
  }).join('');
}

function precisionValue(name) { return document.querySelector(`[name="${name}"]`)?.value || 'unknown'; }
function fieldValue(id) { return document.getElementById(id)?.value?.trim() || ''; }
function coordinatesState() {
  const lat = fieldValue('birthLatitude'); const lon = fieldValue('birthLongitude'); const precision = precisionValue('CoordinatesPrecision');
  if (precision === 'unknown') return { valid: !lat && !lon, label: 'coordinates', provided: false };
  if (!lat && !lon) return { valid: true, label: 'coordinates', provided: false };
  const a = Number(lat), b = Number(lon); return { valid: Number.isFinite(a) && a >= -90 && a <= 90 && Number.isFinite(b) && b >= -180 && b <= 180, label: 'coordinates', provided: true };
}
function checkedField(id, precisionName, requiredWhenKnown = false) {
  const value = fieldValue(id); const precision = precisionValue(precisionName);
  if (precision === 'unknown') return { valid: value === '', label: id, provided: false };
  return { valid: requiredWhenKnown ? value !== '' : true, label: id, provided: value !== '' };
}
function timezoneValid() {
  const value = fieldValue('birthTimezone'); const precision = precisionValue('TimezonePrecision');
  if (precision === 'unknown') return { valid: value === '', label: 'birthTimezone', provided: false };
  if (!value) return { valid: false, label: 'birthTimezone', provided: false };
  return { valid: /^[A-Za-z_+\-]+(?:\/[A-Za-z0-9_+\-]+)+$/.test(value), label: 'birthTimezone', provided: true };
}
function checkReadiness() {
  const checks = [checkedField('birthDate','BirthDatePrecision',true), checkedField('birthTime','BirthTimePrecision',false), checkedField('birthPlace','BirthPlacePrecision',true), timezoneValid(), coordinatesState()];
  const confirmed = document.getElementById('customerConfirmation')?.checked === true;
  const valid = checks.every(item => item.valid) && confirmed;
  const panel = document.querySelector('[data-personal-runtime-readiness]'); const message = document.querySelector('[data-personal-runtime-readiness-message]'); const facts = document.querySelector('[data-personal-runtime-readiness-facts]');
  panel.hidden = false; panel.dataset.state = valid ? 'ready' : 'incomplete'; message.textContent = t(valid ? 'personalRuntime.ready' : 'personalRuntime.incomplete');
  const provided = checks.filter(x => x.provided).length; const unknown = checks.length - provided;
  facts.innerHTML = `<li>${escapeHTML(`${provided} fields provided · ${unknown} unknown or omitted`)}</li><li>${escapeHTML(t('personalRuntime.noStorage'))}</li>`;
}
function clearInputs() {
  const form = document.getElementById('personalRuntimeInput'); form?.reset();
  for (const name of ['BirthDatePrecision','BirthTimePrecision','BirthPlacePrecision','TimezonePrecision','CoordinatesPrecision']) { const el=document.querySelector(`[name="${name}"]`); if(el) el.value = name === 'CoordinatesPrecision' ? 'unknown' : 'exact'; }
  const panel=document.querySelector('[data-personal-runtime-readiness]'); if(panel) panel.hidden=true;
}
function bindPrecision() {
  document.querySelectorAll('[data-precision-for]').forEach(select => select.addEventListener('change', () => {
    const target=select.dataset.precisionFor;
    if (select.value !== 'unknown') return;
    if (target === 'coordinates') { document.getElementById('birthLatitude').value=''; document.getElementById('birthLongitude').value=''; return; }
    const el=document.getElementById(target); if(el) el.value='';
  }));
}
async function boot() {
  initializeI18n(); bindPrecision();
  document.getElementById('checkPersonalRuntimeInput')?.addEventListener('click', checkReadiness);
  document.getElementById('clearPersonalRuntimeInput')?.addEventListener('click', clearInputs);
  try {
    const [projection, vocabulary] = await Promise.all([readJson(PROJECTION_URL), readJson(VOCABULARY_URL)]);
    if (projection.status !== 'limited_production_input_readiness_no_method_execution') throw new Error('WPR_W21_PROJECTION_INVALID');
    if (projection.entries.some(entry => entry.publicExecutionAllowed === true)) throw new Error('WPR_W21_EXECUTION_MUST_REMAIN_BLOCKED');
    const render=()=>renderMethods(projection,vocabulary); render(); onLocaleChange(render);
  } catch (error) {
    console.error('WPR-W21 Personal Runtime authority projection failed.', error);
    const target=document.querySelector('[data-personal-runtime-authority-error]'); if(target) target.hidden=false;
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
