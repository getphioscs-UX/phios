// Test-only Node22 compatibility. One binding implementation shared by owners.
import {createSqliteD1Adapter} from '../runtime-migration-loader.mjs';

function assertSqliteBindings(sql, values) {
  const tokens = /'(?:''|[^'])*'|"(?:""|[^"])*"|`(?:``|[^`])*`|\[[^\]]*\]|--[^\r\n]*|\/\*[\s\S]*?\*\/|(\?)(\d*)|([:@$][A-Za-z0-9_]+)/gu;
  const indexes = new Set(); let anonymous = 0;
  for (const token of sql.matchAll(tokens)) {
    if (token[3]) throw new TypeError('ZPA_SQLITE_NAMED_PARAMETERS_UNSUPPORTED');
    if (!token[1]) continue;
    if (!token[2]) { anonymous++; continue; }
    const index = Number(token[2]);
    if (!/^[1-9]\d*$/u.test(token[2]) || !Number.isSafeInteger(index) || index > 32766) throw new RangeError('ZPA_SQLITE_PARAMETER_INDEX_INVALID');
    indexes.add(index);
  }
  if (indexes.size && anonymous) throw new TypeError('ZPA_SQLITE_MIXED_PARAMETER_STYLES_UNSUPPORTED');
  const count = indexes.size ? Math.max(...indexes) : anonymous;
  if (indexes.size !== 0 && indexes.size !== count) throw new RangeError('ZPA_SQLITE_PARAMETER_INDEX_GAP');
  if (values.length !== count) throw new RangeError('ZPA_SQLITE_PARAMETER_COUNT_MISMATCH');
  return indexes.size ? [Object.fromEntries(values.map((value,index)=>['?'+(index+1),value]))] : values;
}

export function createStrictSqliteD1TestAdapter(database) {
const sqliteD1 = createSqliteD1Adapter(database);
return {...sqliteD1, prepare(sql) {
  function bound(values = []) {
    const statement = sqliteD1.prepare(sql).bind(...values);
    // The shared bridge's simple regex also sees quoted/commented question
    // marks. Override only this test statement's argument selection.
    statement.sqliteArguments = () => assertSqliteBindings(sql, values);
    return {
      bind(...next) { return bound(next); },
      async first() { assertSqliteBindings(sql, values); return statement.first(); },
      async all() { assertSqliteBindings(sql, values); return statement.all(); },
      async run() { assertSqliteBindings(sql, values); return statement.run(); }
    };
  }
  return bound();
}};
}
