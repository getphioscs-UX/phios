// Versioned identity/brief binding only. No review, approval or publication issuer.
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
export const INSTITUTION_BRIEF_VERSION='PHI-OS-INSTITUTION-FACTUAL-BRIEF-v1.0.0';
const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const isInstitutionArticle=c=>/^ART-INSTITUTION-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(c?.nodeCode||'');
export function institutionBriefPath(nodeCode,locale){if(!isInstitutionArticle({nodeCode})||!['en','zh-Hans'].includes(locale))throw Error('INSTITUTION_BRIEF_IDENTITY_INVALID');return `content/knowledge/production/briefs/institution/${locale}/${nodeCode}-factual-brief.v1.json`;}
export function institutionBriefDigest(b){const x=structuredClone(b);delete x.briefDigest;return sha(x);}
export const institutionBodyDigest=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
export async function readInstitutionFactualBrief(root,c){
 const b=JSON.parse(await fs.readFile(path.join(root,institutionBriefPath(c.nodeCode,c.locale)),'utf8'));
 if(b.briefSchemaVersion!==INSTITUTION_BRIEF_VERSION||b.nodeCode!==c.nodeCode||b.locale!==c.locale)throw Error('INSTITUTION_BRIEF_IDENTITY_MISMATCH');
 if(b.briefDigest!==institutionBriefDigest(b))throw Error('INSTITUTION_BRIEF_DIGEST_INVALID');
 if(!/^[a-f0-9]{40}$/.test(b.repositoryCommit||''))throw Error('INSTITUTION_BRIEF_COMMIT_INVALID');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(b.localizedIdentity?.slug||'')||b.localizedIdentity.href!==`/articles/${b.localizedIdentity.slug}`)throw Error('INSTITUTION_BRIEF_ROUTE_INVALID');
 for(const k of ['briefCode','briefSchemaVersion','briefDigest','repositoryCommit'])if(c.sourceBrief?.[k]!==b[k])throw Error('INSTITUTION_BRIEF_BINDING_INVALID:'+k);
 if(b.articleBinding?.title!==c.article?.title||b.articleBinding?.summary!==c.article?.summary||b.articleBinding?.bodySHA256!==institutionBodyDigest(c.article?.bodyMarkdown||''))throw Error('INSTITUTION_BRIEF_ARTICLE_MISMATCH');
 if(b.boundary!=='CANDIDATE_ONLY_REQUIRES_NORMAL_REVIEW_APPROVAL_PUBLICATION'||!Array.isArray(b.evidence)||!b.evidence.length)throw Error('INSTITUTION_BRIEF_EVIDENCE_REQUIRED');
 for(const e of b.evidence)if(!e.sourceId||!e.locator||!/^https:\/\//.test(e.url||''))throw Error('INSTITUTION_BRIEF_EVIDENCE_INVALID');
 return b;
}
