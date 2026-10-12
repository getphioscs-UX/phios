// Operational capability boundary; deliberately narrower than SQLite's grammar.
const guards = new WeakSet();
const violations = new WeakMap();
const functions = new Set(['COUNT','MIN','MAX','SUM','AVG','TOTAL','COALESCE','IFNULL','NULLIF','LOWER','UPPER','LENGTH','SUBSTR','SUBSTRING','TRIM','LTRIM','RTRIM','ROUND','ABS','HEX','TYPEOF','DATE','TIME','DATETIME','STRFTIME','JULIANDAY','UNIXEPOCH','JSON_EXTRACT','JSON_VALID','JSON_TYPE','JSON_ARRAY_LENGTH','JSON','CAST','IN','EXISTS']);
export class D1MaintenanceError extends Error {
  constructor() { super('temporarily_unavailable'); this.name = 'D1MaintenanceError'; }
}
const deny = () => { throw new D1MaintenanceError(); };
export function maintenanceMode(value) {
  if (value === undefined || value === '' || value === 'OFF') return 'OFF';
  return value === 'READ_ONLY' ? 'READ_ONLY' : 'INVALID';
}
export function isProvenReadSql(sql) {
  if (typeof sql !== 'string' || !sql || /[^\x09\x0a\x0d\x20-\x7e]|;|--|\/\*|\*\//.test(sql)) return false;
  // Remove balanced SQL literals/quoted identifiers before inspecting grammar.
  const tokens = []; let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "'" || c === '"' || c === '`' || c === '[') {
      const end = c === '[' ? ']' : c; let closed = false; i++;
      while (i < sql.length) { if (sql[i] === end) { if (c !== '[' && sql[i+1] === end) { i += 2; continue; } i++; closed = true; break; } i++; }
      if (!closed) return false; tokens.push('QUOTED'); continue;
    }
    const word = /^[A-Za-z_][A-Za-z_0-9]*/.exec(sql.slice(i));
    if (word) { tokens.push(word[0].toUpperCase()); i += word[0].length; continue; }
    if (!/[0-9?@:$.,()=*+\/%<>!|&~-]/.test(c)) return false;
    tokens.push(c); i++;
  }
  if (tokens[0] !== 'SELECT') return false;
  const forbidden = new Set(['INSERT','UPDATE','DELETE','REPLACE','CREATE','DROP','ALTER','VACUUM','REINDEX','ATTACH','DETACH','ANALYZE','PRAGMA','WITH','BEGIN','COMMIT','ROLLBACK','SAVEPOINT','RELEASE','END','EXPLAIN']);
  let depth = 0;
  for (let n=0;n<tokens.length;n++) {
    const t=tokens[n]; if (forbidden.has(t)) return false;
    if (t==='(') { depth++; const prev=tokens[n-1]; if (/^[A-Z_]/.test(prev||'') && !functions.has(prev) && !['SELECT','WHERE','AND','OR','NOT','ON','WHEN','THEN','ELSE','AS','FROM'].includes(prev)) return false; }
    if (t===')' && --depth<0) return false;
  }
  return depth===0;
}
function readStatement(statement, block) {
  // Null prototypes and explicit methods prevent access to the original binding.
  const projection = Object.create(null);
  projection.bind = (...args) => readStatement(statement.bind(...args), block);
  for (const method of ['first','all','raw']) projection[method] = (...args) => statement[method](...args);
  projection.run = block;
  return Object.freeze(projection);
}
export function guardD1Binding(database, mode) {
  if (mode === 'OFF') return database;
  if (mode !== 'READ_ONLY' || !database || typeof database.prepare !== 'function') return deny();
  if (guards.has(database)) return database;
  const projection = Object.create(null);
  violations.set(projection, 0);
  const block = () => { violations.set(projection, violations.get(projection)+1); return deny(); };
  projection.prepare = sql => { if (!isProvenReadSql(sql)) return block(); return readStatement(database.prepare(sql), block); };
  projection.exec = block;
  projection.batch = block;
  projection.withSession = block;
  projection.dump = block;
  guards.add(projection);
  return Object.freeze(projection);
}
export function d1ViolationCount(database) { return violations.get(database) || 0; }
export function maintenanceResponse() {
  return Response.json({ok:false,status:'temporarily_unavailable'}, {status:503,headers:{'Cache-Control':'no-store'}});
}

export function isGuardedD1Binding(database) { return guards.has(database); }
