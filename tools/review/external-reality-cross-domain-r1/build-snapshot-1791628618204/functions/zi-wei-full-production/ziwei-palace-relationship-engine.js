import {sha256Stable} from '../zi-wei-runtime/zwr-utils.js';
import {BRANCH_ORDER,MAIN_STARS,branchIndex,branchAt,PALACE_ZH} from './ziwei-structural-registry.js';
import {assertZiweiSourceAdmission} from './ziwei-source-admission-authority-v1.js';

export const ZIWEI_PALACE_RELATIONSHIP_SCHEMA='PHI-OS-ZIWEI-PALACE-RELATIONSHIP-ENGINE-v1.0.0';
export const ZIWEI_PALACE_RELATIONSHIP_VERSION='1.0.0';
function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function uniqSorted(values){return [...new Set(values)].sort();}
function palaceLite(p){return freeze({palaceCode:p.palaceCode,palaceZh:p.zh||PALACE_ZH[p.palaceCode]||p.palaceCode,branch:p.branch,stem:p.stem,isLifePalace:p.isLifePalace===true,isBodyPalace:p.isBodyPalace===true});}
export function buildZiweiPalaceRelationshipEngine({chart,placement,starStates,transformationMatrix}={}){
 assertZiweiSourceAdmission();
 if(chart?.schemaVersion!=='PHI-OS-ZIWEI-CANONICAL-CHART-IR-v1.0.0')fail('ZIWEI_FP_W6_CANONICAL_CHART_REQUIRED');
 if(placement?.schemaVersion!=='PHI-OS-ZIWEI-COMPLETE-STAR-PLACEMENT-v1.0.0'||placement.sourceChartDigest!==chart.chartDigest)fail('ZIWEI_FP_W6_PLACEMENT_LINEAGE_REQUIRED');
 if(starStates?.schemaVersion!=='PHI-OS-ZIWEI-STAR-STATE-RESULT-v1.0.0'||starStates.sourcePlacementDigest!==placement.placementDigest)fail('ZIWEI_FP_W6_STAR_STATE_LINEAGE_REQUIRED');
 if(transformationMatrix?.schemaVersion!=='PHI-OS-ZIWEI-FOUR-TRANSFORMATION-MATRIX-v1.0.0'||transformationMatrix.sourceChartDigest!==chart.chartDigest)fail('ZIWEI_FP_W6_TRANSFORMATION_MATRIX_LINEAGE_REQUIRED');
 if(chart.palaces.length!==12||new Set(chart.palaces.map(p=>p.branch)).size!==12||new Set(chart.palaces.map(p=>p.palaceCode)).size!==12)fail('ZIWEI_FP_W6_TWELVE_UNIQUE_PALACES_REQUIRED');
 const byBranch=new Map(chart.palaces.map(p=>[p.branch,p]));
 const byPalace=new Map(chart.palaces.map(p=>[p.palaceCode,p]));
 const starsByPalace=new Map(chart.palaces.map(p=>[p.palaceCode,placement.allStars.filter(s=>s.palaceCode===p.palaceCode)]));
 const stateByCode=new Map(starStates.stars.map(s=>[s.starCode,s.state]));
 const txByPalace=new Map(transformationMatrix.palaceMatrix.map(p=>[p.palaceCode,p]));
 const relationRefs=[];
 const networks=chart.palaces.map(target=>{
   const i=branchIndex(target.branch);
   const opposite=byBranch.get(branchAt(i+6));
   const triadA=byBranch.get(branchAt(i+4)),triadB=byBranch.get(branchAt(i+8));
   const previous=byBranch.get(branchAt(i-1)),next=byBranch.get(branchAt(i+1));
   if(!opposite||!triadA||!triadB||!previous||!next)fail('ZIWEI_FP_W6_RELATION_GEOMETRY_INCOMPLETE');
   const ownStars=starsByPalace.get(target.palaceCode)||[];
   const ownMain=ownStars.filter(s=>MAIN_STARS.includes(s.starCode));
   const oppStars=starsByPalace.get(opposite.palaceCode)||[];
   const oppMain=oppStars.filter(s=>MAIN_STARS.includes(s.starCode));
   const isEmpty=ownMain.length===0;
   const sanFangSiZheng=[target,triadA,triadB,opposite].map(palaceLite);
   const refs={
     opposite:`OPPOSITE:${target.palaceCode}:${opposite.palaceCode}`,
     triads:[`TRIAD:${target.palaceCode}:${triadA.palaceCode}`,`TRIAD:${target.palaceCode}:${triadB.palaceCode}`],
     flanks:[`FLANK:${previous.palaceCode}:${target.palaceCode}`,`FLANK:${target.palaceCode}:${next.palaceCode}`],
     emptyBorrow:isEmpty?`EMPTY_OPPOSITE_REFERENCE:${target.palaceCode}:${opposite.palaceCode}`:null
   };
   relationRefs.push(refs.opposite,...refs.triads,...refs.flanks,...(refs.emptyBorrow?[refs.emptyBorrow]:[]));
   return freeze({
     target:palaceLite(target),opposite:palaceLite(opposite),triadPalaces:[palaceLite(triadA),palaceLite(triadB)],sanFangSiZheng,
     flankingPalaces:{previous:palaceLite(previous),next:palaceLite(next),geometryOnly:true,starPatternInterpretationDeferred:true},
     stars:{all:ownStars.map(s=>({starCode:s.starCode,starClass:s.starClass,state:stateByCode.get(s.starCode)||null})),main:ownMain.map(s=>s.starCode)},
     transformations:txByPalace.get(target.palaceCode)?.byLayer||{NATAL:[],DA_XIAN:[],LIU_NIAN:[]},
     emptyPalace:{isEmptyMainStarPalace:isEmpty,definition:'NO_FOURTEEN_MAIN_STAR_IN_TARGET_PALACE',oppositeMainStarReference:isEmpty?oppMain.map(s=>s.starCode):[],borrowPolicy:isEmpty?'OPPOSITE_MAIN_STAR_REFERENCE_ONLY':'NOT_APPLICABLE',borrowedStarPlacementCreated:false,borrowedMeaningCreated:false},
     relationRefs:refs
   });
 });
 const oppositeSeen=new Set(),oppositePairs=[];
 for(const n of networks){const key=uniqSorted([n.target.palaceCode,n.opposite.palaceCode]).join('|');if(!oppositeSeen.has(key)){oppositeSeen.add(key);oppositePairs.push(freeze({pairId:`OPP-${key}`,a:n.target,b:n.opposite}));}}
 const trineSeen=new Set(),trineGroups=[];
 for(const n of networks){const three=n.sanFangSiZheng.slice(0,3);const key=uniqSorted(three.map(x=>x.branch)).join('|');if(!trineSeen.has(key)){trineSeen.add(key);trineGroups.push(freeze({trineId:`TRINE-${key}`,palaces:three}));}}
 const adjacencySeen=new Set(),adjacencyPairs=[];
 for(const n of networks){for(const x of [n.flankingPalaces.previous,n.flankingPalaces.next]){const key=uniqSorted([n.target.palaceCode,x.palaceCode]).join('|');if(!adjacencySeen.has(key)){adjacencySeen.add(key);adjacencyPairs.push(freeze({adjacencyId:`ADJ-${key}`,a:n.target,b:x}));}}}
 const emptyPalaces=networks.filter(n=>n.emptyPalace.isEmptyMainStarPalace).map(n=>freeze({palaceCode:n.target.palaceCode,palaceZh:n.target.palaceZh,branch:n.target.branch,oppositePalaceCode:n.opposite.palaceCode,oppositeMainStarReference:n.emptyPalace.oppositeMainStarReference}));
 if(oppositePairs.length!==6||trineGroups.length!==4||adjacencyPairs.length!==12)fail('ZIWEI_FP_W6_CANONICAL_RELATION_COUNTS_FAILED');
 const base={schemaVersion:ZIWEI_PALACE_RELATIONSHIP_SCHEMA,work:'ZIWEI-FP-W6',runtimeVersion:ZIWEI_PALACE_RELATIONSHIP_VERSION,scopeCode:'TWELVE_PALACE_SAN_FANG_SI_ZHENG_OPPOSITE_FLANK_EMPTY_V1',sourceChartDigest:chart.chartDigest,sourcePlacementDigest:placement.placementDigest,sourceStarStateDigest:starStates.stateDigest,sourceTransformationMatrixDigest:transformationMatrix.matrixDigest,networks,oppositePairs,trineGroups,adjacencyPairs,emptyPalaces,relationRefs:uniqSorted(relationRefs),coverage:{palaces:12,oppositePairs:6,trineGroups:4,sanFangSiZhengNetworks:12,adjacencyPairs:12,flankingNetworks:12,emptyPalaceDetection:12,emptyPalaceBorrowReferences:emptyPalaces.length},authority:{geometry:'CANONICAL_12_BRANCH_OFFSETS_V1',oppositeOffset:6,triadOffsets:[4,8],flankOffsets:[-1,1],emptyPalaceDefinition:'NO_MAIN_STAR',sourceAdmission:'ZIWEI-SOURCE-CLAIM-BATCH-001:HUMAN_ADMITTED_29_OF_29'},boundaries:{sourceChartMutated:false,starPlacementMutated:false,starStateMutated:false,transformationMatrixMutated:false,borrowedStarPlacementCreated:false,borrowedMeaningCreated:false,flankPatternInterpreted:false,relationshipGoodBadScoreCreated:false,interpretationCreated:false,fortunePredictionCreated:false,professionalJudgmentCreated:false,customerCutoverAllowed:false}};
 return freeze({...base,relationshipDigest:sha256Stable(base)});
}
export default Object.freeze({buildZiweiPalaceRelationshipEngine});
