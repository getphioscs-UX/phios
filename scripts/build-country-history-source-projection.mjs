import fs from 'node:fs';import {createHash} from 'node:crypto';
const source='content/civilization-atlas/evidence/country-history-source-bindings-r1.json',target='assets/js/pages/civilization-atlas/world-history-sources.generated.js',raw=fs.readFileSync(source),json=JSON.parse(raw);
const output='// Generated read-only projection of '+source+'. Not another canonical Registry.\nexport const COUNTRY_HISTORY_SOURCE_BINDINGS='+JSON.stringify(json)+';\nexport const COUNTRY_HISTORY_SOURCE_SHA256="'+createHash('sha256').update(raw).digest('hex')+'";\n';
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==output)throw Error('HISTORY_PROJECTION_DRIFT');console.log('PASS country history projection exact source binding');}else fs.writeFileSync(target,output);
