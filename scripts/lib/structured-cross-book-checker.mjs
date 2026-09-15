import assert from 'node:assert/strict';
const routes={
 'BOOK-1':['/books/reality-formation/','mechanism'],
 'BOOK-2':['/books/reality-runtime/','pattern'],
 'BOOK-3':['/books/reality-continuity/','topic'],
 'BOOK-4':['/books/reality-expansion/','expansion']
};
export function validateCrossBookScope({objects,backlinks,graph,read}){
 const ids=new Map(objects.map(o=>[o.objectId,o]));
 for(const o of objects){
  const expected=routes[o.bookCode];assert.ok(expected,'UNEXPECTED_BOOK');
  const b=backlinks.find(b=>b.objectId===o.objectId);assert.ok(b,'CROSS_BOOK_BACKLINK_MISSING');assert.equal(b.bookCode,o.bookCode,'CROSS_BOOK_OWNER_MISMATCH');
  for(const href of [o.explorerHref,b.explorerHref]){const url=new URL(href,'https://local');assert.equal(url.origin,'https://local','EXTERNAL_EXPLORER_ROUTE');assert.equal(url.pathname,expected[0],'CROSS_BOOK_ROUTE_MISMATCH');assert.equal(url.searchParams.get(expected[1]),o.objectId,'CROSS_BOOK_DEEPLINK_MISMATCH');}
 }
 for(const bridge of graph.navigationBridges){
  const source=read(bridge.registryPath);assert.equal(source.bookCode,'BOOK-4','BRIDGE_SOURCE_BOOK_MISMATCH');assert.equal(source.targetBookCode,'BOOK-5','BRIDGE_TARGET_BOOK_MISMATCH');
  assert.deepEqual(bridge.fromObjectIds,source.fromObjectIds,'BRIDGE_SOURCE_SET_MISMATCH');
  for(const id of source.fromObjectIds)assert.equal(ids.get(id)?.bookCode,'BOOK-4','BRIDGE_SOURCE_OWNER_MISMATCH');
  assert.equal(bridge.targetRoute,source.targetRoute,'BRIDGE_ROUTE_MISMATCH');assert.equal(source.targetRoute,'/books/reality-differentiation/#atlas','BRIDGE_TARGET_ROUTE_MISMATCH');
  for(const key of ['copiesBook5Registry','createsHistoricalClaims','mayWriteAtlas','humanAcceptanceComplete'])assert.equal(source[key],false,`BRIDGE_AUTHORITY_PROMOTION:${key}`);
 }
 return {objects:objects.length,books:Object.keys(routes).length,bridges:graph.navigationBridges.length};
}
