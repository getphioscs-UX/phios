import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildProfileCustomerVisualProjection} from '../functions/profile/profile-customer-visual-projection.js';
import {hasRenderablePersonalEvidenceFigure,renderPersonalEvidenceFigure} from '../assets/customer-ui/js/visuals/profile-visual-mvp.js';
const absent=buildProfileCustomerVisualProjection({progressiveView:{signalCards:[],crossSource:{perspectives:[]}}}).figures.find(x=>x.pfig==='PFIG-004');
assert.equal(absent.state,'UNKNOWN');
assert.equal(hasRenderablePersonalEvidenceFigure({...absent,state:'READY'}),false);
assert.match(renderPersonalEvidenceFigure({...absent,state:'READY'}),/prf-pfig--empty/);
const ready=buildProfileCustomerVisualProjection({progressiveView:{signalCards:[]},confirmations:[{contextType:'WORK',confirmation:'HELPS_ME',note:'Working with a written plan',signalRef:'OBS-1'}]}).figures.find(x=>x.pfig==='PFIG-004');
assert.equal(ready.state,'READY');assert.equal(hasRenderablePersonalEvidenceFigure(ready),true);
assert.match(renderPersonalEvidenceFigure(ready),/Working with a written plan/);
const root='tools/review/personal-evidence-r1';
for(let i=1;i<=11;i++)for(const lang of ['en','zh-Hans'])for(const mode of ['results','dossier']){
 const html=fs.readFileSync(`${root}/CASE-${String(i).padStart(2,'0')}-${lang}-${mode}.html`,'utf8');
 const text=html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]*>/g,' ');
 assert.ok(!/\b[A-Z]+(?:_[A-Z0-9]+)+\b/.test(text),'No visible internal enums');
 assert.ok(!/financial:|career:|relationship:|PRF-SIG-|PRF-VIEW-/.test(text),'No visible governance references or raw target keys');
 assert.ok(!html.includes('<pre'),'Native objects are formatted as customer values');
 if(mode==='dossier'){
  assert.equal((html.match(/data-pe-static=/g)||[]).length,15);
  assert.ok(!/prf-pfig--empty|data-pe-sparse=/.test(html),'Masters do not acquire empty body pages');
 }
 if(lang==='zh-Hans')assert.ok(!/Where are these interests|The two source|Current Reality currently|Provider result supplied|Symbolic lens emphasizes|Your self-report|Imported external profile/.test(text));
}
const receipt=JSON.parse(fs.readFileSync('content/profile/successors/personal-evidence-r1/acceptance/prd-w11-human-review-receipt-v1.json'));
assert.equal(receipt.previousHumanDecision,'PRD-R1 HUMAN REJECT');assert.equal(receipt.w12Allowed,false);assert.equal(receipt.decision,null);
console.log('PRD_W11R_PRESENTATION = PASS (44 HTML outputs; fail-closed context; no empty dossier bodies; rejection retained; W12 closed)');
