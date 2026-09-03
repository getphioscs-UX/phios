import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {localizeCrossPerspectiveClaims} from '../assets/customer-ui/js/locale.js';

const read=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const css=read('assets/customer-ui/surfaces/personal-reality.css');
const locale=read('assets/customer-ui/js/locale.js');
const assets=read('assets/customer-ui/js/assets.js');
const html=read('perspectives/personal/index.html');

// 1) Empty place input must never look confirmed. The unlayered component display rule must respect hidden.
assert.match(css,/\.cx-personal \.cx-place-confirmed\[hidden\][^{]*\{display:none!important\}/s,'target-place confirmation can override [hidden]');
assert.match(html,/data-cx-target-place-confirmed hidden/,'target-place confirmation no longer starts hidden');

// 2) Healthy visual assets must not show the fail-closed fallback just because a card styles direct child spans.
assert.match(css,/\.cx-personal \[data-cx-asset-fallback\]\[hidden\][^{]*\{display:none!important\}/s,'hidden asset fallback is not protected against unlayered display rules');
assert.match(assets,/fallback\.hidden=true/,'asset hydrator no longer hides fallback before resolution');
assert.match(assets,/node\.dataset\.cxAssetState='ready'/,'asset hydrator no longer records healthy resolution');

// 3) School-qualified / source-technical BaZi content remains in authority code but is not a customer-visible surface.
assert.match(css,/\.cx-personal \.cx-bazi-school-surface[\s\S]*?display:none!important/,'BaZi school-qualified surface remains customer-visible');
assert.match(css,/\.cx-specialist-product\[data-method="BZR"\] \.cx-ppr-r3-specialist-technical/,'BaZi technical slot is not customer-suppressed');
assert.match(css,/data-ppr-r3-nav-target="#bazi-section-technical"/,'BaZi technical navigation remains customer-visible');

// 4) Cross-perspective claims are dynamically projected into Chinese without mutating the governed English IR.
for(const token of ['COMMON','COMPLEMENTARY','TENSION','CONTEXT_DEPENDENT','OPEN','Operating posture','Direction','Environment','Identity','Expression','MutationObserver','.cx-cross-reading__claims article[data-support]']) {
  assert.ok(locale.includes(token),`dynamic cross-perspective localization missing ${token}`);
}
function fakeClaim(support,headline,narrative,methods='BZR · ECR'){
  const h3={textContent:headline,dataset:{}},p={textContent:narrative,dataset:{}},small={textContent:methods,dataset:{}};
  const article={dataset:{support},querySelector(sel){return sel==='h3'?h3:sel==='p'?p:sel==='small'?small:null;}};
  return {article,h3,p};
}
const samples=[
 ['CONTEXT_DEPENDENT','Context matters: Direction','EN narrative','需要结合情境：方向'],
 ['COMPLEMENTARY','Complementary perspectives: Environment','EN narrative','互补视角：环境'],
 ['COMMON','Shared emphasis: Identity','EN narrative','共同强调：身份'],
 ['TENSION','Tension remains visible: Expression','EN narrative','保留张力：表达'],
 ['OPEN','Open perspective: Timing','EN narrative','开放观察：时间']
].map(x=>[fakeClaim(x[0],x[1],x[2]),x[3]]);
const scope={querySelectorAll(){return samples.map(([x])=>x.article);}};
localizeCrossPerspectiveClaims(scope,'zh-Hans');
for(const [sample,expected] of samples){
  assert.equal(sample.h3.textContent,expected);
  assert.notEqual(sample.p.textContent,'EN narrative');
}
localizeCrossPerspectiveClaims(scope,'en');
for(const [sample] of samples){
  assert.equal(sample.p.textContent,'EN narrative');
  assert.match(sample.h3.textContent,/:/);
}

// Freeze safety: customer hotfix must not rewrite shared product semantics or the frozen /perspectives client owner.
assert.equal(sha('assets/customer-ui/js/personal-products/personal-product-renderers.js'),'9d64e9db9cff8215ecdb743f3b1d6e030f792125ddb543faf1a6133fc7c411d2');
assert.equal(sha('assets/customer-ui/js/surfaces/personal-reality.js'),'4b097f84b10f0c4c9161f5f62ce9cd19da052fffacf3e9ae2bce8c09f201a7a6');
assert.equal(sha('perspectives/personal/index.html'),'e7704206cfa18a4996d97424f02f7ce7ff3eefe46def33e5dbcc8cc82d8eef94');

console.log('✓ /perspectives customer-surface hotfix passed: empty place state stays hidden, healthy visual fallbacks stay hidden, BaZi school/technical material is customer-suppressed, and cross-perspective claims localize EN↔ZH dynamically.');
console.log('✓ Frozen PPR renderer, Personal Reality client owner and route HTML remain byte-identical to e7a0e05-aligned baseline.');
