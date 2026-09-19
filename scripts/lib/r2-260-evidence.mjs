import fs from 'node:fs';
import crypto from 'node:crypto';
export const evidenceDir='content/web-production/client-visual-consumption/evidence';
export const csvPath='docs/assets/r2-public/R2-260-DISPLAY-CHECKLIST.csv';
export const baseline='c6983b07b643d982512731a640717fb80ecbb0ea';
export const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
export function parseCsv(text){let rows=[],row=[],field='',quoted=false;for(let i=0;i<text.length;i++){let c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(Boolean))rows.push(row);row=[];field='';}else field+=c;}if(field||row.length){row.push(field);rows.push(row);}rows[0][0]=rows[0][0].replace(/^\uFEFF/,'');return rows;}
export const immutableColumns=[0,1,2,3,4,5,8];
export const rowIdentity=row=>sha(JSON.stringify(immutableColumns.map(i=>row[i])));
export function writeJson(path,data){fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n');}
