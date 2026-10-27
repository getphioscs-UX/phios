import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';

const targets=[
 ['perspectives/tarot/index.html','/perspectives/tarot/',[3]],
 ['perspectives/iching/consult/index.html','/perspectives/iching/consult/',[4]],
 ['reality/index.html','/reality/',[5]],
 ['perspectives/profile/index.html','/perspectives/profile/',[3,2]],
 ['account/index.html','/account/',[2]],
 ['about/reality-navigation/index.html','/about/reality-navigation/',[5]],
 ['professional/financial/index.html','/professional/financial/',[]],
 ['index.html','/',[]],
 ['perspectives/personal/index.html','/perspectives/personal/',[]],
 ['perspectives/index.html','/perspectives/',[]],
 ['about/founder/index.html','/about/founder/',[]]
];
let total=0,figuresPreserved=0,heroPreserved=0;
for(let n=0;n<targets.length;n++){
 const [file,path,expected]=targets[n];
 const markup=readFileSync(file,'utf8');
 const {document,window}=parseHTML(markup);
 const before=[...document.querySelectorAll('figure')].length;
 const originalImages=[...document.querySelectorAll('figure img')].map(img=>img.getAttribute('data-approved-visual')||img.getAttribute('data-px2-asset')||img.getAttribute('src')||'').sort();
 const originalHeros=[...document.querySelectorAll('[data-vr2-role="HERO"] img')].map(x=>x.getAttribute('data-approved-visual')||x.getAttribute('src')).sort();
 globalThis.window=window;globalThis.document=document;globalThis.location={pathname:path};
 globalThis.MutationObserver=window.MutationObserver;
 await import('../assets/js/figure-story-deck.js?route='+n);
 if(document.readyState==='loading')document.dispatchEvent(new window.Event('DOMContentLoaded'));
 const decks=[...document.querySelectorAll('[data-figure-deck="r1"]')];
 assert.deepEqual(decks.map(x=>x.querySelectorAll('.phios-figure-deck__slide').length),expected,'Deck count for '+path);
 assert.equal(document.querySelectorAll('figure').length,before,'Lost figure on '+path);
 assert.deepEqual([...document.querySelectorAll('figure img')].map(img=>img.getAttribute('data-approved-visual')||img.getAttribute('data-px2-asset')||img.getAttribute('src')||'').sort(),originalImages,'Figure identity changed on '+path);
 assert.deepEqual([...document.querySelectorAll('[data-vr2-role="HERO"] img')].map(x=>x.getAttribute('data-approved-visual')||x.getAttribute('src')).sort(),originalHeros,'Hero identity moved or changed on '+path);
 figuresPreserved+=before;heroPreserved+=originalHeros.length;
 for(const deck of decks){
  const slides=[...deck.querySelectorAll('.phios-figure-deck__slide')];
  assert.equal(slides.filter(x=>!x.hidden).length,1,'One visible slide required');
  assert.equal(deck.querySelectorAll('[data-figure-go]').length,slides.length,'Dot count mismatch');
  const second=deck.querySelector('[data-figure-go="1"]');
  second.dispatchEvent(new window.Event('click',{bubbles:true}));
  assert.equal(slides[1].hidden,false,'Second slide did not become visible');
  assert.equal(slides[0].hidden,true,'First slide remained visible');
  assert.equal(slides[0].inert,true,'Inactive slide remains focusable');
  assert.equal(deck.querySelector('.phios-figure-deck__counter').textContent,'2 / '+slides.length);
 }
 if(path==='/perspectives/tarot/'){
  const deck=decks[0],results=document.querySelector('[data-symbolic-results]');
  assert.equal(results.nextElementSibling,deck,'Tarot explainer must follow results rather than block question or reading');
 }
 if(path==='/professional/financial/'){
  assert.equal(document.querySelectorAll('.phios-figure-context-guide').length,7,'Each financial stage must keep its own figure');
 }
 if(path==='/'){
  assert.equal(document.querySelectorAll('.phios-figure-editorial-split').length,3,'Home must compact exactly 3 selected editorial figures');
 }
 if(path==='/about/founder/'){
  assert.equal(document.querySelectorAll('.phios-figure-compact').length,6,'Founder mechanism figures must compact without moving portrait');
 }
 total++;
 console.log('PASS '+path+' figures='+before+' decks='+decks.length);
}
const style=readFileSync('assets/css/figure-story-deck.css','utf8');
const global=readFileSync('assets/js/global-visual-r2.js','utf8');
assert.match(global,/import\('\.\/figure-story-deck\.js'\)/);
for(const file of ['about/founder/index.html','about/reality-navigation/index.html'])
 assert.match(readFileSync(file,'utf8'),/assets\/js\/figure-story-deck\.js/);
assert.match(style,/object-fit:contain/,'Do not crop original figures');
assert.match(style,/prefers-reduced-motion/,'Respect reduced motion');
assert.match(readFileSync('assets/js/figure-story-deck.js','utf8'),/event\.key==='ArrowRight'/,'Keyboard controls must exist');
console.log('Figure Story Deck R1: '+total+'/11 routes PASS, '+figuresPreserved+' figures retained, '+heroPreserved+' Hero images retained; DOM/interaction smoke, NOT live browser QA.');
