import fs from 'node:fs/promises';

const html = await fs.readFile('reality-navigation.html', 'utf8');
const render = await fs.readFile('assets/js/modules/navigation-render.js', 'utf8');
const css = await fs.readFile('assets/css/navigation-workspace.css', 'utf8');
const en = await fs.readFile('assets/js/locales/en/navigation.js', 'utf8');
const zh = await fs.readFile('assets/js/locales/zh-Hans/navigation.js', 'utf8');

for (const removed of ['navigationPriority', 'navigationRecommendedDirection', 'navigationActionSteps']) {
  if (html.includes(`id="${removed}"`)) throw new Error(`Legacy directive block remains: ${removed}`);
}

for (const required of ['navigation-choice-guide', 'navigation-path-customer-grid', 'navigation-path-details', 'navigation.pathBoundary', 'navigation.viewPathDetails', 'navigation.shownFirst', 'navigation.unknownRealityTitle']) {
  if (!html.includes(required) && !render.includes(required) && !css.includes(required)) {
    throw new Error(`Missing simplified Navigation customer rule: ${required}`);
  }
}

for (const key of ['choiceGuideTitle', 'choiceGuideText', 'shownFirst', 'pathBoundary', 'boundaryFallback', 'viewPathDetails', 'unknownRealityTitle']) {
  if (!en.includes(key) || !zh.includes(key)) throw new Error(`Missing bilingual Navigation customer key: ${key}`);
}

if (render.includes("t('navigation.suggestedStartingPath')")) {
  throw new Error('Directive suggested-starting-path label remains in path cards.');
}

console.log('Navigation customer view simplification: passed');
