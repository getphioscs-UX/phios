import {tr} from './runtime-ui.js';
export function rentalMetricText(metric,value){
 const precision=metric?.precision||'UNSPECIFIED';
 const label={EXACT:tr('Exact','准确'),APPROXIMATE:tr('Approximate','约数'),UNKNOWN:tr('Unknown','未知'),UNSPECIFIED:tr('Precision not confirmed','精度未确认')}[precision];
 const reason=metric?.reasons?.length?tr(' — payment, amount or allocation needs confirmation','——付款、金额或分配资料尚需确认'):'';
 return `${value??tr('Unknown','未知')} · ${label}${reason}`;
}
