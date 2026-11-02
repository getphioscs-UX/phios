import {
  getLocale,
  onLocaleChange,
  t
} from '../i18n.js';
import {
  previewProgressPercent,
  readPreviewProgress,
  savePreviewProgress
} from '../knowledge/reading-progress.js';
import {
  fetchPublicAssetConfig,
  fetchPublicAssetRegistry,
  normalizePublicAssetBaseUrl,
  resolvePublicAssetGroupMember
} from '../runtime/web-production/asset-resolver.js';

const pagesContainer = document.querySelector('[data-preview-pages]');
const tocContainer = document.querySelector('[data-preview-toc]');
const progressMeter = document.querySelector('[data-preview-progress]');
const progressOutput = document.querySelector('[data-preview-progress-value]');
const pageStatus = document.querySelector('[data-preview-page-status]');
const previousButton = document.querySelector('[data-preview-previous]');
const nextButton = document.querySelector('[data-preview-next]');
const resumeButton = document.querySelector('[data-preview-resume]');
const resumePage = document.querySelector('[data-preview-resume-page]');
let preview;
let currentPage = 1;
let pageObserver;
let previewAssetContext;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function localizedTitle(section) {
  const locale = getLocale();
  return section?.title?.[locale] || section?.title?.en || '';
}

function sectionForPage(page) {
  return preview.sections.find(section => (
    page >= section.startPage && page <= section.endPage
  )) || {
    id: 'cover',
    startPage: 1,
    endPage: 1,
    title: {
      en: 'Cover',
      'zh-Hans': '封面'
    }
  };
}

function pageObjectKey(page) {
  const pageNumber = String(page).padStart(
    preview.publicRender.pageNumberPadding,
    '0'
  );
  return preview.publicRender.objectKeyPattern.replace('{page}', pageNumber);
}

function pagePath(page) {
  if (!previewAssetContext) throw new Error('PREVIEW_ASSET_CONTEXT_UNAVAILABLE');
  return resolvePublicAssetGroupMember({
    registry: previewAssetContext.registry,
    publicBaseUrl: previewAssetContext.publicBaseUrl,
    assetCode: preview.publicRender.assetCode,
    memberObjectKey: pageObjectKey(page),
    surface: 'BOOK_ONE_PREVIEW'
  }).src;
}

function updateControls(page, persist = true) {
  const pageCount = preview.publicRender.pageCount;
  currentPage = Math.min(pageCount, Math.max(1, page));
  const section = sectionForPage(currentPage);
  const progress = previewProgressPercent(currentPage, pageCount);

  progressMeter.value = progress;
  progressOutput.textContent = `${progress}%`;
  pageStatus.textContent = t('knowledge.preview.pageStatus', {
    page: currentPage,
    total: pageCount,
    section: localizedTitle(section)
  });
  previousButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === pageCount;

  document.querySelectorAll('[data-preview-toc-link]').forEach(link => {
    link.toggleAttribute(
      'aria-current',
      link.dataset.previewTocLink === section.id
    );
  });

  if (persist) {
    savePreviewProgress(currentPage, pageCount);
  }
}

function scrollToPage(page, behavior = 'smooth') {
  const target = document.querySelector(`[data-preview-page="${page}"]`);
  target?.scrollIntoView({ behavior, block: 'start' });
}

