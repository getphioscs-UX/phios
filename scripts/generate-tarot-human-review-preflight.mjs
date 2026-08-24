import fs from 'node:fs';
import crypto from 'node:crypto';
import {runHumanReviewPreflight} from './lib/tarot/human-review-v2.mjs';
const campaignPath='content/production/symbolic-method/human-review/tarot-human-review-campaign-v2.json';
const resultsPath='content/production/symbolic-method/human-review/tarot-human-review-results-v2.json';
const preflightPath='content/production/symbolic-method/human-review/tarot-human-review-preflight-v1.json';
const packetPath='content/production/symbolic-method/human-review/tarot-human-review-packet-v2.md';
const campaign=JSON.parse(fs.readFileSync(campaignPath,'utf8'));
const snapshots=await runHumanReviewPreflight(campaign);
const preflight={schemaVersion:'PHI-OS-TAROT-HUMAN-REVIEW-PREFLIGHT-v1.0.0',phase:'TPA-J',work:'TPA-W39-W41',baselineCommit:campaign.baselineCommit,status:'MACHINE_PREFLIGHT_24_OF_24_READY_FOR_HUMAN_REVIEW_NOT_HUMAN_ACCEPTANCE',caseCount:snapshots.length,snapshots};
fs.writeFileSync(preflightPath,JSON.stringify(preflight,null,2)+'\n');
const results=JSON.parse(fs.readFileSync(resultsPath,'utf8'));results.machinePreflightPassed=snapshots.length;for(const row of results.sessions){const snap=snapshots.find(x=>x.sessionId===row.sessionId);row.machinePreflightPassed=Boolean(snap);row.machineEvidenceDigest=snap?crypto.createHash('sha256').update(JSON.stringify(snap)).digest('hex'):null;}fs.writeFileSync(resultsPath,JSON.stringify(results,null,2)+'\n');
const lines=['# PHI OS Tarot — 24-case Human Review Packet v2','','**Machine preflight is not human acceptance.** Review every case against `tarot-human-review-rubric-v2.json`, then record a human decision in `tarot-human-review-results-v2.json`.','',`Baseline: ${campaign.baselineCommit}`,'','| Case | Group | Spread | Input | Question | Cards from preflight | RCC | Uncertainty | Human decision |','|---|---|---|---|---|---|---|---|---|'];
for(const s of snapshots){lines.push(`| ${s.sessionId} | ${s.group} | ${s.scenario} | ${s.inputMode} | ${s.question.replaceAll('|','\\|')} | ${s.cards.map(x=>x.cardId).join(', ')} | +${s.rcc.supporting} / -${s.rcc.contradictory} / ?${s.rcc.unknown} / obs${s.rcc.observation} | ${s.uncertainty.join(', ')||'—'} | PENDING |`);}
lines.push('','## Mandatory human checks','','For every case confirm: correct method evidence; visible source/provenance; no source blending; visual observation ≠ meaning; no over-certainty; no hidden-state certainty; no guaranteed prediction; no diagnosis; no professional directive; RCC visible; unknown preserved; Reality may contradict the lens; Agency remains with the user; AI does not choose the symbolic outcome; language is natural; output remains useful.','','A case counts only when `humanReviewed=true`, every critical criterion is `true`, and `decision="ACCEPTED"`. All 24 cases are required for TPA-W42.');
fs.writeFileSync(packetPath,lines.join('\n')+'\n');
console.log(`Generated ${snapshots.length}/24 Tarot human-review machine preflight snapshots.`);
