import assert from 'node:assert/strict';import fs from 'node:fs';
import {json,parseCsv,csvPath,evidenceDir,rowIdentity,sha} from './lib/r2-260-evidence.mjs';
const frozen=json(evidenceDir+'/r2-260-predecessor-freeze-v1.json'),report=json(evidenceDir+'/r2-260-display-browser-verification-v2.json');
const [, ...rows]=parseCsv(fs.readFileSync(csvPath,'utf8'));
assert.equal(rows.length,260);assert.equal(report.rows.length,260);assert.equal(new Set(rows.map(r=>r[2])).size,260);
const allowed=new Set(['DISPLAYED_ON_ACTIVE_SURFACE','DISPLAYED_CONDITIONALLY','BROWSER_ICON_ACTIVE','INTERACTIVE_FLOW_DISPLAYED','LEGACY_ROUTE_ONLY','RETIRED_SURFACE_REFERENCE','HISTORICAL_REGISTRY_ONLY','INTENTIONALLY_NON_RENDERED_ASSET','CONTEXTUAL_VARIANT_NOT_REQUIRED','EXTERNAL_FLOW_BLOCKED']);
for(let i=0;i<260;i++){
 const row=rows[i],result=report.rows[i];assert.equal(Number(row[0]),i+1);assert.equal(rowIdentity(row),frozen.rowHashes[i].identitySha256,'Frozen identity '+(i+1));assert.equal(result.objectKey,row[2]);assert.equal(result.status,row[6]);assert.ok(allowed.has(result.status),result.status);assert.ok(result.reason&&result.traceFile);
 if(result.status.includes('DISPLAYED')||result.status==='BROWSER_ICON_ACTIVE'){
  const variants=new Set();for(const e of result.observations){assert.equal(e.objectKey,row[2]);assert.ok(!/\/docs\/|\/tools\/review\/|\/audit\//i.test(e.route),'Gallery cannot prove customer display');assert.ok(e.resolvedUrl);assert.equal(decodeURIComponent(new URL(e.resolvedUrl).pathname).slice(1),row[2]);
   if(result.status==='BROWSER_ICON_ACTIVE'){assert.equal(e.httpStatus,200);assert.ok(e.resourceBytes>0);assert.equal(e.evidenceClass,'BROWSER_ICON');}else{assert.ok(e.attached&&e.visible&&e.decoded);assert.ok(e.width>0&&e.height>0&&e.naturalWidth>0&&e.naturalHeight>0);if(e.evidenceClass==='CUSTOMER_CSS_BACKGROUND')assert.ok(e.resourceLoaded);}
   variants.add(e.viewport+':'+e.locale);
  }assert.deepEqual([...variants].sort(),['1440:en','1440:zh-Hans','390:en','390:zh-Hans']);
 }else{assert.equal(result.observations.length,0);assert.ok(result.dispositionEvidence?.length);if(result.status==='EXTERNAL_FLOW_BLOCKED')assert.ok(result.blocker?.dependency&&result.blocker?.requiredResolution);}
}
for(const source of report.sourceDigests)assert.equal(sha(fs.readFileSync(source.path)),source.sha256,'Stale evidence source '+source.path);
assert.equal(report.rows.filter(r=>r.objectKey.includes('/tarot/')).length,79);
assert.equal(report.rows.filter(r=>r.objectKey.includes('/phi-cards/')).length,48);
assert.ok(fs.readFileSync(csvPath.replace('.csv','.html'),'utf8').includes('r2-260-display-browser-verification-v2.json'));
console.log('PASS: all original 260 identities preserved; terminal dispositions, customer evidence and 4 viewport/locale combinations validated.');
console.log(JSON.stringify(report.afterCounts));
