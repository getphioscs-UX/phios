import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { buildCanonicalPresentation, resolveInformationLayers, resolveTheme, stableDigest } from './lib/canonical-presentation-runtime/presentation-foundation-v1.mjs';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const sha = async path => crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex');
const b = 'content/professional/canonical-presentation-runtime/';
const files = {
  audit:b+'audits/cpr-baseline-audit-v1.json', boundary:b+'audits/cpr-authority-boundary-v1.json', car:b+'audits/cpr-car-reconciliation-v1.json', pds:b+'audits/cpr-pds-reconciliation-v1.json',
  contract:b+'contracts/canonical-presentation-contract-v1.json', infoContract:b+'contracts/cpr-information-layer-runtime-v1.json', pdsMap:b+'contracts/cpr-pds-token-mapping-v1.json', themeContract:b+'contracts/cpr-theme-runtime-v1.json',
  surfaces:b+'registries/surface-registry-v1.json', types:b+'registries/presentation-type-registry-v1.json', layers:b+'registries/information-layer-registry-v1.json', tokens:b+'registries/pds-token-reference-registry-v1.json', themes:b+'registries/theme-registry-v1.json',
  schema:b+'schemas/canonical-presentation-v1.schema.json', valid:b+'fixtures/canonical-presentation.valid.json', invalid:b+'fixtures/canonical-presentation.invalid.json', freeze:b+'freeze/cpr-w0-w6-foundation-freeze-v1.json'
};
const [audit,boundary,car,pds,contract,infoContract,pdsMap,themeContract,surfaceRegistry,typeRegistry,layerRegistry,tokenRegistry,themeRegistry,schema,valid,invalid,freeze] = await Promise.all(Object.values(files).map(readJson));

// CPR-W0
assert.equal(audit.work,'CPR-W0');
assert.equal(audit.baselineCommit,'d116732ef27fd3cc0cbbf29b7b1aa3fb4b3682d3');
assert.ok(audit.sourceSystems.length >= 20);
for (const record of audit.sourceSystems) { assert.equal(record.exists,true); assert.equal(await sha(record.path),record.sha256,`${record.path} drifted after CPR-W0 audit`); }
for (const key of ['cprIsCar','cprIsPds','cprIsKnowledgeIntelligence','cprIsJourneyRuntime','cprMayCreateKnowledge','cprMaySelectMeaning','cprMayInferRelatedNodes','cprMayReorderReadingPriority','cprMayApproveAsset','cprMayPublishAsset','cprMayInferRuntimeState','cprMayDefinePdsTokens','duplicateAuthorityCreated']) assert.equal(boundary.invariants[key],false,`boundary ${key}`);
assert.equal(car.rules.carPresentationTypeRegistryIsNotCprPresentationAuthority,true);
assert.equal(car.rules.cprSurfaceRegistryDoesNotExpandCarPublicationEligibility,true);
assert.equal(pds.rules.pdsTokensReferencedNotCopied,true);
assert.equal(pds.rules.cprThemeIsNotKnowledgeTaxonomyTheme,true);
console.log('✓ CPR-W0 Presentation Foundation Audit passed.');

