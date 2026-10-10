import { handlePublicKnowledgeRequest } from '../_lib/public-knowledge-api.js';

export const onRequestGet = context => handlePublicKnowledgeRequest(context.request, context.env);
export const onRequest = context => handlePublicKnowledgeRequest(context.request, context.env);
