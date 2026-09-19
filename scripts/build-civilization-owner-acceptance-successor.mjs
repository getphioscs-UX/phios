import fs from 'node:fs';
import crypto from 'node:crypto';
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const predecessor='content/civilization-atlas/maintenance/book-v-civ-atlas-r1-m1-r2-binding-successor-v1.json';
const prior=JSON.parse(fs.readFileSync(predecessor));
const acceptance='content/civilization-atlas/visuals/civilization-visual-owner-acceptance-2026-09-19.json';
const helper='assets/js/pages/civilization-atlas/atlas-static-visual.js';
const result={status:'OWNER_ACCEPTED_LOCAL_BINDING_SUCCESSOR',predecessor,predecessorSha256:digest(predecessor),acceptance,acceptanceSha256:digest(acceptance),reason:'Explicit owner approval for the original 229 pending Atlas assets and newly uploaded 2026 reconfiguration; verified Maya and Byzantine heroes; selected-visual URL support and verified-delivery enforcement.',productionDeployed:false,historicalRegistriesChanged:false,changes:[{path:prior.bindingSuccessor,previousSha256:prior.bindingSuccessorSha256,successorSha256:digest(prior.bindingSuccessor)},{path:helper,previousSha256:prior.changes.find(c=>c.path===helper).successorSha256,successorSha256:digest(helper)}]};
fs.writeFileSync('content/civilization-atlas/maintenance/book-v-civ-atlas-owner-acceptance-successor-2026-09-19.json',JSON.stringify(result,null,2)+'\n');
