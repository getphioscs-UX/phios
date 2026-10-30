// functions/_lib/d1-maintenance-guard.js
var guards = /* @__PURE__ */ new WeakSet();
var violations = /* @__PURE__ */ new WeakMap();
var functions = /* @__PURE__ */ new Set(["COUNT", "MIN", "MAX", "SUM", "AVG", "TOTAL", "COALESCE", "IFNULL", "NULLIF", "LOWER", "UPPER", "LENGTH", "SUBSTR", "SUBSTRING", "TRIM", "LTRIM", "RTRIM", "ROUND", "ABS", "HEX", "TYPEOF", "DATE", "TIME", "DATETIME", "STRFTIME", "JULIANDAY", "UNIXEPOCH", "JSON_EXTRACT", "JSON_VALID", "JSON_TYPE", "JSON_ARRAY_LENGTH", "JSON", "CAST", "IN", "EXISTS"]);
var D1MaintenanceError = class extends Error {
  constructor() {
    super("temporarily_unavailable");
    this.name = "D1MaintenanceError";
  }
};
var deny = () => {
  throw new D1MaintenanceError();
};
function maintenanceMode(value) {
  if (value === void 0 || value === "" || value === "OFF") return "OFF";
  return value === "READ_ONLY" ? "READ_ONLY" : "INVALID";
}
function isProvenReadSql(sql) {
  if (typeof sql !== "string" || !sql || /[^\x09\x0a\x0d\x20-\x7e]|;|--|\/\*|\*\//.test(sql)) return false;
  const tokens = [];
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "'" || c === '"' || c === "`" || c === "[") {
      const end = c === "[" ? "]" : c;
      let closed = false;
      i++;
      while (i < sql.length) {
        if (sql[i] === end) {
          if (c !== "[" && sql[i + 1] === end) {
            i += 2;
            continue;
          }
          i++;
          closed = true;
          break;
        }
        i++;
      }
      if (!closed) return false;
      tokens.push("QUOTED");
      continue;
    }
    const word = /^[A-Za-z_][A-Za-z_0-9]*/.exec(sql.slice(i));
    if (word) {
      tokens.push(word[0].toUpperCase());
      i += word[0].length;
      continue;
    }
    if (!/[0-9?@:$.,()=*+\/%<>!|&~-]/.test(c)) return false;
    tokens.push(c);
    i++;
  }
  if (tokens[0] !== "SELECT") return false;
  const forbidden = /* @__PURE__ */ new Set(["INSERT", "UPDATE", "DELETE", "REPLACE", "CREATE", "DROP", "ALTER", "VACUUM", "REINDEX", "ATTACH", "DETACH", "ANALYZE", "PRAGMA", "WITH", "BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT", "RELEASE", "END", "EXPLAIN"]);
  let depth = 0;
  for (let n = 0; n < tokens.length; n++) {
    const t = tokens[n];
    if (forbidden.has(t)) return false;
    if (t === "(") {
      depth++;
      const prev = tokens[n - 1];
      if (/^[A-Z_]/.test(prev || "") && !functions.has(prev) && !["SELECT", "WHERE", "AND", "OR", "NOT", "ON", "WHEN", "THEN", "ELSE", "AS", "FROM"].includes(prev)) return false;
    }
    if (t === ")" && --depth < 0) return false;
  }
  return depth === 0;
}
function readStatement(statement, block) {
  const projection = /* @__PURE__ */ Object.create(null);
  projection.bind = (...args) => readStatement(statement.bind(...args), block);
  for (const method of ["first", "all", "raw"]) projection[method] = (...args) => statement[method](...args);
  projection.run = block;
  return Object.freeze(projection);
}
function guardD1Binding(database, mode) {
  if (mode === "OFF") return database;
  if (mode !== "READ_ONLY" || !database || typeof database.prepare !== "function") return deny();
  if (guards.has(database)) return database;
  const projection = /* @__PURE__ */ Object.create(null);
  violations.set(projection, 0);
  const block = () => {
    violations.set(projection, violations.get(projection) + 1);
    return deny();
  };
  projection.prepare = (sql) => {
    if (!isProvenReadSql(sql)) return block();
    return readStatement(database.prepare(sql), block);
  };
  projection.exec = block;
  projection.batch = block;
  projection.withSession = block;
  projection.dump = block;
  guards.add(projection);
  return Object.freeze(projection);
}
function d1ViolationCount(database) {
  return violations.get(database) || 0;
}
function maintenanceResponse() {
  return Response.json({ ok: false, status: "temporarily_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
}

// functions/_middleware.js
async function onRequest(context) {
  const mode = maintenanceMode(context.env.PHIOS_D1_MAINTENANCE_MODE);
  if (mode === "OFF") return context.next();
  if (mode !== "READ_ONLY") return maintenanceResponse();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(context.request.method)) return maintenanceResponse();
  try {
    const guarded = guardD1Binding(context.env.RUNTIME_DB, mode);
    Object.defineProperty(context.env, "RUNTIME_DB", { value: guarded, writable: false, configurable: false, enumerable: true });
    const before = d1ViolationCount(guarded);
    const response = await context.next();
    return d1ViolationCount(guarded) === before ? response : maintenanceResponse();
  } catch {
    return maintenanceResponse();
  }
}

// functions/current-web-authority/current-web-authority-runtime.js
var PRECEDENCE = Object.freeze({ OFFICIAL_PRIMARY: 100, REGULATOR: 95, PUBLIC_HEALTH: 95, GOVERNMENT: 90, OFFICIAL_COMPANY: 85, ACADEMIC: 80, MARKET_DATA_PROVIDER: 78, REPUTABLE_NEWS: 70, SECONDARY_REFERENCE: 55, COMMUNITY: 25 });
var DOMAIN_ALLOWED = Object.freeze({ HEALTH: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "REGULATOR", "PUBLIC_HEALTH", "GOVERNMENT", "ACADEMIC"]), FINANCIAL_MARKETS: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "REGULATOR", "GOVERNMENT", "MARKET_DATA_PROVIDER", "OFFICIAL_COMPANY", "REPUTABLE_NEWS"]), COMPANY_PRODUCT: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "OFFICIAL_COMPANY", "REGULATOR", "REPUTABLE_NEWS", "SECONDARY_REFERENCE"]), NEWS_CURRENT_EVENTS: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "GOVERNMENT", "REGULATOR", "REPUTABLE_NEWS"]), WEATHER: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "GOVERNMENT", "SECONDARY_REFERENCE"]), GENERAL_CURRENT: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "GOVERNMENT", "REGULATOR", "OFFICIAL_COMPANY", "ACADEMIC", "REPUTABLE_NEWS", "SECONDARY_REFERENCE"]) });
var TTL = Object.freeze({ STOCK_OR_MARKET_PRICE: 900, WEATHER_CURRENT: 10800, BREAKING_NEWS: 86400, NEWS_DEVELOPMENT: 604800, PUBLIC_HEALTH_ALERT: 86400, GENERAL_CURRENT_FACT: 604800 });
var CLAIM_ALLOWED = Object.freeze({ HEALTH: /* @__PURE__ */ new Set(["PUBLIC_HEALTH_ALERT", "MEDICAL_GUIDELINE", "GENERAL_CURRENT_FACT", "NEWS_DEVELOPMENT"]), FINANCIAL_MARKETS: /* @__PURE__ */ new Set(["STOCK_OR_MARKET_PRICE", "POLICY_OR_REGULATION", "BREAKING_NEWS", "NEWS_DEVELOPMENT", "GENERAL_CURRENT_FACT"]), COMPANY_PRODUCT: /* @__PURE__ */ new Set(["COMPANY_PRODUCT_SPEC", "POLICY_OR_REGULATION", "BREAKING_NEWS", "NEWS_DEVELOPMENT", "GENERAL_CURRENT_FACT"]), NEWS_CURRENT_EVENTS: /* @__PURE__ */ new Set(["BREAKING_NEWS", "NEWS_DEVELOPMENT", "GENERAL_CURRENT_FACT"]), WEATHER: /* @__PURE__ */ new Set(["WEATHER_CURRENT", "GENERAL_CURRENT_FACT"]), GENERAL_CURRENT: /* @__PURE__ */ new Set(["GENERAL_CURRENT_FACT", "BREAKING_NEWS", "NEWS_DEVELOPMENT", "POLICY_OR_REGULATION", "COMPANY_PRODUCT_SPEC"]) });
function fail(code, status = 422) {
  const e = new Error(code);
  e.code = code;
  e.status = status;
  throw e;
}
function freeze(v) {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) freeze(x);
  }
  return v;
}
function iso(v, code) {
  const d = new Date(v);
  if (!v || Number.isNaN(d.valueOf())) fail(code, 400);
  return d.toISOString();
}
function evaluateCurrentness({ claimType, retrievedAt, now = (/* @__PURE__ */ new Date()).toISOString(), sourceVersionCurrent = null, superseded = false } = {}) {
  const r = new Date(iso(retrievedAt, "CWA_RETRIEVED_AT_INVALID")), n = new Date(iso(now, "CWA_NOW_INVALID"));
  if (r > n) fail("CWA_RETRIEVAL_FROM_FUTURE", 400);
  if (TTL[claimType] != null) {
    const age = Math.floor((n - r) / 1e3);
    return freeze({ freshnessState: age <= TTL[claimType] ? "FRESH" : "STALE", mode: "TTL", ageSeconds: age, ttlSeconds: TTL[claimType] });
  }
  if (claimType === "POLICY_OR_REGULATION") return freeze({ freshnessState: superseded ? "STALE" : "FRESH_UNTIL_SUPERSEDED", mode: "UNTIL_SUPERSEDED" });
  if (claimType === "MEDICAL_GUIDELINE" || claimType === "COMPANY_PRODUCT_SPEC") return freeze({ freshnessState: sourceVersionCurrent === true ? "FRESH_VERSION_BOUND" : "VERSION_CHECK_REQUIRED", mode: claimType === "MEDICAL_GUIDELINE" ? "VERSION_BOUND" : "CURRENT_RELEASE" });
  return freeze({ freshnessState: "NO_FRESHNESS_POLICY", mode: "REJECT" });
}

