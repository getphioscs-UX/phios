export const PHI_MANDALA_VIEWBOX_SIZE=800;
export const PHI_MANDALA_CENTER=Object.freeze({x:400,y:400});
export const PHI_MANDALA_LAYER_GEOMETRY=Object.freeze({
  CC12:Object.freeze({innerRadius:338,outerRadius:380,padDegrees:.8,labelRadius:359}),
  G16:Object.freeze({innerRadius:300,outerRadius:334,padDegrees:.7,labelRadius:317}),
  Q16:Object.freeze({innerRadius:262,outerRadius:296,padDegrees:.7,labelRadius:279}),
  R9:Object.freeze({nodeRadius:242,nodeSize:12}),
  D12:Object.freeze({innerRadius:184,outerRadius:218,barWidth:8,labelRadius:226}),
  M8:Object.freeze({innerRadius:148,outerRadius:178,padDegrees:1.2,labelRadius:163}),
  H64:Object.freeze({innerRadius:118,outerRadius:144,padDegrees:.35,labelRadius:131}),
  A8:Object.freeze({innerRadius:84,outerRadius:112,padDegrees:1.5,labelRadius:98}),
  CORE:Object.freeze({radius:76})
});

const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export const degToRad=degrees=>finite(degrees)*Math.PI/180;
export const normalizeDegrees=degrees=>((finite(degrees)%360)+360)%360;

export function polarPoint(radius,angleDegrees,center=PHI_MANDALA_CENTER){
  const angle=degToRad(normalizeDegrees(angleDegrees));
  return Object.freeze({x:center.x+radius*Math.cos(angle),y:center.y+radius*Math.sin(angle)});
}

export function sectorAngles(ordinal,count,{offsetDegrees=-90,padDegrees=0}={}){
  const n=Math.max(1,Math.floor(finite(count,1))),index=clamp(Math.floor(finite(ordinal,1))-1,0,n-1),step=360/n,pad=clamp(finite(padDegrees),0,Math.max(0,step*.45));
  const rawStart=offsetDegrees+index*step,rawEnd=rawStart+step;
  return Object.freeze({start:rawStart+pad/2,end:rawEnd-pad/2,mid:rawStart+step/2,step,index,ordinal:index+1,count:n});
}

export function annularSectorPath({innerRadius,outerRadius,startAngle,endAngle,center=PHI_MANDALA_CENTER}={}){
  const inner=Math.max(0,finite(innerRadius)),outer=Math.max(inner,finite(outerRadius)),start=finite(startAngle),end=finite(endAngle),span=Math.max(.0001,Math.abs(end-start)),largeArc=span>180?1:0;
  const outerStart=polarPoint(outer,start,center),outerEnd=polarPoint(outer,end,center),innerEnd=polarPoint(inner,end,center),innerStart=polarPoint(inner,start,center);
  if(inner===0)return `M ${center.x} ${center.y} L ${outerStart.x.toFixed(3)} ${outerStart.y.toFixed(3)} A ${outer} ${outer} 0 ${largeArc} 1 ${outerEnd.x.toFixed(3)} ${outerEnd.y.toFixed(3)} Z`;
  return `M ${outerStart.x.toFixed(3)} ${outerStart.y.toFixed(3)} A ${outer} ${outer} 0 ${largeArc} 1 ${outerEnd.x.toFixed(3)} ${outerEnd.y.toFixed(3)} L ${innerEnd.x.toFixed(3)} ${innerEnd.y.toFixed(3)} A ${inner} ${inner} 0 ${largeArc} 0 ${innerStart.x.toFixed(3)} ${innerStart.y.toFixed(3)} Z`;
}

export function ringSegmentGeometry(ordinal,count,layer,{offsetDegrees=-90}={}){
  if(!layer)throw new TypeError('PHI_MANDALA_LAYER_GEOMETRY_REQUIRED');
  const angles=sectorAngles(ordinal,count,{offsetDegrees,padDegrees:layer.padDegrees||0});
  const label=polarPoint(layer.labelRadius??((layer.innerRadius+layer.outerRadius)/2),angles.mid);
  return Object.freeze({...angles,path:annularSectorPath({innerRadius:layer.innerRadius,outerRadius:layer.outerRadius,startAngle:angles.start,endAngle:angles.end}),label});
}

export function circularNodeGeometry(ordinal,count,radius=PHI_MANDALA_LAYER_GEOMETRY.R9.nodeRadius,{offsetDegrees=-90}={}){
  const angles=sectorAngles(ordinal,count,{offsetDegrees,padDegrees:0}),point=polarPoint(radius,angles.mid);
  return Object.freeze({...angles,...point});
}

export function connectorGeometry(from,to){
  if(!from||!to)throw new TypeError('PHI_MANDALA_CONNECTOR_POINTS_REQUIRED');
  return Object.freeze({x1:finite(from.x),y1:finite(from.y),x2:finite(to.x),y2:finite(to.y)});
}

export function radialBarGeometry(ordinal,count,value,maxValue,{innerRadius=PHI_MANDALA_LAYER_GEOMETRY.D12.innerRadius,outerRadius=PHI_MANDALA_LAYER_GEOMETRY.D12.outerRadius,offsetDegrees=-90}={}){
  const angles=sectorAngles(ordinal,count,{offsetDegrees,padDegrees:0}),ratio=clamp(maxValue>0?finite(value)/finite(maxValue):0,0,1),endRadius=innerRadius+(outerRadius-innerRadius)*ratio,start=polarPoint(innerRadius,angles.mid),end=polarPoint(endRadius,angles.mid),label=polarPoint(outerRadius+9,angles.mid);
  return Object.freeze({...angles,ratio,start,end,label,endRadius});
}

export function textRotation(angleDegrees,{tangent=true}={}){
  let angle=normalizeDegrees(angleDegrees)+(tangent?90:0);if(angle>90&&angle<270)angle+=180;return normalizeDegrees(angle);
}

export function geometrySummary(){
  return Object.freeze({viewBoxSize:PHI_MANDALA_VIEWBOX_SIZE,center:PHI_MANDALA_CENTER,layers:PHI_MANDALA_LAYER_GEOMETRY,semanticSelectionPerformed:false,longitudeToSemanticMappingPerformed:false});
}

export default Object.freeze({PHI_MANDALA_VIEWBOX_SIZE,PHI_MANDALA_CENTER,PHI_MANDALA_LAYER_GEOMETRY,polarPoint,sectorAngles,annularSectorPath,ringSegmentGeometry,circularNodeGeometry,connectorGeometry,radialBarGeometry,textRotation,geometrySummary});
