import fs from 'node:fs';

const failures = [];

function read(path) {
  if (!fs.existsSync(path)) {
    failures.push(`Missing file: ${path}`);
    return '';
  }
  return fs.readFileSync(path, 'utf8');
}

function requireMatch(path, pattern, description) {
  const content = read(path);
  if (!pattern.test(content)) failures.push(`${path}: ${description}`);
}

for (const page of ['about', 'thesis']) {
  requireMatch(`${page}.html`, /data-locale="en"/, 'missing EN data-locale control');
  requireMatch(`${page}.html`, /data-locale="zh-Hans"/, 'missing zh-Hans data-locale control');
  requireMatch(`${page}.html`, /data-i18n=/, 'missing data-i18n bindings');
  requireMatch(
    `${page}.html`,
    new RegExp(`/assets/js/pages/${page}\\.js`),
    `missing ${page}.js module`
  );
  requireMatch(
    `assets/js/pages/${page}.js`,
    /initializeI18n\s*\(\s*\)/,
    'initializeI18n() is not called'
  );
}

for (const locale of ['en', 'zh-Hans']) {
  const aggregate = `assets/js/locales/${locale}.js`;

  requireMatch(
    aggregate,
    new RegExp(`import about from './${locale}/about\\.js'`),
    'About locale module is not imported'
  );
  requireMatch(
    aggregate,
    new RegExp(`import thesis from './${locale}/thesis\\.js'`),
    'Thesis locale module is not imported'
  );
  requireMatch(aggregate, /\.\.\.about/, 'About dictionary is not composed');
  requireMatch(aggregate, /\.\.\.thesis/, 'Thesis dictionary is not composed');

  requireMatch(
    `assets/js/locales/${locale}/about.js`,
    /const\s+about\s*=\s*Object\.freeze/,
    'About dictionary module is malformed'
  );
  requireMatch(
    `assets/js/locales/${locale}/thesis.js`,
    /const\s+thesis\s*=\s*Object\.freeze/,
    'Thesis dictionary module is malformed'
  );
}

if (failures.length) {
  console.error('\nAbout/Thesis i18n contract failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('About/Thesis native PHI OS i18n contract passed.');