// functions/current-facts-gateway/current-facts-gateway.js
var CLAIM_BY_DOMAIN = Object.freeze({ WEATHER: "WEATHER_CURRENT", FINANCIAL_MARKETS: "GENERAL_CURRENT_FACT", NEWS_CURRENT_EVENTS: "NEWS_DEVELOPMENT", COMPANY_PRODUCT: "COMPANY_PRODUCT_SPEC", GENERAL_CURRENT: "GENERAL_CURRENT_FACT" });

// content/world/company-filings-r1.json
var company_filings_r1_default = {
  schemaVersion: "WORLD_OFFICIAL_FILING_SNAPSHOTS_R2",
  status: "DATED_PUBLIC_FILING_NOT_LIVE_MARKET_DATA",
  companies: [
    {
      symbol: "MYX:0338",
      name: "ORIENTAL KOPI HOLDINGS BERHAD",
      currency: "MYR",
      sourceUrl: "https://ir2.chartnexus.com/kopi/onenew.php?id=3700325&type=Announcement",
      sourceId: "FRA-28082026-00007",
      publishedAt: "2026-08-28",
      checkedAt: "2026-10-30",
      sourceAuthority: "ISSUER_IR_REPRODUCTION_OF_BURSA_ANNOUNCEMENT",
      filing: {
        periodStart: "2026-04-01",
        periodEnd: "2026-06-30",
        periodKind: "QUARTER",
        comparison: "SAME_QUARTER_PRIOR_YEAR",
        audited: false,
        statementUnit: "MYR_THOUSANDS",
        scale: 1e3,
        revenue: 156626,
        priorRevenue: 116745,
        netProfit: 17004,
        priorNetProfit: 17948,
        reportedEps: 0.85,
        epsUnit: "SEN",
        netAssetsPerShare: 0.16,
        totalAssets: 490140,
        totalLiabilities: 167561,
        equity: 322579,
        sharesOutstanding: 2e9,
        annualOrTtmNetProfit: null,
        annualOrTtmEps: null,
        averageEquity: null,
        statementBasis: "CONSOLIDATED",
        accountingStandards: "MFRS 134",
        shareClass: "ORDINARY",
        grossProfit: 36774,
        operatingProfit: 26028,
        cash: 13933,
        currentAssets: 307407,
        currentLiabilities: 42696,
        borrowings: 3044,
        sharesAsOf: "2026-06-30",
        operatingCashFlow: 50938,
        capex: 24041,
        capexConvention: "POSITIVE_CASH_OUTFLOW",
        dividendsPaid: 2e4,
        cashFlowPeriod: {
          start: "2025-10-01",
          end: "2026-06-30",
          kind: "YTD"
        },
        yearToDateSummary: {
          start: "2025-10-01",
          end: "2026-06-30",
          kind: "YTD",
          unit: "MYR_THOUSANDS",
          revenue: 443079,
          priorRevenue: 317756,
          netProfit: 49083,
          priorNetProfit: 44861,
          reportedEpsSen: 2.45,
          priorReportedEpsSen: 2.46,
          pdfPage: 2
        }
      },
      quote: null,
      limits: [
        "MANUALLY_CHECKED_LATEST_AS_OF_2026_10_30_NOT_CONTINUOUS_REFRESH",
        "BURSA_QUOTE_AND_REDISTRIBUTION_RIGHTS_NOT_VERIFIED",
        "QUARTER_NOT_ANNUALISED",
        "B8_BORROWINGS_EXCLUDE_LEASE_LIABILITIES",
        "CASH_EXCLUDES_OTHER_INVESTMENTS"
      ],
      latestFilingCheck: {
        checkedAt: "2026-10-30",
        indexUrl: "https://ir2.chartnexus.com/kopi/financial-report.php",
        latestListedPeriodEnd: "2026-06-30",
        method: "MANUAL_ISSUER_OFFICIAL_INDEX_CHECK",
        automaticRefresh: false
      },
      verifiedReport: {
        url: "https://ir2.chartnexus.com/kopi/docs/qr/q3_2026.pdf",
        sha256: "542364f8e59f1f5a17de729e1d2291b3415c05631efca9b2c9e5dfec94d733c8",
        pages: 22,
        checkedAt: "2026-10-30",
        verifier: "CODEX_MANUAL_DOCUMENT_CHECK_NOT_TL_HUMAN_ACCEPTANCE",
        borrowingsBasis: "B8 hire purchases only; lease liabilities excluded; not total liabilities",
        cashBasis: "Cash and bank balances only; other investments excluded",
        fieldPages: {
          revenue: 2,
          netProfit: 2,
          grossProfit: 2,
          operatingProfit: 2,
          totalAssets: 3,
          totalLiabilities: 3,
          equity: 3,
          cash: 3,
          currentAssets: 3,
          currentLiabilities: 3,
          borrowings: 19,
          sharesOutstanding: 4,
          operatingCashFlow: 6,
          capex: 6,
          dividendsPaid: 7
        }
      }
    }
  ],
  predecessorRevision: "206afa8f",
  predecessorSha256: "911e769330935ba36ed345376ea5ef7ab753759c5bc1cee301d1ebb714ef69c1"
};

