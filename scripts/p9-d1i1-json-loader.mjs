import fs from 'node:fs';import {registerHooks} from 'node:module';
// Local QA compatibility only: Pages bundles JSON imports with esbuild.
registerHooks({load(url,context,next){if(url.endsWith('.json'))return {format:'module',source:'export default '+fs.readFileSync(new URL(url),'utf8')+';',shortCircuit:true};return next(url,context);}});
globalThis.fetch=()=>{throw Error('P9_D1I1_QA_NETWORK_FORBIDDEN');};
