const BOOKS='/content/registry/successors/seven-volume-v1/books.json';
const PARTS='/content/registry/successors/seven-volume-v1/parts.json';
const ASSETS='/content/web-production/registries/wpr-seven-volume-r2-public-assets-v1.json';
export const BOOK_ROUTE_BY_ID=Object.freeze({'book-1':'/books/reality-formation/','book-2':'/books/reality-runtime/','book-3':'/books/reality-continuity/','book-4':'/books/reality-expansion/','book-5':'/books/reality-differentiation/','book-6':'/books/reality-observation/','book-7':'/books/reality-navigation/'});
const json=async p=>{const r=await fetch(p,{credentials:'same-origin',headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`SEVEN_VOLUME_SOURCE_UNAVAILABLE:${p}`);return r.json()};
export async function loadSevenVolumeBooks(){const r=await json(BOOKS);if(r.architecture!=='seven-volume-15-part'||!Array.isArray(r.books)||r.books.length!==7)throw new Error('SEVEN_VOLUME_BOOK_REGISTRY_INVALID');return r}
export async function loadSevenVolumeParts(){const r=await json(PARTS);if(r.architecture!=='seven-volume-15-part'||!Array.isArray(r.parts)||r.parts.length!==15)throw new Error('SEVEN_VOLUME_PART_REGISTRY_INVALID');return r}
export async function loadSevenVolumeAssets(){const r=await json(ASSETS);if(!Array.isArray(r.assets)||r.assets.length<15)throw new Error('SEVEN_VOLUME_ASSET_REGISTRY_INVALID');return r}
export function bookRoute(bookId){return BOOK_ROUTE_BY_ID[bookId]||'/books/'}
export function canonicalPartsForBook(book,registry){const owned=new Set(book?.parts||[]);return (registry?.parts||[]).filter(p=>owned.has(p.number)&&p.book===book.book_id).sort((a,b)=>a.number-b.number)}
export function sevenVolumeAssetRecord(registry,assetId){return registry?.assets?.find(a=>a.assetId===assetId)||null}
export async function resolveSevenVolumeAsset(assetId){const r=await loadSevenVolumeAssets();const a=sevenVolumeAssetRecord(r,assetId);if(!a?.available||!a?.publicUrl) return null;return {assetCode:a.assetId,src:a.publicUrl,width:a.width??null,height:a.height??null,renderable:true,verification:a.verificationState}}
export async function resolveSevenVolumeBookCover(bookId){const n=Number(String(bookId).replace('book-',''));return Number.isInteger(n)?resolveSevenVolumeAsset(`BOOK-${n}-HARDCOVER`):null}
export async function resolveSevenVolumeBookBranding(bookId){const n=Number(String(bookId).replace('book-',''));return Number.isInteger(n)?resolveSevenVolumeAsset(`BOOK-${n}-BRANDING`):null}
