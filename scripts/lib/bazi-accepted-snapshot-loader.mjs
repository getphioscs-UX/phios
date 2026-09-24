import fs from 'node:fs';
import path from 'node:path';
import {sha256Stable} from '../../functions/interpretation-runtime/mir7-utils.js';
import {COMPOSITION_VERSION,VERIFIER_VERSION,EDITORIAL_VERSION} from '../../functions/personal-reading/narrative/bazi-editorial-contract.js';
import {QUALITY_VERSION} from '../../functions/personal-reading/narrative/bazi-editorial-quality.js';

const LOCALES=new Set(['en','zh-Hans']);
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));

/**
 * Canonical accepted snapshots are repository-governed editorial artifacts.
 * QA scratch files may be useful evidence, but they are not acceptance authority.
 */
export async function loadAcceptedBaziSnapshots({
 snapshotDir='docs/acceptance/bazi-paid-report/snapshots',
 acceptancePath='config/reports/bazi-editorial-quality-acceptance.json'
}={}){
 const acceptance=readJson(acceptancePath);
 const snapshots={en:{},'zh-Hans':{}},records=[];
 if(!fs.existsSync(snapshotDir))return {acceptance,snapshots,records};
 const files=fs.readdirSync(snapshotDir).filter(name=>/^accepted-.*\.json$/i.test(name)).sort();
 for(const name of files){
  const file=path.join(snapshotDir,name),snapshot=readJson(file);
  if(!LOCALES.has(snapshot.locale)||!snapshot.sectionKey)throw Error('BAZI_ACCEPTED_SNAPSHOT_IDENTITY_INVALID:'+name);
  const {snapshotDigest,...seed}=snapshot;
  if(snapshotDigest!==await sha256Stable(seed))throw Error('BAZI_ACCEPTED_SNAPSHOT_DIGEST_INVALID:'+name);
  if(snapshot.compositionVersion!==COMPOSITION_VERSION||snapshot.verifierVersion!==VERIFIER_VERSION||snapshot.editorialVersion!==EDITORIAL_VERSION)throw Error('BAZI_ACCEPTED_SNAPSHOT_VERSION_DRIFT:'+name);
  if(snapshot.editorialQualityVersion!==QUALITY_VERSION)throw Error('BAZI_ACCEPTED_SNAPSHOT_QUALITY_VERSION_DRIFT:'+name);
  const review=(acceptance.humanReviews||[]).find(r=>r.profileId==='BASELINE_NOW'&&r.locale===snapshot.locale&&r.sectionKey===snapshot.sectionKey&&r.decision==='ACCEPT'&&r.reviewer&&r.reviewedAt&&r.snapshotDigest===snapshot.snapshotDigest&&r.briefDigest===snapshot.sectionNarrativeBriefDigest);
  if(!review)continue;
  if(snapshots[snapshot.locale][snapshot.sectionKey])throw Error('BAZI_ACCEPTED_SNAPSHOT_DUPLICATE:'+snapshot.locale+':'+snapshot.sectionKey);
  snapshots[snapshot.locale][snapshot.sectionKey]=snapshot;
  records.push({profileId:'BASELINE_NOW',locale:snapshot.locale,sectionKey:snapshot.sectionKey,snapshotDigest:snapshot.snapshotDigest,briefDigest:snapshot.sectionNarrativeBriefDigest,file});
 }
 return {acceptance,snapshots,records};
}
