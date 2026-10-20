// functions/_lib/world-bank-observations.js
var WORLD_BANK_INDICATORS = Object.freeze({
  "SP.POP.TOTL": { unit: "persons", priceBasis: null, title: { en: "Population, total", "zh-Hans": "\u603B\u4EBA\u53E3" } },
  "NY.GDP.MKTP.CD": { unit: "USD", priceBasis: "CURRENT_USD", title: { en: "GDP (current US$)", "zh-Hans": "\u56FD\u5185\u751F\u4EA7\u603B\u503C\uFF08\u73B0\u4EF7\u7F8E\u5143\uFF09" } }
});
function observationRequest(input) {
  const keys = Object.keys(input);
  if (keys.some((k) => !["country", "indicator", "year"].includes(k))) throw Error("PUBLIC_IDENTIFIERS_ONLY");
  const country = String(input.country || "").toUpperCase(), indicator = input.indicator, year = Number(input.year);
  if (!/^[A-Z]{2}$/.test(country) || !WORLD_BANK_INDICATORS[indicator] || !Number.isInteger(year) || year < 1960 || year > (/* @__PURE__ */ new Date()).getUTCFullYear()) throw Error("OBSERVATION_INPUT_INVALID");
  return { country, indicator, year };
}
async function readWorldBankObservation(input, { fetcher = fetch, now = () => (/* @__PURE__ */ new Date()).toISOString() } = {}) {
  const q = observationRequest(input), sourceUrl = `https://api.worldbank.org/v2/country/${q.country}/indicator/${q.indicator}?format=json&date=${q.year}&per_page=1`, base = { ...q, provider: "WORLD_BANK", sourceUrl, retrievedAt: now(), sourceLanguage: "en", spatialLevel: "COUNTRY", definition: WORLD_BANK_INDICATORS[q.indicator], value: null, observationPeriod: q.year, publicationDate: null, personalFact: false, providerCalls: 0 };
  try {
    const r = await fetcher(sourceUrl, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12e3) });
    if (!r.ok) return { ...base, state: r.status === 403 ? "NO_ACCESS" : "SERVICE_ERROR", httpStatus: r.status };
    const body = await r.json();
    if (Array.isArray(body) && body[0]?.total === 0 && body[1] === null) return { ...base, state: "YEAR_MISSING" };
    if (!Array.isArray(body) || !body[0] || !Array.isArray(body[1])) return { ...base, state: "INVALID_RESPONSE" };
    const row = body[1][0];
    if (!row) return { ...base, state: "YEAR_MISSING" };
    if (row.country?.id !== q.country || row.indicator?.id !== q.indicator || String(row.date) !== String(q.year) || body[1].length !== 1) return { ...base, state: "IDENTITY_MISMATCH" };
    if (row.unit && row.unit !== WORLD_BANK_INDICATORS[q.indicator].unit) return { ...base, state: "UNIT_MISMATCH" };
    if (row.value == null) return { ...base, state: "YEAR_MISSING", sourceVersion: body[0].lastupdated || null };
    if (typeof row.value !== "number" || !Number.isFinite(row.value)) return { ...base, state: "INVALID_RESPONSE" };
    return { ...base, state: "OBSERVED", value: row.value, countryName: row.country.value, countryIso3: row.countryiso3code, sourceVersion: body[0].lastupdated || null, publicationDate: null, datasetUpdatedAt: body[0].lastupdated || null, observationDate: String(row.date) };
  } catch (error) {
    return { ...base, state: error.name === "TimeoutError" || error.name === "AbortError" ? "TIMEOUT" : "SERVICE_ERROR" };
  }
}

