import fs from'node:fs';
let s=fs.readFileSync('tools/review/numerology-r20/delivery-qa.mjs','utf8').replaceAll('.tmp/numerology-r20/delivery-','.tmp/numerology-r21/delivery-').replaceAll('tools/review/numerology-r20/PDF-RESULTS.json','tools/review/numerology-r21/PDF-RESULTS.json').replaceAll('tools/review/numerology-r20/DELIVERY-QA.json','tools/review/numerology-r21/DELIVERY-QA.json');
s=s.replace('const renderer=async(p,j)=>{',`const editorialPages=JSON.parse(fs.readFileSync('.tmp/numerology-r21/EDITORIAL-PAGES.json'));const editorialDigest=createHash('sha256').update(JSON.stringify(editorialPages)).digest('hex');const editorialAdapter={compose:async({contentDigest})=>({origin:'OFFLINE_HANDOFF_REPLAY',contentDigest,digest:editorialDigest,publicationAllowed:false,pages:editorialPages})};
const renderer=async(p,j)=>{if(p.editorial?.digest!==editorialDigest||p.editorial?.publicationAllowed!==false)throw Error('R21_REPLAY_NOT_FROZEN');`);
s=s.replaceAll('pinnedAuthorityDigest:authority,loadSubject:', 'pinnedAuthorityDigest:authority,editorialAdapter,loadSubject:').replaceAll('3900','5900').replaceAll('4900','6900');
fs.writeFileSync('tools/review/numerology-r21/delivery-qa.mjs',s);
