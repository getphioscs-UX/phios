import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const fail=msg=>{throw new Error('RUNTIME_POSITION_48:'+msg);};
const assert=(ok,msg)=>{if(!ok)fail(msg);};

const registry=read('content/registry/runtime-position-48-v1.json');
const crosswalk=read('content/registry/runtime-position-48-crosswalk-v1.json');
const manifest=read('content/civilization-atlas/reconfiguration/atlas-manifest-v2.json');
const knowledge=read('content/civilization-atlas/reconfiguration/knowledge-state-contract-v1.json');
const sections=read('content/civilization-atlas/reconfiguration/book-vi-sections-v1.json');
const figures=read('content/registry/figures.json');

assert(registry.positions?.length===48,'POSITION_COUNT');
const ids=registry.positions.map(x=>x.id);
assert(new Set(ids).size===48,'POSITION_IDS_UNIQUE');
for(let n=1;n<=48;n++)assert(ids.includes('RP-'+String(n).padStart(2,'0')),'MISSING_RP_'+n);

const domains=['P1','P2','P3'];
for(const d of domains)assert(registry.positions.filter(x=>x.realityDomainId===d).length===16,'DOMAIN_'+d+'_COUNT');
for(let g=1;g<=16;g++)assert(registry.positions.filter(x=>x.grammarId==='G'+g).length===3,'GRAMMAR_G'+g+'_COUNT');

const locks=registry.positions.filter(x=>x.accessState==='LOCK').map(x=>x.id).sort();
const expectedLocks=['RP-08','RP-16','RP-24','RP-32','RP-40','RP-48'];
assert(JSON.stringify(locks)===JSON.stringify(expectedLocks),'LOCK_SET');

assert(crosswalk.figureAlignment?.FIG_13H?.includes('Forty-Eight Runtime Projection Matrix'),'CROSSWALK_FIG_13H');
assert(crosswalk.figureAlignment?.FIG_13I?.includes('Possibility Space'),'CROSSWALK_FIG_13I');
assert(manifest.registryRefs?.runtimePositions==='content/registry/runtime-position-48-v1.json','MANIFEST_POSITION_REF');
assert(manifest.registryRefs?.runtimePositionCrosswalk==='content/registry/runtime-position-48-crosswalk-v1.json','MANIFEST_CROSSWALK_REF');
assert(manifest.registryRefs?.runtimePositionCorrespondence==='content/civilization-atlas/reconfiguration/runtime-position-correspondence-contract-v1.json','MANIFEST_CORRESPONDENCE_REF');

const s84=sections.sections?.find(x=>x.id==='13.84'),s85=sections.sections?.find(x=>x.id==='13.85');
assert(s84?.figure==='FIG_13H','SECTION_13_84_FIGURE');
assert(s85?.figure==='FIG_13I','SECTION_13_85_FIGURE');

const fH=figures.figures?.find(x=>x.figure_id==='FIG_13H'),fI=figures.figures?.find(x=>x.figure_id==='FIG_13I');
assert(fH?.title?.en==='Forty-Eight Runtime Projection Matrix','FIG_13H_IDENTITY');
assert(fI?.title?.en==='Civilization Reconfiguration Possibility Space','FIG_13I_IDENTITY');

assert(knowledge.rules?.runtimePositions?.length>=4,'KNOWLEDGE_POSITION_RULES');
assert(knowledge.prohibited?.includes('RUNTIME_POSITION_AS_DETERMINISTIC_CIVILIZATION_STAGE'),'DETERMINISTIC_STAGE_GUARD');
assert(knowledge.prohibited?.includes('TIME_COORDINATE_AS_DESTINY_TIMELINE'),'DESTINY_TIMELINE_GUARD');

console.log('PASS runtime-position-48 backbone: 48/48 positions, 16x3 domains, 6 locks, Book VI 13H/13I alignment, knowledge-state guards.');
