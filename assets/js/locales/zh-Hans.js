/* PHI OS zh-Hans dictionary composition entry. Translation content belongs in ./locales/zh-Hans/*.js. */
import shared from './zh-Hans/shared.js';
import home from './zh-Hans/home.js';
import atlas from './zh-Hans/atlas.js';
import entry from './zh-Hans/entry.js';
import reconstruction from './zh-Hans/reconstruction.js';
import reading from './zh-Hans/reading.js';
import navigation from './zh-Hans/navigation.js';
import review from './zh-Hans/review.js';
import about from './zh-Hans/about.js';
import thesis from './zh-Hans/thesis.js';

const dictionary = Object.freeze({
  ...shared,
  ...home,
  ...atlas,
  ...entry,
  ...reconstruction,
  ...reading,
  ...navigation,
  ...review,
  ...about,
  ...thesis
});

export default dictionary;