// scripts/lib/civilization-atlas/moomoo-financial-metrics-v1.mjs
function financialRatio(numerator, denominator, { name = "ratio", scale = 100, numeratorDefinition } = {}) {
  const fail2 = (reason) => ({ name, state: "NOT_COMPARABLE", value: null, reason });
  if (!numerator || !denominator) return fail2("INPUT_MISSING");
  for (const k of ["instrument", "timestamp"]) if (!numerator[k] || numerator[k] !== denominator[k]) return fail2("PERIOD_OR_INSTRUMENT_MISMATCH");
  for (const k of ["currencyCode", "periodText", "accountingStandards"]) if (!numerator.meta?.[k] || numerator.meta[k] !== denominator.meta?.[k]) return fail2("BASIS_MISMATCH");
  if (numerator.unit !== denominator.unit) return fail2("UNIT_MISMATCH");
  if (!Number.isFinite(numerator.value) || !Number.isFinite(denominator.value) || denominator.value <= 0 || numerator.value < 0) return fail2("INVALID_DENOMINATOR_OR_INAPPLICABLE_NEGATIVE");
  return { name, state: "DERIVED", value: numerator.value / denominator.value * scale, formula: `numerator / denominator * ${scale}`, numeratorDefinition, inputs: [numerator, denominator], calculationVersion: "world-financial-ratio-v1", unit: scale === 100 ? "percent" : "ratio", nullsAreNotZero: true };
}
function independentQuarterTTM(rows) {
  if (rows.length !== 4 || rows.some((r) => r.meta?.flowBasis !== "INDEPENDENT_QUARTER")) return { state: "NOT_COMPUTED", reason: "FOUR_INDEPENDENT_QUARTERS_REQUIRED", value: null };
  if (new Set(rows.map((r) => r.meta.periodText)).size !== 4 || new Set(rows.map((r) => r.meta.currencyCode)).size !== 1 || new Set(rows.map((r) => r.instrument)).size !== 1 || rows.some((r) => !Number.isFinite(r.value))) return { state: "NOT_COMPUTED", reason: "PERIOD_OR_CURRENCY_MISMATCH", value: null };
  const times = rows.map((r) => Date.parse(r.timestamp)).sort((a, b) => a - b);
  if (times.some((t, i) => i && (t - times[i - 1] < 60 * 864e5 || t - times[i - 1] > 120 * 864e5))) return { state: "NOT_COMPUTED", reason: "NON_CONSECUTIVE_QUARTERS", value: null };
  return { state: "DERIVED", value: rows.reduce((n, r) => n + r.value, 0), formula: "sum of four explicitly independent, consecutive quarters", inputs: rows };
}

