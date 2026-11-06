import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {publicCountryHistoryBinding} from '../../assets/js/pages/civilization-atlas/country-history-public-admission-r4.js';

export function emitPublicCountryHistoryAssets(root, output) {
  const bindingPath='content/civilization-atlas/evidence/country-history-source-bindings-r1.json';
  const projectionPath='assets/js/pages/civilization-atlas/world-history-sources.generated.js';
  const candidate=JSON.parse(fs.readFileSync(path.join(root,bindingPath),'utf8'));
  const publicBinding=publicCountryHistoryBinding(candidate);
  const bytes=JSON.stringify(publicBinding,null,2)+'\n';
  const hash=createHash('sha256').update(bytes).digest('hex');
  const projection='// Generated read-only projection of '+bindingPath+'. Not another canonical Registry.\nexport const COUNTRY_HISTORY_SOURCE_BINDINGS='+JSON.stringify(publicBinding)+';\nexport const COUNTRY_HISTORY_SOURCE_SHA256="'+hash+'";\n';
  // Both public JSON and public JS must omit the unadmitted prose, not merely its links.
  for(const [relative,content] of [[bindingPath,bytes],[projectionPath,projection]]) {
    const destination=path.join(output,relative);
    fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,content);
  }
  return {candidateRecords:candidate.records.length,candidateSources:candidate.sources.length,
    publicRecords:publicBinding.records.length,publicSources:publicBinding.sources.length,
    publicBindingSHA256:hash,unadmittedPublicContent:false};
}
