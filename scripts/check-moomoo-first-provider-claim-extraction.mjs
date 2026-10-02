import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {deriveHistoryKlineClaim,buildFirstProviderClaims} from './lib/civilization-atlas/moomoo-first-provider-claim-extraction-v1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const text=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const ok=(v,c)=>{if(!v)throw new Error('MOOMOO_PROVIDER_CLAIMS:'+c);};
const c=read('content/civilization-atlas/reconfiguration/moomoo-first-live-provider-claim-contract-v1.json');
const intake=read('content/civilization-atlas/reconfiguration/moomoo-provider-claim-intake-v1.json');
const validated=read('content/civilization-atlas/reconfiguration/moomoo-provider-validated-claims-v1.json');
const cwa=read('content/civilization-atlas/reconfiguration/moomoo-provider-cwa-ready-claims-v1.json');
const status=read('content/civilization-atlas/reconfiguration/moomoo-first-live-provider-claim-status-v1.json');
ok(c.status==='EXECUTABLE_FROM_REAL_PROVIDER_SNAPSHOTS','CONTRACT');
ok(c.boundaries?.trendInterpretation===false&&c.boundaries?.w8ePromotion===false,'BOUNDARY');
ok((validated.records||[]).every(x=>x.sourceLocator?.type==='PROVIDER_SERIES_WINDOW'),'LOCATOR');
ok((validated.records||[]).every(x=>x.claimState==='SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED'),'CLAIM_STATE');
ok((cwa.records||[]).every(x=>x.admissionState==='NOT_EVALUATED_BY_CWA'),'CWA_STATE');
ok(status.completed?.cwaEvidence===0&&status.completed?.w8ePromotions===0,'AUTHORITY_LEAK');
const fxSnap={snapshotId:'S1',providerId:'MOOMOO_OPENAPI',capability:'HISTORY_KLINE',responseDigest:'a'.repeat(64),records:[
 {fieldPath:'data.kline_list[].close',instrument:'US.SPY',timestamp:'2026-01-02T00:00:00Z',value:100,unit:'price'},
 {fieldPath:'data.kline_list[].close',instrument:'US.SPY',timestamp:'2026-10-01T00:00:00Z',value:120,unit:'price'}
]};
const fxSource={sourceId:'MOOMOO-HISTORY_KLINE-US.SPY-'+('a'.repeat(12)),providerSnapshotId:'S1',dossierId:'DOSSIER-US'};
const claim=deriveHistoryKlineClaim({snapshot:fxSnap,source:fxSource});
ok(claim.claimText.includes('2 close observations'),'FIXTURE_COUNT');
ok(claim.claimText.includes('first observed close 100')&&claim.claimText.includes('last observed close 120'),'FIXTURE_VALUES');
ok(!/trend|increased|decreased|pressure|constraint|reconfiguration|continuity/i.test(claim.claimText),'FIXTURE_NO_INTERPRETATION');
const built=buildFirstProviderClaims({snapshots:{records:[fxSnap]},sources:{records:[fxSource]}});ok(built.claims.length===1&&built.skipped.length===0,'FIXTURE_BUILD');
const pkg=text('package.json');ok(pkg.includes('"build:moomoo:provider-claims"')&&pkg.includes('"check:moomoo:provider-claims"'),'PACKAGE');
console.log('PASS Moomoo provider claims: only source-bounded descriptive HISTORY_KLINE claims are created; CWA/W8E authority remains closed.');
