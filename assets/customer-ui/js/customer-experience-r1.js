// Marketing presentation is opt-in by route; account, checkout and delivery stay outside it.
function installExperience() {
// Presentation only. Source admission, account rights and API handlers keep their owners.
const stylesheet = '/assets/customer-ui/surfaces/customer-experience-r1.css';
if (!document.querySelector(`link[href="${stylesheet}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = stylesheet; document.head.append(link);
}
document.body.classList.add('experience-r1');
const base = 'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev';
const chinese = () => document.documentElement.lang.toLowerCase().startsWith('zh');
function copy(node, en, zh) {
  if (!node) return;
  node.dataset.cxEn = en; node.dataset.cxZh = zh;
  node.textContent = chinese() ? zh : en;
}
function subjectPicture(subject) {
  const picture = document.createElement('picture');
  const source = document.createElement('source');
  source.media = '(max-width: 600px)';
  source.srcset = `${base}/images/hero/PHIOS-SUBJECT-${subject}-HERO-R2-M.webp`;
  const image = document.createElement('img');
  image.src = `${base}/images/hero/PHIOS-SUBJECT-${subject}-HERO-R2-D.webp`;
  image.alt = ''; image.width = 1672; image.height = 941;
  image.decoding = 'async'; image.loading = 'eager';
  picture.append(source, image); return picture;
}
function home() {
  const hero = document.querySelector('.r3-home-hero');
  if (!hero || hero.querySelector('.experience-home-visual')) return;
  const visual = document.createElement('div'); visual.className = 'experience-home-visual';
  visual.setAttribute('aria-hidden', 'true');
  for (const name of ['FAMILY', 'BUSINESS', 'COUNTRY']) visual.append(subjectPicture(name));
  hero.append(visual);
  copy(hero.querySelector('.r3-eyebrow'), 'A clearer view of everyday life', '把生活看得更清楚');
  copy(hero.querySelector('.r3-home-intro'),
    'Start with what matters to you. Explore the people, relationships and wider world connected to your question.',
    '从你关心的事情开始。看清自己、身边的人，以及与你的选择相连的世界。');
  copy(hero.querySelector('.r3-text-link'), 'Find your perspective ↓', '找到你的观察视角 ↓');
  copy(document.querySelector('#six-perspectives-title'), 'Where would you like to begin?', '你想从哪里开始？');
  copy(document.querySelector('.r3-discovery > p'),
    'Six ways into the same world. Choose the one closest to your situation.',
    '同一个世界，六个入口。选择最贴近你当前处境的视角。');
  copy(document.querySelector('.r3-continuity .r3-secondary-grid article:nth-child(2) > p'),
    'Pick up where you left off. Return to the records and evidence you have saved.',
    '从上次停下的地方继续，查看你保存的记录与证据。');
}
function knowledgeHero() {
  const hero = document.querySelector('.cx-knowledge-hero, .cx-explore-subhero');
  if (!hero) return;
  // Older editorial scripts moved copy into a full-bleed panel while leaving a
  // second hero below it. Keep the approved image; reunite it with its copy.
  const panel = hero.querySelector('.pis-landing-hero');
  const original = hero.querySelector('.cx-knowledge-hero__visual');
  if (panel && original) {
    panel.classList.add('experience-hero-copy');
    original.hidden = false;
  }
  if (location.pathname === '/knowledge/') {
    copy(hero.querySelector('h1'), 'Follow your curiosity. Find a clearer understanding.', '跟随好奇，找到更清楚的理解。');
    copy(hero.querySelector('.cx-lead'),
      'Explore articles, books and visual guides. Start with one question, then follow the sources that help you understand it.',
      '阅读文章、书籍与图解。从一个问题出发，沿着来源慢慢看清。');
  }
}
function subjects() {
  copy(document.querySelector('.sow-capability-note'),
    'Choose a tool below. Sign-in and service requirements are explained before you begin.',
    '选择下方工具开始。需要登录或使用服务时，会先说明相关条件。');
}
function restoreMissingHero() {
  const plan = location.pathname === '/books/'
    ? ['.cx-knowledge-hero__grid', 'PHIOS-HERO-EIGHT-VOLUME-SYSTEM-v1.webp']
    : location.pathname === '/professional/financial/'
      ? ['.finance-everyday-hero', 'PHIOS-HERO-FINANCIAL-REALITY-v1.webp'] : null;
  if (!plan) return;
  const grid = document.querySelector(plan[0]);
  if (!grid || grid.querySelector('figure, picture') || grid.dataset.experienceHero) return;
  grid.dataset.experienceHero = 'resolving';
  // Use the existing admission authority. An inventory error or withheld asset
  // leaves the working page intact instead of guessing a URL or widening access.
  void import('../../js/runtime/web-production/asset-resolver.js').then(async module => {
    const asset = await module.resolveApprovedVisual(plan[1]);
    if (!grid.isConnected || grid.querySelector('figure, picture')) return;
    const figure = document.createElement('figure');
    figure.className = 'experience-restored-hero cx-knowledge-hero__visual';
    figure.dataset.vr2Role = 'HERO';
    const image = document.createElement('img');
    image.src = asset.src; image.alt = '';
    image.width = asset.width || 2560; image.height = asset.height || 1440;
    image.loading = 'eager'; image.decoding = 'async'; image.fetchPriority = 'high';
    figure.append(image); grid.append(figure);
    grid.dataset.experienceHero = 'bound';
  }).catch(() => { grid.dataset.experienceHero = 'unavailable'; });
}
function update() { home(); knowledgeHero(); subjects(); restoreMissingHero(); }
update();
window.addEventListener('phios:localechange', update);
// Optional editorial modules render after the shell. A bounded observer watches
// additions only; it does not rewrite inputs or application state.
let scheduled = false;
const observer = new MutationObserver(records => {
  if (!records.some(record => [...record.addedNodes].some(node => node.nodeType === 1))) return;
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { scheduled = false; update(); });
});
observer.observe(document.querySelector('main') || document.body, {childList: true, subtree: true});

}
if (/^\/(?:$|subjects\/|knowledge\/(?!ask\/)|books\/|articles\/|figures\/|perspectives\/|world\/|professional\/|about\/|academy\/|search\/)/.test(location.pathname)) installExperience();
