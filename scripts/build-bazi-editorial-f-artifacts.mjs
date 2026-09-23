import fs from 'node:fs';
import {withEditorialMeaningBrief,STYLE_CONTRACTS,MEANING_CANON_VERSION} from '../functions/personal-reading/narrative/bazi-editorial-quality.js';
const source=JSON.parse(fs.readFileSync('functions/personal-reading/narrative/bazi-t3-preview-packs.generated.json'));
const root='docs/guided-report-successor-r2/editorial-f';fs.mkdirSync(root,{recursive:true});
const canon={version:MEANING_CANON_VERSION,meaningCreated:false,sections:{}},briefs={};
for(const [key,value] of Object.entries(source.packs).filter(([key])=>key.startsWith('BASELINE_NOW:'))){
 const p=await withEditorialMeaningBrief(value);canon.sections[key]=p.meaningCanon;
 briefs[key]={canonicalEvidenceHash:p.canonicalEvidenceHash,briefDigest:p.sectionNarrativeBriefDigest,brief:p.sectionNarrativeBrief};
}
for(const [name,data] of [['BAZI_EDITORIAL_MEANING_CANON_V1',canon],['section-narrative-briefs',briefs],['locale-style-contracts',STYLE_CONTRACTS]])fs.writeFileSync(`${root}/${name}.json`,JSON.stringify(data,null,2)+'\n');
console.log('Built baseline meaning canon, deterministic briefs and separate locale style contracts. No model called.');
