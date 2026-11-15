import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {parseHTML} from 'linkedom';
const digest=b=>createHash('sha256').update(b).digest('hex');
const manifestPath='tools/review/founder-owner-r3-strict-r4/TRANSITION.json',expectedManifestSHA='cf36cbe1fa3854747f35772e957317b7b3ed42183a18d7acf2401ad1a71ff05d';
export function assertFounderR3StrictTransition({root=process.cwd(),readFile=p=>fs.readFileSync(path.join(root,p)),declaredChangedPaths}={}){
 const bytes=readFile(manifestPath);assert.equal(digest(bytes),expectedManifestSHA,'TRANSITION_MANIFEST_DRIFT');const m=JSON.parse(bytes);
 assert.equal(m.version,'FOUNDER-R3-STRICT-R4');assert.equal(m.productionActivated,false);assert.equal(m.historicalAcceptanceInherited,false);
 const changed=declaredChangedPaths??m.allowedChangedPaths;assert.deepEqual([...changed].sort(),m.allowedChangedPaths,'UNDECLARED_OR_MISSING_PATH');assert.equal(new Set(changed).size,changed.length,'DUPLICATE_PATH');
 for(const [p,sha]of Object.entries({...m.historicalArchives,...m.runtimeInputs,...m.checkerOutputs}))assert.equal(digest(readFile(p)),sha,'SOURCE_OR_PREDECESSOR_DRIFT '+p);
 assert.equal(digest(readFile(m.ownerEvidence.path)),m.ownerEvidence.sha256,'OWNER_EVIDENCE_DRIFT');
 const prefix=path.dirname(manifestPath);assert.equal(digest(readFile(prefix+'/ASSERTION-DISPOSITION.json')),m.dispositionSHA256,'DISPOSITION_DRIFT');
 const walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
 assert.deepEqual(walk(prefix).sort(),m.allowedChangedPaths.filter(p=>p.startsWith(prefix+'/')).sort(),'EXTRA_PROVENANCE_PATH');
 const old=readFile(prefix+'/predecessor/about/founder/index.html');assert.equal(digest(old),m.predecessorPageSHA256,'WRONG_PREDECESSOR');
 const record=JSON.parse(readFile('content/web/index-surfaces/founder-owner-r3.json'));assert.equal(record.previousPageSha256,m.predecessorPageSHA256,'WRONG_PAGE_PREDECESSOR');assert.equal(record.pageSha256,m.runtimeInputs['about/founder/index.html']);
 const page=readFile('about/founder/index.html').toString(),{document:d}=parseHTML(page),{document:b}=parseHTML(old.toString());
 const persons=doc=>[...doc.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)).filter(s=>s['@type']==='Person');assert.equal(persons(d).length,1);assert.deepEqual(persons(d),persons(b),'PERSON_IDENTITY_OR_KEYS_CHANGED');assert.equal(d.querySelectorAll('h1').length,1);
 const hero=d.querySelector('.founder-r3-portrait img'),before=b.querySelector('.founder-r2-hero img');assert(hero&&before);for(const attr of ['src','width','height','loading','fetchpriority'])assert.equal(hero.getAttribute(attr),before.getAttribute(attr),'ORIGINAL_HERO_CHANGED '+attr);assert.equal(hero.getAttribute('loading'),'eager');assert.equal(hero.getAttribute('fetchpriority'),'high');
 assert.equal(d.querySelector('meta[property="og:image"]').content,b.querySelector('meta[property="og:image"]').content,'OG_IMAGE_CHANGED');
 const proof=JSON.parse(readFile(prefix+'/predecessor/tools/review/founder-human-presence-r2/ASSET-VERIFICATION.json'));assert.equal(proof.records.length,2);for(const p of proof.records){assert.equal(p.state,'VERIFIED');assert.equal(p.httpStatus,200);assert(p.dimensions.width>0&&p.dimensions.height>0);}assert.equal(hero.getAttribute('src'),proof.records[0].publicUrl);assert.equal(persons(d)[0].image,proof.records[1].publicUrl);
 assert(!/PhD|therapist|psychologist|licensed|certified|award|price_|\bRM\d|14 layers|five-volume|three-volume|SOURCE_NOT_ATTACHED|PLATFORM-RELATIONSHIP-NETWORK|V8-FOUNDER|PIS-R1 EDITORIAL|RECOVERY-FOUNDER-V8-RESTORATION|NATURE-EXPERIENCE-SCOPE|COM-SUBSCRIPTION/i.test(d.querySelector('main').textContent));
 assert(!d.querySelector('main [data-pis-copy],main [data-i18n],main details'),'DUPLICATE_OR_HIDDEN_PUBLIC_COPY_OWNER');
 for(const a of d.querySelectorAll('main a[href]')){const href=a.getAttribute('href');if(href.startsWith('#'))assert(d.getElementById(href.slice(1)),'BROKEN_ANCHOR');else if(href.startsWith('/')){const p=href.split(/[?#]/)[0].slice(1);assert(fs.existsSync(path.join(root,p))||fs.existsSync(path.join(root,p+'index.html')),'BROKEN_LOCAL_LINK '+href);}else assert.fail('UNREVIEWED_MAIN_LINK '+href);}
 const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length,'DUPLICATE_ID');const css=readFile('assets/css/founder-owner-r3.css').toString();for(const token of ['prefers-reduced-motion',':focus-visible','@media print'])assert(css.includes(token),'ACCESSIBILITY_CONTRACT_LOST '+token);
 return {status:'PASS',historicalArchivesPinned:true,predecessorVerified:true,retainedAssertionsVerified:true,historicalCheckPassInherited:false,productionActivated:false};
}
