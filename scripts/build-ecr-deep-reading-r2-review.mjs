import fs from 'node:fs';
import {buildEcrHumanRuntime} from '../functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
import {projectEcrHumanRuntimeVisual} from '../functions/embodied-configuration/ecr-human-runtime-visual-projection.js';
import {getEcrCanonicalOntology} from '../functions/embodied-configuration/ecr-ontology-registry.js';
import {buildEcrDeepReadingR2,ECR_DEEP_R2_SECTIONS} from '../functions/ecr-full-report/ecr-deep-reading-r2.js';
import {ECR_PHI_CARD_DECK,ECR_PHI_CARD_ASSETS} from '../functions/ecr-phi-card/ecr-card-runtime-authority.js';
import {quoteReportPresentation} from '../functions/pws/commercial/report-successor-contract.js';
const out='tools/review/phi-configuration-deep-reading-r2-integrated';
const ir=await buildEcrHumanRuntime({canonicalInput:JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json')).cases[0].canonicalInput});
const ontology=getEcrCanonicalOntology();
const layers=JSON.parse(fs.readFileSync('content/embodied-configuration/ecr-layer-registry-v1.json')).layers;
const catalogs=[ontology.ecrSpecific.cosmologicalContext,ontology.coreTheory.grammarCodes,ontology.coreTheory.questionCodes,ontology.coreTheory.capabilities,ontology.coreTheory.drivers,ontology.ecrSpecific.motions,ontology.ecrSpecific.configurations,ontology.ecrSpecific.activations];
const publicPayload={schemaVersion:'ECR-DEEP-R2-PUBLIC-EXPLORER-v1',synthetic:true,fixtureId:'SYNTHETIC-1',paidNarrativeIncluded:false,providerCalls:0,sections:ECR_DEEP_R2_SECTIONS,
 quotes:['zh-Hans','en','bilingual'].map(reportLocale=>quoteReportPresentation('ECR_FULL_REPORT',{reportLocale,reportLanguageMode:reportLocale==='bilingual'?'BILINGUAL':'SINGLE'})),
 layers:layers.map((l,i)=>({...l,catalog:catalogs[i],personalMeaning:'MEANING_NOT_ADMITTED',currentPriority:'UNKNOWN'})),
 visuals:Object.fromEntries(['en','zh-Hans'].map(l=>[l,projectEcrHumanRuntimeVisual(ir,l)])),cards:ECR_PHI_CARD_DECK.cards,assets:ECR_PHI_CARD_ASSETS.assets};
fs.mkdirSync('assets/customer-ui/media/ecr-deep-r2',{recursive:true});
fs.writeFileSync('assets/customer-ui/media/ecr-deep-r2/public-explorer.json',JSON.stringify(publicPayload));
for(const locale of ['zh-Hans','en','bilingual'])fs.writeFileSync(`${out}/review-${locale}.json`,JSON.stringify(buildEcrDeepReadingR2({ir,locale,reviewMode:true}),null,2));
fs.writeFileSync(`${out}/synthetic-calculation.json`,JSON.stringify(ir,null,2));
console.log(JSON.stringify({synthetic:true,layers:publicPayload.layers.map(l=>[l.code,l.catalog?.length]),markers:publicPayload.visuals.en.markers.length,cards:publicPayload.cards.length,reviewOnly:true,providerCalls:0}));
