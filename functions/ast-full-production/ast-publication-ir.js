import {normalizeAstPublicationManuscript} from './ast-publication-manuscript-normalizer.js';
export function buildAstPublicationIR({manuscript,customerDisplay,diagramData,visualRegistry,profile,diagramRegistry,sourceDigests}){
 const normalized=normalizeAstPublicationManuscript(manuscript);
 const contentBlocks=normalized.blocks.map(b=>({...b,contentRole:'CUSTOMER_MANUSCRIPT',priority:1,keepTogether:false,allowSplit:true,sourceManuscriptDigest:normalized.sourceManuscriptDigest}));
 const routeHouses=new Set(diagramData.routes.flatMap(r=>r.routes).map(r=>r.houseNumber));
 const supported=d=>{
  if(d.conditional)return false; // Timing rendering requires a separately admitted implementation.
  if(d.diagramId==='AST-D09')return routeHouses.has(7);
  if(d.diagramId==='AST-D10')return routeHouses.has(10);
  if(d.diagramId==='AST-D11')return routeHouses.has(2)&&routeHouses.has(8);
  if(['AST-D04','AST-D08'].includes(d.diagramId))return !!diagramData.rulership?.dispositorChains?.length;
  if(d.diagramId==='AST-D05')return !!diagramData.distribution?.elementCounts;
  if(['AST-D06','AST-D07','AST-D12','AST-D14'].includes(d.diagramId))return !!diagramData.aspects?.length;
  return d.diagramId==='AST-D15'||(diagramData.cusps.length===12&&diagramData.angles.length===4&&Object.keys(diagramData.bodies).length>0);
 };
 if(diagramRegistry.diagrams.some(d=>d.required&&!supported(d)))throw Error('AST_REQUIRED_DIAGRAM_EVIDENCE_MISSING');
 const diagramBlocks=diagramRegistry.diagrams.filter(supported).map(d=>({...d,dataRef:'ast-vfr-r1-diagram-data.json',fullPageEligible:true,comboPageEligible:d.diagramId==='AST-D15',fallbackPolicy:'FAIL_CLOSED'}));
 return {schemaVersion:'PHI-OS-ASTROLOGY-PUBLICATION-IR-v1.0.0',reportIdentity:{methodId:'AST',customerRef:manuscript.referenceCaseId||manuscript.customerRef},customerDisplay,locale:manuscript.locale,editorialPages:profile.editorialPagePolicy,sections:profile.sectionRegistry,contentBlocks,diagramBlocks,pageHints:{adaptive:true},visualBindings:visualRegistry.assets,sourceDigests,publicationBoundary:{semanticInference:false,productionActive:false,providerCalls:0}};
}