function render() {
  if (!preview) return;

  tocContainer.innerHTML = preview.sections.map(section => `
    <li>
      <a
        href="#preview-page-${section.startPage}"
        data-preview-toc-link="${escapeHtml(section.id)}"
      >${escapeHtml(localizedTitle(section))} · ${section.startPage}–${section.endPage}</a>
    </li>
  `).join('');

  pagesContainer.innerHTML = Array.from(
    { length: preview.publicRender.pageCount },
    (_, index) => index + 1
  ).map(page => {
    const section = sectionForPage(page);
    const width = page === 1
      ? preview.publicRender.coverDimensions.width
      : preview.publicRender.pageDimensions.width;
    const height = page === 1
      ? preview.publicRender.coverDimensions.height
      : preview.publicRender.pageDimensions.height;
    const eager = page <= 2 ? 'eager' : 'lazy';
    const priority = page === 1 ? 'high' : 'auto';

    return `
      <figure
        class="preview-page"
        id="preview-page-${page}"
        data-preview-page="${page}"
        data-preview-section="${escapeHtml(section.id)}"
      >
        <div class="preview-page__media" data-preview-page-media data-state="loading">
          <img
            src="${escapeHtml(pagePath(page))}"
            alt="${escapeHtml(t('knowledge.preview.pageAlt', {
              page,
              total: preview.publicRender.pageCount,
              section: localizedTitle(section)
            }))}"
            width="${width}"
            height="${height}"
            loading="${eager}"
            fetchpriority="${priority}"
            decoding="async"
          >
          <p class="preview-page__fallback" role="status">${escapeHtml(t('knowledge.preview.loadError'))}</p>
        </div>
        <figcaption>
          ${escapeHtml(t('knowledge.preview.pageStatus', {
            page,
            total: preview.publicRender.pageCount,
            section: localizedTitle(section)
          }))}
        </figcaption>
      </figure>
    `;
  }).join('');

  bindPreviewImageStates();
  observePages();
  updateControls(currentPage, false);
}

function bindPreviewImageStates() {
  document.querySelectorAll('[data-preview-page-media]').forEach(media => {
    const image = media.querySelector('img');
    if (!image) return;
    const ready = () => {
      media.dataset.state = 'ready';
      image.hidden = false;
    };
    const failed = () => {
      media.dataset.state = 'failed';
      image.hidden = true;
      image.removeAttribute('src');
      image.removeAttribute('srcset');
    };
    if (image.complete && image.naturalWidth > 0) ready();
    else if (image.complete) failed();
    else {
      image.addEventListener('load', ready, { once: true });
      image.addEventListener('error', failed, { once: true });
    }
  });
}

function observePages() {
  pageObserver?.disconnect();
  pageObserver = new IntersectionObserver(entries => {
    const mostVisible = entries
      .filter(entry => entry.isIntersecting)
      .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

    if (mostVisible) {
      updateControls(Number(mostVisible.target.dataset.previewPage));
    }
  }, {
    rootMargin: '-20% 0px -55%',
    threshold: [0.05, 0.25, 0.5, 0.75]
  });

  document.querySelectorAll('[data-preview-page]').forEach(page => {
    pageObserver.observe(page);
  });
}

function initializeResume() {
  const stored = readPreviewProgress(preview.publicRender.pageCount);
  currentPage = stored.page;

  if (stored.furthestPage > 1) {
    resumeButton.hidden = false;
    resumePage.textContent = String(stored.page);
    resumeButton.addEventListener('click', () => scrollToPage(stored.page));
  }
}

previousButton.addEventListener('click', () => scrollToPage(currentPage - 1));
nextButton.addEventListener('click', () => scrollToPage(currentPage + 1));
document.addEventListener('keydown', event => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
  }
  if (event.key === 'ArrowLeft' && currentPage > 1) scrollToPage(currentPage - 1);
  if (event.key === 'ArrowRight' && currentPage < preview.publicRender.pageCount) scrollToPage(currentPage + 1);
});

Promise.all([
  fetch('/content/registry/book-1-free-preview.json').then(response => {
    if (!response.ok) throw new Error(`Preview manifest request failed: ${response.status}`);
    return response.json();
  }),
  fetchPublicAssetRegistry().then(async registry => {
    const registryBase = normalizePublicAssetBaseUrl(registry.public_base_url);
    const publicBaseUrl = registryBase || normalizePublicAssetBaseUrl((await fetchPublicAssetConfig()).publicAssetBaseUrl);
    return { registry, publicBaseUrl };
  })
])
  .then(([previewManifest, assetContext]) => {
    preview = previewManifest;
    previewAssetContext = assetContext;
    initializeResume();
    render();
  })
  .catch(() => {
    pagesContainer.innerHTML = `<p class="knowledge-boundary">${escapeHtml(t('knowledge.preview.loadError'))}</p>`;
    previousButton.disabled = true;
    nextButton.disabled = true;
  });

onLocaleChange(render);
