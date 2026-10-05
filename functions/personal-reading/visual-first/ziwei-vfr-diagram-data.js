import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {normalizeZiweiProductionEvidence} from '../narrative/ziwei-production-composer-r3.js';

export const ZWR_VFR_DIAGRAM_DATA_VERSION='ZWR-VFR-R1-DIAGRAM-DATA-v1';
const arr=v=>Array.isArray(v)?v:[];
const uniq=a=>[...new Set(a.filter(Boolean))];
function palace(s,code){return s.palaces.find(p=>p.palaceCode===code)||null;}
function starsIn(s,codes){return s.placements.filter(p=>codes.includes(p.palaceCode)).map(p=>({placementId:p.entityId,starCode:p.starCode,starClass:p.starClass||null,state:p.state||null,stateKnown:Boolean(p.state),palaceCode:p.palaceCode}));}
function relationshipsIn(s,codes){return s.relationships.filter(r=>codes.includes(r.from)||arr(r.to).some(x=>codes.includes(x))).map(r=>({entityId:r.entityId,entityType:r.entityType,from:r.from,to:arr(r.to),topologyOnly:r.topologyOnly===true,semanticOperator:r.semanticOperator||null}));}
function txIn(s,codes,layers=['NATAL','DA_XIAN','LIU_NIAN']){return s.transformations.filter(t=>codes.includes(t.palaceCode)&&layers.includes(t.layer)).map(t=>({entityId:t.entityId,layer:t.layer,palaceCode:t.palaceCode,targetStarCode:t.targetStarCode,transformationCode:t.transformationCode}));}
function diagram(id,type,dataRefs,data){return {id,type,dataRefs:uniq(dataRefs),data};}

