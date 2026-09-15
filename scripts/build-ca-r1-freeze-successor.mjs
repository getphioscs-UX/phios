import fs from 'node:fs';
import {freezeArtifacts} from './build-b14-sks-freeze.mjs';
import {sha,successorPath} from './lib/ca-r1-freeze-successor.mjs';
const artifacts=freezeArtifacts();
const changes=Object.entries(artifacts).flatMap(([path,data])=>{const old=JSON.parse(fs.readFileSync(path));return Object.entries(data.digests||data.runtimeDigests||{}).filter(([p,hash])=>(old.digests||old.runtimeDigests||{})[p]!==hash).map(([p,hash])=>({artifact:path,path:p,predecessorSha256:(old.digests||old.runtimeDigests||{})[p]||null,successorSha256:hash}));});
fs.writeFileSync(successorPath,JSON.stringify({baselineCommit:'d60e1de0a4271c7c801eecc61c3f4d8784b03653',status:'LOCAL_CANDIDATE_RUNTIME_SUCCESSOR_NOT_PRODUCTION_FREEZE',productionActivation:false,humanApproval:false,predecessorDigests:Object.fromEntries(Object.keys(artifacts).map(p=>[p,sha(p)])),changes,evidence:['scripts/check-ca-r1-context-search.mjs','scripts/check-ca-r1-browser.mjs','scripts/check-ca-r1-candidate-preview.mjs'],artifacts},null,2)+'\n');
