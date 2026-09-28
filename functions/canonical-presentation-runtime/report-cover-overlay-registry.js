import {reportCoverFieldFormat} from './report-cover-field-format-registry.js';
export const REPORT_COVER_OVERLAY_REGISTRY_VERSION='PHI-OS-REPORT-COVER-OVERLAY-REGISTRY-v1.0.0';
const base=(methodId,assetCode,slots)=>Object.freeze({assetCode,...reportCoverFieldFormat(methodId),slots:Object.freeze(slots)});
const slots=(name,date,time)=>({name:Object.freeze(name),birthDate:Object.freeze(date),birthTime:Object.freeze(time)});
export const REPORT_COVER_OVERLAY_REGISTRY=Object.freeze({
 BZR:base('BZR','RPT-BAZI-P01-COVER-v1',slots(
  {left:9.0,top:82.25,width:25.5,height:4.7,align:'center'},
  {left:36.0,top:82.25,width:27.0,height:4.7,align:'center'},
  {left:67.0,top:82.25,width:25.0,height:4.7,align:'center'})),
 ZWR:base('ZWR','RPT-ZIWEI-P01-COVER-v1',slots(
  {left:8.5,top:84.3,width:25.5,height:3.8,align:'center'},
  {left:36.0,top:84.3,width:27.0,height:3.8,align:'center'},
  {left:67.0,top:84.3,width:25.0,height:3.8,align:'center'})),
 AST:base('AST','RPT-ASTROLOGY-P01-COVER-v1',slots(
  {left:8.0,top:84.0,width:26.0,height:3.8,align:'center'},
  {left:36.0,top:84.0,width:27.0,height:3.8,align:'center'},
  {left:66.0,top:84.0,width:27.0,height:3.8,align:'center'})),
 NUM:base('NUM','RPT-NUM-P01-COVER-v1',slots(
  {left:7.0,top:84.4,width:27.0,height:3.8,align:'center'},
  {left:36.0,top:84.4,width:27.0,height:3.8,align:'center'},
  {left:66.0,top:84.4,width:27.0,height:3.8,align:'center'})),
 PROFILE:base('PROFILE','RPT-PROFILE-P01-COVER-v1',slots(
  {left:7.0,top:82.0,width:27.0,height:4.7,align:'center'},
  {left:36.0,top:82.0,width:27.0,height:4.7,align:'center'},
  {left:66.0,top:82.0,width:27.0,height:4.7,align:'center'})),
 ECR:base('ECR','RPT-ECR-P01-COVER-v1',slots(
  {left:14.0,top:81.0,width:26.0,height:3.8,align:'center'},
  {left:42.0,top:81.0,width:22.0,height:3.8,align:'center'},
  {left:66.0,top:81.0,width:22.0,height:3.8,align:'center'})),
 HD:base('HD','RPT-HD-P01-COVER-v1',slots(
  {left:10.0,top:79.6,width:27.0,height:3.8,align:'center'},
  {left:39.0,top:79.6,width:27.0,height:3.8,align:'center'},
  {left:69.0,top:79.6,width:23.0,height:3.8,align:'center'})),
 CROSS:base('CROSS','RPT-CROSS-P01-COVER-v1',slots(
  {left:5.0,top:88.7,width:28.0,height:3.4,align:'center'},
  {left:36.0,top:88.7,width:28.0,height:3.4,align:'center'},
  {left:68.0,top:88.7,width:28.0,height:3.4,align:'center'}))
});
export function reportCoverOverlay(methodId){const v=REPORT_COVER_OVERLAY_REGISTRY[String(methodId||'').toUpperCase()];if(!v)throw Error('REPORT_COVER_METHOD_UNREGISTERED');return v;}
