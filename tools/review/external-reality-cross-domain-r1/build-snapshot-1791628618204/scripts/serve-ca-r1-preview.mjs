import {previewServer} from './lib/ca-r1-preview-server.mjs';
const server=await previewServer({candidatePreview:true});
console.log('QA-only candidate preview (no production meaning import): '+server.origin);
console.log('Book III: '+server.origin+'/books/reality-continuity/?locale=zh-Hans');
console.log('Book IV: '+server.origin+'/books/reality-expansion/?locale=zh-Hans');
