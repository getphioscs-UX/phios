import fs from 'node:fs';import assert from 'node:assert/strict';
const paths=JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/runtime-authority-bundle-sources-v1.json'));
const data=Object.fromEntries(paths.map(path=>[path,JSON.parse(fs.readFileSync(path))]));
const output='// Generated from registered JSON authorities; never edit by hand.\nimport {deepFreeze} from "../interpretation-runtime/mir7-utils.js";\nexport const ECR_V41_AUTHORITIES=deepFreeze('+JSON.stringify(data)+');\n';
const target='functions/embodied-configuration/ecr-v41-authorities.generated.js';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),output);else fs.writeFileSync(target,output);
