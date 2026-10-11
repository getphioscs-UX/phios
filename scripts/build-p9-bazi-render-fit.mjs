import fs from 'node:fs';import crypto from 'node:crypto';import {build} from 'esbuild';
// Package the existing accepted topology/fit owner for the production browser.
// No duplicated measurement logic and no dependency on a public Functions URL.
const result=await build({entryPoints:['functions/personal-reading/publication-fit/bazi-publication-fit-gate.js'],bundle:true,write:false,format:'iife',globalName:'P9BaziPublicationFit',platform:'browser',target:'es2022',metafile:true,minify:true});
const dependencies=Object.fromEntries(Object.keys(result.metafile.inputs).sort().map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
fs.writeFileSync('workers/method-report-renderer/bazi-production-fit.generated.js','// Deterministic browser bundle of the accepted existing fit owner.\nexport const P9_BAZI_FIT_DEPENDENCIES='+JSON.stringify(dependencies)+';\nexport const P9_BAZI_FIT_CODE='+JSON.stringify(result.outputFiles[0].text)+';\n');
console.log(JSON.stringify({status:'PASS_LOCAL',sourceDependencies:Object.keys(dependencies).length,bundleBytes:result.outputFiles[0].contents.length,providerCalls:0}));
