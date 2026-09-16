import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {renderBookPublicSamples} from '../assets/js/knowledge/book-public-samples.js';
const r=JSON.parse(fs.readFileSync('content/web-production/registries/book-public-samples-v1.json'));
assert.equal(r.createsCheckout,false);assert.equal(r.createsCanonicalDefinitions,false);
assert.equal(r.books.reduce((n,b)=>n+b.previewPages.length,0),173);
assert.equal(r.books.reduce((n,b)=>n+b.figures.length,0),49);
assert.ok(r.books[3].figures.some(f=>f.number==='11F'&&f.canonicalFigureId===null));
for(const b of r.books)for(const locale of ['en','zh-Hans']){
 const {document,window}=parseHTML('<section></section>');const host=document.querySelector('section');
 // linkedom exposes select.value without a setter; model the browser property.
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.getAttribute('data-test-value')||'0'},set(v){this.setAttribute('data-test-value',v)}});
 renderBookPublicSamples(host,b,locale);assert.ok(host.querySelector('img').src.endsWith(`${b.bookId}-3d-hardcover.webp`));
 assert.equal(host.querySelectorAll('option').length,b.previewPages.length);assert.equal(host.querySelectorAll('details').length,b.figures.length);
 if(b.previewPages.length){const buttons=host.querySelectorAll('button');assert.equal(buttons[0].disabled,true);buttons[1].onclick();assert.equal(host.querySelector('select').value,'1');const image=host.querySelectorAll('img')[1];image.dispatchEvent(new window.Event('error'));assert.equal(image.hidden,true);assert.ok(host.querySelector('[role=status]').textContent);buttons[0].onclick();assert.equal(image.hidden,false);}
 if(b.figures.length){const details=host.querySelector('details');details.open=true;details.dispatchEvent(new window.Event('toggle'));assert.equal(details.querySelector('img').src,b.figures[0].url);}
 assert.equal(host.querySelectorAll('a[href*="checkout"]').length,0);
}
console.log('PASS: 173 free sample pages, 49 part figures, seven 3D covers; bilingual navigation/failure recovery; no checkout or invented figure definition.');
