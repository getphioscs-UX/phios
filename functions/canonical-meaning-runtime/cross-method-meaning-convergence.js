import { sha256Canonical } from './canonical-meaning-runtime.js';
function flatten(bundles) {
  return bundles.flatMap(bundle => bundle.meanings.map(m => ({ methodCode:m.sourceProjection.methodCode, projectionCode:m.sourceProjection.projectionCode, projectionType:m.sourceProjection.projectionType, meaningCode:m.meaningCode, meaningFamily:m.meaningFamily })));
}
export async function buildCrossMethodMeaningConvergence(bundles) {
  if (!Array.isArray(bundles) || bundles.length < 1) throw new TypeError('CMR_CONVERGENCE_BUNDLES_REQUIRED');
  const signals = flatten(bundles);
  const methods = [...new Set(signals.map(s=>s.methodCode))].sort();
  const byFamily = Map.groupBy ? Map.groupBy(signals, x=>x.meaningFamily) : signals.reduce((m,x)=>(m.set(x.meaningFamily,[...(m.get(x.meaningFamily)||[]),x]),m),new Map());
  const supportingSignals=[]; const contradictingSignals=[]; const unresolvedSignals=[];
  for (const [family, rows] of byFamily) {
    const rowMethods=[...new Set(rows.map(r=>r.methodCode))];
    const codes=[...new Set(rows.map(r=>r.meaningCode))];
    if (rowMethods.length > 1) {
      for (const row of rows) supportingSignals.push({ ...row, relation: codes.length===1 ? 'same_meaning_signal' : 'same_family_signal' });
      if (codes.length > 1) unresolvedSignals.push({ meaningFamily:family, reason:'Multiple independent projections map to the same Meaning Family but different Meaning Codes; no fact-level merge is allowed.', meaningCodes:codes.sort(), methodCodes:rowMethods.sort() });
    }
  }
  const seed={signals,methods}; const digest=await sha256Canonical(seed);
  return Object.freeze({ schemaVersion:'PHI-OS-CROSS-METHOD-MEANING-CONVERGENCE-v1.0.0', convergenceCode:`CMC-${digest.slice(0,24).toUpperCase()}`, convergenceVersion:'1.0.0', supportingSignals, contradictingSignals, unresolvedSignals, sourceIndependence:{ independentMethodCount:methods.length, methodCodes:methods, independent:methods.length>1, basis:'distinct_canonical_projection_method_lineage' }, limitations:['Convergence records semantic co-location only; it does not establish a reality fact.','Method agreement does not increase truth status.','No Professional conclusion or Reality decision is created.'], status:'validation_only' });
}
export default Object.freeze({ buildCrossMethodMeaningConvergence });