// functions/_lib/world-company-analysis.js
var finite = (x) => typeof x === "number" && Number.isFinite(x);
var unknown = (unit, reason) => ({ value: null, unit, state: "UNKNOWN", reason });
var metric = (value, unit, formula, sourceRefs) => finite(value) ? { value, unit, state: "KNOWN", formula, sourceRefs } : unknown(unit, "REQUIRED_INPUT_UNKNOWN");
function companySymbol(value) {
  if (typeof value !== "string" || !/^MYX:\d{4}$/.test(value)) throw Error("PUBLIC_COMPANY_SYMBOL_INVALID");
  return value;
}
function analyzeWorldCompany(packet, { now = (/* @__PURE__ */ new Date()).toISOString(), peMultiples = [] } = {}) {
  const symbol = companySymbol(packet.symbol);
  if (!Array.isArray(peMultiples) || peMultiples.length > 5 || peMultiples.some((x) => !finite(x) || x <= 0 || x > 200)) throw Error("SCENARIO_ASSUMPTIONS_INVALID");
  const f = packet.filing || {}, refs = packet.sourceId ? [packet.sourceId] : [], unit = packet.currency;
  const validCurrency = /^[A-Z]{3}$/.test(unit || ""), validFiling = validCurrency && f.scale > 0 && finite(f.scale) && /^\d{4}-\d{2}-\d{2}$/.test(f.periodEnd || "") && refs.length && /^https:\/\//.test(packet.sourceUrl || "");
  const money = (k) => validFiling && finite(f[k]) ? f[k] * f.scale : null;
  const annualReady = validFiling && ["ANNUAL", "TTM"].includes(f.annualOrTtmBasis) && f.annualOrTtmPeriodEnd === f.periodEnd;
  const revenue = money("revenue"), profit = money("netProfit"), annualProfit = annualReady ? money("annualOrTtmNetProfit") : null, averageEquity = annualReady && f.averageEquityPeriodMatched === true ? money("averageEquity") : null;
  let quoteState = "PROVIDER_GAP", price = null;
  const q = packet.quote;
  if (q) {
    quoteState = "RIGHTS_OR_IDENTITY_NOT_VERIFIED";
    if (q.redistributionAllowed === true && q.symbol === symbol && q.currency === unit && q.sourceId && q.priceType === "LAST_TRADED" && finite(q.price) && q.price >= 0 && q.retrievedAt === q.asOf) {
      try {
        const fresh = evaluateCurrentness({ claimType: "STOCK_OR_MARKET_PRICE", retrievedAt: q.asOf, now });
        quoteState = fresh.freshnessState;
        if (quoteState === "FRESH") price = q.price;
      } catch {
        quoteState = "INVALID_QUOTE_TIME";
      }
    }
  }
  const out = { revenue: metric(revenue, unit, "reported revenue \xD7 statement scale", refs), netProfit: metric(profit, unit, "reported profit \xD7 statement scale", refs), totalAssets: metric(money("totalAssets"), unit, "reported assets \xD7 statement scale", refs), totalLiabilities: metric(money("totalLiabilities"), unit, "reported liabilities \xD7 statement scale", refs), equity: metric(money("equity"), unit, "reported equity \xD7 statement scale", refs), eps: metric(validFiling && finite(f.reportedEps) && ["SEN", "MYR"].includes(f.epsUnit) ? f.reportedEps / (f.epsUnit === "SEN" ? 100 : 1) : null, validCurrency ? unit + "/share" : null, "reported EPS; sen \xF7 100 for MYR", refs) };
  const priorRevenue = money("priorRevenue");
  out.revenueGrowth = metric(f.comparison === "SAME_QUARTER_PRIOR_YEAR" && priorRevenue > 0 && revenue !== null ? (revenue - priorRevenue) / priorRevenue * 100 : null, "percent", "(revenue \u2212 comparable prior revenue) / prior revenue \xD7 100", refs);
  out.profitMargin = metric(revenue > 0 && profit !== null ? profit / revenue * 100 : null, "percent", "net profit / revenue \xD7 100", refs);
  out.marketCap = metric(price !== null && validFiling && finite(f.sharesOutstanding) && f.sharesOutstanding > 0 && f.sharesAsOf === q?.asOf?.slice(0, 10) ? price * f.sharesOutstanding : null, unit, "fresh price \xD7 dated current shares outstanding", [...refs, ...q?.sourceId ? [q.sourceId] : []]);
  out.pe = metric(price !== null && annualReady && f.annualOrTtmEps > 0 ? price / f.annualOrTtmEps : null, "multiple", "fresh price / annual or TTM EPS", refs);
  out.pb = metric(price !== null && validFiling && f.netAssetsPerShare > 0 ? price / f.netAssetsPerShare : null, "multiple", "fresh price / dated net assets per share (dates remain explicit)", refs);
  out.roe = metric(annualProfit !== null && averageEquity > 0 ? annualProfit / averageEquity * 100 : null, "percent", "annual or TTM net profit / matching average equity \xD7 100", refs);
  const scope = f.statementBasis || "UNKNOWN", extendedReady = validFiling && ["CONSOLIDATED", "COMPANY"].includes(scope) && Boolean(f.accountingStandards) && Boolean(f.shareClass);
  const observation = (value) => ({ value, instrument: symbol, timestamp: f.periodEnd, unit, meta: { currencyCode: unit, periodText: [f.periodStart, f.periodEnd, f.periodKind, scope, f.shareClass].join("/"), accountingStandards: f.accountingStandards } });
  const ratio = (a, b, scale = 100) => extendedReady ? financialRatio(observation(a), observation(b), { scale }) : { value: null };
  const cash = money("cash"), debt = money("borrowings"), ocf = money("operatingCashFlow"), capex = money("capex");
  out.cash = metric(cash, unit, "reported cash \xD7 statement scale", refs);
  out.debt = metric(debt, unit, "reported borrowings \xD7 statement scale; liabilities are not assumed to be debt", refs);
  out.netDebt = metric(extendedReady && cash !== null && debt !== null ? debt - cash : null, unit, "borrowings \u2212 cash; a negative value is net cash", refs);
  out.debtToEquity = metric(ratio(debt, money("equity")).value ?? null, "percent", "borrowings / matching positive equity \xD7 100", refs);
  out.currentRatio = metric(ratio(money("currentAssets"), money("currentLiabilities"), 1).value ?? null, "multiple", "current assets / matching positive current liabilities", refs);
  out.grossMargin = metric(extendedReady && revenue > 0 && money("grossProfit") !== null ? money("grossProfit") / revenue * 100 : null, "percent", "gross profit / same-period revenue \xD7 100", refs);
  out.operatingMargin = metric(extendedReady && revenue > 0 && money("operatingProfit") !== null ? money("operatingProfit") / revenue * 100 : null, "percent", "operating profit / same-period revenue \xD7 100", refs);
  const priorQ = f.previousQuarter, quarterComparable = extendedReady && f.periodKind === "QUARTER" && priorQ?.periodKind === "QUARTER" && priorQ.periodStart && Date.parse(priorQ.periodEnd) - Date.parse(priorQ.periodStart) >= 59 * 864e5 && Date.parse(priorQ.periodEnd) - Date.parse(priorQ.periodStart) <= 119 * 864e5 && priorQ.statementBasis === scope && priorQ.currency === unit && priorQ.shareClass === f.shareClass && priorQ.sourceId && Date.parse(f.periodStart) - Date.parse(priorQ.periodEnd) === 864e5 && money("previousQuarterRevenue") > 0;
  out.revenueGrowthQoQ = metric(quarterComparable && revenue !== null ? (revenue - money("previousQuarterRevenue")) / money("previousQuarterRevenue") * 100 : null, "percent", "(revenue \u2212 verified previous independent quarter revenue) / previous quarter revenue \xD7 100", refs.concat(priorQ?.sourceId || []));
  out.operatingCashFlow = metric(ocf, unit, "reported operating cash flow \xD7 statement scale", refs);
  out.freeCashFlow = metric(extendedReady && ocf !== null && capex !== null && capex >= 0 && f.capexConvention === "POSITIVE_CASH_OUTFLOW" ? ocf - capex : null, unit, "operating cash flow \u2212 positive capex outflow; convention must be explicit", refs);
  out.dividendsPaid = metric(money("dividendsPaid"), unit, "reported dividend cash payments; not an assumed annual dividend rate", refs);
  out.roa = metric(extendedReady && annualProfit !== null && f.averageAssetsPeriodMatched === true && money("averageAssets") > 0 ? annualProfit / money("averageAssets") * 100 : null, "percent", "annual or TTM net profit / matched average assets \xD7 100", refs);
  let ttmEps = annualReady && f.annualOrTtmBasis === "TTM" && finite(f.annualOrTtmEps) ? f.annualOrTtmEps : null;
  const quarters = f.independentQuarterEps || [], orderedQuarters = [...quarters].sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
  const independentSpans = orderedQuarters.length === 4 && orderedQuarters.every((r, i) => Number.isFinite(Date.parse(r.meta?.periodStart)) && Date.parse(r.timestamp) - Date.parse(r.meta.periodStart) >= 59 * 864e5 && Date.parse(r.timestamp) - Date.parse(r.meta.periodStart) <= 119 * 864e5 && (!i || Date.parse(r.meta.periodStart) - Date.parse(orderedQuarters[i - 1].timestamp) === 864e5)) && Date.parse(orderedQuarters[3].timestamp) - Date.parse(orderedQuarters[0].meta.periodStart) >= 350 * 864e5 && Date.parse(orderedQuarters[3].timestamp) - Date.parse(orderedQuarters[0].meta.periodStart) <= 379 * 864e5;
  if (ttmEps === null && extendedReady && independentSpans && quarters.length === 4 && quarters.every((r) => r.instrument === symbol && r.unit === unit + "/share" && r.meta?.currencyCode === unit && r.meta.statementBasis === scope && r.meta.shareClass === f.shareClass && r.meta.epsBasis === f.epsBasis && r.meta.sharesBasisId === f.sharesBasisId && r.meta.sourceId && Number.isFinite(Date.parse(r.timestamp))) && f.epsBasis && f.sharesBasisId && quarters.map((r) => r.timestamp.slice(0, 10)).sort().at(-1) === f.periodEnd) {
    const t = independentQuarterTTM(quarters);
    if (t.state === "DERIVED") ttmEps = t.value;
  }
  out.ttmEps = metric(ttmEps, validCurrency ? unit + "/share" : null, "explicit TTM EPS, or sum of four independent consecutive quarters on a matching EPS/share basis", refs.concat(quarters.map((r) => r.meta?.sourceId).filter(Boolean)));
  out.dividendYield = metric(price > 0 && extendedReady && f.annualDividendBasis === "PAST_12_MONTHS_DECLARED" && f.annualDividendPeriodEnd === q?.asOf?.slice(0, 10) && finite(f.annualDividendsPerShare) && f.annualDividendsPerShare >= 0 && f.dividendSourceId ? f.annualDividendsPerShare / price * 100 : null, "percent", "verified trailing twelve-month dividend per share / fresh authorized quote \xD7 100", refs.concat(f.dividendSourceId || []));
  const segments = f.businessSegments || [], segmentReady = extendedReady && revenue > 0 && f.segmentBasis === "NET_OF_ELIMINATIONS" && segments.length > 0 && segments.every((r) => r.name && r.sourceId && finite(r.revenue)) && Math.abs(segments.reduce((n, r) => n + r.revenue * f.scale, 0) - revenue) < 0.01;
  const segmentContributions = segments.map((r) => ({ name: r.name, contribution: metric(segmentReady ? r.revenue * f.scale / revenue * 100 : null, "percent", "reported segment revenue / reconciled consolidated revenue \xD7 100", [r.sourceId].filter(Boolean)) }));
  const latestChecked = packet.latestFilingCheck?.method === "MANUAL_ISSUER_OFFICIAL_INDEX_CHECK" && packet.latestFilingCheck.latestListedPeriodEnd === f.periodEnd && packet.latestFilingCheck.checkedAt === packet.checkedAt && Date.parse(packet.checkedAt) <= Date.parse(now);
  const annotate = (m, metricId) => {
    m.metricId = metricId;
    m.period = { start: f.periodStart || null, end: f.periodEnd || null, kind: f.periodKind || null, statementBasis: scope };
    if (["totalAssets", "totalLiabilities", "equity", "cash", "debt", "netDebt", "debtToEquity", "currentRatio", "marketCap", "pb"].includes(metricId)) m.period = { start: null, end: f.periodEnd || null, kind: "AS_OF", statementBasis: scope };
    if (["operatingCashFlow", "freeCashFlow", "dividendsPaid"].includes(metricId) && f.cashFlowPeriod) {
      if (!["QUARTER", "YTD", "ANNUAL", "TTM"].includes(f.cashFlowPeriod.kind) || f.cashFlowPeriod.end !== f.periodEnd || !(Date.parse(f.cashFlowPeriod.start) < Date.parse(f.cashFlowPeriod.end))) throw Error("CASHFLOW_PERIOD_INVALID");
      m.period = { ...f.cashFlowPeriod, statementBasis: scope };
    }
    if (["ttmEps", "pe", "roe", "roa"].includes(metricId)) {
      m.period = { start: f.annualOrTtmPeriodStart || (independentSpans ? orderedQuarters[0].meta.periodStart : null), end: f.annualOrTtmPeriodEnd || f.periodEnd || null, kind: metricId === "ttmEps" || independentSpans ? "TTM" : f.annualOrTtmBasis || "UNKNOWN", statementBasis: scope };
    }
    m.inputSourceRefs = [.../* @__PURE__ */ new Set([...m.sourceRefs || refs, ...["marketCap", "pe", "pb", "dividendYield"].includes(metricId) && price !== null && q?.sourceId ? [q.sourceId] : []])];
    m.sourceAsOf = { filing: packet.publishedAt || null, quote: ["marketCap", "pe", "pb", "dividendYield"].includes(metricId) ? q?.asOf || null : null };
    m.formula = m.formula || "Required source-bound inputs are missing or not comparable";
    m.calculationVersion = "WORLD_COMPANY_WMDA_R2";
    m.limitations = [...m.value === null ? ["REQUIRED_INPUT_UNKNOWN_OR_INCOMPARABLE"] : [], ...scope === "UNKNOWN" ? ["STATEMENT_SCOPE_NOT_EXTRACTED"] : [], ...latestChecked ? ["LATEST_CHECKED_AS_OF_" + packet.checkedAt + "_NOT_AUTOMATIC_REFRESH"] : ["DATED_FILING_NOT_VERIFIED_LATEST"]];
    if (["debt", "netDebt", "debtToEquity"].includes(metricId) && packet.verifiedReport?.borrowingsBasis) m.limitations.push(packet.verifiedReport.borrowingsBasis);
    return m;
  };
  for (const [id, m] of Object.entries(out)) annotate(m, id);
  for (const row of segmentContributions) annotate(row.contribution, "segmentContribution");
  const valuationEps = annualReady && finite(f.annualOrTtmEps) ? f.annualOrTtmEps : ttmEps;
  if (price !== null && valuationEps > 0 && out.pe.value === null) out.pe = annotate(metric(price / valuationEps, "multiple", "fresh authorized price / verified independent-quarter TTM EPS", refs.concat(quarters.map((r) => r.meta?.sourceId).filter(Boolean))), "pe");
  const scenarios = peMultiples.map((pe) => ({ assumption: { peMultiple: pe, basis: "USER_DECLARED_NOT_FORECAST" }, price: metric(valuationEps > 0 ? valuationEps * pe : null, validCurrency ? unit + "/share" : null, "annual or TTM EPS \xD7 declared PE assumption", refs) }));
  for (const scenario of scenarios) {
    annotate(scenario.price, "declaredScenarioPrice");
    scenario.price.limitations.push("USER_DECLARED_ASSUMPTION_NOT_FORECAST");
  }
  return { symbol, name: packet.name || symbol, exchange: "MYX", securityCode: symbol.slice(4), industry: packet.industry || null, currency: unit || null, state: validFiling ? "PARTIAL_DATED_FILING" : "SOURCE_GAP", metrics: out, period: { start: f.periodStart || null, end: f.periodEnd || null, kind: f.periodKind || null, comparison: f.comparison || null, audited: f.audited === true }, source: { id: packet.sourceId || null, url: packet.sourceUrl || null, publishedAt: packet.publishedAt || null, checkedAt: packet.checkedAt || null, authority: packet.sourceAuthority || null, verifiedReport: packet.verifiedReport || null, latestFilingCheck: packet.latestFilingCheck || null }, freshness: { filing: latestChecked ? "LATEST_MANUALLY_VERIFIED_AS_OF_CHECK_NOT_AUTOMATIC_REFRESH" : "HISTORICAL_AS_FILED_NOT_VERIFIED_LATEST", quote: quoteState, computedAt: now }, scenarios, limits: [...packet.limits || [], "NO_QUARTERLY_ANNUALISATION", "NO_PRICE_TARGET_OR_INVESTMENT_RECOMMENDATION"], segmentContributions, reportedYearToDate: f.yearToDateSummary || null, interpretationMode: "RULE_BASED_EXPLANATION", providerCalls: 0, modelCalls: 0, personalFactsCreated: false };
}

