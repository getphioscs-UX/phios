import fs from 'node:fs';
const p='tools/review/cfp-rockwills-r1/outputs.mjs';let b=fs.readFileSync(p,'utf8');
if(!b.includes('td.money'))b=b.replace('table{width:100%;border-collapse:collapse;font-size:9pt}','table{width:100%;border-collapse:collapse;font-size:9pt}td.money{white-space:nowrap;min-width:84px}');
b=b.replace("r.map(x=>'<td>'+esc(x)+'</td>')","r.map(x=>'<td'+(/^-?[0-9,]+[.][0-9]{2}$/.test(String(x))?' class=\"money\"':'')+'>'+esc(x)+'</td>')");
fs.writeFileSync(p,b);console.log('NUMERIC_WRAP_REPAIRED');