// content/world/world-evidence-series-v1.json
var world_evidence_series_v1_default = {
  contractVersion: "WORLD_EVIDENCE_P1_V1",
  series: {
    US_HMDA: {
      seriesId: "US_HMDA",
      countryCode: "USA",
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      licenseState: "FEDERAL_PUBLIC_DATA",
      allowedRawHashes: [
        "439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
        "a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93"
      ],
      sourceUrls: [
        "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2024&loan_purposes=1&actions_taken=1,2,3",
        "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2025&loan_purposes=1&actions_taken=1,2,3"
      ],
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "Credit publisher, dataset, period and fetch vintage; no logos/endorsement; third-party content excluded",
      filters: {
        loan_purposes: [
          1
        ],
        actions_taken: [
          1,
          2,
          3
        ],
        excludes: [
          4,
          5,
          6,
          7,
          8
        ],
        notFiltered: [
          "income",
          "lien",
          "occupancy",
          "loan_type",
          "dwelling",
          "business_purpose",
          "reporter_type"
        ],
        preapproval: "Actions7/8 excluded; action1 may include originated preapproval requests"
      }
    },
    US_SLOOS: {
      seriesId: "US_SLOOS",
      countryCode: "USA",
      unit: "respondent_banks",
      frequency: "QUARTERLY_SURVEY",
      populationOrInstitutionCoverage: "49 domestic banks responding for government home-purchase category; not loan-weighted",
      licenseState: "FEDERAL_PUBLIC_DATA",
      allowedRawHashes: [
        "f792defe03173304ebc4f3839b36d7e6b4fd4fd8a6bd73577cace0989b94f24c"
      ],
      sourceUrls: [
        "https://www.federalreserve.gov/data/sloos/sloos-202410-table-1.htm"
      ],
      measurementDefinition: "Government home-purchase standards and demand respondent counts; refinancing excluded",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "Credit publisher, dataset, period and fetch vintage; no logos/endorsement; third-party content excluded"
    },
    MY_CPI: {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      unit: "index_2010_100",
      frequency: "MONTHLY",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      licenseState: "CC_BY_4_0",
      allowedRawHashes: [
        "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae"
      ],
      sourceUrls: [
        "https://storage.dosm.gov.my/cpi/cpi_2d.csv"
      ],
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "DOSM \xB7 CC BY 4.0 \xB7 derived selection disclosed \xB7 https://creativecommons.org/licenses/by/4.0/"
    },
    MY_INCOME: {
      seriesId: "MY_INCOME",
      countryCode: "MYS",
      unit: "MYR_per_month",
      frequency: "SURVEY_REFERENCE_YEAR",
      populationOrInstitutionCoverage: "Citizen households; nominal gross median monthly household income",
      licenseState: "CC_BY_4_0",
      allowedRawHashes: [
        "f586d78dd004f7002fb59bdcfdce697d81ecfdb67bb2cd72462ecf0a072345b5"
      ],
      sourceUrls: [
        "https://api.data.gov.my/data-catalogue?id=hh_income&limit=100"
      ],
      measurementDefinition: "Survey-reference-year nominal gross median MONTHLY income level, not monthly observations",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "DOSM \xB7 CC BY 4.0 \xB7 derived selection disclosed \xB7 https://creativecommons.org/licenses/by/4.0/"
    },
    MY_COHORT: {
      seriesId: "MY_COHORT",
      countryCode: "MYS",
      unit: "matched_application_count",
      frequency: "COHORT",
      populationOrInstitutionCoverage: "Same applications and outcomes with aligned product, period and institution coverage",
      licenseState: "DEFINITION_ONLY",
      allowedRawHashes: [],
      sourceUrls: [],
      measurementDefinition: "MY_COHORT",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "No numeric data admitted"
    },
    MECHANISM: {
      seriesId: "MECHANISM",
      countryCode: "GLOBAL",
      unit: "not_applicable",
      frequency: "NOT_APPLICABLE",
      populationOrInstitutionCoverage: "General conditional mechanism; not local empirical observation",
      licenseState: "PHIOS_PUBLIC_EXPLANATION",
      allowedRawHashes: [],
      sourceUrls: [],
      measurementDefinition: "MECHANISM",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "No numeric data admitted"
    },
    COMPARISON: {
      seriesId: "COMPARISON",
      countryCode: "GLOBAL",
      unit: "not_comparable",
      frequency: "NOT_APPLICABLE",
      populationOrInstitutionCoverage: "No harmonised international mortgage approval cohort",
      licenseState: "DEFINITION_ONLY",
      allowedRawHashes: [],
      sourceUrls: [],
      measurementDefinition: "COMPARISON",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "No numeric data admitted"
    }
  },
  explanations: {
    "zh-Hans": {
      text: "\u6587\u660E\u7ED3\u6784\u6700\u7EC8\u4F1A\u8FDB\u5165\u7A7A\u6C14\u3001\u4F4F\u623F\u3001\u4EA4\u901A\u3001\u5DE5\u4F5C\u3001\u6536\u5165\u4E0E\u751F\u6D3B\u6210\u672C\u3002\u751F\u6D3B\u73AF\u5883\u51B3\u5B9A\u65E5\u5E38\u57FA\u7840\u6761\u4EF6\uFF0C\u5C31\u4E1A\u628A\u4E2A\u4EBA\u63A5\u5165\u793E\u4F1A\u8D44\u6E90\u4E0E\u804C\u4E1A\u8DEF\u5F84\uFF0C\u6536\u5165\u4E0E\u5FC5\u8981\u6210\u672C\u4E4B\u95F4\u7684\u4F59\u91CF\u5219\u5F71\u54CD\u5BB6\u5EAD\u7F13\u51B2\u548C\u8F6C\u6362\u80FD\u529B\u3002",
      canonicalUrl: "https://getphios.com/articles/book6-environment-work-income?locale=zh-Hans#article-body",
      sourcePath: "/content/knowledge/public/successors/book6-publication-v1/visual-articles/zh-Hans/book6-environment-work-income.json",
      rawArtifactHash: "66222b7a3a4ab886e1c154511e49a87ea1a7fc960ef79c6915388fa3325f9789",
      locator: "/sections/0/blocks/0",
      sourceVersion: "1.0.0",
      publishedAt: "2026-09-24",
      kind: "PHIOS_PUBLISHED_INTERPRETATION_NOT_STATISTICAL_FACT"
    },
    en: {
      text: "Civilizational structures eventually enter daily life through air, housing, transport, work, income and living costs. Living environment shapes basic conditions, employment connects people to resources and career paths, and the margin between income and necessary costs affects household buffers and capacity to change.",
      canonicalUrl: "https://getphios.com/articles/book6-environment-work-income?locale=en#article-body",
      sourcePath: "/content/knowledge/public/successors/book6-publication-v1/visual-articles/en/book6-environment-work-income.json",
      rawArtifactHash: "d41e4df032036e4f35901e1eb7b66990fd168a4385100b5be0d4e6ab7165ebe2",
      locator: "/sections/0/blocks/0",
      sourceVersion: "1.0.0",
      publishedAt: "2026-09-24",
      kind: "PHIOS_PUBLISHED_INTERPRETATION_NOT_STATISTICAL_FACT"
    }
  },
  mechanismSources: [
    {
      sourceUrl: "https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-fixed-rate-and-adjustable-rate-mortgage-arm-loan-en-100/",
      sourcePublisher: "CFPB",
      type: "OFFICIAL_GENERAL_EXPLANATION_NOT_MY_LEGAL_ADVICE",
      readAt: "2026-10-20T04:14:27.952570+00:00"
    },
    {
      sourceUrl: "https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-mortgage-interest-rate-and-an-apr-en-135/",
      sourcePublisher: "CFPB",
      type: "OFFICIAL_GENERAL_EXPLANATION",
      readAt: "2026-10-20T04:14:27.952570+00:00"
    }
  ]
};

