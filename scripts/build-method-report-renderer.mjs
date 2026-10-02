import fs from 'node:fs';
import {build} from 'esbuild';
const files=['assets/customer-ui/surfaces/report-print-shell-v2.css','assets/customer-ui/surfaces/ziwei-print-shell-v2.css','assets/customer-ui/surfaces/ziwei-navigation-finalization.css'];
const css=files.map(p=>fs.readFileSync(p,'utf8')).join('\n');
const result=await build({stdin:{contents:"export {fitPublicationForPrint,settlePublicationAssets} from './assets/customer-ui/js/personal-products/publication-report-pages.js';",resolveDir:process.cwd()},bundle:true,write:false,format:'iife',globalName:'methodReportFit',platform:'browser',minify:true});
fs.mkdirSync('workers/method-report-renderer',{recursive:true});
fs.writeFileSync('workers/method-report-renderer/render-assets.generated.js',`// Generated from the existing report renderer and CSS; no new visual mappings.\nexport const css=${JSON.stringify(css)};\nexport const fitCode=${JSON.stringify(result.outputFiles[0].text)};\n`);
console.log('Built private Zi Wei verifier assets from shared Print Shell V2 + Zi Wei skin.');
