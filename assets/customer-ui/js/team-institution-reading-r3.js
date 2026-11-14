// Presentation-only locale links on Team / Institution. No fetch, storage, account or assessment.
function updateReadingLinks() {
  const locale = document.documentElement.lang === 'zh-Hans' ? 'zh-Hans' : 'en';
  for (const link of document.querySelectorAll('[data-publication-link]')) {
    link.href = '/articles/' + encodeURIComponent(link.dataset.publicationLink) + '?' + new URLSearchParams({locale});
  }
  for (const link of document.querySelectorAll('[data-publication-ask]')) {
    const slug = link.dataset.publicationAsk;
    const params = new URLSearchParams({
      contextType: 'KNOWLEDGE',
      contextRef: 'ARTICLE:' + slug,
      contextLabel: locale === 'zh-Hans' ? link.dataset.readingZh : link.dataset.readingEn,
      contextRoute: '/articles/' + slug,
      locale
    });
    link.href = '/knowledge/ask/?' + params;
  }
  for (const link of document.querySelectorAll('[data-institution-world]')) {
    link.textContent = locale === 'zh-Hans' ? 'World：马来西亚的1967年区域合作背景 →' : 'World: Malaysia’s regional-cooperation background in 1967 →';
    link.href = '/world/?' + new URLSearchParams({worldJourney: 'history', q: locale === 'zh-Hans' ? '马来西亚1967年东盟历史' : 'Malaysia ASEAN history 1967', locale}) + '#v=2&mode=history&pane=cases&region=MYS';
  }
}
updateReadingLinks();
window.addEventListener('phios:localechange', updateReadingLinks);

// Independent presentation successor: restore locale-sensitive links after history traversal.
window.addEventListener('pageshow', () => queueMicrotask(updateReadingLinks));
new MutationObserver(updateReadingLinks).observe(document.documentElement, {
  attributes: true, attributeFilter: ['lang']
});