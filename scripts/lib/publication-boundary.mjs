import {financialQaPath} from '../../functions/_lib/final-release-scope.js';
// HTML under content is evidence or source material, not a customer route.
// Runtime JSON and accepted image assets keep their existing admission policy.
export function internalPublicationFile(rel) {
  const file = rel.replaceAll('\\', '/');
  return financialQaPath('/'+file) || /^content\/.*\.html?$/i.test(file) ||
    /^content\/civilization-atlas\/maintenance\//.test(file) ||
    /^content\/knowledge\/manuscripts\/completed\//.test(file) ||
    /^content\/civilization-atlas\/reconfiguration\/(?:moomoo-|market-provider-).*\.json$/.test(file) ||
    /^artifacts\/(?:visual-r2|live-page-recovery-r1|navigation-handoff-r1|phi-os-integrated-r42)\//.test(file) ||
    /^content\/production-closure\//.test(file) ||
    /(?:^|\/)[^/]+\.(?:fixture-backup|backup)-[^/]+$/.test(file);
}
