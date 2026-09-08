import fs from 'node:fs';
import path from 'node:path';
const file=path.resolve(process.argv[2]||'./PHIOS-KIR-R2-24-CASE-COMPOSER-BAKEOFF-RESULTS.json');
const out=path.resolve(process.argv[3]||'./PHIOS-KIR-R2-24-CASE-COMPOSER-BAKEOFF-HUMAN-REVIEW.html');
const d=JSON.parse(fs.readFileSync(file,'utf8'));
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const ids=['OPENAI_LUNA','MISTRAL_SMALL_4','GEMINI_25_FLASH_LITE','DEEPSEEK_V4_FLASH'];
const blind={OPENAI_LUNA:'Provider A',MISTRAL_SMALL_4:'Provider B',GEMINI_25_FLASH_LITE:'Provider C',DEEPSEEK_V4_FLASH:'Provider D'};
const rows=[];
for(const c of d.results){for(const id of ids){const p=c.providers.find(x=>x.providerId===id)||{};rows.push(`<tr><td>${esc(c.caseId)}<br><small>${esc(c.selectionBucket)}</small></td><td>${esc(c.question)}</td><td>${blind[id]}</td><td class="ans">${esc(p.answer||p.error||'NO OUTPUT').replaceAll('\n','<br>')}</td><td>${p.usage?`${p.usage.input||0} in / ${p.usage.output||0} out`:''}<br>$${p.costUsd??''}</td><td>□ answers<br>□ relevant<br>□ depth<br>□ natural<br>□ PHI faithful<br>□ non-repetitive<br>□ no unsupported claim<br>□ ACCEPT</td><td></td></tr>`);}}
const html=`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><title>PHI OS Composer Bake-off Human Review</title><style>body{font-family:system-ui;margin:20px;line-height:1.45}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #bbb;padding:7px;vertical-align:top}th{position:sticky;top:0;background:#fff}.ans{min-width:480px;max-width:720px}small{color:#666}</style><h1>KIR-R2 Composer Bake-off · 24 cases × 4 providers</h1><p>Blind review. Same PHI OS evidence pack and composition contract for every provider. Judge customer-facing quality, not provider reputation.</p><table><thead><tr><th>Case</th><th>Question</th><th>Provider</th><th>Answer</th><th>Usage / Cost</th><th>Review</th><th>Notes</th></tr></thead><tbody>${rows.join('\n')}</tbody></table><hr><p>Provider key is intentionally omitted from the visible table. Keep the separate provider-key JSON closed until review is finished.</p></html>`;
fs.writeFileSync(out,html);
fs.writeFileSync(out.replace(/\.html$/,'-PROVIDER-KEY.json'),JSON.stringify({blind,totals:d.totals||null},null,2)+'\n');
console.log(out);
