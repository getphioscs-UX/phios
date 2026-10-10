import { cleanText } from '../shared.js';

const STAGES = Object.freeze([
  ['coordinate', 'coordinateSection'],
  ['signature', 'signatureSection'],
  ['region', 'regionSection'],
  ['configuration', 'configurationSection'],
  ['interfaces', 'interfacesSection'],
  ['integrated', 'integratedSection']
]);

let observer = null;

function activate(stageId, updateHash = true) {
  document.querySelectorAll('[data-reading-stage]').forEach(item => {
    const active = item.dataset.readingStage === stageId;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-current', active ? 'step' : 'false');
  });
  if (updateHash) history.replaceState(history.state, '', `${location.pathname}${location.search}#${stageId}`);
}

export function initializeReadingSidebar() {
  document.querySelectorAll('[data-reading-stage]').forEach(item => {
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    const open = () => {
      const stage = cleanText(item.dataset.readingStage);
      const sectionId = STAGES.find(([id]) => id === stage)?.[1];
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      activate(stage);
    };
    item.addEventListener('click', open);
    item.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      open();
    });
  });

  if (typeof IntersectionObserver === 'function') {
    observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const stage = STAGES.find(([, sectionId]) => sectionId === visible.target.id)?.[0];
      if (stage) activate(stage);
    }, { rootMargin: '-96px 0px -58% 0px', threshold: [0.1, 0.3, 0.6] });
    STAGES.forEach(([, sectionId]) => {
      const section = document.getElementById(sectionId);
      if (section) observer.observe(section);
    });
  }

  const requested = cleanText(location.hash.replace('#', ''));
  const initial = STAGES.some(([id]) => id === requested) ? requested : 'coordinate';
  activate(initial, false);
  return { initialized: true, stageCount: STAGES.length, activeStage: initial };
}

export function destroyReadingSidebar() {
  observer?.disconnect();
  observer = null;
}
