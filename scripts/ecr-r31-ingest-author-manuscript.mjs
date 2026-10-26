import fs from 'node:fs';import path from 'node:path';
import {ingestEcrAuthorManuscript,requirePrivateAuthorDirectory} from './lib/ecr-author-case-store.mjs';
import {auditAuthorBilingualPair} from './lib/ecr-author-manuscript-version.mjs';
import {renderEcrAuthorLedPreview} from '../functions/ecr-full-report/ecr-author-led-publication-r31.js';
// Explicit private request file only; never read ChatGPT conversation summaries.
const request=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),directory=requirePrivateAuthorDirectory(request.privateDirectory);
const records=[];for(const item of request.manuscripts||[])records.push(ingestEcrAuthorManuscript({privateDirectory:directory,record:item.record,inputPath:item.inputPath}));
if(!records.length)throw Error('COMPLETE_AUTHOR_MANUSCRIPT_FILES_REQUIRED');
const sectionId=records[0].record.sectionId;if(records.some(r=>r.record.sectionId!==sectionId))throw Error('INGEST_ONE_SECTION_AT_A_TIME');
if(records.some(r=>r.record.calculationRef!==records[0].record.calculationRef))throw Error('BILINGUAL_CALCULATION_VERSION_MISMATCH');
const languages=Object.fromEntries(records.map(r=>[r.record.language,{text:fs.readFileSync(path.join(r.folder,'exact-text.txt'),'utf8'),claims:request.claims?.[r.record.language]||[],claimCoverageComplete:false}]));
const qa=auditAuthorBilingualPair(languages['zh-Hans'],languages.en,{calculationRows:request.calculationRows||[],glossary:request.glossary||[]});
const version=records.map(r=>r.record.manuscriptVersion).join('--'),out=path.join(directory,'previews',sectionId,version);fs.mkdirSync(out,{recursive:true});
if(fs.existsSync(path.join(out,'bilingual-qa.json')))throw Error('PREVIEW_VERSION_ALREADY_EXISTS_USE_NEW_VERSION');
fs.writeFileSync(path.join(out,'bilingual-qa.json'),JSON.stringify(qa,null,2),{flag:'wx'});
if(languages['zh-Hans']&&languages.en){const preview=renderEcrAuthorLedPreview({sectionId,languages,calculationRef:records[0].record.calculationRef,sourceReference:version,localReview:true});fs.writeFileSync(path.join(out,'bilingual-author-preview.html'),preview.html,{flag:'wx'});}
console.log(JSON.stringify({ingestedVersions:records.length,privateStorage:true,authorAcceptanceGranted:false,customerPublishable:false,providerCalls:0}));
