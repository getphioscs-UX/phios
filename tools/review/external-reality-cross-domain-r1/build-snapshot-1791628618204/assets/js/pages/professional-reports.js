import { bindLocaleControls, getLocale, initializeI18n, onLocaleChange, t } from '../i18n.js';
const payload = window.__PHIOS_PROFESSIONAL_REPORT_VIEW__ && typeof window.__PHIOS_PROFESSIONAL_REPORT_VIEW__ === 'object' ? window.__PHIOS_PROFESSIONAL_REPORT_VIEW__ : null;
const esc = value => String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const localized = value => value?.[getLocale() === 'zh-Hans' ? 'zh_Hans' : 'en'] || value?.en || '';
const list = value => Array.isArray(value) ? value : [];
const sourceLabel = value => {
  const key = `professionalReports.sourceLabels.${value}`;
  const translated = t(key);
  return translated === key ? value : translated;
};
function render() {
  document.querySelector('#reportUnavailable').hidden = Boolean(payload);
  const root = document.querySelector('#professionalReport');
  if (!payload) { root.hidden = true; return; }
  root.hidden = false;
  document.querySelector('#reportType').textContent = payload.report_type || '';
  document.querySelector('#reportTitle').textContent = payload.title ? localized(payload.title) : t('professionalReports.title');
  document.querySelector('#reportStatus').textContent = payload.status || '';
  const meta = [['reportId',payload.report_id],['version',payload.version],['generated',payload.generated_at],['professional',payload.professional_name],['serviceScope',payload.service_scope],['consent',payload.consent_reference],['readerType',payload.reader_type],['registryVersion',payload.registry_version]];
  document.querySelector('#reportMetadata').innerHTML = meta.map(([key,value]) => `<div><dt>${esc(t(`professionalReports.${key}`))}</dt><dd>${esc(value || '—')}</dd></div>`).join('');
  document.querySelector('#reportContent').innerHTML = list(payload.sections).filter(section => section.client_visible !== false).map(section => `<section class="report-section" data-source-type="${esc(section.source_type)}"><h3>${esc(localized(section.title))}</h3><p>${esc(localized(section.content))}</p><small>${esc(t('professionalReports.source'))}: ${esc(sourceLabel(section.source_type))} · ${esc(t('professionalReports.confidence'))}: ${esc(section.confidence)}</small></section>`).join('');
  document.querySelector('#reportSources').innerHTML = `<div class="report-source-list">${list(payload.sections).map(section => `<article><strong>${esc(localized(section.title))}</strong><dl><div><dt>${esc(t('professionalReports.source'))}</dt><dd>${esc(sourceLabel(section.source_type))}</dd></div><div><dt>${esc(t('professionalReports.sourceReference'))}</dt><dd>${esc(section.source_reference)}</dd></div><div><dt>${esc(t('professionalReports.correspondence'))}</dt><dd>${esc(section.correspondence_status)}</dd></div><div><dt>${esc(t('professionalReports.registryVersion'))}</dt><dd>${esc(section.registry_version || '—')}</dd></div></dl></article>`).join('')}</div>`;
  document.querySelector('#reportHistory').innerHTML = list(payload.version_history).length ? `<ol>${payload.version_history.map(item => `<li><strong>${esc(item.version)}</strong> · ${esc(item.status)} · ${esc(item.changed_at)}</li>`).join('')}</ol>` : `<p>${esc(t('professionalReports.noHistory'))}</p>`;
  document.querySelector('#reportBoundary').textContent = localized(payload.interpretation_boundary);
  document.querySelector('#reportConfidentiality').textContent = localized(payload.confidentiality_notice);
}
initializeI18n(); bindLocaleControls();
document.querySelector('#printReport').addEventListener('click', () => { if (payload) window.print(); });
document.addEventListener('click', event => { const button = event.target.closest('[data-report-view]'); if (!button) return; const view = button.dataset.reportView; document.querySelectorAll('[data-report-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button))); document.querySelectorAll('[data-report-panel]').forEach(panel => { panel.hidden = panel.dataset.reportPanel !== view; }); });
render(); onLocaleChange(render);