// CPR-W1
assert.deepEqual(contract.requiredFields,['presentationCode','presentationVersion','surface','presentationType','sourceAssetReferences','sourceProjectionReferences','locale','audience','informationLayer','pdsReferences','accessibilityContract','responsiveContract','renderState']);
const required = schema.required;
for (const field of required) assert.ok(Object.hasOwn(valid, field), `valid fixture missing ${field}`);
assert.match(valid.presentationCode,/^CPR-PRESENT-[A-Z0-9-]+$/);
assert.match(valid.presentationVersion,/^\d+\.\d+\.\d+$/);
assert.ok(schema.properties.surface.enum.includes(valid.surface));
assert.ok(schema.properties.presentationType.enum.includes(valid.presentationType));
assert.ok(valid.sourceAssetReferences.length >= 1);
assert.ok(valid.pdsReferences.tokenReferences.every(token => /^--phi-/.test(token)));
assert.ok(!/^CPR-PRESENT-[A-Z0-9-]+$/.test(invalid.presentationCode) || invalid.sourceAssetReferences.length === 0 || invalid.pdsReferences.tokenReferences.some(token => !/^--phi-/.test(token)), 'invalid canonical presentation must fail');
const builtA=buildCanonicalPresentation({...valid,sourceAssetReferences:['B','A','A'],sourceProjectionReferences:['Z','Y']});
const builtB=buildCanonicalPresentation({...valid,sourceAssetReferences:['A','B'],sourceProjectionReferences:['Y','Z']});
assert.deepEqual(builtA,builtB); assert.equal(stableDigest(builtA),stableDigest(builtB));
assert.throws(()=>buildCanonicalPresentation(invalid),/CPR_PRESENTATION_CODE_INVALID|CPR_PUBLISHED_ASSET_REFERENCE_REQUIRED|CPR_PDS_LITERAL_OR_UNKNOWN_TOKEN_REFERENCE/);
console.log('✓ CPR-W1 Canonical Presentation Contract passed.');

// CPR-W2
const expectedSurfaces=['WEBSITE','BOOK','PDF','ACADEMY','CUSTOMER_WORKSPACE','PROFESSIONAL_WORKSPACE','APP','API','EMAIL','SOCIAL'];
assert.deepEqual(surfaceRegistry.surfaces.map(x=>x.surface),expectedSurfaces); assert.ok(surfaceRegistry.surfaces.every(x=>x.independentSurface && !x.changesPublicationEligibility));
console.log('✓ CPR-W2 Surface Registry passed.');

// CPR-W3
const expectedTypes=['ARTICLE_PAGE','ARTICLE_READING','KNOWLEDGE_CARD','MEANING_CARD','FIGURE_PAGE','FIGURE_CARD','DIAGRAM','CALLOUT','SUMMARY_BLOCK','RELATED_NODES_BLOCK','READING_PATH_BLOCK','TIMELINE','HERO','BOOK_SECTION','ACADEMY_LESSON','QUIZ','REPORT_SECTION','MEDIA_CARD','AUTHORITY_BADGE','PUBLICATION_BADGE','LOCALE_BADGE','JOURNEY_PROGRESS'];
assert.deepEqual(typeRegistry.presentationTypes.map(x=>x.presentationType),expectedTypes); assert.ok(typeRegistry.presentationTypes.every(x=>x.readOnlyByDefault && !x.mayCreateKnowledge && !x.mayInferRuntimeState));
console.log('✓ CPR-W3 Presentation Type Registry passed.');

// CPR-W4
assert.deepEqual(layerRegistry.layers.map(x=>x.pdsLayerId),['customer-primary','customer-confirmation','professional-analysis','technical-record']);
const customerReading=resolveInformationLayers({audience:'CUSTOMER',surface:'WEBSITE',journeyStage:'NOT_APPLICABLE',presentationPurpose:'READING',informationLayerRegistry:layerRegistry,surfaceRegistry});
assert.deepEqual(customerReading.layers,['L1_IMMEDIATE_UNDERSTANDING','L2_CONFIRMATION']);
const customerEnter=resolveInformationLayers({audience:'CUSTOMER',surface:'CUSTOMER_WORKSPACE',journeyStage:'ENTER',presentationPurpose:'EVIDENCE_REVIEW',informationLayerRegistry:layerRegistry,surfaceRegistry});
assert.deepEqual(customerEnter.layers,['L1_IMMEDIATE_UNDERSTANDING']);
const professionalEvidence=resolveInformationLayers({audience:'PROFESSIONAL',surface:'PROFESSIONAL_WORKSPACE',journeyStage:'NOT_APPLICABLE',presentationPurpose:'EVIDENCE_REVIEW',informationLayerRegistry:layerRegistry,surfaceRegistry});
assert.deepEqual(professionalEvidence.layers,['L1_IMMEDIATE_UNDERSTANDING','L2_CONFIRMATION','L3_PROFESSIONAL_EVIDENCE']);
const technical=resolveInformationLayers({audience:'TECHNICAL',surface:'API',journeyStage:'NOT_APPLICABLE',presentationPurpose:'TECHNICAL_INSPECTION',informationLayerRegistry:layerRegistry,surfaceRegistry});
assert.equal(technical.maximumLayer,4);
assert.equal(infoContract.invariants.boundaryDeletedForSpace,false); assert.equal(infoContract.invariants.unknownDeletedForSpace,false);
console.log('✓ CPR-W4 Information Layer Runtime passed.');

