const PREVIEW_KEY = 'phios:book-one:preview-progress:v1';

function safeRead(key) {
  try {
    const value = Number.parseInt(window.localStorage.getItem(key) || '0', 10);
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  } catch {
    return 0;
  }
}

function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Reading progress is optional and never controls access.
  }
}

export function initializePreviewProgress() {
  const meter = document.querySelector('[data-preview-progress]');
  const output = document.querySelector('[data-preview-progress-value]');

  if (!meter || !output) return;

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0
      ? Math.round((window.scrollY / scrollable) * 100)
      : 100;
    const value = Math.max(safeRead(PREVIEW_KEY), Math.min(100, progress));

    meter.value = value;
    output.textContent = `${value}%`;
    safeWrite(PREVIEW_KEY, value);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
}
