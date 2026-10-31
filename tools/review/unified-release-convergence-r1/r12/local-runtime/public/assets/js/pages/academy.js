import {
  getLocale,
  initializeI18n,
  onLocaleChange,
  t
} from '../i18n.js';
import { bookRoute, loadCanonicalBooks } from '../web-production/public-surface-data.js';

const LESSONS = Object.freeze([
  {
    code: 'ALR-LO-LESSON-EVIDENCE-DISTINCTION',
    slug: 'evidence-distinction',
    key: 'evidenceDistinction',
    level: 'FOUNDATION',
    source: '/articles/why-explanation-does-not-equal-understanding'
  },
  {
    code: 'ALR-LO-LESSON-BOUNDED-READING',
    slug: 'bounded-reading',
    key: 'boundedReading',
    level: 'READER',
    source: '/articles/why-explanation-does-not-equal-understanding'
  },
  {
    code: 'ALR-LO-LESSON-CONSTRAINT-AWARE-NAVIGATION',
    slug: 'constraint-aware-navigation',
    key: 'constraintNavigation',
    level: 'NAVIGATOR',
    source: '/articles/why-navigation-begins-with-reality-position'
  },
  {
    code: 'ALR-LO-LESSON-REVIEW-CONTINUITY',
    slug: 'review-continuity',
    key: 'reviewContinuity',
    level: 'NAVIGATOR',
    source: '/articles/why-phi-os-is-needed'
  },
  {
    code: 'ALR-LO-LESSON-BOUNDED-PROFESSIONAL-FORMATION',
    slug: 'professional-boundaries',
    key: 'professionalBoundaries',
    level: 'PROFESSIONAL',
    source: '/articles/why-phi-os-is-needed'
  }
]);

const byId = id => document.getElementById(id);
const keyFor = (lesson, field) => `academyLearning.lessons.${lesson.key}.${field}`;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function lessonHref(lesson) {
  return `/academy-lesson?lesson=${encodeURIComponent(lesson.slug)}`;
}

function renderDashboard() {
  const list = byId('academyPathList');
  if (!list) return;
  const items = LESSONS.map((lesson, index) => {
    const item = element('li', 'academy-path-card');
    const sequence = element('span', 'academy-path-card__sequence', String(index + 1).padStart(2, '0'));
    sequence.setAttribute('aria-hidden', 'true');
    const body = element('div', 'academy-path-card__body');
    const meta = element('p', 'academy-path-card__meta', t(`academyLearning.levels.${lesson.level}`));
    const title = element('h3', '', t(keyFor(lesson, 'title')));
    const summary = element('p', '', t(keyFor(lesson, 'summary')));
    const link = element('a', 'academy-text-link', t('academyLearning.dashboard.openLesson'));
    link.href = lessonHref(lesson);
    link.setAttribute('aria-label', `${t('academyLearning.dashboard.openLesson')}: ${t(keyFor(lesson, 'title'))}`);
    body.append(meta, title, summary, link);
    item.append(sequence, body);
    return item;
  });
  list.replaceChildren(...items);
  document.title = t('academyLearning.metaTitleDashboard');
}

function requestedLesson() {
  const code = new URLSearchParams(window.location.search).get('lesson');
  return LESSONS.find(lesson => lesson.slug === code || lesson.code === code) ?? LESSONS[0];
}

function renderLessonNavigation(selected) {
  const navigation = byId('academyLessonNavigation');
  if (!navigation) return;
  const items = LESSONS.map((lesson, index) => {
    const item = element('li', 'academy-lesson-nav__item');
    const link = element('a', 'academy-lesson-nav__link');
    link.href = lessonHref(lesson);
    if (lesson.code === selected.code) link.setAttribute('aria-current', 'page');
    const sequence = element('span', '', String(index + 1).padStart(2, '0'));
    sequence.setAttribute('aria-hidden', 'true');
    const label = element('strong', '', t(keyFor(lesson, 'title')));
    link.append(sequence, label);
    item.append(link);
    return item;
  });
  navigation.replaceChildren(...items);
}

function renderLesson() {
  if (!byId('academyLessonTitle')) return;
  const lesson = requestedLesson();
  const title = t(keyFor(lesson, 'title'));
  byId('academyLessonTitle').textContent = title;
  byId('academyLessonSummary').textContent = t(keyFor(lesson, 'summary'));
  byId('academyLessonLevel').textContent = t(`academyLearning.levels.${lesson.level}`);
  const objectives = [1, 2].map(number => {
    const suffix = number === 1 ? 'One' : 'Two';
    const item = element('li', 'academy-objective');
    const marker = element('span', 'academy-objective__marker', String(number).padStart(2, '0'));
    marker.setAttribute('aria-hidden', 'true');
    const body = element('div');
    body.append(
      element('h3', '', t(keyFor(lesson, `objective${suffix}Title`))),
      element('p', '', t(keyFor(lesson, `objective${suffix}Statement`)))
    );
    item.append(marker, body);
    return item;
  });
  byId('academyLessonObjectives').replaceChildren(...objectives);
  const source = byId('academyLessonSource');
  source.href = lesson.source;
  source.setAttribute('aria-label', `${t('academyLearning.lesson.sourceAction')}: ${title}`);
  const announcement = byId('academyLessonAnnouncement');
  if (announcement) announcement.textContent = title;
  renderLessonNavigation(lesson);
  document.title = `${title} — ${t('academyLearning.metaTitleLesson')}`;
}


function renderVolumeSources() {
  const root = document.querySelector('[data-wpr-academy-volumes]');
  if (!root) return;
  loadCanonicalBooks().then(registry => {
    const locale = getLocale();
    root.replaceChildren(...registry.books
      .slice()
      .sort((a, b) => a.volume - b.volume)
      .map(book => {
        const card = element('a', `wpr-book-card wpr-volume-${book.volume}`);
        card.href = bookRoute(book.book_id);
        const body = element('span', 'wpr-book-card__body');
        body.append(
          element('span', 'wpr-kicker', `Volume ${book.volume}`),
          element('strong', '', book.title?.[locale] || book.title?.en || book.book_id),
          element('span', '', (book.parts || []).map(part => `P${part}`).join(' · '))
        );
        card.append(body);
        return card;
      }));
  }).catch(() => root.replaceChildren());
}

function render() {
  renderDashboard();
  renderLesson();
  renderVolumeSources();
}

initializeI18n();
render();
onLocaleChange(() => render());

export {LESSONS};