// content/world/world-evidence-observations-v1.json
var world_evidence_observations_v1_default = {
  contractVersion: "WORLD_EVIDENCE_P1_V1",
  vintage: "2026-10-20_GATE2C_PINNED",
  observations: [
    {
      seriesId: "US_HMDA",
      countryCode: "USA",
      value: 161054,
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      periodStart: "2024-01-01",
      periodEnd: "2024-12-31",
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      sourcePublisher: "FFIEC / CFPB",
      sourceDataset: "hmda-aggregate-2024",
      sourceUrl: "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2024&loan_purposes=1&actions_taken=1,2,3",
      observationPeriod: "2024",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.040868+00:00",
      sourceVersion: "SHA256:439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
      rawArtifactHash: "439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
      rawLocator: "data[action_taken=2].count",
      transformationId: "identity",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      actionCode: 2
    },
    {
      seriesId: "US_HMDA",
      countryCode: "USA",
      value: 623942,
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      periodStart: "2024-01-01",
      periodEnd: "2024-12-31",
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      sourcePublisher: "FFIEC / CFPB",
      sourceDataset: "hmda-aggregate-2024",
      sourceUrl: "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2024&loan_purposes=1&actions_taken=1,2,3",
      observationPeriod: "2024",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.040868+00:00",
      sourceVersion: "SHA256:439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
      rawArtifactHash: "439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
      rawLocator: "data[action_taken=3].count",
      transformationId: "identity",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      actionCode: 3
    },
    {
      seriesId: "US_HMDA",
      countryCode: "USA",
      value: 3534113,
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      periodStart: "2024-01-01",
      periodEnd: "2024-12-31",
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      sourcePublisher: "FFIEC / CFPB",
      sourceDataset: "hmda-aggregate-2024",
      sourceUrl: "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2024&loan_purposes=1&actions_taken=1,2,3",
      observationPeriod: "2024",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.040868+00:00",
      sourceVersion: "SHA256:439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
      rawArtifactHash: "439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
      rawLocator: "data[action_taken=1].count",
      transformationId: "identity",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      actionCode: 1
    },
    {
      seriesId: "US_HMDA",
      countryCode: "USA",
      value: 3592033,
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      sourcePublisher: "FFIEC / CFPB",
      sourceDataset: "hmda-aggregate-2025",
      sourceUrl: "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2025&loan_purposes=1&actions_taken=1,2,3",
      observationPeriod: "2025",
      publishedAt: null,
      retrievedAt: "2026-10-20T03:02:25.807207+00:00",
      sourceVersion: "SHA256:a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93",
      rawArtifactHash: "a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93",
      rawLocator: "data[action_taken=1].count",
      transformationId: "identity",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      actionCode: 1
    },
    {
      seriesId: "US_HMDA",
      countryCode: "USA",
      value: 158865,
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      sourcePublisher: "FFIEC / CFPB",
      sourceDataset: "hmda-aggregate-2025",
      sourceUrl: "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2025&loan_purposes=1&actions_taken=1,2,3",
      observationPeriod: "2025",
      publishedAt: null,
      retrievedAt: "2026-10-20T03:02:25.807207+00:00",
      sourceVersion: "SHA256:a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93",
      rawArtifactHash: "a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93",
      rawLocator: "data[action_taken=2].count",
      transformationId: "identity",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      actionCode: 2
    },
    {
      seriesId: "US_HMDA",
      countryCode: "USA",
      value: 607818,
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      sourcePublisher: "FFIEC / CFPB",
      sourceDataset: "hmda-aggregate-2025",
      sourceUrl: "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2025&loan_purposes=1&actions_taken=1,2,3",
      observationPeriod: "2025",
      publishedAt: null,
      retrievedAt: "2026-10-20T03:02:25.807207+00:00",
      sourceVersion: "SHA256:a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93",
      rawArtifactHash: "a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93",
      rawLocator: "data[action_taken=3].count",
      transformationId: "identity",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      actionCode: 3
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 131.4,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-01",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-01-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 132.1,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-02-01",
      periodEnd: "2024-02-29",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-02",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-02-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 132.2,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-03-01",
      periodEnd: "2024-03-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-03",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-03-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 132.4,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-04-01",
      periodEnd: "2024-04-30",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-04",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-04-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 132.8,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-05-01",
      periodEnd: "2024-05-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-05",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-05-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-06-01",
      periodEnd: "2024-06-30",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-06",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-06-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133.1,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-07-01",
      periodEnd: "2024-07-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-07",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-07-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133.2,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-08-01",
      periodEnd: "2024-08-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-08",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-08-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133.2,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-09-01",
      periodEnd: "2024-09-30",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-09",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-09-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133.4,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-10-01",
      periodEnd: "2024-10-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-10",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-10-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133.3,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-11-01",
      periodEnd: "2024-11-30",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-11",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-11-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133.4,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-12-01",
      periodEnd: "2024-12-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-12",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-12-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_INCOME",
      countryCode: "MYS",
      value: 6338,
      unit: "MYR_per_month",
      frequency: "SURVEY_REFERENCE_YEAR",
      periodStart: "2022-01-01",
      periodEnd: "2022-12-31",
      measurementDefinition: "Survey-reference-year nominal gross median MONTHLY income level, not monthly observations",
      populationOrInstitutionCoverage: "Citizen households; nominal gross median monthly household income",
      sourcePublisher: "DOSM",
      sourceDataset: "my-income",
      sourceUrl: "https://api.data.gov.my/data-catalogue?id=hh_income&limit=100",
      observationPeriod: "2022",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.039254+00:00",
      sourceVersion: "SHA256:f586d78dd004f7002fb59bdcfdce697d81ecfdb67bb2cd72462ecf0a072345b5",
      rawArtifactHash: "f586d78dd004f7002fb59bdcfdce697d81ecfdb67bb2cd72462ecf0a072345b5",
      rawLocator: "income_median; date=2022-01-01",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_INCOME",
      countryCode: "MYS",
      value: 7017,
      unit: "MYR_per_month",
      frequency: "SURVEY_REFERENCE_YEAR",
      periodStart: "2024-01-01",
      periodEnd: "2024-12-31",
      measurementDefinition: "Survey-reference-year nominal gross median MONTHLY income level, not monthly observations",
      populationOrInstitutionCoverage: "Citizen households; nominal gross median monthly household income",
      sourcePublisher: "DOSM",
      sourceDataset: "my-income",
      sourceUrl: "https://api.data.gov.my/data-catalogue?id=hh_income&limit=100",
      observationPeriod: "2024",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.039254+00:00",
      sourceVersion: "SHA256:f586d78dd004f7002fb59bdcfdce697d81ecfdb67bb2cd72462ecf0a072345b5",
      rawArtifactHash: "f586d78dd004f7002fb59bdcfdce697d81ecfdb67bb2cd72462ecf0a072345b5",
      rawLocator: "income_median; date=2024-01-01",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "US_SLOOS",
      countryCode: "USA",
      value: 1,
      unit: "respondent_banks",
      frequency: "QUARTERLY_SURVEY",
      periodStart: "2024-07-01",
      periodEnd: "2024-09-30",
      measurementDefinition: "Government home-purchase standards and demand respondent counts; refinancing excluded",
      populationOrInstitutionCoverage: "49 domestic banks responding for government home-purchase category; not loan-weighted",
      sourcePublisher: "Federal Reserve Board",
      sourceDataset: "fed-table-corrected",
      sourceUrl: "https://www.federalreserve.gov/data/sloos/sloos-202410-table-1.htm",
      observationPeriod: "2024-Q3",
      publishedAt: "2024-11-12",
      retrievedAt: "2026-10-20T02:50:53.039787+00:00",
      sourceVersion: "SHA256:f792defe03173304ebc4f3839b36d7e6b4fd4fd8a6bd73577cace0989b94f24c",
      rawArtifactHash: "f792defe03173304ebc4f3839b36d7e6b4fd4fd8a6bd73577cace0989b94f24c",
      rawLocator: "13. Over / B. Credit standards / all respondent counts",
      transformationId: "respondent_count",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      surveyMeasure: "standards",
      oppositeCount: 0,
      respondentCount: 49,
      questionCode: "Q13B"
    },
    {
      seriesId: "US_SLOOS",
      countryCode: "USA",
      value: 5,
      unit: "respondent_banks",
      frequency: "QUARTERLY_SURVEY",
      periodStart: "2024-07-01",
      periodEnd: "2024-09-30",
      measurementDefinition: "Government home-purchase standards and demand respondent counts; refinancing excluded",
      populationOrInstitutionCoverage: "49 domestic banks responding for government home-purchase category; not loan-weighted",
      sourcePublisher: "Federal Reserve Board",
      sourceDataset: "fed-table-corrected",
      sourceUrl: "https://www.federalreserve.gov/data/sloos/sloos-202410-table-1.htm",
      observationPeriod: "2024-Q3",
      publishedAt: "2024-11-12",
      retrievedAt: "2026-10-20T02:50:53.039787+00:00",
      sourceVersion: "SHA256:f792defe03173304ebc4f3839b36d7e6b4fd4fd8a6bd73577cace0989b94f24c",
      rawArtifactHash: "f792defe03173304ebc4f3839b36d7e6b4fd4fd8a6bd73577cace0989b94f24c",
      rawLocator: "14. Apart / B. Demand / all respondent counts",
      transformationId: "respondent_count",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      surveyMeasure: "demand",
      oppositeCount: 10,
      respondentCount: 49,
      questionCode: "Q14B"
    }
  ],
  limits: [
    "Historical fetch vintage, not real-time or frozen annual HMDA Snapshot",
    "Original per-observation publication/revision dates incomplete",
    "No matched MY application cohort counts; amounts cannot measure individual approval probability"
  ]
};

