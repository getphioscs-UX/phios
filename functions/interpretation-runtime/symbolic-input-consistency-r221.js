import {sha256Hex} from '../commerce/commerce-crypto.js';
const arr=x=>Array.isArray(x)?x:[],same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=code=>{throw Object.assign(Error(code),{code});};
export async function assertSymbolicInputConsistency(pack,expected={}){
 if(!['TAROT','I_CHING'].includes(pack.method)||expected.method&&pack.method!==expected.method)fail('SYMBOLIC_INPUT_METHOD_MISMATCH');
 if(!['en','zh-Hans'].includes(pack.language)||expected.language&&pack.language!==expected.language)fail('SYMBOLIC_INPUT_LANGUAGE_MISMATCH');
 if(expected.question&&pack.question.normalize('NFKC').trim()!==expected.question.normalize('NFKC').trim())fail('SYMBOLIC_INPUT_QUESTION_MISMATCH');
 if(expected.promptVersion&&pack.promptVersion!==expected.promptVersion)fail('SYMBOLIC_INPUT_PROMPT_VERSION_MISMATCH');
 const units=arr(pack.sourceUnits),sources=arr(pack.sourceDisclosure?.sources);
 if(pack.method==='TAROT')for(const u of units){const s=sources.find(s=>s.cardId===u.evidenceRef);for(const c of arr(s?.editorialClaims))for(const [a,b]of [[c.lensLabelEn,u.sourceLens?.en],[c.lensLabelZhHans,u.sourceLens?.zhHans],[c.claimEn,u.sourceText?.en],[c.claimZhHans,u.sourceText?.zhHans]])if(typeof a==='string'&&typeof b==='string'&&a!==b)fail('SYMBOLIC_SOURCE_DISCLOSURE_VERSION_MISMATCH');}
 if(pack.method==='I_CHING'){
  const p=pack.confirmedProjection,e=pack.confirmedEvidence,lines=arr(e?.sixLines);
  if(lines.length!==6||p?.lineOrder!=='BOTTOM_TO_TOP')fail('SYMBOLIC_INPUT_LINE_EVIDENCE_MISMATCH');
  const bits=[],related=[],moving=[];for(let i=0;i<6;i++){const l=lines[i],v=l.lineValue,b=(v===7||v===9)?1:0,r=v===6?1:v===9?0:b,c=v===6||v===9;if(l.position!==i+1||![6,7,8,9].includes(v)||l.primaryBit!==b||l.relatingBit!==r||l.changing!==c||!same(l,p.lines?.[i]))fail('SYMBOLIC_INPUT_LINE_EVIDENCE_MISMATCH');bits.push(b);related.push(r);if(c)moving.push(i+1);}
  if(!same(bits,p.primary?.lineStructure)||bits.join('')!==p.primary?.binary||!same(related,p.relating?.lineStructure)||related.join('')!==p.relating?.binary)fail('SYMBOLIC_INPUT_HEXAGRAM_MISMATCH');
  if(!same(moving,p.changingLines)||Array.isArray(e.changingLines)&&!same(e.changingLines,moving))fail('SYMBOLIC_INPUT_CHANGING_LINES_MISMATCH');
  for(const u of units){if(u.role==='PRIMARY'&&u.hexagramId!==p.primary.hexagramId||u.role==='RELATING'&&u.hexagramId!==p.relating.hexagramId||u.linePosition&&!moving.includes(u.linePosition))fail('SYMBOLIC_INPUT_SOURCE_ROLE_MISMATCH');if(u.sourceId){const matches=sources.filter(s=>s.sourceId===u.sourceId);if(!matches.some(s=>arr(s.sourceUnits).some(d=>d.sourceLocator===u.provenance?.sourceLocator)))fail('SYMBOLIC_INPUT_SOURCE_DISCLOSURE_MISSING');}}
 }
 for(const m of arr(pack.sourceDisclosure?.sourceUnitManifest)){const u=units.find(u=>u.evidenceRef===m.evidenceRef);if(!u||await sha256Hex(JSON.stringify(u))!==m.sha256)fail('SYMBOLIC_SOURCE_DISCLOSURE_VERSION_MISMATCH');}
 return {status:'CONSISTENT',scope:'Input identity/coordinate/version consistency only, not semantic model acceptance'};
}

export async function alignIChingModelInput(input){
 const pack=structuredClone(input);if(pack.method!=='I_CHING')return pack;
 if(pack.sourceDisclosure?.sourceUnitManifest)await assertSymbolicInputConsistency(pack);
 const e=pack.confirmedEvidence,p=pack.confirmedProjection;
 // Omit only the known unpopulated raw-layer placeholders. All derived
 // figures remain solely in the existing upstream projection; no recast.
 if(e?.primaryHexagram===null&&e?.relatingHexagram===null&&Array.isArray(e.changingLines)&&e.changingLines.length===0&&p?.changingLines?.length){delete e.primaryHexagram;delete e.relatingHexagram;delete e.changingLines;e.derivedFigureAuthority='confirmedProjection';}
 for(const u of arr(pack.sourceUnits).filter(u=>u.sourceId)){const s=arr(pack.sourceDisclosure?.sources).find(s=>s.sourceId===u.sourceId);if(!s)fail('SYMBOLIC_INPUT_SOURCE_DISCLOSURE_MISSING');s.sourceUnits=arr(s.sourceUnits);if(!s.sourceUnits.some(d=>d.sourceLocator===u.provenance?.sourceLocator))s.sourceUnits.push({unitType:u.linePosition?'LINE':'HEXAGRAM',sourceHeading:u.hexagramId,sourceUrl:s.digitalWitness,sourceLocator:u.provenance?.sourceLocator,role:u.role,linePosition:u.linePosition,evidenceRef:u.evidenceRef});}
 pack.sourceDisclosure.sourceUnitManifest=[];for(const u of arr(pack.sourceUnits))pack.sourceDisclosure.sourceUnitManifest.push({evidenceRef:u.evidenceRef,sha256:await sha256Hex(JSON.stringify(u))});
 await assertSymbolicInputConsistency(pack);return pack;
}
