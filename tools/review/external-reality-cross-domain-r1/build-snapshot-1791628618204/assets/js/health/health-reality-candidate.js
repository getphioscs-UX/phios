const form = document.querySelector('[data-health-reality-form]');
const output = document.querySelector('[data-health-reality-output]');
if (form && output) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const fd = new FormData(form);
    const concern = String(fd.get('concern') || '').trim();
    const observedAt = String(fd.get('observedAt') || '').trim();
    output.hidden = false;
    output.innerHTML = '';
    const title = document.createElement('h2'); title.textContent = 'Current health observation';
    const p = document.createElement('p'); p.textContent = concern || 'No observation entered.';
    const meta = document.createElement('p'); meta.textContent = observedAt ? `Observed: ${observedAt}` : 'Date not provided — kept as unknown.';
    const boundary = document.createElement('p'); boundary.textContent = 'This candidate organizes observations only. It does not diagnose, rule out disease, or prescribe treatment.';
    output.append(title,p,meta,boundary);
  });
}
