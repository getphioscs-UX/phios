// HTML under content is evidence or source material, not a customer route.
// Runtime JSON and accepted image assets keep their existing admission policy.
export function internalPublicationFile(rel) {
  const file = rel.replaceAll('\\', '/');
  return /^content\/.*\.html?$/i.test(file) ||
    /^artifacts\/(?:visual-r2|live-page-recovery-r1)\//.test(file) ||
    /^content\/production-closure\//.test(file) ||
    /(?:^|\/)[^/]+\.(?:fixture-backup|backup)-[^/]+$/.test(file);
}
