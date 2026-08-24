import fs from 'node:fs';
const htmlPath='personal-runtime.html';
const pkgPath='package.json';
if(!fs.existsSync(htmlPath))throw new Error('PRX_STAGE13_PERSONAL_RUNTIME_HTML_MISSING');
let html=fs.readFileSync(htmlPath,'utf8');
const baselineMarkers=['data-wpr-production-surface="MCD7_PERSONAL_RUNTIME_RESULTS"','data-mcd7-method-selection','data-mcd7-results','/assets/js/pages/personal-runtime.js'];
for(const marker of baselineMarkers)if(!html.includes(marker))throw new Error(`PRX_STAGE13_BASELINE_MARKER_MISSING:${marker}`);
const css='<link rel="stylesheet" href="/assets/css/personal-runtime-product-activation.css">';
if(!html.includes(css))html=html.replace('</head>',`  ${css}\n</head>`);
const script='<script type="module" src="/assets/js/pages/personal-runtime-product-activation.js"></script>';
if(!html.includes(script)){const marker='<script type="module" src="/assets/js/pages/personal-runtime.js"></script>';if(!html.includes(marker))throw new Error('PRX_STAGE13_PERSONAL_RUNTIME_SCRIPT_MARKER_MISSING');html=html.replace(marker,`${marker}\n  ${script}`);}
fs.writeFileSync(htmlPath,html);
if(!fs.existsSync(pkgPath))throw new Error('PRX_STAGE13_PACKAGE_JSON_MISSING');
const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));pkg.scripts||={};
pkg.scripts['check:prx-stage13']='node scripts/check-prx-stage13-personal-runtime-product-activation.mjs';
pkg.scripts['check:personal-runtime-product']='npm run check:mcd-7 && npm run check:prx-stage13';
pkg.scripts['check:personal-runtime-product-current']='npm run check:personal-runtime-product && npm run check:wpr-personal-runtime';
fs.writeFileSync(pkgPath,`${JSON.stringify(pkg,null,2)}\n`);
console.log('✓ PRX Stage 13 personal-runtime product activation patch applied.');
