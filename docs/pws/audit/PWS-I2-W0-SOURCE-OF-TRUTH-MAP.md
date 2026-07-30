# PWS-I2-W0 Source-of-Truth Map

| Scope | Current authority | PWS-I2 treatment |
| --- | --- | --- |
| Core Journey Contracts, Schemas and Versions | `functions/runtime/registry` | Reference only |
| Runtime Persistence | `functions/runtime/persistence` | Reuse boundary; do not replace |
| Executable D1 Migration history | `content/registry/runtime-migrations.json` + `db/migrations` | Immutable history; append only through an authorised step |
| Canonical Knowledge Nodes and Supporting Questions | `content/knowledge/registry` | PKR remains owner |
| PWS terminology and objects | `docs/pws/contracts` | Consume frozen PWS-I1 |
| Book Product execution | `functions/commerce/book-product-registry.js` | Preserve until W5 selects canonical Product/Offer source |
| Book Product static record | `content/registry/book-products.json` | Legacy mirror/configuration; reconcile in W5 |
| Professional Service definitions | `content/registry/professional-service-catalog.json` and related boundary/level files | Reconcile and register in W4 |
| Offer and revenue definitions | `content/registry/pws-w1a-offer-catalog.json` and related pricing records | Reconcile and register in W5 |
| Financial type validation | `functions/professional/financial/*-registry.js` | Preserve executable authority; reconcile static records in W7 |
| External Reader data | `knowledge/external-readers/registry` | Preserve data source |
| External Reader validation | `functions/professional/external-readers` | Preserve validator boundary |
| Acceptance and milestone records | `content/registry` files by owning check | Do not convert automatically into runtime Registry objects |
| Registry query/read model | Not yet present | Implement in W1 without merging page projections |

## Conflict rule

When two files describe the same concept, W0 records both sources but does not
choose by filename, recency or implementation convenience. The owning PWS-I2
step must identify the canonical write source, version and compatibility
adapter before any write path changes.
