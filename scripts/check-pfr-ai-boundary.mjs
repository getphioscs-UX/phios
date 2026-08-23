import assert from 'node:assert/strict';
import {preparePfrAiAssistance} from './lib/pfr/pfr-check-lib.mjs';
for(const task of ['SUMMARIZE_FACTS','SURFACE_MISSING_EVIDENCE','DRAFT_NEUTRAL_WORDING','COMPARE_EXISTING_SCENARIOS']){ const a=await preparePfrAiAssistance({assistanceId:`AI-${task}`,task,sourceReferences:['FDR:SNAP','FCR:RESULT'],requestedAt:'2026-08-23T08:00:00Z',outputCandidate:{neutral:true}}); assert.equal(a.authority,'AI_ASSISTANCE_ONLY'); assert.equal(a.professionalAuthorshipEffect,'NONE'); assert.equal(a.mayApprove,false); assert.equal(a.maySign,false); assert.equal(a.mayCreateRecommendation,false); }
await assert.rejects(()=>preparePfrAiAssistance({assistanceId:'BAD',task:'DRAFT_NEUTRAL_WORDING',sourceReferences:['FAR:FINDING'],requestedAt:'2026-08-23T08:00:00Z',recommendation:'Buy product X'}),/AI cannot create Professional Financial Judgment/);
await assert.rejects(()=>preparePfrAiAssistance({assistanceId:'BAD2',task:'APPROVE',sourceReferences:['HFP:C'],requestedAt:'2026-08-23T08:00:00Z'}),/outside the PFR assistance boundary/);
console.log('✓ PFR-W20 AI assistance boundary passed.');
