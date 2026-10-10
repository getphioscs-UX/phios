import { YIN_WHEEL, mod } from './zwr-utils.js';
const ZIWEI_GROUP=[['ZI_WEI',0],['TIAN_JI',1],['TAI_YANG',3],['WU_QU',4],['TIAN_TONG',5],['LIAN_ZHEN',8]];
const TIANFU_GROUP=[['TIAN_FU',0],['TAI_YIN',1],['TAN_LANG',2],['JU_MEN',3],['TIAN_XIANG',4],['TIAN_LIANG',5],['QI_SHA',6],['PO_JUN',10]];
function startIndices(lunarDay,bureau){
  let offset=0; while((lunarDay+offset)%bureau!==0) offset++;
  let quotient=Math.floor((lunarDay+offset)/bureau)%12;
  let ziwei=quotient-1;
  ziwei=offset%2===0 ? ziwei+offset : ziwei-offset;
  ziwei=mod(ziwei,12);
  return {ziweiIndex:ziwei,tianfuIndex:mod(12-ziwei,12),offset,quotient};
}
export function placeZiWeiMainStars(calendar,palaceStructure){
  const day=calendar?.lunar?.lunarDay; const bureau=palaceStructure?.fiveElementBureau?.bureau;
  if(!Number.isInteger(day)||!Number.isInteger(bureau)) throw Object.assign(new Error('Calendar lunar day and five-element bureau required'),{code:'ZWR_MAIN_STAR_INPUT_REQUIRED'});
  const start=startIndices(day,bureau); const stars=[];
  for(const [starCode,off] of ZIWEI_GROUP){ const i=mod(start.ziweiIndex-off,12); stars.push({starCode,group:'ZI_WEI_GROUP',branch:YIN_WHEEL[i],wheelIndex:i}); }
  for(const [starCode,off] of TIANFU_GROUP){ const i=mod(start.tianfuIndex+off,12); stars.push({starCode,group:'TIAN_FU_GROUP',branch:YIN_WHEEL[i],wheelIndex:i}); }
  return {schemaVersion:'PHI-OS-ZWR-MAIN-STAR-PLACEMENT-v1.0.0',start,stars,starCount:stars.length,brightnessIncluded:false,interpretationIncluded:false};
}
export const _test={startIndices,ZIWEI_GROUP,TIANFU_GROUP};
