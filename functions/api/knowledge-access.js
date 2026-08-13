import { handleKnowledgeAccessRequest } from '../_lib/knowledge-access-api.js';

export const onRequestGet = context => handleKnowledgeAccessRequest(context.request, context.env);
export const onRequest = context => handleKnowledgeAccessRequest(context.request, context.env);