export async function buildZwrVfrDiagramData({evidence}={}){
 const s=normalizeZiweiProductionEvidence(evidence);
 const allCodes=s.palaces.map(p=>p.palaceCode);
 const life=palace(s,allCodes.find(c=>palace(s,c)?.isLifePalace))?.palaceCode||null;
 const body=palace(s,allCodes.find(c=>palace(s,c)?.isBodyPalace))?.palaceCode||null;
 const currentDa=s.timing.find(t=>t.layer==='DA_XIAN')||null;
 const currentYear=s.timing.find(t=>t.layer==='LIU_NIAN')||null;
 const mainStars=s.placements.filter(p=>p.starClass==='MAIN');
 const diagrams=[
  diagram('ZWD-01','TWELVE_PALACE_NATAL_MAP',s.palaces.map(p=>p.entityId||p.palaceCode),{palaces:s.palaces.map(p=>({palaceCode:p.palaceCode,branch:p.branch,isLifePalace:p.isLifePalace===true,isBodyPalace:p.isBodyPalace===true,stars:starsIn(s,[p.palaceCode])}))}),
  diagram('ZWD-02','LIFE_BODY_AXIS',[life,body],{lifePalace:life,bodyPalace:body,lifeStars:life?starsIn(s,[life]):[],bodyStars:body?starsIn(s,[body]):[]}),
  diagram('ZWD-03','PALACE_NETWORK',s.relationships.map(r=>r.entityId),{relationships:relationshipsIn(s,allCodes)}),
  diagram('ZWD-04','KEY_STAR_STRUCTURE',mainStars.map(p=>p.entityId),{stars:mainStars.map(p=>({starCode:p.starCode,palaceCode:p.palaceCode,state:p.state||null,stateKnown:Boolean(p.state)}))}),
  diagram('ZWD-05','FOUR_TRANSFORMATION_ROUTE',s.transformations.map(t=>t.entityId),{transformations:txIn(s,allCodes)}),
  diagram('ZWD-06','CAREER_PALACE_NETWORK',['CAREER',...s.relationships.map(r=>r.entityId)],{focus:'CAREER',palace:palace(s,'CAREER'),stars:starsIn(s,['CAREER']),relationships:relationshipsIn(s,['CAREER']),transformations:txIn(s,['CAREER'])}),
  diagram('ZWD-07','WEALTH_PALACE_NETWORK',['WEALTH',...s.relationships.map(r=>r.entityId)],{focus:'WEALTH',palace:palace(s,'WEALTH'),stars:starsIn(s,['WEALTH']),relationships:relationshipsIn(s,['WEALTH']),transformations:txIn(s,['WEALTH'])}),
  diagram('ZWD-08','RELATIONSHIP_PALACE_NETWORK',['SPOUSE','CHILDREN','FRIENDS'],{focus:['SPOUSE','CHILDREN','FRIENDS'],palaces:['SPOUSE','CHILDREN','FRIENDS'].map(c=>palace(s,c)).filter(Boolean),stars:starsIn(s,['SPOUSE','CHILDREN','FRIENDS']),relationships:relationshipsIn(s,['SPOUSE','CHILDREN','FRIENDS'])}),
  diagram('ZWD-09','FAMILY_SUPPORT_PALACES',['PARENTS','SIBLINGS','FRIENDS'],{focus:['PARENTS','SIBLINGS','FRIENDS'],palaces:['PARENTS','SIBLINGS','FRIENDS'].map(c=>palace(s,c)).filter(Boolean),stars:starsIn(s,['PARENTS','SIBLINGS','FRIENDS']),relationships:relationshipsIn(s,['PARENTS','SIBLINGS','FRIENDS'])}),
  diagram('ZWD-10','PRESSURE_COUNTERWEIGHT_MAP',['HEALTH','WELLBEING',life],{focus:uniq(['HEALTH','WELLBEING',life]),palaces:uniq(['HEALTH','WELLBEING',life]).map(c=>palace(s,c)).filter(Boolean),stars:starsIn(s,uniq(['HEALTH','WELLBEING',life]))}),
  diagram('ZWD-11','NATAL_DAXIAN_LIUNIAN_STACK',s.timing.map(t=>t.layer),{timing:s.timing,transformations:{NATAL:txIn(s,allCodes,['NATAL']),DA_XIAN:txIn(s,allCodes,['DA_XIAN']),LIU_NIAN:txIn(s,allCodes,['LIU_NIAN'])}}),
  diagram('ZWD-12','CURRENT_PALACE_ACTIVATION',['DA_XIAN','LIU_NIAN'],{daXian:currentDa,liuNian:currentYear,currentTransformations:txIn(s,allCodes,['DA_XIAN','LIU_NIAN'])}),
  diagram('ZWD-13','LIFE_CAREER_WEALTH_TRAVEL_CROSS',[life,'CAREER','WEALTH','TRAVEL'],{focus:uniq([life,'CAREER','WEALTH','TRAVEL']),palaces:uniq([life,'CAREER','WEALTH','TRAVEL']).map(c=>palace(s,c)).filter(Boolean),relationships:relationshipsIn(s,uniq([life,'CAREER','WEALTH','TRAVEL'])),stars:starsIn(s,uniq([life,'CAREER','WEALTH','TRAVEL']))}),
  diagram('ZWD-14','TRANSFORMATION_LAYER_COMPARISON',s.transformations.map(t=>t.entityId),{layers:['NATAL','DA_XIAN','LIU_NIAN'].map(layer=>({layer,transformations:txIn(s,allCodes,[layer])}))}),
  diagram('ZWD-15','WHOLE_CHART_NAVIGATION',allCodes,{lifePalace:life,bodyPalace:body,domains:{core:uniq([life,body]),work:['CAREER','TRAVEL'],resources:['WEALTH','PROPERTY'],relationships:['SPOUSE','CHILDREN','FRIENDS'],support:['PARENTS','SIBLINGS'],pressure:['HEALTH','WELLBEING']},timing:s.timing})
 ];
 const seed={schemaVersion:ZWR_VFR_DIAGRAM_DATA_VERSION,methodId:'ZWR',subjectId:s.subjectId,inputFingerprint:s.inputFingerprint,diagramCount:diagrams.length,diagrams,providerCalls:0};
 return deepFreeze({...seed,diagramDataDigest:await sha256Stable(seed)});
}
export default Object.freeze({buildZwrVfrDiagramData,ZWR_VFR_DIAGRAM_DATA_VERSION});
