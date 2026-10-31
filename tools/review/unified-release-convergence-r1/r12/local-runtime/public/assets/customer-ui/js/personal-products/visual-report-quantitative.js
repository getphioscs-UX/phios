const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const root=(v,body)=>`<svg viewBox="0 0 680 560" role="img" aria-label="${esc(v.a11ySummary)}"><title>${esc(v.a11ySummary)}</title>${body}</svg>`;
// These encoders consume source values only. No score, rank, bucket or
// percentile is inferred from descriptive text.
export function renderQuantitativeVisual(v){
 const nodes=v.nodes||[],t=v.type;
 if(['DONUT','DISTRIBUTION_RING','STACKED_BAR'].includes(t)){
  if(!nodes.length||nodes.some(n=>!finite(n.value)||n.value<0)||nodes.reduce((a,n)=>a+n.value,0)<=0)throw Error('VRPT_NONNEGATIVE_SOURCE_VALUES_REQUIRED');
  if(!v.unit||v.comparableWithinSource!==true)throw Error('VRPT_COMPARABLE_SOURCE_UNIT_REQUIRED');
  const sum=nodes.reduce((a,n)=>a+n.value,0);let position=0;
  const shapes=nodes.map((n,i)=>{const start=position;position+=n.value/sum;const color=`hsl(${170+i*47} 25% ${38+i%3*10}%)`;
   if(t==='STACKED_BAR')return `<rect x="${60+start*560}" y="150" width="${n.value/sum*560}" height="110" fill="${color}"/><text x="${60+start*560+n.value/sum*280}" y="290" text-anchor="middle">${i+1}</text>`;
   return `<circle cx="220" cy="245" r="145" fill="none" stroke="${color}" stroke-width="55" stroke-dasharray="${n.value/sum*911.062} ${911.062}" stroke-dashoffset="${-start*911.062}" transform="rotate(-90 220 245)"/><text x="440" y="${95+i*35}">${i+1}. ${esc(n.label)}: ${n.value}</text>`;
  }).join('');
  return root(v,shapes+(t==='STACKED_BAR'?nodes.map((n,i)=>`<text x="60" y="${330+i*28}">${i+1}. ${esc(n.label)}: ${n.value}</text>`).join(''):''));
 }
 if(['SCATTER','SPARKLINE'].includes(t)){
  if(nodes.some(n=>!finite(n.x)||!finite(n.y))||!v.xUnit||!v.yUnit)throw Error('VRPT_SOURCE_COORDINATES_REQUIRED');
  const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),x=n=>80+(n.x-minX)/(maxX-minX||1)*520,y=n=>450-(n.y-minY)/(maxY-minY||1)*350;
  if(t==='SPARKLINE'&&nodes.some((n,i)=>i&&n.x<nodes[i-1].x))throw Error('VRPT_SOURCE_SEQUENCE_REQUIRED');
  return root(v,`<path d="M80 80 V450 H620" fill="none" stroke="#80948c"/>${t==='SPARKLINE'?`<polyline points="${nodes.map(n=>`${x(n)},${y(n)}`).join(' ')}" fill="none" stroke="#247579" stroke-width="3"/>`:''}${nodes.map(n=>`<circle cx="${x(n)}" cy="${y(n)}" r="6"/><text x="${x(n)}" y="${y(n)-13}" text-anchor="middle">${esc(n.label)} (${n.x}, ${n.y})</text>`).join('')}<text x="80" y="500">${minX} – ${maxX} ${esc(v.xUnit)}</text><text x="80" y="55">${minY} – ${maxY} ${esc(v.yUnit)}</text>`);
 }
 if(['MATRIX','HEATMAP'].includes(t)){
  if(nodes.some(n=>!n.rowLabel||!n.columnLabel||n.value==null))throw Error('VRPT_SOURCE_MATRIX_CELLS_REQUIRED');
  if(t==='HEATMAP'&&(nodes.some(n=>!finite(n.value))||!v.unit||v.comparableWithinSource!==true))throw Error('VRPT_COMPARABLE_SOURCE_UNIT_REQUIRED');
  const rows=[...new Set(nodes.map(n=>n.rowLabel))],cols=[...new Set(nodes.map(n=>n.columnLabel))],values=nodes.map(n=>n.value),min=Math.min(...values),max=Math.max(...values);
  return `<div class="vrpt-matrix-scroll"><table class="vrpt-matrix"><caption>${esc(v.unit||v.a11ySummary)}</caption><thead><tr><th></th>${cols.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${esc(r)}</th>${cols.map(c=>{const n=nodes.find(n=>n.rowLabel===r&&n.columnLabel===c);return `<td${n&&t==='HEATMAP'?` style="background:hsl(176 22% ${92-(n.value-min)/(max-min||1)*35}%)"`:''}>${n?esc(n.value):'—'}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
 }
 return null;
}
