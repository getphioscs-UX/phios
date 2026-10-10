const allowed=new Set(['why','how','start','faq']);const id=location.hash.slice(1);location.replace('/about/founder/'+(allowed.has(id)?'#'+id:''));
