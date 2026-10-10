import { writeArticlePresentationSuccessor } from './lib/visual-article-production/article-presentation-successor-v2.mjs';
const output = writeArticlePresentationSuccessor();
console.log(`CPR successor active: ${output.presentation.presentationCode}`);
console.log(`Figure binding active: ${output.binding.bindingCode}`);
