import {registerHooks} from 'node:module';import fs from 'node:fs';import {pathToFileURL} from 'node:url';
const out='C:/phios/tools/review/integrated-closure-r25',rows=JSON.parse(fs.readFileSync(out+'/OVERLAP-CANDIDATES.json')).overlaps;
const replacements=new Map(rows.filter(r=>r.path.endsWith('.js')||r.path.endsWith('.mjs')).map(r=>[pathToFileURL('C:/phios/'+r.path).href,'C:/phios/'+r.threeWayFolder+'/combined-candidate.txt']));
const dependencies=JSON.parse(fs.readFileSync(out+'/REQUIRED-PR6-DEPENDENCIES.json')).dependencies;
for(const d of dependencies)replacements.set(pathToFileURL('C:/phios/'+d.path).href,'C:/phios/'+d.candidatePath);
registerHooks({load(url,context,next){if(replacements.has(url)){let source=fs.readFileSync(replacements.get(url),'utf8');if(url.endsWith('/scripts/check-commerce-stripe-r1.mjs'))source=source.replaceAll('docs/qa/commerce-stripe-r1','tools/review/integrated-closure-r25/commerce-qa');return{format:'module',source,shortCircuit:true};}return next(url,context);}});
