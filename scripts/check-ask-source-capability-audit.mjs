import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {structuredSourceCapability} from '../functions/_lib/structured-source-capability.js';
import {canAskStructuredObject} from '../assets/js/knowledge/structured-ask-availability.js';
const root = new URL('../', import.meta.url);
const paths = ['book-1/book-1-mechanism-registry-v1.json','book-2/book-2-runtime-pattern-registry-v1.json','book-3/book-3-maintenance-signal-registry-v1.json','book-4/book-4-expansion-mode-registry-v1.json'];
const keys = ['objects','patterns','entries','objects'];
const env = {ASSETS:{async fetch(request) {
  try {return new Response(await readFile(new URL('.'+new URL(request.url).pathname,root)),{headers:{'content-type':'application/json'}});} catch {return new Response(null,{status:404});}
}}};
let checks=0, denied=0, available=0;
for (const [index,path] of paths.entries()) {
  const data=JSON.parse(await readFile(new URL('content/knowledge/structured/'+path,root),'utf8'));
  for (const object of data[keys[index]]) for(const locale of ['en','zh-Hans']) {
    const result=await structuredSourceCapability(env,'CONCEPT:'+object.objectId.toLowerCase(),locale);
    const expected=index===0||index===3;
    assert.equal(result.available,expected,`${object.objectId} ${locale}`);
    assert.equal(canAskStructuredObject(object,data.details?.[object.objectId],locale),expected,`UI/backend parity ${object.objectId} ${locale}`);
    expected?available++:denied++;checks+=2;
    assert.equal(canAskStructuredObject({...object,projectionState:'WITHHELD'},data.details?.[object.objectId],locale),false);
    checks++;
  }
}
assert.equal((await structuredSourceCapability({},'CONCEPT:sk-b3-missing','en')).available,false);checks++;
assert.equal(canAskStructuredObject({status:'ACTIVE',title:'A title'},null,'en'),false);checks++;
assert.equal(await structuredSourceCapability(env,'ARTICLE:book5-civilizations-and-states','en'),null);checks++;
assert.equal(denied,80);assert.equal(available,62);
console.log(JSON.stringify({checks,unavailableLocaleCases:denied,availableLocaleCases:available,providerCalls:0}));
