const PREVIEW_KEY = 'phios:book-one:preview-progress:v2';

function normalizePage(value, pageCount) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page)
    ? Math.min(pageCount, Math.max(1, page))
    : 1;
}

export function readPreviewProgress(pageCount = 48) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(PREVIEW_KEY) || '{}');
    return {
      page: normalizePage(stored.page, pageCount),
      furthestPage: normalizePage(stored.furthestPage, pageCount)
    };
  } catch {
    return { page: 1, furthestPage: 1 };
  }
}

export function savePreviewProgress(page, pageCount = 48) {
  const current = readPreviewProgress(pageCount);
  const normalizedPage = normalizePage(page, pageCount);
  const state = {
    page: normalizedPage,
    furthestPage: Math.max(current.furthestPage, normalizedPage)
  };

  try {
    window.localStorage.setItem(PREVIEW_KEY, JSON.stringify(state));
  } catch {
    // Reading progress is optional and never controls access.
  }

  return state;
}

export function previewProgressPercent(page, pageCount = 48) {
  const normalizedPage = normalizePage(page, pageCount);
  return Math.round((normalizedPage / pageCount) * 100);
}
