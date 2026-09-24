import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root='content/astronomy/chiron-r1';
const write=(path,value)=>{fs.mkdirSync(`${root}/${path.slice(0,path.lastIndexOf('/'))}`,{recursive:true});fs.writeFileSync(`${root}/${path}`,JSON.stringify(value,null,2)+'\n');};
const owners=[
 ['canonicalBirth','functions/method-client-delivery/canonical-birth-input-runtime.js','SHARED'],
 ['utcNormalization','functions/embodied-configuration/ecr-calculation-runtime.js','METHOD_SPECIFIC'],
 ['primaryEphemeris','functions/method-client-delivery/production-adapters/astronomy-engine-production-adapter.js','PRODUCTION_ACTIVE'],
 ['nodeProvider','functions/core-method-runtime/ast-lunar-node-adapter.js','SHARED'],
 ['currentEcrWrapper','functions/embodied-configuration/ecr-shared-initialization-capability.js','METHOD_SPECIFIC'],
 ['reusedCoreAdapter','functions/professional/hdr-internal/hdr-internal-astronomy-adapter.js','METHOD_SPECIFIC'],
 ['designMoment','functions/core-method-runtime/hdr-design-moment-runtime.js','SHARED'],
 ['houseImplementation','functions/core-method-runtime/ast-house-runtime.js','VALIDATION_ONLY'],
 ['aspectImplementation','functions/core-method-runtime/ast-aspect-runtime.js','VALIDATION_ONLY'],
 ['bodyAndZodiacPolicy','content/professional/method-governance/successors/ast-production-policy-successor-v1.json','PRODUCTION_ACTIVE']
 ].map(([capability,path,classification])=>({capability,path,classification,sha256:createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));
write('audit/shared-astronomy-current-owner-audit-v1.json',{
 baseline:'241aab892549432ed1903517b7bf263d0fa2d9fc',owners,
 callGraph:['ECR initialization -> ECR shared wrapper -> existing HDR internal adapter -> AST production adapter + TRUE_NODE.V1','ECR Design -> existing 88-degree solar arc solver -> same core astronomy'],
 primaryProvider:{code:'ASTRONOMY_ENGINE_JS',version:'2.1.19',license:'MIT',chiron:'ABSENT',decision:'CASE_B_REQUIRED'},
 output:{longitude:'longitude [0,360)',latitude:'latitude [-90,90]',distance:'distanceAu',speed:'speedLongitudeDegreesPerDay; centered +/-1 hour difference',retrograde:'speed < 0',frame:'TRUE_ECLIPTIC_OF_DATE_ECT'},
 derivedGeometry:{zodiac:{classification:'PRODUCTION_ACTIVE',policy:'PHI_OS_AST_TROPICAL_ZODIAC_V1'},houses:{classification:'DEFERRED',existingCode:'VALIDATION_ONLY',productionPolicyAdmitted:false},aspects:{classification:'DEFERRED',existingCode:'VALIDATION_ONLY',productionPolicyAdmitted:false}},
 runtime:{core:'Existing Pages-compatible JS provider',extendedMinorBody:'NOT_YET_ADMITTED'},
 tests:['check:mir-3','check:mir-3-node-production','check:ecr-human-runtime-v4-1'],
 fixtures:'content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json',
 conclusions:['HDR is a consumer/adapter path, not the new astronomy owner','No house system or orb defaults admitted','No Chiron interpretation or customer admission implied']});
write('contracts/chiron-body-identity-v1.json',{bodyCode:'CHIRON',canonicalName:'Chiron',astronomicalObject:'2060 Chiron',taxonomy:'CENTAUR / MINOR_BODY',majorPlanet:false,owner:'SHARED_ASTRONOMY'});
write('provider/chiron-provider-decision-v1.json',{status:'BLOCKED_PROVIDER_DECISION',selectedProvider:null,positionFreeze:'BLOCKED_PROVIDER_DECISION',
 ownerDecision:{date:'2026-09-24',swissProfessionalLicense:false,agplAuthorized:false,projectLicenseChangeAllowed:false,onlineProductionDependencyAuthorized:false},
 candidates:[{provider:'SWISS_EPHEMERIS',status:'CANDIDATE_NOT_AUTHORIZED',reason:'Owner explicitly confirms no Professional License and no authorization for AGPL. Do not import, install or adopt this provider; native/WASM compatibility and independent validation remain unverified.',source:'https://www.astro.com/swisseph/swephprg.htm'},
 {provider:'NASA_JPL_HORIZONS',status:'PENDING',reason:'Current core authority uses Horizons as VALIDATION_ONLY. A new runtime data/provider role requires pinned provenance, offline repeatability or explicit network policy, independent reference and precision acceptance. Not silently promoted.',source:'https://ssd-api.jpl.nasa.gov/doc/horizons.html'}],
 gates:{commercialUse:'PENDING',redistribution:'PENDING',ephemerisDataRights:'PENDING',cloudflareCompatibility:'NOT_VERIFIED',bundleSize:'NOT_MEASURED',networkDependency:'UNDECIDED',offlineDeterminism:'NOT_VERIFIED',coldStart:'NOT_MEASURED',supportedRange:null,independentReference:null,tolerance:null},
 defaultCapability:'EPHEMERIS_DATA_MISSING',ecrD11:'UNKNOWN',humanReviewAccepted:false});
write('provider/chiron-provider-decision-matrix-v1.json',{
 status:'BLOCKED_PROVIDER_DECISION',selectedProvider:null,decisionRule:'Every required gate must be evidenced before SELECTED/FROZEN; absence of evidence is not PASS.',
 criteria:['licensing','cloudflareRuntimeCompatibility','determinism','supportedDateRange','precision','productionReliability','independentValidation','provenance'],
 rows:[
 {provider:'ASTRONOMY_ENGINE_JS_2.1.19',status:'UNSUPPORTED_BODY',licensing:'MIT_EXISTING',cloudflareRuntimeCompatibility:'EXISTING_CORE_PROVIDER',determinism:'EXISTING_CORE_ONLY',supportedDateRange:'NO_CHIRON_RANGE',precision:'NO_CHIRON_CAPABILITY',productionReliability:'CORE_ONLY',independentValidation:'NO_CHIRON_RESULTS',provenance:'EXISTING_PINNED_PROVIDER'},
 {provider:'SWISS_EPHEMERIS',status:'CANDIDATE_NOT_AUTHORIZED',licensing:'OWNER_DENIED_AGPL_NO_PROFESSIONAL_LICENSE',cloudflareRuntimeCompatibility:'NOT_VERIFIED',determinism:'NOT_VERIFIED',supportedDateRange:'NOT_ADMITTED',precision:'NOT_VALIDATED',productionReliability:'NOT_VERIFIED',independentValidation:'NOT_RUN',provenance:'NO_ADMITTED_PROVIDER_OR_DATA_VERSION'},
 {provider:'NASA_JPL_HORIZONS',status:'CANDIDATE_UNSELECTED',licensing:'DATA_AND_PRODUCTION_TERMS_REVIEW_PENDING',cloudflareRuntimeCompatibility:'NETWORK_ADAPTER_NOT_ADMITTED',determinism:'PINNED_ORBIT_SOLUTION_OR_OFFLINE_DATA_POLICY_REQUIRED',supportedDateRange:'OBJECT_SOLUTION_SPECIFIC_NOT_ADMITTED',precision:'INDEPENDENT_REFERENCE_REQUIRED_IF_SELECTED',productionReliability:'NO_APPROVED_TIMEOUT_CACHE_RATE_LIMIT_AVAILABILITY_POLICY',independentValidation:'ELIGIBLE_REFERENCE_NOT_SELF_VALIDATION',provenance:'API_AND_SOLUTION_VERSIONS_MUST_BE_PINNED'}],
 sources:['https://ssd-api.jpl.nasa.gov/doc/horizons.html','https://www.astro.com/swisseph/swephprg.htm'],
 ownerBoundary:{projectLicenseUnchanged:true,swissNotInstalled:true,onlineRuntimeDependencyAdded:false}});
write('audit/shared-derived-geometry-successor-audit-v1.json',{
 zodiac:{policy:'PHI_OS_AST_TROPICAL_ZODIAC_V1',status:'PRODUCTION_ACTIVE_POLICY',genericDeriveZodiacPlacement:'NO_NEUTRAL_EXPORTED_TRANSFORM_CONFIRMED',action:'Do not duplicate per-method zodiac calculation; generic transform needs existing-policy reconciliation before use.'},
 house:{status:'DEFERRED',existingOwner:'functions/core-method-runtime/ast-house-runtime.js',existingScope:'VALIDATION_ONLY_METHOD_SPECIFIC',productionSystem:null,successor:'SHARED-HOUSE-GEOMETRY-R1',successorState:'AUDIT_ONLY_NOT_FROZEN'},
 aspect:{status:'DEFERRED',existingOwner:'functions/core-method-runtime/ast-aspect-runtime.js',existingScope:'VALIDATION_ONLY_METHOD_SPECIFIC',productionOrbPolicy:null,successor:'SHARED-ASPECT-GEOMETRY-R1',successorState:'AUDIT_ONLY_NOT_FROZEN'},
 requiredForEcrD11:false,houseDefaultsInvented:false,aspectDefaultsInvented:false});
write('provider/horizons-operational-audit-v1.json',{
 observedDate:'2026-09-24',documentationVersion:'1.3 (2025 June)',role:'DOCUMENTATION_AUDIT_ONLY',
 sources:['https://ssd-api.jpl.nasa.gov/doc/index.php','https://ssd-api.jpl.nasa.gov/doc/horizons.html'],
 documentedConstraints:['Serialize requests; no concurrent API calls','Cache reusable results and back off on failures or throttling','Supply application/version/contact User-Agent','No browser embedding under the stated CORS policy','Check response version because formats may change','Best-effort service with no indefinite-availability guarantee'],
 consequence:'A direct online production dependency has not passed reliability/determinism/operational admission. A separately reviewed offline-data or server-side policy would still need provenance, license/data-rights review, range, precision and independent validation.',
 liveEphemerisRequestsMade:false,customerBirthDataSent:false,productionProviderSelected:false});
write('contracts/astronomy-body-position-v1.json',{schemaVersion:'AstronomyBodyPositionV1',authority:'SHARED_ASTRONOMY_MINOR_BODY_POSITION_V1',
 implementation:'functions/method-client-delivery/production-adapters/shared-minor-body-capability.js',
 statuses:['SUPPORTED','UNSUPPORTED_DATE','PROVIDER_ERROR','EPHEMERIS_DATA_MISSING','INVALID_INPUT'],
 requiredPositionFields:['bodyCode','instantUtc','julianDayUt','observerMode','coordinateFrame','coordinateSystem','longitudeDeg','latitudeDeg','longitudeSpeedDegPerDay','retrograde','distanceAu','providerCode','providerVersion','ephemerisMode'],
 envelopeFields:['calculationStatus','warnings','inputHash','outputDigest'],failurePosition:null,retrogradeRule:'longitudeSpeedDegPerDay < 0',productionProviderAdmitted:false});
console.log('Shared Astronomy Chiron audit recorded: BLOCKED_PROVIDER_DECISION; Swiss CANDIDATE_NOT_AUTHORIZED; D11 UNKNOWN.');
