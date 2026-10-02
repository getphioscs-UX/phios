import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildBaziCustomerPublication} from '../functions/personal-reading/bazi-customer-publication.js';
import {renderPublicationReport} from '../assets/customer-ui/js/personal-products/publication-report-pages.js';

const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const baseline=JSON.parse(fs.readFileSync('docs/acceptance/bazi-paid-report/composition-r1/baseline.json','utf8'));
for(const [path,digest] of Object.entries(baseline.acceptedCopyDigests)){
 assert.equal(createHash('sha256').update(fs.readFileSync(path)).digest('hex'),digest,'Accepted BaZi copy changed: '+path);
}
for(const locale of ['zh-Hans','en']){
 const report=await buildBaziCustomerPublication({reading:source.reading,locale,temporalSnapshot:source.temporalSnapshot,full:true,compositionR1:true});
 assert.equal(report.totalPages,38,locale+' physical page count drift');
 assert.equal(report.pages.filter(p=>p.pageFamily==='SECTION_OPENER_PAGE').length,10,locale+' Section Master count drift');
 assert(report.pages.every(p=>p.visualBinding?.backgroundMode==='METHOD_PRINT_SHELL_V2'),locale+' Print Shell visual binding missing');
 assert(report.pages.filter(p=>p.pageFamily==='SECTION_OPENER_PAGE').every(p=>p.visualBinding?.url&&p.visualBinding?.required),locale+' Section Master asset missing');
 assert(report.pages.filter(p=>p.pageFamily!=='SECTION_OPENER_PAGE').every(p=>p.visualBinding?.bodyUrl),locale+' BODY background missing');
 const html=renderPublicationReport(report);
 assert(html.includes('data-method="BZR"'));
 assert(html.includes('data-print-shell="PHI-OS-REPORT-PRINT-SHELL-V2"'));
 assert(!html.includes('undefined'));
}
const shared=fs.readFileSync('assets/customer-ui/surfaces/report-print-shell-v2.css','utf8');
const skin=fs.readFileSync('assets/customer-ui/surfaces/bazi-print-shell-v2.css','utf8');
assert(shared.includes('210mm!important')&&shared.includes('297mm!important'));
assert(!shared.includes('data-method="BZR"')&&!shared.includes('data-method="ZWR"'),'Shared shell leaked method identity');
assert(skin.includes('data-method="BZR"'),'BaZi skin must remain method-specific');
const s07='[data-section="S07_HEALTH"][data-page-family="SECTION_OPENER_PAGE"]';
for(const selector of ['.pub-opener-heading','.pub-narrative','.pub-master-insights'])assert(skin.includes(s07+' '+selector),'S07 right-side safe-zone missing: '+selector);
assert(skin.includes('left:auto!important;right:17mm!important;width:92mm!important'),'S07 copy must use right-side 92mm safe zone');
assert(skin.includes(s07+' .pub-decoration:after'),'S07 right-side readability scrim missing');
console.log('PASS BaZi Print Shell V2 migration contract: accepted copy digests unchanged, 38/38 pages, 10 masters, S07 right-side safe-zone, shared A4 shell bound.');
