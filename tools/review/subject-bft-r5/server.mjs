// Reuse the existing R4 local HTTP/UI harness; isolate its synthetic owner files.
import fs from 'node:fs';import path from 'node:path';import {build} from 'esbuild';
fs.mkdirSync('.tmp/subject-bft-r5',{recursive:true});
let harness=fs.readFileSync('tools/review/subject-bft-r4/server.mjs','utf8');
const needle='await build({stdin:';
if(!harness.includes(needle))throw Error('R4_SERVER_BUILD_DRIFT');
const inject=`
source="import {createBusinessOwnerAdmissionCandidate} from '../../../functions/professional/financial/business-owner-admission-candidate-r5.js';\\n"+source;
source=source.replace("if(u.pathname.startsWith('/api/r4'))",\`if(u.pathname==='/api/r5/read'){if(req.method!=='GET')return send(405,{error:'READ_ONLY_ENDPOINT'});if(!who)return send(401,{error:'VERIFIED_ACCOUNT_REQUIRED'});return send(200,await createBusinessOwnerAdmissionCandidate(owner).read(u.searchParams.get('subject'),who,{intakeRef:u.searchParams.get('intakeRef'),expectedSourceVersion:u.searchParams.get('sourceVersion'),locale:u.searchParams.get('locale')||'en'}));}if(u.pathname.startsWith('/api/r4'))\`);
source=source.replaceAll('.tmp/subject-bft-r4/','.tmp/subject-bft-r5/');
`;
harness=harness.replace(needle,inject+needle).replaceAll('.tmp/subject-bft-r4/http-server', '.tmp/subject-bft-r5/http-server');
// The dynamically generated server compiles existing owner fixture helpers too.
harness=harness.replace("target:'node22',logLevel:",`target:'node22',plugins:[{name:'isolate-r5-owner',setup(b){b.onLoad({filter:/owner\\.mjs$/},a=>{let text=fs.readFileSync(a.path,'utf8');if(a.path.includes('bft-r1'))text=text.replaceAll('.tmp/bft-r1','.tmp/subject-bft-r5/native-account');if(a.path.includes('subject-bft-r3'))text=text.replaceAll('.tmp/subject-bft-r3','.tmp/subject-bft-r5/native-context');return{contents:text,loader:'js',resolveDir:path.dirname(a.path)};});}}],logLevel:`);
// R4 imports fs/build only; supply path for the isolation transform.
harness="import path from 'node:path';\n"+harness;
await build({stdin:{contents:harness,resolveDir:path.resolve('tools/review/subject-bft-r4'),sourcefile:'r5-local-harness.mjs'},outfile:'.tmp/subject-bft-r5/server-launch.mjs',bundle:true,platform:'node',format:'esm',packages:'external',target:'node22',logLevel:'warning'});
await import('../../../.tmp/subject-bft-r5/server-launch.mjs');