// assets/js/pages/civilization-atlas/world-r42-contract.js
function compareWorldObjects(a, b) {
  if (!a || !b) return { state: "COMPARABILITY_UNKNOWN", reasons: ["OBJECT_MISSING"] };
  const reasons = [];
  for (const [field, reason] of [["indicatorId", "INDICATOR_DEFINITIONS_DIFFER"], ["spatialLevel", "SPATIAL_SCOPES_DIFFER"], ["priceBasis", "PRICE_BASES_DIFFER"]]) if (a[field] && b[field] && a[field] !== b[field]) reasons.push(reason);
  if (a.unit && b.unit && a.unit !== b.unit) reasons.push("INCOMPATIBLE_UNITS");
  if (a.methodology && b.methodology && a.methodology !== b.methodology) reasons.push("INCOMPATIBLE_METHODS");
  if (reasons.length) return { state: "NOT_COMPARABLE", reasons };
  if (a.type !== b.type) return { state: "NOT_COMPARABLE", reasons: ["DIFFERENT_OBJECT_CLASSES"] };
  if (a.id === b.id) return { state: "COMPARABILITY_UNKNOWN", reasons: ["SELECT_TWO_DISTINCT_OBJECTS"] };
  if (!a.source || !b.source || !a.time || !b.time) return { state: "COMPARABILITY_UNKNOWN", reasons: ["SOURCE_OR_TIME_UNKNOWN"] };
  if (a.unit && b.unit && (a.time.start !== b.time.start || a.time.end !== b.time.end)) return { state: "NOT_COMPARABLE", reasons: ["MEASUREMENT_PERIODS_DIFFER"] };
  return { state: a.comparisonBasis && a.comparisonBasis === b.comparisonBasis ? "COMPARABLE" : "PARTIALLY_COMPARABLE", reasons: a.comparisonBasis === b.comparisonBasis && a.comparisonBasis ? [] : ["DESCRIPTIVE_SOURCE_ROWS_ONLY_NO_RANK_OR_CAUSAL_INFERENCE"] };
}

