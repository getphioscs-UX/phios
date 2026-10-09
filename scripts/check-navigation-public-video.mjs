import assert from 'node:assert/strict';
import {navigationPublicCatalog} from '../functions/academy/navigation-public-catalog.js';
import {onRequestGet} from '../functions/api/academy-navigation.js';
const catalog=navigationPublicCatalog();assert.equal(catalog.topics.length,10);assert.equal(catalog.items.length,30);assert.equal(catalog.invariant,'ONE_PUBLIC_VIDEO_ONE_CANONICAL_ASSET');assert.equal(catalog.checkoutRequired,false);
const required=['videoId','titleZh','titleEn','summaryZh','summaryEn','primaryAcademyTopic','secondaryAcademyTopics','doctrineSources','bookFoundationRefs','methodTags','canonicalVideoAssetId','youtubeVideoId','youtubePublicationState','academyPublicationState','transcriptState','publishedAt','duration','status'];
for(const r of catalog.items){for(const k of required)assert.ok(Object.hasOwn(r,k));assert.equal(r.status,'AWAITING_UPLOAD');assert.equal(r.canonicalVideoAssetId,null);assert.equal(r.embedUrl,null);assert.ok(catalog.topics.some(t=>t.topicId===r.primaryAcademyTopic));}
const id=catalog.items[0].videoId,video={videoIdentity:id,publicationDecision:'PUBLIC_VIDEO_ACCEPTED',canonicalVideoAssetId:'SYNTHETIC-VIDEO-ASSET',youtubeVideoId:'fixturevid0',youtubePublicationState:'PUBLISHED',academyPublicationState:'PUBLISHED',summaryZh:'合成测试简介',summaryEn:'Synthetic test summary',duration:60,publishedAt:'2026-10-09T00:00:00Z',transcriptState:'ACCEPTED'};
const ready=navigationPublicCatalog({[id]:video}).items[0];assert.equal(ready.youtubeUrl.split('v=')[1],ready.embedUrl.split('/').at(-1));assert.equal(ready.canonicalVideoAssetId,video.canonicalVideoAssetId);
for(const bad of [{...video,academyVideoAsset:'split'},{...video,youtubeVideoAsset:'split'},{...video,canonicalVideoAssetId:null},{...video,summaryEn:null}])assert.throws(()=>navigationPublicCatalog({[id]:bad}),/CANONICAL_ASSET/);
assert.equal((await onRequestGet({env:{PHIOS_NAVIGATION_PUBLIC_VIDEO_MANIFEST:JSON.stringify({[id]:{...video,academyVideoAsset:'split'}})}})).status,503);
assert.ok(!JSON.stringify(catalog).includes('requiredInputs'));assert.ok(!JSON.stringify(catalog).includes('forbiddenInference'));
console.log('PASS: 30 planned canonical records, 10 topics, free public API, shared YouTube/Academy identity, split asset and incomplete publication rejected. Synthetic asset only; real videos remain awaiting upload.');
