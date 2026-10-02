import fs from 'node:fs';
import {build} from 'esbuild';
const files=['assets/css/tokens.css',...['visual-report.css','report-publication.css','ziwei-report-publication.css','ziwei-report-publication-r2.css','ziwei-print-shell-v2.css','ziwei-navigation-finalization.css'].map(f=>'assets/customer-ui/surfaces/'+f)];
const css=files.map(p=>fs.readFileSync(p,'utf8')).join('\n');
const result=await build({stdin:{contents:"export {fitPublicationForPrint,settlePublicationAssets} from './assets/customer-ui/js/personal-products/publication-report-pages.js';",resolveDir:process.cwd()},bundle:true,write:false,format:'iife',globalName:'methodReportFit',platform:'browser',minify:true});
fs.mkdirSync('workers/method-report-renderer',{recursive:true});
fs.writeFileSync('workers/method-report-renderer/render-assets.generated.js',`// Generated from the existing report renderer and CSS; no new visual mappings.\nexport const css=${JSON.stringify(css)};\nexport const fitCode=${JSON.stringify(result.outputFiles[0].text)};\n`);
console.log('Built private verifier assets from existing frozen visual system.');
