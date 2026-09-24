const H={headers:{Accept:'application/json'}};const C=new Map();
async function j(path){if(!C.has(path))C.set(path,fetch(path,H).then(r=>{if(!r.ok)throw new Error('BOOK6_ATLAS_HTTP_'+r.status);return r.json()}));return C.get(path)}
export async function loadBook6AtlasData(){const [registry,cases,windows,snapshots,dossiers,lived,relationships,visuals,visualBindings]=await Promise.all([
 j('/content/civilization-atlas/reconfiguration/book-vi-reconfiguration-atlas-registry-v2.json'),
 j('/content/civilization-atlas/reconfiguration/cases/reconfiguration-case-registry-v1.json'),
 j('/content/civilization-atlas/reconfiguration/windows/reconfiguration-windows-v1.json'),
 j('/content/civilization-atlas/reconfiguration/snapshots/world-reconfiguration-snapshots-v1.json'),
 j('/content/civilization-atlas/reconfiguration/dossiers/contemporary-runtime-dossiers-v1.json'),
 j('/content/civilization-atlas/reconfiguration/lived-reality/lived-reality-dimensions-v1.json'),
 j('/content/civilization-atlas/reconfiguration/book-vi-atlas-relationships-v2.json'),
 j('/content/civilization-atlas/reconfiguration/book-vi-visual-asset-status-v1.json'),
 j('/content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json')
]);return {registry,cases,windows,snapshots,dossiers,lived,relationships,visuals,visualBindings}}