// functions/current-facts-gateway/world-company-projection.js
function retrievePublicCompany(input, { now = (/* @__PURE__ */ new Date()).toISOString() } = {}) {
  if (Object.keys(input).some((k) => !["operation", "symbol", "compare", "pe"].includes(k)) || input.operation !== "company") throw Error("PUBLIC_COMPANY_QUERY_INVALID");
  const symbol = companySymbol(input.symbol), comparison = input.compare ? companySymbol(input.compare) : null;
  if (input.pe !== void 0 && !/^\d{1,3}(?:\.\d{1,2})?(?:,\d{1,3}(?:\.\d{1,2})?){0,4}$/.test(input.pe)) throw Error("SCENARIO_ASSUMPTIONS_INVALID");
  const peMultiples = input.pe ? input.pe.split(",").map(Number) : [];
  const resolve = (s) => analyzeWorldCompany(company_filings_r1_default.companies.find((x) => x.symbol === s) || { symbol: s }, { now, peMultiples });
  const company = resolve(symbol), other = comparison ? resolve(comparison) : null;
  const object = (c) => ({ id: c.symbol, type: "COMPANY_FINANCIAL_" + c.period.kind, unit: c.currency, source: c.source.id, time: { start: c.period.start, end: c.period.end }, comparisonBasis: c.period.kind, indicatorId: c.period.kind });
  const comparability = other ? compareWorldObjects(object(company), object(other)) : null;
  return { company, comparison: other ? { company: other, state: comparability.state === "COMPARABLE" ? "COMPARABLE_PERIOD" : "INCOMPARABLE_OR_MISSING_PERIOD", ownerResult: comparability, rankingProduced: false } : null, providerState: "NO_LIVE_PROVIDER_CALLED", storageWrites: 0, feeUSD: 0 };
}

