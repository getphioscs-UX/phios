/* PHI OS en dictionary composition entry. Translation content belongs in ./locales/en/*.js. */
import shared from './en/shared.js';
import home from './en/home.js';
import atlas from './en/atlas.js';
import entry from './en/entry.js';
import reconstruction from './en/reconstruction.js';
import reading from './en/reading.js';
import navigation from './en/navigation.js';
import review from './en/review.js';

const dictionary = Object.freeze({
  ...shared,
  ...home,
  ...atlas,
  ...entry,
  ...reconstruction,
  ...reading,
  ...navigation,
  ...review
});

export default dictionary;
