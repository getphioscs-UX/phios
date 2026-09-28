import {reportCoverFieldFormat} from './report-cover-field-format-registry.js';
export const REPORT_COVER_OVERLAY_REGISTRY_VERSION='PHI-OS-REPORT-COVER-OVERLAY-REGISTRY-v1.0.0';
const base=(methodId,assetCode,slots)=>Object.freeze({assetCode,...reportCoverFieldFormat(methodId),typography:Object.freeze({fontFamily:'Georgia, "Microsoft YaHei", serif',fontMax:16,fontMin:10,lineHeight:1.1,color:'#173047',wrap:false,status:'CANDIDATE_REQUIRES_OWNER_REVIEW'}),slots:Object.freeze(slots)});
const slots=(name,date,time)=>({name:Object.freeze(name),birthDate:Object.freeze(date),birthTime:Object.freeze(time)});
export const REPORT_COVER_OVERLAY_REGISTRY=Object.freeze({
 BZR:base('BZR','RPT-BAZI-P01-COVER-v1',slots(
  {left:9.0,top:82.25,width:25.5,height:4.7,align:'center'},
  {left:36.0,top:84.0,width:27.0,height:1.8,align:'center',mask:true},
  {left:67.0,top:84.0,width:25.0,height:1.8,align:'center',mask:true})),
 ZWR:base('ZWR','RPT-ZIWEI-P01-COVER-v1',slots(
  {left:8.5,top:86.0,width:25.5,height:1.8,align:'center'},
  {left:36.0,top:86.0,width:27.0,height:1.8,align:'center'},
  {left:67.0,top:86.0,width:25.0,height:1.8,align:'center'})),
 AST:base('AST','RPT-ASTROLOGY-P01-COVER-v1',slots(
  {left:8.0,top:85.5,width:26.0,height:1.8,align:'center'},
  {left:36.0,top:85.5,width:27.0,height:1.8,align:'center'},
  {left:66.0,top:85.5,width:27.0,height:1.8,align:'center'})),
 NUM:base('NUM','RPT-NUM-P01-COVER-v1',slots(
  {left:7.0,top:84.4,width:27.0,height:3.8,align:'center'},
  {left:36.0,top:84.4,width:27.0,height:3.8,align:'center'},
  {left:66.0,top:84.4,width:27.0,height:3.8,align:'center'})),
 PROFILE:base('PROFILE','RPT-PROFILE-P01-COVER-v1',slots(
  {left:7.0,top:84.0,width:27.0,height:1.8,align:'center'},
  {left:36.0,top:84.0,width:27.0,height:1.8,align:'center'},
  {left:66.0,top:84.0,width:27.0,height:1.8,align:'center'})),
 ECR:base('ECR','RPT-ECR-P01-COVER-v1',slots(
  {left:21.5,top:80.9,width:18.5,height:3.2,align:'center',mask:true},
  {left:45.0,top:80.9,width:18.5,height:3.2,align:'center',mask:true},
  {left:69.0,top:80.9,width:17.5,height:3.2,align:'center',mask:true})),
 HD:base('HD','RPT-HD-P01-COVER-v1',slots(
  {left:11.0,top:80.8,width:25.0,height:1.7,align:'center',mask:true},
  {left:40.0,top:80.8,width:25.0,height:1.7,align:'center',mask:true},
  {left:70.0,top:80.8,width:21.0,height:1.7,align:'center',mask:true})),
 CROSS:base('CROSS','RPT-CROSS-P01-COVER-v1',slots(
  {left:5.0,top:88.7,width:28.0,height:3.4,align:'center'},
  {left:36.0,top:88.7,width:28.0,height:3.4,align:'center'},
  {left:68.0,top:88.7,width:28.0,height:3.4,align:'center'}))
});
export function reportCoverOverlay(methodId){const v=REPORT_COVER_OVERLAY_REGISTRY[String(methodId||'').toUpperCase()];if(!v)throw Error('REPORT_COVER_METHOD_UNREGISTERED');return v;}
