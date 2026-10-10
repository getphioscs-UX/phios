import fs from 'node:fs';import crypto from 'node:crypto';
import {renderAstProductionFigure,AST_DIAGRAM_TOKENS} from './ast-figure-production-v1.js';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export function resolveAstFigures(data,manifest,profile){
 if(manifest.version!=='AST-FIGURE-FREEZE-v1'||manifest.entries.length!==13||new Set(manifest.entries.map(e=>e.diagramId)).size!==13)throw Error('AST_FIGURE_ACCEPTED_RENDERER_UNAVAILABLE');
 if(profile&&(profile.figureFreezeManifestVersion!==manifest.version||JSON.stringify(profile.figureInstances)!==JSON.stringify(manifest.entries.map(e=>({diagramId:e.diagramId,rendererVersion:e.rendererVersion})))))throw Error('AST_FIGURE_ACCEPTED_RENDERER_UNAVAILABLE');
 return manifest.entries.map(e=>{if(e.rendererVersion!==e.diagramId+'@AST-ORBITAL-EDITORIAL-v2-PROD-v1'||e.fallbackAllowed||e.designStatus!=='HUMAN_ACCEPTED'||['AST-D03','AST-D13'].includes(e.diagramId))throw Error('AST_FIGURE_ACCEPTED_RENDERER_UNAVAILABLE');
 for(const [path,digest] of [[e.rendererModule,e.rendererDigest],[e.sharedHelper,e.sharedHelperDigest]]){if(!fs.existsSync(path))throw Error('AST_FIGURE_CURRENT_RENDERER_MISSING');if(hash(fs.readFileSync(path))!==digest)throw Error('AST_FIGURE_VISUAL_DRIFT');}
 if(e.templateDigest!==e.rendererDigest||hash(JSON.stringify(AST_DIAGRAM_TOKENS))!==e.visualTokenDigest)throw Error('AST_FIGURE_VISUAL_DRIFT');
 const svg=renderAstProductionFigure(e.diagramId,data);return {diagramId:e.diagramId,rendererVersion:e.rendererVersion,dataDigest:hash(JSON.stringify(data)),renderDigest:hash(svg),svg};});
}
export function resolveEditorialAssets(registry){return registry.assets.map(a=>{if(a.languageScope!=='bilingual'||a.fallbackAllowed||!fs.existsSync(a.path))throw Error('AST_EDITORIAL_BILINGUAL_ASSET_MISSING');if(hash(fs.readFileSync(a.path))!==a.digest)throw Error('AST_EDITORIAL_ASSET_DRIFT');return a;});}
export function bindAstFrozenPublicationIR({template,customerDisplay,localeSections,editorialRegistry,masterRegistry,manifest,profile,data}){
 if(hash(JSON.stringify(masterRegistry))!==profile.masterLayoutRegistryDigest)throw Error('AST_MASTER_LAYOUT_VISUAL_DRIFT');
 if(hash(JSON.stringify(editorialRegistry))!==profile.editorialRegistryDigest)throw Error('AST_EDITORIAL_REGISTRY_VISUAL_DRIFT');
 const editorialPages=resolveEditorialAssets(editorialRegistry),figures=resolveAstFigures(data,manifest,profile);
 for(const m of masterRegistry.masters)if(!fs.existsSync(m.assetPath)||hash(fs.readFileSync(m.assetPath))!==m.assetDigest)throw Error('AST_SECTION_MASTER_ASSET_DRIFT');
 const sections=template.sections.map((s,i)=>({...s,title:masterRegistry.masters[i].text.zhTitle,englishTitle:masterRegistry.masters[i].text.enTitle,localeBlocks:localeSections?.[i]||s.localeBlocks,sharedDiagrams:s.sharedDiagrams.filter(id=>figures.some(f=>f.diagramId===id))}));
 const masterIds=new Set(masterRegistry.masters.map(m=>m.assetId));
 return {...template,customerDisplay:customerDisplay||template.customerDisplay,sections,editorialPages,visualBindings:[...template.visualBindings.filter(a=>masterIds.has(a.assetId)||a.assetId==='VIS-REPORT-ASTROLOGY-BODY'),...editorialPages],diagramBlocks:figures.map(f=>({diagramId:f.diagramId,rendererVersion:f.rendererVersion,renderDigest:f.renderDigest,dataDigest:f.dataDigest,fallbackAllowed:false})),sourceDigests:data.sourceDigests,providerCalls:0,productionAllowed:false,customerPublicationAllowed:false};
}
