import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export const PPR_PREENTRY_SUCCESSOR='content/professional/personal-reality/current/ppr-five-method-preentry-engineering-successor-v1.json';
const path='perspectives/personal/index.html';
const methods=['astrology','bazi','human-design','numerology','ziwei'];

export function validatePprPreentryDelta(next,current,previous){
 assert.equal(next.status,'ENGINEERING_SUCCESSOR_PENDING_HUMAN_REVIEW');
 assert.equal(next.changeType,'FIVE_ADDITIVE_PREENTRY_LINKS_AND_LOCALE_ADAPTER');
 assert.equal(next.path,path);
 for(const k of ['historicalFreezeRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(next[k],false);
 assert.equal(sha(previous),next.previousSha256,'Pre-entry predecessor drift');
 assert.equal(sha(current),next.currentSha256,'Unregistered pre-entry source drift');
 assert.equal(next.insertions.length,6);
 const found=[];let restored=current;
 for(const token of next.insertions){
  assert.equal(restored.split(token).length,2,'Each additive insertion must occur exactly once');
  const p=token.match(/^<p class="cx-meta" data-preentry-r5-link="([a-z-]+)"><a href="([^"]+)" data-cx-en="[^"]+" data-cx-zh="[^"]+">[^<>]+<\/a><\/p>$/);
  if(p){assert(methods.includes(p[1]));assert.equal(p[2],`/perspectives/personal/${p[1]}/`);found.push(p[1]);}
  else assert.equal(token,'<script type="module" src="/assets/customer-ui/js/surfaces/preentry-hub-links-r5.js"></script>');
  restored=restored.replace(token,'');
 }
 assert.deepEqual(found.sort(),methods);
 assert.equal(restored,previous,'Existing form, scripts, wording or host changed outside the six insertions');
 return next;
}

export function readPprPreentrySuccessor(owner){
 const next=JSON.parse(fs.readFileSync(PPR_PREENTRY_SUCCESSOR,'utf8'));
 assert.equal(next.previousSha256,owner.currentSha256);
 validatePprPreentryDelta(next,fs.readFileSync(path,'utf8'),fs.readFileSync(next.previousPath,'utf8'));
 for(const e of [...next.dependencies,...next.sourceEvidence])assert.equal(sha(fs.readFileSync(e.path)),e.sha256,'Pre-entry dependency/provenance drift: '+e.path);
 return next;
}
