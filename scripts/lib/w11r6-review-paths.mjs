import fs from 'node:fs';
const targeted='content/profile/successors/personal-evidence-r1/w11r6/targeted-r1/';
// The explicit human decision selects the current repair receipts; original audit snapshots stay frozen.
export const w11r6RepairAudit=process.env.W11R6_REPAIR_AUDIT||(fs.existsSync(targeted+'HUMAN-DECISION.json')?targeted:null);
export const w11r6ReviewUrl=process.env.W11R6_REPAIR_URL||(w11r6RepairAudit?'http://127.0.0.1:8807/w11r6/':'http://127.0.0.1:8806/w11r6/');
