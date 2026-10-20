// Preserve runtime names, property keys, syntax and legal comments while
// shortening internal lexical bindings in the generated deployment bundle.
export const pagesWorkerCompactionOptions = Object.freeze({
  loader: 'js', target: 'esnext', minifyWhitespace: true,
  minifyIdentifiers: true, keepNames: true, minifySyntax: false,
  legalComments: 'inline'
});
