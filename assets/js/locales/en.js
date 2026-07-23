/* PHI OS en dictionary composition entry. Translation content belongs in ./locales/en/*.js. */
import shared from './en/shared.js';
import home from './en/home.js';
import atlas from './en/atlas.js';
import entry from './en/entry.js';
import reconstruction from './en/reconstruction.js';
import reading from './en/reading.js';
import navigation from './en/navigation.js';
import review from './en/review.js';
import about from './en/about.js';
import thesis from './en/thesis.js';
import publicExperience from './en/public.js';
import knowledgeRelease from './en/knowledge.js';
import journeyPublic from './en/journey.js';

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
  ...thesis,
  ...publicExperience,
  ...knowledgeRelease,
  ...journeyPublic
});

export default dictionary;
