export const REPORT_COVER_OVERLAY_REGISTRY_VERSION='PHI-OS-REPORT-COVER-OVERLAY-REGISTRY-v1.0.0';
const base=(assetCode,dateFormat,slots)=>Object.freeze({assetCode,dateFormat,timeFormat:'HH : MM',slots:Object.freeze(slots)});
const slots=(name,date,time)=>({name:Object.freeze(name),birthDate:Object.freeze(date),birthTime:Object.freeze(time)});
export const REPORT_COVER_OVERLAY_REGISTRY=Object.freeze({
 BZR:base('RPT-BAZI-P01-COVER-v1','YYYY / MM / DD',slots(
  {left:9.0,top:82.25,width:25.5,height:4.7,align:'center'},
  {left:36.0,top:82.25,width:27.0,height:4.7,align:'center'},
  {left:67.0,top:82.25,width:25.0,height:4.7,align:'center'})),
 ZWR:base('RPT-ZIWEI-P01-COVER-v1','YYYY / MM / DD',slots(
  {left:8.5,top:82.2,width:25.5,height:4.7,align:'center'},
  {left:36.0,top:82.2,width:27.0,height:4.7,align:'center'},
  {left:67.0,top:82.2,width:25.0,height:4.7,align:'center'})),
 AST:base('RPT-ASTROLOGY-P01-COVER-v1','YYYY / MM / DD',slots(
  {left:8.0,top:82.4,width:26.0,height:4.7,align:'center'},
  {left:36.0,top:82.4,width:27.0,height:4.7,align:'center'},
  {left:66.0,top:82.4,width:27.0,height:4.7,align:'center'})),
 NUM:base('RPT-NUM-P01-COVER-v1','YYYY / MM / DD',slots(
  {left:7.0,top:82.2,width:27.0,height:4.7,align:'center'},
  {left:36.0,top:82.2,width:27.0,height:4.7,align:'center'},
  {left:66.0,top:82.2,width:27.0,height:4.7,align:'center'})),
 PROFILE:base('RPT-PROFILE-P01-COVER-v1','YYYY / MM / DD',slots(
  {left:7.0,top:82.0,width:27.0,height:4.7,align:'center'},
  {left:36.0,top:82.0,width:27.0,height:4.7,align:'center'},
  {left:66.0,top:82.0,width:27.0,height:4.7,align:'center'})),
 ECR:base('RPT-ECR-P01-COVER-v1','YYYY / MM / DD',slots(
  {left:14.0,top:78.6,width:26.0,height:4.8,align:'center'},
  {left:42.0,top:78.6,width:22.0,height:4.8,align:'center'},
  {left:66.0,top:78.6,width:22.0,height:4.8,align:'center'})),
 HD:base('RPT-HD-P01-COVER-v1','DD / MM / YYYY',slots(
  {left:10.0,top:77.8,width:27.0,height:4.8,align:'center'},
  {left:39.0,top:77.8,width:27.0,height:4.8,align:'center'},
  {left:69.0,top:77.8,width:23.0,height:4.8,align:'center'})),
 CROSS:base('RPT-CROSS-P01-COVER-v1','YYYY / MM / DD',slots(
  {left:5.0,top:86.0,width:28.0,height:4.2,align:'center'},
  {left:36.0,top:86.0,width:28.0,height:4.2,align:'center'},
  {left:68.0,top:86.0,width:28.0,height:4.2,align:'center'}))
});
export function reportCoverOverlay(methodId){const v=REPORT_COVER_OVERLAY_REGISTRY[String(methodId||'').toUpperCase()];if(!v)throw Error('REPORT_COVER_METHOD_UNREGISTERED');return v;}
