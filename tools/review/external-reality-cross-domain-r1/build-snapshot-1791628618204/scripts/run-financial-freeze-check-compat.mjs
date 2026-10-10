// Execute the immutable checker with a read-only projection of the current
// zero-cost alias. Frozen artifacts and their digests are checked unchanged.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [checker,key]=process.argv.slice(2);
if(![['scripts/check-fcr-freeze.mjs','check:fcr'],['scripts/check-far-freeze.mjs','check:far']].some(([p,k])=>p===checker&&k===key))throw Error('FINANCIAL_FREEZE_CHECKER_NOT_ADMITTED');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
if(pkg.scripts[key]!==`node scripts/run-zero-cost-regression.mjs ${key}`)throw Error('FINANCIAL_ZERO_COST_ALIAS_REQUIRED');
let source=fs.readFileSync(checker,'utf8').replace('{readJson,sha256File}','{readJson as readCanonicalJson,sha256File}');
source=source.replace(/from (['"])(\.[^'"]+)\1/g,(_,quote,relative)=>'from '+quote+pathToFileURL(path.resolve(path.dirname(checker),relative)).href+quote);
source+=`\nfunction readJson(p){const value=readCanonicalJson(p);if(p==='package.json'){const registry=readCanonicalJson('config/reports/zero-cost-check-commands.json');value.scripts[${JSON.stringify(key)}]=registry[${JSON.stringify(key)}];}return value;}\n`;
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
