import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {atlasUrlFromState} from '../assets/js/pages/civilization-atlas/atlas-url-state.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,value)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const root='content/knowledge/public/successors/book5-publication-v1';
const map=read('content/books/book-5/articles/article-production-map-v1.json');
const inventory=read('content/books/book-5/source/final-manuscript-structure-v1.json');
const raw=read('functions/_source-material/books/book-5-desktop-text-v1.json');
const drafts=Array.from({length:6},(_,i)=>read(`content/books/book-5/articles/editorial-0${i+1}-v1.json`)).flat();
const bindings=read('content/civilization-atlas/visuals/civilization-visual-approved-bindings-v1.json').assets;
const cases=read('content/civilization-atlas/cases/civilization-case-registry-v1.json').cases;
const snapshots=read('content/civilization-atlas/snapshots/world-snapshots-v1.json').snapshots;
const transitions=read('content/civilization-atlas/transitions/transition-windows-v1.json').transitionWindows;
const losses=read('content/civilization-atlas/loss/reversal-loss-atlas-v1.json').lossTypes;
const trajectories=read('content/civilization-atlas/trajectories/long-duration-trajectories-v1.json').trajectories;
const families=read('content/civilization-atlas/comparison/comparison-families-v1.json').families;
const readingRelations=read('content/books/book-5/articles/atlas-reading-relations-v1.json').records;
const aliases=read('content/books/book-5/articles/search-aliases-v1.json').records;
const figureTerms=[['孔子','Confucius'],['亚历山大','Alexander'],['秦始皇','Qin Shi Huang'],['穆罕默德','Muhammad'],['成吉思汗','Genghis Khan'],['忽必烈','Kublai Khan'],['哥伦布','Columbus'],['拿破仑','Napoleon'],['彼得一世','Peter I']];
const bookRoute='/books/reality-differentiation/';
const partNames=['Foundations of the Civilization Atlas','Origins of differentiation','The first civilizations','Bronze, iron and empire','The classical world','Faith, knowledge and universal civilizations','Continental networks','Conquest, plague and reconnection','Oceans connect the world into one system','Industrial civilization','Modernization has more than one answer'];
const bookTitle={'zh-Hans':'世界如何分化',en:'Reality Differentiation'};
const parts=inventory.parts.map((p,i)=>({...p,title:{'zh-Hans':p.title,en:partNames[i]}}));
const shell=fs.readFileSync('articles/book4-article-001.html','utf8');
const records=[],parity=[],knowledgeBindings=[];
const url=(state,locale)=>{const u=atlasUrlFromState(bookRoute,{...state,locale});u.searchParams.set('locale',locale);return u.pathname+u.search+u.hash;};
const title=(r,locale)=>r?.title?.[locale]||r?.label?.[locale]||r?.name?.[locale]||'';
function cleanPage(text){
 const paragraphs=[];
 for(const line of text.split('\n')){
  if(!line.trim()||line.trim().startsWith('✦'))continue;
  if(/^\s{2,}/.test(line)||!paragraphs.length)paragraphs.push(line.trim());
  else paragraphs[paragraphs.length-1]+=' '+line.trim();
 }
 return paragraphs.map(p=>p.replace(/(?<=[\p{Script=Han}，。；：！？、（）《》])\s+|\s+(?=[\p{Script=Han}，。；：！？、（）《》])/gu,'').trim()).filter(Boolean);
}
for(const draft of drafts){
 const id=`book5-article-${String(draft.number).padStart(3,'0')}`;
 const pair=map.records.filter(r=>r.articleId===id);
 if(pair.length!==2||draft.zh.length!==draft.en.length)throw Error('BILINGUAL_PAIR:'+id);
 for(const plan of pair){
  const additional=readingRelations.find(r=>r.articleId===id);
  for(const key of ['relatedTrajectories','relatedComparisonFamilies'])if(additional?.[key])plan[key]=additional[key];
  const locale=plan.locale,zh=locale==='zh-Hans',body=zh?draft.zh:draft.en;
  const part=parts.find(p=>p.sourceSections.includes(plan.sourceSections[0]));
  const selected=plan.visualCandidates.map(code=>bindings.find(b=>b.assetId===code&&b.bindingState==='BOUND'&&b.reviewState==='ACCEPTED')).filter(Boolean).slice(0,2);
  const visualAssets=selected.map((b,i)=>({assetCode:b.assetId,assetType:'hero_illustration',resolver:'UNIFIED_PUBLIC_VISUAL',altText:title(b,locale)||b.subjectTitle[locale],caption:(b.subjectTitle[locale]||'')+(zh?' · 情境插图；历史解释见正文。':' · Context illustration; historical interpretation is in the text.'),width:1600,height:900,publicProjection:true,locale}));
  const links=[];
  for(const trajectoryId of plan.relatedTrajectories){const r=trajectories.find(c=>c.trajectoryId===trajectoryId);if(!r)throw Error('TRAJECTORY:'+trajectoryId);links.push({href:url({activeLayer:'trajectories',trajectoryIds:[trajectoryId]},locale),label:(zh?'长期轨迹：':'Long trajectory: ')+title(r,locale)});}
  for(const familyId of plan.relatedComparisonFamilies){const r=families.find(c=>c.familyId===familyId);if(!r)throw Error('COMPARISON:'+familyId);links.push({href:url({activeLayer:'comparison',comparisonFamilyId:familyId},locale),label:(zh?'比较：':'Comparison: ')+title(r,locale)});}
  for(const caseId of plan.relatedCases){const r=cases.find(c=>c.caseId===caseId);links.push({href:url({activeLayer:'cases',primaryCaseId:caseId},locale),label:(zh?'文明案例：':'Civilization case: ')+title(r,locale)});}
  for(const snapshotId of plan.relatedSnapshots){const r=snapshots.find(c=>c.snapshotId===snapshotId);links.push({href:url({activeLayer:'world',snapshotId},locale),label:(zh?'世界快照：':'World snapshot: ')+title(r,locale)});}
  for(const transitionWindowId of plan.relatedTransitions){const r=transitions.find(c=>c.transitionWindowId===transitionWindowId);links.push({href:url({activeLayer:'transitions',transitionWindowId},locale),label:(zh?'转折：':'Transition: ')+title(r,locale)});}
  for(const lossTypeId of plan.relatedLossTypes){const r=losses.find(c=>c.lossTypeId===lossTypeId);links.push({href:url({activeLayer:'loss',lossTypeId},locale),label:(zh?'延续与失落：':'Continuity and loss: ')+title(r,locale)});}
  const neighbors=[draft.number-1,draft.number+1].map(n=>map.records.find(r=>r.articleId===`book5-article-${String(n).padStart(3,'0')}`&&r.locale===locale)).filter(Boolean);
  const summary=body[0];
  const blocks=body.map(text=>({type:'paragraph',text}));
  if(visualAssets[1])blocks.splice(2,0,{type:'figure',assetCode:visualAssets[1].assetCode,displayMode:'wide',altText:visualAssets[1].altText,caption:visualAssets[1].caption});
  const publicationContext={bookCode:'BOOK-5',publicationBookCode:'BOOK-5',publicationVolume:5,bookTitle,partCode:'P12',partTitle:part.title,bookRoute,readingPath:'BOOK5-FINAL-MANUSCRIPT-ARTICLES'};
  const sourceReading={path:`/${root}/source-readings/${id}.json`,label:zh?'阅读对应原文（中文）':'Read the corresponding manuscript (Chinese)',pages:plan.sourcePages};
  const nativeSourceText=raw.pages.filter(p=>p.pdfPage>=plan.sourcePages.start&&p.pdfPage<=plan.sourcePages.end).map(p=>p.text.replace(/\s/g,'')).join('');
  const sourceKeywords=figureTerms.filter(([name])=>nativeSourceText.includes(name)).flat();
  const article={schemaVersion:'PHI-OS-PUBLIC-VISUAL-ARTICLE-v1.0.0',assetCode:id+'-'+locale+'-PUBLIC-ARTICLE',articleId:id,nodeCode:plan.knowledgeRefs[0],coveredNodeCodes:plan.knowledgeRefs,locale,slug:plan.slug,publicHref:'/articles/'+plan.slug,title:plan.title,summary,shortAnswer:summary,displayQuestion:plan.title,publicationOrder:5000+draft.number,contentStatus:'content_reviewed',reviewStatus:'approved',publicationStatus:'published',version:'1.0.0',publishedAt:'2026-09-19',readingTimeMinutes:zh?3:2,sections:[{sectionCode:id+'-body',heading:zh?'从文明差异出发':'Understanding different paths',anchor:'article-body',blocks}],hero:{lead:summary,eyebrow:zh?'第五册 · 世界如何分化':'Book V · Reality Differentiation',...(visualAssets[0]?{assetCode:visualAssets[0].assetCode}:{})},keyConcepts:[],knowledgeBoundary:[],connections:{previousNode:null,nextNode:null,relatedNodes:[],relatedArticles:neighbors.map(n=>n.slug),relatedBooks:[{href:bookRoute+'?locale='+locale+'#book-parts',label:zh?'返回第五册目录':'Return to the Book V contents'}],relatedAtlasEntries:links,relatedFigures:[],journeyEntryTopics:[]},publicSources:[],visualAssets,figureReferences:[],publicationContext,taxonomy:{themeCode:'',tags:[part.title[locale]]},sourceReading,sourceHeadings:plan.sourceHeadings,askContext:{...plan.askContext,articleTopic:plan.title},provenance:{bookCode:'BOOK-5',partCode:'P12',sourceSectionCodes:plan.sourceSections,sourcePages:plan.sourcePages,sourcePdfSha256:map.sourcePdfSha256,articlePlanId:id,sourceLanguage:'zh-Hans',derivation:'EDITORIAL_ADAPTATION',humanDecision:'PENDING_HUMAN_REVIEW'},seo:{title:plan.title,description:summary,canonicalUrl:'https://getphios.com/articles/'+plan.slug}};
  const file=`/${root}/visual-articles/${locale}/${plan.slug}.json`;write('.'+file,article);
  const {sections,visualAssets:unused,provenance,...metadata}=article;
  records.push({...metadata,status:'published',href:article.publicHref,path:file,metadataOnly:true,part:part.code,searchAliases:aliases[id]||[],searchKeywords:sourceKeywords,searchText:[plan.title,summary,...plan.sourceHeadings,...plan.relatedCases,...plan.relatedSnapshots,...(aliases[id]||[]),...sourceKeywords].join(' ')});
  for(const nodeCode of plan.knowledgeRefs)knowledgeBindings.push({nodeCode,bookCode:'BOOK-5',partCode:'P12',articleCode:id,slug:plan.slug,href:article.publicHref,title:plan.title,locale,authorityDigest:hash(article),sourceSectionCodes:plan.sourceSections,relatedCases:plan.relatedCases,relatedSnapshots:plan.relatedSnapshots,relatedTransitions:plan.relatedTransitions,relatedTrajectories:plan.relatedTrajectories,relatedLossTypes:plan.relatedLossTypes,relatedComparisonFamilies:plan.relatedComparisonFamilies});
  if(zh){
   let html=shell.replace(/book4-article-001/g,plan.slug).replace(/<title>[^<]*<\/title>/,`<title>${esc(plan.title)}｜PHI OS</title>`).replace(/(<meta name="description" content=")[^"]*/,`$1${esc(summary)}`);
   html=html.replace('</head>',`  <meta property="og:title" content="${esc(plan.title)}">\n  <meta property="og:description" content="${esc(summary)}">\n  <meta property="og:type" content="article">\n  <meta property="og:url" content="https://getphios.com/articles/${plan.slug}">\n  <link rel="alternate" hreflang="zh-Hans" href="https://getphios.com/articles/${plan.slug}?locale=zh-Hans">\n  <link rel="alternate" hreflang="en" href="https://getphios.com/articles/${plan.slug}?locale=en">\n</head>`);
   write(`articles/${plan.slug}.html`,html);
   write(`.${sourceReading.path}`,{bookCode:'BOOK-5',sourcePdfSha256:map.sourcePdfSha256,sourceSections:plan.sourceSections,headings:plan.sourceHeadings,extraction:'NATIVE_TEXT_NOT_OCR',pages:raw.pages.filter(p=>p.pdfPage>=plan.sourcePages.start&&p.pdfPage<=plan.sourcePages.end&&p.pdfPage<=408).map(p=>({page:p.pdfPage,paragraphs:cleanPage(p.text)}))});
  }
 }
 parity.push({articleId:id,sourceSections:pair[0].sourceSections,paragraphPairs:draft.zh.map((text,i)=>({position:i+1,zhSha256:hash(text),enSha256:hash(draft.en[i])})),editorialMethod:'SOURCE_GROUNDED_PARALLEL_ARGUMENTS',machineScope:'Pair completeness, shared source/relations and paragraph digests; not a proof of semantic equivalence.',humanDecision:'PENDING_HUMAN_REVIEW'});
}
const atlasDiscovery=[];
for(const locale of ['zh-Hans','en'])for(const [rows,idKey,layer,stateKey] of [[cases,'caseId','cases','primaryCaseId'],[snapshots,'snapshotId','world','snapshotId'],[transitions,'transitionWindowId','transitions','transitionWindowId']])for(const r of rows){const name=title(r,locale);if(!name)continue;atlasDiscovery.push({type:'ATLAS',locale,slug:r[idKey],title:name,summary:r.summary?.[locale]||(locale==='zh-Hans'?'在文明图谱中查看时间、关联与证据。':'Explore time, relationships and evidence in the Civilization Atlas.'),bookTitle,partTitle:{'zh-Hans':'文明图谱',en:'Civilization Atlas'},href:url({activeLayer:layer,[stateKey]:r[idKey]},locale),searchText:[name,...(r.aliases||[]),r[idKey],JSON.stringify(r.timeWindow||{})].join(' ')});}
const manuscriptContents=inventory.sections.map(section=>{
 const plan=map.records.find(r=>r.locale==='zh-Hans'&&r.sourceSections.includes(section.sourceSectionId));
 const part=inventory.parts.find(p=>p.sourceSections.includes(section.sourceSectionId));
 if(!plan||!part)throw Error('UNMAPPED_MANUSCRIPT_SECTION:'+section.sourceSectionId);
 return {heading:section.heading.replace(/\|/g,'：'),part:part.code,page:section.pdfPageStart,href:'/articles/'+plan.slug,anchor:'manuscript-page-'+section.pdfPageStart};
});
write(`${root}/visual-article-release.json`,{schemaVersion:'PHI-OS-PUBLIC-ARTICLE-RELEASE-SUCCESSOR-v1.0.0',bookCode:'BOOK-5',baselineHead:'1157ac7803253191875701eb2b4746e9d7bb8a84',status:'WORKTREE_PUBLICATION_CANDIDATE',humanDecision:'PENDING_HUMAN_REVIEW',recordCount:records.length,articlePlanCount:drafts.length,locales:['zh-Hans','en'],parts,manuscriptContents,records,atlasDiscovery});
write('content/books/book-5/articles/semantic-parity-v1.json',{status:'MACHINE_ALIGNMENT_RECORDED_HUMAN_REVIEW_PENDING',records:parity});
write('content/knowledge/knowledge-intelligence-r2/registries/successors/book5-publication-v1/published-article-bindings-v1.json',{schemaVersion:'PHI-OS-PUBLISHED-ARTICLE-BINDING-REGISTRY-v1',recordCount:knowledgeBindings.length,records:knowledgeBindings});
const nodes=read('content/knowledge/registry/successors/book-w1d/canonical-nodes-v1.json').nodes;
const profiles=[...new Set(knowledgeBindings.map(b=>b.nodeCode))].map(code=>{
 const node=nodes.find(n=>n.nodeCode===code),bound=knowledgeBindings.filter(b=>b.nodeCode===code);
 if(!node||node.registryStatus==='superseded')throw Error('INACTIVE_KNOWLEDGE_REF:'+code);
 return {profileId:'KIR-R2-'+code,nodeCode:code,bookCode:'BOOK-5',partCode:'P12',chapterCode:node.chapterCode,canonicalName:{'zh-Hans':node.titleZhHans,en:node.titleEn||node.titleZhHans},canonicalMeaning:{titleZhHans:node.titleZhHans,canonicalQuestionKey:node.canonicalQuestionKey,authority:'CANONICAL_NODE_AND_FINAL_MANUSCRIPT_PROJECTION'},userLanguage:bound.map(b=>b.title),naturalQuestions:bound.map(b=>b.title),mechanisms:[],conditions:[],patterns:[],relatedNodes:node.relationships.relatedNodeCodes,contrastingNodes:[],antiMatches:[],realityDomains:['civilization','history'],bookSources:[{bookCode:'BOOK-5',partCode:'P12',chapterCode:node.chapterCode}],articleSources:bound.map(b=>({articleCode:b.articleCode,slug:b.slug,href:b.href,title:b.title,locale:b.locale,authorityDigest:b.authorityDigest})),aliases:bound.map(b=>b.title),locales:['zh-Hans','en'],authorityRefs:['content/knowledge/registry/successors/book-w1d/canonical-nodes-v1.json','content/books/book-5/source/final-manuscript-structure-v1.json'],productionEligible:true};
});
write('content/knowledge/knowledge-intelligence-r2/semantic-profiles/successors/book5-publication-v1/semantic-retrieval-profiles-v1.json',{schemaVersion:'PHI-OS-KIR-R2-SEMANTIC-RETRIEVAL-PROFILES-v1.0.0',profileCount:profiles.length,ownership:'Publication projection of existing P12 nodes; canonical IDs and historical registries unchanged.',profiles});
console.log(`Built ${drafts.length} bilingual articles, ${records.length} bodies, ${knowledgeBindings.length} concept bindings and ${atlasDiscovery.length} Atlas discovery records. Human review remains pending.`);