// functions/api/current-facts.js
var H = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };
var json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: H });
var requests = /* @__PURE__ */ new Map();
async function onRequestGet({ request } = {}) {
  if (!request) return json({ ok: false, error: "CURRENT_FACTS_POST_ONLY" }, 405);
  try {
    const u = new URL(request.url);
    if (u.search.length > 240 || [...u.searchParams.keys()].some((k) => u.searchParams.getAll(k).length !== 1)) throw Error();
    if (u.searchParams.get("operation") !== "company") return json({ ok: false, error: "CURRENT_FACTS_POST_ONLY" }, 405);
    const result = retrievePublicCompany(Object.fromEntries(u.searchParams));
    const now = Date.now(), bucket = Math.floor(now / 6e4), address = request.headers.get("cf-connecting-ip") || "UNSPECIFIED_SHARED_BUCKET";
    const key = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(address + ":" + bucket)))).slice(0, 12).join(".");
    for (const [k, v] of requests) if (v.bucket !== bucket) requests.delete(k);
    if (requests.size >= 512 && !requests.has(key)) return json({ ok: false, error: "PUBLIC_QUERY_CAPACITY" }, 429);
    const count = (requests.get(key)?.count || 0) + 1;
    requests.set(key, { bucket, count });
    if (count > 60) return new Response(JSON.stringify({ ok: false, error: "PUBLIC_QUERY_RATE_LIMIT" }), { status: 429, headers: { ...H, "retry-after": "60" } });
    return new Response(JSON.stringify({ ok: true, result }), { headers: { ...H, "cache-control": "public,max-age=300", "vary": "Accept-Encoding" } });
  } catch {
    return json({ ok: false, error: "PUBLIC_COMPANY_QUERY_INVALID" }, 400);
  }
}

// ../../../../../../phios/tools/review/world-customer-journey-r4/worker-isolation/fixture-worker.mjs
var fixture_worker_default = { fetch(request, env) {
  return onRequest({ request, env, next: async () => {
    if (new URL(request.url).pathname === "/trap") {
      try {
        await env.RUNTIME_DB.prepare("INSERT INTO isolation_probe VALUES(1)").run();
      } catch {
      }
      return Response.json({ swallowed: true });
    }
    if (request.method === "GET") return onRequestGet({ request });
    return Response.json({ safePost: true });
  } });
} };

// world-preview-scope.mjs
var world_preview_scope_default = { ...fixture_worker_default, async fetch(request, env, ctx) {
  const response = await fixture_worker_default.fetch(request, { ...env, PHIOS_D1_MAINTENANCE_MODE: "READ_ONLY" }, ctx);
  const result = new Response(response.body, response);
  result.headers.set("X-PHIOS-Review-Scope", "WORLD_BRANCH_BUILD");
  result.headers.set("X-PHIOS-Source-Commit", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  return result;
} };
export {
  world_preview_scope_default as default
};
