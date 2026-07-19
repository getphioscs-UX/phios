import fs from 'node:fs';
const required=['assets/js/modules/runtime-workspace.js','assets/css/runtime-workspace.css','reality-review.html','assets/js/review.js','thesis.html','assets/js/locales/en/thesis.js','assets/js/locales/zh-Hans/thesis.js'];
for(const file of required){if(!fs.existsSync(file))throw new Error(`Missing ${file}`)}
const nav=fs.readFileSync('reality-navigation.html','utf8');
if(!nav.includes('data-runtime-workspace'))throw new Error('Navigation is not mounted in Runtime Workspace.');
const review=fs.readFileSync('assets/js/review.js','utf8');
for(const token of ['reported_experience','readingOverwriteAllowed:false','automaticSelection:false'])if(!review.includes(token))throw new Error(`Review boundary missing: ${token}`);
console.log('Runtime Workspace and Review Customer View: passed.');
