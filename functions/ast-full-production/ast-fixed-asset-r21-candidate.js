import {requireFixedReportManifest,resolveReportBodyAsset,reportContentLocale} from '../canonical-presentation-runtime/report-editorial-resolver.js';
import currentManifest from '../../content/reports/shared/report-visual-assets-r2.json';
// Local successor adapter around the accepted R1R5 DOM paginator, not a new
// manuscript, calculation, diagram engine or production publication authority.
export async function buildAstFixedAssetR21Candidate({publicationHtml,contentLanguage='bilingual',manifest=currentManifest}={}){
 const locale=reportContentLocale(contentLanguage);
 if(locale!=='bilingual')throw Error('AST_EXISTING_APPROVED_CONTENT_MODE_REQUIRED');
 const source=manifest.reports.AST.contentOwner;
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(publicationHtml))),b=>b.toString(16).padStart(2,'0')).join('');
 if(!source||digest!==source.sha256)throw Error('AST_ACCEPTED_PUBLICATION_SOURCE_DRIFT');
 const fixed=requireFixedReportManifest('AST',locale,manifest),body=resolveReportBodyAsset({methodId:'AST',manifest});
 const match=publicationHtml.match(/<script type="application\/json" id="model">([\s\S]*?)<\/script>/);
 if(!match)throw Error('AST_EXISTING_MODEL_NOT_FOUND');
 const model=JSON.parse(match[1]);
 if(JSON.stringify(model.sections.map(s=>s.sectionId))!==JSON.stringify(manifest.reports.AST.sections))throw Error('AST_FIXED_SECTION_SOURCE_ORDER_MISMATCH');
 const contentBefore=JSON.stringify(model.sections.map(s=>({id:s.sectionId,localeBlocks:s.localeBlocks,diagrams:s.diagrams,insertions:s.insertions})));
 model.body=body.url;model.editorial=fixed.filter(a=>a.kind!=='FIXED_MASTER_SECTION').map(a=>({pageRole:a.kind==='COVER'?'COVER':a.pageId,url:a.url}));
 model.assets=Object.fromEntries(fixed.filter(a=>a.kind==='FIXED_MASTER_SECTION').map(a=>[a.pageId,a.url]));
 let html=publicationHtml.replace(match[0],()=>'<script type="application/json" id="model">'+JSON.stringify(model).replaceAll('<','\u003c')+'</script>');
 const start=html.indexOf('async function compose(){'),firstSection=html.indexOf('for(const s of model.sections){',start),closing=html.indexOf('const closing=[];',firstSection);
 if(start<0||firstSection<0||closing<0)throw Error('AST_ACCEPTED_PAGINATOR_SHAPE_CHANGED');
 const fixedPage="function fixedPage(s,url,kind){const p=page(s,'shared',kind,url);p.dataset.pageRole=kind==='editorial'?'FIXED_EDITORIAL':'FIXED_MASTER_SECTION';p.style.backgroundImage='none';p.innerHTML='';const img=document.createElement('img');img.src=url;img.alt=kind==='editorial'?'Fixed editorial page':s.sectionId;img.className='r21-fixed-art';p.append(img);return p;}";
 html=html.slice(0,start)+fixedPage+"async function compose(){await document.fonts.ready;for(const editorial of model.editorial)fixedPage(null,editorial.url,'editorial');\nfor(const s of model.sections){fixedPage(s,model.assets[s.sectionId],'opener');\n"+html.slice(closing);
 html=html.replace("p.dataset.kind=kind;","p.dataset.kind=kind;p.dataset.pageRole='BODY_CONTENT';");
 html=html.replace("p.querySelector('footer b').textContent=String(i+1).padStart(2,'0');","const footer=p.querySelector('footer b');if(footer)footer.textContent=String(i+1).padStart(2,'0');");
 html=html.replace('</style>', '.r21-fixed-art{display:block;width:100%;height:100%;object-fit:contain;object-position:center}[data-page-role="FIXED_EDITORIAL"],[data-page-role="FIXED_MASTER_SECTION"]{background:white!important}</style>');
 const contentAfter=JSON.stringify(model.sections.map(s=>({id:s.sectionId,localeBlocks:s.localeBlocks,diagrams:s.diagrams,insertions:s.insertions})));
 if(contentBefore!==contentAfter)throw Error('AST_CUSTOMER_CONTENT_CHANGED');
 return {html,sourceReference:source.sourceReference,sourceDigest:digest,contentLanguage:locale,fixedCount:fixed.length,bodyAsset:{objectKey:body.objectKey,sha256:body.sha256},contentPreserved:true,existingPaginatorPreserved:true,providerCalls:0,productionAllowed:false};
}
