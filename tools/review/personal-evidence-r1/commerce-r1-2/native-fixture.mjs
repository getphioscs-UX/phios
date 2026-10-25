import fs from 'node:fs';
import {TAROT_PRODUCTION_AUTHORITY_PATHS} from '../../../../functions/api/symbolic-method-execute.js';
import {ICHING_CURRENT_AUTHORITY_PATHS} from '../../../../functions/api/symbolic-method-execute-v4.js';
import {executeTarotProductRuntime} from '../../../../functions/tarot-product-runtime/tarot-product-runtime.js';
import {executeIChingProductRuntime} from '../../../../functions/iching-product-runtime/iching-product-runtime-v2.js';
export const nativeSourcePaths=[...Object.values(TAROT_PRODUCTION_AUTHORITY_PATHS),...Object.values(ICHING_CURRENT_AUTHORITY_PATHS)].map(p=>p.slice(1));
export async function nativeFixtures(){
 const load=paths=>Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,JSON.parse(fs.readFileSync('.'+p,'utf8'))]));
 const tarot=await executeTarotProductRuntime({question:'What should I observe before making a choice?',spreadId:'ONE_CARD',selectedCardIds:['RWS-MAJOR-00']},load(TAROT_PRODUCTION_AUTHORITY_PATHS));
 const iching=await executeIChingProductRuntime({question:'What conditions should I observe?',inputMode:'MANUAL_LINES',lines:[7,7,9,7,7,7],sessionId:'LOCAL-NATIVE-'+crypto.randomUUID(),timestamp:new Date().toISOString(),locale:'en'},load(ICHING_CURRENT_AUTHORITY_PATHS));
 return [{method:'TAROT',view:tarot.publicView,providerUsed:tarot.readingIr?.providerUsed??false},{method:'I_CHING',view:iching.publicView,providerUsed:iching.readingIr?.providerUsed??false}];
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/commerce-r1-2/native-fixture.mjs')){const fixtures=await nativeFixtures();console.log(fixtures.map(f=>({method:f.method,viewSchema:f.view.schemaVersion,interpretationKeys:Object.keys(f.view.hierarchy.find(x=>x.id==='SYMBOLIC_INTERPRETATION').data),providerUsed:f.providerUsed})));}
