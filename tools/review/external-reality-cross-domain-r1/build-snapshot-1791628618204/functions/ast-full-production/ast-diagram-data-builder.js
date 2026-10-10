export function buildAstDiagramData({canonicalProjection,r4Projection,r5Synthesis,sourceDigests,timingAuthority=null,realityContext=null}){
 if(canonicalProjection.calculation?.status!=='COMPLETE')throw Error('AST_CANONICAL_REQUIRED');
 const items=code=>canonicalProjection.calculation.structures.find(s=>s.code===code)?.items||[];
 const planets=canonicalProjection.calculation.positions;
 const signCodes=['ARIES','TAURUS','GEMINI','CANCER','LEO','VIRGO','LIBRA','SCORPIO','SAGITTARIUS','CAPRICORN','AQUARIUS','PISCES'];
 const bodies=Object.fromEntries(Object.entries(r5Synthesis.bodyEvidence).map(([code,evidence])=>{const position=planets.find(p=>p.code===code),placement=items('HOUSE_PLACEMENTS').find(p=>p.code===code);if(!position||!placement)throw Error('AST_BODY_CANONICAL_BINDING_MISSING');return [code,{...evidence,longitude:position.value,signCode:signCodes[Math.floor(position.value/30)],houseNumber:placement.value}];}));
 const data={schemaVersion:'PHI-OS-AST-DIAGRAM-DATA-v1.0.0',sourceDigests,planets,angles:items('ANGLES'),cusps:items('HOUSE_CUSPS'),placements:items('HOUSE_PLACEMENTS'),aspects:items('ASPECTS'),bodies,rulership:r4Projection.sections.rulership,distribution:r4Projection.sections.elementModality,routes:r5Synthesis.houseRulerSectionRoutes||[],support:r5Synthesis.supportSignals,tension:r5Synthesis.tensionSignals,themes:r5Synthesis.coreThemes,timingAuthorityAvailable:!!timingAuthority,realityContextAvailable:!!realityContext};
 return data;
}
