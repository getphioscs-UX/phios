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
write('provider/chiron-provider-decision-v1.json',{status:'PENDING',selectedProvider:null,positionFreeze:'NOT_FROZEN',
 candidates:[{provider:'SWISS_EPHEMERIS',status:'BLOCKED_LICENSE',reason:'Dual AGPL/professional license; no applicable project commercial license evidenced. Native/WASM compatibility and independent validation remain unverified.',source:'https://www.astro.com/swisseph/swephprg.htm'},
 {provider:'NASA_JPL_HORIZONS',status:'PENDING',reason:'Current core authority uses Horizons as VALIDATION_ONLY. A new runtime data/provider role requires pinned provenance, offline repeatability or explicit network policy, independent reference and precision acceptance. Not silently promoted.',source:'https://ssd-api.jpl.nasa.gov/doc/horizons.html'}],
 gates:{commercialUse:'PENDING',redistribution:'PENDING',ephemerisDataRights:'PENDING',cloudflareCompatibility:'NOT_VERIFIED',bundleSize:'NOT_MEASURED',networkDependency:'UNDECIDED',offlineDeterminism:'NOT_VERIFIED',coldStart:'NOT_MEASURED',supportedRange:null,independentReference:null,tolerance:null},
 defaultCapability:'EPHEMERIS_DATA_MISSING',ecrD11:'UNKNOWN',humanReviewAccepted:false});
write('contracts/astronomy-body-position-v1.json',{schemaVersion:'AstronomyBodyPositionV1',authority:'SHARED_ASTRONOMY_MINOR_BODY_POSITION_V1',
 implementation:'functions/method-client-delivery/production-adapters/shared-minor-body-capability.js',
 statuses:['SUPPORTED','UNSUPPORTED_DATE','PROVIDER_ERROR','EPHEMERIS_DATA_MISSING','INVALID_INPUT'],
 requiredPositionFields:['bodyCode','instantUtc','julianDayUt','observerMode','coordinateFrame','coordinateSystem','longitudeDeg','latitudeDeg','longitudeSpeedDegPerDay','retrograde','distanceAu','providerCode','providerVersion','ephemerisMode'],
 envelopeFields:['calculationStatus','warnings','inputHash','outputDigest'],failurePosition:null,retrogradeRule:'longitudeSpeedDegPerDay < 0',productionProviderAdmitted:false});
console.log('Shared Astronomy Chiron audit recorded; provider selection pending, raw capability NOT_FROZEN.');