// functions/_lib/world-evidence.js
var EVIDENCE_COUNTRIES = Object.freeze(["USA", "MYS", "CHN", "JPN", "GBR", "EA", "GLOBAL"]);
function evidenceRequest(input) {
  if (Object.keys(input).some((k) => !["country", "series", "period"].includes(k)) || Object.values(input).some((v) => typeof v !== "string" || v.length > 40)) throw Error("PUBLIC_ENUMS_ONLY");
  if (!EVIDENCE_COUNTRIES.includes(input.country) || !world_evidence_series_v1_default.series[input.series] || !(/^(?:19\d{2}|20\d{2}|2100)(?:-Q[1-4])?$/.test(input.period) || input.period === "GENERAL")) throw Error("EVIDENCE_INPUT_INVALID");
  return { country: input.country, series: input.series, period: input.period };
}
function observationQuality(row, definition, query) {
  if (row.countryCode !== query.country || row.seriesId !== query.series || !row.observationPeriod.startsWith(query.period)) return "DEFINITION_MISMATCH";
  if (row.unit !== definition.unit || row.frequency !== definition.frequency || row.populationOrInstitutionCoverage !== definition.populationOrInstitutionCoverage || row.measurementDefinition !== definition.measurementDefinition) return "INCOMPARABLE";
  if (!["FEDERAL_PUBLIC_DATA", "CC_BY_4_0"].includes(row.licenseState) || row.licenseState !== definition.licenseState) return "NO_ACCESS";
  if (!definition.allowedRawHashes.includes(row.rawArtifactHash) || !definition.sourceUrls.includes(row.sourceUrl)) return "SOURCE_ERROR";
  if (row.value === null) return row.qualityState === "OBSERVED" ? "SOURCE_ERROR" : row.qualityState;
  if (typeof row.value !== "number" || !Number.isFinite(row.value) || row.value < 0) return "SOURCE_ERROR";
  if (!["OBSERVED", "NO_RELEASE", "NO_ACCESS", "MISSING_PERIOD", "DEFINITION_MISMATCH", "INCOMPARABLE", "SOURCE_ERROR", "STALE"].includes(row.qualityState)) return "SOURCE_ERROR";
  return row.qualityState;
}
function calculateHmda(rows) {
  const counts = Object.fromEntries(rows.map((r) => [r.actionCode, r.value]));
  if (rows.length !== 3 || Object.keys(counts).length !== 3 || ![1, 2, 3].every((k) => Number.isSafeInteger(counts[k]) && counts[k] >= 0)) throw Error("ACTION_COUNTS_INVALID");
  const denominator = counts[1] + counts[2] + counts[3];
  if (!denominator || !Number.isSafeInteger(denominator)) throw Error("ZERO_OR_UNSAFE_DENOMINATOR");
  return { metric: "denial_share_in_defined_hmda_scope", value: counts[3] / denominator, unit: "share", numerator: counts[3], denominator, formula: "action3 / (action1 + action2 + action3)", actionCounts: counts, loanPurpose: 1, excludedActions: [4, 5, 6, 7, 8], population: "Reported home-purchase action records; not unique applicants or a matched application cohort" };
}
function readWorldEvidence(input, { definitions = world_evidence_series_v1_default, snapshots = world_evidence_observations_v1_default, now = () => (/* @__PURE__ */ new Date()).toISOString() } = {}) {
  const query = evidenceRequest(input), definition = definitions.series[query.series];
  const result = { ...query, state: "OBSERVED", definition, observations: [], derivedMetrics: [], explanations: definitions.explanations, mechanismSources: definitions.mechanismSources, version: snapshots.vintage, computedAt: now(), providerUsed: false, accountDataUsed: false, limits: snapshots.limits };
  if (!definition) return { ...result, state: "SOURCE_ERROR" };
  if (definition.countryCode !== query.country) return { ...result, state: "DEFINITION_MISMATCH" };
  if (["MY_COHORT", "MECHANISM", "COMPARISON"].includes(query.series)) return { ...result, state: query.series === "COMPARISON" ? "INCOMPARABLE" : "NO_RELEASE", nullReason: query.series === "MY_COHORT" ? "MATCHED_APPLICATION_COHORT_COUNTS_UNAVAILABLE" : query.series === "COMPARISON" ? "HARMONISED_DENOMINATOR_UNAVAILABLE" : "GENERAL_EXPLANATION_ONLY" };
  const rows = snapshots.observations.filter((r) => r.seriesId === query.series && r.observationPeriod.startsWith(query.period));
  if (!rows.length) return { ...result, state: "MISSING_PERIOD" };
  for (const row of rows) {
    const quality = observationQuality(row, definition, query);
    if (quality !== "OBSERVED") return { ...result, state: quality, nullReason: "EVIDENCE_QUALITY_GATE" };
  }
  if (query.series === "US_HMDA" && (JSON.stringify(definition.filters?.actions_taken) !== "[1,2,3]" || JSON.stringify(definition.filters?.loan_purposes) !== "[1]")) return { ...result, state: "DEFINITION_MISMATCH" };
  result.observations = rows;
  try {
    if (query.series === "US_HMDA") result.derivedMetrics = [calculateHmda(rows)];
    if (query.series === "US_SLOOS") result.derivedMetrics = rows.map((r) => {
      if (!Number.isSafeInteger(r.respondentCount) || r.respondentCount <= 0 || !Number.isSafeInteger(r.oppositeCount) || r.oppositeCount < 0 || r.value + r.oppositeCount > r.respondentCount) throw Error("SURVEY_COUNTS_INVALID");
      return { metric: r.surveyMeasure === "standards" ? "net_tightening" : "net_stronger_demand", questionCode: r.questionCode, value: (r.value - r.oppositeCount) / r.respondentCount * 100, unit: "percent_respondent_banks", numerator: r.value - r.oppositeCount, denominator: r.respondentCount, formula: r.surveyMeasure === "standards" ? "(tightened - eased) / respondents * 100" : "(stronger - weaker) / respondents * 100", positiveCount: r.value, oppositeCount: r.oppositeCount };
    });
  } catch {
    return { ...result, state: "SOURCE_ERROR", observations: [], derivedMetrics: [], nullReason: "DERIVATION_INVALID" };
  }
  return result;
}

