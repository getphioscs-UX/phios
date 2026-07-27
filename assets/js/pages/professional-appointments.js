import { bindLocaleControls, getLocale, initializeI18n, onLocaleChange, t } from '../i18n.js';

const payload = window.__PHIOS_PROFESSIONAL_APPOINTMENT_VIEW__ && typeof window.__PHIOS_PROFESSIONAL_APPOINTMENT_VIEW__ === 'object'
  ? window.__PHIOS_PROFESSIONAL_APPOINTMENT_VIEW__ : null;
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const localized = value => value?.[getLocale() === 'zh-Hans' ? 'zh_Hans' : 'en'] || value?.en || '';
const rows = items => `<dl class="appointment-detail-list">${items.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value || '—')}</dd></div>`).join('')}</dl>`;

function render() {
  document.querySelector('#appointmentUnavailable').hidden = Boolean(payload);
  const root = document.querySelector('#professionalAppointment');
  if (!payload) { root.hidden = true; return; }
  root.hidden = false;
  const appointment = payload.appointment || {};
  const payment = payload.payment || {};
  document.querySelector('#appointmentService').textContent = t(`professionalAppointments.services.${appointment.service_type}`);
  document.querySelector('#appointmentTime').textContent = appointment.scheduled_start || '—';
  document.querySelector('#appointmentMethod').textContent = `${appointment.timezone || ''} · ${appointment.meeting_method || ''}`;
  document.querySelector('#appointmentStatus').textContent = t(`professionalAppointments.statuses.${appointment.status}`);
  document.querySelector('#appointmentOverview').innerHTML = rows([
    [t('professionalAppointments.appointmentId'), appointment.appointment_id],
    [t('professionalAppointments.professional'), appointment.professional_name],
    [t('professionalAppointments.consent'), appointment.consent_reference],
    [t('professionalAppointments.readiness'), appointment.ready_for_appointment ? t('professionalAppointments.ready') : t('professionalAppointments.needsAttention')]
  ]);
  const checks = appointment.pre_appointment_checks || {};
  document.querySelector('#appointmentPrecheck').innerHTML = `<ul class="appointment-check-list">${Object.keys(checks).map(key => `<li data-complete="${checks[key] === true}"><span aria-hidden="true">${checks[key] ? '✓' : '○'}</span><span>${esc(t(`professionalAppointments.checks.${key}`))}</span></li>`).join('')}</ul>`;
  document.querySelector('#appointmentPayment').innerHTML = rows([
    [t('professionalAppointments.service'), payment.service],
    [t('professionalAppointments.currency'), payment.currency],
    [t('professionalAppointments.amount'), payment.amount],
    [t('professionalAppointments.tax'), payment.tax],
    [t('professionalAppointments.discount'), payment.discount],
    [t('professionalAppointments.total'), payment.total],
    [t('professionalAppointments.paymentStatus'), t(`professionalAppointments.paymentStatuses.${payment.payment_status}`)],
    [t('professionalAppointments.refundStatus'), t(`professionalAppointments.refundStatuses.${payment.refund_status}`)],
    [t('professionalAppointments.invoiceId'), payment.invoice_id]
  ]);
  const messages = Array.isArray(payload.notifications) ? payload.notifications : [];
  document.querySelector('#appointmentNotifications').innerHTML = messages.length
    ? `<ol class="appointment-message-list">${messages.map(item => `<li><strong>${esc(t(`professionalAppointments.reminders.${item.reminder_type || 'confirmation'}`))}</strong><p>${esc(localized(item.message) || item.scheduled_for || '')}</p><small>${esc(item.delivery_status || 'draft')}</small></li>`).join('')}</ol>`
    : `<p>${esc(t('professionalAppointments.noMessages'))}</p>`;
}

initializeI18n(); bindLocaleControls();
document.addEventListener('click', event => {
  const button = event.target.closest('[data-appointment-view]'); if (!button) return;
  const view = button.dataset.appointmentView;
  document.querySelectorAll('[data-appointment-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelectorAll('[data-appointment-panel]').forEach(panel => { panel.hidden = panel.dataset.appointmentPanel !== view; });
});
render(); onLocaleChange(render);
