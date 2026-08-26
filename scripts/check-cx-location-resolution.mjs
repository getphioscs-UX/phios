import assert from 'node:assert/strict';
const realFetch=globalThis.fetch;let calls=[];
globalThis.fetch=async (url,options={})=>{
  const u=String(url);calls.push({url:u,headers:options.headers||{}});
  if(u.includes('/search')){
    const q=new URL(u).searchParams.get('q')||'';
    if(q.toLowerCase()==='seremban')return new Response(JSON.stringify([{osm_type:'relation',osm_id:1484899,name:'Seremban',display_name:'Seremban, Negeri Sembilan, Malaysia',lat:'2.7297',lon:'101.9381',namedetails:{'name:en':'Seremban','name:zh':'芙蓉'},address:{city:'Seremban',state:'Negeri Sembilan',country:'Malaysia',country_code:'my'}}]),{status:200,headers:{'content-type':'application/json'}});
    return new Response(JSON.stringify([{osm_type:'relation',osm_id:130408,name:'Taiping',display_name:'Taiping, Larut Matang dan Selama, Perak, Malaysia',lat:'4.8500',lon:'100.7400',namedetails:{'name:en':'Taiping','name:zh':'太平'},address:{city:'Taiping',state:'Perak',country:'Malaysia',country_code:'my'}}]),{status:200,headers:{'content-type':'application/json'}});
  }
  if(u.includes('/lookup')){
    const ref=new URL(u).searchParams.get('osm_ids');
    if(ref==='R1484899')return new Response(JSON.stringify([{name:'芙蓉',display_name:'芙蓉, 森美兰, 马来西亚',lat:'2.7297',lon:'101.9381',namedetails:{'name:en':'Seremban','name:zh':'芙蓉'},address:{city:'芙蓉',state:'森美兰',country:'马来西亚',country_code:'my'}}]),{status:200,headers:{'content-type':'application/json'}});
    return new Response(JSON.stringify([{name:'Taiping',display_name:'Taiping, Perak, Malaysia',lat:'4.8500',lon:'100.7400',namedetails:{'name:en':'Taiping','name:zh':'太平'},address:{city:'Taiping',state:'Perak',country:'Malaysia',country_code:'my'}}]),{status:200,headers:{'content-type':'application/json'}});
  }
  if(u.includes('TimeZone/coordinate'))return new Response(JSON.stringify({timeZone:'Asia/Kuala_Lumpur'}),{status:200,headers:{'content-type':'application/json'}});
  throw new Error(`unexpected fetch ${url}`)
};
try{
  const {searchBirthPlaces}=await import('../functions/location/place-search.js');const {resolveBirthPlace}=await import('../functions/location/place-resolver.js');
  const found=await searchBirthPlaces('taiping',{locale:'en'});assert.equal(found.length,1);assert.equal(found[0].providerRef,'R130408');assert.equal(found[0].countryCode,'MY');
  const place=await resolveBirthPlace('R130408',{birthDate:'1989-11-15',birthTime:'22:50',locale:'en'});assert.equal(place.state,'CONFIRMED');assert.equal(place.displayName,'Taiping, Perak, Malaysia');assert.equal(place.latitude,4.85);assert.equal(place.longitude,100.74);assert.equal(place.timezone.iana,'Asia/Kuala_Lumpur');assert.equal(place.timezone.utcOffsetAtBirth,'+08:00');
  const seremban=await searchBirthPlaces('seremban',{locale:'zh-Hans'});assert.equal(seremban.length,1);assert.equal(seremban[0].providerRef,'R1484899');assert.equal(seremban[0].primaryLabel,'芙蓉');assert.match(seremban[0].secondaryLabel,/Seremban/);assert.match(seremban[0].secondaryLabel,/Malaysia/);
  const zhPlace=await resolveBirthPlace('R1484899',{birthDate:'1990-01-01',birthTime:'10:30',locale:'zh-Hans'});assert.equal(zhPlace.state,'CONFIRMED');assert.equal(zhPlace.localizedName,'芙蓉');assert.equal(zhPlace.englishName,'Seremban');assert.match(zhPlace.customerLabel,/芙蓉/);assert.match(zhPlace.customerLabel,/Seremban/);assert.equal(zhPlace.timezone.iana,'Asia/Kuala_Lumpur');
  const serembanSearchCall=calls.find(x=>x.url.includes('/search')&&x.url.includes('seremban'));assert.ok(serembanSearchCall);assert.match(String(serembanSearchCall.headers['accept-language']),/^en,zh-CN/,'Latin query in zh UI must search English names first while preserving Chinese display names');assert.ok(serembanSearchCall.url.includes('namedetails=1'));
  assert.ok(calls.some(x=>x.url.includes('TimeZone/coordinate')));
  console.log('✓ CX birth-place resolution passed: mixed-script Seremban → 芙蓉/Seremban candidate → confirmed coordinates → Asia/Kuala_Lumpur, while Taiping regression remains intact.');
}finally{globalThis.fetch=realFetch}