// functions/api/world-observations.js
async function onRequestGet({ request }) {
  try {
    const u = new URL(request.url);
    if (u.search.length > 300 || [...u.searchParams.keys()].some((k) => u.searchParams.getAll(k).length !== 1)) throw Error("DUPLICATE_OR_LONG_FIELD");
    if (u.searchParams.has("series")) {
      const evidence = readWorldEvidence(Object.fromEntries(u.searchParams));
      return Response.json({ ok: !["SOURCE_ERROR", "NO_ACCESS"].includes(evidence.state), evidence }, { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
    }
    const result = await readWorldBankObservation(Object.fromEntries(u.searchParams));
    return Response.json({ ok: !["SERVICE_ERROR", "TIMEOUT", "INVALID_RESPONSE", "IDENTITY_MISMATCH", "UNIT_MISMATCH"].includes(result.state), observation: result }, { headers: { "cache-control": "public,max-age=300", "x-content-type-options": "nosniff" } });
  } catch {
    return Response.json({ ok: false, error: "PUBLIC_OBSERVATION_INPUT_INVALID" }, { status: 400 });
  }
}
var onRequest = (context) => context.request.method === "GET" ? onRequestGet(context) : new Response(null, { status: 405, headers: { Allow: "GET" } });

// <stdin>
var stdin_default = { fetch(request) {
  return onRequest({ request });
} };
export {
  stdin_default as default
};
