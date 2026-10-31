import { bindLocaleControls, initializeI18n, onLocaleChange, t } from '../i18n.js';
const state = { retention: null, request: null };
function render() {
  document.querySelector('#retentionStatus').textContent = state.retention ? t('externalReaderPrivacy.choiceRecorded') : '';
  document.querySelector('#rightsStatus').textContent = state.request ? t('externalReaderPrivacy.requestPrepared') : '';
}
initializeI18n(); bindLocaleControls();
document.querySelector('#confirmRetention').addEventListener('click', () => {
  const selected = document.querySelector('input[name="retention"]:checked');
  if (!selected) { document.querySelector('#retentionStatus').textContent = t('externalReaderPrivacy.chooseRequired'); return; }
  state.retention = { retention_choice: selected.value, explicit_action: true, long_term_runtime_memory_write: false };
  render();
});
document.querySelectorAll('[data-rights-action]').forEach(button => button.addEventListener('click', () => {
  state.request = { action: button.dataset.rightsAction, status: 'requested', action_executed: false };
  render();
}));
onLocaleChange(render);
