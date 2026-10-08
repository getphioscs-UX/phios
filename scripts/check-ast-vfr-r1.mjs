import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {parseHTML} from 'linkedom';
import {buildAstAdaptivePagePlan} from '../functions/ast-full-production/ast-adaptive-page-plan.js';
import {renderAstDiagram} from '../functions/ast-full-production/ast-diagram-renderer.js';
import {AST_CALL_PARTITIONS,buildAstThreeCallRequests,validateAstThreeCallResult} from '../functions/ast-full-production/ast-three-call-manuscript.js';
const root='content/professional/ast-full-production/',pub=root+'publication/';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),hash=x=>crypto.createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
const m=read(root+'manuscripts/accepted/ast-r5-tl-reference-01-zh-hans-v1.json'),receipt=read(root+'manuscripts/accepted/ast-r5-tl-reference-01-digest-receipt.json'),assets=read(pub+'ast-vfr-r1-visual-asset-registry.json'),ir=read(pub+'ast-vfr-r1-publication-ir.json'),plan=read(pub+'ast-vfr-r1-page-plan.json'),profile=read(pub+'ast-vfr-r1-publication-profile.json'),data=read(pub+'ast-vfr-r1-diagram-data.json'),pack=read(root+'reference/ast-fp-r5-tl-customer-authoring-pack-v1.json'),canonical=read(root+'reference/ast-fp-r5-tl-canonical-projection-v1.json');
assert.equal(m.status,'HUMAN_ACCEPTED');assert.equal(m.contentDigest,hash(m.content));assert.equal(m.contentDigest,receipt.contentDigest);assert.equal(m.contentDigest,'ce713a64c4a5203c1ad05270b732e63bbb3253df28a064332425297ce214c9ef');assert.equal(m.authoringPackDigest,pack.authoringPackDigest);assert.equal(m.canonicalProjectionDigest,canonical.projectionDigest);assert.equal(m.chapters.length,12);
const plain=[m.opening,...m.chapters.map(c=>c.text)].join('\n');assert(!/TODO|AST-R4A|sourceRefs|R4|R5|Authority Pack/.test(plain));
const frozen=m.content.replace(/\r\n/g,'\n');assert(frozen.includes(m.opening));assert(frozen.includes(m.metadata));assert(frozen.includes(m.title));
const parsed=frozen.split(/\nSECTION\n/).slice(1).map(x=>{const t=x.trim(),i=t.indexOf('\n');return {title:t.slice(0,i),text:t.slice(i).trim()};});assert.deepEqual(m.chapters,parsed);
assert.equal(assets.assets.length,19);
for(const a of assets.assets){const bytes=fs.readFileSync(a.path);assert(bytes.length>0);assert.equal(hash(bytes),a.sourceDigest);const meta=await sharp(bytes).metadata();assert.equal(meta.width,a.width);assert.equal(meta.height,a.height);if(a.fileType==='webp')await sharp(bytes).raw().toBuffer();else assert(parseHTML(bytes.toString()).document.querySelector('svg'));assert(!/^https?:/.test(a.path));}
assert.deepEqual(buildAstAdaptivePagePlan(ir,profile),plan);assert.equal(profile.pageExpansionPolicy.globalPageCount,null);assert.equal(plan.globalPageCount,null);
for(const b of ir.contentBlocks){const actual=plan.pages.flatMap(p=>p.parts).filter(p=>p.blockId===b.blockId);const paragraphs=b.text.split(/\r?\n\r?\n/);for(let i=0;i<paragraphs.length;i++){const parts=actual.filter(p=>p.paragraphIndex===i);assert.equal(parts.map(p=>p.text).join(''),paragraphs[i]);let end=0;for(const p of parts){assert.equal(p.offset,end);end+=p.text.length;}}}
const expanded=buildAstAdaptivePagePlan({...ir,contentBlocks:ir.contentBlocks.map((b,i)=>i===0?{...b,text:b.text+'\n\n'+b.text.repeat(10)}:b)},profile);assert(expanded.pages.length>plan.pages.length);
const items=k=>canonical.canonicalProjection.calculation.structures.find(s=>s.code===k).items;
assert.deepEqual(data.cusps,items('HOUSE_CUSPS'));assert.deepEqual(data.angles,items('ANGLES'));assert.deepEqual(data.aspects,items('ASPECTS'));assert.deepEqual(data.planets,canonical.canonicalProjection.calculation.positions);
const placed=plan.pages.flatMap(p=>p.diagramIds);assert.equal(new Set(placed).size,placed.length);assert.deepEqual(placed,ir.diagramBlocks.map(d=>d.diagramId));assert(!placed.includes('AST-D13'));
for(const route of data.routes.flatMap(r=>r.routes))assert.equal(route.rulerActualHouse,data.placements.find(p=>p.code===route.rulerBodyCode).value);
assert.equal(data.routes.flatMap(r=>r.routes).find(r=>r.houseNumber===7).rulerActualHouse,6);assert.equal(data.routes.flatMap(r=>r.routes).find(r=>r.houseNumber===10).rulerActualHouse,4);
for(const id of placed){const svg=renderAstDiagram(id,data);assert.equal(svg,renderAstDiagram(id,data));assert(parseHTML(svg).document.querySelector('svg'));}
const html=fs.readFileSync('tools/review/AST-VFR-R1-TL-PUBLICATION-REVIEW.html','utf8'),doc=parseHTML(html).document;
assert.equal(doc.querySelectorAll('article.page').length,plan.pages.length);assert.equal(plan.pages.filter(p=>p.pageType==='EDITORIAL_FULL_PAGE').length,5);assert.equal(plan.pages.filter(p=>p.pageType==='SECTION_OPENER').length,10);
assert(!/https?:\/\//.test(html.replace(/http:\/\/www.w3.org\/2000\/svg/g,'')));assert(!/overflow\s*:\s*hidden/.test(html));
for(const br of doc.querySelectorAll('[data-part] br'))br.replaceWith('\n');
const rendered=[...doc.querySelectorAll('[data-part]')].map(p=>p.textContent);assert.equal(rendered.join(''),plan.pages.flatMap(p=>p.parts).map(p=>p.text).join(''));
const ids=AST_CALL_PARTITIONS.flatMap(p=>p.sections);assert.equal(ids.length,10);assert.equal(new Set(ids).size,10);assert.equal(AST_CALL_PARTITIONS.length,3);
const requests=buildAstThreeCallRequests(pack);for(const req of requests){assert.equal(req.immutableAuthoringPack.authoringPackDigest,pack.authoringPackDigest);assert(req.immutableAuthoringPack.sectionPlan.length<pack.sectionPlan.length);assert(!/pagination|page fit|draw.*diagram/i.test(req.instructions));}
assert.equal(validateAstThreeCallResult({},pack).status,'REPAIR_REQUIRED');
const valid={customerRef:'CONTRACT_TEST',locale:'zh-Hans',authoringPackDigest:pack.authoringPackDigest,callResults:[{},{},{}],integratedClose:'整合结构的说明。'.repeat(40),sectionManuscripts:ids.map((id,i)=>({sectionId:id,sourceCall:AST_CALL_PARTITIONS.find(p=>p.sections.includes(id)).callId,text:('这是基于实际结构的长篇说明。'+i).repeat(40),sourceThemeRefs:[pack.coreThemes[0].themeKey],sourceRouteRefs:pack.sectionSourceBindings.flatMap(s=>s.houseRulerRouteRefs).slice(0,1)}))};assert.equal(validateAstThreeCallResult(valid,pack).status,'PASS_3_CALL');const bad=structuredClone(valid);bad.sectionManuscripts[0].text='你目前正在20'+ '27年行运中。'.repeat(80);assert.equal(validateAstThreeCallResult(bad,pack).status,'REPAIR_REQUIRED');
const result={status:'PASS',check:process.argv[2]||'all',referencePageCount:plan.pages.length,referenceDiagramCount:placed.length,providerCalls:0,rerenderProviderCalls:0,acceptedCopyPreserved:true,browserFit:'SEPARATE_BROWSER_RECEIPT_REQUIRED',productionAllowed:false};fs.writeFileSync(pub+'ast-vfr-r1-zero-cost-check-receipt.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
