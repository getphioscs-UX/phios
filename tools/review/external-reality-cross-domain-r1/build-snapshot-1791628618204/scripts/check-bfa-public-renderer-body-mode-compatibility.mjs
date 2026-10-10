import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeArticleForRenderer, prepareArticleSectionForRendering } from '../assets/js/knowledge/article-blocks.js';

const root=process.cwd();
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const contract=read('content/production/bilingual-final-approval/contracts/bfa-public-renderer-body-mode-compatibility-v1.json');
assert.equal(contract.status,'ACTIVE_SUCCESSOR_COMPATIBILITY_CONTRACT');
assert.equal(contract.securityBoundary.realDualBodyContentStillBlocked,true);
assert.equal(contract.securityBoundary.rendererSafetyRelaxed,false);
assert.equal(contract.publicArticlePurity.knowledgeBoundarySuppressionPreserved,true);

const normalized=[];
for(const locale of ['zh-Hans','en']){
  const dir=path.join(root,'content/knowledge/public/visual-articles',locale);
  const files=fs.readdirSync(dir).filter(name=>name.endsWith('.json')).sort();
  for(const name of files){
    const article=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
    const out=normalizeArticleForRenderer(article);
    assert.equal(out.locale,locale,`${locale}/${name}: locale`);
    assert.ok(out.sections.length>0,`${locale}/${name}: sections`);
    assert.deepEqual(out.knowledgeBoundary,[],`${locale}/${name}: public knowledgeBoundary must remain suppressed`);
    normalized.push(`${locale}/${name}`);
  }
}
assert.ok(normalized.length>=20,'Expected all current bilingual visual articles to normalize.');

const legacy=prepareArticleSectionForRendering({heading:'Legacy',paragraphs:['Reader-facing paragraph.'],blocks:[]});
assert.deepEqual(legacy.paragraphs,['Reader-facing paragraph.']);
assert.deepEqual(legacy.blocks,[]);
const structured=prepareArticleSectionForRendering({heading:'Structured',paragraphs:[],blocks:[{type:'paragraph',text:'Reader-facing block.'}]});
assert.equal(structured.blocks.length,1);
assert.deepEqual(structured.paragraphs,[]);
assert.throws(()=>prepareArticleSectionForRendering({heading:'Dual',paragraphs:['x'],blocks:[{type:'paragraph',text:'y'}]}),/Article rendering stopped: invalid_section/);
assert.throws(()=>prepareArticleSectionForRendering({heading:'Empty',paragraphs:[],blocks:[]}),/Article rendering stopped: invalid_section/);

console.log(`✓ Public Article Renderer body-mode compatibility passed for ${normalized.length} current bilingual visual articles.`);
console.log('✓ paragraphs=[...] + blocks=[] is accepted as legacy paragraph mode; blocks=[...] + paragraphs=[] is accepted as structured mode.');
console.log('✓ Real dual non-empty bodies and empty bodies remain fail-closed; Public Article Purity knowledgeBoundary suppression remains active.');