// CPR-W5
const css=await fs.readFile('assets/css/tokens.css','utf8');
const cssTokens=new Set([...css.matchAll(/(--phi-[a-z0-9-]+)\s*:/g)].map(m=>m[1]));
const controlledTokens=tokenRegistry.categories.flatMap(c=>c.tokens);
assert.deepEqual(tokenRegistry.categories.map(c=>c.category),['COLOR','TYPOGRAPHY','SPACING','RADIUS','SHADOW','COMPONENT_STATE']);
for(const token of controlledTokens) assert.ok(cssTokens.has(token),`PDS token missing: ${token}`);
assert.equal(pdsMap.invariants.pdsTokenValuesCopiedIntoCpr,false); assert.equal(pdsMap.invariants.secondDesignTokenAuthorityCreated,false);
console.log('✓ CPR-W5 PDS Token Mapping passed.');

// CPR-W6
assert.deepEqual(themeRegistry.themes.map(x=>x.themeCode),['BOOK_1_GOLD','BOOK_2_PURPLE','BOOK_3_EMERALD','BOOK_4_CYAN','NEUTRAL_PUBLIC','PROFESSIONAL']);
const controlled=new Set(controlledTokens);
for(const theme of themeRegistry.themes){
  assert.equal(theme.knowledgeMeaning,false); assert.equal(theme.inheritsRuntimeStateMeaning,false);
  for(const token of Object.values(theme.tokenSet)){ assert.ok(/^--phi-/.test(token)); assert.ok(controlled.has(token),`${theme.themeCode} uses uncontrolled token ${token}`); }
  const serialized=JSON.stringify(theme.tokenSet); assert.equal(/#[0-9a-f]{3,8}|rgba?\(|hsla?\(/i.test(serialized),false,`${theme.themeCode} contains literal color`);
}
const t1=resolveTheme({themeCode:'BOOK_1_GOLD',surface:'WEBSITE',locale:'zh-Hans',themeRegistry,tokenRegistry});
const t2=resolveTheme({themeCode:'BOOK_1_GOLD',surface:'WEBSITE',locale:'zh-Hans',themeRegistry,tokenRegistry});
assert.deepEqual(t1,t2); assert.throws(()=>resolveTheme({themeCode:'BOOK_1_GOLD',surface:'PROFESSIONAL_WORKSPACE',locale:'en',themeRegistry,tokenRegistry}),/CPR_THEME_SURFACE_INELIGIBLE/);
assert.equal(themeContract.semanticIsolation.themeIsKnowledgeMeaning,false); assert.equal(themeContract.semanticIsolation.stateNamedPrimitiveTokenDoesNotTransferStateMeaning,true);
console.log('✓ CPR-W6 Theme Runtime passed.');

for(const output of freeze.outputs) assert.equal(await sha(output),freeze.digests[output],`${output} changed after CPR-W0-W6 freeze`);
assert.equal(freeze.status,'frozen'); assert.equal(freeze.invariants.knowledgeAuthorityDuplicated,false); assert.equal(freeze.invariants.meaningAuthorityDuplicated,false); assert.equal(freeze.invariants.publicationAuthorityDuplicated,false); assert.equal(freeze.invariants.pdsAuthorityDuplicated,false);
console.log('✓ CPR-W0-W6 Presentation Foundation Freeze passed.');
console.log('✓ CPR now owns presentation composition vocabulary and PDS-backed projection only; CAR, PDS, Knowledge, Meaning, Journey and Publication authorities remain upstream.');
