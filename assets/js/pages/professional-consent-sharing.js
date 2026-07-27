import { bindLocaleControls, initializeI18n, onLocaleChange, t } from '../i18n.js';
const state = { grant: null, revoked: [] };
const selected = (root, name) => [...root.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
const escapeHTML = value => String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function render() {
  const root = document.querySelector('#consentStatus');
  if (!state.grant) return;
  root.hidden = false;
  root.innerHTML = `<h2>${escapeHTML(t('consentSharing.active'))}</h2><p>${escapeHTML(t('consentSharing.sharedCount', { count: state.grant.scopes.length }))}</p><p>${escapeHTML(t('consentSharing.auditNotice'))}</p>${state.revoked.length ? `<p>${escapeHTML(t('consentSharing.revokedCount', { count: state.revoked.length }))}</p>` : ''}`;
  document.querySelector('#revokeAccess').disabled = false;
}
initializeI18n(); bindLocaleControls();
const form = document.querySelector('#consentSharingForm');
document.querySelector('#consentDuration').addEventListener('change', event => { document.querySelector('#customExpiryField').hidden = event.target.value !== 'custom_date'; });
form.addEventListener('submit', event => {
  event.preventDefault(); const scopes = selected(form, 'scope'); const acks = selected(form, 'ack');
  const error = document.querySelector('#consentError');
  if (!scopes.length || acks.length !== 12) { error.hidden = false; error.textContent = t('consentSharing.required'); return; }
  error.hidden = true; state.grant = { scopes, duration: new FormData(form).get('duration'), runtime_evidence_write_authorised: false, runtime_memory_write_authorised: false }; render();
});
document.querySelector('#revokeAccess').addEventListener('click', () => {
  const scopes = [...document.querySelectorAll('#revocationScopes input:checked')].map(input => input.value);
  if (!scopes.length) return; state.revoked = [...new Set([...state.revoked, ...scopes])]; render();
});
onLocaleChange(render);
