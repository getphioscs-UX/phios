import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {knowledgeNavigationIntent} from '../assets/customer-ui/js/navigation-intent.js';
import {onRequestPost} from '../functions/api/customer-contextual-ask.js';
import {chooseStructuredFigure} from '../assets/js/knowledge/structured-figure.js';
import {projectKnowledgeAnswerForCustomer} from '../functions/customer-projection/knowledge-customer-projection.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),d=read('content/knowledge/structured/article-figure-reconciliation-v1.json');
for(const [p,hash] of Object.entries(d.noRepublish.protectedDigests))assert.equal(createHash('sha256').update(fs.readFileSync(p)).digest('hex'),hash,`NO_REPUBLISH:${p}`);
assert.equal(new Set(d.matrix.map(n=>n.nodeCode)).size,d.matrix.length);
const ids=new Set(d.explorerLinks.map(o=>o.objectId));
for(const a of d.articles){assert.ok(d.articleRoles.includes(a.role));assert.ok(a.relatedObjectIds.every(id=>ids.has(id)));if(a.href)assert.ok(a.href.startsWith('/articles/'));}
for(const n of d.matrix){assert.ok(d.projectionTypes.includes(n.projection));assert.ok(n.objectIds.every(id=>ids.has(id)));if(n.projection==='ARTICLE_AND_STRUCTURED')assert.ok(n.articleCodes.length&&n.objectIds.length);}
const figures=read('content/registry/figures.json');for(const f of d.figures){assert.ok(figures.figures.some(x=>x.figure_id===f.figureId));assert.ok(f.relatedObjectIds.every(id=>ids.has(id)));assert.equal(f.bindingBasis,'EXPLICIT_BOOK_AND_PART_ONLY');}
assert.equal(chooseStructuredFigure('missing',d.figures,figures,{parts:[]}),null);
assert.equal(chooseStructuredFigure('x',[{figureId:'bad',relatedObjectIds:['x']}],{figures:[{figure_id:'bad',status:'source-pending'}]},{parts:[]}),null);
for(const [question,locale] of [['文章','zh-Hans'],['找文章','zh-Hans'],['articles','en'],['show me articles','en']]){assert.equal(knowledgeNavigationIntent(question,locale).href,'/articles');const res=await onRequestPost({request:new Request('https://test/api/customer-contextual-ask',{method:'POST',body:JSON.stringify({question,locale})}),env:{}});const body=await res.json();assert.equal(body.view.state,'NAVIGATION');assert.equal(body.view.relatedKnowledge[0].href,'/articles');assert.ok(body.view.answer.text.length<100);assert.deepEqual(body.view.basedOn.sources,[]);}
for(const q of ['为什么这篇文章谈恢复','How does expansion work?','文章里的治疗建议可靠吗'])assert.equal(knowledgeNavigationIntent(q),null);
const unclear=projectKnowledgeAnswerForCustomer({ptrc:{quality:{outcome:'INSUFFICIENT'}},clientAnswer:{directAnswer:'PHI OS 目前没有足够的受治理知识来可靠回答这个问题。'}},{locale:'zh-Hans'});assert.ok(!unclear.answer.text.includes('受治理'));assert.equal(unclear.relatedKnowledge[0].href,'/articles');
console.log(`✓ W45–W49: ${d.articles.length} articles, ${d.matrix.length} node projections, ${d.figures.length} figure contexts; protected bytes, navigation-only API, unknown guidance and unapproved-figure exclusion passed.`);
